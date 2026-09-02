/**
 * Pigmentation Decode V2.7 compact plan-input builder and deterministic protocol preflight.
 * Protocol availability and safety holds are authoritative. Course-allocation labels are advisory.
 */

import {
  PIGMENTATION_CONFIG,
  getPigmentationProtocolById,
  resolvePigmentationProtocolMapEntry,
  resolveTreatmentPatternProtocolIds,
  isSupportivePigmentationProtocol,
} from './pigmentationConfigV2.js'

export const PIGMENTATION_PROTOCOL_MAP_V2 = PIGMENTATION_CONFIG.protocol_map

function unique(values) {
  return [...new Set((values || []).filter(Boolean))]
}

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value))
}

function compactProtocol(protocolId) {
  const protocol = getPigmentationProtocolById(protocolId)
  if (!protocol || protocol.available === false || protocol.configured_for_execution === false) {
    return null
  }
  return { protocol_id: protocolId, ...clone(protocol) }
}

function protocolIdsFromMapEntry(entry) {
  if (!entry) return []
  return unique([
    ...(entry.eligible_protocol_ids || []),
    ...(entry.background_protocol_ids || []),
    ...(entry.focal_flat_macule_protocol_ids || []),
    ...(entry.regional_multifocal_protocol_ids || []),
    ...(entry.laser_protocol_ids || []),
    ...(entry.conditional_candidate_protocol_ids || []),
  ])
}

function normalizeCode(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[–—]/g, '-')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function componentCodes(component) {
  return {
    family:
      component.resolved_family_code || component.family_code || component.family || '',
    subtype:
      component.resolved_subtype_code ||
      component.subtype_code ||
      component.subtype ||
      'subtype_uncertain',
    treatmentPattern:
      component.resolved_treatment_pattern_code || component.treatment_pattern_code || '',
  }
}

function linkedGroups(component, imageAnalysis) {
  const groupMap = new Map(
    (imageAnalysis?.morphology_groups || []).map((group) => [group.group_id, group]),
  )
  return (component.linked_group_ids || []).map((id) => groupMap.get(id)).filter(Boolean)
}

function inferTreatmentPattern(component, groups) {
  const codes = componentCodes(component)
  if (codes.treatmentPattern) return codes.treatmentPattern

  const family = codes.family
  const subtype = normalizeCode(codes.subtype)

  if (family === 'photo_induced_pigmentation') {
    const flatGroups = groups.filter(
      (group) => group.measurement_role === 'flat_focal_pigmented_lesion' || group.burden_category === 'flat_focal_pigmented_lesion',
    )
    const backgroundGroups = groups.filter(
      (group) => group.measurement_role === 'global_background_melanin' || group.burden_category === 'global_background_melanin',
    )
    const fewIsolated =
      flatGroups.length > 0 &&
      flatGroups.every(
        (group) =>
          group.count_band === '1_to_5' &&
          ['isolated', 'scattered', 'multifocal_scattered'].includes(group.distribution),
      )

    if (fewIsolated || /solar_lentig|ephelid|few_isolated/.test(subtype)) {
      return 'few_isolated_flat_lentiginous_lesions'
    }
    if (flatGroups.length) return 'multifocal_or_regional_flat_pigment'
    if (backgroundGroups.length) return 'background_photomelanosis'
  }

  if (family === 'benign_raised_pigmented_lesion') return 'raised_sk_dpn_like'
  if (family === 'periocular_hyperpigmentation') {
    if (/structural/.test(subtype)) return 'structural_shadow'
    return 'periocular_melanin_component'
  }
  if (family === 'perioral_hyperpigmentation') return 'perioral_melanin_component'
  if (family === 'barrier_or_scale_modifier') return 'barrier_modifier'
  if (family === 'active_inflammatory_process') return 'active_inflammation'
  if (family === 'post_inflammatory_hyperpigmentation') return 'settled_pih'
  if (family === 'melasma') {
    if (subtype === 'epidermal') return 'melasma_epidermal'
    if (subtype === 'dermal') return 'melasma_dermal'
    return 'melasma_mixed'
  }
  if (family === 'medically_atypical_focal_lesion') return 'medical_control_only'
  if (
    family === 'no_significant_diffuse_pigmentation' ||
    family === 'non_pigmentation_relevant_finding'
  ) {
    return 'observe_only'
  }
  return 'unclassified_hold'
}

function isComponentHeld(component) {
  const status = component.direct_cosmetic_treatment_status
  if (
    [
      'hold_until_doctor_classification',
      'hold_until_doctor_assessment',
      'medical_control_first',
    ].includes(status)
  ) {
    return true
  }
  const hold = component.safety_hold || {}
  return Boolean(hold.inflammation_first_required || hold.barrier_repair_first_required)
}

function requiresPrimaryProcedure(component, patternCode) {
  // Explicitly non-procedural or medically held components are not course targets.
  // Any other pigmentation target/contributor with a treatable pattern remains eligible even
  // when the model used a noncanonical descriptive treatment-status label.
  if (
    [
      'not_applicable',
      'observe_only',
      'medical_control_first',
      'hold_until_doctor_classification',
      'hold_until_doctor_assessment',
    ].includes(component.direct_cosmetic_treatment_status)
  ) {
    return false
  }

  // Course eligibility is not identical to diagnostic prominence. A true
  // pigmentation contributor such as diffuse background photomelanosis may
  // legitimately share an executable course protocol with a primary focal or
  // regional target without creating an additional package visit.
  const role = component.component_role || 'primary_pigment_target'
  if (!['primary_pigment_target', 'pigmentation_contributor'].includes(role)) {
    return false
  }

  return [
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
  ].includes(patternCode)
}

function unresolvedClassifications(diagnosis) {
  return (diagnosis?.classification_required_items || []).filter(
    (item) => item.status !== 'resolved',
  )
}

function resolveComponentEligibility(component, imageAnalysis) {
  const groups = linkedGroups(component, imageAnalysis)
  const codes = componentCodes(component)
  const treatmentPatternCode = inferTreatmentPattern(component, groups)

  const ids = new Set(resolveTreatmentPatternProtocolIds(treatmentPatternCode))
  // Supportive recovery remains available without ever satisfying a primary-treatment requirement.
  if (!['structural_shadow', 'medical_control_only', 'observe_only', 'unclassified_hold'].includes(treatmentPatternCode)) {
    ids.add('LED_RED_CALMING')
  }
  if (treatmentPatternCode === 'active_inflammation') {
    ids.add('LED_BLUE_ACNE_SUPPORT')
  }
  const directEntry = resolvePigmentationProtocolMapEntry(codes.family, codes.subtype)
  protocolIdsFromMapEntry(directEntry).forEach((id) => ids.add(id))

  const all = [...ids].map(compactProtocol).filter(Boolean)
  const supportive = all.filter((protocol) =>
    isSupportivePigmentationProtocol(protocol.protocol_id),
  )
  const primary = all.filter(
    (protocol) => !isSupportivePigmentationProtocol(protocol.protocol_id),
  )

  const held = isComponentHeld(component)
  const primaryRequired = requiresPrimaryProcedure(component, treatmentPatternCode)

  return {
    diagnostic_component_id: component.diagnostic_component_id,
    component_role: component.component_role || 'primary_pigment_target',
    family_code: codes.family,
    subtype_code: codes.subtype,
    treatment_pattern_code: treatmentPatternCode,
    direct_cosmetic_treatment_status: component.direct_cosmetic_treatment_status,
    safety_hold: clone(component.safety_hold || null),
    doctor_classification: clone(component.doctor_classification || null),
    eligible_for_course: primaryRequired,
    currently_executable: primaryRequired && !held,
    initial_course_allocation_status: primaryRequired
      ? held
        ? 'held'
        : 'unallocated'
      : ['structural_shadow', 'observe_only'].includes(treatmentPatternCode)
        ? 'observe_only'
        : 'not_applicable',
    // Do not expose primary protocol lists for components that are not
    // course-eligible. Previously this contradictory payload encouraged the
    // model to allocate a primary treatment and then fail deterministic
    // validation.
    candidate_primary_protocol_ids: primaryRequired
      ? primary.map((protocol) => protocol.protocol_id)
      : [],
    currently_eligible_primary_protocol_ids:
      primaryRequired && !held
        ? primary.map((protocol) => protocol.protocol_id)
        : [],
    supportive_protocol_ids: supportive.map((protocol) => protocol.protocol_id),
  }
}

function compactMorphologyGroups(imageAnalysis) {
  return (imageAnalysis?.morphology_groups || []).map((group) => ({
    group_id: group.group_id,
    record_class: group.record_class,
    phenotype_type: group.phenotype_type,
    modifier_type: group.modifier_type,
    clinical_location_text: group.clinical_location_text,
    anatomical_regions: group.anatomical_regions,
    patient_side: group.patient_side,
    morphology: group.morphology || group.primary_lesion_type,
    surface: group.surface,
    elevation: group.elevation,
    distribution: group.distribution,
    count_band: group.count_band,
    measurement_role: group.measurement_role || group.burden_category,
    burden_category: group.measurement_role || group.burden_category,
    presence_status: group.presence_status,
    confidence_100: group.confidence_100,
  }))
}

function compactDiagnosisRecord(diagnosis, imageAnalysis) {
  return {
    diagnosis_status: diagnosis?.diagnosis_status,
    immutable_image_metrics: diagnosis?.immutable_image_metrics,
    clinical_activity: diagnosis?.clinical_activity,
    risk_profile: diagnosis?.risk_profile,
    doctor_classification_resolutions: clone(
      diagnosis?.doctor_classification_resolutions || {},
    ),
    diagnostic_components: (diagnosis?.diagnostic_components || []).map((component) => ({
      diagnostic_component_id: component.diagnostic_component_id,
      linked_group_ids: component.linked_group_ids,
      clinical_location_text: component.clinical_location_text,
      regions: component.regions,
      component_role: component.component_role,
      family_code: component.family_code || component.family,
      subtype_code: component.subtype_code || component.subtype,
      diagnosis_label: component.diagnosis_label || component.patient_title || '',
      subtype_label: component.subtype_label || '',
      treatment_pattern_code: component.treatment_pattern_code,
      confidence_100: component.confidence_100,
      diagnostic_status: component.diagnostic_status,
      activity: component.activity,
      depth: component.depth,
      safety_hold: clone(component.safety_hold || {}),
      direct_cosmetic_treatment_status: component.direct_cosmetic_treatment_status,
      treatment_relevant_morphology: component.treatment_relevant_morphology,
      doctor_classification: clone(component.doctor_classification || null),
    })),
    morphology_groups: compactMorphologyGroups(imageAnalysis),
  }
}

function collectActiveRecords(protocols, fullConfig) {
  const activeIds = unique(protocols.flatMap((protocol) => protocol.allowed_active_ids || []))
  const registry = fullConfig?.microneedling_actives?.formulas_and_products || {}
  return activeIds
    .map((id) => (registry[id] ? { active_id: id, ...clone(registry[id]) } : null))
    .filter(Boolean)
}

export function assertTreatmentProtocolPreflight(preflight) {
  const errors = []
  if ((preflight?.unresolved_classification_ids || []).length) {
    errors.push(
      `Unresolved targeted doctor classifications: ${preflight.unresolved_classification_ids.join(', ')}.`,
    )
  }
  for (const entry of preflight?.component_eligibility || []) {
    if (
      entry.eligible_for_course &&
      (!Array.isArray(entry.candidate_primary_protocol_ids) ||
        entry.candidate_primary_protocol_ids.length === 0)
    ) {
      errors.push(
        `${entry.diagnostic_component_id} is course-eligible but has no configured executable primary protocol.`,
      )
    }
  }
  if (errors.length) {
    const error = new Error(`Treatment protocol preflight failed. ${errors.join(' ')}`)
    error.name = 'PigmentationProtocolPreflightError'
    error.errors = errors
    throw error
  }
  return true
}

export function buildRelevantPlanConfig({ diagnosis, imageAnalysis, policy, fullConfig }) {
  const pending = unresolvedClassifications(diagnosis)
  const components = diagnosis?.diagnostic_components || []
  const componentEligibility = components.map((component) =>
    resolveComponentEligibility(component, imageAnalysis),
  )

  const protocolIds = unique(
    componentEligibility.flatMap((entry) => [
      ...(entry.candidate_primary_protocol_ids || []),
      ...(entry.supportive_protocol_ids || []),
    ]),
  )
  const eligibleProtocols = protocolIds.map(compactProtocol).filter(Boolean)
  const eligibleActives = collectActiveRecords(eligibleProtocols, fullConfig)

  const preflight = {
    passed: pending.length === 0,
    unresolved_classification_ids: pending.map((item) => item.classification_id),
    component_eligibility: componentEligibility,
    supportive_protocols_do_not_satisfy_primary_requirement: true,
    protocol_availability_and_current_safety_are_authoritative: true,
    course_allocation_labels_are_advisory: true,
    course_eligible_component_ids: componentEligibility
      .filter((entry) => entry.eligible_for_course)
      .map((entry) => entry.diagnostic_component_id),
    currently_executable_component_ids: componentEligibility
      .filter((entry) => entry.currently_executable)
      .map((entry) => entry.diagnostic_component_id),
  }
  assertTreatmentProtocolPreflight(preflight)

  return {
    compactPolicy: {
      version: policy?.version,
      treatment_priority: clone(policy?.treatment_priority || {}),
      safety: clone(policy?.safety || {}),
    },
    compactConfig: {
      config_version: fullConfig?.version,
      config_schema_version: fullConfig?.schema_version,
      component_eligibility: componentEligibility,
      eligible_protocols: eligibleProtocols,
      eligible_microneedling_actives: eligibleActives,
      session_compatibility: clone(fullConfig?.session_compatibility_matrix || {}),
      treatment_course_contract: clone(fullConfig?.treatment_course_contract || {}),
      authorization: clone(fullConfig?.authorization || {}),
      preflight,
    },
    compactDiagnosis: compactDiagnosisRecord(diagnosis, imageAnalysis),
    compactImageAnalysis: {
      immutable_image_metrics: diagnosis?.immutable_image_metrics,
      morphology_groups: compactMorphologyGroups(imageAnalysis),
    },
    preflight,
  }
}
