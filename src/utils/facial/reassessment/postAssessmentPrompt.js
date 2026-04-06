import { encode } from '@toon-format/toon'

// INFO: ------------------- Reassessment -------------------

const reassessment_json_structure = {
  reassessment: {
    skin_type: {
      parameter_name: 'Skin Type',
      before_treatment_score_or_label: '<Enter Skin Type>',
      before_image:
        'Return the  image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label: '<Enter Post-Treatment Skin Type>',
      post_treatment_image:
        'Return the  image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
      result: '< improved or declined or stable>',
      score_semantics: 'label',
      score_polarity: 'label_only',
      comparison_mode: 'label_mapping',
      ideal_score_direction: 'maintain',
    },
    barrier_health: {
      parameter_name: 'Barrier Health',
      before_treatment_score_or_label: '<Enter Barrier Health Status>',
      before_image:
        'Return the  image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label: '<Enter Post-Treatment Barrier Health Status>',
      post_treatment_image:
        'Return the  image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
      result: '< improved or declined or stable>',
      score_semantics: 'severity',
      score_polarity: 'higher_is_worse',
      comparison_mode: 'direct_numeric',
      ideal_score_direction: 'decrease',
    },
    visual_acne_grading: {
      parameter_name: 'Visual Acne Grading',
      before_treatment_score_or_label: '<Enter Acne Grade>',
      before_image:
        'Return the  image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label: '<Enter Post-Treatment Acne Grade>',
      post_treatment_image:
        'Return the  image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
      result: '< improved or declined or stable>',
      score_semantics: 'severity',
      score_polarity: 'higher_is_worse',
      comparison_mode: 'direct_numeric',
      ideal_score_direction: 'decrease',
    },
    skin_sebum_content: {
      parameter_name: 'Skin Sebum Content',
      before_treatment_score_or_label: '<Enter Sebum Level>',
      before_image:
        'Return the  image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label: '<Enter Post-Treatment Sebum Level>',
      post_treatment_image:
        'Return the  image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
      result: '< improved or declined or stable>',
      score_semantics: 'state_spectrum',
      score_polarity: 'distance_to_target',
      comparison_mode: 'target_distance',
      ideal_score_direction: 'move_toward_target',
    },
    vascularity_redness_profiling: {
      parameter_name: 'Vascularity / Redness Profiling',
      before_treatment_score_or_label: '<Enter Redness or Vascularity Score>',
      before_image:
        'Return the  image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label: '<Enter Post-Treatment Redness or Vascularity Score>',
      post_treatment_image:
        'Return the  image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
      result: '< improved or declined or stable>',
      score_semantics: 'severity',
      score_polarity: 'higher_is_worse',
      comparison_mode: 'direct_numeric',
      ideal_score_direction: 'decrease',
    },
    skin_hydration: {
      parameter_name: 'Skin Hydration',
      before_treatment_score_or_label: '<Enter Hydration Level>',
      before_image:
        'Return the  image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label: '<Enter Post-Treatment Hydration Level>',
      post_treatment_image:
        'Return the  image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
      result: '< improved or declined or stable>',
      score_semantics: 'health',
      score_polarity: 'higher_is_better',
      comparison_mode: 'direct_numeric',
      ideal_score_direction: 'increase',
    },
    skin_luminosity_glow_index: {
      parameter_name: 'Skin Luminosity / Glow Index',
      before_treatment_score_or_label: '<Enter Glow Index>',
      before_image:
        'Return the  image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label: '<Enter Post-Treatment Glow Index>',
      post_treatment_image:
        'Return the  image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
      result: '< improved or declined or stable>',
      score_semantics: 'health',
      score_polarity: 'higher_is_better',
      comparison_mode: 'direct_numeric',
      ideal_score_direction: 'increase',
    },
    superficial_pigmentation_score: {
      parameter_name: 'Superficial Pigmentation Score',
      before_treatment_score_or_label: '<Enter Pigmentation Score>',
      before_image:
        'Return the  image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label: '<Enter Post-Treatment Pigmentation Score>',
      post_treatment_image:
        'Return the  image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
      result: '< improved or declined or stable>',
      score_semantics: 'severity',
      score_polarity: 'higher_is_worse',
      comparison_mode: 'direct_numeric',
      ideal_score_direction: 'decrease',
    },
    periorbital_health: {
      parameter_name: 'Periorbital Health',
      before_treatment_score_or_label: '<Enter Periorbital Score>',
      before_image:
        'Return the  image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label: '<Enter Post-Treatment Periorbital Score>',
      post_treatment_image:
        'Return the  image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
      result: '< improved or declined or stable>',
      score_semantics: 'severity',
      score_polarity: 'higher_is_worse',
      comparison_mode: 'direct_numeric',
      ideal_score_direction: 'decrease',
    },
    lip_pigmentation: {
      parameter_name: 'Lip Pigmentation',
      before_treatment_score_or_label: '<Enter Lip Pigmentation Level>',
      before_image:
        'Return the  image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label: '<Enter Post-Treatment Lip Pigmentation Level>',
      post_treatment_image:
        'Return the  image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
      result: '< improved or declined or stable>',
      score_semantics: 'severity',
      score_polarity: 'higher_is_worse',
      comparison_mode: 'direct_numeric',
      ideal_score_direction: 'decrease',
    },
    texture_open_pores_grading: {
      parameter_name: 'Texture / Open Pores Grading',
      before_treatment_score_or_label: '<Enter Texture or Pores Grade>',
      before_image:
        'Return the  image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label: '<Enter Post-Treatment Texture or Pores Grade>',
      post_treatment_image:
        'Return the  image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
      result: '< improved or declined or stable>',
      score_semantics: 'severity',
      score_polarity: 'higher_is_worse',
      comparison_mode: 'direct_numeric',
      ideal_score_direction: 'decrease',
    },
    superficial_wrinkles: {
      parameter_name: 'Superficial Wrinkles',
      before_treatment_score_or_label: '<Enter Wrinkle Score>',
      before_image:
        'Return the  image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label: '<Enter Post-Treatment Wrinkle Score>',
      post_treatment_image:
        'Return the  image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
      result: '< improved or declined or stable>',
      score_semantics: 'severity',
      score_polarity: 'higher_is_worse',
      comparison_mode: 'direct_numeric',
      ideal_score_direction: 'decrease',
    },
    jawline_sagging: {
      parameter_name: 'Jawline Sagging',
      before_treatment_score_or_label: '<Enter Sagging Level>',
      before_image:
        'Return the  image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label: '<Enter Post-Treatment Sagging Level>',
      post_treatment_image:
        'Return the  image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
      result: '< improved or declined or stable>',
      score_semantics: 'severity',
      score_polarity: 'higher_is_worse',
      comparison_mode: 'direct_numeric',
      ideal_score_direction: 'decrease',
    },
    skin_firmness_elasticity_index: {
      parameter_name: 'Skin Firmness Elasticity Index',
      before_treatment_score_or_label: '<Enter Skin Firmness Elasticity Range>',
      before_image:
        'Return the  image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label: '<Enter Post-Treatment Skin Firmness Elasticity Range>',
      post_treatment_image:
        'Return the  image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
      result: '< improved or declined or stable>',
      score_semantics: 'severity',
      score_polarity: 'higher_is_worse',
      comparison_mode: 'direct_numeric',
      ideal_score_direction: 'decrease',
    },
    textural_radiance_index: {
      parameter_name: 'Textural Readiance Index',
      before_treatment_score_or_label: '<Enter Textural Readiance Range>',
      before_image:
        'Return the  image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label: '<Enter Post-Treatment Textural Readiance Range>',
      post_treatment_image:
        'Return the  image number (1-6) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
      result: '< improved or declined or stable>',
      score_semantics: 'severity',
      score_polarity: 'higher_is_better',
      comparison_mode: 'direct_numeric',
      ideal_score_direction: 'increase',
    },
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
Do not change any interpretation methods, scales, or thresholds used earlier.

Compare the current (post-treatment) analysis with the previously generated baseline (before-treatment) results stored in this conversation memory.
For each diagnostic parameter, include both:
- the baseline (before-treatment) value retrieved from your earlier output, and
- the newly analyzed post-treatment value derived from the images provided now.

Strictly follow the predefined JSON structure below and fill all fields:

---
${encode(reassessment_json_structure)}

For all reassessment parameters:
* The result field MUST be one of: improved, declined, or stable.
* If polarity metadata exists in the baseline diagnosis report, the reassessment engine must use that metadata and must not re-infer directionality from general dermatology intuition.
* No explanations, no additional text, no null values

Explicit Comparison Rules:
  if higher_is_better:
    post > baseline usually = improved

  if higher_is_worse:
    post < baseline usually = improved

  if label_only:
    compare using healthy label mapping

  if distance_to_target:
    compare abs(post - target) vs abs(before - target)

REASSESSMENT CONSISTENCY RULE (MANDATORY — STRICT IDENTICAL ONLY):

This reassessment MUST be performed by re-applying the SAME scoring rubric used for the baseline diagnosis
to the NEW post-treatment images. Do NOT estimate deltas or "assume improvement"; instead, SCORE the post-treatment
images independently using the same criteria, scales, and thresholds as baseline.

IDENTICAL-IMAGE GUARDRAIL (ONLY FOR TRUE RE-UPLOADS):
Before scoring, check whether the post-treatment image set is EXACTLY the same as the baseline image set
(i.e., the same images were re-uploaded).

If the post-treatment images are EXACTLY IDENTICAL to baseline (true re-upload / same scan):
- You MUST set every post_treatment_score_or_label equal to the baseline score/label
- You MUST set every result to "stable"
- Do NOT report improvement or decline

If the post-treatment images are NOT exactly identical:
- You MUST compute post_treatment_score_or_label by scoring the post-treatment images (fresh scoring)
- Then compare to baseline to set result = improved / declined / stable

IMPORTANT — IMAGE NUMBER CONSISTENCY RULE:

For every diagnostic parameter, you MUST use the EXACT SAME image number for:
- before_image (baseline)
- post_treatment_image (reassessment)

This rule is absolute.

The image number selected during the baseline diagnosis for a parameter MUST be reused for the post-treatment assessment of the same parameter.

You are NOT allowed to:
- choose a new image number,
- re-evaluate or re-select a different image for post-treatment,
- change the mapping of parameters to images.

You MUST retrieve the original before_image number from the previously generated baseline results in conversation memory and COPY it exactly into the post_treatment_image output.

Therefore:
post_treatment_image MUST ALWAYS BE IDENTICAL TO before_image for the same parameter.

If before_image was:
- an empty string → post_treatment_image must also be an empty string
- a number 1-6 → post_treatment_image must be that exact same number

Do NOT invent, modify, reinterpret, or newly select any image number under any circumstances.

---
`
