<template>
  <q-page class="spectra-theme-page">
    <div class="spectra-theme">
      <!-- Connection Gate -->
      <ConnectGate v-if="!store.isConnected" />

      <!-- Main Assessment Wizard -->
      <div v-else class="spectra-app">
        <!-- Header -->
        <header class="topbar">
          <div class="brand">
            <div class="glyph"></div>
            <div>
              <span class="name">AI Aesthetics</span>
              <span class="sub">· Pigment Co-Pilot</span>
            </div>
          </div>
          <div class="topbar-right">
            <button
              @click="route.query.mode === 'edit' ? returnToReassessment() : backToCrm()"
              style="
                display: inline-flex;
                align-items: center;
                gap: 6px;
                background: none;
                border: none;
                cursor: pointer;
                font-family: inherit;
                font-size: 13px;
                font-weight: 500;
                color: var(--slate);
                padding: 5px 8px;
                margin-right: 10px;
              "
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              {{ route.query.mode === 'edit' ? 'Back to Reassessment' : 'Back to CRM' }}
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

        <!-- Stepper Spine -->
        <div class="spine-wrap">
          <nav class="spine">
            <button
              v-for="(st, idx) in steps"
              :key="idx"
              :class="[
                'step',
                { active: store.currentStage === idx, done: idx < store.currentStage },
              ]"
              @click="goToStage(idx)"
              :disabled="store.isLoading"
            >
              <span class="num">{{ idx + 1 }}</span>
              <span class="lbl">
                <b>{{ st.title }}</b>
                <span>{{ st.sub }}</span>
              </span>
            </button>
          </nav>
        </div>

        <!-- Stage Container -->
        <main v-if="isLoaded">
          <CaptureStage v-if="store.currentStage === 0" />
          <AssessStage v-if="store.currentStage === 1" />
          <DiagnosisStage v-if="store.currentStage === 2" />
          <PlanStage v-if="store.currentStage === 3" />
        </main>

        <!-- Global Bottom Navigation -->
        <footer class="footnav">
          <div class="progress">
            <span id="stageLabel">{{ store.stageLabel }}</span>
            <div class="track">
              <span id="progBar" :style="{ width: store.progressPercent + '%' }"></span>
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
            <button class="btn" id="backBtn" @click="goBack" v-show="store.currentStage > 0" :disabled="store.isLoading">
              ← Back
            </button>
            <button class="btn btn-primary" id="nextBtn" @click="goNext()" :disabled="store.isLoading">
              {{ store.currentStage === 3 ? 'Done ✓' : 'Continue →' }}
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
import CaptureStage from 'src/components/pigmentation/CaptureStage.vue'
import AssessStage from 'src/components/pigmentation/AssessStage.vue'
import DiagnosisStage from 'src/components/pigmentation/DiagnosisStage.vue'
import PlanStage from 'src/components/pigmentation/PlanStage.vue'

import { useAuthStore } from 'src/stores/authStore'

const route = useRoute()
const router = useRouter()
const store = usePigmentationStore()
const authStore = useAuthStore()
const $q = useQuasar()

if (route.params.assessment_id) {
  store.id = route.params.assessment_id
}

const backToCrm = async () => {
  Loading.show({
    message: 'Redirecting to CRM...',
  })
  await authStore.logout()
  window.location.href = `${process.env.CRM_URL}`
}

const returnToReassessment = () => {
  router.push({
    name: 'pigmentation-reassessment',
    params: {
      user_id: route.params.user_id,
      assessment_id: route.params.assessment_id,
      ...(route.params.appointment_id && { appointment_id: route.params.appointment_id }),
    },
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

const userId = route.params.user_id
const isLoaded = ref(!route.params.assessment_id)

onMounted(async () => {
  const assessmentId = route.params.assessment_id
  if (assessmentId) {
    store.isConnected = true // auto-connect when editing/resuming
    await store.getSingleAssessment(assessmentId)
    if (store.reviewState.finalized && route.query.mode !== 'edit') {
      router.push({
        name: 'pigmentation-reassessment',
        params: {
          user_id: userId,
          assessment_id: assessmentId,
          ...(route.params.appointment_id && { appointment_id: route.params.appointment_id }),
        },
      })
      return
    }
    if (route.query.mode === 'edit') {
      store.currentStage = 0
    }
    isLoaded.value = true
  } else if (userId) {
    await store.getPatientData(userId)
    isLoaded.value = true
  } else {
    isLoaded.value = true
  }
})

const steps = [
  { title: 'Capture', sub: 'Upload images' },
  { title: 'Assess', sub: 'Data + history' },
  { title: 'Diagnosis', sub: 'Confirm working dx' },
  { title: 'Plan', sub: 'Generate & sign-off' },
]

const disclaimerText = 'CLINICAL TRIAL PILOT · OPENAI ADVISOR · SYSTEM ACCESSED DIRECTLY'

const goToStage = async (idx) => {
  if (store.isLoading) return
  if (idx === store.currentStage) return

  if (idx > store.currentStage) {
    if (store.currentStage === 0) {
      await goNext(idx)
      return
    }
    if (store.currentStage === 1) {
      const unanswered = []
      if (store.dynamicQuestions && store.dynamicQuestions.length > 0) {
        store.dynamicQuestions.forEach((q) => {
          const answer = store.dynamicAnswers[q.question_id]
          if (
            answer === undefined ||
            answer === null ||
            answer === '' ||
            (Array.isArray(answer) && answer.length === 0)
          ) {
            unanswered.push(q.question)
          }
        })
      }
      if (unanswered.length > 0) {
        $q.dialog({
          title: 'Incomplete Assessment',
          message: `<div style="font-size: 14px; color: #555; margin-bottom: 8px;">Please answer all dynamic follow-up questions first:</div><ul style="padding-left: 20px; font-size: 13px; color: #333; line-height: 1.5; margin: 0;">${unanswered.map((q) => `<li style="margin-bottom: 6px;">${q}</li>`).join('')}</ul>`,
          html: true,
          ok: { label: 'OK', color: 'primary' },
        })
        return
      }
    }

  }

  if (store.isConnected) {
    store.currentStage = idx
  }
}

const finalizeAndExit = () => {
  const isEditFromReassess = route.query.mode === 'edit'
  $q.dialog({
    title: isEditFromReassess ? 'Save & Exit' : 'Confirm',
    message: isEditFromReassess
      ? 'Would you like to save changes and return to Reassessment?'
      : 'Would you like to confirm the treatment plan and return to CRM?',
    persistent: true,

    ok: {
      label: isEditFromReassess ? 'Yes, Save & Exit' : 'Yes, Confirm & Exit',
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
  }).onOk(async () => {
    LocalStorage.removeItem('user')
    if (!isEditFromReassess) {
      store.reviewState.finalized = true
      store.reviewState.decision = store.reviewState.decision || 'approve'
      store.reviewState.ts = new Date()
    }

    try {
      await store.updateAssessment()
      Loading.show({
        message: 'Saving changes...',
      })
      setTimeout(() => {
        Loading.hide()
        if (isEditFromReassess) {
          returnToReassessment()
        } else {
          window.location.href = `${process.env.CRM_URL}/users`
        }
      }, 2000)
    } catch (err) {
      console.log(err)
      Loading.hide()
      $q.notify({
        type: 'negative',
        message: 'Failed to save final assessment status to database.',
      })
    }
  })
}

const goNext = async (targetIdx = null) => {
  if (store.isLoading) return
  if (targetIdx && typeof targetIdx === 'object') {
    targetIdx = null
  }
  if (store.currentStage === 0) {
    if (!store.aiAnalysis && !store.formData.fitz) {
      $q.notify({
        type: 'warning',
        message: 'Please analyze the captures first.',
        position: 'top',
      })
      return
    }

    const missing = []
    if (!store.formData.initials) missing.push('Patient Initials')
    if (!store.formData.age) missing.push('Age')
    if (!store.formData.sex) missing.push('Sex')
    if (!store.formData.fitz) missing.push('Fitzpatrick skin type')

    const questions = [
      { id: 'duration', label: 'Onset duration' },
      { id: 'stability_last_4_6_weeks', label: 'Stability status' },
      { id: 'recurrence_after_improvement', label: 'Recurrence after improvement' },
      { id: 'sunscreen_use', label: 'Sunscreen usage' },
      { id: 'sunscreen_reapplication', label: 'Sunscreen reapplication' },
      { id: 'outdoor_heat_exposure', label: 'Sun/heat exposure level' },
      { id: 'current_sensitivity', label: 'Skin sensitivity to products' },
      { id: 'previous_treatment_response', label: 'Response to prior treatment' },
      { id: 'active_new_acne_frequency', label: 'Are new pimples appearing?' },
      { id: 'red_flag_lesion_change', label: 'Has any spot recently changed?' },
    ]

    questions.forEach((q) => {
      const val = store.fixedHistory[q.id]
      if (!val) {
        missing.push(q.label)
      }
    })

    if (missing.length > 0) {
      $q.dialog({
        title: 'Required Fields Missing',
        message: `<div style="font-size: 14px; color: #555; margin-bottom: 8px;">Please answer the following required fields first:</div><ul style="padding-left: 20px; font-size: 13px; color: #333; line-height: 1.5; margin: 0;">${missing.map((m) => `<li style="margin-bottom: 6px;">${m}</li>`).join('')}</ul>`,
        html: true,
        ok: { label: 'OK', color: 'primary' },
      })
      return
    }

    try {
      if (!store.dynamicQuestions || store.dynamicQuestions.length === 0) {
        Loading.show({ message: 'Generating dynamic follow-up questions…' })
        store.isLoading = true
        store.loadingMessage = 'Generating dynamic follow-up questions…'
        await store.generateDynamicQuestions()
      }
      await store.updateAssessment()
      store.currentStage = targetIdx !== null ? targetIdx : 1
    } catch (err) {
      $q.notify({
        type: 'negative',
        message: err.message || 'Failed to generate dynamic questions.',
        position: 'top',
      })
    } finally {
      store.isLoading = false
      Loading.hide()
    }
  } else if (store.currentStage < 3) {
    try {
      if (store.currentStage === 1) {
        const unanswered = []
        if (store.dynamicQuestions && store.dynamicQuestions.length > 0) {
          store.dynamicQuestions.forEach((q) => {
            const answer = store.dynamicAnswers[q.question_id]
            if (
              answer === undefined ||
              answer === null ||
              answer === '' ||
              (Array.isArray(answer) && answer.length === 0)
            ) {
              unanswered.push(q.question)
            }
          })
        }
        if (unanswered.length > 0) {
          $q.dialog({
            title: 'Incomplete Assessment',
            message: `<div style="font-size: 14px; color: #555; margin-bottom: 8px;">Please answer all dynamic follow-up questions first:</div><ul style="padding-left: 20px; font-size: 13px; color: #333; line-height: 1.5; margin: 0;">${unanswered.map((q) => `<li style="margin-bottom: 6px;">${q}</li>`).join('')}</ul>`,
            html: true,
            ok: { label: 'OK', color: 'primary' },
          })
          return
        }
      }

      store.currentStage = targetIdx !== null ? targetIdx : (store.currentStage + 1)
      await store.updateAssessment()
    } catch (err) {
      console.log(err)
      $q.notify({
        type: 'negative',
        message: 'Failed to save assessment progress.',
        position: 'top',
      })
    }
  } else if (store.currentStage === 3) {
    if (!store.reviewState.finalized) {
      $q.notify({
        type: 'warning',
        message: 'Please complete the clinician review and sign-off/finalize the plan first.',
        position: 'top',
      })
      return
    }
    finalizeAndExit()
  }
}

const goBack = () => {
  if (store.currentStage > 0) {
    store.currentStage--
  }
}

// Clean up store on page unmount
onUnmounted(() => {
  store.disconnect()
})
</script>

<style>
@import '../css/pigmentation.css';
</style>
