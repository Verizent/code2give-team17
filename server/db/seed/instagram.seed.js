// DEMO-ONLY: placeholder Instagram embeds — real version needs actual permalinks from
// Love 21's account, supplied by staff (§17, §18.6).
//
// The URLs below are NOT real posts. They are shortcode-shaped placeholders so the admin
// CRUD screen and the public /api/instagram rail have rows to render and reorder. They
// will NOT embed real content, and must never be presented to a judge as Love 21's actual
// feed — swap in real permalinks before showing the rail as live.
//
// Fixed ids so `npm run seed` upserts on re-run instead of duplicating.

const instagramEmbeds = [
  {
    id: "1a5e0000-0000-4000-8000-000000000001",
    url: "https://www.instagram.com/p/DEMOplaceholder01/",
    caption_en: "[demo] Floor curling drop-in — Tuesday regulars back on the mats.",
    caption_zh: "[示範] 地壺球體驗 — 星期二的常客回來了。",
    display_order: 1,
    is_active: true,
  },
  {
    id: "1a5e0000-0000-4000-8000-000000000002",
    url: "https://www.instagram.com/p/DEMOplaceholder02/",
    caption_en: "[demo] Healthy cooking workshop — this week: congee three ways.",
    caption_zh: "[示範] 健康烹飪工作坊 — 本週：三款粥品。",
    display_order: 2,
    is_active: true,
  },
  {
    id: "1a5e0000-0000-4000-8000-000000000003",
    url: "https://www.instagram.com/p/DEMOplaceholder03/",
    caption_en: "[demo] Zumba class hit 20 dancers for the first time.",
    caption_zh: "[示範] Zumba 體能課首次達到 20 位舞者。",
    display_order: 3,
    is_active: true,
  },
  {
    id: "1a5e0000-0000-4000-8000-000000000004",
    url: "https://www.instagram.com/p/DEMOplaceholder04/",
    caption_en: "[demo] Family support circle — carers' morning tea.",
    caption_zh: "[示範] 家庭支援聚會 — 照顧者茶敘。",
    display_order: 4,
    is_active: true,
  },
  {
    // Inactive on purpose: the admin screen needs a row that is hidden from the public
    // rail, or the is_active toggle has nothing to demonstrate.
    id: "1a5e0000-0000-4000-8000-000000000005",
    url: "https://www.instagram.com/p/DEMOplaceholder05/",
    caption_en: "[demo] Archived post — hidden from the public rail.",
    caption_zh: "[示範] 已封存貼文 — 不在公開列表顯示。",
    display_order: 5,
    is_active: false,
  },
];

module.exports = { instagramEmbeds };
