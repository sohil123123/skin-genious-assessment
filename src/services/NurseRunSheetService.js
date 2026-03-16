import generationEngine from 'src/utils/iv/treatment/ivTreatmentGenerationEngine.json'
import { encode } from '@toon-format/toon'

/**
 * Builds the chat messages for generating a Nurse Run Sheet.
 * This is used by the frontend component which handles the API call via useOpenAI composable.
 *
 * @param {Object} protocol - The selected protocol object (e.g. from treatment session)
 * @param {Object} patientContext - Relevant patient data (vitals, symptoms, purpose)
 * @returns {Array} - The messages array for OpenAI chat completion
 */
export const buildRunSheetPrompt = (protocol, patientContext) => {
  const systemPrompt = `
You are the AI IV Treatment Execution Engine defined in the JSON schema.
Your task is to generate a comprehensive "Nurse Run Sheet" (JSON) based on:
1. The Selected Application Protocol
2. The Clinic SOP Defaults
3. The Patient Context (vitals, symptoms)

Here are the Clinic SOP Defaults:
${encode(generationEngine.clinic_sop_defaults)}

Here is the Treatment Execution Engine definition (Schema Reference):
${encode(generationEngine.treatment_execution_engine)}

Generate the output strictly in JSON format matching the "run_sheet" structure in the execution engine definition.
The Output JSON Structure MUST be:
{
  "header": { ... },
  "preflight_checks": ["string step 1", ...],
  "setup_steps": ["string step 1", ...],
  "administration_steps": ["string step 1", ...],
  "monitoring_plan": {
    "baseline_measurements": [...],
    "during_infusion_checks": ["string check 1", "string check 2" ...],
    "stop_rules": [...],
    "escalation_rules": [...]
  },
  "post_care": ["string step 1", ...],
  "documentation": ["string item 1", ...],
  "clinician_signoff_required_if": ["string condition 1", ...]
}

Do not include any markdown formatting or explanations. Just the JSON object.
IMPORTANT: Ensure all list items (preflight_checks, setup_steps, administration_steps, post_care, monitoring_plan arrays) are SIMPLE STRINGS. Do not return objects within these arrays. If the source has objects, flatten them into a single descriptive string.
`

  const userPrompt = `
Patient Context:
${encode(patientContext)}

Selected Protocol:
${encode(protocol)}

Generate the Nurse Run Sheet JSON now.
`

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]
}
