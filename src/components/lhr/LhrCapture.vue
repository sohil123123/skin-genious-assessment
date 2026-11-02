<template>
  <section aria-labelledby="capture-heading">
    <div class="row items-start justify-between q-gutter-sm q-mb-md">
      <div>
        <h1 id="capture-heading" class="lhr-title">Capture</h1>
        <p class="text-grey-7 q-mb-none">
          Capture each selected view. Complete safety and consent alongside the simulated analysis.
        </p>
      </div>
      <q-btn
        outline
        rounded
        no-caps
        color="black"
        label="Fill test patient answers"
        icon="science"
        @click="$emit('fill-demo')"
      />
    </div>
    <div class="row q-col-gutter-lg">
      <div class="col-12 col-lg-7">
        <q-banner v-if="zones.length && !draft.consent.imaging" rounded class="bg-amber-1 q-mb-md">
          Select clinical imaging consent to enable photographs for the selected zones.
        </q-banner>
        <q-banner rounded class="bg-grey-2 q-mb-md text-caption">
          Keep framing, camera, distance and lighting consistent. Include a scale marker where
          available. Demo frames and QC values are examples.
        </q-banner>
        <div class="row items-center justify-between q-mb-md q-gutter-sm">
          <div class="text-subtitle2">{{ capturedCount }} / {{ slots.length }} images ready</div>
          <q-btn
            v-if="zones.length"
            rounded
            no-caps
            outline
            label="Fill demo frames"
            icon="collections"
            :disable="!draft.consent.imaging"
            @click="$emit('demo-frames')"
          />
        </div>
        <q-linear-progress
          :value="slots.length ? capturedCount / slots.length : 0"
          color="black"
          rounded
          class="q-mb-lg"
          aria-label="Capture progress"
        />
        <q-tabs
          v-model="activeZone"
          align="left"
          dense
          active-color="black"
          indicator-color="black"
          class="bg-grey-2 rounded-borders q-mb-md"
        >
          <q-tab
            v-for="zone in zones"
            :key="zone.id"
            :name="zone.id"
            :label="zone.label"
            no-caps
            :icon="results[zone.id] ? 'check_circle' : undefined"
          />
        </q-tabs>
        <template v-if="zone">
          <q-banner v-if="['face', 'beard'].includes(zone.id)" rounded class="bg-blue-1 q-mb-md"
            >Hide identity before capture. Frame only the treatment area and exclude eyes and
            identifying features; this preview does not automatically mask photos.</q-banner
          >
          <p class="text-subtitle2">
            {{ zone.label }}
            <span class="text-caption text-grey-7">· {{ zone.hint }}</span>
          </p>
          <q-select
            v-model="activeView"
            outlined
            dense
            label="Capture view"
            :options="
              zone.views.map((label, index) => ({
                label,
                value: index,
              }))
            "
            emit-value
            map-options
            class="q-mb-md"
          />
          <LhrCamera
            :key="zone.id"
            :context-key="`${zone.id}:${activeView}`"
            :view-label="`${zone.label} · ${zone.views[activeView]}`"
            :enabled="draft.consent.imaging"
            :can-capture-a="canCapture('A')"
            :can-capture-b="canCapture('B')"
            :camera-lock="cameraLock"
            :reference-image="captureFor('A')?.src || ''"
            @capture="captureFromCamera"
          />
          <q-btn
            v-if="cameraLock"
            flat
            dense
            no-caps
            color="grey-8"
            label="Remove this zone's images and unlock camera"
            class="q-mb-md"
            @click="clearZoneImages"
          />
          <div class="row q-col-gutter-md">
            <div v-for="shot in SHOTS" :key="shot.id" class="col-12 col-sm-6">
              <q-card flat bordered class="full-height capture-card">
                <q-card-section>
                  <h3 class="text-subtitle1 text-weight-medium q-mt-none q-mb-xs">
                    Shot {{ shot.id }} ·
                    {{ shot.label }}
                  </h3>
                  <p class="text-caption text-grey-7">
                    {{ shot.hint }}
                  </p>
                  <div class="capture-preview">
                    <img
                      v-if="captureFor(shot.id)"
                      :src="captureFor(shot.id).src"
                      :alt="`${zone.label}, ${zone.views[activeView]}, ${shot.label}`"
                    />
                    <div v-else class="column flex-center text-grey-6 full-height">
                      <q-icon name="photo_camera" size="42px" /><span
                        class="text-caption q-mt-sm"
                        >{{ zone.views[activeView] }}</span
                      >
                    </div>
                    <q-badge v-if="captureFor(shot.id)" color="black" class="frame-badge">{{
                      captureFor(shot.id).demo
                        ? 'Demo frame'
                        : captureFor(shot.id).source === 'camera'
                          ? 'Camera capture'
                          : 'Local image'
                    }}</q-badge>
                  </div>
                  <q-file
                    :key="slotFor(shot.id).key + ':' + !!captureFor(shot.id)"
                    :model-value="null"
                    outlined
                    dense
                    accept="image/jpeg,image/png,image/webp"
                    :label="captureFor(shot.id) ? 'Replace with local image' : 'Choose local image'"
                    :disable="!canCapture(shot.id)"
                    max-file-size="15728640"
                    class="q-mt-md"
                    @update:model-value="addImage(shot.id, $event)"
                    @rejected="fileRejected"
                  >
                    <template #prepend><q-icon name="add_a_photo" /></template>
                  </q-file>
                  <div class="row justify-between q-mt-sm">
                    <q-btn
                      flat
                      dense
                      no-caps
                      label="Use demo frame"
                      :disable="!canCapture(shot.id)"
                      @click="$emit('capture', slotFor(shot.id), null)"
                    />
                    <q-btn
                      v-if="captureFor(shot.id)"
                      flat
                      dense
                      no-caps
                      icon="delete_outline"
                      aria-label="Remove image"
                      @click="$emit('remove', slotFor(shot.id).key)"
                    />
                  </div>
                  <p
                    v-if="shot.id === 'B' && !captureFor('A')"
                    class="text-caption text-grey-7 q-mb-none"
                  >
                    Capture shot A for this view first.
                  </p>
                </q-card-section>
              </q-card>
            </div>
          </div>
          <q-banner v-if="processing[zone.id]" rounded class="bg-grey-2 q-mt-md" aria-live="polite">
            <template #avatar><q-spinner color="black" /></template>
            Simulating AI response for {{ zone.label }}. You can continue filling safety and
            consent.
          </q-banner>
          <q-card
            v-else-if="results[zone.id]"
            flat
            bordered
            class="q-mt-md bg-green-1"
            aria-live="polite"
          >
            <q-card-section>
              <div class="text-subtitle2">Example analysis · {{ zone.label }}</div>
              <div class="row q-col-gutter-md q-mt-xs">
                <div class="col-6">
                  <strong>{{ results[zone.id].density }}</strong>
                  <div class="text-caption">follicles/cm² (demo)</div>
                </div>
                <div class="col-6">
                  <strong>{{ results[zone.id].calibre }} µm</strong>
                  <div class="text-caption">mean calibre (demo)</div>
                </div>
              </div>
              <div class="text-caption q-mt-md">
                {{ results[zone.id].quality }} · Simulated response, independent of your images.
              </div>
            </q-card-section>
          </q-card>
          <q-btn
            rounded
            unelevated
            color="black"
            no-caps
            class="full-width q-mt-md"
            :label="`Simulate analysis · ${zone.label}`"
            :loading="!!processing[zone.id]"
            :disable="
              !zoneCaptured(zone.id) ||
              !draft.consent.imaging ||
              !draft.consent.ai ||
              !!results[zone.id]
            "
            @click="$emit('process', zone.id)"
          />
          <p v-if="!draft.consent.ai" class="text-caption text-grey-7 q-mt-sm">
            Select AI image processing consent to run the example analysis.
          </p>
        </template>
        <q-list bordered separator class="q-mt-lg rounded-borders">
          <q-item v-for="item in zones" :key="item.id" clickable @click="activeZone = item.id">
            <q-item-section>{{ item.label }}</q-item-section>
            <q-item-section side>{{ zoneStatus(item.id) }}</q-item-section>
          </q-item>
        </q-list>
      </div>
      <div class="col-12 col-lg-5">
        <LhrSafetyConsent :model-value="draft" />
      </div>
    </div>
    <q-banner v-if="!ready" rounded class="bg-grey-2 q-mt-lg text-caption"
      >To review: complete every selected capture and example analysis, review the safety answers
      and select treatment consent.</q-banner
    >
    <div class="row justify-between q-mt-lg q-gutter-sm">
      <q-btn
        outline
        rounded
        color="black"
        no-caps
        label="Back to zones"
        icon="arrow_back"
        @click="$emit('previous')"
      />
      <q-btn
        rounded
        unelevated
        color="black"
        no-caps
        label="Review assessment"
        icon-right="arrow_forward"
        :disable="!ready"
        @click="$emit('review')"
      />
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { selectedZones, captureSlots, SHOTS } from 'src/utils/lhr/assessment'
import LhrSafetyConsent from './LhrSafetyConsent.vue'
import LhrCamera from './LhrCamera.vue'
import { zoneCameraLock } from 'src/utils/lhr/camera'
const props = defineProps({
  modelValue: { type: Object, required: true },
  captures: { type: Object, required: true },
  results: { type: Object, required: true },
  processing: { type: Object, required: true },
  ready: Boolean,
})
const emit = defineEmits([
  'capture',
  'remove',
  'process',
  'demo-frames',
  'fill-demo',
  'previous',
  'review',
])
const $q = useQuasar()
const draft = computed(() => props.modelValue)
const zones = computed(() => selectedZones(draft.value))
const slots = computed(() => captureSlots(draft.value))
const capturedCount = computed(() => slots.value.filter(({ key }) => props.captures[key]).length)
const activeZone = ref(zones.value[0]?.id)
const activeView = ref(0)
const cameraLock = computed(() => zoneCameraLock(props.captures, activeZone.value))
const zone = computed(() => zones.value.find(({ id }) => id === activeZone.value))
watch(
  activeZone,
  () => {
    activeView.value = 0
  },
  { flush: 'sync' },
)
function slotFor(shot) {
  return slots.value.find(
    (slot) =>
      slot.zoneId === activeZone.value &&
      slot.view === zone.value?.views[activeView.value] &&
      slot.shot === shot,
  )
}
function captureFor(shot) {
  return props.captures[slotFor(shot)?.key]
}
function canCapture(shot) {
  return draft.value.consent.imaging && (shot === 'A' || !!captureFor('A'))
}
function addImage(shot, file) {
  if (file) emit('capture', slotFor(shot), file)
}
function captureFromCamera(shot, file, metadata) {
  emit('capture', slotFor(shot), file, metadata)
}
function clearZoneImages() {
  slots.value
    .filter((slot) => slot.zoneId === activeZone.value)
    .forEach(({ key }) => {
      if (props.captures[key]) emit('remove', key)
    })
}
function fileRejected() {
  $q.notify({
    type: 'negative',
    message: 'Choose a JPG, PNG or WebP image under 15 MB.',
  })
}
function zoneCaptured(id) {
  return slots.value.filter((slot) => slot.zoneId === id).every(({ key }) => props.captures[key])
}
function zoneStatus(id) {
  if (props.processing[id]) return 'Processing example…'
  if (props.results[id]) return 'Example response ready'
  const required = slots.value.filter((slot) => slot.zoneId === id)
  return `${required.filter(({ key }) => props.captures[key]).length} / ${required.length} images`
}
</script>

<style scoped>
.capture-card {
  border-radius: 14px;
}
.capture-preview {
  position: relative;
  height: 180px;
  background: #f5f5f5;
  border: 1px dashed #ccc;
  border-radius: 10px;
  overflow: hidden;
}
.capture-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.frame-badge {
  position: absolute;
  top: 8px;
  left: 8px;
}
</style>
