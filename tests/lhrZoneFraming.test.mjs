import test from 'node:test'
import assert from 'node:assert/strict'
import {
  framingRequest,
  ZONE_FRAMING_GUIDANCE,
  zoneFrameAccepted,
  reviewZoneCandidate,
  frameChanged,
  verifyZoneFrame,
} from '../src/utils/lhr/zoneFraming.js'
const pass = {
  zone_visible: true,
  skin_visible: true,
  framing_ok: true,
  confidence: 0.95,
  reason: 'Exposed underarm is central and clearly identifiable.',
}
const dataUrl = 'data:image/jpeg;base64,candidate-fixture'
test('each selected zone supplies anatomical criteria and underarm rejects portraits and room backgrounds', () => {
  for (const zoneId of Object.keys(ZONE_FRAMING_GUIDANCE)) {
    const request = framingRequest({ zoneId, viewIndex: 0, shot: 'A', imageDataUrl: dataUrl })
    assert.equal(request.zone_id, zoneId)
    assert.equal(request.image_data_url, dataUrl)
    assert.equal(request.text.format.strict, true)
    assert.ok(request.instructions.includes(ZONE_FRAMING_GUIDANCE[zoneId]))
  }
  assert.match(ZONE_FRAMING_GUIDANCE.underarms, /upper arm raised/)
  assert.match(ZONE_FRAMING_GUIDANCE.underarms, /portrait, head, wall, bed, clothed torso/)
  assert.throws(() =>
    framingRequest({ zoneId: 'unknown', viewIndex: 0, shot: 'A', imageDataUrl: dataUrl }),
  )
})
test('background, clothing, ambiguous anatomy and malformed responses cannot approve capture', () => {
  assert.equal(zoneFrameAccepted(pass), true)
  for (const field of ['zone_visible', 'skin_visible', 'framing_ok']) {
    assert.equal(zoneFrameAccepted({ ...pass, [field]: false }), false)
    assert.equal(zoneFrameAccepted({ ...pass, [field]: 'true' }), false)
  }
  for (const confidence of [undefined, null, 0.8, '0.99', NaN, Infinity, 1.5])
    assert.equal(zoneFrameAccepted({ ...pass, confidence }), false)
  assert.equal(zoneFrameAccepted({ ...pass, reason: '' }), false)
  assert.equal(zoneFrameAccepted(null), false)
})
test('only the actual verified candidate is returned for saving, with no rejected or stale candidate', async () => {
  const candidate = new Blob(['frozen-camera-bytes'])
  let current = true
  const accepted = await reviewZoneCandidate(
    candidate,
    async (blob) => {
      assert.equal(blob, candidate)
      return pass
    },
    () => current,
  )
  assert.equal(accepted.status, 'accepted')
  assert.equal(accepted.candidate, candidate)
  const rejected = await reviewZoneCandidate(
    candidate,
    async () => ({ ...pass, zone_visible: false }),
    () => current,
  )
  assert.equal(rejected.status, 'rejected')
  assert.equal(rejected.candidate, undefined)
  const stale = await reviewZoneCandidate(
    candidate,
    async () => {
      current = false
      return pass
    },
    () => current,
  )
  assert.equal(stale.status, 'stale')
  assert.equal(stale.candidate, undefined)
  await assert.rejects(
    reviewZoneCandidate(
      candidate,
      async () => {
        throw new Error('network failed')
      },
      () => true,
    ),
    /network/,
  )
})
test('rejected static frames do not rearm until framing visibly changes', () => {
  const previous = new Float32Array(20).fill(90)
  assert.equal(frameChanged(previous, previous.slice()), false)
  assert.equal(frameChanged(previous, new Float32Array(20).fill(96)), false)
  assert.equal(frameChanged(previous, new Float32Array(20).fill(120)), true)
  assert.equal(frameChanged(null, previous), false)
})
test('the authenticated framing request sends the frozen JPEG once and propagates cancellation and incomplete results', async () => {
  const signal = new AbortController().signal
  let calls = 0
  const api = {
    post: async (url, body, options) => {
      calls++
      assert.equal(url, 'lhr/sessions/5/framing')
      assert.equal(body.image_data_url, dataUrl)
      assert.equal(options.signal, signal)
      return {
        data: {
          status: 'completed',
          output: [{ content: [{ type: 'output_text', text: JSON.stringify(pass) }] }],
        },
      }
    },
  }
  const result = await verifyZoneFrame(
    api,
    {
      sessionId: 5,
      zoneId: 'underarms',
      viewIndex: 1,
      shot: 'B',
      blob: new Blob(['fixture']),
      signal,
    },
    async () => dataUrl,
  )
  assert.equal(zoneFrameAccepted(result), true)
  assert.equal(calls, 1)
  const cancelled = new AbortController()
  cancelled.abort()
  await assert.rejects(
    verifyZoneFrame(api, { sessionId: 5, signal: cancelled.signal }, async () => dataUrl),
    /cancelled/,
  )
  assert.equal(calls, 1)
  await assert.rejects(
    verifyZoneFrame(
      { post: async () => ({ data: { status: 'incomplete', output: [] } }) },
      { sessionId: 5, zoneId: 'underarms', viewIndex: 0, shot: 'A' },
      async () => dataUrl,
    ),
    /incomplete/,
  )
})
