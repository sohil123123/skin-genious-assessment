<template>
  <q-card flat bordered class="camera-panel q-mb-lg">
    <q-card-section>
      <div class="row items-center justify-between q-gutter-sm q-mb-md">
        <div class="text-subtitle1 text-weight-medium">Live camera</div>
        <q-badge v-if="cameraLock" color="grey-8" label="Camera locked for this zone" />
      </div>
      <q-btn-toggle
        :model-value="profile"
        :options="cameraOptions"
        no-caps
        rounded
        unelevated
        toggle-color="black"
        color="grey-2"
        text-color="black"
        :disable="!!cameraLock || state.status === 'opening' || capturing"
        @update:model-value="changeProfile"
      />
      <p class="text-caption text-grey-7 q-mt-sm">
        {{ viewLabel }} ·
        {{
          cameraLock
            ? 'Use the same camera for all shots in this zone. Remove its camera images to choose another camera.'
            : 'The first live shot locks the camera for this zone in this assessment.'
        }}
      </p>
      <div class="camera-viewport" :style="{ aspectRatio: aspectRatio }">
        <video
          ref="video"
          v-show="state.status === 'live'"
          autoplay
          muted
          playsinline
          :class="{ mirrored: front }"
          aria-label="Live LHR camera preview"
          @loadedmetadata="updateDimensions"
          @loadeddata="frameReady = true"
          @canplay="frameReady = true"
          @waiting="frameReady = false"
          @emptied="frameReady = false"
        />
        <div v-if="state.status !== 'live'" class="camera-placeholder column flex-center">
          <q-spinner v-if="state.status === 'opening'" size="38px" color="white" />
          <q-icon v-else name="videocam_off" size="40px" />
          <span class="text-caption q-mt-sm">{{
            state.status === 'opening'
              ? 'Waiting for camera access…'
              : 'Open the camera to align the treatment area'
          }}</span>
        </div>
        <img
          v-if="showReference && referenceImage && state.status === 'live'"
          :src="referenceImage"
          class="reference-frame"
          :class="{ mirrored: front }"
          alt="Shot A alignment reference"
        />
        <svg
          viewBox="0 0 760 400"
          preserveAspectRatio="none"
          class="camera-overlay"
          aria-hidden="true"
        >
          <path
            d="M26 66V26H66M694 26H734V66M26 334V374H66M694 374H734V334"
            fill="none"
            stroke="white"
            stroke-width="2"
          />
          <rect
            x="180"
            y="80"
            width="400"
            height="240"
            rx="10"
            fill="none"
            stroke="#8fd9bb"
            stroke-width="2"
            stroke-dasharray="8 6"
          />
          <rect x="42" y="302" width="42" height="42" fill="none" stroke="white" stroke-width="2" />
        </svg>
        <div class="camera-overlay-label">Align treatment area</div>
        <div class="camera-marker-label">10 mm marker target · guide only</div>
        <q-badge v-if="state.status === 'live'" color="positive" class="camera-live-label"
          >Live · {{ front ? 'Front' : 'Rear' }}</q-badge
        >
      </div>
      <div class="row items-center justify-between q-mt-sm q-gutter-sm">
        <span class="text-caption text-grey-7">{{
          front
            ? 'Mirrored preview · Saved image is unmirrored'
            : 'Unmirrored preview and saved image'
        }}</span>
        <q-checkbox
          v-if="referenceImage"
          v-model="showReference"
          dense
          color="black"
          label="Show shot A alignment"
        />
      </div>
      <q-banner
        v-if="state.error || captureError"
        rounded
        class="bg-amber-1 q-mt-md"
        aria-live="polite"
        >{{ state.error || captureError }}</q-banner
      >
      <div class="row q-gutter-sm q-mt-md">
        <q-btn
          v-if="state.status !== 'live' && state.status !== 'opening'"
          rounded
          no-caps
          unelevated
          color="black"
          icon="videocam"
          :label="`Open ${profile === 'rear' ? 'rear' : 'front'} camera`"
          :disable="!enabled"
          @click="open"
        />
        <q-btn
          v-else
          rounded
          no-caps
          outline
          color="black"
          :label="state.status === 'opening' ? 'Cancel camera request' : 'Stop camera'"
          icon="videocam_off"
          @click="stop"
        />
        <q-btn
          rounded
          no-caps
          unelevated
          color="black"
          label="Capture shot A"
          icon="photo_camera"
          :disable="!liveReady || !canCaptureA || capturing"
          @click="takeShot('A')"
        />
        <q-btn
          rounded
          no-caps
          unelevated
          color="black"
          label="Capture shot B"
          icon="photo_camera"
          :disable="!liveReady || !canCaptureB || capturing"
          @click="takeShot('B')"
        />
      </div>
      <p class="text-caption text-grey-7 q-mt-md q-mb-none">
        Shot A: before shaving. Shot B: after shaving in the same position. Alignment guides do not
        measure scale or certify image quality.
      </p>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, shallowReactive, watch } from 'vue'
import { cameraMatches, captureVideoFrame, createCameraSession } from 'src/utils/lhr/camera'

const props = defineProps({
  enabled: Boolean,
  canCaptureA: Boolean,
  canCaptureB: Boolean,
  contextKey: { type: String, required: true },
  viewLabel: { type: String, required: true },
  cameraLock: { type: Object, default: null },
  referenceImage: { type: String, default: '' },
})
const emit = defineEmits(['capture'])
const video = ref(null)
const profile = ref(props.cameraLock?.profile || 'rear')
const frameReady = ref(false)
const capturing = ref(false)
const captureError = ref('')
const showReference = ref(false)
const aspectRatio = ref(16 / 9)
const state = shallowReactive({ status: 'idle', camera: null, stream: null, error: '' })
const cameraOptions = [
  { label: 'Rear camera', value: 'rear' },
  { label: 'Front camera', value: 'front' },
]
const front = computed(() => (state.camera?.profile || profile.value) === 'front')
const liveReady = computed(() => props.enabled && state.status === 'live' && frameReady.value)
const session = createCameraSession({ onChange: (next) => Object.assign(state, next) })
let contextVersion = 0

function stop() {
  contextVersion += 1
  frameReady.value = false
  captureError.value = ''
  session.stop()
  if (video.value) video.value.srcObject = null
}
async function open() {
  if (!props.enabled) return
  stop()
  const context = contextVersion
  const stream = await session.start(profile.value, props.cameraLock?.deviceId)
  if (!stream || context !== contextVersion || !props.enabled || !video.value) return
  if (!cameraMatches(props.cameraLock, session.getState().camera)) {
    stop()
    captureError.value =
      'This camera differs from the camera used for this zone. Remove the zone’s camera images before changing cameras.'
    return
  }
  try {
    video.value.srcObject = stream
    await video.value.play()
    if (context !== contextVersion) return
    updateDimensions()
    frameReady.value = video.value.readyState >= 2
  } catch {
    if (context !== contextVersion) return
    stop()
    captureError.value =
      'The camera preview could not play. Open the camera again or choose a local image.'
  }
}
async function changeProfile(value) {
  const reopen = state.status === 'live'
  stop()
  profile.value = value
  if (reopen) await open()
}
function updateDimensions() {
  if (video.value?.videoWidth && video.value.videoHeight)
    aspectRatio.value = video.value.videoWidth / video.value.videoHeight
}
async function takeShot(shot) {
  if (
    !liveReady.value ||
    capturing.value ||
    !(shot === 'A' ? props.canCaptureA : props.canCaptureB)
  )
    return
  const context = contextVersion
  const contextKey = props.contextKey
  const camera = { ...state.camera }
  capturing.value = true
  captureError.value = ''
  try {
    const { blob, width, height } = await captureVideoFrame(video.value)
    if (
      context !== contextVersion ||
      props.contextKey !== contextKey ||
      !props.enabled ||
      state.status !== 'live'
    )
      return
    const capturedAt = new Date().toISOString()
    const file = new File(
      [blob],
      `lhr-${contextKey.replaceAll(':', '-')}-${shot}-${Date.now()}.jpg`,
      { type: 'image/jpeg' },
    )
    emit('capture', shot, file, {
      source: 'camera',
      capturedAt,
      camera: { ...camera, width, height },
    })
  } catch (error) {
    if (context === contextVersion) captureError.value = error.message
  } finally {
    capturing.value = false
  }
}
function visibilityChanged() {
  if (document.hidden) stop()
}
watch(
  () => props.enabled,
  (enabled) => {
    if (!enabled) stop()
  },
  { flush: 'sync' },
)
watch(
  () => props.contextKey,
  () => {
    stop()
    showReference.value = false
  },
  { flush: 'sync' },
)
watch(
  () => props.cameraLock,
  (lock) => {
    if (lock && !cameraMatches(lock, state.camera) && state.status === 'live') stop()
    if (lock) profile.value = lock.profile
  },
)
onMounted(() => {
  document.addEventListener('visibilitychange', visibilityChanged)
  window.addEventListener('pagehide', stop)
})
onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', visibilityChanged)
  window.removeEventListener('pagehide', stop)
  stop()
})
</script>

<style scoped>
.camera-panel {
  border-radius: 14px;
}
.camera-viewport {
  position: relative;
  overflow: hidden;
  margin-top: 14px;
  border-radius: 12px;
  background: #202520;
}
.camera-viewport video,
.reference-frame,
.camera-overlay,
.camera-placeholder {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.camera-viewport video,
.reference-frame {
  object-fit: contain;
}
.mirrored {
  transform: scaleX(-1);
}
.reference-frame {
  opacity: 0.24;
  pointer-events: none;
}
.camera-overlay {
  pointer-events: none;
}
.camera-placeholder {
  color: #ddd;
  padding: 48px;
  text-align: center;
}
.camera-overlay-label,
.camera-marker-label {
  position: absolute;
  color: white;
  background: #172019cc;
  border-radius: 4px;
  padding: 3px 6px;
  font-size: 11px;
  pointer-events: none;
}
.camera-overlay-label {
  left: 24%;
  top: 12%;
}
.camera-marker-label {
  left: 6%;
  bottom: 6%;
}
.camera-live-label {
  position: absolute;
  right: 12px;
  top: 12px;
}
@media (max-width: 599px) {
  .camera-overlay-label,
  .camera-marker-label {
    font-size: 9px;
  }
}
</style>
