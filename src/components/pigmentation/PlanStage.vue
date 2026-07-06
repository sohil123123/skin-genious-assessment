<template>
  <section class="stage is-active">
    <div class="stage-head">
      <span class="eyebrow">Stage 04 · Plan</span>
      <h1 class="serif">Generate proposed plan &amp; sign-off</h1>
      <p>
        Generates a tiered clinical plan for review. Includes photoprotection, topicals, procedures,
        oral options, and measurable patient goals. The treating dermatologist must sign off and
        lock the plan before patient use.
      </p>
    </div>

    <!-- VALIDATION ERROR -->
    <div
      class="card bg-red-1 q-mb-md"
      v-if="validationError"
      id="genValidate"
      style="border: 1px solid var(--erythema)"
    >
      <div class="err-box">
        <b>Cannot generate plan.</b><br />
        <span v-html="validationError"></span>
      </div>
    </div>

    <!-- INITIAL PLAN BUTTON -->
    <div
      class="card tight q-pa-lg text-center"
      v-if="!store.lastPlan && !store.isLoading"
      id="genStart"
    >
      <div class="text-h6 font-serif q-mb-sm" id="genHint">
        {{
          store.diagnosis?.confirmedDx
            ? 'Building a plan for: ' + store.diagnosis.confirmedDx
            : 'Confirm working diagnosis first'
        }}
      </div>
      <p class="note q-mx-auto" style="margin-bottom: 16px">
        OpenAI will construct a tiered treatment plan tailored to the confirmed diagnosis. Standard
        safety rules apply (pregnancy, thromboembolic checks, hydroquinone limits, Fitzpatrick FST
        limits).
      </p>
      <button
        class="btn btn-primary"
        @click="runGeneratePlan"
        :disabled="!store.diagnosis?.confirmedDx"
      >
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

      <!-- PLAN HEADER -->
      <div class="plan-header-card q-mb-md" v-if="store.lastPlan.plan_name">
        <div class="plan-title-row">
          <div>
            <h2 class="serif plan-name-title">{{ store.lastPlan.plan_name }}</h2>
            <div class="text-caption text-grey-7 q-mt-xs">
              Status: <span class="text-weight-bold text-uppercase text-primary">{{ formatLabel(store.lastPlan.plan_status) }}</span>
            </div>
          </div>
          <span class="duration-badge">Duration: {{ formatTiming(store.lastPlan.duration) }}</span>
        </div>

        <!-- Clinical Recommendation Mode -->
        <div class="recommendation-mode-box q-mt-md" v-if="store.lastPlan.clinical_recommendation_mode">
          <div class="rm-title">💡 Clinical Recommendation Profile:</div>
          <div class="rm-body">
            <div>Optimized for: <b>{{ formatLabel(store.lastPlan.clinical_recommendation_mode.optimize_for) }}</b></div>
            <div>Doctor constraints used as: <b>{{ formatLabel(store.lastPlan.clinical_recommendation_mode.doctor_constraints_used_as) }}</b></div>
            <div>Can clinician edit: <b>{{ store.lastPlan.clinical_recommendation_mode.doctor_can_edit_before_finalization ? 'Yes' : 'No' }}</b></div>
          </div>
        </div>
      </div>

      <!-- BASELINE SUMMARY -->
      <div class="pblock" v-if="store.lastPlan.baseline_summary">
        <h3><span class="bar"></span>Baseline Skin Profile</h3>
        <div class="baseline-grid">
          <div class="metric-card mel">
            <span class="m-lbl">Melanin Load</span>
            <span class="m-val">{{ store.lastPlan.baseline_summary.melanin_load_index }}/100</span>
          </div>
          <div class="metric-card ery">
            <span class="m-lbl">Erythema Load</span>
            <span class="m-val">{{ store.lastPlan.baseline_summary.erythema_load_index }}/100</span>
          </div>
          <div class="metric-card depth">
            <span class="m-lbl">Depth Verdict</span>
            <span class="m-val-text">{{ formatLabel(store.lastPlan.baseline_summary.depth_call) }}</span>
          </div>
          <div class="metric-card comp">
            <span class="m-lbl">Composition</span>
            <span class="m-val-text">{{ formatLabel(store.lastPlan.baseline_summary.composition) }}</span>
          </div>
          <div class="metric-card mmasi" v-if="store.lastPlan.baseline_summary.mmasi_if_applicable !== null && store.lastPlan.baseline_summary.mmasi_if_applicable !== undefined">
            <span class="m-lbl">mMASI</span>
            <span class="m-val">{{ store.lastPlan.baseline_summary.mmasi_if_applicable }}/24</span>
          </div>
        </div>
        
        <div class="drivers-box" v-if="store.lastPlan.baseline_summary.primary_drivers?.length">
          <div class="d-title">Primary Clinical Drivers:</div>
          <div class="driver-tags">
            <span class="d-tag" v-for="driver in store.lastPlan.baseline_summary.primary_drivers" :key="driver">
              {{ formatLabel(driver) }}
            </span>
          </div>
        </div>

        <div class="drivers-box" v-if="store.lastPlan.baseline_summary.local_modifiers?.length" style="border-top: none; margin-top: 8px; padding-top: 0;">
          <div class="d-title">Local Modifiers:</div>
          <div class="driver-tags">
            <span class="d-tag modifier" v-for="modifier in store.lastPlan.baseline_summary.local_modifiers" :key="modifier">
              {{ formatLabel(modifier) }}
            </span>
          </div>
        </div>
      </div>

      <!-- MEASURABLE TREATMENT GOALS -->
      <div class="pblock" v-if="store.lastPlan.treatment_goals || store.lastPlan.measurable_goals">
        <h3><span class="bar"></span>Measurable Treatment Goals</h3>
        <div class="goals-timeline-grid">
          <div 
            class="goal-card" 
            v-for="(goals, timeframe) in (store.lastPlan.treatment_goals || store.lastPlan.measurable_goals)" 
            :key="timeframe"
          >
            <div class="g-timeframe">{{ formatTiming(timeframe) }}</div>
            <div class="g-clinical">Goal: <b>{{ goals.clinical_goal }}</b></div>
            
            <div class="g-metrics">
              <div class="g-metric-row" v-if="goals.melanin_load_target !== undefined || goals.melanin_load_index_target_max !== undefined">
                <span>Melanin Target:</span>
                <b>{{ goals.melanin_load_target ?? goals.melanin_load_index_target_max }}/100</b>
              </div>
              <div class="g-metric-row" v-if="goals.erythema_load_target !== undefined || goals.erythema_load_index_target_max !== undefined">
                <span>Erythema Target:</span>
                <b>{{ goals.erythema_load_target ?? goals.erythema_load_index_target_max }}/100</b>
              </div>
              <div class="g-metric-row" v-if="goals.mmasi_target_if_applicable !== undefined && goals.mmasi_target_if_applicable !== null">
                <span>mMASI Target:</span>
                <b>{{ goals.mmasi_target_if_applicable }}/24</b>
              </div>
              <div class="g-metric-row" v-if="goals.depth_call_target">
                <span>Depth Call Target:</span>
                <b>{{ formatLabel(goals.depth_call_target) }}</b>
              </div>
            </div>

            <!-- Regional Targets -->
            <div class="regional-goals-box" v-if="goals.regional_goals?.length">
              <div class="rg-title">📍 Regional Targets:</div>
              <div class="rg-row" v-for="rg in goals.regional_goals" :key="rg.region">
                <span class="rg-name">{{ formatLabel(rg.region) }}</span>
                <span class="rg-vals">{{ rg.baseline_melanin_load }} → <b>{{ rg.target_melanin_load }}</b></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Q-SWITCH SETTING OPTIMIZER -->
      <div class="pblock" v-if="store.lastPlan.q_switch_optimizer">
        <h3><span class="bar"></span>Laser Wavelength Optimizer</h3>
        
        <!-- Selected Setting -->
        <div class="selected-setting-card" v-if="store.lastPlan.q_switch_optimizer.selected_setting">
          <div class="ss-title">⚡ AI SELECTED LASER SETTING</div>
          <div class="ss-grid">
            <div class="ss-item">
              <span class="ss-lbl">Wavelength</span>
              <span class="ss-val">{{ store.lastPlan.q_switch_optimizer.selected_setting.wavelength_nm }} nm</span>
            </div>
            <div class="ss-item">
              <span class="ss-lbl">Energy</span>
              <span class="ss-val">{{ store.lastPlan.q_switch_optimizer.selected_setting.energy_mj }} mJ</span>
            </div>
            <div class="ss-item">
              <span class="ss-lbl">Fluence</span>
              <span class="ss-val">{{ store.lastPlan.q_switch_optimizer.selected_setting.fluence_j_cm2 }} J/cm²</span>
            </div>
            <div class="ss-item">
              <span class="ss-lbl">Frequency</span>
              <span class="ss-val">{{ store.lastPlan.q_switch_optimizer.selected_setting.frequency_hz }} Hz</span>
            </div>
            <div class="ss-item">
              <span class="ss-lbl">Passes</span>
              <span class="ss-val">{{ store.lastPlan.q_switch_optimizer.selected_setting.passes }}</span>
            </div>
          </div>
          <div class="ss-reason q-mt-sm">
            <b>Selection Reason:</b> {{ store.lastPlan.q_switch_optimizer.selected_setting.selection_reason }}
          </div>
        </div>

        <!-- Candidate Settings Tables -->
        <div class="candidates-section q-mt-md" v-if="store.lastPlan.q_switch_optimizer.candidate_settings?.length">
          <div class="cs-title">Candidate Settings Evaluated:</div>
          <div class="candidate-table-container">
            <table class="candidate-table">
              <thead>
                <tr>
                  <th>Wavelength</th>
                  <th>Energy</th>
                  <th>Fluence</th>
                  <th>Freq</th>
                  <th>Passes</th>
                  <th>Efficacy</th>
                  <th>Safety</th>
                  <th>Overall</th>
                  <th>Rationale</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(cand, idx) in store.lastPlan.q_switch_optimizer.candidate_settings" :key="idx">
                  <td><b>{{ cand.wavelength_nm }} nm</b></td>
                  <td>{{ cand.energy_mj }} mJ</td>
                  <td>{{ cand.fluence_j_cm2 }} J/cm²</td>
                  <td>{{ cand.frequency_hz }} Hz</td>
                  <td>{{ cand.passes }}</td>
                  <td>
                    <div class="score-badge eff">{{ cand.efficacy_score_100 }}/100</div>
                  </td>
                  <td>
                    <div class="score-badge saf">{{ cand.safety_score_100 }}/100</div>
                  </td>
                  <td>
                    <div class="score-badge ovr">{{ cand.overall_score_100 }}/100</div>
                  </td>
                  <td class="rationale-cell">{{ cand.reason }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TREATMENT ROADMAP -->
      <div class="pblock" v-if="store.lastPlan.sessions?.length">
        <h3><span class="bar"></span>Treatment Roadmap</h3>
        <div class="roadmap-timeline">
          <div 
            v-for="session in store.lastPlan.sessions" 
            :key="session.session_number"
            class="timeline-item"
          >
            <!-- Badge -->
            <div class="timeline-badge">
              <span class="week-lbl">Sess</span>
              <span class="week-num">{{ session.session_number }}</span>
            </div>
            
            <!-- Content -->
            <div class="timeline-content">
              <div class="session-hdr">
                <div class="session-timing">{{ formatTiming(session.timing) }}</div>
                <div class="session-goal">{{ session.goal }}</div>
                <div class="modalities-tags q-mt-xs" v-if="session.selected_modalities?.length">
                  <span class="mod-tag" v-for="m in session.selected_modalities" :key="m">
                    {{ formatLabel(m) }}
                  </span>
                </div>
              </div>
              
              <!-- Protocol Box -->
              <div class="protocol-box" v-if="session.fixed_protocol">
                <div class="section-badge-header">CLINICAL FIXED PROTOCOL</div>
                <div class="proc-name">
                  <span class="dot"></span>
                  Procedure: <b>{{ formatLabel(session.fixed_protocol.procedure) }}</b>
                </div>
                
                <!-- Q-Switch details -->
                <div class="proc-details" v-if="session.fixed_protocol.q_switch?.use">
                  <div class="proc-sub-title">⚡ Q-Switch Laser:</div>
                  <div class="detail-grid">
                    <div>Wavelength: <b>{{ session.fixed_protocol.q_switch.wavelength_nm }} nm</b></div>
                    <div>Energy: <b>{{ session.fixed_protocol.q_switch.energy_mj }} mJ</b></div>
                    <div>Fluence: <b>{{ session.fixed_protocol.q_switch.fluence_j_cm2 }} J/cm²</b></div>
                    <div>Freq: <b>{{ formatLabel(session.fixed_protocol.q_switch.frequency_hz) }} Hz</b></div>
                    <div v-if="session.fixed_protocol.q_switch.passes">Passes: <b>{{ formatLabel(session.fixed_protocol.q_switch.passes) }}</b></div>
                    <div v-if="session.fixed_protocol.q_switch.endpoint">Endpoint: <b>{{ formatLabel(session.fixed_protocol.q_switch.endpoint) }}</b></div>
                  </div>
                </div>
                
                <!-- Peel details -->
                <div class="proc-details" v-if="session.fixed_protocol.peel?.use">
                  <div class="proc-sub-title">🧪 Peel:</div>
                  <div class="detail-grid">
                    <div>Peel Name: <b>{{ formatLabel(session.fixed_protocol.peel.peel_name) }}</b></div>
                    <div>Contact Time: <b>{{ session.fixed_protocol.peel.contact_time_minutes }} min</b></div>
                    <div>Neutralization: <b>{{ session.fixed_protocol.peel.neutralization_required ? 'Required' : 'None' }}</b></div>
                  </div>
                </div>

                <!-- Microneedling details -->
                <div class="proc-details" v-if="session.fixed_protocol.microneedling?.use">
                  <div class="proc-sub-title">💉 Microneedling:</div>
                  <div class="detail-grid">
                    <div>Device: <b>{{ session.fixed_protocol.microneedling.device }}</b></div>
                    <div>Route: <b>{{ formatLabel(session.fixed_protocol.microneedling.route) }}</b></div>
                    <div>Injectable Policy: <b>{{ formatLabel(session.fixed_protocol.microneedling.injectable) }}</b></div>
                  </div>
                  <div class="depth-subgrid" v-if="session.fixed_protocol.microneedling.depth_by_region && Object.keys(session.fixed_protocol.microneedling.depth_by_region).length">
                    <div class="subgrid-title">Depths by Region:</div>
                    <div class="depth-items">
                      <div v-for="(depth, region) in session.fixed_protocol.microneedling.depth_by_region" :key="region">
                        {{ formatLabel(region) }}: <b>{{ depth }}mm</b>
                      </div>
                    </div>
                  </div>
                  <div class="actives-list" v-if="session.fixed_protocol.microneedling.actives?.length">
                    <span>Actives: </span>
                    <span class="active-badge" v-for="act in session.fixed_protocol.microneedling.actives" :key="act">
                      {{ formatLabel(act) }}
                    </span>
                  </div>
                </div>
                
                <!-- LED support -->
                <div class="led-badge" v-if="session.fixed_protocol.led?.use">
                  ✨ LED Support ({{ formatLabel(session.fixed_protocol.led.mode) }}): <b>{{ formatLabel(session.fixed_protocol.led.role) }}</b>
                </div>

                <!-- Decision Rules -->
                <div class="decision-box" v-if="session.fixed_protocol.decision_rule">
                  <b>Decision Rule:</b> {{ session.fixed_protocol.decision_rule }}
                </div>

                <!-- Actions Checklist -->
                <div class="actions-box" v-if="session.fixed_protocol.actions?.length">
                  <b>Actions Checklist:</b>
                  <ul>
                    <li v-for="action in session.fixed_protocol.actions" :key="action">
                      {{ formatLabel(action) }}
                    </li>
                  </ul>
                </div>
                
                <!-- Local modifiers actions -->
                <div class="local-modifiers-box" v-if="session.fixed_protocol.local_modifier_actions?.length">
                  <div class="lm-title">📍 Targeted Local Care:</div>
                  <div class="lm-row" v-for="lm in session.fixed_protocol.local_modifier_actions" :key="lm.region">
                    <span class="lm-region">{{ formatLabel(lm.region) }}:</span>
                    <span class="lm-action">{{ formatLabel(lm.action) }}</span>
                  </div>
                </div>
              </div>

              <!-- Provider Protocol Box -->
              <div class="provider-box q-mt-md" v-if="session.provider_protocol">
                <div class="section-badge-header">IN-CLINIC PROVIDER PROTOCOL</div>
                <div class="performed-by-lbl">
                  Performed by: <span class="badge text-uppercase text-weight-bold" :class="session.provider_protocol.performed_by?.includes('doctor') ? 'badge-doctor' : 'badge-therapist'">{{ formatLabel(session.provider_protocol.performed_by) }}</span>
                </div>

                <!-- Pre-treatment Checklist -->
                <div class="sub-section" v-if="session.provider_protocol.pre_treatment_checklist?.length">
                  <div class="sub-sec-title">📋 Pre-treatment Checklist:</div>
                  <ul class="sec-list">
                    <li v-for="step in session.provider_protocol.pre_treatment_checklist" :key="step">
                      {{ step }}
                    </li>
                  </ul>
                </div>

                <!-- Zone Sequence -->
                <div class="sub-section" v-if="session.provider_protocol.zone_sequence?.length">
                  <div class="sub-sec-title">🗺️ Zone Treatment Sequence:</div>
                  <div class="zone-table-container">
                    <table class="zone-table">
                      <thead>
                        <tr>
                          <th>Seq</th>
                          <th>Zone</th>
                          <th>Settings</th>
                          <th>Coverage Instruction</th>
                          <th>Endpoint Target</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="z in session.provider_protocol.zone_sequence" :key="z.order">
                          <td><b>#{{ z.order }}</b></td>
                          <td>
                            <div class="zone-name">{{ formatLabel(z.zone) }}</div>
                            <div class="zone-reason">{{ z.reason }}</div>
                          </td>
                          <td>
                            <div class="zone-settings" v-if="z.settings">
                              {{ z.settings.wavelength_nm }}nm | {{ z.settings.energy_mj }}mJ | {{ z.settings.fluence_j_cm2 }} J/cm² | {{ z.settings.frequency_hz }}Hz | {{ z.settings.passes }} passes
                            </div>
                          </td>
                          <td class="text-caption">{{ z.coverage_instruction }}</td>
                          <td class="endpoint-txt"><b>{{ formatLabel(z.endpoint) }}</b></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Avoid Zones -->
                <div class="avoid-zones-box" v-if="session.provider_protocol.avoid_zones?.length">
                  <div class="az-title">⚠️ ZONES TO AVOID:</div>
                  <div class="az-row" v-for="az in session.provider_protocol.avoid_zones" :key="az.zone">
                    <span class="az-zone">{{ formatLabel(az.zone) }}:</span>
                    <span class="az-reason">{{ az.reason }}</span>
                  </div>
                </div>

                <!-- Endpoint Rules -->
                <div class="sub-section" v-if="session.provider_protocol.endpoint_rules?.length">
                  <div class="sub-sec-title">🛑 Stop &amp; Safety Endpoint Rules:</div>
                  <ul class="sec-list">
                    <li v-for="rule in session.provider_protocol.endpoint_rules" :key="rule">
                      {{ rule }}
                    </li>
                  </ul>
                </div>

                <!-- Post Treatment Steps -->
                <div class="sub-section" v-if="session.provider_protocol.post_treatment_steps?.length">
                  <div class="sub-sec-title">🧴 Post-treatment Recovery Steps:</div>
                  <ul class="sec-list">
                    <li v-for="step in session.provider_protocol.post_treatment_steps" :key="step">
                      {{ step }}
                    </li>
                  </ul>
                </div>

                <!-- Homecare Handover -->
                <div class="sub-section" v-if="session.provider_protocol.homecare_handover?.length">
                  <div class="sub-sec-title">🤝 Client Handover Checklist:</div>
                  <ul class="sec-list">
                    <li v-for="h in session.provider_protocol.homecare_handover" :key="h">
                      {{ h }}
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Reassessment Gate -->
              <div class="reassess-box" v-if="session.reassessment_required || session.continue_if">
                <div class="reassess-title">🔄 Reassessment Gate:</div>
                <div class="reassess-body">
                  <div v-if="session.repeat_images?.length" class="repeat-images">
                    Requires repeat imaging: 
                    <span class="img-mode-badge" v-for="img in session.repeat_images" :key="img">
                      {{ img }}
                    </span>
                  </div>
                  <div v-if="session.continue_if" class="continue-conditions">
                    <b>Criteria to continue:</b>
                    <ul>
                      <li v-if="session.continue_if.melanin_load_index_reduction_min">
                        Melanin Index Reduction: <b>Min {{ session.continue_if.melanin_load_index_reduction_min }}</b>
                      </li>
                      <li v-if="session.continue_if.erythema_load_not_increased_by_more_than">
                        Erythema Index Increase: <b>Max {{ session.continue_if.erythema_load_not_increased_by_more_than }}</b>
                      </li>
                      <li v-if="session.continue_if.no_new_sensitivity">
                        Skin Sensitivity: <b>No new sensitivity or stinging</b>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <!-- Authorization Box -->
              <div class="authorization-box q-mt-md" v-if="session.authorization">
                <div class="section-badge-header">AUTHORIZATION DETAILS</div>
                <div class="auth-grid">
                  <div>Doctor sign-off required: <b>{{ session.authorization.doctor_signoff_required ? 'Yes' : 'No' }}</b></div>
                  <div>Approval Status: <span class="badge text-uppercase text-weight-bold" :class="'badge-' + (session.authorization.approval_status || 'pending')">{{ formatLabel(session.authorization.approval_status) }}</span></div>
                </div>
                <div class="auth-steps-list q-mt-sm" v-if="session.authorization.doctor_performed_steps?.length">
                  <b>Doctor Performed Steps:</b>
                  <ul>
                    <li v-for="step in session.authorization.doctor_performed_steps" :key="step">{{ step }}</li>
                  </ul>
                </div>
                <div class="auth-steps-list q-mt-sm" v-if="session.authorization.therapist_after_approval_steps?.length">
                  <b>Therapist Approved Steps:</b>
                  <ul>
                    <li v-for="step in session.authorization.therapist_after_approval_steps" :key="step">{{ step }}</li>
                  </ul>
                </div>
              </div>

              <!-- Nested Homecare -->
              <div class="nested-homecare" v-if="session.fixed_protocol?.homecare">
                <div class="hc-title">🏡 Homecare Regime Initiated:</div>
                <div class="homecare-grid">
                  <!-- MORNING -->
                  <div class="hc-card hc-morning" v-if="session.fixed_protocol.homecare.morning?.length">
                    <div class="hc-hdr">
                      <span class="hc-icon">☀️</span>
                      <h4>Morning</h4>
                    </div>
                    <ul class="hc-list">
                      <li v-for="(step, idx) in session.fixed_protocol.homecare.morning" :key="idx">
                        {{ formatLabel(step) }}
                      </li>
                    </ul>
                  </div>
                  <!-- NIGHT -->
                  <div class="hc-card hc-night" v-if="session.fixed_protocol.homecare.night?.length">
                    <div class="hc-hdr">
                      <span class="hc-icon">🌙</span>
                      <h4>Night</h4>
                    </div>
                    <ul class="hc-list">
                      <li v-for="(step, idx) in session.fixed_protocol.homecare.night" :key="idx">
                        {{ formatLabel(step) }}
                      </li>
                    </ul>
                  </div>
                  <!-- AVOID -->
                  <div class="hc-card hc-avoid" v-if="session.fixed_protocol.homecare.avoid?.length">
                    <div class="hc-hdr">
                      <span class="hc-icon">⚠️</span>
                      <h4>Avoid</h4>
                    </div>
                    <ul class="hc-list">
                      <li v-for="(step, idx) in session.fixed_protocol.homecare.avoid" :key="idx">
                        {{ formatLabel(step) }}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <!-- REASSESSMENT PLAN -->
      <div class="pblock" v-if="store.lastPlan.reassessment_plan">
        <h3><span class="bar"></span>Reassessment Plan</h3>
        <div class="reassess-details-grid">
          <div class="reassess-dt-card" v-if="store.lastPlan.reassessment_plan.repeat_images?.length">
            <span class="r-lbl">Repeat Images Required:</span>
            <div class="img-tags q-mt-xs">
              <span class="img-mode-badge" v-for="mode in store.lastPlan.reassessment_plan.repeat_images" :key="mode">
                {{ mode }}
              </span>
            </div>
          </div>
          <div class="reassess-dt-card" v-if="store.lastPlan.reassessment_plan.metrics_to_compare?.length">
            <span class="r-lbl">Metrics to Compare:</span>
            <div class="metrics-tags q-mt-xs">
              <span class="metric-badge" v-for="metric in store.lastPlan.reassessment_plan.metrics_to_compare" :key="metric">
                {{ formatLabel(metric) }}
              </span>
            </div>
          </div>
        </div>
        <div class="decision-rules-box q-mt-sm" v-if="store.lastPlan.reassessment_plan.decision_rules?.length">
          <div class="dr-title">⚖️ Reassessment Decision Rules:</div>
          <ul class="sec-list">
            <li v-for="rule in store.lastPlan.reassessment_plan.decision_rules" :key="rule">
              {{ rule }}
            </li>
          </ul>
        </div>
      </div>

      <!-- CLIENT COMM & COMMUNICATION REPORT -->
      <div class="pblock" v-if="store.lastPlan.client_report || store.lastPlan.whatsapp_summary">
        <h3><span class="bar"></span>Client Communication &amp; Report</h3>
        <div class="client-report-card">
          <div class="cr-headline" v-if="store.lastPlan.client_report?.headline">
            "{{ store.lastPlan.client_report.headline }}"
          </div>
          <div class="cr-explanation q-mt-sm" v-if="store.lastPlan.client_report?.simple_explanation">
            {{ store.lastPlan.client_report.simple_explanation }}
          </div>
          <div class="cr-roadmap q-mt-md" v-if="store.lastPlan.client_report?.roadmap?.length">
            <b>Patient Roadmap Milestones:</b>
            <ol class="roadmap-ordered-list q-mt-xs">
              <li v-for="step in store.lastPlan.client_report.roadmap" :key="step">
                {{ step }}
              </li>
            </ol>
          </div>
          <div class="whatsapp-box q-mt-md" v-if="store.lastPlan.whatsapp_summary?.message">
            <div class="wa-title">💬 WhatsApp Copy Summary:</div>
            <div class="wa-text q-mt-xs">{{ store.lastPlan.whatsapp_summary.message }}</div>
          </div>
          <div class="disclaimer-txt q-mt-md" v-if="store.lastPlan.client_report?.disclaimer">
            ⚠️ <b>Disclaimer:</b> {{ store.lastPlan.client_report.disclaimer }}
          </div>
        </div>
      </div>

      <!-- CLINICIAN SIGN-OFF LOCK PANEL -->
      <div class="signoff" id="signoff">
        <h3 class="serif">Clinician review &amp; sign-off</h3>
        <div class="sub">
          Required before this plan can be exported. Your edits are recorded with the plan.
        </div>

        <label class="so-check">
          <input type="checkbox" v-model="soReviewed" :disabled="store.reviewState.finalized" />
          <span>I have reviewed this AI-proposed assessment and plan in full.</span>
        </label>

        <div style="font-size: 12px; font-weight: 600; color: var(--slate); margin: 6px 0 4px">
          Decision
        </div>
        <div class="so-radios" id="soRadios">
          <div :class="['so-radio', getRadioClass('approve')]" @click="selectDecision('approve')">
            Approve as-is
          </div>
          <div :class="['so-radio', getRadioClass('edit')]" @click="selectDecision('edit')">
            Approve with edits
          </div>
          <div :class="['so-radio', getRadioClass('reject')]" @click="selectDecision('reject')">
            Reject
          </div>
        </div>

        <div style="font-size: 12px; font-weight: 600; color: var(--slate); margin-bottom: 5px">
          Clinician notes / edits
        </div>
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
          />
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
            <div style="margin-top: 4px" v-if="store.reviewState.notes">
              Reason: {{ store.reviewState.notes }}
            </div>
            <button class="btn" style="margin-top: 10px" @click="resetPlan">
              Start a new plan
            </button>
          </div>
          <div v-else>
            <b
              >✓ {{ store.reviewState.decision === 'edit' ? 'Approved with edits' : 'Approved' }}</b
            >
            by {{ store.reviewState.reviewer }} · {{ store.reviewState.ts?.toLocaleString() }}
            <div style="margin-top: 4px" v-if="store.reviewState.notes">
              Notes: {{ store.reviewState.notes }}
            </div>
            <div style="margin-top: 12px; display: flex; gap: 9px; flex-wrap: wrap">
              <button class="btn btn-primary" @click="$emit('trigger-print')">
                Export / print
              </button>
              <button class="btn" @click="resetPlan">New plan</button>
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
  if (!store.lastPlan && !store.isLoading && store.diagnosis?.confirmedDx) {
    await runGeneratePlan()
  }
})

defineEmits(['trigger-print'])

const validationError = ref('')
const soReviewed = ref(store.reviewState.finalized)
const soDecision = ref(store.reviewState.decision || '')
const soNotes = ref(store.reviewState.notes || '')
const soReviewer = ref(store.reviewState.reviewer || 'Dr. A. Mehra')

const runGeneratePlan = async () => {
  validationError.value = ''

  if (!store.diagnosis?.confirmedDx) {
    validationError.value =
      'Confirm a working diagnosis on the <b>Diagnosis</b> step first — the plan is built on it.'
    return
  }

  const missing = []
  if (!store.formData.initials) missing.push('patient initials')
  if (!store.formData.age) missing.push('age')
  if (!store.formData.sex) missing.push('sex')
  if (!store.formData.fitz) missing.push('skin type (analyse captures, or set it)')
  // if (store.aiAnalysis && !store.aiAnalysis.confirmed) {
  //   missing.push('confirmation of AI readings')
  // }

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
  if (!store.reviewState.finalized)
    return 'Not for patient use until Dr. Mehra reviews and approves below.'
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

const formatTiming = (t) => {
  if (!t) return '—'
  return String(t)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bTo\b/i, 'to')
}

const formatLabel = (str) => {
  if (!str) return '—'
  if (typeof str !== 'string') return String(str)
  return str
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

const resetPlan = () => {
  store.lastPlan = null
  store.reviewState = {
    decision: null,
    notes: '',
    reviewer: 'Dr. A. Mehra',
    finalized: false,
    ts: null,
  }
  soReviewed.value = false
  soDecision.value = ''
  soNotes.value = ''
}
</script>

<style>
.homecare-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.hc-card {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 14px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.hc-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.hc-hdr {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  border-bottom: 1px solid var(--line-soft);
  padding-bottom: 6px;
}

.hc-icon {
  font-size: 18px;
}

.hc-hdr h4 {
  font-size: 14px;
  font-weight: 700;
  margin: 0;
  color: var(--ink);
}

.hc-list {
  list-style: none !important;
  list-style-type: none !important;
  padding: 0 !important;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hc-list li {
  font-size: 13px;
  color: var(--ink);
  line-height: 1.4;
  position: relative;
  padding-left: 14px;
}

.hc-list li::before {
  content: "•";
  position: absolute;
  left: 0;
  color: var(--slate);
}

.hc-morning {
  background: var(--amber-wash);
  border-color: #e8d3a0;
}
.hc-morning .hc-hdr h4 {
  color: var(--amber);
}

.hc-night {
  background: var(--violet-wash);
  border-color: #c9beea;
}
.hc-night .hc-hdr h4 {
  color: var(--violet);
}

.hc-avoid {
  background: var(--erythema-wash);
  border-color: #e6b2bc;
}
.hc-avoid .hc-hdr h4 {
  color: var(--erythema);
}

.hc-rx {
  background: var(--melanin-wash);
  border-color: #d7c2b0;
}
.hc-rx .hc-hdr h4 {
  color: var(--melanin);
}

.roadmap-timeline {
  position: relative;
  margin-top: 16px;
}

.roadmap-timeline::before {
  content: "";
  position: absolute;
  left: 16px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: var(--line);
  z-index: 0;
}

.timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
  position: relative;
  z-index: 1;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-badge {
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--paper);
  border: 2px solid var(--violet);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.week-lbl {
  font-size: 8px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--slate);
  line-height: 1;
}

.week-num {
  font-size: 11px;
  font-weight: 700;
  color: var(--violet);
  line-height: 1;
}

.timeline-content {
  flex: 1;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 14px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.timeline-content:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.timeline-content p {
  font-size: 13.5px;
  color: var(--ink);
  line-height: 1.45;
  margin: 0;
}

/* Premium Plan Stage Styles */
.plan-header-card {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
}

.plan-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.plan-name-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--ink);
  margin: 0;
}

.duration-badge {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  background: var(--violet-wash);
  color: var(--violet);
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid #c9beea;
}

.baseline-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.metric-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--line);
  text-align: center;
}

.metric-card .m-lbl {
  font-size: 11px;
  font-weight: 600;
  color: var(--slate);
  text-transform: uppercase;
  margin-bottom: 4px;
}

.metric-card .m-val {
  font-size: 18px;
  font-weight: 700;
  font-family: 'IBM Plex Mono', monospace;
}

.metric-card .m-val-text {
  font-size: 12.5px;
  font-weight: 600;
  line-height: 1.25;
}

.metric-card.mel {
  background: var(--melanin-wash);
  border-color: #d7c2b0;
  color: var(--melanin);
}

.metric-card.ery {
  background: var(--erythema-wash);
  border-color: #e6b2bc;
  color: var(--erythema);
}

.metric-card.depth {
  background: var(--violet-wash);
  border-color: #c9beea;
  color: var(--violet);
}

.metric-card.comp {
  background: var(--amber-wash);
  border-color: #e8d3a0;
  color: var(--amber);
}

.drivers-box {
  margin-top: 14px;
  padding-top: 10px;
  border-top: 1px dashed var(--line);
}

.drivers-box .d-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--slate);
  margin-bottom: 6px;
}

.driver-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.driver-tags .d-tag {
  font-size: 11px;
  font-weight: 600;
  background: var(--line-soft);
  color: var(--slate);
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid var(--line);
}

/* Timeline Custom Elements */
.session-hdr {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.session-timing {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  font-weight: 700;
  color: var(--violet);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.session-goal {
  font-size: 14.5px;
  font-weight: 500;
  color: var(--ink);
}

.protocol-box {
  background: var(--porcelain);
  border-radius: var(--radius-sm);
  padding: 12px;
  margin-bottom: 12px;
  border: 1px solid var(--line-soft);
}

.proc-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  color: var(--ink);
  margin-bottom: 8px;
}

.proc-name .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--violet);
}

.proc-details {
  background: var(--paper);
  border: 1px solid var(--line-soft);
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 8px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 8px;
  font-size: 12.5px;
  color: var(--slate);
}

.detail-grid b {
  color: var(--ink);
}

.depth-subgrid {
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px dashed var(--line-soft);
}

.subgrid-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--slate);
  margin-bottom: 4px;
}

.depth-items {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 11.5px;
  color: var(--slate);
}

.depth-items b {
  color: var(--ink);
}

.actives-list {
  margin-top: 8px;
  font-size: 12px;
  color: var(--slate);
}

.active-badge {
  background: var(--violet-wash);
  color: var(--violet);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10.5px;
  font-weight: 600;
  margin-left: 4px;
}

.led-badge {
  display: inline-block;
  background: var(--good-wash);
  color: var(--good);
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  margin-top: 4px;
}

.decision-box {
  font-size: 12.5px;
  color: var(--ink);
  background: var(--amber-wash);
  padding: 8px 10px;
  border-radius: 6px;
  border-left: 3px solid var(--amber);
  margin-top: 8px;
}

.actions-box {
  font-size: 12.5px;
  color: var(--ink);
  margin-top: 8px;
}

.actions-box ul {
  margin: 4px 0 0 16px;
  padding: 0;
}

.actions-box li {
  margin-bottom: 2px;
}

.local-modifiers-box {
  margin-top: 10px;
  background: var(--erythema-wash);
  border-radius: 8px;
  padding: 10px;
  border-left: 3px solid var(--erythema);
}

.lm-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--erythema);
  margin-bottom: 4px;
}

.lm-row {
  display: flex;
  gap: 6px;
  font-size: 12px;
  line-height: 1.35;
  margin-bottom: 2px;
}

.lm-row:last-child {
  margin-bottom: 0;
}

.lm-region {
  font-weight: 700;
  color: var(--ink);
  min-width: 90px;
}

.lm-action {
  color: var(--slate);
}

.reassess-box {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 12px;
  margin-bottom: 12px;
}

.reassess-title {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--violet);
  margin-bottom: 6px;
}

.reassess-body {
  font-size: 12px;
  color: var(--slate);
}

.img-mode-badge {
  background: var(--line-soft);
  color: var(--ink);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10.5px;
  font-weight: 600;
  margin-right: 4px;
  display: inline-block;
}

.continue-conditions {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px dashed var(--line-soft);
}

.continue-conditions ul {
  margin: 4px 0 0 16px;
  padding: 0;
}

.continue-conditions li {
  margin-bottom: 2px;
}

.nested-homecare {
  background: var(--porcelain);
  border-radius: var(--radius-sm);
  padding: 12px;
  border: 1px solid var(--line-soft);
}

.hc-title {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--melanin);
  margin-bottom: 8px;
}

/* Optimization mode styles */
.recommendation-mode-box {
  background: var(--porcelain);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
}
.rm-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--violet);
  margin-bottom: 6px;
}
.rm-body {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
  font-size: 12px;
  color: var(--slate);
}
.rm-body b {
  color: var(--ink);
}

/* Modifier tag style */
.d-tag.modifier {
  background: var(--amber-wash);
  color: var(--amber);
  border-color: #e8d3a0;
}

/* Goals section styles */
.goals-timeline-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 14px;
  margin-top: 12px;
}
.goal-card {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.01);
}
.g-timeframe {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  font-weight: 700;
  color: var(--violet);
  text-transform: uppercase;
  border-bottom: 1px solid var(--line-soft);
  padding-bottom: 6px;
  margin-bottom: 10px;
}
.g-clinical {
  font-size: 13px;
  color: var(--ink);
  margin-bottom: 10px;
  line-height: 1.4;
}
.g-metrics {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12.5px;
  background: var(--porcelain);
  padding: 10px;
  border-radius: 6px;
}
.g-metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--slate);
}
.g-metric-row b {
  color: var(--ink);
  font-family: 'IBM Plex Mono', monospace;
}
.regional-goals-box {
  margin-top: 12px;
  border-top: 1px dashed var(--line-soft);
  padding-top: 8px;
}
.rg-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--slate);
  margin-bottom: 6px;
}
.rg-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11.5px;
  color: var(--slate);
  margin-bottom: 4px;
}
.rg-name {
  font-weight: 500;
}
.rg-vals {
  font-family: 'IBM Plex Mono', monospace;
}

/* Selected laser card */
.selected-setting-card {
  background: var(--violet-wash);
  border: 1px solid #c9beea;
  border-radius: var(--radius-sm);
  padding: 16px;
  box-shadow: 0 4px 15px rgba(118, 93, 196, 0.05);
}
.ss-title {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  color: var(--violet);
  letter-spacing: 0.05em;
  margin-bottom: 10px;
}
.ss-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
  gap: 10px;
}
.ss-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--paper);
  border: 1px solid #e0dbf2;
  border-radius: 6px;
  padding: 8px;
}
.ss-lbl {
  font-size: 9.5px;
  font-weight: 600;
  color: var(--slate);
  text-transform: uppercase;
  margin-bottom: 2px;
}
.ss-val {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--ink);
  font-family: 'IBM Plex Mono', monospace;
}
.ss-reason {
  font-size: 12.5px;
  color: var(--ink);
  line-height: 1.4;
  padding-top: 8px;
  border-top: 1px dashed #c9beea;
}

/* Candidate table styles */
.candidates-section {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 14px;
}
.cs-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
  margin-bottom: 10px;
}
.candidate-table-container {
  overflow-x: auto;
}
.candidate-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 12px;
}
.candidate-table th {
  background: var(--porcelain);
  color: var(--slate);
  font-weight: 600;
  padding: 8px;
  border-bottom: 2px solid var(--line);
  font-size: 11px;
  text-transform: uppercase;
}
.candidate-table td {
  padding: 10px 8px;
  border-bottom: 1px solid var(--line-soft);
  color: var(--ink);
  vertical-align: middle;
}
.candidate-table tr:hover {
  background: var(--porcelain);
}
.score-badge {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
}
.score-badge.eff {
  background: var(--good-wash);
  color: var(--good);
}
.score-badge.saf {
  background: var(--violet-wash);
  color: var(--violet);
}
.score-badge.ovr {
  background: var(--amber-wash);
  color: var(--amber);
}
.rationale-cell {
  color: var(--slate) !important;
  font-size: 11.5px;
  line-height: 1.35;
  max-width: 250px;
}

/* Modality tags */
.modalities-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.mod-tag {
  font-size: 10px;
  font-weight: 700;
  background: var(--line-soft);
  color: var(--slate);
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid var(--line);
}

/* Provider protocol box */
.provider-box {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 16px;
  margin-bottom: 12px;
}
.section-badge-header {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--slate);
  background: var(--porcelain);
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-block;
  margin-bottom: 12px;
  border: 1px solid var(--line-soft);
}
.performed-by-lbl {
  font-size: 13px;
  color: var(--ink);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}
.badge-doctor {
  background: var(--erythema-wash);
  color: var(--erythema);
  border: 1px solid #e6b2bc;
}
.badge-therapist {
  background: var(--violet-wash);
  color: var(--violet);
  border: 1px solid #c9beea;
}
.sub-section {
  margin-top: 14px;
}
.sub-sec-title {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--ink);
  margin-bottom: 6px;
}
.sec-list {
  margin: 4px 0 0 16px;
  padding: 0;
  font-size: 12.5px;
  color: var(--slate);
  line-height: 1.4;
}
.sec-list li {
  margin-bottom: 4px;
}

/* Zone treatment sequence table */
.zone-table-container {
  overflow-x: auto;
  margin-top: 6px;
  border: 1px solid var(--line-soft);
  border-radius: 6px;
}
.zone-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 12px;
}
.zone-table th {
  background: var(--porcelain);
  color: var(--slate);
  font-weight: 600;
  padding: 6px 8px;
  font-size: 10px;
  text-transform: uppercase;
}
.zone-table td {
  padding: 8px;
  border-bottom: 1px solid var(--line-soft);
  vertical-align: top;
}
.zone-name {
  font-weight: 700;
  color: var(--ink);
}
.zone-reason {
  font-size: 10px;
  color: var(--slate);
  margin-top: 2px;
}
.zone-settings {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  background: var(--porcelain);
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
}
.endpoint-txt {
  font-size: 11.5px;
  color: var(--ink);
}

/* Avoid zones */
.avoid-zones-box {
  margin-top: 14px;
  background: var(--erythema-wash);
  border-radius: var(--radius-sm);
  padding: 12px;
  border: 1px solid #e6b2bc;
}
.az-title {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--erythema);
  margin-bottom: 6px;
}
.az-row {
  font-size: 12px;
  margin-bottom: 4px;
}
.az-row:last-child {
  margin-bottom: 0;
}
.az-zone {
  font-weight: 700;
  color: var(--ink);
}
.az-reason {
  color: var(--slate);
  margin-left: 4px;
}

/* Authorization box */
.authorization-box {
  background: var(--porcelain);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-sm);
  padding: 14px;
  margin-bottom: 12px;
}
.auth-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
  font-size: 12.5px;
  color: var(--slate);
}
.badge-pending {
  background: var(--amber-wash);
  color: var(--amber);
  border: 1px solid #e8d3a0;
}
.badge-approved {
  background: var(--good-wash);
  color: var(--good);
  border: 1px solid #aadeba;
}
.auth-steps-list {
  font-size: 12px;
  color: var(--slate);
}
.auth-steps-list ul {
  margin: 2px 0 0 16px;
  padding: 0;
}

/* Reassessment details grid */
.reassess-details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
  margin-top: 10px;
}
.reassess-dt-card {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 12px;
}
.r-lbl {
  font-size: 12px;
  font-weight: 600;
  color: var(--slate);
}
.img-tags, .metrics-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.metric-badge {
  background: var(--violet-wash);
  color: var(--violet);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10.5px;
  font-weight: 600;
}
.decision-rules-box {
  background: var(--porcelain);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-sm);
  padding: 12px;
}
.dr-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--violet);
  margin-bottom: 6px;
}

/* Client report card styles */
.client-report-card {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 18px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.01);
}
.cr-headline {
  font-size: 16px;
  font-weight: 600;
  color: var(--violet);
  font-style: italic;
  line-height: 1.35;
}
.cr-explanation {
  font-size: 13.5px;
  color: var(--ink);
  line-height: 1.45;
}
.cr-roadmap {
  font-size: 13px;
  color: var(--ink);
}
.roadmap-ordered-list {
  margin: 6px 0 0 18px;
  padding: 0;
  line-height: 1.45;
  color: var(--slate);
}
.roadmap-ordered-list li {
  margin-bottom: 4px;
}
.whatsapp-box {
  background: #e8f5e9;
  border-radius: 8px;
  padding: 12px;
  border-left: 4px solid #4caf50;
}
.wa-title {
  font-size: 11px;
  font-weight: 700;
  color: #2e7d32;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.wa-text {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  color: #1b5e20;
  white-space: pre-line;
  line-height: 1.4;
}
.disclaimer-txt {
  font-size: 12px;
  color: var(--slate);
  background: var(--porcelain);
  padding: 8px 10px;
  border-radius: 6px;
  line-height: 1.4;
}
</style>
