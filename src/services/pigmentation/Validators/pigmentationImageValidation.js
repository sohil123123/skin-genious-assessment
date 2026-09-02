/**
 * Pigmentation Decode V2.7 reliability validator — presence, scoreability and safety only.
 *
 * The validator is deliberately permissive at observation and diagnosis stages. It blocks only when
 * required data is absent, the record cannot be scored/linked, or a pathway-changing safety item
 * cannot be resolved. Canonical wording, redundant cross-section agreement and evidence ordering
 * are advisory rather than case-blocking.
 */

import {
  PIGMENTATION_CONFIG,
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

const MEASUREMENT_ROLE_TO_METRIC = {
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

const ONTOLOGY = PIGMENTATION_CONFIG.v2_ontology || {}
const ALLOWED_TREATMENT_PATTERNS = new Set(ONTOLOGY.treatment_pattern_codes || [])
const ALLOWED_FAMILIES = new Set(Object.keys(ONTOLOGY.families || {}))
const HOLD_SCOPES = new Set(ONTOLOGY.safety_hold_scope_values || [])
const ALLOWED_DIAGNOSTIC_STATUSES = new Set(ONTOLOGY.diagnostic_status_values || [])
const ALLOWED_DIRECT_STATUSES = new Set(ONTOLOGY.direct_cosmetic_treatment_status_values || [])
const ALLOWED_CLASSIFICATION_TRIGGERS = new Set(ONTOLOGY.classification_trigger_values || [])
const ALLOWED_CLASSIFICATION_RESOLUTIONS = new Set(ONTOLOGY.classification_resolution_values || [])
const ALLOWED_PHENOTYPE_TYPES = new Set(ONTOLOGY.phenotype_type_values || [])
const ALLOWED_MODIFIER_TYPES = new Set(ONTOLOGY.modifier_type_values || [])
const ALLOWED_SAFETY_TYPES = new Set(ONTOLOGY.safety_finding_type_values || [])
const ALLOWED_REGION_TAGS = new Set(ONTOLOGY.region_review_tag_values || [])
const ALLOWED_ELEVATIONS = new Set(ONTOLOGY.elevation_values || [])
const ALLOWED_SURFACES = new Set(ONTOLOGY.surface_values || [])
const ALLOWED_IMAGE_MODES = new Set(
  PIGMENTATION_CONFIG.image_acquisition?.canonical_mode_order || [],
)
const ALLOWED_DEPTH_EVIDENCE_VALUES = new Set([
  'present',
  'absent',
  'uncertain',
  'limited',
  'not_applicable',
])
const ALLOWED_DEPTH_INFERENCE_VALUES = new Set([
  'epidermal_predominant',
  'mixed_epidermal_predominant',
  'mixed',
  'dermal_predominant',
  'uncertain',
  'not_applicable',
])
const ALLOWED_MEASUREMENT_ROLES = new Set(ONTOLOGY.burden_categories || [])
const COARSE_REVIEW_REGIONS =
  PIGMENTATION_CONFIG.anatomical_location_contract?.whole_face_region_review?.required_regions || []
const ALLOWED_ANATOMICAL_REGIONS = new Set([
  ...(PIGMENTATION_CONFIG.anatomical_location_contract?.canonical_regions ||
    ONTOLOGY.anatomical_regions ||
    []),
  ...(PIGMENTATION_CONFIG.anatomical_location_contract?.coarse_region_keys || []),
  ...COARSE_REVIEW_REGIONS,
])
const ALLOWED_PRIMARY_LESION_TYPES = new Set(
  PIGMENTATION_CONFIG.phenotype_pipeline_contract?.primary_lesion_type_values || [],
)
const ALLOWED_UNRESOLVED_VISUAL_PROPERTIES = new Set(
  PIGMENTATION_CONFIG.phenotype_pipeline_contract?.unresolved_visual_property_values || [],
)
const ALLOWED_COUNT_BANDS = new Set(
  PIGMENTATION_CONFIG.anatomical_location_contract?.count_bands || [],
)
const ALLOWED_DISTRIBUTIONS = new Set([
  'isolated',
  'scattered',
  'multifocal_scattered',
  'multifocal_clustered',
  'regional',
  'diffuse',
  'confluent',
  'reticular',
  'other',
])
const ALLOWED_COMPONENT_ROLES = new Set([
  'primary_pigment_target',
  'pigmentation_contributor',
  'treatment_modifier',
  'safety_exclusion',
  'not_pigmentation_relevant',
])
const ALLOWED_COMPONENT_ACTIVITY = new Set([
  'active',
  'stable',
  'recurrent',
  'worsening',
  'improving',
  'unknown',
  'not_applicable',
])
const ALLOWED_COMPONENT_DEPTH = new Set([
  'epidermal_predominant',
  'mixed',
  'dermal_predominant',
  'uncertain',
  'not_applicable',
])
const REQUIRED_REVIEW_REGIONS = COARSE_REVIEW_REGIONS

const STANDARD_CLASSIFICATION_RESOLUTIONS = [
  'not_pigmentation_relevant',
  'exclude_from_cosmetic_treatment',
  'separate_medical_evaluation',
]

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

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value))
}

function uniqueStrings(values) {
  return [
    ...new Set((Array.isArray(values) ? values : []).filter((v) => typeof v === 'string' && v)),
  ]
}

function normalizeText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function normalizeMachineCode(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[–—]/g, '-')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

const DIAGNOSIS_CODE_NORMALIZATION = ONTOLOGY.diagnosis_code_normalization || {}
const GENERIC_UNKNOWN_SUBTYPE_TOKENS = new Set(
  (
    DIAGNOSIS_CODE_NORMALIZATION.generic_unknown_tokens || [
      '',
      'unspecified',
      'unknown',
      'not_specified',
      'not_sure',
      'uncertain',
    ]
  ).map(normalizeMachineCode),
)

function inferCanonicalSubtype(record) {
  const family = normalizeMachineCode(record?.family_code || record?.family)
  const treatmentPattern = normalizeMachineCode(record?.treatment_pattern_code)
  const allowedSubtypes = ONTOLOGY.families?.[family] || []
  const allowedSet = new Set(allowedSubtypes.map(normalizeMachineCode))
  const rawSubtype = normalizeMachineCode(record?.subtype_code || record?.subtype)

  if (rawSubtype && allowedSet.has(rawSubtype)) return rawSubtype

  // Only generic unknown placeholders are automatically normalised. A specific but
  // noncanonical disease label remains a hard error so mapping mistakes are not hidden.
  if (!GENERIC_UNKNOWN_SUBTYPE_TOKENS.has(rawSubtype)) return rawSubtype

  const patternOverride = normalizeMachineCode(
    DIAGNOSIS_CODE_NORMALIZATION.treatment_pattern_subtype_override?.[treatmentPattern],
  )
  if (patternOverride && allowedSet.has(patternOverride)) return patternOverride

  const familyFallback = normalizeMachineCode(
    DIAGNOSIS_CODE_NORMALIZATION.family_default_subtype?.[family],
  )
  if (familyFallback && allowedSet.has(familyFallback)) return familyFallback

  return rawSubtype
}

function canonicalizeDiagnosisRecordCodes(record, path, normalizations) {
  if (!isObject(record)) return

  const rawFamily = record.family_code || record.family
  const family = normalizeMachineCode(rawFamily)
  if (family && family !== rawFamily) {
    record.family_code = family
    record.family = family
    normalizations.push(`${path}.family_code: ${rawFamily || '(empty)'} -> ${family}`)
  }

  const rawSubtype = record.subtype_code || record.subtype
  const canonicalSubtype = inferCanonicalSubtype({ ...record, family_code: family || rawFamily })
  if (canonicalSubtype && canonicalSubtype !== normalizeMachineCode(rawSubtype)) {
    record.subtype_code = canonicalSubtype
    record.subtype = canonicalSubtype
    normalizations.push(`${path}.subtype_code: ${rawSubtype || '(empty)'} -> ${canonicalSubtype}`)
  } else if (canonicalSubtype && !record.subtype_code) {
    record.subtype_code = canonicalSubtype
    record.subtype = canonicalSubtype
  }

  if (record.treatment_pattern_code) {
    record.treatment_pattern_code = normalizeMachineCode(record.treatment_pattern_code)
  }
}

/**
 * Normalise only safe generic diagnosis-code placeholders into family-specific canonical
 * uncertainty codes. This mutates the parsed diagnosis in place so legacy callers that ignore
 * the validator return value still persist the canonical record.
 */
export function canonicalizePigmentationDiagnosisCodes(diagnosis) {
  const normalizations = []
  for (const component of diagnosis?.diagnostic_components || []) {
    canonicalizeDiagnosisRecordCodes(
      component,
      component?.diagnostic_component_id || 'diagnostic_component',
      normalizations,
    )
  }
  for (const item of diagnosis?.classification_required_items || []) {
    for (const option of item?.candidate_options || []) {
      canonicalizeDiagnosisRecordCodes(
        option,
        `${item?.classification_id || 'classification_item'}.${option?.option_code || 'option'}`,
        normalizations,
      )
    }
  }
  for (const differential of diagnosis?.ranked_differential || []) {
    canonicalizeDiagnosisRecordCodes(differential, 'ranked_differential', normalizations)
  }
  return normalizations
}

function isVagueLocation(value) {
  const text = normalizeText(value)
  return (
    !text ||
    ['face', 'cheek', 'cheeks', 'pigmented area', 'affected area', 'affected region'].includes(text)
  )
}

function groupFromPhenotype(record) {
  const unresolvedForScoring =
    record.unresolved_visual_property === 'flat_vs_raised' ||
    (record.phenotype_type === 'indeterminate_pigmentation_relevant_lesion' &&
      record.elevation === 'uncertain')
  const effectiveMeasurementRole = unresolvedForScoring ? 'none' : record.measurement_role || 'none'

  return {
    ...record,
    record_class: 'pigmentation_phenotype',
    morphology: record.primary_lesion_type,
    measurement_role: effectiveMeasurementRole,
    burden_category: effectiveMeasurementRole,
    scoring_exclusion_reason: unresolvedForScoring
      ? 'unresolved_flat_vs_raised_or_pathway_changing_morphology'
      : null,
    primary_detection_mode: record.mode_evidence?.morphology_primary,
    supporting_modes: record.mode_evidence?.morphology_supporting || [],
    non_diagnostic_modes_for_primary_feature: [
      'raised_pigmented_lesion',
      'indeterminate_pigmentation_relevant_lesion',
    ].includes(record.phenotype_type)
      ? ['subsurface_polarized', 'red', 'woods_uv']
      : [],
    depth_evidence: {
      woods_uv_accentuation: record.mode_evidence?.woods_uv_accentuation || 'not_applicable',
      subsurface_persistence: record.mode_evidence?.subsurface_persistence || 'not_applicable',
      depth_inference: record.mode_evidence?.depth_inference || 'not_applicable',
      confidence_100: record.mode_evidence?.depth_confidence_100 ?? 0,
    },
    mode_evidence_summary: record.mode_evidence?.summary || '',
  }
}

function groupFromModifier(record) {
  const morphologyMap = {
    vascular_or_erythematous_contribution: 'other',
    structural_shadow: 'structural_shadow',
    barrier_or_scale_change: 'scale_or_barrier_change',
    active_inflammatory_driver: 'active_inflammatory_lesion',
    acne_activity_modifier: 'active_inflammatory_lesion',
    friction_pressure_or_contact_modifier: 'other',
    hair_stubble_or_optical_shadow: 'other',
    scar_or_depression_modifier: 'scar_or_depression',
  }
  return {
    ...record,
    record_class: 'pigmentation_contributor_or_modifier',
    morphology: record.primary_lesion_type || morphologyMap[record.modifier_type] || 'other',
    burden_category: record.measurement_role,
    primary_detection_mode: record.mode_evidence?.primary,
    supporting_modes: record.mode_evidence?.supporting || [],
    non_diagnostic_modes_for_primary_feature: [],
    depth_evidence: null,
    mode_evidence_summary: record.mode_evidence?.summary || '',
    colour_description: record.visible_finding || '',
    count_band: record.count_band || 'not_reliably_countable',
  }
}

function normalizeObservationArrays(raw) {
  const phenotypes = Array.isArray(raw?.pigmentation_phenotypes) ? raw.pigmentation_phenotypes : []
  const modifiers = Array.isArray(raw?.pigmentation_contributors_and_modifiers)
    ? raw.pigmentation_contributors_and_modifiers
    : []

  if (!phenotypes.length && !modifiers.length && Array.isArray(raw?.morphology_groups)) {
    // Backward-compatible read of stored V2.5 records; new V2.6 calls must use the split arrays.
    const legacyPhenotypes = []
    const legacyModifiers = []
    for (const group of raw.morphology_groups) {
      const converted = {
        ...group,
        primary_lesion_type: group.morphology,
        measurement_role: group.burden_category,
        mode_evidence: {
          morphology_primary: group.primary_detection_mode,
          morphology_supporting: group.supporting_modes || [],
          woods_uv_accentuation: group.depth_evidence?.woods_uv_accentuation || 'not_applicable',
          subsurface_persistence: group.depth_evidence?.subsurface_persistence || 'not_applicable',
          depth_inference: group.depth_evidence?.depth_inference || 'not_applicable',
          depth_confidence_100: group.depth_evidence?.confidence_100 || 0,
          summary: group.mode_evidence_summary || '',
        },
      }
      if (
        [
          'global_background_melanin',
          'flat_focal_pigmented_lesion',
          'raised_pigmented_lesion',
        ].includes(group.burden_category)
      ) {
        converted.phenotype_type =
          group.burden_category === 'global_background_melanin'
            ? 'diffuse_background_pigmentation'
            : group.burden_category === 'raised_pigmented_lesion'
              ? 'raised_pigmented_lesion'
              : 'flat_focal_pigmentation'
        legacyPhenotypes.push(converted)
      } else {
        converted.modifier_type =
          group.burden_category === 'global_background_erythema'
            ? 'vascular_or_erythematous_contribution'
            : group.burden_category === 'active_inflammatory_lesion'
              ? 'active_inflammatory_driver'
              : group.burden_category === 'structural_periocular_shadow'
                ? 'structural_shadow'
                : group.burden_category === 'barrier_or_scale_modifier'
                  ? 'barrier_or_scale_change'
                  : 'friction_pressure_or_contact_modifier'
        legacyModifiers.push(converted)
      }
    }
    return { phenotypes: legacyPhenotypes, modifiers: legacyModifiers, legacy: true }
  }

  return { phenotypes, modifiers, legacy: false }
}

export function pigmentationSeverityLabelV26(score) {
  return configPigmentationSeverityLabel(score)
}

export const pigmentationSeverityLabel = pigmentationSeverityLabelV26

export function assertValidMeasurementPrimitives(primitives, path, metricKey) {
  const errors = []
  if (!isObject(primitives)) {
    throw new PigmentationValidationError(`${path} must be an object.`, [`${path} missing.`])
  }
  for (const key of PROFILE_PRIMITIVES[metricKey] || []) {
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

export function finalizeBurdenIndex(rawIndex, path = 'metric', metricKey = path) {
  const score = calculatePigmentationBurdenIndex(
    rawIndex?.measurement_primitives || rawIndex,
    metricKey,
  )
  return {
    ...(isObject(rawIndex) ? rawIndex : {}),
    score_100: score,
    severity_label: configPigmentationSeverityLabel(score),
    score_source: 'application_fixed_aggregation_v2_6_1',
  }
}

function validateImageQuality(imageQuality, criticalErrors, warnings) {
  if (!isObject(imageQuality)) {
    criticalErrors.push('image_quality is required.')
    return
  }
  if (typeof imageQuality.overall_usable !== 'boolean') {
    warnings.push('image_quality.overall_usable should be boolean.')
  }
  const modeQuality = imageQuality.mode_quality
  if (!isObject(modeQuality)) {
    warnings.push(
      'image_quality.mode_quality is missing; continuing because the images were supplied to the model.',
    )
  } else {
    for (const mode of ALLOWED_IMAGE_MODES) {
      if (!['usable', 'limited', 'not_usable'].includes(modeQuality[mode])) {
        warnings.push(`image_quality.mode_quality.${mode} is missing or noncanonical.`)
      }
    }
  }
  if (imageQuality.overall_usable === false) {
    criticalErrors.push(
      'The image set was explicitly marked unusable for Pigmentation Decode analysis.',
    )
  }
  if (modeQuality?.white === 'not_usable' && modeQuality?.surface_polarized === 'not_usable') {
    criticalErrors.push(
      'WHITE and SURFACE_POLARIZED are both unusable; morphology cannot be assessed safely.',
    )
  }
  if (
    modeQuality?.woods_uv === 'not_usable' ||
    modeQuality?.subsurface_polarized === 'not_usable'
  ) {
    warnings.push(
      'Pigment depth interpretation is limited because Woods UV or subsurface mode is unusable.',
    )
  }
}

function validatePhenotypeModeEvidence(record, path, warnings) {
  const evidence = record.mode_evidence
  if (!isObject(evidence)) {
    warnings.push(`${path}.mode_evidence is missing; descriptive observation remains usable.`)
    return
  }
  if (!['white', 'surface_polarized'].includes(evidence.morphology_primary)) {
    warnings.push(
      `${path}.mode_evidence.morphology_primary is nonpreferred; WHITE/SURFACE are preferred for morphology.`,
    )
  }
  if (!Array.isArray(evidence.morphology_supporting)) {
    warnings.push(`${path}.mode_evidence.morphology_supporting should be an array.`)
  }
  if (!ALLOWED_DEPTH_EVIDENCE_VALUES.has(evidence.woods_uv_accentuation)) {
    warnings.push(`${path}.mode_evidence.woods_uv_accentuation is noncanonical.`)
  }
  if (!ALLOWED_DEPTH_EVIDENCE_VALUES.has(evidence.subsurface_persistence)) {
    warnings.push(`${path}.mode_evidence.subsurface_persistence is noncanonical.`)
  }
  if (!ALLOWED_DEPTH_INFERENCE_VALUES.has(evidence.depth_inference)) {
    warnings.push(`${path}.mode_evidence.depth_inference is noncanonical.`)
  }
  if (
    ['mixed', 'dermal_predominant'].includes(evidence.depth_inference) &&
    ['absent', 'not_applicable'].includes(evidence.subsurface_persistence)
  ) {
    warnings.push(`${path} calls deeper/mixed pigment without positive subsurface persistence.`)
  }
}

function validateModifierModeEvidence(record, path, warnings) {
  const evidence = record.mode_evidence
  if (!isObject(evidence)) {
    warnings.push(
      `${path}.mode_evidence is missing; modifier remains usable as a descriptive finding.`,
    )
    return
  }
  if (!ALLOWED_IMAGE_MODES.has(evidence.primary)) {
    warnings.push(`${path}.mode_evidence.primary is noncanonical.`)
  }
  const preferredPrimary = {
    vascular_or_erythematous_contribution: ['red'],
    structural_shadow: ['white'],
    barrier_or_scale_change: ['surface_polarized'],
    active_inflammatory_driver: ['white', 'red'],
    acne_activity_modifier: ['white', 'red'],
    friction_pressure_or_contact_modifier: ['white', 'surface_polarized'],
    hair_stubble_or_optical_shadow: ['white', 'surface_polarized'],
    scar_or_depression_modifier: ['white', 'surface_polarized'],
  }[record.modifier_type]
  if (preferredPrimary && !preferredPrimary.includes(evidence.primary)) {
    warnings.push(
      `${path}.${record.modifier_type} preferably uses ${preferredPrimary.join(' or ')} as primary evidence; evidence order does not invalidate the finding.`,
    )
  }
  if (!Array.isArray(evidence.supporting)) {
    warnings.push(`${path}.mode_evidence.supporting should be an array.`)
  } else if (evidence.supporting.some((mode) => !ALLOWED_IMAGE_MODES.has(mode))) {
    warnings.push(`${path}.mode_evidence.supporting contains a noncanonical mode.`)
  }
}

function validateRegionReview(regionReview, warnings) {
  if (!isObject(regionReview)) {
    warnings.push(
      'region_review is missing; structured phenotype/modifier groups remain authoritative.',
    )
    return
  }
  for (const region of REQUIRED_REVIEW_REGIONS) {
    const record = regionReview[region]
    if (!isObject(record)) {
      warnings.push(
        `region_review.${region} is missing; this does not invalidate structured findings.`,
      )
      continue
    }
    if (!['usable', 'limited', 'not_usable'].includes(record.visibility)) {
      warnings.push(`region_review.${region}.visibility is noncanonical.`)
    }
    if (!Array.isArray(record.positive_tags)) {
      warnings.push(`region_review.${region}.positive_tags should be an array.`)
      continue
    }
    for (const tag of record.positive_tags) {
      if (!ALLOWED_REGION_TAGS.has(tag)) {
        warnings.push(`region_review.${region} has noncanonical positive tag ${tag}.`)
      }
    }
  }
}

function validateBaseGroup(record, path, ids, criticalErrors, warnings) {
  if (!isObject(record)) {
    criticalErrors.push(`${path} must be an object.`)
    return false
  }
  if (!record.group_id) criticalErrors.push(`${path}.group_id is required.`)
  else if (ids.has(record.group_id)) criticalErrors.push(`Duplicate group ID: ${record.group_id}.`)
  else ids.add(record.group_id)

  const hasReadableLocation = !isVagueLocation(record.clinical_location_text)
  const hasRegions =
    Array.isArray(record.anatomical_regions) && record.anatomical_regions.length > 0
  if (!hasReadableLocation && !hasRegions) {
    criticalErrors.push(
      `${path} requires either clinical_location_text or at least one anatomical region.`,
    )
  } else if (!hasReadableLocation) {
    warnings.push(
      `${path}.clinical_location_text is vague; anatomical_regions will carry localisation.`,
    )
  }

  if (!hasRegions) {
    warnings.push(
      `${path}.anatomical_regions is empty; clinical_location_text will carry localisation.`,
    )
    record.anatomical_regions = []
  } else {
    record.anatomical_regions = uniqueStrings(record.anatomical_regions)
    for (const region of record.anatomical_regions) {
      if (!ALLOWED_ANATOMICAL_REGIONS.has(region)) {
        warnings.push(
          `${path}.anatomical_regions contains noncanonical region ${region}; precise location text remains usable.`,
        )
      }
    }
  }
  if (record.distribution && !ALLOWED_DISTRIBUTIONS.has(record.distribution)) {
    warnings.push(`${path}.distribution is noncanonical.`)
  }
  if (record.count_band && !ALLOWED_COUNT_BANDS.has(record.count_band)) {
    warnings.push(`${path}.count_band is noncanonical and will not block the case.`)
  }
  if (record.primary_lesion_type && !ALLOWED_PRIMARY_LESION_TYPES.has(record.primary_lesion_type)) {
    warnings.push(`${path}.primary_lesion_type is noncanonical.`)
  }
  if (
    record.patient_side &&
    !['right', 'left', 'bilateral', 'midline', 'not_applicable'].includes(record.patient_side)
  ) {
    warnings.push(`${path}.patient_side is noncanonical.`)
  }
  if (record.elevation && !ALLOWED_ELEVATIONS.has(record.elevation)) {
    warnings.push(`${path}.elevation is noncanonical.`)
  }
  if (record.surface && !ALLOWED_SURFACES.has(record.surface)) {
    warnings.push(`${path}.surface is noncanonical.`)
  }
  if (record.measurement_role && !ALLOWED_MEASUREMENT_ROLES.has(record.measurement_role)) {
    warnings.push(
      `${path}.measurement_role is noncanonical; score links rely on metric primitives.`,
    )
  }
  if (record.presence_status && !['present', 'uncertain'].includes(record.presence_status)) {
    warnings.push(`${path}.presence_status is noncanonical.`)
  }
  if (
    record.confidence_100 !== undefined &&
    (!Number.isFinite(record.confidence_100) ||
      record.confidence_100 < 0 ||
      record.confidence_100 > 100)
  ) {
    warnings.push(`${path}.confidence_100 is outside 0-100.`)
  }
  return true
}

function validatePhenotypes(phenotypes, ids, criticalErrors, warnings) {
  const groups = []
  phenotypes.forEach((record, index) => {
    const path = `pigmentation_phenotypes[${index}]`
    if (!validateBaseGroup(record, path, ids, criticalErrors, warnings)) return
    if (!ALLOWED_PHENOTYPE_TYPES.has(record.phenotype_type)) {
      warnings.push(`${path}.phenotype_type is noncanonical.`)
    }
    if (!record.primary_lesion_type) warnings.push(`${path}.primary_lesion_type is missing.`)
    if (
      record.unresolved_visual_property &&
      !ALLOWED_UNRESOLVED_VISUAL_PROPERTIES.has(record.unresolved_visual_property)
    ) {
      warnings.push(`${path}.unresolved_visual_property is noncanonical.`)
    }
    validatePhenotypeModeEvidence(record, path, warnings)

    if (
      record.unresolved_visual_property === 'flat_vs_raised' &&
      record.measurement_role !== 'none'
    ) {
      warnings.push(
        `${path} remains flat-versus-raised indeterminate; it is excluded from flat and raised scoring until doctor classification.`,
      )
    }
    if (
      record.phenotype_type === 'raised_pigmented_lesion' &&
      !['probably_raised', 'raised', 'uncertain'].includes(record.elevation)
    ) {
      warnings.push(`${path} has a raised phenotype label with non-raised elevation wording.`)
    }
    if (
      [
        'flat_focal_pigmentation',
        'regional_patch_pigmentation',
        'reticular_pigmentation',
        'periocular_pigment',
        'perioral_pigment',
      ].includes(record.phenotype_type) &&
      ['probably_raised', 'raised'].includes(record.elevation)
    ) {
      warnings.push(
        `${path} has a flat/regional phenotype label with raised elevation wording; preserve for doctor review.`,
      )
    }

    groups.push(groupFromPhenotype(record))
  })
  return groups
}

function validateModifiers(modifiers, ids, criticalErrors, warnings) {
  const groups = []
  modifiers.forEach((record, index) => {
    const path = `pigmentation_contributors_and_modifiers[${index}]`
    if (!validateBaseGroup(record, path, ids, criticalErrors, warnings)) return
    if (!ALLOWED_MODIFIER_TYPES.has(record.modifier_type)) {
      warnings.push(`${path}.modifier_type is noncanonical.`)
    }
    validateModifierModeEvidence(record, path, warnings)
    if (!record.pigmentation_relevance) warnings.push(`${path}.pigmentation_relevance is missing.`)
    if (
      [
        'global_background_melanin',
        'flat_focal_pigmented_lesion',
        'raised_pigmented_lesion',
      ].includes(record.measurement_role)
    ) {
      warnings.push(
        `${path} is a modifier carrying a pigment measurement role; metric primitives remain authoritative.`,
      )
    }
    if (
      record.modifier_type === 'barrier_or_scale_change' &&
      record.measurement_role === 'active_inflammatory_lesion'
    ) {
      warnings.push(
        `${path} barrier/scale change should not automatically feed active inflammatory burden.`,
      )
    }
    groups.push(groupFromModifier(record))
  })
  return groups
}

function validateSafetyFindings(findings, groupMap, errors, warnings) {
  if (!Array.isArray(findings)) {
    errors.push('safety_and_image_limitations must be an array.')
    return
  }
  const ids = new Set()
  findings.forEach((finding, index) => {
    const path = `safety_and_image_limitations[${index}]`
    if (!isObject(finding)) {
      errors.push(`${path} must be an object.`)
      return
    }
    if (!finding.finding_id) errors.push(`${path}.finding_id is required.`)
    else if (ids.has(finding.finding_id))
      errors.push(`Duplicate safety finding ID ${finding.finding_id}.`)
    else ids.add(finding.finding_id)
    if (!ALLOWED_SAFETY_TYPES.has(finding.type)) errors.push(`${path}.type is invalid.`)
    if (
      isVagueLocation(finding.clinical_location_text) &&
      finding.type !== 'image_quality_limitation'
    ) {
      errors.push(`${path}.clinical_location_text must be precise.`)
    }
    for (const groupId of uniqueStrings(finding.linked_group_ids)) {
      if (!groupMap.has(groupId)) errors.push(`${path} links unknown group ${groupId}.`)
    }
    if (
      finding.may_require_targeted_doctor_classification &&
      !uniqueStrings(finding.linked_group_ids).length
    ) {
      warnings.push(`${path} may require classification but has no linked group.`)
    }
  })
}

function normalizeMetric(rawMetric, metricKey, groupMap, criticalErrors, warnings) {
  const path = `metrics.${metricKey}`
  if (!isObject(rawMetric)) {
    criticalErrors.push(`${path} is required for deterministic scoring.`)
    return {
      presence_status: 'uncertain',
      linked_group_ids: [],
      measurement_primitives: {},
      score_100: 1,
      severity_label: configPigmentationSeverityLabel(1),
      score_source: 'application_fixed_aggregation_v2_7_unavailable',
    }
  }

  const metric = clone(rawMetric)
  if (!['present', 'absent', 'uncertain'].includes(metric.presence_status)) {
    warnings.push(`${path}.presence_status is noncanonical.`)
  }

  const linkedIds = uniqueStrings(metric.linked_group_ids)
  for (const id of linkedIds) {
    if (!groupMap.has(id)) warnings.push(`${path}.linked_group_ids contains unknown group ${id}.`)
  }

  const expectedIds = [...groupMap.values()]
    .filter((group) => MEASUREMENT_ROLE_TO_METRIC[group.measurement_role] === metricKey)
    .map((group) => group.group_id)
  for (const id of expectedIds) {
    if (!linkedIds.includes(id)) warnings.push(`${path} does not link matching group ${id}.`)
  }

  const localCritical = []
  try {
    assertValidMeasurementPrimitives(metric.measurement_primitives, path, metricKey)
  } catch (error) {
    localCritical.push(...(error.errors || [error.message]))
  }
  criticalErrors.push(...localCritical)

  let score = 1
  if (!localCritical.length) {
    try {
      score = calculatePigmentationBurdenIndex(metric.measurement_primitives, metricKey)
    } catch (error) {
      criticalErrors.push(`${path} could not be deterministically scored: ${error.message}`)
    }
  }

  return {
    ...metric,
    linked_group_ids: linkedIds,
    score_100: score,
    severity_label: configPigmentationSeverityLabel(score),
    score_source: 'application_fixed_aggregation_v2_7_presence_and_safety',
  }
}

function buildLegacyMetricViews(validated) {
  const metrics = validated.metrics
  const profile = validated.background_profile || {}
  validated.global_background_indices = {
    melanin_load_index: metrics.global_background_melanin_load_index,
    erythema_load_index: metrics.global_background_erythema_load_index,
    estimated_fitzpatrick: profile.estimated_fitzpatrick || {
      type: 'uncertain',
      confidence_100: 0,
    },
    composition: profile.composition || {
      type: 'uncertain',
      melanin_percent: null,
      vascular_percent: null,
      confidence_100: 0,
    },
    depth_call: profile.depth_call || { type: 'uncertain', confidence_100: 0 },
  }
  validated.localized_burden_indices = {
    active_inflammatory_lesion_burden_index: metrics.active_inflammatory_lesion_burden_index,
    flat_focal_pigmented_lesion_burden_index: metrics.flat_focal_pigmented_lesion_burden_index,
    raised_pigmented_lesion_burden_index: metrics.raised_pigmented_lesion_burden_index,
    structural_periocular_shadow_burden_index: metrics.structural_periocular_shadow_burden_index,
  }
  return validated
}

export function validateAndScorePigmentationImageAnalysis(raw, metadata = {}) {
  const criticalErrors = []
  const warnings = []
  if (!isObject(raw)) {
    throw new PigmentationValidationError('Pigmentation observation must be an object.', [
      'Response was not a JSON object.',
    ])
  }

  const validated = clone(raw)
  validateImageQuality(validated.image_quality, criticalErrors, warnings)
  validateRegionReview(validated.region_review, warnings)

  const arrays = normalizeObservationArrays(validated)
  if (!arrays.phenotypes.length && !arrays.modifiers.length) {
    criticalErrors.push(
      'Observation contains no usable pigmentation phenotype or contributor/modifier records.',
    )
  }

  const ids = new Set()
  const groups = [
    ...validatePhenotypes(arrays.phenotypes, ids, criticalErrors, warnings),
    ...validateModifiers(arrays.modifiers, ids, criticalErrors, warnings),
  ]
  const groupMap = new Map(groups.map((group) => [group.group_id, group]))

  // region_review is a coverage aid only. Structured groups are authoritative;
  // cross-section wording or tagging mismatches are never case-blocking.
  validated.region_review_reconciliation = {
    revision: 'presence_and_safety_v2_7',
    authoritative_source: 'pigmentation_phenotypes_and_modifiers',
    status: 'not_cross_validated',
  }

  const safetyIssues = []
  validateSafetyFindings(
    validated.safety_and_image_limitations || [],
    groupMap,
    safetyIssues,
    warnings,
  )
  warnings.push(...safetyIssues)

  for (const group of groups) {
    if (group.scoring_exclusion_reason) {
      warnings.push(
        `${group.group_id} is preserved but excluded from burden scoring until morphology is resolved.`,
      )
    }
  }

  const rawMetrics = validated.metrics || {
    global_background_melanin_load_index: validated.global_background_indices?.melanin_load_index,
    global_background_erythema_load_index: validated.global_background_indices?.erythema_load_index,
    ...validated.localized_burden_indices,
  }
  validated.metrics = {}
  for (const metricKey of METRIC_KEYS) {
    validated.metrics[metricKey] = normalizeMetric(
      rawMetrics?.[metricKey],
      metricKey,
      groupMap,
      criticalErrors,
      warnings,
    )
  }

  if (criticalErrors.length) {
    throw new PigmentationValidationError(
      `Pigmentation observation is unusable. ${criticalErrors.map((e) => `- ${e}`).join(' ')}`,
      criticalErrors,
      warnings,
    )
  }

  validated.pigmentation_phenotypes = arrays.phenotypes
  validated.pigmentation_contributors_and_modifiers = arrays.modifiers
  validated.morphology_groups = groups
  validated.analysis_record_type = 'validated_pigmentation_observation_v2_7'
  validated.validation_metadata = {
    status: warnings.length ? 'usable_with_warnings' : 'usable',
    validation_policy_revision: 'presence_and_safety_v2_7',
    model_version: metadata.modelVersion || null,
    prompt_version: metadata.promptVersion || null,
    config_version: metadata.configVersion || null,
    policy_version: metadata.policyVersion || null,
    validated_at_iso: new Date().toISOString(),
    score_scale_version: 'pigmentation_scores_v2_6_not_directly_comparable_to_v2_5_or_earlier',
    source_record_was_legacy_v2_5: arrays.legacy,
    warnings: uniqueStrings(warnings),
  }
  return buildLegacyMetricViews(validated)
}

export function extractImmutablePigmentationMetrics(validated) {
  const metrics = validated?.metrics || {}
  const result = {
    global_background_melanin_load_index: metrics.global_background_melanin_load_index?.score_100,
    global_background_erythema_load_index: metrics.global_background_erythema_load_index?.score_100,
    active_inflammatory_lesion_burden_index:
      metrics.active_inflammatory_lesion_burden_index?.score_100,
    flat_focal_pigmented_lesion_burden_index:
      metrics.flat_focal_pigmented_lesion_burden_index?.score_100,
    raised_pigmented_lesion_burden_index: metrics.raised_pigmented_lesion_burden_index?.score_100,
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

function validateComponentHold(component, groupMap, errors, warnings) {
  const hold = component.safety_hold || {}
  if (!HOLD_SCOPES.has(hold.hold_scope || 'none')) {
    errors.push(`${component.diagnostic_component_id}.safety_hold.hold_scope is invalid.`)
  }
  for (const groupId of uniqueStrings(hold.held_group_ids)) {
    if (!groupMap.has(groupId)) {
      errors.push(
        `${component.diagnostic_component_id}.safety_hold references unknown group ${groupId}.`,
      )
    }
  }
  if (
    (hold.inflammation_first_required || hold.barrier_repair_first_required) &&
    (hold.hold_scope || 'none') === 'none'
  ) {
    errors.push(`${component.diagnostic_component_id} has a safety hold but hold_scope is none.`)
  }
  if (
    component.family_code === 'barrier_or_scale_modifier' &&
    hold.inflammation_first_required === true
  ) {
    warnings.push(
      `${component.diagnostic_component_id} is a barrier modifier; active inflammation needs separate evidence.`,
    )
  }
}

function validateClassificationItems(diagnosis, components, groupMap, errors, warnings) {
  const items = Array.isArray(diagnosis.classification_required_items)
    ? diagnosis.classification_required_items
    : []
  const componentMap = new Map(
    components.map((component) => [component.diagnostic_component_id, component]),
  )
  const itemIds = new Set()
  const itemByComponent = new Map()

  for (const item of items) {
    if (!item?.classification_id) {
      errors.push('A classification_required_item is missing classification_id.')
      continue
    }
    if (itemIds.has(item.classification_id)) {
      errors.push(`Duplicate classification_id ${item.classification_id}.`)
    }
    itemIds.add(item.classification_id)
    const component = componentMap.get(item.linked_component_id)
    if (!component) {
      errors.push(
        `${item.classification_id} references unknown component ${item.linked_component_id}.`,
      )
      continue
    }
    itemByComponent.set(component.diagnostic_component_id, item)
    if (!component.requires_doctor_classification) {
      errors.push(
        `${item.classification_id} exists but ${component.diagnostic_component_id} does not require classification.`,
      )
    }
    if (component.classification_id !== item.classification_id) {
      errors.push(
        `${component.diagnostic_component_id}.classification_id does not match ${item.classification_id}.`,
      )
    }
    if (!['insufficient_evidence', 'indeterminate'].includes(component.diagnostic_status)) {
      errors.push(
        `${item.classification_id} may be created only for an insufficient-evidence or indeterminate component.`,
      )
    }
    if (component.direct_cosmetic_treatment_status !== 'hold_until_doctor_classification') {
      errors.push(`${item.classification_id} component must be held until doctor classification.`)
    }
    if (!ALLOWED_CLASSIFICATION_TRIGGERS.has(item.classification_trigger)) {
      errors.push(`${item.classification_id}.classification_trigger is invalid.`)
    }
    if (isVagueLocation(item.clinical_location_text)) {
      errors.push(`${item.classification_id} lacks a precise location.`)
    }
    for (const groupId of uniqueStrings(item.linked_group_ids)) {
      if (!groupMap.has(groupId))
        errors.push(`${item.classification_id} links unknown group ${groupId}.`)
    }
    const options = Array.isArray(item.candidate_options) ? item.candidate_options : []
    if (options.length < 2 || options.length > 4) {
      errors.push(`${item.classification_id} must contain 2-4 candidate options.`)
    }
    const optionCodes = new Set()
    for (const option of options) {
      if (!option?.option_code || optionCodes.has(option.option_code)) {
        errors.push(`${item.classification_id} has a missing or duplicate option_code.`)
      }
      optionCodes.add(option?.option_code)
      if (!ALLOWED_FAMILIES.has(option?.family_code)) {
        errors.push(`${item.classification_id}.${option?.option_code} has invalid family_code.`)
      }
      const allowedSubtypes = ONTOLOGY.families?.[option?.family_code] || []
      if (allowedSubtypes.length && !allowedSubtypes.includes(option?.subtype_code)) {
        errors.push(`${item.classification_id}.${option?.option_code} has invalid subtype_code.`)
      }
      if (!ALLOWED_TREATMENT_PATTERNS.has(option?.treatment_pattern_code)) {
        errors.push(
          `${item.classification_id}.${option?.option_code} has invalid treatment_pattern_code.`,
        )
      }
      if (!ALLOWED_DIRECT_STATUSES.has(option?.direct_cosmetic_treatment_status)) {
        errors.push(
          `${item.classification_id}.${option?.option_code} has invalid treatment status.`,
        )
      }
    }
    const standards = uniqueStrings(item.standard_resolution_options)
    for (const required of STANDARD_CLASSIFICATION_RESOLUTIONS) {
      if (!standards.includes(required)) {
        errors.push(`${item.classification_id} omits standard resolution ${required}.`)
      }
    }

    const pathwaySignatures = new Set(
      options.map(
        (option) => `${option.treatment_pattern_code}|${option.direct_cosmetic_treatment_status}`,
      ),
    )
    if (pathwaySignatures.size === 1) {
      errors.push(
        `${item.classification_id} candidates share one treatment/safety pathway; use routine doctor signoff instead of a classification card.`,
      )
    }
    if (item.status && item.status !== 'pending') {
      warnings.push(`${item.classification_id} AI output should start with status=pending.`)
    }
  }

  for (const component of components) {
    if (
      component.requires_doctor_classification &&
      !itemByComponent.has(component.diagnostic_component_id)
    ) {
      errors.push(
        `${component.diagnostic_component_id} requires classification but has no classification_required_item.`,
      )
    }
    if (!component.requires_doctor_classification && component.classification_id) {
      errors.push(
        `${component.diagnostic_component_id} has classification_id but requires_doctor_classification=false.`,
      )
    }
  }

  if (items.length && diagnosis.diagnosis_status !== 'awaiting_targeted_doctor_classification') {
    errors.push(
      'Diagnosis with pending classification items must use awaiting_targeted_doctor_classification status.',
    )
  }
  if (!items.length && diagnosis.diagnosis_status === 'awaiting_targeted_doctor_classification') {
    errors.push(
      'Diagnosis status awaits targeted classification but no classification items exist.',
    )
  }
}

function isCriticalDiagnosisIssue(issue) {
  const text = String(issue || '')
  return [
    /Diagnosis has no diagnostic_components/i,
    /missing diagnostic_component_id/i,
    /Duplicate diagnostic component ID/i,
    /classification_required_item is missing classification_id/i,
    /Duplicate classification_id/i,
    /references unknown component/i,
    /requires classification but has no classification_required_item/i,
    /must contain 2-4 candidate options/i,
    /missing or duplicate option_code/i,
  ].some((pattern) => pattern.test(text))
}

export function validatePigmentationDiagnosis(diagnosis, phenotype) {
  const errors = []
  const warnings = []
  if (!isObject(diagnosis)) {
    throw new PigmentationValidationError('Diagnosis must be an object.', [
      'Diagnosis was not JSON.',
    ])
  }
  const codeNormalizations = canonicalizePigmentationDiagnosisCodes(diagnosis)
  if (codeNormalizations.length) {
    warnings.push(
      `Canonicalised ${codeNormalizations.length} generic diagnosis subtype placeholder(s).`,
    )
  }
  assertDiagnosisCopiedImmutableMetrics(diagnosis, phenotype)

  const groups = phenotype?.morphology_groups || []
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
      errors.push(`Diagnosis does not resolve group ${group.group_id}.`)
    }
  }

  const components = Array.isArray(diagnosis.diagnostic_components)
    ? diagnosis.diagnostic_components
    : []
  if (!components.length && groups.length) errors.push('Diagnosis has no diagnostic_components.')

  const componentIds = new Set()
  for (const component of components) {
    const id = component?.diagnostic_component_id
    if (!id) errors.push('A diagnostic component is missing diagnostic_component_id.')
    else if (componentIds.has(id)) errors.push(`Duplicate diagnostic component ID: ${id}.`)
    else componentIds.add(id)

    const family = component.family_code || component.family
    const subtype = component.subtype_code || component.subtype
    if (!ALLOWED_FAMILIES.has(family)) errors.push(`${id} has invalid family_code ${family}.`)
    const allowedSubtypes = ONTOLOGY.families?.[family] || []
    if (allowedSubtypes.length && !allowedSubtypes.includes(subtype)) {
      errors.push(`${id} has invalid subtype_code ${subtype} for ${family}.`)
    }
    if (!component.diagnosis_label) errors.push(`${id}.diagnosis_label is required.`)
    if (!ALLOWED_COMPONENT_ROLES.has(component.component_role)) {
      errors.push(`${id} has invalid component_role ${component.component_role}.`)
    }
    if (!ALLOWED_COMPONENT_ACTIVITY.has(component.activity)) {
      errors.push(`${id} has invalid activity ${component.activity}.`)
    }
    if (!ALLOWED_COMPONENT_DEPTH.has(component.depth)) {
      errors.push(`${id} has invalid depth ${component.depth}.`)
    }
    if (!ALLOWED_TREATMENT_PATTERNS.has(component.treatment_pattern_code)) {
      errors.push(`${id} has invalid treatment_pattern_code ${component.treatment_pattern_code}.`)
    }
    if (!ALLOWED_DIAGNOSTIC_STATUSES.has(component.diagnostic_status)) {
      errors.push(`${id} has invalid diagnostic_status ${component.diagnostic_status}.`)
    }
    if (!ALLOWED_DIRECT_STATUSES.has(component.direct_cosmetic_treatment_status)) {
      errors.push(`${id} has invalid direct_cosmetic_treatment_status.`)
    }

    const linkedIds = uniqueStrings(component.linked_group_ids)
    if (!linkedIds.length && family !== 'no_significant_diffuse_pigmentation') {
      errors.push(`${id} has no linked observation group.`)
    }
    for (const groupId of linkedIds) {
      if (!groupMap.has(groupId)) errors.push(`${id} links unknown group ${groupId}.`)
    }
    if (isVagueLocation(component.clinical_location_text) && linkedIds.length) {
      errors.push(`${id} lacks a doctor-usable clinical_location_text.`)
    }

    const linkedGroups = linkedIds.map((groupId) => groupMap.get(groupId)).filter(Boolean)
    if (
      linkedGroups.length === 1 &&
      normalizeText(component.clinical_location_text) !==
        normalizeText(linkedGroups[0].clinical_location_text)
    ) {
      errors.push(`${id}.clinical_location_text must copy its linked observation location exactly.`)
    }
    if (
      linkedGroups.some((group) => group.measurement_role === 'raised_pigmented_lesion') &&
      [
        'background_photomelanosis',
        'few_isolated_flat_lentiginous_lesions',
        'multifocal_or_regional_flat_pigment',
      ].includes(component.treatment_pattern_code)
    ) {
      errors.push(`${id} maps a raised group to a flat-pigment treatment pattern.`)
    }
    if (
      linkedGroups.length &&
      linkedGroups.every((group) =>
        ['global_background_melanin', 'flat_focal_pigmented_lesion'].includes(
          group.measurement_role,
        ),
      ) &&
      component.treatment_pattern_code === 'raised_sk_dpn_like'
    ) {
      errors.push(`${id} maps flat pigment observations to a raised-lesion treatment pattern.`)
    }
    if (
      linkedGroups.length &&
      linkedGroups.every(
        (group) => group.record_class === 'pigmentation_contributor_or_modifier',
      ) &&
      component.component_role === 'primary_pigment_target'
    ) {
      errors.push(
        `${id} promotes contributor/modifier-only observations to a primary pigment target.`,
      )
    }
    if (
      linkedGroups.some((group) => group.modifier_type === 'structural_shadow') &&
      component.treatment_pattern_code !== 'structural_shadow'
    ) {
      errors.push(`${id} must keep structural shadow separate from pigment treatment patterns.`)
    }

    if (
      family === 'active_inflammatory_process' &&
      linkedGroups.length &&
      linkedGroups.every(
        (group) =>
          group.record_class === 'pigmentation_contributor_or_modifier' &&
          group.modifier_type === 'barrier_or_scale_change',
      )
    ) {
      errors.push(`${id} calls a scale/barrier-only observation active inflammation.`)
    }

    validateComponentHold(component, groupMap, errors, warnings)
  }

  for (const resolution of resolutions) {
    if (!groupMap.has(resolution.group_id)) {
      errors.push(`Diagnosis resolution contains unknown group ${resolution.group_id}.`)
    }
    if (
      resolution.resolution === 'mapped' &&
      !componentIds.has(resolution.diagnostic_component_id)
    ) {
      errors.push(
        `Resolution for ${resolution.group_id} points to missing component ${resolution.diagnostic_component_id}.`,
      )
    }
    if (resolution.resolution === 'excluded' && !resolution.exclusion_reason) {
      errors.push(`Excluded group ${resolution.group_id} requires an exclusion_reason.`)
    }
  }

  validateClassificationItems(diagnosis, components, groupMap, errors, warnings)

  const serialized = JSON.stringify(diagnosis).toLowerCase()
  if (serialized.includes('request_closeup') || serialized.includes('dermoscop')) {
    warnings.push(
      'V2.6 should use targeted direct doctor classification instead of routine close-up or dermoscopy requests.',
    )
  }

  const criticalErrors = errors.filter(isCriticalDiagnosisIssue)
  const advisoryErrors = errors.filter((issue) => !isCriticalDiagnosisIssue(issue))
  warnings.push(...advisoryErrors)

  if (criticalErrors.length) {
    throw new PigmentationValidationError(
      `Pigmentation diagnosis is unusable. ${criticalErrors.map((e) => `- ${e}`).join(' ')}`,
      criticalErrors,
      uniqueStrings(warnings),
    )
  }

  diagnosis.validation_metadata = {
    ...(diagnosis.validation_metadata || {}),
    diagnosis_code_contract_revision: 'v2_6_1_r3',
    validation_policy_revision: 'presence_and_safety_v2_7',
    diagnosis_code_normalizations: codeNormalizations,
    status: warnings.length ? 'usable_with_warnings' : 'usable',
    warnings: uniqueStrings(warnings),
  }
  return { valid: true, errors: [], warnings: uniqueStrings(warnings), diagnosis }
}

export function initializeDoctorClassificationState(diagnosis, existing = {}) {
  const state = {}
  for (const item of diagnosis?.classification_required_items || []) {
    const prior = existing?.[item.classification_id]
    state[item.classification_id] = prior
      ? clone(prior)
      : {
          status: 'pending',
          resolution_type: null,
          option_code: null,
          doctor_note: '',
          resolved_at_iso: null,
        }
  }
  return state
}

export function getPendingDoctorClassificationItems(diagnosis, doctorClassifications = {}) {
  return (diagnosis?.classification_required_items || []).filter(
    (item) => doctorClassifications?.[item.classification_id]?.status !== 'resolved',
  )
}

export function assertNoPendingDoctorClassifications(diagnosis, doctorClassifications = {}) {
  const pending = getPendingDoctorClassificationItems(diagnosis, doctorClassifications)
  if (pending.length) {
    throw new PigmentationValidationError('Targeted doctor classification is still required.', [
      ...pending.map(
        (item) =>
          `${item.classification_id}: ${item.clinical_location_text || item.unresolved_question}`,
      ),
    ])
  }
  return true
}

function resolveClassificationIntoComponent(component, item, resolution) {
  const updated = clone(component)
  const type = resolution.resolution_type
  if (!ALLOWED_CLASSIFICATION_RESOLUTIONS.has(type)) {
    throw new PigmentationValidationError(`Invalid classification resolution ${type}.`, [
      `Allowed: ${[...ALLOWED_CLASSIFICATION_RESOLUTIONS].join(', ')}`,
    ])
  }

  if (type === 'candidate_selected') {
    const option = (item.candidate_options || []).find(
      (candidate) => candidate.option_code === resolution.option_code,
    )
    if (!option) {
      throw new PigmentationValidationError(`Unknown candidate ${resolution.option_code}.`, [
        `${item.classification_id} does not offer that option.`,
      ])
    }
    updated.family_code = option.family_code
    updated.family = option.family_code
    updated.subtype_code = option.subtype_code
    updated.subtype = option.subtype_code
    updated.treatment_pattern_code = option.treatment_pattern_code
    updated.direct_cosmetic_treatment_status = option.direct_cosmetic_treatment_status
    updated.diagnosis_label = option.label
    updated.subtype_label = option.label
    updated.diagnostic_status = 'doctor_reclassified'
  } else if (type === 'not_pigmentation_relevant') {
    updated.component_role = 'not_pigmentation_relevant'
    updated.family_code = 'non_pigmentation_relevant_finding'
    updated.family = 'non_pigmentation_relevant_finding'
    updated.subtype_code = 'not_pigmentation_relevant'
    updated.subtype = 'not_pigmentation_relevant'
    updated.treatment_pattern_code = 'observe_only'
    updated.direct_cosmetic_treatment_status = 'not_applicable'
    updated.diagnosis_label = 'Not relevant to the pigmentation treatment plan'
    updated.subtype_label = 'Not a pigmentation treatment target'
    updated.diagnostic_status = 'doctor_reclassified'
  } else if (type === 'exclude_from_cosmetic_treatment') {
    updated.component_role = 'safety_exclusion'
    updated.family_code = 'unclassified_pigmentation'
    updated.family = 'unclassified_pigmentation'
    updated.subtype_code = 'indeterminate_excluded_from_cosmetic_treatment'
    updated.subtype = 'indeterminate_excluded_from_cosmetic_treatment'
    updated.treatment_pattern_code = 'unclassified_hold'
    updated.direct_cosmetic_treatment_status = 'hold_until_doctor_assessment'
    updated.diagnosis_label = 'Indeterminate finding excluded from cosmetic treatment'
    updated.subtype_label = 'Do not treat cosmetically'
    updated.diagnostic_status = 'doctor_reclassified'
  } else if (type === 'separate_medical_evaluation') {
    updated.component_role = 'safety_exclusion'
    updated.family_code = 'medically_atypical_focal_lesion'
    updated.family = 'medically_atypical_focal_lesion'
    updated.subtype_code = 'requires_separate_medical_evaluation'
    updated.subtype = 'requires_separate_medical_evaluation'
    updated.treatment_pattern_code = 'medical_control_only'
    updated.direct_cosmetic_treatment_status = 'hold_until_doctor_assessment'
    updated.diagnosis_label = 'Finding requiring separate medical evaluation'
    updated.subtype_label = 'Separate medical assessment required'
    updated.diagnostic_status = 'doctor_reclassified'
  }

  updated.requires_doctor_classification = false
  updated.classification_id = null
  updated.doctor_classification = {
    classification_id: item.classification_id,
    resolution_type: type,
    option_code: resolution.option_code || null,
    doctor_note: resolution.doctor_note || '',
    resolved_at_iso: resolution.resolved_at_iso || new Date().toISOString(),
  }
  return updated
}

export function applyDoctorClassificationsToDiagnosis(diagnosis, doctorClassifications = {}) {
  assertNoPendingDoctorClassifications(diagnosis, doctorClassifications)
  const resolved = clone(diagnosis)
  const itemMap = new Map(
    (resolved.classification_required_items || []).map((item) => [item.classification_id, item]),
  )
  resolved.diagnostic_components = (resolved.diagnostic_components || []).map((component) => {
    if (!component.requires_doctor_classification || !component.classification_id) return component
    const item = itemMap.get(component.classification_id)
    const resolution = doctorClassifications[component.classification_id]
    return resolveClassificationIntoComponent(component, item, resolution)
  })
  resolved.resolved_classification_items = (resolved.classification_required_items || []).map(
    (item) => ({
      ...item,
      status: 'resolved',
      resolution: clone(doctorClassifications[item.classification_id]),
    }),
  )
  resolved.classification_required_items = []
  resolved.doctor_classification_resolutions = clone(doctorClassifications)
  resolved.diagnosis_status = resolved.diagnostic_components.some(
    (component) => component.family_code === 'medically_atypical_focal_lesion',
  )
    ? 'complete_pending_doctor_confirmation'
    : 'complete_pending_doctor_confirmation'
  return resolved
}

export function assertDiagnosisReadyForTreatmentPlanning(
  diagnosis,
  phenotype,
  doctorClassifications = null,
) {
  validatePigmentationDiagnosis(diagnosis, phenotype)
  if (diagnosis.diagnosis_status === 'blocked_for_medical_assessment') {
    throw new PigmentationValidationError('Diagnosis is blocked for medical assessment.', [
      'Treatment planning cannot proceed for the blocked finding.',
    ])
  }
  if (doctorClassifications) {
    assertNoPendingDoctorClassifications(diagnosis, doctorClassifications)
  } else if ((diagnosis.classification_required_items || []).length) {
    throw new PigmentationValidationError('Targeted doctor classification is required.', [
      'Resolve all classification_required_items before treatment planning.',
    ])
  }
  return {
    valid: true,
    errors: [],
    warnings: diagnosis.validation_metadata?.warnings || [],
    diagnosis,
  }
}

export function buildCompactPhenotypeForDiagnosis(validated) {
  return {
    immutable_image_metrics: extractImmutablePigmentationMetrics(validated),
    image_quality: validated.image_quality || {},
    region_review: validated.region_review || {},
    region_review_reconciliation: validated.region_review_reconciliation || {},
    background_profile: validated.background_profile || {},
    pigmentation_phenotypes: (validated.pigmentation_phenotypes || []).map((group) => ({
      group_id: group.group_id,
      phenotype_type: group.phenotype_type,
      primary_lesion_type: group.primary_lesion_type,
      clinical_location_text: group.clinical_location_text,
      anatomical_regions: group.anatomical_regions,
      patient_side: group.patient_side,
      surface: group.surface,
      elevation: group.elevation,
      distribution: group.distribution,
      count_band: group.count_band,
      colour_description: group.colour_description,
      mode_evidence: group.mode_evidence,
      measurement_role: group.measurement_role,
      presence_status: group.presence_status,
      unresolved_visual_property: group.unresolved_visual_property || 'none',
      confidence_100: group.confidence_100,
    })),
    pigmentation_contributors_and_modifiers: (
      validated.pigmentation_contributors_and_modifiers || []
    ).map((group) => ({
      group_id: group.group_id,
      modifier_type: group.modifier_type,
      primary_lesion_type: group.primary_lesion_type,
      clinical_location_text: group.clinical_location_text,
      anatomical_regions: group.anatomical_regions,
      patient_side: group.patient_side,
      visible_finding: group.visible_finding,
      pigmentation_relevance: group.pigmentation_relevance,
      treatment_modifier_role: group.treatment_modifier_role,
      scope: group.scope,
      surface: group.surface,
      elevation: group.elevation,
      distribution: group.distribution,
      mode_evidence: group.mode_evidence,
      measurement_role: group.measurement_role,
      presence_status: group.presence_status,
      confidence_100: group.confidence_100,
    })),
    safety_and_image_limitations: validated.safety_and_image_limitations || [],
    phenotype_summary_for_doctor: validated.phenotype_summary_for_doctor || '',
  }
}
