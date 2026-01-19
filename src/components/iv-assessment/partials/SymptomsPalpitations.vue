<template>
  <div class="q-mb-lg">
    <p class="text-weight-medium q-mb-xs">Palpitations *</p>
    <div class="row q-gutter-xs q-mb-sm">
      <q-chip
        v-for="item in yesNoOptions"
        :key="item"
        :label="item"
        :text-color="item === localValue ? 'white' : 'dark'"
        :color="item === localValue ? (item === 'Yes' ? 'warning' : 'positive') : 'grey-3'"
        size="md"
        clickable
        @click="updateValue(item)"
      />
    </div>

    <!-- Follow-up: If yes -->
    <div v-if="showFollowup" class="q-ml-md q-mt-md bg-yellow-1 q-pa-sm rounded-borders">
      <div class="row q-col-gutter-md q-mb-sm">
        <div class="col-12 col-md-6">
          <p class="text-weight-medium text-grey-7 q-mb-xs">
            Chest pain or shortness of breath right now? *
          </p>
          <div class="row q-gutter-xs">
            <q-chip
              v-for="item in yesNoOptions"
              :key="item"
              :label="item"
              :text-color="item === chestPainValue ? 'white' : 'dark'"
              :color="
                item === chestPainValue ? (item === 'Yes' ? 'negative' : 'positive') : 'grey-6'
              "
              :square="item === chestPainValue"
              outline
              clickable
              @click="updateChestPain(item)"
            />
          </div>
        </div>
        <div class="col-12 col-md-6">
          <p class="text-weight-medium text-grey-7 q-mb-xs">Frequency *</p>
          <div class="row q-gutter-xs">
            <q-chip
              v-for="item in frequencyOptions"
              :key="item"
              :label="item"
              :text-color="item === frequencyValue ? 'white' : 'dark'"
              :color="
                item === frequencyValue
                  ? item === 'Happening now'
                    ? 'negative'
                    : 'blue-9'
                  : 'grey-6'
              "
              :square="item === frequencyValue"
              outline
              clickable
              @click="updateFrequency(item)"
            />
          </div>
        </div>
      </div>
      <div v-if="showAlert" class="text-caption text-negative q-mt-xs">
        <q-icon name="warning" size="xs" /> If chest pain or shortness of breath present, please
        inform staff immediately
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
const frequencyOptions = ['Occasional only', 'Happening now']

const localValue = computed({
  get() {
    return modelValue.value.section_1_client_questionnaire?.D_symptoms_today?.palpitations || ''
  },
  set(value) {
    ensurePathExists()
    modelValue.value.section_1_client_questionnaire.D_symptoms_today.palpitations = value
    emit('update')
  },
})

const chestPainValue = computed({
  get() {
    return (
      modelValue.value.section_1_client_questionnaire?.D_symptoms_today
        ?.palpitations_chest_pain_if_yes || ''
    )
  },
  set(value) {
    modelValue.value.section_1_client_questionnaire.D_symptoms_today.palpitations_chest_pain_if_yes =
      value
    emit('update')
  },
})

const frequencyValue = computed({
  get() {
    return (
      modelValue.value.section_1_client_questionnaire?.D_symptoms_today
        ?.palpitations_frequency_if_yes || ''
    )
  },
  set(value) {
    modelValue.value.section_1_client_questionnaire.D_symptoms_today.palpitations_frequency_if_yes =
      value
    emit('update')
  },
})

const showFollowup = computed(() => localValue.value === 'Yes')
const showAlert = computed(() => chestPainValue.value === 'Yes')

function ensurePathExists() {
  if (!modelValue.value.section_1_client_questionnaire) {
    modelValue.value.section_1_client_questionnaire = {}
  }
  if (!modelValue.value.section_1_client_questionnaire.D_symptoms_today) {
    modelValue.value.section_1_client_questionnaire.D_symptoms_today = {}
  }
}

function updateValue(value) {
  localValue.value = value
  if (value !== 'Yes') {
    chestPainValue.value = ''
    frequencyValue.value = ''
  }
}

function updateChestPain(value) {
  chestPainValue.value = value
}

function updateFrequency(value) {
  frequencyValue.value = value
}
</script>
