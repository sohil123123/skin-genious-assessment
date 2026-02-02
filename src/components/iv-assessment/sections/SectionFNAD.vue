<template>
  <q-card v-if="isNadApplicable" flat bordered class="q-pa-md q-mb-md shadow-1">
    <q-card-section class="q-pa-none q-mb-md">
      <div class="row items-center">
        <q-icon name="science" color="primary" size="24px" class="q-mr-sm" />
        <h3 class="text-subtitle1 text-weight-bold q-my-none">F. NAD+ Specific</h3>
        <q-badge color="warning" class="q-ml-sm" label="Required" />
      </div>
      <q-separator class="q-mt-sm" />
    </q-card-section>

    <div
      class="q-mb-lg option-group"
      :class="{
        'group--error':
          v.section_1_client_questionnaire.F_nad_specific_if_applicable.previous_nad_experience
            .$error ||
          v.section_1_client_questionnaire.F_nad_specific_if_applicable.tolerance_if_yes.$error ||
          v.section_1_client_questionnaire.F_nad_specific_if_applicable
            .tolerance_improved_when_slowed.$error,
      }"
    >
      <!-- Previous NAD+ experience -->
      <YesNoWithFollowup
        label="Previous NAD+ experience *"
        v-model="
          localFormData.section_1_client_questionnaire.F_nad_specific_if_applicable
            .previous_nad_experience
        "
        followup-label="If yes: tolerance *"
        followup-path="section_1_client_questionnaire.F_nad_specific_if_applicable.tolerance_if_yes"
        :form-data="localFormData"
        :followup-options="toleranceOptions"
        followup-type="single-select"
        @update="handleNadExperienceChange"
      />

      <!-- Additional tolerance follow-up -->
      <div v-if="showToleranceFollowup" class="q-ml-md q-mt-md bg-yellow-1 q-pa-sm rounded-borders">
        <p class="text-weight-medium text-grey7 q-mb-xs">
          Did symptoms improve when drip was slowed? *
        </p>
        <div class="row q-gutter-xs">
          <q-chip
            v-for="item in yesNoUnsureOptions"
            :key="item"
            :label="item"
            :text-color="
              item ===
              localFormData.section_1_client_questionnaire.F_nad_specific_if_applicable
                .tolerance_improved_when_slowed
                ? 'white'
                : 'dark'
            "
            :color="
              item ===
              localFormData.section_1_client_questionnaire.F_nad_specific_if_applicable
                .tolerance_improved_when_slowed
                ? item === 'Yes'
                  ? 'positive'
                  : item === 'Unsure'
                    ? 'amber'
                    : 'blue-9'
                : 'grey-6'
            "
            :square="
              item ===
              localFormData.section_1_client_questionnaire.F_nad_specific_if_applicable
                .tolerance_improved_when_slowed
            "
            outline
            clickable
            @click="
              updateField(
                'section_1_client_questionnaire.F_nad_specific_if_applicable.tolerance_improved_when_slowed',
                item,
              )
            "
          />
        </div>
      </div>
    </div>

    <!-- Preferred NAD+ experience -->
    <div
      class="q-mb-sm option-group"
      :class="{
        'q-mb-lg group--error':
          v.section_1_client_questionnaire.F_nad_specific_if_applicable.preferred_nad_experience
            .$error,
      }"
    >
      <p
        class="text-weight-medium q-mb-xs"
        :class="{
          'text-negative':
            v.section_1_client_questionnaire.F_nad_specific_if_applicable.preferred_nad_experience
              .$error,
        }"
      >
        Preferred NAD+ experience *
      </p>
      <div class="row q-gutter-xs q-mb-sm">
        <q-chip
          v-for="item in nadExperienceOptions"
          :key="item"
          :label="item"
          :text-color="
            item ===
            localFormData.section_1_client_questionnaire.F_nad_specific_if_applicable
              .preferred_nad_experience
              ? 'white'
              : 'dark'
          "
          :color="
            item ===
            localFormData.section_1_client_questionnaire.F_nad_specific_if_applicable
              .preferred_nad_experience
              ? item === 'Gentle'
                ? 'positive'
                : item === 'Standard'
                  ? 'primary'
                  : 'warning'
              : 'grey-3'
          "
          size="md"
          clickable
          @click="
            updateField(
              'section_1_client_questionnaire.F_nad_specific_if_applicable.preferred_nad_experience',
              item,
            )
          "
        />
      </div>
    </div>

    <!-- Primary reason for NAD+ interest -->
    <div
      class="q-mb-sm option-group"
      :class="{
        'group--error':
          v.section_1_client_questionnaire.F_nad_specific_if_applicable
            .primary_reason_for_nad_interest.$error,
      }"
    >
      <p
        class="text-weight-medium q-mb-xs"
        :class="{
          'text-negative':
            v.section_1_client_questionnaire.F_nad_specific_if_applicable
              .primary_reason_for_nad_interest.$error,
        }"
      >
        Primary reason for NAD+ interest *
      </p>
      <div class="row q-gutter-xs">
        <q-chip
          v-for="item in nadReasonOptions"
          :key="item"
          :label="item"
          :text-color="
            item ===
            localFormData.section_1_client_questionnaire.F_nad_specific_if_applicable
              .primary_reason_for_nad_interest
              ? 'white'
              : 'dark'
          "
          :color="
            item ===
            localFormData.section_1_client_questionnaire.F_nad_specific_if_applicable
              .primary_reason_for_nad_interest
              ? 'primary'
              : 'grey-3'
          "
          size="md"
          clickable
          @click="
            updateField(
              'section_1_client_questionnaire.F_nad_specific_if_applicable.primary_reason_for_nad_interest',
              item,
            )
          "
        />
      </div>
    </div>
  </q-card>

  <q-card v-else flat bordered class="q-pa-md q-mb-md shadow-1 bg-grey-2">
    <q-card-section class="q-pa-none">
      <div class="row items-center">
        <q-icon name="science" color="grey-6" size="24px" class="q-mr-sm" />
        <h3 class="text-subtitle1 text-weight-medium q-my-none text-grey-7">F. NAD+ Specific</h3>
        <q-badge color="grey-5" class="q-ml-sm" label="Not applicable" />
      </div>
      <q-separator class="q-my-sm" />
      <div class="text-caption text-grey-7">
        <q-icon name="info" size="xs" class="q-mr-xs" />
        This section will become available if you select "NAD+ wellness" as a primary or secondary
        goal
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import YesNoWithFollowup from '../partials/YesNoWithFollowup.vue'

const props = defineProps({
  formData: {
    type: Object,
    required: true,
  },
  isNadApplicable: {
    type: Boolean,
    default: false,
  },
  v: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:formData', 'update'])

const yesNoUnsureOptions = ['Yes', 'No', 'Unsure']
const toleranceOptions = ['No issues', 'Nausea', 'Chest tightness', 'Anxiety']
const nadExperienceOptions = ['Gentle', 'Standard', 'Strong']
const nadReasonOptions = ['Energy', 'Brain clarity', 'Anti-aging support', 'Recovery']

const showToleranceFollowup = computed(() => {
  const tolerance =
    localFormData.value.section_1_client_questionnaire?.F_nad_specific_if_applicable
      ?.tolerance_if_yes
  return tolerance === 'Chest tightness' || tolerance === 'Anxiety'
})

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
  emitUpdate()
}

function handleNadExperienceChange() {
  const value =
    localFormData.value.section_1_client_questionnaire.F_nad_specific_if_applicable
      .previous_nad_experience
  if (value !== 'Yes') {
    localFormData.value.section_1_client_questionnaire.F_nad_specific_if_applicable.tolerance_if_yes =
      ''
    localFormData.value.section_1_client_questionnaire.F_nad_specific_if_applicable.tolerance_improved_when_slowed =
      ''
  }
  const tolerance =
    localFormData.value.section_1_client_questionnaire.F_nad_specific_if_applicable.tolerance_if_yes
  if (tolerance === 'Chest tightness' || tolerance === 'Anxiety') {
    localFormData.value.section_1_client_questionnaire.F_nad_specific_if_applicable.tolerance_improved_when_slowed =
      ''
  }
  emitUpdate()
}

function emitUpdate() {
  emit('update:formData', localFormData.value)
  emit('update')
}
</script>
