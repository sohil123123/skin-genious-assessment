import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  buildClinicTreatmentContext, buildUnderEyeTreatmentContext, buildTreatmentPlannerInput,
  finalizeTreatmentPlan, validateClinicTreatmentPlan,
} from '../src/utils/facial/5_light_modes/treatmentClinicRules.js'
import { buildTreatmentEligibility } from '../src/utils/facial/5_light_modes/treatmentEligibility.js'
import { LIVE_MOTHER_REFERENCE, compileTreatmentKnowledgeReference } from '../src/utils/facial/5_light_modes/treatmentKnowledge.js'
import { generateTreatmentPlan, buildTreatmentModelRequest } from '../src/utils/facial/5_light_modes/treatmentPipeline.js'
import { formatFacialClientScores } from '../src/utils/facial/clientScoreDisplay.js'

// Historical v5.6 amendment coverage; active live-flow data has its own tests.
const constraints = JSON.parse(await readFile(new URL('./fixtures/v5_6_constraints.json', import.meta.url), 'utf8'))
const case91 = JSON.parse(await readFile(new URL('./fixtures/case91.json', import.meta.url), 'utf8'))
const clone = value => structuredClone(value)
const eyeDiagnosis = row => ({ diagnosis_report: { periorbital_health: { parameter_name: 'Peri-Orbital Health Score', ...row } } })

test('periocular display threshold includes 70, excludes 71, and preserves raw/display equivalence', () => {
  for (const [score, trigger] of [[69, true], [70, true], [71, false]]) {
    const source = eyeDiagnosis({ score_or_label: score, score_polarity: 'higher_is_better' })
    assert.equal(buildUnderEyeTreatmentContext(source).trigger, trigger)
  }
  const raw = eyeDiagnosis({ score_or_label: 31, score_polarity: 'higher_is_worse' })
  const displayed = formatFacialClientScores(raw)
  assert.equal(buildUnderEyeTreatmentContext(raw).client_display_score, 70)
  assert.deepEqual(buildUnderEyeTreatmentContext(displayed), buildUnderEyeTreatmentContext(raw))
  const explicit = eyeDiagnosis({ score_or_label: 1, score_polarity: 'higher_is_worse', client_display_score: 70 })
  assert.equal(buildUnderEyeTreatmentContext(explicit).trigger, true)
  assert.equal(buildUnderEyeTreatmentContext(eyeDiagnosis({ score_or_label: 0.7 })).trigger, false)
  assert.equal(buildUnderEyeTreatmentContext({}).trigger, false)
})

test('a supplied periocular display score triggers without a second finding/assessability gate', () => {
  const diagnosis = eyeDiagnosis({ client_display_score: 70, assessable: false, backend_details: {} })
  assert.equal(buildClinicTreatmentContext(diagnosis).under_eye_infusion.trigger, true)
  const input = buildTreatmentPlannerInput(diagnosis, [], 'single', { lip_pigmentation: { trigger: false } }, constraints)
  assert.equal(input.clinic_treatment_context.under_eye_infusion.trigger, true)
})

test('explicit lip display scores take precedence while cosmetic occlusion still blocks the trigger', () => {
  const diagnosis = { diagnosis_report: { lip_pigmentation: {
    parameter_name: 'Lip Pigmentation Score', score_or_label: 1, score_polarity: 'higher_is_worse', client_display_score: 69,
  } } }
  assert.equal(buildClinicTreatmentContext(diagnosis).lip_pigmentation.trigger, true)
  diagnosis.diagnosis_report.lip_pigmentation.lipstick_present = true
  assert.equal(buildClinicTreatmentContext(diagnosis).lip_pigmentation.trigger, false)
})

function ocularCase() {
  const original = case91.planner_input
  const diagnosis = { diagnosis_report: clone(original.diagnosis_report) }
  diagnosis.diagnosis_report.periorbital_health.client_display_score = 70
  const options = {
    featurePacket: clone(original.feature_evidence),
    historyRuleFlags: original.clinic_treatment_context.clinical_clearance.history_rule_flags,
    temperatureReadings: original.clinic_treatment_context.clinical_clearance.temperature.readings,
    patientProfileAndHistory: original.patient_profile_and_history,
    inClinicProductNames: original.approved_product_names,
  }
  const input = buildTreatmentPlannerInput(diagnosis, original.treatable_concerns, 'single', original.clinic_treatment_context, constraints, options)
  const draft = { treatment_plan: clone(case91.successful_model_plan) }
  const session = draft.treatment_plan.treatments[0]
  const ocular = clone(session.steps.find(step => step.step_id === 'INFUSE.HA'))
  Object.assign(ocular, { step_id: 'EYE.INFUSE', duration: 2, zones: ['under_eye'],
    target_concerns: ['Peri-Orbital Health Score'], role: 'SUPPORT', intensity_rung: null,
    how_to_do: 'Use the approved ocular hydration protocol without claiming structural hollow correction.' })
  session.steps.splice(-1, 0, ocular)
  return { diagnosis, options, input, draft }
}

test('mandatory ocular infusion is additional to facial infusion and validated before acceptance', () => {
  const { input, draft } = ocularCase()
  const final = finalizeTreatmentPlan(draft, input)
  assert.equal(validateClinicTreatmentPlan(final, input.clinic_treatment_context, 'single', constraints, input).error, undefined)
  assert.equal(final.treatment_plan.total_time, '64 minutes')
  assert.ok(final.treatment_plan.treatments[0].steps.some(step => step.step_id === 'INFUSE.HA'))
  const missing = clone(draft)
  missing.treatment_plan.treatments[0].steps = missing.treatment_plan.treatments[0].steps.filter(step => step.step_id !== 'EYE.INFUSE')
  const error = validateClinicTreatmentPlan(finalizeTreatmentPlan(missing, input), input.clinic_treatment_context, 'single', constraints, input).error
  assert.match(error.details.join('\n'), /periocular score <=70 requires/)
  const blocked = clone(input)
  blocked.clinic_treatment_context.clinical_clearance.blocked_steps['EYE.INFUSE'] = [{ condition: 'under_eye_infusion_score_rule', reason: 'Actual evaluated fixture product block.' }]
  assert.equal(validateClinicTreatmentPlan(finalizeTreatmentPlan(missing, blocked), blocked.clinic_treatment_context, 'single', constraints, blocked).error, undefined)
})

test('one targeted repair adds the required ocular step without changing supplied scores or fixed doses', async () => {
  const { diagnosis, options, draft } = ocularCase()
  const missing = clone(draft)
  missing.treatment_plan.treatments[0].steps = missing.treatment_plan.treatments[0].steps.filter(step => step.step_id !== 'EYE.INFUSE')
  let calls = 0
  const result = await generateTreatmentPlan({
    diagnosis, options, selectedConcerns: case91.planner_input.treatable_concerns,
    treatmentType: 'single', constraints, systemPrompt: 'Offline live-mother fixture.',
    callModel: async request => {
      calls++
      if (calls === 1) return missing
      assert.ok(JSON.parse(request.input).validation_errors.some(detail => detail.includes('periocular score <=70')))
      return draft
    },
  })
  assert.equal(calls, 2)
  assert.equal(result.error, undefined)
  assert.equal(result.treatment_plan.total_time, '64 minutes')
})

test('red LED barrier recovery is permitted but pregnancy exclusions and numeric energy denial remain', () => {
  const diagnosis = { combined_barrier_sensitivity: { parameter_name: 'Barrier Health + Sensitivity (Combined Score)', BSI_continuous: 0.8 } }
  const clearance = buildTreatmentEligibility(diagnosis, constraints)
  assert.equal(clearance.numeric_energy_status, 'denied')
  assert.ok(clearance.blocked_steps['ENERGY.CARBON.LASER'])
  assert.equal(clearance.blocked_steps['LED.RED'], undefined)
  const pregnant = buildTreatmentEligibility(diagnosis, constraints, { historyRuleFlags: { pregnant: true } })
  assert.ok(pregnant.blocked_steps['LED.RED'].some(row => row.condition === 'pregnant'))
})

test('adopted medium-peel hydration, structural barrier and teen restrictions use actual supplied measurements', () => {
  const packet = { proxies: { combined_barrier_sensitivity: { hydration_signal_index: 0.39 } } }
  assert.ok(buildTreatmentEligibility({}, constraints, { featurePacket: packet }).blocked_steps['PEEL.FUSION'])
  const structural = buildTreatmentEligibility({}, constraints, { featurePacket: { proxies: { combined_barrier_sensitivity: { barrier_uniformity_index: 0.54 } } } })
  assert.ok(structural.blocked_steps['PEEL.COMBO'])
  assert.ok(structural.blocked_steps['EXFO.MICRO.DIAMOND'])
  assert.equal(structural.blocked_steps['PEEL.PUMPKIN'], undefined)
  assert.ok(buildTreatmentEligibility({}, constraints, { patientProfileAndHistory: { age: 17 } }).blocked_steps['PEEL.FUSION'])
  assert.equal(buildTreatmentEligibility({}, constraints).blocked_steps['PEEL.FUSION'], undefined)
  const unchanged = buildTreatmentEligibility({}, constraints, { featurePacket: { proxies: { combined_barrier_sensitivity: { flaking_texture_index: 0.51, erythema_intensity_index: 0.61 } } } })
  assert.equal(unchanged.numeric_denial_reasons.length, 0)
  assert.equal(unchanged.blocked_steps['PEEL.COMBO'], undefined)
})

test('all live mother sections and tables reach the reference without new output fields', () => {
  const { input } = ocularCase()
  const reference = compileTreatmentKnowledgeReference(input)
  const global = JSON.parse(reference.stable_prefix.slice(reference.stable_prefix.indexOf('\n') + 1))
  const sections = [...global.live_mother_reference.sections, ...reference.case_reference.live_mother_sections]
  assert.equal(sections.length, 33)
  assert.equal(sections.reduce((sum, section) => sum + section.tables.length, 0), 27)
  for (const section of LIVE_MOTHER_REFERENCE.sections)
    assert.deepEqual(sections.find(row => row.section === section.section), section)
  const request = buildTreatmentModelRequest({ systemPrompt: 'Offline live-mother fixture.', constraints, plannerInput: input })
  assert.equal(request.text.format.name, 'facial_treatment_result_v5_6')
  assert.ok(request.prompt_cache_key.startsWith('ai-aesthetics-treatment-v5.6-live-mother-2026-10-06:'))
  assert.equal(constraints.clinical_constraints.session_timing_policy.single.target_minutes, 65)
  assert.equal(constraints.clinical_constraints.session_timing_policy.express.target_minutes, 40)
})
