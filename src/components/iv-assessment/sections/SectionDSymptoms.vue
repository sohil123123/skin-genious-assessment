<template>
  <q-card flat bordered class="q-pa-md q-mb-md shadow-1">
    <q-card-section class="q-pa-none q-mb-md">
      <div class="row items-center">
        <q-icon name="sick" color="amber" size="24px" class="q-mr-sm" />
        <h3 class="text-subtitle1 text-weight-bold q-my-none text-amber">D. Symptoms Today</h3>
        <q-badge color="amber" class="q-ml-sm" label="Current Status" />
      </div>
      <q-separator class="q-mt-sm" />
    </q-card-section>

    <!-- Fatigue -->
    <div
      class="q-mb-lg option-group"
      :class="{
        'group--error': v.section_1_client_questionnaire.D_symptoms_today.fatigue.$error,
      }"
    >
      <p
        class="text-weight-medium q-mb-xs"
        :class="{
          'text-negative': v.section_1_client_questionnaire.D_symptoms_today.fatigue.$error,
        }"
      >
        Fatigue *
      </p>
      <div class="row q-gutter-xs q-mb-sm">
        <q-chip
          v-for="item in symptomSeverityOptions"
          :key="item"
          :label="item"
          :text-color="
            item === localFormData.section_1_client_questionnaire.D_symptoms_today.fatigue
              ? 'white'
              : 'dark'
          "
          :color="
            item === localFormData.section_1_client_questionnaire.D_symptoms_today.fatigue
              ? item === 'None'
                ? 'positive'
                : item === 'Mild'
                  ? 'primary'
                  : item === 'Moderate'
                    ? 'warning'
                    : 'negative'
              : 'grey-3'
          "
          size="md"
          clickable
          @click="updateField('section_1_client_questionnaire.D_symptoms_today.fatigue', item)"
        />
      </div>
    </div>

    <!-- Headache -->
    <div
      class="q-mb-lg option-group"
      :class="{
        'group--error': v.section_1_client_questionnaire.D_symptoms_today.headache.$error,
      }"
    >
      <p
        class="text-weight-medium q-mb-xs"
        :class="{
          'text-negative': v.section_1_client_questionnaire.D_symptoms_today.headache.$error,
        }"
      >
        Headache *
      </p>
      <div class="row q-gutter-xs q-mb-sm">
        <q-chip
          v-for="item in symptomSeverityOptions"
          :key="item"
          :label="item"
          :text-color="
            item === localFormData.section_1_client_questionnaire.D_symptoms_today.headache
              ? 'white'
              : 'dark'
          "
          :color="
            item === localFormData.section_1_client_questionnaire.D_symptoms_today.headache
              ? item === 'None'
                ? 'positive'
                : item === 'Mild'
                  ? 'primary'
                  : item === 'Moderate'
                    ? 'warning'
                    : 'negative'
              : 'grey-3'
          "
          size="md"
          clickable
          @click="updateField('section_1_client_questionnaire.D_symptoms_today.headache', item)"
        />
      </div>
    </div>

    <!-- Nausea with vomiting follow-up -->
    <div
      class="q-mb-lg option-group"
      :class="{
        'group--error': v.section_1_client_questionnaire.D_symptoms_today.nausea.$error,
      }"
    >
      <p
        class="text-weight-medium q-mb-xs"
        :class="{
          'text-negative': v.section_1_client_questionnaire.D_symptoms_today.nausea.$error,
        }"
      >
        Nausea *
      </p>
      <div class="row q-gutter-xs q-mb-sm">
        <q-chip
          v-for="item in nauseaTypeOptions"
          :key="item"
          :label="item"
          :text-color="
            item === localFormData.section_1_client_questionnaire.D_symptoms_today.nausea
              ? 'white'
              : 'dark'
          "
          :color="
            item === localFormData.section_1_client_questionnaire.D_symptoms_today.nausea
              ? item === 'None'
                ? 'positive'
                : item === 'Mild'
                  ? 'primary'
                  : item === 'Moderate'
                    ? 'warning'
                    : 'negative'
              : 'grey-3'
          "
          size="md"
          clickable
          @click="updateField('section_1_client_questionnaire.D_symptoms_today.nausea', item)"
        />
      </div>
    </div>

    <!-- Dizziness -->
    <YesNoField
      label="Vomiting today?  *"
      v-model="localFormData.section_1_client_questionnaire.D_symptoms_today.vomiting_if_nausea"
      @update="emitUpdate"
      class="q-mb-lg"
      :error="v.section_1_client_questionnaire.D_symptoms_today.vomiting_if_nausea.$error"
    />

    <!-- Dizziness -->
    <YesNoField
      label="Dizziness on standing *"
      v-model="localFormData.section_1_client_questionnaire.D_symptoms_today.dizziness_on_standing"
      hint="Lightheadedness when getting up from sitting/lying"
      @update="emitUpdate"
      class="q-mb-lg"
      :error="v.section_1_client_questionnaire.D_symptoms_today.dizziness_on_standing.$error"
    />

    <!-- Muscle cramps with type follow-up -->
    <YesNoWithFollowup
      label="Muscle cramps *"
      v-model="localFormData.section_1_client_questionnaire.D_symptoms_today.muscle_cramps"
      followup-label="If cramps: Type *"
      followup-path="section_1_client_questionnaire.D_symptoms_today.muscle_cramps_type_if_yes"
      :form-data="localFormData"
      :followup-options="muscleCrampTypeOptions"
      followup-type="single-select"
      @update="emitUpdate"
      class="q-mb-lg"
      :error="
        v.section_1_client_questionnaire.D_symptoms_today.muscle_cramps.$error ||
        v.section_1_client_questionnaire.D_symptoms_today.muscle_cramps_type_if_yes.$error
      "
    />

    <!-- Palpitations Component -->
    <SymptomsPalpitations v-model="localFormData" :v="v" @update="emitUpdate" class="q-mb-lg" />

    <!-- Swelling with duration follow-up -->
    <YesNoWithFollowup
      label="Swelling or puffiness today *"
      v-model="
        localFormData.section_1_client_questionnaire.D_symptoms_today.swelling_or_puffiness_today
      "
      followup-label="If swelling: New today or chronic? *"
      followup-path="section_1_client_questionnaire.D_symptoms_today.swelling_duration_if_yes"
      :form-data="localFormData"
      :followup-options="swellingDurationOptions"
      followup-type="single-select"
      hint="New swelling may indicate fluid retention"
      @update="emitUpdate"
      class="q-mb-lg"
      :error="
        v.section_1_client_questionnaire.D_symptoms_today.swelling_or_puffiness_today.$error ||
        v.section_1_client_questionnaire.D_symptoms_today.swelling_duration_if_yes.$error
      "
    />

    <!-- Constipation with type follow-up -->
    <YesNoWithFollowup
      label="Constipation or sluggish digestion today *"
      v-model="
        localFormData.section_1_client_questionnaire.D_symptoms_today
          .constipation_or_sluggish_digestion_today
      "
      followup-label="If yes: True constipation OR just sluggishness? *"
      followup-path="section_1_client_questionnaire.D_symptoms_today.constipation_type_if_yes"
      :form-data="localFormData"
      :followup-options="constipationTypeOptions"
      followup-type="single-select"
      @update="emitUpdate"
      :error="
        v.section_1_client_questionnaire.D_symptoms_today.constipation_or_sluggish_digestion_today
          .$error ||
        v.section_1_client_questionnaire.D_symptoms_today.constipation_type_if_yes.$error
      "
    />

    <!-- Brain fog -->
    <YesNoField
      label="Brain fog today?  *"
      v-model="localFormData.section_1_client_questionnaire.D_symptoms_today.brain_fog_today"
      @update="emitUpdate"
      class="q-mb-lg"
      :error="v.section_1_client_questionnaire.D_symptoms_today.brain_fog_today.$error"
    />

    <!-- Shortness of breath today  -->
    <YesNoField
      label="Shortness of breath today?  *"
      v-model="
        localFormData.section_1_client_questionnaire.D_symptoms_today.shortness_of_breath_today
      "
      @update="emitUpdate"
      class="q-mb-lg"
      :error="v.section_1_client_questionnaire.D_symptoms_today.shortness_of_breath_today.$error"
    />
  </q-card>
</template>

<script setup>
import { ref, watch } from 'vue'
import YesNoField from '../partials/YesNoField.vue'
import YesNoWithFollowup from '../partials/YesNoWithFollowup.vue'
import SymptomsPalpitations from '../partials/SymptomsPalpitations.vue'

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

const symptomSeverityOptions = ['None', 'Mild', 'Moderate', 'Severe']
const nauseaTypeOptions = ['None', 'Mild', 'Moderate', 'Severe']
const muscleCrampTypeOptions = ['Leg cramps at night', 'Generalized cramps', 'Exercise-related']
const swellingDurationOptions = ['New today', 'Chronic', 'Unsure']
const constipationTypeOptions = ['True constipation', 'Sluggishness']

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

function emitUpdate() {
  emit('update:formData', localFormData.value)
  emit('update')
}
</script>
