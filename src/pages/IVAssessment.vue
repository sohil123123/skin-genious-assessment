<template>
  <q-page>
    <div class="min-h-screen bg-grey-2" :class="[$q.screen.width < 500 ? 'p-2' : 'p-6']">
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

        <ClientInformation
          v-if="currentStep === 'step-1'"
          :initial-data="formData"
          :v="v$"
          @update="updateFormData"
        />

        <UploadFaceImages
          v-if="currentStep === 'step-2'"
          v-model:startProcessingStep="startProcessingStep"
          :processingMessage="processingMessage"
          @process="handleProcess"
        />

        <PatientPhysicalAssessment
          v-if="currentStep === 'step-3'"
          :form-data="formData"
          :v="v$"
          @update="updateFormData"
        />

        <!-- Navigation Buttons -->
        <div class="q-mt-lg flex justify-between">
          <q-btn color="black" label="Previous" :disable="isFirstStep" @click="goPrev" />
          <q-btn
            v-if="!isLastStep"
            color="positive"
            label="Next"
            :disable="isLastStep"
            @click="goNext"
          />
          <q-btn
            v-if="isLastStep"
            color="accent"
            outline
            label="Finalize & Exit"
            unelevated
            rounded
            @click="finalizeAndExit"
          />
        </div>
      </div>
    </div>

    <q-page-sticky position="bottom-left" :offset="[18, 18]">
      <q-btn
        color="black"
        label="Previous"
        icon="arrow_back"
        :disable="isFirstStep"
        rounded
        @click="goPrev"
      />
    </q-page-sticky>
    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn
        v-if="!isLastStep"
        rounded
        label="Next"
        icon-right="arrow_forward"
        color="teal"
        @click="goNext"
      />
    </q-page-sticky>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAssessmentStore } from 'src/stores/assessmentStore'
import { storeToRefs } from 'pinia'
import { Loading, Notify, useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import config from 'src/config.js'
import _ from 'lodash'
import ClientInformation from 'src/components/iv-assessment/FormWrapper.vue'
import UploadFaceImages from 'src/components/assessment/UploadFaceImages.vue'
import PatientPhysicalAssessment from 'src/components/iv-assessment/sections/PatientPhysicalAssessment.vue'
import { useOpenAI } from 'src/composables/useOpenAI'
import { SYSTEM_PROMPT_DIAGNOSIS, D_REPORT_USER_PROMPT } from 'src/utils/aiPrompts'
import { useIVAssessmentValidation } from 'src/composables/useIVAssessmentValidation'
import { useVuelidate } from '@vuelidate/core'

const { getOrCreateConversation, runResponse } = useOpenAI()
const $q = useQuasar()
const store = useAssessmentStore()
const { assessmentData } = storeToRefs(store)

const router = useRouter()
const route = useRoute()
const userId = route.params.user_id
const currentStep = ref(route.params.step || 'step-1')
const isPostAssessment = ref(false)

const steps = ['step-1', 'step-2', 'step-3']
const currentIndex = computed(() => steps.indexOf(currentStep.value))
const isFirstStep = computed(() => steps.indexOf(currentStep.value) === 0)
const isLastStep = computed(() => steps.indexOf(currentStep.value) === steps.length - 1)

const startProcessingStep = ref(false)
const processingMessage = ref('')

const faceImages = ref([])

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

const rules = useIVAssessmentValidation(formData)
const v$ = useVuelidate(rules, formData)

const stepFields = {
  'step-1': ['meta', 'section_1_client_questionnaire', 'section_2_machine_objective_inputs_part_1'],
  'step-3': ['section_2_machine_objective_inputs_part_2', 'section_3_dermatological_ai_inputs'],
}

onMounted(async () => {
  await store.getPatientData(userId)

  let recentStoredId = null
  if (route.params.assessment_id) {
    recentStoredId = route.params.assessment_id
  } else {
    recentStoredId = await getValidAssessmentId()
  }
  if (route.params.assessment_id || recentStoredId) {
    let id = route.params.assessment_id ? route.params.assessment_id : recentStoredId
    await store.getSingleAssessment(id)
    assessmentData.value.id = route.params.assessment_id
      ? route.params.assessment_id
      : recentStoredId
  } else {
    store.createNewAssessment()
  }

  if (route.params.step === 'step-6') {
    isPostAssessment.value = true
  } else {
    isPostAssessment.value = false
  }
})

// Watch for route changes
watch(
  () => route.params.step,
  (newStep) => {
    currentStep.value = newStep || 'step-1'
    if (newStep === 'step-6') {
      isPostAssessment.value = true
    } else {
      isPostAssessment.value = false
    }
  },
)

function updateFormData(updatedFormData) {
  formData.value = updatedFormData
}

async function finalizeAndExit() {
  const valid = await isStepValid()
  if (!valid) return

  $q.dialog({
    title: 'Confirm',
    message: 'Would you like to confirm the treatment plan and return to CRM?',
    persistent: true,

    ok: {
      label: 'Yes, Confirm & Exit',
      color: 'positive',
      icon: 'check_circle',
      unelevated: true,
    },
    cancel: {
      label: 'Cancel',
      color: 'negative',
      flat: true,
      icon: 'close',
    },
  })
    .onOk(() => {
      console.log(formData.value)
      // assessmentData.value.status = 'completed'
      // submit(['status'])
      // Loading.show({
      //   message: 'Finalizing and redirecting...',
      // })
      // setTimeout(() => {
      //   // LocalStorage.clear()
      //   window.location.href = `${process.env.CRM_URL}/users`
      // }, 3000)
    })
    .onCancel(() => {
      console.log('User cancelled')
    })
    .onDismiss(() => {
      console.log('Dialog closed (OK or Cancel)')
    })
}

async function submit(field) {
  const activeAssessmentId = route.params.assessment_id || assessmentData.value.id
  if (userId && activeAssessmentId) {
    let data = {}
    field.forEach((f) => {
      data[f] = _.cloneDeep(assessmentData.value[f])
    })
    console.log(data)
    await store.updateAssessment(data)
  } else {
    if (userId && !assessmentData.value.id) {
      await store.createNewAssessment()
    }
  }
}

const isStepValid = async () => {
  const fields = stepFields[currentStep.value]
  if (!fields) return true

  fields.forEach((path) => v$.value[path].$touch())

  return !fields.some((path) => v$.value[path].$invalid)
}

async function goNext() {
  const valid = await isStepValid()
  if (!valid) return

  if (!isLastStep.value) {
    navigateToStep(steps[currentIndex.value + 1])
  }
}

function goPrev() {
  if (!isFirstStep.value) {
    navigateToStep(steps[currentIndex.value - 1])
  }
}

function navigateToStep(step) {
  router.push({
    name: route.name,
    params: {
      user_id: route.params.user_id,
      step,
      ...(route.params.assessment_id && { assessment_id: route.params.assessment_id }),
      ...(route.params.appointment_id && { appointment_id: route.params.appointment_id }),
    },
  })
}

const handleProcess = async (files) => {
  await handleDiagnosis(files)
}

async function handleDiagnosis(files) {
  faceImages.value = assessmentData.value.images.map((img) => img.url)
  // if (files.length > 0) {
  //   const uploadedImages = await store.storeFaceImages(files, 'pre')
  //   faceImages.value.push(...uploadedImages)
  // }

  faceImages.value = config.IMAGES_ORDER.map((name) =>
    faceImages.value.find((url) => url.toLowerCase().includes(`${name}.`)),
  ).filter(Boolean)

  const apiResponse = await callApiForDiagnosis(assessmentData.value, files)

  if (apiResponse.error) {
    startProcessingStep.value = false
    Notify.create({
      type: 'negative',
      message: apiResponse.error.message,
      timeout: 3000,
      actions: [
        {
          icon: 'close',
          color: 'white',
          round: true,
        },
      ],
    })
  } else {
    startProcessingStep.value = false
    // diagnosis.value = apiResponse // e.g., { issues: [...], summary: '...' }
    assessmentData.value.diagnosis = apiResponse
    assessmentData.value.parameters_with_abnormal_scores = apiResponse.treatable_concerns_summary
    submit(['diagnosis', 'parameters_with_abnormal_scores'])
    goNext()
  }
}

async function callApiForDiagnosis(data, images) {
  const convId = await getOrCreateConversation(`${data.user_id}`)

  processingMessage.value = 'Uploading images to OpenAI...'
  await uploadImageFileToOpenAI(images, 'pre')
  const storedFiles = await Promise.all(
    data.images.map((item) => ({
      type: 'input_image',
      file_id: item.custom_properties?.openai_file_id ?? null,
    })),
  )
  console.log(storedFiles)
  const input = [
    {
      role: 'system',
      content: SYSTEM_PROMPT_DIAGNOSIS,
    },
    {
      role: 'user',
      content: [
        ...storedFiles,
        {
          type: 'input_text',
          text: D_REPORT_USER_PROMPT,
        },
      ],
    },
  ]
  processingMessage.value = 'Processing scanned images...'
  console.log('Conv ID:', convId)
  console.log('Diagnosis Input:', input)
  const result = await runResponse(convId, input)
  console.log('✅ Diagnosis:', result)
  return result
}

async function uploadImageFileToOpenAI(files, type) {
  const uploaded = []

  for (const f of files) {
    const fileId = await store.storeFaceImages(f, type)
    uploaded.push({ type: 'input_image', file_id: fileId })
  }

  return uploaded
}

async function getValidAssessmentId() {
  try {
    Loading.show({
      message: 'Checking for in-progress assessment...',
    })
    const response = await api.get(`/assessments/get-in-progress-assessment/${userId}`)
    const item = response.data.results
    if (!item.assessment_id) return null

    if (item.assessment_id) {
      return item.assessment_id
    } else {
      // localStorage.removeItem(`recent_assessment_${route.params.patient_id}`)
      return null
    }
  } catch (error) {
    console.error('Error fetching assessment:', error.response.data)
    return null
  } finally {
    Loading.hide()
  }
}
</script>
