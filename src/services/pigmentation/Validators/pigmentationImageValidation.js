/**
 * Pigmentation Decode V2.3 — deterministic morphology, phenotype and diagnosis validation.
 *
 * This module is deliberately responsible for more than arithmetic. It enforces the
 * clinical data contract that prevents visually distinct populations from disappearing
 * between image analysis, diagnosis, treatment planning and reassessment.
 *
 * PIPELINE OWNERSHIP
 * 1. validatePigmentationMorphologyCensus()
 *    Validates the exhaustive region-by-region morphology inventory and precise locations.
 * 2. validateAndScorePigmentationImageAnalysis()
 *    Validates phenotype measurement against the locked census and calculates every score.
 * 3. validatePigmentationDiagnosis()
 *    Verifies immutable metrics, complete morphology-group resolution and report readiness.
 * 4. assertDiagnosisReadyForTreatmentPlanning()
 *    Blocks planning when phenotype reanalysis or unresolved diagnosis work remains.
 *
 * IMPORTANT
 * - Model-generated score_100, severity_label and score_source are never authoritative.
 * - Presence is a visual conclusion and is independent of burden severity.
 * - A minimal score must never erase a present or uncertain morphology group.
 * - Diagnosis may flag a visual discrepancy, but may not silently repair the phenotype record.
 * - No external dependencies.
 */

import PIGMENTATION_CONFIG, {
  assertPigmentationPolicyCompatibility,
  calculatePigmentationBurdenIndex,
  getPigmentationScoringProfile,
  pigmentationSeverityLabel as configPigmentationSeverityLabel,
} from 'src/services/pigmentationConfigV2'

const REQUIRED_IMAGE_MODES = [...PIGMENTATION_CONFIG.image_acquisition.required_modes]
const CANONICAL_REGIONS = new Set(
  PIGMENTATION_CONFIG.anatomical_location_contract.canonical_regions,
)
const BACKGROUND_REPORTING_REGIONS = [
  ...PIGMENTATION_CONFIG.anatomical_location_contract.background_reporting_regions,
]
const LANDMARK_TERMS = new Set(
  PIGMENTATION_CONFIG.anatomical_location_contract.landmark_terms,
)
const COUNT_BANDS = new Set(PIGMENTATION_CONFIG.anatomical_location_contract.count_bands)

const REQUIRED_CENSUS_REVIEW_REGIONS = [
  'forehead',
  'glabella',
  'right_temple',
  'left_temple',
  'right_periocular',
  'left_periocular',
  'right_outer_malar',
  'left_outer_malar',
  'right_central_malar',
  'left_central_malar',
  'right_medial_malar',
  'left_medial_malar',
  'nose_bridge',
  'right_nasal_ala',
  'left_nasal_ala',
  'upper_lip_perioral',
  'right_oral_commissure',
  'left_oral_commissure',
  'lower_lip_perioral',
  'chin',
  'right_jawline',
  'left_jawline',
]

const IMAGE_QUALITY_VALUES = new Set(['usable', 'limited', 'not_usable'])
const PRESENCE_VALUES = new Set(['present', 'absent', 'uncertain'])
const CENSUS_PRESENCE_VALUES = new Set(['present', 'uncertain'])
const REGION_PRESENCE_VALUES = new Set(['present', 'absent', 'uncertain'])
const REGION_STRUCTURAL_VALUES = new Set([
  'present',
  'absent',
  'uncertain',
  'not_applicable',
])
const CLINICAL_RELEVANCE_VALUES = new Set(
  PIGMENTATION_CONFIG.phenotype_pipeline_contract.clinical_relevance_values,
)
const MORPHOLOGY_VALUES = new Set(
  PIGMENTATION_CONFIG.phenotype_pipeline_contract.morphology_values,
)
const SURFACE_VALUES = new Set(
  PIGMENTATION_CONFIG.phenotype_pipeline_contract.surface_values,
)
const ELEVATION_VALUES = new Set(
  PIGMENTATION_CONFIG.phenotype_pipeline_contract.elevation_values,
)
const BURDEN_CATEGORIES = new Set(
  PIGMENTATION_CONFIG.phenotype_pipeline_contract.burden_categories,
)
const PATIENT_SIDE_VALUES = new Set(['right', 'left', 'bilateral', 'midline', 'not_applicable'])
const IMAGE_SIDE_VALUES = new Set(['left', 'right', 'bilateral', 'midline', 'not_applicable'])
const DISTRIBUTION_VALUES = new Set([
  'isolated',
  'scattered',
  'multifocal_scattered',
  'multifocal_clustered',
  'regional',
  'diffuse',
  'confluent',
  'reticular',
  'bilateral_symmetric',
  'bilateral_asymmetric',
  'other',
])
const LATERALITY_DETAIL_VALUES = new Set([
  'absent',
  'present_less_prominent',
  'present_similar',
  'present_more_prominent',
  'not_applicable',
])

const LOCALIZED_INDEX_DEFINITIONS = {
  active_inflammatory_lesion_burden_index: {
    profile_id: 'active_inflammatory_lesion',
    burden_category: 'active_inflammatory_lesion',
  },
  flat_focal_pigmented_lesion_burden_index: {
    profile_id: 'flat_focal_pigment',
    burden_category: 'flat_focal_pigmented_lesion',
  },
  raised_pigmented_lesion_burden_index: {
    profile_id: 'raised_pigmented_lesion',
    burden_category: 'raised_pigmented_lesion',
  },
  structural_periocular_shadow_burden_index: {
    profile_id: 'structural_periocular_shadow',
    burden_category: 'structural_periocular_shadow',
  },
}

const IMMUTABLE_METRIC_SOURCE_MAP = {
  global_background_melanin_load_index: {
    path: ['global_background_indices', 'melanin_load_index'],
    burden_category: 'global_background_melanin',
  },
  global_background_erythema_load_index: {
    path: ['global_background_indices', 'erythema_load_index'],
    burden_category: 'global_background_erythema',
  },
  active_inflammatory_lesion_burden_index: {
    path: ['localized_burden_indices', 'active_inflammatory_lesion_burden_index'],
    burden_category: 'active_inflammatory_lesion',
  },
  flat_focal_pigmented_lesion_burden_index: {
    path: ['localized_burden_indices', 'flat_focal_pigmented_lesion_burden_index'],
    burden_category: 'flat_focal_pigmented_lesion',
  },
  raised_pigmented_lesion_burden_index: {
    path: ['localized_burden_indices', 'raised_pigmented_lesion_burden_index'],
    burden_category: 'raised_pigmented_lesion',
  },
  structural_periocular_shadow_burden_index: {
    path: ['localized_burden_indices', 'structural_periocular_shadow_burden_index'],
    burden_category: 'structural_periocular_shadow',
  },
}

const BROAD_LOCATION_ONLY_PATTERNS = new Set([
  'face',
  'whole face',
  'cheek',
  'cheeks',
  'pigmented area',
  'pigmented areas',
  'affected area',
  'affected region',
])

const GROUP_ID_PATTERN = /^MG_[0-9]{3,}$/
const COMPONENT_ID_PATTERN = /^DC_[0-9]{3,}$/

export class PigmentationImageValidationError extends Error {
  constructor(message, issues = []) {
    const suffix = issues.length ? `\n- ${issues.join('\n- ')}` : ''
    super(`${message}${suffix}`)
    this.name = 'PigmentationImageValidationError'
    this.issues = issues
  }
}

export class PigmentationPhenotypeDiscrepancyError extends PigmentationImageValidationError {
  constructor(issues = []) {
    super(
      'Phenotype measurement contains a material visual discrepancy and must be reanalysed.',
      issues,
    )
    this.name = 'PigmentationPhenotypeDiscrepancyError'
    this.code = 'PIGMENTATION_PHENOTYPE_REANALYSIS_REQUIRED'
  }
}

export class PigmentationDiagnosisValidationError extends Error {
  constructor(message, issues = []) {
    const suffix = issues.length ? `\n- ${issues.join('\n- ')}` : ''
    super(`${message}${suffix}`)
    this.name = 'PigmentationDiagnosisValidationError'
    this.issues = issues
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
}

function deepClone(value) {
  if (typeof globalThis.structuredClone === 'function') {
    return globalThis.structuredClone(value)
  }
  return JSON.parse(JSON.stringify(value))
}

function stableSortObject(value) {
  if (Array.isArray(value)) return value.map(stableSortObject)
  if (!isPlainObject(value)) return value

  return Object.keys(value)
    .sort()
    .reduce((output, key) => {
      output[key] = stableSortObject(value[key])
      return output
    }, {})
}

function deepEqualJson(left, right) {
  return JSON.stringify(stableSortObject(left)) === JSON.stringify(stableSortObject(right))
}

function uniqueStrings(values) {
  return [...new Set(asArray(values).filter(isNonEmptyString))]
}

function setEquals(leftValues, rightValues) {
  const left = new Set(leftValues)
  const right = new Set(rightValues)
  if (left.size !== right.size) return false
  for (const value of left) if (!right.has(value)) return false
  return true
}

function getByPath(object, path) {
  return path.reduce((value, key) => value?.[key], object)
}

function assertObject(value, path, errors) {
  if (!isPlainObject(value)) errors.push(`${path} must be an object.`)
}

function assertArray(value, path, errors, { minLength = 0 } = {}) {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array.`)
    return
  }
  if (value.length < minLength) errors.push(`${path} must contain at least ${minLength} item(s).`)
}

function assertBoolean(value, path, errors) {
  if (typeof value !== 'boolean') errors.push(`${path} must be boolean.`)
}

function assertEnum(value, allowed, path, errors) {
  if (!allowed.has(value)) {
    errors.push(`${path} has invalid value ${String(value)}.`)
  }
}

function assertNumber100(value, path, errors) {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    errors.push(`${path} must be a finite number from 0 to 100; received ${String(value)}.`)
  }
}

function assertNonEmptyString(value, path, errors) {
  if (!isNonEmptyString(value)) errors.push(`${path} must be a non-empty string.`)
}

function assertUniqueIds(items, idField, pattern, path, errors) {
  const seen = new Set()
  asArray(items).forEach((item, index) => {
    const id = item?.[idField]
    if (!isNonEmptyString(id) || !pattern.test(id)) {
      errors.push(`${path}[${index}].${idField} must match ${String(pattern)}.`)
      return
    }
    if (seen.has(id)) errors.push(`${path} contains duplicate ${idField} ${id}.`)
    seen.add(id)
  })
  return seen
}

function throwIfErrors(ErrorType, heading, errors) {
  if (errors.length) throw new ErrorType(heading, errors)
}

function validatePolicyVersion(policyVersion, path, errors) {
  if (!isNonEmptyString(policyVersion)) {
    errors.push(`${path} is required.`)
    return
  }
  try {
    assertPigmentationPolicyCompatibility(policyVersion)
  } catch (error) {
    errors.push(error.message)
  }
}

function validateRuntimeIdentity(raw, metadata, recordLabel, errors) {
  assertNonEmptyString(raw.session_id, `${recordLabel}.session_id`, errors)

  if (
    isNonEmptyString(metadata.configVersion) &&
    metadata.configVersion !== PIGMENTATION_CONFIG.version
  ) {
    errors.push(
      `${recordLabel} metadata configVersion ${metadata.configVersion} does not match ${PIGMENTATION_CONFIG.version}.`,
    )
  }
  if (
    isNonEmptyString(metadata.promptVersion) &&
    isNonEmptyString(raw.prompt_version) &&
    metadata.promptVersion !== raw.prompt_version
  ) {
    errors.push(
      `${recordLabel}.prompt_version ${raw.prompt_version} does not match metadata ${metadata.promptVersion}.`,
    )
  }
  if (
    isNonEmptyString(metadata.policyVersion) &&
    isNonEmptyString(raw.policy_version) &&
    metadata.policyVersion !== raw.policy_version
  ) {
    errors.push(
      `${recordLabel}.policy_version ${raw.policy_version} does not match metadata ${metadata.policyVersion}.`,
    )
  }
}

function validateModeSpecificFindings(findings, errors) {
  assertObject(findings, 'mode_specific_findings', errors)
  if (!isPlainObject(findings)) return
  for (const mode of REQUIRED_IMAGE_MODES) {
    assertArray(findings[mode], `mode_specific_findings.${mode}`, errors)
  }
}

function validateImageQuality(imageQuality, path, errors) {
  assertObject(imageQuality, path, errors)
  if (!isPlainObject(imageQuality)) return

  assertBoolean(imageQuality.overall_usable, `${path}.overall_usable`, errors)
  if (imageQuality.overall_usable !== true) {
    errors.push(`${path}.overall_usable must be true before clinical analysis can continue.`)
  }

  assertObject(imageQuality.mode_quality, `${path}.mode_quality`, errors)
  if (isPlainObject(imageQuality.mode_quality)) {
    for (const mode of REQUIRED_IMAGE_MODES) {
      assertEnum(
        imageQuality.mode_quality[mode],
        IMAGE_QUALITY_VALUES,
        `${path}.mode_quality.${mode}`,
        errors,
      )
    }

    const morphologyReferenceModes =
      PIGMENTATION_CONFIG.image_acquisition.morphology_reference_mode_order
    const usableMorphologyReference = morphologyReferenceModes.some(
      (mode) => imageQuality.mode_quality[mode] !== 'not_usable',
    )
    if (!usableMorphologyReference) {
      errors.push(
        `${path}.mode_quality must leave at least one morphology reference mode usable or limited.`,
      )
    }
  }

  if (imageQuality.limitations !== undefined && !Array.isArray(imageQuality.limitations)) {
    errors.push(`${path}.limitations must be an array.`)
  }
}

function expectedPatientSideFromRegions(regions) {
  const hasRight = regions.some((region) => region.startsWith('right_'))
  const hasLeft = regions.some((region) => region.startsWith('left_'))
  if (hasRight && hasLeft) return 'bilateral'
  if (hasRight) return 'right'
  if (hasLeft) return 'left'
  return null
}

function validateClinicalLocation(group, path, errors) {
  const text = normalizeText(group.clinical_location_text)
  assertNonEmptyString(group.clinical_location_text, `${path}.clinical_location_text`, errors)

  if (BROAD_LOCATION_ONLY_PATTERNS.has(text) || text.length < 24) {
    errors.push(
      `${path}.clinical_location_text is too broad; include patient side, subregion, landmark and distribution.`,
    )
  }

  const regions = uniqueStrings(group.anatomical_regions)
  if (!regions.length) {
    errors.push(`${path}.anatomical_regions must contain at least one canonical region.`)
  }
  for (const region of regions) {
    if (!CANONICAL_REGIONS.has(region)) {
      errors.push(`${path}.anatomical_regions contains unknown region ${region}.`)
    }
  }

  assertEnum(group.patient_side, PATIENT_SIDE_VALUES, `${path}.patient_side`, errors)
  assertEnum(group.image_display_side, IMAGE_SIDE_VALUES, `${path}.image_display_side`, errors)

  const expectedSide = expectedPatientSideFromRegions(regions)
  if (expectedSide && group.patient_side !== expectedSide) {
    errors.push(
      `${path}.patient_side is ${String(group.patient_side)} but anatomical_regions imply ${expectedSide}.`,
    )
  }

  if (group.patient_side === 'bilateral') {
    const hasRight = regions.some((region) => region.startsWith('right_'))
    const hasLeft = regions.some((region) => region.startsWith('left_'))
    if (!hasRight || !hasLeft) {
      errors.push(`${path} is bilateral but does not include both right- and left-sided regions.`)
    }
    if (!/(bilateral|both|right.+left|left.+right)/i.test(group.clinical_location_text || '')) {
      errors.push(`${path}.clinical_location_text must explicitly describe both sides.`)
    }
  }

  if (group.patient_side === 'right' && !/\bright\b/i.test(group.clinical_location_text || '')) {
    errors.push(`${path}.clinical_location_text must explicitly say patient right.`)
  }
  if (group.patient_side === 'left' && !/\bleft\b/i.test(group.clinical_location_text || '')) {
    errors.push(`${path}.clinical_location_text must explicitly say patient left.`)
  }

  assertArray(group.landmark_relationships, `${path}.landmark_relationships`, errors, {
    minLength: group.patient_side === 'not_applicable' ? 0 : 1,
  })
  for (const landmark of asArray(group.landmark_relationships)) {
    if (!LANDMARK_TERMS.has(landmark)) {
      errors.push(`${path}.landmark_relationships contains unknown landmark ${String(landmark)}.`)
    }
  }

  assertNonEmptyString(group.subregion_description, `${path}.subregion_description`, errors)
  assertEnum(group.distribution, DISTRIBUTION_VALUES, `${path}.distribution`, errors)
  assertEnum(group.count_band, COUNT_BANDS, `${path}.count_band`, errors)

  if (
    ['isolated', 'scattered', 'multifocal_scattered', 'multifocal_clustered'].includes(
      group.distribution,
    ) &&
    ['none', 'not_reliably_countable'].includes(group.count_band)
  ) {
    errors.push(`${path}.count_band must estimate a lesion count for ${group.distribution}.`)
  }

  if (group.distribution === 'isolated' && group.count_band !== '1_to_5') {
    errors.push(`${path}.count_band should be 1_to_5 for an isolated population.`)
  }

  assertObject(group.laterality_detail, `${path}.laterality_detail`, errors)
  if (isPlainObject(group.laterality_detail)) {
    assertEnum(
      group.laterality_detail.right,
      LATERALITY_DETAIL_VALUES,
      `${path}.laterality_detail.right`,
      errors,
    )
    assertEnum(
      group.laterality_detail.left,
      LATERALITY_DETAIL_VALUES,
      `${path}.laterality_detail.left`,
      errors,
    )

    if (group.patient_side === 'bilateral') {
      if (['absent', 'not_applicable'].includes(group.laterality_detail.right)) {
        errors.push(`${path}.laterality_detail.right must be present for a bilateral group.`)
      }
      if (['absent', 'not_applicable'].includes(group.laterality_detail.left)) {
        errors.push(`${path}.laterality_detail.left must be present for a bilateral group.`)
      }
    }
  }
}

function validateMorphologyBurdenCoherence(group, path, errors) {
  const category = group.burden_category
  const elevation = group.elevation
  const morphology = group.morphology

  if (category === 'raised_pigmented_lesion') {
    if (!['uncertain', 'probably_raised', 'raised'].includes(elevation)) {
      errors.push(`${path} is a raised-pigment group but elevation is ${String(elevation)}.`)
    }
    if (!['papule', 'plaque', 'mixed_maculopapular', 'other'].includes(morphology)) {
      errors.push(`${path} is a raised-pigment group but morphology is ${String(morphology)}.`)
    }
  }

  if (category === 'flat_focal_pigmented_lesion') {
    if (!['flat', 'probably_flat', 'uncertain'].includes(elevation)) {
      errors.push(`${path} is a flat focal-pigment group but elevation is ${String(elevation)}.`)
    }
    if (!['macule', 'patch', 'reticular', 'other'].includes(morphology)) {
      errors.push(`${path} is a flat focal-pigment group but morphology is ${String(morphology)}.`)
    }
  }

  if (category === 'active_inflammatory_lesion' && morphology !== 'active_inflammatory_lesion') {
    errors.push(`${path} must use morphology active_inflammatory_lesion for this burden category.`)
  }

  if (
    category === 'structural_periocular_shadow' &&
    morphology !== 'structural_shadow'
  ) {
    errors.push(`${path} must use morphology structural_shadow for this burden category.`)
  }

  if (
    category === 'barrier_or_scale_modifier' &&
    morphology !== 'scale_or_barrier_change' &&
    group.surface !== 'scaly'
  ) {
    errors.push(`${path} must identify scale/barrier morphology or a scaly surface.`)
  }

  if (
    ['probably_raised', 'raised'].includes(elevation) &&
    !['raised_pigmented_lesion', 'active_inflammatory_lesion'].includes(category)
  ) {
    errors.push(
      `${path} is ${elevation} but is not assigned to raised-pigment or active-inflammatory burden.`,
    )
  }
}

function validateMorphologyGroup(group, index, errors) {
  const path = `morphology_groups[${index}]`
  assertObject(group, path, errors)
  if (!isPlainObject(group)) return

  if (!GROUP_ID_PATTERN.test(group.group_id || '')) {
    errors.push(`${path}.group_id must match ${String(GROUP_ID_PATTERN)}.`)
  }
  assertEnum(group.clinical_relevance, CLINICAL_RELEVANCE_VALUES, `${path}.clinical_relevance`, errors)
  if (group.clinical_relevance === 'artifact_or_excluded') {
    errors.push(`${path} may not contain an artefact/excluded population; use artifact_and_exclusion_map.`)
  }
  validateClinicalLocation(group, path, errors)

  assertEnum(group.morphology, MORPHOLOGY_VALUES, `${path}.morphology`, errors)
  assertEnum(group.surface, SURFACE_VALUES, `${path}.surface`, errors)
  assertEnum(group.elevation, ELEVATION_VALUES, `${path}.elevation`, errors)
  assertEnum(group.burden_category, BURDEN_CATEGORIES, `${path}.burden_category`, errors)
  if (group.burden_category === 'none') {
    errors.push(`${path}.burden_category may not be none for a trackable morphology group.`)
  }
  assertEnum(group.presence_status, CENSUS_PRESENCE_VALUES, `${path}.presence_status`, errors)
  assertNonEmptyString(group.colour_description, `${path}.colour_description`, errors)
  assertNumber100(group.confidence_100, `${path}.confidence_100`, errors)

  assertArray(group.supporting_modes, `${path}.supporting_modes`, errors, { minLength: 1 })
  for (const mode of asArray(group.supporting_modes)) {
    if (!REQUIRED_IMAGE_MODES.includes(mode)) {
      errors.push(`${path}.supporting_modes contains unknown mode ${String(mode)}.`)
    }
  }
  if (!REQUIRED_IMAGE_MODES.includes(group.best_reference_mode)) {
    errors.push(`${path}.best_reference_mode must be one of the five required modes.`)
  }
  if (
    REQUIRED_IMAGE_MODES.includes(group.best_reference_mode) &&
    !asArray(group.supporting_modes).includes(group.best_reference_mode)
  ) {
    errors.push(`${path}.best_reference_mode must also appear in supporting_modes.`)
  }

  assertBoolean(
    group.request_closeup_recommended,
    `${path}.request_closeup_recommended`,
    errors,
  )
  assertBoolean(group.doctor_review_required, `${path}.doctor_review_required`, errors)
  assertBoolean(
    group.direct_cosmetic_treatment_allowed_pending_doctor_confirmation,
    `${path}.direct_cosmetic_treatment_allowed_pending_doctor_confirmation`,
    errors,
  )

  validateMorphologyBurdenCoherence(group, path, errors)
}

function groupMatchesRegionAndCategory(groups, region, category) {
  return groups.some(
    (group) =>
      asArray(group.anatomical_regions).includes(region) && group.burden_category === category,
  )
}

function validateRegionReview(regionReview, groups, errors) {
  assertArray(regionReview, 'region_review', errors, {
    minLength: REQUIRED_CENSUS_REVIEW_REGIONS.length,
  })
  if (!Array.isArray(regionReview)) return

  const seenRegions = new Set()
  regionReview.forEach((entry, index) => {
    const path = `region_review[${index}]`
    assertObject(entry, path, errors)
    if (!isPlainObject(entry)) return

    if (!REQUIRED_CENSUS_REVIEW_REGIONS.includes(entry.region)) {
      errors.push(`${path}.region contains unknown or non-checklist region ${String(entry.region)}.`)
    }
    if (seenRegions.has(entry.region)) errors.push(`region_review contains duplicate ${entry.region}.`)
    seenRegions.add(entry.region)

    assertEnum(
      entry.flat_pigmented_population,
      REGION_PRESENCE_VALUES,
      `${path}.flat_pigmented_population`,
      errors,
    )
    assertEnum(
      entry.raised_pigmented_population,
      REGION_PRESENCE_VALUES,
      `${path}.raised_pigmented_population`,
      errors,
    )
    assertEnum(
      entry.active_inflammatory_population,
      REGION_PRESENCE_VALUES,
      `${path}.active_inflammatory_population`,
      errors,
    )
    assertEnum(entry.structural_shadow, REGION_STRUCTURAL_VALUES, `${path}.structural_shadow`, errors)
    assertEnum(
      entry.barrier_or_scale_change,
      REGION_PRESENCE_VALUES,
      `${path}.barrier_or_scale_change`,
      errors,
    )
    assertNonEmptyString(entry.review_note, `${path}.review_note`, errors)

    const checks = [
      ['flat_pigmented_population', 'flat_focal_pigmented_lesion'],
      ['raised_pigmented_population', 'raised_pigmented_lesion'],
      ['active_inflammatory_population', 'active_inflammatory_lesion'],
      ['structural_shadow', 'structural_periocular_shadow'],
      ['barrier_or_scale_change', 'barrier_or_scale_modifier'],
    ]

    for (const [field, category] of checks) {
      if (entry[field] === 'not_applicable') continue
      const hasGroup = groupMatchesRegionAndCategory(groups, entry.region, category)
      if (['present', 'uncertain'].includes(entry[field]) && !hasGroup) {
        errors.push(
          `${path}.${field} is ${entry[field]} but no ${category} morphology group includes ${entry.region}.`,
        )
      }
      if (entry[field] === 'absent' && hasGroup) {
        errors.push(
          `${path}.${field} is absent but a ${category} morphology group includes ${entry.region}.`,
        )
      }
    }
  })

  for (const region of REQUIRED_CENSUS_REVIEW_REGIONS) {
    if (!seenRegions.has(region)) errors.push(`region_review is missing required region ${region}.`)
  }
}

function validateCensusCompleteness(completeness, groupIds, errors) {
  const path = 'census_completeness'
  assertObject(completeness, path, errors)
  if (!isPlainObject(completeness)) return

  const requiredTrueFields = [
    'all_required_regions_reviewed',
    'flat_and_raised_separation_completed',
    'right_outer_malar_raised_lesion_check_completed',
    'left_outer_malar_raised_lesion_check_completed',
    'periocular_check_completed',
    'perioral_check_completed',
    'all_visible_populations_represented',
  ]
  for (const field of requiredTrueFields) {
    if (completeness[field] !== true) errors.push(`${path}.${field} must be true.`)
  }

  assertArray(completeness.unresolved_visual_observations, `${path}.unresolved_visual_observations`, errors)
  if (asArray(completeness.unresolved_visual_observations).length) {
    errors.push(`${path}.unresolved_visual_observations must be empty before measurement.`)
  }

  assertArray(completeness.groups_requiring_closeup, `${path}.groups_requiring_closeup`, errors)
  for (const groupId of asArray(completeness.groups_requiring_closeup)) {
    if (!groupIds.has(groupId)) {
      errors.push(`${path}.groups_requiring_closeup references unknown group ${String(groupId)}.`)
    }
  }
}

function validateArtifactMap(artifacts, errors) {
  if (artifacts === undefined) return
  assertArray(artifacts, 'artifact_and_exclusion_map', errors)
  asArray(artifacts).forEach((artifact, index) => {
    const path = `artifact_and_exclusion_map[${index}]`
    assertObject(artifact, path, errors)
    if (!isPlainObject(artifact)) return
    assertNonEmptyString(artifact.artifact_id, `${path}.artifact_id`, errors)
    assertNonEmptyString(artifact.type, `${path}.type`, errors)
    assertNonEmptyString(artifact.region, `${path}.region`, errors)
    assertNonEmptyString(artifact.description, `${path}.description`, errors)
    if (artifact.excluded_from_morphology_groups !== true) {
      errors.push(`${path}.excluded_from_morphology_groups must be true.`)
    }
    assertNumber100(artifact.confidence_100, `${path}.confidence_100`, errors)
  })
}

/**
 * Validate the dedicated morphology census before it can be locked for measurement.
 *
 * @param {Record<string, any>} raw
 * @param {{modelVersion?: string, promptVersion?: string, configVersion?: string, policyVersion?: string}} [metadata]
 * @returns {Record<string, any>}
 */
export function validatePigmentationMorphologyCensus(raw, metadata = {}) {
  const errors = []
  if (!isPlainObject(raw)) {
    throw new PigmentationImageValidationError('Morphology census must be an object.')
  }

  if (raw.census_record_type !== 'pigmentation_morphology_census_pending_validation') {
    errors.push(
      'census_record_type must be pigmentation_morphology_census_pending_validation.',
    )
  }
  validateRuntimeIdentity(raw, metadata, 'morphology_census', errors)
  validatePolicyVersion(metadata.policyVersion ?? raw.policy_version, 'policy_version', errors)
  validateImageQuality(raw.image_quality, 'image_quality', errors)

  assertArray(raw.morphology_groups, 'morphology_groups', errors, { minLength: 1 })
  const groups = asArray(raw.morphology_groups)
  const groupIds = assertUniqueIds(
    groups,
    'group_id',
    GROUP_ID_PATTERN,
    'morphology_groups',
    errors,
  )
  groups.forEach((group, index) => validateMorphologyGroup(group, index, errors))

  validateRegionReview(raw.region_review, groups, errors)
  validateArtifactMap(raw.artifact_and_exclusion_map, errors)
  validateCensusCompleteness(raw.census_completeness, groupIds, errors)
  assertNonEmptyString(raw.morphology_summary_for_doctor, 'morphology_summary_for_doctor', errors)

  throwIfErrors(
    PigmentationImageValidationError,
    'Pigmentation morphology census failed validation.',
    errors,
  )

  return {
    ...deepClone(raw),
    policy_version: metadata.policyVersion ?? raw.policy_version,
    census_record_type: 'validated_pigmentation_morphology_census',
    validation_metadata: {
      status: 'application_validated_and_locked',
      model_version: metadata.modelVersion ?? null,
      prompt_version: metadata.promptVersion ?? raw.prompt_version ?? null,
      config_version: metadata.configVersion ?? PIGMENTATION_CONFIG.version,
      policy_version: metadata.policyVersion ?? raw.policy_version,
      validated_at_iso: new Date().toISOString(),
    },
  }
}

/**
 * @param {number} score
 * @returns {'minimal'|'mild'|'moderate'|'severe'|'very_severe'}
 */
export function pigmentationSeverityLabel(score) {
  return configPigmentationSeverityLabel(score)
}

/**
 * Validate measurement primitives for the correct burden-specific scoring profile.
 *
 * @param {unknown} primitives
 * @param {string} path
 * @param {string} [indexIdOrProfileId]
 */
export function assertValidMeasurementPrimitives(
  primitives,
  path,
  indexIdOrProfileId = 'background_area_contrast',
) {
  if (!isPlainObject(primitives)) {
    throw new PigmentationImageValidationError(
      `${path}.measurement_primitives must be an object.`,
    )
  }

  const profile = getPigmentationScoringProfile(indexIdOrProfileId)
  const errors = []
  for (const key of profile.primitive_keys) {
    assertNumber100(primitives[key], `${path}.measurement_primitives.${key}`, errors)
  }

  const unexpectedKeys = Object.keys(primitives).filter(
    (key) => !profile.primitive_keys.includes(key),
  )
  if (unexpectedKeys.length) {
    errors.push(
      `${path}.measurement_primitives contains keys not allowed by ${profile.profile_id}: ${unexpectedKeys.join(', ')}.`,
    )
  }

  throwIfErrors(
    PigmentationImageValidationError,
    `Measurement primitives failed validation at ${path}.`,
    errors,
  )
  return true
}

function removeModelGeneratedScoreFields(rawIndex) {
  if (!isPlainObject(rawIndex)) {
    throw new PigmentationImageValidationError('Burden index must be an object.')
  }

  const safeFields = { ...rawIndex }
  delete safeFields.score_100
  delete safeFields.severity_label
  delete safeFields.score_source
  return safeFields
}

/**
 * Calculate an authoritative burden index using its configured profile.
 *
 * @param {Record<string, any>} rawIndex
 * @param {string} path
 * @param {string} [indexIdOrProfileId]
 */
export function finalizeBurdenIndex(
  rawIndex,
  path,
  indexIdOrProfileId = 'background_area_contrast',
) {
  const safeFields = removeModelGeneratedScoreFields(rawIndex)
  assertValidMeasurementPrimitives(
    safeFields.measurement_primitives,
    path,
    indexIdOrProfileId,
  )

  const profile = getPigmentationScoringProfile(indexIdOrProfileId)
  if (
    isNonEmptyString(safeFields.scoring_profile_id) &&
    safeFields.scoring_profile_id !== profile.profile_id
  ) {
    throw new PigmentationImageValidationError(
      `${path}.scoring_profile_id is ${safeFields.scoring_profile_id}; expected ${profile.profile_id}.`,
    )
  }

  const score = calculatePigmentationBurdenIndex(
    safeFields.measurement_primitives,
    profile.profile_id,
  )
  if (safeFields.presence_status === 'absent' && score > 15) {
    throw new PigmentationImageValidationError(
      `${path} is marked absent but its calculated score is ${score}; review presence or primitives.`,
    )
  }

  return {
    ...safeFields,
    scoring_profile_id: profile.profile_id,
    score_100: score,
    severity_label: pigmentationSeverityLabel(score),
    score_source: 'application_fixed_profile_aggregation',
  }
}

function finalizeRegionalBackground(rawRegion, index) {
  const path = `regional_background_analysis[${index}]`
  if (!isPlainObject(rawRegion)) {
    throw new PigmentationImageValidationError(`${path} must be an object.`)
  }

  const melanin = finalizeBurdenIndex(
    rawRegion.background_melanin_measurement,
    `${path}.background_melanin_measurement`,
    'background_area_contrast',
  )
  const erythema = finalizeBurdenIndex(
    rawRegion.background_erythema_measurement,
    `${path}.background_erythema_measurement`,
    'background_area_contrast',
  )

  const safeRegion = { ...rawRegion }
  delete safeRegion.background_melanin_load_index
  delete safeRegion.background_erythema_load_index
  delete safeRegion.background_melanin_severity_label
  delete safeRegion.background_erythema_severity_label

  return {
    ...safeRegion,
    background_melanin_measurement: melanin,
    background_erythema_measurement: erythema,
    background_melanin_load_index: melanin.score_100,
    background_erythema_load_index: erythema.score_100,
    background_melanin_severity_label: melanin.severity_label,
    background_erythema_severity_label: erythema.severity_label,
  }
}

function validateLockedMorphologyGroups(rawGroups, lockedCensus, errors) {
  if (!isPlainObject(lockedCensus)) {
    errors.push('A validated lockedMorphologyCensus is required for V2.3 phenotype measurement.')
    return []
  }
  if (lockedCensus.census_record_type !== 'validated_pigmentation_morphology_census') {
    errors.push('lockedMorphologyCensus must be a validated_pigmentation_morphology_census record.')
  }

  const lockedGroups = asArray(lockedCensus.morphology_groups)
  if (!Array.isArray(rawGroups)) {
    errors.push('morphology_groups must be an array copied from the locked census.')
    return lockedGroups
  }

  if (!deepEqualJson(rawGroups, lockedGroups)) {
    errors.push(
      'Phenotype measurement changed the locked morphology_groups. Groups and clinical_location_text must be copied unchanged.',
    )
  }
  return lockedGroups
}

function validateBurdenPresenceAndLinks(index, indexKey, definition, groups, errors) {
  const path = `localized_burden_indices.${indexKey}`
  assertObject(index, path, errors)
  if (!isPlainObject(index)) return

  assertEnum(index.presence_status, PRESENCE_VALUES, `${path}.presence_status`, errors)
  assertNumber100(index.confidence_100, `${path}.confidence_100`, errors)
  assertNonEmptyString(index.summary, `${path}.summary`, errors)
  assertArray(index.linked_group_ids, `${path}.linked_group_ids`, errors)

  const expectedGroupIds = groups
    .filter((group) => group.burden_category === definition.burden_category)
    .map((group) => group.group_id)
  const actualGroupIds = uniqueStrings(index.linked_group_ids)

  if (!setEquals(expectedGroupIds, actualGroupIds)) {
    errors.push(
      `${path}.linked_group_ids must exactly match groups assigned to ${definition.burden_category}. ` +
        `Expected [${expectedGroupIds.join(', ')}], received [${actualGroupIds.join(', ')}].`,
    )
  }

  if (expectedGroupIds.length && index.presence_status === 'absent') {
    errors.push(`${path}.presence_status cannot be absent while linked morphology groups exist.`)
  }
  if (!expectedGroupIds.length && index.presence_status !== 'absent') {
    errors.push(
      `${path}.presence_status must be absent when the locked census has no matching morphology group. ` +
        'A newly noticed population must be reported as phenotype_discrepancy instead.',
    )
  }

  if (index.scoring_profile_id !== definition.profile_id) {
    errors.push(`${path}.scoring_profile_id must be ${definition.profile_id}.`)
  }
}

function validateGlobalIndex(index, path, errors) {
  assertObject(index, path, errors)
  if (!isPlainObject(index)) return
  assertEnum(index.presence_status, PRESENCE_VALUES, `${path}.presence_status`, errors)
  assertNumber100(index.confidence_100, `${path}.confidence_100`, errors)
  assertArray(index.included_components, `${path}.included_components`, errors)
  assertArray(index.excluded_components, `${path}.excluded_components`, errors)
  assertNonEmptyString(index.summary, `${path}.summary`, errors)
}

function validateRegionalBackground(rawRegional, groups, errors) {
  assertArray(rawRegional, 'regional_background_analysis', errors, {
    minLength: BACKGROUND_REPORTING_REGIONS.length,
  })
  if (!Array.isArray(rawRegional)) return

  const seen = new Set()
  rawRegional.forEach((region, index) => {
    const path = `regional_background_analysis[${index}]`
    assertObject(region, path, errors)
    if (!isPlainObject(region)) return

    if (!BACKGROUND_REPORTING_REGIONS.includes(region.region)) {
      errors.push(`${path}.region contains unsupported background reporting region ${String(region.region)}.`)
    }
    if (seen.has(region.region)) errors.push(`regional_background_analysis duplicates ${region.region}.`)
    seen.add(region.region)

    validateGlobalIndex(region.background_melanin_measurement, `${path}.background_melanin_measurement`, errors)
    validateGlobalIndex(region.background_erythema_measurement, `${path}.background_erythema_measurement`, errors)

    const hasSeparatePopulations = groups.some((group) => {
      if (
        ![
          'flat_focal_pigmented_lesion',
          'raised_pigmented_lesion',
          'active_inflammatory_lesion',
          'structural_periocular_shadow',
        ].includes(group.burden_category)
      ) {
        return false
      }

      const regionMap = {
        right_malar: ['right_outer_malar', 'right_central_malar', 'right_medial_malar'],
        left_malar: ['left_outer_malar', 'left_central_malar', 'left_medial_malar'],
        periocular: ['right_periocular', 'left_periocular'],
        chin_jaw: ['chin', 'right_jawline', 'left_jawline'],
      }
      const mappedRegions = regionMap[region.region] || [region.region]
      return asArray(group.anatomical_regions).some((item) => mappedRegions.includes(item))
    })

    if (
      hasSeparatePopulations &&
      !asArray(region.background_melanin_measurement?.excluded_components).length
    ) {
      errors.push(
        `${path}.background_melanin_measurement.excluded_components must state excluded focal/structural populations.`,
      )
    }
  })

  for (const region of BACKGROUND_REPORTING_REGIONS) {
    if (!seen.has(region)) errors.push(`regional_background_analysis is missing ${region}.`)
  }
}

function validateCompositionAndDepth(globalIndices, errors) {
  const composition = globalIndices?.composition
  if (isPlainObject(composition)) {
    assertNumber100(composition.melanin_percent, 'global_background_indices.composition.melanin_percent', errors)
    assertNumber100(composition.vascular_percent, 'global_background_indices.composition.vascular_percent', errors)
    if (
      Number.isFinite(composition.melanin_percent) &&
      Number.isFinite(composition.vascular_percent) &&
      Math.abs(composition.melanin_percent + composition.vascular_percent - 100) > 1
    ) {
      errors.push('global_background_indices.composition percentages must total 100.')
    }
    assertNumber100(composition.confidence_100, 'global_background_indices.composition.confidence_100', errors)
  } else {
    errors.push('global_background_indices.composition is required.')
  }

  const depth = globalIndices?.depth_call
  if (isPlainObject(depth)) {
    const probabilityKeys = [
      'epidermal_probability_100',
      'dermal_probability_100',
      'mixed_probability_100',
    ]
    probabilityKeys.forEach((key) =>
      assertNumber100(depth[key], `global_background_indices.depth_call.${key}`, errors),
    )
    if (probabilityKeys.every((key) => Number.isFinite(depth[key]))) {
      const total = probabilityKeys.reduce((sum, key) => sum + depth[key], 0)
      if (Math.abs(total - 100) > 1) {
        errors.push('global_background_indices.depth_call probabilities must total 100.')
      }
    }
    assertNumber100(depth.confidence_100, 'global_background_indices.depth_call.confidence_100', errors)
  } else {
    errors.push('global_background_indices.depth_call is required.')
  }
}

function validatePhenotypeDiscrepancy(discrepancy, errors, warnings) {
  const path = 'phenotype_discrepancy'
  assertObject(discrepancy, path, errors)
  if (!isPlainObject(discrepancy)) return

  assertBoolean(discrepancy.detected, `${path}.detected`, errors)
  const allowedSeverity = new Set(['none', 'minor', 'material'])
  assertEnum(discrepancy.severity, allowedSeverity, `${path}.severity`, errors)
  assertArray(discrepancy.discrepancies, `${path}.discrepancies`, errors)

  if (discrepancy.detected === false) {
    if (discrepancy.severity !== 'none') errors.push(`${path}.severity must be none when detected=false.`)
    if (asArray(discrepancy.discrepancies).length) {
      errors.push(`${path}.discrepancies must be empty when detected=false.`)
    }
  } else {
    if (discrepancy.severity === 'none') errors.push(`${path}.severity cannot be none when detected=true.`)
    if (!asArray(discrepancy.discrepancies).length) {
      errors.push(`${path}.discrepancies must describe each detected discrepancy.`)
    }
  }

  asArray(discrepancy.discrepancies).forEach((item, index) => {
    const itemPath = `${path}.discrepancies[${index}]`
    assertObject(item, itemPath, errors)
    if (!isPlainObject(item)) return
    assertNonEmptyString(item.type, `${itemPath}.type`, errors)
    assertNonEmptyString(item.clinical_location_text, `${itemPath}.clinical_location_text`, errors)
    assertNonEmptyString(item.observed_morphology, `${itemPath}.observed_morphology`, errors)
    assertArray(item.affected_group_ids, `${itemPath}.affected_group_ids`, errors)
    assertNonEmptyString(item.required_action, `${itemPath}.required_action`, errors)
  })

  if (discrepancy.detected && discrepancy.severity === 'minor') {
    warnings.push('A minor phenotype discrepancy was recorded; doctor review is required.')
  }
}

/**
 * Convert a V2.3 phenotype measurement into the authoritative validated image record.
 *
 * @param {Record<string, any>} raw
 * @param {{modelVersion?: string, promptVersion?: string, configVersion?: string, policyVersion?: string, preprocessingVersion?: string}} [metadata]
 * @param {{lockedMorphologyCensus?: Record<string, any>, allowLegacySingleCall?: boolean}} [options]
 * @returns {Record<string, any>}
 */
export function validateAndScorePigmentationImageAnalysis(raw, metadata = {}, options = {}) {
  const errors = []
  const warnings = []
  if (!isPlainObject(raw)) {
    throw new PigmentationImageValidationError('Raw phenotype measurement must be an object.')
  }

  if (
    raw.analysis_record_type !==
      'pigmentation_phenotype_measurement_pending_application_validation' &&
    options.allowLegacySingleCall !== true
  ) {
    errors.push(
      'analysis_record_type must be pigmentation_phenotype_measurement_pending_application_validation.',
    )
  }

  validateRuntimeIdentity(raw, metadata, 'phenotype_measurement', errors)
  validatePolicyVersion(metadata.policyVersion ?? raw.policy_version, 'policy_version', errors)
  validateImageQuality(raw.image_quality, 'image_quality', errors)
  validateModeSpecificFindings(raw.mode_specific_findings, errors)

  const lockedCensus = options.lockedMorphologyCensus ?? metadata.lockedMorphologyCensus
  if (
    isPlainObject(lockedCensus) &&
    isNonEmptyString(raw.session_id) &&
    raw.session_id !== lockedCensus.session_id
  ) {
    errors.push(
      `phenotype_measurement.session_id ${raw.session_id} does not match locked census ${lockedCensus.session_id}.`,
    )
  }
  let groups = []
  if (options.allowLegacySingleCall === true && !lockedCensus) {
    groups = asArray(raw.morphology_groups)
    groups.forEach((group, index) => validateMorphologyGroup(group, index, errors))
  } else {
    groups = validateLockedMorphologyGroups(raw.morphology_groups, lockedCensus, errors)
  }

  const globalIndices = raw.global_background_indices
  const localizedIndices = raw.localized_burden_indices
  const regional = raw.regional_background_analysis

  assertObject(globalIndices, 'global_background_indices', errors)
  assertObject(localizedIndices, 'localized_burden_indices', errors)
  validateGlobalIndex(
    globalIndices?.melanin_load_index,
    'global_background_indices.melanin_load_index',
    errors,
  )
  validateGlobalIndex(
    globalIndices?.erythema_load_index,
    'global_background_indices.erythema_load_index',
    errors,
  )
  validateCompositionAndDepth(globalIndices, errors)

  for (const [indexKey, definition] of Object.entries(LOCALIZED_INDEX_DEFINITIONS)) {
    validateBurdenPresenceAndLinks(
      localizedIndices?.[indexKey],
      indexKey,
      definition,
      groups,
      errors,
    )
  }

  validateRegionalBackground(regional, groups, errors)
  validatePhenotypeDiscrepancy(raw.phenotype_discrepancy, errors, warnings)
  assertNonEmptyString(raw.image_summary_for_doctor, 'image_summary_for_doctor', errors)

  throwIfErrors(
    PigmentationImageValidationError,
    'Pigmentation phenotype measurement failed validation.',
    errors,
  )

  if (raw.phenotype_discrepancy?.detected && raw.phenotype_discrepancy?.severity === 'material') {
    throw new PigmentationPhenotypeDiscrepancyError(
      asArray(raw.phenotype_discrepancy.discrepancies).map(
        (item) => `${item.type}: ${item.clinical_location_text} — ${item.observed_morphology}`,
      ),
    )
  }

  const validatedLocalized = {}
  for (const [indexKey, definition] of Object.entries(LOCALIZED_INDEX_DEFINITIONS)) {
    validatedLocalized[indexKey] = finalizeBurdenIndex(
      localizedIndices[indexKey],
      `localized_burden_indices.${indexKey}`,
      definition.profile_id,
    )
  }

  const validated = {
    ...deepClone(raw),
    policy_version: metadata.policyVersion ?? raw.policy_version,
    analysis_record_type: 'validated_pigmentation_image_analysis',
    phenotype_record_type: 'validated_pigmentation_phenotype_measurement',
    morphology_groups: deepClone(groups),
    global_background_indices: {
      ...deepClone(globalIndices),
      melanin_load_index: finalizeBurdenIndex(
        globalIndices.melanin_load_index,
        'global_background_indices.melanin_load_index',
        'background_area_contrast',
      ),
      erythema_load_index: finalizeBurdenIndex(
        globalIndices.erythema_load_index,
        'global_background_indices.erythema_load_index',
        'background_area_contrast',
      ),
    },
    localized_burden_indices: {
      ...deepClone(localizedIndices),
      ...validatedLocalized,
    },
    regional_background_analysis: regional.map(finalizeRegionalBackground),
    locked_morphology_census_validation_id:
      lockedCensus?.validation_metadata?.validated_at_iso ?? null,
    validation_metadata: {
      status: 'application_validated_scored_and_locked',
      model_version: metadata.modelVersion ?? null,
      prompt_version: metadata.promptVersion ?? raw.prompt_version ?? null,
      config_version: metadata.configVersion ?? PIGMENTATION_CONFIG.version,
      policy_version: metadata.policyVersion ?? raw.policy_version,
      preprocessing_version: metadata.preprocessingVersion ?? null,
      warnings,
      scored_at_iso: new Date().toISOString(),
    },
  }

  return validated
}

export const validateAndScorePigmentationPhenotypeMeasurement =
  validateAndScorePigmentationImageAnalysis

/**
 * Build the immutable six-metric object supplied to diagnosis, treatment and reports.
 */
export function extractImmutablePigmentationMetrics(validated) {
  if (validated?.analysis_record_type !== 'validated_pigmentation_image_analysis') {
    throw new PigmentationImageValidationError(
      'Diagnosis may receive only a validated_pigmentation_image_analysis record.',
    )
  }

  const metrics = {}
  for (const [metricId, definition] of Object.entries(IMMUTABLE_METRIC_SOURCE_MAP)) {
    const source = getByPath(validated, definition.path)
    if (!Number.isInteger(source?.score_100)) {
      throw new PigmentationImageValidationError(
        `Validated phenotype is missing authoritative score for ${metricId}.`,
      )
    }
    metrics[metricId] = source.score_100
  }

  return {
    ...metrics,
    image_metrics_copied_without_recalculation: true,
  }
}

/**
 * Guard that diagnosis copied the immutable scores exactly.
 */
export function assertDiagnosisCopiedImmutableMetrics(diagnosis, validated) {
  const expected = extractImmutablePigmentationMetrics(validated)
  const actual = diagnosis?.immutable_image_metrics

  if (!isPlainObject(actual)) {
    throw new PigmentationDiagnosisValidationError(
      'Diagnosis response is missing immutable_image_metrics.',
    )
  }

  const errors = []
  for (const [key, value] of Object.entries(expected)) {
    if (actual[key] !== value) {
      errors.push(
        `Diagnosis changed immutable metric ${key}: expected ${String(value)}, received ${String(actual[key])}.`,
      )
    }
  }
  throwIfErrors(
    PigmentationDiagnosisValidationError,
    'Diagnosis did not preserve immutable phenotype metrics.',
    errors,
  )
  return true
}

function validateDiagnosisDiscrepancy(diagnosis, errors) {
  const discrepancy = diagnosis.phenotype_discrepancy
  const path = 'phenotype_discrepancy'
  assertObject(discrepancy, path, errors)
  if (!isPlainObject(discrepancy)) return

  assertBoolean(discrepancy.detected, `${path}.detected`, errors)
  assertEnum(discrepancy.severity, new Set(['none', 'minor', 'material']), `${path}.severity`, errors)
  assertBoolean(discrepancy.treatment_planning_blocked, `${path}.treatment_planning_blocked`, errors)
  assertArray(discrepancy.discrepancies, `${path}.discrepancies`, errors)

  if (!discrepancy.detected) {
    if (discrepancy.severity !== 'none') errors.push(`${path}.severity must be none when detected=false.`)
    if (discrepancy.treatment_planning_blocked !== false) {
      errors.push(`${path}.treatment_planning_blocked must be false when detected=false.`)
    }
    if (asArray(discrepancy.discrepancies).length) {
      errors.push(`${path}.discrepancies must be empty when detected=false.`)
    }
  } else {
    if (discrepancy.severity === 'none') errors.push(`${path}.severity cannot be none when detected=true.`)
    if (!asArray(discrepancy.discrepancies).length) {
      errors.push(`${path}.discrepancies must describe the visual discrepancy.`)
    }
    if (discrepancy.severity === 'material' && discrepancy.treatment_planning_blocked !== true) {
      errors.push(`${path}.treatment_planning_blocked must be true for a material discrepancy.`)
    }
  }

  asArray(discrepancy.discrepancies).forEach((item, index) => {
    const itemPath = `${path}.discrepancies[${index}]`
    assertObject(item, itemPath, errors)
    if (!isPlainObject(item)) return
    assertNonEmptyString(item.type, `${itemPath}.type`, errors)
    assertNonEmptyString(item.clinical_location_text, `${itemPath}.clinical_location_text`, errors)
    assertNonEmptyString(item.observed_morphology, `${itemPath}.observed_morphology`, errors)
    assertArray(item.affected_group_ids, `${itemPath}.affected_group_ids`, errors)
    assertNonEmptyString(item.required_action, `${itemPath}.required_action`, errors)
  })
}

function validatePhenotypeMetricInterpretation(diagnosis, phenotype, groupsByCategory, errors) {
  const interpretations = diagnosis.phenotype_metric_interpretation
  assertArray(
    interpretations,
    'phenotype_metric_interpretation',
    errors,
    { minLength: Object.keys(IMMUTABLE_METRIC_SOURCE_MAP).length },
  )
  if (!Array.isArray(interpretations)) return

  const byMetricId = new Map()
  interpretations.forEach((item, index) => {
    const path = `phenotype_metric_interpretation[${index}]`
    assertObject(item, path, errors)
    if (!isPlainObject(item)) return
    if (!Object.prototype.hasOwnProperty.call(IMMUTABLE_METRIC_SOURCE_MAP, item.metric_id)) {
      errors.push(`${path}.metric_id is unknown: ${String(item.metric_id)}.`)
      return
    }
    if (byMetricId.has(item.metric_id)) errors.push(`Duplicate interpretation for ${item.metric_id}.`)
    byMetricId.set(item.metric_id, item)

    const definition = IMMUTABLE_METRIC_SOURCE_MAP[item.metric_id]
    const source = getByPath(phenotype, definition.path)
    if (item.score_100 !== source?.score_100) {
      errors.push(`${path}.score_100 must copy ${item.metric_id} exactly.`)
    }
    if (item.presence_status !== source?.presence_status) {
      errors.push(`${path}.presence_status must copy ${item.metric_id} exactly.`)
    }

    const expectedGroups =
      definition.path[0] === 'localized_burden_indices'
        ? uniqueStrings(source?.linked_group_ids)
        : groupsByCategory.get(definition.burden_category) || []
    if (!setEquals(uniqueStrings(item.linked_group_ids), expectedGroups)) {
      errors.push(`${path}.linked_group_ids do not match the phenotype source groups.`)
    }

    assertNonEmptyString(item.patient_label, `${path}.patient_label`, errors)
    assertNonEmptyString(item.patient_explanation, `${path}.patient_explanation`, errors)
    assertNonEmptyString(item.clinical_interpretation, `${path}.clinical_interpretation`, errors)
  })

  for (const metricId of Object.keys(IMMUTABLE_METRIC_SOURCE_MAP)) {
    if (!byMetricId.has(metricId)) {
      errors.push(`phenotype_metric_interpretation is missing ${metricId}.`)
    }
  }
}

function validateDiagnosisComponents(diagnosis, groupsById, resolutionByGroup, errors) {
  const components = diagnosis.diagnostic_components
  assertArray(components, 'diagnostic_components', errors)
  const componentIds = assertUniqueIds(
    components,
    'diagnostic_component_id',
    COMPONENT_ID_PATTERN,
    'diagnostic_components',
    errors,
  )

  asArray(components).forEach((component, index) => {
    const path = `diagnostic_components[${index}]`
    assertObject(component, path, errors)
    if (!isPlainObject(component)) return

    assertArray(component.linked_group_ids, `${path}.linked_group_ids`, errors)
    const linkedIds = uniqueStrings(component.linked_group_ids)
    if (!linkedIds.length && component.family !== 'no_significant_diffuse_pigmentation') {
      errors.push(`${path}.linked_group_ids must not be empty for this diagnostic family.`)
    }

    const linkedGroups = []
    for (const groupId of linkedIds) {
      const group = groupsById.get(groupId)
      if (!group) {
        errors.push(`${path}.linked_group_ids references unknown group ${groupId}.`)
      } else {
        linkedGroups.push(group)
      }
    }

    const burdenCategories = new Set(linkedGroups.map((group) => group.burden_category))
    if (
      burdenCategories.has('flat_focal_pigmented_lesion') &&
      burdenCategories.has('raised_pigmented_lesion')
    ) {
      errors.push(`${path} collapses flat and raised morphology groups into one component.`)
    }

    assertArray(component.linked_group_locations, `${path}.linked_group_locations`, errors)
    const locationMap = new Map(
      asArray(component.linked_group_locations).map((entry) => [entry?.group_id, entry]),
    )
    for (const group of linkedGroups) {
      const locationEntry = locationMap.get(group.group_id)
      if (!locationEntry) {
        errors.push(`${path}.linked_group_locations is missing ${group.group_id}.`)
      } else if (locationEntry.clinical_location_text !== group.clinical_location_text) {
        errors.push(`${path}.linked_group_locations changed location text for ${group.group_id}.`)
      }
    }

    assertNonEmptyString(component.clinical_location_text, `${path}.clinical_location_text`, errors)
    if (linkedGroups.length === 1 && component.clinical_location_text !== linkedGroups[0].clinical_location_text) {
      errors.push(`${path}.clinical_location_text must exactly copy its linked morphology group.`)
    }
    if (linkedGroups.length > 1) {
      for (const group of linkedGroups) {
        if (!component.clinical_location_text.includes(group.clinical_location_text)) {
          errors.push(
            `${path}.clinical_location_text must preserve the exact location text for ${group.group_id}.`,
          )
        }
      }
    }

    assertArray(component.regions, `${path}.regions`, errors)
    const expectedRegions = uniqueStrings(linkedGroups.flatMap((group) => group.anatomical_regions))
    if (linkedGroups.length && !setEquals(uniqueStrings(component.regions), expectedRegions)) {
      errors.push(`${path}.regions must exactly match the union of linked morphology-group regions.`)
    }

    assertNonEmptyString(component.family, `${path}.family`, errors)
    assertNonEmptyString(component.subtype, `${path}.subtype`, errors)
    const allowedSubtypes = PIGMENTATION_CONFIG.v2_ontology.families[component.family]
    if (!Array.isArray(allowedSubtypes)) {
      errors.push(`${path}.family is not in the configured diagnostic ontology.`)
    } else if (allowedSubtypes.length && !allowedSubtypes.includes(component.subtype)) {
      errors.push(`${path}.subtype ${component.subtype} is invalid for family ${component.family}.`)
    }
    assertNumber100(component.confidence_100, `${path}.confidence_100`, errors)
    assertNonEmptyString(component.diagnostic_status, `${path}.diagnostic_status`, errors)
    assertNonEmptyString(
      component.direct_cosmetic_treatment_status,
      `${path}.direct_cosmetic_treatment_status`,
      errors,
    )
    assertNonEmptyString(
      component.treatment_relevant_morphology,
      `${path}.treatment_relevant_morphology`,
      errors,
    )
    assertNonEmptyString(component.patient_title, `${path}.patient_title`, errors)
    assertNonEmptyString(
      component.patient_location_summary,
      `${path}.patient_location_summary`,
      errors,
    )
    if (BROAD_LOCATION_ONLY_PATTERNS.has(normalizeText(component.patient_location_summary))) {
      errors.push(`${path}.patient_location_summary is too broad for provider validation.`)
    }
    assertNonEmptyString(component.patient_explanation, `${path}.patient_explanation`, errors)

    if (
      component.family === 'photo_induced_pigmentation' &&
      component.subtype === 'mixed_photo_induced'
    ) {
      errors.push(
        `${path} uses mixed_photo_induced. V2.3 requires separate background photomelanosis and focal-macule components.`,
      )
    }

    if (component.family === 'no_significant_diffuse_pigmentation' && linkedIds.length) {
      const focalLinked = linkedGroups.some((group) =>
        ['flat_focal_pigmented_lesion', 'raised_pigmented_lesion'].includes(
          group.burden_category,
        ),
      )
      if (focalLinked) {
        errors.push(`${path} may not use focal morphology groups to support no significant diffuse pigmentation.`)
      }
    }

    for (const groupId of linkedIds) {
      const resolution = resolutionByGroup.get(groupId)
      if (
        !resolution ||
        resolution.resolution !== 'mapped_to_diagnostic_component' ||
        resolution.diagnostic_component_id !== component.diagnostic_component_id
      ) {
        errors.push(
          `${path} linkage to ${groupId} is inconsistent with morphology_group_resolution.`,
        )
      }
    }
  })

  const dominantId = diagnosis.working_impression?.dominant_treatable_component_id
  if (
    dominantId !== null &&
    dominantId !== 'null' &&
    dominantId !== 'DC_001_or_null' &&
    !componentIds.has(dominantId)
  ) {
    errors.push(`working_impression.dominant_treatable_component_id references unknown ${String(dominantId)}.`)
  }

  return componentIds
}

/**
 * Validate and annotate the diagnosis response. A legitimate blocked diagnosis is returned
 * as validated but treatment_planning_eligible=false; structural inconsistencies still throw.
 *
 * @param {Record<string, any>} diagnosis
 * @param {Record<string, any>} validatedPhenotype
 * @param {{modelVersion?: string, promptVersion?: string}} [metadata]
 */
export function validatePigmentationDiagnosis(diagnosis, validatedPhenotype, metadata = {}) {
  const errors = []
  if (!isPlainObject(diagnosis)) {
    throw new PigmentationDiagnosisValidationError('Diagnosis response must be an object.')
  }
  if (validatedPhenotype?.analysis_record_type !== 'validated_pigmentation_image_analysis') {
    throw new PigmentationDiagnosisValidationError(
      'Diagnosis validation requires a validated_pigmentation_image_analysis record.',
    )
  }

  validateRuntimeIdentity(diagnosis, metadata, 'diagnosis', errors)
  validatePolicyVersion(diagnosis.policy_version, 'policy_version', errors)
  if (
    isNonEmptyString(diagnosis.session_id) &&
    diagnosis.session_id !== validatedPhenotype.session_id
  ) {
    errors.push(
      `diagnosis.session_id ${diagnosis.session_id} does not match phenotype ${validatedPhenotype.session_id}.`,
    )
  }
  try {
    assertDiagnosisCopiedImmutableMetrics(diagnosis, validatedPhenotype)
  } catch (error) {
    errors.push(...(error.issues?.length ? error.issues : [error.message]))
  }

  validateDiagnosisDiscrepancy(diagnosis, errors)
  assertEnum(
    diagnosis.diagnosis_status,
    new Set(['complete_pending_doctor_confirmation', 'blocked_pending_phenotype_reanalysis']),
    'diagnosis_status',
    errors,
  )

  const groups = asArray(validatedPhenotype.morphology_groups)
  const groupsById = new Map(groups.map((group) => [group.group_id, group]))
  const groupsByCategory = new Map()
  for (const group of groups) {
    const list = groupsByCategory.get(group.burden_category) || []
    list.push(group.group_id)
    groupsByCategory.set(group.burden_category, list)
  }

  const resolutions = diagnosis.morphology_group_resolution
  assertArray(resolutions, 'morphology_group_resolution', errors, { minLength: groups.length })
  const resolutionByGroup = new Map()
  asArray(resolutions).forEach((resolution, index) => {
    const path = `morphology_group_resolution[${index}]`
    assertObject(resolution, path, errors)
    if (!isPlainObject(resolution)) return
    if (!groupsById.has(resolution.group_id)) {
      errors.push(`${path}.group_id references unknown group ${String(resolution.group_id)}.`)
      return
    }
    if (resolutionByGroup.has(resolution.group_id)) {
      errors.push(`morphology_group_resolution duplicates ${resolution.group_id}.`)
    }
    resolutionByGroup.set(resolution.group_id, resolution)

    const group = groupsById.get(resolution.group_id)
    if (resolution.clinical_location_text !== group.clinical_location_text) {
      errors.push(`${path}.clinical_location_text changed the image-stage location.`)
    }
    assertEnum(
      resolution.resolution,
      new Set(['mapped_to_diagnostic_component', 'explicitly_excluded_with_reason']),
      `${path}.resolution`,
      errors,
    )

    if (resolution.resolution === 'mapped_to_diagnostic_component') {
      if (!COMPONENT_ID_PATTERN.test(resolution.diagnostic_component_id || '')) {
        errors.push(`${path}.diagnostic_component_id is required for mapped resolution.`)
      }
      if (resolution.exclusion_reason !== null && resolution.exclusion_reason !== undefined) {
        errors.push(`${path}.exclusion_reason must be null for mapped resolution.`)
      }
    } else {
      if (resolution.diagnostic_component_id !== null) {
        errors.push(`${path}.diagnostic_component_id must be null for excluded resolution.`)
      }
      assertNonEmptyString(resolution.exclusion_reason, `${path}.exclusion_reason`, errors)
      assertNonEmptyString(
        resolution.doctor_action_if_excluded,
        `${path}.doctor_action_if_excluded`,
        errors,
      )
    }
  })

  for (const group of groups) {
    if (!resolutionByGroup.has(group.group_id)) {
      errors.push(`morphology_group_resolution is missing ${group.group_id}.`)
    }
  }

  if (diagnosis.all_clinically_relevant_groups_resolved !== true) {
    errors.push('all_clinically_relevant_groups_resolved must be true before diagnosis completion.')
  }
  assertArray(diagnosis.unresolved_group_ids, 'unresolved_group_ids', errors)
  if (asArray(diagnosis.unresolved_group_ids).length) {
    errors.push('unresolved_group_ids must be empty before diagnosis completion.')
  }

  const componentIds = validateDiagnosisComponents(
    diagnosis,
    groupsById,
    resolutionByGroup,
    errors,
  )

  for (const [groupId, resolution] of resolutionByGroup.entries()) {
    if (
      resolution.resolution === 'mapped_to_diagnostic_component' &&
      !componentIds.has(resolution.diagnostic_component_id)
    ) {
      errors.push(
        `morphology_group_resolution maps ${groupId} to missing component ${resolution.diagnostic_component_id}.`,
      )
    }
  }

  validatePhenotypeMetricInterpretation(
    diagnosis,
    validatedPhenotype,
    groupsByCategory,
    errors,
  )

  assertObject(diagnosis.working_impression, 'working_impression', errors)
  assertNonEmptyString(
    diagnosis.working_impression?.overall_summary,
    'working_impression.overall_summary',
    errors,
  )
  assertBoolean(
    diagnosis.working_impression?.doctor_review_required,
    'working_impression.doctor_review_required',
    errors,
  )
  assertNonEmptyString(
    diagnosis.working_impression?.doctor_review_reason,
    'working_impression.doctor_review_reason',
    errors,
  )

  assertObject(diagnosis.summaries, 'summaries', errors)
  assertNonEmptyString(
    diagnosis.summaries?.clinical_summary_for_doctor,
    'summaries.clinical_summary_for_doctor',
    errors,
  )
  assertNonEmptyString(diagnosis.summaries?.patient_summary, 'summaries.patient_summary', errors)
  assertNonEmptyString(
    diagnosis.summaries?.patient_summary_short,
    'summaries.patient_summary_short',
    errors,
  )

  const discrepancyMaterial =
    diagnosis.phenotype_discrepancy?.detected === true &&
    diagnosis.phenotype_discrepancy?.severity === 'material'
  if (discrepancyMaterial && diagnosis.diagnosis_status !== 'blocked_pending_phenotype_reanalysis') {
    errors.push('A material phenotype discrepancy requires blocked_pending_phenotype_reanalysis.')
  }
  if (!discrepancyMaterial && diagnosis.diagnosis_status === 'blocked_pending_phenotype_reanalysis') {
    errors.push('Diagnosis is blocked but no material phenotype discrepancy is recorded.')
  }

  throwIfErrors(
    PigmentationDiagnosisValidationError,
    'Pigmentation diagnosis failed deterministic validation.',
    errors,
  )

  const treatmentPlanningEligible =
    diagnosis.diagnosis_status === 'complete_pending_doctor_confirmation' &&
    !(
      diagnosis.phenotype_discrepancy.detected === true &&
      diagnosis.phenotype_discrepancy.severity === 'material'
    ) &&
    diagnosis.all_clinically_relevant_groups_resolved === true &&
    asArray(diagnosis.unresolved_group_ids).length === 0

  return {
    ...deepClone(diagnosis),
    diagnosis_record_type: 'validated_pigmentation_diagnosis',
    treatment_planning_eligible: treatmentPlanningEligible,
    validation_metadata: {
      status: treatmentPlanningEligible
        ? 'application_validated_ready_for_treatment_planning'
        : 'application_validated_blocked_for_phenotype_reanalysis',
      model_version: metadata.modelVersion ?? null,
      prompt_version: metadata.promptVersion ?? diagnosis.prompt_version ?? null,
      config_version: PIGMENTATION_CONFIG.version,
      policy_version: diagnosis.policy_version,
      validated_at_iso: new Date().toISOString(),
    },
  }
}

/**
 * Hard gate used immediately before treatment-plan generation.
 */
export function assertDiagnosisReadyForTreatmentPlanning(validatedDiagnosis) {
  const errors = []
  if (validatedDiagnosis?.diagnosis_record_type !== 'validated_pigmentation_diagnosis') {
    errors.push('Diagnosis must first pass validatePigmentationDiagnosis().')
  }
  if (validatedDiagnosis?.treatment_planning_eligible !== true) {
    errors.push('Diagnosis is not eligible for treatment planning.')
  }
  if (
    validatedDiagnosis?.phenotype_discrepancy?.detected === true &&
    validatedDiagnosis?.phenotype_discrepancy?.severity === 'material'
  ) {
    errors.push('Material phenotype discrepancy must be corrected before treatment planning.')
  }
  if (validatedDiagnosis?.all_clinically_relevant_groups_resolved !== true) {
    errors.push('Every clinically relevant morphology group must be resolved.')
  }
  if (asArray(validatedDiagnosis?.unresolved_group_ids).length) {
    errors.push('unresolved_group_ids must be empty.')
  }

  throwIfErrors(
    PigmentationDiagnosisValidationError,
    'Diagnosis is not ready for treatment planning.',
    errors,
  )
  return true
}

export default {
  validatePigmentationMorphologyCensus,
  validateAndScorePigmentationImageAnalysis,
  validateAndScorePigmentationPhenotypeMeasurement,
  extractImmutablePigmentationMetrics,
  assertDiagnosisCopiedImmutableMetrics,
  validatePigmentationDiagnosis,
  assertDiagnosisReadyForTreatmentPlanning,
  assertValidMeasurementPrimitives,
  finalizeBurdenIndex,
  pigmentationSeverityLabel,
}
