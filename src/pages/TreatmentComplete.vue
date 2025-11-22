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
              <q-card flat class="preview-card q-pa-md">
                <div class="text-h6 q-mb-sm">Next appointment</div>
                <div v-if="nextSession">
                  <div class="text-caption">
                    Session {{ nextSession.session_number }} in approx {{ nextSession.week }} weeks
                  </div>
                  <div class="q-mt-xs">{{ nextSession.title }}</div>
                  <div class="q-mt-md text-subtitle2">
                    Session Duration: {{ nextSession.treatment_time }} minutes
                  </div>
                </div>
                <div v-else>
                  <div>No further sessions scheduled.</div>
                </div>
              </q-card>
            </div>

            <div class="col-md-6 col-sm-12">
              <q-card flat class="preview-card q-pa-md bg-grey-2">
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
  </q-page>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTreatmentFlowStore } from 'stores/treatmentFlow'
import { useAssessmentStore } from 'src/stores/assessmentStore'
import { Loading, useQuasar } from 'quasar'

const $q = useQuasar()
const assessmentStore = useAssessmentStore()

const route = useRoute()
const router = useRouter()
const store = useTreatmentFlowStore()

// const sessionNumber = Number(route.params.session) || (store.currentSession?.session_number ?? 1)

onMounted(async () => {
  // ensure map of state
  await assessmentStore.getSingleAssessment(route.params.assessment_id)

  store.treatmentPlan = assessmentStore.assessmentData.treatment_sessions
  // mark completed if not yet
  store.markCompleted()
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
    .onOk(() => {
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
