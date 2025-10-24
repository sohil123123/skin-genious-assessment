<template>
  <q-page>
    <PatientIntake
      v-if="currentStep === 1"
      :patient-data="patientData"
      :uploader-files="uploaderFiles"
      @update-patient="patientData = $event"
      @process="handleProcess"
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
    />
    <TreatmentPlanComponent
      v-if="currentStep === 4"
      :treatment-type="treatment_type"
      :treatment-plan="treatmentPlan"
      :recommended-full-plan="recommendedFullPlan"
      @previous="goToPreviousStep"
    />
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
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

const { getOrCreateConversation, runResponse } = useOpenAI()

const faceImages = ref([])
const currentStep = ref(1)
const patientData = ref({
  id: null,
  fullName: '',
  age: 21,
  gender: 'Male',
  sunExposure: null,
  upcomingTravel: false,
  socialEvent: false,
  medicalHistory: [],
  allergies: [],
  is_patient_pregnant: false,
  breastfeeding: false,
})
const uploaderFiles = ref([]) // To store uploaded files references
const diagnosis = ref(null)
const treatmentPlan = ref(null)
const recommendedFullPlan = ref(null)
const treatment_type = ref(null)

// const faceImages = [
//   {
//     image_url:
//       'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg',
//     type: 'input_image',
//   },
// ]

const handleProcess = async (files) => {
  // Simulate or implement API call to ChatGPT for diagnosis
  // You need to handle patientData.value and files (array of File objects)
  // For example: Upload images to a storage (e.g., Firebase/S3) to get URLs, then send to ChatGPT Vision API with prompt including patientData and constraints from the DOCX
  // Placeholder:
  const apiResponse = await callApiForDiagnosis(patientData.value, files)
  if (apiResponse.error) {
    Notify.create({
      type: 'negative',
      message: apiResponse.error.message,
      timeout: 0,
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
      timeout: 0,
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
  console.log('Patient data:', data)
  const convId = await getOrCreateConversation(data.id)
  console.log('Conversation ID:', convId)

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
        // { type: 'input_text', text: 'Patient data:\n' + JSON.stringify(data, null, 2) },
        ...images.map((b64) => ({
          type: 'input_image',
          image_url: `data:image/jpeg;base64,${b64}`,
        })),
        // ...faceImages,
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

async function callApiForTreatmentPlan(selected, treatmentType) {
  // Implement ChatGPT API call here
  // Prompt example: "Generate treatment plan based on diagnosis: [JSON.stringify(input)], constraints: [paste DOCX content]"

  console.log('===>', selected, treatmentType)
  Loading.show({
    spinner: QSpinnerFacebook,
    spinnerColor: 'yellow',
    // spinnerSize: 140,
    backgroundColor: 'purple',
    message: 'Generating treatment plan. Hang on...',
    messageColor: 'white',
  })
  const convId = LocalStorage.getItem(`conv_${patientData.value.id}`)
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
          text: JSON.stringify(patientData.value, null, 2),
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

  const result = await runResponse(convId, input)
  console.log('🩺 Treatment plans:', result)
  return result
}
</script>
