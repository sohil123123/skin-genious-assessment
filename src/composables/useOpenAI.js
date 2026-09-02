import { Notify, Loading } from 'quasar'
import { api } from 'src/boot/axios'
import config from 'src/config.js'

// Existing non-pigmentation test-mode fixtures.
import ivScore from 'src/response-examples/iv-score.json'
import clinicalScore from 'src/response-examples/clinical-score.json'
import treatmentPlan from 'src/response-examples/treatment-plans.json'
import nurseRunSheet from 'src/response-examples/nurse-runsheet-single-session.json'
import nurseRunSheetMulti from 'src/response-examples/nurse-runsheet-multi-session.json'

const DEFAULT_MODEL = import.meta.env.VITE_OPENAI_MODEL || 'gpt-5.2'
const DEFAULT_TIMEOUT_MS = 600_000
const DEFAULT_CACHE_KEY = 'ai-aesthetics-assessment-key-v2-6'
const VALID_REASONING = new Set(['none', 'low', 'medium', 'high', 'xhigh'])

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function messageFromError(error) {
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.error?.message ||
    error?.message ||
    'Error generating AI response'
  )
}

function createRequestId() {
  const suffix =
    typeof globalThis?.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `ai-${suffix}`.slice(0, 250)
}

function normalizeMetadata(metadata) {
  if (!isObject(metadata)) return undefined
  const entries = Object.entries(metadata)
    .filter(([key, value]) => key && value !== undefined && value !== null)
    .slice(0, 16)
    .map(([key, value]) => [String(key).slice(0, 64), String(value).slice(0, 512)])
  return entries.length ? Object.fromEntries(entries) : undefined
}

function parseJsonIfPossible(value) {
  if (value && typeof value === 'object') return value
  if (typeof value !== 'string') return value
  const text = value
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
  try {
    return JSON.parse(text)
  } catch {
    return value
  }
}

function collectOutputText(data) {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim()
  }

  const chunks = []
  const refusals = []
  for (const item of Array.isArray(data?.output) ? data.output : []) {
    for (const part of Array.isArray(item?.content) ? item.content : []) {
      if (part?.type === 'refusal' && typeof part.refusal === 'string') {
        refusals.push(part.refusal)
      } else if (typeof part?.text === 'string' && part.text.trim()) {
        chunks.push(part.text.trim())
      }
    }
  }

  if (!chunks.length && refusals.length) {
    throw new Error(`The AI declined the request: ${refusals.join(' ')}`)
  }
  return [...new Set(chunks)].join('\n').trim()
}

function readResponse(raw) {
  const data = raw?.response?.output ? raw.response : raw?.data?.output ? raw.data : raw
  if (!isObject(data) || (!Array.isArray(data.output) && typeof data.output_text !== 'string')) {
    return parseJsonIfPossible(data)
  }

  if (data.status === 'incomplete') {
    const reason = data?.incomplete_details?.reason || 'unknown_reason'
    const error = new Error(`The AI response was incomplete: ${reason}.`)
    error.code = 'response_incomplete'
    error.incomplete_reason = reason
    error.response_id = data.id || null
    error.usage = data.usage || null
    throw error
  }
  if (data.status === 'failed' || data.status === 'cancelled') {
    throw new Error(data?.error?.message || `The AI response ${data.status}.`)
  }
  if (data.status === 'queued' || data.status === 'in_progress') {
    throw new Error(`The backend returned an AI response that is still ${data.status}.`)
  }

  const text = collectOutputText(data)
  if (!text) throw new Error('The AI response contained no output text.')
  return parseJsonIfPossible(text)
}

function buildRequestBody(convId, input, model, options) {
  const useConversation = options.use_conversation === true
  const body = {
    model,
    ...(useConversation && convId ? { conversation: convId } : {}),
    input,
    prompt_cache_key: options.prompt_cache_key || DEFAULT_CACHE_KEY,
    prompt_cache_retention: options.prompt_cache_retention || '24h',
  }

  const maxTokens = Number(options.max_output_tokens ?? options.max_tokens)
  if (Number.isInteger(maxTokens) && maxTokens > 0) body.max_output_tokens = maxTokens

  const effort = String(options.reasoning_effort || options.reasoning?.effort || '').toLowerCase()
  if (VALID_REASONING.has(effort)) body.reasoning = { effort }

  const verbosity = String(options.verbosity || options.text?.verbosity || '').toLowerCase()
  if (['low', 'medium', 'high'].includes(verbosity)) body.text = { verbosity }

  const metadata = normalizeMetadata(options.metadata)
  if (metadata) body.metadata = metadata

  // Temperature is deliberately not sent for GPT-5 reasoning calls.
  if (!/^gpt-5(?:\.|-|$)/i.test(model) && Number.isFinite(Number(options.temperature))) {
    body.temperature = Number(options.temperature)
  }

  return body
}

export function useOpenAI() {
  const getOrCreateConversation = async (pid, convId, name, assessmentId) => {
    if (convId) return convId
    const res = await api.post('ai/conversations', {
      patient_id: pid,
      patient_name: name,
      assessment_id: `${assessmentId}`,
    })
    if (!res.data?.id) throw new Error('Conversation creation failed.')
    return res.data.id
  }

  const runResponse = async (convId, input, MODEL = DEFAULT_MODEL, options = {}) => {
    if (config.is_test_mode) {
      const inputStr = JSON.stringify(input)
      await new Promise((resolve) => setTimeout(resolve, 500))
      if (inputStr.includes('Image 1 = UV MODE')) return { message: 'Stage 1 mock complete' }
      if (inputStr.includes('Stage 1 mock complete')) return { message: 'Stage 2 mock complete' }
      if (inputStr.includes('Stage 2 mock complete')) return ivScore
      if (inputStr.includes('AI_IV_ClinicalScoring')) return clinicalScore
      if (inputStr.includes('AI_IV_TreatmentGeneration')) return treatmentPlan
      if (inputStr.includes('Nurse Run Sheet') || inputStr.includes('clinic_sop_defaults')) {
        return inputStr.includes('P1-W') ? nurseRunSheetMulti : nurseRunSheet
      }
      return {}
    }

    const requestId = createRequestId()
    const body = buildRequestBody(convId, input, MODEL, options)
    const maxRetries = Number(options.max_retries ?? 1)
    const timeoutMs = Number(options.timeout_ms) || DEFAULT_TIMEOUT_MS

    const isRetryable = (error) => {
      if (error?.code === 'ECONNABORTED' || error?.code === 'ERR_CANCELED') return true
      const status = error?.response?.status
      return status && (status === 429 || status >= 500)
    }

    try {
      let lastError = null
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const attemptTimeout = attempt === 0 ? timeoutMs : Math.min(timeoutMs * 1.5, DEFAULT_TIMEOUT_MS)
          const response = await api.post('ai/responses', body, {
            timeout: attemptTimeout,
            headers: { 'X-Client-Request-Id': `${requestId}-a${attempt}` },
          })
          const result = readResponse(response.data)
          const usage = response.data?.usage || response.data?.response?.usage || null
          console.info('[useOpenAI] completed', {
            requestId,
            attempt,
            stage: options.metadata?.stage || null,
            model: MODEL,
            stateless: !body.conversation,
            maxOutputTokens: body.max_output_tokens || null,
            usage,
          })
          return result
        } catch (error) {
          lastError = error
          if (attempt < maxRetries && isRetryable(error)) {
            const backoffMs = Math.min(2000 * Math.pow(2, attempt), 8000)
            console.warn('[useOpenAI] retryable error, backing off', {
              requestId,
              attempt,
              stage: options.metadata?.stage || null,
              code: error?.code || null,
              status: error?.response?.status || null,
              backoffMs,
            })
            await new Promise((resolve) => setTimeout(resolve, backoffMs))
            continue
          }
          break
        }
      }

      // Format a user-friendly error from the last failure
      const isTimeout = lastError?.code === 'ECONNABORTED' || lastError?.code === 'ERR_CANCELED'
      const message = isTimeout
        ? `AI response timed out after ${Math.round(timeoutMs / 1000)}s. The request may still be processing — please wait a moment and retry.`
        : messageFromError(lastError)
      console.error('[useOpenAI] response error', {
        requestId,
        stage: options.metadata?.stage || null,
        message,
        responseId: lastError?.response_id || null,
        usage: lastError?.usage || null,
      })
      Notify.create({ type: 'negative', message })
      return {
        error: {
          message,
          status: lastError?.response?.status || null,
          code: lastError?.code || null,
          incomplete_reason: lastError?.incomplete_reason || null,
          response_id: lastError?.response_id || null,
          usage: lastError?.usage || null,
        },
      }
    } finally {
      Loading.hide()
    }
  }

  return { getOrCreateConversation, runResponse }
}
