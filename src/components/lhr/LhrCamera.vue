<template>
  <q-card flat bordered class="camera-panel q-mb-lg">
    <q-card-section>
      <div class="row items-center justify-between q-gutter-sm q-mb-md">
        <div class="text-subtitle1 text-weight-medium">Live camera</div>
        <q-badge v-if="cameraLock" color="grey-8" label="Camera locked for this zone" />
      </div>
      <q-toggle
        v-model="autoEnabled"
        color="black"
        label="Auto capture when steady"
        class="q-mb-sm"
      />
      <p class="text-caption text-grey-7 q-mt-none">
        Align the selected treatment area with its guide and hold steady for 2 seconds. Auto capture
        detects the selected treatment area and saves a close-up crop instead of the whole frame.
      </p>
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
          :style="referenceStyle"
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
          <path :d="guide.path" fill="none" stroke="#8fd9bb" stroke-width="3" />
          <rect
            :x="guideBox.x * 760"
            :y="guideBox.y * 400"
            :width="guideBox.width * 760"
            :height="guideBox.height * 400"
            rx="10"
            fill="none"
            stroke="#8fd9bb"
            stroke-width="2"
            stroke-dasharray="8 6"
          />
        </svg>
        <div class="camera-overlay-label">{{ viewLabel }} · Crop guide</div>
        <div
          v-if="autoEnabled && autoState.phase === 'holding'"
          class="camera-countdown"
          role="status"
          aria-live="polite"
        >
          {{ Math.max(1, Math.ceil(autoState.remainingMs / 1000)) }}
          <span>Hold steady</span>
        </div>
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
      <p class="text-caption text-grey-7 q-mt-sm">
        {{
          aiFramingAllowed
            ? 'AI locates the zone for both manual and automatic capture. Check the saved crop before continuing.'
            : 'Before imaging and AI consent, manual capture saves only the dashed guide area. Position the exposed zone inside it.'
        }}
        Cropping enlarges the saved preview; move closer for more real hair detail.
      </p>
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
          v-if="capturePhase === 'before'"
          label="Capture before shaving"
          icon="photo_camera"
          :loading="capturing"
          :disable="!liveReady || !canCaptureA || capturing"
          @click="takeShot('A')"
        />
        <q-btn
          rounded
          no-caps
          unelevated
          color="black"
          v-if="capturePhase === 'after'"
          label="Capture after shaving"
          icon="photo_camera"
          :loading="capturing"
          :disable="!liveReady || !canCaptureB || capturing"
          @click="takeShot('B')"
        />
        <q-btn
          v-if="
            aiFramingAllowed && (captureError || ['error', 'rejected'].includes(zoneCheck.status))
          "
          rounded
          outline
          no-caps
          color="black"
          label="Capture guide area instead"
          :disable="!liveReady || capturing || !(shot === 'A' ? canCaptureA : canCaptureB)"
          @click="takeShot(shot, false, true)"
        />
      </div>
      <q-linear-progress
        v-if="autoEnabled && autoState.phase === 'holding'"
        :value="1 - autoState.remainingMs / AUTO_CAPTURE_HOLD_MS"
        color="positive"
        rounded
        class="q-mt-md"
      />
      <q-banner
        v-if="(autoEnabled || zoneCheck.status !== 'idle') && state.status === 'live'"
        rounded
        class="bg-blue-1 q-mt-md text-caption"
        aria-live="polite"
      >
        <q-spinner v-if="zoneCheck.status === 'checking'" size="18px" class="q-mr-sm" />
        {{ autoMessage }}
        <q-btn
          v-if="autoState.phase === 'captured' && !captureExists && !capturePending && !capturing"
          flat
          dense
          no-caps
          label="Retry auto capture"
          class="q-ml-sm"
          @click="retryAutoCapture"
        />
      </q-banner>
      <q-banner
        v-if="state.status === 'live'"
        rounded
        class="q-mt-md text-caption"
        :class="liveReady ? 'bg-green-1' : 'bg-amber-1'"
        aria-live="polite"
      >
        {{
          liveReady
            ? 'Frame ready: exposure, detail and stability checks passed.'
            : quality.pass
              ? 'Hold steady while frame readiness settles.'
              : quality.issues.join(' ')
        }}
      </q-banner>
      <p class="text-caption text-grey-7 q-mt-md q-mb-none">
        Shot A: before shaving. Shot B: after shaving in the same position. Alignment guides do not
        measure scale or recognise anatomy. Frame checks assess brightness, detail and stability; AI
        suggests a zone crop when consent is recorded. Without zone detection, manual capture uses
        the dashed guide only. Review the saved crop; detection can be wrong. No hair pixels are
        generated.
      </p>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { api } from 'src/boot/axios'
import {
  verifyZoneFrame,
  reviewZoneCandidate,
  frameChanged,
  framingErrorMessage,
} from 'src/utils/lhr/zoneFraming'
import { computed, onBeforeUnmount, onMounted, ref, shallowReactive, watch } from 'vue'
import { cameraMatches, captureVideoFrame, createCameraSession } from 'src/utils/lhr/camera'
import { AUTO_CAPTURE_HOLD_MS, createAutoCaptureGate } from 'src/utils/lhr/autoCapture'
import {
  inspectCaptureElement,
  inspectCaptureFile,
  framingGuide,
} from 'src/utils/lhr/captureQuality'
import {
  cropZoneImage,
  zoneGuideBox,
  cropReferenceStyle,
  CROP_QUALITY_OPTIONS,
  validCropBox,
} from 'src/utils/lhr/zoneCrop'

const props = defineProps({
  enabled: Boolean,
  sessionId: { type: Number, required: true },
  viewIndex: { type: Number, required: true },
  aiFramingAllowed: Boolean,
  zoneId: { type: String, default: '' },
  capturePhase: { type: String, default: 'after' },
  captureExists: Boolean,
  capturePending: Boolean,
  autoBlocked: Boolean,
  canCaptureA: Boolean,
  canCaptureB: Boolean,
  contextKey: { type: String, required: true },
  viewLabel: { type: String, required: true },
  cameraLock: { type: Object, default: null },
  referenceImage: { type: String, default: '' },
  referenceCrop: { type: Object, default: null },
})
const emit = defineEmits(['capture'])
const video = ref(null)
const profile = ref(props.cameraLock?.profile || 'rear')
const frameReady = ref(false)
const capturing = ref(false)
const captureError = ref('')
const autoEnabled = ref(true)
const zoneCheck = ref({ status: 'idle', message: '' })
let framingController = null
let rejectedPixels = null
let recheckAfter = 0
function cancelZoneCheck() {
  framingController?.abort()
  framingController = null
  rejectedPixels = null
  zoneCheck.value = { status: 'idle', message: '' }
}
const autoGate = createAutoCaptureGate()
const autoState = ref(autoGate.reset(props.contextKey))
const shot = computed(() => (props.capturePhase === 'before' ? 'A' : 'B'))
const autoMessage = computed(() => {
  if (zoneCheck.value.status === 'checking')
    return `Detecting the treatment area and crop for ${props.viewLabel}.`
  if (zoneCheck.value.status === 'rejected' || zoneCheck.value.status === 'error')
    return zoneCheck.value.message
  if (props.capturePending) return 'Saving the captured image. Auto capture is paused.'
  if (props.captureExists)
    return 'This view already has an image. Choose another view or remove it to capture again.'
  if (props.autoBlocked)
    return 'Auto capture is paused while patient data or images are being processed.'
  if (!props.aiFramingAllowed)
    return 'Select clinical imaging and AI processing consent to enable automatic zone verification. Manual capture saves the guide area without AI.'
  if (autoState.value.phase === 'captured')
    return capturing.value
      ? 'Capturing image…'
      : 'Capture attempted. Review the saved image or retry if needed.'
  if (autoState.value.phase === 'holding')
    return `Keep the treatment area steady. Capturing in ${Math.max(1, Math.ceil(autoState.value.remainingMs / 1000))}…`
  return 'Position the treatment area inside its guide. Auto capture starts when lighting, detail and stability checks pass.'
})
function cancelAutoCountdown() {
  autoState.value = autoGate.cancel()
}
function retryAutoCapture() {
  if (props.captureExists || props.capturePending || capturing.value) return
  captureError.value = ''
  cancelZoneCheck()
  autoState.value = autoGate.reset(props.contextKey)
}
const showReference = ref(false)
const aspectRatio = ref(16 / 9)
const state = shallowReactive({ status: 'idle', camera: null, stream: null, error: '' })
const cameraOptions = [
  { label: 'Rear camera', value: 'rear' },
  { label: 'Front camera', value: 'front' },
]
const front = computed(() => (state.camera?.profile || profile.value) === 'front')
const quality = ref({ pass: false, issues: ['Wait for a steady, focused frame.'] })
const stableFrames = ref(0)
const guide = computed(() => framingGuide(props.zoneId))
const guideBox = computed(() => zoneGuideBox(props.zoneId))
const referenceStyle = computed(() =>
  cropReferenceStyle(props.referenceCrop, front.value, aspectRatio.value),
)
const liveReady = computed(
  () =>
    props.enabled &&
    state.status === 'live' &&
    frameReady.value &&
    quality.value.pass &&
    stableFrames.value >= 2,
)
let qualityTimer = null
let previousPixels = null
let previousVideoTime = null
function checkQuality(allowAuto = true) {
  if (state.status !== 'live' || !frameReady.value || !video.value) {
    stableFrames.value = 0
    cancelAutoCountdown()
    return
  }
  if (allowAuto) {
    if (previousVideoTime === video.value.currentTime) {
      stableFrames.value = 0
      cancelAutoCountdown()
      return
    }
    previousVideoTime = video.value.currentTime
  }
  try {
    const result = inspectCaptureElement(video.value, previousPixels)
    previousPixels = result.pixels
    quality.value = {
      pass: result.pass,
      issues: result.issues,
      brightness: result.brightness,
      focus: result.focus,
    }
    stableFrames.value = result.pass ? stableFrames.value + 1 : 0
  } catch {
    quality.value = { pass: false, issues: ['Wait for a usable camera frame.'] }
    stableFrames.value = 0
  }
  if (allowAuto) {
    if (
      zoneCheck.value.status === 'rejected' &&
      performance.now() >= recheckAfter &&
      frameChanged(rejectedPixels, previousPixels)
    ) {
      rejectedPixels = null
      zoneCheck.value = { status: 'idle', message: '' }
      autoState.value = autoGate.reset(props.contextKey)
    }
    autoState.value = autoGate.observe({
      key: props.contextKey,
      now: performance.now(),
      ready:
        autoEnabled.value &&
        props.aiFramingAllowed &&
        zoneCheck.value.status === 'idle' &&
        !document.hidden &&
        liveReady.value &&
        !props.captureExists &&
        !props.capturePending &&
        !props.autoBlocked &&
        !capturing.value &&
        (shot.value === 'A' ? props.canCaptureA : props.canCaptureB),
    })
    if (autoState.value.trigger) void takeShot(shot.value, true)
  }
}
const session = createCameraSession({ onChange: (next) => Object.assign(state, next) })
let contextVersion = 0

function stop() {
  contextVersion += 1
  cancelZoneCheck()
  cancelAutoCountdown()
  if (qualityTimer) clearInterval(qualityTimer)
  qualityTimer = null
  previousPixels = null
  previousVideoTime = null
  stableFrames.value = 0
  quality.value = { pass: false, issues: ['Wait for a steady, focused frame.'] }
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
  if (!qualityTimer) qualityTimer = setInterval(() => checkQuality(), 350)
  if (video.value?.videoWidth && video.value.videoHeight)
    aspectRatio.value = video.value.videoWidth / video.value.videoHeight
}
async function takeShot(shot, automatic = false, guideOnly = false) {
  checkQuality(false)
  if (
    !liveReady.value ||
    (shot === 'A' ? props.capturePhase !== 'before' : props.capturePhase !== 'after') ||
    capturing.value ||
    (automatic &&
      (!autoEnabled.value ||
        !props.aiFramingAllowed ||
        props.captureExists ||
        props.capturePending ||
        props.autoBlocked ||
        document.hidden)) ||
    !(shot === 'A' ? props.canCaptureA : props.canCaptureB)
  )
    return
  const context = contextVersion
  const contextKey = props.contextKey
  const camera = { ...state.camera }
  const verifyCrop = props.aiFramingAllowed && !guideOnly
  const candidatePixels = previousPixels?.slice()
  let zoneResult = null
  let reviewSignal = null
  capturing.value = true
  autoState.value = autoGate.reserve(contextKey)
  captureError.value = ''
  const capturedAt = new Date().toISOString()
  try {
    const { blob } = await captureVideoFrame(video.value)
    if (
      context !== contextVersion ||
      props.contextKey !== contextKey ||
      !props.enabled ||
      state.status !== 'live'
    )
      return
    if (
      automatic &&
      (!autoEnabled.value ||
        !props.aiFramingAllowed ||
        props.captureExists ||
        props.capturePending ||
        props.autoBlocked ||
        document.hidden)
    )
      return
    if (verifyCrop) {
      framingController = new AbortController()
      reviewSignal = framingController.signal
      zoneCheck.value = { status: 'checking', message: '' }
      const review = await reviewZoneCandidate(
        blob,
        (candidate) =>
          verifyZoneFrame(api, {
            sessionId: props.sessionId,
            zoneId: props.zoneId,
            viewIndex: props.viewIndex,
            shot,
            blob: candidate,
            signal: reviewSignal,
          }),
        () =>
          context === contextVersion &&
          props.contextKey === contextKey &&
          (!automatic || autoEnabled.value) &&
          props.aiFramingAllowed &&
          !reviewSignal.aborted &&
          !document.hidden &&
          props.enabled &&
          state.status === 'live' &&
          (!automatic || !props.captureExists) &&
          !props.capturePending &&
          !props.autoBlocked,
      )
      if (review.status === 'stale') {
        if (
          context === contextVersion &&
          props.contextKey === contextKey &&
          !reviewSignal.aborted
        ) {
          zoneCheck.value = { status: 'idle', message: '' }
          autoState.value = autoGate.reset(contextKey)
        }
        return
      }
      if (review.status === 'rejected') {
        rejectedPixels = candidatePixels
        recheckAfter = performance.now() + 3000
        zoneCheck.value = {
          status: 'rejected',
          message:
            (review.result?.zone_visible && !validCropBox(review.result?.crop_box)
              ? 'A reliable crop could not be located. Centre the complete exposed treatment area and move closer before retrying.'
              : typeof review.result?.reason === 'string'
                ? review.result.reason.slice(0, 300)
                : '') ||
            `The selected ${props.viewLabel} could not be verified. Centre the exposed treatment area and adjust the camera to retry.`,
        }
        if (!automatic) captureError.value = zoneCheck.value.message
        return
      }
      zoneResult = review.result
      zoneCheck.value = { status: 'accepted', message: '' }
    }
    const cropped = await cropZoneImage(blob, zoneResult?.crop_box || guideBox.value, {
      method: zoneResult ? 'ai' : 'guide',
    })
    const captureQuality = await inspectCaptureFile(cropped.blob, CROP_QUALITY_OPTIONS)
    if (!captureQuality.pass) throw new Error(captureQuality.issues.join(' '))
    if (
      context !== contextVersion ||
      props.contextKey !== contextKey ||
      !props.enabled ||
      (verifyCrop && (!props.aiFramingAllowed || reviewSignal?.aborted)) ||
      props.capturePending ||
      !(shot === 'A' ? props.canCaptureA : props.canCaptureB) ||
      (automatic &&
        (!autoEnabled.value ||
          !props.aiFramingAllowed ||
          reviewSignal?.aborted ||
          props.captureExists ||
          props.autoBlocked ||
          document.hidden)) ||
      state.status !== 'live'
    )
      return
    const file = new File(
      [cropped.blob],
      `lhr-${contextKey.replaceAll(':', '-')}-${shot}-${Date.now()}.jpg`,
      { type: 'image/jpeg' },
    )
    emit('capture', shot, file, {
      source: 'camera',
      ...(zoneResult
        ? {
            zone_check: {
              zone_visible: zoneResult.zone_visible,
              skin_visible: zoneResult.skin_visible,
              framing_ok: zoneResult.framing_ok,
              confidence: zoneResult.confidence,
              reason: zoneResult.reason,
            },
          }
        : {}),
      crop: cropped.crop,
      capture_quality: {
        pass: captureQuality.pass,
        brightness: captureQuality.brightness,
        focus: captureQuality.focus,
      },
      capturedAt,
      camera: { ...camera, width: cropped.width, height: cropped.height },
    })
  } catch (error) {
    if (context === contextVersion && !reviewSignal?.aborted) {
      if (verifyCrop)
        zoneCheck.value = {
          status: 'error',
          message: error.response ? framingErrorMessage(error) : error.message,
        }
      else captureError.value = error.message
    }
  } finally {
    if (framingController?.signal === reviewSignal) framingController = null
    capturing.value = false
  }
}
watch(
  () => [autoEnabled.value, props.aiFramingAllowed],
  () => {
    cancelZoneCheck()
    autoState.value = autoGate.reset(props.contextKey)
  },
  { flush: 'sync' },
)
watch(
  () => [
    autoEnabled.value,
    props.captureExists,
    props.capturePending,
    props.autoBlocked,
    props.canCaptureA,
    props.canCaptureB,
    frameReady.value,
    state.status,
  ],
  cancelAutoCountdown,
  { flush: 'sync' },
)
watch(
  () => props.captureExists,
  (exists, previouslyExisted) => {
    if (previouslyExisted && !exists && !props.capturePending)
      autoState.value = autoGate.reset(props.contextKey)
  },
  { flush: 'sync' },
)
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
    autoState.value = autoGate.reset(props.contextKey)
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
.camera-overlay-label {
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
.camera-countdown {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: #123b2ddd;
  color: white;
  border: 3px solid #8fd9bb;
  font-size: 42px;
  pointer-events: none;
}
.camera-countdown span {
  font-size: 12px;
}
.camera-live-label {
  position: absolute;
  right: 12px;
  top: 12px;
}
@media (max-width: 599px) {
  .camera-overlay-label {
    font-size: 9px;
  }
}
</style>
