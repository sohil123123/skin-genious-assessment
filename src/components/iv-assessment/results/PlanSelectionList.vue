<template>
  <div class="plan-selection-list">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h6 text-grey-9">Select a Treatment Plan</div>
      <q-btn
        flat
        dense
        label="Download Report"
        color="black"
        icon="download"
        @click="downloadReport"
      >
        <q-tooltip>Download All Options Report</q-tooltip>
      </q-btn>
    </div>
    <div class="row q-col-gutter-md">
      <div v-for="(option, idx) in options" :key="idx" class="col-12 col-md-6">
        <q-card
          class="option-card cursor-pointer h-full transition-all relative-position column"
          :class="{
            'selected-card': selectedOption === option,
            'hover:shadow-lg': true,
          }"
          @click="$emit('select', option)"
          flat
          bordered
        >
          <!-- Selection Ring -->
          <div
            v-if="selectedOption === option"
            class="absolute-top-right q-ma-sm text-primary z-10"
          >
            <q-icon name="check_circle" size="24px" />
          </div>

          <!-- Header -->
          <q-card-section class="q-pb-xs">
            <div class="row items-center justify-between no-wrap">
              <div
                class="text-subtitle2 text-uppercase text-primary letter-spacing-1 font-medium opacity-80"
              >
                {{ formatOptionType(option.option_type) }}
              </div>
              <q-badge
                v-if="option.ui_constraint_flags?.doctor_approval_required"
                color="red-1"
                text-color="negative"
                label="Dr. Approval"
                class="font-bold border-red"
              />
            </div>
            <div class="text-h6 text-grey-9 q-mt-xs leading-tight font-bold">
              {{ getDisplayTitle(option) }}
            </div>
          </q-card-section>

          <!-- UI Summary -->
          <q-card-section v-if="option.protocols?.[0]?.ui_summary" class="q-py-sm col-grow">
            <div class="row q-col-gutter-x-md q-col-gutter-y-xs text-caption text-grey-7 q-mb-md">
              <div class="col-auto flex items-center">
                <q-icon name="schedule" size="16px" class="q-mr-xs text-grey-6" />
                <span class="font-medium"
                  >{{ option.protocols[0].ui_summary.estimated_total_duration_minutes }} min</span
                >
              </div>
              <div class="col-auto flex items-center">
                <q-icon name="local_pharmacy" size="16px" class="q-mr-xs text-grey-6" />
                <span class="font-medium"
                  >{{ option.protocols[0].ui_summary.total_bags }} Bag(s)</span
                >
              </div>
              <div
                class="col-auto flex items-center"
                v-if="option.protocols[0].ui_summary.contains_nad"
              >
                <q-icon name="bolt" size="16px" class="q-mr-xs text-amber-9" />
                <span class="text-amber-9 text-weight-bold">Contains NAD+</span>
              </div>
            </div>

            <div class="q-mt-md">
              <div class="text-caption text-grey-7 q-mb-xs font-medium">Hero Ingredients</div>
              <div class="flex q-gutter-xs">
                <q-badge
                  v-for="hero in option.protocols[0].hero_ingredients"
                  :key="hero"
                  color="teal-1"
                  text-color="teal-9"
                  class="q-px-sm q-py-xs font-medium"
                >
                  {{ hero }}
                </q-badge>
              </div>
            </div>

            <div class="q-mt-md">
              <div class="text-caption text-grey-7 q-mb-xs font-medium">Key Benefits</div>
              <div class="flex q-gutter-xs">
                <q-chip
                  v-for="tag in option.protocols[0].intended_benefits_tags"
                  :key="tag"
                  dense
                  size="sm"
                  color="blue-1"
                  text-color="blue-9"
                  class="q-px-sm font-medium"
                >
                  {{ tag }}
                </q-chip>
              </div>
            </div>
          </q-card-section>

          <!-- UI Summary Plan Option -->
          <q-card-section v-else-if="option.option_type === 'plan_option' && option.protocols?.[0]?.sessions" class="q-py-sm col-grow">
            <div class="row q-col-gutter-x-md q-col-gutter-y-xs text-caption text-grey-7 q-mb-md">
              <div class="col-auto flex items-center">
                <q-icon name="calendar_month" size="16px" class="q-mr-xs text-grey-6" />
                <span class="font-medium">{{ option.protocols[0].plan_duration_weeks }} Weeks</span>
              </div>
              <div class="col-auto flex items-center">
                <q-icon name="event_repeat" size="16px" class="q-mr-xs text-grey-6" />
                <span class="font-medium">{{ option.protocols[0].sessions.length }} Sessions</span>
              </div>
            </div>

            <div class="q-mt-sm">
              <div class="text-caption text-grey-7 q-mb-xs font-medium">Schedule Overview</div>
              <div class="text-body2 text-grey-9 leading-snug">
                {{ option.protocols[0].schedule_description }}
              </div>
            </div>

            <div class="q-mt-md" v-if="getPlanPhases(option).length">
              <div class="text-caption text-grey-7 q-mb-xs font-medium">Plan Phases</div>
              <div class="flex q-gutter-xs">
                <q-chip
                  v-for="phase in getPlanPhases(option)"
                  :key="phase"
                  dense
                  size="sm"
                  color="teal-1"
                  text-color="teal-9"
                  class="q-px-sm font-medium"
                >
                  {{ phase }}
                </q-chip>
              </div>
            </div>
          </q-card-section>

          <!-- Constraint Status Footer -->
          <q-card-section
            class="q-py-sm text-caption"
            :class="getConstraintSectionClass(option.constraint_report?.status)"
            v-if="option.constraint_report"
          >
            <div class="row items-center q-gutter-x-sm q-mb-xs">
              <q-icon
                :name="getConstraintIcon(option.constraint_report.status)"
                size="18px"
                :class="getConstraintIconClass(option.constraint_report.status)"
              />
              <span class="text-weight-bold text-uppercase" style="font-size: 0.75rem">
                {{ formatConstraintStatus(option.constraint_report.status) }}
              </span>
            </div>
            <div
              v-if="option.client_facing_explanation?.why_today"
              class="opacity-90 ellipsis-3-lines leading-snug"
            >
              "{{ option.client_facing_explanation.why_today }}"
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { startCase } from 'lodash'
import { api } from 'src/boot/axios'
import { Loading, Notify } from 'quasar'
import { useIVAssessmentStore } from 'src/stores/ivAssessmentStore'
import { storeToRefs } from 'pinia'

defineProps({
  options: {
    type: Array,
    required: true,
    default: () => [],
  },
  selectedOption: {
    type: Object,
    default: null,
  },
})

const store = useIVAssessmentStore()
const { formData } = storeToRefs(store)

defineEmits(['select'])

const downloadReport = async () => {
  Loading.show({ message: 'Generating PDF report...' })
  try {
    const response = await api.get(`download-iv-report/plans/${formData.value.id}`, {
      responseType: 'blob',
    })

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${formData.value.name}_IV_Treatment_Plan_Report.pdf`)
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

const formatOptionType = (type) => {
  if (!type) return ''
  return startCase(type.replace(/_/g, ' '))
}

const getPlanPhases = (option) => {
  if (option.option_type === 'plan_option' && option.protocols?.[0]?.sessions) {
    const phases = option.protocols[0].sessions.map(s => s.phase_id)
    return [...new Set(phases)].map(p => startCase(p.replace(/_/g, ' ')))
  }
  return []
}

const getDisplayTitle = (option) => {
  if (option.protocols?.[0]?.label_short) {
    return option.protocols[0].label_short
  }
  return option.name
}

const formatConstraintStatus = (status) => {
  if (!status) return ''
  return startCase(status.replace(/_/g, ' '))
}

const getConstraintIcon = (status) => {
  if (status === 'allowed') return 'check_circle'
  if (status === 'allowed_with_cautions') return 'warning'
  return 'error'
}

const getConstraintIconClass = (status) => {
  // Icons are colored slightly darker than the text for visibility
  if (status === 'allowed') return 'text-green-8'
  if (status === 'allowed_with_cautions') return 'text-orange-9'
  return 'text-red-9'
}

const getConstraintSectionClass = (status) => {
  // Return background, text color, and border classes
  if (status === 'allowed') return 'bg-green-1 text-green-10 border-t-green'
  if (status === 'allowed_with_cautions') return 'bg-orange-1 text-brown-10 border-t-orange'
  return 'bg-red-1 text-red-10 border-t-red'
}
</script>

<style scoped>
.option-card {
  transition: all 0.2s ease;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
}
.option-card:hover {
  border-color: #bdbdbd;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); /* Smoother shadow */
  transform: translateY(-2px);
}
.selected-card {
  border-color: var(--q-primary) !important;
  background-color: #f5f9ff; /* Very subtle blue tint */
  box-shadow: 0 0 0 1px var(--q-primary); /* Double border effect */
}

/* Font helpers */
.font-medium {
  font-weight: 500;
}
.font-bold {
  font-weight: 700;
}

.leading-tight {
  line-height: 1.25;
}
.leading-snug {
  line-height: 1.4;
}

.letter-spacing-1 {
  letter-spacing: 0.05em;
}

.opacity-80 {
  opacity: 0.8;
}
.opacity-90 {
  opacity: 0.9;
}

.border-t-green {
  border-top: 1px solid #c8e6c9;
}
.border-t-orange {
  border-top: 1px solid #ffe0b2;
}
.border-t-red {
  border-top: 1px solid #ffcdd2;
}
.border-red {
  border: 1px solid #ef9a9a;
}
.z-10 {
  z-index: 10;
}
</style>
