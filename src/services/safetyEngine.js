/**
 * Safety & Constraints Engine
 * Evaluates the clinical risks and contraindications based on the canonical payload and constraints rules.
 */

export function evaluateSafety(canonical) {
  const safety = canonical.session_intake_raw.safety_and_contraindications
  const lifestyle = canonical.session_intake_raw.lifestyle_last_24h
  const vitals = canonical.session_machines_raw.vitals

  const results = {
    status: 'safe', // 'safe' | 'caution' | 'blocked'
    flags: [],
    denied_modalities: [],
    caution_modalities: [],
  }

  // --- 1. Hard Blockers (Red Flags) ---
  if (safety.known_kidney_disease) {
    results.status = 'blocked'
    results.flags.push({
      severity: 'high',
      message: 'Known Kidney Disease: IV therapy prohibited without Nephrologist clearance.',
      modality: 'all_iv',
    })
  }

  if (safety.known_heart_disease_or_arrhythmia) {
    results.status = 'blocked'
    results.flags.push({
      severity: 'high',
      message: 'Known Heart Disease/Arrhythmia: Risk of fluid overload.',
      modality: 'all_iv',
    })
  }

  if (safety.active_infection_or_fever) {
    results.status = 'blocked'
    results.flags.push({
      severity: 'high',
      message: 'Active Infection/Fever: Defer treatment until recovered.',
      modality: 'all_iv',
    })
  }

  if (safety.history_of_anaphylaxis_or_severe_allergy) {
    results.status = 'caution' // Often a caution unless specific to ingredients
    results.flags.push({
      severity: 'medium',
      message: 'History of Anaphylaxis: Extremely close monitoring required.',
      modality: 'all_iv',
    })
  }

  if (safety.known_g6pd_deficiency) {
    results.status = 'blocked'
    results.flags.push({
      severity: 'high',
      message: 'G6PD Deficiency: High-dose Vitamin C contraindicated.',
      modality: 'Vit-C > 5g',
    })
  }

  // --- 2. Vital Signs Safety Gates ---
  if (vitals.systolic_bp_mmHg > 160 || vitals.diastolic_bp_mmHg > 100) {
    results.status = 'blocked'
    results.flags.push({
      severity: 'high',
      message: 'Hypertensive Crisis Level: No IV therapy until BP stabilized.',
      modality: 'all_iv',
    })
  }

  if (vitals.systolic_bp_mmHg < 90) {
    results.status = 'caution'
    results.flags.push({
      severity: 'medium',
      message: 'Low Blood Pressure: Monitor for vasovagal response.',
      modality: 'all_iv',
    })
  }

  // --- 3. Lifestyle & Recent Exposure ---
  if (lifestyle.alcohol_category_last_24h === 'high') {
    results.status = 'caution'
    results.flags.push({
      severity: 'medium',
      message: 'High Alcohol Intake (Last 24h): Increased risk of dehydration/nausea.',
      modality: 'all_iv',
    })
  }

  // Final status consolidation
  if (results.flags.some((f) => f.severity === 'high')) {
    results.status = 'blocked'
  } else if (results.flags.some((f) => f.severity === 'medium')) {
    if (results.status !== 'blocked') results.status = 'caution'
  }

  return results
}
