<template>
  <q-page>
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

        <q-card flat class="q-pa-lg">
          <div class="header">
            <div>
              <div class="text-h5 text-weight-bold text-black">Treatment Preparation</div>
            </div>
          </div>

          <div class="row q-col-gutter-md q-mt-md">
            <!-- Concerns Addressed -->
            <div class="col-12 col-md-5">
              <q-card flat bordered class="rounded-lg">
                <q-card-section class="text-white" style="background: #ffeee4">
                  <div class="text-h6 text-dark">Concerns Addressed</div>
                </q-card-section>

                <q-card-section>
                  <q-item
                    v-for="(step, index) in concerns_addressed"
                    :key="index"
                    class="q-my-sm"
                    clickable
                    v-ripple
                  >
                    <q-item-section avatar top>
                      <q-icon name="task_alt" color="info" />
                    </q-item-section>

                    <q-item-section>
                      <q-item-label>{{ step.concern }}</q-item-label>
                      <q-item-label caption lines="1"
                        >Current Value: {{ step.current_value }}</q-item-label
                      >
                      <q-item-label caption lines="1"
                        >Target Value: {{ step.target_value }}</q-item-label
                      >
                    </q-item-section>
                  </q-item>
                </q-card-section>
              </q-card>
            </div>

            <!-- Preparation Checklist -->
            <div class="col-12 col-md-7">
              <q-card flat bordered class="rounded-lg">
                <q-card-section class="text-white" style="background: #f4ecf7">
                  <div class="text-h6 text-dark">Equipment & Product Checklist</div>
                </q-card-section>
                <q-card-section>
                  <div v-for="(item, index) in prepList" :key="index" class="q-pa-xs">
                    <q-checkbox
                      v-model="selected"
                      :val="item"
                      color="info"
                      size="md"
                      :label="item"
                      :class="{
                        'text-dark': selected.includes(item),
                        'text-grey-8': !selected.includes(item),
                      }"
                    />
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card>
        <div class="q-card q-card--flat no-shadow q-px-lg">
          <q-card flat>
            <q-card-section class="q-pa-md">
              <div class="text-dark q-mb-sm">{{ checkedCount }} / {{ totalItems }} Completed</div>
              <q-linear-progress
                :value="progress"
                color="info"
                track-color="grey-3"
                rounded
                size="12px"
                class="q-mb-md"
              />
              <div class="q-py-md text-center">
                <q-btn
                  label="Preparation Completed"
                  class="gredient text-white"
                  rounded
                  :disable="checkedCount == totalItems ? false : true"
                  @click="startSteps"
                />
                <q-btn flat label="Back to Plan" class="q-ml-sm" @click="backToPlan" />
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted, computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTreatmentFlowStore } from 'stores/treatmentFlow'
import { useAssessmentStore } from 'src/stores/assessmentStore'

const assessmentStore = useAssessmentStore()

const route = useRoute()
const router = useRouter()
const store = useTreatmentFlowStore()

const sessionParam = route.params.session

const sessionNumber = sessionParam
  ? Number(sessionParam)
  : (store.currentSession?.session_number ?? 1)

onMounted(async () => {
  await assessmentStore.getSingleAssessment(route.params.assessment_id)

  store.treatmentPlan = assessmentStore.assessmentData.treatment_sessions
})

const session = computed(() =>
  store.treatmentPlan ? store.treatmentPlan.treatments[sessionNumber - 1] : null,
)
const concerns_addressed = computed(() => session.value?.concerns_addressed ?? [])
const prepList = computed(() => session.value?.preparations_checklist_for_therapist ?? [])

const selected = ref([])
const totalItems = computed(() => prepList.value.length)
const checkedCount = computed(() => selected.value.length)
const progress = computed(() => checkedCount.value / totalItems.value)

function startSteps() {
  // go to first step (steps are 1-based in route)
  router.push({
    name: 'TreatmentSteps',
    params: { user_id: route.params.user_id, session: sessionNumber, step: 1 },
  })
}

function backToPlan() {
  router.push({ name: 'index', params: { user_id: route.params.user_id, step: 'step-5' } })
}
</script>
