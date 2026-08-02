// Imported as module objects, not destructured, so `mock.method` stubs replace the property
// the caller actually reads.
const emailLib = require("../../lib/email");
const templates = require("../../lib/email-templates");
const allocationsRepo = require("../../data/allocations.repo");
const sessionsRepo = require("../../data/sessions.repo");
const donorsRepo = require("../../data/donors.repo");
const donationsRepo = require("../../data/donations.repo");
const {
  ELIGIBILITY_MIN_DAYS,
  ELIGIBILITY_MAX_DAYS,
} = require("./allocation.service");

/**
 * Runs when a session is marked completed: moves its allocations to `completed` and tells the
 * donors who paid for it, immediately.
 *
 * ── Why this exists ────────────────────────────────────────────────────────
 * Two separate gaps, closed together.
 *
 * **Nothing ever completed an allocation.** Recording attendance set `sessions.status` and
 * stopped there; `donation_allocations.status` stayed `pending` for ever. The only code that
 * could move it was the DEMO-ONLY `/api/admin/demo/advance-donation/:id` route. Since
 * `period-close.service.js` emails `allocations.filter(a => a.status === "completed")`, the
 * 15th/EOM update reported an always-empty set and periods could never close. Donors received
 * nothing, and nothing failed loudly.
 *
 * **The batch cadence is the wrong grain for this news.** "What happened this fortnight"
 * belongs on a boundary; "the class you paid for just took place" belongs on the day. Waiting
 * up to two weeks to say it costs the connection between the gift and the thing it bought.
 *
 * ── Relationship to the 15th/EOM batch ─────────────────────────────────────
 * The batch is the specified cadence and always runs. The per-session email is **opt-in** via
 * `SESSION_COMPLETION_EMAILS=on` and defaults to off.
 *
 * When it is on, this stamps `email_sent_at` on the allocations it reports — the same flag
 * `period-close.service.js` uses to skip already-reported rows — so the batch becomes a
 * summary of whatever this path missed rather than a duplicate. When it is off, nothing is
 * stamped and the batch reports everything, which is the original design.
 *
 * Completing the allocation is not behind the flag. See `perSessionEmailsEnabled`.
 *
 * ── Failure posture ────────────────────────────────────────────────────────
 * The status write happens first and is what matters; email is best-effort. An admin
 * recording attendance must never see their save fail because a mail server was down, and the
 * unstamped `email_sent_at` means the batch will pick it up later.
 */

/** Statuses that should not be advanced — already terminal. */
const TERMINAL = new Set(["completed", "cancelled"]);

/**
 * Per-session emails are **off by default**: the specified cadence is the 15th/EOM batch, and
 * one message per completed session is a different promise to make to a donor. Set
 * `SESSION_COMPLETION_EMAILS=on` to enable it.
 *
 * The flag gates the **email only** — never the status write above it. Those are two separate
 * jobs that happen to share a trigger:
 *
 *   - completing the allocation is a **data correction**. Nothing else in the codebase did it,
 *     so `period-close.service.js` filtered `status === "completed"` over a set that was always
 *     empty and the batch email reported nothing. Gating that behind a flag would restore the
 *     original silence and make this switch look like it turns donor updates off entirely.
 *   - emailing immediately is a **cadence choice**, and the one this flag exists for.
 *
 * With it off, allocations still complete and `email_sent_at` stays null, which is exactly the
 * state the 15th/EOM batch looks for. Off is therefore the plan's behaviour, working.
 */
function perSessionEmailsEnabled() {
  return (process.env.SESSION_COMPLETION_EMAILS || "off").toLowerCase() === "on";
}

/**
 * @param {string} sessionId
 * @param {{ clientOrigin?: string }} [opts]
 * @returns {Promise<{ session_id: string, allocations_completed: number,
 *   donors_notified: number, errors: string[] }>}
 */
async function onSessionCompleted(sessionId, opts = {}) {
  const clientOrigin = opts.clientOrigin || process.env.CLIENT_ORIGIN || "http://localhost:5173";
  const result = { session_id: sessionId, allocations_completed: 0, donors_notified: 0, errors: [] };

  const allocations = await allocationsRepo.listBySession(sessionId);
  const live = allocations.filter((a) => !TERMINAL.has(a.status));
  if (live.length === 0) return result;

  const session = await sessionsRepo.findById(sessionId);
  if (!session) {
    result.errors.push(`session ${sessionId} not found`);
    return result;
  }

  // Status first: this is the durable half. If the process dies after this and before the
  // emails, the 15th/EOM batch still reports these sessions because email_sent_at is unset.
  for (const allocation of live) {
    await allocationsRepo.updateAllocation(allocation.id, { status: "completed" });
    result.allocations_completed++;
  }

  if (!perSessionEmailsEnabled()) {
    // Allocations are completed and unstamped, so the 15th/EOM batch will report them. This is
    // the specified behaviour, not a degraded one.
    result.emails_disabled = true;
    return result;
  }

  // One email per DONOR, not per allocation. A donor who gave twice into the same session
  // holds two allocations on it, and two identical "your session happened" emails reads as a
  // bug — the same defect that put duplicate rows on the tracking page.
  const byDonor = new Map();
  for (const allocation of live) {
    if (!allocation.donor_id) continue;
    if (!byDonor.has(allocation.donor_id)) byDonor.set(allocation.donor_id, []);
    byDonor.get(allocation.donor_id).push(allocation);
  }

  const sentAt = new Date().toISOString();

  for (const [donorId, theirAllocations] of byDonor) {
    try {
      const donor = await donorsRepo.findById(donorId);
      if (!donor?.email) continue;

      // Withheld for a donor who opted out of tracking, exactly as the thank-you gates it.
      const trackingUrl =
        donor.tracking_opt_in === false || !donor.access_token
          ? null
          : `${clientOrigin}/give/track/${donor.access_token}`;

      const rendered = templates.renderSessionUpdate(donor, session, trackingUrl);
      await emailLib.sendEmail({
        to: donor.email,
        subject: rendered.subject,
        text: rendered.text,
        html: rendered.html,
      });

      // Stamped only on success, so a failed send falls through to the batch rather than
      // being silently marked as told.
      for (const allocation of theirAllocations) {
        await allocationsRepo.updateAllocation(allocation.id, { email_sent_at: sentAt });
      }
      result.donors_notified++;
    } catch (error) {
      // Never rethrow: an admin recording attendance must not have their save fail because a
      // mail server was down. Logged rather than swallowed — a donor silently not told is the
      // failure this whole service exists to fix.
      console.error(`session ${sessionId}: donor ${donorId} update failed — ${error.message}`);
      result.errors.push(`${donorId}: ${error.message}`);
    }
  }

  return result;
}

/**
 * Runs when a session is cancelled: moves every gift still riding on it to another session.
 *
 * The rule, stated by donation state rather than session state:
 *
 *   pending  + session completed  → allocation completes    (the donor funded a real class)
 *   pending  + session cancelled  → allocation MOVES        (the gift funds something else)
 *   pending  + session scheduled  → allocation stays pending
 *   terminal + anything           → untouched
 *
 * A cancelled class must not simply mark the gift `cancelled`. The donor gave money to fund
 * sessions, and a session not running is our problem to solve, not theirs — recording their
 * gift as having paid for something that never happened is the one outcome that is plainly
 * wrong. Cancelling the allocation is the fallback for when there is genuinely nothing left to
 * move it to.
 *
 * Without this, a cancelled session left its allocations `pending` for ever: the donor's
 * period could never close (`pending` is not terminal), their tracking page counted a
 * cancelled class under "sessions on the way" while the card beside it read *Cancelled*, and
 * the money was stranded against something that would never run.
 *
 * @param {string} sessionId
 * @returns {Promise<{ session_id: string, reallocated: number, cancelled: number,
 *   moves: Array<{ allocation_id: string, to: string }> }>}
 */
async function onSessionCancelled(sessionId) {
  const result = { session_id: sessionId, reallocated: 0, cancelled: 0, moves: [] };

  const allocations = await allocationsRepo.listBySession(sessionId);
  const live = allocations.filter((a) => !TERMINAL.has(a.status));
  if (live.length === 0) return result;

  for (const allocation of live) {
    const replacement = await findReplacement(allocation, sessionId);

    if (!replacement) {
      // Nothing eligible left. Terminal so the donor's period can close rather than hanging
      // open for ever on a class that will never run.
      await allocationsRepo.updateAllocation(allocation.id, { status: "cancelled" });
      result.cancelled++;
      continue;
    }

    // Status stays `pending` — the gift has not been spent, it has been redirected. Only the
    // session it points at changes, so the tracking page picks the new one up with no further
    // work: it renders whatever sessions the donor's allocations reference.
    await allocationsRepo.updateAllocation(allocation.id, { session_id: replacement.id });
    result.reallocated++;
    result.moves.push({ allocation_id: allocation.id, to: replacement.id });
  }

  return result;
}

/**
 * Picks the session a stranded gift should move to.
 *
 * Same eligibility window the original allocation used — `[donation +7d, +30d]` — so a
 * redirected gift lands somewhere it could legitimately have gone in the first place, rather
 * than on whatever happens to be next in the calendar.
 *
 * Sessions the donor already funds are excluded. Two allocations on one session is a state the
 * allocator can already produce and the display copes with, but *creating* it here would take
 * a donor who funded three distinct classes and silently collapse them to two.
 */
async function findReplacement(allocation, cancelledSessionId) {
  const donation = await donationsRepo.findById(allocation.donation_id);
  if (!donation?.created_at) return null;

  const donatedAt = new Date(donation.created_at);
  const windowStart = new Date(donatedAt.getTime() + ELIGIBILITY_MIN_DAYS * 86_400_000);
  const windowEnd = new Date(donatedAt.getTime() + ELIGIBILITY_MAX_DAYS * 86_400_000);

  // Over-fetch: the donor's existing sessions are filtered out below, so asking for one would
  // return a session they already hold and yield no replacement.
  const candidates = await sessionsRepo.listEligibleForAllocation({
    windowStart,
    windowEnd,
    limit: 25,
  });

  const alreadyFunded = new Set(
    (await allocationsRepo.listByDonor(allocation.donor_id)).map((a) => a.session_id),
  );

  return (
    candidates.find((s) => s.id !== cancelledSessionId && !alreadyFunded.has(s.id)) ?? null
  );
}

module.exports = {
  onSessionCompleted,
  onSessionCancelled,
  perSessionEmailsEnabled,
  TERMINAL,
};
