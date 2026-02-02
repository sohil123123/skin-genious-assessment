<template>
  <div
    class="q-mb-lg option-group"
    :class="{
      'group--error':
        v.section_1_client_questionnaire.B_safety_contraindications
          .previous_adverse_reaction_to_iv_therapy.$error ||
        v.section_1_client_questionnaire.B_safety_contraindications.reaction_type_if_yes.$error ||
        v.section_1_client_questionnaire.B_safety_contraindications.reaction_severity_if_yes
          .$error ||
        v.section_1_client_questionnaire.B_safety_contraindications.reaction_specify_if_yes.$error,
    }"
  >
    <p
      class="text-weight-medium q-mb-xs"
      :class="{
        'text-negative':
          v.section_1_client_questionnaire.B_safety_contraindications
            .previous_adverse_reaction_to_iv_therapy.$error ||
          v.section_1_client_questionnaire.B_safety_contraindications.reaction_type_if_yes.$error ||
          v.section_1_client_questionnaire.B_safety_contraindications.reaction_severity_if_yes
            .$error ||
          v.section_1_client_questionnaire.B_safety_contraindications.reaction_specify_if_yes
            .$error,
      }"
    >
      Previous adverse reaction to IV therapy *
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
      <div class="row q-col-gutter-sm q-mb-sm">
        <div class="col-12 col-md-6">
          <p class="text-weight-medium text-grey-7 q-mb-xs">What happened? *</p>
          <MultiSelectChips
            v-model="reactionTypeValue"
            :options="reactionTypeOptions"
            label=""
            chip-color="blue-9"
            :show-selected="false"
          />
        </div>
        <div class="col-12 col-md-6">
          <p class="text-weight-medium text-grey-7 q-mb-xs">
            Required stopping drip or medical help? *
          </p>
          <div class="row q-gutter-xs">
            <q-chip
              v-for="item in reactionSeverityOptions"
              :key="item"
              :label="item"
              :text-color="item === severityValue ? 'white' : 'dark'"
              :color="
                item === severityValue
                  ? item === 'ER/doctor'
                    ? 'negative'
                    : item === 'Stopped drip'
                      ? 'amber'
                      : 'blue-9'
                  : 'grey-6'
              "
              :square="item === severityValue"
              outline
              clickable
              @click="updateSeverity(item)"
            />
          </div>
        </div>
      </div>

      <!-- Optional free text -->
      <div class="q-mt-md">
        <q-input
          v-model="specifyValue"
          label="Specify reaction details"
          outlined
          dense
          placeholder="Add any additional details about the reaction"
          :error="
            v.section_1_client_questionnaire.B_safety_contraindications.reaction_specify_if_yes
              .$error
          "
          @update:model-value="emit('update')"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import MultiSelectChips from './MultiSelectChips.vue'

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
const reactionTypeOptions = [
  'Nausea',
  'Dizziness',
  'Chest tightness',
  'Anxiety',
  'Vein pain',
  'Rash',
  'Other',
]
const reactionSeverityOptions = ['No', 'Stopped drip', 'ER/doctor']

const localValue = computed({
  get() {
    return (
      props.modelValue.section_1_client_questionnaire?.B_safety_contraindications
        ?.previous_adverse_reaction_to_iv_therapy || ''
    )
  },
  set(value) {
    ensurePathExists()
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.previous_adverse_reaction_to_iv_therapy =
      value
    emit('update')
  },
})

const reactionTypeValue = computed({
  get() {
    return (
      modelValue.value.section_1_client_questionnaire?.B_safety_contraindications
        ?.reaction_type_if_yes || []
    )
  },
  set(value) {
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.reaction_type_if_yes =
      value
    emit('update')
  },
})

const severityValue = computed({
  get() {
    return (
      modelValue.value.section_1_client_questionnaire?.B_safety_contraindications
        ?.reaction_severity_if_yes || ''
    )
  },
  set(value) {
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.reaction_severity_if_yes =
      value
    emit('update')
  },
})

const specifyValue = computed({
  get() {
    return (
      modelValue.value.section_1_client_questionnaire?.B_safety_contraindications
        ?.reaction_specify_if_yes || ''
    )
  },
  set(value) {
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.reaction_specify_if_yes =
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
    reactionTypeValue.value = []
    severityValue.value = ''
    specifyValue.value = ''
  }
}

function updateSeverity(value) {
  severityValue.value = value
}
</script>
