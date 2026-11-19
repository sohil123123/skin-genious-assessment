import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
const root = dirname(dirname(fileURLToPath(import.meta.url)))
const moduleRoot = join(root, 'src/utils/facial/5_light_modes')
const rules = await import(pathToFileURL(join(moduleRoot, 'treatmentClinicRules.js')))
const pipeline = await import(pathToFileURL(join(moduleRoot, 'treatmentPipeline.js')))
const { TREATMENT_STEPS } = await import(pathToFileURL(join(moduleRoot, 'treatmentKnowledge.js')))
const { treatmentEvaluatedClinicalBlocks } = await import(pathToFileURL(join(moduleRoot, 'treatmentIntegration.js')))
const constraints = JSON.parse(await readFile(join(moduleRoot, 'treatment/constraints.json'), 'utf8'))

const concern = 'Superficial Pigmentation Score'
const acneConcern = 'Visual Acne Grading'
const diagnosis = { diagnosis_report: {
  combined_barrier_sensitivity: { parameter_name: 'Barrier Health + Sensitivity (Combined Score)',
    BSI_continuous: 0.30, backend_details: { barrier_uniformity_index: 0.85, flaking_texture_index: 0.05,
      erythema_intensity_index: 0.1, hydration_signal_index: 0.85 } },
  superficial_pigmentation: { parameter_name: concern, score_or_label: 70.235, target_single_session_score: 61.917,
    score_polarity: 'higher_is_worse', comparison_mode: 'direct_numeric', improvability_index: 0.7 },
  visual_acne_grading: { parameter_name: acneConcern, score_or_label: 25.365, target_single_session_score: 18.4,
    score_polarity: 'higher_is_worse', comparison_mode: 'direct_numeric', improvability_index: 0.6 },
  lip_pigmentation: { parameter_name: 'Lip Pigmentation Score', score_or_label: 75, score_polarity: 'higher_is_better' },
} }
const selected = [{ ...diagnosis.diagnosis_report.superficial_pigmentation, is_primary_concern: true }]
// The live feature packet marks mild visible lesions; lips must never become a spot zone.
const featurePacket = { proxies: { acne: { active_lesion_visibility_bin: 'mild', inflammatory_lesion_count_bin: '1-5',
  dominant_regions: ['chin', 'forehead', 'lips'] } } }
const history = Object.fromEntries(constraints.clinical_constraints.patient_history_rules.map((r) => [r.condition, false]))
const options = { historyRuleFlags: history, featurePacket }
const clone = (x) => JSON.parse(JSON.stringify(x))

function step(id, duration, role = 'SUPPORT', overrides = {}) {
  return { step_id: id, duration, role, zones: ['full_face'], target_concerns: [concern],
    intensity_rung: ['HERO_CORRECTIVE','SECONDARY_CORRECTIVE'].includes(role) ? 2 : null,
    order_reason: 'Follows the documented mechanism and current skin state.', settings_note: null,
    duration_rationale: TREATMENT_STEPS[id]?.clinic_step_type === 'other' ? 'Uses the stated reference duration for this recorded purpose.' : null,
    additional_products: [], how_to_do: 'Treat the recorded zones using the approved protocol; monitor discomfort and stop for excessive reaction.',
    script: 'This treats the uneven tone on your cheeks at the appropriate dose.',
    infusion_ingredients: null, massage_purpose: null, ...overrides }
}
// A 43-minute express draft that omits the mandatory adjunct, as the live planner did.
function draft(massageMinutes = 5) {
  const steps = [step('PREP.CLEANSE',2,'PREP'),
    step('PEEL.COMBO',4,'SECONDARY_CORRECTIVE',{how_to_do:'Apply the approved superficial protocol to the recorded cheek zones; complete neutralisation or protocol removal before proceeding.'}),
    step('COOL.ICE',2,'RECOVERY'),step('ENERGY.CARBON.APPLY',3,'PREP'),
    step('ENERGY.CARBON.LASER',4,'HERO_CORRECTIVE',{settings_note:'Use the supplied conservative clinician preset; never invent fluence.'}),
    step('COOL.ICE',2,'RECOVERY'),step('INFUSE.TRX',3),
    step('MASSAGE.LYMPH',massageMinutes,'SUPPORT',{massage_purpose:'mandatory',how_to_do:'Use the existing clinician-approved lymphatic drainage protocol and supplied zone precautions.'}),
    step('MASK.BRIGHTEN',15),step('FINISH.SMS',3,'FINISH')]
  return { treatment_plan: { course_outline: [], relevant_alternatives: [],
    treatments: [{ session_number:1,title:'Cheek Tone Renewal',week:1,
      preparations_checklist_for_therapist:['Confirm supplied screening and the approved clinician device preset.'],
      primary_strategy:[{concern,selected_step_id:'ENERGY.CARBON.LASER',care_type:'corrective',exception_reason:null}],
      lip_pigmentation_rule:{status:'not_triggered',reason:'The supplied assessable client lip score is 75.',constraint_reference:''},steps}] } }
}
const envelope = (d) => ({ planning_result: { outcome: 'success', treatment_plan: clone(d.treatment_plan), failure: null } })
const args = { systemPrompt: 'Offline fixture prompt; no clinical model call.', constraints, diagnosis, selectedConcerns: selected, treatmentType: 'express', options }
const input = rules.buildTreatmentPlannerInput(diagnosis, selected, 'express', null, constraints, options)
const spotSteps = (result) => result.treatment_plan.treatments[0].steps.filter((s) => s.step_id === 'PEEL.SPOT.SALI')

test('the planner input states the binding active-acne flag, its zones and the rule outcome', () => {
  assert.equal(input.clinic_treatment_context.active_acne_lesions_visible, true)
  const rule = input.planning_contract.active_acne_spot_rule
  assert.equal(rule.status, 'required')
  assert.equal(rule.binding_flag, 'clinic_treatment_context.active_acne_lesions_visible')
  assert.deepEqual(rule.lesion_zones, ['forehead', 'chin'])
  assert.match(rule.rule, /MUST contain exactly one PEEL\.SPOT\.SALI/)
  const modelInput = JSON.parse(pipeline.buildTreatmentModelRequest({ systemPrompt: args.systemPrompt, constraints, plannerInput: input }).input)
  assert.equal(modelInput.planning_contract.active_acne_spot_rule.status, 'required')
  const quiet = rules.buildTreatmentPlannerInput(diagnosis, selected, 'express', null, constraints, { historyRuleFlags: history })
  assert.equal(quiet.planning_contract.active_acne_spot_rule.status, 'not_required')
  assert.deepEqual(rules.activeAcneLesionZones(diagnosis, { proxies: { acne: { dominant_regions: ['under_eye', 'full_face'] } } }), [])
})

test('an omitted mandatory adjunct is completed locally in one call instead of failing twice', async () => {
  const d = draft(); const original = clone(d); let calls = 0
  const result = await pipeline.generateTreatmentPlan({ ...args, callModel: async () => { calls++; return envelope(d) },
    onMetrics: (m) => { assert.deepEqual(m.spot_adjunct_completed_sessions, [1]); assert.equal(m.status, 'completed') } })
  assert.equal(result.error, undefined); assert.equal(calls, 1)
  assert.deepEqual(d, original)
  const session = result.treatment_plan.treatments[0]
  assert.equal(spotSteps(result).length, 1)
  const spot = session.steps[1]
  assert.equal(spot.step_id, 'PEEL.SPOT.SALI'); assert.equal(session.steps[0].step_id, 'PREP.CLEANSE')
  assert.equal(spot.role, 'ADJUNCT'); assert.equal(spot.duration, 2); assert.equal(spot.clinic_step_type, 'spot_salicylic')
  assert.deepEqual(spot.zones, ['forehead', 'chin'])
  assert.deepEqual(spot.additional_products, ['Sali DS Peel'])
  assert.ok(spot.ingredients_equipments.includes('Sali DS Peel'))
  assert.deepEqual(spot.target_concerns, [acneConcern])
  assert.match(spot.how_to_do, /Clinician confirms the product choice/)
  assert.deepEqual(session.steps.map((s) => s.step_number), session.steps.map((_, i) => i + 1))
  assert.equal(session.treatment_time, 45); assert.equal(result.treatment_plan.total_time, '45 minutes')
  assert.ok(session.concerns_addressed.some((row) => row.concern === acneConcern && row.current_value === 25.365 && row.target_value === 18.4))
  // The completed plan still passes the unchanged validator on its own.
  assert.equal(rules.validateClinicTreatmentPlan(result, input.clinic_treatment_context, 'express', constraints, input).error, undefined)
})

test('a draft that already carries the adjunct is left exactly as the model placed it', async () => {
  const d = draft(); d.treatment_plan.treatments[0].steps.splice(7, 0, step('PEEL.SPOT.SALI', 2, 'ADJUNCT', { zones: ['chin'], additional_products: ['20% Salicylic Acid Peel'] }))
  let calls = 0
  const result = await pipeline.generateTreatmentPlan({ ...args, callModel: async () => { calls++; return envelope(d) },
    onMetrics: (m) => assert.equal(m.spot_adjunct_completed_sessions, undefined) })
  assert.equal(result.error, undefined); assert.equal(calls, 1)
  assert.equal(spotSteps(result).length, 1)
  assert.equal(result.treatment_plan.treatments[0].steps[7].step_id, 'PEEL.SPOT.SALI')
  assert.deepEqual(result.treatment_plan.treatments[0].steps[7].additional_products, ['20% Salicylic Acid Peel'])
})

test('an evaluated salicylic block prevents completion and the plan passes without the adjunct', async () => {
  const blocked = { ...options, evaluatedClinicalBlocks: { 'PEEL.SPOT.SALI': [{ condition: 'active_acne_spot_treatment_rule', reason: 'Synthetic evaluated salicylic contraindication.' }] } }
  const blockedInput = rules.buildTreatmentPlannerInput(diagnosis, selected, 'express', null, constraints, blocked)
  assert.equal(blockedInput.planning_contract.active_acne_spot_rule.status, 'blocked_by_existing_constraints')
  assert.deepEqual(blockedInput.planning_contract.active_acne_spot_rule.blocking_conditions, ['active_acne_spot_treatment_rule'])
  let calls = 0
  const result = await pipeline.generateTreatmentPlan({ ...args, options: blocked, callModel: async () => { calls++; return envelope(draft()) } })
  assert.equal(result.error, undefined); assert.equal(calls, 1); assert.equal(spotSteps(result).length, 0)
})

test('nothing changes when no lesion flag is set', () => {
  const quiet = rules.buildTreatmentPlannerInput(diagnosis, selected, 'express', null, constraints, { historyRuleFlags: history })
  const d = draft()
  const outcome = rules.completeActiveAcneSpotAdjunct(d, quiet, constraints)
  assert.equal(outcome.plan, d); assert.deepEqual(outcome.completed_sessions, [])
})

test('a full express session gives the two minutes back from the flexible drainage only', async () => {
  const full = draft(10); full.treatment_plan.treatments[0].steps.splice(8, 0, step('LED.RED', 2))
  const roomy = await pipeline.generateTreatmentPlan({ ...args, callModel: async () => envelope(full) })
  assert.equal(roomy.error, undefined)
  const session = roomy.treatment_plan.treatments[0]
  assert.equal(session.treatment_time, 50)
  assert.equal(session.steps.find((s) => s.step_id === 'MASSAGE.LYMPH').duration, 8)
  assert.equal(spotSteps(roomy).length, 1)
  // Drainage already at its 5-minute floor: no fixed dose is cut, so the usual repair path runs.
  const tight = draft(5); tight.treatment_plan.treatments[0].steps.splice(8, 0, step('LED.RED', 7))
  let calls = 0; const requests = []
  const result = await pipeline.generateTreatmentPlan({ ...args, callModel: async (request) => { calls++; requests.push(request); return envelope(tight) } })
  assert.equal(calls, 2)
  assert.match(result.error.message, /visible active acne requires/)
  assert.match(result.error.message, /Repair failed/)
  assert.match(JSON.parse(requests[1].input).task, /active_acne_spot_rule\.status is "required"/)
  assert.equal(JSON.parse(requests[1].input).patient_input.planning_contract.active_acne_spot_rule.status, 'required')
})

test('without supplied lesion zones or alongside a broad salicylic peel the engine adds nothing and the model repairs', async () => {
  const zoneless = { ...options, featurePacket: { proxies: { acne: { active_lesion_visibility_bin: 'mild' } } } }
  let calls = 0
  const result = await pipeline.generateTreatmentPlan({ ...args, options: zoneless, callModel: async () => { calls++; return envelope(draft()) } })
  assert.equal(calls, 2); assert.match(result.error.message, /visible active acne requires/)
  const broad = draft(); const s = broad.treatment_plan.treatments[0]
  s.steps[1] = step('PEEL.SA20', 4, 'SECONDARY_CORRECTIVE', { how_to_do: 'Apply the approved superficial salicylic protocol; complete neutralisation or protocol removal before proceeding.' })
  calls = 0
  const repaired = clone(broad); repaired.treatment_plan.treatments[0].steps.splice(1, 0, step('PEEL.SPOT.SALI', 2, 'ADJUNCT', { zones: ['chin'], additional_products: ['Sali DS Peel'] }))
  const outcome = await pipeline.generateTreatmentPlan({ ...args, callModel: async () => { calls++; return envelope(calls === 1 ? broad : repaired) } })
  assert.equal(calls, 2); assert.equal(outcome.error, undefined); assert.equal(spotSteps(outcome).length, 1)
})

test('single-session plans are completed the same way and stay inside their window', async () => {
  const d = draft(); const session = d.treatment_plan.treatments[0]
  session.steps.splice(1, 0, step('EXTR.MANUAL', 7), step('ENERGY.HF', 3))
  session.steps.splice(session.steps.length - 1, 0, step('LED.RED', 13))
  const result = await pipeline.generateTreatmentPlan({ ...args, treatmentType: 'single', callModel: async () => envelope(d) })
  assert.equal(result.error, undefined)
  assert.equal(result.treatment_plan.treatments[0].steps[1].step_id, 'PEEL.SPOT.SALI')
  assert.equal(result.treatment_plan.treatments[0].treatment_time, 68)
})

test('the live intake case: Salicylic Acid ticked, mild lesions visible, the spot adjunct is still required and completed in one call', async () => {
  const intake = { allergies: ['Salicylic Acid'], retinol_used_last_night: 'yes', recent_peel_or_laser: 'no', is_pregnant: 'no', breastfeeding: 'no' }
  const liveOptions = { ...options, evaluatedClinicalBlocks: treatmentEvaluatedClinicalBlocks(intake) }
  const liveInput = rules.buildTreatmentPlannerInput(diagnosis, selected, 'express', null, constraints, liveOptions)
  assert.equal(liveInput.clinic_treatment_context.active_acne_lesions_visible, true)
  const rule = liveInput.planning_contract.active_acne_spot_rule
  assert.equal(rule.status, 'required'); assert.match(rule.rule, /salicylic skincare use does not waive it/)
  const blocked = liveInput.clinic_treatment_context.clinical_clearance.blocked_steps
  assert.equal(blocked['PEEL.SPOT.SALI'], undefined)
  for (const id of ['PEEL.SA20', 'PEEL.SA30', 'PEEL.SALIDS']) assert.equal(blocked[id][0].condition, 'used_salicylic_yesterday')
  let calls = 0
  const result = await pipeline.generateTreatmentPlan({ ...args, options: liveOptions, callModel: async () => { calls++; return envelope(draft()) } })
  assert.equal(result.error, undefined); assert.equal(calls, 1); assert.equal(spotSteps(result).length, 1)
  assert.equal(result.treatment_plan.treatments[0].steps[1].step_id, 'PEEL.SPOT.SALI')
  // A full-face salicylic peel for this patient is rejected by the existing block check.
  const broad = draft(); broad.treatment_plan.treatments[0].steps[1] = step('PEEL.SA20', 4, 'SECONDARY_CORRECTIVE', { how_to_do: 'Apply the approved superficial salicylic protocol; complete neutralisation or protocol removal before proceeding.' })
  const rejected = rules.validateClinicTreatmentPlan(rules.finalizeTreatmentPlan(rules.completeActiveAcneSpotAdjunct(broad, liveInput, constraints).plan, liveInput), liveInput.clinic_treatment_context, 'express', constraints, liveInput)
  assert.match(rejected.error.details.join('\n'), /PEEL\.SA20|blocked by used_salicylic_yesterday/)
})
