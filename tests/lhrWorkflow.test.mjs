import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normaliseInputs,
  inputsEquivalent,
  captureReady,
  sessionStep,
} from '../src/utils/lhr/workflow.js'
import { captureSlots, LHR_ZONES } from '../src/utils/lhr/assessment.js'

function fixture() {
  const inputs = normaliseInputs({
    zones: { underarms: { mode: 'imaged' } },
    plannedSessions: 8,
    phototype: 'IV',
    hair: 'Dark, coarse',
    safety: { reviewed: true, daysSinceSun: 21 },
    consent: { treatment: true, imaging: true, ai: true },
  })
  const captures = Object.fromEntries(
    captureSlots(inputs).map(({ key }, index) => [key, { id: index + 1 }]),
  )
  const results = {
    underarms: {
      qc_pass: true,
      requires_recapture: false,
      terminal_follicle_density_per_cm2: null,
      mean_shaft_calibre_um: null,
    },
  }
  return { inputs, captures, results }
}
test('empty database values and form values compare without creating false unsaved changes', () => {
  const { inputs } = fixture()
  const form = structuredClone(inputs)
  form.safety.notes = ''
  form.machine = []
  form.safety.daysSinceSun = '21'
  assert.equal(inputsEquivalent(inputs, form), true)
  form.safety.daysSinceSun = 10
  assert.equal(inputsEquivalent(inputs, form), false)
})
test('review requires server-saved images, not pending or failed local previews', () => {
  const { inputs, captures, results } = fixture()
  assert.equal(captureReady(inputs, captures, results), true)
  const key = Object.keys(captures)[0]
  captures[key].pending = true
  assert.equal(captureReady(inputs, captures, results), false)
  delete captures[key].pending
  captures[key].error = true
  assert.equal(captureReady(inputs, captures, results), false)
  captures[key] = { src: 'blob:local-preview' }
  assert.equal(captureReady(inputs, captures, results), false)
})
test('unmeasurable quantitative values are never substituted with fake numbers', () => {
  const { inputs, captures, results } = fixture()
  assert.equal(captureReady(inputs, captures, results), true)
  assert.equal(results.underarms.terminal_follicle_density_per_cm2, null)
  results.underarms.requires_recapture = true
  assert.equal(captureReady(inputs, captures, results), false)
  results.underarms.requires_recapture = false
  results.underarms.qc_pass = false
  assert.equal(captureReady(inputs, captures, results), false)
})
test('image analysis, consent and safety answers are all required before prescription', () => {
  const { inputs, captures, results } = fixture()
  for (const key of ['treatment', 'imaging', 'ai']) {
    inputs.consent[key] = false
    assert.equal(captureReady(inputs, captures, results), false)
    inputs.consent[key] = true
  }
  inputs.safety.reviewed = false
  assert.equal(captureReady(inputs, captures, results), false)
  inputs.safety.reviewed = true
  inputs.zones.chest = { mode: 'imaged' }
  assert.equal(captureReady(inputs, captures, results), false)
})
test('saved session state resumes at the correct clinic or therapist screen', () => {
  assert.equal(sessionStep('draft'), 1)
  assert.equal(sessionStep('draft', true), 2)
  assert.equal(sessionStep('prescribed'), 3)
  assert.equal(sessionStep('assigned'), 4)
  assert.equal(sessionStep('in_progress'), 4)
  assert.equal(sessionStep('awaiting_review'), 5)
  assert.equal(sessionStep('completed'), 5)
})
test('normalisation always selects image tracking and keeps all requested zones and views', () => {
  const inputs = normaliseInputs({
    zones: Object.fromEntries(LHR_ZONES.map((zone) => [zone.id, { mode: 'manual' }])),
    plannedSessions: 8,
  })
  assert.equal(Object.keys(inputs.zones).length, 9)
  assert.equal(
    Object.values(inputs.zones).every((zone) => zone.mode === 'imaged'),
    true,
  )
  const slots = captureSlots(inputs)
  assert.equal(new Set(slots.map((slot) => slot.key)).size, slots.length)
  assert.equal(slots.filter((slot) => slot.zoneId === 'arms').length, 16)
  assert.equal(slots.filter((slot) => slot.zoneId === 'legs').length, 16)
})
