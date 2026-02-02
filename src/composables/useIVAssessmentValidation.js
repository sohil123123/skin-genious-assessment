import { computed } from 'vue'
import { required, requiredIf, numeric, minValue } from '@vuelidate/validators'

export function useIVAssessmentValidation(formData) {
  return computed(() => ({
    iv_inputs: {
      meta: {
        profile: {
          name: { required },
          age: { required, numeric, minValue: minValue(1) },
          gender: { required },
        },
      },

      section_1_client_questionnaire: {
        A_goals_intent: {
          primary_goal: { required },
          secondary_goal: { required },
          desired_intensity_preference: { required },
        },
        B_safety_contraindications: {
          pregnant_or_breastfeeding: { required },
          pregnant_type_if_yes: {
            required: requiredIf(
              () =>
                formData.value.iv_inputs.section_1_client_questionnaire.B_safety_contraindications
                  .pregnant_or_breastfeeding == 'Yes',
            ),
          },
          trimester_if_pregnant: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.B_safety_contraindications
              return b.pregnant_or_breastfeeding == 'Yes' && b.pregnant_type_if_yes == 'Pregnant'
            }),
          },
          // ------------------------------------------------------------------------
          known_kidney_disease: { required },
          kidney_disease_severity_if_yes: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.B_safety_contraindications
              return b.known_kidney_disease == 'Yes'
            }),
          },
          kidney_fluid_restriction_if_yes: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.B_safety_contraindications
              return b.known_kidney_disease == 'Yes'
            }),
          },
          // ------------------------------------------------------------------------
          known_heart_disease_or_heart_failure: { required },
          heart_disease_type_if_yes: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.B_safety_contraindications
              return b.known_heart_disease_or_heart_failure == 'Yes'
            }),
          },
          heart_breathlessness_if_yes: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.B_safety_contraindications
              return b.known_heart_disease_or_heart_failure == 'Yes'
            }),
          },
          // ------------------------------------------------------------------------
          history_uncontrolled_hypertension: { required },
          hypertension_medication_if_yes: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.B_safety_contraindications
              return b.history_uncontrolled_hypertension == 'Yes'
            }),
          },
          hypertension_high_bp_if_yes: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.B_safety_contraindications
              return b.history_uncontrolled_hypertension == 'Yes'
            }),
          },
          // ------------------------------------------------------------------------
          diabetes: { required },
          diabetes_type_if_yes: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.B_safety_contraindications
              return b.diabetes == 'Yes'
            }),
          },
          diabetes_hba1c_if_yes: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.B_safety_contraindications
              return b.diabetes == 'Yes'
            }),
          },
          // ------------------------------------------------------------------------
          known_g6pd_deficiency: { required },
          g6pd_lab_test_if_yes: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.B_safety_contraindications
              return b.known_g6pd_deficiency == 'Yes'
            }),
          },
          // ------------------------------------------------------------------------
          history_seizures_epilepsy: { required },
          seizure_recent_if_yes: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.B_safety_contraindications
              return b.history_seizures_epilepsy == 'Yes'
            }),
          },
          seizure_medication_if_yes: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.B_safety_contraindications
              return b.history_seizures_epilepsy == 'Yes'
            }),
          },
          // ------------------------------------------------------------------------
          history_asthma: { required },
          asthma_control_if_yes: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.B_safety_contraindications
              return b.history_asthma == 'Yes'
            }),
          },
          asthma_inhaler_if_yes: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.B_safety_contraindications
              return b.history_asthma == 'Yes'
            }),
          },
          asthma_er_if_yes: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.B_safety_contraindications
              return b.history_asthma == 'Yes'
            }),
          },
          // ------------------------------------------------------------------------
          history_severe_allergy: { required },
          severe_allergy_trigger_if_yes: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.B_safety_contraindications
              return b.history_severe_allergy == 'Yes'
            }),
          },
          severe_allergy_epinephrine_if_yes: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.B_safety_contraindications
              return b.history_severe_allergy == 'Yes'
            }),
          },
          severe_allergy_severity_if_yes: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.B_safety_contraindications
              return b.history_severe_allergy == 'Yes'
            }),
          },
          // ------------------------------------------------------------------------
          known_liver_disease: { required },
          liver_disease_type_if_yes: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.B_safety_contraindications
              return b.known_liver_disease == 'Yes'
            }),
          },
          liver_lfts_if_yes: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.B_safety_contraindications
              return b.known_liver_disease == 'Yes'
            }),
          },
          liver_jaundice_if_yes: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.B_safety_contraindications
              return b.known_liver_disease == 'Yes'
            }),
          },
          // ------------------------------------------------------------------------
          history_kidney_stones: { required },
          kidney_stones_last_if_yes: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.B_safety_contraindications
              return b.history_kidney_stones == 'Yes'
            }),
          },
          kidney_stones_recurrent_if_yes: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.B_safety_contraindications
              return b.history_kidney_stones == 'Yes'
            }),
          },
          // ------------------------------------------------------------------------
          known_electrolyte_disorder: { required },
          electrolyte_type_if_yes: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.B_safety_contraindications
              return b.known_electrolyte_disorder == 'Yes'
            }),
          },
          electrolyte_medication_if_yes: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.B_safety_contraindications
              return b.known_electrolyte_disorder == 'Yes'
            }),
          },
          // ------------------------------------------------------------------------
          known_allergy_to_iv_vitamins_minerals: { required },
          allergy_ingredients_if_yes: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.B_safety_contraindications
              return b.known_allergy_to_iv_vitamins_minerals == 'Yes'
            }),
          },
          allergy_severity_if_yes: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.B_safety_contraindications
              return b.known_allergy_to_iv_vitamins_minerals == 'Yes'
            }),
          },
          allergy_specify_if_yes: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.B_safety_contraindications
              return b.known_allergy_to_iv_vitamins_minerals == 'Yes'
            }),
          },
          // ------------------------------------------------------------------------
          previous_adverse_reaction_to_iv_therapy: { required },
          reaction_type_if_yes: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.B_safety_contraindications
              return b.previous_adverse_reaction_to_iv_therapy == 'Yes'
            }),
          },
          reaction_severity_if_yes: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.B_safety_contraindications
              return b.previous_adverse_reaction_to_iv_therapy == 'Yes'
            }),
          },
          reaction_specify_if_yes: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.B_safety_contraindications
              return b.previous_adverse_reaction_to_iv_therapy == 'Yes'
            }),
          },
          // ------------------------------------------------------------------------
          current_fever_or_infection_symptoms_today: { required },
          fever_temperature_if_yes: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.B_safety_contraindications
              return b.current_fever_or_infection_symptoms_today == 'Yes'
            }),
          },
          fever_antibiotics_if_yes: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.B_safety_contraindications
              return b.current_fever_or_infection_symptoms_today == 'Yes'
            }),
          },
        },
        C_recent_exposures_24_72h: {
          alcohol_intake_last_24h: { required },
          alcohol_last_drink_if_high: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.C_recent_exposures_24_72h
              return b.alcohol_intake_last_24h == '>5'
            }),
          },
          exercise_last_24h: { required },
          sleep_duration_last_night_hours: { required },
          perceived_stress_level: { required },
          caffeine_intake_today: { required },
        },
        D_symptoms_today: {
          fatigue: { required },
          headache: { required },
          nausea: { required },
          vomiting_if_nausea: { required },
          dizziness_on_standing: { required },
          muscle_cramps: { required },
          muscle_cramps_type_if_yes: {
            required: requiredIf(() => {
              const b = formData.value.iv_inputs.section_1_client_questionnaire.D_symptoms_today
              return b.muscle_cramps == 'Yes'
            }),
          },
          palpitations: { required },
          palpitations_chest_pain_if_yes: {
            required: requiredIf(() => {
              const b = formData.value.iv_inputs.section_1_client_questionnaire.D_symptoms_today
              return b.palpitations == 'Yes'
            }),
          },
          palpitations_frequency_if_yes: {
            required: requiredIf(() => {
              const b = formData.value.iv_inputs.section_1_client_questionnaire.D_symptoms_today
              return b.palpitations == 'Yes'
            }),
          },
          swelling_or_puffiness_today: { required },
          swelling_duration_if_yes: {
            required: requiredIf(() => {
              const b = formData.value.iv_inputs.section_1_client_questionnaire.D_symptoms_today
              return b.swelling_or_puffiness_today == 'Yes'
            }),
          },
          constipation_or_sluggish_digestion_today: { required },
          constipation_type_if_yes: {
            required: requiredIf(() => {
              const b = formData.value.iv_inputs.section_1_client_questionnaire.D_symptoms_today
              return b.constipation_or_sluggish_digestion_today == 'Yes'
            }),
          },
          brain_fog_today: { required },
          shortness_of_breath_today: { required },
        },
        E_medications_supplements: {
          blood_pressure_medications: { required },
          bp_meds_taken_today: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.E_medications_supplements
              return b.blood_pressure_medications == 'Yes'
            }),
          },
          blood_thinners: { required },
          blood_thinners_type: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.E_medications_supplements
              return b.blood_thinners == 'Yes'
            }),
          },
          thyroid_medications: { required },
          thyroid_meds_type: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.E_medications_supplements
              return b.thyroid_medications == 'Yes'
            }),
          },
          diabetes_medications: { required },
          diabetes_insulin_use: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.E_medications_supplements
              return b.diabetes_medications == 'Yes'
            }),
          },
          anti_epileptic_medications: { required },
          anti_epileptic_taken_daily: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.E_medications_supplements
              return b.anti_epileptic_medications == 'Yes'
            }),
          },
          currently_on_antibiotics: { required },
          antibiotics_reason: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.E_medications_supplements
              return b.currently_on_antibiotics == 'Yes'
            }),
          },
          antibiotics_started: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.E_medications_supplements
              return b.currently_on_antibiotics == 'Yes'
            }),
          },
          antibiotics_still_symptomatic: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.E_medications_supplements
              return b.currently_on_antibiotics == 'Yes'
            }),
          },
          current_supplements: {
            selection: { required },
            magnesium_taken_24h: {
              required: requiredIf(() => {
                const b =
                  formData.value.iv_inputs.section_1_client_questionnaire.E_medications_supplements
                    .current_supplements
                return b.selection == 'Magnesium'
              }),
            },
            electrolytes_taken_24h: {
              required: requiredIf(() => {
                const b =
                  formData.value.iv_inputs.section_1_client_questionnaire.E_medications_supplements
                    .current_supplements
                return b.selection == 'Electrolytes'
              }),
            },
            others_specify_if_selected: {
              required: requiredIf(() => {
                const b =
                  formData.value.iv_inputs.section_1_client_questionnaire.E_medications_supplements
                    .current_supplements
                return b.selection == 'Others'
              }),
            },
          },
        },
        F_nad_specific_if_applicable: {
          previous_nad_experience: {
            required: requiredIf(() => {
              const primary_goal =
                formData.value.iv_inputs.section_1_client_questionnaire.A_goals_intent.primary_goal
              const secondary_goal =
                formData.value.iv_inputs.section_1_client_questionnaire.A_goals_intent
                  .secondary_goal
              return primary_goal == 'NAD+ wellness' || secondary_goal == 'NAD+ wellness'
            }),
          },
          tolerance_if_yes: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.F_nad_specific_if_applicable
              const primary_goal =
                formData.value.iv_inputs.section_1_client_questionnaire.A_goals_intent.primary_goal
              const secondary_goal =
                formData.value.iv_inputs.section_1_client_questionnaire.A_goals_intent
                  .secondary_goal
              return (
                b.previous_nad_experience == 'Yes' &&
                (primary_goal == 'NAD+ wellness' || secondary_goal == 'NAD+ wellness')
              )
            }),
          },
          tolerance_improved_when_slowed: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire.F_nad_specific_if_applicable
              return b.tolerance_if_yes == 'Chest tightness' || b.tolerance_if_yes == 'Anxiety'
            }),
          },
          preferred_nad_experience: {
            required: requiredIf(() => {
              const primary_goal =
                formData.value.iv_inputs.section_1_client_questionnaire.A_goals_intent.primary_goal
              const secondary_goal =
                formData.value.iv_inputs.section_1_client_questionnaire.A_goals_intent
                  .secondary_goal
              return primary_goal == 'NAD+ wellness' || secondary_goal == 'NAD+ wellness'
            }),
          },
          primary_reason_for_nad_interest: {
            required: requiredIf(() => {
              const primary_goal =
                formData.value.iv_inputs.section_1_client_questionnaire.A_goals_intent.primary_goal
              const secondary_goal =
                formData.value.iv_inputs.section_1_client_questionnaire.A_goals_intent
                  .secondary_goal
              return primary_goal == 'NAD+ wellness' || secondary_goal == 'NAD+ wellness'
            }),
          },
        },
        G_acute_metabolic_status: {
          time_since_last_meal_hours: { required, numeric },
          current_diet_type: { required },
          females_only: {
            // Rule 1: LMP required unless menopausal = Yes
            first_day_of_last_menstrual_period_date: {
              required: requiredIf(() => {
                const f =
                  formData.value.iv_inputs.section_1_client_questionnaire.G_acute_metabolic_status
                    .females_only
                const gender = formData.value.iv_inputs.meta.profile.gender

                return (
                  gender === 'Female' && f.menopausal !== 'Yes' && !f.pregnancy_chance_if_uncertain
                )
              }),
            },

            // Rule 1 (other side): Menopausal required if no LMP
            menopausal: {
              required: requiredIf(() => {
                const f =
                  formData.value.iv_inputs.section_1_client_questionnaire.G_acute_metabolic_status
                    .females_only
                const gender = formData.value.iv_inputs.meta.profile.gender

                return gender === 'Female' && !f.first_day_of_last_menstrual_period_date
              }),
            },

            // Rule 2: Pregnancy question only if uncertain/delayed cycle
            pregnancy_chance_if_uncertain: {
              required: requiredIf(() => {
                const f =
                  formData.value.iv_inputs.section_1_client_questionnaire.G_acute_metabolic_status
                    .females_only
                const gender = formData.value.iv_inputs.meta.profile.gender

                return (
                  gender === 'Female' &&
                  !f.first_day_of_last_menstrual_period_date &&
                  f.menopausal !== 'Yes'
                )
              }),
            },
          },
        },
        H_iv_access_procedure_tolerance: {
          history_fainting_needles: { required },
          fainting_frequency: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire
                  .H_iv_access_procedure_tolerance
              return b.history_fainting_needles == 'Yes'
            }),
          },
          fainting_last_occurred: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire
                  .H_iv_access_procedure_tolerance
              return b.history_fainting_needles == 'Yes'
            }),
          },
          needle_phobia: { required },
          needle_phobia_preference: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire
                  .H_iv_access_procedure_tolerance
              return b.needle_phobia == 'Yes'
            }),
          },
          difficult_veins: { required },
          difficult_veins_attempts: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire
                  .H_iv_access_procedure_tolerance
              return b.difficult_veins == 'Yes'
            }),
          },
          vasovagal_tendency: { required },
          vasovagal_trigger: {
            required: requiredIf(() => {
              const b =
                formData.value.iv_inputs.section_1_client_questionnaire
                  .H_iv_access_procedure_tolerance
              return b.vasovagal_tendency == 'Yes'
            }),
          },
        },
      },

      section_2_machine_objective_inputs_part_1: {
        blood_pressure_monitor: {
          systolic_mmhg: { required, numeric },
          diastolic_mmhg: { required, numeric },
          pulse_bpm: { required, numeric },
        },
        pulse_oximeter_with_pi: {
          spo2_percent: { required, numeric },
          pulse_bpm: { required, numeric },
          perfusion_index: { required, numeric },
        },
        hrv_measurement_device: {
          rmssd_or_tw_ms: { required, numeric },
          resting_heart_rate_bpm: { required, numeric },
          measurement_duration_minutes: { required, numeric },
        },
        infrared_skin_thermometer_3_point: {
          forehead_c: { required, numeric },
          left_cheek_c: { required, numeric },
          right_cheek_c: { required, numeric },
        },
      },

      section_2_machine_objective_inputs_part_2: {
        body_composition_analyzer_8_electrode: {
          body_weight_kg: { required },
          height_cm: { required },
          bmi: { required },
          total_body_water: { required },
          body_fat_percentage: { required },
          lean_muscle_mass_kg: { required },
          visceral_fat_kg: { required },
        },
        hand_grip_dynamometer: {
          dominant_hand_grip_strength_kg: { required },
        },
      },

      section_3_dermatological_ai_inputs: {
        oxidative_stress_score_oss: { required },
        glycation_metabolic_score_gms: { required },
        vascularity_inflammation_index_mvi: { required },
        barrier_hydration_stress_score_bhs: { required },
      },
    },
  }))
}
