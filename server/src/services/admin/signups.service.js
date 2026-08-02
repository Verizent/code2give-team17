const signupsRepo = require("../../data/volunteer-signups.repo");

/**
 * Full signup roster for one opportunity — every §23 discovery + feedback field
 * plus the joined volunteer info. Returned raw (no locale collapse) because the
 * admin UI shows both `_en` and `_zh` values side-by-side.
 *
 * @param {string} opportunityId
 */
async function listRosterForOpportunity(opportunityId) {
  const rows = await signupsRepo.listByOpportunity(opportunityId);
  return rows.map((row) => shapeForAdmin(row));
}

/**
 * Aggregate feedback view for one opportunity. Ratings and would-return are
 * computed from ATTENDED signups only — a 5-star rating from a no-show would
 * be nonsense. Discovery breakdown counts every signup (discovery is captured
 * before attendance, on the signup page).
 *
 * @param {string} opportunityId
 */
async function summariseFeedback(opportunityId) {
  const rows = await signupsRepo.listByOpportunity(opportunityId);

  const attended = rows.filter((row) => row.status === "attended");
  const noShow = rows.filter((row) => row.status === "no_show");

  const ratedRows = attended.filter((row) => row.experience_rating != null);
  const wouldReturnRows = attended.filter((row) => row.would_return != null);

  const averageRating =
    ratedRows.length === 0
      ? null
      : round1(
          ratedRows.reduce((sum, row) => sum + Number(row.experience_rating), 0) /
            ratedRows.length,
        );

  const wouldReturnPercent =
    wouldReturnRows.length === 0
      ? null
      : Math.round(
          (wouldReturnRows.filter((row) => row.would_return === true).length /
            wouldReturnRows.length) *
            100,
        );

  const discoveryBreakdown = {};
  for (const row of rows) {
    if (row.discovery_source) {
      discoveryBreakdown[row.discovery_source] =
        (discoveryBreakdown[row.discovery_source] || 0) + 1;
    }
  }

  return {
    total_signups: rows.length,
    attended_count: attended.length,
    no_show_count: noShow.length,
    feedback_submitted_count: attended.filter((row) => row.feedback_submitted_at).length,
    average_rating: averageRating,
    would_return_percent: wouldReturnPercent,
    discovery_breakdown: discoveryBreakdown,
  };
}

function shapeForAdmin(row) {
  const { volunteers, ...rest } = row;
  return {
    ...rest,
    volunteer: volunteers,
  };
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

module.exports = { listRosterForOpportunity, summariseFeedback };
