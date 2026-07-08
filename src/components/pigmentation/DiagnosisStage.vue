<template>
  <section class="stage is-active">
    <div class="stage-head">
      <span class="eyebrow">Stage 03 · Diagnosis</span>
      <h1 class="serif">Confirm the working diagnosis</h1>
      <p>
        Confirm the final working diagnosis. The AI differential is proposed from the clinical image
        read and history context. Clinician verification is mandatory before generating a treatment
        plan.
      </p>
    </div>

    <!-- VALIDATION ERROR -->
    <div
      class="card bg-red-1 q-mb-md"
      v-if="validationError"
      id="dxValidate"
      style="border: 1px solid var(--erythema)"
    >
      <div class="err-box">
        <b>Cannot generate diagnosis.</b><br />
        <span v-html="validationError"></span>
      </div>
    </div>

    <!-- INITIAL DIAGNOSIS BUTTON -->
    <div
      class="card tight q-pa-lg text-center"
      v-if="!store.diagnosis && !store.isLoading"
      id="dxStart"
    >
      <div class="text-h6 font-serif q-mb-sm">Generate clinical impression</div>
      <p class="note q-mx-auto text-center" style="margin-bottom: 16px">
        OpenAI will synthesize the 5-mode capture readings, patient triggers, and history to propose
        a differential diagnosis, severity score (mMASI/indices), and depth call.
      </p>
      <button class="btn btn-primary" @click="runGenerateDx">✦ Generate Diagnosis</button>
    </div>

    <!-- LOADING COMPONENT -->
    <div class="card tight text-center q-pa-lg" v-if="store.isLoading" id="dxLoading">
      <div class="spinner"></div>
      <div class="gen-status">{{ store.loadingMessage }}</div>
    </div>

    <!-- DIAGNOSIS OUTPUT / RESULTS -->
    <div v-if="store.diagnosis && !store.isLoading" id="dxOutput">
      <!-- DIAGNOSTIC RESULTS SHEET -->
      <div>
        <!-- primary diagnosis -->
        <div class="pblock">
          <div
            style="
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 10px;
            "
          >
            <h3><span class="bar"></span>Differential Diagnoses</h3>
            <button
              class="btn btn-primary"
              @click="runGenerateDx"
              :disabled="store.isLoading"
              style="font-size: 12px; padding: 4px 10px"
            >
              ✦ Regenerate Diagnosis
            </button>
          </div>
          <div class="dx-primary" style="margin-bottom: 12px">
            <div>
              <div class="nm">
                {{
                  formatCategoryLabel(
                    store.diagnosis.data.working_impression?.primary_category ||
                      store.diagnosis.data.differential?.primary?.dx,
                  )
                }}
              </div>
              <div class="rs" style="margin-top: 4px">
                {{
                  store.diagnosis.data.clinical_summary_for_doctor ||
                  store.diagnosis.data.differential?.primary?.reasoning
                }}
              </div>
            </div>
            <div class="conf">
              {{
                store.diagnosis.data.working_impression?.primary_confidence_100 ||
                store.diagnosis.data.differential?.primary?.confidence
              }}%
            </div>
          </div>

          <!-- alternatives & secondary categories -->
          <div v-if="store.diagnosis.data.working_impression?.secondary_categories?.length">
            <div
              v-for="(sec, idx) in store.diagnosis.data.working_impression.secondary_categories"
              :key="idx"
              class="dx-alt q-mb-sm"
              style="
                display: block;
                border-left: 3px solid var(--slate-light);
                padding-left: 12px;
                margin-bottom: 12px;
                border-radius: 0 4px 4px 0;
              "
            >
              <div
                style="
                  display: flex;
                  justify-content: space-between;
                  font-weight: bold;
                  font-size: 13.5px;
                  color: #1e293b;
                "
              >
                <span>{{ formatCategoryLabel(sec.category) }}</span>
                <span style="color: #64748b; font-weight: normal; font-size: 12px"
                  >{{ sec.confidence_100 }}% confidence</span
                >
              </div>
              <ul
                style="
                  margin: 4px 0 0 16px;
                  padding: 0;
                  font-size: 12px;
                  color: #475569;
                  list-style-type: disc;
                "
              >
                <li v-for="(b, bIdx) in sec.basis" :key="bIdx" style="margin-bottom: 2px">
                  {{ b }}
                </li>
              </ul>
            </div>
          </div>
          <div v-else-if="store.diagnosis.data.differential?.alternatives?.length">
            <div
              v-for="(alt, aIdx) in store.diagnosis.data.differential.alternatives"
              :key="aIdx"
              class="dx-alt"
            >
              <div class="l">
                <b>{{ formatCategoryLabel(alt.dx) }}</b>
                <span v-if="alt.reconsider_when">Reconsider if: {{ alt.reconsider_when }}</span>
              </div>
              <div class="r" style="text-transform: lowercase">{{ alt.likelihood }} likelihood</div>
            </div>
          </div>
        </div>

        <!-- depth & composition boxes -->
        <div class="pblock">
          <div class="twin">
            <div :class="['vbox', getDepthClass(store.diagnosis.data.depth_assessment?.verdict)]">
              <div class="lab">Depth</div>
              <div class="hd">
                {{
                  cap(
                    store.diagnosis.data.depth_assessment?.verdict ||
                      store.formData.depth ||
                      'uncertain',
                  )
                }}
              </div>
              <div class="ds">
                {{
                  store.diagnosis.data.depth_assessment?.prognosis ||
                  store.diagnosis.data.depth_assessment?.basis ||
                  ''
                }}
              </div>
            </div>

            <div
              :class="['vbox', getCompClass(store.diagnosis.data.composition_assessment?.dominant)]"
            >
              <div class="lab">Composition</div>
              <div class="hd">
                {{
                  cap(
                    store.diagnosis.data.composition_assessment?.dominant ||
                      store.formData.comp ||
                      '—',
                  )
                }}
              </div>
              <div class="ds">{{ store.diagnosis.data.composition_assessment?.note || '' }}</div>
            </div>
          </div>
        </div>

        <!-- scores -->
        <div class="pblock">
          <h3><span class="bar"></span>Scores</h3>
          <div
            class="scoregrid"
            v-if="store.diagnosis.data.scores && !Array.isArray(store.diagnosis.data.scores)"
          >
            <div
              class="scorecard"
              v-if="store.diagnosis.data.scores.melanin_load_index !== undefined"
            >
              <div class="sl">Melanin Load Index</div>
              <div class="sv">{{ store.diagnosis.data.scores.melanin_load_index }}</div>
              <div class="si">Estimated melanin burden</div>
            </div>
            <div
              class="scorecard"
              v-if="store.diagnosis.data.scores.erythema_load_index !== undefined"
            >
              <div class="sl">Erythema Load Index</div>
              <div class="sv">{{ store.diagnosis.data.scores.erythema_load_index }}</div>
              <div class="si">Vascular redness indicator</div>
            </div>
            <div
              class="scorecard"
              v-if="store.diagnosis.data.scores.composition_melanin_percent !== undefined"
            >
              <div class="sl">Composition</div>
              <div class="sv">
                {{ store.diagnosis.data.scores.composition_melanin_percent }}% /
                {{ store.diagnosis.data.scores.composition_vascular_percent }}%
              </div>
              <div class="si">Melanin / Vascular ratio</div>
            </div>
            <div
              class="scorecard"
              v-if="store.diagnosis.data.scores.recurrence_risk_index !== undefined"
            >
              <div class="sl">Recurrence Risk</div>
              <div class="sv">{{ store.diagnosis.data.scores.recurrence_risk_index }}</div>
              <div class="si">Relapse likelihood indicator</div>
            </div>
            <div
              class="scorecard"
              v-if="store.diagnosis.data.scores.procedure_risk_index !== undefined"
            >
              <div class="sl">Procedure Risk</div>
              <div class="sv">{{ store.diagnosis.data.scores.procedure_risk_index }}</div>
              <div class="si">Adverse reaction probability</div>
            </div>
            <div
              class="scorecard"
              v-if="store.diagnosis.data.scores.sunscreen_compliance_index !== undefined"
            >
              <div class="sl">Sunscreen Compliance</div>
              <div class="sv">{{ store.diagnosis.data.scores.sunscreen_compliance_index }}</div>
              <div class="si">Photoprotection adherence rating</div>
            </div>
          </div>
          <div
            class="scoregrid"
            v-else-if="
              Array.isArray(store.diagnosis.data.scores_list) && store.diagnosis.data.scores_list.length
            "
          >
            <div class="scorecard" v-for="(s, sIdx) in store.diagnosis.data.scores_list" :key="sIdx">
              <div class="sl">
                {{ s.name }}
                <span style="text-transform: none; font-weight: 400" v-if="s.scale"
                  >({{ s.scale }})</span
                >
              </div>
              <div class="sv">{{ s.value !== null && s.value !== '' ? s.value : '—' }}</div>
              <div class="si">{{ s.interpretation }}</div>
            </div>
          </div>
          <p class="note" style="margin-top: 8px; font-size: 11.5px">
            Scores are AI estimates from the images/history for clinician confirmation.
          </p>
        </div>

        <!-- Key Drivers -->
        <div
          class="pblock"
          v-if="
            store.diagnosis.data.key_drivers && !Array.isArray(store.diagnosis.data.key_drivers)
          "
        >
          <h3><span class="bar"></span>Key Drivers</h3>
          <div
            class="drivers-container"
            style="display: grid; grid-template-columns: 1fr; gap: 12px"
          >
            <div
              v-for="(driverData, driverKey) in store.diagnosis.data.key_drivers"
              :key="driverKey"
              class="driver-card q-pa-md"
              style="border: 1px solid #e2e8f0; border-radius: 6px; background: #f8fafc"
            >
              <div
                style="
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  margin-bottom: 6px;
                "
              >
                <b style="font-size: 13.5px; color: #1e293b">{{
                  formatCategoryLabel(driverKey)
                }}</b>
                <div>
                  <span
                    class="status-badge"
                    style="
                      font-size: 10px;
                      margin-right: 6px;
                      padding: 2px 6px;
                      background: #f1f5f9;
                      color: #475569;
                    "
                  >
                    Likelihood: {{ cap(driverData.likelihood) }}
                  </span>
                  <span style="font-size: 11.5px; color: #64748b"
                    >{{ driverData.confidence_100 }}% confidence</span
                  >
                </div>
              </div>
              <ul
                style="
                  margin: 4px 0 0 16px;
                  padding: 0;
                  font-size: 12px;
                  color: #475569;
                  list-style-type: disc;
                "
              >
                <li v-for="(b, bIdx) in driverData.basis" :key="bIdx" style="margin-bottom: 2px">
                  {{ b }}
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div
          class="pblock"
          v-else-if="
            Array.isArray(store.diagnosis.data.key_drivers) &&
            store.diagnosis.data.key_drivers.length
          "
        >
          <h3><span class="bar"></span>Key drivers</h3>
          <div class="summary-box">
            {{ store.diagnosis.data.key_drivers.join(' · ') }}
          </div>
        </div>

        <!-- Clinical Activity & Risk Profile -->
        <div
          class="pblock"
          v-if="store.diagnosis.data.clinical_activity || store.diagnosis.data.risk_profile"
        >
          <div class="twin">
            <!-- Clinical Activity -->
            <div class="vbox" style="border: 1px solid #e2e8f0; background: #ffffff; padding: 14px">
              <div class="lab" style="font-weight: bold; font-size: 11.5px">Clinical Activity</div>
              <div style="margin-top: 8px">
                <div
                  style="
                    font-size: 13px;
                    margin-bottom: 8px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                  "
                >
                  <b>Stability Status:</b>
                  <span
                    class="status-badge"
                    style="
                      font-weight: bold;
                      background: #e3f2fd;
                      color: #1565c0;
                      padding: 2px 6px;
                      font-size: 11px;
                    "
                  >
                    {{ cap(store.diagnosis.data.clinical_activity?.stability_status || 'unknown') }}
                  </span>
                </div>
                <div
                  style="
                    font-size: 12px;
                    margin-bottom: 6px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    justify-content: space-between;
                  "
                >
                  <span>Acne Driver:</span>
                  <span
                    :class="[
                      'status-badge',
                      store.diagnosis.data.clinical_activity?.active_acne_driver
                        ? 'danger'
                        : 'safe',
                    ]"
                    style="padding: 1px 6px; font-size: 10px; font-weight: bold"
                  >
                    {{
                      store.diagnosis.data.clinical_activity?.active_acne_driver ? 'ACTIVE' : 'NONE'
                    }}
                  </span>
                </div>
                <div
                  style="
                    font-size: 12px;
                    margin-bottom: 6px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    justify-content: space-between;
                  "
                >
                  <span>Inflammation Control:</span>
                  <span
                    :class="[
                      'status-badge',
                      store.diagnosis.data.clinical_activity?.inflammation_first_required
                        ? 'warn'
                        : 'safe',
                    ]"
                    style="padding: 1px 6px; font-size: 10px; font-weight: bold"
                  >
                    {{
                      store.diagnosis.data.clinical_activity?.inflammation_first_required
                        ? 'REQUIRED'
                        : 'NO'
                    }}
                  </span>
                </div>
                <div
                  style="
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    justify-content: space-between;
                  "
                >
                  <span>Barrier Repair First:</span>
                  <span
                    :class="[
                      'status-badge',
                      store.diagnosis.data.clinical_activity?.barrier_repair_first_required
                        ? 'warn'
                        : 'safe',
                    ]"
                    style="padding: 1px 6px; font-size: 10px; font-weight: bold"
                  >
                    {{
                      store.diagnosis.data.clinical_activity?.barrier_repair_first_required
                        ? 'REQUIRED'
                        : 'NO'
                    }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Risk Profile -->
            <div class="vbox" style="border: 1px solid #e2e8f0; background: #ffffff; padding: 14px">
              <div class="lab" style="font-weight: bold; font-size: 11.5px">Risk Profile</div>
              <div style="margin-top: 8px; font-size: 12px; line-height: 1.6">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px">
                  <b>Recurrence:</b>
                  <span>{{
                    cap(store.diagnosis.data.risk_profile?.recurrence_risk || 'moderate')
                  }}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px">
                  <b>Procedure Risk:</b>
                  <span>{{
                    cap(store.diagnosis.data.risk_profile?.procedure_risk || 'moderate')
                  }}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px">
                  <b>Sunscreen compliance:</b>
                  <span>{{
                    cap(store.diagnosis.data.risk_profile?.sunscreen_compliance_risk || 'moderate')
                  }}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px">
                  <b>PIH Risk:</b>
                  <span>{{
                    formatCategoryLabel(store.diagnosis.data.risk_profile?.pih_risk || 'moderate')
                  }}</span>
                </div>
                <div style="display: flex; justify-content: space-between">
                  <b>Red flag lesion risk:</b>
                  <span>{{
                    cap(store.diagnosis.data.risk_profile?.red_flag_lesion_risk || 'low')
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- mMASI Assessment -->
        <div class="pblock" v-if="store.diagnosis.data.mmasi">
          <h3><span class="bar"></span>mMASI Assessment</h3>
          <div
            v-if="store.diagnosis.data.mmasi.applicable"
            class="summary-box"
            style="
              border-left: 3px solid var(--primary);
              padding: 12px;
              background: #f0fdf4;
              color: #166534;
              font-size: 13px;
            "
          >
            <b>mMASI Total Score:</b> {{ store.diagnosis.data.mmasi.score_0_24 }}/24 (Confidence:
            {{ store.diagnosis.data.mmasi.confidence_100 }}%)
          </div>
          <div
            v-else
            class="summary-box"
            style="
              font-style: italic;
              color: #64748b;
              font-size: 12px;
              background: #f8fafc;
              border: 1px dashed #cbd5e1;
              padding: 12px;
            "
          >
            <b>Not Applicable:</b> {{ store.diagnosis.data.mmasi.reason }}
          </div>
        </div>

        <!-- Withhold Treatment Areas -->
        <div
          class="pblock"
          v-if="store.diagnosis.data.localized_restrictions?.do_not_treat_lesions?.length"
        >
          <h3><span class="bar" style="background: #ef4444"></span>Withhold Treatment Areas</h3>
          <div
            class="redflag"
            style="
              display: block;
              padding: 14px;
              background: #fef2f2;
              border: 1px solid #fee2e2;
              color: #991b1b;
              margin-bottom: 12px;
              border-radius: 6px;
            "
          >
            <div
              v-for="lesion in store.diagnosis.data.localized_restrictions.do_not_treat_lesions"
              :key="lesion.lesion_id"
              style="margin-bottom: 10px"
            >
              <strong style="font-size: 13px"
                >⚠️ {{ lesion.lesion_id }} (Region:
                {{ formatCategoryLabel(lesion.region) }})</strong
              >
              <div style="font-size: 12px; margin-top: 3px; color: #7f1d1d; opacity: 0.9">
                <em>Location description:</em> {{ lesion.subregion_description }}
              </div>
              <div
                style="
                  font-weight: bold;
                  font-size: 11.5px;
                  margin-top: 3px;
                  text-transform: uppercase;
                  color: #b91c1c;
                "
              >
                Restriction details: {{ formatCategoryLabel(lesion.reason) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Local Modifiers & Implications -->
        <div
          class="pblock"
          v-if="store.diagnosis.data.localized_restrictions?.local_modifiers?.length"
        >
          <h3><span class="bar"></span>Local Modifiers &amp; Implications</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px">
            <div
              v-for="(mod, modIdx) in store.diagnosis.data.localized_restrictions.local_modifiers"
              :key="modIdx"
              style="
                padding: 10px;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                background: #ffffff;
                font-size: 12px;
              "
            >
              <strong style="color: #1e293b">{{ formatCategoryLabel(mod.region) }}</strong>
              <span
                class="status-badge"
                style="
                  font-size: 9px;
                  margin-left: 6px;
                  padding: 1px 4px;
                  background: #f1f5f9;
                  color: #475569;
                "
              >
                Type: {{ formatCategoryLabel(mod.modifier_type) }}
              </span>
              <div style="margin-top: 6px; color: #475569; line-height: 1.4">
                {{ mod.treatment_implication }}
              </div>
            </div>
          </div>
        </div>

        <!-- Clinical Summary Callout -->
        <div
          class="pblock"
          v-if="
            store.diagnosis.data.clinical_summary_for_doctor ||
            store.diagnosis.data.working_impression?.doctor_review_reason
          "
        >
          <h3>
            <span class="bar" style="background: var(--amber)"></span>Clinical Summary for Doctor
          </h3>
          <div
            class="summary-box"
            style="
              margin-bottom: 12px;
              font-size: 13px;
              line-height: 1.5;
              color: #334155;
              padding: 14px;
              background: #fafafa;
              border-radius: 6px;
              border: 1px solid #e2e8f0;
            "
          >
            {{ store.diagnosis.data.clinical_summary_for_doctor }}
          </div>
          <div
            v-if="store.diagnosis.data.working_impression?.doctor_review_reason"
            class="redflag"
            style="margin-top: 8px"
          >
            <span class="ic">!</span>
            <div class="bd">
              <b>Doctor Review Required:</b>
              {{ store.diagnosis.data.working_impression.doctor_review_reason }}
            </div>
          </div>
        </div>

        <!-- confirmed working dx selection -->
        <div class="pblock" id="confirmDxBlock">
          <h3><span class="bar"></span>Confirm working diagnosis</h3>
          <p class="note" style="margin-bottom: 11px">
            The plan is built on whatever you confirm here. Change it if your clinical judgement
            differs from the AI.
          </p>

          <div class="fgrid">
            <div class="field full">
              <label>Working diagnosis</label>
              <select v-model="selectedDxChoice">
                <option v-for="opt in dxSelectOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>

            <div class="field full" v-if="selectedDxChoice === '__custom__'">
              <label>Custom diagnosis</label>
              <input v-model="customDxValue" placeholder="Enter the working diagnosis" />
            </div>
          </div>

          <button
            class="btn btn-primary"
            style="margin-top: 12px"
            @click="confirmDxSelection"
            v-if="!store.diagnosis.confirmedDx"
          >
            ✓ Confirm working diagnosis
          </button>

          <div
            class="stamp ok show"
            v-if="store.diagnosis.confirmedDx"
            id="dxStamp"
            style="margin-top: 12px"
          >
            <b>✓ Working diagnosis confirmed:</b> {{ store.diagnosis.confirmedDx }}
            <div style="margin-top: 12px">
              <button class="btn btn-primary" @click="confirmAndGoToPlan">
                Continue to plan →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePigmentationStore } from 'src/stores/pigmentationStore'

const store = usePigmentationStore()

onMounted(async () => {
  if (!store.diagnosis && !store.isLoading) {
    await runGenerateDx()
  }
})
const validationError = ref('')
const selectedDxChoice = ref(
  store.diagnosis?.confirmedDx || store.diagnosis?.data?.differential?.primary?.dx || '',
)
const customDxValue = ref('')

const runGenerateDx = async () => {
  validationError.value = ''

  // Validate inputs
  const missing = []
  if (!store.formData.initials) missing.push('patient initials')
  if (!store.formData.age) missing.push('age')
  if (!store.formData.sex) missing.push('sex')
  if (!store.formData.fitz) missing.push('skin type (analyse captures, or set it)')
  // if (store.aiAnalysis && !store.aiAnalysis.confirmed) {
  //   missing.push('confirmation of AI readings')
  // }

  if (missing.length > 0) {
    validationError.value = `Add the following first: <b>${missing.join(', ')}</b>.`
    return
  }

  try {
    await store.generateDx()

    // Set default choice in select options
    if (store.diagnosis?.data?.differential?.primary?.dx) {
      selectedDxChoice.value = store.diagnosis.data.differential.primary.dx
    }
  } catch (err) {
    validationError.value = err.message || 'API connection failed.'
  }
}

const formatCategoryLabel = (val) => {
  if (!val) return ''
  return val
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/Pih/g, 'PIH')
}

// Working Dx selections
const dxSelectOptions = computed(() => {
  if (!store.diagnosis?.data) return []
  const impression = store.diagnosis.data.working_impression
  const primary = impression?.primary_category
  const secondaries = impression?.secondary_categories || []

  const list = []
  if (primary) {
    list.push({ value: primary, label: formatCategoryLabel(primary) })
  }
  secondaries.forEach((sec) => {
    const categoryName = typeof sec === 'object' && sec ? sec.category || '' : String(sec || '')
    // Strip any severity prefix from secondary categories to match allowed values if necessary
    const cleanedSec = categoryName.replace(/^(mild|moderate|severe)_/, '')
    if (cleanedSec && cleanedSec !== primary && !list.some((i) => i.value === cleanedSec)) {
      list.push({ value: cleanedSec, label: formatCategoryLabel(categoryName) })
    }
  })

  // Predefined allowed categories for fallback
  const allCategories = [
    'tanning_diffuse_pigmentation',
    'melasma_like_pigmentation',
    'pih_acne_marks',
    'perioral_pigmentation',
    'periocular_pigmentation',
    'mixed_facial_pigmentation',
    'frictional_body_fold_pigmentation',
    'isolated_spot_doctor_review',
    'active_inflammatory_pigmentation',
    'unclear_doctor_review',
  ]

  allCategories.forEach((cat) => {
    if (cat !== primary && !list.some((i) => i.value === cat)) {
      list.push({ value: cat, label: formatCategoryLabel(cat) })
    }
  })

  list.push({ value: '__custom__', label: 'Other (type below)…' })
  return list
})

const confirmDxSelection = () => {
  const chosen =
    selectedDxChoice.value === '__custom__' ? customDxValue.value.trim() : selectedDxChoice.value
  if (!chosen) {
    alert('Enter or pick a working diagnosis first.')
    return
  }
  store.confirmDx(chosen)
}

const confirmAndGoToPlan = async () => {
  store.currentStage = 3
  try {
    await store.updateAssessment()
  } catch (err) {
    console.error('Failed to save assessment when moving to Plan stage:', err)
  }
}

// Style helpers
const cap = (s) => {
  const str = String(s || '')
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const getDepthClass = (val) => {
  const v = String(val || '').toLowerCase()
  return v === 'epidermal' ? 'epidermal' : v === 'dermal' || v === 'mixed' ? 'dermal' : ''
}

const getCompClass = (val) => {
  const v = String(val || '').toLowerCase()
  return v === 'melanin' ? 'melanin' : v === 'vascular' ? 'vascular' : ''
}
</script>
