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
      <div class="row items-center justify-between q-col-gutter-md q-mb-lg">
        <div class="col-grow row items-center">
          <q-btn v-if="allOptions && allOptions.length > 1" flat round icon="arrow_back" @click="clearSelection" color="grey-7" />
          <div v-if="allOptions && allOptions.length > 1" class="text-h6 q-ml-sm text-grey-8">Back to Options</div>
        </div>

        <!-- Therapist Selector -->
        <div class="col-12 col-sm-6 col-md-4">
          <q-select
            v-model="selectedTherapistId"
            :options="therapists"
            label="Assigned Therapist"
            outlined
            dense
            rounded
            emit-value
            map-options
            options-dense
            color="amber-8"
            @update:model-value="updateTherapist"
            class="therapist-select"
            :class="{'therapist-missing': !selectedTherapistId}"
            :error="!selectedTherapistId"
            hide-bottom-space
          >
            <template v-slot:prepend>
              <q-icon name="supervised_user_circle" color="amber-8" />
            </template>
          </q-select>
        </div>
      </div>

      <component
        :is="activeComponent"
        :planDetails="activePlanDetails"
        @start-session="(idx) => $emit('start-session', idx)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useIVAssessmentStore } from 'src/stores/ivAssessmentStore'
import { storeToRefs } from 'pinia'
import { api } from 'src/boot/axios'
import { Notify } from 'quasar'
import { useRoute } from 'vue-router'
import SingleSessionPlan from './SingleSessionPlan.vue'
import MultiSessionPlan from './MultiSessionPlan.vue'
import PlanSelectionList from './PlanSelectionList.vue'

const store = useIVAssessmentStore()
const { formData } = storeToRefs(store)
const emit = defineEmits(['save_data', 'start-session'])

const route = useRoute()
const selectedOption = ref(null)
const selectedTherapistId = ref(null)
const therapists = ref([])
const hasFetchedTherapists = ref(false)

// Fetch therapists dropdown
const fetchTherapists = async (clinicId) => {
  if (!clinicId || hasFetchedTherapists.value) return
  try {
    const response = await api.get(`/get-users?role=therapist&clinic_id=${clinicId}`)
    const rawData = response.data.results || response.data || []
    therapists.value = rawData.map((t) => {
      const id = t.id || t.value
      const label =
        t.label ||
        t.name ||
        (t.first_name ? `${t.first_name} ${t.last_name || ''}`.trim() : '') ||
        `Therapist #${id}`
      return {
        value: id,
        label: label,
      }
    })
    hasFetchedTherapists.value = true
  } catch (error) {
    console.error('Error fetching therapists:', error)
  }
}

// Watch for therapist & clinic details
watch(
  () => formData.value,
  (val) => {
    if (val) {
      selectedTherapistId.value = val.therapist_id
      if (val.clinic_id) {
        fetchTherapists(val.clinic_id)
      }
    }
  },
  { deep: true, immediate: true },
)

// Update assigned therapist in the store and backend
const updateTherapist = async (val) => {
  if (!val) return
  try {
    formData.value.therapist_id = val
    await store.updateAssessment({ therapist_id: val })
    
    // Call updateTreatmentSessionId to link/update therapist on CRM immediately
    if (route.params.appointment_id) {
      await store.updateTreatmentSessionId(route.params.appointment_id)
    }

    Notify.create({
      type: 'positive',
      message: 'Therapist assigned successfully',
      timeout: 2000,
    })
  } catch (error) {
    console.error('Failed to update therapist:', error)
    Notify.create({
      type: 'negative',
      message: 'Failed to assign therapist. Please try again.',
      timeout: 3000,
    })
  }
}

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
  if (details.option_type === 'plan_option' && (details.sessions || details.protocols?.[0]?.sessions)) {
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

.therapist-select :deep(.q-field__control) {
  background-color: #fffaf4;
  transition: all 0.3s ease;
}
.therapist-select :deep(.q-field__control:hover) {
  background-color: #fff6eb;
}
.therapist-missing :deep(.q-field__control) {
  background-color: #fff0f0 !important;
  animation: pulse-red 2s infinite;
}

@keyframes pulse-red {
  0% {
    box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(244, 67, 54, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(244, 67, 54, 0);
  }
}
</style>
