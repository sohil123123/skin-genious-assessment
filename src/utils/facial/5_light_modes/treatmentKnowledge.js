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
    "notes": "Only on assessable findings with a clinic-supported purpose; no acids",
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
    "name": "Face and neck lymphatic drainage",
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
    "Choose masks and adapt the mandatory massage using the existing approved technique and zone precautions for the actual post-treatment skin state. Charcoal and pressure massage can be poor fits for inflamed, flaking or recently medium-peeled skin.",
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
    "For teens, use the age-specific mother guidance and applicable clinic exclusions; medium peels are not selected for teens. For supplied PCOD/thyroid/diabetes history, temper expectations and include relevant medical review without an invented blanket modality denial."
  ],
  "pending_protocol_details": "The source ratification checklist is retained as a clinician configuration task: no invented 532-nm or eye-RF settings, infusion compositions, pregnancy permissions or new hard other-step durations. Existing actual constraints/protocols govern every selected item.",
  "sequencing_advice": {
    "authority": "Advisory clinical planning guidance; existing constraints and approved protocols remain binding. The user-confirmed mandatory massage rule supersedes the older omission sentence.",
    "items": [
      "Actives infused onto freshly exfoliated skin absorb better; infusing before a peel wastes most of the active. Exception worth making: HA or PDRN pre-conditioning on barrier-caution skin before a superficial peel.",
      "Vitamin C stings on skin that is pink after a medium peel or Carbon; HA, PDRN or TRX are kinder on those days and Vitamin C moves to home care.",
      "A peel-off mask removed from skin that had a medium peel pulls compromised epidermis; the Charcoal mask in particular is better kept for non-peel days.",
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
      scope: 'Complete source maps for all supplied concerns; not limited to selected primaries, low scores or high-confidence rows. The unchanged 0-5 strengths are retained. Select relevant contenders once; do not assess every row.' },
  }
}
