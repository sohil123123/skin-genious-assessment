<template>
  <q-card flat bordered class="q-pa-md q-mb-md shadow-1">
    <q-card-section class="q-pa-none q-mb-md">
      <div class="row items-center">
        <q-icon name="biotech" color="primary" size="24px" class="q-mr-sm" />
        <h3 class="text-subtitle1 text-weight-bold q-my-none">Dermatological AI Inputs</h3>
      </div>
      <q-separator class="q-mt-sm" />
    </q-card-section>

    <!-- AI Scores -->
    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-4">
        <q-input
          v-model.number="
            localFormData.section_3_dermatological_ai_inputs.oxidative_stress_score_oss
          "
          type="number"
          step="0.1"
          label="Oxidative Stress Score (OSS) *"
          outlined
          dense
          :rules="[
            (val) => (val !== null && val !== '') || 'Required',
            (val) => (val >= 0 && val <= 1000) || 'Must be 0-1000',
          ]"
          @update:model-value="emitUpdate"
        />
      </div>
      <div class="col-12 col-md-4">
        <q-input
          v-model.number="
            localFormData.section_3_dermatological_ai_inputs.glycation_metabolic_score_gms
          "
          type="number"
          step="0.1"
          label="Glycation / Metabolic Score (GMS) *"
          outlined
          dense
          :rules="[
            (val) => (val !== null && val !== '') || 'Required',
            (val) => (val >= 0 && val <= 1000) || 'Must be 0-1000',
          ]"
          @update:model-value="emitUpdate"
        />
      </div>
      <div class="col-12 col-md-4">
        <q-input
          v-model.number="
            localFormData.section_3_dermatological_ai_inputs.vascularity_inflammation_index_mvi
          "
          type="number"
          step="0.1"
          label="Vascularity / Inflammation Index (MVI) *"
          outlined
          dense
          :rules="[
            (val) => (val !== null && val !== '') || 'Required',
            (val) => (val >= 0 && val <= 1000) || 'Must be 0-1000',
          ]"
          @update:model-value="emitUpdate"
        />
      </div>
    </div>

    <div class="row q-col-gutter-md q-mt-md">
      <!-- <div class="col-12 col-md-6">
        <q-input
          v-model.number="
            localFormData.section_3_dermatological_ai_inputs.pigment_instability_index_pii
          "
          type="number"
          step="0.1"
          label="Pigment Instability Index (PII) *"
          outlined
          dense
          :rules="[
            (val) => (val !== null && val !== '') || 'Required',
            (val) => (val >= 0 && val <= 1000) || 'Must be 0-1000',
          ]"
          @update:model-value="emitUpdate"
        />
      </div> -->
      <div class="col-12 col-md-4">
        <q-input
          v-model.number="
            localFormData.section_3_dermatological_ai_inputs.barrier_hydration_stress_score_bhs
          "
          type="number"
          step="0.1"
          label="Barrier Hydration Stress Score (BHS) *"
          outlined
          dense
          :rules="[
            (val) => (val !== null && val !== '') || 'Required',
            (val) => (val >= 0 && val <= 1000) || 'Must be 0-1000',
          ]"
          @update:model-value="emitUpdate"
        />
      </div>
    </div>

    <div class="text-caption text-grey-7 q-mt-md">
      <q-icon name="info" size="xs" class="q-mr-xs" />
      These scores are typically imported from skin analysis AI systems
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

// Create local reactive copy
const localFormData = ref(props.formData)

function emitUpdate() {
  emit('update:formData', localFormData.value)
  emit('update')
}
</script>
