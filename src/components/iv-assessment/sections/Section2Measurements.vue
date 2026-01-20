<template>
  <q-card flat bordered class="q-pa-md q-mb-md shadow-1">
    <q-card-section class="q-pa-none q-mb-md">
      <div class="row items-center">
        <q-icon name="monitor_heart" color="primary" size="24px" class="q-mr-sm" />
        <h3 class="text-subtitle1 text-weight-bold q-my-none">
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
