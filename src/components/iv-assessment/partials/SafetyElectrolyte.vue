<template>
  <div
    class="q-mb-lg option-group"
    :class="{
      'group--error':
        v.section_1_client_questionnaire.B_safety_contraindications.known_electrolyte_disorder
          .$error ||
        v.section_1_client_questionnaire.B_safety_contraindications.electrolyte_type_if_yes
          .$error ||
        v.section_1_client_questionnaire.B_safety_contraindications.electrolyte_medication_if_yes
          .$error,
    }"
  >
    <p
      class="text-weight-medium q-mb-xs"
      :class="{
        'text-negative':
          v.section_1_client_questionnaire.B_safety_contraindications.known_electrolyte_disorder
            .$error ||
          v.section_1_client_questionnaire.B_safety_contraindications.electrolyte_type_if_yes
            .$error ||
          v.section_1_client_questionnaire.B_safety_contraindications.electrolyte_medication_if_yes
            .$error,
      }"
    >
      Known electrolyte disorder diagnosed by a doctor *
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
        <div class="col-12 col-md-6">
          <p class="text-weight-medium text-grey-7 q-mb-xs">Which electrolyte? *</p>
          <div class="row q-gutter-xs">
            <q-chip
              v-for="item in electrolyteTypeOptions"
              :key="item"
              :label="item"
              :text-color="item === typeValue ? 'white' : 'dark'"
              :color="item === typeValue ? 'blue-9' : 'grey-6'"
              :square="item === typeValue"
              outline
              clickable
              @click="updateType(item)"
            />
          </div>
        </div>
        <div class="col-12 col-md-6">
          <p class="text-weight-medium text-grey-7 q-mb-xs">
            On electrolyte medication/supplements? *
          </p>
          <div class="row q-gutter-xs">
            <q-chip
              v-for="item in yesNoUnsureOptions"
              :key="item"
              :label="item"
              :text-color="item === medicationValue ? 'white' : 'dark'"
              :color="
                item === medicationValue
                  ? item === 'Yes'
                    ? 'negative'
                    : item === 'Unsure'
                      ? 'amber'
                      : 'blue-9'
                  : 'grey-6'
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

const yesNoUnsureOptions = ['Yes', 'No', 'Unsure']
const electrolyteTypeOptions = [
  'Low potassium',
  'High potassium',
  'Low magnesium',
  'Low sodium',
  'Other',
  'Unsure',
]
const localValue = computed({
  get() {
    return (
      props.modelValue.section_1_client_questionnaire?.B_safety_contraindications
        ?.known_electrolyte_disorder || ''
    )
  },
  set(value) {
    ensurePathExists()
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.known_electrolyte_disorder =
      value
    emit('update')
  },
})

const typeValue = computed({
  get() {
    return (
      props.modelValue.section_1_client_questionnaire?.B_safety_contraindications
        ?.electrolyte_type_if_yes || ''
    )
  },
  set(value) {
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.electrolyte_type_if_yes =
      value
    emit('update')
  },
})

const medicationValue = computed({
  get() {
    return (
      props.modelValue.section_1_client_questionnaire?.B_safety_contraindications
        ?.electrolyte_medication_if_yes || ''
    )
  },
  set(value) {
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.electrolyte_medication_if_yes =
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
    typeValue.value = ''
    medicationValue.value = ''
  }
}

function updateType(value) {
  typeValue.value = value
}

function updateMedication(value) {
  medicationValue.value = value
}
</script>
