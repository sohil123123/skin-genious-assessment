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

      <!-- Selected Treatment Plan -->
      <SelectedPlan :treatmentPlan="treatmentPlan" />

      <!-- Recommended Treatment Plan -->
      <RecommendedFullPlan v-if="treatmentType == 'single'" :treatmentPlan="recommendedFullPlan" />

      <div>
        <q-input
          v-model="assessmentData.therapist_notes"
          type="textarea"
          label="Notes"
          outlined
          clearable
          :debounce="2000"
          @update:model-value="saveData(['therapist_notes'])"
        />
      </div>

      <div class="flex justify-between q-mt-lg">
        <q-btn label="Previous" rounded no-caps class="btn-custom" @click="emitPrevious" />
        <q-btn
          label="Export Patient Treatment Plan To PDF"
          icon="get_app"
          rounded
          no-caps
          @click="exportToPDF"
          title="Export Patient Treatment Plan to PDF"
          color="positive"
        />
        <q-btn
          label="Finalize Plan & Exit"
          rounded
          no-caps
          class="btn-custom"
          @click="finalizeAndExit"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import jsPDF from 'jspdf'
import { storeToRefs } from 'pinia'
import SelectedPlan from 'src/components/assessment/SelectedPlan.vue'
import RecommendedFullPlan from 'src/components/assessment/RecommendedFullPlan.vue'
import { useAssessmentStore } from 'src/stores/assessmentStore'
import { useQuasar, LocalStorage } from 'quasar'

const $q = useQuasar()

const store = useAssessmentStore()
const { assessmentData } = storeToRefs(store)

const props = defineProps({
  treatmentPlan: {
    type: [String, Object],
    required: true,
  },
  recommendedFullPlan: {
    type: [String, Object],
    required: true,
  },
  treatmentType: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['previous', 'save_data'])

const treatmentPlan = ref(props.treatmentPlan)
const recommendedFullPlan = ref(props.recommendedFullPlan)

const emitPrevious = () => {
  emit('previous')
}

function saveData(field) {
  emit('save_data', field)
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
      LocalStorage.clear()
      setTimeout(() => {
        window.location.href = `${process.env.CRM_URL}/users`
      }, 2000)
    })
    .onCancel(() => {
      console.log('User cancelled')
    })
    .onDismiss(() => {
      console.log('Dialog closed (OK or Cancel)')
    })
}

const exportToPDF = () => {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width - 20 // 10mm margin on each side
  const lineHeight = 6
  let y = 20

  // Alternative simple cover page (replace the cover section with this):
  // ===== SIMPLE COVER PAGE =====
  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, doc.internal.pageSize.width, doc.internal.pageSize.height, 'F')

  // Title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(38, 38, 38)
  doc.text('AI AESTHETICS', pageWidth / 2 + 10, 40, { align: 'center' })

  // Patient Info Box
  y = 55

  doc.setFontSize(11)
  doc.setTextColor(38, 38, 38)

  const simplePatientInfo = [
    `Name: ${assessmentData.value?.name || 'Not specified'}`,
    `Age: ${assessmentData.value?.age || 'Not specified'} | Gender: ${assessmentData.value?.gender || 'Not specified'}`,
    // `Skin Type: ${assessmentData.value?.skinType || 'Not specified'}`,
    // `Therapist: ${assessmentData.value?.therapist || 'Not specified'}`,
  ]

  simplePatientInfo.forEach((line, index) => {
    doc.text(line, pageWidth / 2 + 10, y + index * 7, { align: 'center' })
  })

  // Treatment Overview
  y = 75
  doc.setFontSize(12)
  doc.text(`Treatment Duration: ${treatmentPlan.value.total_time}`, pageWidth / 2 + 10, y, {
    align: 'center',
  })
  doc.text(`Sessions: ${treatmentPlan.value.treatments.length}`, pageWidth / 2 + 10, y + 8, {
    align: 'center',
  })

  doc.addPage()
  y = 20 // Reset Y position for new page

  let isFirstSession = true

  y += 10 // Add some space before sessions

  treatmentPlan.value.treatments.forEach((treatment, index) => {
    // Start new page for each session except the first one
    if (!isFirstSession) {
      doc.addPage()
      y = 20 // Reset Y position for new page
    } else {
      isFirstSession = false
    }

    // Check if we have enough space for session header
    if (y > 200) {
      doc.addPage()
      y = 20
    }

    // Session Header
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(0, 0, 0) // Ensure black color
    y = addWrappedText(
      doc,
      `Session ${treatment.session_number}: ${treatment.title}`,
      10,
      y,
      pageWidth,
      lineHeight + 2,
    )

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    y = addWrappedText(
      doc,
      `Treatment Time: ${treatment.treatment_time} | Week: ${treatment.week}`,
      10,
      y,
      pageWidth,
      lineHeight,
    )

    y += 8 // Add space before sections

    // // Preparations Checklist
    // doc.setFont('helvetica', 'bold')
    // doc.setFontSize(12)
    // y = addWrappedText(doc, 'Preparations Checklist:', 10, y, pageWidth, lineHeight)

    // doc.setFont('helvetica', 'normal')
    // doc.setFontSize(10)
    // treatment.preparations_checklist_for_therapist.forEach((item) => {
    //   if (y > 270) {
    //     doc.addPage()
    //     y = 20
    //   }
    //   y = addWrappedText(doc, `• ${item}`, 15, y, pageWidth - 5, lineHeight)
    // })

    // y += 5 // Space between sections

    // Concerns Addressed
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    y = addWrappedText(doc, 'Concerns Addressed:', 10, y, pageWidth, lineHeight)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    treatment.concerns_addressed.forEach((concern) => {
      if (y > 270) {
        doc.addPage()
        y = 20
      }
      const concernText = `${concern.concern}: From ${concern.current_value} To ${concern.target_value}`
      y = addWrappedText(
        doc,
        `• ${concernText.replaceAll('–', '-')}`,
        15,
        y,
        pageWidth - 5,
        lineHeight,
      )
    })

    y += 5 // Space between sections

    // Treatment Steps
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    y = addWrappedText(doc, 'Treatment Steps:', 10, y, pageWidth, lineHeight)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    treatment.steps.forEach((step, stepIndex) => {
      // Check if we need a new page for the next step
      if (y > 240) {
        // Lower threshold to accommodate step content
        doc.addPage()
        y = 20
      }

      // Step Header
      // doc.setFont('helvetica', 'bold')
      // y = addWrappedText(doc, `Step ${step.step_number}`, 15, y, pageWidth - 5, lineHeight)

      // Ingredients/Equipment
      doc.setFont('helvetica', 'normal')
      // const ingredientsText = `Equipment: ${step.ingredients_equipments.join(', ')}`
      // y = addWrappedText(doc, ingredientsText, 20, y, pageWidth - 10, lineHeight)

      // Procedure
      const howToText = `${step.how_to_do}`
      y = addWrappedText(doc, howToText, 20, y, pageWidth - 10, lineHeight)

      // Add space between steps, but not after the last step
      if (stepIndex < treatment.steps.length - 1) {
        y += 1
      }
    })

    // Add space between sessions, but not after the last session
    if (index < treatmentPlan.value.treatments.length - 1) {
      y += 10
    }
  })

  // Therapist Notes Section (starts on new page if needed)
  if (y > 250) {
    doc.addPage()
    y = 20
  } else {
    y += 10
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  y = addWrappedText(doc, 'Therapist Notes:', 10, y, pageWidth, lineHeight)

  doc.setFont('helvetica', 'normal')
  const notes = assessmentData.value.therapist_notes || 'No notes added.'
  y = addWrappedText(doc, notes, 10, y, pageWidth, lineHeight)

  // Add footer to all pages
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)

    // Page number
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, 285, { align: 'center' })

    // Confidential notice
    doc.text('Confidential - For Professional Use Only', 10, 290)

    // Clinic name/date
    const currentDate = new Date().toLocaleDateString()
    doc.text(`Generated on: ${currentDate}`, doc.internal.pageSize.width - 10, 290, {
      align: 'right',
    })
  }

  doc.save('treatment-plan.pdf')
}

// Helper function for wrapped text (make sure this exists)
const addWrappedText = (doc, text, x, y, maxWidth, lineHeight) => {
  const lines = doc.splitTextToSize(text, maxWidth)
  doc.text(lines, x, y)
  return y + lines.length * lineHeight
}
</script>
