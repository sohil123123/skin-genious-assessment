<template>
  <q-card class="my-card" flat bordered>
    <q-card-section v-if="assessmentData?.name" class="bg-grey-1 q-py-sm q-px-md flex items-center justify-between">
      <div class="flex items-center gap-2">
        <q-icon name="person" size="24px" color="primary" />
        <span class="text-subtitle1 text-weight-medium text-dark">
          Client: <strong class="text-black">{{ assessmentData.name }}</strong>
        </span>
      </div>
      <div v-if="assessmentData?.age || assessmentData?.gender" class="text-caption text-grey-7">
        {{ assessmentData?.gender ? assessmentData.gender + ', ' : '' }}{{ assessmentData?.age ? assessmentData.age + ' years' : '' }}
      </div>
    </q-card-section>
    
    <q-separator v-if="assessmentData?.name" />

    <q-card-section horizontal>
      <q-card-section>
        <div class="text-h6 text-primary text-weight-bold">
          Clinical Parameters – Deviation & Improvement Goals
        </div>
        <div class="text-body2 text-grey-7 q-mt-xs">
          {{ treatableConcernsSummary?.description }}
        </div>
        <q-list separator>
          <q-item
            v-for="(param, index) in treatableConcernsSummary?.parameters_with_abnormal_scores"
            :key="index"
            tag="label"
            class="q-py-md"
            clickable
            @click="addPrimaryConcern(index)"
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
                  {{ param.target_single_session_score }}
                </div>
              </q-item-label>
            </q-item-section>

            <q-item-section side top>
              <q-chip
                v-if="param.is_primary_concern"
                color="positive"
                text-color="white"
                label="Primary"
                icon="check"
                clickable
                dense
              />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-separator vertical />

      <!-- Treatment Plan Selection -->
      <q-card-section class="col-5">
        <div class="text-h6 text-primary text-weight-bold q-mb-lg">Select Treatment Plan</div>

        <div class="row q-col-gutter-md">
          <!-- Single Session Plan -->
          <div class="col-12">
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

          <!-- Express Session Plan -->
          <div class="col-12">
            <q-card
              flat
              bordered
              class="plan-card cursor-pointer"
              :class="{ 'plan-card--active': treatmentType === 'express' }"
              @click="treatmentType = 'express'"
            >
              <q-card-section class="row items-center">
                <div class="col-auto">
                  <q-icon
                    name="flash_on"
                    size="40px"
                    :color="treatmentType === 'express' ? 'primary' : 'grey-7'"
                  />
                </div>
                <div class="col">
                  <div class="text-subtitle1 text-weight-medium">Express Session</div>
                  <div class="text-caption text-grey-7">
                    Ideal for quick boost and immediate results.
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Full Treatment Plan -->
          <div class="col-12">
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
          <div class="col-12 text-center">
            <q-btn
              label="Generate Treatment Plan"
              color="positive"
              icon="assignment"
              @click="generatePlan"
              class="q-ml-sm q-px-lg"
              unelevated
            />
          </div>
        </div>
      </q-card-section>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useAssessmentStore } from 'src/stores/assessmentStore'
import { storeToRefs } from 'pinia'
import { Notify } from 'quasar'

const emit = defineEmits(['generate-treatment', 'previous', 'save_data'])

const store = useAssessmentStore()
const { assessmentData } = storeToRefs(store)

const treatmentType = ref('single')
const treatableConcernsSummary = ref(null)

watch(
  () => assessmentData.value,
  (val) => {
    if (val) {
      treatableConcernsSummary.value = val.parameters_with_abnormal_scores
      treatmentType.value = val.selected_plan_type
    }
  },
  { immediate: true, deep: true },
)

const generatePlan = () => {
  if (!treatmentType.value) {
    Notify.create({
      type: 'negative',
      message: 'Please select a treatment plan type',
    })
    return
  }
  assessmentData.value.selected_plan_type = treatmentType.value
  emit('save_data', ['selected_plan_type'])
  emit(
    'generate-treatment',
    assessmentData.value.parameters_with_abnormal_scores,
    assessmentData.value.selected_plan_type,
  )
}

function addPrimaryConcern(index) {
  assessmentData.value.parameters_with_abnormal_scores.parameters_with_abnormal_scores[
    index
  ].is_primary_concern =
    !assessmentData.value.parameters_with_abnormal_scores.parameters_with_abnormal_scores[index]
      .is_primary_concern
  emit('save_data', ['parameters_with_abnormal_scores'])
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
