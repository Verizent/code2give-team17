#!/usr/bin/env node
// Puts an existing volunteer on an event that has just finished, then marks them attended —
// which is what makes the feedback form appear on /me and sends the email pointing at it.
//
//   npm run seed:attended-volunteer                        seeds for the default address
//   npm run seed:attended-volunteer you@example.com         seeds for yours
//   npm run seed:attended-volunteer you@example.com 3       and sets the hours logged
//
// ── Why a seeder rather than clicking through ──────────────────────────────
// The feedback form is gated on `signup.status === 'attended'` in both the UI
// (volunteer-profile.tsx) and the server (signup-feedback.service.js), and attendance can
// only be marked on an event that has happened. Nothing in the seeded data has both a real
// volunteer and a recently-finished event, so the state cannot be reached by signing up
// today — hence a seeder.
//
// The attendance write goes through `admin/attendance.service`, the same path the admin UI
// uses, so the thank-you email, its feedback link, and the badge evaluation all run exactly
// as they would in production rather than being simulated here.
//
// ── Email ──────────────────────────────────────────────────────────────────
// Delivery obeys EMAIL_MODE from server/.env. It is `log` there, which prints the email
// instead of sending it. To really send:
//
//   EMAIL_MODE=smtp npm run seed:attended-volunteer
//
// ── Safety ─────────────────────────────────────────────────────────────────
// Writes only: one `[seed]` opportunity in the past plus its linked session, and one signup
// for the named volunteer. The volunteer must already exist — this never creates one, so a
// typo'd address fails loudly instead of quietly seeding a stranger.

require("dotenv").config({ quiet: true });

const { getServiceClient } = require("../src/config/supabase");
const { normaliseEmail } = require("../src/lib/email");
const opportunitiesService = require("../src/services/admin/opportunities.service");
const attendanceService = require("../src/services/admin/attendance.service");

const DEFAULT_EMAIL = "mrichardsuryajaya@gmail.com";
const DEFAULT_HOURS = 3;

async function main() {
  const email = normaliseEmail(process.argv[2] || DEFAULT_EMAIL);
  const hours = Number(process.argv[3] || DEFAULT_HOURS);
  const db = getServiceClient();

  const { data: volunteer, error: lookupError } = await db
    .from("volunteers")
    .select("id, email, full_name, locale")
    .eq("email", email)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (!volunteer) {
    throw new Error(
      `No volunteer with email ${email}. This script attaches an existing volunteer to an ` +
        `event; it does not create people.`,
    );
  }
  console.log(`Volunteer: ${volunteer.full_name} <${volunteer.email}> (${volunteer.id})`);

  // Finished three hours ago: recent enough to read as "you were just here", far enough back
  // that marking attendance on it is not nonsense.
  const endedAt = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const startedAt = new Date(endedAt.getTime() - 2 * 60 * 60 * 1000);

  const { opportunity, session } = await opportunitiesService.createOpportunity({
    title_en: "[seed] Harbourfront morning walk",
    title_zh: "[seed] 海濱晨walk",
    description_en:
      "A gentle guided walk along the harbourfront with Love 21 members. Seeded event.",
    description_zh: "與Love 21會員沿海濱悠閒散步。測試活動。",
    location_en: "Tsim Sha Tsui Promenade",
    location_zh: "尖沙咀海濱長廊",
    programme: "fitness",
    starts_at: startedAt.toISOString(),
    ends_at: endedAt.toISOString(),
    capacity: 8,
    source: "internal",
  });
  console.log(`Opportunity: ${opportunity.id}`);
  console.log(`Linked session: ${session.id}`);

  const { data: signup, error: signupError } = await db
    .from("volunteer_signups")
    .insert({
      opportunity_id: opportunity.id,
      volunteer_id: volunteer.id,
      status: "confirmed",
    })
    .select("id")
    .single();

  if (signupError) throw signupError;
  console.log(`Signup: ${signup.id}`);

  // The real admin write. Sends the thank-you email, whose body carries
  // /me?tab=volunteer&feedback=<signup id>.
  const result = await attendanceService.markAttendance(opportunity.id, [
    { id: signup.id, hours_logged: hours, status: "attended" },
  ]);

  console.log(`Emails sent: ${result.thank_you_emails_sent} (EMAIL_MODE=${process.env.EMAIL_MODE || "log"})`);
  const origin = (process.env.CLIENT_ORIGIN || "http://localhost:5173").replace(/\/$/, "");
  console.log(`Feedback link: ${origin}/me?tab=volunteer&feedback=${signup.id}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
