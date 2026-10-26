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
              <h4 class="q-my-md">{{ completionSaved ? 'Treatment Complete ✔' : 'Finalizing Treatment' }}</h4>
              <!-- <div class="text-subtitle2 q-mt-xs">Session {{ sessionNumber }} completed</div> -->
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
            <div class="col-md-12 col-sm-12">
              <q-card flat class="section-card q-pa-md soft-bg full-height">
                <div class="text-h5 q-mb-sm">{{ session?.title }}</div>
                <div><strong>Total Session Time:</strong> {{ session?.treatment_time }}</div>
              </q-card>
            </div>

            <div class="col-md-12 col-sm-12">
              <q-card flat class="preview-card q-pa-md full-height bg-grey-2">
                <div class="text-h6 q-mb-sm">Complete Session</div>
                <div v-if="completing" role="status">Saving session completion to CRM...</div>
                <q-banner v-else-if="completionError" class="bg-red-1 text-negative q-mt-md" role="alert">
                  {{ completionError }}
                  <template #action>
                    <q-btn flat label="Retry saving" no-caps @click="completeSession" />
                  </template>
                </q-banner>
                <div v-else-if="completionSaved">Session saved in CRM. Transfer to the Clinic Head.</div>
                <q-separator class="q-my-lg" />
                <div class="text-center">
                  <q-btn
                    color="black"
                    outline
                    no-caps
                    label="Complete Session & Transfer to Clinic Head"
                    :loading="completing"
                    :disable="!completionSaved"
                    @click="skipAndFinish"
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
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useTreatmentFlowStore } from 'stores/treatmentFlow'
import { useAssessmentStore } from 'src/stores/assessmentStore'
import { LocalStorage, Loading } from 'quasar'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const assessmentStore = useAssessmentStore()
const route = useRoute()
const store = useTreatmentFlowStore()
const assessmentData = computed(() => assessmentStore.assessmentData)
const completing = ref(false)
const completionSaved = ref(false)
const completionError = ref('')

onMounted(completeSession)

async function completeSession() {
  if (completing.value || completionSaved.value) return
  completing.value = true
  completionError.value = ''
  try {
    await assessmentStore.getSingleAssessment(route.params.assessment_id, { throwOnError: true })
    await assessmentStore.completeTreatmentSession(route.params.session_id, {
      assessmentId: route.params.assessment_id,
      userId: route.params.user_id,
      appointmentId: route.params.appointment_id,
    })
    store.currentSessionId = Number(route.params.session_id)
    store.treatmentPlan = assessmentStore.assessmentData.treatment_sessions
    completionSaved.value = true
    // CRM is authoritative; browser storage may be unavailable or full.
    try {
      store.markCompleted()
    } catch (error) {
      console.warn('Completion saved in CRM, but browser progress could not be saved.', error)
    }
  } catch (error) {
    const errors = error.response?.data?.errors
    completionError.value = (errors && Object.values(errors).flat()[0]) ||
      error.response?.data?.message || error.message || 'Could not save completion. Please retry.'
  } finally {
    completing.value = false
  }
}

const session = computed(() => store.currentSession)

function skipAndFinish() {
  if (!completionSaved.value || completing.value) return
  $q.dialog({
    title: 'Confirm',
    message: 'Are you sure you want to complete the treatment?',
    persistent: true,

    ok: {
      label: 'Yes, Complete Treatment',
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
    .onOk(() => {
      LocalStorage.removeItem('user')
      Loading.show({
        message: 'Finalizing and redirecting...',
      })
      window.location.href = `${process.env.CRM_URL}`
    })
    .onCancel(() => {
      console.log('User cancelled')
    })
    .onDismiss(() => {
      console.log('Dialog closed (OK or Cancel)')
    })
}
</script>
