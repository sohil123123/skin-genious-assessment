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
      <!-- Session Navigation -->
      <q-card flat class="professional-card shadow-2 q-mb-md">
        <q-tabs
          v-model="currentSession"
          align="left"
          active-color="primary"
          indicator-color="primary"
          class="text-teal"
        >
          <q-tab
            v-for="session in treatmentPlan.treatments"
            :key="session.session_number"
            :name="session.session_number"
            :label="`Session ${session.session_number}`"
          />
        </q-tabs>
      </q-card>

      <!-- Current Session Display -->
      <div v-if="currentSessionData">
        <!-- Session Header -->
        <q-card class="professional-card shadow-2 q-mb-md">
          <q-card-section class="bg-primary text-white">
            <div class="row items-center">
              <div class="col">
                <div class="text-h5">{{ currentSessionData.title }}</div>
                <div class="text-subtitle1">
                  Week {{ currentSessionData.week }} • {{ currentSessionData.treatment_time }}
                </div>
              </div>
              <div class="col-auto">
                <q-chip class="gredient text-white text-h6">
                  Session {{ currentSessionData.session_number }}
                </q-chip>
                <q-btn
                  color="positive"
                  icon="picture_as_pdf"
                  label="Export to PDF"
                  @click="exportToPDF"
                  class="gredient"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>

        <div class="row q-col-gutter-md">
          <!-- Left Column - Preparation & Concerns -->
          <div class="col-12 col-md-4">
            <!-- Preparation Checklist -->
            <q-card class="q-mb-md">
              <q-card-section>
                <div class="text-h6 text-primary q-mb-md">
                  <q-icon name="checklist" class="q-mr-sm" />
                  Preparation Checklist
                  <q-badge
                    v-if="getPreparationProgress(currentSessionData.session_number) > 0"
                    color="positive"
                    class="q-ml-sm"
                  >
                    {{
                      Math.round(getPreparationProgress(currentSessionData.session_number) * 100)
                    }}%
                  </q-badge>
                </div>
                <q-list bordered separator>
                  <q-item
                    v-for="(
                      preparation, index
                    ) in currentSessionData.preparations_checklist_for_therapist"
                    :key="index"
                  >
                    <q-item-section>
                      <q-item-label>{{ preparation }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-checkbox
                        :model-value="
                          getPreparationStatus(currentSessionData.session_number, index)
                        "
                        @update:model-value="
                          (val) =>
                            setPreparationStatus(currentSessionData.session_number, index, val)
                        "
                        color="positive"
                      />
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
            </q-card>

            <!-- Concerns Addressed -->
            <q-card class="professional-card shadow-2">
              <q-card-section>
                <div class="text-h6 text-primary q-mb-md">
                  <q-icon name="monitor_heart" class="q-mr-sm" />
                  Treatment Goals
                  <q-badge color="orange" class="q-ml-sm">
                    {{ getConcernsProgress(currentSessionData.session_number) }}/{{
                      currentSessionData.concerns_addressed.length
                    }}
                  </q-badge>
                </div>

                <div class="q-gutter-y-md">
                  <div
                    v-for="(concern, index) in currentSessionData.concerns_addressed"
                    :key="index"
                    class="concern-item q-pa-sm rounded-borders"
                    :class="
                      getConcernCompletion(currentSessionData.session_number, index)
                        ? 'bg-green-1'
                        : 'bg-grey-1'
                    "
                  >
                    <div class="row items-center q-mb-xs">
                      <div class="col">
                        <div class="text-weight-medium text-primary">{{ concern.concern }}</div>
                      </div>
                      <div class="col-auto">
                        <q-badge
                          :color="
                            getConcernStatusColor(concern.current_value, concern.target_value)
                          "
                          :label="getConcernStatus(concern.current_value, concern.target_value)"
                        />
                      </div>
                    </div>

                    <div class="row items-center q-mb-sm">
                      <div class="col-5">
                        <div class="text-caption text-grey-7">Current</div>
                        <div class="text-weight-medium">{{ concern.current_value }}</div>
                      </div>
                      <div class="col-2 text-center">
                        <q-icon name="arrow_forward" color="primary" />
                      </div>
                      <div class="col-5">
                        <div class="text-caption text-grey-7">Target</div>
                        <div class="text-weight-bold text-positive">
                          {{ concern.target_value }}
                        </div>
                      </div>
                    </div>

                    <div class="row items-center justify-end">
                      <!-- <div class="col">
                          <q-linear-progress
                            :value="getConcernProgress(concern.current_value, concern.target_value)"
                            :color="
                              getConcernProgressColor(concern.current_value, concern.target_value)
                            "
                            size="8px"
                            class="q-mb-xs"
                          />
                          <div class="text-caption text-grey-7 text-center">
                            {{
                              getConcernProgressText(concern.current_value, concern.target_value)
                            }}
                          </div>
                        </div> -->
                      <div class="col-auto q-pl-sm">
                        <q-checkbox
                          :model-value="
                            getConcernCompletion(currentSessionData.session_number, index)
                          "
                          @update:model-value="
                            (val) =>
                              setConcernCompletion(currentSessionData.session_number, index, val)
                          "
                          color="positive"
                          dense
                          label="Mark as addressed"
                        >
                          <q-tooltip>Mark as addressed</q-tooltip>
                        </q-checkbox>
                      </div>
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Right Column - Treatment Steps -->
          <div class="col-12 col-md-8">
            <q-card class="professional-card shadow-2">
              <q-card-section>
                <div class="text-h6 text-primary q-mb-md">
                  <q-icon name="list_alt" class="q-mr-sm" />
                  Treatment Steps
                  <q-badge
                    v-if="getSessionProgress(currentSessionData.session_number) > 0"
                    color="primary"
                    class="q-ml-sm"
                  >
                    {{ Math.round(getSessionProgress(currentSessionData.session_number) * 100) }}%
                  </q-badge>
                </div>

                <q-timeline color="primary">
                  <q-timeline-entry
                    v-for="step in currentSessionData.steps"
                    :key="step.step_number"
                    :title="`Step ${step.step_number}`"
                    :subtitle="`${step.duration} minutes`"
                    :icon="getStepIcon(step.step_number)"
                    :color="
                      getStepProgress(currentSessionData.session_number, step.step_number) === 1
                        ? 'positive'
                        : 'primary'
                    "
                    class="step-timeline-entry"
                  >
                    <div class="step-content">
                      <div class="q-mb-sm">
                        <div class="text-weight-medium text-grey-8">Ingredients & Equipment:</div>
                        <div class="q-gutter-xs q-mt-xs">
                          <q-chip
                            v-for="(item, idx) in step.ingredients_equipments"
                            :key="idx"
                            text-color="white"
                            class="gredient"
                          >
                            {{ item }}
                          </q-chip>
                        </div>
                      </div>

                      <div class="q-mb-md">
                        <div class="text-weight-medium text-grey-8">Procedure:</div>
                        <div class="q-mt-xs text-body1">{{ step.how_to_do }}</div>
                      </div>

                      <div class="row items-center justify-between">
                        <q-toggle
                          :model-value="
                            getStepProgress(currentSessionData.session_number, step.step_number) ===
                            1
                          "
                          @update:model-value="
                            (val) =>
                              setStepProgress(
                                currentSessionData.session_number,
                                step.step_number,
                                val ? 1 : 0,
                              )
                          "
                          size="lg"
                          label="Complete"
                          color="positive"
                          checked-icon="check"
                          unchecked-icon="close"
                        />
                      </div>
                    </div>
                  </q-timeline-entry>
                </q-timeline>
              </q-card-section>

              <!-- Session Progress -->
              <q-card-actions class="q-pa-md bg-grey-2 rounded-borders">
                <div class="full-width">
                  <div class="row items-center q-col-gutter-md">
                    <div class="col-12 col-md-6">
                      <div class="text-subtitle1 text-weight-bold q-mb-xs">Session Progress</div>
                      <q-linear-progress
                        :value="getOverallSessionProgress(currentSessionData.session_number)"
                        size="20px"
                        rounded
                        animation-speed="500"
                      >
                        <div class="absolute-full flex flex-center">
                          <span class="text-white text-caption text-weight-bold">
                            {{
                              Math.round(
                                getOverallSessionProgress(currentSessionData.session_number) * 100,
                              )
                            }}%
                          </span>
                        </div>
                      </q-linear-progress>
                      <div class="text-caption text-grey-7 q-mt-xs">
                        Steps: {{ getCompletedSteps(currentSessionData.session_number) }}/{{
                          currentSessionData.steps.length
                        }}
                        • Prep:
                        {{
                          Math.round(
                            getPreparationProgress(currentSessionData.session_number) * 100,
                          )
                        }}% • Goals: {{ getConcernsProgress(currentSessionData.session_number) }}/{{
                          currentSessionData.concerns_addressed.length
                        }}
                      </div>
                    </div>
                    <div class="col-12 col-md-12">
                      <div class="row q-col-gutter-sm justify-end">
                        <div class="col-auto">
                          <q-btn
                            color="orange"
                            icon="auto_mode"
                            label="Mark All Complete"
                            @click="markAllComplete(currentSessionData.session_number)"
                            :disabled="
                              getOverallSessionProgress(currentSessionData.session_number) === 1
                            "
                            outline
                            dense
                          />
                        </div>
                        <div class="col-auto">
                          <q-btn
                            color="positive"
                            icon="check_circle"
                            label="Complete Session"
                            @click="completeSession(currentSessionData.session_number)"
                            :disabled="
                              getOverallSessionProgress(currentSessionData.session_number) < 1
                            "
                            dense
                          />
                        </div>
                        <div class="col-auto">
                          <q-btn
                            v-if="hasNextSession"
                            color="primary"
                            icon="arrow_forward"
                            label="Next Session"
                            @click="goToNextSession"
                            :disabled="
                              !completedSessions.includes(currentSessionData.session_number)
                            "
                            outline
                            dense
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </q-card-actions>
            </q-card>
          </div>
        </div>
      </div>

      <!-- Progress Overview -->
      <q-card flat class="q-mt-lg">
        <q-card-section>
          <div class="text-h6 text-primary q-mb-md">Treatment Progress Overview</div>
          <div class="row q-col-gutter-md">
            <div
              v-for="session in treatmentPlan.treatments"
              :key="session.session_number"
              class="col-12 col-sm-6 col-md-4"
            >
              <q-card
                :class="{
                  'bg-positive text-white': completedSessions.includes(session.session_number),
                  'bg-blue-1':
                    currentSession === session.session_number &&
                    !completedSessions.includes(session.session_number),
                  'bg-grey-3':
                    currentSession !== session.session_number &&
                    !completedSessions.includes(session.session_number),
                  'cursor-pointer': true,
                  'session-card': true,
                }"
                @click="currentSession = session.session_number"
              >
                <q-card-section>
                  <div class="row items-center no-wrap">
                    <div class="col">
                      <div class="text-weight-bold">Session {{ session.session_number }}</div>
                      <div class="text-caption">Week {{ session.week }}</div>
                      <div class="text-caption">{{ session.treatment_time }}</div>
                      <q-linear-progress
                        :value="getOverallSessionProgress(session.session_number)"
                        :color="
                          completedSessions.includes(session.session_number) ? 'white' : 'primary'
                        "
                        size="8px"
                        class="q-mt-sm"
                        track-color="rgba(255,255,255,0.3)"
                      />
                      <div class="text-caption q-mt-xs">
                        {{ Math.round(getOverallSessionProgress(session.session_number) * 100) }}%
                        Complete
                      </div>
                    </div>
                    <div class="col-auto">
                      <q-icon
                        :name="
                          completedSessions.includes(session.session_number)
                            ? 'check_circle'
                            : 'radio_button_unchecked'
                        "
                        size="24px"
                        :color="
                          completedSessions.includes(session.session_number) ? 'white' : 'grey-5'
                        "
                      />
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
// import jsonData from 'src/info/fulltreatmentPlan.value.json'
import {
  exportTreatmentPlanToPDF,
  getConcernStatus,
  getConcernStatusColor,
} from 'src/utils/pdfExporter'
import { Loading, Notify } from 'quasar'
// Import your treatment plan data here
// const treatmentPlan = jsonData.treatment_plan

const props = defineProps({
  treatmentPlan: {
    type: [String, Object],
    required: true,
  },
  recommendedFullPlan: {
    type: [String, Object],
    required: true,
  },
  treatmentType: {
    type: String,
    required: true,
  },
})

const treatmentPlan = ref(props.treatmentPlan)

// Reactive state
const currentSession = ref(1)
const preparationStatus = ref({})
const stepProgress = ref({})
const completedSessions = ref([])
const concernCompletion = ref({})

// Computed
const currentSessionData = computed(() => {
  return treatmentPlan.value.treatments.find(
    (session) => session.session_number === currentSession.value,
  )
})

const hasNextSession = computed(() => {
  return currentSession.value < treatmentPlan.value.treatments.length
})

// Safe getter/setter methods (keep all your existing methods)
const getPreparationStatus = (sessionNumber, index) => {
  if (!preparationStatus.value[sessionNumber]) return false
  return preparationStatus.value[sessionNumber][index] || false
}

const setPreparationStatus = (sessionNumber, index, value) => {
  if (!preparationStatus.value[sessionNumber]) {
    preparationStatus.value[sessionNumber] = []
  }
  preparationStatus.value[sessionNumber][index] = value
}

const getPreparationProgress = (sessionNumber) => {
  const preps = preparationStatus.value[sessionNumber]
  if (!preps || preps.length === 0) return 0
  const completed = preps.filter(Boolean).length
  return completed / preps.length
}

const getStepProgress = (sessionNumber, stepNumber) => {
  if (!stepProgress.value[sessionNumber]) return 0
  return stepProgress.value[sessionNumber][stepNumber] || 0
}

const setStepProgress = (sessionNumber, stepNumber, value) => {
  if (!stepProgress.value[sessionNumber]) {
    stepProgress.value[sessionNumber] = {}
  }
  stepProgress.value[sessionNumber][stepNumber] = value
}

const getCompletedSteps = (sessionNumber) => {
  const steps = stepProgress.value[sessionNumber]
  if (!steps) return 0
  return Object.values(steps).filter((progress) => progress === 1).length
}

const getSessionProgress = (sessionNumber) => {
  const session = treatmentPlan.value.treatments.find((s) => s.session_number === sessionNumber)
  if (!session || !session.steps) return 0

  const totalSteps = session.steps.length
  if (totalSteps === 0) return 0

  const completedSteps = getCompletedSteps(sessionNumber)
  return completedSteps / totalSteps
}

const getConcernCompletion = (sessionNumber, index) => {
  if (!concernCompletion.value[sessionNumber]) return false
  return concernCompletion.value[sessionNumber][index] || false
}

const setConcernCompletion = (sessionNumber, index, value) => {
  if (!concernCompletion.value[sessionNumber]) {
    concernCompletion.value[sessionNumber] = []
  }
  concernCompletion.value[sessionNumber][index] = value
}

const getConcernsProgress = (sessionNumber) => {
  const concerns = concernCompletion.value[sessionNumber]
  if (!concerns) return 0
  return concerns.filter(Boolean).length
}

const getOverallSessionProgress = (sessionNumber) => {
  const stepProgress = getSessionProgress(sessionNumber)
  const prepProgress = getPreparationProgress(sessionNumber)
  const concernsCount = currentSessionData.value?.concerns_addressed.length || 0
  const concernsProgress =
    concernsCount > 0 ? getConcernsProgress(sessionNumber) / concernsCount : 0

  // Weighted average: 50% steps, 30% preparation, 20% concerns
  return stepProgress * 0.5 + prepProgress * 0.3 + concernsProgress * 0.2
}

// Export to PDF function
const exportToPDF = async () => {
  try {
    // Create progress data object to pass to PDF exporter
    const progressData = {
      getOverallSessionProgress,
      getPreparationProgress,
      getCompletedSteps,
      getConcernsProgress,
      getStepProgress,
      getConcernCompletion,
      getPreparationStatus,
      completedSessions: completedSessions.value, // Add completed sessions
    }
    Loading.show({
      message: 'Generating PDF...',
    })
    await exportTreatmentPlanToPDF(treatmentPlan.value, progressData)
    Loading.hide()
  } catch (error) {
    Loading.hide()
    console.error('PDF export failed:', error)
    // Show error notification
    Notify.create({
      type: 'negative',
      message: 'Failed to generate PDF. Please try again.',
      position: 'top',
    })
  }
}
// Import and use the pure functions from the exporter
// Now you can remove the local versions of these functions since we're importing them
// Methods
const getStepIcon = (stepNumber) => {
  const icons = ['clean_hands', 'face', 'mask', 'science', 'visibility', 'massage', 'spa']
  return icons[(stepNumber - 1) % icons.length]
}

const markAllComplete = (sessionNumber) => {
  // Mark all preparations complete
  if (currentSessionData.value?.preparations_checklist_for_therapist) {
    preparationStatus.value[sessionNumber] =
      currentSessionData.value.preparations_checklist_for_therapist.map(() => true)
  }

  // Mark all steps complete
  if (currentSessionData.value?.steps) {
    stepProgress.value[sessionNumber] = {}
    currentSessionData.value.steps.forEach((step) => {
      stepProgress.value[sessionNumber][step.step_number] = 1
    })
  }

  // Mark all concerns addressed
  if (currentSessionData.value?.concerns_addressed) {
    concernCompletion.value[sessionNumber] = currentSessionData.value.concerns_addressed.map(
      () => true,
    )
  }
}

const completeSession = (sessionNumber) => {
  if (!completedSessions.value.includes(sessionNumber)) {
    completedSessions.value.push(sessionNumber)
    // Auto-mark everything as complete if not already
    markAllComplete(sessionNumber)
  }
}

const goToNextSession = () => {
  if (hasNextSession.value) {
    currentSession.value += 1
  }
}

const initializeProgress = () => {
  treatmentPlan.value.treatments.forEach((session) => {
    // Initialize preparation status
    if (!preparationStatus.value[session.session_number]) {
      preparationStatus.value[session.session_number] =
        session.preparations_checklist_for_therapist.map(() => false)
    }

    // Initialize step progress
    if (!stepProgress.value[session.session_number]) {
      stepProgress.value[session.session_number] = {}
      session.steps.forEach((step) => {
        stepProgress.value[session.session_number][step.step_number] = 0
      })
    }

    // Initialize concern completion
    if (!concernCompletion.value[session.session_number]) {
      concernCompletion.value[session.session_number] = session.concerns_addressed.map(() => false)
    }
  })
}

// Initialize on mount
onMounted(() => {
  initializeProgress()
})
</script>

<style scoped>
.q-timeline__title {
  font-size: 1.1rem;
  font-weight: 600;
}

.q-timeline__subtitle {
  font-size: 0.9rem;
}

.cursor-pointer {
  cursor: pointer;
}

.text-caption {
  font-size: 0.75rem;
}

/* Improved styling for concerns */
.concern-item {
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}

.concern-item:hover {
  border-color: #2196f3;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Improved timeline steps */
.step-timeline-entry {
  margin-bottom: 24px;
}

.step-content {
  padding: 8px 0;
}

.step-actions {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
  margin-top: 12px;
}

.step-progress {
  flex: 1;
  max-width: 200px;
}

.progress-bar {
  min-width: 120px;
}

.step-toggle {
  white-space: nowrap;
}

.session-progress-bar {
  transition: all 0.5s ease;
}

.session-card {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.session-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

:deep(.q-linear-progress__model--determinate) {
  background: linear-gradient(90deg, #6366f1, #a855f7) !important;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .step-actions {
    flex-direction: column;
    gap: 12px;
  }

  .step-progress {
    max-width: 100%;
  }
}
</style>
