<template>
  <q-page class="lhr-page">
    <div class="lhr-shell">
      <header class="row items-center justify-between q-mb-lg q-gutter-md">
        <div class="row items-center no-wrap">
          <div class="lhr-brand-mark q-mr-md">A</div>
          <div>
            <div class="lhr-brand">AI AESTHETICS</div>
            <div class="text-caption text-grey-7">Laser hair removal assessment</div>
          </div>
        </div>
        <q-badge color="amber-2" text-color="amber-10" rounded class="q-px-md q-py-sm"
          >STATIC TEST MODE</q-badge
        >
      </header>
      <q-banner rounded class="bg-grey-2 q-mb-lg">
        <template #avatar><q-icon name="science" color="grey-8" /></template>
        UI preview with a sample patient and simulated AI responses. Images and answers stay in this
        page's memory and reset on refresh. Nothing is saved to the patient record.
      </q-banner>
      <q-card flat bordered class="q-mb-lg">
        <q-card-section class="row items-center justify-between q-gutter-sm q-py-sm">
          <div>
            <q-icon name="person_outline" size="22px" class="q-mr-sm" /><strong>Test patient</strong
            ><span class="text-caption text-grey-7 q-ml-sm">Sample profile · 29 years</span>
          </div>
          <div class="text-caption text-grey-7">
            {{ draft.user_id ? `Patient context #${draft.user_id} · ` : '' }}Assessment type:
            <strong>LHR</strong>
          </div>
        </q-card-section>
      </q-card>
      <q-stepper
        v-model="step"
        flat
        alternative-labels
        color="black"
        active-color="black"
        done-color="black"
        class="lhr-stepper"
        :contracted="$q.screen.lt.sm"
      >
        <q-step
          :name="1"
          title="Zones and tracking mode"
          icon="accessibility_new"
          :done="step > 1"
        />
        <q-step :name="2" title="Capture" icon="photo_camera" :done="step > 2" />
        <q-step :name="3" title="Review" icon="fact_check" />
      </q-stepper>
      <LhrZones v-if="step === 1" :model-value="draft" @next="step = 2" />
      <LhrCapture
        v-else-if="step === 2"
        :model-value="draft"
        :captures="captures"
        :results="results"
        :processing="processing"
        :ready="ready"
        @capture="capture"
        @remove="removeCapture"
        @process="processZone"
        @demo-frames="fillFrames"
        @fill-demo="fillAnswers"
        @previous="step = 1"
        @review="openReview"
      />
      <section v-else aria-labelledby="review-heading">
        <h1 id="review-heading" class="lhr-title">Review LHR assessment</h1>
        <p class="text-grey-7">
          Review the selected zones, patient answers and example response before finishing this
          test.
        </p>
        <q-markup-table flat bordered wrap-cells class="q-mb-lg">
          <thead>
            <tr>
              <th class="text-left">Zone</th>
              <th class="text-left">Tracking</th>
              <th class="text-left">Example result</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="zone in zones" :key="zone.id">
              <td>{{ zone.label }}</td>
              <td>Image tracking</td>
              <td>{{ resultLabel(zone.id) }}</td>
            </tr>
          </tbody>
        </q-markup-table>
        <div class="row q-col-gutter-lg">
          <div class="col-12 col-md-6">
            <q-card flat bordered class="full-height"
              ><q-card-section>
                <h2 class="text-h6 q-mt-none">Laser safety screen</h2>
                <dl class="review-details">
                  <dt>Phototype / hair</dt>
                  <dd>{{ draft.phototype }} / {{ draft.hair }}</dd>
                  <dt>Strong sun response</dt>
                  <dd>{{ draft.sunResponse }}</dd>
                  <dt>Tanning response</dt>
                  <dd>{{ draft.tanning }}</dd>
                  <dt>Days since sun / tanning</dt>
                  <dd>{{ draft.safety.daysSinceSun }}</dd>
                  <dt>Planned sessions</dt>
                  <dd>{{ draft.plannedSessions }}</dd>
                  <dt>Safety answers reviewed</dt>
                  <dd>
                    {{ draft.safety.reviewed ? 'Yes' : 'No' }}
                  </dd>
                </dl>
                <div v-for="field in SAFETY_FIELDS" :key="field.id" class="text-caption q-mb-xs">
                  {{ field.label }}:
                  <strong>{{ draft.safety[field.id] ? 'Yes · flagged for review' : 'No' }}</strong>
                </div>
                <p v-if="draft.safety.notes" class="q-mt-md">Notes: {{ draft.safety.notes }}</p>
              </q-card-section></q-card
            >
          </div>
          <div class="col-12 col-md-6">
            <q-card flat bordered class="full-height"
              ><q-card-section>
                <h2 class="text-h6 q-mt-none">Consent</h2>
                <div v-for="item in consentSummary" :key="item.id" class="row items-center q-mb-md">
                  <q-icon
                    :name="draft.consent[item.id] ? 'check_circle' : 'remove_circle_outline'"
                    :color="draft.consent[item.id] ? 'positive' : 'grey'"
                    size="20px"
                    class="q-mr-sm"
                  />{{ item.label }}:
                  {{ draft.consent[item.id] ? 'Selected for test' : 'Not selected' }}
                </div>
                <q-banner rounded class="bg-grey-2 text-caption"
                  >Example readings do not come from an AI service. This preview does not prescribe
                  laser settings or approve treatment.</q-banner
                >
              </q-card-section></q-card
            >
          </div>
        </div>
        <q-banner v-if="completed" rounded class="bg-green-1 q-mt-lg" aria-live="polite"
          ><template #avatar><q-icon name="check_circle" color="positive" /></template>Test
          assessment complete. No assessment, photographs or consent records were saved.</q-banner
        >
        <div class="row justify-between q-mt-lg q-gutter-sm">
          <q-btn
            outline
            rounded
            no-caps
            label="Back to capture"
            color="black"
            @click="backToCapture"
          />
          <q-btn
            v-if="!completed"
            rounded
            unelevated
            no-caps
            color="black"
            label="Finish test assessment"
            :disable="!ready"
            @click="completed = true"
          />
          <q-btn
            v-else
            rounded
            unelevated
            no-caps
            color="black"
            label="Start a new test"
            @click="reset"
          />
        </div>
      </section>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import LhrZones from 'src/components/lhr/LhrZones.vue'
import LhrCapture from 'src/components/lhr/LhrCapture.vue'
import {
  createDraft,
  selectedZones,
  captureSlots,
  reviewReady,
  demoImage,
  demoResult,
  SAFETY_FIELDS,
} from 'src/utils/lhr/assessment'

import { cameraMatches, zoneCameraLock } from 'src/utils/lhr/camera'

const route = useRoute()
const $q = useQuasar()
const draft = reactive(createDraft(route.params))
const step = ref(1)
const completed = ref(false)
const captures = reactive({})
const results = reactive({})
const processing = reactive({})
const timers = new Map()
const zones = computed(() => selectedZones(draft))
const slots = computed(() => captureSlots(draft))
const ready = computed(() => reviewReady(draft, captures, results))
const consentSummary = [
  { id: 'treatment', label: 'Treatment' },
  { id: 'imaging', label: 'Clinical imaging' },
  { id: 'ai', label: 'AI image processing' },
  { id: 'marketing', label: 'Marketing (optional)' },
]

function invalidate(zoneId) {
  clearTimeout(timers.get(zoneId))
  timers.delete(zoneId)
  delete processing[zoneId]
  delete results[zoneId]
  completed.value = false
}
function removeCapture(key) {
  const image = captures[key]
  if (image?.src.startsWith('blob:')) URL.revokeObjectURL(image.src)
  delete captures[key]
  const [zoneId, view, shot] = key.split(':')
  invalidate(zoneId)
  if (shot === 'A' && captures[`${zoneId}:${view}:B`]) removeCapture(`${zoneId}:${view}:B`)
}
function capture(slot, file, metadata = {}) {
  if (!slot || !draft.consent.imaging) return
  if (!slots.value.some(({ key }) => key === slot.key)) return
  if (slot.shot === 'B' && !captures[slot.key.replace(/B$/, 'A')]) return
  if (
    metadata.source === 'camera' &&
    !cameraMatches(zoneCameraLock(captures, slot.zoneId), metadata.camera)
  ) {
    $q.notify({
      type: 'negative',
      message: 'Use the camera already selected for this zone, or remove its camera images first.',
    })
    return
  }
  if (
    file &&
    (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 15728640)
  ) {
    $q.notify({
      type: 'negative',
      message: 'Choose a JPG, PNG or WebP image under 15 MB.',
    })
    return
  }
  removeCapture(slot.key)
  captures[slot.key] = {
    src: file ? URL.createObjectURL(file) : demoImage(slot),
    demo: !file,
    source: metadata.source || (file ? 'upload' : 'demo'),
    camera: metadata.camera || null,
    capturedAt: metadata.capturedAt || new Date().toISOString(),
    file: file || null,
  }
}
function fillFrames() {
  slots.value.forEach((slot) => {
    if (!captures[slot.key]) capture(slot, null)
  })
}
function fillAnswers() {
  Object.assign(draft.safety, Object.fromEntries(SAFETY_FIELDS.map(({ id }) => [id, false])), {
    reviewed: true,
    daysSinceSun: 21,
    notes: 'Sample test answers.',
  })
  Object.assign(draft.consent, {
    treatment: true,
    imaging: true,
    ai: true,
    marketing: false,
  })
  $q.notify({
    message: 'Test safety answers and consent selections filled.',
    color: 'grey-9',
  })
}
function processZone(id) {
  const required = slots.value.filter((slot) => slot.zoneId === id)
  if (
    !draft.consent.imaging ||
    !draft.consent.ai ||
    !required.length ||
    !required.every(({ key }) => captures[key]) ||
    processing[id]
  )
    return
  invalidate(id)
  processing[id] = true
  timers.set(
    id,
    setTimeout(() => {
      if (draft.consent.imaging && draft.consent.ai && draft.zones[id]) results[id] = demoResult(id)
      delete processing[id]
      timers.delete(id)
    }, 4500),
  )
}
function openReview() {
  if (ready.value) step.value = 3
}
function backToCapture() {
  completed.value = false
  step.value = 2
}
function resultLabel(id) {
  return `${results[id]?.density} follicles/cm² · ${results[id]?.calibre} µm (simulated)`
}
function clear() {
  timers.forEach(clearTimeout)
  timers.clear()
  Object.keys(captures).forEach(removeCapture)
  Object.keys(results).forEach((id) => delete results[id])
  Object.keys(processing).forEach((id) => delete processing[id])
}
function reset() {
  clear()
  Object.assign(draft, createDraft(route.params))
  completed.value = false
  step.value = 1
}
// Deselecting zones or withdrawing consent removes obsolete captures and results.
watch(
  () => [JSON.stringify(draft.zones), draft.consent.imaging, draft.consent.ai],
  () => {
    const valid = new Set(draft.consent.imaging ? slots.value.map(({ key }) => key) : [])
    Object.keys(captures).forEach((key) => {
      if (!valid.has(key)) removeCapture(key)
    })
    new Set([...Object.keys(results), ...timers.keys()]).forEach((id) => {
      if (!draft.consent.imaging || !draft.consent.ai || !draft.zones[id]) invalidate(id)
    })
  },
  { flush: 'sync' },
)
watch(() => route.fullPath, reset)
onBeforeUnmount(clear)
</script>

<style>
.lhr-page {
  background: #f5f5f5;
  padding: 24px;
}
.lhr-shell {
  max-width: 1152px;
  margin: 0 auto;
  padding: 32px;
  border-radius: 20px;
  background: white;
  box-shadow: 0 8px 28px #0000000d;
}
.lhr-brand-mark {
  width: 48px;
  height: 48px;
  border: 2px solid #171717;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font:
    28px Georgia,
    serif;
}
.lhr-brand {
  font-size: 19px;
  font-weight: 300;
  letter-spacing: 2px;
}
.lhr-title {
  font-family: Georgia, serif;
  font-size: 32px;
  line-height: 1.25;
  font-weight: 400;
  margin: 0 0 12px;
}
.lhr-stepper {
  margin-bottom: 28px;
}
.lhr-stepper .q-stepper__header {
  box-shadow: none;
  border-bottom: 1px solid #e6e6e6;
}
.lhr-stepper .q-stepper__step-inner {
  padding: 0;
}
.review-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.review-details dt {
  color: #666;
}
.review-details dd {
  margin: 0;
}
@media (max-width: 599px) {
  .lhr-page {
    padding: 10px;
  }
  .lhr-shell {
    padding: 18px;
    border-radius: 14px;
  }
  .lhr-title {
    font-size: 26px;
  }
  .lhr-brand {
    font-size: 16px;
    letter-spacing: 1px;
  }
  .lhr-stepper .q-stepper__tab {
    padding: 16px 4px;
  }
}
</style>
