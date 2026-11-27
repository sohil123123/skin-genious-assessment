import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
const root = dirname(dirname(fileURLToPath(import.meta.url)))
const moduleRoot = join(root, 'src/utils/facial/5_light_modes')
const rules = await import(pathToFileURL(join(moduleRoot, 'treatmentClinicRules.js')))
const { resolveTreatmentEvidence } = await import(pathToFileURL(join(moduleRoot, 'treatmentEvidence.js')))
const { treatmentHistoryFlags } = await import(pathToFileURL(join(moduleRoot, 'treatmentIntegration.js')))
const { TREATMENT_STEPS } = await import(pathToFileURL(join(moduleRoot, 'treatmentKnowledge.js')))
const constraints = JSON.parse(await readFile(join(moduleRoot, 'treatment/constraints.json'), 'utf8'))

const PIG = 'Superficial Pigmentation Score', LIP = 'Lip Pigmentation Score'
const diagnosis = (lipScore = 65) => ({ diagnosis_report: {
  combined_barrier_sensitivity: { parameter_name: 'Barrier Health + Sensitivity (Combined Score)', BSI_continuous: 0.30, backend_details: { barrier_uniformity_index: 0.85, flaking_texture_index: 0.05, erythema_intensity_index: 0.10, hydration_signal_index: 0.85 } },
  superficial_pigmentation: { parameter_name: PIG, score_or_label: 70.235, target_single_session_score: 61.917, score_polarity: 'higher_is_worse', comparison_mode: 'direct_numeric', improvability_index: 0.7 },
  lip_pigmentation: { parameter_name: LIP, score_or_label: lipScore, score_polarity: 'higher_is_better' },
} })
const selected = (d) => [{ ...d.diagnosis_report.superficial_pigmentation, is_primary_concern: true }]
const history = Object.fromEntries(constraints.clinical_constraints.patient_history_rules.map((r) => [r.condition, false]))
const plannerInput = (intake = {}, extra = {}, type = 'express', lipScore = 65) => {
  const d = diagnosis(lipScore)
  return rules.buildTreatmentPlannerInput(d, selected(d), type, null, constraints, { historyRuleFlags: { ...history, ...treatmentHistoryFlags(intake) }, ...extra })
}
const blockedIds = (input) => Object.entries(input.clinic_treatment_context.clinical_clearance.blocked_steps).filter(([, v]) => v.length).map(([k]) => k)
function step(id, duration, role = 'SUPPORT', overrides = {}) {
  return { step_id: id, duration, role, zones: ['full_face'], target_concerns: [],
    intensity_rung: ['HERO_CORRECTIVE', 'SECONDARY_CORRECTIVE'].includes(role) ? 2 : null,
    order_reason: 'Follows the documented mechanism and current skin state.', settings_note: null,
    duration_rationale: TREATMENT_STEPS[id]?.clinic_step_type === 'other' ? 'Uses the stated reference duration for this recorded purpose.' : null,
    additional_products: [], how_to_do: 'Treat the recorded zones using the approved protocol; neutralise or complete protocol removal where required.',
    script: 'Short client explanation.', infusion_ingredients: null, massage_purpose: null, ...overrides }
}
const lipStep = () => step('ENERGY.QS.LIP', 2, 'ADJUNCT', { zones: ['lips'], target_concerns: [LIP], settings_note: 'Use the existing approved lip protocol.' })
const plan = (steps, strategy, lipRule) => ({ treatment_plan: { course_outline: [], relevant_alternatives: [], treatments: [{ session_number: 1, title: 'Session', week: 1,
  preparations_checklist_for_therapist: ['Confirm screening.'], primary_strategy: [strategy], lip_pigmentation_rule: lipRule, steps }] } })
const validate = (p, input, type = 'express') => rules.validateClinicTreatmentPlan(rules.finalizeTreatmentPlan(p, input), input.clinic_treatment_context, type, constraints, input)
const peelPlan = (lipRule, extraSteps = []) => plan([step('PREP.CLEANSE', 2, 'PREP'), ...extraSteps,
  step('PEEL.COMBO', 4, 'HERO_CORRECTIVE', { target_concerns: [PIG] }), step('INFUSE.TRX', 3, 'SUPPORT', { target_concerns: [PIG] }),
  step('SPRAY.HYDRA', 3, 'SUPPORT', { infusion_ingredients: ['Hyaluronic Acid'] }), step('MASSAGE.LYMPH', 8, 'SUPPORT', { massage_purpose: 'mandatory' }),
  ...(lipRule.status === 'included' ? [lipStep()] : []), step('MASK.BRIGHTEN', 15), step('FINISH.SMS', 3, 'FINISH')],
  { concern: PIG, selected_step_id: 'PEEL.COMBO', care_type: 'corrective', exception_reason: null }, lipRule)

test('pregnancy stored as 1 reaches the engine: energy, peels, spot adjunct and the lip pass are blocked with a real reference', () => {
  const input = plannerInput({ is_pregnant: 1 }, { featurePacket: { proxies: { acne: { active_lesion_visibility_bin: 'mild', dominant_regions: ['chin'] } } } })
  const blocked = blockedIds(input)
  for (const id of ['ENERGY.CARBON.LASER', 'ENERGY.QS.LIP', 'LED.RED', 'PEEL.SPOT.SALI', 'PEEL.COMBO', 'EXFO.MICRO.DIAMOND']) assert.ok(blocked.includes(id), id)
  for (const id of ['PEEL.PARTY', 'PEEL.PUMPKIN', 'INFUSE.HA', 'MASSAGE.LYMPH']) assert.ok(!blocked.includes(id), id)
  assert.equal(input.clinic_treatment_context.clinical_clearance.missing_history_conditions.includes('pregnant'), false)
  assert.equal(input.planning_contract.active_acne_spot_rule.status, 'blocked_by_existing_constraints')
  assert.deepEqual(input.planning_contract.lip_block_options.map((o) => o.constraint_reference), ['pregnant'])
  const partyPlan = (lipRule, extra = []) => plan([step('PREP.CLEANSE', 2, 'PREP'), step('PEEL.PARTY', 4, 'HERO_CORRECTIVE', { target_concerns: [PIG] }), step('INFUSE.TRX', 3, 'SUPPORT', { target_concerns: [PIG] }),
    step('SPRAY.HYDRA', 3, 'SUPPORT', { infusion_ingredients: ['Hyaluronic Acid'] }), step('MASSAGE.LYMPH', 10, 'SUPPORT', { massage_purpose: 'mandatory' }), ...extra, step('MASK.BRIGHTEN', 15), step('FINISH.SMS', 3, 'FINISH')],
    { concern: PIG, selected_step_id: 'PEEL.PARTY', care_type: 'corrective', exception_reason: null }, lipRule)
  assert.equal(validate(partyPlan({ status: 'blocked_by_existing_constraints', reason: 'Patient is pregnant.', constraint_reference: 'pregnant' }), input).error, undefined)
  assert.match(validate(partyPlan({ status: 'included', reason: 'Score 65.', constraint_reference: '' }, [lipStep()]), input).error.details.join('\n'), /lip pass is blocked by existing clinical clearance/)
})

test('facial-skin restrictions never cancel the lip pass: it stays unblocked and an included lip pass validates', () => {
  const cases = [
    ['sun > 2 h', { daily_sun_exposure_hours: 'More than 2 hours' }, {}],
    ['travel', { upcoming_travel: 'yes' }, {}],
    ['social event', { social_event: 'yes' }, {}],
    ['retinol', { retinol_used_last_night: 'yes' }, {}],
    ['laser 7 days', { recent_peel_or_laser: 'yes' }, {}],
    ['salicylic use', { allergies: ['Salicylic Acid'] }, {}],
    ['glycolic use', { allergies: ['Glycolic Acid'] }, {}],
    ['skin temperature deny', {}, { temperatureReadings: { forehead_surface_c: 37, left_cheek_surface_c: 37, right_cheek_surface_c: 37 } }],
  ]
  for (const [name, intake, extra] of cases) {
    const input = plannerInput(intake, extra)
    assert.ok(!blockedIds(input).includes('ENERGY.QS.LIP'), name)
    assert.deepEqual(input.planning_contract.lip_block_options, [], name)
    assert.equal(input.clinic_treatment_context.lip_pigmentation.trigger, true)
    if (name === 'skin temperature deny') continue // peels are blocked there; covered by the fallback test
    assert.equal(validate(peelPlan({ status: 'included', reason: 'Score 65.', constraint_reference: '' }), input).error, undefined, name)
    assert.match(validate(peelPlan({ status: 'blocked_by_existing_constraints', reason: 'Skin rule.', constraint_reference: 'used_retinol_last_24_hours' }), input).error.details.join('\n'), /pregnancy is the only patient-history condition/, name)
  }
  // Barrier proxies in the denied range block facial energy but not the lip pass.
  const d = diagnosis(65); d.diagnosis_report.combined_barrier_sensitivity.BSI_continuous = 0.80
  const denied = rules.buildTreatmentPlannerInput(d, selected(d), 'express', null, constraints, { historyRuleFlags: history })
  assert.ok(blockedIds(denied).includes('ENERGY.CARBON.LASER')); assert.ok(!blockedIds(denied).includes('ENERGY.QS.LIP'))
  assert.equal(validate(peelPlan({ status: 'included', reason: 'Score 65.', constraint_reference: '' }), denied).error, undefined)
})

test('salicylic and glycolic home use block only the same-acid full-face peels', () => {
  const sali = plannerInput({ allergies: ['Salicylic Acid'] }, {}, 'express', 75)
  assert.deepEqual(blockedIds(sali).sort(), ['PEEL.SA20', 'PEEL.SA30', 'PEEL.SALIDS'])
  const glyco = plannerInput({ allergies: ['Glycolic Acid'] }, {}, 'express', 75)
  assert.deepEqual(blockedIds(glyco), ['PEEL.GLYCO35'])
  assert.match(constraints.clinical_constraints.patient_history_rules.find((r) => r.condition === 'used_salicylic_yesterday').rule, /avoid only the full-face salicylic peels/)
  assert.match(sali.planning_contract.closed_clinic_decisions.salicylic_glycolic_home_use, /Carbon, Q-switch, the lip pass and the lesion-only PEEL\.SPOT\.SALI adjunct stay allowed/)
})

test('acne visibility bins: none and faint are not visible; mild, clear and striking are', () => {
  for (const [bin, expected] of [['none', false], ['faint', false], ['mild', true], ['clear', true], ['striking', true]])
    assert.equal(resolveTreatmentEvidence({}, { proxies: { acne: { active_lesion_visibility_bin: bin } } }).active_acne_lesions_visible, expected, bin)
})

test('closed decisions are stated in the planning contract and the fallback session appears only when no corrective remains', () => {
  const normal = plannerInput({}, {}, 'express', 75)
  const decisions = normal.planning_contract.closed_clinic_decisions
  assert.match(decisions.lip_pass, /cancelled by pregnancy only/)
  assert.deepEqual(decisions.history_fields_without_restriction.fields, ['On medications', 'Hypertension', 'Breast feeding', 'Diabetes', 'Thyroid', 'PCOD'])
  assert.ok(decisions.available_corrective_step_ids.includes('ENERGY.CARBON.LASER'))
  assert.equal(decisions.fallback_when_no_corrective_is_available, null)
  assert.match(decisions.single_session_padding_policy.rule, /60-75 minute window/)
  const hot = plannerInput({}, { temperatureReadings: { forehead_surface_c: 37, left_cheek_surface_c: 37, right_cheek_surface_c: 37 } }, 'express', 75)
  assert.deepEqual(hot.planning_contract.closed_clinic_decisions.available_corrective_step_ids, [])
  const fallback = hot.planning_contract.closed_clinic_decisions.fallback_when_no_corrective_is_available
  assert.ok(fallback.blocking_conditions.includes('regional_skin_temperature_policy'))
  assert.ok(blockedIds(hot).includes('EXTR.MANUAL'))
  for (const key of ['lip_pass_policy', 'history_fields_without_restriction', 'fallback_session_when_no_corrective', 'single_session_padding_policy']) assert.ok(constraints.clinical_constraints[key], key)
})

test('the approved soothing fallback session validates for express and, padded to 60 minutes, for single', () => {
  const temps = { temperatureReadings: { forehead_surface_c: 37, left_cheek_surface_c: 37, right_cheek_surface_c: 37 } }
  const strategy = { concern: PIG, selected_step_id: 'INFUSE.HA', care_type: 'direct_support', exception_reason: 'All corrective modalities are blocked by regional_skin_temperature_policy.' }
  const lip = { status: 'included', reason: 'Score 65; skin temperature does not cancel the lip pass.', constraint_reference: '' }
  const core = (massage) => [step('PREP.CLEANSE', 2, 'PREP'), step('SPRAY.HYDRA', 3, 'SUPPORT', { infusion_ingredients: ['Hyaluronic Acid'] }),
    step('INFUSE.HA', 3, 'SUPPORT', { target_concerns: [PIG] }), step('INFUSE.PDRN', 3, 'SUPPORT'), step('COOL.ICE', 5, 'RECOVERY'),
    step('MASSAGE.LYMPH', massage, 'SUPPORT', { massage_purpose: 'mandatory' }), lipStep(), step('MASK.CALMING', 15), step('FINISH.SMS', 3, 'FINISH')]
  const express = plannerInput({}, temps, 'express')
  const expressResult = validate(plan(core(10), strategy, lip), express)
  assert.equal(expressResult.error, undefined)
  assert.equal(expressResult.treatment_plan.treatments[0].treatment_time, 46)
  const single = plannerInput({}, temps, 'single')
  const padded = core(10)
  padded.splice(1, 0, step('EXFO.VORTEX', 4), step('EXFO.SPATULA', 4))
  padded.splice(padded.length - 3, 0, step('INFUSE.TRX', 3, 'SUPPORT'), step('INFUSE.EXO', 3, 'SUPPORT'), step('EYE.INFUSE', 2, 'SUPPORT', { zones: ['under_eye'], infusion_ingredients: ['Hyaluronic Acid'] }))
  const singleResult = validate(plan(padded, strategy, lip), single, 'single')
  assert.equal(singleResult.error, undefined)
  assert.equal(singleResult.treatment_plan.treatments[0].treatment_time, 62)
  // Extraction is not allowed as padding on hot skin.
  const withExtraction = core(10); withExtraction.splice(1, 0, step('EXTR.MANUAL', 7))
  assert.match(validate(plan(withExtraction, strategy, lip), express).error.details.join('\n'), /EXTR\.MANUAL|blocked by regional_skin_temperature_policy/)
})

test('a medium peel and the lip pass may share a session; facial Q-switch passes still may not', () => {
  const input = plannerInput({}, {}, 'express')
  const fusion = plan([step('PREP.CLEANSE', 2, 'PREP'), step('PEEL.FUSION', 4, 'HERO_CORRECTIVE', { target_concerns: [PIG] }), step('INFUSE.TRX', 3, 'SUPPORT', { target_concerns: [PIG] }),
    step('SPRAY.HYDRA', 3, 'SUPPORT', { infusion_ingredients: ['Hyaluronic Acid'] }), step('MASSAGE.LYMPH', 8, 'SUPPORT', { massage_purpose: 'mandatory' }), lipStep(), step('MASK.BRIGHTEN', 15), step('FINISH.SMS', 3, 'FINISH')],
    { concern: PIG, selected_step_id: 'PEEL.FUSION', care_type: 'corrective', exception_reason: null }, { status: 'included', reason: 'Score 65.', constraint_reference: '' })
  assert.equal(validate(fusion, input).error, undefined)
  const withToning = JSON.parse(JSON.stringify(fusion))
  withToning.treatment_plan.treatments[0].steps.splice(2, 0, step('ENERGY.QS.TONING', 4, 'SECONDARY_CORRECTIVE', { settings_note: 'Approved preset.' }), step('COOL.ICE', 2, 'RECOVERY'))
  assert.match(validate(withToning, input).error.details.join('\n'), /medium peel cannot share a session with a facial Q-switch pass/)
})
