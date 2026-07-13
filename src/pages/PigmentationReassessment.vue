<template>
  <q-page class="spectra-theme-page">
    <div class="spectra-theme">
      <!-- Connection Gate -->
      <ConnectGate v-if="!store.isConnected" />

      <!-- Main Reassessment App -->
      <div v-else class="spectra-app">
        <!-- Header -->
        <header class="topbar">
          <div class="brand">
            <div class="glyph"></div>
            <div>
              <span class="name">AI Aesthetics</span>
              <span class="sub">· Pigment Reassessment</span>
            </div>
          </div>
          <div class="topbar-right">
            <button
              @click="viewAssessmentSteps"
              style="display: inline-flex; align-items: center; gap: 6px; background: none; border: none; cursor: pointer; font-family: inherit; font-size: 13px; font-weight: 500; color: var(--slate); padding: 5px 8px; margin-right: 15px;"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Edit Baseline Steps
            </button>
            <button
              @click="backToCrm"
              style="display: inline-flex; align-items: center; gap: 6px; background: none; border: none; cursor: pointer; font-family: inherit; font-size: 13px; font-weight: 500; color: var(--slate); padding: 5px 8px; margin-right: 10px;"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Back to CRM
            </button>
            <span class="live-tag">
              <span class="led"></span>
              Live
            </span>
            <span class="model-chip" id="modelChip">
              {{ store.model }}
            </span>
          </div>
        </header>

        <!-- Stage Container -->
        <main v-if="isLoaded">
          <ReassessStage />
        </main>

        <!-- Bottom Navigation -->
        <footer class="footnav">
          <div class="progress">
            <span id="stageLabel">Pigmentation Reassessment</span>
            <div class="track">
              <span id="progBar" style="width: 100%;"></span>
            </div>
          </div>
          <div class="nav-btns">
            <button
              class="btn"
              style="border-color: var(--erythema); color: var(--erythema);"
              @click="confirmClearConvId"
              :disabled="store.isLoading"
              v-if="store.id"
            >
              Clear Conversation
            </button>
            <button class="btn btn-primary" id="nextBtn" @click="finalizeAndExit()" :disabled="store.isLoading">
              Complete &amp; Exit ✓
            </button>
          </div>
        </footer>

        <!-- Disclaimer -->
        <div class="disclaimer">
          <span>{{ disclaimerText }}</span>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePigmentationStore } from 'src/stores/pigmentationStore'
import { Loading, LocalStorage, useQuasar } from 'quasar'
import { api } from 'src/boot/axios'

// Step Components
import ConnectGate from 'src/components/pigmentation/ConnectGate.vue'
import ReassessStage from 'src/components/pigmentation/ReassessStage.vue'

import { useAuthStore } from 'src/stores/authStore'

const route = useRoute()
const router = useRouter()
const store = usePigmentationStore()
const authStore = useAuthStore()
const $q = useQuasar()

if (route.params.assessment_id) {
  store.id = route.params.assessment_id
}

const viewAssessmentSteps = () => {
  router.push({
    name: 'pigmentation-assessment',
    params: {
      user_id: route.params.user_id,
      assessment_id: route.params.assessment_id,
      ...(route.params.appointment_id && { appointment_id: route.params.appointment_id }),
    },
    query: {
      mode: 'edit',
    },
  })
}

const backToCrm = async () => {
  Loading.show({
    message: 'Redirecting to CRM...',
  })
  await authStore.logout()
  window.location.href = `${process.env.CRM_URL}`
}

const userId = route.params.user_id
const isLoaded = ref(!route.params.assessment_id)

onMounted(async () => {
  const assessmentId = route.params.assessment_id
  if (assessmentId) {
    store.isConnected = true // auto-connect when editing/resuming
    await store.getSingleAssessment(assessmentId)
    // Force stage to 4 (reassessment context)
    store.currentStage = 4
    isLoaded.value = true
  } else if (userId) {
    await store.getPatientData(userId)
    store.currentStage = 4
    isLoaded.value = true
  } else {
    store.currentStage = 4
    isLoaded.value = true
  }
})

const disclaimerText = 'CLINICAL TRIAL PILOT · OPENAI ADVISOR · SYSTEM ACCESSED DIRECTLY'

const finalizeAndExit = () => {
  $q.dialog({
    title: 'Confirm Reassessment',
    message: 'Would you like to complete the reassessment and return to CRM?',
    persistent: true,
    ok: {
      label: 'Yes, Complete & Exit',
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
      try {
        await store.updateAssessment()
        Loading.show({
          message: 'Finalizing and redirecting...',
        })
        setTimeout(() => {
          window.location.href = `${process.env.CRM_URL}/users`
        }, 3000)
      } catch (err) {
        console.log(err)
        $q.notify({
          type: 'negative',
          message: 'Failed to save final assessment status to database.',
        })
      }
    })
}

const confirmClearConvId = () => {
  $q.dialog({
    title: 'Confirm',
    message:
      'Are you sure you want to clear the current conversation ID and start a fresh conversation?',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      Loading.show({
        message: 'Clearing conversation...',
      })
      await api.post('/assessments/clear-conversation-id', {
        assessment_id: store.id,
      })

      $q.notify({
        type: 'positive',
        message: 'Conversation ID cleared successfully.',
      })

      window.location.reload()
    } catch (error) {
      console.error(error)
      $q.notify({
        type: 'negative',
        message: 'Failed to clear conversation ID.',
      })
    } finally {
      Loading.hide()
    }
  })
}

// Clean up store on unmount
onUnmounted(() => {
  store.disconnect()
})
</script>

<style>
@import 'src/css/pigmentation.css';
</style>
