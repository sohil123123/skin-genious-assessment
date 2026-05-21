<template>
  <!-- Top Navigation Buttons -->
  <div class="flex justify-between q-mb-md">
    <q-btn color="black" label="Previous" @click="$emit('previous')" />
    <q-btn color="positive" label="Next" @click="postAssessment" />
  </div>

  <q-card v-if="assessmentData?.name" flat bordered class="q-mb-md">
    <q-card-section class="bg-grey-1 q-py-sm q-px-md flex items-center justify-between">
      <div class="flex items-center gap-2">
        <q-icon name="person" size="24px" color="primary" />
        <span class="text-subtitle1 text-weight-medium text-dark">
          Client: <strong class="text-black">{{ assessmentData.name }}</strong>
        </span>
      </div>
      <div v-if="assessmentData?.age || assessmentData?.gender" class="text-caption text-grey-7">
        {{ assessmentData?.gender ? assessmentData.gender + ', ' : ''
        }}{{ assessmentData?.age ? assessmentData.age + ' years' : '' }}
      </div>
    </q-card-section>
  </q-card>

  <div v-if="treatmentPlan">
    <!-- Selected Treatment Plan -->
    <SelectedPlan @download-pdf="exportToPDF" />

    <!-- Daily Home Care Routine (if generated) -->
    <div v-for="session in treatmentPlan?.treatments" :key="session.id" class="q-mb-md">
      <DailyHomeCareRoutine
        v-if="hasDailyRoutine(session)"
        :routine="session.daily_home_care_routine"
        :show-generate="false"
        :show-download="true"
        :assessment-id="assessmentData.id"
        :patient-name="assessmentData.name"
        :session-id="session.id"
        :session-number="session.session_number"
        :title="`Daily Home Care Routine - Session ${session.session_number}`"
      />
    </div>

    <!-- Recommended Treatment Plan -->
    <!-- <RecommendedFullPlan :treatmentPlan="recommendedFullPlan" /> -->

    <div>
      <q-input
        v-model="assessmentData.therapist_notes"
        type="textarea"
        label="Notes"
        outlined
        clearable
        :debounce="2000"
        @update:model-value="saveData(['therapist_notes'])"
      />
    </div>

    <div class="flex justify-between q-mt-lg">
      <q-btn
        label="Export Client Treatment Plan To PDF"
        icon="get_app"
        rounded
        no-caps
        @click="exportToPDF"
        title="Export Client Treatment Plan to PDF"
        color="positive"
      />
      <q-btn
        label="Generate Post Assessment"
        rounded
        no-caps
        class="btn-custom"
        @click="postAssessment"
      />
    </div>
  </div>

  <div v-else class="flex justify-center q-mt-lg">
    <h6>Please Go Back And Generate Treatment Plan To View Details.</h6>
  </div>
</template>

<script setup>
import { watch, ref } from 'vue'
import { api } from 'src/boot/axios'
import { storeToRefs } from 'pinia'
import SelectedPlan from 'src/components/assessment/SelectedPlan.vue'
import DailyHomeCareRoutine from 'src/components/assessment/DailyHomeCareRoutine.vue'
// import RecommendedFullPlan from 'src/components/assessment/RecommendedFullPlan.vue'
import { useAssessmentStore } from 'src/stores/assessmentStore'
import { Loading, Notify } from 'quasar'

// const $q = useQuasar()

const store = useAssessmentStore()
const { assessmentData } = storeToRefs(store)

const emit = defineEmits(['previous', 'save_data', 'post_assessment'])

const treatmentPlan = ref(null)

watch(
  () => assessmentData.value,
  (val) => {
    if (val) {
      treatmentPlan.value = val.treatment_sessions
    }
  },
  { immediate: true, deep: true },
)

function saveData(field) {
  emit('save_data', field)
}

function postAssessment() {
  emit('post_assessment')
}

const exportToPDF = async () => {
  Loading.show({ message: 'Generating PDF report...' })
  try {
    const response = await api.get(
      `download-facial-report/treatment-plan/${assessmentData.value.id}`,
      {
        responseType: 'blob',
      },
    )

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${assessmentData.value.name}_treatment_plan.pdf`)
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

function hasDailyRoutine(session) {
  const routine = session?.daily_home_care_routine
  if (!routine) return false

  let parsed = routine
  if (typeof routine === 'string') {
    try {
      parsed = JSON.parse(routine)
    } catch {
      return false
    }
  }

  return parsed?.morning?.length > 0 || parsed?.evening?.length > 0
}
</script>
