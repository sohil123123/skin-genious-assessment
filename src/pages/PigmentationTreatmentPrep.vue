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
            <span class="text-xl font-light tracking-wider">AI AESTHETICS (PIGMENTATION)</span>
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
              · Fitzpatrick Type: {{ pigmentationStore.formData?.fitz || '—' }}
            </div>
          </q-card-section>
        </q-card>

        <q-card flat class="q-pa-md">
          <div class="header mb-4">
            <div class="text-h5 text-weight-bold text-black">
              Session {{ sessionID }} Preparation
            </div>
            <div class="text-subtitle2 text-grey-7">
              {{ session?.title || 'Pigmentation Session' }}
            </div>
          </div>

          <!-- PRE-SESSION VALIDATION LAYER (Step 15) -->
          <div v-if="!validationCompleted && sessionID > 1" class="q-mb-md">
            <q-card flat bordered class="border-amber rounded-lg">
              <q-card-section class="bg-amber-1 text-amber-10">
                <div class="text-h6 flex items-center gap-2">
                  <q-icon name="shield" color="amber-8" />
                  🛡️ Pre-Session Clinical Safety Validation (Session {{ sessionID }})
                </div>
                <div class="text-caption text-amber-9">
                  Since this is a planned future session, you must confirm the patient's clinical status before proceeding.
                </div>
              </q-card-section>
              
              <q-card-section class="q-col-gutter-y-md">
                <div class="text-subtitle2 text-weight-bold text-grey-8">Please check if any of the following are present:</div>
                
                <div class="row q-col-gutter-sm">
                  <div class="col-12 col-md-6">
                    <q-checkbox v-model="preSessionVal.active_burning_or_sensitivity" label="Active burning, stinging, or sensitivity today" />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-checkbox v-model="preSessionVal.prolonged_erythema_from_previous_session" label="Prolonged redness (erythema) from previous session" />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-checkbox v-model="preSessionVal.open_skin_or_infection" label="Open skin, barrier disruption, or active infection" />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-checkbox v-model="preSessionVal.recent_sunburn" label="Recent sunburn or intense UV exposure" />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-checkbox v-model="preSessionVal.new_or_changing_lesion" label="New or changing atypical lesion in treatment area" />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-checkbox v-model="preSessionVal.unexpected_pigment_worsening" label="Unexpected darkening or worsening of pigmentation" />
                  </div>
                </div>

                <q-separator class="q-my-md" />

                <div class="row items-center justify-between">
                  <div>
                    <div class="text-subtitle2 text-weight-bold">Doctor Decision Recommendation:</div>
                    <div class="text-caption text-grey-7">
                      Suggested action based on inputs: 
                      <strong class="text-primary">{{ formatLabel(suggestedDecision) }}</strong>
                    </div>
                  </div>
                  <div>
                    <q-select
                      v-model="preSessionVal.doctor_decision"
                      :options="decisionOptions"
                      outlined
                      dense
                      options-dense
                      style="min-width: 250px"
                      emit-value
                      map-options
                    />
                  </div>
                </div>

                <!-- CLINICAL ADJUSTMENT PANEL -->
                <div v-if="preSessionVal.doctor_decision === 'approved_with_minor_adjustment'" class="bg-blue-1 text-blue-10 q-pa-md rounded-lg border border-blue-3 q-mt-md">
                  <div class="text-weight-bold text-subtitle2 q-mb-sm">⚙️ Parameter Minor Adjustments</div>
                  <div class="row q-col-gutter-sm">
                    <div class="col-12 col-sm-6" v-if="session?.fixed_protocol?.q_switch?.use">
                      <q-input v-model="adjustments.q_switch.energy_mj" type="number" label="Q-Switch Energy (mJ)" outlined dense />
                    </div>
                    <div class="col-12 col-sm-6" v-if="session?.fixed_protocol?.q_switch?.use">
                      <q-input v-model="adjustments.q_switch.fluence_j_cm2" type="number" step="0.01" label="Fluence (J/cm²)" outlined dense />
                    </div>
                    <div class="col-12 col-sm-6" v-if="session?.fixed_protocol?.q_switch?.use">
                      <q-input v-model="adjustments.q_switch.passes" type="number" label="Passes" outlined dense />
                    </div>
                    <div class="col-12 col-sm-6" v-if="session?.fixed_protocol?.peel?.use">
                      <q-input v-model="adjustments.peel.contact_time_minutes" type="number" label="Peel Contact Time (mins)" outlined dense />
                    </div>
                  </div>
                </div>

                <!-- DECISION IMPLICATIONS AND WARNINGS -->
                <div v-if="preSessionVal.doctor_decision === 'requires_early_reassessment'" class="bg-red-1 text-red-10 q-pa-md rounded-lg border border-red-3 flex items-start gap-2 q-mt-md">
                  <q-icon name="error" size="24px" class="q-mt-xs" />
                  <div>
                    <div class="text-weight-bold text-subtitle2">Early Reassessment Required</div>
                    <div>This clinical finding requires performing a formal reassessment (Stage 5) to evaluate the treatment trajectory and generate an updated block plan.</div>
                    <q-btn label="Go to Reassessment Page" color="negative" class="q-mt-sm" @click="goToReassess" no-caps unelevated />
                  </div>
                </div>

                <div v-else-if="preSessionVal.doctor_decision === 'deferred'" class="bg-amber-1 text-amber-10 q-pa-md rounded-lg border border-amber-3 flex items-start gap-2 q-mt-md">
                  <q-icon name="warning" size="24px" class="q-mt-xs" />
                  <div>
                    <div class="text-weight-bold text-subtitle2">Session Deferral Indicated</div>
                    <div>Do not proceed with active energy procedures or chemical peels today. Initiate barrier repair protocol or wait for symptoms to clear.</div>
                  </div>
                </div>

              </q-card-section>
              
              <q-card-actions align="right" class="q-pb-md q-px-md">
                <q-btn label="Confirm Safety Validation" color="primary" @click="confirmPreSessionValidation" :disable="preSessionVal.doctor_decision === 'requires_early_reassessment'" no-caps unelevated />
              </q-card-actions>
            </q-card>
          </div>

          <div v-else>
            <!-- Safety Warning Banner -->
            <div
              v-if="!isSafetyChecked"
              class="bg-red-1 text-red-10 q-pa-md rounded-lg q-mb-md border border-red-3 flex items-start gap-2"
            >
              <q-icon name="warning" size="24px" class="q-mt-xs" />
              <div>
                <div class="text-weight-bold text-subtitle1">Safety Checklist Incomplete</div>
                <div>
                  All pre-treatment safety checks are mandatory and must be verified by the therapist
                  before starting the treatment.
                </div>
              </div>
            </div>

            <div class="row">
              <!-- Safety Checklist (full width) -->
              <div class="col-12">
                <!-- Safety Gates Checklist -->
                <q-card flat bordered class="rounded-lg q-mb-md">
                  <q-card-section class="text-white bg-red-8">
                    <div class="text-h6 flex items-center gap-2">
                      <q-icon name="security" />
                      📋 Pre-treatment Safety Checklist (Mandatory)
                    </div>
                  </q-card-section>
                  <q-card-section class="q-py-sm">
                    <div
                      v-for="(item, idx) in safetyChecklist"
                      :key="'safety-' + idx"
                      class="q-py-xs border-b last-no-border"
                    >
                      <q-checkbox
                        v-model="checkedSafety"
                        :val="item"
                        color="negative"
                        size="md"
                        :label="item"
                        :class="{
                          'text-dark text-weight-medium': checkedSafety.includes(item),
                          'text-grey-8': !checkedSafety.includes(item),
                        }"
                      />
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </div>
        </q-card>

        <q-separator class="q-my-lg" v-if="validationCompleted" />

        <div class="q-px-lg" v-if="validationCompleted">
          <div class="text-dark q-mb-sm text-subtitle1 text-weight-medium">
            Progress: {{ checkedSafety.length }} / {{ safetyChecklist.length }} Checks Completed
          </div>
          <q-linear-progress
            :value="progress"
            color="teal"
            track-color="grey-3"
            rounded
            size="16px"
            class="q-mb-md"
          />
          <div class="q-py-md text-center flex justify-center gap-4">
            <q-btn
              label="Start Session Steps"
              class="gredient text-white px-8"
              size="lg"
              rounded
              :disable="!isSafetyChecked"
              @click="startSteps"
              no-caps
            />
            <q-btn
              flat
              label="Back to Plan"
              size="lg"
              rounded
              class="text-grey-8"
              @click="backToPlan"
              no-caps
            />
          </div>
        </div>
      </div>
    </div>
  </q-page>

  <q-page-sticky position="bottom-right" :offset="[18, 18]">
    <q-btn
      @click="() => handleAudioAction(text)"
      fab
      :disable="audioStatus === 'loading' || !commonStore.isAudioEnabled"
      :color="
        !commonStore.isAudioEnabled ? 'grey' : audioStatus === 'playing' ? 'negative' : 'positive'
      "
      :icon="
        !commonStore.isAudioEnabled
          ? 'volume_off'
          : audioStatus === 'playing'
            ? 'pause'
            : 'play_arrow'
      "
      :loading="audioStatus === 'loading'"
    >
      <q-tooltip v-if="!commonStore.isAudioEnabled">Audio is globally disabled</q-tooltip>
    </q-btn>
  </q-page-sticky>
</template>

<script setup>
import { onMounted, computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTreatmentFlowStore } from 'stores/treatmentFlow'
import { useAssessmentStore } from 'src/stores/assessmentStore'
import { usePigmentationStore } from 'src/stores/pigmentationStore'
import { useCommonStore } from 'src/stores/commonStore'
import { useElevenLabsAudio } from 'src/composables/useElevenLabsAudio'

const { audioStatus, handleAudioAction } = useElevenLabsAudio()

const assessmentStore = useAssessmentStore()
const pigmentationStore = usePigmentationStore()
const commonStore = useCommonStore()

const route = useRoute()
const router = useRouter()
const store = useTreatmentFlowStore()

const sessionParam = route.params.session_id
const sessionID = sessionParam ? Number(sessionParam) : 1

const checkedSafety = ref([])

// Pre-session validation layer state
const validationCompleted = ref(false)
const preSessionVal = ref({
  active_burning_or_sensitivity: false,
  prolonged_erythema_from_previous_session: false,
  open_skin_or_infection: false,
  recent_sunburn: false,
  new_or_changing_lesion: false,
  unexpected_pigment_worsening: false,
  doctor_decision: 'approved_without_change'
})

const decisionOptions = [
  { label: 'Approved without change', value: 'approved_without_change' },
  { label: 'Approved with minor adjustment', value: 'approved_with_minor_adjustment' },
  { label: 'Requires early reassessment', value: 'requires_early_reassessment' },
  { label: 'Deferred', value: 'deferred' }
]

const adjustments = ref({
  q_switch: {
    energy_mj: 300,
    fluence_j_cm2: 0.3,
    passes: 1
  },
  peel: {
    contact_time_minutes: 5
  }
})

const suggestedDecision = computed(() => {
  if (preSessionVal.value.unexpected_pigment_worsening) {
    return 'requires_early_reassessment'
  }
  if (
    preSessionVal.value.open_skin_or_infection ||
    preSessionVal.value.recent_sunburn ||
    preSessionVal.value.new_or_changing_lesion
  ) {
    return 'deferred'
  }
  if (
    preSessionVal.value.active_burning_or_sensitivity ||
    preSessionVal.value.prolonged_erythema_from_previous_session
  ) {
    return 'approved_with_minor_adjustment'
  }
  return 'approved_without_change'
})

watch(suggestedDecision, (newVal) => {
  preSessionVal.value.doctor_decision = newVal
})

onMounted(async () => {
  await pigmentationStore.getSingleAssessment(route.params.assessment_id)

  const matchedSession = pigmentationStore.lastPlan?.sessions?.find(
    (s) => Number(s.session_number) === Number(sessionID)
  )

  if (matchedSession) {
    if (matchedSession.pre_session_validation) {
      preSessionVal.value = { ...matchedSession.pre_session_validation }
      validationCompleted.value = true
    } else if (sessionID === 1) {
      validationCompleted.value = true
    }

    if (matchedSession.fixed_protocol?.q_switch?.use) {
      adjustments.value.q_switch = { ...matchedSession.fixed_protocol.q_switch }
    }
    if (matchedSession.fixed_protocol?.peel?.use) {
      adjustments.value.peel = { ...matchedSession.fixed_protocol.peel }
    }
  } else if (sessionID === 1) {
    validationCompleted.value = true
  }

  // Backwards compatibility and sync with treatmentFlowStore
  if (pigmentationStore.lastPlan && pigmentationStore.lastPlan.sessions) {
    store.treatmentPlan = {
      treatments: pigmentationStore.lastPlan.sessions.map((s) => {
        let mappedSteps = []
        const hasLaserModality = s.selected_modalities?.some(
          (m) =>
            m.includes('q_switch') ||
            m.includes('laser') ||
            m.includes('toning') ||
            m.includes('ndyag'),
        )

        let hasZoneSequence = false
        const zoneSeqSrc = s.provider_protocol?.zone_sequence
        if (
          Array.isArray(zoneSeqSrc) &&
          zoneSeqSrc.length > 0 &&
          (hasLaserModality || s.fixed_protocol?.q_switch?.use)
        ) {
          const activeZones = zoneSeqSrc.filter(
            (z) =>
              z.zone_strategy_type !== 'exclude_from_treatment' &&
              z.zone_strategy_type !== 'defer_zone',
          )
          if (activeZones.length > 0) {
            hasZoneSequence = true
            mappedSteps = activeZones.map((z, idx) => {
              let settingsStr = ''
              let equipments = []
              let activeCoverage = 'Standard full-zone passes.'
              let activeEndpoint = 'Mild erythema.'

              const formatSentenceCase = (str) => {
                if (!str) return ''
                if (typeof str !== 'string') return String(str)
                const clean = str.replace(/_/g, ' ')
                return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase()
              }

              if (z.regional_override_setting && (z.regional_override_setting.wavelength_nm || z.regional_override_setting.energy_mj)) {
                const r = z.regional_override_setting
                settingsStr = `${r.wavelength_nm}nm • ${r.energy_mj}mJ • ${r.fluence_j_cm2} J/cm² • ${r.passes} passes`
                equipments.push(`Laser (${r.wavelength_nm}nm)`)
                activeCoverage = r.coverage_instruction || 'Standard full-zone passes.'
                activeEndpoint = formatSentenceCase(r.endpoint || 'Mild erythema.')
              } else if (z.base_zone_setting) {
                const b = z.base_zone_setting
                settingsStr = `${b.wavelength_nm}nm • ${b.energy_mj}mJ • ${b.fluence_j_cm2} J/cm² • ${b.passes} passes (${b.frequency_hz}Hz)`
                equipments.push(`Laser (${b.wavelength_nm}nm)`)
                activeCoverage = b.coverage_instruction || z.coverage_instruction || 'Standard full-zone passes.'
                activeEndpoint = formatSentenceCase(b.endpoint || z.endpoint || 'Mild erythema.')
              } else {
                settingsStr = 'Standard protocol settings'
                equipments.push('Laser')
                activeCoverage = z.coverage_instruction || 'Standard full-zone passes.'
                activeEndpoint = formatSentenceCase(z.endpoint || 'Mild erythema.')
              }

              return {
                step_number: idx + 1,
                duration: '5 mins',
                ingredients_equipments: equipments,
                how_to_do: `Treat Zone: ${z.zone.toUpperCase()}\nStrategy: ${formatLabel(z.zone_strategy_type || '')}\nSettings: ${settingsStr}\nCoverage Instruction: ${activeCoverage}\nEndpoint Target: ${activeEndpoint}`,
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
          preparations_checklist_for_therapist:
            s.fixed_protocol?.preparations_checklist_for_therapist || [],
          concerns_addressed: [s.goal || 'Pigmentation treatment'],
          steps: mappedSteps,
          provider_protocol: s.provider_protocol || null,
          status: s.status || 'pending',
        }
      }),
    }
  }
})

const session = computed(() => {
  if (!store.treatmentPlan?.treatments) return null
  return store.treatmentPlan.treatments.find(
    (s) => Number(s.id) === Number(sessionID) || Number(s.session_number) === Number(sessionID),
  )
})

// Use AI-generated pre_treatment_checklist if available, else use default safety items
const safetyChecklist = computed(() => {
  const aiList = session.value?.provider_protocol?.pre_treatment_checklist
  if (Array.isArray(aiList) && aiList.length > 0) return aiList
  return [
    'Doctor sign-off (mandatory)',
    'Confirm no active burning/sensitivity today (history: none)',
    'Confirm no sunburn/active infection/open skin',
    'Confirm no recent outside clinic aggressive peel/laser in last 14 days',
    'Mark suspect lesions & set no-fire safety margin (minimum 5mm)',
  ]
})

const text = computed(
  () =>
    session.value?.script ??
    'Please complete the pre-treatment checklist and prepare the required equipment.',
)

const isSafetyChecked = computed(() => checkedSafety.value.length === safetyChecklist.value.length)
const totalItems = computed(() => safetyChecklist.value.length)
const completedTotal = computed(() => checkedSafety.value.length)
const progress = computed(() => (totalItems.value ? completedTotal.value / totalItems.value : 0))

async function startSteps() {
  const realSessionId = session.value?.id || sessionID
  // Set treatment session to in progress
  await assessmentStore.updateTreatmentSessionStatus(realSessionId, 'in_progress')

  // Navigate to steps
  router.push({
    name: 'PigmentationTreatmentSteps',
    params: {
      user_id: route.params.user_id,
      assessment_id: pigmentationStore.id,
      session_id: realSessionId,
      step: 1,
      ...(route.params.appointment_id && { appointment_id: route.params.appointment_id }),
    },
  })
}

function backToPlan() {
  router.push({
    name: 'pigmentation-assessment',
    params: {
      user_id: route.params.user_id,
      assessment_id: pigmentationStore.id,
      ...(route.params.appointment_id && { appointment_id: route.params.appointment_id }),
    },
  })
}
function goToReassess() {
  router.push({
    name: 'PigmentationReassessment',
    params: {
      user_id: route.params.user_id,
      assessment_id: pigmentationStore.id,
      ...(route.params.appointment_id && { appointment_id: route.params.appointment_id }),
    }
  })
}

async function confirmPreSessionValidation() {
  const matchedSession = pigmentationStore.lastPlan?.sessions?.find(
    (s) => Number(s.session_number) === Number(sessionID)
  )
  if (matchedSession) {
    if (preSessionVal.value.doctor_decision === 'approved_with_minor_adjustment') {
      if (!matchedSession.original_protocol) {
        matchedSession.original_protocol = JSON.parse(JSON.stringify(matchedSession.fixed_protocol))
      }
      if (matchedSession.fixed_protocol?.q_switch?.use) {
        matchedSession.fixed_protocol.q_switch.energy_mj = Number(adjustments.value.q_switch.energy_mj || matchedSession.fixed_protocol.q_switch.energy_mj)
        matchedSession.fixed_protocol.q_switch.fluence_j_cm2 = Number(adjustments.value.q_switch.fluence_j_cm2 || matchedSession.fixed_protocol.q_switch.fluence_j_cm2)
        matchedSession.fixed_protocol.q_switch.passes = Number(adjustments.value.q_switch.passes || matchedSession.fixed_protocol.q_switch.passes)
      }
      if (matchedSession.fixed_protocol?.peel?.use) {
        matchedSession.fixed_protocol.peel.contact_time_minutes = Number(adjustments.value.peel.contact_time_minutes || matchedSession.fixed_protocol.peel.contact_time_minutes)
      }
      matchedSession.protocol_version = (matchedSession.protocol_version || 1) + 1
    }

    matchedSession.pre_session_validation = {
      session_number: sessionID,
      planned_protocol_available: true,
      ...preSessionVal.value
    }
  }

  pigmentationStore.pre_session_validation = {
    session_number: sessionID,
    ...preSessionVal.value
  }

  await pigmentationStore.updateAssessment()
  validationCompleted.value = true
}

function formatLabel(str) {
  if (!str) return ''
  return str
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
</script>

<style scoped>
.border-b {
  border-bottom: 1px solid #f1f5f9;
}
.last-no-border:last-child {
  border-bottom: none;
}
.gredient {
  background: linear-gradient(90deg, #0f766e, #0d9488);
}
</style>
