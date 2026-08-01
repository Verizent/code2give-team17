// Badge catalog. `code` is the stable seed key (§40 SQL comment) — safe to re-run.

const badges = [
  {
    code: "first_signup",
    name_en: "First Signup",
    name_zh: "第一次登記",
    description_en: "Attended your first Love 21 volunteering session.",
    description_zh: "完成第一次Love 21義工活動。",
    icon: "sparkles",
    criteria_type: "signup_count",
    threshold: 1,
    sort_order: 10,
  },
  {
    code: "getting_started",
    name_en: "Getting Started",
    name_zh: "起步階段",
    description_en: "Reached 10 hours of attended volunteering time.",
    description_zh: "累積10小時義工時數。",
    icon: "clock",
    criteria_type: "hours",
    threshold: 10,
    sort_order: 20,
  },
  {
    code: "programme_explorer",
    name_en: "Programme Explorer",
    name_zh: "計劃探索者",
    description_en: "Volunteered across three different Love 21 programmes.",
    description_zh: "在三個不同的Love 21計劃中服務。",
    icon: "compass",
    criteria_type: "programme_variety",
    threshold: 3,
    sort_order: 30,
  },
  {
    code: "regular_supporter",
    name_en: "Regular Supporter",
    name_zh: "常態支持者",
    description_en: "Attended five volunteering sessions with Love 21.",
    description_zh: "完成五次Love 21義工活動。",
    icon: "heart",
    criteria_type: "signup_count",
    threshold: 5,
    sort_order: 40,
  },
];

module.exports = { badges };
