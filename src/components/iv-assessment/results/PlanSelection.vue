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
                :color="modelValue === plan.value ? 'primary' : 'grey-7'"
              />
            </div>
            <div class="col q-pl-md">
              <div class="text-subtitle1 text-weight-medium">
                {{ plan.label }}
              </div>
              <div class="text-caption text-grey-7" style="line-height: 1.2">
                {{ plan.description }}
              </div>
            </div>
          </div>
          <div class="col-auto q-pl-sm">
            <q-btn
              flat
              round
              dense
              color="info"
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
      <q-card style="width: 700px; max-width: 90vw" class="rounded-xl">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 text-weight-bold">{{ selectedPlanDetails?.name }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-scroll-area style="height: 60vh">
            <div v-if="selectedPlanDetails" class="q-pa-sm">
              <!-- Protocols Section -->
              <div v-if="selectedPlanDetails.protocols" class="q-mb-md">
                <div class="text-subtitle2 text-primary q-mb-sm">Treatment Protocols</div>
                <div
                  v-for="protocol in selectedPlanDetails.protocols"
                  :key="protocol.protocol_id"
                  class="bg-grey-1 rounded-borders q-pa-md q-mb-sm"
                >
                  <div class="text-weight-bold">{{ protocol.label_short }}</div>

                  <!-- Hero Ingredients -->
                  <div class="q-mt-sm">
                    <span class="text-caption text-grey-8 text-weight-medium"
                      >Key Ingredients:</span
                    >
                    <div class="row q-gutter-xs q-mt-xs">
                      <q-chip
                        v-for="ing in protocol.hero_ingredients"
                        :key="ing"
                        class="gredient"
                        text-color="white"
                        size="md"
                      >
                        {{ ing }}
                      </q-chip>
                    </div>
                  </div>

                  <!-- Intended Benefits -->
                  <div class="q-mt-md" v-if="protocol.intended_benefits_tags">
                    <span class="text-caption text-grey-8 text-weight-medium">Benefits:</span>
                    <div class="row q-gutter-xs q-mt-xs">
                      <q-chip
                        v-for="tag in protocol.intended_benefits_tags"
                        :key="tag"
                        outline
                        color="green"
                        size="md"
                      >
                        {{ tag }}
                      </q-chip>
                    </div>
                  </div>

                  <!-- Axis Targeting -->
                  <div class="q-mt-md" v-if="protocol.axis_targeting_intent">
                    <div class="text-caption text-grey-8 text-weight-medium">Targeting:</div>
                    <div class="text-caption text-grey-7">
                      {{ protocol.axis_targeting_intent.why_these_axes }}
                    </div>
                    <div class="row q-gutter-xs q-mt-xs">
                      <q-badge
                        v-for="axis in protocol.axis_targeting_intent.primary_axes"
                        :key="axis"
                        color="accent"
                        outline
                      >
                        {{ axis }}
                      </q-badge>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Constraint Report -->
              <div v-if="selectedPlanDetails.constraint_report" class="q-mb-md">
                <q-banner
                  rounded
                  class="bg-orange-1 text-orange-9"
                  v-if="selectedPlanDetails.constraint_report.status !== 'allowed'"
                >
                  <template v-slot:avatar>
                    <q-icon name="warning" color="warning" />
                  </template>
                  <div class="text-weight-medium">Constraints Applied</div>
                  <ul class="q-my-none q-pl-md" style="font-size: 0.9em">
                    <li v-for="msg in selectedPlanDetails.constraint_report.messages" :key="msg">
                      {{ msg }}
                    </li>
                    <li
                      v-for="cap in selectedPlanDetails.constraint_report
                        .applied_caps_or_restrictions"
                      :key="cap"
                    >
                      {{ cap }}
                    </li>
                  </ul>
                </q-banner>
              </div>

              <!-- Scheduling (Multi-session specific) -->
              <div v-if="selectedPlanDetails.sessions" class="q-mb-md">
                <div class="text-subtitle2 text-primary q-mb-sm">
                  Session Schedule ({{ selectedPlanDetails.plan_duration_weeks }} Weeks)
                </div>
                <q-timeline color="secondary" layout="dense">
                  <q-timeline-entry
                    v-for="session in selectedPlanDetails.sessions"
                    :key="session.week_index"
                    :title="`Week ${session.week_index}: ${session.session_goal_summary}`"
                    :subtitle="formatPhase(session.phase_id)"
                    icon="event"
                  >
                    <div class="text-caption text-grey-8">
                      {{ session.candidate_generation_hint }}
                    </div>
                    <div v-if="session.recommended_protocol_week_optional" class="q-mt-xs">
                      <q-chip
                        v-for="hero in session.recommended_protocol_week_optional.hero_ingredients"
                        :key="hero"
                        dense
                        size="xs"
                        color="grey-3"
                        text-color="black"
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

    // If detail exists, we can override label/description if desired,
    // or just attach the detail for the popup.
    // For now, let's keep the UI config label unless we want to use the detailed name.
    // Let's use the detailed name if available, it's more descriptive usually.
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
