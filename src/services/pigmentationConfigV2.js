/**
 * Pigmentation Decode V2.4 clinic inventory, phenotype, scoring and execution configuration.
 *
 * TARGET ARCHITECTURE
 * 1. One five-image phenotype call with precise patient-side location text.
 * 2. Deterministic application scoring and critical structural validation.
 * 3. Compact text-only diagnosis with complete morphology-group resolution.
 * 4. Compact treatment planning using only case-eligible exact protocols.
 * 5. No silent full-stage reruns; doctor validates, edits and authorizes.
 *
 * IMPORTANT
 * - Clinical priority remains in PIGMENTATION_CLINICAL_POLICY_V2.
 * - This file owns data contracts, scoring profiles, inventory, protocol identity, settings,
 *   routes, compatibility and hard validation requirements.
 * - Deploy this V2.4 config only with the matching lean prompts, validators and store.
 */

export const PIGMENTATION_CONFIG = {
  "module": "pigmentation_decode",
  "version": "2.4.0",
  "schema_version": "pigmentation_config_schema_v2_4",
  "ontology_version": "pigmentation_ontology_v2_3",
  "clinic_profile": "ai_aesthetics_jaipur_v2",
  "compatible_policy_versions": [
    "pigmentation_clinical_policy_v2_4_2026_07_24"
  ],
  "architecture_contract": {
    "policy_and_config_are_separate_sources": true,
    "policy_owns": [
      "diagnostic_confidence_and_specificity",
      "treatment_priority_and_comparison",
      "component_first_reasoning",
      "session_modality_limit",
      "reassessment_strategy",
      "patient_communication_policy"
    ],
    "config_owns": [
      "phenotype_data_contract",
      "anatomical_location_vocabulary",
      "scoring_profiles_and_arithmetic",
      "inventory_availability",
      "protocol_ids_and_modality_identity",
      "device_capabilities",
      "product_and_formula_composition",
      "routes",
      "settings",
      "contact_times",
      "neutralization",
      "endpoints",
      "provider_authorization",
      "compatibility",
      "hard_runtime_validation"
    ],
    "source_of_truth_order": [
      "validated_morphology_and_phenotype_record",
      "validated_diagnosis_with_complete_group_resolution",
      "doctor_constraints_within_hard_safety_boundaries",
      "clinical_policy",
      "protocol_map_and_inventory",
      "model_reasoning"
    ],
    "reject_request_on_policy_config_conflict": true,
    "doctor_is_validator_editor_and_authorizer": true,
    "application_code_is_authoritative_for_scores_and_validation": true
  },
  "lean_runtime_contract": {
    "architecture_version": "pigmentation_pipeline_v2_4_lean",
    "baseline_image_calls": 1,
    "diagnosis_receives_images": false,
    "treatment_receives_images": false,
    "image_stage_returns_positive_and_clinically_relevant_uncertain_findings_only": true,
    "local_application_scoring_is_authoritative": true,
    "model_self_validation_fields_are_not_required": true,
    "no_silent_full_stage_reruns": true,
    "validation_policy": "reject_only_structural_or_clinically_material_contradictions",
    "optional_repair_call_must_be_explicit_and_compact": true,
    "critical_reasoning_stages": [
      "diagnosis",
      "treatment_plan",
      "formal_reassessment"
    ]
  },
  "image_acquisition": {
    "required_modes": [
      "white",
      "surface_polarized",
      "subsurface_polarized",
      "red",
      "woods_uv"
    ],
    "required_mode_count": 5,
    "canonical_mode_order": [
      "white",
      "surface_polarized",
      "subsurface_polarized",
      "red",
      "woods_uv"
    ],
    "api_image_detail": "high",
    "morphology_reference_mode_order": [
      "surface_polarized",
      "white",
      "subsurface_polarized"
    ],
    "measurement_mode_roles": {
      "white": "overall_colour_distribution_and_patient_readable_reference",
      "surface_polarized": "primary_surface_texture_edge_and_elevation_assessment",
      "subsurface_polarized": "subsurface_persistence_depth_and_vascular_corroboration",
      "red": "relative_vascular_distribution_not_global_red_cast",
      "woods_uv": "epidermal_accentuation_porhyrin_dryness_and_fluorescence_corroboration"
    },
    "morphology_census_requires_region_by_region_review": true,
    "suggested_region_crops": [
      "right_outer_malar",
      "left_outer_malar",
      "right_central_malar",
      "left_central_malar",
      "periocular",
      "upper_lip_perioral"
    ]
  },
  "phenotype_pipeline_contract": {
    "pipeline_stages": [
      "morphology_census",
      "phenotype_measurement_against_locked_groups",
      "application_validation_and_scoring",
      "dynamic_history",
      "diagnosis_with_group_resolution",
      "component_targeted_treatment_planning",
      "component_and_location_matched_reassessment"
    ],
    "morphology_census_is_separate_from_burden_measurement": true,
    "one_group_per_visually_distinct_population": true,
    "co_located_flat_and_raised_populations_must_be_separate": true,
    "uncertain_elevation_is_not_permission_to_omit_group": true,
    "phenotype_presence_is_independent_of_burden_severity": true,
    "minimal_score_must_not_remove_clinically_distinct_component": true,
    "morphology_group_required_fields": [
      "group_id",
      "clinical_relevance",
      "clinical_location_text",
      "anatomical_regions",
      "patient_side",
      "image_display_side",
      "morphology",
      "surface",
      "elevation",
      "distribution",
      "colour_description",
      "supporting_modes",
      "burden_category",
      "presence_status",
      "confidence_100"
    ],
    "morphology_values": [
      "macule",
      "patch",
      "papule",
      "plaque",
      "mixed_maculopapular",
      "diffuse_background",
      "reticular",
      "scar_or_depression",
      "structural_shadow",
      "active_inflammatory_lesion",
      "scale_or_barrier_change",
      "other"
    ],
    "surface_values": [
      "smooth",
      "scaly",
      "keratotic_like",
      "verrucous_like",
      "textured",
      "uncertain",
      "not_applicable"
    ],
    "elevation_values": [
      "flat",
      "probably_flat",
      "uncertain",
      "probably_raised",
      "raised",
      "depressed",
      "not_applicable"
    ],
    "presence_status_values": [
      "present",
      "absent",
      "uncertain"
    ],
    "clinical_relevance_values": [
      "clinically_relevant",
      "minor_but_trackable",
      "artifact_or_excluded"
    ],
    "burden_categories": [
      "global_background_melanin",
      "global_background_erythema",
      "flat_focal_pigmented_lesion",
      "raised_pigmented_lesion",
      "active_inflammatory_lesion",
      "structural_periocular_shadow",
      "scar_or_friction_modifier",
      "barrier_or_scale_modifier",
      "none"
    ],
    "localized_burden_required_fields": [
      "presence_status",
      "linked_group_ids",
      "measurement_primitives",
      "confidence_100",
      "summary"
    ],
    "linkage_rules": {
      "every_clinically_relevant_group_must_have_burden_category_or_explicit_non_scored_reason": true,
      "every_present_localized_burden_must_link_at_least_one_group": true,
      "every_raised_or_probably_raised_group_must_link_to_raised_burden": true,
      "every_flat_pigmented_macule_group_must_link_to_flat_focal_burden": true,
      "every_active_inflammatory_group_must_link_to_active_inflammatory_burden": true,
      "every_structural_shadow_group_must_link_to_structural_shadow_burden": true,
      "burden_summary_must_not_mention_unmapped_visual_population": true
    },
    "reference_modes": {
      "morphology_and_elevation_primary": [
        "surface_polarized",
        "white"
      ],
      "pigment_depth_corroboration": [
        "subsurface_polarized",
        "woods_uv"
      ],
      "vascular_corroboration": [
        "red",
        "white",
        "subsurface_polarized"
      ]
    }
  },
  "anatomical_location_contract": {
    "coordinate_system": {
      "primary_orientation": "patient_anatomical_side",
      "image_side_must_be_recorded_separately": true,
      "never_use_image_left_or_right_without_patient_side": true
    },
    "canonical_regions": [
      "forehead",
      "glabella",
      "right_temple",
      "left_temple",
      "right_periocular",
      "left_periocular",
      "right_outer_malar",
      "left_outer_malar",
      "right_central_malar",
      "left_central_malar",
      "right_medial_malar",
      "left_medial_malar",
      "nose_bridge",
      "right_nasal_ala",
      "left_nasal_ala",
      "upper_lip_perioral",
      "right_oral_commissure",
      "left_oral_commissure",
      "lower_lip_perioral",
      "chin",
      "right_jawline",
      "left_jawline",
      "whole_face"
    ],
    "background_reporting_regions": [
      "forehead",
      "right_malar",
      "left_malar",
      "nose_bridge",
      "periocular",
      "upper_lip_perioral",
      "chin_jaw"
    ],
    "landmark_terms": [
      "medial_to_outer_canthus",
      "inferolateral_to_outer_canthus",
      "along_lateral_zygomatic_prominence",
      "between_nasolabial_fold_and_central_malar_cheek",
      "adjacent_to_nasal_ala",
      "immediately_above_upper_lip",
      "lateral_to_oral_commissure",
      "along_mandibular_border",
      "central_forehead",
      "temporal_forehead"
    ],
    "required_location_fields_for_clinically_relevant_group": [
      "clinical_location_text",
      "anatomical_regions",
      "patient_side",
      "distribution"
    ],
    "location_text_rules": {
      "minimum_specificity": "Name patient side, anatomical subregion, landmark relationship and distribution. Broad labels such as face, cheek or pigmented area alone are invalid.",
      "bilateral_rule": "A bilateral group must describe both sides and state whether one side is more prominent.",
      "multifocal_rule": "A multifocal group must state whether lesions are scattered, clustered or confluent and provide a count band when visually estimable.",
      "co_located_morphology_rule": "Flat and raised populations in the same broad region must have separate morphology groups and separate location descriptions.",
      "treatment_copy_rule": "Diagnosis and treatment must copy the image-stage clinical_location_text unchanged; treatment may append procedure-specific targeting and exclusion instructions."
    },
    "count_bands": [
      "none",
      "1_to_5",
      "6_to_15",
      "16_to_30",
      "over_30",
      "not_reliably_countable"
    ]
  },
  "scoring_runtime_contract": {
    "model_returns_measurement_primitives_only_as_authoritative_inputs": true,
    "application_must_overwrite_model_score_100": true,
    "backend_must_overwrite_model_score_100": true,
    "backend_field_is_legacy_alias_only": true,
    "measurement_primitive_scale": {
      "min": 0,
      "max": 100
    },
    "final_index_scale": {
      "min": 1,
      "max": 100
    },
    "severity_thresholds": {
      "minimal": {
        "min": 1,
        "max": 15
      },
      "mild": {
        "min": 16,
        "max": 35
      },
      "moderate": {
        "min": 36,
        "max": 55
      },
      "severe": {
        "min": 56,
        "max": 75
      },
      "very_severe": {
        "min": 76,
        "max": 100
      }
    },
    "presence_is_independent_of_score": true,
    "absent_index_still_returns_score_1_and_presence_status_absent": true,
    "low_score_must_not_suppress_group_or_diagnosis_component": true,
    "profiles": {
      "background_area_contrast": {
        "description": "For diffuse or regional background melanin and background erythema. Measures field coverage and relative contrast while excluding focal lesions, structural shadow, hair, cosmetics and artifacts.",
        "primitive_keys": [
          "coverage_100",
          "contrast_or_relative_intensity_100",
          "cross_mode_corroboration_100",
          "regional_clinical_salience_100"
        ],
        "weights": {
          "coverage_100": 0.45,
          "contrast_or_relative_intensity_100": 0.35,
          "cross_mode_corroboration_100": 0.1,
          "regional_clinical_salience_100": 0.1
        }
      },
      "flat_focal_pigment": {
        "description": "For discrete flat pigmented macules or patches. Count/density and cumulative lesion area are separated so numerous small lesions are not underrepresented.",
        "primitive_keys": [
          "lesion_count_or_density_100",
          "cumulative_lesion_area_100",
          "contrast_or_relative_intensity_100",
          "cross_mode_corroboration_100",
          "treatment_salience_100"
        ],
        "weights": {
          "lesion_count_or_density_100": 0.25,
          "cumulative_lesion_area_100": 0.25,
          "contrast_or_relative_intensity_100": 0.25,
          "cross_mode_corroboration_100": 0.15,
          "treatment_salience_100": 0.1
        }
      },
      "raised_pigmented_lesion": {
        "description": "For visible or probably raised pigmented papules/plaques. Presence is independent of total surface area; lesion number, elevation certainty and treatment salience are explicitly represented.",
        "primitive_keys": [
          "lesion_count_or_density_100",
          "elevation_certainty_100",
          "surface_prominence_100",
          "distribution_extent_100",
          "treatment_salience_100"
        ],
        "weights": {
          "lesion_count_or_density_100": 0.3,
          "elevation_certainty_100": 0.25,
          "surface_prominence_100": 0.15,
          "distribution_extent_100": 0.15,
          "treatment_salience_100": 0.15
        }
      },
      "active_inflammatory_lesion": {
        "description": "For active inflammatory papules, pustules or dermatitis-like lesions. Counts lesion burden and inflammatory intensity separately from global erythema.",
        "primitive_keys": [
          "lesion_count_or_density_100",
          "inflammatory_intensity_100",
          "distribution_extent_100",
          "cross_mode_corroboration_100",
          "clinical_salience_100"
        ],
        "weights": {
          "lesion_count_or_density_100": 0.3,
          "inflammatory_intensity_100": 0.3,
          "distribution_extent_100": 0.2,
          "cross_mode_corroboration_100": 0.1,
          "clinical_salience_100": 0.1
        }
      },
      "structural_periocular_shadow": {
        "description": "For periocular darkness driven mainly by contour, crease and shadow rather than melanin. This score must not be interpreted as pigment-treatment burden.",
        "primitive_keys": [
          "regional_extent_100",
          "shadow_gradient_intensity_100",
          "anatomical_contour_corroboration_100",
          "cross_mode_persistence_100",
          "clinical_salience_100"
        ],
        "weights": {
          "regional_extent_100": 0.25,
          "shadow_gradient_intensity_100": 0.3,
          "anatomical_contour_corroboration_100": 0.25,
          "cross_mode_persistence_100": 0.1,
          "clinical_salience_100": 0.1
        }
      }
    },
    "index_profile_map": {
      "global_background_melanin_load_index": "background_area_contrast",
      "global_background_erythema_load_index": "background_area_contrast",
      "every_regional_background_melanin_index": "background_area_contrast",
      "every_regional_background_erythema_index": "background_area_contrast",
      "flat_focal_pigmented_lesion_burden_index": "flat_focal_pigment",
      "raised_pigmented_lesion_burden_index": "raised_pigmented_lesion",
      "active_inflammatory_lesion_burden_index": "active_inflammatory_lesion",
      "structural_periocular_shadow_burden_index": "structural_periocular_shadow"
    },
    "require_primitives_for": [
      "global_background_melanin_load_index",
      "global_background_erythema_load_index",
      "every_regional_background_melanin_index",
      "every_regional_background_erythema_index",
      "flat_focal_pigmented_lesion_burden_index",
      "raised_pigmented_lesion_burden_index",
      "active_inflammatory_lesion_burden_index",
      "structural_periocular_shadow_burden_index"
    ],
    "regional_indices_must_not_be_freely_generated": true,
    "immutable_within_assessment_after_application_validation": true,
    "repeatability_contract": {
      "independent_api_calls_reanalyse_images": true,
      "reuse_previous_analysis_by_image_hash": false,
      "identify_previous_uploads": false,
      "repeat_variation_target_points": {
        "preferred_max": 2,
        "acceptable_max": 3
      },
      "flag_for_quality_review_above_points": 3,
      "large_variation_action": "review_image_quality_mode_order_morphology_grouping_exclusions_locations_and_measurement_primitives",
      "quality_assurance_only": true
    }
  },
  "diagnosis_completeness_contract": {
    "diagnosis_must_not_recalculate_image_scores": true,
    "every_clinically_relevant_morphology_group_must_be_resolved": true,
    "allowed_group_resolutions": [
      "mapped_to_diagnostic_component",
      "explicitly_excluded_with_reason"
    ],
    "exclusion_requires_reason_and_doctor_action_when_relevant": true,
    "diagnosis_component_required_fields": [
      "diagnostic_component_id",
      "linked_group_ids",
      "clinical_location_text",
      "family",
      "subtype",
      "confidence_100",
      "diagnostic_status",
      "direct_cosmetic_treatment_status"
    ],
    "no_significant_diffuse_pigmentation_may_not_cancel_focal_components": true,
    "mixed_photo_induced_requires_component_split": true,
    "visual_completeness_audit": {
      "diagnosis_may_view_images_for_completeness_audit": true,
      "diagnosis_may_not_silently_add_unmeasured_group": true,
      "discrepancy_action": "Return phenotype_discrepancy with location and morphology; rerun morphology census and phenotype measurement before accepting diagnosis."
    }
  },
  "treatment_targeting_contract": {
    "doctor_role": "validate_edit_and_authorize_not_reconstruct_case",
    "every_procedural_component_requires_precise_target_location_text": true,
    "every_procedural_operation_requires": [
      "linked_component_ids",
      "linked_group_ids",
      "target_location_text",
      "exclude_group_ids",
      "exclusion_instruction"
    ],
    "target_location_text_must_copy_diagnostic_location": true,
    "broad_location_only_is_invalid": [
      "face",
      "cheeks",
      "pigmented_areas",
      "affected_region"
    ],
    "flat_and_raised_same_region_rule": "A procedure targeting flat pigment must explicitly exclude raised groups; lesion-directed treatment must explicitly exclude surrounding flat pigment groups.",
    "current_block_protocol_resolution_required": true,
    "future_roadmap_protocol_resolution_may_be_deferred": true,
    "reassessment_must_compare_same_group_and_location": true
  },
  "v2_ontology": {
    "families": {
      "melasma": [
        "epidermal",
        "mixed",
        "dermal",
        "subtype_uncertain"
      ],
      "photo_induced_pigmentation": [
        "tanning_or_facial_photomelanosis",
        "solar_lentigines",
        "ephelides",
        "mixed_photo_induced",
        "subtype_uncertain"
      ],
      "post_inflammatory_hyperpigmentation": [
        "post_acne",
        "post_dermatitis",
        "post_procedure",
        "post_laser_or_peel",
        "post_hair_removal_or_friction",
        "post_trauma_or_burn",
        "trigger_uncertain"
      ],
      "periocular_hyperpigmentation": [
        "melanin_dominant",
        "vascular_dominant",
        "structural_shadow_dominant",
        "mixed"
      ],
      "perioral_hyperpigmentation": [
        "melanin_dominant",
        "friction_or_hair_removal_related",
        "irritant_or_contact_related",
        "melasma_associated",
        "cause_uncertain"
      ],
      "pigmented_contact_dermatitis_or_lpp_like": [
        "pigmented_contact_dermatitis_or_riehl_like",
        "lichen_planus_pigmentosus_like",
        "inflammatory_pattern_uncertain"
      ],
      "acquired_dermal_melanocytosis": [
        "hori_like",
        "nevus_of_ota_like",
        "subtype_uncertain"
      ],
      "benign_raised_pigmented_lesion": [
        "seborrhoeic_keratosis_like",
        "dermatosis_papulosa_nigra_like",
        "other_benign_raised_lesion",
        "subtype_uncertain"
      ],
      "focal_melanocytic_or_lentiginous_lesion": [
        "melanocytic_nevus_like",
        "solar_lentigo_like",
        "other_stable_focal_lesion",
        "subtype_uncertain"
      ],
      "active_inflammatory_process": [
        "acne",
        "dermatitis_or_irritation",
        "other"
      ],
      "medically_atypical_focal_lesion": [],
      "scar_or_friction_modifier": [],
      "no_significant_diffuse_pigmentation": [],
      "unclassified_pigmentation": []
    },
    "morphology_values": [
      "macule",
      "patch",
      "papule",
      "plaque",
      "mixed_maculopapular",
      "diffuse_background",
      "reticular",
      "scar_or_depression",
      "structural_shadow",
      "active_inflammatory_lesion",
      "scale_or_barrier_change",
      "other"
    ],
    "treatment_scope_values": [
      "whole_face",
      "regional",
      "focal_lesion",
      "non_procedural"
    ],
    "elevation_values": [
      "flat",
      "probably_flat",
      "uncertain",
      "probably_raised",
      "raised",
      "depressed",
      "not_applicable"
    ],
    "surface_values": [
      "smooth",
      "scaly",
      "keratotic_like",
      "verrucous_like",
      "textured",
      "uncertain",
      "not_applicable"
    ],
    "burden_categories": [
      "global_background_melanin",
      "global_background_erythema",
      "flat_focal_pigmented_lesion",
      "raised_pigmented_lesion",
      "active_inflammatory_lesion",
      "structural_periocular_shadow",
      "scar_or_friction_modifier",
      "barrier_or_scale_modifier",
      "none"
    ],
    "anatomical_regions": [
      "forehead",
      "glabella",
      "right_temple",
      "left_temple",
      "right_periocular",
      "left_periocular",
      "right_outer_malar",
      "left_outer_malar",
      "right_central_malar",
      "left_central_malar",
      "right_medial_malar",
      "left_medial_malar",
      "nose_bridge",
      "right_nasal_ala",
      "left_nasal_ala",
      "upper_lip_perioral",
      "right_oral_commissure",
      "left_oral_commissure",
      "lower_lip_perioral",
      "chin",
      "right_jawline",
      "left_jawline",
      "whole_face"
    ]
  },
  "modality_inventory_summary": {
    "expose_this_compact_summary_to_component_selector": true,
    "do_not_expose_full_execution_protocols_until_modality_or_protocol_group_selected": true,
    "modalities": {
      "homecare": {
        "available": true,
        "injury_producing": false,
        "protocol_required": false,
        "required_execution_steps": [
          "homecare_handover"
        ]
      },
      "medical_control": {
        "available": true,
        "injury_producing": false,
        "protocol_required": false,
        "required_execution_steps": [
          "homecare_handover"
        ]
      },
      "chemical_peel": {
        "available": true,
        "injury_producing": true,
        "protocol_registry_path": "peels.protocols",
        "required_execution_steps": [
          "chemical_peel"
        ]
      },
      "microneedling_with_active": {
        "available": true,
        "injury_producing": true,
        "protocol_registry_path": "microneedling.protocols",
        "adjunct_registry_path": "microneedling_actives.formulas_and_products",
        "required_execution_steps": [
          "microneedling",
          "apply_active"
        ]
      },
      "q_switch_laser": {
        "available": true,
        "injury_producing": true,
        "protocol_registry_path": "q_switch.protocols",
        "protocol_scope_excludes": [
          "spot_only"
        ],
        "required_execution_steps": [
          "q_switch"
        ]
      },
      "focal_laser": {
        "available": true,
        "injury_producing": true,
        "protocol_registry_path": "q_switch.protocols",
        "protocol_scope_includes": [
          "spot_only"
        ],
        "required_execution_steps": [
          "focal_laser"
        ]
      },
      "electrocautery_or_rf": {
        "available": true,
        "injury_producing": true,
        "protocol_registry_path": "lesion_directed_procedures",
        "required_execution_steps": [
          "electrocautery_or_rf"
        ]
      },
      "hydrafacial": {
        "available": true,
        "injury_producing": false,
        "protocol_registry_path": "supportive_devices",
        "required_execution_steps": [
          "other"
        ]
      },
      "led": {
        "available": true,
        "injury_producing": false,
        "protocol_registry_path": "supportive_devices",
        "required_execution_steps": [
          "led"
        ]
      },
      "cooling": {
        "available": true,
        "injury_producing": false,
        "protocol_required": false,
        "required_execution_steps": [
          "cooling"
        ]
      },
      "observe": {
        "available": true,
        "injury_producing": false,
        "protocol_required": false,
        "required_execution_steps": []
      }
    }
  },
  "modality_execution_registry": {
    "homecare": {
      "available": true,
      "injury_producing": false,
      "protocol_required": false,
      "required_execution_steps": [
        "homecare_handover"
      ]
    },
    "medical_control": {
      "available": true,
      "injury_producing": false,
      "protocol_required": false,
      "required_execution_steps": [
        "homecare_handover"
      ]
    },
    "chemical_peel": {
      "available": true,
      "injury_producing": true,
      "protocol_registry_path": "peels.protocols",
      "required_execution_steps": [
        "chemical_peel"
      ]
    },
    "microneedling_with_active": {
      "available": true,
      "injury_producing": true,
      "protocol_registry_path": "microneedling.protocols",
      "adjunct_registry_path": "microneedling_actives.formulas_and_products",
      "required_execution_steps": [
        "microneedling",
        "apply_active"
      ]
    },
    "q_switch_laser": {
      "available": true,
      "injury_producing": true,
      "protocol_registry_path": "q_switch.protocols",
      "protocol_scope_excludes": [
        "spot_only"
      ],
      "required_execution_steps": [
        "q_switch"
      ]
    },
    "focal_laser": {
      "available": true,
      "injury_producing": true,
      "protocol_registry_path": "q_switch.protocols",
      "protocol_scope_includes": [
        "spot_only"
      ],
      "required_execution_steps": [
        "focal_laser"
      ]
    },
    "electrocautery_or_rf": {
      "available": true,
      "injury_producing": true,
      "protocol_registry_path": "lesion_directed_procedures",
      "required_execution_steps": [
        "electrocautery_or_rf"
      ]
    },
    "hydrafacial": {
      "available": true,
      "injury_producing": false,
      "protocol_registry_path": "supportive_devices",
      "required_execution_steps": [
        "other"
      ]
    },
    "led": {
      "available": true,
      "injury_producing": false,
      "protocol_registry_path": "supportive_devices",
      "required_execution_steps": [
        "led"
      ]
    },
    "cooling": {
      "available": true,
      "injury_producing": false,
      "protocol_required": false,
      "required_execution_steps": [
        "cooling"
      ]
    },
    "observe": {
      "available": true,
      "injury_producing": false,
      "protocol_required": false,
      "required_execution_steps": []
    }
  },
  "phenotype_modality_eligibility": {
    "flat_focal_isolated_lentiginous": {
      "compatible_modalities": [
        "focal_laser",
        "chemical_peel",
        "homecare"
      ],
      "note": "Applies when a small number of clearly flat, discrete lentiginous lesions are the dominant target."
    },
    "flat_or_regional_multifocal_mixed_depth_or_texture": {
      "compatible_modalities": [
        "microneedling_with_active",
        "chemical_peel",
        "q_switch_laser",
        "homecare"
      ],
      "comparison_required": true,
      "note": "Do not default to laser solely because lesions are on the cheeks. Compare expected improvement, depth, distribution, texture, PIH risk and prior response."
    },
    "raised_pigmented_papules_sk_dpn_like": {
      "compatible_modalities": [
        "electrocautery_or_rf"
      ],
      "explicitly_incompatible_as_primary_target": [
        "q_switch_laser",
        "focal_laser",
        "chemical_peel",
        "microneedling_with_active"
      ],
      "doctor_visual_confirmation_required": true
    },
    "structural_periocular_shadow_dominant": {
      "compatible_modalities": [
        "observe",
        "homecare"
      ],
      "pigment_injury_not_default": true
    },
    "barrier_or_scale_active": {
      "compatible_modalities": [
        "medical_control",
        "homecare",
        "led"
      ],
      "injury_modalities_deferred_until_stable": true
    }
  },
  "protocol_map": {
    "map_version": "pigmentation_protocol_map_v2_4",
    "selection_rule": "Clinical policy chooses the preferred modality after phenotype-first comparison. This map resolves eligible protocol IDs and blocks ineligible execution; it must not collapse co-located morphology groups.",
    "entries": {
      "melasma:epidermal": {
        "eligible_modality_groups": [
          "chemical_peel",
          "microneedling_with_active",
          "homecare"
        ],
        "eligible_protocol_ids": [
          "PEEL_GLYCOLIC",
          "PEEL_BIOREPEELCL3",
          "PEEL_MANDELIC",
          "PEEL_YELLOW",
          "PEEL_LACTIC",
          "MN_MELASMA_EPIDERMAL"
        ],
        "laser_protocol_ids": []
      },
      "melasma:mixed": {
        "eligible_modality_groups": [
          "microneedling_with_active",
          "chemical_peel",
          "q_switch_laser",
          "homecare"
        ],
        "eligible_protocol_ids": [
          "MN_MELASMA_MIXED",
          "PEEL_GLYCOLIC",
          "PEEL_BIOREPEELCL3",
          "PEEL_MANDELIC",
          "PEEL_YELLOW",
          "QS_MELASMA_MIXED_OR_DERMAL_1064"
        ]
      },
      "melasma:dermal": {
        "eligible_modality_groups": [
          "microneedling_with_active",
          "q_switch_laser",
          "homecare"
        ],
        "eligible_protocol_ids": [
          "MN_MELASMA_DERMAL",
          "QS_MELASMA_MIXED_OR_DERMAL_1064"
        ]
      },
      "melasma:subtype_uncertain": {
        "eligible_modality_groups": [
          "homecare",
          "doctor_review"
        ],
        "eligible_protocol_ids": [],
        "block_depth_specific_procedure_until_subtype_or_component_depth_is_resolved": true
      },
      "photo_induced_pigmentation:tanning_or_facial_photomelanosis": {
        "eligible_modality_groups": [
          "q_switch_laser",
          "chemical_peel",
          "microneedling_with_active",
          "homecare"
        ],
        "eligible_protocol_ids": [
          "QS_PHOTOMELANOSIS_1064",
          "PEEL_GLYCOLIC",
          "PEEL_BIOREPEELCL3",
          "PEEL_LACTIC",
          "MN_MULTIFOCAL_MIXED_PIGMENT"
        ],
        "microneedling_eligibility_note": "Eligible only for multifocal/regional or mixed-depth/texture phenotype; not a substitute for focal treatment of a few isolated lentigines."
      },
      "photo_induced_pigmentation:solar_lentigines": {
        "eligible_modality_groups": [
          "focal_laser",
          "chemical_peel",
          "homecare"
        ],
        "eligible_protocol_ids": [
          "QS_FOCAL_EPIDERMAL_SPOT",
          "PEEL_GLYCOLIC"
        ],
        "requires_doctor_visual_clearance_for_focal_laser": true
      },
      "photo_induced_pigmentation:ephelides": {
        "eligible_modality_groups": [
          "focal_laser",
          "chemical_peel",
          "homecare"
        ],
        "eligible_protocol_ids": [
          "QS_FOCAL_EPIDERMAL_SPOT",
          "PEEL_GLYCOLIC"
        ],
        "requires_doctor_visual_clearance_for_focal_laser": true
      },
      "photo_induced_pigmentation:mixed_photo_induced": {
        "resolution_rule": "Split background photomelanosis, flat focal macules and any raised pigmented population into separate diagnostic components. Compare field treatment options for the flat/regional component and use lesion-directed treatment only for confirmed raised groups.",
        "background_protocol_ids": [
          "QS_PHOTOMELANOSIS_1064",
          "PEEL_GLYCOLIC",
          "PEEL_BIOREPEELCL3"
        ],
        "focal_flat_macule_protocol_ids": [
          "QS_FOCAL_EPIDERMAL_SPOT"
        ],
        "regional_multifocal_protocol_ids": [
          "MN_MULTIFOCAL_MIXED_PIGMENT"
        ]
      },
      "photo_induced_pigmentation:subtype_uncertain": {
        "eligible_modality_groups": [
          "homecare",
          "doctor_review",
          "component_specific_only"
        ],
        "eligible_protocol_ids": [],
        "resolution_rule": "Resolve whether the component is background photomelanosis or focal lentiginous macules before selecting an execution protocol."
      },
      "post_inflammatory_hyperpigmentation:settled": {
        "eligible_modality_groups": [
          "q_switch_laser",
          "chemical_peel",
          "microneedling_with_active",
          "homecare"
        ],
        "eligible_protocol_ids": [
          "QS_SETTLED_PIH_1064",
          "PEEL_GLYCOLIC",
          "PEEL_MANDELIC",
          "PEEL_SALICYLIC",
          "MN_SETTLED_PIH_WITH_TEXTURE"
        ]
      },
      "post_inflammatory_hyperpigmentation:active_inflammation_present": {
        "eligible_modality_groups": [
          "medical_control",
          "homecare",
          "led",
          "chemical_peel_when_eligible"
        ],
        "eligible_protocol_ids": [
          "LED_BLUE_ACNE_SUPPORT",
          "LED_RED_CALMING",
          "PEEL_SALICYLIC"
        ],
        "blocked_until_inflammation_controlled": [
          "q_switch_laser",
          "focal_laser",
          "microneedling_with_active",
          "deep_tca"
        ]
      },
      "perioral_hyperpigmentation:melanin_dominant": {
        "eligible_modality_groups": [
          "homecare",
          "chemical_peel",
          "microneedling_with_active",
          "q_switch_laser"
        ],
        "eligible_protocol_ids": [
          "MN_PERIORAL_PIGMENT",
          "PEEL_MANDELIC",
          "PEEL_LACTIC",
          "QS_PERIORAL_1064"
        ]
      },
      "perioral_hyperpigmentation:friction_or_hair_removal_related": {
        "eligible_modality_groups": [
          "trigger_control",
          "homecare",
          "chemical_peel",
          "microneedling_with_active"
        ],
        "eligible_protocol_ids": [
          "PEEL_MANDELIC",
          "PEEL_LACTIC",
          "MN_PERIORAL_PIGMENT"
        ]
      },
      "perioral_hyperpigmentation:irritant_or_contact_related": {
        "eligible_modality_groups": [
          "medical_control",
          "barrier_repair",
          "homecare"
        ],
        "eligible_protocol_ids": [
          "LED_RED_CALMING"
        ],
        "procedures_blocked_while_active": true
      },
      "perioral_hyperpigmentation:cause_uncertain": {
        "eligible_modality_groups": [
          "homecare",
          "trigger_clarification",
          "doctor_review"
        ],
        "eligible_protocol_ids": [],
        "block_procedure_until_main_contributor_is_resolved": true
      },
      "perioral_hyperpigmentation:melasma_associated": {
        "eligible_modality_groups": [
          "homecare",
          "component_specific_melasma_pathway"
        ],
        "eligible_protocol_ids": [],
        "resolution_rule": "Link to the corresponding melasma component and use the melasma depth-specific protocol map."
      },
      "periocular_hyperpigmentation:melanin_dominant": {
        "eligible_modality_groups": [
          "homecare",
          "microneedling_with_active",
          "q_switch_laser"
        ],
        "eligible_protocol_ids": [
          "MN_PERIOCULAR_MELANIN_OR_TEXTURE",
          "QS_PERIOCULAR_1064"
        ]
      },
      "periocular_hyperpigmentation:structural_shadow_dominant": {
        "eligible_modality_groups": [
          "observe",
          "structural_assessment",
          "homecare"
        ],
        "eligible_protocol_ids": [],
        "block_pigment_procedure_as_default": true
      },
      "periocular_hyperpigmentation:vascular_dominant": {
        "eligible_modality_groups": [
          "medical_assessment",
          "homecare"
        ],
        "eligible_protocol_ids": [],
        "q_switch_not_default": true
      },
      "periocular_hyperpigmentation:mixed": {
        "eligible_modality_groups": [
          "homecare",
          "doctor_review",
          "component_specific_only"
        ],
        "eligible_protocol_ids": [
          "MN_PERIOCULAR_MELANIN_OR_TEXTURE",
          "QS_PERIOCULAR_1064"
        ],
        "resolution_rule": "Treat only the confirmed melanin or texture component; do not treat structural or vascular contribution as pigment."
      },
      "pigmented_contact_dermatitis_or_lpp_like:any": {
        "eligible_modality_groups": [
          "medical_control",
          "homecare"
        ],
        "eligible_protocol_ids": [],
        "procedures_blocked_until_medically_controlled": true
      },
      "acquired_dermal_melanocytosis:any": {
        "eligible_modality_groups": [
          "homecare",
          "q_switch_laser"
        ],
        "eligible_protocol_ids": [
          "QS_ACQUIRED_DERMAL_MELANOCYTOSIS_PENDING"
        ]
      },
      "benign_raised_pigmented_lesion:seborrhoeic_keratosis_like": {
        "eligible_modality_groups": [
          "electrocautery_or_rf"
        ],
        "eligible_protocol_ids": [
          "LESION_SK_DPN_ELECTROCAUTERY_OR_RF"
        ]
      },
      "benign_raised_pigmented_lesion:dermatosis_papulosa_nigra_like": {
        "eligible_modality_groups": [
          "electrocautery_or_rf"
        ],
        "eligible_protocol_ids": [
          "LESION_SK_DPN_ELECTROCAUTERY_OR_RF"
        ]
      },
      "benign_raised_pigmented_lesion:other_benign_raised_lesion": {
        "eligible_modality_groups": [
          "doctor_review",
          "other_lesion_directed"
        ],
        "eligible_protocol_ids": [],
        "require_specific_lesion_confirmation_before_procedure": true
      },
      "benign_raised_pigmented_lesion:subtype_uncertain": {
        "eligible_modality_groups": [
          "doctor_review"
        ],
        "eligible_protocol_ids": [],
        "require_specific_lesion_confirmation_before_procedure": true
      },
      "focal_melanocytic_or_lentiginous_lesion:any": {
        "eligible_modality_groups": [
          "observe",
          "doctor_review",
          "focal_laser_if_cleared"
        ],
        "eligible_protocol_ids": [
          "QS_FOCAL_EPIDERMAL_SPOT"
        ],
        "direct_treatment_requires_doctor_subtype_confirmation": true,
        "melanocytic_nevus_like_is_not_automatically_laser_eligible": true
      },
      "medically_atypical_focal_lesion:any": {
        "eligible_modality_groups": [
          "doctor_assessment"
        ],
        "eligible_protocol_ids": [],
        "all_cosmetic_procedures_blocked": true
      },
      "active_inflammatory_process:acne": {
        "eligible_modality_groups": [
          "medical_control",
          "led",
          "chemical_peel_when_eligible"
        ],
        "eligible_protocol_ids": [
          "LED_BLUE_ACNE_SUPPORT",
          "PEEL_SALICYLIC"
        ]
      },
      "scar_or_friction_modifier:any": {
        "eligible_modality_groups": [
          "trigger_control",
          "homecare",
          "microneedling_with_active_when_eligible"
        ],
        "eligible_protocol_ids": [
          "MN_SCAR_TEXTURE_MODIFIER"
        ]
      },
      "no_significant_diffuse_pigmentation:any": {
        "eligible_modality_groups": [
          "observe",
          "homecare",
          "component_specific_only"
        ],
        "eligible_protocol_ids": [],
        "block_background_pigment_procedure": true
      },
      "unclassified_pigmentation:any": {
        "eligible_modality_groups": [
          "doctor_review",
          "homecare"
        ],
        "eligible_protocol_ids": [],
        "block_aggressive_procedure_until_classified": true,
        "conditional_candidate_protocol_ids": [
          "MN_MULTIFOCAL_MIXED_PIGMENT"
        ],
        "candidate_resolution_rule": "May be considered only after the morphology group, location, depth and treatment eligibility are sufficiently resolved and a doctor approves the component-specific pathway."
      }
    },
    "subtype_alias_resolution": {
      "post_inflammatory_hyperpigmentation:post_acne": "post_inflammatory_hyperpigmentation:settled",
      "post_inflammatory_hyperpigmentation:post_dermatitis": "post_inflammatory_hyperpigmentation:settled",
      "post_inflammatory_hyperpigmentation:post_procedure": "post_inflammatory_hyperpigmentation:settled",
      "post_inflammatory_hyperpigmentation:post_laser_or_peel": "post_inflammatory_hyperpigmentation:settled",
      "post_inflammatory_hyperpigmentation:post_hair_removal_or_friction": "post_inflammatory_hyperpigmentation:settled",
      "post_inflammatory_hyperpigmentation:post_trauma_or_burn": "post_inflammatory_hyperpigmentation:settled",
      "post_inflammatory_hyperpigmentation:trigger_uncertain": "post_inflammatory_hyperpigmentation:settled",
      "acquired_dermal_melanocytosis:hori_like": "acquired_dermal_melanocytosis:any",
      "acquired_dermal_melanocytosis:nevus_of_ota_like": "acquired_dermal_melanocytosis:any",
      "focal_melanocytic_or_lentiginous_lesion:solar_lentigo_like": "focal_melanocytic_or_lentiginous_lesion:any",
      "focal_melanocytic_or_lentiginous_lesion:melanocytic_nevus_like": "focal_melanocytic_or_lentiginous_lesion:any"
    }
  },
  "q_switch": {
    "expose_full_q_switch_config_to_component_selector": false,
    "provide_full_q_switch_config_only_after_component_selects_laser": true,
    "device": {
      "available": true,
      "brand_model": "Numitech",
      "laser_type": "Q-switched Nd:YAG / available handpieces as configured",
      "wavelengths_nm": [
        532,
        755,
        1064
      ],
      "frequency_hz_range": {
        "min": 1,
        "max": 10
      },
      "energy_mj_range": {
        "min": 100,
        "max": 2000
      },
      "spot_area_cm2": 1,
      "preset_modes_available": false,
      "performed_by": "therapist_after_doctor_approval",
      "doctor_approval_required": true,
      "fluence_conversion": {
        "formula": "fluence_j_cm2 = energy_mj / 1000 / spot_area_cm2",
        "note": "With spot_area_cm2 = 1.0, 500 mJ = 0.5 J/cm2."
      },
      "setting_output_rule": {
        "primary_machine_setting": "energy_mj",
        "clinical_reference_setting": "fluence_j_cm2",
        "frequency_unit": "Hz",
        "wavelength_unit": "nm"
      }
    },
    "protocols": {
      "QS_PHOTOMELANOSIS_1064": {
        "available": true,
        "configured_for_execution": true,
        "treatment_scope": "whole_face_or_regional",
        "diagnosis_keys": [
          "photo_induced_pigmentation:tanning_or_facial_photomelanosis"
        ],
        "allowed_wavelengths_nm": [
          1064
        ],
        "energy_mj_range": {
          "min": 200,
          "max": 400
        },
        "fluence_j_cm2_range": {
          "min": 0.2,
          "max": 0.4
        },
        "frequency_hz_range": {
          "min": 3,
          "max": 6
        },
        "passes_range": {
          "min": 1,
          "max": 2
        },
        "endpoint": "mild_warmth_or_very_mild_erythema_no_frosting",
        "reduce_if": [
          "high_background_erythema",
          "recent_high_sun_exposure",
          "poor_sunscreen_compliance",
          "sensitive_skin",
          "periocular_or_perioral_zone",
          "fitzpatrick_IV_to_VI"
        ],
        "defer_if": [
          "active_burning",
          "active_infection",
          "open_skin",
          "new_or_unreviewed_medically_atypical_lesion"
        ],
        "protocol_id": "QS_PHOTOMELANOSIS_1064",
        "modality_id": "q_switch_laser"
      },
      "QS_SETTLED_PIH_1064": {
        "available": true,
        "configured_for_execution": true,
        "treatment_scope": "regional_or_whole_face_when_component_is_diffuse",
        "diagnosis_keys": [
          "post_inflammatory_hyperpigmentation:settled"
        ],
        "allowed_wavelengths_nm": [
          1064
        ],
        "energy_mj_range": {
          "min": 300,
          "max": 600
        },
        "fluence_j_cm2_range": {
          "min": 0.3,
          "max": 0.6
        },
        "frequency_hz_range": {
          "min": 3,
          "max": 6
        },
        "passes_range": {
          "min": 1,
          "max": 2
        },
        "endpoint": "mild_warmth_no_frosting",
        "eligible_only_if": [
          "causal_component_is_settled",
          "active_inflammation_is_controlled",
          "background_erythema_is_not_high"
        ],
        "defer_if": [
          "frequent_active_acne",
          "active_dermatitis_or_irritation",
          "inflammation_first_required",
          "recent_procedure_darkening"
        ],
        "protocol_id": "QS_SETTLED_PIH_1064",
        "modality_id": "q_switch_laser"
      },
      "QS_MELASMA_MIXED_OR_DERMAL_1064": {
        "available": true,
        "configured_for_execution": true,
        "treatment_scope": "regional_or_conservative_toning",
        "diagnosis_keys": [
          "melasma:mixed",
          "melasma:dermal"
        ],
        "allowed_wavelengths_nm": [
          1064
        ],
        "energy_mj_range": {
          "min": 400,
          "max": 800
        },
        "fluence_j_cm2_range": {
          "min": 0.4,
          "max": 0.8
        },
        "frequency_hz_range": {
          "min": 3,
          "max": 6
        },
        "passes_range": {
          "min": 1,
          "max": 2
        },
        "endpoint": "no_aggressive_endpoint_no_frosting_no_excess_heat",
        "eligible_only_if": [
          "clinical_policy_selected_q_switch_for_this_component",
          "melasma_is_stable",
          "sunscreen_compliance_is_acceptable",
          "erythema_and_inflammation_are_controlled"
        ],
        "defer_or_reduce_if": [
          "unstable_or_spreading_melasma",
          "high_background_erythema",
          "active_burning_or_stinging",
          "recent_procedure_reaction",
          "poor_sunscreen_compliance"
        ],
        "protocol_id": "QS_MELASMA_MIXED_OR_DERMAL_1064",
        "modality_id": "q_switch_laser"
      },
      "QS_PERIORAL_1064": {
        "available": true,
        "configured_for_execution": true,
        "treatment_scope": "regional",
        "diagnosis_keys": [
          "perioral_hyperpigmentation:melanin_dominant"
        ],
        "allowed_wavelengths_nm": [
          1064
        ],
        "energy_mj_range": {
          "min": 200,
          "max": 350
        },
        "fluence_j_cm2_range": {
          "min": 0.2,
          "max": 0.35
        },
        "frequency_hz_range": {
          "min": 3,
          "max": 5
        },
        "passes_range": {
          "min": 1,
          "max": 1
        },
        "endpoint": "very_mild_warmth_no_frosting",
        "eligible_only_if": [
          "doctor_selected_pigment_dominant_perioral_component",
          "barrier_stable",
          "no_active_burning"
        ],
        "defer_if": [
          "active_burning",
          "severe_sensitivity",
          "recent_waxing_threading_or_bleach_reaction",
          "irritant_or_contact_pattern_active"
        ],
        "protocol_id": "QS_PERIORAL_1064",
        "modality_id": "q_switch_laser"
      },
      "QS_PERIOCULAR_1064": {
        "available": true,
        "configured_for_execution": true,
        "treatment_scope": "regional_doctor_selected",
        "diagnosis_keys": [
          "periocular_hyperpigmentation:melanin_dominant"
        ],
        "allowed_wavelengths_nm": [
          1064
        ],
        "energy_mj_range": {
          "min": 100,
          "max": 200
        },
        "fluence_j_cm2_range": {
          "min": 0.1,
          "max": 0.2
        },
        "frequency_hz_range": {
          "min": 2,
          "max": 4
        },
        "passes_range": {
          "min": 1,
          "max": 1
        },
        "endpoint": "very_conservative_no_heat_build_up",
        "mandatory_eye_protection": true,
        "eligible_only_if": [
          "doctor_selected_periocular_pigment",
          "not_structural_shadow_dominant",
          "not_vascular_dominant",
          "no_active_eczema_or_rubbing_inflammation"
        ],
        "protocol_id": "QS_PERIOCULAR_1064",
        "modality_id": "q_switch_laser"
      },
      "QS_FOCAL_EPIDERMAL_SPOT": {
        "available": true,
        "configured_for_execution": true,
        "treatment_scope": "spot_only",
        "diagnosis_keys": [
          "photo_induced_pigmentation:solar_lentigines",
          "photo_induced_pigmentation:ephelides",
          "focal_melanocytic_or_lentiginous_lesion:any"
        ],
        "allowed_wavelengths_nm": [
          532,
          755,
          1064
        ],
        "energy_mj_range_by_wavelength": {
          "532": {
            "min": 100,
            "max": 250
          },
          "755": {
            "min": 100,
            "max": 400
          },
          "1064": {
            "min": 200,
            "max": 500
          }
        },
        "frequency_hz_range": {
          "min": 1,
          "max": 4
        },
        "passes_range": {
          "min": 1,
          "max": 1
        },
        "endpoint": "doctor_defined_spot_endpoint",
        "requires_doctor_visual_clearance": true,
        "requires_specific_focal_subtype_clearance": true,
        "not_eligible_when": [
          "melanocytic_nevus_like_without_explicit_doctor_clearance",
          "medically_atypical_or_uncertain_lesion",
          "new_change_bleeding_ulceration_or_crusting",
          "open_skin"
        ],
        "protocol_id": "QS_FOCAL_EPIDERMAL_SPOT",
        "modality_id": "focal_laser"
      },
      "QS_ACQUIRED_DERMAL_MELANOCYTOSIS_PENDING": {
        "available": true,
        "configured_for_execution": false,
        "selectable_by_ai": false,
        "treatment_scope": "doctor_selected",
        "diagnosis_keys": [
          "acquired_dermal_melanocytosis:any"
        ],
        "block_reason": "Exact clinic-approved wavelength, energy, spot, pass, interval, and endpoint protocol has not been supplied in the current config.",
        "protocol_id": "QS_ACQUIRED_DERMAL_MELANOCYTOSIS_PENDING",
        "modality_id": "q_switch_laser"
      },
      "QS_CARBON_FACIAL_1064": {
        "available": true,
        "configured_for_execution": true,
        "outside_core_pigmentation_backbone": true,
        "treatment_scope": "whole_face_or_regional",
        "allowed_wavelengths_nm": [
          1064
        ],
        "energy_mj_range": {
          "min": 200,
          "max": 500
        },
        "fluence_j_cm2_range": {
          "min": 0.2,
          "max": 0.5
        },
        "frequency_hz_range": {
          "min": 3,
          "max": 6
        },
        "passes_range": {
          "min": 1,
          "max": 2
        },
        "endpoint": "carbon_response_without_excess_heat",
        "eligible_when": [
          "oily_skin",
          "congestion",
          "acne_prone_dullness",
          "pigmentation_not_melasma_dominant"
        ],
        "protocol_id": "QS_CARBON_FACIAL_1064",
        "modality_id": "q_switch_laser"
      }
    },
    "optimizer": {
      "enabled": true,
      "may_run_only_after_laser_selected_for_component": true,
      "must_return_used_for_component_ids": true,
      "no_global_default_modality_or_wavelength_during_component_selection": true,
      "fallback_wavelength_only_after_laser_is_selected_and_no_focal_advantage_exists": 1064,
      "candidate_wavelengths_nm": [
        532,
        755,
        1064
      ],
      "optimize_for": "maximum_expected_improvement_with_acceptable_safety",
      "scoring_weights": {
        "efficacy": 0.45,
        "safety": 0.45,
        "downtime": 0.05,
        "recurrence_prevention": 0.05
      },
      "allowed_strategy_types": [
        "base_global_toning",
        "regional_override",
        "spot_only_override",
        "exclude_from_treatment",
        "defer_zone"
      ],
      "max_distinct_wavelength_strategies_per_session": 3,
      "rules": {
        "532": {
          "allowed_scopes": [
            "spot_only"
          ],
          "requires_doctor_visual_clearance": true,
          "never_use_as_routine_full_face_toning": true
        },
        "755": {
          "allowed_scopes": [
            "regional",
            "spot_only"
          ],
          "requires_doctor_visual_clearance": true,
          "never_use_as_routine_full_face_toning_in_high_pih_risk_pattern": true
        },
        "1064": {
          "allowed_scopes": [
            "whole_face",
            "regional",
            "spot_only"
          ],
          "typical_role": "conservative_background_or_deeper_pigment_strategy"
        }
      },
      "global_safety_constraints": {
        "reduce_if": [
          "high_background_erythema",
          "moderate_or_severe_current_sensitivity",
          "recent_procedure_darkening",
          "recent_sunburn_or_high_sun_exposure",
          "periocular_zone",
          "perioral_zone",
          "fitzpatrick_IV_to_VI"
        ],
        "defer_if": [
          "medically_atypical_lesion_in_target_zone",
          "active_infection",
          "active_burning",
          "melasma_or_pih_with_inflammation_first_required",
          "open_skin"
        ]
      }
    }
  },
  "microneedling": {
    "expose_full_microneedling_config_to_component_selector": false,
    "provide_full_config_only_after_microneedling_selected": true,
    "device": {
      "available": true,
      "device": "Dr. Pen",
      "performed_by": "doctor",
      "max_depth_mm": 2,
      "cartridge_type": "disposable",
      "default_route_for_actives": "topical_transdermal_after_microneedling",
      "injectable_route_allowed": false,
      "downtime_hours": {
        "min": 72,
        "max": 96
      }
    },
    "protocols": {
      "MN_MELASMA_EPIDERMAL": {
        "available": true,
        "configured_for_execution": true,
        "diagnosis_keys": [
          "melasma:epidermal"
        ],
        "frequency_days": 30,
        "depth_by_region_mm": {
          "forehead": 1,
          "right_malar": 1.5,
          "left_malar": 1.5,
          "upper_lip_perioral": 1,
          "chin_jaw": 1,
          "periocular": 0.5
        },
        "allowed_active_ids": [
          "MESO_TXA5_HA2",
          "MESO_TXA5_VITC20_GSH2_HA2",
          "MESO_VITC20_GSH2_HA2",
          "WONDERM",
          "ADVANCEXO_SKIN_REJUVE"
        ],
        "defer_if": [
          "unstable_spreading_melasma",
          "high_background_erythema",
          "active_burning",
          "active_infection",
          "barrier_compromised"
        ],
        "protocol_id": "MN_MELASMA_EPIDERMAL",
        "modality_id": "microneedling_with_active"
      },
      "MN_MELASMA_MIXED": {
        "available": true,
        "configured_for_execution": true,
        "diagnosis_keys": [
          "melasma:mixed"
        ],
        "frequency_days": 30,
        "depth_by_region_mm": {
          "forehead": 1,
          "right_malar": 1.5,
          "left_malar": 1.5,
          "upper_lip_perioral": 1,
          "chin_jaw": 1,
          "periocular": 0.5
        },
        "allowed_active_ids": [
          "MESO_TXA5_HA2",
          "MESO_TXA5_VITC20_GSH2_HA2",
          "MESO_VITC20_GSH2_HA2",
          "WONDERM",
          "ADVANCEXO_SKIN_REJUVE"
        ],
        "defer_if": [
          "unstable_spreading_melasma",
          "high_background_erythema",
          "active_burning",
          "active_infection",
          "barrier_compromised"
        ],
        "protocol_id": "MN_MELASMA_MIXED",
        "modality_id": "microneedling_with_active"
      },
      "MN_MELASMA_DERMAL": {
        "available": true,
        "configured_for_execution": true,
        "diagnosis_keys": [
          "melasma:dermal"
        ],
        "frequency_days": 30,
        "depth_by_region_mm": {
          "forehead": 1,
          "right_malar": 1.5,
          "left_malar": 1.5,
          "upper_lip_perioral": 1,
          "chin_jaw": 1,
          "periocular": 0.5
        },
        "allowed_active_ids": [
          "MESO_TXA5_HA2",
          "MESO_TXA5_VITC20_GSH2_HA2",
          "WONDERM",
          "ADVANCEXO_SKIN_REJUVE"
        ],
        "defer_if": [
          "unstable_spreading_melasma",
          "high_background_erythema",
          "active_burning",
          "active_infection",
          "barrier_compromised"
        ],
        "protocol_id": "MN_MELASMA_DERMAL",
        "modality_id": "microneedling_with_active"
      },
      "MN_SETTLED_PIH_WITH_TEXTURE": {
        "available": true,
        "configured_for_execution": true,
        "diagnosis_keys": [
          "post_inflammatory_hyperpigmentation:settled"
        ],
        "eligibility_requires": [
          "active_inflammation_controlled",
          "meaningful_texture_or_scar_component"
        ],
        "depth_by_region_mm": {
          "forehead": 1,
          "right_malar": {
            "min": 1.5,
            "max": 2
          },
          "left_malar": {
            "min": 1.5,
            "max": 2
          },
          "upper_lip_perioral": 1,
          "chin_jaw": 1.5,
          "periocular": 0.5
        },
        "frequency_days": 30,
        "allowed_active_ids": [
          "MESO_TXA5_HA2",
          "MESO_TXA5_VITC20_GSH2_HA2",
          "WONDERM",
          "ADVANCEXO_SKIN_REJUVE"
        ],
        "defer_if": [
          "frequent_active_acne",
          "active_dermatitis",
          "high_background_erythema",
          "active_infection"
        ],
        "protocol_id": "MN_SETTLED_PIH_WITH_TEXTURE",
        "modality_id": "microneedling_with_active"
      },
      "MN_PERIORAL_PIGMENT": {
        "available": true,
        "configured_for_execution": true,
        "diagnosis_keys": [
          "perioral_hyperpigmentation:melanin_dominant",
          "perioral_hyperpigmentation:friction_or_hair_removal_related"
        ],
        "depth_by_region_mm": {
          "upper_lip_perioral": 1
        },
        "frequency_days": 30,
        "allowed_active_ids": [
          "MESO_TXA5_HA2",
          "MESO_VITC20_GSH2_HA2",
          "WONDERM",
          "ADVANCEXO_SKIN_REJUVE"
        ],
        "defer_if": [
          "active_burning",
          "severe_sensitivity",
          "recent_waxing_threading_or_bleach_reaction",
          "active_irritant_or_contact_pattern"
        ],
        "protocol_id": "MN_PERIORAL_PIGMENT",
        "modality_id": "microneedling_with_active"
      },
      "MN_PERIOCULAR_MELANIN_OR_TEXTURE": {
        "available": true,
        "configured_for_execution": true,
        "diagnosis_keys": [
          "periocular_hyperpigmentation:melanin_dominant",
          "periocular_hyperpigmentation:mixed"
        ],
        "depth_by_region_mm": {
          "periocular": 0.5
        },
        "frequency_days": 30,
        "allowed_active_ids": [
          "WONDERM",
          "ADVANCEXO_SKIN_REJUVE",
          "MESO_HA2"
        ],
        "defer_if": [
          "active_eye_rubbing_or_allergy",
          "eczema_or_dermatitis",
          "structural_shadow_dominant",
          "vascular_dominant",
          "active_infection"
        ],
        "protocol_id": "MN_PERIOCULAR_MELANIN_OR_TEXTURE",
        "modality_id": "microneedling_with_active"
      },
      "MN_SCAR_TEXTURE_MODIFIER": {
        "available": true,
        "configured_for_execution": true,
        "diagnosis_keys": [
          "scar_or_friction_modifier:any"
        ],
        "depth_by_region_mm": {
          "doctor_select_up_to_mm": 2
        },
        "frequency_days": 30,
        "allowed_active_ids": [
          "WONDERM",
          "ADVANCEXO_SKIN_REJUVE",
          "MESO_HA2"
        ],
        "note": "Scar or structural shadow response must be tracked separately from background pigment response.",
        "protocol_id": "MN_SCAR_TEXTURE_MODIFIER",
        "modality_id": "microneedling_with_active"
      },
      "MN_MULTIFOCAL_MIXED_PIGMENT": {
        "available": true,
        "configured_for_execution": true,
        "modality_id": "microneedling_with_active",
        "diagnosis_keys": [
          "photo_induced_pigmentation:mixed_photo_induced",
          "photo_induced_pigmentation:tanning_or_facial_photomelanosis",
          "unclassified_pigmentation:any"
        ],
        "phenotype_eligibility_requires": [
          "flat_or_regional_pigment_is_multifocal_or_field_like_not_only_a_few_isolated_lentigines",
          "mixed_depth_or_texture_or_regenerative_advantage_is_clinically_meaningful",
          "raised_pigmented_lesions_are_mapped_separately_and_excluded_from_needling",
          "active_inflammation_is_controlled",
          "barrier_is_stable",
          "doctor_selects_microneedling_after_comparing_laser_and_peel"
        ],
        "depth_by_region_mm": {
          "forehead": 1,
          "right_malar": 1.5,
          "left_malar": 1.5,
          "upper_lip_perioral": 1,
          "chin_jaw": 1,
          "periocular": 0.5
        },
        "frequency_days": 30,
        "allowed_active_ids": [
          "MESO_TXA5_HA2",
          "MESO_TXA5_VITC20_GSH2_HA2",
          "MESO_VITC20_GSH2_HA2",
          "WONDERM",
          "ADVANCEXO_SKIN_REJUVE"
        ],
        "defer_if": [
          "active_dermatitis_or_irritation",
          "high_background_erythema",
          "active_burning",
          "active_infection",
          "barrier_compromised",
          "recent_significant_sun_exposure_or_tan"
        ],
        "note": "This is a phenotype-eligible option, not an automatic first-line choice. Clinical policy must compare expected improvement, lesion morphology, depth, PIH risk and prior response.",
        "protocol_id": "MN_MULTIFOCAL_MIXED_PIGMENT"
      }
    }
  },
  "microneedling_actives": {
    "selection_architecture": "phenotype_first_then_severity_recurrence_and_previous_response",
    "microneedling_without_purposeful_active_is_not_preferred_for_pigmentation": true,
    "all_routes_are_topical_or_transdermal_only": true,
    "injectable_allowed": false,
    "formulas_and_products": {
      "MESO_TXA5_HA2": {
        "type": "clinic_compounded_meso",
        "display_name": "TXA 5% + HA 2%",
        "configured_for_execution": true,
        "route": "topical_transdermal_after_microneedling",
        "injectable": false,
        "ingredients": [
          {
            "name": "tranexamic_acid",
            "final_concentration_percent": 5
          },
          {
            "name": "hyaluronic_acid",
            "final_concentration_percent": 2
          }
        ],
        "phenotype_roles": [
          "pigment_directed"
        ],
        "response_tiers": [
          "easier",
          "moderate"
        ],
        "doctor_signoff_required": true,
        "requires_clinic_compounding_sop_confirmation": true,
        "protocol_id": "MESO_TXA5_HA2",
        "registry_role": "microneedling_active"
      },
      "MESO_TXA5_VITC20_GSH2_HA2": {
        "type": "clinic_compounded_meso",
        "display_name": "TXA 5% + Vitamin C 20% + Glutathione 2% + HA 2%",
        "configured_for_execution": true,
        "route": "topical_transdermal_after_microneedling",
        "injectable": false,
        "ingredients": [
          {
            "name": "tranexamic_acid",
            "final_concentration_percent": 5
          },
          {
            "name": "vitamin_c",
            "final_concentration_percent": 20
          },
          {
            "name": "glutathione",
            "final_concentration_percent": 2
          },
          {
            "name": "hyaluronic_acid",
            "final_concentration_percent": 2
          }
        ],
        "phenotype_roles": [
          "pigment_directed",
          "antioxidant_support"
        ],
        "response_tiers": [
          "severe_or_refractory"
        ],
        "doctor_signoff_required": true,
        "requires_clinic_compounding_sop_confirmation": true,
        "protocol_id": "MESO_TXA5_VITC20_GSH2_HA2",
        "registry_role": "microneedling_active"
      },
      "MESO_VITC20_GSH2_HA2": {
        "type": "clinic_compounded_meso",
        "display_name": "Vitamin C 20% + Glutathione 2% + HA 2%",
        "configured_for_execution": true,
        "route": "topical_transdermal_after_microneedling",
        "injectable": false,
        "ingredients": [
          {
            "name": "vitamin_c",
            "final_concentration_percent": 20
          },
          {
            "name": "glutathione",
            "final_concentration_percent": 2
          },
          {
            "name": "hyaluronic_acid",
            "final_concentration_percent": 2
          }
        ],
        "phenotype_roles": [
          "antioxidant_brightening_support"
        ],
        "response_tiers": [
          "txa_not_selected_or_not_suitable"
        ],
        "doctor_signoff_required": true,
        "requires_clinic_compounding_sop_confirmation": true,
        "protocol_id": "MESO_VITC20_GSH2_HA2",
        "registry_role": "microneedling_active"
      },
      "MESO_HA2": {
        "type": "clinic_compounded_meso",
        "display_name": "HA 2%",
        "configured_for_execution": true,
        "route": "topical_transdermal_after_microneedling",
        "injectable": false,
        "ingredients": [
          {
            "name": "hyaluronic_acid",
            "final_concentration_percent": 2
          }
        ],
        "phenotype_roles": [
          "repair_hydration"
        ],
        "response_tiers": [
          "supportive_only"
        ],
        "primary_pigment_directed_active": false,
        "doctor_signoff_required": true,
        "requires_clinic_compounding_sop_confirmation": true,
        "protocol_id": "MESO_HA2",
        "registry_role": "microneedling_active"
      },
      "WONDERM": {
        "type": "commercial_pdrn_ha_product",
        "display_name": "Wonderm",
        "manufacturer": "Twine Medicals",
        "configured_for_execution": true,
        "route": "topical_transdermal_after_microneedling",
        "external_use_only": true,
        "injectable": false,
        "roles": [
          "repair_support",
          "hydration",
          "texture_photoageing_support",
          "skin_quality"
        ],
        "primary_pigment_directed_active": false,
        "label_ingredients": [
          "Aqua",
          "Arginine",
          "Panthenol",
          "Sodium Hyaluronate",
          "Phenoxyethanol",
          "Ethylhexylglycerin",
          "Trehalose",
          "Succinic Acid",
          "Thiamine",
          "Pyridoxine",
          "Sodium DNA",
          "Sodium Hydroxide",
          "Niacinamide"
        ],
        "pregnancy_or_breastfeeding_block_from_label": true,
        "batch_and_expiry_record_required": true,
        "protocol_id": "WONDERM",
        "registry_role": "microneedling_active"
      },
      "ADVANCEXO_SKIN_REJUVE": {
        "type": "commercial_exosome_product",
        "display_name": "Advancexo Skin Rejuve Complex",
        "manufacturer": "Advancells / Saffron Naturele Products",
        "configured_for_execution": true,
        "route": "topical_transdermal_after_microneedling",
        "topical_use_only": true,
        "injectable": false,
        "roles": [
          "advanced_regenerative_support",
          "texture_photoageing_support",
          "post_procedure_recovery_support"
        ],
        "label_ingredients": [
          "Aqua",
          "Trehalose",
          "Mannitol",
          "Dried Exosome Powder",
          "Retinol",
          "Sodium Bicarbonate",
          "Nicotinamide Adenine Dinucleotide",
          "Glycine",
          "Alanine",
          "Arginine",
          "Histidine",
          "Leucine",
          "Phenylalanine",
          "Serine",
          "Threonine",
          "Valine",
          "Coenzyme A"
        ],
        "retinol_related_restriction": "none_per_dr_aakriti_clinic_policy",
        "ignore_label_retinol_for_selection_and_same_day_safety_gating": true,
        "same_day_after_microneedling_allowed_when_otherwise_eligible": true,
        "not_default_for_active_inflammation_or_impaired_barrier": true,
        "do_not_select_only_because_melanin_severity_is_high": true,
        "batch_and_expiry_record_required": true,
        "protocol_id": "ADVANCEXO_SKIN_REJUVE",
        "registry_role": "microneedling_active"
      }
    },
    "compounding_safety_contract": {
      "model_may_select_only_listed_formula_id": true,
      "model_must_not_change_concentrations": true,
      "model_must_not_generate_mixing_order_or_compounding_method": true,
      "clinic_sop_must_define": [
        "source_ampoules",
        "aseptic_preparation",
        "total_volume",
        "order_of_mixing",
        "pH_and_compatibility_check",
        "single_use_handling",
        "beyond_use_time",
        "disposal"
      ]
    }
  },
  "peels": {
    "expose_full_peel_config_to_component_selector": false,
    "provide_only_eligible_peel_protocols_after_chemical_peel_selected": true,
    "protocols": {
      "PEEL_BIOREPEELCL3": {
        "available": true,
        "configured_for_execution": true,
        "display_name": "BioRePeelCl3",
        "category": "biphasic_low_downtime_tca_peel",
        "main_active": "TCA",
        "strength_description": "BioRePeelCl3 FND commonly described as 35% TCA",
        "treatment_scope": "whole_face_or_regional",
        "contact_time_minutes": {
          "min": 3,
          "max": 5
        },
        "neutralization_required": false,
        "removal_method": "wipe_clean_with_water_soaked_gauze",
        "endpoint": "mild_controlled_erythema_or_tolerable_stinging_no_frosting_target",
        "repeat_interval_days": {
          "min": 7,
          "max": 30
        },
        "preferred_interval_days_for_pigmentation": 30,
        "diagnosis_keys": [
          "melasma:epidermal",
          "melasma:mixed",
          "photo_induced_pigmentation:tanning_or_facial_photomelanosis",
          "post_inflammatory_hyperpigmentation:settled"
        ],
        "defer_if": [
          "active_burning",
          "severe_sensitivity",
          "high_background_erythema",
          "recent_procedure_reaction",
          "active_infection",
          "barrier_compromised",
          "medically_atypical_lesion_in_target_zone"
        ],
        "performed_by": "therapist_after_doctor_approval",
        "doctor_approval_required": true,
        "protocol_id": "PEEL_BIOREPEELCL3",
        "modality_id": "chemical_peel"
      },
      "PEEL_MANDELIC": {
        "available": true,
        "configured_for_execution": true,
        "display_name": "Mandelic Peel",
        "category": "superficial_alpha_hydroxy_acid_peel",
        "main_active": "mandelic_acid",
        "strength_percent": {
          "min": 30,
          "max": 45
        },
        "treatment_scope": "whole_face_or_regional",
        "contact_time_minutes": {
          "min": 5,
          "max": 10
        },
        "neutralization_required": true,
        "neutralization_method": "clinic_neutralizer_or_product_specific_water_rinse",
        "endpoint": "mild_erythema_or_tolerable_stinging_no_frosting",
        "repeat_interval_days": {
          "min": 14,
          "max": 28
        },
        "preferred_interval_days_for_pigmentation": 21,
        "diagnosis_keys": [
          "melasma:epidermal",
          "melasma:mixed",
          "post_inflammatory_hyperpigmentation:settled",
          "perioral_hyperpigmentation:melanin_dominant",
          "perioral_hyperpigmentation:friction_or_hair_removal_related"
        ],
        "efficacy_note": "Do not select merely because it is gentle when a stronger eligible peel is expected to be materially more effective.",
        "defer_if": [
          "active_burning",
          "severe_sensitivity",
          "recent_procedure_reaction",
          "open_skin",
          "medically_atypical_lesion_in_target_zone"
        ],
        "performed_by": "therapist_after_doctor_approval",
        "doctor_approval_required": true,
        "protocol_id": "PEEL_MANDELIC",
        "modality_id": "chemical_peel"
      },
      "PEEL_SALICYLIC": {
        "available": true,
        "configured_for_execution": true,
        "display_name": "Salicylic Peel",
        "category": "superficial_beta_hydroxy_acid_peel",
        "main_active": "salicylic_acid",
        "strength_percent": {
          "min": 20,
          "max": 30
        },
        "treatment_scope": "whole_face_or_regional",
        "contact_time_minutes": {
          "min": 3,
          "max": 5
        },
        "neutralization_required": false,
        "removal_method": "wash_or_rinse_after_pseudofrost_crystallization_and_burning_subsides",
        "endpoint": "even_pseudofrost_or_crystallization_with_tolerable_stinging",
        "repeat_interval_days": {
          "min": 14,
          "max": 28
        },
        "preferred_interval_days_for_pigmentation": 21,
        "diagnosis_keys": [
          "active_inflammatory_process:acne",
          "post_inflammatory_hyperpigmentation:post_acne",
          "post_inflammatory_hyperpigmentation:settled"
        ],
        "eligible_only_if": [
          "acne_or_oil_driver_present",
          "barrier_stable"
        ],
        "defer_if": [
          "dry_sensitive_barrier",
          "high_background_erythema",
          "active_burning",
          "recent_irritant_reaction",
          "aspirin_sensitivity_if_relevant",
          "pregnancy_if_clinic_policy_avoids_salicylic_peel"
        ],
        "performed_by": "therapist_after_doctor_approval",
        "doctor_approval_required": true,
        "protocol_id": "PEEL_SALICYLIC",
        "modality_id": "chemical_peel"
      },
      "PEEL_GLYCOLIC": {
        "available": true,
        "configured_for_execution": true,
        "display_name": "Glycolic Peel",
        "category": "superficial_alpha_hydroxy_acid_peel",
        "main_active": "glycolic_acid",
        "strength_percent": {
          "min": 20,
          "max": 70
        },
        "preferred_start_strength_percent_for_indian_pigmentation": {
          "min": 20,
          "max": 35
        },
        "treatment_scope": "whole_face_or_regional",
        "contact_time_minutes": {
          "min": 2,
          "max": 5
        },
        "preferred_initial_contact_time_minutes": 3,
        "neutralization_required": true,
        "neutralization_method": "10_to_15_percent_sodium_bicarbonate_or_clinic_neutralizer_then_water_rinse",
        "endpoint": "mild_uniform_erythema_without_epidermolysis",
        "repeat_interval_days": {
          "min": 14,
          "max": 30
        },
        "preferred_interval_days_for_pigmentation": 21,
        "diagnosis_keys": [
          "melasma:epidermal",
          "melasma:mixed",
          "photo_induced_pigmentation:tanning_or_facial_photomelanosis",
          "photo_induced_pigmentation:solar_lentigines",
          "photo_induced_pigmentation:ephelides",
          "post_inflammatory_hyperpigmentation:settled"
        ],
        "defer_if": [
          "sensitive_skin",
          "high_background_erythema",
          "active_burning",
          "recent_procedure_reaction",
          "barrier_compromised",
          "poor_sunscreen_compliance"
        ],
        "performed_by": "therapist_after_doctor_approval",
        "doctor_approval_required": true,
        "protocol_id": "PEEL_GLYCOLIC",
        "modality_id": "chemical_peel"
      },
      "PEEL_YELLOW": {
        "available": true,
        "configured_for_execution": true,
        "display_name": "Yellow Peel",
        "category": "retinoid_depigmenting_leave_on_peel",
        "main_active": "retinoid_based_depigmenting_complex",
        "treatment_scope": "whole_face_or_regional",
        "contact_time_minutes": null,
        "leave_on_time_hours": {
          "min": 4,
          "max": 6
        },
        "neutralization_required": false,
        "removal_method": "wash_off_after_leave_on_period_as_directed",
        "endpoint": "even_application_without_excess_burning_during_observation",
        "repeat_interval_days": {
          "min": 30,
          "max": 45
        },
        "preferred_interval_days_for_pigmentation": 30,
        "diagnosis_keys": [
          "melasma:epidermal",
          "melasma:mixed",
          "photo_induced_pigmentation:tanning_or_facial_photomelanosis"
        ],
        "same_day_q_switch_allowed": false,
        "defer_if": [
          "pregnancy",
          "breastfeeding",
          "active_burning",
          "severe_sensitivity",
          "recent_retinoid_overuse",
          "barrier_compromised",
          "poor_sunscreen_compliance",
          "high_background_erythema"
        ],
        "performed_by": "therapist_after_doctor_approval",
        "doctor_approval_required": true,
        "protocol_id": "PEEL_YELLOW",
        "modality_id": "chemical_peel"
      },
      "PEEL_LACTIC": {
        "available": true,
        "configured_for_execution": true,
        "display_name": "Lactic Peel",
        "category": "gentle_alpha_hydroxy_acid_peel",
        "main_active": "lactic_acid",
        "strength_percent": {
          "min": 30,
          "max": 50
        },
        "preferred_strength_percent_for_sensitive_or_indian_skin": {
          "min": 30,
          "max": 40
        },
        "treatment_scope": "whole_face_or_regional",
        "contact_time_minutes": {
          "min": 3,
          "max": 7
        },
        "preferred_initial_contact_time_minutes": 3,
        "neutralization_required": true,
        "neutralization_method": "clinic_neutralizer_or_product_specific_water_rinse",
        "endpoint": "mild_erythema_or_tolerable_stinging_without_frosting",
        "repeat_interval_days": {
          "min": 14,
          "max": 28
        },
        "preferred_interval_days_for_pigmentation": 21,
        "diagnosis_keys": [
          "photo_induced_pigmentation:tanning_or_facial_photomelanosis",
          "perioral_hyperpigmentation:melanin_dominant",
          "perioral_hyperpigmentation:friction_or_hair_removal_related"
        ],
        "primary_role": "supportive_gentle_brightening_or_barrier_conscious_peel",
        "defer_if": [
          "active_burning",
          "severe_sensitivity",
          "open_skin",
          "recent_procedure_reaction"
        ],
        "performed_by": "therapist_after_doctor_approval",
        "doctor_approval_required": true,
        "protocol_id": "PEEL_LACTIC",
        "modality_id": "chemical_peel"
      },
      "PEEL_DEEP_TCA": {
        "available": true,
        "configured_for_execution": false,
        "selectable_by_ai": false,
        "display_name": "Deep TCA Peel",
        "category": "deep_tca_doctor_only",
        "treatment_scope": "doctor_selected_regional_or_focal",
        "doctor_only": true,
        "contact_time_minutes": null,
        "strength_percent": null,
        "neutralization_required": null,
        "neutralization_method": null,
        "endpoint": null,
        "repeat_interval_days": null,
        "block_reason": "Deep TCA is in clinic inventory, but exact product, strength, application method, endpoint, neutralization/removal, zone restrictions, and interval have not been supplied. The AI must not invent them.",
        "required_fields_before_selectable": [
          "exact_product_name",
          "strength_percent",
          "eligible_diagnoses_and_zones",
          "application_method",
          "contact_or_endpoint_rule",
          "neutralization_or_removal_rule",
          "repeat_interval",
          "precare_and_aftercare",
          "hard_contraindications"
        ],
        "protocol_id": "PEEL_DEEP_TCA",
        "modality_id": "chemical_peel"
      }
    },
    "same_day_compatibility": {
      "peel_plus_led": "compatible",
      "peel_plus_hydrafacial": "doctor_selected_gentle_non_exfoliative_only",
      "peel_plus_q_switch": "conditional_protocol_specific",
      "peel_plus_microneedling": "not_compatible_same_day",
      "peel_plus_lesion_ablation": "prefer_separate_session",
      "deep_tca_plus_any_other_injury_modality": "not_compatible_same_day"
    },
    "deliberately_removed_or_not_selectable": {
      "BLACK_PEEL": {
        "available": false,
        "reason": "Removed from the approved Pigmentation Decode inventory; do not migrate the V1 black_peel protocol."
      }
    },
    "declared_inventory_pending_exact_protocol": {
      "note": "Add these only if they remain in active clinic inventory and their exact product protocols are supplied. They are not selectable in this file.",
      "products": [
        "Cosmelan",
        "Party Peel",
        "Whitening Peel",
        "Sali DS",
        "Pumpkin Gel Peel",
        "Fusion Peel-E",
        "Salicylic + Mandelic Combination",
        "Salmon Peel"
      ]
    }
  },
  "lesion_directed_procedures": {
    "LESION_SK_DPN_ELECTROCAUTERY_OR_RF": {
      "available": true,
      "configured_for_execution": true,
      "display_name": "SK/DPN lesion-directed electrocautery or RF",
      "eligible_diagnosis_keys": [
        "benign_raised_pigmented_lesion:seborrhoeic_keratosis_like",
        "benign_raised_pigmented_lesion:dermatosis_papulosa_nigra_like"
      ],
      "performed_by": "doctor",
      "doctor_visual_confirmation_required": true,
      "treatment_scope": "focal_lesion",
      "settings_output_rule": "AI must not invent numeric power. Doctor selects device and power using lesion size, elevation, site, and endpoint.",
      "endpoint": "controlled_lesion_desiccation_or_ablation_without_unnecessary_surrounding_tissue_injury",
      "local_anaesthesia": "doctor_select",
      "post_procedure_steps": [
        "cooling_if_needed",
        "doctor_selected_wound_care",
        "strict_photoprotection",
        "do_not_pick_or_manipulate"
      ],
      "never_include_in_background_toning": true,
      "same_day_with_other_injury_modality": "prefer_separate_session",
      "protocol_id": "LESION_SK_DPN_ELECTROCAUTERY_OR_RF",
      "modality_id": "electrocautery_or_rf"
    },
    "MEDICALLY_ATYPICAL_LESION_HOLD": {
      "available": true,
      "configured_for_execution": true,
      "procedure": "no_cosmetic_procedure",
      "all_cosmetic_treatment_blocked": true,
      "required_action": "doctor_assessment",
      "protocol_id": "MEDICALLY_ATYPICAL_LESION_HOLD",
      "modality_id": "doctor_assessment"
    }
  },
  "supportive_devices": {
    "LED_RED_CALMING": {
      "available": true,
      "display_name": "Red LED",
      "category": "supportive_recovery_device",
      "injury_producing": false,
      "performed_by": "therapist_after_doctor_approval",
      "duration_minutes": {
        "min": 10,
        "max": 20
      },
      "roles": [
        "post_q_switch_calming",
        "post_peel_calming",
        "post_microneedling_recovery",
        "barrier_and_erythema_support"
      ],
      "protocol_id": "LED_RED_CALMING",
      "modality_id": "led",
      "configured_for_execution": true
    },
    "LED_BLUE_ACNE_SUPPORT": {
      "available": true,
      "display_name": "Blue LED",
      "category": "supportive_acne_device",
      "injury_producing": false,
      "performed_by": "therapist_after_doctor_approval",
      "duration_minutes": {
        "min": 10,
        "max": 20
      },
      "roles": [
        "active_acne_support",
        "oily_acne_prone_support"
      ],
      "protocol_id": "LED_BLUE_ACNE_SUPPORT",
      "modality_id": "led",
      "configured_for_execution": true
    },
    "HYDRAFACIAL_SUPPORT": {
      "available": true,
      "display_name": "Hydrafacial / Hydrodermabrasion",
      "category": "supportive_cleansing_hydration_device",
      "injury_producing": false,
      "not_primary_melasma_treatment": true,
      "performed_by": "therapist_after_doctor_approval",
      "roles": [
        "dullness_support",
        "mild_tanning_support",
        "congestion_support",
        "maintenance",
        "barrier_friendly_preparation"
      ],
      "avoid_or_defer_if": [
        "active_burning",
        "severe_sensitivity",
        "recent_aggressive_peel_or_laser_reaction",
        "open_skin",
        "active_infection"
      ],
      "protocol_id": "HYDRAFACIAL_SUPPORT",
      "modality_id": "hydrafacial",
      "configured_for_execution": true
    }
  },
  "session_compatibility_matrix": {
    "maximum_injury_modality_types_per_session_from_policy": 2,
    "default_preference": "one_primary_injury_modality",
    "second_injury_modality_requires_material_regional_advantage": true,
    "supportive_modalities_not_counted_as_injury": [
      "led",
      "cooling",
      "hydrafacial_support_when_non_exfoliative",
      "routine_aftercare"
    ],
    "pairs": {
      "q_switch_laser+chemical_peel": "conditional_protocol_specific",
      "q_switch_laser+microneedling_with_active": "not_compatible_same_day",
      "q_switch_laser+electrocautery_or_rf": "prefer_separate_session",
      "chemical_peel+microneedling_with_active": "not_compatible_same_day",
      "chemical_peel+electrocautery_or_rf": "prefer_separate_session",
      "microneedling_with_active+electrocautery_or_rf": "prefer_separate_session",
      "any_injury_modality+led": "compatible_when_skin_response_allows",
      "any_injury_modality+cooling": "compatible"
    }
  },
  "homecare": {
    "broad_spectrum_sunscreen": {
      "role": "mandatory_photoprotection",
      "eligible_for": [
        "all_pigmentation_components"
      ]
    },
    "tinted_sunscreen": {
      "role": "visible_light_and_melasma_support",
      "eligible_for": [
        "melasma",
        "recurrent_pigmentation",
        "high_sun_exposure",
        "fitzpatrick_III_to_VI"
      ]
    },
    "azelaic_acid": {
      "role": "pih_acne_melasma_and_sensitive_skin_support",
      "classification": "topical",
      "doctor_signoff_if_prescription_strength": true,
      "avoid_or_reduce_if": [
        "active_burning",
        "severe_sensitivity"
      ]
    },
    "topical_tranexamic_acid": {
      "role": "melasma_and_recurrent_pigmentation_support",
      "classification": "topical"
    },
    "niacinamide": {
      "role": "barrier_oil_and_mild_pigment_support",
      "classification": "topical"
    },
    "vitamin_c": {
      "role": "antioxidant_brightening_support",
      "classification": "topical",
      "avoid_or_reduce_if": [
        "stinging_or_irritation"
      ]
    },
    "barrier_moisturizer": {
      "role": "barrier_repair_and_post_procedure_support",
      "classification": "topical"
    },
    "hydroquinone": {
      "role": "doctor_selected_strong_pigment_suppression",
      "classification": "prescription_or_doctor_signoff",
      "avoid_if": [
        "suspected_ochronosis",
        "unsupervised_long_term_hydroquinone_history",
        "pregnancy_or_breastfeeding"
      ]
    },
    "tretinoin": {
      "role": "doctor_selected_turnover_and_pigment_support",
      "classification": "prescription_or_doctor_signoff",
      "avoid_or_defer_if": [
        "pregnancy",
        "breastfeeding",
        "severe_sensitivity",
        "barrier_compromised"
      ]
    },
    "triple_combination": {
      "role": "doctor_selected_melasma_protocol",
      "classification": "prescription_or_doctor_signoff",
      "avoid_if": [
        "unsupervised_steroid_use_history",
        "suspected_ochronosis",
        "pregnancy_or_breastfeeding",
        "barrier_compromised"
      ]
    }
  },
  "authorization": {
    "all_final_plans_require_doctor_signoff": true,
    "doctor_constraints_are_authorization_not_efficacy_penalty": true,
    "performed_by": {
      "microneedling_with_active": "doctor",
      "q_switch_laser": "therapist_after_doctor_approval",
      "focal_laser": "therapist_after_doctor_approval",
      "chemical_peel": "therapist_after_doctor_approval",
      "deep_tca": "doctor",
      "electrocautery_or_rf": "doctor",
      "led": "therapist_after_doctor_approval",
      "hydrafacial": "therapist_after_doctor_approval",
      "prescription_homecare": "doctor_signoff_required"
    },
    "approval_status_values": [
      "ai_generated_pending_doctor_review",
      "doctor_approved",
      "doctor_modified",
      "deferred",
      "contraindicated"
    ]
  },
  "provider_protocol_contract": {
    "require_provider_protocol_for_every_current_block_session": true,
    "require_session_execution_sequence": true,
    "execution_step_types": [
      "cleanse",
      "numbing",
      "remove_numbing",
      "chemical_peel",
      "neutralize_peel",
      "q_switch",
      "focal_laser",
      "microneedling",
      "apply_active",
      "electrocautery_or_rf",
      "cooling",
      "led",
      "moisturizer",
      "sunscreen",
      "homecare_handover",
      "other"
    ],
    "selected_modality_to_required_steps": {
      "chemical_peel": [
        "chemical_peel"
      ],
      "q_switch_laser": [
        "q_switch"
      ],
      "focal_laser": [
        "focal_laser"
      ],
      "microneedling_with_active": [
        "microneedling",
        "apply_active"
      ],
      "electrocautery_or_rf": [
        "electrocautery_or_rf"
      ],
      "led": [
        "led"
      ],
      "cooling": [
        "cooling"
      ],
      "hydrafacial": [
        "other"
      ]
    },
    "conditional_required_steps": {
      "peel_requires_neutralization": [
        "neutralize_peel"
      ],
      "numbing_used": [
        "numbing",
        "remove_numbing"
      ],
      "sunscreen_required": [
        "sunscreen"
      ],
      "aftercare_required": [
        "homecare_handover"
      ]
    },
    "required_sections": [
      "pre_treatment_checklist",
      "session_execution_sequence",
      "zone_sequence",
      "avoid_zones",
      "homecare_handover",
      "session_adaptation_rules",
      "authorization"
    ],
    "standard_face_zone_order": [
      "forehead",
      "right_malar",
      "left_malar",
      "nose_bridge",
      "upper_lip_perioral",
      "chin_jaw",
      "periocular_if_doctor_selected"
    ],
    "treatment_operation_required_fields": [
      "operation_id",
      "modality_id",
      "protocol_id",
      "linked_component_ids",
      "linked_group_ids",
      "target_location_text",
      "exclude_group_ids",
      "exclusion_instruction",
      "role"
    ],
    "execution_steps_must_link_operation_id": true,
    "selected_modalities_and_injury_modalities_are_derived_not_model_authoritative": true
  },
  "hard_validation_contract": {
    "application_not_model_is_authoritative_validator": true,
    "backend_not_model_is_authoritative_validator": true,
    "backend_field_is_legacy_alias_only": true,
    "reject_or_regenerate_on_failure": false,
    "image_rules": {
      "exactly_one_image_per_required_mode": true,
      "every_clinically_relevant_visible_population_requires_group": true,
      "co_located_flat_and_raised_groups_must_be_separate": true,
      "every_group_requires_precise_location": true,
      "every_present_localized_burden_requires_linked_group": true,
      "every_raised_group_requires_raised_burden_link": true,
      "every_flat_group_requires_flat_burden_link": true,
      "model_generated_scores_are_discarded": true
    },
    "diagnosis_rules": {
      "enforce_specific_subtype_threshold_from_policy": true,
      "image_metrics_must_match_validated_image_record": true,
      "every_clinically_relevant_group_must_be_resolved": true,
      "location_text_must_be_copied_from_group": true,
      "causal_subtype_requires_linked_causal_history": true,
      "no_significant_diffuse_pigmentation_cannot_erase_focal_components": true,
      "mixed_photo_induced_must_split_background_and_focal_components": true,
      "diagnosis_visual_discrepancy_requires_phenotype_regeneration": true,
      "routine_confirmation_must_not_be_converted_to_medically_atypical_red_flag": true
    },
    "plan_rules": {
      "maximum_injury_modalities_must_match_policy": true,
      "injury_modalities_must_be_derived_from_operations": true,
      "every_operation_requires_valid_modality": true,
      "every_required_protocol_id_must_exist_and_match_modality": true,
      "every_operation_requires_execution_step": true,
      "every_execution_step_must_link_operation_id": true,
      "every_procedural_operation_requires_precise_target_location": true,
      "flat_and_raised_target_exclusions_are_mandatory_when_co_located": true,
      "q_switch_optimizer_requires_laser_selected_for_component": true,
      "selected_protocol_must_be_eligible_for_component_or_have_doctor_override": true,
      "mesotherapy_formula_id_must_exist": true,
      "mesotherapy_concentrations_must_match_config_exactly": true,
      "wonderm_and_advancexo_injectable_must_be_false": true,
      "all_microneedling_actives_injectable_must_be_false": true,
      "medically_atypical_components_cannot_receive_cosmetic_procedure": true,
      "peel_neutralization_step_required_when_config_requires_it": true,
      "microneedling_active_step_required": true,
      "returned_policy_version_must_match_supplied_policy_version": true,
      "returned_config_version_must_match_supplied_config_version": true
    }
  },
  "runtime_config_projection": {
    "use_two_stage_image_analysis": false,
    "stage_1_morphology_census": {
      "include": [
        "image_acquisition",
        "phenotype_pipeline_contract",
        "anatomical_location_contract",
        "v2_ontology"
      ],
      "exclude": [
        "treatment_inventory",
        "treatment_priority",
        "history"
      ]
    },
    "stage_2_phenotype_measurement": {
      "include": [
        "locked_morphology_groups",
        "scoring_runtime_contract",
        "artifact_exclusion_rules",
        "regional_background_contract"
      ],
      "groups_are_locked_except_explicit_discrepancy": true
    },
    "use_two_stage_planning_when_possible": false,
    "stage_1_component_selection": {
      "include": [
        "config_version",
        "ontology_version",
        "phenotype_modality_eligibility",
        "modality_inventory_summary",
        "protocol_map",
        "session_compatibility_matrix",
        "high_level_authorization",
        "treatment_targeting_contract"
      ],
      "exclude": [
        "full_q_switch_settings",
        "full_peel_protocols",
        "full_microneedling_protocols",
        "unrelated_products"
      ]
    },
    "stage_2_protocol_expansion": {
      "include_only_selected_protocols_and_nearest_eligible_alternatives": true,
      "include_supportive_devices_when_selected": true,
      "include_homecare_relevant_to_selected_components": true,
      "include_provider_protocol_contract": true,
      "include_hard_validation_contract": true
    },
    "plan_call_should_not_need_raw_images_after_validated_diagnosis": true
  },
  "legacy_migration": {
    "do_not_use_legacy_keys_for_new_runtime_selection": true,
    "aliases_for_migration_only": {
      "tanning_diffuse_pigmentation": "photo_induced_pigmentation:tanning_or_facial_photomelanosis",
      "melasma_like_pigmentation": "melasma:subtype_uncertain",
      "pih_acne_marks": "post_inflammatory_hyperpigmentation:post_acne",
      "mixed_facial_pigmentation": "unclassified_pigmentation:any",
      "upper_lip_perioral": "perioral_hyperpigmentation:cause_uncertain",
      "periocular": "periocular_hyperpigmentation:mixed",
      "advanceexo": "ADVANCEXO_SKIN_REJUVE",
      "wonderm": "WONDERM",
      "melasma_meso_solution": "MESO_TXA5_HA2"
    },
    "migration_note": "Stored V2.2 records may be displayed, but new analyses must use V2.4 morphology-location linkage and burden-specific scoring. Do not silently convert old scores into new profile scores.",
    "previous_config_versions": [
      "2.2.0"
    ],
    "previous_schema_versions": [
      "pigmentation_config_schema_v2_2"
    ],
    "legacy_generic_scoring_profile": "background_area_contrast"
  }
}

/**
 * Resolve a scoring profile by index ID or profile ID.
 */
export function getPigmentationScoringProfile(indexIdOrProfileId) {
  const profileId =
    PIGMENTATION_CONFIG.scoring_runtime_contract.index_profile_map[indexIdOrProfileId] ||
    indexIdOrProfileId

  const profile = PIGMENTATION_CONFIG.scoring_runtime_contract.profiles[profileId]
  if (!profile) {
    throw new Error(`Unknown pigmentation scoring profile or index: ${indexIdOrProfileId}`)
  }

  return { profile_id: profileId, ...profile }
}

/**
 * Deterministic authoritative scoring arithmetic.
 *
 * Backward compatibility: when no profile is supplied, the background area/contrast
 * profile is used, matching the previous V2.2 formula. New localized indices must pass
 * their index ID or profile ID explicitly.
 */
export function calculatePigmentationBurdenIndex(
  primitives,
  indexIdOrProfileId = 'background_area_contrast',
) {
  const profile = getPigmentationScoringProfile(indexIdOrProfileId)
  let raw = 0

  for (const key of profile.primitive_keys) {
    const value = primitives?.[key]
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      throw new Error(
        `Invalid scoring primitive ${key} for ${profile.profile_id}: expected 0-100.`,
      )
    }
    raw += profile.weights[key] * value
  }

  return Math.max(1, Math.min(100, Math.round(raw)))
}

export function pigmentationSeverityLabel(score) {
  if (!Number.isInteger(score) || score < 1 || score > 100) {
    throw new Error(`Invalid pigmentation score ${score}; expected integer 1-100.`)
  }
  if (score <= 15) return 'minimal'
  if (score <= 35) return 'mild'
  if (score <= 55) return 'moderate'
  if (score <= 75) return 'severe'
  return 'very_severe'
}

export function assertPigmentationPolicyCompatibility(policyVersion) {
  if (!PIGMENTATION_CONFIG.compatible_policy_versions.includes(policyVersion)) {
    throw new Error(
      `Incompatible pigmentation policy version: ${policyVersion}. Expected one of: ` +
        PIGMENTATION_CONFIG.compatible_policy_versions.join(', '),
    )
  }
  return true
}

function getByPath(object, dottedPath) {
  return dottedPath.split('.').reduce((value, key) => value?.[key], object)
}

export function getPigmentationProtocolRecord(protocolId) {
  const registryPaths = [
    'q_switch.protocols',
    'microneedling.protocols',
    'microneedling_actives.formulas_and_products',
    'peels.protocols',
    'lesion_directed_procedures',
    'supportive_devices',
  ]

  for (const registryPath of registryPaths) {
    const registry = getByPath(PIGMENTATION_CONFIG, registryPath)
    if (registry && Object.prototype.hasOwnProperty.call(registry, protocolId)) {
      return { protocol_id: protocolId, registry_path: registryPath, protocol: registry[protocolId] }
    }
  }
  return null
}

export function getPigmentationProtocolById(protocolId) {
  return getPigmentationProtocolRecord(protocolId)?.protocol || null
}

export function assertProtocolMatchesModality(protocolId, modalityId) {
  const record = getPigmentationProtocolRecord(protocolId)
  if (!record) throw new Error(`Unknown pigmentation protocol ID: ${protocolId}`)

  const actual = record.protocol.modality_id
  if (actual && actual !== modalityId) {
    throw new Error(
      `Protocol ${protocolId} belongs to modality ${actual}, not ${modalityId}.`,
    )
  }
  return true
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

export function buildPigmentationMorphologyConfig() {
  return {
    config_version: PIGMENTATION_CONFIG.version,
    schema_version: PIGMENTATION_CONFIG.schema_version,
    ontology_version: PIGMENTATION_CONFIG.ontology_version,
    image_acquisition: PIGMENTATION_CONFIG.image_acquisition,
    phenotype_pipeline_contract: PIGMENTATION_CONFIG.phenotype_pipeline_contract,
    anatomical_location_contract: PIGMENTATION_CONFIG.anatomical_location_contract,
    ontology: PIGMENTATION_CONFIG.v2_ontology,
  }
}

export function buildPigmentationMeasurementConfig() {
  return {
    config_version: PIGMENTATION_CONFIG.version,
    schema_version: PIGMENTATION_CONFIG.schema_version,
    scoring_runtime_contract: PIGMENTATION_CONFIG.scoring_runtime_contract,
    phenotype_pipeline_contract: PIGMENTATION_CONFIG.phenotype_pipeline_contract,
    anatomical_location_contract: PIGMENTATION_CONFIG.anatomical_location_contract,
  }
}

export function buildPigmentationComponentSelectionConfig() {
  return {
    config_version: PIGMENTATION_CONFIG.version,
    schema_version: PIGMENTATION_CONFIG.schema_version,
    ontology_version: PIGMENTATION_CONFIG.ontology_version,
    compatible_policy_versions: PIGMENTATION_CONFIG.compatible_policy_versions,
    phenotype_modality_eligibility: PIGMENTATION_CONFIG.phenotype_modality_eligibility,
    modality_inventory_summary: PIGMENTATION_CONFIG.modality_inventory_summary,
    modality_execution_registry: PIGMENTATION_CONFIG.modality_execution_registry,
    protocol_map: PIGMENTATION_CONFIG.protocol_map,
    session_compatibility_matrix: PIGMENTATION_CONFIG.session_compatibility_matrix,
    treatment_targeting_contract: PIGMENTATION_CONFIG.treatment_targeting_contract,
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
    const record = getPigmentationProtocolRecord(protocolId)
    if (!record) throw new Error(`Unknown pigmentation protocol ID: ${protocolId}`)
    if (record.protocol.configured_for_execution === false) {
      throw new Error(
        `Protocol ${protocolId} is not configured for execution: ` +
          (record.protocol.block_reason || 'missing required clinic configuration'),
      )
    }
    protocols[protocolId] = {
      registry_path: record.registry_path,
      ...record.protocol,
    }
  }

  return {
    config_version: PIGMENTATION_CONFIG.version,
    schema_version: PIGMENTATION_CONFIG.schema_version,
    protocols,
    modality_execution_registry: PIGMENTATION_CONFIG.modality_execution_registry,
    provider_protocol_contract: PIGMENTATION_CONFIG.provider_protocol_contract,
    treatment_targeting_contract: PIGMENTATION_CONFIG.treatment_targeting_contract,
    hard_validation_contract: PIGMENTATION_CONFIG.hard_validation_contract,
    authorization: PIGMENTATION_CONFIG.authorization,
  }
}

export function validatePigmentationConfig() {
  const errors = []
  const warnings = []

  if (!PIGMENTATION_CONFIG.compatible_policy_versions.length) {
    errors.push('At least one compatible policy version is required.')
  }

  for (const [profileId, profile] of Object.entries(
    PIGMENTATION_CONFIG.scoring_runtime_contract.profiles,
  )) {
    const weightKeys = Object.keys(profile.weights || {})
    const missing = profile.primitive_keys.filter((key) => !weightKeys.includes(key))
    if (missing.length) errors.push(`Scoring profile ${profileId} is missing weights: ${missing}`)

    const total = Object.values(profile.weights || {}).reduce((sum, value) => sum + value, 0)
    if (Math.abs(total - 1) > 1e-9) {
      errors.push(`Scoring profile ${profileId} weights sum to ${total}, expected 1.`)
    }
  }

  for (const [indexId, profileId] of Object.entries(
    PIGMENTATION_CONFIG.scoring_runtime_contract.index_profile_map,
  )) {
    if (!PIGMENTATION_CONFIG.scoring_runtime_contract.profiles[profileId]) {
      errors.push(`Index ${indexId} references unknown scoring profile ${profileId}.`)
    }
  }

  for (const [formulaId, formula] of Object.entries(
    PIGMENTATION_CONFIG.microneedling_actives.formulas_and_products,
  )) {
    if (formula.injectable !== false) errors.push(`${formulaId} must have injectable=false.`)
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
      ...(mapEntry.regional_multifocal_protocol_ids || []),
      ...(mapEntry.conditional_candidate_protocol_ids || []),
    ]
    for (const protocolId of referencedIds) {
      if (!getPigmentationProtocolById(protocolId)) {
        errors.push(`${mapKey} references unknown protocol ID ${protocolId}.`)
      }
    }
  }

  for (const [modalityId, modality] of Object.entries(
    PIGMENTATION_CONFIG.modality_execution_registry,
  )) {
    if (modality.protocol_registry_path && !getByPath(PIGMENTATION_CONFIG, modality.protocol_registry_path)) {
      errors.push(`Modality ${modalityId} has invalid registry path ${modality.protocol_registry_path}.`)
    }
  }

  if (PIGMENTATION_CONFIG.anatomical_location_contract.canonical_regions.length < 10) {
    warnings.push('Anatomical region vocabulary may be too limited for precise targeting.')
  }

  return { passed: errors.length === 0, errors, warnings }
}

export default PIGMENTATION_CONFIG
