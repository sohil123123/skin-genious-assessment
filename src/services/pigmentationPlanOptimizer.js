/**
 * Pigmentation Decode V2.4 compact plan-input builder.
 *
 * The treatment model receives only case-relevant clinical facts and exact eligible
 * protocols. It never receives the whole phenotype record, policy or clinic inventory.
 */

import {
  PIGMENTATION_CONFIG,
  getPigmentationProtocolById,
  resolvePigmentationProtocolMapEntry,
} from './pigmentationConfigV2.js'

export const PIGMENTATION_PROTOCOL_MAP_V2 = PIGMENTATION_CONFIG.protocol_map

function unique(values) {
  return [...new Set((values || []).filter(Boolean))]
}

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value))
}

function protocolIdsFromMapEntry(entry) {
  if (!entry) return []
  return unique([
    ...(entry.eligible_protocol_ids || []),
    ...(entry.background_protocol_ids || []),
    ...(entry.focal_flat_macule_protocol_ids || []),
    ...(entry.regional_multifocal_protocol_ids || []),
    ...(entry.laser_protocol_ids || []),
  ])
}

function resolveComponentProtocolIds(component, imageAnalysis) {
  const direct = resolvePigmentationProtocolMapEntry(component.family, component.subtype)
  const ids = protocolIdsFromMapEntry(direct)

  // The diagnosis may use a broad family or an implementation-specific subtype string.
  // Add the family:any fallback where the config exposes one.
  const fallback = PIGMENTATION_CONFIG.protocol_map.entries?.[`${component.family}:any`]
  ids.push(...protocolIdsFromMapEntry(fallback))

  const groupMap = new Map(
    (imageAnalysis?.morphology_groups || []).map((group) => [group.group_id, group]),
  )
  const linkedGroups = (component.linked_group_ids || [])
    .map((id) => groupMap.get(id))
    .filter(Boolean)

  // Morphology-aware fallbacks prevent broad-but-valid diagnostic labels from starving the
  // treatment comparison of reasonable candidates. These candidates remain subject to the
  // component's doctor hold and the plan validator.
  if (
    component.family === 'photo_induced_pigmentation' &&
    (!component.subtype || component.subtype === 'subtype_uncertain')
  ) {
    const flatGroups = linkedGroups.filter(
      (group) => group.burden_category === 'flat_focal_pigmented_lesion',
    )
    const backgroundGroups = linkedGroups.filter(
      (group) => group.burden_category === 'global_background_melanin',
    )
    const fewIsolated =
      flatGroups.length > 0 &&
      flatGroups.every(
        (group) =>
          ['1_to_5'].includes(group.count_band) &&
          ['isolated', 'scattered', 'multifocal_scattered'].includes(group.distribution),
      )

    if (fewIsolated) {
      ids.push('QS_FOCAL_EPIDERMAL_SPOT', 'PEEL_GLYCOLIC')
    } else if (flatGroups.length || backgroundGroups.length) {
      ids.push('QS_PHOTOMELANOSIS_1064', 'PEEL_GLYCOLIC', 'PEEL_BIOREPEELCL3', 'PEEL_LACTIC')
      if (
        flatGroups.some((group) =>
          ['multifocal_scattered', 'multifocal_clustered', 'regional', 'diffuse'].includes(
            group.distribution,
          ),
        )
      ) {
        ids.push('MN_MULTIFOCAL_MIXED_PIGMENT')
      }
    }
  }

  if (
    component.family === 'benign_raised_pigmented_lesion' &&
    linkedGroups.some(
      (group) =>
        group.burden_category === 'raised_pigmented_lesion' &&
        ['probably_raised', 'raised', 'uncertain'].includes(group.elevation),
    )
  ) {
    ids.push('LESION_SK_DPN_ELECTROCAUTERY_OR_RF')
  }

  if (
    component.family === 'active_inflammatory_process' &&
    (!component.subtype || component.subtype === 'other')
  ) {
    ids.push('LED_RED_CALMING')
  }

  // Active inflammation and barrier holds should not receive unrelated injury protocols.
  if (
    component.inflammation_first_required ||
    component.barrier_repair_first_required ||
    component.direct_cosmetic_treatment_status === 'medical_control_first'
  ) {
    return unique(
      ids.filter((id) => {
        const protocol = getPigmentationProtocolById(id)
        return ['led', 'homecare', 'medical_control', 'chemical_peel'].includes(
          protocol?.modality_id,
        )
      }),
    )
  }

  return unique(ids)
}

function compactProtocol(protocolId) {
  const protocol = getPigmentationProtocolById(protocolId)
  if (!protocol || protocol.available === false || protocol.configured_for_execution === false) {
    return null
  }
  return clone(protocol)
}

function collectActiveRecords(protocols, fullConfig) {
  const activeIds = unique(protocols.flatMap((protocol) => protocol.allowed_active_ids || []))
  const registry = fullConfig?.microneedling_actives?.formulas_and_products || {}
  return activeIds
    .map((id) => {
      const record = registry[id]
      if (!record) return null
      return {
        active_id: id,
        ...clone(record),
      }
    })
    .filter(Boolean)
}

function compactMorphologyGroups(imageAnalysis) {
  return (imageAnalysis?.morphology_groups || []).map((group) => ({
    group_id: group.group_id,
    clinical_location_text: group.clinical_location_text,
    anatomical_regions: group.anatomical_regions,
    morphology: group.morphology,
    surface: group.surface,
    elevation: group.elevation,
    distribution: group.distribution,
    burden_category: group.burden_category,
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
    diagnostic_components: (diagnosis?.diagnostic_components || []).map((component) => ({
      diagnostic_component_id: component.diagnostic_component_id,
      linked_group_ids: component.linked_group_ids,
      clinical_location_text: component.clinical_location_text,
      regions: component.regions,
      family: component.family,
      subtype: component.subtype,
      confidence_100: component.confidence_100,
      diagnostic_status: component.diagnostic_status,
      activity: component.activity,
      depth: component.depth,
      inflammation_first_required: component.inflammation_first_required,
      barrier_repair_first_required: component.barrier_repair_first_required,
      direct_cosmetic_treatment_status: component.direct_cosmetic_treatment_status,
      treatment_relevant_morphology: component.treatment_relevant_morphology,
    })),
    morphology_groups: compactMorphologyGroups(imageAnalysis),
  }
}

export function buildRelevantPlanConfig({ diagnosis, imageAnalysis, policy, fullConfig }) {
  const components = diagnosis?.diagnostic_components || []
  const componentEligibility = []
  const allProtocolIds = new Set(['LED_RED_CALMING'])

  for (const component of components) {
    const protocolIds = resolveComponentProtocolIds(component, imageAnalysis)
    protocolIds.forEach((id) => allProtocolIds.add(id))
    componentEligibility.push({
      diagnostic_component_id: component.diagnostic_component_id,
      family: component.family,
      subtype: component.subtype,
      direct_cosmetic_treatment_status: component.direct_cosmetic_treatment_status,
      eligible_protocol_ids: protocolIds,
    })
  }

  const eligibleProtocols = [...allProtocolIds].map(compactProtocol).filter(Boolean)
  const eligibleActives = collectActiveRecords(eligibleProtocols, fullConfig)

  const compactPolicy = {
    version: policy?.version,
    treatment_priority: clone(policy?.treatment_priority || {}),
    safety: clone(policy?.safety || {}),
  }

  const compactConfig = {
    config_version: fullConfig?.version,
    config_schema_version: fullConfig?.schema_version,
    component_eligibility: componentEligibility,
    eligible_protocols: eligibleProtocols,
    eligible_microneedling_actives: eligibleActives,
    session_compatibility: clone(fullConfig?.session_compatibility_matrix || {}),
    authorization: clone(fullConfig?.authorization || {}),
  }

  const compactDiagnosis = compactDiagnosisRecord(diagnosis, imageAnalysis)
  const compactImageAnalysis = {
    immutable_image_metrics: diagnosis?.immutable_image_metrics,
    morphology_groups: compactMorphologyGroups(imageAnalysis),
  }

  return {
    compactPolicy,
    compactConfig,
    compactDiagnosis,
    compactImageAnalysis,
  }
}
