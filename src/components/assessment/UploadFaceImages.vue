<template>
  <div v-show="!startProcessingStep">
    <div class="row justify-center">
      <div class="upload-container">
        <h2 v-if="!isPostAssessment" class="upload-title">Upload Face Scan</h2>
        <h2 v-else class="upload-title">Upload After Treatment Face Scan</h2>
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
                  v-if="isImage(file)"
                  :src="getPreviewUrl(file)"
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
                  style="border: 1px solid #ccc; width: 140px; height: 140px; border-radius: 8px"
                />

                <!-- Delete button below -->
                <q-btn
                  size="sm"
                  color="negative"
                  label="Remove"
                  outline
                  rounded
                  class="q-mt-sm"
                  @click="removeFile(file, scope)"
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
      <h6 class="heading">{{ processingMessage }}</h6>
      <div class="scanner"></div>
    </div>
  </div>

  <!-- Start Face Scan Button -->
  <div class="flex justify-center q-mt-lg q-gutter-sm">
    <q-btn
      label="Connect To Device"
      :loading="loading"
      rounded
      no-caps
      size="18px"
      class="btn-custom"
      @click="connectDevice"
    />

    <q-btn
      v-if="uploader?.files.length > 0 && !startProcessingStep"
      label="⚡ Process Scanned Results"
      rounded
      no-caps
      size="18px"
      class="btn-custom"
      @click="startProcessing"
    />
  </div>
</template>

<script setup>
import { ref, nextTick, watch, onMounted } from 'vue'
// import { useCommonStore } from 'src/stores/commonStore'
import { useAssessmentStore } from 'src/stores/assessmentStore'
import { storeToRefs } from 'pinia'
import { api } from 'src/boot/axios'
import { Notify } from 'quasar'

const store = useAssessmentStore()
const { assessmentData } = storeToRefs(store)

const loading = ref(false)

// const commonStore = useCommonStore()
const emit = defineEmits(['process', 'save_data', 'update:startProcessingStep'])

const props = defineProps({
  uploadImagesStep: {
    type: Boolean,
    default: false,
  },
  isPostAssessment: {
    type: Boolean,
    default: false,
  },
  startProcessingStep: {
    type: Boolean,
    default: false,
  },
  processingMessage: {
    type: String,
    default: 'Processing scanned images...',
  },
})

const startProcessingStep = ref(props.startProcessingStep)

// Keep it in sync with parent changes
watch(
  () => props.startProcessingStep,
  (val) => {
    startProcessingStep.value = val
  },
)

// Emit changes back to parent whenever child updates it
watch(startProcessingStep, (val) => {
  emit('update:startProcessingStep', val)
})

const uploader = ref(null)

onMounted(() => {
  if (assessmentData.value.images && !props.isPostAssessment) {
    // Convert remote images to file-like objects
    const preloadFiles = assessmentData.value.images.map((img) => ({
      __key: img.id, // unique key for v-for
      name: img.name,
      url: img.url,
      __uploaded: true, // custom flag to mark already uploaded files
      size: 0,
      type: 'image/png',
    }))

    // Access uploader instance and inject these files
    if (uploader.value) addUniqueFiles(preloadFiles)
  }

  if (assessmentData.value.post_images && props.isPostAssessment) {
    // Convert remote images to file-like objects
    const preloadFiles = assessmentData.value.post_images.map((img) => ({
      __key: img.id, // unique key for v-for
      name: img.name,
      url: img.url,
      __uploaded: true, // custom flag to mark already uploaded files
      size: 0,
      type: 'image/png',
    }))

    // Access uploader instance and inject these files
    if (uploader.value) addUniqueFiles(preloadFiles)
  }
})

watch(
  () => assessmentData.value.images,
  () => {
    if (assessmentData.value.images && !props.isPostAssessment) {
      // Convert remote images to file-like objects
      const preloadFiles = assessmentData.value.images.map((img) => ({
        __key: img.id, // unique key for v-for
        name: img.name,
        url: img.url,
        __uploaded: true, // custom flag to mark already uploaded files
        size: 0,
        type: 'image/jpeg',
      }))

      // Access uploader instance and inject these files
      if (uploader.value) addUniqueFiles(preloadFiles)
    }
  },
)

watch(
  () => assessmentData.value.post_images,
  () => {
    if (assessmentData.value.post_images && props.isPostAssessment) {
      // Convert remote images to file-like objects
      const preloadFiles = assessmentData.value.post_images.map((img) => ({
        __key: img.id, // unique key for v-for
        name: img.name,
        url: img.url,
        __uploaded: true, // custom flag to mark already uploaded files
        size: 0,
        type: 'image/jpeg',
      }))

      // Access uploader instance and inject these files
      if (uploader.value) addUniqueFiles(preloadFiles)
    }
  },
)

async function connectDevice() {
  loading.value = true
  await api
    .get('/device/connect')
    .then((response) => {
      Notify.create({
        type: response.data.success ? 'positive' : 'negative',
        message: response.data.message,
      })
      loading.value = false
    })
    .catch((e) => {
      console.log(e)
      Notify.create({
        type: 'negative',
        message: e.response.data.message,
      })
      loading.value = false
    })
}

function addUniqueFiles(newFiles) {
  const existingKeys = new Set(uploader.value.files.map((f) => f.__key))

  const uniqueFiles = newFiles.filter((f) => !existingKeys.has(f.__key))

  uploader.value.files.push(...uniqueFiles)
}

// Utility functions
const isImage = (file) => file.type?.startsWith('image/') || file.__uploaded
const getPreviewUrl = (file) => (file.__uploaded ? file.url : URL.createObjectURL(file))

// async function fileToBase64(fileWrapper) {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader()

//     // Quasar stores the real File in fileWrapper.__file
//     const actualFile = fileWrapper.__file || fileWrapper

//     if (!(actualFile instanceof Blob)) {
//       return reject(new Error('Invalid file type passed to fileToBase64()'))
//     }

//     reader.onload = () => {
//       const base64 = reader.result.split(',')[1]
//       resolve(base64)
//     }

//     reader.onerror = (error) => reject(error)
//     reader.readAsDataURL(actualFile)
//   })
// }

// async function prepareUploaderImages() {
//   if (!uploader.value || !uploader.value.files.length) return []

//   const base64List = await Promise.all(uploader.value.files.map((f) => fileToBase64(f)))

//   return base64List
// }

async function startProcessing() {
  startProcessingStep.value = true
  await nextTick()
  // const base64Images = await prepareUploaderImages(uploader)
  if (uploader.value && uploader.value.files) {
    // INFO: This is used for Base64 images
    // emit('process', base64Images)

    // ✅ Separate files based on upload status
    const newFiles = uploader.value.files.filter((file) => !file.__uploaded) // only new ones
    // const existingFiles = uploader.value.files.filter(file => file.__uploaded) // preloaded ones

    // 🔹 Option 1: Only emit new binary files (for upload)
    emit('process', newFiles)
  } else {
    console.warn('Uploader not ready or has no files')
  }
}

async function removeFile(file, scope) {
  try {
    // ✅ 1️⃣ If it’s an already uploaded image
    if (file.__uploaded && file.__key) {
      // ✅ 2️⃣ Call backend API to delete the image
      const type = props.isPostAssessment ? 'post' : 'pre'
      await api.delete(`/assessments/${assessmentData.value.id}/images/${file.__key}/${type}`)

      // ✅ 3️⃣ Remove visually from uploader
      scope.removeFile(file)

      console.log(`Deleted image ID ${file.__key} from server`)
    } else {
      // ✅ 4️⃣ If it's a newly added file (not uploaded yet)
      scope.removeFile(file)
      console.log(`Removed unsaved image: ${file.name}`)
    }
  } catch (err) {
    console.error('Error deleting image:', err)
  }
}
</script>
