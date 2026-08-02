// DEMO-ONLY: seeded sessions stand in for real ones scheduled by Love 21 staff
// through /admin/postings. Real version needs staff-authored sessions on the
// members-app calendar. Marked in the §26 register.
//
// The seed generates ~40 sessions spanning today+2 through today+30, so the
// allocation window (§15: [donation + 2 days, edition end)) always finds supply.
// Names are visibly synthetic — a demoer never confuses these with real classes.

const PROGRAMMES = ["sports", "fitness", "nutrition", "family", "where_needed"];
const LOCATIONS = [
  { en: "San Po Kong Centre", zh: "新蒲崗中心" },
  { en: "Wanchai Hub", zh: "灣仔中心" },
  { en: "Kwun Tong Studio", zh: "觀塘工作室" },
  { en: "Yau Ma Tei Kitchen", zh: "油麻地廚房" },
];
const SAMPLE_TITLES = {
  sports: { en: "Floor curling drop-in", zh: "地壺球體驗" },
  fitness: { en: "Zumba fitness class", zh: "Zumba 體能課" },
  nutrition: { en: "Healthy cooking workshop", zh: "健康烹飪工作坊" },
  family: { en: "Family support circle", zh: "家庭支援聚會" },
  where_needed: { en: "Community moment (open)", zh: "開放社群時段" },
};

/**
 * Generate ~40 sessions across the next 30 days, starting 2 days out so allocation
 * can attach to them immediately.
 *
 * @param {Date} [now] Injected for tests / determinism; defaults to `new Date()`.
 * @returns {object[]}
 */
function generateSessions(now = new Date()) {
  const sessions = [];
  const dayMs = 24 * 60 * 60 * 1000;

  // Start on day+2 to satisfy the §15 selection floor.
  for (let dayOffset = 2; dayOffset <= 30; dayOffset++) {
    // 1–2 sessions per day, cycling programmes.
    const sessionsToday = dayOffset % 2 === 0 ? 2 : 1;
    for (let s = 0; s < sessionsToday; s++) {
      const programme = PROGRAMMES[(dayOffset + s) % PROGRAMMES.length];
      const location = LOCATIONS[(dayOffset + s) % LOCATIONS.length];
      const startHourUTC = 10 + s * 4; // 10:00 or 14:00

      const startsAt = new Date(now.getTime() + dayOffset * dayMs);
      startsAt.setUTCHours(startHourUTC, 0, 0, 0);
      const endsAt = new Date(startsAt.getTime() + 90 * 60 * 1000); // 90 min

      sessions.push({
        title_en: `[demo] ${SAMPLE_TITLES[programme].en} · ${startsAt.toISOString().slice(0, 10)}`,
        title_zh: `[示範] ${SAMPLE_TITLES[programme].zh} · ${startsAt.toISOString().slice(0, 10)}`,
        programme,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        location_en: location.en,
        location_zh: location.zh,
        capacity: 12,
        estimated_cost_hkd: 1450,
        status: "scheduled",
      });
    }
  }
  return sessions;
}

module.exports = { generateSessions };
