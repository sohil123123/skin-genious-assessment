// Settings are mode-specific; no generic pulse/spot/cooling values are invented for SHR.
export const isShrMachine = (machine) => machine?.control_profile === 'shr_console'
export const SHR_SETTING_FIELDS = Object.freeze([
  { id: 'fluence_j_cm2', label: 'Fluence', unit: 'J/cm²' },
  { id: 'energy_kj', label: 'Energy per grid', unit: 'kJ' },
  { id: 'grid_size_cm2', label: 'Grid size', unit: 'cm²' },
  { id: 'fluence_ceiling_j_cm2', label: 'Fluence ceiling', unit: 'J/cm²' },
])
export const GENERIC_SETTING_FIELDS = Object.freeze([
  { id: 'wavelength_nm', label: 'Wavelength', unit: 'nm' },
  { id: 'fluence_j_cm2', label: 'Fluence', unit: 'J/cm²' },
  { id: 'pulse_width_ms', label: 'Pulse width', unit: 'ms' },
  { id: 'spot_size_mm', label: 'Spot size', unit: 'mm' },
  { id: 'contact_cooling_c', label: 'Contact cooling', unit: '°C' },
  { id: 'fluence_ceiling_j_cm2', label: 'Fluence ceiling', unit: 'J/cm²' },
])
const consoleFields = [
  {id:'console_area',label:'Console area',unit:''},{id:'body_size',label:'Body size',unit:''},
  {id:'phototype',label:'Fitzpatrick',unit:''},{id:'mode',label:'Mode',unit:''},
  ...SHR_SETTING_FIELDS.filter(field => field.id !== 'fluence_ceiling_j_cm2'),
  {id:'frequency_hz',label:'Pulse frequency',unit:'Hz'},{id:'stack_count',label:'Stack count',unit:'pulses/burst'},
]
export function machineSettingFields(machine, settings) {
  if (settings?.mode) return consoleFields.filter(field => Object.hasOwn(settings, field.id))
  return isShrMachine(machine) ? SHR_SETTING_FIELDS : GENERIC_SETTING_FIELDS
}
