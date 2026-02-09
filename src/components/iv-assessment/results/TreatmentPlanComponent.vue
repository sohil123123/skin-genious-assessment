<template>
  <div class="treatment-plan-wrapper q-pa-sm q-pa-md-lg">
    <!-- Loading / Empty State -->
    <div v-if="!planDetails" class="flex flex-center column q-py-xl text-grey-6">
      <q-icon name="medical_services" size="64px" class="q-mb-md text-grey-4" />
      <div class="text-h6 text-weight-regular">No Treatment Plan Selected</div>
      <div class="text-caption">The generated plan details will appear here.</div>
    </div>

    <div v-else class="plan-container animate-fade-in">
      <component :is="activeComponent" :planDetails="planDetails" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useIVAssessmentStore } from 'src/stores/ivAssessmentStore'
import { storeToRefs } from 'pinia'
import SingleSessionPlan from './SingleSessionPlan.vue'
import MultiSessionPlan from './MultiSessionPlan.vue'

const store = useIVAssessmentStore()
const { formData } = storeToRefs(store)

// Compute the active plan details. Supports structured container or direct object.
const planDetails = computed(() => {
  const planContainer = formData.value.iv_treatment_plan
  if (!planContainer) return null
  return planContainer.treatment_plan || planContainer
})

const activeComponent = computed(() => {
  if (!planDetails.value) return null

  if (planDetails.value.option_type === 'plan_option') {
    return MultiSessionPlan
  }

  return SingleSessionPlan
})
</script>

<style scoped>
/* Animation */
.animate-fade-in {
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
