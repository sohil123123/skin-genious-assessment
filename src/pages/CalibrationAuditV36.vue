<template>
  <section v-if="skinState?.scoring_execution?.calibration_version" class="q-mt-lg q-pa-md bg-grey-1 rounded-borders">
    <h2 class="text-h6">Calibration audit — development only</h2>
    <p>Client scores: 1–100, higher is better. Legacy bands are reference labels; intermediate values use an inferred continuous mapping.</p>
    <div class="audit-scroll">
      <table>
        <thead><tr><th>Parameter</th><th>Health</th><th>New raw burden</th><th>Legacy reference</th><th>Threshold source</th></tr></thead>
        <tbody><tr v-for="p in parameters" :key="p.parameter_id">
          <td>{{ p.parameter_id }}</td><td>{{ p.display_score_1_to_100 }}</td>
          <td>{{ number(p.calibration.raw_new_composite_burden_0_to_1) }}</td>
          <td>{{ p.calibration.legacy_anchor_label || p.calibration.legacy_equivalent_grade_1_to_5 || p.calibration.legacy_sebum_state_grade_1_to_5 }}</td>
          <td>{{ p.calibration.cuts_origin || 'Inferred oil-balance bridge' }}</td>
        </tr></tbody>
      </table>
    </div>
    <details v-for="(feature, id) in skinState.core_features" :key="id" class="q-mt-sm">
      <summary>{{ id }} — burden {{ feature.global_burden_score_1_to_100 }}, reliability {{ feature.score_reliability?.score_1_to_100 }}/100</summary>
      <pre>{{ JSON.stringify({ zones: feature.zone_normalized_burdens_0_to_1, aggregation: feature.aggregation_details, reliability: feature.score_reliability, evidence: evidence?.features?.[id] }, null, 2) }}</pre>
    </details>
    <details class="q-mt-md"><summary>Full calibration mapping</summary><pre>{{ JSON.stringify(parameters.map(p => ({ parameter: p.parameter_id, calibration: p.calibration })), null, 2) }}</pre></details>
  </section>
</template>
<script setup>
import { computed } from 'vue'
const props = defineProps({ skinState: Object, evidence: Object })
const parameters = computed(() => Object.values(props.skinState?.derived_report_parameters ?? {}).filter(p => p.calibration))
const number = value => Number.isFinite(value) ? value.toFixed(4) : 'Unavailable'
</script>
<style scoped>
.audit-scroll { overflow-x: auto; }
table { border-collapse: collapse; width: 100%; text-align: left; font-size: 13px; }
th, td { border-bottom: 1px solid #ccc; padding: 8px; }
pre { white-space: pre-wrap; overflow-wrap: anywhere; max-height: 500px; overflow: auto; font-size: 12px; }
</style>
