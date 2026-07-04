<template>
  <section class="stage is-active">
    <div class="stage-head">
      <span class="eyebrow">Stage 04 · Plan</span>
      <h1 class="serif">Generate proposed plan &amp; sign-off</h1>
      <p>Generates a tiered clinical plan for review. Includes photoprotection, topicals, procedures, oral options, and measurable patient goals. The treating dermatologist must sign off and lock the plan before patient use.</p>
    </div>

    <!-- VALIDATION ERROR -->
    <div class="card bg-red-1 q-mb-md" v-if="validationError" id="genValidate" style="border: 1px solid var(--erythema)">
      <div class="err-box">
        <b>Cannot generate plan.</b><br>
        <span v-html="validationError"></span>
      </div>
    </div>

    <!-- INITIAL PLAN BUTTON -->
    <div class="card tight q-pa-lg text-center" v-if="!store.lastPlan && !store.isLoading" id="genStart">
      <div class="text-h6 font-serif q-mb-sm" id="genHint">
        {{ store.diagnosis?.confirmedDx ? 'Building a plan for: ' + store.diagnosis.confirmedDx : 'Confirm working diagnosis first' }}
      </div>
      <p class="note q-mx-auto" style="max-width:50ch; margin-bottom:16px">
        OpenAI will construct a tiered treatment plan tailored to the confirmed diagnosis. Standard safety rules apply (pregnancy, thromboembolic checks, hydroquinone limits, Fitzpatrick FST limits).
      </p>
      <button class="btn btn-primary" @click="runGeneratePlan" :disabled="!store.diagnosis?.confirmedDx">
        ✦ Generate treatment plan
      </button>
    </div>

    <!-- LOADING COMPONENT -->
    <div class="card tight text-center q-pa-lg" v-if="store.isLoading" id="genLoading">
      <div class="spinner"></div>
      <div class="gen-status">{{ store.loadingMessage }}</div>
    </div>

    <!-- PLAN OUTPUTS / SHEET -->
    <div v-if="store.lastPlan && !store.isLoading" id="planOutput">
      
      <!-- REVIEW BANNER -->
      <div :class="['review-banner', bannerClass]" id="reviewBanner">
        <span class="ic">{{ bannerIcon }}</span>
        <div>
          {{ bannerTitle }}
          <small>{{ bannerSubtitle }}</small>
        </div>
      </div>

      <!-- summary -->
      <div class="summary-box" style="margin-bottom:16px" v-if="store.lastPlan.summary_line">
        <b>{{ store.lastPlan.summary_line }}</b>
      </div>

      <!-- treating working dx -->
      <div class="pblock">
        <h3><span class="bar"></span>Treating</h3>
        <div class="dx-primary">
          <div>
            <div class="nm">{{ store.lastPlan.condition || store.diagnosis?.confirmedDx || '—' }}</div>
            <div class="rs">{{ store.lastPlan.condition_specific_note || '' }}</div>
          </div>
        </div>
        <p class="note" style="margin-top:9px" v-if="store.lastPlan.prognosis">
          <b>Prognosis:</b> {{ store.lastPlan.prognosis }}
        </p>
      </div>

      <!-- PLAN TIERS -->
      <div class="pblock">
        <h3><span class="bar"></span>Proposed plan</h3>
        
        <!-- TIER 0 -->
        <div class="tier t0">
          <div class="tier-head">
            <span class="tier-tag">TIER 0</span>
            <div class="ttl">Photoprotection &amp; triggers</div>
          </div>
          <div class="tier-body">
            <div class="agent" v-for="(pText, pIdx) in store.lastPlan.plan?.tier0_photoprotection" :key="pIdx">
              <span class="ab"></span>
              <span class="ax"><b>{{ pText }}</b></span>
            </div>
            <div class="agent" v-if="!store.lastPlan.plan?.tier0_photoprotection?.length">
              <span class="ax note">—</span>
            </div>
          </div>
        </div>

        <!-- TIER 1 -->
        <div class="tier t1" v-if="store.lastPlan.plan?.tier1_topical?.length">
          <div class="tier-head">
            <span class="tier-tag">TIER 1</span>
            <div class="ttl">Topical — first-line</div>
          </div>
          <div class="tier-body">
            <div 
              v-for="(t, tIdx) in store.lastPlan.plan.tier1_topical" 
              :key="tIdx"
              :class="['agent', { blocked: t.contraindicated }]"
            >
              <span class="ab"></span>
              <span class="badge x" v-if="t.contraindicated">BLOCKED</span>
              <span class="ax">
                <b>{{ t.agent || '—' }}</b>
                <span class="sub" v-if="t.detail">{{ t.detail }}</span>
                <span class="caut" v-if="t.caution">⚠ {{ t.caution }}</span>
                <span class="caut" style="color:var(--erythema)" v-if="t.contraindicated && t.contraindication_reason">
                  {{ t.contraindication_reason }}
                </span>
              </span>
            </div>
          </div>
        </div>

        <!-- TIER 2 -->
        <div class="tier t2" v-if="store.lastPlan.plan?.tier2_procedural?.length">
          <div class="tier-head">
            <span class="tier-tag">TIER 2</span>
            <div class="ttl">Procedural</div>
          </div>
          <div class="tier-body">
            <div 
              v-for="(pr, prIdx) in store.lastPlan.plan.tier2_procedural" 
              :key="prIdx"
              class="agent"
            >
              <span class="ab"></span>
              <span class="ax">
                <b>{{ pr.intervention || pr.agent || '—' }}</b>
                <span class="sub" v-if="pr.detail">{{ pr.detail }}</span>
                <span class="sub" v-if="pr.readiness">Readiness: {{ pr.readiness }}</span>
                <span class="caut" v-if="pr.caution">⚠ {{ pr.caution }}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- ORAL OPTIONS -->
        <div class="tier tx" v-if="store.lastPlan.plan?.oral_options?.length">
          <div class="tier-head">
            <span class="tier-tag">ORAL</span>
            <div class="ttl">Systemic options</div>
          </div>
          <div class="tier-body">
            <div 
              v-for="(o, oIdx) in store.lastPlan.plan.oral_options" 
              :key="oIdx"
              :class="['agent', { blocked: o.contraindicated }]"
            >
              <span class="ab"></span>
              <span class="badge x" v-if="o.contraindicated">BLOCKED</span>
              <span class="ax">
                <b>{{ o.agent || '—' }}</b>
                <span class="sub" v-if="o.detail">{{ o.detail }}</span>
                <span class="sub" v-if="o.screening_required">Screening: {{ o.screening_required }}</span>
                <span class="caut" style="color:var(--erythema)" v-if="o.contraindicated && o.reason">
                  {{ o.reason }}
                </span>
              </span>
            </div>
          </div>
        </div>

        <p class="note" style="margin-top:4px" v-if="store.lastPlan.plan?.sequencing_note">
          <b>Sequencing:</b> {{ store.lastPlan.plan.sequencing_note }}
        </p>
      </div>

      <!-- COURSE GOALS -->
      <div class="pblock" v-if="store.lastPlan.goals?.length">
        <h3><span class="bar"></span>Goals for this course <span style="font-weight:400;color:var(--slate);font-size:12px">· checked at reassessment</span></h3>
        <div class="goal-tbl">
          <div class="goal-hdr">
            <div>Metric</div>
            <div>Baseline</div>
            <div>Target</div>
            <div>Timeframe</div>
          </div>
          <div class="goal-row" v-for="(g, gIdx) in store.lastPlan.goals" :key="gIdx">
            <div>
              <div class="gh">Metric</div>
              <div class="gm">{{ g.metric || '—' }}</div>
              <div class="gsub" v-if="g.how_measured">{{ g.how_measured }}</div>
            </div>
            <div>
              <div class="gh">Baseline</div>
              <div>{{ g.baseline || '—' }}</div>
            </div>
            <div>
              <div class="gh">Target</div>
              <div>{{ g.target || '—' }}</div>
            </div>
            <div>
              <div class="gh">Timeframe</div>
              <div>{{ g.timeframe || '—' }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- PRE-PRESCRIBING SAFETY CHECKS -->
      <div class="pblock" v-if="store.lastPlan.safety_flags?.length">
        <h3><span class="bar" style="background:var(--erythema)"></span>Verify before prescribing</h3>
        <div class="flaglist">
          <div class="fl" v-for="(f, fIdx) in store.lastPlan.safety_flags" :key="fIdx">
            <span class="ic">⊘</span>
            <div>{{ f }}</div>
          </div>
        </div>
      </div>

      <!-- FOR THE PATIENT -->
      <div class="pblock" v-if="store.lastPlan.patient_summary">
        <h3><span class="bar"></span>For the patient</h3>
        <div class="summary-box">{{ store.lastPlan.patient_summary }}</div>
      </div>

      <!-- FOLLOW-UP -->
      <div class="pblock" v-if="store.lastPlan.follow_up">
        <h3><span class="bar"></span>Follow-up</h3>
        <ul class="ulist">
          <li v-if="store.lastPlan.follow_up.interval"><b>Interval:</b> {{ store.lastPlan.follow_up.interval }}</li>
          <li v-if="store.lastPlan.follow_up.measure"><b>Re-measure:</b> {{ store.lastPlan.follow_up.measure }}</li>
          <li v-if="store.lastPlan.follow_up.escalate_if_plateau"><b>If plateaued:</b> {{ store.lastPlan.follow_up.escalate_if_plateau }}</li>
          <li v-if="store.lastPlan.follow_up.stop_if"><b>Stop / re-examine if:</b> {{ store.lastPlan.follow_up.stop_if }}</li>
        </ul>
      </div>

      <!-- UNCERTAINTIES -->
      <div class="pblock" v-if="store.lastPlan.uncertainties?.length">
        <h3><span class="bar" style="background:var(--amber)"></span>Uncertainties &amp; gaps</h3>
        <ul class="ulist">
          <li v-for="(u, uIdx) in store.lastPlan.uncertainties" :key="uIdx">
            {{ u }}
          </li>
        </ul>
      </div>

      <!-- CLINICIAN SIGN-OFF LOCK PANEL -->
      <div class="signoff" id="signoff">
        <h3 class="serif">Clinician review &amp; sign-off</h3>
        <div class="sub">Required before this plan can be exported. Your edits are recorded with the plan.</div>
        
        <label class="so-check">
          <input type="checkbox" v-model="soReviewed" :disabled="store.reviewState.finalized">
          <span>I have reviewed this AI-proposed assessment and plan in full.</span>
        </label>
        
        <div style="font-size:12px;font-weight:600;color:var(--slate);margin:6px 0 4px">Decision</div>
        <div class="so-radios" id="soRadios">
          <div 
            :class="['so-radio', getRadioClass('approve')]" 
            @click="selectDecision('approve')"
          >Approve as-is</div>
          <div 
            :class="['so-radio', getRadioClass('edit')]" 
            @click="selectDecision('edit')"
          >Approve with edits</div>
          <div 
            :class="['so-radio', getRadioClass('reject')]" 
            @click="selectDecision('reject')"
          >Reject</div>
        </div>

        <div style="font-size:12px;font-weight:600;color:var(--slate);margin-bottom:5px">Clinician notes / edits</div>
        <textarea 
          v-model="soNotes" 
          placeholder="Modifications, additions, or reason for rejection..."
          :disabled="store.reviewState.finalized"
        ></textarea>

        <div class="so-name">
          <input 
            v-model="soReviewer" 
            placeholder="Reviewer Name" 
            aria-label="Reviewer name"
            :disabled="store.reviewState.finalized"
          >
        </div>
        
        <button 
          class="btn btn-primary btn-block" 
          @click="lockPlan" 
          :disabled="store.reviewState.finalized || !soReviewed || !soDecision"
        >
          Finalise &amp; lock
        </button>

        <!-- Stamp results -->
        <div 
          :class="['stamp show', store.reviewState.decision === 'reject' ? 'no' : 'ok']" 
          v-if="store.reviewState.finalized"
          id="soStamp"
          style="margin-top: 12px"
        >
          <div v-if="store.reviewState.decision === 'reject'">
            <b>Rejected.</b> Recorded for the pilot log.
            <div style="margin-top:4px" v-if="store.reviewState.notes">Reason: {{ store.reviewState.notes }}</div>
            <button class="btn" style="margin-top:10px" @click="resetPlan">Start a new plan</button>
          </div>
          <div v-else>
            <b>✓ {{ store.reviewState.decision === 'edit' ? 'Approved with edits' : 'Approved' }}</b> 
            by {{ store.reviewState.reviewer }} · {{ store.reviewState.ts?.toLocaleString() }}
            <div style="margin-top:4px" v-if="store.reviewState.notes">Notes: {{ store.reviewState.notes }}</div>
            <div style="margin-top:12px; display:flex; gap:9px; flex-wrap:wrap">
              <button class="btn btn-primary" @click="$emit('trigger-print')">Export / print</button>
              <button class="btn" @click="resetPlan">New plan</button>
            </div>
          </div>
        </div>
      </div>

    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { usePigmentationStore } from 'src/stores/pigmentationStore'

const store = usePigmentationStore()

defineEmits(['trigger-print'])

const validationError = ref('')
const soReviewed = ref(store.reviewState.finalized)
const soDecision = ref(store.reviewState.decision || '')
const soNotes = ref(store.reviewState.notes || '')
const soReviewer = ref(store.reviewState.reviewer || 'Dr. A. Mehra')

const runGeneratePlan = async () => {
  validationError.value = ''
  
  if (!store.diagnosis?.confirmedDx) {
    validationError.value = 'Confirm a working diagnosis on the <b>Diagnosis</b> step first — the plan is built on it.'
    return
  }
  
  const missing = []
  if (!store.formData.initials) missing.push("patient initials")
  if (!store.formData.age) missing.push("age")
  if (!store.formData.sex) missing.push("sex")
  if (!store.formData.fitz) missing.push("skin type (analyse captures, or set it)")
  if (store.aiAnalysis && !store.aiAnalysis.confirmed) {
    missing.push("confirmation of AI readings")
  }
  
  if (missing.length > 0) {
    validationError.value = `Add the following before generating: <b>${missing.join(', ')}</b>.`
    return
  }
  
  try {
    await store.generatePlan()
    // Reset review bindings
    soReviewed.value = false
    soDecision.value = ''
    soNotes.value = ''
  } catch (err) {
    validationError.value = err.message || 'API connection failed.'
  }
}

// Banner rendering
const bannerClass = computed(() => {
  if (!store.reviewState.finalized) return 'pending'
  return store.reviewState.decision === 'reject' ? 'rejected' : 'approved'
})

const bannerIcon = computed(() => {
  if (!store.reviewState.finalized) return '!'
  return store.reviewState.decision === 'reject' ? '✕' : '✓'
})

const bannerTitle = computed(() => {
  if (!store.reviewState.finalized) return 'Proposed — pending clinician review'
  if (store.reviewState.decision === 'reject') {
    return `Rejected by ${store.reviewState.reviewer}`
  }
  const label = store.reviewState.decision === 'edit' ? 'Approved with edits' : 'Approved'
  return `${label} by ${store.reviewState.reviewer}`
})

const bannerSubtitle = computed(() => {
  if (!store.reviewState.finalized) return 'Not for patient use until Dr. Mehra reviews and approves below.'
  const when = store.reviewState.ts ? store.reviewState.ts.toLocaleString() : ''
  if (store.reviewState.decision === 'reject') {
    return `${when} — not issued to the patient.`
  }
  return when
})

// Sign-off bindings
const selectDecision = (choice) => {
  if (store.reviewState.finalized) return
  soDecision.value = choice
}

const getRadioClass = (choice) => {
  if (soDecision.value !== choice) return ''
  if (choice === 'approve') return 'sel-good'
  if (choice === 'edit') return 'sel-amber'
  return 'sel-red'
}

const lockPlan = () => {
  if (!soReviewed.value || !soDecision.value) return
  store.finalizeSignoff(soDecision.value, soNotes.value, soReviewer.value)
}

const resetPlan = () => {
  store.lastPlan = null
  store.reviewState = {
    decision: null,
    notes: '',
    reviewer: 'Dr. A. Mehra',
    finalized: false,
    ts: null
  }
  soReviewed.value = false
  soDecision.value = ''
  soNotes.value = ''
}
</script>
