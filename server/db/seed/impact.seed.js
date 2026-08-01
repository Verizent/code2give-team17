// Figures from the Love 21 Foundation 2024-25 annual report (CONTEXT.md §20).
// Annual, not monthly — see the deviation note in the impact_periods migration.

const impactPeriods = [
  {
    period_start: "2024-07-01",
    period_end: "2025-06-30",
    label: "2024–25",
    families_served: 490,
    total_sessions: 6859,
    activity_types: 84,
    sessions_sports: 2792,
    sessions_fitness: 1504,
    sessions_nutrition: 1489,
    sessions_family_support: 930,
    yoy_growth_pct: 30,
    programme_spend_pct: 86,
    narrative_en:
      "In 2024–25 Love 21 supported 490 families across 6,859 free sessions — a 30% increase on the year before, with 86 cents of every dollar going directly to programmes.",
    narrative_zh:
      "在 2024–25 年度，Love 21 為 490 個家庭提供了 6,859 節免費課程，較去年增長 30%，每一元捐款中有 86 仙直接用於服務計劃。",
    is_current: true,
  },
];

module.exports = { impactPeriods };
