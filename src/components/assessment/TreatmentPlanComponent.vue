<template>
  <div v-if="treatmentPlan">
    <!-- Selected Treatment Plan -->
    <SelectedPlan @start-treatment="$emit('startTreatment')" />

    <!-- Recommended Treatment Plan -->
    <!-- <RecommendedFullPlan :treatmentPlan="recommendedFullPlan" /> -->

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
        label="Generate Post Assessment"
        rounded
        no-caps
        class="btn-custom"
        @click="postAssessment"
      />
    </div>
  </div>

  <div v-else class="flex justify-center q-mt-lg">
    <h6>Please Go Back And Generate Treatment Plan To View Details.</h6>
  </div>
</template>

<script setup>
import { watch, ref } from 'vue'
import jsPDF from 'jspdf'
import { storeToRefs } from 'pinia'
import SelectedPlan from 'src/components/assessment/SelectedPlan.vue'
// import RecommendedFullPlan from 'src/components/assessment/RecommendedFullPlan.vue'
import { useAssessmentStore } from 'src/stores/assessmentStore'
// import { useQuasar, LocalStorage, Loading } from 'quasar'

// const $q = useQuasar()

const store = useAssessmentStore()
const { assessmentData } = storeToRefs(store)

const emit = defineEmits(['previous', 'save_data', 'post_assessment'])

const treatmentPlan = ref(null)

watch(
  () => assessmentData.value,
  (val) => {
    if (val) {
      treatmentPlan.value = val.treatment_sessions
    }
  },
  { immediate: true },
)

function saveData(field) {
  emit('save_data', field)
}
// function finalizeAndExit() {
//   $q.dialog({
//     title: 'Confirm',
//     message: 'Would you like to confirm the treatment plan and return to CRM?',
//     persistent: true,

//     ok: {
//       label: 'Yes, Confirm & Exit',
//       color: 'positive',
//       icon: 'check_circle',
//       unelevated: true,
//     },
//     cancel: {
//       label: 'Cancel',
//       color: 'negative',
//       flat: true,
//       icon: 'close',
//     },
//   })
//     .onOk(() => {
//       assessmentData.value.status = 'completed'
//       emit('save_data', ['status'])
//       Loading.show({
//         message: 'Finalizing and redirecting...',
//       })
//       setTimeout(() => {
//         LocalStorage.clear()
//         window.location.href = `${process.env.CRM_URL}/users`
//       }, 3000)
//     })
//     .onCancel(() => {
//       console.log('User cancelled')
//     })
//     .onDismiss(() => {
//       console.log('Dialog closed (OK or Cancel)')
//     })
// }

function postAssessment() {
  emit('post_assessment')
}

const exportToPDF = () => {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width - 20
  const lineHeight = 6
  let y = 20

  const addLineIfNeeded = (height = 10) => {
    if (y > 270) {
      doc.addPage()
      y = 20
    }
    y += height
  }

  // COVER PAGE ----------------------------------------------------
  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, doc.internal.pageSize.width, doc.internal.pageSize.height, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(24)
  doc.text('AI AESTHETICS', pageWidth / 2 + 10, 40, { align: 'center' })

  // Patient Info
  y = 65
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  const simplePatientInfo = [
    `Name: ${assessmentData.value?.name || 'Not specified'}`,
    `Age: ${assessmentData.value?.age || 'Not specified'} | Gender: ${
      assessmentData.value?.gender || 'Not specified'
    }`,
  ]

  simplePatientInfo.forEach((line, i) => {
    doc.text(line, pageWidth / 2 + 10, y + i * 7, { align: 'center' })
  })

  // Overview
  y = 90
  doc.setFontSize(13)
  doc.text(`Treatment Duration: ${treatmentPlan.value.total_time}`, pageWidth / 2 + 10, y, {
    align: 'center',
  })
  doc.text(`Total Sessions: ${treatmentPlan.value.treatments.length}`, pageWidth / 2 + 10, y + 10, {
    align: 'center',
  })

  // Start main content
  doc.addPage()
  y = 25

  // ================================================================
  // EACH SESSION
  // ================================================================
  treatmentPlan.value.treatments.forEach((treatment, index) => {
    // SESSION HEADER BOX -------------------------------------------
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    y = addWrappedText(
      doc,
      `Session ${treatment.session_number}: ${treatment.title.replaceAll(/[-–→]/g, '-')}`,
      10,
      y,
      pageWidth,
      lineHeight + 2,
    )

    // TREATMENT TIME + WEEK ----------------------------------------
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    y = addWrappedText(
      doc,
      `Treatment Time: ${treatment.treatment_time}     |     Week: ${treatment.week}`,
      10,
      y,
      pageWidth,
      lineHeight,
    )

    addLineIfNeeded(5)

    // PREPARATIONS --------------------------------------------------
    doc.setFont('helvetica', 'bold')
    y = addWrappedText(doc, 'Preparations Checklist:', 10, y, pageWidth, lineHeight)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)

    treatment.preparations_checklist_for_therapist.forEach((item) => {
      addLineIfNeeded(0)
      y = addWrappedText(doc, `• ${item}`, 15, y, pageWidth - 5, lineHeight)
    })

    addLineIfNeeded(5)

    // CONCERNS ADDRESSED -------------------------------------------
    doc.setFont('helvetica', 'bold')
    y = addWrappedText(doc, 'Concerns Addressed:', 10, y, pageWidth, lineHeight)
    doc.setFont('helvetica', 'normal')

    treatment.concerns_addressed.forEach((c) => {
      addLineIfNeeded(0)
      const concernText = `${c.concern}: From ${c.current_value} To ${c.target_value}`
      y = addWrappedText(doc, `• ${concernText}`, 15, y, pageWidth - 10, lineHeight)
    })

    addLineIfNeeded(5)

    // TREATMENT STEPS ----------------------------------------------
    doc.setFont('helvetica', 'bold')
    y = addWrappedText(doc, 'Treatment Steps:', 10, y, pageWidth, lineHeight)

    treatment.steps.forEach((step, i) => {
      addLineIfNeeded(0)

      // Step header with duration
      doc.setFont('helvetica', 'bold')
      y = addWrappedText(
        doc,
        `Step ${step.step_number}  •  Duration: ${step.duration} mins`,
        15,
        y,
        pageWidth - 10,
        lineHeight,
      )

      // Equipment list
      doc.setFont('helvetica', 'italic')
      y = addWrappedText(
        doc,
        `Equipment: ${step.ingredients_equipments.join(', ')}`,
        20,
        y,
        pageWidth - 15,
        lineHeight,
      )

      // Procedure
      doc.setFont('helvetica', 'normal')
      y = addWrappedText(
        doc,
        step.how_to_do.replaceAll(/[-–→]/g, '-'),
        20,
        y,
        pageWidth - 15,
        lineHeight,
      )

      if (i < treatment.steps.length - 1) y += 3
    })

    // Space between sessions
    if (index < treatmentPlan.value.treatments.length - 1) {
      addLineIfNeeded(15)
      doc.addPage()
      y = 25
    }
  })

  // ================================================================
  // THERAPIST NOTES
  // ================================================================
  if (y > 250) {
    doc.addPage()
    y = 20
  }

  doc.setFont('helvetica', 'bold')
  y = addWrappedText(doc, 'Therapist Notes:', 10, y, pageWidth, lineHeight)
  doc.setFont('helvetica', 'normal')

  const notes = assessmentData.value.therapist_notes || 'No notes added.'
  y = addWrappedText(doc, notes, 10, y, pageWidth, lineHeight)

  // ================================================================
  // FOOTER
  // ================================================================
  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(120)

    doc.text(`Page ${i} of ${totalPages}`, doc.internal.pageSize.width / 2, 285, {
      align: 'center',
    })
    doc.text('Confidential - For Professional Use Only', 10, 292)

    const currentDate = new Date().toLocaleDateString()
    doc.text(`Generated on: ${currentDate}`, doc.internal.pageSize.width - 10, 292, {
      align: 'right',
    })
  }

  doc.save(`${assessmentData.value.name} - Treatment Plan.pdf`)
}

// Helper function for wrapped text (make sure this exists)
const addWrappedText = (doc, text, x, y, maxWidth, lineHeight) => {
  const lines = doc.splitTextToSize(text, maxWidth)
  doc.text(lines, x, y)
  return y + lines.length * lineHeight
}
</script>
