// Bilingual copy for volunteer emails. Plain-string builders — no template engine
// dependency. Each function returns `{ subject, text, html }`.
//
// Locale falls back per FIELD (not per row) — an empty zh-Hant title still uses
// the English one, matching `resolveLocale` semantics in `src/lib/resolve-locale.js`.

function pickLocale(row, base, locale) {
  if (locale === "zh-Hant") {
    const zh = row[`${base}_zh`];
    if (zh && String(zh).trim().length > 0) {
      return zh;
    }
  }
  return row[`${base}_en`];
}

function clientOrigin() {
  return (process.env.CLIENT_ORIGIN || "http://localhost:5173").replace(/\/$/, "");
}

function feedbackUrl(signupId) {
  if (!signupId) return `${clientOrigin()}/me?tab=volunteer`;
  return `${clientOrigin()}/me?tab=volunteer&feedback=${encodeURIComponent(signupId)}`;
}

/**
 * @param {{ full_name: string, locale?: string }} volunteer
 * @param {{ title_en: string, title_zh?: string|null, programme: string }} opportunity
 * @param {{ id?: string, hours_logged: number }} signup
 * @param {{ id: string, title_en: string, title_zh?: string|null, starts_at: string }[]} recommendations
 */
function renderThankYou(volunteer, opportunity, signup, recommendations) {
  const locale = volunteer.locale === "zh-Hant" ? "zh-Hant" : "en";
  const title = pickLocale(opportunity, "title", locale);
  const hours = Number(signup.hours_logged || 0);
  const feedbackLink = feedbackUrl(signup.id);

  if (locale === "zh-Hant") {
    return renderChinese(volunteer, title, hours, recommendations, feedbackLink);
  }
  return renderEnglish(volunteer, title, hours, recommendations, feedbackLink);
}

function renderEnglish(volunteer, title, hours, recs, feedbackLink) {
  const subject = `Thank you for volunteering with Love 21`;
  const lines = [
    `Hi ${volunteer.full_name},`,
    ``,
    `Thank you for volunteering at "${title}". We logged ${hours} hour${hours === 1 ? "" : "s"} for you.`,
    ``,
    `Share a quick reflection (optional): ${feedbackLink}`,
    ``,
  ];

  if (recs.length > 0) {
    lines.push(`If you'd like to join us again, here are a few upcoming sessions:`);
    lines.push(``);
    for (const rec of recs) {
      const recTitle = pickLocale(rec, "title", "en");
      lines.push(`  • ${recTitle} — ${formatDate(rec.starts_at)}`);
    }
    lines.push(``);
    lines.push(`Book at: ${clientOrigin()}/volunteer`);
    lines.push(``);
  }

  lines.push(`With gratitude,`);
  lines.push(`The Love 21 Foundation team`);

  const text = lines.join("\n");
  return { subject, text, html: `<pre>${escapeHtml(text)}</pre>` };
}

function renderChinese(volunteer, title, hours, recs, feedbackLink) {
  const subject = `感謝您成為Love 21的義工`;
  const lines = [
    `${volunteer.full_name} 您好,`,
    ``,
    `感謝您參與「${title}」義工活動。我們為您記錄了 ${hours} 小時服務時間。`,
    ``,
    `歡迎分享簡短感受（可選）:${feedbackLink}`,
    ``,
  ];

  if (recs.length > 0) {
    lines.push(`如果您希望再次參與,以下是一些即將舉行的活動:`);
    lines.push(``);
    for (const rec of recs) {
      const recTitle = pickLocale(rec, "title", "zh-Hant");
      lines.push(`  • ${recTitle} — ${formatDate(rec.starts_at)}`);
    }
    lines.push(``);
    lines.push(`報名網址:${clientOrigin()}/volunteer`);
    lines.push(``);
  }

  lines.push(`謹致謝忱,`);
  lines.push(`Love 21 Foundation 團隊`);

  const text = lines.join("\n");
  return { subject, text, html: `<pre>${escapeHtml(text)}</pre>` };
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toISOString().slice(0, 10);
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function briefingUrl(signupId) {
  return `${clientOrigin()}/volunteer/briefing/${signupId}`;
}

/** "2026-08-08, 10:00–13:00" in Hong Kong time, which is where every session is. */
function formatWhen(startsAt, endsAt) {
  const opts = { timeZone: "Asia/Hong_Kong", hour: "2-digit", minute: "2-digit", hour12: false };
  const day = new Date(startsAt).toLocaleDateString("en-CA", { timeZone: "Asia/Hong_Kong" });
  const from = new Date(startsAt).toLocaleTimeString("en-GB", opts);
  if (!endsAt) return `${day}, ${from}`;
  return `${day}, ${from}–${new Date(endsAt).toLocaleTimeString("en-GB", opts)}`;
}

/**
 * Sent the moment a spot is confirmed. Until this existed a volunteer received nothing
 * at all between signing up and turning up — the only email in the track fired after
 * attendance, by which point the session had already happened.
 *
 * @param {{ full_name: string, locale?: string }} volunteer
 * @param {{ title_en: string, title_zh?: string|null, location_en?: string|null,
 *           location_zh?: string|null, starts_at: string, ends_at?: string|null }} opportunity
 * @param {{ id: string }} signup
 */
function renderSignupConfirmation(volunteer, opportunity, signup) {
  const locale = volunteer.locale === "zh-Hant" ? "zh-Hant" : "en";
  const title = pickLocale(opportunity, "title", locale);
  const location = pickLocale(opportunity, "location", locale);
  const when = formatWhen(opportunity.starts_at, opportunity.ends_at);
  const briefing = briefingUrl(signup.id);
  const zh = locale === "zh-Hant";

  const subject = zh ? `你已報名：${title}` : `You're confirmed: ${title}`;

  const lines = zh
    ? [
        `${volunteer.full_name} 你好，`,
        ``,
        `你的名額已確認。`,
        ``,
        `課堂：${title}`,
        `時間：${when}（香港時間）`,
        ...(location ? [`地點：${location}`] : []),
        ``,
        `出發前請先看簡介：${briefing}`,
        ``,
        `如果你未能出席，請盡早告訴我們，讓名額可以留給其他義工。`,
        ``,
        `Love 21 Foundation`,
      ]
    : [
        `Hi ${volunteer.full_name},`,
        ``,
        `Your spot is confirmed.`,
        ``,
        `Session:  ${title}`,
        `When:     ${when} (Hong Kong time)`,
        ...(location ? [`Where:    ${location}`] : []),
        ``,
        `Read the short briefing before you go: ${briefing}`,
        ``,
        `If you can no longer make it, tell us early so the spot can go to someone else.`,
        ``,
        `Love 21 Foundation`,
      ];

  const text = lines.join("\n");

  const html = [
    `<p>${escapeHtml(zh ? `${volunteer.full_name} 你好，` : `Hi ${volunteer.full_name},`)}</p>`,
    `<p>${escapeHtml(zh ? "你的名額已確認。" : "Your spot is confirmed.")}</p>`,
    `<p><strong>${escapeHtml(title)}</strong><br>${escapeHtml(when)}` +
      `${location ? `<br>${escapeHtml(location)}` : ""}</p>`,
    `<p><a href="${escapeHtml(briefing)}">${escapeHtml(zh ? "課堂簡介" : "Read the briefing")}</a></p>`,
  ].join("\n");

  return { subject, text, html };
}

module.exports = { renderThankYou, renderSignupConfirmation };
