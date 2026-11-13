<template>
  <section>
    <div class="row items-start justify-between q-gutter-sm q-mb-lg">
      <div>
        <h1 class="lhr-title">
          {{
            capturePhase === 'before' ? 'Before-shave capture' : 'After-shave capture and analysis'
          }}
        </h1>
        <p class="text-grey-7">
          {{
            capturePhase === 'before'
              ? 'Capture every zone before shaving, then generate the AI skin and hair profile.'
              : 'Capture every zone after shaving in the matching position. Complete safety and consent while the images are analysed.'
          }}
        </p>
      </div>
      <q-btn
        outline
        rounded
        no-caps
        label="Save patient answers"
        icon="save"
        :loading="saving"
        @click="$emit('save')"
      />
    </div>
    <div class="row q-col-gutter-lg">
      <div class="col-12 col-lg-7">
        <q-banner rounded class="bg-grey-2 q-mb-md text-caption"
          >Images are saved securely to the server. Keep camera, distance, framing and lighting
          consistent. Capture is always available; consent is collected before sending images to
          AI.</q-banner
        >
        <div class="text-subtitle2 q-mb-sm">{{ savedCount }} / {{ slots.length }} images saved</div>
        <q-linear-progress
          :value="slots.length ? savedCount / slots.length : 0"
          rounded
          color="black"
          class="q-mb-lg"
        />
        <q-tabs
          v-model="activeZone"
          align="left"
          active-color="black"
          indicator-color="black"
          class="bg-grey-2 rounded-borders q-mb-md"
        >
          <q-tab
            v-for="item in zones"
            :key="item.id"
            :name="item.id"
            :label="item.label"
            no-caps
            :icon="results[item.id]?.qc_pass ? 'check_circle' : undefined"
          />
        </q-tabs>
        <template v-if="zone">
          <q-banner v-if="['face', 'beard'].includes(zone.id)" rounded class="bg-blue-1 q-mb-md"
            >Hide identity before capture. Frame only the treatment area and keep eyes and
            identifying features out of view.</q-banner
          >
          <div class="text-h6 q-mb-sm">{{ zone.label }}</div>
          <q-tabs
            v-model="activeView"
            align="left"
            dense
            active-color="black"
            indicator-color="black"
            class="bg-grey-2 q-mb-md"
            aria-label="Capture views"
          >
            <q-tab
              v-for="(label, index) in zone.views"
              :key="index"
              :name="index"
              :label="label"
              no-caps
              :icon="
                captures[`${zone.id}:${index}:${capturePhase === 'before' ? 'A' : 'B'}`]?.id
                  ? 'check_circle'
                  : undefined
              "
            />
          </q-tabs>
          <LhrCamera
            :key="zone.id"
            :context-key="`${zone.id}:${activeView}:${capturePhase}`"
            :zone-id="zone.id"
            :session-id="sessionId"
            :view-index="activeView"
            :ai-framing-allowed="!!draft.consent.imaging && !!draft.consent.ai"
            :capture-phase="capturePhase"
            :view-label="`${zone.label} · ${zone.views[activeView]}`"
            :enabled="true"
            :capture-exists="!!captureFor(capturePhase === 'before' ? 'A' : 'B')"
            :capture-pending="!!captureFor('A')?.pending || !!captureFor('B')?.pending"
            :auto-blocked="saving || !!processing.__profile || !!processing[zone.id]"
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
            label="Remove this zone's images and unlock camera"
            class="q-mb-md"
            @click="clearZoneImages"
          />
          <div class="row q-col-gutter-md">
            <div v-for="shot in visibleShots" :key="shot.id" class="col-12">
              <q-card flat bordered class="full-height">
                <q-card-section>
                  <div class="text-subtitle1">Shot {{ shot.id }} · {{ shot.label }}</div>
                  <p class="text-caption text-grey-7">{{ shot.hint }}</p>
                  <div class="capture-preview">
                    <img
                      v-if="captureFor(shot.id)?.src"
                      :src="captureFor(shot.id).src"
                      :alt="`${zone.label} ${zone.views[activeView]} ${shot.label}`"
                    />
                    <div v-else class="column flex-center full-height text-grey-6">
                      <q-icon name="photo_camera" size="36px" /><span class="text-caption">{{
                        zone.views[activeView]
                      }}</span>
                    </div>
                    <q-badge
                      v-if="captureFor(shot.id)"
                      :color="captureFor(shot.id).error ? 'negative' : 'black'"
                      class="frame-badge"
                      >{{
                        captureFor(shot.id).pending
                          ? 'Saving…'
                          : captureFor(shot.id).error
                            ? 'Upload failed'
                            : 'Saved'
                      }}</q-badge
                    >
                  </div>
                  <q-file
                    :model-value="null"
                    :key="slotFor(shot.id).key + ':' + captureFor(shot.id)?.id"
                    outlined
                    dense
                    accept="image/jpeg,image/png,image/webp"
                    label="Choose local image"
                    :disable="!canCapture(shot.id)"
                    :max-file-size="15728640"
                    class="q-mt-md"
                    @update:model-value="(file) => addImage(shot.id, file)"
                    @rejected="fileRejected"
                  />
                  <div class="row justify-between q-mt-sm">
                    <q-btn
                      v-if="captureFor(shot.id)?.error"
                      flat
                      dense
                      no-caps
                      label="Retry upload"
                      @click="$emit('retry', slotFor(shot.id).key)"
                    />
                    <q-btn
                      v-if="captureFor(shot.id)"
                      flat
                      dense
                      icon="delete_outline"
                      aria-label="Remove capture"
                      :disable="captureFor('A')?.pending || captureFor('B')?.pending"
                      @click="$emit('remove', slotFor(shot.id).key)"
                    />
                  </div>
                  <p
                    v-if="shot.id === 'B' && !captureFor('A')?.id"
                    class="text-caption text-grey-7 q-mb-none"
                  >
                    Save shot A for this view first.
                  </p>
                </q-card-section>
              </q-card>
            </div>
          </div>
          <q-banner
            v-if="capturePhase === 'after' && processing[zone.id]"
            rounded
            class="bg-grey-2 q-mt-md"
            aria-live="polite"
            ><template #avatar><q-spinner /></template>Analysing {{ zone.label }}. Continue filling
            the patient answers while you wait.</q-banner
          >
          <q-card
            v-else-if="capturePhase === 'after' && results[zone.id]"
            flat
            bordered
            class="q-mt-md"
            :class="results[zone.id].qc_pass ? 'bg-green-1' : 'bg-amber-1'"
          >
            <q-card-section>
              <div class="text-subtitle1">Image analysis · {{ zone.label }}</div>
              <div v-if="results[zone.id].score_version" class="row q-col-gutter-md q-mt-sm">
                <div class="col-6"><strong>{{ results[zone.id].density_score ?? 'Unavailable' }}</strong><div>Visible density / 10 · {{ results[zone.id].density_label }}</div></div>
                <div class="col-6"><strong>{{ results[zone.id].coarseness_score ?? 'Unavailable' }}</strong><div>Apparent coarseness / 10 · {{ results[zone.id].coarseness_label }}</div></div>
              </div>
              <p v-else class="q-mt-sm">Earlier measurement · Density: {{ results[zone.id].terminal_follicle_density_per_cm2 ?? 'Unavailable' }} /cm² · Calibre: {{ results[zone.id].mean_shaft_calibre_um ?? 'Unavailable' }} µm</p>
              <p class="q-mt-sm">{{ results[zone.id].hair_character }}</p>
              <p class="text-caption">{{ results[zone.id].comparison_reason }}</p>
              <ul class="text-caption q-pl-md">
                <li v-for="note in results[zone.id].quality_notes" :key="note">{{ note }}</li>
              </ul>
              <p v-if="results[zone.id].requires_recapture" class="text-negative">
                Recapture required: {{ results[zone.id].recapture_reason }}
              </p>
            </q-card-section>
          </q-card>
          <q-btn
            v-if="capturePhase === 'after'"
            rounded
            unelevated
            no-caps
            color="black"
            icon="analytics"
            class="full-width q-mt-md"
            :label="results[zone.id] ? 'Re-analyse zone images' : 'Analyse zone images'"
            :loading="!!processing[zone.id]"
            :disable="!zoneCaptured(zone.id) || !draft.consent.ai || !draft.consent.imaging"
            @click="$emit('process', zone.id)"
          />
          <p
            v-if="!draft.consent.ai || !draft.consent.imaging"
            class="text-caption text-grey-7 q-mt-sm"
          >
            Record clinical imaging and AI processing consent before analysis. Camera capture
            remains available.
          </p>
        </template>
        <q-list bordered separator class="q-mt-lg rounded-borders"
          ><q-item v-for="item in zones" :key="item.id" clickable @click="activeZone = item.id"
            ><q-item-section>{{ item.label }}</q-item-section
            ><q-item-section side>{{ zoneStatus(item.id) }}</q-item-section></q-item
          ></q-list
        >
      </div>
      <div class="col-12 col-lg-5">
        <LhrProfile
          v-if="capturePhase === 'before'"
          :model-value="draft"
          :profile="profile"
          :all-captured="allBeforeCaptured"
          :busy="!!processing.__profile"
          @process="$emit('profile')"
        />
        <LhrSafetyConsent v-else :model-value="draft" />
      </div>
    </div>
    <q-banner v-if="!ready" rounded class="bg-grey-2 q-mt-lg text-caption">{{
      capturePhase === 'before'
        ? 'Complete all before-shave images and generate a usable AI skin and hair profile to continue.'
        : 'Complete all after-shave images and usable analyses, review the safety answers and record consent to continue.'
    }}</q-banner>
    <div class="row justify-between q-mt-lg q-gutter-sm">
      <q-btn
        outline
        rounded
        no-caps
        :label="capturePhase === 'before' ? 'Back to zones' : 'Back to before-shave capture'"
        icon="arrow_back"
        @click="$emit('previous')"
      /><q-btn
        rounded
        unelevated
        no-caps
        color="black"
        :label="
          capturePhase === 'before'
            ? 'Continue to after-shave capture'
            : 'Continue to laser prescription'
        "
        icon-right="arrow_forward"
        :disable="!ready"
        :loading="saving"
        @click="$emit('review')"
      />
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { selectedZones, captureSlots, SHOTS } from 'src/utils/lhr/assessment'
import { zoneCameraLock } from 'src/utils/lhr/camera'
import LhrCamera from './LhrCamera.vue'
import LhrProfile from './LhrProfile.vue'
import { inspectCaptureFile, CAPTURE_STANDARD_VERSION } from 'src/utils/lhr/captureQuality'
import LhrSafetyConsent from './LhrSafetyConsent.vue'
const props = defineProps({
  sessionId: { type: Number, required: true },
  modelValue: { type: Object, required: true },
  captures: { type: Object, required: true },
  results: { type: Object, required: true },
  processing: { type: Object, required: true },
  ready: Boolean,
  saving: Boolean,
  capturePhase: { type: String, default: 'after' },
  profile: { type: Object, default: null },
  allBeforeCaptured: Boolean,
})
const emit = defineEmits([
  'capture',
  'remove',
  'retry',
  'process',
  'previous',
  'review',
  'save',
  'profile',
])
const $q = useQuasar()
const draft = computed(() => props.modelValue)
const zones = computed(() => selectedZones(draft.value))
const allSlots = computed(() => captureSlots(draft.value))
const slots = computed(() =>
  allSlots.value.filter((slot) => slot.shot === (props.capturePhase === 'before' ? 'A' : 'B')),
)
const visibleShots = computed(() =>
  SHOTS.filter((shot) => shot.id === (props.capturePhase === 'before' ? 'A' : 'B')),
)
const savedCount = computed(
  () =>
    slots.value.filter(({ key }) => props.captures[key]?.id && !props.captures[key].pending).length,
)
const activeZone = ref(zones.value[0]?.id)
const activeView = ref(0)
const zone = computed(() => zones.value.find(({ id }) => id === activeZone.value))
const cameraLock = computed(() => zoneCameraLock(props.captures, activeZone.value))
watch(
  activeZone,
  () => {
    activeView.value = 0
  },
  { flush: 'sync' },
)
function slotFor(shot) {
  return allSlots.value.find(
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
  if (
    shot !== (props.capturePhase === 'before' ? 'A' : 'B') ||
    captureFor('A')?.pending ||
    captureFor('B')?.pending
  )
    return false
  return (
    !captureFor(shot)?.pending &&
    (shot === 'A' || (!!captureFor('A')?.id && !captureFor('A')?.pending))
  )
}
function standardMetadata(quality) {
  return {
    version: CAPTURE_STANDARD_VERSION,
    zone_id: activeZone.value,
    view_index: activeView.value,
    quality: { pass: quality.pass, brightness: quality.brightness, focus: quality.focus },
  }
}
async function addImage(shot, file) {
  if (!file || !canCapture(shot)) return
  const key = slotFor(shot)?.key
  try {
    const quality = await inspectCaptureFile(file)
    if (slotFor(shot)?.key !== key || !canCapture(shot)) return
    if (!quality.pass) {
      $q.notify({ type: 'negative', message: quality.issues.join(' ') })
      return
    }
    emit('capture', slotFor(shot), file, {
      source: 'upload',
      capture_standard: standardMetadata(quality),
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'The image could not be checked. Choose a different image.',
    })
  }
}
function captureFromCamera(shot, file, metadata) {
  emit('capture', slotFor(shot), file, {
    ...metadata,
    capture_standard: {
      ...standardMetadata(metadata.capture_quality || {}),
      ...(metadata.zone_check ? { zone_check: metadata.zone_check } : {}),
    },
  })
}
function clearZoneImages() {
  allSlots.value
    .filter((slot) => slot.zoneId === activeZone.value)
    .forEach(({ key }) => {
      if (props.captures[key]) emit('remove', key)
    })
}
function fileRejected() {
  $q.notify({ type: 'negative', message: 'Choose a JPG, PNG or WebP image under 15 MB.' })
}
function zoneCaptured(id) {
  return slots.value
    .filter((slot) => slot.zoneId === id)
    .every(
      ({ key }) =>
        props.captures[key]?.id && !props.captures[key].pending && !props.captures[key].error,
    )
}
function zoneStatus(id) {
  if (props.processing[id]) return 'Analysing…'
  if (
    props.capturePhase === 'after' &&
    (props.results[id]?.requires_recapture || props.results[id]?.qc_pass === false)
  )
    return 'Review / recapture'
  if (props.capturePhase === 'after' && props.results[id]) return 'Analysis ready'
  const list = slots.value.filter((slot) => slot.zoneId === id)
  return `${list.filter(({ key }) => props.captures[key]?.id).length} / ${list.length} saved`
}
</script>

<style scoped>
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
