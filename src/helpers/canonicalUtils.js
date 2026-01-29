export function yesNoToBoolean(value) {
  if (value === 'Yes') return true
  if (value === 'No') return false
  return false // default-safe
}

export function severityToCanonical(value) {
  if (!value) return 'none'
  return value.toLowerCase()
}

export function emptyToNull(value) {
  return value === '' || value === undefined ? null : value
}
