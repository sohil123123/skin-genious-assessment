import test from 'node:test'
import assert from 'node:assert/strict'
import { createAutoCaptureGate } from '../src/utils/lhr/autoCapture.js'
const observe = (gate, now, options = {}) =>
  gate.observe({ key: 'underarms:0:before', ready: true, now, ...options })
test('two uninterrupted seconds of fresh passing frames trigger exactly one capture', () => {
  const gate = createAutoCaptureGate()
  for (const now of [0, 350, 700, 1050, 1400, 1750]) assert.equal(observe(gate, now).trigger, false)
  assert.equal(observe(gate, 2100).trigger, true)
  assert.equal(observe(gate, 2450).trigger, false)
  assert.equal(observe(gate, 2800).phase, 'captured')
})
test('blur, movement, revoked alignment, uploads and disabled mode cancel the countdown via readiness', () => {
  const gate = createAutoCaptureGate()
  observe(gate, 0)
  observe(gate, 700)
  assert.equal(observe(gate, 1000, { ready: false }).phase, 'waiting')
  assert.equal(observe(gate, 1100).remainingMs, 2000)
  for (const now of [1450, 1800, 2150, 2500, 2850]) assert.equal(observe(gate, now).trigger, false)
  assert.equal(observe(gate, 3200).trigger, true)
})
test('stalled camera frames, background timer gaps and clock reversal never finish a stale countdown', () => {
  for (const next of [3000, -1]) {
    const gate = createAutoCaptureGate()
    observe(gate, 0)
    observe(gate, 350)
    const state = observe(gate, next)
    assert.equal(state.trigger, false)
    assert.equal(state.remainingMs, 2000)
  }
  assert.equal(observe(createAutoCaptureGate(), NaN).phase, 'waiting')
})
test('view and before/after changes discard the previous countdown and capture reservation', () => {
  const gate = createAutoCaptureGate()
  observe(gate, 0)
  observe(gate, 700)
  const next = observe(gate, 1050, { key: 'underarms:1:before' })
  assert.equal(next.remainingMs, 2000)
  gate.reserve('underarms:1:before')
  assert.equal(observe(gate, 1400, { key: 'underarms:1:before' }).trigger, false)
  assert.equal(observe(gate, 1750, { key: 'underarms:1:after' }).remainingMs, 2000)
})
test('manual capture, stopping and retry preserve the single-shot latch until explicitly rearmed', () => {
  const gate = createAutoCaptureGate()
  gate.reserve('underarms:0:before')
  gate.cancel()
  assert.equal(observe(gate, 5000).phase, 'captured')
  gate.reset('underarms:0:before')
  for (const now of [5000, 5500, 6000, 6500]) assert.equal(observe(gate, now).trigger, false)
  assert.equal(observe(gate, 7000).trigger, true)
})
