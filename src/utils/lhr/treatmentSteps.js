export function activeTreatmentStep(steps = []) {
  return steps.find((step) => step.status !== 'completed') || null
}
export function zoneTreatmentForm(step) {
  const record = step?.record || {}
  return {
    checklist: { ...(record.checklist || {}) },
    test_patch_notes: record.test_patch_notes || '',
    endpoint_grade: record.endpoint_grade ?? null,
    regrowth_days: record.regrowth_days ?? null,
    notes: record.notes || '',
    adverse_events: record.adverse_events || '',
    treatment_confirmed: false,
  }
}
export function zoneSafetyReady(step, form) {
  return (
    !!step &&
    step.status === 'pending' &&
    !!form.test_patch_notes.trim() &&
    Object.keys(step.checks || {}).length > 0 &&
    Object.keys(step.checks).every((key) => form.checklist[key] === true)
  )
}
export function zoneCompletionReady(step, form) {
  return (
    !!step &&
    step.status === 'in_progress' &&
    form.treatment_confirmed === true &&
    [0, 1, 2, 3, 4].includes(form.endpoint_grade) &&
    (form.endpoint_grade < 3 || !!form.adverse_events.trim())
  )
}
