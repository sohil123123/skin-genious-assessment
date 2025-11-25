<template>
  <q-page>
    <div class="min-h-screen bg-grey-2 p-6">
      <div class="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <!-- HEADER -->
        <div class="flex items-center justify-between mb-8">
          <div class="flex items-center gap-3">
            <div
              class="w-12 h-12 rounded-full border-2 border-black flex items-center justify-center"
            >
              <span class="text-2xl font-serif">A</span>
            </div>
            <span class="text-xl font-light tracking-wider">AI AESTHETICS</span>
          </div>

          <div class="text-weight-bold">
            Session {{ sessionNumber }} — Step {{ stepNumber }} of {{ totalSteps }}
          </div>
        </div>

        <!-- BODY -->
        <div v-if="step" class="row q-col-gutter-md">
          <!-- LEFT SIDE -->
          <div class="col-md-8">
            <!-- Instructions -->
            <q-card class="section-card soft-bg q-pa-lg">
              <div class="title">{{ session?.title }}</div>
              <div class="desc">{{ step.how_to_do }}</div>
              <div class="q-mt-md">
                <div class="info-main">Ingredients</div>

                <q-list>
                  <q-item
                    v-for="(ie, idx) in step.ingredients_equipments"
                    :key="idx"
                    clickable
                    v-ripple
                    class="q-pl-none"
                  >
                    <q-item-section avatar class="ingredients-list" top>
                      <q-avatar class="gredient" text-color="white" icon="science" size="24px" />
                    </q-item-section>

                    <q-item-section>{{ ie }}</q-item-section>
                  </q-item>
                </q-list>
              </div>
            </q-card>

            <!-- <div class="row q-col-gutter-md q-mt-md">
              <div class="col-md-6 col-sm-6 col-xs-12">
                <q-card class="info-card soft-bg q-pa-lg full-height">
                  <div class="info-main">Ingredients</div>
                  <q-list>
                    <q-item
                      v-for="(ie, idx) in step.ingredients_equipments"
                      :key="idx"
                      clickable
                      v-ripple
                      class="q-pl-none"
                    >
                      <q-item-section avatar class="ingredients-list" top>
                        <q-avatar class="gredient" text-color="white" icon="science" size="24px" />
                      </q-item-section>

                      <q-item-section>{{ ie }}</q-item-section>
                    </q-item>
                  </q-list>
                </q-card>
              </div>

              <div class="col-md-6 col-sm-6 col-xs-12">
                <q-card class="info-card soft-bg q-pa-lg full-height">
                  <TreatmentTimer
                    ref="timerRef"
                    :duration="Number(step.duration * 60) || 0"
                    :autoStart="true"
                    @finished="onTimerFinished"
                  />
                </q-card>
              </div>
            </div> -->

            <!-- Complete Button -->
            <q-card class="preview-card q-pa-lg text-center q-mt-md">
              <q-btn label="Mark Step Complete" class="gredient text-white" @click="next" />
            </q-card>
          </div>

          <!-- RIGHT SIDE -->
          <div v-if="session" class="col-md-4 col-sm-12 col-xs-12">
            <q-card class="preview-card q-pa-lg full-height">
              <div class="preview-label">Timer</div>
              <div class="col-md-6 col-sm-6 col-xs-12 q-mt-md">
                <q-card flat class="timer-card q-pa-lg full-height">
                  <TreatmentTimer
                    ref="timerRef"
                    :duration="Number(step.duration.replace(' mins', '') * 60) || 0"
                    :autoStart="true"
                    @finished="onTimerFinished"
                  />
                </q-card>
              </div>
            </q-card>
          </div>
        </div>

        <!-- LOADING -->
        <div v-else>
          <div class="text-h6 text-weight-bold">Step {{ stepNumber }} of {{ totalSteps }}</div>
          <div class="text-subtitle1">Loading step...</div>
        </div>

        <!-- NAVIGATION BUTTONS -->
        <q-card flat class="q-pa-lg">
          <q-card-actions align="right">
            <q-btn flat label="Previous" :disable="isFirstStep" @click="prev" />
            <q-btn
              color="primary"
              label="Next Step"
              class="q-ml-sm text-white"
              @click="next"
              :disable="!timerIsFinished"
            />
            <q-btn flat label="Abort" color="negative" class="q-ml-sm" @click="abort" />
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
/* -------------------------------------------
   IMPORTS
--------------------------------------------*/
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTreatmentFlowStore } from 'stores/treatmentFlow'
import { useAssessmentStore } from 'stores/assessmentStore'
import TreatmentTimer from 'src/components/common/TreatmentTimer.vue'

/* -------------------------------------------
   STORES
--------------------------------------------*/
const route = useRoute()
const router = useRouter()
const store = useTreatmentFlowStore()
const assessmentStore = useAssessmentStore()

/* -------------------------------------------
   PARAMS
--------------------------------------------*/
const sessionNumber = Number(route.params.session)
const stepNumber = ref(Number(route.params.step))

/* -------------------------------------------
   TIMER STATE
--------------------------------------------*/
const timerIsFinished = ref(false)
const timerRef = ref(null)

/* -------------------------------------------
   COMPUTED
--------------------------------------------*/
const session = computed(() => store.currentSession)
const step = computed(() => store.currentStep)
const totalSteps = computed(() => store.totalSteps)
const isFirstStep = computed(() => store.currentStepIndex === 0)
const stepDuration = computed(() => Number(step.value?.duration.replace(' mins', '')) * 60 || 0)

/* -------------------------------------------
   LOAD DATA
--------------------------------------------*/
onMounted(async () => {
  await assessmentStore.getSingleAssessment(route.params.assessment_id)

  store.treatmentPlan = assessmentStore.assessmentData.treatment_sessions
  store.setSessionByNumber(sessionNumber)
  store.setStepByNumber(stepNumber.value)

  resetTimer()
})

/* -------------------------------------------
   WATCH ROUTE STEP CHANGES → RESET TIMER
--------------------------------------------*/
watch(
  () => route.params.step,
  (newStep) => {
    stepNumber.value = Number(newStep)
    store.setStepByNumber(stepNumber.value)
    resetTimer()
  },
)

watch(
  () => route.params.step,
  () => {
    stepNumber.value = Number(route.params.step)
    store.setStepByNumber(stepNumber.value)

    // 💥 Reset timer cleanly
    timerRef.value?.restartTimer(stepDuration.value)
  },
)

watch(stepDuration, async () => {
  await nextTick()

  if (timerRef.value) {
    timerRef.value.pauseTimer() // stop previous timer
    timerRef.value.restartTimer() // reset elapsed = 0
  }
})

/* -------------------------------------------
   TIMER CONTROL
--------------------------------------------*/
function resetTimer() {
  timerIsFinished.value = false

  // Let DOM update then restart timer component
  setTimeout(() => {
    if (timerRef.value?.restartTimer) {
      timerRef.value.restartTimer(stepDuration.value)
    }
  }, 50)
}

function onTimerFinished() {
  timerIsFinished.value = true
}

/* -------------------------------------------
   NAVIGATION
--------------------------------------------*/
function next() {
  store.nextStep()

  if (store.status === 'completed') {
    router.push({
      name: 'TreatmentComplete',
      params: { session: sessionNumber },
    })
    return
  }

  const nextStepNum = store.currentStepIndex + 1
  router.push({
    name: 'TreatmentSteps',
    params: { session: sessionNumber, step: nextStepNum },
  })
}

function prev() {
  store.prevStep()
  router.push({
    name: 'TreatmentSteps',
    params: { session: sessionNumber, step: store.currentStepIndex + 1 },
  })
}

function abort() {
  store.resetFlow()
  router.push({
    name: 'TreatmentPrep',
    params: { assessment_id: assessmentStore.assessmentData.id, session: sessionNumber },
  })
}
</script>
