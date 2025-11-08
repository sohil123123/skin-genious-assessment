<template>
  <q-page>
    <PatientIntake
      v-if="currentStep === 1"
      :uploader-files="uploaderFiles"
      :uploadImagesStep="uploadImagesStep"
      :isPostAssessment="isPostAssessment"
      v-model:startProcessingStep="startProcessingStep"
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
      @post_assessment="postAssessment"
    />
    <PostAssessment
      v-if="currentStep === 5"
      :post_diagnosis="post_diagnosis"
      :faceImages="faceImages"
      :postTreatmentImages="postTreatmentImages"
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
import PostAssessment from 'src/components/assessment/PostAssessment.vue'
import { useOpenAI } from 'src/composables/useOpenAI'
import {
  SYSTEM_PROMPT_DIAGNOSIS,
  D_REPORT_USER_PROMPT,
  SYSTEM_TREATEMENT_PLAN_PROMPT,
  POST_DIAGNOSIS_USER_PROMPT,
} from 'src/utils/aiPrompts'
import { Loading, LocalStorage, Notify, QSpinnerFacebook } from 'quasar'
import { useAssessmentStore } from 'src/stores/assessmentStore'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { api } from 'src/boot/axios'
import _ from 'lodash'
import { useAuthStore } from 'src/stores/authStore'
import constraints from 'src/utils/constraints'

const authStore = useAuthStore()

const { getOrCreateConversation, runResponse } = useOpenAI()

const store = useAssessmentStore()
const { assessmentData } = storeToRefs(store)
const route = useRoute()

const faceImages = ref([])
const postTreatmentImages = ref([])
const currentStep = ref(1)
const uploadImagesStep = ref(false)
const startProcessingStep = ref(false)
const isPostAssessment = ref(false)

const uploaderFiles = ref([]) // To store uploaded files references
const diagnosis = ref(null)
const treatmentPlan = ref(null)
const recommendedFullPlan = ref(null)
const treatment_type = ref(null)
const post_diagnosis = ref(null)

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
  if (isPostAssessment.value) {
    await handlePostAssessment(files)
  } else {
    await handleDiagnosis(files)
  }
}

async function handleDiagnosis(files) {
  faceImages.value = assessmentData.value.images.map((img) => img.url)
  if (files.length > 0) {
    const uploadedImages = await store.storeFaceImages(files, 'pre')
    faceImages.value.push(...uploadedImages)
  }

  // NOTE: Only for test in local
  // faceImages.value = [
  //   'https://skingeniouscrm.cbphysiotherapy.in/storage/user_assessment_images/3/blue.png',
  //   'https://skingeniouscrm.cbphysiotherapy.in/storage/user_assessment_images/4/brown.png',
  //   'https://skingeniouscrm.cbphysiotherapy.in/storage/user_assessment_images/5/ppl.png',
  //   'https://skingeniouscrm.cbphysiotherapy.in/storage/user_assessment_images/6/red.png',
  //   'https://skingeniouscrm.cbphysiotherapy.in/storage/user_assessment_images/7/uv.png',
  //   'https://skingeniouscrm.cbphysiotherapy.in/storage/user_assessment_images/8/white.png',
  //   'https://skingeniouscrm.cbphysiotherapy.in/storage/user_assessment_images/9/woods.png',
  //   'https://skingeniouscrm.cbphysiotherapy.in/storage/user_assessment_images/10/xpl.png',
  // ]

  const desiredOrder = ['white', 'ppl', 'xpl', 'uv', 'woods', 'blue', 'brown', 'red']

  faceImages.value = desiredOrder
    .map((name) => faceImages.value.find((url) => url.toLowerCase().includes(`${name}.png`)))
    .filter(Boolean)

  const apiResponse = await callApiForDiagnosis(assessmentData.value, faceImages.value)

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
    diagnosis.value = apiResponse // e.g., { issues: [...], summary: '...' }
    assessmentData.value.diagnosis = apiResponse
    assessmentData.value.parameters_with_abnormal_scores = apiResponse.treatable_concerns_summary
    submit(['diagnosis', 'parameters_with_abnormal_scores'])
    currentStep.value = 2
  }
}

async function handlePostAssessment(files) {
  postTreatmentImages.value = assessmentData.value.post_images.map((img) => img.url)
  if (files.length > 0) {
    const uploadedImages = await store.storeFaceImages(files, 'post')
    postTreatmentImages.value.push(...uploadedImages)
  }

  // NOTE: Only for test in local
  // postTreatmentImages.value = [
  //   'https://skingeniouscrm.cbphysiotherapy.in/storage/user_assessment_images/11/blue.png',
  //   'https://skingeniouscrm.cbphysiotherapy.in/storage/user_assessment_images/12/brown.png',
  //   'https://skingeniouscrm.cbphysiotherapy.in/storage/user_assessment_images/13/ppl.png',
  //   'https://skingeniouscrm.cbphysiotherapy.in/storage/user_assessment_images/14/red.png',
  //   'https://skingeniouscrm.cbphysiotherapy.in/storage/user_assessment_images/15/uv.png',
  //   'https://skingeniouscrm.cbphysiotherapy.in/storage/user_assessment_images/16/white.png',
  //   'https://skingeniouscrm.cbphysiotherapy.in/storage/user_assessment_images/17/woods.png',
  //   'https://skingeniouscrm.cbphysiotherapy.in/storage/user_assessment_images/18/xpl.png',
  // ]

  const desiredOrder = ['white', 'ppl', 'xpl', 'uv', 'woods', 'blue', 'brown', 'red']

  postTreatmentImages.value = desiredOrder
    .map((name) =>
      postTreatmentImages.value.find((url) => url.toLowerCase().includes(`${name}.png`)),
    )
    .filter(Boolean)

  const apiResponse = await callApiForPostDiagnosis(assessmentData.value, postTreatmentImages.value)

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
    post_diagnosis.value = apiResponse // e.g., { issues: [...], summary: '...' }
    assessmentData.value.post_diagnosis = apiResponse
    submit(['post_diagnosis'])
    currentStep.value = 5
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
    treatmentPlan.value = apiResponse.treatment_plans // e.g., { plan: '...', sessions: [...] }
    // recommendedFullPlan.value = apiResponse.recommended_full_plan
    assessmentData.value.treatment_plans = apiResponse
    submit(['treatment_plans'])
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

  const input = [
    {
      role: 'system',
      content: SYSTEM_PROMPT_DIAGNOSIS,
    },
    {
      role: 'user',
      content: [
        // INFO: This is for Base64 Images
        // ...images.map((b64) => ({
        //   type: 'input_image',
        //   image_url: `data:image/jpeg;base64,${b64}`,
        // })),
        // INFO: This is used when images stored in server
        ...images.map((img_url) => ({
          type: 'input_image',
          image_url: img_url,
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

  const patientData = {
    name: assessmentData.value.name,
    age: assessmentData.value.age,
    gender: assessmentData.value.gender,
    daily_sun_exposure_hours: assessmentData.value.daily_sun_exposure_hours,
    social_event: assessmentData.value.social_event,
    upcoming_travel: assessmentData.value.upcoming_travel,
    medical_history: assessmentData.value.medical_history,
    allergies: assessmentData.value.allergies,
    is_pregnant: assessmentData.value.is_pregnant,
    breastfeeding: assessmentData.value.breastfeeding,
  }

  const input = [
    {
      role: 'system',
      content: [
        {
          type: 'input_text',
          text: SYSTEM_TREATEMENT_PLAN_PROMPT,
        },
        {
          type: 'input_text',
          text: JSON.stringify(constraints, null, 2),
        },
      ],
    },
    {
      role: 'user',
      content: [
        {
          type: 'input_text',
          text: JSON.stringify(patientData, null, 2),
        },
        {
          type: 'input_text',
          text: JSON.stringify({
            treatable_concerns: {
              description:
                'Parameters showing deviations that can be treated or improved with appropriate interventions.',
              parameters_with_abnormal_scores: selected,
            },
            selected_plan_type: `${treatmentType} session`, // 'single session' or 'full treatment'
          }),
        },
      ],
    },
  ]

  const result = await runResponse(convId, input)
  console.log('🩺 Treatment plans:', result)
  return result
}

async function callApiForPostDiagnosis(data, images) {
  const convId = await getOrCreateConversation(`${data.user_id}`)

  const input = [
    {
      role: 'user',
      content: [
        // INFO: This is for Base64 Images
        // ...images.map((b64) => ({
        //   type: 'input_image',
        //   image_url: `data:image/jpeg;base64,${b64}`,
        // })),
        // INFO: This is used when images stored in server
        ...images.map((img_url) => ({
          type: 'input_image',
          image_url: img_url,
        })),
        {
          type: 'input_text',
          text: POST_DIAGNOSIS_USER_PROMPT,
        },
        {
          type: 'input_text',
          text: JSON.stringify(
            {
              metadata: {
                phase: 'reassessment',
                evaluation_type: 'post_treatment',
                treatment_session: 'Session 1',
              },
            },
            null,
            2,
          ),
        },
      ],
    },
  ]

  const result = await runResponse(convId, input)
  console.log('✅ Post Assessment Result:', result)
  return result
}

function postAssessment() {
  currentStep.value = 1
  uploadImagesStep.value = true
  isPostAssessment.value = true
}
</script>
