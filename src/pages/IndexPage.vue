<template>
  <q-page>
    <PatientIntake
      v-if="currentStep === 1"
      :form-data="formData"
      :uploader-files="uploaderFiles"
      @process="handleProcess"
    />
    <DiagnosisComponent
      v-if="currentStep === 2"
      :diagnosis="diagnosis"
      @generate-treatment="handleGenerateTreatment"
      @previous="goToPreviousStep"
    />
    <TreatmentPlanComponent
      v-if="currentStep === 3"
      :treatment-plan="treatmentPlan"
      @previous="goToPreviousStep"
    />
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import PatientIntake from 'src/components/assessment/PatientIntake.vue'
import DiagnosisComponent from 'src/components/assessment/DiagnosisComponent.vue'
import TreatmentPlanComponent from 'src/components/assessment/TreatmentPlanComponent.vue'
import { useOpenAI } from 'src/composables/useOpenAI'
import {
  SYSTEM_PROMPT_DIAGNOSIS,
  D_REPORT_USER_PROMPT,
  SYSTEM_TREATEMENT_PLAN_PROMPT,
  USER_TREATMENT_PLAN_PROMPT,
} from 'src/utils/aiPrompts'
import { Loading, LocalStorage, QSpinnerFacebook } from 'quasar'

const { getOrCreateConversation, runResponse } = useOpenAI()

const currentStep = ref(1)
const formData = ref({
  id: '1',
  fullName: '',
  age: 21,
  gender: 'Male',
  sunExposure: null,
  upcomingTravel: false,
  socialEvent: false,
  medicalHistory: [],
  allergies: [],
})
const uploaderFiles = ref([]) // To store uploaded files references
const diagnosis = ref(null)
const treatmentPlan = ref(null)

const handleProcess = async (files) => {
  // Simulate or implement API call to ChatGPT for diagnosis
  // You need to handle formData.value and files (array of File objects)
  // For example: Upload images to a storage (e.g., Firebase/S3) to get URLs, then send to ChatGPT Vision API with prompt including formData and constraints from the DOCX
  // Placeholder:
  const apiResponse = await callApiForDiagnosis(formData.value, files)
  diagnosis.value = apiResponse // e.g., { issues: [...], summary: '...' }
  currentStep.value = 2
}

const handleGenerateTreatment = async () => {
  // Simulate or implement API call to ChatGPT for treatment plan
  // Send diagnosis.value or original formData.value + images URLs, with constraints from DOCX in prompt
  // Placeholder:
  const apiResponse = await callApiForTreatmentPlan()
  treatmentPlan.value =
    apiResponse.treatment_plan || apiResponse.treatment_plan_overview || apiResponse // e.g., { plan: '...', sessions: [...] }
  currentStep.value = 3
}

const goToPreviousStep = () => {
  if (currentStep.value === 2) {
    currentStep.value = 1
  } else if (currentStep.value === 3) {
    currentStep.value = 2
  }
}

// Placeholder API functions - replace with actual implementations
async function callApiForDiagnosis(data, images) {
  const convId = await getOrCreateConversation(data.id)
  console.log('Conversation ID:', convId)

  const input = [
    {
      role: 'system',
      content: SYSTEM_PROMPT_DIAGNOSIS,
    },
    {
      role: 'user',
      content: [
        { type: 'input_text', text: 'Patient data:\n' + JSON.stringify(data, null, 2) },
        ...images.map((b64) => ({
          type: 'input_image',
          image_url: `data:image/jpeg;base64,${b64}`,
        })),
        {
          type: 'input_text',
          text: D_REPORT_USER_PROMPT,
        },
      ],
    },
  ]

  const result = await runResponse(convId, input)
  console.log('✅ Diagnosis:', result)
  return result
}

async function callApiForTreatmentPlan() {
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
  const convId = LocalStorage.getItem(`conv_${formData.value.id}`)
  console.log('Conversation ID:', convId)

  const input = [
    {
      role: 'system',
      content: SYSTEM_TREATEMENT_PLAN_PROMPT,
    },
    {
      role: 'user',
      content: [
        {
          type: 'input_text',
          text: USER_TREATMENT_PLAN_PROMPT,
        },
      ],
    },
  ]

  const result = await runResponse(convId, input)
  console.log('🩺 Treatment plans:', result)
  return result
}
</script>
