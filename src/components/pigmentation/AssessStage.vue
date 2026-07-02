<template>
  <section class="stage is-active">
    <div class="stage-head">
      <span class="eyebrow">Stage 02 · Assess</span>
      <h1 class="serif">Review the read &amp; take history</h1>
      <p>Two things here: confirm the objective data Claude pulled from the images, and take the history. Claude works across the full range of pigmentation — its impression and questions adapt to whatever the images suggest, not one condition.</p>
    </div>

    <div class="assess-steps">
      <div class="astep">
        <span class="an">1</span>
        <div class="at">
          <b>Confirm the read</b>
          <span>Check the data Claude pulled from the images — adjust anything, then confirm.</span>
        </div>
      </div>
      <div class="astep-arrow">→</div>
      <div class="astep">
        <span class="an">2</span>
        <div class="at">
          <b>Take the history</b>
          <span>Fill the history; Claude's tailored questions appear alongside.</span>
        </div>
      </div>
    </div>

    <div class="grid-2 wide-l">
      <!-- (1) THE READ -->
      <div class="col">
        <div class="col-label"><span class="cl-num">1</span>The read · confirm the data</div>
        
        <div class="card" id="aiReadCard">
          <div class="card-title">
            <h3>What Claude read from the images</h3>
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
            
            <div class="airead-line" v-if="store.aiAnalysis.data.distribution">
              <span class="k">Distribution</span>
              <span class="v">{{ store.aiAnalysis.data.distribution }}</span>
            </div>
            
            <div class="airead-line" v-if="store.aiAnalysis.data.observed_features?.length">
              <span class="k">Features seen</span>
              <span class="v">{{ store.aiAnalysis.data.observed_features.join('; ') }}</span>
            </div>
            
            <div class="airead-note">
              Skin type, indices and depth are pre-filled below — confirm or adjust each.
            </div>
            
            <div class="airead-line" v-if="store.aiAnalysis.data.redflag_candidates?.present && store.aiAnalysis.data.redflag_candidates?.items?.length" style="color:var(--erythema)">
              <span class="k" style="color:var(--erythema)">Review</span>
              <span class="v" style="color:var(--erythema)">
                {{ store.aiAnalysis.data.redflag_candidates.items.join('; ') }}
                <small>Tick the red-flag boxes yourself if warranted — the AI does not clear malignancy.</small>
              </span>
            </div>
            
            <div class="airead-caveats" v-if="store.aiAnalysis.data.image_quality?.caveats?.length">
              <b>Read as estimates, not measurements.</b>
              <ul>
                <li v-for="(cav, cIdx) in store.aiAnalysis.data.image_quality.caveats" :key="cIdx">
                  {{ cav }}
                </li>
              </ul>
            </div>
          </div>
          <div id="aiReadBody" v-else>
            <p class="note">Analyse the captures on the previous step and Claude's read of the objective data — skin type, indices, depth, composition, and a provisional impression across all pigmentation types — appears here for you to confirm.</p>
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
        </div>
      </div>

      <!-- (2) HISTORY -->
      <div class="col">
        <div class="col-label"><span class="cl-num">2</span>History &amp; context</div>
        
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
          <div class="card-title"><h3>Presentation</h3></div>
          <div class="fgrid">
            <div class="field">
              <label>Distribution</label>
              <input placeholder="e.g. bilateral malar / central face / under-eyes / discrete spots" v-model="store.formData.dist">
            </div>
            <div class="field">
              <label>Duration</label>
              <input placeholder="e.g. 2 years" v-model="store.formData.dur">
            </div>
            <div class="field">
              <label>Onset / timing</label>
              <input placeholder="e.g. after pregnancy / after acne / after sun" v-model="store.formData.onset">
            </div>
            <div class="field">
              <label>Progression</label>
              <select v-model="store.formData.prog">
                <option value="">—</option>
                <option>Stable</option>
                <option>Spreading</option>
                <option>Improving</option>
                <option>Fluctuating (seasonal)</option>
              </select>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-title"><h3>Triggers &amp; modifiers</h3><span class="meta">tick all that apply</span></div>
          <div class="checks">
            <label v-for="trigger in triggerOptions" :key="trigger" class="check">
              <input type="checkbox" :value="trigger" v-model="store.formData.triggers">
              {{ formatTriggerLabel(trigger) }}
            </label>
          </div>
        </div>

        <div class="card">
          <div class="card-title"><h3>Prior treatment &amp; medications</h3></div>
          <label class="check danger" style="margin-bottom:11px">
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

        <div class="card" id="dynCard">
          <div class="card-title">
            <h3>Claude's questions</h3>
            <span class="meta">{{ store.dynamicQuestions.length ? store.dynamicQuestions.length + ' questions' : '—' }}</span>
          </div>
          <div id="dynQuestions">
            <div v-if="store.dynamicQuestions.length > 0">
              <p class="note" style="margin-bottom:12px">Tailored to the image read — answer what you can.</p>
              <div v-for="(q, idx) in store.dynamicQuestions" :key="idx" class="field full" style="margin-bottom:11px">
                <label>
                  {{ q.question || ("Question " + (idx + 1)) }}
                  <span class="hint" style="display:block;font-weight:400" v-if="q.why">{{ q.why }}</span>
                </label>
                
                <select v-if="q.type === 'select' && q.options?.length" v-model="store.dynamicAnswers[idx]">
                  <option value="">—</option>
                  <option v-for="opt in q.options" :key="opt">{{ opt }}</option>
                </select>
                <select v-else-if="q.type === 'boolean'" v-model="store.dynamicAnswers[idx]">
                  <option value="">—</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Unsure">Unsure</option>
                </select>
                <input v-else placeholder="…" v-model="store.dynamicAnswers[idx]">
              </div>
            </div>
            <div v-else>
              <p class="note">Analyse the captures and these populate — tailored to what the images suggest (melasma, PIH, lentigines, periorbital, tanning, ochronosis, …). You can still proceed without them.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Safety & red-flag screen -->
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

const triggerOptions = [
  'High / cumulative sun exposure',
  'Irregular sunscreen use',
  'Recent intense sun / holiday (tanning)',
  'Hormonal (pregnancy / OCP / HRT)',
  'Family history of pigmentation',
  'Preceding acne / injury / inflammation (PIH)',
  'Eye-rubbing / allergy / poor sleep (periorbital)',
  'Photosensitising medication',
  'Thyroid / endocrine disease'
]

const redFlagOptions = [
  'Lesion suspicious for malignancy',
  'Asymmetric / irregular border',
  'Rapidly evolving or new',
  'Ulceration or bleeding'
]

const formatTriggerLabel = (val) => {
  if (val.includes('pregnancy')) return 'Hormonal (pregnancy/OCP)'
  if (val.includes('acne')) return 'Preceding acne/injury (PIH)'
  if (val.includes('Eye-rubbing')) return 'Eye-rubbing / allergy / sleep'
  return val.replace(/\s*\(.*?\)/, '').replace('exposure', '')
}

const formatRedFlagLabel = (val) => {
  if (val.includes('malignancy')) return 'Suspicious lesion'
  if (val.includes('Asymmetric')) return 'Asymmetric/irregular'
  if (val.includes('Rapidly')) return 'Rapidly evolving / new'
  return val
}

const formattedConditions = computed(() => {
  if (!store.aiAnalysis?.data?.provisional_conditions) return ''
  return store.aiAnalysis.data.provisional_conditions
    .map(c => `${c.condition}${c.likelihood ? ' (' + c.likelihood + ')' : ''}`)
    .join(' · ')
})

const readingsMeta = computed(() => {
  if (!store.aiAnalysis) return ''
  return store.aiAnalysis.confirmed ? 'confirmed' : 'AI-suggested · confirm each'
})

const fitzHint = computed(() => {
  if (!store.aiAnalysis?.data?.skin_type) return 'Confirm with burn/tan history.'
  const st = store.aiAnalysis.data.skin_type
  const range = st.fitzpatrick_range || st.fitzpatrick_estimate || ''
  const conf = st.confidence ? ` · ${st.confidence} confidence` : ''
  return `AI: ${range}${conf} — confirm with burn/tan history.`
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
