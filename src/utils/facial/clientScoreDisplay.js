// Presentation boundary only. Keep the engine's continuous scores and policies intact.
// Store this metadata with the row; prepareFacialEngineInput restores it before inference.
const DISPLAY_KEY = '_facial_score_display'
const DISPLAY_VERSION = 'facial-health-integer-v1'

const PARAMETERS = [
  ['label', ['skin_type', 'Skin Type', 'Skin Type Classification']],
  ['severity', ['barrier_health_sensitivity', 'barrier_health', 'Barrier Health + Sensitivity', 'Barrier Health + Sensitivity (Combined Score)']],
  ['severity', ['visual_acne_grading', 'Visual Acne Grading', 'Visual Acne Grading (v5.1 Spatial)', 'Visual Acne']],
  ['balance', ['skin_sebum_content', 'skin_sebum_index', 'Skin Sebum Content', 'Skin Sebum Index', 'Skin Sebum Index (v6.0)']],
  ['severity', ['vascularity_redness_profiling', 'vascularity_redness_score', 'Vascularity / Redness Score', 'Vascularity / Redness Profiling', 'Vascularity / Redness Scoring (v6)', 'Vascularity / Redness']],
  ['health', ['skin_hydration_score', 'skin_hydration', 'Skin Hydration Score', 'Skin Hydration']],
  ['health', ['skin_luminosity_glow_index', 'skin_luminosity_glow', 'Skin Luminosity / Glow Index']],
  ['severity', ['superficial_pigmentation_score', 'superficial_pigmentation_scoring', 'Superficial Pigmentation Score', 'Superficial Pigmentation Scoring', 'Superficial Pigmentation']],
  ['severity', ['periorbital_health', 'peri_orbital_health_score', 'Peri-Orbital Health Score', 'Periorbital Health']],
  ['severity', ['lip_pigmentation', 'lip_pigmentation_score', 'Lip Pigmentation', 'Lip Pigmentation Score']],
  ['severity', ['texture_open_pores_scoring', 'texture_open_pores_grading', 'Texture & Open Pores Score', 'Texture / Open Pores Grading', 'Texture + Open Pores']],
  ['severity', ['superficial_wrinkles_scoring', 'superficial_wrinkles', 'Superficial Wrinkles Score', 'Superficial Wrinkles']],
  ['severity', ['jawline_sagging_score', 'jawline_sagging', 'Jawline Sagging Score', 'Jawline Sagging']],
  ['severity', ['skin_firmness_elasticity_index', 'Skin Firmness & Elasticity Index', 'Skin Firmness Elasticity Index']],
  ['severity', ['textural_radiance_index', 'Textural Radiance Index', 'Textural Readiance Index', 'Textural Radiance']],
]

const normalize = value => String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
const PARAMETER_KIND = new Map(PARAMETERS.flatMap(([kind, aliases]) => aliases.map(alias => [normalize(alias), kind])))
const SCORE_FIELDS = ['score_or_label', 'final_score', 'current_score', 'target_score', 'target_single_session_score', 'current_value', 'target_value', 'before_treatment_score_or_label', 'post_treatment_score_or_label']
const isObject = value => value !== null && Object.prototype.toString.call(value) === '[object Object]'
const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key)

function numericScore(value) {
  if (typeof value !== 'number' && typeof value !== 'string') return null
  if (typeof value === 'string' && !value.trim()) return null
  const number = Number(value)
  return Number.isFinite(number) && number >= 1 && number <= 100 ? number : null
}

export function facialClientScore(rawScore, kind) {
  const value = numericScore(rawScore)
  if (value === null) throw new RangeError('A facial score must be a numeric value in the 1-100 engine scale.')
  let display
  if (kind === 'severity') display = 101 - value
  // Sebum keeps its original quantity scale and balanced-target meaning.
  else if (kind === 'health' || kind === 'balance') display = value
  else throw new TypeError('Unknown facial score kind.')
  // Convert polarity before rounding. Do not round the engine value first.
  return Math.round(Math.min(100, Math.max(1, display)))
}

export function facialLegacyScoreGap(currentScore, targetScore) {
  const current = numericScore(currentScore)
  const target = numericScore(targetScore)
  if (current === null || target === null) throw new RangeError('Treatment gaps require original continuous 1-100 engine scores.')
  return Math.abs(current - target) * 4 / 99
}

function hasDisplayMetadata(row) {
  return isObject(row?.[DISPLAY_KEY]) && row[DISPLAY_KEY].version === DISPLAY_VERSION
    && isObject(row[DISPLAY_KEY].raw)
    && (row[DISPLAY_KEY].added_fields === undefined || Array.isArray(row[DISPLAY_KEY].added_fields))
}

function restoreRow(row) {
  if (!hasDisplayMetadata(row)) return row
  const metadata = row[DISPLAY_KEY]
  const result = { ...row, ...metadata.raw }
  // Some saved/exported rows omit added_fields while retaining the complete raw map.
  // Infer only fields that this helper can add; original fields are recorded in raw.
  const addedFields = metadata.added_fields ?? [
    'score_semantics', 'score_polarity', 'ideal_score_direction', 'comparison_mode', 'target_interpretation_rule',
    ...(hasOwn(row, 'before_treatment_score_or_label') && hasOwn(row, 'post_treatment_score_or_label')
      ? ['patient_facing_change_points', 'result'] : []),
  ].filter(key => hasOwn(row, key) && !hasOwn(metadata.raw, key))
  for (const key of addedFields) delete result[key]
  delete result[DISPLAY_KEY]
  return result
}

function kindFor(row, key) {
  return [key, row.parameter_name, row.parameter, row.concern]
    .map(value => PARAMETER_KIND.get(normalize(value))).find(Boolean)
}

function projectRow(row, key) {
  const kind = kindFor(row, key)
  if (!kind || kind === 'label') return row
  const fields = SCORE_FIELDS.filter(field => hasOwn(row, field))
  if (!fields.length || fields.some(field => numericScore(row[field]) === null)) return row

  const result = { ...row }
  const raw = {}
  const added = []
  function set(field, value) {
    if (hasOwn(row, field)) raw[field] = row[field]
    else added.push(field)
    result[field] = value
  }
  for (const field of fields) set(field, facialClientScore(row[field], kind))
  if (kind === 'balance') {
    set('score_semantics', 'state_spectrum')
    set('score_polarity', row.score_polarity === 'distance_to_target' ? 'distance_to_target' : 'depends_on_target')
    set('ideal_score_direction', 'move_toward_target')
    set('comparison_mode', 'target_distance')
    set('target_interpretation_rule', 'Balanced target: aim for the clinically appropriate oil balance; neither a higher nor a lower score is always better.')
  } else {
    set('score_semantics', 'health')
    set('score_polarity', 'higher_is_better')
    set('ideal_score_direction', 'increase')
    set('comparison_mode', 'direct_numeric')
    if (hasOwn(row, 'target_interpretation_rule')) {
      set('target_interpretation_rule', 'A higher score indicates better skin health for this parameter.')
    }
  }

  if (fields.includes('before_treatment_score_or_label') && fields.includes('post_treatment_score_or_label')) {
    const before = result.before_treatment_score_or_label
    // Apply the existing patient-facing no-worsening/stable policy after projection.
    const stable = row.result === 'stable' || row.raw_comparison_result_internal === 'declined'
    // Sebum inherits the engine's target-based result; improvement can move either way.
    const after = kind === 'balance'
      ? (stable || row.result !== 'improved' ? before : result.post_treatment_score_or_label)
      : (stable ? before : Math.max(before, result.post_treatment_score_or_label))
    const change = kind === 'balance' ? Math.abs(after - before) : after - before
    set('post_treatment_score_or_label', after)
    set('patient_facing_change_points', change)
    set('result', change > 0 ? 'improved' : 'stable')
  }

  result[DISPLAY_KEY] = {
    version: DISPLAY_VERSION,
    kind,
    raw,
    added_fields: [...new Set(added)],
  }
  return result
}

// The returned client object keeps the existing score field names used by reports.
// The argument is not mutated; repeated calls restore raw values before converting.
export function formatFacialClientScores(payload) {
  function visit(value, key = '') {
    if (Array.isArray(value)) return value.map(item => visit(item))
    if (!isObject(value)) return value
    const original = restoreRow(value)
    const children = Object.fromEntries(Object.entries(original).map(([name, child]) => [name, visit(child, name)]))
    return projectRow(children, key)
  }
  return visit(payload)
}

// Restore raw values even if a caller included the report JSON inside request text.
// Ordinary prompts, images, unrelated JSON, and text without our marker are unchanged.
function restoreText(text) {
  if (!text.includes(DISPLAY_KEY)) return text
  try {
    const parsed = JSON.parse(text)
    const restored = prepareFacialEngineInput(parsed)
    if (JSON.stringify(parsed) !== JSON.stringify(restored)) return JSON.stringify(restored)
    return text
  } catch { /* A caller may surround JSON with prose or a fenced block. */ }

  let output = ''
  let last = 0
  for (let start = 0; start < text.length; start++) {
    if (text[start] !== '{' && text[start] !== '[') continue
    const stack = []
    let quoted = false
    let escaped = false
    for (let end = start; end < text.length; end++) {
      const char = text[end]
      if (quoted) {
        if (escaped) escaped = false
        else if (char === '\\') escaped = true
        else if (char === '"') quoted = false
        continue
      }
      if (char === '"') quoted = true
      else if (char === '{' || char === '[') stack.push(char)
      else if (char === '}' || char === ']') {
        const opening = stack.pop()
        if (opening !== (char === '}' ? '{' : '[')) break
        if (stack.length) continue
        const candidate = text.slice(start, end + 1)
        if (candidate.includes(DISPLAY_KEY)) {
          try {
            const parsed = JSON.parse(candidate)
            const restored = prepareFacialEngineInput(parsed)
            if (JSON.stringify(parsed) !== JSON.stringify(restored)) {
              output += text.slice(last, start) + JSON.stringify(restored)
              last = end + 1
              start = end
            }
          } catch { /* Leave non-JSON text intact. */ }
        }
        break
      }
    }
  }
  return output + text.slice(last)
}

export function prepareFacialEngineInput(payload) {
  if (typeof payload === 'string') return restoreText(payload)
  if (Array.isArray(payload)) return payload.map(prepareFacialEngineInput)
  if (!isObject(payload)) return payload
  const restored = restoreRow(payload)
  return Object.fromEntries(Object.entries(restored).map(([key, value]) => [key, prepareFacialEngineInput(value)]))
}
