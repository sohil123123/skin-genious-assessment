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
            <span class="text-xl font-light tracking-wider">AI AESTHETICS (PIGMENTATION)</span>
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
                {{ commonStore.isAudioEnabled ? 'Disable All Audio' : 'Enable All Audio' }}
              </q-tooltip>
            </q-btn>

            <!-- Dr. Voice Toggle Button -->
            <q-btn
              :icon="commonStore.isVoiceEnabled ? 'record_voice_over' : 'voice_over_off'"
              :color="commonStore.isVoiceEnabled ? 'primary' : 'grey'"
              round
              flat
              class="q-ml-sm"
              @click="commonStore.toggleVoice()"
              :disable="!commonStore.isAudioEnabled"
            >
              <q-tooltip>
                {{ commonStore.isVoiceEnabled ? 'Disable Dr. Voice' : 'Enable Dr. Voice' }}
              </q-tooltip>
            </q-btn>
          </div>
        </div>

        <!-- Client Banner -->
        <q-card v-if="pigmentationStore.formData?.initials" flat bordered class="q-mb-md">
          <q-card-section class="bg-grey-1 q-py-sm q-px-md flex items-center justify-between">
            <div class="flex items-center gap-2">
              <q-icon name="person" size="24px" color="primary" />
              <span class="text-subtitle1 text-weight-medium text-dark">
                Client:
                <strong class="text-black"
                  >{{ pigmentationStore.formData.initials
                  }}{{
                    pigmentationStore.formData.mrn
                      ? ' (ID: ' + pigmentationStore.formData.mrn + ')'
                      : ''
                  }}</strong
                >
              </span>
            </div>
            <div
              v-if="pigmentationStore.formData?.age || pigmentationStore.formData?.sex"
              class="text-caption text-grey-7"
            >
              {{ pigmentationStore.formData?.sex ? pigmentationStore.formData.sex + ', ' : ''
              }}{{
                pigmentationStore.formData?.age ? pigmentationStore.formData.age + ' years' : ''
              }}
            </div>
          </q-card-section>
        </q-card>

        <!-- BODY -->
        <div v-if="step" class="row q-col-gutter-md">
          <!-- LEFT SIDE -->
          <div class="col-md-8">
            <!-- Instructions -->
            <q-card class="section-card soft-bg q-pa-lg">
              <div class="title text-weight-bold text-h5 q-mb-xs">{{ session?.title }}</div>
              <div class="title text-grey-6 text-subtitle2 q-mb-md">Step {{ stepNumber }}</div>
              <div
                class="desc text-body1 text-dark q-mb-md"
                style="white-space: pre-line; line-height: 1.6"
              >
                {{ step.how_to_do }}
              </div>

              <div
                class="q-mt-lg"
                v-if="step.ingredients_equipments && step.ingredients_equipments.length"
              >
                <div class="info-main text-subtitle2 text-weight-bold q-mb-sm text-grey-8">
                  Equipment &amp; Products Used:
                </div>
                <q-list>
                  <q-item
                    v-for="(ie, idx) in step.ingredients_equipments"
                    :key="idx"
                    clickable
                    v-ripple
                    class="q-pl-none"
                  >
                    <q-item-section avatar class="ingredients-list" top>
                      <q-avatar class="gredient text-white" icon="science" size="24px" />
                    </q-item-section>
                    <q-item-section class="text-body2 text-dark">{{ ie }}</q-item-section>
                  </q-item>
                </q-list>
              </div>
            </q-card>

            <!-- Complete Button -->
            <q-card flat bordered class="q-pa-lg text-center q-mt-md rounded-lg">
              <q-btn
                label="Mark Step Complete"
                size="lg"
                rounded
                class="gredient text-white px-8"
                @click="next"
                no-caps
              />
            </q-card>
          </div>

          <!-- RIGHT SIDE -->
          <div v-if="session" class="col-md-4 col-sm-12 col-xs-12">
            <q-card flat bordered class="q-pa-lg full-height rounded-lg">
              <div class="text-subtitle1 text-weight-bold text-grey-8 q-mb-md">Step Timer</div>
              <div class="col-md-6 col-sm-6 col-xs-12">
                <q-card flat class="timer-card full-height">
                  <TreatmentTimerV1
                    ref="timerRef"
                    :duration="
                      Number(
                        String(step.duration)
                          .replace(/(mins|minutes|min)/g, '')
                          .trim() * 60,
                      ) || 300
                    "
                    @start="onTimerStart"
                    @finished="onTimerFinished"
                  />
                </q-card>
              </div>
            </q-card>
          </div>
        </div>

        <!-- LOADING -->
        <div v-else class="text-center q-pa-xl">
          <q-spinner color="primary" size="3em" />
          <div class="text-subtitle1 q-mt-md">Loading step...</div>
        </div>

        <!-- NAVIGATION BUTTONS -->
        <q-card flat class="q-pa-md q-mt-md">
          <q-card-actions align="right" class="gap-2">
            <q-btn
              flat
              label="Previous"
              size="md"
              rounded
              :disable="isFirstStep"
              @click="prev"
              no-caps
            />
            <q-btn
              color="primary"
              label="Next Step"
              size="md"
              rounded
              class="text-white px-4"
              @click="next"
              :disable="!timerIsFinished"
              no-caps
            />
            <q-btn
              flat
              label="Abort"
              color="negative"
              size="md"
              rounded
              class="q-ml-sm"
              @click="abort"
              no-caps
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTreatmentFlowStore } from 'stores/treatmentFlow'
import { usePigmentationStore } from 'src/stores/pigmentationStore'
import { useCommonStore } from 'stores/commonStore'
import TreatmentTimerV1 from 'src/components/common/TreatmentTimerV1.vue'
import { useQuasar } from 'quasar'
import { useElevenLabsAudio } from 'src/composables/useElevenLabsAudio'

const bgMusicPlayer = new Audio('/background_music_1.mp3')
bgMusicPlayer.loop = true

const {
  handleAudioAction,
  cleanup: elevenLabsCleanup,
  pauseAudio,
} = useElevenLabsAudio({
  onEnded: () => {
    if (commonStore.isAudioEnabled) {
      bgMusicPlayer.play().catch((e) => console.error('BG music error:', e))
    }
  },
})

function cleanup() {
  elevenLabsCleanup()
}

onBeforeUnmount(() => {
  bgMusicPlayer.pause()
})

const $q = useQuasar()

const route = useRoute()
const router = useRouter()
const store = useTreatmentFlowStore()
const pigmentationStore = usePigmentationStore()
const commonStore = useCommonStore()

watch(
  () => commonStore.isAudioEnabled,
  (enabled) => {
    if (!enabled) {
      pauseAudio()
      bgMusicPlayer.pause()
    } else {
      if (isAudioPlayed.value) {
        bgMusicPlayer.play().catch((e) => console.error('BG music error:', e))
      }
    }
  },
)

watch(
  () => commonStore.isVoiceEnabled,
  (enabled) => {
    if (!enabled) {
      pauseAudio()
      if (commonStore.isAudioEnabled && isAudioPlayed.value) {
        bgMusicPlayer.play().catch((e) => console.error('BG music error:', e))
      }
    }
  },
)

const sessionID = Number(route.params.session_id)
const stepNumber = ref(Number(route.params.step))

const timerIsFinished = ref(false)
const timerRef = ref(null)
const isAudioPlayed = ref(false)

const session = computed(() => store.currentSession)
const step = computed(() => store.currentStep)
const totalSteps = computed(() => store.totalSteps)
const isFirstStep = computed(() => store.currentStepIndex === 0)
const stepDuration = computed(() => {
  if (!step.value?.duration) return 300
  return (
    Number(
      String(step.value.duration)
        .replace(/(mins|minutes|min)/g, '')
        .trim() * 60,
    ) || 300
  )
})

onMounted(async () => {
  await pigmentationStore.getSingleAssessment(route.params.assessment_id)

  if (pigmentationStore.lastPlan && pigmentationStore.lastPlan.sessions) {
    store.treatmentPlan = {
      treatments: pigmentationStore.lastPlan.sessions.map((s) => {
        let mappedSteps = []
        const formatLabelLocal = (str) => {
          if (!str) return ''
          return str
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
        }

        const hasLaserModality = s.selected_modalities?.some(
          (m) => m === 'q_switch' || m === 'laser' || m === 'toning'
        )

        let hasZoneSequence = false
        if (hasLaserModality && s.provider_protocol?.zone_sequence && s.provider_protocol.zone_sequence.length > 0) {
          const activeZones = s.provider_protocol.zone_sequence.filter(
            (z) => z.zone_strategy_type !== 'exclude_from_treatment' && z.zone_strategy_type !== 'defer_zone'
          )
          if (activeZones.length > 0) {
            hasZoneSequence = true
            mappedSteps = activeZones.map((z, idx) => {
              let settingsStr = ''
              let equipments = []
              if (z.base_zone_setting) {
                const b = z.base_zone_setting
                settingsStr = `${b.wavelength_nm}nm • ${b.energy_mj}mJ • ${b.fluence_j_cm2} J/cm² • ${b.passes} passes (${b.frequency_hz}Hz)`
                equipments.push(`Laser (${b.wavelength_nm}nm)`)
              } else if (z.regional_override_setting) {
                const r = z.regional_override_setting
                settingsStr = `${r.wavelength_nm}nm • ${r.energy_mj}mJ • ${r.fluence_j_cm2} J/cm² • ${r.passes} passes`
                equipments.push(`Laser (${r.wavelength_nm}nm)`)
              } else {
                settingsStr = 'Standard protocol settings'
                equipments.push('Laser')
              }

              return {
                step_number: idx + 1,
                duration: '5 mins',
                ingredients_equipments: equipments,
                how_to_do: `Treat Zone: ${z.zone.toUpperCase()}\nStrategy: ${formatLabelLocal(z.zone_strategy_type || '')}\nSettings: ${settingsStr}\nCoverage Instruction: ${z.coverage_instruction || z.base_zone_setting?.coverage_instruction || 'Standard full-zone passes.'}\nEndpoint Target: ${z.endpoint || z.base_zone_setting?.endpoint || 'Mild erythema.'}`,
              }
            })
          }
        }

        if (!hasZoneSequence) {
          let rawSteps = s.fixed_protocol?.steps || s.steps || []
          mappedSteps = rawSteps.map((step, idx) => {
            if (typeof step === 'string') {
              return {
                step_number: idx + 1,
                duration: '10 mins',
                ingredients_equipments: [],
                how_to_do: step,
              }
            }
            return step
          })
        }

        return {
          id: s.id || s.session_number,
          session_number: s.session_number,
          title: s.goal || 'Pigmentation Session',
          treatment_time: '45 mins',
          week: s.timing?.replace('week_', '') || s.session_number,
          preparations_checklist_for_therapist: s.fixed_protocol?.preparations_checklist_for_therapist || [],
          concerns_addressed: [s.goal || 'Pigmentation treatment'],
          steps: mappedSteps,
          provider_protocol: s.provider_protocol || null,
          status: s.status || 'pending',
        }
      }),
    }
  }

  const matchedSession = store.treatmentPlan?.treatments?.find(
    (s) => Number(s.id) === Number(sessionID) || Number(s.session_number) === Number(sessionID)
  )

  if (matchedSession) {
    store.setSessionById(matchedSession.id)
  } else {
    store.setSessionById(sessionID)
  }
  store.setStepByNumber(stepNumber.value)

  resetTimer()
})

watch(
  () => route.params.step,
  (newStep) => {
    stepNumber.value = Number(newStep)
    store.setStepByNumber(stepNumber.value)
    isAudioPlayed.value = false
    resetTimer()
    cleanup()
  },
)

watch(
  () => route.params.step,
  () => {
    stepNumber.value = Number(route.params.step)
    store.setStepByNumber(stepNumber.value)
    timerRef.value?.restartTimer(stepDuration.value)
  },
)

watch(stepDuration, async () => {
  await nextTick()
  if (timerRef.value) {
    timerRef.value.pauseTimer()
    timerRef.value.restartTimer()
  }
})

function onTimerStart() {
  if (!isAudioPlayed.value) {
    isAudioPlayed.value = true
    if (commonStore.isAudioEnabled) {
      if (commonStore.isVoiceEnabled) {
        bgMusicPlayer.pause()
        handleAudioAction(
          step.value?.how_to_do || 'Please follow doctor instructions for this step.',
        )
      } else {
        bgMusicPlayer.play().catch((e) => console.error('BG music error:', e))
      }
    }
  }
}

function resetTimer() {
  timerIsFinished.value = false
  setTimeout(() => {
    if (timerRef.value?.restartTimer) {
      timerRef.value.restartTimer(stepDuration.value)
    }
  }, 50)
}

function onTimerFinished() {
  timerIsFinished.value = true
}

function next() {
  store.nextStep()

  const realSessionId = session.value?.id || sessionID

  if (store.status === 'completed') {
    router.push({
      name: 'PigmentationTreatmentComplete',
      params: {
        user_id: route.params.user_id,
        assessment_id: pigmentationStore.id,
        session_id: realSessionId,
        ...(route.params.appointment_id && { appointment_id: route.params.appointment_id }),
      },
    })
    return
  }

  const nextStepNum = store.currentStepIndex + 1
  router.push({
    name: 'PigmentationTreatmentSteps',
    params: {
      user_id: route.params.user_id,
      assessment_id: pigmentationStore.id,
      session_id: realSessionId,
      step: nextStepNum,
      ...(route.params.appointment_id && { appointment_id: route.params.appointment_id }),
    },
  })
}

function prev() {
  store.prevStep()
  const realSessionId = session.value?.id || sessionID
  router.push({
    name: 'PigmentationTreatmentSteps',
    params: {
      user_id: route.params.user_id,
      assessment_id: pigmentationStore.id,
      session_id: realSessionId,
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
  }).onOk(() => {
    store.resetFlow()
    const realSessionId = session.value?.id || sessionID
    router.push({
      name: 'PigmentationTreatmentPrep',
      params: {
        user_id: route.params.user_id,
        assessment_id: pigmentationStore.id,
        session_id: realSessionId,
        ...(route.params.appointment_id && { appointment_id: route.params.appointment_id }),
      },
    })
  })
}
</script>

<style scoped>
.gredient {
  background: linear-gradient(90deg, #0f766e, #0d9488);
}
</style>
