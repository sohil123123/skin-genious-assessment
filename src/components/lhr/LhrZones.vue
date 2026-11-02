<template>
  <section aria-labelledby="zones-heading">
    <h1 id="zones-heading" class="lhr-title">Zones and tracking mode</h1>
    <p class="text-grey-7 q-mb-lg">
      Select the areas for laser hair removal. All selected zones use image tracking.
    </p>
    <div class="row q-col-gutter-md">
      <div v-for="zone in LHR_ZONES" :key="zone.id" class="col-12 col-sm-6 col-md-4">
        <q-card
          flat
          bordered
          class="zone-card full-height"
          :class="{ selected: draft.zones[zone.id] }"
        >
          <q-card-section>
            <div class="row items-center no-wrap">
              <q-icon :name="zone.icon" size="25px" class="q-mr-sm" />
              <q-checkbox
                :model-value="!!draft.zones[zone.id]"
                :label="zone.label"
                color="black"
                class="text-weight-medium"
                @update:model-value="toggleZone(zone.id, $event)"
              />
            </div>
            <p class="text-caption text-grey-7 q-mt-sm zone-hint">
              {{ zone.hint }}
            </p>
            <template v-if="draft.zones[zone.id]">
              <q-separator class="q-my-md" />
              <div class="text-subtitle2">Image tracking</div>
              <div class="text-caption q-mt-sm">
                {{ zone.views.length }} views · Before and after shaving
              </div>
              <div class="text-caption text-grey-7 q-mt-xs">
                {{ zone.views.join(' / ') }}
              </div>
            </template>
          </q-card-section>
        </q-card>
      </div>
    </div>
    <q-banner rounded class="bg-grey-2 q-mt-lg">
      <template #avatar><q-icon name="privacy_tip" /></template>
      All selected zones are photographed with clinical imaging consent. Face and beard images must
      be framed to hide identity before capture.
    </q-banner>
    <div class="row items-center justify-between q-mt-lg q-gutter-sm">
      <span class="text-grey-7"
        >{{ zones.length }} zones selected · {{ slots.length }} planned images</span
      >
      <q-btn
        rounded
        unelevated
        color="black"
        no-caps
        label="Continue to capture"
        icon-right="arrow_forward"
        :disable="!zones.length"
        @click="$emit('next')"
      />
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { LHR_ZONES, selectedZones, captureSlots } from 'src/utils/lhr/assessment'

const props = defineProps({ modelValue: { type: Object, required: true } })
defineEmits(['next'])
const draft = computed(() => props.modelValue)
const zones = computed(() => selectedZones(draft.value))
const slots = computed(() => captureSlots(draft.value))
function toggleZone(id, selected) {
  if (selected) draft.value.zones[id] = { mode: 'imaged' }
  else delete draft.value.zones[id]
}
</script>

<style scoped>
.zone-card {
  border-radius: 16px;
  transition:
    border-color 0.2s,
    background 0.2s;
}
.zone-card.selected {
  border-color: #202020;
  background: #fafafa;
}
.zone-hint {
  min-height: 40px;
  margin-bottom: 0;
}
</style>
