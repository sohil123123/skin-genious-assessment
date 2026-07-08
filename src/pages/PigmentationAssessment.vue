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
          <PlanStage v-if="store.currentStage === 3" @trigger-print="triggerPrint" />
          <ReassessStage v-if="store.currentStage === 4" />
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

      <!-- Printable Report -->
      <PrintReport />
    </div>
  </q-page>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { usePigmentationStore } from 'src/stores/pigmentationStore'
import { Loading, LocalStorage, useQuasar } from 'quasar'

// Step Components
import ConnectGate from 'src/components/pigmentation/ConnectGate.vue'
import CaptureStage from 'src/components/pigmentation/CaptureStage.vue'
import AssessStage from 'src/components/pigmentation/AssessStage.vue'
import DiagnosisStage from 'src/components/pigmentation/DiagnosisStage.vue'
import PlanStage from 'src/components/pigmentation/PlanStage.vue'
import ReassessStage from 'src/components/pigmentation/ReassessStage.vue'
import PrintReport from 'src/components/pigmentation/PrintReport.vue'

import { useAuthStore } from 'src/stores/authStore'

const route = useRoute()
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

const userId = route.params.user_id
const isLoaded = ref(!route.params.assessment_id)

onMounted(async () => {
  const assessmentId = route.params.assessment_id
  if (assessmentId) {
    store.isConnected = true // auto-connect when editing/resuming
    await store.getSingleAssessment(assessmentId)
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
  // { title: 'Reassess', sub: 'Check goals' },
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
          message: `<div style="font-size: 14px; color: #555; margin-bottom: 8px;">Please answer all dynamic follow-up questions first:</div><ul style="padding-left: 20px; font-size: 13px; color: #333; line-height: 1.5; margin: 0;">${unanswered.map(q => `<li style="margin-bottom: 6px;">${q}</li>`).join('')}</ul>`,
          html: true,
          ok: { label: 'OK', color: 'primary' }
        })
        return
      }
    }
    if (store.currentStage === 2) {
      if (!store.diagnosis?.confirmedDx) {
        $q.notify({
          type: 'warning',
          message: 'Please confirm the working diagnosis first.',
          position: 'top'
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
  $q.dialog({
    title: 'Confirm',
    message: 'Would you like to confirm the treatment plan and return to CRM?',
    persistent: true,

    ok: {
      label: 'Yes, Confirm & Exit',
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
      store.reviewState.finalized = true
      store.reviewState.decision = store.reviewState.decision || 'approve'
      store.reviewState.ts = new Date()

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
        position: 'top'
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
        message: `<div style="font-size: 14px; color: #555; margin-bottom: 8px;">Please answer the following required fields first:</div><ul style="padding-left: 20px; font-size: 13px; color: #333; line-height: 1.5; margin: 0;">${missing.map(m => `<li style="margin-bottom: 6px;">${m}</li>`).join('')}</ul>`,
        html: true,
        ok: { label: 'OK', color: 'primary' }
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
        position: 'top'
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
            message: `<div style="font-size: 14px; color: #555; margin-bottom: 8px;">Please answer all dynamic follow-up questions first:</div><ul style="padding-left: 20px; font-size: 13px; color: #333; line-height: 1.5; margin: 0;">${unanswered.map(q => `<li style="margin-bottom: 6px;">${q}</li>`).join('')}</ul>`,
            html: true,
            ok: { label: 'OK', color: 'primary' }
          })
          return
        }
      }
      if (store.currentStage === 2) {
        if (!store.diagnosis?.confirmedDx) {
          $q.notify({
            type: 'warning',
            message: 'Please confirm the working diagnosis first.',
            position: 'top'
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
        position: 'top'
      })
    }
  } else {
    if (!store.reviewState.finalized) {
      $q.notify({
        type: 'warning',
        message: 'Please complete the clinician review and sign-off/finalize the plan first.',
        position: 'top'
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

const triggerPrint = () => {
  window.print()
}

// Clean up store on page unmount
onUnmounted(() => {
  store.disconnect()
})
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Hanken+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

/* Prevent outer layouts from imposing conflicting background colours */
.spectra-theme-page {
  background: #f2f2f0 !important;
}

/* Scoped variables and base typography rules under the .spectra-theme class namespace */
.spectra-theme {
  --porcelain: #f2f2f0;
  --paper: #fbfbfa;
  --ink: #221d26;
  --slate: #6e6975;
  --line: #e5e2e5;
  --line-soft: #eeedee;
  --melanin: #7a4a2e;
  --melanin-soft: #c29a77;
  --melanin-wash: #f3ebe4;
  --erythema: #bb5468;
  --erythema-wash: #f6e9ec;
  --violet: #6246b5;
  --canvas: #17131c;
  --good: #3f7a5e;
  --good-wash: #e7f0eb;
  --amber: #9a6a1e;
  --amber-wash: #f7efdf;
  --radius: 16px;
  --radius-sm: 11px;
  --violet-wash: #f1edfa;

  box-sizing: border-box;
  font-family:
    'Hanken Grotesk',
    -apple-system,
    system-ui,
    sans-serif;
  background: var(--porcelain);
  color: var(--ink);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  padding-bottom: 92px;
  min-height: 100vh;
}

.spectra-theme * {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.spectra-theme .serif {
  font-family: 'Fraunces', Georgia, serif;
}

.spectra-theme .mono {
  font-family: 'IBM Plex Mono', monospace;
}

.spectra-theme a {
  color: var(--melanin);
}

/* ---------- Gate ---------- */
.spectra-theme .gate {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: linear-gradient(160deg, #1d1822, #2a2230 60%, #3a2c33);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 22px;
  overflow: auto;
}

.spectra-theme .gate-card {
  background: var(--paper);
  border-radius: 20px;
  max-width: 480px;
  width: 100%;
  padding: 30px 28px;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.4);
}

.spectra-theme .gate-brand {
  display: flex;
  align-items: center;
  gap: 11px;
  margin-bottom: 20px;
}

.spectra-theme .glyph {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  flex: none;
  background: conic-gradient(
    from 210deg,
    var(--melanin) 0 90deg,
    var(--erythema) 90deg 180deg,
    var(--violet) 180deg 270deg,
    #cfcdd2 270deg 360deg
  );
  position: relative;
}

.spectra-theme .glyph::after {
  content: '';
  position: absolute;
  inset: 7px;
  border-radius: 50%;
  background: var(--paper);
}

.spectra-theme .gate-brand .nm {
  font-weight: 700;
  font-size: 16px;
  color: var(--ink);
}

.spectra-theme .gate-brand .nm span {
  color: var(--slate);
  font-weight: 400;
}

.spectra-theme .gate-card h2 {
  font-family: 'Fraunces', serif;
  font-weight: 500;
  font-size: 26px;
  letter-spacing: -0.015em;
  margin-bottom: 6px;
  color: var(--ink);
}

.spectra-theme .gate-card > p {
  color: var(--slate);
  font-size: 14px;
  margin-bottom: 18px;
}

.spectra-theme .gate-card label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--slate);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 14px 0 6px;
}

.spectra-theme .gate-card input,
.spectra-theme .gate-card select {
  width: 100%;
  font-family: inherit;
  font-size: 14px;
  padding: 11px 13px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--porcelain);
  color: var(--ink);
}

.spectra-theme .gate-card input:focus,
.spectra-theme .gate-card select:focus {
  outline: 2px solid var(--melanin-soft);
  outline-offset: 1px;
  border-color: var(--melanin-soft);
}

.spectra-theme .gate-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.spectra-theme .gate-msg {
  margin-top: 14px;
  font-size: 13px;
  padding: 0;
  min-height: 0;
}

.spectra-theme .gate-msg.show {
  padding: 11px 13px;
  border-radius: 10px;
}

.spectra-theme .gate-msg.ok {
  background: var(--good-wash);
  color: var(--good);
}

.spectra-theme .gate-msg.err {
  background: var(--erythema-wash);
  color: var(--erythema);
}

.spectra-theme .gate-msg.load {
  background: var(--line-soft);
  color: var(--slate);
}

.spectra-theme .gate-or {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 18px 0 12px;
  color: var(--slate);
  font-size: 12px;
}

.spectra-theme .gate-or::before,
.spectra-theme .gate-or::after {
  content: '';
  height: 1px;
  flex: 1;
  background: var(--line);
}

.spectra-theme .btn-demo {
  background: #211c29;
  color: #efe9f7;
  border: 1px solid #322b3c;
}

.spectra-theme .btn-demo:hover {
  background: #2c2536;
}

.spectra-theme .gate-note.demo {
  background: var(--violet-wash);
  border: 1px solid #c9beea;
  color: #4a3d6b;
  border-radius: 10px;
  padding: 11px 13px;
}

.spectra-theme .live-tag.demo {
  background: var(--amber-wash);
  color: var(--amber);
  border-color: #e8d3a0;
}

.spectra-theme .live-tag.demo .led {
  background: var(--amber);
  box-shadow: 0 0 6px var(--amber);
}

.spectra-theme .demo-ribbon {
  background: var(--amber-wash);
  border-bottom: 1px solid #e8d3a0;
  color: #5d4416;
  font-size: 12px;
  padding: 7px 20px;
  text-align: center;
  font-weight: 600;
}

.spectra-theme .demo-ribbon b {
  color: var(--amber);
}

.spectra-theme .capture-wrap {
  max-width: 640px;
  margin: 0 auto;
}

.spectra-theme .col-label {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--slate);
  margin: 0 2px 10px;
  padding-bottom: 7px;
  border-bottom: 1px solid var(--line);
}

.spectra-theme .col-label .cl-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 19px;
  height: 19px;
  border-radius: 50%;
  background: var(--violet);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  margin-right: 7px;
  vertical-align: middle;
}

.spectra-theme .assess-steps {
  display: flex;
  align-items: stretch;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.spectra-theme .astep {
  flex: 1 1 220px;
  display: flex;
  gap: 11px;
  align-items: flex-start;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 13px 15px;
}

.spectra-theme .astep .an {
  flex: none;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--violet);
  color: #fff;
  font-weight: 700;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
}

.spectra-theme .astep .at b {
  display: block;
  font-size: 14px;
  margin-bottom: 2px;
  color: var(--ink);
}

.spectra-theme .astep .at span {
  font-size: 12.5px;
  color: var(--slate);
  line-height: 1.4;
}

.spectra-theme .astep-arrow {
  display: flex;
  align-items: center;
  color: #c9c2d4;
  font-size: 20px;
  font-weight: 700;
}

.spectra-theme .read-fields {
  margin-top: 15px;
  padding-top: 14px;
  border-top: 1px dashed var(--line);
}

.spectra-theme .read-fields-head {
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--slate);
  font-weight: 600;
  margin-bottom: 11px;
}

.spectra-theme .airead-note {
  font-size: 12px;
  color: var(--slate);
  background: var(--line-soft);
  border-radius: 8px;
  padding: 8px 11px;
  margin-top: 10px;
}

@media (max-width: 640px) {
  .spectra-theme .astep-arrow {
    display: none;
  }
}

.spectra-theme .cap-status {
  font-size: 12.5px;
  padding: 10px 13px;
  border-radius: 10px;
  line-height: 1.45;
}

.spectra-theme .cap-status.load {
  background: var(--line-soft);
  color: var(--slate);
}

.spectra-theme .cap-status.ok {
  background: var(--good-wash);
  color: var(--good);
}

.spectra-theme .cap-status.err {
  background: var(--erythema-wash);
  color: var(--erythema);
}

.spectra-theme .gate-note {
  margin-top: 16px;
  font-size: 12px;
  color: var(--slate);
  line-height: 1.5;
  border-top: 1px solid var(--line-soft);
  padding-top: 14px;
}

.spectra-theme .gate-note.warn {
  background: var(--amber-wash);
  border: 1px solid #e8d3a0;
  border-radius: 10px;
  padding: 11px 13px;
  color: #5d4416;
  margin-top: 12px;
}

.spectra-theme .gate-note b {
  color: var(--ink);
}

.spectra-theme .gate-note.warn b {
  color: var(--amber);
}

/* ---------- Top bar / spine (shared) ---------- */
.spectra-theme .topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 24px;
  background: var(--paper);
  border-bottom: 1px solid var(--line);
  position: sticky;
  top: 0;
  z-index: 40;
}

.spectra-theme .brand {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
}

.spectra-theme .brand .name {
  font-weight: 700;
  letter-spacing: -0.01em;
  font-size: 16px;
  white-space: nowrap;
  color: var(--ink);
}

.spectra-theme .brand .sub {
  color: var(--slate);
  font-size: 13px;
  white-space: nowrap;
}

.spectra-theme .topbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: none;
}

.spectra-theme .live-tag {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  color: var(--good);
  border: 1px solid #bbd9c8;
  background: var(--good-wash);
  border-radius: 999px;
  padding: 5px 11px;
  white-space: nowrap;
  font-weight: 600;
}

.spectra-theme .live-tag .led {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--good);
  box-shadow: 0 0 6px var(--good);
}

.spectra-theme .model-chip {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  color: var(--slate);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 5px 10px;
  white-space: nowrap;
}

.spectra-theme .spine-wrap {
  background: var(--paper);
  border-bottom: 1px solid var(--line);
  position: sticky;
  top: 59px;
  z-index: 30;
}

.spectra-theme .spine {
  display: flex;
  max-width: 1080px;
  margin: 0 auto;
  overflow-x: auto;
  scrollbar-width: none;
}

.spectra-theme .spine::-webkit-scrollbar {
  display: none;
}

.spectra-theme .step {
  flex: 1 1 0;
  min-width: 124px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 14px;
  background: none;
  border: none;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  text-align: left;
  color: var(--slate);
  transition:
    background 0.15s,
    color 0.15s;
  position: relative;
}

.spectra-theme .step:hover {
  background: var(--line-soft);
}

.spectra-theme .step .num {
  width: 23px;
  height: 23px;
  border-radius: 50%;
  flex: none;
  display: grid;
  place-items: center;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  border: 1.5px solid var(--line);
  color: var(--slate);
  transition: all 0.15s;
}

.spectra-theme .step .lbl {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.spectra-theme .step .lbl b {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: inherit;
}

.spectra-theme .step .lbl span {
  font-size: 11px;
  color: var(--slate);
}

.spectra-theme .step.active {
  color: var(--ink);
  border-bottom-color: var(--melanin);
}

.spectra-theme .step.active .num {
  background: var(--melanin);
  border-color: var(--melanin);
  color: #fff;
}

.spectra-theme .step.done .num {
  background: var(--melanin-wash);
  border-color: var(--melanin-soft);
  color: var(--melanin);
}

.spectra-theme .step:not(:last-child)::after {
  content: '';
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 1px;
  height: 26px;
  background: var(--line-soft);
}

.spectra-theme main {
  max-width: 1080px;
  margin: 0 auto;
  padding: 26px 24px 0;
}

.spectra-theme .stage {
  animation: fade 0.35s ease;
}

@keyframes fade {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.spectra-theme .stage-head {
  margin-bottom: 20px;
}

.spectra-theme .eyebrow {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11.5px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--melanin);
  font-weight: 500;
}

.spectra-theme .stage-head h1 {
  font-family: 'Fraunces', serif;
  font-weight: 500;
  font-size: 32px;
  letter-spacing: -0.015em;
  margin-top: 5px;
  line-height: 1.05;
  color: var(--ink);
}

.spectra-theme .stage-head p {
  color: var(--slate);
  font-size: 15px;
  margin-top: 7px;
  max-width: 64ch;
}

.spectra-theme .grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.spectra-theme .grid-2.wide-l {
  grid-template-columns: 1.2fr 0.8fr;
}

.spectra-theme .col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.spectra-theme .card {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 18px;
}

.spectra-theme .card.tight {
  padding: 15px 16px;
}

.spectra-theme .card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
}

.spectra-theme .card-title h3 {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--ink);
}

.spectra-theme .card-title .meta {
  font-size: 12px;
  color: var(--slate);
}

/* ---------- Form ---------- */
.spectra-theme .fgrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 13px;
}

.spectra-theme .fgrid.three {
  grid-template-columns: 1fr 1fr 1fr;
}

.spectra-theme .field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.spectra-theme .field.full {
  grid-column: 1/-1;
}

.spectra-theme .field label {
  font-size: 12px;
  font-weight: 600;
  color: var(--slate);
}

.spectra-theme .field label .req {
  color: var(--erythema);
}

.spectra-theme .field input,
.spectra-theme .field select,
.spectra-theme .field textarea {
  font-family: inherit;
  font-size: 13.5px;
  padding: 9px 11px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: var(--porcelain);
  color: var(--ink);
  width: 100%;
}

.dynamic-question-options {
  padding: 6px 6px !important;
}

.spectra-theme .field textarea {
  resize: vertical;
  min-height: 62px;
  line-height: 1.45;
}

.spectra-theme .field input[type='number'] {
  font-family: 'IBM Plex Mono', monospace;
}

.spectra-theme .field input:focus,
.spectra-theme .field select:focus,
.spectra-theme .field textarea:focus {
  outline: 2px solid var(--melanin-soft);
  outline-offset: 1px;
  border-color: var(--melanin-soft);
}

.spectra-theme .field .hint {
  font-size: 11px;
  color: var(--slate);
}

.spectra-theme .checks {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.spectra-theme .check {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 7px 13px;
  font-size: 13px;
  color: var(--slate);
  cursor: pointer;
  user-select: none;
  background: var(--porcelain);
  transition: all 0.12s;
}

.spectra-theme .check input {
  appearance: none;
  width: 14px;
  height: 14px;
  border: 1.5px solid var(--line);
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  flex: none;
}

.spectra-theme .check input:checked {
  background: var(--melanin);
  border-color: var(--melanin);
}

.spectra-theme .check input:checked::after {
  content: '✓';
  position: absolute;
  color: #fff;
  font-size: 10px;
  left: 1.5px;
  top: -1px;
}

.spectra-theme .check:has(input:checked),
.spectra-theme .check.is-checked {
  background: var(--melanin-wash);
  border-color: var(--melanin-soft);
  color: var(--melanin);
  font-weight: 600;
}

.spectra-theme .check.danger:has(input:checked),
.spectra-theme .check.danger.is-checked {
  background: var(--erythema-wash);
  border-color: #e2a9b5;
  color: var(--erythema);
}

.spectra-theme .check.danger input:checked {
  background: var(--erythema);
  border-color: var(--erythema);
}

.spectra-theme .check input:focus {
  outline: none;
}

/* safety switches */
.spectra-theme .safety-item {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  padding: 11px 0;
  border-bottom: 1px solid var(--line-soft);
}

.spectra-theme .safety-item:last-child {
  border-bottom: none;
}

.spectra-theme .safety-item .sx {
  flex: 1;
}

.spectra-theme .safety-item .sx b {
  font-size: 13.5px;
  font-weight: 600;
  display: block;
  color: var(--ink);
}

.spectra-theme .safety-item .sx span {
  font-size: 12px;
  color: var(--slate);
}

.spectra-theme .switch {
  --w: 40px;
  width: var(--w);
  height: 23px;
  border-radius: 99px;
  background: var(--line);
  border: none;
  cursor: pointer;
  position: relative;
  flex: none;
  transition: background 0.18s;
  margin-top: 1px;
}

.spectra-theme .switch::after {
  content: '';
  position: absolute;
  top: 2.5px;
  left: 2.5px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  transition: left 0.18s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.spectra-theme .switch.on {
  background: var(--erythema);
}

.spectra-theme .switch.on::after {
  left: 19.5px;
}

/* viewer / upload */
.spectra-theme .viewer-card {
  background: var(--canvas);
  border: 1px solid #2a2530;
  border-radius: var(--radius);
  padding: 16px;
  color: #e9e6ee;
}

.spectra-theme .viewer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.spectra-theme .viewer-head .t {
  font-size: 12px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #9b94a6;
  font-weight: 600;
}

.spectra-theme .dropzone {
  border: 1.5px dashed #3d3648;
  border-radius: 12px;
  min-height: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #8a8198;
  text-align: center;
  padding: 18px;
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s;
}

.spectra-theme .dropzone:hover {
  border-color: #6b6080;
  background: rgba(255, 255, 255, 0.02);
}

.spectra-theme .dropzone .big {
  font-size: 26px;
  opacity: 0.7;
}

.spectra-theme .dropzone .sub {
  font-size: 11.5px;
  color: #6f6780;
  max-width: 30ch;
}

.spectra-theme .thumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 11px;
}

.spectra-theme .thumb {
  width: 64px;
  height: 64px;
  border-radius: 9px;
  overflow: hidden;
  border: 1px solid #322b3c;
  position: relative;
  flex: none;
}

.spectra-theme .thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.spectra-theme .thumb .rm {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 11px;
  line-height: 1;
  display: grid;
  place-items: center;
}

.spectra-theme .mode-legend {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  margin-top: 13px;
}

.spectra-theme .ml {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  font-size: 9.5px;
  color: #a89fb6;
  text-align: center;
  line-height: 1.15;
}

.spectra-theme .ml .sw {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.spectra-theme .pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  padding: 4px 11px;
  font-size: 12px;
  font-weight: 600;
}

.spectra-theme .pill-good {
  background: var(--good-wash);
  color: var(--good);
}
.spectra-theme .pill-amber {
  background: var(--amber-wash);
  color: var(--amber);
}
.spectra-theme .pill-mel {
  background: var(--melanin-wash);
  color: var(--melanin);
}
.spectra-theme .pill-ery {
  background: var(--erythema-wash);
  color: var(--erythema);
}

.spectra-theme .inline-warn {
  display: none;
  gap: 11px;
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  background: var(--erythema-wash);
  border: 1px solid #e2a9b5;
  margin-top: 13px;
}

.spectra-theme .inline-warn.show {
  display: flex;
}

.spectra-theme .inline-warn .ic {
  flex: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--erythema);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 700;
}

.spectra-theme .inline-warn .body {
  font-size: 13px;
  color: #7a3344;
}

.spectra-theme .inline-warn .body b {
  color: var(--erythema);
}

.spectra-theme .note {
  font-size: 12.5px;
  color: var(--slate);
  line-height: 1.5;
}

/* ---------- Buttons ---------- */
.spectra-theme .btn {
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 10px;
  padding: 10px 16px;
  border: 1px solid var(--line);
  background: var(--paper);
  color: var(--ink);
  transition: all 0.15s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.spectra-theme .btn:hover {
  border-color: var(--slate);
}

.spectra-theme .btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.spectra-theme .btn-primary {
  background: var(--ink);
  color: #fff;
  border-color: var(--ink);
}

.spectra-theme .btn-primary:hover {
  background: #000;
}

.spectra-theme .btn-primary:disabled:hover {
  background: var(--ink);
}

.spectra-theme .btn-block {
  width: 100%;
  justify-content: center;
  display: flex;
}

.spectra-theme .btn-lg {
  padding: 13px 20px;
  font-size: 15px;
}

/* ---------- Generate / loading ---------- */
.spectra-theme .gen-wrap {
  text-align: center;
  padding: 30px 20px;
}

.spectra-theme .spinner {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 3px solid var(--line);
  border-top-color: var(--melanin);
  margin: 0 auto 16px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.spectra-theme .gen-status {
  font-size: 14px;
  color: var(--slate);
  min-height: 20px;
}

/* ---------- Plan render ---------- */
.spectra-theme .review-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  border-radius: var(--radius);
  padding: 14px 16px;
  margin-bottom: 16px;
  font-size: 14px;
  font-weight: 600;
}

.spectra-theme .review-banner.pending {
  background: var(--amber-wash);
  border: 1px solid #e8d3a0;
  color: #5d4416;
}

.spectra-theme .review-banner.approved {
  background: var(--good-wash);
  border: 1px solid #bbd9c8;
  color: var(--good);
}

.spectra-theme .review-banner.rejected {
  background: var(--erythema-wash);
  border: 1px solid #e2a9b5;
  color: var(--erythema);
}

.spectra-theme .review-banner .ic {
  flex: none;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 15px;
  color: #fff;
}

.spectra-theme .review-banner.pending .ic {
  background: var(--amber);
}
.spectra-theme .review-banner.approved .ic {
  background: var(--good);
}
.spectra-theme .review-banner.rejected .ic {
  background: var(--erythema);
}

.spectra-theme .review-banner small {
  display: block;
  font-weight: 400;
  font-size: 12px;
  margin-top: 1px;
  opacity: 0.85;
}

.spectra-theme .pblock {
  margin-bottom: 16px;
}

.spectra-theme .pblock h3 {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--ink);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 9px;
}

.spectra-theme .pblock h3 .bar {
  width: 3px;
  height: 14px;
  border-radius: 2px;
  background: var(--melanin);
}

.spectra-theme .dx-primary {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding: 13px 15px;
  background: var(--melanin-wash);
  border: 1px solid var(--melanin-soft);
  border-radius: var(--radius-sm);
}

.spectra-theme .dx-primary .nm {
  font-size: 17px;
  font-weight: 700;
  color: var(--melanin);
}

.spectra-theme .dx-primary .rs {
  font-size: 13px;
  color: #6a4631;
  margin-top: 4px;
  line-height: 1.45;
}

.spectra-theme .dx-primary .conf {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 22px;
  font-weight: 600;
  color: var(--melanin);
  flex: none;
}

.spectra-theme .dx-alt {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  padding: 9px 0;
  border-bottom: 1px solid var(--line-soft);
}

.spectra-theme .dx-alt:last-child {
  border-bottom: none;
}

.spectra-theme .dx-alt .l b {
  font-weight: 600;
  color: var(--ink);
}

.spectra-theme .dx-alt .l span {
  color: var(--slate);
  font-size: 12px;
  display: block;
  margin-top: 1px;
}

.spectra-theme .dx-alt .r {
  color: var(--slate);
  font-size: 12px;
  white-space: nowrap;
  font-family: 'IBM Plex Mono', monospace;
}

.spectra-theme .twin {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.spectra-theme .vbox {
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 13px 14px;
  background: var(--paper);
}

.spectra-theme .vbox .lab {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--slate);
}

.spectra-theme .vbox .hd {
  font-family: 'Fraunces', serif;
  font-size: 19px;
  font-weight: 600;
  margin-top: 3px;
  letter-spacing: -0.01em;
}

.spectra-theme .vbox .ds {
  font-size: 12.5px;
  color: var(--slate);
  margin-top: 4px;
  line-height: 1.45;
}

.spectra-theme .vbox.epidermal {
  background: var(--melanin-wash);
  border-color: var(--melanin-soft);
}

.spectra-theme .vbox.epidermal .hd {
  color: var(--melanin);
}

.spectra-theme .vbox.dermal {
  background: var(--erythema-wash);
  border-color: #e2a9b5;
}

.spectra-theme .vbox.dermal .hd {
  color: var(--erythema);
}

.spectra-theme .vbox.melanin .hd {
  color: var(--melanin);
}
.spectra-theme .vbox.vascular .hd {
  color: var(--erythema);
}

.spectra-theme .redflag {
  display: flex;
  gap: 12px;
  border-radius: var(--radius-sm);
  padding: 14px 15px;
  background: var(--erythema-wash);
  border: 1px solid var(--erythema);
}

.spectra-theme .redflag .ic {
  flex: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--erythema);
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 700;
}

.spectra-theme .redflag .bd {
  font-size: 13.5px;
  color: #7a3344;
}

.spectra-theme .redflag .bd b {
  color: var(--erythema);
}

.spectra-theme .tier {
  border: 1px solid var(--line);
  border-radius: var(--radius);
  overflow: hidden;
  margin-bottom: 13px;
}

.spectra-theme .tier-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--paper);
}

.spectra-theme .tier-tag {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  font-weight: 600;
  border-radius: 6px;
  padding: 3px 8px;
  flex: none;
}

.spectra-theme .t0 .tier-tag {
  background: var(--ink);
  color: #fff;
}
.spectra-theme .t1 .tier-tag {
  background: var(--melanin-wash);
  color: var(--melanin);
  border: 1px solid var(--melanin-soft);
}
.spectra-theme .t2 .tier-tag {
  background: var(--erythema-wash);
  color: var(--erythema);
  border: 1px solid #e2a9b5;
}
.spectra-theme .tx .tier-tag {
  background: var(--good-wash);
  color: var(--good);
  border: 1px solid #bbd9c8;
}

.spectra-theme .tier-head .ttl {
  font-weight: 700;
  font-size: 14px;
  color: var(--ink);
}

.spectra-theme .tier-body {
  padding: 6px 16px 14px;
  background: var(--paper);
  border-top: 1px solid var(--line-soft);
}

.spectra-theme .agent {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 9px 0;
  font-size: 13.5px;
  border-bottom: 1px solid var(--line-soft);
}

.spectra-theme .agent:last-child {
  border-bottom: none;
}

.spectra-theme .agent .ab {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--melanin-soft);
  margin-top: 8px;
  flex: none;
}

.spectra-theme .agent .ax {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.spectra-theme .agent .ax b {
  font-weight: 600;
  color: var(--ink);
}

.spectra-theme .agent .ax .sub {
  color: var(--slate);
  font-size: 12px;
  display: block;
  margin-top: 1px;
}

.spectra-theme .agent .ax .caut {
  color: var(--amber);
  font-size: 12px;
  display: block;
  margin-top: 2px;
}

.spectra-theme .agent.blocked {
  opacity: 0.6;
}

.spectra-theme .agent.blocked .ax b {
  text-decoration: line-through;
}

.spectra-theme .agent .badge {
  font-size: 10px;
  font-weight: 700;
  font-family: 'IBM Plex Mono', monospace;
  border-radius: 5px;
  padding: 2px 6px;
  flex: none;
  margin-top: 1px;
}

.spectra-theme .agent .badge.x {
  background: var(--erythema-wash);
  color: var(--erythema);
}

.spectra-theme .flaglist {
  border: 1px solid #e2a9b5;
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.spectra-theme .flaglist .fl {
  display: flex;
  gap: 10px;
  padding: 11px 14px;
  font-size: 13px;
  border-bottom: 1px solid var(--erythema-wash);
  background: #fdf6f8;
}

.spectra-theme .flaglist .fl:last-child {
  border-bottom: none;
}

.spectra-theme .flaglist .fl .ic {
  color: var(--erythema);
  font-weight: 700;
  flex: none;
}

.spectra-theme .ulist {
  list-style: none;
}

.spectra-theme .ulist li {
  font-size: 13px;
  color: var(--ink);
  padding: 7px 0 7px 18px;
  position: relative;
  border-bottom: 1px solid var(--line-soft);
}

.spectra-theme .ulist li:last-child {
  border-bottom: none;
}

.spectra-theme .ulist li::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 13px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--melanin-soft);
}

.spectra-theme .summary-box {
  background: var(--line-soft);
  border-radius: var(--radius-sm);
  padding: 14px 16px;
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--ink);
}

/* ---------- Sign-off ---------- */
.spectra-theme .signoff {
  border: 2px solid var(--ink);
  border-radius: var(--radius);
  padding: 18px;
  background: var(--paper);
}

.spectra-theme .signoff h3 {
  font-family: 'Fraunces', serif;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.01em;
  margin-bottom: 4px;
  color: var(--ink);
}

.spectra-theme .signoff .sub {
  font-size: 13px;
  color: var(--slate);
  margin-bottom: 16px;
}

.spectra-theme .so-check {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 14px;
  padding: 12px 0;
  cursor: pointer;
  color: var(--ink);
}

.spectra-theme .so-check input {
  appearance: none;
  width: 18px;
  height: 18px;
  border: 1.5px solid var(--line);
  border-radius: 5px;
  flex: none;
  cursor: pointer;
  position: relative;
  margin-top: 1px;
}

.spectra-theme .so-check input:checked {
  background: var(--good);
  border-color: var(--good);
}

.spectra-theme .so-check input:checked::after {
  content: '✓';
  position: absolute;
  color: #fff;
  font-size: 13px;
  left: 2.5px;
  top: -1px;
}

.spectra-theme .so-radios {
  display: flex;
  gap: 9px;
  margin: 8px 0 14px;
  flex-wrap: wrap;
}

.spectra-theme .so-radio {
  flex: 1;
  min-width: 130px;
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 11px 13px;
  cursor: pointer;
  font-size: 13.5px;
  font-weight: 600;
  text-align: center;
  transition: all 0.12s;
  color: var(--slate);
  background: var(--paper);
}

.spectra-theme .so-radio:hover {
  border-color: var(--slate);
}

.spectra-theme .so-radio.sel-good {
  border-color: var(--good);
  background: var(--good-wash);
  color: var(--good);
}
.spectra-theme .so-radio.sel-amber {
  border-color: var(--amber);
  background: var(--amber-wash);
  color: var(--amber);
}
.spectra-theme .so-radio.sel-red {
  border-color: var(--erythema);
  background: var(--erythema-wash);
  color: var(--erythema);
}

.spectra-theme .signoff textarea {
  width: 100%;
  font-family: inherit;
  font-size: 13.5px;
  padding: 11px 13px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--porcelain);
  min-height: 80px;
  resize: vertical;
  line-height: 1.45;
  color: var(--ink);
}

.spectra-theme .signoff .so-name {
  display: flex;
  gap: 10px;
  margin: 14px 0;
  flex-wrap: wrap;
}

.spectra-theme .signoff .so-name input {
  flex: 1;
  min-width: 160px;
  font-family: inherit;
  font-size: 13.5px;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--porcelain);
  color: var(--ink);
}

.spectra-theme .stamp {
  margin-top: 14px;
  padding: 13px 15px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  display: none;
}

.spectra-theme .stamp.show {
  display: block;
}

.spectra-theme .stamp.ok {
  background: var(--good-wash);
  border: 1px solid #bbd9c8;
  color: var(--good);
}

.spectra-theme .stamp.no {
  background: var(--erythema-wash);
  border: 1px solid #e2a9b5;
  color: var(--erythema);
}

.spectra-theme .stamp b {
  font-weight: 700;
}

.spectra-theme .err-box {
  background: var(--erythema-wash);
  border: 1px solid #e2a9b5;
  border-radius: var(--radius-sm);
  padding: 14px 16px;
  font-size: 13.5px;
  color: #7a3344;
}

.spectra-theme .err-box b {
  color: var(--erythema);
}

/* ---------- Footer ---------- */
.spectra-theme .footnav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 40;
  background: var(--paper);
  border-top: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 13px 24px;
}

.spectra-theme .footnav .progress {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 12.5px;
  color: var(--slate);
}

.spectra-theme .footnav .progress .track {
  width: 120px;
  height: 5px;
  border-radius: 99px;
  background: var(--line-soft);
  overflow: hidden;
}

.spectra-theme .footnav .progress .track > span {
  display: block;
  height: 100%;
  background: var(--melanin);
  border-radius: 99px;
  transition: width 0.4s;
}

.spectra-theme .footnav .nav-btns {
  display: flex;
  gap: 9px;
}

.spectra-theme .disclaimer {
  max-width: 1080px;
  margin: 24px auto 30px;
  padding: 0 24px;
  text-align: center;
}

.spectra-theme .disclaimer span {
  font-size: 11.5px;
  color: var(--slate);
  font-family: 'IBM Plex Mono', monospace;
  letter-spacing: 0.02em;
}

/* ---------- AI image-analysis additions ---------- */
.spectra-theme .thumb-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 72px;
}

.spectra-theme .thumb-mode {
  font-family: inherit;
  font-size: 10px;
  padding: 3px 4px;
  border: 1px solid #322b3c;
  border-radius: 6px;
  background: #211c29;
  color: #cfc6dd;
  width: 72px;
}

.spectra-theme .thumb-mode:focus {
  outline: 1px solid #6b6080;
}

.spectra-theme .sugtag {
  display: inline-block;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.05em;
  padding: 1px 5px;
  border-radius: 5px;
  vertical-align: middle;
  margin-left: 5px;
  background: var(--amber-wash);
  color: var(--amber);
  border: 1px solid #e8d3a0;
}

.spectra-theme .sugtag.confirmed {
  background: var(--good-wash);
  color: var(--good);
  border-color: #bbd9c8;
}

.spectra-theme .field.is-suggested input,
.spectra-theme .field.is-suggested select {
  border-color: var(--amber);
  background: #fdf8ef;
}

.spectra-theme .field.is-confirmed input,
.spectra-theme .field.is-confirmed select {
  border-color: #bbd9c8;
  background: #f1f8f4;
}

.spectra-theme .airead-line {
  display: flex;
  gap: 9px;
  padding: 8px 0;
  font-size: 13px;
  border-bottom: 1px solid var(--line-soft);
}

.spectra-theme .airead-line:last-child {
  border-bottom: none;
}

.spectra-theme .airead-line .k {
  color: var(--slate);
  min-width: 96px;
  flex: none;
  font-size: 12px;
}

.spectra-theme .airead-line .v {
  font-weight: 600;
  color: var(--ink);
}

.spectra-theme .airead-line .v small {
  font-weight: 400;
  color: var(--slate);
  display: block;
  font-size: 11.5px;
  margin-top: 1px;
}

.spectra-theme .airead-caveats {
  margin-top: 11px;
  background: var(--amber-wash);
  border: 1px solid #e8d3a0;
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  font-size: 12px;
  color: #5d4416;
}

.spectra-theme .airead-caveats b {
  color: var(--amber);
}

.spectra-theme .airead-caveats ul {
  list-style: none;
  margin-top: 5px;
}

.spectra-theme .airead-caveats li {
  padding: 2px 0 2px 14px;
  position: relative;
}

.spectra-theme .airead-caveats li::before {
  content: '–';
  position: absolute;
  left: 2px;
  color: var(--amber);
}

.spectra-theme .confirm-readings {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.spectra-theme .confirm-readings .done {
  font-size: 12.5px;
  color: var(--good);
  font-weight: 600;
  display: none;
}

.spectra-theme .confirm-readings.confirmed .done {
  display: inline;
}

.spectra-theme .confirm-readings.confirmed button {
  display: none;
}

/* ---------- scores / goals / dermoscopy ---------- */
.spectra-theme .scoregrid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 4px;
}

.spectra-theme .scorecard {
  flex: 1 1 120px;
  min-width: 120px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 11px 13px;
  background: var(--paper);
}

.spectra-theme .scorecard .sl {
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--slate);
  font-weight: 600;
}

.spectra-theme .scorecard .sv {
  font-family: 'Fraunces', serif;
  font-size: 24px;
  font-weight: 600;
  margin: 2px 0 1px;
  color: var(--ink);
}

.spectra-theme .scorecard .si {
  font-size: 11.5px;
  color: var(--slate);
}

.spectra-theme .dermo-req {
  background: var(--violet-wash);
  border: 1px solid #c9beea;
  border-radius: var(--radius);
  padding: 15px 17px;
  margin-bottom: 16px;
}

.spectra-theme .dermo-req h4 {
  font-family: 'Fraunces', serif;
  font-size: 16px;
  color: var(--violet);
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.spectra-theme .goal-tbl {
  display: flex;
  flex-direction: column;
  gap: 9px;
  margin-top: 4px;
}

.spectra-theme .goal-row {
  display: grid;
  grid-template-columns: 1.4fr 0.8fr 0.8fr 1fr;
  gap: 10px;
  align-items: start;
  padding: 11px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--paper);
}

.spectra-theme .goal-row .gh {
  font-size: 10.5px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--slate);
  font-weight: 600;
  margin-bottom: 3px;
}

.spectra-theme .goal-row .gm {
  font-weight: 600;
  font-size: 13.5px;
  color: var(--ink);
}

.spectra-theme .goal-row .gsub {
  font-size: 12px;
  color: var(--slate);
}

.spectra-theme .goal-row input,
.spectra-theme .ra-goal input {
  width: 100%;
  padding: 7px 9px;
  border: 1px solid var(--line);
  border-radius: 8px;
  font-family: inherit;
  font-size: 13px;
  background: var(--porcelain);
  color: var(--ink);
}

.spectra-theme .ra-goal {
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 12px;
  margin-bottom: 10px;
  background: var(--paper);
}

.spectra-theme .ra-goal > .ra-metric {
  font-weight: 600;
  margin-bottom: 8px;
  background: var(--porcelain);
  color: var(--ink);
}

.spectra-theme .ra-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 8px;
}

@media (max-width: 640px) {
  .spectra-theme .ra-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.spectra-theme .goal-status {
  font-size: 11.5px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 20px;
  display: inline-block;
  margin-top: 5px;
}

.spectra-theme .gs-met {
  background: var(--good-wash);
  color: var(--good);
}
.spectra-theme .gs-track {
  background: var(--violet-wash);
  color: var(--violet);
}
.spectra-theme .gs-plateau {
  background: var(--amber-wash);
  color: var(--amber);
}
.spectra-theme .gs-worse {
  background: var(--erythema-wash);
  color: var(--erythema);
}

.spectra-theme .goal-hdr {
  display: grid;
  grid-template-columns: 1.4fr 0.8fr 0.8fr 1fr;
  gap: 10px;
  padding: 0 11px;
  font-size: 10.5px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--slate);
  font-weight: 600;
}

@media (max-width: 640px) {
  .spectra-theme .goal-row,
  .spectra-theme .goal-hdr {
    grid-template-columns: 1fr 1fr;
  }
  .spectra-theme .goal-hdr {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .spectra-theme * {
    animation: none !important;
    transition: none !important;
  }
}

/* Hide main layout elements when printing the Spectra report */
@media print {
  body {
    background: #fff;
    padding: 0;
  }
  .q-header,
  .q-drawer,
  .q-footer,
  .topbar,
  .spine-wrap,
  .footnav,
  .disclaimer,
  main,
  .gate {
    display: none !important;
  }
}

@media (max-width: 860px) {
  .spectra-theme .grid-2,
  .spectra-theme .grid-2.wide-l {
    grid-template-columns: 1fr;
  }
  .spectra-theme .fgrid,
  .spectra-theme .fgrid.three {
    grid-template-columns: 1fr;
  }
  .spectra-theme .twin {
    grid-template-columns: 1fr;
  }
  .spectra-theme .stage-head h1 {
    font-size: 27px;
  }
  .spectra-theme .brand .sub {
    display: none;
  }
  .spectra-theme .model-chip {
    display: none;
  }
}

@media (max-width: 560px) {
  .spectra-theme main {
    padding: 20px 16px 0;
  }
  .spectra-theme .topbar {
    padding: 12px 16px;
  }
  .spectra-theme .gate-card {
    padding: 24px 20px;
  }
  .spectra-theme .mode-legend {
    gap: 4px;
  }
  .spectra-theme .ml {
    font-size: 8.5px;
  }
  .spectra-theme .footnav {
    padding: 11px 16px;
  }
  .spectra-theme .footnav .progress .track {
    width: 64px;
  }
  .spectra-theme .so-radios {
    flex-direction: column;
  }
}
</style>
