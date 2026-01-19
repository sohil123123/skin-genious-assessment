<template>
  <div class="q-mb-lg">
    <p class="text-weight-medium q-mb-xs">Known kidney disease *</p>
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
          <p class="text-weight-medium text-grey-7 q-mb-xs">Severity *</p>
          <div class="row q-gutter-xs q-mb-sm">
            <q-chip
              v-for="item in kidneySeverityOptions"
              :key="item"
              :label="item"
              :text-color="item === severityValue ? 'white' : 'dark'"
              :color="
                item === severityValue ? (item === 'On dialysis' ? 'negative' : 'blue-9') : 'grey-6'
              "
              :square="item === severityValue"
              outline
              clickable
              @click="updateSeverity(item)"
            />
          </div>
        </div>
        <div class="col-12 col-md-6">
          <p class="text-weight-medium text-grey-7 q-mb-xs">Doctor advised fluid restriction? *</p>
          <div class="row q-gutter-xs">
            <q-chip
              v-for="item in yesNoUnsureOptions"
              :key="item"
              :label="item"
              :text-color="item === restrictionValue ? 'white' : 'dark'"
              :color="
                item === restrictionValue
                  ? item === 'Yes'
                    ? 'negative'
                    : item === 'Unsure'
                      ? 'amber'
                      : 'blue-9'
                  : 'grey-6'
              "
              :square="item === restrictionValue"
              outline
              clickable
              @click="updateRestriction(item)"
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

const yesNoUnsureOptions = ['Yes', 'No', 'Unsure']
const kidneySeverityOptions = ['Mild', 'Moderate', 'Severe', 'On dialysis']

const localValue = computed({
  get() {
    return (
      modelValue.value.section_1_client_questionnaire?.B_safety_contraindications
        ?.known_kidney_disease || ''
    )
  },
  set(value) {
    ensurePathExists()
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.known_kidney_disease =
      value
    emit('update')
  },
})

const severityValue = computed({
  get() {
    return (
      modelValue.value.section_1_client_questionnaire?.B_safety_contraindications
        ?.kidney_disease_severity_if_yes || ''
    )
  },
  set(value) {
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.kidney_disease_severity_if_yes =
      value
    emit('update')
  },
})

const restrictionValue = computed({
  get() {
    return (
      modelValue.value.section_1_client_questionnaire?.B_safety_contraindications
        ?.kidney_fluid_restriction_if_yes || ''
    )
  },
  set(value) {
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.kidney_fluid_restriction_if_yes =
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
    severityValue.value = ''
    restrictionValue.value = ''
  }
}

function updateSeverity(value) {
  severityValue.value = value
}

function updateRestriction(value) {
  restrictionValue.value = value
}
</script>
