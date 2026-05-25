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
                <div>Finish session and return to CRM.</div>
                <q-separator class="q-my-lg" />
                <div class="text-center">
                  <q-btn
                    color="black"
                    outline
                    no-caps
                    label="Complete Session & Transfer to Clinic Head"
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
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTreatmentFlowStore } from 'stores/treatmentFlow'
import { useAssessmentStore } from 'src/stores/assessmentStore'
import { LocalStorage, Loading } from 'quasar'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const assessmentStore = useAssessmentStore()
const route = useRoute()
const store = useTreatmentFlowStore()

onMounted(async () => {
  // ensure map of state
  store.currentSessionId = Number(route.params.session_id)
  await assessmentStore.getSingleAssessment(route.params.assessment_id)
  store.treatmentPlan = assessmentStore.assessmentData.treatment_sessions
  // mark completed if not yet
  store.markCompleted()
  // INFO: Update Treatment Session Status and Appointment Status to "completed"
  if (route.params.appointment_id) {
    await assessmentStore.updateStatus(route.params.appointment_id)
  }

  // Update treatment session status to completed
  if (route.params.session_id) {
    await assessmentStore.updateTreatmentSessionStatus(route.params.session_id, 'completed')
  }
})

const session = computed(() => store.currentSession)

function skipAndFinish() {
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
    .onOk(async () => {
      LocalStorage.removeItem('user')
      Loading.show({
        message: 'Finalizing and redirecting...',
      })
      setTimeout(() => {
        // LocalStorage.clear()
        window.location.href = `${process.env.CRM_URL}`
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
