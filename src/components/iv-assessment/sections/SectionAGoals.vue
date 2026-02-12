<template>
  <q-card flat bordered class="q-pa-md q-mb-md shadow-1">
    <q-card-section class="q-pa-none q-mb-md">
      <div class="row items-center">
        <q-icon name="flag" color="primary" size="24px" class="q-mr-sm" />
        <h3 class="text-subtitle1 text-weight-bold q-my-none">A. Goals & Intent</h3>
      </div>
      <q-separator class="q-mt-sm" />
    </q-card-section>

    <!-- Primary Goal -->
    <div
      class="q-mb-lg option-group"
      :class="{
        'group--error': v.section_1_client_questionnaire.A_goals_intent.primary_goal.$error,
      }"
    >
      <p
        class="text-weight-medium q-mb-xs"
        :class="{
          'text-negative': v.section_1_client_questionnaire.A_goals_intent.primary_goal.$error,
        }"
      >
        Primary Goal *
      </p>
      <div class="row q-gutter-sm q-mb-sm">
        <q-chip
          v-for="goal in goalOptions"
          :key="goal.value"
          :label="goal.label"
          :text-color="
            goal.value === localFormData.section_1_client_questionnaire.A_goals_intent.primary_goal
              ? 'white'
              : 'dark'
          "
          :color="
            goal.value === localFormData.section_1_client_questionnaire.A_goals_intent.primary_goal
              ? 'primary'
              : 'grey-3'
          "
          size="md"
          clickable
          @click="
            updateField('section_1_client_questionnaire.A_goals_intent.primary_goal', goal.value)
          "
        />
      </div>
    </div>

    <!-- Secondary Goal -->
    <div
      class="q-mb-lg option-group"
      :class="{
        'group--error': v.section_1_client_questionnaire.A_goals_intent.secondary_goal.$error,
      }"
    >
      <p
        class="text-weight-medium q-mb-xs"
        :class="{
          'text-negative': v.section_1_client_questionnaire.A_goals_intent.secondary_goal.$error,
        }"
      >
        Secondary Goal
      </p>
      <div class="row q-gutter-sm q-mb-sm">
        <q-chip
          v-for="goal in goalOptions"
          :key="goal.value"
          :label="goal.label"
          :text-color="
            goal.value ===
            localFormData.section_1_client_questionnaire.A_goals_intent.secondary_goal
              ? 'white'
              : 'dark'
          "
          :color="
            goal.value ===
            localFormData.section_1_client_questionnaire.A_goals_intent.secondary_goal
              ? 'primary'
              : 'grey-3'
          "
          size="md"
          clickable
          @click="
            updateField('section_1_client_questionnaire.A_goals_intent.secondary_goal', goal.value)
          "
        />
      </div>
    </div>

    <!-- Intensity Preference -->
    <div
      class="q-mb-md option-group"
      :class="{
        'group--error':
          v.section_1_client_questionnaire.A_goals_intent.desired_intensity_preference.$error,
      }"
    >
      <p
        class="text-weight-medium q-mb-xs"
        :class="{
          'text-negative':
            v.section_1_client_questionnaire.A_goals_intent.desired_intensity_preference.$error,
        }"
      >
        Desired Intensity Preference *
      </p>
      <div class="row q-gutter-xs">
        <q-chip
          v-for="item in intensityOptions"
          :key="item"
          :label="item"
          :text-color="
            item ===
            localFormData.section_1_client_questionnaire.A_goals_intent.desired_intensity_preference
              ? 'white'
              : 'dark'
          "
          :color="
            item ===
            localFormData.section_1_client_questionnaire.A_goals_intent.desired_intensity_preference
              ? 'primary'
              : 'grey-3'
          "
          size="md"
          clickable
          @click="
            updateField(
              'section_1_client_questionnaire.A_goals_intent.desired_intensity_preference',
              item,
            )
          "
        />
      </div>
    </div>
  </q-card>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  formData: {
    type: Object,
    required: true,
  },
  v: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:formData', 'update'])

const goalOptions = [
  'None',
  'Energy',
  'Skin glow',
  'Recovery',
  'Immunity support',
  'Brain fog',
  'Athletic performance',
  'Antioxidant',
  'NAD+ wellness',
  'Weight Management & Metabolism',
  'Stress Relief & Relaxation',
].map((g) => ({ label: g, value: g }))

const intensityOptions = ['Gentle', 'Moderate', 'Strong']

// Create local reactive copy
const localFormData = ref(props.formData)

watch(
  () => props.formData,
  (newVal) => {
    localFormData.value = newVal
  },
  { deep: true },
)

function updateField(path, value) {
  const paths = path.split('.')
  let obj = localFormData.value
  for (let i = 0; i < paths.length - 1; i++) {
    if (!obj[paths[i]]) obj[paths[i]] = {}
    obj = obj[paths[i]]
  }
  obj[paths[paths.length - 1]] = value

  const primary_goal =
    localFormData.value.section_1_client_questionnaire.A_goals_intent.primary_goal
  const secondary_goal =
    localFormData.value.section_1_client_questionnaire.A_goals_intent.secondary_goal
  if (primary_goal != 'NAD+ wellness' && secondary_goal != 'NAD+ wellness') {
    localFormData.value.section_1_client_questionnaire.F_nad_specific_if_applicable = {
      previous_nad_experience: '',
      tolerance_if_yes: '',
      tolerance_improved_when_slowed: '',
      preferred_nad_experience: '',
      primary_reason_for_nad_interest: '',
    }
  }

  emitUpdate()
}

function emitUpdate() {
  emit('update:formData', localFormData.value)
  emit('update')
}
</script>
