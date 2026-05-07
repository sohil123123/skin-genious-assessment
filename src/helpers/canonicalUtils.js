export function yesNoToBoolean(value) {
  if (value === 'Yes') return true
  if (value === 'No') return false
  return false // default-safe
}

export function toYesNoUnsure(value) {
  if (value === 'Yes') return 'Yes'
  if (value === 'Unsure') return 'Unsure'
  return 'No' // Default to No if missing or 'No'
}

export function severityToCanonical(value) {
  if (!value) return 'none'
  return value.toLowerCase()
}

export function emptyToNull(value) {
  return value === '' || value === undefined ? null : value
}
