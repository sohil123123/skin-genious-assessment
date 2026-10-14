import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import { requireSavedTreatmentSessions } from '../../src/utils/facial/treatmentPersistence.js'

function setup(post) {
  const code = fs.readFileSync(new URL('../../src/stores/assessmentStore.js', import.meta.url), 'utf8')
    .replace(/^import .*$/gm, '').replace('export const useAssessmentStore =', 'globalThis.definition =')
  const sandbox = { defineStore: (_name, value) => value, api: { post },
    Notify: { create() {} }, console: { log() {}, error() {} }, requireSavedTreatmentSessions }
  vm.runInNewContext(code, sandbox)
  const state = { assessmentData: { treatment_sessions: { treatments: [{ id: 2, post_diagnosis: { existing: true } }] } },
    setData(value) { Object.assign(this.assessmentData, value) } }
  return { actions: sandbox.definition.actions, state }
}

test('failed checkpoint saving rejects the automatic path and preserves the existing report', async () => {
  const { actions, state } = setup(async () => { throw new Error('Database unavailable') })
  await assert.rejects(actions.saveTreatmentSessionPostAssessment.call(state, 2, { post_diagnosis: { replacement: true } }, { throwOnError: true }), /Database unavailable/)
  assert.deepEqual(state.assessmentData.treatment_sessions.treatments[0].post_diagnosis, { existing: true })
})

test('checkpoint state changes only after the API acknowledges the correct persisted session', async () => {
  let acknowledge
  const { actions, state } = setup(() => new Promise(resolve => { acknowledge = resolve }))
  const saving = actions.saveTreatmentSessionPostAssessment.call(state, 2, { post_diagnosis: { replacement: true } }, { throwOnError: true })
  assert.deepEqual(state.assessmentData.treatment_sessions.treatments[0].post_diagnosis, { existing: true })
  acknowledge({ data: { results: { id: 2, post_diagnosis: { replacement: true } } } })
  await saving
  assert.equal(state.assessmentData.treatment_sessions.treatments[0].post_diagnosis.replacement, true)
})

test('a misleading save acknowledgment for a different session cannot release a checkpoint', async () => {
  const { actions, state } = setup(async () => ({ data: { results: { id: 999 } } }))
  await assert.rejects(actions.saveTreatmentSessionPostAssessment.call(state, 2, { post_diagnosis: {} }, { throwOnError: true }), /did not confirm/)
})

test('continuation UI requires database IDs for every new session before accepting ready', async () => {
  const { actions, state } = setup(async () => ({ data: { results: { status: 'ready', assessment: {
    treatment_sessions: { treatments: [{ id: 3, session_number: 3 }] },
  } } } }))
  await assert.rejects(actions.completeTreatmentCourseContinuation.call(state, 2, 'token', {
    treatment_plan: { treatments: [{ session_number: 3 }, { session_number: 4 }] },
  }, {}), /did not confirm saving/)
})

test('an old request finishing after navigation cannot replace another active patient assessment', async () => {
  const { actions, state } = setup(async () => ({ data: { results: { status: 'ready', assessment: {
    id: 123, treatment_sessions: { treatments: [{ id: 300, session_number: 3 }, { id: 400, session_number: 4 }] },
  } } } }))
  state.assessmentData.id = 999
  const result = await actions.completeTreatmentCourseContinuation.call(state, 2, 'token', {
    treatment_plan: { treatments: [{ session_number: 3 }, { session_number: 4 }] },
  }, {})
  assert.equal(result.status, 'ready')
  assert.equal(state.assessmentData.id, 999)
  assert.equal(state.assessmentData.treatment_sessions.treatments[0].id, 2)
})
