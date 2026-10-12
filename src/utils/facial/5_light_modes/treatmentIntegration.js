// Map only actual intake answers; missing screening remains unknown.
export function treatmentHistoryFlags(patient) {
  const flags = {}
  const answer = value => value === true || value === 'yes' || value === 'true' ? true
    : value === false || value === 'no' || value === 'false' ? false : undefined
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
  if (typeof patient.age === 'number' && Number.isFinite(patient.age))
    flags.age_between_30_and_60 = patient.age >= 30 && patient.age <= 60
  for (const [field, mapping] of Object.entries({
    medical_history: { diabetes: 'Diabetes', thyroid: 'Thyroid', PCOD: 'PCOD', on_blood_thinners: 'Blood thinners' },
    allergies: { aloe_vera_allergy: 'Aloe Vera', vitamin_c_allergy: 'Vitamin C' },
  })) {
    const values = patient[field]
    if (Array.isArray(values) && values.length)
      for (const [condition, label] of Object.entries(mapping)) flags[condition] = values.includes(label)
  }
  // A salicylic/glycolic allergy is not evidence of using that acid yesterday.
  return flags
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
