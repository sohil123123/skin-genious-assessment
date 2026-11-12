import test from 'node:test'
import assert from 'node:assert/strict'
import {
  activeTreatmentStep,
  zoneTreatmentForm,
  zoneSafetyReady,
  zoneCompletionReady,
} from '../src/utils/lhr/treatmentSteps.js'
const face = () => ({
  zone_id: 'face',
  label: 'Face',
  status: 'pending',
  checks: { identity: 'Face identity', eyewear: 'Face eye protection', prep_0: 'Face preparation' },
  record: {},
})
const underarms = () => ({
  zone_id: 'underarms',
  label: 'Underarms',
  status: 'pending',
  checks: {
    identity: 'Underarm identity',
    eyewear: 'Underarm protection',
    prep_0: 'Underarm preparation',
  },
  record: {},
})

test('the active treatment area advances only after saved server completion', () => {
  const steps = [face(), underarms()]
  assert.equal(activeTreatmentStep(steps).zone_id, 'face')
  steps[0].status = 'in_progress'
  assert.equal(activeTreatmentStep(steps).zone_id, 'face')
  steps[0].status = 'completed'
  assert.equal(activeTreatmentStep(steps).zone_id, 'underarms')
  steps[1].status = 'completed'
  assert.equal(activeTreatmentStep(steps), null)
})
test('every zone starts with its own safety checklist and patch findings', () => {
  const first = face()
  const form = zoneTreatmentForm(first)
  form.checklist = { identity: true, eyewear: true, prep_0: true }
  assert.equal(zoneSafetyReady(first, form), false)
  form.test_patch_notes = 'Face patch reviewed'
  assert.equal(zoneSafetyReady(first, form), true)
  const secondForm = zoneTreatmentForm(underarms())
  assert.deepEqual(secondForm.checklist, {})
  assert.equal(secondForm.test_patch_notes, '')
  assert.equal(zoneSafetyReady(underarms(), secondForm), false)
  assert.deepEqual(first.record, {})
})
test('saved active records resume without losing notes, checks or a valid zero endpoint', () => {
  const step = {
    ...face(),
    status: 'in_progress',
    record: {
      checklist: { identity: true },
      test_patch_notes: 'Recorded patch',
      notes: 'Observed result',
      endpoint_grade: 0,
      regrowth_days: 0,
    },
  }
  const form = zoneTreatmentForm(step)
  assert.equal(form.endpoint_grade, 0)
  assert.equal(form.regrowth_days, 0)
  assert.equal(form.notes, 'Observed result')
  form.checklist.identity = false
  assert.equal(step.record.checklist.identity, true)
  assert.equal(form.treatment_confirmed, false)
})
test('zone completion requires starting, a grade, explicit completion and adverse-response notes when needed', () => {
  const step = { ...face(), status: 'in_progress' }
  const form = zoneTreatmentForm(step)
  form.treatment_confirmed = true
  assert.equal(zoneCompletionReady(step, form), false)
  form.endpoint_grade = 0
  assert.equal(zoneCompletionReady(step, form), true)
  form.endpoint_grade = 3
  assert.equal(zoneCompletionReady(step, form), false)
  form.adverse_events = 'Reaction and actions documented'
  assert.equal(zoneCompletionReady(step, form), true)
  assert.equal(zoneCompletionReady(face(), form), false)
  form.treatment_confirmed = false
  assert.equal(zoneCompletionReady(step, form), false)
})
