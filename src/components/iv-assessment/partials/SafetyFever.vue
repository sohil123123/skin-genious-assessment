<template>
  <div class="q-mb-lg">
    <p class="text-weight-medium q-mb-xs">Current fever or infection symptoms today *</p>
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
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6">
          <p class="text-weight-medium text-grey-7 q-mb-xs">Fever ≥37.8°C today? *</p>
          <div class="row q-gutter-xs">
            <q-chip
              v-for="item in yesNoUnsureOptions"
              :key="item"
              :label="item"
              :text-color="item === temperatureValue ? 'white' : 'dark'"
              :color="
                item === temperatureValue
                  ? item === 'Yes'
                    ? 'negative'
                    : item === 'Unsure'
                      ? 'amber'
                      : 'blue-9'
                  : 'grey-6'
              "
              :square="item === temperatureValue"
              outline
              clickable
              @click="updateTemperature(item)"
            />
          </div>
        </div>
        <div class="col-12 col-md-6">
          <p class="text-weight-medium text-grey-7 q-mb-xs">Currently on antibiotics? *</p>
          <div class="row q-gutter-xs">
            <q-chip
              v-for="item in yesNoOptions"
              :key="item"
              :label="item"
              :text-color="item === antibioticsValue ? 'white' : 'dark'"
              :color="
                item === antibioticsValue ? (item === 'Yes' ? 'blue-9' : 'negative') : 'grey-6'
              "
              :square="item === antibioticsValue"
              outline
              clickable
              @click="updateAntibiotics(item)"
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

const localValue = computed({
  get() {
    return (
      props.modelValue.section_1_client_questionnaire?.B_safety_contraindications
        ?.current_fever_or_infection_symptoms_today || ''
    )
  },
  set(value) {
    ensurePathExists()
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.current_fever_or_infection_symptoms_today =
      value
    emit('update')
  },
})

const temperatureValue = computed({
  get() {
    return (
      props.modelValue.section_1_client_questionnaire?.B_safety_contraindications
        ?.fever_temperature_if_yes || ''
    )
  },
  set(value) {
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.fever_temperature_if_yes =
      value
    emit('update')
  },
})

const antibioticsValue = computed({
  get() {
    return (
      props.modelValue.section_1_client_questionnaire?.B_safety_contraindications
        ?.fever_antibiotics_if_yes || ''
    )
  },
  set(value) {
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.fever_antibiotics_if_yes =
      value
    emit('update')
  },
})

const showFollowup = computed(() => localValue.value === 'Yes')

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
  if (value !== 'Yes') {
    temperatureValue.value = ''
    antibioticsValue.value = ''
  }
}

function updateTemperature(value) {
  temperatureValue.value = value
}

function updateAntibiotics(value) {
  antibioticsValue.value = value
}
</script>
