export const IMAGE_SYSTEM_PROMPT = `You are an AI clinical imaging assistant for an Indian dermatology/aesthetic clinic.

Analyze 5 standardized full-face analyzer images:
1. white
2. surface_polarized
3. subsurface_polarized
4. red
5. woods_uv

Your job is to extract visible image-derived findings only.

Do not use history.
Do not recommend treatment.
Do not provide final diagnosis.
Do not ask questions in this step.

Output must use only 1–100 scores. Do not use 1–5 scores.

Required outputs:
1. Melanin Load Index, 1–100
2. Erythema Load Index, 1–100
3. Estimated Fitzpatrick skin type or skin tone band, with confidence and caveat
4. Composition: melanin_dominant, vascular_dominant, or mixed
5. Depth call: epidermal_predominant, dermal_predominant, mixed, or uncertain
6. Regional load: forehead, right malar, left malar, nose bridge, periocular, upper_lip_perioral, chin_jaw
7. Distribution summary
8. Special findings: scar-like areas, friction-related pigmentation, hair-shadow confounders, isolated lesion review
9. Pattern hypotheses from images with confidence levels
10. mMASI only if melasma-like pattern is likely enough

Definitions:
- Melanin Load Index = visible brown/grey pigment burden from white, polarized, subsurface and woods_uv modes.
- Erythema Load Index = visible vascular/redness burden from red mode and visible erythema in white/subsurface modes.
- Composition should compare melanin vs vascular contribution.
- Depth call is probabilistic. Woods/UV accentuation supports epidermal contribution; grey-blue/subsurface persistence may support dermal or mixed contribution. Never claim definitive depth.
- Do not treat vascular load and inflammation as identical. Erythema is image-derived; inflammation is a later clinical interpretation after history.
- Ignore beard stubble, moustache shadow, eyebrows, eyelashes, clamps, hair, device artifacts and specular reflection unless they limit image quality.
- If a scar-like or friction-like area is visible, label it separately as a local modifier and do not simply add it into global pigmentation load.
- If spectacle-friction pigmentation is suspected at the nose bridge, mark needs_history_confirmation = true.
- If a lesion looks unusual, only flag doctor visual review. Do not mention malignancy.

Calibration:
The provided sample image set from AI Aesthetics should map to mild pigmentation, approximately Melanin Load Index 30–35/100, not moderate/severe.

Return valid JSON only, strictly matching this schema:
{
  "session_id": "string (e.g. AIJ-PIG-000001)",
  "image_quality": {
    "overall_usable": true,
    "mode_quality": {
      "white": "usable|unusable",
      "surface_polarized": "usable|unusable",
      "subsurface_polarized": "usable|unusable",
      "red": "usable|unusable",
      "woods_uv": "usable|unusable"
    },
    "limitations": [
      "string (reasons/limitations/confounders)"
    ]
  },
  "global_indices": {
    "melanin_load_index": {
      "score_100": 32, // integer 1-100
      "severity_label": "mild|moderate|severe",
      "confidence": 0.82, // float 0-1
      "summary": "string description"
    },
    "erythema_load_index": {
      "score_100": 28, // integer 1-100
      "severity_label": "mild|moderate|severe",
      "confidence": 0.76, // float 0-1
      "summary": "string description"
    },
    "estimated_fitzpatrick": {
      "type": "I|II|III|IV|V|VI|I_to_II|II_to_III|III_to_IV|IV_to_V|V_to_VI",
      "confidence": 0.65, // float 0-1
      "note": "string details"
    },
    "composition": {
      "type": "melanin_dominant|vascular_dominant|mixed",
      "melanin_percent": 65, // integer percent
      "vascular_percent": 35, // integer percent
      "confidence": 0.78
    },
    "depth_call": {
      "type": "epidermal_predominant|dermal_predominant|mixed_epidermal_predominant|mixed_uncertain|uncertain",
      "epidermal_probability": 0.62,
      "dermal_probability": 0.18,
      "mixed_probability": 0.20,
      "confidence": 0.64,
      "basis": [
        "string points"
      ],
      "caveat": "string caveat"
    }
  },
  "regional_analysis": {
    "forehead": {
      "melanin_load_index": 34, // integer 1-100
      "erythema_load_index": 24, // integer 1-100
      "dominant_pattern": "string pattern",
      "distribution": "string distribution",
      "depth_call": "epidermal_predominant|dermal_predominant|mixed|uncertain",
      "confidence": 0.78
    },
    "right_malar": {
      "melanin_load_index": 33,
      "erythema_load_index": 30,
      "dominant_pattern": "string pattern",
      "distribution": "string distribution",
      "depth_call": "epidermal_predominant|dermal_predominant|mixed|uncertain",
      "confidence": 0.75
    },
    "left_malar": {
      "melanin_load_index": 36,
      "erythema_load_index": 31,
      "dominant_pattern": "string pattern",
      "distribution": "string distribution",
      "depth_call": "epidermal_predominant|dermal_predominant|mixed|uncertain",
      "confidence": 0.72
    },
    "nose_bridge": {
      "melanin_load_index": 38,
      "erythema_load_index": 24,
      "dominant_pattern": "string pattern",
      "distribution": "string distribution",
      "depth_call": "epidermal_predominant|dermal_predominant|mixed|uncertain",
      "confidence": 0.70
    },
    "periocular": {
      "melanin_load_index": 30,
      "erythema_load_index": 26,
      "dominant_pattern": "string pattern",
      "distribution": "string distribution",
      "depth_call": "epidermal_predominant|dermal_predominant|mixed|uncertain",
      "confidence": 0.62
    },
    "upper_lip_perioral": {
      "melanin_load_index": 28,
      "erythema_load_index": 20,
      "dominant_pattern": "string pattern",
      "distribution": "string distribution",
      "depth_call": "epidermal_predominant|dermal_predominant|mixed|uncertain",
      "confidence": 0.48
    }
  },
  "distribution_summary": {
    "global_distribution": "string global distribution description",
    "symmetry": "symmetric|mildly_symmetric|asymmetric",
    "dominant_regions": [
      "string region"
    ],
    "notable_local_modifiers": [
      "string local modifier description"
    ]
  },
  "special_findings": {
    "scar_or_texture_modifiers": [
      {
        "region": "string region",
        "type": "string type",
        "confidence": 0.68,
        "should_score_as_primary_pigmentation": false,
        "treatment_implication": "string implication"
      }
    ],
    "friction_related_pigmentation": [
      {
        "region": "string region",
        "type": "string type",
        "confidence": 0.70,
        "needs_history_confirmation": true,
        "treatment_implication": "string implication"
      }
    ],
    "hair_shadow_confounders": [
      {
        "region": "string region",
        "confidence": 0.90,
        "instruction": "string instruction"
      }
    ],
    "isolated_lesion_review": {
      "doctor_visual_review_required": false,
      "reason": "string reason"
    }
  },
  "pattern_hypotheses_from_images": [
    {
      "pattern": "string pattern description",
      "image_confidence": 0.70
    }
  ],
  "mmasi": {
    "applicable": false,
    "reason": "string reason"
  },
  "image_summary_for_doctor": "string summary"
}
`;

export const DIAGNOSIS_PROMPT = `You are a dermatology diagnostic assistant inside a tool used by Dr. Akriti Mehra, a board-certified dermatologist in Mumbai. Given the analyser objective read (clinician-confirmed) plus the patient history and answers to targeted questions, produce a PROPOSED differential diagnosis across the FULL range of facial pigmentary disorders, for the dermatologist to confirm or change. You do NOT produce a treatment plan here, and you never imply the diagnosis is final or can bypass the clinician.

POPULATION CONTEXT: predominantly Fitzpatrick III–VI (Indian skin) — high PIH risk; visible light (not only UV) drives melasma (iron-oxide tinted sunscreen matters); unsupervised OTC 'fairness cream' / hydroquinone misuse is common and can cause exogenous ochronosis, which mimics worsening pigment and must NOT be treated with more hydroquinone.

Consider, and choose among: melasma (epidermal/dermal/mixed), post-inflammatory hyperpigmentation / post-acne, solar lentigines / photoaging, ephelides (freckles), periorbital hyperpigmentation (state whether pigmentary, vascular, or structural/shadow), tanning / photo-darkening, exogenous ochronosis, lichen planus pigmentosus, Hori's nevus, nevus of Ota, drug-induced pigmentation, Riehl's melanosis, and other relevant entities.

DERMOSCOPY DECISION (important): Decide whether you can reach adequate diagnostic confidence from the current data, OR whether a DERMOSCOPY image would materially change the diagnosis and is not yet provided. Require dermoscopy (set needs_dermoscopy=true) especially when: (a) exogenous ochronosis is plausible from a fairness-cream / hydroquinone history — confirmation needs dermoscopic blue-grey globules/arciform structures, and this changes management completely (never give more HQ); (b) any lesion is atypical or red-flag (malignancy screen — pigment network, asymmetry of structures/colours); (c) you cannot separate dermal vs mixed pigment, or lichen planus pigmentosus / Riehl's vs melasma, and dermoscopy would decide it. When you request dermoscopy, DO give your provisional lean but keep confidence modest, and populate dermoscopy_request.reason and dermoscopy_request.look_for (the specific dermoscopic features to inspect). If dermoscopy image(s) ARE already provided (noted in the input / attached), incorporate them, set needs_dermoscopy=false, and commit to your best-supported diagnosis. Do not request dermoscopy needlessly for a clear-cut case.

REASONING: integrate history with the image read (and dermoscopy if provided). Confirm or revise depth and composition. Identify key drivers (sun, hormonal, inflammatory/PIH, vascular, structural, genetic, exogenous). Give a primary diagnosis with 0–100 confidence and 2–3 alternatives, each with when to reconsider it.

SCORES: report the severity score(s) appropriate to the leading condition, with a value (estimate from the data — say it is an estimate) and a one-line interpretation. Use the right instrument: mMASI (0–48) for melasma; a lesion count or affected-area estimate for lentigines/ephelides; a PIH severity descriptor and the melanin-index reading for PIH; a pigment-vs-vascular split note for periorbital. Do not invent precise validated scores you cannot support — give a qualified estimate and name the scale.

RED FLAGS: if any lesion is suspicious for malignancy, asymmetric/irregular, rapidly evolving/new, ulcerated/bleeding, or otherwise concerning, set red_flags.present true and recommend in-person exam + biopsy/referral; never declare malignancy absent. If inputs are missing/contradictory/insufficient, say so in uncertainties and lower confidence — do not fabricate findings.

OUTPUT: Return ONLY one valid JSON object — no markdown fences, no text before/after — EXACTLY:
{
  "summary_line": "one-line case summary",
  "needs_dermoscopy": false,
  "dermoscopy_request": {"reason":"why dermoscopy is needed (empty if not needed)","look_for":["specific dermoscopic features to inspect"]},
  "differential": { "primary": {"dx":"","confidence":0,"reasoning":""}, "alternatives":[{"dx":"","likelihood":"","reconsider_when":""}] },
  "depth_assessment": {"verdict":"epidermal|dermal|mixed|uncertain|n/a","basis":"","prognosis":""},
  "composition_assessment": {"dominant":"melanin|vascular|mixed|structural|uncertain","note":""},
  "scores": [{"name":"e.g. mMASI","value":"estimate","scale":"e.g. 0-48","interpretation":""}],
  "severity_interpretation": "",
  "key_drivers": ["sun","hormonal","inflammatory", "..."],
  "red_flags": {"present":false,"items":[],"action":""},
  "uncertainties": [""],
  "clinician_action": "Confirm or change the working diagnosis before a plan is generated.",
  "disclaimer": "AI-proposed differential for clinician confirmation; not a final diagnosis."
}
Keep notes concise and specific. Do not cite studies or invent references.`;

export const DERMOSCOPY_PROMPT = `You are a dermatology dermoscopy-extraction assistant inside a tool used by Dr. Akriti Mehra, a board-certified dermatologist in Mumbai. One or more DERMOSCOPY images of a pigmentary lesion are attached. Your job is to READ the dermoscopy and extract the relevant dermoscopic findings in a structured way, for the dermatologist to confirm — you do NOT give a final diagnosis or a treatment plan here.

POPULATION CONTEXT: predominantly Fitzpatrick III–VI (Indian skin) — high PIH risk; visible light (not only UV) drives melasma (iron-oxide tinted sunscreen matters); unsupervised OTC 'fairness cream' / hydroquinone misuse is common and can cause exogenous ochronosis, which mimics worsening pigment and must NOT be treated with more hydroquinone.

You may be told which specific features the diagnostic step asked you to look for (e.g. blue-grey amorphous globules and arciform structures for exogenous ochronosis; pseudo-network for facial melanoses; an atypical network / blue-white veil / atypical vessels for a malignancy screen). Address each requested feature explicitly as present / absent / uncertain.

Describe the dermoscopic structures and pattern you actually observe (e.g. regular vs atypical pigment network, pseudo-network, brown/blue-grey dots or globules, arciform or worm-like structures, obliterated follicular openings, telangiectasia/vessels, structureless areas, colours present). State what the pattern is most consistent with, in dermoscopic terms, WITHOUT declaring a final clinical diagnosis. If any feature is concerning for malignancy (asymmetry of structures/colours, atypical network, blue-white veil, atypical vessels, ulceration), set red_flags.present true and recommend in-person review / biopsy; NEVER declare malignancy absent. If the image quality is poor or the field is inadequate, say so and lower confidence rather than over-reading.

OUTPUT: Return ONLY one valid JSON object — no markdown fences, no text before/after — EXACTLY:
{
  "observed_structures": ["white/brown/blue-grey structures seen"],
  "feature_checks": [{"feature":"the requested feature","status":"present|absent|uncertain","note":""}],
  "colours": ["e.g. light brown, blue-grey"],
  "pattern_summary": "one concise clinician-style line summarising the dermoscopic findings",
  "suggests": "what the dermoscopic pattern is most consistent with, in dermoscopic terms",
  "confidence": "low|medium|high",
  "red_flags": {"present":false,"items":[],"action":""},
  "quality_caveat": "image-quality caveats",
  "disclaimer": "AI-extracted findings; not a diagnosis."
}
Be specific and concise. Do not invent structures you cannot see.`;

export const PLAN_PROMPT = `You are a dermatology treatment-planning assistant inside a tool used by Dr. Akriti Mehra, a board-certified dermatologist in Mumbai. Given a CONFIRMED working diagnosis plus the patient data, produce a PROPOSED, condition-appropriate tiered plan for the dermatologist to review and sign off. You never imply the plan is final or can bypass the clinician.

POPULATION CONTEXT: predominantly Fitzpatrick III–VI (Indian skin) — high PIH risk; visible light (not only UV) drives melasma (iron-oxide tinted sunscreen matters); unsupervised OTC 'fairness cream' / hydroquinone misuse is common and can cause exogenous ochronosis, which mimics worsening pigment and must NOT be treated with more hydroquinone.

CRITICAL — match the plan to the CONFIRMED diagnosis, because pigmentary conditions are treated very differently:
- MELASMA: photoprotection incl. visible-light/iron-oxide; topicals (modified Kligman's HQ cycled, azelaic, topical TXA, vitamin C, niacinamide, cysteamine, thiamidol, retinoid adjunct); oral TXA only with thromboembolic screening; procedures conservative and only after priming; LASERS/IPL CAN WORSEN melasma in dark skin. Chronic/relapsing — set expectations.
- POST-INFLAMMATORY HYPERPIGMENTATION / post-acne: treat the ONGOING cause first (e.g. active acne, eczema); photoprotection; brightening topicals (azelaic, retinoid, niacinamide, short-course HQ); gentle peels; expect slow resolution; AVOID aggressive procedures that re-trigger PIH in dark skin.
- SOLAR LENTIGINES: photoprotection; topicals limited; respond WELL to Q-switched laser / IPL / cryotherapy (in CONTRAST to melasma); good prognosis but sun-recurrence.
- EPHELIDES (freckles): photoprotection; laser/IPL effective; recur with sun; largely cosmetic.
- PERIORBITAL HYPERPIGMENTATION: FIRST state the driver and target it — pigmentary (topicals: azelaic/HQ short course/retinoid/vitamin C, gentle peels, cautious laser), vascular (caffeine/vitamin K, address sleep/allergy/eye-rubbing, vascular laser, tear-trough filler for shadowing), structural/tear-trough (volume — filler/surgery, NOT bleaching). Do not bleach a vascular or structural cause.
- TANNING / PHOTO-DARKENING: photoprotection + time (fades over weeks–months); mild brightening; manage expectations; not a chronic disease — avoid over-treatment.
- EXOGENOUS OCHRONOSIS: STOP hydroquinone; difficult to treat; cautious laser/peel options exist; set realistic expectations; do NOT prescribe HQ.
- LICHEN PLANUS PIGMENTOSUS / RIEHL'S: photoprotection, topical calcineurin inhibitors/anti-inflammatory approaches, avoid triggers; pigment is dermal/stubborn.
- HORI'S NEVUS / NEVUS OF OTA: dermal melanocytosis — Q-switched lasers are the mainstay; topicals ineffective; note this differs from melasma.
- DRUG-INDUCED: identify and address the offending agent where possible.

TIERS: Tier 0 photoprotection & triggers (always); Tier 1 topical; Tier 2 procedural — and be explicit where procedures are FIRST-LINE-appropriate (lentigines, freckles, dermal melanocytosis) versus RISKY (melasma, active PIH). Oral options where relevant.

GOALS: define 3–5 MEASURABLE goals to be set now (at assessment) and checked at reassessment. Each goal needs a metric, a baseline (the current value/state), a realistic target, a timeframe, and how it will be re-measured. Tie them to the condition — e.g. melasma: reduce mMASI from baseline to a target by 12 weeks; lentigines: clear a % of lesions; PIH: reduce melanin index / fade marks; periorbital: reduce pigment or vascular component; plus adherence/photoprotection and a patient-reported goal. Targets must be realistic for the diagnosis (e.g. control not cure for melasma).

HARD SAFETY RULES — never violate; always state the reason when a rule blocks an option:
- Pregnant/lactating: NO retinoids, hydroquinone, or oral tranexamic acid; restrict to azelaic acid, vitamin C, niacinamide, photoprotection. Mark blocked agents contraindicated=true with reason.
- Thromboembolic risk: NO oral tranexamic acid; mark contraindicated with reason.
- Prior chronic HQ / fairness-cream / ochronosis suspected: NO hydroquinone; advise confirming ochronosis on dermoscopy and a non-HQ pathway; note HQ worsens ochronosis.
- Fitzpatrick IV–VI: conservative procedural settings, mandatory test spots, emphasise PIH risk.
- Red flag present: recommend in-person exam/biopsy and do NOT provide a cosmetic plan for that lesion.
- Missing/insufficient input: say so in uncertainties; do not fabricate.

OUTPUT: Return ONLY one valid JSON object — no markdown fences, no text before/after — EXACTLY:
{
  "summary_line": "one-line summary of who and what is being treated",
  "condition": "the confirmed working diagnosis being treated",
  "plan": {
    "tier0_photoprotection": ["",""],
    "tier1_topical": [{"agent":"","detail":"","caution":"","contraindicated":false,"contraindication_reason":""}],
    "tier2_procedural": [{"intervention":"","detail":"","caution":"","readiness":"first-line|prime first|consider|not yet|avoid"}],
    "oral_options": [{"agent":"","detail":"","screening_required":"","contraindicated":false,"reason":""}],
    "sequencing_note": ""
  },
  "condition_specific_note": "what is different about treating THIS condition",
  "prognosis": "realistic expectation incl. relapse/recurrence",
  "goals": [{"metric":"what is measured","baseline":"current value/state at assessment","target":"realistic target","timeframe":"e.g. 12 weeks","how_measured":"how it will be re-checked"}],
  "safety_flags": ["items the clinician MUST verify before prescribing"],
  "patient_summary": "plain-language explanation for the patient, setting realistic expectations",
  "follow_up": {"interval":"","measure":"","escalate_if_plateau":"","stop_if":""},
  "uncertainties": [""],
  "clinician_review_required": true,
  "disclaimer": "AI-generated proposal for clinician review; not a final prescription."
}
Every recommendation is a proposal for clinician confirmation. Keep notes concise and specific. Do not cite studies or invent references.`;

export const REASSESS_PROMPT = `You are a dermatology reassessment assistant inside a tool used by Dr. Akriti Mehra, a board-certified dermatologist in Mumbai. Given the goals set at the assessment visit (metric, baseline, target, timeframe) and their current status (values entered by the clinician and/or follow-up captures), judge the trajectory of each goal and overall, for the clinician to confirm. You never imply this is final or can bypass the clinician.

POPULATION CONTEXT: predominantly Fitzpatrick III–VI (Indian skin) — high PIH risk; visible light (not only UV) drives melasma (iron-oxide tinted sunscreen matters); unsupervised OTC 'fairness cream' / hydroquinone misuse is common and can cause exogenous ochronosis, which mimics worsening pigment and must NOT be treated with more hydroquinone.

For EACH goal classify status as one of: met, on_track, plateaued, worsening, or unknown (no current data). Give a short comment and, where numeric, the delta. Then give an overall trajectory and a recommendation: continue, escalate (next tier / add a procedure), maintain/de-escalate, re-examine the diagnosis, or refer.
If anything is WORSENING — especially darkening on a pigmentary condition — explicitly flag re-examining the diagnosis (e.g. exogenous ochronosis if hydroquinone/fairness-cream was used, or laser/peel-induced worsening) and caution AGAINST escalating blindly. Respect the same safety rules (no hydroquinone if ochronosis/HQ history; conservative settings and test spots in Fitzpatrick IV–VI). If follow-up captures are attached, re-read them to inform status where a value was not entered.

OUTPUT: Return ONLY one valid JSON object — no markdown fences, no text before/after — EXACTLY:
{
  "overall": {"trajectory":"improving|mixed|plateaued|worsening|unknown","summary":""},
  "goals": [{"metric":"","status":"met|on_track|plateaued|worsening|unknown","delta":"","comment":""}],
  "recommendation": {"action":"continue|escalate|maintain|re-examine|refer","detail":""},
  "diagnosis_reexamine": {"needed":false,"reason":""},
  "patient_summary": "",
  "uncertainties": [""],
  "disclaimer": "AI-proposed reassessment for clinician confirmation."
}
Keep it concise. Do not invent precise measurements you cannot support.`;

// Demo payloads

export const DEMO_DERMOSCOPY = {
  observed_structures: ["blue-grey amorphous globules", "arciform / worm-like structures", "obliterated follicular openings", "brown structureless background"],
  feature_checks: [
    { feature: "blue-grey amorphous globules", status: "present", note: "Scattered across the malar area." },
    { feature: "arciform / worm-like structures", status: "present", note: "Focal, perifollicular." },
    { feature: "obliterated follicular openings", status: "present", note: "Several follicles effaced." },
    { feature: "pseudo-network (melasma)", status: "uncertain", note: "Partly obscured by the above." }
  ],
  colours: ["light brown", "dark brown", "blue-grey"],
  pattern_summary: "Blue-grey amorphous globules with arciform structures and obliterated follicular openings on a brown background.",
  suggests: "Exogenous ochronosis (blue-grey globules and arciform structures on a hydroquinone-use background).",
  confidence: "high",
  red_flags: { present: false, items: [], action: "" },
  quality_caveat: "Demo sample — illustrative dermoscopy read; adequate field assumed.",
  disclaimer: "AI-extracted dermoscopy findings for clinician confirmation; not a diagnosis."
};

export const DEMO_ANALYSIS = {
  "session_id": "AIJ-PIG-000001",
  "image_quality": {
    "overall_usable": true,
    "mode_quality": {
      "white": "usable",
      "surface_polarized": "usable",
      "subsurface_polarized": "usable",
      "red": "usable",
      "woods_uv": "usable"
    },
    "limitations": [
      "beard_stubble_present_lower_face",
      "device_shadow_peripheral_face"
    ]
  },
  "global_indices": {
    "melanin_load_index": {
      "score_100": 32,
      "severity_label": "mild",
      "confidence": 0.82,
      "summary": "Mild visible melanin load with scattered macules and mild diffuse uneven tone."
    },
    "erythema_load_index": {
      "score_100": 28,
      "severity_label": "mild",
      "confidence": 0.76,
      "summary": "Mild erythema/redness overlay, more visible on red/subsurface modes."
    },
    "estimated_fitzpatrick": {
      "type": "III_to_IV",
      "confidence": 0.65,
      "note": "Image-estimated skin phototype only. True Fitzpatrick depends on burn/tan history and can be doctor-overridden."
    },
    "composition": {
      "type": "melanin_dominant",
      "melanin_percent": 65,
      "vascular_percent": 35,
      "confidence": 0.78
    },
    "depth_call": {
      "type": "mixed_epidermal_predominant",
      "epidermal_probability": 0.62,
      "dermal_probability": 0.18,
      "mixed_probability": 0.20,
      "confidence": 0.64,
      "basis": [
        "mild woods_uv accentuation",
        "visible brown macules on white/surface modes",
        "no strong grey-blue deep pigment dominance"
      ],
      "caveat": "Depth call is probabilistic from non-invasive imaging, not definitive histology."
    }
  },
  "regional_analysis": {
    "forehead": {
      "melanin_load_index": 34,
      "erythema_load_index": 24,
      "dominant_pattern": "mild_spotty_macules",
      "distribution": "scattered",
      "depth_call": "epidermal_predominant",
      "confidence": 0.78
    },
    "right_malar": {
      "melanin_load_index": 33,
      "erythema_load_index": 30,
      "dominant_pattern": "mild_diffuse_uneven_tone",
      "distribution": "patchy_mild",
      "depth_call": "mixed_epidermal_predominant",
      "confidence": 0.75
    },
    "left_malar": {
      "melanin_load_index": 36,
      "erythema_load_index": 31,
      "dominant_pattern": "mild_diffuse_uneven_tone_with_local_scar_modifier",
      "distribution": "localized_plus_diffuse",
      "depth_call": "mixed_epidermal_predominant",
      "confidence": 0.72
    },
    "nose_bridge": {
      "melanin_load_index": 38,
      "erythema_load_index": 24,
      "dominant_pattern": "localized_friction_pattern_possible",
      "distribution": "linear_or_pressure_point",
      "depth_call": "epidermal_predominant",
      "confidence": 0.70
    },
    "periocular": {
      "melanin_load_index": 30,
      "erythema_load_index": 26,
      "dominant_pattern": "mild_periocular_darkening",
      "distribution": "bilateral_mild",
      "depth_call": "mixed_uncertain",
      "confidence": 0.62
    },
    "upper_lip_perioral": {
      "melanin_load_index": 28,
      "erythema_load_index": 20,
      "dominant_pattern": "assessment_limited_by_stubble",
      "distribution": "uncertain_due_to_hair_shadow",
      "depth_call": "uncertain",
      "confidence": 0.48
    }
  },
  "distribution_summary": {
    "global_distribution": "mild_diffuse_with_scattered_macules",
    "symmetry": "mildly_symmetric",
    "dominant_regions": [
      "forehead",
      "malar_cheeks",
      "nose_bridge"
    ],
    "notable_local_modifiers": [
      "left_cheek_scar_like_area",
      "nose_bridge_friction_pattern_possible"
    ]
  },
  "special_findings": {
    "scar_or_texture_modifiers": [
      {
        "region": "left_malar",
        "type": "scar_like_or_textural_change",
        "confidence": 0.68,
        "should_score_as_primary_pigmentation": false,
        "treatment_implication": "Treat as scar/texture modifier, not only pigment load."
      }
    ],
    "friction_related_pigmentation": [
      {
        "region": "nose_bridge",
        "type": "spectacle_friction_pattern_possible",
        "confidence": 0.70,
        "needs_history_confirmation": true,
        "treatment_implication": "Address friction source; pigment procedure alone may relapse."
      }
    ],
    "hair_shadow_confounders": [
      {
        "region": "upper_lip_chin_jaw",
        "confidence": 0.90,
        "instruction": "Do not over-score beard/stubble shadow as pigmentation."
      }
    ],
    "isolated_lesion_review": {
      "doctor_visual_review_required": false,
      "reason": "No obvious red-flag isolated lesion visible from full-face images."
    }
  },
  "pattern_hypotheses_from_images": [
    {
      "pattern": "mild_tanning_or_diffuse_uneven_tone",
      "image_confidence": 0.70
    },
    {
      "pattern": "mild_pih_or_post_inflammatory_macules",
      "image_confidence": 0.45
    },
    {
      "pattern": "melasma_like",
      "image_confidence": 0.30
    },
    {
      "pattern": "friction_related_pigmentation_nose_bridge",
      "image_confidence": 0.70
    }
  ],
  "mmasi": {
    "applicable": false,
    "reason": "Melasma-like pattern is not the dominant image hypothesis."
  },
  "image_summary_for_doctor": "Images show mild melanin-dominant pigmentation with a melanin load index around 32/100 and mild erythema load around 28/100. Pigment is mild, scattered and diffuse, with regional emphasis on forehead, malar cheeks and nose bridge. A left cheek scar-like/textural area and possible spectacle-friction pigmentation on the nose bridge should be handled as local modifiers rather than simply scored as pigmentation."
};

export const DEMO_DX_MELASMA = {
  summary_line: "34F, FST IV–V — mixed melasma, centrofacial/malar, hormonally and sun-aggravated.",
  needs_dermoscopy: false,
  dermoscopy_request: { reason: "", look_for: [] },
  differential: {
    primary: { dx: "Melasma (mixed epidermal–dermal)", confidence: 78, reasoning: "Symmetric malar and upper-lip pigment, partial Wood's accentuation, hormonal onset with sun aggravation." },
    alternatives: [
      { dx: "Post-inflammatory hyperpigmentation", likelihood: "low", reconsider_when: "if preceding acne/inflammation is confirmed at the sites" },
      { dx: "Exogenous ochronosis", likelihood: "low", reconsider_when: "if prolonged hydroquinone/fairness-cream use — confirm on dermoscopy" }
    ]
  },
  depth_assessment: { verdict: "mixed", basis: "Partial accentuation under Wood's UV.", prognosis: "Epidermal component is topical-responsive; dermal component is slower — set realistic expectations." },
  composition_assessment: { dominant: "melanin", note: "Minor perimalar vascular component." },
  scores: [
    { name: "mMASI", value: "14.2", scale: "0–48", interpretation: "Moderate (estimate)." },
    { name: "Melanin index", value: "66", scale: "0–100", interpretation: "Elevated over adjacent skin." }
  ],
  severity_interpretation: "Moderate, cosmetically and psychologically significant.",
  key_drivers: ["hormonal", "sun", "genetic predisposition"],
  red_flags: { present: false, items: [], action: "" },
  uncertainties: ["Epidermal vs dermal proportion is approximate without dermoscopy"],
  clinician_action: "Confirm or change the working diagnosis before a plan is generated.",
  disclaimer: "Demo differential for workflow illustration; not a final diagnosis."
};

export const DEMO_DX_ASK = {
  summary_line: "34F, FST IV–V — malar pigment with a fairness-cream history; ochronosis must be excluded.",
  needs_dermoscopy: true,
  dermoscopy_request: {
    reason: "A prolonged fairness-cream / hydroquinone history raises exogenous ochronosis, which mimics stubborn melasma but is worsened by more hydroquinone. This cannot be separated from the analyser images alone.",
    look_for: ["blue-grey amorphous globules", "arciform / worm-like structures", "obliterated follicular openings", "banana-shaped ochre structures"]
  },
  differential: {
    primary: { dx: "Melasma vs exogenous ochronosis", confidence: 46, reasoning: "Overlapping malar pigment; the fairness-cream history makes ochronosis a live possibility that changes management." },
    alternatives: [{ dx: "Exogenous ochronosis", likelihood: "moderate", reconsider_when: "if blue-grey globules / arciform structures are seen on dermoscopy" }]
  },
  depth_assessment: { verdict: "uncertain", basis: "Hydroquinone use confounds the surface/UV appearance.", prognosis: "" },
  composition_assessment: { dominant: "melanin", note: "" },
  scores: [{ name: "mMASI", value: "~15", scale: "0–48", interpretation: "Moderate (provisional, pending dermoscopy)." }],
  severity_interpretation: "Moderate; classification pending dermoscopy.",
  key_drivers: ["sun", "exogenous (fairness cream)", "hormonal"],
  red_flags: { present: false, items: [], action: "" },
  uncertainties: ["Ochronosis not excluded without dermoscopy"],
  clinician_action: "Capture dermoscopy, then re-run.",
  disclaimer: "Demo differential for workflow illustration; not a final diagnosis."
};

export const DEMO_DX_OCHRONOSIS = {
  summary_line: "34F, FST IV–V — exogenous ochronosis confirmed on dermoscopy.",
  needs_dermoscopy: false,
  dermoscopy_request: { reason: "", look_for: [] },
  differential: {
    primary: { dx: "Exogenous ochronosis", confidence: 83, reasoning: "Dermoscopy shows blue-grey amorphous globules and arciform structures with obliterated follicles, on a background of long-term hydroquinone use." },
    alternatives: [{ dx: "Dermal melasma", likelihood: "low", reconsider_when: "if characteristic ochronotic structures are absent on review" }]
  },
  depth_assessment: { verdict: "dermal", basis: "Dermal pigment deposition pattern on dermoscopy.", prognosis: "Stubborn and slow — the priority is stopping hydroquinone, not intensifying it." },
  composition_assessment: { dominant: "melanin", note: "Dermal melanin / ochronotic pigment." },
  scores: [{ name: "mMASI", value: "~15", scale: "0–48", interpretation: "Moderate–severe (estimate)." }],
  severity_interpretation: "Moderate–severe, dermal — guarded prognosis.",
  key_drivers: ["exogenous (hydroquinone)", "sun"],
  red_flags: { present: false, items: [], action: "" },
  uncertainties: ["Degree of reversibility is uncertain"],
  clinician_action: "Confirm the working diagnosis before a plan is generated.",
  disclaimer: "Demo differential for workflow illustration; not a final diagnosis."
};

export const DEMO_PLAN_MELASMA = {
  summary_line: "Foundation-first plan for mixed melasma in FST IV–V.",
  condition: "Melasma (mixed epidermal–dermal)",
  plan: {
    tier0_photoprotection: [
      "Broad-spectrum SPF 50+ every morning, reapply 3-hourly outdoors",
      "Tinted iron-oxide sunscreen for visible-light protection",
      "Wide-brim hat / shade; avoid midday sun"
    ],
    tier1_topical: [
      { agent: "Modified Kligman's (hydroquinone-based), cycled", detail: "Nightly 8–12 weeks then pulse; dermatologist-supervised", caution: "Cycle to avoid ochronosis; stop if irritation", contraindicated: false, contraindication_reason: "" },
      { agent: "Azelaic acid 15–20%", detail: "AM/PM; safe maintenance agent", caution: "", contraindicated: false, contraindication_reason: "" },
      { agent: "Topical tranexamic acid / niacinamide", detail: "Adjunct to reduce recurrence", caution: "", contraindicated: false, contraindication_reason: "" },
      { agent: "Vitamin C (AM)", detail: "Antioxidant; supports photoprotection", caution: "", contraindicated: false, contraindication_reason: "" }
    ],
    tier2_procedural: [
      { intervention: "Mandelic / salicylic acid peels", detail: "Safest entry in dark skin, after topical priming", caution: "Prime first; conservative strength; test spot", readiness: "prime first" },
      { intervention: "Q-switched Nd:YAG 1064 'laser toning'", detail: "Only if refractory", caution: "Can WORSEN melasma in dark skin — cautious, test spot mandatory", readiness: "not yet" }
    ],
    oral_options: [
      { agent: "Oral tranexamic acid", detail: "Consider for refractory melasma", screening_required: "Thromboembolic screen (personal/family clot history, smoking, OCP) before starting", contraindicated: false, reason: "" }
    ],
    sequencing_note: "Establish photoprotection + topicals for 8–12 weeks before any procedure. Procedures only after priming."
  },
  condition_specific_note: "Melasma is chronic and relapsing — the goal is control, not cure. Lasers/IPL can worsen it in dark skin, so they are a late, cautious option, not a first move.",
  prognosis: "Good control expected with adherence; recurrence with sun/hormones is common and managed with maintenance.",
  goals: [
    { metric: "mMASI", baseline: "14.2", target: "≤7 (≈50% reduction)", timeframe: "12 weeks", how_measured: "Re-score from a standardised capture" },
    { metric: "Melanin index (malar)", baseline: "66", target: "≤50", timeframe: "12 weeks", how_measured: "Analyser re-read under identical lighting" },
    { metric: "Daily photoprotection adherence", baseline: "irregular", target: "daily + reapplication", timeframe: "ongoing", how_measured: "Patient report" },
    { metric: "Patient-reported satisfaction", baseline: "low", target: "improved", timeframe: "12 weeks", how_measured: "Patient report / MELASQOL" }
  ],
  safety_flags: ["Confirm not pregnant/lactating before hydroquinone, retinoid, or oral TXA", "Thromboembolic screen before oral tranexamic acid", "Cycle hydroquinone and monitor for ochronosis"],
  patient_summary: "You have melasma — a common, sun- and hormone-sensitive pigmentation. We treat it gently and steadily: daily sun protection is the foundation, creams do most of the work, and we avoid aggressive lasers that can make it worse. It's controllable, though it can return, so we plan for the long term.",
  follow_up: {
    interval: "12 weeks",
    measure: "Re-image + re-score mMASI and melanin index",
    escalate_if_plateau: "Adjust topicals; consider a gentle peel after priming",
    stop_if: "Any darkening or irritation — re-examine (ochronosis? over-treatment?)"
  },
  uncertainties: ["Dermal component may limit full clearance"],
  clinician_review_required: true,
  disclaimer: "Demo proposal for workflow illustration; not a prescription."
};

export const DEMO_PLAN_OCHRONOSIS = {
  summary_line: "Ochronosis plan — stop hydroquinone, gentle brightening, guarded expectations.",
  condition: "Exogenous ochronosis",
  plan: {
    tier0_photoprotection: [
      "Broad-spectrum SPF 50+ tinted (iron oxide), daily",
      "Strict sun avoidance — UV worsens ochronosis"
    ],
    tier1_topical: [
      { agent: "Hydroquinone", detail: "—", caution: "", contraindicated: true, contraindication_reason: "Hydroquinone causes and worsens exogenous ochronosis — it must be stopped, not continued." },
      { agent: "Azelaic acid 15–20%", detail: "Non-HQ brightening; AM/PM", caution: "", contraindicated: false, contraindication_reason: "" },
      { agent: "Topical retinoid + niacinamide", detail: "Support turnover and even tone", caution: "Introduce slowly to avoid irritation/PIH", contraindicated: false, contraindication_reason: "" }
    ],
    tier2_procedural: [
      { intervention: "Q-switched Nd:YAG (cautious) / fractional laser", detail: "Some benefit for dermal pigment in expert hands", caution: "FST IV–V — conservative settings, mandatory test spot, high PIH risk", readiness: "consider" }
    ],
    oral_options: [],
    sequencing_note: "Stopping hydroquinone is step one. Then a non-HQ regimen; procedures only cautiously and after counselling on limited, slow gains."
  },
  condition_specific_note: "This is hydroquinone-induced. The single most important action is stopping hydroquinone — continuing or intensifying it makes it worse. Improvement is slow and often partial.",
  prognosis: "Guarded — slow, partial improvement over months. Realistic expectations are essential.",
  goals: [
    { metric: "Hydroquinone cessation", baseline: "ongoing use", target: "fully stopped", timeframe: "immediate", how_measured: "History at each visit" },
    { metric: "mMASI", baseline: "~15", target: "≤12", timeframe: "16 weeks", how_measured: "Re-score from a standardised capture" },
    { metric: "Patient-reported darkening", baseline: "worsening", target: "stabilised then improving", timeframe: "12 weeks", how_measured: "Patient report" }
  ],
  safety_flags: ["Confirm hydroquinone fully stopped and not swapped for another OTC fairness product", "Counsel on slow, partial improvement before any procedure"],
  patient_summary: "The fairness cream you were using has caused a stubborn darkening called ochronosis. The most important step is to stop that cream completely — continuing it makes things worse. We switch to gentler treatments and strong sun protection. Improvement is slow, so patience matters.",
  follow_up: {
    interval: "12–16 weeks",
    measure: "Re-image + re-score; confirm HQ stopped",
    escalate_if_plateau: "Cautious laser after counselling",
    stop_if: "Worsening — re-confirm HQ is truly stopped"
  },
  uncertainties: ["Degree of reversibility uncertain"],
  clinician_review_required: true,
  disclaimer: "Demo proposal for workflow illustration; not a prescription."
};

export const DYNAMIC_QUESTIONS_PROMPT = `You are generating dynamic follow-up questions for a pigmentation AI workflow.

You will receive:
1. Image-derived findings from 5-mode analyzer images.
2. Fixed history answers.

Your task:
Generate only clinically necessary dynamic questions that:
- ask about non-visible information,
- are not already answered in fixed history,
- directly affect diagnosis confidence, procedure eligibility, treatment intensity, safety, or follow-up plan.

Do NOT ask questions about visible features:
- Do not ask where pigmentation is.
- Do not ask whether it is red/brown/dark.
- Do not ask whether it is patchy/diffuse/spotty.
- Do not ask whether acne/redness is visible.
- Do not ask severity.

Only ask 0–5 dynamic questions.
If no dynamic question is needed, return an empty array for dynamic_questions.

Each question must include:
- question_id
- question
- answer_type ("single_choice", "multi_choice", "text", "boolean")
- options (array of strings, or empty if text)
- why_asked
- affects (array of strings)
- decision_if_yes
- decision_if_no

Return valid JSON only matching this schema:
{
  "session_id": "string",
  "dynamic_questions_required": true|false,
  "dynamic_questions": [
    {
      "question_id": "string",
      "question": "string",
      "answer_type": "single_choice|multi_choice|text|boolean",
      "options": ["string"],
      "why_asked": "string",
      "affects": ["string"],
      "decision_if_yes": "string",
      "decision_if_no": "string"
    }
  ]
}
`;

export const DEMO_DYNAMIC_QUESTIONS = {
  "session_id": "AIJ-PIG-000001",
  "dynamic_questions_required": true,
  "dynamic_questions": [
    {
      "question_id": "DQ-SUN-POSTCARE-001",
      "question": "Can you avoid strong sun exposure for 5–7 days after a procedure?",
      "answer_type": "single_choice",
      "options": ["yes", "no", "not_sure"],
      "why_asked": "Q-switch and peel intensity depend on immediate post-procedure sun avoidance.",
      "affects": ["q_switch_eligibility", "peel_eligibility", "procedure_timing"],
      "decision_if_yes": "Procedure may proceed if other safety criteria are clear.",
      "decision_if_no": "Prefer homecare/sunscreen correction first or schedule procedure later."
    },
    {
      "question_id": "DQ-PRIOR-WORSENING-001",
      "question": "Have you ever become darker after a peel, laser, bleach, waxing, or facial?",
      "answer_type": "single_choice",
      "options": ["yes", "no", "not_sure"],
      "why_asked": "Previous darkening after procedures increases PIH/rebound risk.",
      "affects": ["procedure_risk_score", "q_switch_energy_selection", "peel_selection"],
      "decision_if_yes": "Use conservative protocol or stabilization-first pathway.",
      "decision_if_no": "Standard low-energy pathway may be considered if doctor approves."
    }
  ]
};

