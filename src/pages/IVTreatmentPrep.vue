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
            <span class="text-xl font-light tracking-wider">AI AESTHETICS (IV)</span>
          </div>
        </div>

        <div class="step-indicator">
          <template v-for="(s, i) in steps" :key="'step-' + i">
            <div class="step-dot">
              <div :class="['dot', { done: i < currentStep, active: i === currentStep }]">
                <span v-if="i < currentStep">✓</span>
                <span v-else>{{ i + 1 }}</span>
              </div>
              <div :class="['label', { active: i === currentStep, done: i < currentStep }]">
                <span v-html="s.label"></span>
              </div>
            </div>
            <div
              v-if="i < steps.length - 1"
              :class="['step-line', { done: i < currentStep }]"
            ></div>
          </template>
        </div>

        <q-form @submit.prevent="onSubmit">
          <!-- STEP 0: Safety Gates -->
          <div v-if="currentStep === 0">
            <div class="section-header">
              <div class="section-icon">
                <svg viewBox="0 0 24 24">
                  <path
                    d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                    stroke="white"
                    fill="none"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </div>
              <div>
                <div class="section-title">Safety Gates (Hard Blocks)</div>
                <div class="section-sub">Non-negotiable, every session, take ~3 minutes</div>
              </div>
            </div>

            <div class="caution-banner" v-if="hasHardBlock">
              <svg
                class="caution-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                style="color: var(--danger-text)"
              >
                <path
                  d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <div class="caution-text" style="color: var(--danger-text)">
                Safety hard-block triggered. IV session cannot proceed based on current values.
              </div>
            </div>

            <div class="form-grid" style="margin-bottom: 16px">
              <div class="form-group">
                <label class="form-label">BP Systolic (mmHg)</label>
                <input
                  class="form-input"
                  type="number"
                  v-model.number="form.bp_systolic"
                  placeholder="< 150"
                  required
                />
              </div>
              <div class="form-group">
                <label class="form-label">BP Diastolic (mmHg)</label>
                <input
                  class="form-input"
                  type="number"
                  v-model.number="form.bp_diastolic"
                  placeholder="< 100"
                  required
                />
              </div>
              <div class="form-group">
                <label class="form-label">HR (bpm)</label>
                <input class="form-input" type="number" v-model.number="form.hr" required />
              </div>
              <div class="form-group">
                <label class="form-label">SpO2 (%)</label>
                <input
                  class="form-input"
                  type="number"
                  v-model.number="form.spo2"
                  placeholder=">= 90%"
                  required
                />
              </div>
              <div class="form-group">
                <label class="form-label">Perfusion Index (PI)</label>
                <input
                  class="form-input"
                  type="number"
                  step="0.1"
                  v-model.number="form.perfusion_index"
                  placeholder="e.g. 1.5"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Temperature (°C)</label>
                <input
                  class="form-input"
                  type="number"
                  step="0.1"
                  v-model.number="form.temperature"
                  placeholder="< 37.5°C"
                  required
                />
              </div>
            </div>

            <div class="divider"></div>

            <div class="form-grid" style="margin-bottom: 16px">
              <div class="form-group full">
                <label class="form-label">Chest pain or shortness of breath right now?</label>
                <div class="chip-group">
                  <span
                    :class="['chip', form.chest_pain === 'Yes' ? 'selected-danger' : '']"
                    @click="form.chest_pain = 'Yes'"
                    >Yes</span
                  >
                  <span
                    :class="['chip', form.chest_pain === 'No' ? 'selected' : '']"
                    @click="form.chest_pain = 'No'"
                    >No</span
                  >
                </div>
              </div>
              <div class="form-group full">
                <label class="form-label">Fainting or near-fainting today?</label>
                <div class="chip-group">
                  <span
                    :class="['chip', form.fainting === 'Yes' ? 'selected-danger' : '']"
                    @click="form.fainting = 'Yes'"
                    >Yes</span
                  >
                  <span
                    :class="['chip', form.fainting === 'No' ? 'selected' : '']"
                    @click="form.fainting = 'No'"
                    >No</span
                  >
                </div>
              </div>
              <div class="form-group full">
                <label class="form-label">Confusion or severe weakness right now?</label>
                <div class="chip-group">
                  <span
                    :class="['chip', form.confusion === 'Yes' ? 'selected-danger' : '']"
                    @click="form.confusion = 'Yes'"
                    >Yes</span
                  >
                  <span
                    :class="['chip', form.confusion === 'No' ? 'selected' : '']"
                    @click="form.confusion = 'No'"
                    >No</span
                  >
                </div>
              </div>
            </div>
          </div>

          <!-- STEP 1: Change-detection -->
          <div v-if="currentStep === 1">
            <div class="section-header">
              <div class="section-icon">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="white" fill="none" stroke-width="2" />
                  <line x1="12" y1="8" x2="12" y2="12" stroke="white" stroke-width="2" />
                  <line x1="12" y1="16" x2="12.01" y2="16" stroke="white" stroke-width="2" />
                </svg>
              </div>
              <div>
                <div class="section-title">Change-detection screen</div>
                <div class="section-sub">
                  Catches new safety issues since intake was first taken
                </div>
              </div>
            </div>

            <div class="form-grid" style="margin-bottom: 16px">
              <div class="form-group full">
                <label class="form-label"
                  >Anything changed since your last visit? (New diagnoses, hospitalizations, ER
                  visits)</label
                >
                <textarea
                  class="form-input"
                  v-model="form.changes_since_last_visit"
                  rows="3"
                  placeholder="Enter details or 'None'"
                ></textarea>
              </div>

              <div class="form-group full">
                <label class="form-label">Any new medications since last session?</label>
                <div class="chip-group">
                  <span
                    :class="['chip', form.new_medications === 'Yes' ? 'selected-warn' : '']"
                    @click="form.new_medications = 'Yes'"
                    >Yes</span
                  >
                  <span
                    :class="['chip', form.new_medications === 'No' ? 'selected' : '']"
                    @click="form.new_medications = 'No'"
                    >No</span
                  >
                </div>
              </div>
              <div class="form-group full" v-if="form.new_medications === 'Yes'">
                <label class="form-label">List new medications</label>
                <input class="form-input" v-model="form.new_medications_list" />
              </div>

              <div class="form-group full">
                <label class="form-label">Any new allergies or reactions since last session?</label>
                <div class="chip-group">
                  <span
                    :class="['chip', form.new_allergies === 'Yes' ? 'selected-warn' : '']"
                    @click="form.new_allergies = 'Yes'"
                    >Yes</span
                  >
                  <span
                    :class="['chip', form.new_allergies === 'No' ? 'selected' : '']"
                    @click="form.new_allergies = 'No'"
                    >No</span
                  >
                </div>
              </div>

              <div class="form-group full">
                <label class="form-label">Have you eaten and hydrated today?</label>
                <div class="chip-group">
                  <span
                    :class="['chip', form.eaten_hydrated === 'Yes' ? 'selected' : '']"
                    @click="form.eaten_hydrated = 'Yes'"
                    >Yes</span
                  >
                  <span
                    :class="['chip', form.eaten_hydrated === 'No' ? 'selected-warn' : '']"
                    @click="form.eaten_hydrated = 'No'"
                    >No</span
                  >
                </div>
              </div>
            </div>
          </div>

          <!-- STEP 2: Same-day state -->
          <div v-if="currentStep === 2">
            <div class="section-header">
              <div class="section-icon">
                <svg viewBox="0 0 24 24">
                  <path
                    d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
                    stroke="white"
                    fill="none"
                    stroke-width="2"
                  />
                </svg>
              </div>
              <div>
                <div class="section-title">Same-day state</div>
                <div class="section-sub">Drives today's protocol customization</div>
              </div>
            </div>

            <div class="form-grid" style="margin-bottom: 16px">
              <div class="form-group">
                <label class="form-label">Sleep hours last night</label>
                <input class="form-input" type="number" v-model.number="form.sleep_hours" />
              </div>
              <div class="form-group">
                <label class="form-label">Caffeine servings today</label>
                <input class="form-input" type="number" v-model.number="form.caffeine" />
              </div>

              <div class="form-group full">
                <label class="form-label">Alcohol last 24h</label>
                <div class="chip-group">
                  <span
                    v-for="opt in ['None', '1-2', '3-5', '>5']"
                    :key="opt"
                    :class="['chip', form.alcohol === opt ? 'selected' : '']"
                    @click="form.alcohol = opt"
                    >{{ opt }}</span
                  >
                </div>
              </div>

              <div class="form-group full">
                <label class="form-label">Exercise last 24h</label>
                <div class="chip-group">
                  <span
                    v-for="opt in ['None', 'Light', 'Heavy']"
                    :key="opt"
                    :class="['chip', form.exercise === opt ? 'selected' : '']"
                    @click="form.exercise = opt"
                    >{{ opt }}</span
                  >
                </div>
              </div>

              <div class="form-group full">
                <label class="form-label">Perceived stress today</label>
                <div class="chip-group">
                  <span
                    v-for="opt in ['Low', 'Medium', 'High']"
                    :key="opt"
                    :class="['chip', form.stress === opt ? 'selected' : '']"
                    @click="form.stress = opt"
                    >{{ opt }}</span
                  >
                </div>
              </div>
            </div>

            <div class="divider"></div>

            <div class="form-label" style="margin-bottom: 8px">Active symptom snapshot</div>

            <div class="subjective-row" v-for="sym in ['fatigue', 'headache', 'nausea']" :key="sym">
              <span class="subj-label" style="text-transform: capitalize">{{ sym }} Severity</span>
              <div class="subj-options">
                <span
                  v-for="(o, i) in ['None', 'Mild', 'Moderate', 'Severe']"
                  :key="o"
                  :class="[
                    'subj-opt',
                    form[sym + '_severity'] === o
                      ? i === 0
                        ? 'sel'
                        : i === 1
                          ? 'sel-2'
                          : i === 2
                            ? 'sel-warn'
                            : 'sel-bad'
                      : '',
                  ]"
                  @click="form[sym + '_severity'] = o"
                  >{{ o }}</span
                >
              </div>
            </div>

            <div class="subjective-row">
              <span class="subj-label">Other Symptoms</span>
              <div class="subj-options">
                <span
                  :class="['subj-opt', form.brain_fog === 'Yes' ? 'sel-warn' : '']"
                  @click="form.brain_fog = form.brain_fog === 'Yes' ? 'No' : 'Yes'"
                  >Brain Fog ({{ form.brain_fog }})</span
                >
                <span
                  :class="['subj-opt', form.dizziness_on_standing === 'Yes' ? 'sel-warn' : '']"
                  @click="form.dizziness_on_standing = form.dizziness_on_standing === 'Yes' ? 'No' : 'Yes'"
                  >Dizziness on Standing ({{ form.dizziness_on_standing }})</span
                >
                <span
                  :class="['subj-opt', form.muscle_cramps === 'Yes' ? 'sel-warn' : '']"
                  @click="form.muscle_cramps = form.muscle_cramps === 'Yes' ? 'No' : 'Yes'"
                  >Cramps ({{ form.muscle_cramps }})</span
                >
                <span
                  :class="['subj-opt', form.palpitations === 'Yes' ? 'sel-bad' : '']"
                  @click="form.palpitations = form.palpitations === 'Yes' ? 'No' : 'Yes'"
                  >Palpitations ({{ form.palpitations }})</span
                >
                <span
                  :class="['subj-opt', form.swelling === 'Yes' ? 'sel-warn' : '']"
                  @click="form.swelling = form.swelling === 'Yes' ? 'No' : 'Yes'"
                  >Swelling ({{ form.swelling }})</span
                >
              </div>
            </div>

            <div class="form-grid" style="margin-top: 16px">
              <div class="form-group">
                <label class="form-label">Energy (0-10 VAS)</label>
                <input
                  class="form-input"
                  type="number"
                  min="0"
                  max="10"
                  v-model.number="form.energy"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Mood (0-10 VAS)</label>
                <input
                  class="form-input"
                  type="number"
                  min="0"
                  max="10"
                  v-model.number="form.mood"
                />
              </div>
            </div>
          </div>

          <!-- STEP 3: Plan-aware feedback -->
          <div v-if="currentStep === 3">
            <div class="section-header">
              <div class="section-icon">
                <svg viewBox="0 0 24 24">
                  <path
                    d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"
                    stroke="white"
                    fill="none"
                    stroke-width="2"
                  />
                  <polyline points="17 8 12 3 7 8" stroke="white" fill="none" stroke-width="2" />
                  <line x1="12" y1="3" x2="12" y2="15" stroke="white" stroke-width="2" />
                </svg>
              </div>
              <div>
                <div class="section-title">Plan-aware feedback</div>
                <div class="section-sub">Assessing progression since the last session</div>
              </div>
            </div>

            <div class="form-grid" style="margin-bottom: 16px">
              <div class="form-group full">
                <label class="form-label">Since your last session, what improved?</label>
                <textarea
                  class="form-input"
                  v-model="form.what_improved"
                  rows="3"
                  placeholder="Enter positive feedback or 'None'"
                ></textarea>
              </div>
              <div class="form-group full">
                <label class="form-label">What didn't improve or felt worse?</label>
                <textarea
                  class="form-input"
                  v-model="form.what_did_not_improve"
                  rows="3"
                  placeholder="Enter negative feedback or 'None'"
                ></textarea>
              </div>
            </div>
          </div>

          <!-- STEP 4: Objective measurements -->
          <div v-if="currentStep === 4">
            <div class="section-header">
              <div class="section-icon">
                <svg viewBox="0 0 24 24">
                  <rect
                    x="2"
                    y="3"
                    width="20"
                    height="14"
                    rx="2"
                    stroke="white"
                    fill="none"
                    stroke-width="2"
                  />
                  <line x1="8" y1="21" x2="16" y2="21" stroke="white" stroke-width="2" />
                  <line x1="12" y1="17" x2="12" y2="21" stroke="white" stroke-width="2" />
                </svg>
              </div>
              <div>
                <div class="section-title">Objective re-measurement</div>
                <div class="section-sub">Standardized measurements to track progression</div>
              </div>
            </div>

            <div class="form-grid" style="margin-bottom: 16px">
              <div class="form-group full">
                <label class="form-label">Pre-IV standard measurements taken?</label>
                <div class="chip-group">
                  <span
                    :class="['chip', form.skin_scan ? 'selected' : '']"
                    @click="form.skin_scan = !form.skin_scan"
                    >6-mode skin scan</span
                  >
                  <span
                    :class="['chip', form.body_comp ? 'selected' : '']"
                    @click="form.body_comp = !form.body_comp"
                    >Body composition (BIA)</span
                  >
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Standardized HRV reading</label>
                <input class="form-input" type="number" v-model.number="form.hrv" />
              </div>
              <div class="form-group">
                <label class="form-label">Grip strength</label>
                <input
                  class="form-input"
                  type="number"
                  v-model.number="form.grip_strength"
                  placeholder="Best of 2-3"
                />
              </div>
            </div>

            <div class="divider"></div>

            <div class="form-label" style="margin-bottom: 8px">
              Vitals re-taken after 5-minute seated rest in the same chair, pre-IV
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Rested BP Systolic</label>
                <input class="form-input" type="number" v-model.number="form.rested_bp_systolic" />
              </div>
              <div class="form-group">
                <label class="form-label">Rested BP Diastolic</label>
                <input class="form-input" type="number" v-model.number="form.rested_bp_diastolic" />
              </div>
              <div class="form-group">
                <label class="form-label">Rested HR</label>
                <input class="form-input" type="number" v-model.number="form.rested_hr" />
              </div>
              <div class="form-group">
                <label class="form-label">Rested SpO2</label>
                <input class="form-input" type="number" v-model.number="form.rested_spo2" />
              </div>
              <div class="form-group">
                <label class="form-label">Rested Perfusion Index</label>
                <input class="form-input" type="number" step="0.1" v-model.number="form.rested_perfusion_index" />
              </div>
            </div>
          </div>

          <div class="nav-bar">
            <q-btn color="black" :disabled="currentStep === 0" @click="prevStep" icon="arrow_back">
              PREVIOUS
            </q-btn>
            <q-btn
              v-if="currentStep < steps.length - 1"
              @click="nextStep"
              icon-right="arrow_forward"
              color="info"
              >NEXT</q-btn
            >
            <q-btn
              color="accent"
              v-if="currentStep === steps.length - 1"
              :disabled="hasHardBlock"
              @click="onSubmit"
            >
              FINALIZE & EXIT
            </q-btn>
          </div>
        </q-form>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { debounce, Notify } from 'quasar'
import { useTreatmentFlowStore } from 'stores/treatmentFlow'
import { useAssessmentStore } from 'src/stores/assessmentStore'
import { api } from 'src/boot/axios'

const route = useRoute()
const router = useRouter()
const store = useTreatmentFlowStore()
const assessmentStore = useAssessmentStore()

const sessionParam = route.params.session_id
const sessionID = sessionParam ? Number(sessionParam) : 1

const currentStep = ref(0)

const steps = [
  { label: 'Safety<br>Gates', short: 'Safety' },
  { label: 'Change<br>Screen', short: 'Changes' },
  { label: 'Same-day<br>State', short: 'State' },
  { label: 'Plan<br>Feedback', short: 'Feedback' },
  { label: 'Objective<br>Measure', short: 'Measurements' },
]

function nextStep() {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++
  }
}

function prevStep() {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const form = ref({
  bp_systolic: null,
  bp_diastolic: null,
  hr: null,
  spo2: null,
  perfusion_index: null,
  temperature: null,
  chest_pain: null,
  fainting: null,
  confusion: null,
  changes_since_last_visit: '',
  new_medications: null,
  new_medications_list: '',
  new_allergies: null,
  eaten_hydrated: null,
  sleep_hours: null,
  alcohol: null,
  caffeine: null,
  exercise: null,
  stress: null,
  energy: null,
  mood: null,
  fatigue_severity: 'None',
  headache_severity: 'None',
  nausea_severity: 'None',
  brain_fog: 'No',
  dizziness_on_standing: 'No',
  muscle_cramps: 'No',
  palpitations: 'No',
  swelling: 'No',
  what_improved: '',
  what_did_not_improve: '',
  skin_scan: false,
  body_comp: false,
  hrv: null,
  grip_strength: null,
  rested_bp_systolic: null,
  rested_bp_diastolic: null,
  rested_hr: null,
  rested_spo2: null,
  rested_perfusion_index: null,
})

const hasHardBlock = computed(() => {
  return (
    (form.value.bp_systolic && form.value.bp_systolic >= 150) ||
    (form.value.bp_diastolic && form.value.bp_diastolic >= 100) ||
    (form.value.spo2 !== null && form.value.spo2 < 90) ||
    (form.value.temperature !== null && form.value.temperature >= 37.5) ||
    form.value.chest_pain === 'Yes' ||
    form.value.fainting === 'Yes' ||
    form.value.confusion === 'Yes'
  )
})

let isInitializing = true

onMounted(async () => {
  if (route.params.assessment_id) {
    await assessmentStore.getSingleAssessment(route.params.assessment_id)
    store.treatmentPlan = assessmentStore.assessmentData.treatment_sessions

    // Find current session and load existing iv_prep_data if present
    if (store.treatmentPlan && store.treatmentPlan.treatments) {
      const currentSession = store.treatmentPlan.treatments.find((s) => s.id === sessionID)
      if (currentSession && currentSession.iv_prep_data) {
        let prepData = currentSession.iv_prep_data
        if (typeof prepData === 'string') {
          try {
            prepData = JSON.parse(prepData)
          } catch (e) {
            console.error('Failed to parse iv_prep_data JSON', e)
          }
        }
        if (typeof prepData === 'object' && prepData !== null) {
          Object.assign(form.value, prepData)
        }
      }
    }
  }

  // Wait for the next tick to ensure we don't trigger auto-save during initial load
  setTimeout(() => {
    isInitializing = false
  }, 500)
})

const autoSaveData = debounce(async () => {
  if (isInitializing) return

  try {
    await api.post(`/treatment-sessions/${sessionID}/iv-prep-data`, {
      iv_prep_data: form.value,
    })
  } catch (error) {
    console.error('Failed to auto-save IV Prep Data', error)
  }
}, 1000)

watch(
  form,
  () => {
    autoSaveData()
  },
  { deep: true },
)

async function onSubmit() {
  if (hasHardBlock.value) {
    Notify.create({
      type: 'negative',
      message: 'You cannot proceed with the treatment',
    })
    return
  }
  console.log('onSubmit called')
  // Flush any pending auto-saves before navigating
  autoSaveData.cancel?.()
  await autoSaveData.flush?.()

  try {
    await api.post(`/treatment-sessions/${sessionID}/iv-prep-data`, {
      iv_prep_data: form.value,
    })
  } catch (error) {
    console.error('Failed to save IV Prep Data on submit', error)
  }

  router.push({
    name: 'IVTreatmentSteps',
    params: {
      user_id: route.params.user_id,
      assessment_id: assessmentStore.assessmentData?.id || route.params.assessment_id,
      session_id: sessionID,
      step: 1,
      ...(route.params.appointment_id && { appointment_id: route.params.appointment_id }),
    },
  })
}
</script>

<style scoped>
.wrapper {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px 16px 40px;
}

.card {
  background: #fff;
  border: 0.5px solid rgba(0, 0, 0, 0.12);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
}

.logo-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}
.logo-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1.5px solid #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 500;
  color: #1a1a1a;
}
.brand-name {
  font-size: 20px;
  font-weight: 500;
  letter-spacing: 0.06em;
  color: #1a1a1a;
}

.step-indicator {
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: 28px;
  overflow-x: auto;
  padding-bottom: 4px;
}
.step-dot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 60px;
}
.step-dot .dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 500;
  border: 1.5px solid rgba(0, 0, 0, 0.2);
  color: #666;
  background: #fff;
  transition: all 0.2s;
}
.step-dot .dot.active {
  background: #0bbfb0;
  border-color: #0bbfb0;
  color: #fff;
}
.step-dot .dot.done {
  background: #085041;
  border-color: #085041;
  color: #fff;
}
.step-dot .label {
  font-size: 10px;
  color: #999;
  white-space: nowrap;
  text-align: center;
}
.step-dot .label.active {
  color: #0bbfb0;
  font-weight: 500;
}
.step-line {
  flex: 1;
  height: 1.5px;
  background: rgba(0, 0, 0, 0.12);
  min-width: 16px;
  margin-bottom: 16px;
}
.step-line.done {
  background: #085041;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}
.section-icon {
  width: 28px;
  height: 28px;
  background: #0bbfb0;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.section-icon svg {
  width: 14px;
  height: 14px;
  stroke: #fff;
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.section-title {
  font-size: 15px;
  font-weight: 500;
  color: #1a1a1a;
}
.section-sub {
  font-size: 12px;
  color: #666;
  margin-top: 1px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.form-group.full {
  grid-column: 1/-1;
}
.form-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}
.form-input {
  padding: 8px 10px;
  border: 0.5px solid rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  font-size: 13px;
  color: #1a1a1a;
  background: #fff;
  width: 100%;
}
.form-input:focus {
  outline: none;
  border-color: #0bbfb0;
  box-shadow: 0 0 0 2px rgba(11, 191, 176, 0.12);
}

.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.chip {
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  border: 0.5px solid rgba(0, 0, 0, 0.2);
  cursor: pointer;
  color: #666;
  background: transparent;
  transition: all 0.15s;
}
.chip.selected {
  background: #0bbfb0;
  border-color: #0bbfb0;
  color: #fff;
  font-weight: 500;
}
.chip.selected-warn {
  background: #f5c24c;
  border-color: #f5c24c;
  color: #5a3e00;
  font-weight: 500;
}
.chip.selected-danger {
  background: #e24b4a;
  border-color: #e24b4a;
  color: #fff;
  font-weight: 500;
}

.divider {
  height: 0.5px;
  background: rgba(0, 0, 0, 0.12);
  margin: 16px 0;
}

.caution-banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #fff8e7;
  border: 0.5px solid #f5c24c;
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 16px;
}
.caution-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-top: 1px;
}
.caution-text {
  font-size: 12px;
  color: #7a5c00;
  line-height: 1.5;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0 0;
  margin-top: 24px;
  border-top: 0.5px solid rgba(0, 0, 0, 0.12);
}

.subjective-row {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 10px;
  align-items: center;
  padding: 10px 0;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.12);
}
.subjective-row:last-child {
  border-bottom: none;
}
.subj-label {
  font-size: 12px;
  color: #1a1a1a;
  font-weight: 500;
}
.subj-options {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.subj-opt {
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 11px;
  border: 0.5px solid rgba(0, 0, 0, 0.2);
  cursor: pointer;
  color: #666;
  background: transparent;
  transition: all 0.15s;
  white-space: nowrap;
}
.subj-opt.sel {
  background: #0bbfb0;
  border-color: #0bbfb0;
  color: #fff;
}
.subj-opt.sel-2 {
  background: #5dcaa5;
  border-color: #5dcaa5;
  color: #fff;
}
.subj-opt.sel-warn {
  background: #ef9f27;
  border-color: #ef9f27;
  color: #fff;
}
.subj-opt.sel-bad {
  background: #e24b4a;
  border-color: #e24b4a;
  color: #fff;
}
</style>
