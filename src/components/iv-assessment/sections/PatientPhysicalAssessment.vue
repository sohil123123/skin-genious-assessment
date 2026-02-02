<template>
  <q-card flat bordered class="q-pa-md q-mb-md shadow-1">
    <q-card-section class="q-pa-none q-mb-md">
      <div class="row items-center">
        <q-icon name="monitor_heart" color="primary" size="24px" class="q-mr-sm" />
        <h3 class="text-subtitle1 text-weight-bold q-my-none">Machine-Derived Objective Inputs</h3>
      </div>
      <q-separator class="q-mt-sm" />
    </q-card-section>

    <q-tabs
      v-model="activeDeviceTab"
      dense
      class="text-grey-7"
      active-color="primary"
      align="justify"
      narrow-indicator
    >
      <q-tab
        name="bca"
        icon="accessibility"
        label="Body Composition"
        :class="{
          'text-negative':
            v.section_2_machine_objective_inputs_part_2.body_composition_analyzer_8_electrode
              .body_weight_kg.$error ||
            v.section_2_machine_objective_inputs_part_2.body_composition_analyzer_8_electrode
              .height_cm.$error ||
            v.section_2_machine_objective_inputs_part_2.body_composition_analyzer_8_electrode.bmi
              .$error ||
            v.section_2_machine_objective_inputs_part_2.body_composition_analyzer_8_electrode
              .total_body_water.$error ||
            v.section_2_machine_objective_inputs_part_2.body_composition_analyzer_8_electrode
              .body_fat_percentage.$error ||
            v.section_2_machine_objective_inputs_part_2.body_composition_analyzer_8_electrode
              .lean_muscle_mass_kg.$error ||
            v.section_2_machine_objective_inputs_part_2.body_composition_analyzer_8_electrode
              .visceral_fat_kg.$error,
        }"
      />
      <q-tab
        name="grip"
        icon="fitness_center"
        label="Grip Dynamometer"
        :class="{
          'text-negative':
            v.section_2_machine_objective_inputs_part_2.hand_grip_dynamometer
              .dominant_hand_grip_strength_kg.$error,
        }"
      />
      <q-tab name="sys" icon="biotech" label="Systemic" />
    </q-tabs>

    <q-tab-panels v-model="activeDeviceTab" animated class="q-mt-md">
      <!-- Body Composition -->
      <q-tab-panel name="bca">
        <h4 class="text-subtitle1 text-weight-bold q-mb-md">
          1. Body Composition Analyzer (8-electrode)
        </h4>

        <!-- Basic measurements -->
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                localFormData.section_2_machine_objective_inputs_part_2
                  .body_composition_analyzer_8_electrode.body_weight_kg
              "
              type="number"
              step="0.1"
              label="Body weight (kg) *"
              outlined
              dense
              :error="
                v.section_2_machine_objective_inputs_part_2.body_composition_analyzer_8_electrode
                  .body_weight_kg.$error
              "
              @update:model-value="emitUpdate"
            >
              <template v-slot:error> Please enter your body weight </template>
            </q-input>
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                localFormData.section_2_machine_objective_inputs_part_2
                  .body_composition_analyzer_8_electrode.height_cm
              "
              type="number"
              step="0.1"
              label="Height (cm) *"
              outlined
              dense
              :error="
                v.section_2_machine_objective_inputs_part_2.body_composition_analyzer_8_electrode
                  .height_cm.$error
              "
              @update:model-value="emitUpdate"
            >
              <template v-slot:error> Please enter your height </template>
            </q-input>
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                localFormData.section_2_machine_objective_inputs_part_2
                  .body_composition_analyzer_8_electrode.bmi
              "
              type="number"
              step="0.1"
              label="BMI *"
              outlined
              dense
              :error="
                v.section_2_machine_objective_inputs_part_2.body_composition_analyzer_8_electrode
                  .bmi.$error
              "
              @update:model-value="emitUpdate"
            >
              <template v-slot:error> Please enter your BMI </template>
            </q-input>
          </div>
        </div>

        <!-- Advanced measurements -->
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 col-md-4">
            <div class="row q-col-gutter-sm">
              <div class="col-12">
                <q-input
                  v-model.number="
                    localFormData.section_2_machine_objective_inputs_part_2
                      .body_composition_analyzer_8_electrode.total_body_water
                  "
                  type="number"
                  step="0.1"
                  label="Total body water (%) *"
                  outlined
                  dense
                  :error="
                    v.section_2_machine_objective_inputs_part_2
                      .body_composition_analyzer_8_electrode.total_body_water.$error
                  "
                  @update:model-value="emitUpdate"
                >
                  <template v-slot:error> Please enter your total body water </template>
                </q-input>
              </div>
            </div>
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                localFormData.section_2_machine_objective_inputs_part_2
                  .body_composition_analyzer_8_electrode.body_fat_percentage
              "
              type="number"
              step="0.1"
              label="Body fat percentage (%) *"
              outlined
              dense
              :error="
                v.section_2_machine_objective_inputs_part_2.body_composition_analyzer_8_electrode
                  .body_fat_percentage.$error
              "
              @update:model-value="emitUpdate"
            >
              <template v-slot:error> Please enter your body fat percentage </template>
            </q-input>
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                localFormData.section_2_machine_objective_inputs_part_2
                  .body_composition_analyzer_8_electrode.lean_muscle_mass_kg
              "
              type="number"
              step="0.1"
              label="Lean / muscle mass (kg) *"
              outlined
              dense
              :error="
                v.section_2_machine_objective_inputs_part_2.body_composition_analyzer_8_electrode
                  .lean_muscle_mass_kg.$error
              "
              @update:model-value="emitUpdate"
            >
              <template v-slot:error> Please enter your lean / muscle mass </template>
            </q-input>
          </div>
        </div>

        <!-- Additional measurements -->
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                localFormData.section_2_machine_objective_inputs_part_2
                  .body_composition_analyzer_8_electrode.visceral_fat_kg
              "
              type="number"
              step="0.1"
              label="Visceral fat (Kg) *"
              outlined
              dense
              :error="
                v.section_2_machine_objective_inputs_part_2.body_composition_analyzer_8_electrode
                  .visceral_fat_kg.$error
              "
              @update:model-value="emitUpdate"
            >
              <template v-slot:error> Please enter your visceral fat </template>
            </q-input>
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                localFormData.section_2_machine_objective_inputs_part_2
                  .body_composition_analyzer_8_electrode.basal_metabolic_rate_optional
              "
              type="number"
              step="1"
              label="Basal metabolic rate (optional)"
              outlined
              dense
              placeholder="Optional"
              @update:model-value="emitUpdate"
            >
              <template v-slot:error> Please enter your basal metabolic rate </template>
            </q-input>
          </div>
        </div>
      </q-tab-panel>

      <!-- Grip Dynamometer -->
      <q-tab-panel name="grip">
        <h4 class="text-subtitle1 text-weight-bold q-mb-md">2. Hand Grip Dynamometer</h4>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                localFormData.section_2_machine_objective_inputs_part_2.hand_grip_dynamometer
                  .dominant_hand_grip_strength_kg
              "
              type="number"
              step="0.1"
              label="Dominant hand grip strength (kg) *"
              outlined
              dense
              :error="
                v.section_2_machine_objective_inputs_part_2.hand_grip_dynamometer
                  .dominant_hand_grip_strength_kg.$error
              "
              @update:model-value="emitUpdate"
            >
              <template v-slot:error> Please enter your dominant hand grip strength </template>
            </q-input>
          </div>
          <div class="col-12 col-md-6">
            <q-input
              v-model.number="
                localFormData.section_2_machine_objective_inputs_part_2.hand_grip_dynamometer
                  .non_dominant_hand_grip_strength_kg_optional
              "
              type="number"
              step="0.1"
              label="Non-dominant hand grip strength (kg) (optional)"
              outlined
              dense
              :rules="[
                (val) => val === null || val === '' || (val >= 0 && val <= 200) || 'Must be 0-200',
              ]"
              @update:model-value="emitUpdate"
            />
          </div>
        </div>
      </q-tab-panel>

      <!-- Systemic Measurements -->
      <q-tab-panel name="sys">
        <h4 class="text-subtitle1 text-weight-bold q-mb-md">3. Optional Systemic Measurements</h4>

        <!-- Basic systemic -->
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                localFormData.section_2_machine_objective_inputs_part_2
                  .optional_systemic_measurements.systemic_body_temperature_c_optional
              "
              type="number"
              step="0.1"
              label="Systemic body temperature (°C)"
              outlined
              dense
              :rules="[
                (val) =>
                  val === null || val === '' || (val >= 20 && val <= 45) || 'Must be 20-45°C',
              ]"
              @update:model-value="emitUpdate"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                localFormData.section_2_machine_objective_inputs_part_2
                  .optional_systemic_measurements.respiratory_rate_bpm_optional
              "
              type="number"
              label="Respiratory rate (breaths per minute)"
              outlined
              dense
              :rules="[
                (val) => val === null || val === '' || (val >= 0 && val <= 80) || 'Must be 0-80',
              ]"
              @update:model-value="emitUpdate"
            />
          </div>
        </div>

        <!-- Orthostatic vitals -->
        <h5 class="text-subtitle2 q-mb-md">Orthostatic vitals (optional)</h5>
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 col-md-6">
            <q-card flat bordered class="q-pa-sm">
              <h6 class="text-subtitle2 q-mb-sm q-mt-sm">Seated (optional)</h6>
              <div class="row q-col-gutter-sm">
                <div class="col-4">
                  <q-input
                    v-model.number="
                      localFormData.section_2_machine_objective_inputs_part_2
                        .optional_systemic_measurements.orthostatic_vitals_optional.seated_optional
                        .systolic_mmhg
                    "
                    type="number"
                    label="BP Sys"
                    outlined
                    dense
                    @update:model-value="emitUpdate"
                  />
                </div>
                <div class="col-4">
                  <q-input
                    v-model.number="
                      localFormData.section_2_machine_objective_inputs_part_2
                        .optional_systemic_measurements.orthostatic_vitals_optional.seated_optional
                        .diastolic_mmhg
                    "
                    type="number"
                    label="BP Dia"
                    outlined
                    dense
                    @update:model-value="emitUpdate"
                  />
                </div>
                <div class="col-4">
                  <q-input
                    v-model.number="
                      localFormData.section_2_machine_objective_inputs_part_2
                        .optional_systemic_measurements.orthostatic_vitals_optional.seated_optional
                        .heart_rate_bpm
                    "
                    type="number"
                    label="HR"
                    outlined
                    dense
                    @update:model-value="emitUpdate"
                  />
                </div>
              </div>
            </q-card>
          </div>
          <div class="col-12 col-md-6">
            <q-card flat bordered class="q-pa-sm">
              <h6 class="text-subtitle2 q-mb-sm q-mt-sm">Standing (optional)</h6>
              <div class="row q-col-gutter-sm">
                <div class="col-4">
                  <q-input
                    v-model.number="
                      localFormData.section_2_machine_objective_inputs_part_2
                        .optional_systemic_measurements.orthostatic_vitals_optional
                        .standing_optional.systolic_mmhg
                    "
                    type="number"
                    label="BP Sys"
                    outlined
                    dense
                    @update:model-value="emitUpdate"
                  />
                </div>
                <div class="col-4">
                  <q-input
                    v-model.number="
                      localFormData.section_2_machine_objective_inputs_part_2
                        .optional_systemic_measurements.orthostatic_vitals_optional
                        .standing_optional.diastolic_mmhg
                    "
                    type="number"
                    label="BP Dia"
                    outlined
                    dense
                    @update:model-value="emitUpdate"
                  />
                </div>
                <div class="col-4">
                  <q-input
                    v-model.number="
                      localFormData.section_2_machine_objective_inputs_part_2
                        .optional_systemic_measurements.orthostatic_vitals_optional
                        .standing_optional.heart_rate_bpm
                    "
                    type="number"
                    label="HR"
                    outlined
                    dense
                    @update:model-value="emitUpdate"
                  />
                </div>
              </div>
            </q-card>
          </div>
        </div>

        <!-- Time between positions -->
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-input
              v-model.number="
                localFormData.section_2_machine_objective_inputs_part_2
                  .optional_systemic_measurements.orthostatic_vitals_optional
                  .time_between_positions_minutes_optional
              "
              type="number"
              step="0.1"
              label="Time between positions (minutes) (optional)"
              outlined
              dense
              @update:model-value="emitUpdate"
            />
          </div>
        </div>
      </q-tab-panel>
    </q-tab-panels>
  </q-card>

  <Section3Dermatology v-model:formData="localFormData" :v="v" @update="emitUpdate" />
</template>

<script setup>
import { ref, watch } from 'vue'
import Section3Dermatology from 'src/components/iv-assessment/sections/Section3Dermatology.vue'

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

const emit = defineEmits(['update'])

const activeDeviceTab = ref('bca')

// Create local reactive copy
const localFormData = ref(props.formData)

watch(
  () => props.formData,
  (newVal) => {
    localFormData.value = newVal
  },
  { deep: true },
)

function emitUpdate() {
  emit('update', localFormData.value)
}
</script>
