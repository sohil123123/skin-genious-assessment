<template>
  <div
    class="q-mb-lg option-group"
    :class="{
      'group--error':
        v.section_1_client_questionnaire.B_safety_contraindications.pregnant_or_breastfeeding
          .$error ||
        v.section_1_client_questionnaire.B_safety_contraindications.pregnant_type_if_yes.$error ||
        v.section_1_client_questionnaire.B_safety_contraindications.trimester_if_pregnant.$error,
    }"
  >
    <p
      class="text-weight-medium q-mb-xs"
      :class="{
        'text-negative':
          v.section_1_client_questionnaire.B_safety_contraindications.pregnant_or_breastfeeding
            .$error ||
          v.section_1_client_questionnaire.B_safety_contraindications.pregnant_type_if_yes.$error ||
          v.section_1_client_questionnaire.B_safety_contraindications.trimester_if_pregnant.$error,
      }"
    >
      Pregnant or breastfeeding *
    </p>
    <div class="row q-gutter-xs q-mb-sm">
      <q-chip
        v-for="item in yesNoOptions"
        :key="item"
        :label="item"
        :text-color="item === localValue ? 'white' : 'dark'"
        :color="item === localValue ? (item === 'Yes' ? 'negative' : 'primary') : 'grey-3'"
        size="md"
        clickable
        @click="updateValue(item)"
      />
    </div>

    <!-- Follow-up: If yes -->
    <div v-if="showFollowup" class="q-ml-md q-mt-md">
      <p class="text-weight-medium text-grey-7 q-mb-xs">If yes: *</p>
      <div class="row q-gutter-xs q-mb-sm">
        <q-chip
          v-for="item in pregnantTypeOptions"
          :key="item"
          :label="item"
          :text-color="item === pregnantTypeValue ? 'white' : 'dark'"
          :color="item === pregnantTypeValue ? 'blue-9' : 'grey-6'"
          :square="item === pregnantTypeValue"
          outline
          clickable
          @click="updatePregnantType(item)"
        />
      </div>

      <!-- Follow-up: If pregnant -->
      <div v-if="showTrimester" class="q-ml-md q-mt-sm">
        <p class="text-weight-medium text-grey-7 q-mb-xs">If pregnant: Trimester *</p>
        <div class="row q-gutter-xs">
          <q-chip
            v-for="item in trimesterOptions"
            :key="item"
            :label="item"
            :text-color="item === trimesterValue ? 'white' : 'dark'"
            :color="item === trimesterValue ? 'blue-9' : 'grey-6'"
            :square="item === trimesterValue"
            outline
            clickable
            @click="updateTrimester(item)"
          />
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
const pregnantTypeOptions = ['Pregnant', 'Breastfeeding']
const trimesterOptions = ['Trimester 1', 'Trimester 2', 'Trimester 3', 'Unsure']

const localValue = computed({
  get() {
    return (
      modelValue.value.section_1_client_questionnaire?.B_safety_contraindications
        ?.pregnant_or_breastfeeding || ''
    )
  },
  set(value) {
    ensurePathExists()
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.pregnant_or_breastfeeding =
      value
    emit('update')
  },
})

const pregnantTypeValue = computed({
  get() {
    return (
      modelValue.value.section_1_client_questionnaire?.B_safety_contraindications
        ?.pregnant_type_if_yes || ''
    )
  },
  set(value) {
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.pregnant_type_if_yes =
      value
    emit('update')
  },
})

const trimesterValue = computed({
  get() {
    return (
      modelValue.value.section_1_client_questionnaire?.B_safety_contraindications
        ?.trimester_if_pregnant || ''
    )
  },
  set(value) {
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.trimester_if_pregnant =
      value
    emit('update')
  },
})

const showFollowup = computed(() => localValue.value === 'Yes')
const showTrimester = computed(() => pregnantTypeValue.value === 'Pregnant')

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
    pregnantTypeValue.value = ''
    trimesterValue.value = ''
  }
}

function updatePregnantType(value) {
  pregnantTypeValue.value = value
  if (value !== 'Pregnant') {
    trimesterValue.value = ''
  }
}

function updateTrimester(value) {
  trimesterValue.value = value
}
</script>
