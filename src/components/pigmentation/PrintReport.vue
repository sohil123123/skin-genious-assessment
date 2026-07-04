<template>
  <div id="printDoc">
    <h1>Pigmentation Assessment &amp; Plan</h1>
    <div class="pmeta">
      AI Aesthetics Pigment Co-Pilot · AI-proposed, clinician-reviewed ·
      {{
        store.reviewState.ts ? store.reviewState.ts.toLocaleString() : new Date().toLocaleString()
      }}
    </div>

    <h2>Patient</h2>
    <div class="row">
      <span class="k">Initials</span>
      <span
        >{{ store.formData.initials
        }}{{ store.formData.mrn ? ' · ID ' + store.formData.mrn : '' }}</span
      >
    </div>
    <div class="row">
      <span class="k">Age / Sex / Fitzpatrick</span>
      <span>{{ store.formData.age }} · {{ store.formData.sex }} · {{ store.formData.fitz }}</span>
    </div>

    <h2>Assessment</h2>
    <div class="row">
      <span class="k">Working diagnosis</span>
      <span
        ><b>{{ store.diagnosis?.confirmedDx || store.lastPlan?.condition || '—' }}</b></span
      >
    </div>
    <div class="row" v-if="store.diagnosis?.data?.differential?.primary?.dx">
      <span class="k">AI differential (primary)</span>
      <span>
        {{ store.diagnosis.data.differential.primary.dx }}
        <span v-if="store.diagnosis.data.differential.primary.confidence != null">
          ({{ store.diagnosis.data.differential.primary.confidence }}% confidence)
        </span>
      </span>
    </div>
    <div class="row">
      <span class="k">Depth</span>
      <span>{{
        cap(store.diagnosis?.data?.depth_assessment?.verdict || store.formData.depth || 'uncertain')
      }}</span>
    </div>
    <div class="row">
      <span class="k">Composition</span>
      <span>{{
        cap(store.diagnosis?.data?.composition_assessment?.dominant || store.formData.comp || '—')
      }}</span>
    </div>
    <div class="row" v-if="store.formData.notes">
      <span class="k">Dermoscopy findings</span>
      <span>{{ store.formData.notes }}</span>
    </div>
    <div class="row" v-if="store.diagnosis?.data?.severity_interpretation">
      <span class="k">Severity</span>
      <span>{{ store.diagnosis.data.severity_interpretation }}</span>
    </div>

    <!-- Scores -->
    <div class="row" v-for="(s, sIdx) in store.diagnosis?.data?.scores" :key="sIdx">
      <span class="k"
        >{{ s.name }} <span v-if="s.scale">({{ s.scale }})</span></span
      >
      <span>
        {{ s.value !== null && s.value !== '' ? s.value : '—' }}
        <span v-if="s.interpretation"> — {{ s.interpretation }}</span>
      </span>
    </div>

    <div class="row" v-if="store.diagnosis?.data?.red_flags?.present">
      <span class="k">RED FLAGS</span>
      <span>{{ store.diagnosis.data.red_flags.action || 'In-person review' }}</span>
    </div>
    <div class="row" v-if="store.lastPlan?.condition_specific_note">
      <span class="k">Condition note</span>
      <span>{{ store.lastPlan.condition_specific_note }}</span>
    </div>
    <div class="row" v-if="store.lastPlan?.prognosis">
      <span class="k">Prognosis</span>
      <span>{{ store.lastPlan.prognosis }}</span>
    </div>

    <h2>Plan</h2>
    <b>Tier 0 — Photoprotection</b>
    <ul>
      <li v-for="(pText, pIdx) in store.lastPlan?.plan?.tier0_photoprotection" :key="pIdx">
        {{ pText }}
      </li>
    </ul>

    <b>Tier 1 — Topical</b>
    <ul>
      <li
        v-for="(t, tIdx) in store.lastPlan?.plan?.tier1_topical"
        :key="tIdx"
        :class="{ blocked: t.contraindicated }"
      >
        {{ t.agent || '—' }}
        <span v-if="t.detail"> — {{ t.detail }}</span>
        <span v-if="t.contraindicated">
          (CONTRAINDICATED: {{ t.contraindication_reason || 'safety risk' }})</span
        >
      </li>
    </ul>

    <b>Tier 2 — Procedural</b>
    <ul>
      <li v-for="(pr, prIdx) in store.lastPlan?.plan?.tier2_procedural" :key="prIdx">
        {{ pr.intervention || pr.agent || '—' }}
        <span v-if="pr.detail"> — {{ pr.detail }}</span>
      </li>
    </ul>

    <b v-if="store.lastPlan?.plan?.oral_options?.length">Oral options</b>
    <ul v-if="store.lastPlan?.plan?.oral_options?.length">
      <li
        v-for="(o, oIdx) in store.lastPlan.plan.oral_options"
        :key="oIdx"
        :class="{ blocked: o.contraindicated }"
      >
        {{ o.agent || '—' }}
        <span v-if="o.detail"> — {{ o.detail }}</span>
        <span v-if="o.contraindicated"> (CONTRAINDICATED: {{ o.reason || 'safety risk' }})</span>
      </li>
    </ul>

    <div class="row" v-if="store.lastPlan?.plan?.sequencing_note">
      <span class="k">Sequencing</span>
      <span>{{ store.lastPlan.plan.sequencing_note }}</span>
    </div>

    <!-- Goals -->
    <h2 v-if="store.lastPlan?.goals?.length">
      Goals (set at assessment · checked at reassessment)
    </h2>
    <ul v-if="store.lastPlan?.goals?.length">
      <li v-for="(g, gIdx) in store.lastPlan.goals" :key="gIdx">
        <b>{{ g.metric }}</b> — baseline {{ g.baseline || '—' }} → target {{ g.target || '—' }} by
        {{ g.timeframe || '—' }}
      </li>
    </ul>

    <!-- Safety check markers -->
    <h2 v-if="store.lastPlan?.safety_flags?.length">Verify before prescribing</h2>
    <ul v-if="store.lastPlan?.safety_flags?.length">
      <li v-for="(f, fIdx) in store.lastPlan.safety_flags" :key="fIdx">
        {{ f }}
      </li>
    </ul>

    <h2 v-if="store.lastPlan?.patient_summary">For the patient</h2>
    <div v-if="store.lastPlan?.patient_summary">
      {{ store.lastPlan.patient_summary }}
    </div>

    <!-- Sign-off card printed -->
    <div class="signbox">
      <b>Clinician sign-off: {{ (store.reviewState.decision || '').toUpperCase() }}</b
      ><br />
      Reviewed by {{ store.reviewState.reviewer }} · {{ store.reviewState.ts?.toLocaleString() }}
      <span v-if="store.reviewState.notes"><br />Notes: {{ store.reviewState.notes }}</span>
      <br /><br />
      {{
        store.lastPlan?.disclaimer ||
        'AI-generated proposal reviewed by the treating clinician. Not a standalone diagnosis.'
      }}
    </div>
  </div>
</template>

<script setup>
import { usePigmentationStore } from 'src/stores/pigmentationStore'

const store = usePigmentationStore()

const cap = (s) => {
  const str = String(s || '')
  return str.charAt(0).toUpperCase() + str.slice(1)
}
</script>

<style scoped>
#printDoc {
  display: none;
}

@media print {
  #printDoc {
    display: block !important;
    padding: 26px 30px;
    max-width: 780px;
    margin: 0 auto;
    color: #000;
    font-size: 12.5px;
    background: #fff;
  }
  #printDoc h1 {
    font-family: 'Fraunces', serif;
    font-size: 22px;
    margin-bottom: 4px;
    font-weight: 500;
  }
  #printDoc .pmeta {
    color: #555;
    font-size: 12px;
    margin-bottom: 16px;
    border-bottom: 1px solid #ccc;
    padding-bottom: 12px;
  }
  #printDoc h2 {
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin: 16px 0 7px;
    border-bottom: 1px solid #ddd;
    padding-bottom: 3px;
    font-weight: 700;
  }
  #printDoc .row {
    display: flex;
    gap: 8px;
    padding: 3px 0;
    font-size: 12px;
  }
  #printDoc .row .k {
    color: #555;
    min-width: 150px;
  }
  #printDoc .signbox {
    margin-top: 20px;
    border: 1.5px solid #000;
    border-radius: 8px;
    padding: 12px 14px;
    font-size: 12px;
  }
  #printDoc .blocked {
    text-decoration: line-through;
    color: #999;
  }
  #printDoc ul {
    margin: 4px 0 4px 18px;
  }
  #printDoc li {
    margin: 2px 0;
  }
}
</style>
