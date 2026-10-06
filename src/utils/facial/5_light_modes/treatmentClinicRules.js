import { facialClientScore, prepareFacialEngineInput } from '../clientScoreDisplay.js'
import { TREATMENT_STEPS } from './treatmentKnowledge.js'
import { buildTreatmentEligibility } from './treatmentEligibility.js'
import { resolveTreatmentEvidence, treatmentConcernFamily, TREATMENT_PROXY_FIELDS } from './treatmentEvidence.js'

// Treatment-only replacement. Existing scoring and client-display functions are reused.
export const CLINIC_SESSION_WINDOWS = { express: [35, 45], single: [60, 75], multiple: [60, 75] }
// No exact preferred target. A useful session anywhere in the window is valid.
export const CLINIC_SESSION_TARGETS = { express: null, single: null, multiple: null }
export const CLINIC_STEP_TIMINGS = {
  cleansing: [2, 2], suction: [2, 4], carbon_application_drying: [3, 3], carbon_laser: [4, 4],
  infusion: [3, 3], under_eye_infusion: [2, 2], hydra_spray: [3, 3], cooling: [2, 5],
  peel_off_mask: [15, 15], finishing: [3, 3], spot_salicylic: [2, 2],
  chemical_peel: [3, 4], lymphatic_drainage: [5, 10], lip_pigmentation_add_on: [2, 2],
}
export const SUPPORTIVE_REVIEW_KEYS = ['under_eye_infusion', 'facial_infusion', 'cooling', 'hydra_spray', 'mask', 'lymphatic_drainage', 'other_relevant_options']
// These roles are properties of the registered step, not model decisions.
export const FIXED_TREATMENT_STEP_ROLES = Object.freeze({
  'PREP.CLEANSE': 'PREP',
  'ENERGY.CARBON.APPLY': 'PREP',
  'PEEL.SPOT.SALI': 'ADJUNCT',
  'MASSAGE.LYMPH': 'SUPPORT',
  'FINISH.SMS': 'FINISH',
})
export const CLINIC_TREATMENT_RULES_PROMPT = `CLINIC DOSE AND TIMING CONTRACT
Complete windows including lip/ocular treatment: express 35-45 minutes (target 40); single and each detailed multiple-plan facial 60-75 (target 65). Targets are aims within the windows, never an exact-time requirement or permission to pad doses. No 80-minute or +2 exception.
${Object.entries(CLINIC_STEP_TIMINGS).map(([type, [min,max]]) => `${type}: ${min === max ? min : `${min}-${max}`} minutes${type === 'infusion' ? ' PER DISTINCT FACIAL INGREDIENT' : ''}`).join('\n')}
Carbon is TWO atomic steps: ENERGY.CARBON.APPLY (3, always PREP), then ENERGY.CARBON.LASER (4, carries the chosen corrective role). Together they are one corrective modality. A corrective primary_strategy must reference ENERGY.CARBON.LASER, never ENERGY.CARBON.APPLY. Preserve the carbon film and completed drying before its laser pass; cool immediately after the laser.
Facial infusion: list distinct actual infusion_ingredients; duration is 3 per ingredient. Use separate steps for different ingredients so each has an exact INFUSE.* ID. Do not count aliases twice. Under-eye infusion and spray have their own WHOLE-STEP durations, not the facial multiplier.
Under-eye: customer-facing higher-is-better periocular score <=70 requires Ocular Ultrasound Infusion Probe, one 2-minute step, additional to facial infusion, irrespective of primary selection; no separate B16 assessability/finding gate. Missing scores do not trigger it. Existing product/history blocks still apply. HA, niacinamide, TRX A, PDRN, exosomes or Vitamin C only. Spray: Oxygen Injection (Hydra spray), one 3-minute step; Vitamin C, TRX A, HA or niacinamide only. Individual approval is not approval to mix all ingredients. Niacinamide is not approved for full-face ultrasound infusion by this resource list.
Other registered steps use clinic_step_type "other" with a positive stated duration and a case-specific duration_rationale. Their mother-document reference ranges are guidance, not newly ratified hard doses. Never use "other" to bypass an existing fixed timing.
Spot salicylic: PEEL.SPOT.SALI, exactly 2 minutes, role ADJUNCT; mandatory for visible active lesions unless an actual salicylic contraindication applies. Lesion zones only; no lips, under-eye or broken skin. It never counts as a corrective or fills a corrective slot, but time and burden count.
For PEEL.SPOT.SALI, additional_products must contain exactly ONE named product from planning_contract.spot_sali_product_options. Choose the appropriate approved product for this case; do not assume a default concentration. A generic "salicylic acid" or a product mentioned only in prose does not identify the executable product. No other step requires this spot-product choice.
Spot salicylic creates NO mandatory cooling step after it or between it and Carbon/Q-switch, including a lip pass. It is a lesion-only ADJUNCT, not a broad/full-face peel. Preserve independently required post-energy cooling and the actual broad-peel-plus-Carbon preparation/cooling rules; do not add cooling merely because PEEL.SPOT.SALI is present.
Massage: name it Face and Neck Lymphatic Drainage Massage; exactly one MASSAGE.LYMPH in EVERY detailed facial, 5-10 minutes, massage_purpose "mandatory". Reserve at least 5 minutes before selecting optional additions. Include it even when puffiness is minimal or all other steps already meet the session minimum. It is required session care, not optional filler or a corrective substitute. Use the existing clinician-approved technique and applicable zone precautions; do not invent a new diagnosis-wide exclusion from reference notes. An actual evaluated clinical hard stop requires an explicit blocked response, never a successful session without massage. No duplicate massage, automatic 10-minute duration or padding fixed steps. Selection order does not fix procedure order.
Lip: reuse clinic_treatment_context.lip_pigmentation. Its trigger is the rounded higher-is-better CLIENT score <70, never the raw severity or target. If assessable, triggered and not blocked, include ENERGY.QS.LIP: two Q-switch passes with HA, exactly 2 minutes before finish, lip_passes 2, lip_serum "Hyaluronic Acid". Use existing contraindications, proxy and temperature rules. Blocked status needs the actual existing constraint key and case evidence. Cosmetic occlusion wins over a fallback score. No invented lip wavelength, energy or serum sequence.
Finish: exactly one FINISH.SMS, serum + moisturiser + sunscreen together, exactly 3 minutes, last. All times are actual sequential minutes; do not double-count concurrent activity or drying/contact time.
No protocol settings may be invented from an equipment range. Use a supplied approved preset/protocol, or flag missing settings in preparations_checklist_for_therapist and settings_note for clinician completion before treatment.
`

const str = { type: 'string' }
const num = { type: 'number' }
const int = { type: 'integer' }
const nullableStr = { type: ['string', 'null'] }
const object = (properties) => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false })
const array = (items, limits = {}) => ({ type: 'array', items, ...limits })
const zones = ['forehead','nose','left_cheek','right_cheek','chin','perioral','under_eye','lips','full_face','neck']
const stepProperties = {
  step_id: { type: 'string', enum: Object.keys(TREATMENT_STEPS) },
  duration: num,
  clinic_step_type: { type: 'string', enum: [...Object.keys(CLINIC_STEP_TIMINGS), 'other'] },
  role: { type: 'string', enum: ['HERO_CORRECTIVE','SECONDARY_CORRECTIVE','TERTIARY_CORRECTIVE','ADJUNCT','SUPPORT','RECOVERY','PREP','FINISH'] },
  zones: array({ type: 'string', enum: zones }), target_concerns: array(str),
  intensity_rung: { type: ['integer','null'], enum: [1,2,3,null] },
  order_reason: str, settings_note: nullableStr, duration_rationale: nullableStr,
  ingredients_equipments: array(str), how_to_do: str, script: str,
  additional_products: array(str),
  infusion_ingredients: { type: ['array','null'], items: str },
  lip_passes: { type: ['integer','null'] }, lip_serum: nullableStr,
  massage_purpose: { type: ['string','null'], enum: ['mandatory',null] },
}
const sessionProperties = {
  session_number: int, title: str, why_today: str, script: str, week: num,
  preparations_checklist_for_therapist: array(str),
  primary_strategy: array(object({ concern: str, dominant_driver: str, selected_step_id: nullableStr,
    care_type: { type: 'string', enum: ['corrective','direct_support','blocked'] },
    why_this_wins: str, exception_reason: nullableStr })),
  stack_comparison: str,
  concerns_addressed: array(object({ concern: str, current_value: { type: ['number','string','null'] }, target_value: { type: ['number','string','null'] } })),
  personalisation_evidence: array(str),
  signature_moment: object({ step_number: int, what: str, clinical_role: str }),
  expectation_card: object({ tonight: str, by_day_3: str, by_week_2: str, what_this_session_does_not_change: str }),
  continuity: object({ what_changed_since_last_visit: str, what_we_are_building_toward: str }),
  lip_pigmentation_rule: object({ status: { type: 'string', enum: ['included','not_triggered','not_assessable','blocked_by_existing_constraints'] }, reason: str, constraint_reference: str }),
  steps: array(object(stepProperties), { minItems: 1 }),
}
const planProperties = {
  total_time: str,
  course_outline: array(object({ session_number: int, week: num,
    session_kind: { type: 'string', enum: ['facial','separate_clinician_session'] },
    clinical_goal: str, candidate_step_ids: array({ type: 'string', enum: Object.keys(TREATMENT_STEPS) }),
    reassessment_required: { type: 'boolean' }, escalation_condition: str })),
  treatments: array(object(sessionProperties), { minItems: 1, maxItems: 2 }),
  modality_omission_explanation: object(Object.fromEntries(['q_switch_laser','carbon_facial','chemical_peel','rf_hifu_microneedling',...SUPPORTIVE_REVIEW_KEYS].map((name) => [name, str]))),
}
const format = (name, properties) => ({ type: 'json_schema', name, strict: true,
  schema: object({ treatment_plan: object(properties) }) })
// The optimized caller requests only decisions/content; derived fields are added locally.
const draftStepProperties = Object.fromEntries(Object.entries(stepProperties).filter(([name]) =>
  !['clinic_step_type','ingredients_equipments','lip_passes','lip_serum'].includes(name)))
const draftSessionProperties = Object.fromEntries(Object.entries(sessionProperties).filter(([name]) => name !== 'concerns_addressed'))
const finalStep = object({ step_number: int, ...stepProperties, catalogue_option_ids: array(str) })
const finalSession = object({ ...sessionProperties, steps: array(finalStep, { minItems: 1 }), treatment_time: num,
  step_duration_total: num, timing_validation: object({ calculated_from_steps: num, matches_treatment_time: { type: 'boolean' } }) })
export const normalizeTreatmentPlanType = (value) => value === 'full' ? 'multiple' : value
const sessionLimits = (treatmentType) => treatmentType == null ? { minItems: 1, maxItems: 2 }
  : ['single','express'].includes(normalizeTreatmentPlanType(treatmentType)) ? { minItems: 1, maxItems: 1 }
  : normalizeTreatmentPlanType(treatmentType) === 'multiple' ? { minItems: 2, maxItems: 2 }
  : (() => { throw new Error('Unknown treatment plan type.'); })()

export function buildTreatmentPlanResponseFormat(treatmentType = null) {
  return format('facial_treatment_plan_v5_1', { ...planProperties,
    treatments: array(finalSession, sessionLimits(treatmentType)) })
}

export function buildTreatmentGenerationResponseFormat(treatmentType = null, plannerInput = null) {
  const multiple = normalizeTreatmentPlanType(treatmentType) === 'multiple'
  const hasCaseData = plannerInput && (Object.hasOwn(plannerInput, 'diagnosis_report') || Object.hasOwn(plannerInput, 'treatable_concerns'))
  const contract = hasCaseData ? buildTreatmentConcernContract(plannerInput) : null
  const concernSchema = contract?.allowed_concern_names.length
    ? { type: 'string', enum: [...contract.allowed_concern_names].sort() } : str
  const primarySchema = contract?.required_primary_concerns.length
    ? { type: 'string', enum: [...contract.required_primary_concerns].sort() } : concernSchema
  const caseStepProperties = { ...draftStepProperties,
    target_concerns: array(concernSchema, contract && !contract.allowed_concern_names.length ? { maxItems: 0 } : {}) }
  const spotProducts = plannerInput?.planning_contract?.spot_sali_product_options
  const caseStepSchema = hasCaseData && Array.isArray(spotProducts)
    ? spotProducts.length ? { anyOf: [
      object({ ...caseStepProperties, step_id: { type: 'string', enum: ['PEEL.SPOT.SALI'] },
        additional_products: array({ type: 'string', enum: [...spotProducts].sort() }, { minItems: 1, maxItems: 1 }) }),
      object({ ...caseStepProperties, step_id: { type: 'string', enum: Object.keys(TREATMENT_STEPS).filter((id) => id !== 'PEEL.SPOT.SALI') } }),
    ] } : object({ ...caseStepProperties, step_id: { type: 'string', enum: Object.keys(TREATMENT_STEPS).filter((id) => id !== 'PEEL.SPOT.SALI') } })
    : object(caseStepProperties)
  const caseStrategy = object({ ...sessionProperties.primary_strategy.items.properties,
    concern: primarySchema,
    selected_step_id: { type: ['string','null'], enum: [...Object.keys(TREATMENT_STEPS), null] } })
  const caseSessionProperties = { ...draftSessionProperties,
    primary_strategy: array(caseStrategy, contract
      ? { minItems: contract.required_primary_concerns.length, maxItems: contract.required_primary_concerns.length } : {}),
    steps: array(caseStepSchema, { minItems: 1 }) }
  const draftProperties = { ...planProperties,
    treatments: array(object(caseSessionProperties), sessionLimits(treatmentType)),
    course_outline: { ...planProperties.course_outline,
      ...(treatmentType == null ? {} : multiple ? { minItems: 5, maxItems: 8 } : { maxItems: 0 }) },
  }
  // Arithmetic is performed locally; the model cannot assert an unsupported total.
  delete draftProperties.total_time
  // The model explains only material losing alternatives. The legacy 11-key
  // presentation object is assembled from actual steps locally, after generation.
  delete draftProperties.modality_omission_explanation
  draftProperties.relevant_alternatives = array(object({ session_number: int,
    step_id: { type: 'string', enum: Object.keys(TREATMENT_STEPS) }, reason: str }))
  return { type: 'json_schema', name: 'facial_treatment_result_v5_6', strict: true,
    schema: object({ planning_result: { anyOf: [
      object({ outcome: { type: 'string', enum: ['success'] },
        treatment_plan: object(draftProperties), failure: { type: 'null' } }),
      object({ outcome: { type: 'string', enum: ['blocked'] }, treatment_plan: { type: 'null' },
        failure: object({ reason: str,
          blocking_constraints: array(object({ constraint_reference: str, case_evidence: str }), { minItems: 1 }) }) }),
    ] } }) }
}
export const PLANNER_GENERATION_RESPONSE_FORMAT = buildTreatmentGenerationResponseFormat()
export const TREATMENT_PLAN_RESPONSE_FORMAT = buildTreatmentPlanResponseFormat()

export function requiredMassageMinutes(otherMinutes, treatmentType) {
  const window = CLINIC_SESSION_WINDOWS[normalizeTreatmentPlanType(treatmentType)]
  if (!window || !Number.isFinite(otherMinutes) || otherMinutes < 0) return null
  const minutes = Math.max(5, window[0] - otherMinutes)
  return minutes <= 10 && otherMinutes + minutes <= window[1] ? minutes : null
}
// Compatibility export for existing imports. This now budgets REQUIRED massage;
// it never returns zero and no longer implements the superseded filler policy.
export const requiredFillerMinutes = requiredMassageMinutes

export function compactTreatmentDiagnosis(report) {
  if (!report || typeof report !== 'object' || Array.isArray(report)) return report
  return Object.fromEntries(Object.entries(report).map(([key, value]) => {
    if (!value || typeof value !== 'object' || Array.isArray(value) ||
        typeof value.parameter_name !== 'string' || !Object.hasOwn(value, 'score_or_label')) {
      return [key, value]
    }
    const row = { ...value }
    delete row.description
    if (/^[1-6]$/.test(String(row.affected_area_image ?? '').trim())) delete row.affected_area_image
    return [key, row]
  }))
}

const normalize = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
const lipNames = new Set(['lippigmentation', 'lippigmentationscore'])
const isTrue = (value) => value === true || value === 'true'
const isFalse = (value) => value === false || value === 'false'
const nonempty = (value) => typeof value === 'string' && value.trim().length > 0

function numeric(value) {
  if (!['number', 'string'].includes(typeof value) || String(value).trim() === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function lipRow(diagnosis) {
  const rows = diagnosis?.diagnosis_report ?? diagnosis
  if (!rows || typeof rows !== 'object') return null
  const matches = Object.entries(rows).filter(
    ([key, row]) =>
      row &&
      typeof row === 'object' &&
      [key, row.parameter_name, row.parameter].some((name) => lipNames.has(normalize(name))),
  )
  return matches.length === 1 ? matches[0][1] : null
}

// The periocular rule uses the existing application's higher-is-better display
// mapping. A supplied score is sufficient; no extra B16 assessability gate.
export function buildUnderEyeTreatmentContext(diagnosis) {
  const report = diagnosis?.diagnosis_report ?? diagnosis ?? {}
  const aliases = new Set(['periorbitalhealth', 'periorbitalhealthscore', 'periocularhealth', 'periocularhealthscore', 'periocularscore'])
  const rows = Object.entries(report).filter(([key, row]) => row && typeof row === 'object' &&
    [key, row.parameter_name, row.parameter].some(name => aliases.has(normalize(name))))
  const row = rows.length === 1 ? rows[0][1] : null
  const explicit = numeric(row?.client_display_score ?? row?.customer_facing_score ?? row?.customer_display_score)
  const value = numeric(row?.score_or_label ?? row?.final_score ?? row?.current_score)
  let display = explicit !== null && explicit >= 1 && explicit <= 100 ? Math.round(explicit) : null
  if (display === null && value !== null && value >= 1 && value <= 100) {
    const health = row._facial_score_display?.version === 'facial-health-integer-v1' ||
      row.score_polarity === 'higher_is_better' || row.score_semantics === 'health'
    display = facialClientScore(value, health ? 'health' : 'severity')
  }
  return { client_display_score: display, threshold_inclusive: 70,
    trigger: display !== null && display <= 70,
    reason: display === null ? 'No unique valid customer-facing periocular score.' : 'Compared the customer-facing score with inclusive 70.' }
}

export function buildClinicTreatmentContext(diagnosis, featurePacket = {}) {
  const row = lipRow(diagnosis)
  const value = numeric(row?.score_or_label ?? row?.final_score ?? row?.current_score)
  const explicit = numeric(row?.client_display_score ?? row?.customer_facing_score ?? row?.customer_display_score)
  let display = explicit !== null && explicit >= 1 && explicit <= 100 ? Math.round(explicit) : null
  if (display === null && value !== null && value >= 1 && value <= 100) {
    const metadata = row._facial_score_display
    if (
      metadata?.version === 'facial-health-integer-v1' ||
      row.score_polarity === 'higher_is_better' ||
      row.score_semantics === 'health'
    ) {
      display = Math.round(value)
    } else if (row.score_polarity === 'higher_is_worse' || row.score_semantics === 'severity') {
      display = facialClientScore(value, 'severity')
    }
  }
  const evidence = [
    row,
    row?.data_quality,
    featurePacket?.proxies?.lips_pigmentation,
    featurePacket?.regions?.lips,
    featurePacket?.scan_meta,
  ].filter(Boolean)
  const unobservableFields = featurePacket?.missing_data?.fields_set_null_due_to_unobservability
  const obscured =
    evidence.some((item) =>
      [
        'lipstick_present',
        'lipstick_detected',
        'lips_obscured',
        'lips_occluded',
        'lip_region_unobservable',
      ].some((key) => isTrue(item[key])),
    ) ||
    [
      row,
      row?.data_quality,
      featurePacket?.proxies?.lips_pigmentation,
      featurePacket?.regions?.lips,
    ]
      .filter(Boolean)
      .some(
        (item) =>
          ['assessable', 'is_assessable', 'scorable', 'is_scorable'].some((key) =>
            isFalse(item[key]),
          ) ||
          ['unobservable', 'unscorable', 'occluded', 'obscured', 'notassessable'].includes(
            normalize(item.visibility_status ?? item.assessment_status),
          ),
      ) ||
    (Array.isArray(unobservableFields) ? unobservableFields : []).some(
      (field) =>
        /(^|[._])lips?([._]|$)/i.test(String(field)) || /lips_pigmentation/i.test(String(field)),
    )
  const assessable = display !== null && !obscured
  return {
    version: 'clinic-treatment-v1',
    under_eye_infusion: buildUnderEyeTreatmentContext(diagnosis),
    lip_pigmentation: {
      client_display_score: display,
      threshold_exclusive: 70,
      assessable,
      trigger: assessable && display < 70,
      reason: !row
        ? 'Lip diagnosis missing or ambiguous.'
        : obscured
          ? 'Explicit lip occlusion/unobservability evidence.'
          : display === null
            ? 'No valid lip score with known score units.'
            : 'Compared the rounded client-display score with 70.',
      visibility_caution: isTrue(featurePacket?.scan_meta?.lipstick_or_heavy_makeup_likely),
    },
  }
}

function schemaErrors(value, schema, path = 'plan', errors = []) {
  if (schema.anyOf) {
    const branches = schema.anyOf.map((branch) => schemaErrors(value, branch, path, []))
    if (!branches.some((branch) => branch.length === 0))
      errors.push(`${path}: no allowed result shape matches.`, ...branches.sort((a,b) => a.length-b.length)[0])
    return errors
  }
  const types = Array.isArray(schema.type) ? schema.type : [schema.type]
  const matches = (type) =>
    type === 'null'
      ? value === null
      : type === 'array'
        ? Array.isArray(value)
        : type === 'object'
          ? value !== null && typeof value === 'object' && !Array.isArray(value)
          : type === 'number'
            ? typeof value === 'number' && Number.isFinite(value)
            : type === 'integer'
              ? Number.isInteger(value)
              : typeof value === type
  if (!types.some(matches)) {
    errors.push(`${path}: expected ${types.join(' or ')}.`)
    return errors
  }
  if (schema.enum && !schema.enum.includes(value))
    errors.push(`${path}: value is not an allowed option.`)
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of schema.required || []) {
      if (!Object.hasOwn(value, key)) errors.push(`${path}.${key}: required field is missing.`)
    }
    for (const [key, child] of Object.entries(value)) {
      if (schema.properties?.[key])
        schemaErrors(child, schema.properties[key], `${path}.${key}`, errors)
      else if (schema.additionalProperties === false)
        errors.push(`${path}.${key}: unexpected field.`)
    }
  }
  if (Array.isArray(value)) {
    if (schema.minItems != null && value.length < schema.minItems) errors.push(`${path}: requires at least ${schema.minItems} item(s).`)
    if (schema.maxItems != null && value.length > schema.maxItems) errors.push(`${path}: allows at most ${schema.maxItems} item(s).`)
    value.forEach((child, index) => schemaErrors(child, schema.items, `${path}[${index}]`, errors))
  }
  return errors
}

export function unpackTreatmentPlannerResponse(parsed, treatmentType, plannerInput = null) {
  const contractError = (details) => Object.assign(new Error('Treatment generation returned an invalid output contract.'),
    { code: 'treatment_output_contract_violation', details })
  if (parsed && Object.hasOwn(parsed, 'planning_result')) {
    const errors = schemaErrors(parsed, buildTreatmentGenerationResponseFormat(treatmentType, plannerInput).schema)
    if (errors.length) throw contractError(errors)
    const result = parsed.planning_result
    if (result.outcome === 'blocked') {
      if (!result.failure.reason.trim() || result.failure.blocking_constraints.some((row) =>
        !row.constraint_reference.trim() || !row.case_evidence.trim()))
        throw contractError(['A blocked result must identify its actual blocking constraints and case evidence.'])
      // This is a reported blockage for clinical review, never an accepted plan.
      throw Object.assign(new Error(result.failure.reason), { code: 'treatment_planning_blocked',
        details: result.failure.blocking_constraints.map((row) => `${row.constraint_reference}: ${row.case_evidence}`) })
    }
    return { treatment_plan: result.treatment_plan }
  }
  // Existing server gateways may already return the unwrapped draft/final plan.
  // They must still supply the selected number of sessions and actual steps.
  const sessions = parsed?.treatment_plan?.treatments
  const limits = sessionLimits(treatmentType)
  if (!Array.isArray(sessions) || sessions.length < limits.minItems || sessions.length > limits.maxItems ||
      sessions.some((session) => !Array.isArray(session?.steps) || !session.steps.length))
    throw contractError(['A successful result requires the selected number of detailed sessions and non-empty steps; an empty treatment array is not a clinical blockage.'])
  return parsed
}

const ingredientKey = (value) => {
  const key = normalize(value)
  if (['trx', 'trxa', 'tranexamic', 'tranexamicacid', 'trxatranexamicacid'].includes(key))
    return 'tranexamicacid'
  if (
    ['ha', 'hyaluronic', 'hyaluronicacid', 'hyaluronicserum', 'hyaluronicacidserum'].includes(key)
  )
    return 'hyaluronicacid'
  return key
}


const suppliedConcernName = (row) => nonempty(row?.parameter_name) ? row.parameter_name.trim()
  : nonempty(row?.parameter) ? row.parameter.trim() : null

// The supplied live input contract uses `parameter`; diagnosis rows usually use
// `parameter_name`. Resolve both once, without inferring a concern from scores.
export function normalizeTreatmentConcernRows(rows, diagnosisReport = {}) {
  const identities = new Map()
  for (const [key, row] of Object.entries(diagnosisReport || {})) {
    const name = suppliedConcernName(row)
    if (!name) continue
    for (const alias of [key, row.parameter_name, row.parameter]) {
      if (!nonempty(alias) || !normalize(alias)) continue
      const token = normalize(alias)
      if (!identities.has(token)) identities.set(token, new Set())
      identities.get(token).add(name)
    }
  }
  return (Array.isArray(rows) ? rows : []).map((row, index) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return row
    const supplied = suppliedConcernName(row)
    const fail = (reason) => { throw Object.assign(new Error(`Selected concern input is invalid. ${reason}`),
      { code: 'treatment_input_contract_violation', details: [reason] }) }
    if (!supplied || !normalize(supplied)) {
      if (isTrue(row.is_primary_concern)) fail(`parameters_with_abnormal_scores[${index}] is primary but has no non-empty parameter_name or parameter. Fix the caller input before planning; a model repair cannot identify an unnamed primary.`)
      return { ...row }
    }
    const matches = identities.get(normalize(supplied))
    let canonical = supplied
    if (matches?.has(supplied)) canonical = supplied
    else if (matches?.size === 1) canonical = [...matches][0]
    else if (matches?.size > 1) fail(`parameters_with_abnormal_scores[${index}] name "${supplied}" identifies multiple diagnosis rows. Supply the exact parameter name; no score-based or fuzzy match is used.`)
    return { ...row, parameter_name: canonical }
  })
}

export function approvedSpotSaliProducts(constraints = {}) {
  const allowed = constraints?.clinical_constraints?.active_acne_spot_treatment_rule?.allowed_spot_sali_options || []
  const stock = constraints?.availableResources?.chemicalPeels
  const names = []
  for (const name of allowed) {
    if (!nonempty(name)) continue
    const exact = Array.isArray(stock) ? stock.find((item) => normalize(item?.name) === normalize(name))?.name : name
    if (nonempty(exact) && !names.some((item) => normalize(item) === normalize(exact))) names.push(exact)
  }
  return names
}

function selectedConcernRows(input) {
  return normalizeTreatmentConcernRows(input?.treatable_concerns?.parameters_with_abnormal_scores || [], input?.diagnosis_report || {})
}

export function buildTreatmentConcernContract(plannerInput) {
  const rows = targetRows(plannerInput)
  const required = selectedConcernRows(plannerInput)
    .filter((row) => isTrue(row?.is_primary_concern) && nonempty(row?.parameter_name))
    .map((row) => rows.get(normalize(row.parameter_name))?.parameter_name || row.parameter_name)
  return {
    allowed_concern_names: [...rows.values()].map((row) => row.parameter_name),
    required_primary_concerns: [...new Set(required)],
  }
}

export function buildTreatmentPlannerInput(diagnosis, selected, treatmentType, clinicContext, constraints = {}, options = {}) {
  const restored = prepareFacialEngineInput(diagnosis)
  const report = compactTreatmentDiagnosis(restored?.diagnosis_report ?? restored ?? {})
  const summary = selected?.treatable_concerns_summary ?? selected?.treatable_concerns ?? selected
  const rows = Array.isArray(summary) ? summary : Array.isArray(summary?.parameters_with_abnormal_scores) ? summary.parameters_with_abnormal_scores : []
  const canonicalRows = normalizeTreatmentConcernRows(prepareFacialEngineInput(rows), report)
  const context = clinicContext || buildClinicTreatmentContext(diagnosis, options.featurePacket || {})
  const evidence = resolveTreatmentEvidence(report, options.featurePacket, options)
  const input = {
    diagnosis_report: report,
    treatable_concerns: { description: summary?.description || 'Client-selected primary priorities.', parameters_with_abnormal_scores: canonicalRows },
    treatment_plan_type: normalizeTreatmentPlanType(treatmentType),
    clinic_treatment_context: { ...context, under_eye_infusion: buildUnderEyeTreatmentContext(diagnosis), active_acne_lesions_visible: evidence.active_acne_lesions_visible,
      active_acne_evidence_source: evidence.active_acne_evidence_source,
      clinical_clearance: buildTreatmentEligibility(report, constraints, { ...options, resolvedEvidence: evidence }) },
    patient_profile_and_history: options.patientProfileAndHistory ?? null,
    feature_evidence: options.featurePacket ?? null,
    prior_visit: options.priorVisit ?? null,
    approved_device_protocols: options.approvedDeviceProtocols ?? null,
    approved_product_names: options.inClinicProductNames ?? [],
  }
  input.planning_contract = { ...buildTreatmentConcernContract(input),
    fixed_step_roles: FIXED_TREATMENT_STEP_ROLES,
    spot_sali_product_options: approvedSpotSaliProducts(constraints),
    spot_sali_product_rule: 'For PEEL.SPOT.SALI, choose exactly one approved named product from spot_sali_product_options and put it in additional_products. Do not select a default concentration or name the product only in prose.',
    primary_strategy_rule: 'Exactly one strategy per required primary in every detailed session. Copy its exact concern name into the strategy and selected step target_concerns. A corrective Carbon strategy selects ENERGY.CARBON.LASER; never its PREP application or PEEL.SPOT.SALI. Do not invent aliases or findings.',
    spot_salicylic_cooling_rule: 'PEEL.SPOT.SALI does not require cooling after it or between it and Carbon/Q-switch, including a lip pass. Keep independently required immediate post-energy cooling and actual broad-peel-plus-Carbon preparation/cooling. The spot adjunct is not a broad/full-face peel.',
    evidence_contract: 'treatment-evidence-v1: canonical raw safety proxies and their source paths are in clinic_treatment_context.clinical_clearance. Supplied feature proxies fill missing diagnosis backend_details. No displayed score, normalized burden or feature diagnosis score substitutes for a raw measurement. Selected primary names remain exactly those in required_primary_concerns.',
  }
  return input
}

// A request projection, not a change to the stored diagnosis, scoring or targets.
// The full local input remains available to finalisation and all validators.
export function compileTreatmentPlannerInput(plannerInput) {
  const input = JSON.parse(JSON.stringify(plannerInput))
  input.planning_contract ||= buildTreatmentConcernContract(plannerInput)
  const clearance = plannerInput.clinic_treatment_context?.clinical_clearance
  if (clearance) {
    const evidence = resolveTreatmentEvidence(plannerInput.diagnosis_report, plannerInput.feature_evidence)
    const disagreements = TREATMENT_PROXY_FIELDS.filter((name) =>
      (clearance.numeric_proxy_values?.[name] ?? null) !== evidence.numeric_proxy_values[name])
    if (disagreements.length) throw Object.assign(new Error('Treatment clearance is stale or inconsistent with the supplied raw evidence.'),
      { code: 'treatment_input_contract_violation', details: disagreements.map((name) =>
        `${name}: rebuild with buildTreatmentPlannerInput and pass featurePacket before requesting the model; the clearance summary must use the same resolved raw value as the evidence.`) })
  }
  const rows = targetRows(plannerInput)
  const feature = input.feature_evidence || {}
  const featureDiagnosis = feature.diagnosis_report || {}
  const consumed = new Set()
  const report = {}
  for (const [key, original] of Object.entries(input.diagnosis_report || {})) {
    if (!original || typeof original !== 'object' || Array.isArray(original)) { report[key] = original; continue }
    const merged = rows.get(normalize(original.parameter_name ?? original.parameter)) || original
    const row = { ...merged }
    // Client summaries and interpretation rules repeat the retained finding,
    // polarity and comparison_mode. Keep causes, backend maps and uncertainty.
    if (nonempty(row.score_explanation)) row.finding = row.score_explanation
    else if (nonempty(row.client_description)) row.finding = row.client_description
    for (const name of ['description', 'client_description', 'score_explanation', 'short_description',
      'target_interpretation_rule', 'parameter', 'parameter_name_alias']) delete row[name]
    if (Object.hasOwn(row, 'current_score') && row.current_score === row.score_or_label) delete row.current_score
    if (!Object.hasOwn(row, 'target_single_session_score')) {
      if (Object.hasOwn(row, 'target_score')) row.target_single_session_score = row.target_score
      else if (Object.hasOwn(row, 'target_value')) row.target_single_session_score = row.target_value
    }
    if (row.target_score === row.target_single_session_score) delete row.target_score
    if (row.target_value === row.target_single_session_score) delete row.target_value
    const family = treatmentConcernFamily(row.parameter_name, key)
    for (const featureKey of family?.feature_diagnosis_keys || []) {
      const assessment = featureDiagnosis[featureKey]
      if (!assessment || typeof assessment !== 'object') continue
      const retained = { ...assessment }
      const signals = { ...assessment.supporting_signals }
      for (const [name, value] of Object.entries(signals)) {
        if ((family.proxy_keys || []).some((proxyKey) =>
          Object.hasOwn(feature.proxies?.[proxyKey] || {}, name) && JSON.stringify(feature.proxies[proxyKey][name]) === JSON.stringify(value))) delete signals[name]
      }
      if (Object.keys(signals).length) retained.supporting_signals = signals
      else delete retained.supporting_signals
      // The feature diagnosis is a second interpretive score, not a raw index.
      delete retained.score_0_1
      row.feature_assessment = retained
      consumed.add(featureKey)
    }
    // Raw safety measurements have one canonical location and source paths.
    if (family?.mother_map_index === 1) {
      for (const name of TREATMENT_PROXY_FIELDS) {
        delete row[name]
        if (row.backend_details && Object.hasOwn(row.backend_details, name)) {
          row.backend_details = { ...row.backend_details }; delete row.backend_details[name]
        }
      }
    }
    report[key] = row
  }
  // Named selection rows absent from a report remain available and named.
  for (const row of selectedConcernRows(plannerInput)) {
    if (!row?.parameter_name || Object.values(report).some((item) => normalize(item?.parameter_name) === normalize(row.parameter_name))) continue
    report[row.parameter_name] = { ...row }
  }
  const unmatched = Object.fromEntries(Object.entries(featureDiagnosis).filter(([name]) => !consumed.has(name)))
  delete feature.diagnosis_report
  if (Object.keys(unmatched).length) feature.unmatched_feature_assessments = unmatched
  if (feature.proxies?.combined_barrier_sensitivity) {
    for (const name of TREATMENT_PROXY_FIELDS) delete feature.proxies.combined_barrier_sensitivity[name]
  }
  if (feature.treatable_concerns) {
    // These are scan observations, not a second client-priority selection.
    feature.feature_findings = feature.treatable_concerns.map((row) => {
      const finding = { ...row }; delete finding.priority
      return finding
    })
    delete feature.treatable_concerns
  }
  input.diagnosis_report = report
  delete input.treatable_concerns
  input.planning_contract.input_contract_version = 'treatment-case-v1'
  return input
}

const decisionGroup = (id) => id === 'ENERGY.QS.LIP' || id.startsWith('ENERGY.QS.') ? 'q_switch_laser'
  : id.startsWith('ENERGY.CARBON.') ? 'carbon_facial'
    : id.startsWith('PEEL.') ? 'chemical_peel'
      : /^ENERGY\.(RF|HIFU|MNRF|NEEDLE)/.test(id) ? 'rf_hifu_microneedling'
        : id === 'EYE.INFUSE' ? 'under_eye_infusion'
          : id.startsWith('INFUSE.') ? 'facial_infusion'
            : id.startsWith('COOL.') ? 'cooling'
              : id === 'SPRAY.HYDRA' ? 'hydra_spray'
                : id.startsWith('MASK.') ? 'mask'
                  : id === 'MASSAGE.LYMPH' ? 'lymphatic_drainage' : 'other_relevant_options'

function finalizeDecisionSummary(root) {
  if (!Object.hasOwn(root, 'relevant_alternatives')) return
  const alternatives = root.relevant_alternatives
  const fail = (reason) => { throw Object.assign(new Error('Treatment generation returned an invalid alternatives contract.'),
    { code: 'treatment_output_contract_violation', details: [reason] }) }
  if (!Array.isArray(alternatives)) fail('relevant_alternatives must be an array; [] is allowed when there is no material losing contender.')
  const sessions = root.treatments || []
  for (const row of alternatives) {
    const session = sessions.find((item) => item.session_number === row?.session_number)
    if (!session || !TREATMENT_STEPS[row.step_id] || !nonempty(row.reason)) fail('Each relevant alternative needs an actual session_number, registered step_id and case-specific reason.')
    if (session.steps.some((step) => step.step_id === row.step_id)) fail(`Session ${row.session_number}: ${row.step_id} is selected and cannot also be reported as omitted.`)
  }
  root.modality_omission_explanation = Object.fromEntries(['q_switch_laser','carbon_facial','chemical_peel','rf_hifu_microneedling',...SUPPORTIVE_REVIEW_KEYS].map((group) => {
    const descriptions = []
    for (const session of sessions) {
      const selected = session.steps.filter((step) => decisionGroup(step.step_id) === group)
      if (selected.length) descriptions.push(`Session ${session.session_number}: included ${selected.map((step) => `${TREATMENT_STEPS[step.step_id]?.name || step.step_id} (${step.duration} min)`).join('; ')}.`)
      const omitted = alternatives.filter((row) => row.session_number === session.session_number && decisionGroup(row.step_id) === group)
      for (const row of omitted) descriptions.push(`Session ${session.session_number}: ${TREATMENT_STEPS[row.step_id].name} omitted. ${row.reason}`)
      if (!selected.length && !omitted.length) descriptions.push(`Session ${session.session_number}: not selected; no material alternative comparison reported for this category.`)
    }
    return [group, descriptions.join(' ')]
  }))
  delete root.relevant_alternatives
}

export function finalizeTreatmentPlan(draft, plannerInput = null) {
  if (!draft || typeof draft !== 'object' || draft.error) return draft
  const plan = JSON.parse(JSON.stringify(draft))
  if (plan.treatment_plan) finalizeDecisionSummary(plan.treatment_plan)
  for (const session of plan.treatment_plan?.treatments || []) {
    const steps = session.steps || []
    steps.forEach((step, index) => {
      const ref = TREATMENT_STEPS[step.step_id]
      step.step_number = index + 1
      step.catalogue_option_ids = [step.step_id]
      step.additional_products ||= []
      if (step.step_id === 'PEEL.SPOT.SALI') {
        const options = plannerInput?.planning_contract?.spot_sali_product_options || []
        const match = (name) => options.find((item) => normalize(item) === normalize(name))
        const existing = step.additional_products.filter((name) => match(name))
        const equipmentProducts = [...new Set((step.ingredients_equipments || []).map(match).filter(Boolean))]
        // Recover an explicitly named approved product from a legacy structured
        // equipment field. Never choose a concentration or parse prose to guess.
        if (!existing.length && equipmentProducts.length === 1) step.additional_products.push(equipmentProducts[0])
      }
      if (ref) {
        const fixedRole = FIXED_TREATMENT_STEP_ROLES[step.step_id]
        if (fixedRole) { step.role = fixedRole; step.intensity_rung = null }
        step.clinic_step_type ??= ref.clinic_step_type
        if (ref.infusion_ingredient && step.infusion_ingredients === null) step.infusion_ingredients = [ref.infusion_ingredient]
        step.ingredients_equipments ??= [...new Set([...(ref.inventory_required || []), ...step.additional_products, ...(step.infusion_ingredients || [])])]
        if (step.step_id === 'PEEL.SPOT.SALI') step.ingredients_equipments = [...new Set([...step.ingredients_equipments, ...step.additional_products])]
      }
      step.lip_passes ??= step.step_id === 'ENERGY.QS.LIP' ? 2 : null
      step.lip_serum ??= step.step_id === 'ENERGY.QS.LIP' ? 'Hyaluronic Acid' : null
    })
    if (!Object.hasOwn(session, 'concerns_addressed') && plannerInput) {
      const rows = targetRows(plannerInput)
      const addressed = [...new Set(steps.flatMap((step) => step.target_concerns || []))]
      session.concerns_addressed = addressed.map((concern) => {
        const row = rows.get(normalize(concern)) || {}
        return { concern,
          current_value: row.score_or_label ?? row.current_score ?? row.current_value ?? row.final_score ?? null,
          target_value: row.target_single_session_score ?? row.target_score ?? row.target_value ?? null }
      })
    }
    const sum = steps.reduce((total, step) => total + (typeof step.duration === 'number' && Number.isFinite(step.duration) ? step.duration : 0), 0)
    session.treatment_time = sum
    session.step_duration_total = sum
    session.timing_validation = { calculated_from_steps: sum, matches_treatment_time: true }
  }
  const sessions = plan.treatment_plan?.treatments
  if (Array.isArray(sessions) && sessions.length) {
    plan.treatment_plan.total_time = sessions.length === 1 ? `${sessions[0].treatment_time} minutes`
      : sessions.map((session) => `Session ${session.session_number}: ${session.treatment_time} minutes`).join('; ')
  }
  return plan
}

function inventoryNames(constraints) {
  const resources = constraints?.availableResources || {}
  const names = new Set()
  for (const [family, items] of Object.entries(resources)) {
    if (family === 'ivInfusions' || !Array.isArray(items)) continue
    for (const item of items) {
      if (item?.name) names.add(normalize(item.name))
      for (const name of [...item?.probes || [], ...item?.modes || [], ...item?.configurations?.tips_available || []]) names.add(normalize(name))
    }
  }
  return names
}

function targetRows(input) {
  const report = input?.diagnosis_report || {}
  const selected = selectedConcernRows(input)
  const rows = new Map()
  for (const row of [...normalizeTreatmentConcernRows(Object.values(report), report), ...selected]) {
    if (row && typeof row === 'object' && nonempty(row.parameter_name)) {
      const name = normalize(row.parameter_name)
      rows.set(name, { ...rows.get(name), ...row })
    }
  }
  return rows
}

const countedRoles = new Set(['HERO_CORRECTIVE','SECONDARY_CORRECTIVE','TERTIARY_CORRECTIVE'])
const immediatelyCooled = new Set(['ENERGY.CARBON.LASER','ENERGY.QS.TONING','ENERGY.QS.532','ENERGY.RF.LIFT','ENERGY.RF.MACHINE'])
const isBroad = (step) => step.zones?.includes('full_face')
const noCorrective = new Set(['PREP.CLEANSE','ENERGY.CARBON.APPLY','PEEL.SPOT.SALI','ENERGY.HF','LED.GREEN','FINISH.SMS'])

// This validator checks executable contracts, not whether a clinician agrees with
// the model's expected benefit. Keep the existing clinical validator at the caller.
export function validateClinicTreatmentPlan(plan, context, treatmentType, constraints = {}, plannerInput = null) {
  if (plan?.error) return plan
  const enginePlan = prepareFacialEngineInput(plan)
  const errors = schemaErrors(enginePlan, buildTreatmentPlanResponseFormat().schema)
  const root = enginePlan?.treatment_plan
  const sessions = Array.isArray(root?.treatments) ? root.treatments : []
  const normalizedType = normalizeTreatmentPlanType(treatmentType)
  const window = CLINIC_SESSION_WINDOWS[normalizedType]
  const lip = context?.lip_pigmentation
  const clearance = context?.clinical_clearance || {}
  const knownNames = inventoryNames(constraints)
  let rows, primary
  try {
    rows = targetRows(plannerInput)
    primary = buildTreatmentConcernContract(plannerInput).required_primary_concerns.map(normalize)
  } catch (error) {
    if (error.code !== 'treatment_input_contract_violation') throw error
    return { error: { code: error.code, message: error.message, details: error.details } }
  }
  if (!window) errors.push('Unknown treatment plan type.')
  if (!lip) errors.push('Lip-rule context is missing.')
  if (!sessions.length) errors.push('No compliant detailed treatment sessions returned.')
  if (['single','express'].includes(normalizedType) && sessions.length !== 1) errors.push('Single/Express requires exactly one detailed session.')
  if (normalizedType === 'multiple') {
    if (sessions.length !== 2) errors.push('Multiple requires only sessions 1 and 2 in detail; later sessions require reassessment.')
    const outline = root?.course_outline || []
    if (outline.length < 5 || outline.length > 8) errors.push('The course outline requires 5-8 sessions.')
    outline.forEach((row, i) => {
      if (row.session_number !== i + 1 || row.week < 1) errors.push(`Course item ${i + 1}: invalid session number/week.`)
      if (i > 0 && row.week <= outline[i - 1].week) errors.push(`Course item ${i + 1}: weeks must advance.`)
      if (i >= 2 && row.reassessment_required !== true) errors.push(`Course item ${i + 1}: reassessment gate is required.`)
      if (i < 2 && (row.session_kind !== 'facial' || row.week !== sessions[i]?.week)) errors.push(`Course item ${i + 1}: detailed facial and outline must agree.`)
      const standalone = row.candidate_step_ids?.some((id) => TREATMENT_STEPS[id]?.facial_session_allowed === false)
      if (standalone && row.session_kind !== 'separate_clinician_session') errors.push(`Course item ${i + 1}: standalone device needs a separately assessed clinician session.`)
    })
  } else if (root?.course_outline?.length) errors.push('Single/Express course_outline must be empty.')
  for (const name of ['q_switch_laser','carbon_facial','chemical_peel','rf_hifu_microneedling',...SUPPORTIVE_REVIEW_KEYS]) {
    if (!nonempty(root?.modality_omission_explanation?.[name])) errors.push(`Decision summary is missing for ${name}.`)
  }
  const protocols = constraints?.clinical_constraints?.supportive_treatment_protocols || {}
  const ingredients = constraints?.availableResources?.jet_infusion_solutions || []
  for (const [index, session] of sessions.entries()) {
    const label = `Session ${index + 1}`
    const steps = Array.isArray(session.steps) ? session.steps : []
    const typeSteps = (type) => steps.filter((s) => s.clinic_step_type === type)
    const idSteps = (id) => steps.filter((s) => s.step_id === id)
    if (session.session_number !== index + 1 || session.week < 1 || index === 0 && session.week !== 1) errors.push(`${label}: numbering must start at 1, first session week 1.`)
    if (index && session.week <= sessions[index - 1].week) errors.push(`${label}: week must follow the previous session.`)
    if (!steps.length) errors.push(`${label}: steps are missing.`)
    let sum = 0
    for (const [i, step] of steps.entries()) {
      const ref = TREATMENT_STEPS[step?.step_id]
      const stepLabel = `${label}, step ${i + 1}`
      if (!ref) { errors.push(`${stepLabel}: unknown step_id.`); continue }
      if (!ref.facial_session_allowed) errors.push(`${stepLabel}: this procedure is a standalone clinician session, not a facial step.`)
      if (step.step_number !== i + 1) errors.push(`${stepLabel}: step numbers must follow array position.`)
      if (step.clinic_step_type !== ref.clinic_step_type) errors.push(`${stepLabel}: step_id requires clinic_step_type ${ref.clinic_step_type}.`)
      if (typeof step.duration !== 'number' || !Number.isFinite(step.duration) || step.duration <= 0) errors.push(`${stepLabel}: duration must be a positive number.`)
      else sum += step.duration
      for (const field of ['how_to_do','script','order_reason']) if (!nonempty(step[field])) errors.push(`${stepLabel}: ${field} is missing.`)
      if (!step.zones?.length) errors.push(`${stepLabel}: target zones are required.`)
      if (step.step_id === 'EYE.INFUSE' && (step.zones?.length !== 1 || step.zones[0] !== 'under_eye')) errors.push(`${stepLabel}: ocular infusion is confined to under_eye.`)
      if (step.step_id === 'ENERGY.QS.LIP' && (step.zones?.length !== 1 || step.zones[0] !== 'lips')) errors.push(`${stepLabel}: the lip protocol is confined to lips.`)
      if (noCorrective.has(step.step_id) && countedRoles.has(step.role)) errors.push(`${stepLabel}: this step cannot be a counted corrective.`)
      if (step.step_id === 'PEEL.SPOT.SALI' && (step.role !== 'ADJUNCT' || step.zones?.some((z) => ['full_face','under_eye','lips'].includes(z)))) errors.push(`${stepLabel}: spot salicylic must be a lesion-only ADJUNCT outside lip/under-eye zones.`)
      if (step.step_id === 'PEEL.SPOT.SALI' && (step.additional_products || []).filter((name) => approvedSpotSaliProducts(constraints).map(normalize).includes(normalize(name))).length !== 1) errors.push(`${stepLabel}: spot salicylic must specify one approved named salicylic product in additional_products. Choose exactly one of: ${approvedSpotSaliProducts(constraints).join('; ') || 'no approved product available in the supplied stock'}. Do not use a generic salicylic label or put the product only in prose.`)
      if (step.step_id === 'ENERGY.CARBON.APPLY' && step.role !== 'PREP') errors.push(`${stepLabel}: carbon application is PREP; its laser carries the corrective role.`)
      if (step.clinic_step_type === 'other' && !nonempty(step.duration_rationale)) errors.push(`${stepLabel}: other-step duration requires a rationale.`)
      if (clearance.blocked_steps?.[step.step_id]?.length) errors.push(`${stepLabel}: blocked by ${clearance.blocked_steps[step.step_id].map((r) => r.condition).join(', ')}.`)
      if (step.step_id === 'ENERGY.CARBON.APPLY' && clearance.blocked_steps?.['ENERGY.CARBON.LASER']?.length) errors.push(`${stepLabel}: carbon preparation cannot be selected when its laser is blocked.`)
      if ((step.step_id.startsWith('ENERGY.') && step.step_id !== 'ENERGY.CARBON.APPLY' || step.step_id.startsWith('LED.')) && clearance.numeric_energy_status === 'allowed_with_caution' && !nonempty(step.settings_note)) errors.push(`${stepLabel}: energy caution needs the actual approved reduced-settings note.`)
      const equipment = (step.ingredients_equipments || []).map(normalize)
      const approvedProducts = new Set([...(plannerInput?.approved_product_names || []).map(normalize), ...knownNames])
      if (plannerInput?.approved_product_names?.length && (step.additional_products || []).some((name) => !approvedProducts.has(normalize(name)))) errors.push(`${stepLabel}: added product is not in the supplied approved product/resource names.`)
      for (const name of ref.inventory_required || []) {
        if (!knownNames.has(normalize(name))) errors.push(`${stepLabel}: required resource ${name} is not in the available inventory.`)
        if (!equipment.some((entry) => entry.includes(normalize(name)))) errors.push(`${stepLabel}: list the required ${name} in ingredients_equipments.`)
      }
      const timing = CLINIC_STEP_TIMINGS[step.clinic_step_type]
      let limits = timing
      if (['infusion','under_eye_infusion','hydra_spray'].includes(step.clinic_step_type)) {
        const actual = step.infusion_ingredients
        const actualKeys = Array.isArray(actual) ? actual.map(ingredientKey) : []
        if (!actualKeys.length || new Set(actualKeys).size !== actualKeys.length || actual.some((v) => !nonempty(v))) errors.push(`${stepLabel}: distinct actual ingredients are required.`)
        const allowed = step.clinic_step_type === 'infusion' ? ingredients.filter((item) => !item.approved_delivery_routes || item.approved_delivery_routes.includes('infusion')).map((item) => ingredientKey(item.name)) : (protocols[step.clinic_step_type]?.approved_ingredients || []).map(ingredientKey)
        if (actualKeys.some((name) => !allowed.includes(name))) errors.push(`${stepLabel}: ingredient is not approved for this route.`)
        if (ref.infusion_ingredient && (actualKeys.length !== 1 || actualKeys[0] !== ingredientKey(ref.infusion_ingredient))) errors.push(`${stepLabel}: facial INFUSE.* ID must match one exact ingredient.`)
        if (step.clinic_step_type === 'infusion') limits = [3 * actualKeys.length, 3 * actualKeys.length]
        if (isTrue(clearance.history_rule_flags?.vitamin_c_allergy) && actualKeys.includes('vitaminc')) errors.push(`${stepLabel}: Vitamin C allergy blocks this ingredient.`)
      } else if (step.infusion_ingredients !== null) errors.push(`${stepLabel}: infusion_ingredients must be null for this route.`)
      if (limits && (step.duration < limits[0] || step.duration > limits[1])) errors.push(`${stepLabel}: ${step.clinic_step_type} must take ${limits[0] === limits[1] ? limits[0] : `${limits[0]}-${limits[1]}`} minutes.`)
      if (immediatelyCooled.has(step.step_id) && steps[i + 1]?.step_id !== 'COOL.ICE') errors.push(`${stepLabel}: Ice Probe cooling must immediately follow this energy step.`)
      if (step.step_id !== 'ENERGY.QS.LIP' && (step.lip_passes !== null || step.lip_serum !== null)) errors.push(`${stepLabel}: lip metadata must be null outside the lip step.`)
      if (step.step_id !== 'MASSAGE.LYMPH' && step.massage_purpose !== null) errors.push(`${stepLabel}: massage_purpose must be null outside massage.`)
    }
    const ocular = typeSteps('under_eye_infusion')
    if (context?.under_eye_infusion?.trigger && !clearance.blocked_steps?.['EYE.INFUSE']?.length &&
      knownNames.has(normalize('Ocular Ultrasound Infusion Probe')) && ocular.length !== 1)
      errors.push(`${label}: customer-facing periocular score <=70 requires exactly one 2-minute ocular infusion, additional to indicated facial infusion.`)
    const finish = typeSteps('finishing')
    if (finish.length !== 1 || steps.at(-1) !== finish[0] || finish[0]?.role !== 'FINISH') errors.push(`${label}: one combined 3-minute FINISH.SMS must be last.`)
    for (const type of ['under_eye_infusion','hydra_spray','lymphatic_drainage','spot_salicylic','lip_pigmentation_add_on']) if (typeSteps(type).length > 1) errors.push(`${label}: do not duplicate ${type}.`)
    const massages = idSteps('MASSAGE.LYMPH')
    if (massages.length !== 1) errors.push(`${label}: exactly one mandatory 5-10-minute lymphatic drainage massage is required.`)
    for (const massage of massages) {
      if (massage.massage_purpose !== 'mandatory') errors.push(`${label}: massage_purpose must be mandatory; massage is not optional filler.`)
      if (massage.role !== 'SUPPORT') errors.push(`${label}: mandatory massage must use role SUPPORT, not a corrective role.`)
    }
    if (!window || sum < window[0] || sum > window[1]) errors.push(`${label}: complete session is ${sum} minutes; required ${window?.join('-')}, lips included.`)
    if (session.treatment_time !== sum || session.step_duration_total !== sum || session.timing_validation?.calculated_from_steps !== sum || session.timing_validation?.matches_treatment_time !== true) errors.push(`${label}: derived time fields must equal the actual step sum.`)
    const app = idSteps('ENERGY.CARBON.APPLY')
    const carbon = idSteps('ENERGY.CARBON.LASER')
    if (app.length || carbon.length) if (app.length !== 1 || carbon.length !== 1 || steps.indexOf(carbon[0]) <= steps.indexOf(app[0])) errors.push(`${label}: Carbon requires one 3-minute application before its one 4-minute laser step.`)
    const mediumPeels = steps.filter((s) => TREATMENT_STEPS[s.step_id]?.clinic_class === 'medium')
    const qSwitch = steps.filter((s) => ['ENERGY.CARBON.LASER','ENERGY.QS.TONING','ENERGY.QS.532','ENERGY.QS.LIP'].includes(s.step_id))
    if (mediumPeels.length && qSwitch.length) errors.push(`${label}: a medium peel cannot share a session with any Q-switch pass, including a lip pass.`)
    if (mediumPeels.filter(isBroad).length > 1) errors.push(`${label}: at most one full-face medium peel.`)
    if (mediumPeels.length && idSteps('EXFO.MICRO.DIAMOND').length) errors.push(`${label}: microdermabrasion cannot share a session with a medium peel.`)
    if (carbon.length && idSteps('ENERGY.QS.TONING').length) errors.push(`${label}: Carbon and toning are redundant in one session.`)
    for (const extraction of idSteps('EXTR.MANUAL')) {
      const extractionAt = steps.indexOf(extraction)
      const treatmentAt = steps.findIndex((s) => s.clinic_step_type === 'chemical_peel' && isBroad(s) || qSwitch.includes(s) || ['ENERGY.RF.LIFT','ENERGY.RF.MACHINE'].includes(s.step_id))
      const hf = steps.findIndex((s) => s.step_id === 'ENERGY.HF')
      if (treatmentAt >= 0 && extractionAt > treatmentAt || hf >= 0 && (hf < extractionAt || treatmentAt >= 0 && hf > treatmentAt)) errors.push(`${label}: extraction and its high-frequency support must precede full-face acid/Q-switch/RF.`)
    }
    if (carbon.length) for (const peel of steps.filter((s) => s.clinic_step_type === 'chemical_peel')) {
      const peelAt = steps.indexOf(peel), appAt = steps.indexOf(app[0])
      if (peelAt >= appAt || !steps.slice(peelAt + 1, appAt).some((s) => s.step_id === 'COOL.ICE') || !/neutrali[sz]|protocol removal/i.test(peel.how_to_do) || !nonempty(carbon[0].settings_note)) errors.push(`${label}: superficial peel plus Carbon needs peel first, neutralisation/protocol removal, intervening cooling and approved conservative Carbon settings.`)
    }
    const spot = idSteps('PEEL.SPOT.SALI')[0]
    if (context?.active_acne_lesions_visible === true && !spot && !clearance.blocked_steps?.['PEEL.SPOT.SALI']?.length) errors.push(`${label}: visible active acne requires the approved spot-salicylic adjunct unless an evaluated existing contraindication blocks it.`)
    const roleGroups = Object.fromEntries([...countedRoles].map((role) => [role, new Set(steps.filter((s) => s.role === role).map((s) => TREATMENT_STEPS[s.step_id]?.modality_id))]))
    if (Object.values(roleGroups).some((ids) => ids.size > 1)) errors.push(`${label}: each corrective role names only one modality.`)
    const correctiveCount = new Set(steps.filter((s) => countedRoles.has(s.role)).map((s) => TREATMENT_STEPS[s.step_id]?.modality_id)).size
    if (correctiveCount > 3 || correctiveCount && roleGroups.HERO_CORRECTIVE.size !== 1) errors.push(`${label}: one hero; at most two routine correctives or three exceptionally justified.`)
    if (correctiveCount >= 2 && !nonempty(session.stack_comparison)) errors.push(`${label}: added correction needs a superiority/nonredundancy comparison.`)
    if (roleGroups.TERTIARY_CORRECTIVE.size && (!roleGroups.SECONDARY_CORRECTIVE.size || !/incremental|additive|additional|beyond/i.test(session.stack_comparison || ''))) errors.push(`${label}: tertiary requires a secondary and explicit incremental-benefit justification.`)
    if (session.personalisation_evidence?.length !== 3 || session.personalisation_evidence?.some((s) => !nonempty(s))) errors.push(`${label}: three actual scan-to-treatment links are required.`)
    if (session.signature_moment?.step_number < 1 || session.signature_moment?.step_number > steps.length || !nonempty(session.signature_moment?.clinical_role)) errors.push(`${label}: signature moment must identify an existing justified step.`)
    const strategies = session.primary_strategy || []
    for (const concern of primary) {
      const name = rows.get(concern)?.parameter_name || concern
      const matches = strategies.filter((s) => normalize(s.concern) === concern)
      if (!matches.length) errors.push(`${label}: selected primary concern "${name}" has no strategy. Add its own primary_strategy entry and link it to an actual step whose target_concerns contains that exact name.`)
      if (matches.length > 1) errors.push(`${label}: selected primary concern "${name}" must have exactly one strategy, not ${matches.length}.`)
    }
    for (const strategy of strategies) {
      if (!nonempty(strategy.dominant_driver) || !nonempty(strategy.why_this_wins)) errors.push(`${label}: primary strategy must state driver and case-specific selection reason.`)
      const selected = steps.find((s) => s.step_id === strategy.selected_step_id)
      if (strategy.care_type !== 'blocked' && (!selected || !selected.target_concerns?.some((name) => normalize(name) === normalize(strategy.concern)))) errors.push(`${label}: primary strategy "${strategy.concern}" must map to an actual step and its target concern; selected_step_id "${strategy.selected_step_id}" must exist and include this exact concern in target_concerns.`)
      if (strategy.care_type === 'corrective' && (!countedRoles.has(selected?.role) || noCorrective.has(selected?.step_id))) errors.push(`${label}: a required corrective slot cannot be filled by prep/support/spot salicylic.`)
      if (strategy.care_type !== 'corrective' && !nonempty(strategy.exception_reason)) errors.push(`${label}: direct-support/blocked strategy needs the actual finding or restriction.`)
      if (normalize(strategy.concern).includes('acne') && ['ENERGY.QS.TONING','ENERGY.QS.532'].includes(selected?.step_id)) errors.push(`${label}: standalone Q-switch cannot be the acne hero.`)
    }
    for (const outcome of session.concerns_addressed || []) {
      const row = rows.get(normalize(outcome.concern))
      if (!plannerInput) continue
      if (!row) { errors.push(`${label}: outcome concern "${outcome.concern}" is not present in supplied diagnosis/selection. Use the supplied parameter_name; do not substitute a phenotype or invented alias.`); continue }
      const current = row.score_or_label ?? row.current_score ?? row.current_value ?? row.final_score ?? null
      const target = row.target_single_session_score ?? row.target_score ?? row.target_value ?? null
      if (outcome.current_value !== current || outcome.target_value !== target) errors.push(`${label}: preserve supplied raw current/target values without rounding, inversion or invented gains.`)
    }
    const addons = typeSteps('lip_pigmentation_add_on')
    const decision = session.lip_pigmentation_rule
    const knownLipBlocks = clearance.blocked_steps?.['ENERGY.QS.LIP'] || []
    if (!nonempty(decision?.reason)) errors.push(`${label}: lip status reason is required.`)
    if (lip?.trigger) {
      if (decision?.status === 'included') {
        if (addons.length !== 1 || addons[0]?.lip_passes !== 2 || ingredientKey(addons[0]?.lip_serum) !== 'hyaluronicacid') errors.push(`${label}: lip protocol requires exactly two Q-switch passes with HA.`)
        if (knownLipBlocks.length) errors.push(`${label}: lip pass is blocked by existing clinical clearance.`)
      } else if (decision?.status === 'blocked_by_existing_constraints') {
        if (addons.length || !nonempty(decision.constraint_reference) || !JSON.stringify(constraints).includes(decision.constraint_reference)) errors.push(`${label}: blocked lip decision needs a real constraint reference and no lip step.`)
        if (!knownLipBlocks.length && !mediumPeels.length && knownNames.has(normalize('Q-Switch Laser'))) errors.push(`${label}: blocked lip status needs an actual evaluated history/proxy/temperature block or the medium-peel incompatibility.`)
      } else if (decision?.status === 'not_assessable') {
        if (!lip.visibility_caution || addons.length) errors.push(`${label}: lip non-assessability requires observed visibility evidence.`)
      } else errors.push(`${label}: triggered eligible lip treatment must be included or blocked with actual evidence.`)
    } else {
      const expected = lip?.assessable ? 'not_triggered' : 'not_assessable'
      if (decision?.status !== expected || addons.length) errors.push(`${label}: lip protocol must not trigger in this score/visibility state.`)
    }
  }
  if (errors.length) return { error: { code: 'facial_treatment_rule_violation', message: `Treatment plan does not meet clinic rules. ${errors[0]}`, details: [...new Set(errors)] } }
  return plan
}
