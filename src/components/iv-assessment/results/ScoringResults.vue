<template>
  <div class="q-pa-md">
    <div class="text-h5 text-weight-bold q-mb-lg flex items-center">
      <q-icon name="analytics" color="primary" size="32px" class="q-mr-sm" />
      Comprehensive Assessment Results
    </div>

    <div class="row q-col-gutter-lg justify-center">
      <!-- IV 8-Axes Scoring -->
      <div class="col-12 col-md-8">
        <q-card flat bordered class="rounded-xl shadow-sm overflow-hidden">
          <q-card-section class="bg-grey-1 py-4">
            <div class="text-subtitle1 text-weight-bold">Clinical Vitality Profiling (8 Axes)</div>
            <div class="text-caption text-grey-7">
              Multi-dimensional analysis of systemic health markers (Higher Score = Higher
              Burden/Need)
            </div>
          </q-card-section>

          <q-card-section class="q-pa-md">
            <div v-for="(score, axis) in processedScores" :key="axis" class="q-mb-md">
              <div class="flex justify-between items-center q-mb-xs">
                <div class="column">
                  <span class="text-weight-medium text-capitalize">{{
                    axisNames[axis] || axis
                  }}</span>
                  <!-- <span
                    v-if="drivers[axis]"
                    class="text-caption text-grey-6"
                    style="
                      font-size: 0.75rem;
                      line-height: 1.1em;
                      max-width: 400px;
                      margin-top: 2px;
                    "
                  >
                    {{ drivers[axis] }}
                  </span> -->
                </div>
                <span class="text-weight-bold" :class="getScoreColor(score)">{{ score }}%</span>
              </div>
              <q-linear-progress
                :value="score / 100"
                :color="getScoreProgressColor(score)"
                size="10px"
                rounded
                track-color="grey-3"
                class="q-mt-xs"
              />
            </div>
          </q-card-section>

          <q-card-actions align="center" class="q-pa-md">
            <q-btn
              color="purple"
              label="Generate Treatment Plan"
              no-caps
              icon="auto_awesome"
              size="md"
              @click="emit('handleTreatmentPlan')"
            />
          </q-card-actions>
        </q-card>
      </div>
      <!-- <div class="col-12 col-md-5">
        <q-card flat bordered class="rounded-xl shadow-sm full-height">
          <q-card-section class="bg-blue-1 py-4">
            <div class="text-subtitle1 text-weight-bold text-primary">Treatment Plan Selection</div>
            <div class="text-caption text-blue-9">Based on clinical scoring analysis</div>
          </q-card-section>

          <q-card-section class="q-pa-md">
            <PlanSelection
              :model-value="treatmentType"
              :detailed-plans="fullPlanOptions"
              @update:model-value="selectPlan"
            />
          </q-card-section>
        </q-card>
      </div> -->
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
// import PlanSelection from './PlanSelection.vue'

const props = defineProps({
  ivScores: {
    type: Object,
    default: () => ({}),
  },
  skinScores: {
    type: Object,
    default: () => ({}),
  },
  initialPlanType: {
    type: String,
    default: 'single_session_option_1',
  },
})

const emit = defineEmits(['handleTreatmentPlan'])
// const emit = defineEmits(['update:planType'])

// const treatmentType = ref(props.initialPlanType)

// Hardcoded plan option details as provided
// const fullPlanOptions = [
//   {
//     option_type: 'single_session_option_1',
//     name: 'Hydration+Calm_Magnesium+Vitamin C',
//     protocols: [
//       {
//         protocol_id: 'SSO1-001',
//         label_short: 'Hydration & Autonomic Calm',
//         bags: [
//           {
//             bag_id: 'bag-1',
//             carrier: 'Normal Saline (0.9%)',
//             bag_size_ml: 500,
//             rate_profile: 'SLOW',
//             min_duration_minutes: 90,
//             ingredients: [
//               { name: 'Magnesium', dose_mg_optional: 500 },
//               { name: 'Vitamin C (High Dose)', dose_mg_optional: 1500 },
//             ],
//           },
//         ],
//         hero_ingredients: ['Magnesium', 'Vitamin C (High Dose)'],
//         intended_benefits_tags: ['Hydration', 'Calm/ANS', 'Recovery'],
//         axis_targeting_intent: {
//           primary_axes: ['FENS', 'ASLS', 'ODS'],
//           why_these_axes: 'High hydration need with autonomic stress and oxidative burden',
//         },
//       },
//     ],
//     constraint_report: {
//       status: 'allowed',
//       actions: [],
//       messages: [],
//       applied_caps_or_restrictions: [],
//     },
//   },
//   {
//     option_type: 'single_session_option_2',
//     name: 'Energy+Focus_B-Complex+B12',
//     protocols: [
//       {
//         protocol_id: 'SSO2-001',
//         label_short: 'Metabolic Energy Support',
//         bags: [
//           {
//             bag_id: 'bag-1',
//             carrier: "Lactated Ringer's",
//             bag_size_ml: 500,
//             rate_profile: 'SLOW',
//             min_duration_minutes: 75,
//             ingredients: [
//               { name: 'B-Complex (B1/B2/B3/B5/B6)', dose_mg_optional: null },
//               { name: 'Methylcobalamin (B12)', dose_mg_optional: 1000 },
//             ],
//           },
//         ],
//         hero_ingredients: ['B-Complex (B1/B2/B3/B5/B6)', 'Methylcobalamin (B12)'],
//         intended_benefits_tags: ['Energy', 'Focus'],
//         axis_targeting_intent: {
//           primary_axes: ['MONS'],
//           why_these_axes: 'Fatigue and brain fog without need for stimulatory infusions',
//         },
//       },
//     ],
//     constraint_report: {
//       status: 'allowed_with_cautions',
//       actions: ['rate_restriction'],
//       messages: ['Avoid fast infusion due to moderate autonomic load'],
//       applied_caps_or_restrictions: ['SLOW rate enforced'],
//     },
//   },
//   {
//     option_type: 'plan_option',
//     name: 'Recovery+Glow_Adaptive 14 Week Plan',
//     plan_duration_weeks: 14,
//     schedule_description: 'weekly_first_4_weeks_then_biweekly',
//     sessions: [
//       {
//         week_index: 1,
//         phase_id: 'phase_1_reset_4_weeks',
//         session_goal_summary: 'Restore hydration and improve autonomic tolerance',
//         candidate_generation_hint: 'Hydration-first, magnesium-based, slow infusion',
//         recommended_protocol: {
//           protocol_id: 'PLAN-W1-001',
//           bags: [
//             {
//               bag_id: 'bag-1',
//               carrier: 'Normal Saline (0.9%)',
//               bag_size_ml: 500,
//               rate_profile: 'SLOW',
//               min_duration_minutes: 90,
//               ingredients: [{ name: 'Magnesium', dose_mg_optional: 500 }],
//             },
//           ],
//           hero_ingredients: ['Magnesium'],
//         },
//       },
//       {
//         week_index: 2,
//         phase_id: 'phase_1_reset_4_weeks',
//         session_goal_summary: 'Continue autonomic calming and circulation support',
//         candidate_generation_hint: 'Avoid stimulatory ingredients; reassess vitals',
//       },
//       {
//         week_index: 5,
//         phase_id: 'phase_2_build_6_weeks',
//         session_goal_summary: 'Target oxidative stress and skin barrier health',
//         candidate_generation_hint: 'Introduce antioxidants if constraints allow',
//       },
//       {
//         week_index: 11,
//         phase_id: 'phase_3_maintain_4_weeks',
//         session_goal_summary: 'Maintain gains with simpler, well-tolerated sessions',
//         candidate_generation_hint: 'Lower volume, minimal heroes',
//       },
//     ],
//   },
//   {
//     option_type: 'budget_option',
//     name: 'Budget Option_Hydration_Magnesium',
//     protocols: [
//       {
//         protocol_id: 'BUDGET-001',
//         label_short: 'Simple Hydration Support',
//         bags: [
//           {
//             bag_id: 'bag-1',
//             carrier: 'Normal Saline (0.9%)',
//             bag_size_ml: 250,
//             rate_profile: 'SLOW',
//             min_duration_minutes: 60,
//             ingredients: [{ name: 'Magnesium', dose_mg_optional: 250 }],
//           },
//         ],
//         hero_ingredients: ['Magnesium'],
//         intended_benefits_tags: ['Hydration', 'Calm/ANS'],
//         budget_candidate_optional: {
//           is_budget: true,
//           budget_rule: 'Exactly 1 hero ingredient; NAD+ excluded',
//         },
//       },
//     ],
//     constraint_report: {
//       status: 'allowed',
//       actions: [],
//       messages: [],
//       applied_caps_or_restrictions: [],
//     },
//   },
// ]

// const selectPlan = (type) => {
//   treatmentType.value = type
//   emit('update:planType', type)
// }

const processedScores = computed(() => {
  if (props.ivScores?.iv_scoring_output?.scores_public_0_100) {
    return props.ivScores.iv_scoring_output.scores_public_0_100
  }
  return []
})

// const drivers = computed(() => {
//   // Extract primary drivers from telemetry if available
//   if (props.ivScores?.iv_scoring_output?.telemetry?.primary_driver_per_axis) {
//     return props.ivScores.iv_scoring_output.telemetry.primary_driver_per_axis
//   }
//   return {}
// })

const axisNames = {
  FENS: 'Fluid & Electrolyte Need',
  PCCS: 'Perfusion & Circulation Constraint',
  ASLS: 'Autonomic Stress & Load',
  MONS: 'Mitochondrial Output Need',
  ODS: 'Oxidative / Detox Burden',
  ILS: 'Inflammation / Immune Load',
  MSGS: 'Metabolic Stability / Glycation',
  DGS: 'Dermal Glow / Barrier Support',
}

// Higher Score = Higher Burden = Bad (Red/Negative)
// Lower Score = Lower Burden = Good (Green/Positive)
const getScoreColor = (score) => {
  if (score < 40) return 'text-positive' // Green
  if (score < 70) return 'text-warning' // Orange
  return 'text-negative' // Red
}

const getScoreProgressColor = (score) => {
  if (score < 40) return 'positive'
  if (score < 70) return 'warning'
  return 'negative'
}
</script>

<style scoped>
.rounded-xl {
  border-radius: 16px;
}
.line-height-1 {
  line-height: 1;
}

.plan-card {
  transition: all 0.3s ease;
  border-radius: 12px;
}
.plan-card:hover {
  box-shadow: 0 0 12px rgba(25, 118, 210, 0.15);
  transform: translateY(-2px);
}
.plan-card--active {
  border: 2px solid #1976d2 !important;
  background-color: #e3f2fd !important;
}
</style>
