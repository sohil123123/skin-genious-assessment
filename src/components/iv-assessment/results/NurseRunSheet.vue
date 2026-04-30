<template>
  <div class="q-pa-md max-w-7xl mx-auto wrapper">
    <!-- Component Header -->
    <div class="flex justify-between items-center q-mb-lg border-b border-slate-200 q-pb-md">
      <div>
        <div class="text-h5 text-weight-bold text-slate-800 flex items-center">
          <q-icon name="medical_services" color="teal-8" size="32px" class="q-mr-sm" />
          Nurse Run Sheet
        </div>
        <div class="text-caption text-slate-500 q-ml-xl">
          AI-Generated Treatment Execution Protocol
        </div>
      </div>
      <div class="flex gap-3 items-center">
        <!-- Session Switcher (if multi-session plan) -->
        <q-select
          v-if="availableSessions.length > 1"
          v-model="selectedSessionIndex"
          :options="sessionOptions"
          dense
          outlined
          emit-value
          map-options
          class="min-w-[150px] bg-white rounded-md"
          label="Select Session"
          color="teal-8"
        />

        <q-btn
          v-if="!loading && currentSession"
          unelevated
          outline
          color="teal-8"
          label="Regenerate"
          icon="refresh"
          @click="initiateRunSheetGeneration"
          class="rounded-md"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-center q-pa-xl column min-h-[400px]">
      <q-spinner-grid color="teal-8" size="4em" />
      <div class="text-h6 text-teal-9 q-mt-md font-medium">Generating Clinical Protocol</div>
      <div class="text-body2 text-slate-500 q-mt-xs text-center max-w-sm">
        Synthesizing patient vitals, safety constraints, and clinic SOPs into a run sheet...
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="q-pa-lg bg-red-50 rounded-lg border border-red-200 flex column items-center text-center"
    >
      <q-icon name="error_outline" color="red-8" size="48px" class="q-mb-md" />
      <div class="text-h6 text-red-9">Generation Failed</div>
      <div class="text-body2 text-red-7 q-mb-md">{{ error }}</div>
      <q-btn
        unelevated
        color="red-8"
        label="Retry Generation"
        @click="initiateRunSheetGeneration"
        class="rounded-md"
      />
    </div>

    <!-- Success State -->
    <div v-else-if="runSheetData" class="run-sheet-content">
      <div class="card main-card">
        <!-- 1. Protocol Header Card -->
        <div class="logo-row">
          <div class="logo-circle">
            <q-icon name="vaccines" size="20px" />
          </div>
          <div>
            <span class="brand-name">{{
              runSheetData.header?.display_name || 'Custom Protocol'
            }}</span>
            <div class="text-caption text-slate-500 font-mono">
              {{ runSheetData.header?.protocol_id || 'ID_UNKNOWN' }}
            </div>
          </div>
          <q-space />
          <div class="flex items-center gap-4 text-slate-600">
            <div
              class="flex items-center gap-1 bg-slate-50 border border-slate-200 px-3 py-1 rounded-md text-sm"
            >
              <q-icon name="vaccines" size="16px" color="teal-8" />
              <span class="font-medium text-slate-700"
                >{{ runSheetData.header?.bag_count || 1 }} Bag(s)</span
              >
            </div>
            <div
              class="flex items-center gap-1 bg-slate-50 border border-slate-200 px-3 py-1 rounded-md text-sm"
            >
              <q-icon name="schedule" size="16px" color="teal-8" />
              <span class="font-medium text-slate-700"
                >{{ runSheetData.header?.expected_total_duration_minutes || '--' }} min total</span
              >
            </div>
          </div>
        </div>

        <!-- Critical Flags / Alerts Area -->
        <div
          v-if="runSheetData.header?.special_flags && runSheetData.header.special_flags.length > 0"
          class="q-mb-lg bg-orange-1 q-pa-sm rounded-borders"
          style="border: 1px solid #ffe0b2"
        >
          <div class="row items-center q-mb-xs q-px-xs">
            <q-icon name="warning_amber" size="18px" class="text-orange-9 q-mr-sm" />
            <span class="text-caption text-weight-bold text-orange-9 text-uppercase tracking-wide"
              >Clinical Alerts</span
            >
          </div>
          <ul class="q-pl-lg q-my-none text-body2 text-orange-10 font-medium">
            <li v-for="(flag, idx) in runSheetData.header.special_flags" :key="idx" class="q-pb-xs">
              {{ flag }}
            </li>
          </ul>
        </div>

        <!-- Step Indicator -->
        <div class="step-indicator">
          <template v-for="(step, i) in STEPS" :key="'indicator-' + i">
            <div class="step-dot">
              <div class="dot" :class="{ active: i === currentStep, done: i < currentStep }">
                <span v-if="i < currentStep">✓</span>
                <span v-else>{{ i + 1 }}</span>
              </div>
              <div class="label" :class="{ active: i === currentStep, done: i < currentStep }">
                <span v-html="step.label.replace('\n', '<br>')"></span>
              </div>
            </div>
            <div
              v-if="i < STEPS.length - 1"
              class="step-line"
              :class="{ done: i < currentStep }"
            ></div>
          </template>
        </div>

        <!-- Step Content Wrapper -->
        <div class="step-content-wrapper min-h-[400px]">
          <transition name="fade" mode="out-in">
            <StepPreFlight
              v-if="currentStep === 0"
              :checksList="runSheetData.preflight_checks"
              v-model="checks.preflight"
            />

            <StepSetup
              v-else-if="currentStep === 1"
              :setupSteps="runSheetData.setup_steps"
              v-model:setupChecks="checks.setup"
            />

            <StepBagPrep
              v-else-if="currentStep === 2"
              :bagSteps="runSheetData.bag_preparation_steps"
              v-model:bagChecks="checks.bag"
            />

            <StepExecution
              v-else-if="currentStep === 3"
              :monitoringPlan="runSheetData.monitoring_plan"
              :adminSteps="runSheetData.administration_steps"
              v-model:adminChecks="checks.admin"
            />

            <StepPostCareOnly
              v-else-if="currentStep === 4"
              :postCareSteps="runSheetData.post_care"
              v-model:postChecks="checks.post"
            />

            <StepDocumentation
              v-else-if="currentStep === 5"
              :documentationSteps="runSheetData.documentation"
              v-model:docChecks="checks.doc"
              :signoffConditions="runSheetData.clinician_signoff_required_if"
            />
          </transition>
        </div>

        <!-- Navigation Bar -->
        <div class="nav-bar">
          <button
            class="btn btn-prev"
            @click="navigate(-1)"
            :disabled="currentStep === 0"
            :style="{ opacity: currentStep === 0 ? '0.35' : '1' }"
          >
            ← PREVIOUS
          </button>

          <button
            class="btn btn-next"
            :class="{
              'btn-finalize': currentStep === STEPS.length - 1,
              'disabled-btn': !canGoNext,
            }"
            :disabled="!canGoNext"
            @click="currentStep === STEPS.length - 1 ? finalize() : navigate(1)"
          >
            {{ currentStep === STEPS.length - 1 ? 'FINALIZE SESSION' : 'NEXT →' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="flex flex-center q-pa-xl text-slate-500 min-h-[400px]">
      <div class="text-center">
        <div class="bg-slate-50 border border-slate-200 p-6 rounded-full inline-block q-mb-md">
          <q-icon name="assignment_late" size="48px" color="slate-400" />
        </div>
        <div class="text-h6 text-slate-600 font-medium">No session data available</div>
        <div class="text-body2 text-slate-400 q-mt-sm">
          Please select a treatment plan option to generate the run sheet.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, reactive, onMounted } from 'vue'
import { useIVAssessmentStore } from 'src/stores/ivAssessmentStore'
import { storeToRefs } from 'pinia'
import { useOpenAI } from 'src/composables/useOpenAI'
import { buildRunSheetPrompt } from 'src/services/NurseRunSheetService'

// Import Step Components
import StepPreFlight from './runsheet/StepPreFlight.vue'
import StepSetup from './runsheet/StepSetup.vue'
import StepBagPrep from './runsheet/StepBagPrep.vue'
import StepExecution from './runsheet/StepExecution.vue'
import StepPostCareOnly from './runsheet/StepPostCareOnly.vue'
import StepDocumentation from './runsheet/StepDocumentation.vue'

const props = defineProps({
  treatmentSessions: {
    type: Object,
    default: null,
  },
})

// Store & Composables
const store = useIVAssessmentStore()
const { formData } = storeToRefs(store)
const { runResponse } = useOpenAI()

const emit = defineEmits(['save_data', 'finalize_session'])

// State
const loading = ref(false)
const error = ref(null)
const runSheetData = ref(null)
const selectedSessionIndex = ref(
  props.treatmentSessions?.iv_session_data?.active_session_index || 0,
)

const currentStep = ref(0)
const STEPS = [
  { label: 'Safety &\nPre-flight', short: 'Pre-flight' },
  { label: 'Setup &\nMixing', short: 'Setup' },
  { label: 'Bag\nPreparation', short: 'Bag Prep' },
  { label: 'Admin &\nMonitoring', short: 'Execution' },
  { label: 'Post-Care\nSequence', short: 'Post-Care' },
  { label: 'Required\nDocumentation', short: 'Docs' },
]

// Available Sessions
const availableSessions = computed(() => {
  return props.treatmentSessions?.iv_session_data?.all_plan_sessions || []
})

const sessionOptions = computed(() => {
  return availableSessions.value.map((session, index) => ({
    label: session.week_index ? `Week ${session.week_index}` : `Session ${index + 1}`,
    value: index,
  }))
})

// Current Session from Props (Input to AI)
const currentSession = computed(() => {
  if (availableSessions.value.length > 0) {
    return availableSessions.value[selectedSessionIndex.value]?.recommended_protocol || null
  }
  return props.treatmentSessions?.treatments?.[0] || null
})

// Checkboxes State
const checks = reactive({
  preflight: {},
  setup: {},
  admin: {},
  bag: {},
  post: {},
  doc: {},
})

const canGoNext = computed(() => {
  if (!runSheetData.value) return false

  if (currentStep.value === 0) {
    const total = runSheetData.value.preflight_checks?.length || 0
    const checked = Object.values(checks.preflight).filter(Boolean).length
    return total === 0 || checked === total
  } else if (currentStep.value === 1) {
    const totalSetup = runSheetData.value.setup_steps?.length || 0
    const checkedSetup = Object.values(checks.setup).filter(Boolean).length
    return totalSetup === 0 || checkedSetup === totalSetup
  } else if (currentStep.value === 2) {
    const totalBag = runSheetData.value.bag_preparation_steps?.length || 0
    const checkedBag = Object.values(checks.bag).filter(Boolean).length
    return totalBag === 0 || checkedBag === totalBag
  } else if (currentStep.value === 3) {
    const totalAdmin = runSheetData.value.administration_steps?.length || 0
    const checkedAdmin = Object.values(checks.admin).filter(Boolean).length
    return totalAdmin === 0 || checkedAdmin === totalAdmin
  } else if (currentStep.value === 4) {
    const totalPost = runSheetData.value.post_care?.length || 0
    const checkedPost = Object.values(checks.post).filter(Boolean).length
    return totalPost === 0 || checkedPost === totalPost
  } else if (currentStep.value === 5) {
    const totalDoc = runSheetData.value.documentation?.length || 0
    const checkedDoc = Object.values(checks.doc).filter(Boolean).length
    return totalDoc === 0 || checkedDoc === totalDoc
  }

  return true
})

// Navigation
const navigate = (dir) => {
  const newStep = currentStep.value + dir
  if (newStep >= 0 && newStep < STEPS.length) {
    currentStep.value = newStep
  }
}

const finalize = () => {
  emit('finalize_session', selectedSessionIndex.value)
}

// Generation Logic
const initiateRunSheetGeneration = async () => {
  if (!currentSession.value) return

  loading.value = true
  error.value = null
  runSheetData.value = null
  currentStep.value = 0 // Reset step to beginning

  try {
    const protocol = currentSession.value
    // Use relevant patient context from store
    const patientContext = {
      // Use existing inputs if available, else fallback
      demographics: formData.value?.iv_inputs?.meta?.profile || {},
      medical_history: formData.value?.iv_inputs?.section_1_client_questionnaire || {},
      vitals: formData.value?.iv_inputs?.section_2_machine_objective_inputs_part_1 || {},
      description: 'Patient session from IV Assessment',
    }

    // Build Prompt
    const messages = buildRunSheetPrompt(protocol, patientContext)

    // Get Conversation ID from store
    const conversationId = formData.value.conversation_id || null

    // Call AI
    const result = await runResponse(conversationId, messages, 0.2)

    // Validate output structure
    if (result && !result.error && (result.header || result.preflight_checks)) {
      runSheetData.value = result
    } else {
      // If the result isn't the run sheet JSON but maybe a wrapper or error
      if (result?.run_sheet) {
        runSheetData.value = result.run_sheet
      } else {
        // If pure text or error
        if (typeof result === 'string') {
          try {
            const parsed = JSON.parse(result)
            runSheetData.value = parsed.run_sheet || parsed
          } catch (e) {
            console.error(e)
            throw new Error('AI returned invalid JSON format.')
          }
        } else {
          throw new Error(result?.error?.message || 'Failed to generate run sheet.')
        }
      }
    }

    // Reset checks
    checks.preflight = {}
    checks.setup = {}
    checks.admin = {}
    checks.bag = {}
    checks.post = {}
    checks.doc = {}
  } catch (err) {
    console.error(err)
    error.value = 'Failed to generate run sheet. Please try again.'
  } finally {
    loading.value = false
  }
}

// Auto-generate on mount if not available
onMounted(() => {
  if (currentSession.value) {
    initiateRunSheetGeneration()
  }
})

// Watch for session changes
watch(
  () => currentSession.value,
  (newVal) => {
    if (newVal) {
      initiateRunSheetGeneration()
    }
  },
)
</script>

<style scoped lang="scss">
/* Utility Custom Classes matching the design system */
.text-slate-800 {
  color: #1e293b;
}
.text-slate-700 {
  color: #334155;
}
.text-slate-600 {
  color: #475569;
}
.text-slate-500 {
  color: #64748b;
}
.text-slate-400 {
  color: #94a3b8;
}

/* Font utilities */
.font-bold {
  font-weight: 700;
}
.font-medium {
  font-weight: 500;
}
.font-mono {
  font-family: 'Roboto Mono', monospace;
}

/* Custom UI - Clinical Styling */
.card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 32px;
  margin-bottom: 20px;
}

.main-card {
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 2px 4px -1px rgba(0, 0, 0, 0.03);
}

.logo-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}
.logo-circle {
  width: 48px;
  height: 48px;
  background: #f0fdfa;
  border: 1px solid #ccfbf1;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #115e59;
}
.brand-name {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #0f172a;
}

/* Step Indicator */
.step-indicator {
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: 40px;
  overflow-x: auto;
  padding-bottom: 4px;
}
.step-dot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 80px;
  position: relative;
}
.step-dot .dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  border: 2px solid #e2e8f0;
  color: #94a3b8;
  background: #fff;
  transition: all 0.3s ease;
  z-index: 2;
}
.step-dot .dot.active {
  background: #115e59;
  border-color: #115e59;
  color: #fff;
  box-shadow: 0 0 0 4px #ccfbf1;
}
.step-dot .dot.done {
  background: #0f766e;
  border-color: #0f766e;
  color: #fff;
}
.step-dot .label {
  font-size: 12px;
  color: #94a3b8;
  white-space: nowrap;
  text-align: center;
  transition: all 0.3s ease;
  line-height: 1.3;
}
.step-dot .label.active {
  color: #115e59;
  font-weight: 600;
}
.step-dot .label.done {
  color: #0f766e;
}
.step-line {
  flex: 1;
  height: 2px;
  background: #e2e8f0;
  min-width: 24px;
  margin-bottom: 30px; /* offset for label height */
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}
.step-line.done {
  background: #0f766e;
}

/* Navigation Bar */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 0 0;
  border-top: 1px solid #e2e8f0;
  margin-top: 32px;
}
.btn {
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}
.btn-prev {
  background: #ffffff;
  color: #475569;
  border: 1px solid #cbd5e1;
}
.btn-prev:hover:not(:disabled) {
  background: #f8fafc;
  color: #0f172a;
}
.btn-next {
  background: #115e59;
  color: #fff;
}
.btn-next:hover:not(:disabled) {
  background: #0f766e;
}
.btn-finalize {
  background: #0f172a !important;
  color: #fff;
  padding: 10px 28px;
}
.btn-finalize:hover:not(:disabled) {
  background: #1e293b !important;
}
.disabled-btn {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Print optimization */
@media print {
  .no-print,
  .nav-bar,
  .step-indicator {
    display: none !important;
  }
  .run-sheet-content {
    width: 100%;
    margin: 0;
    padding: 0;
  }
  .card {
    border: none;
    box-shadow: none;
    padding: 0;
  }
}
</style>
