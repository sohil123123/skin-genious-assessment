import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import { computed, ref } from 'vue'

const storeSource = fs.readFileSync(new URL('../src/stores/assessmentStore.js', import.meta.url), 'utf8')
  .replace(/^import .*$/gm, '').replace('export const useAssessmentStore =', 'globalThis.definition =')

function storeSetup(post) {
  const sandbox = { defineStore: (_id, definition) => definition, api: { post } }
  vm.runInNewContext(storeSource, sandbox)
  const state = { assessmentData: { id: 41, user_id: 21, treatment_sessions: {
    treatments: [{ id: '91', status: 'in_progress' }],
  } } }
  return { state, complete: (context = {}) => sandbox.definition.actions.completeTreatmentSession.call(
    state, 91, { assessmentId: '41', userId: '21', ...context },
  ) }
}

const acknowledgement = { data: { success: true, completion_synced: true, results: {
  id: 91, assessment_id: 41, user_id: 21, status: 'completed',
} } }

test('completion makes one atomic request with or without an appointment ID', async () => {
  for (const appointmentId of [undefined, '72']) {
    const calls = []
    const { complete, state } = storeSetup(async (url, payload) => {
      calls.push({ url, payload })
      return acknowledgement
    })
    await complete({ appointmentId })
    assert.equal(calls.length, 1)
    assert.equal(calls[0].url, '/treatment-sessions/status/91')
    assert.equal(calls[0].payload.assessment_id, 41)
    assert.equal(calls[0].payload.user_id, 21)
    assert.equal(calls[0].payload.appointment_id, appointmentId ? 72 : undefined)
    assert.equal(state.assessmentData.treatment_sessions.treatments[0].status, 'completed')
  }
})

test('a failed, stale or incomplete acknowledgement cannot mark the local session complete', async () => {
  for (const response of [
    { data: { ...acknowledgement.data, completion_synced: undefined } },
    { data: { ...acknowledgement.data, success: false } },
    { data: { ...acknowledgement.data, results: { ...acknowledgement.data.results, id: 92 } } },
    { data: { ...acknowledgement.data, results: { ...acknowledgement.data.results, status: 'in_progress' } } },
  ]) {
    const { complete, state } = storeSetup(async () => response)
    await assert.rejects(complete(), /did not confirm/)
    assert.equal(state.assessmentData.treatment_sessions.treatments[0].status, 'in_progress')
  }
  const { complete } = storeSetup(async () => { throw new Error('Network unavailable') })
  await assert.rejects(complete(), /Network unavailable/)
})

test('stale patient, assessment, session and invalid appointment IDs never send completion requests', async () => {
  let calls = 0
  for (const context of [{ userId: 999 }, { assessmentId: 999 }, { appointmentId: 'undefined' }]) {
    const { complete } = storeSetup(async () => { calls++; return acknowledgement })
    await assert.rejects(complete(context), /Reopen/)
  }
  const { complete, state } = storeSetup(async () => { calls++; return acknowledgement })
  state.assessmentData.treatment_sessions.treatments = [{ id: 1 }]
  await assert.rejects(complete(), /does not match/)
  assert.equal(calls, 0)
})

const pageSource = fs.readFileSync(new URL('../src/pages/TreatmentComplete.vue', import.meta.url), 'utf8')
  .split('<script setup>')[1].split('</script>')[0].replace(/^import .*$/gm, '')

function pageSetup({ save = async () => {}, fetch = async () => {}, persist = () => {} } = {}) {
  let localCompletions = 0
  let dialogs = 0
  const sandbox = {
    computed, ref, onMounted() {},
    useRoute: () => ({ params: { user_id: '21', assessment_id: '41', session_id: '91' } }),
    useAssessmentStore: () => ({ assessmentData: { id: 41 }, getSingleAssessment: fetch, completeTreatmentSession: save }),
    useTreatmentFlowStore: () => ({ markCompleted() { persist(); localCompletions++ } }),
    useQuasar: () => ({ dialog() { dialogs++; return { onOk() { return this }, onCancel() { return this }, onDismiss() { return this } } } }),
    console: { warn() {}, log() {} },
  }
  vm.runInNewContext(pageSource + '\nglobalThis.page = { completeSession, skipAndFinish, completing, completionSaved, completionError }', sandbox)
  return { ...sandbox.page, localCompletions: () => localCompletions, dialogs: () => dialogs }
}

test('the page blocks transfer and local completion until the API finishes', async () => {
  let acknowledge
  const page = pageSetup({ save: () => new Promise(resolve => { acknowledge = resolve }) })
  const saving = page.completeSession()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(page.completing.value, true)
  assert.equal(page.completionSaved.value, false)
  page.skipAndFinish()
  assert.equal(page.dialogs(), 0)
  assert.equal(page.localCompletions(), 0)
  acknowledge()
  await saving
  assert.equal(page.completionSaved.value, true)
  assert.equal(page.localCompletions(), 1)
  page.skipAndFinish()
  assert.equal(page.dialogs(), 1)
})

test('API failure shows a useful error, blocks transfer, and supports retry', async () => {
  let attempts = 0
  const page = pageSetup({ save: async () => {
    if (++attempts === 1) throw { response: { data: { message: 'Validation failed', errors: { appointment_id: ['Wrong appointment'] } } } }
  } })
  await page.completeSession()
  assert.equal(page.completionError.value, 'Wrong appointment')
  assert.equal(page.completionSaved.value, false)
  assert.equal(page.localCompletions(), 0)
  page.skipAndFinish()
  assert.equal(page.dialogs(), 0)
  await page.completeSession()
  assert.equal(page.completionError.value, '')
  assert.equal(page.completionSaved.value, true)
  assert.equal(attempts, 2)
})

test('a failed assessment fetch cannot complete a session using stale data', async () => {
  let saves = 0
  const page = pageSetup({ fetch: async () => { throw new Error('Assessment fetch failed') }, save: async () => { saves++ } })
  await page.completeSession()
  assert.equal(saves, 0)
  assert.equal(page.completionSaved.value, false)
})

test('unavailable browser storage cannot interrupt an acknowledged CRM completion', async () => {
  const page = pageSetup({ persist: () => { throw new Error('QuotaExceededError') } })
  await page.completeSession()
  assert.equal(page.completionSaved.value, true)
  assert.equal(page.completionError.value, '')
})
