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
      v-if="store.diagnosis?.data && !store.treatmentPlanningReady && !store.isLoading"
      class="err-box q-mb-lg"
      role="alert"
    >
      <b>Doctor review required before generating a plan.</b>
      <div v-for="item in store.blockingDoctorActionItems" :key="item.action_id" class="q-mt-sm">
        {{ item.action_id }} — {{ item.title }}: {{ item.selectedOption.label }}
        <div v-if="item.selectedOption.planning_directive">{{ item.selectedOption.planning_directive }}</div>
      </div>
      <p class="q-mt-sm">Review doctor decisions, required classifications and treatment priorities in the Diagnosis step.</p>
      <button class="btn btn-primary" @click="store.currentStage = 2">Review doctor decisions</button>
    </div>
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
      <p class="note q-mx-auto q-mb-lg" style="line-height: 1.5">
        OpenAI will construct a tiered treatment plan tailored to the confirmed diagnosis. Standard
        safety rules apply (pregnancy, thromboembolic checks, hydroquinone limits, Fitzpatrick FST
        limits).
      </p>
      <button
        class="btn btn-primary q-mt-md"
        @click="runGeneratePlan"
        :disabled="!store.diagnosis?.confirmedDx || !store.treatmentPlanningReady"
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
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap">
            <q-select
              v-model="store.therapist_id"
              :options="therapists"
              label="Assigned Therapist"
              outlined
              dense
              rounded
              emit-value
              map-options
              options-dense
              color="amber-8"
              @update:model-value="updateTherapist"
              style="min-width: 180px"
              class="therapist-select"
              :class="{ 'therapist-missing': !store.therapist_id }"
              :error="!store.therapist_id"
              hide-bottom-space
            >
              <template v-slot:prepend>
                <q-icon name="supervised_user_circle" color="amber-8" />
              </template>
            </q-select>

            <button
              class="btn-regenerate"
              @click="runGeneratePlan"
              :disabled="store.reviewState.finalized || store.isLoading || !store.treatmentPlanningReady"
              v-if="!store.reviewState.finalized"
              id="reGenPlanBtn"
            >
              ✦ Re-generate plan
            </button>
            <span class="duration-badge"
              >Duration: {{ formatTiming(store.lastPlan.duration) }}</span
            >
          </div>
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
          <div
            class="scorecard mel"
            v-if="
              store.lastPlan.baseline_summary.global_background_melanin_load_index !== undefined ||
              store.lastPlan.baseline_summary.melanin_load_index !== undefined
            "
          >
            <span class="sl">Melanin Load</span>
            <div class="sv">
              {{
                store.lastPlan.baseline_summary.global_background_melanin_load_index ??
                store.lastPlan.baseline_summary.melanin_load_index
              }}<span class="su">/100</span>
            </div>
          </div>
          <div
            class="scorecard ery"
            v-if="
              store.lastPlan.baseline_summary.global_background_erythema_load_index !== undefined ||
              store.lastPlan.baseline_summary.erythema_load_index !== undefined
            "
          >
            <span class="sl">Erythema Load</span>
            <div class="sv">
              {{
                store.lastPlan.baseline_summary.global_background_erythema_load_index ??
                store.lastPlan.baseline_summary.erythema_load_index
              }}<span class="su">/100</span>
            </div>
          </div>
          <div
            class="scorecard ery"
            v-if="
              store.lastPlan.baseline_summary.active_inflammatory_lesion_burden_index !== undefined
            "
          >
            <span class="sl">Active Inflammatory Burden</span>
            <div class="sv">
              {{ store.lastPlan.baseline_summary.active_inflammatory_lesion_burden_index
              }}<span class="su">/100</span>
            </div>
          </div>
          <div
            class="scorecard mel"
            v-if="
              store.lastPlan.baseline_summary.flat_focal_pigmented_lesion_burden_index !== undefined
            "
          >
            <span class="sl">Flat Focal Pigment Burden</span>
            <div class="sv">
              {{ store.lastPlan.baseline_summary.flat_focal_pigmented_lesion_burden_index
              }}<span class="su">/100</span>
            </div>
          </div>
          <div
            class="scorecard depth"
            v-if="
              store.lastPlan.baseline_summary.raised_pigmented_lesion_burden_index !== undefined
            "
          >
            <span class="sl">Raised Pigment Burden</span>
            <div class="sv">
              {{ store.lastPlan.baseline_summary.raised_pigmented_lesion_burden_index
              }}<span class="su">/100</span>
            </div>
          </div>
          <div
            class="scorecard depth"
            v-if="
              store.lastPlan.baseline_summary.structural_periocular_shadow_burden_index !==
              undefined
            "
          >
            <span class="sl">Periocular Shadow Burden</span>
            <div class="sv">
              {{ store.lastPlan.baseline_summary.structural_periocular_shadow_burden_index
              }}<span class="su">/100</span>
            </div>
          </div>
          <div class="scorecard depth" v-if="store.lastPlan.baseline_summary.depth_call">
            <span class="sl">Depth Verdict</span>
            <div class="sv-text">{{ formatLabel(store.lastPlan.baseline_summary.depth_call) }}</div>
          </div>
          <div class="scorecard comp" v-if="store.lastPlan.baseline_summary.composition">
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

      <!-- FULL COURSE SUMMARY -->
      <div class="pblock" v-if="store.lastPlan.full_course_summary">
        <h3><span class="bar" style="background: var(--violet)"></span>Full Course Summary</h3>
        <div class="card bg-grey-1 q-pa-md q-mb-md" style="border: 1px solid var(--line)">
          <div class="row q-col-gutter-md">
            <div class="col-xs-12 col-sm-4 text-center">
              <div class="text-caption text-grey-7 uppercase">Total Planned Sessions</div>
              <div class="text-h5 text-weight-bold text-teal-9">
                {{ store.lastPlan.full_course_summary.total_planned_sessions }} Sessions
              </div>
            </div>
            <div class="col-xs-12 col-sm-4 text-center border-left">
              <div class="text-caption text-grey-7 uppercase">Course Duration</div>
              <div class="text-h5 text-weight-bold text-teal-9">
                {{ store.lastPlan.full_course_summary.course_duration }}
              </div>
            </div>
            <div class="col-xs-12 col-sm-4 text-center border-left">
              <div class="text-caption text-grey-7 uppercase">First Reassessment</div>
              <div class="text-subtitle1 text-weight-bold text-teal-9">
                After Session {{ store.lastPlan.full_course_summary.first_reassessment_after_session }}
              </div>
            </div>
          </div>

          <q-separator class="q-my-md" v-if="store.lastPlan.full_course_summary.package_summary_text" />
          <div v-if="store.lastPlan.full_course_summary.package_summary_text" class="text-caption text-grey-8">
            <strong>Summary:</strong> {{ store.lastPlan.full_course_summary.package_summary_text }}
          </div>

          <q-separator class="q-my-md" v-if="store.lastPlan.full_course_summary.planned_modality_allocation?.length" />

          <!-- Modality Allocation -->
          <div v-if="store.lastPlan.full_course_summary.planned_modality_allocation?.length">
            <div class="text-subtitle2 text-weight-bold q-mb-sm text-grey-8">
              Planned Modality Allocation:
            </div>
            <div class="row q-col-gutter-sm">
              <div
                v-for="alloc in store.lastPlan.full_course_summary.planned_modality_allocation"
                :key="alloc.protocol_id || alloc.modality_id"
                class="col-xs-12 col-sm-6"
              >
                <div class="bg-white q-pa-sm rounded-lg border flex items-start gap-2" style="border: 1px solid #e2e8f0; height: 100%;">
                  <q-icon name="flash_on" color="primary" size="20px" class="q-mt-xs" />
                  <div>
                    <div class="text-weight-bold text-dark" style="font-size: 13px">
                      {{ formatLabel(alloc.modality_id) }} (x{{ alloc.planned_uses }} uses)
                    </div>
                    <div class="text-caption text-grey-7">
                      Protocol: <code>{{ alloc.protocol_id }}</code> | Sessions: {{ alloc.session_numbers?.join(', ') }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <q-separator class="q-my-md" v-if="store.lastPlan.full_course_summary.supportive_inclusions?.length" />

          <!-- Supportive Inclusions -->
          <div v-if="store.lastPlan.full_course_summary.supportive_inclusions?.length">
            <div class="text-subtitle2 text-weight-bold q-mb-sm text-grey-8">
              Supportive Inclusions:
            </div>
            <div class="row q-col-gutter-sm">
              <div
                v-for="inc in store.lastPlan.full_course_summary.supportive_inclusions"
                :key="inc.protocol_id || inc.modality_id"
                class="col-xs-12 col-sm-6"
              >
                <div class="bg-white q-pa-sm rounded-lg border flex items-start gap-2" style="border: 1px solid #e2e8f0; height: 100%;">
                  <q-icon name="healing" color="green" size="20px" class="q-mt-xs" />
                  <div>
                    <div class="text-weight-bold text-dark" style="font-size: 13px">
                      {{ formatLabel(inc.modality_id) }} (x{{ inc.planned_uses }} uses)
                    </div>
                    <div class="text-caption text-grey-7">
                      Protocol: <code>{{ inc.protocol_id }}</code> | Sessions: {{ inc.session_numbers?.join(', ') }}
                      <div v-if="inc.note" style="margin-top: 2px; font-style: italic; color: #475569;">Note: {{ inc.note }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- COMPONENT TREATMENT MAP -->
      <div class="pblock" v-if="store.lastPlan.component_treatment_map?.length">
        <h3><span class="bar" style="background: var(--violet)"></span>Component Treatment Map</h3>
        <div style="display: flex; flex-direction: column; gap: 16px">
          <div
            class="card q-pa-md"
            v-for="map in store.lastPlan.component_treatment_map"
            :key="map.diagnostic_component_id"
            style="border-left: 4px solid var(--violet); background: #ffffff"
          >
            <div class="flex justify-between items-start flex-wrap q-mb-sm">
              <div>
                <div class="flex items-center gap-2">
                  <span class="id-badge-lg" v-if="map.diagnostic_component_id">{{ map.diagnostic_component_id }}</span>
                  <div class="text-weight-bold text-subtitle2 text-indigo-9" style="font-size: 14px">
                    {{ formatLabel(map.working_diagnosis) }}
                  </div>
                </div>
                <div class="text-caption text-grey-6 q-mt-xs flex items-center gap-1 flex-wrap">
                  <span>Region: <b>{{ map.regions ? map.regions.map(formatLabel).join(', ') : formatLabel(map.clinical_location_text || map.target_location_text) }}</b> | Scope:
                  <b>{{ formatLabel(map.scope) }}</b></span>
                  <span v-if="map.linked_group_ids?.length"> | Linked Groups: 
                    <span v-for="gId in map.linked_group_ids" :key="gId" class="id-badge-inline q-ml-xs">
                      {{ gId }}
                      <q-tooltip class="id-tooltip-custom">
                        <div class="text-weight-bold text-amber-4">{{ gId }} Details</div>
                        <div v-if="getComponentInfo(gId)">
                          <div class="text-weight-bold" style="font-size: 12px;">{{ getComponentInfo(gId).diagnosis }}</div>
                          <div class="text-caption text-grey-4 q-mt-xs" style="font-size: 11px;">{{ getComponentInfo(gId).location }}</div>
                        </div>
                      </q-tooltip>
                    </span>
                  </span>
                </div>
              </div>
              <div class="flex items-center gap-2 flex-wrap">
                <span
                  class="status-badge"
                  :class="map.treatment_eligibility"
                  :style="
                    map.treatment_eligibility === 'eligible'
                      ? 'background: #e8f5e9; color: #2e7d32;'
                      : 'background: #ffebee; color: #c62828;'
                  "
                >
                  {{ formatLabel(map.treatment_eligibility) }}
                </span>
                <span
                  v-if="map.course_allocation_status"
                  class="status-badge"
                  style="background: #e0f2f1; color: #004d40; border: 1px solid #b2dfdb;"
                >
                  {{ formatLabel(map.course_allocation_status) }}
                </span>
                <span
                  v-if="map.doctor_validation_required"
                  class="status-badge"
                  style="background: #fff3e0; color: #e65100; border: 1px solid #ffe0b2;"
                >
                  Doctor Review Required
                </span>
              </div>
            </div>

            <q-separator class="q-my-sm" />

            <div class="row q-col-gutter-sm text-caption">
              <div class="col-xs-12 col-sm-6">
                <div>
                  <strong>Selected Modality:</strong> {{ formatLabel(map.selected_modality_id || map.selected_modality) }}
                </div>
                <div v-if="map.selected_protocol_id || map.selected_product_or_protocol_id" class="text-grey-7">
                  Protocol: <code>{{ map.selected_protocol_id || map.selected_product_or_protocol_id }}</code>
                </div>
              </div>
              <div class="col-xs-12 col-sm-6" v-if="map.nearest_reasonable_alternative || map.nearest_alternative">
                <div>
                  <strong>Nearest Alternative:</strong>
                  {{ map.nearest_reasonable_alternative ? formatLabel(map.nearest_reasonable_alternative.modality_id) : formatLabel(map.nearest_alternative) }}
                  <span v-if="map.nearest_reasonable_alternative?.protocol_id" class="text-grey-7">
                    (Protocol: <code>{{ map.nearest_reasonable_alternative.protocol_id }}</code>)
                  </span>
                </div>
              </div>
            </div>

            <div class="q-mt-sm" v-if="map.why_selected_over_alternative?.length">
              <div
                class="text-weight-medium text-grey-8"
                style="font-size: 11.5px; text-transform: uppercase"
              >
                Modality Selection Rationale:
              </div>
              <ul class="clinic-list q-mt-xs q-mb-none" style="padding-left: 15px">
                <li
                  v-for="reason in map.why_selected_over_alternative"
                  :key="reason"
                  style="font-size: 12px; color: #334155"
                >
                  {{ reason }}
                </li>
              </ul>
            </div>

            <div
              class="q-mt-md bg-grey-1 q-pa-sm rounded text-caption"
              style="border-left: 2.5px solid var(--violet); color: #2d3748"
            >
              <strong>Likely component level changes:</strong> {{ map.expected_response }}
            </div>
          </div>
        </div>
      </div>

      <!-- CLINICAL COMPONENT & ID REFERENCE INDEX -->
      <div class="pblock" v-if="Object.keys(componentIdMap).length">
        <div class="flex items-center justify-between q-mb-sm">
          <h3 class="q-mb-none"><span class="bar" style="background: #4f46e5"></span>Clinical ID Reference Index (Component Dictionary)</h3>
          <q-badge color="indigo-9" outline class="text-weight-bold" style="font-size: 11px;">
            {{ Object.keys(componentIdMap).length }} Registered IDs
          </q-badge>
        </div>
        <p class="text-caption text-grey-7 q-mb-md">
          Quick clinical guide explaining what each <code>DC_xxx</code> (Diagnostic Component), <code>PG_xxx</code> (Pigment Group), and <code>PM_xxx</code> (Modifier Group) code represents.
        </p>

        <div class="card q-pa-none" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <div class="clinic-table-wrap">
            <table class="clinic-table compact" style="margin-bottom: 0;">
              <thead>
                <tr style="background: #f8fafc;">
                  <th style="width: 100px;">ID Code</th>
                  <th style="width: 140px;">Type</th>
                  <th style="min-width: 200px;">Diagnosis / Title</th>
                  <th style="min-width: 250px;">Clinical Location &amp; Details</th>
                  <th style="width: 140px;">Status / Eligibility</th>
                  <th style="width: 120px;">Linked IDs</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idKey) in componentIdMap" :key="idKey">
                  <td>
                    <span class="id-badge-inline text-weight-bold" style="font-size: 12px; padding: 2px 8px;">
                      {{ item.id }}
                    </span>
                  </td>
                  <td>
                    <span class="text-caption text-grey-8 text-weight-medium">
                      {{ item.type || 'Component' }}
                    </span>
                  </td>
                  <td>
                    <div class="text-weight-bold text-indigo-10" style="font-size: 12.5px; line-height: 1.3;">
                      {{ item.diagnosis }}
                    </div>
                    <div v-if="item.protocol && item.protocol !== '—'" class="text-caption text-grey-6 q-mt-xs">
                      Protocol: <code>{{ item.protocol }}</code>
                    </div>
                  </td>
                  <td style="font-size: 12px; color: #334155; line-height: 1.4;">
                    {{ item.location }}
                  </td>
                  <td>
                    <span
                      class="status-badge"
                      :style="
                        item.eligibility === 'eligible' || item.eligibility === 'Active'
                          ? 'background: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9;'
                          : 'background: #fff3e0; color: #e65100; border: 1px solid #ffe0b2;'
                      "
                    >
                      {{ formatLabel(item.eligibility) }}
                    </span>
                  </td>
                  <td>
                    <div v-if="item.linkedGroups?.length" class="flex gap-1 flex-wrap">
                      <span v-for="gId in item.linkedGroups" :key="gId" class="id-badge-inline" style="font-size: 10.5px;">
                        {{ gId }}
                        <q-tooltip class="id-tooltip-custom">
                          <div class="text-weight-bold text-amber-4">{{ gId }} Details</div>
                          <div v-if="getComponentInfo(gId)">
                            <div class="text-weight-bold">{{ getComponentInfo(gId).diagnosis }}</div>
                            <div class="text-caption text-grey-4 q-mt-xs">{{ getComponentInfo(gId).location }}</div>
                          </div>
                        </q-tooltip>
                      </span>
                    </div>
                    <span v-else class="text-grey-5">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
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
                  goals.melanin_load_index_target_max !== undefined ||
                  goals.global_background_melanin_target !== undefined
                "
              >
                <span class="lbl">Melanin Target</span>
                <span class="val"
                  >{{
                    goals.melanin_load_target ??
                    goals.melanin_load_index_target_max ??
                    goals.global_background_melanin_target
                  }}/100</span
                >
              </div>
              <div
                class="g-metric-row"
                v-if="
                  goals.erythema_load_target !== undefined ||
                  goals.erythema_load_index_target_max !== undefined ||
                  goals.global_background_erythema_target !== undefined
                "
              >
                <span class="lbl">Erythema Target</span>
                <span class="val"
                  >{{
                    goals.erythema_load_target ??
                    goals.erythema_load_index_target_max ??
                    goals.global_background_erythema_target
                  }}/100</span
                >
              </div>
              <div
                class="g-metric-row"
                v-if="goals.active_inflammatory_burden_target !== undefined"
              >
                <span class="lbl">Inflammatory Target</span>
                <span class="val">{{ goals.active_inflammatory_burden_target }}/100</span>
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

            <!-- Component Targets -->
            <div class="regional-goals-container q-mt-md" v-if="goals.component_targets?.length">
              <div class="rg-title">📍 Component Targets</div>
              <div
                class="rg-row"
                v-for="ct in goals.component_targets"
                :key="ct.diagnostic_component_id"
              >
                <span class="rg-name">{{ formatLabel(ct.metric) }}</span>
                <span class="rg-vals"
                  >{{ ct.baseline }} → <b>{{ ct.target }}</b></span
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
                  <th style="min-width: 140px">Laser Settings</th>
                  <th style="min-width: 130px">Scores</th>
                  <th>Scope &amp; Regions</th>
                  <th style="max-width: 320px">Rationale</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(cand, idx) in store.lastPlan.q_switch_optimizer.candidate_settings"
                  :key="idx"
                >
                  <td>
                    <div style="font-weight: bold; font-size: 13px; color: #0f172a">
                      {{ cand.wavelength_nm }} nm
                    </div>
                    <div style="font-size: 11.5px; color: #475569; margin-top: 4px">
                      {{ cand.energy_mj }} mJ • {{ cand.fluence_j_cm2 }} J/cm²
                    </div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 2px">
                      {{ cand.frequency_hz }} Hz • {{ cand.passes }}
                      {{ cand.passes > 1 ? 'passes' : 'pass' }}
                    </div>
                  </td>
                  <td>
                    <div style="display: flex; flex-direction: column; gap: 4px; font-size: 11px">
                      <div
                        v-if="
                          cand.efficacy_score_100 !== undefined && cand.efficacy_score_100 !== null
                        "
                        style="
                          display: flex;
                          align-items: center;
                          justify-content: space-between;
                          gap: 8px;
                        "
                      >
                        <span>Efficacy:</span>
                        <span class="score-pill good" style="font-size: 10px; padding: 1px 4px"
                          >{{ cand.efficacy_score_100 }}/100</span
                        >
                      </div>
                      <div
                        v-if="cand.safety_score_100 !== undefined && cand.safety_score_100 !== null"
                        style="
                          display: flex;
                          align-items: center;
                          justify-content: space-between;
                          gap: 8px;
                        "
                      >
                        <span>Safety:</span>
                        <span class="score-pill safe" style="font-size: 10px; padding: 1px 4px"
                          >{{ cand.safety_score_100 }}/100</span
                        >
                      </div>
                      <div
                        v-if="
                          cand.downtime_score_100 !== undefined && cand.downtime_score_100 !== null
                        "
                        style="
                          display: flex;
                          align-items: center;
                          justify-content: space-between;
                          gap: 8px;
                        "
                      >
                        <span>Downtime:</span>
                        <span class="score-pill safe" style="font-size: 10px; padding: 1px 4px"
                          >{{ cand.downtime_score_100 }}/100</span
                        >
                      </div>
                      <div
                        v-if="
                          cand.recurrence_prevention_score_100 !== undefined &&
                          cand.recurrence_prevention_score_100 !== null
                        "
                        style="
                          display: flex;
                          align-items: center;
                          justify-content: space-between;
                          gap: 8px;
                        "
                      >
                        <span>Prevention:</span>
                        <span class="score-pill overall" style="font-size: 10px; padding: 1px 4px"
                          >{{ cand.recurrence_prevention_score_100 }}/100</span
                        >
                      </div>
                      <div
                        v-if="
                          cand.overall_score_100 !== undefined && cand.overall_score_100 !== null
                        "
                        style="
                          display: flex;
                          align-items: center;
                          justify-content: space-between;
                          gap: 8px;
                          font-weight: bold;
                        "
                      >
                        <span>Overall:</span>
                        <span class="score-pill overall" style="font-size: 10px; padding: 1px 4px"
                          >{{ cand.overall_score_100 }}/100</span
                        >
                      </div>
                      <div
                        v-if="
                          cand.efficacy_score_100 === undefined &&
                          cand.safety_score_100 === undefined
                        "
                        style="color: #64748b; font-style: italic; font-size: 11px"
                      >
                        Standard settings
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style="font-size: 12px; margin-bottom: 4px">
                      <b>Scope:</b>
                      <span
                        class="status-badge"
                        style="
                          font-size: 10px;
                          padding: 2px 4px;
                          background: rgba(var(--slate-rgb), 0.1);
                          font-weight: bold;
                        "
                        >{{ formatLabel(getCandidateScope(cand)) }}</span
                      >
                    </div>
                    <div
                      v-if="cand.eligible_regions?.length"
                      style="font-size: 11px; margin-bottom: 4px; color: #475569"
                    >
                      <b>Eligible:</b>
                      {{
                        cand.eligible_regions
                          .map((r) => (typeof r === 'object' && r ? r.region || '' : r))
                          .map(formatLabel)
                          .join(', ')
                      }}
                    </div>
                    <div
                      v-if="cand.best_use_regions?.length"
                      style="font-size: 11px; margin-bottom: 4px"
                    >
                      <b style="color: #2e7d32">Best Use:</b>
                      <div
                        v-for="(bu, bIdx) in cand.best_use_regions"
                        :key="bIdx"
                        style="margin-left: 6px; color: #37474f; font-size: 10.5px"
                      >
                        •
                        {{
                          typeof bu === 'object' && bu
                            ? formatLabel(bu.region) +
                              (bu.subregion ? ' (' + bu.subregion + ')' : '') +
                              (bu.reason ? ': ' + bu.reason : '')
                            : formatLabel(bu)
                        }}
                      </div>
                    </div>
                    <div v-if="cand.avoid_regions?.length" style="font-size: 11px">
                      <b style="color: #c62828">Avoid:</b>
                      <div
                        v-for="(ar, aIdx) in cand.avoid_regions"
                        :key="aIdx"
                        style="margin-left: 6px; color: #37474f; font-size: 10.5px"
                      >
                        •
                        {{
                          typeof ar === 'object' && ar
                            ? formatLabel(ar.region) + (ar.reason ? ': ' + ar.reason : '')
                            : formatLabel(ar)
                        }}
                      </div>
                    </div>
                  </td>
                  <td
                    class="rationale-col"
                    style="
                      max-width: 320px;
                      white-space: normal;
                      font-size: 11.5px;
                      line-height: 1.4;
                      color: #334155;
                    "
                  >
                    {{
                      cand.rationale ||
                      cand.reason ||
                      cand.notes ||
                      (cand.endpoint ? 'Target endpoint: ' + formatLabel(cand.endpoint) : '—')
                    }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- CURRENT TREATMENT BLOCK OVERVIEW -->
      <div
        class="card q-pa-md q-mb-lg"
        v-if="store.lastPlan.current_treatment_block"
        style="border: 1px solid var(--line); background: #fbfbfb"
      >
        <div class="text-subtitle1 text-weight-bold text-teal-10 flex items-center justify-between">
          <span>🛡️ Active Treatment Block:
            {{ formatLabel(store.lastPlan.current_treatment_block.block_id || 'Block 1') }}</span>
          <q-badge color="teal-9"
            >Block {{ store.lastPlan.current_treatment_block.block_number }}</q-badge
          >
        </div>
        <div class="q-mt-sm text-caption text-grey-8" style="line-height: 1.5" v-if="store.lastPlan.current_treatment_block.block_goal">
          <strong>Block Goal:</strong> {{ store.lastPlan.current_treatment_block.block_goal }}
        </div>
        <div class="q-mt-sm flex items-center gap-4 text-caption text-grey-6">
          <span v-if="store.lastPlan.current_treatment_block.expected_duration"
            >Expected Duration:
            <b>{{ store.lastPlan.current_treatment_block.expected_duration }}</b></span
          >
          <span>Session Range:
            <b>Sessions {{ store.lastPlan.current_treatment_block.session_range?.first_session || (store.lastPlan.current_treatment_block.session_numbers ? store.lastPlan.current_treatment_block.session_numbers[0] : 1) }} to
              {{ store.lastPlan.current_treatment_block.session_range?.last_session || (store.lastPlan.current_treatment_block.session_numbers ? store.lastPlan.current_treatment_block.session_numbers[store.lastPlan.current_treatment_block.session_numbers.length - 1] : store.lastPlan.current_treatment_block.sessions?.length || 2) }}</b></span>
        </div>
      </div>

      <!-- TREATMENT ROADMAP -->
      <div class="pblock" v-if="activeSessions?.length">
        <h3><span class="bar"></span>Treatment Roadmap</h3>
        <div class="clinic-timeline">
          <div
            v-for="session in activeSessions"
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
                <h4 class="sess-goal">{{ session.session_goal || session.goal }}</h4>
                <div class="modalities-chips q-mt-sm" v-if="session.selected_modality_ids?.length || session.selected_modalities?.length">
                  <span class="mod-chip" v-for="m in (session.selected_modality_ids || session.selected_modalities)" :key="m">
                    {{ formatLabel(m) }}
                  </span>
                </div>
              </div>

              <!-- Treatment Operations (New Format) -->
              <div class="roadmap-sub-section q-mt-lg" v-if="session.treatment_operations?.length">
                <div class="sub-sec-hdr">TREATMENT OPERATIONS</div>
                <div
                  class="proc-detail-box q-mb-md"
                  v-for="op in session.treatment_operations"
                  :key="op.operation_id || op.modality_id"
                  style="border-left: 4px solid var(--violet); background: #ffffff; padding: 16px; margin-top: 12px;"
                >
                  <div class="flex justify-between items-start flex-wrap q-mb-sm">
                    <div>
                      <div class="text-weight-bold text-subtitle2 text-indigo-9" style="font-size: 14px">
                        {{ formatLabel(op.modality_id) }}
                        <q-badge color="teal-9" class="q-ml-sm text-weight-bold" v-if="op.role">{{ formatLabel(op.role) }}</q-badge>
                        <q-badge color="deep-orange" class="q-ml-xs text-weight-bold" v-if="op.injury_producing">Injury Producing</q-badge>
                      </div>
                      <div class="text-caption text-grey-7 q-mt-xs flex items-center gap-1 flex-wrap">
                        <span>Protocol: <code>{{ op.protocol_id }}</code></span>
                        <span v-if="op.target_location_text"> | Target: <b>{{ op.target_location_text }}</b></span>
                        <span v-if="op.linked_component_ids?.length"> | Components: 
                          <span v-for="cid in op.linked_component_ids" :key="cid" class="id-badge-inline q-mr-xs">
                            {{ cid }}
                            <q-tooltip class="id-tooltip-custom">
                              <div class="text-weight-bold text-amber-4">{{ cid }} Details</div>
                              <div v-if="getComponentInfo(cid)">
                                <div class="text-weight-bold" style="font-size: 12px;">{{ getComponentInfo(cid).diagnosis }}</div>
                                <div class="text-caption text-grey-4 q-mt-xs" style="font-size: 11px;">{{ getComponentInfo(cid).location }}</div>
                              </div>
                            </q-tooltip>
                          </span>
                        </span>
                        <span v-if="op.linked_group_ids?.length"> | Groups: 
                          <span v-for="gid in op.linked_group_ids" :key="gid" class="id-badge-inline q-mr-xs">
                            {{ gid }}
                            <q-tooltip class="id-tooltip-custom">
                              <div class="text-weight-bold text-amber-4">{{ gid }} Details</div>
                              <div v-if="getComponentInfo(gid)">
                                <div class="text-weight-bold" style="font-size: 12px;">{{ getComponentInfo(gid).diagnosis }}</div>
                                <div class="text-caption text-grey-4 q-mt-xs" style="font-size: 11px;">{{ getComponentInfo(gid).location }}</div>
                              </div>
                            </q-tooltip>
                          </span>
                        </span>
                      </div>
                    </div>
                    <div class="text-caption text-grey-5" v-if="op.operation_id" style="font-size: 10.5px;">
                      ID: <code>{{ op.operation_id }}</code>
                    </div>
                  </div>

                  <!-- Parameters if present -->
                  <div class="proc-detail-box q-mb-sm bg-grey-1" v-if="op.parameters && Object.keys(op.parameters).length" style="padding: 10px; margin-top: 8px; border: 1px solid rgba(0,0,0,0.04);">
                    <div class="box-title">⚙️ Operation Parameters</div>
                    <div class="params-row" style="display: flex; flex-wrap: wrap; gap: 12px; font-size: 12px; font-family: 'IBM Plex Mono', monospace;">
                      <div v-for="(val, key) in op.parameters" :key="key">
                        {{ formatLabel(key) }}: <b class="text-indigo-9">{{ formatParameterValue(key, val) }}</b>
                      </div>
                    </div>
                  </div>

                  <!-- Endpoint -->
                  <div class="q-mt-sm text-caption" v-if="op.endpoint">
                    <strong>Endpoint Target:</strong> <span class="text-grey-9 font-weight-medium">{{ op.endpoint }}</span>
                  </div>

                  <!-- Stop Conditions -->
                  <div class="q-mt-sm" v-if="op.stop_conditions?.length">
                    <div class="text-weight-bold text-grey-7" style="font-size: 10.5px; text-transform: uppercase;">
                      🛑 Stop Conditions:
                    </div>
                    <ul class="clinic-list q-mt-xs q-mb-none" style="padding-left: 15px; font-size: 12px; color: #c62828;">
                      <li v-for="cond in op.stop_conditions" :key="cond">{{ cond }}</li>
                    </ul>
                  </div>

                  <!-- Aftercare -->
                  <div class="q-mt-sm" v-if="op.aftercare?.length">
                    <div class="text-weight-bold text-grey-7" style="font-size: 10.5px; text-transform: uppercase;">
                      🧴 Post-Operation Aftercare:
                    </div>
                    <ul class="clinic-list q-mt-xs q-mb-none" style="padding-left: 15px; font-size: 12px; color: #2d3748;">
                      <li v-for="care in op.aftercare" :key="care">{{ care }}</li>
                    </ul>
                  </div>
                </div>
              </div>

              <!-- Execution Sequence (New Format) -->
              <div class="roadmap-sub-section q-mt-lg" v-if="session.session_execution_sequence?.length">
                <div class="sub-sec-hdr flex items-center justify-between">
                  <span>⚙️ Execution Sequence Steps</span>
                  <span class="text-caption text-grey-6" style="font-weight: normal; text-transform: none; font-size: 11px;">
                    💡 Hover any ID badge (e.g. <code>DC_002</code>) to view clinical definition
                  </span>
                </div>
                <div class="clinic-table-wrap q-mt-sm">
                  <table class="clinic-table compact">
                    <thead>
                      <tr>
                        <th style="width: 50px">Seq</th>
                        <th style="width: 120px">Step Type</th>
                        <th>Instruction</th>
                        <th v-if="session.session_execution_sequence.some(s => s.operation_id)" style="width: 100px">Linked Op</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="step in session.session_execution_sequence" :key="step.step_number">
                        <td><b>#{{ step.step_number }}</b></td>
                        <td>
                          <span class="status-badge" :style="getStepTypeStyle(step.step_type)">
                            {{ formatLabel(step.step_type) }}
                          </span>
                        </td>
                        <td style="font-size: 12px; line-height: 1.4; color: #334155;">
                          <template v-for="(seg, sIdx) in parseInstructionSegments(step.instruction || step.instructions)" :key="sIdx">
                            <span v-if="!seg.isId">{{ seg.text }}</span>
                            <span v-else class="id-badge-inline">
                              {{ seg.id }}
                              <q-tooltip anchor="top middle" self="bottom middle" class="id-tooltip-custom">
                                <div class="text-weight-bold text-amber-4">{{ seg.id }} Details</div>
                                <div v-if="getComponentInfo(seg.id)">
                                  <div class="text-weight-bold" style="font-size: 12px;">{{ getComponentInfo(seg.id).diagnosis }}</div>
                                  <div class="text-caption text-grey-4 q-mt-xs" style="font-size: 11px;">{{ getComponentInfo(seg.id).location }}</div>
                                  <div v-if="getComponentInfo(seg.id).linkedGroups?.length" class="text-caption text-grey-5 q-mt-xs">
                                    Linked Groups: {{ getComponentInfo(seg.id).linkedGroups.join(', ') }}
                                  </div>
                                </div>
                                <div v-else class="text-caption">Component ID reference</div>
                              </q-tooltip>
                            </span>
                          </template>
                        </td>
                        <td v-if="session.session_execution_sequence.some(s => s.operation_id)">
                          <code v-if="step.operation_id" style="font-size: 10.5px;">{{ step.operation_id }}</code>
                          <span v-else>—</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Provider Checkpoint -->
              <div class="decision-card-banner q-my-md" v-if="session.provider_checkpoint" style="background: #fff8e1; border: 1px solid #ffe082; color: #b7791f; border-radius: 6px; padding: 10px; font-size: 12px;">
                ⚠️ <b>Provider Checkpoint:</b> {{ session.provider_checkpoint }}
              </div>

              <!-- Fixed Protocol -->
              <div class="roadmap-sub-section q-mt-lg" v-if="session.fixed_protocol && !session.treatment_operations?.length">
                <div class="sub-sec-hdr">CLINICAL FIXED PROTOCOL</div>
                <div class="proc-title-row q-my-sm">
                  Procedure: <b>{{ formatLabel(session.fixed_protocol.procedure) }}</b>
                </div>

                <!-- Q-Switch details -->
                <div class="proc-detail-box q-mb-md" v-if="session.fixed_protocol.q_switch?.use">
                  <div class="box-title">⚡ Q-Switch Laser Parameters</div>
                  <div v-if="session.fixed_protocol.q_switch.settings_by_zone?.length">
                    <div
                      v-for="zs in session.fixed_protocol.q_switch.settings_by_zone"
                      :key="zs.zone"
                      class="q-mb-sm"
                      style="border-bottom: 1px dashed rgba(0, 0, 0, 0.05); padding-bottom: 6px"
                    >
                      <div class="text-weight-bold text-caption text-primary">
                        {{ formatLabel(zs.zone) }} Strategy:
                      </div>
                      <div class="params-row">
                        <div>
                          Wavelength: <b>{{ zs.wavelength_nm }} nm</b>
                        </div>
                        <div>
                          Energy: <b>{{ zs.energy_mj }} mJ</b>
                        </div>
                        <div>
                          Fluence: <b>{{ zs.fluence_j_cm2 }} J/cm²</b>
                        </div>
                        <div>
                          Freq: <b>{{ formatLabel(zs.frequency_hz) }} Hz</b>
                        </div>
                        <div v-if="zs.passes">
                          Passes: <b>{{ formatLabel(zs.passes) }}</b>
                        </div>
                        <div v-if="zs.endpoint">
                          Endpoint: <b>{{ formatLabel(zs.endpoint) }}</b>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="params-row" v-else>
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
                      Peel Name:
                      <b>{{
                        formatLabel(
                          session.fixed_protocol.peel.peel_name ||
                            session.fixed_protocol.peel.peel_id,
                        )
                      }}</b>
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

                <!-- Lesion Directed Procedure details -->
                <div
                  class="proc-detail-box q-mb-md"
                  v-if="session.fixed_protocol.lesion_directed_procedure?.use"
                >
                  <div class="box-title">🎯 Lesion Directed Procedure</div>
                  <div class="params-row">
                    <div>
                      Procedure:
                      <b>{{
                        formatLabel(session.fixed_protocol.lesion_directed_procedure.procedure)
                      }}</b>
                    </div>
                    <div
                      v-if="session.fixed_protocol.lesion_directed_procedure.settings_or_endpoint"
                    >
                      Settings/Endpoint:
                      <b>{{
                        session.fixed_protocol.lesion_directed_procedure.settings_or_endpoint
                      }}</b>
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
              <div class="roadmap-sub-section q-mt-lg" v-if="session.provider_protocol && !session.treatment_operations?.length">
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

                <!-- Session Execution Sequence -->
                <div
                  class="checklist-container q-mb-md"
                  v-if="session.provider_protocol.session_execution_sequence?.length"
                >
                  <div class="lbl-small q-mb-sm">⚙️ Session Execution Steps</div>
                  <div class="clinic-table-wrap">
                    <table class="clinic-table compact">
                      <thead>
                        <tr>
                          <th>Seq</th>
                          <th>Step &amp; Modality</th>
                          <th>Action &amp; Target Zones</th>
                          <th>Completion Target</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="step in session.provider_protocol.session_execution_sequence"
                          :key="step.order"
                        >
                          <td>
                            <b>#{{ step.order }}</b>
                          </td>
                          <td>
                            <div class="text-weight-bold" style="font-size: 12px; color: #1e293b">
                              {{ formatLabel(step.step_type) }}
                            </div>
                            <div class="text-caption text-grey-6" style="font-size: 10px">
                              {{ formatLabel(step.performed_by) }}
                            </div>
                          </td>
                          <td style="font-size: 11.5px; line-height: 1.4">
                            <div>{{ step.instructions }}</div>
                            <div
                              class="text-caption text-indigo-9 q-mt-xs"
                              v-if="step.zones?.length"
                            >
                              Zones: <b>{{ step.zones.map(formatLabel).join(', ') }}</b>
                            </div>
                            <div
                              class="text-caption text-grey-8"
                              v-if="step.settings_or_product_id"
                            >
                              Settings/Product: <code>{{ step.settings_or_product_id }}</code>
                            </div>
                          </td>
                          <td style="font-size: 11px; line-height: 1.4; color: #334155">
                            {{ step.endpoint_or_completion_rule || '—' }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
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
                          <th style="min-width: 140px">Zone</th>
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
                            <div
                              class="z-name"
                              style="font-weight: bold; font-size: 13.5px; color: #0f172a"
                            >
                              {{ formatLabel(z.zone) }}
                            </div>
                            <div
                              style="
                                margin-top: 4px;
                                display: flex;
                                flex-direction: column;
                                gap: 4px;
                              "
                            >
                              <span
                                v-if="z.selected_treatment || z.zone_strategy_type"
                                class="status-badge"
                                :style="
                                  getStrategyBadgeStyle(
                                    z.selected_treatment || z.zone_strategy_type,
                                  )
                                "
                              >
                                {{ formatLabel(z.selected_treatment || z.zone_strategy_type) }}
                              </span>
                              <div
                                v-if="z.why_this_zone_strategy"
                                style="
                                  font-size: 11px;
                                  color: #475569;
                                  font-style: italic;
                                  line-height: 1.3;
                                "
                              >
                                {{ z.why_this_zone_strategy }}
                              </div>
                              <div
                                v-else-if="z.reason"
                                class="z-reason"
                                style="font-size: 11px; color: #64748b"
                              >
                                {{ z.reason }}
                              </div>
                            </div>
                          </td>
                          <td style="font-size: 11.5px; line-height: 1.45">
                            <!-- Selected Treatment (Flat V2) -->
                            <div
                              v-if="z.selected_treatment"
                              style="font-weight: bold; color: #1565c0"
                            >
                              {{ formatLabel(z.selected_treatment) }}
                            </div>

                            <!-- Old format fallback -->
                            <div
                              v-if="z.settings"
                              class="z-settings"
                              style="color: #334155; margin-top: 4px"
                            >
                              {{ z.settings.wavelength_nm }}nm | {{ z.settings.energy_mj }}mJ |
                              {{ z.settings.fluence_j_cm2 }} J/cm² | {{ z.settings.frequency_hz }}Hz
                              | {{ z.settings.passes }} passes
                            </div>

                            <!-- New format strategies -->
                            <div
                              v-if="!z.selected_treatment && !z.settings"
                              style="display: flex; flex-direction: column; gap: 6px"
                            >
                              <!-- Deferred Zone -->
                              <div
                                v-if="z.zone_strategy_type === 'defer_zone'"
                                style="color: #c62828; font-weight: bold"
                              >
                                ⛔ Treatment Deferred / Avoided
                                <div
                                  v-if="z.avoid_zone_instruction"
                                  style="
                                    font-size: 11px;
                                    margin-top: 2px;
                                    font-weight: normal;
                                    color: #37474f;
                                  "
                                >
                                  Instruction: {{ z.avoid_zone_instruction }}
                                </div>
                              </div>

                              <!-- Base Zone Setting -->
                              <div
                                v-if="
                                  z.base_zone_setting &&
                                  (z.base_zone_setting.selected ||
                                    z.zone_strategy_type === 'base_global_toning')
                                "
                                style="border-left: 2.5px solid #1976d2; padding-left: 6px"
                              >
                                <span
                                  style="
                                    font-weight: bold;
                                    color: #1565c0;
                                    font-size: 10px;
                                    text-transform: uppercase;
                                    letter-spacing: 0.02em;
                                  "
                                  >Global Toning:</span
                                >
                                <div style="margin-top: 1px; color: #334155">
                                  {{ z.base_zone_setting.wavelength_nm }}nm •
                                  {{ z.base_zone_setting.energy_mj }}mJ •
                                  {{ z.base_zone_setting.fluence_j_cm2 }} J/cm² •
                                  {{ z.base_zone_setting.passes }} passes ({{
                                    z.base_zone_setting.frequency_hz
                                  }}Hz)
                                </div>
                              </div>

                              <!-- Regional Override Setting -->
                              <div
                                v-if="
                                  z.regional_override_setting &&
                                  z.regional_override_setting.selected
                                "
                                style="border-left: 2.5px solid #ef6c00; padding-left: 6px"
                              >
                                <span
                                  style="
                                    font-weight: bold;
                                    color: #e65100;
                                    font-size: 10px;
                                    text-transform: uppercase;
                                    letter-spacing: 0.02em;
                                  "
                                  >Regional Override:</span
                                >
                                <div style="margin-top: 1px; color: #334155">
                                  {{ z.regional_override_setting.wavelength_nm }}nm •
                                  {{ z.regional_override_setting.energy_mj }}mJ •
                                  {{ z.regional_override_setting.fluence_j_cm2 }} J/cm² •
                                  {{ z.regional_override_setting.passes }} passes
                                </div>
                                <div
                                  v-if="z.regional_override_setting.selection_reason"
                                  style="
                                    font-size: 10.5px;
                                    font-style: italic;
                                    color: #64748b;
                                    margin-top: 2px;
                                  "
                                >
                                  Reason: {{ z.regional_override_setting.selection_reason }}
                                </div>
                              </div>

                              <!-- Spot Only Overrides -->
                              <div
                                v-if="
                                  z.spot_only_overrides &&
                                  z.spot_only_overrides.some(
                                    (s) =>
                                      s.selected || (s.wavelength_nm && s.wavelength_nm !== 532),
                                  )
                                "
                                style="border-left: 2.5px solid #2e7d32; padding-left: 6px"
                              >
                                <span
                                  style="
                                    font-weight: bold;
                                    color: #1b5e20;
                                    font-size: 10px;
                                    text-transform: uppercase;
                                    letter-spacing: 0.02em;
                                  "
                                  >Spot Overrides:</span
                                >
                                <div
                                  v-for="(spot, sidx) in z.spot_only_overrides"
                                  :key="sidx"
                                  style="margin-top: 2px; color: #334155"
                                >
                                  <div v-if="spot.selected || spot.wavelength_nm !== 532">
                                    Subregion: <b>{{ spot.subregion }}</b> ({{
                                      spot.target_description
                                    }})
                                    <div>
                                      {{ spot.wavelength_nm }}nm • {{ spot.energy_mj }}mJ •
                                      {{ spot.fluence_j_cm2 }} J/cm² • {{ spot.passes }} passes ({{
                                        spot.frequency_hz
                                      }}Hz)
                                      <span
                                        v-if="spot.doctor_visual_review_required"
                                        style="
                                          color: #c62828;
                                          font-weight: bold;
                                          font-size: 9.5px;
                                          margin-left: 4px;
                                        "
                                        >[REVIEW REQ]</span
                                      >
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <!-- Excluded Subregions / Margins (Support flat string array or object array) -->
                            <div
                              v-if="z.excluded_subregions?.length"
                              style="
                                border-left: 2.5px solid #d32f2f;
                                padding-left: 6px;
                                background: #fff5f5;
                                padding-top: 4px;
                                padding-bottom: 4px;
                                border-radius: 0 4px 4px 0;
                                margin-top: 6px;
                              "
                            >
                              <span
                                style="
                                  font-weight: bold;
                                  color: #c62828;
                                  font-size: 10px;
                                  text-transform: uppercase;
                                  letter-spacing: 0.02em;
                                "
                                >Exclusions &amp; Margins:</span
                              >
                              <div
                                v-if="typeof z.excluded_subregions[0] === 'string'"
                                style="font-size: 10.5px; margin-top: 2px; color: #b71c1c"
                              >
                                {{ z.excluded_subregions.join(', ') }}
                              </div>
                              <div
                                v-else
                                v-for="(ex, eidx) in z.excluded_subregions"
                                :key="eidx"
                                style="font-size: 10.5px; margin-top: 2px; color: #b71c1c"
                              >
                                • <b>{{ ex.subregion }}</b
                                >: {{ ex.reason }}
                              </div>
                            </div>

                            <!-- Avoid Zone Instruction (Flat V2) -->
                            <div
                              v-if="z.avoid_zone_instruction"
                              style="
                                border-left: 2.5px solid #ef6c00;
                                padding-left: 6px;
                                background: #fff8e1;
                                padding-top: 4px;
                                padding-bottom: 4px;
                                border-radius: 0 4px 4px 0;
                                margin-top: 6px;
                                font-size: 10.5px;
                                color: #e65100;
                              "
                            >
                              <strong>Avoid Instruction:</strong> {{ z.avoid_zone_instruction }}
                            </div>
                          </td>
                          <td style="font-size: 11.5px; color: #334155; line-height: 1.45">
                            <!-- Flat/Old format direct coverage instruction fallback -->
                            <div v-if="z.coverage_instruction">{{ z.coverage_instruction }}</div>

                            <!-- Nested New format -->
                            <div v-else>
                              <div v-if="z.zone_strategy_type === 'defer_zone'">
                                {{ z.avoid_zone_instruction || 'Deferred' }}
                              </div>
                              <div v-else>
                                <div
                                  v-if="
                                    z.base_zone_setting?.selected ||
                                    z.zone_strategy_type === 'base_global_toning'
                                  "
                                  style="margin-bottom: 4px"
                                >
                                  Global:
                                  {{
                                    z.base_zone_setting.coverage_instruction ||
                                    'Standard full-zone passes'
                                  }}
                                </div>
                                <div
                                  v-if="z.regional_override_setting?.selected"
                                  style="margin-bottom: 4px"
                                >
                                  Override: {{ z.regional_override_setting.coverage_instruction }}
                                </div>
                                <div v-if="z.spot_only_overrides?.length">
                                  <div v-for="(spot, sidx) in z.spot_only_overrides" :key="sidx">
                                    <span
                                      v-if="spot.selected || spot.wavelength_nm !== 532"
                                      style="display: block; font-size: 11px"
                                    >
                                      Spot ({{ spot.subregion }}): {{ spot.coverage_instruction }}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style="font-size: 11.5px; color: #0f172a">
                            <!-- Flat V2 endpoint rules -->
                            <div v-if="z.endpoint_rules">
                              <div
                                v-if="Array.isArray(z.endpoint_rules)"
                                style="font-size: 11.5px; font-weight: bold; line-height: 1.45"
                              >
                                <div
                                  v-for="rule in z.endpoint_rules"
                                  :key="rule"
                                  style="margin-bottom: 2px"
                                >
                                  • {{ rule }}
                                </div>
                              </div>
                              <div v-else style="font-size: 11.5px; font-weight: bold">
                                {{ z.endpoint_rules }}
                              </div>
                            </div>

                            <!-- Old format fallback -->
                            <div v-else-if="z.endpoint">
                              <b>{{ formatLabel(z.endpoint) }}</b>
                            </div>

                            <!-- New format -->
                            <div v-else>
                              <div v-if="z.zone_strategy_type === 'defer_zone'">N/A</div>
                              <div v-else>
                                <div
                                  v-if="
                                    z.base_zone_setting?.selected ||
                                    z.zone_strategy_type === 'base_global_toning'
                                  "
                                >
                                  Global: <b>{{ formatLabel(z.base_zone_setting.endpoint) }}</b>
                                </div>
                                <div
                                  v-if="z.regional_override_setting?.selected"
                                  style="margin-top: 2px"
                                >
                                  Override:
                                  <b>{{ formatLabel(z.regional_override_setting.endpoint) }}</b>
                                </div>
                                <div v-if="z.spot_only_overrides?.length" style="margin-top: 2px">
                                  <div v-for="(spot, sidx) in z.spot_only_overrides" :key="sidx">
                                    <span
                                      v-if="
                                        (spot.selected || spot.wavelength_nm !== 532) &&
                                        spot.endpoint !== 'N/A'
                                      "
                                      style="display: block; font-size: 11px"
                                    >
                                      Spot ({{ spot.subregion }}):
                                      <b>{{ formatLabel(spot.endpoint) }}</b>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
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
                    style="margin-bottom: 8px"
                  >
                    <span class="az-zone">{{ formatLabel(az.zone) }}:</span>
                    <span class="az-reason">
                      {{ az.reason }}
                      <span
                        v-if="az.zone_defination"
                        style="
                          display: block;
                          font-size: 12px;
                          color: var(--slate);
                          margin-top: 4px;
                          font-style: italic;
                        "
                      >
                        ({{ az.zone_defination }})
                      </span>
                    </span>
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

              <!-- <div
                class="flex justify-end q-mt-md"
                v-if="store.reviewState.finalized && session.status !== 'completed'"
              >
                <q-btn
                  class="gredient text-white"
                  :label="`Start Session ${session.session_number}`"
                  icon-right="arrow_forward"
                  unelevated
                  rounded
                  no-caps
                  @click="startPigmentationSession(session)"
                />
              </div>
              <div class="flex justify-end q-mt-md" v-else-if="session.status === 'completed'">
                <span class="status-badge approved">✓ Session Completed</span>
              </div> -->
            </div>
          </div>
        </div>
      </div>

      <!-- MASTER TREATMENT ROADMAP OVERVIEW -->
      <div class="pblock q-mt-lg" v-if="store.lastPlan.master_treatment_roadmap">
        <h3>
          <span class="bar" style="background: #0d9488"></span>Master Treatment Roadmap Overview
        </h3>
        <div class="card bg-grey-1 q-pa-md q-mb-md" style="border: 1px solid var(--line)">
          <div class="row q-col-gutter-md">
            <div class="col-xs-12 col-sm-4 text-center">
              <div class="text-caption text-grey-7 uppercase">Expected Total Sessions</div>
              <div class="text-h5 text-weight-bold text-teal-9">
                {{ store.lastPlan.master_treatment_roadmap.total_planned_sessions || store.lastPlan.master_treatment_roadmap.expected_total_sessions }} Sessions
              </div>
            </div>
            <div class="col-xs-12 col-sm-4 text-center border-left">
              <div class="text-caption text-grey-7 uppercase">Expected Duration</div>
              <div class="text-h5 text-weight-bold text-teal-9">
                {{ store.lastPlan.master_treatment_roadmap.expected_duration || store.lastPlan.duration || store.lastPlan.full_course_summary?.course_duration }}
              </div>
            </div>
            <div class="col-xs-12 col-sm-4 text-center border-left">
              <div class="text-caption text-grey-7 uppercase">Roadmap Status</div>
              <div class="text-subtitle1 text-weight-bold text-teal-9">
                {{ formatLabel(store.lastPlan.master_treatment_roadmap.roadmap_status || store.lastPlan.plan_status) }}
              </div>
            </div>
          </div>

          <q-separator class="q-my-md" />

          <!-- Reassessment Points -->
          <div class="q-px-sm" v-if="store.lastPlan.master_treatment_roadmap.formal_reassessment_points?.length || store.lastPlan.master_treatment_roadmap.ai_generated_reassessment_points?.length">
            <div class="text-subtitle2 text-weight-bold q-mb-sm text-grey-8">
              AI-Selected Reassessment Points:
            </div>
            <div class="row q-col-gutter-md">
              <div
                v-for="pt in store.lastPlan.master_treatment_roadmap.formal_reassessment_points ||
                store.lastPlan.master_treatment_roadmap.ai_generated_reassessment_points"
                :key="pt.reassessment_id"
                class="col-xs-12 col-sm-6"
              >
                <div class="bg-white q-pa-sm rounded-lg border flex items-start gap-2">
                  <q-icon name="query_builder" color="primary" size="20px" class="q-mt-xs" />
                  <div>
                    <div class="text-weight-bold text-dark" style="font-size: 13px">
                      {{ formatLabel(pt.reassessment_id) }} (After Session
                      {{ pt.planned_after_session }})
                    </div>
                    <div class="text-caption text-grey-7">{{ pt.reason }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <q-separator class="q-my-md" v-if="store.lastPlan.master_treatment_roadmap.blocks?.length" />

          <!-- Master Blocks list -->
          <div class="q-px-sm" v-if="store.lastPlan.master_treatment_roadmap.blocks?.length">
            <div class="text-subtitle2 text-weight-bold q-mb-sm text-grey-8">
              Treatment Blocks Progression:
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              <div
                v-for="mb in store.lastPlan.master_treatment_roadmap.blocks"
                :key="mb.block_number"
                class="bg-white q-py-sm q-px-md rounded-lg border flex items-center gap-2"
                style="min-width: 150px"
              >
                <q-badge color="teal" rounded>{{ mb.block_number }}</q-badge>
                <div>
                  <div class="text-weight-bold text-dark text-caption">
                    {{ mb.session_range || (mb.session_numbers ? 'Sessions ' + mb.session_numbers.join(', ') : 'Block ' + mb.block_number) }}
                  </div>
                  <q-badge
                    :color="
                      mb.detail_status === 'fully_generated' || mb.detail_status === 'completed' || mb.detail_status === 'detailed_current_block'
                        ? 'positive'
                        : 'grey'
                    "
                    size="10px"
                  >
                    {{ formatLabel(mb.detail_status) }}
                  </q-badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- FUTURE PROVISIONAL SESSIONS (New Format) -->
      <div class="pblock q-mt-lg" v-if="store.lastPlan.future_provisional_sessions?.length">
        <h3>
          <span class="bar" style="background: #0d9488"></span>Future Provisional Sessions
          <span class="text-caption text-weight-medium text-teal-8">(Provisional)</span>
        </h3>
        <p class="note q-mb-md">
          These sessions are provisional. Detailed protocols are generated only after formal reassessment.
        </p>

        <div class="row q-col-gutter-md">
          <div
            v-for="ps in store.lastPlan.future_provisional_sessions"
            :key="ps.session_number"
            class="col-xs-12 col-sm-6 col-md-4"
          >
            <div
              class="card q-pa-md bg-white border"
              style="border-radius: 10px; border: 1px solid #cbd5e1; height: 100%; display: flex; flex-direction: column;"
            >
              <div class="flex items-center justify-between text-caption text-weight-bold text-teal-9 q-mb-sm">
                <span style="font-size: 14px;">Session #{{ ps.session_number }}</span>
                <span class="text-grey-7" style="font-size: 12px;" v-if="ps.timing">{{ ps.timing }}</span>
              </div>

              <!-- Planned Protocol Uses -->
              <div v-if="ps.planned_protocol_uses?.length" class="q-mb-sm">
                <span class="text-weight-bold text-slate-8" style="font-size: 11px; text-transform: uppercase;">
                  ⚡ Primary Uses:
                </span>
                <div v-for="use in ps.planned_protocol_uses" :key="use.protocol_id || use.modality_id" class="q-mt-xs" style="font-size: 12px; color: #334155;">
                  • <b>{{ formatLabel(use.modality_id) }}</b>
                  <div class="text-caption text-grey-6" style="padding-left: 10px;">
                    Protocol: <code>{{ use.protocol_id }}</code>
                    <span v-if="use.linked_component_ids?.length"> | Targets: {{ use.linked_component_ids.join(', ') }}</span>
                  </div>
                </div>
              </div>

              <!-- Supportive Protocol Uses -->
              <div v-if="ps.supportive_protocol_uses?.length" class="q-mb-sm">
                <span class="text-weight-bold text-slate-8" style="font-size: 11px; text-transform: uppercase;">
                  🌱 Supportive Uses:
                </span>
                <div v-for="use in ps.supportive_protocol_uses" :key="use.protocol_id || use.modality_id" class="q-mt-xs" style="font-size: 12px; color: #334155;">
                  • <b>{{ formatLabel(use.modality_id) }}</b>
                  <div class="text-caption text-grey-6" style="padding-left: 10px;">
                    Protocol: <code>{{ use.protocol_id }}</code>
                  </div>
                </div>
              </div>

              <!-- Decision Rules: Retain / Change If -->
              <div style="margin-top: auto; border-top: 1px dashed #cbd5e1; padding-top: 8px;" class="text-caption">
                <div v-if="ps.retain_if" class="q-mb-xs">
                  <span class="text-weight-bold text-green-9">Retain if:</span>
                  <span class="text-grey-8"> {{ ps.retain_if }}</span>
                </div>
                <div v-if="ps.change_if">
                  <span class="text-weight-bold text-amber-9">Change if:</span>
                  <span class="text-grey-8"> {{ ps.change_if }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- FUTURE TREATMENT ROADMAP -->
      <div
        class="pblock q-mt-lg"
        v-if="
          store.lastPlan.future_treatment_roadmap?.future_blocks?.length ||
          store.lastPlan.future_treatment_roadmap?.roadmap_status
        "
      >
        <div class="flex items-center justify-between q-mb-sm flex-wrap gap-2">
          <h3 class="q-my-none">
            <span class="bar" style="background: #0d9488"></span>Future Treatment Roadmap
            <span class="text-caption text-weight-medium text-teal-8">(Provisional)</span>
          </h3>
          <div
            class="flex items-center gap-2"
            v-if="store.lastPlan.future_treatment_roadmap?.roadmap_status"
          >
            <q-badge color="teal-9" outline class="q-px-sm q-py-xs text-weight-bold">
              Status: {{ formatLabel(store.lastPlan.future_treatment_roadmap.roadmap_status) }}
            </q-badge>
            <q-badge
              v-if="
                store.lastPlan.future_treatment_roadmap.remaining_expected_sessions !== undefined
              "
              color="indigo-9"
              unelevated
              class="q-px-sm q-py-xs text-weight-bold"
            >
              Remaining Sessions:
              {{ store.lastPlan.future_treatment_roadmap.remaining_expected_sessions }}
            </q-badge>
          </div>
        </div>

        <p class="note q-mb-md">
          These blocks and sessions are provisional. Detailed protocols are generated only after
          formal reassessment.
        </p>

        <!-- SESSION ACCOUNTING SUMMARY BAR -->
        <div
          v-if="store.lastPlan.future_treatment_roadmap.session_accounting"
          class="bg-teal-50 border border-teal-2 rounded-lg q-pa-sm q-mb-md flex items-center justify-between flex-wrap gap-2"
          style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px"
        >
          <div class="text-caption text-teal-10 flex items-center gap-3">
            <span
              ><strong>Total Course Sessions:</strong>
              {{
                store.lastPlan.future_treatment_roadmap.session_accounting
                  .expected_total_sessions || '—'
              }}</span
            >
            <span>•</span>
            <span
              ><strong>Current Block:</strong>
              {{
                store.lastPlan.future_treatment_roadmap.session_accounting
                  .current_block_session_count || 0
              }}
              sessions</span
            >
            <span>•</span>
            <span
              ><strong>Future Provisional:</strong>
              {{
                store.lastPlan.future_treatment_roadmap.session_accounting
                  .future_provisional_session_count || 0
              }}
              sessions</span
            >
          </div>
          <q-badge
            v-if="
              store.lastPlan.future_treatment_roadmap.session_accounting
                .all_expected_sessions_accounted_for
            "
            color="positive"
            dense
            class="q-px-xs"
          >
            ✓ All Sessions Accounted For
          </q-badge>
        </div>

        <!-- FUTURE BLOCKS GRID -->
        <div class="row q-col-gutter-md">
          <div
            v-for="block in store.lastPlan.future_treatment_roadmap.future_blocks"
            :key="block.provisional_block_id || block.block_number"
            class="col-xs-12"
          >
            <q-card
              flat
              bordered
              class="rounded-lg bg-white"
              style="border-radius: 10px; border: 1px solid #cbd5e1"
            >
              <!-- Block Header -->
              <q-card-section
                class="bg-slate-1 text-slate-10 q-pa-md border-bottom"
                style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0"
              >
                <div class="flex items-center justify-between flex-wrap gap-2">
                  <div class="flex items-center gap-2">
                    <span class="text-subtitle1 text-weight-bold text-slate-9">
                      {{
                        formatLabel(
                          block.provisional_block_id || 'Block ' + (block.block_number || ''),
                        )
                      }}
                    </span>
                    <q-badge color="teal-8" class="text-weight-bold">
                      Starts after: {{ formatLabel(block.starts_after || 'Reassessment') }}
                    </q-badge>
                  </div>
                  <div class="flex items-center gap-2">
                    <q-badge
                      v-if="block.expected_session_range"
                      color="blue-9"
                      outline
                      class="text-weight-medium"
                    >
                      Sessions {{ block.expected_session_range.first_session }}–{{
                        block.expected_session_range.last_session
                      }}
                      ({{ block.expected_session_range.total_sessions }} sessions)
                    </q-badge>
                    <q-badge color="grey-8" outline v-if="block.block_status">
                      {{ formatLabel(block.block_status) }}
                    </q-badge>
                  </div>
                </div>

                <div
                  v-if="block.block_goal || block.expected_duration"
                  class="text-caption text-grey-8 q-mt-xs flex items-center gap-3"
                >
                  <span v-if="block.block_goal"><strong>Goal:</strong> {{ block.block_goal }}</span>
                  <span v-if="block.expected_duration"
                    ><strong>Duration:</strong> {{ block.expected_duration }}</span
                  >
                </div>
              </q-card-section>

              <!-- Block Body -->
              <q-card-section class="q-pa-md" style="line-height: 1.6">
                <!-- Expected Objectives -->
                <div v-if="block.expected_objectives?.length" class="q-mb-md">
                  <div class="text-caption text-weight-bold text-slate-8 q-mb-xs">
                    🎯 Expected Objectives:
                  </div>
                  <ul class="q-pl-md q-my-none text-caption text-grey-9" style="padding-left: 20px">
                    <li
                      v-for="(obj, oIdx) in block.expected_objectives"
                      :key="oIdx"
                      class="q-mb-xs"
                    >
                      {{ obj }}
                    </li>
                  </ul>
                </div>

                <!-- Likely Component-Level Changes -->
                <div v-if="block.likely_component_level_changes?.length" class="q-mb-md">
                  <div class="text-caption text-weight-bold text-slate-8 q-mb-xs">
                    🧬 Likely Component-Level Evolutions:
                  </div>
                  <ul class="q-pl-md q-my-none text-caption text-grey-8" style="padding-left: 20px">
                    <li
                      v-for="(compChange, cIdx) in block.likely_component_level_changes"
                      :key="cIdx"
                      class="q-mb-xs"
                    >
                      {{ compChange }}
                    </li>
                  </ul>
                </div>

                <!-- Likely Modality Categories -->
                <div v-if="block.likely_modality_categories?.length" class="q-mb-md">
                  <div class="text-caption text-weight-bold text-slate-8 q-mb-xs">
                    ⚡ Likely Modality Categories:
                  </div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <q-badge
                      v-for="mod in block.likely_modality_categories"
                      :key="mod"
                      outline
                      color="teal"
                      size="sm"
                      class="q-px-sm q-py-xs text-weight-medium"
                    >
                      {{ formatLabel(mod) }}
                    </q-badge>
                  </div>
                </div>

                <!-- Provisional Sessions Breakdown -->
                <div v-if="block.provisional_sessions?.length" class="q-mt-md">
                  <div class="text-caption text-weight-bold text-slate-8 q-mb-sm">
                    📅 Provisional Sessions Breakdown:
                  </div>
                  <div class="row q-col-gutter-sm">
                    <div
                      v-for="ps in block.provisional_sessions"
                      :key="ps.session_number"
                      class="col-xs-12 col-sm-6 col-md-3"
                    >
                      <div
                        class="border rounded-md q-pa-sm bg-grey-1"
                        style="
                          border: 1px solid #e2e8f0;
                          border-radius: 6px;
                          background-color: #f8fafc;
                          height: 100%;
                        "
                      >
                        <div
                          class="flex items-center justify-between text-caption text-weight-bold text-primary q-mb-xs"
                        >
                          <span>Session #{{ ps.session_number }}</span>
                          <span
                            class="text-grey-7 text-caption"
                            style="font-size: 10px"
                            v-if="ps.expected_timing"
                            >{{ ps.expected_timing }}</span
                          >
                        </div>

                        <div class="text-caption text-grey-9 q-mb-xs">
                          <strong>Modality:</strong> {{ formatLabel(ps.primary_modality) }}
                        </div>
                        <div
                          v-if="ps.likely_protocol_or_product_id"
                          class="text-caption text-grey-8 q-mb-xs"
                          style="font-size: 11px"
                        >
                          <strong>Protocol:</strong>
                          {{ formatLabel(ps.likely_protocol_or_product_id) }}
                        </div>
                        <div
                          v-if="ps.treated_component_ids?.length"
                          class="text-caption text-grey-7 q-mb-xs"
                          style="font-size: 11px"
                        >
                          <strong>Targets:</strong> {{ ps.treated_component_ids.join(', ') }}
                        </div>
                        <div
                          v-if="ps.supportive_modalities?.length"
                          class="flex items-center gap-1 q-mb-xs flex-wrap"
                        >
                          <q-badge
                            v-for="sup in ps.supportive_modalities"
                            :key="sup"
                            color="grey-6"
                            dense
                            class="text-caption"
                            style="font-size: 9px"
                          >
                            +{{ formatLabel(sup) }}
                          </q-badge>
                        </div>
                        <div
                          v-if="ps.clinical_reason"
                          class="text-caption text-grey-7 italic"
                          style="font-size: 10px; line-height: 1.3; margin-top: 4px"
                        >
                          "{{ ps.clinical_reason }}"
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Finalization Rule Footer -->
                <div
                  v-if="block.finalization_rule"
                  class="text-caption text-grey-6 q-mt-md italic"
                  style="border-top: 1px dashed #e2e8f0; padding-top: 8px; font-size: 11px"
                >
                  ℹ️ {{ block.finalization_rule }}
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- CONTINGENCY PATHWAYS -->
        <div
          v-if="store.lastPlan.future_treatment_roadmap.contingency_pathways?.length"
          class="q-mt-lg"
        >
          <div class="text-subtitle2 text-weight-bold text-slate-8 q-mb-sm">
            🔀 Contingency Pathways:
          </div>
          <div class="row q-col-gutter-sm">
            <div
              v-for="c in store.lastPlan.future_treatment_roadmap.contingency_pathways"
              :key="c.contingency_id"
              class="col-xs-12 col-sm-6"
            >
              <div
                class="q-pa-sm border rounded-md bg-amber-1"
                style="border: 1px solid #fde68a; border-radius: 6px; background-color: #fffbeb"
              >
                <div
                  class="flex items-center justify-between text-caption text-weight-bold text-amber-10 q-mb-xs"
                >
                  <span>Trigger: {{ c.trigger || c.contingency_id }}</span>
                  <q-badge color="amber-9" dense v-if="c.replace_session_numbers?.length">
                    Replaces Sessions {{ c.replace_session_numbers.join(', ') }}
                  </q-badge>
                </div>
                <div class="text-caption text-grey-9" style="font-size: 11px">
                  Substitute <strong>{{ formatLabel(c.replace_base_modality) }}</strong> ➔
                  <strong>{{ formatLabel(c.with_modality) }}</strong>
                </div>
                <div
                  v-if="c.reason"
                  class="text-caption text-grey-8 q-mt-xs"
                  style="font-size: 11px"
                >
                  <em>Reason:</em> {{ c.reason }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- PACKAGE ESTIMATION SUMMARY -->
        <div
          v-if="store.lastPlan.future_treatment_roadmap.package_estimation_summary"
          class="q-mt-lg border rounded-lg q-pa-md bg-white"
          style="border: 1px solid #cbd5e1; border-radius: 8px"
        >
          <div class="text-subtitle2 text-weight-bold text-slate-9 q-mb-xs">
            📦 Package Estimation Summary:
          </div>
          <div
            v-if="
              store.lastPlan.future_treatment_roadmap.package_estimation_summary.commercial_note
            "
            class="text-caption text-grey-8 q-mb-sm italic"
          >
            {{ store.lastPlan.future_treatment_roadmap.package_estimation_summary.commercial_note }}
          </div>

          <div class="row q-col-gutter-md q-mt-xs">
            <div
              v-if="
                store.lastPlan.future_treatment_roadmap.package_estimation_summary
                  .base_case_billable_items?.length
              "
              class="col-xs-12 col-sm-6"
            >
              <div class="text-caption text-weight-bold text-teal-9 q-mb-xs">
                Base Case Billable Items:
              </div>
              <div class="flex items-center gap-2 flex-wrap">
                <q-badge
                  v-for="(item, iIdx) in store.lastPlan.future_treatment_roadmap
                    .package_estimation_summary.base_case_billable_items"
                  :key="iIdx"
                  color="teal-1"
                  text-color="teal-10"
                  class="q-pa-xs border"
                  style="border: 1px solid #99f6e4"
                >
                  {{ formatLabel(item.billable_category) }}: x{{ item.quantity }}
                </q-badge>
              </div>
            </div>

            <div
              v-if="
                store.lastPlan.future_treatment_roadmap.package_estimation_summary
                  .excluded_contingency_items?.length
              "
              class="col-xs-12 col-sm-6"
            >
              <div class="text-caption text-weight-bold text-amber-9 q-mb-xs">
                Excluded Contingency Items:
              </div>
              <ul class="q-pl-md q-my-none text-caption text-grey-8" style="padding-left: 20px">
                <li
                  v-for="(ex, eIdx) in store.lastPlan.future_treatment_roadmap
                    .package_estimation_summary.excluded_contingency_items"
                  :key="eIdx"
                >
                  <strong>{{ formatLabel(ex.billable_category) }}</strong>
                  <span v-if="ex.quantity_range">
                    (Qty: {{ ex.quantity_range.min }}–{{ ex.quantity_range.max }})</span
                  >:
                  {{ ex.reason_not_in_base_total }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- GLOBAL HOMECARE PLAN -->
      <div class="pblock" v-if="homecarePlan">
        <h3><span class="bar" style="background: #0f766e"></span>Homecare Regime (Daily Support)</h3>
        
        <div class="row q-col-gutter-md">
          <!-- Morning Routine -->
          <div class="col-xs-12 col-sm-4" v-if="homecarePlan.morning?.length">
            <div 
              class="q-pa-md border bg-white" 
              style="border-radius: 10px; border: 1px solid #cbd5e1; height: 100%;"
            >
              <div class="text-subtitle2 text-weight-bold text-teal-9 q-mb-sm flex items-center gap-1">
                ☀️ Morning Routine
              </div>
              <ul class="q-pl-md q-my-none text-caption text-grey-9" style="padding-left: 20px; line-height: 1.6;">
                <li v-for="(step, idx) in homecarePlan.morning" :key="idx" class="q-mb-xs">
                  {{ step }}
                </li>
              </ul>
            </div>
          </div>

          <!-- Evening Routine -->
          <div class="col-xs-12 col-sm-4" v-if="homecarePlan.evening?.length || homecarePlan.night?.length">
            <div 
              class="q-pa-md border bg-white" 
              style="border-radius: 10px; border: 1px solid #cbd5e1; height: 100%;"
            >
              <div class="text-subtitle2 text-weight-bold text-indigo-9 q-mb-sm flex items-center gap-1">
                🌙 Evening Routine
              </div>
              <ul class="q-pl-md q-my-none text-caption text-grey-9" style="padding-left: 20px; line-height: 1.6;">
                <li v-for="(step, idx) in (homecarePlan.evening || homecarePlan.night)" :key="idx" class="q-mb-xs">
                  {{ step }}
                </li>
              </ul>
            </div>
          </div>

          <!-- Sun & Heat Control -->
          <div class="col-xs-12 col-sm-4" v-if="homecarePlan.sun_and_heat_control?.length || homecarePlan.avoid?.length">
            <div 
              class="q-pa-md border" 
              style="border-radius: 10px; border: 1px solid #fde68a; background-color: #fffbeb; height: 100%;"
            >
              <div class="text-subtitle2 text-weight-bold text-amber-10 q-mb-sm flex items-center gap-1">
                ⚠️ Sun &amp; Heat Control / Avoidance
              </div>
              <ul class="q-pl-md q-my-none text-caption text-grey-9" style="padding-left: 20px; line-height: 1.6;">
                <li v-for="(step, idx) in (homecarePlan.sun_and_heat_control || homecarePlan.avoid)" :key="idx" class="q-mb-xs">
                  {{ step }}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Component Specific Homecare Instructions -->
        <div 
          class="q-mt-md border q-pa-md bg-white" 
          style="border-radius: 10px; border: 1px solid #cbd5e1;"
          v-if="homecarePlan.component_specific_instructions?.length"
        >
          <div class="text-subtitle2 text-weight-bold text-slate-9 q-mb-xs">
            🎯 Target-Specific Instructions:
          </div>
          <div class="row q-col-gutter-sm q-mt-xs">
            <div 
              v-for="(inst, idx) in homecarePlan.component_specific_instructions" 
              :key="idx"
              class="col-xs-12"
            >
              <div class="q-pa-sm border rounded-md bg-grey-1" style="border: 1px solid #e2e8f0; border-radius: 6px; background-color: #f8fafc;">
                <div class="flex items-center justify-between text-caption text-weight-bold text-teal-8 q-mb-xs">
                  <span>Component targets: {{ inst.linked_component_ids?.join(', ') || inst.linked_group_ids?.join(', ') || 'General' }}</span>
                </div>
                <div class="text-caption text-grey-9 q-mb-xs" v-if="inst.clinical_location_text">
                  <strong>Location:</strong> {{ inst.clinical_location_text }}
                </div>
                <div class="text-caption text-grey-8" style="padding-left: 10px;">
                  • {{ inst.instruction }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- REASSESSMENT PLAN -->
      <div class="pblock" v-if="reassessmentDetails">
        <h3><span class="bar"></span>Reassessment Plan <span v-if="reassessmentDetails.after_session" class="text-caption text-weight-medium text-teal-8">(After Session {{ reassessmentDetails.after_session }})</span></h3>
        <div class="twin">
          <div class="card" v-if="reassessmentDetails.repeat_images?.length">
            <span class="lbl-small">Repeat Images Required</span>
            <div class="tag-group q-mt-sm">
              <span
                class="clinical-chip"
                v-for="mode in reassessmentDetails.repeat_images"
                :key="mode"
              >
                {{ mode }}
              </span>
            </div>
          </div>
          <div class="card" v-if="reassessmentDetails.metrics_to_compare?.length">
            <span class="lbl-small">Metrics to Compare</span>
            <div class="tag-group q-mt-sm">
              <span
                class="clinical-chip modifier"
                v-for="metric in reassessmentDetails.metrics_to_compare"
                :key="metric"
              >
                {{ formatLabel(metric) }}
              </span>
            </div>
          </div>
        </div>
        <div
          class="decision-rules-card q-mt-md"
          v-if="reassessmentDetails.decision_rules?.length"
        >
          <div class="dr-title">⚖️ Reassessment Decision Rules</div>
          <ul class="clinic-list q-mt-xs">
            <li v-for="rule in reassessmentDetails.decision_rules" :key="rule">
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
              <q-btn
                color="primary"
                unelevated
                no-caps
                label="Download Diagnosis PDF"
                icon="download"
                @click="downloadReport('diagnosis')"
              />
              <q-btn
                color="deep-purple-6"
                unelevated
                no-caps
                label="Download Treatment Plan PDF"
                icon="download"
                @click="downloadReport('treatment-plan')"
              />
              <button class="btn" @click="resetPlan">New Plan</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
// import { useRouter, useRoute } from 'vue-router'
import { usePigmentationStore } from 'src/stores/pigmentationStore'
import { api } from 'src/boot/axios'
import { Loading, Notify } from 'quasar'

const store = usePigmentationStore()
// const router = useRouter()
// const route = useRoute()

const activeSessions = computed(() => {
  return store.lastPlan?.current_treatment_block?.sessions || store.lastPlan?.sessions || []
})

const homecarePlan = computed(() => {
  return store.lastPlan?.homecare_plan || store.lastPlan?.home_care || null
})

const reassessmentDetails = computed(() => {
  if (store.lastPlan?.current_treatment_block?.reassessment_gate) {
    const gate = store.lastPlan.current_treatment_block.reassessment_gate
    return {
      after_session: gate.after_session,
      repeat_images: gate.required_images || [],
      metrics_to_compare: gate.metrics_and_groups_to_repeat || [],
      decision_rules: gate.decision_rules || [],
    }
  }
  if (store.lastPlan?.reassessment_plan) {
    const plan = store.lastPlan.reassessment_plan
    return {
      after_session: plan.after_session || null,
      repeat_images: plan.repeat_images || [],
      metrics_to_compare: plan.metrics_to_compare || [],
      decision_rules: plan.decision_rules || [],
    }
  }
  return null
})

const getStepTypeStyle = (type) => {
  const t = String(type || '').toLowerCase()
  if (t === 'assessment' || t === 'reassessment') {
    return 'font-size: 10px; padding: 2px 6px; background: #e3f2fd; color: #1565c0; border: 1px solid #bbdefb; font-weight: bold; border-radius: 4px;'
  } else if (t === 'treatment' || t === 'operation') {
    return 'font-size: 10px; padding: 2px 6px; background: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9; font-weight: bold; border-radius: 4px;'
  } else if (t === 'aftercare' || t === 'recovery' || t === 'post_treatment') {
    return 'font-size: 10px; padding: 2px 6px; background: #f3e5f5; color: #7b1fa2; border: 1px solid #e1bee7; font-weight: bold; border-radius: 4px;'
  } else if (t === 'preparation' || t === 'prep') {
    return 'font-size: 10px; padding: 2px 6px; background: #fff3e0; color: #e65100; border: 1px solid #ffe0b2; font-weight: bold; border-radius: 4px;'
  } else {
    return 'font-size: 10px; padding: 2px 6px; background: #eceff1; color: #37474f; border: 1px solid #cfd8dc; font-weight: bold; border-radius: 4px;'
  }
}

const formatParameterValue = (key, val) => {
  if (val === null || val === undefined) return '—'
  if (Array.isArray(val)) return val.map(formatLabel).join(', ')
  if (typeof val === 'object') return JSON.stringify(val)
  if (typeof val === 'boolean') return val ? 'Yes' : 'No'
  
  const k = key.toLowerCase()
  if (k.includes('wavelength')) return `${val} nm`
  if (k.includes('energy')) return `${val} mJ`
  if (k.includes('fluence')) return `${val} J/cm²`
  if (k.includes('frequency')) return `${val} Hz`
  if (k.includes('depth')) return `${val} mm`
  
  return String(val)
}

const componentIdMap = computed(() => {
  const map = {}

  // Standard group lookup fallback dictionary
  const standardGroupLookup = {
    'PG_001': {
      id: 'PG_001',
      type: 'Pigment Group',
      diagnosis: 'Diffuse Background Melanin Field',
      location: 'Diffuse mild background tan-brown field across forehead, glabella, nose, and cheeks',
      eligibility: 'Eligible (Chemical Peel - BioRePeelCl3)',
      linkedGroups: []
    },
    'PG_002': {
      id: 'PG_002',
      type: 'Pigment Group',
      diagnosis: 'Right Malar Patch',
      location: 'Irregular oval light-to-medium brown patch on lateral right malar/zygomatic cheek (below outer canthus)',
      eligibility: 'Eligible (Microneedling - MN_MULTIFOCAL_MIXED_PIGMENT)',
      linkedGroups: []
    },
    'PG_003': {
      id: 'PG_003',
      type: 'Pigment Group',
      diagnosis: 'Multifocal Malar Macules',
      location: 'Multiple scattered small light-brown macules on bilateral cheeks & nasal sidewalls',
      eligibility: 'Eligible (Microneedling - MN_MULTIFOCAL_MIXED_PIGMENT)',
      linkedGroups: []
    },
    'PG_004': {
      id: 'PG_004',
      type: 'Pigment Group',
      diagnosis: 'Periocular Discoloration',
      location: 'Bilateral infraorbital region (lower eyelids/tear-trough area) diffuse brown-gray discoloration',
      eligibility: 'Eligible (Microneedling - MN_PERIOCULAR_MELANIN_OR_TEXTURE)',
      linkedGroups: []
    },
    'PG_005': {
      id: 'PG_005',
      type: 'Pigment Group',
      diagnosis: 'Nevus-like Macule(s)',
      location: 'Discrete small dark-brown macules on nasal bridge & malar cheek',
      eligibility: 'Excluded from cosmetic procedures (Observe only)',
      linkedGroups: []
    },
    'PM_001': {
      id: 'PM_001',
      type: 'Modifier Group',
      diagnosis: 'Structural Tear-Trough Hollowing',
      location: 'Bilateral tear-trough hollowing causing optical shadow under eyes',
      eligibility: 'Non-procedural (Observe / Structural assessment)',
      linkedGroups: []
    },
    'PM_002': {
      id: 'PM_002',
      type: 'Modifier Group',
      diagnosis: 'Facial Hair Shadow',
      location: 'Moustache, beard, and dense lower-face hair obscuring skin assessment',
      eligibility: 'Non-procedural (Observe)',
      linkedGroups: []
    },
    'PM_003': {
      id: 'PM_003',
      type: 'Modifier Group',
      diagnosis: 'Erythematous/Vascular Tone',
      location: 'Mild redness / vascular component in periocular & perinasal areas',
      eligibility: 'Non-procedural (Observe)',
      linkedGroups: []
    },
    'PM_004': {
      id: 'PM_004',
      type: 'Modifier Group',
      diagnosis: 'Active Inflammatory Acne Papules',
      location: 'Small erythematous papules on forehead hairline & perinasal/upper lip margin',
      eligibility: 'Hold regions (Medical control first)',
      linkedGroups: []
    }
  }

  // Populate from store.lastPlan.component_treatment_map
  if (store.lastPlan?.component_treatment_map && Array.isArray(store.lastPlan.component_treatment_map)) {
    store.lastPlan.component_treatment_map.forEach((item) => {
      if (item.diagnostic_component_id) {
        map[item.diagnostic_component_id] = {
          id: item.diagnostic_component_id,
          type: 'Diagnostic Component',
          diagnosis: item.working_diagnosis || 'Diagnostic Component',
          location: item.clinical_location_text || item.target_location_text || '—',
          eligibility: item.treatment_eligibility || item.course_allocation_status || '—',
          linkedGroups: item.linked_group_ids || [],
          modality: item.selected_modality_id || item.selected_modality || '—',
          protocol: item.selected_protocol_id || item.selected_product_or_protocol_id || '—',
          expectedResponse: item.expected_response || '',
          whySelected: item.why_selected_over_alternative || []
        }
      }
    })
  }

  // Populate standard groups if not present
  Object.entries(standardGroupLookup).forEach(([id, info]) => {
    if (!map[id]) {
      map[id] = info
    }
  })

  return map
})

const getComponentInfo = (id) => {
  if (!id) return null
  return componentIdMap.value?.[id] || null
}

const parseInstructionSegments = (text) => {
  if (!text || typeof text !== 'string') return [{ isId: false, text: text || '' }]
  const regex = /\b(DC_\d+|PG_\d+|PM_\d+)\b/g
  const segments = []
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ isId: false, text: text.substring(lastIndex, match.index) })
    }
    const id = match[1]
    segments.push({
      isId: true,
      id,
      text: id
    })
    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    segments.push({ isId: false, text: text.substring(lastIndex) })
  }

  return segments
}

const therapists = ref([])
const hasFetchedTherapists = ref(false)

const fetchTherapists = async (clinicId) => {
  if (!clinicId || hasFetchedTherapists.value) return
  try {
    const response = await api.get(`/get-users?role=therapist&clinic_id=${clinicId}`)
    const rawData = response.data.results || response.data || []
    therapists.value = rawData.map((t) => {
      const id = t.id || t.value
      const label =
        t.label ||
        t.name ||
        (t.first_name ? `${t.first_name} ${t.last_name || ''}`.trim() : '') ||
        `Therapist #${id}`
      return {
        value: id,
        label: label,
      }
    })
    hasFetchedTherapists.value = true
  } catch (error) {
    console.error('Error fetching therapists:', error)
  }
}

watch(
  () => store.clinic_id,
  (newClinicId) => {
    if (newClinicId) {
      fetchTherapists(newClinicId)
    }
  },
  { immediate: true },
)

const updateTherapist = async (val) => {
  if (!val) return
  try {
    store.therapist_id = val
    await store.updateAssessment()
    Notify.create({
      type: 'positive',
      message: 'Therapist assigned successfully',
      timeout: 2000,
    })
  } catch (error) {
    console.error('Failed to update therapist:', error)
    Notify.create({
      type: 'negative',
      message: 'Failed to assign therapist. Please try again.',
      timeout: 3000,
    })
  }
}

// const startPigmentationSession = (session) => {
//   if (!session) return
//   router.push({
//     name: 'PigmentationTreatmentPrep',
//     params: {
//       user_id: route.params.user_id || store.user_id || '1',
//       assessment_id: store.id,
//       session_id: session.id || session.session_number,
//       ...(route.params.appointment_id && { appointment_id: route.params.appointment_id }),
//     },
//   })
// }

const downloadReport = async (reportType) => {
  Loading.show({ message: `Downloading ${reportType.replace('-', ' ')}...` })
  try {
    const response = await api.get(`download-pigmentation-report/${reportType}/${store.id}`, {
      responseType: 'blob',
    })

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute(
      'download',
      `${store.formData.initials || 'patient'}_pigmentation_${reportType.replace('-', '_')}.pdf`,
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

onMounted(async () => {
  if (!store.lastPlan && !store.isLoading && store.diagnosis?.confirmedDx) {
    await runGeneratePlan()
  }
})

const validationError = ref('')
const soReviewed = ref(store.reviewState.finalized)
const soDecision = ref(store.reviewState.decision || '')
const soNotes = ref(store.reviewState.notes || '')
const soReviewer = ref(store.reviewState.reviewer || 'Dr. A. Mehra')

const runGeneratePlan = async () => {
  validationError.value = ''

  if (store.diagnosis?.data && !store.treatmentPlanningReady) return

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
    await store.generatePlan(true)
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

const lockPlan = async () => {
  if (!soReviewed.value || !soDecision.value) return
  store.finalizeSignoff(soDecision.value, soNotes.value, soReviewer.value)
  try {
    await store.updateAssessment()
  } catch (err) {
    console.error('Failed to save assessment after locking plan:', err)
  }
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

const getCandidateScope = (cand) => {
  if (cand.scope || cand.treatment_scope) {
    return cand.scope || cand.treatment_scope
  }
  const id = String(cand.candidate_id || cand.protocol_ref || cand.protocol_id || '').toLowerCase()
  if (
    id.includes('diffuse') ||
    id.includes('toning') ||
    id.includes('global') ||
    id.includes('tanning')
  ) {
    return 'Regional Toning'
  }
  if (id.includes('perioral') || id.includes('focal') || id.includes('spot')) {
    return 'Focal Spot'
  }
  return cand.candidate_id || 'Regional/Focal'
}

const getStrategyBadgeStyle = (type) => {
  const t = String(type || '').toLowerCase()
  if (t === 'defer_zone') {
    return 'font-size: 10px; padding: 2px 6px; background: #ffebee; color: #c62828; font-weight: bold; border-radius: 4px;'
  } else if (
    t.includes('global') ||
    t.includes('base') ||
    t.includes('toning') ||
    t.includes('switch') ||
    t.includes('laser')
  ) {
    return 'font-size: 10px; padding: 2px 6px; background: #e3f2fd; color: #1565c0; font-weight: bold; border-radius: 4px;'
  } else if (t.includes('spot')) {
    return 'font-size: 10px; padding: 2px 6px; background: #e8f5e9; color: #2e7d32; font-weight: bold; border-radius: 4px;'
  } else {
    return 'font-size: 10px; padding: 2px 6px; background: #fff3e0; color: #ef6c00; font-weight: bold; border-radius: 4px;'
  }
}

const resetPlan = async () => {
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
  try {
    await store.updateAssessment()
  } catch (err) {
    console.error('Failed to save assessment after resetting plan:', err)
  }
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

.rationale-col {
  color: var(--slate);
  font-size: 12.5px;
  line-height: 1.45;
  max-width: 250px;
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

/* Re-generate plan button */
.btn-regenerate {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  background: var(--paper);
  color: var(--ink);
  padding: 6px 14px;
  border-radius: 99px;
  border: 1px solid var(--line);
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.btn-regenerate:hover:not(:disabled) {
  background: var(--porcelain);
  border-color: var(--slate);
  color: var(--violet);
}

.btn-regenerate:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Inline ID badge & tooltips styling */
.id-badge-inline {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: #eef2ff;
  color: #3730a3;
  border: 1px solid #c7d2fe;
  font-family: 'IBM Plex Mono', monospace;
  font-weight: 700;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  cursor: help;
  vertical-align: baseline;
  transition: all 0.15s ease;
  line-height: 1.3;
}

.id-badge-inline:hover {
  background: #e0e7ff;
  border-color: #818cf8;
  color: #1e1b4b;
  box-shadow: 0 1px 4px rgba(79, 70, 229, 0.25);
}

.id-badge-lg {
  font-family: 'IBM Plex Mono', monospace;
  font-weight: 700;
  font-size: 12.5px;
  padding: 2px 8px;
  background: #e0e7ff;
  color: #3730a3;
  border: 1px solid #a5b4fc;
  border-radius: 6px;
  display: inline-block;
}

.id-tooltip-custom {
  background: #0f172a !important;
  color: #f8fafc !important;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 10px 14px;
  max-width: 320px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
}

.therapist-select :deep(.q-field__control) {
  background-color: #fffaf4;
  transition: all 0.3s ease;
  border-radius: 99px;
}
.therapist-select :deep(.q-field__control:hover) {
  background-color: #fff6eb;
}
.therapist-missing :deep(.q-field__control) {
  background-color: #fff0f0 !important;
  animation: pulse-red 2s infinite;
}

@keyframes pulse-red {
  0% {
    box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(244, 67, 54, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(244, 67, 54, 0);
  }
}
</style>
