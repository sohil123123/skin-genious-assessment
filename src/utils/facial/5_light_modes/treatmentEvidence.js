// One treatment-only adapter for the supplied raw diagnosis and feature packet.
// No client-score conversion, recursive field guessing or inferred clearance.
const token = (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
const finiteProxy = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1
const present = (value) => value !== undefined && value !== null
const yes = (value) => value === true || value === 'true'
const no = (value) => value === false || value === 'false'

export const TREATMENT_PROXY_FIELDS = Object.freeze([
  'BSI_continuous', 'barrier_uniformity_index', 'flaking_texture_index',
  'erythema_intensity_index', 'hydration_signal_index',
])

// Explicit adapters for the two supplied diagnosis contracts. No fuzzy matching.
export const TREATMENT_CONCERN_FAMILIES = Object.freeze([
  ['Skin Type Classification', ['skin_type'], ['skin_type'], ['sebum_oiliness']],
  ['Barrier Health + Sensitivity (Combined Score)', ['barrier_health_sensitivity', 'combined_barrier_sensitivity'], ['barrier_health'], ['combined_barrier_sensitivity']],
  ['Visual Acne Grading', ['visual_acne_grading'], ['visual_acne_grading'], ['acne']],
  ['Skin Sebum Index', ['skin_sebum_content'], ['skin_sebum_content'], ['sebum_oiliness']],
  ['Vascularity / Redness Score', ['vascularity_redness_profiling'], ['vascularity_redness_profiling'], ['redness']],
  ['Skin Hydration Score', ['skin_hydration_score', 'skin_hydration'], ['skin_hydration'], ['hydration']],
  ['Skin Luminosity / Glow Index', ['skin_luminosity_glow_index'], ['skin_luminosity_glow_index'], ['hydration', 'pigmentation', 'sebum_oiliness']],
  ['Superficial Pigmentation Score', ['superficial_pigmentation_score', 'superficial_pigmentation'], ['superficial_pigmentation_score'], ['pigmentation']],
  ['Peri-Orbital Health Score', ['periorbital_health'], ['periorbital_health', 'peri_orbital_health'], ['peri_orbital']],
  ['Lip Pigmentation Score', ['lip_pigmentation'], ['lip_pigmentation'], ['lips_pigmentation']],
  ['Texture & Open Pores Score', ['texture_open_pores_scoring'], ['texture_open_pores_scoring', 'texture_open_pores_grading'], ['pores_texture', 'pores_texture_plus']],
  ['Superficial Wrinkles Score', ['superficial_wrinkles_scoring'], ['superficial_wrinkles_scoring', 'superficial_wrinkles'], ['wrinkles', 'wrinkles_plus']],
  ['Jawline Sagging Score', ['jawline_sagging_score'], ['jawline_sagging_score', 'jawline_sagging'], ['jawline_sagging']],
  ['Skin Firmness & Elasticity Index', ['skin_firmness_elasticity_index'], ['skin_firmness_elasticity_index'], ['firmness_elasticity']],
  ['Textural Radiance Index', ['textural_radiance_index'], ['textural_radiance_index'], ['pores_texture', 'pores_texture_plus', 'hydration']],
].map(([name, diagnosis_keys, feature_diagnosis_keys, proxy_keys], mother_map_index) =>
  Object.freeze({ name, diagnosis_keys, feature_diagnosis_keys, proxy_keys, mother_map_index })))

export function treatmentConcernFamily(name, diagnosisKey = '') {
  return TREATMENT_CONCERN_FAMILIES.find((family) => token(family.name) === token(name) ||
    family.diagnosis_keys.some((key) => token(key) === token(diagnosisKey))) || null
}

export function resolveTreatmentEvidence(diagnosis, featurePacket = null, options = {}) {
  const report = diagnosis?.diagnosis_report ?? diagnosis ?? {}
  const packet = featurePacket ?? diagnosis?.feature_evidence ?? diagnosis?.feature_packet ?? {}
  const barrierRows = Object.entries(report).filter(([name, row]) =>
    row && typeof row === 'object' && !Array.isArray(row) &&
    (['combinedbarriersensitivity', 'barrierhealthsensitivity', 'barrierhealth'].includes(token(name)) ||
      token(row.parameter_name ?? row.parameter).includes('barrier')))
  const values = {}, sourcePaths = {}, invalidSources = [], disagreements = []
  for (const field of TREATMENT_PROXY_FIELDS) {
    const sources = []
    for (const [name, row] of barrierRows) {
      // Preserve the existing diagnosis-raw authority; feature values fill gaps.
      sources.push({ path: `diagnosis_report.${name}.${field}`, value: row[field] })
      sources.push({ path: `diagnosis_report.${name}.backend_details.${field}`, value: row.backend_details?.[field] })
    }
    sources.push({ path: `feature_evidence.proxies.combined_barrier_sensitivity.${field}`,
      value: packet.proxies?.combined_barrier_sensitivity?.[field] })
    // Only this exact named raw field qualifies. score_0_1 is not BSI_continuous.
    sources.push({ path: `feature_evidence.diagnosis_report.barrier_health.supporting_signals.${field}`,
      value: packet.diagnosis_report?.barrier_health?.supporting_signals?.[field] })
    const valid = sources.filter((source) => finiteProxy(source.value))
    const selected = valid[0]
    values[field] = selected?.value ?? null
    sourcePaths[field] = selected?.path ?? null
    for (const source of sources) {
      if (present(source.value) && !finiteProxy(source.value))
        invalidSources.push({ field, source_path: source.path, reason: 'Expected a finite raw number in 0-1; not rescaled or parsed.' })
    }
    for (const source of valid.slice(1)) {
      if (Math.abs(source.value - selected.value) > 1e-9)
        disagreements.push({ field, authoritative_source: selected.path, authoritative_value: selected.value,
          other_source: source.path, other_value: source.value })
    }
  }
  const acne = Object.values(report).find((row) => row && typeof row === 'object' &&
    token(row.parameter_name ?? row.parameter).includes('acne')) || {}
  const explicit = options.activeAcneLesionsVisible ?? acne.active_lesions_visible ?? acne.backend_details?.active_lesions_visible
  const counts = acne.backend_details?.lesion_counts ?? acne.lesion_counts ?? {}
  const positiveCount = ['papules', 'pustules', 'nodules', 'inflammatory', 'papule', 'pustule', 'nodule'].some((name) =>
    typeof counts[name] === 'number' && Number.isFinite(counts[name]) && counts[name] > 0)
  const visibility = packet.proxies?.acne?.active_lesion_visibility_bin
  const visibilityPositive = ['mild', 'moderate', 'severe', 'present', 'visible'].includes(visibility)
  const visibilityNegative = ['none', 'absent'].includes(visibility)
  const visible = yes(explicit) ? true : no(explicit) ? false : positiveCount ? true
    : visibilityPositive ? true : visibilityNegative ? false : null
  return {
    version: 'treatment-evidence-v1',
    numeric_proxy_values: values, numeric_proxy_source_paths: sourcePaths,
    missing_proxy_fields: TREATMENT_PROXY_FIELDS.filter((field) => values[field] === null),
    invalid_proxy_sources: invalidSources, proxy_source_disagreements: disagreements,
    active_acne_lesions_visible: visible,
    active_acne_evidence_source: present(explicit) ? 'explicit_observation'
      : positiveCount ? 'diagnosis_lesion_counts'
        : visibilityPositive || visibilityNegative ? 'feature_evidence.proxies.acne.active_lesion_visibility_bin' : null,
    source_policy: 'Valid diagnosis raw values take precedence; exact feature-packet proxies then exact supporting signals fill missing values. All values remain in original 0-1 units. A displayed score, normalized_burden_0_to_1 or score_0_1 is never substituted for BSI_continuous.',
  }
}
