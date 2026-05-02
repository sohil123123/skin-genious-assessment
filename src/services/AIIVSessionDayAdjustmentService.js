import engineSchema from 'src/utils/iv/reassessment/AIIVSessionDayAdjustment.json'

/**
 * Builds the chat messages for generating an AI IV Session Day Adjustment decision.
 *
 * @param {Object} inputs - The comprehensive inputs for the adjustment engine
 * @returns {Array} - The messages array for OpenAI chat completion
 */
export const buildSessionDayAdjustmentPrompt = (inputs) => {
  const systemPrompt = `
You are an AI clinical decision support layer called AI_IV_SessionDayAdjustment.
You operate inside a medical-grade IV therapy system and must strictly follow the provided engine specification and rules.

Here is the Engine Specification:
${JSON.stringify(engineSchema, null, 2)}

You MUST output strictly in JSON format matching the "output_contract.iv_session_day_adjustment_output".
Do not include any markdown formatting or explanations. Just the JSON object.
`

  const userPrompt = `
Evaluate the session day adjustment based on the following inputs:

${JSON.stringify(inputs, null, 2)}

Return EXACTLY the JSON specified in the output_contract.
`

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]
}
