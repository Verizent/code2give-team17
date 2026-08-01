/**
 * Monthly donor tracking update — HTML + text email for Resend (§15, §17).
 *
 * Guests can donate without an account; this email is the ongoing tracking
 * thread keyed on normalised donor email + access_token.
 *
 * Copy rule: never "your money paid for this" — always "helped make possible".
 * Not a Section 88 tax receipt.
 *
 * @typedef {object} MonthlyDonorSession
 * @property {string} title
 * @property {string} programme
 * @property {string} whenLabel
 * @property {string} [place]
 * @property {number} peopleHelped
 * @property {string | null} [photoUrl]  Absolute URL; null = photo placeholder
 * @property {string | null} [note]
 *
 * @typedef {object} MonthlyDonorUpdateInput
 * @property {string} donorName
 * @property {'en' | 'zh-Hant' | 'zh-Hans'} [locale]
 * @property {string} periodLabel          e.g. "July 2026"
 * @property {string} trackUrl             Tokenised tracking page for this edition
 * @property {{
 *   totalGivenHkd: number,
 *   sessionsSupported: number,
 *   peopleHelped: number,
 *   giftCount: number,
 *   supporterSinceLabel: string,
 * }} cumulative
 * @property {{
 *   givenHkd: number,
 *   sessionsRan: number,
 *   peopleHelped: number,
 *   giftsReceived: number,
 * }} month
 * @property {MonthlyDonorSession[]} sessions
 */

const BRAND = {
  navy: '#14284b',
  teal: '#00857d',
  red: '#e4002b',
  yellow: '#ffc72c',
  paper: '#fffdf7',
  muted: '#5a5a5a',
  line: '#e5e1d8',
}

/**
 * @param {number} n
 * @param {string} [locale]
 */
function money(n, locale = 'en') {
  const formatted = Math.round(Number(n) || 0).toLocaleString(
    locale === 'zh-Hans' ? 'zh-CN' : locale === 'zh-Hant' ? 'zh-HK' : 'en-HK',
  )
  return `HK$${formatted}`
}

/**
 * @param {MonthlyDonorUpdateInput} input
 */
function copyFor(input) {
  const locale = input.locale || 'en'
  if (locale === 'zh-Hant' || locale === 'zh-Hans') {
    const trad = locale === 'zh-Hant'
    return {
      subject: `你的 Love 21 捐助更新 · ${input.periodLabel}`,
      preheader: `${input.periodLabel}：${input.month.sessionsRan} 節課堂，幫助約 ${input.month.peopleHelped} 人。`,
      greeting: `你好 ${input.donorName}，`,
      intro: `這是你 ${input.periodLabel} 的捐助追蹤更新。以下是本月發生的事，以及你至今累計的支持。`,
      cumulativeTitle: '累計影響',
      monthTitle: `本月 · ${input.periodLabel}`,
      labelGiven: '累計捐助',
      labelSessions: '已支持課堂',
      labelPeople: '累計幫助人數',
      labelGifts: '捐助次數',
      labelSince: '支持者自',
      monthGiven: '本月捐助',
      monthSessions: '本月課堂',
      monthPeople: '本月幫助人數',
      monthGifts: '本月收到的捐助',
      sessionsTitle: '本月舉行的課堂',
      photoPending: '課堂照片稍後送上',
      peopleAtSession: '約 {n} 位參加者',
      helpedLine: '你的捐助有助這節課堂得以舉行。',
      cta: '查看完整追蹤頁',
      emptySessions: '本月尚未有已完成的課堂更新——有消息時我們會再寄。',
      footerNote:
        '這是捐助用途更新，不是香港稅務條例第 88 條正式收據。正式收據另按申請寄出。',
      footerPrivacy: '你收到此電郵是因為你選擇接收捐助追蹤更新。',
      orgLine: 'Love 21 Foundation · 愛二十一',
    }
  }
  return {
    subject: `Your Love 21 gift update · ${input.periodLabel}`,
    preheader: `${input.periodLabel}: ${input.month.sessionsRan} sessions, about ${input.month.peopleHelped} people reached.`,
    greeting: `Hi ${input.donorName},`,
    intro: `Here is your gift-tracking update for ${input.periodLabel} — what happened this month, and your cumulative support so far.`,
    cumulativeTitle: 'Your cumulative impact',
    monthTitle: `This month · ${input.periodLabel}`,
    labelGiven: 'Total given',
    labelSessions: 'Sessions supported',
    labelPeople: 'People helped (all time)',
    labelGifts: 'Gifts',
    labelSince: 'Supporter since',
    monthGiven: 'Given this month',
    monthSessions: 'Sessions that ran',
    monthPeople: 'People helped this month',
    monthGifts: 'Gifts received this month',
    sessionsTitle: 'Sessions this month',
    photoPending: 'Session photo coming soon',
    peopleAtSession: 'About {n} participants',
    helpedLine: 'Your gift helped make this session possible.',
    cta: 'Open your tracking page',
    emptySessions:
      'No completed session updates this month yet — we’ll write again when there is news.',
    footerNote:
      'This is a gift-use update, not an official Hong Kong Section 88 tax receipt. Official receipts are issued separately on request.',
    footerPrivacy: 'You’re receiving this because you opted in to gift-journey updates.',
    orgLine: 'Love 21 Foundation',
  }
}

/**
 * @param {string | null | undefined} photoUrl
 * @param {string} placeholderLabel
 */
function photoBlock(photoUrl, placeholderLabel) {
  if (photoUrl) {
    return `
      <tr>
        <td style="padding:0 0 12px 0;">
          <img src="${escapeAttr(photoUrl)}" alt="" width="520" style="display:block;width:100%;max-width:520px;height:auto;border-radius:12px;border:1px solid ${BRAND.line};" />
        </td>
      </tr>`
  }
  return `
      <tr>
        <td style="padding:0 0 12px 0;">
          <div style="background:${BRAND.paper};border:2px dashed ${BRAND.line};border-radius:12px;padding:48px 20px;text-align:center;color:${BRAND.muted};font-size:14px;line-height:1.5;">
            ${escapeHtml(placeholderLabel)}
          </div>
        </td>
      </tr>`
}

/**
 * @param {string} value
 */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * @param {string} value
 */
function escapeAttr(value) {
  return escapeHtml(value).replace(/'/g, '&#39;')
}

/**
 * @param {MonthlyDonorUpdateInput} input
 * @returns {{ subject: string, html: string, text: string }}
 */
function renderMonthlyDonorUpdate(input) {
  const c = copyFor(input)
  const locale = input.locale || 'en'
  const sessions = Array.isArray(input.sessions) ? input.sessions : []

  const sessionHtml =
    sessions.length === 0
      ? `<p style="margin:0;color:${BRAND.muted};font-size:15px;line-height:1.6;">${escapeHtml(c.emptySessions)}</p>`
      : sessions
          .map((session) => {
            const people = c.peopleAtSession.replace(
              '{n}',
              String(session.peopleHelped ?? 0),
            )
            return `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px 0;border:1px solid ${BRAND.line};border-radius:16px;overflow:hidden;">
                <tr>
                  <td style="padding:20px 20px 8px 20px;">
                    <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:${BRAND.teal};">
                      ${escapeHtml(session.programme)}
                    </p>
                    <h3 style="margin:8px 0 4px 0;font-family:Georgia,'Times New Roman',serif;font-size:20px;line-height:1.3;color:${BRAND.navy};">
                      ${escapeHtml(session.title)}
                    </h3>
                    <p style="margin:0 0 12px 0;font-size:14px;color:${BRAND.muted};">
                      ${escapeHtml(session.whenLabel)}${session.place ? ` · ${escapeHtml(session.place)}` : ''}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      ${photoBlock(session.photoUrl ?? null, c.photoPending)}
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 20px 20px 20px;">
                    <p style="margin:0 0 6px 0;font-size:15px;font-weight:700;color:${BRAND.navy};">
                      ${escapeHtml(people)}
                    </p>
                    <p style="margin:0;font-size:14px;line-height:1.55;color:${BRAND.muted};">
                      ${escapeHtml(c.helpedLine)}
                      ${session.note ? ` ${escapeHtml(session.note)}` : ''}
                    </p>
                  </td>
                </tr>
              </table>`
          })
          .join('')

  const html = `<!DOCTYPE html>
<html lang="${locale === 'en' ? 'en' : 'zh'}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(c.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f3f1eb;color:${BRAND.navy};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    ${escapeHtml(c.preheader)}
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f1eb;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid ${BRAND.line};">
          <tr>
            <td style="background:${BRAND.navy};padding:28px 28px 24px 28px;">
              <p style="margin:0 0 8px 0;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.yellow};">
                Love 21
              </p>
              <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.2;color:#ffffff;">
                ${escapeHtml(c.monthTitle)}
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 28px 8px 28px;">
              <p style="margin:0 0 12px 0;font-size:16px;line-height:1.6;color:${BRAND.navy};">
                ${escapeHtml(c.greeting)}
              </p>
              <p style="margin:0 0 24px 0;font-size:15px;line-height:1.65;color:${BRAND.muted};">
                ${escapeHtml(c.intro)}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 28px 24px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BRAND.paper};border-radius:16px;border:1px solid ${BRAND.line};">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 14px 0;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND.teal};">
                      ${escapeHtml(c.cumulativeTitle)}
                    </p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="50%" style="padding:0 8px 12px 0;vertical-align:top;">
                          <p style="margin:0;font-size:12px;color:${BRAND.muted};">${escapeHtml(c.labelGiven)}</p>
                          <p style="margin:4px 0 0 0;font-size:22px;font-weight:700;color:${BRAND.navy};">${money(input.cumulative.totalGivenHkd, locale)}</p>
                        </td>
                        <td width="50%" style="padding:0 0 12px 8px;vertical-align:top;">
                          <p style="margin:0;font-size:12px;color:${BRAND.muted};">${escapeHtml(c.labelSessions)}</p>
                          <p style="margin:4px 0 0 0;font-size:22px;font-weight:700;color:${BRAND.navy};">${escapeHtml(String(input.cumulative.sessionsSupported))}</p>
                        </td>
                      </tr>
                      <tr>
                        <td width="50%" style="padding:0 8px 0 0;vertical-align:top;">
                          <p style="margin:0;font-size:12px;color:${BRAND.muted};">${escapeHtml(c.labelPeople)}</p>
                          <p style="margin:4px 0 0 0;font-size:22px;font-weight:700;color:${BRAND.navy};">${escapeHtml(String(input.cumulative.peopleHelped))}</p>
                        </td>
                        <td width="50%" style="padding:0 0 0 8px;vertical-align:top;">
                          <p style="margin:0;font-size:12px;color:${BRAND.muted};">${escapeHtml(c.labelGifts)} · ${escapeHtml(c.labelSince)}</p>
                          <p style="margin:4px 0 0 0;font-size:15px;font-weight:700;color:${BRAND.navy};">
                            ${escapeHtml(String(input.cumulative.giftCount))} · ${escapeHtml(input.cumulative.supporterSinceLabel)}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 28px 24px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid ${BRAND.line};border-radius:16px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 14px 0;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND.red};">
                      ${escapeHtml(c.monthTitle)}
                    </p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="50%" style="padding:0 8px 12px 0;vertical-align:top;">
                          <p style="margin:0;font-size:12px;color:${BRAND.muted};">${escapeHtml(c.monthGiven)}</p>
                          <p style="margin:4px 0 0 0;font-size:20px;font-weight:700;color:${BRAND.navy};">${money(input.month.givenHkd, locale)}</p>
                        </td>
                        <td width="50%" style="padding:0 0 12px 8px;vertical-align:top;">
                          <p style="margin:0;font-size:12px;color:${BRAND.muted};">${escapeHtml(c.monthSessions)}</p>
                          <p style="margin:4px 0 0 0;font-size:20px;font-weight:700;color:${BRAND.navy};">${escapeHtml(String(input.month.sessionsRan))}</p>
                        </td>
                      </tr>
                      <tr>
                        <td width="50%" style="padding:0 8px 0 0;vertical-align:top;">
                          <p style="margin:0;font-size:12px;color:${BRAND.muted};">${escapeHtml(c.monthPeople)}</p>
                          <p style="margin:4px 0 0 0;font-size:20px;font-weight:700;color:${BRAND.navy};">${escapeHtml(String(input.month.peopleHelped))}</p>
                        </td>
                        <td width="50%" style="padding:0 0 0 8px;vertical-align:top;">
                          <p style="margin:0;font-size:12px;color:${BRAND.muted};">${escapeHtml(c.monthGifts)}</p>
                          <p style="margin:4px 0 0 0;font-size:20px;font-weight:700;color:${BRAND.navy};">${escapeHtml(String(input.month.giftsReceived))}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 28px 8px 28px;">
              <h2 style="margin:0 0 16px 0;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:${BRAND.navy};">
                ${escapeHtml(c.sessionsTitle)}
              </h2>
              ${sessionHtml}
            </td>
          </tr>

          <tr>
            <td style="padding:8px 28px 28px 28px;" align="center">
              <a href="${escapeAttr(input.trackUrl)}" style="display:inline-block;background:${BRAND.red};color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;">
                ${escapeHtml(c.cta)}
              </a>
            </td>
          </tr>

          <tr>
            <td style="padding:0 28px 28px 28px;border-top:1px solid ${BRAND.line};">
              <p style="margin:20px 0 8px 0;font-size:12px;line-height:1.55;color:${BRAND.muted};">
                ${escapeHtml(c.footerNote)}
              </p>
              <p style="margin:0 0 8px 0;font-size:12px;line-height:1.55;color:${BRAND.muted};">
                ${escapeHtml(c.footerPrivacy)}
              </p>
              <p style="margin:0;font-size:12px;color:${BRAND.navy};font-weight:600;">
                ${escapeHtml(c.orgLine)}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const textLines = [
    c.greeting,
    '',
    c.intro,
    '',
    c.cumulativeTitle,
    `- ${c.labelGiven}: ${money(input.cumulative.totalGivenHkd, locale)}`,
    `- ${c.labelSessions}: ${input.cumulative.sessionsSupported}`,
    `- ${c.labelPeople}: ${input.cumulative.peopleHelped}`,
    `- ${c.labelGifts}: ${input.cumulative.giftCount}`,
    `- ${c.labelSince}: ${input.cumulative.supporterSinceLabel}`,
    '',
    c.monthTitle,
    `- ${c.monthGiven}: ${money(input.month.givenHkd, locale)}`,
    `- ${c.monthSessions}: ${input.month.sessionsRan}`,
    `- ${c.monthPeople}: ${input.month.peopleHelped}`,
    `- ${c.monthGifts}: ${input.month.giftsReceived}`,
    '',
    c.sessionsTitle,
  ]

  if (sessions.length === 0) {
    textLines.push(c.emptySessions)
  } else {
    for (const session of sessions) {
      textLines.push(
        `• ${session.title} (${session.programme}) — ${session.whenLabel}`,
        `  ${c.peopleAtSession.replace('{n}', String(session.peopleHelped ?? 0))}`,
        `  ${c.helpedLine}${session.note ? ` ${session.note}` : ''}`,
        '',
      )
    }
  }

  textLines.push(c.cta, input.trackUrl, '', c.footerNote, c.orgLine)

  return {
    subject: c.subject,
    html,
    text: textLines.join('\n'),
  }
}

/** Sample payload for demos and preview HTML. */
function sampleMonthlyDonorUpdate() {
  /** @type {MonthlyDonorUpdateInput} */
  const sample = {
    donorName: 'Alex',
    locale: 'en',
    periodLabel: 'July 2026',
    trackUrl: 'https://love21foundation.com/give/track/demo-token-july-2026',
    cumulative: {
      totalGivenHkd: 4500,
      sessionsSupported: 6,
      peopleHelped: 48,
      giftCount: 4,
      supporterSinceLabel: 'March 2026',
    },
    month: {
      givenHkd: 1000,
      sessionsRan: 2,
      peopleHelped: 18,
      giftsReceived: 1,
    },
    sessions: [
      {
        title: 'Saturday sports club',
        programme: 'Sports',
        whenLabel: '12 July 2026',
        place: 'San Po Kong',
        peopleHelped: 10,
        photoUrl: null,
        note: 'Members practised floor curling with volunteer helpers.',
      },
      {
        title: 'Nutrition workshop',
        programme: 'Nutrition',
        whenLabel: '26 July 2026',
        place: 'San Po Kong',
        peopleHelped: 8,
        photoUrl: null,
        note: 'Families tried new textures together.',
      },
    ],
  }
  return sample
}

module.exports = {
  renderMonthlyDonorUpdate,
  sampleMonthlyDonorUpdate,
  BRAND,
}
