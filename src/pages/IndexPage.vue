<template>
  <q-page>
    <PatientIntake
      v-if="currentStep === 1"
      :uploader-files="uploaderFiles"
      @process="handleProcess"
      @save_data="submit"
    />
    <DiagnosisComponent
      v-if="currentStep === 2"
      :diagnosis="diagnosis"
      :faceImages="faceImages"
      @show-major-concerns="handleMajorConcerns"
      @previous="goToPreviousStep"
    />
    <MajorConcerns
      v-if="currentStep === 3"
      :treatable-concerns-summary="diagnosis.treatable_concerns_summary"
      @previous="goToPreviousStep"
      @generate-treatment="handleGenerateTreatment"
      @save_data="submit"
    />
    <TreatmentPlanComponent
      v-if="currentStep === 4"
      :treatment-type="treatment_type"
      :treatment-plan="treatmentPlan"
      :recommended-full-plan="recommendedFullPlan"
      @previous="goToPreviousStep"
      @save_data="submit"
    />
  </q-page>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import PatientIntake from 'src/components/assessment/PatientIntake.vue'
import DiagnosisComponent from 'src/components/assessment/DiagnosisComponent.vue'
import TreatmentPlanComponent from 'src/components/assessment/TreatmentPlanComponent.vue'
import MajorConcerns from 'src/components/assessment/MajorConcerns.vue'
import { useOpenAI } from 'src/composables/useOpenAI'
import {
  SYSTEM_PROMPT_DIAGNOSIS,
  D_REPORT_USER_PROMPT,
  SYSTEM_TREATEMENT_PLAN_PROMPT,
} from 'src/utils/aiPrompts'
import { Loading, LocalStorage, Notify, QSpinnerFacebook } from 'quasar'
import { useAssessmentStore } from 'src/stores/assessmentStore'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { api } from 'src/boot/axios'
import _ from 'lodash'
import { useAuthStore } from 'src/stores/authStore'

const authStore = useAuthStore()

const { getOrCreateConversation, runResponse } = useOpenAI()

const store = useAssessmentStore()
const { assessmentData } = storeToRefs(store)
const route = useRoute()

const faceImages = ref([])
const currentStep = ref(1)

const uploaderFiles = ref([]) // To store uploaded files references
const diagnosis = ref(null)
const treatmentPlan = ref(null)
const recommendedFullPlan = ref(null)
const treatment_type = ref(null)

onMounted(async () => {
  await store.getPatientData()

  let recentStoredId = await getValidAssessmentId()
  if (route.params.assessment_id || recentStoredId) {
    let id = route.params.assessment_id ? route.params.assessment_id : recentStoredId
    await store.getSingleAssessment(id)
    assessmentData.value.id = route.params.assessment_id
      ? route.params.assessment_id
      : recentStoredId
  } else {
    store.createNewAssessment()
  }
})

async function getValidAssessmentId() {
  try {
    Loading.show({
      message: 'Checking for in-progress assessment...',
    })
    const response = await api.get(`/assessments/get-in-progress-assessment/${authStore.user_id}`)
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

async function submit(field) {
  const activeAssessmentId = route.params.assessment_id || assessmentData.value.id
  if (authStore.user_id && activeAssessmentId) {
    let data = {}
    field.forEach((f) => {
      data[f] = _.cloneDeep(assessmentData.value[f])
    })
    console.log(data)
    await store.updateAssessment(data)
  } else {
    if (authStore.user_id && !assessmentData.value.id) {
      await store.createNewAssessment()
    }
  }
}

const handleProcess = async (files) => {
  // INFO: This is use when images stored in server
  // const faceImages = await store.storeFaceImages(files)
  // const apiResponse = await callApiForDiagnosis(assessmentData.value, faceImages)

  const apiResponse = await callApiForDiagnosis(assessmentData.value, files)
  if (apiResponse.error) {
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
    diagnosis.value = apiResponse // e.g., { issues: [...], summary: '...' }
    assessmentData.value.diagnosis = apiResponse
    assessmentData.value.parameters_with_abnormal_scores = apiResponse.treatable_concerns_summary
    submit(['diagnosis', 'parameters_with_abnormal_scores'])
    currentStep.value = 2
  }
}

const handleMajorConcerns = async () => {
  currentStep.value = 3
}

const handleGenerateTreatment = async (selected, treatmentType) => {
  treatment_type.value = treatmentType
  const apiResponse = await callApiForTreatmentPlan(selected, treatmentType)
  if (apiResponse.error) {
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
    treatmentPlan.value = apiResponse.treatment_plan // e.g., { plan: '...', sessions: [...] }
    recommendedFullPlan.value = apiResponse.recommended_full_plan
    assessmentData.value.treatment_plan = apiResponse
    submit(['treatment_plan'])
    currentStep.value = 4
  }
}

const goToPreviousStep = () => {
  if (currentStep.value === 2) {
    currentStep.value = 1
  } else if (currentStep.value === 3) {
    currentStep.value = 2
  } else if (currentStep.value === 4) {
    currentStep.value = 3
  }
}

// Placeholder API functions - replace with actual implementations
async function callApiForDiagnosis(data, images) {
  const convId = await getOrCreateConversation(`${data.user_id}`)
  faceImages.value = images.map((b64) => {
    return `data:image/jpeg;base64,${b64}`
  })
  const input = [
    {
      role: 'system',
      content: SYSTEM_PROMPT_DIAGNOSIS,
    },
    {
      role: 'user',
      content: [
        // INFO: This is for Base64 Images
        ...images.map((b64) => ({
          type: 'input_image',
          image_url: `data:image/jpeg;base64,${b64}`,
        })),
        // INFO: This is used when images stored in server
        // ...images.map((img_url) => ({
        //   type: 'input_image',
        //   image_url: img_url,
        // })),
        {
          type: 'input_text',
          text: D_REPORT_USER_PROMPT,
        },
      ],
    },
  ]

  const result = await runResponse(convId, input, 'diagnosis')
  console.log('✅ Diagnosis:', result)
  return result
}

async function callApiForTreatmentPlan(selected, treatmentType) {
  // Implement ChatGPT API call here
  // Prompt example: "Generate treatment plan based on diagnosis: [JSON.stringify(input)], constraints: [paste DOCX content]"

  Loading.show({
    spinner: QSpinnerFacebook,
    spinnerColor: 'yellow',
    // spinnerSize: 140,
    backgroundColor: 'purple',
    message: 'Generating treatment plan. Hang on...',
    messageColor: 'white',
  })
  const convId = LocalStorage.getItem(`conv_${assessmentData.value.user_id}`)
  console.log('Conversation ID:', convId)

  const input = [
    {
      role: 'system',
      content: [
        {
          type: 'input_text',
          text: SYSTEM_TREATEMENT_PLAN_PROMPT,
        },
      ],
    },
    {
      role: 'user',
      content: [
        {
          type: 'input_text',
          text: JSON.stringify(assessmentData.value, null, 2),
        },
        {
          type: 'input_text',
          text: JSON.stringify({
            treatable_concerns: {
              description:
                'Parameters showing deviations that can be treated or improved with appropriate interventions.',
              parameters_with_abnormal_scores: selected,
            },
            treatment_plan_type: `${treatmentType} session`, // 'single session' or 'full treatment'
          }),
        },
      ],
    },
  ]

  const result = await runResponse(convId, input, 'treatment_plan')
  console.log('🩺 Treatment plans:', result)
  return result
}
</script>
