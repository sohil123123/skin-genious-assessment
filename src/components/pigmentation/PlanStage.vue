<template>
  <section class="stage is-active plan-stage-pro">
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
    <div v-if="validationError" class="err-box q-mb-lg" id="genValidate">
      <b>Cannot generate plan.</b><br />
      <span v-html="validationError"></span>
    </div>

    <!-- INITIAL PLAN BUTTON -->
    <div
      class="card tight q-pa-xl text-center q-mb-lg"
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
      <p class="note q-mx-auto q-mb-lg" style="max-width: 500px; line-height: 1.5">
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
    <div class="card tight text-center q-pa-xl q-mb-lg" v-if="store.isLoading" id="genLoading">
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
      <div class="card plan-header-card q-mb-lg" v-if="store.lastPlan.plan_name">
        <div class="plan-header-top q-mb-md">
          <div>
            <h2 class="serif plan-name-title">{{ store.lastPlan.plan_name }}</h2>
            <div class="plan-status-row q-mt-xs">
              <span class="status-label">Status:</span>
              <span :class="['status-badge', store.lastPlan.plan_status]">
                {{ formatLabel(store.lastPlan.plan_status) }}
              </span>
            </div>
          </div>
          <span class="duration-badge">Duration: {{ formatTiming(store.lastPlan.duration) }}</span>
        </div>

        <!-- Clinical Recommendation Mode -->
        <div class="recommendation-mode-box" v-if="store.lastPlan.clinical_recommendation_mode">
          <div class="rm-title">💡 Clinical Recommendation Profile</div>
          <div class="rm-grid">
            <div class="rm-item">
              <span class="rm-lbl">Optimized for</span>
              <span class="rm-val">{{
                formatLabel(store.lastPlan.clinical_recommendation_mode.optimize_for)
              }}</span>
            </div>
            <div class="rm-item">
              <span class="rm-lbl">Doctor constraints</span>
              <span class="rm-val">{{
                formatLabel(store.lastPlan.clinical_recommendation_mode.doctor_constraints_used_as)
              }}</span>
            </div>
            <div class="rm-item">
              <span class="rm-lbl">Clinician edit</span>
              <span class="rm-val">{{
                store.lastPlan.clinical_recommendation_mode.doctor_can_edit_before_finalization
                  ? 'Yes'
                  : 'No'
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- BASELINE SUMMARY -->
      <div class="pblock" v-if="store.lastPlan.baseline_summary">
        <h3><span class="bar"></span>Baseline Skin Profile</h3>
        <div class="scoregrid">
          <div class="scorecard mel">
            <span class="sl">Melanin Load</span>
            <div class="sv">
              {{ store.lastPlan.baseline_summary.melanin_load_index }}<span class="su">/100</span>
            </div>
          </div>
          <div class="scorecard ery">
            <span class="sl">Erythema Load</span>
            <div class="sv">
              {{ store.lastPlan.baseline_summary.erythema_load_index }}<span class="su">/100</span>
            </div>
          </div>
          <div class="scorecard depth">
            <span class="sl">Depth Verdict</span>
            <div class="sv-text">{{ formatLabel(store.lastPlan.baseline_summary.depth_call) }}</div>
          </div>
          <div class="scorecard comp">
            <span class="sl">Composition</span>
            <div class="sv-text">
              {{ formatLabel(store.lastPlan.baseline_summary.composition) }}
            </div>
          </div>
          <div
            class="scorecard mmasi"
            v-if="
              store.lastPlan.baseline_summary.mmasi_if_applicable !== null &&
              store.lastPlan.baseline_summary.mmasi_if_applicable !== undefined
            "
          >
            <span class="sl">mMASI</span>
            <div class="sv">
              {{ store.lastPlan.baseline_summary.mmasi_if_applicable }}<span class="su">/24</span>
            </div>
          </div>
        </div>

        <div
          class="drivers-container q-mt-md"
          v-if="store.lastPlan.baseline_summary.primary_drivers?.length"
        >
          <span class="dc-title">Primary Clinical Drivers:</span>
          <div class="tag-group">
            <span
              class="clinical-chip"
              v-for="driver in store.lastPlan.baseline_summary.primary_drivers"
              :key="driver"
            >
              {{ formatLabel(driver) }}
            </span>
          </div>
        </div>

        <div
          class="drivers-container q-mt-sm"
          v-if="store.lastPlan.baseline_summary.local_modifiers?.length"
        >
          <span class="dc-title">Local Modifiers:</span>
          <div class="tag-group">
            <span
              class="clinical-chip modifier"
              v-for="modifier in store.lastPlan.baseline_summary.local_modifiers"
              :key="modifier"
            >
              {{ formatLabel(modifier) }}
            </span>
          </div>
        </div>
      </div>

      <!-- MEASURABLE TREATMENT GOALS -->
      <div class="pblock" v-if="store.lastPlan.treatment_goals || store.lastPlan.measurable_goals">
        <h3><span class="bar"></span>Measurable Treatment Goals</h3>
        <div class="goals-grid">
          <div
            class="card goal-card"
            v-for="(goals, timeframe) in store.lastPlan.treatment_goals ||
            store.lastPlan.measurable_goals"
            :key="timeframe"
          >
            <div class="g-header">
              <span class="g-timeframe">{{ formatTiming(timeframe) }}</span>
            </div>
            <div class="g-clinical q-my-md">
              <span class="g-lbl">Goal:</span>
              <span class="g-val-text">{{ goals.clinical_goal }}</span>
            </div>

            <div class="g-metrics-box">
              <div
                class="g-metric-row"
                v-if="
                  goals.melanin_load_target !== undefined ||
                  goals.melanin_load_index_target_max !== undefined
                "
              >
                <span class="lbl">Melanin Target</span>
                <span class="val"
                  >{{ goals.melanin_load_target ?? goals.melanin_load_index_target_max }}/100</span
                >
              </div>
              <div
                class="g-metric-row"
                v-if="
                  goals.erythema_load_target !== undefined ||
                  goals.erythema_load_index_target_max !== undefined
                "
              >
                <span class="lbl">Erythema Target</span>
                <span class="val"
                  >{{
                    goals.erythema_load_target ?? goals.erythema_load_index_target_max
                  }}/100</span
                >
              </div>
              <div
                class="g-metric-row"
                v-if="
                  goals.mmasi_target_if_applicable !== undefined &&
                  goals.mmasi_target_if_applicable !== null
                "
              >
                <span class="lbl">mMASI Target</span>
                <span class="val">{{ goals.mmasi_target_if_applicable }}/24</span>
              </div>
              <div class="g-metric-row" v-if="goals.depth_call_target">
                <span class="lbl">Depth Target</span>
                <span class="val-text">{{ formatLabel(goals.depth_call_target) }}</span>
              </div>
            </div>

            <!-- Regional Targets -->
            <div class="regional-goals-container q-mt-md" v-if="goals.regional_goals?.length">
              <div class="rg-title">📍 Regional Targets</div>
              <div class="rg-row" v-for="rg in goals.regional_goals" :key="rg.region">
                <span class="rg-name">{{ formatLabel(rg.region) }}</span>
                <span class="rg-vals"
                  >{{ rg.baseline_melanin_load }} → <b>{{ rg.target_melanin_load }}</b></span
                >
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Q-SWITCH SETTING OPTIMIZER -->
      <div class="pblock" v-if="store.lastPlan.q_switch_optimizer">
        <h3><span class="bar"></span>Laser Wavelength Optimizer</h3>

        <!-- Selected Setting -->
        <div
          class="card laser-selected-card q-mb-md"
          v-if="store.lastPlan.q_switch_optimizer.selected_setting"
        >
          <div class="ls-banner">⚡ AI SELECTED LASER SETTING</div>
          <div class="ls-grid q-mt-md">
            <div class="ls-item">
              <span class="lbl">Wavelength</span>
              <span class="val"
                >{{ store.lastPlan.q_switch_optimizer.selected_setting.wavelength_nm }} nm</span
              >
            </div>
            <div class="ls-item">
              <span class="lbl">Energy</span>
              <span class="val"
                >{{ store.lastPlan.q_switch_optimizer.selected_setting.energy_mj }} mJ</span
              >
            </div>
            <div class="ls-item">
              <span class="lbl">Fluence</span>
              <span class="val"
                >{{ store.lastPlan.q_switch_optimizer.selected_setting.fluence_j_cm2 }} J/cm²</span
              >
            </div>
            <div class="ls-item">
              <span class="lbl">Frequency</span>
              <span class="val"
                >{{ store.lastPlan.q_switch_optimizer.selected_setting.frequency_hz }} Hz</span
              >
            </div>
            <div class="ls-item">
              <span class="lbl">Passes</span>
              <span class="val">{{
                store.lastPlan.q_switch_optimizer.selected_setting.passes
              }}</span>
            </div>
          </div>
          <div class="ls-reason q-mt-md">
            <b>Selection Reason:</b>
            {{ store.lastPlan.q_switch_optimizer.selected_setting.selection_reason }}
          </div>
        </div>

        <!-- Candidate Settings Table -->
        <div
          class="card q-pa-none q-mb-md"
          v-if="store.lastPlan.q_switch_optimizer.candidate_settings?.length"
        >
          <div class="table-title q-pa-md">Candidate Settings Evaluated</div>
          <div class="clinic-table-wrap">
            <table class="clinic-table">
              <thead>
                <tr>
                  <th>Wavelength</th>
                  <th>Energy</th>
                  <th>Fluence</th>
                  <th>Freq</th>
                  <th>Passes</th>
                  <th class="text-center">Efficacy</th>
                  <th class="text-center">Safety</th>
                  <th class="text-center">Overall</th>
                  <th>Rationale</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(cand, idx) in store.lastPlan.q_switch_optimizer.candidate_settings"
                  :key="idx"
                >
                  <td>
                    <b>{{ cand.wavelength_nm }} nm</b>
                  </td>
                  <td>{{ cand.energy_mj }} mJ</td>
                  <td>{{ cand.fluence_j_cm2 }} J/cm²</td>
                  <td>{{ cand.frequency_hz }} Hz</td>
                  <td>{{ cand.passes }}</td>
                  <td class="text-center">
                    <span class="score-pill good">{{ cand.efficacy_score_100 }}/100</span>
                  </td>
                  <td class="text-center">
                    <span class="score-pill safe">{{ cand.safety_score_100 }}/100</span>
                  </td>
                  <td class="text-center">
                    <span class="score-pill overall">{{ cand.overall_score_100 }}/100</span>
                  </td>
                  <td class="rationale-col">{{ cand.reason }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TREATMENT ROADMAP -->
      <div class="pblock" v-if="store.lastPlan.sessions?.length">
        <h3><span class="bar"></span>Treatment Roadmap</h3>
        <div class="clinic-timeline">
          <div
            v-for="session in store.lastPlan.sessions"
            :key="session.session_number"
            class="timeline-block"
          >
            <!-- Timeline Icon -->
            <div class="timeline-icon">
              <span class="sess-title">Sess</span>
              <span class="sess-num">{{ session.session_number }}</span>
            </div>

            <!-- Content Card -->
            <div class="card timeline-card">
              <div class="sess-hdr">
                <span class="sess-timing">{{ formatTiming(session.timing) }}</span>
                <h4 class="sess-goal">{{ session.goal }}</h4>
                <div class="modalities-chips q-mt-sm" v-if="session.selected_modalities?.length">
                  <span class="mod-chip" v-for="m in session.selected_modalities" :key="m">
                    {{ formatLabel(m) }}
                  </span>
                </div>
              </div>

              <!-- Fixed Protocol -->
              <div class="roadmap-sub-section q-mt-lg" v-if="session.fixed_protocol">
                <div class="sub-sec-hdr">CLINICAL FIXED PROTOCOL</div>
                <div class="proc-title-row q-my-sm">
                  Procedure: <b>{{ formatLabel(session.fixed_protocol.procedure) }}</b>
                </div>

                <!-- Q-Switch details -->
                <div class="proc-detail-box q-mb-md" v-if="session.fixed_protocol.q_switch?.use">
                  <div class="box-title">⚡ Q-Switch Laser Parameters</div>
                  <div class="params-row">
                    <div>
                      Wavelength: <b>{{ session.fixed_protocol.q_switch.wavelength_nm }} nm</b>
                    </div>
                    <div>
                      Energy: <b>{{ session.fixed_protocol.q_switch.energy_mj }} mJ</b>
                    </div>
                    <div>
                      Fluence: <b>{{ session.fixed_protocol.q_switch.fluence_j_cm2 }} J/cm²</b>
                    </div>
                    <div>
                      Freq:
                      <b>{{ formatLabel(session.fixed_protocol.q_switch.frequency_hz) }} Hz</b>
                    </div>
                    <div v-if="session.fixed_protocol.q_switch.passes">
                      Passes: <b>{{ formatLabel(session.fixed_protocol.q_switch.passes) }}</b>
                    </div>
                    <div v-if="session.fixed_protocol.q_switch.endpoint">
                      Endpoint: <b>{{ formatLabel(session.fixed_protocol.q_switch.endpoint) }}</b>
                    </div>
                  </div>
                </div>

                <!-- Peel details -->
                <div class="proc-detail-box q-mb-md" v-if="session.fixed_protocol.peel?.use">
                  <div class="box-title">🧪 Peel Parameters</div>
                  <div class="params-row">
                    <div>
                      Peel Name: <b>{{ formatLabel(session.fixed_protocol.peel.peel_name) }}</b>
                    </div>
                    <div>
                      Contact Time:
                      <b>{{ session.fixed_protocol.peel.contact_time_minutes }} min</b>
                    </div>
                    <div>
                      Neutralization:
                      <b>{{
                        session.fixed_protocol.peel.neutralization_required ? 'Required' : 'None'
                      }}</b>
                    </div>
                  </div>
                </div>

                <!-- Microneedling details -->
                <div
                  class="proc-detail-box q-mb-md"
                  v-if="session.fixed_protocol.microneedling?.use"
                >
                  <div class="box-title">💉 Microneedling Parameters</div>
                  <div class="params-row q-mb-sm">
                    <div>
                      Device: <b>{{ session.fixed_protocol.microneedling.device }}</b>
                    </div>
                    <div>
                      Route: <b>{{ formatLabel(session.fixed_protocol.microneedling.route) }}</b>
                    </div>
                    <div>
                      Injectable:
                      <b>{{ formatLabel(session.fixed_protocol.microneedling.injectable) }}</b>
                    </div>
                  </div>
                  <div
                    class="depth-list q-mt-sm"
                    v-if="
                      session.fixed_protocol.microneedling.depth_by_region &&
                      Object.keys(session.fixed_protocol.microneedling.depth_by_region).length
                    "
                  >
                    <span class="lbl-small">Depths by Region:</span>
                    <div class="tag-group inline-group">
                      <span
                        class="sub-chip"
                        v-for="(depth, region) in session.fixed_protocol.microneedling
                          .depth_by_region"
                        :key="region"
                      >
                        {{ formatLabel(region) }}: {{ depth }}mm
                      </span>
                    </div>
                  </div>
                  <div
                    class="actives-list q-mt-sm"
                    v-if="session.fixed_protocol.microneedling.actives?.length"
                  >
                    <span class="lbl-small">Actives:</span>
                    <div class="tag-group inline-group">
                      <span
                        class="sub-chip active-chip"
                        v-for="act in session.fixed_protocol.microneedling.actives"
                        :key="act"
                      >
                        {{ formatLabel(act) }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- LED support -->
                <div class="led-card-banner q-mb-md" v-if="session.fixed_protocol.led?.use">
                  💡 LED Support ({{ formatLabel(session.fixed_protocol.led.mode) }}):
                  <b>{{ formatLabel(session.fixed_protocol.led.role) }}</b>
                </div>

                <!-- Decision Rules -->
                <div
                  class="decision-card-banner q-mb-md"
                  v-if="session.fixed_protocol.decision_rule"
                >
                  ⚠️ <b>Decision Rule:</b> {{ session.fixed_protocol.decision_rule }}
                </div>

                <!-- Actions Checklist -->
                <div
                  class="checklist-container q-mb-md"
                  v-if="session.fixed_protocol.actions?.length"
                >
                  <div class="lbl-small q-mb-sm">Actions Checklist</div>
                  <ul class="clinic-list">
                    <li v-for="action in session.fixed_protocol.actions" :key="action">
                      {{ formatLabel(action) }}
                    </li>
                  </ul>
                </div>

                <!-- Local modifiers actions -->
                <div
                  class="modifier-actions-card q-mb-md"
                  v-if="session.fixed_protocol.local_modifier_actions?.length"
                >
                  <div class="ma-title">📍 Targeted Local Care</div>
                  <div
                    class="ma-row"
                    v-for="lm in session.fixed_protocol.local_modifier_actions"
                    :key="lm.region"
                  >
                    <span class="ma-region">{{ formatLabel(lm.region) }}:</span>
                    <span class="ma-action">{{ formatLabel(lm.action) }}</span>
                  </div>
                </div>
              </div>

              <!-- Provider Protocol -->
              <div class="roadmap-sub-section q-mt-lg" v-if="session.provider_protocol">
                <div class="sub-sec-hdr">IN-CLINIC PROVIDER PROTOCOL</div>
                <div class="performed-by-row q-my-sm">
                  Performed by:
                  <span
                    :class="[
                      'role-badge',
                      session.provider_protocol.performed_by?.includes('doctor')
                        ? 'doctor'
                        : 'therapist',
                    ]"
                    >{{ formatLabel(session.provider_protocol.performed_by) }}</span
                  >
                </div>

                <!-- Pre-treatment Checklist -->
                <div
                  class="checklist-container q-mb-md"
                  v-if="session.provider_protocol.pre_treatment_checklist?.length"
                >
                  <div class="lbl-small q-mb-sm">📋 Pre-treatment Checklist</div>
                  <ul class="clinic-list">
                    <li
                      v-for="step in session.provider_protocol.pre_treatment_checklist"
                      :key="step"
                    >
                      {{ step }}
                    </li>
                  </ul>
                </div>

                <!-- Zone Sequence -->
                <div
                  class="table-container-mini q-mb-md"
                  v-if="session.provider_protocol.zone_sequence?.length"
                >
                  <div class="lbl-small q-mb-sm">🗺️ Zone Treatment Sequence</div>
                  <div class="clinic-table-wrap">
                    <table class="clinic-table compact">
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
                          <td>
                            <b>#{{ z.order }}</b>
                          </td>
                          <td>
                            <div class="z-name">{{ formatLabel(z.zone) }}</div>
                            <div class="z-reason">{{ z.reason }}</div>
                          </td>
                          <td>
                            <div class="z-settings" v-if="z.settings">
                              {{ z.settings.wavelength_nm }}nm | {{ z.settings.energy_mj }}mJ |
                              {{ z.settings.fluence_j_cm2 }} J/cm² | {{ z.settings.frequency_hz }}Hz
                              | {{ z.settings.passes }} passes
                            </div>
                          </td>
                          <td class="text-caption">{{ z.coverage_instruction }}</td>
                          <td>
                            <b>{{ formatLabel(z.endpoint) }}</b>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Avoid Zones -->
                <div
                  class="avoid-zones-card q-mb-md"
                  v-if="session.provider_protocol.avoid_zones?.length"
                >
                  <div class="az-title">⚠️ ZONES TO AVOID</div>
                  <div
                    class="az-row"
                    v-for="az in session.provider_protocol.avoid_zones"
                    :key="az.zone"
                  >
                    <span class="az-zone">{{ formatLabel(az.zone) }}:</span>
                    <span class="az-reason">{{ az.reason }}</span>
                  </div>
                </div>

                <!-- Endpoint Rules -->
                <div
                  class="checklist-container q-mb-md"
                  v-if="session.provider_protocol.endpoint_rules?.length"
                >
                  <div class="lbl-small q-mb-sm">🛑 Stop &amp; Safety Endpoint Rules</div>
                  <ul class="clinic-list danger-list">
                    <li v-for="rule in session.provider_protocol.endpoint_rules" :key="rule">
                      {{ rule }}
                    </li>
                  </ul>
                </div>

                <!-- Post Treatment Steps -->
                <div
                  class="checklist-container q-mb-md"
                  v-if="session.provider_protocol.post_treatment_steps?.length"
                >
                  <div class="lbl-small q-mb-sm">🧴 Post-treatment Recovery Steps</div>
                  <ul class="clinic-list">
                    <li v-for="step in session.provider_protocol.post_treatment_steps" :key="step">
                      {{ step }}
                    </li>
                  </ul>
                </div>

                <!-- Homecare Handover -->
                <div
                  class="checklist-container q-mb-md"
                  v-if="session.provider_protocol.homecare_handover?.length"
                >
                  <div class="lbl-small q-mb-sm">🤝 Client Handover Checklist</div>
                  <ul class="clinic-list">
                    <li v-for="h in session.provider_protocol.homecare_handover" :key="h">
                      {{ h }}
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Reassessment Gate -->
              <div
                class="reassess-box-roadmap q-mt-lg"
                v-if="session.reassessment_required || session.continue_if"
              >
                <div class="rb-title">🔄 Reassessment Gate</div>
                <div class="rb-body">
                  <div v-if="session.repeat_images?.length" class="repeat-images q-mb-sm">
                    Requires repeat imaging:
                    <div class="tag-group inline-group q-mt-xs">
                      <span class="sub-chip" v-for="img in session.repeat_images" :key="img">
                        {{ img }}
                      </span>
                    </div>
                  </div>
                  <div v-if="session.continue_if" class="continue-conditions">
                    <b>Criteria to continue:</b>
                    <ul class="clinic-list q-mt-xs">
                      <li v-if="session.continue_if.melanin_load_index_reduction_min">
                        Melanin Index Reduction:
                        <b>Min {{ session.continue_if.melanin_load_index_reduction_min }}</b>
                      </li>
                      <li v-if="session.continue_if.erythema_load_not_increased_by_more_than">
                        Erythema Index Increase:
                        <b
                          >Max {{ session.continue_if.erythema_load_not_increased_by_more_than }}</b
                        >
                      </li>
                      <li v-if="session.continue_if.no_new_sensitivity">
                        Skin Sensitivity: <b>No new sensitivity or stinging</b>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <!-- Authorization Box -->
              <div class="auth-details-box q-mt-lg" v-if="session.authorization">
                <div class="sub-sec-hdr">AUTHORIZATION DETAILS</div>
                <div class="auth-status-row q-mt-sm">
                  <div>
                    Doctor sign-off required:
                    <b>{{ session.authorization.doctor_signoff_required ? 'Yes' : 'No' }}</b>
                  </div>
                  <div>
                    Approval Status:
                    <span
                      :class="[
                        'auth-status-badge',
                        session.authorization.approval_status || 'pending',
                      ]"
                      >{{ formatLabel(session.authorization.approval_status || 'pending') }}</span
                    >
                  </div>
                </div>
                <div
                  class="auth-steps q-mt-md"
                  v-if="session.authorization.doctor_performed_steps?.length"
                >
                  <b>Doctor Performed Steps:</b>
                  <ul class="clinic-list q-mt-xs">
                    <li v-for="step in session.authorization.doctor_performed_steps" :key="step">
                      {{ step }}
                    </li>
                  </ul>
                </div>
                <div
                  class="auth-steps q-mt-md"
                  v-if="session.authorization.therapist_after_approval_steps?.length"
                >
                  <b>Therapist Approved Steps:</b>
                  <ul class="clinic-list q-mt-xs">
                    <li
                      v-for="step in session.authorization.therapist_after_approval_steps"
                      :key="step"
                    >
                      {{ step }}
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Nested Homecare -->
              <div class="nested-homecare-regime q-mt-lg" v-if="session.fixed_protocol?.homecare">
                <div class="hc-title">🏡 Homecare Regime</div>
                <div class="hc-row q-mt-sm">
                  <!-- MORNING -->
                  <div
                    class="hc-col morning"
                    v-if="session.fixed_protocol.homecare.morning?.length"
                  >
                    <div class="hc-col-hdr">☀️ Morning</div>
                    <ul class="hc-col-list">
                      <li v-for="(step, idx) in session.fixed_protocol.homecare.morning" :key="idx">
                        {{ formatLabel(step) }}
                      </li>
                    </ul>
                  </div>
                  <!-- NIGHT -->
                  <div class="hc-col night" v-if="session.fixed_protocol.homecare.night?.length">
                    <div class="hc-col-hdr">🌙 Night</div>
                    <ul class="hc-col-list">
                      <li v-for="(step, idx) in session.fixed_protocol.homecare.night" :key="idx">
                        {{ formatLabel(step) }}
                      </li>
                    </ul>
                  </div>
                  <!-- AVOID -->
                  <div class="hc-col avoid" v-if="session.fixed_protocol.homecare.avoid?.length">
                    <div class="hc-col-hdr">⚠️ Avoid</div>
                    <ul class="hc-col-list">
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
        <div class="twin">
          <div class="card" v-if="store.lastPlan.reassessment_plan.repeat_images?.length">
            <span class="lbl-small">Repeat Images Required</span>
            <div class="tag-group q-mt-sm">
              <span
                class="clinical-chip"
                v-for="mode in store.lastPlan.reassessment_plan.repeat_images"
                :key="mode"
              >
                {{ mode }}
              </span>
            </div>
          </div>
          <div class="card" v-if="store.lastPlan.reassessment_plan.metrics_to_compare?.length">
            <span class="lbl-small">Metrics to Compare</span>
            <div class="tag-group q-mt-sm">
              <span
                class="clinical-chip modifier"
                v-for="metric in store.lastPlan.reassessment_plan.metrics_to_compare"
                :key="metric"
              >
                {{ formatLabel(metric) }}
              </span>
            </div>
          </div>
        </div>
        <div
          class="decision-rules-card q-mt-md"
          v-if="store.lastPlan.reassessment_plan.decision_rules?.length"
        >
          <div class="dr-title">⚖️ Reassessment Decision Rules</div>
          <ul class="clinic-list q-mt-xs">
            <li v-for="rule in store.lastPlan.reassessment_plan.decision_rules" :key="rule">
              {{ rule }}
            </li>
          </ul>
        </div>
      </div>

      <!-- CLIENT COMM & COMMUNICATION REPORT -->
      <div class="pblock" v-if="store.lastPlan.client_report || store.lastPlan.whatsapp_summary">
        <h3><span class="bar"></span>Client Communication &amp; Report</h3>
        <div class="card client-report-card">
          <div class="cr-headline" v-if="store.lastPlan.client_report?.headline">
            "{{ store.lastPlan.client_report.headline }}"
          </div>
          <div
            class="cr-explanation q-mt-md"
            v-if="store.lastPlan.client_report?.simple_explanation"
          >
            {{ store.lastPlan.client_report.simple_explanation }}
          </div>
          <div class="cr-roadmap q-mt-lg" v-if="store.lastPlan.client_report?.roadmap?.length">
            <div class="lbl-small q-mb-sm">Patient Roadmap Milestones</div>
            <div class="milestones-wrap">
              <div
                class="milestone-item"
                v-for="(step, idx) in store.lastPlan.client_report.roadmap"
                :key="step"
              >
                <span class="m-num">{{ idx + 1 }}</span>
                <span class="m-txt">{{ step }}</span>
              </div>
            </div>
          </div>
          <div class="whatsapp-card-box q-mt-lg" v-if="store.lastPlan.whatsapp_summary?.message">
            <div class="wa-title">💬 WhatsApp Copy Summary</div>
            <div class="wa-text q-mt-sm">{{ store.lastPlan.whatsapp_summary.message }}</div>
          </div>
          <div
            class="disclaimer-text-block q-mt-lg"
            v-if="store.lastPlan.client_report?.disclaimer"
          >
            ⚠️ <b>Disclaimer:</b> {{ store.lastPlan.client_report.disclaimer }}
          </div>
        </div>
      </div>

      <!-- CLINICIAN SIGN-OFF LOCK PANEL -->
      <div class="signoff q-mt-xl" id="signoff">
        <h3 class="serif">Clinician review &amp; sign-off</h3>
        <div class="sub">
          Required before this plan can be issued to patient and exported. Notes are logged.
        </div>

        <label class="so-check">
          <input type="checkbox" v-model="soReviewed" :disabled="store.reviewState.finalized" />
          <span>I have reviewed this AI-proposed assessment and plan in full.</span>
        </label>

        <div
          style="
            font-size: 11px;
            font-weight: 700;
            color: var(--slate);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin: 12px 0 6px;
          "
        >
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

        <div
          style="
            font-size: 11px;
            font-weight: 700;
            color: var(--slate);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin: 16px 0 6px;
          "
        >
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
          class="btn btn-primary btn-block q-py-md text-weight-bold"
          @click="lockPlan"
          :disabled="store.reviewState.finalized || !soReviewed || !soDecision"
          style="font-size: 14px; border-radius: 10px"
        >
          Finalise &amp; Lock Plan
        </button>

        <!-- Stamp results -->
        <div
          :class="['stamp show', store.reviewState.decision === 'reject' ? 'no' : 'ok']"
          v-if="store.reviewState.finalized"
          id="soStamp"
          style="margin-top: 16px"
        >
          <div v-if="store.reviewState.decision === 'reject'">
            <b>Rejected.</b> Recorded for the pilot log.
            <div style="margin-top: 6px" v-if="store.reviewState.notes">
              Reason: {{ store.reviewState.notes }}
            </div>
            <button class="btn q-mt-md" @click="resetPlan">Start a new plan</button>
          </div>
          <div v-else>
            <b
              >✓ {{ store.reviewState.decision === 'edit' ? 'Approved with edits' : 'Approved' }}</b
            >
            by {{ store.reviewState.reviewer }} · {{ store.reviewState.ts?.toLocaleString() }}
            <div style="margin-top: 6px" v-if="store.reviewState.notes">
              Notes: {{ store.reviewState.notes }}
            </div>
            <div style="margin-top: 16px; display: flex; gap: 10px; flex-wrap: wrap">
              <button class="btn btn-primary" @click="$emit('trigger-print')">
                Export / Print
              </button>
              <button class="btn" @click="resetPlan">New Plan</button>
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
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
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

<style scoped>
/* ==========================================================================
   PLAN STAGE CLINICAL THEME (Matches DiagnosisStage and Assessment styles)
   ========================================================================== */

.plan-stage-pro {
  font-size: 14px;
}

/* Plan header stylings */
.plan-header-card {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 24px;
}

.plan-header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
}

.plan-name-title {
  font-size: 26px;
  font-weight: 600;
  color: var(--ink);
  margin: 0;
  line-height: 1.2;
}

.plan-status-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--slate);
}

.status-label {
  font-weight: 500;
}

.status-badge {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 4px;
}

.status-badge.pending {
  background: var(--amber-wash);
  color: var(--amber);
  border: 1px solid #e8d3a0;
}
.status-badge.approved {
  background: var(--good-wash);
  color: var(--good);
  border: 1px solid #bbd9c8;
}

.duration-badge {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  background: var(--violet-wash);
  color: var(--violet);
  padding: 6px 14px;
  border-radius: 99px;
  border: 1px solid #c9beea;
}

/* Recommendation Profile */
.recommendation-mode-box {
  background: #fbfbfa;
  border: 1px dashed var(--line);
  border-radius: var(--radius-sm);
  padding: 18px;
}

.rm-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--violet);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}

.rm-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.rm-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rm-lbl {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--slate);
  letter-spacing: 0.03em;
}

.rm-val {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--ink);
  line-height: 1.4;
}

/* Scorecard color overrides for baseline metrics */
.scorecard.mel {
  background: var(--melanin-wash);
  border-color: var(--melanin-soft);
  color: var(--melanin);
}
.scorecard.mel .sv {
  color: var(--melanin);
}

.scorecard.ery {
  background: var(--erythema-wash);
  border-color: #e2a9b5;
  color: var(--erythema);
}
.scorecard.ery .sv {
  color: var(--erythema);
}

.scorecard.depth {
  background: var(--violet-wash);
  border-color: #c9beea;
  color: var(--violet);
}
.scorecard.depth .sv-text {
  font-size: 16px;
  font-weight: 700;
  margin: 8px 0;
  color: var(--violet);
}

.scorecard.comp {
  background: var(--amber-wash);
  border-color: #e8d3a0;
  color: var(--amber);
}
.scorecard.comp .sv-text {
  font-size: 16px;
  font-weight: 700;
  margin: 8px 0;
  color: var(--amber);
}

.scorecard.mmasi {
  background: var(--good-wash);
  border-color: #bbd9c8;
  color: var(--good);
}
.scorecard.mmasi .sv {
  color: var(--good);
}

.scorecard .su {
  font-size: 13px;
  font-weight: 500;
  opacity: 0.65;
  font-family: inherit;
}

/* Clinical driver tags styling */
.drivers-container {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 16px;
}

.dc-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--slate);
  min-width: 140px;
}

.tag-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.clinical-chip {
  font-size: 12px;
  font-weight: 600;
  background: var(--line-soft);
  color: var(--ink);
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid var(--line);
}

.clinical-chip.modifier {
  background: var(--amber-wash);
  color: var(--amber);
  border-color: #e8d3a0;
}

/* Goal Cards Grid */
.goals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 18px;
  margin-top: 12px;
}

.goal-card {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 20px;
}

.g-header {
  border-bottom: 1.5px solid var(--line-soft);
  padding-bottom: 8px;
  margin-bottom: 12px;
}

.g-timeframe {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--violet);
  background: var(--violet-wash);
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid #c9beea;
}

.g-clinical {
  line-height: 1.45;
}

.g-lbl {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--slate);
  display: block;
  margin-bottom: 4px;
}

.g-val-text {
  font-size: 14.5px;
  font-weight: 600;
  color: var(--ink);
}

.g-metrics-box {
  background: var(--porcelain);
  border-radius: var(--radius-sm);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.g-metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: var(--slate);
  padding-bottom: 4px;
  border-bottom: 1px dashed var(--line-soft);
}

.g-metric-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.g-metric-row .val {
  font-family: 'IBM Plex Mono', monospace;
  font-weight: 700;
  color: var(--ink);
}

.g-metric-row .val-text {
  font-weight: 700;
  color: var(--ink);
}

.regional-goals-container {
  border-top: 1px dashed var(--line);
  padding-top: 12px;
}

.rg-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--slate);
  margin-bottom: 6px;
}

.rg-row {
  display: flex;
  justify-content: space-between;
  font-size: 12.5px;
  color: var(--slate);
  padding: 4px 0;
}

.rg-name {
  font-weight: 500;
}

.rg-vals {
  font-family: 'IBM Plex Mono', monospace;
}

/* Laser setting optimizer details */
.laser-selected-card {
  border: 1px solid #c9beea;
  background: var(--violet-wash);
  padding: 20px;
}

.ls-banner {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  color: var(--violet);
  letter-spacing: 0.05em;
}

.ls-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
  gap: 12px;
}

.ls-item {
  background: var(--paper);
  border: 1px solid #c9beea;
  border-radius: 8px;
  padding: 10px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.ls-item .lbl {
  font-size: 10px;
  font-weight: 700;
  color: var(--slate);
  text-transform: uppercase;
  margin-bottom: 2px;
}

.ls-item .val {
  font-size: 14.5px;
  font-weight: 700;
  font-family: 'IBM Plex Mono', monospace;
  color: var(--ink);
}

.ls-reason {
  font-size: 13px;
  color: var(--ink);
  line-height: 1.5;
  background: var(--paper);
  padding: 12px;
  border-radius: 8px;
  border-left: 3.5px solid var(--violet);
  margin-top: 20px;
}

/* Clean markup tables */
.table-title {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: var(--ink);
  border-bottom: 1.5px solid var(--line-soft);
}

.clinic-table-wrap {
  overflow-x: auto;
  width: 100%;
}

.clinic-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 13px;
}

.clinic-table th {
  background: var(--porcelain);
  color: var(--slate);
  font-weight: 700;
  padding: 12px 14px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 2.5px solid var(--line);
}

.clinic-table td {
  padding: 14px;
  border-bottom: 1.5px solid var(--line-soft);
  color: var(--ink);
  vertical-align: middle;
}

.clinic-table.compact th {
  padding: 8px 10px;
  font-size: 10px;
}

.clinic-table.compact td {
  padding: 10px;
  font-size: 12px;
}

.clinic-table tr:hover {
  background: #fbfbfa;
}

.score-pill {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  display: inline-block;
}

.score-pill.good {
  background: var(--good-wash);
  color: var(--good);
  border: 1px solid #bbd9c8;
}

.score-pill.safe {
  background: var(--violet-wash);
  color: var(--violet);
  border: 1px solid #c9beea;
}

.score-pill.overall {
  background: var(--amber-wash);
  color: var(--amber);
  border: 1px solid #e8d3a0;
}

.clinic-table td:not(.rationale-col),
.clinic-table th:not(:last-child) {
  white-space: nowrap;
}

.rationale-col {
  color: var(--slate);
  font-size: 12.5px;
  line-height: 1.45;
  min-width: 360px;
  width: 100%;
}

/* Timeline Components */
.clinic-timeline {
  position: relative;
  margin-top: 24px;
  padding-left: 20px;
}

.clinic-timeline::before {
  content: '';
  position: absolute;
  left: 36px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: var(--line);
  z-index: 0;
}

.timeline-block {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 32px;
  position: relative;
  z-index: 1;
}

.timeline-block:last-child {
  margin-bottom: 0;
}

.timeline-icon {
  flex: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--paper);
  border: 2px solid var(--violet);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.sess-title {
  font-size: 8px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--slate);
  line-height: 1;
}

.sess-num {
  font-size: 12px;
  font-weight: 700;
  color: var(--violet);
  line-height: 1;
}

.timeline-card {
  flex: 1;
  padding: 24px;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.timeline-card:hover {
  transform: translateX(4px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.03);
}

.sess-timing {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--violet);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.sess-goal {
  font-family: 'Fraunces', serif;
  font-size: 19px;
  font-weight: 500;
  color: var(--ink);
  margin-top: 4px;
}

.modalities-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.mod-chip {
  font-size: 11px;
  font-weight: 600;
  background: var(--line-soft);
  color: var(--slate);
  padding: 3px 10px;
  border-radius: 4px;
  border: 1px solid var(--line);
}

/* Roadmap Sub-sections */
.roadmap-sub-section {
  border-top: 1.5px solid var(--line-soft);
  padding-top: 18px;
}

.sub-sec-hdr {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--slate);
  background: var(--porcelain);
  padding: 3px 8px;
  border-radius: 4px;
  display: inline-block;
  border: 1px solid var(--line-soft);
}

.proc-title-row {
  font-size: 14px;
}

.proc-detail-box {
  background: var(--porcelain);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-sm);
  padding: 14px;
  margin-bottom: 16px;
}

.proc-detail-box .box-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--ink);
  margin-bottom: 8px;
  border-bottom: 1px dashed var(--line);
  padding-bottom: 4px;
}

.params-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 10px;
  font-size: 13px;
  color: var(--slate);
}

.params-row b {
  color: var(--ink);
}

.lbl-small {
  font-size: 12px;
  font-weight: 700;
  color: var(--slate);
}

.sub-chip {
  font-size: 11px;
  font-weight: 600;
  background: var(--paper);
  border: 1px solid var(--line);
  color: var(--ink);
  padding: 2px 8px;
  border-radius: 4px;
}

.sub-chip.active-chip {
  background: var(--violet-wash);
  color: var(--violet);
  border-color: #c9beea;
}

.inline-group {
  display: inline-flex;
  margin-left: 8px;
  vertical-align: middle;
}

.led-card-banner {
  background: var(--good-wash);
  color: var(--good);
  font-size: 13px;
  font-weight: 600;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  border-left: 4px solid var(--good);
  margin-bottom: 16px;
}

.decision-card-banner {
  background: var(--amber-wash);
  color: #6a4914;
  font-size: 13px;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  border-left: 4px solid var(--amber);
  margin-bottom: 16px;
}

.checklist-container {
  background: var(--paper);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-sm);
  padding: 14px;
  margin-bottom: 16px;
}

.clinic-list {
  list-style: none;
  padding-left: 0;
  margin: 0;
}

.clinic-list li {
  font-size: 13px;
  color: var(--ink);
  padding: 4px 0 4px 18px;
  position: relative;
  line-height: 1.4;
}

.clinic-list li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--good);
  font-weight: 700;
}

.clinic-list.danger-list li::before {
  content: '🛑';
  color: var(--erythema);
  font-size: 11px;
  left: -2px;
}

.modifier-actions-card {
  background: var(--erythema-wash);
  border-left: 4px solid var(--erythema);
  border-radius: var(--radius-sm);
  padding: 14px;
  margin-bottom: 16px;
}

.ma-title {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--erythema);
  margin-bottom: 8px;
}

.ma-row {
  display: flex;
  gap: 8px;
  font-size: 13px;
  margin-bottom: 4px;
}

.ma-row:last-child {
  margin-bottom: 0;
}

.ma-region {
  font-weight: 700;
  color: var(--ink);
  min-width: 90px;
}

.ma-action {
  color: var(--slate);
}

/* Provider protocol performed by badge */
.performed-by-row {
  font-size: 13.5px;
}

.role-badge {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 4px;
}

.role-badge.doctor {
  background: var(--erythema-wash);
  color: var(--erythema);
  border: 1px solid #e2a9b5;
}

.role-badge.therapist {
  background: var(--violet-wash);
  color: var(--violet);
  border: 1px solid #c9beea;
}

.z-name {
  font-weight: 700;
}

.z-reason {
  font-size: 11px;
  color: var(--slate);
  margin-top: 2px;
}

.z-settings {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11.5px;
  background: var(--porcelain);
  padding: 3px 6px;
  border-radius: 4px;
  display: inline-block;
  border: 1px solid var(--line-soft);
}

.table-container-mini {
  margin-bottom: 16px;
}

.avoid-zones-card {
  background: var(--erythema-wash);
  border-left: 4px solid var(--erythema);
  border-radius: var(--radius-sm);
  padding: 14px;
  margin-bottom: 16px;
}

.az-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--erythema);
  margin-bottom: 8px;
}

.az-row {
  font-size: 13px;
  margin-bottom: 4px;
}

.az-zone {
  font-weight: 700;
}

.az-reason {
  color: var(--slate);
  margin-left: 4px;
}

/* Reassessment box on roadmap */
.reassess-box-roadmap {
  background: var(--porcelain);
  border: 1px dashed var(--line);
  border-radius: var(--radius-sm);
  padding: 16px;
  margin-bottom: 16px;
}

.rb-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--violet);
  text-transform: uppercase;
  margin-bottom: 8px;
}

.rb-body {
  font-size: 13px;
  color: var(--slate);
}

/* Auth box */
.auth-details-box {
  background: var(--porcelain);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-sm);
  padding: 16px;
  margin-bottom: 16px;
}

.auth-status-row {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 13px;
}

.auth-status-badge {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: uppercase;
}

.auth-status-badge.pending {
  background: var(--amber-wash);
  color: var(--amber);
  border: 1px solid #e8d3a0;
}

.auth-status-badge.doctor_approved {
  background: var(--good-wash);
  color: var(--good);
  border: 1px solid #bbd9c8;
}

/* Nested Homecare styling */
.nested-homecare-regime {
  background: var(--porcelain);
  border-radius: var(--radius-sm);
  padding: 18px;
  border: 1px solid var(--line-soft);
  margin-bottom: 16px;
}

.hc-title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--melanin);
}

.hc-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.hc-col {
  border-radius: var(--radius-sm);
  padding: 14px;
  background: var(--paper);
  border: 1px solid var(--line);
}

.hc-col.morning {
  background: var(--amber-wash);
  border-color: #fcd34d;
}

.hc-col.night {
  background: var(--violet-wash);
  border-color: #c0b2f0;
}

.hc-col.avoid {
  background: var(--erythema-wash);
  border-color: #fca5a5;
}

.hc-col-hdr {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 10px;
  border-bottom: 1.5px solid rgba(0, 0, 0, 0.05);
  padding-bottom: 6px;
}

.morning .hc-col-hdr {
  color: var(--amber);
}
.night .hc-col-hdr {
  color: var(--violet);
}
.avoid .hc-col-hdr {
  color: var(--erythema);
}

.hc-col-list {
  list-style: none;
  padding-left: 0;
  margin: 0;
}

.hc-col-list li {
  font-size: 12.5px;
  color: var(--ink);
  padding: 3px 0 3px 12px;
  position: relative;
}

.hc-col-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--slate);
}

.morning .hc-col-list li::before {
  color: var(--amber);
}
.night .hc-col-list li::before {
  color: var(--violet);
}
.avoid .hc-col-list li::before {
  color: var(--erythema);
}

/* Reassessment Plan decision rules */
.decision-rules-card {
  background: var(--porcelain);
  border-radius: var(--radius-sm);
  padding: 16px;
  border: 1px solid var(--line-soft);
}

.dr-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--violet);
}

/* Client report card styles */
.client-report-card {
  padding: 24px;
}

.cr-headline {
  font-family: 'Fraunces', serif;
  font-size: 20px;
  font-weight: 600;
  color: var(--violet);
  font-style: italic;
  line-height: 1.35;
}

.cr-explanation {
  font-size: 14.5px;
  color: var(--ink);
  line-height: 1.6;
}

.milestones-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.milestone-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--porcelain);
  border: 1px solid var(--line-soft);
  border-radius: 8px;
  padding: 10px 14px;
}

.milestone-item .m-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--violet);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  display: grid;
  place-items: center;
  flex: none;
}

.milestone-item .m-txt {
  font-size: 13.5px;
  color: var(--ink);
}

.whatsapp-card-box {
  background: #e8f5e9;
  border-radius: var(--radius-sm);
  padding: 16px;
  border-left: 4.5px solid #4caf50;
  margin-top: 20px;
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
  font-size: 12.5px;
  color: #1b5e20;
  white-space: pre-line;
  line-height: 1.5;
}

.disclaimer-text-block {
  font-size: 12.5px;
  color: var(--slate);
  background: var(--porcelain);
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  line-height: 1.5;
  margin-top: 20px;
}
</style>
