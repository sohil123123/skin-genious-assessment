<template>
  <div
    class="q-mb-lg option-group"
    :class="{
      'group--error':
        v.section_1_client_questionnaire.B_safety_contraindications
          .history_uncontrolled_hypertension.$error ||
        v.section_1_client_questionnaire.B_safety_contraindications.hypertension_medication_if_yes
          .$error ||
        v.section_1_client_questionnaire.B_safety_contraindications.hypertension_high_bp_if_yes
          .$error,
    }"
  >
    <p
      class="text-weight-medium q-mb-xs"
      :class="{
        'text-negative':
          v.section_1_client_questionnaire.B_safety_contraindications
            .history_uncontrolled_hypertension.$error ||
          v.section_1_client_questionnaire.B_safety_contraindications.hypertension_medication_if_yes
            .$error ||
          v.section_1_client_questionnaire.B_safety_contraindications.hypertension_high_bp_if_yes
            .$error,
      }"
    >
      History of uncontrolled hypertension *
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
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6">
          <p class="text-weight-medium text-grey-7 q-mb-xs">Currently on BP medication? *</p>
          <div class="row q-gutter-xs q-mb-sm">
            <q-chip
              v-for="item in yesNoOptions"
              :key="item"
              :label="item"
              :text-color="item === medicationValue ? 'white' : 'dark'"
              :color="item === medicationValue ? 'blue-9' : 'grey-6'"
              :square="item === medicationValue"
              outline
              clickable
              @click="updateMedication(item)"
            />
          </div>
        </div>
        <div class="col-12 col-md-6">
          <p class="text-weight-medium text-grey-7 q-mb-xs">Last known BP reading >160/100? *</p>
          <div class="row q-gutter-xs">
            <q-chip
              v-for="item in yesNoUnsureOptions"
              :key="item"
              :label="item"
              :text-color="item === highBpValue ? 'white' : 'dark'"
              :color="
                item === highBpValue
                  ? item === 'Yes'
                    ? 'negative'
                    : item === 'Unsure'
                      ? 'amber'
                      : 'blue-9'
                  : 'grey-6'
              "
              :square="item === highBpValue"
              outline
              clickable
              @click="updateHighBp(item)"
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
        ?.history_uncontrolled_hypertension || ''
    )
  },
  set(value) {
    ensurePathExists()
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.history_uncontrolled_hypertension =
      value
    emit('update')
  },
})

const medicationValue = computed({
  get() {
    return (
      modelValue.value.section_1_client_questionnaire?.B_safety_contraindications
        ?.hypertension_medication_if_yes || ''
    )
  },
  set(value) {
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.hypertension_medication_if_yes =
      value
    emit('update')
  },
})

const highBpValue = computed({
  get() {
    return (
      modelValue.value.section_1_client_questionnaire?.B_safety_contraindications
        ?.hypertension_high_bp_if_yes || ''
    )
  },
  set(value) {
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.hypertension_high_bp_if_yes =
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
    medicationValue.value = ''
    highBpValue.value = ''
  }
}

function updateMedication(value) {
  medicationValue.value = value
}

function updateHighBp(value) {
  highBpValue.value = value
}
</script>
