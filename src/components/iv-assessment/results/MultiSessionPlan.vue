<template>
  <div class="multi-session-plan">
    <!-- Header -->
    <q-card
      class="bg-gradient-primary text-white q-mb-lg rounded-borders shadow-2 overflow-hidden relative-position"
    >
      <div
        class="absolute-full bg-white opacity-10"
        style="
          background-image: radial-gradient(circle, #fff 10%, transparent 10%);
          background-size: 20px 20px;
        "
      ></div>
      <q-card-section class="q-pa-lg relative-position z-1">
        <div
          class="text-overline text-blue-2 q-mb-none font-medium text-uppercase letter-spacing-1"
        >
          Long-Term AI Protocol
        </div>
        <div class="text-h4 text-weight-bold q-my-sm">
          {{ planDetails.name }}
        </div>
        <div class="row items-center q-gutter-x-md text-body2 q-mt-md">
          <q-badge color="white" text-color="primary" class="q-py-xs q-px-sm text-weight-bold">
            <q-icon name="date_range" size="14px" class="q-mr-xs" />
            {{ planDetails.plan_duration_weeks }} Weeks
          </q-badge>
          <span class="text-blue-1 opacity-90 flex items-center">
            <q-icon name="schedule" size="16px" class="q-mr-xs" />
            {{ formatSchedule(planDetails.schedule_description) }}
          </span>
          <q-btn
            flat
            round
            dense
            color="white"
            icon="download"
            class="q-ml-auto"
            @click="downloadPDF"
          >
            <q-tooltip>Download PDF</q-tooltip>
          </q-btn>
        </div>
      </q-card-section>
    </q-card>

    <!-- Timeline -->
    <div class="q-px-sm">
      <q-timeline color="indigo" layout="comfortable">
        <q-timeline-entry
          v-for="(session, index) in planDetails.sessions"
          :key="index"
          :side="index % 2 === 0 ? 'left' : 'right'"
        >
          <template v-slot:title>
            <div class="text-h6 text-primary text-weight-bold">Week {{ session.week_index }}</div>
          </template>

          <template v-slot:subtitle>
            <div class="text-subtitle2 text-grey-8 text-uppercase q-mt-xs">
              {{ formatPhase(session.phase_id) }}
            </div>
          </template>

          <q-card class="timeline-card shadow-sm border-grey" flat bordered>
            <!-- Goal Summary -->
            <q-card-section class="q-pb-sm">
              <div class="text-body2 text-grey-9">
                <strong class="text-primary">Goal:</strong> {{ session.session_goal_summary }}
              </div>
            </q-card-section>

            <q-separator
              color="grey-2"
              v-if="session.recommended_protocol_week_optional || session.candidate_generation_hint"
            />

            <!-- Detailed Protocol (if available) -->
            <q-card-section v-if="session.recommended_protocol_week_optional" class="bg-grey-1">
              <div class="text-caption text-weight-bold text-grey-7 q-mb-xs text-uppercase">
                Recommended Protocol
              </div>

              <!-- Protocol ID -->
              <div class="text-caption text-grey-6 q-mb-sm">
                ID: {{ session.recommended_protocol_week_optional.protocol_id }}
              </div>

              <!-- Hero Ingredients -->
              <div
                class="flex q-gutter-xs q-mb-sm"
                v-if="session.recommended_protocol_week_optional.hero_ingredients"
              >
                <q-badge
                  v-for="hero in session.recommended_protocol_week_optional.hero_ingredients"
                  :key="hero"
                  outline
                  class="gredient"
                >
                  <q-icon name="star" size="10px" class="q-mr-xs" /> {{ hero }}
                </q-badge>
              </div>

              <!-- Bag Details Preview -->
              <div
                v-for="(bag, bIdx) in session.recommended_protocol_week_optional.bags"
                :key="bIdx"
                class="bg-white q-pa-xs rounded-borders border-grey q-mb-xs"
              >
                <div class="row justify-between items-center no-wrap">
                  <div class="text-caption text-weight-medium text-primary">
                    <q-icon name="local_pharmacy" size="xs" /> Bag {{ bIdx + 1 }}: {{ bag.carrier }}
                  </div>
                  <q-badge
                    :color="getRateColor(bag.rate_profile)"
                    size="xs"
                    :label="bag.rate_profile"
                  />
                </div>
                <div class="text-caption text-grey-8 q-pl-sm q-mt-xs">
                  <div v-for="ing in bag.ingredients" :key="ing.name">
                    • {{ ing.name }}
                    <span v-if="ing.dose_mg_optional">({{ ing.dose_mg_optional }}mg)</span>
                  </div>
                </div>
              </div>
            </q-card-section>

            <!-- Candidate Hint (if no detailed protocol) -->
            <q-card-section v-else-if="session.candidate_generation_hint" class="bg-blue-grey-1">
              <div class="text-caption text-blue-grey-9 italic">
                <q-icon name="lightbulb" size="xs" class="q-mr-xs" />
                Hint: {{ session.candidate_generation_hint }}
              </div>
            </q-card-section>
          </q-card>
        </q-timeline-entry>
      </q-timeline>
    </div>
  </div>
</template>

<script setup>
import { startCase } from 'lodash'
import jsPDF from 'jspdf'
import { useIVAssessmentStore } from 'src/stores/ivAssessmentStore'
import { storeToRefs } from 'pinia'

const props = defineProps({
  planDetails: {
    type: Object,
    required: true,
  },
})

const store = useIVAssessmentStore()
const { formData } = storeToRefs(store)

const formatSchedule = (desc) => {
  if (!desc) return ''
  return startCase(desc.replace(/_/g, ' '))
}

const formatPhase = (phaseId) => {
  if (!phaseId) return ''
  // phase_1_reset_4_weeks -> Phase 1: Reset (4 Weeks)
  // Simple heuristic formatting
  return startCase(phaseId.replace(/_/g, ' '))
}

const getRateColor = (rate) => {
  if (rate === 'SLOW') return 'orange'
  if (rate === 'MODERATE') return 'blue'
  return 'green'
}

const downloadPDF = () => {
  const doc = new jsPDF()
  let yPos = 20

  // Header
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text('LONG-TERM AI PROTOCOL', 14, 15)

  doc.setFontSize(18)
  doc.setTextColor(0)
  doc.setFont('helvetica', 'bold')
  const nameLines = doc.splitTextToSize(props.planDetails.name, 180)
  doc.text(nameLines, 14, 25)

  yPos = 25 + nameLines.length * 9

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(50)
  const scheduleText = `${props.planDetails.plan_duration_weeks} Weeks - ${formatSchedule(
    props.planDetails.schedule_description,
  )}`
  const scheduleLines = doc.splitTextToSize(scheduleText, 180)
  doc.text(scheduleLines, 14, yPos)

  yPos += scheduleLines.length * 5 + 10

  // Timeline Sessions
  if (props.planDetails.sessions) {
    props.planDetails.sessions.forEach((session) => {
      // Check page break
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      // Session Header
      doc.setFillColor(240, 240, 240)
      doc.rect(14, yPos - 5, 182, 12, 'F')

      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0)
      const sessionHeader = `Week ${session.week_index}: ${formatPhase(session.phase_id)}`
      const sessionHeaderLines = doc.splitTextToSize(sessionHeader, 175)
      doc.text(sessionHeaderLines, 16, yPos + 2)
      yPos += (sessionHeaderLines.length > 1 ? sessionHeaderLines.length * 6 : 2) + 10

      // Goal
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const goalText = `Goal: ${session.session_goal_summary}`
      const goalLines = doc.splitTextToSize(goalText, 180)
      doc.text(goalLines, 16, yPos)
      yPos += goalLines.length * 5 + 3

      // Protocol or Hint
      if (session.recommended_protocol_week_optional) {
        const proto = session.recommended_protocol_week_optional
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text('Recommended Protocol:', 16, yPos)
        yPos += 5

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        const protoIdText = `ID: ${proto.protocol_id}`
        const protoIdLines = doc.splitTextToSize(protoIdText, 175)
        doc.text(protoIdLines, 16, yPos)
        yPos += protoIdLines.length * 5

        if (proto.bags) {
          proto.bags.forEach((bag, bIdx) => {
            // Bag info
            const bagText = `Bag ${bIdx + 1}: ${bag.carrier} (${bag.rate_profile})`
            const bagLines = doc.splitTextToSize(bagText, 175)
            doc.text(bagLines, 16, yPos)
            yPos += bagLines.length * 5

            // Ingredients
            const ingredients = bag.ingredients
              .map(
                (ing) => `${ing.name}${ing.dose_mg_optional ? ` (${ing.dose_mg_optional}mg)` : ''}`,
              )
              .join(', ')

            const ingLines = doc.splitTextToSize(`- ${ingredients}`, 170)
            doc.text(ingLines, 20, yPos)
            yPos += ingLines.length * 4 + 2
          })
        }
      } else if (session.candidate_generation_hint) {
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(100)
        const hintLines = doc.splitTextToSize(`Hint: ${session.candidate_generation_hint}`, 180)
        doc.text(hintLines, 16, yPos)
        yPos += hintLines.length * 5
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0)
      }

      yPos += 8
    })
  }

  const patientName = formData.value?.iv_inputs?.meta?.profile?.name || ''
  const fileName = `${patientName ? patientName + ' - ' : ''}${props.planDetails.name || 'multi-session-plan'}.pdf`
  doc.save(fileName)
}
</script>

<style scoped>
.bg-gradient-primary {
  background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
}

.rounded-borders {
  border-radius: 12px;
}

.opacity-10 {
  opacity: 0.1;
}
.opacity-90 {
  opacity: 0.9;
}

.letter-spacing-1 {
  letter-spacing: 1px;
}

.border-grey {
  border: 1px solid #e0e0e0;
}

.timeline-card {
  transition: transform 0.2s;
}
.timeline-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.italic {
  font-style: italic;
}
</style>
