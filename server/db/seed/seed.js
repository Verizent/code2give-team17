// DEMO-ONLY: seeded articles, Voices and impact figures stand in for a real CMS and
// real reporting. Name and photo consent is unconfirmed for every story
// (CONTEXT.md §18.5), and which stat set is current is unconfirmed (§20.1).
// Real version needs staff-authored content through the admin path and a confirmed
// figure set signed off by Love 21.
//
// Run with: npm run seed
//
// UPSERTS ONLY — this never truncates or deletes. Someone will run it while a
// teammate is mid-demo, and wiping their test data is not a recoverable mistake.

require("dotenv").config({ quiet: true });

const { getSupabase } = require("../../src/config/supabase");
const { articles } = require("./articles.seed");
const { badges } = require("./badges.seed");
const { communityPosts } = require("./community-posts.seed");
const { impactPeriods } = require("./impact.seed");
const { generateSessions } = require("./sessions.seed");
const { opportunities } = require("./volunteer-opportunities.seed");

async function upsert(table, rows, onConflict) {
  const { data, error } = await getSupabase()
    .from(table)
    .upsert(rows, { onConflict, ignoreDuplicates: false })
    .select("id");

  if (error) {
    throw new Error(`Seeding ${table} failed: ${error.message}`);
  }

  return data?.length ?? 0;
}

/**
 * Voices have no natural key to upsert on — `author_name` is not unique and nothing
 * else is stable. Re-running would duplicate them, so they are inserted only when the
 * table is empty. That keeps the seed idempotent without deleting a teammate's rows.
 */
async function seedCommunityPosts() {
  const supabase = getSupabase();
  const { count, error } = await supabase
    .from("community_posts")
    .select("id", { count: "exact", head: true });

  if (error) {
    throw new Error(`Seeding community_posts failed: ${error.message}`);
  }

  if (count > 0) {
    console.log(`  community_posts   skipped — ${count} row(s) already present`);
    return;
  }

  const { error: insertError } = await supabase.from("community_posts").insert(communityPosts);

  if (insertError) {
    throw new Error(`Seeding community_posts failed: ${insertError.message}`);
  }

  console.log(`  community_posts   ${communityPosts.length} inserted`);
}

async function safeSeed(label, fn) {
  try {
    await fn();
  } catch (error) {
    console.error(`  ${label.padEnd(18)}FAILED — ${error.message}`);
  }
}

/**
 * Sessions: no stable natural key (title includes date), so we only insert when the
 * `sessions` table is empty. Same idempotency shape as community_posts above.
 * DEMO-ONLY per sessions.seed.js.
 */
async function seedSessions() {
  const supabase = getSupabase();
  const { count, error } = await supabase
    .from("sessions")
    .select("id", { count: "exact", head: true });

  if (error) {
    // Table may not exist yet if the 20260803 migration hasn't been applied — say so
    // and continue rather than fail the whole seed.
    console.log(`  sessions          skipped — ${error.message}`);
    return;
  }

  if (count > 0) {
    console.log(`  sessions          skipped — ${count} row(s) already present`);
    return;
  }

  const rows = generateSessions();
  const { error: insertError } = await supabase.from("sessions").insert(rows);

  if (insertError) {
    throw new Error(`Seeding sessions failed: ${insertError.message}`);
  }

  console.log(`  sessions          ${rows.length} inserted (${rows[0].starts_at.slice(0, 10)} → ${rows[rows.length - 1].starts_at.slice(0, 10)})`);
}

async function main() {
  console.log("Seeding Love 21 content (upsert only, nothing is deleted)\n");

  // Volunteer track first so opportunities + badges land even if a later step
  // hits schema drift (§26 demo-first — a partial seed is better than none).
  await safeSeed("volunteer_opps", async () => {
    const n = await upsert("volunteer_opportunities", opportunities, "id");
    console.log(`  volunteer_opps    ${n} upserted`);
  });

  await safeSeed("badges", async () => {
    const n = await upsert("badges", badges, "code");
    console.log(`  badges            ${n} upserted`);
  });

  await safeSeed("articles", async () => {
    const n = await upsert("articles", articles, "slug");
    console.log(`  articles          ${n} upserted`);
  });

  await safeSeed("impact_periods", async () => {
    const n = await upsert("impact_periods", impactPeriods, "period_start,period_end");
    console.log(`  impact_periods    ${n} upserted`);
  });

  await safeSeed("community_posts", seedCommunityPosts);

  // Wrapped like the rest: the donations branch called this bare, so a failure here
  // aborted every later step. That is exactly how the sessions seed got skipped when
  // the articles upsert failed.
  await safeSeed("sessions", seedSessions);

  console.log("\nDone.");
}

main().catch((error) => {
  console.error(`\n${error.message}`);
  process.exitCode = 1;
});
