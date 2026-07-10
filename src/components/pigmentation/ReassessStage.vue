<template>
  <section class="stage is-active">
    <div class="stage-head">
      <span class="eyebrow">Stage 05 · Reassess</span>
      <h1 class="serif">Goal tracking &amp; reassessment</h1>
      <p>Assess patient progress against the baseline goals. Upload follow-up captures, answer follow-up questions, and evaluate the treatment trajectory.</p>
    </div>

    <!-- VALIDATION ERROR -->
    <div class="card bg-red-1 q-mb-md" v-if="validationError" id="raValidate" style="border: 1px solid var(--erythema)">
      <div class="err-box">
        <b>Cannot run reassessment.</b><br>
        <span v-html="validationError"></span>
      </div>
    </div>

    <!-- SUB-STEPS TABS (Only if reassessment exists) -->
    <div class="q-mb-lg" v-if="store.reassessment && !store.isLoading">
      <q-tabs
        v-model="subTab"
        dense
        class="text-grey reassess-tabs"
        active-color="primary"
        indicator-color="primary"
        align="left"
        narrow-indicator
      >
        <q-tab name="inputs" label="1. Session Inputs &amp; Questions" />
        <q-tab name="results" label="2. AI Reassessment Results" />
      </q-tabs>
    </div>

    <!-- TAB 1: INPUT STATE -->
    <div v-if="subTab === 'inputs' && !store.isLoading" id="raStart">
      
      <!-- STEP 1: FOLLOW-UP PHOTO UPLOADER -->
      <div class="pblock">
        <h3><span class="bar"></span>1. Follow-up images <span style="font-weight:400;color:var(--slate);font-size:12px">· upload post-treatment captures</span></h3>
        <div class="viewer-card" style="background:#261f30">
          <div class="viewer-head">
            <span class="t">Follow-up scans</span>
            <span class="t" style="color:#a89fb6">{{ store.reassessImages.length }} attached</span>
          </div>
          
          <div class="dropzone" @click="triggerRaInput" style="border-color:#534366">
            <div class="big">⊕</div>
            <div>Attach follow-up captures</div>
            <div class="sub">Upload new white-light or Wood's UV images to assess pigment changes — JPG/PNG.</div>
          </div>
          <input type="file" ref="raInput" accept="image/*" multiple hidden @change="onRaFileChange">

          <div class="thumbs" v-if="store.reassessImages.length > 0">
            <div v-for="(img, idx) in store.reassessImages" :key="idx" class="thumb">
              <img :src="img.dataUrl" alt="">
              <button class="rm" @click="removeRaImage(idx)">×</button>
            </div>
          </div>
        </div>
      </div>

      <!-- STEP 2: GOALS TRACKING VALUE INPUT -->
      <div class="pblock q-mt-lg">
        <h3><span class="bar"></span>2. Goals baseline vs current <span style="font-weight:400;color:var(--slate);font-size:12px">· enter current indices</span></h3>
        <div id="raGoals">
          <div 
            v-for="(g, idx) in store.goals" 
            :key="idx" 
            class="ra-goal"
            style="position: relative; padding-right: 40px;"
          >
            <!-- Delete goal button -->
            <button 
              class="btn-text text-negative" 
              style="position: absolute; right: 8px; top: 8px; font-size: 20px; line-height: 1; border: none; background: transparent; cursor: pointer; padding: 4px; font-weight: bold; z-index: 10;"
              title="Remove Goal"
              @click="removeGoalRow(idx)"
              v-if="store.goals.length > 1"
            >
              ×
            </button>
            <input 
              class="ra-metric" 
              placeholder="Metric (e.g. mMASI, lesion count, melanin index)" 
              v-model="g.metric"
            >
            <div class="ra-grid">
              <div>
                <div class="gh">Baseline</div>
                <input class="ra-base" v-model="g.baseline">
              </div>
              <div>
                <div class="gh">Target</div>
                <input class="ra-target" v-model="g.target">
              </div>
              <div>
                <div class="gh">Timeframe</div>
                <input class="ra-tf" v-model="g.timeframe">
              </div>
              <div>
                <div class="gh">Current Value</div>
                <input class="ra-current" placeholder="now" v-model="g.current">
              </div>
            </div>
          </div>
        </div>

        <button class="btn btn-block" style="margin-top:10px; border-style:dashed" @click="addGoalRow">
          + Add another goal
        </button>
      </div>

      <!-- STEP 3: DYNAMIC QUESTIONS SECTION -->
      <div class="pblock q-mt-lg">
        <h3><span class="bar"></span>3. Follow-up &amp; compliance history <span style="font-weight:400;color:var(--slate);font-size:12px">· dynamic AI questions</span></h3>
        
        <div class="card bg-grey-1" style="border: 1px solid var(--line)">
          <div v-if="!store.reassessQuestions || store.reassessQuestions.length === 0" class="text-center q-py-md">
            <p class="note q-mb-md">AI needs to formulate dynamic compliance and side-effect questions based on the treatment plan and follow-up images.</p>
            <button 
              class="btn" 
              @click="generateQuestions" 
              :disabled="store.isLoading"
            >
              ✦ Formulate follow-up questions
            </button>
          </div>

          <div v-else>
            <div v-for="q in store.reassessQuestions" :key="q.question_id" class="field full q-mb-md">
              <label class="text-weight-bold">
                {{ q.question }}
                <span class="hint" style="display:block;font-weight:400;color:var(--slate)" v-if="q.why_asked">
                  <b>Why:</b> {{ q.why_asked }}
                </span>
              </label>

              <!-- Single choice select -->
              <select v-if="q.answer_type === 'single_choice' && q.options?.length" v-model="store.reassessAnswers[q.question_id]">
                <option value="">— select —</option>
                <option v-for="opt in q.options" :key="opt" :value="opt">{{ formatOptionLabel(opt) }}</option>
              </select>

              <!-- Boolean select -->
              <select v-else-if="q.answer_type === 'boolean'" v-model="store.reassessAnswers[q.question_id]">
                <option value="">— select —</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="not_sure">Unsure</option>
              </select>

              <!-- Multi-choice checks -->
              <div v-else-if="q.answer_type === 'multi_choice' && q.options?.length" class="checks q-mt-xs">
                <label v-for="opt in q.options" :key="opt" :class="['check', { 'is-checked': isOptionChecked(q.question_id, opt) }]">
                  <input
                    type="checkbox"
                    :value="opt"
                    :checked="isOptionChecked(q.question_id, opt)"
                    @change="toggleOption(q.question_id, opt)"
                  >
                  {{ formatOptionLabel(opt) }}
                </label>
              </div>

              <!-- General text input -->
              <input v-else placeholder="Type patient's response..." v-model="store.reassessAnswers[q.question_id]">
            </div>

            <button class="btn btn-sm text-negative" @click="resetQuestions">
              Reset Questions
            </button>
          </div>
        </div>
      </div>

      <!-- MAIN ACTION -->
      <div class="row gap-md q-mt-xl">
        <button 
          class="btn btn-primary col" 
          @click="runReassessment"
          :disabled="store.isLoading || (store.reassessQuestions?.length > 0 && !allQuestionsAnswered)"
        >
          {{ store.reassessment ? '✦ Re-run Reassessment Analysis' : '✦ Generate Reassessment Analysis' }}
        </button>
        <button
          v-if="store.reassessment"
          class="btn col-auto"
          @click="subTab = 'results'"
        >
          Go to Results →
        </button>
      </div>
      
      <div v-if="store.reassessQuestions?.length > 0 && !allQuestionsAnswered" class="text-center note text-negative q-mt-sm">
        Please answer all follow-up questions before running analysis.
      </div>
    </div>

    <!-- LOADING STATE -->
    <div class="card tight text-center q-pa-lg" v-if="store.isLoading" id="raLoading">
      <div class="spinner"></div>
      <div class="gen-status">{{ store.loadingMessage }}</div>
    </div>

    <!-- REASSESSMENT OUTPUT (PROFESSIONAL UI) -->
    <div v-if="subTab === 'results' && store.reassessment && !store.isLoading" id="raOutput" class="q-col-gutter-y-md">
      
      <!-- 1. OVERALL TRAJECTORY BANNER -->
      <div :class="['review-banner', bannerClass]">
        <span class="ic">{{ bannerIcon }}</span>
        <div>
          <span class="text-weight-bold text-h6 block">
            Overall Trajectory: {{ cap(store.reassessment.overall?.trajectory || 'unknown') }}
          </span>
          <p style="margin: 4px 0 0 0; font-weight: 400; line-height: 1.4;">
            {{ store.reassessment.overall?.summary || '' }}
          </p>
        </div>
      </div>

      <!-- 2. DIAGNOSIS RE-EXAMINE WARNING -->
      <div v-if="store.reassessment.diagnosis_reexamine?.needed" class="pblock">
        <div class="redflag">
          <span class="ic">!</span>
          <div class="bd">
            <b>⚠ Action Required: Re-examine the Diagnosis</b> 
            <p style="margin-top: 4px; font-size: 13px;">
              {{ store.reassessment.diagnosis_reexamine.reason }}
            </p>
          </div>
        </div>
      </div>

      <!-- 3. GOALS TRACKING SCORECARD -->
      <div class="pblock" v-if="store.reassessment.goals?.length">
        <h3><span class="bar"></span>Goal-by-goal scorecard</h3>
        <div class="goal-tbl">
          <div 
            class="goal-row" 
            style="grid-template-columns: 1.5fr 1fr 1fr 1fr 1.2fr"
            v-for="(g, idx) in store.reassessment.goals" 
            :key="idx"
          >
            <div>
              <div class="gh">Metric</div>
              <div class="gm">{{ formatOptionLabel(g.metric) }}</div>
            </div>
            <div>
              <div class="gh">Baseline / Target</div>
              <div>{{ g.baseline || '—' }} → {{ g.target || '—' }}</div>
            </div>
            <div>
              <div class="gh">Current</div>
              <div><b>{{ g.current || '—' }}</b></div>
            </div>
            <div>
              <div class="gh">Δ Delta</div>
              <div class="text-weight-bold text-primary">{{ g.delta || '—' }}</div>
            </div>
            <div>
              <div class="gh">Status</div>
              <span :class="['goal-status', getStatusClass(g.status)]">
                {{ getStatusLabel(g.status) }}
              </span>
              <div class="gsub q-mt-xs" v-if="g.comment" style="font-size: 11px;">
                {{ g.comment }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. REGIONAL CHANGES DETAIL -->
      <div class="pblock" v-if="store.reassessment.regional_changes?.length">
        <h3><span class="bar"></span>Regional changes</h3>
        <div class="goal-tbl">
          <div class="goal-hdr" style="grid-template-columns: 1fr 1fr 1fr 1.2fr">
            <div>Region</div>
            <div>Melanin Load (B → C)</div>
            <div>Erythema Load (B → C)</div>
            <div>Trajectory &amp; Notes</div>
          </div>
          <div 
            class="goal-row" 
            style="grid-template-columns: 1fr 1fr 1fr 1.2fr"
            v-for="(reg, rIdx) in store.reassessment.regional_changes" 
            :key="rIdx"
          >
            <div>
              <div class="gh">Region</div>
              <div class="text-weight-bold">{{ formatOptionLabel(reg.region) }}</div>
            </div>
            <div>
              <div class="gh">Melanin Load</div>
              <div>{{ reg.baseline_melanin_load || '—' }} → {{ reg.current_melanin_load || '—' }}</div>
            </div>
            <div>
              <div class="gh">Erythema Load</div>
              <div>{{ reg.baseline_erythema_load || '—' }} → {{ reg.current_erythema_load || '—' }}</div>
            </div>
            <div>
              <div class="gh">Trajectory</div>
              <span :class="['goal-status', getStatusClass(reg.trajectory)]">
                {{ getStatusLabel(reg.trajectory) }}
              </span>
              <div class="gsub q-mt-xs" v-if="reg.comment" style="font-size: 11px;">
                {{ reg.comment }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 5. TREATMENT ADJUSTMENT SUGGESTIONS -->
      <div class="pblock" v-if="store.reassessment.treatment_adjustment_suggestion">
        <h3><span class="bar"></span>Treatment adjustment suggestions</h3>
        <div class="row q-col-gutter-md">
          <div 
            v-for="(val, modality) in store.reassessment.treatment_adjustment_suggestion" 
            :key="modality"
            class="col-md-3 col-sm-6 col-xs-12"
          >
            <div class="vbox text-center" style="height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div class="lab">{{ formatOptionLabel(modality) }}</div>
                <div class="hd q-mt-sm">{{ getModalityStatusLabel(val) }}</div>
              </div>
              <div class="q-mt-md">
                <span :class="['goal-status', getModalityStatusClass(val)]">
                  {{ formatOptionLabel(val) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 6. CLINICAL RECOMMENDATIONS -->
      <div class="pblock" v-if="store.reassessment.recommendation?.action">
        <h3><span class="bar"></span>Clinician recommendation</h3>
        <div class="card bg-teal-0 q-pa-md" style="border: 1px solid var(--good)">
          <div class="row items-center justify-between">
            <div>
              <span class="text-subtitle2 text-grey-7 uppercase block">Recommended Action</span>
              <span class="text-h6 text-weight-bold text-teal-10">
                {{ cap(store.reassessment.recommendation.action) }}
              </span>
            </div>
            <div>
              <span :class="['goal-status', getRecommendationClass(store.reassessment.recommendation.action)]">
                {{ store.reassessment.recommendation.action }}
              </span>
            </div>
          </div>
          <p class="q-mt-sm text-body2 text-grey-9" v-if="store.reassessment.recommendation.detail">
            {{ store.reassessment.recommendation.detail }}
          </p>
        </div>
      </div>

      <!-- 7. PATIENT SUMMARY -->
      <div class="pblock" v-if="store.reassessment.patient_summary">
        <h3><span class="bar"></span>Summary for the patient</h3>
        <div class="summary-box">{{ store.reassessment.patient_summary }}</div>
      </div>

      <!-- 8. UNCERTAINTIES -->
      <div class="pblock" v-if="store.reassessment.uncertainties?.length">
        <h3><span class="bar" style="background:var(--amber)"></span>Clinical uncertainties &amp; Gaps</h3>
        <ul class="ulist">
          <li v-for="(u, idx) in store.reassessment.uncertainties" :key="idx">
            {{ u }}
          </li>
        </ul>
      </div>

      <!-- DISCLAIMER -->
      <div class="text-caption text-grey-7 q-my-md italic" v-if="store.reassessment.disclaimer">
        * {{ store.reassessment.disclaimer }}
      </div>

      <!-- RE-RUN & DOWNLOAD BUTTONS -->
      <div class="row gap-md q-mt-lg">
        <q-btn
          color="black"
          unelevated
          no-caps
          label="Download Reassessment PDF"
          icon="download"
          @click="downloadReassessReport"
        />
        <button class="btn" @click="resetReassess">
          ↺ Reset &amp; Reassess again
        </button>
      </div>

    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { usePigmentationStore } from 'src/stores/pigmentationStore'
import { api } from 'src/boot/axios'
import { Loading, Notify } from 'quasar'

const store = usePigmentationStore()
const raInput = ref(null)
const validationError = ref('')

const subTab = ref('inputs')

// If there's an existing reassessment on load, start in results tab
if (store.reassessment) {
  subTab.value = 'results'
}

const addGoalRow = () => {
  store.goals.push({
    metric: '',
    baseline: '',
    target: '',
    timeframe: '',
    current: ''
  })
}

// Ensure at least one goal exists when opening
if (store.goals.length === 0) {
  addGoalRow()
}

// Remove goal row
const removeGoalRow = (idx) => {
  store.goals.splice(idx, 1)
  if (store.goals.length === 0) {
    addGoalRow()
  }
}

// Watch stage entry to auto-fetch questions if empty
watch(
  () => store.currentStage,
  async (newStage) => {
    if (newStage === 4 && (!store.reassessQuestions || store.reassessQuestions.length === 0)) {
      try {
        await store.generateReassessQuestions()
      } catch (e) {
        console.error('Auto-generating reassessment questions failed:', e)
      }
    }
  },
  { immediate: true }
)

// Uploader
const triggerRaInput = () => {
  raInput.value.click()
}

const onRaFileChange = async () => {
  const files = raInput.value.files
  for (let i = 0; i < files.length; i++) {
    const f = files[i]
    if (!/^image\//.test(f.type)) continue
    if (f.size > 5 * 1024 * 1024) {
      alert(`“${f.name}” is over 5 MB — skipped.`)
      continue
    }
    if (store.reassessImages.length >= 5) {
      alert('Up to 5 images.')
      break
    }
    try {
      const reader = new FileReader()
      const dataUrl = await new Promise((res, rej) => {
        reader.onload = () => res(reader.result)
        reader.onerror = () => rej(new Error('Read failed'))
        reader.readAsDataURL(f)
      })
      
      store.reassessImages.push({
        name: f.name,
        mediaType: f.type,
        base64: dataUrl.split(',')[1],
        dataUrl: dataUrl,
        file: f
      })
    } catch (e) {
      console.error(e)
    }
  }
  raInput.value.value = ''
}

const removeRaImage = (idx) => {
  store.reassessImages.splice(idx, 1)
}

// Reassessment dynamic questions
const generateQuestions = async () => {
  validationError.value = ''
  try {
    await store.generateReassessQuestions()
  } catch (err) {
    validationError.value = err.message || 'API connection failed.'
  }
}

const resetQuestions = () => {
  store.reassessQuestions = []
  store.reassessAnswers = {}
}

const isOptionChecked = (questionId, option) => {
  const ans = store.reassessAnswers[questionId]
  if (Array.isArray(ans)) {
    return ans.includes(option)
  }
  return false
}

const toggleOption = (questionId, option) => {
  if (!Array.isArray(store.reassessAnswers[questionId])) {
    store.reassessAnswers[questionId] = []
  }
  const arr = [...store.reassessAnswers[questionId]]
  const idx = arr.indexOf(option)
  if (idx >= 0) {
    arr.splice(idx, 1)
  } else {
    arr.push(option)
  }
  store.reassessAnswers[questionId] = arr
}

const allQuestionsAnswered = computed(() => {
  if (!store.reassessQuestions || store.reassessQuestions.length === 0) return true
  return store.reassessQuestions.every((q) => {
    const ans = store.reassessAnswers[q.question_id]
    if (ans === undefined || ans === null || ans === '') return false
    if (Array.isArray(ans) && ans.length === 0) return false
    return true
  })
})

const runReassessment = async () => {
  validationError.value = ''
  
  // Validate goals
  const activeGoals = store.goals.filter(g => g.metric && String(g.metric).trim() !== '')
  if (activeGoals.length === 0) {
    validationError.value = 'Add at least one goal (with a metric) to reassess.'
    return
  }
  
  const hasCurrent = activeGoals.some(g => g.current && String(g.current).trim() !== '') || store.reassessImages.length > 0
  if (!hasCurrent) {
    validationError.value = 'Enter at least one current value, or attach follow-up captures.'
    return
  }
  
  try {
    await store.generateReassessment()
    subTab.value = 'results'
  } catch (err) {
    validationError.value = err.message || 'API connection failed.'
  }
}

const resetReassess = () => {
  store.reassessment = null
  subTab.value = 'inputs'
  resetQuestions()
}

// Download PDF
const downloadReassessReport = async () => {
  Loading.show({ message: 'Downloading Reassessment Report...' })
  try {
    const response = await api.get(
      `download-pigmentation-report/reassessment/${store.id}`,
      {
        responseType: 'blob',
      },
    )

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute(
      'download',
      `${store.formData.initials || 'patient'}_pigmentation_reassessment.pdf`,
    )
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('PDF download failed:', error)
    Notify.create({
      type: 'negative',
      message: 'Failed to download report. Please try again.',
    })
  } finally {
    Loading.hide()
  }
}

// Styling helpers
const formatOptionLabel = (val) => {
  if (!val) return ''
  return val
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/Or/g, 'or')
    .replace(/To/g, 'to')
    .replace(/Aha/g, 'AHA')
    .replace(/Bha/g, 'BHA')
    .replace(/Hq/g, 'HQ')
    .replace(/Ocp/g, 'OCP')
    .replace(/Txa/g, 'TXA')
    .replace(/Pih/g, 'PIH')
    .replace(/Q-switch/i, 'Q-Switch')
}


const bannerClass = computed(() => {
  if (!store.reassessment) return 'pending'
  const traj = String(store.reassessment.overall?.trajectory || '').toLowerCase()
  if (traj === 'improving') return 'approved'
  if (traj === 'worsening') return 'rejected'
  if (traj === 'mixed') return 'pending'
  return 'pending'
})

const bannerIcon = computed(() => {
  if (!store.reassessment) return '•'
  const traj = String(store.reassessment.overall?.trajectory || '').toLowerCase()
  if (traj === 'improving') return '✓'
  if (traj === 'worsening') return '!'
  return '•'
})

const getStatusClass = (st) => {
  const status = String(st || '').toLowerCase()
  if (status === 'met' || status === 'improving') return 'gs-met'
  if (status === 'on_track' || status === 'mixed') return 'gs-track'
  if (status === 'plateaued') return 'gs-plateau'
  if (status === 'worsening') return 'gs-worse'
  return 'gs-plateau'
}

const getStatusLabel = (st) => {
  const status = String(st || '').toLowerCase()
  if (status === 'met') return 'Met'
  if (status === 'on_track') return 'On track'
  if (status === 'plateaued') return 'Plateaued'
  if (status === 'worsening') return 'Worsening'
  if (status === 'improving') return 'Improving'
  if (status === 'mixed') return 'Mixed'
  if (status === 'unknown') return 'No data'
  return formatOptionLabel(st)
}

const getModalityStatusClass = (val) => {
  const v = String(val || '').toLowerCase()
  if (v.includes('continue') || v.includes('consider')) return 'gs-met'
  if (v.includes('reduce') || v.includes('cautiously') || v.includes('strengthen') || v.includes('barrier')) return 'gs-plateau'
  if (v.includes('defer') || v.includes('switch') || v.includes('doctor')) return 'gs-worse'
  return 'gs-plateau'
}

const getModalityStatusLabel = (val) => {
  const v = String(val || '').toLowerCase()
  if (v.includes('continue')) return 'Continue'
  if (v.includes('reduce')) return 'Reduce energy'
  if (v.includes('increase')) return 'Increase cautiously'
  if (v.includes('defer')) return 'Defer treatment'
  if (v.includes('consider')) return 'Consider adding'
  if (v.includes('switch')) return 'Switch agent'
  if (v.includes('strengthen')) return 'Strengthen photoprotection'
  if (v.includes('barrier')) return 'Barrier first protocol'
  if (v.includes('doctor')) return 'Require doctor review'
  if (v.includes('not_applicable')) return 'Not applicable'
  return formatOptionLabel(val)
}

const getRecommendationClass = (val) => {
  const v = String(val || '').toLowerCase()
  if (v === 'continue' || v === 'maintain') return 'gs-met'
  if (v === 'escalate' || v === 'de_escalate') return 'gs-track'
  if (v === 're_examine' || v === 'refer') return 'gs-worse'
  return 'gs-plateau'
}

const cap = (s) => {
  const str = String(s || '')
  return str.charAt(0).toUpperCase() + str.slice(1)
}
</script>

<style scoped>
.bg-teal-0 {
  background-color: #f0fdfa;
  border-color: #99f6e4;
}
.text-teal-10 {
  color: #115e59;
}
.gap-md {
  gap: 12px;
}
.uppercase {
  text-transform: uppercase;
}
.block {
  display: block;
}

/* Premium tab pill design */
.reassess-tabs {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 4px;
}
.reassess-tabs :deep(.q-tab) {
  padding: 10px 20px;
  min-height: 40px;
  border-radius: 6px;
  font-weight: 600;
  text-transform: none;
}
</style>
