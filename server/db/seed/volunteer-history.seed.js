// DEMO-ONLY: invented volunteer history — real version needs sessions that actually ran
//            and staff who marked a class roll (§19, §26).
//
// Run with: npm run seed:volunteer-history
//
// Why this exists: every real volunteer_opportunity runs 2026-08-05 to 2026-08-30, i.e.
// entirely in the future, so there is no past volunteer activity anywhere in the database
// and the attendance metrics have nothing to read. This backfills a year of completed
// sessions so those metrics are computed from real rows rather than a stub.
//
// SAFETY PROPERTIES, all deliberate:
//  - Touches ONLY rows it created itself, identified by the "[seed]" title prefix. It
//    clears those before rewriting, so shrinking the config removes the surplus instead
//    of stranding it. Nothing the volunteer track created is read, updated or deleted.
//  - Every seeded opportunity is status='closed', and opportunities.repo.listOpen filters
//    to ('open','full'), so NONE of this appears on the public /volunteer page.
//  - Signups reference volunteers that already exist rather than inventing people.
//  - Idempotent: ids are derived from a fixed namespace by hash, and the clear-then-write
//    step means a re-run leaves the database in exactly the same state.

require("dotenv").config({ quiet: true });

const crypto = require("node:crypto");
const { getSupabase } = require("../../src/config/supabase");

const NAMESPACE = "love21-volunteer-history-v1";

/** Marks every row this seed owns, so it can clear its own work and nothing else. */
const TITLE_PREFIX = "[seed]";

/** Uneven on purpose — live data has sports at 19 places against community_education at 3. */
const PROGRAMMES = [
  { programme: "sports", count: 10, capacity: [8, 16], title: "Floor curling session" },
  { programme: "fitness", count: 7, capacity: [5, 11], title: "Zumba fitness class" },
  { programme: "nutrition", count: 6, capacity: [4, 9], title: "Healthy cooking workshop" },
  { programme: "community_education", count: 4, capacity: [3, 6], title: "Community talk" },
];

const ATTENDANCE_RATE = 0.75;

/** Deterministic UUID so a re-run targets the same rows. */
function stableUuid(key) {
  const h = crypto.createHash("sha256").update(`${NAMESPACE}:${key}`).digest("hex");
  return [
    h.slice(0, 8),
    h.slice(8, 12),
    `4${h.slice(13, 16)}`,
    ((parseInt(h.slice(16, 17), 16) & 0x3) | 0x8).toString(16) + h.slice(17, 20),
    h.slice(20, 32),
  ].join("-");
}

function makeRandom(seed) {
  let a = seed >>> 0;
  return function random() {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashToInt(value) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * A date `months` back that is always in the past.
 *
 * The 10th normally, but the current month's 10th is a future date for the first nine
 * days of every month — and a session dated ahead of now would have the range filter
 * report attendance in a window that has not happened. Falls back a month when that
 * would occur.
 */
function pastDate(months) {
  const now = new Date();
  let at = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - months, 10, 4));
  if (at > now) {
    at = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - months - 1, 10, 4));
  }
  return at.toISOString();
}

function buildOpportunities() {
  const rows = [];

  for (const spec of PROGRAMMES) {
    for (let i = 0; i < spec.count; i += 1) {
      const key = `${spec.programme}-${i}`;
      const random = makeRandom(hashToInt(key));
      const [min, max] = spec.capacity;
      // 0..11 months back. Month 0 is included so narrow ranges have something to show;
      // pastDate() guarantees it still lands in the past.
      const monthsBack = i % 12;
      const startsAt = pastDate(monthsBack);

      rows.push({
        id: stableUuid(key),
        title_en: `${TITLE_PREFIX} ${spec.title} · ${startsAt.slice(0, 10)}`,
        title_zh: null,
        programme: spec.programme,
        capacity: min + Math.floor(random() * (max - min + 1)),
        starts_at: startsAt,
        ends_at: new Date(new Date(startsAt).getTime() + 2 * 3600 * 1000).toISOString(),
        // Keeps every seeded row off the public volunteer page.
        status: "closed",
        source: "internal",
      });
    }
  }

  return rows;
}

async function main() {
  const supabase = getSupabase();

  const { data: volunteers, error: volError } = await supabase
    .from("volunteers")
    .select("id")
    .limit(200);

  if (volError) throw new Error(`Reading volunteers failed: ${volError.message}`);
  if (!volunteers?.length) throw new Error("No volunteers exist to attach signups to");

  // Remove anything a previous run created before writing. Without this, shrinking the
  // config above strands the extra rows in the database forever — ids are derived, so a
  // smaller run simply stops addressing them rather than removing them.
  const { data: stale, error: staleError } = await supabase
    .from("volunteer_opportunities")
    .select("id")
    .like("title_en", `${TITLE_PREFIX}%`);

  if (staleError) throw new Error(`Reading previous seed failed: ${staleError.message}`);

  if (stale?.length) {
    const ids = stale.map((row) => row.id);
    await supabase.from("volunteer_signups").delete().in("opportunity_id", ids);
    await supabase.from("volunteer_opportunities").delete().in("id", ids);
    console.log(`Cleared ${ids.length} opportunities from a previous run`);
  }

  const opportunities = buildOpportunities();

  const { error: oppError } = await supabase
    .from("volunteer_opportunities")
    .upsert(opportunities, { onConflict: "id", ignoreDuplicates: false });

  if (oppError) throw new Error(`Seeding opportunities failed: ${oppError.message}`);

  const signups = [];

  for (const opportunity of opportunities) {
    const random = makeRandom(hashToInt(`signups-${opportunity.id}`));
    const count = Math.max(1, Math.round(opportunity.capacity * (0.3 + random() * 0.3)));

    // Walk the roster from a per-opportunity offset instead of picking at random.
    // `one_signup_per_volunteer_per_opportunity` is a UNIQUE constraint, and random
    // selection with replacement collides as soon as two draws match.
    const offset = hashToInt(opportunity.id) % volunteers.length;

    for (let i = 0; i < Math.min(count, volunteers.length); i += 1) {
      const volunteer = volunteers[(offset + i) % volunteers.length];
      const attended = random() < ATTENDANCE_RATE;

      // Roughly 60% of those who attended left feedback. Not all — a full response rate
      // does not happen, and the response count beside the score is there to show how
      // thin the sample is.
      const answered = attended && random() < 0.6;
      const rating = [3, 4, 4, 5, 5, 5][Math.floor(random() * 6)];

      signups.push({
        id: stableUuid(`${opportunity.id}-signup-${i}`),
        opportunity_id: opportunity.id,
        volunteer_id: volunteer.id,
        status: attended ? "attended" : "confirmed",
        created_at: opportunity.starts_at,
        attended_at: attended ? opportunity.starts_at : null,
        hours_logged: attended ? 2 + Math.round(random() * 3) : 0,
        experience_rating: answered ? rating : null,
        would_return: answered ? rating >= 4 : null,
        feedback_submitted_at: answered ? opportunity.starts_at : null,
      });
    }
  }

  const { error: signupError } = await supabase
    .from("volunteer_signups")
    .upsert(signups, { onConflict: "id", ignoreDuplicates: false });

  if (signupError) throw new Error(`Seeding signups failed: ${signupError.message}`);

  const attended = signups.filter((row) => row.attended_at).length;

  console.log(`Seeded ${opportunities.length} past opportunities (all status='closed')`);
  console.log(`Seeded ${signups.length} signups, ${attended} of them attended`);
  console.log("");
  console.log("DEMO-ONLY: this history is invented. None of it appears on /volunteer.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
