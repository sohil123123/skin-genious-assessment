<template>
  <div class="row q-col-gutter-md">
    <div class="col-12" v-for="plan in configuredOptions" :key="plan.value">
      <q-card
        flat
        bordered
        class="plan-card cursor-pointer"
        :class="{ 'plan-card--active': modelValue === plan.value }"
        @click="selectPlan(plan.value)"
      >
        <q-card-section class="row items-center justify-between no-wrap">
          <div class="row items-center col">
            <div class="col-auto">
              <q-icon
                :name="plan.icon"
                size="40px"
                :color="modelValue === plan.value ? 'primary' : 'grey-8'"
              />
            </div>
            <div class="col q-pl-md">
              <div class="text-subtitle1 text-weight-bold text-grey-9">
                {{ plan.label }}
              </div>
              <div class="text-caption text-grey-8 font-medium" style="line-height: 1.4">
                {{ plan.description }}
              </div>
            </div>
          </div>
          <div class="col-auto q-pl-sm">
            <q-btn
              flat
              round
              dense
              color="primary"
              icon="info"
              size="sm"
              @click.stop="showPlanDetails(plan)"
            >
              <q-tooltip>View Plan Details</q-tooltip>
            </q-btn>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Plan Details Dialog -->
    <q-dialog v-model="detailsDialog" backdrop-filter="blur(4px)">
      <q-card style="width: 700px; max-width: 90vw" class="rounded-xl shadow-24">
        <q-card-section class="row items-center q-pb-none bg-grey-1 border-b-grey">
          <div class="text-h6 text-weight-bold text-grey-9 text-uppercase letter-spacing-1">
            {{ selectedPlanDetails?.name }}
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup color="grey-8" />
        </q-card-section>

        <q-card-section class="q-pa-none">
          <q-scroll-area style="height: 60vh" class="q-pa-md">
            <div v-if="selectedPlanDetails">
              <!-- Protocols Section -->
              <div v-if="selectedPlanDetails.protocols" class="q-mb-lg">
                <div
                  class="text-subtitle2 text-primary text-uppercase q-mb-sm font-bold letter-spacing-1"
                >
                  Treatment Protocols
                </div>
                <div
                  v-for="protocol in selectedPlanDetails.protocols"
                  :key="protocol.protocol_id"
                  class="bg-blue-grey-1 rounded-borders q-pa-md q-mb-md border-blue-grey"
                >
                  <div class="text-subtitle1 text-weight-bold text-blue-grey-9">
                    {{ protocol.label_short }}
                  </div>

                  <!-- Hero Ingredients -->
                  <div class="q-mt-md">
                    <span class="text-caption text-grey-8 text-weight-bold text-uppercase"
                      >Key Ingredients:</span
                    >
                    <div class="row q-gutter-xs q-mt-xs">
                      <q-badge
                        v-for="ing in protocol.hero_ingredients"
                        :key="ing"
                        color="teal-1"
                        text-color="teal-9"
                        class="q-px-sm q-py-xs font-medium"
                      >
                        {{ ing }}
                      </q-badge>
                    </div>
                  </div>

                  <!-- Intended Benefits -->
                  <div class="q-mt-md" v-if="protocol.intended_benefits_tags">
                    <span class="text-caption text-grey-8 text-weight-bold text-uppercase"
                      >Benefits:</span
                    >
                    <div class="row q-gutter-xs q-mt-xs">
                      <q-chip
                        v-for="tag in protocol.intended_benefits_tags"
                        :key="tag"
                        dense
                        size="sm"
                        color="blue-1"
                        text-color="blue-9"
                        class="font-medium"
                      >
                        {{ tag }}
                      </q-chip>
                    </div>
                  </div>

                  <!-- Axis Targeting -->
                  <div class="q-mt-md" v-if="protocol.axis_targeting_intent">
                    <div class="text-caption text-grey-8 text-weight-bold text-uppercase">
                      Targeting:
                    </div>
                    <div class="text-caption text-grey-9 q-mb-sm leading-snug">
                      {{ protocol.axis_targeting_intent.why_these_axes }}
                    </div>
                    <div class="row q-gutter-xs">
                      <q-badge
                        v-for="axis in protocol.axis_targeting_intent.primary_axes"
                        :key="axis"
                        color="purple-1"
                        text-color="purple-9"
                        class="q-px-sm q-py-xs font-medium"
                      >
                        {{ axis }}
                      </q-badge>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Constraint Report -->
              <div v-if="selectedPlanDetails.constraint_report" class="q-mb-lg">
                <q-banner
                  rounded
                  class="bg-orange-1 text-brown-9 border-orange"
                  v-if="selectedPlanDetails.constraint_report.status !== 'allowed'"
                >
                  <template v-slot:avatar>
                    <q-icon name="warning" color="orange-9" />
                  </template>
                  <div class="text-weight-bold q-mb-xs">Constraints Applied</div>
                  <ul class="q-my-none q-pl-md text-body2">
                    <li
                      v-for="msg in selectedPlanDetails.constraint_report.messages"
                      :key="msg"
                      class="q-mb-xs"
                    >
                      {{ msg }}
                    </li>
                    <li
                      v-for="cap in selectedPlanDetails.constraint_report
                        .applied_caps_or_restrictions"
                      :key="cap"
                      class="q-mb-xs"
                    >
                      {{ cap }}
                    </li>
                  </ul>
                </q-banner>
              </div>

              <!-- Scheduling (Multi-session specific) -->
              <div v-if="selectedPlanDetails.sessions" class="q-mb-md">
                <div
                  class="text-subtitle2 text-primary text-uppercase q-mb-sm font-bold letter-spacing-1"
                >
                  Session Schedule ({{ selectedPlanDetails.plan_duration_weeks }} Weeks)
                </div>
                <q-timeline color="primary" layout="dense">
                  <q-timeline-entry
                    v-for="session in selectedPlanDetails.sessions"
                    :key="session.week_index"
                    icon="event"
                  >
                    <template v-slot:title>
                      <div class="text-subtitle2 text-weight-bold text-grey-9">
                        Week {{ session.week_index }}: {{ session.session_goal_summary }}
                      </div>
                    </template>
                    <template v-slot:subtitle>
                      <div class="text-caption text-uppercase text-primary font-medium">
                        {{ formatPhase(session.phase_id) }}
                      </div>
                    </template>

                    <div class="text-body2 text-grey-8 q-mb-sm">
                      {{ session.candidate_generation_hint }}
                    </div>
                    <div v-if="session.recommended_protocol" class="q-mt-sm">
                      <div class="text-caption text-weight-bold text-grey-7 q-mb-xs">
                        Recommended:
                      </div>
                      <q-chip
                        v-for="hero in session.recommended_protocol.hero_ingredients"
                        :key="hero"
                        dense
                        size="xs"
                        color="teal-1"
                        text-color="teal-9"
                        class="font-medium"
                        >{{ hero }}</q-chip
                      >
                    </div>
                  </q-timeline-entry>
                </q-timeline>
              </div>
            </div>
          </q-scroll-area>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: 'single_session_option_1',
  },
  detailedPlans: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue'])

const detailsDialog = ref(false)
const selectedPlanDetails = ref(null)

const planOptionsConfig = [
  {
    value: 'single_session_option_1',
    label: 'Single Session (Option 1)',
    icon: 'looks_one',
    description: 'Primary recommended single session treatment.',
  },
  {
    value: 'single_session_option_2',
    label: 'Single Session (Option 2)',
    icon: 'looks_two',
    description: 'Alternative single session option.',
  },
  {
    value: 'plan_option',
    label: 'Full Treatment Plan',
    icon: 'calendar_month',
    description: 'Comprehensive multi-session approach.',
  },
  {
    value: 'budget_option',
    label: 'Budget Friendly',
    icon: 'savings',
    description: 'Cost-effective essential treatment.',
  },
]

// Merge detailed plan data ("protocols", etc) with the UI config ("icon", "description")
const configuredOptions = computed(() => {
  return planOptionsConfig.map((opt) => {
    // Find matching detailed plan
    const detail = props.detailedPlans.find((p) => p.option_type === opt.value)

    return {
      ...opt,
      label: detail ? detail.name.split('_')[0] : opt.label, // Simplified name parsing or use opt.label
      detailData: detail,
    }
  })
})

function selectPlan(value) {
  emit('update:modelValue', value)
}

function showPlanDetails(plan) {
  selectedPlanDetails.value = plan.detailData
  detailsDialog.value = true
}

function formatPhase(phaseId) {
  if (!phaseId) return ''
  return phaseId.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}
</script>

<style scoped>
.rounded-xl {
  border-radius: 16px;
}
.plan-card {
  transition: all 0.2s ease;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
}
.plan-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
  border-color: #bdbdbd;
}
.plan-card--active {
  border: 2px solid var(--q-primary) !important;
  background-color: #f5f9ff !important;
  box-shadow: 0 0 0 1px var(--q-primary);
}

.font-medium {
  font-weight: 500;
}
.font-bold {
  font-weight: 700;
}
.letter-spacing-1 {
  letter-spacing: 0.05em;
}
.border-b-grey {
  border-bottom: 1px solid #eee;
}
.border-blue-grey {
  border: 1px solid #cfd8dc;
}
.border-orange {
  border: 1px solid #ffe0b2;
}
.leading-snug {
  line-height: 1.4;
}
</style>
