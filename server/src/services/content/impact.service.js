const impactRepo = require("../../data/impact.repo");
const { httpError } = require("../../lib/http-error");
const { resolveLocale } = require("../../lib/locale");

/** PostgREST can serialise `numeric` as a string to preserve precision. */
const toNumber = (value) => (value === null || value === undefined ? null : Number(value));

/**
 * `GET /api/impact` — the credibility figures on Home.
 *
 * The four per-programme counts are stored flat and nested into `by_programme` here,
 * so the frontend gets one object it can iterate to build a chart rather than four
 * fields it has to reassemble. The projection is explicit: `id`, `is_current` and the
 * timestamps are storage bookkeeping the client has no use for.
 *
 * @param {string} [locale]
 * @returns {Promise<object>}
 */
async function getCurrentImpact(locale) {
  const row = await impactRepo.findCurrent();

  if (!row) {
    throw httpError(404, "No current impact period. Has the seed been run?");
  }

  const { narrative } = resolveLocale(row, ["narrative"], locale);

  return {
    label: row.label,
    period_start: row.period_start,
    period_end: row.period_end,
    families_served: row.families_served,
    total_sessions: row.total_sessions,
    activity_types: row.activity_types,
    yoy_growth_pct: toNumber(row.yoy_growth_pct),
    programme_spend_pct: toNumber(row.programme_spend_pct),
    by_programme: {
      sports: row.sessions_sports,
      fitness: row.sessions_fitness,
      nutrition: row.sessions_nutrition,
      family_support: row.sessions_family_support,
    },
    narrative,
  };
}

module.exports = { getCurrentImpact };
