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

        <div v-if="!isInitializing">
          <!-- Assessment Mode Selection -->
          <div v-if="currentStep === 'selection'" class="text-center py-12">
            <h1 class="text-4xl font-serif mb-4">Select IV Assessment Type</h1>
            <p class="text-grey-7 text-lg mb-12 max-w-2xl mx-auto">
              Choose the depth of analysis for your IV therapy journey today. Select Comprehensive
              for a full clinical assessment, or Instant for a quick AI-powered scoring.
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
                  @click="selectMode('iv')"
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
                        Comprehensive<br />IV Analysis
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
                  @click="selectMode('instant-iv')"
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
                        Instant IV<br />Scoring
                      </div>
                    </div>

                    <p
                      class="text-body1 text-amber-10 text-left q-mb-xl"
                      style="line-height: 1.6; opacity: 0.85"
                    >
                      Fast-track your diagnosis. Quick patient intake followed by an AI-powered IV
                      scoring report.
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
            v-if="currentStep === 'step-1'"
            v-model:startProcessingStep="startProcessingStep"
            :assessmentData="formData"
            :processingMessage="processingMessage"
            @process="handleProcess"
          />

          <ClientInformation
            v-if="currentStep === 'step-1'"
            :initial-data="formData.iv_inputs"
            :v="v$.iv_inputs"
            @update="updateIVInputs"
          />

          <PatientPhysicalAssessment
            v-if="currentStep === 'step-2'"
            :form-data="formData.iv_inputs"
            :v="v$.iv_inputs"
            @update="updateIVInputs"
          />

          <ScoringResults
            v-if="currentStep === 'step-3'"
            :ivScores="formData.diagnosis"
            :skinScores="skinScores"
            :initialPlanType="formData.selected_plan_type"
            :mode="formData.assessment_type"
            @handleTreatmentPlan="handleTreatmentPlan"
          />

          <div v-if="currentStep === 'step-4'">
            <TreatmentPlanComponent
              @save_data="debouncedSubmit"
              @start-session="startSpecificSession"
            />
          </div>

          <NurseRunSheet
            v-if="currentStep === 'step-5'"
            :treatmentSessions="formData.treatment_sessions"
            @save_data="debouncedSubmit"
            @finalize_session="handleFinalizeSession"
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
        v-if="currentStep !== 'selection'"
      />
    </q-page-sticky>
    <q-page-sticky position="bottom-right" :offset="[18, 18]" v-if="currentStep !== 'selection'">
      <div class="row q-gutter-sm">
        <q-btn
          v-if="currentStep === 'step-1'"
          rounded
          label="Cancel"
          flat
          color="grey-7"
          @click="cancelAssessment"
        />
        <q-btn
          v-if="!isLastStep"
          rounded
          label="Next"
          icon-right="arrow_forward"
          color="teal"
          @click="goNext"
        />
        <q-btn
          v-if="isLastStep"
          color="accent"
          label="Finalize & Exit"
          unelevated
          rounded
          @click="finalizeAndExit"
        />
      </div>
    </q-page-sticky>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useIVAssessmentStore } from 'src/stores/ivAssessmentStore'
import { storeToRefs } from 'pinia'
import { Loading, Notify, useQuasar, LocalStorage } from 'quasar'
import { api } from 'src/boot/axios'
import config from 'src/config.js'
import _ from 'lodash'
import ClientInformation from 'src/components/iv-assessment/FormWrapper.vue'
import UploadFaceImages from 'src/components/assessment/UploadFaceImages.vue'
import PatientPhysicalAssessment from 'src/components/iv-assessment/sections/PatientPhysicalAssessment.vue'
import { useOpenAI } from 'src/composables/useOpenAI'
import { IV_TREATMENT_PLAN_SYSTEM_PROMPT } from 'src/utils/iv/treatment/treatmentPrompt'
import {
  IV_SCORING_SYSTEM_PROMPT_STAGE_1,
  IV_SCORING_USER_PROMPT_STAGE_1,
  IV_SCORING_SYSTEM_PROMPT_STAGE_4,
} from 'src/utils/iv/scoring/scoringPrompt'
import { useIVAssessmentValidation } from 'src/composables/useIVAssessmentValidation'
import { useVuelidate } from '@vuelidate/core'
import { generateCanonicalJson } from 'src/services/generateCanonicalJson'
import ScoringResults from 'src/components/iv-assessment/results/ScoringResults.vue'
import TreatmentPlanComponent from 'src/components/iv-assessment/results/TreatmentPlanComponent.vue'
import NurseRunSheet from 'src/components/iv-assessment/results/NurseRunSheet.vue'
import { encode } from '@toon-format/toon'
import ivTreatmentGenerationEngine from 'src/utils/iv/treatment/ivTreatmentGenerationEngine.json'
import {
  calculateIVClinicalScoring,
  calculateSkinScores,
} from 'src/utils/iv/scoring/deterministicScoring.js'

const { getOrCreateConversation, runResponse } = useOpenAI()
const $q = useQuasar()
const store = useIVAssessmentStore()
const { formData } = storeToRefs(store)

const router = useRouter()
const route = useRoute()
const userId = route.params.user_id
const currentStep = ref(route.params.step || 'selection')
const isPostAssessment = ref(false)
const isInitializing = ref(true)

const steps = computed(() => {
  if (formData.value.assessment_type === 'instant-iv') {
    return ['selection', 'step-1', 'step-2', 'step-3']
  }
  return ['selection', 'step-1', 'step-2', 'step-3', 'step-4', 'step-5']
})
const currentIndex = computed(() => steps.value.indexOf(currentStep.value))
const isFirstStep = computed(() => steps.value.indexOf(currentStep.value) === 0)
const isLastStep = computed(() => steps.value.indexOf(currentStep.value) === steps.value.length - 1)

const startProcessingStep = ref(false)
const processingMessage = ref('')

const faceImages = ref([])
const ivScores = ref({})
const skinScores = ref({})
const canonicalPayload = ref(null)

const rules = useIVAssessmentValidation(formData)
const v$ = useVuelidate(rules, formData)

const stepFields = {
  'step-1': [
    'iv_inputs.meta',
    'iv_inputs.section_1_client_questionnaire',
    'iv_inputs.section_2_machine_objective_inputs_part_1',
  ],
  'step-2': [
    'iv_inputs.section_2_machine_objective_inputs_part_2',
    'iv_inputs.section_3_dermatological_ai_inputs',
  ],
}

onMounted(async () => {
  await store.getPatientData(userId, 'iv')

  let recentStoredId = null
  if (route.params.assessment_id) {
    recentStoredId = route.params.assessment_id
  } else {
    recentStoredId = await getValidAssessmentId()
  }
  if (route.params.assessment_id || recentStoredId) {
    let id = route.params.assessment_id ? route.params.assessment_id : recentStoredId
    await store.getSingleAssessment(id)
    formData.value.id = route.params.assessment_id ? route.params.assessment_id : recentStoredId
  }

  if (route.params.step === 'step-6') {
    isPostAssessment.value = true
  } else {
    isPostAssessment.value = false
  }

  // Force selection if mode not set
  if (!formData.value.assessment_type && currentStep.value !== 'selection') {
    currentStep.value = 'selection'
    navigateToStep('selection')
  }

  isInitializing.value = false
})

watch(
  () => route.params.step,
  (newStep) => {
    currentStep.value = newStep || 'selection'
    if (newStep === 'step-6') {
      isPostAssessment.value = true
    } else {
      isPostAssessment.value = false
    }

    if (!formData.value.assessment_type && currentStep.value !== 'selection') {
      navigateToStep('selection')
    }
  },
)

const debouncedSubmit = _.debounce(async (fields) => {
  await submit(fields)
}, 1000)

function updateIVInputs(updatedIVInputs) {
  formData.value.iv_inputs = updatedIVInputs
  debouncedSubmit(['iv_inputs'])
}

// function navigateToStep(step) {
//   currentStep.value = step
//   router.replace({ params: { ...route.params, step } })
// }

function cancelAssessment() {
  $q.dialog({
    title: 'Confirm',
    message: 'Are you sure you want to cancel this assessment?',
    persistent: true,
    ok: {
      label: 'Yes, Cancel',
      color: 'negative',
      icon: 'close',
      unelevated: true,
    },
    cancel: {
      label: 'No',
      color: 'primary',
      flat: true,
      icon: 'close',
    },
  }).onOk(() => {
    LocalStorage.clear()
    window.location.href = `${process.env.CRM_URL}/users`
  })
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
  }).onOk(() => {
    formData.value.status = 'completed'
    submit(['status'])
    Loading.show({
      message: 'Finalizing and redirecting...',
    })
    setTimeout(() => {
      window.location.href = `${process.env.CRM_URL}/users`
    }, 3000)
  })
}

async function handleFinalizeSession() {
  const treatmentSessionId = store.treatment_session_id

  $q.dialog({
    title: 'Finalize Session',
    message: 'Mark this session as completed and proceed to the completion screen?',
    persistent: true,
    ok: {
      label: 'Yes, Complete Session',
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
  }).onOk(async () => {
    Loading.show({ message: 'Finalizing session...' })

    try {
      // Mark treatment_session as completed in DB
      if (treatmentSessionId) {
        await store.updateTreatmentSessionStatus(treatmentSessionId, 'completed')
      }

      // Mark assessment as completed
      formData.value.status = 'completed'
      await submit(['status'])

      // Update appointment status if available
      if (route.params.appointment_id) {
        await store.updateStatus(route.params.appointment_id)
      }

      // Navigate to IV Treatment Complete page
      router.push({
        name: 'IVTreatmentComplete',
        params: {
          user_id: route.params.user_id,
          assessment_id: formData.value.id,
          session_id: treatmentSessionId || 0,
          ...(route.params.appointment_id && { appointment_id: route.params.appointment_id }),
        },
      })
    } catch (e) {
      console.error('Failed to finalize session:', e)
      Notify.create({
        type: 'negative',
        message: 'Failed to finalize session. Please try again.',
      })
    } finally {
      Loading.hide()
    }
  })
}

async function selectMode(mode) {
  formData.value.assessment_type = mode
  await submit(['assessment_type'])
  goNext()
}

async function goPrev() {
  navigateToStep(steps.value[currentIndex.value - 1])
}

async function submit(field) {
  if (!formData.value.assessment_type) {
    console.warn('Preventing submit: assessment type not yet selected.')
    return
  }

  const activeAssessmentId = route.params.assessment_id || formData.value.id
  if (userId && activeAssessmentId) {
    let data = {}
    field.forEach((f) => {
      data[f] = _.cloneDeep(formData.value[f])
    })
    await store.updateAssessment(data)
  } else {
    if (userId && !formData.value.id) {
      await store.createNewAssessment()
    }
  }
}

const isStepValid = async () => {
  const fields = stepFields[currentStep.value]
  if (!fields) return true

  for (const path of fields) {
    const parts = path.split('.')
    let vNode = v$.value
    for (const part of parts) {
      if (vNode[part]) {
        vNode = vNode[part]
      }
    }
    vNode.$touch()
  }

  const isInvalid = fields.some((path) => {
    const parts = path.split('.')
    let vNode = v$.value
    for (const part of parts) {
      if (vNode[part]) {
        vNode = vNode[part]
      }
    }
    return vNode.$invalid
  })

  return !isInvalid
}

async function goNext() {
  if (currentStep.value === 'selection') {
    navigateToStep(steps.value[currentIndex.value + 1])
    return
  }

  const valid = await isStepValid()
  if (!valid) {
    console.log(
      'Invalid fields:',
      v$.value.$errors.map((e) => e.$property),
    )
    Notify.create({
      type: 'negative',
      message: 'Please fill all required fields before proceeding.',
    })
    return
  }

  // --- Pipeline Processing Logic ---
  if (currentStep.value === 'step-2') {
    // Transitioning from Inputs to Scoring
    Loading.show({ message: 'Building Canonical Payload & Calculating Scores...' })
    try {
      const canonical = generateCanonicalJson(formData.value.iv_inputs)
      canonicalPayload.value = canonical

      // 1. Calculate IV 8-Axes
      ivScores.value = await generateIVScoring(formData.value, canonical)

      // 2. Prepare Skin Scores (from diagnosis)
      skinScores.value =
        formData.value.parameters_with_abnormal_scores?.Skin_score_data?.scores || {}

      // Save results to store
      if (!ivScores.value.error) {
        formData.value.diagnosis = ivScores.value
        await submit(['diagnosis'])
      }

      Loading.hide()
    } catch (e) {
      console.error(e)
      Loading.hide()
      Notify.create({ type: 'negative', message: 'Failed to process assessment data.' })
      return
    }
  }

  if (currentStep.value === 'step-4') {
    // Transitioning from Plan Selection to Run Sheet
    const selected = formData.value.iv_selected_option

    if (!selected) {
      Notify.create({
        type: 'warning',
        message: 'Please select a treatment plan option to proceed.',
      })
      return
    }

    // Extract the protocol for the immediate session
    let sessionProtocol = null

    // Case A: Plan Option (has 'sessions' array) - PRIORITY IF PLAN
    if (selected.option_type === 'plan_option' && selected.sessions?.length > 0) {
      // Use the first session's recommended protocol
      const firstSession = selected.sessions[0]
      sessionProtocol = firstSession.recommended_protocol || null
    }
    // Case B: Single Session or Budget Option (has 'protocols' array)
    else if (selected.protocols && selected.protocols.length > 0) {
      sessionProtocol = selected.protocols[0]
    }

    if (!sessionProtocol) {
      Notify.create({
        type: 'negative',
        message: 'Selected option does not have a valid protocol for this session.',
      })
      return
    }

    // Populate treatment_sessions with metadata for the new iv_sessions table
    const planWeekIndex =
      selected.option_type === 'plan_option' ? selected.sessions?.[0]?.week_index || 1 : null

    const ivSessionData = {
      selected_protocol_id: sessionProtocol.protocol_id,
      selected_option_type: selected.option_type,
      is_plan: selected.option_type === 'plan_option',
      plan_week_index: planWeekIndex,
      plan_duration_weeks: selected.plan_duration_weeks || null,
      schedule_description: selected.schedule_description || null,
      all_plan_sessions: selected.sessions || [],
      engine_versions: {
        generation_engine: ivTreatmentGenerationEngine.version,
      },
    }

    formData.value.treatment_sessions = {
      treatments: [sessionProtocol],
      iv_session_data: ivSessionData,
    }
    await submit(['treatment_sessions'])
    if (route.params.appointment_id) {
      await store.updateTreatmentSessionId(route.params.appointment_id)
    }
  }

  if (!isLastStep.value) {
    navigateToStep(steps.value[currentIndex.value + 1])
  }
}

async function startSpecificSession(index) {
  const selected = formData.value.iv_selected_option

  if (!selected) {
    Notify.create({
      type: 'warning',
      message: 'Please select a treatment plan option to proceed.',
    })
    return
  }

  let sessionProtocol = null

  if (selected.option_type === 'plan_option' && selected.sessions?.length > index) {
    sessionProtocol = selected.sessions[index].recommended_protocol || null
  } else if (selected.protocols && selected.protocols.length > 0) {
    sessionProtocol = selected.protocols[0]
  }

  if (!sessionProtocol) {
    Notify.create({
      type: 'negative',
      message: 'Selected option does not have a valid protocol for this session.',
    })
    return
  }

  const planWeekIndex =
    selected.option_type === 'plan_option' ? selected.sessions?.[index]?.week_index || 1 : null

  const ivSessionData = {
    selected_protocol_id: sessionProtocol.protocol_id,
    selected_option_type: selected.option_type,
    is_plan: selected.option_type === 'plan_option',
    plan_week_index: planWeekIndex,
    plan_duration_weeks: selected.plan_duration_weeks || null,
    schedule_description: selected.schedule_description || null,
    all_plan_sessions: selected.sessions || [],
    active_session_index: index,
    engine_versions: {
      generation_engine: ivTreatmentGenerationEngine.version,
    },
  }

  formData.value.treatment_sessions = {
    treatments: [sessionProtocol],
    iv_session_data: ivSessionData,
    option_type: selected.option_type,
  }
  await submit(['treatment_sessions'])

  if (route.params.appointment_id) {
    await store.updateTreatmentSessionId(route.params.appointment_id)
  }

  navigateToStep('step-5')
}

async function generateIVScoring(data, canonical) {
  const coerceToNumeric = (obj) => {
    if (Array.isArray(obj)) {
      return obj.map(coerceToNumeric)
    }
    if (obj !== null && typeof obj === 'object') {
      const coercedObj = {}
      for (const key in obj) {
        coercedObj[key] = coerceToNumeric(obj[key])
      }
      return coercedObj
    }
    if (typeof obj === 'string') {
      const num = Number(obj)
      if (!isNaN(num) && obj.trim() !== '') {
        return num
      }
    }
    return obj
  }

  const coercedCanonical = coerceToNumeric(canonical)
  const coercedParams = coerceToNumeric(data.parameters_with_abnormal_scores)

  const manualScores = calculateIVClinicalScoring(
    coercedCanonical.session_intake_raw || {},
    coercedCanonical.session_machines_raw || {},
    coercedCanonical.skin_ai_raw || {},
  )

  coercedCanonical.manual_calculated_scores = manualScores

  const convId = await getOrCreateConversation(
    `${data.user_id}`,
    data.conversation_id,
    data.name,
    data.id,
  )
  formData.value.conversation_id = convId
  submit(['conversation_id'])

  const IV_SCORING_USER_PROMPT = encode(coercedCanonical)
  const input = [
    {
      role: 'system',
      content: IV_SCORING_SYSTEM_PROMPT_STAGE_4,
    },
    {
      role: 'user',
      content: [
        {
          type: 'input_text',
          text: IV_SCORING_USER_PROMPT,
        },
        {
          type: 'input_text',
          text: encode(coercedParams),
        },
      ],
    },
  ]
  processingMessage.value = 'Processing scanned images...'
  const result = await runResponse(convId, input)
  return result
}

async function generateTreatmentPlan() {
  Loading.show({ message: 'AI is generating optimized treatment options...' })
  try {
    const canonical = generateCanonicalJson(formData.value.iv_inputs)
    const IV_TREATMENT_PLAN_USER_PROMPT = encode(canonical)
    const input = [
      {
        role: 'system',
        content: IV_TREATMENT_PLAN_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: IV_TREATMENT_PLAN_USER_PROMPT,
      },
    ]

    const result = await runResponse(formData.value.conversation_id, input)

    if (!result.error) {
      formData.value.iv_treatment_plan = result
      await submit(['iv_treatment_plan'])
      Loading.hide()
      return true
    } else {
      Notify.create({ type: 'negative', message: result.error.response.data.message })
      Loading.hide()
      return false
    }
  } catch (e) {
    console.error(e)
    Loading.hide()
    Notify.create({ type: 'negative', message: 'Failed to generate treatment plan.' })
    return false
  }
}

async function handleTreatmentPlan() {
  if (currentStep.value === 'step-3') {
    // Transitioning from Safety to Treatment Generation
    // if (!formData.value.treatment_sessions || formData.value.treatment_sessions.length === 0) {
    const success = await generateTreatmentPlan()
    if (!success) return
    // }

    if (!isLastStep.value) {
      navigateToStep(steps.value[currentIndex.value + 1])
    }
  }
}

// function goPrev() {
//   if (!isFirstStep.value) {
//     navigateToStep(steps[currentIndex.value - 1])
//   }
// }

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

const handleProcess = async (files) => {
  try {
    await handleIVScoring(files)
    Notify.create({
      type: 'positive',
      message: 'IV 8-Axes calculated successfully.',
      timeout: 3000,
      actions: [
        {
          icon: 'close',
          color: 'white',
          round: true,
        },
      ],
    })
    Loading.hide()
  } catch (e) {
    console.error(e)
    Loading.hide()
    Notify.create({
      type: 'negative',
      message: 'Failed to calculate IV 8-Axes.',
      timeout: 0,
      actions: [
        {
          icon: 'close',
          color: 'white',
          round: true,
        },
      ],
    })
  }
}

async function handleIVScoring(files) {
  faceImages.value = formData.value.images.map((img) => img.url)

  const machineMode = formData.value.face_scan_machine?.charAt(0) || '6'
  const imagesOrder = config.IMAGES_ORDER[machineMode] || config.IMAGES_ORDER['6']

  faceImages.value = imagesOrder
    .map((name) => faceImages.value.find((url) => url.toLowerCase().includes(`${name}.`)))
    .filter(Boolean)

  const apiResponse = await callApiForIVScoring(formData.value, files)

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
    formData.value.parameters_with_abnormal_scores = apiResponse
    if (apiResponse.scores.OSS.score_0_100) {
      formData.value.iv_inputs.section_3_dermatological_ai_inputs.oxidative_stress_score_oss =
        apiResponse.scores.OSS.score_0_100
    }
    if (apiResponse.scores.GMS.score_0_100) {
      formData.value.iv_inputs.section_3_dermatological_ai_inputs.glycation_metabolic_score_gms =
        apiResponse.scores.GMS.score_0_100
    }
    if (apiResponse.scores.MVI.score_0_100) {
      formData.value.iv_inputs.section_3_dermatological_ai_inputs.vascularity_inflammation_index_mvi =
        apiResponse.scores.MVI.score_0_100
    }
    if (apiResponse.scores.BHS.score_0_100) {
      formData.value.iv_inputs.section_3_dermatological_ai_inputs.barrier_hydration_stress_score_bhs =
        apiResponse.scores.BHS.score_0_100
    }
    submit(['parameters_with_abnormal_scores', 'iv_inputs'])
  }
}

async function callApiForIVScoring(data, images) {
  const convId = await getOrCreateConversation(
    `${data.user_id}`,
    data.conversation_id,
    data.name,
    data.id,
  )
  formData.value.conversation_id = convId
  submit(['conversation_id'])

  processingMessage.value = 'Uploading images to OpenAI...'

  //INFO: STAGE 1
  await uploadImageFileToOpenAI(images, 'pre')

  const getFileId = (nameVal) => {
    const machineMode = data.face_scan_machine?.charAt(0) || '6'
    let aliases = [nameVal]
    if (machineMode === '5') {
      if (nameVal === 'uv') aliases = ['woods_uv', 'woods', 'uv']
      else if (nameVal === 'positive') aliases = ['red', 'positive']
      else if (nameVal === 'blue') aliases = ['surface_polarized', 'subsurface_polarized', 'blue']
      else if (nameVal === 'white') aliases = ['white']
    } else {
      if (nameVal === 'uv') aliases = ['uv', 'woods']
      else if (nameVal === 'positive') aliases = ['positive', 'red']
      else if (nameVal === 'blue') aliases = ['blue']
      else if (nameVal === 'white') aliases = ['white']
    }

    const found = data.images.find((img) => {
      const targetName = (img.name || img.file_name || img.url || '').toLowerCase()
      return aliases.some(alias => targetName.includes(alias))
    })
    return found?.custom_properties?.openai_file_id ?? found?.openai_file_id ?? null
  }

  const uvId = getFileId('uv')
  const positiveId = getFileId('positive')
  const whiteId = getFileId('white')
  const blueId = getFileId('blue')

  const content = [
    {
      type: 'input_text',
      text: 'Image 1 = UV MODE',
    },
  ]
  if (uvId) {
    content.push({
      type: 'input_image',
      file_id: uvId,
    })
  }

  content.push({
    type: 'input_text',
    text: 'Image 2 = POSITIVE MODE',
  })
  if (positiveId) {
    content.push({
      type: 'input_image',
      file_id: positiveId,
    })
  }

  content.push({
    type: 'input_text',
    text: 'Image 3 = WHITE MODE',
  })
  if (whiteId) {
    content.push({
      type: 'input_image',
      file_id: whiteId,
    })
  }

  content.push({
    type: 'input_text',
    text: 'Image 4 = BLUE MODE',
  })
  if (blueId) {
    content.push({
      type: 'input_image',
      file_id: blueId,
    })
  }

  content.push({
    type: 'input_text',
    text: IV_SCORING_USER_PROMPT_STAGE_1,
  })

  const input = [
    {
      role: 'system',
      content: IV_SCORING_SYSTEM_PROMPT_STAGE_1,
    },
    {
      role: 'user',
      content,
    },
  ]
  processingMessage.value = 'Processing scanned images...'
  const result = await runResponse(convId, input)

  //INFO: STAGE 2 & 3 (Deterministic)
  processingMessage.value = 'Calculating skin scores...'
  const result3 = calculateSkinScores(result)
  return result3
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
    const response = await api.get(`/assessments/get-in-progress-assessment/${userId}?type=iv`)
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
