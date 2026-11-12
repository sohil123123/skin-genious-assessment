import test from 'node:test'
import assert from 'node:assert/strict'
import { captureSlots } from '../src/utils/lhr/assessment.js'
import {
  normaliseInputs,
  beforeCaptureReady,
  beforeProfileReady,
  stagedSessionStep,
} from '../src/utils/lhr/workflow.js'
import { assessCapturePixels, framingGuide } from '../src/utils/lhr/captureQuality.js'
import { buildLhrAiRequest, runLhrAi } from '../src/utils/lhr/ai.js'
import { progressChart } from '../src/utils/lhr/progress.js'

function fixture() {
  const inputs = normaliseInputs({
    zones: { underarms: { mode: 'imaged' }, chest: { mode: 'imaged' } },
  })
  const captures = Object.fromEntries(
    captureSlots(inputs)
      .filter((slot) => slot.shot === 'A')
      .map(({ key }, i) => [key, { id: i + 1 }]),
  )
  const profile = {
    phototype: 'IV',
    hair_character: 'Dark, coarse',
    zones: [
      { zone_id: 'underarms', qc_pass: true, requires_recapture: false },
      { zone_id: 'chest', qc_pass: true, requires_recapture: false },
    ],
  }
  return { inputs, captures, profile }
}
test('all zones complete before-shave captures and an actual AI profile are required before advancing', () => {
  const { inputs, captures, profile } = fixture()
  assert.equal(beforeCaptureReady(inputs, captures), true)
  assert.equal(beforeProfileReady(profile, inputs, captures), true)
  assert.equal(beforeProfileReady(null, inputs, captures), false)
  assert.equal(beforeProfileReady({ ...profile, phototype: null }, inputs, captures), false)
  const key = Object.keys(captures)[0]
  captures[key].pending = true
  assert.equal(beforeCaptureReady(inputs, captures), false)
  captures[key].pending = false
  profile.zones[0].requires_recapture = true
  assert.equal(beforeProfileReady(profile, inputs, captures), false)
})
test('staged resume distinguishes before, after, prescription, therapist and report steps', () => {
  const { profile } = fixture()
  assert.equal(stagedSessionStep({ status: 'draft' }, true), 2)
  assert.equal(stagedSessionStep({ status: 'draft', profile }, true), 3)
  assert.equal(stagedSessionStep({ status: 'prescribed' }, true), 4)
  assert.equal(stagedSessionStep({ status: 'assigned' }, true), 5)
  assert.equal(stagedSessionStep({ status: 'completed' }, true), 6)
})
function pixels(value) {
  const width = 64,
    height = 48,
    data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const v = typeof value === 'function' ? value(x, y) : value
      data[i] = data[i + 1] = data[i + 2] = v
      data[i + 3] = 255
    }
  return { width, height, data }
}
test('camera quality accepts detailed steady portrait and landscape frames and rejects dark, clipped, blurred or moving frames', () => {
  const detail = pixels((x, y) => ((x + y) % 2 ? 90 : 170))
  const good = assessCapturePixels(detail, 1280, 720)
  assert.equal(good.pass, true)
  assert.equal(assessCapturePixels(detail, 720, 1280, good.pixels).pass, true)
  assert.equal(assessCapturePixels(detail, 320, 240).pass, false)
  assert.equal(assessCapturePixels(pixels(10), 1280, 720).pass, false)
  assert.equal(assessCapturePixels(pixels(255), 1280, 720).pass, false)
  assert.equal(assessCapturePixels(pixels(128), 1280, 720).pass, false)
  assert.equal(
    assessCapturePixels(
      pixels((x, y) => ((x + y) % 2 ? 170 : 90)),
      1280,
      720,
      good.pixels,
    ).pass,
    false,
  )
  assert.notEqual(framingGuide('underarms').path, framingGuide('face').path)
})
test('frontend profile uses the shared Responses flow and each zone adds appropriate analysis context', async () => {
  const context = {
    model: 'gpt-4.1',
    context_token: 'fixture',
    input: [
      {
        role: 'user',
        content: [{ type: 'input_text', text: JSON.stringify({ zone_id: 'underarms' }) }],
      },
    ],
  }
  const request = buildLhrAiRequest('profile', context)
  assert.match(request.instructions, /burning and tanning history/)
  assert.equal(request.text.format.schema.properties.phototype.enum.includes(null), true)
  assert.match(buildLhrAiRequest('analysis', context).instructions, /deodorant residue/)
  let count = 0
  const api = {
    post: async (url) => {
      count++
      if (count === 1) {
        assert.equal(url, 'lhr/sessions/7/profile')
        return { data: context }
      }
      if (count === 2) {
        assert.equal(url, 'ai/responses')
        return {
          data: {
            status: 'completed',
            output: [{ content: [{ type: 'output_text', text: '{"phototype":null}' }] }],
          },
        }
      }
      assert.equal(url, 'lhr/sessions/7/profile')
      return { data: { session: { id: 7 } } }
    },
  }
  assert.equal((await runLhrAi(api, { sessionId: 7, task: 'profile' })).data.session.id, 7)
})
test('progress charts contain only recorded numeric measurements, with no fabricated zero for a missing value', () => {
  const result = progressChart({
    sessions: [
      { session_id: 1, session_number: 1, density: 100 },
      { session_id: 2, session_number: 2, density: null },
      { session_id: 3, session_number: 3, density: 70 },
    ],
  })
  assert.deepEqual(
    result.points.map((point) => point.density),
    [100, 70],
  )
  assert.equal(progressChart({ sessions: [] }).points.length, 0)
})
