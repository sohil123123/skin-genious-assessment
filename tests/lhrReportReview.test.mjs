import test from 'node:test'
import assert from 'node:assert/strict'
import { confirmLhrReportAndExit } from '../src/utils/lhr/reportReview.js'

const options = (session, extra = {}) => ({
  getSession: () => session, canManage: true, crmUrl: 'https://crm.example.test/',
  exit: () => assert.fail('Unexpected navigation'), ...extra,
})

test('pending review waits for successful persistence before navigation', async () => {
  const session = { id: 5, status: 'awaiting_review', report: {} }
  const events = []
  let release
  const saved = new Promise((resolve) => { release = resolve })
  const config = options(session, {
    exit: (url) => events.push(url),
    review: async () => {
      events.push('saving')
      await saved
      session.status = 'completed'
      return { ...session }
    },
  })
  const result = confirmLhrReportAndExit(config)
  assert.deepEqual(events, ['saving'])
  release()
  await result
  assert.deepEqual(events, ['saving', 'https://crm.example.test/'])
})

test('failed review stays on the assessment', async () => {
  await assert.rejects(confirmLhrReportAndExit(options({ status: 'awaiting_review', report: {} }, {
    review: async () => { throw new Error('Stale revision') },
  })), /Stale revision/)
})

test('completed report exits without submitting another review', async () => {
  let destination
  await confirmLhrReportAndExit(options({ status: 'completed', report: {} }, {
    review: () => assert.fail('Duplicate review'), exit: (url) => { destination = url },
  }))
  assert.equal(destination, 'https://crm.example.test/')
})

test('unfinished, unauthorised and unconfigured exits do not navigate or submit review', async () => {
  for (const override of [
    { getSession: () => ({ status: 'in_progress', report: {} }) },
    { getSession: () => ({ status: 'completed', report: null }) },
    { canManage: false }, { crmUrl: '' }, { crmUrl: 'javascript:alert(1)' },
  ]) {
    await assert.rejects(confirmLhrReportAndExit(options({ status: 'completed', report: {} }, override)))
  }
})
test('a handled API failure, unfinished response or changed active session cannot exit', async () => {
  const original = { id: 5, status: 'awaiting_review', report: {} }
  await confirmLhrReportAndExit(options(original, { review: async () => undefined }))
  await assert.rejects(confirmLhrReportAndExit(options(original, { review: async () => ({ ...original }) })), /not been finalised/)
  await assert.rejects(confirmLhrReportAndExit(options(original, { review: async () => ({ id: 6, status: 'completed' }) })), /not been finalised/)
  let current = original
  await confirmLhrReportAndExit(options(original, {
    getSession: () => current,
    review: async () => {
      current = { id: 6, status: 'completed', report: {} }
      return { ...original, status: 'completed' }
    },
  }))
  current = original
  await confirmLhrReportAndExit(options(original, {
    getSession: () => current,
    review: async () => {
      current = null
      return { ...original, status: 'completed' }
    },
  }))
})
