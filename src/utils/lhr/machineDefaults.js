// Photo transcription only: displayed values are NOT operating ranges or treatment doses.
// Edit the SHR defaults here after confirming your exact handpiece and device protocol.
export const LHR_CONSOLE_REFERENCE = Object.freeze({
  model: 'Soprano Titanium (console label)',
  wavelengths_label: '755 + 808 + 810 + 1064 nm',
  rated_power_w: 1200,
  modes: Object.freeze(['SHR STACK', 'SHR', 'HR']),
  selected_mode: 'SHR',
  body_sizes: Object.freeze(['S', 'M', 'L', 'XL']),
  displayed_fluence_j_cm2: 1,
  displayed_energy_kj: 10,
  displayed_grid_size_cm2: 100,
  displayed_time_seconds: 1020,
})

export const LHR_MACHINE_DEFAULTS = Object.freeze({
  enabled: true,
  machine: Object.freeze({
    control_profile: 'shr_console',
    name: 'TEST ONLY - Soprano Titanium (photo reference)',
    wavelengths_label: LHR_CONSOLE_REFERENCE.wavelengths_label,
    protocol_reference:
      'SOFTWARE TEST ONLY. SHR console photo reference dated 6 November 2026: label 755+808+810+1064 nm, 1200 W; modes SHR STACK / SHR / HR; SHR selected; displayed fluence 1 J/cm2, energy 10 kJ, grid 100 cm2, timer 1020 s. The equal min/max fixture values reproduce this screen for software testing ONLY: they are not manufacturer operating ranges or a patient prescription. Timer is a readout, not a prescribed duration. Body-size choices S/M/L/XL must be selected per patient. Cooling indicators and temperature readout do not establish skin-contact cooling temperature. Confirm exact machine/handpiece, cooling instructions and patient-specific SHR limits before treatment. No pulse width, spot diameter, selectable wavelength, repetition rate or safe dose range can be inferred from these photos.',
    min_fluence: 1,
    max_fluence: 1,
    min_energy_kj: 10,
    max_energy_kj: 10,
    min_grid_cm2: 100,
    max_grid_cm2: 100,
  }),
})

// Compatibility fixtures for saved generic/HR-style sessions only.
// These arbitrary legacy values are NOT specifications for the photographed machine.
export const LHR_LEGACY_MACHINE_DEFAULTS = Object.freeze({
  enabled: true,
  machine: Object.freeze({
    name: 'TEST ONLY - demo diode laser',
    protocol_reference:
      'Software test fixture only. Not an approved treatment protocol. Replace with the actual manufacturer/device and clinician-approved patient-specific limits before treatment.',
    wavelength_nm: 810,
    spot_size_mm: 12,
    cooling_c: 4,
    min_fluence: 5,
    max_fluence: 18,
    min_pulse_ms: 10,
    max_pulse_ms: 50,
  }),
})

export function withMachineDefaults(machine = {}, config = LHR_MACHINE_DEFAULTS) {
  const result = { ...machine }
  if (!config.enabled) return result
  const existingGeneric =
    machine.control_profile !== 'shr_console' &&
    (machine.control_profile === 'generic' ||
      ['name', 'protocol_reference', 'wavelength_nm', 'spot_size_mm', 'min_pulse_ms'].some(
        (key) => machine[key] != null && String(machine[key]).trim() !== '',
      ))
  const defaults =
    config === LHR_MACHINE_DEFAULTS && existingGeneric
      ? LHR_LEGACY_MACHINE_DEFAULTS.machine
      : config.machine
  let applied = false
  for (const [key, value] of Object.entries(defaults)) {
    if (result[key] == null || (typeof result[key] === 'string' && !result[key].trim())) {
      result[key] = value
      applied = true
    }
  }
  if (applied) result.is_test_configuration = true
  return result
}
