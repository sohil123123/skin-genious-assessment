<template>
  <q-page padding>
    <q-card class="q-pa-md">
      <div class="row items-center justify-between">
        <div>
          <h4>Treatment Complete ✔</h4>
          <div class="text-subtitle2 q-mt-xs">Session {{ sessionNumber }} completed</div>
        </div>
      </div>

      <q-separator class="q-my-md" />

      <div class="row">
        <div class="col-8">
          <q-card flat class="q-pa-md bg-grey-1">
            <div class="text-h6 q-mb-sm">{{ session?.title }}</div>
            <div><strong>Total Session Time:</strong> {{ session?.treatment_time }}</div>

            <q-separator class="q-my-md" />

            <div class="q-gutter-md">
              <q-btn color="primary" label="Proceed to Post-Assessment" @click="toPostAssessment" />
              <q-btn flat label="Download Summary" @click="downloadSummary" />
            </div>
          </q-card>
        </div>

        <div class="col-4">
          <q-card flat class="q-pa-md">
            <div class="text-subtitle1 q-mb-sm">Next appointment</div>
            <div v-if="nextSession">
              <div>
                Session {{ nextSession.session_number }} in approx {{ nextSession.week }} weeks
              </div>
              <div class="text-caption q-mt-xs">{{ nextSession.title }}</div>
            </div>
            <div v-else>
              <div>No further sessions scheduled.</div>
            </div>

            <q-separator class="q-my-md" />

            <div>
              <img
                :src="screenshotUrl"
                alt="treatment-screenshot"
                style="max-width: 100%; border-radius: 8px"
              />
            </div>
          </q-card>
        </div>
      </div>
    </q-card>
  </q-page>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTreatmentFlowStore } from 'stores/treatmentFlow'

const route = useRoute()
const router = useRouter()
const store = useTreatmentFlowStore()

const sessionNumber = Number(route.params.session) || (store.currentSession?.session_number ?? 1)

onMounted(() => {
  // ensure map of state
  if (!store.treatmentPlan) store.loadFromLocal()
  // mark completed if not yet
  store.markCompleted()
})

const session = computed(() => store.currentSession)
const nextSession = computed(() => {
  const idx = store.currentSessionIndex + 1
  return store.sessions[idx] ?? null
})

// image path provided in conversation (local path)
const screenshotUrl = '/mnt/data/WhatsApp Image 2025-09-25 at 8.40.16 PM.jpeg'

function toPostAssessment() {
  // route to your post assessment page (step-7)
  router.push('/step-7')
}

function downloadSummary() {
  // implement a simple summary download (text)
  const summary = {
    session: session.value,
    completedAt: new Date().toISOString(),
  }
  const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `treatment-session-${sessionNumber}-summary.json`
  a.click()
  URL.revokeObjectURL(url)
}
</script>
