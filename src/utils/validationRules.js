// Validation rules for all form fields
export const validationRules = {
  // Profile Section
  'meta.profile.name': {
    required: true,
    message: 'Patient name is required',
    validate: (value) => value && value.trim().length > 0,
  },
  'meta.profile.age': {
    required: true,
    message: 'Age is required',
    validate: (value) => value !== null && value !== '' && value >= 0 && value <= 130,
  },
  'meta.profile.sex': {
    required: true,
    message: 'Sex is required',
    validate: (value) => value && value.trim().length > 0,
  },

  // Section A: Goals & Intent
  'section_1_client_questionnaire.A_goals_intent.primary_goal': {
    required: true,
    message: 'Primary goal is required',
    validate: (value) => value && value.trim().length > 0,
  },
  'section_1_client_questionnaire.A_goals_intent.desired_intensity_preference': {
    required: true,
    message: 'Desired intensity preference is required',
    validate: (value) => value && value.trim().length > 0,
  },

  // Section B: Safety & Contraindications
  'section_1_client_questionnaire.B_safety_contraindications.pregnant_or_breastfeeding': {
    required: true,
    message: 'Pregnant or breastfeeding status is required',
    validate: (value) => value && value.trim().length > 0,
  },
  'section_1_client_questionnaire.B_safety_contraindications.known_kidney_disease': {
    required: true,
    message: 'Kidney disease status is required',
    validate: (value) => value && value.trim().length > 0,
  },
  'section_1_client_questionnaire.B_safety_contraindications.known_heart_disease_or_heart_failure':
    {
      required: true,
      message: 'Heart disease status is required',
      validate: (value) => value && value.trim().length > 0,
    },
  'section_1_client_questionnaire.B_safety_contraindications.history_uncontrolled_hypertension': {
    required: true,
    message: 'Hypertension history is required',
    validate: (value) => value && value.trim().length > 0,
  },
  'section_1_client_questionnaire.B_safety_contraindications.diabetes': {
    required: true,
    message: 'Diabetes status is required',
    validate: (value) => value && value.trim().length > 0,
  },
  'section_1_client_questionnaire.B_safety_contraindications.known_g6pd_deficiency': {
    required: true,
    message: 'G6PD deficiency status is required',
    validate: (value) => value && value.trim().length > 0,
  },
  'section_1_client_questionnaire.B_safety_contraindications.history_seizures_epilepsy': {
    required: true,
    message: 'Seizures history is required',
    validate: (value) => value && value.trim().length > 0,
  },
  'section_1_client_questionnaire.B_safety_contraindications.history_asthma': {
    required: true,
    message: 'Asthma history is required',
    validate: (value) => value && value.trim().length > 0,
  },
  'section_1_client_questionnaire.B_safety_contraindications.known_allergy_to_iv_vitamins_minerals':
    {
      required: true,
      message: 'IV allergy status is required',
      validate: (value) => value && value.trim().length > 0,
    },
  'section_1_client_questionnaire.B_safety_contraindications.previous_adverse_reaction_to_iv_therapy':
    {
      required: true,
      message: 'Previous IV reaction status is required',
      validate: (value) => value && value.trim().length > 0,
    },
  'section_1_client_questionnaire.B_safety_contraindications.current_fever_or_infection_symptoms_today':
    {
      required: true,
      message: 'Current fever/infection status is required',
      validate: (value) => value && value.trim().length > 0,
    },
  'section_1_client_questionnaire.B_safety_contraindications.history_severe_allergy': {
    required: true,
    message: 'Severe allergy history is required',
    validate: (value) => value && value.trim().length > 0,
  },
  'section_1_client_questionnaire.B_safety_contraindications.known_liver_disease': {
    required: true,
    message: 'Liver disease status is required',
    validate: (value) => value && value.trim().length > 0,
  },
  'section_1_client_questionnaire.B_safety_contraindications.history_kidney_stones': {
    required: true,
    message: 'Kidney stones history is required',
    validate: (value) => value && value.trim().length > 0,
  },
  'section_1_client_questionnaire.B_safety_contraindications.known_electrolyte_disorder': {
    required: true,
    message: 'Electrolyte disorder status is required',
    validate: (value) => value && value.trim().length > 0,
  },

  // Conditional validations for Section B
  'section_1_client_questionnaire.B_safety_contraindications.pregnant_type_if_yes': {
    required: (formData) =>
      formData.section_1_client_questionnaire?.B_safety_contraindications
        ?.pregnant_or_breastfeeding === 'Yes',
    message: 'Pregnancy type is required when pregnant/breastfeeding is Yes',
    validate: (value) => value && value.trim().length > 0,
  },
  'section_1_client_questionnaire.B_safety_contraindications.trimester_if_pregnant': {
    required: (formData) =>
      formData.section_1_client_questionnaire?.B_safety_contraindications?.pregnant_type_if_yes ===
      'Pregnant',
    message: 'Trimester is required when pregnant',
    validate: (value) => value && value.trim().length > 0,
  },
  'section_1_client_questionnaire.B_safety_contraindications.kidney_disease_severity_if_yes': {
    required: (formData) =>
      formData.section_1_client_questionnaire?.B_safety_contraindications?.known_kidney_disease ===
      'Yes',
    message: 'Kidney disease severity is required when kidney disease is Yes',
    validate: (value) => value && value.trim().length > 0,
  },
  'section_1_client_questionnaire.B_safety_contraindications.kidney_fluid_restriction_if_yes': {
    required: (formData) =>
      formData.section_1_client_questionnaire?.B_safety_contraindications?.known_kidney_disease ===
      'Yes',
    message: 'Fluid restriction status is required when kidney disease is Yes',
    validate: (value) => value && value.trim().length > 0,
  },
  'section_1_client_questionnaire.B_safety_contraindications.heart_disease_type_if_yes': {
    required: (formData) =>
      formData.section_1_client_questionnaire?.B_safety_contraindications
        ?.known_heart_disease_or_heart_failure === 'Yes',
    message: 'Heart disease type is required when heart disease is Yes',
    validate: (value) => value && value.trim().length > 0,
  },
  'section_1_client_questionnaire.B_safety_contraindications.heart_breathlessness_if_yes': {
    required: (formData) =>
      formData.section_1_client_questionnaire?.B_safety_contraindications
        ?.known_heart_disease_or_heart_failure === 'Yes',
    message: 'Breathlessness status is required when heart disease is Yes',
    validate: (value) => value && value.trim().length > 0,
  },

  // Section C: Recent Exposures
  'section_1_client_questionnaire.C_recent_exposures_24_72h.alcohol_intake_last_24h': {
    required: true,
    message: 'Alcohol intake is required',
    validate: (value) => value && value.trim().length > 0,
  },
  'section_1_client_questionnaire.C_recent_exposures_24_72h.exercise_last_24h': {
    required: true,
    message: 'Exercise status is required',
    validate: (value) => value && value.trim().length > 0,
  },
  'section_1_client_questionnaire.C_recent_exposures_24_72h.sleep_duration_last_night_hours': {
    required: true,
    message: 'Sleep duration is required',
    validate: (value) => value !== null && value !== '' && value >= 0 && value <= 24,
  },
  'section_1_client_questionnaire.C_recent_exposures_24_72h.perceived_stress_level': {
    required: true,
    message: 'Stress level is required',
    validate: (value) => value && value.trim().length > 0,
  },
  'section_1_client_questionnaire.C_recent_exposures_24_72h.caffeine_intake_today': {
    required: true,
    message: 'Caffeine intake is required',
    validate: (value) => value && value.trim().length > 0,
  },

  // Section D: Symptoms Today
  'section_1_client_questionnaire.D_symptoms_today.fatigue': {
    required: true,
    message: 'Fatigue level is required',
    validate: (value) => value && value.trim().length > 0,
  },
  'section_1_client_questionnaire.D_symptoms_today.headache': {
    required: true,
    message: 'Headache level is required',
    validate: (value) => value && value.trim().length > 0,
  },
  'section_1_client_questionnaire.D_symptoms_today.nausea': {
    required: true,
    message: 'Nausea status is required',
    validate: (value) => value && value.trim().length > 0,
  },
  'section_1_client_questionnaire.D_symptoms_today.dizziness_on_standing': {
    required: true,
    message: 'Dizziness status is required',
    validate: (value) => value && value.trim().length > 0,
  },
  'section_1_client_questionnaire.D_symptoms_today.muscle_cramps': {
    required: true,
    message: 'Muscle cramps status is required',
    validate: (value) => value && value.trim().length > 0,
  },
  'section_1_client_questionnaire.D_symptoms_today.palpitations': {
    required: true,
    message: 'Palpitations status is required',
    validate: (value) => value && value.trim().length > 0,
  },
  'section_1_client_questionnaire.D_symptoms_today.swelling_or_puffiness_today': {
    required: true,
    message: 'Swelling status is required',
    validate: (value) => value && value.trim().length > 0,
  },
  'section_1_client_questionnaire.D_symptoms_today.constipation_or_sluggish_digestion_today': {
    required: true,
    message: 'Constipation status is required',
    validate: (value) => value && value.trim().length > 0,
  },

  // Section E: Medications & Supplements
  'section_1_client_questionnaire.E_medications_supplements.blood_pressure_medications': {
    required: true,
    message: 'Blood pressure medications status is required',
    validate: (value) => value && value.trim().length > 0,
  },
  'section_1_client_questionnaire.E_medications_supplements.blood_thinners': {
    required: true,
    message: 'Blood thinners status is required',
    validate: (value) => value && value.trim().length > 0,
  },
  'section_1_client_questionnaire.E_medications_supplements.thyroid_medications': {
    required: true,
    message: 'Thyroid medications status is required',
    validate: (value) => value && value.trim().length > 0,
  },
  'section_1_client_questionnaire.E_medications_supplements.diabetes_medications': {
    required: true,
    message: 'Diabetes medications status is required',
    validate: (value) => value && value.trim().length > 0,
  },
  'section_1_client_questionnaire.E_medications_supplements.anti_epileptic_medications': {
    required: true,
    message: 'Anti-epileptic medications status is required',
    validate: (value) => value && value.trim().length > 0,
  },
  'section_1_client_questionnaire.E_medications_supplements.currently_on_antibiotics': {
    required: true,
    message: 'Antibiotics status is required',
    validate: (value) => value && value.trim().length > 0,
  },
  'section_1_client_questionnaire.E_medications_supplements.current_supplements.selection': {
    required: true,
    message: 'Current supplements selection is required',
    validate: (value) => value && value.trim().length > 0,
  },

  // Section G: Acute Metabolic Status
  'section_1_client_questionnaire.G_acute_metabolic_status.time_since_last_meal_hours': {
    required: true,
    message: 'Time since last meal is required',
    validate: (value) => value !== null && value !== '' && value >= 0 && value <= 72,
  },
  'section_1_client_questionnaire.G_acute_metabolic_status.current_diet_type': {
    required: true,
    message: 'Current diet type is required',
    validate: (value) => value && value.trim().length > 0,
  },

  // Section H: IV Access
  'section_1_client_questionnaire.H_iv_access_procedure_tolerance.history_fainting_needles': {
    required: true,
    message: 'Fainting history is required',
    validate: (value) => value && value.trim().length > 0,
  },
  'section_1_client_questionnaire.H_iv_access_procedure_tolerance.needle_phobia': {
    required: true,
    message: 'Needle phobia status is required',
    validate: (value) => value && value.trim().length > 0,
  },
  'section_1_client_questionnaire.H_iv_access_procedure_tolerance.difficult_veins': {
    required: true,
    message: 'Difficult veins status is required',
    validate: (value) => value && value.trim().length > 0,
  },
  'section_1_client_questionnaire.H_iv_access_procedure_tolerance.vasovagal_tendency': {
    required: true,
    message: 'Vasovagal tendency status is required',
    validate: (value) => value && value.trim().length > 0,
  },

  // Section 2: Machine Measurements (required fields)
  'section_2_machine_objective_inputs.blood_pressure_monitor.systolic_mmhg': {
    required: true,
    message: 'Systolic blood pressure is required',
    validate: (value) => value !== null && value !== '' && value >= 0 && value <= 300,
  },
  'section_2_machine_objective_inputs.blood_pressure_monitor.diastolic_mmhg': {
    required: true,
    message: 'Diastolic blood pressure is required',
    validate: (value) => value !== null && value !== '' && value >= 0 && value <= 200,
  },
  'section_2_machine_objective_inputs.blood_pressure_monitor.pulse_bpm': {
    required: true,
    message: 'Pulse rate is required',
    validate: (value) => value !== null && value !== '' && value >= 0 && value <= 250,
  },
  'section_2_machine_objective_inputs.pulse_oximeter_with_pi.spo2_percent': {
    required: true,
    message: 'SpO₂ is required',
    validate: (value) => value !== null && value !== '' && value >= 0 && value <= 100,
  },
  'section_2_machine_objective_inputs.pulse_oximeter_with_pi.pulse_bpm': {
    required: true,
    message: 'Pulse oximeter pulse rate is required',
    validate: (value) => value !== null && value !== '' && value >= 0 && value <= 250,
  },
  'section_2_machine_objective_inputs.pulse_oximeter_with_pi.perfusion_index': {
    required: true,
    message: 'Perfusion index is required',
    validate: (value) => value !== null && value !== '' && value >= 0 && value <= 30,
  },

  // Section 3: Dermatological AI
  'section_3_dermatological_ai_inputs.oxidative_stress_score_oss': {
    required: true,
    message: 'Oxidative Stress Score is required',
    validate: (value) => value !== null && value !== '' && value >= 0 && value <= 1000,
  },
  'section_3_dermatological_ai_inputs.glycation_metabolic_score_gms': {
    required: true,
    message: 'Glycation Metabolic Score is required',
    validate: (value) => value !== null && value !== '' && value >= 0 && value <= 1000,
  },
  'section_3_dermatological_ai_inputs.vascularity_inflammation_index_mvi': {
    required: true,
    message: 'Vascularity Inflammation Index is required',
    validate: (value) => value !== null && value !== '' && value >= 0 && value <= 1000,
  },
  'section_3_dermatological_ai_inputs.pigment_instability_index_pii': {
    required: true,
    message: 'Pigment Instability Index is required',
    validate: (value) => value !== null && value !== '' && value >= 0 && value <= 1000,
  },
  'section_3_dermatological_ai_inputs.barrier_hydration_stress_score_bhs': {
    required: true,
    message: 'Barrier Hydration Stress Score is required',
    validate: (value) => value !== null && value !== '' && value >= 0 && value <= 1000,
  },
}

// Helper functions
export function getFieldValue(formData, path) {
  const paths = path.split('.')
  let value = formData
  for (const p of paths) {
    if (value && typeof value === 'object' && p in value) {
      value = value[p]
    } else {
      return undefined
    }
  }
  return value
}

export function validateField(formData, path) {
  const rule = validationRules[path]
  if (!rule) return { isValid: true, message: '' }

  const value = getFieldValue(formData, path)

  // Check if field is required (could be conditional)
  const isRequired = typeof rule.required === 'function' ? rule.required(formData) : rule.required

  if (isRequired) {
    if (
      value === undefined ||
      value === null ||
      value === '' ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return { isValid: false, message: rule.message }
    }

    if (rule.validate && !rule.validate(value)) {
      return { isValid: false, message: rule.message }
    }
  }

  return { isValid: true, message: '' }
}

export function validateForm(formData) {
  const errors = []

  for (const path in validationRules) {
    const validation = validateField(formData, path)
    if (!validation.isValid) {
      errors.push({
        path,
        message: validation.message,
      })
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    totalFields: Object.keys(validationRules).length,
    validFields: Object.keys(validationRules).length - errors.length,
  }
}
