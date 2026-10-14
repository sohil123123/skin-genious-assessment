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

  <q-banner v-if="courseContinuation && !['idle', 'not_applicable', 'awaiting_reassessment'].includes(courseContinuation.status)" rounded class="bg-blue-1 q-mb-md">
    <template v-if="['generating', 'claimed'].includes(courseContinuation.status)">
      <q-spinner class="q-mr-sm" /> Reassessment saved. Preparing the next course sessions…
    </template>
    <template v-else-if="courseContinuation.status === 'ready'">
      The next course sessions are ready.
      <q-btn flat color="primary" label="View updated course" @click="$emit('view-course')" />
    </template>
    <template v-else-if="courseContinuation.status === 'complete'">All planned course sessions have been generated.</template>
    <template v-else>
      Reassessment saved. {{ courseContinuation.message || 'The next sessions are waiting to be generated.' }}
      <q-btn v-if="courseContinuation.status !== 'blocked'" flat color="primary" label="Retry next sessions" @click="$emit('retry-course-continuation')" />
    </template>
  </q-banner>

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

              <q-separator spaced />

              <div v-if="isSebumReportingRow(param, key)" class="q-mb-sm">
                <q-badge :color="param.result === 'improved' ? 'positive' : 'info'">
                  {{ sebumResultLabel(param) }}
                </q-badge>
                <div class="text-caption q-mt-xs">{{ param.score_explanation }}</div>
              </div>

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
                    {{ param.post_treatment_score_or_label }}
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
import { formatFacialClientScores } from 'src/utils/facial/clientScoreDisplay.js'
import { isSebumReportingRow } from 'src/utils/facial/sebumBalanceReporting.js'

const store = useAssessmentStore()
const { assessmentData } = storeToRefs(store)

defineProps({ courseContinuation: { type: Object, default: null } })
defineEmits(['save_data', 'finalize_and_exit', 'retry-course-continuation', 'view-course'])

const route = useRoute()
const sessionId = computed(() => route.query.session_id ? Number(route.query.session_id) : null)
const currentSession = computed(() => {
  if (!sessionId.value || !assessmentData.value?.treatment_sessions?.treatments) return null
  return assessmentData.value.treatment_sessions.treatments.find(t => Number(t.id) === sessionId.value)
})

const showComparisonDropdown = computed(() => {
  return sessionId.value && currentSession.value && currentSession.value.session_number > 1
})

const post_diagnosis = ref(null)
const faceImages = ref([])
const postTreatmentImages = ref([])
const sebumResultLabel = row => row.result === 'improved' ? 'Improved'
  : row.report_comparison_status === 'balanced' ? 'Stable — balanced'
  : row.report_comparison_status === 'review_required' ? 'Stable — balance needs review' : 'Stable'

function orderedReportImages(records, imagesOrder) {
  const byMode = new Map()
  for (const image of records || []) {
    if (typeof image?.url !== 'string') continue
    try {
      const pathname = new URL(image.url, 'https://scan.invalid').pathname
      const filename = decodeURIComponent(pathname.slice(pathname.lastIndexOf('/') + 1))
      byMode.set(filename.replace(/\.[^.]+$/, '').toLowerCase(), image.url)
    } catch { /* A missing or invalid image leaves its numbered slot empty. */ }
  }
  return imagesOrder.map(mode => byMode.get(mode) || '')
}

watch(
  [() => assessmentData.value, sessionId],
  ([val]) => {
    if (val) {
      const machineMode = val.face_scan_machine?.charAt(0) || '6'
      const imagesOrder = config.IMAGES_ORDER[machineMode] || config.IMAGES_ORDER['6']

      let beforeImagesSource = val.images || []
      let postImagesSource = val.post_images || []
      let reportingBaseline = val.diagnosis
      let report = val.post_diagnosis

      if (sessionId.value && currentSession.value) {
        report = currentSession.value.post_diagnosis
        postImagesSource = currentSession.value.post_images || []

        const currentNum = Number(currentSession.value.session_number)
        if (currentNum === 1) {
          beforeImagesSource = val.images || []
        } else {
          const prevSess = val.treatment_sessions?.treatments?.find(
            t => Number(t.session_number) === currentNum - 1
          )
          beforeImagesSource = prevSess?.post_diagnosis && prevSess.post_images?.length
            ? prevSess.post_images : (val.images || [])
          reportingBaseline = prevSess?.post_diagnosis ?? val.diagnosis
        }
      }
      post_diagnosis.value = formatFacialClientScores(report, {
        sebumBaseline: reportingBaseline, sebumOriginalBaseline: val.diagnosis,
      })

      faceImages.value = orderedReportImages(beforeImagesSource, imagesOrder)
      postTreatmentImages.value = orderedReportImages(postImagesSource, imagesOrder)
    }
  },
  { immediate: true, deep: true },
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
