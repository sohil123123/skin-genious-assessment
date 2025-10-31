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
                v-model="assessmentData.user_id"
                class="custom-input"
              />

              <q-input
                outlined
                placeholder="Full name"
                v-model="assessmentData.name"
                class="custom-input"
              />

              <div class="flex items-center q-gutter-sm">
                <span class="text-sm">Age</span>
                <q-select
                  outlined
                  v-model="assessmentData.age"
                  :options="ageOptions"
                  dense
                  @update:model-value="saveData(['age'])"
                />

                <div class="flex q-gutter-xs q-ml-sm">
                  <q-radio
                    v-model="assessmentData.gender"
                    val="Male"
                    label="Male"
                    class="custom-radio"
                  />
                  <q-radio
                    v-model="assessmentData.gender"
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
                    v-model="assessmentData.daily_sun_exposure_hours"
                    :options="sunExposureOptions"
                    clearable
                    @update:model-value="saveData(['daily_sun_exposure_hours'])"
                  />
                </div>
              </div>

              <div class="q-mt-lg">
                <span class="text-sm text-weight-bold">Upcoming Travel (7 days)</span>
                <div class="flex items-center q-gutter-sm q-mt-sm">
                  <q-btn
                    :flat="assessmentData.upcoming_travel == 'yes'"
                    rounded
                    :class="
                      assessmentData.upcoming_travel == 'yes'
                        ? 'btn-custom'
                        : 'bg-white text-grey-7'
                    "
                    @click="updateField('upcoming_travel', 'yes')"
                    label="Yes"
                    :outline="assessmentData.upcoming_travel == 'no'"
                  />
                  <q-btn
                    :flat="assessmentData.upcoming_travel == 'no'"
                    rounded
                    :class="
                      assessmentData.upcoming_travel == 'no' ? 'btn-custom' : 'bg-white text-grey-7'
                    "
                    @click="updateField('upcoming_travel', 'no')"
                    label="No"
                    :outline="assessmentData.upcoming_travel == 'yes'"
                  />
                </div>
              </div>

              <div class="q-mt-lg">
                <span class="text-sm text-weight-bold">Social Event (7 days)</span>
                <div class="flex items-center q-gutter-sm q-mt-xs">
                  <q-btn
                    :flat="assessmentData.social_event == 'yes'"
                    rounded
                    :class="
                      assessmentData.social_event == 'yes' ? 'btn-custom' : 'bg-white text-grey-7'
                    "
                    @click="updateField('social_event', 'yes')"
                    label="Yes"
                    :outline="assessmentData.social_event == 'no'"
                  />
                  <q-btn
                    :flat="assessmentData.social_event == 'no'"
                    rounded
                    :class="
                      assessmentData.social_event == 'no' ? 'btn-custom' : 'bg-white text-grey-7'
                    "
                    @click="updateField('social_event', 'no')"
                    label="No"
                    :outline="assessmentData.social_event == 'yes'"
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
                  v-model="assessmentData.medical_history"
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
                :flat="assessmentData.allergies.includes(product)"
                rounded
                :class="
                  assessmentData.allergies.includes(product) ? 'btn-custom' : 'bg-white text-grey-7'
                "
                @click="updateAllergies(product)"
                :label="product"
                no-caps
                :outline="!assessmentData.allergies.includes(product)"
              />
            </div>
          </section>

          <section class="q-mt-md">
            <span class="text-sm text-weight-bold">Is Patient Pregnant</span>
            <div class="flex items-center q-gutter-sm q-mt-xs">
              <q-btn
                :flat="assessmentData.is_pregnant == 1"
                rounded
                :class="assessmentData.is_pregnant == 1 ? 'btn-custom' : 'bg-white text-grey-7'"
                @click="updateField('is_pregnant', 1)"
                label="Yes"
                :outline="assessmentData.is_pregnant == 0"
              />
              <q-btn
                :flat="assessmentData.is_pregnant == 0"
                rounded
                :class="assessmentData.is_pregnant == 0 ? 'btn-custom' : 'bg-white text-grey-7'"
                @click="updateField('is_pregnant', 0)"
                label="No"
                :outline="assessmentData.is_pregnant == 1"
              />
            </div>
          </section>

          <section class="q-mt-md">
            <span class="text-sm text-weight-bold">Breast Feeding?</span>
            <div class="flex items-center q-gutter-sm q-mt-xs">
              <q-btn
                :flat="assessmentData.breastfeeding == 'yes'"
                rounded
                :class="
                  assessmentData.breastfeeding == 'yes' ? 'btn-custom' : 'bg-white text-grey-7'
                "
                @click="updateField('breastfeeding', 'yes')"
                label="Yes"
                :outline="assessmentData.breastfeeding == 'no'"
              />
              <q-btn
                :flat="assessmentData.breastfeeding == 'no'"
                rounded
                :class="
                  assessmentData.breastfeeding == 'no' ? 'btn-custom' : 'bg-white text-grey-7'
                "
                @click="updateField('breastfeeding', 'no')"
                label="No"
                :outline="assessmentData.breastfeeding == 'yes'"
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
        <div class="row" style="margin-top: 1rem">
          <q-btn
            label="Previous"
            color="primary"
            icon="west"
            @click="uploadImagesStep = false"
            class="q-px-lg"
            unelevated
          />
        </div>
      </div>

      <div v-if="startProcessingStep">
        <div class="container" id="scan-animation">
          <h6 class="heading">Processing Scans...</h6>
          <div class="scanner"></div>
          <p>Please wait while we analyze your images...</p>
        </div>
        <div class="row" style="margin-top: 1rem">
          <q-btn
            label="Previous"
            color="primary"
            icon="west"
            @click="((uploadImagesStep = false), (startProcessingStep = false))"
            class="q-px-lg"
            unelevated
          />
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
import { ref, nextTick } from 'vue'
import _ from 'lodash'
import { useCommonStore } from 'src/stores/commonStore'
import { useAssessmentStore } from 'src/stores/assessmentStore'
import { storeToRefs } from 'pinia'

const store = useAssessmentStore()
const { assessmentData } = storeToRefs(store)

const commonStore = useCommonStore()
const emit = defineEmits(['process', 'save_data'])

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
  assessmentData.value[field] = value
  saveData([field])
}

function saveData(field) {
  emit('save_data', field)
}

function updateMedicalHistory(value) {
  if (value.includes('None')) {
    // If "None" is selected, keep only "None"
    assessmentData.value.medical_history = ['None']
  } else {
    // If any other option is selected, remove "None"
    assessmentData.value.medical_history = _.filter(value, (item) => item !== 'None')
  }
  saveData(['medical_history'])
}

function updateAllergies(product) {
  const index = assessmentData.value.allergies.indexOf(product)
  if (index > -1) {
    assessmentData.value.allergies.splice(index, 1)
  } else {
    if (product === 'None') {
      assessmentData.value.allergies = ['None']
    } else {
      assessmentData.value.allergies = assessmentData.value.allergies.filter(
        (item) => item !== 'None',
      )
      assessmentData.value.allergies.push(product)
    }
  }
  saveData(['allergies'])
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
    // INFO: This is used for Base64 images
    emit('process', base64Images)

    // INFO: This is use when images stored in server
    // emit('process', uploader.value.files)
  } else {
    console.warn('Uploader not ready or has no files')
  }
}
</script>
