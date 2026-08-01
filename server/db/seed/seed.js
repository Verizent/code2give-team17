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
const { communityPosts } = require("./community-posts.seed");
const { impactPeriods } = require("./impact.seed");
const { opportunities } = require("./opportunities.seed");

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

async function main() {
  console.log("Seeding Love 21 content (upsert only, nothing is deleted)\n");

  try {
    const articleCount = await upsert("articles", articles, "slug");
    console.log(`  articles          ${articleCount} upserted`);
  } catch (error) {
    console.warn(`  articles          skipped — ${error.message}`);
  }

  try {
    const impactCount = await upsert("impact_periods", impactPeriods, "period_start,period_end");
    console.log(`  impact_periods    ${impactCount} upserted`);
  } catch (error) {
    console.warn(`  impact_periods    skipped — ${error.message}`);
  }

  try {
    await seedCommunityPosts();
  } catch (error) {
    console.warn(`  community_posts   skipped — ${error.message}`);
  }

  const opportunityCount = await upsert("volunteer_opportunities", opportunities, "id");
  console.log(`  volunteer_opportunities ${opportunityCount} upserted`);

  console.log("\nDone.");
}

main().catch((error) => {
  console.error(`\n${error.message}`);
  process.exitCode = 1;
});
