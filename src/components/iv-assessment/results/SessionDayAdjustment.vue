<template>
  <div class="q-pa-md max-w-7xl mx-auto wrapper w-full">
    <div class="flex justify-between items-center q-mb-lg border-b border-slate-200 q-pb-md">
      <div>
        <div class="text-h5 text-weight-bold text-slate-800 flex items-center">
          <q-icon name="psychology" color="primary" size="32px" class="q-mr-sm" />
          AI Session Day Adjustment
        </div>
        <div class="text-caption text-slate-500 q-ml-xl">
          Evaluating today's intake against the planned protocol
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-center q-pa-xl column min-h-[300px]">
      <q-spinner-grid color="primary" size="4em" />
      <div class="text-h6 text-primary q-mt-md font-medium">Analyzing Session Data</div>
      <div class="text-body2 text-slate-500 q-mt-xs text-center max-w-sm">
        Checking vital signs, symptoms, and constraints to ensure treatment safety...
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="q-pa-lg bg-red-50 rounded-lg border border-red-200 flex column items-center text-center"
    >
      <q-icon name="error_outline" color="red-8" size="48px" class="q-mb-md" />
      <div class="text-h6 text-red-9">Evaluation Failed</div>
      <div class="text-body2 text-red-7 q-mb-md">{{ error }}</div>
      <q-btn
        unelevated
        color="red-8"
        label="Retry Evaluation"
        @click="runAdjustment"
        class="rounded-md"
      />

      <!-- Skip option to bypass AI error -->
      <div class="q-mt-xl">
        <q-btn flat color="grey-6" label="Skip AI Check (Override)" @click="$emit('proceed')" />
      </div>
    </div>

    <!-- Success State -->
    <div v-else-if="adjustmentData" class="card main-card">
      <div class="q-mb-lg text-center">
        <q-chip
          :color="statusColor"
          text-color="white"
          icon="check_circle"
          size="lg"
          class="text-weight-bold text-uppercase shadow-2"
        >
          {{ formattedDecision }}
        </q-chip>
      </div>

      <div class="text-h6 q-mb-md text-slate-800">Clinical Assessment</div>

      <div class="text-body1 q-mb-lg text-slate-700 leading-relaxed">
        <strong>Reason:</strong> {{ adjustmentData.reason }}
      </div>

      <div
        v-if="adjustmentData.therapist_facing_summary"
        class="bg-slate-50 border border-slate-200 q-pa-md rounded-borders q-mb-lg text-slate-700"
      >
        <div class="flex items-center text-weight-bold q-mb-sm text-teal-9">
          <q-icon name="info" size="20px" class="q-mr-sm" />
          Clinical Summary
        </div>
        {{ adjustmentData.therapist_facing_summary }}
      </div>

      <div
        v-if="
          adjustmentData.comparison_to_original &&
          adjustmentData.comparison_to_original.what_changed &&
          adjustmentData.comparison_to_original.what_changed.length > 0
        "
        class="q-mb-lg"
      >
        <div class="flex items-center text-weight-bold text-orange-9 q-mb-sm">
          <q-icon name="warning_amber" size="20px" class="q-mr-sm" />
          Changes Recommended:
        </div>
        <ul class="q-pl-md q-my-none text-slate-700">
          <li
            v-for="(change, idx) in adjustmentData.comparison_to_original.what_changed"
            :key="idx"
            class="q-mb-xs"
          >
            {{ change }}
          </li>
        </ul>
      </div>

      <div class="flex justify-center q-mt-xl border-t border-slate-200 q-pt-md">
        <q-btn
          v-if="!isBlocked"
          color="teal-8"
          unelevated
          size="md"
          class="rounded-md"
          label="Proceed to Treatment Execution"
          icon-right="arrow_forward"
          @click="$emit('proceed')"
        />
        <div v-else class="flex flex-center column">
          <div class="text-red-8 text-weight-bold q-mb-md">
            Treatment has been blocked or deferred by AI. Please consult the doctor.
          </div>
          <q-btn
            color="red-8"
            unelevated
            outline
            label="Return to Dashboard"
            @click="$router.push('/')"
          />
          <q-btn
            flat
            color="grey-6"
            class="q-mt-md"
            label="Override Block & Proceed (Doctor Use Only)"
            @click="$emit('proceed')"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useOpenAI } from 'src/composables/useOpenAI'
import { buildSessionDayAdjustmentPrompt } from 'src/services/AIIVSessionDayAdjustmentService'

const props = defineProps({
  sessionData: {
    type: Object,
    required: true,
  },
  assessmentData: {
    type: Object,
    required: true,
  },
})

defineEmits(['proceed'])

const { runResponse } = useOpenAI()

const loading = ref(false)
const error = ref(null)
const adjustmentData = ref(null)

const formattedDecision = computed(() => {
  if (!adjustmentData.value) return ''
  return adjustmentData.value.decision.replace(/_/g, ' ')
})

const statusColor = computed(() => {
  if (!adjustmentData.value) return 'grey'
  const decision = adjustmentData.value.decision
  if (decision === 'no_change_recommended') return 'teal-8'
  if (decision === 'minor_adjustment_recommended') return 'light-blue-8'
  if (decision === 'material_adjustment_recommended') return 'orange-8'
  return 'red-8' // defer or escalate
})

const isBlocked = computed(() => {
  if (!adjustmentData.value) return true
  const decision = adjustmentData.value.decision
  return decision === 'defer_session_recommended' || decision === 'escalate_to_doctor_recommended'
})

const runAdjustment = async () => {
  loading.value = true
  error.value = null

  try {
    const ivPrepData = props.sessionData?.iv_prep_data || {}
    let parsedPrepData = typeof ivPrepData === 'string' ? JSON.parse(ivPrepData) : ivPrepData

    // Construct inputs based on AIIVSessionDayAdjustment.json structure
    const inputs = {
      previously_planned_protocol_for_today: props.sessionData?.recommended_protocol || {},
      previously_planned_protocol_dominant_axis_at_generation:
        props.sessionData?.dominant_axis_explainability?.dominant_axis || 'Unknown',
      current_session_intake_raw: parsedPrepData,
      current_session_machines_raw: {
        vitals: {
          systolic_bp_mmHg: parsedPrepData.bp_systolic,
          diastolic_bp_mmHg: parsedPrepData.bp_diastolic,
          heart_rate_bpm: parsedPrepData.hr,
          spo2_percent: parsedPrepData.spo2,
          systemic_temperature_c_optional: parsedPrepData.temperature,
        },
        perfusion_index: {
          pi: parsedPrepData.perfusion_index,
        },
      },
      current_iv_scoring_output: props.assessmentData?.results?.iv_scoring || {
        scores_public_0_100: { ASLS: 0, PCCS: 0 },
      },
      current_constraints_evaluation: props.sessionData?.constraints_evaluation || {
        status: 'allowed',
        actions: [],
      },
      session_day_adjustment_raw_optional: {
        change_detection: {
          anything_changed_since_last_visit_text: parsedPrepData.changes_since_last_visit,
          new_medications_since_last_session_present: parsedPrepData.new_medications === 'Yes',
          new_allergies_or_reactions_since_last_session_present:
            parsedPrepData.new_allergies === 'Yes',
        },
        previous_session_feedback_optional: {
          what_improved_since_last_session_text_optional: parsedPrepData.what_improved,
          what_did_not_improve_since_last_session_text_optional:
            parsedPrepData.what_did_not_improve,
        },
      },
    }

    const messages = buildSessionDayAdjustmentPrompt(inputs)

    const conversationId = props.assessmentData?.conversation_id || null

    const result = await runResponse(conversationId, messages)

    if (result && !result.error) {
      if (result.iv_session_day_adjustment_output) {
        adjustmentData.value = result.iv_session_day_adjustment_output
      } else {
        adjustmentData.value = result // Fallback if AI skips the wrapper
      }
    } else {
      throw new Error(result?.error?.message || 'Failed to generate adjustment decision.')
    }
  } catch (err) {
    console.error(err)
    error.value = err.message || 'An error occurred during evaluation.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  runAdjustment()
})
</script>

<style scoped>
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
</style>
