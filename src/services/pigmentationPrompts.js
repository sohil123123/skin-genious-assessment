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

export const DIAGNOSIS_PROMPT = `You are an AI clinical decision-support assistant for an Indian dermatology/aesthetic clinic.

Generate a doctor-reviewable working diagnosis/impression for pigmentation.

Inputs:
1. Image-derived findings.
2. Fixed history.
3. Dynamic history answers.

Rules:
- Do not make a final medical diagnosis.
- Use “working impression” or “likely pattern”.
- Final clinical diagnosis and treatment clearance require doctor sign-off.
- Combine image pattern with duration, stability, recurrence, triggers, sunscreen compliance, previous response, active acne, sensitivity, and red-flag history.
- If red-flag lesion history is positive or uncertain, flag doctor review and do not recommend cosmetic treatment on that lesion.
- If inflammation is present in melasma-like pigmentation or PIH, mark “inflammation_first_required” = true.
- Do not over-score beard/stubble shadow as pigmentation.
- Return valid JSON only matching the schema below.

Diagnosis categories allowed (use exactly one as primary_category, and 0 or more as secondary_categories):
- tanning_diffuse_pigmentation
- melasma_like_pigmentation
- pih_acne_marks
- perioral_pigmentation
- periocular_pigmentation
- mixed_facial_pigmentation
- frictional_body_fold_pigmentation
- isolated_spot_doctor_review
- active_inflammatory_pigmentation
- unclear_doctor_review

Return valid JSON only matching this schema:
{
  "session_id": "string",
  "working_impression": {
    "primary_category": "tanning_diffuse_pigmentation|melasma_like_pigmentation|pih_acne_marks|perioral_pigmentation|periocular_pigmentation|mixed_facial_pigmentation|frictional_body_fold_pigmentation|isolated_spot_doctor_review|active_inflammatory_pigmentation|unclear_doctor_review",
    "secondary_categories": [
      "string (from allowed categories, prefixed with severity descriptor if desired e.g. mild_tanning_diffuse_pigmentation)"
    ],
    "diagnostic_confidence": "low|moderate|high",
    "doctor_review_required": true|false,
    "doctor_review_reason": "string reason explaining why or why not"
  },
  "clinical_activity": {
    "stability_status": "stable|worsening|improving|spreading",
    "inflammation_first_required": true|false,
    "active_acne_driver": true|false,
    "barrier_repair_first_required": true|false
  },
  "risk_profile": {
    "recurrence_risk": "low|moderate|high",
    "procedure_risk": "low|low_to_moderate|moderate|high",
    "sunscreen_compliance_risk": "low|moderate|high",
    "pih_risk": "low|moderate|high|moderate_indian_skin_default|high_indian_skin_default",
    "red_flag_lesion_risk": "not_reported|low|moderate|high"
  },
  "scores": {
    "pigmentation_score_5": 2,
    "pigmentation_score_100": 32,
    "inflammation_score_5": 2,
    "inflammation_score_100": 30,
    "recurrence_risk_score_100": 50,
    "procedure_risk_score_100": 35,
    "sunscreen_compliance_score_100": 45,
    "ai_planning_confidence_score_100": 72
  },
  "clinical_summary_for_doctor": "string clinical impression summary"
}
`;

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

export const PLAN_PROMPT = `You are generating one optimum linear pigmentation treatment plan for AI Aesthetics Jaipur.

Inputs:
1. Image-derived indices and regional analysis
2. Fixed history
3. Dynamic history
4. Working diagnosis with confidence and drivers
5. Clinic inventory and doctor-approved protocols

Rules:
- Generate a single best sequential treatment plan, not a menu of options.
- The plan may extend up to 6 months.
- Include fixed reassessment points.
- Include measurable goals for Melanin Load Index, Erythema Load Index, regional load, composition, depth call and mMASI where applicable.
- Use 1–100 scores only.
- For melasma-like cases, include mMASI goals.
- If melasma or PIH has high erythema/inflammation, treat vascular/inflammatory component first.
- Separate local modifiers such as scar-related pigmentation and friction-related pigmentation from global pigmentation.
- If spectacle-friction pigmentation is suspected, include friction reduction as part of treatment.
- If scar-like modifier is present, do not judge pigment plan as failed only because scar shadow remains.
- Default Q-switch wavelength is 1064nm.
- Use Q-switch energy in mJ and calculated fluence in J/cm2 using spot area 1cm2.
- Use BioRePeelCl3 as a TCA-based low-downtime peel.
- Microneedling is doctor-performed.
- Exosome/PDRN/meso default route is topical/transdermal after microneedling. Injectable use is doctor-override only.
- All final plans require doctor sign-off.

Return valid JSON only matching the schema exactly:
{
  "session_id": "string",
  "plan_status": "string",
  "doctor_review_required": true,
  "treatment_priority": "string",
  "modality_eligibility": {
    "homecare": {
      "eligible": true,
      "priority": "mandatory",
      "reason": "string"
    },
    "q_switch_ndyag": {
      "eligible": true,
      "preferred_wavelength_nm": 1064,
      "energy_mj": {
        "recommended": 200,
        "allowed_range": { "min": 200, "max": 400 }
      },
      "calculated_fluence_j_cm2": {
        "recommended": 0.2,
        "allowed_range": { "min": 0.2, "max": 0.4 },
        "spot_area_cm2": 1.0
      },
      "frequency_hz": {
        "allowed_range": { "min": 1, "max": 10 },
        "doctor_to_select": true
      },
      "intensity_band": "string",
      "reason": "string",
      "requires_doctor_approval": true
    },
    "biorepeelcl3": {
      "eligible": true,
      "use_case": "string",
      "contact_time_minutes": { "min": 3, "max": 5 },
      "neutralization_required": true,
      "repeat_interval_days": 30,
      "can_pair_with_q_switch": true,
      "pairing_condition": "string",
      "requires_doctor_approval": true
    },
    "acid_peels": {
      "eligible": "optional_cautious",
      "preferred_options": ["mandelic_peel", "lactic_peel"],
      "avoid_if": ["string"]
    },
    "microneedling_with_regenerative_actives": {
      "eligible": "string",
      "reason": "string",
      "doctor_may_consider_later": true,
      "default_route": "topical_transdermal_after_microneedling"
    },
    "led": {
      "eligible": true,
      "role": "string"
    }
  },
  "recommended_session_1": {
    "primary_option": {
      "name": "string",
      "steps": ["string"],
      "machine_settings": {
        "wavelength_nm": 1064,
        "energy_mj": 200,
        "calculated_fluence_j_cm2": 0.2,
        "frequency_hz": "doctor_select_1_to_10"
      }
    },
    "alternative_option": {
      "name": "string",
      "when_to_choose": "string",
      "peel_settings": {
        "contact_time_minutes": "3_to_5",
        "neutralization_required": true
      }
    },
    "combination_option": {
      "name": "string",
      "allowed": true,
      "condition": "string"
    }
  },
  "four_to_six_week_plan": [
    {
      "week": 0,
      "plan": "string"
    }
  ],
  "homecare_plan": {
    "morning": ["string"],
    "night": ["string"],
    "avoid": ["string"],
    "prescription_items_for_doctor_review": ["string"]
  },
  "prescription_style_output": {
    "rx_status": "string",
    "procedure_orders": [
      {
        "procedure": "string",
        "wavelength_nm": 1064,
        "energy_mj": 200,
        "fluence_j_cm2": 0.2,
        "frequency_hz": "string",
        "notes": "string"
      }
    ],
    "non_rx_homecare": ["string"],
    "rx_options": ["string"]
  },
  "client_report": {
    "headline": "string",
    "pigmentation_score": "string",
    "simple_explanation": "string",
    "recommended_roadmap": ["string"],
    "disclaimer": "string"
  },
  "whatsapp_summary": {
    "message": "string"
  },
  "follow_up_plan": {
    "next_review_weeks": { "min": 4, "max": 6 },
    "repeat_images": ["white", "surface_polarized", "subsurface_polarized", "red", "woods_uv"],
    "comparison_metrics": ["pigmentation_score_5", "pigmentation_score_100", "woods_uv_diffusion_score", "inflammation_score"],
    "progression_type": "string"
  },
  "safety_flags": ["string"]
}
`;

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
  "session_id": "AIJ-PIG-000001",
  "working_impression": {
    "primary_category": "melasma_like_pigmentation",
    "secondary_categories": [
      "mild_tanning_diffuse_pigmentation",
      "mild_periocular_pigmentation"
    ],
    "diagnostic_confidence": "high",
    "doctor_review_required": true,
    "doctor_review_reason": "Clinical history indicates hormonal onset with moderate sunscreen compliance."
  },
  "clinical_activity": {
    "stability_status": "stable",
    "inflammation_first_required": false,
    "active_acne_driver": false,
    "barrier_repair_first_required": false
  },
  "risk_profile": {
    "recurrence_risk": "high",
    "procedure_risk": "moderate",
    "sunscreen_compliance_risk": "moderate",
    "pih_risk": "high_indian_skin_default",
    "red_flag_lesion_risk": "not_reported"
  },
  "scores": {
    "pigmentation_score_5": 3,
    "pigmentation_score_100": 58,
    "inflammation_score_5": 1,
    "inflammation_score_100": 15,
    "recurrence_risk_score_100": 78,
    "procedure_risk_score_100": 55,
    "sunscreen_compliance_score_100": 60,
    "ai_planning_confidence_score_100": 82
  },
  "clinical_summary_for_doctor": "Images show moderate melasma-like centrofacial pigmentation with symmetric malar distribution. History indicates stability with high recurrence risk due to strong hormonal triggers and moderate sun protection compliance."
};

export const DEMO_DX_ASK = {
  "session_id": "AIJ-PIG-000001",
  "working_impression": {
    "primary_category": "unclear_doctor_review",
    "secondary_categories": [
      "melasma_like_pigmentation"
    ],
    "diagnostic_confidence": "low",
    "doctor_review_required": true,
    "doctor_review_reason": "A prolonged fairness cream / hydroquinone history raises suspicion of exogenous ochronosis, requiring dermoscopy."
  },
  "clinical_activity": {
    "stability_status": "worsening",
    "inflammation_first_required": true,
    "active_acne_driver": false,
    "barrier_repair_first_required": true
  },
  "risk_profile": {
    "recurrence_risk": "high",
    "procedure_risk": "high",
    "sunscreen_compliance_risk": "high",
    "pih_risk": "high_indian_skin_default",
    "red_flag_lesion_risk": "not_reported"
  },
  "scores": {
    "pigmentation_score_5": 4,
    "pigmentation_score_100": 72,
    "inflammation_score_5": 4,
    "inflammation_score_100": 68,
    "recurrence_risk_score_100": 85,
    "procedure_risk_score_100": 90,
    "sunscreen_compliance_score_100": 30,
    "ai_planning_confidence_score_100": 40
  },
  "clinical_summary_for_doctor": "Prolonged fairness cream use has caused paradoxical darkening. Do NOT initiate cosmetic procedures or HQ treatments before doctor review and dermoscopy confirmation. Exogenous ochronosis must be excluded."
};

export const DEMO_DX_OCHRONOSIS = {
  "session_id": "AIJ-PIG-000001",
  "working_impression": {
    "primary_category": "unclear_doctor_review",
    "secondary_categories": [
      "melasma_like_pigmentation"
    ],
    "diagnostic_confidence": "high",
    "doctor_review_required": true,
    "doctor_review_reason": "Exogenous ochronosis confirmed by dermoscopy finding of blue-grey amorphous globules."
  },
  "clinical_activity": {
    "stability_status": "worsening",
    "inflammation_first_required": true,
    "active_acne_driver": false,
    "barrier_repair_first_required": true
  },
  "risk_profile": {
    "recurrence_risk": "high",
    "procedure_risk": "high",
    "sunscreen_compliance_risk": "high",
    "pih_risk": "high_indian_skin_default",
    "red_flag_lesion_risk": "not_reported"
  },
  "scores": {
    "pigmentation_score_5": 4,
    "pigmentation_score_100": 75,
    "inflammation_score_5": 4,
    "inflammation_score_100": 70,
    "recurrence_risk_score_100": 90,
    "procedure_risk_score_100": 95,
    "sunscreen_compliance_score_100": 25,
    "ai_planning_confidence_score_100": 45
  },
  "clinical_summary_for_doctor": "Exogenous ochronosis confirmed. The single most important action is immediate, permanent cessation of hydroquinone and fairness creams. Treatment is guarded, slow, and non-procedural initially."
};

export const DEMO_PLAN_MELASMA = {
  "session_id": "AIJ-PIG-000001",
  "plan_status": "generated_pending_doctor_signoff",
  "doctor_review_required": true,
  "treatment_priority": "mild_pigmentation_correction_and_prevention",
  "modality_eligibility": {
    "homecare": {
      "eligible": true,
      "priority": "mandatory",
      "reason": "Pigmentation recurrence prevention requires sunscreen and pigment-control homecare."
    },
    "q_switch_ndyag": {
      "eligible": true,
      "preferred_wavelength_nm": 1064,
      "energy_mj": {
        "recommended": 200,
        "allowed_range": { "min": 200, "max": 400 }
      },
      "calculated_fluence_j_cm2": {
        "recommended": 0.2,
        "allowed_range": { "min": 0.2, "max": 0.4 },
        "spot_area_cm2": 1.0
      },
      "frequency_hz": {
        "allowed_range": { "min": 1, "max": 10 },
        "doctor_to_select": true
      },
      "intensity_band": "low_conservative",
      "reason": "Mild pigmentation score 2/5 with diffuse uneven tone/tanning-type component and low visible inflammation.",
      "requires_doctor_approval": true
    },
    "biorepeelcl3": {
      "eligible": true,
      "use_case": "mild pigmentation, uneven tone, general rejuvenation",
      "contact_time_minutes": { "min": 3, "max": 5 },
      "neutralization_required": true,
      "repeat_interval_days": 30,
      "can_pair_with_q_switch": true,
      "pairing_condition": "only with low-energy conservative Q-switch protocol",
      "requires_doctor_approval": true
    },
    "acid_peels": {
      "eligible": "optional_cautious",
      "preferred_options": ["mandelic_peel", "lactic_peel"],
      "avoid_if": ["sensitivity_increases", "recent_darkening_after_procedure"]
    },
    "microneedling_with_regenerative_actives": {
      "eligible": "not_first_line_for_this_visit",
      "reason": "Pigmentation burden is mild at 2/5; reserve microneedling for persistent perioral/periocular pigmentation, melasma-like pattern, PIH with texture, or poor response to lower-downtime modalities.",
      "doctor_may_consider_later": true,
      "default_route": "topical_transdermal_after_microneedling"
    },
    "led": {
      "eligible": true,
      "role": "post_procedure_calming_support"
    }
  },
  "recommended_session_1": {
    "primary_option": {
      "name": "Q-switch 1064nm low-energy pigmentation toning + LED + homecare",
      "steps": [
        "Doctor confirms suitability and absence of contraindications",
        "Q-switch Nd:YAG 1064nm at conservative energy",
        "LED calming support",
        "Sunscreen and pigment-control homecare"
      ],
      "machine_settings": {
        "wavelength_nm": 1064,
        "energy_mj": 200,
        "calculated_fluence_j_cm2": 0.2,
        "frequency_hz": "doctor_select_1_to_10"
      }
    },
    "alternative_option": {
      "name": "BioRePeelCl3 + LED + homecare",
      "when_to_choose": "Choose if doctor prefers peel-first approach, client wants lower device intensity, or recent sun exposure makes laser less suitable.",
      "peel_settings": {
        "contact_time_minutes": "3_to_5",
        "neutralization_required": true
      }
    },
    "combination_option": {
      "name": "Low-energy Q-switch + BioRePeelCl3 + LED",
      "allowed": true,
      "condition": "Doctor-approved only; use low-energy Q-switch range and avoid if sensitivity/inflammation is higher than expected."
    }
  },
  "four_to_six_week_plan": [
    {
      "week": 0,
      "plan": "Start sunscreen correction and homecare. Perform doctor-approved Q-switch or BioRePeelCl3 based on clearance."
    },
    {
      "week": 4,
      "plan": "Repeat 5-mode imaging. Compare pigmentation score, Woods/UV diffusion and redness. Continue, intensify, or switch modality."
    },
    {
      "week": 6,
      "plan": "Doctor review if score is unchanged, pigmentation worsened, or sensitivity increased."
    }
  ],
  "homecare_plan": {
    "morning": [
      "gentle_cleanser",
      "vitamin_c_or_niacinamide_if_tolerated",
      "broad_spectrum_sunscreen_or_tinted_sunscreen"
    ],
    "night": [
      "azelaic_acid_or_tranexamic_acid_based_product",
      "barrier_moisturizer"
    ],
    "avoid": [
      "bleach",
      "scrubs",
      "unprescribed steroid/fairness creams",
      "excessive sun exposure after procedure"
    ],
    "prescription_items_for_doctor_review": [
      "hydroquinone",
      "tretinoin",
      "triple_combination"
    ]
  },
  "prescription_style_output": {
    "rx_status": "doctor_to_finalize",
    "procedure_orders": [
      {
        "procedure": "Q-switch Nd:YAG",
        "wavelength_nm": 1064,
        "energy_mj": 200,
        "fluence_j_cm2": 0.2,
        "frequency_hz": "doctor_select",
        "notes": "Conservative first session due to mild score 2/5"
      },
      {
        "procedure": "LED calming support",
        "notes": "Post-procedure support"
      }
    ],
    "non_rx_homecare": [
      "Broad-spectrum/tinted sunscreen",
      "Barrier moisturizer",
      "Azelaic acid or tranexamic acid based pigment-control product"
    ],
    "rx_options": [
      "Doctor may add prescription pigment suppressants if clinically needed"
    ]
  },
  "client_report": {
    "headline": "Mild pigmentation and uneven tone detected",
    "pigmentation_score": "2/5",
    "simple_explanation": "Your images show mild pigmentation and uneven tone. The pigmentation is not severe, so the plan should focus on controlled correction, prevention of darkening, and sunscreen consistency.",
    "recommended_roadmap": [
      "Begin sunscreen and pigment-control homecare",
      "Proceed with doctor-approved low-energy Q-switch or BioRePeelCl3 depending on suitability",
      "Repeat imaging in 4–6 weeks",
      "Escalate only if pigmentation persists or progresses"
    ],
    "disclaimer": "This is an AI-assisted plan and will be finalized after doctor review."
  },
  "whatsapp_summary": {
    "message": "Hi, your AI Pigmentation Decode shows mild pigmentation with a score of 2/5. The suggested plan is sunscreen/homecare plus doctor-approved low-energy Q-switch or BioRePeelCl3, followed by repeat imaging in 4–6 weeks. Final treatment will be confirmed by the doctor."
  },
  "follow_up_plan": {
    "next_review_weeks": { "min": 4, "max": 6 },
    "repeat_images": ["white", "surface_polarized", "subsurface_polarized", "red", "woods_uv"],
    "comparison_metrics": [
      "pigmentation_score_5",
      "pigmentation_score_100",
      "woods_uv_diffusion_score",
      "inflammation_score",
      "area_specific_change",
      "client_compliance"
    ],
    "progression_type": "linear_progression_comparison"
  },
  "safety_flags": [
    "Doctor sign-off required before treatment",
    "Avoid aggressive settings due to Indian skin PIH risk",
    "If sensitivity or inflammation increases, switch to barrier-first pathway"
  ]
};

export const DEMO_PLAN_OCHRONOSIS = {
  "session_id": "AIJ-PIG-000001",
  "plan_status": "generated_pending_doctor_signoff",
  "doctor_review_required": true,
  "treatment_priority": "exogenous_ochronosis_halt_and_brighten",
  "modality_eligibility": {
    "homecare": {
      "eligible": true,
      "priority": "mandatory",
      "reason": "Immediate cessation of all hydroquinone / steroid products is the single most critical action."
    },
    "q_switch_ndyag": {
      "eligible": false,
      "reason": "Exogenous ochronosis is highly sensitive; Q-switch laser poses risk of worsening or scarring. Avoid initially.",
      "requires_doctor_approval": true
    },
    "biorepeelcl3": {
      "eligible": true,
      "use_case": "cautious skin rejuvenation and non-inflammatory exfoliation",
      "contact_time_minutes": { "min": 2, "max": 3 },
      "neutralization_required": true,
      "repeat_interval_days": 45,
      "requires_doctor_approval": true
    },
    "acid_peels": {
      "eligible": false,
      "avoid_if": ["exogenous ochronosis present"]
    },
    "microneedling_with_regenerative_actives": {
      "eligible": "optional_cautious",
      "reason": "May consider transdermal exosome delivery after micro-needling once barrier has stabilized for 3 months."
    },
    "led": {
      "eligible": true,
      "role": "barrier_support_and_calming"
    }
  },
  "recommended_session_1": {
    "primary_option": {
      "name": "Strict non-HQ homecare barrier repair + LED calming",
      "steps": [
        "Cease hydroquinone use completely",
        "Introduce barrier repair night cream",
        "Apply tinted iron-oxide sunscreen daily",
        "LED calming support session in-clinic"
      ]
    },
    "alternative_option": {
      "name": "Gentle BioRePeelCl3 (2 minutes max contact time) + LED",
      "when_to_choose": "Choose after 4-6 weeks of strict homecare priming if skin shows no active irritation."
    }
  },
  "four_to_six_week_plan": [
    {
      "week": 0,
      "plan": "Complete cessation of hydroquinone and fairness creams. Initiate barrier repair and physical sunscreen."
    },
    {
      "week": 4,
      "plan": "Repeat 5-mode imaging and check for early follicular clearing. Confirm no new hyperpigmentation."
    }
  ],
  "homecare_plan": {
    "morning": [
      "ultra_gentle_cleanser",
      "niacinamide_5_percent",
      "tinted_physical_sunscreen"
    ],
    "night": [
      "barrier_repair_ceramide_moisturizer",
      "azelaic_acid_15_percent"
    ],
    "avoid": [
      "hydroquinone",
      "tretinoin",
      "steroid_creams",
      "aggressive_scrubs"
    ],
    "prescription_items_for_doctor_review": []
  },
  "prescription_style_output": {
    "rx_status": "doctor_to_finalize",
    "procedure_orders": [
      {
        "procedure": "LED calming support",
        "notes": "Post-cessation calming"
      }
    ],
    "non_rx_homecare": [
      "Cease all hydroquinone/steroid creams immediately",
      "Ceramide-rich barrier repair moisturizer",
      "Azelaic acid 15%",
      "Tinted sunscreen SPF 50+"
    ]
  },
  "client_report": {
    "headline": "Exogenous ochronosis (hydroquinone-induced pigment change)",
    "pigmentation_score": "4/5",
    "simple_explanation": "Your dermoscopy readings suggest exogenous ochronosis, a condition triggered by unsupervised hydroquinone/fairness creams. The first and most critical step is to stop all such creams completely to prevent further darkening.",
    "recommended_roadmap": [
      "Stop all hydroquinone/steroid creams immediately",
      "Focus on barrier repair and physical sunscreen protection for 4-6 weeks",
      "Perform gentle in-clinic LED or low-contact BioRePeel only after barrier heals"
    ]
  },
  "whatsapp_summary": {
    "message": "Hi, your AI Pigmentation Decode suggests exogenous ochronosis. Please stop all hydroquinone and fairness creams immediately. The focus is strict homecare and barrier repair, to be reviewed in 4-6 weeks."
  },
  "follow_up_plan": {
    "next_review_weeks": { "min": 4, "max": 6 },
    "repeat_images": ["white", "surface_polarized", "subsurface_polarized", "red", "woods_uv"],
    "comparison_metrics": [
      "pigmentation_score_5",
      "pigmentation_score_100",
      "woods_uv_diffusion_score"
    ]
  },
  "safety_flags": [
    "Verify complete hydroquinone cessation",
    "Do not prescribe hydroquinone or triple combination creams",
    "Advise patient that clearance is slow and gradual"
  ]
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

