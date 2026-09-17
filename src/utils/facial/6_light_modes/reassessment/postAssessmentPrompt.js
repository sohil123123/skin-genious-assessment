import { encode } from '@toon-format/toon'

// INFO: ------------------- Reassessment -------------------

const reassessment_json_structure = {
  reassessment: {
    skin_type: {
      parameter_name: 'Skin Type',
      before_treatment_score_or_label: '<Enter Skin Type>',
      before_image:
        'Return the image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label:
        '<Enter FINAL patient-facing post-treatment Skin Type shown in report>',
      post_treatment_image:
        'Return the image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
      result: '<improved or stable>',
      score_semantics: 'label',
      score_polarity: 'label_only',
      comparison_mode: 'label_mapping',
      ideal_score_direction: 'maintain',
      base_post_score_or_label_internal:
        '<Fresh internal post-treatment score/label before patient-facing override>',
      raw_comparison_result_internal: '<improved or declined or stable>',
      response_strength: '<none | mild | moderate | strong>',
      patient_facing_change_points: '<0>',
      transient_reactivity_note: '<none or short note>',
      score_explanation:
        '<Short patient-facing explanation. If temporary worsening/reactivity is visible, explain it here while keeping result stable.>',
    },

    barrier_health: {
      parameter_name: 'Barrier Health',
      before_treatment_score_or_label: '<Enter Barrier Health Status>',
      before_image:
        'Return the image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label:
        '<Enter FINAL patient-facing post-treatment Barrier Health Status shown in report>',
      post_treatment_image:
        'Return the image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
      result: '<improved or stable>',
      score_semantics: 'severity',
      score_polarity: 'higher_is_worse',
      comparison_mode: 'direct_numeric',
      ideal_score_direction: 'decrease',
      base_post_score_or_label_internal:
        '<Fresh internal post-treatment score before patient-facing override>',
      raw_comparison_result_internal: '<improved or declined or stable>',
      response_strength: '<none | mild | moderate | strong>',
      patient_facing_change_points: '<0 | 1 | 2>',
      transient_reactivity_note: '<none or short note>',
      score_explanation:
        '<Short patient-facing explanation. If temporary worsening/reactivity is visible, explain it here while keeping result stable.>',
    },

    visual_acne_grading: {
      parameter_name: 'Visual Acne Grading',
      before_treatment_score_or_label: '<Enter Acne Grade>',
      before_image:
        'Return the image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label:
        '<Enter FINAL patient-facing post-treatment Acne Grade shown in report>',
      post_treatment_image:
        'Return the image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
      result: '<improved or stable>',
      score_semantics: 'severity',
      score_polarity: 'higher_is_worse',
      comparison_mode: 'direct_numeric',
      ideal_score_direction: 'decrease',
      base_post_score_or_label_internal:
        '<Fresh internal post-treatment score before patient-facing override>',
      raw_comparison_result_internal: '<improved or declined or stable>',
      response_strength: '<none | mild | moderate | strong>',
      patient_facing_change_points: '<0 | 1>',
      transient_reactivity_note: '<none or short note>',
      score_explanation:
        '<Short patient-facing explanation. If temporary worsening/reactivity is visible, explain it here while keeping result stable.>',
    },

    skin_sebum_content: {
      parameter_name: 'Skin Sebum Content',
      before_treatment_score_or_label: '<Enter Sebum Level>',
      before_image:
        'Return the image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label:
        '<Enter FINAL patient-facing post-treatment Sebum Level shown in report>',
      post_treatment_image:
        'Return the image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
      result: '<improved or stable>',
      score_semantics: 'state_spectrum',
      score_polarity: 'distance_to_target',
      comparison_mode: 'target_distance',
      ideal_score_direction: 'move_toward_target',
      base_post_score_or_label_internal:
        '<Fresh internal post-treatment score before patient-facing override>',
      raw_comparison_result_internal: '<improved or declined or stable>',
      response_strength: '<none | mild | moderate | strong>',
      patient_facing_change_points: '<0 | 1 | 2>',
      transient_reactivity_note: '<none or short note>',
      score_explanation:
        '<Short patient-facing explanation. If temporary worsening/reactivity is visible, explain it here while keeping result stable.>',
    },

    vascularity_redness_profiling: {
      parameter_name: 'Vascularity / Redness Profiling',
      before_treatment_score_or_label: '<Enter Redness or Vascularity Score>',
      before_image:
        'Return the image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label:
        '<Enter FINAL patient-facing post-treatment Redness/Vascularity Score shown in report>',
      post_treatment_image:
        'Return the image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
      result: '<improved or stable>',
      score_semantics: 'severity',
      score_polarity: 'higher_is_worse',
      comparison_mode: 'direct_numeric',
      ideal_score_direction: 'decrease',
      base_post_score_or_label_internal:
        '<Fresh internal post-treatment score before patient-facing override>',
      raw_comparison_result_internal: '<improved or declined or stable>',
      response_strength: '<none | mild | moderate | strong>',
      patient_facing_change_points: '<0 | 1>',
      transient_reactivity_note: '<none or short note>',
      score_explanation:
        '<Short patient-facing explanation. If temporary worsening/reactivity is visible, explain it here while keeping result stable.>',
    },

    skin_hydration: {
      parameter_name: 'Skin Hydration',
      before_treatment_score_or_label: '<Enter Hydration Level>',
      before_image:
        'Return the image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label:
        '<Enter FINAL patient-facing post-treatment Hydration Level shown in report>',
      post_treatment_image:
        'Return the image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
      result: '<improved or stable>',
      score_semantics: 'health',
      score_polarity: 'higher_is_better',
      comparison_mode: 'direct_numeric',
      ideal_score_direction: 'increase',
      base_post_score_or_label_internal:
        '<Fresh internal post-treatment score before patient-facing override>',
      raw_comparison_result_internal: '<improved or declined or stable>',
      response_strength: '<none | mild | moderate | strong>',
      patient_facing_change_points: '<0 | 1 | 2>',
      transient_reactivity_note: '<none or short note>',
      score_explanation:
        '<Short patient-facing explanation. If temporary worsening/reactivity is visible, explain it here while keeping result stable.>',
    },

    skin_luminosity_glow_index: {
      parameter_name: 'Skin Luminosity / Glow Index',
      before_treatment_score_or_label: '<Enter Glow Index>',
      before_image:
        'Return the image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label:
        '<Enter FINAL patient-facing post-treatment Glow Index shown in report>',
      post_treatment_image:
        'Return the image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
      result: '<improved or stable>',
      score_semantics: 'health',
      score_polarity: 'higher_is_better',
      comparison_mode: 'direct_numeric',
      ideal_score_direction: 'increase',
      base_post_score_or_label_internal:
        '<Fresh internal post-treatment score before patient-facing override>',
      raw_comparison_result_internal: '<improved or declined or stable>',
      response_strength: '<none | mild | moderate | strong>',
      patient_facing_change_points: '<0 | 1 | 2>',
      transient_reactivity_note: '<none or short note>',
      score_explanation:
        '<Short patient-facing explanation. If temporary worsening/reactivity is visible, explain it here while keeping result stable.>',
    },

    superficial_pigmentation_score: {
      parameter_name: 'Superficial Pigmentation Score',
      before_treatment_score_or_label: '<Enter Pigmentation Score>',
      before_image:
        'Return the image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label:
        '<Enter FINAL patient-facing post-treatment Pigmentation Score shown in report>',
      post_treatment_image:
        'Return the image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
      result: '<improved or stable>',
      score_semantics: 'severity',
      score_polarity: 'higher_is_worse',
      comparison_mode: 'direct_numeric',
      ideal_score_direction: 'decrease',
      base_post_score_or_label_internal:
        '<Fresh internal post-treatment score before patient-facing override>',
      raw_comparison_result_internal: '<improved or declined or stable>',
      response_strength: '<none | mild | moderate | strong>',
      patient_facing_change_points: '<0 | 1 | 2>',
      transient_reactivity_note: '<none or short note>',
      score_explanation:
        '<Short patient-facing explanation. If temporary worsening/reactivity is visible, explain it here while keeping result stable.>',
    },

    periorbital_health: {
      parameter_name: 'Periorbital Health',
      before_treatment_score_or_label: '<Enter Periorbital Score>',
      before_image:
        'Return the image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label:
        '<Enter FINAL patient-facing post-treatment Periorbital Score shown in report>',
      post_treatment_image:
        'Return the image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
      result: '<improved or stable>',
      score_semantics: 'severity',
      score_polarity: 'higher_is_worse',
      comparison_mode: 'direct_numeric',
      ideal_score_direction: 'decrease',
      base_post_score_or_label_internal:
        '<Fresh internal post-treatment score before patient-facing override>',
      raw_comparison_result_internal: '<improved or declined or stable>',
      response_strength: '<none | mild | moderate | strong>',
      patient_facing_change_points: '<0 | 1>',
      transient_reactivity_note: '<none or short note>',
      score_explanation:
        '<Short patient-facing explanation. If temporary worsening/reactivity is visible, explain it here while keeping result stable.>',
    },

    lip_pigmentation: {
      parameter_name: 'Lip Pigmentation',
      before_treatment_score_or_label: '<Enter Lip Pigmentation Level>',
      before_image:
        'Return the image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label:
        '<Enter FINAL patient-facing post-treatment Lip Pigmentation Level shown in report>',
      post_treatment_image:
        'Return the image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
      result: '<improved or stable>',
      score_semantics: 'severity',
      score_polarity: 'higher_is_worse',
      comparison_mode: 'direct_numeric',
      ideal_score_direction: 'decrease',
      base_post_score_or_label_internal:
        '<Fresh internal post-treatment score before patient-facing override>',
      raw_comparison_result_internal: '<improved or declined or stable>',
      response_strength: '<none | mild | moderate | strong>',
      patient_facing_change_points: '<0 | 1>',
      transient_reactivity_note: '<none or short note>',
      score_explanation:
        '<Short patient-facing explanation. If temporary worsening/reactivity is visible, explain it here while keeping result stable.>',
    },

    texture_open_pores_grading: {
      parameter_name: 'Texture / Open Pores Grading',
      before_treatment_score_or_label: '<Enter Texture or Pores Grade>',
      before_image:
        'Return the image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label:
        '<Enter FINAL patient-facing post-treatment Texture/Pores Grade shown in report>',
      post_treatment_image:
        'Return the image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
      result: '<improved or stable>',
      score_semantics: 'severity',
      score_polarity: 'higher_is_worse',
      comparison_mode: 'direct_numeric',
      ideal_score_direction: 'decrease',
      base_post_score_or_label_internal:
        '<Fresh internal post-treatment score before patient-facing override>',
      raw_comparison_result_internal: '<improved or declined or stable>',
      response_strength: '<none | mild | moderate | strong>',
      patient_facing_change_points: '<0 | 1 | 2>',
      transient_reactivity_note: '<none or short note>',
      score_explanation:
        '<Short patient-facing explanation. If temporary worsening/reactivity is visible, explain it here while keeping result stable.>',
    },

    superficial_wrinkles: {
      parameter_name: 'Superficial Wrinkles',
      before_treatment_score_or_label: '<Enter Wrinkle Score>',
      before_image:
        'Return the image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label:
        '<Enter FINAL patient-facing post-treatment Wrinkle Score shown in report>',
      post_treatment_image:
        'Return the image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
      result: '<improved or stable>',
      score_semantics: 'severity',
      score_polarity: 'higher_is_worse',
      comparison_mode: 'direct_numeric',
      ideal_score_direction: 'decrease',
      base_post_score_or_label_internal:
        '<Fresh internal post-treatment score before patient-facing override>',
      raw_comparison_result_internal: '<improved or declined or stable>',
      response_strength: '<none | mild | moderate | strong>',
      patient_facing_change_points: '<0 | 1>',
      transient_reactivity_note: '<none or short note>',
      score_explanation:
        '<Short patient-facing explanation. If temporary worsening/reactivity is visible, explain it here while keeping result stable.>',
    },

    jawline_sagging: {
      parameter_name: 'Jawline Sagging',
      before_treatment_score_or_label: '<Enter Sagging Level>',
      before_image:
        'Return the image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label:
        '<Enter FINAL patient-facing post-treatment Sagging Level shown in report>',
      post_treatment_image:
        'Return the image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
      result: '<improved or stable>',
      score_semantics: 'severity',
      score_polarity: 'higher_is_worse',
      comparison_mode: 'direct_numeric',
      ideal_score_direction: 'decrease',
      base_post_score_or_label_internal:
        '<Fresh internal post-treatment score before patient-facing override>',
      raw_comparison_result_internal: '<improved or declined or stable>',
      response_strength: '<none | mild | moderate | strong>',
      patient_facing_change_points: '<0 | 1>',
      transient_reactivity_note: '<none or short note>',
      score_explanation:
        '<Short patient-facing explanation. If temporary worsening/reactivity is visible, explain it here while keeping result stable.>',
    },

    skin_firmness_elasticity_index: {
      parameter_name: 'Skin Firmness Elasticity Index',
      before_treatment_score_or_label: '<Enter Skin Firmness Elasticity Range>',
      before_image:
        'Return the image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label:
        '<Enter FINAL patient-facing post-treatment Skin Firmness Elasticity Range shown in report>',
      post_treatment_image:
        'Return the image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
      result: '<improved or stable>',
      score_semantics: 'severity',
      score_polarity: 'higher_is_worse',
      comparison_mode: 'direct_numeric',
      ideal_score_direction: 'decrease',
      base_post_score_or_label_internal:
        '<Fresh internal post-treatment score before patient-facing override>',
      raw_comparison_result_internal: '<improved or declined or stable>',
      response_strength: '<none | mild | moderate | strong>',
      patient_facing_change_points: '<0 | 1>',
      transient_reactivity_note: '<none or short note>',
      score_explanation:
        '<Short patient-facing explanation. If temporary worsening/reactivity is visible, explain it here while keeping result stable.>',
    },

    textural_radiance_index: {
      parameter_name: 'Textural Readiance Index',
      before_treatment_score_or_label: '<Enter Textural Readiance Range>',
      before_image:
        'Return the image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label:
        '<Enter FINAL patient-facing post-treatment Textural Readiance Range shown in report>',
      post_treatment_image:
        'Return the image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
      result: '<improved or stable>',
      score_semantics: 'severity',
      score_polarity: 'higher_is_worse',
      comparison_mode: 'direct_numeric',
      ideal_score_direction: 'decrease',
      base_post_score_or_label_internal:
        '<Fresh internal post-treatment score before patient-facing override>',
      raw_comparison_result_internal: '<improved or declined or stable>',
      response_strength: '<none | mild | moderate | strong>',
      patient_facing_change_points: '<0 | 1 | 2>',
      transient_reactivity_note: '<none or short note>',
      score_explanation:
        '<Short patient-facing explanation. If temporary worsening/reactivity is visible, explain it here while keeping result stable.>',
    },
  },

  reassessment_policy: {
    patient_facing_no_worsening: true,
    allowed_patient_facing_results: ['improved', 'stable'],
    max_patient_facing_improvement_points_default: 2,
    identical_image_rule:
      'if post-treatment image set is exactly identical to baseline, all parameters must remain stable and unchanged',
    report_visibility_rule:
      'post_treatment_score_or_label, result, and score_explanation are the patient-facing fields; base_post_score_or_label_internal and raw_comparison_result_internal are internal-only',
  },

  images_used: [
    {
      concern_name: 'first concern',
      before_image_file_id_used: ['<The ID of the image used>'],
      after_image_file_id_used: ['<The ID of the image used>'],
    },
    {
      concern_name: '2nd concern',
      before_image_file_id_used: ['<The ID of the image used>'],
      after_image_file_id_used: ['<The ID of the image used>'],
    },
    {
      concern_name: 'nth concern',
      before_image_file_id_used: ['<The ID of the image used>'],
      after_image_file_id_used: ['<The ID of the image used>'],
    },
  ],
}

export const POST_DIAGNOSIS_USER_PROMPT = `
Analyze the new set of post-treatment facial scan images for the same patient whose baseline assessment was already performed in this conversation.

Use the same diagnostic logic, criteria, and parameter definitions that were applied earlier while generating the initial diagnosis report.
Do not change the underlying baseline interpretation methods, scales, or thresholds.
However, this reassessment is NOT only a blind fresh rescore. It must combine:
1) fresh post-treatment rescoring using the original baseline rubric, and
2) a reassessment-specific patient-facing visible-response interpretation relative to baseline.

Compare the current (post-treatment) analysis with the previously generated baseline (before-treatment) results stored in this conversation memory.
For each diagnostic parameter, include both:
- the baseline (before-treatment) value retrieved from your earlier output, and
- the newly analyzed post-treatment value derived from the images provided now.

Strictly follow the predefined JSON structure below and fill all fields:

---
${encode(reassessment_json_structure)}

GLOBAL RULES:
- Output STRICT JSON only.
- No explanations outside JSON.
- No additional text outside JSON.
- No null values.
- Every parameter must be filled.
- The patient-facing result field MUST be one of: improved or stable.
- Patient-facing reassessment MUST NEVER show decline / worsening as the final visible result.
- If temporary post-procedure worsening/reactivity is genuinely visible, it may be recorded internally as raw_comparison_result_internal = "declined", but patient-facing result must still be "stable" and the score_explanation must explain that temporary treatment-day reactivity may be visible.

EXPLICIT COMPARISON RULES FOR INTERNAL RAW COMPARISON:
  if higher_is_better:
    internal post > baseline usually = improved

  if higher_is_worse:
    internal post < baseline usually = improved

  if label_only:
    compare using healthy label mapping

  if distance_to_target:
    compare abs(post - target) vs abs(before - target)

STEP 1 — FRESH INTERNAL POST SCORE (MANDATORY)
For every parameter, first compute:
base_post_score_or_label_internal

This MUST be done by re-applying the SAME scoring rubric used for the baseline diagnosis to the NEW post-treatment images.
Do NOT skip this.
Do NOT invent improvement without first rescoring.
This internal score is the diagnostic anchor.

STEP 2 — RAW INTERNAL COMPARISON (MANDATORY)
Compare:
- before_treatment_score_or_label
vs
- base_post_score_or_label_internal

Then set:
raw_comparison_result_internal = improved | declined | stable

IMPORTANT:
This raw internal comparison is for logic only.
It may detect decline.
It is NOT automatically the final patient-facing result.

STEP 3 — RESPONSE STRENGTH (MANDATORY)
Then separately judge visible treatment response relative to baseline and assign:
response_strength = none | mild | moderate | strong

This response_strength must reflect visible doctor/patient-perceived same-day change, not merely whether the post-treatment score crossed an original diagnostic bin.
When judging response_strength, consider relevant visual changes such as:
- lower contrast / lighter pigment appearance
- reduced shine or improved oil balance
- improved reflectance uniformity
- smoother microtexture / less haze
- softer pore edge prominence / lower follicular contrast
- improved plumpness / hydration appearance
- reduced visible redness or inflammatory prominence
- improved tone-evenness / glow / textural radiance

Do NOT overcall structural or slow-moving parameters that are not realistically expected to change strongly in one same-day session.

STEP 4 — PATIENT-FACING NO-WORSENING RULE (MANDATORY)
Under no circumstances may the final patient-facing output show decline / worsening.

If raw_comparison_result_internal = declined:
- result MUST be "stable"
- post_treatment_score_or_label MUST equal before_treatment_score_or_label
- patient_facing_change_points MUST be 0
- transient_reactivity_note MUST explain that temporary post-procedure reactivity / transient worsening may be visible today if that is what is seen
- score_explanation MUST explain this in patient-friendly language while keeping the visible score stable

If raw_comparison_result_internal = stable:
- result may remain stable
- result stays stable. Do NOT convert a stable rescore into a patient-facing improvement on the strength of visible impression alone.

If raw_comparison_result_internal = improved:
- keep the patient-facing improvement at the size supported by the fresh rescore; never amplify it beyond the measured change

STEP 5 — MULTI-POINT IMPROVEMENT RULE (MANDATORY)
The final patient-facing change may be:
- 0 points
- 1 point
- 2 points maximum

Never allow more than 2 points in same-day reassessment.

Use this framework:

A) response_strength = none
- patient_facing_change_points = 0
- result = stable
- post_treatment_score_or_label = before_treatment_score_or_label

B) response_strength = mild
- usually 0 or 1 point improvement
- choose 1 point only if the visible change or fresh rescoring clearly supports it

C) response_strength = moderate
- usually 1 point improvement
- allow 2 points only when the parameter is highly same-day responsive and visible change is clearly stronger than a small threshold crossing

D) response_strength = strong
- allow up to 2 points improvement when clinically plausible for that parameter and comparison quality is acceptable

STEP 6 — PARAMETER-SPECIFIC SAME-DAY CAPS (MANDATORY)
Allow up to 2-point improvement when strongly justified for:
- barrier_health
- skin_sebum_content
- skin_hydration
- skin_luminosity_glow_index
- superficial_pigmentation_score
- texture_open_pores_grading
- textural_radiance_index

Usually cap at 1-point improvement for:
- visual_acne_grading
- vascularity_redness_profiling
- periorbital_health
- lip_pigmentation
- superficial_wrinkles (dehydration microlines only; fixed lines do not change same-day)

STRUCTURAL PARAMETERS ARE NOT RESCORED SAME-DAY (cap = 0 points; carry the baseline forward):
- jawline_sagging
- skin_firmness_elasticity_index
These change over a course of treatment, not within one session. Apparent same-day movement is almost always head position or lighting.

Skin type:
- usually stable unless a clearly obvious classification shift is visible

IMPORTANT:
A 2-point improvement is allowed only if ALL are true:
- scan quality is not fail
- no major capture mismatch makes comparison unreliable
- the parameter is realistically same-day responsive
- the visible change is clearly stronger than a simple one-bin shift
- the improvement is visible in the most relevant lighting mode(s)

STEP 7 — IDENTICAL-IMAGE GUARDRAIL (MANDATORY)
Before scoring, check whether the post-treatment image set is EXACTLY the same as the baseline image set (true re-upload / same scan).

If the post-treatment images are EXACTLY IDENTICAL to baseline:
- You MUST set every base_post_score_or_label_internal equal to the baseline score/label
- You MUST set every post_treatment_score_or_label equal to the baseline score/label
- You MUST set every raw_comparison_result_internal to "stable"
- You MUST set every result to "stable"
- You MUST set every response_strength to "none"
- You MUST set every patient_facing_change_points to 0
- You MUST set every transient_reactivity_note to "none"

If the post-treatment images are NOT exactly identical:
- continue with normal fresh rescoring + response-strength + patient-facing override logic

STEP 8 — IMAGE NUMBER CONSISTENCY RULE (MANDATORY)
For every diagnostic parameter, you MUST use the EXACT SAME image number for:
- before_image
- post_treatment_image

The image number selected during the baseline diagnosis for a parameter MUST be reused for the post-treatment assessment of the same parameter.

You are NOT allowed to:
- choose a new image number,
- re-evaluate or re-select a different image for post-treatment,
- change the mapping of parameters to images.

Therefore:
post_treatment_image MUST ALWAYS BE IDENTICAL TO before_image for the same parameter.

If before_image was:
- an empty string → post_treatment_image must also be an empty string
- a number 1-6 → post_treatment_image must be that exact same number

STEP 9 — SCORE EXPLANATION WRITING RULE
score_explanation must be short, patient-facing, and aligned to the final visible report.
Do NOT mention internal scoring mechanics.
Do NOT mention "override".
Do NOT mention "decline suppressed".

Examples:
- if improved: explain what visibly improved
- if stable because visible change is too subtle: explain that some changes are present but not large enough for a larger score movement today
- if stable because temporary worsening/reactivity is visible: explain that treatment-day reactivity may be temporarily visible, so the patient-facing score is kept stable today

Return STRICT JSON only.`
