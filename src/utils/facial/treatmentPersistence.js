// A generated draft is not a persisted session. Only database IDs confirm saving.
export function requireSavedTreatmentSessions(result, generatedPlan) {
  const expected = generatedPlan?.treatment_plan?.treatments
  const saved = result?.treatment_sessions?.treatments
  if (!Array.isArray(expected) || !expected.length || !Array.isArray(saved)
      || !expected.every(session => saved.some(record => record.id
        && Number(record.session_number) === Number(session.session_number)))) {
    throw new Error('The API did not confirm saving the treatment sessions. Please retry saving the plan.')
  }
  return saved
}
