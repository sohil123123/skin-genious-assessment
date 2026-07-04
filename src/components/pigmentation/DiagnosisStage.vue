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
      <!-- DERMOSCOPY GATED CARD -->
      <div v-if="store.diagnosis.data?.needs_dermoscopy" class="dermo-req">
        <h4>🔬 Dermoscopy needed before a confident diagnosis</h4>
        <div style="font-size: 13px; color: #4a3d6b; margin-bottom: 12px">
          {{
            store.diagnosis.data.dermoscopy_request?.reason ||
            "The captures and history alone don't give enough confidence to commit to a diagnosis."
          }}
        </div>

        <div style="font-size: 12.5px; color: #4a3d6b; margin-bottom: 16px">
          ↓ Add the dermoscopy image(s) below to extract the findings, then update the diagnosis. No
          dermoscope to hand?
          <a
            href="#"
            @click.prevent="proceedWithoutDermoscopy"
            style="color: var(--violet); font-weight: 600; text-decoration: underline"
          >
            Proceed on the provisional read
          </a>
          — records that dermoscopy was advised.
        </div>

        <!-- Dermoscopy file uploader -->
        <div class="viewer-card" id="dermoCard" style="background: #261f30; margin-bottom: 12px">
          <div class="viewer-head">
            <span class="t">Dermoscopy images</span>
            <span class="t" style="color: #a89fb6"
              >{{ store.dermoscopyImages.length }} attached</span
            >
          </div>

          <div class="dropzone" @click="triggerDermoInput" style="border-color: #534366">
            <div class="big">⊕</div>
            <div>Attach dermoscopic photos</div>
            <div class="sub">High-magnification polarising dermoscopy images — JPG/PNG.</div>
          </div>
          <input
            type="file"
            ref="dermoInput"
            accept="image/*"
            multiple
            hidden
            @change="onDermoFileChange"
          />

          <div class="thumbs" v-if="store.dermoscopyImages.length > 0">
            <div v-for="(img, dIdx) in store.dermoscopyImages" :key="dIdx" class="thumb">
              <img :src="img.dataUrl" alt="" />
              <button class="rm" @click="removeDermoImage(dIdx)">×</button>
            </div>
          </div>

          <button
            class="btn btn-primary btn-block"
            style="margin-top: 13px"
            @click="runDermoscopyExtraction"
            :disabled="store.dermoscopyImages.length === 0"
          >
            ✦ Extract dermoscopy findings
          </button>
        </div>

        <!-- Dermoscopy extraction result -->
        <div
          class="card"
          v-if="store.dermoscopyFindings"
          style="background: #f9f8fc; border-color: #c9beea; margin-bottom: 12px"
        >
          <div class="card-title"><h3 style="color: var(--violet)">Dermoscopy Findings</h3></div>

          <div class="airead-line" v-if="store.dermoscopyFindings.pattern_summary">
            <span class="k">Impression</span>
            <span class="v"
              ><b>{{ store.dermoscopyFindings.pattern_summary }}</b></span
            >
          </div>

          <div class="airead-line" v-if="store.dermoscopyFindings.observed_structures?.length">
            <span class="k">Structures</span>
            <span class="v">{{ store.dermoscopyFindings.observed_structures.join(', ') }}</span>
          </div>

          <div class="airead-line" v-if="store.dermoscopyFindings.feature_checks?.length">
            <span class="k">Feature Checks</span>
            <span class="v">
              <div
                v-for="(fc, fIdx) in store.dermoscopyFindings.feature_checks"
                :key="fIdx"
                style="margin-bottom: 4px"
              >
                • <b>{{ fc.feature }}:</b> {{ fc.status }}
                <span class="hint" style="display: inline" v-if="fc.note">({{ fc.note }})</span>
              </div>
            </span>
          </div>

          <div class="airead-line" v-if="store.dermoscopyFindings.suggests">
            <span class="k">Interpretation</span>
            <span class="v" style="color: var(--violet)">{{
              store.dermoscopyFindings.suggests
            }}</span>
          </div>

          <div class="airead-line" v-if="store.dermoscopyFindings.quality_caveat">
            <span class="k">Quality Note</span>
            <span class="v"
              ><small>{{ store.dermoscopyFindings.quality_caveat }}</small></span
            >
          </div>

          <div
            class="airead-line"
            v-if="store.dermoscopyFindings.red_flags?.present"
            style="color: var(--erythema)"
          >
            <span class="k" style="color: var(--erythema)">RED FLAGS</span>
            <span class="v" style="color: var(--erythema)"
              ><b>{{ store.dermoscopyFindings.red_flags.items?.join('; ') }}</b></span
            >
          </div>

          <button
            class="btn btn-primary btn-block"
            style="margin-top: 12px"
            @click="updateDxWithDermoscopy"
          >
            ✓ Confirm dermoscopy &amp; update diagnosis
          </button>
        </div>

        <!-- Provisional lean -->
        <div class="pblock" v-if="store.diagnosis.data.differential?.primary?.dx">
          <h3><span class="bar"></span>Provisional lean (low confidence)</h3>
          <div class="dx-primary">
            <div>
              <div class="nm">{{ store.diagnosis.data.differential.primary.dx }}</div>
              <div class="rs">{{ store.diagnosis.data.differential.primary.reasoning }}</div>
            </div>
            <div class="conf">{{ store.diagnosis.data.differential.primary.confidence }}%</div>
          </div>
        </div>
      </div>

      <!-- DIAGNOSTIC RESULTS SHEET -->
      <div v-else>
        <!-- primary diagnosis -->
        <div class="pblock">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h3><span class="bar"></span>Differential Diagnoses</h3>
            <button class="btn btn-primary" @click="runGenerateDx" :disabled="store.isLoading" style="font-size: 12px; padding: 4px 10px;">
              ✦ Regenerate Diagnosis
            </button>
          </div>
          <div class="dx-primary" style="margin-bottom: 10px">
            <div>
              <div class="nm">{{ store.diagnosis.data.differential?.primary?.dx }}</div>
              <div class="rs">{{ store.diagnosis.data.differential?.primary?.reasoning }}</div>
            </div>
            <div class="conf">{{ store.diagnosis.data.differential?.primary?.confidence }}%</div>
          </div>

          <!-- alternatives -->
          <div v-if="store.diagnosis.data.differential?.alternatives?.length">
            <div
              v-for="(alt, aIdx) in store.diagnosis.data.differential.alternatives"
              :key="aIdx"
              class="dx-alt"
            >
              <div class="l">
                <b>{{ alt.dx }}</b>
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
        <div class="pblock" v-if="store.diagnosis.data.scores?.length">
          <h3><span class="bar"></span>Scores</h3>
          <div class="scoregrid">
            <div class="scorecard" v-for="(s, sIdx) in store.diagnosis.data.scores" :key="sIdx">
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

        <!-- severity & drivers -->
        <div class="pblock" v-if="store.diagnosis.data.severity_interpretation">
          <h3><span class="bar"></span>Severity</h3>
          <div class="summary-box">{{ store.diagnosis.data.severity_interpretation }}</div>
        </div>

        <div class="pblock" v-if="store.diagnosis.data.key_drivers?.length">
          <h3><span class="bar"></span>Key drivers</h3>
          <div class="summary-box">
            {{ store.diagnosis.data.key_drivers.join(' · ') }}
          </div>
        </div>

        <!-- red flags -->
        <div class="pblock" v-if="store.diagnosis.data.red_flags?.present">
          <div class="redflag">
            <span class="ic">!</span>
            <div class="bd">
              <b>RED FLAGS PRESENT:</b> {{ store.diagnosis.data.red_flags.items?.join('; ') }}
              <div style="margin-top: 4px">
                <b>Action advised:</b> {{ store.diagnosis.data.red_flags.action }}
              </div>
            </div>
          </div>
        </div>

        <!-- uncertainties -->
        <div class="pblock" v-if="store.diagnosis.data.uncertainties?.length">
          <h3>
            <span class="bar" style="background: var(--amber)"></span>Uncertainties &amp; gaps
          </h3>
          <ul class="ulist">
            <li v-for="(u, uIdx) in store.diagnosis.data.uncertainties" :key="uIdx">
              {{ u }}
            </li>
          </ul>
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
              <button class="btn btn-primary" @click="store.currentStage = 3">
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
const dermoInput = ref(null)

const validationError = ref('')
const selectedDxChoice = ref('')
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

// Dermoscopy handlers
const triggerDermoInput = () => {
  dermoInput.value.click()
}

const onDermoFileChange = async () => {
  const files = dermoInput.value.files
  for (let i = 0; i < files.length; i++) {
    const f = files[i]
    if (!/^image\//.test(f.type)) continue
    if (f.size > 5 * 1024 * 1024) {
      alert(`“${f.name}” is over 5 MB — skipped.`)
      continue
    }
    if (store.dermoscopyImages.length >= 5) {
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

      store.dermoscopyImages.push({
        name: f.name,
        mediaType: f.type,
        base64: dataUrl.split(',')[1],
        dataUrl: dataUrl,
        file: f,
      })
    } catch (e) {
      console.error(e)
    }
  }
  dermoInput.value.value = ''
}

const removeDermoImage = (idx) => {
  store.dermoscopyImages.splice(idx, 1)
}

const runDermoscopyExtraction = async () => {
  try {
    await store.extractDermoscopy()
  } catch (e) {
    alert(e.message || 'Failed to extract dermoscopy findings.')
  }
}

const updateDxWithDermoscopy = async () => {
  try {
    // If dermoscopy is analyzed, needs_dermoscopy becomes false
    if (store.diagnosis?.data) {
      store.diagnosis.data.needs_dermoscopy = false
    }
    await store.generateDx()

    if (store.diagnosis?.data?.differential?.primary?.dx) {
      selectedDxChoice.value = store.diagnosis.data.differential.primary.dx
    }
  } catch (e) {
    alert(e.message || 'Failed to update diagnosis.')
  }
}

const proceedWithoutDermoscopy = () => {
  if (store.diagnosis?.data) {
    store.diagnosis.data.needs_dermoscopy = false
    if (store.diagnosis.data.differential?.primary?.dx) {
      selectedDxChoice.value = store.diagnosis.data.differential.primary.dx
    }
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
    // Strip any severity prefix from secondary categories to match allowed values if necessary
    const cleanedSec = sec.replace(/^(mild|moderate|severe)_/, '')
    if (cleanedSec && cleanedSec !== primary && !list.some(i => i.value === cleanedSec)) {
      list.push({ value: cleanedSec, label: formatCategoryLabel(sec) })
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
    'unclear_doctor_review'
  ]

  allCategories.forEach((cat) => {
    if (cat !== primary && !list.some(i => i.value === cat)) {
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
