<template>
  <div class="q-gutter-lg">
    <q-card flat bordered class="rounded-borders">
      <q-card-section>
        <h2 class="text-h6 q-mt-none q-mb-sm">Laser safety screen</h2>
        <p class="text-caption text-grey-7">
          Record the patient's answers while the image analysis processes.
        </p>
        <div class="row q-col-gutter-sm q-mb-md">
          <div class="col-6">
            <q-input
              :model-value="draft.phototype || 'AI profile pending'"
              outlined
              dense
              readonly
              label="AI-suggested Fitzpatrick phototype"
            />
          </div>
          <div class="col-6">
            <q-input
              :model-value="draft.hair || 'AI profile pending'"
              outlined
              dense
              readonly
              label="AI-observed hair character"
            />
          </div>
        </div>
        <p class="text-caption text-grey-7">
          Review the AI suggestion against the patient history before approving treatment. Return to
          before-shave capture to update sun-response answers and regenerate the profile.
        </p>
        <div v-for="field in SAFETY_FIELDS" :key="field.id" class="q-mb-xs">
          <q-checkbox v-model="draft.safety[field.id]" :label="field.label" color="black" dense />
          <div v-if="field.hint && draft.safety[field.id]" class="text-caption text-grey-7 q-ml-lg">
            {{ field.hint }}
          </div>
        </div>
        <q-input
          v-model.number="draft.safety.daysSinceSun"
          type="number"
          outlined
          dense
          label="Days since sun exposure or tanning"
          min="0"
          max="3650"
          :rules="[validDays]"
          class="q-mt-md"
        />
        <q-select
          v-model="draft.plannedSessions"
          outlined
          dense
          label="Planned course length (sessions)"
          :options="[6, 8, 10]"
          class="q-mt-sm"
        />
        <q-input
          v-model="draft.safety.notes"
          type="textarea"
          outlined
          label="Medication / clinical notes"
          rows="2"
          class="q-mt-md"
        />
        <q-banner v-if="flags.length" rounded class="bg-amber-1 q-mt-md text-caption"
          >{{ flags.length }} safety flag(s) recorded for clinician review. The clinic head must
          document clearance before approving treatment.</q-banner
        >
        <q-checkbox
          v-model="draft.safety.reviewed"
          color="black"
          label="I have reviewed all safety answers with the patient"
          class="q-mt-md"
        />
      </q-card-section>
    </q-card>
    <q-card flat bordered>
      <q-card-section>
        <h2 class="text-h6 q-mt-none q-mb-sm">Consent</h2>
        <div v-for="item in consentFields" :key="item.id" class="q-mb-md">
          <q-checkbox v-model="draft.consent[item.id]" :label="item.label" color="black" dense />
          <div class="text-caption text-grey-7 q-ml-lg">
            {{ item.hint }}
          </div>
        </div>
        <p class="text-caption text-grey-7 q-mb-none">
          Record the patient's consent discussion. Changes are saved with the staff member and time;
          retain the clinic's signed consent form according to its usual process.
        </p>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { SAFETY_FIELDS } from 'src/utils/lhr/assessment'
const props = defineProps({ modelValue: { type: Object, required: true } })
const draft = computed(() => props.modelValue)
const flags = computed(() => SAFETY_FIELDS.filter(({ id }) => draft.value.safety[id]))
const validDays = (value) =>
  (value !== '' &&
    value !== null &&
    Number.isInteger(Number(value)) &&
    Number(value) >= 0 &&
    Number(value) <= 3650) ||
  'Enter whole days between 0 and 3650'
const consentFields = [
  {
    id: 'treatment',
    label: 'Treatment consent',
    hint: 'Discussion of risks, expected course length and aftercare.',
  },
  {
    id: 'imaging',
    label: 'Clinical imaging consent',
    hint: "For this patient's clinical assessment and progress tracking. Required before AI analysis and prescription generation.",
  },
  {
    id: 'ai',
    label: 'AI image processing consent',
    hint: 'Permission to send clinical images to OpenAI for analysis. Images can be captured and saved before completing this field.',
  },
  {
    id: 'marketing',
    label: 'Marketing use (optional)',
    hint: 'Separate permission. Declining does not affect this assessment.',
  },
]
</script>
