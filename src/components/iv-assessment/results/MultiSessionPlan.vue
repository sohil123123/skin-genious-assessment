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
            {{ planDetails.protocols?.[0]?.plan_duration_weeks || planDetails.plan_duration_weeks }}
            Weeks
          </q-badge>
          <span class="text-blue-1 opacity-90 flex items-center">
            <q-icon name="schedule" size="16px" class="q-mr-xs" />
            {{
              formatSchedule(
                planDetails.protocols?.[0]?.schedule_description ||
                  planDetails.schedule_description,
              )
            }}
          </span>
          <q-btn
            outline
            label="Download Report"
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

    <!-- Safety & Constraints Warning -->
    <div v-if="hasConstraints" class="constraint-section q-mb-lg">
      <q-card bordered class="shadow-sm rounded-borders border-warning bg-warning-light">
        <q-card-section class="q-py-sm bg-warning-subtle text-warning-dark border-b-warning">
          <div class="flex items-center">
            <q-icon name="warning_amber" size="20px" class="q-mr-sm" />
            <div class="text-subtitle2 text-weight-bold">Clinical Constraints & Cautions</div>
          </div>
        </q-card-section>
        <q-card-section
          class="q-pa-sm text-warning-darker text-caption scroll"
          style="max-height: 300px"
        >
          <!-- Messages -->
          <div v-if="planDetails.constraint_report?.messages?.length" class="q-mb-sm">
            <div class="text-weight-bold q-mb-xs opacity-100">Analysis Details</div>
            <ul class="q-pl-md q-mt-none q-mb-none text-body2">
              <li
                v-for="(msg, i) in planDetails.constraint_report.messages"
                :key="i"
                class="q-mb-xs"
              >
                {{ msg }}
              </li>
            </ul>
          </div>
          <!-- Actions -->
          <div v-if="planDetails.constraint_report?.actions?.length">
            <div class="text-weight-bold q-mb-xs opacity-100">Required Actions</div>
            <ul class="q-pl-md q-mt-none q-mb-none text-body2">
              <li
                v-for="(act, i) in planDetails.constraint_report.actions"
                :key="i"
                class="q-mb-xs"
              >
                {{ act }}
              </li>
            </ul>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Timeline -->
    <div class="q-px-sm">
      <q-timeline color="indigo" layout="comfortable">
        <q-timeline-entry
          v-for="(session, index) in planDetails.protocols?.[0]?.sessions || planDetails.sessions"
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
              v-if="session.recommended_protocol || session.candidate_generation_hint"
            />

            <!-- Detailed Protocol (if available) -->
            <q-card-section v-if="session.recommended_protocol" class="bg-grey-1">
              <div class="text-caption text-weight-bold text-grey-7 q-mb-xs text-uppercase">
                Recommended Protocol
              </div>

              <!-- Protocol ID -->
              <div class="text-caption text-grey-6 q-mb-sm">
                ID: {{ session.recommended_protocol.protocol_id }}
              </div>

              <!-- Hero Ingredients -->
              <div
                class="flex q-gutter-xs q-mb-sm"
                v-if="session.recommended_protocol.hero_ingredients"
              >
                <q-badge
                  v-for="hero in session.recommended_protocol.hero_ingredients"
                  :key="hero"
                  outline
                  class="gredient"
                >
                  <q-icon name="star" size="10px" class="q-mr-xs" /> {{ hero }}
                </q-badge>
              </div>

              <!-- Bag Details Preview -->
              <div
                v-for="(bag, bIdx) in session.recommended_protocol.bags"
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

            <!-- Actions -->
            <q-card-actions align="right" class="q-px-md q-pb-md q-pt-none bg-white">
              <q-btn
                unelevated
                color="teal"
                text-color="white"
                icon-right="play_arrow"
                label="Start Session"
                @click="$emit('start-session', index)"
              />
            </q-card-actions>
          </q-card>
        </q-timeline-entry>
      </q-timeline>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { startCase } from 'lodash'
import { api } from 'src/boot/axios'
import { useIVAssessmentStore } from 'src/stores/ivAssessmentStore'
import { storeToRefs } from 'pinia'
import { Loading, Notify } from 'quasar'

const store = useIVAssessmentStore()
const { formData } = storeToRefs(store)

const props = defineProps({
  planDetails: {
    type: Object,
    required: true,
  },
})

const hasConstraints = computed(() => {
  const report = props.planDetails?.constraint_report
  if (!report) return false
  return (
    report.status !== 'allowed' ||
    (report.messages && report.messages.length > 0) ||
    (report.actions && report.actions.length > 0)
  )
})

defineEmits(['start-session'])

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

const downloadPDF = async () => {
  Loading.show({ message: 'Generating PDF report...' })
  try {
    const response = await api.get(`download-iv-report/program-roadmap/${formData.value.id}`, {
      responseType: 'blob',
    })

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${formData.value.name}_IV_Program_Roadmap.pdf`)
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

/* Constraint Colors - Compact & Readable */
.bg-warning-light {
  background-color: #fff8e1; /* Very light amber */
}
.bg-warning-subtle {
  background-color: #ffecb3; /* Slightly darker header */
}
.text-warning-dark {
  color: #5d4037; /* Darker brown for text */
}
.text-warning-darker {
  color: #3e2723; /* Even Darker brown for text */
}
.border-warning {
  border: 1px solid #ffca28;
}
.border-b-warning {
  border-bottom: 1px solid #ffca28;
}
</style>
