<template>
  <section v-if="items.length" class="q-gutter-md">
    <q-banner rounded class="bg-amber-1 text-grey-9">
      <div class="text-subtitle1 text-weight-medium">Needs doctor classification</div>
      <div class="text-body2">
        Only findings the AI could not classify confidently enough for a safe treatment pathway appear here.
      </div>
    </q-banner>

    <q-card
      v-for="item in items"
      :key="item.classification_id"
      flat
      bordered
      class="q-pa-md"
    >
      <div class="row items-start justify-between q-col-gutter-md">
        <div class="col-12 col-md">
          <div class="text-subtitle1 text-weight-medium">
            {{ item.clinical_location_text }}
          </div>
          <div class="text-body2 q-mt-xs">
            {{ item.unresolved_question }}
          </div>
          <div class="text-caption text-grey-7 q-mt-sm">
            {{ item.why_classification_is_required }}
          </div>
        </div>
        <q-chip
          :color="isResolved(item) ? 'positive' : 'warning'"
          :text-color="isResolved(item) ? 'white' : 'black'"
          dense
        >
          {{ isResolved(item) ? 'Resolved' : 'Pending' }}
        </q-chip>
      </div>

      <template v-if="!isResolved(item)">
        <q-select
          v-model="drafts[item.classification_id].selection"
          :options="optionsFor(item)"
          emit-value
          map-options
          outlined
          dense
          class="q-mt-md"
          label="Doctor classification"
        />

        <q-input
          v-model="drafts[item.classification_id].doctor_note"
          outlined
          dense
          autogrow
          class="q-mt-sm"
          label="Doctor note (optional)"
        />

        <div class="row justify-end q-mt-md">
          <q-btn
            color="primary"
            label="Save classification"
            :disable="!drafts[item.classification_id].selection"
            :loading="savingId === item.classification_id"
            @click="save(item)"
          />
        </div>
      </template>

      <template v-else>
        <q-separator class="q-my-md" />
        <div class="text-body2">
          <span class="text-weight-medium">Doctor decision:</span>
          {{ resolvedLabel(item) }}
        </div>
        <div
          v-if="classificationState(item)?.doctor_note"
          class="text-body2 q-mt-xs"
        >
          <span class="text-weight-medium">Note:</span>
          {{ classificationState(item).doctor_note }}
        </div>
        <div class="row justify-end q-mt-md">
          <q-btn
            flat
            color="primary"
            label="Change classification"
            @click="clear(item)"
          />
        </div>
      </template>
    </q-card>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { usePigmentationStore } from 'src/stores/pigmentationStore'

const store = usePigmentationStore()
const savingId = ref(null)
const drafts = reactive({})

const items = computed(() => store.classificationRequiredItems || [])

function ensureDrafts() {
  for (const item of items.value) {
    if (!drafts[item.classification_id]) {
      drafts[item.classification_id] = {
        selection: null,
        doctor_note: '',
      }
    }
  }
}

watch(items, ensureDrafts, { immediate: true, deep: true })

function classificationState(item) {
  return store.doctorClassifications?.[item.classification_id] || null
}

function isResolved(item) {
  return classificationState(item)?.status === 'resolved'
}

function optionsFor(item) {
  const candidates = (item.candidate_options || []).map((option) => ({
    label: option.label,
    value: `candidate:${option.option_code}`,
  }))

  return [
    ...candidates,
    {
      label: 'Not relevant to the pigmentation treatment plan',
      value: 'standard:not_pigmentation_relevant',
    },
    {
      label: 'Cannot confidently classify — exclude from cosmetic treatment',
      value: 'standard:exclude_from_cosmetic_treatment',
    },
    {
      label: 'Requires separate medical evaluation',
      value: 'standard:separate_medical_evaluation',
    },
  ]
}

function resolvedLabel(item) {
  const state = classificationState(item)
  if (!state) return 'Pending'
  if (state.resolution_type === 'candidate_selected') {
    return (
      (item.candidate_options || []).find(
        (option) => option.option_code === state.option_code,
      )?.label || state.option_code
    )
  }
  const labels = {
    not_pigmentation_relevant: 'Not relevant to the pigmentation treatment plan',
    exclude_from_cosmetic_treatment: 'Excluded from cosmetic treatment',
    separate_medical_evaluation: 'Separate medical evaluation required',
  }
  return labels[state.resolution_type] || state.resolution_type
}

async function save(item) {
  const draft = drafts[item.classification_id]
  if (!draft?.selection) return

  const [kind, value] = draft.selection.split(':')
  const resolution = {
    resolution_type: kind === 'candidate' ? 'candidate_selected' : value,
    option_code: kind === 'candidate' ? value : null,
    doctor_note: draft.doctor_note || '',
  }

  savingId.value = item.classification_id
  try {
    await store.setDoctorClassification(item.classification_id, resolution)
  } finally {
    savingId.value = null
  }
}

async function clear(item) {
  await store.clearDoctorClassification(item.classification_id)
  drafts[item.classification_id] = {
    selection: null,
    doctor_note: '',
  }
}
</script>
