<template>
  <div
    class="q-mb-lg option-group"
    :class="{
      'group--error':
        v.section_1_client_questionnaire.B_safety_contraindications.known_g6pd_deficiency.$error ||
        v.section_1_client_questionnaire.B_safety_contraindications.g6pd_lab_test_if_yes.$error,
    }"
  >
    <p
      class="text-weight-medium q-mb-xs"
      :class="{
        'text-negative':
          v.section_1_client_questionnaire.B_safety_contraindications.known_g6pd_deficiency
            .$error ||
          v.section_1_client_questionnaire.B_safety_contraindications.g6pd_lab_test_if_yes.$error,
      }"
    >
      Known G6PD deficiency *
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
      <p class="text-weight-medium text-grey-7 q-mb-xs">Confirmed by lab test? *</p>
      <div class="row q-gutter-xs">
        <q-chip
          v-for="item in yesNoUnsureOptions"
          :key="item"
          :label="item"
          :text-color="item === labTestValue ? 'white' : 'dark'"
          :color="
            item === labTestValue
              ? item === 'Yes'
                ? 'primary'
                : item === 'Unsure'
                  ? 'amber'
                  : 'blue-9'
              : 'grey-6'
          "
          :square="item === labTestValue"
          outline
          clickable
          @click="updateLabTest(item)"
        />
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

const localValue = computed({
  get() {
    return (
      modelValue.value.section_1_client_questionnaire?.B_safety_contraindications
        ?.known_g6pd_deficiency || ''
    )
  },
  set(value) {
    ensurePathExists()
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.known_g6pd_deficiency =
      value
    emit('update')
  },
})

const labTestValue = computed({
  get() {
    return (
      modelValue.value.section_1_client_questionnaire?.B_safety_contraindications
        ?.g6pd_lab_test_if_yes || ''
    )
  },
  set(value) {
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.g6pd_lab_test_if_yes =
      value
    emit('update')
  },
})

const showFollowup = computed(() => ['Yes', 'Unsure'].includes(localValue.value))

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
  if (!['Yes', 'Unsure'].includes(value)) {
    labTestValue.value = ''
  }
}

function updateLabTest(value) {
  labTestValue.value = value
}
</script>
