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
          @update:planType="updatePlanType"
        />

        <div v-if="currentStep === 'step-4'">
          <TreatmentPlanComponent @save_data="debouncedSubmit" />
        </div>

        <NurseRunSheet
          v-if="currentStep === 'step-6'"
          :treatmentSessions="formData.treatment_sessions"
        />
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
          :label="currentStep === 'step-2' ? 'Generate IV Scores' : 'Next'"
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
import {
  FACE_SCAN_SYSTEM_PROMPT,
  IV_SCORING_SYSTEM_PROMPT,
  IV_TREATMENT_PLAN_SYSTEM_PROMPT,
} from 'src/utils/ivPrompts'
import { useIVAssessmentValidation } from 'src/composables/useIVAssessmentValidation'
import { useVuelidate } from '@vuelidate/core'
import { generateCanonicalJson } from 'src/services/generateCanonicalJson'
// import { calculateIVScoring } from 'src/services/ivScoring'
// import { evaluateSafety } from 'src/services/safetyEngine'
import ScoringResults from 'src/components/iv-assessment/results/ScoringResults.vue'
// import SafetyReview from 'src/components/iv-assessment/results/SafetyReview.vue'
import TreatmentPlanComponent from 'src/components/iv-assessment/results/TreatmentPlanComponent.vue'
import NurseRunSheet from 'src/components/iv-assessment/results/NurseRunSheet.vue'
// import { available_skincare_products } from 'src/utils/productJson'
import { encode } from '@toon-format/toon'

const { getOrCreateConversation, runResponse } = useOpenAI()
const $q = useQuasar()
const store = useIVAssessmentStore()
const { formData } = storeToRefs(store)

const router = useRouter()
const route = useRoute()
const userId = route.params.user_id
const currentStep = ref(route.params.step || 'step-1')
const isPostAssessment = ref(false)

const steps = ['step-1', 'step-2', 'step-3', 'step-4', 'step-5', 'step-6']
const currentIndex = computed(() => steps.indexOf(currentStep.value))
const isFirstStep = computed(() => steps.indexOf(currentStep.value) === 0)
const isLastStep = computed(() => steps.indexOf(currentStep.value) === steps.length - 1)

const startProcessingStep = ref(false)
const processingMessage = ref('')

const faceImages = ref([])
const ivScores = ref({})
const skinScores = ref({})
// const safetyResults = ref({ status: 'safe', flags: [] })
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

const debouncedSubmit = _.debounce(async (fields) => {
  await submit(fields)
}, 1000)

function updateIVInputs(updatedIVInputs) {
  formData.value.iv_inputs = updatedIVInputs
  debouncedSubmit(['iv_inputs'])
}

function updatePlanType(planType) {
  formData.value.selected_plan_type = planType
  debouncedSubmit(['selected_plan_type'])
}

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
  })
    .onOk(() => {
      console.log(formData.value)
      // formData.value.status = 'completed'
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
  const activeAssessmentId = route.params.assessment_id || formData.value.id
  if (userId && activeAssessmentId) {
    let data = {}
    field.forEach((f) => {
      data[f] = _.cloneDeep(formData.value[f])
    })
    console.log(data)
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
      formData.value.diagnosis = ivScores.value
      await submit(['diagnosis'])

      Loading.hide()
    } catch (e) {
      console.error(e)
      Loading.hide()
      Notify.create({ type: 'negative', message: 'Failed to process assessment data.' })
      return
    }
  }

  // if (currentStep.value === 'step-3') {
  //   // Transitioning from Scoring to Safety
  //   Loading.show({ message: 'Generating Treatment Plan...' })
  //   try {
  //     const results = evaluateSafety(canonicalPayload.value)
  //     safetyResults.value = results

  //     // Save results
  //     formData.value.safety_review = results
  //     await submit(['safety_review'])
  //     Loading.hide()
  //   } catch (e) {
  //     console.error(e)
  //     Loading.hide()
  //     return
  //   }
  // }

  if (currentStep.value === 'step-3') {
    // Transitioning from Safety to Treatment Generation
    if (!formData.value.treatment_sessions || formData.value.treatment_sessions.length === 0) {
      await generateTreatmentPlan()
    }
  }

  if (!isLastStep.value) {
    navigateToStep(steps[currentIndex.value + 1])
  }
}

async function generateIVScoring(data, canonical) {
  const convId = await getOrCreateConversation(
    `${data.user_id}`,
    data.conversation_id,
    data.name,
    data.id,
  )
  formData.value.conversation_id = convId

  const IV_SCORING_USER_PROMPT = encode(canonical)
  const input = [
    {
      role: 'system',
      content: IV_SCORING_SYSTEM_PROMPT,
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
          text: encode(data.parameters_with_abnormal_scores),
        },
      ],
    },
  ]
  processingMessage.value = 'Processing scanned images...'
  const result = await runResponse(convId, input)
  console.log('✅ IV Diagnosis Result:', result)
  return result
}

async function generateTreatmentPlan() {
  Loading.show({ message: 'AI is generating optimized treatment options...' })
  try {
    const canonical = generateCanonicalJson(formData.value.iv_inputs)

    const input = [
      {
        role: 'system',
        content: IV_TREATMENT_PLAN_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: `Generate the selected IV treatment plan.

          SELECTED PLAN TYPE: ${encode(formData.value.selected_plan_type)}

          UPSTREAM INPUT PAYLOAD:
          {
            "session_intake_raw": ${encode(canonical.session_intake_raw)},
            "session_machines_raw": ${encode(canonical.session_machines_raw)},
            "skin_ai_raw": ${encode(canonical.skin_ai_raw)},
            "iv_scoring_output": ${encode(formData.value.diagnosis)}
          }

          GENERATION INSTRUCTIONS

          1. Read iv_scoring_output.scores_public_0_100.
            - Identify the dominant axis (highest score)
            - Identify the top 2-3 contributing axes

          2. Generate ONLY the selected plan:
            ${formData.value.selected_plan_type}

          3. Align treatment intent to dominant axes:
            - FENS → hydration / electrolytes
            - PCCS → circulation-friendly, slower rates
            - ASLS → calming / ANS support
            - MONS → metabolic energy support
            - ODS / DGS → antioxidant / glow support

          4. Apply all ingredient and safety constraints exactly.

          5. Ensure output schema matches the system-defined shape.

          Return the final JSON now.
          `,
      },
    ]

    const result = await runResponse(formData.value.conversation_id, input)
    console.log('✅ Treatment Plan:', result)

    if (result) {
      formData.value.iv_treatment_plan = result
      await submit(['iv_treatment_plan'])
    }
    Loading.hide()
  } catch (e) {
    console.error(e)
    Loading.hide()
    Notify.create({ type: 'negative', message: 'Failed to generate treatment plan.' })
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
  faceImages.value = formData.value.images.map((img) => img.url)
  // if (files.length > 0) {
  //   const uploadedImages = await store.storeFaceImages(files, 'pre')
  //   faceImages.value.push(...uploadedImages)
  // }

  faceImages.value = config.IMAGES_ORDER.map((name) =>
    faceImages.value.find((url) => url.toLowerCase().includes(`${name}.`)),
  ).filter(Boolean)

  const apiResponse = await callApiForDiagnosis(formData.value, files)

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
    formData.value.parameters_with_abnormal_scores = apiResponse
    submit(['parameters_with_abnormal_scores'])
    goNext()
  }
}

async function callApiForDiagnosis(data, images) {
  const convId = await getOrCreateConversation(
    `${data.user_id}`,
    data.conversation_id,
    data.name,
    data.id,
  )
  formData.value.conversation_id = convId
  submit(['conversation_id'])

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
      content: FACE_SCAN_SYSTEM_PROMPT,
    },
    {
      role: 'user',
      content: [...storedFiles],
    },
  ]
  processingMessage.value = 'Processing scanned images...'
  const result = await runResponse(convId, input)
  console.log('✅ IV FACE SCAN RESULT:', result)
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
