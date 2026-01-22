<template>
  <div
    class="q-mb-lg option-group"
    :class="{
      'group--error':
        v.section_1_client_questionnaire.B_safety_contraindications.history_kidney_stones.$error ||
        v.section_1_client_questionnaire.B_safety_contraindications.kidney_stones_last_if_yes
          .$error ||
        v.section_1_client_questionnaire.B_safety_contraindications.kidney_stones_recurrent_if_yes
          .$error,
    }"
  >
    <p
      class="text-weight-medium q-mb-xs"
      :class="{
        'text-negative':
          v.section_1_client_questionnaire.B_safety_contraindications.history_kidney_stones
            .$error ||
          v.section_1_client_questionnaire.B_safety_contraindications.kidney_stones_last_if_yes
            .$error ||
          v.section_1_client_questionnaire.B_safety_contraindications.kidney_stones_recurrent_if_yes
            .$error,
      }"
    >
      History of kidney stones *
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
          <p class="text-weight-medium text-grey-7 q-mb-xs">Last episode *</p>
          <div class="row q-gutter-xs">
            <q-chip
              v-for="item in kidneyStonesTimeOptions"
              :key="item"
              :label="item"
              :text-color="item === lastEpisodeValue ? 'white' : 'dark'"
              :color="
                item === lastEpisodeValue
                  ? item === '<6 months'
                    ? 'negative'
                    : 'blue-9'
                  : 'grey-6'
              "
              :square="item === lastEpisodeValue"
              outline
              clickable
              @click="updateLastEpisode(item)"
            />
          </div>
        </div>
        <div class="col-12 col-md-6">
          <p class="text-weight-medium text-grey-7 q-mb-xs">Recurrent stones (2+ episodes)? *</p>
          <div class="row q-gutter-xs">
            <q-chip
              v-for="item in yesNoUnsureOptions"
              :key="item"
              :label="item"
              :text-color="item === recurrentValue ? 'white' : 'dark'"
              :color="
                item === recurrentValue
                  ? item === 'Yes'
                    ? 'negative'
                    : item === 'Unsure'
                      ? 'amber'
                      : 'blue-9'
                  : 'grey-6'
              "
              :square="item === recurrentValue"
              outline
              clickable
              @click="updateRecurrent(item)"
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
  v: {
    type: Object,
    required: true,
  },
})

const modelValue = ref(props.modelValue)

const emit = defineEmits(['update:modelValue', 'update'])

const yesNoUnsureOptions = ['Yes', 'No', 'Unsure']
const kidneyStonesTimeOptions = ['<6 months', '6–24 months', '>24 months', 'Unsure']

const localValue = computed({
  get() {
    return (
      props.modelValue.section_1_client_questionnaire?.B_safety_contraindications
        ?.history_kidney_stones || ''
    )
  },
  set(value) {
    ensurePathExists()
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.history_kidney_stones =
      value
    emit('update')
  },
})

const lastEpisodeValue = computed({
  get() {
    return (
      props.modelValue.section_1_client_questionnaire?.B_safety_contraindications
        ?.kidney_stones_last_if_yes || ''
    )
  },
  set(value) {
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.kidney_stones_last_if_yes =
      value
    emit('update')
  },
})

const recurrentValue = computed({
  get() {
    return (
      props.modelValue.section_1_client_questionnaire?.B_safety_contraindications
        ?.kidney_stones_recurrent_if_yes || ''
    )
  },
  set(value) {
    modelValue.value.section_1_client_questionnaire.B_safety_contraindications.kidney_stones_recurrent_if_yes =
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
    lastEpisodeValue.value = ''
    recurrentValue.value = ''
  }
}

function updateLastEpisode(value) {
  lastEpisodeValue.value = value
}

function updateRecurrent(value) {
  recurrentValue.value = value
}
</script>
