<template>
  <q-card flat bordered class="q-pa-md q-mb-md shadow-1">
    <q-card-section class="q-pa-none q-mb-md">
      <div class="row items-center">
        <q-icon name="local_hospital" color="info" size="24px" class="q-mr-sm" />
        <h3 class="text-subtitle1 text-weight-bold q-my-none text-info">
          H. IV Access & Procedure Tolerance
        </h3>
      </div>
      <q-separator class="q-mt-sm" />
    </q-card-section>

    <!-- History of fainting -->
    <div
      class="q-mb-lg option-group"
      :class="{
        'group--error':
          v.section_1_client_questionnaire.H_iv_access_procedure_tolerance.history_fainting_needles
            .$error ||
          v.section_1_client_questionnaire.H_iv_access_procedure_tolerance.fainting_frequency
            .$error ||
          v.section_1_client_questionnaire.H_iv_access_procedure_tolerance.fainting_last_occurred
            .$error,
      }"
    >
      <YesNoWithFollowup
        label="History of fainting with needles / blood draws *"
        v-model="
          localFormData.section_1_client_questionnaire.H_iv_access_procedure_tolerance
            .history_fainting_needles
        "
        followup-label="If yes: How often *"
        followup-path="section_1_client_questionnaire.H_iv_access_procedure_tolerance.fainting_frequency"
        :form-data="localFormData"
        :followup-options="faintingFrequencyOptions"
        followup-type="single-select"
        @update="handleFaintingChange"
      />

      <!-- Additional fainting follow-ups -->
      <div
        v-if="showFaintingFollowups"
        class="q-ml-md q-mt-md bg-yellow-1 q-pa-sm rounded-borders q-mb-lg"
      >
        <p class="text-weight-medium text-grey-7 q-mb-xs">Last occurred *</p>
        <div class="row q-gutter-xs">
          <q-chip
            v-for="item in faintingTimeOptions"
            :key="item"
            :label="item"
            :text-color="
              item ===
              localFormData.section_1_client_questionnaire.H_iv_access_procedure_tolerance
                .fainting_last_occurred
                ? 'white'
                : 'dark'
            "
            :color="
              item ===
              localFormData.section_1_client_questionnaire.H_iv_access_procedure_tolerance
                .fainting_last_occurred
                ? item === '<12 months'
                  ? 'purple-9'
                  : 'blue-9'
                : 'grey-6'
            "
            :square="
              item ===
              localFormData.section_1_client_questionnaire.H_iv_access_procedure_tolerance
                .fainting_last_occurred
            "
            outline
            clickable
            @click="
              updateField(
                'section_1_client_questionnaire.H_iv_access_procedure_tolerance.fainting_last_occurred',
                item,
              )
            "
          />
        </div>
      </div>
    </div>

    <!-- Needle phobia -->
    <YesNoWithFollowup
      label="Needle phobia / high anxiety with cannulation *"
      v-model="
        localFormData.section_1_client_questionnaire.H_iv_access_procedure_tolerance.needle_phobia
      "
      followup-label="If yes: Preference *"
      followup-path="section_1_client_questionnaire.H_iv_access_procedure_tolerance.needle_phobia_preference"
      :form-data="localFormData"
      :followup-options="phobiaPreferenceOptions"
      followup-type="single-select"
      @update="emitUpdate"
      :error="
        v.section_1_client_questionnaire.H_iv_access_procedure_tolerance.needle_phobia.$error ||
        v.section_1_client_questionnaire.H_iv_access_procedure_tolerance.needle_phobia_preference
          .$error
      "
      class="q-mb-lg"
    />

    <!-- Difficult veins -->
    <YesNoWithFollowup
      label="Previously told 'difficult veins' / multiple attempts required *"
      v-model="
        localFormData.section_1_client_questionnaire.H_iv_access_procedure_tolerance.difficult_veins
      "
      followup-label="If yes: Typical attempts needed *"
      followup-path="section_1_client_questionnaire.H_iv_access_procedure_tolerance.difficult_veins_attempts"
      :form-data="localFormData"
      :followup-options="veinAttemptOptions"
      followup-type="single-select"
      @update="emitUpdate"
      :error="
        v.section_1_client_questionnaire.H_iv_access_procedure_tolerance.difficult_veins.$error ||
        v.section_1_client_questionnaire.H_iv_access_procedure_tolerance.difficult_veins_attempts
          .$error
      "
      class="q-mb-lg"
    />

    <!-- Vasovagal tendency -->
    <YesNoWithFollowup
      label="Vasovagal tendency *"
      v-model="
        localFormData.section_1_client_questionnaire.H_iv_access_procedure_tolerance
          .vasovagal_tendency
      "
      followup-label="If yes: Usually triggered by *"
      followup-path="section_1_client_questionnaire.H_iv_access_procedure_tolerance.vasovagal_trigger"
      :form-data="localFormData"
      :followup-options="vasovagalTriggerOptions"
      followup-type="single-select"
      @update="emitUpdate"
      :error="
        v.section_1_client_questionnaire.H_iv_access_procedure_tolerance.vasovagal_tendency
          .$error ||
        v.section_1_client_questionnaire.H_iv_access_procedure_tolerance.vasovagal_trigger.$error
      "
    />
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
  v: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:formData', 'update'])

const faintingFrequencyOptions = ['Rare – once ever', 'Sometimes', 'Often']
const faintingTimeOptions = ['<12 months', '>12 months', 'Unsure']
const phobiaPreferenceOptions = ['Talk-through & slow', "Don't show needle", 'Need extra time']
const veinAttemptOptions = ['2', '3', '4+']
const vasovagalTriggerOptions = ['Needle', 'Pain', 'Standing up', 'Unknown']

const showFaintingFollowups = computed(
  () =>
    localFormData.value.section_1_client_questionnaire?.H_iv_access_procedure_tolerance
      ?.history_fainting_needles === 'Yes',
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
  emitUpdate()
}

function handleFaintingChange() {
  const value =
    localFormData.value.section_1_client_questionnaire.H_iv_access_procedure_tolerance
      .history_fainting_needles
  if (value !== 'Yes') {
    localFormData.value.section_1_client_questionnaire.H_iv_access_procedure_tolerance.fainting_frequency =
      ''
    localFormData.value.section_1_client_questionnaire.H_iv_access_procedure_tolerance.fainting_last_occurred =
      ''
  }
  emitUpdate()
}

function emitUpdate() {
  emit('update:formData', localFormData.value)
  emit('update')
}
</script>
