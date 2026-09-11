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

        <div v-if="!isInitializing">
          <PatientIntake v-if="currentStep === 'step-1'" @save_data="submit" />

          <!-- Assessment Mode Selection -->
          <div v-if="currentStep === 'selection'" class="text-center py-12">
            <h1 class="text-4xl font-serif mb-4">Select Assessment Type</h1>
            <p class="text-grey-7 text-lg mb-12 max-w-2xl mx-auto">
              Choose the depth of analysis for your skin journey today. Select Comprehensive for a
              full treatment plan, or Instant for a quick AI diagnosis.
            </p>

            <div
              class="row q-col-gutter-lg justify-center items-stretch"
              style="max-width: 900px; margin: 0 auto"
            >
              <div class="col-12 col-sm-6">
                <q-card
                  flat
                  bordered
                  class="selection-card full-height column cursor-pointer transition-all bg-grey-1"
                  @click="selectMode('normal')"
                >
                  <q-card-section class="col column q-pa-xl">
                    <div class="row items-center q-mb-lg no-wrap">
                      <div class="icon-wrapper q-mr-md flex flex-center shadow-1 bg-white">
                        <q-icon name="analytics" size="36px" color="black" />
                      </div>
                      <div
                        class="text-h6 font-serif text-weight-bold text-left leading-tight"
                        style="line-height: 1.2"
                      >
                        Comprehensive<br />Analysis
                      </div>
                    </div>

                    <p class="text-body1 text-grey-8 text-left q-mb-xl" style="line-height: 1.6">
                      Full clinical assessment including detailed intake, personalized treatment
                      plans, and post-session tracking.
                    </p>

                    <q-space />

                    <q-btn
                      label="Start Full Assessment"
                      color="black"
                      size="16px"
                      padding="12px 24px"
                      unelevated
                      no-caps
                      rounded
                      class="full-width text-weight-medium"
                    />
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-12 col-sm-6">
                <q-card
                  flat
                  bordered
                  class="selection-card full-height column cursor-pointer transition-all border-amber-3 bg-amber-50"
                  @click="selectMode('instant-normal')"
                >
                  <q-card-section class="col column q-pa-xl">
                    <div class="row items-center q-mb-lg no-wrap">
                      <div class="icon-wrapper q-mr-md flex flex-center shadow-1 bg-white">
                        <q-icon name="bolt" size="36px" color="amber-9" />
                      </div>
                      <div
                        class="text-h6 font-serif text-weight-bold text-left leading-tight text-amber-10"
                        style="line-height: 1.2"
                      >
                        Instant AI<br />Diagnosis
                      </div>
                    </div>

                    <p
                      class="text-body1 text-amber-10 text-left q-mb-xl"
                      style="line-height: 1.6; opacity: 0.85"
                    >
                      Fast-track your diagnosis. Quick patient intake followed by an AI-powered
                      diagnostic skin report.
                    </p>

                    <q-space />

                    <q-btn
                      label="Start Quick Scan"
                      color="amber-9"
                      size="16px"
                      padding="12px 24px"
                      unelevated
                      no-caps
                      rounded
                      class="full-width text-weight-medium"
                    />
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </div>

          <UploadFaceImages
            v-if="currentStep === 'step-2'"
            v-model:startProcessingStep="startProcessingStep"
            :assessmentData="assessmentData"
            :processingMessage="processingMessage"
            @process="handleProcess"
          />
          <DiagnosisComponent
            v-if="currentStep === 'step-3'"
            @show-major-concerns="handleMajorConcerns"
            @previous="goPrev"
          />
          <MajorConcerns
            v-if="currentStep === 'step-4'"
            @previous="goPrev"
            @next="goNext"
            @generate-treatment="handleGenerateTreatment"
            @save_data="submit"
          />
          <TreatmentPlanComponent
            v-if="currentStep === 'step-5'"
            @previous="goPrev"
            @post_assessment="goNext"
            @save_data="submit"
          />
          <UploadFaceImages
            v-if="currentStep === 'step-6'"
            :isPostAssessment="true"
            :assessmentData="assessmentData"
            v-model:startProcessingStep="startProcessingStep"
            @process="handleProcess"
          />

          <PostAssessment
            v-if="currentStep === 'step-7'"
            @save_data="submit"
            @finalize_and_exit="finalizeAndExit"
          />

          <CalibrationAuditV36
            v-if="showCalibrationAudit"
            :skin-state="assessmentData.diagnosis?.v3_4_skin_state"
            :evidence="assessmentData.feature_packet"
          />

          <!-- Navigation Buttons -->
          <div class="q-mt-lg flex justify-between" v-if="currentStep !== 'selection'">
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
    </div>
  </q-page>
</template>

<script setup>
import { onMounted, ref, watch, computed } from 'vue'
import CalibrationAuditV36 from './CalibrationAuditV36.vue'
import PatientIntake from 'src/components/assessment/PatientIntake.vue'
import UploadFaceImages from 'src/components/assessment/UploadFaceImages.vue'
import DiagnosisComponent from 'src/components/assessment/DiagnosisComponent.vue'
import TreatmentPlanComponent from 'src/components/assessment/TreatmentPlanComponent.vue'
import MajorConcerns from 'src/components/assessment/MajorConcerns.vue'
// import PreparationStep from 'src/components/assessment/PreparationStep.vue'
import PostAssessment from 'src/components/assessment/PostAssessment.vue'
import { useOpenAI } from 'src/composables/useOpenAI'
import { Loading, LocalStorage, Notify, QSpinnerFacebook, useQuasar } from 'quasar'
import { useAssessmentStore } from 'src/stores/assessmentStore'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { api } from 'src/boot/axios'
import _ from 'lodash'
import { getFacialPrompts } from 'src/utils/facial'
import { encode } from '@toon-format/toon'
import config from 'src/config.js'

// INFO: This jsons are just for testing
import daignosisJson from 'src/info/diagnosisResponse.json'
import singleSessionJson from 'src/info/singleTreatmentPlan.json'
import fullTreatmentJson from 'src/info/fullTreatmentPlan.json'
import reassessment from 'src/info/reassessment.json'

const $q = useQuasar()
const { getOrCreateConversation, runResponse } = useOpenAI()

const FIVE_MODE_ORDER = [
  'red',
  'subsurface_polarized',
  'surface_polarized',
  'white',
  'woods_uv',
]

const isFiveMode = (value = assessmentData.value?.face_scan_machine) =>
  String(value ?? '').startsWith('5')

const v34ErrorPayload = (error) => ({
  error: {
    message:
      error?.response?.data?.error?.message ||
      error?.response?.data?.message ||
      error?.message ||
      'Facial V3.4 request failed.',
  },
})

const store = useAssessmentStore()
const { assessmentData } = storeToRefs(store)

const route = useRoute()
const router = useRouter()
const showCalibrationAudit = computed(() => process.env.DEV && route.query.calibration === '1')

const sessionId = computed(() => route.query.session_id ? Number(route.query.session_id) : null)
const currentSession = computed(() => {
  if (!sessionId.value || !assessmentData.value.treatment_sessions?.treatments) return null
  return assessmentData.value.treatment_sessions.treatments.find(t => t.id === sessionId.value)
})

function getPreviousScores() {
  if (!sessionId.value || !currentSession.value) {
    return {
      source: 'baseline',
      scores: assessmentData.value.diagnosis
    }
  }

  const currentNum = currentSession.value.session_number
  if (currentNum === 1) {
    return {
      source: 'baseline',
      scores: assessmentData.value.diagnosis
    }
  }

  const prevSess = assessmentData.value.treatment_sessions?.treatments?.find(
    t => t.session_number === currentNum - 1
  )

  if (prevSess && prevSess.post_diagnosis) {
    return {
      source: `session_${currentNum - 1}`,
      scores: prevSess.post_diagnosis
    }
  }

  return {
    source: 'baseline',
    scores: assessmentData.value.diagnosis
  }
}
const currentStep = ref(route.params.step || 'selection')
const isInitializing = ref(true)

const faceImages = ref([])
const postTreatmentImages = ref([])
const startProcessingStep = ref(false)
const isPostAssessment = ref(false)
const processingMessage = ref('')

// const diagnosis = ref(null)
// const recommendedFullPlan = ref(null)
const treatment_type = ref(null)
// const post_diagnosis = ref(null)

const userId = route.params.user_id

console.log(process.env.APP_TEST)

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
  }

  if (route.params.step === 'step-6') {
    isPostAssessment.value = true
  } else {
    isPostAssessment.value = false
  }

  // Force selection if mode not set
  if (!assessmentData.value.assessment_type && currentStep.value !== 'selection') {
    currentStep.value = 'selection'
    navigateToStep('selection')
  }

  isInitializing.value = false
})

// Watch for route changes
watch(
  () => route.params.step,
  (newStep) => {
    currentStep.value = newStep || 'selection'
    if (newStep === 'step-6') {
      isPostAssessment.value = true
    } else {
      isPostAssessment.value = false
    }

    if (!assessmentData.value.assessment_type && currentStep.value !== 'selection') {
      navigateToStep('selection')
    }
  },
)

const steps = computed(() => {
  if (assessmentData.value.assessment_type === 'instant-normal') {
    return ['selection', 'step-1', 'step-2', 'step-3']
  }
  // Default list, but selection is always first
  return ['selection', 'step-1', 'step-2', 'step-3', 'step-4', 'step-5', 'step-6', 'step-7']
})

/* Helpers */
const currentIndex = computed(() => steps.value.indexOf(currentStep.value))
const isFirstStep = computed(() => steps.value.indexOf(currentStep.value) === 0)
const isLastStep = computed(() => {
  const s = steps.value
  return s.indexOf(currentStep.value) === s.length - 1
})

/* 🔥 ROUTE-DRIVEN NAVIGATION */
function navigateToStep(step) {
  router.push({
    name: route.name,
    params: {
      user_id: route.params.user_id,
      step,
      ...(route.params.assessment_id && { assessment_id: route.params.assessment_id }),
      ...(route.params.appointment_id && { appointment_id: route.params.appointment_id }),
    },
    query: route.query,
  })
}

function goNext() {
  if (isLastStep.value) {
    finalizeAndExit()
  } else {
    navigateToStep(steps.value[currentIndex.value + 1])
  }
}

function goPrev() {
  if (!isFirstStep.value) {
    navigateToStep(steps.value[currentIndex.value - 1])
  }
}

async function selectMode(mode) {
  assessmentData.value.assessment_type = mode
  await submit(['assessment_type'])
  goNext()
}

async function getValidAssessmentId() {
  try {
    Loading.show({
      message: 'Checking for in-progress assessment...',
    })
    const response = await api.get(`/assessments/get-in-progress-assessment/${userId}?type=normal`)
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
  if (!assessmentData.value.assessment_type) {
    console.warn('Preventing submit: assessment type not yet selected.')
    return
  }

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

const handleProcess = async (files) => {
  if (isPostAssessment.value) {
    await handlePostAssessment(files)
  } else {
    await handleDiagnosis(files)
  }
}

async function handleDiagnosis(files) {
  faceImages.value = assessmentData.value.images.map((img) => img.url)
  // if (files.length > 0) {
  //   const uploadedImages = await store.storeFaceImages(files, 'pre')
  //   faceImages.value.push(...uploadedImages)
  // }

  const machineMode = assessmentData.value.face_scan_machine?.charAt(0) || '6'
  const imagesOrder = config.IMAGES_ORDER[machineMode] || config.IMAGES_ORDER['6']
  faceImages.value = imagesOrder
    .map((name) => faceImages.value.find((url) => url.toLowerCase().includes(`${name}.`)))
    .filter(Boolean)

  if (process.env.APP_TEST) {
    startProcessingStep.value = false
    // diagnosis.value = daignosisJson // e.g., { issues: [...], summary: '...' }
    assessmentData.value.diagnosis = daignosisJson
    assessmentData.value.parameters_with_abnormal_scores = daignosisJson.treatable_concerns_summary
    submit(['diagnosis', 'parameters_with_abnormal_scores'])
    goNext()
  } else {
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
}

async function handlePostAssessment(files) {
  if (sessionId.value && currentSession.value) {
    postTreatmentImages.value = currentSession.value.post_images.map((img) => img.url)
  } else {
    postTreatmentImages.value = assessmentData.value.post_images.map((img) => img.url)
  }

  const machineMode = assessmentData.value.face_scan_machine?.charAt(0) || '6'
  const imagesOrder = config.IMAGES_ORDER[machineMode] || config.IMAGES_ORDER['6']
  postTreatmentImages.value = imagesOrder
    .map((name) => postTreatmentImages.value.find((url) => url.toLowerCase().includes(`${name}.`)))
    .filter(Boolean)

  if (process.env.APP_TEST) {
    startProcessingStep.value = false
    if (sessionId.value) {
      currentSession.value.post_diagnosis = reassessment
      await store.saveTreatmentSessionPostAssessment(sessionId.value, {
        post_diagnosis: reassessment
      })
    } else {
      assessmentData.value.post_diagnosis = reassessment
    }
    goNext()
  } else {
    const apiResponse = await callApiForPostDiagnosis(assessmentData.value, files)

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
      if (sessionId.value) {
        currentSession.value.post_diagnosis = apiResponse
        await store.saveTreatmentSessionPostAssessment(sessionId.value, {
          post_feature_packet: currentSession.value.post_feature_packet,
          post_diagnosis: apiResponse
        })
      } else {
        assessmentData.value.post_diagnosis = apiResponse
        submit(['post_diagnosis'])
      }
      goNext()
    }
  }
}

const handleMajorConcerns = async () => {
  goNext()
}

const handleGenerateTreatment = async (selected, treatmentType) => {
  treatment_type.value = treatmentType

  if (process.env.APP_TEST) {
    if (treatmentType === 'single') {
      assessmentData.value.treatment_sessions = singleSessionJson
    } else {
      assessmentData.value.treatment_sessions = fullTreatmentJson
    }
    goNext()
  } else {
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
      renumberSteps(apiResponse)
      await updateTreatmentDurations(apiResponse)

      assessmentData.value.treatment_plans = apiResponse
      assessmentData.value.treatment_sessions = apiResponse.treatment_plan
      await submit(['treatment_plans', 'selected_plan_type'])
      if (route.params.appointment_id)
        await store.updateTreatmentSessionId(route.params.appointment_id)
      goNext()
    }
  }
}

const renumberSteps = (plan) => {
  for (const s of plan?.treatment_plan?.treatments ?? []) {
    ;(s.steps ?? []).forEach((step, i) => {
      step.step_number = i + 1
    })
  }
  return plan
}

const updateTreatmentDurations = async (apiResponse) => {
  await Promise.all(
    apiResponse.treatment_plan.treatments.map(async (treatment) => {
      const totalDuration = treatment.steps.reduce((sum, step) => {
        const minutes =
          Number(step.duration_minutes) ||
          Number.parseFloat(String(step.duration ?? '').replace(/(mins|minutes)/gi, '')) ||
          0
        return sum + minutes
      }, 0)

      treatment.treatment_time = totalDuration
      treatment.step_duration_total = totalDuration

      if (treatment.timing_validation) {
        treatment.timing_validation.calculated_from_steps = totalDuration
        treatment.timing_validation.matches_treatment_time = true
      }
    }),
  )
}

async function uploadImageFileToOpenAI(files, type, session_id = null) {
  const uploaded = []
  const fiveMode = isFiveMode()

  for (const [index, f] of files.entries()) {
    const mode = fiveMode ? FIVE_MODE_ORDER[index] ?? null : null
    const fileId = await store.storeFaceImages(f, type, session_id, mode)
    uploaded.push({ type: 'input_image', file_id: fileId, ...(mode ? { mode } : {}) })
  }

  return uploaded
}

// Utility: convert image URL → base64
// async function imageToBase64(url) {
//   return new Promise((resolve, reject) => {
//     const img = new Image()
//     img.crossOrigin = 'Anonymous' // Required for CORS-enabled images
//     img.onload = () => {
//       const canvas = document.createElement('canvas')
//       canvas.width = img.width
//       canvas.height = img.height
//       const ctx = canvas.getContext('2d')
//       ctx.drawImage(img, 0, 0)
//       resolve(canvas.toDataURL('image/png'))
//     }
//     img.onerror = reject
//     img.src = url
//   })
// }

// Placeholder API functions - replace with actual implementations
async function callApiForDiagnosis(data, images) {
  if (isFiveMode(data.face_scan_machine)) {
    try {
      processingMessage.value = 'Uploading five-mode images...'
      await uploadImageFileToOpenAI(images, 'pre')

      processingMessage.value = 'Analyzing your five-mode scan...'
      const response = await api.post(`facial-v34/assessment/${data.id}`, {
        stated_concerns: assessmentData.value.parameters_with_abnormal_scores ?? [],
      })
      const result = response.data?.results
      if (!result?.diagnosis) {
        throw new Error('V3.4 assessment returned no diagnosis payload.')
      }

      assessmentData.value.feature_packet = result.feature_packet
      await submit(['feature_packet'])
      console.log('✅ V3.4 Skin State:', result.skin_state)
      console.log('✅ V3.4 Diagnosis Compatibility:', result.diagnosis)
      return result.diagnosis
    } catch (error) {
      return v34ErrorPayload(error)
    }
  }


  // Convert all images to base64

  // const base64Images = await Promise.all(images.map((url) => imageToBase64(url)))

  const convId = await getOrCreateConversation(
    `${data.user_id}`,
    data.conversation_id,
    data.name,
    data.id,
  )
  assessmentData.value.conversation_id = convId
  submit(['conversation_id'])

  processingMessage.value = 'Uploading images to OpenAI...'
  await uploadImageFileToOpenAI(images, 'pre')
  // console.log(fileArrar)
  const storedFiles = await Promise.all(
    data.images.map((item) => ({
      type: 'input_image',
      file_id: item.custom_properties?.openai_file_id ?? null,
    })),
  )
  // let finalFileIdArray = [...fileArrar, ...storedFiles]
  // console.log(finalFileIdArray)
  const prompts = await getFacialPrompts(data.face_scan_machine)
  const input = [
    {
      role: 'system',
      content: prompts.SYSTEM_PROMPT_FEATURE_PACKET_V1,
    },
    {
      role: 'user',
      content: [
        ...storedFiles,
        {
          type: 'input_text',
          text: prompts.D_REPORT_USER_PROMPT,
        },
      ],
    },
  ]
  processingMessage.value = 'Processing scanned images...'
  console.log('Conv ID:', convId)
  console.log('Diagnosis Input:', input)
  assessmentData.value.feature_packet = await runResponse(convId, input)
  submit(['feature_packet'])
  console.log('✅ Feature Packet:', assessmentData.value.feature_packet)

  const input2 = [
    {
      role: 'system',
      content: [
        {
          type: 'input_text',
          text: prompts.SYSTEM_PROMPT_DIAGNOSIS,
        },
        {
          type: 'input_text',
          text: encode(assessmentData.value.feature_packet),
        },
      ],
    },
    {
      role: 'user',
      content: [
        ...storedFiles,
        {
          type: 'input_text',
          text: prompts.D_REPORT_USER_PROMPT,
        },
      ],
    },
  ]

  console.log('Diagnosis Input:', input2)
  const result2 = await runResponse(convId, input2)
  console.log('✅ Diagnosis:', result2)

  return result2
}
async function callApiForTreatmentPlan(selected, treatmentType) {
  if (isFiveMode()) {
    Loading.show({
      spinner: QSpinnerFacebook,
      spinnerColor: 'yellow',
      backgroundColor: 'purple',
      message: 'Generating V3.4 personalised treatment plan...',
      messageColor: 'white',
    })

    const normalizedMode = treatmentType === 'full' ? 'multiple' : treatmentType
    assessmentData.value.selected_plan_type = normalizedMode

    const medicalHistoryText = JSON.stringify(assessmentData.value.medical_history ?? '').toLowerCase()
    const patientHistory = {
      age: assessmentData.value.age,
      gender: assessmentData.value.gender,
      daily_sun_exposure_hours: assessmentData.value.daily_sun_exposure_hours,
      days_until_social_event: assessmentData.value.social_event,
      days_until_travel: assessmentData.value.upcoming_travel,
      medical_history: assessmentData.value.medical_history,
      allergies: assessmentData.value.allergies,
      pregnant: assessmentData.value.is_pregnant,
      breastfeeding: assessmentData.value.breastfeeding,
      diabetes: medicalHistoryText.includes('diabet'),
      thyroid: medicalHistoryText.includes('thyroid'),
      pcod: medicalHistoryText.includes('pcod') || medicalHistoryText.includes('pcos'),
      on_blood_thinners:
        medicalHistoryText.includes('blood thinner') || medicalHistoryText.includes('anticoag'),
      laser_within_last_7_days: assessmentData.value.recent_peel_or_laser,
      used_retinol_last_24_hours: assessmentData.value.retinol_used_last_night,
      used_salicylic_yesterday: assessmentData.value.used_salicylic_yesterday ?? false,
      used_glycolic_acid_yesterday: assessmentData.value.used_glycolic_yesterday ?? false,
    }

    const regionalTemperatures = {
      forehead: Number(assessmentData.value.skin_temp_for_head),
      left_cheek: Number(assessmentData.value.left_cheek_temp),
      right_cheek: Number(assessmentData.value.right_cheek_temp),
    }

    try {
      const response = await api.post(`facial-v34/treatment-plan/${assessmentData.value.id}`, {
        treatment_mode: normalizedMode,
        selected_concerns: selected,
        patient_history: patientHistory,
        regional_temperatures_c: regionalTemperatures,
      })
      const result = response.data?.results
      if (!result?.treatment_plan?.treatments) {
        throw new Error('V3.4 treatment engine returned no treatment sessions.')
      }
      console.log('🩺 V3.4 Treatment Plan:', result)
      return result
    } catch (error) {
      return v34ErrorPayload(error)
    } finally {
      Loading.hide()
    }
  }


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

  const convId = assessmentData.value.conversation_id

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
    forehead_surface_c: assessmentData.value.skin_temp_for_head + '°C',
    left_cheek_surface_c: assessmentData.value.left_cheek_temp + '°C',
    right_cheek_surface_c: assessmentData.value.right_cheek_temp + '°C',
    laser_within_last_7_days: assessmentData.value.recent_peel_or_laser,
    used_retinol_last_24_hours: assessmentData.value.retinol_used_last_night,
  }

  const prompts = await getFacialPrompts(assessmentData.value.face_scan_machine)
  const input = [
    {
      role: 'system',
      content: [
        {
          type: 'input_text',
          text: prompts.SYSTEM_TREATMENT_PLAN_PROMPT,
        },
        {
          type: 'input_text',
          text: encode(prompts.constraints),
        },
      ],
    },
    {
      role: 'user',
      content: [
        {
          type: 'input_text',
          text: encode(patientData),
        },
        {
          type: 'input_text',
          text: encode(assessmentData.value.feature_packet),
        },
        {
          type: 'input_text',
          text: encode({
            treatable_concerns: {
              description:
                'Parameters showing deviations that can be treated or improved with appropriate interventions.',
              parameters_with_abnormal_scores: selected,
            },
            selected_plan_type: `${treatmentType}`, // 'single', 'express' or 'full'
          }),
        },
      ],
    },
  ]
  console.log('Conv ID:', convId)
  console.log('Treatment plans Input:', input)
  const result = await runResponse(convId, input)
  console.log('🩺 Treatment plans:', result)
  return result
}
async function callApiForPostDiagnosis(data, images) {
  if (isFiveMode(data.face_scan_machine)) {
    try {
      processingMessage.value = 'Uploading post-treatment five-mode images...'
      await uploadImageFileToOpenAI(images, 'post', sessionId.value)

      processingMessage.value = 'Comparing your skin scans...'
      const response = await api.post(`facial-v34/reassessment/${data.id}`, {
        treatment_session_id: sessionId.value,
      })
      const result = response.data?.results
      if (!result?.post_diagnosis) {
        throw new Error('V3.4 reassessment returned no post-diagnosis payload.')
      }
      console.log('✅ V3.4 Reassessment:', result.reassessment_result)
      return result.post_diagnosis
    } catch (error) {
      return v34ErrorPayload(error)
    }
  }


  const convId = await getOrCreateConversation(
    `${data.user_id}`,
    data.conversation_id,
    data.name,
    data.id,
  )
  assessmentData.value.conversation_id = convId
  submit(['conversation_id'])

  // const base64Images = await Promise.all(images.map((url) => imageToBase64(url)))

  processingMessage.value = 'Uploading images to OpenAI...'
  await uploadImageFileToOpenAI(images, 'post', sessionId.value)

  const targetPostImages = sessionId.value && currentSession.value ? currentSession.value.post_images : data.post_images

  const storedFiles = await Promise.all(
    targetPostImages.map((item) => ({
      type: 'input_image',
      file_id: item.custom_properties?.openai_file_id ?? null,
    })),
  )
  // let finalFileIdArray = [...fileArrar, ...storedFiles]

  const prompts = await getFacialPrompts(data.face_scan_machine)

  const prevContext = getPreviousScores()
  const sessionLabel = currentSession.value ? `Session ${currentSession.value.session_number}` : 'Session 1'

  const input = [
    {
      role: 'user',
      content: [
        // INFO: This is for Base64 Images
        // ...base64Images.map((b64) => ({
        //   type: 'input_image',
        //   image_url: b64,
        // })),
        // INFO: This is used when images stored in server
        // ...images.map((img_url) => ({
        //   type: 'input_image',
        //   image_url: img_url,
        // })),
        ...storedFiles,
        {
          type: 'input_text',
          text: prompts.POST_DIAGNOSIS_USER_PROMPT,
        },
        {
          type: 'input_text',
          text: `IMPORTANT: For this reassessment, compare the patient's current post-treatment condition (provided in files above) against the following previous scores representing the patient's state before this treatment session. Use these previous values as the "before_treatment_score_or_label" values to evaluate progress:
Reference Source: ${prevContext.source}
Reference Scores: ${JSON.stringify(prevContext.scores)}`
        },
        {
          type: 'input_text',
          text: JSON.stringify(
            {
              metadata: {
                phase: 'reassessment',
                evaluation_type: 'post_treatment',
                treatment_session: sessionLabel,
              },
            },
            null,
            2,
          ),
        },
      ],
    },
  ]

  processingMessage.value = 'Processing scanned images...'
  console.log('Conv ID:', convId)
  console.log('Post Assessment Input:', input)
  const result = await runResponse(convId, input)
  console.log('✅ Post Assessment Result:', result)
  return result
}
function finalizeAndExit() {
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
      LocalStorage.removeItem('user')
      assessmentData.value.status = 'completed'
      submit(['status'])
      Loading.show({
        message: 'Finalizing and redirecting...',
      })
      setTimeout(() => {
        window.location.href = `${process.env.CRM_URL}/users`
      }, 3000)
    })
    .onCancel(() => {
      console.log('User cancelled')
    })
    .onDismiss(() => {
      console.log('Dialog closed (OK or Cancel)')
    })
}
</script>

<style scoped>
.font-serif {
  font-family: 'Playfair Display', serif;
}

.selection-card {
  border-radius: 24px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.selection-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08) !important;
  border-color: rgba(0, 0, 0, 0.1);
}

.bg-amber-50 {
  background-color: #fffbeb;
}

.border-amber-3 {
  border-color: #fcd34d;
}

.icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.04);
}
</style>
