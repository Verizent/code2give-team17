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

/**
 * Post-payment thank-you for a **donor** (distinct from `renderThankYou` above, which is the
 * volunteer post-attendance email).
 *
 * This email carries the tracking link, and that link is the donor's only durable route back
 * to their giving history: the token is shown once on the thanks page and there is no
 * lookup-by-email endpoint, because one would answer "did this named person donate to a
 * disability charity" for anyone who asked. So the inbox is the store of record. Losing this
 * email means losing the history.
 *
 * A **link**, never a snapshot of the page. Allocations get assigned, sessions complete, and
 * attendance lands afterwards — an inlined copy of today's page is wrong within a week, and
 * this is the one artefact the donor keeps.
 *
 * `trackingUrl` is null when the donor opted out of tracking. They still get the receipt.
 *
 * @param {{ full_name?: string|null, locale?: string }} donor
 * @param {{ amount_hkd: number, frequency: string, events_credited: number }} donation
 * @param {string|null} trackingUrl
 * @returns {{ subject: string, text: string, html: string }}
 */
function renderDonorThankYou(donor, donation, trackingUrl, sessions = []) {
  const locale = donor.locale === "zh-Hant" ? "zh-Hant" : "en";
  const name = donor.full_name?.trim() || null;
  const credited = Number(donation.events_credited || 0);
  const recurring = donation.frequency === "weekly" || donation.frequency === "monthly";
  const lines = sessions.map((s) => sessionLines(s, locale));

  return locale === "zh-Hant"
    ? renderDonorChinese({ name, credited, recurring, trackingUrl, donation, lines })
    : renderDonorEnglish({ name, credited, recurring, trackingUrl, donation, lines });
}

/**
 * `Asia/Hong_Kong` explicitly: the server's own timezone is not the donor's, and a session at
 * 10:00 UTC is an 18:00 class in Hong Kong. Getting this wrong puts the wrong evening in a
 * donor's inbox.
 *
 * Parts are read off `formatToParts` rather than the formatted string, because the assembled
 * output differs by ICU version — the same trap `donation-periods.js` documents for month
 * abbreviations ("Sep" vs "Sept").
 */
const HKT_PARTS = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Hong_Kong",
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function formatHkt(iso) {
  const bag = Object.fromEntries(
    HKT_PARTS.formatToParts(new Date(iso)).map((p) => [p.type, p.value]),
  );
  return `${bag.weekday} ${bag.day} ${bag.month} · ${bag.hour}:${bag.minute}`;
}

/** One session → its two display lines: title, then when and where. */
function sessionLines(session, locale) {
  const title = pickLocale(session, "title", locale) || "Love 21 session";
  const location = pickLocale(session, "location", locale);
  const when = session.starts_at ? formatHkt(session.starts_at) : null;
  const detail = [when, location].filter(Boolean).join(" · ");
  return { title, detail };
}

/** Renders the session block, or nothing when allocation found no eligible sessions. */
function sessionBlock(lines, heading) {
  if (lines.length === 0) return [];
  return [``, heading, ``, ...lines.flatMap((l) => [`  • ${l.title}`, `    ${l.detail}`])];
}

function cadenceEn(frequency) {
  if (frequency === "weekly") return "every week";
  if (frequency === "monthly") return "every month";
  return null;
}

function renderDonorEnglish({ name, credited, recurring, trackingUrl, donation, lines: sessions }) {
  const subject = `Thank you for your gift to Love 21`;
  const cadence = cadenceEn(donation.frequency);

  // The amount is deliberately absent. The donor knows what they paid — Stripe has already
  // receipted it — and this email is about what the money does, not what it cost.
  const lines = [
    name ? `Hi ${name},` : `Hi,`,
    ``,
    recurring
      ? `Thank you for setting up a gift to Love 21 ${cadence}.`
      : `Thank you for your gift to Love 21.`,
  ];

  lines.push(
    ...sessionBlock(
      sessions,
      credited === 1 ? `It supports this session:` : `It supports these ${credited} sessions:`,
    ),
  );

  // Allocation can come up short when too few sessions sit in the eligibility window. Saying
  // nothing would be better than promising a list that is not there.
  if (sessions.length === 0) {
    lines.push(
      ``,
      credited === 1
        ? `It supports the next session we run for our members.`
        : `It supports the next ${credited} sessions we run for our members.`,
    );
  }

  if (trackingUrl) {
    lines.push(
      ``,
      `You can follow how they go here:`,
      trackingUrl,
      ``,
      // Said plainly because it is true and there is no recovery flow behind it.
      `Keep this email. That link is the only way back to your giving history, and we cannot look it up from your email address.`,
    );
  }

  lines.push(
    ``,
    `Donations of HK$100 or more are tax-deductible under Section 88.`,
    ``,
    `With thanks,`,
    `Love 21 Foundation`,
  );

  const text = lines.join("\n");
  const html = `<p>${lines
    .map((line) =>
      line === trackingUrl && trackingUrl
        ? `<a href="${escapeHtml(line)}">${escapeHtml(line)}</a>`
        : escapeHtml(line),
    )
    .join("<br>")}</p>`;

  return { subject, text, html };
}

function renderDonorChinese({ name, credited, recurring, trackingUrl, donation, lines: sessions }) {
  const subject = `感謝你對 Love 21 的捐助`;
  const cadence = donation.frequency === "weekly" ? "每星期" : "每月";

  const lines = [
    name ? `${name} 你好，` : `你好，`,
    ``,
    recurring ? `感謝你設立${cadence}捐助支持 Love 21。` : `感謝你捐助支持 Love 21。`,
  ];

  lines.push(
    ...sessionBlock(
      sessions,
      credited === 1 ? `這份捐助支持以下活動：` : `這份捐助支持以下 ${credited} 節活動：`,
    ),
  );

  if (sessions.length === 0) {
    lines.push(
      ``,
      credited === 1
        ? `這份捐助支持我們為成員舉辦的下一節活動。`
        : `這份捐助支持我們為成員舉辦的下 ${credited} 節活動。`,
    );
  }

  if (trackingUrl) {
    lines.push(
      ``,
      `你可以在這裡查看這些活動的進展：`,
      trackingUrl,
      ``,
      `請保留這封電郵。此連結是查看你捐助紀錄的唯一途徑，我們無法憑電郵地址代為查詢。`,
    );
  }

  lines.push(``, `HK$100 或以上的捐款可根據稅務條例第 88 條申請扣稅。`, ``, `Love 21 Foundation 謹啟`);

  const text = lines.join("\n");
  const html = `<p>${lines
    .map((line) =>
      line === trackingUrl && trackingUrl
        ? `<a href="${escapeHtml(line)}">${escapeHtml(line)}</a>`
        : escapeHtml(line),
    )
    .join("<br>")}</p>`;

  return { subject, text, html };
}

/**
 * "A session you supported has happened" — sent the moment attendance is recorded, not on the
 * 15th/EOM boundary.
 *
 * The batch email answers "what happened this fortnight"; this one answers "the thing you paid
 * for just took place". A donor who gave for a specific class should hear about that class
 * while it is still the thing they remember doing, not up to two weeks later.
 *
 * @param {{ full_name?: string|null, locale?: string }} donor
 * @param {{ title_en?: string, title_zh?: string|null, location_en?: string,
 *   location_zh?: string|null, starts_at?: string, attendance_count?: number|null }} session
 * @param {string|null} trackingUrl
 */
function renderSessionUpdate(donor, session, trackingUrl) {
  const locale = donor.locale === "zh-Hant" ? "zh-Hant" : "en";
  const name = donor.full_name?.trim() || null;
  const title = pickLocale(session, "title", locale) || "a Love 21 session";
  const location = pickLocale(session, "location", locale);
  const when = session.starts_at ? formatHkt(session.starts_at) : null;
  // Null means staff have not recorded a headcount yet — distinct from a session nobody came
  // to. Saying "0 members came along" about a class that ran fine is a worse lie than saying
  // nothing, so the line is omitted entirely.
  //
  // Tested against `Number(x)` deliberately: `Number(null)` is 0, which IS finite, so a
  // `Number.isFinite(Number(...))` guard reports every unrecorded session as zero attendance.
  const raw = session.attendance_count;
  const attended = raw === null || raw === undefined || raw === "" ? null : Number(raw);

  return locale === "zh-Hant"
    ? renderSessionUpdateChinese({ name, title, location, when, attended, trackingUrl })
    : renderSessionUpdateEnglish({ name, title, location, when, attended, trackingUrl });
}

function renderSessionUpdateEnglish({ name, title, location, when, attended, trackingUrl }) {
  const lines = [
    name ? `Hi ${name},` : `Hi,`,
    ``,
    `A session your gift supported has just happened.`,
    ``,
    `  ${title}`,
    `  ${[when, location].filter(Boolean).join(" · ")}`,
  ];

  if (attended !== null) {
    lines.push(
      ``,
      attended === 1
        ? `One member came along.`
        : `${attended} members came along.`,
    );
  }

  if (trackingUrl) {
    lines.push(``, `Everything your giving supports:`, trackingUrl);
  }

  lines.push(``, `Thank you,`, `Love 21 Foundation`);

  const text = lines.join("\n");
  const html = `<p>${lines
    .map((line) =>
      line === trackingUrl && trackingUrl
        ? `<a href="${escapeHtml(line)}">${escapeHtml(line)}</a>`
        : escapeHtml(line),
    )
    .join("<br>")}</p>`;

  return { subject: `${title} — a session you supported has happened`, text, html };
}

function renderSessionUpdateChinese({ name, title, location, when, attended, trackingUrl }) {
  const lines = [
    name ? `${name} 你好，` : `你好，`,
    ``,
    `你捐助支持的一節活動剛剛舉行了。`,
    ``,
    `  ${title}`,
    `  ${[when, location].filter(Boolean).join(" · ")}`,
  ];

  if (attended !== null) {
    lines.push(``, `共有 ${attended} 位成員參加。`);
  }

  if (trackingUrl) {
    lines.push(``, `查看你的捐助支持的所有活動：`, trackingUrl);
  }

  lines.push(``, `謝謝你，`, `Love 21 Foundation 謹啟`);

  const text = lines.join("\n");
  const html = `<p>${lines
    .map((line) =>
      line === trackingUrl && trackingUrl
        ? `<a href="${escapeHtml(line)}">${escapeHtml(line)}</a>`
        : escapeHtml(line),
    )
    .join("<br>")}</p>`;

  return { subject: `${title} — 你支持的活動已經舉行`, text, html };
}

module.exports = { renderThankYou, renderDonorThankYou, renderSessionUpdate };
