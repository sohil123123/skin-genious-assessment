// Compiled from the supplied mother document v1.3. Strength ratings are retained.
import { treatmentConcernFamily } from './treatmentEvidence.js'
export const TREATMENT_KNOWLEDGE_REVISION = "2026-10-03-mother-v1.3-v5"
export const TREATMENT_STEPS = {
  "PREP.CLEANSE": {
    "id": "PREP.CLEANSE",
    "name": "Cleanse",
    "equipment_reference": "Cleanser, cleansing towels",
    "mechanism": "Removes sunscreen, sebum, particulate",
    "burden": "0",
    "strengths": "Prep for everything",
    "notes": "—",
    "modality_id": "PREP.CLEANSE",
    "clinic_step_type": "cleansing",
    "inventory_required": [
      "Cleansing Towels"
    ],
    "facial_session_allowed": true
  },
  "EXFO.SPATULA": {
    "id": "EXFO.SPATULA",
    "name": "Ultrasonic cutin removal",
    "equipment_reference": "Hydrafacial Machine — Cutin Removal Spatula",
    "mechanism": "Ultrasonic vibration lifts loosened corneocytes and sebum film",
    "burden": "1",
    "strengths": "Textural radiance keratin_congestion_deficit (3), sebum (2), pores (2), luminosity (2)",
    "notes": "Gentle; safe on barrier-caution skin; pregnancy-safe",
    "modality_id": "EXFO.SPATULA",
    "clinic_step_type": "other",
    "inventory_required": [
      "Cutin Removal Spatula (Exfoliator)"
    ],
    "facial_session_allowed": true,
    "reference_minutes": [
      3,
      5
    ]
  },
  "EXFO.VORTEX": {
    "id": "EXFO.VORTEX",
    "name": "Hydradermabrasion with serum",
    "equipment_reference": "Hydrafacial Machine — Suction Probe / Bubble Pen with Serum AS1 / SA2 / A03",
    "mechanism": "Fluid exfoliation + vacuum extraction + serum delivery",
    "burden": "1",
    "strengths": "Hydration (3), luminosity (3), pores/blackheads (3), sebum (2 with SA2), textural radiance (3)",
    "notes": "AS1 normal, SA2 oily, A03 dry; pregnancy-safe; the universal support step",
    "modality_id": "EXFO.VORTEX",
    "clinic_step_type": "suction",
    "inventory_required": [
      "Suction Probe / Bubble Pen"
    ],
    "facial_session_allowed": true
  },
  "EXFO.TEEN": {
    "id": "EXFO.TEEN",
    "name": "Teenage Line probe",
    "equipment_reference": "Hydrafacial Machine — Teenage Line",
    "mechanism": "Acne-oriented suction/cleansing for congested young skin",
    "burden": "1",
    "strengths": "Comedonal acne (3), sebum (2), pores (2)",
    "notes": "Gentler than SA peels",
    "modality_id": "EXFO.TEEN",
    "clinic_step_type": "suction",
    "inventory_required": [
      "Teenage Line"
    ],
    "facial_session_allowed": true
  },
  "EXFO.MICRO.DIAMOND": {
    "id": "EXFO.MICRO.DIAMOND",
    "name": "Microdermabrasion, diamond tip",
    "equipment_reference": "Microdermabrasion Machine",
    "mechanism": "Mechanical abrasion of stratum corneum under vacuum",
    "burden": "2",
    "strengths": "Texture roughness (4), textural radiance surface_smoothness (4), dullness (3), superficial fine lines (2)",
    "notes": "Face: diamond only; not on active acne, rosacea-pattern redness, flaking barrier; counts as aggressive exfoliation for the retinol-24h and blood-thinner rules",
    "modality_id": "EXFO.MICRO.DIAMOND",
    "clinic_step_type": "other",
    "inventory_required": [
      "Microdermabrasion Machine",
      "Diamond Tip"
    ],
    "facial_session_allowed": true,
    "reference_minutes": [
      8,
      12
    ]
  },
  "EXTR.MANUAL": {
    "id": "EXTR.MANUAL",
    "name": "Manual extraction",
    "equipment_reference": "Comedone extractor, loop extractor",
    "mechanism": "Mechanical clearing of open/closed comedones",
    "burden": "2",
    "strengths": "Comedonal acne (4), blackhead congestion (4), pores (2)",
    "notes": "On softened skin; never on inflamed papules/pustules/nodules; typically followed by ENERGY.HF",
    "modality_id": "EXTR.MANUAL",
    "clinic_step_type": "other",
    "inventory_required": [
      "Manual Comedone Extractor"
    ],
    "facial_session_allowed": true,
    "reference_minutes": [
      3,
      8
    ]
  },
  "ENERGY.HF": {
    "id": "ENERGY.HF",
    "name": "High-frequency",
    "equipment_reference": "High-Frequency Machine",
    "mechanism": "Ozone + mild germicidal/thermal effect",
    "burden": "1",
    "strengths": "Post-extraction sanitation (5 for that purpose), drying pustules (3), BIBI (2)",
    "notes": "Energy device → excluded in pregnancy; avoid rosacea-pattern redness; a support step, never a hero",
    "modality_id": "ENERGY.HF",
    "clinic_step_type": "other",
    "inventory_required": [
      "High-Frequency Machine"
    ],
    "facial_session_allowed": true,
    "reference_minutes": [
      2,
      4
    ]
  },
  "PEEL.SPOT.SALI": {
    "id": "PEEL.SPOT.SALI",
    "name": "Spot salicylic (lesion-directed adjunct)",
    "equipment_reference": "Sali DS / SA 30 % / SA 20 % on lesion zones only",
    "mechanism": "Keratolytic + anti-inflammatory on the lesion",
    "burden": "1 (local)",
    "strengths": "Active acne lesions (mandatory adjunct per constraints)",
    "notes": "Uncounted adjunct; avoid under-eye, lips, broken skin; blocked by the salicylic rules",
    "modality_id": "PEEL.SPOT.SALI",
    "clinic_step_type": "spot_salicylic",
    "inventory_required": [],
    "facial_session_allowed": true
  },
  "PEEL.PARTY": {
    "id": "PEEL.PARTY",
    "name": "Party Peel",
    "actives": "Lactic 40 %, arginine 20 %, arbutin 20 %, niacinamide 10 %",
    "clinic_class": "superficial",
    "burden": "1",
    "strengths": "Luminosity/glow (5), event readiness (5), hydration (3 — lactic humectancy), textural radiance (4), superficial pigment brightness (3), tone evenness (3)",
    "notes": "Pregnancy-permitted; best same-evening result; little structural change",
    "modality_id": "PEEL.PARTY",
    "clinic_step_type": "chemical_peel",
    "inventory_required": [
      "Party Peel"
    ],
    "facial_session_allowed": true
  },
  "PEEL.PUMPKIN": {
    "id": "PEEL.PUMPKIN",
    "name": "Gel Based Pumpkin Peel",
    "actives": "Pumpkin enzymes, lactic 6 %, gluconic 1.5 %, salicylic 1 %, mandelic 3 %, betaine, resveratrol, aloe",
    "clinic_class": "superficial",
    "burden": "1",
    "strengths": "Sensitive-skin glow (4), textural radiance (3), luminosity (3), mild congestion (2)",
    "notes": "Pregnancy-permitted; contains aloe (aloe-allergy rule); the glow choice on barrier-caution skin",
    "modality_id": "PEEL.PUMPKIN",
    "clinic_step_type": "chemical_peel",
    "inventory_required": [
      "Gel Based Pumpkin Peel"
    ],
    "facial_session_allowed": true
  },
  "PEEL.MANDELIC": {
    "id": "PEEL.MANDELIC",
    "name": "Gel Based Mandelic Peel",
    "actives": "Mandelic (%, unstated), niacinamide, tocopherol, aloe, clay base",
    "clinic_class": "superficial",
    "burden": "1",
    "strengths": "Mild acne (2), mild brightening (2), gentle exfoliation on very reactive FP V–VI skin (3)",
    "notes": "Anti-default rule; contains aloe; wins only on tolerance grounds",
    "modality_id": "PEEL.MANDELIC",
    "clinic_step_type": "chemical_peel",
    "inventory_required": [
      "Gel Based Mandelic Peel"
    ],
    "facial_session_allowed": true
  },
  "PEEL.WHITENING": {
    "id": "PEEL.WHITENING",
    "name": "Whitening Peel",
    "actives": "Glycolic 15 %, lactic 10 %, kojic 10 %, arbutin 10 %, licorice 3 %, \"Bright Light\" 2 %",
    "clinic_class": "superficial",
    "burden": "2",
    "strengths": "Tone evenness (4), mild superficial pigment (4), dullness (4), luminosity (3)",
    "notes": "Prefer over Party when tone > glow; kojic can sensitise",
    "modality_id": "PEEL.WHITENING",
    "clinic_step_type": "chemical_peel",
    "inventory_required": [
      "Whitening Peel"
    ],
    "facial_session_allowed": true
  },
  "PEEL.SA20": {
    "id": "PEEL.SA20",
    "name": "20 % Salicylic Acid Peel",
    "actives": "Salicylic 20 %",
    "clinic_class": "superficial",
    "burden": "2",
    "strengths": "Blackhead congestion (5), comedonal acne (4), pores (4), sebum (4), textural radiance keratin_congestion (4)",
    "notes": "Salicylic rules; follicular action explains pore/oil strength",
    "modality_id": "PEEL.SA20",
    "clinic_step_type": "chemical_peel",
    "inventory_required": [
      "20 % Salicylic Acid Peel"
    ],
    "facial_session_allowed": true
  },
  "PEEL.SA30": {
    "id": "PEEL.SA30",
    "name": "Salicylic Acid 30 % Peel",
    "actives": "Salicylic 30 %",
    "clinic_class": "medium",
    "burden": "3",
    "strengths": "Active inflammatory acne (5), high sebum (5), congestion (5), BIBI (4)",
    "notes": "Medium class for sun/travel/event rules; observe for frosting",
    "modality_id": "PEEL.SA30",
    "clinic_step_type": "chemical_peel",
    "inventory_required": [
      "Salicylic Acid 30 % Peel"
    ],
    "facial_session_allowed": true
  },
  "PEEL.SALIDS": {
    "id": "PEEL.SALIDS",
    "name": "Sali DS Peel",
    "actives": "Salicylic (strength unstated), polymer carriers",
    "clinic_class": "medium",
    "burden": "3",
    "strengths": "Active acne hotspots (5), oily acne-prone skin (4), lesion-directed work (5)",
    "notes": "Treated as medium",
    "modality_id": "PEEL.SALIDS",
    "clinic_step_type": "chemical_peel",
    "inventory_required": [
      "Sali DS Peel"
    ],
    "facial_session_allowed": true
  },
  "PEEL.COMBO": {
    "id": "PEEL.COMBO",
    "name": "Combination Peel",
    "actives": "Salicylic 20 %, mandelic 20 %",
    "clinic_class": "superficial",
    "burden": "2–3",
    "strengths": "Acne + PIH in darker skin (5), PIH with ongoing activity (4), oily uneven tone (4)",
    "notes": "The FP IV–VI mixed-case peel: mandelic's large molecule limits PIH risk",
    "modality_id": "PEEL.COMBO",
    "clinic_step_type": "chemical_peel",
    "inventory_required": [
      "Combination Peel"
    ],
    "facial_session_allowed": true
  },
  "PEEL.FUSION": {
    "id": "PEEL.FUSION",
    "name": "Fusion Peel-E",
    "actives": "Salicylic 10 %, glycolic 30 %, lactic 10 %, pyruvic 2 %",
    "clinic_class": "medium",
    "burden": "3",
    "strengths": "Post-acne pigmentation (5), resurfacing (4), texture (4), superficial pigment (4), fine lines (3)",
    "notes": "Strongest resurfacing peel; medium class; not within 7 days of an event",
    "modality_id": "PEEL.FUSION",
    "clinic_step_type": "chemical_peel",
    "inventory_required": [
      "Fusion Peel-E"
    ],
    "facial_session_allowed": true
  },
  "PEEL.GLYCO35": {
    "id": "PEEL.GLYCO35",
    "name": "Glyco Peel 35",
    "actives": "Glycolic 35 %",
    "clinic_class": "medium",
    "burden": "3",
    "strengths": "Texture/roughness (5), dehydration-type wrinkles (4), surface rejuvenation (5), dullness (4), superficial pigment (3)",
    "notes": "Medium class; timed and neutralised; not on flaking barrier",
    "modality_id": "PEEL.GLYCO35",
    "clinic_step_type": "chemical_peel",
    "inventory_required": [
      "Glyco Peel 35"
    ],
    "facial_session_allowed": true
  },
  "ENERGY.CARBON.APPLY": {
    "id": "ENERGY.CARBON.APPLY",
    "name": "Carbon Facial",
    "equipment_reference": "Q-Switch 1064 nm low fluence over Carbon Lotion / Liquid Charcoal",
    "mechanism": "Photothermal/photomechanical vaporisation of carbon in pores: sebum reduction, pore refinement, superficial pigment lift, mild dermal stimulation",
    "burden": "2",
    "strengths": "Sebum (5), pores (5), blackhead congestion (4), active acne (4 — photothermal effect on sebaceous units and C. acnes), superficial pigment/tan (4), luminosity (4), textural radiance (4), texture (3), PIH (3)",
    "notes": "Carbon uses two atomic steps belonging to one corrective modality. All existing energy eligibility gates apply.",
    "modality_id": "ENERGY.CARBON",
    "clinic_step_type": "carbon_application_drying",
    "inventory_required": [
      "Carbon Lotion"
    ],
    "facial_session_allowed": true
  },
  "ENERGY.CARBON.LASER": {
    "id": "ENERGY.CARBON.LASER",
    "name": "Carbon Facial",
    "equipment_reference": "Q-Switch 1064 nm low fluence over Carbon Lotion / Liquid Charcoal",
    "mechanism": "Photothermal/photomechanical vaporisation of carbon in pores: sebum reduction, pore refinement, superficial pigment lift, mild dermal stimulation",
    "burden": "2",
    "strengths": "Sebum (5), pores (5), blackhead congestion (4), active acne (4 — photothermal effect on sebaceous units and C. acnes), superficial pigment/tan (4), luminosity (4), textural radiance (4), texture (3), PIH (3)",
    "notes": "Carbon uses two atomic steps belonging to one corrective modality. All existing energy eligibility gates apply.",
    "modality_id": "ENERGY.CARBON",
    "clinic_step_type": "carbon_laser",
    "inventory_required": [
      "Q-Switch Laser",
      "Carbon Lotion"
    ],
    "facial_session_allowed": true
  },
  "ENERGY.QS.TONING": {
    "id": "ENERGY.QS.TONING",
    "name": "Q-switch laser toning",
    "equipment_reference": "Q-Switch 1064 nm, low fluence, no carbon",
    "mechanism": "Sub-photothermolytic melanosome disruption",
    "burden": "2",
    "strengths": "Diffuse superficial pigment (4), selected melasma-pattern cases (3 per session, cumulative), PIH (3), tan (4)",
    "notes": "Same exclusions as Carbon; never standalone hero for active acne; single-session delta modest. For melasma, select when case history and clinical assessment favour toning over alternatives; review prior response, pigment stability, irritation and PIH risk. Sun-rule clearance alone does not select toning.",
    "modality_id": "ENERGY.QS.TONING",
    "clinic_step_type": "other",
    "inventory_required": [
      "Q-Switch Laser"
    ],
    "facial_session_allowed": true,
    "reference_minutes": [
      8,
      12
    ]
  },
  "ENERGY.QS.532": {
    "id": "ENERGY.QS.532",
    "name": "Q-switch 532 nm spot",
    "equipment_reference": "Q-Switch 532 nm",
    "mechanism": "Epidermal melanin absorption, high selectivity",
    "burden": "3",
    "strengths": "Discrete lentigines/freckles (5 for discrete spots)",
    "notes": "High PIH risk FP IV–VI; doctor-level; test spot; not melasma",
    "modality_id": "ENERGY.QS.532",
    "clinic_step_type": "other",
    "inventory_required": [
      "Q-Switch Laser"
    ],
    "facial_session_allowed": true,
    "reference_minutes": [
      3,
      8
    ]
  },
  "ENERGY.QS.LIP": {
    "id": "ENERGY.QS.LIP",
    "name": "Lip pigmentation add-on",
    "equipment_reference": "Q-Switch, 2 passes, with hyaluronic serum",
    "mechanism": "Clinic lip protocol",
    "burden": "1",
    "strengths": "Lip pigmentation (3 per session)",
    "notes": "Triggered by the application's client-display score < 70; before finishing; constraints/proxy/temperature rules apply; wavelength/energy per Dr. Aakriti's protocol",
    "modality_id": "ENERGY.QS.LIP",
    "clinic_step_type": "lip_pigmentation_add_on",
    "inventory_required": [
      "Q-Switch Laser",
      "Hyaluronic Acid"
    ],
    "facial_session_allowed": true
  },
  "ENERGY.RF.LIFT": {
    "id": "ENERGY.RF.LIFT",
    "name": "RF lifting probe",
    "equipment_reference": "Hydrafacial Machine — Lifting Probe (RF) on pH-neutral gel",
    "mechanism": "Dermal heating ~40–43 °C → collagen contraction, fibroblast signalling, lymphatic warming",
    "burden": "1",
    "strengths": "Firmness early_diffuse (3), jawline mild (2), peri-orbital puffiness via drainage (2), hydration plumpness (2), luminosity (2)",
    "notes": "Heat-device rules; not over active inflammation",
    "modality_id": "ENERGY.RF.LIFT",
    "clinic_step_type": "other",
    "inventory_required": [
      "Lifting Probe (RF)"
    ],
    "facial_session_allowed": true,
    "reference_minutes": [
      6,
      10
    ]
  },
  "ENERGY.RF.MACHINE": {
    "id": "ENERGY.RF.MACHINE",
    "name": "Radiofrequency machine",
    "equipment_reference": "Radio Frequency Machine, energy 1–10",
    "mechanism": "Deeper dermal heating than the probe",
    "burden": "2",
    "strengths": "Firmness (4), early jawline laxity (3), structural superficial wrinkles (3), lower_face_predominant collagen loss (3)",
    "notes": "Heat rules; a course modality; immediate delta is contraction only",
    "modality_id": "ENERGY.RF.MACHINE",
    "clinic_step_type": "other",
    "inventory_required": [
      "Radio Frequency Machine"
    ],
    "facial_session_allowed": true,
    "reference_minutes": [
      10,
      15
    ]
  },
  "ENERGY.HIFU": {
    "id": "ENERGY.HIFU",
    "name": "HIFU",
    "equipment_reference": "HiFU Machine, 1.5 / 3 / 4.5 mm",
    "mechanism": "Focused ultrasound coagulation points in dermis and SMAS",
    "burden": "2 (deep)",
    "strengths": "Jawline sagging (5 at 3 months), firmness lower_face/global_mild (4), submental (3)",
    "notes": "Age 30–60 when indicated; numbing; see non-negotiable R5",
    "modality_id": "ENERGY.HIFU",
    "clinic_step_type": "other",
    "inventory_required": [
      "HiFU Machine"
    ],
    "facial_session_allowed": false
  },
  "ENERGY.MNRF": {
    "id": "ENERGY.MNRF",
    "name": "Microneedling RF",
    "equipment_reference": "Micro Needling Radio Frequency, 1.5 mm",
    "mechanism": "Fractional dermal RF through needles",
    "burden": "3",
    "strengths": "Scars/structural texture (5 over a course), pores (4), structural wrinkles (4), firmness (3)",
    "notes": "Downtime 2–4 d; see R5; not on active acne or caution barrier; not in pregnancy",
    "modality_id": "ENERGY.MNRF",
    "clinic_step_type": "other",
    "inventory_required": [
      "Micro Needling Radio Frequency"
    ],
    "facial_session_allowed": false
  },
  "ENERGY.NEEDLE.PEN": {
    "id": "ENERGY.NEEDLE.PEN",
    "name": "Dermapen / Dermaroller 1.5 mm",
    "equipment_reference": "Micro Needling Machine / Dermapen / Dermaroller",
    "mechanism": "Collagen induction; channels for PDRN/exosomes",
    "burden": "3",
    "strengths": "Texture (4), scars (4), fine lines (3), delivery of EXO/PDRN (4)",
    "notes": "See R5; rollers never on active acne",
    "modality_id": "ENERGY.NEEDLE.PEN",
    "clinic_step_type": "other",
    "inventory_required": [
      "Dermapen"
    ],
    "facial_session_allowed": false
  },
  "ENERGY.NEEDLE.ROLLER": {
    "id": "ENERGY.NEEDLE.ROLLER",
    "name": "Dermapen / Dermaroller 1.5 mm",
    "equipment_reference": "Micro Needling Machine / Dermapen / Dermaroller",
    "mechanism": "Collagen induction; channels for PDRN/exosomes",
    "burden": "3",
    "strengths": "Texture (4), scars (4), fine lines (3), delivery of EXO/PDRN (4)",
    "notes": "See R5; rollers never on active acne",
    "modality_id": "ENERGY.NEEDLE.ROLLER",
    "clinic_step_type": "other",
    "inventory_required": [
      "Dermaroller"
    ],
    "facial_session_allowed": false
  },
  "LED.BLUE": {
    "id": "LED.BLUE",
    "name": "LED blue (~415 nm)",
    "equipment_reference": "LED Light Therapy Machine",
    "mechanism": "Porphyrin photo-excitation kills C. acnes",
    "burden": "0",
    "strengths": "Acne BIBI/porphyrin (3), post-extraction bacterial control (3), sebum-linked inflammation (2)",
    "notes": "Pregnancy-excluded (constraints); photosensitising drugs",
    "modality_id": "LED.BLUE",
    "clinic_step_type": "other",
    "inventory_required": [
      "LED Light Therapy Machine",
      "Blue"
    ],
    "facial_session_allowed": true,
    "reference_minutes": [
      8,
      12
    ]
  },
  "LED.RED": {
    "id": "LED.RED",
    "name": "LED red (~630–660 nm)",
    "equipment_reference": "LED Light Therapy Machine",
    "mechanism": "Photobiomodulation: ATP, anti-inflammatory, healing",
    "burden": "0",
    "strengths": "Redness (3), barrier erythema (3), recovery after any corrective (4 for that purpose), healing after extraction (3), collagen (1)",
    "notes": "Permitted within 7 d of a laser; pregnancy-excluded; the clinic's calming light (there is no yellow mode)",
    "modality_id": "LED.RED",
    "clinic_step_type": "other",
    "inventory_required": [
      "LED Light Therapy Machine",
      "Red"
    ],
    "facial_session_allowed": true,
    "reference_minutes": [
      8,
      12
    ]
  },
  "LED.GREEN": {
    "id": "LED.GREEN",
    "name": "LED green (~525 nm)",
    "equipment_reference": "LED Light Therapy Machine",
    "mechanism": "Proposed melanocyte/vascular calming",
    "burden": "0",
    "strengths": "Mild redness (2), tone (1)",
    "notes": "Evidence D; soothing finish only, never a pigment corrective",
    "modality_id": "LED.GREEN",
    "clinic_step_type": "other",
    "inventory_required": [
      "LED Light Therapy Machine",
      "Green"
    ],
    "facial_session_allowed": true,
    "reference_minutes": [
      8,
      10
    ]
  },
  "INFUSE.HA": {
    "id": "INFUSE.HA",
    "name": "Facial infusion — Hyaluronic Acid",
    "equipment_reference": "Face Ultrasound Infusion Probe",
    "mechanism": "Sonophoresis of humectant",
    "burden": "0",
    "strengths": "Hydration (5), dehydration micro-lines (4), luminosity plumpness (3), barrier comfort (3)",
    "notes": "Default infusion; safe after any corrective; pregnancy-safe",
    "modality_id": "INFUSE.HA",
    "clinic_step_type": "infusion",
    "inventory_required": [
      "Face Ultrasound Infusion Probe",
      "Hyaluronic Acid"
    ],
    "infusion_ingredient": "Hyaluronic Acid",
    "facial_session_allowed": true
  },
  "INFUSE.VITC": {
    "id": "INFUSE.VITC",
    "name": "Facial infusion — Vitamin C",
    "equipment_reference": "Face Ultrasound Infusion Probe",
    "mechanism": "Antioxidant, tyrosinase modulation, collagen cofactor",
    "burden": "1",
    "strengths": "Luminosity/dullness (4), tone (3), photo-damage (3), clarity (2)",
    "notes": "Vitamin C allergy rule; stings on freshly medium-peeled skin — the model should weigh HA/PDRN instead on such days (advice, not a rule)",
    "modality_id": "INFUSE.VITC",
    "clinic_step_type": "infusion",
    "inventory_required": [
      "Face Ultrasound Infusion Probe",
      "Vitamin C"
    ],
    "infusion_ingredient": "Vitamin C",
    "facial_session_allowed": true
  },
  "INFUSE.TRX": {
    "id": "INFUSE.TRX",
    "name": "Facial infusion — Tranexamic Acid",
    "equipment_reference": "Face Ultrasound Infusion Probe",
    "mechanism": "Plasmin/vascular-melanocyte signalling inhibitor",
    "burden": "0",
    "strengths": "Melasma-pattern and diffuse pigment (4), PIH (3), pigment-redness coupling (3)",
    "notes": "The pigment infusion; pregnancy use is a clinician decision",
    "modality_id": "INFUSE.TRX",
    "clinic_step_type": "infusion",
    "inventory_required": [
      "Face Ultrasound Infusion Probe",
      "TRX A (Tranexamic Acid)"
    ],
    "infusion_ingredient": "TRX A (Tranexamic Acid)",
    "facial_session_allowed": true
  },
  "INFUSE.PDRN": {
    "id": "INFUSE.PDRN",
    "name": "Facial infusion — PDRN",
    "equipment_reference": "Face Ultrasound Infusion Probe",
    "mechanism": "Adenosine A2A agonism: repair, anti-inflammatory",
    "burden": "0",
    "strengths": "Barrier/sensitivity (4), redness (3), post-corrective recovery (4), hydration (3)",
    "notes": "Ideal after needling (own session), Carbon, medium peels",
    "modality_id": "INFUSE.PDRN",
    "clinic_step_type": "infusion",
    "inventory_required": [
      "Face Ultrasound Infusion Probe",
      "PDRN"
    ],
    "infusion_ingredient": "PDRN",
    "facial_session_allowed": true
  },
  "INFUSE.EXO": {
    "id": "INFUSE.EXO",
    "name": "Facial infusion — Exosomes",
    "equipment_reference": "Face Ultrasound Infusion Probe",
    "mechanism": "Vesicle-borne growth factors: regeneration, calming",
    "burden": "0",
    "strengths": "Firmness (3), texture (3), recovery (4), redness (3), luminosity (2)",
    "notes": "Highest cost; reserve for regeneration goals",
    "modality_id": "INFUSE.EXO",
    "clinic_step_type": "infusion",
    "inventory_required": [
      "Face Ultrasound Infusion Probe",
      "Exosomes"
    ],
    "infusion_ingredient": "Exosomes",
    "facial_session_allowed": true
  },
  "INFUSE.LIFT": {
    "id": "INFUSE.LIFT",
    "name": "Facial infusion — Lifting",
    "equipment_reference": "Face Ultrasound Infusion Probe",
    "mechanism": "Peptide/firming actives",
    "burden": "0",
    "strengths": "Firmness (3), event-day firmness (3)",
    "notes": "Pairs with RF.LIFT, MASK.LIFT",
    "modality_id": "INFUSE.LIFT",
    "clinic_step_type": "infusion",
    "inventory_required": [
      "Face Ultrasound Infusion Probe",
      "Lifting"
    ],
    "infusion_ingredient": "Lifting",
    "facial_session_allowed": true
  },
  "INFUSE.GLUT": {
    "id": "INFUSE.GLUT",
    "name": "Facial infusion — Glutathione",
    "equipment_reference": "Face Ultrasound Infusion Probe",
    "mechanism": "Antioxidant; topical brightening evidence weak (D)",
    "burden": "0",
    "strengths": "Dullness (2), tone (1)",
    "notes": "Never presented as pigment correction",
    "modality_id": "INFUSE.GLUT",
    "clinic_step_type": "infusion",
    "inventory_required": [
      "Face Ultrasound Infusion Probe",
      "Glutathione"
    ],
    "infusion_ingredient": "Glutathione",
    "facial_session_allowed": true
  },
  "EYE.INFUSE": {
    "id": "EYE.INFUSE",
    "name": "Under-eye infusion",
    "equipment_reference": "Ocular Ultrasound Infusion Probe; HA / Niacinamide / TRX / PDRN / Exosomes / Vitamin C",
    "mechanism": "Sonophoresis in the orbital zone",
    "burden": "0–1",
    "strengths": "Peri-orbital pigment_index (TRX 3, Vit C 2, niacinamide 2), texture_line_index (HA 3, PDRN 3, EXO 3), puffiness (with COOL 2), vascular_index (1), shadow_hollow_index (0 — do not promise)",
    "notes": "Customer-facing periocular score <=70 requires one 2-minute ocular infusion; no separate assessability/finding gate. Use approved serum and do not promise hollow correction; no acids",
    "modality_id": "EYE.INFUSE",
    "clinic_step_type": "under_eye_infusion",
    "inventory_required": [
      "Ocular Ultrasound Infusion Probe"
    ],
    "facial_session_allowed": true
  },
  "SPRAY.HYDRA": {
    "id": "SPRAY.HYDRA",
    "name": "Oxygen injection / hydra spray",
    "equipment_reference": "Oxygen Injection (Hydra spray); Vitamin C / TRX / HA / Niacinamide",
    "mechanism": "Pressurised micro-mist delivery and cooling comfort",
    "burden": "0",
    "strengths": "Hydration (3), comfort after peels/energy (3), redness calming with niacinamide (2), tone with Vit C (1)",
    "notes": "Needs a distinct purpose beyond the infusion (constraints)",
    "modality_id": "SPRAY.HYDRA",
    "clinic_step_type": "hydra_spray",
    "inventory_required": [
      "Oxygen Injection (Hydra spray)"
    ],
    "facial_session_allowed": true
  },
  "COOL.ICE": {
    "id": "COOL.ICE",
    "name": "Ice probe cooling",
    "equipment_reference": "Hydrafacial Machine — Ice Probe",
    "mechanism": "Vasoconstriction, nociceptor calming",
    "burden": "0",
    "strengths": "Redness (3 immediate), post-energy/post-peel comfort (5 for that purpose), puffiness (3 immediate), heat-rule mitigation (3)",
    "notes": "See non-negotiable R6",
    "modality_id": "COOL.ICE",
    "clinic_step_type": "cooling",
    "inventory_required": [
      "Ice Probe"
    ],
    "facial_session_allowed": true
  },
  "MASK.CHARCOAL": {
    "id": "MASK.CHARCOAL",
    "name": "Charcoal peel-off",
    "mechanism": "Adsorbs sebum/debris; mild exfoliation on removal",
    "burden": "1",
    "strengths": "Sebum (3), pores (2), keratin (2)",
    "notes": "Not on dry, flaking or sensitive skin; peel-off removal after a medium peel pulls compromised epidermis (see R-advice in 4.2)",
    "modality_id": "MASK.CHARCOAL",
    "clinic_step_type": "peel_off_mask",
    "inventory_required": [
      "Charcoal"
    ],
    "facial_session_allowed": true
  },
  "MASK.CALMING": {
    "id": "MASK.CALMING",
    "name": "Calming peel-off",
    "mechanism": "Soothing actives, cooling",
    "burden": "0",
    "strengths": "Redness (3), barrier (3), post-corrective recovery (3)",
    "notes": "—",
    "modality_id": "MASK.CALMING",
    "clinic_step_type": "peel_off_mask",
    "inventory_required": [
      "Calming"
    ],
    "facial_session_allowed": true
  },
  "MASK.BRIGHTEN": {
    "id": "MASK.BRIGHTEN",
    "name": "Brighten peel-off",
    "mechanism": "Brightening actives, film-forming",
    "burden": "0–1",
    "strengths": "Tone/dullness (3), superficial pigment (2), luminosity (3)",
    "notes": "—",
    "modality_id": "MASK.BRIGHTEN",
    "clinic_step_type": "peel_off_mask",
    "inventory_required": [
      "Brighten"
    ],
    "facial_session_allowed": true
  },
  "MASK.HYDRATE": {
    "id": "MASK.HYDRATE",
    "name": "Hydrate peel-off",
    "mechanism": "Occlusive humectant delivery",
    "burden": "0",
    "strengths": "Hydration (4), dehydration lines (3), barrier (2), luminosity (2)",
    "notes": "—",
    "modality_id": "MASK.HYDRATE",
    "clinic_step_type": "peel_off_mask",
    "inventory_required": [
      "Hydrate"
    ],
    "facial_session_allowed": true
  },
  "MASK.LIFT": {
    "id": "MASK.LIFT",
    "name": "Lift peel-off",
    "mechanism": "Film tension + firming actives",
    "burden": "0",
    "strengths": "Firmness (2 immediate), event firmness (3), jawline (1)",
    "notes": "—",
    "modality_id": "MASK.LIFT",
    "clinic_step_type": "peel_off_mask",
    "inventory_required": [
      "Lift"
    ],
    "facial_session_allowed": true
  },
  "MASSAGE.LYMPH": {
    "id": "MASSAGE.LYMPH",
    "name": "Face and Neck Lymphatic Drainage Massage",
    "mechanism": "Lymphatic clearance, de-puffing, relaxation",
    "burden": "0",
    "strengths": "Puffiness (3), sallow tone (2), transient contour (2), client experience (3)",
    "notes": "Exactly one mandatory 5-10-minute step in every detailed facial, per the user-confirmed clinic rule. Use existing approved technique and zone precautions; reference advice does not authorize routine omission. An actual evaluated clinical hard stop requires an explicit blocked result.",
    "modality_id": "MASSAGE.LYMPH",
    "clinic_step_type": "lymphatic_drainage",
    "inventory_required": [],
    "facial_session_allowed": true
  },
  "FINISH.SMS": {
    "id": "FINISH.SMS",
    "name": "Serum + moisturiser + sunscreen",
    "mechanism": "Barrier seal and UV protection",
    "burden": "0",
    "strengths": "Mandatory last step",
    "notes": "Products per 1.7; mineral sunscreen default",
    "modality_id": "FINISH.SMS",
    "clinic_step_type": "finishing",
    "inventory_required": [],
    "facial_session_allowed": true
  }
}

export const TREATMENT_KNOWLEDGE = {
  "mother_document_version": "1.3",
  "strength_scale": {
    "5": "Primary corrective; largest one-session visible change for this concern",
    "4": "Strong corrective or strong contributor",
    "3": "Meaningful support; visible but smaller change",
    "2": "Minor or indirect contribution",
    "1": "Negligible for this concern; include only for another reason",
    "0": "No effect, or counter-productive (see \"avoid\")"
  },
  "scope": "Reference knowledge, not a treatment template. Preserve all supplied scores and targets. The raw clinical constraints and validated clinic protocols govern permissions.",
  "concern_maps": [
    {
      "concern": "Skin Type Classification (label; drives defaults, not a concern)",
      "drivers": "",
      "columns": [
        "Label / modifier",
        "Default vortex serum",
        "Default infusion",
        "Default mask",
        "Default finish",
        "Engine bias"
      ],
      "patterns": [
        [
          "Dry",
          "A03",
          "INFUSE.HA",
          "MASK.HYDRATE",
          "Dry/sensitive set",
          "Favour PARTY/PUMPKIN/GLYCO35 over salicylic"
        ],
        [
          "Oily",
          "SA2",
          "INFUSE.HA or TRX",
          "MASK.CHARCOAL if barrier intact",
          "Oily set",
          "Favour CARBON, SA20/SA30, SALIDS"
        ],
        [
          "Combination",
          "AS1 (SA2 on T-zone if zoned)",
          "INFUSE.HA",
          "By dominant concern",
          "By zone",
          "Zone the plan"
        ],
        [
          "Balanced",
          "AS1",
          "INFUSE.HA",
          "MASK.BRIGHTEN",
          "Dry/sensitive set",
          "Glow-oriented"
        ],
        [
          "_sensitive",
          "A03",
          "INFUSE.PDRN or HA",
          "MASK.CALMING",
          "Dry/sensitive set",
          "Drop one peel class; EXFO.SPATULA over MICRO; LED.RED"
        ],
        [
          "_sun_reactive",
          "—",
          "INFUSE.VITC (if tolerated) + TRX",
          "MASK.CALMING",
          "Mineral SPF emphasis",
          "Conservative pigment work; Q-switch only when the sun rule clears"
        ],
        [
          "Fitzpatrick IV–VI",
          "—",
          "—",
          "—",
          "—",
          "Prefer COMBO/MANDELIC chemistry over high glycolic on PIH-prone zones; conservative fluence; never 532 nm without the doctor"
        ]
      ]
    },
    {
      "concern": "Barrier Health + Sensitivity (BSI_continuous, higher is worse)",
      "drivers": "Drivers: barrier_damage_pattern, sensitivity_pattern, hydration_signal_index, erythema_intensity_index, flaking_texture_index, barrier_uniformity_index, improvability_index.",
      "columns": [
        "Pattern",
        "Hero (strength)",
        "Secondary / support",
        "Recovery",
        "Avoid (0)"
      ],
      "patterns": [
        [
          "Dryness-driven impairment (flaking > 0.5)",
          "INFUSE.HA (5) + MASK.HYDRATE (4)",
          "EXFO.SPATULA (2), PEEL.PUMPKIN (2 if flaking mild)",
          "LED.RED (3), SPRAY.HYDRA HA (3)",
          "MICRO.*, SA30, GLYCO35, FUSION, CARBON, MASK.CHARCOAL"
        ],
        [
          "Dehydration-driven impairment (hydration < 0.40)",
          "INFUSE.HA (5), EXFO.VORTEX A03 (4)",
          "SPRAY.HYDRA HA (3), MASK.HYDRATE (4)",
          "COOL.ICE if warm",
          "Medium peels, charcoal mask"
        ],
        [
          "Structural barrier disruption (uniformity < 0.55 → energy denied)",
          "INFUSE.PDRN (5), INFUSE.HA (4), MASK.CALMING (4)",
          "EXFO.SPATULA only (2)",
          "LED.RED treated as allowed low-risk recovery light",
          "All peels except PUMPKIN; all abrasion; all heat"
        ],
        [
          "Inflammatory sensitivity (erythema > 0.60)",
          "LED.RED (4), INFUSE.PDRN (4), COOL.ICE (4)",
          "MASK.CALMING (4), SPRAY.HYDRA niacinamide (3)",
          "—",
          "Acids, heat, HF, massage pressure over affected zones pressure"
        ],
        [
          "Vascular-reactive",
          "COOL.ICE (4), LED.RED (3), MASK.CALMING (3)",
          "INFUSE.PDRN (3)",
          "—",
          "Heat devices, vigorous massage, glycolic"
        ],
        [
          "Low-reactive (BSI < 0.35)",
          "No barrier work needed",
          "—",
          "—",
          "—"
        ]
      ]
    },
    {
      "concern": "Visual Acne Grading (ASI_continuous, higher is worse)",
      "drivers": "Drivers: lesion_counts, inflammatory_ratio, comedone_density_index, inflammatory_cluster_index, uv_porhyrin_load, chronicity_index, nodular_flag, BIBI_index, region_activity_map, improvability_index. Mandatory: visible active lesions → PEEL.SPOT.SALI (uncounted adjunct). Standalone Q-switch is never the acne hero.",
      "columns": [
        "Phenotype",
        "Hero candidates (strength)",
        "Secondary corrective",
        "Support",
        "Recovery",
        "Avoid"
      ],
      "patterns": [
        [
          "Comedonal / congestion",
          "PEEL.SA20 (5), ENERGY.CARBON (5), PEEL.SALIDS (4), EXFO.TEEN (3), PEEL.COMBO (4 if PIH)",
          "EXTR.MANUAL (4) with ENERGY.HF after",
          "EXFO.VORTEX SA2 (3), MASK.CHARCOAL (3)",
          "LED.BLUE (3), LED.RED (2)",
          "MANDELIC by default; MICRO on pustules; rollers"
        ],
        [
          "Inflammatory papulopustular",
          "ENERGY.CARBON (5 if allowed), PEEL.SA30 (5), PEEL.SALIDS (5), PEEL.COMBO (4)",
          "PEEL.SPOT.SALI adjunct; ENERGY.HF sparking (3)",
          "LED.BLUE (3), COOL.ICE (3)",
          "LED.RED (3), MASK.CALMING (3), INFUSE.PDRN (3)",
          "Extraction of inflamed lesions; MICRO; massage pressure over affected zones; charcoal on inflamed skin; MNRF"
        ],
        [
          "High BIBI / porphyrin",
          "ENERGY.CARBON (5), PEEL.SA30 (4)",
          "LED.BLUE (4), ENERGY.HF (3)",
          "MASK.CHARCOAL (2)",
          "LED.RED (2)",
          "—"
        ],
        [
          "Nodular (nodular_flag)",
          "No in-clinic corrective targets nodules → doctor referral; session limited to LED, COOL, gentle hydration",
          "—",
          "—",
          "—",
          "Peels on nodules, extraction, heat"
        ],
        [
          "Acne + PIH (chronicity high)",
          "PEEL.COMBO (5), PEEL.FUSION (5 when lesions are quiet), ENERGY.CARBON (4)",
          "PEEL.SPOT.SALI; INFUSE.TRX (3)",
          "MASK.BRIGHTEN (2)",
          "LED.RED",
          "Glycolic-heavy peels on active pustules FP V–VI"
        ],
        [
          "PCOD-linked",
          "As above; modest outlook (constraints)",
          "—",
          "—",
          "—",
          "—"
        ]
      ]
    },
    {
      "concern": "Skin Sebum Index (SSI_continuous; target the balance zone)",
      "drivers": "Drivers: shine_reflectance_index, sebaceous_congestion_index, porphyrin_load_index, sebum_depth_component_index, sebum_variability_index, regional_sebum_map.",
      "columns": [
        "Pattern",
        "Hero (strength)",
        "Secondary",
        "Support",
        "Avoid"
      ],
      "patterns": [
        [
          "Surface-shine dominant",
          "ENERGY.CARBON (5), PEEL.SA20 (4)",
          "EXFO.VORTEX SA2 (3)",
          "MASK.CHARCOAL (3), SPRAY niacinamide (2)",
          "Occlusives"
        ],
        [
          "Follicular-congestion dominant",
          "PEEL.SA30 (5), ENERGY.CARBON (5), PEEL.SALIDS (4)",
          "EXTR.MANUAL (3) + HF",
          "LED.BLUE (3)",
          "—"
        ],
        [
          "High variability (T-zone only)",
          "CARBON or SA20 on T-zone (4); cheeks hydrated",
          "INFUSE.HA cheeks (3)",
          "—",
          "Full-face salicylic"
        ],
        [
          "Very low sebum (SSI < 0.20)",
          "Treat hydration (2.6), not sebum",
          "—",
          "—",
          "Degreasing"
        ]
      ]
    },
    {
      "concern": "Vascularity / Redness (BIBI_index; score higher is worse)",
      "drivers": "Drivers: clinical_erythema_visibility, vascular_pattern_prominence, diffuse_background_redness, subclinical_inflammation_hotspots, sebaceous_inflammation_component, diffuse_vs_vascular dominance.",
      "columns": [
        "Pattern",
        "Hero (strength)",
        "Secondary",
        "Support",
        "Avoid"
      ],
      "patterns": [
        [
          "Diffuse-dominant, mild–moderate",
          "LED.RED (4), INFUSE.PDRN (4)",
          "MASK.CALMING (4), COOL.ICE (4)",
          "SPRAY niacinamide (3), INFUSE.TRX (2)",
          "Glycolic, salicylic > 20 %, heat, HF, massage pressure over affected zones"
        ],
        [
          "Vascular-dominant",
          "COOL.ICE (3), LED.RED (3)",
          "MASK.CALMING (3)",
          "—",
          "No in-clinic device treats vessels (no vascular laser); set expectations"
        ],
        [
          "Sebaceous-inflammation component",
          "Treat as inflammatory acne with CARBON or SA30 at conservative settings",
          "LED.BLUE then RED",
          "COOL.ICE",
          "—"
        ],
        [
          "High / rosacea-like (> 65)",
          "Barrier-first: INFUSE.PDRN, LED.RED, COOL.ICE, MASK.CALMING",
          "—",
          "—",
          "Every corrective; temperature rule usually triggers"
        ]
      ]
    },
    {
      "concern": "Skin Hydration (HSI_continuous, higher is better)",
      "drivers": "Drivers: hydration_deficit_type, surface_reflectance_index, microline_density_index, subsurface_diffusion_index, dry_patch_fluorescence_index, sebum_balance_ratio, hydration_recovery_potential.",
      "columns": [
        "Deficit type",
        "Hero (strength)",
        "Secondary",
        "Support"
      ],
      "patterns": [
        [
          "surface_dehydration",
          "EXFO.VORTEX A03 (4), INFUSE.HA (5)",
          "PEEL.PARTY (3 if barrier allows)",
          "MASK.HYDRATE (4), SPRAY HA (3)"
        ],
        [
          "deep_dermal_dehydration",
          "INFUSE.HA (5), INFUSE.PDRN (4)",
          "ENERGY.RF.LIFT (2)",
          "MASK.HYDRATE (4)"
        ],
        [
          "sebum_deficiency_dehydration",
          "INFUSE.HA (4) + lipid-rich finish (5)",
          "EXFO.SPATULA only (1)",
          "MASK.HYDRATE (4)"
        ],
        [
          "mixed_dehydration (oily + dehydrated)",
          "INFUSE.HA (5)",
          "EXFO.VORTEX SA2 (3) or SA20 T-zone (3)",
          "MASK.HYDRATE (3), SPRAY (3)"
        ],
        [
          "well_hydrated",
          "Maintain",
          "—",
          "—"
        ]
      ]
    },
    {
      "concern": "Skin Luminosity / Glow (GLI_continuous, higher is better)",
      "drivers": "Drivers: glow_limiting_factors, surface_reflectance_uniformity, sebum_gloss_index, treatment_responsiveness_index.",
      "columns": [
        "Limiting factor",
        "Hero (strength)",
        "Secondary",
        "Support",
        "Avoid"
      ],
      "patterns": [
        [
          "dullness_due_to_dryness",
          "INFUSE.HA (5), PEEL.PARTY (4)",
          "MASK.HYDRATE (4)",
          "SPRAY (3)",
          "Degreasing"
        ],
        [
          "dullness_due_to_texture",
          "PEEL.GLYCO35 (5), EXFO.MICRO.DIAMOND (4), PEEL.PARTY (4)",
          "ENERGY.CARBON (4)",
          "MASK.BRIGHTEN (3)",
          "—"
        ],
        [
          "dullness_due_to_low_L (pigment/tan)",
          "ENERGY.CARBON (4), PEEL.WHITENING (4), ENERGY.QS.TONING (3)",
          "INFUSE.VITC (4), INFUSE.TRX (3)",
          "MASK.BRIGHTEN (3)",
          "—"
        ],
        [
          "dullness_due_to_shadows (laxity)",
          "ENERGY.RF.LIFT (3), INFUSE.LIFT (2)",
          "MASSAGE.LYMPH (2)",
          "MASK.LIFT (2)",
          "—"
        ],
        [
          "Event readiness",
          "PEEL.PARTY (5), PEEL.PUMPKIN (4 sensitive)",
          "INFUSE.HA + VITC",
          "MASK.BRIGHTEN",
          "Medium peels, CARBON within 7 days of the event (constraints)"
        ]
      ]
    },
    {
      "concern": "Superficial Pigmentation (PPL_continuous, higher is worse)",
      "drivers": "Drivers: coverage_area_percent, mean_intensity_index, contrast_to_surrounding_skin_index, uniformity_index, border_definition_score, depth_index_uv_to_woods, superficial_fraction_index, uv_enhancement_ratio, improvability_index, regional_burden_map, pigment_grid_map.",
      "columns": [
        "Phenotype",
        "Hero candidates (strength)",
        "Secondary",
        "Support",
        "Avoid"
      ],
      "patterns": [
        [
          "Diffuse tan (coverage high, intensity mild, superficial_fraction high)",
          "ENERGY.CARBON (5), PEEL.WHITENING (4), PEEL.PARTY (4 glow), ENERGY.QS.TONING (4)",
          "INFUSE.VITC (4) or TRX (3)",
          "MASK.BRIGHTEN (3)",
          "Peels/laser while the sun rule triggers"
        ],
        [
          "Discrete spots, sharp borders",
          "ENERGY.QS.532 spot (5, doctor-level), ENERGY.CARBON (3), PEEL.WHITENING (3)",
          "INFUSE.TRX (2)",
          "—",
          "532 on FP V–VI without a test spot"
        ],
        [
          "Melasma-pattern (malar, uneven borders, uv_enhancement high, thyroid/PCOD history)",
          "ENERGY.QS.TONING low fluence (4 per session in selected cases), PEEL.WHITENING (3), PEEL.COMBO (3). Select toning for a documented case-specific advantage; passing the sun rule alone is insufficient.",
          "INFUSE.TRX (5)",
          "MASK.BRIGHTEN (2), COOL.ICE (3 — heat worsens melasma)",
          "Medium glycolic peels, high fluence, heat devices, MICRO"
        ],
        [
          "Post-inflammatory (chronicity high)",
          "PEEL.FUSION (5), PEEL.COMBO (5 if active acne), ENERGY.CARBON (4), PEEL.WHITENING (3)",
          "INFUSE.TRX (4)",
          "MASK.BRIGHTEN (3)",
          "MANDELIC by default"
        ],
        [
          "Deep / mixed (superficial_fraction low)",
          "ENERGY.QS.TONING (3, series)",
          "INFUSE.TRX (3)",
          "—",
          "Over-promising"
        ],
        [
          "Diabetic acanthotic-type (history)",
          "PEEL.WHITENING (2), INFUSE.TRX (2)",
          "—",
          "—",
          "Aggressive peels"
        ]
      ]
    },
    {
      "concern": "Peri-Orbital Health (score higher is worse)",
      "drivers": "Drivers: pigment_index, vascular_index, shadow_hollow_index, puffiness_index, texture_line_index. Constraints: infusion only for an assessable finding with a clinic-supported purpose; a low score alone is not an indication.",
      "columns": [
        "Dominant sub-index",
        "Hero (strength)",
        "Secondary",
        "Avoid"
      ],
      "patterns": [
        [
          "pigment_index",
          "EYE.INFUSE TRX (3) or Vit C (2) or niacinamide (2)",
          "COOL.ICE (1)",
          "Peels under the eye; HQ; retinol"
        ],
        [
          "texture_line_index",
          "EYE.INFUSE HA (3), PDRN (3), EXO (3)",
          "ENERGY.RF.LIFT eye-safe setting (2)",
          "MICRO near the orbit"
        ],
        [
          "puffiness_index",
          "COOL.ICE (3), MASSAGE.LYMPH (3)",
          "EYE.INFUSE niacinamide (1), RF.LIFT (2)",
          "Heat; occlusive mask over the lid"
        ],
        [
          "vascular_index",
          "COOL.ICE (2), LED.RED (1)",
          "—",
          "—"
        ],
        [
          "shadow_hollow_index",
          "No facial step; doctor-led filler/booster consultation",
          "—",
          "Promising improvement"
        ]
      ]
    },
    {
      "concern": "Lip Pigmentation (score higher is worse)",
      "drivers": "Drivers: intrinsic_melanin_index, surface_darkness_index, vascular_congestion_index, lipstick_mask_confidence, pigment_classification. The application computes the trigger (client-display score < 70, lips assessable).",
      "columns": [
        "Classification",
        "In-session (strength)",
        "Avoid"
      ],
      "patterns": [
        [
          "melanin_dominant, trigger true",
          "ENERGY.QS.LIP — 2 Q-switch passes with hyaluronic serum, 2 min, before finishing (3 per session; cumulative over a course)",
          "Any peel on the lips; QS.LIP when proxy/temperature rules block it"
        ],
        [
          "vascular_dominant",
          "QS.LIP if triggered (2); COOL.ICE (2)",
          "—"
        ],
        [
          "cosmetic_mask / not assessable",
          "Record not_assessable; re-scan without cosmetics",
          "—"
        ],
        [
          "mixed_type",
          "QS.LIP if triggered",
          "—"
        ]
      ]
    },
    {
      "concern": "Texture & Open Pores (PTI_continuous, higher is worse)",
      "drivers": "Drivers: pore_density_index, pore_diameter_index, pore_clarity_index, texture_roughness_index, blackhead_congestion_index.",
      "columns": [
        "Pattern",
        "Hero (strength)",
        "Secondary",
        "Support",
        "Course modality (own session)",
        "Avoid"
      ],
      "patterns": [
        [
          "Pore clarity low + blackheads",
          "PEEL.SA20 (5), ENERGY.CARBON (5)",
          "EXTR.MANUAL (4) + HF",
          "EXFO.VORTEX SA2 (3), MASK.CHARCOAL (3)",
          "—",
          "Occlusives"
        ],
        [
          "Pore diameter/density high, clean pores",
          "ENERGY.CARBON (5)",
          "PEEL.SA20 (3)",
          "LED.RED (1)",
          "ENERGY.MNRF (4)",
          "—"
        ],
        [
          "Texture roughness (keratotic)",
          "PEEL.GLYCO35 (5), EXFO.MICRO.DIAMOND (4), PEEL.FUSION (4)",
          "INFUSE.HA (3)",
          "MASK.HYDRATE (3)",
          "ENERGY.NEEDLE.* (3)",
          "MICRO + GLYCO35 same session (R4)"
        ],
        [
          "Scarred texture",
          "No single-session facial corrective; ENERGY.MNRF course with INFUSE.EXO/PDRN after",
          "—",
          "—",
          "—",
          "Promising scar change from a facial"
        ]
      ]
    },
    {
      "concern": "Superficial Wrinkles (WBI_continuous, higher is worse)",
      "drivers": "Drivers: structural_vs_dehydration_index, wrinkle_depth_index, microline_density_index, chronicity_uv_index, regional_uniformity_index.",
      "columns": [
        "Pattern",
        "Hero (strength)",
        "Secondary",
        "Support",
        "Course modality"
      ],
      "patterns": [
        [
          "mostly_dehydration",
          "INFUSE.HA (5), PEEL.PARTY (3) or GLYCO35 (4)",
          "MASK.HYDRATE (4), ENERGY.RF.LIFT (3)",
          "SPRAY HA (3)",
          "—"
        ],
        [
          "mixed",
          "PEEL.GLYCO35 (4), ENERGY.RF.MACHINE (3)",
          "INFUSE.HA + EXO (3)",
          "MASK.LIFT (2)",
          "ENERGY.MNRF (4), HIFU 1.5 mm (3)"
        ],
        [
          "mostly_structural",
          "ENERGY.RF.MACHINE (3), INFUSE.EXO (3)",
          "MASK.LIFT (2)",
          "—",
          "ENERGY.MNRF (4), ENERGY.HIFU (3), doctor-led botox for expression lines"
        ]
      ]
    },
    {
      "concern": "Jawline Sagging (score higher is worse)",
      "drivers": "Drivers: mandibular_line_deflection_angle, pre_jowl_sulcus_depth_index, jowl_bulge_prominence_index, submental_fullness_index, dermal_collagen_thinning_index, left_right_asymmetry_index.",
      "columns": [
        "Pattern",
        "In-facial step (strength)",
        "Corrective modality (own session)",
        "Support",
        "Avoid"
      ],
      "patterns": [
        [
          "Early deflection, age < 30",
          "ENERGY.RF.LIFT (3), INFUSE.LIFT (2), MASK.LIFT (2)",
          "ENERGY.RF.MACHINE course (3)",
          "MASSAGE.LYMPH (2)",
          "HIFU (age rule)"
        ],
        [
          "Moderate deflection / early jowl, age 30–60",
          "ENERGY.RF.LIFT (2 same-day firmness)",
          "ENERGY.HIFU 4.5 + 3 mm (5 at 3 months)",
          "RF between HIFU sessions",
          "HIFU stacked with anything (R5)"
        ],
        [
          "Submental fullness",
          "MASSAGE.LYMPH (2 transient)",
          "ENERGY.HIFU submental (3)",
          "—",
          "—"
        ],
        [
          "Age > 60 or severe",
          "Expectation-setting; thread lift / surgical opinion",
          "—",
          "—",
          "HIFU without documented indication"
        ]
      ]
    },
    {
      "concern": "Skin Firmness & Elasticity (continuous_firmness_index, higher is worse)",
      "drivers": "Drivers: collagen_loss_pattern_type, micro_laxity_pattern_index, collagen_reflectance_uniformity, elastic_recoil_proxy_index, regional_firmness_map, improvability_index.",
      "columns": [
        "collagen_loss_pattern_type",
        "In-facial hero (strength)",
        "Secondary",
        "Support",
        "Course modality"
      ],
      "patterns": [
        [
          "early_diffuse",
          "ENERGY.RF.LIFT (4), INFUSE.LIFT (3)",
          "INFUSE.EXO (3)",
          "MASK.LIFT (3)",
          "RF.MACHINE course"
        ],
        [
          "cheek_predominant",
          "ENERGY.RF.LIFT cheeks (4)",
          "INFUSE.EXO/PDRN (3)",
          "MASK.LIFT",
          "HIFU 3 mm cheeks (30–60), MNRF"
        ],
        [
          "lower_face_predominant",
          "ENERGY.RF.LIFT lower face (3)",
          "INFUSE.LIFT (2)",
          "MASSAGE.LYMPH (2)",
          "HIFU 4.5 mm (30–60)"
        ],
        [
          "global_mild",
          "ENERGY.RF.MACHINE (4) or RF.LIFT (3)",
          "INFUSE.EXO (3)",
          "MASK.LIFT",
          "RF course + HIFU when indicated"
        ],
        [
          "global_severe",
          "Expectation-setting; RF.LIFT for comfort (2)",
          "—",
          "—",
          "Thread lift / surgical opinion"
        ]
      ]
    },
    {
      "concern": "Textural Radiance (continuous_TRI, higher is worse)",
      "drivers": "Drivers: radiance_loss_pattern, micro_clarity_index, surface_smooth_scatter_index, keratin_shadow_index.",
      "columns": [
        "radiance_loss_pattern",
        "Hero (strength)",
        "Secondary",
        "Support"
      ],
      "patterns": [
        [
          "surface_smoothness_deficit",
          "PEEL.GLYCO35 (5), EXFO.MICRO.DIAMOND (4), PEEL.PARTY (4)",
          "INFUSE.HA (3)",
          "MASK.HYDRATE / BRIGHTEN"
        ],
        [
          "clarity_haze_deficit",
          "EXFO.VORTEX AS1 (4), PEEL.PARTY (4), ENERGY.CARBON (4)",
          "INFUSE.VITC (3)",
          "MASK.BRIGHTEN (3)"
        ],
        [
          "keratin_congestion_deficit",
          "EXFO.SPATULA (4), PEEL.SA20 (5), ENERGY.CARBON (5)",
          "EXTR.MANUAL (3)",
          "MASK.CHARCOAL (2)"
        ],
        [
          "mixed",
          "ENERGY.CARBON (4) or PEEL.PARTY + EXFO.VORTEX (4)",
          "INFUSE.HA (3)",
          "—"
        ]
      ]
    }
  ],
  "expected_single_session_changes": [
    {
      "Parameter": "Barrier + Sensitivity",
      "Typical one-session change": "−5 to −15",
      "Moves": "Erythema, hydration signal",
      "Does not move in one session": "Flaking, uniformity"
    },
    {
      "Parameter": "Visual Acne",
      "Typical one-session change": "−8 to −20 inflammatory; −5 to −12 comedonal",
      "Moves": "Inflammation, BIBI, comedone count after extraction",
      "Does not move in one session": "Nodules, chronicity"
    },
    {
      "Parameter": "Sebum",
      "Typical one-session change": "−10 to −25 toward balance",
      "Moves": "Shine, congestion",
      "Does not move in one session": "Baseline production"
    },
    {
      "Parameter": "Redness",
      "Typical one-session change": "−10 to −25 diffuse",
      "Moves": "Diffuse erythema, hotspots",
      "Does not move in one session": "Vascular prominence"
    },
    {
      "Parameter": "Hydration",
      "Typical one-session change": "+10 to +25",
      "Moves": "Reflectance, micro-lines, diffusion",
      "Does not move in one session": "Sebum-deficiency component"
    },
    {
      "Parameter": "Luminosity",
      "Typical one-session change": "+15 to +30",
      "Moves": "Surface-level glow",
      "Does not move in one session": "Shadow/contour component"
    },
    {
      "Parameter": "Pigmentation",
      "Typical one-session change": "−5 to −15 superficial; −3 to −8 melasma/deep",
      "Moves": "Intensity, contrast",
      "Does not move in one session": "Coverage, deep component"
    },
    {
      "Parameter": "Peri-orbital",
      "Typical one-session change": "−3 to −10",
      "Moves": "Pigment, texture, puffiness",
      "Does not move in one session": "Hollows, vascular"
    },
    {
      "Parameter": "Lip pigmentation",
      "Typical one-session change": "−2 to −6 with the lip add-on",
      "Moves": "Surface darkness",
      "Does not move in one session": "Intrinsic melanin (course)"
    },
    {
      "Parameter": "Texture & Pores",
      "Typical one-session change": "−8 to −18 congestion; −3 to −8 structural",
      "Moves": "Clarity, blackheads, roughness",
      "Does not move in one session": "Pore diameter, scars"
    },
    {
      "Parameter": "Wrinkles",
      "Typical one-session change": "−10 to −20 dehydration; 0 to −5 structural",
      "Moves": "Micro-lines",
      "Does not move in one session": "Depth, chronicity"
    },
    {
      "Parameter": "Jawline",
      "Typical one-session change": "−2 to −6",
      "Moves": "Drainage, RF contraction",
      "Does not move in one session": "Structural descent"
    },
    {
      "Parameter": "Firmness",
      "Typical one-session change": "−3 to −8",
      "Moves": "Micro-laxity, reflectance",
      "Does not move in one session": "Collagen density"
    },
    {
      "Parameter": "Textural Radiance",
      "Typical one-session change": "−10 to −25",
      "Moves": "Clarity, smoothness, keratin film",
      "Does not move in one session": "—"
    }
  ],
  "melasma_toning_selection": "Select toning for a documented case-specific advantage over alternatives, using case history, prior response, pigment stability, irritation and PIH risk. Sun-rule clearance alone is insufficient. The existing strength ratings apply to the selected cases.",
  "advice": [
    "Choose by dominant phenotype and zone findings, not just the total score or skin type. One modality can cover several concerns.",
    "Hydration is direct corrective care for dehydration; PDRN/HA, red LED and cooling can be direct care for barrier/redness. Do not force an acid or laser in these cases.",
    "Do not present oil gloss as luminosity, cooling as pigment removal, or mask tension/drainage as structural lifting.",
    "Consider HA/PDRN before exfoliation when it improves tolerance; otherwise preserve useful actives after exfoliation. Vitamin C may sting on freshly treated skin.",
    "Choose masks and adapt the mandatory massage using the existing approved technique and zone precautions for the actual post-treatment skin state. Charcoal avoids dry/flaking/sensitive areas and active lesion footprints; mandatory drainage uses gentle non-lesion pathways. A medium peel alone does not prohibit masks.",
    "Do not infer sun exposure, sex, pregnancy, travel, season-related disease, acne phenotype or local habits from Jaipur or demographics. Use supplied history only.",
    "HIFU, MNRF, Dermapen and Dermaroller require separately assessed sessions; do not place them in a facial to make it look ambitious.",
    "Use the expected-change table to explain plausible appearances and course limits, not to overwrite diagnosis targets or predict measured post-session scores.",
    "Other-step reference durations are advisory, not permission to change a fixed clinic dose.",
    "Every detailed session requires one 5-10-minute lymphatic drainage step even if puffiness is minimal. This user-confirmed clinic rule supersedes older optional/filler and blanket omission wording. Only an actual evaluated hard stop can prevent a successful session; use the explicit failure contract."
  ],
  "finishing_reference": {
    "columns": [
      "Need",
      "Serum",
      "Moisturiser",
      "Sunscreen / other"
    ],
    "rows": [
      [
        "Dry / sensitive / barrier-caution",
        "Daily Use Face Serum for Dry Skin (niacinamide 10 %, HA, ceramides)",
        "Hydrating Face Moisturizer for Dry & Sensitive, or Atoderm",
        "Eclipse Solaire SPF 50 (zinc oxide, titanium dioxide, niacinamide)"
      ],
      [
        "Oily / acne-prone",
        "Daily Use Face Serum AM; Ridacne SA 2 % PM (not pregnancy)",
        "Oil Control Moisturizer",
        "Same mineral sunscreen"
      ],
      [
        "Post-acne marks / superficial pigment",
        "Brightening Serum Concentrate (azelaic 10 %, kojic dipalmitate, licorice) — pregnancy-safe",
        "By skin type",
        "Mineral sunscreen"
      ],
      [
        "Melasma / resistant pigment (doctor-decided home phase)",
        "Melarid TrX AM/PM (not pregnancy); FCL AHA Lightening Gel HQ PM — prescription-level, cycled, not pregnancy",
        "By skin type",
        "Mineral sunscreen mandatory"
      ],
      [
        "Dullness / antioxidant",
        "C-Vit AM; Cosmetox spray (not pregnancy)",
        "By skin type",
        "Mineral sunscreen"
      ],
      [
        "Ageing / texture / firmness",
        "Advanced Retinol Serum PM — not pregnancy, not sensitive; pause 48 h before the next clinic visit (retinol-24 h rule); Agevia Exosomes PM (not pregnancy)",
        "By skin type",
        "Mineral sunscreen"
      ],
      [
        "Peri-orbital",
        "Juveage Under Eye Cream (peptides, caffeine, HA) — pregnancy-safe",
        "—",
        "Sunscreen to orbital rim"
      ],
      [
        "Keratotic / congested (home exfoliation)",
        "Kerato Plus (salicylic + malic) PM or Night Peel (glycolic 15 %) PM — not pregnancy; pause 48 h before a clinic peel or laser",
        "—",
        "—"
      ],
      [
        "Post-shave / folliculitis (men)",
        "After Shave Serum (niacinamide, salicylic, turmeric, ceramides)",
        "—",
        "—"
      ],
      [
        "Internal support (not a facial step)",
        "Hydra Life Nutraceutical AM — not pregnancy",
        "—",
        "—"
      ]
    ],
    "scope": "This source table includes AM/PM home-care suggestions for context; they are not automatic in-clinic finishing approvals. For the actual three-minute finish use only supplied approved in-clinic product records and post-procedure restrictions. Do not apply retinoids or home exfoliation acids immediately after correction on the basis of an AM/PM row. AM/PM home-care generation remains separate."
  },
  "combination_reasoning_examples": {
    "columns": [
      "Concern combination",
      "Reasoning"
    ],
    "rows": [
      [
        "Active acne + PIH, FP IV–VI",
        "The peel that treats both without high glycolic on inflamed darker skin is Combination; spot salicylic handles lesions; TRX infusion addresses the pigment side; blue then red LED calms bacterial and inflammatory load. Carbon is a valid alternative hero when lesions are mostly comedonal. It may also complement Combination when it adds distinct correction and the existing constraints allow; the superficial-peel sequencing condition in R2 applies."
      ],
      [
        "Oily, congested pores + tan/dullness",
        "Carbon answers oil, pores and tan at once; a superficial brightening peel before it is allowed (R2 exception) when tone is a stated goal; TRX or Vit C after; brighten mask."
      ],
      [
        "Dehydrated + sensitive + dull (winter)",
        "Hydration is the corrective here, not support; the only exfoliation the barrier tolerates is enzyme; PDRN and red LED for the barrier; hydrate mask; drainage massage is clinically useful if the face is puffy."
      ],
      [
        "Oily + dehydrated (Jaipur summer type)",
        "Zone the face: salicylic or Carbon on the T-zone, HA everywhere, hydrate mask; cooling early if the arrival temperature is high."
      ],
      [
        "Melasma-pattern + redness",
        "Use TRX and calming care for melasma with redness. Select Whitening when peel tolerance and exclusions permit. Select low-fluence toning when the case history and clinical assessment support an advantage over alternatives; sun-rule clearance alone is insufficient. Review prior response, pigment stability, irritation and PIH risk. No RF."
      ],
      [
        "Texture roughness + dehydration lines",
        "Glyco 35 resurfaces; RF after cooling adds firmness and diffusion if temperature allows; HA and hydrate mask restore what the acid took."
      ],
      [
        "Early laxity + dullness, pre-event",
        "Party for glow, RF for firmness, Lifting infusion and Lift mask for the event-day feel; massage is clinical here (contour), not filler."
      ],
      [
        "Jawline sagging 30–60 + pigment",
        "Two sessions: HIFU alone (R5), pigment session two or more weeks later."
      ],
      [
        "Comedonal teen acne",
        "Teen probe or SA20, extraction, HF, blue LED, charcoal mask; no medium peels."
      ],
      [
        "Barrier breakdown (BSI > 0.75) with anything else",
        "Barrier-only session; return for correction when BSI < 0.55."
      ],
      [
        "Puffy, sallow, post-travel",
        "Cooling and drainage first (a legitimate inversion of the usual order), then a glow peel, HA + Vit C, hydrate mask."
      ]
    ],
    "scope": "Worked reasoning, not recipes or fixed order. Apply actual case evidence, clearance, all mandatory steps and the complete session window. Never copy an example flow that omits mandatory massage."
  },
  "recovery_reference": {
    "ENERGY.CARBON": [
      "COOL.ICE",
      "LED.RED",
      "INFUSE.HA|INFUSE.TRX",
      "MASK.CALMING|MASK.BRIGHTEN"
    ],
    "medium_peel": [
      "neutralise",
      "COOL.ICE",
      "LED.RED",
      "INFUSE.HA|INFUSE.PDRN",
      "MASK.CALMING|MASK.HYDRATE"
    ],
    "superficial_peel": [
      "COOL.ICE?",
      "INFUSE.*",
      "MASK.BRIGHTEN|MASK.HYDRATE"
    ],
    "ENERGY.RF.*": [
      "COOL.ICE",
      "INFUSE.LIFT|INFUSE.HA",
      "MASK.LIFT|MASK.HYDRATE"
    ]
  },
  "population_context_guidance": [
    "Use only supplied sun exposure, travel, event timing, season-related findings, Fitzpatrick type, age, beard zones and endocrine history. Jaipur residence alone proves none of these.",
    "Apply the existing sun, event and temperature constraints to recorded values; consider early cooling and recovery when actual heat findings support it, preserving fixed doses.",
    "Consider dust/hard-water congestion or monsoon acne/folliculitis only when history and imaging support that driver; use the corresponding concern map rather than assume the diagnosis.",
    "Use recorded Fitzpatrick and PIH history to compare permitted pigment options; use recorded beard/folliculitis findings for regional adaptation and existing mask/product protocols.",
    "For teens, use the age-specific mother guidance and applicable clinic exclusions; medium peels are not selected for teens. For supplied PCOD/thyroid/diabetes history, temper expectations and retain condition-specific outlook without requiring a new referral field or referral text."
  ],
  "pending_protocol_details": "The source ratification checklist is retained as a clinician configuration task: no invented 532-nm or eye-RF settings, infusion compositions, pregnancy permissions or new hard other-step durations. Existing actual constraints/protocols govern every selected item.",
  "sequencing_advice": {
    "authority": "Advisory clinical planning guidance; existing constraints and approved protocols remain binding. The user-confirmed mandatory massage rule supersedes the older omission sentence.",
    "items": [
      "Actives infused onto freshly exfoliated skin absorb better; infusing before a peel wastes most of the active. Exception worth making: HA or PDRN pre-conditioning on barrier-caution skin before a superficial peel.",
      "Vitamin C stings on skin that is pink after a medium peel or Carbon; HA, PDRN or TRX are kinder on those days and Vitamin C moves to home care.",
      "A medium peel alone does not prohibit peel-off masks. Choose by the actual skin state; charcoal avoids dry/flaking/sensitive areas, beard and active lesion footprints.",
      "The older optional/filler massage omission sentence is superseded by the user-confirmed mandatory 5-10-minute requirement. Follow existing approved technique and zone precautions; actual evaluated hard stops require explicit blockage, not a completed session without massage.",
      "When the arrival temperature is in the caution band, cooling early in the session (before the corrective) is a legitimate design choice, not padding.",
      "Zone-splitting is encouraged: T-zone salicylic or Carbon with cheek hydration; lesion zones spot-treated; melasma zones kept away from heat while the rest of the face is lasered conservatively.",
      "Carbon before RF rather than after is usually right (RF warms the dermis; laser on warmed skin raises surface temperature), but a case can be argued either way; R6 cooling applies after each."
    ]
  },
  "peel_potency_ladder": "PUMPKIN < PARTY ≈ MANDELIC < WHITENING < SA20 < COMBO ≈ GLYCO35 < FUSION ≈ SALIDS ≈ SA30. Potency is separate from clinic depth class; Combination remains superficial with its strengths unchanged.",
  "burden_scale": "0 none to 3 high: irritation/barrier burden, separate from the unchanged 0-5 concern effect strengths.",
  "evidence_grade_key": {
    "A": "Consistent controlled-trial evidence",
    "B": "Good clinical evidence or strong mechanism with trial support",
    "C": "Mechanism plus practitioner experience",
    "D": "Weak or theoretical"
  }
}

export const LIVE_MOTHER_REFERENCE = {
  "source": "AI Aesthetics Facial Engine Mother Document v1.3; user amendments 2026-10-05",
  "authority": "Original live constraints plus the user-selected rules and timings govern. Mechanisms, evidence grades, 0-5 strengths and phenotype/region maps remain planning knowledge, not a new API stage or output contract.",
  "strength_scale": {
    "columns": [
      "Strength",
      "Meaning"
    ],
    "rows": [
      [
        "5",
        "Primary corrective; largest one-session visible change for this concern"
      ],
      [
        "4",
        "Strong corrective or strong contributor"
      ],
      [
        "3",
        "Meaningful support; visible but smaller change"
      ],
      [
        "2",
        "Minor or indirect contribution"
      ],
      [
        "1",
        "Negligible for this concern; include only for another reason"
      ],
      [
        "0",
        "No effect, or counter-productive (see \"avoid\")"
      ]
    ]
  },
  "evidence_grade": "Evidence grade: A consistent controlled-trial evidence · B good clinical evidence or strong mechanism with trial support · C mechanism plus practitioner experience · D weak or theoretical.",
  "global_active_acne_scope": {
    "rule": "Every restriction due to an active acne lesion (papule, pustule, inflamed bump, nodule, or other active lesion) is local to that lesion and its immediately affected footprint. Do not deny the modality on the remaining uninvolved face merely because active acne is present elsewhere.",
    "allowed_rest_of_face": "Use the best indicated modality on unaffected facial zones when independent history, allergy, numeric barrier/energy, temperature, pairing and dose rules permit. This does not override those independent rules.",
    "execution": "Identify lesion locations; avoid the restricted pass/product directly on those lesions. State the lesion avoidance and the treated unaffected zones in the existing how_to_do and script fields.",
    "acne_hero": "Standalone Q-switch remains ineligible as an acne HERO under the unchanged live rules; it may address another permitted concern on uninvolved zones. Carbon remains a valid acne hero where permitted.",
    "massage": "Always include one 5-10 minute face-and-neck drainage step. Use gentle non-lesion pathways and avoid direct pressure on active lesions; acne does not create a massage-omission option."
  },
  "operational_rules": {
    "timings": {
      "cleansing": {
        "min_minutes": 2,
        "max_minutes": 2,
        "basis": "therapist_confirmed"
      },
      "hydradermabrasion_suction": {
        "min_minutes": 2,
        "max_minutes": 4,
        "basis": "therapist_confirmed",
        "resources": [
          "Hydrafacial Machine / Suction Probe / Bubble Pen",
          "Hydrafacial Serum AS1",
          "Hydrafacial Serum SA2",
          "Hydrafacial Serum A03"
        ]
      },
      "teenage_line": {
        "min_minutes": 2,
        "max_minutes": 4,
        "basis": "therapist_confirmed"
      },
      "cutin_removal_spatula": {
        "min_minutes": 3,
        "max_minutes": 5,
        "basis": "mother_reference_estimate"
      },
      "manual_extraction": {
        "min_minutes": 3,
        "max_minutes": 8,
        "basis": "mother_reference_estimate"
      },
      "high_frequency": {
        "min_minutes": 2,
        "max_minutes": 4,
        "basis": "mother_reference_estimate"
      },
      "microdermabrasion_diamond": {
        "min_minutes": 8,
        "max_minutes": 12,
        "basis": "mother_reference_estimate"
      },
      "microdermabrasion_crystal": {
        "min_minutes": 8,
        "max_minutes": 12,
        "basis": "mother_reference_estimate",
        "scope": "body_or_neck; not facial skin"
      },
      "carbon_application_drying": {
        "min_minutes": 3,
        "max_minutes": 3,
        "basis": "therapist_confirmed"
      },
      "carbon_q_switch_laser": {
        "min_minutes": 4,
        "max_minutes": 4,
        "basis": "therapist_confirmed"
      },
      "q_switch_toning": {
        "min_minutes": 8,
        "max_minutes": 12,
        "basis": "mother_reference_estimate"
      },
      "q_switch_532_spot": {
        "min_minutes": 3,
        "max_minutes": 8,
        "basis": "mother_reference_estimate"
      },
      "lip_q_switch_hyaluronic": {
        "min_minutes": 2,
        "max_minutes": 2,
        "basis": "therapist_confirmed",
        "passes": 2,
        "includes": "both passes and hyaluronic serum; not two minutes per pass"
      },
      "rf_lifting_probe": {
        "min_minutes": 6,
        "max_minutes": 10,
        "basis": "mother_reference_estimate"
      },
      "radio_frequency_machine": {
        "min_minutes": 10,
        "max_minutes": 15,
        "basis": "mother_reference_estimate"
      },
      "hifu": {
        "min_minutes": 45,
        "max_minutes": 90,
        "basis": "mother_reference_estimate",
        "scope": "standalone assessed corrective session"
      },
      "microneedling_rf": {
        "min_minutes": 20,
        "max_minutes": 30,
        "basis": "mother_reference_estimate",
        "scope": "standalone assessed corrective session"
      },
      "microneedling_machine": {
        "min_minutes": 15,
        "max_minutes": 25,
        "basis": "mother_reference_estimate",
        "scope": "standalone assessed corrective session"
      },
      "dermapen": {
        "min_minutes": 15,
        "max_minutes": 25,
        "basis": "mother_reference_estimate",
        "scope": "standalone assessed corrective session"
      },
      "dermaroller": {
        "min_minutes": 15,
        "max_minutes": 25,
        "basis": "mother_reference_estimate",
        "scope": "standalone assessed corrective session"
      },
      "led_blue": {
        "min_minutes": 8,
        "max_minutes": 12,
        "basis": "mother_reference_estimate"
      },
      "led_red": {
        "min_minutes": 8,
        "max_minutes": 12,
        "basis": "mother_reference_estimate"
      },
      "led_green": {
        "min_minutes": 8,
        "max_minutes": 10,
        "basis": "mother_reference_estimate"
      },
      "chemical_peel": {
        "min_minutes": 3,
        "max_minutes": 4,
        "basis": "therapist_confirmed",
        "applies_to": [
          "Party Peel",
          "Whitening Peel",
          "Sali DS Peel",
          "Salicylic Acid 30% Peel",
          "Gel Based Pumpkin Peel",
          "Gel Based Mandelic Peel",
          "Fusion Peel-E",
          "Glyco Peel 35",
          "Combination Peel",
          "20% Salicylic Acid Peel"
        ]
      },
      "spot_salicylic": {
        "min_minutes": 2,
        "max_minutes": 2,
        "basis": "therapist_confirmed"
      },
      "facial_infusion": {
        "min_minutes": 3,
        "max_minutes": 3,
        "basis": "therapist_confirmed",
        "per": "distinct ingredient",
        "solutions": [
          "Hyaluronic Acid",
          "Vitamin C",
          "TRX A (Tranexamic Acid)",
          "PDRN",
          "Exosomes",
          "Lifting",
          "Glutathione"
        ]
      },
      "under_eye_infusion": {
        "min_minutes": 2,
        "max_minutes": 2,
        "basis": "therapist_confirmed",
        "per": "whole ocular infusion step"
      },
      "oxygen_hydra_spray": {
        "min_minutes": 3,
        "max_minutes": 3,
        "basis": "therapist_confirmed",
        "per": "whole spray step"
      },
      "cooling": {
        "min_minutes": 2,
        "max_minutes": 5,
        "basis": "therapist_confirmed"
      },
      "peel_off_mask": {
        "min_minutes": 15,
        "max_minutes": 15,
        "basis": "therapist_confirmed",
        "applies_to": [
          "Charcoal",
          "Calming",
          "Brighten",
          "Hydrate",
          "Lift"
        ]
      },
      "face_and_neck_lymphatic_drainage": {
        "min_minutes": 5,
        "max_minutes": 10,
        "basis": "therapist_confirmed",
        "mandatory": true,
        "occurrences_per_facial_session": 1
      },
      "serum_moisturizer_sunscreen_finish": {
        "min_minutes": 3,
        "max_minutes": 3,
        "basis": "therapist_confirmed",
        "placement": "one combined final step"
      }
    },
    "session_targets": {
      "single": {
        "min_minutes": 60,
        "max_minutes": 75,
        "target_minutes": 65
      },
      "multiple_each_facial_session": {
        "min_minutes": 60,
        "max_minutes": 75,
        "target_minutes": 65
      },
      "express": {
        "min_minutes": 35,
        "max_minutes": 45,
        "target_minutes": 40
      },
      "arithmetic": "Sum actual numeric steps[].duration. treatment_time, step_duration_total and timing_validation.calculated_from_steps must equal that sum. Preserve the existing JSON shape.",
      "target_behavior": "Aim for the target using meaningful indicated steps at their confirmed doses or realistic reference estimates. Stay within the range; never inflate a fixed dose, repeat massage or add a token step to reach a target.",
      "estimated_dose_behavior": "Reference ranges are estimates for the planned zones and coverage, not newly therapist-ratified fixed doses. Select a realistic duration inside the estimate; do not automatically select its maximum.",
      "standalone_behavior": "HIFU/needling reference ranges describe their assessed corrective procedures. The total of any detailed facial session in this output still obeys its selected facial session window. Standalone means no incompatible additional corrective; user-mandatory drainage and finish remain required in every facial."
    },
    "lip": {
      "score_basis": "Customer-facing current score on the application's higher-is-better 1-100 scale. Prefer an explicitly supplied client_display_score/customer-facing score or the application's supplied display mapping. Never compare a raw higher-is-worse severity score, a 0-1 proxy or confidence directly with 70; do not invent a missing display value.",
      "operator": "<",
      "threshold": 70,
      "trigger": "Assessable customer-facing Lip Pigmentation Score < 70, irrespective of primary selection.",
      "action": "Include two Q-switch passes with hyaluronic serum, two minutes TOTAL, before the combined finish. Retain independently indicated steps; include the add-on in the actual session sum.",
      "safety": "Apply existing patient-history, numeric energy, temperature and product contraindications. Record an actual blocking reason in the existing checklist/omission fields; no new output field.",
      "missing_score": "A missing or unassessable lip score is not a score below 70."
    },
    "under_eye": {
      "score_basis": "Customer-facing current score on the application's higher-is-better 1-100 scale. Prefer an explicitly supplied client_display_score/customer-facing score or the application's supplied display mapping. Never compare a raw higher-is-worse severity score, a 0-1 proxy or confidence directly with 70; do not invent a missing display value.",
      "operator": "<=",
      "threshold": 70,
      "trigger": "Customer-facing Peri-Orbital/Periocular Health Score <= 70, irrespective of primary selection.",
      "action": "Include one two-minute under-eye infusion with the Ocular Ultrasound Infusion Probe. This is additional to, not a substitute for, any separately indicated facial infusion.",
      "approved_serums": [
        "Hyaluronic Acid",
        "Niacinamide",
        "TRX A (Tranexamic Acid)",
        "PDRN",
        "Exosomes",
        "Vitamin C"
      ],
      "selection": "Choose the approved serum using available periocular findings. If detailed sub-indices are absent, use an appropriate hydration/comfort option; do not invent findings or claim hollow correction. The score trigger is not conditional on a separate assessability/finding gate from Mother B16.",
      "safety": "Respect existing patient-history, allergy and product rules. Retain the original spot-salicylic exclusions for under-eye/lips. No additional B16 gate is imported.",
      "missing_score": "Do not treat a missing customer-facing score as <= 70."
    },
    "spot_salicylic": {
      "role": "Uncounted lesion-directed adjunct; not HERO/SECONDARY/TERTIARY and not a substitute for the main acne corrective.",
      "cooling": "Spot salicylic does not itself require a subsequent cooling step.",
      "sequence": "Placement is case-specific. This rule does not prescribe the next treatment, a spot-salicylic-plus-Carbon pairing, or any fixed order.",
      "independent_cooling": "Retain cooling required by an actual full-face peel/energy procedure; the spot rule does not waive another procedure's own recovery requirements."
    }
  },
  "selected_rules": {
    "sequencing_and_pairing": [
      "A1: Extraction and any high-frequency work following it precede full-face acids, laser or RF; never place extraction after those steps.",
      "A2: Medium-class peels (SA30, Sali DS, Fusion-E, Glyco 35) never share a session with any Q-switch pass, including Carbon and a triggered lip pass. Lesion-only spot salicylic is an uncounted adjunct, not a full-face medium peel.",
      "A3: If a superficial full-face peel precedes Carbon, complete protocol-appropriate neutralisation/removal and Ice Probe cooling before Carbon; use conservative Carbon settings. This does not apply a cooling requirement to spot salicylic.",
      "A4: One full-face medium peel maximum per session.",
      "A5: Microdermabrasion never shares a session with a medium peel. Microdermabrasion plus Q-switch/Carbon has no pairing-specific prohibition.",
      "A6: HIFU is an assessed standalone corrective; do not stack it with another peel, abrasion, laser, extraction or corrective modality in that session. Mandatory drainage/finishing are not additional corrective modalities.",
      "A7: MNRF, Dermapen/Dermaroller and needling are assessed standalone correctives. Their companions are PDRN/exosome delivery, cooling, red LED and finishing; the user-mandatory drainage remains, gently away from treated/lesion areas.",
      "A8: Ice Probe cooling immediately follows energy steps, including Carbon, Q-switch toning/lip and RF.",
      "A9: Carbon plus full-face Q-switch toning is a redundant combination. This does not prohibit the separate triggered lip add-on.",
      "A10: Diamond microdermabrasion for facial skin; crystal is a body/neck procedure.",
      "A11: Diode hair removal is a separate service, not a facial-engine step.",
      "A12: High frequency is support, never a hero. Green LED is soothing, never a pigment corrective. Glutathione infusion is weak dullness support, not pigment correction."
    ],
    "additional_case_rules": [
      "B1: Microdermabrasion avoids rosacea-pattern redness, flaking barrier and melasma-prone areas. Its active-acne restriction applies only to lesion footprints; other facial areas remain eligible.",
      "B2: MNRF avoids barrier-caution skin. MNRF/rollers avoid active lesion footprints, and RF avoids active inflammatory footprints; do not generalise acne-related restrictions to uninvolved face.",
      "B3: Never mechanically extract inflamed papules, pustules or nodules. Other eligible comedones/unaffected areas may be treated.",
      "B4: Do not peel, extract or heat the nodule itself; use gentle local cooling/LED/hydration there as suitable. Correctives remain available on the uninvolved face. No mandatory referral output field is added.",
      "B6: Hydration signal < 0.40 excludes medium peels.",
      "B7: Structural disruption with barrier uniformity < 0.55 additionally excludes peels except Pumpkin and abrasion; existing energy-denial gates remain unchanged.",
      "B9: Diffuse-dominant redness avoids glycolic, salicylic above 20%, heat and high frequency; vascular-reactive areas avoid heat and glycolic. Do not create a new numeric erythema >0.60 gate.",
      "B10: High/rosacea-like redness >65 in the diagnostic higher-is-worse score scale calls for barrier-first care rather than correction. This is not a threshold on the inverted customer-facing score.",
      "B11: Melasma-pattern areas avoid RF/heat, medium glycolic peels, microdermabrasion and high fluence.",
      "B12: Salicylic-family peels avoid dry/sensitive/redness patterns; Glyco 35 avoids flaking barrier. Glyco's active-acne restriction and Fusion's active-pustule FP IV-VI restriction are lesion-local only. Fusion also avoids barrier caution and the seven-day event window.",
      "B13: No medium peels for teens.",
      "B14: Charcoal masks avoid dry/flaking/sensitive areas and beard. Inflammation-related avoidance is local to active lesions. A medium peel alone does not prohibit peel-off masks.",
      "B15: SSI <0.20 calls for hydration rather than degreasing; avoid full-face salicylic when oiliness is limited to T-zone; sebum-deficiency dehydration uses gentle spatula rather than stronger exfoliation.",
      "B17: 532-nm spot work is doctor-led, with test spot/dark-skin caution, and is not a melasma treatment.",
      "B18: Red LED is permitted as low-risk barrier recovery despite barrier-related energy denial; the original pregnancy exclusion remains."
    ],
    "explicit_user_exclusions": [
      "B5 excluded: no extra flaking >0.50 denial. Preserve the live flaking >=0.60 energy gate.",
      "B8 excluded: no extra erythema >0.60 acid/heat/HF denial. Preserve the live numeric erythema caution and denial rules.",
      "B16 removed: use the mandatory customer-facing periocular <=70 infusion rule; no separate mother assessability/finding eligibility gate.",
      "B19 removed: no mother-specific clinician-permission requirement for tranexamic infusion during pregnancy; retain the original live pregnancy/product rules.",
      "B20 removed: no barrier-only/resume-correction-at-BSI<0.55 recovery rule. Use the current live rules at the current visit.",
      "C3 removed: no blanket exclusion of peel-off masks after medium peels.",
      "C7 removed: no automatic halving of expected changes or supplied targets.",
      "All mother massage-omission instructions removed; mandatory drainage takes precedence."
    ],
    "c8_output_handling": {
      "blue_led_screening": "If Blue LED is selected, include relevant reported photosensitising-medicine screening in preparations_checklist_for_therapist. Missing history does not create a new automatic denial.",
      "referral_notes": "No relevant dedicated referral field exists in the live treatment JSON. Do not add new fields or require PCOD/thyroid/diabetes referral text under C8. Retain the live condition-specific improvement-outlook rules."
    }
  },
  "sections": [
    {
      "section": "1",
      "title": "1. Step catalogue (every available step, with IDs)",
      "paragraphs": [
        "Each step carries its clinic_step_type from CLINIC_STEP_TIMINGS. Steps the timing table does not name use other; their durations below are clinic reference ranges  and are not validated by code today. \"Burden\" is the irritation/barrier load the step adds (0 none → 3 high)."
      ],
      "tables": []
    },
    {
      "section": "1.1",
      "title": "1.1 Preparation and exfoliation",
      "paragraphs": [],
      "tables": [
        {
          "columns": [
            "Step ID",
            "Step",
            "Equipment / product",
            "clinic_step_type · minutes",
            "Mechanism",
            "Burden",
            "Primary targets (strength)",
            "Notes"
          ],
          "rows": [
            [
              "PREP.CLEANSE",
              "Cleanse",
              "Cleanser, cleansing towels",
              "cleansing · 2",
              "Removes sunscreen, sebum, particulate",
              "0",
              "Prep for everything",
              "—"
            ],
            [
              "EXFO.SPATULA",
              "Ultrasonic cutin removal",
              "Hydrafacial Machine — Cutin Removal Spatula",
              "other · 3–5",
              "Ultrasonic vibration lifts loosened corneocytes and sebum film",
              "1",
              "Textural radiance keratin_congestion_deficit (3), sebum (2), pores (2), luminosity (2)",
              "Gentle; safe on barrier-caution skin; pregnancy-safe"
            ],
            [
              "EXFO.VORTEX",
              "Hydradermabrasion with serum",
              "Hydrafacial Machine — Suction Probe / Bubble Pen with Serum AS1 / SA2 / A03",
              "suction · 2–4",
              "Fluid exfoliation + vacuum extraction + serum delivery",
              "1",
              "Hydration (3), luminosity (3), pores/blackheads (3), sebum (2 with SA2), textural radiance (3)",
              "AS1 normal, SA2 oily, A03 dry; pregnancy-safe; the universal support step"
            ],
            [
              "EXFO.TEEN",
              "Teenage Line probe",
              "Hydrafacial Machine — Teenage Line",
              "suction · 2–4",
              "Acne-oriented suction/cleansing for congested young skin",
              "1",
              "Comedonal acne (3), sebum (2), pores (2)",
              "Gentler than SA peels"
            ],
            [
              "EXFO.MICRO.DIAMOND",
              "Microdermabrasion, diamond tip",
              "Microdermabrasion Machine",
              "other · 8–12",
              "Mechanical abrasion of stratum corneum under vacuum",
              "2",
              "Texture roughness (4), textural radiance surface_smoothness (4), dullness (3), superficial fine lines (2)",
              "Face: diamond only. Avoid rosacea-pattern redness and flaking/melasma-prone areas. Do not pass over active lesion footprints; treat eligible uninvolved facial zones. Still aggressive exfoliation for the original retinol-24h/blood-thinner rules."
            ],
            [
              "EXFO.MICRO.CRYSTAL",
              "Microdermabrasion, crystal tip",
              "Microdermabrasion Machine",
              "other · 8–12",
              "Crystal-stream abrasion",
              "3",
              "Thick body/neck skin (4)",
              "Not for facial use in this engine"
            ]
          ]
        }
      ]
    },
    {
      "section": "1.2",
      "title": "1.2 Extraction and lesion management",
      "paragraphs": [],
      "tables": [
        {
          "columns": [
            "Step ID",
            "Step",
            "Equipment",
            "clinic_step_type · minutes",
            "Mechanism",
            "Burden",
            "Primary targets",
            "Notes"
          ],
          "rows": [
            [
              "EXTR.MANUAL",
              "Manual extraction",
              "Comedone extractor, loop extractor",
              "other · 3–8",
              "Mechanical clearing of open/closed comedones",
              "2",
              "Comedonal acne (4), blackhead congestion (4), pores (2)",
              "On softened eligible comedones; never extract an inflamed papule, pustule or nodule itself. Other eligible/uninvolved zones may be treated. High frequency may follow where indicated."
            ],
            [
              "ENERGY.HF",
              "High-frequency",
              "High-Frequency Machine",
              "other · 2–4",
              "Ozone + mild germicidal/thermal effect",
              "1",
              "Post-extraction sanitation (5 for that purpose), drying pustules (3), BIBI (2)",
              "Energy device → excluded in pregnancy; avoid rosacea-pattern redness; a support step, never a hero"
            ],
            [
              "PEEL.SPOT.SALI",
              "Spot salicylic (lesion-directed adjunct)",
              "Sali DS / SA 30 % / SA 20 % on lesion zones only",
              "spot_salicylic · 2",
              "Keratolytic + anti-inflammatory on the lesion",
              "1 (local)",
              "Active acne lesions (mandatory adjunct per constraints)",
              "Uncounted adjunct; avoid under-eye, lips, broken skin; blocked by the salicylic rules Spot salicylic does not itself require a subsequent cooling step; no next-step pairing is prescribed."
            ]
          ]
        }
      ]
    },
    {
      "section": "1.3",
      "title": "1.3 Chemical peels (named, with clinic depth class)",
      "paragraphs": [
        "Named peels run 3-4 minutes. Clinic depth classes operationalise the existing history rules and are separate from strength. Combination Peel is superficial with unchanged strength. No stocked peel is listed as dermatologically deep; do not silently redefine the original live \"deep peel\" exclusions to mean every stronger medium peel.",
        "Potency ladder (lightest → strongest): PUMPKIN < PARTY ≈ MANDELIC < WHITENING < SA20 < COMBO ≈ GLYCO35 < FUSION ≈ SALIDS ≈ SA30.  Combination depth correction: the 20% salicylic + 20% mandelic formulation is described as superficial in Chandrashekar BS et al., J Clin Aesthet Dermatol. 2021;14(11):41–43 (https://pubmed.ncbi.nlm.nih.gov/34980959/). This classification assumes a superficial-peel protocol and does not alter its corrective strength. The study did not test Carbon pairing; that permission comes from the existing clinic constraints."
      ],
      "tables": [
        {
          "columns": [
            "Step ID",
            "Peel",
            "Key actives",
            "Clinic class",
            "Burden",
            "Primary targets (strength)",
            "Avoid / notes"
          ],
          "rows": [
            [
              "PEEL.PARTY",
              "Party Peel",
              "Lactic 40 %, arginine 20 %, arbutin 20 %, niacinamide 10 %",
              "Superficial",
              "1",
              "Luminosity/glow (5), event readiness (5), hydration (3 — lactic humectancy), textural radiance (4), superficial pigment brightness (3), tone evenness (3)",
              "Pregnancy-permitted; best same-evening result; little structural change"
            ],
            [
              "PEEL.PUMPKIN",
              "Gel Based Pumpkin Peel",
              "Pumpkin enzymes, lactic 6 %, gluconic 1.5 %, salicylic 1 %, mandelic 3 %, betaine, resveratrol, aloe",
              "Very superficial (enzyme)",
              "1",
              "Sensitive-skin glow (4), textural radiance (3), luminosity (3), mild congestion (2)",
              "Pregnancy-permitted; contains aloe (aloe-allergy rule); the glow choice on barrier-caution skin"
            ],
            [
              "PEEL.MANDELIC",
              "Gel Based Mandelic Peel",
              "Mandelic (%, unstated), niacinamide, tocopherol, aloe, clay base",
              "Superficial",
              "1",
              "Mild acne (2), mild brightening (2), gentle exfoliation on very reactive FP V–VI skin (3)",
              "Anti-default rule; contains aloe; wins only on tolerance grounds"
            ],
            [
              "PEEL.WHITENING",
              "Whitening Peel",
              "Glycolic 15 %, lactic 10 %, kojic 10 %, arbutin 10 %, licorice 3 %, \"Bright Light\" 2 %",
              "Superficial–medium",
              "2",
              "Tone evenness (4), mild superficial pigment (4), dullness (4), luminosity (3)",
              "Prefer over Party when tone > glow; kojic can sensitise"
            ],
            [
              "PEEL.SA20",
              "20 % Salicylic Acid Peel",
              "Salicylic 20 %",
              "Superficial–medium (lipophilic)",
              "2",
              "Blackhead congestion (5), comedonal acne (4), pores (4), sebum (4), textural radiance keratin_congestion (4)",
              "Salicylic rules; follicular action explains pore/oil strength"
            ],
            [
              "PEEL.SA30",
              "Salicylic Acid 30 % Peel",
              "Salicylic 30 %",
              "Medium",
              "3",
              "Active inflammatory acne (5), high sebum (5), congestion (5), BIBI (4)",
              "Medium class for sun/travel/event rules; observe for frosting"
            ],
            [
              "PEEL.SALIDS",
              "Sali DS Peel",
              "Salicylic (strength unstated), polymer carriers",
              "Medium",
              "3",
              "Active acne hotspots (5), oily acne-prone skin (4), lesion-directed work (5)",
              "Treated as medium"
            ],
            [
              "PEEL.COMBO",
              "Combination Peel",
              "Salicylic 20 %, mandelic 20 %",
              "Superficial",
              "2–3",
              "Acne + PIH in darker skin (5), PIH with ongoing activity (4), oily uneven tone (4)",
              "The FP IV–VI mixed-case peel: mandelic's large molecule limits PIH risk"
            ],
            [
              "PEEL.FUSION",
              "Fusion Peel-E",
              "Salicylic 10 %, glycolic 30 %, lactic 10 %, pyruvic 2 %",
              "Medium",
              "3",
              "Post-acne pigmentation (5), resurfacing (4), texture (4), superficial pigment (4), fine lines (3)",
              "Strongest resurfacing peel; medium class; not within 7 days of an event"
            ],
            [
              "PEEL.GLYCO35",
              "Glyco Peel 35",
              "Glycolic 35 %",
              "Medium",
              "3",
              "Texture/roughness (5), dehydration-type wrinkles (4), surface rejuvenation (5), dullness (4), superficial pigment (3)",
              "Medium class; timed and neutralised; not on flaking barrier"
            ]
          ]
        }
      ]
    },
    {
      "section": "1.4",
      "title": "1.4 Energy-based steps",
      "paragraphs": [],
      "tables": [
        {
          "columns": [
            "Step ID",
            "Step",
            "Equipment / settings",
            "clinic_step_type · minutes",
            "Mechanism",
            "Burden",
            "Primary targets (strength)",
            "Avoid / notes"
          ],
          "rows": [
            [
              "ENERGY.CARBON",
              "Carbon Facial",
              "Q-Switch 1064 nm low fluence over Carbon Lotion / Liquid Charcoal",
              "carbon_application_drying · 3 then carbon_laser · 4 (two steps, total 7)",
              "Photothermal/photomechanical vaporisation of carbon in pores: sebum reduction, pore refinement, superficial pigment lift, mild dermal stimulation",
              "2",
              "Sebum (5), pores (5), blackhead congestion (4), active acne (4 — photothermal effect on sebaceous units and C. acnes), superficial pigment/tan (4), luminosity (4), textural radiance (4), texture (3), PIH (3)",
              "All energy rules (sun > 2 h, travel/event 7 d, laser-7-d, retinol-24 h, acids-yesterday, proxy gates, temperature). Valid acne hero (constraints exclude standalone Q-switch, not Carbon). Loss must be explained in acne/oil/pore/pigment/texture cases"
            ],
            [
              "ENERGY.QS.TONING",
              "Q-switch laser toning",
              "Q-Switch 1064 nm, low fluence, no carbon",
              "other · 8–12",
              "Sub-photothermolytic melanosome disruption",
              "2",
              "Diffuse superficial pigment (4), selected melasma-pattern cases (3 per session, cumulative), PIH (3), tan (4)",
              "Same exclusions as Carbon; never standalone hero for active acne; single-session delta modest. For melasma, select when case history and clinical assessment favour toning over alternatives; review prior response, pigment stability, irritation and PIH risk. Sun-rule clearance alone does not select toning. Active-acne restrictions apply only to the lesion footprint; eligible uninvolved face remains treatable."
            ],
            [
              "ENERGY.QS.532",
              "Q-switch 532 nm spot",
              "Q-Switch 532 nm",
              "other · 3–8",
              "Epidermal melanin absorption, high selectivity",
              "3",
              "Discrete lentigines/freckles (5 for discrete spots)",
              "High PIH risk FP IV–VI; doctor-level; test spot; not melasma"
            ],
            [
              "ENERGY.QS.LIP",
              "Lip pigmentation add-on",
              "Q-Switch, 2 passes, with hyaluronic serum",
              "lip_pigmentation_add_on · 2",
              "Clinic lip protocol",
              "1",
              "Lip pigmentation (3 per session)",
              "Triggered by the application's client-display score < 70; before finishing; constraints/proxy/temperature rules apply; wavelength/energy per Dr. Aakriti's protocol"
            ],
            [
              "ENERGY.RF.LIFT",
              "RF lifting probe",
              "Hydrafacial Machine — Lifting Probe (RF) on pH-neutral gel",
              "other · 6–10",
              "Dermal heating ~40–43 °C → collagen contraction, fibroblast signalling, lymphatic warming",
              "1",
              "Firmness early_diffuse (3), jawline mild (2), peri-orbital puffiness via drainage (2), hydration plumpness (2), luminosity (2)",
              "Heat-device rules apply. Avoid directly heating an actively inflamed lesion; use eligible uninvolved zones when independent rules permit. Active-acne restrictions apply only to the lesion footprint; eligible uninvolved face remains treatable."
            ],
            [
              "ENERGY.RF.MACHINE",
              "Radiofrequency machine",
              "Radio Frequency Machine, energy 1–10",
              "other · 10–15",
              "Deeper dermal heating than the probe",
              "2",
              "Firmness (4), early jawline laxity (3), structural superficial wrinkles (3), lower_face_predominant collagen loss (3)",
              "Heat rules; a course modality; immediate delta is contraction only"
            ],
            [
              "ENERGY.HIFU",
              "HIFU",
              "HiFU Machine, 1.5 / 3 / 4.5 mm",
              "other · 45–90 (own session)",
              "Focused ultrasound coagulation points in dermis and SMAS",
              "2 (deep)",
              "Jawline sagging (5 at 3 months), firmness lower_face/global_mild (4), submental (3)",
              "Age 30–60 when indicated; numbing; see non-negotiable R5"
            ],
            [
              "ENERGY.MNRF",
              "Microneedling RF",
              "Micro Needling Radio Frequency, 1.5 mm",
              "other · 20–30 (own session)",
              "Fractional dermal RF through needles",
              "3",
              "Scars/structural texture (5 over a course), pores (4), structural wrinkles (4), firmness (3)",
              "Downtime 2-4 days; assessed standalone corrective under R5. Avoid active lesion footprints, not the rest of the face; barrier-caution and original pregnancy rules still apply."
            ],
            [
              "ENERGY.NEEDLE.PEN / .ROLLER",
              "Dermapen / Dermaroller 1.5 mm",
              "Micro Needling Machine / Dermapen / Dermaroller",
              "other · 15–25 (own session)",
              "Collagen induction; channels for PDRN/exosomes",
              "3",
              "Texture (4), scars (4), fine lines (3), delivery of EXO/PDRN (4)",
              "Assessed standalone corrective under R5. Do not needle/roll an active lesion itself; eligible uninvolved facial zones remain available."
            ],
            [
              "LED.BLUE",
              "LED blue (~415 nm)",
              "LED Light Therapy Machine",
              "other · 8–12",
              "Porphyrin photo-excitation kills C. acnes",
              "0",
              "Acne BIBI/porphyrin (3), post-extraction bacterial control (3), sebum-linked inflammation (2)",
              "Original pregnancy exclusion. If selected, screen relevant photosensitising medicines in preparations_checklist_for_therapist; no new field or missing-history denial."
            ],
            [
              "LED.RED",
              "LED red (~630–660 nm)",
              "LED Light Therapy Machine",
              "other · 8–12",
              "Photobiomodulation: ATP, anti-inflammatory, healing",
              "0",
              "Redness (3), barrier erythema (3), recovery after any corrective (4 for that purpose), healing after extraction (3), collagen (1)",
              "Permitted within 7 d of a laser; pregnancy-excluded; the clinic's calming light (there is no yellow mode)"
            ],
            [
              "LED.GREEN",
              "LED green (~525 nm)",
              "LED Light Therapy Machine",
              "other · 8–10",
              "Proposed melanocyte/vascular calming",
              "0",
              "Mild redness (2), tone (1)",
              "Evidence D; soothing finish only, never a pigment corrective"
            ],
            [
              "ENERGY.DIODE",
              "Diode laser",
              "Diode Laser Machine",
              "—",
              "Hair reduction",
              "—",
              "Not a facial-engine step",
              "Separate service"
            ]
          ]
        }
      ]
    },
    {
      "section": "1.5",
      "title": "1.5 Infusion, under-eye, spray, cooling",
      "paragraphs": [],
      "tables": [
        {
          "columns": [
            "Step ID",
            "Step",
            "Equipment / solution",
            "clinic_step_type · minutes",
            "Mechanism",
            "Burden",
            "Primary targets (strength)",
            "Avoid / notes"
          ],
          "rows": [
            [
              "INFUSE.HA",
              "Facial infusion — Hyaluronic Acid",
              "Face Ultrasound Infusion Probe",
              "infusion · 3 per ingredient",
              "Sonophoresis of humectant",
              "0",
              "Hydration (5), dehydration micro-lines (4), luminosity plumpness (3), barrier comfort (3)",
              "Default infusion; safe after any corrective; pregnancy-safe"
            ],
            [
              "INFUSE.VITC",
              "Facial infusion — Vitamin C",
              "Face Ultrasound Infusion Probe",
              "infusion · 3",
              "Antioxidant, tyrosinase modulation, collagen cofactor",
              "1",
              "Luminosity/dullness (4), tone (3), photo-damage (3), clarity (2)",
              "Vitamin C allergy rule; stings on freshly medium-peeled skin — the model should weigh HA/PDRN instead on such days (advice, not a rule)"
            ],
            [
              "INFUSE.TRX",
              "Facial infusion — Tranexamic Acid",
              "Face Ultrasound Infusion Probe",
              "infusion · 3",
              "Plasmin/vascular-melanocyte signalling inhibitor",
              "0",
              "Melasma-pattern and diffuse pigment (4), PIH (3), pigment-redness coupling (3)",
              "The pigment infusion; apply the existing live pregnancy and product rules"
            ],
            [
              "INFUSE.PDRN",
              "Facial infusion — PDRN",
              "Face Ultrasound Infusion Probe",
              "infusion · 3",
              "Adenosine A2A agonism: repair, anti-inflammatory",
              "0",
              "Barrier/sensitivity (4), redness (3), post-corrective recovery (4), hydration (3)",
              "Ideal after needling (own session), Carbon, medium peels"
            ],
            [
              "INFUSE.EXO",
              "Facial infusion — Exosomes",
              "Face Ultrasound Infusion Probe",
              "infusion · 3",
              "Vesicle-borne growth factors: regeneration, calming",
              "0",
              "Firmness (3), texture (3), recovery (4), redness (3), luminosity (2)",
              "Highest cost; reserve for regeneration goals"
            ],
            [
              "INFUSE.LIFT",
              "Facial infusion — Lifting",
              "Face Ultrasound Infusion Probe",
              "infusion · 3",
              "Peptide/firming actives",
              "0",
              "Firmness (3), event-day firmness (3)",
              "Pairs with RF.LIFT, MASK.LIFT"
            ],
            [
              "INFUSE.GLUT",
              "Facial infusion — Glutathione",
              "Face Ultrasound Infusion Probe",
              "infusion · 3",
              "Antioxidant; topical brightening evidence weak (D)",
              "0",
              "Dullness (2), tone (1)",
              "Never presented as pigment correction"
            ],
            [
              "EYE.INFUSE",
              "Under-eye infusion",
              "Ocular Ultrasound Infusion Probe; HA / Niacinamide / TRX / PDRN / Exosomes / Vitamin C",
              "under_eye_infusion · 2 (whole step)",
              "Sonophoresis in the orbital zone",
              "0–1",
              "Peri-orbital pigment_index (TRX 3, Vit C 2, niacinamide 2), texture_line_index (HA 3, PDRN 3, EXO 3), puffiness (with COOL 2), vascular_index (1), shadow_hollow_index (0 — do not promise)",
              "Mandatory two-minute infusion when customer-facing periocular score <=70; choose an approved serum using available findings, or appropriate hydration/comfort when sub-indices are absent. Do not invent findings or promise hollow correction."
            ],
            [
              "SPRAY.HYDRA",
              "Oxygen injection / hydra spray",
              "Oxygen Injection (Hydra spray); Vitamin C / TRX / HA / Niacinamide",
              "hydra_spray · 3 (whole step)",
              "Pressurised micro-mist delivery and cooling comfort",
              "0",
              "Hydration (3), comfort after peels/energy (3), redness calming with niacinamide (2), tone with Vit C (1)",
              "Needs a distinct purpose beyond the infusion (constraints)"
            ],
            [
              "COOL.ICE",
              "Ice probe cooling",
              "Hydrafacial Machine — Ice Probe",
              "cooling · 2–5",
              "Vasoconstriction, nociceptor calming",
              "0",
              "Redness (3 immediate), post-energy/post-peel comfort (5 for that purpose), puffiness (3 immediate), heat-rule mitigation (3)",
              "See non-negotiable R6"
            ]
          ]
        }
      ]
    },
    {
      "section": "1.6",
      "title": "1.6 Masks, massage, finish",
      "paragraphs": [],
      "tables": [
        {
          "columns": [
            "Step ID",
            "Step",
            "clinic_step_type · minutes",
            "Mechanism",
            "Burden",
            "Primary targets (strength)",
            "Avoid / notes"
          ],
          "rows": [
            [
              "MASK.CHARCOAL",
              "Charcoal peel-off",
              "peel_off_mask · 15",
              "Adsorbs sebum/debris; mild exfoliation on removal",
              "1",
              "Sebum (3), pores (2), keratin (2)",
              "Avoid dry, flaking or sensitive areas and beard; avoid direct removal over active inflammatory lesions while eligible uninvolved areas remain usable. Medium peel alone does not prohibit this mask."
            ],
            [
              "MASK.CALMING",
              "Calming peel-off",
              "peel_off_mask · 15",
              "Soothing actives, cooling",
              "0",
              "Redness (3), barrier (3), post-corrective recovery (3)",
              "—"
            ],
            [
              "MASK.BRIGHTEN",
              "Brighten peel-off",
              "peel_off_mask · 15",
              "Brightening actives, film-forming",
              "0–1",
              "Tone/dullness (3), superficial pigment (2), luminosity (3)",
              "—"
            ],
            [
              "MASK.HYDRATE",
              "Hydrate peel-off",
              "peel_off_mask · 15",
              "Occlusive humectant delivery",
              "0",
              "Hydration (4), dehydration lines (3), barrier (2), luminosity (2)",
              "—"
            ],
            [
              "MASK.LIFT",
              "Lift peel-off",
              "peel_off_mask · 15",
              "Film tension + firming actives",
              "0",
              "Firmness (2 immediate), event firmness (3), jawline (1)",
              "—"
            ],
            [
              "MASSAGE.LYMPH",
              "Face and neck lymphatic drainage",
              "lymphatic_drainage · 5–10",
              "Lymphatic clearance, de-puffing, relaxation",
              "0",
              "Puffiness (3), sallow tone (2), transient contour (2), client experience (3)",
              "One per session; Mandatory once per facial for 5-10 minutes. Place flexibly; use gentle non-lesion/untreated pathways and avoid direct pressure on inflamed or recently treated areas. Never omit drainage. Active-acne restrictions apply only to the lesion footprint; eligible uninvolved face remains treatable."
            ],
            [
              "FINISH.SMS",
              "Serum + moisturiser + sunscreen",
              "finishing · 3",
              "Barrier seal and UV protection",
              "0",
              "Mandatory last step",
              "Products per 1.7; mineral sunscreen default"
            ]
          ]
        }
      ]
    },
    {
      "section": "1.7",
      "title": "1.7 Finishing and home-care selection (from the clinic product list)",
      "paragraphs": [
        "Pregnancy flags from the product list are authoritative.",
        "Aloe-containing (skip on aloe allergy): Pumpkin Peel, Mandelic Peel, Gentle Hydrating Cleanser, Hydrating Face Moisturizer. Vitamin C–containing (skip on vitamin C allergy): INFUSE.VITC, SPRAY.HYDRA with Vit C, EYE.INFUSE with Vit C, C-Vit, Cosmetox."
      ],
      "tables": [
        {
          "columns": [
            "Need",
            "Serum",
            "Moisturiser",
            "Sunscreen / other"
          ],
          "rows": [
            [
              "Dry / sensitive / barrier-caution",
              "Daily Use Face Serum for Dry Skin (niacinamide 10 %, HA, ceramides)",
              "Hydrating Face Moisturizer for Dry & Sensitive, or Atoderm",
              "Eclipse Solaire SPF 50 (zinc oxide, titanium dioxide, niacinamide)"
            ],
            [
              "Oily / acne-prone",
              "Daily Use Face Serum AM; Ridacne SA 2 % PM (not pregnancy)",
              "Oil Control Moisturizer",
              "Same mineral sunscreen"
            ],
            [
              "Post-acne marks / superficial pigment",
              "Brightening Serum Concentrate (azelaic 10 %, kojic dipalmitate, licorice) — pregnancy-safe",
              "By skin type",
              "Mineral sunscreen"
            ],
            [
              "Melasma / resistant pigment (doctor-decided home phase)",
              "Melarid TrX AM/PM (not pregnancy); FCL AHA Lightening Gel HQ PM — prescription-level, cycled, not pregnancy",
              "By skin type",
              "Mineral sunscreen mandatory"
            ],
            [
              "Dullness / antioxidant",
              "C-Vit AM; Cosmetox spray (not pregnancy)",
              "By skin type",
              "Mineral sunscreen"
            ],
            [
              "Ageing / texture / firmness",
              "Advanced Retinol Serum PM — not pregnancy, not sensitive; pause 48 h before the next clinic visit (retinol-24 h rule); Agevia Exosomes PM (not pregnancy)",
              "By skin type",
              "Mineral sunscreen"
            ],
            [
              "Peri-orbital",
              "Juveage Under Eye Cream (peptides, caffeine, HA) — pregnancy-safe",
              "—",
              "Sunscreen to orbital rim"
            ],
            [
              "Keratotic / congested (home exfoliation)",
              "Kerato Plus (salicylic + malic) PM or Night Peel (glycolic 15 %) PM — not pregnancy; pause 48 h before a clinic peel or laser",
              "—",
              "—"
            ],
            [
              "Post-shave / folliculitis (men)",
              "After Shave Serum (niacinamide, salicylic, turmeric, ceramides)",
              "—",
              "—"
            ],
            [
              "Internal support (not a facial step)",
              "Hydra Life Nutraceutical AM — not pregnancy",
              "—",
              "—"
            ]
          ]
        }
      ]
    },
    {
      "section": "1.8",
      "title": "1.8 Time budgeting with the clinic's actual step timings",
      "paragraphs": [
        "Binding windows: express 35–45 min; single and each multiple-plan session 60–75 min, lip add-on included. Aim for 65 minutes for single/plan facials and 40 minutes for express. Keep actual doses and meaningful selection; no fixed-dose padding.",
        "Fixed or bounded durations (validated in code): cleansing 2 · suction 2–4 · carbon_application_drying 3 + carbon_laser 4 · chemical_peel 3–4 · spot_salicylic 2 · infusion 3 per distinct ingredient · under_eye_infusion 2 · hydra_spray 3 · cooling 2–5 · peel_off_mask 15 · lymphatic_drainage 5-10 (one mandatory step) · lip_pigmentation_add_on 2 · finishing 3.",
        "Everything else (extraction, high-frequency, spatula, microdermabrasion, LED, RF, Q-switch toning, HIFU, needling) is other with the reference minutes in Section 1; their specific duration ranges are not enforced by the current timing table, although the validator requires positive durations and checks the session sum; state each selected duration and its reason .",
        "Calculate time from actual selected doses: cleanse 2 + Carbon application 3 + Carbon laser 4 + spot salicylic 2 + cooling 3 + one facial infusion 3 + mask 15 + mandatory drainage 5 + finish 3 = 40 minutes. This is an arithmetic example, not a treatment sequence or a recipe. Add the two-minute lip/under-eye steps when triggered and count them inside the selected window. Never infer a standard total from the number of correctives."
      ],
      "tables": []
    },
    {
      "section": "2",
      "title": "2. Concern → step mapping (one table per scoring parameter)",
      "paragraphs": [
        "Each table lists the backend fields that should drive the choice, then steps ranked by strength. Rankings respect the constraints' candidate frameworks where they exist; where the constraints are silent (barrier, redness, hydration, luminosity, peri-orbital, lips, wrinkles, jawline, firmness, radiance, sebum) the ranking follows the ratified clinical reference . The model may deviate from these rankings with a stated case-specific reason; it may not deviate from constraints.json."
      ],
      "tables": []
    },
    {
      "section": "2.1",
      "title": "2.1 Skin Type Classification (label; drives defaults, not a concern)",
      "paragraphs": [],
      "tables": [
        {
          "columns": [
            "Label / modifier",
            "Default vortex serum",
            "Default infusion",
            "Default mask",
            "Default finish",
            "Engine bias"
          ],
          "rows": [
            [
              "Dry",
              "A03",
              "INFUSE.HA",
              "MASK.HYDRATE",
              "Dry/sensitive set",
              "Favour PARTY/PUMPKIN/GLYCO35 over salicylic"
            ],
            [
              "Oily",
              "SA2",
              "INFUSE.HA or TRX",
              "MASK.CHARCOAL if barrier intact",
              "Oily set",
              "Favour CARBON, SA20/SA30, SALIDS"
            ],
            [
              "Combination",
              "AS1 (SA2 on T-zone if zoned)",
              "INFUSE.HA",
              "By dominant concern",
              "By zone",
              "Zone the plan"
            ],
            [
              "Balanced",
              "AS1",
              "INFUSE.HA",
              "MASK.BRIGHTEN",
              "Dry/sensitive set",
              "Glow-oriented"
            ],
            [
              "_sensitive",
              "A03",
              "INFUSE.PDRN or HA",
              "MASK.CALMING",
              "Dry/sensitive set",
              "Drop one peel class; EXFO.SPATULA over MICRO; LED.RED"
            ],
            [
              "_sun_reactive",
              "—",
              "INFUSE.VITC (if tolerated) + TRX",
              "MASK.CALMING",
              "Mineral SPF emphasis",
              "Conservative pigment work; Q-switch only when the sun rule clears"
            ],
            [
              "Fitzpatrick IV–VI",
              "—",
              "—",
              "—",
              "—",
              "Prefer COMBO/MANDELIC chemistry over high glycolic on PIH-prone zones; conservative fluence; never 532 nm without the doctor"
            ]
          ]
        }
      ]
    },
    {
      "section": "2.2",
      "title": "2.2 Barrier Health + Sensitivity (BSI_continuous, higher is worse)",
      "paragraphs": [
        "Drivers: barrier_damage_pattern, sensitivity_pattern, hydration_signal_index, erythema_intensity_index, flaking_texture_index, barrier_uniformity_index, improvability_index."
      ],
      "tables": [
        {
          "columns": [
            "Pattern",
            "Hero (strength)",
            "Secondary / support",
            "Recovery",
            "Finish",
            "Avoid (0)"
          ],
          "rows": [
            [
              "Dryness-driven impairment (use actual findings; no additional flaking threshold)",
              "INFUSE.HA (5) + MASK.HYDRATE (4)",
              "EXFO.SPATULA (2), PEEL.PUMPKIN (2 if flaking mild)",
              "LED.RED (3), SPRAY.HYDRA HA (3)",
              "Dry/sensitive set, ceramide serum",
              "Use original live numeric gates and the separately selected peel/abrasion rules; no flaking >0.50 Carbon or energy denial."
            ],
            [
              "Dehydration-driven impairment (hydration < 0.40)",
              "INFUSE.HA (5), EXFO.VORTEX A03 (4)",
              "SPRAY.HYDRA HA (3), MASK.HYDRATE (4)",
              "COOL.ICE if warm",
              "Hydrating set",
              "Medium peels, charcoal mask"
            ],
            [
              "Structural barrier disruption (uniformity < 0.55 → energy denied)",
              "INFUSE.PDRN (5), INFUSE.HA (4), MASK.CALMING (4)",
              "EXFO.SPATULA only (2)",
              "LED.RED treated as allowed low-risk recovery light",
              "Ceramide serum, hydrating moisturiser, mineral SPF",
              "All peels except PUMPKIN; all abrasion; all heat"
            ],
            [
              "Inflammatory sensitivity (apply live numeric erythema rules)",
              "LED.RED (4), INFUSE.PDRN (4), COOL.ICE (4)",
              "MASK.CALMING (4), SPRAY.HYDRA niacinamide (3)",
              "—",
              "Dry/sensitive set",
              "No additional erythema >0.60 acid/heat/HF denial. Apply live numeric gates, and distinguish independently selected clinical redness-pattern rules. Adapt mandatory massage pressure; never omit it."
            ],
            [
              "Vascular-reactive",
              "COOL.ICE (4), LED.RED (3), MASK.CALMING (3)",
              "INFUSE.PDRN (3)",
              "—",
              "—",
              "Heat devices and glycolic on reactive areas; adapt mandatory massage pressure/pathways rather than omitting drainage."
            ],
            [
              "Low-reactive (BSI < 0.35)",
              "No barrier work needed",
              "—",
              "—",
              "—",
              "—"
            ]
          ]
        }
      ]
    },
    {
      "section": "2.3",
      "title": "2.3 Visual Acne Grading (ASI_continuous, higher is worse)",
      "paragraphs": [
        "Drivers: lesion_counts, inflammatory_ratio, comedone_density_index, inflammatory_cluster_index, uv_porhyrin_load, chronicity_index, nodular_flag, BIBI_index, region_activity_map, improvability_index. Mandatory: visible active lesions → PEEL.SPOT.SALI (uncounted adjunct). Standalone Q-switch is never the acne hero."
      ],
      "tables": [
        {
          "columns": [
            "Phenotype",
            "Hero candidates (strength)",
            "Secondary corrective",
            "Support",
            "Recovery",
            "Avoid"
          ],
          "rows": [
            [
              "Comedonal / congestion",
              "PEEL.SA20 (5), ENERGY.CARBON (5), PEEL.SALIDS (4), EXFO.TEEN (3), PEEL.COMBO (4 if PIH)",
              "EXTR.MANUAL (4) with ENERGY.HF after",
              "EXFO.VORTEX SA2 (3), MASK.CHARCOAL (3)",
              "LED.BLUE (3), LED.RED (2)",
              "No default Mandelic; no microdermabrasion or roller pass directly on an active pustule/lesion. Eligible uninvolved zones remain available."
            ],
            [
              "Inflammatory papulopustular",
              "ENERGY.CARBON (5 if allowed), PEEL.SA30 (5), PEEL.SALIDS (5), PEEL.COMBO (4)",
              "PEEL.SPOT.SALI adjunct; ENERGY.HF sparking (3)",
              "LED.BLUE (3), COOL.ICE (3)",
              "LED.RED (3), MASK.CALMING (3), INFUSE.PDRN (3)",
              "Do not extract, abrade, needle or remove charcoal over the active lesion itself. Treat eligible uninvolved face; mandatory gentle drainage avoids direct lesion pressure."
            ],
            [
              "High BIBI / porphyrin",
              "ENERGY.CARBON (5), PEEL.SA30 (4)",
              "LED.BLUE (4), ENERGY.HF (3)",
              "MASK.CHARCOAL (2)",
              "LED.RED (2)",
              "—"
            ],
            [
              "Nodular (nodular_flag)",
              "Nodules are not a facial-corrective target. Gentle local LED/cooling/hydration as suitable; the remaining uninvolved face may receive the best permitted corrective.",
              "—",
              "—",
              "—",
              "No acid, extraction or heat directly on a nodule. This restriction is lesion-local and does not limit the whole facial session to recovery."
            ],
            [
              "Acne + PIH (chronicity high)",
              "PEEL.COMBO (5), PEEL.FUSION (5 on eligible uninvolved zones; avoid active lesion footprints), ENERGY.CARBON (4)",
              "PEEL.SPOT.SALI; INFUSE.TRX (3)",
              "MASK.BRIGHTEN (2)",
              "LED.RED",
              "Avoid glycolic-heavy passes directly on active pustules in FP IV-VI; treat eligible uninvolved zones under independent rules."
            ],
            [
              "PCOD-linked",
              "As above; modest outlook (constraints)",
              "—",
              "—",
              "—",
              "—"
            ]
          ]
        }
      ]
    },
    {
      "section": "2.4",
      "title": "2.4 Skin Sebum Index (SSI_continuous; target the balance zone)",
      "paragraphs": [
        "Drivers: shine_reflectance_index, sebaceous_congestion_index, porphyrin_load_index, sebum_depth_component_index, sebum_variability_index, regional_sebum_map."
      ],
      "tables": [
        {
          "columns": [
            "Pattern",
            "Hero (strength)",
            "Secondary",
            "Support",
            "Finish",
            "Avoid"
          ],
          "rows": [
            [
              "Surface-shine dominant",
              "ENERGY.CARBON (5), PEEL.SA20 (4)",
              "EXFO.VORTEX SA2 (3)",
              "MASK.CHARCOAL (3), SPRAY niacinamide (2)",
              "Oily set",
              "Occlusives"
            ],
            [
              "Follicular-congestion dominant",
              "PEEL.SA30 (5), ENERGY.CARBON (5), PEEL.SALIDS (4)",
              "EXTR.MANUAL (3) + HF",
              "LED.BLUE (3)",
              "Oily set, Ridacne PM",
              "—"
            ],
            [
              "High variability (T-zone only)",
              "CARBON or SA20 on T-zone (4); cheeks hydrated",
              "INFUSE.HA cheeks (3)",
              "—",
              "Zoned",
              "Full-face salicylic"
            ],
            [
              "Very low sebum (SSI < 0.20)",
              "Treat hydration (2.6), not sebum",
              "—",
              "—",
              "Dry set",
              "Degreasing"
            ]
          ]
        }
      ]
    },
    {
      "section": "2.5",
      "title": "2.5 Vascularity / Redness (BIBI_index; score higher is worse)",
      "paragraphs": [
        "Drivers: clinical_erythema_visibility, vascular_pattern_prominence, diffuse_background_redness, subclinical_inflammation_hotspots, sebaceous_inflammation_component, diffuse_vs_vascular dominance."
      ],
      "tables": [
        {
          "columns": [
            "Pattern",
            "Hero (strength)",
            "Secondary",
            "Support",
            "Finish",
            "Avoid"
          ],
          "rows": [
            [
              "Diffuse-dominant, mild–moderate",
              "LED.RED (4), INFUSE.PDRN (4)",
              "MASK.CALMING (4), COOL.ICE (4)",
              "SPRAY niacinamide (3), INFUSE.TRX (2)",
              "Dry/sensitive set; azelaic at home (B)",
              "Glycolic, salicylic > 20 %, heat, HF; adapt mandatory drainage pressure/pathways without omission"
            ],
            [
              "Vascular-dominant",
              "COOL.ICE (3), LED.RED (3)",
              "MASK.CALMING (3)",
              "—",
              "—",
              "No in-clinic device treats vessels (no vascular laser); set expectations"
            ],
            [
              "Sebaceous-inflammation component",
              "Treat as inflammatory acne with CARBON or SA30 at conservative settings",
              "LED.BLUE then RED",
              "COOL.ICE",
              "—",
              "—"
            ],
            [
              "High / rosacea-like (> 65)",
              "Barrier-first: INFUSE.PDRN, LED.RED, COOL.ICE, MASK.CALMING",
              "—",
              "—",
              "—",
              "Every corrective; temperature rule usually triggers"
            ]
          ]
        }
      ]
    },
    {
      "section": "2.6",
      "title": "2.6 Skin Hydration (HSI_continuous, higher is better)",
      "paragraphs": [
        "Drivers: hydration_deficit_type, surface_reflectance_index, microline_density_index, subsurface_diffusion_index, dry_patch_fluorescence_index, sebum_balance_ratio, hydration_recovery_potential."
      ],
      "tables": [
        {
          "columns": [
            "Deficit type",
            "Hero (strength)",
            "Secondary",
            "Support",
            "Finish"
          ],
          "rows": [
            [
              "surface_dehydration",
              "EXFO.VORTEX A03 (4), INFUSE.HA (5)",
              "PEEL.PARTY (3 if barrier allows)",
              "MASK.HYDRATE (4), SPRAY HA (3)",
              "Hydrating set"
            ],
            [
              "deep_dermal_dehydration",
              "INFUSE.HA (5), INFUSE.PDRN (4)",
              "ENERGY.RF.LIFT (2)",
              "MASK.HYDRATE (4)",
              "Hydrating set; HA nutraceutical"
            ],
            [
              "sebum_deficiency_dehydration",
              "INFUSE.HA (4) + lipid-rich finish (5)",
              "EXFO.SPATULA only (1)",
              "MASK.HYDRATE (4)",
              "Ceramide serum, shea moisturiser"
            ],
            [
              "mixed_dehydration (oily + dehydrated)",
              "INFUSE.HA (5)",
              "EXFO.VORTEX SA2 (3) or SA20 T-zone (3)",
              "MASK.HYDRATE (3), SPRAY (3)",
              "Niacinamide serum + oil-control moisturiser"
            ],
            [
              "well_hydrated",
              "Maintain",
              "—",
              "—",
              "—"
            ]
          ]
        }
      ]
    },
    {
      "section": "2.7",
      "title": "2.7 Skin Luminosity / Glow (GLI_continuous, higher is better)",
      "paragraphs": [
        "Drivers: glow_limiting_factors, surface_reflectance_uniformity, sebum_gloss_index, treatment_responsiveness_index."
      ],
      "tables": [
        {
          "columns": [
            "Limiting factor",
            "Hero (strength)",
            "Secondary",
            "Support",
            "Avoid"
          ],
          "rows": [
            [
              "dullness_due_to_dryness",
              "INFUSE.HA (5), PEEL.PARTY (4)",
              "MASK.HYDRATE (4)",
              "SPRAY (3)",
              "Degreasing"
            ],
            [
              "dullness_due_to_texture",
              "PEEL.GLYCO35 (5), EXFO.MICRO.DIAMOND (4), PEEL.PARTY (4)",
              "ENERGY.CARBON (4)",
              "MASK.BRIGHTEN (3)",
              "—"
            ],
            [
              "dullness_due_to_low_L (pigment/tan)",
              "ENERGY.CARBON (4), PEEL.WHITENING (4), ENERGY.QS.TONING (3)",
              "INFUSE.VITC (4), INFUSE.TRX (3)",
              "MASK.BRIGHTEN (3)",
              "—"
            ],
            [
              "dullness_due_to_shadows (laxity)",
              "ENERGY.RF.LIFT (3), INFUSE.LIFT (2)",
              "MASSAGE.LYMPH (2)",
              "MASK.LIFT (2)",
              "—"
            ],
            [
              "Event readiness",
              "PEEL.PARTY (5), PEEL.PUMPKIN (4 sensitive)",
              "INFUSE.HA + VITC",
              "MASK.BRIGHTEN",
              "Medium peels, CARBON within 7 days of the event (constraints)"
            ]
          ]
        }
      ]
    },
    {
      "section": "2.8",
      "title": "2.8 Superficial Pigmentation (PPL_continuous, higher is worse)",
      "paragraphs": [
        "Drivers: coverage_area_percent, mean_intensity_index, contrast_to_surrounding_skin_index, uniformity_index, border_definition_score, depth_index_uv_to_woods, superficial_fraction_index, uv_enhancement_ratio, improvability_index, regional_burden_map, pigment_grid_map.",
        "Melasma evidence update. A 2026 randomised placebo-controlled trial found no significant added melasma benefit from its low-fluence 1064 nm Q-switch regimen over accompanying topical therapy. This supports selective toning rather than automatic selection; it does not exclude every toning protocol. Sadeghpour et al., Dermatologic Surgery 52(3):205–211. https://doi.org/10.1097/DSS.0000000000004846"
      ],
      "tables": [
        {
          "columns": [
            "Phenotype",
            "Hero candidates (strength)",
            "Secondary",
            "Support",
            "Home",
            "Avoid"
          ],
          "rows": [
            [
              "Diffuse tan (coverage high, intensity mild, superficial_fraction high)",
              "ENERGY.CARBON (5), PEEL.WHITENING (4), PEEL.PARTY (4 glow), ENERGY.QS.TONING (4)",
              "INFUSE.VITC (4) or TRX (3)",
              "MASK.BRIGHTEN (3)",
              "Mineral SPF, C-Vit",
              "Peels/laser while the sun rule triggers"
            ],
            [
              "Discrete spots, sharp borders",
              "ENERGY.QS.532 spot (5, doctor-level), ENERGY.CARBON (3), PEEL.WHITENING (3)",
              "INFUSE.TRX (2)",
              "—",
              "Brightening serum",
              "532 on FP V–VI without a test spot"
            ],
            [
              "Melasma-pattern (malar, uneven borders, uv_enhancement high, thyroid/PCOD history)",
              "ENERGY.QS.TONING low fluence (4 per session in selected cases), PEEL.WHITENING (3), PEEL.COMBO (3). Select toning for a documented case-specific advantage; passing the sun rule alone is insufficient.",
              "INFUSE.TRX (5)",
              "MASK.BRIGHTEN (2), COOL.ICE (3 — heat worsens melasma)",
              "Melarid TrX, cycled HQ (doctor), tinted mineral SPF",
              "Medium glycolic peels, high fluence, heat devices, MICRO"
            ],
            [
              "Post-inflammatory (chronicity high)",
              "PEEL.FUSION (5), PEEL.COMBO (5 if active acne), ENERGY.CARBON (4), PEEL.WHITENING (3)",
              "INFUSE.TRX (4)",
              "MASK.BRIGHTEN (3)",
              "Azelaic serum",
              "MANDELIC by default"
            ],
            [
              "Deep / mixed (superficial_fraction low)",
              "ENERGY.QS.TONING (3, series)",
              "INFUSE.TRX (3)",
              "—",
              "Doctor-led home phase",
              "Over-promising"
            ],
            [
              "Diabetic acanthotic-type (history)",
              "PEEL.WHITENING (2), INFUSE.TRX (2)",
              "—",
              "—",
              "Metabolic outlook (constraints)",
              "Aggressive peels"
            ]
          ]
        }
      ]
    },
    {
      "section": "2.9",
      "title": "2.9 Peri-Orbital Health (score higher is worse)",
      "paragraphs": [
        "Drivers: pigment_index, vascular_index, shadow_hollow_index, puffiness_index, texture_line_index. Operational rule: customer-facing periocular score <=70 requires two-minute under-eye infusion, regardless of primary selection; no additional finding/assessability gate is imposed."
      ],
      "tables": [
        {
          "columns": [
            "Dominant sub-index",
            "Hero (strength)",
            "Secondary",
            "Home",
            "Avoid"
          ],
          "rows": [
            [
              "pigment_index",
              "EYE.INFUSE TRX (3) or Vit C (2) or niacinamide (2)",
              "COOL.ICE (1)",
              "Under-eye cream + SPF to the orbital rim",
              "Use the approved ocular infusion serum; original live product/allergy and spot-salicylic zone exclusions remain. No additional Mother B16 exclusion."
            ],
            [
              "texture_line_index",
              "EYE.INFUSE HA (3), PDRN (3), EXO (3)",
              "ENERGY.RF.LIFT appropriate clinic protocol (2)",
              "Peptide under-eye cream",
              "Apply the mandatory score-triggered infusion rule and the existing live procedure/product rules."
            ],
            [
              "puffiness_index",
              "COOL.ICE (3), MASSAGE.LYMPH (3)",
              "EYE.INFUSE niacinamide (1), RF.LIFT (2)",
              "Caffeine cream; salt/sleep advice",
              "Avoid unnecessary heat/occlusion; retain the mandatory score-triggered infusion and drainage."
            ],
            [
              "vascular_index",
              "COOL.ICE (2), LED.RED (1)",
              "—",
              "Peptide/caffeine cream",
              "—"
            ],
            [
              "shadow_hollow_index",
              "No facial infusion corrects structural hollows; still provide the triggered under-eye infusion for suitable hydration/comfort without promising hollow correction.",
              "—",
              "—",
              "Promising improvement"
            ]
          ]
        }
      ]
    },
    {
      "section": "2.10",
      "title": "2.10 Lip Pigmentation (score higher is worse)",
      "paragraphs": [
        "Drivers: intrinsic_melanin_index, surface_darkness_index, vascular_congestion_index, lipstick_mask_confidence, pigment_classification. The application computes the trigger (client-display score < 70, lips assessable)."
      ],
      "tables": [
        {
          "columns": [
            "Classification",
            "In-session (strength)",
            "Home",
            "Avoid"
          ],
          "rows": [
            [
              "melanin_dominant, trigger true",
              "ENERGY.QS.LIP — 2 Q-switch passes with hyaluronic serum, 2 min, before finishing (3 per session; cumulative over a course)",
              "SPF lip balm; stop lip-licking",
              "Any peel on the lips; QS.LIP when proxy/temperature rules block it"
            ],
            [
              "vascular_dominant",
              "QS.LIP if triggered (2); COOL.ICE (2)",
              "Hydrating balm",
              "—"
            ],
            [
              "cosmetic_mask / not assessable",
              "Record not_assessable; re-scan without cosmetics",
              "—",
              "—"
            ],
            [
              "mixed_type",
              "QS.LIP if triggered",
              "—",
              "—"
            ]
          ]
        }
      ]
    },
    {
      "section": "2.11",
      "title": "2.11 Texture & Open Pores (PTI_continuous, higher is worse)",
      "paragraphs": [
        "Drivers: pore_density_index, pore_diameter_index, pore_clarity_index, texture_roughness_index, blackhead_congestion_index."
      ],
      "tables": [
        {
          "columns": [
            "Pattern",
            "Hero (strength)",
            "Secondary",
            "Support",
            "Course modality (own session)",
            "Avoid"
          ],
          "rows": [
            [
              "Pore clarity low + blackheads",
              "PEEL.SA20 (5), ENERGY.CARBON (5)",
              "EXTR.MANUAL (4) + HF",
              "EXFO.VORTEX SA2 (3), MASK.CHARCOAL (3)",
              "—",
              "Occlusives"
            ],
            [
              "Pore diameter/density high, clean pores",
              "ENERGY.CARBON (5)",
              "PEEL.SA20 (3)",
              "LED.RED (1)",
              "ENERGY.MNRF (4)",
              "—"
            ],
            [
              "Texture roughness (keratotic)",
              "PEEL.GLYCO35 (5), EXFO.MICRO.DIAMOND (4), PEEL.FUSION (4)",
              "INFUSE.HA (3)",
              "MASK.HYDRATE (3)",
              "ENERGY.NEEDLE.* (3)",
              "MICRO + GLYCO35 same session (R4)"
            ],
            [
              "Scarred texture",
              "No single-session facial corrective; ENERGY.MNRF course with INFUSE.EXO/PDRN after",
              "—",
              "—",
              "—",
              "Promising scar change from a facial"
            ]
          ]
        }
      ]
    },
    {
      "section": "2.12",
      "title": "2.12 Superficial Wrinkles (WBI_continuous, higher is worse)",
      "paragraphs": [
        "Drivers: structural_vs_dehydration_index, wrinkle_depth_index, microline_density_index, chronicity_uv_index, regional_uniformity_index."
      ],
      "tables": [
        {
          "columns": [
            "Pattern",
            "Hero (strength)",
            "Secondary",
            "Support",
            "Course modality"
          ],
          "rows": [
            [
              "mostly_dehydration",
              "INFUSE.HA (5), PEEL.PARTY (3) or GLYCO35 (4)",
              "MASK.HYDRATE (4), ENERGY.RF.LIFT (3)",
              "SPRAY HA (3)",
              "—"
            ],
            [
              "mixed",
              "PEEL.GLYCO35 (4), ENERGY.RF.MACHINE (3)",
              "INFUSE.HA + EXO (3)",
              "MASK.LIFT (2)",
              "ENERGY.MNRF (4), HIFU 1.5 mm (3)"
            ],
            [
              "mostly_structural",
              "ENERGY.RF.MACHINE (3), INFUSE.EXO (3)",
              "MASK.LIFT (2)",
              "—",
              "ENERGY.MNRF (4), ENERGY.HIFU (3), doctor-led botox for expression lines"
            ]
          ]
        }
      ]
    },
    {
      "section": "2.13",
      "title": "2.13 Jawline Sagging (score higher is worse)",
      "paragraphs": [
        "Drivers: mandibular_line_deflection_angle, pre_jowl_sulcus_depth_index, jowl_bulge_prominence_index, submental_fullness_index, dermal_collagen_thinning_index, left_right_asymmetry_index."
      ],
      "tables": [
        {
          "columns": [
            "Pattern",
            "In-facial step (strength)",
            "Corrective modality (own session)",
            "Support",
            "Avoid"
          ],
          "rows": [
            [
              "Early deflection, age < 30",
              "ENERGY.RF.LIFT (3), INFUSE.LIFT (2), MASK.LIFT (2)",
              "ENERGY.RF.MACHINE course (3)",
              "MASSAGE.LYMPH (2)",
              "HIFU (age rule)"
            ],
            [
              "Moderate deflection / early jowl, age 30–60",
              "ENERGY.RF.LIFT (2 same-day firmness)",
              "ENERGY.HIFU 4.5 + 3 mm (5 at 3 months)",
              "RF between HIFU sessions",
              "HIFU stacked with anything (R5)"
            ],
            [
              "Submental fullness",
              "MASSAGE.LYMPH (2 transient)",
              "ENERGY.HIFU submental (3)",
              "—",
              "—"
            ],
            [
              "Age > 60 or severe",
              "Expectation-setting; thread lift / surgical opinion",
              "—",
              "—",
              "HIFU without documented indication"
            ]
          ]
        }
      ]
    },
    {
      "section": "2.14",
      "title": "2.14 Skin Firmness & Elasticity (continuous_firmness_index, higher is worse)",
      "paragraphs": [
        "Drivers: collagen_loss_pattern_type, micro_laxity_pattern_index, collagen_reflectance_uniformity, elastic_recoil_proxy_index, regional_firmness_map, improvability_index."
      ],
      "tables": [
        {
          "columns": [
            "collagen_loss_pattern_type",
            "In-facial hero (strength)",
            "Secondary",
            "Support",
            "Course modality"
          ],
          "rows": [
            [
              "early_diffuse",
              "ENERGY.RF.LIFT (4), INFUSE.LIFT (3)",
              "INFUSE.EXO (3)",
              "MASK.LIFT (3)",
              "RF.MACHINE course"
            ],
            [
              "cheek_predominant",
              "ENERGY.RF.LIFT cheeks (4)",
              "INFUSE.EXO/PDRN (3)",
              "MASK.LIFT",
              "HIFU 3 mm cheeks (30–60), MNRF"
            ],
            [
              "lower_face_predominant",
              "ENERGY.RF.LIFT lower face (3)",
              "INFUSE.LIFT (2)",
              "MASSAGE.LYMPH (2)",
              "HIFU 4.5 mm (30–60)"
            ],
            [
              "global_mild",
              "ENERGY.RF.MACHINE (4) or RF.LIFT (3)",
              "INFUSE.EXO (3)",
              "MASK.LIFT",
              "RF course + HIFU when indicated"
            ],
            [
              "global_severe",
              "Expectation-setting; RF.LIFT for comfort (2)",
              "—",
              "—",
              "Thread lift / surgical opinion"
            ]
          ]
        }
      ]
    },
    {
      "section": "2.15",
      "title": "2.15 Textural Radiance (continuous_TRI, higher is worse)",
      "paragraphs": [
        "Drivers: radiance_loss_pattern, micro_clarity_index, surface_smooth_scatter_index, keratin_shadow_index."
      ],
      "tables": [
        {
          "columns": [
            "radiance_loss_pattern",
            "Hero (strength)",
            "Secondary",
            "Support"
          ],
          "rows": [
            [
              "surface_smoothness_deficit",
              "PEEL.GLYCO35 (5), EXFO.MICRO.DIAMOND (4), PEEL.PARTY (4)",
              "INFUSE.HA (3)",
              "MASK.HYDRATE / BRIGHTEN"
            ],
            [
              "clarity_haze_deficit",
              "EXFO.VORTEX AS1 (4), PEEL.PARTY (4), ENERGY.CARBON (4)",
              "INFUSE.VITC (3)",
              "MASK.BRIGHTEN (3)"
            ],
            [
              "keratin_congestion_deficit",
              "EXFO.SPATULA (4), PEEL.SA20 (5), ENERGY.CARBON (5)",
              "EXTR.MANUAL (3)",
              "MASK.CHARCOAL (2)"
            ],
            [
              "mixed",
              "ENERGY.CARBON (4) or PEEL.PARTY + EXFO.VORTEX (4)",
              "INFUSE.HA (3)",
              "—"
            ]
          ]
        }
      ]
    },
    {
      "section": "3",
      "title": "3. Step-centred reverse index (what each step is for)",
      "paragraphs": [],
      "tables": [
        {
          "columns": [
            "Step ID",
            "Concerns helped (strength ≥ 3)",
            "Not helped / worsened"
          ],
          "rows": [
            [
              "ENERGY.CARBON",
              "Sebum, pores, congestion, active acne, superficial pigment/tan, luminosity, textural radiance; PIH and texture (3)",
              "Actual live energy denials; high-fluence melasma mismatch; no one-session structural-wrinkle or sagging correction. No additional B5/B8 numerical gate."
            ],
            [
              "ENERGY.QS.TONING",
              "Diffuse pigment, tan, selected melasma cases (series), PIH",
              "Not an acne HERO; may treat another indicated concern on eligible uninvolved zones. Original energy gates apply. No texture correction."
            ],
            [
              "ENERGY.QS.LIP",
              "Lip pigmentation (clinic protocol)",
              "—"
            ],
            [
              "PEEL.PARTY",
              "Glow, event readiness, textural radiance, hydration, tone",
              "Does not correct active acne lesions or structural change; other eligible facial zones may receive indicated glow work."
            ],
            [
              "PEEL.WHITENING",
              "Tone, mild pigment, dullness",
              "Does not correct active acne lesions; other eligible facial zones may receive indicated tone work. Existing severe-barrier rules apply."
            ],
            [
              "PEEL.PUMPKIN",
              "Sensitive glow, mild texture",
              "Anything needing correction"
            ],
            [
              "PEEL.MANDELIC",
              "Reactive FP V–VI gentle exfoliation",
              "Must out-rank all others to be chosen"
            ],
            [
              "PEEL.SA20",
              "Blackheads, pores, comedonal acne, sebum, keratin congestion",
              "Dry/flaking skin, redness"
            ],
            [
              "PEEL.SA30 / SALIDS",
              "Inflammatory acne, high sebum, BIBI",
              "Dry/sensitive skin; the salicylic rules"
            ],
            [
              "PEEL.COMBO",
              "Acne + PIH in darker skin",
              "Pure dryness/glow goals"
            ],
            [
              "PEEL.FUSION",
              "PIH, resurfacing, texture, superficial pigment, fine lines",
              "Barrier caution/event week. Avoid direct application to active pustular lesions in FP V-VI; other eligible facial zones remain available."
            ],
            [
              "PEEL.GLYCO35",
              "Texture, rejuvenation, dehydration lines, dullness",
              "Flaking barrier/melasma-prone zones; active-acne restriction is local to lesion footprints, not uninvolved face."
            ],
            [
              "EXFO.MICRO.DIAMOND",
              "Roughness, keratotic texture, dullness",
              "Redness, flaking and melasma-prone zones; avoid active lesion footprints, not the uninvolved face."
            ],
            [
              "EXFO.VORTEX",
              "Hydration, luminosity, pores/blackheads, clarity, textural radiance",
              "—"
            ],
            [
              "EXFO.SPATULA",
              "Keratin congestion, gentle exfoliation on caution skin",
              "—"
            ],
            [
              "ENERGY.RF.LIFT / RF.MACHINE",
              "Firmness, early laxity, dehydration lines, puffiness drainage",
              "Hot/reactive/melasma/rosacea zones; active-inflammation restriction is local to the lesion footprint; use eligible uninvolved regions."
            ],
            [
              "ENERGY.HIFU",
              "Jawline sagging, lower-face firmness (3-month result)",
              "Age rule; same-day stacking (R5)"
            ],
            [
              "ENERGY.MNRF / NEEDLE.*",
              "Scars, structural texture, pores (course), structural wrinkles",
              "Assessed standalone corrective; barrier caution rules. Do not treat active lesion footprints; eligible uninvolved facial zones remain available."
            ],
            [
              "LED.BLUE",
              "Acne BIBI, post-extraction bacteria",
              "Pregnancy"
            ],
            [
              "LED.RED",
              "Redness, barrier, recovery after every corrective",
              "Pregnancy"
            ],
            [
              "LED.GREEN",
              "Mild soothing",
              "Pigment correction (no)"
            ],
            [
              "ENERGY.HF",
              "Post-extraction sanitation, drying pustules",
              "Rosacea pattern, pregnancy"
            ],
            [
              "INFUSE.HA",
              "Hydration, lines, luminosity, barrier; universal after a corrective",
              "—"
            ],
            [
              "INFUSE.VITC",
              "Dullness, tone, antioxidant",
              "Freshly medium-peeled, stinging skin; Vit C allergy"
            ],
            [
              "INFUSE.TRX",
              "Melasma, PIH, diffuse pigment, pigment-redness coupling, under-eye pigment",
              "—"
            ],
            [
              "INFUSE.PDRN",
              "Barrier, redness, recovery, hydration, under-eye texture",
              "—"
            ],
            [
              "INFUSE.EXO",
              "Firmness, texture, regeneration, recovery, under-eye",
              "Cost: use when regeneration is the goal"
            ],
            [
              "INFUSE.LIFT",
              "Firmness, event firmness",
              "—"
            ],
            [
              "INFUSE.GLUT",
              "Weak dullness support",
              "Pigment correction (no)"
            ],
            [
              "EYE.INFUSE",
              "Peri-orbital pigment/texture/puffiness per ingredient",
              "Hollows (no)"
            ],
            [
              "SPRAY.HYDRA",
              "Hydration, comfort, mild redness",
              "Duplicating infusion without a purpose"
            ],
            [
              "COOL.ICE",
              "Redness, comfort, puffiness, heat mitigation, post-energy",
              "—"
            ],
            [
              "MASK.*",
              "Sebum / redness / tone / hydration / firmness by mask",
              "Wrong mask on wrong skin"
            ],
            [
              "MASSAGE.LYMPH",
              "Puffiness, sallow tone, experience; mandatory one 5-10 minute step",
              "Avoid direct pressure on active lesions/reactive or recently treated areas; adapt pathways and retain mandatory drainage"
            ],
            [
              "FINISH.SMS",
              "Mandatory; locks in every result",
              "—"
            ]
          ]
        }
      ]
    },
    {
      "section": "4",
      "title": "4. Sequencing: the few things science fixes, and the freedom around them",
      "paragraphs": [
        "The clinic rules say there is no fixed sequence, and that is right: hydration can precede a peel on a dehydrated face to improve tolerance; drainage massage can come first when a client arrives puffy; a secondary corrective can sit late in the session when the surface is better prepared for it. The planner should design the order for the case and state why.",
        "Design the session freely around the user-selected clinical rules and the unchanged live corrective priorities. Mandatory drainage and finishing remain; no universal sequence is imposed."
      ],
      "tables": []
    },
    {
      "section": "4.1",
      "title": "4.1 Seven non-negotiables",
      "paragraphs": [],
      "tables": [
        {
          "columns": [
            "#",
            "Rule",
            "Mechanism (why it cannot be flexible)"
          ],
          "rows": [
            [
              "R1",
              "Extraction (and any high-frequency pass after it) precedes any full-face acid, laser or RF step; never after.",
              "Extraction creates micro-wounds. Acid or heat on open follicles drives inflammation and post-inflammatory hyperpigmentation; laser over unextracted comedones wastes energy on debris."
            ],
            [
              "R2",
              "Medium-class peels (SA30, Sali DS, Fusion-E, Glyco 35) never share a session with any Q-switch pass, including Carbon and a triggered lip pass. Lesion-only spot salicylic is an uncounted adjunct, not a full-face medium peel. If a superficial full-face peel precedes Carbon, complete protocol-appropriate neutralisation/removal and Ice Probe cooling before Carbon; use conservative Carbon settings. This does not apply a cooling requirement to spot salicylic.",
              "Both create epidermal injury; stacked, the depth is uncontrolled and the heat lands on acid-primed skin. On Fitzpatrick IV–VI this is the best-documented route to PIH. Same-day peel-plus-laser is reserved in the literature for lighter skin and superficial peels."
            ],
            [
              "R3",
              "One full-face medium-class peel per session.",
              "Two acid families on one face in one sitting produce unpredictable, uneven depth; the \"exceptionally justified\" clause in the constraints is for superficial layering, not medium stacking."
            ],
            [
              "R4",
              "Microdermabrasion never shares a session with a medium-class peel",
              "Mechanical removal of the stratum corneum removes the layer that limits acid penetration; depth becomes uncontrolled."
            ],
            [
              "R5",
              "HIFU is an assessed standalone corrective; do not stack it with another peel, abrasion, laser, extraction or corrective modality in that session. Mandatory drainage/finishing are not additional corrective modalities. MNRF, Dermapen/Dermaroller and needling are assessed standalone correctives. Their companions are PDRN/exosome delivery, cooling, red LED and finishing; the user-mandatory drainage remains, gently away from treated/lesion areas.",
              "Numbing time, 2–4 days of downtime, and open dermal channels: acids or carbon over needled skin deliver the chemical or heat into the dermis."
            ],
            [
              "R6",
              "Ice Probe cooling immediately follows energy steps, including Carbon, toning/lip and RF. Spot salicylic does not itself require a subsequent cooling step.",
              "Heat accumulation in the epidermis is the trigger for melanocyte activation; the clinic's own temperature policy exists for the same reason. Cooling is also the comfort step that makes the next step tolerable."
            ],
            [
              "R7",
              "The combined serum + moisturiser + sunscreen step is last.",
              "Constraints and clinic rules; nothing placed after it is protected."
            ]
          ]
        }
      ]
    },
    {
      "section": "4.2",
      "title": "4.2 Strong clinical advice (the planner may override with a stated reason)",
      "paragraphs": [
        "Actives infused onto freshly exfoliated skin absorb better; infusing before a peel wastes most of the active. Exception worth making: HA or PDRN pre-conditioning on barrier-caution skin before a superficial peel.",
        "Vitamin C stings on skin that is pink after a medium peel or Carbon; HA, PDRN or TRX are kinder on those days and Vitamin C moves to home care.",
        "Lymphatic drainage remains mandatory for 5-10 minutes in every facial. Adapt pressure and pathways to reactive or recently treated regions without creating an omission option.",
        "When the arrival temperature is in the caution band, cooling early in the session (before the corrective) is a legitimate design choice, not padding.",
        "Zone-splitting is encouraged: T-zone salicylic or Carbon with cheek hydration; lesion zones spot-treated; melasma zones kept away from heat while the rest of the face is lasered conservatively.",
        "Carbon before RF rather than after is usually right (RF warms the dermis; laser on warmed skin raises surface temperature), but a case can be argued either way; R6 cooling applies after each."
      ],
      "tables": []
    },
    {
      "section": "5",
      "title": "5. Pairs that must never share a session (restating the non-negotiables as a lookup)",
      "paragraphs": [
        "Everything else is compatible, subject to the constraints' own exclusions, the planner's reasoning, and the clinic's timing rules. PEEL.SPOT.SALI is compatible with every corrective (spot salicylic does not itself require subsequent cooling; the next step and order are case-specific). LED, cooling, spray, masks, under-eye infusion, facial infusion and finish are compatible with everything.",
        "Microdermabrasion and Q-switch, including Carbon Facial, may be combined. There is no pairing-specific prohibition; existing patient-specific exclusions, the stated incompatible pairs and timing rules still apply."
      ],
      "tables": [
        {
          "columns": [
            "Pair",
            "Rule"
          ],
          "rows": [
            [
              "Any medium-class peel + ENERGY.CARBON or ENERGY.QS.TONING",
              "R2"
            ],
            [
              "Any medium-class peel + another full-face medium-class peel",
              "R3"
            ],
            [
              "EXFO.MICRO.* + any medium-class peel",
              "R4"
            ],
            [
              "ENERGY.HIFU + any peel, abrasion, laser, extraction",
              "R5; mandatory drainage/finish are retained and do not count as added corrective modalities"
            ],
            [
              "ENERGY.MNRF / NEEDLE.* + any peel, abrasion, laser, extraction",
              "R5; mandatory drainage/finish are retained, with gentle untreated/non-lesion pathways"
            ],
            [
              "EXTR.MANUAL after any acid, laser or RF step",
              "R1"
            ],
            [
              "ENERGY.CARBON + ENERGY.QS.TONING in one session",
              "Redundant (same device, same mechanism); not a safety rule, a non-redundancy rule"
            ]
          ]
        }
      ]
    },
    {
      "section": "6",
      "title": "6. Combination playbook (worked reasoning, not recipes)",
      "paragraphs": [
        "Each entry shows how a dermatologist would think about a multi-concern face at this clinic. The planner should reproduce the reasoning, not the list."
      ],
      "tables": [
        {
          "columns": [
            "Concern combination",
            "Reasoning",
            "Likely shape (illustrative, not fixed)"
          ],
          "rows": [
            [
              "Active acne + PIH, FP IV–VI",
              "The peel that treats both without high glycolic on inflamed darker skin is Combination; spot salicylic handles lesions; TRX infusion addresses the pigment side; blue then red LED calms bacterial and inflammatory load. Carbon is a valid alternative hero when lesions are mostly comedonal. It may also complement Combination when it adds distinct correction and the existing constraints allow; the superficial-peel sequencing condition in R2 applies. Any active-lesion restriction is local to the lesion itself; correctives remain available on uninvolved zones. Mandatory drainage is included.",
              "Cleanse · vortex SA2 · extract comedones · HF · spot sali · Combination · cool · blue/red · TRX + HA · calming mask · mandatory drainage (flexible placement before finish) · finish"
            ],
            [
              "Oily, congested pores + tan/dullness",
              "Carbon answers oil, pores and tan at once; a superficial brightening peel before it is allowed (R2 exception) when tone is a stated goal; TRX or Vit C after; brighten mask.",
              "Cleanse · vortex SA2 · extract · HF · Whitening · neutralise · cool · Carbon (3+4) · cool · red · TRX + HA · brighten mask · mandatory drainage (flexible placement before finish) · finish"
            ],
            [
              "Dehydrated + sensitive + dull (winter)",
              "Hydration is the corrective here, not support; the only exfoliation the barrier tolerates is enzyme; PDRN and red LED for the barrier; hydrate mask; drainage massage is mandatory, with extra de-puffing value when the face is puffy.",
              "Cleanse · spatula · Pumpkin · red · HA + PDRN · eye HA · hydrate mask · spray · mandatory drainage (flexible placement before finish) · finish"
            ],
            [
              "Oily + dehydrated (Jaipur summer type)",
              "Zone the face: salicylic or Carbon on the T-zone, HA everywhere, hydrate mask; cooling early if the arrival temperature is high.",
              "Zoned throughout · mandatory drainage (flexible placement before finish)"
            ],
            [
              "Melasma-pattern + redness",
              "Use TRX and calming care for melasma with redness. Select Whitening when peel tolerance and exclusions permit. Select low-fluence toning when the case history and clinical assessment support an advantage over alternatives; sun-rule clearance alone is insufficient. Review prior response, pigment stability, irritation and PIH risk. No RF.",
              "Cleanse · vortex · selected toning or tolerated Whitening when indicated · cool · red · TRX + PDRN · calming · cool · mandatory drainage (flexible placement before finish) · finish"
            ],
            [
              "Texture roughness + dehydration lines",
              "Glyco 35 resurfaces; RF after cooling adds firmness and diffusion if temperature allows; HA and hydrate mask restore what the acid took.",
              "Cleanse · spatula · Glyco 35 · cool · RF.LIFT · HA · hydrate mask · mandatory drainage (flexible placement before finish) · finish"
            ],
            [
              "Early laxity + dullness, pre-event",
              "Party for glow, RF for firmness, Lifting infusion and Lift mask for the event-day feel; massage is clinical here (contour), not filler.",
              "Cleanse · vortex · Party · RF.LIFT · LIFT + HA · eye HA · lift mask · spray · massage · finish"
            ],
            [
              "Jawline sagging 30–60 + pigment",
              "Two sessions: HIFU alone (R5), pigment session two or more weeks later.",
              "Sequential, never stacked · mandatory drainage (flexible placement before finish)"
            ],
            [
              "Comedonal teen acne",
              "Teen probe or SA20, extraction, HF, blue LED, charcoal mask; no medium peels.",
              "Cleanse · teen probe · extract · HF · SA20 · cool · blue · HA · charcoal · mandatory drainage (flexible placement before finish) · finish"
            ],
            [
              "Barrier breakdown (BSI > 0.75) with anything else",
              "Use the current live BSI/history/numeric/temperature gates and choose permitted care for the current visit. No additional barrier-only or BSI<0.55 return-to-correction rule.",
              "PDRN + HA · red · cool · calming · mandatory drainage (flexible placement before finish) · finish"
            ],
            [
              "Puffy, sallow, post-travel",
              "Cooling and drainage first (a legitimate inversion of the usual order), then a glow peel, HA + Vit C, hydrate mask.",
              "Cool · massage (clinical) · cleanse · vortex · Party · HA + VITC · eye · mask · finish"
            ]
          ]
        }
      ]
    },
    {
      "section": "7",
      "title": "7. Expected single-session deltas (for realistic `target_single_session_score`)",
      "paragraphs": [
        "Points on the 1-100 scale in the parameter's own polarity, for an appropriately chosen hero on average Indian skin. These are realism references, not guaranteed gains or permission to overwrite supplied scores/targets; no automatic halving applies."
      ],
      "tables": [
        {
          "columns": [
            "Parameter",
            "Typical one-session change",
            "Moves",
            "Does not move in one session"
          ],
          "rows": [
            [
              "Barrier + Sensitivity",
              "−5 to −15",
              "Erythema, hydration signal",
              "Flaking, uniformity"
            ],
            [
              "Visual Acne",
              "−8 to −20 inflammatory; −5 to −12 comedonal",
              "Inflammation, BIBI, comedone count after extraction",
              "Nodules, chronicity"
            ],
            [
              "Sebum",
              "−10 to −25 toward balance",
              "Shine, congestion",
              "Baseline production"
            ],
            [
              "Redness",
              "−10 to −25 diffuse",
              "Diffuse erythema, hotspots",
              "Vascular prominence"
            ],
            [
              "Hydration",
              "+10 to +25",
              "Reflectance, micro-lines, diffusion",
              "Sebum-deficiency component"
            ],
            [
              "Luminosity",
              "+15 to +30",
              "Surface-level glow",
              "Shadow/contour component"
            ],
            [
              "Pigmentation",
              "−5 to −15 superficial; −3 to −8 melasma/deep",
              "Intensity, contrast",
              "Coverage, deep component"
            ],
            [
              "Peri-orbital",
              "−3 to −10",
              "Pigment, texture, puffiness",
              "Hollows, vascular"
            ],
            [
              "Lip pigmentation",
              "−2 to −6 with the lip add-on",
              "Surface darkness",
              "Intrinsic melanin (course)"
            ],
            [
              "Texture & Pores",
              "−8 to −18 congestion; −3 to −8 structural",
              "Clarity, blackheads, roughness",
              "Pore diameter, scars"
            ],
            [
              "Wrinkles",
              "−10 to −20 dehydration; 0 to −5 structural",
              "Micro-lines",
              "Depth, chronicity"
            ],
            [
              "Jawline",
              "−2 to −6",
              "Drainage, RF contraction",
              "Structural descent"
            ],
            [
              "Firmness",
              "−3 to −8",
              "Micro-laxity, reflectance",
              "Collagen density"
            ],
            [
              "Textural Radiance",
              "−10 to −25",
              "Clarity, smoothness, keratin film",
              "—"
            ]
          ]
        }
      ]
    },
    {
      "section": "8",
      "title": "8. Jaipur and population-specific modifiers",
      "paragraphs": [
        "Sun: half the year at UV index 10–11; most clients trip the sun rules April–October unless they say otherwise. Corrective pigment work is easier October–March; glow and hydration flows in summer.",
        "Heat: the 36.9 °C rule triggers often in afternoon summer slots; early cooling and shorter exfoliation keep sessions viable.",
        "Dust and hard water: barrier scores run lower than history suggests; keratin congestion is common; EXFO.SPATULA earns its place.",
        "Monsoon: porphyrin load and fungal folliculitis rise; blue LED and salicylic flows peak; avoid occlusive masks on sweaty skin.",
        "Fitzpatrick IV–V majority: PIH is the dominant complication; this is why R2–R4 exist and why Combination outranks glycolic-heavy peels on acne-plus-pigment faces.",
        "Wedding season: the event rule triggers constantly; glow-only designs (Party/Pumpkin, HA/Vit C, brighten mask, spray) are the week-of answer.",
        "Men: thicker, oilier skin tolerates SA30/Carbon well; beard-zone folliculitis wants HF and the after-shave serum; no charcoal mask over beard.",
        "Teens: SA20, extraction, blue LED; no medium peels.",
        "PCOD / thyroid / diabetes: retain the existing live condition-specific improvement outlook. The live JSON has no dedicated referral field; do not add one or require an extra referral note."
      ],
      "tables": []
    }
  ]
}

export const TREATMENT_KNOWLEDGE_PROMPT = `MOTHER DOCUMENT REFERENCE KNOWLEDGE
${JSON.stringify({steps: Object.values(TREATMENT_STEPS).map(({id, name, clinic_step_type, clinic_class, mechanism, burden, strengths, actives, reference_minutes, notes}) => ({id, name, clinic_step_type, clinic_class, mechanism, burden, strengths, actives, reference_minutes, notes})), ...TREATMENT_KNOWLEDGE})}`

// Keep the complete ratified source above. This is a non-destructive request
// projection: compact stable tables, plus full maps for every supplied concern.
export function compileTreatmentKnowledgeReference(plannerInput = {}) {
  const { concern_maps, ...globalReference } = TREATMENT_KNOWLEDGE
  delete globalReference.combination_reasoning_examples
  const columns = ['id', 'name', 'clinic_step_type', 'clinic_class', 'mechanism', 'burden',
    'strengths', 'actives', 'reference_minutes', 'notes']
  const global = {
    ...globalReference,
    live_mother_reference: { ...LIVE_MOTHER_REFERENCE, sections: LIVE_MOTHER_REFERENCE.sections.filter((_, index) => index < 10 || index > 24) },
    live_amendment_authority: 'The adopted live amendment and selected rules supersede older advisory wording. Preserve original strength ratings, score targets and the v5.6 generation contract.',
    atomic_steps: { columns, rows: Object.values(TREATMENT_STEPS).map((step) => columns.map((name) => step[name] ?? null)) },
    concern_map_index: concern_maps.map((map, index) => [index, map.concern]),
    reference_scope: 'Use the case maps for supplied concerns, including secondary concerns. This table is reference, not an audit checklist. The complete source retains worked examples; recipes are not required model input. Applicable constraints and dose/sequence protocols remain binding.',
  }
  const indices = new Set()
  let unknown = false
  const report = plannerInput.diagnosis_report || {}
  for (const [key, row] of Object.entries(report)) {
    const family = treatmentConcernFamily(row?.parameter_name ?? row?.parameter, key)
    if (family) indices.add(family.mother_map_index)
    else unknown = true
  }
  for (const name of plannerInput.planning_contract?.allowed_concern_names || []) {
    const family = treatmentConcernFamily(name)
    if (family) indices.add(family.mother_map_index)
    else unknown = true
  }
  // Preserve all guidance when an unfamiliar adapter name cannot be mapped.
  if (unknown || !indices.size) concern_maps.forEach((_, index) => indices.add(index))
  return {
    stable_prefix: `MOTHER DOCUMENT REFERENCE KNOWLEDGE — STABLE TABLES\n${JSON.stringify(global)}`,
    case_reference: { mother_document_version: TREATMENT_KNOWLEDGE.mother_document_version,
      concern_maps: [...indices].sort((a, b) => a - b).map((index) => ({ index, ...concern_maps[index] })),
      live_mother_sections: [...indices].sort((a, b) => a - b).map((index) => LIVE_MOTHER_REFERENCE.sections[index + 10]),
      scope: 'Complete source maps for all supplied concerns; not limited to selected primaries, low scores or high-confidence rows. The unchanged 0-5 strengths are retained. Select relevant contenders once; do not assess every row.' },
  }
}
