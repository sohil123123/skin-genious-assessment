import test from 'node:test'
import assert from 'node:assert/strict'
import { requireSavedTreatmentSessions } from '../src/utils/facial/treatmentPersistence.js'

const plan = { treatment_plan: { treatments: [{ session_number: 1 }, { session_number: 2 }] } }
test('save must confirm database IDs for both detailed course sessions', () => {
  for (const treatments of [[], [{ session_number: 1 }], [{ session_number: 1, id: 31 }]])
    assert.throws(() => requireSavedTreatmentSessions({ treatment_sessions: { treatments } }, plan), /did not confirm/)
  const treatments = [{ session_number: 1, id: 31 }, { session_number: 2, id: 32 }]
  assert.equal(requireSavedTreatmentSessions({ treatment_sessions: { treatments } }, plan), treatments)
})
test('an empty or missing save response cannot advance the plan screen', () => {
  assert.throws(() => requireSavedTreatmentSessions(undefined, plan), /did not confirm/)
  assert.throws(() => requireSavedTreatmentSessions({ treatment_sessions: {} }, plan), /did not confirm/)
})
