<template>
  <q-card flat bordered class="q-pa-md q-mb-md shadow-1">
    <q-card-section class="q-pa-none q-mb-md">
      <div class="row items-center">
        <q-icon name="medication" color="primary" size="24px" class="q-mr-sm" />
        <h3 class="text-subtitle1 text-weight-bold q-mb-none">E. Medications & Supplements</h3>
      </div>
      <q-separator class="q-mt-sm" />
    </q-card-section>

    <!-- Blood Pressure Medications -->
    <YesNoWithFollowup
      label="Blood pressure medications *"
      v-model="
        localFormData.section_1_client_questionnaire.E_medications_supplements
          .blood_pressure_medications
      "
      followup-label="If yes: Taken today? *"
      followup-path="section_1_client_questionnaire.E_medications_supplements.bp_meds_taken_today"
      :form-data="localFormData"
      @update="emitUpdate"
      class="q-mb-lg"
    />

    <!-- Blood Thinners -->
    <YesNoWithFollowup
      label="Blood thinners *"
      v-model="
        localFormData.section_1_client_questionnaire.E_medications_supplements.blood_thinners
      "
      followup-label="If yes: Category *"
      followup-path="section_1_client_questionnaire.E_medications_supplements.blood_thinners_type"
      :form-data="localFormData"
      :followup-options="bloodThinnerOptions"
      followup-type="single-select"
      @update="emitUpdate"
      class="q-mb-lg"
    />

    <!-- Thyroid Medications -->
    <YesNoWithFollowup
      label="Thyroid medications *"
      v-model="
        localFormData.section_1_client_questionnaire.E_medications_supplements.thyroid_medications
      "
      followup-label="If yes: For hypothyroid/hyperthyroid *"
      followup-path="section_1_client_questionnaire.E_medications_supplements.thyroid_meds_type"
      :form-data="localFormData"
      :followup-options="thyroidTypeOptions"
      followup-type="single-select"
      @update="emitUpdate"
      class="q-mb-lg"
    />

    <!-- Diabetes Medications -->
    <YesNoWithFollowup
      label="Diabetes medications *"
      v-model="
        localFormData.section_1_client_questionnaire.E_medications_supplements.diabetes_medications
      "
      followup-label="If yes: Insulin use? *"
      followup-path="section_1_client_questionnaire.E_medications_supplements.diabetes_insulin_use"
      :form-data="localFormData"
      :followup-options="yesNoUnsureOptions"
      followup-type="single-select"
      @update="emitUpdate"
      class="q-mb-lg"
    />

    <!-- Anti-epileptic Medications -->
    <YesNoWithFollowup
      label="Anti-epileptic medications *"
      v-model="
        localFormData.section_1_client_questionnaire.E_medications_supplements
          .anti_epileptic_medications
      "
      followup-label="If yes: Taken regularly (daily)? *"
      followup-path="section_1_client_questionnaire.E_medications_supplements.anti_epileptic_taken_daily"
      :form-data="localFormData"
      @update="emitUpdate"
      class="q-mb-lg"
    />

    <!-- Antibiotics -->
    <YesNoWithFollowup
      label="Currently on antibiotics *"
      v-model="
        localFormData.section_1_client_questionnaire.E_medications_supplements
          .currently_on_antibiotics
      "
      followup-label="If yes: Reason *"
      followup-path="section_1_client_questionnaire.E_medications_supplements.antibiotics_reason"
      :form-data="localFormData"
      :followup-options="antibioticReasonOptions"
      followup-type="single-select"
      @update="handleAntibioticsChange"
      class="q-mb-lg"
    />

    <!-- Additional antibiotic follow-ups -->
    <div v-if="showAntibioticFollowups" class="q-ml-md q-mt-md bg-yellow-1 q-pa-sm rounded-borders">
      <div class="row q-col-gutter-md q-mb-sm">
        <div class="col-12 col-md-6">
          <p class="text-weight-medium text-grey-7 q-mb-xs">Started when *</p>
          <div class="row q-gutter-xs">
            <q-chip
              v-for="item in antibioticStartOptions"
              :key="item"
              :label="item"
              :text-color="
                item ===
                localFormData.section_1_client_questionnaire.E_medications_supplements
                  .antibiotics_started
                  ? 'white'
                  : 'dark'
              "
              :color="
                item ===
                localFormData.section_1_client_questionnaire.E_medications_supplements
                  .antibiotics_started
                  ? 'blue-9'
                  : 'grey-6'
              "
              :square="
                item ===
                localFormData.section_1_client_questionnaire.E_medications_supplements
                  .antibiotics_started
              "
              outline
              clickable
              @click="
                updateField(
                  'section_1_client_questionnaire.E_medications_supplements.antibiotics_started',
                  item,
                )
              "
            />
          </div>
        </div>
        <div class="col-12 col-md-6">
          <p class="text-weight-medium text-grey-7 q-mb-xs">Still symptomatic from infection? *</p>
          <div class="row q-gutter-xs">
            <q-chip
              v-for="item in yesNoOptions"
              :key="item"
              :label="item"
              :text-color="
                item ===
                localFormData.section_1_client_questionnaire.E_medications_supplements
                  .antibiotics_still_symptomatic
                  ? 'white'
                  : 'dark'
              "
              :color="
                item ===
                localFormData.section_1_client_questionnaire.E_medications_supplements
                  .antibiotics_still_symptomatic
                  ? item === 'Yes'
                    ? 'amber'
                    : 'positive'
                  : 'grey-6'
              "
              :square="
                item ===
                localFormData.section_1_client_questionnaire.E_medications_supplements
                  .antibiotics_still_symptomatic
              "
              outline
              clickable
              @click="
                updateField(
                  'section_1_client_questionnaire.E_medications_supplements.antibiotics_still_symptomatic',
                  item,
                )
              "
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Current Supplements -->
    <div class="q-mb-lg">
      <p class="text-weight-medium q-mb-xs">Current supplements *</p>
      <div class="row q-gutter-xs q-mb-sm">
        <q-chip
          v-for="item in supplementOptions"
          :key="item.value"
          :label="item.label"
          :text-color="
            item.value ===
            localFormData.section_1_client_questionnaire.E_medications_supplements
              .current_supplements.selection
              ? 'white'
              : 'dark'
          "
          :color="
            item.value ===
            localFormData.section_1_client_questionnaire.E_medications_supplements
              .current_supplements.selection
              ? 'primary'
              : 'grey-3'
          "
          size="md"
          clickable
          @click="handleSupplementChange(item.value)"
        />
      </div>

      <!-- Supplement follow-ups -->
      <div v-if="showSupplementFollowups" class="q-ml-md q-mt-md">
        <div class="row q-col-gutter-md q-mb-sm">
          <div v-if="showMagnesiumFollowup" class="col-12 col-md-6">
            <p class="text-weight-medium text-grey-7 q-mb-xs">
              Magnesium taken in last 24 hours? *
            </p>
            <div class="row q-gutter-xs">
              <q-chip
                v-for="item in yesNoOptions"
                :key="item"
                :label="item"
                :text-color="
                  item ===
                  localFormData.section_1_client_questionnaire.E_medications_supplements
                    .current_supplements.magnesium_taken_24h
                    ? 'white'
                    : 'dark'
                "
                :color="
                  item ===
                  localFormData.section_1_client_questionnaire.E_medications_supplements
                    .current_supplements.magnesium_taken_24h
                    ? 'blue-9'
                    : 'grey-6'
                "
                :square="
                  item ===
                  localFormData.section_1_client_questionnaire.E_medications_supplements
                    .current_supplements.magnesium_taken_24h
                "
                outline
                clickable
                @click="
                  updateField(
                    'section_1_client_questionnaire.E_medications_supplements.current_supplements.magnesium_taken_24h',
                    item,
                  )
                "
              />
            </div>
          </div>
          <div v-if="showElectrolytesFollowup" class="col-12 col-md-6">
            <p class="text-weight-medium text-grey-7 q-mb-xs">
              Electrolytes taken in last 24 hours? *
            </p>
            <div class="row q-gutter-xs">
              <q-chip
                v-for="item in yesNoOptions"
                :key="item"
                :label="item"
                :text-color="
                  item ===
                  localFormData.section_1_client_questionnaire.E_medications_supplements
                    .current_supplements.electrolytes_taken_24h
                    ? 'white'
                    : 'dark'
                "
                :color="
                  item ===
                  localFormData.section_1_client_questionnaire.E_medications_supplements
                    .current_supplements.electrolytes_taken_24h
                    ? 'blue-9'
                    : 'grey-6'
                "
                :square="
                  item ===
                  localFormData.section_1_client_questionnaire.E_medications_supplements
                    .current_supplements.electrolytes_taken_24h
                "
                outline
                clickable
                @click="
                  updateField(
                    'section_1_client_questionnaire.E_medications_supplements.current_supplements.electrolytes_taken_24h',
                    item,
                  )
                "
              />
            </div>
          </div>
        </div>

        <!-- Other supplement specify -->
        <div v-if="showOtherSupplement" class="q-mt-sm">
          <q-input
            v-model="
              localFormData.section_1_client_questionnaire.E_medications_supplements
                .current_supplements.others_specify_if_selected
            "
            label="Specify other supplements *"
            outlined
            dense
            placeholder="List other supplements"
            @update:model-value="emitUpdate"
          />
        </div>

        <!-- Optional supplement list -->
        <div class="q-mt-sm">
          <q-input
            v-model="
              localFormData.section_1_client_questionnaire.E_medications_supplements
                .current_supplements.list_optional
            "
            label="Supplement list (comma-separated, optional)"
            outlined
            dense
            placeholder="e.g., Vitamin D, Omega-3, Zinc"
            @update:model-value="emitUpdate"
          />
        </div>
      </div>
    </div>
  </q-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import YesNoWithFollowup from '../partials/YesNoWithFollowup.vue'

const props = defineProps({
  formData: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:formData', 'update'])

const yesNoOptions = ['Yes', 'No']
const yesNoUnsureOptions = ['Yes', 'No', 'Unsure']
const bloodThinnerOptions = ['Aspirin', 'Clopidogrel-like', 'Warfarin-like', 'DOAC', 'Unsure']
const thyroidTypeOptions = ['For hypothyroid', 'For hyperthyroid', 'Unsure']
const antibioticReasonOptions = ['Dental', 'Respiratory', 'Skin', 'Urinary', 'Other', 'Unsure']
const antibioticStartOptions = ['Today-2 days', '3-7 days', '>7 days']
const supplementOptions = [
  { label: 'Magnesium', value: 'Magnesium' },
  { label: 'Electrolytes', value: 'Electrolytes' },
  { label: 'Vitamin C', value: 'Vitamin C' },
  { label: 'Others - specify', value: 'Others' },
]

// Computed properties
const showAntibioticFollowups = computed(
  () =>
    localFormData.value.section_1_client_questionnaire?.E_medications_supplements
      ?.currently_on_antibiotics === 'Yes',
)

const showSupplementFollowups = computed(
  () =>
    !!localFormData.value.section_1_client_questionnaire?.E_medications_supplements
      ?.current_supplements?.selection,
)

const showMagnesiumFollowup = computed(
  () =>
    localFormData.value.section_1_client_questionnaire?.E_medications_supplements
      ?.current_supplements?.selection === 'Magnesium',
)

const showElectrolytesFollowup = computed(
  () =>
    localFormData.value.section_1_client_questionnaire?.E_medications_supplements
      ?.current_supplements?.selection === 'Electrolytes',
)

const showOtherSupplement = computed(
  () =>
    localFormData.value.section_1_client_questionnaire?.E_medications_supplements
      ?.current_supplements?.selection === 'Others',
)

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

function handleAntibioticsChange() {
  if (
    localFormData.value.section_1_client_questionnaire.E_medications_supplements
      .currently_on_antibiotics !== 'Yes'
  ) {
    localFormData.value.section_1_client_questionnaire.E_medications_supplements.antibiotics_reason =
      ''
    localFormData.value.section_1_client_questionnaire.E_medications_supplements.antibiotics_started =
      ''
    localFormData.value.section_1_client_questionnaire.E_medications_supplements.antibiotics_still_symptomatic =
      ''
  }
  emitUpdate()
}

function handleSupplementChange(value) {
  localFormData.value.section_1_client_questionnaire.E_medications_supplements.current_supplements.selection =
    value

  // Reset follow-ups if not selected
  if (value !== 'Magnesium') {
    localFormData.value.section_1_client_questionnaire.E_medications_supplements.current_supplements.magnesium_taken_24h =
      ''
  }
  if (value !== 'Electrolytes') {
    localFormData.value.section_1_client_questionnaire.E_medications_supplements.current_supplements.electrolytes_taken_24h =
      ''
  }
  if (value !== 'Others') {
    localFormData.value.section_1_client_questionnaire.E_medications_supplements.current_supplements.others_specify_if_selected =
      ''
  }

  emitUpdate()
}

function emitUpdate() {
  emit('update:formData', localFormData.value)
  emit('update')
}
</script>
