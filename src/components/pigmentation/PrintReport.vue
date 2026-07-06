<template>
  <div id="printDoc">
    <h1>Pigmentation Assessment &amp; Plan</h1>
    <div class="pmeta">
      AI Aesthetics Pigment Co-Pilot · AI-proposed, clinician-reviewed ·
      {{
        store.reviewState.ts ? store.reviewState.ts.toLocaleString() : new Date().toLocaleString()
      }}
    </div>

    <h2>Patient</h2>
    <div class="row">
      <span class="k">Initials</span>
      <span
        >{{ store.formData.initials
        }}{{ store.formData.mrn ? ' · ID ' + store.formData.mrn : '' }}</span
      >
    </div>
    <div class="row">
      <span class="k">Age / Sex / Fitzpatrick</span>
      <span>{{ store.formData.age }} · {{ store.formData.sex }} · {{ store.formData.fitz }}</span>
    </div>

    <h2>Assessment</h2>
    <div class="row">
      <span class="k">Working diagnosis</span>
      <span
        ><b>{{ store.diagnosis?.confirmedDx || store.lastPlan?.condition || '—' }}</b></span
      >
    </div>
    <div class="row" v-if="store.diagnosis?.data?.differential?.primary?.dx">
      <span class="k">AI differential (primary)</span>
      <span>
        {{ store.diagnosis.data.differential.primary.dx }}
        <span v-if="store.diagnosis.data.differential.primary.confidence != null">
          ({{ store.diagnosis.data.differential.primary.confidence }}% confidence)
        </span>
      </span>
    </div>
    <div class="row">
      <span class="k">Depth</span>
      <span>{{
        cap(store.diagnosis?.data?.depth_assessment?.verdict || store.formData.depth || 'uncertain')
      }}</span>
    </div>
    <div class="row">
      <span class="k">Composition</span>
      <span>{{
        cap(store.diagnosis?.data?.composition_assessment?.dominant || store.formData.comp || '—')
      }}</span>
    </div>
    <div class="row" v-if="store.formData.notes">
      <span class="k">Dermoscopy findings</span>
      <span>{{ store.formData.notes }}</span>
    </div>
    <div class="row" v-if="store.diagnosis?.data?.severity_interpretation">
      <span class="k">Severity</span>
      <span>{{ store.diagnosis.data.severity_interpretation }}</span>
    </div>

    <!-- Scores -->
    <div class="row" v-for="(s, sIdx) in store.diagnosis?.data?.scores" :key="sIdx">
      <span class="k"
        >{{ s.name }} <span v-if="s.scale">({{ s.scale }})</span></span
      >
      <span>
        {{ s.value !== null && s.value !== '' ? s.value : '—' }}
        <span v-if="s.interpretation"> — {{ s.interpretation }}</span>
      </span>
    </div>

    <div class="row" v-if="store.diagnosis?.data?.red_flags?.present">
      <span class="k">RED FLAGS</span>
      <span>{{ store.diagnosis.data.red_flags.action || 'In-person review' }}</span>
    </div>
    <div class="row" v-if="store.lastPlan?.condition_specific_note">
      <span class="k">Condition note</span>
      <span>{{ store.lastPlan.condition_specific_note }}</span>
    </div>
    <div class="row" v-if="store.lastPlan?.prognosis">
      <span class="k">Prognosis</span>
      <span>{{ store.lastPlan.prognosis }}</span>
    </div>
     <h2>Plan: {{ store.lastPlan?.plan_name || 'Treatment Plan' }} ({{ formatTiming(store.lastPlan?.duration) }})</h2>
    <div class="row" v-if="store.lastPlan?.plan_status">
      <span class="k">Plan Status</span>
      <span style="font-weight: bold;">{{ formatLabel(store.lastPlan.plan_status) }}</span>
    </div>
    
    <div v-if="store.lastPlan?.clinical_recommendation_mode" style="margin-top: 6px; padding: 6px; background: #f9f9f9; border-radius: 4px; font-size: 11px;">
      <b>Clinical Recommendation Mode:</b>
      <div style="font-size: 11px; margin-left: 10px;">
        Optimize For: {{ formatLabel(store.lastPlan.clinical_recommendation_mode.optimize_for) }}<br/>
        Doctor Constraints Used As: {{ formatLabel(store.lastPlan.clinical_recommendation_mode.doctor_constraints_used_as) }}<br/>
        Clinician Edit Allowed: {{ store.lastPlan.clinical_recommendation_mode.doctor_can_edit_before_finalization ? 'Yes' : 'No' }}
      </div>
    </div>
    
    <div v-if="store.lastPlan?.baseline_summary" style="margin-top: 10px;">
      <h3>Baseline Skin Profile</h3>
      <div class="row">
        <span class="k">Melanin Load Index</span>
        <span>{{ store.lastPlan.baseline_summary.melanin_load_index }}/100</span>
      </div>
      <div class="row">
        <span class="k">Erythema Load Index</span>
        <span>{{ store.lastPlan.baseline_summary.erythema_load_index }}/100</span>
      </div>
      <div class="row" v-if="store.lastPlan.baseline_summary.mmasi_if_applicable !== null && store.lastPlan.baseline_summary.mmasi_if_applicable !== undefined">
        <span class="k">mMASI Score</span>
        <span>{{ store.lastPlan.baseline_summary.mmasi_if_applicable }}/24</span>
      </div>
      <div class="row">
        <span class="k">Composition</span>
        <span>{{ formatLabel(store.lastPlan.baseline_summary.composition) }}</span>
      </div>
      <div class="row">
        <span class="k">Depth Call</span>
        <span>{{ formatLabel(store.lastPlan.baseline_summary.depth_call) }}</span>
      </div>
      <div class="row" v-if="store.lastPlan.baseline_summary.primary_drivers?.length">
        <span class="k">Primary Drivers</span>
        <span>{{ store.lastPlan.baseline_summary.primary_drivers.map(formatLabel).join(', ') }}</span>
      </div>
      <div class="row" v-if="store.lastPlan.baseline_summary.local_modifiers?.length">
        <span class="k">Local Modifiers</span>
        <span>{{ store.lastPlan.baseline_summary.local_modifiers.map(formatLabel).join(', ') }}</span>
      </div>
    </div>

    <!-- Goals -->
    <div v-if="store.lastPlan?.treatment_goals || store.lastPlan?.measurable_goals" style="margin-top: 10px;">
      <h3>Measurable Treatment Goals</h3>
      <div v-for="(goals, timeframe) in (store.lastPlan.treatment_goals || store.lastPlan.measurable_goals)" :key="timeframe" style="margin-bottom: 8px; font-size: 11px;">
        <b>Goal for {{ formatTiming(timeframe) }}:</b> {{ goals.clinical_goal }}
        <div style="margin-left: 12px; margin-top: 2px;">
          <span v-if="goals.melanin_load_target !== undefined || goals.melanin_load_index_target_max !== undefined">Melanin target: {{ goals.melanin_load_target ?? goals.melanin_load_index_target_max }}/100; </span>
          <span v-if="goals.erythema_load_target !== undefined || goals.erythema_load_index_target_max !== undefined">Erythema target: {{ goals.erythema_load_target ?? goals.erythema_load_index_target_max }}/100; </span>
          <span v-if="goals.mmasi_target_if_applicable !== null && goals.mmasi_target_if_applicable !== undefined">mMASI: {{ goals.mmasi_target_if_applicable }}/24; </span>
          <span v-if="goals.depth_call_target">Depth: {{ formatLabel(goals.depth_call_target) }}</span>
          
          <div v-if="goals.regional_goals?.length" style="margin-top: 2px;">
            <u>Regional Targets:</u> 
            <span v-for="rg in goals.regional_goals" :key="rg.region">
              {{ formatLabel(rg.region) }} ({{ rg.baseline_melanin_load }} → {{ rg.target_melanin_load }}); 
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Laser Wavelength Optimizer -->
    <div v-if="store.lastPlan?.q_switch_optimizer" style="margin-top: 10px;">
      <h3>Laser Wavelength Optimizer</h3>
      <div v-if="store.lastPlan.q_switch_optimizer.selected_setting" style="padding: 6px; border: 1px solid #ccc; border-radius: 4px; font-size: 11px;">
        <b>AI Selected Setting:</b> {{ store.lastPlan.q_switch_optimizer.selected_setting.wavelength_nm }}nm | {{ store.lastPlan.q_switch_optimizer.selected_setting.energy_mj }}mJ | {{ store.lastPlan.q_switch_optimizer.selected_setting.fluence_j_cm2 }} J/cm² | {{ store.lastPlan.q_switch_optimizer.selected_setting.frequency_hz }}Hz | {{ store.lastPlan.q_switch_optimizer.selected_setting.passes }} passes
        <div><i>Selection Reason:</i> {{ store.lastPlan.q_switch_optimizer.selected_setting.selection_reason }}</div>
      </div>
      <div v-if="store.lastPlan.q_switch_optimizer.candidate_settings?.length" style="margin-top: 6px; font-size: 11px;">
        <b>Candidates Evaluated:</b>
        <ul style="margin: 2px 0 0 16px; padding: 0;">
          <li v-for="(cand, idx) in store.lastPlan.q_switch_optimizer.candidate_settings" :key="idx">
            {{ cand.wavelength_nm }}nm (Efficacy: {{ cand.efficacy_score_100 }}, Safety: {{ cand.safety_score_100 }}, Overall: {{ cand.overall_score_100 }}): {{ cand.reason }}
          </li>
        </ul>
      </div>
    </div>

    <h3>Sessions Timeline</h3>
    <div v-for="session in store.lastPlan?.sessions" :key="session.session_number" style="margin-bottom: 16px; border-bottom: 1px dashed #eee; padding-bottom: 10px; page-break-inside: avoid;">
      <b>Session {{ session.session_number }} — {{ formatTiming(session.timing) }}</b>
      <div style="margin-left: 12px; font-size: 12px;">
        <div><i>Goal:</i> {{ session.goal }}</div>
        <div v-if="session.selected_modalities?.length" style="margin-top: 2px;">
          <i>Selected Modalities:</i> {{ session.selected_modalities.map(formatLabel).join(', ') }}
        </div>
        
        <!-- Clinical Fixed Protocol -->
        <div v-if="session.fixed_protocol" style="margin-top: 6px; border-left: 2px solid #bbb; padding-left: 8px;">
          <b>Clinical Fixed Protocol:</b> {{ formatLabel(session.fixed_protocol.procedure) }}
          
          <ul style="margin: 2px 0 4px 18px;">
            <!-- Q-Switch details -->
            <li v-if="session.fixed_protocol.q_switch?.use">
              Laser: {{ session.fixed_protocol.q_switch.wavelength_nm }}nm | Energy: {{ session.fixed_protocol.q_switch.energy_mj }}mJ | Fluence: {{ session.fixed_protocol.q_switch.fluence_j_cm2 }} J/cm² | Freq: {{ session.fixed_protocol.q_switch.frequency_hz }} Hz | Passes: {{ session.fixed_protocol.q_switch.passes }} | Endpoint: {{ session.fixed_protocol.q_switch.endpoint }}
            </li>
            <!-- Peel details -->
            <li v-if="session.fixed_protocol.peel?.use">
              Peel: {{ formatLabel(session.fixed_protocol.peel.peel_name) }} | Contact Time: {{ session.fixed_protocol.peel.contact_time_minutes }} min | Neutralization: {{ session.fixed_protocol.peel.neutralization_required ? 'Yes' : 'No' }}
            </li>
            <!-- Microneedling details -->
            <li v-if="session.fixed_protocol.microneedling?.use">
              Microneedling: {{ session.fixed_protocol.microneedling.device }} | Route: {{ formatLabel(session.fixed_protocol.microneedling.route) }} | Injectable: {{ formatLabel(session.fixed_protocol.microneedling.injectable) }}
              <div v-if="session.fixed_protocol.microneedling.depth_by_region" style="font-size: 11px; margin-left: 10px;">
                Depths: <span v-for="(depth, region) in session.fixed_protocol.microneedling.depth_by_region" :key="region">{{ formatLabel(region) }}: {{ depth }}mm; </span>
              </div>
              <div v-if="session.fixed_protocol.microneedling.actives?.length" style="font-size: 11px; margin-left: 10px;">
                Actives: {{ session.fixed_protocol.microneedling.actives.map(formatLabel).join(', ') }}
              </div>
            </li>
            <!-- LED details -->
            <li v-if="session.fixed_protocol.led?.use">
              LED Mode: {{ formatLabel(session.fixed_protocol.led.mode) }} | Role: {{ formatLabel(session.fixed_protocol.led.role) }}
            </li>
            <!-- Decision Rule -->
            <li v-if="session.fixed_protocol.decision_rule">
              Rule: {{ session.fixed_protocol.decision_rule }}
            </li>
            <!-- Actions -->
            <li v-if="session.fixed_protocol.actions?.length">
              Actions: {{ session.fixed_protocol.actions.map(formatLabel).join('; ') }}
            </li>
          </ul>

          <!-- Homecare details -->
          <div v-if="session.fixed_protocol.homecare" style="margin-top: 4px; font-size: 11px;">
            <b>Homecare regime initiated:</b>
            <div style="margin-left: 10px;" v-if="session.fixed_protocol.homecare.morning?.length">
              ☀️ Morning: {{ session.fixed_protocol.homecare.morning.map(formatLabel).join(', ') }}
            </div>
            <div style="margin-left: 10px;" v-if="session.fixed_protocol.homecare.night?.length">
              🌙 Night: {{ session.fixed_protocol.homecare.night.map(formatLabel).join(', ') }}
            </div>
            <div style="margin-left: 10px;" v-if="session.fixed_protocol.homecare.avoid?.length">
              ⚠️ Avoid: {{ session.fixed_protocol.homecare.avoid.map(formatLabel).join(', ') }}
            </div>
          </div>

          <!-- Local Modifier Actions -->
          <div v-if="session.fixed_protocol.local_modifier_actions?.length" style="margin-top: 4px; font-size: 11px;">
            <b>Local Modifier Actions:</b>
            <div v-for="lm in session.fixed_protocol.local_modifier_actions" :key="lm.region" style="margin-left: 10px;">
              📍 {{ formatLabel(lm.region) }}: {{ formatLabel(lm.action) }}
            </div>
          </div>
        </div>

        <!-- In-clinic Provider Protocol -->
        <div v-if="session.provider_protocol" style="margin-top: 6px; border-left: 2px solid #58b; padding-left: 8px; font-size: 11px;">
          <b>In-Clinic Provider Protocol (Performed by {{ formatLabel(session.provider_protocol.performed_by) }}):</b>
          <div v-if="session.provider_protocol.pre_treatment_checklist?.length" style="margin-left: 6px;">
            <u>Pre-treatment checklist:</u> {{ session.provider_protocol.pre_treatment_checklist.join('; ') }}
          </div>
          <div v-if="session.provider_protocol.zone_sequence?.length" style="margin-left: 6px; margin-top: 2px;">
            <u>Zone sequence:</u>
            <div v-for="z in session.provider_protocol.zone_sequence" :key="z.order" style="margin-left: 6px;">
              #{{ z.order }} - {{ formatLabel(z.zone) }} (Reason: {{ z.reason }}): {{ z.settings ? z.settings.wavelength_nm + 'nm ' + z.settings.energy_mj + 'mJ ' + z.settings.passes + 'passes' : '—' }} | Endpoint: {{ formatLabel(z.endpoint) }}
            </div>
          </div>
          <div v-if="session.provider_protocol.avoid_zones?.length" style="margin-left: 6px; margin-top: 2px; color: #a22;">
            <u>Zones to Avoid:</u> <span v-for="az in session.provider_protocol.avoid_zones" :key="az.zone">{{ formatLabel(az.zone) }} ({{ az.reason }}); </span>
          </div>
          <div v-if="session.provider_protocol.endpoint_rules?.length" style="margin-left: 6px; margin-top: 2px;">
            <u>Stop/Safety rules:</u> {{ session.provider_protocol.endpoint_rules.join('; ') }}
          </div>
          <div v-if="session.provider_protocol.post_treatment_steps?.length" style="margin-left: 6px; margin-top: 2px;">
            <u>Post-treatment steps:</u> {{ session.provider_protocol.post_treatment_steps.join('; ') }}
          </div>
          <div v-if="session.provider_protocol.homecare_handover?.length" style="margin-left: 6px; margin-top: 2px;">
            <u>Handover:</u> {{ session.provider_protocol.homecare_handover.join('; ') }}
          </div>
        </div>

        <!-- Authorization Box -->
        <div v-if="session.authorization" style="margin-top: 6px; font-size: 11px; color: #444; background: #eee; padding: 4px; border-radius: 4px;">
          <b>Authorization:</b> Sign-off required: {{ session.authorization.doctor_signoff_required ? 'Yes' : 'No' }} | Status: {{ formatLabel(session.authorization.approval_status) }}
          <div v-if="session.authorization.doctor_performed_steps?.length" style="margin-left: 10px;">
            Doctor steps: {{ session.authorization.doctor_performed_steps.join('; ') }}
          </div>
          <div v-if="session.authorization.therapist_after_approval_steps?.length" style="margin-left: 10px;">
            Therapist steps: {{ session.authorization.therapist_after_approval_steps.join('; ') }}
          </div>
        </div>

        <!-- Reassessment Gate -->
        <div v-if="session.reassessment_required || session.continue_if" style="margin-top: 6px; font-size: 11px; color: #555;">
          <b>Reassessment Gate Required:</b>
          <span v-if="session.repeat_images?.length"> Repeat: {{ session.repeat_images.join(', ') }}</span>
          <div v-if="session.continue_if" style="margin-left: 10px;">
            Continue criteria: Min Melanin Reduction: {{ session.continue_if.melanin_load_index_reduction_min }} | Max Erythema Increase: {{ session.continue_if.erythema_load_not_increased_by_more_than }}
          </div>
        </div>
      </div>
    </div>

    <!-- Reassessment Plan printed -->
    <div v-if="store.lastPlan?.reassessment_plan" style="margin-top: 10px; page-break-inside: avoid;">
      <h3>Reassessment Plan</h3>
      <div style="font-size: 11px; margin-left: 10px;">
        <div v-if="store.lastPlan.reassessment_plan.repeat_images?.length">
          <b>Repeat Images:</b> {{ store.lastPlan.reassessment_plan.repeat_images.join(', ') }}
        </div>
        <div v-if="store.lastPlan.reassessment_plan.metrics_to_compare?.length">
          <b>Metrics to Compare:</b> {{ store.lastPlan.reassessment_plan.metrics_to_compare.map(formatLabel).join(', ') }}
        </div>
        <div v-if="store.lastPlan.reassessment_plan.decision_rules?.length">
          <b>Decision Rules:</b>
          <ul style="margin: 2px 0 0 16px; padding: 0;">
            <li v-for="rule in store.lastPlan.reassessment_plan.decision_rules" :key="rule">{{ rule }}</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Client Report Printed -->
    <div v-if="store.lastPlan?.client_report" style="margin-top: 10px; page-break-inside: avoid;">
      <h3>Client Report &amp; Comm</h3>
      <div style="font-size: 11px; margin-left: 10px;">
        <div v-if="store.lastPlan.client_report.headline">
          <i>Headline:</i> "{{ store.lastPlan.client_report.headline }}"
        </div>
        <div v-if="store.lastPlan.client_report.simple_explanation" style="margin-top: 4px;">
          <i>Explanation:</i> {{ store.lastPlan.client_report.simple_explanation }}
        </div>
        <div v-if="store.lastPlan.client_report.roadmap?.length" style="margin-top: 4px;">
          <i>Roadmap Milestones:</i>
          <ol style="margin: 2px 0 0 16px; padding: 0;">
            <li v-for="step in store.lastPlan.client_report.roadmap" :key="step">{{ step }}</li>
          </ol>
        </div>
      </div>
    </div>

    <div v-if="store.lastPlan?.whatsapp_summary?.message" style="margin-top: 10px; page-break-inside: avoid;">
      <b>WhatsApp Copy:</b>
      <div style="font-family: monospace; white-space: pre-line; font-size: 11px; background: #e8f5e9; padding: 8px; border-radius: 4px; border-left: 3px solid #4caf50; color: #1b5e20;">
        {{ store.lastPlan.whatsapp_summary.message }}
      </div>
    </div>

    <!-- Goals -->
    <h2 v-if="store.goals?.length">
      Goals (set at assessment · checked at reassessment)
    </h2>
    <ul v-if="store.goals?.length">
      <li v-for="(g, gIdx) in store.goals" :key="gIdx">
        <b>{{ g.metric }}</b> — baseline {{ g.baseline || '—' }} → target {{ g.target || '—' }} by {{ g.timeframe || '—' }}
      </li>
    </ul>

    <!-- Safety check markers -->
    <h2 v-if="store.lastPlan?.safety_flags?.length">Verify before prescribing</h2>
    <ul v-if="store.lastPlan?.safety_flags?.length">
      <li v-for="(f, fIdx) in store.lastPlan.safety_flags" :key="fIdx">
        {{ f }}
      </li>
    </ul>

    <h2 v-if="store.lastPlan?.patient_summary">For the patient</h2>
    <div v-if="store.lastPlan?.patient_summary">
      {{ store.lastPlan.patient_summary }}
    </div>

    <!-- Sign-off card printed -->
    <div class="signbox">
      <b>Clinician sign-off: {{ (store.reviewState.decision || '').toUpperCase() }}</b
      ><br />
      Reviewed by {{ store.reviewState.reviewer }} · {{ store.reviewState.ts?.toLocaleString() }}
      <span v-if="store.reviewState.notes"><br />Notes: {{ store.reviewState.notes }}</span>
      <br /><br />
      {{
        store.lastPlan?.disclaimer ||
        'AI-generated proposal reviewed by the treating clinician. Not a standalone diagnosis.'
      }}
    </div>
  </div>
</template>

<script setup>
import { usePigmentationStore } from 'src/stores/pigmentationStore'

const store = usePigmentationStore()

const cap = (s) => {
  const str = String(s || '')
  return str.charAt(0).toUpperCase() + str.slice(1)
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
</script>

<style scoped>
#printDoc {
  display: none;
}

@media print {
  #printDoc {
    display: block !important;
    padding: 26px 30px;
    max-width: 780px;
    margin: 0 auto;
    color: #000;
    font-size: 12.5px;
    background: #fff;
  }
  #printDoc h1 {
    font-family: 'Fraunces', serif;
    font-size: 22px;
    margin-bottom: 4px;
    font-weight: 500;
  }
  #printDoc .pmeta {
    color: #555;
    font-size: 12px;
    margin-bottom: 16px;
    border-bottom: 1px solid #ccc;
    padding-bottom: 12px;
  }
  #printDoc h2 {
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin: 16px 0 7px;
    border-bottom: 1px solid #ddd;
    padding-bottom: 3px;
    font-weight: 700;
  }
  #printDoc .row {
    display: flex;
    gap: 8px;
    padding: 3px 0;
    font-size: 12px;
  }
  #printDoc .row .k {
    color: #555;
    min-width: 150px;
  }
  #printDoc .signbox {
    margin-top: 20px;
    border: 1.5px solid #000;
    border-radius: 8px;
    padding: 12px 14px;
    font-size: 12px;
  }
  #printDoc .blocked {
    text-decoration: line-through;
    color: #999;
  }
  #printDoc ul {
    margin: 4px 0 4px 18px;
  }
  #printDoc li {
    margin: 2px 0;
  }
}
</style>
