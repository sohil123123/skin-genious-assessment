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

      <q-card class="professional-card shadow-2">
        <q-card-section class="bg-primary text-white">
          <div class="row items-center">
            <q-icon name="local_hospital" size="md" class="q-mr-sm" />
            <div class="text-h5">Patient Treatment Plan</div>
            <q-space />
            <q-btn icon="print" flat round @click="printPlan" title="Print Treatment Plan" />
            <q-btn icon="get_app" flat round @click="exportToPDF" title="Export to PDF" />
          </div>
          <div class="text-subtitle1 q-mt-sm">Total Duration: {{ treatmentPlan.total_time }}</div>
        </q-card-section>
        <q-separator />
        <q-tabs v-model="tab" dense class="text-primary">
          <q-tab name="details" icon="info" label="Session Details" />
          <q-tab name="concerns" icon="assignment" label="Concerns Addressed" />
          <q-tab name="steps" icon="list" label="Treatment Steps" />
        </q-tabs>
        <q-separator />
        <q-tab-panels v-model="tab" animated>
          <q-tab-panel name="details">
            <q-list bordered separator>
              <q-item v-for="(treatment, index) in treatmentPlan.treatments" :key="index">
                <q-item-section>
                  <q-item-label
                    >Session {{ treatment.session_number }}: {{ treatment.title }}</q-item-label
                  >
                  <q-item-label caption
                    >Time: {{ treatment.treatment_time }} | Week: {{ treatment.week }}</q-item-label
                  >
                </q-item-section>
              </q-item>
            </q-list>
            <div class="q-mt-md">
              <div class="text-h6">Therapist Preparations Checklist</div>
              <q-list dense bordered separator>
                <q-item
                  v-for="(item, idx) in selectedTreatment.preparations_checklist_for_therapist"
                  :key="idx"
                  clickable
                  @click="toggleChecklistItem(idx)"
                >
                  <q-item-section avatar>
                    <q-avatar
                      :color="checklistCompleted[idx] ? 'positive' : 'grey'"
                      text-color="white"
                      :icon="checklistCompleted[idx] ? 'check' : 'radio_button_unchecked'"
                      size="sm"
                    />
                  </q-item-section>
                  <q-item-section>{{ item }}</q-item-section>
                </q-item>
              </q-list>
            </div>
          </q-tab-panel>
          <q-tab-panel name="concerns">
            <q-table
              title="Concerns Addressed"
              :rows="selectedTreatment.concerns_addressed"
              :columns="concernsColumns"
              row-key="concern"
              :pagination="{ rowsPerPage: 0 }"
              dense
              flat
              bordered
            />
          </q-tab-panel>
          <q-tab-panel name="steps">
            <div class="text-h6">Treatment Steps</div>
            <q-list bordered separator>
              <q-item v-for="(step, stepIdx) in selectedTreatment.steps" :key="stepIdx">
                <q-item-section>
                  <q-item-label class="text-bold"
                    >Step {{ step.step_number }} - Duration: {{ step.duration }} mins</q-item-label
                  >
                  <q-item-label>Ingredients/Equipment:</q-item-label>
                  <q-chip
                    v-for="(item, itemIdx) in step.ingredients_equipments"
                    :key="itemIdx"
                    text-color="white"
                    size="md"
                    class="q-mr-xs gredient"
                    style="max-width: max-content"
                  >
                    {{ item }}
                  </q-chip>
                  <q-item-label class="q-mt-sm">Procedure: {{ step.how_to_do }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-tab-panel>
        </q-tab-panels>
        <q-separator class="q-my-md" />
        <q-card-section>
          <div class="text-caption text-grey">Therapist Notes:</div>
          <q-input
            v-model="therapistNotes"
            type="textarea"
            outlined
            dense
            placeholder="Add any additional notes or observations..."
          />
          <q-btn color="primary" label="Save Notes" class="q-mt-sm" @click="saveNotes" />
        </q-card-section>
      </q-card>

      <q-separator class="q-my-lg" />

      <q-card class="professional-card shadow-2">
        <q-card-section class="bg-accent text-white">
          <div class="row items-center">
            <q-icon name="calendar_today" size="md" class="q-mr-sm" />
            <div class="text-h5">Recommended Full Treatment Plan</div>
            <q-space />
            <q-btn icon="print" flat round @click="printFullPlan" title="Print Full Plan" />
            <q-btn
              icon="get_app"
              flat
              round
              @click="exportFullToPDF"
              title="Export Full Plan to PDF"
            />
          </div>
          <div class="text-subtitle1 q-mt-sm">
            Total Duration: {{ recommendedFullPlan.total_time }}
          </div>
        </q-card-section>
        <q-separator />
        <q-expansion-item
          v-for="(treatment, index) in recommendedFullPlan.treatments"
          :key="index"
          expand-separator
          :label="`Session ${treatment.session_number}: ${treatment.title}`"
          :caption="`Time: ${treatment.treatment_time} | Week: ${treatment.week}`"
          dense
        >
          <q-card flat>
            <q-tabs v-model="fullTab[index]" dense class="text-accent">
              <q-tab name="concerns" icon="assignment" label="Concerns" />
              <q-tab name="steps" icon="list" label="Steps" />
            </q-tabs>
            <q-separator />
            <q-tab-panels v-model="fullTab[index]" animated>
              <q-tab-panel name="concerns" class="q-pa-none">
                <q-table
                  :rows="treatment.concerns_addressed"
                  :columns="concernsColumns"
                  row-key="concern"
                  :pagination="{ rowsPerPage: 0 }"
                  dense
                  flat
                  bordered
                />
              </q-tab-panel>
              <q-tab-panel name="steps" class="q-pa-none">
                <div class="text-h6">Treatment Steps</div>
                <q-list bordered separator>
                  <q-item v-for="(step, stepIdx) in treatment.steps" :key="stepIdx">
                    <q-item-section>
                      <q-item-label class="text-bold"
                        >Step {{ step.step_number }} - Duration:
                        {{ step.duration }} mins</q-item-label
                      >
                      <q-item-label>Ingredients/Equipment:</q-item-label>
                      <q-chip
                        v-for="(item, itemIdx) in step.ingredients_equipments"
                        :key="itemIdx"
                        color="accent"
                        text-color="white"
                        size="md"
                        class="q-mr-xs"
                        style="max-width: max-content"
                      >
                        {{ item }}
                      </q-chip>
                      <q-item-label class="q-mt-sm">Procedure: {{ step.how_to_do }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-tab-panel>
            </q-tab-panels>
          </q-card>
        </q-expansion-item>
      </q-card>
      <div class="flex justify-between q-mt-lg">
        <q-btn label="Previous" rounded no-caps class="btn-custom" @click="emitPrevious" />
        <q-btn
          rounded
          icon="print"
          label="Print"
          color="black"
          @click="printPlan"
          title="Print Treatment Plan"
          no-caps
        />
        <q-btn
          label="Export Patient Treatment Plan To PDF"
          icon="get_app"
          rounded
          no-caps
          @click="exportToPDF"
          title="Export Patient Treatment Plan to PDF"
          color="positive"
        />
        <q-btn label="Finish" rounded no-caps class="btn-custom" @click="submit" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Notify, useQuasar } from 'quasar'
import jsPDF from 'jspdf'

const props = defineProps({
  treatmentPlan: {
    type: [String, Object],
    required: true,
  },
  recommendedFullPlan: {
    type: [String, Object],
    required: true,
  },
})

const emit = defineEmits(['previous'])

const treatmentPlan = ref(props.treatmentPlan)
const recommendedFullPlan = ref(props.recommendedFullPlan)

const $q = useQuasar()

const tab = ref('details')
const fullTab = ref(recommendedFullPlan.value.treatments.map(() => 'concerns'))
const therapistNotes = ref('')
const checklistCompleted = ref(
  treatmentPlan.value.treatments[0].preparations_checklist_for_therapist.map(() => false),
)

const selectedTreatment = computed(() => treatmentPlan.value.treatments[0]) // Assuming single session for treatment_plan

const concernsColumns = [
  { name: 'concern', label: 'Concern', field: 'concern', align: 'left', style: 'width: 40%' },
  { name: 'current_value', label: 'Current Value', field: 'current_value', align: 'left' },
  { name: 'target_value', label: 'Target Value', field: 'target_value', align: 'left' },
]

const emitPrevious = () => {
  emit('previous')
}

const toggleChecklistItem = (idx) => {
  checklistCompleted.value[idx] = !checklistCompleted.value[idx]
}

const saveNotes = () => {
  $q.notify({ message: 'Notes saved successfully!', color: 'positive' })
  // Implement actual save logic here
}

const printPlan = () => {
  window.print()
}

const printFullPlan = () => {
  window.print()
}

const addWrappedText = (doc, text, x, y, maxWidth, lineHeight) => {
  const lines = doc.splitTextToSize(text, maxWidth)
  lines.forEach((line) => {
    if (y > 280) {
      // Check if near bottom of page
      doc.addPage()
      y = 10
    }
    doc.text(line, x, y)
    y += lineHeight
  })
  return y
}

function submit() {
  Notify.create({
    type: 'positive',
    message: 'Treatment plan submitted successfully!',
  })
}

const exportToPDF = () => {
  const doc = new jsPDF()
  const pageWidth = 190 // Margin 10 on each side
  const lineHeight = 6
  let y = 20

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  y = addWrappedText(doc, 'Patient Treatment Plan', 10, y, pageWidth, 10)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  y = addWrappedText(
    doc,
    `Total Duration: ${treatmentPlan.value.total_time}`,
    10,
    y,
    pageWidth,
    lineHeight,
  )

  treatmentPlan.value.treatments.forEach((treatment) => {
    if (y > 250) {
      doc.addPage()
      y = 10
    }
    y += 10
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
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
      `Time: ${treatment.treatment_time} | Week: ${treatment.week}`,
      10,
      y,
      pageWidth,
      lineHeight,
    )

    y += 5
    doc.setFont('helvetica', 'bold')
    y = addWrappedText(doc, 'Preparations Checklist:', 10, y, pageWidth, lineHeight)

    doc.setFont('helvetica', 'normal')
    treatment.preparations_checklist_for_therapist.forEach((item) => {
      if (y > 270) {
        doc.addPage()
        y = 10
      }
      y = addWrappedText(doc, `- ${item}`, 15, y, pageWidth - 5, lineHeight)
    })

    y += 5
    doc.setFont('helvetica', 'bold')
    y = addWrappedText(doc, 'Concerns Addressed:', 10, y, pageWidth, lineHeight)

    doc.setFont('helvetica', 'normal')
    treatment.concerns_addressed.forEach((concern) => {
      if (y > 270) {
        doc.addPage()
        y = 10
      }
      const concernText = `${concern.concern}: Current - ${concern.current_value}, Target - ${concern.target_value}`
      y = addWrappedText(doc, `- ${concernText}`, 15, y, pageWidth - 5, lineHeight)
    })

    y += 5
    doc.setFont('helvetica', 'bold')
    y = addWrappedText(doc, 'Treatment Steps:', 10, y, pageWidth, lineHeight)

    doc.setFont('helvetica', 'normal')
    treatment.steps.forEach((step) => {
      if (y > 270) {
        doc.addPage()
        y = 10
      }
      doc.setFont('helvetica', 'bold')
      y = addWrappedText(
        doc,
        `Step ${step.step_number} (${step.duration} mins):`,
        15,
        y,
        pageWidth - 5,
        lineHeight,
      )

      doc.setFont('helvetica', 'normal')
      const ingredientsText = `Ingredients/Equipments: ${step.ingredients_equipments.join(', ')}`
      y = addWrappedText(doc, ingredientsText, 20, y, pageWidth - 10, lineHeight)

      const howToText = `Procedure: ${step.how_to_do}`
      y = addWrappedText(doc, howToText, 20, y, pageWidth - 10, lineHeight)

      y += 2
    })
  })

  if (y > 270) {
    doc.addPage()
    y = 10
  }
  y += 10
  doc.setFont('helvetica', 'bold')
  y = addWrappedText(doc, 'Therapist Notes:', 10, y, pageWidth, lineHeight)

  doc.setFont('helvetica', 'normal')
  const notes = therapistNotes.value || 'No notes added.'
  y = addWrappedText(doc, notes, 10, y, pageWidth, lineHeight)

  // Add footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(10)
    doc.setTextColor(150)
    doc.text(`Page ${i} of ${pageCount}`, 10, 290)
    doc.text('Confidential - For Professional Use Only', 140, 290)
  }

  doc.save('treatment-plan.pdf')
}

const exportFullToPDF = () => {
  const doc = new jsPDF()
  const pageWidth = 190
  const lineHeight = 6
  let y = 20

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  y = addWrappedText(doc, 'Recommended Full Treatment Plan', 10, y, pageWidth, 10)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  y = addWrappedText(
    doc,
    `Total Duration: ${recommendedFullPlan.value.total_time}`,
    10,
    y,
    pageWidth,
    lineHeight,
  )

  recommendedFullPlan.value.treatments.forEach((treatment) => {
    if (y > 250) {
      doc.addPage()
      y = 10
    }
    y += 10
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
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
      `Time: ${treatment.treatment_time} | Week: ${treatment.week}`,
      10,
      y,
      pageWidth,
      lineHeight,
    )

    y += 5
    doc.setFont('helvetica', 'bold')
    y = addWrappedText(doc, 'Concerns Addressed:', 10, y, pageWidth, lineHeight)

    doc.setFont('helvetica', 'normal')
    treatment.concerns_addressed.forEach((concern) => {
      if (y > 270) {
        doc.addPage()
        y = 10
      }
      const concernText = `${concern.concern}: Current - ${concern.current_value}, Target - ${concern.target_value}`
      y = addWrappedText(doc, `- ${concernText}`, 15, y, pageWidth - 5, lineHeight)
    })

    y += 5
    doc.setFont('helvetica', 'bold')
    y = addWrappedText(doc, 'Treatment Steps:', 10, y, pageWidth, lineHeight)

    doc.setFont('helvetica', 'normal')
    treatment.steps.forEach((step) => {
      if (y > 270) {
        doc.addPage()
        y = 10
      }
      doc.setFont('helvetica', 'bold')
      y = addWrappedText(
        doc,
        `Step ${step.step_number} (${step.duration} mins):`,
        15,
        y,
        pageWidth - 5,
        lineHeight,
      )

      doc.setFont('helvetica', 'normal')
      const ingredientsText = `Ingredients/Equipments: ${step.ingredients_equipments.join(', ')}`
      y = addWrappedText(doc, ingredientsText, 20, y, pageWidth - 10, lineHeight)

      const howToText = `Procedure: ${step.how_to_do}`
      y = addWrappedText(doc, howToText, 20, y, pageWidth - 10, lineHeight)

      y += 2
    })
  })

  // Add footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(10)
    doc.setTextColor(150)
    doc.text(`Page ${i} of ${pageCount}`, 10, 290)
    doc.text('Confidential - For Professional Use Only', 140, 290)
  }

  doc.save('full-treatment-plan.pdf')
}
</script>

<style>
.professional-card {
  border-radius: 8px;
  overflow: hidden;
}

@media print {
  .professional-card {
    box-shadow: none !important;
  }
  .q-btn {
    display: none;
  }
  .q-tab-panels {
    background: none !important;
  }
  .q-tab-panel {
    display: block !important;
    padding: 0 !important;
  }
  .q-expansion-item__content > * {
    display: block !important;
  }
  .q-expansion-item--expanded {
    min-height: auto !important;
  }
  .q-expansion-item .q-expansion-item__toggle {
    display: none !important;
  }
  .q-expansion-item .q-expansion-item__content {
    display: block !important;
    opacity: 1 !important;
  }
  .q-page {
    padding: 0 !important;
  }
  .bg-grey-1 {
    background: white !important;
  }
}
</style>
