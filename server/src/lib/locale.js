/**
 * Resolves bilingual columns for API responses.
 *
 * @param {Record<string, unknown>} row
 * @param {string} locale
 * @returns {Record<string, unknown>}
 */
function localizeOpportunity(row, locale) {
  const useZh = locale === "zh-Hant";

  return {
    id: row.id,
    title: useZh && row.title_zh ? row.title_zh : row.title_en,
    title_en: row.title_en,
    title_zh: row.title_zh,
    description: useZh && row.description_zh ? row.description_zh : row.description_en,
    description_en: row.description_en,
    description_zh: row.description_zh,
    location: useZh && row.location_zh ? row.location_zh : row.location_en,
    location_en: row.location_en,
    location_zh: row.location_zh,
    programme: row.programme,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    capacity: row.capacity,
    spots_filled: row.spots_filled,
    interested_count: row.interested_count ?? 0,
    local_signups_count: row.local_signups_count ?? 0,
    seats_left: row.seats_left,
    min_age: row.min_age,
    skills: row.skills,
    status: row.status,
    source: row.source,
    handson_url: row.handson_url,
    handson_opportunity_id: row.handson_opportunity_id,
    last_synced_at: row.last_synced_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

module.exports = { localizeOpportunity };
