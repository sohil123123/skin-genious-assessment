import { TREATMENT_STEPS } from './treatmentKnowledge.js'

const key = (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
const finite = (value) => typeof value === 'number' && Number.isFinite(value)
const proxy = (value) => finite(value) && value >= 0 && value <= 1 ? value : null
const truth = (value) => value === true || value === 'true'
const energyIds = Object.keys(TREATMENT_STEPS).filter((id) =>
  id.startsWith('ENERGY.') && id !== 'ENERGY.CARBON.APPLY' || id.startsWith('LED.'))
const qSwitchIds = ['ENERGY.CARBON.LASER', 'ENERGY.QS.TONING', 'ENERGY.QS.532', 'ENERGY.QS.LIP']

// Backend adapters supply the condition IDs already declared in constraints.json.
// Missing answers stay missing. This module never interprets free-text history.
export function buildTreatmentEligibility(diagnosis, constraints, {
  historyRuleFlags = {}, temperatureReadings = null, evaluatedClinicalBlocks = {},
} = {}) {
  const clinical = constraints?.clinical_constraints || {}
  const report = diagnosis?.diagnosis_report ?? diagnosis ?? {}
  const barrier = report.combined_barrier_sensitivity || Object.values(report).find((row) =>
    row && typeof row === 'object' && key(row.parameter_name).includes('barrier')) || {}
  const details = barrier.backend_details || {}
  const values = {
    BSI_continuous: proxy(barrier.BSI_continuous),
    barrier_uniformity_index: proxy(details.barrier_uniformity_index),
    flaking_texture_index: proxy(details.flaking_texture_index),
    erythema_intensity_index: proxy(details.erythema_intensity_index),
    hydration_signal_index: proxy(details.hydration_signal_index),
  }
  const { BSI_continuous: b, barrier_uniformity_index: u, flaking_texture_index: f,
    erythema_intensity_index: e, hydration_signal_index: h } = values
  const numericDenials = []
  if (b !== null && b >= 0.75) numericDenials.push('BSI_continuous >= 0.75')
  if (u !== null && u < 0.55) numericDenials.push('barrier_uniformity_index < 0.55')
  if (f !== null && f >= 0.60) numericDenials.push('flaking_texture_index >= 0.60')
  if (e !== null && e >= 0.75) numericDenials.push('erythema_intensity_index >= 0.75')
  if (h !== null && h < 0.30) numericDenials.push('hydration_signal_index < 0.30')
  const numericCaution = b !== null && b >= 0.45 && b < 0.55 ||
    e !== null && e >= 0.62 && e < 0.75 ||
    h !== null && h >= 0.30 && h < 0.40 &&
    (b !== null && b >= 0.40 || e !== null && e >= 0.55)
  const missingProxyFields = ['BSI_continuous', 'erythema_intensity_index', 'hydration_signal_index']
    .filter((name) => values[name] === null)
  const allowedConditions = new Set((clinical.patient_history_rules || []).map((r) => r.condition))
  const flags = Object.fromEntries(Object.entries(historyRuleFlags).filter(([name]) => allowedConditions.has(name)))
  const blockedSteps = {}
  const block = (ids, condition, reason) => {
    for (const id of ids) {
      blockedSteps[id] ||= []
      blockedSteps[id].push({ condition, reason })
    }
  }
  if (numericDenials.length) block(energyIds, 'energy_device_policy', numericDenials.join('; '))
  const medium = Object.values(TREATMENT_STEPS).filter((s) => s.clinic_class === 'medium').map((s) => s.id)
  const strongForDeepRule = clinical.mother_document_compatibility?.legacy_deep_peel_rule_classes || []
  const legacyDeep = Object.values(TREATMENT_STEPS)
    .filter((s) => strongForDeepRule.includes(s.clinic_class)).map((s) => s.id)
  const yes = (name) => truth(flags[name])
  if (yes('sun_exposure_gt_2_hours')) block([...qSwitchIds, ...medium], 'sun_exposure_gt_2_hours', 'Existing sun rule.')
  if (yes('sun_exposure_1_to_2_hours')) block(legacyDeep, 'sun_exposure_1_to_2_hours', 'Existing deep-peel exclusion using the clinic depth mapping.')
  for (const name of ['travel_within_7_days', 'social_event_within_7_days', 'used_salicylic_yesterday', 'used_glycolic_acid_yesterday']) {
    if (yes(name)) block([...qSwitchIds, ...legacyDeep], name, 'Existing Q-switch/deep-peel exclusion using the clinic depth mapping.')
  }
  if (yes('used_retinol_last_24_hours')) block([...qSwitchIds, ...medium, 'EXFO.MICRO.DIAMOND'], 'used_retinol_last_24_hours', 'Existing retinol exclusion.')
  if (yes('laser_within_last_7_days')) block([...qSwitchIds, 'ENERGY.HIFU', 'ENERGY.MNRF'], 'laser_within_last_7_days', 'Existing recent high-heat/laser exclusion. Only otherwise-safe non-ablative RF is eligible.')
  if (yes('aloe_vera_allergy')) block(['PEEL.PUMPKIN', 'PEEL.MANDELIC'], 'aloe_vera_allergy', 'Listed peel contains aloe.')
  if (yes('vitamin_c_allergy')) block(['INFUSE.VITC'], 'vitamin_c_allergy', 'Vitamin C allergy.')
  if (yes('pregnant')) {
    const otherMachines = ['EXFO.MICRO.DIAMOND', ...clinical.mother_document_compatibility?.standalone_session_modalities || []]
    const peels = Object.values(TREATMENT_STEPS).filter((s) => s.clinic_step_type === 'chemical_peel' && !['PEEL.PARTY','PEEL.PUMPKIN'].includes(s.id)).map((s) => s.id)
    block([...energyIds, ...otherMachines, ...peels, 'PEEL.SPOT.SALI'], 'pregnant', 'Existing pregnancy machine/peel restrictions, including all energy and LED.')
  }
  if (yes('on_blood_thinners')) block([...medium, 'EXFO.MICRO.DIAMOND'], 'on_blood_thinners', 'Existing gentle-exfoliation-only rule. Remaining options still need clinician review for gentleness.')

  let temperature = { status: 'not_supplied', readings: null, derived: null, reasons: [] }
  if (temperatureReadings && ['forehead_surface_c','left_cheek_surface_c','right_cheek_surface_c'].every((name) => finite(temperatureReadings[name]))) {
    const { forehead_surface_c: forehead, left_cheek_surface_c: left, right_cheek_surface_c: right } = temperatureReadings
    const avg = (forehead + left + right) / 3
    const cheeks = (left + right) / 2
    temperature = {
      status: avg >= 36.9 ? 'deny_aggressive' : avg >= 36.4 ? 'caution' : 'normal',
      readings: temperatureReadings,
      derived: { avg_facial_surface_temp_c: avg, avg_cheek_surface_temp_c: cheeks,
        left_right_delta_c: Math.abs(left - right), forehead_minus_avg_cheek_delta_c: forehead - cheeks },
      reasons: [],
    }
    if (temperature.status === 'deny_aggressive') {
      block(energyIds.filter((id) => !id.startsWith('LED.')), 'regional_skin_temperature_policy', 'Average facial surface temperature >= 36.9 C; heat devices blocked, soothing recovery remains subject to its own rules.')
      const exfoliation = Object.values(TREATMENT_STEPS).filter((s) =>
        ['chemical_peel','spot_salicylic'].includes(s.clinic_step_type) || s.id === 'EXFO.MICRO.DIAMOND').map((s) => s.id)
      block(exfoliation, 'regional_skin_temperature_policy', 'Existing deny-aggressive policy: soothing and barrier repair only.')
    }
    if (Math.abs(left - right) >= 0.3) temperature.reasons.push(`${left > right ? 'left_cheek' : 'right_cheek'} is the hotter cheek; apply the existing regional modifiers.`)
    if (forehead - cheeks >= 0.4) temperature.reasons.push('Forehead relative heat >= 0.4 C; avoid overheating the T-zone.')
    if (forehead - cheeks <= -0.4) temperature.reasons.push('Cheek relative heat >= 0.4 C; protect cheeks from aggressive exfoliation.')
  }
  // An existing server-side clinical rules evaluator may supply additional exact
  // contraindications. Never populate this field from a model's claimed reason.
  for (const [id, reasons] of Object.entries(evaluatedClinicalBlocks)) {
    if (!TREATMENT_STEPS[id] || !Array.isArray(reasons)) continue
    for (const reason of reasons) {
      if (typeof reason?.condition === 'string' && JSON.stringify(constraints).includes(reason.condition) && typeof reason?.reason === 'string' && reason.reason.trim()) block([id], reason.condition, reason.reason)
    }
  }
  return {
    numeric_energy_status: numericDenials.length ? 'denied' : numericCaution || missingProxyFields.length ? 'allowed_with_caution' : 'allowed',
    numeric_proxy_values: values, missing_proxy_fields: missingProxyFields,
    numeric_denial_reasons: numericDenials,
    history_rule_flags: flags,
    missing_history_conditions: [...allowedConditions].filter((name) => !Object.hasOwn(flags, name)),
    temperature, blocked_steps: blockedSteps,
    note: 'Fast checks supplement the complete constraints and clinician screening. They do not infer missing history or approve a device setting. Raw proxy values outside 0-1 are treated as missing, never rescaled from a client score.',
  }
}
