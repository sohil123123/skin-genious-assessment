// Planning coverage only: the supplied clinic constraints remain authoritative.
// IDs address the supplied catalogue snapshot, not a separate clinical protocol.
export const CATALOGUE_OMISSION_STATUSES = [
  'not_indicated',
  'contraindicated',
  'redundant',
  'protocol_unavailable',
  'outside_scope',
  'deferred',
]

export function buildTreatmentCatalogue(constraints = {}) {
  const resources = constraints.availableResources || {}
  const options = []
  const add = (id, source, name, equipment = null, variantKind = null) => {
    if (typeof name === 'string' && name.trim()) {
      options.push({ id, source, name, ...(equipment ? { equipment } : {}),
        ...(variantKind ? { variant_kind: variantKind } : {}) })
    }
  }
  for (const [index, machine] of (resources.machines || []).entries()) {
    const id = `M${index + 1}`
    const source = `availableResources.machines[${index}]`
    const variants = machine.probes || machine.modes || machine.configurations?.tips_available
    if (Array.isArray(variants) && variants.length) {
      const variantKind = machine.probes ? 'probe' : machine.modes ? 'mode' : 'tip'
      variants.forEach((name, variant) => add(`${id}V${variant + 1}`, source, name, machine.name, variantKind))
    } else {
      add(id, source, machine.name)
    }
  }
  const families = {
    chemicalPeels: 'P',
    jet_infusion_solutions: 'I',
    peelOffMasks: 'K',
    Special_ingredients_for_facials_type: 'S',
    treatment_tools: 'T',
    ivInfusions: 'V',
  }
  for (const [family, prefix] of Object.entries(families)) {
    const items = resources[family] || []
    items.forEach((item, index) => {
      add(`${prefix}${index + 1}`, `availableResources.${family}[${index}]`, item.name)
    })
  }
  // Routine consumables remain available for preparation, not extra therapies.
  return options
}

export const CATALOGUE_PERSONALIZATION_PROMPT = `
CATALOGUE REVIEW REVISION: 2026-10-02-role-review-v4
CATALOGUE SELECTION AND PERSONALIZED CARE
The supplied clinic constraints govern indications, exclusions, combinations,
corrective counts, settings, ingredients, routes and timings. Use the documented
assessment and client priorities; preserve scores and supplied targets.

1. Screen every treatment_catalogue entry once. Use the clinic's existing ranking
   axes, named-candidate comparisons and tie-breaks for relevant permitted options.
   Classify irrelevant inventory directly; make the required comparisons for
   relevant choices once and reuse them. No separate numerical grading sheets,
   repeated rankings per concern, or exhaustive permutations of every device.
   Include the full range of devices/probes, LED modes, extraction, exfoliation,
   named peels, ingredient/delivery choices and masks in this screen.
2. Select the strongest appropriate corrective treatment or permitted combination,
   then compare the complete session with useful regional, preparatory and recovery
   options added. Choose an addition when it offers meaningful extra clinical,
   regional, comfort or recovery benefit and its combined burden is acceptable.
   Compare against the actual selected care, not an assumed generic facial.
   Classify corrective/supportive roles under the existing clinic rules; never
   relabel a corrective as support to bypass its combination limit.
   Judge each role by its intended outcome: correction, preparation, regional
   care or recovery. A recovery option need not beat a corrective's immediate
   visible effect to be useful. Apply the corrective-stack tests to correctives;
   use the clinic's support protocols to assess recovery and comfort care.
3. Redundancy requires substantially overlapping delivery or benefit for this
   patient's need. The same broad label (e.g. calming, acne, hydration or pigment)
   alone does not establish redundancy. A corrective treating a concern does not
   automatically replace every complementary or recovery option for that concern.
   When relevant, compare high frequency, permitted LED modes, cooling, mask and
   infusion by their specific role and the supplied findings/procedure burden.
   The same comparison standard applies to every other relevant catalogue option.
   For each relevant omitted option, name the option/mode, its proposed role and
   the specific patient finding, selected alternative or restriction that decides
   the comparison. A blanket sentence rejecting LED, high frequency, extraction
   and exfoliation together as "low or redundant benefit" does not meet this
   requirement: those are different choices. One short clause per relevant option
   is enough; give no prose inventory of clinically irrelevant products.
4. Plan toward the supplied preferred duration (65 full/single, 40 express).
   The upper limit is available for worthwhile care: 75 full/single, 45 express.
   Reaching the lower boundary, or passing the preferred target, is not itself a
   reason to omit a useful compatible treatment that fits the complete window.
   Before allocating filler massage, and whenever finishing below the preference,
   compare relevant additions AND substitutions for lower-value optional care.
   Preserve required recovery and fixed clinical doses. Choose worthwhile care
   ahead of filler; then calculate filler under the existing massage rule.
   In other_relevant_options, a below-preference session needs a concrete brief
   comparison: actual total versus the preferred target; the best relevant
   addition or substitution considered; and the case-specific reason it loses
   or cannot fit at its approved dose. "Within 60-75" or "minimum reached" is not
   that explanation. Consider beneficial plans above the preference too.
   Do not invent a missing indication or protocol to manufacture a candidate.
   The target remains a preference; actual clinical benefit governs inclusion.
5. Availability alone is not an indication or approved protocol. Apply all clinic
   contraindications and product/device restrictions. Missing device-specific
   settings follow the existing clinician-confirmation rule; identify a genuinely
   unavailable protocol precisely instead of inventing settings or a new route.
   IV/hair-removal inventory stays outside an ordinary facial unless explicitly
   in scope and approved. Do not guess what an ambiguous 'Teenage Line' means.
6. Personalize choices, zones, permitted intensity, delivery and recovery from the
   actual findings. Give a specific title and a 50-80-word session script explaining
   the priorities, adaptations and realistic expected benefit. Step scripts are
   usually two short sentences (20-45 words) in simple spoken language; keep the
   required PRIMARY_CONCERN tags. Preserve all required therapist technique,
   approved settings, timing and stopping details in how_to_do. Similar needs may
   correctly lead to similar plans; specificity comes from the evidence and choices.

COMPACT COVERAGE RECORD (existing staff/debug fields)
- catalogue_option_ids contains the indexed resources actually used in each step.
  A delivery device and its serum/mask/peel each have an ID. Use exact catalogue
  names in ingredients_equipments. A unique probe name identifies itself; generic
  modes/tips still name the parent device. Legitimate reuse of one resource can
  repeat its ID across steps. Use [] for a routine step with no indexed resource.
- Put every remaining ID in exactly one catalogue_review array: not_indicated,
  contraindicated, redundant, protocol_unavailable, outside_scope, or deferred.
  Selected IDs must not also appear there. Deferred needs a real clinical reason.
- Use modality_omission_explanation for concise, patient-specific selection and
  omission reasons. Reuse decisions already made; no separate private reports,
  ranking tables or repeated audit narratives. Usually one sentence per relevant
  family/session suffices, covering the important comparison, not generic labels.
- This record verifies consideration/consistency; clinical constraints govern care.
`

// Structural coverage validation only. Clinical suitability is not inferred here.
export function catalogueReviewErrors(session, catalogue, label = 'Session') {
  const errors = []
  const known = new Set(catalogue.map((item) => item.id))
  const normalizeName = (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const byId = new Map(catalogue.map((item) => [item.id, item]))
  const nameCounts = new Map()
  catalogue.forEach(item => {
    const name = normalizeName(item.name)
    nameCounts.set(name, (nameCounts.get(name) || 0) + 1)
  })
  const selected = new Set()
  for (const [index, step] of (session.steps || []).entries()) {
    if (!Array.isArray(step?.catalogue_option_ids)) {
      errors.push(`${label}, step ${index + 1}: catalogue_option_ids is required.`)
      continue
    }
    const stepIds = new Set()
    const equipment = Array.isArray(step.ingredients_equipments) ? step.ingredients_equipments : []
    const equipmentNames = equipment.map(normalizeName)
    const words = value => String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
    const equipmentText = ` ${words(equipment.join(' '))} `
    const namesResource = name => equipmentText.includes(` ${words(name)} `)
    for (const id of step.catalogue_option_ids) {
      if (!known.has(id)) errors.push(`${label}: unknown catalogue ID ${id}.`)
      if (stepIds.has(id)) errors.push(`${label}, step ${index + 1}: repeated catalogue ID ${id}.`)
      const option = byId.get(id)
      // An exact, unique probe name already identifies the selected catalogue
      // resource. Do not regenerate a clinical plan just to repeat its parent
      // machine name. Modes/tips and ambiguous probe names still need that parent.
      const uniqueNamedProbe = option?.variant_kind === 'probe'
        && nameCounts.get(normalizeName(option.name)) === 1
      if (option && !namesResource(option.name)) {
        errors.push(`${label}, step ${index + 1}: ${id} must name its actual catalogue resource (${option.name}).`)
      } else if (option?.equipment && !uniqueNamedProbe && !namesResource(option.equipment)) {
        errors.push(`${label}, step ${index + 1}: ${id} must identify ${option.equipment} for variant ${option.name}.`)
      }
      stepIds.add(id)
      selected.add(id)
    }
    // Catch an explicitly named resource silently omitted from the coverage record.
    // Ambiguous ingredient names shared by different routes are left to the existing
    // route validator and clinician; no new route permissions are inferred here.
    for (const option of catalogue) {
      const name = normalizeName(option.name)
      const explicitlyNamed = nameCounts.get(name) === 1 && equipmentNames.some(value =>
        value === name || (option.equipment && value === normalizeName(`${option.equipment} ${option.name}`)),
      )
      if (explicitlyNamed && !stepIds.has(option.id)) {
        errors.push(`${label}, step ${index + 1}: include ${option.id} for the listed ${option.name}.`)
      }
    }
  }
  const covered = new Set(selected)
  for (const status of CATALOGUE_OMISSION_STATUSES) {
    const ids = session.catalogue_review?.[status]
    if (!Array.isArray(ids)) {
      errors.push(`${label}: catalogue_review.${status} is required.`)
      continue
    }
    for (const id of ids) {
      if (!known.has(id)) errors.push(`${label}: unknown catalogue ID ${id}.`)
      if (covered.has(id)) errors.push(`${label}: catalogue ID ${id} has conflicting/repeated decisions.`)
      covered.add(id)
    }
  }
  const missing = [...known].filter((id) => !covered.has(id))
  if (missing.length) errors.push(`${label}: catalogue review omitted ${missing.join(', ')}.`)
  return errors
}
