<template>
  <div
    class="q-mb-lg option-group"
    :class="{
      'group--error':
        v.section_1_client_questionnaire.B_safety_contraindications.history_severe_allergy.$error ||
        v.section_1_client_questionnaire.B_safety_contraindications.severe_allergy_trigger_if_yes
          .$error ||
        v.section_1_client_questionnaire.B_safety_contraindications
          .severe_allergy_epinephrine_if_yes.$error ||
        v.section_1_client_questionnaire.B_safety_contraindications.severe_allergy_severity_if_yes
          .$error,
    }"
  >
    <p
      class="text-weight-medium q-mb-xs"
      :class="{
        'text-negative':
          v.section_1_client_questionnaire.B_safety_contraindications.history_severe_allergy
            .$error ||
          v.section_1_client_questionnaire.B_safety_contraindications.severe_allergy_trigger_if_yes
            .$error ||
          v.section_1_client_questionnaire.B_safety_contraindications
            .severe_allergy_epinephrine_if_yes.$error ||
          v.section_1_client_questionnaire.B_safety_contraindications.severe_allergy_severity_if_yes
            .$error,
      }"
    >
      History of severe allergy / anaphylaxis *
    </p>
    <div class="row q-gutter-xs q-mb-sm">
      <q-chip
        v-for="item in yesNoUnsureOptions"
        :key="item"
        :label="item"
        :text-color="item === localValue ? 'white' : 'dark'"
        :color="
          item === localValue
            ? item === 'Yes'
              ? 'negative'
              : item === 'Unsure'
                ? 'warning'
                : 'primary'
            : 'grey-3'
        "
        size="md"
        clickable
        @click="updateValue(item)"
      />
    </div>

    <!-- Follow-up: If yes or unsure -->
    <div v-if="showFollowup" class="q-ml-md q-mt-md">
      <div class="row q-col-gutter-md q-mb-sm">
        <div class="col-12 col-md-4">
          <p class="text-weight-medium text-grey-7 q-mb-xs">Trigger type *</p>
          <div class="row q-gutter-xs">
            <q-chip
              v-for="item in allergyTriggerOptions"
              :key="item"
              :label="item"
              :text-color="item === triggerValue ? 'white' : 'dark'"
              :color="item === triggerValue ? 'blue-9' : 'grey-6'"
              :square="item === triggerValue"
              outline
              clickable
              @click="updateTrigger(item)"
            />
          </div>
        </div>
        <div class="col-12 col-md-4">
          <p class="text-weight-medium text-grey-7 q-mb-xs">Carries epinephrine? *</p>
          <div class="row q-gutter-xs">
            <q-chip
              v-for="item in yesNoOptions"
              :key="item"
              :label="item"
              :text-color="item === epinephrineValue ? 'white' : 'dark'"
              :color="item === epinephrineValue ? (item === 'Yes' ? 'amber' : 'blue-9') : 'grey-6'"
              :square="item === epinephrineValue"
              outline
              clickable
              @click="updateEpinephrine(item)"
            />
          </div>
        </div>
        <div class="col-12 col-md-4">
          <p class="text-weight-medium text-grey-7 q-mb-xs">Reaction severity *</p>
          <div class="row q-gutter-xs">
            <q-chip
              v-for="item in severeAllergySeverityOptions"
              :key="item"
              :label="item"
              :text-color="item === severityValue ? 'white' : 'dark'"
              :color="
                item === severityValue
                  ? item === 'Full anaphylaxis'
                    ? 'negative'
                    : item === 'Breathing difficulty'
                      ? 'amber'
                      : 'blue-9'
                  : 'grey-6'
              "
              :square="item === severityValue"
              outline
              clickable
              @click="updateSeverity(item)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  v: {
    type: Object,
    required: true,
  },
})

const modelValue = ref(props.modelValue)

watch(
  () => props.modelValue,
  (newVal) => {
    modelValue.value = newVal
  },
  { deep: true },
)

const emit = defineEmits(['update:modelValue', 'update'])

const yesNoOptions = ['Yes', 'No']
const yesNoUnsureOptions = ['Yes', 'No', 'Unsure']
const allergyTriggerOptions = ['Medication', 'Food', 'Insect sting', 'Unknown']
const severeAllergySeverityOptions = [
  'Mild rash only',
  'Breathing difficulty or swelling',
  'Full anaphylaxis doctor-diagnosed',
]

const localValue = computed({
  get() {
    return (
      props.modelValue.section_1_client_questionnaire?.B_safety_contraindications
        ?.history_severe_allergy || ''
    )
  },
  set(value) {
    ensurePathExists()
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.history_severe_allergy =
      value
    emit('update')
  },
})

const triggerValue = computed({
  get() {
    return (
      props.modelValue.section_1_client_questionnaire?.B_safety_contraindications
        ?.severe_allergy_trigger_if_yes || ''
    )
  },
  set(value) {
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.severe_allergy_trigger_if_yes =
      value
    emit('update')
  },
})

const epinephrineValue = computed({
  get() {
    return (
      props.modelValue.section_1_client_questionnaire?.B_safety_contraindications
        ?.severe_allergy_epinephrine_if_yes || ''
    )
  },
  set(value) {
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.severe_allergy_epinephrine_if_yes =
      value
    emit('update')
  },
})

const severityValue = computed({
  get() {
    return (
      props.modelValue.section_1_client_questionnaire?.B_safety_contraindications
        ?.severe_allergy_severity_if_yes || ''
    )
  },
  set(value) {
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.severe_allergy_severity_if_yes =
      value
    emit('update')
  },
})

const showFollowup = computed(() => ['Yes'].includes(localValue.value))

function ensurePathExists() {
  if (!props.modelValue.section_1_client_questionnaire) {
    modelValue.value.section_1_client_questionnaire = {}
  }
  if (!props.modelValue.section_1_client_questionnaire.B_safety_contraindications) {
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications = {}
  }
}

function updateValue(value) {
  localValue.value = value
  if (!['Yes'].includes(value)) {
    triggerValue.value = ''
    epinephrineValue.value = ''
    severityValue.value = ''
  }
}

function updateTrigger(value) {
  triggerValue.value = value
}

function updateEpinephrine(value) {
  epinephrineValue.value = value
}

function updateSeverity(value) {
  severityValue.value = value
}
</script>
