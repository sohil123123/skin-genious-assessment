<template>
  <div class="q-mb-lg">
    <p class="text-weight-medium q-mb-xs">History of asthma / reactive airway disease *</p>
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
        <div class="col-12 col-md-4">
          <p class="text-weight-medium text-grey-7 q-mb-xs">Current control *</p>
          <div class="row q-gutter-xs">
            <q-chip
              v-for="item in asthmaControlOptions"
              :key="item"
              :label="item"
              :text-color="item === controlValue ? 'white' : 'dark'"
              :color="
                item === controlValue
                  ? item === 'Well controlled'
                    ? 'positive'
                    : item === 'Poorly controlled'
                      ? 'negative'
                      : 'amber'
                  : 'grey-6'
              "
              :square="item === controlValue"
              outline
              clickable
              @click="updateControl(item)"
            />
          </div>
        </div>
        <div class="col-12 col-md-4">
          <p class="text-weight-medium text-grey-7 q-mb-xs">Inhaler use in last 7 days *</p>
          <div class="row q-gutter-xs">
            <q-chip
              v-for="item in asthmaInhalerOptions"
              :key="item"
              :label="item"
              :text-color="item === inhalerValue ? 'white' : 'dark'"
              :color="
                item === inhalerValue
                  ? item === 'None'
                    ? 'positive'
                    : item === '3+ times'
                      ? 'negative'
                      : 'amber'
                  : 'grey-6'
              "
              :square="item === inhalerValue"
              outline
              clickable
              @click="updateInhaler(item)"
            />
          </div>
        </div>
        <div class="col-12 col-md-4">
          <p class="text-weight-medium text-grey-7 q-mb-xs">
            ER visit/hospitalization in last 12 months? *
          </p>
          <div class="row q-gutter-xs">
            <q-chip
              v-for="item in yesNoOptions"
              :key="item"
              :label="item"
              :text-color="item === erValue ? 'white' : 'dark'"
              :color="item === erValue ? (item === 'Yes' ? 'negative' : 'blue-9') : 'grey-6'"
              :square="item === erValue"
              outline
              clickable
              @click="updateEr(item)"
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
})

const modelValue = ref(props.modelValue)

const emit = defineEmits(['update:modelValue', 'update'])

const yesNoOptions = ['Yes', 'No']
const yesNoUnsureOptions = ['Yes', 'No', 'Unsure']
const asthmaControlOptions = ['Well controlled', 'Sometimes symptomatic', 'Poorly controlled']
const asthmaInhalerOptions = ['None', '1–2 times', '3+ times']

const localValue = computed({
  get() {
    return (
      modelValue.value.section_1_client_questionnaire?.B_safety_contraindications?.history_asthma ||
      ''
    )
  },
  set(value) {
    ensurePathExists()
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.history_asthma =
      value
    emit('update')
  },
})

const controlValue = computed({
  get() {
    return (
      modelValue.value.section_1_client_questionnaire?.B_safety_contraindications
        ?.asthma_control_if_yes || ''
    )
  },
  set(value) {
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.asthma_control_if_yes =
      value
    emit('update')
  },
})

const inhalerValue = computed({
  get() {
    return (
      modelValue.value.section_1_client_questionnaire?.B_safety_contraindications
        ?.asthma_inhaler_if_yes || ''
    )
  },
  set(value) {
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.asthma_inhaler_if_yes =
      value
    emit('update')
  },
})

const erValue = computed({
  get() {
    return (
      modelValue.value.section_1_client_questionnaire?.B_safety_contraindications
        ?.asthma_er_if_yes || ''
    )
  },
  set(value) {
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.asthma_er_if_yes =
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
    controlValue.value = ''
    inhalerValue.value = ''
    erValue.value = ''
  }
}

function updateControl(value) {
  controlValue.value = value
}

function updateInhaler(value) {
  inhalerValue.value = value
}

function updateEr(value) {
  erValue.value = value
}
</script>
