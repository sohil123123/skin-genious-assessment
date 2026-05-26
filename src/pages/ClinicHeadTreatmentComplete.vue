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

        <q-card flat>
          <div class="row items-center justify-between">
            <div>
              <h4 class="q-my-md">Post Session Actions</h4>
            </div>
          </div>
          <!-- <q-separator class="q-my-md" /> -->
          <div class="row q-col-gutter-md">
            <div class="col-md-12 col-sm-12">
              <q-card v-if="assessmentData?.name" flat bordered class="q-mb-md">
                <q-card-section class="bg-grey-1 q-py-sm q-px-md flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <q-icon name="person" size="24px" color="primary" />
                    <span class="text-subtitle1 text-weight-medium text-dark">
                      Client: <strong class="text-black">{{ assessmentData.name }}</strong>
                    </span>
                  </div>
                  <div
                    v-if="assessmentData?.age || assessmentData?.gender"
                    class="text-caption text-grey-7"
                  >
                    {{ assessmentData?.gender ? assessmentData.gender + ', ' : ''
                    }}{{ assessmentData?.age ? assessmentData.age + ' years' : '' }}
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-md-8 col-sm-12">
              <q-card flat class="section-card q-pa-md soft-bg full-height">
                <div class="text-h5 q-mb-sm">{{ session?.title }}</div>
                <div><strong>Total Session Time:</strong> {{ session?.treatment_time }}</div>
              </q-card>
            </div>

            <div class="col-md-4 col-sm-12">
              <q-card flat class="preview-card q-pa-md full-height">
                <div class="text-h6 q-mb-sm">Next appointment</div>
                <div v-if="nextSession">
                  <div class="text-caption">
                    Session {{ nextSession.session_number }} in approx {{ nextSession.week }} weeks
                  </div>
                  <div class="q-mt-xs">{{ nextSession.title }}</div>
                  <div class="q-mt-md text-subtitle2">
                    Session Duration: {{ nextSession.treatment_time }} minutes
                  </div>

                  <q-separator class="q-my-lg" />
                  <div class="text-center">
                    <q-btn
                      class="gredient text-white"
                      label="Book Next Appointment"
                      no-caps=""
                      icon="event"
                      @click="bookNextAppointment"
                    />
                  </div>
                </div>
                <div v-else>
                  <div>No further sessions scheduled.</div>
                </div>
              </q-card>
            </div>

            <div class="col-md-6 col-sm-12">
              <q-card flat class="preview-card q-pa-md bg-grey-2 full-height">
                <div class="text-h6 q-mb-sm">Perform Follow-up Face Scan</div>
                <div>
                  Capture post-treatment skin analysis to track improvement and document results.
                </div>
                <q-separator class="q-my-lg" />
                <div class="text-center">
                  <q-btn
                    class="gredient text-white"
                    label="Proceed to Post-Assessment"
                    @click="toPostAssessment"
                  />
                </div>
              </q-card>
            </div>

            <div class="col-md-6 col-sm-12">
              <q-card flat class="preview-card q-pa-md full-height bg-grey-2">
                <div class="text-h6 q-mb-sm">Complete Session</div>
                <div>Finish session without post assessment and return to CRM.</div>
                <q-separator class="q-my-lg" />
                <div class="text-center">
                  <q-btn
                    color="black"
                    outline
                    no-caps
                    label="Skip & Finish"
                    @click="skipAndFinish"
                  />
                </div>
              </q-card>
            </div>

            <!-- Daily Home Care Routine Section -->
            <div class="col-12">
              <DailyHomeCareRoutine
                :routine="dailyRoutine"
                :is-generating="isGeneratingRoutine"
                :assessment-id="assessmentData?.id"
                :patient-name="assessmentData?.name"
                :session-id="session?.id"
                :session-number="session?.session_number"
                @generate="generateDailyRoute"
              />
            </div>
          </div>
        </q-card>
      </div>
    </div>


  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTreatmentFlowStore } from 'stores/treatmentFlow'
import { useAssessmentStore } from 'src/stores/assessmentStore'
import { Loading, useQuasar, LocalStorage } from 'quasar'

import { storeToRefs } from 'pinia'

import { useOpenAI } from 'src/composables/useOpenAI'
import { getFacialPrompts } from 'src/utils/facial'
import { encode } from '@toon-format/toon'
import DailyHomeCareRoutine from 'src/components/assessment/DailyHomeCareRoutine.vue'

const $q = useQuasar()
const assessmentStore = useAssessmentStore()
const { assessmentData } = storeToRefs(assessmentStore)

const route = useRoute()
const router = useRouter()
const store = useTreatmentFlowStore()
const { getOrCreateConversation, runResponse } = useOpenAI()
const isGeneratingRoutine = ref(false)


onMounted(async () => {
  store.currentSessionId = Number(route.params.session_id)
  await assessmentStore.getSingleAssessment(route.params.assessment_id)
  store.treatmentPlan = assessmentStore.assessmentData.treatment_sessions

  store.markCompleted()

  if (route.params.appointment_id) {
    await assessmentStore.updateStatus(route.params.appointment_id)
  }

  // Update treatment session status to completed
  if (route.params.session_id) {
    await assessmentStore.updateTreatmentSessionStatus(route.params.session_id, 'completed')
  }
})

const session = computed(() => store.currentSession)
const dailyRoutine = computed(() => {
  const routine = session.value?.daily_home_care_routine
  let result = { morning: [], evening: [] }

  if (!routine) return result

  if (typeof routine === 'string') {
    try {
      result = JSON.parse(routine)
    } catch (e) {
      console.error('Failed to parse daily_home_care_routine', e)
      return result
    }
  } else {
    result = routine
  }

  return {
    morning: result?.morning || [],
    evening: result?.evening || [],
  }
})
const nextSession = computed(() => {
  const idx = store.currentSessionIndex + 1
  return store.sessions[idx] ?? null
})

function toPostAssessment() {
  const routeData = router.resolve({
    name: 'index-with-id',
    params: {
      user_id: route.params.user_id,
      step: 'step-6',
      assessment_id: route.params.assessment_id,
      ...(route.params.appointment_id && { appointment_id: route.params.appointment_id }),
    },
  })
  window.open(routeData.href, '_blank')
}

function bookNextAppointment() {
  const routeData = router.resolve({
    name: 'appointments',
  })
  window.open(routeData.href, '_blank')
}

function skipAndFinish() {
  $q.dialog({
    title: 'Confirm',
    message: 'Are you sure you want to complete without post assessment and return to CRM?',
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
        message: 'Finalizing and redirecting...',
      })
      setTimeout(() => {
        window.location.href = `${process.env.CRM_URL}`
      }, 2000)
    })
    .onCancel(() => {
      console.log('User cancelled')
    })
}



async function generateDailyRoute() {
  try {
    isGeneratingRoutine.value = true
    Loading.show({ message: 'Generating Daily Home Care Routine...' })

    let convId = assessmentData.value.conversation_id
    if (!convId) {
      convId = await getOrCreateConversation(
        assessmentData.value.user_id,
        assessmentData.value.conversation_id,
        assessmentData.value.name,
        assessmentData.value.id,
      )
      assessmentData.value.conversation_id = convId
      await assessmentStore.updateAssessment({ conversation_id: convId })
    }

    const patientData = {
      name: assessmentData.value.name,
      age: assessmentData.value.age,
      gender: assessmentData.value.gender,
      allergies: assessmentData.value.allergies,
      is_pregnant: assessmentData.value.is_pregnant,
      breastfeeding: assessmentData.value.breastfeeding,
    }

    const prompts = await getFacialPrompts(assessmentData.value.face_scan_machine)
    // Prepare inputs
    const input = [
      {
        role: 'system',
        content: [
          { type: 'input_text', text: prompts.SYSTEM_DAILY_HOME_CARE_ROUTINE_PROMPT },
          {
            type: 'input_text',
            text:
              'available_skincare_products JSON:\n' + encode(prompts.available_skincare_products),
          },
        ],
      },
      {
        role: 'user',
        content: [
          { type: 'input_text', text: prompts.USER_DAILY_HOME_CARE_ROUTINE_PROMPT },
          { type: 'input_text', text: 'Patient Profile JSON:\n' + encode(patientData) },
          {
            type: 'input_text',
            text:
              'Session Details JSON:\n' +
              encode({
                title: session.value?.title,
                treatment_time: session.value?.treatment_time,
                concerns_addressed: session.value?.concerns_addressed,
                steps: session.value?.steps,
              }),
          },
        ],
      },
    ]

    const result = await runResponse(convId, input)
    console.log('Daily Routine Response:', result)

    if (result.error) {
      $q.notify({ type: 'negative', message: 'Failed to generate Daily Home Care Routine' })
      return
    }

    let parsedRoutine = result
    if (typeof result === 'string') {
      try {
        parsedRoutine = JSON.parse(result)
      } catch {
        /* ignore */
      }
    }

    if (parsedRoutine.daily_home_care_routine) {
      parsedRoutine = parsedRoutine.daily_home_care_routine
    }

    const sessionObj = store.sessions.find((s) => s.id === session.value.id)
    if (sessionObj) {
      sessionObj.daily_home_care_routine = parsedRoutine

      // Update store and assessmentData consistency
      assessmentData.value.treatment_sessions = store.treatmentPlan
      assessmentData.value.treatment_plans = {
        treatment_plan: store.treatmentPlan,
      }

      // Submit using 'treatment_plans' key as expected by backend
      await assessmentStore.updateAssessment({
        treatment_plans: assessmentData.value.treatment_plans,
      })

      $q.notify({ type: 'positive', message: 'Daily Home Care Routine successfully generated.' })
    }
  } catch (error) {
    console.error('Failed to generate daily routine', error)
    $q.notify({
      type: 'negative',
      message: 'An error occurred while generating Daily Home Care Routine.',
    })
  } finally {
    isGeneratingRoutine.value = false
    Loading.hide()
  }
}
</script>
