<template>
  <div class="treatment-plan-wrapper q-pa-sm q-pa-md-lg">
    <!-- Loading / Empty State -->
    <div v-if="!hasData" class="flex flex-center column q-py-xl text-grey-6">
      <q-icon name="medical_services" size="64px" class="q-mb-md text-grey-4" />
      <div class="text-h6 text-weight-regular">No Treatment Plan Generated</div>
      <div class="text-caption">The generated plan details will appear here.</div>
    </div>

    <!-- Selection Mode: List Options -->
    <div v-else-if="showSelectionList" class="plan-selection animate-fade-in">
      <PlanSelectionList
        :options="allOptions"
        :selectedOption="selectedOption"
        @select="selectOption"
      />
    </div>

    <!-- Detail Mode: Show Selected Plan -->
    <div v-else class="plan-detail animate-fade-in">
      <div class="row items-center q-mb-md" v-if="allOptions && allOptions.length > 1">
        <q-btn flat round icon="arrow_back" @click="clearSelection" color="grey-7" />
        <div class="text-h6 q-ml-sm text-grey-8">Back to Options</div>
      </div>

      <component :is="activeComponent" :planDetails="activePlanDetails" />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useIVAssessmentStore } from 'src/stores/ivAssessmentStore'
import { storeToRefs } from 'pinia'
import SingleSessionPlan from './SingleSessionPlan.vue'
import MultiSessionPlan from './MultiSessionPlan.vue'
import PlanSelectionList from './PlanSelectionList.vue'

const store = useIVAssessmentStore()
const { formData } = storeToRefs(store)
const emit = defineEmits(['save_data'])

const selectedOption = ref(null)

// 1. Check if we have the new "options" structure
const allOptions = computed(() => {
  return formData.value.iv_treatment_plan?.treatment_generation_output?.options || null
})

// 2. Check if we have *any* plan data
const hasData = computed(() => {
  return !!formData.value.iv_treatment_plan
})

// 3. Fallback for old structure (single plan object)
const legacyPlanDetails = computed(() => {
  const planContainer = formData.value.iv_treatment_plan
  if (allOptions.value) return null // Use new flow
  if (!planContainer) return null
  return planContainer.treatment_plan || planContainer
})

// 4. Decide what to show
const showSelectionList = computed(() => {
  if (legacyPlanDetails.value) return false // Old structure -> show detail immediately
  if (!selectedOption.value) return true // New structure & no selection -> show list
  return false // New structure & selection -> show list is hidden, show detail
})

// 5. Get the actual plan object to display in detail view
const activePlanDetails = computed(() => {
  if (selectedOption.value) return selectedOption.value
  return legacyPlanDetails.value
})

const activeComponent = computed(() => {
  const details = activePlanDetails.value
  if (!details) return null

  // Check if it's a multi-session plan structure
  if (details.option_type === 'plan_option' && details.sessions) {
    return MultiSessionPlan
  }
  // Fallback to SingleSessionPlan for all other cases (including plan_option if flattened)
  return SingleSessionPlan
})

// Actions
function selectOption(option) {
  selectedOption.value = option

  // Persist selection
  if (formData.value.iv_treatment_plan) {
    // Just modify the local object in store.
    // Ideally we should structure "selected_option" properly in the schema.
    // For now we attach it to the iv_treatment_plan object.
    formData.value.iv_selected_option = option
    emit('save_data', ['iv_selected_option'])
  }
}

function clearSelection() {
  selectedOption.value = null
  if (formData.value.iv_treatment_plan) {
    formData.value.iv_treatment_plan.selected_option = null
    emit('save_data', ['iv_treatment_plan'])
  }
}

// Watch for store changes to restore selection
watch(
  () => formData.value.iv_treatment_plan,
  (newVal) => {
    if (newVal?.selected_option) {
      selectedOption.value = newVal.selected_option
    } else {
      // If no selection stored, but we have options, selectedOption remains null (show list)
      // If we switched to a patient/assessment with NO options but legacy plan, legacyPlanDetails handles it.
      if (!newVal?.treatment_generation_output?.options) {
        selectedOption.value = null
      }
    }
  },
  { immediate: true, deep: true },
)
</script>

<style scoped>
/* Animation */
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
