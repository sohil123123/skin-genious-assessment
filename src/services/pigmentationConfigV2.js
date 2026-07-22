/**
 * Pigmentation Decode V2.2 clinic inventory and execution configuration.
 *
 * IMPORTANT ARCHITECTURE:
 * - PIGMENTATION_CLINICAL_POLICY_V2 remains a separate input. It decides clinical priority,
 *   diagnostic specificity, first-line/second-line hierarchy, reassessment behavior, and
 *   maximum session complexity.
 * - This file defines only what the clinic has, what is executable, exact protocol IDs,
 *   routes, settings, endpoints, compatibility, and deterministic runtime contracts.
 * - protocol_map bridges V2 diagnosis/morphology outputs to eligible protocol IDs. It does
 *   not replace the clinical policy or determine first-line treatment.
 * - Hard safety and route restrictions in this file must be enforced by backend code, not
 *   merely repeated in an LLM prompt.
 */

export const PIGMENTATION_CONFIG = {
  module: 'pigmentation_decode',
  version: '2.2.0',
  schema_version: 'pigmentation_config_schema_v2_2',
  ontology_version: 'pigmentation_ontology_v2_1',
  clinic_profile: 'ai_aesthetics_jaipur_v2',
  compatible_policy_versions: ['pigmentation_clinical_policy_v2_1_2026_07_17'],

  architecture_contract: {
    policy_and_config_are_separate_sources: true,
    policy_owns: [
      'diagnostic_confidence_and_specificity',
      'treatment_hierarchy',
      'component_first_reasoning',
      'session_modality_limit',
      'reassessment_strategy',
      'patient_communication_policy',
    ],
    config_owns: [
      'inventory_availability',
      'protocol_ids',
      'device_capabilities',
      'product_and_formula_composition',
      'routes',
      'settings',
      'contact_times',
      'neutralization',
      'endpoints',
      'provider_authorization',
      'compatibility',
      'hard_runtime_validation',
    ],
    protocol_map_role:
      'Map V2 diagnostic family, subtype, morphology, and treatment scope to eligible executable protocol IDs without deciding first-line priority.',
    runtime_precedence: [
      'hard_config_safety_and_route_restrictions',
      'doctor_case_override_within_hard_safety_boundaries',
      'clinical_policy',
      'protocol_map_and_inventory_availability',
      'general_model_reasoning',
    ],
    reject_request_on_policy_config_conflict: true,
  },

  image_acquisition: {
    required_modes: ['white', 'surface_polarized', 'subsurface_polarized', 'red', 'woods_uv'],
    required_mode_count: 5,
    canonical_mode_order: ['white', 'surface_polarized', 'subsurface_polarized', 'red', 'woods_uv'],
  },

  scoring_runtime_contract: {
    model_returns_measurement_primitives_only_as_authoritative_inputs: true,
    measurement_primitive_scale: {
      min: 0,
      max: 100,
    },
    final_index_scale: {
      min: 1,
      max: 100,
    },
    final_index_formula:
      'round(0.45*coverage_100 + 0.35*contrast_or_relative_intensity_100 + 0.10*cross_mode_corroboration_100 + 0.10*regional_clinical_salience_100)',
    weights: {
      coverage_100: 0.45,
      contrast_or_relative_intensity_100: 0.35,
      cross_mode_corroboration_100: 0.1,
      regional_clinical_salience_100: 0.1,
    },
    backend_must_overwrite_model_score_100: true,
    clamp_final_index_to_1_100: true,
    require_primitives_for: [
      'global_background_melanin_load_index',
      'global_background_erythema_load_index',
      'active_inflammatory_lesion_burden_index',
      'flat_focal_pigmented_lesion_burden_index',
      'raised_pigmented_lesion_burden_index',
      'structural_periocular_shadow_burden_index',
      'every_regional_background_melanin_index',
      'every_regional_background_erythema_index',
    ],
    regional_indices_must_not_be_freely_generated: true,
    canonical_image_set: {
      hash_algorithm: 'sha256',
      steps: [
        'decode_each_image',
        'apply_exif_orientation',
        'convert_to_srgb_rgb',
        'strip_metadata',
        'retain_width_height_and_raw_pixel_bytes',
        'order_by_canonical_mode_order',
        'hash_mode_name_dimensions_and_pixel_bytes',
      ],
      same_canonical_hash_reuses_validated_analysis_record: true,
      same_hash_expected_score_variance_points: 0,
      recompressed_or_recropped_pixels_create_new_hash: true,
    },
    first_analysis_validation: {
      required: true,
      mode: 'primary_analysis_plus_consistency_verifier_then_persist',
      persist_only_after_validation_passes: true,
      uncached_repeat_run_tolerance_points: 2,
      exceed_tolerance_action: 'adjudicate_or_regenerate_do_not_average_silently',
    },
  },

  v2_ontology: {
    families: {
      melasma: ['epidermal', 'mixed', 'dermal', 'subtype_uncertain'],
      photo_induced_pigmentation: [
        'tanning_or_facial_photomelanosis',
        'solar_lentigines',
        'ephelides',
        'mixed_photo_induced',
        'subtype_uncertain',
      ],
      post_inflammatory_hyperpigmentation: [
        'post_acne',
        'post_dermatitis',
        'post_procedure',
        'post_laser_or_peel',
        'post_hair_removal_or_friction',
        'post_trauma_or_burn',
        'trigger_uncertain',
      ],
      periocular_hyperpigmentation: [
        'melanin_dominant',
        'vascular_dominant',
        'structural_shadow_dominant',
        'mixed',
      ],
      perioral_hyperpigmentation: [
        'melanin_dominant',
        'friction_or_hair_removal_related',
        'irritant_or_contact_related',
        'melasma_associated',
        'cause_uncertain',
      ],
      pigmented_contact_dermatitis_or_lpp_like: [
        'pigmented_contact_dermatitis_or_riehl_like',
        'lichen_planus_pigmentosus_like',
        'inflammatory_pattern_uncertain',
      ],
      acquired_dermal_melanocytosis: ['hori_like', 'nevus_of_ota_like', 'subtype_uncertain'],
      benign_raised_pigmented_lesion: [
        'seborrhoeic_keratosis_like',
        'dermatosis_papulosa_nigra_like',
        'other_benign_raised_lesion',
        'subtype_uncertain',
      ],
      focal_melanocytic_or_lentiginous_lesion: [
        'melanocytic_nevus_like',
        'solar_lentigo_like',
        'other_stable_focal_lesion',
        'subtype_uncertain',
      ],
      active_inflammatory_process: ['acne', 'dermatitis_or_irritation', 'other'],
      medically_atypical_focal_lesion: [],
      scar_or_friction_modifier: [],
      no_significant_diffuse_pigmentation: [],
      unclassified_pigmentation: [],
    },
    morphology_values: [
      'macule',
      'patch',
      'papule',
      'plaque',
      'mixed_maculopapular',
      'diffuse_background',
      'reticular',
      'scar_or_depression',
      'structural_shadow',
      'active_inflammatory_lesion',
      'other',
    ],
    treatment_scope_values: ['whole_face', 'regional', 'focal_lesion', 'non_procedural'],
  },

  modality_inventory_summary: {
    expose_this_compact_summary_to_component_selector: true,
    do_not_expose_full_execution_protocols_until_modality_or_protocol_group_selected: true,
    modalities: {
      homecare: { available: true, injury_producing: false },
      medical_control: { available: true, injury_producing: false },
      chemical_peel: { available: true, injury_producing: true },
      microneedling_with_active: { available: true, injury_producing: true },
      q_switch_laser: { available: true, injury_producing: true },
      focal_laser: { available: true, injury_producing: true },
      electrocautery_or_rf: { available: true, injury_producing: true },
      hydrafacial: { available: true, injury_producing: false },
      led: { available: true, injury_producing: false },
      cooling: { available: true, injury_producing: false },
      observe: { available: true, injury_producing: false },
    },
  },

  protocol_map: {
    map_version: 'pigmentation_protocol_map_v2_2',
    selection_rule:
      'Clinical policy chooses preferred modality. This map only resolves eligible protocol IDs and blocks ineligible execution.',

    entries: {
      'melasma:epidermal': {
        eligible_modality_groups: ['chemical_peel', 'microneedling_with_active', 'homecare'],
        eligible_protocol_ids: [
          'PEEL_GLYCOLIC',
          'PEEL_BIOREPEELCL3',
          'PEEL_MANDELIC',
          'PEEL_YELLOW',
          'PEEL_LACTIC',
          'MN_MELASMA_EPIDERMAL',
        ],
        laser_protocol_ids: [],
      },

      'melasma:mixed': {
        eligible_modality_groups: [
          'microneedling_with_active',
          'chemical_peel',
          'q_switch_laser',
          'homecare',
        ],
        eligible_protocol_ids: [
          'MN_MELASMA_MIXED',
          'PEEL_GLYCOLIC',
          'PEEL_BIOREPEELCL3',
          'PEEL_MANDELIC',
          'PEEL_YELLOW',
          'QS_MELASMA_MIXED_OR_DERMAL_1064',
        ],
      },

      'melasma:dermal': {
        eligible_modality_groups: ['microneedling_with_active', 'q_switch_laser', 'homecare'],
        eligible_protocol_ids: ['MN_MELASMA_DERMAL', 'QS_MELASMA_MIXED_OR_DERMAL_1064'],
      },

      'melasma:subtype_uncertain': {
        eligible_modality_groups: ['homecare', 'doctor_review'],
        eligible_protocol_ids: [],
        block_depth_specific_procedure_until_subtype_or_component_depth_is_resolved: true,
      },

      'photo_induced_pigmentation:tanning_or_facial_photomelanosis': {
        eligible_modality_groups: ['q_switch_laser', 'chemical_peel', 'homecare'],
        eligible_protocol_ids: [
          'QS_PHOTOMELANOSIS_1064',
          'PEEL_GLYCOLIC',
          'PEEL_BIOREPEELCL3',
          'PEEL_LACTIC',
        ],
      },

      'photo_induced_pigmentation:solar_lentigines': {
        eligible_modality_groups: ['focal_laser', 'chemical_peel', 'homecare'],
        eligible_protocol_ids: ['QS_FOCAL_EPIDERMAL_SPOT', 'PEEL_GLYCOLIC'],
        requires_doctor_visual_clearance_for_focal_laser: true,
      },

      'photo_induced_pigmentation:ephelides': {
        eligible_modality_groups: ['focal_laser', 'chemical_peel', 'homecare'],
        eligible_protocol_ids: ['QS_FOCAL_EPIDERMAL_SPOT', 'PEEL_GLYCOLIC'],
        requires_doctor_visual_clearance_for_focal_laser: true,
      },

      'photo_induced_pigmentation:mixed_photo_induced': {
        resolution_rule:
          'Split background tanning/photomelanosis and focal flat macules into separate diagnostic components before protocol resolution.',
        background_protocol_ids: ['QS_PHOTOMELANOSIS_1064', 'PEEL_GLYCOLIC', 'PEEL_BIOREPEELCL3'],
        focal_flat_macule_protocol_ids: ['QS_FOCAL_EPIDERMAL_SPOT'],
      },

      'photo_induced_pigmentation:subtype_uncertain': {
        eligible_modality_groups: ['homecare', 'doctor_review', 'component_specific_only'],
        eligible_protocol_ids: [],
        resolution_rule:
          'Resolve whether the component is background photomelanosis or focal lentiginous macules before selecting an execution protocol.',
      },

      'post_inflammatory_hyperpigmentation:settled': {
        eligible_modality_groups: [
          'q_switch_laser',
          'chemical_peel',
          'microneedling_with_active',
          'homecare',
        ],
        eligible_protocol_ids: [
          'QS_SETTLED_PIH_1064',
          'PEEL_GLYCOLIC',
          'PEEL_MANDELIC',
          'PEEL_SALICYLIC',
          'MN_SETTLED_PIH_WITH_TEXTURE',
        ],
      },

      'post_inflammatory_hyperpigmentation:active_inflammation_present': {
        eligible_modality_groups: [
          'medical_control',
          'homecare',
          'led',
          'chemical_peel_when_eligible',
        ],
        eligible_protocol_ids: ['LED_BLUE_ACNE_SUPPORT', 'LED_RED_CALMING', 'PEEL_SALICYLIC'],
        blocked_until_inflammation_controlled: [
          'q_switch_laser',
          'focal_laser',
          'microneedling_with_active',
          'deep_tca',
        ],
      },

      'perioral_hyperpigmentation:melanin_dominant': {
        eligible_modality_groups: [
          'homecare',
          'chemical_peel',
          'microneedling_with_active',
          'q_switch_laser',
        ],
        eligible_protocol_ids: [
          'MN_PERIORAL_PIGMENT',
          'PEEL_MANDELIC',
          'PEEL_LACTIC',
          'QS_PERIORAL_1064',
        ],
      },

      'perioral_hyperpigmentation:friction_or_hair_removal_related': {
        eligible_modality_groups: [
          'trigger_control',
          'homecare',
          'chemical_peel',
          'microneedling_with_active',
        ],
        eligible_protocol_ids: ['PEEL_MANDELIC', 'PEEL_LACTIC', 'MN_PERIORAL_PIGMENT'],
      },

      'perioral_hyperpigmentation:irritant_or_contact_related': {
        eligible_modality_groups: ['medical_control', 'barrier_repair', 'homecare'],
        eligible_protocol_ids: ['LED_RED_CALMING'],
        procedures_blocked_while_active: true,
      },

      'perioral_hyperpigmentation:cause_uncertain': {
        eligible_modality_groups: ['homecare', 'trigger_clarification', 'doctor_review'],
        eligible_protocol_ids: [],
        block_procedure_until_main_contributor_is_resolved: true,
      },

      'perioral_hyperpigmentation:melasma_associated': {
        eligible_modality_groups: ['homecare', 'component_specific_melasma_pathway'],
        eligible_protocol_ids: [],
        resolution_rule:
          'Link to the corresponding melasma component and use the melasma depth-specific protocol map.',
      },

      'periocular_hyperpigmentation:melanin_dominant': {
        eligible_modality_groups: ['homecare', 'microneedling_with_active', 'q_switch_laser'],
        eligible_protocol_ids: ['MN_PERIOCULAR_MELANIN_OR_TEXTURE', 'QS_PERIOCULAR_1064'],
      },

      'periocular_hyperpigmentation:structural_shadow_dominant': {
        eligible_modality_groups: ['observe', 'structural_assessment', 'homecare'],
        eligible_protocol_ids: [],
        block_pigment_procedure_as_default: true,
      },

      'periocular_hyperpigmentation:vascular_dominant': {
        eligible_modality_groups: ['medical_assessment', 'homecare'],
        eligible_protocol_ids: [],
        q_switch_not_default: true,
      },

      'periocular_hyperpigmentation:mixed': {
        eligible_modality_groups: ['homecare', 'doctor_review', 'component_specific_only'],
        eligible_protocol_ids: ['MN_PERIOCULAR_MELANIN_OR_TEXTURE', 'QS_PERIOCULAR_1064'],
        resolution_rule:
          'Treat only the confirmed melanin or texture component; do not treat structural or vascular contribution as pigment.',
      },

      'pigmented_contact_dermatitis_or_lpp_like:any': {
        eligible_modality_groups: ['medical_control', 'homecare'],
        eligible_protocol_ids: [],
        procedures_blocked_until_medically_controlled: true,
      },

      'acquired_dermal_melanocytosis:any': {
        eligible_modality_groups: ['homecare', 'q_switch_laser'],
        eligible_protocol_ids: ['QS_ACQUIRED_DERMAL_MELANOCYTOSIS_PENDING'],
      },

      'benign_raised_pigmented_lesion:seborrhoeic_keratosis_like': {
        eligible_modality_groups: ['electrocautery_or_rf'],
        eligible_protocol_ids: ['LESION_SK_DPN_ELECTROCAUTERY_OR_RF'],
      },

      'benign_raised_pigmented_lesion:dermatosis_papulosa_nigra_like': {
        eligible_modality_groups: ['electrocautery_or_rf'],
        eligible_protocol_ids: ['LESION_SK_DPN_ELECTROCAUTERY_OR_RF'],
      },

      'benign_raised_pigmented_lesion:other_benign_raised_lesion': {
        eligible_modality_groups: ['doctor_review', 'other_lesion_directed'],
        eligible_protocol_ids: [],
        require_specific_lesion_confirmation_before_procedure: true,
      },

      'benign_raised_pigmented_lesion:subtype_uncertain': {
        eligible_modality_groups: ['doctor_review'],
        eligible_protocol_ids: [],
        require_specific_lesion_confirmation_before_procedure: true,
      },

      'focal_melanocytic_or_lentiginous_lesion:any': {
        eligible_modality_groups: ['observe', 'doctor_review', 'focal_laser_if_cleared'],
        eligible_protocol_ids: ['QS_FOCAL_EPIDERMAL_SPOT'],
        direct_treatment_requires_doctor_subtype_confirmation: true,
        melanocytic_nevus_like_is_not_automatically_laser_eligible: true,
      },

      'medically_atypical_focal_lesion:any': {
        eligible_modality_groups: ['doctor_assessment'],
        eligible_protocol_ids: [],
        all_cosmetic_procedures_blocked: true,
      },

      'active_inflammatory_process:acne': {
        eligible_modality_groups: ['medical_control', 'led', 'chemical_peel_when_eligible'],
        eligible_protocol_ids: ['LED_BLUE_ACNE_SUPPORT', 'PEEL_SALICYLIC'],
      },

      'scar_or_friction_modifier:any': {
        eligible_modality_groups: [
          'trigger_control',
          'homecare',
          'microneedling_with_active_when_eligible',
        ],
        eligible_protocol_ids: ['MN_SCAR_TEXTURE_MODIFIER'],
      },

      'no_significant_diffuse_pigmentation:any': {
        eligible_modality_groups: ['observe', 'homecare', 'component_specific_only'],
        eligible_protocol_ids: [],
        block_background_pigment_procedure: true,
      },

      'unclassified_pigmentation:any': {
        eligible_modality_groups: ['doctor_review', 'homecare'],
        eligible_protocol_ids: [],
        block_aggressive_procedure_until_classified: true,
      },
    },

    subtype_alias_resolution: {
      'post_inflammatory_hyperpigmentation:post_acne':
        'post_inflammatory_hyperpigmentation:settled',
      'post_inflammatory_hyperpigmentation:post_dermatitis':
        'post_inflammatory_hyperpigmentation:settled',
      'post_inflammatory_hyperpigmentation:post_procedure':
        'post_inflammatory_hyperpigmentation:settled',
      'post_inflammatory_hyperpigmentation:post_laser_or_peel':
        'post_inflammatory_hyperpigmentation:settled',
      'post_inflammatory_hyperpigmentation:post_hair_removal_or_friction':
        'post_inflammatory_hyperpigmentation:settled',
      'post_inflammatory_hyperpigmentation:post_trauma_or_burn':
        'post_inflammatory_hyperpigmentation:settled',
      'post_inflammatory_hyperpigmentation:trigger_uncertain':
        'post_inflammatory_hyperpigmentation:settled',
      'acquired_dermal_melanocytosis:hori_like': 'acquired_dermal_melanocytosis:any',
      'acquired_dermal_melanocytosis:nevus_of_ota_like': 'acquired_dermal_melanocytosis:any',
      'focal_melanocytic_or_lentiginous_lesion:solar_lentigo_like':
        'focal_melanocytic_or_lentiginous_lesion:any',
      'focal_melanocytic_or_lentiginous_lesion:melanocytic_nevus_like':
        'focal_melanocytic_or_lentiginous_lesion:any',
    },
  },

  q_switch: {
    expose_full_q_switch_config_to_component_selector: false,
    provide_full_q_switch_config_only_after_component_selects_laser: true,

    device: {
      available: true,
      brand_model: 'Numitech',
      laser_type: 'Q-switched Nd:YAG / available handpieces as configured',
      wavelengths_nm: [532, 755, 1064],
      frequency_hz_range: { min: 1, max: 10 },
      energy_mj_range: { min: 100, max: 2000 },
      spot_area_cm2: 1.0,
      preset_modes_available: false,
      performed_by: 'therapist_after_doctor_approval',
      doctor_approval_required: true,
      fluence_conversion: {
        formula: 'fluence_j_cm2 = energy_mj / 1000 / spot_area_cm2',
        note: 'With spot_area_cm2 = 1.0, 500 mJ = 0.5 J/cm2.',
      },
      setting_output_rule: {
        primary_machine_setting: 'energy_mj',
        clinical_reference_setting: 'fluence_j_cm2',
        frequency_unit: 'Hz',
        wavelength_unit: 'nm',
      },
    },

    protocols: {
      QS_PHOTOMELANOSIS_1064: {
        available: true,
        configured_for_execution: true,
        treatment_scope: 'whole_face_or_regional',
        diagnosis_keys: ['photo_induced_pigmentation:tanning_or_facial_photomelanosis'],
        allowed_wavelengths_nm: [1064],
        energy_mj_range: { min: 200, max: 400 },
        fluence_j_cm2_range: { min: 0.2, max: 0.4 },
        frequency_hz_range: { min: 3, max: 6 },
        passes_range: { min: 1, max: 2 },
        endpoint: 'mild_warmth_or_very_mild_erythema_no_frosting',
        reduce_if: [
          'high_background_erythema',
          'recent_high_sun_exposure',
          'poor_sunscreen_compliance',
          'sensitive_skin',
          'periocular_or_perioral_zone',
          'fitzpatrick_IV_to_VI',
        ],
        defer_if: [
          'active_burning',
          'active_infection',
          'open_skin',
          'new_or_unreviewed_medically_atypical_lesion',
        ],
      },

      QS_SETTLED_PIH_1064: {
        available: true,
        configured_for_execution: true,
        treatment_scope: 'regional_or_whole_face_when_component_is_diffuse',
        diagnosis_keys: ['post_inflammatory_hyperpigmentation:settled'],
        allowed_wavelengths_nm: [1064],
        energy_mj_range: { min: 300, max: 600 },
        fluence_j_cm2_range: { min: 0.3, max: 0.6 },
        frequency_hz_range: { min: 3, max: 6 },
        passes_range: { min: 1, max: 2 },
        endpoint: 'mild_warmth_no_frosting',
        eligible_only_if: [
          'causal_component_is_settled',
          'active_inflammation_is_controlled',
          'background_erythema_is_not_high',
        ],
        defer_if: [
          'frequent_active_acne',
          'active_dermatitis_or_irritation',
          'inflammation_first_required',
          'recent_procedure_darkening',
        ],
      },

      QS_MELASMA_MIXED_OR_DERMAL_1064: {
        available: true,
        configured_for_execution: true,
        treatment_scope: 'regional_or_conservative_toning',
        diagnosis_keys: ['melasma:mixed', 'melasma:dermal'],
        allowed_wavelengths_nm: [1064],
        energy_mj_range: { min: 400, max: 800 },
        fluence_j_cm2_range: { min: 0.4, max: 0.8 },
        frequency_hz_range: { min: 3, max: 6 },
        passes_range: { min: 1, max: 2 },
        endpoint: 'no_aggressive_endpoint_no_frosting_no_excess_heat',
        eligible_only_if: [
          'clinical_policy_selected_q_switch_for_this_component',
          'melasma_is_stable',
          'sunscreen_compliance_is_acceptable',
          'erythema_and_inflammation_are_controlled',
        ],
        defer_or_reduce_if: [
          'unstable_or_spreading_melasma',
          'high_background_erythema',
          'active_burning_or_stinging',
          'recent_procedure_reaction',
          'poor_sunscreen_compliance',
        ],
      },

      QS_PERIORAL_1064: {
        available: true,
        configured_for_execution: true,
        treatment_scope: 'regional',
        diagnosis_keys: ['perioral_hyperpigmentation:melanin_dominant'],
        allowed_wavelengths_nm: [1064],
        energy_mj_range: { min: 200, max: 350 },
        fluence_j_cm2_range: { min: 0.2, max: 0.35 },
        frequency_hz_range: { min: 3, max: 5 },
        passes_range: { min: 1, max: 1 },
        endpoint: 'very_mild_warmth_no_frosting',
        eligible_only_if: [
          'doctor_selected_pigment_dominant_perioral_component',
          'barrier_stable',
          'no_active_burning',
        ],
        defer_if: [
          'active_burning',
          'severe_sensitivity',
          'recent_waxing_threading_or_bleach_reaction',
          'irritant_or_contact_pattern_active',
        ],
      },

      QS_PERIOCULAR_1064: {
        available: true,
        configured_for_execution: true,
        treatment_scope: 'regional_doctor_selected',
        diagnosis_keys: ['periocular_hyperpigmentation:melanin_dominant'],
        allowed_wavelengths_nm: [1064],
        energy_mj_range: { min: 100, max: 200 },
        fluence_j_cm2_range: { min: 0.1, max: 0.2 },
        frequency_hz_range: { min: 2, max: 4 },
        passes_range: { min: 1, max: 1 },
        endpoint: 'very_conservative_no_heat_build_up',
        mandatory_eye_protection: true,
        eligible_only_if: [
          'doctor_selected_periocular_pigment',
          'not_structural_shadow_dominant',
          'not_vascular_dominant',
          'no_active_eczema_or_rubbing_inflammation',
        ],
      },

      QS_FOCAL_EPIDERMAL_SPOT: {
        available: true,
        configured_for_execution: true,
        treatment_scope: 'spot_only',
        diagnosis_keys: [
          'photo_induced_pigmentation:solar_lentigines',
          'photo_induced_pigmentation:ephelides',
          'focal_melanocytic_or_lentiginous_lesion:any',
        ],
        allowed_wavelengths_nm: [532, 755, 1064],
        energy_mj_range_by_wavelength: {
          532: { min: 100, max: 250 },
          755: { min: 100, max: 400 },
          1064: { min: 200, max: 500 },
        },
        frequency_hz_range: { min: 1, max: 4 },
        passes_range: { min: 1, max: 1 },
        endpoint: 'doctor_defined_spot_endpoint',
        requires_doctor_visual_clearance: true,
        requires_specific_focal_subtype_clearance: true,
        not_eligible_when: [
          'melanocytic_nevus_like_without_explicit_doctor_clearance',
          'medically_atypical_or_uncertain_lesion',
          'new_change_bleeding_ulceration_or_crusting',
          'open_skin',
        ],
      },

      QS_ACQUIRED_DERMAL_MELANOCYTOSIS_PENDING: {
        available: true,
        configured_for_execution: false,
        selectable_by_ai: false,
        treatment_scope: 'doctor_selected',
        diagnosis_keys: ['acquired_dermal_melanocytosis:any'],
        block_reason:
          'Exact clinic-approved wavelength, energy, spot, pass, interval, and endpoint protocol has not been supplied in the current config.',
      },

      QS_CARBON_FACIAL_1064: {
        available: true,
        configured_for_execution: true,
        outside_core_pigmentation_backbone: true,
        treatment_scope: 'whole_face_or_regional',
        allowed_wavelengths_nm: [1064],
        energy_mj_range: { min: 200, max: 500 },
        fluence_j_cm2_range: { min: 0.2, max: 0.5 },
        frequency_hz_range: { min: 3, max: 6 },
        passes_range: { min: 1, max: 2 },
        endpoint: 'carbon_response_without_excess_heat',
        eligible_when: [
          'oily_skin',
          'congestion',
          'acne_prone_dullness',
          'pigmentation_not_melasma_dominant',
        ],
      },
    },

    optimizer: {
      enabled: true,
      may_run_only_after_laser_selected_for_component: true,
      must_return_used_for_component_ids: true,
      no_global_default_modality_or_wavelength_during_component_selection: true,
      fallback_wavelength_only_after_laser_is_selected_and_no_focal_advantage_exists: 1064,
      candidate_wavelengths_nm: [532, 755, 1064],
      optimize_for: 'maximum_expected_improvement_with_acceptable_safety',
      scoring_weights: {
        efficacy: 0.45,
        safety: 0.45,
        downtime: 0.05,
        recurrence_prevention: 0.05,
      },
      allowed_strategy_types: [
        'base_global_toning',
        'regional_override',
        'spot_only_override',
        'exclude_from_treatment',
        'defer_zone',
      ],
      max_distinct_wavelength_strategies_per_session: 3,
      rules: {
        1064: {
          allowed_scopes: ['whole_face', 'regional', 'spot_only'],
          typical_role: 'conservative_background_or_deeper_pigment_strategy',
        },
        532: {
          allowed_scopes: ['spot_only'],
          requires_doctor_visual_clearance: true,
          never_use_as_routine_full_face_toning: true,
        },
        755: {
          allowed_scopes: ['regional', 'spot_only'],
          requires_doctor_visual_clearance: true,
          never_use_as_routine_full_face_toning_in_high_pih_risk_pattern: true,
        },
      },
      global_safety_constraints: {
        reduce_if: [
          'high_background_erythema',
          'moderate_or_severe_current_sensitivity',
          'recent_procedure_darkening',
          'recent_sunburn_or_high_sun_exposure',
          'periocular_zone',
          'perioral_zone',
          'fitzpatrick_IV_to_VI',
        ],
        defer_if: [
          'medically_atypical_lesion_in_target_zone',
          'active_infection',
          'active_burning',
          'melasma_or_pih_with_inflammation_first_required',
          'open_skin',
        ],
      },
    },
  },

  microneedling: {
    expose_full_microneedling_config_to_component_selector: false,
    provide_full_config_only_after_microneedling_selected: true,

    device: {
      available: true,
      device: 'Dr. Pen',
      performed_by: 'doctor',
      max_depth_mm: 2.0,
      cartridge_type: 'disposable',
      default_route_for_actives: 'topical_transdermal_after_microneedling',
      injectable_route_allowed: false,
      downtime_hours: { min: 72, max: 96 },
    },

    protocols: {
      MN_MELASMA_EPIDERMAL: {
        available: true,
        configured_for_execution: true,
        diagnosis_keys: ['melasma:epidermal'],
        frequency_days: 30,
        depth_by_region_mm: {
          forehead: 1.0,
          right_malar: 1.5,
          left_malar: 1.5,
          upper_lip_perioral: 1.0,
          chin_jaw: 1.0,
          periocular: 0.5,
        },
        allowed_active_ids: [
          'MESO_TXA5_HA2',
          'MESO_TXA5_VITC20_GSH2_HA2',
          'MESO_VITC20_GSH2_HA2',
          'WONDERM',
          'ADVANCEXO_SKIN_REJUVE',
        ],
        defer_if: [
          'unstable_spreading_melasma',
          'high_background_erythema',
          'active_burning',
          'active_infection',
          'barrier_compromised',
        ],
      },

      MN_MELASMA_MIXED: {
        available: true,
        configured_for_execution: true,
        diagnosis_keys: ['melasma:mixed'],
        frequency_days: 30,
        depth_by_region_mm: {
          forehead: 1.0,
          right_malar: 1.5,
          left_malar: 1.5,
          upper_lip_perioral: 1.0,
          chin_jaw: 1.0,
          periocular: 0.5,
        },
        allowed_active_ids: [
          'MESO_TXA5_HA2',
          'MESO_TXA5_VITC20_GSH2_HA2',
          'MESO_VITC20_GSH2_HA2',
          'WONDERM',
          'ADVANCEXO_SKIN_REJUVE',
        ],
        defer_if: [
          'unstable_spreading_melasma',
          'high_background_erythema',
          'active_burning',
          'active_infection',
          'barrier_compromised',
        ],
      },

      MN_MELASMA_DERMAL: {
        available: true,
        configured_for_execution: true,
        diagnosis_keys: ['melasma:dermal'],
        frequency_days: 30,
        depth_by_region_mm: {
          forehead: 1.0,
          right_malar: 1.5,
          left_malar: 1.5,
          upper_lip_perioral: 1.0,
          chin_jaw: 1.0,
          periocular: 0.5,
        },
        allowed_active_ids: [
          'MESO_TXA5_HA2',
          'MESO_TXA5_VITC20_GSH2_HA2',
          'WONDERM',
          'ADVANCEXO_SKIN_REJUVE',
        ],
        defer_if: [
          'unstable_spreading_melasma',
          'high_background_erythema',
          'active_burning',
          'active_infection',
          'barrier_compromised',
        ],
      },

      MN_SETTLED_PIH_WITH_TEXTURE: {
        available: true,
        configured_for_execution: true,
        diagnosis_keys: ['post_inflammatory_hyperpigmentation:settled'],
        eligibility_requires: [
          'active_inflammation_controlled',
          'meaningful_texture_or_scar_component',
        ],
        depth_by_region_mm: {
          forehead: 1.0,
          right_malar: { min: 1.5, max: 2.0 },
          left_malar: { min: 1.5, max: 2.0 },
          upper_lip_perioral: 1.0,
          chin_jaw: 1.5,
          periocular: 0.5,
        },
        frequency_days: 30,
        allowed_active_ids: [
          'MESO_TXA5_HA2',
          'MESO_TXA5_VITC20_GSH2_HA2',
          'WONDERM',
          'ADVANCEXO_SKIN_REJUVE',
        ],
        defer_if: [
          'frequent_active_acne',
          'active_dermatitis',
          'high_background_erythema',
          'active_infection',
        ],
      },

      MN_PERIORAL_PIGMENT: {
        available: true,
        configured_for_execution: true,
        diagnosis_keys: [
          'perioral_hyperpigmentation:melanin_dominant',
          'perioral_hyperpigmentation:friction_or_hair_removal_related',
        ],
        depth_by_region_mm: {
          upper_lip_perioral: 1.0,
        },
        frequency_days: 30,
        allowed_active_ids: [
          'MESO_TXA5_HA2',
          'MESO_VITC20_GSH2_HA2',
          'WONDERM',
          'ADVANCEXO_SKIN_REJUVE',
        ],
        defer_if: [
          'active_burning',
          'severe_sensitivity',
          'recent_waxing_threading_or_bleach_reaction',
          'active_irritant_or_contact_pattern',
        ],
      },

      MN_PERIOCULAR_MELANIN_OR_TEXTURE: {
        available: true,
        configured_for_execution: true,
        diagnosis_keys: [
          'periocular_hyperpigmentation:melanin_dominant',
          'periocular_hyperpigmentation:mixed',
        ],
        depth_by_region_mm: {
          periocular: 0.5,
        },
        frequency_days: 30,
        allowed_active_ids: ['WONDERM', 'ADVANCEXO_SKIN_REJUVE', 'MESO_HA2'],
        defer_if: [
          'active_eye_rubbing_or_allergy',
          'eczema_or_dermatitis',
          'structural_shadow_dominant',
          'vascular_dominant',
          'active_infection',
        ],
      },

      MN_SCAR_TEXTURE_MODIFIER: {
        available: true,
        configured_for_execution: true,
        diagnosis_keys: ['scar_or_friction_modifier:any'],
        depth_by_region_mm: {
          doctor_select_up_to_mm: 2.0,
        },
        frequency_days: 30,
        allowed_active_ids: ['WONDERM', 'ADVANCEXO_SKIN_REJUVE', 'MESO_HA2'],
        note: 'Scar or structural shadow response must be tracked separately from background pigment response.',
      },
    },
  },

  microneedling_actives: {
    selection_architecture: 'phenotype_first_then_severity_recurrence_and_previous_response',
    microneedling_without_purposeful_active_is_not_preferred_for_pigmentation: true,
    all_routes_are_topical_or_transdermal_only: true,
    injectable_allowed: false,

    formulas_and_products: {
      MESO_TXA5_HA2: {
        type: 'clinic_compounded_meso',
        display_name: 'TXA 5% + HA 2%',
        configured_for_execution: true,
        route: 'topical_transdermal_after_microneedling',
        injectable: false,
        ingredients: [
          { name: 'tranexamic_acid', final_concentration_percent: 5 },
          { name: 'hyaluronic_acid', final_concentration_percent: 2 },
        ],
        phenotype_roles: ['pigment_directed'],
        response_tiers: ['easier', 'moderate'],
        doctor_signoff_required: true,
        requires_clinic_compounding_sop_confirmation: true,
      },

      MESO_TXA5_VITC20_GSH2_HA2: {
        type: 'clinic_compounded_meso',
        display_name: 'TXA 5% + Vitamin C 20% + Glutathione 2% + HA 2%',
        configured_for_execution: true,
        route: 'topical_transdermal_after_microneedling',
        injectable: false,
        ingredients: [
          { name: 'tranexamic_acid', final_concentration_percent: 5 },
          { name: 'vitamin_c', final_concentration_percent: 20 },
          { name: 'glutathione', final_concentration_percent: 2 },
          { name: 'hyaluronic_acid', final_concentration_percent: 2 },
        ],
        phenotype_roles: ['pigment_directed', 'antioxidant_support'],
        response_tiers: ['severe_or_refractory'],
        doctor_signoff_required: true,
        requires_clinic_compounding_sop_confirmation: true,
      },

      MESO_VITC20_GSH2_HA2: {
        type: 'clinic_compounded_meso',
        display_name: 'Vitamin C 20% + Glutathione 2% + HA 2%',
        configured_for_execution: true,
        route: 'topical_transdermal_after_microneedling',
        injectable: false,
        ingredients: [
          { name: 'vitamin_c', final_concentration_percent: 20 },
          { name: 'glutathione', final_concentration_percent: 2 },
          { name: 'hyaluronic_acid', final_concentration_percent: 2 },
        ],
        phenotype_roles: ['antioxidant_brightening_support'],
        response_tiers: ['txa_not_selected_or_not_suitable'],
        doctor_signoff_required: true,
        requires_clinic_compounding_sop_confirmation: true,
      },

      MESO_HA2: {
        type: 'clinic_compounded_meso',
        display_name: 'HA 2%',
        configured_for_execution: true,
        route: 'topical_transdermal_after_microneedling',
        injectable: false,
        ingredients: [{ name: 'hyaluronic_acid', final_concentration_percent: 2 }],
        phenotype_roles: ['repair_hydration'],
        response_tiers: ['supportive_only'],
        primary_pigment_directed_active: false,
        doctor_signoff_required: true,
        requires_clinic_compounding_sop_confirmation: true,
      },

      WONDERM: {
        type: 'commercial_pdrn_ha_product',
        display_name: 'Wonderm',
        manufacturer: 'Twine Medicals',
        configured_for_execution: true,
        route: 'topical_transdermal_after_microneedling',
        external_use_only: true,
        injectable: false,
        roles: ['repair_support', 'hydration', 'texture_photoageing_support', 'skin_quality'],
        primary_pigment_directed_active: false,
        label_ingredients: [
          'Aqua',
          'Arginine',
          'Panthenol',
          'Sodium Hyaluronate',
          'Phenoxyethanol',
          'Ethylhexylglycerin',
          'Trehalose',
          'Succinic Acid',
          'Thiamine',
          'Pyridoxine',
          'Sodium DNA',
          'Sodium Hydroxide',
          'Niacinamide',
        ],
        pregnancy_or_breastfeeding_block_from_label: true,
        batch_and_expiry_record_required: true,
      },

      ADVANCEXO_SKIN_REJUVE: {
        type: 'commercial_exosome_product',
        display_name: 'Advancexo Skin Rejuve Complex',
        manufacturer: 'Advancells / Saffron Naturele Products',
        configured_for_execution: true,
        route: 'topical_transdermal_after_microneedling',
        topical_use_only: true,
        injectable: false,
        roles: [
          'advanced_regenerative_support',
          'texture_photoageing_support',
          'post_procedure_recovery_support',
        ],
        label_ingredients: [
          'Aqua',
          'Trehalose',
          'Mannitol',
          'Dried Exosome Powder',
          'Retinol',
          'Sodium Bicarbonate',
          'Nicotinamide Adenine Dinucleotide',
          'Glycine',
          'Alanine',
          'Arginine',
          'Histidine',
          'Leucine',
          'Phenylalanine',
          'Serine',
          'Threonine',
          'Valine',
          'Coenzyme A',
        ],
        retinol_related_restriction: 'none_per_dr_aakriti_clinic_policy',
        ignore_label_retinol_for_selection_and_same_day_safety_gating: true,
        same_day_after_microneedling_allowed_when_otherwise_eligible: true,
        not_default_for_active_inflammation_or_impaired_barrier: true,
        do_not_select_only_because_melanin_severity_is_high: true,
        batch_and_expiry_record_required: true,
      },
    },

    compounding_safety_contract: {
      model_may_select_only_listed_formula_id: true,
      model_must_not_change_concentrations: true,
      model_must_not_generate_mixing_order_or_compounding_method: true,
      clinic_sop_must_define: [
        'source_ampoules',
        'aseptic_preparation',
        'total_volume',
        'order_of_mixing',
        'pH_and_compatibility_check',
        'single_use_handling',
        'beyond_use_time',
        'disposal',
      ],
    },
  },

  peels: {
    expose_full_peel_config_to_component_selector: false,
    provide_only_eligible_peel_protocols_after_chemical_peel_selected: true,

    protocols: {
      PEEL_BIOREPEELCL3: {
        available: true,
        configured_for_execution: true,
        display_name: 'BioRePeelCl3',
        category: 'biphasic_low_downtime_tca_peel',
        main_active: 'TCA',
        strength_description: 'BioRePeelCl3 FND commonly described as 35% TCA',
        treatment_scope: 'whole_face_or_regional',
        contact_time_minutes: { min: 3, max: 5 },
        neutralization_required: false,
        removal_method: 'wipe_clean_with_water_soaked_gauze',
        endpoint: 'mild_controlled_erythema_or_tolerable_stinging_no_frosting_target',
        repeat_interval_days: { min: 7, max: 30 },
        preferred_interval_days_for_pigmentation: 30,
        diagnosis_keys: [
          'melasma:epidermal',
          'melasma:mixed',
          'photo_induced_pigmentation:tanning_or_facial_photomelanosis',
          'post_inflammatory_hyperpigmentation:settled',
        ],
        defer_if: [
          'active_burning',
          'severe_sensitivity',
          'high_background_erythema',
          'recent_procedure_reaction',
          'active_infection',
          'barrier_compromised',
          'medically_atypical_lesion_in_target_zone',
        ],
        performed_by: 'therapist_after_doctor_approval',
        doctor_approval_required: true,
      },

      PEEL_MANDELIC: {
        available: true,
        configured_for_execution: true,
        display_name: 'Mandelic Peel',
        category: 'superficial_alpha_hydroxy_acid_peel',
        main_active: 'mandelic_acid',
        strength_percent: { min: 30, max: 45 },
        treatment_scope: 'whole_face_or_regional',
        contact_time_minutes: { min: 5, max: 10 },
        neutralization_required: true,
        neutralization_method: 'clinic_neutralizer_or_product_specific_water_rinse',
        endpoint: 'mild_erythema_or_tolerable_stinging_no_frosting',
        repeat_interval_days: { min: 14, max: 28 },
        preferred_interval_days_for_pigmentation: 21,
        diagnosis_keys: [
          'melasma:epidermal',
          'melasma:mixed',
          'post_inflammatory_hyperpigmentation:settled',
          'perioral_hyperpigmentation:melanin_dominant',
          'perioral_hyperpigmentation:friction_or_hair_removal_related',
        ],
        efficacy_note:
          'Do not select merely because it is gentle when a stronger eligible peel is expected to be materially more effective.',
        defer_if: [
          'active_burning',
          'severe_sensitivity',
          'recent_procedure_reaction',
          'open_skin',
          'medically_atypical_lesion_in_target_zone',
        ],
        performed_by: 'therapist_after_doctor_approval',
        doctor_approval_required: true,
      },

      PEEL_SALICYLIC: {
        available: true,
        configured_for_execution: true,
        display_name: 'Salicylic Peel',
        category: 'superficial_beta_hydroxy_acid_peel',
        main_active: 'salicylic_acid',
        strength_percent: { min: 20, max: 30 },
        treatment_scope: 'whole_face_or_regional',
        contact_time_minutes: { min: 3, max: 5 },
        neutralization_required: false,
        removal_method: 'wash_or_rinse_after_pseudofrost_crystallization_and_burning_subsides',
        endpoint: 'even_pseudofrost_or_crystallization_with_tolerable_stinging',
        repeat_interval_days: { min: 14, max: 28 },
        preferred_interval_days_for_pigmentation: 21,
        diagnosis_keys: [
          'active_inflammatory_process:acne',
          'post_inflammatory_hyperpigmentation:post_acne',
          'post_inflammatory_hyperpigmentation:settled',
        ],
        eligible_only_if: ['acne_or_oil_driver_present', 'barrier_stable'],
        defer_if: [
          'dry_sensitive_barrier',
          'high_background_erythema',
          'active_burning',
          'recent_irritant_reaction',
          'aspirin_sensitivity_if_relevant',
          'pregnancy_if_clinic_policy_avoids_salicylic_peel',
        ],
        performed_by: 'therapist_after_doctor_approval',
        doctor_approval_required: true,
      },

      PEEL_GLYCOLIC: {
        available: true,
        configured_for_execution: true,
        display_name: 'Glycolic Peel',
        category: 'superficial_alpha_hydroxy_acid_peel',
        main_active: 'glycolic_acid',
        strength_percent: { min: 20, max: 70 },
        preferred_start_strength_percent_for_indian_pigmentation: { min: 20, max: 35 },
        treatment_scope: 'whole_face_or_regional',
        contact_time_minutes: { min: 2, max: 5 },
        preferred_initial_contact_time_minutes: 3,
        neutralization_required: true,
        neutralization_method:
          '10_to_15_percent_sodium_bicarbonate_or_clinic_neutralizer_then_water_rinse',
        endpoint: 'mild_uniform_erythema_without_epidermolysis',
        repeat_interval_days: { min: 14, max: 30 },
        preferred_interval_days_for_pigmentation: 21,
        diagnosis_keys: [
          'melasma:epidermal',
          'melasma:mixed',
          'photo_induced_pigmentation:tanning_or_facial_photomelanosis',
          'photo_induced_pigmentation:solar_lentigines',
          'photo_induced_pigmentation:ephelides',
          'post_inflammatory_hyperpigmentation:settled',
        ],
        defer_if: [
          'sensitive_skin',
          'high_background_erythema',
          'active_burning',
          'recent_procedure_reaction',
          'barrier_compromised',
          'poor_sunscreen_compliance',
        ],
        performed_by: 'therapist_after_doctor_approval',
        doctor_approval_required: true,
      },

      PEEL_YELLOW: {
        available: true,
        configured_for_execution: true,
        display_name: 'Yellow Peel',
        category: 'retinoid_depigmenting_leave_on_peel',
        main_active: 'retinoid_based_depigmenting_complex',
        treatment_scope: 'whole_face_or_regional',
        contact_time_minutes: null,
        leave_on_time_hours: { min: 4, max: 6 },
        neutralization_required: false,
        removal_method: 'wash_off_after_leave_on_period_as_directed',
        endpoint: 'even_application_without_excess_burning_during_observation',
        repeat_interval_days: { min: 30, max: 45 },
        preferred_interval_days_for_pigmentation: 30,
        diagnosis_keys: [
          'melasma:epidermal',
          'melasma:mixed',
          'photo_induced_pigmentation:tanning_or_facial_photomelanosis',
        ],
        same_day_q_switch_allowed: false,
        defer_if: [
          'pregnancy',
          'breastfeeding',
          'active_burning',
          'severe_sensitivity',
          'recent_retinoid_overuse',
          'barrier_compromised',
          'poor_sunscreen_compliance',
          'high_background_erythema',
        ],
        performed_by: 'therapist_after_doctor_approval',
        doctor_approval_required: true,
      },

      PEEL_LACTIC: {
        available: true,
        configured_for_execution: true,
        display_name: 'Lactic Peel',
        category: 'gentle_alpha_hydroxy_acid_peel',
        main_active: 'lactic_acid',
        strength_percent: { min: 30, max: 50 },
        preferred_strength_percent_for_sensitive_or_indian_skin: { min: 30, max: 40 },
        treatment_scope: 'whole_face_or_regional',
        contact_time_minutes: { min: 3, max: 7 },
        preferred_initial_contact_time_minutes: 3,
        neutralization_required: true,
        neutralization_method: 'clinic_neutralizer_or_product_specific_water_rinse',
        endpoint: 'mild_erythema_or_tolerable_stinging_without_frosting',
        repeat_interval_days: { min: 14, max: 28 },
        preferred_interval_days_for_pigmentation: 21,
        diagnosis_keys: [
          'photo_induced_pigmentation:tanning_or_facial_photomelanosis',
          'perioral_hyperpigmentation:melanin_dominant',
          'perioral_hyperpigmentation:friction_or_hair_removal_related',
        ],
        primary_role: 'supportive_gentle_brightening_or_barrier_conscious_peel',
        defer_if: [
          'active_burning',
          'severe_sensitivity',
          'open_skin',
          'recent_procedure_reaction',
        ],
        performed_by: 'therapist_after_doctor_approval',
        doctor_approval_required: true,
      },

      PEEL_DEEP_TCA: {
        available: true,
        configured_for_execution: false,
        selectable_by_ai: false,
        display_name: 'Deep TCA Peel',
        category: 'deep_tca_doctor_only',
        treatment_scope: 'doctor_selected_regional_or_focal',
        doctor_only: true,
        contact_time_minutes: null,
        strength_percent: null,
        neutralization_required: null,
        neutralization_method: null,
        endpoint: null,
        repeat_interval_days: null,
        block_reason:
          'Deep TCA is in clinic inventory, but exact product, strength, application method, endpoint, neutralization/removal, zone restrictions, and interval have not been supplied. The AI must not invent them.',
        required_fields_before_selectable: [
          'exact_product_name',
          'strength_percent',
          'eligible_diagnoses_and_zones',
          'application_method',
          'contact_or_endpoint_rule',
          'neutralization_or_removal_rule',
          'repeat_interval',
          'precare_and_aftercare',
          'hard_contraindications',
        ],
      },
    },

    same_day_compatibility: {
      peel_plus_led: 'compatible',
      peel_plus_hydrafacial: 'doctor_selected_gentle_non_exfoliative_only',
      peel_plus_q_switch: 'conditional_protocol_specific',
      peel_plus_microneedling: 'not_compatible_same_day',
      peel_plus_lesion_ablation: 'prefer_separate_session',
      deep_tca_plus_any_other_injury_modality: 'not_compatible_same_day',
    },

    deliberately_removed_or_not_selectable: {
      BLACK_PEEL: {
        available: false,
        reason:
          'Removed from the approved Pigmentation Decode inventory; do not migrate the V1 black_peel protocol.',
      },
    },

    declared_inventory_pending_exact_protocol: {
      note: 'Add these only if they remain in active clinic inventory and their exact product protocols are supplied. They are not selectable in this file.',
      products: [
        'Cosmelan',
        'Party Peel',
        'Whitening Peel',
        'Sali DS',
        'Pumpkin Gel Peel',
        'Fusion Peel-E',
        'Salicylic + Mandelic Combination',
        'Salmon Peel',
      ],
    },
  },

  lesion_directed_procedures: {
    LESION_SK_DPN_ELECTROCAUTERY_OR_RF: {
      available: true,
      configured_for_execution: true,
      display_name: 'SK/DPN lesion-directed electrocautery or RF',
      eligible_diagnosis_keys: [
        'benign_raised_pigmented_lesion:seborrhoeic_keratosis_like',
        'benign_raised_pigmented_lesion:dermatosis_papulosa_nigra_like',
      ],
      performed_by: 'doctor',
      doctor_visual_confirmation_required: true,
      treatment_scope: 'focal_lesion',
      settings_output_rule:
        'AI must not invent numeric power. Doctor selects device and power using lesion size, elevation, site, and endpoint.',
      endpoint:
        'controlled_lesion_desiccation_or_ablation_without_unnecessary_surrounding_tissue_injury',
      local_anaesthesia: 'doctor_select',
      post_procedure_steps: [
        'cooling_if_needed',
        'doctor_selected_wound_care',
        'strict_photoprotection',
        'do_not_pick_or_manipulate',
      ],
      never_include_in_background_toning: true,
      same_day_with_other_injury_modality: 'prefer_separate_session',
    },

    MEDICALLY_ATYPICAL_LESION_HOLD: {
      available: true,
      configured_for_execution: true,
      procedure: 'no_cosmetic_procedure',
      all_cosmetic_treatment_blocked: true,
      required_action: 'doctor_assessment',
    },
  },

  supportive_devices: {
    LED_RED_CALMING: {
      available: true,
      display_name: 'Red LED',
      category: 'supportive_recovery_device',
      injury_producing: false,
      performed_by: 'therapist_after_doctor_approval',
      duration_minutes: { min: 10, max: 20 },
      roles: [
        'post_q_switch_calming',
        'post_peel_calming',
        'post_microneedling_recovery',
        'barrier_and_erythema_support',
      ],
    },

    LED_BLUE_ACNE_SUPPORT: {
      available: true,
      display_name: 'Blue LED',
      category: 'supportive_acne_device',
      injury_producing: false,
      performed_by: 'therapist_after_doctor_approval',
      duration_minutes: { min: 10, max: 20 },
      roles: ['active_acne_support', 'oily_acne_prone_support'],
    },

    HYDRAFACIAL_SUPPORT: {
      available: true,
      display_name: 'Hydrafacial / Hydrodermabrasion',
      category: 'supportive_cleansing_hydration_device',
      injury_producing: false,
      not_primary_melasma_treatment: true,
      performed_by: 'therapist_after_doctor_approval',
      roles: [
        'dullness_support',
        'mild_tanning_support',
        'congestion_support',
        'maintenance',
        'barrier_friendly_preparation',
      ],
      avoid_or_defer_if: [
        'active_burning',
        'severe_sensitivity',
        'recent_aggressive_peel_or_laser_reaction',
        'open_skin',
        'active_infection',
      ],
    },
  },

  session_compatibility_matrix: {
    maximum_injury_modality_types_per_session_from_policy: 2,
    default_preference: 'one_primary_injury_modality',
    second_injury_modality_requires_material_regional_advantage: true,
    supportive_modalities_not_counted_as_injury: [
      'led',
      'cooling',
      'hydrafacial_support_when_non_exfoliative',
      'routine_aftercare',
    ],
    pairs: {
      'q_switch_laser+chemical_peel': 'conditional_protocol_specific',
      'q_switch_laser+microneedling_with_active': 'not_compatible_same_day',
      'q_switch_laser+electrocautery_or_rf': 'prefer_separate_session',
      'chemical_peel+microneedling_with_active': 'not_compatible_same_day',
      'chemical_peel+electrocautery_or_rf': 'prefer_separate_session',
      'microneedling_with_active+electrocautery_or_rf': 'prefer_separate_session',
      'any_injury_modality+led': 'compatible_when_skin_response_allows',
      'any_injury_modality+cooling': 'compatible',
    },
  },

  homecare: {
    broad_spectrum_sunscreen: {
      role: 'mandatory_photoprotection',
      eligible_for: ['all_pigmentation_components'],
    },
    tinted_sunscreen: {
      role: 'visible_light_and_melasma_support',
      eligible_for: [
        'melasma',
        'recurrent_pigmentation',
        'high_sun_exposure',
        'fitzpatrick_III_to_VI',
      ],
    },
    azelaic_acid: {
      role: 'pih_acne_melasma_and_sensitive_skin_support',
      classification: 'topical',
      doctor_signoff_if_prescription_strength: true,
      avoid_or_reduce_if: ['active_burning', 'severe_sensitivity'],
    },
    topical_tranexamic_acid: {
      role: 'melasma_and_recurrent_pigmentation_support',
      classification: 'topical',
    },
    niacinamide: {
      role: 'barrier_oil_and_mild_pigment_support',
      classification: 'topical',
    },
    vitamin_c: {
      role: 'antioxidant_brightening_support',
      classification: 'topical',
      avoid_or_reduce_if: ['stinging_or_irritation'],
    },
    barrier_moisturizer: {
      role: 'barrier_repair_and_post_procedure_support',
      classification: 'topical',
    },
    hydroquinone: {
      role: 'doctor_selected_strong_pigment_suppression',
      classification: 'prescription_or_doctor_signoff',
      avoid_if: [
        'suspected_ochronosis',
        'unsupervised_long_term_hydroquinone_history',
        'pregnancy_or_breastfeeding',
      ],
    },
    tretinoin: {
      role: 'doctor_selected_turnover_and_pigment_support',
      classification: 'prescription_or_doctor_signoff',
      avoid_or_defer_if: [
        'pregnancy',
        'breastfeeding',
        'severe_sensitivity',
        'barrier_compromised',
      ],
    },
    triple_combination: {
      role: 'doctor_selected_melasma_protocol',
      classification: 'prescription_or_doctor_signoff',
      avoid_if: [
        'unsupervised_steroid_use_history',
        'suspected_ochronosis',
        'pregnancy_or_breastfeeding',
        'barrier_compromised',
      ],
    },
  },

  authorization: {
    all_final_plans_require_doctor_signoff: true,
    doctor_constraints_are_authorization_not_efficacy_penalty: true,
    performed_by: {
      microneedling_with_active: 'doctor',
      q_switch_laser: 'therapist_after_doctor_approval',
      focal_laser: 'therapist_after_doctor_approval',
      chemical_peel: 'therapist_after_doctor_approval',
      deep_tca: 'doctor',
      electrocautery_or_rf: 'doctor',
      led: 'therapist_after_doctor_approval',
      hydrafacial: 'therapist_after_doctor_approval',
      prescription_homecare: 'doctor_signoff_required',
    },
    approval_status_values: [
      'ai_generated_pending_doctor_review',
      'doctor_approved',
      'doctor_modified',
      'deferred',
      'contraindicated',
    ],
  },

  provider_protocol_contract: {
    require_provider_protocol_for_every_current_block_session: true,
    require_session_execution_sequence: true,
    execution_step_types: [
      'cleanse',
      'numbing',
      'remove_numbing',
      'chemical_peel',
      'neutralize_peel',
      'q_switch',
      'focal_laser',
      'microneedling',
      'apply_active',
      'electrocautery_or_rf',
      'cooling',
      'led',
      'moisturizer',
      'sunscreen',
      'homecare_handover',
      'other',
    ],
    selected_modality_to_required_steps: {
      chemical_peel: ['chemical_peel'],
      q_switch_laser: ['q_switch'],
      focal_laser: ['focal_laser'],
      microneedling_with_active: ['microneedling', 'apply_active'],
      electrocautery_or_rf: ['electrocautery_or_rf'],
      led: ['led'],
      cooling: ['cooling'],
      hydrafacial: ['other'],
    },
    conditional_required_steps: {
      peel_requires_neutralization: ['neutralize_peel'],
      numbing_used: ['numbing', 'remove_numbing'],
      sunscreen_required: ['sunscreen'],
      aftercare_required: ['homecare_handover'],
    },
    required_sections: [
      'pre_treatment_checklist',
      'session_execution_sequence',
      'zone_sequence',
      'avoid_zones',
      'homecare_handover',
      'session_adaptation_rules',
      'authorization',
    ],
    standard_face_zone_order: [
      'forehead',
      'right_malar',
      'left_malar',
      'nose_bridge',
      'upper_lip_perioral',
      'chin_jaw',
      'periocular_if_doctor_selected',
    ],
  },

  hard_validation_contract: {
    backend_not_model_is_authoritative_validator: true,
    reject_or_repair_on_failure: true,

    diagnosis_rules: {
      enforce_specific_subtype_threshold_from_policy: true,
      image_metrics_must_match_validated_image_record: true,
      causal_subtype_requires_linked_causal_history: true,
      routine_confirmation_must_not_be_converted_to_medically_atypical_red_flag: true,
    },

    plan_rules: {
      maximum_injury_modalities_must_match_policy: true,
      every_selected_modality_requires_execution_step: true,
      every_use_true_modality_requires_execution_step: true,
      q_switch_optimizer_requires_laser_selected_for_component: true,
      selected_protocol_id_must_exist_and_be_configured_for_execution: true,
      selected_protocol_must_be_eligible_for_component_or_have_doctor_override: true,
      mesotherapy_formula_id_must_exist: true,
      mesotherapy_concentrations_must_match_config_exactly: true,
      wonderm_and_advancexo_injectable_must_be_false: true,
      all_microneedling_actives_injectable_must_be_false: true,
      medically_atypical_components_cannot_receive_cosmetic_procedure: true,
      peel_neutralization_step_required_when_config_requires_it: true,
      microneedling_active_step_required: true,
      returned_policy_version_must_match_supplied_policy_version: true,
      returned_config_version_must_match_supplied_config_version: true,
    },
  },

  runtime_config_projection: {
    use_two_stage_planning_when_possible: true,

    stage_1_component_selection: {
      include: [
        'config_version',
        'ontology_version',
        'modality_inventory_summary',
        'protocol_map',
        'session_compatibility_matrix',
        'high_level_authorization',
      ],
      exclude: [
        'raw_images',
        'full_q_switch_settings',
        'full_peel_protocols',
        'full_microneedling_protocols',
        'unrelated_products',
      ],
    },

    stage_2_protocol_expansion: {
      include_only_selected_protocols_and_nearest_eligible_alternatives: true,
      include_supportive_devices_when_selected: true,
      include_homecare_relevant_to_selected_components: true,
      include_provider_protocol_contract: true,
      include_hard_validation_contract: true,
    },

    plan_call_should_not_receive_raw_images_when_validated_image_analysis_is_present: true,
  },

  legacy_migration: {
    do_not_use_legacy_keys_for_new_runtime_selection: true,
    aliases_for_migration_only: {
      tanning_diffuse_pigmentation: 'photo_induced_pigmentation:tanning_or_facial_photomelanosis',
      melasma_like_pigmentation: 'melasma:subtype_uncertain',
      pih_acne_marks: 'post_inflammatory_hyperpigmentation:post_acne',
      mixed_facial_pigmentation: 'unclassified_pigmentation:any',
      upper_lip_perioral: 'perioral_hyperpigmentation:cause_uncertain',
      periocular: 'periocular_hyperpigmentation:mixed',
      advanceexo: 'ADVANCEXO_SKIN_REJUVE',
      wonderm: 'WONDERM',
      melasma_meso_solution: 'MESO_TXA5_HA2',
    },
    migration_note:
      'Legacy aliases may migrate stored records but must not be presented to the V2 model as selectable diagnostic categories.',
  },
}

/**
 * Deterministic backend helpers.
 * These functions do not replace request-level validation or database persistence.
 */

export function calculatePigmentationBurdenIndex(primitives) {
  const requiredKeys = [
    'coverage_100',
    'contrast_or_relative_intensity_100',
    'cross_mode_corroboration_100',
    'regional_clinical_salience_100',
  ]

  for (const key of requiredKeys) {
    const value = primitives?.[key]
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      throw new Error(`Invalid scoring primitive ${key}: expected a number from 0 to 100.`)
    }
  }

  const score = Math.round(
    0.45 * primitives.coverage_100 +
      0.35 * primitives.contrast_or_relative_intensity_100 +
      0.1 * primitives.cross_mode_corroboration_100 +
      0.1 * primitives.regional_clinical_salience_100,
  )

  return Math.max(1, Math.min(100, score))
}

export function assertPigmentationPolicyCompatibility(policyVersion) {
  if (!PIGMENTATION_CONFIG.compatible_policy_versions.includes(policyVersion)) {
    throw new Error(
      `Incompatible pigmentation policy version: ${policyVersion}. ` +
        `Expected one of: ${PIGMENTATION_CONFIG.compatible_policy_versions.join(', ')}`,
    )
  }
  return true
}

export function getPigmentationProtocolById(protocolId) {
  const registries = [
    PIGMENTATION_CONFIG.q_switch.protocols,
    PIGMENTATION_CONFIG.microneedling.protocols,
    PIGMENTATION_CONFIG.microneedling_actives.formulas_and_products,
    PIGMENTATION_CONFIG.peels.protocols,
    PIGMENTATION_CONFIG.lesion_directed_procedures,
    PIGMENTATION_CONFIG.supportive_devices,
  ]

  for (const registry of registries) {
    if (registry && Object.prototype.hasOwnProperty.call(registry, protocolId)) {
      return registry[protocolId]
    }
  }

  return null
}

export function resolvePigmentationProtocolMapEntry(family, subtype) {
  const directKey = `${family}:${subtype}`
  const aliases = PIGMENTATION_CONFIG.protocol_map.subtype_alias_resolution
  const resolvedKey = aliases[directKey] || directKey

  return (
    PIGMENTATION_CONFIG.protocol_map.entries[resolvedKey] ||
    PIGMENTATION_CONFIG.protocol_map.entries[`${family}:any`] ||
    null
  )
}

export function buildPigmentationComponentSelectionConfig() {
  return {
    config_version: PIGMENTATION_CONFIG.version,
    schema_version: PIGMENTATION_CONFIG.schema_version,
    ontology_version: PIGMENTATION_CONFIG.ontology_version,
    compatible_policy_versions: PIGMENTATION_CONFIG.compatible_policy_versions,
    modality_inventory_summary: PIGMENTATION_CONFIG.modality_inventory_summary,
    protocol_map: PIGMENTATION_CONFIG.protocol_map,
    session_compatibility_matrix: PIGMENTATION_CONFIG.session_compatibility_matrix,
    authorization: {
      all_final_plans_require_doctor_signoff:
        PIGMENTATION_CONFIG.authorization.all_final_plans_require_doctor_signoff,
      performed_by: PIGMENTATION_CONFIG.authorization.performed_by,
    },
  }
}

export function buildPigmentationExecutionConfig(protocolIds = []) {
  const protocols = {}

  for (const protocolId of [...new Set(protocolIds)]) {
    const protocol = getPigmentationProtocolById(protocolId)
    if (!protocol) {
      throw new Error(`Unknown pigmentation protocol ID: ${protocolId}`)
    }
    if (protocol.configured_for_execution === false) {
      throw new Error(
        `Protocol ${protocolId} is not configured for execution: ` +
          `${protocol.block_reason || 'missing required clinic configuration'}`,
      )
    }
    protocols[protocolId] = protocol
  }

  return {
    config_version: PIGMENTATION_CONFIG.version,
    schema_version: PIGMENTATION_CONFIG.schema_version,
    protocols,
    provider_protocol_contract: PIGMENTATION_CONFIG.provider_protocol_contract,
    hard_validation_contract: PIGMENTATION_CONFIG.hard_validation_contract,
    authorization: PIGMENTATION_CONFIG.authorization,
  }
}

export function validatePigmentationConfig() {
  const errors = []

  if (!PIGMENTATION_CONFIG.compatible_policy_versions.length) {
    errors.push('At least one compatible policy version is required.')
  }

  for (const [formulaId, formula] of Object.entries(
    PIGMENTATION_CONFIG.microneedling_actives.formulas_and_products,
  )) {
    if (formula.injectable !== false) {
      errors.push(`${formulaId} must have injectable=false.`)
    }
  }

  for (const [protocolId, protocol] of Object.entries(PIGMENTATION_CONFIG.peels.protocols)) {
    if (
      protocol.configured_for_execution === true &&
      protocol.neutralization_required === true &&
      !protocol.neutralization_method
    ) {
      errors.push(`${protocolId} requires a neutralization_method.`)
    }
  }

  for (const [mapKey, mapEntry] of Object.entries(PIGMENTATION_CONFIG.protocol_map.entries)) {
    const referencedIds = [
      ...(mapEntry.eligible_protocol_ids || []),
      ...(mapEntry.background_protocol_ids || []),
      ...(mapEntry.focal_flat_macule_protocol_ids || []),
    ]

    for (const protocolId of referencedIds) {
      if (!getPigmentationProtocolById(protocolId)) {
        errors.push(`${mapKey} references unknown protocol ID ${protocolId}.`)
      }
    }
  }

  return {
    passed: errors.length === 0,
    errors,
  }
}

export default PIGMENTATION_CONFIG
