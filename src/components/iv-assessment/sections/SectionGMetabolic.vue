<template>
  <q-card flat bordered class="q-pa-md q-mb-md shadow-1">
    <q-card-section class="q-pa-none q-mb-md">
      <div class="row items-center">
        <q-icon name="monitor_heart" color="primary" size="24px" class="q-mr-sm" />
        <h3 class="text-subtitle1 text-weight-bold q-my-none">G. Acute Metabolic Status</h3>
      </div>
      <q-separator class="q-mt-sm" />
    </q-card-section>

    <!-- Time since last meal -->
    <div class="q-mb-lg">
      <q-input
        v-model.number="
          localFormData.section_1_client_questionnaire.G_acute_metabolic_status
            .time_since_last_meal_hours
        "
        type="number"
        step="0.1"
        label="Time since last meal (hours) *"
        outlined
        dense
        placeholder="e.g., 3"
        :rules="[
          (val) => (val !== null && val !== '') || 'Required',
          (val) => (val >= 0 && val <= 72) || 'Must be 0-72 hours',
        ]"
        @update:model-value="emitUpdate"
      />
    </div>

    <!-- Current diet type -->
    <div class="q-mb-lg">
      <p class="text-weight-medium q-mb-xs">Current diet type *</p>
      <div class="row q-gutter-xs q-mb-sm">
        <q-chip
          v-for="item in dietTypeOptions"
          :key="item"
          :label="item"
          :text-color="
            item ===
            localFormData.section_1_client_questionnaire.G_acute_metabolic_status.current_diet_type
              ? 'white'
              : 'dark'
          "
          :color="
            item ===
            localFormData.section_1_client_questionnaire.G_acute_metabolic_status.current_diet_type
              ? 'primary'
              : 'grey-3'
          "
          size="md"
          clickable
          @click="
            updateField(
              'section_1_client_questionnaire.G_acute_metabolic_status.current_diet_type',
              item,
            )
          "
        />
      </div>
    </div>

    <!-- Female only fields -->
    <div v-if="isFemale" class="q-mt-lg bg-pink-1 q-pa-md rounded-borders">
      <h4 class="text-subtitle2 q-mb-md">Females Only</h4>

      <!-- LMP Date -->
      <div class="q-mb-lg">
        <q-input
          v-model="
            localFormData.section_1_client_questionnaire.G_acute_metabolic_status.females_only
              .first_day_of_last_menstrual_period_date
          "
          type="date"
          label="First day of last menstrual period (Date)"
          outlined
          dense
          @update:model-value="emitUpdate"
        />
      </div>

      <!-- OR Menopausal -->
      <div class="q-mb-lg">
        <p class="text-weight-medium q-mb-xs">OR Menopausal</p>
        <div class="row q-gutter-xs q-mb-sm">
          <q-chip
            v-for="item in yesNoOptions"
            :key="item"
            :label="item"
            :text-color="
              item ===
              localFormData.section_1_client_questionnaire.G_acute_metabolic_status.females_only
                .menopausal
                ? 'white'
                : 'dark'
            "
            :color="
              item ===
              localFormData.section_1_client_questionnaire.G_acute_metabolic_status.females_only
                .menopausal
                ? 'primary'
                : 'grey-3'
            "
            size="md"
            clickable
            @click="handleMenopausalChange(item)"
          />
        </div>
        <div class="text-caption text-grey-6 q-ml-xs">
          <q-icon name="info" size="xs" /> For females: either LMP date OR Menopausal=Yes must be
          provided
        </div>
      </div>

      <!-- Pregnancy chance if uncertain -->
      <div v-if="showPregnancyChance" class="q-mb-md">
        <p class="text-weight-medium text-grey-7 q-mb-xs">Any chance of pregnancy? *</p>
        <div class="row q-gutter-xs">
          <q-chip
            v-for="item in yesNoUnsureOptions"
            :key="item"
            :label="item"
            :text-color="
              item ===
              localFormData.section_1_client_questionnaire.G_acute_metabolic_status.females_only
                .pregnancy_chance_if_uncertain
                ? 'white'
                : 'dark'
            "
            :color="
              item ===
              localFormData.section_1_client_questionnaire.G_acute_metabolic_status.females_only
                .pregnancy_chance_if_uncertain
                ? item === 'Yes'
                  ? 'green'
                  : 'blue-9'
                : 'grey-6'
            "
            :square="
              item ===
              localFormData.section_1_client_questionnaire.G_acute_metabolic_status.females_only
                .pregnancy_chance_if_uncertain
            "
            outline
            clickable
            @click="
              updateField(
                'section_1_client_questionnaire.G_acute_metabolic_status.females_only.pregnancy_chance_if_uncertain',
                item,
              )
            "
          />
        </div>
      </div>
    </div>
  </q-card>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  formData: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:formData', 'update'])

const yesNoOptions = ['Yes', 'No']
const yesNoUnsureOptions = ['Yes', 'No', 'Unsure']
const dietTypeOptions = ['Omnivore', 'Vegetarian', 'Vegan', 'Keto']

const isFemale = computed(() => props.formData.meta?.profile?.gender === 'Female')

const showPregnancyChance = computed(() => {
  const lmp =
    localFormData.value.section_1_client_questionnaire?.G_acute_metabolic_status?.females_only
      ?.first_day_of_last_menstrual_period_date
  const menopausal =
    localFormData.value.section_1_client_questionnaire?.G_acute_metabolic_status?.females_only
      ?.menopausal

  return !lmp && menopausal !== 'Yes'
})

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

function handleMenopausalChange(value) {
  localFormData.value.section_1_client_questionnaire.G_acute_metabolic_status.females_only.menopausal =
    value

  // Reset pregnancy chance if menopausal is Yes
  if (value === 'Yes') {
    localFormData.value.section_1_client_questionnaire.G_acute_metabolic_status.females_only.pregnancy_chance_if_uncertain =
      ''
  }

  emitUpdate()
}

function emitUpdate() {
  emit('update:formData', localFormData.value)
  emit('update')
}
</script>
