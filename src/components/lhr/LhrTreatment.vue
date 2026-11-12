<template>
  <section>
    <h1 class="lhr-title">LHR treatment</h1>
    <q-banner rounded class="bg-grey-2 q-mb-lg">
      Complete one treatment area at a time using its clinician-approved settings. Safety checks and
      treatment records are saved separately for each area.
    </q-banner>
    <q-stepper
      :model-value="active?.zone_id || '__finished'"
      flat
      alternative-labels
      color="black"
      active-color="black"
      done-color="black"
      :contracted="$q.screen.lt.sm"
      class="q-mb-lg"
    >
      <q-step
        v-for="(step, index) in steps"
        :key="step.zone_id"
        :name="step.zone_id"
        :title="step.label"
        :prefix="index + 1"
        :done="step.status === 'completed'"
        :icon="step.status === 'completed' ? 'check' : 'spa'"
      />
    </q-stepper>
    <div class="text-caption text-grey-7 q-mb-md">
      {{ completedCount }} / {{ steps.length }} areas completed and saved
    </div>
    <template v-if="active">
      <h2 class="text-h5 q-mt-none">
        {{ active.label }}
        <span class="text-caption text-grey-7"
          >· Step {{ activeIndex + 1 }} of {{ steps.length }}</span
        >
      </h2>
      <div class="row q-col-gutter-lg">
        <div class="col-12 col-lg-6">
          <q-card flat bordered class="q-mb-lg"
            ><q-card-section>
              <h3 class="text-h6 q-mt-none">{{ active.label }} · Approved machine settings</h3>
              <p v-if="isShrMachine(session.inputs?.machine)" class="text-grey-7">
                SHR in-motion · {{ session.inputs.machine.wavelengths_label }}
                <span v-if="session.inputs.machine.body_size">
                  · Body-size preset {{ session.inputs.machine.body_size }}</span
                >
              </p>
              <dl class="review-details">
                <template v-for="field in settingFields" :key="field.id"
                  ><dt>{{ field.label }}</dt>
                  <dd>
                    <strong>{{ active.settings[field.id] }} {{ field.unit }}</strong>
                  </dd></template
                >
              </dl>
              <h3 class="text-subtitle1">Treatment steps</h3>
              <ol class="q-pl-md">
                <li v-for="text in active.treatment_steps" :key="text" class="q-mb-sm">
                  {{ text }}
                </li>
              </ol>
              <h3 class="text-subtitle1">Aftercare</h3>
              <ul class="q-pl-md">
                <li v-for="text in active.aftercare" :key="text">{{ text }}</li>
              </ul>
            </q-card-section></q-card
          >
          <q-banner v-if="session.approval_notes" rounded class="bg-amber-1"
            >Clinician notes: {{ session.approval_notes }}</q-banner
          >
        </div>
        <div class="col-12 col-lg-6">
          <q-card flat bordered class="q-mb-lg"
            ><q-card-section>
              <h3 class="text-h6 q-mt-none">{{ active.label }} · Safety and preparation</h3>
              <div v-for="(label, key) in active.checks" :key="key" class="q-mb-md">
                <q-checkbox
                  v-model="form.checklist[key]"
                  :disable="!canTreat || active.status !== 'pending' || busy"
                  color="black"
                  :label="label"
                />
              </div>
              <q-input
                v-model="form.test_patch_notes"
                outlined
                type="textarea"
                rows="3"
                :label="`${active.label} test-patch findings and clinician clearance`"
                :readonly="!canTreat || active.status !== 'pending' || busy"
              />
              <q-btn
                v-if="active.status === 'pending' && canTreat"
                rounded
                unelevated
                no-caps
                color="black"
                :label="`Start ${active.label} treatment`"
                icon="play_arrow"
                class="full-width q-mt-lg"
                :loading="busy"
                :disable="!safetyReady || busy"
                @click="startZone"
              />
              <q-banner v-if="!canTreat" rounded class="bg-grey-2 q-mt-md"
                >Only the assigned therapist can check safety and record this treatment.</q-banner
              >
            </q-card-section></q-card
          >
          <q-card v-if="active.status === 'in_progress'" flat bordered
            ><q-card-section>
              <h3 class="text-h6 q-mt-none">{{ active.label }} · Treatment record</h3>
              <q-select
                v-model="form.endpoint_grade"
                outlined
                dense
                :label="`${active.label} endpoint grade`"
                :options="[0, 1, 2, 3, 4]"
                :readonly="!canTreat || busy"
                hint="Use the clinic's grading protocol for the observed endpoint."
                class="q-mb-md"
              />
              <q-input
                v-model.number="form.regrowth_days"
                outlined
                dense
                type="number"
                min="0"
                max="365"
                :readonly="!canTreat || busy"
                label="Observed regrowth interval (days, optional)"
                hint="Patient-reported days until regrowth from the previous visit; leave blank if unknown."
                class="q-mb-md"
              />
              <q-input
                v-model="form.notes"
                outlined
                type="textarea"
                rows="3"
                :label="`${active.label} treatment observations / actual settings notes`"
                :readonly="!canTreat || busy"
                class="q-mb-md"
              />
              <q-input
                v-model="form.adverse_events"
                outlined
                type="textarea"
                rows="3"
                :label="`${active.label} adverse responses and actions taken`"
                :readonly="!canTreat || busy"
                hint="Required for endpoint grades 3 or 4."
                class="q-mb-md"
              />
              <q-checkbox
                v-model="form.treatment_confirmed"
                :disable="!canTreat || busy"
                color="black"
                :label="`${active.label} treatment is complete and the observations are recorded`"
              />
              <div v-if="canTreat" class="row q-gutter-sm q-mt-lg">
                <q-btn
                  rounded
                  outline
                  no-caps
                  label="Save this zone's record"
                  :loading="busy"
                  :disable="busy"
                  @click="saveZone"
                />
                <q-btn
                  rounded
                  unelevated
                  no-caps
                  color="black"
                  :label="
                    next
                      ? `Complete ${active.label} and continue to ${next.label}`
                      : `Complete ${active.label} and transfer to clinic head`
                  "
                  :disable="!completionReady || busy"
                  :loading="busy"
                  @click="completeZone"
                />
              </div>
              <p class="text-caption text-grey-7 q-mt-md">
                {{
                  next
                    ? 'The next area opens only after this area is successfully saved as completed.'
                    : 'The last area completes the session and sends the full record to the clinic head.'
                }}
              </p>
            </q-card-section></q-card
          >
        </div>
      </div>
    </template>
    <template v-else-if="steps.length">
      <q-banner rounded class="bg-green-1 q-mb-lg"
        >All selected areas have a saved treatment record.</q-banner
      >
      <q-btn
        v-if="canTreat && session.status === 'in_progress'"
        rounded
        unelevated
        no-caps
        color="black"
        label="Transfer completed session to clinic head"
        :loading="busy"
        :disable="busy"
        @click="$emit('complete', session.execution)"
      />
    </template>
    <q-banner v-else rounded class="bg-amber-1"
      >Approved zone settings are unavailable. Ask the clinic head to review the
      prescription.</q-banner
    >
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { machineSettingFields, isShrMachine } from 'src/utils/lhr/machineSettings'
import {
  activeTreatmentStep,
  zoneTreatmentForm,
  zoneSafetyReady,
  zoneCompletionReady,
} from 'src/utils/lhr/treatmentSteps'
const props = defineProps({
  session: { type: Object, required: true },
  canTreat: Boolean,
  busy: Boolean,
})
const emit = defineEmits(['zone-start', 'zone-save', 'zone-complete', 'complete'])
const steps = computed(() => props.session.zone_treatment_steps || [])
const active = computed(() => activeTreatmentStep(steps.value))
const activeIndex = computed(() =>
  steps.value.findIndex((step) => step.zone_id === active.value?.zone_id),
)
const completedCount = computed(
  () => steps.value.filter((step) => step.status === 'completed').length,
)
const next = computed(() =>
  steps.value.slice(activeIndex.value + 1).find((step) => step.status !== 'completed'),
)
const form = ref(zoneTreatmentForm(null))
watch(
  () => [props.session.revision, active.value?.zone_id],
  () => {
    form.value = zoneTreatmentForm(active.value)
  },
  { immediate: true },
)
const safetyReady = computed(() => zoneSafetyReady(active.value, form.value))
const completionReady = computed(() => zoneCompletionReady(active.value, form.value))
function payload() {
  return JSON.parse(JSON.stringify(form.value))
}
function startZone() {
  if (props.canTreat && safetyReady.value && !props.busy)
    emit('zone-start', active.value.zone_id, payload())
}
function saveZone() {
  if (props.canTreat && active.value?.status === 'in_progress' && !props.busy)
    emit('zone-save', active.value.zone_id, payload())
}
function completeZone() {
  if (props.canTreat && completionReady.value && !props.busy)
    emit('zone-complete', active.value.zone_id, payload())
}
const settingFields = computed(() => machineSettingFields(props.session.inputs?.machine))
</script>
