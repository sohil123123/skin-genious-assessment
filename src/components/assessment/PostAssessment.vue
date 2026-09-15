<template>
  <q-card v-if="assessmentData?.name" flat bordered class="q-mb-md">
    <q-card-section class="bg-grey-1 q-py-sm q-px-md flex items-center justify-between">
      <div class="flex items-center gap-2">
        <q-icon name="person" size="24px" color="primary" />
        <span class="text-subtitle1 text-weight-medium text-dark">
          Client: <strong class="text-black">{{ assessmentData.name }}</strong>
        </span>
      </div>
      <div v-if="assessmentData?.age || assessmentData?.gender" class="text-caption text-grey-7">
        {{ assessmentData?.gender ? assessmentData.gender + ', ' : '' }}{{ assessmentData?.age ? assessmentData.age + ' years' : '' }}
      </div>
    </q-card-section>
  </q-card>

  <div v-if="post_diagnosis">
    <q-card flat class="q-pa-md shadow-2 rounded-borders">
      <div class="row items-center justify-between q-mb-md">
        <div>
          <div class="text-h5 text-primary text-weight-bold">Reassessment Report</div>
          <!-- <div class="text-subtitle2 text-grey-8">
            Evaluation Type: {{ post_diagnosis?.metadata?.evaluation_type }} | Phase:
            {{ post_diagnosis?.metadata?.phase }}
          </div> -->
        </div>

        <div class="q-gutter-sm">
          <q-btn-dropdown
            v-if="showComparisonDropdown"
            class="gredient"
            text-color="white"
            label="Download Report"
            unelevated
            rounded
            no-caps
          >
            <q-list>
              <q-item clickable v-close-popup @click="downloadReport('previous')">
                <q-item-section>
                  <q-item-label>Compare to Previous Session</q-item-label>
                </q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="downloadReport('baseline')">
                <q-item-section>
                  <q-item-label>Compare to Baseline</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
          <q-btn
            v-else
            class="gredient"
            text-color="white"
            label="Download Report"
            unelevated
            rounded
            no-caps
            @click="downloadReport('previous')"
          >
          </q-btn>
          <!-- <q-btn
            class="gredient"
            text-color="white"
            icon="download"
            label="Download Report"
            unelevated
            rounded
            @click="downloadReport"
          />
          <q-btn
            class="gredient"
            text-color="white"
            icon="download"
            label="Download Comparsion Report"
            unelevated
            rounded
            @click="downloadVisualReport"
          /> -->
          <q-btn
            color="accent"
            outline
            label="Finalize & Exit"
            unelevated
            rounded
            @click="$emit('finalize_and_exit')"
          />
        </div>
      </div>

      <div class="row q-col-gutter-md">
        <div
          v-for="(param, key) in post_diagnosis?.reassessment"
          :key="key"
          class="col-12 col-md-6"
        >
          <q-card bordered flat class="q-pa-sm bg-grey-1 hover-shadow">
            <div class="q-pa-sm">
              <div class="text-subtitle1 text-weight-medium text-primary">
                {{ param.parameter_name }}
              </div>

              <div v-if="clientAfter(param) === 'Follow-up'" class="text-caption q-mt-sm">A lower scan reading needs follow-up; this is not an unchanged measurement. Your clinic retains the reading for review.</div>
              <q-separator spaced />

              <div class="row items-center q-col-gutter-md">
                <!-- Before Column -->
                <div class="col-6">
                  <div class="text-caption text-grey">Before Treatment</div>
                  <q-badge color="negative" outline class="q-mt-sm q-mb-sm">
                    {{ param.before_treatment_score_or_label }}
                  </q-badge>
                  <q-img
                    :src="faceImages[param.before_image - 1]"
                    class="rounded-borders shadow-sm"
                    spinner-color="primary"
                  >
                    <!-- <div
                        class="absolute-bottom bg-black bg-opacity-2 text-white text-caption q-pa-xs text-center"
                      >
                        Before
                      </div> -->
                  </q-img>
                </div>

                <!-- After Column -->
                <div class="col-6">
                  <div class="text-caption text-grey">Post Treatment</div>
                  <q-badge color="positive" outline class="q-mt-sm q-mb-sm">
                    {{ clientAfter(param) }}
                  </q-badge>

                  <q-img
                    :src="postTreatmentImages[param.post_treatment_image - 1]"
                    class="rounded-borders shadow-sm"
                    spinner-color="secondary"
                  >
                    <!-- <div
                        class="absolute-bottom bg-black bg-opacity-40 text-white text-caption q-pa-xs text-center"
                      >
                        After
                      </div> -->
                  </q-img>
                </div>
              </div>
            </div>
          </q-card>
        </div>
      </div>
    </q-card>
  </div>
  <div v-else class="flex justify-center q-mt-lg">
    <h6>Please Go Back And Process After Treatment Scanned Images To Get Reassessment Details.</h6>
  </div>
</template>
<script setup>
// import post_diagnosis from 'src/info/reassessment.json'
import { api } from 'src/boot/axios'
import { storeToRefs } from 'pinia'
import { Loading, Notify } from 'quasar'
import { useAssessmentStore } from 'src/stores/assessmentStore'
import { ref, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import config from 'src/config.js'

const clientAfter = (param) => param.score_polarity === 'higher_is_better' && Number.isFinite(param.before_treatment_score_or_label) && Number.isFinite(param.post_treatment_score_or_label) && param.post_treatment_score_or_label < param.before_treatment_score_or_label ? 'Follow-up' : param.post_treatment_score_or_label
const store = useAssessmentStore()
const { assessmentData } = storeToRefs(store)

defineEmits(['save_data', 'finalize_and_exit'])

const route = useRoute()
const sessionId = computed(() => route.query.session_id ? Number(route.query.session_id) : null)
const currentSession = computed(() => {
  if (!sessionId.value || !assessmentData.value?.treatment_sessions?.treatments) return null
  return assessmentData.value.treatment_sessions.treatments.find(t => t.id === sessionId.value)
})

const showComparisonDropdown = computed(() => {
  return sessionId.value && currentSession.value && currentSession.value.session_number > 1
})

const post_diagnosis = ref(null)
const faceImages = ref(null)
const postTreatmentImages = ref(null)

watch(
  () => assessmentData.value,
  (val) => {
    if (val) {
      const machineMode = val.face_scan_machine?.charAt(0) || '6'
      const imagesOrder = config.IMAGES_ORDER[machineMode] || config.IMAGES_ORDER['6']

      let beforeImagesSource = val.images || []
      let postImagesSource = val.post_images || []

      if (sessionId.value && currentSession.value) {
        post_diagnosis.value = currentSession.value.post_diagnosis
        postImagesSource = currentSession.value.post_images || []

        const currentNum = currentSession.value.session_number
        if (currentNum === 1) {
          beforeImagesSource = val.images || []
        } else {
          const prevSess = val.treatment_sessions?.treatments?.find(
            t => t.session_number === currentNum - 1
          )
          beforeImagesSource = prevSess ? (prevSess.post_images || []) : (val.images || [])
        }
      } else {
        post_diagnosis.value = val.post_diagnosis
      }

      const desiredImages = imagesOrder.map((name) =>
        beforeImagesSource.find((img) => img.url.toLowerCase().includes(`${name}.`)),
      ).filter(Boolean)

      faceImages.value = desiredImages.map((img) => img.url)

      const desiredPostImages = imagesOrder.map((name) =>
        postImagesSource.find((img) => img.url.toLowerCase().includes(`${name}.`)),
      ).filter(Boolean)

      postTreatmentImages.value = desiredPostImages.map((img) => img.url)
    }
  },
  { immediate: true },
)

const downloadReport = async (compareTo = 'previous') => {
  Loading.show({ message: 'Generating PDF report...' })
  try {
    let urlParams = sessionId.value ? `?session_id=${sessionId.value}` : ''
    if (sessionId.value) {
      urlParams += `&compare_to=${compareTo}`
    }
    const response = await api.get(
      `download-facial-report/reassessment/${assessmentData.value.id}${urlParams}`,
      {
        responseType: 'blob',
      },
    )

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    const suffix = compareTo === 'baseline' ? 'baseline_comparison' : 'previous_session_comparison'
    link.setAttribute('download', `${assessmentData.value.name}_facial_reassessment_${suffix}.pdf`)
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
</script>

<style scoped>
.hover-shadow:hover {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s ease;
}
.rounded-borders {
  border-radius: 16px;
}
</style>
