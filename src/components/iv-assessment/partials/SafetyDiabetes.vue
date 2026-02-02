<template>
  <div
    class="q-mb-lg option-group"
    :class="{
      'group--error':
        v.section_1_client_questionnaire.B_safety_contraindications.diabetes.$error ||
        v.section_1_client_questionnaire.B_safety_contraindications.diabetes_type_if_yes.$error ||
        v.section_1_client_questionnaire.B_safety_contraindications.diabetes_hba1c_if_yes.$error,
    }"
  >
    <p
      class="text-weight-medium q-mb-xs"
      :class="{
        'text-negative':
          v.section_1_client_questionnaire.B_safety_contraindications.diabetes.$error ||
          v.section_1_client_questionnaire.B_safety_contraindications.diabetes_type_if_yes.$error ||
          v.section_1_client_questionnaire.B_safety_contraindications.diabetes_hba1c_if_yes.$error,
      }"
    >
      Diabetes *
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
      <div class="row q-col-gutter-md q-mb-sm">
        <div class="col-12 col-md-6">
          <p class="text-weight-medium text-grey-7 q-mb-xs">Type *</p>
          <div class="row q-gutter-xs">
            <q-chip
              v-for="item in diabetesTypeOptions"
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
          <p class="text-weight-medium text-grey-7 q-mb-xs">Most recent HbA1c >8? *</p>
          <div class="row q-gutter-xs">
            <q-chip
              v-for="item in yesNoUnsureOptions"
              :key="item"
              :label="item"
              :text-color="item === hba1cValue ? 'white' : 'dark'"
              :color="
                item === hba1cValue
                  ? item === 'Yes'
                    ? 'negative'
                    : item === 'Unsure'
                      ? 'amber'
                      : 'blue-9'
                  : 'grey-6'
              "
              :square="item === hba1cValue"
              outline
              clickable
              @click="updateHba1c(item)"
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
const diabetesTypeOptions = ['Type 2', 'Type 1', 'Unsure']

const localValue = computed({
  get() {
    return (
      modelValue.value.section_1_client_questionnaire?.B_safety_contraindications?.diabetes || ''
    )
  },
  set(value) {
    ensurePathExists()
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.diabetes = value
    emit('update')
  },
})

const typeValue = computed({
  get() {
    return (
      modelValue.value.section_1_client_questionnaire?.B_safety_contraindications
        ?.diabetes_type_if_yes || ''
    )
  },
  set(value) {
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.diabetes_type_if_yes =
      value
    emit('update')
  },
})

const hba1cValue = computed({
  get() {
    return (
      modelValue.value.section_1_client_questionnaire?.B_safety_contraindications
        ?.diabetes_hba1c_if_yes || ''
    )
  },
  set(value) {
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.diabetes_hba1c_if_yes =
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
    typeValue.value = ''
    hba1cValue.value = ''
  }
}

function updateType(value) {
  typeValue.value = value
}

function updateHba1c(value) {
  hba1cValue.value = value
}
</script>
