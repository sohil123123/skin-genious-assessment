export function calculateSkinScores(stage1Result) {
  const clip01 = (x) => Math.min(Math.max(x, 0), 1)
  const safe = (x, defaultVal) => (typeof x === 'number' && !isNaN(x)) ? x : defaultVal
  const to100 = (x) => Math.round(clip01(x) * 100)

  const uv = stage1Result?.uv || {}
  const positive = stage1Result?.positive || {}
  const white = stage1Result?.white || {}
  const blue = stage1Result?.blue || {}

  const mean_luminance_0_1 = uv.mean_luminance_0_1 || 0
  const bright_pixel_fraction_gt_0_80 = uv.bright_pixel_fraction_gt_0_80 || 0
  const mean_bright_luminance_gt_0_80 = uv.mean_bright_luminance_gt_0_80 || 0

  const mean_a_channel_equivalent_0_1 = positive.mean_a_channel_equivalent_0_1 || 0
  const red_pixel_fraction_gt_threshold = positive.red_pixel_fraction_gt_threshold || 0

  const mean_local_variance_estimate_0_1 = white.mean_local_variance_estimate_0_1 || 0
  const dark_pixel_fraction_lt_0_20 = white.dark_pixel_fraction_lt_0_20 || 0

  const laplacian_variance_estimate_0_1 = blue.laplacian_variance_estimate_0_1 || 0

  // Stage 2
  const uv_haze_index_0_1 = clip01((mean_luminance_0_1 - 0.15) / (0.75 - 0.15))
  const uv_fluorescence_coverage_0_1 = clip01(bright_pixel_fraction_gt_0_80)
  const uv_fluorescence_load_0_1 = clip01((mean_bright_luminance_gt_0_80 - 0.80) / (1.00 - 0.80))
  const redness_level_0_1 = clip01(mean_a_channel_equivalent_0_1)
  const redness_coverage_0_1 = clip01(red_pixel_fraction_gt_threshold)
  const barrier_instability_0_1 = clip01(mean_local_variance_estimate_0_1)
  const dry_sink_fraction_0_1 = clip01(dark_pixel_fraction_lt_0_20)
  const texture_roughness_0_1 = clip01(laplacian_variance_estimate_0_1)

  // Stage 3
  const oxidative_haze_proxy = clip01(uv_haze_index_0_1)
  const porphyrin_proxy = clip01(0.55 * uv_fluorescence_coverage_0_1 + 0.45 * uv_fluorescence_load_0_1)
  const inflammation_proxy = clip01(0.60 * redness_level_0_1 + 0.40 * redness_coverage_0_1)
  const barrier_proxy = clip01(0.55 * barrier_instability_0_1 + 0.45 * dry_sink_fraction_0_1)
  const texture_proxy_optional = clip01(safe(texture_roughness_0_1, 0.0))

  const OSS = to100(0.55 * oxidative_haze_proxy + 0.25 * inflammation_proxy + 0.20 * porphyrin_proxy)
  const GMS = to100(oxidative_haze_proxy)
  const MVI = to100(inflammation_proxy)
  const BHS = to100(0.85 * barrier_proxy + 0.15 * texture_proxy_optional)

  return {
    scores: {
      OSS: { score_0_100: OSS },
      GMS: { score_0_100: GMS },
      MVI: { score_0_100: MVI },
      BHS: { score_0_100: BHS }
    },
    optional_primitives: {
      uv_haze_index_0_1,
      uv_fluorescence_load_0_1,
      uv_fluorescence_coverage_0_1,
      redness_level_0_1,
      redness_coverage_0_1,
      barrier_instability_0_1,
      dry_sink_fraction_0_1,
      texture_roughness_0_1
    },
    confidence_0_1: 0.90
  }
}

// Stage 4 Helpers
const clip01 = (x) => Math.min(Math.max(x, 0), 1)
const pwlin = (x, x0, x1) => clip01((x - x0) / (x1 - x0))
const inv_pwlin = (x, x0, x1) => 1 - clip01((x - x0) / (x1 - x0))
const to100 = (x01) => Math.round(100 * clip01(x01))
const bool01 = (flag) => flag ? 1 : 0
const sev01 = (x) => {
  if (!x) return 0;
  const lower = x.toLowerCase();
  if (lower === 'none') return 0;
  if (lower === 'mild') return 0.33;
  if (lower === 'moderate') return 0.66;
  if (lower === 'severe') return 1.0;
  return 0;
}
const safe_num = (x, defaultVal) => (x !== null && x !== undefined && !isNaN(x)) ? Number(x) : defaultVal
const if_not_null = (x) => x !== null && x !== undefined

export function calculateIVClinicalScoring(session_intake_raw, session_machines_raw, skin_ai_raw) {
  // Normalization Layer - Goals
  const primary_goal_raw = session_intake_raw?.goals_and_intent?.primary_goal
  const secondary_goal_raw_optional = session_intake_raw?.goals_and_intent?.secondary_goal_optional
  
  const map_goal_table = {
    "Energy": "energy",
    "Skin glow": "skin_glow",
    "Recovery": "recovery",
    "Immunity support": "immunity",
    "Brain fog": "energy",
    "Athletic performance": "performance",
    "Antioxidant": "detox",
    "NAD+ wellness": "energy",
    "Weight Management & Metabolism": "performance",
    "Stress Relief & Relaxation": "recovery"
  }
  
  const primary_goal_mapped = map_goal_table[primary_goal_raw] || primary_goal_raw
  const secondary_goal_mapped_optional = if_not_null(secondary_goal_raw_optional) ? (map_goal_table[secondary_goal_raw_optional] || secondary_goal_raw_optional) : null

  // Normalization Layer - Lifestyle
  const lifestyle = session_intake_raw?.lifestyle_last_24h || {}
  const sleep_hours_last_night = lifestyle.sleep_hours_last_night
  const caffeine_servings_today = lifestyle.caffeine_servings_today
  const alcohol_category_last_24h = lifestyle.alcohol_category_last_24h
  
  let alcohol_drinks_estimated_last_24h = 0
  if (alcohol_category_last_24h === '1-2') alcohol_drinks_estimated_last_24h = 1.5
  else if (alcohol_category_last_24h === '3-5') alcohol_drinks_estimated_last_24h = 4.0
  else if (alcohol_category_last_24h === '>5') alcohol_drinks_estimated_last_24h = 6.5

  const exercise_category_last_24h = lifestyle.exercise_category_last_24h
  let exercise_last_24h_mapped = 'none'
  if (exercise_category_last_24h === 'Light') exercise_last_24h_mapped = 'light'
  else if (exercise_category_last_24h === 'Heavy') exercise_last_24h_mapped = 'intense'

  const perceived_stress_level_optional = lifestyle.perceived_stress_level_optional
  let perceived_stress_norm_0_1_optional = null
  if (if_not_null(perceived_stress_level_optional)) {
    if (perceived_stress_level_optional === 'Low') perceived_stress_norm_0_1_optional = 0.15
    else if (perceived_stress_level_optional === 'Medium') perceived_stress_norm_0_1_optional = 0.35
    else perceived_stress_norm_0_1_optional = 0.60
  }

  // Normalization Layer - Symptoms
  const symptoms = session_intake_raw?.symptoms || {}
  const fatigue_sev01 = sev01(symptoms.fatigue_severity)
  const headache_sev01 = sev01(symptoms.headache_severity)
  const nausea_sev01 = sev01(symptoms.nausea_severity)

  const fatigue_bool = fatigue_sev01 > 0
  const headache_bool = headache_sev01 > 0
  const nausea_bool = nausea_sev01 > 0

  const brain_fog_bool = symptoms.brain_fog_present === true
  const dizziness_bool = symptoms.dizziness_on_standing_present === true
  const cramps_bool = symptoms.muscle_cramps_present === true
  const palpitations_bool = symptoms.palpitations_present === true
  const swelling_bool = symptoms.swelling_or_puffiness_present === true
  const sob_bool = symptoms.shortness_of_breath_present === true
  const constipation_bool = symptoms.constipation_or_sluggish_digestion_today === true
  
  const constipation_weight_0_1 = constipation_bool ? (symptoms.constipation_type_optional === 'true_constipation' ? 0.10 : 0.05) : 0.0

  // Normalization Layer - Temperature
  const vitals = session_machines_raw?.vitals || {}
  const systemic_temperature_c_optional = vitals.systemic_temperature_c_optional
  const facial_temps = vitals.facial_temps_c_optional || {}
  const forehead_surface_c = facial_temps.forehead_surface_c
  const left_cheek_surface_c = facial_temps.left_cheek_surface_c
  const right_cheek_surface_c = facial_temps.right_cheek_surface_c

  let avg_facial_surface_temp_c_optional = null
  if (if_not_null(forehead_surface_c) && if_not_null(left_cheek_surface_c) && if_not_null(right_cheek_surface_c)) {
    avg_facial_surface_temp_c_optional = (forehead_surface_c + left_cheek_surface_c + right_cheek_surface_c) / 3
  } else if (if_not_null(forehead_surface_c)) {
    avg_facial_surface_temp_c_optional = forehead_surface_c
  }

  const temperature_c_for_scoring = if_not_null(systemic_temperature_c_optional) ? systemic_temperature_c_optional : safe_num(avg_facial_surface_temp_c_optional, 36.6)

  // Normalization Layer - HRV
  const hrv = session_machines_raw?.hrv || {}
  const rmssd_ms_optional = hrv.rmssd_ms_optional
  const lnrmssd_optional = hrv.lnrmssd_optional
  const lnrmssd_derived_optional = if_not_null(lnrmssd_optional) ? lnrmssd_optional : (if_not_null(rmssd_ms_optional) ? Math.log(rmssd_ms_optional) : null)

  // Scoring Inputs View
  const scoring_inputs_view = {
    demographics: session_intake_raw?.demographics || {},
    goals_scoring: { primary_goal_mapped, secondary_goal_mapped_optional },
    vitals_scoring: {
      systolic_bp_mmHg: vitals.systolic_bp_mmHg,
      diastolic_bp_mmHg: vitals.diastolic_bp_mmHg,
      heart_rate_bpm: vitals.heart_rate_bpm,
      spo2_percent: safe_num(vitals.spo2_percent, 98),
      temperature_c: temperature_c_for_scoring
    },
    lifestyle_scoring: {
      sleep_hours_last_night,
      caffeine_servings_today,
      alcohol_drinks_last_24h: alcohol_drinks_estimated_last_24h,
      exercise_last_24h: exercise_last_24h_mapped,
      perceived_stress_norm_0_1_optional
    },
    symptoms_scoring: {
      fatigue_sev01, headache_sev01, nausea_sev01,
      fatigue: fatigue_bool, brain_fog: brain_fog_bool, headache: headache_bool, nausea: nausea_bool,
      dizziness_on_standing: dizziness_bool, muscle_cramps: cramps_bool,
      palpitations: palpitations_bool, swelling_or_puffiness: swelling_bool,
      shortness_of_breath: sob_bool, constipation_or_sluggish_digestion_today: constipation_bool,
      constipation_weight_0_1
    },
    machines_scoring: {
      body_composition: session_machines_raw?.body_composition || {},
      perfusion_index: session_machines_raw?.perfusion_index || {},
      hrv: { lnrmssd_optional: lnrmssd_derived_optional },
      grip_strength: session_machines_raw?.grip_strength || {}
    },
    skin_ai_scoring: {
      OSS_0_100: skin_ai_raw?.scores?.OSS?.score_0_100 || 0,
      GMS_0_100: skin_ai_raw?.scores?.GMS?.score_0_100 || 0,
      MVI_0_100: skin_ai_raw?.scores?.MVI?.score_0_100 || 0,
      BHS_0_100: skin_ai_raw?.scores?.BHS?.score_0_100 || 0,
      optional_primitives_passthrough: skin_ai_raw?.optional_primitives || null,
      telemetry_upstream_optional: skin_ai_raw?.telemetry_upstream_optional || null
    }
  }

  // Derived Evidence
  const map_mmHg = scoring_inputs_view.vitals_scoring.diastolic_bp_mmHg + (scoring_inputs_view.vitals_scoring.systolic_bp_mmHg - scoring_inputs_view.vitals_scoring.diastolic_bp_mmHg) / 3
  const low_map_norm_0_1 = pwlin(map_mmHg, 85, 70)
  const tachy_norm_0_1 = pwlin(scoring_inputs_view.vitals_scoring.heart_rate_bpm, 75, 105)
  const spo2_drop_norm_0_1 = pwlin(scoring_inputs_view.vitals_scoring.spo2_percent, 98, 93)
  const fever_norm_0_1 = pwlin(scoring_inputs_view.vitals_scoring.temperature_c, 37.2, 38.0)
  const pi_poor_norm_0_1 = if_not_null(scoring_inputs_view.machines_scoring.perfusion_index.pi) ? pwlin(scoring_inputs_view.machines_scoring.perfusion_index.pi, 2.0, 0.5) : null
  const lnrmssd_poor_norm_0_1 = if_not_null(scoring_inputs_view.machines_scoring.hrv.lnrmssd_optional) ? pwlin(scoring_inputs_view.machines_scoring.hrv.lnrmssd_optional, 4.2, 3.2) : null
  const sleep_debt_norm_0_1 = pwlin(scoring_inputs_view.lifestyle_scoring.sleep_hours_last_night, 7.5, 4.5)
  const alcohol_norm_0_1 = pwlin(scoring_inputs_view.lifestyle_scoring.alcohol_drinks_last_24h, 0, 3)
  const caffeine_norm_0_1 = pwlin(scoring_inputs_view.lifestyle_scoring.caffeine_servings_today, 0, 4)
  const exercise_stress_norm_0_1 = scoring_inputs_view.lifestyle_scoring.exercise_last_24h === 'none' ? 0.10 : (scoring_inputs_view.lifestyle_scoring.exercise_last_24h === 'light' ? 0.25 : (scoring_inputs_view.lifestyle_scoring.exercise_last_24h === 'intense' ? 0.45 : 0.65))

  const goal_skin_glow_01 = scoring_inputs_view.goals_scoring.primary_goal_mapped === 'skin_glow' ? 1 : 0

  const op = scoring_inputs_view.skin_ai_scoring.optional_primitives_passthrough || {}
  const skin_primitives_present_01 = if_not_null(scoring_inputs_view.skin_ai_scoring.optional_primitives_passthrough) ? 1 : 0
  
  const p_uv_haze_01 = if_not_null(op.uv_haze_index_0_1) ? clip01(op.uv_haze_index_0_1) : null
  const p_uv_fluor_load_01 = if_not_null(op.uv_fluorescence_load_0_1) ? clip01(op.uv_fluorescence_load_0_1) : null
  const p_uv_fluor_cov_01 = if_not_null(op.uv_fluorescence_coverage_0_1) ? clip01(op.uv_fluorescence_coverage_0_1) : null
  const p_red_cov_01 = if_not_null(op.redness_coverage_0_1) ? clip01(op.redness_coverage_0_1) : null
  const p_barrier_instab_01 = if_not_null(op.barrier_instability_0_1) ? clip01(op.barrier_instability_0_1) : null
  const p_dry_sink_01 = if_not_null(op.dry_sink_fraction_0_1) ? clip01(op.dry_sink_fraction_0_1) : null
  const p_texture_rough_01 = if_not_null(op.texture_roughness_0_1) ? clip01(op.texture_roughness_0_1) : null

  const uv_fluorescence_burden_01 = (if_not_null(p_uv_fluor_load_01) && if_not_null(p_uv_fluor_cov_01)) ? clip01(0.50 * p_uv_fluor_load_01 + 0.50 * p_uv_fluor_cov_01) : (if_not_null(p_uv_fluor_load_01) ? p_uv_fluor_load_01 : (if_not_null(p_uv_fluor_cov_01) ? p_uv_fluor_cov_01 : null))

  // AXES
  const sex = scoring_inputs_view.demographics.sex || 'male'
  const age = scoring_inputs_view.demographics.age_years || 40

  // FENS
  const tbw = scoring_inputs_view.machines_scoring.body_composition.tbw_percent
  const dehydration_from_tbw = if_not_null(tbw) ? (sex === 'male' ? pwlin(tbw, 55, 47) : pwlin(tbw, 50, 42)) : null
  const orthostatic_symptoms = bool01(scoring_inputs_view.symptoms_scoring.dizziness_on_standing)
  const cramp_signal = bool01(scoring_inputs_view.symptoms_scoring.muscle_cramps)
  const post_alcohol = alcohol_norm_0_1
  const high_caffeine = caffeine_norm_0_1
  const constipation_weight = scoring_inputs_view.symptoms_scoring.constipation_weight_0_1
  const dehydration_need = clip01(0.52 * safe_num(dehydration_from_tbw, 0.40) + 0.23 * orthostatic_symptoms + 0.18 * cramp_signal + 0.07 * constipation_weight)
  const electrolyte_need = clip01(0.55 * cramp_signal + 0.25 * post_alcohol + 0.20 * high_caffeine)
  const overload_risk_signal = clip01(0.70 * bool01(scoring_inputs_view.symptoms_scoring.swelling_or_puffiness) + 0.30 * bool01(scoring_inputs_view.symptoms_scoring.shortness_of_breath))
  const FENS_0_1 = clip01(0.65 * dehydration_need + 0.35 * electrolyte_need - 0.55 * overload_risk_signal)
  const FENS = to100(FENS_0_1)

  // PCCS
  const microcirculation_constraint = if_not_null(pi_poor_norm_0_1) ? clip01(pi_poor_norm_0_1) : 0.40
  const hemodynamic_constraint = clip01(0.60 * low_map_norm_0_1 + 0.40 * tachy_norm_0_1)
  const oxygen_delivery_constraint = clip01(spo2_drop_norm_0_1)
  const PCCS_0_1 = clip01(0.55 * microcirculation_constraint + 0.30 * hemodynamic_constraint + 0.15 * oxygen_delivery_constraint)
  const PCCS = to100(PCCS_0_1)

  // ASLS
  const hrv_recovery_deficit = if_not_null(lnrmssd_poor_norm_0_1) ? clip01(lnrmssd_poor_norm_0_1) : clip01(0.42 * sleep_debt_norm_0_1 + 0.33 * caffeine_norm_0_1 + 0.25 * bool01(scoring_inputs_view.symptoms_scoring.palpitations))
  const sleep_recovery_deficit = clip01(sleep_debt_norm_0_1)
  const stress_somatics = clip01(0.45 * scoring_inputs_view.symptoms_scoring.headache_sev01 + 0.35 * bool01(scoring_inputs_view.symptoms_scoring.palpitations) + 0.20 * safe_num(scoring_inputs_view.lifestyle_scoring.perceived_stress_norm_0_1_optional, 0.35))
  const ASLS_0_1 = clip01(0.55 * hrv_recovery_deficit + 0.25 * sleep_recovery_deficit + 0.20 * stress_somatics)
  const ASLS = to100(ASLS_0_1)

  // MONS
  const fatigue_symptom_load = clip01(0.70 * scoring_inputs_view.symptoms_scoring.fatigue_sev01 + 0.30 * bool01(scoring_inputs_view.symptoms_scoring.brain_fog))
  const grip_good_anchor_kg = sex === 'male' ? (age < 35 ? 42 : (age < 50 ? 38 : 34)) : (age < 35 ? 26 : (age < 50 ? 24 : 22))
  const grip_poor_anchor_kg = sex === 'male' ? (age < 35 ? 28 : (age < 50 ? 24 : 20)) : (age < 35 ? 18 : (age < 50 ? 16 : 14))
  const strength_deficit_optional = if_not_null(scoring_inputs_view.machines_scoring.grip_strength.kg_optional) ? inv_pwlin(scoring_inputs_view.machines_scoring.grip_strength.kg_optional, grip_good_anchor_kg, grip_poor_anchor_kg) : null
  const autonomic_energy_penalty = clip01(0.60 * ASLS_0_1 + 0.40 * sleep_debt_norm_0_1)
  const MONS_0_1 = if_not_null(strength_deficit_optional) ? clip01(0.35 * fatigue_symptom_load + 0.35 * strength_deficit_optional + 0.30 * autonomic_energy_penalty) : clip01(0.60 * fatigue_symptom_load + 0.40 * autonomic_energy_penalty)
  const MONS = to100(MONS_0_1)

  // ODS
  const skin_oxidative_burden = clip01(scoring_inputs_view.skin_ai_scoring.OSS_0_100 / 100)
  const inflammation_amplifier = clip01(scoring_inputs_view.skin_ai_scoring.MVI_0_100 / 100)
  const lifestyle_oxidative_load = clip01(0.45 * alcohol_norm_0_1 + 0.25 * sleep_debt_norm_0_1 + 0.30 * exercise_stress_norm_0_1)
  const primitives_uv_refiner = (if_not_null(p_uv_haze_01) || if_not_null(uv_fluorescence_burden_01)) ? clip01((if_not_null(p_uv_haze_01) ? (0.04 * p_uv_haze_01) : 0) + (if_not_null(uv_fluorescence_burden_01) ? (0.04 * uv_fluorescence_burden_01) : 0)) : 0
  const ODS_0_1 = clip01(0.55 * skin_oxidative_burden + 0.20 * inflammation_amplifier + 0.25 * lifestyle_oxidative_load + primitives_uv_refiner)
  const ODS = to100(ODS_0_1)

  // ILS
  const dermal_inflammation_base = clip01(scoring_inputs_view.skin_ai_scoring.MVI_0_100 / 100)
  const dermal_inflammation_refiner = clip01(Math.min(0.08, (if_not_null(p_red_cov_01) ? (0.06 * p_red_cov_01) : 0) + (if_not_null(uv_fluorescence_burden_01) ? (0.03 * uv_fluorescence_burden_01) : 0)))
  const dermal_inflammation = clip01(dermal_inflammation_base + dermal_inflammation_refiner)
  const systemic_infection_like_signal = clip01(fever_norm_0_1)
  const symptom_cluster = clip01(0.35 * scoring_inputs_view.symptoms_scoring.headache_sev01 + 0.35 * scoring_inputs_view.symptoms_scoring.nausea_sev01 + 0.30 * bool01(scoring_inputs_view.symptoms_scoring.shortness_of_breath))
  const ILS_0_1 = clip01(0.55 * dermal_inflammation + 0.25 * systemic_infection_like_signal + 0.20 * symptom_cluster)
  const ILS = to100(ILS_0_1)

  // MSGS
  const skin_glyco_signal = clip01(scoring_inputs_view.skin_ai_scoring.GMS_0_100 / 100)
  const bmi_optional = scoring_inputs_view.machines_scoring.body_composition.bmi_optional
  const adiposity_signal = clip01(0.60 * pwlin(scoring_inputs_view.machines_scoring.body_composition.visceral_fat_rating, 9.5, 15) + 0.40 * pwlin(safe_num(bmi_optional, 24), 24, 32))
  const brain_fog_signal = bool01(scoring_inputs_view.symptoms_scoring.brain_fog)
  const MSGS_0_1 = clip01(0.60 * skin_glyco_signal + 0.30 * adiposity_signal + 0.10 * brain_fog_signal)
  const MSGS = to100(MSGS_0_1)

  // DGS
  const barrier_stress_base = clip01(scoring_inputs_view.skin_ai_scoring.BHS_0_100 / 100)
  const barrier_refiner = clip01(Math.min(0.08, (if_not_null(p_barrier_instab_01) ? (0.05 * p_barrier_instab_01) : 0) + (if_not_null(p_dry_sink_01) ? (0.05 * p_dry_sink_01) : 0) + (if_not_null(p_texture_rough_01) ? (0.03 * p_texture_rough_01) : 0)))
  const barrier_stress = clip01(barrier_stress_base + barrier_refiner)
  const oxidative_dullness = clip01(scoring_inputs_view.skin_ai_scoring.OSS_0_100 / 100)
  const goal_alignment = clip01(goal_skin_glow_01)
  const inflammation_penalty = clip01(scoring_inputs_view.skin_ai_scoring.MVI_0_100 / 100)
  const DGS_0_1 = clip01(0.45 * barrier_stress + 0.25 * oxidative_dullness + 0.30 * goal_alignment - 0.15 * inflammation_penalty)
  const DGS = to100(DGS_0_1)

  // Telemetry Confidence
  let penalties = 0
  const penaltiesApplied = []
  if (!if_not_null(lnrmssd_derived_optional)) { penalties += 0.06; penaltiesApplied.push({ note: "ANS confidence slightly lower without HRV", subtract: 0.06 }) }
  if (!if_not_null(scoring_inputs_view.machines_scoring.grip_strength.kg_optional)) { penalties += 0.10; penaltiesApplied.push({ note: "Energy/output confidence slightly lower without grip", subtract: 0.10 }) }
  if (!if_not_null(tbw)) { penalties += 0.10; penaltiesApplied.push({ note: "Hydration confidence lower without TBW%", subtract: 0.10 }) }
  if (!if_not_null(scoring_inputs_view.machines_scoring.perfusion_index.pi)) { penalties += 0.10; penaltiesApplied.push({ note: "Perfusion confidence lower without PI", subtract: 0.10 }) }
  if (!skin_primitives_present_01) { penalties += 0.02; penaltiesApplied.push({ note: "Skin driver explainability lower without primitives", subtract: 0.02 }) }
  
  const telemetry_upstream = scoring_inputs_view.skin_ai_scoring.telemetry_upstream_optional
  if (telemetry_upstream && telemetry_upstream.roi_confidence_0_1 < 0.70) { penalties += 0.06; penaltiesApplied.push({ note: "Skin confidence lowered due to weak ROI confidence", subtract: 0.06 }) }
  if (telemetry_upstream && telemetry_upstream.high_glare_flag === true) { penalties += 0.04; penaltiesApplied.push({ note: "Skin confidence lowered due to glare", subtract: 0.04 }) }
  
  const confidence_0_1 = Math.min(Math.max(0.92 - penalties, 0.10), 0.95)

  return {
    scores_public_0_100: {
      FENS, PCCS, ASLS, MONS, ODS, ILS, MSGS, DGS
    },
    sub_indices_public_0_100: {
      FENS: { dehydration_need: to100(dehydration_need), electrolyte_need: to100(electrolyte_need), overload_risk_signal: to100(overload_risk_signal) },
      PCCS: { microcirculation_constraint: to100(microcirculation_constraint), hemodynamic_constraint: to100(hemodynamic_constraint), oxygen_delivery_constraint: to100(oxygen_delivery_constraint) },
      ASLS: { hrv_recovery_deficit: to100(hrv_recovery_deficit), sleep_recovery_deficit: to100(sleep_recovery_deficit), stress_somatics: to100(stress_somatics) },
      MONS: { fatigue_symptom_load: to100(fatigue_symptom_load), autonomic_energy_penalty: to100(autonomic_energy_penalty) },
      ODS: { skin_oxidative_burden: to100(skin_oxidative_burden), inflammation_amplifier: to100(inflammation_amplifier), lifestyle_oxidative_load: to100(lifestyle_oxidative_load) },
      ILS: { dermal_inflammation: to100(dermal_inflammation), systemic_infection_like_signal: to100(systemic_infection_like_signal), symptom_cluster: to100(symptom_cluster) },
      MSGS: { skin_glyco_signal: to100(skin_glyco_signal), adiposity_signal: to100(adiposity_signal), brain_fog_signal: to100(brain_fog_signal) },
      DGS: { barrier_stress: to100(barrier_stress), oxidative_dullness: to100(oxidative_dullness), goal_alignment: to100(goal_alignment) }
    },
    telemetry: {
      primary_driver_per_axis: {}, // We can leave this object empty since text will be generated
      confidence_0_1,
      confidence_detail_optional: {
        base: 0.92,
        penalties_applied: penaltiesApplied,
        clamp: { min: 0.1, max: 0.95 }
      }
    }
  }
}
