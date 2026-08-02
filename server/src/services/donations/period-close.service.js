// Import as module objects (not destructured) so mock.method() stubs are honoured in tests.
const emailLib = require("../../lib/email");
const donorPeriodsRepo = require("../../data/donor-periods.repo");
const donorsRepo = require("../../data/donors.repo");
const allocationsRepo = require("../../data/allocations.repo");
const sessionsRepo = require("../../data/sessions.repo");

/**
 * The batching + mark-for-removal mechanism (spec: notification on 15th/EOM, remove by
 * next boundary).
 *
 * For every open donor_period whose `period_end` is on or before `today`:
 *  1. Load the donor + all allocations in that period.
 *  2. Filter to completed allocations that haven't been emailed yet.
 *  3. Send one email listing every completed session in this period.
 *  4. Stamp `email_sent_at = now` on those allocations — that starts the 14-day
 *     "marked for removal" clock the track-view display filter honours.
 *  5. Mark the donor_period `status='closed'`, `emailed_at = now`.
 *
 * Empty periods (no completed allocations, nothing to say) roll forward — the period
 * stays open, no email fires. PLAN.md §Phase B: "Empty periods never close or email."
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

    const sessionIds = [...new Set(completed.map((a) => a.session_id))];
    const sessions = await sessionsRepo.listByIds(sessionIds);
    const sessionsById = new Map(sessions.map((s) => [s.id, s]));

    const lines = completed.map((a) => {
      const s = sessionsById.get(a.session_id);
      if (!s) return `  · session ${a.session_id} (details unavailable)`;
      const attended = s.attendance_count == null ? "headcount pending" : `${s.attendance_count} attended`;
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

    // Stamp email_sent_at on the notified allocations — starts the 14-day removal clock.
    for (const a of completed) {
      await allocationsRepo.updateAllocation(a.id, { email_sent_at: new Date().toISOString() });
    }

    await donorPeriodsRepo.updatePeriod(period.id, {
      status: "closed",
      emailed_at: new Date().toISOString(),
    });

    closed++;
    emailed++;
  }

  return { processed: due.length, closed, emailed, skipped_empty: skippedEmpty };
}

// Minimal donor fetch — donorsRepo has no findById; inline to avoid a new repo method.
const { getSupabase } = require("../../config/supabase");
async function fetchDonor(id) {
  const { data, error } = await getSupabase()
    .from("donors")
    .select("id, email, full_name, access_token")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

module.exports = { closeReadyPeriods };
