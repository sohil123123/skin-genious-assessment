<template>
  <div v-if="diagnosis">
    <div class="flex justify-between q-mt-lg">
      <q-btn label="Previous" rounded no-caps class="btn-custom" @click="emitPrevious" />
      <q-btn
        label="Download PDF"
        icon="picture_as_pdf"
        rounded
        no-caps
        class="btn-custom"
        @click="exportToPDF"
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
          {{ param.score_explanation }}
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

  <q-page-sticky v-if="diagnosis" position="bottom-right" :offset="[18, 18]">
    <q-btn fab icon="download" color="accent" @click="exportToPDF" />
  </q-page-sticky>
</template>

<script setup>
import jsPDF from 'jspdf'
import { storeToRefs } from 'pinia'
import { useAssessmentStore } from 'src/stores/assessmentStore'
import { onMounted, ref, watch } from 'vue'

const store = useAssessmentStore()
const { assessmentData } = storeToRefs(store)

const diagnosis = ref(null)
const faceImages = ref(null)

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

      const desiredOrder = ['white', 'ppl', 'xpl', 'uv', 'woods', 'blue', 'brown', 'red']

      const desiredImages = desiredOrder
        .map((name) => val.images?.find((img) => img.url.toLowerCase().includes(`${name}.`)))
        .filter(Boolean)

      faceImages.value = desiredImages.map((img) => img.url)
    }
  },
  { immediate: true },
)

onMounted(async () => {
  if (!diagnosis.value) {
    diagnosis.value = assessmentData.value.diagnosis

    const desiredOrder = ['white', 'ppl', 'xpl', 'uv', 'woods', 'blue', 'brown', 'red']

    const desiredImages = desiredOrder
      .map((name) =>
        assessmentData.value.images?.find((img) => img.url.toLowerCase().includes(`${name}.`)),
      )
      .filter(Boolean)

    faceImages.value = desiredImages.map((img) => img.url)
  }
})

// Helper to check if label looks like a score (starts with number or 'Score/Grade')
function isScore(label) {
  return /^\d|Score|Grade/.test(label)
}

const exportToPDF = () => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  let pageNumber = 1
  const parameters = Object.values(diagnosis.value.diagnosis_report) // Extract parameters as array for iteration

  parameters.forEach((param, index) => {
    if (index > 0) {
      doc.addPage()
    }

    // Header: AI AESTHETICS (centered, large font)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text('AI AESTHETICS', 105, 20, { align: 'center' })

    // Horizontal line below header
    doc.setLineWidth(0.5)
    doc.line(20, 25, 190, 25)

    // Parameter Name (medium font)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(param.parameter_name, 20, 40)

    // Explanation Section Title
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('EXPLANATION OF WHAT THE PARAMETER ENTAILS', 20, 50)

    // Parameter Description (wrapped text)
    doc.setFont('helvetica', 'normal')
    const descriptionLines = doc.splitTextToSize(param.description, 170)
    doc.text(descriptionLines, 20, 55)
    let currentY = 55 + descriptionLines.length * 5 // Approximate line height adjustment

    // Upper Section (Score/Grade Row): Left column for Score/Present, Right for Explanation
    // Draw table-like borders for the entire table (upper and lower rows together)
    const upperHeight = 50 // Fixed height for upper row (adjust if needed for wrapping)
    const lowerHeight = 100 // Fixed height for lower row
    doc.rect(20, currentY, 80, upperHeight + lowerHeight) // Left column full height
    doc.rect(100, currentY, 90, upperHeight + lowerHeight) // Right column full height
    doc.line(20, currentY + upperHeight, 190, currentY + upperHeight) // Horizontal line between rows

    // Upper Left column title (wrapped)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    const titleLines = doc.splitTextToSize('SCORE/TEXT/SKIN TYPE/PRESENT OR NOT PRESENT', 75) // Wrap to fit cell width (80 - padding)
    doc.text(titleLines, 22, currentY + 8)
    let titleY = currentY + 8 + titleLines.length * 5 // Adjust for multi-line title

    // Circle with score/label (handle string, number, or object)
    doc.setDrawColor(0)
    doc.circle(60, titleY + 12, 12) // Adjust position based on title height
    doc.setFontSize(10)
    let scoreText = ''
    if (typeof param.score_or_label === 'object') {
      // Special handling for periorbital_health (multi-label with +/-)
      const labels = []
      for (const [key, value] of Object.entries(param.score_or_label)) {
        labels.push(`${key.charAt(0).toUpperCase() + key.slice(1)} - ${value}`)
      }
      scoreText = labels.join('\n')
    } else {
      scoreText = param.score_or_label.toString()
    }
    const scoreLines = doc.splitTextToSize(scoreText, 20) // Wrap if multi-line
    doc.text(scoreLines, 60, titleY + 8 - (scoreLines.length - 1) * 3 + 5, { align: 'center' })

    // Upper Right column title
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('EXPLANATION OF SCORE', 102, currentY + 8)

    // Score Explanation (wrapped)
    doc.setFont('helvetica', 'normal')
    const scoreExpLines = doc.splitTextToSize(param.score_explanation.replaceAll('‑', '-'), 85)
    doc.text(scoreExpLines, 102, currentY + 13)

    // Move to lower row
    currentY += upperHeight

    // Lower Left column title
    doc.setFont('helvetica', 'bold')
    const faceTitleLines = doc.splitTextToSize('FACE IMAGE SHOWING AFFECTED AREAS', 75)
    doc.text(faceTitleLines, 22, currentY + 8)

    // Placeholder for image (rectangle with text; replace with actual image addImage() if base64/URL available)
    // // For now, draw a simple face outline as placeholder (using lines)
    let faceY = currentY + 8 + faceTitleLines.length * 5 + 5 // Adjust below title

    // Add Face Image, use: doc.addImage(imageBase64, 'PNG', 30, faceY, 50, 70);
    if (faceImages.value[param.affected_area_image - 1]) {
      doc.addImage(faceImages.value[param.affected_area_image - 1], 'PNG', 35, faceY, 50, 70)
    }

    // Lower Right column title
    doc.setFont('helvetica', 'bold')
    const causesTitleLines = doc.splitTextToSize('POSSIBLE CAUSES OF THE ISSUE SEEN', 85)
    doc.text(causesTitleLines, 102, currentY + 8)

    // Possible Causes (bullet list, wrapped)
    doc.setFont('helvetica', 'normal')
    let causeY = currentY + 8 + causesTitleLines.length * 5 + 5
    param.possible_causes.forEach((cause) => {
      const causeLines = doc.splitTextToSize(`• ${cause.replaceAll('‑', '-')}`, 85)
      doc.text(causeLines, 102, causeY)
      causeY += causeLines.length * 5 // Adjust for multi-line causes
    })

    currentY += lowerHeight + 5 // Move to footer

    // Footer line
    doc.setLineWidth(0.5)
    doc.line(20, 270, 190, 270)

    // Footer text
    doc.setFontSize(10)
    doc.text('DEVELOPED BY DR. AAKRITI MEHRA', 20, 280)
    doc.text(`PAGE ${pageNumber}`, 170, 280)

    pageNumber++
  })

  doc.save(`${assessmentData.value.name} AIA_Diagnosis_Report.pdf`)
}
</script>

<style scoped>
.rounded-borders {
  border-radius: 20px;
}
</style>
