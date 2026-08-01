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

module.exports = { listBadgesForVolunteer };
