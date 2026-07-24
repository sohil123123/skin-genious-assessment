/**
 * Pigmentation Decode V2.3 deterministic treatment-plan validator.
 *
 * This module is the application-authoritative validator for the normalized,
 * component-first treatment-plan schema emitted by pigmentationPromptsV2_1.js.
 * It deliberately does not trust model self-check fields, declared modality
 * arrays, protocol IDs, protocol parameters, target descriptions, or session
 * compatibility claims.
 *
 * Backward-compatible primary call:
 *   validatePigmentationPlan(planObj, PIGMENTATION_CONFIG)
 *
 * Recommended V2.3 call (used by the rebuilt store):
 *   validatePigmentationPlan(planObj, PIGMENTATION_CONFIG, {
 *     diagnosis: validatedDiagnosis,
 *     phenotype: validatedPhenotype,
 *     throwOnError: true,
 *   })
 */

const PLAN_VERSION = 'pigmentation_plan_validator_v2_3_2026_07_23'
const DEFAULT_MAX_INJURY_MODALITIES = 2

const IMMUTABLE_METRIC_KEYS = Object.freeze([
  'global_background_melanin_load_index',
  'global_background_erythema_load_index',
  'active_inflammatory_lesion_burden_index',
  'flat_focal_pigmented_lesion_burden_index',
  'raised_pigmented_lesion_burden_index',
  'structural_periocular_shadow_burden_index',
])

const PROCEDURAL_MODALITIES = new Set([
  'chemical_peel',
  'microneedling_with_active',
  'q_switch_laser',
  'focal_laser',
  'electrocautery_or_rf',
  'hydrafacial',
  'led',
  'cooling',
])

const INJURY_MODALITY_FALLBACK = new Set([
  'chemical_peel',
  'microneedling_with_active',
  'q_switch_laser',
  'focal_laser',
  'electrocautery_or_rf',
])

const NON_PROCEDURAL_MODALITIES = new Set(['homecare', 'medical_control', 'observe'])

const HOLD_ELIGIBILITIES = new Set([
  'hold_for_closeup',
  'hold_for_doctor_assessment',
  'not_applicable',
  'observe',
])

const PLACEHOLDER_PATTERNS = [
  /from[_\s-]*config/i,
  /as[_\s-]*per[_\s-]*(the[_\s-]*)?protocol/i,
  /doctor[_\s-]*(to|will)[_\s-]*decide/i,
  /tbd/i,
  /to[_\s-]*be[_\s-]*decided/i,
  /insert[_\s-]*protocol/i,
  /exact[_\s-]*config[_\s-]*protocol/i,
  /string[_\s-]*or[_\s-]*null/i,
]

const STEP_ALIASES = Object.freeze({
  assessment: 'other',
  photograph: 'other',
  protect: 'other',
  numbing_removal: 'remove_numbing',
  neutralise: 'neutralize_peel',
  active_application: 'apply_active',
  moisturise: 'moisturizer',
  aftercare: 'homecare_handover',
})

const REGION_FAMILY_ALIASES = Object.freeze({
  right_outer_malar: 'right_malar',
  right_central_malar: 'right_malar',
  right_medial_malar: 'right_malar',
  left_outer_malar: 'left_malar',
  left_central_malar: 'left_malar',
  left_medial_malar: 'left_malar',
  right_periocular: 'periocular',
  left_periocular: 'periocular',
  right_oral_commissure: 'upper_lip_perioral',
  left_oral_commissure: 'upper_lip_perioral',
  lower_lip_perioral: 'upper_lip_perioral',
  chin: 'chin_jaw',
  right_jawline: 'chin_jaw',
  left_jawline: 'chin_jaw',
})

export class PigmentationPlanValidationError extends Error {
  constructor(validation) {
    super(`Pigmentation treatment plan failed validation:\n- ${validation.errors.join('\n- ')}`)
    this.name = 'PigmentationPlanValidationError'
    this.validation = validation
  }
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function normaliseToken(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[–—]/g, '-')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function normaliseProse(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/[.,;:()[\]{}]/g, '')
}

function canonicalModality(value) {
  const token = normaliseToken(value)
  if (!token) return null

  const aliases = {
    peel: 'chemical_peel',
    q_switch: 'q_switch_laser',
    laser_toning: 'q_switch_laser',
    spot_laser: 'focal_laser',
    microneedling: 'microneedling_with_active',
    electrocautery: 'electrocautery_or_rf',
    radiofrequency: 'electrocautery_or_rf',
    rf: 'electrocautery_or_rf',
    barrier_repair: 'homecare',
    structural_assessment: 'observe',
    doctor_assessment: 'medical_control',
  }

  return aliases[token] || token
}

function unique(values) {
  return [
    ...new Set(values.filter((value) => value !== null && value !== undefined && value !== '')),
  ]
}

function difference(first, second) {
  const secondSet = new Set(second)
  return first.filter((value) => !secondSet.has(value))
}

function sameSet(first, second) {
  const a = unique(first)
  const b = unique(second)
  return a.length === b.length && difference(a, b).length === 0
}

function duplicates(values) {
  const seen = new Set()
  const repeated = new Set()
  for (const value of values) {
    if (seen.has(value)) repeated.add(value)
    seen.add(value)
  }
  return [...repeated]
}

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function withinRange(value, range) {
  if (!isFiniteNumber(value)) return false
  if (isFiniteNumber(range)) return value === range
  if (!isObject(range)) return true
  if (isFiniteNumber(range.min) && value < range.min) return false
  if (isFiniteNumber(range.max) && value > range.max) return false
  return true
}

function pushRangeError(value, range, label, errors, { required = true } = {}) {
  if (value === null || value === undefined) {
    if (required) errors.push(`${label} is required.`)
    return
  }
  if (!isFiniteNumber(value)) {
    errors.push(`${label} must be a finite number.`)
    return
  }
  if (!withinRange(value, range)) {
    const expected = isFiniteNumber(range)
      ? String(range)
      : `${range?.min ?? '-∞'}-${range?.max ?? '∞'}`
    errors.push(`${label} ${value} is outside configured value/range ${expected}.`)
  }
}

function containsPlaceholder(value, path = '$') {
  if (typeof value === 'string') {
    return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value)) ? path : null
  }
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const found = containsPlaceholder(value[index], `${path}[${index}]`)
      if (found) return found
    }
  } else if (isObject(value)) {
    for (const [key, nested] of Object.entries(value)) {
      const found = containsPlaceholder(nested, `${path}.${key}`)
      if (found) return found
    }
  }
  return null
}

function unwrapPlan(planObj) {
  if (isObject(planObj?.linear_treatment_plan)) return planObj.linear_treatment_plan
  return planObj
}

function unwrapDiagnosis(diagnosis) {
  if (isObject(diagnosis?.data)) return diagnosis.data
  return diagnosis
}

function unwrapPhenotype(phenotype) {
  if (isObject(phenotype?.data)) return phenotype.data
  return phenotype
}

function getCurrentSessions(plan) {
  return asArray(plan?.current_treatment_block?.sessions)
}

function getFutureSessions(plan) {
  return asArray(plan?.future_provisional_sessions)
}

function getDiagnosisComponents(diagnosis) {
  return asArray(unwrapDiagnosis(diagnosis)?.diagnostic_components)
}

function getMorphologyGroups(phenotype) {
  return asArray(unwrapPhenotype(phenotype)?.morphology_groups)
}

function getProtocolRegistries(config) {
  return [
    ['q_switch.protocols', config?.q_switch?.protocols],
    ['microneedling.protocols', config?.microneedling?.protocols],
    [
      'microneedling_actives.formulas_and_products',
      config?.microneedling_actives?.formulas_and_products,
    ],
    ['peels.protocols', config?.peels?.protocols],
    ['lesion_directed_procedures', config?.lesion_directed_procedures],
    ['supportive_devices', config?.supportive_devices],
  ].filter(([, registry]) => isObject(registry))
}

function findProtocol(config, protocolId) {
  if (!isNonEmptyString(protocolId)) return null
  for (const [registryPath, registry] of getProtocolRegistries(config)) {
    if (Object.prototype.hasOwnProperty.call(registry, protocolId)) {
      return { protocolId, registryPath, protocol: registry[protocolId] }
    }
  }
  return null
}

function getExecutionRegistry(config, modalityId) {
  return config?.modality_execution_registry?.[modalityId] || null
}

function getModalityRecord(config, modalityId) {
  return config?.modality_inventory_summary?.modalities?.[modalityId] || null
}

function isInjuryModality(modalityId, config) {
  const executionRecord = getExecutionRegistry(config, modalityId)
  if (typeof executionRecord?.injury_producing === 'boolean') {
    return executionRecord.injury_producing
  }
  const modalityRecord = getModalityRecord(config, modalityId)
  if (typeof modalityRecord?.injury_producing === 'boolean') {
    return modalityRecord.injury_producing
  }
  return INJURY_MODALITY_FALLBACK.has(modalityId)
}

function protocolRequiredForModality(modalityId, config) {
  const executionRecord = getExecutionRegistry(config, modalityId)
  if (typeof executionRecord?.protocol_required === 'boolean') {
    return executionRecord.protocol_required
  }
  return Boolean(executionRecord?.protocol_registry_path)
}

function getRequiredSteps(modalityId, config) {
  const fromExecutionRegistry = asArray(
    getExecutionRegistry(config, modalityId)?.required_execution_steps,
  )
  if (fromExecutionRegistry.length > 0) return fromExecutionRegistry.map(normaliseToken)
  return asArray(
    config?.provider_protocol_contract?.selected_modality_to_required_steps?.[modalityId],
  ).map(normaliseToken)
}

function canonicalStepType(rawStepType, operation, config) {
  const token = normaliseToken(rawStepType)
  if (token === 'procedure') {
    const required = getRequiredSteps(operation?.modality_id, config)
    return required[0] || 'other'
  }
  return STEP_ALIASES[token] || token
}

function getCompatibility(config, first, second) {
  const pairs = config?.session_compatibility_matrix?.pairs || {}
  return (
    pairs[`${first}+${second}`] ||
    pairs[`${second}+${first}`] ||
    (isInjuryModality(first, config) && pairs[`any_injury_modality+${second}`]) ||
    (isInjuryModality(second, config) && pairs[`any_injury_modality+${first}`]) ||
    null
  )
}

function regionFamily(region) {
  const token = normaliseToken(region)
  return REGION_FAMILY_ALIASES[token] || token
}

function groupRegions(group) {
  return unique(
    [...asArray(group?.anatomical_regions), ...asArray(group?.regions)].map(regionFamily),
  )
}

function groupsOverlap(first, second) {
  const firstRegions = groupRegions(first)
  const secondRegions = new Set(groupRegions(second))
  if (firstRegions.includes('whole_face') || secondRegions.has('whole_face')) return true
  return firstRegions.some((region) => secondRegions.has(region))
}

function groupPhenotypeType(group) {
  const burden = normaliseToken(group?.burden_category || group?.separate_burden_type)
  const morphology = normaliseToken(group?.morphology)
  const elevation = normaliseToken(group?.elevation)

  if (burden.includes('raised_pigmented') || ['raised', 'probably_raised'].includes(elevation)) {
    return 'raised_pigmented'
  }
  if (
    burden.includes('flat_focal') ||
    (['macule', 'patch'].includes(morphology) && elevation === 'flat')
  ) {
    return 'flat_pigmented'
  }
  if (burden.includes('structural_shadow') || morphology === 'structural_shadow') {
    return 'structural_shadow'
  }
  if (burden.includes('active_inflammatory') || morphology.includes('inflammatory')) {
    return 'active_inflammatory'
  }
  return 'other'
}

function isPreciseLocationText(text, config) {
  if (!isNonEmptyString(text)) return false
  const normalized = normaliseToken(text)
  const broadInvalid = asArray(config?.treatment_targeting_contract?.broad_location_only_is_invalid)
    .map(normaliseToken)
    .filter(Boolean)
  if (broadInvalid.includes(normalized)) return false
  if (String(text).trim().length < 18) return false

  const canonicalRegions = asArray(config?.anatomical_location_contract?.canonical_regions).map(
    (region) => normaliseToken(region).replace(/_/g, ' '),
  )
  const landmarkTerms = asArray(config?.anatomical_location_contract?.landmark_terms).map((term) =>
    normaliseToken(term).replace(/_/g, ' '),
  )
  const prose = normaliseProse(text).replace(/_/g, ' ')

  const hasRegion =
    canonicalRegions.some((region) => prose.includes(region)) ||
    /\b(malar|zygomatic|periocular|infraorbital|perioral|upper lip|oral commissure|temple|forehead|jawline|chin|nasal|cheek)\b/.test(
      prose,
    )
  const hasSideOrMidline = /\b(right|left|bilateral|both|midline|central)\b/.test(prose)
  const hasDistribution =
    /\b(multifocal|scattered|clustered|diffuse|confluent|isolated|regional|multiple|papules|macules|lesions|spots|zone)\b/.test(
      prose,
    )
  const hasLandmark =
    landmarkTerms.some((term) => prose.includes(term)) ||
    /\b(canthus|zygomatic|nasolabial|nasal ala|upper lip|oral commissure|mandibular|tear trough|outer cheek|central cheek|lateral cheek)\b/.test(
      prose,
    )

  return hasRegion && (hasSideOrMidline || hasLandmark) && hasDistribution
}

function locationContainsBase(targetLocation, baseLocation) {
  if (!isNonEmptyString(baseLocation) || !isNonEmptyString(targetLocation)) return false
  return normaliseProse(targetLocation).includes(normaliseProse(baseLocation))
}

function resolveProtocolMapEntry(config, family, subtype) {
  if (!isNonEmptyString(family)) return null
  const directKey = `${family}:${subtype || 'any'}`
  const aliases = config?.protocol_map?.subtype_alias_resolution || {}
  const resolvedKey = aliases[directKey] || directKey
  return (
    config?.protocol_map?.entries?.[resolvedKey] ||
    config?.protocol_map?.entries?.[`${family}:any`] ||
    null
  )
}

function collectEligibleProtocolIds(entry) {
  if (!isObject(entry)) return []
  const protocolIds = []
  for (const [key, value] of Object.entries(entry)) {
    if (key.endsWith('protocol_ids') && Array.isArray(value)) protocolIds.push(...value)
  }
  return unique(protocolIds)
}

function collectEligibleModalities(entry, config) {
  if (!isObject(entry)) return []
  const explicit = asArray(entry.eligible_modality_groups).map(canonicalModality)
  const fromProtocols = collectEligibleProtocolIds(entry)
    .map((protocolId) => canonicalModality(findProtocol(config, protocolId)?.protocol?.modality_id))
    .filter(Boolean)
  return unique([...explicit, ...fromProtocols])
}

function modalityEligibleForEntry(modalityId, entry, config) {
  if (!entry) return true
  const eligible = collectEligibleModalities(entry, config)
  if (eligible.length === 0) return true
  if (eligible.includes(modalityId)) return true
  if (
    modalityId === 'homecare' &&
    eligible.some((item) => ['barrier_repair', 'homecare'].includes(item))
  ) {
    return true
  }
  if (
    modalityId === 'medical_control' &&
    eligible.some((item) => ['doctor_assessment', 'medical_control'].includes(item))
  ) {
    return true
  }
  if (
    modalityId === 'observe' &&
    eligible.some((item) => ['structural_assessment', 'observe'].includes(item))
  ) {
    return true
  }
  return false
}

function protocolEligibleForEntry(protocolId, entry) {
  if (!entry || !isNonEmptyString(protocolId)) return true
  const eligibleProtocols = collectEligibleProtocolIds(entry)
  return eligibleProtocols.length === 0 || eligibleProtocols.includes(protocolId)
}

function validationResult(errors, warnings, plan, derived) {
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    validator_version: PLAN_VERSION,
    normalized_plan: plan,
    derived,
  }
}

function validateVersionMetadata(plan, config, errors, warnings) {
  const compatiblePolicies = asArray(config?.compatible_policy_versions)
  if (!isNonEmptyString(plan?.policy_version)) {
    errors.push('Plan policy_version is required.')
  } else if (compatiblePolicies.length > 0 && !compatiblePolicies.includes(plan.policy_version)) {
    errors.push(
      `Plan policy_version '${plan.policy_version}' is incompatible with config; expected one of: ${compatiblePolicies.join(', ')}.`,
    )
  }

  if (!isNonEmptyString(plan?.config_version)) {
    errors.push('Plan config_version is required.')
  } else if (plan.config_version !== config?.version) {
    errors.push(`Plan config_version '${plan.config_version}' does not match '${config?.version}'.`)
  }

  if (!isNonEmptyString(plan?.config_schema_version)) {
    errors.push('Plan config_schema_version is required.')
  } else if (plan.config_schema_version !== config?.schema_version) {
    errors.push(
      `Plan config_schema_version '${plan.config_schema_version}' does not match '${config?.schema_version}'.`,
    )
  }

  if (!isNonEmptyString(plan?.prompt_version)) {
    warnings.push('Plan prompt_version is missing; auditability is reduced.')
  }
}

function validateBlockedPlan(plan, diagnosis, errors) {
  const diagnosisStatus = normaliseToken(diagnosis?.diagnosis_status)
  const hasMaterialDiscrepancy =
    diagnosis?.visual_completeness_audit?.material_discrepancy === true ||
    diagnosis?.phenotype_discrepancy?.material === true

  if (diagnosisStatus === 'blocked_pending_phenotype_reanalysis' || hasMaterialDiscrepancy) {
    if (normaliseToken(plan?.plan_status) !== 'blocked') {
      errors.push(
        'Diagnosis is blocked by a material phenotype discrepancy; plan_status must be blocked.',
      )
    }
  }

  if (
    normaliseToken(plan?.plan_status) === 'blocked' &&
    !isNonEmptyString(plan?.planning_block_reason)
  ) {
    errors.push('A blocked plan requires planning_block_reason.')
  }
}

function validateBaseline(plan, diagnosis, phenotype, errors) {
  const baseline = plan?.baseline_summary
  if (!isObject(baseline)) {
    errors.push('baseline_summary is required.')
    return
  }

  const immutable = diagnosis?.immutable_image_metrics || phenotype?.immutable_image_metrics
  for (const key of IMMUTABLE_METRIC_KEYS) {
    if (!isFiniteNumber(baseline[key])) {
      errors.push(`baseline_summary.${key} must be a finite number.`)
      continue
    }
    if (isObject(immutable) && isFiniteNumber(immutable[key]) && baseline[key] !== immutable[key]) {
      errors.push(
        `baseline_summary.${key} (${baseline[key]}) does not match validated diagnosis/phenotype value (${immutable[key]}).`,
      )
    }
  }

  const baselineComponentIds = unique(asArray(baseline.diagnostic_component_ids))
  const diagnosisComponentIds = unique(
    getDiagnosisComponents(diagnosis).map((component) => component?.diagnostic_component_id),
  )
  if (diagnosisComponentIds.length > 0 && !sameSet(baselineComponentIds, diagnosisComponentIds)) {
    errors.push(
      `baseline_summary.diagnostic_component_ids must exactly match validated diagnosis components. ` +
        `Missing: ${difference(diagnosisComponentIds, baselineComponentIds).join(', ') || 'none'}; ` +
        `unknown: ${difference(baselineComponentIds, diagnosisComponentIds).join(', ') || 'none'}.`,
    )
  }

  const baselineGroupIds = unique(asArray(baseline.morphology_group_ids))
  const phenotypeGroupIds = unique(getMorphologyGroups(phenotype).map((group) => group?.group_id))
  if (phenotypeGroupIds.length > 0 && !sameSet(baselineGroupIds, phenotypeGroupIds)) {
    errors.push(
      `baseline_summary.morphology_group_ids must exactly match validated phenotype groups. ` +
        `Missing: ${difference(phenotypeGroupIds, baselineGroupIds).join(', ') || 'none'}; ` +
        `unknown: ${difference(baselineGroupIds, phenotypeGroupIds).join(', ') || 'none'}.`,
    )
  }
}

function validateProtocolRecord(protocolId, modalityId, config, label, errors) {
  const execution = getExecutionRegistry(config, modalityId)
  const protocolRequired = protocolRequiredForModality(modalityId, config)

  if (!isNonEmptyString(protocolId)) {
    if (protocolRequired)
      errors.push(`${label}.protocol_id is required for modality '${modalityId}'.`)
    return null
  }

  const record = findProtocol(config, protocolId)
  if (!record) {
    errors.push(`${label}.protocol_id '${protocolId}' does not exist in supplied config.`)
    return null
  }

  if (record.protocol?.available === false) {
    errors.push(`${label}.protocol_id '${protocolId}' is marked unavailable.`)
  }
  if (record.protocol?.configured_for_execution === false) {
    errors.push(
      `${label}.protocol_id '${protocolId}' is not executable: ` +
        `${record.protocol.block_reason || 'configured_for_execution=false'}.`,
    )
  }
  if (record.protocol?.selectable_by_ai === false) {
    errors.push(`${label}.protocol_id '${protocolId}' is not selectable by AI.`)
  }

  const protocolModality = canonicalModality(record.protocol?.modality_id)
  if (protocolModality && protocolModality !== modalityId) {
    errors.push(
      `${label}.protocol_id '${protocolId}' belongs to '${protocolModality}', not '${modalityId}'.`,
    )
  }

  if (
    isNonEmptyString(execution?.protocol_registry_path) &&
    record.registryPath !== execution.protocol_registry_path
  ) {
    errors.push(
      `${label}.protocol_id '${protocolId}' was found in '${record.registryPath}', but modality '${modalityId}' ` +
        `requires registry '${execution.protocol_registry_path}'.`,
    )
  }

  if (modalityId === 'focal_laser' && record.protocol?.treatment_scope !== 'spot_only') {
    errors.push(`${label}: focal_laser requires a spot_only protocol.`)
  }
  if (modalityId === 'q_switch_laser' && record.protocol?.treatment_scope === 'spot_only') {
    errors.push(`${label}: q_switch_laser cannot use a spot_only focal protocol.`)
  }

  return record
}

function validateQSwitchParameters(operation, record, config, label, errors) {
  const parameters = operation.parameters
  if (!isObject(parameters)) {
    errors.push(`${label}.parameters is required for laser execution.`)
    return
  }

  const protocol = record.protocol
  const wavelength = parameters.wavelength_nm
  if (!isFiniteNumber(wavelength)) {
    errors.push(`${label}.parameters.wavelength_nm is required.`)
  } else if (
    asArray(protocol.allowed_wavelengths_nm).length > 0 &&
    !protocol.allowed_wavelengths_nm.includes(wavelength)
  ) {
    errors.push(
      `${label}.parameters.wavelength_nm ${wavelength} is not allowed; expected one of ${protocol.allowed_wavelengths_nm.join(', ')}.`,
    )
  }

  const wavelengthRange = protocol.energy_mj_range_by_wavelength?.[wavelength]
  pushRangeError(
    parameters.energy_mj,
    wavelengthRange || protocol.energy_mj_range || config?.q_switch?.device?.energy_mj_range,
    `${label}.parameters.energy_mj`,
    errors,
  )
  pushRangeError(
    parameters.frequency_hz,
    protocol.frequency_hz_range || config?.q_switch?.device?.frequency_hz_range,
    `${label}.parameters.frequency_hz`,
    errors,
  )
  pushRangeError(parameters.passes, protocol.passes_range, `${label}.parameters.passes`, errors)

  const spotArea = config?.q_switch?.device?.spot_area_cm2
  pushRangeError(parameters.spot_area_cm2, spotArea, `${label}.parameters.spot_area_cm2`, errors)

  if (!isFiniteNumber(parameters.fluence_j_cm2)) {
    errors.push(`${label}.parameters.fluence_j_cm2 is required.`)
  } else {
    if (
      protocol.fluence_j_cm2_range &&
      !withinRange(parameters.fluence_j_cm2, protocol.fluence_j_cm2_range)
    ) {
      errors.push(`${label}.parameters.fluence_j_cm2 is outside protocol range.`)
    }
    if (isFiniteNumber(parameters.energy_mj) && isFiniteNumber(spotArea) && spotArea > 0) {
      const expected = parameters.energy_mj / 1000 / spotArea
      if (Math.abs(parameters.fluence_j_cm2 - expected) > 0.01) {
        errors.push(
          `${label}.parameters.fluence_j_cm2 ${parameters.fluence_j_cm2} does not equal ` +
            `energy_mj/1000/spot_area_cm2 (${expected.toFixed(3)}).`,
        )
      }
    }
  }

  if (isNonEmptyString(protocol.endpoint) && operation.endpoint !== protocol.endpoint) {
    errors.push(`${label}.endpoint must exactly match config endpoint '${protocol.endpoint}'.`)
  }

  if (wavelength === 532 && operation.modality_id !== 'focal_laser') {
    errors.push(`${label}: 532 nm is permitted only through focal_laser/spot-only execution.`)
  }
}

function validatePeelParameters(operation, record, label, errors) {
  const parameters = operation.parameters
  if (!isObject(parameters)) {
    errors.push(`${label}.parameters is required for chemical peel execution.`)
    return
  }

  const protocol = record.protocol
  pushRangeError(
    parameters.strength_percent,
    protocol.strength_percent,
    `${label}.parameters.strength_percent`,
    errors,
    { required: protocol.strength_percent !== undefined },
  )
  pushRangeError(
    parameters.contact_time_minutes,
    protocol.contact_time_minutes,
    `${label}.parameters.contact_time_minutes`,
    errors,
  )

  if (parameters.neutralization_required !== protocol.neutralization_required) {
    errors.push(
      `${label}.parameters.neutralization_required must be ${String(protocol.neutralization_required)}.`,
    )
  }
  if (
    protocol.neutralization_required === true &&
    parameters.neutralization_method !== protocol.neutralization_method
  ) {
    errors.push(
      `${label}.parameters.neutralization_method must exactly match config '${protocol.neutralization_method}'.`,
    )
  }
  if (isNonEmptyString(protocol.endpoint) && operation.endpoint !== protocol.endpoint) {
    errors.push(`${label}.endpoint must exactly match config endpoint '${protocol.endpoint}'.`)
  }
}

function ingredientSignature(ingredients) {
  return asArray(ingredients)
    .map((ingredient) => ({
      name: normaliseToken(ingredient?.name),
      final_concentration_percent: ingredient?.final_concentration_percent,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

function sameIngredientFormula(first, second) {
  const a = ingredientSignature(first)
  const b = ingredientSignature(second)
  if (a.length !== b.length) return false
  return a.every(
    (ingredient, index) =>
      ingredient.name === b[index].name &&
      ingredient.final_concentration_percent === b[index].final_concentration_percent,
  )
}

function validateDepthMap(selectedDepths, allowedDepths, label, errors) {
  if (!isObject(selectedDepths) || Object.keys(selectedDepths).length === 0) {
    errors.push(`${label} must contain at least one treated region and exact depth.`)
    return
  }

  for (const [region, depth] of Object.entries(selectedDepths)) {
    const allowed = allowedDepths?.[region]
    if (allowed === undefined) {
      errors.push(
        `${label}.${region} is not an allowed region in the selected microneedling protocol.`,
      )
      continue
    }
    if (!withinRange(depth, allowed)) {
      const expected = isFiniteNumber(allowed) ? allowed : `${allowed?.min}-${allowed?.max}`
      errors.push(
        `${label}.${region} depth ${depth} mm is outside configured value/range ${expected}.`,
      )
    }
  }
}

function validateMicroneedlingParameters(operation, record, config, label, errors) {
  const parameters = operation.parameters
  if (!isObject(parameters)) {
    errors.push(`${label}.parameters is required for microneedling execution.`)
    return
  }

  const protocol = record.protocol
  const activeId = parameters.active_id || parameters.formula_or_product_id
  if (!isNonEmptyString(activeId)) {
    errors.push(`${label}.parameters.active_id is required.`)
    return
  }
  if (!asArray(protocol.allowed_active_ids).includes(activeId)) {
    errors.push(
      `${label}.parameters.active_id '${activeId}' is not allowed by ${record.protocolId}.`,
    )
  }

  const activeRecord = findProtocol(config, activeId)
  if (
    !activeRecord ||
    activeRecord.registryPath !== 'microneedling_actives.formulas_and_products'
  ) {
    errors.push(
      `${label}.parameters.active_id '${activeId}' is not a configured microneedling active.`,
    )
    return
  }
  if (activeRecord.protocol?.configured_for_execution === false) {
    errors.push(`${label}.parameters.active_id '${activeId}' is not configured for execution.`)
  }
  if (activeRecord.protocol?.injectable !== false || parameters.injectable !== false) {
    errors.push(
      `${label}: all microneedling actives and the plan parameter injectable must be false.`,
    )
  }
  if (parameters.route !== activeRecord.protocol?.route) {
    errors.push(
      `${label}.parameters.route '${parameters.route}' must exactly match active route ` +
        `'${activeRecord.protocol?.route}'.`,
    )
  }
  if (parameters.frequency_days !== protocol.frequency_days) {
    errors.push(
      `${label}.parameters.frequency_days must equal configured ${protocol.frequency_days}.`,
    )
  }

  validateDepthMap(
    parameters.depth_by_region_mm,
    protocol.depth_by_region_mm,
    `${label}.parameters.depth_by_region_mm`,
    errors,
  )

  if (asArray(activeRecord.protocol?.ingredients).length > 0) {
    if (!sameIngredientFormula(parameters.active_ingredients, activeRecord.protocol.ingredients)) {
      errors.push(
        `${label}.parameters.active_ingredients must exactly match configured ingredients and final concentrations for ${activeId}.`,
      )
    }
  } else if (
    asArray(activeRecord.protocol?.label_ingredients).length > 0 &&
    Array.isArray(parameters.label_ingredients)
  ) {
    const supplied = parameters.label_ingredients.map(normaliseProse)
    const configured = activeRecord.protocol.label_ingredients.map(normaliseProse)
    if (!sameSet(supplied, configured)) {
      errors.push(
        `${label}.parameters.label_ingredients, when supplied, must exactly copy the configured product label list.`,
      )
    }
  }
}

function validateLesionProcedureParameters(operation, record, label, errors) {
  const parameters = isObject(operation.parameters) ? operation.parameters : {}
  const numericPowerKeys = Object.keys(parameters).filter((key) =>
    /(power|watt|energy|fluence|frequency|hz|level|intensity)/i.test(key),
  )
  if (numericPowerKeys.length > 0) {
    errors.push(
      `${label}: electrocautery/RF operation must not invent numeric device settings; remove ${numericPowerKeys.join(', ')}.`,
    )
  }
  if (
    isNonEmptyString(record.protocol?.endpoint) &&
    operation.endpoint !== record.protocol.endpoint
  ) {
    errors.push(
      `${label}.endpoint must exactly match config endpoint '${record.protocol.endpoint}'.`,
    )
  }
  if (
    isNonEmptyString(record.protocol?.local_anaesthesia) &&
    parameters.local_anaesthesia !== record.protocol.local_anaesthesia
  ) {
    errors.push(
      `${label}.parameters.local_anaesthesia must equal '${record.protocol.local_anaesthesia}'.`,
    )
  }
}

function validateSupportiveParameters(operation, record, label, errors) {
  const protocol = record.protocol
  if (protocol.duration_minutes) {
    pushRangeError(
      operation?.parameters?.duration_minutes,
      protocol.duration_minutes,
      `${label}.parameters.duration_minutes`,
      errors,
    )
  }
}

function validateOperationParameters(operation, record, config, label, errors) {
  switch (operation.modality_id) {
    case 'q_switch_laser':
    case 'focal_laser':
      validateQSwitchParameters(operation, record, config, label, errors)
      break
    case 'chemical_peel':
      validatePeelParameters(operation, record, label, errors)
      break
    case 'microneedling_with_active':
      validateMicroneedlingParameters(operation, record, config, label, errors)
      break
    case 'electrocautery_or_rf':
      validateLesionProcedureParameters(operation, record, label, errors)
      break
    case 'led':
    case 'hydrafacial':
      validateSupportiveParameters(operation, record, label, errors)
      break
    default:
      break
  }
}

function expectedProviderAuthorization(modalityId, record, config) {
  return record?.protocol?.performed_by || config?.authorization?.performed_by?.[modalityId] || null
}

function validateProviderAuthorization(operation, record, config, label, errors) {
  if (!isNonEmptyString(operation.provider_authorization)) {
    errors.push(`${label}.provider_authorization is required.`)
    return
  }
  const expected = expectedProviderAuthorization(operation.modality_id, record, config)
  if (
    isNonEmptyString(expected) &&
    normaliseToken(operation.provider_authorization) !== normaliseToken(expected)
  ) {
    errors.push(
      `${label}.provider_authorization '${operation.provider_authorization}' must match config '${expected}'.`,
    )
  }
}

function validateComponentTreatmentMap(plan, config, diagnosis, phenotype, errors) {
  const map = asArray(plan?.component_treatment_map)
  const diagnosisComponents = getDiagnosisComponents(diagnosis)
  const diagnosisById = new Map(
    diagnosisComponents.map((component) => [component?.diagnostic_component_id, component]),
  )
  const phenotypeGroupIds = new Set(getMorphologyGroups(phenotype).map((group) => group?.group_id))

  if (map.length === 0) {
    errors.push('component_treatment_map is required and cannot be empty.')
    return { componentById: new Map(), diagnosisById }
  }

  const ids = map.map((entry) => entry?.diagnostic_component_id).filter(Boolean)
  for (const duplicate of duplicates(ids)) {
    errors.push(
      `component_treatment_map contains duplicate diagnostic_component_id '${duplicate}'.`,
    )
  }

  if (diagnosisComponents.length > 0) {
    const expectedIds = diagnosisComponents.map((component) => component?.diagnostic_component_id)
    if (!sameSet(ids, expectedIds)) {
      errors.push(
        `component_treatment_map must contain exactly one entry for every diagnosis component. ` +
          `Missing: ${difference(expectedIds, ids).join(', ') || 'none'}; ` +
          `unknown: ${difference(ids, expectedIds).join(', ') || 'none'}.`,
      )
    }
  }

  const componentById = new Map()

  map.forEach((entry, index) => {
    const label = `component_treatment_map[${index}]`
    const componentId = entry?.diagnostic_component_id
    if (!isNonEmptyString(componentId)) {
      errors.push(`${label}.diagnostic_component_id is required.`)
      return
    }
    componentById.set(componentId, entry)

    const diagnosisComponent = diagnosisById.get(componentId)
    if (diagnosisComponents.length > 0 && !diagnosisComponent) {
      errors.push(`${label} references unknown diagnosis component '${componentId}'.`)
    }

    const linkedGroups = unique(asArray(entry.linked_group_ids))
    if (
      diagnosisComponent &&
      !sameSet(linkedGroups, asArray(diagnosisComponent.linked_group_ids))
    ) {
      errors.push(`${label}.linked_group_ids must exactly copy the diagnosis component group IDs.`)
    }
    if (phenotypeGroupIds.size > 0) {
      const unknownGroups = linkedGroups.filter((groupId) => !phenotypeGroupIds.has(groupId))
      if (unknownGroups.length > 0) {
        errors.push(
          `${label}.linked_group_ids contains unknown phenotype groups: ${unknownGroups.join(', ')}.`,
        )
      }
    }

    if (!isPreciseLocationText(entry.clinical_location_text, config)) {
      errors.push(`${label}.clinical_location_text is absent or not anatomically precise.`)
    }
    if (
      diagnosisComponent &&
      normaliseProse(entry.clinical_location_text) !==
        normaliseProse(diagnosisComponent.clinical_location_text)
    ) {
      errors.push(
        `${label}.clinical_location_text must copy the validated diagnosis location unchanged.`,
      )
    }

    const eligibility = normaliseToken(entry.treatment_eligibility)
    const selectedModality = canonicalModality(entry.selected_modality_id)
    const selectedProtocol = entry.selected_protocol_id
    const hierarchyDeparture = entry.hierarchy_departure || {}

    if (!isNonEmptyString(eligibility)) {
      errors.push(`${label}.treatment_eligibility is required.`)
    }
    if (
      !['whole_face', 'regional', 'focal_lesion', 'non_procedural'].includes(
        normaliseToken(entry.scope),
      )
    ) {
      errors.push(`${label}.scope must be whole_face, regional, focal_lesion or non_procedural.`)
    }

    const preferredModality = canonicalModality(entry.preferred_modality_from_policy)
    if (
      preferredModality &&
      !getExecutionRegistry(config, preferredModality) &&
      preferredModality !== 'other'
    ) {
      errors.push(
        `${label}.preferred_modality_from_policy '${entry.preferred_modality_from_policy}' is invalid.`,
      )
    }

    const diagnosisFamily =
      diagnosisComponent?.family || normaliseToken(entry.working_diagnosis).split(':')[0]
    const diagnosisSubtype = diagnosisComponent?.subtype || 'any'
    const mapEntry = resolveProtocolMapEntry(config, diagnosisFamily, diagnosisSubtype)

    const injurySelected = selectedModality ? isInjuryModality(selectedModality, config) : false
    const diagnosisHold = [
      'hold_until_closeup',
      'hold_until_doctor_assessment',
      'medical_control_first',
    ].includes(normaliseToken(diagnosisComponent?.direct_cosmetic_treatment_status))
    const atypical = diagnosisFamily === 'medically_atypical_focal_lesion'
    const inflammationFirst = diagnosisComponent?.inflammation_first_required === true
    const barrierFirst = diagnosisComponent?.barrier_repair_first_required === true

    if ((HOLD_ELIGIBILITIES.has(eligibility) || diagnosisHold || atypical) && injurySelected) {
      errors.push(
        `${label}: a held, non-applicable or medically atypical component cannot select an injury modality.`,
      )
    }
    if (eligibility === 'control_inflammation_first' && injurySelected) {
      errors.push(`${label}: control_inflammation_first cannot select an injury modality.`)
    }
    if (eligibility === 'medical_control_first' && injurySelected) {
      errors.push(`${label}: medical_control_first cannot select an injury modality.`)
    }
    if ((inflammationFirst || barrierFirst) && injurySelected) {
      errors.push(
        `${label}: diagnosis requires inflammation/barrier control before an injury modality.`,
      )
    }

    if (eligibility === 'eligible') {
      if (!selectedModality) errors.push(`${label}.selected_modality_id is required when eligible.`)
      if (selectedModality && !getExecutionRegistry(config, selectedModality)) {
        errors.push(
          `${label}.selected_modality_id '${selectedModality}' is not in config modality registry.`,
        )
      }
    }

    if (selectedModality) {
      if (!modalityEligibleForEntry(selectedModality, mapEntry, config)) {
        if (
          hierarchyDeparture.occurred !== true ||
          !isNonEmptyString(hierarchyDeparture.case_specific_reason) ||
          hierarchyDeparture.doctor_confirmation_required !== true
        ) {
          errors.push(
            `${label}.selected_modality_id '${selectedModality}' is outside the diagnosis protocol map and ` +
              `requires a documented hierarchy_departure with doctor confirmation.`,
          )
        }
      }

      const protocolRecord = validateProtocolRecord(
        selectedProtocol,
        selectedModality,
        config,
        label,
        errors,
      )

      if (
        protocolRecord &&
        collectEligibleProtocolIds(mapEntry).length > 0 &&
        !protocolEligibleForEntry(selectedProtocol, mapEntry)
      ) {
        if (
          hierarchyDeparture.occurred !== true ||
          !isNonEmptyString(hierarchyDeparture.case_specific_reason) ||
          hierarchyDeparture.doctor_confirmation_required !== true
        ) {
          errors.push(
            `${label}.selected_protocol_id '${selectedProtocol}' is not eligible for ` +
              `${diagnosisFamily}:${diagnosisSubtype} without a documented hierarchy departure.`,
          )
        }
      }
    } else if (isNonEmptyString(selectedProtocol)) {
      errors.push(`${label}.selected_protocol_id is present while selected_modality_id is null.`)
    }

    if (diagnosisFamily === 'benign_raised_pigmented_lesion' && eligibility === 'eligible') {
      if (selectedModality !== 'electrocautery_or_rf') {
        errors.push(
          `${label}: benign raised SK/DPN-like lesions must use electrocautery_or_rf when treated.`,
        )
      }
    }
    if (
      diagnosisFamily === 'periocular_hyperpigmentation' &&
      diagnosisSubtype === 'structural_shadow_dominant' &&
      injurySelected
    ) {
      errors.push(
        `${label}: structural-shadow-dominant periocular darkness cannot receive pigment injury treatment.`,
      )
    }

    if (
      !isPreciseLocationText(entry.target_location_text, config) &&
      PROCEDURAL_MODALITIES.has(selectedModality)
    ) {
      errors.push(`${label}.target_location_text is absent or not anatomically precise.`)
    }
    if (
      PROCEDURAL_MODALITIES.has(selectedModality) &&
      !locationContainsBase(entry.target_location_text, entry.clinical_location_text)
    ) {
      errors.push(
        `${label}.target_location_text must preserve the exact diagnostic location and append instructions.`,
      )
    }

    if (!Array.isArray(entry.exclude_group_ids)) {
      errors.push(`${label}.exclude_group_ids must be an array.`)
    }
    if (
      PROCEDURAL_MODALITIES.has(selectedModality) &&
      !isNonEmptyString(entry.exclusion_instruction)
    ) {
      errors.push(`${label}.exclusion_instruction is required for procedural targeting.`)
    }
    if (asArray(entry.exclude_group_ids).some((id) => linkedGroups.includes(id))) {
      errors.push(`${label}.exclude_group_ids cannot contain a linked target group.`)
    }

    if (entry.doctor_validation_required !== true) {
      errors.push(`${label}.doctor_validation_required must be true.`)
    }

    const alternative = entry.nearest_reasonable_alternative
    if (eligibility === 'eligible' && !isObject(alternative)) {
      errors.push(`${label}.nearest_reasonable_alternative is required for eligible components.`)
    }
    if (isObject(alternative)) {
      const alternativeModality = canonicalModality(alternative.modality_id)
      if (alternativeModality && !getExecutionRegistry(config, alternativeModality)) {
        errors.push(`${label}.nearest_reasonable_alternative.modality_id is invalid.`)
      }
      if (alternativeModality) {
        validateProtocolRecord(
          alternative.protocol_id,
          alternativeModality,
          config,
          `${label}.nearest_reasonable_alternative`,
          errors,
        )
      }
    }

    if (eligibility === 'eligible' && asArray(entry.why_selected_over_alternative).length === 0) {
      errors.push(`${label}.why_selected_over_alternative must explain the clinical comparison.`)
    }

    if (containsPlaceholder(entry, label)) {
      errors.push(`${label} contains a placeholder value and is not clinically executable.`)
    }
  })

  return { componentById, diagnosisById }
}

function validateFlatRaisedTargeting(operation, phenotypeGroups, groupById, label, errors) {
  const targetGroups = asArray(operation.linked_group_ids)
    .map((id) => groupById.get(id))
    .filter(Boolean)
  const excludedIds = new Set(asArray(operation.exclude_group_ids))

  const targetTypes = new Set(targetGroups.map(groupPhenotypeType))
  const flatTargets = targetGroups.filter((group) => groupPhenotypeType(group) === 'flat_pigmented')
  const raisedTargets = targetGroups.filter(
    (group) => groupPhenotypeType(group) === 'raised_pigmented',
  )

  if (operation.modality_id === 'electrocautery_or_rf') {
    if (raisedTargets.length === 0) {
      errors.push(
        `${label}: electrocautery_or_rf must target at least one raised-pigmented morphology group.`,
      )
    }
    if (targetTypes.has('flat_pigmented')) {
      errors.push(`${label}: electrocautery_or_rf cannot target flat-pigment groups.`)
    }
    const overlappingFlat = phenotypeGroups.filter(
      (candidate) =>
        groupPhenotypeType(candidate) === 'flat_pigmented' &&
        raisedTargets.some((target) => groupsOverlap(candidate, target)),
    )
    const missing = overlappingFlat
      .map((group) => group.group_id)
      .filter((id) => !excludedIds.has(id))
    if (missing.length > 0) {
      errors.push(
        `${label}: lesion-directed treatment must exclude co-located flat groups: ${missing.join(', ')}.`,
      )
    }
  }

  if (
    ['q_switch_laser', 'focal_laser', 'chemical_peel', 'microneedling_with_active'].includes(
      operation.modality_id,
    )
  ) {
    if (targetTypes.has('raised_pigmented')) {
      errors.push(
        `${label}: flat/background pigment modalities cannot target raised-pigmented groups.`,
      )
    }
    const overlappingRaised = phenotypeGroups.filter(
      (candidate) =>
        groupPhenotypeType(candidate) === 'raised_pigmented' &&
        flatTargets.some((target) => groupsOverlap(candidate, target)),
    )
    const missing = overlappingRaised
      .map((group) => group.group_id)
      .filter((id) => !excludedIds.has(id))
    if (missing.length > 0) {
      errors.push(
        `${label}: flat-pigment treatment must exclude co-located raised groups: ${missing.join(', ')}.`,
      )
    }
  }
}

function validateOperation(
  operation,
  sessionLabel,
  operationIndex,
  config,
  componentById,
  diagnosisById,
  phenotypeGroups,
  groupById,
  allComponentIds,
  allGroupIds,
  errors,
  warnings,
) {
  const label = `${sessionLabel}.treatment_operations[${operationIndex}]`
  if (!isObject(operation)) {
    errors.push(`${label} must be an object.`)
    return null
  }

  if (!isNonEmptyString(operation.operation_id)) {
    errors.push(`${label}.operation_id is required.`)
  }

  const rawModality = normaliseToken(operation.modality_id)
  if (rawModality === 'lesion_directed_procedure') {
    errors.push(
      `${label}.modality_id cannot be generic 'lesion_directed_procedure'; use electrocautery_or_rf.`,
    )
  }
  const modalityId = canonicalModality(operation.modality_id)
  operation.modality_id = modalityId

  if (!modalityId || !getExecutionRegistry(config, modalityId)) {
    errors.push(`${label}.modality_id '${operation.modality_id}' is not a configured modality.`)
    return null
  }

  const linkedComponentIds = unique(asArray(operation.linked_component_ids))
  const linkedGroupIds = unique(asArray(operation.linked_group_ids))
  if (linkedComponentIds.length === 0) {
    errors.push(`${label}.linked_component_ids must contain at least one component.`)
  }
  if (PROCEDURAL_MODALITIES.has(modalityId) && linkedGroupIds.length === 0) {
    errors.push(`${label}.linked_group_ids must contain at least one target group.`)
  }

  const unknownComponents = linkedComponentIds.filter((id) => !allComponentIds.has(id))
  if (unknownComponents.length > 0) {
    errors.push(
      `${label}.linked_component_ids contains unknown IDs: ${unknownComponents.join(', ')}.`,
    )
  }
  const unknownGroups = linkedGroupIds.filter((id) => !allGroupIds.has(id))
  if (allGroupIds.size > 0 && unknownGroups.length > 0) {
    errors.push(`${label}.linked_group_ids contains unknown IDs: ${unknownGroups.join(', ')}.`)
  }

  for (const componentId of linkedComponentIds) {
    const componentPlan = componentById.get(componentId)
    const diagnosisComponent = diagnosisById.get(componentId)
    const permittedGroups = unique([
      ...asArray(componentPlan?.linked_group_ids),
      ...asArray(diagnosisComponent?.linked_group_ids),
    ])
    if (permittedGroups.length > 0 && !linkedGroupIds.some((id) => permittedGroups.includes(id))) {
      errors.push(
        `${label}: operation does not target any group linked to component '${componentId}'.`,
      )
    }

    const baseLocation =
      componentPlan?.clinical_location_text || diagnosisComponent?.clinical_location_text
    if (
      PROCEDURAL_MODALITIES.has(modalityId) &&
      !locationContainsBase(operation.target_location_text, baseLocation)
    ) {
      errors.push(
        `${label}.target_location_text must preserve the validated location for component '${componentId}'.`,
      )
    }
    if (
      normaliseToken(operation.role) === 'primary' &&
      componentPlan?.selected_modality_id &&
      canonicalModality(componentPlan.selected_modality_id) !== modalityId
    ) {
      errors.push(
        `${label}: primary operation modality '${modalityId}' does not match component '${componentId}' selected modality ` +
          `'${componentPlan.selected_modality_id}'.`,
      )
    }
    if (
      normaliseToken(operation.role) === 'primary' &&
      isNonEmptyString(componentPlan?.selected_protocol_id) &&
      isNonEmptyString(operation.protocol_id) &&
      componentPlan.selected_protocol_id !== operation.protocol_id
    ) {
      errors.push(
        `${label}: primary operation protocol '${operation.protocol_id}' does not match component '${componentId}' ` +
          `selected protocol '${componentPlan.selected_protocol_id}'.`,
      )
    }
    if (
      componentPlan &&
      PROCEDURAL_MODALITIES.has(modalityId) &&
      canonicalModality(componentPlan.selected_modality_id) === modalityId &&
      isNonEmptyString(componentPlan.target_location_text) &&
      !locationContainsBase(operation.target_location_text, componentPlan.target_location_text)
    ) {
      errors.push(
        `${label}.target_location_text must preserve the component-specific treatment target instruction.`,
      )
    }
    const requiredExclusions = asArray(componentPlan?.exclude_group_ids)
    const missingComponentExclusions = requiredExclusions.filter(
      (groupId) => !asArray(operation.exclude_group_ids).includes(groupId),
    )
    if (missingComponentExclusions.length > 0) {
      errors.push(
        `${label}.exclude_group_ids omits component-level exclusions: ${missingComponentExclusions.join(', ')}.`,
      )
    }
  }

  if (
    PROCEDURAL_MODALITIES.has(modalityId) &&
    !isPreciseLocationText(operation.target_location_text, config)
  ) {
    errors.push(`${label}.target_location_text is absent or insufficiently precise.`)
  }
  if (!Array.isArray(operation.exclude_group_ids)) {
    errors.push(`${label}.exclude_group_ids must be an array.`)
  }
  const overlap = asArray(operation.exclude_group_ids).filter((id) => linkedGroupIds.includes(id))
  if (overlap.length > 0) {
    errors.push(`${label}.exclude_group_ids overlaps target groups: ${overlap.join(', ')}.`)
  }
  const unknownExclusions = asArray(operation.exclude_group_ids).filter(
    (id) => allGroupIds.size > 0 && !allGroupIds.has(id),
  )
  if (unknownExclusions.length > 0) {
    errors.push(`${label}.exclude_group_ids contains unknown IDs: ${unknownExclusions.join(', ')}.`)
  }
  if (PROCEDURAL_MODALITIES.has(modalityId) && !isNonEmptyString(operation.exclusion_instruction)) {
    errors.push(`${label}.exclusion_instruction is required.`)
  }

  const derivedInjury = isInjuryModality(modalityId, config)
  if (operation.injury_producing !== derivedInjury) {
    warnings.push(
      `${label}.injury_producing was corrected from ${String(operation.injury_producing)} to ${String(derivedInjury)} from config.`,
    )
    operation.injury_producing = derivedInjury
  }

  if (
    operation.protocol_parameters_copied_from_config !== true &&
    protocolRequiredForModality(modalityId, config)
  ) {
    errors.push(`${label}.protocol_parameters_copied_from_config must be true.`)
  }

  const protocolRecord = validateProtocolRecord(
    operation.protocol_id,
    modalityId,
    config,
    label,
    errors,
  )

  if (protocolRecord) {
    validateProviderAuthorization(operation, protocolRecord, config, label, errors)
    validateOperationParameters(operation, protocolRecord, config, label, errors)
  } else if (!protocolRequiredForModality(modalityId, config)) {
    validateProviderAuthorization(operation, null, config, label, errors)
  }

  if (derivedInjury) {
    if (asArray(operation.stop_conditions).length === 0) {
      errors.push(`${label}.stop_conditions is required for injury-producing treatment.`)
    }
    if (asArray(operation.aftercare).length === 0) {
      errors.push(`${label}.aftercare is required for injury-producing treatment.`)
    }
  }

  if (!isNonEmptyString(operation.role)) {
    errors.push(`${label}.role is required.`)
  }

  const placeholderPath = containsPlaceholder(operation, label)
  if (placeholderPath) {
    errors.push(`${placeholderPath} contains a placeholder and is not executable.`)
  }

  if (phenotypeGroups.length > 0) {
    validateFlatRaisedTargeting(operation, phenotypeGroups, groupById, label, errors)
  }

  for (const componentId of linkedComponentIds) {
    const diagnosisComponent = diagnosisById.get(componentId)
    const componentPlan = componentById.get(componentId)
    const family = diagnosisComponent?.family
    const subtype = diagnosisComponent?.subtype || 'any'
    const entry = resolveProtocolMapEntry(config, family, subtype)
    const departure = componentPlan?.hierarchy_departure || {}

    if (!modalityEligibleForEntry(modalityId, entry, config) && derivedInjury) {
      if (
        departure.occurred !== true ||
        departure.doctor_confirmation_required !== true ||
        !isNonEmptyString(departure.case_specific_reason)
      ) {
        errors.push(
          `${label}: modality '${modalityId}' is not eligible for component '${componentId}' ` +
            `(${family}:${subtype}) without a documented hierarchy departure.`,
        )
      }
    }
    if (
      protocolRecord &&
      derivedInjury &&
      collectEligibleProtocolIds(entry).length > 0 &&
      !protocolEligibleForEntry(operation.protocol_id, entry)
    ) {
      if (
        departure.occurred !== true ||
        departure.doctor_confirmation_required !== true ||
        !isNonEmptyString(departure.case_specific_reason)
      ) {
        errors.push(
          `${label}: protocol '${operation.protocol_id}' is not eligible for component '${componentId}' ` +
            `without a documented hierarchy departure.`,
        )
      }
    }

    if (family === 'medically_atypical_focal_lesion' && derivedInjury) {
      errors.push(
        `${label}: medically atypical focal lesions cannot receive cosmetic injury treatment.`,
      )
    }
    if (diagnosisComponent?.inflammation_first_required === true && derivedInjury) {
      errors.push(`${label}: component '${componentId}' requires inflammation control first.`)
    }
    if (diagnosisComponent?.barrier_repair_first_required === true && derivedInjury) {
      errors.push(`${label}: component '${componentId}' requires barrier repair first.`)
    }
    if (
      family === 'periocular_hyperpigmentation' &&
      subtype === 'structural_shadow_dominant' &&
      derivedInjury
    ) {
      errors.push(
        `${label}: structural-shadow-dominant periocular component cannot receive pigment injury.`,
      )
    }
  }

  return { modalityId, injury: derivedInjury, protocolRecord }
}

function validateExecutionSequence(session, operations, config, sessionLabel, errors) {
  const steps = asArray(session?.session_execution_sequence)
  if (steps.length === 0) {
    errors.push(`${sessionLabel}.session_execution_sequence is required.`)
    return { canonicalStepTypes: [], stepsByOperation: new Map() }
  }

  const operationById = new Map(operations.map((operation) => [operation.operation_id, operation]))
  const stepsByOperation = new Map()
  const canonicalStepTypes = []
  const stepNumbers = []

  steps.forEach((step, index) => {
    const label = `${sessionLabel}.session_execution_sequence[${index}]`
    if (!isObject(step)) {
      errors.push(`${label} must be an object.`)
      return
    }
    if (!isPositiveInteger(step.step_number)) {
      errors.push(`${label}.step_number must be a positive integer.`)
    } else {
      stepNumbers.push(step.step_number)
    }

    const operation = isNonEmptyString(step.operation_id)
      ? operationById.get(step.operation_id)
      : null
    if (isNonEmptyString(step.operation_id) && !operation) {
      errors.push(`${label}.operation_id '${step.operation_id}' does not exist in this session.`)
    }

    const canonical = canonicalStepType(step.step_type, operation, config)
    step.canonical_step_type = canonical
    canonicalStepTypes.push(canonical)

    const allowed = new Set(
      asArray(config?.provider_protocol_contract?.execution_step_types).map(normaliseToken),
    )
    if (allowed.size > 0 && !allowed.has(canonical)) {
      errors.push(`${label}.step_type '${step.step_type}' resolves to unsupported '${canonical}'.`)
    }

    const procedureLike = [
      'chemical_peel',
      'neutralize_peel',
      'q_switch',
      'focal_laser',
      'microneedling',
      'apply_active',
      'electrocautery_or_rf',
      'led',
      'cooling',
    ].includes(canonical)
    if (procedureLike && !operation) {
      errors.push(
        `${label}: procedure-specific step '${canonical}' must link a valid operation_id.`,
      )
    }

    if (operation) {
      if (!stepsByOperation.has(operation.operation_id))
        stepsByOperation.set(operation.operation_id, [])
      stepsByOperation.get(operation.operation_id).push(canonical)

      if (isNonEmptyString(step.protocol_id) && step.protocol_id !== operation.protocol_id) {
        errors.push(`${label}.protocol_id must equal the linked operation protocol_id.`)
      }
      if (
        procedureLike &&
        !isNonEmptyString(step.protocol_id) &&
        isNonEmptyString(operation.protocol_id)
      ) {
        errors.push(`${label}.protocol_id is required for a protocol-driven step.`)
      }
      if (
        procedureLike &&
        isPreciseLocationText(operation.target_location_text, config) &&
        !locationContainsBase(step.target_location_text, operation.target_location_text)
      ) {
        errors.push(`${label}.target_location_text must copy the linked operation target location.`)
      }
    }

    if (!isNonEmptyString(step.instruction)) {
      errors.push(`${label}.instruction is required.`)
    }
    if (step.completion_required !== true) {
      errors.push(`${label}.completion_required must be true.`)
    }
    const placeholderPath = containsPlaceholder(step, label)
    if (placeholderPath) errors.push(`${placeholderPath} contains a placeholder.`)
  })

  const expectedNumbers = Array.from({ length: steps.length }, (_, index) => index + 1)
  if (
    !sameSet(stepNumbers, expectedNumbers) ||
    stepNumbers.some((number, index) => number !== index + 1)
  ) {
    errors.push(
      `${sessionLabel}.session_execution_sequence step_number values must be contiguous and ordered from 1.`,
    )
  }

  for (const operation of operations) {
    const operationSteps = stepsByOperation.get(operation.operation_id) || []
    if (operationSteps.length === 0) {
      errors.push(
        `${sessionLabel}: operation '${operation.operation_id}' has no linked execution step.`,
      )
      continue
    }
    for (const requiredStep of getRequiredSteps(operation.modality_id, config)) {
      if (!operationSteps.includes(requiredStep)) {
        errors.push(
          `${sessionLabel}: operation '${operation.operation_id}' (${operation.modality_id}) requires linked step '${requiredStep}'.`,
        )
      }
    }

    const protocol = findProtocol(config, operation.protocol_id)?.protocol
    if (
      operation.modality_id === 'chemical_peel' &&
      protocol?.neutralization_required === true &&
      !operationSteps.includes('neutralize_peel')
    ) {
      errors.push(
        `${sessionLabel}: peel operation '${operation.operation_id}' requires neutralize_peel step.`,
      )
    }
  }

  const hasInjury = operations.some((operation) => isInjuryModality(operation.modality_id, config))
  if (hasInjury && !canonicalStepTypes.includes('sunscreen')) {
    errors.push(`${sessionLabel}: an injury-producing session requires a sunscreen step.`)
  }
  if (hasInjury && !canonicalStepTypes.includes('homecare_handover')) {
    errors.push(`${sessionLabel}: an injury-producing session requires a homecare_handover step.`)
  }
  if (canonicalStepTypes.includes('numbing') && !canonicalStepTypes.includes('remove_numbing')) {
    errors.push(`${sessionLabel}: numbing requires a remove_numbing step.`)
  }

  return { canonicalStepTypes, stepsByOperation }
}

function validateSession(
  session,
  sessionIndex,
  config,
  componentById,
  diagnosisById,
  phenotypeGroups,
  groupById,
  allComponentIds,
  allGroupIds,
  errors,
  warnings,
) {
  const number = session?.session_number ?? sessionIndex + 1
  const sessionLabel = `current_treatment_block.sessions[${sessionIndex}] (Session ${number})`
  if (!isPositiveInteger(number))
    errors.push(`${sessionLabel}.session_number must be a positive integer.`)

  const operations = asArray(session?.treatment_operations)
  if (operations.length === 0) {
    errors.push(`${sessionLabel}.treatment_operations must contain at least one operation.`)
  }
  const operationIds = operations.map((operation) => operation?.operation_id).filter(Boolean)
  for (const duplicate of duplicates(operationIds)) {
    errors.push(`${sessionLabel} contains duplicate operation_id '${duplicate}'.`)
  }

  const operationResults = operations
    .map((operation, index) =>
      validateOperation(
        operation,
        sessionLabel,
        index,
        config,
        componentById,
        diagnosisById,
        phenotypeGroups,
        groupById,
        allComponentIds,
        allGroupIds,
        errors,
        warnings,
      ),
    )
    .filter(Boolean)

  const derivedModalities = unique(operationResults.map((result) => result.modalityId))
  const derivedInjury = unique(
    operationResults.filter((result) => result.injury).map((result) => result.modalityId),
  )
  const derivedComponents = unique(
    operations.flatMap((operation) => asArray(operation.linked_component_ids)),
  )

  const declaredModalities = unique(asArray(session?.selected_modality_ids).map(canonicalModality))
  if (!sameSet(declaredModalities, derivedModalities)) {
    warnings.push(
      `${sessionLabel}.selected_modality_ids was replaced with deterministic operation-derived values.`,
    )
    session.selected_modality_ids = derivedModalities
  }

  const declaredInjury = unique(
    asArray(session?.injury_producing_modality_ids).map(canonicalModality),
  )
  if (!sameSet(declaredInjury, derivedInjury)) {
    warnings.push(
      `${sessionLabel}.injury_producing_modality_ids was replaced with deterministic operation-derived values.`,
    )
    session.injury_producing_modality_ids = derivedInjury
  }

  const declaredComponents = unique(asArray(session?.linked_component_ids))
  if (!sameSet(declaredComponents, derivedComponents)) {
    warnings.push(
      `${sessionLabel}.linked_component_ids was replaced with operation-derived values.`,
    )
    session.linked_component_ids = derivedComponents
  }

  const maxInjury =
    config?.session_compatibility_matrix?.maximum_injury_modality_types_per_session_from_policy ||
    DEFAULT_MAX_INJURY_MODALITIES
  if (derivedInjury.length > maxInjury) {
    errors.push(
      `${sessionLabel}: ${derivedInjury.length} injury modality types exceed maximum ${maxInjury}: ${derivedInjury.join(', ')}.`,
    )
  }

  let compatibilityPassed = true
  for (let first = 0; first < derivedModalities.length; first += 1) {
    for (let second = first + 1; second < derivedModalities.length; second += 1) {
      const a = derivedModalities[first]
      const b = derivedModalities[second]
      const compatibility = getCompatibility(config, a, b)
      if (['not_compatible_same_day', 'not_compatible'].includes(compatibility)) {
        compatibilityPassed = false
        errors.push(`${sessionLabel}: ${a} + ${b} are not compatible in the same session.`)
      } else if (compatibility === 'prefer_separate_session') {
        warnings.push(`${sessionLabel}: config prefers separate sessions for ${a} + ${b}.`)
      } else if (isNonEmptyString(compatibility) && compatibility.startsWith('conditional')) {
        warnings.push(`${sessionLabel}: ${a} + ${b} require protocol-specific doctor confirmation.`)
      }
    }
  }
  session.same_session_compatibility_confirmed_from_config = compatibilityPassed

  const executionValidation = validateExecutionSequence(
    session,
    operations,
    config,
    sessionLabel,
    errors,
    warnings,
  )

  const laserOperations = operations.filter((operation) =>
    ['q_switch_laser', 'focal_laser'].includes(operation.modality_id),
  )
  const distinctWavelengths = unique(
    laserOperations.map((operation) => operation?.parameters?.wavelength_nm).filter(isFiniteNumber),
  )
  const maxStrategies = config?.q_switch?.optimizer?.max_distinct_wavelength_strategies_per_session
  if (isFiniteNumber(maxStrategies) && distinctWavelengths.length > maxStrategies) {
    errors.push(
      `${sessionLabel}: ${distinctWavelengths.length} wavelength strategies exceed configured maximum ${maxStrategies}.`,
    )
  }

  if (!isNonEmptyString(session?.provider_checkpoint)) {
    errors.push(`${sessionLabel}.provider_checkpoint is required.`)
  }

  session.deterministic_protocol_validation = {
    validator_version: PLAN_VERSION,
    selected_modality_ids: derivedModalities,
    injury_producing_modality_ids: derivedInjury,
    operation_ids: operationIds,
    canonical_execution_step_types: executionValidation.canonicalStepTypes,
    injury_modality_limit_passed: derivedInjury.length <= maxInjury,
    same_session_compatibility_passed: compatibilityPassed,
    passed: !errors.some((error) => error.startsWith(sessionLabel)),
    validation_source: 'deterministic_application_validator',
  }

  return {
    sessionNumber: number,
    modalities: derivedModalities,
    injuryModalities: derivedInjury,
    componentIds: derivedComponents,
    operationIds,
  }
}

function validateRoadmap(plan, config, componentById, diagnosisById, errors) {
  const roadmap = plan?.master_treatment_roadmap
  if (!isObject(roadmap)) {
    errors.push('master_treatment_roadmap is required.')
    return
  }

  if (!isPositiveInteger(roadmap.expected_total_sessions)) {
    errors.push('master_treatment_roadmap.expected_total_sessions must be a positive integer.')
    return
  }

  const actualCurrent = getCurrentSessions(plan).map((session) => session?.session_number)
  const actualFuture = getFutureSessions(plan)
    .filter((session) => normaliseToken(session?.base_case_or_contingency) !== 'contingency')
    .map((session) => session?.session_number)
  const declaredCurrent = asArray(roadmap.current_detailed_session_numbers)
  const declaredFuture = asArray(roadmap.future_provisional_session_numbers)

  if (!sameSet(actualCurrent, declaredCurrent)) {
    errors.push(
      'master_treatment_roadmap.current_detailed_session_numbers must exactly match current block sessions.',
    )
  }
  if (!sameSet(actualFuture, declaredFuture)) {
    errors.push(
      'master_treatment_roadmap.future_provisional_session_numbers must exactly match future base-case sessions.',
    )
  }

  const allNumbers = [...actualCurrent, ...actualFuture]
  if (duplicates(allNumbers).length > 0) {
    errors.push(
      `Base-case roadmap contains duplicate session numbers: ${duplicates(allNumbers).join(', ')}.`,
    )
  }
  if (allNumbers.length !== roadmap.expected_total_sessions) {
    errors.push(
      `Base-case session count ${allNumbers.length} does not equal expected_total_sessions ${roadmap.expected_total_sessions}.`,
    )
  }
  const expectedNumbers = Array.from(
    { length: roadmap.expected_total_sessions },
    (_, index) => index + 1,
  )
  if (!sameSet(allNumbers, expectedNumbers)) {
    errors.push(
      `Base-case sessions must form a complete 1-${roadmap.expected_total_sessions} sequence.`,
    )
  }

  if (!isPositiveInteger(roadmap.next_formal_reassessment_after_session)) {
    errors.push(
      'master_treatment_roadmap.next_formal_reassessment_after_session must be a positive integer.',
    )
  } else if (!actualCurrent.includes(roadmap.next_formal_reassessment_after_session)) {
    errors.push('next_formal_reassessment_after_session must refer to a current detailed session.')
  }

  const allComponentIds = new Set([...componentById.keys(), ...diagnosisById.keys()])
  getFutureSessions(plan).forEach((session, index) => {
    const label = `future_provisional_sessions[${index}]`
    if (!isPositiveInteger(session?.session_number))
      errors.push(`${label}.session_number must be positive integer.`)
    const unknownComponents = asArray(session?.linked_component_ids).filter(
      (id) => !allComponentIds.has(id),
    )
    if (unknownComponents.length > 0)
      errors.push(`${label} references unknown components: ${unknownComponents.join(', ')}.`)
    if (!isPreciseLocationText(session?.target_location_text, config)) {
      errors.push(`${label}.target_location_text is absent or not anatomically precise.`)
    }
    const modality = canonicalModality(session?.primary_modality_category)
    if (
      modality &&
      getExecutionRegistry(config, modality) &&
      isNonEmptyString(session?.likely_protocol_id)
    ) {
      validateProtocolRecord(session.likely_protocol_id, modality, config, label, errors)
    }
    if (!['base_case', 'contingency'].includes(normaliseToken(session?.base_case_or_contingency))) {
      errors.push(`${label}.base_case_or_contingency must be base_case or contingency.`)
    }
  })
}

function validateReassessmentGate(plan, phenotype, errors) {
  const gate = plan?.current_treatment_block?.reassessment_gate
  if (!isObject(gate)) {
    errors.push('current_treatment_block.reassessment_gate is required.')
    return
  }
  const roadmapAfter = plan?.master_treatment_roadmap?.next_formal_reassessment_after_session
  if (gate.after_session !== roadmapAfter) {
    errors.push(
      'reassessment_gate.after_session must match roadmap next_formal_reassessment_after_session.',
    )
  }
  const requiredModes = ['white', 'surface_polarized', 'subsurface_polarized', 'red', 'woods_uv']
  if (!sameSet(asArray(gate.required_images).map(normaliseToken), requiredModes)) {
    errors.push(
      'reassessment_gate.required_images must contain all five required imaging modes exactly once.',
    )
  }
  if (asArray(gate.component_and_group_outcomes_to_measure).length === 0) {
    errors.push('reassessment_gate.component_and_group_outcomes_to_measure cannot be empty.')
  }
  if (asArray(gate.decision_rules).length === 0) {
    errors.push('reassessment_gate.decision_rules cannot be empty.')
  }

  const groupIds = getMorphologyGroups(phenotype).map((group) => group?.group_id)
  if (groupIds.length > 0) {
    const outcomeText = normaliseProse(
      asArray(gate.component_and_group_outcomes_to_measure).join(' '),
    )
    const missing = groupIds.filter((id) => !outcomeText.includes(normaliseProse(id)))
    if (missing.length > 0) {
      errors.push(
        `reassessment_gate must explicitly retain every baseline morphology group; missing in outcome descriptions: ${missing.join(', ')}.`,
      )
    }
  }
}

function validateExpectedOutcomes(plan, componentById, errors) {
  const outcomes = asArray(plan?.expected_outcomes?.component_specific)
  if (outcomes.length === 0) {
    errors.push('expected_outcomes.component_specific is required.')
    return
  }
  const ids = outcomes.map((outcome) => outcome?.diagnostic_component_id).filter(Boolean)
  const expected = [...componentById.keys()]
  if (!sameSet(ids, expected)) {
    errors.push('expected_outcomes.component_specific must contain one entry for every component.')
  }
  outcomes.forEach((outcome, index) => {
    const label = `expected_outcomes.component_specific[${index}]`
    const component = componentById.get(outcome?.diagnostic_component_id)
    if (
      component &&
      normaliseProse(outcome.clinical_location_text) !==
        normaliseProse(component.clinical_location_text)
    ) {
      errors.push(`${label}.clinical_location_text must copy component location unchanged.`)
    }
    if (!IMMUTABLE_METRIC_KEYS.includes(outcome?.measurement_to_repeat)) {
      errors.push(`${label}.measurement_to_repeat must be one of the six phenotype metrics.`)
    }
  })
}

function validateSafetyAndApproval(plan, diagnosis, errors) {
  const safety = plan?.safety_and_doctor_approval
  if (!isObject(safety)) {
    errors.push('safety_and_doctor_approval is required.')
    return
  }
  if (safety.doctor_confirmation_required !== true) {
    errors.push('safety_and_doctor_approval.doctor_confirmation_required must be true.')
  }

  const requiredCloseup = getDiagnosisComponents(diagnosis)
    .filter((component) =>
      ['hold_until_closeup', 'hold_until_doctor_assessment'].includes(
        normaliseToken(component?.direct_cosmetic_treatment_status),
      ),
    )
    .map((component) => component.diagnostic_component_id)
  const declared = asArray(safety.components_requiring_closeup_or_direct_exam)
  const missing = requiredCloseup.filter((id) => !declared.includes(id))
  if (missing.length > 0) {
    errors.push(
      `safety_and_doctor_approval omits components requiring direct review: ${missing.join(', ')}.`,
    )
  }
  if (asArray(safety.pre_session_checks).length === 0) {
    errors.push('safety_and_doctor_approval.pre_session_checks cannot be empty.')
  }
}

function validateLaserOptimizer(plan, sessions, componentById, errors) {
  const optimizer = plan?.q_switch_optimizer || plan?.laser_optimizer
  if (!optimizer || optimizer.used !== true) return

  const usedFor = unique(asArray(optimizer.used_for_component_ids))
  if (usedFor.length === 0) {
    errors.push('Laser optimizer used=true requires used_for_component_ids.')
  }
  const laserComponents = new Set(
    sessions
      .flatMap((session) => asArray(session?.treatment_operations))
      .filter((operation) =>
        ['q_switch_laser', 'focal_laser'].includes(canonicalModality(operation?.modality_id)),
      )
      .flatMap((operation) => asArray(operation.linked_component_ids)),
  )
  const invalid = usedFor.filter((id) => !laserComponents.has(id))
  if (invalid.length > 0) {
    errors.push(
      `Laser optimizer references components without selected laser operations: ${invalid.join(', ')}.`,
    )
  }
  const unknown = usedFor.filter((id) => !componentById.has(id))
  if (unknown.length > 0)
    errors.push(`Laser optimizer references unknown components: ${unknown.join(', ')}.`)
}

function validateComponentScheduling(plan, componentById, config, errors) {
  const currentOperations = getCurrentSessions(plan).flatMap((session) =>
    asArray(session?.treatment_operations).map((operation) => ({
      componentIds: asArray(operation?.linked_component_ids),
      modalityId: canonicalModality(operation?.modality_id),
      protocolId: operation?.protocol_id,
    })),
  )
  const future = getFutureSessions(plan).map((session) => ({
    componentIds: asArray(session?.linked_component_ids),
    modalityId: canonicalModality(session?.primary_modality_category),
    protocolId: session?.likely_protocol_id,
  }))
  const scheduled = [...currentOperations, ...future]

  for (const [componentId, component] of componentById.entries()) {
    if (normaliseToken(component?.treatment_eligibility) !== 'eligible') continue
    const selectedModality = canonicalModality(component?.selected_modality_id)
    if (!selectedModality || NON_PROCEDURAL_MODALITIES.has(selectedModality)) continue
    const selectedProtocol = component?.selected_protocol_id
    const found = scheduled.some(
      (entry) =>
        entry.componentIds.includes(componentId) &&
        entry.modalityId === selectedModality &&
        (!isNonEmptyString(selectedProtocol) || entry.protocolId === selectedProtocol),
    )
    if (!found) {
      errors.push(
        `Component '${componentId}' selects ${selectedModality}` +
          `${selectedProtocol ? ` / ${selectedProtocol}` : ''} but no current or future base-case session schedules it.`,
      )
    }
  }
}

function validateHomecarePlan(plan, componentById, errors) {
  const homecare = plan?.homecare_plan
  if (!isObject(homecare)) {
    errors.push('homecare_plan is required.')
    return
  }
  if (asArray(homecare.morning).length === 0) errors.push('homecare_plan.morning cannot be empty.')
  if (asArray(homecare.evening).length === 0) errors.push('homecare_plan.evening cannot be empty.')
  if (asArray(homecare.sun_and_heat_control).length === 0) {
    errors.push('homecare_plan.sun_and_heat_control cannot be empty.')
  }

  const instructions = asArray(homecare.component_specific_instructions)
  const covered = unique(instructions.flatMap((item) => asArray(item?.linked_component_ids)))
  const missing = [...componentById.keys()].filter((id) => !covered.includes(id))
  if (missing.length > 0) {
    errors.push(
      `homecare_plan.component_specific_instructions omits components: ${missing.join(', ')}.`,
    )
  }
  instructions.forEach((item, index) => {
    const label = `homecare_plan.component_specific_instructions[${index}]`
    const componentId = asArray(item?.linked_component_ids)[0]
    const component = componentById.get(componentId)
    if (
      component &&
      normaliseProse(item.clinical_location_text) !==
        normaliseProse(component.clinical_location_text)
    ) {
      errors.push(`${label}.clinical_location_text must copy the component location unchanged.`)
    }
    if (!isNonEmptyString(item?.instruction)) errors.push(`${label}.instruction is required.`)
  })
}

function validatePolicyTrace(plan, errors) {
  const trace = plan?.policy_trace
  if (!isObject(trace)) {
    errors.push('policy_trace is required.')
    return
  }
  if (trace.policy_version !== plan.policy_version) {
    errors.push('policy_trace.policy_version must match plan.policy_version.')
  }
  if (asArray(trace.rules_applied).length === 0) {
    errors.push('policy_trace.rules_applied cannot be empty.')
  }
  if (!Array.isArray(trace.policy_departures)) {
    errors.push('policy_trace.policy_departures must be an array.')
  }
}

function overwriteModelSelfCheck(plan, errors, derived) {
  plan.protocol_validation_self_check = {
    all_components_considered: derived.allComponentsConsidered,
    all_current_operations_have_exact_protocol_ids: derived.allOperationsHaveProtocols,
    all_operations_have_target_and_exclusion_instructions: derived.allOperationsTargeted,
    all_selected_modalities_appear_in_execution_sequence: derived.allOperationsHaveExecutionSteps,
    maximum_two_injury_modalities_per_session: derived.injuryLimitPassed,
    roadmap_session_count_reconciles: derived.roadmapReconciles,
    passed: errors.length === 0,
    validation_source: 'deterministic_application_validator',
    validator_version: PLAN_VERSION,
  }
}

/**
 * Validate and normalize a Pigmentation Decode V2.3 treatment plan.
 *
 * @param {Record<string, any>} planObj Plan or { linear_treatment_plan: plan }.
 * @param {Record<string, any>} config Full PIGMENTATION_CONFIG V2.3 object.
 * @param {{
 *   throwOnError?: boolean,
 *   diagnosis?: Record<string, any> | null,
 *   phenotype?: Record<string, any> | null,
 * }} options
 * @returns {{valid: boolean, errors: string[], warnings: string[], normalized_plan: any, derived: any}}
 */
export function validatePigmentationPlan(planObj, config, options = {}) {
  const {
    throwOnError = true,
    diagnosis: diagnosisInput = null,
    phenotype: phenotypeInput = null,
  } = options

  const errors = []
  const warnings = []
  const plan = unwrapPlan(planObj)
  const diagnosis = unwrapDiagnosis(diagnosisInput)
  const phenotype = unwrapPhenotype(phenotypeInput)

  if (!isObject(plan)) {
    const result = validationResult(
      ['Plan object is null, undefined, an array or not an object.'],
      warnings,
      plan,
      {},
    )
    if (throwOnError) throw new PigmentationPlanValidationError(result)
    return result
  }
  if (!isObject(config)) {
    const result = validationResult(
      ['PIGMENTATION_CONFIG was not supplied to validatePigmentationPlan().'],
      warnings,
      plan,
      {},
    )
    if (throwOnError) throw new PigmentationPlanValidationError(result)
    return result
  }

  validateVersionMetadata(plan, config, errors, warnings)
  validateBlockedPlan(plan, diagnosis, errors)

  const planStatus = normaliseToken(plan.plan_status)
  if (
    ![
      'ai_generated_pending_doctor_review',
      'blocked',
      'doctor_approved',
      'doctor_modified',
    ].includes(planStatus)
  ) {
    errors.push(`plan_status '${plan.plan_status}' is invalid.`)
  }

  validateBaseline(plan, diagnosis, phenotype, errors)
  const { componentById, diagnosisById } = validateComponentTreatmentMap(
    plan,
    config,
    diagnosis,
    phenotype,
    errors,
    warnings,
  )

  const phenotypeGroups = getMorphologyGroups(phenotype)
  const groupById = new Map(phenotypeGroups.map((group) => [group?.group_id, group]))
  const allComponentIds = new Set([
    ...componentById.keys(),
    ...diagnosisById.keys(),
    ...asArray(plan?.baseline_summary?.diagnostic_component_ids),
  ])
  const allGroupIds = new Set([
    ...groupById.keys(),
    ...asArray(plan?.baseline_summary?.morphology_group_ids),
  ])

  const sessions = getCurrentSessions(plan)
  const sessionResults = []
  if (planStatus !== 'blocked' && sessions.length === 0) {
    errors.push('An active plan requires at least one current detailed session.')
  }

  const sessionNumbers = sessions.map((session) => session?.session_number)
  for (const duplicate of duplicates(sessionNumbers)) {
    errors.push(
      `current_treatment_block.sessions contains duplicate session_number '${duplicate}'.`,
    )
  }

  sessions.forEach((session, index) => {
    sessionResults.push(
      validateSession(
        session,
        index,
        config,
        componentById,
        diagnosisById,
        phenotypeGroups,
        groupById,
        allComponentIds,
        allGroupIds,
        errors,
        warnings,
      ),
    )
  })

  if (planStatus !== 'blocked') {
    validateRoadmap(plan, config, componentById, diagnosisById, errors)
    validateReassessmentGate(plan, phenotype, errors)
    validateExpectedOutcomes(plan, componentById, errors)
    validateSafetyAndApproval(plan, diagnosis, errors)
    validateLaserOptimizer(plan, sessions, componentById, errors)
    validateComponentScheduling(plan, componentById, config, errors)
    validateHomecarePlan(plan, componentById, errors)
    validatePolicyTrace(plan, errors)
  }

  const operations = sessions.flatMap((session) => asArray(session?.treatment_operations))
  const operationIds = operations.map((operation) => operation?.operation_id).filter(Boolean)
  for (const duplicate of duplicates(operationIds)) {
    errors.push(
      `operation_id '${duplicate}' is duplicated across current sessions; operation IDs must be globally unique.`,
    )
  }

  const componentIdsInMap = [...componentById.keys()]
  const diagnosisIds = [...diagnosisById.keys()]
  const derived = {
    allComponentsConsidered:
      diagnosisIds.length === 0
        ? componentIdsInMap.length > 0
        : sameSet(componentIdsInMap, diagnosisIds),
    allOperationsHaveProtocols: operations.every((operation) =>
      protocolRequiredForModality(canonicalModality(operation?.modality_id), config)
        ? isNonEmptyString(operation?.protocol_id) &&
          Boolean(findProtocol(config, operation.protocol_id))
        : true,
    ),
    allOperationsTargeted: operations.every(
      (operation) =>
        !PROCEDURAL_MODALITIES.has(canonicalModality(operation?.modality_id)) ||
        (isPreciseLocationText(operation?.target_location_text, config) &&
          Array.isArray(operation?.exclude_group_ids) &&
          isNonEmptyString(operation?.exclusion_instruction)),
    ),
    allOperationsHaveExecutionSteps: operations.every((operation) =>
      sessions.some((session) =>
        asArray(session?.session_execution_sequence).some(
          (step) => step?.operation_id === operation?.operation_id,
        ),
      ),
    ),
    injuryLimitPassed: sessionResults.every(
      (result) =>
        asArray(result?.injuryModalities).length <=
        (config?.session_compatibility_matrix
          ?.maximum_injury_modality_types_per_session_from_policy || DEFAULT_MAX_INJURY_MODALITIES),
    ),
    roadmapReconciles: !errors.some((error) =>
      /roadmap|base-case session count|Base-case sessions/.test(error),
    ),
    session_summaries: sessionResults,
  }

  overwriteModelSelfCheck(plan, errors, derived)

  const result = validationResult(errors, warnings, plan, derived)
  if (!result.valid && throwOnError) {
    throw new PigmentationPlanValidationError(result)
  }
  return result
}

/**
 * Convenience non-throwing validator for test harnesses and UI previews.
 */
export function inspectPigmentationPlan(planObj, config, options = {}) {
  return validatePigmentationPlan(planObj, config, { ...options, throwOnError: false })
}

export default validatePigmentationPlan
