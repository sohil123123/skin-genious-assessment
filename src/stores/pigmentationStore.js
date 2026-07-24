/**
 * Pigmentation Decode V2.3 — Pinia orchestration store.
 *
 * Clinical pipeline:
 *   five-mode capture -> morphology census -> locked phenotype measurement
 *   -> application validation/scoring -> group-linked history -> diagnosis audit
 *   -> component/location-targeted treatment -> matched reassessment.
 *
 * This store deliberately preserves legacy UI/persistence fields while treating the
 * validated V2.3 phenotype, diagnosis and normalized treatment operations as authoritative.
 */

import { defineStore } from 'pinia'
import { useOpenAI } from 'src/composables/useOpenAI'
import { useAssessmentStore } from 'src/stores/assessmentStore'
import { useIVAssessmentStore } from 'src/stores/ivAssessmentStore'
import { api } from 'src/boot/axios'
import { Loading, LocalStorage } from 'quasar'
import { useCommonStore } from 'src/stores/commonStore'
import {
  MORPHOLOGY_CENSUS_PROMPT,
  PHENOTYPE_MEASUREMENT_PROMPT,
  DYNAMIC_QUESTIONS_PROMPT,
  DIAGNOSIS_PROMPT,
  PLAN_PROMPT,
  PIGMENTATION_CLINICAL_POLICY_V2,
  PIGMENTATION_PROMPT_VERSION,
  PIGMENTATION_POLICY_VERSION,
  REASSESS_PROMPT,
  REASSESS_QUESTIONS_PROMPT,
} from 'src/services/pigmentationPromptsV2_1'
import {
  PIGMENTATION_CONFIG,
  assertPigmentationPolicyCompatibility,
  buildPigmentationMorphologyConfig,
  buildPigmentationMeasurementConfig,
  buildPigmentationComponentSelectionConfig,
  buildPigmentationExecutionConfig,
  resolvePigmentationProtocolMapEntry,
  getPigmentationProtocolRecord,
} from 'src/services/pigmentationConfigV2'
import { validatePigmentationPlan } from 'src/services/pigmentation/Validators/pigmentationPlanValidator'
import {
  PigmentationImageValidationError,
  PigmentationPhenotypeDiscrepancyError,
  PigmentationDiagnosisValidationError,
  validatePigmentationMorphologyCensus,
  validateAndScorePigmentationImageAnalysis,
  extractImmutablePigmentationMetrics,
  validatePigmentationDiagnosis,
  assertDiagnosisReadyForTreatmentPlanning,
} from 'src/services/pigmentation/Validators/pigmentationImageValidation'

const PIPELINE_VERSION = 'pigmentation_store_pipeline_v2_3_2026_07_23'
const REQUIRED_IMAGE_MODES = PIGMENTATION_CONFIG.image_acquisition.canonical_mode_order
const IMAGE_DETAIL = PIGMENTATION_CONFIG.image_acquisition.api_image_detail || 'high'

// max_output_tokens includes both hidden reasoning tokens and visible JSON output.
// These budgets are intentionally generous because the morphology and phenotype stages
// return large structured records and use high reasoning effort. Tune only after reviewing
// response.usage.output_tokens_details.reasoning_tokens in staging logs.
const OPENAI_STAGE_OPTIONS = Object.freeze({
  morphology_census: Object.freeze({
    max_output_tokens: 32000,
    reasoning_effort: 'high',
    verbosity: 'low',
  }),
  phenotype_measurement: Object.freeze({
    max_output_tokens: 48000,
    reasoning_effort: 'high',
    verbosity: 'low',
  }),
  dynamic_history: Object.freeze({
    max_output_tokens: 8000,
    reasoning_effort: 'medium',
    verbosity: 'low',
  }),
  diagnosis: Object.freeze({
    max_output_tokens: 32000,
    reasoning_effort: 'high',
    verbosity: 'medium',
  }),
  treatment_plan: Object.freeze({
    max_output_tokens: 48000,
    reasoning_effort: 'high',
    verbosity: 'medium',
  }),
  formal_reassessment: Object.freeze({
    max_output_tokens: 32000,
    reasoning_effort: 'high',
    verbosity: 'medium',
  }),
  reassessment_questions: Object.freeze({
    max_output_tokens: 8000,
    reasoning_effort: 'medium',
    verbosity: 'low',
  }),
})

const PHENOTYPE_METRICS = [
  {
    id: 'global_background_melanin_load_index',
    label: 'Background Melanin Load Index',
    legacyKey: 'melanin_load_index',
  },
  {
    id: 'global_background_erythema_load_index',
    label: 'Background Erythema Load Index',
    legacyKey: 'erythema_load_index',
  },
  {
    id: 'active_inflammatory_lesion_burden_index',
    label: 'Active Inflammatory Lesion Burden',
    legacyKey: 'active_inflammatory_lesion_burden_index',
  },
  {
    id: 'flat_focal_pigmented_lesion_burden_index',
    label: 'Flat Focal Pigment Burden',
    legacyKey: 'flat_focal_pigmented_lesion_burden_index',
  },
  {
    id: 'raised_pigmented_lesion_burden_index',
    label: 'Raised Pigmented Lesion Burden',
    legacyKey: 'raised_pigmented_lesion_burden_index',
  },
  {
    id: 'structural_periocular_shadow_burden_index',
    label: 'Structural Periocular Shadow Burden',
    legacyKey: 'structural_periocular_shadow_burden_index',
  },
]

const RISK_INDEX_MAP = {
  low: 25,
  low_to_moderate: 38,
  moderate: 50,
  moderate_indian_skin_default: 55,
  high_indian_skin_default: 75,
  high: 75,
  not_present: 1,
}

function deepClone(value) {
  if (value === undefined) return undefined
  return JSON.parse(JSON.stringify(value))
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function titleCase(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function validationIssues(error) {
  const issues = Array.isArray(error?.issues)
    ? error.issues
    : Array.isArray(error?.errors)
      ? error.errors
      : []
  return issues.length ? issues : [error?.message || 'Unknown validation error']
}

function riskToIndex(value, fallback = 50) {
  return RISK_INDEX_MAP[String(value || '').toLowerCase()] ?? fallback
}

function complianceRiskToIndex(value) {
  const risk = String(value || '').toLowerCase()
  if (risk === 'low') return 75
  if (risk === 'moderate') return 50
  if (risk === 'high') return 25
  return 50
}

function metricInterpretation(score) {
  const n = Number(score)
  if (!Number.isFinite(n)) return 'not available'
  if (n <= 15) return 'minimal'
  if (n <= 35) return 'mild'
  if (n <= 55) return 'moderate'
  if (n <= 75) return 'severe'
  return 'very severe'
}

function groupMapFromPhenotype(phenotype) {
  return new Map(asArray(phenotype?.morphology_groups).map((group) => [group.group_id, group]))
}

function getPlanSessions(plan) {
  if (Array.isArray(plan?.current_treatment_block?.sessions)) {
    return plan.current_treatment_block.sessions
  }
  return asArray(plan?.sessions)
}

function protocolIdsFromMapEntry(entry) {
  const ids = new Set()
  if (!entry || typeof entry !== 'object') return ids

  Object.entries(entry).forEach(([key, value]) => {
    if (
      (key === 'eligible_protocol_ids' ||
        key === 'conditional_candidate_protocol_ids' ||
        key.endsWith('_protocol_ids')) &&
      Array.isArray(value)
    ) {
      value.forEach((protocolId) => {
        if (nonEmpty(protocolId)) ids.add(protocolId)
      })
    }
  })

  return ids
}

function resolveComponentProtocolOptions(component) {
  const family = component?.family || ''
  let subtype = component?.subtype || 'any'

  if (
    family === 'post_inflammatory_hyperpigmentation' &&
    component?.inflammation_first_required === true
  ) {
    subtype = 'active_inflammation_present'
  }

  const mapEntry = resolvePigmentationProtocolMapEntry(family, subtype)
  return {
    diagnostic_component_id: component?.diagnostic_component_id,
    family,
    subtype,
    clinical_location_text: component?.clinical_location_text,
    linked_group_ids: asArray(component?.linked_group_ids),
    direct_cosmetic_treatment_status: component?.direct_cosmetic_treatment_status,
    inflammation_first_required: component?.inflammation_first_required === true,
    barrier_repair_first_required: component?.barrier_repair_first_required === true,
    protocol_map_entry: mapEntry,
  }
}

function buildPlanningConfigBundle(diagnosis) {
  const componentOptions = asArray(diagnosis?.diagnostic_components).map(
    resolveComponentProtocolOptions,
  )
  const protocolIds = new Set()

  componentOptions.forEach((option) => {
    protocolIdsFromMapEntry(option.protocol_map_entry).forEach((id) => protocolIds.add(id))
  })

  const executableProtocolIds = []
  const unavailableProtocols = []
  for (const protocolId of protocolIds) {
    const record = getPigmentationProtocolRecord(protocolId)
    if (!record) {
      unavailableProtocols.push({
        protocol_id: protocolId,
        reason: 'Protocol ID is not present in the active clinic config.',
      })
    } else if (record.protocol?.configured_for_execution === false) {
      unavailableProtocols.push({
        protocol_id: protocolId,
        reason: record.protocol.block_reason || 'Protocol is not configured for execution.',
      })
    } else {
      executableProtocolIds.push(protocolId)
    }
  }

  return {
    component_selection_config: buildPigmentationComponentSelectionConfig(),
    component_protocol_options: componentOptions,
    execution_config: buildPigmentationExecutionConfig(executableProtocolIds),
    unavailable_protocols: unavailableProtocols,
  }
}

function buildLegacyFixedProtocol(session, plan) {
  const fixed = {
    homecare: {
      morning: asArray(plan?.homecare_plan?.morning),
      night: asArray(plan?.homecare_plan?.evening),
      avoid: asArray(plan?.homecare_plan?.sun_and_heat_control),
    },
  }

  asArray(session?.treatment_operations).forEach((operation) => {
    const parameters = operation?.parameters || {}
    switch (operation?.modality_id) {
      case 'q_switch_laser':
      case 'focal_laser':
        fixed.q_switch = {
          use: true,
          protocol_id: operation.protocol_id,
          wavelength_nm: parameters.wavelength_nm ?? parameters.wavelength,
          energy_mj: parameters.energy_mj,
          energy_range_mj: parameters.energy_range_mj,
          fluence_j_cm2: parameters.fluence_j_cm2,
          spot_area_cm2: parameters.spot_area_cm2,
          frequency_hz: parameters.frequency_hz,
          passes: parameters.passes,
          endpoint: operation.endpoint,
          target_location_text: operation.target_location_text,
          exclude_group_ids: operation.exclude_group_ids,
          exclusion_instruction: operation.exclusion_instruction,
        }
        break
      case 'chemical_peel':
        fixed.peel = {
          use: true,
          protocol_id: operation.protocol_id,
          peel_name: parameters.peel_name || parameters.product_name || operation.protocol_id,
          strength: parameters.strength || parameters.concentration,
          contact_time_minutes: parameters.contact_time_minutes ?? parameters.contact_time_min,
          neutralization_required:
            parameters.neutralization_required ?? parameters.neutralisation_required,
          endpoint: operation.endpoint,
          target_location_text: operation.target_location_text,
          exclude_group_ids: operation.exclude_group_ids,
          exclusion_instruction: operation.exclusion_instruction,
        }
        break
      case 'microneedling_with_active':
        fixed.microneedling = {
          use: true,
          protocol_id: operation.protocol_id,
          device: parameters.device,
          depths_mm: parameters.depths_mm || parameters.regional_depths_mm,
          actives: parameters.actives || parameters.active_formula,
          route: parameters.route,
          injectable: false,
          endpoint: operation.endpoint,
          target_location_text: operation.target_location_text,
          exclude_group_ids: operation.exclude_group_ids,
          exclusion_instruction: operation.exclusion_instruction,
        }
        break
      case 'electrocautery_or_rf':
        fixed.lesion_directed_procedure = {
          use: true,
          procedure: 'electrocautery_or_rf',
          protocol_id: operation.protocol_id,
          endpoint: operation.endpoint,
          target_location_text: operation.target_location_text,
          linked_group_ids: operation.linked_group_ids,
          exclude_group_ids: operation.exclude_group_ids,
          exclusion_instruction: operation.exclusion_instruction,
        }
        break
      case 'led':
        fixed.led = {
          use: true,
          protocol_id: operation.protocol_id,
          mode: parameters.mode || parameters.colour || operation.protocol_id,
          role: operation.role,
        }
        break
      default:
        break
    }
  })

  return fixed
}

function normalisePlanForUi(plan) {
  if (!plan || typeof plan !== 'object') return plan
  const normalized = deepClone(plan)
  const sessions = getPlanSessions(normalized).map((session) => ({
    ...session,
    id: session.id || session.session_number,
    status: session.status || 'pending',
    goal: session.goal || session.session_goal || '',
    selected_modalities:
      asArray(session.selected_modalities).length > 0
        ? session.selected_modalities
        : asArray(session.selected_modality_ids),
    fixed_protocol: session.fixed_protocol || buildLegacyFixedProtocol(session, normalized),
    provider_protocol: session.provider_protocol || {
      treatment_operations: asArray(session.treatment_operations),
      session_execution_sequence: asArray(session.session_execution_sequence),
      provider_checkpoint: session.provider_checkpoint || '',
    },
  }))

  normalized.sessions = sessions
  if (normalized.current_treatment_block) {
    normalized.current_treatment_block.sessions = sessions
  }
  return normalized
}

function deriveGoalsFromPlan(plan) {
  const goals = []
  const baseline = plan?.baseline_summary || {}
  const reassessAfter = plan?.master_treatment_roadmap?.next_formal_reassessment_after_session
  const timeframe = reassessAfter
    ? `After session ${reassessAfter}`
    : plan?.duration || 'At formal reassessment'

  asArray(plan?.expected_outcomes?.component_specific).forEach((outcome) => {
    const metric = outcome.measurement_to_repeat
    const baselineValue = baseline?.[metric]
    goals.push({
      metric: `${titleCase(metric)} (${outcome.diagnostic_component_id || ''})`,
      metric_id: metric,
      diagnostic_component_id: outcome.diagnostic_component_id,
      linked_group_ids: asArray(outcome.linked_group_ids),
      clinical_location_text: outcome.clinical_location_text || '',
      baseline: baselineValue === undefined ? '—' : String(baselineValue),
      target: outcome.expected_change || 'Clinically meaningful improvement',
      timeframe,
      how_measured: 'Same five-mode analyser protocol and same phenotype group/location',
    })
  })

  if (goals.length === 0) {
    PHENOTYPE_METRICS.forEach((metric) => {
      if (baseline[metric.id] === undefined) return
      goals.push({
        metric: metric.label,
        metric_id: metric.id,
        baseline: String(baseline[metric.id]),
        target:
          metric.id === 'structural_periocular_shadow_burden_index'
            ? 'Track separately; do not use as pigment-treatment success metric'
            : 'Reduction without unsafe inflammation or PIH',
        timeframe,
        how_measured: 'Same five-mode analyser protocol',
      })
    })
  }

  return goals
}

function mapDiagnosisForLegacyUi(validatedDiagnosis, phenotype, formData) {
  const mapped = deepClone(validatedDiagnosis)
  const components = asArray(mapped.diagnostic_components)
  const dominantId = mapped.working_impression?.dominant_treatable_component_id
  const primaryComponent =
    components.find((component) => component.diagnostic_component_id === dominantId) ||
    components[0] ||
    null

  const primaryDx =
    primaryComponent?.subtype ||
    primaryComponent?.family ||
    mapped.working_impression?.overall_summary ||
    ''
  const primaryConfidence = Number(primaryComponent?.confidence_100) || 0
  const alternatives = asArray(mapped.ranked_differential).map((item) => ({
    dx: item.subtype || item.family || '',
    likelihood: Number.isFinite(Number(item.confidence_100))
      ? `${item.confidence_100}%`
      : 'possible',
    reconsider_when: asArray(item.what_would_change_ranking).join('; '),
  }))

  const metrics = mapped.immutable_image_metrics || {}
  const composition = phenotype?.global_background_indices?.composition || {}
  const risk = mapped.risk_profile || {}
  const scores = {}
  const scoreList = []

  PHENOTYPE_METRICS.forEach((metric) => {
    const value = metrics[metric.id]
    if (value === undefined) return
    scores[metric.legacyKey] = value
    scoreList.push({
      name: metric.label,
      value: String(value),
      scale: '1–100',
      interpretation: metricInterpretation(value),
    })
  })

  scores.composition_melanin_percent = composition.melanin_percent ?? null
  scores.composition_vascular_percent = composition.vascular_percent ?? null
  scores.recurrence_risk_index = riskToIndex(risk.recurrence_risk)
  scores.procedure_risk_index = riskToIndex(risk.procedure_risk)
  scores.sunscreen_compliance_index = complianceRiskToIndex(risk.sunscreen_compliance_risk)
  scores.diagnosis_confidence_index = primaryConfidence

  scoreList.push(
    {
      name: 'Recurrence Risk Score',
      value: String(scores.recurrence_risk_index),
      scale: '1–100 derived category index',
      interpretation: risk.recurrence_risk || 'moderate',
    },
    {
      name: 'Procedure Risk Score',
      value: String(scores.procedure_risk_index),
      scale: '1–100 derived category index',
      interpretation: risk.procedure_risk || 'moderate',
    },
    {
      name: 'Diagnosis Confidence Score',
      value: String(primaryConfidence),
      scale: '1–100',
      interpretation: primaryComponent?.diagnostic_status || 'pending doctor confirmation',
    },
  )

  const medicallyAtypical =
    risk.medically_atypical_lesion_risk &&
    !['not_present', 'low'].includes(risk.medically_atypical_lesion_risk)
  const atypicalComponent = components.some(
    (component) => component.family === 'medically_atypical_focal_lesion',
  )
  const needsCloseup = components.some((component) =>
    ['hold_until_closeup', 'hold_until_doctor_assessment'].includes(
      component.direct_cosmetic_treatment_status,
    ),
  )
  const redFlagPresent = Boolean(medicallyAtypical || atypicalComponent)
  const redFlagItems = components
    .filter((component) => component.family === 'medically_atypical_focal_lesion')
    .map(
      (component) =>
        `${component.patient_title || component.family}: ${component.clinical_location_text}`,
    )

  mapped.needs_summary = false
  mapped.needs_dermoscopy = Boolean(needsCloseup || redFlagPresent)
  mapped.dermoscopy_request = mapped.needs_dermoscopy
    ? {
        reason: redFlagPresent
          ? 'A focal morphology requires direct doctor assessment before treatment.'
          : 'A closer examination is required to confirm treatment eligibility.',
        look_for: [
          'surface morphology',
          'border architecture',
          'colour heterogeneity',
          'evolution',
        ],
      }
    : null
  mapped.differential = {
    primary: {
      dx: primaryDx,
      confidence: primaryConfidence,
      reasoning:
        mapped.summaries?.clinical_summary_for_doctor ||
        mapped.working_impression?.overall_summary ||
        '',
    },
    alternatives,
  }
  mapped.depth_assessment = {
    verdict:
      primaryComponent?.depth ||
      phenotype?.global_background_indices?.depth_call?.type ||
      formData?.depth ||
      'uncertain',
    basis: asArray(primaryComponent?.evidence_for).join('; '),
    prognosis: 'Component-specific response must be reassessed using the same phenotype group.',
  }
  mapped.composition_assessment = {
    dominant: composition.type || formData?.comp || 'uncertain',
    note: 'Copied from the validated image phenotype record.',
  }
  mapped.scores = scores
  mapped.scores_list = scoreList
  mapped.severity_interpretation = `Dominant component confidence: ${primaryConfidence}%. Each morphology group remains separately reportable and treatable.`
  mapped.red_flags = {
    present: redFlagPresent,
    items: redFlagItems,
    action: redFlagPresent ? 'Doctor assessment before direct cosmetic treatment.' : '',
  }
  mapped.uncertainties = components.flatMap((component) =>
    asArray(component.missing_discriminators),
  )

  return mapped
}

function buildTreatmentPlansPersistence(plan) {
  if (!plan) return null
  const sessions = getPlanSessions(plan)
  const treatments = sessions.map((session) => {
    const weekMatch = String(session.timing || '').match(/\d+/)
    const week = weekMatch ? Number(weekMatch[0]) : Number(session.session_number) || 1
    const operations = asArray(session.treatment_operations)
    const execution = asArray(session.session_execution_sequence)

    const checklist = [
      'Verify patient identity, consent, current contraindications and doctor approval.',
      ...operations.map(
        (operation) =>
          `${titleCase(operation.modality_id)} — ${operation.protocol_id || 'non-protocol pathway'} — ${operation.target_location_text || ''}`,
      ),
    ]

    const steps = execution.map((step, index) => ({
      step_number: step.step_number || index + 1,
      duration: step.duration || 'As specified by protocol',
      ingredients_equipments: [step.protocol_id].filter(Boolean),
      how_to_do: [
        step.instruction,
        step.target_location_text ? `Target: ${step.target_location_text}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
    }))

    if (steps.length === 0) {
      operations.forEach((operation, index) => {
        steps.push({
          step_number: index + 1,
          duration: 'As specified by protocol',
          ingredients_equipments: [operation.protocol_id].filter(Boolean),
          how_to_do: `${titleCase(operation.modality_id)} at ${operation.target_location_text}. ${operation.exclusion_instruction || ''}`,
        })
      })
    }

    return {
      session_number: session.session_number,
      title:
        asArray(session.selected_modality_ids).map(titleCase).join(' + ') ||
        session.session_goal ||
        'Pigmentation Session',
      treatment_time: session.treatment_time || '45–75 mins',
      week,
      preparations_checklist_for_therapist: checklist,
      concerns_addressed: [session.session_goal || 'Component-specific pigmentation treatment'],
      steps,
      daily_home_care_routine: [
        `Morning: ${asArray(plan.homecare_plan?.morning).join(', ')}`,
        `Evening: ${asArray(plan.homecare_plan?.evening).join(', ')}`,
        `Sun & heat control: ${asArray(plan.homecare_plan?.sun_and_heat_control).join(', ')}`,
      ].filter((line) => !line.endsWith(': ')),
      provider_protocol: {
        treatment_operations: operations,
        session_execution_sequence: execution,
        provider_checkpoint: session.provider_checkpoint || '',
      },
      script: '',
    }
  })

  return {
    treatment_plans: {
      total_time: plan.duration || 'Course duration pending doctor validation',
    },
    treatment_plan: { treatments },
    recommended_full_plan: {
      ...plan,
      sessions: getPlanSessions(plan),
    },
  }
}

function validateDynamicQuestionSet(questions, phenotype) {
  if (!Array.isArray(questions)) throw new Error('Dynamic questions must be an array.')
  if (questions.length > 8) throw new Error('Dynamic question response exceeded the maximum of 8.')

  const groups = groupMapFromPhenotype(phenotype)
  const seen = new Set()
  questions.forEach((question, index) => {
    if (!nonEmpty(question?.question_id) || seen.has(question.question_id)) {
      throw new Error(`Invalid or duplicate dynamic question_id at index ${index}.`)
    }
    seen.add(question.question_id)
    if (!nonEmpty(question?.question)) {
      throw new Error(`Dynamic question ${question.question_id} has no question text.`)
    }
    const linked = asArray(question.linked_group_ids)
    if (linked.length === 0) {
      throw new Error(`Dynamic question ${question.question_id} must link to a morphology group.`)
    }
    linked.forEach((groupId) => {
      if (!groups.has(groupId)) {
        throw new Error(`Dynamic question ${question.question_id} references unknown ${groupId}.`)
      }
    })
    if (linked.length === 1) {
      const expectedLocation = groups.get(linked[0])?.clinical_location_text
      if (question.clinical_location_text !== expectedLocation) {
        throw new Error(
          `Dynamic question ${question.question_id} changed the image-stage location for ${linked[0]}.`,
        )
      }
    } else if (!nonEmpty(question.clinical_location_text)) {
      throw new Error(`Dynamic question ${question.question_id} requires a location description.`)
    }
  })
  return questions
}

function validateReassessmentQuestionSet(questions, diagnosis, phenotype) {
  if (!Array.isArray(questions)) throw new Error('Reassessment questions must be an array.')
  if (questions.length > 8)
    throw new Error('Reassessment question response exceeded the maximum of 8.')

  const components = new Map(
    asArray(diagnosis?.diagnostic_components).map((component) => [
      component.diagnostic_component_id,
      component,
    ]),
  )
  const groups = groupMapFromPhenotype(phenotype)
  const seen = new Set()

  questions.forEach((question, index) => {
    if (!nonEmpty(question?.question_id) || seen.has(question.question_id)) {
      throw new Error(`Invalid or duplicate reassessment question_id at index ${index}.`)
    }
    seen.add(question.question_id)
    if (!nonEmpty(question.question)) {
      throw new Error(`Reassessment question ${question.question_id} has no text.`)
    }
    asArray(question.linked_component_ids).forEach((componentId) => {
      if (!components.has(componentId)) {
        throw new Error(
          `Reassessment question ${question.question_id} references unknown ${componentId}.`,
        )
      }
    })
    const linkedGroups = asArray(question.linked_group_ids)
    linkedGroups.forEach((groupId) => {
      if (!groups.has(groupId)) {
        throw new Error(
          `Reassessment question ${question.question_id} references unknown ${groupId}.`,
        )
      }
    })
    if (linkedGroups.length === 1) {
      const expectedLocation = groups.get(linkedGroups[0])?.clinical_location_text
      if (question.clinical_location_text !== expectedLocation) {
        throw new Error(
          `Reassessment question ${question.question_id} changed baseline location for ${linkedGroups[0]}.`,
        )
      }
    }
  })
  return questions
}

function validateReassessmentRecord(record, baselinePhenotype, followupPhenotype) {
  const errors = []
  const allowedStatuses = new Set([
    'complete_pending_doctor_review',
    'blocked_for_diagnostic_review',
    'insufficient_image_comparability',
  ])
  if (!record || typeof record !== 'object') errors.push('Reassessment must be an object.')
  if (!allowedStatuses.has(record?.reassessment_status)) {
    errors.push(`Invalid reassessment_status '${record?.reassessment_status}'.`)
  }
  if (record?.policy_version !== PIGMENTATION_POLICY_VERSION) {
    errors.push('Reassessment policy_version does not match the active V2.3 policy.')
  }

  const baselineMetrics = extractImmutablePigmentationMetrics(baselinePhenotype)
  const followupMetrics = extractImmutablePigmentationMetrics(followupPhenotype)
  PHENOTYPE_METRICS.forEach((metric) => {
    const change = record?.global_metric_change?.[metric.id]
    if (!change) {
      errors.push(`global_metric_change.${metric.id} is missing.`)
      return
    }
    const expectedBaseline = baselineMetrics[metric.id]
    const expectedCurrent = followupMetrics[metric.id]
    if (change.baseline !== expectedBaseline) {
      errors.push(`${metric.id}.baseline does not match the validated baseline phenotype.`)
    }
    if (change.current !== expectedCurrent) {
      errors.push(`${metric.id}.current does not match the validated follow-up phenotype.`)
    }
    if (change.delta !== expectedCurrent - expectedBaseline) {
      errors.push(`${metric.id}.delta is arithmetically incorrect.`)
    }
  })

  const baselineGroups = groupMapFromPhenotype(baselinePhenotype)
  asArray(record?.group_and_component_response).forEach((response, index) => {
    const group = baselineGroups.get(response?.baseline_group_id)
    if (!group) {
      errors.push(`group_and_component_response[${index}] references unknown baseline group.`)
      return
    }
    if (response.clinical_location_text !== group.clinical_location_text) {
      errors.push(`group_and_component_response[${index}] changed baseline location text.`)
    }
  })

  if (errors.length) {
    const error = new Error(`Pigmentation reassessment failed validation: ${errors.join(' | ')}`)
    error.issues = errors
    throw error
  }

  return {
    ...deepClone(record),
    reassessment_record_type: 'validated_pigmentation_reassessment',
    validation_metadata: {
      status: 'application_validated',
      pipeline_version: PIPELINE_VERSION,
      policy_version: PIGMENTATION_POLICY_VERSION,
      validated_at_iso: new Date().toISOString(),
    },
  }
}

export const usePigmentationStore = defineStore('pigmentation', {
  state: () => ({
    model: 'gpt-5.5-2026-04-23',
    isConnected: false,
    conversationId: '',
    id: null,
    clinic_id: null,
    therapist_id: null,
    user_id: null,
    currentStage: 0,

    attachedImages: [],
    reassessImages: [],

    fixedHistory: {
      duration: '',
      stability_last_4_6_weeks: '',
      recurrence_after_improvement: '',
      sunscreen_use: '',
      sunscreen_reapplication: '',
      outdoor_heat_exposure: '',
      trigger_history: [],
      current_product_use: [],
      current_sensitivity: '',
      previous_treatments: [],
      previous_treatment_response: '',
      active_new_acne_frequency: '',
      procedure_safety: [],
      red_flag_lesion_change: '',
    },
    dynamicQuestions: [],
    dynamicAnswers: {},

    safety: {
      pregnancy: false,
      clot: false,
      ochronosis: false,
    },
    redFlags: [],

    formData: {
      fitz: '',
      comp: '',
      mel: '',
      ery: '',
      woods: '',
      depth: '',
      initials: '',
      full_name: '',
      mrn: '',
      age: '',
      sex: '',
      dist: '',
      dur: '',
      onset: '',
      prog: '',
      triggers: [],
      hqHistory: false,
      priorTx: '',
      meds: '',
      notes: '',
    },

    morphologyCensus: null,
    aiAnalysis: null,
    immutableImageMetrics: null,
    phenotypePipeline: {
      version: PIPELINE_VERSION,
      status: 'idle',
      attempts: 0,
      corrected_from_discrepancy: false,
      requires_history_refresh: false,
      last_error: null,
    },

    diagnosis: null,
    lastPlan: null,
    reviewState: {
      decision: null,
      notes: '',
      reviewer: 'Dr. A. Mehra',
      finalized: false,
      ts: null,
    },

    goals: [],
    reassessment: null,
    reassessQuestions: [],
    reassessAnswers: {},
    reassessmentMorphologyCensus: null,
    reassessmentAiAnalysis: null,
    reassessmentImmutableImageMetrics: null,
    pre_session_validation: null,

    loadingMessage: '',
    isLoading: false,
  }),

  getters: {
    stageLabel: (state) => {
      const names = ['Capture', 'Assess', 'Diagnosis', 'Plan', 'Reassess']
      const pad = (value) => (value < 10 ? '0' : '') + value
      return `${pad(state.currentStage + 1)} / 05 — ${names[state.currentStage] || ''}`
    },
    progressPercent: (state) => ((state.currentStage + 1) / 5) * 100,
    validatedPhenotype: (state) => state.aiAnalysis?.data || null,
    validatedDiagnosis: (state) => state.diagnosis?.data || null,
    treatmentPlanningEligible: (state) =>
      state.diagnosis?.data?.treatment_planning_eligible === true,
  },

  actions: {
    disconnect() {
      this.isConnected = false
      this.currentStage = 0
      this.resetState()
    },

    async getPatientData(uid) {
      Loading.show({ message: 'Getting patient data...' })
      try {
        const response = await api.get(`/users/${uid}`)
        LocalStorage.set('user', JSON.stringify(response.data.results))
        this.setPatientData(response.data.results)
      } catch (error) {
        console.error(error)
        throw error
      } finally {
        Loading.hide()
      }
    },

    async getSingleAssessment(assessmentId) {
      Loading.show({ message: 'Loading assessment from database...' })
      try {
        const response = await api.get(`/assessments/${assessmentId}`)
        const data = response.data.results
        this.id = data.id
        this.conversationId = data.conversation_id || ''
        this.clinic_id = data.clinic_id || null
        this.therapist_id = data.therapist_id || null
        this.user_id = data.user_id || null

        if (data.user_id) await this.getPatientData(data.user_id)

        const pi = data.pigmentation_inputs || {}
        if (pi.formData) this.formData = { ...this.formData, ...pi.formData }
        if (pi.fixedHistory) this.fixedHistory = { ...this.fixedHistory, ...pi.fixedHistory }
        if (pi.dynamicQuestions) this.dynamicQuestions = pi.dynamicQuestions
        if (pi.dynamicAnswers) this.dynamicAnswers = pi.dynamicAnswers
        if (pi.safety) this.safety = { ...this.safety, ...pi.safety }
        if (pi.redFlags) this.redFlags = pi.redFlags
        if (pi.goals) this.goals = pi.goals
        if (pi.reviewState) {
          this.reviewState = {
            ...this.reviewState,
            ...pi.reviewState,
            ts: pi.reviewState.ts ? new Date(pi.reviewState.ts) : null,
          }
        }

        this.morphologyCensus = pi.morphologyCensus || null
        this.aiAnalysis = pi.aiAnalysis || null
        this.immutableImageMetrics = pi.immutableImageMetrics || null
        this.phenotypePipeline = { ...this.phenotypePipeline, ...(pi.phenotypePipeline || {}) }
        this.reassessmentMorphologyCensus = pi.reassessmentMorphologyCensus || null
        this.reassessmentAiAnalysis = pi.reassessmentAiAnalysis || null
        this.reassessmentImmutableImageMetrics = pi.reassessmentImmutableImageMetrics || null
        this.reassessQuestions = pi.reassessQuestions || []
        this.reassessAnswers = pi.reassessAnswers || {}
        this.pre_session_validation = pi.pre_session_validation || null

        if (
          this.aiAnalysis?.data?.analysis_record_type === 'validated_pigmentation_image_analysis'
        ) {
          this.immutableImageMetrics = extractImmutablePigmentationMetrics(this.aiAnalysis.data)
        }
        if (
          this.reassessmentAiAnalysis?.data?.analysis_record_type ===
          'validated_pigmentation_image_analysis'
        ) {
          this.reassessmentImmutableImageMetrics = extractImmutablePigmentationMetrics(
            this.reassessmentAiAnalysis.data,
          )
        }

        const savedDiagnosis = pi.diagnosis || data.diagnosis || null
        if (savedDiagnosis) {
          const mappedDiagnosis =
            savedDiagnosis.diagnosis_record_type === 'validated_pigmentation_diagnosis' &&
            !savedDiagnosis.differential
              ? mapDiagnosisForLegacyUi(savedDiagnosis, this.aiAnalysis?.data, this.formData)
              : savedDiagnosis
          this.diagnosis = {
            data: mappedDiagnosis,
            confirmedDx: pi.confirmedDx || mappedDiagnosis.differential?.primary?.dx || '',
          }
        }

        this.lastPlan = normalisePlanForUi(pi.lastPlan || data.recommended_full_plan || null)

        if (!this.lastPlan && Array.isArray(data.treatment_sessions?.treatments)) {
          const sessions = data.treatment_sessions.treatments.map((treatment) => ({
            id: treatment.id || treatment.session_number,
            status: treatment.status || 'pending',
            session_number: treatment.session_number,
            timing: `week_${treatment.week || treatment.session_number}`,
            session_goal: treatment.concerns_addressed?.[0] || treatment.title || '',
            selected_modality_ids: String(treatment.title || '')
              .split(' + ')
              .map((value) => value.trim())
              .filter(Boolean),
            treatment_operations: [],
            session_execution_sequence: asArray(treatment.steps).map((step) => ({
              step_number: step.step_number,
              step_type: 'other',
              operation_id: null,
              protocol_id: null,
              instruction: step.how_to_do,
              target_location_text: null,
              completion_required: true,
            })),
          }))
          this.lastPlan = normalisePlanForUi({
            plan_name: 'Legacy Treatment Plan',
            plan_status: data.status === 'completed' ? 'doctor_approved' : 'doctor_modified',
            duration: data.treatment_sessions.total_time || '',
            sessions,
          })
        }

        if (data.images?.length) {
          this.attachedImages = data.images.map((image) => ({
            id: image.id,
            name: image.name,
            dataUrl: image.url,
            url: image.url,
            openai_file_id: image.custom_properties?.openai_file_id || '',
            mode: image.custom_properties?.mode || 'white',
          }))
        }
        if (data.post_images?.length) {
          this.reassessImages = data.post_images.map((image) => ({
            id: image.id,
            name: image.name,
            dataUrl: image.url,
            url: image.url,
            openai_file_id: image.custom_properties?.openai_file_id || '',
            mode: image.custom_properties?.mode || 'white',
          }))
        }

        this.reassessment =
          data.post_diagnosis?.reassessment || pi.reassessment || this.reassessment
        if ((!this.goals || this.goals.length === 0) && this.lastPlan) {
          this.goals = deriveGoalsFromPlan(this.lastPlan)
        }

        this.currentStage = this.reviewState.finalized
          ? 4
          : this.lastPlan
            ? 3
            : this.diagnosis
              ? 2
              : this.aiAnalysis
                ? 1
                : 0
      } catch (error) {
        console.error('Error loading assessment from database:', error)
        throw error
      } finally {
        Loading.hide()
      }
    },

    async updateAssessment() {
      if (!this.id) return

      const pigmentationInputs = {
        pipelineVersion: PIPELINE_VERSION,
        formData: this.formData,
        fixedHistory: this.fixedHistory,
        dynamicQuestions: this.dynamicQuestions,
        dynamicAnswers: this.dynamicAnswers,
        safety: this.safety,
        redFlags: this.redFlags,
        morphologyCensus: this.morphologyCensus,
        aiAnalysis: this.aiAnalysis,
        immutableImageMetrics: this.immutableImageMetrics,
        phenotypePipeline: this.phenotypePipeline,
        diagnosis: this.diagnosis?.data || null,
        confirmedDx: this.diagnosis?.confirmedDx || '',
        lastPlan: this.lastPlan,
        goals: this.goals,
        reviewState: this.reviewState,
        reassessment: this.reassessment,
        reassessQuestions: this.reassessQuestions,
        reassessAnswers: this.reassessAnswers,
        reassessmentMorphologyCensus: this.reassessmentMorphologyCensus,
        reassessmentAiAnalysis: this.reassessmentAiAnalysis,
        reassessmentImmutableImageMetrics: this.reassessmentImmutableImageMetrics,
        pre_session_validation: this.pre_session_validation,
      }

      const treatmentPlans = buildTreatmentPlansPersistence(this.lastPlan)
      const payload = {
        _method: 'PUT',
        assessment_type: 'pigmentation',
        user_id: this.formData.mrn || this.user_id || null,
        ...(this.clinic_id && { clinic_id: this.clinic_id }),
        ...(this.therapist_id && { therapist_id: this.therapist_id }),
        age: this.formData.age || null,
        is_pregnant: this.safety.pregnancy ? 1 : 0,
        breastfeeding: this.safety.pregnancy ? 'yes' : 'no',
        pigmentation_inputs: pigmentationInputs,
        diagnosis: this.diagnosis?.data || null,
        post_diagnosis: this.reassessment ? { reassessment: this.reassessment } : null,
        status: this.reviewState.finalized ? 'completed' : 'in_progress',
        selected_plan_type: 'multiple',
        conversation_id: this.conversationId || null,
        ...(treatmentPlans && { treatment_plans: treatmentPlans }),
      }

      Loading.show({ message: 'Saving assessment details to database...' })
      try {
        const response = await api.post(`/assessments/${this.id}`, payload)
        const updated = response.data.results
        if (updated?.recommended_full_plan) {
          this.lastPlan = normalisePlanForUi(updated.recommended_full_plan)
        }
      } catch (error) {
        console.error('Error updating assessment in database:', error)
        throw error
      } finally {
        Loading.hide()
      }
    },

    setPatientData(data) {
      this.formData.initials = [data.first_name, data.last_name].filter(Boolean).join(' ')
      this.formData.full_name = [data.first_name, data.last_name].filter(Boolean).join(' ')
      this.formData.mrn = String(data.id || '')
      if (data.date_of_birth)
        this.formData.age = useCommonStore().getAgeFromDate(data.date_of_birth)
      if (data.gender) {
        const value = data.gender.toLowerCase()
        this.formData.sex = value === 'female' ? 'Female' : value === 'male' ? 'Male' : 'Other'
      }
    },

    resetState() {
      this.attachedImages = []
      this.reassessImages = []
      this.dynamicQuestions = []
      this.dynamicAnswers = {}
      this.fixedHistory = {
        duration: '',
        stability_last_4_6_weeks: '',
        recurrence_after_improvement: '',
        sunscreen_use: '',
        sunscreen_reapplication: '',
        outdoor_heat_exposure: '',
        trigger_history: [],
        current_product_use: [],
        current_sensitivity: '',
        previous_treatments: [],
        previous_treatment_response: '',
        active_new_acne_frequency: '',
        procedure_safety: [],
        red_flag_lesion_change: '',
      }
      this.safety = { pregnancy: false, clot: false, ochronosis: false }
      this.redFlags = []
      this.formData = {
        fitz: '',
        comp: '',
        mel: '',
        ery: '',
        woods: '',
        depth: '',
        initials: '',
        full_name: '',
        mrn: '',
        age: '',
        sex: '',
        dist: '',
        dur: '',
        onset: '',
        prog: '',
        triggers: [],
        hqHistory: false,
        priorTx: '',
        meds: '',
        notes: '',
      }
      this.morphologyCensus = null
      this.aiAnalysis = null
      this.immutableImageMetrics = null
      this.phenotypePipeline = {
        version: PIPELINE_VERSION,
        status: 'idle',
        attempts: 0,
        corrected_from_discrepancy: false,
        requires_history_refresh: false,
        last_error: null,
      }
      this.diagnosis = null
      this.lastPlan = null
      this.reviewState = {
        decision: null,
        notes: '',
        reviewer: 'Dr. A. Mehra',
        finalized: false,
        ts: null,
      }
      this.goals = []
      this.reassessment = null
      this.reassessQuestions = []
      this.reassessAnswers = {}
      this.reassessmentMorphologyCensus = null
      this.reassessmentAiAnalysis = null
      this.reassessmentImmutableImageMetrics = null
      this.pre_session_validation = null
      this.conversationId = ''
      this.id = null
      this.clinic_id = null
      this.therapist_id = null
      this.user_id = null
      this.currentStage = 0
    },

    async uploadStoreImages(images, assessmentId, type = 'pigmentation-pre') {
      if (!Array.isArray(images)) return
      for (const image of images) {
        if (!image.file || image.openai_file_id) continue
        const formData = new FormData()
        formData.append('image', image.file)
        formData.append('assessment_type', type)
        if (image.mode) formData.append('mode', image.mode)

        const response = await api.post(`assessments/${assessmentId}/images`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        const fileId = response.data?.results?.file_id
        if (!fileId)
          throw new Error(`Image upload did not return a file_id for ${image.name || image.mode}.`)
        image.openai_file_id = fileId
      }
    },

    async callOpenAI({
      system,
      content,
      max_tokens = null,
      max_output_tokens = null,
      temperature = null,
      reasoning_effort = null,
      verbosity = null,
      timeout_ms = null,
      request_metadata = null,
    }) {
      const { getOrCreateConversation, runResponse } = useOpenAI()
      const assessmentStore = useAssessmentStore()
      const ivAssessmentStore = useIVAssessmentStore()
      const assessmentId =
        this.id || assessmentStore.assessmentData?.id || ivAssessmentStore.formData?.id || '1'
      const patientId =
        this.formData.mrn ||
        assessmentStore.assessmentData?.user_id ||
        ivAssessmentStore.formData?.user_id ||
        '1'
      const patientName =
        this.formData.initials ||
        assessmentStore.assessmentData?.name ||
        ivAssessmentStore.formData?.name ||
        'Pigmentation Patient'

      const conversationId = await getOrCreateConversation(
        patientId,
        this.conversationId,
        patientName,
        assessmentId,
      )
      this.conversationId = conversationId

      await this.uploadStoreImages(this.attachedImages, assessmentId, 'pigmentation-pre')
      await this.uploadStoreImages(this.reassessImages, assessmentId, 'pigmentation-post')

      const formattedContent = []
      const sourceItems = typeof content === 'string' ? [{ type: 'text', text: content }] : content
      for (const item of asArray(sourceItems)) {
        if (item.type === 'text' || item.type === 'input_text') {
          formattedContent.push({ type: 'input_text', text: item.text })
          continue
        }
        if (item.type === 'image_id' || item.type === 'input_image') {
          if (!item.file_id) throw new Error('An input image is missing file_id.')
          formattedContent.push({
            type: 'input_image',
            file_id: item.file_id,
            detail: item.detail || IMAGE_DETAIL,
          })
          continue
        }
        if (item.type === 'image') {
          const base64Data = item.source?.data
          const image =
            this.attachedImages.find((candidate) => candidate.base64 === base64Data) ||
            this.reassessImages.find((candidate) => candidate.base64 === base64Data)
          if (!image?.openai_file_id) {
            throw new Error(
              `Image ${image?.name || 'capture'} has no OpenAI file ID; analysis cannot continue safely.`,
            )
          }
          formattedContent.push({
            type: 'input_image',
            file_id: image.openai_file_id,
            detail: item.detail || IMAGE_DETAIL,
          })
          continue
        }
        throw new Error(`Unsupported OpenAI content item type: ${item.type}`)
      }

      const input = [
        { role: 'system', content: system },
        { role: 'user', content: formattedContent },
      ]
      const options = {
        max_output_tokens: max_output_tokens ?? max_tokens ?? undefined,
        temperature: temperature ?? undefined,
        reasoning_effort: reasoning_effort ?? undefined,
        verbosity: verbosity ?? undefined,
        timeout_ms: timeout_ms ?? undefined,
        metadata: {
          pipeline_version: PIPELINE_VERSION,
          ...(request_metadata || {}),
        },
      }

      const result = await runResponse(conversationId, input, this.model, options)
      if (result?.error) {
        const error = new Error(result.error.message || 'Error generating AI response')
        error.code = result.error.code || null
        error.type = result.error.type || null
        error.incomplete_reason = result.error.incomplete_reason || null
        error.response_id = result.error.response_id || null
        error.requested_max_output_tokens = result.error.requested_max_output_tokens || null
        error.usage = result.error.usage || null
        throw error
      }
      return result
    },

    parseJSON(payload) {
      if (payload && typeof payload === 'object') return deepClone(payload)
      let text = String(payload || '').trim()
      text = text
        .replace(/^```(?:json)?/i, '')
        .replace(/```$/, '')
        .trim()
      const start = text.indexOf('{')
      const end = text.lastIndexOf('}')
      if (start >= 0 && end > start) text = text.slice(start, end + 1)
      return JSON.parse(text)
    },

    getOrderedCaptureSet(images, label = 'Pigmentation analysis') {
      const byMode = new Map()
      asArray(images).forEach((image) => {
        if (!REQUIRED_IMAGE_MODES.includes(image.mode)) {
          throw new Error(`${label}: unknown image mode '${image.mode || 'missing'}'.`)
        }
        if (byMode.has(image.mode)) {
          throw new Error(`${label}: duplicate image mode '${image.mode}'.`)
        }
        byMode.set(image.mode, image)
      })
      const missing = REQUIRED_IMAGE_MODES.filter((mode) => !byMode.has(mode))
      if (images.length !== REQUIRED_IMAGE_MODES.length || missing.length) {
        throw new Error(
          `${label} requires exactly one image for each mode. Missing: ${missing.join(', ') || 'none'}.`,
        )
      }
      return REQUIRED_IMAGE_MODES.map((mode) => byMode.get(mode))
    },

    buildLabeledImageContent(images, payload) {
      const content = [{ type: 'text', text: JSON.stringify(payload, null, 2) }]
      images.forEach((image, index) => {
        content.push({
          type: 'text',
          text: `IMAGE ${index + 1} — MODE: ${image.mode}. Patient anatomical right appears on image display left in a frontal capture unless the capture metadata states otherwise.`,
        })
        if (image.openai_file_id) {
          content.push({
            type: 'image_id',
            file_id: image.openai_file_id,
            detail: IMAGE_DETAIL,
          })
        } else {
          content.push({
            type: 'image',
            source: { type: 'base64', media_type: image.mediaType, data: image.base64 },
            detail: IMAGE_DETAIL,
          })
        }
      })
      return content
    },

    buildImageContext(images = this.attachedImages) {
      return JSON.stringify(
        {
          session_id: String(this.id || 'AIJ-PIG-000001'),
          mode_manifest: images.map((image, index) => ({ index: index + 1, mode: image.mode })),
          instruction:
            'Perform the dedicated V2.3 morphology census first. Do not use history or calculate burden scores.',
        },
        null,
        2,
      )
    },

    async runPhenotypePipeline(
      images,
      { kind = 'baseline', correctionContext = null, attempt = 0 } = {},
    ) {
      assertPigmentationPolicyCompatibility(PIGMENTATION_POLICY_VERSION)
      const orderedImages = this.getOrderedCaptureSet(
        images,
        kind === 'baseline' ? 'Baseline pigmentation analysis' : 'Follow-up pigmentation analysis',
      )
      const sessionId = String(
        this.id ||
          this.conversationId ||
          (kind === 'baseline' ? 'AIJ-PIG-000001' : 'AIJ-PIG-FU-000001'),
      )
      const metadata = {
        modelVersion: this.model,
        promptVersion: PIGMENTATION_PROMPT_VERSION,
        configVersion: PIGMENTATION_CONFIG.version,
        policyVersion: PIGMENTATION_POLICY_VERSION,
        preprocessingVersion: 'pigmentation_image_preprocessing_v2_3',
      }

      try {
        const censusPayload = {
          session_id: sessionId,
          policy_version: PIGMENTATION_POLICY_VERSION,
          prompt_version: PIGMENTATION_PROMPT_VERSION,
          mode_manifest: orderedImages.map((image, index) => ({
            image_number: index + 1,
            mode: image.mode,
          })),
          morphology_config: buildPigmentationMorphologyConfig(),
          correction_context: correctionContext,
        }
        const rawCensusResponse = await this.callOpenAI({
          system: MORPHOLOGY_CENSUS_PROMPT,
          content: this.buildLabeledImageContent(orderedImages, censusPayload),
          ...OPENAI_STAGE_OPTIONS.morphology_census,
          request_metadata: { stage: `${kind}_morphology_census`, attempt },
        })
        const rawCensus = this.parseJSON(rawCensusResponse)
        const validatedCensus = validatePigmentationMorphologyCensus(rawCensus, metadata)

        const measurementPayload = {
          session_id: sessionId,
          policy_version: PIGMENTATION_POLICY_VERSION,
          prompt_version: PIGMENTATION_PROMPT_VERSION,
          mode_manifest: orderedImages.map((image, index) => ({
            image_number: index + 1,
            mode: image.mode,
          })),
          locked_morphology_census: validatedCensus,
          measurement_config: buildPigmentationMeasurementConfig(),
          correction_context: correctionContext,
        }
        const rawMeasurementResponse = await this.callOpenAI({
          system: PHENOTYPE_MEASUREMENT_PROMPT,
          content: this.buildLabeledImageContent(orderedImages, measurementPayload),
          ...OPENAI_STAGE_OPTIONS.phenotype_measurement,
          request_metadata: { stage: `${kind}_phenotype_measurement`, attempt },
        })
        const rawMeasurement = this.parseJSON(rawMeasurementResponse)
        const validatedPhenotype = validateAndScorePigmentationImageAnalysis(
          rawMeasurement,
          metadata,
          { lockedMorphologyCensus: validatedCensus },
        )

        return {
          census: validatedCensus,
          phenotype: validatedPhenotype,
          metrics: extractImmutablePigmentationMetrics(validatedPhenotype),
          attempts: attempt + 1,
          corrected: Boolean(correctionContext),
        }
      } catch (error) {
        const canRetry =
          attempt < 1 &&
          (error instanceof PigmentationPhenotypeDiscrepancyError ||
            error instanceof PigmentationImageValidationError)
        if (canRetry) {
          return this.runPhenotypePipeline(images, {
            kind,
            attempt: attempt + 1,
            correctionContext: {
              source: error.name,
              issues: validationIssues(error),
              previous_context: correctionContext,
              instruction:
                'Repeat the complete region-by-region census. Resolve the listed omission, merged morphology, elevation or location problem without weakening any other group.',
            },
          })
        }
        throw error
      }
    },

    applyPhenotypeToForm(phenotype) {
      const global = phenotype?.global_background_indices || {}
      const fitz = String(global.estimated_fitzpatrick?.type || '').toUpperCase()
      if (fitz.includes('III_TO_IV')) this.formData.fitz = 'IV'
      else if (fitz.includes('IV_TO_V')) this.formData.fitz = 'V'
      else if (['I', 'II', 'III', 'IV', 'V', 'VI'].includes(fitz)) this.formData.fitz = fitz
      else this.formData.fitz = ''

      this.formData.mel = global.melanin_load_index?.score_100 || ''
      this.formData.ery = global.erythema_load_index?.score_100 || ''

      const composition = String(global.composition?.type || '').toLowerCase()
      this.formData.comp = composition.includes('melanin')
        ? 'melanin'
        : composition.includes('vascular')
          ? 'vascular'
          : composition.includes('mixed')
            ? 'mixed'
            : 'uncertain'

      const depth = String(global.depth_call?.type || '').toLowerCase()
      this.formData.depth = depth.includes('mixed')
        ? 'mixed'
        : depth.includes('epidermal')
          ? 'epidermal'
          : depth.includes('dermal')
            ? 'dermal'
            : 'uncertain'
    },

    async analyseCaptures() {
      if (!this.attachedImages.length) return
      this.isLoading = true
      this.loadingMessage = 'Completing morphology census and phenotype measurements…'
      this.phenotypePipeline = {
        ...this.phenotypePipeline,
        status: 'running',
        last_error: null,
      }

      try {
        const result = await this.runPhenotypePipeline(this.attachedImages, { kind: 'baseline' })
        this.morphologyCensus = { data: result.census, confirmed: false }
        this.aiAnalysis = { data: result.phenotype, confirmed: false }
        this.immutableImageMetrics = result.metrics
        this.phenotypePipeline = {
          version: PIPELINE_VERSION,
          status: 'validated',
          attempts: result.attempts,
          corrected_from_discrepancy: result.corrected,
          requires_history_refresh: false,
          last_error: null,
        }
        this.applyPhenotypeToForm(result.phenotype)

        this.dynamicQuestions = []
        this.dynamicAnswers = {}
        this.diagnosis = null
        this.lastPlan = null
        this.goals = []
        this.reviewState = {
          decision: null,
          notes: '',
          reviewer: 'Dr. A. Mehra',
          finalized: false,
          ts: null,
        }
        await this.updateAssessment()
      } catch (error) {
        this.phenotypePipeline = {
          ...this.phenotypePipeline,
          status: 'failed',
          last_error: validationIssues(error).join(' | '),
        }
        console.error(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    confirmReadings() {
      if (this.morphologyCensus) this.morphologyCensus.confirmed = true
      if (this.aiAnalysis) this.aiAnalysis.confirmed = true
    },

    async generateDynamicQuestions({ force = false } = {}) {
      if (!force && this.dynamicQuestions.length > 0) return
      if (!this.aiAnalysis?.data) throw new Error('Validated phenotype analysis is required first.')

      this.isLoading = true
      this.loadingMessage = 'Generating group-linked diagnostic questions…'
      try {
        const rawResponse = await this.callOpenAI({
          system: DYNAMIC_QUESTIONS_PROMPT,
          content: JSON.stringify(
            {
              session_id: String(this.id || 'AIJ-PIG-000001'),
              validated_phenotype: this.aiAnalysis.data,
              fixed_history: this.fixedHistory,
              clinical_policy: PIGMENTATION_CLINICAL_POLICY_V2,
            },
            null,
            2,
          ),
          ...OPENAI_STAGE_OPTIONS.dynamic_history,
          request_metadata: { stage: 'dynamic_history' },
        })
        const parsed = this.parseJSON(rawResponse)
        const questions = validateDynamicQuestionSet(
          parsed.questions || parsed.dynamic_questions || [],
          this.aiAnalysis.data,
        )
        const previousAnswers = this.dynamicAnswers || {}
        this.dynamicQuestions = questions
        this.dynamicAnswers = Object.fromEntries(
          questions.map((question) => [
            question.question_id,
            previousAnswers[question.question_id] ??
              (question.answer_type === 'multi_choice' ? [] : ''),
          ]),
        )
        await this.updateAssessment()
      } catch (error) {
        console.error(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    buildBaseBlock() {
      return JSON.stringify(
        {
          patient: {
            initials: this.formData.initials,
            age: this.formData.age,
            sex: this.formData.sex,
          },
          fixed_history: this.fixedHistory,
          dynamic_history: this.buildDynamicHistoryPayload(),
          safety: this.safety,
          red_flags: this.redFlags,
        },
        null,
        2,
      )
    },

    buildDynamicHistoryPayload() {
      return this.dynamicQuestions.map((question) => ({
        question_id: question.question_id,
        linked_group_ids: question.linked_group_ids,
        clinical_location_text: question.clinical_location_text,
        question: question.question,
        answer: this.dynamicAnswers[question.question_id] ?? null,
      }))
    },

    assertHistoryReadyForDiagnosis() {
      const requiredFields = [
        'duration',
        'stability_last_4_6_weeks',
        'sunscreen_use',
        'active_new_acne_frequency',
        'red_flag_lesion_change',
      ]
      const missing = requiredFields.filter((field) => !nonEmpty(this.fixedHistory[field]))
      if (
        !Array.isArray(this.fixedHistory.procedure_safety) ||
        this.fixedHistory.procedure_safety.length === 0
      ) {
        missing.push('procedure_safety')
      }
      if (missing.length) {
        throw new Error(
          `Complete the fixed diagnostic history before diagnosis. Missing: ${missing.join(', ')}.`,
        )
      }

      const unanswered = this.dynamicQuestions
        .filter((question) => {
          const answer = this.dynamicAnswers[question.question_id]
          return Array.isArray(answer) ? answer.length === 0 : !nonEmpty(String(answer ?? ''))
        })
        .map((question) => question.question_id)
      if (unanswered.length) {
        throw new Error(
          `Answer all generated diagnostic questions before diagnosis: ${unanswered.join(', ')}.`,
        )
      }
      return true
    },

    buildDiagnosisInput(correctionContext = null) {
      return JSON.stringify(
        {
          session_id: String(this.id || 'AIJ-PIG-000001'),
          validated_phenotype: this.aiAnalysis?.data || {},
          immutable_image_metrics: this.immutableImageMetrics || {},
          fixed_history: this.fixedHistory,
          dynamic_history: this.buildDynamicHistoryPayload(),
          clinic_policy: PIGMENTATION_CLINICAL_POLICY_V2,
          visual_audit_config: buildPigmentationMorphologyConfig(),
          correction_context: correctionContext,
        },
        null,
        2,
      )
    },

    async generateDx({ allowPhenotypeRepair = true } = {}) {
      if (!this.aiAnalysis?.data) throw new Error('Validated phenotype analysis is required first.')
      this.assertHistoryReadyForDiagnosis()
      this.isLoading = true
      this.loadingMessage = 'Resolving every phenotype group into diagnosis…'

      try {
        const orderedImages = this.getOrderedCaptureSet(
          this.attachedImages,
          'Diagnosis visual audit',
        )
        let correctionContext = null
        let validatedDiagnosis = null

        for (let attempt = 0; attempt < 2; attempt += 1) {
          const content = this.buildLabeledImageContent(orderedImages, {
            diagnosis_request: JSON.parse(this.buildDiagnosisInput(correctionContext)),
          })
          const rawResponse = await this.callOpenAI({
            system: DIAGNOSIS_PROMPT,
            content,
            ...OPENAI_STAGE_OPTIONS.diagnosis,
            request_metadata: { stage: 'diagnosis', attempt },
          })
          const rawDiagnosis = this.parseJSON(rawResponse)

          try {
            validatedDiagnosis = validatePigmentationDiagnosis(rawDiagnosis, this.aiAnalysis.data, {
              modelVersion: this.model,
              promptVersion: PIGMENTATION_PROMPT_VERSION,
            })
            break
          } catch (error) {
            if (!(error instanceof PigmentationDiagnosisValidationError) || attempt === 1)
              throw error
            correctionContext = {
              source: 'deterministic_diagnosis_validation',
              issues: validationIssues(error),
              instruction:
                'Correct the diagnosis JSON without changing any image-derived metric, morphology group or clinical_location_text.',
            }
          }
        }

        if (!validatedDiagnosis) throw new Error('Diagnosis could not be validated.')

        if (!validatedDiagnosis.treatment_planning_eligible) {
          this.diagnosis = {
            data: mapDiagnosisForLegacyUi(validatedDiagnosis, this.aiAnalysis.data, this.formData),
            confirmedDx: '',
          }

          if (
            allowPhenotypeRepair &&
            validatedDiagnosis.phenotype_discrepancy?.detected === true &&
            validatedDiagnosis.phenotype_discrepancy?.severity === 'material'
          ) {
            this.loadingMessage = 'Correcting the phenotype record identified by diagnosis audit…'
            const repaired = await this.runPhenotypePipeline(this.attachedImages, {
              kind: 'baseline',
              correctionContext: validatedDiagnosis.phenotype_discrepancy,
            })
            this.morphologyCensus = { data: repaired.census, confirmed: false }
            this.aiAnalysis = { data: repaired.phenotype, confirmed: false }
            this.immutableImageMetrics = repaired.metrics
            this.applyPhenotypeToForm(repaired.phenotype)
            this.dynamicQuestions = []
            this.dynamicAnswers = {}
            this.diagnosis = null
            this.lastPlan = null
            this.goals = []
            this.phenotypePipeline = {
              version: PIPELINE_VERSION,
              status: 'validated_after_diagnosis_audit_repair',
              attempts: repaired.attempts,
              corrected_from_discrepancy: true,
              requires_history_refresh: true,
              last_error: null,
            }
            await this.updateAssessment()
            throw new Error(
              'The diagnosis audit found a material missed or merged phenotype. The image phenotype has been rebuilt. Regenerate and answer the group-linked history questions before running diagnosis again.',
            )
          }

          await this.updateAssessment()
          throw new Error('Diagnosis is blocked pending phenotype reanalysis or doctor review.')
        }

        this.diagnosis = {
          data: mapDiagnosisForLegacyUi(validatedDiagnosis, this.aiAnalysis.data, this.formData),
          confirmedDx: '',
        }
        this.phenotypePipeline.requires_history_refresh = false
        await this.updateAssessment()
      } catch (error) {
        console.error(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    confirmDx(selectedDx) {
      if (!this.diagnosis) this.diagnosis = { data: null, confirmedDx: '' }
      this.diagnosis.confirmedDx = selectedDx
    },

    buildPlanInput(correctionContext = null) {
      const diagnosis = this.diagnosis?.data || {}
      const planningConfig = buildPlanningConfigBundle(diagnosis)
      return JSON.stringify(
        {
          session_id: String(this.conversationId || this.id || 'AIJ-PIG-000001'),
          generation_event: 'initial_assessment',
          validated_diagnosis: diagnosis,
          validated_phenotype: this.aiAnalysis?.data || {},
          fixed_history: this.fixedHistory,
          dynamic_history: this.buildDynamicHistoryPayload(),
          clinic_policy: PIGMENTATION_CLINICAL_POLICY_V2,
          clinic_config: planningConfig,
          doctor_overrides: {
            allowed: true,
            notes: null,
          },
          correction_context: correctionContext,
        },
        null,
        2,
      )
    },

    async generatePlan(force = false) {
      if (this.lastPlan && !force) return
      assertDiagnosisReadyForTreatmentPlanning(this.diagnosis?.data)

      this.isLoading = true
      this.loadingMessage = 'Selecting and validating component-specific treatment…'
      try {
        let correctionContext = null
        let validatedPlan = null

        for (let attempt = 0; attempt < 2; attempt += 1) {
          const rawResponse = await this.callOpenAI({
            system: PLAN_PROMPT,
            content: this.buildPlanInput(correctionContext),
            ...OPENAI_STAGE_OPTIONS.treatment_plan,
            request_metadata: { stage: 'treatment_plan', attempt },
          })
          const parsed = this.parseJSON(rawResponse)
          const plan = parsed.linear_treatment_plan || parsed
          const validation = validatePigmentationPlan(plan, PIGMENTATION_CONFIG, {
            throwOnError: false,
            diagnosis: this.diagnosis.data,
            phenotype: this.aiAnalysis.data,
          })

          if (validation.valid) {
            validatedPlan = validation.normalized_plan
            break
          }
          if (attempt === 1) {
            validatePigmentationPlan(plan, PIGMENTATION_CONFIG, {
              throwOnError: true,
              diagnosis: this.diagnosis.data,
              phenotype: this.aiAnalysis.data,
            })
          }
          correctionContext = {
            source: 'deterministic_plan_validation',
            issues: validation.errors,
            instruction:
              'Regenerate the full plan. Correct every listed issue using only supplied protocols and preserve exact component/group/location targeting.',
          }
        }

        if (!validatedPlan) throw new Error('Treatment plan could not be validated.')
        this.lastPlan = normalisePlanForUi(validatedPlan)
        this.reviewState = {
          decision: null,
          notes: '',
          reviewer: 'Dr. A. Mehra',
          finalized: false,
          ts: null,
        }
        this.goals = deriveGoalsFromPlan(this.lastPlan)
        await this.updateAssessment()
      } catch (error) {
        console.error(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    finalizeSignoff(decision, notes, reviewer) {
      this.reviewState.decision = decision
      this.reviewState.notes = notes
      this.reviewState.reviewer = reviewer || 'Clinician'
      this.reviewState.finalized = true
      this.reviewState.ts = new Date()
      if (this.lastPlan) {
        const normalizedDecision = String(decision || '').toLowerCase()
        this.lastPlan.plan_status = normalizedDecision.includes('approv')
          ? 'doctor_approved'
          : 'doctor_modified'
      }
    },

    async analyseReassessmentCaptures() {
      if (!this.reassessImages.length) throw new Error('Five follow-up captures are required.')
      this.isLoading = true
      this.loadingMessage = 'Measuring the follow-up phenotype using the same scoring profiles…'
      try {
        const result = await this.runPhenotypePipeline(this.reassessImages, { kind: 'followup' })
        this.reassessmentMorphologyCensus = { data: result.census, confirmed: false }
        this.reassessmentAiAnalysis = { data: result.phenotype, confirmed: false }
        this.reassessmentImmutableImageMetrics = result.metrics
        this.reassessQuestions = []
        this.reassessAnswers = {}
        this.reassessment = null
        await this.updateAssessment()
      } catch (error) {
        console.error(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    buildReassessInput() {
      return JSON.stringify(
        {
          baseline_validated_phenotype: this.aiAnalysis?.data || {},
          baseline_validated_diagnosis: this.diagnosis?.data || {},
          baseline_validated_plan: this.lastPlan || {},
          treatments_actually_performed: getPlanSessions(this.lastPlan).map((session) => ({
            session_number: session.session_number,
            timing: session.timing,
            status: session.status,
            performed_at: session.performed_at || session.completed_at || null,
            treatment_operations: session.treatment_operations,
          })),
          followup_validated_phenotype: this.reassessmentAiAnalysis?.data || {},
          reassessment_questions_and_answers: this.reassessQuestions.map((question) => ({
            ...question,
            answer: this.reassessAnswers[question.question_id] ?? null,
          })),
          clinic_policy: PIGMENTATION_CLINICAL_POLICY_V2,
          relevant_config: buildPlanningConfigBundle(this.diagnosis?.data || {}),
        },
        null,
        2,
      )
    },

    async generateReassessment() {
      if (!this.aiAnalysis?.data || !this.diagnosis?.data || !this.lastPlan) {
        throw new Error('Baseline phenotype, diagnosis and treatment plan are required.')
      }
      if (!this.reassessmentAiAnalysis?.data) await this.analyseReassessmentCaptures()

      this.isLoading = true
      this.loadingMessage = 'Comparing the same components and locations over time…'
      try {
        const rawResponse = await this.callOpenAI({
          system: REASSESS_PROMPT,
          content: this.buildReassessInput(),
          ...OPENAI_STAGE_OPTIONS.formal_reassessment,
          request_metadata: { stage: 'formal_reassessment' },
        })
        const parsed = this.parseJSON(rawResponse)
        this.reassessment = validateReassessmentRecord(
          parsed,
          this.aiAnalysis.data,
          this.reassessmentAiAnalysis.data,
        )
        this.lastPlan.formal_reassessment = this.reassessment
        await this.updateAssessment()
      } catch (error) {
        console.error(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async generateReassessQuestions({ force = false } = {}) {
      if (!force && this.reassessQuestions.length > 0) return
      if (!this.reassessmentAiAnalysis?.data) await this.analyseReassessmentCaptures()

      this.isLoading = true
      this.loadingMessage = 'Generating follow-up questions linked to the same components…'
      try {
        const rawResponse = await this.callOpenAI({
          system: REASSESS_QUESTIONS_PROMPT,
          content: JSON.stringify(
            {
              baseline_validated_phenotype: this.aiAnalysis?.data || {},
              baseline_validated_diagnosis: this.diagnosis?.data || {},
              baseline_plan: this.lastPlan || {},
              treatments_actually_performed: getPlanSessions(this.lastPlan).map((session) => ({
                session_number: session.session_number,
                timing: session.timing,
                status: session.status,
                performed_at: session.performed_at || session.completed_at || null,
                treatment_operations: session.treatment_operations,
              })),
              followup_validated_phenotype: this.reassessmentAiAnalysis.data,
              existing_followup_history: this.reassessAnswers,
            },
            null,
            2,
          ),
          ...OPENAI_STAGE_OPTIONS.reassessment_questions,
          request_metadata: { stage: 'reassessment_questions' },
        })
        const parsed = this.parseJSON(rawResponse)
        const questions = validateReassessmentQuestionSet(
          parsed.questions || parsed.dynamic_questions || [],
          this.diagnosis?.data,
          this.aiAnalysis?.data,
        )
        const previous = this.reassessAnswers || {}
        this.reassessQuestions = questions
        this.reassessAnswers = Object.fromEntries(
          questions.map((question) => [
            question.question_id,
            previous[question.question_id] ?? (question.answer_type === 'multi_choice' ? [] : ''),
          ]),
        )
        await this.updateAssessment()
      } catch (error) {
        console.error(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },
  },
})
