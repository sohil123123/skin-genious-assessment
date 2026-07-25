/**
 * Pigmentation Decode V2.4 lean treatment-plan validator.
 *
 * Rejects only clinically material or executable-protocol failures. Minor narrative and
 * formatting differences are returned as warnings so they do not trigger costly reruns.
 */

import {
  getPigmentationProtocolById,
  assertProtocolMatchesModality,
} from 'src/services/pigmentationConfigV2'

const PROCEDURAL_MODALITIES = new Set([
  'chemical_peel',
  'microneedling_with_active',
  'q_switch_laser',
  'focal_laser',
  'electrocautery_or_rf',
])

const INJURY_MODALITIES = new Set([
  'chemical_peel',
  'microneedling_with_active',
  'q_switch_laser',
  'focal_laser',
  'electrocautery_or_rf',
])

export class PigmentationPlanValidationError extends Error {
  constructor(message, errors = [], warnings = []) {
    super(message)
    this.name = 'PigmentationPlanValidationError'
    this.errors = errors
    this.warnings = warnings
  }
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function unique(values) {
  return [...new Set((Array.isArray(values) ? values : []).filter(Boolean))]
}

function normalizeText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function isVagueLocation(value) {
  const text = normalizeText(value)
  return !text || ['face', 'cheek', 'cheeks', 'pigmented area', 'affected area', 'affected region'].includes(text)
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function getSessions(plan) {
  if (Array.isArray(plan.current_sessions)) return plan.current_sessions
  if (Array.isArray(plan.current_treatment_block?.sessions)) {
    return plan.current_treatment_block.sessions
  }
  if (Array.isArray(plan.sessions)) return plan.sessions
  return []
}

function getOperations(session) {
  if (Array.isArray(session.operations)) return session.operations
  if (Array.isArray(session.treatment_operations)) return session.treatment_operations
  return []
}

function getExecutionSequence(session) {
  if (Array.isArray(session.execution_sequence)) return session.execution_sequence
  if (Array.isArray(session.session_execution_sequence)) return session.session_execution_sequence
  return []
}

function groupsOverlap(groupA, groupB) {
  const a = new Set(groupA?.anatomical_regions || [])
  return (groupB?.anatomical_regions || []).some((region) => a.has(region))
}


function inRange(value, range) {
  return Number.isFinite(value) && isObject(range) && value >= range.min && value <= range.max
}

function containsPlaceholder(value) {
  if (typeof value === 'string') {
    return /from_config|as_per_protocol|doctor_to_decide|tbd|placeholder/i.test(value)
  }
  if (Array.isArray(value)) return value.some(containsPlaceholder)
  if (isObject(value)) return Object.values(value).some(containsPlaceholder)
  return false
}

function validateExecutionParameters(operation, protocol, prefix, errors, warnings) {
  if (!protocol || !PROCEDURAL_MODALITIES.has(operation.modality_id)) return
  const params = isObject(operation.parameters) ? operation.parameters : {}

  if (containsPlaceholder(params) || containsPlaceholder(operation.endpoint)) {
    errors.push(`${prefix} contains a non-executable placeholder.`)
  }

  if (['q_switch_laser', 'focal_laser'].includes(operation.modality_id)) {
    const wavelength = Number(params.wavelength_nm)
    if (!protocol.allowed_wavelengths_nm?.includes(wavelength)) {
      errors.push(`${prefix} requires an allowed wavelength_nm.`)
    }

    const energyRange = protocol.energy_mj_range_by_wavelength?.[String(wavelength)] || protocol.energy_mj_range
    if (energyRange && !inRange(Number(params.energy_mj), energyRange)) {
      errors.push(`${prefix} energy_mj must be within the selected protocol range.`)
    }
    if (protocol.fluence_j_cm2_range && !inRange(Number(params.fluence_j_cm2), protocol.fluence_j_cm2_range)) {
      errors.push(`${prefix} fluence_j_cm2 must be within the selected protocol range.`)
    }
    if (protocol.frequency_hz_range && !inRange(Number(params.frequency_hz), protocol.frequency_hz_range)) {
      errors.push(`${prefix} frequency_hz must be within the selected protocol range.`)
    }
    if (protocol.passes_range && !inRange(Number(params.passes), protocol.passes_range)) {
      errors.push(`${prefix} passes must be within the selected protocol range.`)
    }
  }

  if (operation.modality_id === 'chemical_peel') {
    const strengthRange = protocol.preferred_start_strength_percent_for_indian_pigmentation || protocol.strength_percent
    if (isObject(strengthRange) && !inRange(Number(params.strength_percent), strengthRange)) {
      errors.push(`${prefix} strength_percent must be within the configured starting range.`)
    }
    if (protocol.contact_time_minutes && !inRange(Number(params.contact_time_minutes), protocol.contact_time_minutes)) {
      errors.push(`${prefix} contact_time_minutes must be within the configured range.`)
    }
    if (protocol.neutralization_required === true && !params.neutralization_method) {
      errors.push(`${prefix} requires neutralization_method.`)
    }
    if (protocol.neutralization_required === false && params.neutralization_method && params.neutralization_method !== 'not_required') {
      warnings.push(`${prefix} protocol does not require neutralization; verify the returned method.`)
    }
  }

  if (operation.modality_id === 'microneedling_with_active') {
    if (!isObject(params.depth_by_region_mm) || Object.keys(params.depth_by_region_mm).length === 0) {
      errors.push(`${prefix} requires depth_by_region_mm.`)
    } else {
      for (const [region, depth] of Object.entries(params.depth_by_region_mm)) {
        const allowed = protocol.depth_by_region_mm?.[region]
        if (Number.isFinite(allowed) && Number(depth) !== allowed) {
          errors.push(`${prefix} depth for ${region} must equal configured value ${allowed} mm.`)
        }
      }
    }
    if (params.route && !/topical|transdermal/i.test(params.route)) {
      errors.push(`${prefix} microneedling active route must be topical or transdermal.`)
    }
  }

  if (operation.modality_id === 'led' && protocol.duration_minutes) {
    if (!inRange(Number(params.duration_minutes), protocol.duration_minutes)) {
      errors.push(`${prefix} LED duration_minutes must be within the configured range.`)
    }
  }
}

function validateBaseline(plan, expectedMetrics, errors) {
  if (!expectedMetrics) return
  const baseline = plan.baseline_summary || {}
  for (const [key, expected] of Object.entries(expectedMetrics)) {
    if (key === 'image_metrics_copied_without_recalculation') continue
    if (baseline[key] !== expected) {
      errors.push(`baseline_summary.${key} must equal validated diagnosis value ${expected}.`)
    }
  }
}

function validateComponentMap(plan, diagnosis, groupMap, errors, warnings) {
  const components = diagnosis?.diagnostic_components || []
  const mapEntries = Array.isArray(plan.component_treatment_map) ? plan.component_treatment_map : []
  const entryMap = new Map(mapEntries.map((entry) => [entry.diagnostic_component_id, entry]))

  for (const component of components) {
    const id = component.diagnostic_component_id
    const entry = entryMap.get(id)
    if (!entry) {
      errors.push(`component_treatment_map is missing ${id}.`)
      continue
    }

    const linkedGroups = unique(entry.linked_group_ids)
    for (const groupId of component.linked_group_ids || []) {
      if (!linkedGroups.includes(groupId)) {
        errors.push(`${id} treatment map omits linked morphology group ${groupId}.`)
      }
    }

    if (isVagueLocation(entry.clinical_location_text)) {
      errors.push(`${id} treatment map lacks a doctor-usable clinical_location_text.`)
    }

    if (entry.selected_protocol_id) {
      const protocol = getPigmentationProtocolById(entry.selected_protocol_id)
      if (!protocol) errors.push(`${id} selects unknown protocol ${entry.selected_protocol_id}.`)
      else if (entry.selected_modality_id && protocol.modality_id !== entry.selected_modality_id) {
        errors.push(
          `${id} protocol ${entry.selected_protocol_id} belongs to ${protocol.modality_id}, not ${entry.selected_modality_id}.`,
        )
      }
    }

    if (
      component.direct_cosmetic_treatment_status === 'hold_until_doctor_assessment' &&
      entry.treatment_eligibility === 'eligible'
    ) {
      errors.push(`${id} is on doctor-assessment hold but treatment map marks it eligible.`)
    }

    if (
      component.family === 'medically_atypical_focal_lesion' &&
      entry.selected_modality_id &&
      PROCEDURAL_MODALITIES.has(entry.selected_modality_id)
    ) {
      errors.push(`${id} is medically atypical and cannot receive a cosmetic procedure.`)
    }

    if (
      component.family === 'periocular_hyperpigmentation' &&
      component.subtype === 'structural_shadow_dominant' &&
      entry.selected_modality_id &&
      PROCEDURAL_MODALITIES.has(entry.selected_modality_id)
    ) {
      errors.push(`${id} is structural-shadow dominant and cannot be treated as primary pigment.`)
    }

    if (entry.clinical_location_text && component.clinical_location_text) {
      const source = normalizeText(component.clinical_location_text)
      const actual = normalizeText(entry.clinical_location_text)
      if (source !== actual) {
        warnings.push(`${id} treatment map should preserve diagnosis location text exactly.`)
      }
    }

    for (const groupId of linkedGroups) {
      if (!groupMap.has(groupId)) errors.push(`${id} references unknown morphology group ${groupId}.`)
    }
  }

  return entryMap
}

function validateOperation(operation, sessionNumber, componentMap, groupMap, errors, warnings) {
  const prefix = `session ${sessionNumber} operation ${operation?.operation_id || 'unknown'}`
  if (!operation?.operation_id) errors.push(`${prefix} requires operation_id.`)
  if (!operation?.modality_id) errors.push(`${prefix} requires modality_id.`)
  if (!operation?.protocol_id && operation?.modality_id !== 'homecare' && operation?.modality_id !== 'medical_control') {
    errors.push(`${prefix} requires an exact protocol_id.`)
  }

  if (operation?.protocol_id) {
    const protocol = getPigmentationProtocolById(operation.protocol_id)
    if (!protocol) errors.push(`${prefix} uses unknown protocol ${operation.protocol_id}.`)
    else {
      try {
        assertProtocolMatchesModality(operation.protocol_id, operation.modality_id)
      } catch (error) {
        errors.push(error.message)
      }
      validateExecutionParameters(operation, protocol, prefix, errors, warnings)
    }
  }

  const linkedComponents = unique(operation?.linked_component_ids)
  const linkedGroups = unique(operation?.linked_group_ids)
  if (linkedComponents.length === 0) errors.push(`${prefix} has no linked_component_ids.`)
  if (linkedGroups.length === 0 && PROCEDURAL_MODALITIES.has(operation?.modality_id)) {
    errors.push(`${prefix} has no linked_group_ids.`)
  }
  for (const componentId of linkedComponents) {
    if (!componentMap.has(componentId)) errors.push(`${prefix} references unknown component ${componentId}.`)
  }
  for (const groupId of linkedGroups) {
    if (!groupMap.has(groupId)) errors.push(`${prefix} references unknown group ${groupId}.`)
  }

  if (PROCEDURAL_MODALITIES.has(operation?.modality_id) && isVagueLocation(operation?.target_location_text)) {
    errors.push(`${prefix} requires a precise target_location_text.`)
  }

  if (operation?.modality_id === 'electrocautery_or_rf') {
    for (const groupId of linkedGroups) {
      const group = groupMap.get(groupId)
      if (group?.burden_category !== 'raised_pigmented_lesion') {
        errors.push(`${prefix} may target only raised pigmented lesion groups; ${groupId} is ${group?.burden_category}.`)
      }
    }
  }

  if (['q_switch_laser', 'focal_laser', 'chemical_peel', 'microneedling_with_active'].includes(operation?.modality_id)) {
    const targetGroups = linkedGroups.map((id) => groupMap.get(id)).filter(Boolean)
    const overlappingRaised = [...groupMap.values()].filter(
      (candidate) =>
        candidate.burden_category === 'raised_pigmented_lesion' &&
        targetGroups.some((target) => groupsOverlap(target, candidate)),
    )
    if (overlappingRaised.length) {
      const excluded = unique(operation?.exclude_group_ids)
      for (const raised of overlappingRaised) {
        if (!excluded.includes(raised.group_id)) {
          errors.push(`${prefix} must exclude co-located raised group ${raised.group_id}.`)
        }
      }
    }
  }

  if (operation?.modality_id === 'microneedling_with_active') {
    const protocol = getPigmentationProtocolById(operation.protocol_id)
    const activeId = operation?.parameters?.active_id
    if (!activeId) errors.push(`${prefix} microneedling requires parameters.active_id.`)
    else if (protocol?.allowed_active_ids && !protocol.allowed_active_ids.includes(activeId)) {
      errors.push(`${prefix} active ${activeId} is not allowed by ${operation.protocol_id}.`)
    }
  }

  if (operation?.modality_id === 'electrocautery_or_rf' && operation?.parameters) {
    const numericSetting = Object.entries(operation.parameters).find(
      ([key, value]) => /power|energy|watt|level/i.test(key) && Number.isFinite(value),
    )
    if (numericSetting) {
      errors.push(`${prefix} must not invent numeric electrocautery/RF settings.`)
    }
  }

  if (!Array.isArray(operation?.aftercare) || operation.aftercare.length === 0) {
    warnings.push(`${prefix} should include concise aftercare.`)
  }
}

export function validatePigmentationPlan(planObj, config, options = {}) {
  const errors = []
  const warnings = []
  const plan = clone(planObj?.linear_treatment_plan || planObj || {})
  const diagnosis = options.diagnosis || {}
  const phenotype = options.phenotype || {}

  if (!isObject(plan)) {
    return { valid: false, errors: ['Treatment plan was not a JSON object.'], warnings, plan: null }
  }

  validateBaseline(plan, options.baselineMetrics || diagnosis?.immutable_image_metrics, errors)

  const groups = phenotype?.morphology_groups || diagnosis?.morphology_groups || []
  const groupMap = new Map(groups.map((group) => [group.group_id, group]))
  const componentMap = validateComponentMap(plan, diagnosis, groupMap, errors, warnings)

  const sessions = getSessions(plan)
  if (plan.plan_status !== 'blocked' && sessions.length === 0) {
    errors.push('A non-blocked plan must contain at least one current detailed session.')
  }

  for (const session of sessions) {
    const operations = getOperations(session)
    const sequence = getExecutionSequence(session)
    if (operations.length === 0) errors.push(`Session ${session.session_number} has no operations.`)

    const injuryTypes = unique(
      operations
        .filter((operation) => operation.injury_producing || INJURY_MODALITIES.has(operation.modality_id))
        .map((operation) => operation.modality_id),
    )
    if (injuryTypes.length > 2) {
      errors.push(`Session ${session.session_number} exceeds two injury modality types.`)
    }

    for (const operation of operations) {
      validateOperation(
        operation,
        session.session_number,
        componentMap,
        groupMap,
        errors,
        warnings,
      )
    }

    const operationIds = new Set(operations.map((operation) => operation.operation_id))
    for (const step of sequence) {
      if (step.operation_id && !operationIds.has(step.operation_id)) {
        errors.push(
          `Session ${session.session_number} execution step references unknown operation ${step.operation_id}.`,
        )
      }
    }
  }

  // Derive convenience fields rather than trusting model self-checks.
  for (const session of sessions) {
    const operations = getOperations(session)
    session.selected_modality_ids = unique(operations.map((operation) => operation.modality_id))
    session.injury_producing_modality_ids = unique(
      operations
        .filter((operation) => operation.injury_producing || INJURY_MODALITIES.has(operation.modality_id))
        .map((operation) => operation.modality_id),
    )
  }

  if (!plan.current_sessions && sessions.length) plan.current_sessions = sessions

  const valid = errors.length === 0
  if (!valid && options.throwOnError) {
    throw new PigmentationPlanValidationError(
      `Pigmentation treatment plan failed critical validation. ${errors.map((e) => `- ${e}`).join(' ')}`,
      errors,
      warnings,
    )
  }

  return { valid, errors, warnings, plan }
}


/**
 * Validate only the next detailed treatment block produced during reassessment.
 * This keeps reassessment compact while applying the same critical protocol,
 * targeting and safety checks used for the initial plan.
 */
export function validatePigmentationTreatmentBlock(block, config, options = {}) {
  const diagnosis = options.diagnosis || {}
  const phenotype = options.phenotype || {}
  const baselineMetrics = options.baselineMetrics || diagnosis.immutable_image_metrics || {}
  const componentTreatmentMap = Array.isArray(options.componentTreatmentMap)
    ? options.componentTreatmentMap
    : []

  const temporaryPlan = {
    plan_status: 'ai_generated_pending_doctor_review',
    baseline_summary: {
      ...baselineMetrics,
      diagnostic_component_ids: (diagnosis.diagnostic_components || []).map(
        (component) => component.diagnostic_component_id,
      ),
      morphology_group_ids: (phenotype.morphology_groups || []).map(
        (group) => group.group_id,
      ),
    },
    component_treatment_map: componentTreatmentMap,
    current_treatment_block: block,
  }

  return validatePigmentationPlan(temporaryPlan, config, {
    diagnosis,
    phenotype,
    baselineMetrics,
    throwOnError: options.throwOnError,
  })
}
