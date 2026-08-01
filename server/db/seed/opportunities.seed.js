// Stable UUIDs so re-seeding upserts the same rows (and client briefings can key on them).
const IDS = {
  kpop: "a1111111-1111-4111-8111-111111111111",
  art: "a2222222-2222-4222-8222-222222222222",
  trampoline: "a3333333-3333-4333-8333-333333333333",
  nutrition: "a4444444-4444-4444-8444-444444444444",
};

/** Next occurrence of weekday (0=Sun…6=Sat), at least `minDaysAhead` from today, HKT noon. */
function nextWeekdayAt(weekday, minDaysAhead, hour, minute) {
  const d = new Date();
  // Work in local wall time for the hackathon demos (HK).
  d.setHours(12, 0, 0, 0);
  let delta = (weekday - d.getDay() + 7) % 7;
  if (delta < minDaysAhead) delta += 7;
  d.setDate(d.getDate() + delta);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/**
 * HandsOn-shaped + internal Love 21 listings. Dates are relative to “today” so
 * the volunteer hub always shows upcoming sessions after a re-seed.
 */
const opportunities = [
  {
    id: IDS.kpop,
    title_en: "K-pop Dance Class Assistant",
    title_zh: "K-pop 舞蹈班助理",
    description_en:
      "Join the class as an active participant — warm up, dance along, and support members through the routine.",
    description_zh:
      "以參與者身份加入課堂——一起熱身、跳舞，並在動作中支援學員。",
    location_en: "Address after signup",
    location_zh: "報名後提供地址",
    programme: "community_education",
    starts_at: nextWeekdayAt(0, 3, 14, 0),
    ends_at: nextWeekdayAt(0, 3, 15, 30),
    capacity: 1,
    spots_filled: 1,
    min_age: 16,
    skills: ["patient", "photography"],
    status: "full",
    source: "handson",
    handson_url: "https://volunteer.handsonhongkong.org/opportunity/a0CQ90000FjeH0wMQE",
    handson_opportunity_id: "a0CQ90000FjeH0wMQE",
    last_synced_at: new Date().toISOString(),
  },
  {
    id: IDS.trampoline,
    title_en: "Trampoline session assist",
    title_zh: "彈床課助理",
    description_en:
      "Spot safely, bounce with the group, and help members take turns on the trampoline.",
    description_zh: "安全守護、與學員一起彈跳，協助輪流使用彈床。",
    location_en: "Wan Chai sports hall",
    location_zh: "灣仔體育館",
    programme: "fitness",
    starts_at: nextWeekdayAt(3, 2, 16, 0),
    ends_at: nextWeekdayAt(3, 2, 17, 0),
    capacity: 2,
    spots_filled: 0,
    min_age: 14,
    skills: ["sports", "patient", "youth14"],
    status: "open",
    source: "internal",
    handson_url: null,
    handson_opportunity_id: null,
    last_synced_at: null,
  },
  {
    id: IDS.nutrition,
    title_en: "Nutrition plating assistant",
    title_zh: "營養擺盤助理",
    description_en:
      "Prep ingredients, plate colourful meals with members, and share lunch at the end.",
    description_zh: "預備食材、與學員一起擺盤，最後一起享用午餐。",
    location_en: "Wan Chai teaching kitchen",
    location_zh: "灣仔教學廚房",
    programme: "nutrition",
    starts_at: nextWeekdayAt(4, 4, 11, 0),
    ends_at: nextWeekdayAt(4, 4, 12, 30),
    capacity: 3,
    spots_filled: 1,
    min_age: 16,
    skills: ["kitchen", "patient"],
    status: "open",
    source: "internal",
    handson_url: null,
    handson_opportunity_id: null,
    last_synced_at: null,
  },
];

module.exports = { opportunities, IDS };
