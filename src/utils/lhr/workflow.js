import { captureSlots, LHR_ZONES, SAFETY_FIELDS, safetyComplete } from './assessment.js'

const nullable = (value) => (value === '' || value === undefined ? null : value)
const numeric = (value) => (nullable(value) === null ? null : Number(value))
export function normaliseInputs(input) {
  const safety = input.safety || {}
  const consent = input.consent || {}
  const machine = input.machine || {}
  return {
    capture_workflow: 'staged',
    zones: Object.fromEntries(
      LHR_ZONES.filter((zone) => input.zones?.[zone.id]).map((zone) => [
        zone.id,
        { mode: 'imaged' },
      ]),
    ),
    phototype: nullable(input.phototype),
    hair: nullable(input.hair),
    daysSinceLastShave: numeric(input.daysSinceLastShave),
    sunResponse: nullable(input.sunResponse),
    tanning: nullable(input.tanning),
    plannedSessions: Number(input.plannedSessions || 8),
    safety: {
      ...Object.fromEntries(SAFETY_FIELDS.map(({ id }) => [id, !!safety[id]])),
      reviewed: !!safety.reviewed,
      daysSinceSun: numeric(safety.daysSinceSun),
      notes: nullable(safety.notes),
      clearance_notes: nullable(safety.clearance_notes),
    },
    consent: Object.fromEntries(
      ['treatment', 'imaging', 'ai', 'marketing'].map((key) => [key, !!consent[key]]),
    ),
    machine: {
      is_test_configuration: !!machine.is_test_configuration,
      name: nullable(machine.name),
      control_profile: nullable(machine.control_profile),
      wavelengths_label: nullable(machine.wavelengths_label),
      body_size: nullable(machine.body_size),
      protocol_reference: nullable(machine.protocol_reference),
      ...Object.fromEntries(
        [
          'wavelength_nm',
          'spot_size_mm',
          'cooling_c',
          'min_fluence',
          'max_fluence',
          'min_energy_kj',
          'max_energy_kj',
          'min_grid_cm2',
          'max_grid_cm2',
          'min_pulse_ms',
          'max_pulse_ms',
        ].map((key) => [key, numeric(machine[key])]),
      ),
    },
  }
}
export function inputsEquivalent(a, b) {
  return JSON.stringify(normaliseInputs(a)) === JSON.stringify(normaliseInputs(b))
}
export function captureReady(draft, captures, results) {
  const slots = captureSlots(draft)
  const zones = Object.keys(draft.zones || {})
  return (
    zones.length > 0 &&
    slots.length > 0 &&
    slots.every(({ key }) => captures[key]?.id && !captures[key].pending && !captures[key].error) &&
    zones.every((id) => results[id]?.qc_pass === true && !results[id].requires_recapture) &&
    safetyComplete(draft) &&
    ['treatment', 'imaging', 'ai'].every((key) => draft.consent[key])
  )
}
export function sessionStep(status, hasCaptures = false) {
  if (status === 'prescribed') return 3
  if (['assigned', 'in_progress'].includes(status)) return 4
  if (['awaiting_review', 'completed'].includes(status)) return 5
  return hasCaptures ? 2 : 1
}

export function beforeCaptureReady(inputs, captures) {
  const slots = captureSlots(inputs).filter((slot) => slot.shot === 'A')
  return (
    slots.length > 0 &&
    slots.every(({ key }) => captures[key]?.id && !captures[key].pending && !captures[key].error)
  )
}
export function beforeProfileReady(profile, inputs, captures) {
  const ids = Object.keys(inputs.zones || {})
  return (
    beforeCaptureReady(inputs, captures) &&
    !!profile?.phototype &&
    !!profile?.hair_character &&
    profile.zones?.length === ids.length &&
    ids.every((id) =>
      profile.zones.some((zone) => zone.zone_id === id && zone.qc_pass && !zone.requires_recapture),
    )
  )
}
export function stagedSessionStep(session, hasCaptures = false) {
  if (session.status === 'prescribed') return 4
  if (['assigned', 'in_progress'].includes(session.status)) return 5
  if (['awaiting_review', 'completed'].includes(session.status)) return 6
  if (
    session.profile?.phototype &&
    session.profile.zones?.every((zone) => zone.qc_pass && !zone.requires_recapture)
  )
    return 3
  return hasCaptures ? 2 : 1
}
