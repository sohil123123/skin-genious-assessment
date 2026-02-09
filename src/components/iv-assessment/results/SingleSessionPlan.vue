<template>
  <div class="single-session-plan text-body2">
    <div class="row q-col-gutter-md">
      <!-- Left Column: Header & Constraints -->
      <div class="col-12 col-md-6 flex column gap-4">
        <!-- Plan Header -->
        <q-card class="plan-header-card overflow-hidden relative-position shadow-1 bg-white">
          <div class="bg-gradient-primary absolute-full z-0 opacity-10"></div>
          <q-card-section class="relative-position z-1 q-pa-md">
            <div class="text-overline text-primary q-mb-none font-medium opacity-80">
              SELECTED PROTOCOL
            </div>
            <div class="text-h5 text-weight-bold text-primary q-my-xs leading-tight">
              {{ planDetails.name }}
            </div>
            <div class="flex items-center q-gutter-x-sm q-mt-sm">
              <q-chip
                v-if="planDetails.option_type"
                color="blue-1"
                text-color="primary"
                size="sm"
                class="font-semibold"
              >
                {{ formatOptionType(planDetails.option_type) }}
              </q-chip>
              <q-chip
                v-if="constraintStatus"
                :color="constraintBgColor"
                :text-color="constraintTextColor"
                size="sm"
                :icon="constraintIcon"
                class="font-semibold"
              >
                {{ constraintStatusLabel }}
              </q-chip>
            </div>
          </q-card-section>
        </q-card>

        <!-- Safety & Constraints Warning -->
        <div v-if="hasConstraints" class="constraint-section">
          <q-card bordered class="shadow-sm rounded-borders border-warning bg-warning-light">
            <q-card-section class="q-py-sm bg-warning-subtle text-warning-dark border-b-warning">
              <div class="flex items-center">
                <q-icon name="warning_amber" size="20px" class="q-mr-sm" />
                <div class="text-subtitle2 text-weight-bold">Clinical Constraints & Cautions</div>
              </div>
            </q-card-section>
            <q-card-section
              class="q-pa-sm text-warning-darker text-caption scroll"
              style="max-height: 300px"
            >
              <!-- Messages -->
              <div v-if="planDetails.constraint_report.messages?.length" class="q-mb-sm">
                <div class="text-weight-bold q-mb-xs opacity-70">Analysis Details</div>
                <ul class="q-pl-md q-mt-none q-mb-none">
                  <li
                    v-for="(msg, i) in planDetails.constraint_report.messages"
                    :key="i"
                    class="q-mb-xs"
                  >
                    {{ msg }}
                  </li>
                </ul>
              </div>
              <!-- Actions -->
              <div v-if="planDetails.constraint_report.actions?.length">
                <div class="text-weight-bold q-mb-xs opacity-70">Required Actions</div>
                <ul class="q-pl-md q-mt-none q-mb-none">
                  <li
                    v-for="(act, i) in planDetails.constraint_report.actions"
                    :key="i"
                    class="q-mb-xs"
                  >
                    {{ act }}
                  </li>
                </ul>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Right Column: Protocol Composition -->
      <div class="col-12 col-md-6">
        <div class="text-subtitle1 text-weight-bold text-grey-9 q-mb-sm flex items-center">
          <q-icon name="medication_liquid" color="secondary" class="q-mr-sm" />
          Protocol Composition
        </div>

        <div class="column q-gutter-y-sm">
          <q-card
            v-for="protocol in planDetails.protocols"
            :key="protocol.protocol_id"
            flat
            bordered
            class="protocol-card rounded-borders shadow-sm bg-grey-1"
          >
            <!-- Protocol ID & Hero -->
            <q-card-section class="q-pa-sm border-b-grey">
              <div class="row items-center justify-between no-wrap">
                <div
                  class="text-caption text-grey-6 text-uppercase ellipsis"
                  style="max-width: 60%"
                >
                  ID: {{ protocol.protocol_id }}
                </div>
                <div class="flex q-gutter-x-xs no-wrap" v-if="protocol.hero_ingredients">
                  <q-badge
                    v-for="hero in protocol.hero_ingredients.slice(0, 2)"
                    :key="hero"
                    outline
                    color="secondary"
                    class="q-px-xs text-caption"
                  >
                    <q-icon name="star" size="10px" class="q-mr-xs" />{{ hero }}
                  </q-badge>
                  <q-badge v-if="protocol.hero_ingredients.length > 2" outline color="secondary">
                    +{{ protocol.hero_ingredients.length - 2 }}
                  </q-badge>
                </div>
              </div>
            </q-card-section>

            <!-- Bags -->
            <q-card-section class="q-pa-sm">
              <div class="column q-gutter-y-sm">
                <div
                  v-for="(bag, idx) in protocol.bags"
                  :key="idx"
                  class="bg-white rounded-borders q-pa-sm border-grey"
                >
                  <!-- Bag Header -->
                  <div class="row items-center justify-between q-mb-xs">
                    <div class="text-subtitle2 text-primary flex items-center">
                      <q-icon name="local_pharmacy" class="q-mr-xs" size="xs" />
                      Bag {{ idx + 1 }}
                    </div>
                    <div class="flex items-center gap-2">
                      <div class="text-caption text-weight-bold">{{ bag.bag_size_ml }}ml</div>
                      <q-badge
                        :color="getRateColor(bag.rate_profile)"
                        :label="bag.rate_profile"
                        rounded
                        class="q-px-sm text-xxs"
                      />
                    </div>
                  </div>

                  <div class="text-caption text-grey-8 q-mb-xs">
                    <span class="text-grey-6">Carrier:</span> {{ bag.carrier }}
                  </div>

                  <!-- Ingredients -->
                  <q-list dense class="q-mt-xs">
                    <q-item
                      v-for="(ing, i) in bag.ingredients"
                      :key="i"
                      class="q-px-none min-h-0 q-py-none"
                    >
                      <q-item-section avatar style="min-width: 20px" class="q-pr-xs">
                        <q-icon name="check" color="positive" size="14px" />
                      </q-item-section>
                      <q-item-section>
                        <div class="row justify-between items-center text-caption w-full">
                          <span class="text-grey-9 text-weight-medium">{{ ing.name }}</span>
                          <span
                            v-if="ing.dose_mg_optional"
                            class="text-grey-7 bg-grey-2 q-px-xs rounded-borders"
                            style="font-size: 11px"
                          >
                            {{ ing.dose_mg_optional }}mg
                          </span>
                        </div>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { startCase } from 'lodash'

const props = defineProps({
  planDetails: {
    type: Object,
    required: true,
  },
})

const hasConstraints = computed(() => {
  const report = props.planDetails.value?.constraint_report || props.planDetails?.constraint_report
  if (!report) return false
  return (
    report.status !== 'allowed' ||
    (report.messages && report.messages.length > 0) ||
    (report.actions && report.actions.length > 0)
  )
})

const constraintStatus = computed(() => props.planDetails?.constraint_report?.status)

const constraintStatusLabel = computed(() => {
  const status = constraintStatus.value
  if (!status) return ''
  return startCase(status.replace(/_/g, ' '))
})

const constraintIcon = computed(() => {
  const status = constraintStatus.value
  if (status === 'allowed') return 'check_circle'
  if (status === 'allowed_with_cautions') return 'warning'
  return 'error'
})

const constraintBgColor = computed(() => {
  const status = constraintStatus.value
  if (status === 'allowed') return 'positive'
  if (status === 'allowed_with_cautions') return 'warning'
  return 'negative'
})

const constraintTextColor = computed(() => {
  return 'white'
})

const formatOptionType = (type) => {
  if (!type) return ''
  return startCase(type.replace(/_/g, ' '))
}

const getRateColor = (rate) => {
  if (rate === 'SLOW') return 'deep-orange' // Darker orange for better contrast
  if (rate === 'MODERATE') return 'primary'
  return 'positive'
}
</script>

<style scoped>
.plan-header-card {
  border-radius: 12px;
  border: 1px solid #e0e0e0;
}

.bg-gradient-primary {
  background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
}

/* Constraint Colors - Compact & Readable */
.bg-warning-light {
  background-color: #fff8e1; /* Very light amber */
}
.bg-warning-subtle {
  background-color: #ffecb3; /* Slightly darker header */
}
.text-warning-dark {
  color: #8d6e63; /* Brownish contrast */
}
.text-warning-darker {
  color: #5d4037; /* Darker brown for text */
}
.border-warning {
  border: 1px solid #ffca28;
}
.border-b-warning {
  border-bottom: 1px solid #ffca28;
}

.border-b-grey {
  border-bottom: 1px solid #eee;
}
.border-grey {
  border: 1px solid #eee;
}

.opacity-10 {
  opacity: 0.1;
}
.opacity-80 {
  opacity: 0.8;
}
.opacity-70 {
  opacity: 0.7;
}

.leading-tight {
  line-height: 1.15;
}

.gap-2 {
  gap: 0.5rem;
}
.gap-4 {
  gap: 1rem;
}

.min-h-0 {
  min-height: 0 !important;
}

.text-xxs {
  font-size: 10px !important;
}
</style>
