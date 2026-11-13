import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildLhrAiRequest,
  parseLhrAiResponse,
  runLhrAi,
  LHR_AI_SCHEMAS,
} from '../src/utils/lhr/ai.js'

const result = {
  zone_id: 'underarms',
  terminal_follicle_density_per_cm2: null,
  mean_shaft_calibre_um: null,
}
const response = (value = result) => ({
  id: 'resp-fixture',
  status: 'completed',
  output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(value) }] }],
})
const context = {
  model: 'gpt-4.1',
  context_token: 'signed-fixture',
  input: [
    { role: 'user', content: [{ type: 'input_image', file_id: 'file-fixture', detail: 'high' }] },
  ],
}

test('each frontend LHR task builds the standard Responses contract with its own prompt and strict schema', () => {
  for (const task of ['analysis', 'prescription', 'report']) {
    const request = buildLhrAiRequest(task, context)
    assert.equal(request.model, context.model)
    assert.equal(request.input, context.input)
    assert.equal(request.text.format.strict, true)
    assert.equal(request.text.format.schema, LHR_AI_SCHEMAS[task])
    assert.equal(request.metadata.stage, `lhr_${task}`)
    assert.ok(request.instructions.length > 100)
    assert.equal('context_token' in request, false)
    assert.equal('api_key' in request, false)
  }
  assert.throws(() => buildLhrAiRequest('unknown', context))
  assert.throws(() => buildLhrAiRequest('analysis', {}))
})

test('completed responses keep unmeasurable metrics null and reject refusal, incomplete and malformed output', () => {
  assert.deepEqual(parseLhrAiResponse(response()), result)
  for (const value of [null, [], 'invalid'])
    assert.throws(() => parseLhrAiResponse(response(value)))
  assert.throws(() => parseLhrAiResponse({ ...response(), status: 'incomplete' }), /incomplete/)
  assert.throws(
    () => parseLhrAiResponse({ status: 'completed', output: [{ content: [{ type: 'refusal' }] }] }),
    /could not assess/,
  )
  assert.throws(() => parseLhrAiResponse({ status: 'completed', output: [] }), /invalid/)
})

test('frontend prepares saved context, calls the facial Responses gateway, then persists result with matching context', async () => {
  for (const [task, suffix] of [
    ['analysis', 'analyse/underarms'],
    ['prescription', 'prescription'],
    ['report', 'report'],
  ]) {
    const calls = []
    const saved = { session: { revision: 2 } }
    const api = {
      post: async (...args) => {
        calls.push(args)
        return { data: [context, response(), saved][calls.length - 1] }
      },
    }
    const actual = await runLhrAi(api, { sessionId: 7, task, zone: 'underarms' })
    assert.deepEqual(actual.data, saved)
    assert.equal(calls[0][0], `lhr/sessions/7/${suffix}`)
    assert.deepEqual(calls[0][1], { prepare: true })
    assert.equal(calls[1][0], 'ai/responses')
    assert.equal(calls[1][1].instructions, buildLhrAiRequest(task, context).instructions)
    assert.equal(calls[2][0], calls[0][0])
    assert.deepEqual(calls[2][1], {
      context_token: context.context_token,
      result,
      model: context.model,
      response_id: 'resp-fixture',
    })
  }
})

test('failed or incomplete AI requests never commit a result', async () => {
  for (const failure of [new Error('offline'), { status: 'incomplete', output: [] }]) {
    let calls = 0
    const api = {
      post: async () => {
        calls++
        if (calls === 1) return { data: context }
        if (failure instanceof Error) throw failure
        return { data: failure }
      },
    }
    await assert.rejects(runLhrAi(api, { sessionId: 7, task: 'analysis', zone: 'underarms' }))
    assert.equal(calls, 2)
  }
})

test('saving conflicts surface without silently regenerating or overwriting newer session data', async () => {
  let calls = 0
  const conflict = Object.assign(new Error('Photos changed'), { response: { status: 409 } })
  const api = {
    post: async () => {
      calls++
      if (calls === 1) return { data: context }
      if (calls === 2) return { data: response() }
      throw conflict
    },
  }
  await assert.rejects(
    runLhrAi(api, { sessionId: 7, task: 'analysis', zone: 'underarms' }),
    (error) => error === conflict,
  )
  assert.equal(calls, 3)
})

test('SHR saved context selects console schema and leaves generic prescriptions unchanged', () => {
  const shr = {
    ...context,
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: JSON.stringify({ inputs: { machine: { control_profile: 'shr_console' } } }),
          },
        ],
      },
    ],
  }
  const request = buildLhrAiRequest('prescription', shr)
  const item = request.text.format.schema.properties.zones.items
  assert.equal(item.required.includes('candidate_id'), true)
  assert.equal(item.required.includes('hold_reason'), true)
  assert.equal('settings' in item.properties, false)
  assert.match(request.instructions, /decision_matrix/)
  assert.match(request.instructions, /SOFTWARE TEST ONLY/)
  assert.match(request.instructions, /not a prescribed duration/)
  assert.equal(
    buildLhrAiRequest('prescription', context).text.format.schema,
    LHR_AI_SCHEMAS.prescription,
  )
  assert.ok(
    LHR_AI_SCHEMAS.prescription.properties.zones.items.properties.settings.required.includes(
      'pulse_width_ms',
    ),
  )
})
