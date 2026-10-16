import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import { computed, ref, reactive } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import routes from '../../src/router/routes.js'

const source = fs.readFileSync(new URL('../../src/pages/IndexPage.vue', import.meta.url), 'utf8')
const selectionCode = source.slice(source.indexOf('const sessionId = computed('), source.indexOf('function getPreviousScores()'))

function setup() {
  const router = createRouter({ history: createMemoryHistory(), routes })
  const route = reactive(router.resolve('/edit/596/step-6/426/426?view=scan'))
  const assessmentData = ref({ treatment_sessions: { treatments: [
    { id: '1001', session_number: 1, title: 'First session' },
    { id: 1002, session_number: 2, title: 'Second session' },
  ] } })
  const calls = []
  const sandbox = { computed, route, assessmentData, router: {
    async replace(destination) {
      const resolved = router.resolve(destination)
      calls.push(resolved)
      route.query = resolved.query
    },
  } }
  vm.runInNewContext(selectionCode + '\nglobalThis.selection = { sessionId, currentSession, reassessmentSessionOptions, selectReassessmentSession }', sandbox)
  return { ...sandbox.selection, calls }
}

test('assessment-only reassessment requires explicit selection and does not infer a session from appointment ID', () => {
  const state = setup()
  assert.equal(state.sessionId.value, null)
  assert.equal(state.currentSession.value, null)
  assert.equal(state.reassessmentSessionOptions.value[0].value, 1001)
  assert.equal(state.calls.length, 0)
})

test('choosing session 1 preserves patient, assessment and appointment while adding its database ID', async () => {
  const state = setup()
  await state.selectReassessmentSession(1001)
  const destination = state.calls[0]
  assert.equal(destination.query.session_id, '1001')
  assert.equal(destination.query.view, 'scan')
  assert.equal(destination.params.user_id, '596')
  assert.equal(destination.params.assessment_id, '426')
  assert.equal(destination.params.appointment_id, '426')
  assert.equal(destination.params.step, 'step-6')
  assert.equal(state.sessionId.value, 1001)
  assert.equal(state.currentSession.value.session_number, 1)
})

test('a session outside the loaded assessment cannot be selected', async () => {
  const state = setup()
  await state.selectReassessmentSession(9999)
  assert.equal(state.calls.length, 0)
})
