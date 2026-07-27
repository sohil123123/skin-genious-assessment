/**
 * Pigmentation Decode V2.6.1 treatment-plan validator.
 *
 * Critical guarantees:
 * - selected protocols must come from deterministic component eligibility;
 * - every course-eligible component is allocated across the full course or explicitly held;
 * - only components selected for the current block require a current primary operation;
 * - LED/supportive care cannot silently replace a pigment procedure;
 * - safety holds remain scoped to their own components/groups/regions;
 * - protocol parameters and location targeting remain executable.
 */

import {
  getPigmentationProtocolById,
  assertProtocolMatchesModality,
  isSupportivePigmentationProtocol,
} from 'src/services/pigmentationConfigV2'

const PRIMARY_PROCEDURAL_MODALITIES = new Set([
  'chemical_peel',
  'microneedling_with_active',
  'q_switch_laser',
  'focal_laser',
  'electrocautery_or_rf',
])

const INJURY_MODALITIES = new Set(PRIMARY_PROCEDURAL_MODALITIES)

const NON_PRIMARY_MANAGEMENT_MODALITIES = new Set([
  'homecare',
  'medical_control',
  'observe',
  'other',
  null,
  undefined,
])

const TREATABLE_COURSE_PATTERNS = new Set([
  'background_photomelanosis',
  'few_isolated_flat_lentiginous_lesions',
  'multifocal_or_regional_flat_pigment',
  'settled_pih',
  'melasma_epidermal',
  'melasma_mixed',
  'melasma_dermal',
  'raised_sk_dpn_like',
  'periocular_melanin_component',
  'perioral_melanin_component',
])

const COURSE_ALLOCATION_STATUSES = new Set([
  'selected_for_current_block',
  'planned_for_future_block',
  'held',
  'observe_only',
  'not_applicable',
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

function clone(value) {
  return JSON.parse(JSON.stringify(value))
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
  return (
    !text ||
    ['face', 'cheek', 'cheeks', 'pigmented area', 'affected area', 'affected region'].includes(text)
  )
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
  if (Array.isArray(session.treatment_operations)) return session.treatment_operations
  if (Array.isArray(session.operations)) return session.operations
  return []
}

function getExecutionSequence(session) {
  if (Array.isArray(session.session_execution_sequence)) return session.session_execution_sequence
  if (Array.isArray(session.execution_sequence)) return session.execution_sequence
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
  if (!protocol || !PRIMARY_PROCEDURAL_MODALITIES.has(operation.modality_id)) return
  const params = isObject(operation.parameters) ? operation.parameters : {}

  if (containsPlaceholder(params) || containsPlaceholder(operation.endpoint)) {
    errors.push(`${prefix} contains a non-executable placeholder.`)
  }

  if (['q_switch_laser', 'focal_laser'].includes(operation.modality_id)) {
    const copiedRangeKeys = [
      'allowed_wavelengths_nm',
      'energy_mj_range',
      'fluence_j_cm2_range',
      'frequency_hz_range',
      'passes_range',
    ].filter((key) => params[key] !== undefined)
    if (copiedRangeKeys.length) {
      errors.push(
        `${prefix} copied protocol configuration (${copiedRangeKeys.join(', ')}) instead of selecting executable scalar settings.`,
      )
    }

    const wavelength = Number(params.wavelength_nm)
    if (!protocol.allowed_wavelengths_nm?.includes(wavelength)) {
      errors.push(`${prefix} requires an allowed scalar wavelength_nm.`)
    }
    const energyRange =
      protocol.energy_mj_range_by_wavelength?.[String(wavelength)] || protocol.energy_mj_range
    const energy = Number(params.energy_mj)
    if (energyRange && !inRange(energy, energyRange)) {
      errors.push(`${prefix} energy_mj must be a scalar within the selected protocol range.`)
    }
    if (
      protocol.frequency_hz_range &&
      !inRange(Number(params.frequency_hz), protocol.frequency_hz_range)
    ) {
      errors.push(`${prefix} frequency_hz must be a scalar within the selected protocol range.`)
    }
    if (protocol.passes_range && !inRange(Number(params.passes), protocol.passes_range)) {
      errors.push(`${prefix} passes must be a scalar within the selected protocol range.`)
    }

    const spotArea = Number(protocol.spot_area_cm2 || protocol.spot_area || 1)
    if (Number.isFinite(energy) && energy > 0 && Number.isFinite(spotArea) && spotArea > 0) {
      const derivedFluence = Number((energy / 1000 / spotArea).toFixed(4))
      params.fluence_j_cm2 = derivedFluence
      operation.parameters = params
      if (
        protocol.fluence_j_cm2_range &&
        !inRange(derivedFluence, protocol.fluence_j_cm2_range)
      ) {
        errors.push(
          `${prefix} derived fluence_j_cm2 ${derivedFluence} is outside the selected protocol range.`,
        )
      }
    } else if (protocol.fluence_j_cm2_range) {
      errors.push(`${prefix} cannot derive fluence_j_cm2 without a valid scalar energy_mj.`)
    }
  }

  if (operation.modality_id === 'chemical_peel') {
    const strengthRange =
      protocol.preferred_start_strength_percent_for_indian_pigmentation ||
      protocol.strength_percent
    if (isObject(strengthRange) && !inRange(Number(params.strength_percent), strengthRange)) {
      errors.push(`${prefix} strength_percent must be within the configured starting range.`)
    }
    if (
      protocol.contact_time_minutes &&
      !inRange(Number(params.contact_time_minutes), protocol.contact_time_minutes)
    ) {
      errors.push(`${prefix} contact_time_minutes must be within the configured range.`)
    }
    if (protocol.neutralization_required === true && !params.neutralization_method) {
      errors.push(`${prefix} requires neutralization_method.`)
    }
  }

  if (operation.modality_id === 'microneedling_with_active') {
    if (params.allowed_active_ids || params.depth_by_region_mm_range) {
      errors.push(`${prefix} copied microneedling configuration instead of selecting executable active/depth values.`)
    }
    if (!isObject(params.depth_by_region_mm) || !Object.keys(params.depth_by_region_mm).length) {
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
      errors.push(`${prefix} microneedling route must be topical or transdermal.`)
    }
    const activeId = params.active_id
    if (!activeId) errors.push(`${prefix} microneedling requires parameters.active_id.`)
    else if (protocol.allowed_active_ids && !protocol.allowed_active_ids.includes(activeId)) {
      errors.push(`${prefix} active ${activeId} is not allowed by ${operation.protocol_id}.`)
    }
  }

  if (operation.modality_id === 'electrocautery_or_rf') {
    const numericSetting = Object.entries(params).find(
      ([key, value]) => /power|energy|watt|level/i.test(key) && Number.isFinite(value),
    )
    if (numericSetting) {
      errors.push(`${prefix} must not invent numeric electrocautery/RF settings.`)
    }
  }

  if (operation.modality_id === 'led' && protocol.duration_minutes) {
    if (isObject(params.duration_minutes)) {
      errors.push(`${prefix} copied the LED duration range instead of selecting one scalar duration_minutes.`)
    } else if (!inRange(Number(params.duration_minutes), protocol.duration_minutes)) {
      errors.push(`${prefix} LED duration_minutes must be within the configured range.`)
    }
  }

  if (!operation.endpoint && protocol.endpoint) {
    warnings.push(`${prefix} should copy the configured endpoint.`)
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

function eligibilityEntryHasHold(entry) {
  const hold = entry?.safety_hold || {}
  return Boolean(
    hold.inflammation_first_required ||
      hold.barrier_repair_first_required ||
      [
        'hold_until_doctor_classification',
        'hold_until_doctor_assessment',
        'medical_control_first',
      ].includes(entry?.direct_cosmetic_treatment_status),
  )
}

function normalizeEligibilityEntry(entry) {
  const normalized = { ...(entry || {}) }
  const candidates = Array.isArray(normalized.candidate_primary_protocol_ids)
    ? normalized.candidate_primary_protocol_ids
    : []

  // Backward-compatible repair for the V2.6.1 payload contradiction where a
  // treatable pigmentation_contributor carried valid primary protocols but
  // eligible_for_course=false. A true pigment contributor may share a course
  // protocol/visit with a primary target.
  const legacyTreatableContributor =
    normalized.eligible_for_course !== true &&
    normalized.component_role === 'pigmentation_contributor' &&
    normalized.direct_cosmetic_treatment_status === 'may_plan_pending_doctor_confirmation' &&
    TREATABLE_COURSE_PATTERNS.has(normalized.treatment_pattern_code) &&
    candidates.length > 0

  if (legacyTreatableContributor) {
    const held = eligibilityEntryHasHold(normalized)
    normalized.eligible_for_course = true
    normalized.currently_executable = !held
    normalized.initial_course_allocation_status = held ? 'held' : 'unallocated'
  }

  if (normalized.eligible_for_course !== true) {
    normalized.currently_executable = false
    normalized.candidate_primary_protocol_ids = []
    normalized.currently_eligible_primary_protocol_ids = []
  }

  return normalized
}

function eligibilityMapFrom(options) {
  const entries =
    options.componentEligibility ||
    options.preflight?.component_eligibility ||
    options.compactConfig?.component_eligibility ||
    []
  return new Map(
    entries.map((entry) => {
      const normalized = normalizeEligibilityEntry(entry)
      return [normalized.diagnostic_component_id, normalized]
    }),
  )
}

function normalizeCourseAllocationRepresentation(plan, eligibilityMap, warnings) {
  const entries = Array.isArray(plan?.component_treatment_map)
    ? plan.component_treatment_map
    : []

  for (const entry of entries) {
    const eligibility = eligibilityMap.get(entry.diagnostic_component_id)
    if (!eligibility) continue

    // Echo the deterministic contract into the validated plan so later UI and
    // reassessment stages do not have to infer it from prose.
    entry.eligible_for_course = eligibility.eligible_for_course === true
    entry.currently_executable = eligibility.currently_executable === true

    if (
      eligibility.eligible_for_course !== true &&
      ['selected_for_current_block', 'planned_for_future_block'].includes(
        entry.course_allocation_status,
      ) &&
      !entry.selected_protocol_id &&
      NON_PRIMARY_MANAGEMENT_MODALITIES.has(entry.selected_modality_id)
    ) {
      entry.course_allocation_status =
        eligibility.initial_course_allocation_status ||
        (entry.treatment_eligibility === 'observe' ? 'observe_only' : 'not_applicable')
      entry.planned_block_number = null
      warnings.push(
        `${entry.diagnostic_component_id} was represented as a current/future primary allocation even though it only receives non-procedural management; course_allocation_status was normalized to ${entry.course_allocation_status}.`,
      )
    }
  }
}

function validateComponentMap(
  plan,
  diagnosis,
  groupMap,
  eligibilityMap,
  errors,
  warnings,
  options = {},
) {
  const components = diagnosis?.diagnostic_components || []
  const mapEntries = Array.isArray(plan.component_treatment_map) ? plan.component_treatment_map : []
  const entryMap = new Map(mapEntries.map((entry) => [entry.diagnostic_component_id, entry]))

  for (const component of components) {
    const id = component.diagnostic_component_id
    const entry = entryMap.get(id)
    const eligibility = eligibilityMap.get(id)
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

    const allocationStatus = entry.course_allocation_status
    if (!options.blockOnly && !COURSE_ALLOCATION_STATUSES.has(allocationStatus)) {
      errors.push(`${id} requires a valid course_allocation_status.`)
    }

    if (eligibility?.eligible_for_course && !options.blockOnly) {
      if (['selected_for_current_block', 'planned_for_future_block'].includes(allocationStatus)) {
        if (!entry.selected_protocol_id) {
          errors.push(`${id} is allocated to the course but selected_protocol_id is null.`)
        } else if (
          !(eligibility.candidate_primary_protocol_ids || []).includes(entry.selected_protocol_id)
        ) {
          errors.push(
            `${id} selected protocol ${entry.selected_protocol_id} is not in its course-eligible primary protocol list.`,
          )
        }
        if (
          allocationStatus === 'selected_for_current_block' &&
          eligibility.currently_executable !== true
        ) {
          errors.push(`${id} is selected for the current block but is not currently executable.`)
        }
        if (['led', 'homecare', 'medical_control', 'observe'].includes(entry.selected_modality_id)) {
          errors.push(`${id} is course-eligible but selected ${entry.selected_modality_id} as primary.`)
        }
      } else if (allocationStatus === 'held') {
        if (!entry.course_exclusion_or_hold_reason) {
          errors.push(`${id} is held but course_exclusion_or_hold_reason is missing.`)
        }
      } else {
        errors.push(
          `${id} is course-eligible but is not selected, planned for a future block, or explicitly held.`,
        )
      }
    }

    if (!eligibility?.eligible_for_course && !options.blockOnly) {
      if (['selected_for_current_block', 'planned_for_future_block'].includes(allocationStatus)) {
        errors.push(`${id} is not course-eligible but used a primary-course allocation status.`)
      }
    }

    if (entry.selected_protocol_id) {
      const protocol = getPigmentationProtocolById(entry.selected_protocol_id)
      if (!protocol) errors.push(`${id} selects unknown protocol ${entry.selected_protocol_id}.`)
      else if (entry.selected_modality_id && protocol.modality_id !== entry.selected_modality_id) {
        errors.push(
          `${id} protocol ${entry.selected_protocol_id} belongs to ${protocol.modality_id}, not ${entry.selected_modality_id}.`,
        )
      }
      if (
        isSupportivePigmentationProtocol(entry.selected_protocol_id) &&
        eligibility?.eligible_for_course
      ) {
        errors.push(`${id} uses supportive protocol ${entry.selected_protocol_id} as selected primary.`)
      }
    }

    const hold = component.safety_hold || {}
    const componentHeld = Boolean(
      hold.inflammation_first_required ||
        hold.barrier_repair_first_required ||
        ['hold_until_doctor_classification', 'hold_until_doctor_assessment', 'medical_control_first'].includes(
          component.direct_cosmetic_treatment_status,
        ),
    )
    if (componentHeld && entry.treatment_eligibility === 'eligible') {
      errors.push(`${id} has a component-specific hold but treatment map marks it eligible.`)
    }

    if (
      component.family_code === 'medically_atypical_focal_lesion' &&
      PRIMARY_PROCEDURAL_MODALITIES.has(entry.selected_modality_id)
    ) {
      errors.push(`${id} is medically atypical and cannot receive a cosmetic procedure.`)
    }
    if (
      component.treatment_pattern_code === 'structural_shadow' &&
      PRIMARY_PROCEDURAL_MODALITIES.has(entry.selected_modality_id)
    ) {
      errors.push(`${id} is structural shadow and cannot be treated as primary pigment.`)
    }
    if (
      component.family_code === 'non_pigmentation_relevant_finding' &&
      PRIMARY_PROCEDURAL_MODALITIES.has(entry.selected_modality_id)
    ) {
      errors.push(`${id} is not pigmentation-relevant and cannot receive a pigment procedure.`)
    }

    if (
      component.clinical_location_text &&
      normalizeText(component.clinical_location_text) !== normalizeText(entry.clinical_location_text)
    ) {
      warnings.push(`${id} treatment map should preserve diagnosis location text exactly.`)
    }

    for (const groupId of linkedGroups) {
      if (!groupMap.has(groupId)) errors.push(`${id} references unknown group ${groupId}.`)
    }
  }

  return entryMap
}

function validateOperation(
  operation,
  sessionNumber,
  componentMap,
  groupMap,
  eligibilityMap,
  errors,
  warnings,
) {
  const prefix = `session ${sessionNumber} operation ${operation?.operation_id || 'unknown'}`
  if (!operation?.operation_id) errors.push(`${prefix} requires operation_id.`)
  if (!operation?.modality_id) errors.push(`${prefix} requires modality_id.`)

  const needsProtocol = !['homecare', 'medical_control', 'observe'].includes(operation?.modality_id)
  if (!operation?.protocol_id && needsProtocol) errors.push(`${prefix} requires an exact protocol_id.`)

  if (operation?.role === 'primary' && isSupportivePigmentationProtocol(operation?.protocol_id)) {
    errors.push(`${prefix} cannot use supportive protocol ${operation.protocol_id} as primary.`)
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
  if (!linkedComponents.length) errors.push(`${prefix} has no linked_component_ids.`)
  if (!linkedGroups.length && PRIMARY_PROCEDURAL_MODALITIES.has(operation?.modality_id)) {
    errors.push(`${prefix} has no linked_group_ids.`)
  }

  for (const componentId of linkedComponents) {
    if (!componentMap.has(componentId)) {
      errors.push(`${prefix} references unknown component ${componentId}.`)
      continue
    }
    const eligibility = eligibilityMap.get(componentId)
    if (operation.protocol_id && eligibility) {
      const supportive = isSupportivePigmentationProtocol(operation.protocol_id)
      const allowedIds = supportive
        ? eligibility.supportive_protocol_ids || []
        : eligibility.currently_eligible_primary_protocol_ids || []
      if (!allowedIds.includes(operation.protocol_id)) {
        errors.push(
          `${prefix} protocol ${operation.protocol_id} is not eligible for linked component ${componentId}.`,
        )
      }
      if (
        !supportive &&
        operation.role === 'primary' &&
        componentMap.get(componentId)?.course_allocation_status !== 'selected_for_current_block'
      ) {
        errors.push(
          `${prefix} treats ${componentId} as a current primary although its course allocation is not selected_for_current_block.`,
        )
      }
    }
  }
  for (const groupId of linkedGroups) {
    if (!groupMap.has(groupId)) errors.push(`${prefix} references unknown group ${groupId}.`)
  }

  if (PRIMARY_PROCEDURAL_MODALITIES.has(operation?.modality_id) && isVagueLocation(operation?.target_location_text)) {
    errors.push(`${prefix} requires a precise target_location_text.`)
  }

  if (operation?.modality_id === 'electrocautery_or_rf') {
    for (const groupId of linkedGroups) {
      const group = groupMap.get(groupId)
      if ((group?.measurement_role || group?.burden_category) !== 'raised_pigmented_lesion') {
        errors.push(`${prefix} may target only raised groups; ${groupId} is ${(group?.measurement_role || group?.burden_category)}.`)
      }
    }
  }

  if (
    ['q_switch_laser', 'focal_laser', 'chemical_peel', 'microneedling_with_active'].includes(
      operation?.modality_id,
    )
  ) {
    const targetGroups = linkedGroups.map((id) => groupMap.get(id)).filter(Boolean)
    const overlappingRaised = [...groupMap.values()].filter(
      (candidate) =>
        (candidate.measurement_role || candidate.burden_category) === 'raised_pigmented_lesion' &&
        targetGroups.some((target) => groupsOverlap(target, candidate)),
    )
    const excluded = unique(operation?.exclude_group_ids)
    for (const raised of overlappingRaised) {
      if (!excluded.includes(raised.group_id)) {
        errors.push(`${prefix} must exclude co-located raised group ${raised.group_id}.`)
      }
    }
  }

  if (!Array.isArray(operation?.aftercare) || !operation.aftercare.length) {
    warnings.push(`${prefix} should include concise aftercare.`)
  }
}

function validatePrimaryCoverage(sessions, componentMap, eligibilityMap, errors) {
  const requiredIds = [...componentMap.values()]
    .filter(
      (entry) =>
        entry.course_allocation_status === 'selected_for_current_block' &&
        eligibilityMap.get(entry.diagnostic_component_id)?.eligible_for_course === true,
    )
    .map((entry) => entry.diagnostic_component_id)

  if (!requiredIds.length) return

  const primaryOperations = sessions.flatMap((session) =>
    getOperations(session).filter(
      (operation) =>
        operation.role === 'primary' &&
        operation.protocol_id &&
        !isSupportivePigmentationProtocol(operation.protocol_id),
    ),
  )

  if (!primaryOperations.length) {
    errors.push(
      'Current treatment block is supportive-only although at least one component is selected_for_current_block.',
    )
    return
  }

  for (const componentId of requiredIds) {
    const covered = primaryOperations.some((operation) =>
      (operation.linked_component_ids || []).includes(componentId),
    )
    if (!covered) {
      errors.push(
        `${componentId} is selected_for_current_block but no primary current-session operation covers it.`,
      )
    }
  }
}

function positiveInteger(value) {
  return Number.isInteger(Number(value)) && Number(value) > 0
}

function futureSessions(plan) {
  if (Array.isArray(plan.future_provisional_sessions)) return plan.future_provisional_sessions
  if (Array.isArray(plan.future_treatment_roadmap)) return plan.future_treatment_roadmap
  return []
}

function currentPrimaryUses(sessions) {
  return sessions.flatMap((session) =>
    getOperations(session)
      .filter(
        (operation) =>
          operation.protocol_id &&
          !isSupportivePigmentationProtocol(operation.protocol_id) &&
          PRIMARY_PROCEDURAL_MODALITIES.has(operation.modality_id),
      )
      .map((operation) => ({
        session_number: Number(session.session_number),
        modality_id: operation.modality_id,
        protocol_id: operation.protocol_id,
        linked_component_ids: unique(operation.linked_component_ids),
      })),
  )
}

function futurePrimaryUses(sessions) {
  return sessions.flatMap((session) =>
    (Array.isArray(session.planned_protocol_uses) ? session.planned_protocol_uses : [])
      .filter(
        (use) =>
          use.protocol_id &&
          !isSupportivePigmentationProtocol(use.protocol_id) &&
          PRIMARY_PROCEDURAL_MODALITIES.has(use.modality_id),
      )
      .map((use) => ({
        session_number: Number(session.session_number),
        modality_id: use.modality_id,
        protocol_id: use.protocol_id,
        linked_component_ids: unique(use.linked_component_ids),
      })),
  )
}

function currentSupportiveUses(sessions) {
  return sessions.flatMap((session) =>
    getOperations(session)
      .filter(
        (operation) =>
          operation.protocol_id && isSupportivePigmentationProtocol(operation.protocol_id),
      )
      .map((operation) => ({
        session_number: Number(session.session_number),
        modality_id: operation.modality_id,
        protocol_id: operation.protocol_id,
        linked_component_ids: unique(operation.linked_component_ids),
      })),
  )
}

function futureSupportiveUses(sessions) {
  return sessions.flatMap((session) =>
    (Array.isArray(session.supportive_protocol_uses) ? session.supportive_protocol_uses : [])
      .filter(
        (use) => use.protocol_id && isSupportivePigmentationProtocol(use.protocol_id),
      )
      .map((use) => ({
        session_number: Number(session.session_number),
        modality_id: use.modality_id,
        protocol_id: use.protocol_id,
        linked_component_ids: unique(use.linked_component_ids),
      })),
  )
}

function useCountMap(uses) {
  const map = new Map()
  for (const use of uses) {
    const current = map.get(use.protocol_id) || { count: 0, sessionNumbers: [], componentIds: [] }
    current.count += 1
    current.sessionNumbers.push(use.session_number)
    current.componentIds.push(...(use.linked_component_ids || []))
    map.set(use.protocol_id, current)
  }
  return map
}

function summaryAllocationEntries(summary) {
  return [
    ...(Array.isArray(summary?.planned_modality_allocation)
      ? summary.planned_modality_allocation
      : []),
    ...(Array.isArray(summary?.separately_planned_focal_procedures)
      ? summary.separately_planned_focal_procedures
      : []),
  ]
}

function validateFullCourseSummary(
  plan,
  sessions,
  componentMap,
  eligibilityMap,
  errors,
  warnings,
) {
  const summary = plan.full_course_summary
  if (!isObject(summary)) {
    errors.push('full_course_summary is required before the detailed treatment block.')
    return
  }
  if (containsPlaceholder(summary) || 'price' in summary || 'amount' in summary) {
    errors.push('full_course_summary must contain protocol counts only and must not contain monetary pricing fields or placeholders.')
  }

  const total = Number(summary.total_planned_sessions)
  if (!positiveInteger(total)) errors.push('full_course_summary.total_planned_sessions must be a positive integer.')
  const firstReassessment = Number(summary.first_reassessment_after_session)
  if (!positiveInteger(firstReassessment)) {
    errors.push('full_course_summary.first_reassessment_after_session must be a positive integer.')
  }

  const currentNumbers = unique(sessions.map((session) => Number(session.session_number))).sort(
    (a, b) => a - b,
  )
  const future = futureSessions(plan)
  const futureNumbers = unique(future.map((session) => Number(session.session_number))).sort(
    (a, b) => a - b,
  )
  const allNumbers = unique([...currentNumbers, ...futureNumbers]).sort((a, b) => a - b)

  if (positiveInteger(total)) {
    if (allNumbers.length !== total) {
      errors.push(
        `full_course_summary.total_planned_sessions is ${total}, but ${allNumbers.length} unique course sessions were supplied.`,
      )
    }
    const expected = Array.from({ length: total }, (_, index) => index + 1)
    if (JSON.stringify(allNumbers) !== JSON.stringify(expected)) {
      errors.push(`Course session numbers must be continuous from 1 to ${total}.`)
    }
  }
  if (currentNumbers.length && firstReassessment !== Math.max(...currentNumbers)) {
    errors.push('first_reassessment_after_session must equal the last detailed current-block session.')
  }

  const courseAlias = plan.course || {}
  if (
    courseAlias.expected_total_sessions !== undefined &&
    Number(courseAlias.expected_total_sessions) !== total
  ) {
    errors.push('course.expected_total_sessions must match full_course_summary.total_planned_sessions.')
  }
  if (
    courseAlias.next_formal_reassessment_after_session !== undefined &&
    Number(courseAlias.next_formal_reassessment_after_session) !== firstReassessment
  ) {
    errors.push('course.next_formal_reassessment_after_session must match the full-course summary.')
  }

  const actualUses = [...currentPrimaryUses(sessions), ...futurePrimaryUses(future)]
  const actualMap = useCountMap(actualUses)
  const allocations = summaryAllocationEntries(summary)
  const allocationMap = new Map()

  for (const [index, allocation] of allocations.entries()) {
    const prefix = `full_course_summary allocation ${index + 1}`
    if (!allocation.protocol_id) {
      errors.push(`${prefix} requires protocol_id.`)
      continue
    }
    const protocol = getPigmentationProtocolById(allocation.protocol_id)
    if (!protocol) errors.push(`${prefix} uses unknown protocol ${allocation.protocol_id}.`)
    else if (isSupportivePigmentationProtocol(allocation.protocol_id)) {
      errors.push(`${prefix} cannot place a supportive protocol in primary/focal allocation.`)
    } else if (allocation.modality_id && protocol.modality_id !== allocation.modality_id) {
      errors.push(`${prefix} modality_id does not match protocol ${allocation.protocol_id}.`)
    }
    if (!positiveInteger(allocation.planned_uses)) {
      errors.push(`${prefix}.planned_uses must be a positive integer.`)
    }
    const sessionNumbers = unique((allocation.session_numbers || []).map(Number)).sort((a, b) => a - b)
    if (Number(allocation.planned_uses) !== sessionNumbers.length) {
      errors.push(`${prefix}.planned_uses must equal the number of unique session_numbers.`)
    }
    if (sessionNumbers.some((number) => !allNumbers.includes(number))) {
      errors.push(`${prefix} references a session outside the master course.`)
    }
    allocationMap.set(allocation.protocol_id, {
      count: Number(allocation.planned_uses),
      sessionNumbers,
      componentIds: unique(allocation.linked_component_ids),
    })
  }

  for (const [protocolId, actual] of actualMap.entries()) {
    const allocation = allocationMap.get(protocolId)
    if (!allocation) {
      errors.push(`Protocol ${protocolId} occurs in the course but is missing from full_course_summary.`)
      continue
    }
    if (allocation.count !== actual.count) {
      errors.push(
        `Protocol ${protocolId} planned_uses is ${allocation.count}, but it occurs ${actual.count} times across current and future sessions.`,
      )
    }
    const actualSessions = unique(actual.sessionNumbers).sort((a, b) => a - b)
    if (JSON.stringify(allocation.sessionNumbers) !== JSON.stringify(actualSessions)) {
      errors.push(`Protocol ${protocolId} session_numbers do not match the detailed/provisional roadmap.`)
    }
  }
  for (const protocolId of allocationMap.keys()) {
    if (!actualMap.has(protocolId)) {
      errors.push(`Protocol ${protocolId} is allocated in the summary but never appears in the course roadmap.`)
    }
  }

  const supportiveActualUses = [
    ...currentSupportiveUses(sessions),
    ...futureSupportiveUses(future),
  ]
  const supportiveActualMap = useCountMap(supportiveActualUses)
  const supportiveSummaryMap = new Map()
  for (const [index, supportive] of (summary.supportive_inclusions || []).entries()) {
    const prefix = `full_course_summary.supportive_inclusions[${index}]`
    const protocol = getPigmentationProtocolById(supportive.protocol_id)
    if (!protocol || !isSupportivePigmentationProtocol(supportive.protocol_id)) {
      errors.push(`${prefix} must reference a configured supportive protocol.`)
    }
    if (!positiveInteger(supportive.planned_uses)) {
      errors.push(`${prefix}.planned_uses must be a positive integer.`)
    }
    const sessionNumbers = unique((supportive.session_numbers || []).map(Number)).sort(
      (a, b) => a - b,
    )
    if (Number(supportive.planned_uses) !== sessionNumbers.length) {
      errors.push(`${prefix}.planned_uses must equal the number of unique session_numbers.`)
    }
    if (sessionNumbers.some((number) => !allNumbers.includes(number))) {
      errors.push(`${prefix} references a session outside the master course.`)
    }
    supportiveSummaryMap.set(supportive.protocol_id, {
      count: Number(supportive.planned_uses),
      sessionNumbers,
    })
    if (supportive.standalone_visit !== true && supportive.included_in_total_planned_sessions === true) {
      warnings.push(`${prefix} is not standalone and should not increase total_planned_sessions.`)
    }
  }
  for (const [protocolId, actual] of supportiveActualMap.entries()) {
    const summaryEntry = supportiveSummaryMap.get(protocolId)
    if (!summaryEntry) {
      errors.push(`Supportive protocol ${protocolId} occurs in the course but is missing from supportive_inclusions.`)
      continue
    }
    const actualSessions = unique(actual.sessionNumbers).sort((a, b) => a - b)
    if (summaryEntry.count !== actual.count) {
      errors.push(
        `Supportive protocol ${protocolId} planned_uses is ${summaryEntry.count}, but it occurs ${actual.count} times across the course.`,
      )
    }
    if (JSON.stringify(summaryEntry.sessionNumbers) !== JSON.stringify(actualSessions)) {
      errors.push(`Supportive protocol ${protocolId} session_numbers do not match the course roadmap.`)
    }
  }
  for (const protocolId of supportiveSummaryMap.keys()) {
    if (!supportiveActualMap.has(protocolId)) {
      errors.push(`Supportive protocol ${protocolId} is listed in the summary but never appears in the course.`)
    }
  }

  for (const [componentId, eligibility] of eligibilityMap.entries()) {
    if (!eligibility.eligible_for_course) continue
    const entry = componentMap.get(componentId)
    const status = entry?.course_allocation_status
    if (['selected_for_current_block', 'planned_for_future_block'].includes(status)) {
      const linked = allocations.some((allocation) =>
        (allocation.linked_component_ids || []).includes(componentId),
      )
      if (!linked) {
        errors.push(`${componentId} is allocated to treatment but is absent from full_course_summary protocol allocation.`)
      }
    } else if (status !== 'held') {
      errors.push(`${componentId} is course-eligible but has no valid course allocation.`)
    }
  }

  const roadmap = plan.master_treatment_roadmap
  if (!isObject(roadmap) || !Array.isArray(roadmap.blocks) || !roadmap.blocks.length) {
    errors.push('master_treatment_roadmap.blocks is required.')
  } else {
    if (Number(roadmap.total_planned_sessions) !== total) {
      errors.push('master_treatment_roadmap.total_planned_sessions must match full_course_summary.')
    }
    const roadmapNumbers = unique(
      roadmap.blocks.flatMap((block) => (block.session_numbers || []).map(Number)),
    ).sort((a, b) => a - b)
    if (JSON.stringify(roadmapNumbers) !== JSON.stringify(allNumbers)) {
      errors.push('master_treatment_roadmap blocks must cover every course session exactly once.')
    }

    for (const block of roadmap.blocks) {
      const blockNumbers = new Set((block.session_numbers || []).map(Number))
      const actualBlockMap = useCountMap(
        [...actualUses, ...supportiveActualUses].filter((use) =>
          blockNumbers.has(Number(use.session_number)),
        ),
      )
      const plannedBlockMap = new Map()
      const blockPlannedUses = [
        ...(block.primary_protocol_uses || []),
        ...(block.supportive_protocol_uses || []),
        ...(block.planned_protocol_uses || []),
      ]
      for (const use of blockPlannedUses) {
        if (!use.protocol_id || !positiveInteger(use.planned_uses)) {
          errors.push(
            `Roadmap block ${block.block_number} protocol-use entries require protocol_id and positive planned_uses.`,
          )
          continue
        }
        plannedBlockMap.set(use.protocol_id, Number(use.planned_uses))
      }
      for (const [protocolId, actual] of actualBlockMap.entries()) {
        if (!plannedBlockMap.has(protocolId)) {
          errors.push(
            `Roadmap block ${block.block_number} omits protocol ${protocolId} used in its sessions.`,
          )
        } else if (plannedBlockMap.get(protocolId) !== actual.count) {
          errors.push(
            `Roadmap block ${block.block_number} lists ${protocolId} x${plannedBlockMap.get(protocolId)}, but its sessions contain x${actual.count}.`,
          )
        }
      }
      for (const protocolId of plannedBlockMap.keys()) {
        if (!actualBlockMap.has(protocolId)) {
          errors.push(
            `Roadmap block ${block.block_number} lists protocol ${protocolId} but none of its sessions use it.`,
          )
        }
      }
    }

    const detailedBlocks = roadmap.blocks.filter(
      (block) => block.detail_status === 'detailed_current_block',
    )
    if (detailedBlocks.length !== 1) {
      errors.push('Exactly one roadmap block must be marked detailed_current_block.')
    } else {
      const detailedNumbers = unique((detailedBlocks[0].session_numbers || []).map(Number)).sort(
        (a, b) => a - b,
      )
      if (JSON.stringify(detailedNumbers) !== JSON.stringify(currentNumbers)) {
        errors.push('The detailed roadmap block must contain exactly the current detailed sessions.')
      }
    }
  }
}

export function validatePigmentationPlan(planObj, config, options = {}) {
  const errors = []
  const warnings = []
  const plan = clone(planObj?.linear_treatment_plan || planObj || {})
  const diagnosis = options.diagnosis || {}
  const phenotype = options.phenotype || {}
  const eligibilityMap = eligibilityMapFrom(options)

  const unresolvedClassifications = (diagnosis.classification_required_items || []).filter(
    (item) => item.status !== 'resolved',
  )
  if (unresolvedClassifications.length) {
    errors.push(
      `Treatment plan cannot be validated while targeted doctor classifications remain unresolved: ${unresolvedClassifications
        .map((item) => item.classification_id)
        .join(', ')}.`,
    )
  }

  if (!isObject(plan)) {
    return { valid: false, errors: ['Treatment plan was not a JSON object.'], warnings, plan: null }
  }

  normalizeCourseAllocationRepresentation(plan, eligibilityMap, warnings)

  validateBaseline(plan, options.baselineMetrics || diagnosis?.immutable_image_metrics, errors)

  const groups = phenotype?.morphology_groups || diagnosis?.morphology_groups || []
  const groupMap = new Map(groups.map((group) => [group.group_id, group]))
  const componentMap = validateComponentMap(
    plan,
    diagnosis,
    groupMap,
    eligibilityMap,
    errors,
    warnings,
    { blockOnly: options.blockOnly === true },
  )

  const sessions = getSessions(plan)
  if (plan.plan_status !== 'blocked' && !sessions.length) {
    errors.push('A non-blocked plan must contain at least one current detailed session.')
  }

  for (const session of sessions) {
    const operations = getOperations(session)
    const sequence = getExecutionSequence(session)
    if (!operations.length) errors.push(`Session ${session.session_number} has no operations.`)

    const injuryTypes = unique(
      operations
        .filter(
          (operation) =>
            operation.injury_producing || INJURY_MODALITIES.has(operation.modality_id),
        )
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
        eligibilityMap,
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

    session.selected_modality_ids = unique(operations.map((operation) => operation.modality_id))
    session.injury_producing_modality_ids = unique(
      operations
        .filter(
          (operation) =>
            operation.injury_producing || INJURY_MODALITIES.has(operation.modality_id),
        )
        .map((operation) => operation.modality_id),
    )
  }

  validatePrimaryCoverage(sessions, componentMap, eligibilityMap, errors)

  if (!options.blockOnly && plan.plan_status !== 'blocked') {
    validateFullCourseSummary(
      plan,
      sessions,
      componentMap,
      eligibilityMap,
      errors,
      warnings,
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

export function validatePigmentationTreatmentBlock(block, config, options = {}) {
  const diagnosis = options.diagnosis || {}
  const phenotype = options.phenotype || {}
  const baselineMetrics = options.baselineMetrics || diagnosis.immutable_image_metrics || {}
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
    component_treatment_map: options.componentTreatmentMap || [],
    current_treatment_block: block,
  }
  return validatePigmentationPlan(temporaryPlan, config, { ...options, blockOnly: true })
}
