import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import { buildContinuationPlanningContext, treatmentCourseWindow, isPairedFacialCourse } from '../../src/utils/facial/5_light_modes/treatmentCourseContinuation.js'
import { buildTreatmentPlannerInput } from '../../src/utils/facial/5_light_modes/treatmentClinicRules.js'
import { buildTreatmentModelRequest, generateTreatmentPlan, stableTreatmentJson } from '../../src/utils/facial/5_light_modes/treatmentPipeline.js'
import { formatFacialClientScores } from '../../src/utils/facial/clientScoreDisplay.js'

const read = name => JSON.parse(fs.readFileSync(new URL(name, import.meta.url), 'utf8'))
const fixture = read('./fixtures/continuation-case.json')
const constraints = read('../../src/utils/facial/5_light_modes/treatment/constraints.json')
const expectations = read('./fixtures/initial-request-hashes.json')
const systemPrompt = 'TREATMENT PLANNER REVISION 2026-10-05 MOTHER V1.3 V5.6 EVIDENCE AND CONCISE DECISIONS\nOffline fixture request.'
const copy = value => structuredClone(value)
const sha = value => createHash('sha256').update(stableTreatmentJson(value)).digest('hex')
const options = {
  featurePacket: fixture.featurePacket,
  patientProfileAndHistory: fixture.patientInput.patient_profile_and_history,
  historyRuleFlags: fixture.patientInput.clinic_treatment_context.clinical_clearance.history_rule_flags,
  temperatureReadings: fixture.patientInput.clinic_treatment_context.clinical_clearance.temperature.readings,
  inClinicProductNames: fixture.patientInput.approved_product_names,
}

export function scenario(total, after) {
  const outline = Array.from({ length: total }, (_, i) => ({
    session_number: i + 1, week: i + 1, session_kind: 'facial', clinical_goal: 'Reassess actual current concerns',
    candidate_step_ids: ['ENERGY.CARBON.LASER'], reassessment_required: i >= 2,
    escalation_condition: i >= 2 ? 'Only after the preceding checkpoint' : '',
  }))
  const post = { reassessment: Object.fromEntries(Object.entries(fixture.diagnosis.diagnosis_report).map(([key, row]) => [key, {
    parameter_name: row.parameter_name,
    before_treatment_score_or_label: row.score_or_label,
    post_treatment_score_or_label: row.score_or_label,
    base_post_score_or_label_internal: row.score_or_label + (key === 'texture_open_pores_scoring' ? 2 : 0),
    score_semantics: row.score_semantics, score_polarity: row.score_polarity, comparison_mode: row.comparison_mode,
    ideal_score_direction: row.ideal_score_direction, result: 'stable', raw_comparison_result_internal: 'stable',
    score_explanation: 'A stable client report is retained independently of current internal measurements.',
  }])) }
  const course = { after_session_number: after, total_sessions: total,
    session_numbers: Array.from({ length: Math.min(2, total - after) }, (_, i) => after + i + 1), course_outline: outline }
  const context = { course_continuation: course,
    assessment: { ...copy(fixture.patientInput.patient_profile_and_history), diagnosis: copy(fixture.diagnosis),
      parameters_with_abnormal_scores: copy(fixture.diagnosis.treatable_concerns_summary) },
    source_session: { id: after + 100, session_number: after, post_diagnosis: formatFacialClientScores(post) },
    previous_treatments: [{ session_number: after, steps: copy(fixture.draft.planning_result.treatment_plan.treatments[0].steps) }],
  }
  const planning = buildContinuationPlanningContext(context, fixture.featurePacket)
  const draft = copy(fixture.draft)
  draft.planning_result.treatment_plan.course_outline = []
  draft.planning_result.treatment_plan.treatments = course.session_numbers.map(number => ({
    ...copy(fixture.draft.planning_result.treatment_plan.treatments[0]), session_number: number, week: number,
  }))
  draft.planning_result.treatment_plan.relevant_alternatives = course.session_numbers.flatMap(number =>
    fixture.draft.planning_result.treatment_plan.relevant_alternatives.map(row => ({ ...row, session_number: number })))
  return { context, planning, draft, course }
}

test('all initial request bodies exactly match the local implementation before continuation', () => {
  for (const type of ['single', 'express', 'multiple', 'full']) {
    const input = buildTreatmentPlannerInput(fixture.diagnosis, fixture.diagnosis.treatable_concerns_summary, type,
      fixture.patientInput.clinic_treatment_context, constraints, options)
    const request = buildTreatmentModelRequest({ systemPrompt, constraints, plannerInput: input })
    assert.equal(sha(request), expectations[type], type)
    assert.equal(request.service_tier, 'priority')
    assert.equal(request.reasoning.effort, 'medium')
    assert.equal(Object.hasOwn(JSON.parse(request.input), 'course_continuation'), false)
  }
})

test('current internal measurements win over the stable client presentation without mutating either source', () => {
  const { context, planning } = scenario(5, 2)
  const row = context.source_session.post_diagnosis.reassessment.texture_open_pores_scoring
  const raw = row.base_post_score_or_label_internal
  assert.equal(planning.diagnosis.diagnosis_report.texture_open_pores_scoring.score_or_label, raw)
  assert.notEqual(raw, row.post_treatment_score_or_label)
  assert.equal(Object.hasOwn(planning.diagnosis.diagnosis_report.texture_open_pores_scoring, 'target_single_session_score'), false)
  assert.equal(Object.hasOwn(planning.diagnosis.diagnosis_report.texture_open_pores_scoring, 'backend_details'), false)
  const before = JSON.stringify(context)
  buildContinuationPlanningContext(context, fixture.featurePacket)
  assert.equal(JSON.stringify(context), before)
  assert.deepEqual(planning.selectedConcerns.parameters_with_abnormal_scores.filter(r => r.is_primary_concern).map(r => r.parameter_name),
    fixture.diagnosis.treatable_concerns_summary.parameters_with_abnormal_scores.filter(r => r.is_primary_concern).map(r => r.parameter))
})

test('missing internal measurements and missing current features stop continuation instead of borrowing the baseline', () => {
  const { context } = scenario(5, 2)
  const broken = copy(context)
  delete broken.source_session.post_diagnosis.reassessment.skin_type.base_post_score_or_label_internal
  assert.throws(() => buildContinuationPlanningContext(broken, fixture.featurePacket), /fresh internal score/)
  assert.throws(() => buildContinuationPlanningContext(context, null), /Current post-session feature evidence/)
})

test('quoted fresh internal scores retain their unrounded numeric values without rewriting the saved report', () => {
  const { context } = scenario(5, 2)
  for (const [key, row] of Object.entries(context.source_session.post_diagnosis.reassessment)) {
    if (key !== 'skin_type') row.base_post_score_or_label_internal = String(row.base_post_score_or_label_internal)
  }
  context.source_session.post_diagnosis.reassessment.barrier_health_sensitivity.base_post_score_or_label_internal = '29.215'
  const before = JSON.stringify(context)
  const planning = buildContinuationPlanningContext(context, fixture.featurePacket)
  assert.equal(planning.diagnosis.diagnosis_report.barrier_health_sensitivity.score_or_label, 29.215)
  assert.equal(JSON.stringify(context), before)
  assert.ok(Object.entries(planning.diagnosis.diagnosis_report).every(([key, row]) =>
    key === 'skin_type' || typeof row.score_or_label === 'number'))
})

test('invalid fresh internal scores remain blocked even when a valid displayed score is available', () => {
  for (const value of [null, true, false, '', '  ', 'Grade 2', '29 points', 'NaN', 'Infinity', 0, 101, -1, {}, []]) {
    const { context } = scenario(5, 2)
    context.source_session.post_diagnosis.reassessment.barrier_health_sensitivity.base_post_score_or_label_internal = value
    assert.throws(() => buildContinuationPlanningContext(context, fixture.featurePacket), /fresh internal score\/label is invalid for Barrier/)
  }
})

for (const [total, after, numbers] of [[5, 2, [3, 4]], [5, 4, [5]], [6, 2, [3, 4]], [6, 4, [5, 6]], [7, 2, [3, 4]], [7, 4, [5, 6]], [7, 6, [7]], [8, 2, [3, 4]], [8, 4, [5, 6]], [8, 6, [7, 8]]]) {
  test(`${total}-session course after ${after}: full existing planner validates exactly ${numbers.join(', ')}`, async () => {
    const { context, planning, draft, course } = scenario(total, after)
    let calls = 0
    let metrics
    const result = await generateTreatmentPlan({
      callModel: async request => {
        calls++
        assert.equal(request.service_tier, 'priority')
        const input = JSON.parse(request.input)
        assert.deepEqual(input.course_continuation.session_numbers, numbers)
        assert.equal(input.diagnosis_report.texture_open_pores_scoring.score_or_label,
          fixture.diagnosis.diagnosis_report.texture_open_pores_scoring.score_or_label + 2)
        assert.ok(request.instructions.includes('REASSESSMENT-GATED COURSE CONTINUATION'))
        return copy(draft)
      },
      systemPrompt, constraints, diagnosis: planning.diagnosis, selectedConcerns: planning.selectedConcerns,
      treatmentType: 'multiple', options: { ...options, featurePacket: planning.featurePacket,
        priorVisit: planning.priorVisit, courseContinuation: planning.courseContinuation },
      onMetrics: value => { metrics = value },
    })
    assert.equal(result.error, undefined, JSON.stringify(result.error))
    assert.equal(calls, 1)
    assert.equal(metrics.repaired, false)
    assert.deepEqual(result.treatment_plan.treatments.map(row => row.session_number), numbers)
    assert.deepEqual(result.treatment_plan.course_outline, course.course_outline)
    assert.ok(result.treatment_plan.treatments.every(row => row.treatment_time === 64 && row.steps.length === 14))
    for (const session of result.treatment_plan.treatments) {
      assert.ok(session.concerns_addressed.every(row => row.target_value === null))
    }
    const output = new URL('./generated-cases/', import.meta.url)
    fs.mkdirSync(output, { recursive: true })
    fs.writeFileSync(new URL(`./generated-cases/${total}-after-${after}.json`, import.meta.url), JSON.stringify({ generated: result, features: planning.featurePacket, context, course }, null, 2))
  })
}

test('a model returning restarted or extra sessions is rejected rather than renumbered', async () => {
  const { planning, draft } = scenario(5, 4)
  draft.planning_result.treatment_plan.treatments[0].session_number = 1
  const result = await generateTreatmentPlan({
    callModel: async () => draft, systemPrompt, constraints, diagnosis: planning.diagnosis,
    selectedConcerns: planning.selectedConcerns, treatmentType: 'multiple',
    config: { maxRepairs: 0 }, options: { ...options, courseContinuation: planning.courseContinuation },
  })
  assert.ok(result.error)
})

test('saved null escalation conditions in initial slots do not block continuation or rewrite the outline', async () => {
  const { planning, draft } = scenario(5, 2)
  planning.courseContinuation.course_outline[0].escalation_condition = null
  planning.courseContinuation.course_outline[1].escalation_condition = null
  const before = JSON.stringify(planning)
  let calls = 0
  const result = await generateTreatmentPlan({
    callModel: async () => { calls++; return copy(draft) }, systemPrompt, constraints,
    diagnosis: planning.diagnosis, selectedConcerns: planning.selectedConcerns,
    treatmentType: 'multiple', config: { maxRepairs: 0 },
    options: { ...options, courseContinuation: planning.courseContinuation },
  })
  assert.equal(result.error, undefined, JSON.stringify(result.error))
  assert.equal(calls, 1)
  assert.deepEqual(result.treatment_plan.course_outline, planning.courseContinuation.course_outline)
  assert.equal(JSON.stringify(planning), before)
})

test('a null escalation condition in a future outline slot still fails validation', async () => {
  const { planning, draft } = scenario(5, 2)
  planning.courseContinuation.course_outline[2].escalation_condition = null
  const result = await generateTreatmentPlan({
    callModel: async () => copy(draft), systemPrompt, constraints,
    diagnosis: planning.diagnosis, selectedConcerns: planning.selectedConcerns,
    treatmentType: 'multiple', config: { maxRepairs: 0 },
    options: { ...options, courseContinuation: planning.courseContinuation },
  })
  assert.ok(result.error)
  assert.match(JSON.stringify(result.error), /course_outline\[2\]\.escalation_condition/)
})

test('standalone clinician slots and illegal checkpoints retain their existing restrictions', () => {
  const { course } = scenario(5, 2)
  const standalone = copy(course)
  standalone.course_outline[2].session_kind = 'separate_clinician_session'
  assert.throws(() => treatmentCourseWindow({ course_continuation: standalone, treatment_plan_type: 'multiple' }), /registered standalone/)
  assert.throws(() => treatmentCourseWindow({ course_continuation: { ...course, after_session_number: 3 }, treatment_plan_type: 'multiple' }), /checkpoint/)
  assert.throws(() => treatmentCourseWindow({ course_continuation: course, treatment_plan_type: 'single' }), /multiple-session/)
})

function standaloneScenario(id = 'ENERGY.MNRF', duration = 90) {
  const result = scenario(6, 4)
  const slot = result.planning.courseContinuation.course_outline[4]
  slot.session_kind = 'separate_clinician_session'
  slot.candidate_step_ids = [id]
  const session = result.draft.planning_result.treatment_plan.treatments[0]
  session.steps = [{ ...copy(session.steps[0]), step_id: id, duration, role: 'HERO_CORRECTIVE',
    zones: ['left_cheek'], target_concerns: ['Texture & Open Pores Score'], intensity_rung: null,
    additional_products: [], settings_note: 'Doctor to select approved settings.',
    how_to_do: 'Hand over to the supervising doctor after screening and consent. The doctor confirms the indication and zones, selects and records settings, follows the approved manufacturer protocol and documents monitoring and aftercare.',
    duration_rationale: 'Appointment estimate to be confirmed by the doctor.',
  }]
  session.primary_strategy = session.primary_strategy.map(row => ({ ...row, selected_step_id: null,
    care_type: 'blocked', exception_reason: 'This standalone draft addresses structural texture only; review other concerns separately.' }))
  return result
}

async function runStandalone(value, optionOverrides = {}) {
  const { planning, draft } = value
  return generateTreatmentPlan({ callModel: async request => {
    assert.ok(request.instructions.includes('DOCTOR-SUPERVISED STANDALONE COURSE SLOTS'))
    return copy(draft)
  }, systemPrompt, constraints, diagnosis: planning.diagnosis, selectedConcerns: planning.selectedConcerns,
  treatmentType: 'multiple', config: { maxRepairs: 0 },
  options: { ...options, courseContinuation: planning.courseContinuation, ...optionOverrides } })
}

for (const id of ['ENERGY.MNRF', 'ENERGY.HIFU', 'ENERGY.NEEDLE.PEN', 'ENERGY.NEEDLE.ROLLER']) {
  test(`${id}: standalone draft and facial coexist with different timing and mandatory-care rules`, async () => {
    const scenario = standaloneScenario(id)
    const result = await runStandalone(scenario)
    assert.equal(result.error, undefined, JSON.stringify(result.error))
    const [standalone, facial] = result.treatment_plan.treatments
    assert.equal(standalone.session_number, 5)
    assert.equal(standalone.treatment_time, 90)
    assert.equal(standalone.steps.length, 1)
    assert.ok(standalone.title.startsWith('Dr. Supervised session'))
    assert.match(standalone.steps[0].settings_note, /Doctor must select and document/)
    assert.ok(standalone.preparations_checklist_for_therapist.some(item => item.includes('Doctor sign-off required')))
    assert.ok(facial.steps.some(step => step.step_id === 'MASSAGE.LYMPH'))
    assert.ok(facial.treatment_time >= 60 && facial.treatment_time <= 75)
    assert.deepEqual(result.treatment_plan.course_outline, scenario.planning.courseContinuation.course_outline)
    if (id === 'ENERGY.MNRF') {
      fs.writeFileSync(new URL('./generated-cases/standalone-mixed.json', import.meta.url), JSON.stringify({ generated: result, features: scenario.planning.featurePacket }, null, 2))
    }
  })
}

test('standalone drafts cannot bypass pregnancy restrictions', async () => {
  const value = standaloneScenario()
  const result = await runStandalone(value, { historyRuleFlags: { ...options.historyRuleFlags, pregnant: true } })
  assert.ok(result.error)
  assert.match(JSON.stringify(result.error), /pregnant/)
})

test('unrelated correctives and numeric doctor settings are rejected in standalone drafts', async () => {
  for (const invalid of ['extra_corrective', 'device_settings']) {
    const value = standaloneScenario()
    if (invalid === 'extra_corrective') value.draft.planning_result.treatment_plan.treatments[0].steps.push(copy(fixture.draft.planning_result.treatment_plan.treatments[0].steps.find(step => step.step_id === 'ENERGY.CARBON.LASER')))
    else value.draft.planning_result.treatment_plan.treatments[0].steps[0].how_to_do = 'Use 1.5 mm and 20 W.'
    const result = await runStandalone(value)
    assert.ok(result.error)
  }
})

test('single, express and previously fully generated courses do not enter the paired-course trigger', () => {
  assert.equal(isPairedFacialCourse({ selected_plan_type: 'single' }), false)
  assert.equal(isPairedFacialCourse({ selected_plan_type: 'express' }), false)
  assert.equal(isPairedFacialCourse({ selected_plan_type: 'multiple', treatment_sessions: { course_outline: Array(5).fill({}), treatments: Array(5).fill({}) } }), false)
})
