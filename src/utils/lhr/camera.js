export function cameraErrorMessage(error) {
  switch (error?.name) {
    case 'NotAllowedError':
      return 'Camera access was denied. Allow camera access in your browser, then try again.'
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'The selected camera is unavailable. On a laptop, try Front camera. If this zone is camera-locked, remove its camera images before choosing another camera.'
    case 'NotReadableError':
    case 'AbortError':
      return 'The camera could not start. Close other apps or tabs using it, then try again.'
    case 'SecurityError':
      return 'Live capture requires HTTPS or localhost. Open the assessment on a secure address.'
    default:
      return error?.message || 'Unable to open the camera. Try again or choose a local image.'
  }
}

// Owns camera tracks and pending permission requests independently of the Vue view.
export function createCameraSession({
  mediaDevices = globalThis.navigator?.mediaDevices,
  secure = globalThis.isSecureContext !== false,
  onChange = () => {},
} = {}) {
  let version = 0
  let current = null
  let unsubscribe = () => {}
  let state = { status: 'idle', stream: null, camera: null, error: '' }
  const publish = (patch) => {
    state = { ...state, ...patch }
    onChange(state)
  }
  const release = (stream) => stream?.getTracks().forEach((track) => track.stop())

  function stop() {
    version += 1
    unsubscribe()
    unsubscribe = () => {}
    const stream = current
    current = null
    release(stream)
    publish({ status: 'idle', stream: null, camera: null, error: '' })
  }

  async function start(profile, deviceId = '') {
    stop()
    const request = version
    publish({ status: 'opening' })
    if (!secure || !mediaDevices?.getUserMedia) {
      const error = !secure
        ? cameraErrorMessage({ name: 'SecurityError' })
        : 'This browser has no camera API. Try a supported browser over HTTPS or choose a local image.'
      publish({ status: 'error', error })
      return null
    }
    try {
      const stream = await mediaDevices.getUserMedia({
        audio: false,
        video: {
          ...(deviceId
            ? { deviceId: { exact: deviceId } }
            : {
                facingMode: profile === 'rear' ? { exact: 'environment' } : { ideal: 'user' },
              }),
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      })
      if (request !== version) {
        release(stream)
        return null
      }
      const track = stream.getVideoTracks()[0]
      if (!track || track.readyState === 'ended') {
        release(stream)
        throw new Error('The camera did not provide a live video track. Try another camera.')
      }
      current = stream
      const settings = track.getSettings?.() || {}
      const actualProfile =
        settings.facingMode === 'environment'
          ? 'rear'
          : settings.facingMode === 'user'
            ? 'front'
            : profile
      const ended = () => {
        if (current !== stream) return
        stop()
        publish({
          status: 'error',
          error: 'The camera disconnected. Reconnect it and open the camera again.',
        })
      }
      track.addEventListener('ended', ended)
      unsubscribe = () => track.removeEventListener('ended', ended)
      publish({
        status: 'live',
        stream,
        error: '',
        camera: {
          profile: actualProfile,
          deviceId: settings.deviceId || deviceId,
          label: track.label || '',
          width: settings.width || null,
          height: settings.height || null,
          mirrored: false,
        },
      })
      return stream
    } catch (error) {
      if (request === version) {
        unsubscribe()
        unsubscribe = () => {}
        release(current)
        current = null
        publish({ status: 'error', stream: null, camera: null, error: cameraErrorMessage(error) })
      }
      return null
    }
  }

  return { start, stop, getState: () => state }
}

export function zoneCameraLock(captures, zoneId) {
  return (
    Object.entries(captures).find(
      ([key, image]) => key.startsWith(`${zoneId}:`) && image.source === 'camera',
    )?.[1].camera || null
  )
}

export function cameraMatches(lock, camera) {
  return (
    !lock ||
    (!!camera &&
      lock.profile === camera.profile &&
      (!lock.deviceId || camera.deviceId === lock.deviceId))
  )
}

export async function captureVideoFrame(
  video,
  { createCanvas = () => document.createElement('canvas'), maxWidth = 1920 } = {},
) {
  if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
    throw new Error('Wait until the live camera preview is ready before capturing.')
  }
  const canvas = createCanvas()
  canvas.width = Math.min(maxWidth, video.videoWidth)
  canvas.height = Math.round((video.videoHeight * canvas.width) / video.videoWidth)
  const context = canvas.getContext('2d')
  if (!context)
    throw new Error('This browser cannot capture a camera frame. Choose a local image instead.')
  // Only the front preview is mirrored with CSS. Raw sensor pixels are already unmirrored.
  // Alignment overlays are separate DOM elements and are never baked into the photograph.
  context.drawImage(video, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9))
  if (!blob) throw new Error('The camera frame could not be captured. Please try again.')
  return { blob, width: canvas.width, height: canvas.height }
}
