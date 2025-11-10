<template>
  <div class="min-h-screen bg-grey-2 p-6">
    <div class="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center gap-3">
          <div
            class="w-12 h-12 rounded-full border-2 border-black flex items-center justify-center"
          >
            <span class="text-2xl font-serif">A</span>
          </div>
          <span class="text-xl font-light tracking-wider">AI AESTHETICS</span>
        </div>
      </div>
      <q-card flat bordered class="q-pa-md bg-white shadow-2xl">
        <!-- Treatment Plan Selection -->
        <q-card-section>
          <div class="text-subtitle1 text-primary text-weight-medium q-mb-sm">
            Select Treatment Plan
          </div>

          <div class="row q-col-gutter-md">
            <!-- Single Session Plan -->
            <div class="col-12 col-md-6">
              <q-card
                flat
                bordered
                class="plan-card cursor-pointer"
                :class="{ 'plan-card--active': treatmentType === 'single' }"
                @click="treatmentType = 'single'"
              >
                <q-card-section class="row items-center">
                  <div class="col-auto">
                    <q-icon
                      name="event_available"
                      size="40px"
                      :color="treatmentType === 'single' ? 'primary' : 'grey-7'"
                    />
                  </div>
                  <div class="col">
                    <div class="text-subtitle1 text-weight-medium">Single Session</div>
                    <div class="text-caption text-grey-7">
                      Ideal for short-term improvement or one-time clinical procedure.
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <!-- Full Treatment Plan -->
            <div class="col-12 col-md-6">
              <q-card
                flat
                bordered
                class="plan-card cursor-pointer"
                :class="{ 'plan-card--active': treatmentType === 'multiple' }"
                @click="treatmentType = 'multiple'"
              >
                <q-card-section class="row items-center">
                  <div class="col-auto">
                    <q-icon
                      name="medical_services"
                      size="40px"
                      :color="treatmentType === 'multiple' ? 'primary' : 'grey-7'"
                    />
                  </div>
                  <div class="col">
                    <div class="text-subtitle1 text-weight-medium">Full Treatment Plan</div>
                    <div class="text-caption text-grey-7">
                      Comprehensive, multi-session approach for long-term correction.
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>

        <!-- <q-separator spaced /> -->
        <!-- Header -->
        <!-- <q-card-section>
          <div class="text-h6 text-primary text-weight-bold">
            Clinical Parameters – Deviation & Improvement Goals
          </div>
          <div class="text-body2 text-grey-7 q-mt-xs">
            {{ treatableConcernsSummary.description }}
          </div>
        </q-card-section> -->

        <!-- <q-separator spaced /> -->

        <!-- Parameters Checklist -->
        <!-- <q-card-section>
          <q-list separator>
            <q-item
              v-for="(param, index) in treatableConcernsSummary.parameters_with_abnormal_scores"
              :key="index"
              tag="label"
              class="q-py-md"
              clickable
            >
              <q-item-section avatar>
                <q-avatar color="grey-3" text-color="black">{{ index + 1 }}</q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label class="text-weight-medium text-dark text-subtitle1">
                  {{ param.parameter }}
                </q-item-label>

                <q-item-label caption class="q-mt-xs">
                  <div class="text-grey-8 q-mb-xs">
                    <span class="text-weight-medium text-negative">Current:</span>
                    {{ param.current_score }}
                  </div>
                  <div class="text-grey-8">
                    <span class="text-weight-medium text-positive">Target:</span>
                    {{ param.target_score }}
                  </div>
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section> -->

        <!-- <q-separator spaced /> -->

        <!-- Actions -->
        <q-card-actions align="between">
          <q-btn
            label="Previous"
            color="primary"
            icon="west"
            @click="emitPrevious"
            class="q-px-lg"
            unelevated
          />
          <q-btn
            label="Generate Treatment Plan"
            color="positive"
            icon="assignment"
            @click="generatePlan"
            class="q-ml-sm q-px-lg"
            unelevated
          />
        </q-card-actions>
      </q-card>
    </div>
  </div>
</template>

<script setup>
// import { Notify } from 'quasar'
import { ref } from 'vue'
import { useAssessmentStore } from 'src/stores/assessmentStore'
import { storeToRefs } from 'pinia'

const emit = defineEmits(['generate-treatment', 'previous', 'save_data'])

const store = useAssessmentStore()
const { assessmentData } = storeToRefs(store)

const props = defineProps({
  treatableConcernsSummary: {
    type: [String, Object],
    required: true,
  },
})

// const selected = ref([])
const treatmentType = ref('single')

const generatePlan = () => {
  // if (!selected.value.length) {
  //   Notify.create({
  //     type: 'negative',
  //     message: 'Please select at least one parameter to generate a treatment plan.',
  //   })
  //   return
  // }
  assessmentData.value.selected_plan_type = treatmentType.value
  emit('save_data', ['selected_plan_type'])
  emit(
    'generate-treatment',
    props.treatableConcernsSummary?.parameters_with_abnormal_scores,
    treatmentType.value,
  )
}

const emitPrevious = () => {
  emit('previous')
}
</script>

<style scoped>
.text-primary {
  color: #1976d2 !important;
}
.q-page {
  min-height: calc(100vh - 60px);
}
.q-card {
  border-radius: 12px;
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
