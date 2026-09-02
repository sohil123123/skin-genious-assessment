<template>
  <section class="stage is-active">
    <div class="stage-head">
      <span class="eyebrow">Stage 05 · Reassess</span>
      <h1 class="serif">Goal tracking &amp; reassessment</h1>
      <p>
        Assess patient progress against the baseline goals. Upload follow-up captures, answer
        follow-up questions, and evaluate the treatment trajectory.
      </p>
    </div>

    <!-- VALIDATION ERROR -->
    <div
      class="card bg-red-1 q-mb-md"
      v-if="validationError"
      id="raValidate"
      style="border: 1px solid var(--erythema)"
    >
      <div class="err-box">
        <b>Cannot run reassessment.</b><br />
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
        <h3>
          <span class="bar"></span>1. Follow-up images
          <span style="font-weight: 400; color: var(--slate); font-size: 12px"
            >· upload post-treatment captures</span
          >
        </h3>
        <div class="viewer-card" style="background: #261f30">
          <div class="viewer-head">
            <span class="t">Follow-up scans</span>
            <span class="t" style="color: #a89fb6">{{ store.reassessImages.length }} attached</span>
          </div>

          <div class="dropzone" @click="triggerRaInput" style="border-color: #534366">
            <div class="big">⊕</div>
            <div>Attach follow-up captures</div>
            <div class="sub">
              Upload new white-light or Wood's UV images to assess pigment changes — JPG/PNG.
            </div>
          </div>
          <input
            type="file"
            ref="raInput"
            accept="image/*"
            multiple
            hidden
            @change="onRaFileChange"
          />

          <div class="thumbs" v-if="store.reassessImages.length > 0">
            <div v-for="(img, idx) in store.reassessImages" :key="idx" class="thumb-wrap">
              <div class="thumb">
                <img :src="img.dataUrl" alt="" />
                <button class="rm" @click="removeRaImage(idx)">×</button>
              </div>
              <select class="thumb-mode" v-model="img.mode">
                <option value="">— mode —</option>
                <option v-for="modeOpt in modeLabels" :key="modeOpt.value" :value="modeOpt.value">
                  {{ modeOpt.label }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- STEP 2: GOALS TRACKING VALUE INPUT -->
      <div class="pblock q-mt-lg">
        <h3>
          <span class="bar"></span>2. Goals baseline vs current
          <span style="font-weight: 400; color: var(--slate); font-size: 12px"
            >· enter current indices</span
          >
        </h3>
        <div id="raGoals">
          <div
            v-for="(g, idx) in store.goals"
            :key="idx"
            class="ra-goal"
            style="position: relative; padding-right: 40px"
          >
            <!-- Delete goal button -->
            <button
              class="btn-text text-negative"
              style="
                position: absolute;
                right: 8px;
                top: 8px;
                font-size: 20px;
                line-height: 1;
                border: none;
                background: transparent;
                cursor: pointer;
                padding: 4px;
                font-weight: bold;
                z-index: 10;
              "
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
            />
            <div class="ra-grid">
              <div>
                <div class="gh">Baseline</div>
                <input class="ra-base" v-model="g.baseline" />
              </div>
              <div>
                <div class="gh">Target</div>
                <input class="ra-target" v-model="g.target" />
              </div>
              <div>
                <div class="gh">Timeframe</div>
                <input class="ra-tf" v-model="g.timeframe" />
              </div>
              <div>
                <div class="gh">Current Value</div>
                <input class="ra-current" placeholder="now" v-model="g.current" />
              </div>
            </div>
          </div>
        </div>

        <button
          class="btn btn-block"
          style="margin-top: 10px; border-style: dashed"
          @click="addGoalRow"
        >
          + Add another goal
        </button>
      </div>

      <!-- STEP 3: DYNAMIC QUESTIONS SECTION -->
      <div class="pblock q-mt-lg">
        <h3>
          <span class="bar"></span>3. Follow-up &amp; compliance history
          <span style="font-weight: 400; color: var(--slate); font-size: 12px"
            >· dynamic AI questions</span
          >
        </h3>

        <div class="card bg-grey-1" style="border: 1px solid var(--line)">
          <div
            v-if="!store.reassessQuestions || store.reassessQuestions.length === 0"
            class="text-center q-py-md"
          >
            <p class="note q-mb-md">
              AI needs to formulate dynamic compliance and side-effect questions based on the
              treatment plan and follow-up images.
            </p>
            <button class="btn" @click="generateQuestions" :disabled="store.isLoading">
              ✦ Formulate follow-up questions
            </button>
          </div>

          <div v-else>
            <div
              v-for="q in store.reassessQuestions"
              :key="q.question_id"
              class="field full q-mb-md"
            >
              <label class="text-weight-bold">
                {{ q.question }}
                <span
                  class="hint"
                  style="display: block; font-weight: 400; color: var(--slate)"
                  v-if="q.why_asked"
                >
                  <b>Why:</b> {{ q.why_asked }}
                </span>
              </label>

              <!-- Single choice select -->
              <select
                v-if="q.answer_type === 'single_choice' && q.options?.length"
                v-model="store.reassessAnswers[q.question_id]"
              >
                <option value="">— select —</option>
                <option v-for="opt in q.options" :key="opt" :value="opt">
                  {{ formatOptionLabel(opt) }}
                </option>
              </select>

              <!-- Boolean select -->
              <select
                v-else-if="q.answer_type === 'boolean'"
                v-model="store.reassessAnswers[q.question_id]"
              >
                <option value="">— select —</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="not_sure">Unsure</option>
              </select>

              <!-- Multi-choice checks -->
              <div
                v-else-if="q.answer_type === 'multi_choice' && q.options?.length"
                class="checks q-mt-xs"
              >
                <label
                  v-for="opt in q.options"
                  :key="opt"
                  :class="['check', { 'is-checked': isOptionChecked(q.question_id, opt) }]"
                >
                  <input
                    type="checkbox"
                    :value="opt"
                    :checked="isOptionChecked(q.question_id, opt)"
                    @change="toggleOption(q.question_id, opt)"
                  />
                  {{ formatOptionLabel(opt) }}
                </label>
              </div>

              <!-- General text input -->
              <input
                v-else
                placeholder="Type patient's response..."
                v-model="store.reassessAnswers[q.question_id]"
              />
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
          :disabled="
            store.isLoading || (store.reassessQuestions?.length > 0 && !allQuestionsAnswered)
          "
        >
          {{
            store.reassessment
              ? '✦ Re-run Reassessment Analysis'
              : '✦ Generate Reassessment Analysis'
          }}
        </button>
        <button v-if="store.reassessment" class="btn col-auto" @click="subTab = 'results'">
          Go to Results →
        </button>
      </div>

      <div
        v-if="store.reassessQuestions?.length > 0 && !allQuestionsAnswered"
        class="text-center note text-negative q-mt-sm"
      >
        Please answer all follow-up questions before running analysis.
      </div>
    </div>

    <!-- LOADING STATE -->
    <div class="card tight text-center q-pa-lg" v-if="store.isLoading" id="raLoading">
      <div class="spinner"></div>
      <div class="gen-status">{{ store.loadingMessage }}</div>
    </div>

    <!-- ═══════════════════════════════════════════════════════
         REASSESSMENT OUTPUT — RESULTS TAB
         ═══════════════════════════════════════════════════════ -->
    <div
      v-if="subTab === 'results' && store.reassessment && !store.isLoading"
      id="raOutput"
      class="q-col-gutter-y-md"
    >
      <!-- ① OVERALL BANNER -->
      <!-- Old format: trajectory from reassessment_comparison -->
      <div v-if="comparisonData.overall?.trajectory" :class="['review-banner', bannerClass]">
        <span class="ic">{{ bannerIcon }}</span>
        <div>
          <span class="text-weight-bold text-h6 block">
            Overall Trajectory: {{ cap(comparisonData.overall?.trajectory || 'unknown') }}
          </span>
          <p style="margin: 4px 0 0 0; font-weight: 400; line-height: 1.4">
            {{ comparisonData.overall?.summary || patientSummaryText }}
          </p>
        </div>
      </div>
      <!-- New format: phenotype summary banner -->
      <div v-else class="review-banner pending">
        <span class="ic ra-banner-ic">📋</span>
        <div>
          <span class="text-weight-bold text-h6 block">Current Phenotype Assessment</span>
          <p style="margin: 4px 0 0 0; font-weight: 400; line-height: 1.5; font-size: 13px">
            {{
              currentPhenotype?.phenotype_summary_for_doctor ||
              patientSummaryText ||
              'Reassessment complete.'
            }}
          </p>
        </div>
      </div>

      <!-- ② DIAGNOSIS RE-EXAMINE WARNING -->
      <div v-if="isDiagnosisRecheckTriggered" class="pblock">
        <div class="redflag">
          <span class="ic">!</span>
          <div class="bd">
            <b>⚠ Action Required: Recheck or Re-examine Diagnosis</b>
            <p style="margin-top: 4px; font-size: 13px">
              One or more components have triggered a diagnosis recheck. Please review clinical
              indicators or schedule closeup dermoscopy as needed.
            </p>
          </div>
        </div>
      </div>

      <!-- ③ IMAGE QUALITY CARD (NEW) -->
      <div class="pblock" v-if="currentPhenotype?.image_quality">
        <h3>
          <span class="bar" style="background: var(--slate)"></span>Image quality &amp; capture
          notes
        </h3>
        <div class="iq-card">
          <div class="iq-modes">
            <div
              v-for="(qual, mode) in currentPhenotype.image_quality.mode_quality"
              :key="mode"
              :class="['iq-badge', getModeQualityClass(qual)]"
            >
              <span class="iq-mode-name">{{ getModeShortLabel(mode) }}</span>
              <span class="iq-mode-qual">{{ qual }}</span>
            </div>
          </div>
          <ul class="iq-limits" v-if="currentPhenotype.image_quality.limitations?.length">
            <li v-for="(lim, li) in currentPhenotype.image_quality.limitations" :key="li">
              {{ lim }}
            </li>
          </ul>
        </div>
      </div>

      <!-- ③.5 REGION REVIEW (NEW) -->
      <div class="pblock" v-if="regionReviewEntries.length">
        <h3><span class="bar" style="background: var(--slate)"></span>Region-by-region review</h3>
        <div class="region-review-grid">
          <div
            v-for="rr in regionReviewEntries"
            :key="rr.key"
            :class="['rr-cell', getRRVisibilityClass(rr.visibility)]"
          >
            <div class="rr-head">
              <span class="rr-name">{{ formatOptionLabel(rr.key) }}</span>
              <span :class="['rr-vis', getRRVisibilityClass(rr.visibility)]">{{ rr.visibility }}</span>
            </div>
            <div class="rr-tags" v-if="rr.positive_tags?.length">
              <span v-for="tag in rr.positive_tags" :key="tag" class="rr-tag">{{ formatOptionLabel(tag) }}</span>
            </div>
            <p class="rr-note" v-if="rr.note">{{ rr.note }}</p>
          </div>
        </div>
      </div>

      <!-- ④ BURDEN METRICS SCORECARD (NEW) -->
      <div class="pblock" v-if="metricsArray.length">
        <h3><span class="bar"></span>Pigmentation burden metrics</h3>
        <div class="metrics-grid">
          <div v-for="m in metricsArray" :key="m.key" class="metric-card">
            <div class="metric-head">
              <span class="metric-name">{{ m.label }}</span>
              <span :class="['sev-badge', getSeverityClass(m.severity_label)]">
                {{ m.severity_label || '—' }}
              </span>
            </div>
            <div class="score-bar-wrap">
              <div class="score-bar-track">
                <div
                  class="score-bar-fill"
                  :style="{ width: (m.score_100 || 0) + '%', background: getScoreBarColor(m.score_100) }"
                ></div>
              </div>
              <span class="score-num">{{ m.score_100 ?? '—' }}</span>
            </div>
            <div class="metric-groups" v-if="m.linked_group_ids?.length">
              <span v-for="gid in m.linked_group_ids" :key="gid" class="group-chip">{{ gid }}</span>
            </div>
            <p class="metric-summary" v-if="m.summary">{{ m.summary }}</p>
            <div class="metric-conf" v-if="m.confidence_100">Confidence: {{ m.confidence_100 }}%</div>
          </div>
        </div>
      </div>

      <!-- ⑤ PIGMENTATION PHENOTYPES (NEW) -->
      <div class="pblock" v-if="currentPhenotype?.pigmentation_phenotypes?.length">
        <h3><span class="bar" style="background: var(--primary)"></span>Pigmentation phenotypes</h3>
        <div class="pheno-list">
          <div v-for="pg in currentPhenotype.pigmentation_phenotypes" :key="pg.group_id" class="pheno-card">
            <div class="pheno-head">
              <div class="pheno-id-row">
                <span class="group-id-badge">{{ pg.group_id }}</span>
                <span class="pheno-type">{{ formatOptionLabel(pg.phenotype_type) }}</span>
                <span class="presence-dot" :class="pg.presence_status === 'present' ? 'dot-present' : 'dot-absent'"></span>
              </div>
              <span class="conf-pill">{{ pg.confidence_100 }}% conf.</span>
            </div>
            <p class="pheno-location">📍 {{ pg.clinical_location_text }}</p>
            <div class="pheno-tags">
              <span class="ptag">{{ formatOptionLabel(pg.distribution) }}</span>
              <span class="ptag">{{ formatOptionLabel(pg.elevation) }}</span>
              <span class="ptag" v-if="pg.count_band && pg.count_band !== 'none'">{{ formatOptionLabel(pg.count_band) }}</span>
              <span class="ptag ptag-side">{{ formatOptionLabel(pg.patient_side) }}</span>
            </div>
            <div class="pheno-colour" v-if="pg.colour_description">
              <span class="pheno-colour-dot"></span>{{ pg.colour_description }}
            </div>
            <div class="mode-ev" v-if="pg.mode_evidence">
              <div class="mode-ev-row">
                <span class="mode-ev-label">Primary:</span>
                <span class="mode-chip mode-primary">{{ getModeShortLabel(pg.mode_evidence.morphology_primary) }}</span>
                <span v-for="sm in (pg.mode_evidence.morphology_supporting || [])" :key="sm" class="mode-chip">{{ getModeShortLabel(sm) }}</span>
              </div>
              <div class="mode-ev-depth" v-if="pg.mode_evidence.depth_inference">
                <span class="dep-label">Depth:</span>
                {{ formatOptionLabel(pg.mode_evidence.depth_inference) }}
                <span class="dep-conf" v-if="pg.mode_evidence.depth_confidence_100">({{ pg.mode_evidence.depth_confidence_100 }}%)</span>
                · UV: {{ pg.mode_evidence.woods_uv_accentuation }}
                · Sub: {{ pg.mode_evidence.subsurface_persistence }}
              </div>
              <p class="mode-ev-summary" v-if="pg.mode_evidence.summary">{{ pg.mode_evidence.summary }}</p>
            </div>
            <div class="region-chips" v-if="pg.anatomical_regions?.length">
              <span v-for="r in pg.anatomical_regions" :key="r" class="region-chip">{{ formatOptionLabel(r) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ⑥ CONTRIBUTORS & MODIFIERS (NEW) -->
      <div class="pblock" v-if="currentPhenotype?.pigmentation_contributors_and_modifiers?.length">
        <h3><span class="bar" style="background: var(--amber)"></span>Contributors &amp; modifiers</h3>
        <div class="mod-list">
          <div v-for="pm in currentPhenotype.pigmentation_contributors_and_modifiers" :key="pm.group_id" class="mod-card">
            <div class="mod-head">
              <span class="group-id-badge mod-id">{{ pm.group_id }}</span>
              <span class="mod-type">{{ formatOptionLabel(pm.modifier_type) }}</span>
              <span :class="['mod-role-badge', getModifierRoleClass(pm.treatment_modifier_role)]">
                {{ formatOptionLabel(pm.treatment_modifier_role) }}
              </span>
            </div>
            <p class="pheno-location">📍 {{ pm.clinical_location_text }}</p>
            <div class="mod-finding" v-if="pm.visible_finding"><b>Visible finding:</b> {{ pm.visible_finding }}</div>
            <div class="mod-relevance" v-if="pm.pigmentation_relevance">{{ pm.pigmentation_relevance }}</div>
            <div class="mode-ev" v-if="pm.mode_evidence">
              <div class="mode-ev-row">
                <span class="mode-ev-label">Primary:</span>
                <span class="mode-chip mode-primary">{{ getModeShortLabel(pm.mode_evidence.primary) }}</span>
                <span v-for="sm in (pm.mode_evidence.supporting || [])" :key="sm" class="mode-chip">{{ getModeShortLabel(sm) }}</span>
              </div>
              <p class="mode-ev-summary" v-if="pm.mode_evidence.summary">{{ pm.mode_evidence.summary }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ⑦ SAFETY & IMAGE LIMITATIONS (NEW) -->
      <div class="pblock" v-if="currentPhenotype?.safety_and_image_limitations?.length">
        <h3><span class="bar" style="background: var(--erythema)"></span>Safety &amp; image limitations</h3>
        <div class="safety-list">
          <div v-for="sf in currentPhenotype.safety_and_image_limitations" :key="sf.finding_id" class="safety-item">
            <div class="safety-head">
              <span class="safety-id">{{ sf.finding_id }}</span>
              <span :class="['safety-type-badge', sf.type === 'image_quality_limitation' ? 'stb-iq' : 'stb-exc']">
                {{ formatOptionLabel(sf.type) }}
              </span>
              <span class="safety-scope" v-if="sf.treatment_scope">Scope: {{ sf.treatment_scope }}</span>
            </div>
            <p class="safety-location">📍 {{ sf.clinical_location_text }}</p>
            <p class="safety-reason">{{ sf.reason }}</p>
            <div class="safety-groups" v-if="sf.linked_group_ids?.length">
              <span v-for="gid in sf.linked_group_ids" :key="gid" class="group-chip">{{ gid }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ⑧ BACKGROUND PROFILE (NEW) -->
      <div class="pblock" v-if="currentPhenotype?.background_profile">
        <h3><span class="bar" style="background: #8b5cf6"></span>Background profile</h3>
        <div class="bg-profile-grid">
          <div class="bg-profile-card">
            <div class="bpcard-label">Fitzpatrick Type</div>
            <div class="bpcard-value">{{ formatOptionLabel(currentPhenotype.background_profile.estimated_fitzpatrick?.type) }}</div>
            <div class="bpcard-conf" v-if="currentPhenotype.background_profile.estimated_fitzpatrick?.confidence_100">
              {{ currentPhenotype.background_profile.estimated_fitzpatrick.confidence_100 }}% conf.
            </div>
          </div>
          <div class="bg-profile-card" v-if="currentPhenotype.background_profile.composition">
            <div class="bpcard-label">Composition</div>
            <div class="comp-bars">
              <div class="comp-bar-row">
                <span class="comp-bar-name">Melanin</span>
                <div class="comp-bar-track">
                  <div class="comp-bar-fill" style="background: #7c3aed" :style="{ width: (currentPhenotype.background_profile.composition.melanin_percent || 0) + '%' }"></div>
                </div>
                <span class="comp-bar-pct">{{ currentPhenotype.background_profile.composition.melanin_percent }}%</span>
              </div>
              <div class="comp-bar-row">
                <span class="comp-bar-name">Vascular</span>
                <div class="comp-bar-track">
                  <div class="comp-bar-fill" style="background: #ef4444" :style="{ width: (currentPhenotype.background_profile.composition.vascular_percent || 0) + '%' }"></div>
                </div>
                <span class="comp-bar-pct">{{ currentPhenotype.background_profile.composition.vascular_percent }}%</span>
              </div>
            </div>
            <div class="bpcard-conf" v-if="currentPhenotype.background_profile.composition.confidence_100">
              {{ currentPhenotype.background_profile.composition.confidence_100 }}% conf.
            </div>
          </div>
          <div class="bg-profile-card" v-if="currentPhenotype.background_profile.depth_call">
            <div class="bpcard-label">Depth Call</div>
            <div class="bpcard-value bpcard-value-sm">{{ formatOptionLabel(currentPhenotype.background_profile.depth_call.type) }}</div>
            <div class="bpcard-conf" v-if="currentPhenotype.background_profile.depth_call.confidence_100">
              {{ currentPhenotype.background_profile.depth_call.confidence_100 }}% conf.
            </div>
            <p class="depth-caveat" v-if="currentPhenotype.background_profile.depth_call.caveat">{{ currentPhenotype.background_profile.depth_call.caveat }}</p>
          </div>
        </div>
      </div>

      <!-- ⑨ GOALS TRACKING SCORECARD (kept — old format) -->
      <div class="pblock" v-if="comparisonData.global_metrics?.length">
        <h3><span class="bar"></span>Goal-by-goal scorecard</h3>
        <div class="goal-tbl">
          <div
            class="goal-row"
            style="grid-template-columns: 1.5fr 1fr 1fr 1fr 1.2fr"
            v-for="(g, idx) in comparisonData.global_metrics"
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
              <div>
                <b>{{ g.current || '—' }}</b>
              </div>
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
              <div class="gsub q-mt-xs" v-if="g.comment" style="font-size: 11px">
                {{ g.comment }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ⑩ COMPONENT OUTCOMES DETAIL (kept — old format) -->
      <div class="pblock" v-if="comparisonData.component_outcomes?.length">
        <h3><span class="bar"></span>Component clinical outcomes</h3>
        <div class="goal-tbl">
          <div class="goal-hdr" style="grid-template-columns: 1fr 1.2fr 1fr 1.2fr">
            <div>Component (ID)</div>
            <div>Working Diagnosis</div>
            <div>Trajectory</div>
            <div>Status &amp; Notes</div>
          </div>
          <div
            class="goal-row"
            style="grid-template-columns: 1fr 1.2fr 1fr 1.2fr"
            v-for="(comp, cIdx) in comparisonData.component_outcomes"
            :key="cIdx"
          >
            <div>
              <div class="gh">Component (ID)</div>
              <div class="text-weight-bold">{{ cleanLabel(comp.diagnostic_component_id) }}</div>
            </div>
            <div>
              <div class="gh">Working Diagnosis</div>
              <div style="font-size: 11.5px; color: #37474f">{{ cleanLabel(comp.diagnosis) }}</div>
            </div>
            <div>
              <div class="gh">Trajectory</div>
              <span :class="['goal-status', getStatusClass(comp.trajectory)]">
                {{ getStatusLabel(comp.trajectory) }}
              </span>
            </div>
            <div>
              <div class="gh">Status &amp; Notes</div>
              <span
                :class="['goal-status', getStatusClass(comp.target_status)]"
                style="font-size: 10px"
              >
                {{ getStatusLabel(comp.target_status) }}
              </span>
              <div class="gsub q-mt-xs" v-if="comp.comment" style="font-size: 11px">
                {{ comp.comment }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ⑩.2 NEW OR CHANGED MORPHOLOGY GROUPS (old format) -->
      <div class="pblock" v-if="comparisonData.new_or_changed_morphology_groups?.length">
        <h3><span class="bar" style="background: var(--amber)"></span>New or Changed Morphology</h3>
        <div
          class="card q-pa-md bg-amber-0 border-amber q-mb-md"
          style="border: 1px solid var(--amber); background-color: #fffbeb"
        >
          <div
            v-for="(mg, mIdx) in comparisonData.new_or_changed_morphology_groups"
            :key="mIdx"
            class="q-mb-sm"
          >
            <div class="text-weight-bold text-subtitle2 text-amber-9 uppercase">
              ⚠️ Group {{ mg.group_id }}: {{ cleanLabel(mg.change) }}
            </div>
            <div class="text-body2 text-grey-9 q-mt-xs" style="line-height: 1.4">
              {{ mg.clinical_implication }}
            </div>
          </div>
        </div>
      </div>

      <!-- ⑪ PREVIOUS BLOCK CLOSURE & CONTINUITY -->
      <div
        class="row q-col-gutter-md q-mt-md"
        v-if="
          store.reassessment.previous_block_closure ||
          store.reassessment.continuity_with_master_roadmap
        "
      >
        <div class="col-xs-12 col-md-6" v-if="store.reassessment.previous_block_closure">
          <div class="pblock" style="height: 100%">
            <h3><span class="bar" style="background: var(--good)"></span>Previous Block Closure</h3>
            <div
              class="card q-pa-md bg-teal-0"
              style="border: 1px solid var(--good); height: calc(100% - 32px)"
            >
              <div class="text-subtitle2 text-weight-bold text-teal-10 uppercase q-mb-xs">
                {{
                  formatOptionLabel(store.reassessment.previous_block_closure.block_id)
                }}
                Completed
              </div>
              <div class="text-caption text-grey-8 q-mb-sm">
                <strong>Completed Sessions:</strong>
                {{ store.reassessment.previous_block_closure.completed_sessions }}
              </div>
              <ul
                v-if="store.reassessment.previous_block_closure.deviations_from_plan?.length"
                class="q-pl-md text-caption text-grey-9 q-mb-sm"
                style="line-height: 1.4"
              >
                <li
                  v-for="(dev, dIdx) in store.reassessment.previous_block_closure
                    .deviations_from_plan"
                  :key="dIdx"
                >
                  {{ dev }}
                </li>
              </ul>
              <p class="text-body2 text-grey-9 q-mb-none" style="line-height: 1.5">
                {{ store.reassessment.previous_block_closure.block_outcome_summary }}
              </p>
            </div>
          </div>
        </div>

        <div class="col-xs-12 col-md-6" v-if="store.reassessment.continuity_with_master_roadmap">
          <div class="pblock" style="height: 100%">
            <h3><span class="bar" style="background: var(--primary)"></span>Roadmap Continuity</h3>
            <div
              class="card q-pa-md"
              style="
                border: 1px solid var(--primary);
                height: calc(100% - 32px);
                background-color: #eff6ff;
                border-color: #bfdbfe;
              "
            >
              <div class="text-subtitle2 text-weight-bold text-primary uppercase q-mb-xs">
                Action:
                {{ formatOptionLabel(store.reassessment.continuity_with_master_roadmap.action) }}
              </div>
              <p class="text-body2 text-grey-9 q-mb-sm" style="line-height: 1.5; font-size: 13px">
                {{ store.reassessment.continuity_with_master_roadmap.detail }}
              </p>
              <div
                class="text-caption text-grey-7"
                style="border-top: 1px dashed #dbeafe; padding-top: 6px; font-style: italic"
              >
                <strong>Changes Explained:</strong>
                {{ store.reassessment.continuity_with_master_roadmap.changes_explained }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ⑫ COMPONENT DECISIONS -->
      <div class="pblock q-mt-md" v-if="store.reassessment.component_decisions?.length">
        <h3><span class="bar"></span>Component adjustments &amp; decisions</h3>
        <div class="row q-col-gutter-md">
          <div
            v-for="(cd, cdIdx) in store.reassessment.component_decisions"
            :key="cdIdx"
            class="col-md-4 col-sm-6 col-xs-12"
          >
            <div
              class="vbox"
              style="
                height: 100%;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 16px;
                background-color: #fafafa;
              "
            >
              <div>
                <div
                  class="flex items-center justify-between q-mb-xs"
                  style="display: flex; align-items: center; justify-content: space-between"
                >
                  <span class="text-weight-bold text-subtitle2" style="color: #475569">{{
                    cleanLabel(cd.diagnostic_component_id)
                  }}</span>
                  <span :class="['goal-status', getModalityStatusClass(cd.decision)]">
                    {{ cleanLabel(cd.decision) }}
                  </span>
                </div>
                <p style="font-size: 12px; color: #64748b; line-height: 1.4; margin-bottom: 8px">
                  {{ cd.reason }}
                </p>
              </div>
              <div style="border-top: 1px dashed #e2e8f0; padding-top: 8px; margin-top: 8px">
                <div style="font-size: 11px; font-weight: bold; color: #475569">
                  Preferred: {{ cleanLabel(cd.updated_preferred_modality) }}
                </div>
                <div style="font-size: 11px; color: #64748b" v-if="cd.updated_target">
                  Target: {{ cd.updated_target }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ⑫.5 CLASSIFICATION REQUIRED ITEMS (NEW) -->
      <div class="pblock" v-if="store.reassessment.classification_required_items?.length">
        <h3><span class="bar" style="background: var(--erythema)"></span>Items requiring doctor classification</h3>
        <div class="redflag q-mb-sm" style="margin-bottom: 12px">
          <span class="ic" style="font-size: 13px">!</span>
          <div class="bd">
            <b>Doctor classification required before treatment can proceed.</b>
            <p style="margin-top: 4px; font-size: 12px; line-height: 1.4">
              The following findings were identified during reassessment and require your clinical review before the next block can be activated.
            </p>
          </div>
        </div>
        <div class="clf-list">
          <div
            v-for="(ci, ciIdx) in store.reassessment.classification_required_items"
            :key="ciIdx"
            class="clf-item"
          >
            <div class="clf-head">
              <span class="safety-id">{{ ci.finding_id || ('Item ' + (ciIdx + 1)) }}</span>
              <span class="clf-type-badge">{{ formatOptionLabel(ci.phenotype_type || ci.type) }}</span>
              <span class="clf-urgency" v-if="ci.urgency">{{ formatOptionLabel(ci.urgency) }}</span>
            </div>
            <p class="safety-location" v-if="ci.clinical_location_text">📍 {{ ci.clinical_location_text }}</p>
            <p class="safety-reason" v-if="ci.reason">{{ ci.reason }}</p>
            <div class="clf-action" v-if="ci.classification_trigger || ci.recommended_action">
              <b>Action:</b> {{ ci.classification_trigger || ci.recommended_action }}
            </div>
          </div>
        </div>
      </div>

      <!-- ⑫.7 UPDATED TREATMENT BLOCK (NEW) -->
      <div class="pblock" v-if="store.reassessment.current_treatment_block?.sessions?.length">
        <h3><span class="bar" style="background: var(--good)"></span>Updated treatment block</h3>
        <div class="tx-block-card">
          <div class="tx-block-meta">
            <div class="tx-meta-item" v-if="store.reassessment.current_treatment_block.block_id">
              <span class="tx-meta-label">Block</span>
              <span class="tx-meta-val">{{ formatOptionLabel(store.reassessment.current_treatment_block.block_id) }}</span>
            </div>
            <div class="tx-meta-item" v-if="store.reassessment.current_treatment_block.block_type">
              <span class="tx-meta-label">Type</span>
              <span class="tx-meta-val">{{ formatOptionLabel(store.reassessment.current_treatment_block.block_type) }}</span>
            </div>
            <div class="tx-meta-item" v-if="store.reassessment.current_treatment_block.total_sessions">
              <span class="tx-meta-label">Sessions</span>
              <span class="tx-meta-val">{{ store.reassessment.current_treatment_block.total_sessions }}</span>
            </div>
            <div class="tx-meta-item" v-if="store.reassessment.current_treatment_block.interval_weeks">
              <span class="tx-meta-label">Interval</span>
              <span class="tx-meta-val">{{ store.reassessment.current_treatment_block.interval_weeks }}w</span>
            </div>
          </div>
          <!-- Sessions table -->
          <div class="tx-sessions">
            <div class="tx-session-hdr">
              <span>#</span>
              <span>Modalities</span>
              <span>Focus</span>
              <span>Status</span>
            </div>
            <div
              v-for="sess in store.reassessment.current_treatment_block.sessions"
              :key="sess.session_number || sess.id"
              class="tx-session-row"
            >
              <span class="tx-sn">S{{ sess.session_number || sess.id }}</span>
              <div class="tx-modalities">
                <span
                  v-for="mod in (sess.modalities || sess.primary_modalities || [])"
                  :key="typeof mod === 'string' ? mod : mod.modality"
                  class="tx-mod-chip"
                >
                  {{ typeof mod === 'string' ? formatOptionLabel(mod) : formatOptionLabel(mod.modality) }}
                </span>
              </div>
              <span class="tx-focus" style="font-size: 11px; color: var(--slate)">
                {{ sess.primary_focus || sess.focus || '' }}
              </span>
              <span :class="['tx-status-badge', getTxStatusClass(sess.status)]">
                {{ formatOptionLabel(sess.status || 'pending') }}
              </span>
            </div>
          </div>
          <!-- Block rational -->
          <p class="tx-rationale" v-if="store.reassessment.current_treatment_block.rationale">
            {{ store.reassessment.current_treatment_block.rationale }}
          </p>
        </div>
      </div>

      <!-- ⑬ CLINICAL RECOMMENDATIONS -->
      <div class="pblock" v-if="recommendationAction">
        <h3><span class="bar"></span>Clinician recommendation</h3>
        <div class="card bg-teal-0 q-pa-md" style="border: 1px solid var(--good)">
          <div
            class="row items-center justify-between"
            style="display: flex; align-items: center; justify-content: space-between"
          >
            <div>
              <span class="text-subtitle2 text-grey-7 uppercase block">Recommended Action</span>
              <span class="text-h6 text-weight-bold text-teal-10">
                {{ cap(recommendationAction) }}
              </span>
            </div>
            <div>
              <span :class="['goal-status', getRecommendationClass(recommendationAction)]">
                {{ recommendationAction }}
              </span>
            </div>
          </div>
          <p class="q-mt-sm text-body2 text-grey-9" v-if="recommendationDetail">
            {{ recommendationDetail }}
          </p>
        </div>
      </div>

      <!-- ⑭ CLINICAL SUMMARY -->
      <div class="pblock" v-if="currentPhenotype?.phenotype_summary_for_doctor || patientSummaryText">
        <h3><span class="bar"></span>Clinical summary</h3>
        <div class="summary-box">{{ currentPhenotype?.phenotype_summary_for_doctor || patientSummaryText }}</div>
      </div>

      <!-- ⑮ UNCERTAINTIES -->
      <div class="pblock" v-if="store.reassessment.uncertainties?.length">
        <h3>
          <span class="bar" style="background: var(--amber)"></span>Clinical uncertainties &amp;
          Gaps
        </h3>
        <ul class="ulist">
          <li v-for="(u, idx) in store.reassessment.uncertainties" :key="idx">
            {{ u }}
          </li>
        </ul>
      </div>

      <!-- DISCLAIMER -->
      <div class="text-caption text-grey-7 q-my-md italic">
        * This is an AI-assisted clinical reassessment. All final changes to the block plan require
        doctor clearance.
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
        <button class="btn" @click="resetReassess">↺ Reset &amp; Reassess again</button>
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
const comparisonData = computed(() => {
  if (!store.reassessment) return {}
  return store.reassessment.reassessment_comparison || store.reassessment
})

// Shortcut to the new current_phenotype data
const currentPhenotype = computed(() => store.reassessment?.current_phenotype || null)

// Convert region_review object to sorted array for rendering
const regionReviewEntries = computed(() => {
  const rr = currentPhenotype.value?.region_review
  if (!rr || typeof rr !== 'object') return []
  return Object.entries(rr)
    .filter(([, v]) => v && typeof v === 'object')
    .map(([key, val]) => ({
      key,
      visibility: val.visibility,
      positive_tags: val.positive_tags || [],
      note: val.note || '',
    }))
})

// Convert metrics object to a sorted array for rendering
const METRIC_LABELS = {
  global_background_melanin_load_index: 'Background Melanin Load',
  global_background_erythema_load_index: 'Background Erythema Load',
  active_inflammatory_lesion_burden_index: 'Active Inflammatory Burden',
  flat_focal_pigmented_lesion_burden_index: 'Focal Pigmented Lesions',
  raised_pigmented_lesion_burden_index: 'Raised Pigmented Lesions',
  structural_periocular_shadow_burden_index: 'Periocular Shadow Burden',
}
const metricsArray = computed(() => {
  const m = currentPhenotype.value?.metrics
  if (!m || typeof m !== 'object') return []
  return Object.entries(m)
    .filter(([, v]) => v && typeof v === 'object')
    .map(([key, val]) => ({
      key,
      label: METRIC_LABELS[key] || formatOptionLabel(key),
      score_100: val.score_100,
      severity_label: val.severity_label,
      summary: val.summary,
      confidence_100: val.confidence_100,
      linked_group_ids: val.linked_group_ids || [],
      presence_status: val.presence_status,
    }))
    .sort((a, b) => (b.score_100 || 0) - (a.score_100 || 0))
})

const isDiagnosisRecheckTriggered = computed(() => {
  const decisions = store.reassessment?.component_decisions || []
  return decisions.some((d) => d.diagnosis_recheck_triggered === true)
})

const recommendationAction = computed(() => {
  if (store.reassessment?.recommendation?.action) {
    return store.reassessment.recommendation.action
  }
  return store.reassessment?.continuity_with_master_roadmap?.action || ''
})

const recommendationDetail = computed(() => {
  if (store.reassessment?.recommendation?.detail) {
    return store.reassessment.recommendation.detail
  }
  return store.reassessment?.continuity_with_master_roadmap?.detail || ''
})

const patientSummaryText = computed(() => {
  return (
    store.reassessment?.patient_summary ||
    store.reassessment?.reassessment_comparison?.overall?.summary ||
    ''
  )
})

const cleanLabel = (val) => {
  if (!val) return ''
  return String(val)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

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
    current: '',
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
  { immediate: true },
)

const modeLabels = [
  { value: 'white', label: 'White Light' },
  { value: 'surface_polarized', label: 'Surface Polarised' },
  { value: 'subsurface_polarized', label: 'Sub-surface Polarised' },
  { value: 'red', label: 'Red Light (Vascular)' },
  { value: 'woods_uv', label: "Wood's UV (Epidermal)" },
]

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
        file: f,
      })
    } catch (e) {
      console.error(e)
    }
  }
  raInput.value.value = ''
}

const removeRaImage = async (idx) => {
  const img = store.reassessImages[idx]
  if (img && img.id && store.id) {
    try {
      await api.delete(`/assessments/${store.id}/images/${img.id}/pigmentation-post`)
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
  const activeGoals = store.goals.filter((g) => g.metric && String(g.metric).trim() !== '')
  if (activeGoals.length === 0) {
    validationError.value = 'Add at least one goal (with a metric) to reassess.'
    return
  }

  const hasCurrent =
    activeGoals.some((g) => g.current && String(g.current).trim() !== '') ||
    store.reassessImages.length > 0
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
    const response = await api.get(`download-pigmentation-report/reassessment/${store.id}`, {
      responseType: 'blob',
    })

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

const bannerClass = computed(() => {
  if (!store.reassessment) return 'pending'
  const traj = String(comparisonData.value.overall?.trajectory || '').toLowerCase()
  if (traj === 'improving') return 'approved'
  if (traj === 'worsening') return 'rejected'
  if (traj === 'mixed') return 'pending'
  return 'pending'
})

const bannerIcon = computed(() => {
  if (!store.reassessment) return '•'
  const traj = String(comparisonData.value.overall?.trajectory || '').toLowerCase()
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
  if (
    v.includes('reduce') ||
    v.includes('cautiously') ||
    v.includes('strengthen') ||
    v.includes('barrier')
  )
    return 'gs-plateau'
  if (v.includes('defer') || v.includes('switch') || v.includes('doctor')) return 'gs-worse'
  return 'gs-plateau'
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

// ─── New helpers for current_phenotype UI ─────────────────────────────────────

const getModeShortLabel = (mode) => {
  const MAP = {
    white: 'WHITE',
    surface_polarized: 'SURF.POL',
    subsurface_polarized: 'SUB.POL',
    red: 'RED',
    woods_uv: "WOOD'S UV",
  }
  return MAP[mode] || String(mode || '').toUpperCase().replace(/_/g, ' ')
}

const getModeQualityClass = (qual) => {
  const q = String(qual || '').toLowerCase()
  if (q === 'usable') return 'iq-usable'
  if (q === 'limited') return 'iq-limited'
  if (q === 'unusable') return 'iq-unusable'
  return 'iq-limited'
}

const getSeverityClass = (sev) => {
  const s = String(sev || '').toLowerCase()
  if (s === 'minimal') return 'sev-minimal'
  if (s === 'mild') return 'sev-mild'
  if (s === 'moderate') return 'sev-moderate'
  if (s === 'severe') return 'sev-severe'
  return 'sev-minimal'
}

const getScoreBarColor = (score) => {
  const s = Number(score || 0)
  if (s <= 20) return '#22c55e'
  if (s <= 40) return '#84cc16'
  if (s <= 60) return '#f59e0b'
  if (s <= 75) return '#f97316'
  return '#ef4444'
}

const getModifierRoleClass = (role) => {
  const r = String(role || '').toLowerCase()
  if (r === 'score_exclusion') return 'mr-exclusion'
  if (r === 'expectation_modifier') return 'mr-expectation'
  if (r === 'supportive_only') return 'mr-supportive'
  if (r === 'local_hold_candidate') return 'mr-hold'
  return 'mr-supportive'
}

const getRRVisibilityClass = (vis) => {
  const v = String(vis || '').toLowerCase()
  if (v === 'usable') return 'rr-usable'
  if (v === 'limited') return 'rr-limited'
  if (v === 'not_captured' || v === 'unusable') return 'rr-absent'
  return 'rr-limited'
}

const getTxStatusClass = (status) => {
  const s = String(status || '').toLowerCase()
  if (s === 'completed') return 'txs-done'
  if (s === 'in_progress' || s === 'active') return 'txs-active'
  if (s === 'pending') return 'txs-pending'
  if (s === 'skipped' || s === 'cancelled') return 'txs-skip'
  return 'txs-pending'
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

/* Banner icon fix for emoji */
.ra-banner-ic {
  font-size: 22px;
  line-height: 1;
}

/* ── Image Quality Card ─────────────────────────────── */
.iq-card {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 16px;
}
.iq-modes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}
.iq-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1.5px solid transparent;
  min-width: 80px;
}
.iq-mode-name {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  opacity: 0.7;
}
.iq-mode-qual {
  font-size: 11px;
  font-weight: 600;
  text-transform: capitalize;
}
.iq-usable  { background: #f0fdf4; border-color: #86efac; color: #166534; }
.iq-limited { background: #fefce8; border-color: #fde047; color: #854d0e; }
.iq-unusable{ background: #fef2f2; border-color: #fca5a5; color: #991b1b; }
.iq-limits {
  margin: 0;
  padding: 0 0 0 18px;
  font-size: 12px;
  color: var(--slate);
  line-height: 1.7;
}

/* ── Burden Metrics Grid ────────────────────────────── */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}
.metric-card {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 14px 16px;
}
.metric-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  gap: 8px;
}
.metric-name {
  font-size: 12px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1.3;
}
.sev-badge {
  font-size: 9px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  flex-shrink: 0;
}
.sev-minimal  { background: #f0fdf4; color: #166534; }
.sev-mild     { background: #eff6ff; color: #1d4ed8; }
.sev-moderate { background: #fefce8; color: #854d0e; }
.sev-severe   { background: #fef2f2; color: #991b1b; }
.score-bar-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.score-bar-track {
  flex: 1;
  height: 6px;
  background: var(--line);
  border-radius: 99px;
  overflow: hidden;
}
.score-bar-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.4s ease;
}
.score-num {
  font-size: 12px;
  font-weight: 700;
  color: var(--ink);
  width: 24px;
  text-align: right;
}
.metric-groups {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 6px;
}
.group-chip {
  font-size: 9px;
  font-weight: 700;
  padding: 1px 7px;
  background: #ede9fe;
  color: #5b21b6;
  border-radius: 20px;
  letter-spacing: 0.03em;
}
.metric-summary {
  font-size: 11px;
  color: var(--slate);
  line-height: 1.5;
  margin: 4px 0 4px;
}
.metric-conf {
  font-size: 10px;
  color: var(--slate);
  opacity: 0.7;
}

/* ── Phenotypes List ────────────────────────────────── */
.pheno-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.pheno-card {
  background: var(--paper);
  border: 1px solid var(--line);
  border-left: 3px solid var(--primary);
  border-radius: 10px;
  padding: 14px 16px;
}
.pheno-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  gap: 8px;
}
.pheno-id-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.group-id-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  background: #ede9fe;
  color: #5b21b6;
  border-radius: 20px;
  letter-spacing: 0.04em;
}
.pheno-type {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
}
.presence-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot-present { background: #22c55e; }
.dot-absent  { background: #d1d5db; }
.conf-pill {
  font-size: 10px;
  color: var(--slate);
  background: var(--surface);
  padding: 2px 8px;
  border-radius: 20px;
  white-space: nowrap;
  flex-shrink: 0;
}
.pheno-location {
  font-size: 12px;
  color: var(--slate);
  line-height: 1.4;
  margin: 0 0 8px;
}
.pheno-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}
.ptag {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 9px;
  background: #f1f5f9;
  color: #475569;
  border-radius: 20px;
  text-transform: capitalize;
}
.ptag-side { background: #eff6ff; color: #1d4ed8; }
.pheno-colour {
  font-size: 11.5px;
  color: var(--slate);
  margin-bottom: 8px;
  display: flex;
  align-items: flex-start;
  gap: 6px;
}
.pheno-colour-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #b45309;
  flex-shrink: 0;
  margin-top: 3px;
}
.mode-ev {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 12px;
  margin: 8px 0;
}
.mode-ev-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 6px;
}
.mode-ev-label {
  font-size: 10px;
  font-weight: 700;
  color: var(--slate);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.mode-chip {
  font-size: 9px;
  font-weight: 700;
  padding: 2px 7px;
  background: #e0f2fe;
  color: #0369a1;
  border-radius: 20px;
  letter-spacing: 0.03em;
}
.mode-chip.mode-primary { background: #0369a1; color: #fff; }
.mode-ev-depth {
  font-size: 11px;
  color: var(--slate);
  margin-bottom: 4px;
}
.dep-label { font-weight: 700; margin-right: 4px; }
.dep-conf  { color: var(--primary); font-weight: 600; }
.mode-ev-summary {
  font-size: 11px;
  color: #475569;
  line-height: 1.5;
  margin: 4px 0 0;
}
.region-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 8px;
}
.region-chip {
  font-size: 9px;
  padding: 2px 8px;
  background: #faf5ff;
  color: #7e22ce;
  border: 1px solid #e9d5ff;
  border-radius: 20px;
  font-weight: 600;
}

/* ── Contributors & Modifiers ───────────────────────── */
.mod-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.mod-card {
  background: var(--paper);
  border: 1px solid var(--line);
  border-left: 3px solid var(--amber);
  border-radius: 10px;
  padding: 12px 16px;
}
.mod-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 6px;
}
.mod-id { background: #fff7ed; color: #9a3412; }
.mod-type {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
}
.mod-role-badge {
  font-size: 9px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.mr-exclusion   { background: #fef2f2; color: #991b1b; }
.mr-expectation { background: #fefce8; color: #854d0e; }
.mr-supportive  { background: #f0fdf4; color: #166534; }
.mr-hold        { background: #eff6ff; color: #1d4ed8; }
.mod-finding {
  font-size: 12px;
  color: var(--slate);
  margin-bottom: 4px;
}
.mod-relevance {
  font-size: 11.5px;
  color: #475569;
  line-height: 1.5;
  font-style: italic;
  margin-bottom: 6px;
}

/* ── Safety & Limitations ───────────────────────────── */
.safety-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.safety-item {
  background: #fff8f1;
  border: 1px solid #fed7aa;
  border-left: 3px solid var(--erythema);
  border-radius: 10px;
  padding: 12px 16px;
}
.safety-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 6px;
}
.safety-id {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  background: #fef2f2;
  color: #991b1b;
  border-radius: 20px;
  letter-spacing: 0.04em;
}
.safety-type-badge {
  font-size: 9px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.stb-iq  { background: #fefce8; color: #854d0e; }
.stb-exc { background: #fef2f2; color: #991b1b; }
.safety-scope {
  font-size: 10px;
  color: var(--slate);
  font-style: italic;
}
.safety-location {
  font-size: 12px;
  color: var(--slate);
  margin: 0 0 4px;
}
.safety-reason {
  font-size: 12px;
  color: #475569;
  line-height: 1.5;
  margin: 0 0 6px;
}
.safety-groups { display: flex; flex-wrap: wrap; gap: 4px; }

/* ── Background Profile ─────────────────────────────── */
.bg-profile-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}
.bg-profile-card {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 14px 16px;
}
.bpcard-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--slate);
  margin-bottom: 6px;
}
.bpcard-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--ink);
  margin-bottom: 4px;
}
.bpcard-value-sm { font-size: 13px; }
.bpcard-conf {
  font-size: 10px;
  color: var(--primary);
  font-weight: 600;
  margin-top: 4px;
}
.comp-bars { display: flex; flex-direction: column; gap: 6px; margin-bottom: 4px; }
.comp-bar-row { display: flex; align-items: center; gap: 8px; }
.comp-bar-name {
  font-size: 10px;
  font-weight: 600;
  color: var(--slate);
  width: 52px;
  flex-shrink: 0;
}
.comp-bar-track {
  flex: 1;
  height: 5px;
  background: var(--line);
  border-radius: 99px;
  overflow: hidden;
}
.comp-bar-fill { height: 100%; border-radius: 99px; }
.comp-bar-pct {
  font-size: 11px;
  font-weight: 700;
  color: var(--ink);
  width: 30px;
  text-align: right;
}
.depth-caveat {
  font-size: 10px;
  color: var(--slate);
  font-style: italic;
  line-height: 1.4;
  margin: 6px 0 0;
}

/* ── Region Review Grid ────────────────────────────── */
.region-review-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px;
}
.rr-cell {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 10px 12px;
  border-top: 3px solid transparent;
}
.rr-cell.rr-usable  { border-top-color: #22c55e; }
.rr-cell.rr-limited { border-top-color: #f59e0b; }
.rr-cell.rr-absent  { border-top-color: #e2e8f0; opacity: 0.65; }
.rr-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.rr-name {
  font-size: 11px;
  font-weight: 700;
  color: var(--ink);
}
.rr-vis {
  font-size: 9px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 20px;
  text-transform: capitalize;
}
.rr-vis.rr-usable  { background: #f0fdf4; color: #166534; }
.rr-vis.rr-limited { background: #fefce8; color: #854d0e; }
.rr-vis.rr-absent  { background: #f1f5f9; color: #64748b; }
.rr-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 4px;
}
.rr-tag {
  font-size: 9px;
  padding: 1px 6px;
  background: #ede9fe;
  color: #5b21b6;
  border-radius: 20px;
  font-weight: 600;
}
.rr-note {
  font-size: 10px;
  color: var(--slate);
  line-height: 1.4;
  margin: 4px 0 0;
  font-style: italic;
}

/* ── Classification Required Items ───────────────────── */
.clf-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.clf-item {
  background: #fff8f1;
  border: 1px solid #fed7aa;
  border-left: 3px solid var(--erythema);
  border-radius: 10px;
  padding: 12px 16px;
}
.clf-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 6px;
}
.clf-type-badge {
  font-size: 9px;
  font-weight: 700;
  padding: 2px 8px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.clf-urgency {
  font-size: 9px;
  font-weight: 700;
  padding: 2px 8px;
  background: #fef2f2;
  color: #991b1b;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.clf-action {
  font-size: 12px;
  color: #475569;
  margin-top: 4px;
  line-height: 1.4;
}

/* ── Updated Treatment Block ─────────────────────────── */
.tx-block-card {
  background: var(--paper);
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  padding: 16px;
}
.tx-block-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px dashed var(--line);
}
.tx-meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.tx-meta-label {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--slate);
}
.tx-meta-val {
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
}
.tx-sessions {
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
}
.tx-session-hdr {
  display: grid;
  grid-template-columns: 36px 1fr 1fr 80px;
  gap: 8px;
  padding: 6px 12px;
  background: #f8fafc;
  border-bottom: 1px solid var(--line);
  font-size: 10px;
  font-weight: 700;
  color: var(--slate);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.tx-session-row {
  display: grid;
  grid-template-columns: 36px 1fr 1fr 80px;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--line);
  align-items: center;
  font-size: 12px;
}
.tx-session-row:last-child { border-bottom: none; }
.tx-sn {
  font-size: 11px;
  font-weight: 700;
  color: var(--primary);
}
.tx-modalities {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.tx-mod-chip {
  font-size: 9px;
  font-weight: 700;
  padding: 2px 7px;
  background: #eff6ff;
  color: #1d4ed8;
  border-radius: 20px;
  letter-spacing: 0.03em;
}
.tx-status-badge {
  font-size: 9px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  text-align: center;
}
.txs-done    { background: #f0fdf4; color: #166534; }
.txs-active  { background: #eff6ff; color: #1d4ed8; }
.txs-pending { background: #f8fafc; color: #64748b; }
.txs-skip    { background: #f1f5f9; color: #94a3b8; }
.tx-rationale {
  font-size: 12px;
  color: var(--slate);
  line-height: 1.5;
  font-style: italic;
  margin: 0;
  padding-top: 10px;
  border-top: 1px dashed var(--line);
}
</style>
