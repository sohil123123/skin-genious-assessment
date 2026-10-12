// Reporting only: these rules never calculate or replace a sebum score.
const aliases = new Set(['skinsebumcontent', 'skinsebumindex', 'skinsebumindexv60'])
const normalize = value => String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const review = () => ({ status: 'review_required' })
const score = value => {
  if (!['number', 'string'].includes(typeof value) || String(value).trim() === '') return null
  const number = Number(value)
  return Number.isFinite(number) && number >= 1 && number <= 100 ? number : null
}

export function isSebumReportingRow(row, key = '') {
  return [key, row?.parameter_name, row?.parameter, row?.concern].some(value => aliases.has(normalize(value)))
}

export function normalizeSebumReference(reference) {
  if (!object(reference)) return null
  if (reference.status === 'review_required') return review()
  if (Object.hasOwn(reference, 'range')) {
    const range = reference.range
    if (!Array.isArray(range) || range.length !== 2) return review()
    const [low, high] = range.map(score)
    return low !== null && high !== null && low <= high ? { range: [low, high] } : review()
  }
  if (Object.hasOwn(reference, 'target')) {
    const target = score(reference.target)
    return target === null ? review() : { target }
  }
  return null
}

// Prefer an explicitly supplied balance reference. Legacy single-session targets
// remain supported. Ranges must already be on the 1-100 score scale; never guess
// a midpoint or convert a different backend index into a reporting target.
function rowReference(row) {
  if (row.balance_target_range != null) return normalizeSebumReference({ range: row.balance_target_range })
  const target = row.balance_target_score ?? row.target_single_session_score ?? row.target_score
  if (target != null) return normalizeSebumReference({ target })
  return null
}

export function resolveSebumReportingReference(payload) {
  const candidates = []
  function visit(value, key = '') {
    if (Array.isArray(value)) return value.forEach(item => visit(item))
    if (!object(value)) return
    if (isSebumReportingRow(value, key)) {
      const metadata = value._facial_score_display
      const raw = object(metadata?.raw) ? { ...value, ...metadata.raw } : value
      const reference = rowReference(raw) ?? normalizeSebumReference(metadata?.reporting_reference)
      if (reference) candidates.push(reference)
    }
    for (const [childKey, child] of Object.entries(value)) {
      if (childKey !== '_facial_score_display') visit(child, childKey)
    }
  }
  visit(payload)
  if (!candidates.length) return null
  const first = JSON.stringify(candidates[0])
  return candidates.every(item => JSON.stringify(item) === first) ? candidates[0] : review()
}

export function compareSebumBalance(beforeValue, afterValue, reference) {
  const before = score(beforeValue), after = score(afterValue)
  const resolved = normalizeSebumReference(reference)
  if (before === null || after === null || !resolved || resolved.status === 'review_required') return {
    result: 'stable', status: 'review_required', change_points: 0,
    note: 'Your oil balance needs review against an established balance target. A numerical increase or decrease alone does not establish improvement.',
  }
  const distance = value => resolved.range
    ? Math.max(resolved.range[0] - value, 0, value - resolved.range[1])
    : Math.abs(value - resolved.target)
  const distanceBefore = distance(before), distanceAfter = distance(after)
  const common = { distance_before: distanceBefore, distance_after: distanceAfter }
  if (distanceBefore - distanceAfter > 1e-9) return {
    ...common, result: 'improved', status: 'toward_existing_target', change_points: distanceBefore - distanceAfter,
    note: 'Your oil level has moved closer to the established balance target. Improvement can involve either an increase or a decrease.',
  }
  if (distanceBefore <= 1e-9 && distanceAfter <= 1e-9) return {
    ...common, result: 'stable', status: 'balanced', change_points: 0,
    note: 'Your oil level remains balanced within the established target.',
  }
  if (Math.abs(distanceBefore - distanceAfter) <= 1e-9) return {
    ...common, result: 'stable', status: 'unchanged_balance', change_points: 0,
    note: 'Your oil level has the same distance from the balance target. Higher or lower is not automatically better.',
  }
  return {
    ...common, result: 'stable', status: 'review_required', change_points: 0,
    note: 'Your oil level is farther from the established balance target and needs review. The measured scores are retained for clinical interpretation.',
  }
}
