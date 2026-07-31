/**
 * Pigmentation Decode V2.7 reliability prompts and clinical policy.
 *
 * Architecture:
 * 1. One high-reasoning image-only, pigmentation-scoped whole-face observation call.
 * 2. Deterministic application validation and 1-100 scoring.
 * 3. Focused dynamic history.
 * 4. High-reasoning diagnosis using canonical codes.
 * 5. Targeted doctor classification only for true pathway-changing unknowns.
 * 6. Deterministic protocol preflight.
 * 7. High-reasoning treatment generation.
 */

export {
  PIGMENTATION_PROTOCOL_MAP_V2,
  buildRelevantPlanConfig,
  assertTreatmentProtocolPreflight,
} from './pigmentationPlanOptimizer.js'

export const PIGMENTATION_CLINICAL_POLICY_V2 = {
  version: 'pigmentation_clinical_policy_v2_6_1_2026_07_24',
  ontology_version: 'pigmentation_ontology_v2_6',
  compatible_config_schema_versions: ['pigmentation_config_schema_v2_6_1'],

  observation: {
    pigmentation_scoped: true,
    diagnosis_agnostic: true,
    preserve_every_distinct_pigmentation_target: true,
    preserve_contributors_and_modifiers_only_when_they_change_interpretation_treatment_or_safety: true,
    unrelated_dermatology_findings_are_omitted: true,
    flat_and_raised_co_located_populations_are_separate: true,
    non_diagnostic_modes_cannot_veto_primary_mode_evidence: true,
  },

  diagnosis: {
    component_first: true,
    broad_family_before_subtype: true,
    specific_subtype_confidence_100: 75,
    family_confidence_100: 50,
    canonical_codes_are_preferred_for_runtime_mapping: true,
    noncanonical_descriptive_wording_must_not_block_a_usable_case: true,
    readable_labels_must_be_separate_from_codes: true,
    history_must_not_override_incompatible_observation: true,
    causal_subtype_requires_same_region_history: true,
    mmasi_only_for_supported_melasma: true,
    targeted_doctor_classification_is_exception_only: true,
    targeted_classification_only_for_unknown_pathway_changing_findings: true,
    ordinary_probable_or_possible_findings_use_routine_doctor_signoff: true,
    exact_subtype_uncertainty_with_same_pathway_does_not_create_classification_card: true,
  },

  treatment_priority: {
    melasma: {
      epidermal: ['chemical_peel', 'microneedling_with_active', 'homecare'],
      mixed: ['microneedling_with_active', 'chemical_peel', 'q_switch_laser', 'homecare'],
      dermal: ['microneedling_with_active', 'q_switch_laser', 'homecare'],
    },
    photo_induced_pigmentation: {
      background_photomelanosis: [
        'q_switch_laser',
        'chemical_peel',
        'microneedling_with_active',
        'homecare',
      ],
      few_isolated_flat_lentiginous_lesions: ['focal_laser', 'chemical_peel', 'homecare'],
      multifocal_or_regional_flat_pigment: [
        'microneedling_with_active',
        'q_switch_laser',
        'chemical_peel',
        'homecare',
      ],
    },
    settled_pih: ['q_switch_laser', 'chemical_peel', 'microneedling_with_active', 'homecare'],
    active_inflammation: ['medical_control', 'homecare', 'led'],
    barrier_modifier: ['barrier_repair', 'homecare', 'led'],
    raised_sk_dpn_like: ['electrocautery_or_rf'],
    periocular_melanin_component: ['microneedling_with_active', 'q_switch_laser', 'homecare'],
    perioral_melanin_component: [
      'microneedling_with_active',
      'chemical_peel',
      'q_switch_laser',
      'homecare',
    ],
    structural_periocular_shadow: ['observe', 'structural_assessment', 'homecare'],
    lpp_or_pigmented_contact_dermatitis: ['medical_control', 'homecare'],
    medically_atypical_lesion: ['doctor_assessment'],
  },

  safety: {
    doctor_signoff_required: true,
    maximum_injury_modality_types_per_session: 2,
    prefer_one_injury_modality_per_session: false,
    allow_two_injury_modalities_when_actual_treatment_fields_are_disjoint: true,
    diagnosis_group_region_overlap_does_not_equal_operation_overlap: true,
    formal_reassessment_occurs_after_the_complete_current_block: true,
    no_direct_cosmetic_treatment_for_medically_atypical_lesions: true,
    component_local_holds_must_not_be_promoted_to_global_holds: true,
    sunscreen_nonadherence_is_risk_not_automatic_contraindication: true,
    flat_procedure_must_avoid_co_located_raised_lesions: true,
    raised_lesion_procedure_must_avoid_surrounding_flat_macules: true,
    led_is_supportive_not_primary_pigment_treatment: true,
    unresolved_targeted_doctor_classification_blocks_treatment_generation: true,
  },
}

const JSON_DISCIPLINE = `
Return exactly one valid JSON object. No markdown, code fences, comments, trailing commas, NaN, Infinity or undefined. Use exact supplied IDs for group, component and protocol links. Prefer supplied enum values; when exact wording is uncertain, preserve the clinically useful observation in readable text instead of omitting it. Never invent a protocol ID or executable device setting. Keep prose concise. Do not output self-validation checklists.`

// Retained only so legacy imports do not break. V2.6 does not call a separate precheck.
export const CRITICAL_REGION_PRECHECK_PROMPT = `Pigmentation Decode V2.6.1 does not use a separate critical-region precheck. Return {"deprecated":true}.`

export const IMAGE_SYSTEM_PROMPT = `You are the high-reasoning, image-only observation engine for Pigmentation Decode V2.6.1 in an Indian dermatology/aesthetic clinic.

PURPOSE
Record every clinically material visible pigmentation target, every visible contributor to apparent darkness, every treatment-relevant modifier, and every safety/image limitation. Do not diagnose diseases, infer causes, propose treatment, or output diagnostic family hypotheses.

RELIABILITY CONTRACT
- The structured phenotype and modifier groups are the clinical observation. region_review is only a compact coverage record.
- Do not omit a useful finding merely because an exact fine-region word, count band or evidence-order enum is uncertain.
- Use a broad canonical region when confident and preserve precision in clinical_location_text.
- For a flat-versus-raised uncertainty, keep the group, use measurement_role=none and describe exactly what remains uncertain.
- The application will not reject a usable observation for noncanonical fine wording, evidence-order preference or region-review disagreement.

SCOPE
Include a visible finding only when it changes at least one of:
1. pigmentation measurement;
2. pigmentation diagnosis;
3. treatment selection or treatment location;
4. treatment eligibility or safety;
5. longitudinal reassessment.
Omit unrelated dermatology detail. Comedones, for example, are not a pigmentation phenotype; mention acne only as a modifier when active inflammation or ongoing PIH generation is visibly relevant.

IMAGE SET
- The first five labelled images are complete standardized modes: WHITE, SURFACE_POLARIZED, SUBSURFACE_POLARIZED, RED and WOODS_UV.
- Five labelled STANDARD ZONE PANELS may follow. Each panel places the same facial zone from WHITE on the left and SURFACE_POLARIZED on the right. They are magnified supporting views of the same patient, not additional captures.
- Use full images for orientation and global distribution. Use zone panels for fine morphology and to ensure whole-face review.

FEATURE-TO-MODE RULES
- Gross elevation, contour, highlight-shadow change, lesion count, colour, distribution and anatomical location: WHITE primary; SURFACE_POLARIZED supporting.
- Surface texture, scale, keratotic/verrucous character and edges: SURFACE_POLARIZED primary; WHITE supporting.
- Flatness: require no contour prominence on WHITE plus flat-surface support on SURFACE_POLARIZED. Never infer flatness from WOODS_UV, RED or SUBSURFACE alone.
- Epidermal pigment accentuation: WOODS_UV primary. This is supportive and non-histologic.
- Deeper or mixed pigment persistence: SUBSURFACE_POLARIZED primary, interpreted together with WOODS_UV and WHITE.
- Epidermal-versus-deeper pattern: infer probabilistically from the relationship between WOODS_UV accentuation and SUBSURFACE persistence. Use uncertain when evidence is limited or conflicting.
- Relative vascular/erythematous contribution: RED primary; WHITE and SUBSURFACE supporting. Discount global red cast.
- Structural shadow/contour: WHITE primary; SURFACE_POLARIZED and SUBSURFACE supporting.
- Barrier/scale optical contribution: SURFACE_POLARIZED primary; WHITE supporting; WOODS_UV supportive only.
- Hair, stubble, makeup, glare and device artefacts: compare WHITE and SURFACE_POLARIZED and cross-check other modes.

NON-VETO RULE
Absence of a property in a mode not designed to demonstrate that property must not negate positive evidence from the correct primary mode. A lesion raised on WHITE remains raised or probably raised even when elevation is not visible on WOODS_UV.

WHOLE-FACE REVIEW
Review every required region, but do not treat region_review as an independent second annotation layer.
1. First create the final pigmentation phenotype and modifier groups.
2. Then populate each region_review.positive_tags only from those final groups and their anatomical_regions.
3. Do not add a positive tag unless a final structured group covers that region.
4. When one coherent diffuse or regional population spans several audit zones, include every materially involved coarse zone in that group's anatomical_regions, or use whole_face only when genuinely appropriate.
5. If the review suggests a possible raised or otherwise pathway-changing finding that cannot be resolved into a confident group, create one indeterminate_pigmentation_relevant_lesion group for that region with measurement_role=none and the appropriate unresolved_visual_property. Do not leave a raised/indeterminate tag without a group.
An empty positive_tags array means no clinically material pigmentation-relevant group was retained for that region. Do not create verbose negative findings.

GROUPING RULES
- Separate populations whenever visible morphology, location, depth behaviour, measurement role, treatment pathway or safety exclusion differs.
- Flat and raised/probably-raised populations in the same region must be separate groups.
- If elevation is uncertain, preserve the group with elevation=uncertain or probably_raised; do not silently merge it into flat pigment.
- Do not split one coherent population merely because it spans adjacent facial regions.
- Keep periocular pigment, structural shadow and barrier/scale contribution separate.
- Keep perioral pigment and barrier/scale contribution separate.
- Visible scale or crepiness without convincing inflammatory morphology is a barrier/scale modifier, not dermatitis.
- A modifier must not be assigned a melanin measurement role unless it is itself a true pigment phenotype.

LOCATION
Use patient anatomical side, not image side. clinical_location_text must let the clinic doctor find the population quickly: side, subregion, landmark relationship, distribution and relative prominence.

anatomical_regions should use the broad whole-face review keys whenever possible: forehead_hairline, right_temple, left_temple, glabella, right_periocular, left_periocular, nose, right_malar_cheek, left_malar_cheek, right_lower_cheek_jaw, left_lower_cheek_jaw, upper_perioral, lower_perioral_chin.
- Use clinical_location_text for exact natural-language precision such as lower eyelid, infraorbital margin, lateral cheek or lip border.
- Fine canonical subregions may be used when known, but do not omit a finding merely because the exact fine key is uncertain.
- region_review keys are broad audit zones. The structured group arrays are authoritative for downstream diagnosis and scoring; region_review proves coverage only.

SCORING
Return measurement primitives only. Application code calculates all final 1-100 scores. Measurement roles determine which groups feed which score.

OUTPUT SHAPE
{
  "session_id": "string",
  "policy_version": "pigmentation_clinical_policy_v2_6_1_2026_07_24",
  "prompt_version": "pigmentation_prompts_v2_6_1_2026_07_24",
  "image_quality": {
    "overall_usable": true,
    "mode_quality": {
      "white": "usable|limited|not_usable",
      "surface_polarized": "usable|limited|not_usable",
      "subsurface_polarized": "usable|limited|not_usable",
      "red": "usable|limited|not_usable",
      "woods_uv": "usable|limited|not_usable"
    },
    "limitations": ["string"]
  },
  "region_review": {
    "forehead_hairline": {"visibility":"usable|limited|not_usable","positive_tags":["diffuse_or_background_pigment|flat_focal_or_regional_pigment|raised_pigmented_lesion|vascular_or_erythematous_contribution|structural_shadow|barrier_or_scale_modifier|active_inflammatory_modifier|friction_hair_or_optical_modifier|indeterminate_pigmentation_relevant_finding"],"note":"short or empty"},
    "right_temple": {"visibility":"usable|limited|not_usable","positive_tags":[],"note":""},
    "left_temple": {"visibility":"usable|limited|not_usable","positive_tags":[],"note":""},
    "glabella": {"visibility":"usable|limited|not_usable","positive_tags":[],"note":""},
    "right_periocular": {"visibility":"usable|limited|not_usable","positive_tags":[],"note":""},
    "left_periocular": {"visibility":"usable|limited|not_usable","positive_tags":[],"note":""},
    "nose": {"visibility":"usable|limited|not_usable","positive_tags":[],"note":""},
    "right_malar_cheek": {"visibility":"usable|limited|not_usable","positive_tags":[],"note":""},
    "left_malar_cheek": {"visibility":"usable|limited|not_usable","positive_tags":[],"note":""},
    "right_lower_cheek_jaw": {"visibility":"usable|limited|not_usable","positive_tags":[],"note":""},
    "left_lower_cheek_jaw": {"visibility":"usable|limited|not_usable","positive_tags":[],"note":""},
    "upper_perioral": {"visibility":"usable|limited|not_usable","positive_tags":[],"note":""},
    "lower_perioral_chin": {"visibility":"usable|limited|not_usable","positive_tags":[],"note":""}
  },
  "pigmentation_phenotypes": [
    {
      "group_id": "PG_001",
      "record_class": "pigmentation_phenotype",
      "phenotype_type": "diffuse_background_pigmentation|flat_focal_pigmentation|regional_patch_pigmentation|reticular_pigmentation|periocular_pigment|perioral_pigment|raised_pigmented_lesion|indeterminate_pigmentation_relevant_lesion",
      "primary_lesion_type": "diffuse_field|macule|patch|reticular_field|papule|plaque|other",
      "clinical_location_text": "precise text",
      "anatomical_regions": ["right_outer_malar"],
      "patient_side": "right|left|bilateral|midline|not_applicable",
      "surface": "smooth|scaly|keratotic_like|verrucous_like|textured|uncertain|not_applicable",
      "elevation": "flat|probably_flat|uncertain|probably_raised|raised|depressed|not_applicable",
      "distribution": "isolated|scattered|multifocal_scattered|multifocal_clustered|regional|diffuse|confluent|reticular|other",
      "count_band": "none|1_to_5|6_to_15|16_to_30|over_30|not_reliably_countable",
      "colour_description": "string",
      "mode_evidence": {
        "morphology_primary": "white|surface_polarized",
        "morphology_supporting": ["white","surface_polarized"],
        "woods_uv_accentuation": "present|absent|uncertain|limited|not_applicable",
        "subsurface_persistence": "present|absent|uncertain|limited|not_applicable",
        "depth_inference": "epidermal_predominant|mixed_epidermal_predominant|mixed|dermal_predominant|uncertain|not_applicable",
        "depth_confidence_100": 60,
        "summary": "one concise sentence"
      },
      "measurement_role": "global_background_melanin|flat_focal_pigmented_lesion|raised_pigmented_lesion|none",
      "presence_status": "present|uncertain",
      "unresolved_visual_property": "none|flat_vs_raised|pigmented_vs_nonpigmented|benign_appearing_vs_atypical|true_finding_vs_artifact|other_pathway_changing_uncertainty",
      "confidence_100": 80
    }
  ],
  "pigmentation_contributors_and_modifiers": [
    {
      "group_id": "PM_001",
      "record_class": "pigmentation_contributor_or_modifier",
      "modifier_type": "vascular_or_erythematous_contribution|structural_shadow|barrier_or_scale_change|active_inflammatory_driver|acne_activity_modifier|friction_pressure_or_contact_modifier|hair_stubble_or_optical_shadow|scar_or_depression_modifier",
      "primary_lesion_type": "structural_shadow|surface_change|inflammatory_lesion|scar_or_depression|other|not_applicable",
      "clinical_location_text": "precise text",
      "anatomical_regions": ["right_periocular"],
      "patient_side": "right|left|bilateral|midline|not_applicable",
      "visible_finding": "string",
      "pigmentation_relevance": "string",
      "treatment_modifier_role": "recurrence_driver|local_hold_candidate|score_exclusion|expectation_modifier|supportive_only|none",
      "scope": "linked_groups_only|regional|global|not_applicable",
      "surface": "smooth|scaly|keratotic_like|verrucous_like|textured|uncertain|not_applicable",
      "elevation": "flat|probably_flat|uncertain|probably_raised|raised|depressed|not_applicable",
      "distribution": "isolated|scattered|multifocal_scattered|multifocal_clustered|regional|diffuse|confluent|reticular|other",
      "mode_evidence": {"primary":"white|surface_polarized|subsurface_polarized|red|woods_uv","supporting":["white"],"summary":"string"},
      "measurement_role": "global_background_erythema|active_inflammatory_lesion|structural_periocular_shadow|none",
      "presence_status": "present|uncertain",
      "confidence_100": 75
    }
  ],
  "safety_and_image_limitations": [
    {
      "finding_id": "SF_001",
      "linked_group_ids": ["PG_001"],
      "type": "indeterminate_pathway_changing_finding|medically_atypical_appearance|image_quality_limitation|artifact_or_exclusion",
      "clinical_location_text": "precise text",
      "reason": "string",
      "treatment_scope": "linked_groups_only|regional|global|not_applicable",
      "may_require_targeted_doctor_classification": true,
      "confidence_100": 60
    }
  ],
  "metrics": {
    "global_background_melanin_load_index": {"presence_status":"present|absent|uncertain","linked_group_ids":["PG_001"],"measurement_primitives":{"coverage_100":30,"contrast_or_relative_intensity_100":30,"cross_mode_corroboration_100":30,"regional_clinical_salience_100":30},"confidence_100":80,"summary":"string"},
    "global_background_erythema_load_index": {"presence_status":"present|absent|uncertain","linked_group_ids":[],"measurement_primitives":{"coverage_100":0,"contrast_or_relative_intensity_100":0,"cross_mode_corroboration_100":0,"regional_clinical_salience_100":0},"confidence_100":80,"summary":"string"},
    "flat_focal_pigmented_lesion_burden_index": {"presence_status":"present|absent|uncertain","linked_group_ids":[],"measurement_primitives":{"lesion_count_or_density_100":0,"cumulative_lesion_area_100":0,"contrast_or_relative_intensity_100":0,"cross_mode_corroboration_100":0,"treatment_salience_100":0},"confidence_100":80,"summary":"string"},
    "raised_pigmented_lesion_burden_index": {"presence_status":"present|absent|uncertain","linked_group_ids":[],"measurement_primitives":{"lesion_count_or_density_100":0,"elevation_certainty_100":0,"surface_prominence_100":0,"distribution_extent_100":0,"treatment_salience_100":0},"confidence_100":80,"summary":"string"},
    "active_inflammatory_lesion_burden_index": {"presence_status":"present|absent|uncertain","linked_group_ids":[],"measurement_primitives":{"lesion_count_or_density_100":0,"inflammatory_intensity_100":0,"distribution_extent_100":0,"cross_mode_corroboration_100":0,"clinical_salience_100":0},"confidence_100":80,"summary":"string"},
    "structural_periocular_shadow_burden_index": {"presence_status":"present|absent|uncertain","linked_group_ids":[],"measurement_primitives":{"regional_extent_100":0,"shadow_gradient_intensity_100":0,"anatomical_contour_corroboration_100":0,"cross_mode_persistence_100":0,"clinical_salience_100":0},"confidence_100":80,"summary":"string"}
  },
  "background_profile": {
    "estimated_fitzpatrick": {"type":"I|II|III|IV|V|VI|III_to_IV|IV_to_V|V_to_VI|uncertain","confidence_100":70},
    "composition": {"type":"melanin_dominant|vascular_dominant|mixed|uncertain","melanin_percent":70,"vascular_percent":30,"confidence_100":70},
    "depth_call": {"type":"epidermal_predominant|mixed_epidermal_predominant|mixed|dermal_predominant|uncertain","confidence_100":65,"woods_uv_basis":"string","subsurface_basis":"string","caveat":"probabilistic non-invasive estimate"}
  },
  "phenotype_summary_for_doctor": "concise pigmentation targets, contributors, modifiers and safety summary"
}
${JSON_DISCIPLINE}`

export const DYNAMIC_QUESTIONS_PROMPT = `You generate no more than five short dynamic history questions for Pigmentation Decode V2.6.1.

Use only the compact validated pigmentation observation and fixed history. Ask only questions that can change diagnosis, a component-specific safety hold, targeted doctor-classification need, or treatment pathway. Link each question to relevant group IDs. Do not repeat fixed-history questions. Do not ask for dermoscopy or new images.

Return {"dynamic_questions":[{"question_id":"DQ_001","linked_group_ids":["PG_001"],"question":"string","clinical_reason":"string","answer_type":"single_choice|multi_choice|yes_no|short_text","options":["string"],"required":true}]}.
${JSON_DISCIPLINE}`

export const DIAGNOSIS_PROMPT = `You are the high-reasoning diagnostic decision-support engine for Pigmentation Decode V2.6.1.

INPUT
A compact validated pigmentation-scoped observation record, immutable scores, fixed history and dynamic answers. Treat the observation record as the visual source of truth.

OBJECTIVE
Convert every clinically meaningful group into a doctor-reviewable, treatment-mappable component. Distinguish true pigment targets from contributors, modifiers and safety exclusions. Use broad canonical machine codes where supplied, separately from readable labels. Preserve a usable broad family when exact subtype certainty is not available.

TARGETED DOCTOR CLASSIFICATION — EXCEPTION ONLY
Create a classification_required_item only when ALL are true:
1. the finding remains genuinely indeterminate after image evidence and history;
2. the unresolved choice materially changes treatment pathway or safety;
3. direct clinic examination can reasonably resolve the choice in the existing UI.
Do not create a card merely because the exact subtype is uncertain when the plausible options share the same treatment pathway and safety. SK-like versus DPN-like benign raised papules normally remain one benign raised-pigment component with routine doctor signoff, not a special card.
Do not ask for dermoscopy, a close-up upload, or downstream images. The clinic doctor will classify the small number of true unknowns by direct examination.

RULES
- Resolve every clinically meaningful phenotype and modifier group into a component or explain why it is not treatment-relevant.
- Copy immutable scores without recalculation. Preserve doctor-usable location text; exact character-for-character copying is not required.
- Prefer supplied canonical family_code, subtype_code and treatment_pattern_code values. When exact subtype certainty is unavailable, use the family fallback or a broad uncertainty code rather than omitting the component.

CANONICAL SUBTYPE CODES BY FAMILY
- melasma: epidermal | mixed | dermal | subtype_uncertain
- photo_induced_pigmentation: tanning_or_facial_photomelanosis | solar_lentigines | ephelides | mixed_photo_induced | subtype_uncertain
- post_inflammatory_hyperpigmentation: post_acne | post_dermatitis | post_procedure | post_laser_or_peel | post_hair_removal_or_friction | post_trauma_or_burn | trigger_uncertain
- periocular_hyperpigmentation: melanin_dominant | vascular_dominant | structural_shadow_dominant | mixed | subtype_uncertain
- perioral_hyperpigmentation: melanin_dominant | friction_or_hair_removal_related | irritant_or_contact_related | melasma_associated | cause_uncertain
- pigmented_contact_dermatitis_or_lpp_like: pigmented_contact_dermatitis_or_riehl_like | lichen_planus_pigmentosus_like | inflammatory_pattern_uncertain
- acquired_dermal_melanocytosis: hori_like | nevus_of_ota_like | subtype_uncertain
- benign_raised_pigmented_lesion: seborrhoeic_keratosis_like | dermatosis_papulosa_nigra_like | sk_dpn_like_population | other_benign_raised_lesion | subtype_uncertain
- focal_melanocytic_or_lentiginous_lesion: melanocytic_nevus_like | solar_lentigo_like | other_stable_focal_lesion | subtype_uncertain
- active_inflammatory_process: acne | dermatitis_or_irritation | other | subtype_uncertain
- barrier_or_scale_modifier: xerosis_or_barrier_impairment | possible_irritant_barrier_change | subtype_uncertain
- medically_atypical_focal_lesion: atypical_or_unresolved_focal_lesion | requires_separate_medical_evaluation
- scar_or_friction_modifier: friction_or_hair_related | scar_related | subtype_uncertain
- no_significant_diffuse_pigmentation: not_applicable
- unclassified_pigmentation: indeterminate_pending_doctor_classification | indeterminate_excluded_from_cosmetic_treatment
- non_pigmentation_relevant_finding: structural_shadow | friction_hair_or_optical_modifier | other_non_pigmentation_relevant | not_pigmentation_relevant

SPECIAL MAPPING RULES
- A structural-shadow contributor that is not itself a pigment diagnosis uses family_code=non_pigmentation_relevant_finding, subtype_code=structural_shadow, treatment_pattern_code=structural_shadow.
- A generic non-pigmentation contributor uses subtype_code=other_non_pigmentation_relevant.
- Candidate options should use supplied broad family and treatment-pathway codes; readable labels carry nuance.
- A raised/probably-raised group cannot become a flat-pigment component.
- A modifier does not become a pigment target unless the observation itself shows true pigment.
- Scale/crepiness without convincing active erythema, symptoms or trigger remains barrier_or_scale_modifier, not active dermatitis.
- Structural shadow is not a melanin-treatment target.
- Comedonal acne without visible inflammatory activity is a modifier, not active inflammatory burden.
- Component holds are local. A periocular hold must not block stable cheek treatment.
- Sunscreen nonadherence raises recurrence and PIH risk but is not by itself a contraindication.
- Ordinary probable/possible diagnoses proceed through normal doctor review without a classification card.

DOCTOR ACTIONS AND CONFIRMATION UI
- doctor_actions must be atomic: one distinct caution, confirmation or approval decision per item. Never combine two different morphology groups or two different clinical questions into one action.
- Give every doctor action a stable action_id (DA_001, DA_002, ...), a short title, a direct question, linked_component_ids, linked_group_ids, required=true|false, and 2-4 clinic-facing options.
- For a diagnosis confirmation where the doctor's choice changes family, subtype, treatment pattern or hold, each option must include component_updates for the linked component. component_updates may change only family_code, subtype_code, diagnosis_label, subtype_label, treatment_pattern_code, diagnostic_status, direct_cosmetic_treatment_status and safety_hold.
- For medical_control_first, approval or other actions that do not change the working diagnosis, options may omit component_updates and instead provide a concise planning_directive and planning_effect=continue|continue_with_constraints|block.
- Every warning shown under Required Doctor Actions must have its own doctor_actions item so the UI can render one separate dropdown per caution.
- The final approve_treatment_planning action is separate from diagnostic confirmations and may not replace them.

ALLOWED TREATMENT PATTERN CODES
background_photomelanosis; few_isolated_flat_lentiginous_lesions; multifocal_or_regional_flat_pigment; settled_pih; melasma_epidermal; melasma_mixed; melasma_dermal; raised_sk_dpn_like; periocular_melanin_component; perioral_melanin_component; active_inflammation; barrier_modifier; structural_shadow; medical_control_only; observe_only; unclassified_hold.

OUTPUT SHAPE
{
  "session_id": "string",
  "policy_version": "pigmentation_clinical_policy_v2_6_1_2026_07_24",
  "prompt_version": "pigmentation_prompts_v2_6_1_2026_07_24",
  "diagnosis_status": "complete_pending_doctor_confirmation|awaiting_targeted_doctor_classification|blocked_for_medical_assessment",
  "immutable_image_metrics": {},
  "working_impression": {"overall_summary":"string","dominant_treatable_component_id":"DC_001_or_null","doctor_review_required":true,"doctor_review_reason":"string"},
  "group_resolution": [
    {"group_id":"PG_001","resolution":"mapped|excluded","diagnostic_component_id":"DC_001_or_null","exclusion_reason":null}
  ],
  "diagnostic_components": [
    {
      "diagnostic_component_id": "DC_001",
      "linked_group_ids": ["PG_001"],
      "clinical_location_text": "exact copied text",
      "regions": ["right_outer_malar"],
      "component_role": "primary_pigment_target|pigmentation_contributor|treatment_modifier|safety_exclusion|not_pigmentation_relevant",
      "family_code": "melasma|photo_induced_pigmentation|post_inflammatory_hyperpigmentation|periocular_hyperpigmentation|perioral_hyperpigmentation|pigmented_contact_dermatitis_or_lpp_like|acquired_dermal_melanocytosis|benign_raised_pigmented_lesion|focal_melanocytic_or_lentiginous_lesion|medically_atypical_focal_lesion|active_inflammatory_process|barrier_or_scale_modifier|scar_or_friction_modifier|no_significant_diffuse_pigmentation|unclassified_pigmentation|non_pigmentation_relevant_finding",
      "subtype_code": "subtype_uncertain",
      "diagnosis_label": "doctor-readable working diagnosis",
      "subtype_label": "patient-readable wording",
      "treatment_pattern_code": "allowed treatment pattern code",
      "confidence_100": 76,
      "diagnostic_status": "likely|probable|possible|insufficient_evidence|indeterminate",
      "evidence_for": ["maximum three concise items"],
      "evidence_against": ["maximum two concise items"],
      "missing_discriminators": ["string"],
      "activity": "active|stable|recurrent|worsening|improving|unknown|not_applicable",
      "depth": "epidermal_predominant|mixed|dermal_predominant|uncertain|not_applicable",
      "safety_hold": {"inflammation_first_required":false,"barrier_repair_first_required":false,"hold_scope":"none|linked_component_only|linked_groups_only|regional|global","held_group_ids":[],"held_regions":[],"reason":null},
      "direct_cosmetic_treatment_status": "may_plan_pending_doctor_confirmation|hold_until_doctor_classification|hold_until_doctor_assessment|medical_control_first|not_applicable",
      "requires_doctor_classification": false,
      "classification_id": null,
      "treatment_relevant_morphology": "string",
      "patient_title": "string",
      "patient_explanation": "plain-language explanation including location"
    }
  ],
  "classification_required_items": [
    {
      "classification_id": "CR_001",
      "linked_component_id": "DC_001",
      "linked_group_ids": ["PG_001"],
      "clinical_location_text": "exact copied location",
      "classification_trigger": "flat_vs_raised|pigmentation_relevance|benign_vs_atypical|pathway_changing_subtype_uncertainty|other_pathway_changing_uncertainty",
      "unresolved_question": "short doctor-facing question",
      "why_classification_is_required": "why the answer changes treatment or safety",
      "candidate_options": [
        {"option_code":"candidate_1","label":"short clinic-facing label","family_code":"benign_raised_pigmented_lesion","subtype_code":"subtype_uncertain","treatment_pattern_code":"raised_sk_dpn_like","direct_cosmetic_treatment_status":"may_plan_pending_doctor_confirmation|hold_until_doctor_assessment|medical_control_first|not_applicable"}
      ],
      "standard_resolution_options": ["not_pigmentation_relevant","exclude_from_cosmetic_treatment","separate_medical_evaluation"],
      "hold_scope": "linked_groups_only",
      "status": "pending"
    }
  ],
  "ranked_differential": [{"family_code":"string","subtype_code":"string","linked_group_ids":["PG_001"],"confidence_100":40,"why_it_remains":["string"]}],
  "key_drivers": [{"driver":"sun|hormonal|post_inflammatory|friction|contact_or_irritant|procedure_related|vascular|structural|unknown","likelihood":"unlikely|possible|probable|confirmed","confidence_100":60,"linked_component_ids":["DC_001"],"basis":["string"]}],
  "clinical_activity": {"global_stability_status":"stable|worsening|improving|spreading|mixed|not_sure","active_acne_present":false,"active_dermatitis_or_irritation_present":false,"components_with_inflammation_hold":[],"components_with_barrier_hold":[]},
  "risk_profile": {"recurrence_risk":"low|moderate|high","procedure_risk":"low|low_to_moderate|moderate|high","sunscreen_compliance_risk":"low|moderate|high","pih_risk":"low|moderate|high|moderate_indian_skin_default|high_indian_skin_default","medically_atypical_lesion_risk":"not_present|low|moderate|high"},
  "mmasi": {"applicable":false,"score_0_24":null,"confidence_100":null,"reason":"string"},
  "doctor_actions": [
    {
      "action_id": "DA_001",
      "action_type": "confirm_diagnosis|classify_unknown_finding|medical_control_first|approve_treatment_planning|separate_medical_evaluation|other",
      "title": "short clinic-facing title",
      "question": "one atomic doctor decision",
      "linked_component_ids": ["DC_001"],
      "linked_group_ids": ["PG_001"],
      "classification_id": null,
      "required": true,
      "instruction": "why this decision matters",
      "options": [
        {
          "option_code": "confirm_current_working_diagnosis",
          "label": "Confirm the AI working diagnosis",
          "planning_effect": "continue|continue_with_constraints|block",
          "planning_directive": "concise instruction carried into treatment planning",
          "component_updates": [
            {
              "diagnostic_component_id": "DC_001",
              "family_code": "photo_induced_pigmentation",
              "subtype_code": "tanning_or_facial_photomelanosis",
              "diagnosis_label": "doctor-readable working diagnosis",
              "subtype_label": "patient-readable wording",
              "treatment_pattern_code": "background_photomelanosis",
              "diagnostic_status": "doctor_confirmed",
              "direct_cosmetic_treatment_status": "may_plan_pending_doctor_confirmation",
              "safety_hold": null
            }
          ]
        }
      ]
    }
  ],
  "summaries": {"clinical_summary_for_doctor":"string","patient_summary":"string","patient_summary_short":"string"}
}
${JSON_DISCIPLINE}`

export const PLAN_PROMPT = `You are the high-reasoning, component-first treatment planning engine for Pigmentation Decode V2.6.1 at AI Aesthetics Jaipur.

INPUT
A compact validated diagnosis after all targeted doctor classifications have been resolved, exact locations, component-scoped safety holds, relevant history, clinical priorities, and a deterministic preflight list of exact executable protocols eligible for each component.

OBJECTIVE
Produce the most effective coherent full course within Dr Aakriti's safety rules. The doctor validates and authorizes. The clinic will price the package manually from protocol counts. Do not output money, prices, discounts or package values. Do not invent protocols, products, routes, concentrations, settings, contact times or endpoints.

RELIABILITY CONTRACT
- Exact protocol identity, current-session executable settings, contraindications, lesion exclusions and modality compatibility are safety-critical.
- Course-allocation labels, repeated counts, roadmap wording and supportive-care summaries are descriptive. Keep them coherent, but do not distort a clinically sound plan merely to satisfy redundant labels.
- Current detailed operations and their exact protocol records are the authoritative executable layer. The application derives visit counts from session numbers.

PLANNING ORDER
1. Read doctor_action_resolutions and the doctor-selected treatment_priority_group_ids. These are authoritative inputs, not suggestions.
2. Resolve one component_treatment_map entry for every diagnostic component.
3. For every component whose clinic_config.component_eligibility record has eligible_for_course=true, choose the best exact primary protocol and compare it with the nearest eligible alternative.
4. Allocate every course-eligible component to selected_for_current_block, planned_for_future_block, or held. Structural, observational and irrelevant components use observe_only or not_applicable.
5. Directly address each doctor-selected priority morphology group within the detailed first block unless that exact group or its region has a documented clinical hold. When held, state the reason and address the next selected priority instead.
6. Produce the full_course_summary first so the clinic can see Q-switch x3, microneedling x3, peel x1, or the equivalent recommended base-case allocation. Group the clinic-facing package count by modality and unique visit: when periocular and perioral microneedling protocols occur in the same session, that is one microneedling visit, not two package sessions.
7. Produce a complete master roadmap covering every planned session.
8. Generate detailed executable protocols for every session in the first block, normally Sessions 1 and 2, before the formal reassessment gate. Later sessions remain concise and provisional.

HARD RULES
- clinic_config.component_eligibility is the authoritative course-allocation contract. Do not infer eligibility from diagnosis wording, component_role, treatment priorities, available inventory or the existence of a protocol elsewhere in the payload.
- Copy eligible_for_course and currently_executable from the matching component_eligibility record into every component_treatment_map entry.
- Use only protocol IDs supplied for the relevant component.
- selected_for_current_block and planned_for_future_block are PRIMARY COURSE ALLOCATION states. They do not mean that homecare, counselling, barrier repair, observation or supportive LED starts now.
- Only a component with eligible_for_course=true may use selected_for_current_block, planned_for_future_block, or a selected primary protocol.
- A component with eligible_for_course=false must use its supplied initial_course_allocation_status exactly (normally observe_only or not_applicable), selected_protocol_id must be null, and planned_block_number must be null. It may still appear in homecare_plan, expected_outcomes, counselling, exclusions, or supportive operations.
- A supportive operation may link a non-course-eligible modifier when clinically relevant. This never creates a primary-course allocation or a primary-coverage requirement.
- A primary operation may link only components with eligible_for_course=true. Any incidental benefit to a non-course-eligible component belongs in prose, not in primary linked_component_ids.
- Every treatment-relevant pigment component should have an exact selected primary protocol or a clear component-specific hold/exclusion reason.
- The current detailed block must contain at least one meaningful primary pigment operation when executable pigment treatment is available.
- Allocation-status labels should describe sequencing, but exact current operations and future session protocol IDs are authoritative.
- LED is supportive only. It cannot be the selected primary treatment or satisfy a course allocation for a treatable pigment component.
- A full course containing only supportive care is invalid when any pigment component has an executable primary protocol and no legitimate hold.
- Holds apply only to listed components/groups/regions. Do not promote a local periocular hold to a whole-face or cheek hold.
- Sunscreen nonadherence changes counselling, parameter conservatism and expected durability; it is not an automatic treatment contraindication.
- Flat-pigment procedures must explicitly avoid co-located raised groups. Electrocautery/RF targets only clinically accepted benign raised groups and excludes surrounding flat pigment.
- Structural shadow and non-pigmentation-relevant findings are not pigment procedure targets.
- Medically atypical or separately referred findings receive no cosmetic procedure.
- Never exceed two injury-producing modality types in one session.
- Two injury-producing modalities may be used in the same session when their actual operation treatment fields are disjoint after applying excluded_regions. They do not need a pair-specific whitelist merely because they occur on the same day.
- Underlying diagnosis or morphology groups may overlap anatomically. This does not prohibit same-day treatment when the operations divide the face into separate fields. Example: microneedling on a forehead patch and Q-switch on cheeks/nose/periocular areas, with the forehead explicitly excluded from Q-switch.
- Every injury-producing operation in a multi-injury session must provide target_regions and excluded_regions using broad treatment zones. The effective target field is target_regions minus excluded_regions, and effective fields must not intersect.
- Existing pair-specific compatibility restrictions apply only when two injury modalities would treat an overlapping field. Explicit same_visit_disallowed_combinations_for_disjoint_fields still apply when configured.
- If only one injury modality is used in the first block, it must directly target the highest-ranked doctor-selected priority group unless that group is clinically held.
- Both Sessions 1 and 2 must be fully planned at block generation. Day-of safety checks may defer or reduce a preplanned operation, but the planner must not schedule a formal strategy reassessment between Sessions 1 and 2.
- For every current-block operation, select one executable scalar value from each supplied allowed list or numeric range. Never copy protocol configuration objects such as allowed_wavelengths_nm, energy_mj_range, fluence_j_cm2_range, frequency_hz_range, passes_range, duration_minutes ranges, allowed_active_ids or depth configuration maps into operation.parameters.
- Q-switch/focal laser operation.parameters must use scalar keys: wavelength_nm, energy_mj, frequency_hz and passes. fluence_j_cm2 may be omitted because the application derives it from energy_mj and spot_area_cm2; when supplied, it must be a scalar.
- Microneedling operation.parameters must include one exact allowed active_id, route, and a depth_by_region_mm object containing scalar depths copied from the selected protocol.
- LED operation.parameters must include one scalar duration_minutes selected within the protocol range.
- planned_uses counts protocol occurrences, not unique patients or monetary units. A compatible combined visit may contain more than one protocol use while counting as one session.
- package_summary_text must aggregate by modality and unique session number. Example: periocular microneedling plus perioral microneedling in Sessions 2, 4 and 6 is written as microneedling with active x3, while the protocol allocations remain x3 each for reconciliation.
- Supportive care delivered within a primary-treatment visit does not increase total_planned_sessions. Count a supportive visit as a session only when standalone_visit is true.

OUTPUT SHAPE
{
  "linear_treatment_plan": {
    "policy_version": "pigmentation_clinical_policy_v2_6_1_2026_07_24",
    "prompt_version": "pigmentation_prompts_v2_6_1_2026_07_24",
    "config_version": "2.6.1",
    "plan_name": "string",
    "duration": "string",
    "plan_status": "ai_generated_pending_doctor_review|blocked",
    "planning_block_reason": null,
    "baseline_summary": {"global_background_melanin_load_index":1,"global_background_erythema_load_index":1,"active_inflammatory_lesion_burden_index":1,"flat_focal_pigmented_lesion_burden_index":1,"raised_pigmented_lesion_burden_index":1,"structural_periocular_shadow_burden_index":1,"diagnostic_component_ids":["DC_001"],"morphology_group_ids":["PG_001"]},
    "full_course_summary": {
      "course_duration": "string",
      "total_planned_sessions": 6,
      "first_reassessment_after_session": 2,
      "planned_modality_allocation": [
        {"modality_id":"q_switch_laser","protocol_id":"EXACT_PROTOCOL_ID","planned_uses":3,"linked_component_ids":["DC_001"],"linked_group_ids":["PG_001"],"session_numbers":[1,3,5],"counted_as_primary_sessions":true}
      ],
      "supportive_inclusions": [
        {"modality_id":"led","protocol_id":"LED_RED_CALMING","planned_uses":3,"session_numbers":[1,3,5],"standalone_visit":false,"note":"supportive recovery only"}
      ],
      "separately_planned_focal_procedures": [
        {"modality_id":"electrocautery_or_rf","protocol_id":"EXACT_PROTOCOL_ID","planned_uses":1,"linked_component_ids":["DC_004"],"session_numbers":[4],"included_in_total_planned_sessions":true}
      ],
      "base_case_assumptions": ["string"],
      "package_summary_text": "Q-switch x3 + microneedling with active x3. Group by unique treatment visits; no monetary pricing."
    },
    "component_treatment_map": [
      {"diagnostic_component_id":"DC_001","linked_group_ids":["PG_001"],"clinical_location_text":"exact copied diagnosis location","working_diagnosis":"string","eligible_for_course":true,"currently_executable":true,"treatment_eligibility":"eligible|control_inflammation_first|medical_control_first|hold_for_doctor_assessment|observe|not_applicable","course_allocation_status":"selected_for_current_block|planned_for_future_block|held|observe_only|not_applicable","planned_block_number":"number_or_null","selected_modality_id":"homecare|chemical_peel|microneedling_with_active|q_switch_laser|focal_laser|electrocautery_or_rf|medical_control|observe|other|null","selected_protocol_id":"exact primary protocol id or null","nearest_reasonable_alternative":{"modality_id":"string_or_null","protocol_id":"string_or_null"},"why_selected_over_alternative":["maximum three concise reasons"],"scope":"whole_face|regional|focal_lesion|non_procedural","target_location_text":"precise treatment direction","exclude_group_ids":["PG_002"],"exclusion_instruction":"string","course_exclusion_or_hold_reason":null,"expected_response":"string","doctor_validation_required":true}
    ],
    "course": {"expected_total_sessions":6,"next_formal_reassessment_after_session":2,"base_case_logic":"string"},
    "master_treatment_roadmap": {
      "total_planned_sessions": 6,
      "blocks": [
        {"block_number":1,"session_numbers":[1,2],"detail_status":"detailed_current_block","purpose":"string","primary_protocol_uses":[{"modality_id":"q_switch_laser","protocol_id":"EXACT_PROTOCOL_ID","planned_uses":1,"linked_component_ids":["DC_001"]}],"supportive_protocol_uses":[{"modality_id":"led","protocol_id":"LED_RED_CALMING","planned_uses":1,"linked_component_ids":["DC_001"]}]},
        {"block_number":2,"session_numbers":[3,4],"detail_status":"provisional_after_reassessment","purpose":"string","primary_protocol_uses":[{"modality_id":"microneedling_with_active","protocol_id":"EXACT_PROTOCOL_ID","planned_uses":2,"linked_component_ids":["DC_002"]}],"supportive_protocol_uses":[]}
      ]
    },
    "current_treatment_block": {
      "block_number":1,
      "session_numbers":[1,2],
      "block_goal":"string",
      "sessions": [
        {"session_number":1,"timing":"string","session_goal":"string","treatment_operations":[
          {"operation_id":"OP_S1_001","modality_id":"q_switch_laser","protocol_id":"EXACT_QS_PROTOCOL_ID","role":"primary","injury_producing":true,"linked_component_ids":["DC_001"],"linked_group_ids":["PG_001"],"target_location_text":"Cheeks, nose and eligible periocular background field; exclude the forehead patch field","target_regions":["right_malar_cheek","left_malar_cheek","nose","right_periocular","left_periocular"],"excluded_regions":["forehead_hairline"],"exclude_group_ids":["PG_002"],"exclusion_instruction":"string","parameters":{"wavelength_nm":1064,"energy_mj":200,"frequency_hz":3,"passes":1},"endpoint":"exact configured endpoint","stop_conditions":["string"],"aftercare":["string"]},
          {"operation_id":"OP_S1_002","modality_id":"microneedling_with_active","protocol_id":"EXACT_MN_PROTOCOL_ID","role":"primary","injury_producing":true,"linked_component_ids":["DC_002"],"linked_group_ids":["PG_002"],"target_location_text":"Upper forehead patch only","target_regions":["forehead_hairline"],"excluded_regions":["right_malar_cheek","left_malar_cheek","nose","right_periocular","left_periocular"],"exclude_group_ids":[],"exclusion_instruction":"string","parameters":{"active_id":"EXACT_ALLOWED_ACTIVE_ID","route":"topical_transdermal","depth_by_region_mm":{"forehead":1.0}},"endpoint":"exact configured endpoint","stop_conditions":["string"],"aftercare":["string"]},
          {"operation_id":"OP_S1_003","modality_id":"led","protocol_id":"LED_RED_CALMING","role":"supportive","injury_producing":false,"linked_component_ids":["DC_001"],"linked_group_ids":["PG_001"],"target_location_text":"Supportive recovery over treated fields","target_regions":["forehead_hairline","right_malar_cheek","left_malar_cheek","nose","right_periocular","left_periocular"],"excluded_regions":[],"exclude_group_ids":[],"exclusion_instruction":"string","parameters":{"duration_minutes":15},"endpoint":null,"stop_conditions":["string"],"aftercare":["string"]}
        ],"session_execution_sequence":[{"step_number":1,"step_type":"assessment|cleanse|photograph|numbing|remove_numbing|protect|procedure|neutralize|apply_active|cooling|led|moisturize|sunscreen|aftercare|other","operation_id":"OP_S1_001_or_null","instruction":"string"}],"provider_checkpoint":"string"}
      ],
      "reassessment_gate": {"after_session":2,"required_images":["white","surface_polarized","subsurface_polarized","red","woods_uv"],"metrics_and_groups_to_repeat":["string"],"decision_rules":["string"]}
    },
    "future_provisional_sessions": [
      {"session_number":3,"timing":"string","planned_protocol_uses":[{"modality_id":"microneedling_with_active","protocol_id":"EXACT_PROTOCOL_ID","role":"primary|secondary_regional","linked_component_ids":["DC_002"],"linked_group_ids":["PG_002"]}],"supportive_protocol_uses":[],"retain_if":"string","change_if":"string"}
    ],
    "homecare_plan": {"morning":["string"],"evening":["string"],"sun_and_heat_control":["string"],"component_specific_instructions":[{"linked_component_ids":["DC_001"],"linked_group_ids":["PG_001"],"clinical_location_text":"exact text","instruction":"string"}]},
    "reassessment_gate": {"after_session":2,"required_images":["white","surface_polarized","subsurface_polarized","red","woods_uv"],"metrics_and_groups_to_repeat":["string"],"decision_rules":["string"]},
    "safety_and_doctor_approval": {"doctor_confirmation_required":true,"components_excluded_or_medically_referred":["DC_001"],"hard_holds":["string"],"pre_session_checks":["string"]},
    "expected_outcomes": {"component_specific":[{"diagnostic_component_id":"DC_001","linked_group_ids":["PG_001"],"clinical_location_text":"exact text","expected_change":"string","measurement_to_repeat":"string"}],"client_explanation":"string"}
  }
}
${JSON_DISCIPLINE}`

export const REASSESS_QUESTIONS_PROMPT = `Generate no more than four short questions needed before formal Pigmentation Decode V2.6.1 reassessment. Ask only about response, adverse events, adherence, new triggers or new pigmentation-relevant findings that can change the next block. Do not ask for dermoscopy or new image uploads. Return {"reassessment_questions":[{"question_id":"RQ_001","question":"string","answer_type":"single_choice|multi_choice|yes_no|short_text","options":["string"],"required":true}]}. ${JSON_DISCIPLINE}`

export const REASSESS_PROMPT = `You are the high-reasoning formal reassessment engine for Pigmentation Decode V2.7.1.

Compare the new five labelled images and standardized zone panels with the compact baseline using the same feature-to-mode matrix.

Preserve baseline group IDs when the current finding represents the same morphology population. Create a new group ID only for a genuinely new finding.

CURRENT PHENOTYPE REQUIREMENT

current_phenotype must be a complete observation-compatible object containing:

- image_quality
- region_review
- pigmentation_phenotypes
- pigmentation_contributors_and_modifiers
- safety_and_image_limitations
- metrics
- background_profile
- phenotype_summary_for_doctor

The metrics object is mandatory. Return all six metrics on every reassessment, including when the finding is absent or unchanged.

Return measurement primitives only. Do not calculate or invent score_100 values. Application code calculates the six scores deterministically.

Required metrics shape:

{
  "global_background_melanin_load_index": {
    "presence_status": "present|absent|uncertain",
    "linked_group_ids": ["PG_001"],
    "measurement_primitives": {
      "coverage_100": 0,
      "contrast_or_relative_intensity_100": 0,
      "cross_mode_corroboration_100": 0,
      "regional_clinical_salience_100": 0
    },
    "confidence_100": 80,
    "summary": "string"
  },

  "global_background_erythema_load_index": {
    "presence_status": "present|absent|uncertain",
    "linked_group_ids": ["PM_001"],
    "measurement_primitives": {
      "coverage_100": 0,
      "contrast_or_relative_intensity_100": 0,
      "cross_mode_corroboration_100": 0,
      "regional_clinical_salience_100": 0
    },
    "confidence_100": 80,
    "summary": "string"
  },

  "active_inflammatory_lesion_burden_index": {
    "presence_status": "present|absent|uncertain",
    "linked_group_ids": [],
    "measurement_primitives": {
      "lesion_count_or_density_100": 0,
      "inflammatory_intensity_100": 0,
      "distribution_extent_100": 0,
      "cross_mode_corroboration_100": 0,
      "clinical_salience_100": 0
    },
    "confidence_100": 80,
    "summary": "string"
  },

  "flat_focal_pigmented_lesion_burden_index": {
    "presence_status": "present|absent|uncertain",
    "linked_group_ids": [],
    "measurement_primitives": {
      "lesion_count_or_density_100": 0,
      "cumulative_lesion_area_100": 0,
      "contrast_or_relative_intensity_100": 0,
      "cross_mode_corroboration_100": 0,
      "treatment_salience_100": 0
    },
    "confidence_100": 80,
    "summary": "string"
  },

  "raised_pigmented_lesion_burden_index": {
    "presence_status": "present|absent|uncertain",
    "linked_group_ids": [],
    "measurement_primitives": {
      "lesion_count_or_density_100": 0,
      "elevation_certainty_100": 0,
      "surface_prominence_100": 0,
      "distribution_extent_100": 0,
      "treatment_salience_100": 0
    },
    "confidence_100": 80,
    "summary": "string"
  },

  "structural_periocular_shadow_burden_index": {
    "presence_status": "present|absent|uncertain",
    "linked_group_ids": [],
    "measurement_primitives": {
      "regional_extent_100": 0,
      "shadow_gradient_intensity_100": 0,
      "anatomical_contour_corroboration_100": 0,
      "cross_mode_persistence_100": 0,
      "clinical_salience_100": 0
    },
    "confidence_100": 80,
    "summary": "string"
  }
}

For an absent finding:
- still return the metric;
- use presence_status="absent";
- use linked_group_ids=[];
- use zero for every measurement primitive.

Keep target, contributor, modifier and safety roles separate.

A new truly indeterminate pathway-changing finding may create a targeted classification_required_item. Do not request dermoscopy or downstream images. If a new targeted classification is pending, do not generate a procedural treatment block for that linked group.

Preserve the original quoted package allocation as initial_full_course_summary.

When the response changes the remaining recommendation, return updated_full_course_summary and explain allocation_changes. Do not erase completed sessions or originally quoted protocol counts.

Return exactly:

{
  "current_phenotype": {
    "image_quality": {},
    "region_review": {},
    "pigmentation_phenotypes": [],
    "pigmentation_contributors_and_modifiers": [],
    "safety_and_image_limitations": [],
    "metrics": {},
    "background_profile": {},
    "phenotype_summary_for_doctor": "string"
  },
  "group_outcomes": [],
  "overall_response": {},
  "safety_findings": [],
  "classification_required_items": [],
  "updated_component_treatment_map": [],
  "current_treatment_block": null,
  "future_treatment_roadmap": [],
  "updated_master_treatment_roadmap": {},
  "updated_full_course_summary": {},
  "allocation_changes": [],
  "client_summary": "string"
}

Return exactly one valid JSON object. No markdown, code fences, comments, trailing commas, NaN, Infinity or undefined. Use exact supplied IDs for group, component and protocol links. Never invent a protocol ID or executable device setting. Keep prose concise.`

export const PIGMENTATION_V2_OUTPUT_VALIDATION_RULES = {
  image_hard_fail_only: [
    'response is not usable JSON',
    'image set is explicitly unusable or both morphology modes are unusable',
    'no usable observation groups exist',
    'required deterministic score primitives are absent',
  ],
  diagnosis_hard_fail_only: [
    'no diagnostic components exist',
    'component identities are unusable',
    'a required pathway-changing classification cannot be represented',
    'immutable image metrics were changed',
  ],
  plan_hard_fail_only: [
    'unresolved targeted doctor classification remains',
    'current detailed plan has no executable operation',
    'protocol ID, current setting, active, route or modality is invalid',
    'a contraindication, raised-lesion exclusion or compatibility rule is violated',
    'supportive care replaces all meaningful primary pigment treatment',
  ],
}

export const PLAN_EXECUTION_REPAIR_PROMPT = `You repair only the execution contract of an already-generated Pigmentation Decode V2.6.1 treatment plan.

INPUT
- validator_errors
- exact eligible protocol records
- current_treatment_block
- master_treatment_roadmap

TASK
Return corrected current_treatment_block and master_treatment_roadmap only. Preserve session numbers, component/group links, treatment choices, targets, exclusions, sequence, course allocation and prose unless a minimal parameter correction is required.

RULES
- Laser: choose scalar wavelength_nm, energy_mj, frequency_hz and passes within the exact selected protocol. Do not copy allowed_* arrays or *_range objects. Omit fluence_j_cm2; the application derives it.
- Microneedling: choose one exact allowed active_id, a topical/transdermal route and scalar depth_by_region_mm values allowed by the protocol.
- LED: choose one scalar duration_minutes within the protocol range.
- Roadmap blocks: place primary procedures in primary_protocol_uses and supportive procedures in supportive_protocol_uses. Counts must match the listed sessions.
- When a session contains two injury-producing modalities, preserve the selected protocols but repair target_regions and excluded_regions so their effective broad-zone treatment fields are explicitly disjoint and still match the existing target_location_text.
- Do not change protocols, modalities, session order, diagnosis, doctor-selected priority groups, package counts or future clinical logic.

OUTPUT
{"current_treatment_block":{},"master_treatment_roadmap":{}}
Return one valid JSON object only.`
