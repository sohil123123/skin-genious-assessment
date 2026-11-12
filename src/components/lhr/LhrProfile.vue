<template>
  <q-card flat bordered>
    <q-card-section>
      <h2 class="text-h6 q-mt-none">Before-shave AI profile</h2>
      <p class="text-caption text-grey-7">
        Capture every selected zone before shaving. AI describes hair from the images and suggests
        phototype using the patient's sun-response history. No manual phototype or hair selection is
        required.
      </p>
      <q-select
        v-model="draft.sunResponse"
        outlined
        dense
        label="Patient's usual response to strong sun"
        :options="[
          'Always burns badly, never tans',
          'Usually burns, tans a little',
          'Burns mildly, then tans',
          'Rarely burns, tans easily',
          'Never burns',
        ]"
        class="q-mb-md"
      />
      <q-select
        v-model="draft.tanning"
        outlined
        dense
        label="Patient's usual tanning response"
        :options="['Never', 'Minimally', 'Gradually', 'Easily and deeply', 'Very deeply']"
        class="q-mb-md"
      />
      <p class="text-caption">
        Record these history answers; Fitzpatrick phototype cannot be confirmed from visible skin
        colour alone.
      </p>
      <q-checkbox v-model="draft.consent.imaging" color="black" label="Clinical imaging consent" />
      <q-checkbox v-model="draft.consent.ai" color="black" label="AI image processing consent" />
      <p class="text-caption text-grey-7">
        Camera capture remains available before consent. Permission is required before the first
        images are sent for AI processing. Complete treatment consent and the full safety screen in
        the next step.
      </p>
      <q-btn
        rounded
        unelevated
        no-caps
        color="black"
        :label="profile ? 'Regenerate skin and hair profile' : 'Analyse all before-shave images'"
        :loading="busy"
        :disable="
          !allCaptured ||
          !draft.sunResponse ||
          !draft.tanning ||
          !draft.consent.imaging ||
          !draft.consent.ai
        "
        class="full-width q-my-md"
        @click="$emit('process')"
      />
      <q-banner v-if="!allCaptured" rounded class="bg-grey-2 text-caption"
        >Save before-shave images for every selected zone and view first.</q-banner
      >
      <template v-if="profile">
        <q-input
          :model-value="profile.phototype || 'History or clinician review needed'"
          readonly
          outlined
          dense
          label="AI-suggested Fitzpatrick phototype"
          class="q-mb-sm"
        />
        <q-input
          :model-value="profile.hair_character"
          readonly
          outlined
          dense
          label="AI-observed hair character"
        />
        <p class="text-caption q-mt-md">{{ profile.phototype_basis }}</p>
        <p class="text-caption">{{ profile.summary }}</p>
        <q-card
          v-for="zone in profile.zones"
          :key="zone.zone_id"
          flat
          bordered
          class="q-mt-sm"
          :class="zone.qc_pass && !zone.requires_recapture ? 'bg-green-1' : 'bg-amber-1'"
        >
          <q-card-section
            ><strong>{{ zoneName(zone.zone_id) }}</strong>
            <p class="text-caption">
              {{ zone.hair_character }}<br />{{ zone.skin_tone_description }}
            </p>
            <ul class="text-caption q-pl-md">
              <li v-for="note in zone.notes" :key="note">{{ note }}</li>
            </ul></q-card-section
          >
        </q-card>
      </template>
    </q-card-section>
  </q-card>
</template>
<script setup>
import { computed } from 'vue'
import { LHR_ZONES } from 'src/utils/lhr/assessment'
const props = defineProps({
  modelValue: { type: Object, required: true },
  profile: { type: Object, default: null },
  allCaptured: Boolean,
  busy: Boolean,
})
defineEmits(['process'])
const draft = computed(() => props.modelValue)
function zoneName(id) {
  return LHR_ZONES.find((zone) => zone.id === id)?.label || id
}
</script>
