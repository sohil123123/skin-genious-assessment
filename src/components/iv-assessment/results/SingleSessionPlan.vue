<template>
  <div class="single-session-plan text-body2">
    <div class="row q-col-gutter-md">
      <!-- Left Column: Header & Constraints -->
      <div class="col-12 col-md-6 flex column gap-4">
        <!-- Plan Header -->
        <q-card class="plan-header-card overflow-hidden relative-position shadow-1 bg-white">
          <div class="bg-blue-1 absolute-full z-0 opacity-30"></div>
          <q-card-section class="relative-position z-1 q-pa-md">
            <div class="text-overline text-grey-9 q-mb-none font-medium opacity-100">
              SELECTED PROTOCOL
            </div>
            <div class="text-h5 text-weight-bold text-dark q-my-xs leading-tight">
              {{ planDetails.name }}
            </div>
            <div class="flex items-center q-gutter-x-sm q-mt-sm">
              <q-chip
                v-if="planDetails.option_type"
                color="white"
                text-color="primary"
                size="sm"
                class="font-semibold shadow-1"
              >
                {{ formatOptionType(planDetails.option_type) }}
              </q-chip>
              <q-chip
                v-if="constraintStatus"
                :color="constraintBgColor"
                :text-color="constraintTextColor"
                size="sm"
                :icon="constraintIcon"
                class="font-semibold shadow-1"
              >
                {{ constraintStatusLabel }}
              </q-chip>
              <q-btn
                outline
                label="Download Report"
                color="primary"
                icon="download"
                class="q-ml-auto"
                @click="downloadPDF"
              >
                <q-tooltip>Download PDF</q-tooltip>
              </q-btn>
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
                <div class="text-weight-bold q-mb-xs opacity-100">Analysis Details</div>
                <ul class="q-pl-md q-mt-none q-mb-none text-body2">
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
                <div class="text-weight-bold q-mb-xs opacity-100">Required Actions</div>
                <ul class="q-pl-md q-mt-none q-mb-none text-body2">
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

        <!-- Clinical Rationale -->
        <q-card v-if="planDetails.client_facing_explanation" class="shadow-sm rounded-borders border-grey q-mt-md">
          <q-card-section class="q-py-sm bg-grey-1 border-b-grey">
            <div class="flex items-center">
              <q-icon name="psychology" size="20px" class="q-mr-sm text-primary" />
              <div class="text-subtitle2 text-weight-bold">Why This Plan Today?</div>
            </div>
          </q-card-section>
          <q-card-section class="q-pa-md">
            <div class="text-body2 text-grey-9 q-mb-sm">
              {{ planDetails.client_facing_explanation.why_today }}
            </div>
            <div class="text-caption text-grey-8 q-mb-md" v-if="planDetails.dominant_axis_explainability">
              <span class="text-weight-bold">Primary Target:</span> Axis {{ planDetails.dominant_axis_explainability.dominant_axis }} (Driven by {{ planDetails.dominant_axis_explainability.dominant_axis_driver_sentence }})
            </div>
            
            <div v-if="planDetails.client_facing_explanation.who_should_not_take_today?.length">
               <div class="text-weight-bold text-negative q-mb-xs">Contraindications for Today</div>
               <ul class="q-pl-md q-mt-none q-mb-none text-body2 text-grey-9">
                 <li v-for="(item, i) in planDetails.client_facing_explanation.who_should_not_take_today" :key="i">
                   {{ item }}
                 </li>
               </ul>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Right Column: Protocol Composition -->
      <div class="col-12 col-md-6">
        <div class="text-subtitle1 text-weight-bold text-dark q-mb-sm flex items-center">
          <q-icon name="medication_liquid" color="primary" class="q-mr-sm" />
          Protocol Composition
        </div>

        <div class="column q-gutter-y-sm">
          <q-card
            v-for="protocol in planDetails.protocols"
            :key="protocol.protocol_id"
            flat
            bordered
            class="protocol-card rounded-borders shadow-sm bg-white"
          >
            <!-- Protocol ID & Hero -->
            <q-card-section class="q-pa-sm border-b-grey bg-grey-1">
              <div class="row items-center justify-between">
                <div
                  class="text-caption text-grey-9 text-uppercase ellipsis text-weight-medium"
                  style="max-width: 60%"
                >
                  ID: {{ protocol.protocol_id }}
                </div>
                <div class="flex q-gutter-x-xs no-wrap" v-if="protocol.hero_ingredients">
                  <q-badge
                    v-for="hero in protocol.hero_ingredients.slice(0, 2)"
                    :key="hero"
                    outline
                    class="q-px-xs text-caption text-primary bg-blue-1 border-primary"
                  >
                    <q-icon name="star" size="10px" class="q-mr-xs" />{{ hero }}
                  </q-badge>
                  <q-badge
                    v-if="protocol.hero_ingredients.length > 2"
                    outline
                    class="text-primary bg-blue-1 border-primary"
                  >
                    +{{ protocol.hero_ingredients.length - 2 }}
                  </q-badge>
                </div>
              </div>
              <div class="row items-center q-mt-sm" v-if="protocol.ui_summary">
                <div class="flex items-center text-caption text-grey-9 q-mr-md" v-if="protocol.ui_summary.estimated_total_duration_minutes">
                  <q-icon name="schedule" size="14px" class="q-mr-xs text-primary" />
                  Est. Duration: ~{{ protocol.ui_summary.estimated_total_duration_minutes }} mins
                </div>
                <div class="flex items-center text-caption text-grey-9" v-if="protocol.ui_summary.display_benefits_string">
                  <q-icon name="auto_awesome" size="14px" class="q-mr-xs text-primary" />
                  Benefits: {{ protocol.ui_summary.display_benefits_string }}
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
                    <div class="text-subtitle2 text-dark flex items-center text-weight-bold">
                      <q-icon name="local_pharmacy" class="q-mr-xs text-primary" size="xs" />
                      Bag {{ idx + 1 }}
                    </div>
                    <div class="flex items-center gap-2">
                      <div class="text-caption text-weight-bold text-dark">
                        {{ bag.bag_size_ml }}ml
                      </div>
                      <q-badge
                        :color="getRateColor(bag.rate_profile)"
                        :label="bag.rate_profile"
                        rounded
                        class="q-px-sm text-xxs shadow-1"
                      />
                    </div>
                  </div>

                  <div class="text-body2 text-grey-9 q-mb-xs">
                    <span class="text-grey-8 text-weight-medium">Carrier:</span> {{ bag.carrier }}
                  </div>

                  <!-- Ingredients -->
                  <q-list dense class="q-mt-sm">
                    <q-item
                      v-for="(ing, i) in bag.ingredients"
                      :key="i"
                      class="q-px-none min-h-0 q-py-none"
                    >
                      <q-item-section avatar style="min-width: 20px" class="q-pr-xs">
                        <q-icon name="check_circle" color="positive" size="14px" />
                      </q-item-section>
                      <q-item-section>
                        <div class="row justify-between items-center text-body2 w-full">
                          <span class="text-grey-10 text-weight-medium">{{ ing?.name }}</span>
                          <span
                            v-if="ing?.dose_mg_optional"
                            class="text-grey-9 bg-grey-2 q-px-xs rounded-borders"
                            style="font-size: 12px"
                          >
                            {{ ing?.dose_mg_optional }}mg
                          </span>
                        </div>
                      </q-item-section>
                    </q-item>
                  </q-list>

                  <!-- Admin Notes -->
                  <div v-if="bag.admin_notes_optional?.length" class="q-mt-sm bg-blue-1 q-pa-sm rounded-borders">
                    <div class="text-caption text-weight-bold text-primary q-mb-xs flex items-center">
                      <q-icon name="info" size="14px" class="q-mr-xs" /> Admin Notes
                    </div>
                    <ul class="q-pl-md q-mt-none q-mb-none text-caption text-grey-9">
                      <li v-for="(note, n) in bag.admin_notes_optional" :key="n">
                        {{ note }}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Expected Outcomes -->
        <q-card v-if="planDetails.outcome_intent_structured" class="shadow-sm rounded-borders border-grey q-mt-md">
          <q-card-section class="q-py-sm bg-grey-1 border-b-grey">
            <div class="flex items-center">
              <q-icon name="auto_graph" size="20px" class="q-mr-sm text-primary" />
              <div class="text-subtitle2 text-weight-bold">Expected Outcomes & Client Experience</div>
            </div>
          </q-card-section>
          <q-card-section class="q-pa-md row q-col-gutter-md">
            <!-- Same Day -->
            <div class="col-12 col-sm-6">
              <div class="text-weight-bold q-mb-xs text-primary">Same Day</div>
              <div v-if="planDetails.outcome_intent_structured.same_day_goals?.length" class="q-mb-sm">
                <div class="text-caption text-weight-bold text-grey-8">Goals</div>
                <ul class="q-pl-md q-mt-none q-mb-none text-body2 text-grey-9">
                  <li v-for="(item, i) in planDetails.outcome_intent_structured.same_day_goals" :key="i">
                    {{ item }}
                  </li>
                </ul>
              </div>
              <div v-if="planDetails.client_facing_explanation?.what_you_may_feel_today?.length">
                <div class="text-caption text-weight-bold text-grey-8">What You May Feel</div>
                <ul class="q-pl-md q-mt-none q-mb-none text-body2 text-grey-9">
                  <li v-for="(item, i) in planDetails.client_facing_explanation.what_you_may_feel_today" :key="i">
                    {{ item }}
                  </li>
                </ul>
              </div>
            </div>
            
            <!-- Days 7-14 -->
            <div class="col-12 col-sm-6">
              <div class="text-weight-bold q-mb-xs text-primary">Days 7-14</div>
              <div v-if="planDetails.outcome_intent_structured.days_7_14_goals?.length" class="q-mb-sm">
                <div class="text-caption text-weight-bold text-grey-8">Goals</div>
                <ul class="q-pl-md q-mt-none q-mb-none text-body2 text-grey-9">
                  <li v-for="(item, i) in planDetails.outcome_intent_structured.days_7_14_goals" :key="i">
                    {{ item }}
                  </li>
                </ul>
              </div>
              <div v-if="planDetails.client_facing_explanation?.what_you_may_see_over_7_14_days?.length">
                <div class="text-caption text-weight-bold text-grey-8">What You May See</div>
                <ul class="q-pl-md q-mt-none q-mb-none text-body2 text-grey-9">
                  <li v-for="(item, i) in planDetails.client_facing_explanation.what_you_may_see_over_7_14_days" :key="i">
                    {{ item }}
                  </li>
                </ul>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { startCase } from 'lodash'
import { api } from 'src/boot/axios'
import { Loading, Notify } from 'quasar'
import { useIVAssessmentStore } from 'src/stores/ivAssessmentStore'
import { storeToRefs } from 'pinia'

const props = defineProps({
  planDetails: {
    type: Object,
    required: true,
  },
})

const store = useIVAssessmentStore()
const { formData } = storeToRefs(store)

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
  if (rate === 'SLOW') return 'orange-9'
  if (rate === 'MODERATE') return 'blue-9'
  return 'green-9'
}

const downloadPDF = async () => {
  Loading.show({ message: 'Generating PDF report...' })
  try {
    const response = await api.get(`download-iv-report/program-roadmap/${formData.value.id}`, {
      responseType: 'blob',
    })

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${formData.value.name}_${props.planDetails.option_type}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('PDF generation failed:', error)

    Notify.create({
      type: 'negative',
      message:
        error?.response?.data?.message ||
        error?.message ||
        'Failed to generate PDF. Please try again.',
    })
  } finally {
    // 🔥 ALWAYS hide loader
    Loading.hide()
  }
}
</script>

<style scoped>
.plan-header-card {
  border-radius: 12px;
  border: 1px solid #e0e0e0;
}

/* Constraint Colors - Compact & Readable */
.bg-warning-light {
  background-color: #fff8e1; /* Very light amber */
}
.bg-warning-subtle {
  background-color: #ffecb3; /* Slightly darker header */
}
.text-warning-dark {
  color: #5d4037; /* Darker brown for text */
}
.text-warning-darker {
  color: #3e2723; /* Even Darker brown for text */
}
.border-warning {
  border: 1px solid #ffca28;
}
.border-b-warning {
  border-bottom: 1px solid #ffca28;
}

.border-b-grey {
  border-bottom: 1px solid #e0e0e0;
}
.border-grey {
  border: 1px solid #e0e0e0;
}

.border-primary {
  border: 1px solid var(--q-primary);
}

.opacity-30 {
  opacity: 0.3;
}
.opacity-100 {
  opacity: 1;
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
