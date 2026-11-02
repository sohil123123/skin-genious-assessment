import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createDraft,
  LHR_ZONES,
  captureSlots,
  reviewReady,
  safetyComplete,
  demoResult,
} from '../src/utils/lhr/assessment.js'

function readyImagedDraft() {
  const draft = createDraft({ user_id: '42' })
  Object.assign(draft.consent, { treatment: true, imaging: true, ai: true })
  draft.safety.reviewed = true
  const captures = Object.fromEntries(captureSlots(draft).map(({ key }) => [key, { demo: true }]))
  return { draft, captures, results: { underarms: demoResult('underarms') } }
}

test('all nine requested zones have distinct before/after slots and bilateral limb views', () => {
  const draft = createDraft()
  draft.zones = Object.fromEntries(LHR_ZONES.map(({ id }) => [id, { mode: 'imaged' }]))
  const slots = captureSlots(draft)
  assert.equal(LHR_ZONES.length, 9)
  assert.equal(new Set(slots.map(({ key }) => key)).size, slots.length)
  assert.equal(slots.filter(({ zoneId }) => zoneId === 'face').length, 6)
  assert.equal(slots.filter(({ zoneId }) => zoneId === 'arms').length, 16)
  assert.equal(slots.filter(({ zoneId }) => zoneId === 'legs').length, 16)
})

test('review requires treatment, imaging and AI consent for imaged zones; marketing is optional', () => {
  const { draft, captures, results } = readyImagedDraft()
  assert.equal(reviewReady(draft, captures, results), true)
  for (const key of ['treatment', 'imaging', 'ai']) {
    draft.consent[key] = false
    assert.equal(reviewReady(draft, captures, results), false, key)
    draft.consent[key] = true
  }
  assert.equal(draft.consent.marketing, false)
  assert.equal(reviewReady(draft, captures, results), true)
})

test('incomplete views or pending analysis cannot reach review', () => {
  const { draft, captures, results } = readyImagedDraft()
  assert.equal(reviewReady(draft, captures, {}), false)
  delete captures['underarms:1:B']
  assert.equal(reviewReady(draft, captures, results), false)
})

test('a stale manual selection cannot bypass image capture or consent', () => {
  const { draft, captures, results } = readyImagedDraft()
  draft.zones.underarms = { mode: 'manual', grade: 0 }
  assert.equal(captureSlots(draft).length, 4)
  assert.equal(reviewReady(draft, {}, results), false)
  draft.consent.imaging = false
  assert.equal(reviewReady(draft, captures, results), false)
})

test('every selected zone requires images and a response', () => {
  const { draft, captures, results } = readyImagedDraft()
  draft.zones.chest = { mode: 'imaged' }
  assert.equal(reviewReady(draft, captures, results), false)
  for (const slot of captureSlots(draft).filter(({ zoneId }) => zoneId === 'chest'))
    captures[slot.key] = { demo: true }
  assert.equal(reviewReady(draft, captures, results), false)
  results.chest = demoResult('chest')
  assert.equal(reviewReady(draft, captures, results), true)
  draft.zones = {}
  assert.equal(reviewReady(draft, captures, results), false)
})

test('safety screen rejects unreviewed, empty, negative, fractional or invalid day answers', () => {
  const draft = createDraft()
  assert.equal(safetyComplete(draft), false)
  draft.safety.reviewed = true
  for (const value of ['', null, -1, 1.5, 'bad', 4000]) {
    draft.safety.daysSinceSun = value
    assert.equal(safetyComplete(draft), false, String(value))
  }
  draft.safety.daysSinceSun = 0
  assert.equal(safetyComplete(draft), true)
})

test('test state is isolated between patients and preserves LHR context without server writes', () => {
  const first = createDraft({
    user_id: '42',
    assessment_id: '7',
    appointment_id: '9',
  })
  first.zones.chest = { mode: 'imaged' }
  first.consent.imaging = true
  const next = createDraft({ user_id: '43' })
  assert.equal(first.assessment_type, 'lhr')
  assert.equal(first.assessment_id, '7')
  assert.equal(first.appointment_id, '9')
  assert.equal(next.zones.underarms.mode, 'imaged')
  assert.equal(next.zones.chest, undefined)
  assert.equal(next.consent.imaging, false)
})
