<template>
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
        <!-- <h1 class="text-4xl font-serif">Patient Intake</h1> -->
        <!-- <div class="flex gap-2">
          <div class="w-2 h-2 rounded-full bg-black"></div>
          <div class="w-2 h-2 rounded-full bg-grey-4"></div>
          <div class="w-2 h-2 rounded-full bg-grey-4"></div>
        </div> -->
      </div>

      <div v-if="!startFaceScan && !uploadImagesStep" class="row q-col-gutter-lg">
        <!-- Left Column -->
        <div class="col-md-6 col-sm-6 col-xs-12">
          <!-- Patient Basics -->
          <section>
            <h2 class="text-sm font-semibold tracking-wider mb-4">PATIENT BASICS</h2>
            <div class="space-y-4">
              <q-input
                outlined
                placeholder="Patient ID"
                v-model="patientData.id"
                class="custom-input"
              />

              <q-input
                outlined
                placeholder="Full name"
                v-model="patientData.fullName"
                class="custom-input"
              />

              <div class="flex items-center q-gutter-sm">
                <span class="text-sm">Age</span>
                <q-select outlined v-model="patientData.age" :options="ageOptions" dense />

                <div class="flex q-gutter-xs q-ml-sm">
                  <q-radio
                    v-model="patientData.gender"
                    val="Male"
                    label="Male"
                    class="custom-radio"
                  />
                  <q-radio
                    v-model="patientData.gender"
                    val="Female"
                    label="Female"
                    class="custom-radio"
                  />
                </div>
              </div>
            </div>
          </section>

          <!-- Sun Exposure & Plans -->
          <section class="q-mt-lg">
            <h2 class="text-sm font-semibold tracking-wider q-pb-sm">SUN EXPOSURE & PLANS</h2>
            <div class="q-gutter-md">
              <div class="flex items-center justify-between">
                <div class="col">
                  <q-select
                    label="Daily sun exposure"
                    outlined
                    v-model="patientData.sunExposure"
                    :options="sunExposureOptions"
                    clearable
                  />
                </div>
              </div>

              <div class="q-mt-lg">
                <span class="text-sm text-weight-bold">Upcoming Travel (7 days)</span>
                <div class="flex items-center q-gutter-sm q-mt-sm">
                  <q-btn
                    :flat="patientData.upcomingTravel"
                    rounded
                    :class="patientData.upcomingTravel ? 'btn-custom' : 'bg-white text-grey-7'"
                    @click="updateField('upcomingTravel', true)"
                    label="Yes"
                    :outline="!patientData.upcomingTravel"
                  />
                  <q-btn
                    :flat="!patientData.upcomingTravel"
                    rounded
                    :class="!patientData.upcomingTravel ? 'btn-custom' : 'bg-white text-grey-7'"
                    @click="updateField('upcomingTravel', false)"
                    label="No"
                    :outline="patientData.upcomingTravel"
                  />
                </div>
              </div>

              <div class="q-mt-lg">
                <span class="text-sm text-weight-bold">Social Event (7 days)</span>
                <div class="flex items-center q-gutter-sm q-mt-xs">
                  <q-btn
                    :flat="patientData.socialEvent"
                    rounded
                    :class="patientData.socialEvent ? 'btn-custom' : 'bg-white text-grey-7'"
                    @click="updateField('socialEvent', true)"
                    label="Yes"
                    :outline="!patientData.socialEvent"
                  />
                  <q-btn
                    :flat="!patientData.socialEvent"
                    rounded
                    :class="!patientData.socialEvent ? 'btn-custom' : 'bg-white text-grey-7'"
                    @click="updateField('socialEvent', false)"
                    label="No"
                    :outline="patientData.socialEvent"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- Right Column -->
        <div class="col-md-6 col-sm-6 col-xs-12">
          <!-- Medical History -->
          <section>
            <h2 class="text-sm font-semibold tracking-wider mb-4">MEDICAL HISTORY</h2>
            <div class="grid grid-cols-2 gap-3">
              <template v-for="value in medicalHistoryOptions" :key="value">
                <q-checkbox
                  v-model="patientData.medicalHistory"
                  :label="value"
                  :val="value"
                  class="custom-checkbox"
                  @update:model-value="updateMedicalHistory"
                />
              </template>
            </div>
          </section>

          <!-- Current Skincare & Allergies -->
          <section>
            <h2 class="text-sm font-semibold tracking-wider mb-4">CURRENT SKINCARE & ALLERGIES</h2>
            <div class="q-gutter-sm">
              <q-btn
                v-for="product in productsAndAllergies"
                :key="product"
                :flat="patientData.allergies.includes(product)"
                rounded
                :class="
                  patientData.allergies.includes(product) ? 'btn-custom' : 'bg-white text-grey-7'
                "
                @click="updateAllergies(product)"
                :label="product"
                no-caps
                :outline="!patientData.allergies.includes(product)"
              />
            </div>
          </section>

          <section class="q-mt-md">
            <span class="text-sm text-weight-bold">Is Patient Pregnant</span>
            <div class="flex items-center q-gutter-sm q-mt-xs">
              <q-btn
                :flat="patientData.is_patient_pregnant"
                rounded
                :class="patientData.is_patient_pregnant ? 'btn-custom' : 'bg-white text-grey-7'"
                @click="updateField('is_patient_pregnant', true)"
                label="Yes"
                :outline="!patientData.is_patient_pregnant"
              />
              <q-btn
                :flat="!patientData.is_patient_pregnant"
                rounded
                :class="!patientData.is_patient_pregnant ? 'btn-custom' : 'bg-white text-grey-7'"
                @click="updateField('is_patient_pregnant', false)"
                label="No"
                :outline="patientData.is_patient_pregnant"
              />
            </div>
          </section>

          <section class="q-mt-md">
            <span class="text-sm text-weight-bold">Breast Feeding?</span>
            <div class="flex items-center q-gutter-sm q-mt-xs">
              <q-btn
                :flat="patientData.breastfeeding"
                rounded
                :class="patientData.breastfeeding ? 'btn-custom' : 'bg-white text-grey-7'"
                @click="updateField('breastfeeding', true)"
                label="Yes"
                :outline="!patientData.breastfeeding"
              />
              <q-btn
                :flat="!patientData.breastfeeding"
                rounded
                :class="!patientData.breastfeeding ? 'btn-custom' : 'bg-white text-grey-7'"
                @click="updateField('breastfeeding', false)"
                label="No"
                :outline="patientData.breastfeeding"
              />
            </div>
          </section>
        </div>
      </div>

      <div v-if="startFaceScan && !startProcessingStep">
        <div class="row justify-center">
          <div class="container" id="processing-screen">
            <h6 class="heading">Initializing Scans...</h6>
            <div
              class="wheels"
              style="display: flex; justify-content: center; gap: 20px; margin: 40px 0"
            >
              <div class="wheel"></div>
              <div class="wheel"></div>
              <div class="wheel"></div>
            </div>
            <p>Please hold while we prepare your face scan upload.</p>
          </div>
        </div>
      </div>

      <div v-show="uploadImagesStep && !startProcessingStep && !showResultsStep">
        <div class="row justify-center">
          <div class="upload-container">
            <h2 class="upload-title">Upload Face Scan</h2>
            <q-uploader
              ref="uploader"
              url=""
              label="Drag & drop face images here"
              multiple
              accept="image/*"
              flat
              bordered
              no-thumbnails
              class="custom-uploader full-width"
              style="width: 100%; height: 100vh"
            >
              <template v-slot:header></template>

              <template v-slot:list="scope">
                <div
                  v-if="scope.files && scope.files.length > 0"
                  class="q-pa-md row q-col-gutter-md justify-start items-start"
                  style="flex-wrap: wrap"
                >
                  <!-- Image card -->
                  <div
                    v-for="file in scope.files"
                    :key="file.__key"
                    class="column items-center q-pa-sm"
                    style="width: 150px"
                  >
                    <!-- Image thumbnail -->
                    <img
                      v-if="commonStore.isImage(file)"
                      :src="commonStore.getPreviewUrl(file)"
                      :alt="file.name"
                      style="
                        width: 140px;
                        height: 140px;
                        object-fit: cover;
                        border-radius: 8px;
                        border: 1px solid #ccc;
                      "
                    />
                    <q-icon
                      v-else
                      name="image"
                      color="grey"
                      size="100px"
                      style="
                        border: 1px solid #ccc;
                        width: 140px;
                        height: 140px;
                        border-radius: 8px;
                      "
                    />

                    <!-- Delete button below -->
                    <q-btn
                      size="sm"
                      color="negative"
                      label="Remove"
                      outline
                      rounded
                      class="q-mt-sm"
                      @click="scope.removeFile(file)"
                    />
                  </div>
                </div>

                <!-- Empty state -->
                <div class="q-pa-md column items-center justify-center full-width full-height">
                  <div class="text-subtitle1 q-mb-sm text-black text-center">
                    Drag & drop face images here
                  </div>
                  <div class="text-subtitle1 q-mb-md text-black">or</div>
                  <q-btn
                    v-if="scope.canAddFiles"
                    label="Choose Files"
                    type="a"
                    no-caps
                    @click="scope.pickFiles"
                    class="btn-custom"
                  >
                    <q-uploader-add-trigger />
                  </q-btn>
                </div>
              </template>
            </q-uploader>
          </div>
        </div>
      </div>

      <div v-if="startProcessingStep">
        <div class="container" id="scan-animation">
          <h6 class="heading">Processing Scans...</h6>
          <div class="scanner"></div>
          <p>Please wait while we analyze your images...</p>
        </div>
      </div>

      <div v-if="showResultsStep">
        <div class="row justify-center">
          <div class="container text-center" id="processing-screen">
            <div class="row items-stretch q-gutter-sm justify-center q-mb-sm">
              <q-icon name="check_circle" color="green" size="md" />
              <h6 class="q-ma-sm">Results Ready!</h6>
            </div>
            <p class="text-subtitle1">Your scans have been processed successfully.</p>
          </div>
        </div>
      </div>

      <!-- Start Face Scan Button -->
      <div class="flex justify-center q-mt-lg">
        <q-btn
          v-if="!startFaceScan && !uploadImagesStep"
          label="🚀 Start Face Scan"
          rounded
          no-caps
          size="18px"
          class="btn-custom"
          @click="uploadImages"
        />
        <q-btn
          v-if="uploader?.files.length > 0 && uploadImagesStep && !startProcessingStep"
          label="⚡ Process Scanned Results"
          rounded
          no-caps
          size="18px"
          class="btn-custom"
          @click="startProcessing"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, nextTick } from 'vue'
import _ from 'lodash'
import { useCommonStore } from 'src/stores/commonStore'

const commonStore = useCommonStore()
const emit = defineEmits(['process', 'update-patient'])

// Form data
const props = defineProps({
  patientData: {
    type: Object,
    required: true,
  },
})

const patientData = reactive(_.cloneDeep(props.patientData))

const uploader = ref(null)
const startFaceScan = ref(false)
const uploadImagesStep = ref(false)
const startProcessingStep = ref(false)
const showResultsStep = ref(false)

// Options for selects
const ageOptions = Array.from({ length: 83 }, (_, i) => i + 18)
const sunExposureOptions = ['Less than 1 hour', '1-2 hours', 'More than 2 hours']
const medicalHistoryOptions = [
  'Blood thinners',
  'Diabetes',
  'Thyroid',
  'PCOD',
  'Hypertension',
  'On medications',
  'None',
]

const productsAndAllergies = ['Salicylic Acid', 'Glycolic Acid', 'Aloe Vera', 'Vitamin C', 'None']

// Update field function
const updateField = (field, value) => {
  patientData[field] = value
}

function updateMedicalHistory(value) {
  if (value.includes('None')) {
    // If "None" is selected, keep only "None"
    patientData.medicalHistory = ['None']
  } else {
    // If any other option is selected, remove "None"
    patientData.medicalHistory = _.filter(value, (item) => item !== 'None')
  }
}

function updateAllergies(product) {
  const index = patientData.allergies.indexOf(product)
  if (index > -1) {
    patientData.allergies.splice(index, 1)
  } else {
    if (product === 'None') {
      patientData.allergies = ['None']
    } else {
      patientData.allergies = patientData.allergies.filter((item) => item !== 'None')
      patientData.allergies.push(product)
    }
  }
}

function uploadImages() {
  startFaceScan.value = true
  setTimeout(() => {
    startFaceScan.value = false
    uploadImagesStep.value = true
  }, 100)
}

async function fileToBase64(fileWrapper) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    // Quasar stores the real File in fileWrapper.__file
    const actualFile = fileWrapper.__file || fileWrapper

    if (!(actualFile instanceof Blob)) {
      return reject(new Error('Invalid file type passed to fileToBase64()'))
    }

    reader.onload = () => {
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }

    reader.onerror = (error) => reject(error)
    reader.readAsDataURL(actualFile)
  })
}

async function prepareUploaderImages() {
  if (!uploader.value || !uploader.value.files.length) return []

  const base64List = await Promise.all(uploader.value.files.map((f) => fileToBase64(f)))

  return base64List
}

async function startProcessing() {
  startProcessingStep.value = true
  await nextTick()
  const base64Images = await prepareUploaderImages(uploader)
  if (uploader.value && uploader.value.files) {
    emit('update-patient', patientData)
    emit('process', base64Images)
  } else {
    console.warn('Uploader not ready or has no files')
  }
}
</script>
