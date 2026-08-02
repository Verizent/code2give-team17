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

  console.log("\nDone.");
}

main().catch((error) => {
  console.error(`\n${error.message}`);
  process.exitCode = 1;
});
