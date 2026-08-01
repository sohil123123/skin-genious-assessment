<template>
  <section class="stage is-active">
    <div class="stage-head">
      <span class="eyebrow">Stage 01 · Capture &amp; History</span>
      <h1 class="serif">Capture images &amp; patient history</h1>
      <p>
        Upload files and analyze the captures, while simultaneously entering the patient's
        demographics, clinical history, triggers, and safety parameters.
      </p>
    </div>

    <div class="grid-2 wide-l">
      <!-- COLUMN 1: Captures, Demographics, Previous Treatments, Safety -->
      <div class="col">
        <div class="col-label"><span class="cl-num">1</span>Captures &amp; basic details</div>

        <!-- Uploader Card -->
        <div class="viewer-card" style="margin-bottom: 20px">
          <div class="viewer-head">
            <span class="t">Analyser captures</span>
            <span class="t" style="color: #6f6780">{{ store.attachedImages.length }} attached</span>
          </div>

          <div
            class="dropzone"
            @click="triggerFileInput"
            @dragover.prevent="onDragOver"
            @dragleave="onDragLeave"
            @drop.prevent="onDrop"
            :style="dragOverStyle"
          >
            <div class="big">⊕</div>
            <div>Attach captures — select or drop several at once</div>
            <div class="sub">
              White, Wood's UV, surface &amp; sub-surface polarised, red — JPG/PNG. Multi-select
              supported. Tag each with its mode so the read is accurate.
            </div>
          </div>

          <input
            type="file"
            ref="fileInput"
            accept="image/*"
            multiple
            hidden
            @change="onFileChange"
          />

          <div class="thumbs" v-if="store.attachedImages.length > 0">
            <div v-for="(img, idx) in store.attachedImages" :key="idx" class="thumb-wrap">
              <div class="thumb">
                <img :src="img.dataUrl" alt="" />
                <button class="rm" @click="removeImage(idx)">×</button>
              </div>
              <select class="thumb-mode" v-model="img.mode">
                <option value="">— mode —</option>
                <option v-for="modeOpt in modeLabels" :key="modeOpt.value" :value="modeOpt.value">
                  {{ modeOpt.label }}
                </option>
              </select>
            </div>
          </div>

          <!-- Device connection & pull buttons -->
          <div class="row justify-center q-mb-md q-gutter-sm" style="margin-top: 10px">
            <q-btn
              label="Connect To Device"
              :loading="deviceLoading"
              rounded
              no-caps
              size="14px"
              class="btn-custom"
              @click.stop="connectDevice"
            />
            <q-btn
              label="Manual Capture"
              :loading="deviceLoading"
              rounded
              no-caps
              size="14px"
              class="btn-custom"
              @click.stop="manualPullImages"
            />
          </div>

          <button
            class="btn btn-primary btn-block"
            style="margin-top: 13px"
            @click="runAnalysis"
            :disabled="store.isLoading || store.attachedImages.length === 0"
          >
            ✦ {{ store.isLoading ? 'Analysing captures…' : 'Analyse captures' }}
          </button>

          <div
            v-if="store.isLoading || statusMsg"
            :class="['cap-status', statusType]"
            style="margin-top: 12px"
          >
            {{ store.isLoading ? store.loadingMessage : statusMsg }}
          </div>

          <p
            class="note"
            style="color: #8a8198; text-align: center; margin-top: 9px; font-size: 11.5px"
          >
            White-light capture at minimum. Readings are AI estimates from images for you to confirm
            — not calibrated measurements.
          </p>
        </div>

        <!-- Patient Demographics Card -->
        <div class="card" style="margin-bottom: 20px">
          <div class="card-title">
            <h3>Patient</h3>
            <!-- <span class="meta">initials only — no full names</span> -->
          </div>
          <div class="fgrid">
            <div class="field">
              <label>Patient Name <span class="req">*</span></label>
              <input maxlength="6" placeholder="e.g. R.P." v-model="store.formData.initials" />
            </div>
            <div class="field">
              <label>Patient ID / MRN</label>
              <input placeholder="optional" v-model="store.formData.mrn" />
            </div>
            <div class="field">
              <label>Age <span class="req">*</span></label>
              <input
                type="number"
                min="0"
                max="120"
                placeholder="Enter Age"
                v-model.number="store.formData.age"
              />
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

        <!-- Previous Treatments Card -->
        <div class="card" style="margin-bottom: 20px">
          <div class="card-title">
            <h3>Previous treatments tried <span class="req">*</span></h3>
            <span class="meta">tick all that apply</span>
          </div>
          <div class="checks">
            <label
              v-for="opt in getQuestionOptions('previous_treatments')"
              :key="opt"
              :class="[
                'check',
                { 'is-checked': store.fixedHistory.previous_treatments.includes(opt) },
              ]"
            >
              <input
                type="checkbox"
                :value="opt"
                v-model="store.fixedHistory.previous_treatments"
                @change="handleChoice('previous_treatments', opt)"
              />
              {{ formatOptionLabel(opt) }}
            </label>
          </div>
        </div>

        <!-- Procedure Safety Card -->
        <div class="card" style="margin-bottom: 20px">
          <div class="card-title">
            <h3>Procedure safety &amp; conditions <span class="req">*</span></h3>
            <span class="meta">tick all that apply</span>
          </div>
          <div class="checks">
            <label
              v-for="opt in getQuestionOptions('procedure_safety')"
              :key="opt"
              :class="[
                'check',
                { 'is-checked': store.fixedHistory.procedure_safety.includes(opt) },
              ]"
            >
              <input
                type="checkbox"
                :value="opt"
                v-model="store.fixedHistory.procedure_safety"
                @change="handleChoice('procedure_safety', opt)"
              />
              {{ formatOptionLabel(opt) }}
            </label>
          </div>
        </div>

        <!-- Contraindications Card (Hidden but present for model consistency) -->
        <div class="card" v-if="false">
          <div class="card-title">
            <h3>Procedure safety parameters</h3>
            <span class="meta">absolute contraindications</span>
          </div>
          <div class="safety-item">
            <div class="sx">
              <b>Pregnant / lactating</b>
              <span>Restricts active topicals &amp; peels</span>
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

        <!-- Red Flags (Hidden but present for model consistency) -->
        <div class="card" v-if="false">
          <div class="card-title">
            <h3>Red-flag screen</h3>
            <span class="meta">malignancy gate · clinician decides</span>
          </div>
          <div class="checks">
            <label v-for="flag in redFlagOptions" :key="flag" class="check danger">
              <input type="checkbox" :value="flag" v-model="store.redFlags" />
              {{ formatRedFlagLabel(flag) }}
            </label>
          </div>
        </div>
      </div>

      <!-- COLUMN 2: What OpenAI Read, History & Context, Triggers, Prior Treatments -->
      <div class="col">
        <div class="col-label"><span class="cl-num">2</span>AI findings &amp; clinical history</div>

        <!-- What OpenAI Read Card -->
        <div class="card" id="aiReadCard" style="margin-bottom: 20px">
          <div class="card-title">
            <h3>What OpenAI read from the images</h3>
            <span class="meta" id="aiReadConf">
              {{ formattedConfidence ? formattedConfidence + ' confidence' : 'analyse to fill' }}
            </span>
          </div>

          <div id="aiReadBody" v-if="store.aiAnalysis">
            <div class="airead-line" v-if="formattedConditions">
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

            <div
              class="airead-line"
              v-if="formattedRedFlags?.present && formattedRedFlags?.items?.length"
              style="color: var(--erythema)"
            >
              <span class="k" style="color: var(--erythema)">Review</span>
              <span class="v" style="color: var(--erythema)">
                {{ formattedRedFlags.items.join('; ') }}
                <small
                  >Tick the red-flag boxes yourself if warranted — the AI does not clear
                  malignancy.</small
                >
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
            <p
              class="note"
              v-if="store.formData.fitz"
              style="color: var(--slate); font-weight: 500"
            >
              Previous analysis readings loaded from the database. Click "Analyse captures" if you
              want to re-run the AI analysis.
            </p>
            <p class="note" v-else>
              Analyse the captures and OpenAI's read of the objective data — skin type, indices,
              depth, composition, and a provisional impression across all pigmentation types —
              appears here for you to confirm.
            </p>
          </div>

          <div class="read-fields">
            <div class="read-fields-head">
              Readings — confirm or adjust
              <span class="meta" id="indicesMeta">{{ readingsMeta }}</span>
            </div>

            <div class="fgrid">
              <div :class="['field', getFieldStatusClass('fitz')]">
                <label
                  >Fitzpatrick skin type
                  <span class="sugtag" :hidden="!store.aiAnalysis">{{
                    store.aiAnalysis?.confirmed || userModified.fitz ? '✓' : 'AI'
                  }}</span></label
                >
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
                <label
                  >Composition
                  <span class="sugtag" :hidden="!store.aiAnalysis">{{
                    store.aiAnalysis?.confirmed || userModified.comp ? '✓' : 'AI'
                  }}</span></label
                >
                <select v-model="store.formData.comp" @change="onFieldChange('comp')">
                  <option value="">—</option>
                  <option value="melanin">Melanin-dominant</option>
                  <option value="vascular">Vascular-dominant</option>
                  <option value="mixed">Mixed</option>
                  <option value="uncertain">Uncertain</option>
                </select>
              </div>

              <div :class="['field', getFieldStatusClass('mel')]">
                <label
                  >Melanin index (0–100)
                  <span class="sugtag" :hidden="!store.aiAnalysis">{{
                    store.aiAnalysis?.confirmed || userModified.mel ? '✓' : 'AI'
                  }}</span></label
                >
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="—"
                  v-model.number="store.formData.mel"
                  @input="onFieldChange('mel')"
                />
              </div>

              <div :class="['field', getFieldStatusClass('ery')]">
                <label
                  >Erythema index (0–100)
                  <span class="sugtag" :hidden="!store.aiAnalysis">{{
                    store.aiAnalysis?.confirmed || userModified.ery ? '✓' : 'AI'
                  }}</span></label
                >
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="—"
                  v-model.number="store.formData.ery"
                  @input="onFieldChange('ery')"
                />
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
                <label
                  >Depth call
                  <span class="sugtag" :hidden="!store.aiAnalysis">{{
                    store.aiAnalysis?.confirmed || userModified.depth ? '✓' : 'AI'
                  }}</span></label
                >
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

          <div id="aiReadConfirm" style="margin-top: 14px" v-if="store.aiAnalysis">
            <div :class="['confirm-readings', { confirmed: store.aiAnalysis.confirmed }]">
              <button
                class="btn btn-primary"
                @click="confirmAllReadings"
                v-if="!store.aiAnalysis.confirmed"
              >
                ✓ Confirm these readings
              </button>
              <span class="done" v-else> ✓ Readings confirmed — edit any field to adjust. </span>
            </div>
          </div>
        </div>

        <!-- History & Context Card -->
        <div class="card" style="margin-bottom: 20px">
          <div class="card-title">
            <h3>History &amp; context</h3>
            <span class="meta">all fields required</span>
          </div>
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
                <option
                  v-for="opt in getQuestionOptions('stability_last_4_6_weeks')"
                  :key="opt"
                  :value="opt"
                >
                  {{ formatOptionLabel(opt) }}
                </option>
              </select>
            </div>

            <div class="field">
              <label>Recurrence after improvement <span class="req">*</span></label>
              <select v-model="store.fixedHistory.recurrence_after_improvement">
                <option value="">— select —</option>
                <option
                  v-for="opt in getQuestionOptions('recurrence_after_improvement')"
                  :key="opt"
                  :value="opt"
                >
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
                <option
                  v-for="opt in getQuestionOptions('sunscreen_reapplication')"
                  :key="opt"
                  :value="opt"
                >
                  {{ formatOptionLabel(opt) }}
                </option>
              </select>
            </div>

            <div class="field">
              <label>Sun/heat exposure level <span class="req">*</span></label>
              <select v-model="store.fixedHistory.outdoor_heat_exposure">
                <option value="">— select —</option>
                <option
                  v-for="opt in getQuestionOptions('outdoor_heat_exposure')"
                  :key="opt"
                  :value="opt"
                >
                  {{ formatOptionLabel(opt) }}
                </option>
              </select>
            </div>

            <div class="field">
              <label>Skin sensitivity to products <span class="req">*</span></label>
              <select v-model="store.fixedHistory.current_sensitivity">
                <option value="">— select —</option>
                <option
                  v-for="opt in getQuestionOptions('current_sensitivity')"
                  :key="opt"
                  :value="opt"
                >
                  {{ formatOptionLabel(opt) }}
                </option>
              </select>
            </div>

            <div class="field">
              <label>Response to prior treatment <span class="req">*</span></label>
              <select v-model="store.fixedHistory.previous_treatment_response">
                <option value="">— select —</option>
                <option
                  v-for="opt in getQuestionOptions('previous_treatment_response')"
                  :key="opt"
                  :value="opt"
                >
                  {{ formatOptionLabel(opt) }}
                </option>
              </select>
            </div>

            <div class="field">
              <label>Are new pimples appearing? <span class="req">*</span></label>
              <select v-model="store.fixedHistory.active_new_acne_frequency">
                <option value="">— select —</option>
                <option
                  v-for="opt in getQuestionOptions('active_new_acne_frequency')"
                  :key="opt"
                  :value="opt"
                >
                  {{ formatOptionLabel(opt) }}
                </option>
              </select>
            </div>

            <div class="field">
              <label>Has any spot recently changed? <span class="req">*</span></label>
              <select v-model="store.fixedHistory.red_flag_lesion_change">
                <option value="">— select —</option>
                <option
                  v-for="opt in getQuestionOptions('red_flag_lesion_change')"
                  :key="opt"
                  :value="opt"
                >
                  {{ formatOptionLabel(opt) }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Triggers & Modifiers Card -->
        <div class="card" style="margin-bottom: 20px">
          <div class="card-title">
            <h3>Triggers &amp; modifiers <span class="req">*</span></h3>
            <span class="meta">tick all that apply</span>
          </div>
          <div class="checks">
            <label
              v-for="opt in getQuestionOptions('trigger_history')"
              :key="opt"
              :class="['check', { 'is-checked': store.fixedHistory.trigger_history.includes(opt) }]"
            >
              <input
                type="checkbox"
                :value="opt"
                v-model="store.fixedHistory.trigger_history"
                @change="handleChoice('trigger_history', opt)"
              />
              {{ formatOptionLabel(opt) }}
            </label>
          </div>
        </div>

        <!-- Prior Treatment & Medications Card -->
        <div class="card">
          <div class="card-title"><h3>Prior treatment &amp; medications</h3></div>
          <label
            :class="['check', 'danger', { 'is-checked': store.formData.hqHistory }]"
            style="margin-bottom: 11px"
          >
            <input type="checkbox" v-model="store.formData.hqHistory" />
            Used OTC fairness creams / unsupervised hydroquinone
          </label>
          <div class="field full" style="margin-bottom: 12px">
            <label>Prior treatments (detail)</label>
            <textarea
              placeholder="What's been tried, for how long, response..."
              v-model="store.formData.priorTx"
            ></textarea>
          </div>
          <div class="field full">
            <label>Current medications</label>
            <textarea
              placeholder="Relevant medications (optional)"
              v-model="store.formData.meds"
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Notify, LocalStorage } from 'quasar'
import { api } from 'src/boot/axios'
import { usePigmentationStore } from 'src/stores/pigmentationStore'

const store = usePigmentationStore()
const fileInput = ref(null)
const isDragging = ref(false)
const statusMsg = ref('')
const statusType = ref('')
const deviceLoading = ref(false)

const connectDevice = async () => {
  deviceLoading.value = true
  let user = LocalStorage.getItem('user')
  try {
    user = JSON.parse(user)
    const clinicId = user?.clinic_id || store.clinic_id
    if (!clinicId) throw new Error('Clinic ID not found')

    const response = await api.get(`/device/connect/${clinicId}`)
    Notify.create({
      type: 'positive',
      message: response.data.message,
    })

    if (store.id) {
      await store.getSingleAssessment(store.id)
    }
  } catch (e) {
    console.error(e)
    Notify.create({
      type: 'negative',
      message: e.response?.data?.message || e.message || 'Connection failed',
    })
  } finally {
    deviceLoading.value = false
  }
}

const manualPullImages = async () => {
  deviceLoading.value = true
  let user = LocalStorage.getItem('user')
  try {
    user = JSON.parse(user)
    const clinicId = user?.clinic_id || store.clinic_id
    if (!clinicId) throw new Error('Clinic ID not found')

    const response = await api.get(`/device/pull-last-images/${clinicId}`)
    Notify.create({
      type: 'positive',
      message: response.data.message,
    })

    if (store.id) {
      await store.getSingleAssessment(store.id)
    }
  } catch (e) {
    console.error(e)
    Notify.create({
      type: 'negative',
      message: e.response?.data?.message || e.message || 'Pulling images failed',
    })
  } finally {
    deviceLoading.value = false
  }
}

const userModified = ref({
  fitz: false,
  comp: false,
  mel: false,
  ery: false,
  depth: false,
})

const modeLabels = [
  { value: 'white', label: 'White light' },
  { value: 'woods_uv', label: "Wood's UV" },
  { value: 'surface_polarized', label: 'Surface polarised' },
  { value: 'subsurface_polarized', label: 'Sub-surface polarised' },
  { value: 'red', label: 'Red light' },
]

const fixedHistoryQuestions = [
  {
    id: 'duration',
    question: 'When did you first notice the pigmentation?',
    type: 'single_choice',
    options: [
      'less_than_1_month',
      '1_to_3_months',
      '3_to_6_months',
      '6_to_12_months',
      'more_than_1_year',
    ],
    required: true,
  },
  {
    id: 'stability_last_4_6_weeks',
    question: 'In the last 4–6 weeks, has it been stable, improving, worsening, or spreading?',
    type: 'single_choice',
    options: ['stable', 'improving', 'worsening', 'spreading', 'not_sure'],
    required: true,
  },
  {
    id: 'recurrence_after_improvement',
    question: 'Has this pigmentation improved before and then come back?',
    type: 'single_choice',
    options: ['yes', 'no', 'not_sure', 'never_treated_before'],
    required: true,
  },
  {
    id: 'sunscreen_use',
    question: 'How often do you use sunscreen?',
    type: 'single_choice',
    options: ['never', 'occasionally', 'daily_once', 'daily_with_reapplication'],
    required: true,
  },
  {
    id: 'sunscreen_reapplication',
    question: 'When outdoors, do you reapply sunscreen?',
    type: 'single_choice',
    options: [
      'never',
      'rarely',
      'once_when_outdoors',
      'every_2_3_hours_when_outdoors',
      'not_applicable',
    ],
    required: true,
  },
  {
    id: 'outdoor_heat_exposure',
    question: 'Which best describes your usual sun/heat exposure?',
    type: 'single_choice',
    options: [
      'mostly_indoors',
      'short_daily_outdoor_exposure',
      'frequent_outdoor_exposure',
      'two_wheeler_or_outdoor_work',
      'recent_travel_or_high_sun',
    ],
    required: true,
  },
  {
    id: 'trigger_history',
    question: 'Did the pigmentation start or worsen after any of these?',
    type: 'multi_choice',
    options: [
      'sun_travel',
      'acne',
      'facial_peel_laser',
      'waxing_threading_bleach',
      'rash_allergy_burning',
      'pregnancy_delivery',
      'hormonal_pills_treatment',
      'menopause',
      'stress',
      'not_sure',
    ],
    required: true,
  },
  {
    id: 'current_sensitivity',
    question: 'Do products currently cause burning, stinging, redness, peeling, or itching?',
    type: 'single_choice',
    options: ['none', 'mild', 'moderate', 'severe'],
    required: true,
  },
  {
    id: 'previous_treatments',
    question: 'Have you taken pigmentation treatment before?',
    type: 'multi_choice',
    options: [
      'creams',
      'chemical_peels',
      'q_switch_or_carbon_laser',
      'microneedling',
      'facials',
      'oral_medicines',
      'none',
    ],
    required: true,
  },
  {
    id: 'previous_treatment_response',
    question: 'What happened after previous treatment?',
    type: 'single_choice',
    options: [
      'improved',
      'no_change',
      'improved_then_came_back',
      'worsened_or_darkened',
      'not_applicable',
    ],
    required: true,
  },
  {
    id: 'active_new_acne_frequency',
    question: 'Are new pimples still appearing?',
    type: 'single_choice',
    options: ['none', 'occasional', 'weekly', 'frequent_active_acne'],
    required: true,
  },
  {
    id: 'procedure_safety',
    question: 'Please select any that apply.',
    type: 'multi_choice',
    options: [
      'pregnant',
      'breastfeeding',
      'recent_isotretinoin',
      'keloid_tendency',
      'cold_sore_history',
      'active_infection',
      'none',
    ],
    required: true,
  },
  {
    id: 'red_flag_lesion_change',
    question:
      'Has any specific spot recently changed in size, shape, colour, started bleeding, crusting, ulcerating, itching, hurting, or not healing?',
    type: 'single_choice',
    options: ['yes', 'no', 'not_sure'],
    required: true,
  },
]

const redFlagOptions = [
  'rapid_growth',
  'border_irregularity',
  'color_variegation',
  'bleeding_ulceration',
  'atypical_dermoscopy',
]

const formatRedFlagLabel = (val) => {
  if (!val) return ''
  return val.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const dragOverStyle = computed(() => {
  return isDragging.value ? { borderColor: '#6b6080', background: 'rgba(255,255,255,.02)' } : {}
})

const triggerFileInput = () => {
  fileInput.value.click()
}

const onDragOver = () => {
  isDragging.value = true
}

const onDragLeave = () => {
  isDragging.value = false
}

const onDrop = (e) => {
  isDragging.value = false
  handleFiles(e.dataTransfer.files)
}

const onFileChange = () => {
  const filesList = Array.from(fileInput.value.files)
  handleFiles(filesList)
  fileInput.value.value = '' // clear input
}

const fileToData = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('File read failed'))
    reader.readAsDataURL(file)
  })
}

const guessMode = (name) => {
  const n = (name || '').toLowerCase()
  if (/wood|uv/.test(n)) return 'woods_uv'
  if (/sub.?surf|subsurface/.test(n)) return 'subsurface_polarized'
  if (/surf|polar/.test(n)) return 'surface_polarized'
  if (/red/.test(n)) return 'red'
  if (/white|normal|rgb/.test(n)) return 'white'
  return ''
}

const handleFiles = async (filesList) => {
  const files = Array.from(filesList)
  for (let i = 0; i < files.length; i++) {
    const f = files[i]
    if (!/^image\//.test(f.type)) continue
    if (f.size > 5 * 1024 * 1024) {
      alert(`“${f.name}” is over 5 MB — skipped. Compress and retry.`)
      continue
    }
    if (store.attachedImages.length >= 8) {
      alert('Up to 8 images. Remove one to add another.')
      break
    }
    try {
      const dataUrl = await fileToData(f)
      store.attachedImages.push({
        name: f.name,
        mediaType: f.type,
        base64: dataUrl.split(',')[1],
        dataUrl: dataUrl,
        mode: guessMode(f.name),
        file: f,
      })
    } catch (e) {
      console.error(e)
    }
  }
}
const removeImage = async (idx) => {
  const img = store.attachedImages[idx]
  if (img && img.id && store.id) {
    try {
      await api.delete(`/assessments/${store.id}/images/${img.id}/pigmentation-pre`)
      Notify.create({
        type: 'positive',
        message: 'Image deleted from server successfully',
      })
    } catch (e) {
      console.error('Failed to delete image from server:', e)
      Notify.create({
        type: 'negative',
        message: 'Failed to delete image from server. Please try again.',
      })
      return
    }
  }
  store.attachedImages.splice(idx, 1)
}

const runAnalysis = async () => {
  statusMsg.value = ''
  statusType.value = ''

  if (!store.attachedImages.some((img) => img.mode === 'white')) {
    statusMsg.value = 'Attach a white light image at minimum.'
    statusType.value = 'error'
    Notify.create({
      type: 'warning',
      message: 'Attach a white light image at minimum.',
      position: 'top',
    })
    return
  }

  const dismissNotify = Notify.create({
    group: false,
    timeout: 0,
    spinner: true,
    message: 'Analysing captures with skin-AI...',
    color: 'primary',
    position: 'top',
  })

  try {
    await store.analyseCaptures()
    dismissNotify()
    Notify.create({
      type: 'positive',
      message: 'AI capture analysis completed successfully!',
      position: 'top',
      timeout: 3000,
    })
  } catch (err) {
    dismissNotify()
    statusType.value = 'error'
    statusMsg.value =
      (err.message || 'Analysis failed.') + ' Retry, or continue and enter the readings by hand.'
    Notify.create({
      type: 'negative',
      message: err.message || 'Analysis failed. Click retry, or enter the readings by hand.',
      position: 'top',
      timeout: 5000,
    })
  }
}

const formatOptionLabel = (val) => {
  if (!val) return ''
  return val
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
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
  const q = fixedHistoryQuestions.find((x) => x.id === id)
  return q ? q.options : []
}

const formattedConfidence = computed(() => {
  if (!store.aiAnalysis?.data) return ''
  const data = store.aiAnalysis.data

  const gi = data.global_background_indices || data.global_indices
  if (gi?.estimated_fitzpatrick) {
    const ef = gi.estimated_fitzpatrick
    if (ef.confidence_100) return `${ef.confidence_100}%`
    if (ef.confidence) return `${Math.round(ef.confidence * 100)}%`
  }

  if (data.skin_type?.confidence) {
    const c = String(data.skin_type.confidence)
    return c.includes('%') ? c : `${parseFloat(c) * 100}%`
  }

  return ''
})

const formattedConditions = computed(() => {
  if (!store.aiAnalysis?.data) return ''
  const data = store.aiAnalysis.data

  if (Array.isArray(data.pattern_hypotheses_from_images)) {
    return data.pattern_hypotheses_from_images
      .map(
        (p) =>
          `${(p.family || p.pattern || '').replace(/_/g, ' ')}${p.image_confidence_100 ? ' (' + p.image_confidence_100 + '%)' : p.image_confidence ? ' (' + Math.round(p.image_confidence * 100) + '%)' : ''}`,
      )
      .join(' · ')
  }

  if (Array.isArray(data.provisional_conditions)) {
    return data.provisional_conditions
      .map((c) => `${c.condition}${c.likelihood ? ' (' + c.likelihood + ')' : ''}`)
      .join(' · ')
  }

  return ''
})

const formattedDistribution = computed(() => {
  if (!store.aiAnalysis?.data) return ''
  const data = store.aiAnalysis.data
  if (data.distribution_summary) {
    const gd = data.distribution_summary.global_background_distribution || data.distribution_summary.global_distribution || ''
    const sym = data.distribution_summary.distributional_symmetry || data.distribution_summary.symmetry || ''
    return [gd, sym]
      .filter(Boolean)
      .map((x) => x.replace(/_/g, ' '))
      .join(', ')
  }
  return data.distribution || ''
})

const formattedFeatures = computed(() => {
  if (!store.aiAnalysis?.data) return []
  const data = store.aiAnalysis.data
  if (Array.isArray(data.observed_features)) return data.observed_features

  // Support V2 morphology groups
  if (Array.isArray(data.morphology_groups)) {
    const list = []
    data.morphology_groups.forEach((g) => {
      if (g.morphology) {
        const regionsStr = Array.isArray(g.regions) ? g.regions.map(r => r.replace(/_/g, ' ')).join('/') : ''
        list.push(`${regionsStr || 'lesion'}: ${g.morphology.replace(/_/g, ' ')} (${g.colour_description || g.surface || ''})`)
      }
    })
    if (list.length > 0) return list
  }

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

  // Support V2 morphology groups flagged for review
  if (Array.isArray(data.morphology_groups)) {
    const flagged = data.morphology_groups.filter((g) => g.doctor_review_required)
    if (flagged.length > 0) {
      return {
        present: true,
        items: flagged.map(
          (g) =>
            `${g.regions?.map((r) => r.replace(/_/g, ' ')).join('/') || 'Focal lesion'}: ${g.subregion_description || 'Doctor review required'}`,
        ),
      }
    }
  }

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
      items: data.redflag_candidates.items || [],
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

  const gi = data.global_background_indices || data.global_indices
  if (gi?.estimated_fitzpatrick) {
    const ef = gi.estimated_fitzpatrick
    const type = ef.type || ''
    const conf = ef.confidence_100
      ? ` · ${ef.confidence_100}% confidence`
      : ef.confidence
        ? ` · ${Math.round(ef.confidence * 100)}% confidence`
        : ''
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
}

const confirmAllReadings = () => {
  store.confirmReadings()
  Object.keys(userModified.value).forEach((k) => {
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

const handleChoice = (field, opt) => {
  const isNoneType = opt === 'none' || opt === 'not_sure'
  if (isNoneType) {
    if (store.fixedHistory[field].includes(opt)) {
      store.fixedHistory[field] = [opt]
    }
  } else {
    if (store.fixedHistory[field].includes(opt)) {
      store.fixedHistory[field] = store.fixedHistory[field].filter(
        (x) => x !== 'none' && x !== 'not_sure',
      )
    }
  }
}

// Watchers for synced interactions
watch(
  () => store.formData.woods,
  (newVal) => {
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
  },
)

watch(
  () => store.formData.hqHistory,
  (newVal) => {
    if (newVal && !store.safety.ochronosis) {
      store.safety.ochronosis = true
    }
  },
)
</script>
