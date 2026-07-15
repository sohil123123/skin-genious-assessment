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
        </div>

        <q-card flat>
          <div class="row items-center justify-between">
            <div>
              <h4 class="q-my-md text-weight-bold text-black flex items-center gap-2">
                <q-icon name="check_circle" color="positive" size="36px" />
                Treatment Completed!
              </h4>
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-md-12 col-sm-12">
              <q-card v-if="pigmentationStore.formData?.initials" flat bordered class="q-mb-md">
                <q-card-section class="bg-grey-1 q-py-sm q-px-md flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <q-icon name="person" size="24px" color="primary" />
                    <span class="text-subtitle1 text-weight-medium text-dark">
                      Client: <strong class="text-black">{{ pigmentationStore.formData.full_name || pigmentationStore.formData.initials }}{{ pigmentationStore.formData.mrn ? ' (ID: ' + pigmentationStore.formData.mrn + ')' : '' }}</strong>
                    </span>
                  </div>
                  <div
                    v-if="pigmentationStore.formData?.age || pigmentationStore.formData?.sex"
                    class="text-caption text-grey-7"
                  >
                    {{ pigmentationStore.formData?.sex ? pigmentationStore.formData.sex + ', ' : '' }}{{ pigmentationStore.formData?.age ? pigmentationStore.formData.age + ' years' : '' }}
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>

          <div class="row q-col-gutter-md q-mt-md">
            <!-- Left Card: Session Detail -->
            <div class="col-md-6 col-sm-12">
              <q-card flat bordered class="q-pa-md full-height rounded-lg bg-teal-0">
                <div class="text-h6 text-teal-10 text-weight-bold q-mb-xs">{{ session?.title }}</div>
                <div class="text-subtitle2 text-grey-8 q-mb-lg">Session {{ sessionID }} completed successfully.</div>
                
                <q-separator class="q-my-md" />
                
                <div class="text-body2 text-dark">
                  <strong>Total Treatment Time:</strong> {{ session?.treatment_time || '45 mins' }}
                </div>
                <div class="text-body2 text-dark q-mt-xs">
                  <strong>Recommended Post-Care:</strong> Avoid sun exposure, wear SPF 50+, apply recommended morning/evening creams.
                </div>
              </q-card>
            </div>

            <!-- Right Card: Actions -->
            <div class="col-md-6 col-sm-12">
              <q-card flat bordered class="q-pa-md full-height rounded-lg">
                <div class="text-h6 text-weight-bold text-dark q-mb-md">Follow-up &amp; Reassessment Actions</div>
                
                <!-- Book Next Appointment -->
                <div class="q-mb-md">
                  <div class="text-body2 text-grey-7 q-mb-xs">Schedule the next scheduled treatment session or final reassessment appointment:</div>
                  <q-btn
                    class="bg-teal text-white"
                    label="Book Next Appointment"
                    no-caps
                    unelevated
                    rounded
                    icon="event"
                    @click="bookNextAppointment"
                  />
                </div>

                <q-separator class="q-my-lg" />

                <!-- Complete and transfer -->
                <div>
                  <div class="text-body2 text-grey-7 q-mb-xs">Finalize and transfer patient back to the clinic head for official reassessment and goal-tracking review:</div>
                  <q-btn
                    color="black"
                    rounded
                    no-caps
                    unelevated
                    label="Complete &amp; Transfer to Clinic Head"
                    icon="swap_horiz"
                    @click="finishSession"
                  />
                </div>
              </q-card>
            </div>
          </div>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTreatmentFlowStore } from 'stores/treatmentFlow'
import { useAssessmentStore } from 'src/stores/assessmentStore'
import { usePigmentationStore } from 'src/stores/pigmentationStore'
import { LocalStorage, Loading, useQuasar } from 'quasar'
import { api } from 'src/boot/axios'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const store = useTreatmentFlowStore()
const assessmentStore = useAssessmentStore()
const pigmentationStore = usePigmentationStore()

const sessionParam = route.params.session_id
const sessionID = sessionParam ? Number(sessionParam) : 1

onMounted(async () => {
  store.currentSessionId = Number(sessionID)
  
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
          (m) => m.includes('q_switch') || m.includes('laser') || m.includes('toning') || m.includes('ndyag')
        )

        let hasZoneSequence = false
        const zoneSeqSrc = s.provider_protocol?.zone_sequence
        if (Array.isArray(zoneSeqSrc) && zoneSeqSrc.length > 0 && (hasLaserModality || s.fixed_protocol?.q_switch?.use)) {
          const activeZones = zoneSeqSrc.filter(
            (z) => z.zone_strategy_type !== 'exclude_from_treatment' && z.zone_strategy_type !== 'defer_zone'
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
                how_to_do: `Treat Zone: ${z.zone.toUpperCase()}\nStrategy: ${formatLabelLocal(z.zone_strategy_type || '')}\nSettings: ${settingsStr}\nCoverage Instruction: ${activeCoverage}\nEndpoint Target: ${activeEndpoint}`,
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
  
  const realSessionId = matchedSession?.id || sessionID
  store.currentSessionId = Number(realSessionId)

  // Mark session index as completed in treatmentFlow store
  store.markCompleted()

  // Mark appointment completed
  let apptIdToComplete = route.params.appointment_id ? Number(route.params.appointment_id) : null

  if (apptIdToComplete) {
    try {
      await assessmentStore.updateStatus(apptIdToComplete)
    } catch (err) {
      console.error('Failed to mark appointment completed:', err)
      await autoResolveAndCompleteAppointment(realSessionId)
    }
  } else {
    await autoResolveAndCompleteAppointment(realSessionId)
  }

  // Mark treatment session status completed in DB
  await assessmentStore.updateTreatmentSessionStatus(realSessionId, 'completed')
})

async function autoResolveAndCompleteAppointment(sessionId) {
  try {
    const response = await api.get('/appointments', {
      params: {
        assessment_id: route.params.assessment_id,
        treatment_session_id: sessionId,
      }
    })
    const appointments = response.data?.results || response.data || []
    const activeAppointment = appointments.find(a => a.status !== 'completed' && a.status !== 'cancelled')
    if (activeAppointment) {
      await assessmentStore.updateStatus(activeAppointment.id)
    }
  } catch (innerErr) {
    console.error('Failed to auto-resolve treatment appointment:', innerErr)
  }
}

const session = computed(() => {
  if (!store.treatmentPlan?.treatments) return null
  return store.treatmentPlan.treatments.find(
    (s) => Number(s.id) === Number(sessionID) || Number(s.session_number) === Number(sessionID)
  )
})

function bookNextAppointment() {
  const routeData = router.resolve({
    name: 'appointments',
  })
  window.open(routeData.href, '_blank')
}

function finishSession() {
  $q.dialog({
    title: 'Confirm Completion',
    message: 'Are you sure you want to complete the treatment session and transfer the patient back to the Clinic Head?',
    persistent: true,
    ok: {
      label: 'Yes, Complete Session',
      color: 'positive',
      icon: 'check_circle',
      unelevated: true,
    },
    cancel: {
      label: 'Cancel',
      color: 'negative',
      flat: true,
      icon: 'close',
    },
  })
    .onOk(async () => {
      LocalStorage.removeItem('user')
      Loading.show({
        message: 'Finalizing and redirecting to CRM...',
      })
      setTimeout(() => {
        window.location.href = `${process.env.CRM_URL}`
      }, 2000)
    })
}
</script>

<style scoped>
.bg-teal-0 {
  background-color: #f0fdfa;
  border-color: #99f6e4;
}
.text-teal-10 {
  color: #115e59;
}
</style>
