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
import {
  formatFacialClientScores,
  prepareFacialEngineInput,
} from 'src/utils/facial/clientScoreDisplay.js'
import {
  buildClinicTreatmentContext,
  buildTreatmentPlannerInput,
  TREATMENT_PLAN_RESPONSE_FORMAT,
  validateClinicTreatmentPlan,
  buildClinicGenerationContract,
} from 'src/utils/facial/treatmentClinicRules.js'
import { treatmentHistoryFlags, inClinicProductRecords } from 'src/utils/facial/5_light_modes/treatmentIntegration.js'
import { encode } from '@toon-format/toon'
import config from 'src/config.js'

// INFO: This jsons are just for testing
import daignosisJson from 'src/info/diagnosisResponse.json'
import singleSessionJson from 'src/info/singleTreatmentPlan.json'
import fullTreatmentJson from 'src/info/fullTreatmentPlan.json'
import reassessment from 'src/info/reassessment.json'

const $q = useQuasar()
const { getOrCreateConversation, runResponse } = useOpenAI()
const FACIAL_JSON_OPTIONS = { text: { format: { type: 'json_object' } } }

const store = useAssessmentStore()
const { assessmentData } = storeToRefs(store)

const route = useRoute()
const router = useRouter()

const sessionId = computed(() => (route.query.session_id ? Number(route.query.session_id) : null))
const currentSession = computed(() => {
  if (!sessionId.value || !assessmentData.value.treatment_sessions?.treatments) return null
  return assessmentData.value.treatment_sessions.treatments.find((t) => t.id === sessionId.value)
})

function getPreviousScores() {
  if (!sessionId.value || !currentSession.value) {
    return {
      source: 'baseline',
      scores: assessmentData.value.diagnosis,
    }
  }

  const currentNum = currentSession.value.session_number
  if (currentNum === 1) {
    return {
      source: 'baseline',
      scores: assessmentData.value.diagnosis,
    }
  }

  const prevSess = assessmentData.value.treatment_sessions?.treatments?.find(
    (t) => t.session_number === currentNum - 1,
  )

  if (prevSess && prevSess.post_diagnosis) {
    return {
      source: `session_${currentNum - 1}`,
      scores: prevSess.post_diagnosis,
    }
  }

  return {
    source: 'baseline',
    scores: assessmentData.value.diagnosis,
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

function scanImageMappingError(message) {
  const error = new Error(message)
  error.name = 'ScanImageMappingError'
  return error
}

function orderScanImages(records, machine, { requireComplete = true, requireFileIds = true } = {}) {
  const machineMode = String(machine || '6').charAt(0)
  const imagesOrder = config.IMAGES_ORDER[machineMode]
  if (!imagesOrder || !Array.isArray(records)) {
    throw scanImageMappingError('The scan mode or image list is invalid. Please reload the assessment.')
  }

  const byMode = new Map()
  const fileIds = new Set()
  for (const [index, record] of records.entries()) {
    let mode
    try {
      if (typeof record?.url !== 'string' || !record.url.trim()) throw new Error('Missing image URL')
      const pathname = new URL(record.url, 'https://scan.invalid').pathname
      const filename = decodeURIComponent(pathname.slice(pathname.lastIndexOf('/') + 1))
      mode = filename.replace(/\.[^.]+$/, '').toLowerCase()
    } catch {
      throw scanImageMappingError(`Scan image ${index + 1} has an invalid filename or URL.`)
    }

    // Exact filename stems keep surface_polarized distinct from subsurface_polarized.
    if (!imagesOrder.includes(mode)) {
      throw scanImageMappingError(
        `Scan image ${index + 1} has an unrecognised mode filename. Expected: ${imagesOrder.join(', ')}.`,
      )
    }
    if (byMode.has(mode)) {
      throw scanImageMappingError(`More than one image is assigned to ${mode}. Keep one image per mode.`)
    }

    const fileId = record.custom_properties?.openai_file_id
    if (requireFileIds) {
      if (typeof fileId !== 'string' || !fileId.trim()) {
        throw scanImageMappingError(`The ${mode} image has no uploaded file ID. Please upload it again.`)
      }
      if (fileIds.has(fileId)) {
        throw scanImageMappingError('The same uploaded image is assigned to more than one light mode.')
      }
      fileIds.add(fileId)
    }
    byMode.set(mode, { mode, record })
  }

  const missing = imagesOrder.filter((mode) => !byMode.has(mode))
  if (requireComplete && missing.length) {
    throw scanImageMappingError(`Missing scan image mode(s): ${missing.join(', ')}. Please upload them.`)
  }
  // Partial lists are allowed only for fixture previews, never for live API requests.
  return imagesOrder.filter((mode) => byMode.has(mode)).map((mode) => byMode.get(mode))
}

function scanImageRequestContent(orderedImages) {
  return orderedImages.flatMap(({ mode, record }, index) => [
    {
      type: 'input_text',
      text: `Image ${index + 1} — ${config.IMAGE_MODE_LABELS[mode]} (mode: ${mode}).`,
    },
    { type: 'input_image', file_id: record.custom_properties.openai_file_id },
  ])
}

const handleProcess = async (files) => {
  try {
    if (isPostAssessment.value) {
      await handlePostAssessment(files)
    } else {
      await handleDiagnosis(files)
    }
  } catch (error) {
    if (error?.name !== 'ScanImageMappingError') throw error
    startProcessingStep.value = false
    Notify.create({ type: 'negative', message: error.message, timeout: 6000 })
  }
}

async function handleDiagnosis(files) {
  if (process.env.APP_TEST) {
    faceImages.value = orderScanImages(
      assessmentData.value.images || [],
      assessmentData.value.face_scan_machine,
      { requireComplete: false, requireFileIds: false },
    ).map(({ record }) => record.url)
    startProcessingStep.value = false
    // diagnosis.value = daignosisJson // e.g., { issues: [...], summary: '...' }
    assessmentData.value.diagnosis = daignosisJson
    assessmentData.value.parameters_with_abnormal_scores = daignosisJson.treatable_concerns_summary
    submit(['diagnosis', 'parameters_with_abnormal_scores'])
    goNext()
  } else {
    const apiResponse = formatFacialClientScores(
      await callApiForDiagnosis(assessmentData.value, files),
    )

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
  if (sessionId.value && !currentSession.value) {
    throw scanImageMappingError('The treatment session could not be found. Please reload the assessment.')
  }

  if (process.env.APP_TEST) {
    const previewImages = sessionId.value
      ? currentSession.value.post_images
      : assessmentData.value.post_images
    postTreatmentImages.value = orderScanImages(
      previewImages || [],
      assessmentData.value.face_scan_machine,
      { requireComplete: false, requireFileIds: false },
    ).map(({ record }) => record.url)
    startProcessingStep.value = false
    if (sessionId.value) {
      currentSession.value.post_diagnosis = reassessment
      await store.saveTreatmentSessionPostAssessment(sessionId.value, {
        post_diagnosis: reassessment,
      })
    } else {
      assessmentData.value.post_diagnosis = reassessment
    }
    goNext()
  } else {
    const apiResponse = formatFacialClientScores(
      await callApiForPostDiagnosis(assessmentData.value, files),
    )

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
          post_diagnosis: apiResponse,
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
    const apiResponse = formatFacialClientScores(
      await callApiForTreatmentPlan(selected, treatmentType),
    )
    if (apiResponse.error) {
      console.error('[facial-treatment] generation rejected', apiResponse.error)
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
      try {
        await store.updateAssessment({
          treatment_plans: _.cloneDeep(apiResponse),
          selected_plan_type: treatmentType === 'full' ? 'multiple' : treatmentType,
        }, { throwOnError: true })
        if (route.params.appointment_id)
          await store.updateTreatmentSessionId(route.params.appointment_id)
        goNext()
      } catch (error) {
        console.error('[facial-treatment] save failed', { message: error.message, status: error.response?.status, errors: error.response?.data?.errors })
        Notify.create({
          type: 'negative',
          message: error.response?.data?.message || error.message || 'The treatment plan could not be saved.',
          timeout: 0,
          actions: [{ icon: 'close', color: 'white', round: true }],
        })
      }
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
      const totalDuration = treatment.steps.reduce(
        (sum, step) => sum + Number(step.duration || 0),
        0,
      )

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

  for (const f of files) {
    const fileId = await store.storeFaceImages(f, type, session_id)
    uploaded.push({ type: 'input_image', file_id: fileId })
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
  const orderedImages = orderScanImages(assessmentData.value.images, data.face_scan_machine)
  faceImages.value = orderedImages.map(({ record }) => record.url)
  const storedFiles = scanImageRequestContent(orderedImages)
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
  const featurePacket = await runResponse(convId, input, undefined, FACIAL_JSON_OPTIONS)
  if (featurePacket?.error) return featurePacket
  assessmentData.value.feature_packet = featurePacket
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
  const result2 = await runResponse(convId, input2, undefined, FACIAL_JSON_OPTIONS)
  console.log('✅ Diagnosis:', result2)

  return result2
}

async function callApiForTreatmentPlan(selected, treatmentType) {
  const planningStarted = performance.now()
  // Treatment-only timings: no patient data or changes to scoring/model settings.
  const timedTreatmentResponse = async (request, options) => {
    const started = performance.now()
    try {
      return await runResponse(convId, request, undefined, options)
    } finally {
      console.info('[facial-treatment] request elapsed', {
        stage: options.metadata.stage,
        reasoning_effort: options.reasoning_effort,
        elapsed_ms: Math.round(performance.now() - started),
      })
    }
  }
  const finishPlanning = (plan, corrected) => {
    console.info('[facial-treatment] planning completed', {
      corrected,
      valid: !plan?.error,
      elapsed_ms: Math.round(performance.now() - planningStarted),
    })
    return plan
  }

  Loading.show({
    spinner: QSpinnerFacebook,
    spinnerColor: 'yellow',
    // spinnerSize: 140,
    backgroundColor: 'purple',
    message: 'Generating treatment plan. Hang on...',
    messageColor: 'white',
  })

  const convId = assessmentData.value.conversation_id

  const clinicTreatmentContext = buildClinicTreatmentContext(
    assessmentData.value.diagnosis,
    assessmentData.value.feature_packet,
  )

  // Numeric treatment inputs; null stays missing instead of becoming "null°C".
  const temperatureValue = value => {
    if (!['number', 'string'].includes(typeof value) || String(value).trim() === '') return null
    const number = Number(value)
    return Number.isFinite(number) ? number : null
  }
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
    forehead_surface_c: temperatureValue(assessmentData.value.skin_temp_for_head),
    left_cheek_surface_c: temperatureValue(assessmentData.value.left_cheek_temp),
    right_cheek_surface_c: temperatureValue(assessmentData.value.right_cheek_temp),
    laser_within_last_7_days: assessmentData.value.recent_peel_or_laser,
    used_retinol_last_24_hours: assessmentData.value.retinol_used_last_night,
  }

  const prompts = await getFacialPrompts(assessmentData.value.face_scan_machine)
  if (prompts.generateTreatmentPlan) {
    const products = inClinicProductRecords(prompts.available_skincare_products)
    try {
      const plan = await prompts.generateTreatmentPlan({
        callModel: async (request, controls) => {
          let response
          try {
            response = await api.post('ai/responses', {
            ...request,
            // The authenticated gateway accepts Responses message arrays.
            input: [{ role: 'user', content: [{ type: 'input_text', text: request.input }] }],
            timeout_ms: controls.timeoutMs,
            metadata: { stage: 'facial_treatment_v5' },
          }, { signal: controls.signal, timeout: controls.timeoutMs })
          } catch (error) {
            throw Object.assign(new Error(error.response?.data?.error?.message || error.response?.data?.message || error.message), { code: error.code, status: error.response?.status, details: error.response?.data?.error?.details || error.response?.data?.errors || [], response_id: error.response?.data?.error?.response_id })
          }
          return response.data
        },
        systemPrompt: prompts.buildTreatmentSystemPrompt(products),
        constraints: prompts.constraints,
        diagnosis: assessmentData.value.diagnosis,
        selectedConcerns: selected,
        treatmentType,
        clinicContext: clinicTreatmentContext,
        options: {
          patientProfileAndHistory: patientData,
          historyRuleFlags: treatmentHistoryFlags(assessmentData.value),
          temperatureReadings: {
            forehead_surface_c: patientData.forehead_surface_c,
            left_cheek_surface_c: patientData.left_cheek_surface_c,
            right_cheek_surface_c: patientData.right_cheek_surface_c,
          },
          featurePacket: assessmentData.value.feature_packet,
          inClinicProductNames: products.map(product => product.name),
        },
        // The former validator is the shared catalogue-ledger contract. V5's
        // local validator replaces it; no additional server evaluator exists here.
        onMetrics: metrics => console.info('[facial-treatment-v5]', metrics),
      })
      return plan
    } finally { Loading.hide() }
  }
  const generationConstraints = {
    ...prompts.constraints,
    clinical_constraints: {
      ...prompts.constraints.clinical_constraints,
      execution_validation_contract: buildClinicGenerationContract(),
    },
  }
  const treatmentPlannerInput = buildTreatmentPlannerInput(
    assessmentData.value.diagnosis,
    selected,
    treatmentType,
    clinicTreatmentContext,
    generationConstraints,
  )
  const { treatment_catalogue, ...patientTreatmentInput } = treatmentPlannerInput
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
          text: encode(generationConstraints),
        },
        {
          type: 'input_text',
          text: encode({ treatment_catalogue }),
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
          text: encode(patientTreatmentInput),
        },
      ],
    },
  ]
  console.log('Conv ID:', convId)
  // Sizes are characters, not model tokens. Version markers expose stale/partial
  // prompt deployment without logging patient evidence or the full request.
  const promptText = prompts.SYSTEM_TREATMENT_PLAN_PROMPT
  const requestProfile = {
    prompt_revision: promptText.match(/^TREATMENT PLANNER REVISION: (.+)$/m)?.[1] || 'unversioned',
    catalogue_review_revision: promptText.match(/^CATALOGUE REVIEW REVISION: (.+)$/m)?.[1] || 'unversioned',
    imaging_mode: assessmentData.value.face_scan_machine,
    reasoning_effort: 'medium',
    instruction_characters: input[0].content[0].text.length,
    constraint_characters: input[0].content[1].text.length,
    catalogue_characters: input[0].content[2].text.length,
    patient_characters: input[1].content[0].text.length,
    feature_characters: input[1].content[1].text.length,
    diagnosis_and_selection_characters: input[1].content[2].text.length,
  }
  console.info('[facial-treatment] request profile', requestProfile)
  const treatmentOptions = {
    text: { format: TREATMENT_PLAN_RESPONSE_FORMAT },
    reasoning_effort: 'medium',
    metadata: { stage: 'facial_treatment' },
  }
  const result = await timedTreatmentResponse(input, treatmentOptions)
  console.log('🩺 Treatment plans:', result)
  const reportValidationWarnings = warnings => {
    if (warnings.length) console.info('[facial-treatment] advisory checks', warnings)
  }
  const validated = validateClinicTreatmentPlan(result, clinicTreatmentContext, treatmentType, generationConstraints, reportValidationWarnings)
  if (validated?.error?.code !== 'facial_treatment_rule_violation') return finishPlanning(validated, false)
  console.warn('[facial-treatment] correction required', {
    validation_error_count: validated.error.details.length,
    validation_errors: validated.error.details,
  })

  // One treatment-only correction attempt. API failures/refusals are not retried
  // here; existing transport retry handling remains in useOpenAI unchanged.
  const repairInput = [...input, {
    role: 'user',
    content: [{
      type: 'input_text',
      text: encode({
        task: 'Correct this treatment draft using the same assessment, primary concerns, clinic protocols and complete session limits. Resolve the listed validation errors; do not change scores/targets, invent findings, pad fixed durations or remove clinically required care. Complete the catalogue coverage record consistently with the selected steps. Recheck useful permitted options before filler. Preserve case-specific adaptations and client explanations. If no compliant appropriate plan exists, return treatments: [] and explain why in modality_omission_explanation.other_relevant_options.',
        previous_plan: prepareFacialEngineInput(result),
        validation_errors: validated.error.details,
      }),
    }],
  }]
  const corrected = await timedTreatmentResponse(repairInput, {
    ...treatmentOptions,
    metadata: { stage: 'facial_treatment_correction' },
  })
  const correctedValidation = validateClinicTreatmentPlan(corrected, clinicTreatmentContext, treatmentType, generationConstraints, reportValidationWarnings)
  if (correctedValidation?.error) {
    console.error('[facial-treatment] correction rejected', {
      code: correctedValidation.error.code,
      validation_errors: correctedValidation.error.details || [correctedValidation.error.message],
    })
  }
  return finishPlanning(correctedValidation, true)
}

async function callApiForPostDiagnosis(data, images) {
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

  const targetPostImages =
    sessionId.value ? currentSession.value?.post_images : assessmentData.value.post_images

  const orderedImages = orderScanImages(targetPostImages, data.face_scan_machine)
  postTreatmentImages.value = orderedImages.map(({ record }) => record.url)
  const storedFiles = scanImageRequestContent(orderedImages)
  // let finalFileIdArray = [...fileArrar, ...storedFiles]

  const prompts = await getFacialPrompts(data.face_scan_machine)

  const prevContext = getPreviousScores()
  const sessionLabel = currentSession.value
    ? `Session ${currentSession.value.session_number}`
    : 'Session 1'

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
Reference Scores: ${JSON.stringify(prepareFacialEngineInput(prevContext.scores))}`,
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
  const result = await runResponse(convId, input, undefined, FACIAL_JSON_OPTIONS)
  console.log('✅ Post Assessment Result:', result)
  // Presentation only: the same-session reference can clarify sebum's balance
  // direction. The scoring request and all returned engine values stay intact.
  return formatFacialClientScores(result, { sebumBaseline: prevContext.scores })
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
