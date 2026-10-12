import { facialClientScore, prepareFacialEngineInput } from './clientScoreDisplay.js'
import {
  buildTreatmentCatalogue,
  catalogueReviewErrors,
  CATALOGUE_OMISSION_STATUSES,
} from './treatmentCatalogueReview.js'

// Treatment planning only. Scoring, reassessment and display formulas are unchanged.
export const CLINIC_SESSION_WINDOWS = {
  express: [35, 45],
  single: [60, 75],
  multiple: [60, 75],
}

// Planning preferences only; fixed doses, permitted windows and clinical rules win.
export const CLINIC_SESSION_TARGETS = { express: 40, single: 65, multiple: 65 }

export const CLINIC_STEP_TIMINGS = {
  cleansing: [2, 2],
  suction: [2, 4],
  carbon_application_drying: [3, 3],
  carbon_laser: [4, 4],
  infusion: [3, 3], // Facial infusion: per distinct ingredient.
  under_eye_infusion: [2, 2], // Whole ocular step; additional to facial infusion.
  hydra_spray: [3, 3], // Whole spray step, not per ingredient.
  cooling: [2, 5],
  peel_off_mask: [15, 15],
  finishing: [3, 3],
  spot_salicylic: [2, 2],
  chemical_peel: [3, 4],
  lymphatic_drainage: [5, 10],
  lip_pigmentation_add_on: [2, 2],
}

export const SUPPORTIVE_REVIEW_KEYS = [
  'under_eye_infusion',
  'facial_infusion',
  'cooling',
  'hydra_spray',
  'mask',
  'lymphatic_drainage',
  'other_relevant_options',
]

export function buildClinicGenerationContract() {
  return {
    session_windows_minutes: CLINIC_SESSION_WINDOWS,
    preferred_session_minutes: CLINIC_SESSION_TARGETS,
    session_target_policy: 'Plan toward 65 minutes for a single facial and EVERY detailed course facial, and 40 for express. Do not default to the lower bound. Use meaningful indicated care and realistic adjustable durations in approved ranges; preserve fixed doses and never add filler. Clinically justified totals elsewhere within the allowed window remain valid.',
    step_timings_minutes: CLINIC_STEP_TIMINGS,
    mandatory_care: 'Exactly one 5-10-minute clinical drainage step in every facial; one combined three-minute finish last. Include triggered lip care and approved regional care in the actual session sum.',
    validity: 'Actual doses, required equipment, approved ingredient routes, lip eligibility and executable structure are binding. Presentation summaries and catalogue coverage bookkeeping are advisory and do not require a second plan.',
    generation: 'Apply the clinical history, numeric, zone, pairing and sequence constraints while selecting the first plan. Check the actual session once before returning. No required keyword in corrective-benefit explanations. Do not output session speech or a separate session narrative; retain the facial title, duration and actual treatment instructions/metadata.',
  }
}

export const CLINIC_TREATMENT_RULES_PROMPT = `
CLINIC TREATMENT SELECTION AND TIMING (AUTHORITATIVE)
Use the supplied diagnosis and feature evidence; do not re-score, change targets,
change legacy-equivalent score-gap units, or invent missing findings. Existing
clinical contraindications and product/device restrictions always apply.

SESSION LENGTH: PREFERRED TARGETS WITHIN THE EXISTING WINDOWS
${Object.entries(CLINIC_SESSION_TARGETS).map(([type, target]) => `${type}: aim around ${target} minutes`).join('\n')}
  Select justified corrective treatment, useful regional care and required recovery first, then total their actual prescribed durations. Among clinically appropriate plans with comparable benefit, prefer one near the target. Do not treat the lower boundary as the default or omit useful compatible care merely because the minimum has been reached. These are soft targets, not exact-duration requirements: never add unnecessary treatment, inflate fixed timings or extend filler massage solely to reach them. Any justified session inside its existing window remains valid. All existing filler, dose, recovery and compatibility rules still apply.

COMPLETE SESSION WINDOWS, INCLUDING ANY INDICATED LIP TREATMENT:
${Object.entries(CLINIC_SESSION_WINDOWS)
  .map(([type, [min, max]]) => `${type}: ${min}-${max} minutes`)
  .join('\n')}
No 80-minute exception, no extra minutes beyond these ceilings. Reserve any
indicated 2-minute lip step while selecting the complete session. Preserve every
clinically required step and its proper dose; do not stretch or compress fixed
steps to force a fit. The final serum/moisturizer/sunscreen step remains 3 minutes.

Give EVERY step a clinic_step_type below, or "other" for a genuinely different
catalogued treatment. Do not use "other" to bypass an applicable timing rule:
${Object.entries(CLINIC_STEP_TIMINGS)
  .map(
    ([type, [min, max]]) =>
      `${type}: ${min === max ? min : `${min}-${max}`} minutes${type === 'infusion' ? ' PER distinct facially infused ingredient' : ''}`,
  )
  .join('\n')}

- Carbon Facial is exactly TWO steps: carbon_application_drying (3), then
  carbon_laser (4). Total 7, including treated facial zones. A generic 15-20-minute
  carbon block is invalid. This does not set the duration of standalone Q-switch.
- Facial infusion lists the distinct infusion_ingredients actually used;
  duration = 3 * ingredient count. Under-eye infusion and Hydra spray have their
  own fixed WHOLE-STEP durations, not this per-ingredient multiplier.
- Under-eye infusion: Ocular Ultrasound Infusion Probe, exactly 2 additional
  minutes total. Approved ingredients: Hyaluronic Acid, Niacinamide, Tranexamic
  Acid (TRX A), PDRN, Exosomes, Vitamin C. Choose only an appropriate compatible
  selection; permission for individual ingredients does not mean mix all six.
- Hydra spray: Oxygen Injection (Hydra spray), exactly 3 minutes total. Approved
  ingredients: Vitamin C, Tranexamic Acid (TRX A), Hyaluronic Acid, Niacinamide.
  The clinic specifies no fixed sequencing restriction for this step; existing
  product/device compatibility, clinical exclusions and final finish still apply.
- Both these steps must list infusion_ingredients and their exact catalogue
  equipment in ingredients_equipments. The under-eye step is additional to facial
  infusion, not time borrowed from it. Neither step is mandatory for every client.
- Cooling uses the Ice Probe for 2-5 minutes where the clinical protocol warrants it.
- Do not invent concentrations, product combinations, ocular device settings,
  energy settings or device instructions absent from the approved protocol.
  Identify any missing device-specific setting for clinician confirmation.
- Named chemical peels remain 3-4 minutes within their existing protocol; spot
  salicylic remains 2. Concentration, layers and endpoints are not changed here.

SPOT SALICYLIC CLASSIFICATION (PLANNING ONLY):
- The lesion-only spot_salicylic step is a targeted acne adjunct, NOT a corrective
  step. Do not count it as HERO_CORRECTIVE, SECONDARY_CORRECTIVE or
  TERTIARY_CORRECTIVE, toward the corrective-modality limit, or as satisfying a
  required corrective-treatment slot. Carbon + spot salicylic counts as ONE
  corrective; carbon + an independently justified broad peel + spot salicylic
  counts as TWO correctives plus an adjunct, not a tertiary corrective stack.
- Retain its existing active-lesion indication, contraindications, lesion-only
  coverage, approved salicylic choices and fixed 2-minute duration. Include its
  time and irritation/barrier burden in the complete-session assessment.
- This exclusion is only for lesion-directed spot salicylic. An independently
  selected broad/full-face salicylic peel remains a corrective modality.
- Existing combination safety and nonredundancy rules still apply; excluding
  this adjunct from the count does not require an additional corrective.

SELECTION ORDER (NOT A RIGID PROCEDURE SEQUENCE):
1. Apply clinical exclusions and the client's selected primary priorities.
2. Apply Rule E's indication-based corrective requirement as well as its existing
   numeric trigger. Select the highest-ranked appropriate corrective treatment or
   compatible combination at its prescribed dose, preserving required recovery care.
   A small predicted improvement gap alone does not justify substituting support.
   Compare any relevant added corrective for its case-specific additional benefit
   before allocating optional support or filler. Use the existing explanation fields
   for justified supportive-care exceptions and combination omissions; all clinical
   restrictions and complete session windows still apply.
3. Evaluate regional care, facial infusion, under-eye infusion, cooling, spray,
   mask selection and other relevant catalogue options against the FULL diagnosis.
   Consider support even when the relevant parameter was not chosen as primary.
   A supplied higher-is-better customer periocular score <=70 requires the
   additional two-minute ocular infusion under the supplied score rule. Use
   regional findings to select its approved serum; absent detailed findings,
   select appropriate hydration/comfort care. Missing scores do not trigger it.
4. Select support for useful additional clinical, regional, comfort or recovery
   benefit, including recovery from the planned procedure burden. Compare its
   actual contribution with selected care; a shared broad goal does not itself
   make delivery redundant. Explain the additional role of repeated ingredients
   in separate regions/routes under the existing compatibility protocols.
5. Compare worthwhile additions or substitutions before filler massage, including
   when the minimum duration is already met. Use the available complete window
   for beneficial care while preserving fixed doses and required recovery. Then
   retain the mandatory drainage reserved under the rule below.

Record a concise per-session decision in treatment_plan.modality_omission_explanation
for EACH of: ${SUPPORTIVE_REVIEW_KEYS.join(', ')}.
For multiple sessions, identify each session within these existing string fields.
State selected / unnecessary / redundant / contraindicated / protocol unavailable,
with the relevant finding, incremental role or reason. Do not output private
ranking deliberations; these are brief, checkable selection summaries.

MASSAGE:
- Exactly one Face and Neck Lymphatic Drainage Massage is mandatory in EVERY
  facial, 5-10 minutes, even when the other steps meet the session minimum.
- Use the existing massage_purpose "clinical" value (null elsewhere); explain
  mandatory drainage care and the selected duration in how_to_do and the existing
  lymphatic_drainage review. Reserve at least five minutes when planning.
- Adapt gently around active lesions and reactive/recently treated areas. Acne
  restrictions are lesion-local and never create a massage-omission option.
- Keep meaningful care at its real dose. Do not duplicate massage, automatically
  select ten minutes or inflate fixed steps to fill time. Placement is case-specific.

LIP RULE (INDICATION AND PROTOCOL UNCHANGED):
The application supplies clinic_treatment_context.lip_pigmentation.
- trigger uses the ROUNDED, higher-is-better CLIENT DISPLAY score <70: 69 triggers,
  70 does not. Use the supplied flag, never a raw severity score or target score.
- The full diagnosis is checked; selection as a primary concern is not required.
- If eligible and trigger=true, include one lip_pigmentation_add_on: exactly
  2 Q-switch passes with hyaluronic serum, exactly 2 minutes, before finishing.
  Set lip_passes: 2 and lip_serum: "Hyaluronic Acid".
- These 2 minutes count INSIDE the complete session window. Do not omit a required
  step or reduce a fixed clinical dose to fit. Plan the session with this time
  reserved; the former +2-over-ceiling exception no longer applies.
- Existing contraindications, proxy gates and temperature rules apply. If blocked,
  record blocked_by_existing_constraints with the actual condition/key and reason.
- Do not trigger on unassessable/obscured lips. Explicit lipstick/occlusion takes
  precedence over a fallback score. If supplied evidence makes lip assessment
  unreliable, record not_assessable and its evidence.
- No new lip wavelength, energy, frequency or serum sequence is specified. Use
  Dr. Aakriti's approved protocol where provided, otherwise mark those details
  for clinician confirmation. Do not invent future lip scores to disable the rule.

Include lip_pigmentation_rule status/reason/constraint_reference for each session.
Use the existing treatment-plan layout and response schema. Irrelevant step
metadata (infusion_ingredients, lip_passes, lip_serum, massage_purpose) is null.
If no clinically appropriate plan can meet these rules, return treatments: []
and explain the conflict in modality_omission_explanation.other_relevant_options.
Do not fabricate treatment or scores to produce a valid-looking session.
`

const stringSchema = { type: 'string' }
const numberSchema = { type: 'number' }
const nullableString = { type: ['string', 'null'] }
const objectSchema = (properties) => ({
  type: 'object',
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
})
const arraySchema = (items) => ({ type: 'array', items })

// Same treatment-plan layout; existing optional step metadata is explicitly nullable.
export const TREATMENT_PLAN_RESPONSE_FORMAT = {
  type: 'json_schema',
  name: 'facial_treatment_plan_v3',
  strict: true,
  schema: objectSchema({
    treatment_plan: objectSchema({
      total_time: stringSchema,
      treatments: arraySchema(
        objectSchema({
          session_number: { type: 'integer' },
          title: stringSchema,
          catalogue_review: objectSchema(
            Object.fromEntries(CATALOGUE_OMISSION_STATUSES.map((status) => [status, arraySchema(stringSchema)])),
          ),
          treatment_time: numberSchema,
          lip_pigmentation_rule: objectSchema({
            status: {
              type: 'string',
              enum: [
                'included',
                'not_triggered',
                'not_assessable',
                'blocked_by_existing_constraints',
              ],
            },
            reason: stringSchema,
            constraint_reference: stringSchema,
          }),
          week: numberSchema,
          preparations_checklist_for_therapist: arraySchema(stringSchema),
          concerns_addressed: arraySchema(
            objectSchema({
              concern: stringSchema,
              current_value: { type: ['number', 'string'] },
              target_value: { type: ['number', 'string'] },
            }),
          ),
          steps: arraySchema(
            objectSchema({
              step_number: { type: 'integer' },
              duration: numberSchema,
              clinic_step_type: {
                type: 'string',
                enum: [...Object.keys(CLINIC_STEP_TIMINGS), 'other'],
              },
              ingredients_equipments: arraySchema(stringSchema),
              catalogue_option_ids: arraySchema(stringSchema),
              how_to_do: stringSchema,
              script: stringSchema,
              infusion_ingredients: { type: ['array', 'null'], items: stringSchema },
              lip_passes: { type: ['integer', 'null'] },
              lip_serum: nullableString,
              massage_purpose: { type: ['string', 'null'], enum: ['filler', 'clinical', null] },
            }),
          ),
          step_duration_total: numberSchema,
          timing_validation: objectSchema({
            calculated_from_steps: numberSchema,
            matches_treatment_time: { type: 'boolean' },
          }),
        }),
      ),
      modality_omission_explanation: objectSchema(
        Object.fromEntries(
          [
            'q_switch_laser',
            'carbon_facial',
            'chemical_peel',
            'rf_hifu_microneedling',
            ...SUPPORTIVE_REVIEW_KEYS,
          ].map((key) => [key, stringSchema]),
        ),
      ),
    }),
  }),
}

export const normalizeTreatmentPlanType = (value) => (value === 'full' ? 'multiple' : value)

// Treatment request projection only; stored assessment/report values are untouched.
// Metric definitions and image-number UI links add no patient evidence here.
// Preserve all patient narratives, raw scores, semantics, maps, quality and unknown fields.
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

export function buildTreatmentPlannerInput(diagnosis, selected, treatmentType, clinicContext, constraints = {}) {
  const rawDiagnosis = prepareFacialEngineInput(diagnosis)
  const summary = selected?.treatable_concerns_summary ?? selected
  const rows = Array.isArray(summary)
    ? summary
    : Array.isArray(summary?.parameters_with_abnormal_scores)
      ? summary.parameters_with_abnormal_scores
      : []
  return {
    diagnosis_report: compactTreatmentDiagnosis(rawDiagnosis?.diagnosis_report ?? rawDiagnosis ?? {}),
    treatable_concerns: {
      description:
        summary?.description ||
        'Existing treatable concerns with the client-selected primary priorities.',
      parameters_with_abnormal_scores: prepareFacialEngineInput(rows),
    },
    treatment_plan_type: normalizeTreatmentPlanType(treatmentType),
    clinic_treatment_context: clinicContext,
    // Uniform rows avoid repeated object keys and implementation paths. Keep the
    // resource family: identical names in facial solutions and IVs are different options.
    treatment_catalogue: buildTreatmentCatalogue(constraints).map(({ id, source, name, equipment }) => ({
      id,
      family: {
        machines: 'machine', chemicalPeels: 'peel', jet_infusion_solutions: 'infusion_solution',
        peelOffMasks: 'mask', Special_ingredients_for_facials_type: 'facial_ingredient',
        treatment_tools: 'tool', ivInfusions: 'iv',
      }[source.split('.')[1].split('[')[0]],
      name,
      equipment: equipment || '',
    })),
  }
}
// Returns the minimum feasible filler duration, not the only permitted duration.
// Null means the remaining gap cannot be filled by one permitted massage step.
export function requiredFillerMinutes(otherMinutes, treatmentType) {
  const window = CLINIC_SESSION_WINDOWS[normalizeTreatmentPlanType(treatmentType)]
  if (!window || !Number.isFinite(otherMinutes) || otherMinutes < 0) return null
  const [minimum, maximum] = window
  if (otherMinutes >= minimum) return otherMinutes <= maximum ? 0 : null
  const minutes = Math.max(5, minimum - otherMinutes)
  return minutes <= 10 && otherMinutes + minutes <= maximum ? minutes : null
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

export function buildClinicTreatmentContext(diagnosis, featurePacket = {}) {
  const row = lipRow(diagnosis)
  const value = numeric(row?.score_or_label ?? row?.final_score ?? row?.current_score)
  let display = null
  if (value !== null && value >= 1 && value <= 100) {
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
  if (Array.isArray(value))
    value.forEach((child, index) => schemaErrors(child, schema.items, `${path}[${index}]`, errors))
  return errors
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

// Validate before saving. Arithmetic and required metadata are checked in code;
// patient-specific clinical benefit still requires review of the actual plan.
export function validateClinicTreatmentPlan(plan, context, treatmentType, constraints = {}, onWarnings = null) {
  if (plan?.error) return plan
  // The unchanged API wrapper projects client scores on return. Restore only a
  // validation copy so its display metadata is not mistaken for model schema drift.
  const enginePlan = prepareFacialEngineInput(plan)
  // Older saved plans may contain the retired session speech field.
  // Step scripts remain part of the actual treatment instructions.
  const legacySessions = enginePlan?.treatment_plan?.treatments
  for (const session of Array.isArray(legacySessions) ? legacySessions : []) {
    if (session && typeof session === 'object') delete session.script
  }
  const errors = schemaErrors(enginePlan, TREATMENT_PLAN_RESPONSE_FORMAT.schema)
  const warnings = []
  const treatments = enginePlan?.treatment_plan?.treatments
  const lip = context?.lip_pigmentation
  const normalizedType = normalizeTreatmentPlanType(treatmentType)
  const window = CLINIC_SESSION_WINDOWS[normalizedType]
  if (!window) errors.push('Unknown treatment plan type.')
  if (!Array.isArray(treatments) || !treatments.length) {
    errors.push(
      'No compliant treatment sessions returned. ' +
        (enginePlan?.treatment_plan?.modality_omission_explanation?.other_relevant_options || ''),
    )
  }
  if (!lip) errors.push('Lip-rule context is missing.')
  if (Array.isArray(treatments) && treatments.length) {
    if (['single', 'express'].includes(normalizedType) && treatments.length !== 1)
      errors.push('Single/Express must contain exactly one session.')
    if (normalizedType === 'multiple' && treatments.length < 5)
      errors.push('The existing multiple-session rule requires at least five sessions.')
  }
  const review = enginePlan?.treatment_plan?.modality_omission_explanation
  for (const key of SUPPORTIVE_REVIEW_KEYS) {
    if (!nonempty(review?.[key])) warnings.push({ code: 'missing_supportive_summary', field: key })
  }
  const protocols = constraints?.clinical_constraints?.supportive_treatment_protocols || {}
  const catalogueIngredients = constraints?.availableResources?.jet_infusion_solutions || []
  const coveredProbes = {
    ocularultrasoundinfusionprobe: 'under_eye_infusion',
    oxygeninjectionhydraspray: 'hydra_spray',
    iceprobe: 'cooling',
    faceultrasoundinfusionprobe: 'infusion',
  }
  const catalogue = buildTreatmentCatalogue(constraints)
  for (const [sessionIndex, session] of (Array.isArray(treatments) ? treatments : []).entries()) {
    const label = `Session ${sessionIndex + 1}`
    const steps = Array.isArray(session?.steps) ? session.steps : []
    for (const error of catalogueReviewErrors({ ...session, steps }, catalogue, label)) {
      // Selected resource identity remains binding. Omission-ledger bookkeeping
      // is not a reason to regenerate otherwise executable clinical steps.
      if (/unknown catalogue ID|must name its actual catalogue resource|must identify/i.test(error)) errors.push(error)
      else warnings.push({ code: 'catalogue_coverage', session_number: sessionIndex + 1 })
    }
    if (!steps.length) errors.push(`${label}: steps are missing.`)
    let totalMinutes = 0
    const byType = (type) => steps.filter((step) => step?.clinic_step_type === type)
    for (const [stepIndex, step] of steps.entries()) {
      if (!step || typeof step !== 'object') {
        errors.push(`${label}, step ${stepIndex + 1}: invalid step object.`)
        continue
      }
      const type = step.clinic_step_type
      const duration =
        typeof step.duration === 'number' && Number.isFinite(step.duration) ? step.duration : null
      if (duration === null || duration <= 0)
        errors.push(`${label}, step ${stepIndex + 1}: duration must be a positive number.`)
      totalMinutes += duration ?? 0
      if (type !== 'other' && !Object.hasOwn(CLINIC_STEP_TIMINGS, type)) {
        errors.push(`${label}, step ${stepIndex + 1}: clinic_step_type is missing or unknown.`)
        continue
      }
      const equipment = Array.isArray(step.ingredients_equipments)
        ? step.ingredients_equipments.map(normalize)
        : []
      for (const [probe, requiredType] of Object.entries(coveredProbes)) {
        if (equipment.some((item) => item.includes(probe)) && type !== requiredType) {
          errors.push(
            `${label}, step ${stepIndex + 1}: this probe must use clinic_step_type ${requiredType}.`,
          )
        }
      }
      if (['under_eye_infusion', 'hydra_spray', 'cooling'].includes(type)) {
        const probe = Object.keys(coveredProbes).find((key) => coveredProbes[key] === type)
        if (!equipment.some((item) => item.includes(probe)))
          errors.push(`${label}, step ${stepIndex + 1}: list the approved ${type} probe.`)
      }
      if (!nonempty(step.how_to_do)) errors.push(`${label}, step ${stepIndex + 1}: technique is required.`)
      if (!nonempty(step.script)) warnings.push({ code: 'missing_script', session_number: sessionIndex + 1, step_number: stepIndex + 1 })
      if (type === 'other') continue
      let [min, max] = CLINIC_STEP_TIMINGS[type]
      if (['infusion', 'under_eye_infusion', 'hydra_spray'].includes(type)) {
        const ingredients = step.infusion_ingredients
        const keys = Array.isArray(ingredients) ? ingredients.map(ingredientKey) : []
        if (
          !keys.length ||
          ingredients.some((value) => !nonempty(value)) ||
          new Set(keys).size !== keys.length
        ) {
          errors.push(
            `${label}, step ${stepIndex + 1}: list distinct actual infusion/spray ingredients; aliases do not count twice.`,
          )
        } else {
          const allowed =
            type === 'infusion'
              ? catalogueIngredients
                  .filter(
                    (item) =>
                      !item.approved_delivery_routes ||
                      item.approved_delivery_routes.includes(type),
                  )
                  .map((item) => ingredientKey(item.name))
              : (protocols[type]?.approved_ingredients || []).map(ingredientKey)
          if (keys.some((key) => !allowed.includes(key)))
            errors.push(`${label}, step ${stepIndex + 1}: ingredient is not approved for ${type}.`)
          if (type === 'infusion') min = max = 3 * keys.length
        }
      }
      if (duration === null || duration < min || duration > max) {
        errors.push(
          `${label}, step ${stepIndex + 1}: ${type} must take ${min === max ? min : `${min}-${max}`} minutes.`,
        )
      }
    }
    const finish = byType('finishing')
    if (finish.length !== 1 || steps.at(-1) !== finish[0])
      errors.push(`${label}: one combined 3-minute finish must be last.`)
    for (const type of ['under_eye_infusion', 'hydra_spray']) {
      if (byType(type).length > 1)
        errors.push(`${label}: ${type} is one whole step; do not duplicate it to fill time.`)
    }
    const massages = byType('lymphatic_drainage')
    if (massages.length !== 1)
      errors.push(`${label}: exactly one mandatory 5-10-minute lymphatic drainage massage is required.`)
    for (const massage of massages) {
      if (massage.massage_purpose !== 'clinical')
        errors.push(`${label}: mandatory drainage must use the existing clinical massage_purpose.`)
    }
    const carbonApplication = byType('carbon_application_drying')
    const carbonLaser = byType('carbon_laser')
    if (carbonApplication.length || carbonLaser.length) {
      if (
        carbonApplication.length !== 1 ||
        carbonLaser.length !== 1 ||
        steps.indexOf(carbonApplication[0]) >= steps.indexOf(carbonLaser[0])
      ) {
        errors.push(
          `${label}: carbon must be one 3-minute application/drying step followed by one 4-minute laser step.`,
        )
      }
    }
    if (window && (totalMinutes < window[0] || totalMinutes > window[1]))
      errors.push(
        `${label}: complete session totals ${totalMinutes} minutes; required ${window[0]}-${window[1]}, INCLUDING any lip treatment. Do not pad fixed steps.`,
      )
    const addOns = byType('lip_pigmentation_add_on')
    const decision = session?.lip_pigmentation_rule
    if (!decision || !nonempty(decision.reason))
      errors.push(`${label}: lip-rule status/reason is missing.`)
    if (lip?.trigger) {
      if (decision?.status === 'included') {
        if (
          addOns.length !== 1 ||
          numeric(addOns[0]?.lip_passes) !== 2 ||
          !['hyaluronicacid', 'hyaluronicserum', 'hyaluronicacidserum'].includes(
            normalize(addOns[0]?.lip_serum),
          )
        ) {
          errors.push(
            `${label}: required lip add-on must specify two Q-switch passes with hyaluronic serum.`,
          )
        }
      } else if (decision?.status === 'blocked_by_existing_constraints') {
        const ref = decision.constraint_reference
        if (!nonempty(ref) || !JSON.stringify(constraints).includes(ref) || addOns.length)
          errors.push(
            `${label}: a blocked lip add-on requires a real existing constraint reference and no lip step.`,
          )
      } else if (decision?.status === 'not_assessable') {
        if (!lip.visibility_caution || addOns.length)
          errors.push(
            `${label}: lip non-assessability requires supplied visibility evidence and no lip step.`,
          )
      } else
        errors.push(
          `${label}: client lip score is below 70 but the required lip add-on is missing.`,
        )
    } else {
      const expected = lip?.assessable ? 'not_triggered' : 'not_assessable'
      if (decision?.status !== expected || addOns.length)
        errors.push(
          `${label}: lip add-on must not be automatically triggered for this score/visibility state.`,
        )
    }
  }
  if (onWarnings) onWarnings(warnings)
  if (errors.length)
    return {
      error: {
        code: 'facial_treatment_rule_violation',
        message: `Treatment plan does not meet clinic rules. ${errors[0]}`,
        details: errors,
      },
    }
  return plan
}
