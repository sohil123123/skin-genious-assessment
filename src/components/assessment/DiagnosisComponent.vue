<template>
  <div v-if="diagnosis">
    <div class="flex justify-between q-mt-lg">
      <q-btn label="Previous" rounded no-caps class="btn-custom" @click="emitPrevious" />
      <q-btn
        label="Download PDF"
        icon="picture_as_pdf"
        no-caps
        color="positive"
        @click="downloadPdf"
      />
      <q-btn label="Next" rounded no-caps class="btn-custom" @click="emitMajorConcerns" />
    </div>
    <div v-for="(param, key) in diagnosis?.diagnosis_report" :key="key" class="q-mt-md">
      <q-card flat bordered class="q-pa-md">
        <div class="row items-center justify-between">
          <h6 class="q-ma-none">{{ param.parameter_name }}</h6>
          <q-badge v-if="isScore(param.score_or_label)" rounded class="text-h6 q-pa-sm gredient">
            {{ param.score_or_label }}
          </q-badge>
          <q-chip v-else class="gredient" text-color="white">
            {{ param.score_or_label }}
          </q-chip>
        </div>

        <p class="text-caption q-mt-sm q-mb-md">{{ param.description }}</p>

        <q-card-section class="bg-grey-2 rounded-borders q-pa-md">
          {{ param.client_description }}
        </q-card-section>

        <div class="q-mt-md">
          <span class="text-subtitle2">Possible Causes:</span>
          <div class="row q-mt-sm">
            <q-chip
              v-for="(cause, index) in param.possible_causes"
              :key="index"
              text-color="deep-purple-10"
              class="q-mr-sm q-mb-sm gredient-bg"
            >
              {{ cause }}
            </q-chip>
          </div>
        </div>
        <div>
          <img :src="faceImages[param.affected_area_image - 1]" width="100px" />
        </div>
      </q-card>
    </div>
  </div>

  <div v-else class="flex justify-center q-mt-lg">
    <h6>Please Go Back And Process Scanned Images To Get Diagnosis</h6>
  </div>

  <q-page-sticky v-if="diagnosis" position="bottom-right" :offset="fabPos">
    <q-fab
      v-model="fabOpened"
      icon="keyboard_arrow_up"
      direction="up"
      color="accent"
      persistent
      :disable="draggingFab || audioStatus === 'loading'"
      v-touch-pan.prevent.mouse="moveFab"
    >
      <q-fab-action
        @click="downloadPdf"
        external-label
        label-position="left"
        color="black"
        icon="download"
        :disable="draggingFab"
      >
        <template v-slot:label> Download PDF </template>
      </q-fab-action>
      <q-fab-action
        @click="() => playAudio(diagnosis.script)"
        external-label
        label-position="left"
        :color="audioStatus === 'playing' ? 'negative' : 'positive'"
        :icon="audioStatus === 'playing' ? 'pause' : 'play_arrow'"
        :loading="audioStatus === 'loading'"
      >
        <template v-slot:label>
          {{ audioStatus === 'playing' ? 'Pause Audio' : 'Play Audio' }}
        </template>
      </q-fab-action>
    </q-fab>
  </q-page-sticky>
</template>

<script setup>
import { api } from 'src/boot/axios'
import { storeToRefs } from 'pinia'
import { Loading, Notify } from 'quasar'
import { useAssessmentStore } from 'src/stores/assessmentStore'
import { onMounted, ref, watch } from 'vue'
import config from 'src/config.js'
import { useElevenLabsAudio } from 'src/composables/useElevenLabsAudio'

const store = useAssessmentStore()
const { assessmentData } = storeToRefs(store)

const diagnosis = ref(null)
const faceImages = ref(null)
const fabPos = ref([18, 18])
const draggingFab = ref(false)

const { audioStatus, handleAudioAction } = useElevenLabsAudio()
const fabOpened = ref(false)

const emit = defineEmits(['show-major-concerns', 'previous'])

const emitMajorConcerns = () => {
  emit('show-major-concerns')
}

const emitPrevious = () => {
  emit('previous')
}

watch(
  () => assessmentData.value,
  (val) => {
    if (val) {
      diagnosis.value = val.diagnosis

      const desiredImages = config.IMAGES_ORDER.map((name) =>
        val.images?.find((img) => img.url.toLowerCase().includes(`${name}.`)),
      ).filter(Boolean)

      faceImages.value = desiredImages.map((img) => img.url)
    }
  },
  { immediate: true, deep: true },
)

watch(audioStatus, (newVal) => {
  if (newVal === 'playing' || newVal === 'paused') {
    fabOpened.value = true
  }
})

onMounted(async () => {
  if (!diagnosis.value) {
    diagnosis.value = assessmentData.value.diagnosis

    const desiredImages = config.IMAGES_ORDER.map((name) =>
      assessmentData.value.images?.find((img) => img.url.toLowerCase().includes(`${name}.`)),
    ).filter(Boolean)

    faceImages.value = desiredImages.map((img) => img.url)
  }
})

function playAudio(text) {
  fabOpened.value = true
  handleAudioAction(text)
}

// Helper to check if label looks like a score (starts with number or 'Score/Grade')
function isScore(label) {
  return /^\d|Score|Grade/.test(label)
}

const downloadPdf = async () => {
  Loading.show({ message: 'Generating PDF report...' })
  try {
    const response = await api.get(
      `download-facial-report/skin-analysis/${assessmentData.value.id}`,
      {
        responseType: 'blob',
      },
    )

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${assessmentData.value.name}_AIA_Diagnosis_Report.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('PDF generation failed:', error)

    Notify.create({
      type: 'negative',
      message:
        error?.response?.data?.message ||
        error?.message ||
        'Failed to generate PDF. Please try again.',
    })
  } finally {
    // 🔥 ALWAYS hide loader
    Loading.hide()
  }
}

function moveFab(ev) {
  draggingFab.value = ev.isFirst !== true && ev.isFinal !== true

  fabPos.value = [fabPos.value[0] - ev.delta.x, fabPos.value[1] - ev.delta.y]
}

/* =========================
   Controls
========================= */
</script>

<style scoped>
.rounded-borders {
  border-radius: 20px;
}
</style>
