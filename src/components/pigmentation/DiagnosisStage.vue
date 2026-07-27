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
            <h3><span class="bar" style="background: var(--melanin)"></span>Differential Diagnoses</h3>
            <div style="display: flex; gap: 8px; align-items: center;">
              <button
                class="btn"
                @click="downloadDiagnosisReport"
                style="font-size: 12px; padding: 4px 10px; background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0;"
                title="Download diagnosis data as JSON"
              >
                ⬇ Download Report
              </button>
              <button
                class="btn btn-primary"
                @click="runGenerateDx"
                :disabled="store.isLoading"
                style="font-size: 12px; padding: 4px 10px"
              >
                ✦ Regenerate Diagnosis
              </button>
            </div>
          </div>
          <!-- New V2 diagnostic components display -->
          <div v-if="store.diagnosis.data.diagnostic_components?.length">
            <div v-if="store.diagnosis.data.working_impression?.overall_summary" class="q-mb-md font-serif text-subtitle2" style="font-size: 14px; line-height: 1.5; color: #334155; padding: 12px; background: #f8fafc; border-radius: 6px; border: 1px dashed #cbd5e1; margin-bottom: 16px;">
              <strong>Summary:</strong> {{ store.diagnosis.data.working_impression.overall_summary }}
            </div>
            
            <div
              v-for="comp in store.diagnosis.data.diagnostic_components"
              :key="comp.diagnostic_component_id"
              class="dx-alt q-mb-md"
              style="
                display: block;
                border-left: 4px solid var(--melanin);
                padding-left: 14px;
                padding-top: 8px;
                padding-bottom: 8px;
                background: #fdfcfb;
                border-radius: 0 6px 6px 0;
                box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                margin-bottom: 16px;
              "
            >
              <div
                style="
                  display: flex;
                  justify-content: space-between;
                  font-weight: bold;
                  font-size: 15px;
                  color: #1e293b;
                  margin-bottom: 4px;
                "
              >
                <span>
                  {{ comp.patient_title || formatCategoryLabel(comp.subtype || comp.family) }}
                  <span 
                    v-if="comp.diagnostic_component_id === store.diagnosis.data.working_impression?.dominant_treatable_component_id"
                    style="background: #e0f2fe; color: #0369a1; font-size: 10px; padding: 1px 6px; border-radius: 4px; margin-left: 6px; vertical-align: middle;"
                  >
                    Dominant
                  </span>
                </span>
                <span style="color: #64748b; font-weight: normal; font-size: 12px"
                  >{{ comp.confidence_100 }}% confidence ({{ comp.diagnostic_status }})</span
                >
              </div>

              <!-- Explanation -->
              <div style="font-size: 13px; color: #334155; margin-bottom: 8px; line-height: 1.45;">
                {{ comp.patient_explanation }}
              </div>

              <!-- Evidence Lists -->
              <div style="display: grid; grid-template-columns: 1fr; gap: 8px; margin-bottom: 8px;">
                <div v-if="comp.evidence_for?.length">
                  <div style="font-size: 11px; font-weight: bold; color: #166534; text-transform: uppercase;">Supporting Evidence:</div>
                  <ul style="margin: 2px 0 0 16px; padding: 0; font-size: 12px; color: #1e3a1e; list-style-type: check;">
                    <li v-for="(ev, evIdx) in comp.evidence_for" :key="evIdx">{{ ev }}</li>
                  </ul>
                </div>
                <div v-if="comp.evidence_against?.length">
                  <div style="font-size: 11px; font-weight: bold; color: #991b1b; text-transform: uppercase;">Alternative/Contra-evidence:</div>
                  <ul style="margin: 2px 0 0 16px; padding: 0; font-size: 12px; color: #3a1e1e; list-style-type: circle;">
                    <li v-for="(ev, evIdx) in comp.evidence_against" :key="evIdx">{{ ev }}</li>
                  </ul>
                </div>
                <div v-if="comp.missing_discriminators?.length">
                  <div style="font-size: 11px; font-weight: bold; color: #57534e; text-transform: uppercase;">To Refine Further:</div>
                  <ul style="margin: 2px 0 0 16px; padding: 0; font-size: 12px; color: #44403c; list-style-type: square;">
                    <li v-for="(ev, evIdx) in comp.missing_discriminators" :key="evIdx">{{ ev }}</li>
                  </ul>
                </div>
              </div>

              <div style="display: flex; flex-wrap: wrap; gap: 6px; font-size: 11px; color: #64748b;">
                <span><strong>Regions:</strong> {{ comp.regions?.map(r => formatCategoryLabel(r)).join(', ') }}</span>
                <span>•</span>
                <span><strong>Depth:</strong> {{ cap(comp.depth) }}</span>
                <span>•</span>
                <span><strong>Activity:</strong> {{ cap(comp.activity) }}</span>
                <span>•</span>
                <span><strong>Status:</strong> {{ formatCategoryLabel(comp.direct_cosmetic_treatment_status) }}</span>
              </div>
            </div>
          </div>

          <!-- Legacy V1 fallback -->
          <div v-else>
            <div class="dx-primary" style="margin-bottom: 12px">
              <div>
                <div class="nm">
                  {{ formatCategoryLabel(store.diagnosis.data.working_impression?.primary_category) }}
                </div>
                <div class="rs" style="margin-top: 4px; color: #6a4631; font-size: 13px; line-height: 1.45;">
                  {{ store.diagnosis.data.summaries?.clinical_summary_for_doctor }}
                </div>
              </div>
              <div class="conf">
                {{ store.diagnosis.data.working_impression?.primary_confidence_100 }}%
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
          </div>
        </div>

        <!-- Doctor Review & Safety Warning -->
        <div
          class="pblock"
          v-if="
            store.diagnosis.data.working_impression?.doctor_review_required ||
            store.diagnosis.data.patient_doctor_review_note?.required ||
            store.diagnosis.data.doctor_actions?.length
          "
        >
          <h3><span class="bar" style="background: #ef4444"></span>Clinical Warnings & Safety Notes</h3>
          <div
            class="redflag"
            style="
              display: block;
              padding: 16px;
              background: #fffbeb;
              border: 1px solid #fef3c7;
              color: #92400e;
              margin-bottom: 12px;
              border-radius: 8px;
            "
          >
            <div style="font-weight: bold; font-size: 14px; display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <q-icon name="warning" size="20px" color="amber-9" />
              <span>{{ store.diagnosis.data.patient_doctor_review_note?.headline || 'Doctor Review Required before treatment' }}</span>
            </div>
            <p style="font-size: 13px; line-height: 1.5; margin-bottom: 8px; color: #78350f;">
              {{ store.diagnosis.data.working_impression?.doctor_review_reason || store.diagnosis.data.patient_doctor_review_note?.summary }}
            </p>
            <p v-if="store.diagnosis.data.patient_doctor_review_note?.reassurance" style="font-size: 12px; opacity: 0.85; font-style: italic; margin-bottom: 10px; color: #92400e;">
              {{ store.diagnosis.data.patient_doctor_review_note.reassurance }}
            </p>

            <!-- Render doctor actions list if available -->
            <div v-if="store.diagnosis.data.doctor_actions?.length" style="margin-top: 10px;">
              <div style="font-weight: bold; font-size: 12.5px; margin-bottom: 6px; color: #78350f;">Required Doctor Actions:</div>
              <div style="display: grid; grid-template-columns: 1fr; gap: 8px;">
                <div 
                  v-for="(act, aIdx) in store.diagnosis.data.doctor_actions" 
                  :key="aIdx"
                  style="background: rgba(239, 68, 68, 0.05); border-left: 3px solid #ef4444; padding: 10px 14px; border-radius: 0 4px 4px 0;"
                >
                  <div style="font-weight: 600; font-size: 12.5px; color: #b91c1c;">
                    {{ formatCategoryLabel(act.action_type) }}
                  </div>
                  <div style="font-size: 12px; color: #7f1d1d; margin-top: 2px;">
                    {{ act.instruction }}
                  </div>
                </div>
              </div>
            </div>

            <div v-if="store.diagnosis.data.patient_doctor_review_note?.areas?.length" style="margin-top: 10px;">
              <div style="font-weight: bold; font-size: 12.5px; margin-bottom: 4px; color: #78350f;">Specific areas to review:</div>
              <div style="display: grid; grid-template-columns: 1fr; gap: 6px;">
                <div 
                  v-for="(area, aIdx) in store.diagnosis.data.patient_doctor_review_note.areas" 
                  :key="aIdx"
                  style="background: rgba(245, 158, 11, 0.1); border-left: 3px solid #d97706; padding: 8px 12px; border-radius: 0 4px 4px 0;"
                >
                  <div style="font-weight: 600; font-size: 12px; color: #b45309;">
                    {{ area.natural_location }}
                  </div>
                  <div style="font-size: 11.5px; color: #92400e;">
                    Instruction: {{ area.instruction }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Patient Summary -->
        <div class="pblock" v-if="store.diagnosis.data.summaries?.patient_summary">
          <h3><span class="bar" style="background: var(--teal)"></span>Patient Summary</h3>
          <div
            style="
              padding: 16px;
              background: #f0fdfa;
              border: 1px solid #ccfbf1;
              border-radius: 8px;
              color: #115e59;
            "
          >
            <div style="font-weight: bold; font-size: 13.5px; margin-bottom: 6px; color: #0f766e;">
              {{ store.diagnosis.data.summaries.patient_summary_short }}
            </div>
            <div style="font-size: 13px; line-height: 1.5; color: #134e4a;">
              {{ store.diagnosis.data.summaries.patient_summary }}
            </div>
          </div>
        </div>

        <!-- Pigmentation Profile -->
        <div class="pblock">
          <h3><span class="bar" style="background: var(--melanin)"></span>Pigmentation Profile</h3>
          
          <!-- Fitzpatrick & Indices -->
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            <div class="vbox text-center" style="border: 1px solid #e2e8f0; background: #ffffff; padding: 12px;">
              <div class="lab" style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase;">Fitzpatrick Skin Type</div>
              <div style="font-family: 'Fraunces', serif; font-size: 18px; font-weight: bold; color: #1e293b; margin: 4px 0;">
                {{ store.formData.fitz || store.diagnosis.data.pigmentation_profile?.estimated_fitzpatrick?.type?.replace(/_/g, ' ') }}
              </div>
              <div style="font-size: 11px; color: #64748b;">
                Clinician Confirmed
              </div>
            </div>
            
            <div class="vbox text-center" style="border: 1px solid #e2e8f0; background: #ffffff; padding: 12px;">
              <div class="lab" style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase;">Melanin Load Index</div>
              <div style="font-family: 'Fraunces', serif; font-size: 20px; font-weight: bold; color: var(--melanin); margin: 4px 0;">
                {{ store.diagnosis.data.immutable_image_metrics?.global_background_melanin_load_index || store.formData.mel || store.diagnosis.data.pigmentation_profile?.melanin_load_index }}
              </div>
              <div style="font-size: 11px; color: #64748b;">Estimated melanin burden</div>
            </div>

            <div class="vbox text-center" style="border: 1px solid #e2e8f0; background: #ffffff; padding: 12px;">
              <div class="lab" style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase;">Erythema Load Index</div>
              <div style="font-family: 'Fraunces', serif; font-size: 20px; font-weight: bold; color: var(--erythema, #ef4444); margin: 4px 0;">
                {{ store.diagnosis.data.immutable_image_metrics?.global_background_erythema_load_index || store.formData.ery || store.diagnosis.data.pigmentation_profile?.erythema_load_index }}
              </div>
              <div style="font-size: 11px; color: #64748b;">Vascular redness load</div>
            </div>
          </div>

          <!-- Composition & Depth details -->
          <div class="twin">
            <!-- Depth Call -->
            <div :class="['vbox', getDepthClass(store.formData.depth)]">
              <div class="lab">Depth Assessment</div>
              <div class="hd" style="font-size: 16px; margin: 4px 0;">
                {{ formatCategoryLabel(store.formData.depth) }}
              </div>
              <div style="font-weight: 600; font-size: 12px; margin-bottom: 2px;">
                Clinician Verified Depth
              </div>
              <div class="ds">
                Estimated depth of target pigment (epidermal, dermal, mixed, or uncertain).
              </div>
            </div>

            <!-- Composition ratios -->
            <div :class="['vbox', getCompClass(store.formData.comp)]">
              <div class="lab">Pigment Composition</div>
              <div class="hd" style="font-size: 16px; margin: 4px 0;">
                {{ formatCategoryLabel(store.formData.comp) }}
              </div>
              
              <!-- Custom Horizontal Composition Progress Bar -->
              <div style="margin: 12px 0 6px 0;" v-if="store.formData.comp">
                <div style="display: flex; justify-content: space-between; font-size: 11.5px; font-weight: bold; margin-bottom: 3px;">
                  <span style="color: var(--melanin)">Melanin ({{ melaninPercent }}%)</span>
                  <span style="color: var(--erythema, #ef4444)">Vascular ({{ vascularPercent }}%)</span>
                </div>
                <div style="display: flex; height: 8px; border-radius: 4px; overflow: hidden; background: #e2e8f0;">
                  <div :style="{ width: melaninPercent + '%', background: 'var(--melanin)' }"></div>
                  <div :style="{ width: vascularPercent + '%', background: 'var(--erythema, #ef4444)' }"></div>
                </div>
              </div>
              
              <div class="ds">
                Estimated balance of dark melanin pigment versus underlying redness/vascularity.
              </div>
            </div>
          </div>
        </div>

        <!-- Key Drivers -->
        <div class="pblock" v-if="store.diagnosis.data.key_drivers">
          <h3><span class="bar" style="background: var(--melanin)"></span>Key Drivers</h3>
          
          <!-- New Array format -->
          <div
            v-if="Array.isArray(store.diagnosis.data.key_drivers)"
            class="drivers-container"
            style="display: grid; grid-template-columns: 1fr; gap: 12px"
          >
            <div
              v-for="drv in store.diagnosis.data.key_drivers"
              :key="drv.driver"
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
                <b style="font-size: 13.5px; color: #1e293b">{{ formatCategoryLabel(drv.driver) }}</b>
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
                    Likelihood: {{ cap(drv.likelihood) }}
                  </span>
                  <span style="font-size: 11.5px; color: #64748b"
                    >{{ drv.confidence_100 }}% confidence</span
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
                <li v-for="(b, bIdx) in drv.basis" :key="bIdx" style="margin-bottom: 2px">
                  {{ b }}
                </li>
              </ul>
            </div>
          </div>

          <!-- Legacy Map/Object format fallback -->
          <div
            v-else
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
                <b style="font-size: 13.5px; color: #1e293b">{{ formatCategoryLabel(driverKey) }}</b>
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

        <!-- Regional Interpretation -->
        <div class="pblock" v-if="store.diagnosis.data.regional_interpretation">
          <h3><span class="bar" style="background: var(--melanin)"></span>Regional Distribution</h3>
          
          <!-- High-level Distribution Info -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            <div class="vbox" style="border: 1px solid #e2e8f0; background: #ffffff; padding: 10px;">
              <div class="lab" style="font-size: 10px; color: #64748b;">Overall Distribution</div>
              <div style="font-weight: 600; font-size: 13px; margin-top: 2px;">
                {{ formatCategoryLabel(store.diagnosis.data.regional_interpretation.overall_distribution) }}
              </div>
            </div>
            
            <div class="vbox" style="border: 1px solid #e2e8f0; background: #ffffff; padding: 10px;">
              <div class="lab" style="font-size: 10px; color: #64748b;">Symmetry Profile</div>
              <div style="font-weight: 600; font-size: 13px; margin-top: 2px;">
                {{ formatCategoryLabel(store.diagnosis.data.regional_interpretation.symmetry) }}
              </div>
            </div>
          </div>
          
          <div class="vbox q-mb-md" style="border: 1px solid #e2e8f0; background: #ffffff; padding: 12px;">
            <div class="lab" style="font-size: 10px; color: #64748b; margin-bottom: 4px;">Dominant Areas</div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              <span 
                v-for="region in store.diagnosis.data.regional_interpretation.dominant_regions" 
                :key="region"
                style="background: #e0f2fe; color: #0369a1; font-weight: 600; font-size: 11px; padding: 2px 8px; border-radius: 4px;"
              >
                {{ formatCategoryLabel(region) }}
              </span>
            </div>
            <div style="font-size: 12.5px; color: #475569; margin-top: 8px; line-height: 1.4;">
              <b>Summary:</b> {{ store.diagnosis.data.regional_interpretation.patient_summary }}
            </div>
          </div>

          <!-- Regions Breakdown Cards Grid -->
          <div style="display: grid; grid-template-columns: 1fr; gap: 10px;">
            <div 
              v-for="region in store.diagnosis.data.regional_interpretation.regions" 
              :key="region.region"
              style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; background: #ffffff;"
            >
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <strong style="color: #1e293b; font-size: 13px;">{{ formatCategoryLabel(region.region) }}</strong>
                <span 
                  class="status-badge"
                  :style="{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    background: region.support_level.includes('strongly') ? '#dcfce7' : region.support_level.includes('moderately') ? '#fef3c7' : '#f1f5f9',
                    color: region.support_level.includes('strongly') ? '#15803d' : region.support_level.includes('moderately') ? '#b45309' : '#475569'
                  }"
                >
                  {{ formatCategoryLabel(region.support_level) }}
                </span>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px;">
                <div style="border-right: 1px solid #f1f5f9; padding-right: 10px;">
                  <div style="color: #64748b; font-size: 10px; font-weight: bold; text-transform: uppercase;">Patient Description</div>
                  <div style="color: #475569; margin-top: 2px; line-height: 1.4;">{{ region.patient_description }}</div>
                </div>
                <div>
                  <div style="color: #64748b; font-size: 10px; font-weight: bold; text-transform: uppercase;">Clinical Findings</div>
                  <div style="color: #1e293b; margin-top: 2px; line-height: 1.4;">{{ region.clinical_interpretation }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Patient-Facing Components -->
        <div class="pblock" v-if="store.diagnosis.data.patient_facing_components || store.diagnosis.data.diagnostic_components?.length">
          <h3><span class="bar" style="background: var(--teal)"></span>Patient-Facing Explanations</h3>
          <div style="display: grid; grid-template-columns: 1fr; gap: 12px;">
            <!-- Render V2 Diagnostic Components patient explanation -->
            <template v-if="store.diagnosis.data.diagnostic_components?.length">
              <div 
                v-for="comp in store.diagnosis.data.diagnostic_components" 
                :key="comp.diagnostic_component_id"
                style="border: 1px solid #ccfbf1; border-radius: 8px; overflow: hidden; background: #ffffff;"
              >
                <!-- Component Header -->
                <div style="background: #f0fdfa; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ccfbf1;">
                  <span style="font-weight: bold; font-size: 13px; color: #0f766e;">{{ comp.patient_title || formatCategoryLabel(comp.family) }}</span>
                  <span style="font-size: 11px; color: #14b8a6; font-weight: 500;">
                    {{ formatCategoryLabel(comp.diagnostic_status) }} ({{ comp.confidence_100 }}%)
                  </span>
                </div>
                <!-- Component Body -->
                <div style="padding: 12px; font-size: 12.5px; line-height: 1.45;">
                  <div style="color: #334155; margin-bottom: 8px;">
                    {{ comp.patient_explanation }}
                  </div>
                  <!-- Implication Box -->
                  <div style="background: #f8fafc; border-left: 3px solid #14b8a6; padding: 8px 12px; border-radius: 0 4px 4px 0; font-size: 12px; color: #0f766e;">
                    <strong>Treatment Implication:</strong> {{ formatCategoryLabel(comp.direct_cosmetic_treatment_status) }}
                  </div>
                </div>
              </div>
            </template>

            <!-- Legacy Patient-Facing Explanations -->
            <template v-else>
              <div 
                v-for="comp in store.diagnosis.data.patient_facing_components" 
                :key="comp.component"
                style="border: 1px solid #ccfbf1; border-radius: 8px; overflow: hidden; background: #ffffff;"
              >
                <!-- Component Header -->
                <div style="background: #f0fdfa; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ccfbf1;">
                  <span style="font-weight: bold; font-size: 13px; color: #0f766e;">{{ comp.title }}</span>
                  <span style="font-size: 11px; color: #14b8a6; font-weight: 500;">
                    {{ formatCategoryLabel(comp.support_level) }} ({{ comp.confidence_100 }}%)
                  </span>
                </div>
                <!-- Component Body -->
                <div style="padding: 12px; font-size: 12.5px; line-height: 1.45;">
                  <div style="color: #334155; margin-bottom: 8px;">
                    {{ comp.explanation }}
                  </div>
                  <!-- Implication Box -->
                  <div style="background: #f8fafc; border-left: 3px solid #14b8a6; padding: 8px 12px; border-radius: 0 4px 4px 0; font-size: 12px; color: #0f766e;">
                    <strong>Treatment Implication:</strong> {{ comp.treatment_meaning }}
                  </div>
                </div>
              </div>
            </template>
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

        <!-- Doctor Classifications (if any required) -->
        <div class="pblock" v-if="store.classificationRequiredItems?.length">
          <h3><span class="bar" style="background: #f59e0b"></span>Required Doctor Classifications</h3>
          <DoctorClassificationPanel />
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
import { api } from 'src/boot/axios'
import { Loading, Notify } from 'quasar'
import DoctorClassificationPanel from './DoctorClassificationPanel.vue'

const store = usePigmentationStore()

onMounted(async () => {
  if (!store.diagnosis && !store.isLoading) {
    await runGenerateDx()
  } else if (store.diagnosis) {
    initializeDefaultDxChoice()
  }
})
const validationError = ref('')
const selectedDxChoice = ref('')
const customDxValue = ref('')

const initializeDefaultDxChoice = () => {
  if (store.diagnosis?.confirmedDx) {
    selectedDxChoice.value = store.diagnosis.confirmedDx
    return
  }
  const data = store.diagnosis?.data
  if (data?.diagnostic_components?.length) {
    const dominant = data.diagnostic_components.find(
      (c) => c.diagnostic_component_id === data.working_impression?.dominant_treatable_component_id
    ) || data.diagnostic_components[0]
    selectedDxChoice.value = dominant.family || dominant.subtype || ''
  } else if (data?.working_impression?.primary_category) {
    selectedDxChoice.value = data.working_impression.primary_category
  } else if (data?.differential?.primary?.dx) {
    selectedDxChoice.value = data.differential.primary.dx
  }
}

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
    initializeDefaultDxChoice()
  } catch (err) {
    validationError.value = err.message || 'API connection failed.'
  }
}

const formatCategoryLabel = (val) => {
  if (!val) return ''
  if (typeof val !== 'string') {
    if (typeof val === 'object') {
      return formatCategoryLabel(val.label || val.name || val.category || val.title || JSON.stringify(val))
    }
    val = String(val)
  }
  return val
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/Pih/g, 'PIH')
}

// Working Dx selections
const dxSelectOptions = computed(() => {
  if (!store.diagnosis?.data) return []
  const impression = store.diagnosis.data.working_impression
  const components = store.diagnosis.data.diagnostic_components || []

  const list = []
  
  // Add diagnostic components from V2 JSON
  components.forEach((comp) => {
    const val = comp.family || comp.subtype || ''
    if (val && !list.some((i) => i.value === val)) {
      list.push({ value: val, label: comp.patient_title || formatCategoryLabel(val) })
    }
  })

  const primary = impression?.primary_category
  const secondaries = impression?.secondary_categories || []

  if (primary && !list.some((i) => i.value === primary)) {
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
    if (!list.some((i) => i.value === cat)) {
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

const downloadDiagnosisReport = async () => {
  Loading.show({ message: 'Downloading diagnosis report...' })
  try {
    const response = await api.get(
      `download-pigmentation-report/diagnosis/${store.id}`,
      {
        responseType: 'blob',
      },
    )

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute(
      'download',
      `${store.formData.initials || 'patient'}_pigmentation_diagnosis.pdf`,
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

const melaninPercent = computed(() => {
  if (store.diagnosis?.data?.scores?.composition_melanin_percent !== undefined) {
    return store.diagnosis.data.scores.composition_melanin_percent
  }
  if (store.formData.comp === 'melanin') return 100
  if (store.formData.comp === 'vascular') return 0
  if (store.formData.comp === 'mixed') return 50
  return 0
})

const vascularPercent = computed(() => {
  if (store.diagnosis?.data?.scores?.composition_vascular_percent !== undefined) {
    return store.diagnosis.data.scores.composition_vascular_percent
  }
  if (store.formData.comp === 'melanin') return 0
  if (store.formData.comp === 'vascular') return 100
  if (store.formData.comp === 'mixed') return 50
  return 0
})

// Style helpers
const cap = (s) => {
  const str = String(s || '')
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const getDepthClass = (val) => {
  const v = String(val || '').toLowerCase()
  if (v.includes('epidermal')) return 'epidermal'
  if (v.includes('dermal') || v.includes('mixed')) return 'dermal'
  return ''
}

const getCompClass = (val) => {
  const v = String(val || '').toLowerCase()
  if (v.includes('melanin')) return 'melanin'
  if (v.includes('vascular')) return 'vascular'
  return ''
}
</script>
