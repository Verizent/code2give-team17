const { getServiceClient } = require("../config/supabase");
const { throwIfDbError } = require("./supabase-error");

/**
 * @param {string} volunteerId
 */
async function listBadgesForVolunteer(volunteerId) {
  const db = getServiceClient();
  const { data, error } = await db
    .from("volunteer_badges")
    .select("id, awarded_at, badges(id, code, name_en, name_zh, description_en, description_zh, icon)")
    .eq("volunteer_id", volunteerId)
    .order("awarded_at", { ascending: false });

  throwIfDbError(error);
  return data || [];
}

/**
 * Full badge catalog. Used by badge evaluation to walk every criteria/threshold row.
 */
async function listAllBadges() {
  const db = getServiceClient();
  const { data, error } = await db
    .from("badges")
    .select("id, code, name_en, name_zh, description_en, description_zh, icon, criteria_type, threshold, sort_order")
    .order("sort_order", { ascending: true });

  throwIfDbError(error);
  return data || [];
}

/**
 * Returns a Set of badge_id strings the volunteer already holds — used to skip
 * re-awarding without a read-then-write race. The unique constraint on
 * volunteer_badges is the ultimate guard; this just avoids noisy duplicate inserts.
 *
 * @param {string} volunteerId
 */
async function listEarnedBadgeIdsForVolunteer(volunteerId) {
  const db = getServiceClient();
  const { data, error } = await db
    .from("volunteer_badges")
    .select("badge_id")
    .eq("volunteer_id", volunteerId);

  throwIfDbError(error);
  return new Set((data || []).map((row) => row.badge_id));
}

/**
 * Bulk-inserts newly-earned rows. Relies on `one_award_per_badge_per_volunteer`
 * unique constraint plus `ignoreDuplicates: true` so re-runs are safe (§50 comment
 * on volunteer_badges — "safely re-runnable").
 *
 * @param {{ volunteer_id: string, badge_id: string }[]} rows
 */
async function insertVolunteerBadges(rows) {
  if (!rows || rows.length === 0) {
    return;
  }
  const db = getServiceClient();
  const { error } = await db
    .from("volunteer_badges")
    .upsert(rows, { onConflict: "volunteer_id,badge_id", ignoreDuplicates: true });

  throwIfDbError(error);
}

module.exports = {
  listBadgesForVolunteer,
  listAllBadges,
  listEarnedBadgeIdsForVolunteer,
  insertVolunteerBadges,
};
