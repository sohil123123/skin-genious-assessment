<template>
  <div class="q-pa-md">
    <div class="text-h5 text-weight-bold q-mb-lg flex items-center">
      <q-icon name="analytics" color="primary" size="32px" class="q-mr-sm" />
      Comprehensive Assessment Results
    </div>

    <div class="row q-col-gutter-lg justify-center">
      <!-- Left Column: Patient Profile, Vitals, Skin AI -->
      <div class="col-12 col-md-5 column q-gutter-y-md">
        <!-- Patient Info -->
        <q-card flat bordered class="rounded-xl shadow-sm overflow-hidden" v-if="intake.demographics">
          <q-card-section class="bg-grey-1 py-4">
            <div class="text-subtitle1 text-weight-bold flex items-center">
              <q-icon name="person" size="20px" class="q-mr-sm text-primary" />
              Patient Profile & Goals
            </div>
          </q-card-section>
          <q-list separator class="q-pa-sm">
            <q-item>
              <q-item-section>
                <q-item-label caption>Demographics</q-item-label>
                <q-item-label class="text-body2 text-weight-medium">{{ intake.demographics?.age_years }} yrs, {{ intake.demographics?.sex }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item v-if="intake.goals_and_intent">
              <q-item-section>
                <q-item-label caption>Primary Goal</q-item-label>
                <q-item-label class="text-body2 text-weight-medium">{{ intake.goals_and_intent?.primary_goal || 'N/A' }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item v-if="intake.goals_and_intent?.secondary_goal_optional">
              <q-item-section>
                <q-item-label caption>Secondary Goal</q-item-label>
                <q-item-label class="text-body2 text-weight-medium">{{ intake.goals_and_intent?.secondary_goal_optional }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item v-if="intake.goals_and_intent?.desired_intensity_preference">
              <q-item-section>
                <q-item-label caption>Intensity Preference</q-item-label>
                <q-item-label class="text-body2 text-weight-medium">{{ intake.goals_and_intent?.desired_intensity_preference }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>

        <!-- Vitals & Machines -->
        <q-card flat bordered class="rounded-xl shadow-sm overflow-hidden" v-if="machines.vitals">
          <q-card-section class="bg-grey-1 py-4">
            <div class="text-subtitle1 text-weight-bold flex items-center">
              <q-icon name="monitor_heart" size="20px" class="q-mr-sm text-primary" />
              Vitals & Body Composition
            </div>
          </q-card-section>
          <q-card-section class="row q-col-gutter-md">
            <div class="col-6">
              <div class="text-caption text-grey-7">Blood Pressure</div>
              <div class="text-body2 text-weight-medium">{{ machines.vitals?.systolic_bp_mmHg }}/{{ machines.vitals?.diastolic_bp_mmHg }} mmHg</div>
            </div>
            <div class="col-6">
              <div class="text-caption text-grey-7">Heart Rate</div>
              <div class="text-body2 text-weight-medium">{{ machines.vitals?.heart_rate_bpm }} bpm</div>
            </div>
            <div class="col-6" v-if="machines.vitals?.spo2_percent">
              <div class="text-caption text-grey-7">SpO2</div>
              <div class="text-body2 text-weight-medium">{{ machines.vitals?.spo2_percent }}%</div>
            </div>
            <div class="col-6" v-if="machines.vitals?.systemic_temperature_c_optional">
              <div class="text-caption text-grey-7">Temperature</div>
              <div class="text-body2 text-weight-medium">{{ machines.vitals?.systemic_temperature_c_optional }}°C</div>
            </div>
            <div class="col-6" v-if="machines.body_composition?.bmi_optional">
              <div class="text-caption text-grey-7">BMI</div>
              <div class="text-body2 text-weight-medium">{{ machines.body_composition?.bmi_optional }}</div>
            </div>
            <div class="col-6" v-if="machines.body_composition?.tbw_percent">
              <div class="text-caption text-grey-7">Total Body Water</div>
              <div class="text-body2 text-weight-medium">{{ machines.body_composition?.tbw_percent }}%</div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Skin AI Summary -->
        <q-card flat bordered class="rounded-xl shadow-sm overflow-hidden" v-if="skinAi.scores_public">
          <q-card-section class="bg-grey-1 py-4">
            <div class="text-subtitle1 text-weight-bold flex items-center">
              <q-icon name="face" size="20px" class="q-mr-sm text-primary" />
              Skin AI Signals
            </div>
          </q-card-section>
          <q-card-section class="row q-col-gutter-md">
            <div class="col-6" v-for="(score, key) in skinAi.scores_public" :key="key">
              <div class="text-caption text-grey-7">{{ key }}</div>
              <div class="text-body2 text-weight-medium">{{ score }}</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- IV 8-Axes Scoring -->
      <div class="col-12 col-md-7">
        <q-card flat bordered class="rounded-xl shadow-sm overflow-hidden">
          <q-card-section class="bg-grey-1 py-4">
            <div class="text-subtitle1 text-weight-bold">Clinical Vitality Profiling (8 Axes)</div>
            <div class="text-caption text-grey-7">
              Multi-dimensional analysis of systemic health markers (Higher Score = Higher
              Burden/Need)
            </div>
          </q-card-section>

          <q-card-section class="q-pa-md">
            <div v-for="(score, axis) in processedScores" :key="axis" class="q-mb-md">
              <div class="flex justify-between items-center q-mb-xs">
                <div class="column">
                  <span class="text-weight-medium text-capitalize">{{
                    axisNames[axis] || axis
                  }}</span>
                  <span
                    v-if="whatItMeans[axis]"
                    class="text-caption text-grey-7"
                    style="
                      font-size: 0.8rem;
                      line-height: 1.2em;
                      max-width: 450px;
                      margin-top: 4px;
                    "
                  >
                    {{ whatItMeans[axis] }}
                  </span>
                </div>
                <span class="text-weight-bold" :class="getScoreColor(score)">{{ score }}%</span>
              </div>
              <q-linear-progress
                :value="score / 100"
                :color="getScoreProgressColor(score)"
                size="10px"
                rounded
                track-color="grey-3"
                class="q-mt-xs"
              />
            </div>
          </q-card-section>

          <q-card-actions align="center" class="q-pa-md q-gutter-md">
            <q-btn
              v-if="mode !== 'instant-iv'"
              color="purple"
              label="Generate Treatment Plan"
              no-caps
              icon="auto_awesome"
              size="md"
              @click="emit('handleTreatmentPlan')"
            />
            <q-btn
              color="primary"
              label="Download Wellness Analysis Report"
              no-caps
              icon="download"
              size="md"
              @click="downloadReport"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { api } from 'src/boot/axios'
import { Loading, Notify } from 'quasar'
import { useIVAssessmentStore } from 'src/stores/ivAssessmentStore'
import { storeToRefs } from 'pinia'

const store = useIVAssessmentStore()
const { formData } = storeToRefs(store)

const props = defineProps({
  ivScores: {
    type: Object,
    default: () => ({}),
  },
  skinScores: {
    type: Object,
    default: () => ({}),
  },
  initialPlanType: {
    type: String,
    default: 'single_session_option_1',
  },
  mode: {
    type: String,
    default: 'iv',
  },
})

const emit = defineEmits(['handleTreatmentPlan'])

const processedScores = computed(() => {
  if (props.ivScores?.iv_scoring_output?.scores_public_0_100) {
    return props.ivScores.iv_scoring_output.scores_public_0_100
  }
  return []
})

const intake = computed(() => props.ivScores?.session_intake_raw || {})
const machines = computed(() => props.ivScores?.session_machines_raw || {})
const skinAi = computed(() => props.ivScores?.skin_ai_raw || {})
const whatItMeans = computed(() => props.ivScores?.iv_scoring_output?.what_it_means || {})

const axisNames = {
  FENS: 'Fluid & Electrolyte Need',
  PCCS: 'Perfusion & Circulation Constraint',
  ASLS: 'Autonomic Stress & Load',
  MONS: 'Mitochondrial Output Need',
  ODS: 'Oxidative / Detox Burden',
  ILS: 'Inflammation / Immune Load',
  MSGS: 'Metabolic Stability / Glycation',
  DGS: 'Dermal Glow / Barrier Support',
}

// Higher Score = Higher Burden = Bad (Red/Negative)
// Lower Score = Lower Burden = Good (Green/Positive)
const getScoreColor = (score) => {
  if (score < 40) return 'text-positive' // Green
  if (score < 70) return 'text-warning' // Orange
  return 'text-negative' // Red
}

const getScoreProgressColor = (score) => {
  if (score < 40) return 'positive'
  if (score < 70) return 'warning'
  return 'negative'
}

const downloadReport = async () => {
  Loading.show({ message: 'Generating PDF report...' })
  try {
    const response = await api.get(`download-iv-report/skin-analysis/${formData.value.id}`, {
      responseType: 'blob',
    })

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${formData.value.name}_IV_Wellness_Analysis_Report.pdf`)
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
.rounded-xl {
  border-radius: 16px;
}
.line-height-1 {
  line-height: 1;
}

.plan-card {
  transition: all 0.3s ease;
  border-radius: 12px;
}
.plan-card:hover {
  box-shadow: 0 0 12px rgba(25, 118, 210, 0.15);
  transform: translateY(-2px);
}
.plan-card--active {
  border: 2px solid #1976d2 !important;
  background-color: #e3f2fd !important;
}
</style>
