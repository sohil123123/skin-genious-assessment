// services/generateCanonicalJson.js
import { yesNoToBoolean, severityToCanonical, emptyToNull } from 'src/helpers/canonicalUtils'

export function generateCanonicalJson(input) {
  const safety = input.section_1_client_questionnaire.B_safety_contraindications
  const symptoms = input.section_1_client_questionnaire.D_symptoms_today
  const lifestyle = input.section_1_client_questionnaire.C_recent_exposures_24_72h
  const machines1 = input.section_2_machine_objective_inputs_part_1
  const machines2 = input.section_2_machine_objective_inputs_part_2

  return {
    session_intake_raw: {
      demographics: {
        age_years: input.meta.profile.age,
        sex: input.meta.profile.gender,
      },

      goals_and_intent: {
        primary_goal: input.section_1_client_questionnaire.A_goals_intent.primary_goal,
        secondary_goal_optional:
          input.section_1_client_questionnaire.A_goals_intent.secondary_goal || null,
        desired_intensity_preference:
          input.section_1_client_questionnaire.A_goals_intent.desired_intensity_preference,
      },

      // 🔒 REQUIRED SAFETY OBJECT (constraints read ONLY this)
      safety_and_contraindications: {
        pregnant_or_breastfeeding: yesNoToBoolean(safety.pregnant_or_breastfeeding),
        active_infection_or_fever: yesNoToBoolean(safety.current_fever_or_infection_symptoms_today),
        known_kidney_disease: yesNoToBoolean(safety.known_kidney_disease),
        known_liver_disease: yesNoToBoolean(safety.known_liver_disease),
        known_g6pd_deficiency: yesNoToBoolean(safety.known_g6pd_deficiency),
        known_heart_disease_or_arrhythmia: yesNoToBoolean(
          safety.known_heart_disease_or_heart_failure,
        ),
        history_of_anaphylaxis_or_severe_allergy: yesNoToBoolean(safety.history_severe_allergy),
        currently_on_anticoagulants: yesNoToBoolean(
          input.section_1_client_questionnaire.E_medications_supplements.blood_thinners,
        ),
      },

      lifestyle_last_24h: {
        sleep_hours_last_night: lifestyle.sleep_duration_last_night_hours,
        caffeine_servings_today: Number(lifestyle.caffeine_intake_today || 0),
        alcohol_category_last_24h: lifestyle.alcohol_intake_last_24h,
        exercise_category_last_24h: lifestyle.exercise_last_24h,
        perceived_stress_level_optional: emptyToNull(lifestyle.perceived_stress_level),
      },

      symptoms: {
        fatigue_severity: severityToCanonical(symptoms.fatigue),
        brain_fog_present: yesNoToBoolean(symptoms.brain_fog_today),

        headache_severity: severityToCanonical(symptoms.headache),
        nausea_severity: severityToCanonical(symptoms.nausea),
        vomiting_today_optional: yesNoToBoolean(symptoms.vomiting_if_nausea),

        dizziness_on_standing_present: yesNoToBoolean(symptoms.dizziness_on_standing),
        muscle_cramps_present: yesNoToBoolean(symptoms.muscle_cramps),

        palpitations_present: yesNoToBoolean(symptoms.palpitations),
        palpitations_timing_optional: emptyToNull(symptoms.palpitations_frequency_if_yes),
        chest_pain_or_sob_right_now_optional: yesNoToBoolean(
          symptoms.palpitations_chest_pain_if_yes,
        ),

        swelling_or_puffiness_present: yesNoToBoolean(symptoms.swelling_or_puffiness_today),
        shortness_of_breath_present: yesNoToBoolean(symptoms.shortness_of_breath_today),

        constipation_or_sluggish_digestion_today: yesNoToBoolean(
          symptoms.constipation_or_sluggish_digestion_today,
        ),
        constipation_type_optional: emptyToNull(symptoms.constipation_type_if_yes),
      },

      acute_metabolic_status_optional: {
        time_since_last_meal_hours_optional:
          input.section_1_client_questionnaire.G_acute_metabolic_status.time_since_last_meal_hours,
        diet_type_optional:
          input.section_1_client_questionnaire.G_acute_metabolic_status.current_diet_type || null,
      },

      nad_specific_optional: {
        previous_nad_experience_optional: yesNoToBoolean(
          input.section_1_client_questionnaire.F_nad_specific_if_applicable.previous_nad_experience,
        ),
        nad_tolerance_optional: emptyToNull(
          input.section_1_client_questionnaire.F_nad_specific_if_applicable.tolerance_if_yes,
        ),
        symptoms_improve_when_slowed_optional: yesNoToBoolean(
          input.section_1_client_questionnaire.F_nad_specific_if_applicable
            .tolerance_improved_when_slowed,
        ),
        preferred_nad_experience_optional: emptyToNull(
          input.section_1_client_questionnaire.F_nad_specific_if_applicable
            .preferred_nad_experience,
        ),
        nad_primary_reason_optional: emptyToNull(
          input.section_1_client_questionnaire.F_nad_specific_if_applicable
            .primary_reason_for_nad_interest,
        ),
      },
    },

    session_machines_raw: {
      vitals: {
        systolic_bp_mmHg: machines1.blood_pressure_monitor.systolic_mmhg,
        diastolic_bp_mmHg: machines1.blood_pressure_monitor.diastolic_mmhg,
        heart_rate_bpm: machines1.blood_pressure_monitor.pulse_bpm,

        spo2_percent: machines1.pulse_oximeter_with_pi.spo2_percent,
        systemic_temperature_c_optional:
          machines2.optional_systemic_measurements.systemic_body_temperature_c_optional,

        facial_temps_c_optional: {
          forehead_surface_c: machines1.infrared_skin_thermometer_3_point.forehead_c,
          left_cheek_surface_c: machines1.infrared_skin_thermometer_3_point.left_cheek_c,
          right_cheek_surface_c: machines1.infrared_skin_thermometer_3_point.right_cheek_c,
        },
      },

      body_composition: {
        weight_kg_optional: machines2.body_composition_analyzer_8_electrode.body_weight_kg,
        height_cm_optional: machines2.body_composition_analyzer_8_electrode.height_cm,
        bmi_optional: machines2.body_composition_analyzer_8_electrode.bmi,
        tbw_percent: machines2.body_composition_analyzer_8_electrode.total_body_water,
        body_fat_percent_optional:
          machines2.body_composition_analyzer_8_electrode.body_fat_percentage,
        muscle_mass_kg_optional:
          machines2.body_composition_analyzer_8_electrode.lean_muscle_mass_kg,
        visceral_fat_rating: machines2.body_composition_analyzer_8_electrode.visceral_fat_kg,
        bmr_kcal_optional:
          machines2.body_composition_analyzer_8_electrode.basal_metabolic_rate_optional,
      },
    },

    skin_ai_raw: {
      scores: {
        OSS: { score_0_100: input.section_3_dermatological_ai_inputs.oxidative_stress_score_oss },
        GMS: {
          score_0_100: input.section_3_dermatological_ai_inputs.glycation_metabolic_score_gms,
        },
        MVI: {
          score_0_100: input.section_3_dermatological_ai_inputs.vascularity_inflammation_index_mvi,
        },
        BHS: {
          score_0_100: input.section_3_dermatological_ai_inputs.barrier_hydration_stress_score_bhs,
        },
      },
      confidence_0_1: null,
    },

    // ✅ FULL PASSTHROUGH (no schema enforcement)
    optional: {
      medications_and_flags: {
        safety,
        symptoms,
        lifestyle,
        medications: input.section_1_client_questionnaire.E_medications_supplements,
      },
    },
  }
}
