// Map only actual intake answers; missing screening remains unknown.
export function treatmentHistoryFlags(patient) {
  const flags = {}
  // The intake screen stores yes/no answers as "yes"/"no" strings, except
  // pregnancy, which it stores as 1/0; the API can also return "1"/"0".
  const answer = value => value === true || value === 'yes' || value === 'true' || value === 1 || value === '1' ? true
    : value === false || value === 'no' || value === 'false' || value === 0 || value === '0' ? false : undefined
  for (const [condition, field] of Object.entries({
    travel_within_7_days: 'upcoming_travel', social_event_within_7_days: 'social_event',
    laser_within_last_7_days: 'recent_peel_or_laser', used_retinol_last_24_hours: 'retinol_used_last_night',
    pregnant: 'is_pregnant', breastfeeding: 'breastfeeding',
  })) {
    const value = answer(patient[field])
    if (value !== undefined) flags[condition] = value
  }
  const sun = patient.daily_sun_exposure_hours
  if (['Less than 1 hour', '1-2 hours', 'More than 2 hours'].includes(sun)) {
    flags.sun_exposure_gt_2_hours = sun === 'More than 2 hours'
    flags.sun_exposure_1_to_2_hours = sun === '1-2 hours'
  }
  const age = patient.age === null || patient.age === undefined || patient.age === '' ? NaN : Number(patient.age)
  if (Number.isFinite(age)) flags.age_between_30_and_60 = age >= 30 && age <= 60
  // A submitted list, even an empty one, is an answer: nothing ticked means none.
  // The chip row "CURRENT SKINCARE & ALLERGIES" stores acids and allergens together;
  // the clinic reads Salicylic/Glycolic Acid there as current home use (closed
  // decision), which is exactly what the two used_*_yesterday rules cover.
  for (const [field, mapping] of Object.entries({
    medical_history: { diabetes: 'Diabetes', thyroid: 'Thyroid', PCOD: 'PCOD', on_blood_thinners: 'Blood thinners' },
    allergies: { aloe_vera_allergy: 'Aloe Vera', vitamin_c_allergy: 'Vitamin C',
      used_salicylic_yesterday: 'Salicylic Acid', used_glycolic_acid_yesterday: 'Glycolic Acid' },
  })) {
    const values = patient[field]
    if (Array.isArray(values))
      for (const [condition, label] of Object.entries(mapping)) flags[condition] = values.includes(label)
  }
  return flags
}

// The intake chip row "CURRENT SKINCARE & ALLERGIES" stores acids and allergens in
// one `allergies` array. The planner must read Salicylic/Glycolic Acid as current
// skincare use, never as an allergy, so the profile sent to the model names them apart.
export const SKINCARE_ACTIVE_CHIPS = Object.freeze(['Salicylic Acid', 'Glycolic Acid'])
export function treatmentIntakeProducts(patient) {
  const listed = Array.isArray(patient?.allergies) ? patient.allergies : []
  return {
    current_skincare_actives: listed.filter((item) => SKINCARE_ACTIVE_CHIPS.includes(item)),
    allergies: listed.filter((item) => !SKINCARE_ACTIVE_CHIPS.includes(item)),
  }
}

// Explicit clinic cleanser/finish selection from the inspected product records.
// Retinol and home-care-only products are not included in the planning prefix.
const clinicProductNames = new Set([
  'derma decode Gentle Hydrating Cleanser Face Wash',
  'derma decode Daily Use Face Serum for Dry Skin',
  'derma decode Brightening Serum Concentrate for Acne Marks and Pigmentation',
  'derma decode Oil Control Moisturizer for Oily Acne Prone Skin',
  'derma decode Hydrating Face Moisturizer for Dry and Sensitive Skin',
  'YUDERMA Eclipse Solaire Active Sunscreen SPF 50 PA+++',
])
export const inClinicProductRecords = products => products.filter(product => clinicProductNames.has(product.name))
