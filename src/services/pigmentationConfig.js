export const PIGMENTATION_CONFIG = {
  module: 'pigmentation_decode',
  version: '0.1',
  clinic_profile: 'ai_aesthetics_jaipur_v1',
  image_modes: ['white', 'surface_polarized', 'subsurface_polarized', 'red', 'woods_uv'],
  q_switch_ndyag: {
    brand_model: 'Numitech',
    wavelengths_nm: [532, 755, 1064],
    frequency_hz_range: {
      min: 1,
      max: 10,
    },
    energy_mj_range: {
      min: 100,
      max: 2000,
    },
    spot_area_cm2: 1.0,
    fluence_conversion: {
      formula: 'fluence_j_cm2 = energy_mj / 1000 / spot_area_cm2',
      note: 'With spot_area_cm2 = 1, 500mJ = 0.5 J/cm2',
    },
    preset_modes_available: false,
    performed_by: 'therapist_after_doctor_approval',
    doctor_approval_required: true,
    setting_output_rule: {
      primary_machine_setting: 'energy_mj',
      clinical_reference_setting: 'fluence_j_cm2',
      frequency_unit: 'Hz',
      wavelength_unit: 'nm',
    },
  },
  q_switch_protocols: {
    tanning_diffuse_pigmentation: {
      allowed_wavelengths_nm: [1064],
      preferred_wavelength_nm: 1064,
      energy_mj_range: { min: 200, max: 400 },
      fluence_j_cm2_range: { min: 0.2, max: 0.4 },
      frequency_hz_recommended_range: { min: 3, max: 6 },
      passes_recommended_range: { min: 1, max: 2 },
      endpoint: 'mild_warmth_or_very_mild_erythema_no_frosting',
      preferred_when: ['diffuse_tanning', 'uneven_tone', 'melanin_dominant_or_mixed_low_erythema'],
      reduce_energy_if: [
        'high_erythema_load',
        'recent_sun_exposure',
        'poor_sunscreen_compliance',
        'sensitive_skin',
        'periocular_or_perioral_zone',
      ],
    },

    melasma_like_pigmentation: {
      allowed_wavelengths_nm: [1064],
      preferred_wavelength_nm: 1064,
      energy_mj_range: { min: 400, max: 800 },
      fluence_j_cm2_range: { min: 0.4, max: 0.8 },
      frequency_hz_recommended_range: { min: 3, max: 6 },
      passes_recommended_range: { min: 1, max: 2 },
      endpoint: 'no_aggressive_endpoint_no_frosting_no_excess_heat',
      preferred_when: [
        'stable_melasma_like_pattern',
        'low_to_moderate_erythema_load',
        'sunscreen_compliance_acceptable',
      ],
      defer_or_reduce_if: [
        'unstable_or_spreading',
        'high_erythema_load',
        'active_burning_or_stinging',
        'recent_procedure_reaction',
        'poor_sunscreen_compliance',
      ],
    },

    pih_acne_marks: {
      allowed_wavelengths_nm: [1064],
      preferred_wavelength_nm: 1064,
      energy_mj_range: { min: 300, max: 600 },
      energy_mj_default: 500,
      fluence_j_cm2_range: { min: 0.3, max: 0.6 },
      fluence_j_cm2_default: 0.5,
      frequency_hz_recommended_range: { min: 3, max: 6 },
      passes_recommended_range: { min: 1, max: 2 },
      endpoint: 'mild_warmth_no_frosting',
      preferred_when: [
        'post_inflammatory_macules',
        'active_acne_not_frequent',
        'erythema_load_controlled',
      ],
      defer_if: [
        'frequent_active_acne',
        'high_erythema_load',
        'active_inflammation_first_required',
      ],
    },

    upper_lip_perioral: {
      allowed_wavelengths_nm: [1064],
      preferred_wavelength_nm: 1064,
      energy_mj_range: { min: 200, max: 350 },
      energy_mj_default: 300,
      fluence_j_cm2_range: { min: 0.2, max: 0.35 },
      fluence_j_cm2_default: 0.3,
      frequency_hz_recommended_range: { min: 3, max: 5 },
      passes_recommended_range: { min: 1, max: 1 },
      endpoint: 'very_mild_warmth_no_frosting',
      preferred_when: ['perioral_pigmentation_barrier_stable', 'no_active_burning'],
      defer_if: ['active_burning', 'severe_sensitivity', 'recent_waxing_threading_bleach_reaction'],
    },

    periocular: {
      allowed_wavelengths_nm: [1064],
      preferred_wavelength_nm: 1064,
      energy_mj_range: { min: 100, max: 200 },
      energy_mj_default: 100,
      fluence_j_cm2_range: { min: 0.1, max: 0.2 },
      fluence_j_cm2_default: 0.1,
      frequency_hz_recommended_range: { min: 2, max: 4 },
      passes_recommended_range: { min: 1, max: 1 },
      endpoint: 'very_conservative_no_heat_build_up',
      preferred_when: [
        'doctor_selected_periocular_pigment',
        'pigment_dominant_not_structural_shadow',
      ],
      defer_if: [
        'eye_irritation',
        'active_eczema_or_rubbing',
        'vascular_or_shadow_dominant_darkness',
      ],
    },

    focal_epidermal_spot_doctor_cleared: {
      allowed_wavelengths_nm: [532, 755, 1064],
      preferred_wavelength_nm: 'optimizer_select',
      energy_mj_range_by_wavelength: {
        532: { min: 100, max: 250 },
        755: { min: 100, max: 400 },
        1064: { min: 200, max: 500 },
      },
      frequency_hz_recommended_range: { min: 1, max: 4 },
      passes_recommended_range: { min: 1, max: 1 },
      endpoint: 'doctor_defined_spot_endpoint',
      requires_doctor_visual_clearance: true,
      cosmetic_treatment_allowed_only_if: [
        'no_red_flag_history',
        'doctor_visual_review_completed',
        'lesion_not_marked_as_suspicious',
      ],
    },

    carbon_facial: {
      allowed_wavelengths_nm: [1064],
      preferred_wavelength_nm: 1064,
      energy_mj_range: { min: 200, max: 500 },
      fluence_j_cm2_range: { min: 0.2, max: 0.5 },
      frequency_hz_recommended_range: { min: 3, max: 6 },
      passes_recommended_range: { min: 1, max: 2 },
      endpoint: 'carbon_response_without_excess_heat',
      preferred_when: [
        'oily_skin',
        'congestion',
        'acne_prone_dullness',
        'pigmentation_not_melasma_dominant',
      ],
    },
  },
  q_switch_setting_optimizer: {
    enabled: true,
    optimize_for: 'maximum_expected_improvement_with_acceptable_safety',
    principle:
      'Evaluate all available wavelengths and settings, then select the safest effective setting. Doctor approval is an authorization step, not an efficacy penalty.',
    candidate_wavelengths_nm: [532, 755, 1064],
    default_safe_wavelength_nm: 1064,
    scoring_weights: {
      efficacy: 0.45,
      safety: 0.45,
      downtime: 0.05,
      recurrence_prevention: 0.05,
    },
    zone_wavelength_planning: {
      enabled: true,
      principle:
        'The treatment planner must not apply the single best global wavelength uniformly to all zones. It must generate a zone-wise safe-efficacy plan using a global base wavelength plus regional/spot overrides where justified.',
      session_strategy_rules: {
        allow_global_base_wavelength: true,
        allow_regional_overrides: true,
        allow_spot_only_overrides: true,
        max_distinct_wavelength_strategies_per_session: 3,
        preferred_structure: [
          'one_global_base_wavelength',
          'up_to_one_regional_override_strategy',
          'up_to_one_spot_only_override_strategy',
        ],
        note: 'Avoid unnecessary complexity. Use zone-wise or spot-wise wavelength changes only when there is a meaningful efficacy advantage and safety remains acceptable.',
      },
      zone_strategy_types: [
        'base_global_toning',
        'regional_override',
        'spot_only_override',
        'exclude_from_treatment',
        'defer_zone',
      ],
      zone_selection_logic: {
        use_global_base_when: [
          'zone_pattern_is_diffuse_or_patchy',
          'pigment_is_melanin_dominant_or_mixed_without_focal_superficial_macule_advantage',
          '1064_has_best_safety_efficacy_balance',
        ],
        use_regional_override_when: [
          'zone_pattern_differs_materially_from_rest_of_face',
          'regional_override_improves_efficacy_without_unacceptable_PIH_risk',
          'doctor_review_requirements_are_met',
        ],
        use_spot_only_override_when: [
          'there_is_a_doctor_cleared_focal_superficial_macule_or_focal_target',
          'spot_wavelength_offers_clear_advantage_over_global_base',
          'surrounding_zone_should_not_receive_that_wavelength',
        ],
        exclude_zone_or_subzone_when: [
          'suspect_lesion_pending_doctor_review',
          'open_skin',
          'active_infection',
          'barrier_break_or_active_irritation',
          'scar_shadow_should_not_be_treated_as_pigment',
        ],
      },
      wavelength_zone_preferences: {
        1064: {
          preferred_zone_roles: [
            'base_global_toning',
            'regional_override_for_diffuse_melanin_dominant_pigment',
          ],
          best_for: [
            'forehead_diffuse_tone',
            'malar_diffuse_or_mixed_pigment',
            'nose_bridge_if_treated_conservatively',
            'upper_lip_perioral_conservative_toning',
            'chin_jaw_blending',
          ],
        },
        532: {
          preferred_zone_roles: ['spot_only_override'],
          best_for: ['doctor_cleared_superficial_epidermal_focal_macules'],
          should_not_be_used_as: ['global_full_face_toning'],
        },
        755: {
          preferred_zone_roles: ['regional_override', 'spot_only_override'],
          best_for: ['doctor_selected_focal_or_mixed_regional_pigment'],
          should_not_be_used_as: ['routine_full_face_toning_in_high_PIH_risk_patterns'],
        },
      },
    },
    wavelength_rules: {
      1064: {
        ai_can_select: true,
        role: 'default_safe_workhorse_for_indian_skin',
        preferred_for: [
          'tanning_diffuse_pigmentation',
          'melasma_like_pigmentation',
          'pih_acne_marks',
          'mixed_facial_pigmentation',
          'perioral_pigmentation',
          'periocular_pigmentation',
        ],
        avoid_if: ['active_burning', 'untreated_high_erythema_in_melasma_or_pih'],
      },
      532: {
        ai_can_select: true,
        requires_doctor_visual_review: true,
        role: 'superficial_epidermal_spot_selected_cases',
        preferred_for: ['focal_epidermal_pigment'],
        avoid_if: [
          'melasma_like_pigmentation',
          'high_erythema_load',
          'fitzpatrick_V_to_VI_high_pih_risk',
          'uncertain_or_suspicious_lesion',
        ],
      },
      755: {
        ai_can_select: true,
        requires_doctor_visual_review: true,
        role: 'selected_pigment_option',
        preferred_for: ['focal_or_mixed_pigment'],
        avoid_if: [
          'active_inflammation',
          'unstable_melasma',
          'uncertain_or_suspicious_lesion',
          'high_pih_risk',
        ],
      },
    },
    safety_constraints: {
      reduce_energy_if: [
        'high_erythema_load_index',
        'current_sensitivity_moderate_or_severe',
        'recent_procedure_darkening',
        'recent_sunburn_or_high_sun_exposure',
        'periocular_zone',
        'perioral_zone',
        'fitzpatrick_IV_to_VI',
      ],
      defer_if: [
        'red_flag_lesion_present',
        'active_infection',
        'active_burning',
        'melasma_or_pih_with_high_inflammation_first_required',
      ],
    },
    region_specific_selection_rules: {
      principle:
        'Every wavelength recommendation must specify whether it is suitable for full-face use, regional use, focal spot use, or not recommended.',
      treatment_scope_values: ['full_face', 'regional', 'spot_only', 'not_recommended'],
      required_region_fields_for_each_candidate: [
        'eligible_regions',
        'best_use_regions',
        'avoid_regions',
        'requires_doctor_visual_review_regions',
        'rationale_by_region',
      ],
      region_list: [
        'forehead',
        'right_malar',
        'left_malar',
        'nose_bridge',
        'periocular',
        'upper_lip_perioral',
        'chin_jaw',
        'isolated_spot_or_macule',
        'scar_modifier_region',
        'friction_modifier_region',
      ],
      wavelength_region_logic: {
        1064: {
          typical_scope: 'full_face_or_regional',
          eligible_regions: [
            'forehead',
            'right_malar',
            'left_malar',
            'nose_bridge',
            'upper_lip_perioral',
            'chin_jaw',
          ],
          cautious_regions: [
            'periocular',
            'active_erythema_regions',
            'barrier_compromised_regions',
          ],
          avoid_regions: ['suspect_lesion_pending_doctor_review', 'open_skin', 'active_infection'],
        },
        532: {
          typical_scope: 'spot_only',
          eligible_regions: [
            'doctor_cleared_superficial_focal_macule',
            'doctor_cleared_epidermal_spot',
          ],
          cautious_regions: [
            'forehead_if_focal_epidermal_spots_only',
            'malar_if_focal_epidermal_spots_only',
          ],
          avoid_regions: [
            'full_face',
            'melasma_like_patches',
            'periocular',
            'perioral',
            'high_erythema_regions',
            'fitzpatrick_IV_to_VI_high_pih_risk_regions',
            'suspect_lesion_pending_doctor_review',
          ],
        },
        755: {
          typical_scope: 'regional_or_spot_only_doctor_selected',
          eligible_regions: ['doctor_selected_focal_or_mixed_pigment'],
          cautious_regions: ['malar_focal_macules', 'forehead_focal_macules'],
          avoid_regions: [
            'unstable_melasma',
            'high_erythema_regions',
            'periocular',
            'active_inflammation',
            'suspect_lesion_pending_doctor_review',
          ],
        },
      },
    },
    output_required_fields: [
      'candidate_settings',
      'candidate_region_applicability',
      'selected_global_setting',
      'selected_regional_or_spot_settings',
      'efficacy_score_100',
      'safety_score_100',
      'overall_score_100',
      'selection_reason',
      'zone_adjustments',
      'avoid_zones',
    ],
  },
  microneedling: {
    device: 'Dr. Pen',
    performed_by: 'doctor',
    max_depth_mm: 2.0,
    cartridge_type: 'disposable',
    downtime_hours: { min: 72, max: 96 },
    default_route_for_actives: 'topical_transdermal_after_microneedling',
    injectable_route_policy: 'doctor_override_only',
    efficacy_note:
      'Do not down-rank because doctor-performed. Treat doctor performance as authorization/execution metadata.',
    protocols: {
      melasma_like_pigmentation: {
        depth_mm: 1.5,
        frequency_days: 30,
        preferred_actives: ['advanceexo', 'wonderm', 'melasma_meso_solution'],
        preferred_when: [
          'stable_melasma',
          'melasma_persistent_after_initial_laser_or_peel',
          'melasma_with_texture_or_barrier_repair_need',
        ],
        defer_if: [
          'high_erythema_load',
          'active_burning',
          'unstable_spreading_melasma',
          'active_infection',
        ],
      },
      perioral_pigmentation: {
        depth_mm: 1.5,
        frequency_days: 30,
        preferred_actives: ['advanceexo', 'wonderm', 'melasma_meso_solution'],
        preferred_when: [
          'barrier_stable_perioral_pigmentation',
          'friction_or_irritant_history_controlled',
        ],
        defer_if: [
          'active_burning',
          'severe_sensitivity',
          'recent_waxing_threading_bleach_reaction',
        ],
      },
      periocular_pigmentation: {
        depth_mm: 0.5,
        frequency_days: 30,
        preferred_actives: ['advanceexo', 'wonderm'],
        preferred_when: [
          'pigment_or_texture_dominant_periocular_darkness',
          'doctor_confirms_not_structural_shadow_dominant',
        ],
        defer_if: [
          'active_eye_rubbing_or_allergy',
          'eczema_or_dermatitis',
          'vascular_or_hollowing_dominant_darkness',
        ],
      },
      pih_acne_marks: {
        depth_mm_range: { min: 1.5, max: 2.0 },
        frequency_days: 30,
        preferred_when: ['post_acne_pigment_with_texture', 'active_acne_controlled'],
        defer_if: ['frequent_active_acne', 'high_erythema_load', 'active_infection'],
      },
      acne_scars_with_pih: {
        depth_mm: 2.0,
        frequency_days: 30,
        preferred_when: ['acne_scars_with_residual_pih', 'active_acne_controlled'],
        defer_if: ['frequent_active_acne', 'active_infection', 'keloid_tendency'],
      },
      scar_texture_modifier: {
        depth_mm: 'doctor_select_up_to_2mm',
        frequency_days: 30,
        preferred_when: ['scar_like_or_texture_modifier_detected'],
        note: 'Scar-shadow should not be treated as pure pigmentation failure. Consider scar/texture pathway.',
      },
    },
  },
  regenerative_actives: {
    advanceexo: {
      category: 'exosome',
      product_description: 'mesenchymal_exosome',
      default_route: 'topical_transdermal_after_microneedling',
      route_options: ['topical_transdermal_after_microneedling', 'injectable_doctor_override_only'],
      injectable_allowed: 'doctor_override_only',
      ai_may_directly_recommend_injection: false,
      ai_may_flag_injection_for_doctor_consideration: true,
      batch_expiry_record_required: true,
    },
    wonderm: {
      category: 'pdrn',
      default_route: 'topical_transdermal_after_microneedling',
      route_options: ['topical_transdermal_after_microneedling', 'injectable_doctor_override_only'],
      injectable_allowed: 'doctor_override_only',
      ai_may_directly_recommend_injection: false,
      ai_may_flag_injection_for_doctor_consideration: true,
      batch_expiry_record_required: true,
    },
    melasma_meso_solution: {
      category: 'meso',
      actives: ['tranexamic_acid', 'vitamin_c', 'hyaluronic_acid'],
      default_route: 'topical_transdermal_after_microneedling',
      route_options: ['topical_transdermal_after_microneedling', 'injectable_doctor_override_only'],
      injectable_allowed: 'doctor_override_only',
      ai_may_directly_recommend_injection: false,
      ai_may_flag_injection_for_doctor_consideration: true,
      preferred_for: [
        'melasma_like_pigmentation',
        'perioral_pigmentation',
        'mixed_pigment_texture_cases',
      ],
    },
  },
  peels: {
    biorepeelcl3: {
      available: true,
      display_name: 'BioRePeelCl3',
      category: 'biphasic_low_downtime_tca_peel',
      main_active: 'TCA',
      typical_strength: 'BioRePeelCl3 FND commonly described as 35% TCA biphasic peel',
      role: 'low_downtime_pigment_rejuvenation_peel',

      contact_time_minutes: { min: 3, max: 5 },
      neutralization_required: false,
      removal_method: 'wipe_clean_with_water_soaked_gauze',
      endpoint: 'mild_controlled_erythema_or_tolerable_stinging_no_frosting_target',

      repeat_interval_days: { min: 7, max: 30 },
      preferred_repeat_interval_days_for_pigmentation_program: 30,

      can_combine_same_day_with_q_switch: true,
      q_switch_combination_condition: {
        allowed_if: [
          'q_switch_low_energy_only',
          'erythema_load_index_below_40',
          'no_active_burning_or_stinging',
          'no_recent_procedure_reaction',
          'doctor_approved_combination_session',
        ],
        preferred_sequence: 'q_switch_first_then_biorepeelcl3_if_skin_response_is_calm',
        avoid_if: [
          'high_erythema_load',
          'unstable_melasma',
          'active_dermatitis',
          'recent_sunburn',
          'recent_darkening_after_laser_or_peel',
        ],
      },

      can_combine_same_day_with_led: true,
      led_combination_condition: 'red_led_or_calming_led_recommended_post_peel',
      can_combine_same_day_with_facial: true,
      facial_combination_condition:
        'allowed_with_gentle_non_exfoliative_hydration_or_cleansing_facial; avoid aggressive exfoliation in same sitting',

      sequence_role: 'primary_peel_or_between_laser_sessions',
      preferred_for: [
        'melasma_like_pigmentation',
        'tanning_diffuse_pigmentation',
        'general_rejuvenation',
        'mild_pih',
        'uneven_tone',
        'mild_mixed_facial_pigmentation',
        'epidermal_predominant_or_mixed_epidermal_predominant_pigment',
      ],
      avoid_or_defer_if: [
        'active_burning',
        'severe_sensitivity',
        'visible_inflammation_high',
        'recent_procedure_reaction',
        'active_infection',
        'barrier_compromised',
        'red_flag_lesion_pending_review',
      ],
      performed_by: 'therapist_after_doctor_approval',
      doctor_approval_required: true,
    },

    mandelic_peel: {
      available: true,
      display_name: 'Mandelic Peel',
      category: 'superficial_alpha_hydroxy_acid_peel',
      main_active: 'mandelic_acid',
      typical_strength_percent: { min: 30, max: 45 },
      role: 'gentle_pigment_texture_sensitive_skin_and_ethnic_skin_support',

      contact_time_minutes: { min: 5, max: 10 },
      neutralization_required: true,
      neutralization_method: 'alkaline_neutralizer_or_cool_water_rinse_depending_on_product',
      endpoint: 'mild_erythema_or_tolerable_stinging_no_frosting',
      stop_early_if: [
        'excessive_burning',
        'sharp_pain',
        'grey_white_epidermolysis',
        'blistering',
        'unexpected_urticarial_reaction',
      ],

      repeat_interval_days: { min: 14, max: 28 },
      preferred_repeat_interval_days_for_pigmentation_program: 21,

      can_combine_same_day_with_q_switch: true,
      q_switch_combination_condition: {
        allowed_if: [
          'q_switch_low_energy_only',
          'mandelic_contact_time_kept_conservative_5_to_7_minutes',
          'erythema_load_index_below_35',
          'no_active_burning_or_sensitivity',
          'no_recent_procedure_darkening',
        ],
        preferred_sequence: 'q_switch_first_then_mandelic_peel_if_no_excess_erythema',
        avoid_if: [
          'high_erythema_load',
          'active_barrier_compromise',
          'unstable_melasma',
          'recent_darkening_after_peel_or_laser',
        ],
      },

      can_combine_same_day_with_led: true,
      led_combination_condition: 'red_led_or_calming_led_allowed_post_peel',
      can_combine_same_day_with_facial: true,
      facial_combination_condition:
        'allowed_with_gentle_hydration_or_cleansing_facial; avoid additional scrubs_or_microdermabrasion_same_day',

      sequence_role: 'gentle_peel_between_laser_sessions_or_first_peel_for_sensitive_skin',
      preferred_for: [
        'sensitive_skin',
        'mild_pih',
        'perioral_pigmentation_if_barrier_stable',
        'melasma_like_pigmentation_support',
        'mild_uneven_tone',
        'maintenance',
        'fitzpatrick_III_to_VI',
      ],
      avoid_or_defer_if: [
        'active_burning',
        'severe_sensitivity',
        'recent_procedure_reaction',
        'open_skin',
        'red_flag_lesion_pending_review',
      ],
      performed_by: 'therapist_after_doctor_approval',
      doctor_approval_required: true,
    },

    salicylic_peel: {
      available: true,
      display_name: 'Salicylic Peel',
      category: 'superficial_beta_hydroxy_acid_peel',
      main_active: 'salicylic_acid',
      typical_strength_percent: { min: 20, max: 30 },
      role: 'acne_control_oil_control_comedones_and_pih_support',

      contact_time_minutes: { min: 3, max: 5 },
      neutralization_required: false,
      removal_method: 'wash_or_rinse_after_pseudofrost_crystallization_and_burning_subsides',
      endpoint: 'even_pseudofrost_or_crystallization_with_tolerable_stinging',
      stop_early_if: [
        'excessive_burning',
        'diffuse_intense_erythema',
        'urticarial_reaction',
        'sharp_pain',
      ],

      repeat_interval_days: { min: 14, max: 28 },
      preferred_repeat_interval_days_for_pigmentation_program: 21,

      can_combine_same_day_with_q_switch: true,
      q_switch_combination_condition: {
        allowed_if: [
          'acne_or_oil_pih_driver_present',
          'q_switch_low_energy_only',
          'erythema_load_index_below_35',
          'barrier_stable',
          'no_moderate_or_severe_sensitivity',
        ],
        preferred_sequence:
          'salicylic_peel_first_for_acne_control_pathway_or_q_switch_first_for_pigment_toning_pathway; choose one dominant goal',
        avoid_if: [
          'dry_sensitive_skin',
          'high_erythema_load',
          'active_burning',
          'recent_irritant_reaction',
          'aspirin_sensitivity_if_relevant',
        ],
      },

      can_combine_same_day_with_led: true,
      led_combination_condition: 'blue_led_if_acne_active_or_red_led_if_post_peel_calming_needed',
      can_combine_same_day_with_facial: true,
      facial_combination_condition:
        'allowed_with_extraction_free_acne_safe_cleansing_or_hydration; avoid aggressive_extraction_or_scrubbing_same_day',

      sequence_role: 'acne_first_or_pih_support',
      preferred_for: [
        'pih_acne_marks',
        'active_acne_with_pigment',
        'oily_skin',
        'comedonal_acne',
        'acne_related_erythema_control_support',
        'mild_melasma_with_oily_acne_overlap',
      ],
      avoid_or_defer_if: [
        'dry_sensitive_barrier',
        'severe_erythema',
        'active_burning',
        'recent_irritant_reaction',
        'aspirin_sensitivity_if_relevant',
        'pregnancy_if_clinic_policy_avoids_salicylic_peel',
        'red_flag_lesion_pending_review',
      ],
      performed_by: 'therapist_after_doctor_approval',
      doctor_approval_required: true,
    },

    glycolic_peel: {
      available: true,
      display_name: 'Glycolic Peel',
      category: 'superficial_alpha_hydroxy_acid_peel',
      main_active: 'glycolic_acid',
      typical_strength_percent: { min: 20, max: 70 },
      preferred_strength_percent_for_indian_pigmentation_start: { min: 20, max: 35 },
      role: 'diffuse_tan_photodamage_epidermal_pigment_and_melasma_support',

      contact_time_minutes: { min: 2, max: 5 },
      preferred_initial_contact_time_minutes: 3,
      neutralization_required: true,
      neutralization_method:
        '10_to_15_percent_sodium_bicarbonate_or_clinic_neutralizer_then_water_rinse',
      endpoint: 'mild_uniform_erythema_without_epidermolysis',
      stop_early_if: [
        'excessive_erythema',
        'grey_white_epidermolysis',
        'small_blisters',
        'sharp_pain',
        'excessive_burning',
      ],

      repeat_interval_days: { min: 14, max: 30 },
      preferred_repeat_interval_days_for_pigmentation_program: 21,

      can_combine_same_day_with_q_switch: true,
      q_switch_combination_condition: {
        allowed_if: [
          'q_switch_low_energy_only',
          'glycolic_strength_20_to_35_percent_if_same_day',
          'glycolic_contact_time_2_to_3_minutes_if_same_day',
          'erythema_load_index_below_35',
          'stable_skin_no_active_burning',
        ],
        preferred_sequence:
          'q_switch_first_then_low_strength_glycolic_if_no_excess_heat_or_erythema',
        avoid_if: [
          'high_erythema_load',
          'melasma_unstable_or_spreading',
          'barrier_compromised',
          'recent_procedure_darkening',
          'sensitive_skin',
        ],
      },

      can_combine_same_day_with_led: true,
      led_combination_condition: 'red_led_or_calming_led_recommended_post_peel',
      can_combine_same_day_with_facial: true,
      facial_combination_condition:
        'allowed_with_gentle_hydration_only; avoid_same_day_hydrafacial_acid_boosters_or_scrubs',

      sequence_role: 'pigment_reduction_cycle_or_maintenance',
      preferred_for: [
        'tanning_diffuse_pigmentation',
        'epidermal_predominant_pigment',
        'uneven_tone',
        'photodamage',
        'melasma_like_pigmentation_if_stable_and_low_erythema',
      ],
      avoid_or_defer_if: [
        'sensitive_skin',
        'high_erythema_load',
        'active_burning',
        'recent_procedure_reaction',
        'barrier_compromised',
        'poor_sunscreen_compliance',
        'red_flag_lesion_pending_review',
      ],
      performed_by: 'therapist_after_doctor_approval',
      doctor_approval_required: true,
    },

    yellow_peel: {
      available: true,
      display_name: 'Yellow Peel',
      category: 'retinoid_depigmenting_leave_on_peel',
      main_active: 'retinoid_based_depigmenting_complex',
      role: 'advanced_melasma_or_stubborn_epidermal_pigment_support_after_stabilization',

      contact_time_minutes: null,
      leave_on_time_hours: { min: 4, max: 6 },
      neutralization_required: false,
      removal_method: 'patient_or_clinic_wash_off_after_leave_on_period_as_directed',
      endpoint: 'even_application_without_excess_burning_during_observation_period',
      stop_early_if: [
        'excessive_burning',
        'marked_erythema',
        'urticarial_reaction',
        'unexpected_swelling',
      ],

      repeat_interval_days: { min: 30, max: 45 },
      preferred_repeat_interval_days_for_pigmentation_program: 30,

      can_combine_same_day_with_q_switch: false,
      q_switch_combination_condition: {
        reason:
          'Retinoid/depigmenting leave-on peels increase irritation potential; same-day Q-switch is not preferred in Indian pigmentation pathways.',
        preferred_spacing_days_after_q_switch: { min: 14, max: 21 },
        preferred_spacing_days_before_q_switch: { min: 21, max: 30 },
      },

      can_combine_same_day_with_led: true,
      led_combination_condition: 'calming_led_allowed_before_discharge_if_no_irritation',
      can_combine_same_day_with_facial: false,
      facial_combination_condition:
        'avoid_same_day_facial_or_hydrafacial; keep as dedicated peel session',

      sequence_role: 'advanced_pigment_cycle_after_stabilization',
      preferred_for: [
        'stable_melasma_like_pigmentation',
        'persistent_epidermal_pigment',
        'recurrent_pigmentation_after_basic_cycles',
        'high_melanin_load_with_low_erythema',
      ],
      avoid_or_defer_if: [
        'pregnancy',
        'breastfeeding',
        'active_burning',
        'severe_sensitivity',
        'recent_retinoid_overuse',
        'barrier_compromised',
        'poor_sunscreen_compliance',
        'high_erythema_load',
        'red_flag_lesion_pending_review',
      ],
      performed_by: 'therapist_after_doctor_approval',
      doctor_approval_required: true,
    },

    lactic_peel: {
      available: true,
      display_name: 'Lactic Peel',
      category: 'gentle_alpha_hydroxy_acid_peel',
      main_active: 'lactic_acid',
      typical_strength_percent: { min: 30, max: 50 },
      preferred_strength_percent_for_sensitive_or_indian_skin: { min: 30, max: 40 },
      role: 'hydrating_gentle_brightening_barrier_friendly_pigment_support',

      contact_time_minutes: { min: 3, max: 7 },
      preferred_initial_contact_time_minutes: 3,
      neutralization_required: true,
      neutralization_method: 'alkaline_neutralizer_or_water_rinse_depending_on_formulation',
      endpoint: 'mild_erythema_or_tolerable_stinging_without_frosting',
      stop_early_if: [
        'excessive_burning',
        'diffuse_intense_erythema',
        'grey_white_epidermolysis',
        'blistering',
      ],

      repeat_interval_days: { min: 14, max: 28 },
      preferred_repeat_interval_days_for_pigmentation_program: 21,

      can_combine_same_day_with_q_switch: true,
      q_switch_combination_condition: {
        allowed_if: [
          'q_switch_low_energy_only',
          'lactic_contact_time_3_to_5_minutes',
          'erythema_load_index_below_35',
          'barrier_stable',
        ],
        preferred_sequence: 'q_switch_first_then_lactic_peel_if_no_excess_erythema',
        avoid_if: [
          'active_burning',
          'high_erythema_load',
          'recent_procedure_reaction',
          'open_skin',
        ],
      },

      can_combine_same_day_with_led: true,
      led_combination_condition: 'red_led_or_calming_led_allowed_post_peel',
      can_combine_same_day_with_facial: true,
      facial_combination_condition:
        'allowed_with_gentle_hydrating_facial; avoid_additional_acid_boosters_same_day',

      sequence_role: 'gentle_peel_or_maintenance',
      preferred_for: [
        'mild_tanning',
        'dry_dull_skin',
        'sensitive_skin',
        'mild_pigment_with_barrier_concern',
        'periocular_pigmentation_if_doctor_selected_and_not_close_to_lid_margin',
        'maintenance',
      ],
      avoid_or_defer_if: [
        'active_burning',
        'severe_sensitivity',
        'open_skin',
        'recent_procedure_reaction',
        'red_flag_lesion_pending_review',
      ],
      performed_by: 'therapist_after_doctor_approval',
      doctor_approval_required: true,
    },

    black_peel: {
      available: true,
      display_name: 'Black Peel',
      category: 'carbon_charcoal_or_black_acid_peel_protocol',
      product_identity_sensitive: true,
      assumed_protocol_type: 'carbon_or_charcoal_assisted_oily_acne_dullness_pigment_support',
      main_active: 'carbon_charcoal_or_brand_specific_black_peel_complex',
      role: 'oil_congestion_dullness_acne_prone_pigment_support',

      contact_time_minutes: { min: 5, max: 10 },
      neutralization_required: false,
      removal_method:
        'remove_or_wash_off_before_laser_if_carbon_based; otherwise follow brand-specific removal',
      endpoint: 'even_drying_or_tolerable_tightness_without_burning',
      stop_early_if: [
        'burning',
        'marked_erythema',
        'itching_or_urticaria',
        'unexpected_irritation',
      ],

      repeat_interval_days: { min: 21, max: 30 },
      preferred_repeat_interval_days_for_pigmentation_program: 30,

      can_combine_same_day_with_q_switch: true,
      q_switch_combination_condition: {
        allowed_if: [
          'used_as_carbon_facial_or_carbon_laser_pathway',
          'q_switch_1064_low_energy',
          'oily_or_congested_skin',
          'erythema_load_index_below_35',
          'barrier_stable',
        ],
        preferred_sequence:
          'apply_black_carbon_layer_then_q_switch_1064_if_carbon_facial_protocol; otherwise do_not_combine_without_doctor_protocol',
        avoid_if: [
          'dry_sensitive_barrier',
          'active_burning',
          'severe_erythema',
          'recent_procedure_reaction',
          'melasma_unstable_or_high_erythema',
        ],
      },

      can_combine_same_day_with_led: true,
      led_combination_condition: 'red_led_for_calming_or_blue_led_if_acne_driver_present',
      can_combine_same_day_with_facial: true,
      facial_combination_condition:
        'allowed_with_oil_control_or_hydration_facial_if_no_additional_aggressive_exfoliation',

      sequence_role: 'oily_acne_prone_support_or_carbon_facial_related_pathway',
      preferred_for: [
        'oily_skin',
        'congestion',
        'acne_prone_dullness',
        'mild_pih_with_oiliness',
        'carbon_facial_pathway',
      ],
      avoid_or_defer_if: [
        'dry_sensitive_barrier',
        'active_burning',
        'severe_erythema',
        'recent_procedure_reaction',
        'red_flag_lesion_pending_review',
      ],
      performed_by: 'therapist_after_doctor_approval',
      doctor_approval_required: true,
    },
  },
  devices: {
    led: {
      available: true,
      display_name: 'LED Therapy',
      category: 'supportive_recovery_device',
      not_primary_pigmentation_treatment: true,
      performed_by: 'therapist_after_doctor_approval',
      doctor_approval_required: true,
      modes: {
        red_led: {
          role: 'calming_recovery_barrier_and_erythema_support',
          preferred_for: [
            'post_q_switch',
            'post_peel',
            'post_microneedling',
            'barrier_repair',
            'mild_erythema_support',
          ],
        },
        blue_led: {
          role: 'acne_support',
          preferred_for: ['active_acne', 'acne_pih_driver', 'oily_acne_prone_skin'],
        },
        yellow_or_green_led: {
          role: 'optional_brightening_or_calming_support',
          preferred_for: ['sensitive_skin', 'mild_erythema', 'maintenance'],
        },
      },
    },

    hydrafacial: {
      available: true,
      display_name: 'Hydrafacial / Hydrodermabrasion',
      category: 'supportive_cleansing_hydration_device',
      role: 'supportive_for_dullness_tanning_congestion_and_barrier_friendly_prep',
      not_primary_melasma_treatment: true,
      performed_by: 'therapist_after_doctor_approval',
      doctor_approval_required: true,
      preferred_for: [
        'dullness',
        'mild_tanning',
        'congestion',
        'maintenance',
        'supportive_facial_with_pigmentation_plan',
      ],
      avoid_or_defer_if: [
        'active_burning',
        'severe_sensitivity',
        'recent_aggressive_peel_or_laser_reaction',
        'open_skin_or_active_infection',
      ],
      can_combine_same_day_with_led: true,
      can_combine_same_day_with_peel: 'doctor_selected_only',
      can_combine_same_day_with_q_switch: 'doctor_selected_only',
    },
  },
  homecare: {
    sunscreen: {
      broad_spectrum_sunscreen: {
        role: 'mandatory_photoprotection',
        preferred_for: ['all_pigmentation_cases'],
      },
      tinted_sunscreen: {
        role: 'visible_light_and_melasma_support',
        preferred_for: [
          'melasma_like_pigmentation',
          'recurrent_pigmentation',
          'high_sun_exposure',
          'fitzpatrick_III_to_VI',
        ],
      },
    },
    pigment_control_non_rx: {
      azelaic_acid: {
        role: 'pih_acne_marks_melasma_support_sensitive_skin',
        avoid_or_reduce_if: ['active_burning', 'severe_sensitivity'],
      },
      tranexamic_acid: {
        role: 'melasma_like_and_recurrent_pigmentation_support',
      },
      niacinamide: {
        role: 'barrier_support_oil_control_mild_pigment_support',
      },
      vitamin_c: {
        role: 'antioxidant_brightening_support',
        avoid_or_reduce_if: ['stinging_or_irritation'],
      },
      barrier_moisturizer: {
        role: 'barrier_repair_and_post_procedure_support',
        preferred_for: ['all_cases_with_sensitivity_or_procedure'],
      },
    },
    prescription_or_doctor_signoff: {
      hydroquinone: {
        role: 'doctor_selected_strong_pigment_suppression',
        avoid_if: [
          'suspected_ochronosis',
          'unsupervised_long_term_hydroquinone_history',
          'pregnancy_or_breastfeeding',
        ],
      },
      tretinoin: {
        role: 'doctor_selected_turnover_and_pigment_support',
        avoid_or_defer_if: [
          'pregnancy',
          'breastfeeding',
          'severe_sensitivity',
          'barrier_compromised',
        ],
      },
      triple_combination: {
        role: 'doctor_selected_melasma_protocol',
        avoid_if: [
          'unsupervised_steroid_use_history',
          'suspected_ochronosis',
          'pregnancy_or_breastfeeding',
          'barrier_compromised',
        ],
      },
    },
  },
  global_rules: {
    doctor_signoff_required: true,
    recommendation_principle:
      'Generate the clinically best AI-recommended plan using all available modalities and settings. Do not down-rank a modality merely because it is doctor-performed or requires approval.',
    authorization_principle:
      'Doctor approval/performance is an execution requirement and authorization layer, not an efficacy penalty.',
    inflammation_first_rule:
      'If high erythema/inflammation is present in melasma-like pigmentation or PIH, treat the vascular/inflammatory component first before pigment-aggressive procedures.',
    erythema_vs_inflammation_rule:
      'Erythema Load Index is image-derived vascular redness. Inflammation activity is a clinical interpretation after adding history, sensitivity, acne, recent procedure reaction and symptoms.',
    suspicious_lesion_rule:
      'If an unusual/outlier lesion is detected or red-flag history is positive/uncertain, localize it and withhold cosmetic treatment on that lesion until doctor visual review.',
    injectables:
      'AI should default exosome/PDRN/meso to topical/transdermal use after microneedling. Injectable use may only be flagged for doctor consideration, not directly recommended by AI.',
    scoring_rule:
      'All AI scoring outputs must use 1-100 indices only. Do not output 1-5 pigmentation or inflammation scores.',
  },
  authorization: {
    clinical_recommendation_mode: {
      optimize_for: 'maximum_expected_improvement_with_acceptable_safety',
      doctor_constraints_used_as: 'authorization_metadata_not_efficacy_penalty',
      doctor_can_edit_before_finalization: true,
    },
    performed_by_rules: {
      microneedling: 'doctor',
      q_switch_ndyag: 'therapist_after_doctor_approval',
      peels: 'therapist_after_doctor_approval',
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
  provider_protocol_rules: {
    require_step_by_step_protocol: true,
    required_sections: [
      'pre_treatment_checklist',
      'zone_sequence',
      'settings_by_zone',
      'endpoint_rules',
      'avoid_zones',
      'post_treatment_steps',
      'homecare_handover',
    ],
    standard_face_zone_order: [
      'forehead',
      'right_malar',
      'left_malar',
      'nose_bridge',
      'perioral_upper_lip',
      'chin_jaw',
      'periocular_if_doctor_selected',
    ],
    zone_adjustment_principles: {
      reduce_energy_or_intensity_for: [
        'periocular',
        'perioral',
        'nose_bridge_friction_modifier',
        'scar_texture_modifier',
        'high_erythema_region',
        'barrier_compromised_region',
      ],
      avoid_treating: [
        'suspect_lesion_pending_doctor_review',
        'active_infection',
        'open_skin',
        'active_burning_area',
      ],
    },
    q_switch_endpoint_rules: [
      'mild_warmth_allowed',
      'very_mild_erythema_allowed',
      'no_frosting_for_toning_protocols',
      'no_excess_heat_build_up',
      'stop_if_sharp_pain_greying_blistering_or_unexpected_reaction',
    ],
    peel_endpoint_rules: [
      'controlled_erythema_only',
      'stop_if_excessive_burning',
      'neutralize_as_per_protocol',
      'do_not_continue_over_active_burning_or_open_skin',
    ],
  },
}
