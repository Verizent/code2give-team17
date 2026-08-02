// DEMO-ONLY: Seeded volunteer opportunities stand in for staff-authored listings.
// Real version needs staff entering listings through the admin path (§5, §17).
// The `handson` source row is a stub; a real HandsOn sync populates
// spots_filled_handson + last_synced_at from the partner API.

// Stable UUIDs so `upsert on id` is safely re-runnable — the table has no other
// unique constraint that fits (see 10_volunteer_opportunities.sql:73-74).
const in7Days = () => new Date(Date.now() + 7 * 86_400_000).toISOString();
const in14Days = () => new Date(Date.now() + 14 * 86_400_000).toISOString();
const in21Days = () => new Date(Date.now() + 21 * 86_400_000).toISOString();
const in28Days = () => new Date(Date.now() + 28 * 86_400_000).toISOString();

function plusHours(iso, hours) {
  return new Date(new Date(iso).getTime() + hours * 3_600_000).toISOString();
}

const opportunities = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    title_en: "Weekend Class Assistant",
    title_zh: "周末課堂助理",
    description_en:
      "Help lead our Saturday sports session at the Kwun Tong hub. Set up equipment, cheer on volunteers with Down syndrome, and support small-group drills.",
    description_zh:
      "協助觀塘中心的周六運動課堂：擺設器材、鼓勵唐氏綜合症的參加者，並協助小組訓練。",
    location_en: "Love 21 Foundation Hub, Kwun Tong",
    location_zh: "Love 21 中心（觀塘）",
    programme: "sports",
    starts_at: in7Days(),
    ends_at: plusHours(in7Days(), 3),
    capacity: 8,
    min_age: 16,
    skills: ["patience"],
    status: "open",
    source: "internal",
    spots_filled_handson: 0,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    title_en: "Fitness Programme Assistant",
    title_zh: "健身計劃助理",
    description_en:
      "Support the weekday fitness circuit at the Love 21 hub — guiding warm-ups, encouraging pace, and helping our coaches keep the group safe.",
    description_zh: "協助Love 21中心平日健身班：帶領熱身、鼓勵節奏、協助教練確保安全。",
    location_en: "Love 21 Foundation Hub, Kwun Tong",
    location_zh: "Love 21 中心（觀塘）",
    programme: "fitness",
    starts_at: in14Days(),
    ends_at: plusHours(in14Days(), 2),
    capacity: 6,
    min_age: 16,
    skills: [],
    status: "open",
    source: "internal",
    spots_filled_handson: 0,
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    title_en: "Family Nutrition Workshop Support",
    title_zh: "家庭營養工作坊支援",
    description_en:
      "Help facilitate a Sunday nutrition workshop for families — meal prep, plating, and translation between English and Cantonese as needed.",
    description_zh:
      "協助周日的家庭營養工作坊：預備餐食、擺盤，並在需要時協助英語與粵語溝通。",
    location_en: "Love 21 Foundation Hub, Kwun Tong",
    location_zh: "Love 21 中心（觀塘）",
    programme: "nutrition",
    starts_at: in21Days(),
    ends_at: plusHours(in21Days(), 4),
    capacity: 5,
    min_age: 18,
    skills: ["cooking", "cantonese"],
    status: "open",
    source: "internal",
    spots_filled_handson: 0,
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    title_en: "HandsOn: Community Sports Coach",
    title_zh: "HandsOn：社區運動教練",
    description_en:
      "Mirrored from HandsOn Hong Kong. Sign up through their platform for the official record. DEMO-ONLY — a live sync is not implemented (§17).",
    description_zh:
      "從HandsOn鏡像。正式報名請前往HandsOn平台。DEMO-ONLY — 尚未實現實際同步（§17）。",
    location_en: "Kwun Tong District",
    location_zh: "觀塘區",
    programme: "sports",
    starts_at: in28Days(),
    ends_at: plusHours(in28Days(), 3),
    capacity: 10,
    spots_filled_handson: 2,
    min_age: 16,
    skills: [],
    status: "open",
    source: "handson",
    handson_url: "https://handsonhongkong.org/#demo-opportunity",
    handson_opportunity_id: "hoh-demo-001",
    last_synced_at: new Date().toISOString(),
  },
];

module.exports = { opportunities };
