export const getFacialPrompts = async (mode) => {
  const m = mode && mode.startsWith('5') ? '5_light_modes' : '6_light_modes'
  const aiPrompts = await import(`./${m}/scoring/aiPrompts.js`)
  const scoringPrompt = await import(`./${m}/scoring/scoringPrompt.js`)
  const treatmentPrompt = await import(`./${m}/treatment/treatmentPrompt.js`)
  const postAssessmentPrompt = await import(`./${m}/reassessment/postAssessmentPrompt.js`)
  const constraintsModule = await import(`./${m}/treatment/constraints.js`)
  const constraints = constraintsModule.constraints
  const productJson = await import(`./${m}/treatment/productJson.js`)

  return {
    SYSTEM_PROMPT_FEATURE_PACKET_V1: aiPrompts.SYSTEM_PROMPT_FEATURE_PACKET_V1,
    SYSTEM_PROMPT_DIAGNOSIS: scoringPrompt.SYSTEM_PROMPT_DIAGNOSIS,
    D_REPORT_USER_PROMPT: scoringPrompt.D_REPORT_USER_PROMPT,
    SYSTEM_TREATMENT_PLAN_PROMPT: treatmentPrompt.SYSTEM_TREATMENT_PLAN_PROMPT,
    POST_DIAGNOSIS_USER_PROMPT: postAssessmentPrompt.POST_DIAGNOSIS_USER_PROMPT,
    constraints: constraints,
    SYSTEM_DAILY_HOME_CARE_ROUTINE_PROMPT: treatmentPrompt.SYSTEM_DAILY_HOME_CARE_ROUTINE_PROMPT,
    USER_DAILY_HOME_CARE_ROUTINE_PROMPT: treatmentPrompt.USER_DAILY_HOME_CARE_ROUTINE_PROMPT,
    available_skincare_products: productJson.available_skincare_products
  }
}
