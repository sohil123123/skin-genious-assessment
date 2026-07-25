/**
 * Pigmentation Decode V2.4 lean phenotype and diagnosis validation.
 *
 * Principles:
 * - The model supplies visual observations and measurement primitives.
 * - Application code calculates authoritative scores.
 * - Only structural or clinically material contradictions reject a response.
 * - Minor wording/format differences become warnings, not expensive full-stage retries.
 */

import {
  calculatePigmentationBurdenIndex,
  pigmentationSeverityLabel as configPigmentationSeverityLabel,
} from 'src/services/pigmentationConfigV2'

const METRIC_KEYS = [
  'global_background_melanin_load_index',
  'global_background_erythema_load_index',
  'active_inflammatory_lesion_burden_index',
  'flat_focal_pigmented_lesion_burden_index',
  'raised_pigmented_lesion_burden_index',
  'structural_periocular_shadow_burden_index',
]

const CATEGORY_TO_METRIC = {
  global_background_melanin: 'global_background_melanin_load_index',
  global_background_erythema: 'global_background_erythema_load_index',
  active_inflammatory_lesion: 'active_inflammatory_lesion_burden_index',
  flat_focal_pigmented_lesion: 'flat_focal_pigmented_lesion_burden_index',
  raised_pigmented_lesion: 'raised_pigmented_lesion_burden_index',
  structural_periocular_shadow: 'structural_periocular_shadow_burden_index',
}

const PROFILE_PRIMITIVES = {
  global_background_melanin_load_index: [
    'coverage_100',
    'contrast_or_relative_intensity_100',
    'cross_mode_corroboration_100',
    'regional_clinical_salience_100',
  ],
  global_background_erythema_load_index: [
    'coverage_100',
    'contrast_or_relative_intensity_100',
    'cross_mode_corroboration_100',
    'regional_clinical_salience_100',
  ],
  flat_focal_pigmented_lesion_burden_index: [
    'lesion_count_or_density_100',
    'cumulative_lesion_area_100',
    'contrast_or_relative_intensity_100',
    'cross_mode_corroboration_100',
    'treatment_salience_100',
  ],
  raised_pigmented_lesion_burden_index: [
    'lesion_count_or_density_100',
    'elevation_certainty_100',
    'surface_prominence_100',
    'distribution_extent_100',
    'treatment_salience_100',
  ],
  active_inflammatory_lesion_burden_index: [
    'lesion_count_or_density_100',
    'inflammatory_intensity_100',
    'distribution_extent_100',
    'cross_mode_corroboration_100',
    'clinical_salience_100',
  ],
  structural_periocular_shadow_burden_index: [
    'regional_extent_100',
    'shadow_gradient_intensity_100',
    'anatomical_contour_corroboration_100',
    'cross_mode_persistence_100',
    'clinical_salience_100',
  ],
}

export class PigmentationValidationError extends Error {
  constructor(message, errors = [], warnings = []) {
    super(message)
    this.name = 'PigmentationValidationError'
    this.errors = errors
    this.warnings = warnings
  }
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function uniqueStrings(values) {
  return [...new Set((Array.isArray(values) ? values : []).filter((v) => typeof v === 'string' && v))]
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

export function pigmentationSeverityLabelV24(score) {
  return configPigmentationSeverityLabel(score)
}

// Backward-compatible export name.
export const pigmentationSeverityLabel = pigmentationSeverityLabelV24

export function assertValidMeasurementPrimitives(primitives, path, metricKey = null) {
  if (!isObject(primitives)) {
    throw new PigmentationValidationError(`${path} must be an object.`, [`${path} missing.`])
  }

  const keys = PROFILE_PRIMITIVES[metricKey] || Object.keys(primitives)
  const errors = []
  for (const key of keys) {
    const value = primitives[key]
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      errors.push(`${path}.${key} must be a number from 0 to 100.`)
    }
  }

  if (errors.length) {
    throw new PigmentationValidationError('Invalid pigmentation measurement primitives.', errors)
  }
  return true
}

export function finalizeBurdenIndex(rawIndex, path = 'metric', metricKey = null) {
  const score = calculatePigmentationBurdenIndex(
    rawIndex?.measurement_primitives || rawIndex,
    metricKey || path,
  )
  return {
    ...(isObject(rawIndex) ? rawIndex : {}),
    score_100: score,
    severity_label: configPigmentationSeverityLabel(score),
    score_source: 'application_fixed_aggregation_v2_4',
  }
}

function validateGroups(groups, errors, warnings) {
  if (!Array.isArray(groups) || groups.length === 0) {
    errors.push('morphology_groups must contain at least one clinically meaningful group.')
    return new Map()
  }

  const map = new Map()
  groups.forEach((group, index) => {
    const path = `morphology_groups[${index}]`
    if (!isObject(group)) {
      errors.push(`${path} must be an object.`)
      return
    }

    const id = group.group_id
    if (!id || typeof id !== 'string') errors.push(`${path}.group_id is required.`)
    else if (map.has(id)) errors.push(`Duplicate morphology group ID: ${id}.`)
    else map.set(id, group)

    if (isVagueLocation(group.clinical_location_text)) {
      errors.push(`${path}.clinical_location_text must give a doctor-usable anatomical location.`)
    }
    if (!Array.isArray(group.anatomical_regions) || group.anatomical_regions.length === 0) {
      errors.push(`${path}.anatomical_regions must contain at least one region.`)
    }
    if (!group.morphology) errors.push(`${path}.morphology is required.`)
    if (!group.elevation) errors.push(`${path}.elevation is required.`)
    if (!group.burden_category) errors.push(`${path}.burden_category is required.`)
    if (!['present', 'uncertain'].includes(group.presence_status)) {
      errors.push(`${path}.presence_status must be present or uncertain.`)
    }

    if (
      group.burden_category === 'raised_pigmented_lesion' &&
      ['flat', 'probably_flat', 'depressed', 'not_applicable'].includes(group.elevation)
    ) {
      errors.push(`${path} is assigned to raised burden but elevation is ${group.elevation}.`)
    }

    if (
      group.burden_category === 'flat_focal_pigmented_lesion' &&
      ['raised', 'probably_raised'].includes(group.elevation)
    ) {
      errors.push(`${path} is assigned to flat focal burden but elevation is ${group.elevation}.`)
    }

    if (group.patient_side === 'bilateral' && !/bilateral|both|right.+left|left.+right/i.test(group.clinical_location_text || '')) {
      warnings.push(`${path} is bilateral; location text should explicitly mention both sides.`)
    }
  })
  return map
}

function normalizeMetric(rawMetric, metricKey, groupMap, errors, warnings) {
  const metric = isObject(rawMetric) ? clone(rawMetric) : {}
  const path = `metrics.${metricKey}`

  const presence = metric.presence_status
  if (!['present', 'absent', 'uncertain'].includes(presence)) {
    errors.push(`${path}.presence_status must be present, absent or uncertain.`)
  }

  const linkedIds = uniqueStrings(metric.linked_group_ids)
  for (const id of linkedIds) {
    if (!groupMap.has(id)) errors.push(`${path}.linked_group_ids contains unknown group ${id}.`)
  }

  const expectedIds = [...groupMap.values()]
    .filter((group) => CATEGORY_TO_METRIC[group.burden_category] === metricKey)
    .map((group) => group.group_id)

  if (presence === 'absent' && linkedIds.length > 0) {
    errors.push(`${path} is absent but contains linked groups.`)
  }

  const localizedMetric = ![
    'global_background_melanin_load_index',
    'global_background_erythema_load_index',
  ].includes(metricKey)
  if (localizedMetric && presence !== 'absent' && linkedIds.length === 0) {
    errors.push(`${path} is ${presence} but has no linked morphology group.`)
  }

  if (expectedIds.length > 0 && presence === 'absent') {
    errors.push(`${path} is absent although matching morphology groups are present.`)
  }

  for (const id of expectedIds) {
    if (!linkedIds.includes(id)) {
      errors.push(`${path} does not link matching morphology group ${id}.`)
    }
  }

  if (expectedIds.length === 0 && linkedIds.length > 0) {
    warnings.push(`${path} links groups whose burden_category does not map to this metric.`)
  }

  try {
    assertValidMeasurementPrimitives(metric.measurement_primitives, path, metricKey)
  } catch (error) {
    errors.push(...(error.errors || [error.message]))
  }

  let score = 1
  if (errors.every((entry) => !entry.startsWith(path))) {
    score = calculatePigmentationBurdenIndex(metric.measurement_primitives, metricKey)
  }

  return {
    ...metric,
    linked_group_ids: linkedIds,
    score_100: score,
    severity_label: configPigmentationSeverityLabel(score),
    score_source: 'application_fixed_aggregation_v2_4',
  }
}

function buildLegacyMetricViews(validated) {
  const metrics = validated.metrics
  const profile = validated.background_profile || {}

  validated.global_background_indices = {
    melanin_load_index: metrics.global_background_melanin_load_index,
    erythema_load_index: metrics.global_background_erythema_load_index,
    estimated_fitzpatrick: profile.estimated_fitzpatrick || { type: 'uncertain', confidence_100: 0 },
    composition: profile.composition || {
      type: 'uncertain',
      melanin_percent: null,
      vascular_percent: null,
      confidence_100: 0,
    },
    depth_call: profile.depth_call || { type: 'uncertain', confidence_100: 0, basis: [] },
  }

  validated.localized_burden_indices = {
    active_inflammatory_lesion_burden_index:
      metrics.active_inflammatory_lesion_burden_index,
    flat_focal_pigmented_lesion_burden_index:
      metrics.flat_focal_pigmented_lesion_burden_index,
    raised_pigmented_lesion_burden_index:
      metrics.raised_pigmented_lesion_burden_index,
    structural_periocular_shadow_burden_index:
      metrics.structural_periocular_shadow_burden_index,
  }

  return validated
}

export function validateAndScorePigmentationImageAnalysis(raw, metadata = {}) {
  const errors = []
  const warnings = []

  if (!isObject(raw)) {
    throw new PigmentationValidationError('Pigmentation image analysis must be an object.', [
      'Response was not a JSON object.',
    ])
  }

  const validated = clone(raw)
  const groupMap = validateGroups(validated.morphology_groups, errors, warnings)
  const rawMetrics = validated.metrics || {
    global_background_melanin_load_index:
      validated.global_background_indices?.melanin_load_index,
    global_background_erythema_load_index:
      validated.global_background_indices?.erythema_load_index,
    ...validated.localized_burden_indices,
  }

  validated.metrics = {}
  for (const metricKey of METRIC_KEYS) {
    validated.metrics[metricKey] = normalizeMetric(
      rawMetrics?.[metricKey],
      metricKey,
      groupMap,
      errors,
      warnings,
    )
  }

  // Critical cross-morphology check: if a co-located uncertain/raised population is explicitly
  // described, it cannot be hidden inside a flat group.
  const raisedGroups = [...groupMap.values()].filter(
    (group) => group.burden_category === 'raised_pigmented_lesion',
  )
  const flatGroups = [...groupMap.values()].filter(
    (group) => group.burden_category === 'flat_focal_pigmented_lesion',
  )
  if (raisedGroups.length && !flatGroups.length) {
    warnings.push('Raised groups are present without any flat focal group; confirm this matches the images.')
  }

  if (errors.length) {
    throw new PigmentationValidationError(
      `Pigmentation phenotype failed critical validation. ${errors.map((e) => `- ${e}`).join(' ')}`,
      errors,
      warnings,
    )
  }

  validated.analysis_record_type = 'validated_pigmentation_image_analysis_v2_4'
  validated.validation_metadata = {
    status: 'application_scored',
    model_version: metadata.modelVersion || null,
    prompt_version: metadata.promptVersion || null,
    config_version: metadata.configVersion || null,
    policy_version: metadata.policyVersion || null,
    validated_at_iso: new Date().toISOString(),
    warnings,
  }

  return buildLegacyMetricViews(validated)
}

export function extractImmutablePigmentationMetrics(validated) {
  const metrics = validated?.metrics || {}
  const result = {
    global_background_melanin_load_index:
      metrics.global_background_melanin_load_index?.score_100,
    global_background_erythema_load_index:
      metrics.global_background_erythema_load_index?.score_100,
    active_inflammatory_lesion_burden_index:
      metrics.active_inflammatory_lesion_burden_index?.score_100,
    flat_focal_pigmented_lesion_burden_index:
      metrics.flat_focal_pigmented_lesion_burden_index?.score_100,
    raised_pigmented_lesion_burden_index:
      metrics.raised_pigmented_lesion_burden_index?.score_100,
    structural_periocular_shadow_burden_index:
      metrics.structural_periocular_shadow_burden_index?.score_100,
    image_metrics_copied_without_recalculation: true,
  }

  for (const [key, value] of Object.entries(result)) {
    if (key === 'image_metrics_copied_without_recalculation') continue
    if (!Number.isInteger(value) || value < 1 || value > 100) {
      throw new PigmentationValidationError(`Unable to extract immutable metric ${key}.`, [
        `${key} is not an integer from 1 to 100.`,
      ])
    }
  }
  return Object.freeze(result)
}

export function assertDiagnosisCopiedImmutableMetrics(diagnosis, validatedOrMetrics) {
  const expected = validatedOrMetrics?.metrics
    ? extractImmutablePigmentationMetrics(validatedOrMetrics)
    : validatedOrMetrics
  const actual = diagnosis?.immutable_image_metrics
  const errors = []

  if (!isObject(actual)) {
    throw new PigmentationValidationError('Diagnosis omitted immutable_image_metrics.', [
      'immutable_image_metrics is required.',
    ])
  }

  for (const key of METRIC_KEYS) {
    if (actual[key] !== expected?.[key]) {
      errors.push(`${key} changed from ${expected?.[key]} to ${actual[key]}.`)
    }
  }

  if (errors.length) {
    throw new PigmentationValidationError('Diagnosis changed immutable image metrics.', errors)
  }
  return true
}

export function validatePigmentationDiagnosis(diagnosis, phenotype) {
  const errors = []
  const warnings = []
  if (!isObject(diagnosis)) {
    throw new PigmentationValidationError('Diagnosis must be an object.', ['Diagnosis was not JSON.'])
  }

  assertDiagnosisCopiedImmutableMetrics(diagnosis, phenotype)

  const groups = Array.isArray(phenotype?.morphology_groups) ? phenotype.morphology_groups : []
  const groupMap = new Map(groups.map((group) => [group.group_id, group]))
  const resolutions = Array.isArray(diagnosis.group_resolution)
    ? diagnosis.group_resolution
    : Array.isArray(diagnosis.morphology_group_resolution)
      ? diagnosis.morphology_group_resolution
      : []
  const resolutionMap = new Map()

  for (const resolution of resolutions) {
    if (!resolution?.group_id) continue
    if (resolutionMap.has(resolution.group_id)) {
      errors.push(`Diagnosis resolves ${resolution.group_id} more than once.`)
    }
    resolutionMap.set(resolution.group_id, resolution)
  }

  for (const group of groups) {
    if (!resolutionMap.has(group.group_id)) {
      errors.push(`Diagnosis does not resolve morphology group ${group.group_id}.`)
    }
  }

  const components = Array.isArray(diagnosis.diagnostic_components)
    ? diagnosis.diagnostic_components
    : []
  if (components.length === 0) errors.push('Diagnosis has no diagnostic_components.')

  const componentIds = new Set()
  for (const component of components) {
    const id = component?.diagnostic_component_id
    if (!id) errors.push('A diagnostic component is missing diagnostic_component_id.')
    else if (componentIds.has(id)) errors.push(`Duplicate diagnostic component ID: ${id}.`)
    else componentIds.add(id)

    const linkedIds = uniqueStrings(component?.linked_group_ids)
    if (linkedIds.length === 0 && component?.family !== 'no_significant_diffuse_pigmentation') {
      errors.push(`${id || 'Diagnostic component'} has no linked morphology group.`)
    }
    for (const groupId of linkedIds) {
      if (!groupMap.has(groupId)) errors.push(`${id} links unknown morphology group ${groupId}.`)
    }
    if (isVagueLocation(component?.clinical_location_text) && linkedIds.length > 0) {
      errors.push(`${id} lacks a doctor-usable clinical_location_text.`)
    }

    if (linkedIds.length === 1) {
      const sourceLocation = normalizeText(groupMap.get(linkedIds[0])?.clinical_location_text)
      const dxLocation = normalizeText(component?.clinical_location_text)
      if (sourceLocation && dxLocation && sourceLocation !== dxLocation) {
        warnings.push(`${id} location text differs from source group ${linkedIds[0]}; preserve it exactly where possible.`)
      }
    }
  }

  for (const resolution of resolutions) {
    if (!groupMap.has(resolution.group_id)) {
      errors.push(`Diagnosis resolution contains unknown group ${resolution.group_id}.`)
    }
    if (resolution.resolution === 'mapped' && !componentIds.has(resolution.diagnostic_component_id)) {
      errors.push(`Resolution for ${resolution.group_id} points to missing component ${resolution.diagnostic_component_id}.`)
    }
    if (resolution.resolution === 'excluded' && !resolution.exclusion_reason) {
      errors.push(`Excluded group ${resolution.group_id} requires an exclusion_reason.`)
    }
  }

  if (errors.length) {
    throw new PigmentationValidationError(
      `Pigmentation diagnosis failed critical validation. ${errors.map((e) => `- ${e}`).join(' ')}`,
      errors,
      warnings,
    )
  }

  diagnosis.validation_metadata = {
    ...(diagnosis.validation_metadata || {}),
    status: 'application_validated_v2_4',
    warnings,
  }
  return { valid: true, errors: [], warnings, diagnosis }
}

export function assertDiagnosisReadyForTreatmentPlanning(diagnosis, phenotype) {
  const result = validatePigmentationDiagnosis(diagnosis, phenotype)
  if (diagnosis.diagnosis_status === 'blocked_for_doctor_assessment') {
    throw new PigmentationValidationError('Diagnosis is blocked for doctor assessment.', [
      'Treatment planning cannot proceed until the blocking component is reviewed.',
    ])
  }
  return result
}

export function buildCompactPhenotypeForDiagnosis(validated) {
  return {
    immutable_image_metrics: extractImmutablePigmentationMetrics(validated),
    image_quality: validated.image_quality || {},
    background_profile: validated.background_profile || {},
    morphology_groups: (validated.morphology_groups || []).map((group) => ({
      group_id: group.group_id,
      clinical_location_text: group.clinical_location_text,
      anatomical_regions: group.anatomical_regions,
      patient_side: group.patient_side,
      morphology: group.morphology,
      surface: group.surface,
      elevation: group.elevation,
      distribution: group.distribution,
      count_band: group.count_band,
      colour_description: group.colour_description,
      burden_category: group.burden_category,
      presence_status: group.presence_status,
      likely_families: group.likely_families || group.image_family_hypotheses || [],
      request_closeup_recommended: Boolean(group.request_closeup_recommended),
      doctor_review_required: Boolean(group.doctor_review_required),
      confidence_100: group.confidence_100,
    })),
    phenotype_summary_for_doctor:
      validated.phenotype_summary_for_doctor || validated.image_summary_for_doctor || '',
  }
}
