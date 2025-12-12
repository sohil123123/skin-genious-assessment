<template>
  <div v-if="post_diagnosis">
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
            label="Download Report"
            unelevated
            rounded
            no-caps
          >
            <q-menu transition-show="jump-down" transition-hide="jump-up">
              <q-list style="min-width: 100px">
                <q-item clickable @click="downloadReport">
                  <q-item-section>Core Report</q-item-section>
                </q-item>
                <q-item clickable @click="downloadVisualReport">
                  <q-item-section>Visual Comparison Report</q-item-section>
                </q-item>
                <q-separator />
              </q-list>
            </q-menu>
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
  <div v-else class="flex justify-center q-mt-lg">
    <h6>Please Go Back And Process After Treatment Scanned Images To Get Reassessment Details.</h6>
  </div>
</template>
<script setup>
// import post_diagnosis from 'src/info/reassessment.json'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { storeToRefs } from 'pinia'
import { useQuasar, Loading, LocalStorage } from 'quasar'
import { useAssessmentStore } from 'src/stores/assessmentStore'
import { ref, watch } from 'vue'
import config from 'src/config.js'

const $q = useQuasar()

const store = useAssessmentStore()
const { assessmentData } = storeToRefs(store)

const emit = defineEmits(['save_data'])

const post_diagnosis = ref(null)
const faceImages = ref(null)
const postTreatmentImages = ref(null)

watch(
  () => assessmentData.value,
  (val) => {
    if (val) {
      post_diagnosis.value = val.post_diagnosis

      const desiredImages = config.IMAGES_ORDER.map((name) =>
        val.images?.find((img) => img.url.toLowerCase().includes(`${name}.`)),
      ).filter(Boolean)

      faceImages.value = desiredImages.map((img) => img.url)

      const desiredPostImages = config.IMAGES_ORDER.map((name) =>
        val.post_images?.find((img) => img.url.toLowerCase().includes(`${name}.`)),
      ).filter(Boolean)

      postTreatmentImages.value = desiredPostImages.map((img) => img.url)
    }
  },
  { immediate: true },
)

const downloadReport = () => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  })

  const metadata = post_diagnosis.value.metadata
  const reassessment = post_diagnosis.value.reassessment

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
  // const finalY = doc.lastAutoTable.finalY + 20
  // doc.setFont('helvetica', 'bold')
  // doc.text('Summary:', 40, finalY)
  // doc.setFont('helvetica', 'normal')
  // doc.text(
  //   'Most parameters show improvement with visible gains in hydration, pigmentation, and luminosity.',
  //   40,
  //   finalY + 15,
  //   { maxWidth: 500 },
  // )

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
  const filename = `${assessmentData.value.name} Reassessment_Report_${metadata.treatment_session.replace(/\s+/g, '_')}.pdf`
  doc.save(filename)
}

const downloadVisualReport = async () => {
  Loading.show({ message: 'Generating PDF report...' })
  await new Promise((r) => setTimeout(r, 1000))

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  const marginX = 48
  const topPadding = 32
  // const bottomPadding = 40
  const contentWidth = pageWidth - marginX * 2

  const primaryRgb = [25, 118, 210]

  const comparisonTitles = [
    'White Light',
    'Positive',
    'Negative',
    'Blue Light',
    'UV Light',
    'Woods Light',
  ]

  // const sectionGap = 18
  const cardPadding = 10
  const cardWidth = (contentWidth - 24) / 2
  const cardHeight = 300

  // ----------------------------
  // COVER PAGE (Style D)
  // ----------------------------
  ;(() => {
    // Title
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(28)
    doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2])
    doc.text('AI AESTHETICS', pageWidth / 2, pageHeight * 0.23, { align: 'center' })

    doc.setFontSize(20)
    doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2])
    doc.text('BEFORE vs AFTER', pageWidth / 2, pageHeight * 0.28, { align: 'center' })

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text('VISUAL COMPARISON REPORT', pageWidth / 2, pageHeight * 0.32, { align: 'center' })

    // Patient Info
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.setTextColor(50)

    const patientName = assessmentData.value.name || ''
    const patientAge = assessmentData.value.age || ''
    const patientGender = assessmentData.value.gender || ''

    doc.text(`Patient: ${patientName}`, pageWidth / 2, pageHeight * 0.42, { align: 'center' })

    doc.text(`Age / Gender: ${patientAge} ${patientGender}`, pageWidth / 2, pageHeight * 0.46, {
      align: 'center',
    })

    doc.text(
      `Treatment Session: ${post_diagnosis.value.metadata.treatment_session}`,
      pageWidth / 2,
      pageHeight * 0.5,
      { align: 'center' },
    )
  })()

  // Add page for content
  doc.addPage()

  // ----------------------------
  // MAIN PAGES — 1 COMPARISON PER PAGE
  // ----------------------------
  for (let idx = 0; idx < 6; idx++) {
    // Start new page for every comparison (except first content page)
    if (idx !== 0) {
      doc.addPage()
    }

    let cursorY = topPadding

    // Section title
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(22, 63, 120)
    doc.text(comparisonTitles[idx], marginX, cursorY)

    doc.setDrawColor(200)
    doc.line(marginX, cursorY + 4, marginX + 180, cursorY + 4)

    cursorY += 18

    // Labels
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text('Before (Baseline)', marginX, cursorY)
    doc.text('After (Post)', marginX + cardWidth + 24, cursorY)

    cursorY += 8

    // Card positions
    const leftCardX = marginX
    const rightCardX = marginX + cardWidth + 24
    const topY = cursorY

    // LEFT card
    doc.setFillColor(240, 240, 240)
    doc.rect(leftCardX + 4, topY + 4, cardWidth, cardHeight, 'F')
    doc.setFillColor(255, 255, 255)
    doc.rect(leftCardX, topY, cardWidth, cardHeight, 'F')
    doc.setDrawColor(220)
    doc.rect(leftCardX, topY, cardWidth, cardHeight, 'S')

    // RIGHT card
    doc.setFillColor(240, 240, 240)
    doc.rect(rightCardX + 4, topY + 4, cardWidth, cardHeight, 'F')
    doc.setFillColor(255, 255, 255)
    doc.rect(rightCardX, topY, cardWidth, cardHeight, 'F')
    doc.setDrawColor(220)
    doc.rect(rightCardX, topY, cardWidth, cardHeight, 'S')

    // Images
    const imgW = cardWidth - cardPadding * 2
    const imgH = cardHeight - cardPadding * 2
    const imgY = topY + cardPadding

    const beforeImg = faceImages.value[idx]
    const afterImg = postTreatmentImages.value[idx]

    const addImage = (img, x, y) => {
      if (!img) return
      try {
        doc.addImage(img, 'PNG', x, y, imgW, imgH)
      } catch {
        try {
          doc.addImage(img, 'JPEG', x, y, imgW, imgH)
        } catch (e) {
          console.log(e)
        }
      }
    }

    addImage(beforeImg, leftCardX + cardPadding, imgY)
    addImage(afterImg, rightCardX + cardPadding, imgY)

    // Divider
    let dividerY = topY + cardHeight + 42
    doc.setDrawColor(225)
    doc.line(marginX, dividerY, pageWidth - marginX, dividerY)
  }

  // ----------------------------
  // FOOTER (Except Cover Page)
  // ----------------------------
  const pageCount = doc.internal.getNumberOfPages()
  for (let p = 2; p <= pageCount; p++) {
    doc.setPage(p)

    const footerY = pageHeight - 24

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(140)
    doc.text('AI AESTHETICS — Generated Report', marginX, footerY)

    doc.text(`Page ${p - 1} of ${pageCount - 1}`, pageWidth / 2, footerY, { align: 'center' })
  }

  Loading.hide()
  const filename = `${assessmentData.value.name}_Visual_Comparison_Report_${post_diagnosis.value.metadata.treatment_session.replace(/\s+/g, '_')}.pdf`
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
      LocalStorage.removeItem(`treatment_flow_state_v1_${assessmentData.value.id}`)
      assessmentData.value.status = 'completed'
      emit('save_data', ['status'])
      Loading.show({
        message: 'Finalizing and redirecting...',
      })
      setTimeout(() => {
        // LocalStorage.clear()
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
