<template>
  <q-page>
    <div class="min-h-screen bg-grey-2 p-6">
      <div class="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
          <div class="flex items-center gap-3">
            <div
              class="w-12 h-12 rounded-full border-2 border-black flex items-center justify-center"
            >
              <span class="text-2xl font-serif">A</span>
            </div>
            <span class="text-xl font-light tracking-wider">AI AESTHETICS</span>
          </div>
        </div>

        <ClientInformation :initial-data="formData" @update="updateFormData" />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import ClientInformation from 'src/components/iv-assessment/FormWrapper.vue'

// Form data structure
const formData = ref({
  meta: {
    profile: {
      name: '',
      age: null,
      gender: '',
    },
    session_id: '',
    session_datetime: '',
  },
  section_1_client_questionnaire: {
    A_goals_intent: {
      primary_goal: '',
      secondary_goal: '',
      desired_intensity_preference: '',
    },
    B_safety_contraindications: {
      pregnant_or_breastfeeding: '',
      pregnant_type_if_yes: '',
      trimester_if_pregnant: '',
      known_kidney_disease: '',
      kidney_disease_severity_if_yes: '',
      kidney_fluid_restriction_if_yes: '',
      known_heart_disease_or_heart_failure: '',
      heart_disease_type_if_yes: '',
      heart_breathlessness_if_yes: '',
      history_uncontrolled_hypertension: '',
      hypertension_medication_if_yes: '',
      hypertension_high_bp_if_yes: '',
      diabetes: '',
      diabetes_type_if_yes: '',
      diabetes_hba1c_if_yes: '',
      known_g6pd_deficiency: '',
      g6pd_lab_test_if_yes: '',
      history_seizures_epilepsy: '',
      seizure_recent_if_yes: '',
      seizure_medication_if_yes: '',
      history_asthma: '',
      asthma_control_if_yes: '',
      asthma_inhaler_if_yes: '',
      asthma_er_if_yes: '',
      history_severe_allergy: '',
      severe_allergy_trigger_if_yes: '',
      severe_allergy_epinephrine_if_yes: '',
      severe_allergy_severity_if_yes: '',
      known_liver_disease: '',
      liver_disease_type_if_yes: '',
      liver_lfts_if_yes: '',
      liver_jaundice_if_yes: '',
      history_kidney_stones: '',
      kidney_stones_last_if_yes: '',
      kidney_stones_recurrent_if_yes: '',
      known_electrolyte_disorder: '',
      electrolyte_type_if_yes: '',
      electrolyte_medication_if_yes: '',
      known_allergy_to_iv_vitamins_minerals: '',
      allergy_ingredients_if_yes: [],
      allergy_severity_if_yes: '',
      allergy_specify_if_yes: '',
      previous_adverse_reaction_to_iv_therapy: '',
      reaction_type_if_yes: [],
      reaction_severity_if_yes: '',
      reaction_specify_if_yes: '',
      current_fever_or_infection_symptoms_today: '',
      fever_temperature_if_yes: '',
      fever_antibiotics_if_yes: '',
    },
    C_recent_exposures_24_72h: {
      alcohol_intake_last_24h: '',
      alcohol_last_drink_if_high: '',
      exercise_last_24h: '',
      sleep_duration_last_night_hours: null,
      perceived_stress_level: '',
      caffeine_intake_today: '',
    },
    D_symptoms_today: {
      fatigue: '',
      headache: '',
      nausea: '',
      vomiting_if_nausea: '',
      dizziness_on_standing: '',
      muscle_cramps: '',
      muscle_cramps_type_if_yes: '',
      palpitations: '',
      palpitations_chest_pain_if_yes: '',
      palpitations_frequency_if_yes: '',
      swelling_or_puffiness_today: '',
      swelling_duration_if_yes: '',
      constipation_or_sluggish_digestion_today: '',
      constipation_type_if_yes: '',
    },
    E_medications_supplements: {
      blood_pressure_medications: '',
      bp_meds_taken_today: '',
      blood_thinners: '',
      blood_thinners_type: '',
      thyroid_medications: '',
      thyroid_meds_type: '',
      diabetes_medications: '',
      diabetes_insulin_use: '',
      anti_epileptic_medications: '',
      anti_epileptic_taken_daily: '',
      currently_on_antibiotics: '',
      antibiotics_reason: '',
      antibiotics_started: '',
      antibiotics_still_symptomatic: '',
      current_supplements: {
        selection: '',
        list_optional: '',
        others_specify_if_selected: '',
        magnesium_taken_24h: '',
        electrolytes_taken_24h: '',
      },
    },
    F_nad_specific_if_applicable: {
      previous_nad_experience: '',
      tolerance_if_yes: '',
      tolerance_improved_when_slowed: '',
      preferred_nad_experience: '',
      primary_reason_for_nad_interest: '',
    },
    G_acute_metabolic_status: {
      time_since_last_meal_hours: null,
      current_diet_type: '',
      females_only: {
        first_day_of_last_menstrual_period_date: '',
        menopausal: '',
        pregnancy_chance_if_uncertain: '',
      },
    },
    H_iv_access_procedure_tolerance: {
      history_fainting_needles: '',
      fainting_frequency: '',
      fainting_last_occurred: '',
      needle_phobia: '',
      needle_phobia_preference: '',
      difficult_veins: '',
      difficult_veins_attempts: '',
      vasovagal_tendency: '',
      vasovagal_trigger: '',
    },
  },
  section_2_machine_objective_inputs: {
    blood_pressure_monitor: {
      systolic_mmhg: null,
      diastolic_mmhg: null,
      pulse_bpm: null,
    },
    pulse_oximeter_with_pi: {
      spo2_percent: null,
      pulse_bpm: null,
      perfusion_index: null,
    },
    hrv_measurement_device: {
      rmssd_or_tw_ms: null,
      resting_heart_rate_bpm: null,
      measurement_duration_minutes: null,
    },
    infrared_skin_thermometer_3_point: {
      forehead_c: null,
      left_cheek_c: null,
      right_cheek_c: null,
    },
    body_composition_analyzer_8_electrode: {
      body_weight_kg: null,
      height_cm: null,
      bmi: null,
      total_body_water: {
        value: null,
        unit: '',
      },
      body_fat_percentage: null,
      lean_muscle_mass_kg: null,
      visceral_fat_kg: null,
      basal_metabolic_rate_optional: null,
    },
    hand_grip_dynamometer: {
      dominant_hand_grip_strength_kg: null,
      non_dominant_hand_grip_strength_kg_optional: null,
      age_sex_adjusted_percentile_engine_derived: null,
    },
    optional_systemic_measurements: {
      systemic_body_temperature_c_optional: null,
      orthostatic_vitals_optional: {
        seated_optional: {
          systolic_mmhg: null,
          diastolic_mmhg: null,
          heart_rate_bpm: null,
        },
        standing_optional: {
          systolic_mmhg: null,
          diastolic_mmhg: null,
          heart_rate_bpm: null,
        },
        time_between_positions_minutes_optional: null,
      },
      respiratory_rate_bpm_optional: null,
    },
  },
  section_3_dermatological_ai_inputs: {
    oxidative_stress_score_oss: null,
    glycation_metabolic_score_gms: null,
    vascularity_inflammation_index_mvi: null,
    pigment_instability_index_pii: null,
    barrier_hydration_stress_score_bhs: null,
  },
})

function updateFormData(formData) {
  console.log(formData)
}
</script>
