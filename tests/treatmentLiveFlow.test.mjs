import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { performance } from 'node:perf_hooks'
import { formatFacialClientScores, prepareFacialEngineInput, facialClientScore } from '../src/utils/facial/clientScoreDisplay.js'
import { requireSavedTreatmentSessions } from '../src/utils/facial/treatmentPersistence.js'

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8')
const page = await read('src/pages/IndexPage.vue')
const functionSource = page.slice(page.indexOf('async function callApiForTreatmentPlan('), page.indexOf('async function callApiForPostDiagnosis('))
const transportSource = await read('src/composables/useOpenAI.js')
const fixture = JSON.parse(await read('tests/fixtures/case91.json'))
const constraints = JSON.parse(await read('src/utils/facial/5_light_modes/treatment/constraints.json'))
const promptSource = await read('src/utils/facial/5_light_modes/treatment/treatmentPrompt.js')
const clone = value => structuredClone(value)
function livePlan(count = 1) {
  return { treatment_plan: { total_time: 'Original live course duration', treatments: Array.from({ length: count }, (_, index) => ({
    session_number: index + 1, title: 'Synthetic software session', week: index + 1,
    script: 'Synthetic offline fixture.', treatment_time: 4,
    preparations_checklist_for_therapist: ['Synthetic screening.'],
    concerns_addressed: [{ concern: 'Peri-Orbital Health Score', current_value: 31.25, target_value: 25.123 }],
    steps: [{ step_number: 1, duration: 4, ingredients_equipments: ['Synthetic stocked finish'],
      how_to_do: 'Synthetic clinician instruction.', script: 'Synthetic patient explanation.' }],
    step_duration_total: 4, timing_validation: { calculated_from_steps: 4, matches_treatment_time: true },
  })), modality_omission_explanation: { q_switch_laser: 'Synthetic reason.', carbon_facial: 'Synthetic reason.',
    chemical_peel: 'Synthetic reason.', rf_hifu_microneedling: 'Synthetic reason.' } } }
}
function harness({ response = livePlan(), environment = {}, transport = null, mode = '5 lights', diagnosis = fixture.planner_input.diagnosis_report } = {}) {
  const state = { face_scan_machine: mode, conversation_id: 'fixture-conversation',
    diagnosis: formatFacialClientScores({ diagnosis_report: clone(diagnosis) }),
    feature_packet: clone(fixture.planner_input.feature_evidence), age: 32, is_pregnant: false,
    skin_temp_for_head: null, left_cheek_temp: '35.7', right_cheek_temp: '' }
  const calls = [], logs = [], clinicCalls = []
  let hides = 0
  const scope = {
    environment, assessmentData: { value: state }, performance,
    console: { info: (...args) => logs.push(args), error: (...args) => logs.push(args), log: () => {}, warn: () => {} },
    Loading: { show: () => {}, hide: () => { hides++ } }, QSpinnerFacebook: {},
    getFacialPrompts: async () => ({ SYSTEM_TREATMENT_PLAN_PROMPT: 'Supplied live system prompt fixture.', constraints }),
    prepareFacialEngineInput, formatFacialClientScores, facialClientScore, encode: JSON.stringify,
    FACIAL_JSON_OPTIONS: { text: { format: { type: 'json_object' } } },
    runResponse: async (...args) => { calls.push(args); return transport ? transport(...args) : clone(response) },
    buildClinicTreatmentContext: () => { clinicCalls.push('context'); return {} },
    buildTreatmentPlannerInput: () => { clinicCalls.push('input'); return { treatment_catalogue: [], treatment_plan_type: 'single' } },
    TREATMENT_PLAN_RESPONSE_FORMAT: { type: 'json_schema' },
    validateClinicTreatmentPlan: value => { clinicCalls.push('validation'); return value },
  }
  const call = new Function(...Object.keys(scope), functionSource.replaceAll('import.meta.env', 'environment') + '\nreturn callApiForTreatmentPlan;')(...Object.values(scope))
  return { call, state, calls, logs, clinicCalls, hides: () => hides }
}

test('active prompt and constraints exactly match the supplied live package', async () => {
  for (const [path, expected] of [
    ['src/utils/facial/5_light_modes/treatment/treatmentPrompt.js', 'a00d990a00ca226bc7ffecb4908036fa7f45bbeb77f81d5c8df28db2f392dad4'],
    ['src/utils/facial/5_light_modes/treatment/constraints.json', '4bad4baaa6be72d96bfcfd4957c1ecbc2d5945f17874e1a45912659d1958b3dc'],
  ]) {
    const bytes = await readFile(new URL('../' + path, import.meta.url))
    assert.equal(createHash('sha256').update(bytes).digest('hex'), expected)
  }
  assert.ok(!/primary_strategy|expectation_card|personalisation_evidence|planning_result/.test(promptSource))
})

test('five-light caller makes one original-format request without clinic helpers or forced reasoning', async () => {
  const h = harness()
  const result = await h.call([], 'single')
  assert.equal(result.error, undefined)
  assert.equal(h.calls.length, 1)
  const [conversation, input, model, options] = h.calls[0]
  assert.equal(conversation, 'fixture-conversation')
  assert.equal(model, 'gpt-5.2')
  assert.deepEqual(input.map(item => item.role), ['system', 'user'])
  assert.equal(input[0].content.length, 2)
  assert.deepEqual(JSON.parse(input[0].content[1].text), constraints)
  assert.equal(input[1].content.length, 3)
  assert.deepEqual(options.text.format, { type: 'json_object' })
  assert.equal(options.reasoning_effort, undefined)
  assert.equal(options.max_output_tokens, undefined)
  assert.equal(options.max_retries, 0)
  assert.equal(options.timeout_ms, 0)
  assert.deepEqual(h.clinicCalls, [])
  assert.equal(h.hides(), 1)
  assert.equal(result.planning_result, undefined)
})

test('original-format input preserves raw targets and client scores without mutating assessment data', async () => {
  const diagnosis = { periorbital_health: { parameter_name: 'Peri-Orbital Health Score', score_or_label: 31.25, target_single_session_score: 25.123 },
    lip_pigmentation: { parameter_name: 'Lip Pigmentation Score', score_or_label: 40.4, target_single_session_score: 35.678 } }
  const h = harness({ diagnosis })
  const before = clone(h.state)
  const selected = [{ parameter: 'Peri-Orbital Health Score', current_score: 31.25, target_score: 25.123, is_primary_concern: true }]
  await h.call(formatFacialClientScores(selected), 'single')
  const input = JSON.parse(h.calls[0][1][1].content[2].text)
  assert.equal(input.diagnosis_report.periorbital_health.score_or_label, 31.25)
  assert.equal(input.diagnosis_report.periorbital_health.client_display_score, 70)
  assert.equal(input.diagnosis_report.lip_pigmentation.client_display_score, 61)
  assert.equal(input.diagnosis_report.periorbital_health.target_single_session_score, 25.123)
  assert.equal(input.treatable_concerns.parameters_with_abnormal_scores[0].current_score, 31.25)
  assert.equal(input.treatable_concerns.parameters_with_abnormal_scores[0].target_score, 25.123)
  assert.deepEqual(h.state, before)
  const patient = JSON.parse(h.calls[0][1][1].content[0].text)
  assert.equal(patient.forehead_surface_c, null)
  assert.equal(patient.left_cheek_surface_c, 35.7)
  assert.equal(patient.right_cheek_surface_c, null)
})

test('full courses use multiple and accept all original-format detailed sessions', async () => {
  const h = harness({ response: livePlan(5), environment: { VITE_OPENAI_MODEL: 'configured-model-fixture' } })
  const result = await h.call({ treatable_concerns: { parameters_with_abnormal_scores: [] } }, 'full')
  assert.equal(result.treatment_plan.treatments.length, 5)
  assert.equal(h.calls[0][2], 'configured-model-fixture')
  const input = JSON.parse(h.calls[0][1][1].content[2].text)
  assert.equal(input.selected_plan_type, 'multiple')
  assert.equal(input.treatment_plan_type, 'multiple')
  assert.throws(() => requireSavedTreatmentSessions({ treatment_sessions: { treatments: [] } }, result), /did not confirm/)
  const saved = result.treatment_plan.treatments.map(row => ({ session_number: row.session_number, id: 100 + row.session_number }))
  assert.equal(requireSavedTreatmentSessions({ treatment_sessions: { treatments: saved } }, result), saved)
})

test('empty or malformed original-format responses fail without another model request', async () => {
  const empty = livePlan(); empty.treatment_plan.treatments = []
  const noSteps = livePlan(); noSteps.treatment_plan.treatments[0].steps = []
  const badTime = livePlan(); badTime.treatment_plan.treatments[0].steps[0].duration = 'invalid'
  for (const response of [empty, noSteps, badTime, { planning_result: {} }, livePlan(2)]) {
    const h = harness({ response })
    const result = await h.call([], 'single')
    assert.equal(result.error.code, 'treatment_output_contract_violation')
    assert.equal(h.calls.length, 1)
    assert.equal(h.hides(), 1)
    assert.ok(h.logs.some(log => log[0].includes('generation failed')))
  }
})

test('transport failures retain exact details and do not trigger content repair', async () => {
  const error = { code: 'fixture_gateway_error', message: 'Original gateway failure.', details: ['Original detail.'] }
  const h = harness({ response: { error } })
  assert.deepEqual((await h.call([], 'single')).error, error)
  assert.equal(h.calls.length, 1)
  const thrown = harness({ transport: async () => { throw Object.assign(new Error('Fixture transport exception.'), { code: 'fixture_exception' }) } })
  assert.equal((await thrown.call([], 'single')).error.code, 'fixture_exception')
  assert.equal(thrown.calls.length, 1)
  assert.equal(thrown.hides(), 1)
})

test('six-light caller keeps its existing shared validator and medium reasoning', async () => {
  const h = harness({ mode: '6 lights' })
  assert.equal((await h.call([], 'single')).error, undefined)
  assert.deepEqual(h.clinicCalls, ['context', 'input', 'validation'])
  assert.equal(h.calls[0][2], undefined)
  assert.equal(h.calls[0][3].reasoning_effort, 'medium')
})

function openAIHarness(post) {
  const calls = [], notifications = []
  const source = transportSource.replace(/^import[\s\S]*?from ['"][^'"]+['"]\r?\n/gm, '')
    .replace('export function useOpenAI', 'function useOpenAI').replaceAll('import.meta.env', 'environment')
  const scope = { environment: {}, config: { is_test_mode: false },
    api: { post: async (...args) => { calls.push(args); return post(...args) } },
    Loading: { hide: () => {} }, Notify: { create: value => notifications.push(value) },
    formatFacialClientScores, prepareFacialEngineInput,
    console: { info: () => {}, warn: () => {}, error: () => {} },
  }
  const client = new Function(...Object.keys(scope), source + '\nreturn useOpenAI();')(...Object.values(scope))
  return { ...client, calls, notifications }
}

test('real transport preserves zero timeout, parses the live JSON, and keeps other calls defaults', async () => {
  const client = openAIHarness(async () => ({ data: { status: 'completed', output_text: JSON.stringify(livePlan()) } }))
  const h = harness({ transport: client.runResponse })
  assert.equal((await h.call([], 'single')).error, undefined)
  assert.equal(client.calls.length, 1)
  assert.equal(client.calls[0][1].model, 'gpt-5.2')
  assert.equal(client.calls[0][1].timeout_ms, 0)
  assert.equal(client.calls[0][2].timeout, 0)
  assert.equal(client.calls[0][1].reasoning, undefined)
  assert.equal(client.calls[0][1].conversation, undefined)
  await client.runResponse(null, [{ role: 'user', content: 'Unchanged other-call fixture.' }])
  assert.equal(client.calls[1][1].model, 'gpt-5.4')
  assert.equal(client.calls[1][1].timeout_ms, undefined)
  assert.equal(client.calls[1][2].timeout, 600000)
})

test('real transport does not retry treatment HTTP errors or accept incomplete responses', async () => {
  const client = openAIHarness(async () => { throw Object.assign(new Error('Synthetic HTTP failure.'), { response: { status: 502, data: { message: 'Synthetic gateway failure.' } } }) })
  const h = harness({ transport: client.runResponse })
  assert.equal((await h.call([], 'single')).error.status, 502)
  assert.equal(client.calls.length, 1)
  const incomplete = openAIHarness(async () => ({ data: { status: 'incomplete', object: 'response', incomplete_details: { reason: 'max_output_tokens' } } }))
  assert.equal((await harness({ transport: incomplete.runResponse }).call([], 'single')).error.code, 'response_incomplete')
  assert.equal(incomplete.calls.length, 1)
})
