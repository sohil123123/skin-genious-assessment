import test from 'node:test'
import assert from 'node:assert/strict'
import {
  cameraErrorMessage,
  createCameraSession,
  captureVideoFrame,
  cameraMatches,
  zoneCameraLock,
} from '../src/utils/lhr/camera.js'

function deferred() {
  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function fakeStream(settings = {}) {
  const listeners = new Map()
  const track = {
    label: 'Test camera',
    readyState: 'live',
    stopped: 0,
    stop() {
      this.stopped += 1
      this.readyState = 'ended'
    },
    getSettings: () => ({ deviceId: 'device-1', width: 1920, height: 1080, ...settings }),
    addEventListener: (name, callback) => listeners.set(name, callback),
    removeEventListener: (name) => listeners.delete(name),
  }
  return {
    getTracks: () => [track],
    getVideoTracks: () => [track],
    track,
    disconnect: () => listeners.get('ended')?.(),
  }
}

test('insecure contexts never request camera permission', async () => {
  let calls = 0
  const session = createCameraSession({
    secure: false,
    mediaDevices: {
      getUserMedia: () => {
        calls += 1
      },
    },
  })
  assert.equal(await session.start('rear'), null)
  assert.equal(calls, 0)
  assert.match(session.getState().error, /HTTPS or localhost/)
})

test('missing API and denied permissions give actionable errors', async () => {
  const missing = createCameraSession({ mediaDevices: {} })
  await missing.start('front')
  assert.match(missing.getState().error, /no camera API/)
  const denied = createCameraSession({
    mediaDevices: {
      getUserMedia: async () => {
        throw { name: 'NotAllowedError' }
      },
    },
  })
  await denied.start('front')
  assert.equal(denied.getState().stream, null)
  assert.equal(denied.getState().status, 'error')
  assert.match(denied.getState().error, /denied/)
  assert.match(cameraErrorMessage({ name: 'OverconstrainedError' }), /Front camera/)
})

test('requests only video and preserves the selected physical camera', async () => {
  const requests = []
  const streams = [
    fakeStream({ facingMode: 'environment' }),
    fakeStream({ facingMode: 'user', deviceId: 'device-2' }),
  ]
  const session = createCameraSession({
    mediaDevices: {
      getUserMedia: async (constraints) => {
        requests.push(constraints)
        return streams[requests.length - 1]
      },
    },
  })
  await session.start('rear')
  assert.equal(requests[0].audio, false)
  assert.deepEqual(requests[0].video.facingMode, { exact: 'environment' })
  assert.equal(session.getState().camera.profile, 'rear')
  await session.start('front', 'device-2')
  assert.equal(streams[0].track.stopped, 1)
  assert.deepEqual(requests[1].video.deviceId, { exact: 'device-2' })
  assert.equal(session.getState().camera.profile, 'front')
  assert.equal(session.getState().camera.mirrored, false)
  session.stop()
  assert.equal(streams[1].track.stopped, 1)
})

test('late permission grant after leaving capture immediately releases the stream', async () => {
  const pending = deferred()
  const stream = fakeStream()
  const session = createCameraSession({ mediaDevices: { getUserMedia: () => pending.promise } })
  const opening = session.start('rear')
  assert.equal(session.getState().status, 'opening')
  session.stop()
  pending.resolve(stream)
  assert.equal(await opening, null)
  assert.equal(stream.track.stopped, 1)
  assert.equal(session.getState().status, 'idle')
  assert.equal(session.getState().stream, null)
})

test('a stale camera request cannot replace a newer stream', async () => {
  const pending = [deferred(), deferred()]
  const streams = [fakeStream(), fakeStream({ facingMode: 'user' })]
  let request = 0
  const session = createCameraSession({
    mediaDevices: { getUserMedia: () => pending[request++].promise },
  })
  const first = session.start('rear')
  const second = session.start('front')
  pending[1].resolve(streams[1])
  await second
  pending[0].resolve(streams[0])
  await first
  assert.equal(session.getState().stream, streams[1])
  assert.equal(streams[0].track.stopped, 1)
  assert.equal(streams[1].track.stopped, 0)
  session.stop()
})

test('a stale permission rejection does not overwrite the current camera', async () => {
  const pending = deferred()
  const stream = fakeStream()
  let calls = 0
  const session = createCameraSession({
    mediaDevices: {
      getUserMedia: () => (++calls === 1 ? pending.promise : Promise.resolve(stream)),
    },
  })
  const first = session.start('rear')
  await session.start('front')
  pending.reject({ name: 'NotAllowedError' })
  await first
  assert.equal(session.getState().status, 'live')
  assert.equal(session.getState().error, '')
  session.stop()
})

test('camera disconnect releases tracks and reports the disconnect', async () => {
  const stream = fakeStream()
  const session = createCameraSession({ mediaDevices: { getUserMedia: async () => stream } })
  await session.start('front')
  stream.disconnect()
  assert.equal(stream.track.stopped, 1)
  assert.equal(session.getState().status, 'error')
  assert.equal(session.getState().stream, null)
  assert.match(session.getState().error, /disconnected/)
})

test('camera locking ignores demo/uploads and prevents switching profile or physical camera', () => {
  const rear = { profile: 'rear', deviceId: 'rear-1' }
  const captures = {
    'face:0:A': { source: 'demo' },
    'face:0:B': { source: 'upload' },
    'underarms:0:A': { source: 'camera', camera: rear },
  }
  assert.equal(zoneCameraLock(captures, 'face'), null)
  assert.deepEqual(zoneCameraLock(captures, 'underarms'), rear)
  assert.equal(cameraMatches(rear, { profile: 'front', deviceId: 'rear-1' }), false)
  assert.equal(cameraMatches(rear, { profile: 'rear', deviceId: 'rear-2' }), false)
  assert.equal(cameraMatches(rear, rear), true)
  assert.equal(cameraMatches(rear, null), false)
  delete captures['underarms:0:A']
  assert.equal(zoneCameraLock(captures, 'underarms'), null)
})

test('frame grab preserves full sensor orientation and aspect ratio without overlays', async () => {
  const video = { readyState: 2, videoWidth: 3840, videoHeight: 2160 }
  const drawn = []
  const blob = new Blob(['frame'], { type: 'image/jpeg' })
  const canvas = {
    getContext: () => ({ drawImage: (...args) => drawn.push(args) }),
    toBlob: (done, mime, quality) => {
      assert.equal(mime, 'image/jpeg')
      assert.equal(quality, 0.9)
      done(blob)
    },
  }
  const result = await captureVideoFrame(video, { createCanvas: () => canvas })
  assert.deepEqual(drawn, [[video, 0, 0, 1920, 1080]])
  assert.equal(result.blob, blob)
  assert.equal(result.width, 1920)
  assert.equal(result.height, 1080)
})

test('unready video and failed image encoding cannot produce a captured frame', async () => {
  await assert.rejects(
    captureVideoFrame({ readyState: 1, videoWidth: 0, videoHeight: 0 }),
    /preview is ready/,
  )
  const video = { readyState: 2, videoWidth: 640, videoHeight: 480 }
  const canvas = { getContext: () => ({ drawImage() {} }), toBlob: (done) => done(null) }
  await assert.rejects(
    captureVideoFrame(video, { createCanvas: () => canvas }),
    /could not be captured/,
  )
})
