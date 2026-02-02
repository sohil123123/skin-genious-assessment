<template>
  <div class="form-wrapper">
    <!-- Progress Indicator -->
    <div class="row items-center q-mb-lg q-mt-lg">
      <!-- <q-linear-progress :value="formProgress" color="primary" class="col-grow q-mr-md" size="lg" />
      <div class="text-caption text-grey-7">{{ Math.round(formProgress * 100) }}% Complete</div> -->
    </div>

    <!-- Form Sections -->
    <SectionProfile v-model:formData="formData" :v="v" @update="handleUpdate" />

    <SectionAGoals v-model:formData="formData" :v="v" @update="handleUpdate" />

    <SectionBSafety v-model:formData="formData" :v="v" @update="handleUpdate" />

    <SectionCExposures v-model:formData="formData" :v="v" @update="handleUpdate" />

    <SectionDSymptoms v-model:formData="formData" :v="v" @update="handleUpdate" />

    <SectionEMeds v-model:formData="formData" :v="v" @update="handleUpdate" />

    <SectionFNAD
      v-model:formData="formData"
      :v="v"
      :is-nad-applicable="isNadApplicable"
      @update="handleUpdate"
    />

    <SectionGMetabolic v-model:formData="formData" :v="v" @update="handleUpdate" />

    <SectionHIVAccess v-model:formData="formData" :v="v" @update="handleUpdate" />

    <Section2Measurements v-model:formData="formData" :v="v" @update="handleUpdate" />

    <!-- <Section3Dermatology v-model:formData="formData" @update="handleUpdate" /> -->

    <!-- Output Panel -->
    <!-- <q-card flat bordered class="q-pa-md q-mb-md shadow-1">
      <q-card-section class="q-pa-none q-mb-md">
        <h3 class="text-subtitle1 text-weight-bold">Review & Output</h3>
      </q-card-section>

      <div class="row items-center q-mb-md">
        <div class="col-grow">
          <q-badge :color="statusPillColor" :label="statusPillText" class="q-mb-sm" />
        </div>
        <div class="col-auto">
          <div class="row q-gutter-sm">
            <q-btn color="primary" outline @click="copyJson" label="Copy JSON" />
            <q-btn color="dark" @click="downloadJson" label="Download JSON" />
          </div>
        </div>
      </div>

      <pre class="json-output q-pa-md bg-dark text-white rounded-borders">{{ formattedJson }}</pre>
    </q-card> -->

    <!-- Action Buttons -->
    <!-- <div class="row q-mb-xl q-mt-lg">
      <div class="col-12">
        <div class="row justify-center q-gutter-md">
          <q-btn
            color="primary"
            icon="check"
            label="Validate Form"
            @click="validateForm"
            size="lg"
          />
          <q-btn
            color="positive"
            icon="send"
            label="Submit"
            @click="submitForm"
            size="lg"
            :disable="validationStatus !== 'valid'"
          />
          <q-btn color="grey" icon="refresh" label="Reset" @click="resetForm" outline size="lg" />
        </div>
      </div>
    </div> -->
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch } from 'vue'
// import { useQuasar } from 'quasar'
import SectionProfile from 'src/components/iv-assessment/sections/SectionProfile.vue'
import SectionAGoals from 'src/components/iv-assessment/sections/SectionAGoals.vue'
import SectionBSafety from 'src/components/iv-assessment/sections/SectionBSafety.vue'
import SectionCExposures from 'src/components/iv-assessment/sections/SectionCExposures.vue'
import SectionDSymptoms from 'src/components/iv-assessment/sections/SectionDSymptoms.vue'
import SectionEMeds from 'src/components/iv-assessment/sections/SectionEMeds.vue'
import SectionFNAD from 'src/components/iv-assessment/sections/SectionFNAD.vue'
import SectionGMetabolic from 'src/components/iv-assessment/sections/SectionGMetabolic.vue'
import SectionHIVAccess from 'src/components/iv-assessment/sections/SectionHIVAccess.vue'
import Section2Measurements from 'src/components/iv-assessment/sections/Section2Measurements.vue'
// import Section3Dermatology from 'src/components/iv-assessment/sections/Section3Dermatology.vue'

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({}),
  },
  v: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['submit', 'update', 'validate'])

// const $q = useQuasar()

// Form data structure
const formData = reactive({
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
      brain_fog_today: '',
      shortness_of_breath_today: '',
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
  section_2_machine_objective_inputs_part_1: {
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
  },
  section_2_machine_objective_inputs_part_2: {
    body_composition_analyzer_8_electrode: {
      body_weight_kg: null,
      height_cm: null,
      bmi: null,
      total_body_water: null,
      body_fat_percentage: null,
      lean_muscle_mass_kg: null,
      visceral_fat_kg: null,
      basal_metabolic_rate_optional: null,
    },
    hand_grip_dynamometer: {
      dominant_hand_grip_strength_kg: null,
      non_dominant_hand_grip_strength_kg_optional: null,
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
    barrier_hydration_stress_score_bhs: null,
  },
})

// Initialize with props if provided
watch(
  () => props.initialData,
  (newVal) => {
    if (newVal && Object.keys(newVal).length > 0) {
      Object.assign(formData, newVal)
    }
  },
  { immediate: true, deep: true },
)

// UI State
// const validationStatus = ref('not-validated')
const formattedJson = ref('{}')

// Computed Properties
const isNadApplicable = computed(() => {
  const pg = formData.section_1_client_questionnaire.A_goals_intent.primary_goal
  const sg = formData.section_1_client_questionnaire.A_goals_intent.secondary_goal
  return pg === 'NAD+ wellness' || sg === 'NAD+ wellness'
})

// const formProgress = computed(() => {
//   const totalFields = 100
//   const filledFields = countFilledFields()
//   return Math.min(filledFields / totalFields, 1)
// })

// const statusPillText = computed(() => {
//   switch (validationStatus.value) {
//     case 'valid':
//       return 'Validated: OK'
//     case 'invalid':
//       return 'Validated: errors found'
//     default:
//       return 'Not validated'
//   }
// })

// const statusPillColor = computed(() => {
//   switch (validationStatus.value) {
//     case 'valid':
//       return 'positive'
//     case 'invalid':
//       return 'negative'
//     default:
//       return ''
//   }
// })

// Methods
// function countFilledFields() {
//   let count = 0
//   const traverse = (obj) => {
//     for (const key in obj) {
//       if (obj[key] !== null && obj[key] !== '' && obj[key] !== undefined) {
//         if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
//           traverse(obj[key])
//         } else if (Array.isArray(obj[key])) {
//           if (obj[key].length > 0) count++
//         } else {
//           count++
//         }
//       }
//     }
//   }
//   traverse(formData)
//   return count
// }

function handleUpdate() {
  updateJsonPreview()
  emit('update', formData)
}

function updateJsonPreview() {
  const json = JSON.parse(JSON.stringify(formData))
  formattedJson.value = JSON.stringify(json, null, 2)
}

// async function copyJson() {
//   try {
//     await navigator.clipboard.writeText(formattedJson.value)
//     $q.notify({
//       type: 'positive',
//       message: 'JSON copied to clipboard!',
//     })
//   } catch (err) {
//     console.log(err)
//     $q.notify({
//       type: 'negative',
//       message: 'Failed to copy JSON',
//     })
//   }
// }

// function downloadJson() {
//   const blob = new Blob([formattedJson.value], { type: 'application/json' })
//   const url = URL.createObjectURL(blob)
//   const a = document.createElement('a')
//   a.href = url
//   a.download = `skincare-form-${Date.now()}.json`
//   document.body.appendChild(a)
//   a.click()
//   document.body.removeChild(a)
//   URL.revokeObjectURL(url)
// }

// function validateForm() {
//   // Basic validation - expand as needed
//   const errors = []

//   if (!formData.meta.profile.name) errors.push('Patient name is required')
//   if (!formData.meta.profile.age) errors.push('Age is required')
//   if (!formData.meta.profile.gender) errors.push('Gender is required')

//   if (errors.length > 0) {
//     validationStatus.value = 'invalid'
//     $q.notify({
//       type: 'negative',
//       message: `Validation failed: ${errors.join(', ')}`,
//       position: 'top',
//     })
//   } else {
//     validationStatus.value = 'valid'
//     emit('validate', formData)
//     $q.notify({
//       type: 'positive',
//       message: 'Form validated successfully!',
//       position: 'top',
//     })
//   }
// }

// function submitForm() {
//   if (validationStatus.value !== 'valid') {
//     $q.notify({
//       type: 'warning',
//       message: 'Please validate form before submitting',
//       position: 'top',
//     })
//     return
//   }

//   emit('submit', formData)
//   $q.notify({
//     type: 'positive',
//     message: 'Form submitted successfully!',
//     position: 'top',
//   })
// }

// function resetForm() {
//   $q.dialog({
//     title: 'Confirm Reset',
//     message: 'Are you sure you want to reset all form data?',
//     cancel: true,
//     persistent: true,
//   }).onOk(() => {
//     Object.keys(formData).forEach((key) => {
//       if (key === 'meta') {
//         formData.meta.profile = { name: '', age: null, gender: '' }
//         formData.meta.session_id = ''
//         formData.meta.session_datetime = ''
//       } else if (typeof formData[key] === 'object') {
//         resetObject(formData[key])
//       }
//     })
//     validationStatus.value = 'not-validated'
//     updateJsonPreview()
//     emit('update', formData)
//     $q.notify({
//       type: 'info',
//       message: 'Form has been reset',
//       position: 'top',
//     })
//   })
// }

// function resetObject(obj) {
//   Object.keys(obj).forEach((key) => {
//     if (Array.isArray(obj[key])) {
//       obj[key] = []
//     } else if (typeof obj[key] === 'object' && obj[key] !== null) {
//       resetObject(obj[key])
//     } else if (typeof obj[key] === 'string') {
//       obj[key] = ''
//     } else if (typeof obj[key] === 'number') {
//       obj[key] = null
//     } else if (typeof obj[key] === 'boolean') {
//       obj[key] = false
//     }
//   })
// }

// Initialize
updateJsonPreview()
</script>

<style scoped>
.form-wrapper {
  max-width: 1200px;
  margin: 0 auto;
}

.json-output {
  font-family: monospace;
  font-size: 12px;
  white-space: pre-wrap;
  overflow: auto;
  max-height: 400px;
  margin: 0;
  border-radius: 8px;
}
</style>
