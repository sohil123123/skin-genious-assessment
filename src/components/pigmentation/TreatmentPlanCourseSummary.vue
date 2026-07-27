<template>
  <section v-if="plan && summary" class="q-gutter-md">
    <q-card flat bordered class="q-pa-md">
      <div class="row items-start justify-between q-col-gutter-md">
        <div class="col-12 col-md">
          <div class="text-overline text-primary">Recommended full course</div>
          <div class="text-h6 text-weight-bold">
            {{ totalSessions }} planned sessions
          </div>
          <div v-if="summary.course_duration || plan.duration" class="text-body2 text-grey-7 q-mt-xs">
            {{ summary.course_duration || plan.duration }}
          </div>
        </div>

        <div v-if="firstReassessment" class="col-12 col-md-auto">
          <q-chip color="primary" text-color="white" icon="fact_check">
            Reassess after Session {{ firstReassessment }}
          </q-chip>
        </div>
      </div>

      <q-separator class="q-my-md" />

      <div class="text-subtitle2 text-weight-medium q-mb-sm">Package treatment summary</div>
      <div v-if="packageModalities.length" class="row q-col-gutter-sm">
        <div
          v-for="allocation in packageModalities"
          :key="allocation.modality_id"
          class="col-12 col-sm-6 col-md-4"
        >
          <q-card flat bordered class="q-pa-sm full-height">
            <div class="row items-center justify-between no-wrap">
              <div class="text-body1 text-weight-medium ellipsis">
                {{ modalityLabel(allocation.modality_id) }}
              </div>
              <q-badge color="primary" rounded class="q-ml-sm">
                ×{{ allocation.planned_visits }}
              </q-badge>
            </div>
            <div v-if="allocation.session_numbers?.length" class="text-caption q-mt-xs">
              Sessions {{ allocation.session_numbers.join(', ') }}
            </div>
            <div v-if="allocation.protocol_ids?.length" class="text-caption text-grey-7 q-mt-xs">
              {{ allocation.protocol_ids.join(' · ') }}
            </div>
          </q-card>
        </div>
      </div>
      <q-banner v-else rounded class="bg-grey-2 text-grey-8">
        No primary procedural allocation is currently planned.
      </q-banner>

      <template v-if="supportiveInclusions.length">
        <div class="text-subtitle2 text-weight-medium q-mt-lg q-mb-sm">Supportive inclusions</div>
        <div class="row q-gutter-sm">
          <q-chip
            v-for="supportive in supportiveInclusions"
            :key="`${supportive.protocol_id}-${supportive.modality_id}`"
            outline
            color="secondary"
          >
            {{ allocationLabel(supportive) }} ×{{ supportive.planned_uses }}
            <span v-if="supportive.standalone_visit !== true" class="q-ml-xs">(within sessions)</span>
          </q-chip>
        </div>
      </template>

      <q-expansion-item
        v-if="protocolAllocations.length"
        dense
        class="q-mt-md"
        label="Protocol-level allocation"
        caption="Used for clinical reconciliation; package counts above are unique visits by modality."
      >
        <q-list dense bordered separator class="rounded-borders q-mt-sm">
          <q-item
            v-for="allocation in protocolAllocations"
            :key="`${allocation.protocol_id}-${allocation.modality_id}`"
          >
            <q-item-section>
              <q-item-label>{{ allocationLabel(allocation) }}</q-item-label>
              <q-item-label caption>{{ allocation.protocol_id }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-badge color="primary" outline>×{{ allocation.planned_uses }}</q-badge>
            </q-item-section>
          </q-item>
        </q-list>
      </q-expansion-item>

      <template v-if="packageSummaryText">
        <q-separator class="q-my-md" />
        <div class="text-body2">
          {{ packageSummaryText }}
        </div>
      </template>
    </q-card>

    <q-card v-if="roadmapBlocks.length" flat bordered>
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium">Course roadmap</div>
        <div class="text-caption text-grey-7">
          Only the current block is fully executable. Later blocks remain provisional until reassessment.
        </div>
      </q-card-section>

      <q-separator />

      <q-list separator>
        <q-expansion-item
          v-for="block in roadmapBlocks"
          :key="block.block_number"
          :default-opened="block.detail_status === 'detailed_current_block'"
          expand-separator
        >
          <template #header>
            <q-item-section avatar>
              <q-avatar
                :color="block.detail_status === 'detailed_current_block' ? 'primary' : 'grey-4'"
                :text-color="block.detail_status === 'detailed_current_block' ? 'white' : 'grey-9'"
              >
                {{ block.block_number }}
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>
                Sessions {{ (block.session_numbers || []).join(', ') }}
              </q-item-label>
              <q-item-label caption>{{ block.purpose }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-chip dense :color="block.detail_status === 'detailed_current_block' ? 'primary' : 'grey-3'">
                {{ detailStatusLabel(block.detail_status) }}
              </q-chip>
            </q-item-section>
          </template>

          <q-card-section class="q-pt-none">
            <div
              v-for="use in block.planned_protocol_uses || []"
              :key="`${block.block_number}-${use.protocol_id}`"
              class="row items-center justify-between q-py-xs"
            >
              <div>
                <div class="text-body2 text-weight-medium">{{ allocationLabel(use) }}</div>
                <div class="text-caption text-grey-7">{{ use.protocol_id }}</div>
              </div>
              <q-badge color="primary" outline>×{{ use.planned_uses }}</q-badge>
            </div>
          </q-card-section>
        </q-expansion-item>
      </q-list>
    </q-card>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  plan: {
    type: Object,
    default: null,
  },
  protocolLabels: {
    type: Object,
    default: () => ({}),
  },
})

const summary = computed(() => props.plan?.full_course_summary || null)
const totalSessions = computed(
  () =>
    Number(summary.value?.total_planned_sessions) ||
    Number(props.plan?.course?.expected_total_sessions) ||
    0,
)
const firstReassessment = computed(
  () =>
    Number(summary.value?.first_reassessment_after_session) ||
    Number(props.plan?.course?.next_formal_reassessment_after_session) ||
    null,
)
const protocolAllocations = computed(() => [
  ...(summary.value?.planned_modality_allocation || []),
  ...(summary.value?.separately_planned_focal_procedures || []),
])
const supportiveInclusions = computed(() => summary.value?.supportive_inclusions || [])
const roadmapBlocks = computed(() => props.plan?.master_treatment_roadmap?.blocks || [])

const packageModalities = computed(() => {
  if (Array.isArray(props.plan?.package_modality_summary) && props.plan.package_modality_summary.length) {
    return props.plan.package_modality_summary
  }

  const grouped = new Map()
  for (const allocation of protocolAllocations.value) {
    if (!allocation?.modality_id) continue
    const existing = grouped.get(allocation.modality_id) || {
      modality_id: allocation.modality_id,
      session_numbers: new Set(),
      protocol_ids: new Set(),
    }
    for (const number of allocation.session_numbers || []) {
      const parsed = Number(number)
      if (Number.isInteger(parsed) && parsed > 0) existing.session_numbers.add(parsed)
    }
    if (allocation.protocol_id) existing.protocol_ids.add(allocation.protocol_id)
    grouped.set(allocation.modality_id, existing)
  }

  return [...grouped.values()].map((entry) => {
    const sessionNumbers = [...entry.session_numbers].sort((a, b) => a - b)
    return {
      modality_id: entry.modality_id,
      planned_visits: sessionNumbers.length,
      session_numbers: sessionNumbers,
      protocol_ids: [...entry.protocol_ids],
    }
  })
})

const packageSummaryText = computed(
  () =>
    props.plan?.derived_package_summary_text ||
    summary.value?.package_summary_text ||
    packageModalities.value
      .map((entry) => `${modalityLabel(entry.modality_id)} ×${entry.planned_visits}`)
      .join(' + '),
)

function titleCase(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function modalityLabel(modalityId) {
  const labels = {
    q_switch_laser: 'Q-switch',
    focal_laser: 'Focal laser',
    microneedling_with_active: 'Microneedling with active',
    chemical_peel: 'Chemical peel',
    electrocautery_or_rf: 'Electrocautery / RF',
  }
  return labels[modalityId] || titleCase(modalityId)
}

function allocationLabel(allocation) {
  return (
    props.protocolLabels?.[allocation.protocol_id] ||
    allocation.display_name ||
    modalityLabel(allocation.modality_id)
  )
}

function detailStatusLabel(status) {
  const labels = {
    detailed_current_block: 'Detailed now',
    provisional_after_reassessment: 'Provisional',
    provisional: 'Provisional',
  }
  return labels[status] || titleCase(status)
}
</script>
