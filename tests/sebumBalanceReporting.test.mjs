import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { compareSebumBalance, resolveSebumReportingReference } from '../src/utils/facial/sebumBalanceReporting.js'
import { formatFacialClientScores, prepareFacialEngineInput } from '../src/utils/facial/clientScoreDisplay.js'

const fixtures = JSON.parse(readFileSync(new URL('./fixtures/sebumBalanceReporting.json', import.meta.url)))
const baseline = (target = 50) => ({ diagnosis_report: { skin_sebum_content: {
  parameter_name: 'Skin Sebum Index', score_or_label: 25.15, target_single_session_score: target,
} } })
const report = (before = 25, after = 40) => ({ reassessment: { skin_sebum_content: {
  parameter_name: 'Skin Sebum Content', before_treatment_score_or_label: before,
  post_treatment_score_or_label: after, result: 'declined', raw_comparison_result_internal: 'declined',
  score_explanation: 'Original engine explanation.', base_post_score_or_label_internal: 99,
} } })

for (const fixture of fixtures) test(fixture.name, () => {
  const result = compareSebumBalance(fixture.before, fixture.after, fixture.reference)
  assert.equal(result.result, fixture.result)
  assert.equal(result.status, fixture.status)
  assert.ok(Math.abs(result.change_points - fixture.gain) < 1e-9)
})

test('report interpretation preserves all original engine fields, numbers and input objects', () => {
  const raw = report(80.123, 45.456), before = structuredClone(raw)
  const result = formatFacialClientScores(raw, { sebumBaseline: baseline() })
  const row = result.reassessment.skin_sebum_content
  assert.equal(row.result, 'improved')
  assert.equal(row.before_treatment_score_or_label, 80)
  assert.equal(row.post_treatment_score_or_label, 45)
  assert.equal(row.base_post_score_or_label_internal, 99, 'an internal score is never substituted for the reported measurement')
  assert.deepEqual(raw, before)
  assert.deepEqual(prepareFacialEngineInput(result), raw)
  assert.deepEqual(formatFacialClientScores(result), result, 'saved/reloaded reports stay idempotent')
})

test('sebum without a target is stable even if an old engine label says improved', () => {
  const raw = report(); raw.reassessment.skin_sebum_content.result = 'improved'
  const row = formatFacialClientScores(raw).reassessment.skin_sebum_content
  assert.equal(row.result, 'stable')
  assert.equal(row.report_comparison_status, 'review_required')
})

for (const after of ['unknown', undefined]) test(`invalid or missing post measurement (${after}) cannot surface a declined sebum result`, () => {
  const raw = report(25, after)
  if (after === undefined) delete raw.reassessment.skin_sebum_content.post_treatment_score_or_label
  const formatted = formatFacialClientScores(raw, { sebumBaseline: baseline() })
  assert.equal(formatted.reassessment.skin_sebum_content.result, 'stable')
  assert.equal(formatted.reassessment.skin_sebum_content.report_comparison_status, 'review_required')
  assert.deepEqual(prepareFacialEngineInput(formatted), raw)
})

test('legacy exports without added_fields restore the original engine data exactly', () => {
  const raw = report()
  delete raw.reassessment.skin_sebum_content.score_explanation
  const exported = formatFacialClientScores(raw, { sebumBaseline: baseline() })
  delete exported.reassessment.skin_sebum_content._facial_score_display.added_fields
  assert.deepEqual(prepareFacialEngineInput(exported), raw)
  assert.equal(formatFacialClientScores(exported).reassessment.skin_sebum_content.result, 'improved')
})

test('later sessions carry the established reference, independent of the old before score', () => {
  const first = formatFacialClientScores(report(), { sebumBaseline: baseline() })
  const second = formatFacialClientScores(report(40, 48), { sebumBaseline: first })
  assert.equal(second.reassessment.skin_sebum_content.result, 'improved')
  assert.deepEqual(second.reassessment.skin_sebum_content._facial_score_display.reporting_reference, { target: 50 })
  const third = formatFacialClientScores(report(48, 49), { sebumBaseline: second })
  assert.equal(third.reassessment.skin_sebum_content.result, 'improved')
})

test('original diagnosis supplies the reference for old sessions that never stored one', () => {
  const second = formatFacialClientScores(report(40, 48), { sebumBaseline: report(), sebumOriginalBaseline: baseline() })
  assert.equal(second.reassessment.skin_sebum_content.result, 'improved')
})

test('conflicting references require review instead of falling back to a favourable target', () => {
  const conflict = { ...baseline(), selected: [{ parameter: 'Skin Sebum Index', current_score: 25, target_score: 70 }] }
  assert.deepEqual(resolveSebumReportingReference(conflict), { status: 'review_required' })
  const row = formatFacialClientScores(report(), { sebumBaseline: conflict, sebumOriginalBaseline: baseline() }).reassessment.skin_sebum_content
  assert.equal(row.result, 'stable')
  assert.equal(row.report_comparison_status, 'review_required')
})

test('ranges are reused only when explicitly supplied on the score scale', () => {
  const base = baseline(); base.diagnosis_report.skin_sebum_content.balance_target_range = [40, 60]
  const row = formatFacialClientScores(report(42, 58), { sebumBaseline: base }).reassessment.skin_sebum_content
  assert.equal(row.result, 'stable')
  assert.equal(row.report_comparison_status, 'balanced')
  assert.deepEqual(resolveSebumReportingReference(base), { range: [40, 60] })
})

test('other parameters retain their existing display and engine restoration behavior', () => {
  const raw = { reassessment: { skin_hydration_score: { parameter_name: 'Skin Hydration Score',
    before_treatment_score_or_label: 40.2, post_treatment_score_or_label: 60.3, result: 'improved' } } }
  assert.deepEqual(formatFacialClientScores(raw, { sebumBaseline: baseline() }), formatFacialClientScores(raw))
  assert.deepEqual(prepareFacialEngineInput(formatFacialClientScores(raw)), raw)
})
