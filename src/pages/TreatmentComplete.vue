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
              <h4 class="q-my-md">Treatment Complete ✔</h4>
              <!-- <div class="text-subtitle2 q-mt-xs">Session {{ sessionNumber }} completed</div> -->
            </div>
          </div>
          <!-- <q-separator class="q-my-md" /> -->

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
                  <div v-if="appointmentData.datetime" class="q-mt-md text-subtitle2">
                    Next Appointment:
                    <q-chip outline square color="red">{{ appointmentData.datetime }}</q-chip>
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
                <div class="text-h6 q-mb-sm">Skip Follow-up Scan</div>
                <div>Complete session and return to CRM.</div>
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
              <q-card flat class="section-card q-pa-md soft-bg">
                <div class="row items-center justify-between q-mb-md">
                  <div class="text-h5 q-my-none">Daily Home Care Routine</div>
                  <div class="flex gap-2">
                    <q-btn
                      v-if="!dailyRoutine.morning.length && !dailyRoutine.evening.length"
                      color="black"
                      icon="auto_awesome"
                      label="Generate Routine with AI"
                      no-caps
                      @click="generateDailyRoute"
                      :loading="isGeneratingRoutine"
                    />
                    <q-btn
                      v-else
                      color="black"
                      outline
                      icon="auto_awesome"
                      label="Re-generate with AI"
                      no-caps
                      @click="generateDailyRoute"
                      :loading="isGeneratingRoutine"
                    />
                    <q-btn
                      v-if="dailyRoutine.morning.length || dailyRoutine.evening.length"
                      color="black"
                      outline
                      icon="download"
                      label="Download PDF"
                      no-caps
                      @click="downloadRoutinePDF"
                    />
                  </div>
                </div>

                <div
                  v-if="!dailyRoutine.morning.length && !dailyRoutine.evening.length"
                  class="text-center q-pa-lg text-grey-7"
                >
                  No daily home care routine generated yet. Click the button above to generate one.
                </div>

                <div v-else class="row q-col-gutter-md">
                  <!-- Morning Routine -->
                  <div v-if="dailyRoutine.morning.length" class="col-md-6 col-sm-12">
                    <div class="text-h6 q-mb-sm text-orange-8 flex items-center gap-2">
                      <q-icon name="wb_sunny" /> Morning Routine
                    </div>
                    <q-list bordered separator class="rounded-borders bg-white">
                      <q-item
                        v-for="step in dailyRoutine.morning"
                        :key="'morning-' + step.step_number"
                      >
                        <q-item-section avatar>
                          <q-avatar color="orange-1" text-color="orange-8" size="md">
                            {{ step.step_number }}
                          </q-avatar>
                        </q-item-section>
                        <q-item-section>
                          <q-item-label class="text-bold">{{ step.product_name }}</q-item-label>
                          <q-item-label caption class="text-grey-9 q-mt-xs">
                            <strong>How to use:</strong> {{ step.how_to_use }}
                          </q-item-label>
                          <q-item-label caption class="text-grey-7 q-mt-xs">
                            <strong>Clinical Purpose:</strong> {{ step.clinical_purpose }}
                          </q-item-label>
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </div>

                  <!-- Evening Routine -->
                  <div v-if="dailyRoutine.evening.length" class="col-md-6 col-sm-12">
                    <div class="text-h6 q-mb-sm text-indigo-8 flex items-center gap-2">
                      <q-icon name="nights_stay" /> Evening Routine
                    </div>
                    <q-list bordered separator class="rounded-borders bg-white">
                      <q-item
                        v-for="step in dailyRoutine.evening"
                        :key="'evening-' + step.step_number"
                      >
                        <q-item-section avatar>
                          <q-avatar color="indigo-1" text-color="indigo-8" size="md">
                            {{ step.step_number }}
                          </q-avatar>
                        </q-item-section>
                        <q-item-section>
                          <q-item-label class="text-bold">{{ step.product_name }}</q-item-label>
                          <q-item-label caption class="text-grey-9 q-mt-xs">
                            <strong>How to use:</strong> {{ step.how_to_use }}
                          </q-item-label>
                          <q-item-label caption class="text-grey-7 q-mt-xs">
                            <strong>Clinical Purpose:</strong> {{ step.clinical_purpose }}
                          </q-item-label>
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </div>
                </div>
              </q-card>
            </div>
          </div>
        </q-card>
      </div>
    </div>

    <q-dialog v-model="showDialog">
      <div style="min-width: 400px; max-width: 90vw">
        <q-card class="custom-card" style="margin-top: 20px">
          <q-toolbar>
            <q-toolbar-title
              class="text-white header-container gradient-default flex justify-end items-center"
            >
              <div class="title">Book Next Appointment</div>
              <q-btn class="flex-end q-mr-sm" icon="close" round outline dense v-close-popup />
            </q-toolbar-title>
          </q-toolbar>
          <q-card-section class="q-pt-none">
            <div class="q-pa-md">
              <div class="q-pa-md">
                <div class="q-gutter-sm">
                  <q-chip color="teal" text-color="white" class="q-ma-md">
                    Date: {{ appointmentData.datetime }}
                  </q-chip>
                </div>

                <div class="q-gutter-md row items-start">
                  <q-date
                    v-model="appointmentData.datetime"
                    :options="allowFutureDates"
                    mask="DD-MM-YYYY HH:mm"
                    color="purple"
                  />
                  <q-time
                    v-model="appointmentData.datetime"
                    mask="DD-MM-YYYY HH:mm"
                    color="purple"
                  />
                </div>

                <q-input
                  v-model="appointmentData.notes"
                  label="Notes"
                  class="q-mt-md"
                  color="purple"
                  outlined
                />
              </div>
              <q-banner v-if="v$.datetime.$error" dense rounded class="text-white bg-red-8">
                <template v-slot:avatar>
                  <q-icon name="warning" color="white" />
                </template>
                Please Select Date & Time</q-banner
              >
            </div>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn label="Cancel" color="negative" icon="close" outline v-close-popup />
            <q-btn
              label="Confirm"
              color="positive"
              icon="check"
              :loading="loading"
              @click="confirmBooking"
            />
          </q-card-actions>
        </q-card>
      </div>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTreatmentFlowStore } from 'stores/treatmentFlow'
import { useAssessmentStore } from 'src/stores/assessmentStore'
import { Loading, useQuasar } from 'quasar'
import useVuelidate from '@vuelidate/core'
import { required } from '@vuelidate/validators'
import moment from 'moment'
import { storeToRefs } from 'pinia'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

import { useOpenAI } from 'src/composables/useOpenAI'
import {
  SYSTEM_DAILY_HOME_CARE_ROUTINE_PROMPT,
  USER_DAILY_HOME_CARE_ROUTINE_PROMPT,
} from 'src/utils/facial/treatment/treatmentPrompt'
import { available_skincare_products } from 'src/utils/facial/treatment/productJson'
import { encode } from '@toon-format/toon'

const $q = useQuasar()
const assessmentStore = useAssessmentStore()
const { showDialog, assessmentData } = storeToRefs(assessmentStore)
const loading = computed(() => assessmentStore.loading)

const route = useRoute()
const router = useRouter()
const store = useTreatmentFlowStore()
const { getOrCreateConversation, runResponse } = useOpenAI()
const isGeneratingRoutine = ref(false)
const appointmentData = ref({
  datetime: '',
  notes: '',
})

const rules = {
  datetime: { required },
}

const v$ = useVuelidate(rules, appointmentData)

onMounted(async () => {
  // ensure map of state
  store.currentSessionId = Number(route.params.session_id)
  await assessmentStore.getSingleAssessment(route.params.assessment_id)
  store.treatmentPlan = assessmentStore.assessmentData.treatment_sessions
  // mark completed if not yet
  store.markCompleted()
  // INFO: Update Treatment Session Status and Appointment Status to "completed"
  if (route.params.appointment_id) await assessmentStore.updateStatus(route.params.appointment_id)
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
  // route to your post assessment page (step-7)
  router.push({
    name: 'index',
    params: {
      user_id: route.params.user_id,
      step: 'step-6',
      ...(route.params.appointment_id && { appointment_id: route.params.appointment_id }),
    },
  })
}

function bookNextAppointment() {
  router.push({
    name: 'appointments',
    params: {
      clinic_id: assessmentData.value.clinic_id,
    },
  })
}

// Allow only future dates (today + future)
const allowFutureDates = (calendarDate) => {
  const today = moment().format('YYYY/MM/DD')
  return calendarDate >= today
}

// Allow time between 09:00 – 19:00
// const allowBusinessHours = (hour, minute) => {
//   if (hour > 9 || hour < 19) return false
//   if (hour === 19 && minute > 0) return false
//   return true
// }

async function confirmBooking() {
  const isFormCorrect = await v$.value.$validate()
  if (!isFormCorrect) return
  await assessmentStore.bookNextAppointment(appointmentData.value, nextSession.value.id)
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

    // Prepare inputs
    const input = [
      {
        role: 'system',
        content: [
          { type: 'input_text', text: SYSTEM_DAILY_HOME_CARE_ROUTINE_PROMPT },
          {
            type: 'input_text',
            text: 'available_skincare_products JSON:\n' + encode(available_skincare_products),
          },
        ],
      },
      {
        role: 'user',
        content: [
          { type: 'input_text', text: USER_DAILY_HOME_CARE_ROUTINE_PROMPT },
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

function downloadRoutinePDF() {
  const doc = new jsPDF()

  // Header
  doc.setFontSize(22)
  doc.setTextColor(0, 0, 0)
  doc.text('AI AESTHETICS', 105, 20, { align: 'center' })

  doc.setFontSize(16)
  doc.text('Daily Home Care Routine', 105, 30, { align: 'center' })

  doc.setFontSize(12)
  doc.setTextColor(100)
  doc.text(`Patient: ${assessmentData.value.name}`, 14, 45)
  doc.text(`Date: ${moment().format('DD-MM-YYYY')}`, 14, 52)
  doc.text(`Session: ${session.value?.title}`, 14, 59)

  let currentY = 70

  // Morning Section
  if (dailyRoutine.value.morning && dailyRoutine.value.morning.length > 0) {
    doc.setFontSize(14)
    doc.setTextColor(255, 140, 0) // Orange
    doc.text('Morning Routine', 14, currentY)

    const morningData = dailyRoutine.value.morning.map((step) => [
      step.step_number,
      step.product_name,
      step.how_to_use,
      step.clinical_purpose,
    ])

    autoTable(doc, {
      startY: currentY + 5,
      head: [['Step', 'Product', 'How to Use', 'Clinical Purpose']],
      body: morningData,
      headStyles: { fillColor: [255, 140, 0] },
      theme: 'striped',
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 45 },
        2: { cellWidth: 60 },
        3: { cellWidth: 60 },
      },
    })

    currentY = doc.lastAutoTable.finalY + 15
  }

  // Evening Section
  if (dailyRoutine.value.evening && dailyRoutine.value.evening.length > 0) {
    // Check if we need a new page
    if (currentY > 240) {
      doc.addPage()
      currentY = 20
    }

    doc.setFontSize(14)
    doc.setTextColor(63, 81, 181) // Indigo
    doc.text('Evening Routine', 14, currentY)

    const eveningData = dailyRoutine.value.evening.map((step) => [
      step.step_number,
      step.product_name,
      step.how_to_use,
      step.clinical_purpose,
    ])

    autoTable(doc, {
      startY: currentY + 5,
      head: [['Step', 'Product', 'How to Use', 'Clinical Purpose']],
      body: eveningData,
      headStyles: { fillColor: [63, 81, 181] },
      theme: 'striped',
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 45 },
        2: { cellWidth: 60 },
        3: { cellWidth: 60 },
      },
    })
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(10)
    doc.setTextColor(150)
    doc.text(
      'Generated by AI Aesthetics - Confidential Skin Assessment',
      105,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' },
    )
  }

  doc.save(
    `Home_Care_Routine_Session_${session.value?.session_number || 'N/A'}_${assessmentData.value.name.replace(/\s+/g, '_')}.pdf`,
  )
}

function skipAndFinish() {
  $q.dialog({
    title: 'Confirm',
    message: 'Are you sure you want to skip the follow-up scan and return to CRM?',
    persistent: true,

    ok: {
      label: 'Yes, Skip & Finish',
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
      Loading.show({
        message: 'Finalizing and redirecting...',
      })
      setTimeout(() => {
        // LocalStorage.clear()
        window.location.href = `${process.env.CRM_URL}/users`
      }, 2000)
    })
    .onCancel(() => {
      console.log('User cancelled')
    })
    .onDismiss(() => {
      console.log('Dialog closed (OK or Cancel)')
    })
}
</script>
