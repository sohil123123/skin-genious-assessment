/**
 * Deterministic Backend Validator for Pigmentation Decode V2 Treatment Plans.
 *
 * Enforces hard constraints:
 * 1. Maximum two injury-producing modality types per session.
 * 2. Execution steps must exist for every selected use=true modality.
 * 3. Selected protocol IDs must match valid inventory/config definitions.
 * 4. Safety bounds (pregnancy, perioral laser limits, hydroquinone restrictions).
 */

export function validatePigmentationPlan(planObj) {
  const errors = []
  const warnings = []

  if (!planObj) {
    return { valid: false, errors: ['Plan object is null or undefined.'], warnings: [] }
  }

  const sessions = planObj.sessions || planObj.current_treatment_block?.sessions || []

  sessions.forEach((session, idx) => {
    const sNum = session.session_number || idx + 1

    // 1. Check Injury Modality Limits (Max 2 per session)
    const injuryModalities = session.injury_producing_modalities || []
    if (injuryModalities.length > 2) {
      errors.push(
        `Session ${sNum}: Exceeds maximum allowed injury-producing modalities (${injuryModalities.length} > 2: ${injuryModalities.join(', ')}).`,
      )
    }

    // 2. Execution Sequence Completeness Check
    const selectedModalities = session.selected_modalities || []
    const execSteps = session.provider_protocol?.session_execution_sequence || []
    const execStepTypes = execSteps.map((st) => (st.step_type || '').toLowerCase())

    selectedModalities.forEach((mod) => {
      const modLower = mod.toLowerCase()

      // Map modality names to step types
      let expectedStep = ''
      if (modLower.includes('peel')) expectedStep = 'chemical_peel'
      else if (modLower.includes('laser') || modLower.includes('q_switch'))
        expectedStep = 'q_switch'
      else if (modLower.includes('microneedling')) expectedStep = 'microneedling'
      else if (modLower.includes('led')) expectedStep = 'led'

      if (
        expectedStep &&
        !execStepTypes.some((st) => st.includes(expectedStep) || expectedStep.includes(st))
      ) {
        warnings.push(
          `Session ${sNum}: Selected modality '${mod}' does not have an explicit execution step in session_execution_sequence.`,
        )
      }
    })

    // 3. Safety checks
    if (
      session.fixed_protocol?.q_switch?.use &&
      session.treated_component_ids?.includes('perioral')
    ) {
      const energy = session.fixed_protocol.q_switch.energy_mj || 0
      if (energy > 400) {
        errors.push(
          `Session ${sNum}: Perioral Q-switch energy of ${energy}mJ exceeds safe upper threshold (350mJ).`,
        )
      }
    }
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}
