import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { performance } from 'node:perf_hooks'
import { encode } from '@toon-format/toon'
import { formatFacialClientScores, prepareFacialEngineInput } from '../src/utils/facial/clientScoreDisplay.js'
import { requireSavedTreatmentSessions } from '../src/utils/facial/treatmentPersistence.js'
import { generateTreatmentPlan } from '../src/utils/facial/5_light_modes/treatmentPipeline.js'
import { buildClinicTreatmentContext as sharedContext } from '../src/utils/facial/treatmentClinicRules.js'
import { treatmentHistoryFlags, inClinicProductRecords } from '../src/utils/facial/5_light_modes/treatmentIntegration.js'
import { available_skincare_products } from '../src/utils/facial/5_light_modes/treatment/productJson.js'

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8')
const page = await read('src/pages/IndexPage.vue')
const functionSource = page.slice(page.indexOf('async function callApiForTreatmentPlan('), page.indexOf('async function callApiForPostDiagnosis('))
const fixture = JSON.parse(await read('tests/fixtures/case91.json'))
const constraints = JSON.parse(await read('src/utils/facial/5_light_modes/treatment/constraints.json'))
const promptSource = await read('src/utils/facial/5_light_modes/treatment/treatmentPrompt.js')
const systemPrompt = new Function('encode', 'available_skincare_products', promptSource.replace(/^import .*\r?\n/gm, '')
  .replaceAll('export const ', 'const ') + '\nreturn SYSTEM_TREATMENT_PLAN_PROMPT;')(encode, available_skincare_products)
const clone = value => structuredClone(value)
function success(count = 1) {
  const plan = clone(fixture.successful_model_plan)
  delete plan.total_time
  delete plan.modality_omission_explanation
  delete plan.course_outline
  plan.relevant_alternatives = []
  const first = plan.treatments[0]
  for (const key of ['concerns_addressed', 'treatment_time', 'step_duration_total', 'timing_validation']) delete first[key]
  for (const step of first.steps) {
    for (const key of ['step_number', 'clinic_step_type', 'ingredients_equipments', 'catalogue_option_ids', 'lip_passes', 'lip_serum']) delete step[key]
  }
  plan.treatments = Array.from({ length: count }, (_, index) => ({ ...clone(first), session_number: index + 1, week: 1 + index * 2 }))
  return { planning_result: { outcome: 'success', treatment_plan: plan, failure: null } }
}
function harness({ response = success(), transport = null, mode = '5 lights' } = {}) {
  const state = { face_scan_machine: mode, conversation_id: 'fixture-conversation',
    diagnosis: formatFacialClientScores({ diagnosis_report: clone(fixture.planner_input.diagnosis_report) }),
    feature_packet: clone(fixture.planner_input.feature_evidence), age: 32,
    daily_sun_exposure_hours: 'Less than 1 hour', medical_history: ['None'], allergies: ['None'],
    is_pregnant: false, breastfeeding: false, social_event: false, upcoming_travel: false,
    recent_peel_or_laser: false, retinol_used_last_night: false,
    skin_temp_for_head: null, left_cheek_temp: '35.7', right_cheek_temp: '' }
  const calls = [], logs = [], clinicCalls = [], legacyCalls = []
  let hides = 0
  const scope = {
    assessmentData: { value: state }, performance,
    console: { info: (...args) => logs.push(args), error: (...args) => logs.push(args), log: () => {}, warn: () => {} },
    Loading: { show: () => {}, hide: () => { hides++ } }, QSpinnerFacebook: {},
    getFacialPrompts: async () => ({ SYSTEM_TREATMENT_PLAN_PROMPT: systemPrompt, constraints, available_skincare_products,
      ...(mode.startsWith('5') ? { generateTreatmentPlan: options => generateTreatmentPlan({ ...options, config: { outputContract: 'live_mother' } }) } : {}) }),
    prepareFacialEngineInput, formatFacialClientScores, encode, treatmentHistoryFlags, inClinicProductRecords,
    api: { post: async (...args) => { calls.push(args); return transport ? transport(...args) : { data: clone(response) } } },
    runResponse: async (...args) => { legacyCalls.push(args); return { treatment_plan: { treatments: [] } } },
    buildClinicTreatmentContext: (...args) => { clinicCalls.push('context'); return sharedContext(...args) },
    buildTreatmentPlannerInput: () => { clinicCalls.push('input'); return { treatment_catalogue: [], treatment_plan_type: 'single' } },
    TREATMENT_PLAN_RESPONSE_FORMAT: { type: 'json_schema' },
    validateClinicTreatmentPlan: value => { clinicCalls.push('validation'); return value },
  }
  const call = new Function(...Object.keys(scope), functionSource + '\nreturn callApiForTreatmentPlan;')(...Object.values(scope))
  return { call, state, calls, logs, clinicCalls, legacyCalls, hides: () => hides }
}

test('supplied live prompt and constraints remain identical apart from checkout line endings', async () => {
  for (const [path, expected] of [
    ['src/utils/facial/5_light_modes/treatment/treatmentPrompt.js', 'b4b76824e062b6292c296a923af6ce07a1288d4f52a37210a28f4f54d50d1e5e'],
    ['src/utils/facial/5_light_modes/treatment/constraints.json', '4bad4baaa6be72d96bfcfd4957c1ecbc2d5945f17874e1a45912659d1958b3dc'],
  ]) assert.equal(createHash('sha256').update((await read(path)).replaceAll('\r\n', '\n')).digest('hex'), expected)
  const loader = await read('src/utils/facial/index.js')
  assert.match(loader, /await import\('\.\/5_light_modes\/treatmentPipeline.js'\)/)
  assert.match(loader, /outputContract: 'live_mother'/)
})

test('actual five-light caller validates and saves a complete draft through one gateway request', async () => {
  const h = harness()
  const before = clone(h.state)
  const result = await h.call(fixture.planner_input.treatable_concerns, 'single')
  assert.equal(result.error, undefined, JSON.stringify(result.error))
  assert.equal(result.treatment_plan.total_time, '62 minutes')
  assert.equal(h.calls.length, 1)
  assert.equal(h.legacyCalls.length, 0)
  const [route, body, controls] = h.calls[0]
  assert.equal(route, 'ai/responses')
  assert.equal(body.model, 'gpt-5.4')
  assert.equal(body.reasoning.effort, 'medium')
  assert.equal(body.text.format.type, 'json_schema')
  assert.equal(body.text.format.strict, true)
  assert.equal(body.timeout_ms, 0)
  assert.equal(controls.timeout, 0)
  assert.equal(controls.signal.aborted, false)
  assert.equal(body.metadata.stage, 'facial_treatment_v5')
  assert.equal(body.prompt_cache_retention, '24h')
  assert.ok(body.instructions.startsWith(systemPrompt))
  assert.equal(body.instructions.includes('MOTHER DOCUMENT REFERENCE KNOWLEDGE — STABLE TABLES'), false)
  assert.equal(body.instructions.includes('REGISTERED EXECUTABLE STEPS'), true)
  const input = JSON.parse(body.input[0].content[0].text)
  assert.equal(input.mother_case_reference, undefined)
  assert.equal(input.patient_profile_and_history.forehead_surface_c, null)
  assert.equal(input.patient_profile_and_history.left_cheek_surface_c, 35.7)
  assert.equal(input.patient_profile_and_history.right_cheek_surface_c, null)
  assert.deepEqual(h.state, before)
  assert.equal(h.hides(), 1)
  assert.throws(() => requireSavedTreatmentSessions({ treatment_sessions: { treatments: [] } }, result), /did not confirm/)
  const saved = [{ id: 100, session_number: 1 }]
  assert.equal(requireSavedTreatmentSessions({ treatment_sessions: { treatments: saved } }, result), saved)
})

test('one correction request receives the invalid draft and all errors, then passes clinical validation', async () => {
  const invalid = success()
  invalid.planning_result.treatment_plan.treatments[0].steps.find(step => step.step_id === 'FINISH.SMS').duration = 4
  let attempts = 0
  const h = harness({ transport: async (_, body) => {
    attempts++
    if (attempts === 1) return { data: invalid }
    const input = JSON.parse(body.input[0].content[0].text)
    assert.ok(input.validation_errors.some(detail => /must take/.test(detail)))
    assert.equal(input.invalid_draft.treatment_plan.treatments[0].steps.find(step => step.step_id === 'FINISH.SMS').duration, 4)
    return { data: success() }
  } })
  assert.equal((await h.call(fixture.planner_input.treatable_concerns, 'single')).error, undefined)
  assert.equal(attempts, 2)
  const metrics = h.logs.find(row => row[0] === '[facial-treatment-v5]')[1]
  assert.equal(metrics.repaired, true)
  assert.deepEqual(metrics.call_metrics.map(row => row.kind), ['initial', 'repair'])
  assert.ok(metrics.validation_ms >= 0)
  assert.equal(metrics.model_ms, metrics.call_metrics.reduce((sum, row) => sum + row.elapsed_ms, 0))
})

test('an invalid repair returns combined diagnostics and never an accepted treatment plan', async () => {
  const invalid = success()
  invalid.planning_result.treatment_plan.treatments[0].steps.find(step => step.step_id === 'FINISH.SMS').duration = 4
  const h = harness({ response: invalid })
  const result = await h.call(fixture.planner_input.treatable_concerns, 'single')
  assert.ok(result.error)
  assert.equal(result.treatment_plan, undefined)
  assert.equal(h.calls.length, 2)
  assert.ok(result.error.details.some(detail => detail.startsWith('Initial draft:')))
  assert.ok(result.error.details.some(detail => detail.startsWith('Repair draft:')))
})

test('live courses keep five detailed sessions and confirm every persisted ID', async () => {
  const h = harness({ response: success(5) })
  const result = await h.call(fixture.planner_input.treatable_concerns, 'full')
  assert.equal(result.error, undefined, JSON.stringify(result.error))
  assert.equal(result.treatment_plan.treatments.length, 5)
  assert.equal(h.calls.length, 1)
  const schema = h.calls[0][1].text.format.schema.properties.planning_result.anyOf[0].properties.treatment_plan
  assert.equal(schema.properties.treatments.minItems, 5)
  assert.equal(schema.properties.treatments.maxItems, undefined)
  assert.equal(schema.properties.course_outline, undefined)
  const saved = result.treatment_plan.treatments.map(row => ({ id: 100 + row.session_number, session_number: row.session_number }))
  assert.throws(() => requireSavedTreatmentSessions({ treatment_sessions: { treatments: saved.slice(0, 2) } }, result), /did not confirm/)
  assert.equal(requireSavedTreatmentSessions({ treatment_sessions: { treatments: saved } }, result), saved)
})

test('clinical history gates still reject selected prohibited energy rather than accepting a timed plan', async () => {
  const h = harness()
  h.state.is_pregnant = true
  const result = await h.call(fixture.planner_input.treatable_concerns, 'single')
  assert.ok(result.error)
  assert.ok(result.error.details.some(detail => /pregnant/.test(detail)))
  assert.equal(h.calls.length, 2)
})

test('the active live constraints require ocular care at display 70 and repair a missing ocular step', async () => {
  const corrected = success()
  const session = corrected.planning_result.treatment_plan.treatments[0]
  const ocular = clone(session.steps.find(step => step.step_id === 'INFUSE.HA'))
  Object.assign(ocular, { step_id: 'EYE.INFUSE', duration: 2, zones: ['under_eye'],
    target_concerns: ['Peri-Orbital Health Score'], role: 'SUPPORT', intensity_rung: null })
  session.steps.splice(-1, 0, ocular)
  let attempts = 0
  const h = harness({ transport: async (_, body) => {
    attempts++
    if (attempts === 1) return { data: success() }
    const input = JSON.parse(body.input[0].content[0].text)
    assert.ok(input.validation_errors.some(detail => /periocular score <=70/.test(detail)))
    return { data: corrected }
  } })
  h.state.diagnosis.diagnosis_report.periorbital_health.client_display_score = 70
  const result = await h.call(fixture.planner_input.treatable_concerns, 'single')
  assert.equal(result.error, undefined, JSON.stringify(result.error))
  assert.equal(attempts, 2)
  assert.equal(result.treatment_plan.treatments[0].steps.find(step => step.step_id === 'EYE.INFUSE').duration, 2)
})

test('active live validation detects missing carbon cooling even when the session stays within its time window', async () => {
  const invalid = success()
  const steps = invalid.planning_result.treatment_plan.treatments[0].steps
  const laser = steps.findIndex(step => step.step_id === 'ENERGY.CARBON.LASER')
  assert.equal(steps[laser + 1].step_id, 'COOL.ICE')
  steps.splice(laser + 1, 1)
  const h = harness({ response: invalid })
  const result = await h.call(fixture.planner_input.treatable_concerns, 'single')
  assert.ok(result.error.details.some(detail => /cooling must immediately follow/.test(detail)))
  assert.equal(h.calls.length, 2)
})

test('empty/truncated output and HTTP failures do not trigger a blind retry', async () => {
  for (const response of [{ status: 'completed', output_text: '' }, { status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' } }]) {
    const h = harness({ response })
    assert.ok((await h.call(fixture.planner_input.treatable_concerns, 'single')).error)
    assert.equal(h.calls.length, 1)
    assert.equal(h.hides(), 1)
  }
  const h = harness({ transport: async () => { throw Object.assign(new Error('HTTP fixture'), { response: {
    status: 502, data: { error: { code: 'exact_gateway_code', message: 'Exact gateway diagnostic', details: ['Exact detail'], response_id: 'fixture-response' } },
  } }) } })
  const result = await h.call(fixture.planner_input.treatable_concerns, 'single')
  assert.equal(result.error.code, 'exact_gateway_code')
  assert.equal(result.error.message, 'Exact gateway diagnostic')
  assert.deepEqual(result.error.details, ['Exact detail'])
  assert.equal(result.error.status, 502)
  assert.equal(result.error.response_id, 'fixture-response')
  assert.equal(h.calls.length, 1)
})

test('six-light caller retains the existing shared validator and transport', async () => {
  const h = harness({ mode: '6 lights' })
  assert.equal((await h.call([], 'single')).error, undefined)
  assert.deepEqual(h.clinicCalls, ['context', 'input', 'validation'])
  assert.equal(h.calls.length, 0)
  assert.equal(h.legacyCalls.length, 1)
  assert.equal(h.legacyCalls[0][3].reasoning_effort, 'medium')
})
