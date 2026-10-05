import {
  buildTreatmentPlannerInput, finalizeTreatmentPlan, validateClinicTreatmentPlan,
  buildTreatmentGenerationResponseFormat, unpackTreatmentPlannerResponse,
} from './treatmentClinicRules.js'

export const TREATMENT_RUNTIME_CONFIG = Object.freeze({
  model: 'gpt-5.4', reasoningEffort: 'medium', serviceTier: 'auto',
  // User-requested application override: zero disables automatic timeouts.
  deadlineMs: 0, initialCallMs: 0, minRepairBudgetMs: 15000,
  maxRepairs: 1, maxOutputTokensSingle: 14000, maxOutputTokensMultiple: 22000,
  promptCacheKey: 'ai-aesthetics-treatment-mother-v1.3-v5.5-input-product-contract',
})

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
    }
  }
  return result
}

export function buildTreatmentModelRequest({ systemPrompt, constraints, plannerInput, config = {} }) {
  const settings = { ...TREATMENT_RUNTIME_CONFIG, ...config }
  if (typeof systemPrompt !== 'string' || !systemPrompt.trim()) throw new Error('The replacement SYSTEM_TREATMENT_PLAN_PROMPT is required.')
  return {
    model: settings.model,
    instructions: `${systemPrompt}\n\nAUTHORITATIVE CLINIC CONSTRAINTS AND AVAILABLE RESOURCES\n${JSON.stringify(compileTreatmentConstraints(constraints))}`,
    input: JSON.stringify(plannerInput),
    reasoning: { effort: settings.reasoningEffort },
    text: { verbosity: 'low', format: buildTreatmentGenerationResponseFormat(plannerInput.treatment_plan_type, plannerInput) },
    max_output_tokens: plannerInput.treatment_plan_type === 'multiple' ? settings.maxOutputTokensMultiple : settings.maxOutputTokensSingle,
    service_tier: settings.serviceTier,
    prompt_cache_key: settings.promptCacheKey,
  }
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
    const response = await timedCall(callModel, request, initialTimeout)
    metrics.usage.push(response?.usage || null)
    phase = 'output_contract'
    const draft = unpackTreatmentPlannerResponse(parseModelResponse(response), treatmentType, plannerInput)
    candidate = finalizeTreatmentPlan(draft, plannerInput)
    phase = 'initial_validation'
    let checked = await check(candidate)
    initialValidationError = checked.error
    if (checked.error) console.error('[facial-treatment-v5.5] initial validation failed', checked.error)
    const remaining = deadline - Date.now()
    // Exactly one targeted content repair, only for a complete parseable plan and
    // within an explicitly configured budget, if any. Never retry a timeout/truncated response.
    if (checked.error && checked.error.code !== 'treatment_input_contract_violation' && settings.maxRepairs === 1 && remaining >= settings.minRepairBudgetMs) {
      metrics.calls += 1
      metrics.repaired = true
      const { treatment_plan: draftRoot } = draft
      const repairRequest = {
        ...request,
        input: JSON.stringify({ patient_input: plannerInput, invalid_draft: { treatment_plan: draftRoot },
          validation_errors: checked.error.details || [checked.error.message],
          task: 'Correct EVERY listed violation and its dependent safety/time/sequence decisions. Use planning_contract.required_primary_concerns: each must have its own strategy linked to an actual selected step with that exact target_concerns name. Do not rename concerns to phenotypes or aliases. ENERGY.CARBON.APPLY is PREP; its laser carries correction. PEEL.SPOT.SALI is an uncounted ADJUNCT: choose one product from planning_contract.spot_sali_product_options and put its exact name in additional_products; no generic label, prose-only product or assumed concentration. It does not require cooling after it or between it and Carbon/Q-switch. Do not add cooling merely because the spot adjunct is present. Preserve independently required immediate post-energy cooling, actual broad-peel-plus-Carbon preparation/cooling, carbon film/drying, valid decisions and original supplied scores. Recalculate any changed session sequence inside its window, retaining one 5-10-minute mandatory lymphatic drainage step. Return the same planning_result schema. Never return an empty success plan. No additional ranking report.' }),
      }
      phase = 'repair_request'
      const repair = await timedCall(callModel, repairRequest, remainingTimeout())
      metrics.usage.push(repair?.usage || null)
      phase = 'repair_output_contract'
      candidate = finalizeTreatmentPlan(unpackTreatmentPlannerResponse(parseModelResponse(repair), treatmentType, plannerInput), plannerInput)
      phase = 'repair_validation'
      checked = await check(candidate)
      if (checked.error) {
        console.error('[facial-treatment-v5.5] repair validation failed', checked.error)
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
    console.error('[facial-treatment-v5.5] generation failed', failure)
    return { error: failure }
  } finally {
    metrics.elapsed_ms = Date.now() - start
    // Metrics contain sizes/usage/status only, never patient text or plan content.
    if (onMetrics) { try { onMetrics(metrics) } catch { /* Logging must not fail clinical generation. */ } }
  }
}
