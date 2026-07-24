import { Notify, Loading } from 'quasar'
import { api } from 'src/boot/axios'
import config from 'src/config.js'

// Response examples used by the existing non-production test-mode workflow.
import ivScore from 'src/response-examples/iv-score.json'
import clinicalScore from 'src/response-examples/clinical-score.json'
import treatmentPlan from 'src/response-examples/treatment-plans.json'
import nurseRunSheet from 'src/response-examples/nurse-runsheet-single-session.json'
import nurseRunSheetMulti from 'src/response-examples/nurse-runsheet-multi-session.json'

/**
 * Pinned for repeatable production behaviour. Change only after regression testing.
 * The Pigmentation store also passes its model explicitly, so it must use the same ID.
 */
const DEFAULT_MODEL = 'gpt-5.5-2026-04-23'
const DEFAULT_REQUEST_TIMEOUT_MS = 600_000
const DEFAULT_PROMPT_CACHE_KEY = 'ai-aesthetics-assessment-key-v1-ai'
const DEFAULT_PROMPT_CACHE_RETENTION = '24h'

const GPT_5_REASONING_MODEL_PATTERN = /^gpt-5(?:\.|-|$)/i
const VALID_REASONING_EFFORTS = new Set(['none', 'low', 'medium', 'high', 'xhigh', 'max'])

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function normalizePositiveInteger(value) {
  const number = Number(value)
  if (!Number.isInteger(number) || number <= 0) return undefined
  return number
}

function normalizeFiniteNumber(value, min, max) {
  const number = Number(value)
  if (!Number.isFinite(number) || number < min || number > max) return undefined
  return number
}

function stringifyMetadataValue(value) {
  if (typeof value === 'string') return value
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }
  return String(value)
}

/**
 * OpenAI metadata supports a small set of short string key/value pairs.
 * This function also prevents accidental transport of undefined values.
 */
function normalizeMetadata(metadata) {
  if (!isPlainObject(metadata)) return undefined

  const normalizedEntries = Object.entries(metadata)
    .filter(([key, value]) => nonEmptyString(String(key)) && value !== undefined && value !== null)
    .slice(0, 16)
    .map(([key, value]) => [
      String(key).trim().slice(0, 64),
      stringifyMetadataValue(value).slice(0, 512),
    ])

  return normalizedEntries.length ? Object.fromEntries(normalizedEntries) : undefined
}

function normalizeReasoning(options) {
  const suppliedReasoning = isPlainObject(options?.reasoning) ? { ...options.reasoning } : {}
  const requestedEffort = options?.reasoning_effort ?? suppliedReasoning.effort
  const effort = nonEmptyString(requestedEffort)
    ? String(requestedEffort).trim().toLowerCase()
    : undefined

  if (effort && VALID_REASONING_EFFORTS.has(effort)) {
    suppliedReasoning.effort = effort
  } else {
    delete suppliedReasoning.effort
  }

  return Object.keys(suppliedReasoning).length ? suppliedReasoning : undefined
}

function normalizeTextOptions(options) {
  const text = isPlainObject(options?.text) ? { ...options.text } : {}

  if (nonEmptyString(options?.verbosity) && !text.verbosity) {
    const verbosity = String(options.verbosity).trim().toLowerCase()
    if (['low', 'medium', 'high'].includes(verbosity)) text.verbosity = verbosity
  }

  return Object.keys(text).length ? text : undefined
}

function isResponsesEnvelope(data) {
  return (
    isPlainObject(data) &&
    (data.object === 'response' ||
      Array.isArray(data.output) ||
      typeof data.output_text === 'string' ||
      ['queued', 'in_progress', 'completed', 'incomplete', 'failed', 'cancelled'].includes(
        data.status,
      ))
  )
}

function collectResponseContent(data) {
  const textChunks = []
  const refusalChunks = []

  if (nonEmptyString(data?.output_text)) {
    textChunks.push(data.output_text)
  }

  for (const outputItem of Array.isArray(data?.output) ? data.output : []) {
    for (const contentItem of Array.isArray(outputItem?.content) ? outputItem.content : []) {
      if (
        contentItem?.type === 'output_text' &&
        typeof contentItem.text === 'string' &&
        contentItem.text.trim()
      ) {
        textChunks.push(contentItem.text)
        continue
      }

      // Some backend serializers omit the content type but preserve the text field.
      if (typeof contentItem?.text === 'string' && contentItem.text.trim()) {
        textChunks.push(contentItem.text)
        continue
      }

      if (contentItem?.type === 'refusal' && nonEmptyString(contentItem.refusal)) {
        refusalChunks.push(contentItem.refusal)
      }
    }
  }

  return {
    text: [...new Set(textChunks.map((chunk) => chunk.trim()))].join('\n').trim(),
    refusal: [...new Set(refusalChunks.map((chunk) => chunk.trim()))].join('\n').trim(),
  }
}

function parseJsonIfPossible(value) {
  if (value && typeof value === 'object') return value
  if (typeof value !== 'string') return value

  const original = value.trim()
  if (!original) return original

  const withoutFence = original
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  try {
    return JSON.parse(withoutFence)
  } catch {
    return original
  }
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.error?.message ||
    error?.message ||
    'Error generating response'
  )
}

function normalizeError(error) {
  return {
    message: getErrorMessage(error),
    status: error?.response?.status ?? error?.status ?? null,
    code: error?.response?.data?.error?.code ?? error?.code ?? null,
    type: error?.response?.data?.error?.type ?? error?.type ?? null,
    incomplete_reason:
      error?.incomplete_reason ?? error?.response?.data?.incomplete_details?.reason ?? null,
    response_id: error?.response_id ?? error?.response?.data?.id ?? null,
    requested_max_output_tokens:
      error?.requested_max_output_tokens ?? error?.response?.data?.max_output_tokens ?? null,
    usage: error?.usage ?? error?.response?.data?.usage ?? null,
  }
}

function createIncompleteResponseError(data) {
  const reason = data?.incomplete_details?.reason || 'unknown_reason'
  const requestedLimit = data?.max_output_tokens ?? null
  const stage = data?.metadata?.stage || null
  const suffix = [
    stage ? `stage=${stage}` : null,
    requestedLimit ? `max_output_tokens=${requestedLimit}` : null,
  ]
    .filter(Boolean)
    .join(', ')

  const error = new Error(
    `The AI response was incomplete: ${reason}${suffix ? ` (${suffix})` : ''}.`,
  )
  error.name = 'IncompleteAIResponseError'
  error.code = 'response_incomplete'
  error.type = 'response_incomplete'
  error.incomplete_reason = reason
  error.response_id = data?.id || null
  error.requested_max_output_tokens = requestedLimit
  error.usage = data?.usage || null
  return error
}

function buildResponseRequestBody(convId, input, model, options = {}) {
  if (!Array.isArray(input) || input.length === 0) {
    throw new Error('The AI request input must be a non-empty array.')
  }

  const maxOutputTokens = normalizePositiveInteger(options.max_output_tokens ?? options.max_tokens)
  const reasoning = normalizeReasoning(options)
  const text = normalizeTextOptions(options)
  const metadata = normalizeMetadata(options.metadata)

  const body = {
    model,
    input,
    prompt_cache_retention:
      options.prompt_cache_retention === false
        ? undefined
        : options.prompt_cache_retention || DEFAULT_PROMPT_CACHE_RETENTION,
    prompt_cache_key: options.prompt_cache_key || DEFAULT_PROMPT_CACHE_KEY,
    ...(maxOutputTokens ? { max_output_tokens: maxOutputTokens } : {}),
    ...(reasoning ? { reasoning } : {}),
    ...(text ? { text } : {}),
    ...(metadata ? { metadata } : {}),
    ...(typeof options.store === 'boolean' ? { store: options.store } : {}),
    ...(nonEmptyString(options.safety_identifier)
      ? { safety_identifier: options.safety_identifier.trim() }
      : {}),
  }

  // GPT-5 reasoning models are controlled with reasoning.effort. Avoid forwarding
  // sampling parameters that may be unsupported or conflict with reasoning mode.
  if (!GPT_5_REASONING_MODEL_PATTERN.test(model)) {
    const temperature = normalizeFiniteNumber(options.temperature, 0, 2)
    if (temperature !== undefined) body.temperature = temperature
  }

  // Remove undefined properties before transport.
  return Object.fromEntries(Object.entries(body).filter(([, value]) => value !== undefined))
}

function unwrapResponsePayload(rawData) {
  // Support either a raw OpenAI Responses envelope or a backend wrapper around it.
  if (isResponsesEnvelope(rawData?.response)) return rawData.response
  if (isResponsesEnvelope(rawData?.data)) return rawData.data
  return rawData
}

function readCompletedResponse(rawData) {
  const data = unwrapResponsePayload(rawData)

  // Some server implementations already return the parsed model JSON. Preserve it.
  if (!isResponsesEnvelope(data)) return parseJsonIfPossible(data)

  if (data.status === 'failed' || data.status === 'cancelled') {
    throw new Error(data?.error?.message || `The AI response ${data.status}.`)
  }

  if (data.status === 'incomplete') {
    throw createIncompleteResponseError(data)
  }

  if (data.status === 'queued' || data.status === 'in_progress') {
    throw new Error(
      `The AI response is still ${data.status}; the backend must wait for completion before returning it.`,
    )
  }

  const { text, refusal } = collectResponseContent(data)
  if (!text) {
    if (refusal) throw new Error(`The AI declined the request: ${refusal}`)
    throw new Error('The AI response contained no assistant text.')
  }

  return parseJsonIfPossible(text)
}

export function useOpenAI() {
  // 1. Get or create a conversation.
  const getOrCreateConversation = async (pid, convId, name, assessmentId) => {
    try {
      if (convId) return convId

      const res = await api.post('ai/conversations', {
        patient_id: pid,
        patient_name: name,
        assessment_id: `${assessmentId}`,
      })

      const data = res.data
      if (!data?.id) {
        throw new Error(`Conversation creation failed: ${JSON.stringify(data)}`)
      }

      return data.id
    } catch (error) {
      console.error(error)
      Notify.create({
        type: 'negative',
        message: getErrorMessage(error) || 'Failed to create conversation',
      })
      throw error
    }
  }

  // 2. Send a Responses API request through the application's backend.
  const runResponse = async (convId, input, MODEL = DEFAULT_MODEL, options = {}) => {
    // --- EXISTING TEST MODE INTERCEPTION ---
    if (config.is_test_mode) {
      console.log('🚧 TEST MODE: Intercepting OpenAI Call')
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const inputStr = JSON.stringify(input)

      if (inputStr.includes('Image 1 = UV MODE')) {
        console.log('🚧 TEST MODE: Returning mock for IV Scoring Stage 1')
        return { message: 'Stage 1 mock complete' }
      }

      if (
        inputStr.includes('Stage 1 mock complete') ||
        inputStr.includes('"message":"Stage 1 mock complete"')
      ) {
        console.log('🚧 TEST MODE: Returning mock for IV Scoring Stage 2')
        return { message: 'Stage 2 mock complete' }
      }

      if (
        inputStr.includes('Stage 2 mock complete') ||
        inputStr.includes('"message":"Stage 2 mock complete"')
      ) {
        console.log('🚧 TEST MODE: Returning IV Score (Dermatological)', ivScore)
        return ivScore
      }

      if (inputStr.includes('AI_IV_ClinicalScoring')) {
        console.log('🚧 TEST MODE: Returning Clinical Score', clinicalScore)
        return clinicalScore
      }

      if (
        inputStr.includes('AI_IV_TreatmentGeneration') ||
        inputStr.includes('AI_IV_TreatmentGeneration Engine v2.1')
      ) {
        console.log('🚧 TEST MODE: Returning Treatment Plan', treatmentPlan)
        return treatmentPlan
      }

      if (inputStr.includes('Nurse Run Sheet') || inputStr.includes('clinic_sop_defaults')) {
        if (inputStr.includes('P1-W') || inputStr.includes('plan_option')) {
          console.log('🚧 TEST MODE: Returning Multi-Session Nurse Run Sheet', nurseRunSheetMulti)
          return nurseRunSheetMulti
        }
        console.log('🚧 TEST MODE: Returning Nurse Run Sheet', nurseRunSheet)
        return nurseRunSheet
      }

      console.warn('🚧 TEST MODE: No specific mock matched. Returning empty object.')
      return {}
    }

    // --- REAL API CALL ---
    let body = null
    try {
      const model = nonEmptyString(MODEL) ? MODEL.trim() : DEFAULT_MODEL
      body = buildResponseRequestBody(convId, input, model, options)
      const timeout = normalizePositiveInteger(options.timeout_ms) || DEFAULT_REQUEST_TIMEOUT_MS

      const res = await api.post('ai/responses', body, { timeout })
      const result = readCompletedResponse(res.data)

      // const responseEnvelope = unwrapResponsePayload(res.data)
      console.log('AI response completed', res.data)
      // console.log('AI response completed', {
      //   model,
      //   stage: body.metadata?.stage || null,
      //   responseType: typeof result,
      //   responseId: responseEnvelope?.id || null,
      //   maxOutputTokens: responseEnvelope?.max_output_tokens ?? body.max_output_tokens ?? null,
      //   usage: responseEnvelope?.usage || null,
      // })

      return result
    } catch (error) {
      const normalized = normalizeError(error)
      console.error('AI response error:', error)

      const stage = body?.metadata?.stage || null
      const message =
        normalized.incomplete_reason === 'max_output_tokens'
          ? `AI output limit reached${stage ? ` during ${stage}` : ''}. Increase the stage token budget or reduce reasoning/output verbosity.`
          : normalized.message

      Notify.create({
        type: 'negative',
        message,
      })

      return { error: normalized }
    } finally {
      Loading.hide()
    }
  }

  return {
    getOrCreateConversation,
    runResponse,
  }
}
