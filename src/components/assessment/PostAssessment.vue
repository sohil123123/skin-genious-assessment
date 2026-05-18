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
          <q-btn
            class="gredient"
            text-color="white"
            label="Download Report"
            unelevated
            rounded
            no-caps
            @click="downloadReport"
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
import { ref, watch } from 'vue'
import config from 'src/config.js'

const store = useAssessmentStore()
const { assessmentData } = storeToRefs(store)

defineEmits(['save_data', 'finalize_and_exit'])

const post_diagnosis = ref(null)
const faceImages = ref(null)
const postTreatmentImages = ref(null)

watch(
  () => assessmentData.value,
  (val) => {
    if (val) {
      post_diagnosis.value = val.post_diagnosis

      const machineMode = val.face_scan_machine?.charAt(0) || '6'
      const imagesOrder = config.IMAGES_ORDER[machineMode] || config.IMAGES_ORDER['6']

      const desiredImages = imagesOrder.map((name) =>
        val.images?.find((img) => img.url.toLowerCase().includes(`${name}.`)),
      ).filter(Boolean)

      faceImages.value = desiredImages.map((img) => img.url)

      const desiredPostImages = imagesOrder.map((name) =>
        val.post_images?.find((img) => img.url.toLowerCase().includes(`${name}.`)),
      ).filter(Boolean)

      postTreatmentImages.value = desiredPostImages.map((img) => img.url)
    }
  },
  { immediate: true },
)

const downloadReport = async () => {
  Loading.show({ message: 'Generating PDF report...' })
  try {
    const response = await api.get(
      `download-facial-report/reassessment/${assessmentData.value.id}`,
      {
        responseType: 'blob',
      },
    )

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${assessmentData.value.name}_facial_reassessment_report.pdf`)
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
