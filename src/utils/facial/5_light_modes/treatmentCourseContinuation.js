import { prepareFacialEngineInput } from '../clientScoreDisplay.js'
import { TREATMENT_CONCERN_FAMILIES, treatmentConcernFamily } from './treatmentEvidence.js'

const clone = value => JSON.parse(JSON.stringify(value))
const own = (value, key) => Object.prototype.hasOwnProperty.call(value || {}, key)
const fail = message => { throw Object.assign(new Error(message), { code: 'treatment_course_contract_violation' }) }

// Initial requests have no continuation scope and retain their exact old contract.
export function treatmentCourseWindow(input, treatmentType = input?.treatment_plan_type) {
  const scope = input?.course_continuation
  if (!scope) return null
  if (!['multiple', 'full'].includes(treatmentType)) fail('Only an existing multiple-session course can continue.')
  const after = scope.after_session_number
  const total = scope.total_sessions
  if (!Number.isInteger(after) || after < 2 || after % 2 || !Number.isInteger(total) || total < 5 || total > 8 || after >= total)
    fail('The continuation checkpoint or original course length is invalid.')
  const expected = Array.from({ length: Math.min(2, total - after) }, (_, i) => after + i + 1)
  if (JSON.stringify(scope.session_numbers) !== JSON.stringify(expected)) fail('Generate only the next one or two remaining course sessions.')
  const outline = scope.course_outline
  if (!Array.isArray(outline) || outline.length !== total || outline.some((row, i) =>
    row.session_number !== i + 1 || !Number.isFinite(row.week) || row.week < 1 || i > 0 && row.week <= outline[i - 1].week))
    fail('The original course outline must be complete, numbered and unchanged.')
  const slots = expected.map(number => outline[number - 1])
  if (slots.some(row => row.session_kind !== 'facial')) fail('A requested slot is a separate clinician session and needs its existing separate assessment pathway.')
  return { ...scope, session_numbers: expected, slots }
}

export const COURSE_CONTINUATION_INSTRUCTIONS = `REASSESSMENT-GATED COURSE CONTINUATION
This is a continuation of an already accepted course, not its initial generation. The supplied course_continuation overrides ONLY the initial-session numbering, first-week, detailed-session count and initial reassessment milestone wording above. All clinical constraints, strengths, dose, mandatory care, selection ambition, sequencing and output-content rules remain unchanged.
Generate treatments for exactly course_continuation.session_numbers, using their original outline weeks. Never restart at session 1, change the original course length, repeat earlier sessions, or detail any other future session. Return course_outline as []; the caller restores the complete original outline without model rewriting.
diagnosis_report contains the fresh internal post-session measurements, not the client-facing no-decline presentation. feature_evidence is from this checkpoint's post images. prior_visit is historical context, including prior actual treatments and the separately labeled client reassessment. Preserve client-selected primary concerns. No new next-session target was supplied unless explicitly present; never reuse an old forecast as a new measurement or invent a target.
Choose these next treatments afresh from the latest findings and actual previous response. Do not copy the preceding protocol automatically or invent subsequent tolerance, outcomes, dates or history. Recheck evolving intake, contraindications and approved settings at each actual treatment. Subsequent pairs require reassessment after the last session of the present pair; stop at the original total, including a single final session for an odd-length course.`

export function isPairedFacialCourse(assessment) {
  const plan = assessment?.treatment_sessions
  return ['multiple', 'full'].includes(assessment?.selected_plan_type) &&
    Array.isArray(plan?.course_outline) && plan.course_outline.length >= 5 && plan.course_outline.length <= 8 &&
    (plan.continuation_mode === 'reassessment_pairs_v1' || plan.treatments?.length === 2 &&
      plan.treatments.every((session, i) => Number(session.session_number) === i + 1 && session.steps?.some(step => step.step_id)))
}

// Nothing is written back to the baseline or the saved client report. Old maps,
// findings and forecasts are not silently promoted into a current assessment.
export function buildContinuationPlanningContext(context, currentFeaturePacket) {
  const scope = context?.course_continuation
  if (!scope) fail('The server-owned continuation scope is missing.')
  treatmentCourseWindow({ course_continuation: scope, treatment_plan_type: 'multiple' })
  const baseline = prepareFacialEngineInput(context.assessment?.diagnosis)
  const baselineRows = baseline?.diagnosis_report || baseline || {}
  const post = prepareFacialEngineInput(context.source_session?.post_diagnosis)
  const reassessed = post?.reassessment
  if (!reassessed || typeof reassessed !== 'object' || post.error) fail('A complete saved reassessment is required before continuing this course.')
  if (!currentFeaturePacket?.proxies || !currentFeaturePacket?.diagnosis_report || currentFeaturePacket.error)
    fail('Current post-session feature evidence is required; baseline scan features cannot stand in for it.')
  const rows = {}
  const consumed = new Set()
  for (const [key, original] of Object.entries(baselineRows)) {
    const family = treatmentConcernFamily(original?.parameter_name ?? original?.parameter, key)
    if (!family) continue
    const matches = Object.entries(reassessed).filter(([postKey, row]) => treatmentConcernFamily(row?.parameter_name, postKey) === family)
    if (matches.length !== 1) fail(`The saved reassessment must identify ${family.name} exactly once.`)
    const [postKey, row] = matches[0]
    consumed.add(postKey)
    if (!own(row, 'base_post_score_or_label_internal')) fail(`The fresh internal score is missing for ${family.name}; the displayed stable score cannot substitute for it.`)
    const internal = row.base_post_score_or_label_internal
    // Existing score adapters accept numeric strings from saved/model JSON too.
    // Normalize only the fresh internal value; never use the displayed score.
    const current = family.mother_map_index === 0 ? internal
      : typeof internal === 'number' || typeof internal === 'string' && internal.trim()
        ? Number(internal) : NaN
    if (family.mother_map_index === 0 ? typeof current !== 'string' || !current.trim()
      : typeof current !== 'number' || !Number.isFinite(current) || current < 1 || current > 100)
      fail(`The fresh internal score/label is invalid for ${family.name}.`)
    const mapped = {}
    for (const name of ['continuous_index_name', 'continuous_index_polarity', 'score_semantics', 'score_polarity', 'comparison_mode', 'ideal_score_direction'])
      if (own(original, name)) mapped[name] = original[name]
    rows[key] = {
      ...mapped,
      parameter_name: original.parameter_name || family.name,
      score_or_label: current,
      finding: 'Current findings are supplied in feature_evidence from this checkpoint; prior findings are historical only.',
      data_quality: { source: 'saved_reassessment_internal', checkpoint_session_number: scope.after_session_number },
    }
  }
  if (Object.keys(rows).length !== TREATMENT_CONCERN_FAMILIES.length || consumed.size !== TREATMENT_CONCERN_FAMILIES.length)
    fail('All 15 current parameters are required to continue the course without borrowing stale baseline measurements.')
  const originalSelected = prepareFacialEngineInput(context.assessment.parameters_with_abnormal_scores)
  const selection = originalSelected?.parameters_with_abnormal_scores || originalSelected?.treatable_concerns_summary?.parameters_with_abnormal_scores || []
  const selected = selection.map(row => {
    const family = treatmentConcernFamily(row.parameter_name ?? row.parameter)
    const current = Object.values(rows).find(item => treatmentConcernFamily(item.parameter_name) === family)
    if (!current) fail('An original selected concern does not identify a current diagnostic parameter.')
    return { parameter_name: current.parameter_name, current_score: current.score_or_label,
      is_primary_concern: row.is_primary_concern === true || row.is_primary_concern === 'true' || row.is_primary_concern === 1 || row.is_primary_concern === '1' }
  })
  if (!selected.length) fail('The stored client concern selection is missing.')
  return {
    assessment: clone(context.assessment),
    diagnosis: { diagnosis_report: rows },
    featurePacket: clone(currentFeaturePacket),
    selectedConcerns: { parameters_with_abnormal_scores: selected },
    courseContinuation: clone(scope),
    priorVisit: {
      baseline_diagnosis_historical_only: clone(baseline),
      original_selected_concerns_and_targets_historical_only: clone(originalSelected),
      checkpoint_session_number: scope.after_session_number,
      client_reassessment_historical_presentation: clone(post),
      previous_treatments: clone(context.previous_treatments || []),
      interpretation: 'Only diagnosis_report and feature_evidence describe the current measured state. The no-decline client report and original targets are not substitutes for fresh internal measurements.',
    },
  }
}
