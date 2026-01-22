<template>
  <div
    class="q-mb-lg option-group"
    :class="{
      'group--error':
        v.section_1_client_questionnaire.B_safety_contraindications.known_liver_disease.$error ||
        v.section_1_client_questionnaire.B_safety_contraindications.liver_disease_type_if_yes
          .$error ||
        v.section_1_client_questionnaire.B_safety_contraindications.liver_lfts_if_yes.$error ||
        v.section_1_client_questionnaire.B_safety_contraindications.liver_jaundice_if_yes.$error,
    }"
  >
    <p
      class="text-weight-medium q-mb-xs"
      :class="{
        'text-negative':
          v.section_1_client_questionnaire.B_safety_contraindications.known_liver_disease.$error ||
          v.section_1_client_questionnaire.B_safety_contraindications.liver_disease_type_if_yes
            .$error ||
          v.section_1_client_questionnaire.B_safety_contraindications.liver_lfts_if_yes.$error ||
          v.section_1_client_questionnaire.B_safety_contraindications.liver_jaundice_if_yes.$error,
      }"
    >
      Known liver disease *
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
          <p class="text-weight-medium text-grey-7 q-mb-xs">Type *</p>
          <div class="row q-gutter-xs">
            <q-chip
              v-for="item in liverDiseaseTypeOptions"
              :key="item"
              :label="item"
              :text-color="item === typeValue ? 'white' : 'dark'"
              :color="
                item === typeValue ? (item === 'Cirrhosis' ? 'negative' : 'blue-9') : 'grey-6'
              "
              :square="item === typeValue"
              outline
              clickable
              @click="updateType(item)"
            />
          </div>
        </div>
        <div class="col-12 col-md-6">
          <p class="text-weight-medium text-grey-7 q-mb-xs">Abnormal LFTs in last 12 months? *</p>
          <div class="row q-gutter-xs">
            <q-chip
              v-for="item in yesNoUnsureOptions"
              :key="item"
              :label="item"
              :text-color="item === lftsValue ? 'white' : 'dark'"
              :color="
                item === lftsValue
                  ? item === 'Yes'
                    ? 'negative'
                    : item === 'Unsure'
                      ? 'amber'
                      : 'blue-9'
                  : 'grey-6'
              "
              :square="item === lftsValue"
              outline
              clickable
              @click="updateLfts(item)"
            />
          </div>
        </div>
      </div>

      <!-- Jaundice question -->
      <div class="q-mt-sm">
        <p class="text-weight-medium text-grey-7 q-mb-xs">Current jaundice or very dark urine? *</p>
        <div class="row q-gutter-xs">
          <q-chip
            v-for="item in yesNoOptions"
            :key="item"
            :label="item"
            :text-color="item === jaundiceValue ? 'white' : 'dark'"
            :color="item === jaundiceValue ? (item === 'Yes' ? 'negative' : 'blue-9') : 'grey-6'"
            :square="item === jaundiceValue"
            outline
            clickable
            @click="updateJaundice(item)"
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
const yesNoUnsureOptions = ['Yes', 'No', 'Unsure']
const liverDiseaseTypeOptions = ['Fatty liver', 'Hepatitis', 'Cirrhosis', 'Other', 'Unsure']

const localValue = computed({
  get() {
    return (
      props.modelValue.section_1_client_questionnaire?.B_safety_contraindications
        ?.known_liver_disease || ''
    )
  },
  set(value) {
    ensurePathExists()
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.known_liver_disease =
      value
    emit('update')
  },
})

const typeValue = computed({
  get() {
    return (
      props.modelValue.section_1_client_questionnaire?.B_safety_contraindications
        ?.liver_disease_type_if_yes || ''
    )
  },
  set(value) {
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.liver_disease_type_if_yes =
      value
    emit('update')
  },
})

const lftsValue = computed({
  get() {
    return (
      props.modelValue.section_1_client_questionnaire?.B_safety_contraindications
        ?.liver_lfts_if_yes || ''
    )
  },
  set(value) {
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.liver_lfts_if_yes =
      value
    emit('update')
  },
})

const jaundiceValue = computed({
  get() {
    return (
      props.modelValue.section_1_client_questionnaire?.B_safety_contraindications
        ?.liver_jaundice_if_yes || ''
    )
  },
  set(value) {
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.liver_jaundice_if_yes =
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
    lftsValue.value = ''
    jaundiceValue.value = ''
  }
}

function updateType(value) {
  typeValue.value = value
}

function updateLfts(value) {
  lftsValue.value = value
}

function updateJaundice(value) {
  jaundiceValue.value = value
}
</script>
