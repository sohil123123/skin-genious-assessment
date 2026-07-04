<template>
  <section class="stage is-active">
    <div class="stage-head">
      <span class="eyebrow">Stage 05 · Reassess</span>
      <h1 class="serif">Goal tracking &amp; reassessment</h1>
      <p>Assess patient progress against the baseline goals. Enter current values and upload follow-up captures. OpenAI rates the trajectory and recommends whether to continue, maintain, or escalate treatment.</p>
    </div>

    <!-- VALIDATION ERROR -->
    <div class="card bg-red-1 q-mb-md" v-if="validationError" id="raValidate" style="border: 1px solid var(--erythema)">
      <div class="err-box">
        <b>Cannot run reassessment.</b><br>
        <span v-html="validationError"></span>
      </div>
    </div>

    <!-- INPUT STATE -->
    <div v-if="!store.reassessment && !store.isLoading" id="raStart">
      
      <!-- GOALS TABLE FORM -->
      <div class="pblock">
        <h3><span class="bar"></span>Goals tracking <span style="font-weight:400;color:var(--slate);font-size:12px" id="raGoalsMeta"></span></h3>
        <div id="raGoals">
          <div 
            v-for="(g, idx) in store.goals" 
            :key="idx" 
            class="ra-goal"
          >
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
                <div class="gh">Current</div>
                <input class="ra-current" placeholder="now" v-model="g.current">
              </div>
            </div>
          </div>
        </div>

        <button class="btn btn-block" style="margin-top:10px; border-style:dashed" @click="addGoalRow">
          + Add another goal
        </button>
      </div>

      <!-- FOLLOW-UP PHOTO UPLOADER -->
      <div class="pblock">
        <h3><span class="bar"></span>Follow-up images <span style="font-weight:400;color:var(--slate);font-size:12px" id="raCapCount"></span></h3>
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

      <button class="btn btn-primary btn-block" style="margin-top:14px" @click="runReassessment">
        ✦ Generate reassessment analysis
      </button>
    </div>

    <!-- LOADING STATE -->
    <div class="card tight text-center q-pa-lg" v-if="store.isLoading" id="raLoading">
      <div class="spinner"></div>
      <div class="gen-status">{{ store.loadingMessage }}</div>
    </div>

    <!-- REASSESSMENT OUTPUT -->
    <div v-if="store.reassessment && !store.isLoading" id="raOutput">
      
      <!-- trajectory banner -->
      <div :class="['review-banner', bannerClass]">
        <span class="ic">{{ bannerIcon }}</span>
        <div>
          Overall Trajectory: {{ cap(store.reassessment.overall?.trajectory || 'unknown') }}
          <small>{{ store.reassessment.overall?.summary || '' }}</small>
        </div>
      </div>

      <!-- goal scores -->
      <div class="pblock" v-if="store.reassessment.goals?.length">
        <h3><span class="bar"></span>Goal-by-goal</h3>
        <div class="goal-tbl">
          <div class="goal-row" style="grid-template-columns:1.5fr .7fr 1.6fr" v-for="(g, idx) in store.reassessment.goals" :key="idx">
            <div>
              <div class="gh">Metric</div>
              <div class="gm">{{ g.metric || '—' }}</div>
            </div>
            <div>
              <div class="gh">Δ</div>
              <div>{{ g.delta || '—' }}</div>
            </div>
            <div>
              <div class="gh">Status</div>
              <span :class="['goal-status', getStatusClass(g.status)]">
                {{ getStatusLabel(g.status) }}
              </span>
              <div class="gsub" style="margin-top:5px" v-if="g.comment">
                {{ g.comment }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- recommendation -->
      <div class="pblock" v-if="store.reassessment.recommendation?.action || store.reassessment.recommendation?.detail">
        <h3><span class="bar"></span>Recommendation</h3>
        <div class="summary-box">
          <b>{{ cap(store.reassessment.recommendation.action || '') }}</b>
          <span v-if="store.reassessment.recommendation.detail">
            — {{ store.reassessment.recommendation.detail }}
          </span>
        </div>
      </div>

      <!-- diagnosis warning -->
      <div class="pblock" v-if="store.reassessment.diagnosis_reexamine?.needed">
        <div class="redflag">
          <span class="ic">!</span>
          <div class="bd">
            <b>Re-examine the diagnosis.</b> 
            {{ store.reassessment.diagnosis_reexamine.reason }}
          </div>
        </div>
      </div>

      <!-- patient summary -->
      <div class="pblock" v-if="store.reassessment.patient_summary">
        <h3><span class="bar"></span>For the patient</h3>
        <div class="summary-box">{{ store.reassessment.patient_summary }}</div>
      </div>

      <!-- uncertainties -->
      <div class="pblock" v-if="store.reassessment.uncertainties?.length">
        <h3><span class="bar" style="background:var(--amber)"></span>Uncertainties</h3>
        <ul class="ulist">
          <li v-for="(u, idx) in store.reassessment.uncertainties" :key="idx">
            {{ u }}
          </li>
        </ul>
      </div>

      <!-- re-run button -->
      <div style="margin-top:14px">
        <button class="btn" @click="resetReassess">
          ↺ Reassess again
        </button>
      </div>

    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { usePigmentationStore } from 'src/stores/pigmentationStore'

const store = usePigmentationStore()
const raInput = ref(null)
const validationError = ref('')

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

const runReassessment = async () => {
  validationError.value = ''
  
  // Validate goals
  const activeGoals = store.goals.filter(g => g.metric.trim() !== '')
  if (activeGoals.length === 0) {
    validationError.value = 'Add at least one goal (with a metric) to reassess.'
    return
  }
  
  const hasCurrent = activeGoals.some(g => g.current && g.current.trim() !== '') || store.reassessImages.length > 0
  if (!hasCurrent) {
    validationError.value = 'Enter at least one current value, or attach follow-up captures.'
    return
  }
  
  try {
    await store.generateReassessment()
  } catch (err) {
    validationError.value = err.message || 'API connection failed.'
  }
}

const resetReassess = () => {
  store.reassessment = null
}

// Styling classes
const bannerClass = computed(() => {
  if (!store.reassessment) return 'pending'
  const traj = String(store.reassessment.overall?.trajectory || '').toLowerCase()
  if (traj === 'improving') return 'approved'
  if (traj === 'worsening') return 'rejected'
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
  if (status === 'met') return 'gs-met'
  if (status === 'on_track') return 'gs-track'
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
  if (status === 'unknown') return 'No data'
  return st
}

const cap = (s) => {
  const str = String(s || '')
  return str.charAt(0).toUpperCase() + str.slice(1)
}
</script>
