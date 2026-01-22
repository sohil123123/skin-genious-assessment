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
          :error="v.section_3_dermatological_ai_inputs.oxidative_stress_score_oss.$error"
          @update:model-value="emitUpdate"
        >
          <template v-slot:error> Please enter your oxidative stress score </template>
        </q-input>
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
          :error="v.section_3_dermatological_ai_inputs.glycation_metabolic_score_gms.$error"
          @update:model-value="emitUpdate"
        >
          <template v-slot:error> Please enter your glycation / metabolic score </template>
        </q-input>
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
          :error="v.section_3_dermatological_ai_inputs.vascularity_inflammation_index_mvi.$error"
          @update:model-value="emitUpdate"
        >
          <template v-slot:error> Please enter your vascularity / inflammation index </template>
        </q-input>
      </div>
    </div>

    <div class="row q-col-gutter-md q-mt-sm">
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
          :error="v.section_3_dermatological_ai_inputs.barrier_hydration_stress_score_bhs.$error"
          @update:model-value="emitUpdate"
        >
          <template v-slot:error> Please enter your barrier hydration stress score </template>
        </q-input>
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
  v: {
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
