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

module.exports = { renderThankYou };
