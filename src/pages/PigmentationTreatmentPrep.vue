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
        </q-card>

        <q-separator class="q-my-lg" />

        <div class="q-px-lg">
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
import { onMounted, computed, ref } from 'vue'
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

onMounted(async () => {
  await pigmentationStore.getSingleAssessment(route.params.assessment_id)

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
                how_to_do: `Treat Zone: ${z.zone.toUpperCase()}\nStrategy: ${formatLabel(z.zone_strategy_type || '')}\nSettings: ${settingsStr}\nCoverage Instruction: ${z.coverage_instruction || z.base_zone_setting?.coverage_instruction || 'Standard full-zone passes.'}\nEndpoint Target: ${z.endpoint || z.base_zone_setting?.endpoint || 'Mild erythema.'}`,
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
