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
                  >{{ pigmentationStore.formData.full_name || pigmentationStore.formData.initials
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
              <!-- Header & Step Type -->
              <div class="flex items-center justify-between q-mb-md flex-wrap gap-2">
                <div>
                  <div class="text-h5 font-bold text-dark flex items-center gap-2">
                    <span>{{ session?.title }}</span>
                    <q-badge color="teal-9" class="q-ml-sm text-weight-bold" style="font-size: 12px;">
                      Step {{ stepNumber }} of {{ totalSteps }}
                    </q-badge>
                  </div>
                  <div class="text-subtitle2 text-grey-7 q-mt-xs flex items-center gap-2" v-if="parsedStep?.step_type || parsedStep?.modality">
                    <q-chip density="compact" color="primary" text-color="white" class="text-weight-bold uppercase" style="font-size: 11px;">
                      {{ parsedStep.step_type || 'PROCEDURE' }}
                    </q-chip>
                    <span v-if="parsedStep.modality" class="text-weight-bold text-indigo-9">
                      Modality: {{ parsedStep.modality }}
                    </span>
                  </div>
                </div>
                <div v-if="step.duration" class="bg-teal-1 text-teal-9 px-3 py-1 rounded-full text-caption font-mono font-bold border border-teal-2 flex items-center gap-1">
                  <q-icon name="schedule" size="16px" />
                  <span>Planned Duration: {{ step.duration }}</span>
                </div>
              </div>

              <!-- Equipment & Products Used -->
              <div class="q-mb-md bg-grey-1 q-pa-sm rounded-lg" style="border: 1px solid #e2e8f0;" v-if="step.ingredients_equipments?.length">
                <div class="text-caption text-weight-bold text-grey-8 uppercase tracking-wide q-mb-xs flex items-center gap-1">
                  <q-icon name="science" color="teal-9" size="18px" />
                  <span>Equipment &amp; Products Used:</span>
                </div>
                <div class="flex gap-1 flex-wrap items-center">
                  <q-chip
                    v-for="(ie, idx) in step.ingredients_equipments"
                    :key="idx"
                    color="teal-1"
                    text-color="teal-9"
                    icon="science"
                    density="compact"
                    class="text-weight-bold"
                  >
                    {{ ie }}
                  </q-chip>
                </div>
              </div>

              <!-- IF STRUCTURED STEP -->
              <template v-if="hasStructuredData">
                <!-- Step Instructions -->
                <div class="q-mb-md bg-indigo-1 q-pa-md rounded-lg border-left-indigo" v-if="parsedStep?.instructions">
                  <div class="text-caption font-bold text-indigo-9 uppercase tracking-wider q-mb-xs flex items-center gap-1">
                    <q-icon name="assignment" color="indigo-8" size="18px" />
                    <span>Step Instructions</span>
                  </div>
                  <div class="text-body1 text-slate-800 text-weight-medium" style="line-height: 1.5;">
                    {{ parsedStep.instructions }}
                  </div>
                </div>

                <!-- Laser/Device Settings if present -->
                <div class="q-mb-md bg-blue-1 q-pa-md rounded-lg" style="border: 1px solid #bfdbfe;" v-if="parsedStep?.settings_str">
                  <div class="text-caption font-bold text-blue-9 uppercase tracking-wider q-mb-xs flex items-center gap-1">
                    <q-icon name="bolt" color="blue-8" size="18px" />
                    <span>Laser / Device Settings</span>
                  </div>
                  <div class="text-subtitle1 text-blue-10 font-mono font-bold">
                    {{ parsedStep.settings_str }}
                  </div>
                </div>

                <!-- ⚡ Depth Map (mm) -->
                <div class="q-mb-md bg-amber-1 q-pa-md rounded-lg" style="border: 1.5px solid #fcd34d;" v-if="parsedStep?.depth_map_list?.length">
                  <div class="text-subtitle2 font-bold text-amber-10 uppercase tracking-wide q-mb-xs flex items-center justify-between">
                    <span class="flex items-center gap-1">
                      <q-icon name="straighten" color="amber-9" size="20px" />
                      <span>⚡ Procedure Depth Map (mm)</span>
                    </span>
                    <span class="text-caption text-amber-9 font-normal">Check regional needle depth settings</span>
                  </div>
                  <div class="row q-col-gutter-sm q-mt-xs">
                    <div v-for="(dm, dIdx) in parsedStep.depth_map_list" :key="dIdx" class="col-xs-6 col-sm-4">
                      <div class="bg-white q-pa-sm rounded border flex items-center justify-between shadow-2xs" :style="dm.region.toLowerCase().includes('periocular') || dm.region.toLowerCase().includes('perioral') || dm.region.toLowerCase().includes('lip') ? 'border: 1.5px solid #f59e0b; background: #fffbf0;' : 'border: 1px solid #cbd5e1;'">
                        <span class="text-caption text-weight-bold text-dark">{{ dm.region }}:</span>
                        <q-badge color="amber-9" class="text-weight-bold" style="font-size: 12px; font-family: monospace;">
                          {{ dm.depth }}
                        </q-badge>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 🎯 Target Area & Active Zones -->
                <div class="q-mb-md bg-teal-1 q-pa-md rounded-lg" style="border: 1px solid #99f6e4;" v-if="parsedStep?.target_area || parsedStep?.target_zones?.length">
                  <div class="text-caption font-bold text-teal-9 uppercase tracking-wider q-mb-xs flex items-center gap-1">
                    <q-icon name="center_focus_strong" color="teal-8" size="18px" />
                    <span>Target Area &amp; Active Zones</span>
                  </div>
                  <div class="text-body2 text-teal-10 q-mb-xs" v-if="parsedStep.target_area">
                    <b>Description:</b> {{ parsedStep.target_area }}
                  </div>
                  <div v-if="parsedStep.target_zones?.length" class="flex gap-1 flex-wrap items-center q-mt-xs">
                    <span class="text-caption text-grey-8 text-weight-bold q-mr-xs">Active Target Zones:</span>
                    <q-chip
                      v-for="tz in parsedStep.target_zones"
                      :key="tz"
                      color="teal-2"
                      text-color="teal-10"
                      icon="check_circle"
                      density="compact"
                      class="text-weight-bold"
                    >
                      {{ tz }}
                    </q-chip>
                  </div>
                </div>

                <!-- 🛑 Exclusion Zones & Exclusion Instructions -->
                <div class="q-mb-md bg-rose-1 q-pa-md rounded-lg" style="border: 1.5px solid #fca5a5; background-color: #fff1f2;" v-if="parsedStep?.exclusion_zones?.length || parsedStep?.exclusion_instructions">
                  <div class="text-subtitle2 font-bold text-rose-9 uppercase tracking-wide q-mb-xs flex items-center gap-1">
                    <q-icon name="block" color="rose-7" size="20px" />
                    <span>🛑 Exclusion Zones &amp; Avoidance Rules</span>
                  </div>
                  
                  <div v-if="parsedStep.exclusion_zones?.length" class="q-mb-sm flex items-center gap-1 flex-wrap">
                    <span class="text-caption text-rose-9 text-weight-bold">Do NOT Treat Zones:</span>
                    <q-chip
                      v-for="ez in parsedStep.exclusion_zones"
                      :key="ez"
                      color="red-2"
                      text-color="red-10"
                      icon="cancel"
                      density="compact"
                      class="text-weight-bold"
                    >
                      {{ ez }}
                    </q-chip>
                  </div>

                  <div v-if="parsedStep.exclusion_instructions" class="text-caption text-rose-9 bg-white q-pa-sm rounded" style="border: 1px solid #fecdd3; line-height: 1.5;">
                    <b>Exclusion Rules:</b> {{ parsedStep.exclusion_instructions }}
                  </div>
                </div>

                <!-- 🏁 Endpoint Target -->
                <div class="q-mb-md bg-emerald-1 q-pa-sm px-md rounded-lg border border-emerald-3" v-if="parsedStep?.endpoint">
                  <div class="text-caption font-bold text-emerald-9 uppercase tracking-wider flex items-center gap-1">
                    <q-icon name="flag" color="emerald-7" size="18px" />
                    <span>Clinical Endpoint Target:</span>
                    <span class="text-body2 text-dark font-normal text-weight-medium q-ml-xs">{{ parsedStep.endpoint }}</span>
                  </div>
                </div>

                <!-- 🚨 Stop Conditions & 🧴 Step Aftercare -->
                <div class="row q-col-gutter-sm q-mb-md" v-if="parsedStep?.stop_conditions?.length || parsedStep?.aftercare?.length">
                  <!-- Stop conditions -->
                  <div :class="parsedStep.aftercare?.length ? 'col-xs-12 col-sm-6' : 'col-xs-12'" v-if="parsedStep.stop_conditions?.length">
                    <div class="bg-red-1 q-pa-sm rounded-lg" style="border: 1px solid #fca5a5; height: 100%;">
                      <div class="text-caption font-bold text-red-9 uppercase tracking-wider q-mb-xs flex items-center gap-1">
                        <q-icon name="warning" color="red-7" size="18px" />
                        <span>Stop Conditions</span>
                      </div>
                      <ul class="q-pl-md q-my-none text-caption text-red-10" style="line-height: 1.4;">
                        <li v-for="(sc, sIdx) in parsedStep.stop_conditions" :key="sIdx" class="q-mb-xs">
                          {{ sc }}
                        </li>
                      </ul>
                    </div>
                  </div>

                  <!-- Aftercare -->
                  <div :class="parsedStep.stop_conditions?.length ? 'col-xs-12 col-sm-6' : 'col-xs-12'" v-if="parsedStep.aftercare?.length">
                    <div class="bg-purple-1 q-pa-sm rounded-lg" style="border: 1px solid #d8b4fe; height: 100%;">
                      <div class="text-caption font-bold text-purple-9 uppercase tracking-wider q-mb-xs flex items-center gap-1">
                        <q-icon name="sanitation" color="purple-7" size="18px" />
                        <span>Step Post-Care &amp; Aftercare</span>
                      </div>
                      <ul class="q-pl-md q-my-none text-caption text-purple-10" style="line-height: 1.4;">
                        <li v-for="(ac, aIdx) in parsedStep.aftercare" :key="aIdx" class="q-mb-xs">
                          {{ ac }}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </template>

              <!-- FALLBACK FOR UNSTRUCTURED / PLAIN STEPS -->
              <div
                v-else
                class="desc text-body1 text-dark q-pa-md bg-grey-1 rounded-lg"
                style="white-space: pre-line; line-height: 1.6; border: 1px solid #e2e8f0;"
              >
                {{ step.how_to_do }}
              </div>
            </q-card>
          </div>

          <!-- RIGHT SIDE -->
          <div v-if="session" class="col-md-4 col-sm-12 col-xs-12">
            <q-card
              flat
              bordered
              class="q-pa-lg full-height rounded-lg text-center flex column items-center justify-center"
            >
              <div class="text-subtitle1 text-weight-bold text-grey-8 q-mb-md">Step Timer</div>

              <!-- Knob Timer Display -->
              <div class="q-mb-md">
                <q-knob
                  :model-value="elapsedSeconds % 60"
                  :min="0"
                  :max="60"
                  size="160px"
                  color="teal-8"
                  track-color="grey-3"
                  show-value
                  readonly
                >
                  <template #default>
                    <div class="text-h4 text-weight-bold text-teal-9">{{ formattedTime }}</div>
                  </template>
                </q-knob>
              </div>

              <!-- Controls -->
              <div class="row q-gutter-sm justify-center q-mt-sm">
                <!-- Start / End / Resume Button -->
                <q-btn
                  v-if="!timerRunning"
                  color="teal-8"
                  size="md"
                  rounded
                  :label="elapsedSeconds > 0 ? 'Resume' : 'Start'"
                  icon="play_arrow"
                  @click="startTimer"
                  no-caps
                  class="px-4"
                />
                <q-btn
                  v-else
                  color="negative"
                  size="md"
                  rounded
                  label="End"
                  icon="stop"
                  @click="endStep"
                  no-caps
                  class="px-4"
                />

                <!-- Pause Button -->
                <q-btn v-if="timerRunning" color="orange-8" round icon="pause" @click="pauseTimer">
                  <q-tooltip>Pause</q-tooltip>
                </q-btn>

                <!-- Reset Button -->
                <q-btn
                  v-if="elapsedSeconds > 0 && !timerRunning"
                  color="grey"
                  round
                  flat
                  icon="replay"
                  @click="resetTimer"
                >
                  <q-tooltip>Reset</q-tooltip>
                </q-btn>
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
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTreatmentFlowStore } from 'stores/treatmentFlow'
import { usePigmentationStore } from 'src/stores/pigmentationStore'
import { useCommonStore } from 'stores/commonStore'
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
  if (timerInterval) {
    clearInterval(timerInterval)
  }
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

const isAudioPlayed = ref(false)

const session = computed(() => store.currentSession)
const step = computed(() => store.currentStep)
const totalSteps = computed(() => store.totalSteps)
const isFirstStep = computed(() => store.currentStepIndex === 0)

function parseStepText(text) {
  if (!text || typeof text !== 'string') return null

  const result = {
    step_type: null,
    instructions: null,
    modality: null,
    settings_str: null,
    depth_map_raw: null,
    depth_map_list: [],
    target_area: null,
    target_zones: [],
    exclusion_zones: [],
    exclusion_instructions: null,
    endpoint: null,
    stop_conditions: [],
    aftercare: [],
    other_lines: []
  }

  const lines = text.split('\n')
  let currentSection = null

  lines.forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed) return

    if (trimmed.startsWith('Step:')) {
      result.step_type = trimmed.replace('Step:', '').trim()
    } else if (trimmed.startsWith('Instructions:')) {
      result.instructions = trimmed.replace('Instructions:', '').trim()
    } else if (trimmed.startsWith('Modality:')) {
      result.modality = trimmed.replace('Modality:', '').trim()
    } else if (trimmed.startsWith('Treatment:')) {
      result.modality = trimmed.replace('Treatment:', '').trim()
    } else if (trimmed.startsWith('Treat Zone:')) {
      const zone = trimmed.replace('Treat Zone:', '').trim()
      result.target_area = `Treat Zone: ${zone}`
      if (!result.target_zones.includes(zone)) {
        result.target_zones.push(zone)
      }
    } else if (trimmed.startsWith('Settings:')) {
      result.settings_str = trimmed.replace('Settings:', '').trim()
    } else if (trimmed.startsWith('Coverage Instruction:')) {
      if (!result.instructions) {
        result.instructions = trimmed.replace('Coverage Instruction:', '').trim()
      } else {
        result.other_lines.push(trimmed)
      }
    } else if (trimmed.startsWith('Depth Map:')) {
      result.depth_map_raw = trimmed.replace('Depth Map:', '').trim()
      const parts = result.depth_map_raw.split('•')
      result.depth_map_list = parts
        .map((p) => {
          const colonIdx = p.indexOf(':')
          if (colonIdx === -1) return null
          const region = p.substring(0, colonIdx).trim()
          const depth = p.substring(colonIdx + 1).trim()
          return { region, depth }
        })
        .filter((item) => item && item.region && item.depth)
    } else if (trimmed.startsWith('Target Area:')) {
      result.target_area = trimmed.replace('Target Area:', '').trim()
    } else if (trimmed.startsWith('Target Zones:')) {
      const raw = trimmed.replace('Target Zones:', '').trim()
      result.target_zones = raw.split(',').map((z) => z.trim()).filter(Boolean)
    } else if (trimmed.startsWith('Exclusion Zones:')) {
      const raw = trimmed.replace('Exclusion Zones:', '').trim()
      result.exclusion_zones = raw.split(',').map((z) => z.trim()).filter(Boolean)
    } else if (trimmed.startsWith('Exclusion Instructions:')) {
      result.exclusion_instructions = trimmed.replace('Exclusion Instructions:', '').trim()
    } else if (trimmed.startsWith('Avoid Instruction:')) {
      const avoid = trimmed.replace('Avoid Instruction:', '').trim()
      if (result.exclusion_instructions) {
        result.exclusion_instructions += ` | ${avoid}`
      } else {
        result.exclusion_instructions = avoid
      }
    } else if (trimmed.startsWith('Endpoint Target:')) {
      result.endpoint = trimmed.replace('Endpoint Target:', '').trim()
    } else if (trimmed.startsWith('Stop Conditions:')) {
      currentSection = 'stop_conditions'
    } else if (trimmed.startsWith('Step Aftercare:')) {
      currentSection = 'aftercare'
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      const itemText = trimmed.replace(/^[-•]\s*/, '').trim()
      if (currentSection === 'stop_conditions') {
        result.stop_conditions.push(itemText)
      } else if (currentSection === 'aftercare') {
        result.aftercare.push(itemText)
      } else {
        result.other_lines.push(trimmed)
      }
    } else {
      if (currentSection === 'stop_conditions') {
        result.stop_conditions.push(trimmed)
      } else if (currentSection === 'aftercare') {
        result.aftercare.push(trimmed)
      } else {
        result.other_lines.push(trimmed)
      }
    }
  })

  return result
}

const parsedStep = computed(() => {
  if (!step.value) return null
  return parseStepText(step.value.how_to_do)
})

const hasStructuredData = computed(() => {
  if (!parsedStep.value) return false
  const s = parsedStep.value
  return Boolean(
    s.instructions ||
      s.depth_map_list?.length ||
      s.target_area ||
      s.target_zones?.length ||
      s.exclusion_zones?.length ||
      s.exclusion_instructions ||
      s.endpoint ||
      s.stop_conditions?.length ||
      s.aftercare?.length ||
      s.settings_str
  )
})

// Count-up Timer States & Handlers
const elapsedSeconds = ref(0)
let timerInterval = null
const timerRunning = ref(false)

const formattedTime = computed(() => {
  const m = Math.floor(elapsedSeconds.value / 60)
  const s = elapsedSeconds.value % 60
  return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`
})

function startTimer() {
  if (timerInterval) return
  timerRunning.value = true

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

  timerInterval = setInterval(() => {
    elapsedSeconds.value++
  }, 1000)
}

function pauseTimer() {
  timerRunning.value = false
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

function resetTimer() {
  pauseTimer()
  elapsedSeconds.value = 0
}

function endStep() {
  pauseTimer()
  if (step.value) {
    step.value.actual_duration_seconds = elapsedSeconds.value
    store.saveToLocal()
  }
  $q.notify({
    type: 'positive',
    message: `Step completed! Time taken: ${formattedTime.value}`,
    position: 'top',
  })
  next()
}

onMounted(async () => {
  await pigmentationStore.getSingleAssessment(route.params.assessment_id)
  const plan = pigmentationStore.lastPlan
  const sourceSessions = plan?.sessions || plan?.current_treatment_block?.sessions || []

  if (plan && sourceSessions.length > 0) {
    store.treatmentPlan = {
      treatments: sourceSessions.map((s) => {
        let mappedSteps = []
        const formatLabelLocal = (str) => {
          if (!str) return ''
          return str
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
        }

        const selectedModalities = s.selected_modalities || s.selected_modality_ids || []
        const hasLaserModality = selectedModalities.some(
          (m) =>
            m.includes('q_switch') ||
            m.includes('laser') ||
            m.includes('toning') ||
            m.includes('ndyag'),
        )

        let hasZoneSequence = false
        let hasCustomSequence = false
        const zoneSeqSrc = s.zone_sequence || s.provider_protocol?.zone_sequence
        const execSequence = s.session_execution_sequence || s.provider_protocol?.session_execution_sequence

        if (Array.isArray(execSequence) && execSequence.length > 0) {
          hasCustomSequence = true
          let globalStepIdx = 1
          const operations = s.treatment_operations || s.provider_protocol?.treatment_operations || []

          execSequence.forEach((execStep) => {
            const stepTypeLower = String(execStep.step_type || '').toLowerCase()
            const isToningOrLaser = stepTypeLower === 'q_switch' || stepTypeLower === 'peel' || stepTypeLower === 'laser' || stepTypeLower === 'procedure'

            if (isToningOrLaser && Array.isArray(zoneSeqSrc) && zoneSeqSrc.length > 0) {
              const activeZones = zoneSeqSrc.filter(
                (z) => {
                  const strategy = String(z.zone_strategy_type || z.selected_treatment || '').toLowerCase()
                  return !strategy.includes('defer') && !strategy.includes('exclude') && !strategy.includes('avoid')
                }
              )
              if (activeZones.length > 0) {
                activeZones.forEach((z) => {
                  let settingsStr = ''
                  let equipments = []
                  
                  if (z.selected_treatment) {
                    equipments.push(z.selected_treatment)
                  } else {
                    equipments.push('Laser Toning')
                  }

                  const formatSentenceCase = (str) => {
                    if (!str) return ''
                    if (typeof str !== 'string') return String(str)
                    const clean = str.replace(/_/g, ' ')
                    return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase()
                  }

                  const getFluence = (f, e) => {
                    const val = Number(f)
                    if (f !== undefined && f !== null && !isNaN(val) && val > 0) return val
                    const energy = Number(e)
                    if (e !== undefined && e !== null && !isNaN(energy) && energy > 0) return (energy / 1000).toFixed(2)
                    return null
                  }

                  const formatSettingString = (settingObj) => {
                    if (!settingObj || typeof settingObj !== 'object') return 'NA'
                    const parts = []
                    if (settingObj.wavelength_nm !== undefined && settingObj.wavelength_nm !== null) {
                      parts.push(`${settingObj.wavelength_nm}nm`)
                    }
                    if (settingObj.energy_mj !== undefined && settingObj.energy_mj !== null) {
                      parts.push(`${settingObj.energy_mj}mJ`)
                    }
                    const fVal = getFluence(settingObj.fluence_j_cm2, settingObj.energy_mj)
                    if (fVal) {
                      parts.push(`${fVal} J/cm²`)
                    }
                    if (settingObj.passes !== undefined && settingObj.passes !== null) {
                      parts.push(`${settingObj.passes} ${settingObj.passes > 1 ? 'passes' : 'pass'}`)
                    }
                    if (settingObj.frequency_hz !== undefined && settingObj.frequency_hz !== null) {
                      parts.push(`(${settingObj.frequency_hz}Hz)`)
                    }
                    return parts.length > 0 ? parts.join(' • ') : 'NA'
                  }

                  const qSwitch = s.fixed_protocol?.q_switch
                  let foundSettingObj = null

                  if (qSwitch && qSwitch.use) {
                    if (Array.isArray(qSwitch.settings_by_zone) && qSwitch.settings_by_zone.length > 0) {
                      const targetZoneStr = String(z.zone || '').toLowerCase().replace(/_/g, ' ')
                      foundSettingObj = qSwitch.settings_by_zone.find((sz) => {
                        const szZoneStr = String(sz.zone || '').toLowerCase().replace(/_/g, ' ')
                        return szZoneStr === targetZoneStr
                      })
                      if (!foundSettingObj) {
                        foundSettingObj = qSwitch.settings_by_zone.find((sz) => {
                          const szZoneStr = String(sz.zone || '').toLowerCase().replace(/_/g, ' ')
                          return (
                            szZoneStr.includes(targetZoneStr) ||
                            targetZoneStr.includes(szZoneStr) ||
                            (szZoneStr.includes('malar') && targetZoneStr.includes('malar')) ||
                            (szZoneStr.includes('temple') && targetZoneStr.includes('temple')) ||
                            (szZoneStr.includes('forehead') && targetZoneStr.includes('forehead')) ||
                            (szZoneStr.includes('perioral') && targetZoneStr.includes('perioral')) ||
                            (szZoneStr.includes('periocular') && targetZoneStr.includes('periocular')) ||
                            (szZoneStr.includes('cheek') && targetZoneStr.includes('cheek')) ||
                            (szZoneStr.includes('chin') && targetZoneStr.includes('chin')) ||
                            (szZoneStr.includes('nose') && targetZoneStr.includes('nose'))
                          )
                        })
                      }
                      if (!foundSettingObj) {
                        foundSettingObj = qSwitch.settings_by_zone[0]
                      }
                    } else if (qSwitch.wavelength_nm !== undefined || qSwitch.energy_mj !== undefined) {
                      foundSettingObj = qSwitch
                    }
                  }

                  if (!foundSettingObj) {
                    if (z.regional_override_setting && typeof z.regional_override_setting === 'object') {
                      foundSettingObj = z.regional_override_setting
                    } else if (z.base_zone_setting && typeof z.base_zone_setting === 'object') {
                      foundSettingObj = z.base_zone_setting
                    }
                  }

                  settingsStr = formatSettingString(foundSettingObj)

                  const activeCoverage = z.coverage_instruction || 'Standard full-zone passes.'
                  
                  let activeEndpoint = ''
                  if (Array.isArray(z.endpoint_rules) && z.endpoint_rules.length > 0) {
                    activeEndpoint = z.endpoint_rules.map(formatSentenceCase).join(' • ')
                  } else {
                    activeEndpoint = formatSentenceCase(z.endpoint || 'Mild erythema.')
                  }

                  let exclusionsStr = ''
                  if (Array.isArray(z.excluded_subregions) && z.excluded_subregions.length > 0) {
                    exclusionsStr = z.excluded_subregions.join(', ')
                  }

                  const avoidInstruction = z.avoid_zone_instruction || ''

                  let stepText = `Treat Zone: ${z.zone.toUpperCase()}\n`
                  if (z.selected_treatment || z.zone_strategy_type) {
                    stepText += `Treatment: ${formatLabelLocal(z.selected_treatment || z.zone_strategy_type)}\n`
                  }
                  stepText += `Settings: ${settingsStr}\n`
                  stepText += `Coverage Instruction: ${activeCoverage}\n`
                  stepText += `Endpoint Target: ${activeEndpoint}`
                  if (exclusionsStr) {
                    stepText += `\nExclusion Zones: ${exclusionsStr}`
                  }
                  if (avoidInstruction) {
                    stepText += `\nAvoid Instruction: ${avoidInstruction}`
                  }

                  mappedSteps.push({
                    step_number: globalStepIdx++,
                    duration: '5 mins',
                    ingredients_equipments: equipments,
                    how_to_do: stepText,
                  })
                })
                return
              }
            }

            // Resolve matching operation if any
            const op = execStep.operation_id 
              ? operations.find(o => o.operation_id === execStep.operation_id)
              : null

            let equipments = []
            if (op) {
              if (op.protocol_id) {
                equipments.push(formatLabelLocal(op.protocol_id))
              } else if (op.modality_id) {
                equipments.push(formatLabelLocal(op.modality_id))
              }
              if (op.parameters?.active_id) {
                equipments.push(`Active: ${formatLabelLocal(op.parameters.active_id)}`)
              }
            } else if (execStep.settings_or_product_id) {
              equipments.push(formatLabelLocal(execStep.settings_or_product_id))
            }
            const durationText = execStep.duration_minutes 
              ? `${execStep.duration_minutes} mins` 
              : op?.parameters?.duration_minutes 
                ? `${op.parameters.duration_minutes} mins` 
                : '5 mins'

            let stepText = `Step: ${formatLabelLocal(execStep.step_type).toUpperCase()}\n`
            if (execStep.zones && execStep.zones.length > 0) {
              stepText += `Apply To: ${execStep.zones.map(formatLabelLocal).join(', ')}\n`
            }
            
            if (execStep.instruction || execStep.instructions) {
              stepText += `Instructions: ${execStep.instruction || execStep.instructions}\n`
            }

            if (op) {
              stepText += `Modality: ${formatLabelLocal(op.modality_id)}\n`
              if (op.parameters) {
                if (op.modality_id === 'microneedling_with_active' && op.parameters.depth_by_region_mm) {
                  const depthParts = Object.entries(op.parameters.depth_by_region_mm).map(
                    ([region, depth]) => `${formatLabelLocal(region)}: ${depth}mm`
                  )
                  stepText += `Depth Map: ${depthParts.join(' • ')}\n`
                } else {
                  const formatSettingString = (settingObj) => {
                    if (!settingObj || typeof settingObj !== 'object') return 'NA'
                    const parts = []
                    if (settingObj.wavelength_nm !== undefined && settingObj.wavelength_nm !== null) {
                      parts.push(`${settingObj.wavelength_nm}nm`)
                    }
                    if (settingObj.energy_mj !== undefined && settingObj.energy_mj !== null) {
                      parts.push(`${settingObj.energy_mj}mJ`)
                    }
                    if (settingObj.fluence_j_cm2 !== undefined && settingObj.fluence_j_cm2 !== null) {
                      parts.push(`${settingObj.fluence_j_cm2} J/cm²`)
                    }
                    if (settingObj.passes !== undefined && settingObj.passes !== null) {
                      parts.push(`${settingObj.passes} ${settingObj.passes > 1 ? 'passes' : 'pass'}`)
                    }
                    if (settingObj.frequency_hz !== undefined && settingObj.frequency_hz !== null) {
                      parts.push(`(${settingObj.frequency_hz}Hz)`)
                    }
                    if (settingObj.duration_minutes !== undefined && settingObj.duration_minutes !== null) {
                      parts.push(`${settingObj.duration_minutes} mins`)
                    }
                    return parts.length > 0 ? parts.join(' • ') : 'NA'
                  }
                  stepText += `Parameters: ${formatSettingString(op.parameters)}\n`
                }
              }
              if (op.target_location_text) {
                stepText += `Target Area: ${op.target_location_text}\n`
              }
              if (Array.isArray(op.target_regions) && op.target_regions.length > 0) {
                stepText += `Target Zones: ${op.target_regions.map(formatLabelLocal).join(', ')}\n`
              }
              if (Array.isArray(op.excluded_regions) && op.excluded_regions.length > 0) {
                stepText += `Exclusion Zones: ${op.excluded_regions.map(formatLabelLocal).join(', ')}\n`
              }
              if (op.exclusion_instruction) {
                stepText += `Exclusion Instructions: ${op.exclusion_instruction}\n`
              }
              if (op.endpoint) {
                const formatSentenceCase = (str) => {
                  if (!str) return ''
                  if (typeof str !== 'string') return String(str)
                  const clean = str.replace(/_/g, ' ')
                  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase()
                }
                stepText += `Endpoint Target: ${formatSentenceCase(op.endpoint)}\n`
              }
              if (Array.isArray(op.stop_conditions) && op.stop_conditions.length > 0) {
                stepText += `Stop Conditions:\n${op.stop_conditions.map(c => `  - ${c}`).join('\n')}\n`
              }
              if (Array.isArray(op.aftercare) && op.aftercare.length > 0) {
                stepText += `Step Aftercare:\n${op.aftercare.map(a => `  - ${a}`).join('\n')}\n`
              }
            } else if (execStep.endpoint_or_completion_rule) {
              stepText += `Completion Rule: ${execStep.endpoint_or_completion_rule}`
            }

            mappedSteps.push({
              step_number: globalStepIdx++,
              duration: durationText,
              ingredients_equipments: equipments,
              how_to_do: stepText.trim(),
            })
          })
        } else if (
          Array.isArray(zoneSeqSrc) &&
          zoneSeqSrc.length > 0 &&
          (hasLaserModality || s.fixed_protocol?.q_switch?.use)
        ) {
          const activeZones = zoneSeqSrc.filter(
            (z) => {
              const strategy = String(z.zone_strategy_type || z.selected_treatment || '').toLowerCase()
              return !strategy.includes('defer') && !strategy.includes('exclude') && !strategy.includes('avoid')
            }
          )
          if (activeZones.length > 0) {
            hasZoneSequence = true
            mappedSteps = activeZones.map((z, idx) => {
              let settingsStr = ''
              let equipments = []
              
              if (z.selected_treatment) {
                equipments.push(z.selected_treatment)
              } else {
                equipments.push('Laser Toning')
              }

              const formatSentenceCase = (str) => {
                if (!str) return ''
                if (typeof str !== 'string') return String(str)
                const clean = str.replace(/_/g, ' ')
                return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase()
              }

              const getFluence = (f, e) => {
                const val = Number(f)
                if (f !== undefined && f !== null && !isNaN(val) && val > 0) return val
                const energy = Number(e)
                if (e !== undefined && e !== null && !isNaN(energy) && energy > 0) return (energy / 1000).toFixed(2)
                return null
              }

              const formatSettingString = (settingObj) => {
                if (!settingObj || typeof settingObj !== 'object') return 'NA'
                const parts = []
                if (settingObj.wavelength_nm !== undefined && settingObj.wavelength_nm !== null) {
                  parts.push(`${settingObj.wavelength_nm}nm`)
                }
                if (settingObj.energy_mj !== undefined && settingObj.energy_mj !== null) {
                  parts.push(`${settingObj.energy_mj}mJ`)
                }
                const fVal = getFluence(settingObj.fluence_j_cm2, settingObj.energy_mj)
                if (fVal) {
                  parts.push(`${fVal} J/cm²`)
                }
                if (settingObj.passes !== undefined && settingObj.passes !== null) {
                  parts.push(`${settingObj.passes} ${settingObj.passes > 1 ? 'passes' : 'pass'}`)
                }
                if (settingObj.frequency_hz !== undefined && settingObj.frequency_hz !== null) {
                  parts.push(`(${settingObj.frequency_hz}Hz)`)
                }
                return parts.length > 0 ? parts.join(' • ') : 'NA'
              }

              const qSwitch = s.fixed_protocol?.q_switch
              let foundSettingObj = null

              if (qSwitch && qSwitch.use) {
                if (Array.isArray(qSwitch.settings_by_zone) && qSwitch.settings_by_zone.length > 0) {
                  const targetZoneStr = String(z.zone || '').toLowerCase().replace(/_/g, ' ')
                  foundSettingObj = qSwitch.settings_by_zone.find((sz) => {
                    const szZoneStr = String(sz.zone || '').toLowerCase().replace(/_/g, ' ')
                    return szZoneStr === targetZoneStr
                  })
                  if (!foundSettingObj) {
                    foundSettingObj = qSwitch.settings_by_zone.find((sz) => {
                      const szZoneStr = String(sz.zone || '').toLowerCase().replace(/_/g, ' ')
                      return (
                        szZoneStr.includes(targetZoneStr) ||
                        targetZoneStr.includes(szZoneStr) ||
                        (szZoneStr.includes('malar') && targetZoneStr.includes('malar')) ||
                        (szZoneStr.includes('temple') && targetZoneStr.includes('temple')) ||
                        (szZoneStr.includes('forehead') && targetZoneStr.includes('forehead')) ||
                        (szZoneStr.includes('perioral') && targetZoneStr.includes('perioral')) ||
                        (szZoneStr.includes('periocular') && targetZoneStr.includes('periocular')) ||
                        (szZoneStr.includes('cheek') && targetZoneStr.includes('cheek')) ||
                        (szZoneStr.includes('chin') && targetZoneStr.includes('chin')) ||
                        (szZoneStr.includes('nose') && targetZoneStr.includes('nose'))
                      )
                    })
                  }
                  if (!foundSettingObj) {
                    foundSettingObj = qSwitch.settings_by_zone[0]
                  }
                } else if (qSwitch.wavelength_nm !== undefined || qSwitch.energy_mj !== undefined) {
                  foundSettingObj = qSwitch
                }
              }

              if (!foundSettingObj) {
                if (z.regional_override_setting && typeof z.regional_override_setting === 'object') {
                  foundSettingObj = z.regional_override_setting
                } else if (z.base_zone_setting && typeof z.base_zone_setting === 'object') {
                  foundSettingObj = z.base_zone_setting
                }
              }

              settingsStr = formatSettingString(foundSettingObj)

              const activeCoverage = z.coverage_instruction || 'Standard full-zone passes.'
              
              let activeEndpoint = ''
              if (Array.isArray(z.endpoint_rules) && z.endpoint_rules.length > 0) {
                activeEndpoint = z.endpoint_rules.map(formatSentenceCase).join(' • ')
              } else {
                activeEndpoint = formatSentenceCase(z.endpoint || 'Mild erythema.')
              }

              let exclusionsStr = ''
              if (Array.isArray(z.excluded_subregions) && z.excluded_subregions.length > 0) {
                exclusionsStr = z.excluded_subregions.join(', ')
              }

              const avoidInstruction = z.avoid_zone_instruction || ''

              let stepText = `Treat Zone: ${z.zone.toUpperCase()}\n`
              if (z.selected_treatment || z.zone_strategy_type) {
                stepText += `Treatment: ${formatLabelLocal(z.selected_treatment || z.zone_strategy_type)}\n`
              }
              stepText += `Settings: ${settingsStr}\n`
              stepText += `Coverage Instruction: ${activeCoverage}\n`
              stepText += `Endpoint Target: ${activeEndpoint}`
              if (exclusionsStr) {
                stepText += `\nExclusion Zones: ${exclusionsStr}`
              }
              if (avoidInstruction) {
                stepText += `\nAvoid Instruction: ${avoidInstruction}`
              }

              return {
                step_number: idx + 1,
                duration: '5 mins',
                ingredients_equipments: equipments,
                how_to_do: stepText,
              }
            })
          }
        }

        if (!hasCustomSequence && !hasZoneSequence) {
          let rawSteps = s.fixed_protocol?.steps || s.steps || []
          if (rawSteps.length === 0) {
            let stepIdx = 1

            // 1. Double Cleanse
            mappedSteps.push({
              step_number: stepIdx++,
              duration: '5 mins',
              ingredients_equipments: ['Cleanser'],
              how_to_do:
                'Perform a thorough double cleanse of the face to prepare the skin barrier for treatment.',
            })

            // 2. Peel
            if (s.fixed_protocol?.peel?.use) {
              const p = s.fixed_protocol.peel
              mappedSteps.push({
                step_number: stepIdx++,
                duration: `${p.contact_time_minutes || 5} mins`,
                ingredients_equipments: [formatLabelLocal(p.peel_name || 'chemical_peel')],
                how_to_do: `Apply ${formatLabelLocal(p.peel_name || 'chemical_peel')} evenly across the face. Leave on for ${p.contact_time_minutes || 5} minutes. Monitor client comfort and erythema endpoint closely.`,
              })
              if (p.neutralization_required) {
                mappedSteps.push({
                  step_number: stepIdx++,
                  duration: '2 mins',
                  ingredients_equipments: ['Neutralizer'],
                  how_to_do:
                    'Apply neutralizing solution to deactivate the peel acid, then rinse thoroughly with cool water.',
                })
              }
            }
            // 3. Microneedling
            if (s.fixed_protocol?.microneedling?.use) {
              const m = s.fixed_protocol.microneedling
              const activesList = Array.isArray(m.actives)
                ? m.actives.map((a) => formatLabelLocal(a)).join(', ')
                : ''
              mappedSteps.push({
                step_number: stepIdx++,
                duration: '15 mins',
                ingredients_equipments: [m.device || 'Microneedling Device', ...(m.actives || [])],
                how_to_do: `Perform microneedling using ${m.device || 'device'}. Infuse active ingredients: ${activesList || 'treatment serum'}.`,
              })
            }

            // 4. LED
            if (s.fixed_protocol?.led?.use) {
              const l = s.fixed_protocol.led
              mappedSteps.push({
                step_number: stepIdx++,
                duration: '10 mins',
                ingredients_equipments: [formatLabelLocal(l.mode || 'red_led')],
                how_to_do: `Position the LED light device set to ${formatLabelLocal(l.mode || 'red_led')} mode for ${l.role || 'calming support'}.`,
              })
            }

            // 5. Post Care
            mappedSteps.push({
              step_number: stepIdx++,
              duration: '3 mins',
              ingredients_equipments: ['Moisturizer', 'Sunscreen'],
              how_to_do:
                'Apply a soothing barrier repair cream followed by a physical broad-spectrum sunscreen to protect the skin.',
            })
          } else {
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
        }

        return {
          id: s.id || s.session_number,
          session_number: s.session_number,
          title: s.goal || 'Pigmentation Session',
          treatment_time: '45 mins',
          week: s.timing?.replace('week_', '') || s.session_number,
          preparations_checklist_for_therapist:
            s.provider_protocol?.pre_treatment_checklist ||
            s.fixed_protocol?.preparations_checklist_for_therapist ||
            [],
          concerns_addressed: [s.goal || 'Pigmentation treatment'],
          steps: mappedSteps,
          provider_protocol: s.provider_protocol || null,
          status: s.status || 'pending',
        }
      }),
    }
  }

  const matchedSession = store.treatmentPlan?.treatments?.find(
    (s) => Number(s.id) === Number(sessionID) || Number(s.session_number) === Number(sessionID),
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
.border-left-indigo {
  border-left: 4px solid #4f46e5;
}
.shadow-2xs {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
</style>
