<template>
  <div class="q-pa-md max-w-7xl mx-auto">
    <!-- Component Header -->
    <div class="flex justify-between items-center q-mb-lg border-b border-grey-3 q-pb-md">
      <div>
        <div class="text-h5 text-weight-bold text-slate-800 flex items-center">
          <q-icon name="medical_services" color="teal-8" size="32px" class="q-mr-sm" />
          Nurse Run Sheet
        </div>
        <div class="text-caption text-grey-6 q-ml-xl">
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
          class="min-w-[150px] bg-white rounded-lg"
          label="Select Session"
          color="teal"
        />

        <q-btn
          v-if="!loading && currentSession"
          unelevated
          outline
          color="teal"
          label="Regenerate"
          icon="refresh"
          @click="initiateRunSheetGeneration"
          class="rounded-lg"
        />
        <q-btn
          unelevated
          color="grey-9"
          label="Print"
          icon="print"
          @click="printSheet"
          class="rounded-lg"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-center q-pa-xl column min-h-[400px]">
      <q-spinner-grid color="teal" size="4em" />
      <div class="text-h6 text-teal-9 q-mt-md font-medium">Generating Clinical Protocol</div>
      <div class="text-body2 text-grey-6 q-mt-xs text-center max-w-sm">
        Synthesizing patient vitals, safety constraints, and clinic SOPs into a run sheet...
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="q-pa-lg bg-red-50 rounded-xl border border-red-200 flex column items-center text-center"
    >
      <q-icon name="error_outline" color="red-8" size="48px" class="q-mb-md" />
      <div class="text-h6 text-red-9">Generation Failed</div>
      <div class="text-body2 text-red-7 q-mb-md">{{ error }}</div>
      <q-btn
        unelevated
        color="red-8"
        label="Retry Generation"
        @click="initiateRunSheetGeneration"
        class="rounded-lg"
      />
    </div>

    <!-- Success State -->
    <div v-else-if="runSheetData" class="run-sheet-content">
      <!-- 1. Protocol Header Card -->
      <q-card
        flat
        bordered
        class="rounded-xl bg-white q-mb-lg shadow-sm border-slate-200 overflow-hidden"
      >
        <div
          class="bg-slate-50 q-px-lg q-py-md border-b border-slate-200 flex justify-between items-center"
        >
          <div class="text-subtitle2 text-slate-500 uppercase tracking-wider font-bold">
            Protocol Identity
          </div>
          <div class="text-xs text-slate-400 font-mono">
            {{ runSheetData.header?.protocol_id || 'ID_UNKNOWN' }}
          </div>
        </div>
        <q-card-section class="q-px-lg q-py-lg">
          <div class="row items-start q-col-gutter-lg">
            <div class="col-12 col-md-8">
              <h1 class="text-h4 text-slate-800 font-bold leading-tight q-my-none q-mb-sm">
                {{ runSheetData.header?.display_name || 'Custom Protocol' }}
              </h1>
              <div class="flex items-center gap-4 text-slate-600">
                <div class="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full text-sm">
                  <q-icon name="vaccines" size="16px" />
                  <span class="font-medium">{{ runSheetData.header?.bag_count || 1 }} Bag(s)</span>
                </div>
                <div class="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full text-sm">
                  <q-icon name="schedule" size="16px" />
                  <span class="font-medium"
                    >{{ runSheetData.header?.expected_total_duration_minutes || '--' }} min
                    total</span
                  >
                </div>
              </div>
            </div>
          </div>
        </q-card-section>

        <!-- Critical Flags / Alerts Area -->
        <div
          v-if="runSheetData.header?.special_flags && runSheetData.header.special_flags.length > 0"
          class="q-px-lg q-pb-lg"
        >
          <q-banner
            v-for="(flag, idx) in runSheetData.header.special_flags"
            :key="idx"
            rounded
            class="bg-orange-50 text-orange-9 border border-orange-200 q-mb-sm rounded-lg"
          >
            <template v-slot:avatar>
              <q-icon name="warning" color="orange-9" />
            </template>
            <div class="text-body2 font-medium">{{ flag }}</div>
          </q-banner>
        </div>
      </q-card>

      <div class="row q-col-gutter-xl">
        <!-- 2. Left Column: Logistics & Safety -->
        <div class="col-12 col-md-5 flex column gap-6">
          <!-- Preflight Checks -->
          <section>
            <div class="flex items-center justify-between q-mb-sm">
              <div class="text-h6 text-slate-800 font-bold flex items-center">
                <q-icon name="verified_user" color="blue-grey-7" class="q-mr-sm" size="20px" />
                Safety & Pre-flight
              </div>
              <q-badge
                color="blue-grey-1"
                text-color="blue-grey-7"
                :label="runSheetData.preflight_checks?.length + ' Checks'"
              />
            </div>
            <q-card flat bordered class="rounded-xl border-slate-200 shadow-sm bg-white">
              <q-list separator>
                <q-item
                  v-for="(check, idx) in runSheetData.preflight_checks"
                  :key="idx"
                  tag="label"
                  v-ripple
                  class="q-py-md hover:bg-slate-50 transition-colors"
                  :class="{ 'bg-blue-grey-50': checks.preflight[idx] }"
                >
                  <q-item-section avatar top>
                    <q-checkbox v-model="checks.preflight[idx]" color="blue-grey" size="md" />
                  </q-item-section>
                  <q-item-section>
                    <div
                      class="text-body2 text-slate-700"
                      :class="{ 'text-strike text-slate-400': checks.preflight[idx] }"
                    >
                      {{ check }}
                    </div>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card>
          </section>

          <!-- Setup Steps -->
          <section>
            <div class="flex items-center justify-between q-mb-sm">
              <div class="text-h6 text-slate-800 font-bold flex items-center">
                <q-icon name="science" color="purple-7" class="q-mr-sm" size="20px" />
                Setup & Mixing
              </div>
            </div>
            <q-card flat bordered class="rounded-xl border-slate-200 shadow-sm bg-white">
              <q-list separator>
                <q-item
                  v-for="(step, idx) in runSheetData.setup_steps"
                  :key="idx"
                  tag="label"
                  v-ripple
                  class="q-py-md hover:bg-slate-50 transition-colors"
                  :class="{ 'bg-purple-50': checks.setup[idx] }"
                >
                  <q-item-section avatar top>
                    <q-checkbox v-model="checks.setup[idx]" color="purple" size="md" />
                  </q-item-section>
                  <q-item-section>
                    <div
                      class="text-body2 text-slate-700"
                      :class="{ 'text-strike text-slate-400': checks.setup[idx] }"
                    >
                      {{ step }}
                    </div>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card>
          </section>

          <!-- Monitoring Plan -->
          <section>
            <div class="flex items-center justify-between q-mb-sm">
              <div class="text-h6 text-slate-800 font-bold flex items-center">
                <q-icon name="monitor_heart" color="amber-9" class="q-mr-sm" size="20px" />
                Monitoring Strategy
              </div>
            </div>
            <q-card flat bordered class="rounded-xl border-amber-200 bg-amber-50">
              <q-card-section>
                <div class="q-mb-md">
                  <div class="text-xs font-bold text-amber-800 uppercase tracking-widest q-mb-xs">
                    Baseline Vitals
                  </div>
                  <div
                    class="text-body2 text-slate-900 bg-white p-2 rounded border border-amber-100 shadow-sm"
                  >
                    {{
                      runSheetData.monitoring_plan?.baseline_measurements?.join(', ') ||
                      'Standard Standard (BP, HR, SpO2)'
                    }}
                  </div>
                </div>

                <div class="q-mb-md">
                  <div class="text-xs font-bold text-amber-800 uppercase tracking-widest q-mb-xs">
                    During Infusion
                  </div>
                  <div class="bg-white p-3 rounded border border-amber-100 shadow-sm">
                    <div
                      v-for="(check, i) in runSheetData.monitoring_plan?.during_infusion_checks"
                      :key="i"
                      class="flex items-start q-mb-xs last:mb-0"
                    >
                      <q-icon name="check" size="16px" class="q-mr-xs text-amber-600 q-mt-xs" />
                      <span class="text-sm text-slate-800">{{ check }}</span>
                    </div>
                  </div>
                </div>

                <div v-if="runSheetData.monitoring_plan?.stop_rules?.length">
                  <div
                    class="text-xs font-bold text-red-800 uppercase tracking-widest q-mb-xs flex items-center"
                  >
                    <q-icon name="block" class="q-mr-xs" /> Stop Rules
                  </div>
                  <div
                    class="bg-red-50 p-3 rounded border border-red-100 text-red-900 text-sm font-medium"
                  >
                    {{ runSheetData.monitoring_plan.stop_rules.join(' • ') }}
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </section>
        </div>

        <!-- 3. Right Column: Execution Timeline -->
        <div class="col-12 col-md-7">
          <!-- Bag Preparation Steps -->
          <section v-if="runSheetData.bag_preparation_steps?.length">
            <div class="flex items-center justify-between q-mb-sm">
              <div class="text-h6 text-slate-800 font-bold flex items-center">
                <q-icon name="local_pharmacy" color="teal-7" class="q-mr-sm" size="20px" />
                Bag Preparation
              </div>
              <q-badge
                color="teal-1"
                text-color="teal-8"
                :label="runSheetData.bag_preparation_steps.length + ' Steps'"
              />
            </div>
            <q-card flat bordered class="rounded-xl border-slate-200 shadow-sm bg-white">
              <q-list separator>
                <q-item
                  v-for="(step, idx) in runSheetData.bag_preparation_steps"
                  :key="'bag' + idx"
                  tag="label"
                  v-ripple
                  class="q-py-md hover:bg-slate-50 transition-colors"
                  :class="{ 'bg-teal-50': checks.bag[idx] }"
                >
                  <q-item-section avatar top>
                    <q-checkbox v-model="checks.bag[idx]" color="teal" size="md" />
                  </q-item-section>
                  <q-item-section>
                    <div
                      class="text-body2 text-slate-700"
                      :class="{ 'text-strike text-slate-400': checks.bag[idx] }"
                    >
                      {{ step }}
                    </div>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card>
          </section>

          <div class="flex items-center justify-between q-mb-lg">
            <div class="text-h6 text-slate-800 font-bold flex items-center">
              <q-icon name="play_circle_filled" color="teal-7" class="q-mr-sm" size="24px" />
              Administration Timeline
            </div>
          </div>

          <div class="administration-timeline relative q-pl-sm">
            <!-- Vertical Line -->
            <div class="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-200 rounded"></div>

            <!-- Steps -->
            <div
              v-for="(step, idx) in runSheetData.administration_steps"
              :key="idx"
              class="relative q-mb-lg pl-12 group"
            >
              <!-- Number Bubble -->
              <div
                class="absolute left-0 top-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold z-10 shadow-sm transition-colors text-sm"
                :class="
                  checks.admin[idx]
                    ? 'bg-teal-600 border-teal-600 text-white'
                    : 'bg-white border-teal-600 text-teal-700'
                "
              >
                <q-icon v-if="checks.admin[idx]" name="check" size="14px" />
                <span v-else>{{ idx + 1 }}</span>
              </div>

              <!-- Content Card -->
              <q-card
                flat
                bordered
                class="rounded-xl border-slate-200 shadow-sm group-hover:shadow-md transition-all cursor-pointer"
                :class="{ 'bg-teal-50 border-teal-200': checks.admin[idx] }"
                @click="checks.admin[idx] = !checks.admin[idx]"
              >
                <q-card-section class="q-pa-md flex items-start gap-4">
                  <div class="flex-grow">
                    <div
                      class="text-body1 text-slate-800 leading-relaxed"
                      :class="{ 'text-slate-500': checks.admin[idx] }"
                    >
                      {{ step }}
                    </div>
                  </div>
                  <q-checkbox
                    v-model="checks.admin[idx]"
                    color="teal"
                    size="sm"
                    class="no-pointer-events"
                  />
                </q-card-section>
              </q-card>
            </div>
          </div>
        </div>
      </div>

      <div class="row q-col-gutter-md">
        <!-- Post Care Section -->
        <div class="q-mt-xl q-pl-sm">
          <div class="text-h6 text-slate-800 font-bold flex items-center q-mb-md">
            <q-icon name="logout" color="indigo-6" class="q-mr-sm" size="24px" />
            Post-Care Sequence
          </div>

          <q-card flat bordered class="rounded-xl border-indigo-100 bg-indigo-50 overflow-hidden">
            <q-list separator>
              <q-item
                v-for="(step, idx) in runSheetData.post_care"
                :key="'pc' + idx"
                tag="label"
                v-ripple
                class="q-py-md hover:bg-indigo-100 transition-colors"
              >
                <q-item-section avatar>
                  <q-checkbox v-model="checks.post[idx]" color="indigo" size="sm" />
                </q-item-section>
                <q-item-section>
                  <div class="text-body2 text-indigo-900">{{ step }}</div>
                </q-item-section>
              </q-item>

              <q-separator color="indigo-200" />

              <div
                class="bg-indigo-100 q-px-md q-py-sm text-xs font-bold text-indigo-800 uppercase tracking-widest flex items-center"
              >
                <q-icon name="edit_document" class="q-mr-xs" /> Required Documentation
              </div>

              <q-item
                v-for="(doc, idx) in runSheetData.documentation"
                :key="'doc' + idx"
                tag="label"
                v-ripple
                class="q-py-sm hover:bg-indigo-100 transition-colors"
              >
                <q-item-section avatar>
                  <q-checkbox v-model="checks.doc[idx]" color="indigo-8" size="sm" />
                </q-item-section>
                <q-item-section>
                  <div class="text-sm text-slate-700">{{ doc }}</div>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card>
        </div>

        <!-- Conditional Signoff -->
        <div v-if="runSheetData.clinician_signoff_required_if?.length" class="q-mt-xl">
          <div class="rounded-xl border border-orange-200 bg-orange-50 p-4 flex items-start gap-4">
            <div class="bg-white p-2 rounded-full shadow-sm text-orange-600">
              <q-icon name="notification_important" size="24px" />
            </div>
            <div>
              <div class="text-subtitle2 font-bold text-orange-900 q-mb-xs">
                Clinician Sign-off Required If:
              </div>
              <ul class="q-pl-md q-my-none text-sm text-orange-900 leading-relaxed">
                <li v-for="(cond, i) in runSheetData.clinician_signoff_required_if" :key="i">
                  {{ cond }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="flex flex-center q-pa-xl text-grey-6 min-h-[400px]">
      <div class="text-center">
        <div class="bg-slate-100 p-6 rounded-full inline-block q-mb-md">
          <q-icon name="assignment_late" size="48px" color="slate-400" />
        </div>
        <div class="text-h6 text-slate-600">No session data available</div>
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

// State
const loading = ref(false)
const error = ref(null)
const runSheetData = ref(null)
const selectedSessionIndex = ref(
  props.treatmentSessions?.iv_session_data?.active_session_index || 0,
)

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

// Generation Logic
const initiateRunSheetGeneration = async () => {
  if (!currentSession.value) return

  loading.value = true
  error.value = null
  runSheetData.value = null

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
    const conversationId = formData.value.conversation_id

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

const printSheet = () => {
  window.print()
}
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
.bg-slate-50 {
  background-color: #f8fafc;
}
.bg-slate-100 {
  background-color: #f1f5f9;
}
.border-slate-200 {
  border-color: #e2e8f0;
}

.rounded-xl {
  border-radius: 12px;
}
.rounded-lg {
  border-radius: 8px;
}
.shadow-sm {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

/* Timeline adjustments */
.pl-12 {
  padding-left: 3rem;
}
.left-4 {
  left: 1rem;
}
.top-4 {
  top: 1rem;
}
.bottom-4 {
  bottom: 1rem;
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
.tracking-wider {
  letter-spacing: 0.05em;
}
.tracking-widest {
  letter-spacing: 0.1em;
}
.leading-tight {
  line-height: 1.25;
}
.leading-relaxed {
  line-height: 1.625;
}

/* Transitions */
.transition-all {
  transition: all 0.2s ease-in-out;
}
.transition-colors {
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.no-pointer-events {
  pointer-events: none;
}
.cursor-pointer {
  cursor: pointer;
}

/* Print optimization */
@media print {
  .no-print {
    display: none !important;
  }
  .run-sheet-content {
    width: 100%;
    margin: 0;
    padding: 0;
  }
  .q-page,
  .q-layout {
    min-height: auto !important;
  }
}
</style>
