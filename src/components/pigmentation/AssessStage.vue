<template>
  <section class="stage is-active">
    <div class="stage-head">
      <span class="eyebrow">Stage 02 · Assess</span>
      <h1 class="serif">Review the read &amp; take history</h1>
      <p>Two things here: confirm the objective data OpenAI pulled from the images, and take the history. OpenAI works across the full range of pigmentation — its impression and questions adapt to whatever the images suggest, not one condition.</p>
    </div>

    <div class="assess-steps">
      <div class="astep">
        <span class="an">1</span>
        <div class="at">
          <b>Confirm the read</b>
          <span>Check the data OpenAI pulled from the images — adjust anything, then confirm.</span>
        </div>
      </div>
      <div class="astep-arrow">→</div>
      <div class="astep">
        <span class="an">2</span>
        <div class="at">
          <b>Take the history</b>
          <span>Fill the history; AI's tailored questions appear alongside.</span>
        </div>
      </div>
    </div>

    <div class="grid-2 wide-l">
      <!-- (1) THE READ -->
      <div class="col">
        <div class="col-label"><span class="cl-num">1</span>The read · confirm the data</div>

        <div class="card" id="aiReadCard">
          <div class="card-title">
            <h3>What OpenAI read from the images</h3>
            <span class="meta" id="aiReadConf">
              {{ store.aiAnalysis?.data?.skin_type?.confidence ? store.aiAnalysis.data.skin_type.confidence + ' confidence' : 'analyse to fill' }}
            </span>
          </div>

          <div id="aiReadBody" v-if="store.aiAnalysis">
            <div class="airead-line" v-if="store.aiAnalysis.data.provisional_conditions?.length">
              <span class="k">Provisional</span>
              <span class="v">
                {{ formattedConditions }}
                <small>From images only — refined by history at the diagnosis step.</small>
              </span>
            </div>

            <div class="airead-line" v-if="formattedDistribution">
              <span class="k">Distribution</span>
              <span class="v">{{ formattedDistribution }}</span>
            </div>

            <div class="airead-line" v-if="formattedFeatures.length">
              <span class="k">Features seen</span>
              <span class="v">{{ formattedFeatures.join('; ') }}</span>
            </div>

            <div class="airead-note">
              Skin type, indices and depth are pre-filled below — confirm or adjust each.
            </div>

            <div class="airead-line" v-if="formattedRedFlags?.present && formattedRedFlags?.items?.length" style="color:var(--erythema)">
              <span class="k" style="color:var(--erythema)">Review</span>
              <span class="v" style="color:var(--erythema)">
                {{ formattedRedFlags.items.join('; ') }}
                <small>Tick the red-flag boxes yourself if warranted — the AI does not clear malignancy.</small>
              </span>
            </div>

            <div class="airead-caveats" v-if="formattedCaveats.length">
              <b>Read as estimates, not measurements.</b>
              <ul>
                <li v-for="(cav, cIdx) in formattedCaveats" :key="cIdx">
                  {{ cav }}
                </li>
              </ul>
            </div>
          </div>
          <div id="aiReadBody" v-else>
            <p class="note">Analyse the captures on the previous step and OpenAI's read of the objective data — skin type, indices, depth, composition, and a provisional impression across all pigmentation types — appears here for you to confirm.</p>
          </div>

          <div class="read-fields">
            <div class="read-fields-head">
              Readings — confirm or adjust
              <span class="meta" id="indicesMeta">{{ readingsMeta }}</span>
            </div>

            <div class="fgrid">
              <div :class="['field', getFieldStatusClass('fitz')]">
                <label>Fitzpatrick skin type <span class="sugtag" :hidden="!store.aiAnalysis">{{ store.aiAnalysis?.confirmed || userModified.fitz ? '✓' : 'AI' }}</span></label>
                <select v-model="store.formData.fitz" @change="onFieldChange('fitz')">
                  <option value="">—</option>
                  <option>I</option>
                  <option>II</option>
                  <option>III</option>
                  <option>IV</option>
                  <option>V</option>
                  <option>VI</option>
                </select>
                <span class="hint" id="a_fitz_hint">{{ fitzHint }}</span>
              </div>

              <div :class="['field', getFieldStatusClass('comp')]">
                <label>Composition <span class="sugtag" :hidden="!store.aiAnalysis">{{ store.aiAnalysis?.confirmed || userModified.comp ? '✓' : 'AI' }}</span></label>
                <select v-model="store.formData.comp" @change="onFieldChange('comp')">
                  <option value="">—</option>
                  <option value="melanin">Melanin-dominant</option>
                  <option value="vascular">Vascular-dominant</option>
                  <option value="mixed">Mixed</option>
                  <option value="uncertain">Uncertain</option>
                </select>
              </div>

              <div :class="['field', getFieldStatusClass('mel')]">
                <label>Melanin index (0–100) <span class="sugtag" :hidden="!store.aiAnalysis">{{ store.aiAnalysis?.confirmed || userModified.mel ? '✓' : 'AI' }}</span></label>
                <input type="number" min="0" max="100" placeholder="—" v-model.number="store.formData.mel" @input="onFieldChange('mel')">
              </div>

              <div :class="['field', getFieldStatusClass('ery')]">
                <label>Erythema index (0–100) <span class="sugtag" :hidden="!store.aiAnalysis">{{ store.aiAnalysis?.confirmed || userModified.ery ? '✓' : 'AI' }}</span></label>
                <input type="number" min="0" max="100" placeholder="—" v-model.number="store.formData.ery" @input="onFieldChange('ery')">
              </div>

              <div class="field">
                <label>Contrast under Wood's UV</label>
                <select v-model="store.formData.woods">
                  <option value="">—</option>
                  <option value="increases">Increases (epidermal)</option>
                  <option value="unchanged">Unchanged (dermal/mixed)</option>
                  <option value="equivocal">Equivocal</option>
                  <option value="notdone">Not done</option>
                </select>
              </div>

              <div :class="['field', getFieldStatusClass('depth')]">
                <label>Depth call <span class="sugtag" :hidden="!store.aiAnalysis">{{ store.aiAnalysis?.confirmed || userModified.depth ? '✓' : 'AI' }}</span></label>
                <select v-model="store.formData.depth" @change="onFieldChange('depth')">
                  <option value="">—</option>
                  <option value="epidermal">Epidermal</option>
                  <option value="dermal">Dermal</option>
                  <option value="mixed">Mixed</option>
                  <option value="uncertain">Uncertain</option>
                </select>
              </div>
            </div>
          </div>

          <div id="aiReadConfirm" style="margin-top:14px" v-if="store.aiAnalysis">
            <div :class="['confirm-readings', { confirmed: store.aiAnalysis.confirmed }]">
              <button class="btn btn-primary" @click="confirmAllReadings" v-if="!store.aiAnalysis.confirmed">
                ✓ Confirm these readings
              </button>
              <span class="done" v-else>
                ✓ Readings confirmed — edit any field to adjust.
              </span>
            </div>
            <p class="note" style="margin-top:8px">Confirming means you accept the values above as the patient's. Edit any field to override.</p>
          </div>
          <div class="card">
            <div class="card-title"><h3>Patient</h3><span class="meta">initials only — no full names</span></div>
            <div class="fgrid">
              <div class="field">
                <label>Patient initials <span class="req">*</span></label>
                <input maxlength="6" placeholder="e.g. R.P." v-model="store.formData.initials">
              </div>
              <div class="field">
                <label>Patient ID / MRN</label>
                <input placeholder="optional" v-model="store.formData.mrn">
              </div>
              <div class="field">
                <label>Age <span class="req">*</span></label>
                <input type="number" min="0" max="120" placeholder="34" v-model.number="store.formData.age">
              </div>
              <div class="field">
                <label>Sex <span class="req">*</span></label>
                <select v-model="store.formData.sex">
                  <option value="">—</option>
                  <option>Female</option>
                  <option>Male</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-title"><h3>Previous treatments tried <span class="req">*</span></h3><span class="meta">tick all that apply</span></div>
            <div class="checks">
              <label v-for="opt in getQuestionOptions('previous_treatments')" :key="opt" :class="['check', { 'is-checked': store.fixedHistory.previous_treatments.includes(opt) }]">
                <input type="checkbox" :value="opt" v-model="store.fixedHistory.previous_treatments">
                {{ formatOptionLabel(opt) }}
              </label>
            </div>
          </div>

          <div class="card">
            <div class="card-title"><h3>Procedure safety &amp; conditions <span class="req">*</span></h3><span class="meta">tick all that apply</span></div>
            <div class="checks">
              <label v-for="opt in getQuestionOptions('procedure_safety')" :key="opt" :class="['check', { 'is-checked': store.fixedHistory.procedure_safety.includes(opt) }]">
                <input type="checkbox" :value="opt" v-model="store.fixedHistory.procedure_safety">
                {{ formatOptionLabel(opt) }}
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- (2) HISTORY -->
      <div class="col">
        <div class="col-label"><span class="cl-num">2</span>History &amp; context</div>

        <!-- Fixed History Questionnaire -->
        <div class="card">
          <div class="card-title"><h3>History &amp; context</h3><span class="meta">all fields required</span></div>
          <div class="fgrid">
            <div class="field">
              <label>Onset duration <span class="req">*</span></label>
              <select v-model="store.fixedHistory.duration">
                <option value="">— select —</option>
                <option v-for="opt in getQuestionOptions('duration')" :key="opt" :value="opt">
                  {{ formatOptionLabel(opt) }}
                </option>
              </select>
            </div>

            <div class="field">
              <label>Stability (last 4–6 weeks) <span class="req">*</span></label>
              <select v-model="store.fixedHistory.stability_last_4_6_weeks">
                <option value="">— select —</option>
                <option v-for="opt in getQuestionOptions('stability_last_4_6_weeks')" :key="opt" :value="opt">
                  {{ formatOptionLabel(opt) }}
                </option>
              </select>
            </div>

            <div class="field">
              <label>Recurrence after improvement <span class="req">*</span></label>
              <select v-model="store.fixedHistory.recurrence_after_improvement">
                <option value="">— select —</option>
                <option v-for="opt in getQuestionOptions('recurrence_after_improvement')" :key="opt" :value="opt">
                  {{ formatOptionLabel(opt) }}
                </option>
              </select>
            </div>

            <div class="field">
              <label>Sunscreen usage <span class="req">*</span></label>
              <select v-model="store.fixedHistory.sunscreen_use">
                <option value="">— select —</option>
                <option v-for="opt in getQuestionOptions('sunscreen_use')" :key="opt" :value="opt">
                  {{ formatOptionLabel(opt) }}
                </option>
              </select>
            </div>

            <div class="field">
              <label>Sunscreen reapplication <span class="req">*</span></label>
              <select v-model="store.fixedHistory.sunscreen_reapplication">
                <option value="">— select —</option>
                <option v-for="opt in getQuestionOptions('sunscreen_reapplication')" :key="opt" :value="opt">
                  {{ formatOptionLabel(opt) }}
                </option>
              </select>
            </div>

            <div class="field">
              <label>Sun/heat exposure level <span class="req">*</span></label>
              <select v-model="store.fixedHistory.outdoor_heat_exposure">
                <option value="">— select —</option>
                <option v-for="opt in getQuestionOptions('outdoor_heat_exposure')" :key="opt" :value="opt">
                  {{ formatOptionLabel(opt) }}
                </option>
              </select>
            </div>

            <div class="field">
              <label>Skin sensitivity to products <span class="req">*</span></label>
              <select v-model="store.fixedHistory.current_sensitivity">
                <option value="">— select —</option>
                <option v-for="opt in getQuestionOptions('current_sensitivity')" :key="opt" :value="opt">
                  {{ formatOptionLabel(opt) }}
                </option>
              </select>
            </div>

            <div class="field">
              <label>Response to prior treatment <span class="req">*</span></label>
              <select v-model="store.fixedHistory.previous_treatment_response">
                <option value="">— select —</option>
                <option v-for="opt in getQuestionOptions('previous_treatment_response')" :key="opt" :value="opt">
                  {{ formatOptionLabel(opt) }}
                </option>
              </select>
            </div>

            <div class="field">
              <label>Are new pimples appearing? <span class="req">*</span></label>
              <select v-model="store.fixedHistory.active_new_acne_frequency">
                <option value="">— select —</option>
                <option v-for="opt in getQuestionOptions('active_new_acne_frequency')" :key="opt" :value="opt">
                  {{ formatOptionLabel(opt) }}
                </option>
              </select>
            </div>

            <div class="field">
              <label>Spot size/shape/color changes? <span class="req">*</span></label>
              <select v-model="store.fixedHistory.red_flag_lesion_change">
                <option value="">— select —</option>
                <option v-for="opt in getQuestionOptions('red_flag_lesion_change')" :key="opt" :value="opt">
                  {{ formatOptionLabel(opt) }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-title"><h3>Triggers &amp; modifiers <span class="req">*</span></h3><span class="meta">tick all that apply</span></div>
          <div class="checks">
            <label v-for="opt in getQuestionOptions('trigger_history')" :key="opt" :class="['check', { 'is-checked': store.fixedHistory.trigger_history.includes(opt) }]">
              <input type="checkbox" :value="opt" v-model="store.fixedHistory.trigger_history">
              {{ formatOptionLabel(opt) }}
            </label>
          </div>
        </div>

        <div class="card">
          <div class="card-title"><h3>Prior treatment &amp; medications</h3></div>
          <label :class="['check', 'danger', { 'is-checked': store.formData.hqHistory }]" style="margin-bottom:11px">
            <input type="checkbox" v-model="store.formData.hqHistory">
            Used OTC fairness creams / unsupervised hydroquinone
          </label>
          <div class="field full" style="margin-bottom:12px">
            <label>Prior treatments (detail)</label>
            <textarea placeholder="What's been tried, for how long, response..." v-model="store.formData.priorTx"></textarea>
          </div>
          <div class="field full">
            <label>Current medications</label>
            <textarea placeholder="Relevant medications (optional)" v-model="store.formData.meds"></textarea>
          </div>
        </div>

        <!-- Moved treatments and safety checks to Column 1 to balance vertical scrolling -->

        <!-- Generate Dynamic Questions Button -->
        <button
          class="btn btn-primary btn-block"
          style="margin-top:14px; margin-bottom:18px"
          :disabled="!isFixedHistoryValid || store.isLoading"
          @click="generateDynamicQuestions"
        >
          ✦ Generate Dynamic History Questions
        </button>

        <!-- Dynamic Questions Card -->
        <div class="card" id="dynCard">
          <div class="card-title">
            <h3>AI's dynamic questions</h3>
            <span class="meta">{{ store.dynamicQuestions.length ? store.dynamicQuestions.length + ' questions' : '—' }}</span>
          </div>
          <div id="dynQuestions">
            <div v-if="store.dynamicQuestions.length > 0">
              <p class="note" style="margin-bottom:12px">Tailored to the image read and fixed history — answer what you can.</p>
              <div v-for="q in store.dynamicQuestions" :key="q.question_id" class="field full" style="margin-bottom:11px">
                <label>
                  {{ q.question }}
                  <span class="hint" style="display:block;font-weight:400" v-if="q.why_asked"><b>Why:</b> {{ q.why_asked }}</span>
                </label>

                <select v-if="q.answer_type === 'single_choice' && q.options?.length" v-model="store.dynamicAnswers[q.question_id]">
                  <option value="">— select —</option>
                  <option v-for="opt in q.options" :key="opt" :value="opt">{{ formatOptionLabel(opt) }}</option>
                </select>
                <select v-else-if="q.answer_type === 'boolean'" v-model="store.dynamicAnswers[q.question_id]">
                  <option value="">— select —</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="not_sure">Unsure</option>
                </select>
                <div v-else-if="q.answer_type === 'multi_choice' && q.options?.length" class="checks q-mt-xs">
                  <label v-for="opt in q.options" :key="opt" :class="['check', { 'is-checked': isDynamicOptionChecked(q.question_id, opt) }]">
                    <input
                      type="checkbox"
                      class="dynamic-question-options"
                      :value="opt"
                      :checked="isDynamicOptionChecked(q.question_id, opt)"
                      @change="toggleDynamicOption(q.question_id, opt)"
                    >
                    {{ formatOptionLabel(opt) }}
                  </label>
                </div>
                <input v-else placeholder="Type patient's response..." v-model="store.dynamicAnswers[q.question_id]">
              </div>
            </div>
            <div v-else>
              <p class="note">Enter all required fixed history fields above and click "Generate Dynamic History Questions" to fetch tailored follow-up queries.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Safety & red-flag screen (Hidden for now) -->
    <div v-if="false">
      <div class="col-label" style="margin-top:4px">
        <span class="cl-num" style="background:var(--erythema)">!</span>Safety &amp; red-flag screen
      </div>
      <div class="grid-2">
        <div class="card">
          <div class="card-title"><h3>Safety screen</h3><span class="meta">history-based · re-writes the plan</span></div>
          <div class="safety-item">
            <div class="sx">
              <b>Pregnant / lactating</b>
              <span>Blocks retinoid, hydroquinone, oral TXA</span>
            </div>
            <button
              :class="['switch', { on: store.safety.pregnancy }]"
              @click="store.safety.pregnancy = !store.safety.pregnancy"
            ></button>
          </div>
          <div class="safety-item">
            <div class="sx">
              <b>Thromboembolic risk</b>
              <span>Clot history, or smoker + OCP</span>
            </div>
            <button
              :class="['switch', { on: store.safety.clot }]"
              @click="store.safety.clot = !store.safety.clot"
            ></button>
          </div>
          <div class="safety-item">
            <div class="sx">
              <b>Ochronosis suspected</b>
              <span>From fairness-cream / HQ history</span>
            </div>
            <button
              :class="['switch', { on: store.safety.ochronosis }]"
              @click="store.safety.ochronosis = !store.safety.ochronosis"
            ></button>
          </div>
        </div>

        <div class="card">
          <div class="card-title"><h3>Red-flag screen</h3><span class="meta">malignancy gate · clinician decides</span></div>
          <div class="checks">
            <label v-for="flag in redFlagOptions" :key="flag" class="check danger">
              <input type="checkbox" :value="flag" v-model="store.redFlags">
              {{ formatRedFlagLabel(flag) }}
            </label>
          </div>
          <div :class="['inline-warn', { show: store.redFlags.length > 0 }]">
            <span class="ic">!</span>
            <div class="body">
              <b>Red flag ticked.</b> This routes you to verify malignancy in person first. The AI-generated plan will prioritize safety warnings and biopsy/referral advice, and will not proposed standard cosmetic procedures for this lesion.
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { usePigmentationStore } from 'src/stores/pigmentationStore'

const store = usePigmentationStore()

const userModified = ref({
  fitz: false,
  comp: false,
  mel: false,
  ery: false,
  depth: false
})

const fixedHistoryQuestions = [
  {
    "id": "duration",
    "question": "When did you first notice the pigmentation?",
    "type": "single_choice",
    "options": [
      "less_than_1_month",
      "1_to_3_months",
      "3_to_6_months",
      "6_to_12_months",
      "more_than_1_year"
    ],
    "required": true
  },
  {
    "id": "stability_last_4_6_weeks",
    "question": "In the last 4–6 weeks, has it been stable, improving, worsening, or spreading?",
    "type": "single_choice",
    "options": ["stable", "improving", "worsening", "spreading", "not_sure"],
    "required": true
  },
  {
    "id": "recurrence_after_improvement",
    "question": "Has this pigmentation improved before and then come back?",
    "type": "single_choice",
    "options": ["yes", "no", "not_sure", "never_treated_before"],
    "required": true
  },
  {
    "id": "sunscreen_use",
    "question": "How often do you use sunscreen?",
    "type": "single_choice",
    "options": ["never", "occasionally", "daily_once", "daily_with_reapplication"],
    "required": true
  },
  {
    "id": "sunscreen_reapplication",
    "question": "When outdoors, do you reapply sunscreen?",
    "type": "single_choice",
    "options": ["never", "rarely", "once_when_outdoors", "every_2_3_hours_when_outdoors", "not_applicable"],
    "required": true
  },
  {
    "id": "outdoor_heat_exposure",
    "question": "Which best describes your usual sun/heat exposure?",
    "type": "single_choice",
    "options": [
      "mostly_indoors",
      "short_daily_outdoor_exposure",
      "frequent_outdoor_exposure",
      "two_wheeler_or_outdoor_work",
      "recent_travel_or_high_sun"
    ],
    "required": true
  },
  {
    "id": "trigger_history",
    "question": "Did the pigmentation start or worsen after any of these?",
    "type": "multi_choice",
    "options": [
      "sun_travel",
      "acne",
      "facial_peel_laser",
      "waxing_threading_bleach",
      "rash_allergy_burning",
      "pregnancy_delivery",
      "hormonal_pills_treatment",
      "menopause",
      "stress",
      "not_sure"
    ],
    "required": true
  },

  {
    "id": "current_sensitivity",
    "question": "Do products currently cause burning, stinging, redness, peeling, or itching?",
    "type": "single_choice",
    "options": ["none", "mild", "moderate", "severe"],
    "required": true
  },
  {
    "id": "previous_treatments",
    "question": "Have you taken pigmentation treatment before?",
    "type": "multi_choice",
    "options": [
      "creams",
      "chemical_peels",
      "q_switch_or_carbon_laser",
      "microneedling",
      "facials",
      "oral_medicines",
      "none"
    ],
    "required": true
  },
  {
    "id": "previous_treatment_response",
    "question": "What happened after previous treatment?",
    "type": "single_choice",
    "options": [
      "improved",
      "no_change",
      "improved_then_came_back",
      "worsened_or_darkened",
      "not_applicable"
    ],
    "required": true
  },
  {
    "id": "active_new_acne_frequency",
    "question": "Are new pimples still appearing?",
    "type": "single_choice",
    "options": ["none", "occasional", "weekly", "frequent_active_acne"],
    "required": true
  },
  {
    "id": "procedure_safety",
    "question": "Please select any that apply.",
    "type": "multi_choice",
    "options": [
      "pregnant",
      "breastfeeding",
      "recent_isotretinoin",
      "keloid_tendency",
      "cold_sore_history",
      "active_infection",
      "none"
    ],
    "required": true
  },
  {
    "id": "red_flag_lesion_change",
    "question": "Has any specific spot recently changed in size, shape, colour, started bleeding, crusting, ulcerating, itching, hurting, or not healing?",
    "type": "single_choice",
    "options": ["yes", "no", "not_sure"],
    "required": true
  }
]

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

const getQuestionOptions = (id) => {
  const q = fixedHistoryQuestions.find(x => x.id === id)
  return q ? q.options : []
}

const isDynamicOptionChecked = (questionId, option) => {
  const ans = store.dynamicAnswers[questionId]
  if (Array.isArray(ans)) {
    return ans.includes(option)
  }
  return false
}

const toggleDynamicOption = (questionId, option) => {
  if (!Array.isArray(store.dynamicAnswers[questionId])) {
    store.dynamicAnswers[questionId] = []
  }
  const arr = [...store.dynamicAnswers[questionId]]
  const idx = arr.indexOf(option)
  if (idx >= 0) {
    arr.splice(idx, 1)
  } else {
    arr.push(option)
  }
  store.dynamicAnswers[questionId] = arr
}

const isFixedHistoryValid = computed(() => {
  if (!store.formData.initials || !store.formData.age || !store.formData.sex) return false
  for (const q of fixedHistoryQuestions) {
    const val = store.fixedHistory[q.id]
    if (q.type === 'single_choice' || q.type === 'boolean') {
      if (!val) return false
    } else if (q.type === 'multi_choice') {
      if (!Array.isArray(val) || val.length === 0) return false
    }
  }
  return true
})

const generateDynamicQuestions = async () => {
  try {
    await store.generateDynamicQuestions()
  } catch (err) {
    alert(err.message || 'Failed to generate dynamic questions.')
  }
}

const formattedConditions = computed(() => {
  if (!store.aiAnalysis?.data) return ''
  const data = store.aiAnalysis.data

  if (Array.isArray(data.pattern_hypotheses_from_images)) {
    return data.pattern_hypotheses_from_images
      .map(p => `${p.pattern.replace(/_/g, ' ')}${p.image_confidence ? ' (' + Math.round(p.image_confidence * 100) + '%)' : ''}`)
      .join(' · ')
  }

  if (Array.isArray(data.provisional_conditions)) {
    return data.provisional_conditions
      .map(c => `${c.condition}${c.likelihood ? ' (' + c.likelihood + ')' : ''}`)
      .join(' · ')
  }

  return ''
})

const formattedDistribution = computed(() => {
  if (!store.aiAnalysis?.data) return ''
  const data = store.aiAnalysis.data
  if (data.distribution_summary) {
    const gd = data.distribution_summary.global_distribution || ''
    const sym = data.distribution_summary.symmetry || ''
    return [gd, sym].filter(Boolean).map(x => x.replace(/_/g, ' ')).join(', ')
  }
  return data.distribution || ''
})

const formattedFeatures = computed(() => {
  if (!store.aiAnalysis?.data) return []
  const data = store.aiAnalysis.data
  if (Array.isArray(data.observed_features)) return data.observed_features

  if (data.regional_analysis) {
    const list = []
    Object.entries(data.regional_analysis).forEach(([region, details]) => {
      if (details.dominant_pattern) {
        list.push(`${region.replace(/_/g, ' ')}: ${details.dominant_pattern.replace(/_/g, ' ')}`)
      }
    })
    return list
  }
  return []
})

const formattedRedFlags = computed(() => {
  if (!store.aiAnalysis?.data) return null
  const data = store.aiAnalysis.data

  if (data.special_findings?.isolated_lesion_review) {
    const r = data.special_findings.isolated_lesion_review
    if (r.doctor_visual_review_required) {
      return { present: true, items: [r.reason] }
    }
    return { present: false, items: [] }
  }

  if (data.redflag_candidates) {
    return {
      present: !!data.redflag_candidates.present,
      items: data.redflag_candidates.items || []
    }
  }

  return null
})

const formattedCaveats = computed(() => {
  if (!store.aiAnalysis?.data?.image_quality) return []
  const q = store.aiAnalysis.data.image_quality
  return q.limitations || q.caveats || []
})

const readingsMeta = computed(() => {
  if (!store.aiAnalysis) return ''
  return store.aiAnalysis.confirmed ? 'confirmed' : 'AI-suggested · confirm each'
})

const fitzHint = computed(() => {
  if (!store.aiAnalysis?.data) return 'Confirm with burn/tan history.'
  const data = store.aiAnalysis.data

  if (data.global_indices?.estimated_fitzpatrick) {
    const ef = data.global_indices.estimated_fitzpatrick
    const type = ef.type || ''
    const conf = ef.confidence ? ` · ${Math.round(ef.confidence * 100)}% confidence` : ''
    return `AI: ${type.replace(/_/g, ' ')}${conf} — confirm with burn/tan history.`
  }

  if (data.skin_type) {
    const st = data.skin_type
    const range = st.fitzpatrick_range || st.fitzpatrick_estimate || ''
    const conf = st.confidence ? ` · ${st.confidence} confidence` : ''
    return `AI: ${range}${conf} — confirm with burn/tan history.`
  }

  return 'Confirm with burn/tan history.'
})

const onFieldChange = (field) => {
  userModified.value[field] = true
  if (store.aiAnalysis && store.aiAnalysis.confirmed) {
    // If it was confirmed globally, reset confirmation status so they review again
    // but the original code allows individual modifications after confirmation
  }
}

const confirmAllReadings = () => {
  store.confirmReadings()
  // Mark all fields as confirmed visually
  Object.keys(userModified.value).forEach(k => {
    userModified.value[k] = false
  })
}

const getFieldStatusClass = (field) => {
  if (!store.aiAnalysis) return ''
  if (store.aiAnalysis.confirmed || userModified.value[field]) {
    return 'is-confirmed'
  }
  return 'is-suggested'
}

// Watchers for synced interactions
watch(() => store.formData.woods, (newVal) => {
  if (newVal === 'increases') {
    store.formData.depth = 'epidermal'
    onFieldChange('depth')
  } else if (newVal === 'unchanged') {
    store.formData.depth = 'mixed'
    onFieldChange('depth')
  } else if (newVal === 'equivocal') {
    store.formData.depth = 'uncertain'
    onFieldChange('depth')
  }
})

watch(() => store.formData.hqHistory, (newVal) => {
  if (newVal && !store.safety.ochronosis) {
    store.safety.ochronosis = true
  }
})
</script>
