#!/usr/bin/env node
// Builds a donor whose gift is a month old and whose sessions have already happened, so the
// 15th/EOM batch email has something real to send.
//
//   npm run seed:past-donation                          seeds for the default address
//   npm run seed:past-donation you@example.com           seeds for yours
//   npm run seed:past-donation you@example.com 1450      and sets the amount
//
// Then fire the batch:
//   node -e "require('dotenv').config({quiet:true});
//            require('./src/services/donations/period-close.service').closeReadyPeriods().then(console.log)"
//
// ── Why a seeder rather than a test ────────────────────────────────────────
// The 15th/EOM path cannot be exercised by donating today: `listDueForClose` only returns
// periods whose `period_end` has passed, and a gift made now lands in an edition that closes
// weeks out. Every date this depends on is derived from `editionForDonation`, the same
// function allocation uses, so the seeded rows land in exactly the window production would
// have put them in — hardcoding "15 July" would drift the moment that mapping changes.
//
// ── Safety ─────────────────────────────────────────────────────────────────
// Writes only: one donor (reused if the address exists), one donation, a handful of
// clearly-marked `[seed]` sessions in the past, and their allocations. Touches nothing that
// already exists. Prints the tracking link at the end.

require("dotenv").config({ quiet: true });

const donorsService = require("../src/services/donors.service");
const donationsRepo = require("../src/data/donations.repo");
const donorPeriodsRepo = require("../src/data/donor-periods.repo");
const allocationsRepo = require("../src/data/allocations.repo");
const sessionsRepo = require("../src/data/sessions.repo");
const { getSupabase } = require("../src/config/supabase");
const { editionForDonation, editionLabel } = require("../src/lib/donation-periods");
const { creditFor, COST_PER_EVENT_HKD } = require("../src/lib/donation-credit");

const DEFAULT_EMAIL = "mrichardsuryajaya@gmail.com";
const DAY_MS = 24 * 60 * 60 * 1000;

/** Sessions to invent, relative to the donation date. Spread so the list is not all one day. */
const SEED_SESSIONS = [
  { offsetDays: 9, hourUtc: 2, title: "Floor curling drop-in", venue: "Kwun Tong Studio", attended: 14 },
  { offsetDays: 12, hourUtc: 6, title: "Healthy cooking workshop", venue: "Yau Ma Tei Kitchen", attended: 11 },
  { offsetDays: 16, hourUtc: 2, title: "Dance and movement", venue: "San Po Kong Centre", attended: 17 },
  { offsetDays: 20, hourUtc: 6, title: "Family support circle", venue: "Wanchai Hub", attended: 9 },
];

function isoDay(date) {
  return date.toISOString().slice(0, 10);
}

/**
 * Finds a session this script created on a previous run, so re-running reuses rather than
 * duplicates. Matched on title and exact start — the two things the script controls.
 */
async function findSeededSession(title, startsAt) {
  const { data, error } = await getSupabase()
    .from("sessions")
    .select("id, title_en, starts_at")
    .eq("title_en", `[seed] ${title}`)
    .eq("starts_at", startsAt.toISOString())
    .limit(1);

  if (error) throw error;
  return data?.[0] ?? null;
}

async function main() {
  const email = process.argv[2] || DEFAULT_EMAIL;
  const amountHkd = Number(process.argv[3] || 1450);
  const mode = (process.env.EMAIL_MODE || "log").toLowerCase();

  // A month back, on the 5th, so the edition is unambiguous: a gift on the 1st–15th is sent at
  // end of that month, which is comfortably in the past.
  const donatedAt = new Date(Date.now() - 30 * DAY_MS);
  donatedAt.setUTCDate(5);
  donatedAt.setUTCHours(10, 0, 0, 0);

  const edition = editionForDonation(donatedAt);
  const credited = creditFor(amountHkd);

  console.log(`donor        ${email}`);
  console.log(`gift         HK$${amountHkd} on ${isoDay(donatedAt)} (${credited} sessions credited)`);
  console.log(`edition      ${editionLabel(edition)}  → closes ${isoDay(edition.windowEnd)}`);
  console.log(`email mode   ${mode}${mode === "smtp" ? "  ⚠ REAL EMAIL WILL SEND" : ""}\n`);

  const donor = await donorsService.upsertDonor({ email, fullName: "Demo Donor" });

  const donation = await donationsRepo.insertDonation({
    donor_id: donor.id,
    amount_hkd: amountHkd,
    frequency: "once",
    status: "succeeded",
    events_credited: credited,
    cost_per_event_at_donation: COST_PER_EVENT_HKD,
    tracking_opt_in: true,
    created_at: donatedAt.toISOString(),
  });
  console.log(`✓ donation   ${donation.id}`);

  // `donor_periods_one_open_idx` is UNIQUE (donor_id) WHERE status = 'open' — a donor may hold
  // exactly one open period at a time. A donor who has already given will therefore have an
  // open period for the current edition, and opening the back-dated one would violate it.
  // Closing the newer period is the honest resolution: it has nothing completed in it, so it
  // has no update to send, and the batch would skip it anyway.
  const existingOpen = (await donorPeriodsRepo.listByDonor(donor.id)).find(
    (p) => p.status === "open" && p.period_start !== isoDay(edition.windowStart),
  );
  if (existingOpen) {
    await donorPeriodsRepo.updatePeriod(existingOpen.id, { status: "closed" });
    console.log(
      `! closed the current open period ${existingOpen.period_start} → ${existingOpen.period_end}` +
        ` (only one may be open per donor)`,
    );
  }

  let period = await donorPeriodsRepo.findOrOpenForDonorWindow({
    donorId: donor.id,
    windowStart: edition.windowStart,
    windowEnd: edition.windowEnd,
  });

  // Re-running this script must actually re-arm the batch. `findOrOpenForDonorWindow` returns
  // the existing row for a window, so after one `closeReadyPeriods` run the period comes back
  // `closed` — and `listDueForClose` only returns open ones, so the second run would report
  // `processed: 0` and look as though the seeding had failed.
  if (period.status !== "open") {
    await donorPeriodsRepo.updatePeriod(period.id, { status: "open", emailed_at: null });
    period = { ...period, status: "open" };
    console.log(`! reopened the period from a previous run`);
  }
  console.log(`✓ period     ${period.id}  ${period.period_start} → ${period.period_end} (${period.status})`);

  // Sessions must already have happened, because the batch reports completed ones. Created
  // here rather than reused: every seeded session lives in the future, and back-dating real
  // rows would corrupt data other tracks are reading.
  const wanted = SEED_SESSIONS.slice(0, credited);
  const rows = [];
  for (const spec of wanted) {
    const startsAt = new Date(donatedAt.getTime() + spec.offsetDays * DAY_MS);
    startsAt.setUTCHours(spec.hourUtc, 0, 0, 0);
    const endsAt = new Date(startsAt.getTime() + 2 * 60 * 60 * 1000);

    // Reuse a session this script created before. Without this, each run minted a fresh row
    // with the same title and date, and the edition email then listed "Floor curling drop-in"
    // once per run — which looks exactly like a deduplication bug in the product and is not
    // one. Distinct session ids are genuinely distinct sessions.
    const existing = await findSeededSession(spec.title, startsAt);
    if (existing) {
      rows.push({ session: existing, spec, startsAt });
      console.log(`· session    ${isoDay(startsAt)}  ${spec.title}  (reused)`);
      continue;
    }

    const session = await sessionsRepo.create({
      programme: "community",
      title_en: `[seed] ${spec.title}`,
      title_zh: `[seed] ${spec.title}`,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      location: spec.venue,
      capacity: 12,
      attendance_count: spec.attended,
      attendance_source: "manual",
      status: "completed",
      estimated_cost_hkd: COST_PER_EVENT_HKD,
    });
    // `location_en` is what the donations repo reads; `location` is the admin track's column.
    // The create projection only accepts the admin set, so the bilingual pair is patched after.
    await sessionsRepo.update(session.id, { location_en: spec.venue, location_zh: spec.venue });
    rows.push({ session, spec, startsAt });
    console.log(`✓ session    ${isoDay(startsAt)}  ${spec.title}  (${spec.attended} attended)`);
  }

  // `completed` with `email_sent_at` null is precisely the state closeReadyPeriods looks for:
  // finished, and the donor has not been told yet.
  await allocationsRepo.insertMany(
    rows.map(({ session }) => ({
      donation_id: donation.id,
      session_id: session.id,
      donor_period_id: period.id,
      cost_at_allocation: COST_PER_EVENT_HKD,
      status: "completed",
    })),
  );
  console.log(`✓ ${rows.length} allocations, completed, not yet emailed`);

  const origin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
  console.log(`\ntracking     ${origin}/give/track/${donor.access_token}`);
  console.log(
    `\nNow run the batch:\n` +
      `  node -e "require('dotenv').config({quiet:true});` +
      `require('./src/services/donations/period-close.service').closeReadyPeriods().then(console.log)"`,
  );
}

main().catch((error) => {
  console.error(`\n✗ ${error.message}\n`);
  process.exitCode = 1;
});
