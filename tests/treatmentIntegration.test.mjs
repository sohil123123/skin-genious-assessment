import test from 'node:test'
import assert from 'node:assert/strict'
import { treatmentHistoryFlags, inClinicProductRecords } from '../src/utils/facial/5_light_modes/treatmentIntegration.js'
import { buildTreatmentPlannerInput } from '../src/utils/facial/5_light_modes/treatmentClinicRules.js'
import { formatFacialClientScores } from '../src/utils/facial/clientScoreDisplay.js'
import { available_skincare_products } from '../src/utils/facial/5_light_modes/treatment/productJson.js'

test('missing intake answers stay unknown; actual yes/no and named history map to declared conditions', () => {
  assert.deepEqual(treatmentHistoryFlags({}), {})
  const flags = treatmentHistoryFlags({ is_pregnant: false, breastfeeding: 'yes',
    upcoming_travel: 'yes', daily_sun_exposure_hours: 'More than 2 hours',
    medical_history: ['Blood thinners'], allergies: ['Salicylic Acid', 'Vitamin C'] })
  assert.equal(flags.pregnant, false)
  assert.equal(flags.breastfeeding, true)
  assert.equal(flags.travel_within_7_days, true)
  assert.equal(flags.sun_exposure_gt_2_hours, true)
  assert.equal(flags.on_blood_thinners, true)
  assert.equal(flags.vitamin_c_allergy, true)
  assert.equal(flags.used_salicylic_yesterday, undefined)
})

test('planner restores the exact original diagnosis and selected target after client formatting', () => {
  const row = { parameter_name: 'Superficial Pigmentation Score', score_or_label: 70.235,
    target_single_session_score: 61.917, score_polarity: 'higher_is_worse', is_primary_concern: true }
  const display = formatFacialClientScores({ diagnosis_report: { superficial_pigmentation: row } })
  assert.notEqual(display.diagnosis_report.superficial_pigmentation.score_or_label, row.score_or_label)
  const input = buildTreatmentPlannerInput(display, [display.diagnosis_report.superficial_pigmentation], 'single')
  assert.equal(input.diagnosis_report.superficial_pigmentation.score_or_label, 70.235)
  assert.equal(input.treatable_concerns.parameters_with_abnormal_scores[0].target_single_session_score, 61.917)
})

test('clinic product prefix includes complete cleanser/finish records and excludes retinol and hair care', () => {
  const records = inClinicProductRecords(available_skincare_products)
  assert.equal(records.length, 6)
  assert.ok(records.every(record => record.ingredients && Object.hasOwn(record, 'safe_in_pregnancy')))
  assert.ok(records.some(record => record.name.includes('Cleanser')))
  assert.ok(records.some(record => record.name.includes('Sunscreen')))
  assert.ok(records.every(record => !/Retinol|Hair Growth/.test(record.name)))
})
