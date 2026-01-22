<template>
  <div
    class="q-mb-lg option-group"
    :class="{
      'group--error':
        v.section_1_client_questionnaire.B_safety_contraindications.history_seizures_epilepsy
          .$error ||
        v.section_1_client_questionnaire.B_safety_contraindications.seizure_recent_if_yes.$error ||
        v.section_1_client_questionnaire.B_safety_contraindications.seizure_medication_if_yes
          .$error,
    }"
  >
    <p
      class="text-weight-medium q-mb-xs"
      :class="{
        'text-negative':
          v.section_1_client_questionnaire.B_safety_contraindications.history_seizures_epilepsy
            .$error ||
          v.section_1_client_questionnaire.B_safety_contraindications.seizure_recent_if_yes
            .$error ||
          v.section_1_client_questionnaire.B_safety_contraindications.seizure_medication_if_yes
            .$error,
      }"
    >
      History of seizures / epilepsy *
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

    <!-- Follow-up: If yes -->
    <div v-if="showFollowup" class="q-ml-md q-mt-md">
      <div class="row q-col-gutter-md q-mb-sm">
        <div class="col-12 col-md-6">
          <p class="text-weight-medium text-grey-7 q-mb-xs">Any seizure in last 12 months? *</p>
          <div class="row q-gutter-xs">
            <q-chip
              v-for="item in yesNoUnsureOptions"
              :key="item"
              :label="item"
              :text-color="item === recentValue ? 'white' : 'dark'"
              :color="
                item === recentValue
                  ? item === 'Yes'
                    ? 'negative'
                    : item === 'Unsure'
                      ? 'amber'
                      : 'blue-9'
                  : 'grey-6'
              "
              :square="item === recentValue"
              outline
              clickable
              @click="updateRecent(item)"
            />
          </div>
        </div>
        <div class="col-12 col-md-6">
          <p class="text-weight-medium text-grey-7 q-mb-xs">
            Currently on anti-epileptic medication? *
          </p>
          <div class="row q-gutter-xs">
            <q-chip
              v-for="item in yesNoOptions"
              :key="item"
              :label="item"
              :text-color="item === medicationValue ? 'white' : 'dark'"
              :color="
                item === medicationValue ? (item === 'Yes' ? 'blue-9' : 'negative') : 'grey-6'
              "
              :square="item === medicationValue"
              outline
              clickable
              @click="updateMedication(item)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

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

const emit = defineEmits(['update:modelValue', 'update'])

const yesNoOptions = ['Yes', 'No']
const yesNoUnsureOptions = ['Yes', 'No', 'Unsure']

const localValue = computed({
  get() {
    return (
      modelValue.value.section_1_client_questionnaire?.B_safety_contraindications
        ?.history_seizures_epilepsy || ''
    )
  },
  set(value) {
    ensurePathExists()
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.history_seizures_epilepsy =
      value
    emit('update')
  },
})

const recentValue = computed({
  get() {
    return (
      modelValue.value.section_1_client_questionnaire?.B_safety_contraindications
        ?.seizure_recent_if_yes || ''
    )
  },
  set(value) {
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.seizure_recent_if_yes =
      value
    emit('update')
  },
})

const medicationValue = computed({
  get() {
    return (
      modelValue.value.section_1_client_questionnaire?.B_safety_contraindications
        ?.seizure_medication_if_yes || ''
    )
  },
  set(value) {
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.seizure_medication_if_yes =
      value
    emit('update')
  },
})

const showFollowup = computed(() => localValue.value === 'Yes')

function ensurePathExists() {
  if (!modelValue.value.section_1_client_questionnaire) {
    modelValue.value.section_1_client_questionnaire = {}
  }
  if (!modelValue.value.section_1_client_questionnaire.B_safety_contraindications) {
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications = {}
  }
}

function updateValue(value) {
  localValue.value = value
  if (value !== 'Yes') {
    recentValue.value = ''
    medicationValue.value = ''
  }
}

function updateRecent(value) {
  recentValue.value = value
}

function updateMedication(value) {
  medicationValue.value = value
}
</script>
