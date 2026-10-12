import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { validateClinicTreatmentPlan, CLINIC_SESSION_TARGETS, TREATMENT_PLAN_RESPONSE_FORMAT } from '../src/utils/facial/treatmentClinicRules.js'
import { CLINIC_SESSION_TARGETS as fiveLightTargets } from '../src/utils/facial/5_light_modes/treatmentClinicRules.js'
import { buildTreatmentCatalogue, CATALOGUE_OMISSION_STATUSES } from '../src/utils/facial/treatmentCatalogueReview.js'

const constraints = (mode) => JSON.parse(readFileSync(new URL(`../src/utils/facial/${mode}_light_modes/treatment/constraints.json`, import.meta.url), 'utf8'))

test('both facial paths share amended session targets and mandatory score rules', () => {
  assert.deepEqual(fiveLightTargets, CLINIC_SESSION_TARGETS)
  assert.deepEqual(fiveLightTargets, { express: 40, single: 65, multiple: 65 })
  const five = constraints(5).clinical_constraints
  const six = constraints(6).clinical_constraints
  for (const key of ['session_timing_policy', 'clinic_step_timings_minutes', 'under_eye_infusion_score_rule', 'lip_pigmentation_add_on_rule', 'active_acne_restriction_scope']) {
    assert.deepEqual(five[key], six[key], key)
  }
  assert.ok(five.energy_device_policy)
  assert.deepEqual(five.energy_device_policy, six.energy_device_policy)
})

test('six-light runtime rejects omitted mandatory drainage', () => {
  const result = validateClinicTreatmentPlan({ treatment_plan: { treatments: [{ steps: [] }] } }, { lip_pigmentation: { trigger: false } }, 'single', constraints(6))
  assert.ok(result.error.details.some((message) => message.includes('exactly one mandatory 5-10-minute lymphatic drainage')))
})

test('six-light generation keeps treatment scripts and omits session speech', () => {
  const session = TREATMENT_PLAN_RESPONSE_FORMAT.schema.properties.treatment_plan.properties.treatments.items
  assert.equal(session.properties.script, undefined)
  assert.ok(session.properties.title)
  assert.ok(session.properties.treatment_time)
  assert.ok(session.properties.steps.items.properties.script)
})

test('updated six-light stock retains the approved ocular niacinamide route', () => {
  const serum = constraints(6).availableResources.jet_infusion_solutions.find((item) => item.name === 'Niacinamide')
  assert.ok(serum.approved_delivery_routes.includes('under_eye_infusion'))
})

test('six-light coverage bookkeeping is advisory while resources and fixed doses still block', () => {
  const stock = constraints(6), catalogue = buildTreatmentCatalogue(stock)
  const step = (type, duration, equipment = []) => ({
    step_number: 0, duration, clinic_step_type: type, ingredients_equipments: equipment,
    catalogue_option_ids: catalogue.filter((item) => equipment.includes(item.name)).map((item) => item.id),
    how_to_do: 'Synthetic software fixture: use the approved clinic protocol and monitor the recorded zones.',
    script: '', infusion_ingredients: null, lip_passes: null, lip_serum: null,
    massage_purpose: type === 'lymphatic_drainage' ? 'clinical' : null,
  })
  const steps = [step('cleansing', 2), step('other', 10, ['Q-Switch Laser']),
    step('cooling', 2, ['Ice Probe']), step('other', 8, ['LED Light Therapy Machine', 'Red']),
    step('lymphatic_drainage', 5), step('peel_off_mask', 15, ['Calming']), step('finishing', 3)]
  steps.forEach((item, index) => { item.step_number = index + 1 })
  const plan = { treatment_plan: { total_time: '45 minutes',
    modality_omission_explanation: Object.fromEntries(['q_switch_laser', 'carbon_facial', 'chemical_peel', 'rf_hifu_microneedling', 'under_eye_infusion', 'facial_infusion', 'cooling', 'hydra_spray', 'mask', 'lymphatic_drainage', 'other_relevant_options'].map((key) => [key, ''])),
    treatments: [{ session_number: 1, title: 'Software fixture', script: '', week: 1,
      catalogue_review: Object.fromEntries(CATALOGUE_OMISSION_STATUSES.map((key) => [key, []])),
      treatment_time: 45, step_duration_total: 45, timing_validation: { calculated_from_steps: 45, matches_treatment_time: true },
      preparations_checklist_for_therapist: [], concerns_addressed: [],
      lip_pigmentation_rule: { status: 'not_triggered', reason: 'Supplied fixture score above the threshold.', constraint_reference: '' }, steps }] } }
  const context = { lip_pigmentation: { trigger: false, assessable: true } }
  let warnings
  assert.equal(validateClinicTreatmentPlan(plan, context, 'express', stock, (value) => { warnings = value }).error, undefined)
  assert.ok(warnings.some((row) => row.code === 'catalogue_coverage'))
  assert.ok(warnings.some((row) => row.code === 'missing_supportive_summary'))
  steps.at(-1).duration = 4
  assert.match(validateClinicTreatmentPlan(plan, context, 'express', stock).error.details.join('\n'), /finishing must take 3 minutes/)
  steps.at(-1).duration = 3
  steps[1].catalogue_option_ids.push('UNKNOWN_RESOURCE')
  assert.match(validateClinicTreatmentPlan(plan, context, 'express', stock).error.details.join('\n'), /unknown catalogue ID/)
})
