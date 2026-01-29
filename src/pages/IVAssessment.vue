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
import { useIVAssessmentStore } from 'src/stores/ivAssessmentStore'
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
import { generateCanonicalJson } from 'src/services/generateCanonicalJson'

const { getOrCreateConversation, runResponse } = useOpenAI()
const $q = useQuasar()
const store = useIVAssessmentStore()
const { formData } = storeToRefs(store)

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

const rules = useIVAssessmentValidation(formData)
const v$ = useVuelidate(rules, formData)

const stepFields = {
  'step-1': ['meta', 'section_1_client_questionnaire', 'section_2_machine_objective_inputs_part_1'],
  'step-3': ['section_2_machine_objective_inputs_part_2', 'section_3_dermatological_ai_inputs'],
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
      const canonicalPayload = generateCanonicalJson(formData.value)
      console.log(canonicalPayload)
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
    formData.value.diagnosis = apiResponse
    formData.value.parameters_with_abnormal_scores = apiResponse.treatable_concerns_summary
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
