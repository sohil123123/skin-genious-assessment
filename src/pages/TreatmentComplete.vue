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
                      @click="loadAppointmentDialog"
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

const $q = useQuasar()
const assessmentStore = useAssessmentStore()
const { showDialog } = storeToRefs(assessmentStore)
const loading = computed(() => assessmentStore.loading)

const route = useRoute()
const router = useRouter()
const store = useTreatmentFlowStore()
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
  await assessmentStore.updateStatus(route.params.appointment_id)
})

const session = computed(() => store.currentSession)
const nextSession = computed(() => {
  const idx = store.currentSessionIndex + 1
  return store.sessions[idx] ?? null
})

function toPostAssessment() {
  // route to your post assessment page (step-7)
  router.push({ name: 'index', params: { user_id: route.params.user_id, step: 'step-6' } })
}

function loadAppointmentDialog() {
  assessmentStore.initiateDialog()
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
