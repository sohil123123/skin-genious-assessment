import { TREATMENT_STEPS } from './treatmentKnowledge.js'

export const DOCTOR_SESSION_LABEL = 'Dr. Supervised session'
export const DOCTOR_SETTINGS_NOTE = 'Doctor must select and document all device settings using the approved protocol before treatment. This draft does not approve settings.'
export const DOCTOR_CHECKLIST = 'Doctor sign-off required: review current findings, escalation indication, contraindications, consent, treatment zones, device settings and aftercare before starting.'
export const standaloneSlot = (scope, number) => scope?.course_outline?.find(slot => slot.session_number === number)?.session_kind === 'separate_clinician_session'
export const standaloneIds = slot => (slot?.candidate_step_ids || []).filter(id => TREATMENT_STEPS[id]?.facial_session_allowed === false)
export function standaloneAllowedSteps(core) {
  const needling = ['ENERGY.MNRF', 'ENERGY.NEEDLE.PEN', 'ENERGY.NEEDLE.ROLLER'].includes(core)
  return [core, 'PREP.CLEANSE', 'COOL.ICE', 'FINISH.SMS', ...(needling ? ['INFUSE.PDRN', 'INFUSE.EXO', 'LED.RED'] : [])]
}

export const STANDALONE_CONTINUATION_INSTRUCTIONS = `DOCTOR-SUPERVISED STANDALONE COURSE SLOTS
For each separate_clinician_session slot, generate a standalone draft for exactly one registered standalone procedure in that slot's candidate_step_ids. Preserve its original session number, week and conditional clinical goal. Do not convert it to a facial or assert that the escalation indication has been confirmed.
For these slots only, override facial total-duration windows, mandatory massage, routine facial finish, obligatory lip/under-eye/spot-acne add-ons and whole-face corrective breadth. Give realistic estimated positive step minutes, without padding to a facial target. Only the selected procedure and its indicated approved preparation/recovery belong in this session. HIFU companions are limited to cleansing, cooling and finish; needling may additionally use approved PDRN/exosome delivery or red LED where compatible. No companion is mandatory.
Keep the same session/step JSON fields, useful directions, equipment, preparation checklist and actual concerns addressed. Primary concerns outside this procedure's scope use blocked strategies with an explicit scope reason, never an unrelated extra corrective. Device settings, depths, energy, passes and shots are selected and documented by the treating doctor; do not prescribe numerical settings from catalogue specifications. Directions must defer procedural execution to the doctor's approved device protocol, screening, consent and monitoring. Describe preparation, doctor handover and indicated aftercare without inventing a protocol.
Include doctor review/sign-off before execution. Retain every contraindication, inventory, product-route, allergy and compatibility restriction. A contraindicated procedure cannot be approved by this draft. Facial slots in the same batch retain every existing facial rule.`
