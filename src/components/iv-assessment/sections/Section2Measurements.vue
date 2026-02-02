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
      align="justify"
      narrow-indicator
    >
      <q-tab
        name="bp"
        icon="favorite"
        label="BP Monitor"
        :class="{
          'text-negative':
            v.section_2_machine_objective_inputs_part_1.blood_pressure_monitor.systolic_mmhg
              .$error ||
            v.section_2_machine_objective_inputs_part_1.blood_pressure_monitor.diastolic_mmhg
              .$error ||
            v.section_2_machine_objective_inputs_part_1.blood_pressure_monitor.pulse_bpm.$error,
        }"
      />
      <q-tab
        name="pox"
        icon="monitor_heart"
        label="Pulse Oximeter"
        :class="{
          'text-negative':
            v.section_2_machine_objective_inputs_part_1.pulse_oximeter_with_pi.spo2_percent
              .$error ||
            v.section_2_machine_objective_inputs_part_1.pulse_oximeter_with_pi.pulse_bpm.$error ||
            v.section_2_machine_objective_inputs_part_1.pulse_oximeter_with_pi.perfusion_index
              .$error,
        }"
      />
      <q-tab
        name="hrv"
        icon="track_changes"
        label="HRV Device"
        :class="{
          'text-negative':
            v.section_2_machine_objective_inputs_part_1.hrv_measurement_device.rmssd_or_tw_ms
              .$error ||
            v.section_2_machine_objective_inputs_part_1.hrv_measurement_device
              .resting_heart_rate_bpm.$error ||
            v.section_2_machine_objective_inputs_part_1.hrv_measurement_device
              .measurement_duration_minutes.$error,
        }"
      />
      <q-tab
        name="irt"
        icon="thermostat"
        label="Infrared Thermometer"
        :class="{
          'text-negative':
            v.section_2_machine_objective_inputs_part_1.infrared_skin_thermometer_3_point.forehead_c
              .$error ||
            v.section_2_machine_objective_inputs_part_1.infrared_skin_thermometer_3_point
              .left_cheek_c.$error ||
            v.section_2_machine_objective_inputs_part_1.infrared_skin_thermometer_3_point
              .right_cheek_c.$error,
        }"
      />
    </q-tabs>

    <q-tab-panels v-model="activeDeviceTab" animated class="q-mt-md">
      <!-- BP Monitor -->
      <q-tab-panel name="bp">
        <h4 class="text-subtitle1 text-weight-bold q-mb-md">1. Blood Pressure Monitor</h4>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                localFormData.section_2_machine_objective_inputs_part_1.blood_pressure_monitor
                  .systolic_mmhg
              "
              type="number"
              label="Systolic (mmHg) *"
              outlined
              dense
              :error="
                v.section_2_machine_objective_inputs_part_1.blood_pressure_monitor.systolic_mmhg
                  .$error
              "
              @update:model-value="emitUpdate"
            >
              <template v-slot:error> Please enter your systolic blood pressure </template>
            </q-input>
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                localFormData.section_2_machine_objective_inputs_part_1.blood_pressure_monitor
                  .diastolic_mmhg
              "
              type="number"
              label="Diastolic (mmHg) *"
              outlined
              dense
              :error="
                v.section_2_machine_objective_inputs_part_1.blood_pressure_monitor.diastolic_mmhg
                  .$error
              "
              @update:model-value="emitUpdate"
            >
              <template v-slot:error> Please enter your diastolic blood pressure </template>
            </q-input>
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                localFormData.section_2_machine_objective_inputs_part_1.blood_pressure_monitor
                  .pulse_bpm
              "
              type="number"
              label="Pulse (bpm) *"
              outlined
              dense
              :error="
                v.section_2_machine_objective_inputs_part_1.blood_pressure_monitor.pulse_bpm.$error
              "
              @update:model-value="emitUpdate"
            >
              <template v-slot:error> Please enter your pulse </template>
            </q-input>
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
                localFormData.section_2_machine_objective_inputs_part_1.pulse_oximeter_with_pi
                  .spo2_percent
              "
              type="number"
              step="0.1"
              label="SpO₂ (%) *"
              outlined
              dense
              :error="
                v.section_2_machine_objective_inputs_part_1.pulse_oximeter_with_pi.spo2_percent
                  .$error
              "
              @update:model-value="emitUpdate"
            >
              <template v-slot:error> Please enter your SpO2 </template>
            </q-input>
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                localFormData.section_2_machine_objective_inputs_part_1.pulse_oximeter_with_pi
                  .pulse_bpm
              "
              type="number"
              label="Pulse (bpm) *"
              outlined
              dense
              :error="
                v.section_2_machine_objective_inputs_part_1.pulse_oximeter_with_pi.pulse_bpm.$error
              "
              @update:model-value="emitUpdate"
            >
              <template v-slot:error> Please enter your pulse </template>
            </q-input>
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                localFormData.section_2_machine_objective_inputs_part_1.pulse_oximeter_with_pi
                  .perfusion_index
              "
              type="number"
              step="0.01"
              label="Perfusion Index *"
              outlined
              dense
              :error="
                v.section_2_machine_objective_inputs_part_1.pulse_oximeter_with_pi.perfusion_index
                  .$error
              "
              @update:model-value="emitUpdate"
            >
              <template v-slot:error> Please enter your Perfusion Index </template>
            </q-input>
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
                localFormData.section_2_machine_objective_inputs_part_1.hrv_measurement_device
                  .rmssd_or_tw_ms
              "
              type="number"
              step="0.1"
              label="RMSSD / TW (ms) *"
              outlined
              dense
              :error="
                v.section_2_machine_objective_inputs_part_1.hrv_measurement_device.rmssd_or_tw_ms
                  .$error
              "
              @update:model-value="emitUpdate"
            >
              <template v-slot:error> Please enter your RMSSD / TW </template>
            </q-input>
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                localFormData.section_2_machine_objective_inputs_part_1.hrv_measurement_device
                  .resting_heart_rate_bpm
              "
              type="number"
              label="Resting heart rate (bpm) *"
              outlined
              dense
              :error="
                v.section_2_machine_objective_inputs_part_1.hrv_measurement_device
                  .resting_heart_rate_bpm.$error
              "
              @update:model-value="emitUpdate"
            >
              <template v-slot:error> Please enter your resting heart rate </template>
            </q-input>
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                localFormData.section_2_machine_objective_inputs_part_1.hrv_measurement_device
                  .measurement_duration_minutes
              "
              type="number"
              step="0.1"
              label="Measurement duration (minutes) *"
              outlined
              dense
              :error="
                v.section_2_machine_objective_inputs_part_1.hrv_measurement_device
                  .measurement_duration_minutes.$error
              "
              @update:model-value="emitUpdate"
            >
              <template v-slot:error> Please enter your measurement duration </template>
            </q-input>
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
                localFormData.section_2_machine_objective_inputs_part_1
                  .infrared_skin_thermometer_3_point.forehead_c
              "
              type="number"
              step="0.1"
              label="Forehead temperature (°C) *"
              outlined
              dense
              :error="
                v.section_2_machine_objective_inputs_part_1.infrared_skin_thermometer_3_point
                  .forehead_c.$error
              "
              @update:model-value="emitUpdate"
            >
              <template v-slot:error> Please enter your forehead temperature </template>
            </q-input>
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                localFormData.section_2_machine_objective_inputs_part_1
                  .infrared_skin_thermometer_3_point.left_cheek_c
              "
              type="number"
              step="0.1"
              label="Left cheek temperature (°C) *"
              outlined
              dense
              :error="
                v.section_2_machine_objective_inputs_part_1.infrared_skin_thermometer_3_point
                  .left_cheek_c.$error
              "
              @update:model-value="emitUpdate"
            >
              <template v-slot:error> Please enter your left cheek temperature </template>
            </q-input>
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                localFormData.section_2_machine_objective_inputs_part_1
                  .infrared_skin_thermometer_3_point.right_cheek_c
              "
              type="number"
              step="0.1"
              label="Right cheek temperature (°C) *"
              outlined
              dense
              :error="
                v.section_2_machine_objective_inputs_part_1.infrared_skin_thermometer_3_point
                  .right_cheek_c.$error
              "
              @update:model-value="emitUpdate"
            >
              <template v-slot:error> Please enter your right cheek temperature </template>
            </q-input>
          </div>
        </div>
      </q-tab-panel>
    </q-tab-panels>
  </q-card>
</template>

<script setup>
import { ref, watch } from 'vue'

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

const activeDeviceTab = ref('bp')

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
  emit('update:formData', localFormData.value)
  emit('update')
}
</script>
