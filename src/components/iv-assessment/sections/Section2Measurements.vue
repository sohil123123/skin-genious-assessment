<template>
  <q-card flat bordered class="q-pa-md q-mb-md shadow-1">
    <q-card-section class="q-pa-none q-mb-md">
      <div class="row items-center">
        <q-icon name="monitor_heart" color="primary" size="24px" class="q-mr-sm" />
        <h3 class="text-subtitle1 text-weight-bold q-mb-none">
          SECTION 2: Machine-Derived Objective Inputs
        </h3>
      </div>
      <q-separator class="q-mt-sm" />
    </q-card-section>

    <q-tabs
      v-model="activeDeviceTab"
      dense
      class="text-grey-7"
      active-color="primary"
      indicator-color="primary"
      align="justify"
      narrow-indicator
    >
      <q-tab name="bp" icon="favorite" label="BP Monitor" />
      <q-tab name="pox" icon="monitor_heart" label="Pulse Oximeter" />
      <q-tab name="hrv" icon="track_changes" label="HRV Device" />
      <q-tab name="irt" icon="thermostat" label="Infrared Thermometer" />
      <q-tab name="bca" icon="accessibility" label="Body Composition" />
      <q-tab name="grip" icon="fitness_center" label="Grip Dynamometer" />
      <q-tab name="sys" icon="biotech" label="Systemic" />
    </q-tabs>

    <q-tab-panels v-model="activeDeviceTab" animated class="q-mt-md">
      <!-- BP Monitor -->
      <q-tab-panel name="bp">
        <h4 class="text-subtitle1 text-weight-bold q-mb-md">1. Blood Pressure Monitor</h4>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                localFormData.section_2_machine_objective_inputs.blood_pressure_monitor
                  .systolic_mmhg
              "
              type="number"
              label="Systolic (mmHg) *"
              outlined
              dense
              :rules="[
                (val) => (val !== null && val !== '') || 'Required',
                (val) => (val >= 0 && val <= 300) || 'Must be 0-300',
              ]"
              @update:model-value="emitUpdate"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                localFormData.section_2_machine_objective_inputs.blood_pressure_monitor
                  .diastolic_mmhg
              "
              type="number"
              label="Diastolic (mmHg) *"
              outlined
              dense
              :rules="[
                (val) => (val !== null && val !== '') || 'Required',
                (val) => (val >= 0 && val <= 200) || 'Must be 0-200',
              ]"
              @update:model-value="emitUpdate"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                localFormData.section_2_machine_objective_inputs.blood_pressure_monitor.pulse_bpm
              "
              type="number"
              label="Pulse (bpm) *"
              outlined
              dense
              :rules="[
                (val) => (val !== null && val !== '') || 'Required',
                (val) => (val >= 0 && val <= 250) || 'Must be 0-250',
              ]"
              @update:model-value="emitUpdate"
            />
          </div>
        </div>
      </q-tab-panel>

      <!-- Pulse Oximeter -->
      <q-tab-panel name="pox">
        <h4 class="text-subtitle1 text-weight-bold q-mb-md">
          2. Pulse Oximeter (with Perfusion Index)
        </h4>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                localFormData.section_2_machine_objective_inputs.pulse_oximeter_with_pi.spo2_percent
              "
              type="number"
              step="0.1"
              label="SpO₂ (%) *"
              outlined
              dense
              :rules="[
                (val) => (val !== null && val !== '') || 'Required',
                (val) => (val >= 0 && val <= 100) || 'Must be 0-100',
              ]"
              @update:model-value="emitUpdate"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                localFormData.section_2_machine_objective_inputs.pulse_oximeter_with_pi.pulse_bpm
              "
              type="number"
              label="Pulse (bpm) *"
              outlined
              dense
              :rules="[
                (val) => (val !== null && val !== '') || 'Required',
                (val) => (val >= 0 && val <= 250) || 'Must be 0-250',
              ]"
              @update:model-value="emitUpdate"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                localFormData.section_2_machine_objective_inputs.pulse_oximeter_with_pi
                  .perfusion_index
              "
              type="number"
              step="0.01"
              label="Perfusion Index *"
              outlined
              dense
              :rules="[
                (val) => (val !== null && val !== '') || 'Required',
                (val) => (val >= 0 && val <= 30) || 'Must be 0-30',
              ]"
              @update:model-value="emitUpdate"
            />
          </div>
        </div>
      </q-tab-panel>

      <!-- HRV Device -->
      <q-tab-panel name="hrv">
        <h4 class="text-subtitle1 text-weight-bold q-mb-md">3. HRV Measurement Device</h4>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                localFormData.section_2_machine_objective_inputs.hrv_measurement_device
                  .rmssd_or_tw_ms
              "
              type="number"
              step="0.1"
              label="RMSSD / TW (ms) *"
              outlined
              dense
              :rules="[
                (val) => (val !== null && val !== '') || 'Required',
                (val) => (val >= 0 && val <= 500) || 'Must be 0-500 ms',
              ]"
              @update:model-value="emitUpdate"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                localFormData.section_2_machine_objective_inputs.hrv_measurement_device
                  .resting_heart_rate_bpm
              "
              type="number"
              label="Resting heart rate (bpm) *"
              outlined
              dense
              :rules="[
                (val) => (val !== null && val !== '') || 'Required',
                (val) => (val >= 0 && val <= 250) || 'Must be 0-250',
              ]"
              @update:model-value="emitUpdate"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                localFormData.section_2_machine_objective_inputs.hrv_measurement_device
                  .measurement_duration_minutes
              "
              type="number"
              step="0.1"
              label="Measurement duration (minutes) *"
              outlined
              dense
              :rules="[
                (val) => (val !== null && val !== '') || 'Required',
                (val) => (val >= 0.1 && val <= 60) || 'Must be 0.1-60 minutes',
              ]"
              @update:model-value="emitUpdate"
            />
          </div>
        </div>
      </q-tab-panel>

      <!-- Infrared Thermometer -->
      <q-tab-panel name="irt">
        <h4 class="text-subtitle1 text-weight-bold q-mb-md">
          4. Infrared Skin Thermometer (3-point facial)
        </h4>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                localFormData.section_2_machine_objective_inputs.infrared_skin_thermometer_3_point
                  .forehead_c
              "
              type="number"
              step="0.1"
              label="Forehead temperature (°C) *"
              outlined
              dense
              :rules="[
                (val) => (val !== null && val !== '') || 'Required',
                (val) => (val >= 20 && val <= 45) || 'Must be 20-45°C',
              ]"
              @update:model-value="emitUpdate"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                localFormData.section_2_machine_objective_inputs.infrared_skin_thermometer_3_point
                  .left_cheek_c
              "
              type="number"
              step="0.1"
              label="Left cheek temperature (°C) *"
              outlined
              dense
              :rules="[
                (val) => (val !== null && val !== '') || 'Required',
                (val) => (val >= 20 && val <= 45) || 'Must be 20-45°C',
              ]"
              @update:model-value="emitUpdate"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                localFormData.section_2_machine_objective_inputs.infrared_skin_thermometer_3_point
                  .right_cheek_c
              "
              type="number"
              step="0.1"
              label="Right cheek temperature (°C) *"
              outlined
              dense
              :rules="[
                (val) => (val !== null && val !== '') || 'Required',
                (val) => (val >= 20 && val <= 45) || 'Must be 20-45°C',
              ]"
              @update:model-value="emitUpdate"
            />
          </div>
        </div>
      </q-tab-panel>

      <!-- Body Composition -->
      <q-tab-panel name="bca">
        <h4 class="text-subtitle1 text-weight-bold q-mb-md">
          5. Body Composition Analyzer (8-electrode)
        </h4>

        <!-- Basic measurements -->
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                localFormData.section_2_machine_objective_inputs
                  .body_composition_analyzer_8_electrode.body_weight_kg
              "
              type="number"
              step="0.1"
              label="Body weight (kg) *"
              outlined
              dense
              :rules="[
                (val) => (val !== null && val !== '') || 'Required',
                (val) => (val >= 0 && val <= 500) || 'Must be 0-500',
              ]"
              @update:model-value="emitUpdate"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                localFormData.section_2_machine_objective_inputs
                  .body_composition_analyzer_8_electrode.height_cm
              "
              type="number"
              step="0.1"
              label="Height (cm) *"
              outlined
              dense
              :rules="[
                (val) => (val !== null && val !== '') || 'Required',
                (val) => (val >= 0 && val <= 250) || 'Must be 0-250',
              ]"
              @update:model-value="emitUpdate"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                localFormData.section_2_machine_objective_inputs
                  .body_composition_analyzer_8_electrode.bmi
              "
              type="number"
              step="0.1"
              label="BMI *"
              outlined
              dense
              :rules="[
                (val) => (val !== null && val !== '') || 'Required',
                (val) => (val >= 0 && val <= 100) || 'Must be 0-100',
              ]"
              @update:model-value="emitUpdate"
            />
          </div>
        </div>

        <!-- Advanced measurements -->
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 col-md-4">
            <div class="row q-col-gutter-sm">
              <div class="col-8">
                <q-input
                  v-model.number="
                    localFormData.section_2_machine_objective_inputs
                      .body_composition_analyzer_8_electrode.total_body_water.value
                  "
                  type="number"
                  step="0.1"
                  label="Total body water *"
                  outlined
                  dense
                  :rules="[(val) => (val !== null && val !== '') || 'Required']"
                  @update:model-value="emitUpdate"
                />
              </div>
              <div class="col-4">
                <q-select
                  v-model="
                    localFormData.section_2_machine_objective_inputs
                      .body_composition_analyzer_8_electrode.total_body_water.unit
                  "
                  :options="['%', 'Liters']"
                  label="Unit"
                  outlined
                  dense
                  @update:model-value="emitUpdate"
                />
              </div>
            </div>
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                localFormData.section_2_machine_objective_inputs
                  .body_composition_analyzer_8_electrode.body_fat_percentage
              "
              type="number"
              step="0.1"
              label="Body fat percentage (%) *"
              outlined
              dense
              :rules="[
                (val) => (val !== null && val !== '') || 'Required',
                (val) => (val >= 0 && val <= 100) || 'Must be 0-100',
              ]"
              @update:model-value="emitUpdate"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                localFormData.section_2_machine_objective_inputs
                  .body_composition_analyzer_8_electrode.lean_muscle_mass_kg
              "
              type="number"
              step="0.1"
              label="Lean / muscle mass (kg) *"
              outlined
              dense
              :rules="[
                (val) => (val !== null && val !== '') || 'Required',
                (val) => (val >= 0 && val <= 300) || 'Must be 0-300',
              ]"
              @update:model-value="emitUpdate"
            />
          </div>
        </div>

        <!-- Additional measurements -->
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                localFormData.section_2_machine_objective_inputs
                  .body_composition_analyzer_8_electrode.visceral_fat_kg
              "
              type="number"
              step="0.1"
              label="Visceral fat (Kg) *"
              outlined
              dense
              :rules="[
                (val) => (val !== null && val !== '') || 'Required',
                (val) => (val >= 0 && val <= 100) || 'Must be 0-100',
              ]"
              @update:model-value="emitUpdate"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                localFormData.section_2_machine_objective_inputs
                  .body_composition_analyzer_8_electrode.basal_metabolic_rate_optional
              "
              type="number"
              step="1"
              label="Basal metabolic rate (optional)"
              outlined
              dense
              placeholder="Optional"
              @update:model-value="emitUpdate"
            />
          </div>
        </div>
      </q-tab-panel>

      <!-- Grip Dynamometer -->
      <q-tab-panel name="grip">
        <h4 class="text-subtitle1 text-weight-bold q-mb-md">6. Hand Grip Dynamometer</h4>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                localFormData.section_2_machine_objective_inputs.hand_grip_dynamometer
                  .dominant_hand_grip_strength_kg
              "
              type="number"
              step="0.1"
              label="Dominant hand grip strength (kg) *"
              outlined
              dense
              :rules="[
                (val) => (val !== null && val !== '') || 'Required',
                (val) => (val >= 0 && val <= 200) || 'Must be 0-200',
              ]"
              @update:model-value="emitUpdate"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                localFormData.section_2_machine_objective_inputs.hand_grip_dynamometer
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
          <!-- <div class="col-12 col-md-4">
            <q-input
              v-model="
                localFormData.section_2_machine_objective_inputs.hand_grip_dynamometer
                  .age_sex_adjusted_percentile_engine_derived
              "
              label="Age- & sex-adjusted percentile (engine-derived)"
              readonly
              outlined
              dense
              placeholder="Calculated by engine"
            />
          </div> -->
        </div>
      </q-tab-panel>

      <!-- Systemic Measurements -->
      <q-tab-panel name="sys">
        <h4 class="text-subtitle1 text-weight-bold q-mb-md">7. Optional Systemic Measurements</h4>

        <!-- Basic systemic -->
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                localFormData.section_2_machine_objective_inputs.optional_systemic_measurements
                  .systemic_body_temperature_c_optional
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
                localFormData.section_2_machine_objective_inputs.optional_systemic_measurements
                  .respiratory_rate_bpm_optional
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
              <h6 class="text-subtitle2 q-mb-sm">Seated (optional)</h6>
              <div class="row q-col-gutter-sm">
                <div class="col-4">
                  <q-input
                    v-model.number="
                      localFormData.section_2_machine_objective_inputs
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
                      localFormData.section_2_machine_objective_inputs
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
                      localFormData.section_2_machine_objective_inputs
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
              <h6 class="text-subtitle2 q-mb-sm">Standing (optional)</h6>
              <div class="row q-col-gutter-sm">
                <div class="col-4">
                  <q-input
                    v-model.number="
                      localFormData.section_2_machine_objective_inputs
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
                      localFormData.section_2_machine_objective_inputs
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
                      localFormData.section_2_machine_objective_inputs
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
                localFormData.section_2_machine_objective_inputs.optional_systemic_measurements
                  .orthostatic_vitals_optional.time_between_positions_minutes_optional
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

const activeDeviceTab = ref('bp')

// Create local reactive copy
const localFormData = ref(props.formData)

function emitUpdate() {
  emit('update:formData', localFormData.value)
  emit('update')
}
</script>
