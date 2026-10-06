// Legacy v5.6 pipeline: retained for historical tests, no longer imported by
// the active five-light flow. See LIVE_FLOW_RESTORE.md and IndexPage.vue.
import {
  buildTreatmentPlannerInput, finalizeTreatmentPlan, validateClinicTreatmentPlan,
  buildTreatmentGenerationResponseFormat, unpackTreatmentPlannerResponse,
  compileTreatmentPlannerInput,
} from './treatmentClinicRules.js'
import { TREATMENT_KNOWLEDGE_PROMPT, compileTreatmentKnowledgeReference } from './treatmentKnowledge.js'

export const TREATMENT_RUNTIME_CONFIG = Object.freeze({
  model: 'gpt-5.4', reasoningEffort: 'medium', serviceTier: 'auto',
  // User-requested application override: zero disables automatic timeouts.
  deadlineMs: 0, initialCallMs: 0, minRepairBudgetMs: 15000,
  maxRepairs: 1, maxOutputTokensSingle: 14000, maxOutputTokensMultiple: 22000,
  promptCacheKey: 'ai-aesthetics-treatment-v5.6-live-mother-2026-10-06', promptCacheRetention: '24h',
})

// Object-property order is irrelevant to these JSON contracts. Array order,
// especially treatment order and ranked source tables, remains unchanged.
export function stableTreatmentJson(value) {
  const ordered = (item) => Array.isArray(item) ? item.map(ordered)
    : item !== null && typeof item === 'object' ? Object.fromEntries(Object.keys(item).sort().map((name) => [name, ordered(item[name])])) : item
  return JSON.stringify(ordered(value))
}
function cacheFingerprint(text) {
  let hash = 2166136261
  for (let i = 0; i < text.length; i++) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 16777619) }
  return (hash >>> 0).toString(16).padStart(8, '0')
}
export function summarizeTreatmentModelUsage(usage = {}) {
  const input = usage.input_tokens ?? 0
  const cached = usage.input_tokens_details?.cached_tokens ?? 0
  return { input_tokens: input, cached_input_tokens: cached,
    cache_hit_ratio: input > 0 ? cached / input : 0,
    output_tokens: usage.output_tokens ?? 0,
    reasoning_tokens: usage.output_tokens_details?.reasoning_tokens ?? 0 }
}

// Keep the authoritative disk file complete. Remove repeated comparison tables
// only from the model request, retaining all safety gates and the case selection
// objective. Mother maps supply relevant choices without a catalogue audit.
export function compileTreatmentConstraints(constraints) {
  const result = JSON.parse(JSON.stringify(constraints))
  const clinical = result.clinical_constraints || {}
  const hero = clinical.hero_modality_decision_policy
  if (hero?.primary_concern_candidate_framework) delete hero.primary_concern_candidate_framework
  // Legacy checklist names must not leak back into an optimized request.
  delete clinical.required_candidate_comparisons
  if (clinical.energy_vs_peel_priority_framework) delete clinical.energy_vs_peel_priority_framework.comparison_by_concern
  // The mother reference already provides the corrected phenotype examples.
  // The same-session superiority, count, hierarchy, burden and safety rules stay.
  if (clinical.combination_superiority_framework) delete clinical.combination_superiority_framework.examples_of_valid_combination_logic
  if (clinical.supportive_treatment_protocols) clinical.supportive_treatment_protocols.selection_rule =
    'Reserve mandatory care including at least five minutes of lymphatic drainage; select support for a distinct case-specific contribution. Individual ingredient approval does not approve mixtures or redundant delivery. The model explains only material losing contenders in relevant_alternatives; the caller derives inclusion and legacy display summaries from actual selected steps.'
  if (result.availableResources) {
    delete result.availableResources.ivInfusions
    result.availableResources.machines = (result.availableResources.machines || [])
      .filter((machine) => !['IV Infusion Kit','Diode Laser Machine'].includes(machine.name))
    // Names, compositions, depth classes, route restrictions and hardware limits
    // stay. The mother reference already owns mechanisms/strengths/indications.
    const inventoryFields = new Set(['name','type','probes','modes','configurations','key_actives','clinic_depth_class','approved_delivery_routes'])
    for (const [family, items] of Object.entries(result.availableResources)) {
      if (Array.isArray(items)) result.availableResources[family] = items.map((item) =>
        Object.fromEntries(Object.entries(item).filter(([name]) => inventoryFields.has(name))))
        .sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? ''), 'en'))
    }
  }
  return result
}

export function buildTreatmentModelRequest({ systemPrompt, constraints, plannerInput, config = {} }) {
  const settings = { ...TREATMENT_RUNTIME_CONFIG, ...config }
  if (typeof systemPrompt !== 'string' || !systemPrompt.trim()) throw new Error('The replacement SYSTEM_TREATMENT_PLAN_PROMPT is required.')
  if (/TREATMENT PLANNER REVISION[^\n]*V5\.[1-5]\b/.test(systemPrompt))
    throw Object.assign(new Error('Use treatmentPrompt.js v5.6 together with the v5.6 pipeline and rules; the older prompt requests a different output contract.'), { code: 'treatment_input_contract_violation' })
  const reference = compileTreatmentKnowledgeReference(plannerInput)
  const prefix = systemPrompt.includes(TREATMENT_KNOWLEDGE_PROMPT)
    ? systemPrompt.replace(TREATMENT_KNOWLEDGE_PROMPT, reference.stable_prefix)
    : `${systemPrompt}\n\n${reference.stable_prefix}`
  const instructions = `${prefix}\n\nAUTHORITATIVE CLINIC CONSTRAINTS AND AVAILABLE RESOURCES\n${stableTreatmentJson(compileTreatmentConstraints(constraints))}`
  const responseFormat = buildTreatmentGenerationResponseFormat(plannerInput.treatment_plan_type, plannerInput)
  // Preserve case-specific schema guards. Different primary sets form different
  // reusable cache groups; patient identity, scores and map values are excluded.
  const fingerprint = cacheFingerprint(`${settings.model}\0${settings.reasoningEffort}\0${instructions}\0${stableTreatmentJson(responseFormat)}`)
  const request = {
    model: settings.model,
    instructions,
    input: stableTreatmentJson({ ...compileTreatmentPlannerInput(plannerInput), mother_case_reference: reference.case_reference }),
    reasoning: { effort: settings.reasoningEffort },
    text: { verbosity: 'low', format: responseFormat },
    max_output_tokens: plannerInput.treatment_plan_type === 'multiple' ? settings.maxOutputTokensMultiple : settings.maxOutputTokensSingle,
    service_tier: settings.serviceTier,
    prompt_cache_key: `${settings.promptCacheKey}:${fingerprint}`,
  }
  if (settings.promptCacheRetention != null) {
    if (!['in_memory', '24h'].includes(settings.promptCacheRetention)) throw new Error('promptCacheRetention must be in_memory, 24h or null.')
    request.prompt_cache_retention = settings.promptCacheRetention
  }
  return request
}

function parseModelResponse(response) {
  if (response?.error) throw Object.assign(new Error(response.error.message || 'The treatment gateway returned an error.'), response.error)
  if (response?.status === 'incomplete') throw Object.assign(new Error(`Incomplete model response: ${response.incomplete_details?.reason || 'unknown'}.`), { code: 'treatment_response_incomplete' })
  if (response?.status && response.status !== 'completed') throw Object.assign(new Error(`Model response status ${response.status}.`), { code: 'treatment_response_failed' })
  if (response?.treatment_plan || response?.planning_result) return response
  if (typeof response === 'string') return JSON.parse(response)
  const chat = response?.choices?.[0]
  if (chat?.finish_reason === 'length') throw Object.assign(new Error('Incomplete Chat Completions output.'), { code: 'treatment_response_incomplete' })
  if (chat?.message?.refusal) throw Object.assign(new Error('The model refused this request.'), { code: 'treatment_response_refusal' })
  if (chat?.message?.parsed?.treatment_plan || chat?.message?.parsed?.planning_result) return chat.message.parsed
  let output = response?.output_text || chat?.message?.content
  if (Array.isArray(output)) output = output.map((block) => block.text || '').join('')
  if (!output) {
    const blocks = (response?.output || []).flatMap((item) => item.content || [])
    if (blocks.some((block) => block.type === 'refusal')) throw Object.assign(new Error('The model refused this request.'), { code: 'treatment_response_refusal' })
    output = blocks.filter((block) => block.type === 'output_text').map((block) => block.text).join('')
  }
  if (!output) throw Object.assign(new Error('No treatment JSON in model response.'), { code: 'treatment_response_empty' })
  return JSON.parse(output)
}

async function timedCall(callModel, request, timeoutMs) {
  const controller = new AbortController()
  if (timeoutMs === 0) return callModel(request, { signal: controller.signal, timeoutMs: 0, maxRetries: 0 })
  let timer
  try {
    return await Promise.race([
      callModel(request, { signal: controller.signal, timeoutMs, maxRetries: 0 }),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          controller.abort()
          reject(Object.assign(new Error('Treatment generation deadline reached.'), { code: 'treatment_generation_deadline' }))
        }, timeoutMs)
      }),
    ])
  } finally { clearTimeout(timer) }
}

// Integration adapter, not a replacement for an unseen API controller. The caller
// must forward AbortSignal/timeout and disable its SDK/proxy automatic retries.
// No scoring, imaging, catalogue-review or home-care API calls are made here.
export async function generateTreatmentPlan({
  callModel, systemPrompt, constraints, diagnosis, selectedConcerns, treatmentType,
  clinicContext, options = {}, config = {}, existingClinicalValidator = null, onMetrics = null,
}) {
  const settings = { ...TREATMENT_RUNTIME_CONFIG, ...config }
  const start = Date.now()
  const deadline = settings.deadlineMs === 0 ? Infinity : start + settings.deadlineMs
  const remainingTimeout = () => Number.isFinite(deadline) ? Math.max(1, deadline - Date.now()) : 0
  const initialTimeout = settings.initialCallMs === 0 ? remainingTimeout()
    : Math.min(settings.initialCallMs, remainingTimeout() || Infinity)
  const metrics = { revision: settings.promptCacheKey, model: settings.model, calls: 0,
    repaired: false, usage: [], elapsed_ms: 0, status: 'started' }
  let plannerInput
  let request
  let candidate
  let initialValidationError
  let phase = 'preparation'
  try {
    if (typeof callModel !== 'function') throw new Error('Provide the existing server-side model caller as callModel.')
    if (settings.model !== 'gpt-5.4') throw new Error('This package preserves the requested gpt-5.4 model.')
    for (const name of ['deadlineMs', 'initialCallMs']) {
      if (!Number.isFinite(settings[name]) || settings[name] < 0) throw new Error(`${name} must be non-negative; zero disables the timeout.`)
    }
    if (![0,1].includes(settings.maxRepairs)) throw new Error('maxRepairs may only be 0 or 1.')

    plannerInput = buildTreatmentPlannerInput(diagnosis, selectedConcerns, treatmentType, clinicContext, constraints, options)
    const massageBlocks = plannerInput.clinic_treatment_context.clinical_clearance.blocked_steps?.['MASSAGE.LYMPH'] || []
    if (massageBlocks.length) throw Object.assign(new Error('An evaluated clinical constraint blocks the mandatory lymphatic drainage step; clinical review is required.'),
      { code: 'treatment_planning_blocked', details: massageBlocks.map((row) => `${row.condition}: ${row.reason}`) })
    request = buildTreatmentModelRequest({ systemPrompt, constraints, plannerInput, config: settings })
    metrics.instruction_characters = request.instructions.length
    metrics.patient_input_characters = request.input.length
    metrics.prompt_cache_key = request.prompt_cache_key
    metrics.prompt_cache_retention = request.prompt_cache_retention ?? 'default'
    metrics.call_metrics = []
    const recordedCall = async (modelRequest, timeout, kind) => {
      const began = Date.now()
      try {
        const response = await timedCall(callModel, modelRequest, timeout)
        metrics.usage.push(response?.usage || null)
        metrics.call_metrics.push({ kind, elapsed_ms: Date.now() - began,
          status: response?.status || 'returned', ...summarizeTreatmentModelUsage(response?.usage) })
        return response
      } catch (error) {
        metrics.call_metrics.push({ kind, elapsed_ms: Date.now() - began, status: error.code || 'failed' })
        throw error
      }
    }
    const check = async (plan) => {
      let result = validateClinicTreatmentPlan(finalizeTreatmentPlan(plan, plannerInput), plannerInput.clinic_treatment_context, treatmentType, constraints, plannerInput)
      if (!result.error && existingClinicalValidator) {
        result = await timedCall(
          async (_, controls) => existingClinicalValidator(result, { plannerInput, constraints, signal: controls.signal }),
          null, remainingTimeout())
        if (!result?.error) {
          // A gateway/validator must not turn a complete plan into an empty success.
          result = finalizeTreatmentPlan(unpackTreatmentPlannerResponse(result, treatmentType, plannerInput), plannerInput)
          result = validateClinicTreatmentPlan(result, plannerInput.clinic_treatment_context, treatmentType, constraints, plannerInput)
        }
      }
      return result
    }
    phase = 'model_request'
    metrics.calls += 1
    const response = await recordedCall(request, initialTimeout, 'initial')
    phase = 'output_contract'
    const draft = unpackTreatmentPlannerResponse(parseModelResponse(response), treatmentType, plannerInput)
    candidate = finalizeTreatmentPlan(draft, plannerInput)
    phase = 'initial_validation'
    let checked = await check(candidate)
    initialValidationError = checked.error
    if (checked.error) console.error('[facial-treatment-v5.6] initial validation failed', checked.error)
    const remaining = deadline - Date.now()
    // Exactly one targeted content repair, only for a complete parseable plan and
    // within an explicitly configured budget, if any. Never retry a timeout/truncated response.
    if (checked.error && checked.error.code !== 'treatment_input_contract_violation' && settings.maxRepairs === 1 && remaining >= settings.minRepairBudgetMs) {
      metrics.calls += 1
      metrics.repaired = true
      const { treatment_plan: draftRoot } = draft
      const repairRequest = {
        ...request,
        input: stableTreatmentJson({ patient_input: JSON.parse(request.input), invalid_draft: { treatment_plan: draftRoot },
          validation_errors: checked.error.details || [checked.error.message],
          task: 'Correct EVERY listed violation and dependent safety/time/sequence decisions. Preserve valid decisions, case evidence, original scores, named primaries with actual step-target linkage, approved spot product, carbon drying, required energy/broad-peel cooling and one 5-10-minute mandatory drainage step. Spot salicylic remains a two-minute ADJUNCT with no cooling caused by its presence. Return the same planning_result schema: concise decisions, generated procedure instructions, relevant_alternatives only; no eleven-category audit, invented findings, settings or empty success.' }),
      }
      phase = 'repair_request'
      const repair = await recordedCall(repairRequest, remainingTimeout(), 'repair')
      phase = 'repair_output_contract'
      candidate = finalizeTreatmentPlan(unpackTreatmentPlannerResponse(parseModelResponse(repair), treatmentType, plannerInput), plannerInput)
      phase = 'repair_validation'
      checked = await check(candidate)
      if (checked.error) {
        console.error('[facial-treatment-v5.6] repair validation failed', checked.error)
        const repairError = checked.error
        checked = { error: { ...repairError,
          message: `${initialValidationError.message} Repair failed: ${repairError.message}`,
          details: [
            ...(initialValidationError.details || [initialValidationError.message]).map(detail => `Initial draft: ${detail}`),
            ...(repairError.details || [repairError.message]).map(detail => `Repair draft: ${detail}`),
          ], initial_validation: initialValidationError, repair_validation: repairError,
        } }
      }
    }
    if (Date.now() >= deadline) throw Object.assign(new Error('Treatment generation deadline reached.'), { code: 'treatment_generation_deadline' })
    metrics.status = checked.error ? 'validation_failed' : 'completed'
    return checked
  } catch (error) {
    metrics.status = error.code || 'treatment_generation_failed'
    const failure = { code: metrics.status, message: error.message, details: error.details || [],
      phase, response_id: error.response_id || null, status: error.status || null, stack: error.stack }
    if (initialValidationError) {
      failure.initial_validation = initialValidationError
      failure.message = `${initialValidationError.message} Repair failed: ${error.message}`
      failure.details = [
        ...(initialValidationError.details || [initialValidationError.message]).map(detail => `Initial draft: ${detail}`),
        ...(Array.isArray(error.details) ? error.details : [error.message]).map(detail => `Repair draft: ${detail}`),
      ]
    }
    console.error('[facial-treatment-v5.6] generation failed', failure)
    return { error: failure }
  } finally {
    metrics.elapsed_ms = Date.now() - start
    // Metrics contain sizes/usage/status only, never patient text or plan content.
    if (onMetrics) { try { onMetrics(metrics) } catch { /* Logging must not fail clinical generation. */ } }
  }
}
