// Import as module objects (not destructured) so mock.method() stubs are honoured in tests.
const emailLib = require("../../lib/email");
const donorPeriodsRepo = require("../../data/donor-periods.repo");
const donorsRepo = require("../../data/donors.repo");
const allocationsRepo = require("../../data/allocations.repo");
const sessionsRepo = require("../../data/sessions.repo");

/** An allocation is terminal once it can produce no further news for the donor. */
const TERMINAL_STATUSES = new Set(["completed", "cancelled"]);

/**
 * The batching + mark-for-removal mechanism (spec: notification on 15th/EOM, remove by
 * next boundary).
 *
 * For every open donor_period whose `period_end` is on or before `today`:
 *  1. Load the donor + all allocations in that period — across **every** donation the donor
 *     made into this edition, since `findOrOpenForDonorWindow` files them all under one
 *     period per (donor, window).
 *  2. Filter to completed allocations that haven't been emailed yet.
 *  3. Send one email listing each completed **session** once (see the dedupe note below).
 *  4. Stamp `email_sent_at = now` on those allocations — that starts the 14-day
 *     "marked for removal" clock the track-view display filter honours.
 *  5. Close the period **only when nothing is still outstanding**; otherwise leave it open
 *     so the next boundary sends a follow-up.
 *
 * Empty periods (no completed allocations, nothing to say) roll forward — the period
 * stays open, no email fires. PLAN.md §Phase B: "Empty periods never close or email."
 *
 * **The period keeps sending until every allocation is terminal.** Closing on the first
 * email would strand anything not yet marked attended: `listDueForClose` only returns
 * periods with `status='open'`, so a period closed while two of five sessions were still
 * pending would never mention those two again, and the donor would be told their gift
 * supported three sessions when it supported five. The `!email_sent_at` filter is what
 * makes repeat runs safe — a session already reported is never reported twice.
 *
 * Idempotent: an allocation already carrying `email_sent_at` is skipped. Re-running the
 * job on the same day is a no-op.
 *
 * @param {{ today?: Date }} [opts] Injectable for tests.
 * @returns {Promise<{ processed: number, closed: number, emailed: number, skipped_empty: number }>}
 */
async function closeReadyPeriods(opts = {}) {
  const today = opts.today ?? new Date();
  const due = await donorPeriodsRepo.listDueForClose(today);

  let closed = 0;
  let emailed = 0;
  let skippedEmpty = 0;

  for (const period of due) {
    const allocations = await allocationsRepo.listByPeriod(period.id);
    const completed = allocations.filter(
      (a) => a.status === "completed" && !a.email_sent_at,
    );

    if (completed.length === 0) {
      // Empty period — roll forward, do not close, do not email.
      skippedEmpty++;
      continue;
    }

    // Load donor + sessions for the email body.
    const donorRow = await donorsRepo.findById(period.donor_id);
    if (!donorRow) continue;

    // One line per SESSION, not per allocation. A donor who gave twice into the same
    // edition can hold two allocations pointing at the same session — mapping over
    // `completed` would list that session twice and read as though it ran twice.
    // Deduped on `session_id`, then ordered by date so the email reads chronologically.
    const sessionIds = [...new Set(completed.map((a) => a.session_id))];
    const sessions = await sessionsRepo.listByIds(sessionIds);
    const sessionsById = new Map(sessions.map((s) => [s.id, s]));

    const lines = sessionIds
      .map((id) => sessionsById.get(id) ?? { id })
      .sort((a, b) => String(a.starts_at ?? "").localeCompare(String(b.starts_at ?? "")))
      .map((s) => {
        if (!s.starts_at) return `  · session ${s.id} (details unavailable)`;
        const attended =
          s.attendance_count == null ? "headcount pending" : `${s.attendance_count} attended`;
        return `  · ${s.title_en || s.title_zh || "(untitled)"} — ${s.starts_at.slice(0, 10)} · ${attended}`;
      });

    await emailLib.sendEmail({
      to: donorRow.email,
      subject: `Update on your Love 21 support — period ${period.period_end}`,
      text:
        `Hello,\n\n` +
        `Your gift helped make these Love 21 sessions possible:\n\n` +
        `${lines.join("\n")}\n\n` +
        `See your full tracking page: /help/donate/track/${donorRow.access_token}\n\n` +
        `Thank you for supporting the Love 21 community.`,
    });

    // Stamp email_sent_at on the notified allocations — starts the 14-day removal clock,
    // and is what stops the next run reporting these sessions a second time.
    const sentAt = new Date().toISOString();
    for (const a of completed) {
      await allocationsRepo.updateAllocation(a.id, { email_sent_at: sentAt });
    }

    emailed++;

    // Anything still pending or planned means there is more to tell this donor, so the
    // period stays open and the next boundary sends a follow-up covering only what has
    // completed since. Close only once every allocation has reached a terminal state.
    const outstanding = allocations.filter((a) => !TERMINAL_STATUSES.has(a.status));

    await donorPeriodsRepo.updatePeriod(period.id, {
      ...(outstanding.length === 0 ? { status: "closed" } : {}),
      emailed_at: sentAt,
    });

    if (outstanding.length === 0) {
      closed++;
    }
  }

  return { processed: due.length, closed, emailed, skipped_empty: skippedEmpty };
}

module.exports = { closeReadyPeriods, TERMINAL_STATUSES };
