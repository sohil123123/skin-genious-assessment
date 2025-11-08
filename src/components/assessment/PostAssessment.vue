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
      </div>

      <q-card flat class="q-pa-md shadow-2 rounded-borders">
        <div class="row items-center justify-between q-mb-md">
          <div>
            <div class="text-h5 text-primary text-weight-bold">
              Reassessment Report — {{ post_diagnosis?.metadata.treatment_session }}
            </div>
            <div class="text-subtitle2 text-grey-8">
              Evaluation Type: {{ post_diagnosis?.metadata.evaluation_type }} | Phase:
              {{ post_diagnosis?.metadata.phase }}
            </div>
          </div>

          <div class="q-gutter-sm">
            <q-btn
              class="gredient"
              text-color="white"
              icon="download"
              label="Download Report"
              unelevated
              rounded
              @click="downloadReport"
            />
            <q-btn
              color="accent"
              outline
              label="Finalize & Exit"
              unelevated
              rounded
              @click="finalizeAndExit"
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
  </div>
</template>
<script setup>
// import post_diagnosis from 'src/info/reassessment.json'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { storeToRefs } from 'pinia'
import { useQuasar, Loading, LocalStorage } from 'quasar'
import { useAssessmentStore } from 'src/stores/assessmentStore'

const $q = useQuasar()

const store = useAssessmentStore()
const { assessmentData } = storeToRefs(store)

const emit = defineEmits(['save_data'])
const props = defineProps({
  post_diagnosis: {
    type: [String, Object],
    required: true,
    default: null,
  },
  faceImages: {
    type: [String, Array],
    required: true,
    default: () => [],
  },
  postTreatmentImages: {
    type: [String, Array],
    required: true,
    default: () => [],
  },
})

const downloadReport = () => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  })

  const metadata = props.post_diagnosis.metadata
  const reassessment = props.post_diagnosis.reassessment

  // Title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(`AI AESTHETICS`, doc.internal.pageSize.getWidth() / 2, 40, { align: 'center' })

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `${assessmentData.value.name} - Baseline vs Post-Treatment (${metadata.treatment_session}) Comparative Score Report`,
    doc.internal.pageSize.getWidth() / 2,
    60,
    { align: 'center' },
  )

  // Patient Info (if you have)
  doc.setFontSize(10)
  doc.text(
    `Patient: ${assessmentData.value.name} | Age/Gender: ${assessmentData.value.age} ${assessmentData.value.gender}`,
    200,
    90,
  )

  // Prepare table rows
  const rows = []
  Object.values(reassessment).forEach((param) => {
    const before = param.before_treatment_score_or_label
    const after = param.post_treatment_score_or_label

    let change = 'Stable'
    if (before !== after) {
      // crude example of detecting improvement
      const isImproved = typeof before === 'string' && typeof after === 'string' && after < before
      change = isImproved ? 'Improved' : 'Deteriorated'
    }

    rows.push([param.parameter_name, before || '-', after || '-', change])
  })

  // ✅ Correct jsPDF-Autotable usage
  autoTable(doc, {
    startY: 110,
    head: [['Parameter', 'Before Treatment', 'Post Treatment', 'Change / Interpretation']],
    body: rows,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 5 },
    headStyles: {
      fillColor: [38, 70, 83],
      textColor: 255,
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 150 },
      1: { halign: 'center', cellWidth: 100 },
      2: { halign: 'center', cellWidth: 100 },
      3: { halign: 'center', cellWidth: 150 },
    },
  })

  // Summary section
  const finalY = doc.lastAutoTable.finalY + 20
  doc.setFont('helvetica', 'bold')
  doc.text('Summary:', 40, finalY)
  doc.setFont('helvetica', 'normal')
  doc.text(
    'Most parameters show improvement with visible gains in hydration, pigmentation, and luminosity.',
    40,
    finalY + 15,
    { maxWidth: 500 },
  )

  // Footer
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(
    'Generated via AI Aesthetics Skin Reassessment System',
    doc.internal.pageSize.getWidth() / 2,
    doc.internal.pageSize.getHeight() - 20,
    { align: 'center' },
  )

  // Save file
  const filename = `Reassessment_Report_${metadata.treatment_session.replace(/\s+/g, '_')}.pdf`
  doc.save(filename)
}

function finalizeAndExit() {
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
      assessmentData.value.status = 'completed'
      emit('save_data', ['status'])
      Loading.show({
        message: 'Finalizing and redirecting...',
      })
      setTimeout(() => {
        LocalStorage.clear()
        window.location.href = `${process.env.CRM_URL}/users`
      }, 3000)
    })
    .onCancel(() => {
      console.log('User cancelled')
    })
    .onDismiss(() => {
      console.log('Dialog closed (OK or Cancel)')
    })
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
