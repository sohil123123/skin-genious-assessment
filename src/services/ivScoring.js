/**
 * IV Clinical Scoring Engine (8 Axes)
 * Calculates normalized scores (0-100) for 8 clinical axes based on canonical payload.
 */

export function calculateIVScoring(canonical) {
  const intake = canonical.session_intake_raw
  const machines = canonical.session_machines_raw
  const skin = canonical.skin_ai_raw

  const scores = {}

  // 1. Hydration Axis (HYD) - 0: Dehydrated, 100: Optimal
  scores.HYD = calculateHydrationScore(intake, machines, skin)

  // 2. Metabolic & Energy Axis (MET)
  scores.MET = calculateMetabolicScore(intake, machines, skin)

  // 3. Oxidative Stress & Inflammation Axis (OXI)
  scores.OXI = calculateOxidativeScore(intake, machines, skin)

  // 4. Nutritional & Recovery Axis (NUT)
  scores.NUT = calculateNutritionalScore(intake)

  // 5. NAD+ & Cellular Health Axis (NAD)
  scores.NAD = calculateNADScore(intake)

  // 6. Cardiovascular & Hemodynamic Axis (CVH)
  scores.CVH = calculateCardioScore(machines)

  // 7. Physical Strength & Vitality Axis (PHY)
  scores.PHY = calculatePhysicalScore(machines)

  // 8. Dermatological/Barrier Axis (DER)
  scores.DER = calculateDermatologicalScore(intake, machines, skin)

  return scores
}

function calculateHydrationScore(intake, machines, skin) {
  let score = 70 // Baseline

  // TBW (Total Body Water %) - Typical healthy is 50-60%
  if (machines.body_composition.tbw_percent) {
    if (machines.body_composition.tbw_percent < 45) score -= 20
    else if (machines.body_composition.tbw_percent < 50) score -= 10
    else if (machines.body_composition.tbw_percent > 55) score += 10
  }

  // Symptoms
  if (intake.symptoms.headache_severity === 'moderate') score -= 10
  if (intake.symptoms.headache_severity === 'severe') score -= 20
  if (intake.symptoms.dizziness_on_standing_present) score -= 15
  if (intake.symptoms.muscle_cramps_present) score -= 10

  // SpO2
  if (machines.vitals.spo2_percent && machines.vitals.spo2_percent < 95) score -= 10

  // Skin Hydration
  if (skin.scores.BHS && skin.scores.BHS.score_0_100 < 40) score -= 10

  return Math.min(100, Math.max(0, score))
}

function calculateMetabolicScore(intake, machines, skin) {
  let score = 75

  // GMS (Glycation Metabolic Score) - Lower GMS (higher glycation) = Lower Score
  if (skin.scores.GMS) {
    score = skin.scores.GMS.score_0_100
  }

  // Fasted state
  if (intake.acute_metabolic_status_optional.time_since_last_meal_hours_optional > 6) score -= 10

  // BMI
  if (machines.body_composition.bmi_optional > 25) score -= 5
  if (machines.body_composition.bmi_optional > 30) score -= 10

  // Fatigue
  if (intake.symptoms.fatigue_severity === 'moderate') score -= 10
  if (intake.symptoms.fatigue_severity === 'severe') score -= 20

  return Math.min(100, Math.max(0, score))
}

function calculateOxidativeScore(intake, machines, skin) {
  let score = 75

  // OSS (Oxidative Stress Score)
  if (skin.scores.OSS) {
    score = skin.scores.OSS.score_0_100
  }

  // Inflammation (MVI)
  if (skin.scores.MVI && skin.scores.MVI.score_0_100 < 50) score -= 10

  // Desktop Lifestyle
  if (intake.lifestyle_last_24h.alcohol_category_last_24h !== 'none') score -= 10
  if (intake.lifestyle_last_24h.perceived_stress_level_optional === 'high') score -= 15

  return Math.min(100, Math.max(0, score))
}

function calculateNutritionalScore(intake) {
  let score = 80

  // Diet
  if (
    intake.acute_metabolic_status_optional.diet_type_optional === 'Vegan' ||
    intake.acute_metabolic_status_optional.diet_type_optional === 'Vegetarian'
  ) {
    // High risk of B12 deficiency
    score -= 10
  }

  // Sleep
  if (intake.lifestyle_last_24h.sleep_hours_last_night < 6) score -= 15
  if (intake.lifestyle_last_24h.sleep_hours_last_night < 4) score -= 25

  return Math.min(100, Math.max(0, score))
}

function calculateNADScore(intake) {
  let score = 85

  // Age factor (NAD declines with age)
  const age = intake.demographics.age_years || 30
  if (age > 40) score -= 10
  if (age > 50) score -= 15
  if (age > 60) score -= 20

  // Brain Fog
  if (intake.symptoms.brain_fog_present) score -= 20

  // Previous experience
  if (intake.nad_specific_optional.previous_nad_experience_optional) {
    if (intake.nad_specific_optional.nad_tolerance_optional === 'low') score -= 10
  }

  return Math.min(100, Math.max(0, score))
}

function calculateCardioScore(machines) {
  let score = 90

  const sys = machines.vitals.systolic_bp_mmHg
  const dia = machines.vitals.diastolic_bp_mmHg

  if (sys > 140 || dia > 90) score -= 20 // Hypertensive
  if (sys < 100 || dia < 60) score -= 15 // Hypotensive

  const hr = machines.vitals.heart_rate_bpm
  if (hr > 100) score -= 10 // Tachycardia
  if (hr < 50) score -= 10 // Bradycardia

  return Math.min(100, Math.max(0, score))
}

function calculatePhysicalScore(machines) {
  let score = 70
  // Visceral Fat
  if (machines.body_composition.visceral_fat_rating > 10) score -= 15

  // Muscle Mass
  if (machines.body_composition.muscle_mass_kg_optional < 25) score -= 10

  return Math.min(100, Math.max(0, score))
}

function calculateDermatologicalScore(intake, machines, skin) {
  let score = 80
  if (skin.scores.BHS) score = skin.scores.BHS.score_0_100

  // Facial temp
  const temp = machines.vitals.facial_temps_c_optional?.forehead_surface_c
  if (temp > 34) score -= 10 // High surface temp often indicates inflammation

  return Math.min(100, Math.max(0, score))
}
