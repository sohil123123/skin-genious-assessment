<template>
  <section>
    <h1 class="lhr-title">Laser prescription</h1>
    <p class="text-grey-7">
      Review the actual machine, clinical evidence and proposed settings before assigning treatment.
    </p>
    <q-banner v-if="draft.machine.is_test_configuration" rounded class="bg-amber-2 q-mb-lg">
      Test machine defaults - not actual treatment limits. Prescription generation is for testing
      only. Replace the machine and protocol below with verified values, turn off test configuration
      and regenerate before transferring to a therapist.
    </q-banner>
    <q-expansion-item
      default-opened
      label="Machine and clinician-approved protocol limits"
      icon="settings"
      class="bg-grey-1 rounded-borders q-mb-lg"
    >
      <q-card flat
        ><q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-select
                v-model="draft.machine.control_profile"
                outlined
                emit-value
                map-options
                :options="[
                  { label: 'Titanium console (matrix selection)', value: 'shr_console' },
                  { label: 'Generic / existing device protocol', value: 'generic' },
                ]"
                label="Machine control profile"
              />
            </div>
            <div class="col-12">
              <q-btn
                flat
                no-caps
                color="primary"
                label="Load photographed SHR test defaults"
                :disable="busy"
                @click="loadShrDefaults"
              />
              <p class="text-caption q-mb-none">
                Replaces this draft's machine fields with labelled test fixtures. Regenerate the
                prescription afterwards.
              </p>
            </div>
            <div v-if="shr" class="col-12">
              <q-banner rounded class="bg-blue-1">
                Photographed SHR screen: 1 J/cm² fluence · 10 kJ energy · 100 cm² grid. Timer readout:
                {{ LHR_CONSOLE_REFERENCE.displayed_time_seconds }} s (not a prescribed duration).
                Available modes: {{ LHR_CONSOLE_REFERENCE.modes.join(' / ') }}. This profile
                uses the approved entries for the installed handpiece. These displayed values do not establish operating limits. Pulse width,
                spot dimensions and contact-cooling temperature are not shown.
              </q-banner>
            </div>
            <div v-if="shr" class="col-12 col-sm-8">
              <q-input
                v-model="draft.machine.wavelengths_label"
                outlined
                label="Combined wavelength label (nm; verify handpiece)"
              />
            </div>
            <div v-if="shr" class="col-12 col-sm-4">
              <q-select
                v-model="draft.machine.body_size"
                outlined
                clearable
                :options="LHR_CONSOLE_REFERENCE.body_sizes"
                label="Patient body-size preset"
              />
            </div>
            <div class="col-12">
              <q-input v-model="draft.machine.name" outlined label="Machine / model / handpiece" />
            </div>
            <div v-for="field in machineFields" :key="field.id" class="col-12 col-sm-6 col-md-4">
              <q-input
                v-model.number="draft.machine[field.id]"
                outlined
                type="number"
                :label="field.label"
                :step="field.step || 'any'"
              />
            </div>
            <div class="col-12">
              <q-input
                v-model="draft.machine.protocol_reference"
                outlined
                type="textarea"
                rows="3"
                :label="shr ? 'Approved protocol reference' : 'Clinician-approved device protocol and phototype-specific limits'"
                hint="For a Titanium clinical proposal, enter the protocol reference configured for this clinic and handpiece."
              />
            </div>
          </div>
          <q-checkbox
            v-model="draft.machine.is_test_configuration"
            label="Test configuration - not for treatment"
            color="amber-9"
            class="q-mt-md"
          />
          <q-btn
            rounded
            unelevated
            color="black"
            no-caps
            class="q-mt-lg"
            :label="
              session.prescription
                ? 'Regenerate prescription from current inputs'
                : 'Generate laser prescription'
            "
            :loading="busy"
            @click="$emit('generate')"
          /> </q-card-section
      ></q-card>
    </q-expansion-item>
    <template v-if="proposal.zones?.length">
      <q-banner v-if="dirty" rounded class="bg-amber-1 q-mb-lg"
        >Patient or machine inputs have changed. Regenerate the prescription before
        approval.</q-banner
      >
      <q-tabs
        v-model="activeZone"
        align="left"
        active-color="black"
        indicator-color="black"
        class="bg-grey-2 q-mb-lg"
        ><q-tab
          v-for="item in proposal.zones"
          :key="item.zone_id"
          :name="item.zone_id"
          :label="zoneName(item.zone_id)"
          no-caps
      /></q-tabs>
      <q-banner v-if="zone?.hold_reason" class="bg-amber-1 q-my-md">{{ zone.hold_reason }}</q-banner>
      <div v-else-if="zone" class="row q-col-gutter-lg">
        <div class="col-12 col-lg-8">
          <q-markup-table flat bordered wrap-cells>
            <thead>
              <tr>
                <th class="text-left">Parameter</th>
                <th>Last session</th>
                <th>Proposed / approved</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="field in settingsFields" :key="field.id">
                <td>{{ field.label }}</td>
                <td class="text-center">
                  {{ lastSettings[field.id] ?? '—' }}
                  {{ lastSettings[field.id] == null ? '' : field.unit }}
                </td>
                <td>
                  <span v-if="zone.candidate_id">{{ zone.settings[field.id] }} {{ field.unit }}</span>
                  <q-input v-else
                    v-model.number="zone.settings[field.id]"
                    dense
                    outlined
                    type="number"
                    step="any"
                    :suffix="field.unit"
                    :aria-label="field.label"
                  />
                </td>
                <td>
                  {{
                    lastSettings[field.id] == null
                      ? 'Starting proposal'
                      : String(lastSettings[field.id]) === String(zone.settings[field.id])
                        ? 'Unchanged'
                        : 'Changed'
                  }}
                </td>
              </tr>
            </tbody>
          </q-markup-table>
          <q-card flat bordered class="q-mt-lg"
            ><q-card-section
              ><h2 class="text-h6 q-mt-none">Why these settings</h2>
              <ol class="q-pl-md">
                <li v-for="item in zone.rationale" :key="item" class="q-mb-sm">{{ item }}</li>
              </ol></q-card-section
            ></q-card
          >
          <q-card flat bordered class="q-mt-lg"
            ><q-card-section
              ><h2 class="text-h6 q-mt-none">Preparation and treatment steps</h2>
              <ul class="q-pl-md">
                <li
                  v-for="item in [...zone.preparation_steps, ...zone.treatment_steps]"
                  :key="item"
                  class="q-mb-sm"
                >
                  {{ item }}
                </li>
              </ul></q-card-section
            ></q-card
          >
        </div>
        <div class="col-12 col-lg-4">
          <q-card flat bordered
            ><q-card-section
              ><h2 class="text-h6 q-mt-none">Safety gates</h2>
              <p v-for="item in zone.safety_gates" :key="item">
                <q-icon name="info_outline" class="q-mr-sm" />{{ item }}
              </p>
              <p class="text-caption text-grey-7">
                A proposal does not authorise treatment. The clinician must review safety concerns,
                confirm settings and approve the required test-patch protocol.
              </p></q-card-section
            ></q-card
          >
          <q-card flat bordered class="q-mt-lg"
            ><q-card-section>
              <h2 class="text-h6 q-mt-none">Clinician sign-off</h2>
              <q-input
                :model-value="actor.name"
                outlined
                readonly
                label="Approving clinician"
                class="q-mb-md"
              />
              <q-input
                v-model="approvalNotes"
                outlined
                type="textarea"
                rows="3"
                label="Safety clearance / override reason"
                hint="Required for safety flags or changes to proposed settings."
                class="q-mb-lg"
              />
              <q-select
                v-model="therapistId"
                :options="therapists"
                option-value="id"
                option-label="name"
                outlined
                emit-value
                map-options
                label="Assign therapist"
                class="q-mb-md"
              />
              <q-checkbox
                v-model="confirmed"
                color="black"
                label="I have reviewed the patient, device protocol, safety flags and all zone settings and approve this prescription"
              />
              <q-btn
                rounded
                unelevated
                no-caps
                color="black"
                label="Approve and transfer to therapist"
                class="full-width q-mt-md"
                :disable="
                  proposal.zones.some(z => z.hold_reason) || !confirmed || !therapistId || dirty || draft.machine.is_test_configuration
                "
                :loading="busy"
                @click="approve"
              /> </q-card-section
          ></q-card>
        </div>
      </div>
    </template>
    <q-btn
      flat
      no-caps
      label="Back to capture and patient answers"
      icon="arrow_back"
      class="q-mt-lg"
      @click="$emit('previous')"
    />
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { LHR_CONSOLE_REFERENCE, LHR_MACHINE_DEFAULTS } from 'src/utils/lhr/machineDefaults'
import { isShrMachine, machineSettingFields } from 'src/utils/lhr/machineSettings'
import { LHR_ZONES } from 'src/utils/lhr/assessment'
const props = defineProps({
  modelValue: { type: Object, required: true },
  session: { type: Object, required: true },
  actor: { type: Object, required: true },
  therapists: { type: Array, default: () => [] },
  previous: { type: Object, default: null },
  busy: Boolean,
  dirty: Boolean,
})
const emit = defineEmits(['generate', 'approve', 'previous'])
const draft = computed(() => props.modelValue)
const proposal = ref({ zones: [] })
const activeZone = ref('')
const approvalNotes = ref('')
const therapistId = ref(null)
const confirmed = ref(false)
watch(
  () => props.session.prescription,
  (value) => {
    proposal.value = value ? JSON.parse(JSON.stringify(value)) : { zones: [] }
    activeZone.value = proposal.value.zones[0]?.zone_id || ''
    confirmed.value = false
  },
  { immediate: true },
)
const zone = computed(() => proposal.value.zones.find((item) => item.zone_id === activeZone.value))
const lastSettings = computed(
  () => props.previous?.zones?.find((item) => item.zone_id === activeZone.value)?.settings || {},
)
function zoneName(id) {
  return LHR_ZONES.find((zone) => zone.id === id)?.label || id
}
function approve() {
  emit('approve', {
    approved_prescription: proposal.value,
    therapist_id: therapistId.value,
    approval_notes: approvalNotes.value,
    settings_confirmed: confirmed.value,
  })
}
const shr = computed(() => isShrMachine(draft.value.machine))
function loadShrDefaults() {
  draft.value.machine = {
    ...LHR_MACHINE_DEFAULTS.machine,
    is_test_configuration: true,
    body_size: null,
  }
  confirmed.value = false
}
const machineFields = computed(() =>
  shr.value
    ? [
        { id: 'min_fluence', label: 'Minimum fluence (J/cm²)' },
        { id: 'max_fluence', label: 'Patient-specific fluence ceiling (J/cm²)' },
        { id: 'min_energy_kj', label: 'Minimum energy per grid (kJ)' },
        { id: 'max_energy_kj', label: 'Maximum energy per grid (kJ)' },
        { id: 'min_grid_cm2', label: 'Minimum grid size (cm²)' },
        { id: 'max_grid_cm2', label: 'Maximum grid size (cm²)' },
      ]
    : [
        { id: 'wavelength_nm', label: 'Wavelength (nm)' },
        { id: 'spot_size_mm', label: 'Spot size (mm)' },
        { id: 'cooling_c', label: 'Contact cooling (°C)' },
        { id: 'min_fluence', label: 'Minimum fluence (J/cm²)' },
        { id: 'max_fluence', label: 'Phototype-specific fluence ceiling (J/cm²)' },
        { id: 'min_pulse_ms', label: 'Minimum pulse width (ms)' },
        { id: 'max_pulse_ms', label: 'Maximum pulse width (ms)' },
      ],
)
const settingsFields = computed(() => machineSettingFields(draft.value.machine,zone.value?.settings))
</script>
