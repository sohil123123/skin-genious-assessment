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

          <div class="flex items-center gap-4">
            <div class="text-weight-bold">
              Session {{ session?.session_number }} — Step {{ stepNumber }} of {{ totalSteps }}
            </div>

            <!-- Audio Toggle Button -->
            <q-btn
              :icon="commonStore.isAudioEnabled ? 'volume_up' : 'volume_off'"
              :color="commonStore.isAudioEnabled ? 'primary' : 'grey'"
              round
              flat
              @click="commonStore.toggleAudio()"
            >
              <q-tooltip>
                {{ commonStore.isAudioEnabled ? 'Disable Audio' : 'Enable Audio' }}
              </q-tooltip>
            </q-btn>
          </div>
        </div>

        <!-- Client Banner -->
        <q-card v-if="assessmentStore.assessmentData?.name" flat bordered class="q-mb-md">
          <q-card-section class="bg-grey-1 q-py-sm q-px-md flex items-center justify-between">
            <div class="flex items-center gap-2">
              <q-icon name="person" size="24px" color="primary" />
              <span class="text-subtitle1 text-weight-medium text-dark">
                Client: <strong class="text-black">{{ assessmentStore.assessmentData.name }}</strong>
              </span>
            </div>
            <div v-if="assessmentStore.assessmentData?.age || assessmentStore.assessmentData?.gender" class="text-caption text-grey-7">
              {{ assessmentStore.assessmentData?.gender ? assessmentStore.assessmentData.gender + ', ' : '' }}{{ assessmentStore.assessmentData?.age ? assessmentStore.assessmentData.age + ' years' : '' }}
            </div>
          </q-card-section>
        </q-card>

        <!-- BODY -->
        <div v-if="step" class="row q-col-gutter-md">
          <!-- LEFT SIDE -->
          <div class="col-md-8">
            <!-- Instructions -->
            <q-card class="section-card soft-bg q-pa-lg">
              <div class="title">{{ session?.title }}</div>
              <div class="title text-grey-6">Step {{ stepNumber }}</div>
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
                  <TreatmentTimerV1
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
                  <TreatmentTimerV1
                    ref="timerRef"
                    :duration="Number(step.duration.replace(/(mins|minutes)/g, '') * 60) || 0"
                    @start="onTimerStart"
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
import { useCommonStore } from 'stores/commonStore'
import TreatmentTimerV1 from 'src/components/common/TreatmentTimerV1.vue'
import { useQuasar } from 'quasar'
import { useElevenLabsAudio } from 'src/composables/useElevenLabsAudio'

const { handleAudioAction, cleanup } = useElevenLabsAudio()
const $q = useQuasar()

/* -------------------------------------------
   STORES
--------------------------------------------*/
const route = useRoute()
const router = useRouter()
const store = useTreatmentFlowStore()
const assessmentStore = useAssessmentStore()
const commonStore = useCommonStore()

/* -------------------------------------------
   PARAMS
--------------------------------------------*/
const sessionID = Number(route.params.session_id)
const stepNumber = ref(Number(route.params.step))

/* -------------------------------------------
   TIMER STATE
--------------------------------------------*/
const timerIsFinished = ref(false)
const timerRef = ref(null)
const isAudioPlayed = ref(false)

/* -------------------------------------------
   COMPUTED
--------------------------------------------*/
const session = computed(() => store.currentSession)
const step = computed(() => store.currentStep)
const totalSteps = computed(() => store.totalSteps)
const isFirstStep = computed(() => store.currentStepIndex === 0)
const stepDuration = computed(
  () => Number(step.value?.duration?.replace(/(mins|minutes)/g, '')) * 60 || 0,
)

/* -------------------------------------------
   LOAD DATA
--------------------------------------------*/
onMounted(async () => {
  await assessmentStore.getSingleAssessment(route.params.assessment_id)

  store.treatmentPlan = assessmentStore.assessmentData.treatment_sessions
  store.setSessionById(sessionID)
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
    isAudioPlayed.value = false // Reset audio flag for new step
    resetTimer()
    cleanup()
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
function onTimerStart() {
  // Only play audio if globally enabled and not already played for this step
  if (commonStore.isAudioEnabled && !isAudioPlayed.value) {
    handleAudioAction(step.value.script)
    isAudioPlayed.value = true
  }
}

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
      params: {
        user_id: route.params.user_id,
        assessment_id: assessmentStore.assessmentData.id,
        session_id: sessionID,
        ...(route.params.appointment_id && { appointment_id: route.params.appointment_id }),
      },
    })
    return
  }

  const nextStepNum = store.currentStepIndex + 1
  router.push({
    name: 'TreatmentSteps',
    params: {
      user_id: route.params.user_id,
      assessment_id: assessmentStore.assessmentData.id,
      session_id: sessionID,
      step: nextStepNum,
      ...(route.params.appointment_id && { appointment_id: route.params.appointment_id }),
    },
  })
}

function prev() {
  store.prevStep()
  router.push({
    name: 'TreatmentSteps',
    params: {
      user_id: route.params.user_id,
      assessment_id: assessmentStore.assessmentData.id,
      session_id: sessionID,
      step: store.currentStepIndex + 1,
      ...(route.params.appointment_id && { appointment_id: route.params.appointment_id }),
    },
  })
}

function abort() {
  $q.dialog({
    title: 'Confirm',
    message: 'Are you sure you want to abort the treatment?',
    persistent: true,

    ok: {
      label: 'Yes, Abort',
      color: 'positive',
      icon: 'check_circle',
    },
    cancel: {
      label: 'Cancel',
      color: 'negative',
      flat: true,
      icon: 'close',
    },
  })
    .onOk(() => {
      store.resetFlow()
      router.push({
        name: 'TreatmentPrep',
        params: {
          user_id: route.params.user_id,
          assessment_id: assessmentStore.assessmentData.id,
          session_id: sessionID,
          ...(route.params.appointment_id && { appointment_id: route.params.appointment_id }),
        },
      })
    })
    .onCancel(() => {
      console.log('User cancelled')
    })
    .onDismiss(() => {
      console.log('Dialog closed (OK or Cancel)')
    })
}
</script>
