<template>
  <div
    class="q-mb-lg option-group"
    :class="{
      'group--error':
        v.section_1_client_questionnaire.B_safety_contraindications
          .known_allergy_to_iv_vitamins_minerals.$error ||
        v.section_1_client_questionnaire.B_safety_contraindications.allergy_ingredients_if_yes
          .$error ||
        v.section_1_client_questionnaire.B_safety_contraindications.allergy_severity_if_yes
          .$error ||
        v.section_1_client_questionnaire.B_safety_contraindications.allergy_specify_if_yes.$error,
    }"
  >
    <p
      class="text-weight-medium q-mb-xs"
      :class="{
        'text-negative':
          v.section_1_client_questionnaire.B_safety_contraindications
            .known_allergy_to_iv_vitamins_minerals.$error ||
          v.section_1_client_questionnaire.B_safety_contraindications.allergy_ingredients_if_yes
            .$error ||
          v.section_1_client_questionnaire.B_safety_contraindications.allergy_severity_if_yes
            .$error ||
          v.section_1_client_questionnaire.B_safety_contraindications.allergy_specify_if_yes.$error,
      }"
    >
      Known allergy to IV vitamins/minerals *
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
          <p class="text-weight-medium text-grey-7 q-mb-xs">Which ingredient(s)? *</p>
          <MultiSelectChips
            v-model="ingredientsValue"
            :options="allergyIngredientOptions"
            label=""
            :show-selected="false"
          />
        </div>
        <div class="col-12 col-md-6">
          <p class="text-weight-medium text-grey-7 q-mb-xs">Reaction severity *</p>
          <div class="row q-gutter-xs">
            <q-chip
              v-for="item in allergySeverityOptions"
              :key="item"
              :label="item"
              :text-color="item === severityValue ? 'white' : 'dark'"
              :color="
                item === severityValue
                  ? item === 'Mild rash/itching'
                    ? 'amber'
                    : item === 'Severe or ER visit'
                      ? 'negative'
                      : 'amber'
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
          label="Specify allergy details"
          outlined
          dense
          placeholder="Add any additional details about the allergy"
          :error="
            v.section_1_client_questionnaire.B_safety_contraindications.allergy_specify_if_yes
              .$error
          "
          @update:model-value="emit('update')"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
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

const emit = defineEmits(['update:modelValue', 'update'])

const yesNoOptions = ['Yes', 'No']
const allergyIngredientOptions = [
  'Vitamin C',
  'B-Complex',
  'B12',
  'Magnesium',
  'Amino acids',
  'NAD+',
  'Other',
  'Unsure',
]
const allergySeverityOptions = [
  'Mild rash/itching',
  'Breathing difficulty or swelling',
  'Severe or ER visit',
]

const localValue = computed({
  get() {
    return (
      props.modelValue.section_1_client_questionnaire?.B_safety_contraindications
        ?.known_allergy_to_iv_vitamins_minerals || ''
    )
  },
  set(value) {
    ensurePathExists()
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.known_allergy_to_iv_vitamins_minerals =
      value
    emit('update')
  },
})

const ingredientsValue = computed({
  get() {
    return (
      modelValue.value.section_1_client_questionnaire?.B_safety_contraindications
        ?.allergy_ingredients_if_yes || []
    )
  },
  set(value) {
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.allergy_ingredients_if_yes =
      value
    emit('update')
  },
})

const severityValue = computed({
  get() {
    return (
      modelValue.value.section_1_client_questionnaire?.B_safety_contraindications
        ?.allergy_severity_if_yes || ''
    )
  },
  set(value) {
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.allergy_severity_if_yes =
      value
    emit('update')
  },
})

const specifyValue = computed({
  get() {
    return (
      modelValue.value.section_1_client_questionnaire?.B_safety_contraindications
        ?.allergy_specify_if_yes || ''
    )
  },
  set(value) {
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.allergy_specify_if_yes =
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
    ingredientsValue.value = []
    severityValue.value = ''
    specifyValue.value = ''
  }
}

function updateSeverity(value) {
  severityValue.value = value
}
</script>
