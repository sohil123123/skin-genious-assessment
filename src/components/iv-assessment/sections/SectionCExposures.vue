<template>
  <q-card flat bordered class="q-pa-md q-mb-md shadow-1">
    <q-card-section class="q-pa-none q-mb-md">
      <div class="row items-center">
        <q-icon name="history" color="info" size="24px" class="q-mr-sm" />
        <h3 class="text-subtitle1 text-weight-bold q-my-none text-info">
          C. Recent Exposures (Last 24–72 Hours)
        </h3>
      </div>
      <q-separator class="q-mt-sm" />
    </q-card-section>

    <!-- Alcohol Intake -->
    <div
      class="q-mb-lg option-group"
      :class="{
        'group--error':
          v.section_1_client_questionnaire.C_recent_exposures_24_72h.alcohol_intake_last_24h
            .$error ||
          v.section_1_client_questionnaire.C_recent_exposures_24_72h.alcohol_last_drink_if_high
            .$error,
      }"
    >
      <p
        class="text-weight-medium q-mb-xs"
        :class="{
          'text-negative':
            v.section_1_client_questionnaire.C_recent_exposures_24_72h.alcohol_intake_last_24h
              .$error ||
            v.section_1_client_questionnaire.C_recent_exposures_24_72h.alcohol_last_drink_if_high
              .$error,
        }"
      >
        Alcohol intake in last 24 hours *
      </p>
      <div class="row q-gutter-xs q-mb-sm">
        <q-chip
          v-for="item in alcoholOptions"
          :key="item.value"
          :label="item.label"
          :text-color="
            item.value ===
            localFormData.section_1_client_questionnaire.C_recent_exposures_24_72h
              .alcohol_intake_last_24h
              ? 'white'
              : 'dark'
          "
          :color="
            item.value ===
            localFormData.section_1_client_questionnaire.C_recent_exposures_24_72h
              .alcohol_intake_last_24h
              ? item.value === 'None'
                ? 'positive'
                : 'primary'
              : 'grey-3'
          "
          size="md"
          clickable
          @click="
            updateField(
              'section_1_client_questionnaire.C_recent_exposures_24_72h.alcohol_intake_last_24h',
              item.value,
            )
          "
        />
      </div>

      <!-- Follow-up for high alcohol -->
      <div v-if="showAlcoholFollowup" class="q-ml-md q-mt-md bg-yellow-1 q-pa-sm rounded-borders">
        <p class="text-weight-medium text-grey-7 q-mb-xs">Last drink was within past 12 hours? *</p>
        <div class="row q-gutter-xs">
          <q-chip
            v-for="item in yesNoUnsureOptions"
            :key="item"
            :label="item"
            :text-color="
              item ===
              localFormData.section_1_client_questionnaire.C_recent_exposures_24_72h
                .alcohol_last_drink_if_high
                ? 'white'
                : 'dark'
            "
            :color="
              item ===
              localFormData.section_1_client_questionnaire.C_recent_exposures_24_72h
                .alcohol_last_drink_if_high
                ? item === 'Yes'
                  ? 'amber'
                  : 'blue-9'
                : 'grey-6'
            "
            :square="
              item ===
              localFormData.section_1_client_questionnaire.C_recent_exposures_24_72h
                .alcohol_last_drink_if_high
            "
            outline
            clickable
            @click="
              updateField(
                'section_1_client_questionnaire.C_recent_exposures_24_72h.alcohol_last_drink_if_high',
                item,
              )
            "
          />
        </div>
      </div>
    </div>

    <!-- Exercise -->
    <div
      class="q-mb-lg option-group"
      :class="{
        'group--error':
          v.section_1_client_questionnaire.C_recent_exposures_24_72h.exercise_last_24h.$error,
      }"
    >
      <p
        class="text-weight-medium q-mb-xs"
        :class="{
          'text-negative':
            v.section_1_client_questionnaire.C_recent_exposures_24_72h.exercise_last_24h.$error,
        }"
      >
        Exercise in last 24 hours *
      </p>
      <div class="row q-gutter-xs q-mb-sm">
        <q-chip
          v-for="item in exerciseOptions"
          :key="item.value"
          :label="item.label"
          :text-color="
            item.value ===
            localFormData.section_1_client_questionnaire.C_recent_exposures_24_72h.exercise_last_24h
              ? 'white'
              : 'dark'
          "
          :color="
            item.value ===
            localFormData.section_1_client_questionnaire.C_recent_exposures_24_72h.exercise_last_24h
              ? 'primary'
              : 'grey-3'
          "
          size="md"
          clickable
          @click="
            updateField(
              'section_1_client_questionnaire.C_recent_exposures_24_72h.exercise_last_24h',
              item.value,
            )
          "
        />
      </div>
    </div>

    <!-- Sleep Duration -->
    <div class="q-mb-lg">
      <q-input
        v-model.number="
          localFormData.section_1_client_questionnaire.C_recent_exposures_24_72h
            .sleep_duration_last_night_hours
        "
        type="number"
        step="0.1"
        label="Sleep duration last night (hours) *"
        outlined
        dense
        placeholder="e.g., 6.5"
        hide-bottom-space
        :error="
          v.section_1_client_questionnaire.C_recent_exposures_24_72h.sleep_duration_last_night_hours
            .$error
        "
        @update:model-value="emitUpdate"
      />
    </div>

    <!-- Stress Level -->
    <div
      class="q-mb-lg option-group"
      :class="{
        'group--error':
          v.section_1_client_questionnaire.C_recent_exposures_24_72h.perceived_stress_level.$error,
      }"
    >
      <p
        class="text-weight-medium q-mb-xs"
        :class="{
          'text-negative':
            v.section_1_client_questionnaire.C_recent_exposures_24_72h.perceived_stress_level
              .$error,
        }"
      >
        Current perceived stress level *
      </p>
      <div class="row q-gutter-xs q-mb-sm">
        <q-chip
          v-for="item in stressLevelOptions"
          :key="item"
          :label="item"
          :text-color="
            item ===
            localFormData.section_1_client_questionnaire.C_recent_exposures_24_72h
              .perceived_stress_level
              ? 'white'
              : 'dark'
          "
          :color="
            item ===
            localFormData.section_1_client_questionnaire.C_recent_exposures_24_72h
              .perceived_stress_level
              ? item === 'High'
                ? 'negative'
                : item === 'Medium'
                  ? 'warning'
                  : 'primary'
              : 'grey-3'
          "
          size="md"
          clickable
          @click="
            updateField(
              'section_1_client_questionnaire.C_recent_exposures_24_72h.perceived_stress_level',
              item,
            )
          "
        />
      </div>
    </div>

    <!-- Caffeine Intake -->
    <div
      class="q-mb-lg option-group"
      :class="{
        'group--error':
          v.section_1_client_questionnaire.C_recent_exposures_24_72h.caffeine_intake_today.$error,
      }"
    >
      <p
        class="text-weight-medium q-mb-xs"
        :class="{
          'text-negative':
            v.section_1_client_questionnaire.C_recent_exposures_24_72h.caffeine_intake_today.$error,
        }"
      >
        Caffeine intake today *
      </p>
      <div class="row q-gutter-xs">
        <q-chip
          v-for="item in caffeineOptions"
          :key="item"
          :label="item"
          :text-color="
            item ===
            localFormData.section_1_client_questionnaire.C_recent_exposures_24_72h
              .caffeine_intake_today
              ? 'white'
              : 'dark'
          "
          :color="
            item ===
            localFormData.section_1_client_questionnaire.C_recent_exposures_24_72h
              .caffeine_intake_today
              ? 'primary'
              : 'grey-3'
          "
          size="md"
          clickable
          @click="
            updateField(
              'section_1_client_questionnaire.C_recent_exposures_24_72h.caffeine_intake_today',
              item,
            )
          "
        />
      </div>
    </div>
  </q-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

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

const alcoholOptions = [
  { label: 'None', value: 'None' },
  { label: '1-2 drinks', value: '1-2' },
  { label: '3-5 drinks', value: '3-5' },
  { label: '>5 drinks', value: '>5' },
]

const exerciseOptions = [
  { label: 'None', value: 'None' },
  { label: 'Light', value: 'Light' },
  { label: 'Heavy', value: 'Heavy' },
]

const yesNoUnsureOptions = ['Yes', 'No', 'Unsure']
const stressLevelOptions = ['Low', 'Medium', 'High']
const caffeineOptions = ['0', '1', '2', '3+']

const showAlcoholFollowup = computed(
  () =>
    localFormData.value.section_1_client_questionnaire?.C_recent_exposures_24_72h
      ?.alcohol_intake_last_24h === '>5',
)

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
  if (
    localFormData.value.section_1_client_questionnaire?.C_recent_exposures_24_72h
      ?.alcohol_intake_last_24h != '>5'
  ) {
    localFormData.value.section_1_client_questionnaire.C_recent_exposures_24_72h.alcohol_last_drink_if_high =
      ''
  }
  emitUpdate()
}

function emitUpdate() {
  emit('update:formData', localFormData.value)
  emit('update')
}
</script>
