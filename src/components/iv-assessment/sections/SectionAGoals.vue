<template>
  <q-card flat bordered class="q-pa-md q-mb-md shadow-1">
    <q-card-section class="q-pa-none q-mb-md">
      <div class="row items-center">
        <q-icon name="flag" color="primary" size="24px" class="q-mr-sm" />
        <h3 class="text-subtitle1 text-weight-bold q-mb-none">A. Goals & Intent</h3>
      </div>
      <q-separator class="q-mt-sm" />
    </q-card-section>

    <!-- Primary Goal -->
    <div class="q-mb-lg">
      <p class="text-weight-medium q-mb-xs">Primary Goal *</p>
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
    <div class="q-mb-lg">
      <p class="text-weight-medium q-mb-xs">Secondary Goal (Optional)</p>
      <div class="row q-gutter-sm q-mb-sm">
        <q-chip
          label="None"
          :text-color="
            localFormData.section_1_client_questionnaire.A_goals_intent.secondary_goal === ''
              ? 'white'
              : 'dark'
          "
          :color="
            localFormData.section_1_client_questionnaire.A_goals_intent.secondary_goal === ''
              ? 'grey-6'
              : 'grey-3'
          "
          size="md"
          clickable
          @click="updateField('section_1_client_questionnaire.A_goals_intent.secondary_goal', '')"
        />
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
    <div class="q-mb-md">
      <p class="text-weight-medium q-mb-xs">Desired Intensity Preference *</p>
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
import { ref } from 'vue'

const props = defineProps({
  formData: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:formData', 'update'])

const goalOptions = [
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

function updateField(path, value) {
  const paths = path.split('.')
  let obj = localFormData.value
  for (let i = 0; i < paths.length - 1; i++) {
    if (!obj[paths[i]]) obj[paths[i]] = {}
    obj = obj[paths[i]]
  }
  obj[paths[paths.length - 1]] = value
  emitUpdate()
}

function emitUpdate() {
  emit('update:formData', localFormData.value)
  emit('update')
}
</script>
