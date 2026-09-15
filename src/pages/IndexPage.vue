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
            :busy="treatmentGenerationBusy"
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
// Planning correction: requires workflowGenerationV3101.js from v3.10.1.
// Set SESSION_WINDOWS_V39 in BOTH frontend/backend contracts to
// single:[60,75], express:[35,45], multiple:[60,75]. No timing-table override here.
// Preserve deployment-specific edits when merging this supplied-source replacement.
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
import { encode } from '@toon-format/toon'
import config from 'src/config.js'
import { selectedConcernsV39, workflowPromptV39, planningEvidenceV39 } from 'src/utils/facial/workflowV39/workflowContractV39.js'
import { generateValidatedWorkflowV3101 } from 'src/utils/facial/workflowV39/workflowGenerationV3101.js'

// INFO: This jsons are just for testing
import daignosisJson from 'src/info/diagnosisResponse.json'
import singleSessionJson from 'src/info/singleTreatmentPlan.json'
import fullTreatmentJson from 'src/info/fullTreatmentPlan.json'
import reassessment from 'src/info/reassessment.json'

const $q = useQuasar()
const { getOrCreateConversation, runResponse } = useOpenAI()

const store = useAssessmentStore()
const { assessmentData } = storeToRefs(store)

const route = useRoute()
const router = useRouter()

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
const treatmentGenerationBusy = ref(false)
let pendingTreatmentDraft = null
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
      try {
        await submit(String(assessmentData.value.face_scan_machine).startsWith('5')
          ? ['feature_packet', 'diagnosis', 'parameters_with_abnormal_scores']
          : ['diagnosis', 'parameters_with_abnormal_scores'])
        goNext()
      } catch (e) {
        Notify.create({ type: 'negative', message: 'Scores are ready, but saving failed: ' + (e.response?.data?.error?.message || e.message), timeout: 0 })
      }
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
        const saved = await store.saveTreatmentSessionPostAssessment(sessionId.value, {
          post_feature_packet: currentSession.value.post_feature_packet,
          post_diagnosis: apiResponse
        })
        if (!saved) return
        await releaseNextCourseBlockV39()
      } else {
        assessmentData.value.post_diagnosis = apiResponse
        submit(['post_diagnosis'])
      }
      goNext()
    }
  }
}

// Course commits are append-only on the server; never resubmit completed sessions
// through the legacy assessment replacement endpoint.
async function persistCourseBlockV39(plan) {
  const { data: response } = await api.post(`facial-v34/course-block/${assessmentData.value.id}`, { plan })
  if (!response.success) throw new Error(response.error?.message || 'Unable to save the treatment block.')
  assessmentData.value.treatment_plans = response.results.treatment_plans
  assessmentData.value.treatment_sessions = response.results.treatment_sessions
  store.treatment_session_id = response.results.treatment_sessions.treatments[0]?.id
}

async function releaseNextCourseBlockV39() {
  if (!String(assessmentData.value.face_scan_machine).startsWith('5')) return
  const number = Number(currentSession.value?.session_number)
  const plan = assessmentData.value.treatment_plans
  const total = plan?.treatment_plan?.estimated_sessions
  if (plan?.workflow_v39?.mode !== 'multiple' || !number || number % 2 || number >= total) return
  if (assessmentData.value.treatment_sessions?.treatments?.some(s => Number(s.session_number) === number + 1)) return
  const selected = assessmentData.value.parameters_with_abnormal_scores || plan.workflow_v39.selected_concerns
  const next = await callApiForTreatmentPlan(selected, 'multiple', { after_session_id: sessionId.value })
  if (next.error) {
    Notify.create({ type: 'negative', message: 'Reassessment saved. Next sessions remain pending: ' + next.error.message, timeout: 0,
      actions: [{ label: 'Retry', handler: releaseNextCourseBlockV39 }] })
    return
  }
  try { await persistCourseBlockV39(next) }
  catch (e) { Notify.create({ type: 'negative', message: 'Reassessment saved. Could not save next sessions: ' + (e.response?.data?.error?.message || e.message), timeout: 0,
    actions: [{ label: 'Retry', handler: releaseNextCourseBlockV39 }] }) }
}

const handleMajorConcerns = async () => {
  goNext()
}

const handleGenerateTreatment = async (selected, treatmentType) => {
  if (treatmentGenerationBusy.value) return
  treatmentGenerationBusy.value = true
  try {
  treatment_type.value = treatmentType

  if (process.env.APP_TEST) {
    if (treatmentType === 'single') {
      assessmentData.value.treatment_sessions = singleSessionJson
    } else {
      assessmentData.value.treatment_sessions = fullTreatmentJson
    }
    goNext()
  } else {
    const draftKey = JSON.stringify([assessmentData.value.id, selected, treatmentType])
    const apiResponse = pendingTreatmentDraft?.key === draftKey ? pendingTreatmentDraft.plan : await callApiForTreatmentPlan(selected, treatmentType)
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
      if (String(assessmentData.value.face_scan_machine).startsWith('5')) {
        pendingTreatmentDraft = {key:draftKey,plan:apiResponse}
        try {
          apiResponse.workflow_v39.generation_id ??= crypto.randomUUID()
          // Check saved state before a retry, so a lost HTTP response does not
          // cause a second initial-plan save or overwrite existing sessions.
          const {data: existingResponse} = await api.get(`assessments/${assessmentData.value.id}`)
          const existing = existingResponse.results
          if (!existing) throw new Error('Could not verify the saved treatment state.')
          if(existing.treatment_plans?.workflow_v39?.generation_id === apiResponse.workflow_v39.generation_id) {
            assessmentData.value.treatment_plans=existing.treatment_plans
            assessmentData.value.treatment_sessions=existing.treatment_sessions
          } else {
            if(existing.treatment_sessions?.treatments?.length) throw new Error('A saved treatment plan already exists. Open it instead of replacing its sessions.')
            // Initial Single, Express and first package pair use the host's
            // existing AssessmentController persistence and session creation.
            assessmentData.value.treatment_plans = apiResponse
            const saved = await store.updateAssessment({treatment_plans:apiResponse,selected_plan_type:treatmentType})
            if (!saved?.treatment_sessions?.treatments?.length) throw new Error('Plan save did not return treatment sessions. Check the assessment update response.')
            assessmentData.value.treatment_sessions = saved.treatment_sessions
          }
          store.treatment_session_id = assessmentData.value.treatment_sessions?.treatments?.[0]?.id
          pendingTreatmentDraft = null
        } catch (e) { Notify.create({ type: 'negative', message: 'Plan is ready; saving failed. Click Generate again to retry saving this draft: ' + (e.response?.data?.error?.message || e.message), timeout:0 }); return }
      } else {
        renumberSteps(apiResponse)
        await updateTreatmentDurations(apiResponse)
        assessmentData.value.treatment_plans = apiResponse
        assessmentData.value.treatment_sessions = apiResponse.treatment_plan
        await submit(['treatment_plans'])
      }
      if (route.params.appointment_id)
        await store.updateTreatmentSessionId(route.params.appointment_id)
      goNext()
    }
  }
  } finally { treatmentGenerationBusy.value = false }
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
    if (!fileId) throw new Error('An image upload failed. Please retry the upload before scoring.')
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
  if (String(data.face_scan_machine).startsWith('5')) {
    try {
      processingMessage.value = 'Processing scanned images...'
      await uploadImageFileToOpenAI(images, 'pre')
      let response
      if (!images?.length) {
        try { response = (await api.get(`facial-v34/assessment/${data.id}`)).data }
        catch (e) {
          // Only a missing/stale cache permits a new vision call. Never hide an
          // actual server failure behind an automatic, expensive re-analysis.
          if (![404, 409].includes(e.response?.status)) throw e
        }
      }
      if (!response) response = (await api.post(`facial-v34/assessment/${data.id}`, {})).data
      if (!response.success) return { error: response.error }
      if (response.results?.transport_version !== 'aia_compact_transport_v3.9.1') {
        throw new Error('Deploy the matching v3.9.1 backend transport patch before saving this assessment.')
      }
      assessmentData.value.feature_packet = response.results.feature_packet
      // diagnosis already contains deterministic scores; there is no LLM scoring call.
      return response.results.diagnosis
    } catch (e) { return { error: { message: e.response?.data?.error?.message || e.message } } }
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

async function callApiForTreatmentPlan(selected, treatmentType, courseContext = {}) {
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

  try {
  const isV39 = String(assessmentData.value.face_scan_machine).startsWith('5')
  const concerns = planningEvidenceV39(selectedConcernsV39(selected))
  const convId = await getOrCreateConversation(
    `${assessmentData.value.user_id}`, assessmentData.value.conversation_id,
    assessmentData.value.name, assessmentData.value.id,
  )
  assessmentData.value.conversation_id = convId
  await submit(['conversation_id'])
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
          text: prompts.SYSTEM_TREATMENT_PLAN_PROMPT + (isV39 ? workflowPromptV39() + '\nUse only the supplied clinic-approved procedure settings. Device capability ranges alone are not approved treatment settings. If essential settings or permissions are absent, identify the exact missing field and affected modality in the error; do not return a generic missing-clinic-information error. Resolve $ref objects against this request’s planning context; they preserve identical clinical evidence without repeating it.' : ''),
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
          text: isV39 ? 'Use the completed assessment supplied by the server planning context below.' : encode(assessmentData.value.feature_packet),
        },
        {
          type: 'input_text',
          text: encode({
            treatable_concerns: {
              description:
                'Parameters showing deviations that can be treated or improved with appropriate interventions.',
              parameters_with_abnormal_scores: concerns,
            },
            treatment_plan_type: treatmentType,
            selected_plan_type: `${treatmentType}`, // 'single', 'express' or 'full'
          }),
        },
      ],
    },
  ]
  if (isV39) {
    const { data: contextResponse } = await api.post(`facial-v34/planning-context/${assessmentData.value.id}`, {
      after_session_id: courseContext.after_session_id || null,
    })
    if (!contextResponse.success) throw new Error(contextResponse.error?.message || 'Planning context unavailable.')
    Object.assign(courseContext, contextResponse.results.course_context)
    input.push({ role: 'user', content: [{ type: 'input_text', text: JSON.stringify(compactPlanningInputForRequest(contextResponse.results)) }] })
  }
  if (!isV39) return await runResponse(convId, input)
  return await generateValidatedWorkflowV3101({
    generate: messages => runResponse(convId, messages),
    input, mode: treatmentType, concerns, context: courseContext,
  })
  } catch (e) { return { error: { message: e.response?.data?.error?.message || e.message } } }
  finally { Loading.hide() }
}

// Request-only deduplication. Original assessment objects are never mutated.
// References always point to complete objects retained under skin_state.
function compactPlanningInputForRequest(value) {
  const clean = planningEvidenceV39(value)
  if (!clean?.skin_state) return clean
  const canonical = value => JSON.stringify(value, function (key, item) {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      return Object.fromEntries(Object.keys(item).sort().map(k => [k, item[k]]))
    }
    return item
  })
  const escape = key => String(key).replace(/~/g, '~0').replace(/\//g, '~1')
  const index = new Map()
  const visit = (value, path) => {
    if (!value || typeof value !== 'object') return
    const signature = canonical(value)
    if (signature.length >= 256 && !index.has(signature)) index.set(signature, path)
    for (const [key, child] of Object.entries(value)) visit(child, `${path}/${escape(key)}`)
  }
  visit(clean.skin_state, '#/skin_state')
  const deduplicate = value => {
    if (!value || typeof value !== 'object') return value
    const target = index.get(canonical(value))
    if (target) return { $ref: target }
    if (Array.isArray(value)) return value.map(deduplicate)
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, deduplicate(child)]))
  }
  const result = { ...clean }
  for (const key of ['feature_packet', 'diagnosis']) {
    if (result[key]) result[key] = deduplicate(result[key])
  }
  result.reference_notes = `${clean.reference_notes || ''} Objects containing $ref are exact duplicates of retained skin_state objects. Resolve each JSON Pointer within THIS planning-context object. All unique evidence is retained. The submitted client primary selections are authoritative.`
  return result
}

async function callApiForPostDiagnosis(data, images) {
  if (String(data.face_scan_machine).startsWith('5')) {
    try {
      processingMessage.value = 'Comparing scanned images...'
      await uploadImageFileToOpenAI(images, 'post', sessionId.value)
      const { data: response } = await api.post(`facial-v34/reassessment/${data.id}`, {
        treatment_session_id: sessionId.value || null,
      })
      if (!response.success) return { error: response.error }
      if (currentSession.value) currentSession.value.post_feature_packet = response.results.post_feature_packet
      return response.results.post_diagnosis
    } catch (e) { return { error: { message: e.response?.data?.error?.message || e.message } } }
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
