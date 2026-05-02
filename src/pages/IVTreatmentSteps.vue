<template>
  <q-page>
    <div class="min-h-screen bg-grey-2 p-6 flex flex-center">
      <div v-if="loading" class="flex flex-center column">
        <q-spinner color="teal-8" size="3em" />
        <div class="q-mt-md text-slate-500 font-medium">Loading Session Data...</div>
      </div>
      
      <div v-else-if="!showRunSheet" class="w-full max-w-6xl bg-white rounded-2xl shadow-lg p-8">
        <SessionDayAdjustment
          v-if="currentSession && assessmentData"
          :sessionData="currentSession"
          :assessmentData="assessmentData"
          @proceed="showRunSheet = true"
        />
        <div v-else class="text-center text-red-8 q-pa-xl">
          <q-icon name="error_outline" size="48px" />
          <div class="text-h6 q-mt-md">Failed to load session data</div>
        </div>
      </div>

      <div v-else class="w-full max-w-6xl">
        <NurseRunSheet :treatmentSessions="enrichedTreatmentPlan" @finalize_session="completeSession" />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import SessionDayAdjustment from 'src/components/iv-assessment/results/SessionDayAdjustment.vue'
import NurseRunSheet from 'src/components/iv-assessment/results/NurseRunSheet.vue'
import { useAssessmentStore } from 'src/stores/assessmentStore'
import { useTreatmentFlowStore } from 'stores/treatmentFlow'

const router = useRouter()
const route = useRoute()
const assessmentStore = useAssessmentStore()
const store = useTreatmentFlowStore()

const loading = ref(true)
const showRunSheet = ref(false)

const sessionID = Number(route.params.session_id) || 1

const treatmentPlan = computed(() => store.treatmentPlan)
const assessmentData = computed(() => assessmentStore.assessmentData)

// Reconstruct the full plan with AI generated protocols which are stored in iv_selected_option
const enrichedTreatmentPlan = computed(() => {
  if (!treatmentPlan.value || !assessmentData.value?.iv_selected_option) return treatmentPlan.value

  const selected = assessmentData.value.iv_selected_option
  let all_plan_sessions = []
  
  if (selected.option_type === 'plan_option') {
    all_plan_sessions = selected.sessions || (selected.protocols && selected.protocols[0]?.sessions) || []
  } else {
    // Wrap the single protocol in a session-like object
    const protocol = selected.protocols?.[0] || selected
    all_plan_sessions = protocol ? [{ recommended_protocol: protocol }] : []
  }

  // Find active session index based on URL session_id
  let activeIndex = 0
  if (sessionID && treatmentPlan.value.treatments) {
    const idx = treatmentPlan.value.treatments.findIndex(s => s.id === sessionID)
    if (idx !== -1) activeIndex = idx
  }

  return {
    ...treatmentPlan.value,
    iv_session_data: {
      all_plan_sessions: all_plan_sessions,
      active_session_index: activeIndex
    }
  }
})

// Enrich the current session with its recommended_protocol for SessionDayAdjustment
const currentSession = computed(() => {
  const treatmentObj = treatmentPlan.value?.treatments?.find(s => s.id === sessionID)
  
  if (treatmentObj && enrichedTreatmentPlan.value?.iv_session_data?.all_plan_sessions) {
    const idx = enrichedTreatmentPlan.value.iv_session_data.active_session_index
    const aiSession = enrichedTreatmentPlan.value.iv_session_data.all_plan_sessions[idx]
    
    return {
      ...treatmentObj,
      recommended_protocol: aiSession?.recommended_protocol || aiSession,
    }
  }
  
  return treatmentObj || null
})

onMounted(async () => {
  try {
    if (route.params.assessment_id) {
      await assessmentStore.getSingleAssessment(route.params.assessment_id)
      store.treatmentPlan = assessmentStore.assessmentData.treatment_sessions
    }
  } catch (error) {
    console.error("Error loading assessment data:", error)
  } finally {
    loading.value = false
  }
})

function completeSession() {
  router.push({
    name: 'IVTreatmentComplete',
    params: {
      user_id: route.params.user_id,
      assessment_id: route.params.assessment_id,
      session_id: route.params.session_id,
      ...(route.params.appointment_id && { appointment_id: route.params.appointment_id }),
    },
  })
}
</script>

<style scoped>
.text-slate-500 {
  color: #64748b;
}
.font-medium {
  font-weight: 500;
}
</style>
