const { test } = require('node:test')
const assert = require('node:assert/strict')
const {
  renderMonthlyDonorUpdate,
  sampleMonthlyDonorUpdate,
} = require('../../src/emails/monthly-donor-update')

test('monthly donor update includes cumulative, month stats, and session photo slots', () => {
  const sample = sampleMonthlyDonorUpdate()
  const { subject, html, text } = renderMonthlyDonorUpdate(sample)

  assert.match(subject, /July 2026/)
  assert.match(html, /Your cumulative impact/)
  assert.match(html, /HK\$4,500/)
  assert.match(html, /This month/)
  assert.match(html, /Saturday sports club/)
  assert.match(html, /Session photo coming soon/)
  assert.match(html, /About 10 participants/)
  assert.match(html, /helped make this session possible/)
  assert.match(html, /not an official Hong Kong Section 88/)
  assert.ok(html.includes(sample.trackUrl))
  assert.match(text, /Total given/)
  assert.ok(text.includes(sample.trackUrl))
})

test('monthly donor update supports zh-Hant copy', () => {
  const sample = sampleMonthlyDonorUpdate()
  sample.locale = 'zh-Hant'
  const { subject, html } = renderMonthlyDonorUpdate(sample)
  assert.match(subject, /捐助更新/)
  assert.match(html, /累計影響/)
  assert.match(html, /課堂照片稍後送上/)
})
