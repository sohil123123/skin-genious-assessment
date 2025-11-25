import { encode } from '@toon-format/toon'

const skin_type_criteria = {
  skin_type_classification: {
    metadata: {
      device: 'Bitmoji A5 Analyzer',
      lighting_modes_used: ['white', 'UV', 'PPL'],
      regions_analyzed: ['forehead', 'nose', 'chin', 'cheeks'],
    },
    threshold_definitions: {
      shine_reflectance_ratio: {
        low: '<0.3',
        moderate: '0.4-0.6',
        high: '≥0.7',
      },
      porphyrin_fluorescence_intensity: {
        none: '<20',
        mild: '20-50',
        strong: '≥50',
      },
      pore_diameter_ratio: {
        small: '<1.2× baseline texture',
        moderate: '1.2-1.5× baseline texture',
        enlarged: '>1.5× baseline texture',
      },
    },
    confidence_weights: {
      white_light: 0.45,
      uv_light: 0.35,
      ppl_light: 0.2,
    },
    skin_types: [
      {
        type: 'Oily Skin',
        criteria: {
          white_light: {
            shine_reflectance_ratio: 'high',
            shine_distribution: 'diffuse_across_face',
          },
          uv_light: {
            porphyrin_fluorescence_intensity: 'strong',
            fluorescence_distribution: 'generalized',
          },
          ppl_light: {
            pore_diameter_ratio: 'enlarged',
            texture_uniformity: 'coarse',
          },
        },
        diagnostic_logic: [
          'if (white.shine_reflectance_ratio >= 0.7) and (uv.porphyrin_fluorescence >= 50) and (ppl.pore_diameter_ratio > 1.5) → Oily',
        ],
      },
      {
        type: 'Dry Skin',
        criteria: {
          white_light: {
            shine_reflectance_ratio: 'low',
            texture_uniformity: 'rough',
          },
          uv_light: {
            porphyrin_fluorescence_intensity: 'none',
          },
          ppl_light: {
            micro_line_density: 'high',
            pore_diameter_ratio: 'small',
          },
        },
        diagnostic_logic: [
          'if (white.shine_reflectance_ratio < 0.3) and (uv.porphyrin_fluorescence < 20) and (ppl.micro_line_density > threshold_lines) → Dry',
        ],
      },
      {
        type: 'Combination Skin',
        criteria: {
          white_light: {
            shine_distribution: 'localized_T_zone',
            cheek_reflectance: 'low_to_moderate',
          },
          uv_light: {
            porphyrin_fluorescence_pattern: 'T_zone_only',
          },
          ppl_light: {
            pore_diameter_ratio_T_zone: 'moderate_or_enlarged',
            pore_diameter_ratio_cheeks: 'small',
          },
        },
        diagnostic_logic: [
          'if (white.shine_T_zone - white.shine_cheeks >= 0.3) and (uv.fluorescence_T_zone >= 40) and (uv.fluorescence_cheeks < 25) → Combination',
        ],
      },
      {
        type: 'Normal/Balanced Skin',
        criteria: {
          white_light: {
            shine_reflectance_ratio: 'moderate',
            shine_distribution: 'uniform',
          },
          uv_light: {
            porphyrin_fluorescence_intensity: 'mild',
            distribution: 'even',
          },
          ppl_light: {
            texture_uniformity: 'smooth',
            pore_diameter_ratio: 'small_to_moderate',
          },
        },
        diagnostic_logic: [
          'if (0.4 <= white.shine_reflectance_ratio <= 0.6) and (uv.porphyrin_fluorescence between 20 and 50) and (ppl.texture_uniformity_score >= 0.8) → Normal',
        ],
      },
    ],
    decision_logic: {
      description:
        'After computing confidence scores for all skin types, output only the one with the highest score.',
      steps: [
        '1. Calculate weighted confidence for each skin type using mode-specific weights.',
        '2. Compare all confidence values.',
        '3. Select the skin type with the highest confidence score (max_confidence_type).',
        "4. If two types differ by <0.05, classify as the higher one but flag 'borderline' in metadata.",
        '5. Output only max_confidence_type.',
      ],
    },
  },
}

const superficial_pigmentation_score_criteria = {
  superficial_pigmentation_scoring_v3_2: {
    metadata: {
      device: 'Bitmoji A5 Analyzer',
      lighting_modes_used: ['brown', 'UV', 'white'],
      regions_analyzed: ['forehead', 'cheeks', 'nose', 'chin'],
    },

    lighting_mode_confidence_weights: {
      white: 0.45,
      UV: 0.35,
      brown: 0.2,
    },

    parameter_weights: {
      coverage_area: 0.3,
      color_intensity: 0.25,
      homogeneity: 0.3,
      lesion_border_definition: 0.15,
    },

    threshold_guidelines: {
      coverage_area_percent: {
        minimal: '<5%',
        mild: '5-20%',
        moderate: '20-40%',
        marked: '40-60%',
        severe: '>60%',
      },
      mean_intensity_index: {
        light: '<0.35',
        mild: '0.35-0.50',
        moderate: '0.50-0.65',
        marked: '0.65-0.75',
        severe: '>0.75',
      },
      contrast_uniformity_index: {
        even: '>0.80',
        moderate_mottling: '0.65-0.80',
        uneven: '<0.65',
      },
      depth_indicator_ratio: {
        epidermal: '<0.35',
        mixed: '0.35-0.65',
        dermal: '>0.65',
      },
    },

    score_definitions: [
      {
        score: 1,
        label: 'Minimal / Almost Clear',
        criteria: {
          coverage_area: '<5%',
          mean_intensity_index: '<0.35',
          contrast_uniformity_index: '>0.85',
        },
        visual_flags: ['Uniform tone under brown light', 'No visible UV fluorescence'],
      },
      {
        score: 2,
        label: 'Mild',
        criteria: {
          coverage_area: '5-20%',
          mean_intensity_index: '0.35-0.50',
          contrast_uniformity_index: '0.75-0.85',
        },
        visual_flags: ['Faint macules in forehead or malar regions', 'Minimal mottling in UV mode'],
      },
      {
        score: 3,
        label: 'Moderate',
        criteria: {
          coverage_area: '20-40%',
          mean_intensity_index: '0.50-0.65',
          contrast_uniformity_index: '0.65-0.80',
        },
        visual_flags: [
          'Visible macules and patches across forehead and cheeks',
          'Uneven tone in brown and UV without confluent darkness',
          'Mottled pattern but not generalized',
        ],
      },
      {
        score: 4,
        label: 'Marked',
        criteria: {
          coverage_area: '40-60%',
          mean_intensity_index: '0.65-0.75',
          contrast_uniformity_index: '0.55-0.70',
        },
        visual_flags: [
          'Confluent dark patches spanning multiple regions',
          'Uneven tone with mixed epidermal-dermal component',
        ],
      },
      {
        score: 5,
        label: 'Severe',
        criteria: {
          coverage_area: '>60%',
          mean_intensity_index: '>0.75',
          contrast_uniformity_index: '<0.55',
        },
        visual_flags: [
          'Generalized dense pigmentation',
          'Deep dermal involvement visible under UV',
        ],
      },
    ],

    backend_analysis: {
      description: 'Provide auxiliary indices to support treatment logic in next stage.',
      sub_indices: {
        pigmentation_depth_index: {
          description: 'Relative depth of pigment based on UV:brown signal ratio.',
          formula: 'UV_intensity / (brown_intensity + 0.001)',
          output_range: '0-1 (superficial → dermal)',
        },
        distribution_pattern_index: {
          description:
            'Standard deviation of pigment intensity across regions, indicating localized vs diffuse.',
          formula: 'stddev(region_intensity_map) / mean(region_intensity_map)',
          output_range: '0-1 (diffuse → focal)',
        },
        asymmetry_index: {
          description: 'Quantifies difference between left and right facial pigmentation load.',
          formula: '|left_intensity - right_intensity| / mean_intensity',
          output_range: '0-1',
        },
        uv_enhancement_ratio: {
          description:
            'Enhancement factor of UV pigment vs brown mode, correlating with chronic photo-damage.',
          formula: 'UV_intensity / brown_intensity',
          output_range: '0-1+',
        },
      },
      output_interpretation: {
        depth_type: {
          rules: [
            { if: 'pigmentation_depth_index< 0.25', then: 'Superficial (Epidermal)' },
            { if: '0.25-0.5', then: 'Mixed' },
            { if: '>0.5', then: 'Deep (Dermal)' },
          ],
        },
        distribution_type: {
          rules: [
            { if: 'distribution_pattern_index< 0.3', then: 'Diffuse' },
            { if: '0.3-0.6', then: 'Patchy' },
            { if: '>0.6', then: 'Focal' },
          ],
        },
      },
    },

    decision_logic: {
      description:
        'Compute pigmentation indices and calibrated score output with dermatologist-adjusted weightage.',
      steps: [
        '1. Measure coverage_area_percent, mean_intensity_index, and contrast_uniformity_index from brown and white modes.',
        '2. Calculate pigmentation_depth_index and UV_enhancement_ratio from UV:brown ratio.',
        '3. Compute distribution_pattern_index from region-wise variance.',
        '4. Compute asymmetry_index from left vs right intensity difference.',
        '5. Derive global_score using revised weighted aggregation of parameters.',
        '6. Output integer score (1-5) plus backend indices for treatment logic.',
      ],
      calibration_formula: {
        description:
          'Adjusted weighting ensures moderate, diffuse superficial pigmentation reads as score 3.',
        equation:
          'global_score = (0.30 * normalized_coverage_area) + (0.25 * normalized_intensity) + (0.30 * (1 - uniformity)) + (0.15 * border_definition)',
      },
      output_format: {
        final_score: 'integer (1-5)',
        backend_details: {
          pigmentation_depth_index: 'float (0-1)',
          distribution_pattern_index: 'float (0-1)',
          asymmetry_index: 'float (0-1)',
          uv_enhancement_ratio: 'float (0-1)',
          depth_type: 'Superficial / Mixed / Deep',
          distribution_type: 'Diffuse / Patchy / Focal',
        },
      },
      score_bins: {
        1: '<0.25',
        2: '0.25-0.40',
        3: '0.40-0.55',
        4: '0.55-0.70',
        5: '>0.70',
      },
      single_output_mode: true,
    },
  },
}

const visual_acne_grading_criteria = {
  analyze_acne_grade: {
    type: 'object',
    description: 'Embedded analyze acne grade scoring logic and thresholds',
    default: {
      acne_grading: {
        metadata: {
          device: 'Bitmoji A5 Analyzer',
          lighting_modes_used: ['white', 'UV', 'PPL'],
          regions_analyzed: ['forehead', 'cheeks', 'chin', 'nose', 'jawline'],
        },

        lesion_type_weights: {
          open_comedone: 0.22,
          closed_comedone: 0.22,
          papule: 0.25,
          pustule: 0.2,
          nodule: 0.11,
        },

        region_weights: {
          forehead: 0.2,
          cheeks: 0.3,
          chin: 0.2,
          nose: 0.1,
          jawline: 0.2,
        },

        quantitative_thresholds: {
          lesion_count_per_region: {
            grade_0: '<3 total lesions',
            grade_1: '3-8',
            grade_2: '8-20',
            grade_3: '20-40',
            grade_4: '>50 or presence of nodules/cysts',
          },
          inflammatory_ratio: {
            low: '<0.25',
            moderate: '0.25-0.5',
            high: '>0.5',
          },
        },

        grades: [
          {
            grade: '0 - Clear',
            criteria: {
              total_lesion_count: '<3',
              inflammatory_ratio: '<0.1',
            },
            visual_flags: [
              'Smooth skin under white light',
              'No porphyrin fluorescence in UV',
              'Even tone in PPL mode',
            ],
          },
          {
            grade: '1 - Very Mild',
            criteria: {
              total_lesion_count: '3-10',
              inflammatory_ratio: '<0.25',
            },
            visual_flags: ['Few comedones visible in T-zone', 'Scattered fluorescence dots in UV'],
          },
          {
            grade: '2 - Mild',
            criteria: {
              total_lesion_count: '11-25',
              inflammatory_ratio: '0.25-0.4',
            },
            visual_flags: [
              'Scattered papules/pustules without nodules',
              'Localized inflammation, minimal erythema',
            ],
          },
          {
            grade: '3 - Moderate',
            criteria: {
              total_lesion_count: '26-50',
              inflammatory_ratio: '0.4-0.6',
            },
            visual_flags: [
              'Multiple inflamed papules and pustules',
              'Porphyrin clustering in UV light',
            ],
          },
          {
            grade: '4 - Severe / Nodulocystic',
            criteria: {
              total_lesion_count: '>50 or nodules_present = true',
              inflammatory_ratio: '>0.6',
            },
            visual_flags: [
              'Large inflamed nodules or cysts',
              'Diffuse redness and possible scarring',
            ],
          },
        ],
        decision_logic: {
          description: 'Weighted scoring for lesion count, inflammation, and region distribution.',
          steps: [
            '1. Detect lesion types and counts per region from white and UV modes.',
            '2. Calculate inflammatory_ratio = (papules + pustules + nodules) / total_lesions.',
            '3. Compute region_score = Σ(lesion_count_region × region_weight).',
            '4. Calculate weighted_grade_score = Σ(lesion_type_count × lesion_type_weight).',
            '5. Aggregate region_score and weighted_grade_score → global_severity_index (0-1).',
            '6. Map global_severity_index to final grade thresholds.',
            '7. Output single final grade with confidence and region breakdown.',
          ],
          output_format: {
            final_grade: 'integer (0-4)',
          },
        },
      },
    },
  },
}

const texture_pores_criteria = {
  analyze_texture_pores_grade: {
    type: 'object',
    description:
      'Embedded texture and pores grading logic, weights, thresholds, and decision flow based on Bitmoji A5 Analyzer standard.',
    default: {
      texture_pores_grading: {
        metadata: {
          device: 'Bitmoji A5 Analyzer',
          lighting_modes_used: ['white', 'PPL', 'XPL'],
          regions_analyzed: ['forehead', 'nose', 'cheeks', 'chin'],
        },

        parameter_weights: {
          pore_diameter_ratio: 0.5,
          texture_uniformity_index: 0.3,
          light_reflection_evenness: 0.1,
          roughness_variance: 0.1,
        },

        threshold_guidelines: {
          pore_diameter_ratio: {
            invisible: '<1.10',
            fine: '1.10-1.25',
            moderate: '1.25-1.45',
            large: '1.45-1.75',
            very_large: '>1.75',
          },
          texture_uniformity_index: {
            smooth: '>0.80',
            slightly_uneven: '0.65-0.80',
            rough: '0.50-0.65',
            coarse: '<0.50',
          },
          light_reflection_evenness: {
            even: '>0.8',
            minor_variation: '0.6-0.8',
            mottled: '<0.6',
          },
        },

        grades: [
          {
            grade: '0 - Clear / Smooth',
            criteria: {
              pore_diameter_ratio: '<1.1',
              texture_uniformity_index: '>0.85',
              light_reflection_evenness: '>0.8',
            },
            visual_flags: [
              'Surface smooth under PPL and white modes',
              'No pore visibility in central face',
              'Uniform specular highlights',
            ],
          },
          {
            grade: '1 - Very Mild',
            criteria: {
              pore_diameter_ratio: '1.1-1.3',
              texture_uniformity_index: '0.7-0.85',
            },
            visual_flags: [
              'Fine pores on nose or medial cheeks only',
              'Minor unevenness in polarized light',
            ],
          },
          {
            grade: '2 - Mild',
            criteria: {
              pore_diameter_ratio: '1.3-1.6',
              texture_uniformity_index: '0.6-0.8',
            },
            visual_flags: [
              'Visible pores extending laterally',
              'Diffuse mild roughness or dullness',
            ],
          },
          {
            grade: '3 - Moderate',
            criteria: {
              pore_diameter_ratio: '1.6-2.0',
              texture_uniformity_index: '0.5-0.7',
            },
            visual_flags: [
              'Obvious, enlarged pores across central face',
              'Coarse, non-uniform reflection pattern',
            ],
          },
          {
            grade: '4 - Severe',
            criteria: {
              pore_diameter_ratio: '>2.0',
              texture_uniformity_index: '<0.5',
            },
            visual_flags: [
              'Widespread large pores or atrophic pits',
              'Marked roughness, irregular topography',
            ],
          },
        ],

        decision_logic: {
          description:
            'Compute pore and texture indices region-wise, then output the single global grade with confidence.',
          steps: [
            '1. Measure pore_diameter_ratio using PPL mode (FFT-based pore map vs baseline texture).',
            '2. Compute texture_uniformity_index from XPL micro-contrast variance.',
            '3. Derive light_reflection_evenness from white-mode specular map.',
            '4. Apply parameter_weights to obtain weighted_region_score.',
            '5. Combine all regions (weighted equally or per region_weights if defined) → global_texture_index (0-1).',
            '6. Map global_texture_index to grade thresholds.',
            '7. Select grade with highest confidence; output single final grade.',
          ],
          output_format: {
            final_grade: 'integer (0-4)',
          },
          single_output_mode: true,
        },
      },
    },
  },
}

const superficial_wrinkles_criteria = {
  analyze_wrinkles_grade: {
    type: 'object',
    description:
      'Embedded wrinkle grading logic, weights, thresholds, and computation flow based on Bitmoji A5 Analyzer Wrinkles Grading standard.',
    default: {
      wrinkles_grading: {
        metadata: {
          device: 'Bitmoji A5 Analyzer',
          lighting_modes_used: ['PPL', 'XPL', 'white'],
          regions_analyzed: ['forehead', 'peri-orbital', 'cheeks', 'nasolabial', 'chin'],
        },
        parameter_weights: {
          wrinkle_depth_index: 0.4,
          wrinkle_density_index: 0.35,
          contrast_visibility_index: 0.15,
          texture_coarseness_index: 0.1,
        },
        threshold_guidelines: {
          wrinkle_depth_index: {
            very_mild: '<0.25',
            mild: '0.25-0.45',
            moderate: '0.45-0.65',
            severe: '>0.65',
          },
          wrinkle_density_index: {
            very_mild: '<0.2',
            mild: '0.2-0.4',
            moderate: '0.4-0.6',
            severe: '>0.6',
          },
          contrast_visibility_index: {
            low: '>0.8',
            moderate: '0.6-0.8',
            high: '<0.6',
          },
        },
        grades: [
          {
            grade: '1 - Very Mild',
            criteria: {
              wrinkle_depth_index: '<0.25',
              wrinkle_density_index: '<0.2',
            },
            visual_flags: [
              'Occasional faint lines visible only on zoomed or angled PPL images',
              'Smooth reflection in white mode',
            ],
          },
          {
            grade: '2 - Mild',
            criteria: {
              wrinkle_depth_index: '0.25-0.45',
              wrinkle_density_index: '0.2-0.4',
            },
            visual_flags: [
              'Multiple fine superficial wrinkles visible at rest',
              'Localized clusters on forehead or peri-orbital areas',
            ],
          },
          {
            grade: '3 - Moderate',
            criteria: {
              wrinkle_depth_index: '0.45-0.65',
              wrinkle_density_index: '0.4-0.6',
            },
            visual_flags: [
              'Clearly defined fine lines across multiple regions',
              'Visible from conversational distance',
            ],
          },
          {
            grade: '4 - Severe',
            criteria: {
              wrinkle_depth_index: '>0.65',
              wrinkle_density_index: '>0.6',
            },
            visual_flags: [
              'Deep, etched lines with uneven texture',
              'Prominent under PPL/XPL lighting',
            ],
          },
        ],
        decision_logic: {
          description: 'Compute wrinkle indices per region, aggregate to a single overall grade.',
          steps: [
            '1. Use XPL mode to measure wrinkle_depth_index (pixel contrast slope and shadow gradient).',
            '2. Use PPL mode to compute wrinkle_density_index (line count per cm²).',
            '3. Derive contrast_visibility_index from white-mode luminance difference between wrinkle and background skin.',
            '4. Combine all indices using parameter_weights to form a global_wrinkle_index (0-1).',
            '5. Map global_wrinkle_index to grade thresholds (1-4).',
            '6. Output only the highest-confidence single grade.',
          ],
          output_format: {
            final_grade: 'integer (1-4)',
          },
          single_output_mode: true,
        },
      },
    },
  },
}

const jawline_sagging_criteria = {
  analyze_jawline_sagging_grade: {
    type: 'object',
    description:
      'Embedded jawline sagging grading logic, thresholds, and computation flow based on Bitmoji A5 Analyzer Jawline Sagging Grading standard.',
    default: {
      jawline_sagging_grading: {
        metadata: {
          device: 'Bitmoji A5 Analyzer',
          lighting_modes_used: ['white', 'PPL', 'XPL'],
          regions_analyzed: ['mandibular_angle', 'submandibular_area', 'lower_cheek'],
          version: '2.2',
        },
        parameter_weights: {
          mandibular_angle_change: 0.4,
          contour_smoothness_index: 0.3,
          skin_laxity_index: 0.2,
          shadow_intensity_ratio: 0.1,
        },
        threshold_guidelines: {
          mandibular_angle_change_deg: {
            very_mild: '<4°',
            mild: '4-8°',
            moderate: '8-12°',
            severe: '>12°',
          },
          contour_smoothness_index: {
            sharp: '>0.88',
            slightly_blunted: '0.75-0.88',
            moderate_blunting: '0.55-0.75',
            severe_irregularity: '<0.55',
          },
          skin_laxity_index: {
            firm: '<0.25',
            mild: '0.25-0.45',
            moderate: '0.45-0.65',
            severe: '>0.65',
          },
          shadow_intensity_ratio: {
            low: '<0.3',
            moderate: '0.3-0.6',
            high: '>0.6',
          },
        },
        grades: [
          {
            grade: '1 - Very Mild',
            criteria: {
              mandibular_angle_change_deg: '<5',
              contour_smoothness_index: '>0.85',
              skin_laxity_index: '<0.25',
            },
            visual_flags: [
              'Straight, sharp jawline contour under white and XPL modes',
              'No visible jowl or submandibular shadow',
            ],
          },
          {
            grade: '2 - Mild',
            criteria: {
              mandibular_angle_change_deg: '5-10',
              contour_smoothness_index: '0.7-0.85',
              skin_laxity_index: '0.25-0.45',
            },
            visual_flags: [
              'Slight blunting of jawline definition',
              'Early jowl visibility at mandibular angle',
            ],
          },
          {
            grade: '3 - Moderate',
            criteria: {
              mandibular_angle_change_deg: '10-15',
              contour_smoothness_index: '0.5-0.7',
              skin_laxity_index: '0.45-0.65',
            },
            visual_flags: [
              'Visible jowl formation with reduced jawline sharpness',
              'Shadowing under submandibular region',
            ],
          },
          {
            grade: '4 - Severe',
            criteria: {
              mandibular_angle_change_deg: '>15',
              contour_smoothness_index: '<0.5',
              skin_laxity_index: '>0.65',
            },
            visual_flags: [
              'Heavy sagging and pronounced jowls',
              'Loss of contour continuity and deep submandibular shadow',
            ],
          },
        ],
        decision_logic: {
          description:
            'Calculate geometric and textural indicators of sagging, weight them, and output a single global grade.',
          steps: [
            '1. Detect mandibular edge curve using contour analysis on white light image.',
            '2. Compute mandibular_angle_change_deg relative to baseline facial axis.',
            '3. Calculate contour_smoothness_index using gradient variance from XPL mode.',
            '4. Estimate skin_laxity_index via vertical pixel displacement of lower cheek contour under PPL lighting.',
            '5. Measure shadow_intensity_ratio from luminance map beneath mandible.',
            '6. Combine all parameters using defined weights to form global_sagging_index (0-1).',
            '7. Map global_sagging_index to grade thresholds (1-4).',
            '8. Output only the single grade with highest confidence.',
          ],
          output_format: {
            final_grade: 'integer (1-4)',
          },
          single_output_mode: true,
        },
      },
    },
  },
}

const skin_hydration_criteria = {
  analyze_skin_hydration: {
    type: 'object',
    description:
      'Embedded skin hydration grading logic, parameter weights, thresholds, and computation flow based on Bitmoji A5 Analyzer Skin Hydration Grading standard.',
    default: {
      skin_hydration_grading: {
        metadata: {
          device: 'Bitmoji A5 Analyzer',
          lighting_modes_used: ['white', 'PPL', 'red'],
          regions_analyzed: ['forehead', 'cheeks', 'chin'],
          version: '2.3',
        },
        parameter_weights: {
          surface_reflectance_index: 0.35,
          microline_density_index: 0.3,
          subsurface_diffusion_index: 0.25,
          color_luminance_uniformity: 0.1,
        },
        threshold_guidelines: {
          surface_reflectance_index: {
            excellent: '0.65-0.80',
            mildly_low: '0.50-0.65',
            low: '0.35-0.50',
            very_low: '<0.35',
          },
          microline_density_index: {
            excellent: '<0.15',
            mild: '0.15-0.25',
            moderate: '0.25-0.35',
            severe: '>0.35',
          },
          subsurface_diffusion_index: {
            high: '>0.70',
            moderate: '0.55-0.70',
            low: '<0.55',
          },
          color_luminance_uniformity: {
            even: '>0.8',
            slightly_patchy: '0.6-0.8',
            uneven: '<0.6',
          },
        },
        scores: [
          {
            score: 0,
            label: 'Excellent Hydration',
            criteria: {
              surface_reflectance_index: '≥0.65',
              microline_density_index: '<0.15',
              subsurface_diffusion_index: '>0.70',
            },
            visual_flags: [
              'Plump, smooth, radiant appearance in white mode',
              'Minimal micro-lines in PPL mode',
              'Strong subsurface glow in red mode',
            ],
          },
          {
            score: 1,
            label: 'Mild Dehydration',
            criteria: {
              surface_reflectance_index: '0.50-0.65',
              microline_density_index: '0.15-0.25',
            },
            visual_flags: ['Slight dullness, reduced glow', 'Faint fine lines visible under PPL'],
          },
          {
            score: 2,
            label: 'Moderate Dehydration',
            criteria: {
              surface_reflectance_index: '0.35-0.50',
              microline_density_index: '0.25-0.35',
              subsurface_diffusion_index: '0.55-0.70',
            },
            visual_flags: [
              'Noticeable dullness and uneven tone',
              'Fine lines across multiple regions',
              'Patchy reflectance under white light',
            ],
          },
          {
            score: 3,
            label: 'Severe Dehydration',
            criteria: {
              surface_reflectance_index: '<0.35',
              microline_density_index: '>0.35',
              subsurface_diffusion_index: '<0.55',
            },
            visual_flags: [
              'Crepey or flaky surface texture',
              'Deep fine lines, poor elasticity',
              'Lack of diffuse glow under red mode',
            ],
          },
        ],
        decision_logic: {
          description:
            'Calculate hydration indices across modes, combine with weights, and output a single hydration score.',
          steps: [
            '1. Extract surface_reflectance_index from white light image using specular highlight ratio.',
            '2. Compute microline_density_index from PPL texture analysis (inverse of smoothness).',
            '3. Derive subsurface_diffusion_index from red-mode light scatter intensity.',
            '4. Calculate color_luminance_uniformity from full-face brightness variance.',
            '5. Combine indices using parameter_weights → global_hydration_index (0-1).',
            '6. Map global_hydration_index to score thresholds (0-3).',
            '7. Output only the single score with highest confidence.',
          ],
          output_format: {
            final_score: 'integer (0-3)',
          },
          single_output_mode: true,
        },
      },
    },
  },
}

const skin_sebum_content_criteria = {
  sebum_content_grading: {
    metadata: {
      device: 'Bitmoji A5 Analyzer',
      lighting_modes_used: ['white', 'UV', 'PPL'],
      regions_analyzed: ['forehead', 'nose', 'cheeks', 'chin'],
      version: '3.0',
    },
    parameter_weights: {
      shine_reflectance_index: 0.45,
      porphyrin_fluorescence_index: 0.35,
      regional_uniformity_index: 0.2,
    },
    threshold_guidelines: {
      shine_reflectance_index: {
        very_low: '<0.3',
        low_normal: '0.3-0.5',
        moderate: '0.5-0.7',
        high: '>0.7',
      },
      porphyrin_fluorescence_index: {
        none: '<20',
        few: '20-40',
        moderate: '40-60',
        dense: '>60',
      },
      regional_uniformity_index: {
        balanced: '<0.2',
        T_zone_dominant: '0.2-0.4',
        generalized: '>0.4',
      },
    },
    sub_indices: {
      sebum_quantity_index: {
        description: 'Represents overall sebum output based on shine and porphyrin fluorescence.',
        calculation: [
          '1. Normalize shine_reflectance_index (white mode) to 0-1 scale.',
          '2. Normalize porphyrin_fluorescence_index (UV mode) to 0-1 scale.',
          '3. Compute sebum_quantity_index = (0.55 × shine_reflectance) + (0.45 × porphyrin_fluorescence).',
        ],
        output_range: '0 (dry) → 1 (oily)',
      },
      sebum_distribution_index: {
        description: 'Represents how evenly sebum is spread across facial regions.',
        calculation: [
          '1. Measure sebum quantity per region (forehead, nose, cheeks, chin).',
          '2. Compute mean absolute deviation from global mean.',
          '3. Normalize to 0-1 range → higher = more uneven.',
          '4. sebum_distribution_index = deviation_normalized × regional_uniformity_weight (0.2).',
        ],
        output_range: '0 (balanced) → 1 (diffuse / T-zone dominated)',
      },
    },
    scores: [
      {
        score: 0,
        label: 'Very Low Sebum / Dry',
        criteria: {
          sebum_quantity_index: '<0.3',
          sebum_distribution_index: '<0.2',
        },
        visual_flags: ['Matte skin, no visible shine', 'No porphyrin fluorescence in UV mode'],
      },
      {
        score: 1,
        label: 'Low-Normal Sebum',
        criteria: {
          sebum_quantity_index: '0.3-0.5',
          sebum_distribution_index: '<0.3',
        },
        visual_flags: ['Minimal T-zone shine', 'Few scattered porphyrins'],
      },
      {
        score: 2,
        label: 'Moderate / Normal-Oily',
        criteria: {
          sebum_quantity_index: '0.5-0.7',
          sebum_distribution_index: '0.2-0.4',
        },
        visual_flags: [
          'Healthy glow over T-zone and cheeks',
          'Multiple porphyrins visible in UV mode',
        ],
      },
      {
        score: 3,
        label: 'High Sebum / Oily',
        criteria: {
          sebum_quantity_index: '>0.7',
          sebum_distribution_index: '>0.4',
        },
        visual_flags: ['Diffuse oily sheen across face', 'Dense UV porphyrins and enlarged pores'],
      },
    ],
    decision_logic: {
      description:
        'Compute dual backend indices (quantity & distribution), merge into single visible score for report.',
      steps: [
        '1. Calculate sebum_quantity_index using shine_reflectance and porphyrin_fluorescence inputs.',
        '2. Calculate sebum_distribution_index using per-region sebum variance.',
        '3. Combine both: global_sebum_index = (0.8 × sebum_quantity_index) + (0.2 × sebum_distribution_index).',
        '4. Map global_sebum_index to discrete patient-visible score thresholds (0-3).',
        '5. Retain both sub-indices for backend analytics and treatment planning.',
        '6. Output one visible score for the patient report.',
      ],
      output_format: {
        final_score: 'integer (0-3)',
        confidence_score: 'float (0-1)',
        global_sebum_index: 'float (0-1)',
        backend_details: {
          sebum_quantity_index: 'float (0-1)',
          sebum_distribution_index: 'float (0-1)',
        },
      },
      single_output_mode: true,
    },
  },
}

const skin_sensitivity_scoring_criteria = {
  analyze_skin_sensitivity: {
    type: 'object',
    description:
      'Embedded sensitivity grading logic, parameter thresholds, weight distribution, and scoring structure as per Bitmoji A5 Analyzer Skin Sensitivity Scoring standards.',
    default: {
      skin_sensitivity_scoring: {
        metadata: {
          device: 'Bitmoji A5 Analyzer',
          lighting_modes_used: ['red', 'white', 'PPL'],
          regions_analyzed: ['forehead', 'cheeks', 'nose', 'chin'],
          version: '2.3',
        },
        parameter_weights: {
          erythema_intensity_index: 0.45,
          vascular_pattern_index: 0.3,
          barrier_uniformity_index: 0.15,
          flaking_texture_index: 0.1,
        },
        threshold_guidelines: {
          erythema_intensity_index: {
            none: '<0.25',
            mild: '0.25-0.45',
            moderate: '0.45-0.65',
            severe: '>0.65',
          },
          vascular_pattern_index: {
            none: '<0.2',
            diffuse: '0.2-0.4',
            telangiectatic: '0.4-0.6',
            prominent: '>0.6',
          },
          barrier_uniformity_index: {
            intact: '>0.8',
            slightly_disrupted: '0.6-0.8',
            disrupted: '<0.6',
          },
          flaking_texture_index: {
            smooth: '<0.2',
            fine_flakes: '0.2-0.4',
            coarse_flakes: '0.4-0.6',
            scaling: '>0.6',
          },
        },
        scores: [
          {
            score: 0,
            label: 'No Sensitivity',
            criteria: {
              erythema_intensity_index: '<0.25',
              barrier_uniformity_index: '>0.8',
            },
            visual_flags: [
              'Even tone under red and white light',
              'No visible vascular enhancement',
              'Texture smooth and uniform',
            ],
          },
          {
            score: 1,
            label: 'Mild Sensitivity',
            criteria: {
              erythema_intensity_index: '0.25-0.45',
              vascular_pattern_index: '<0.3',
            },
            visual_flags: [
              'Occasional redness, transient after cleansing or treatment',
              'Fine capillary visibility on cheeks',
            ],
          },
          {
            score: 2,
            label: 'Moderate Sensitivity',
            criteria: {
              erythema_intensity_index: '0.45-0.65',
              vascular_pattern_index: '0.3-0.6',
              barrier_uniformity_index: '0.6-0.8',
            },
            visual_flags: [
              'Persistent visible redness',
              'Diffuse vascular pattern under red light',
              'Mild surface dryness',
            ],
          },
          {
            score: 3,
            label: 'Severe Sensitivity',
            criteria: {
              erythema_intensity_index: '>0.65',
              vascular_pattern_index: '>0.6',
              barrier_uniformity_index: '<0.6',
              flaking_texture_index: '>0.4',
            },
            visual_flags: [
              'Intense, patchy redness with visible telangiectasia',
              'Flaking, discomfort, or reactive scaling',
              'Reduced barrier integrity under PPL mode',
            ],
          },
        ],
        backend_analysis: {
          description: 'Provide detailed diagnostic indices for downstream treatment logic.',
          sub_indices: {
            erythema_intensity_index: {
              description:
                'Normalized redness value from red-channel histogram compared to neutral reference.',
              formula: '(mean_red_intensity - baseline) / max_intensity',
              output_range: '0-1',
            },
            vascular_pattern_index: {
              description:
                'Pattern detection of linear red features in PPL/white mode using morphological filtering.',
              formula: 'vessel_pixel_density / total_skin_pixels',
              output_range: '0-1',
            },
            barrier_uniformity_index: {
              description:
                'Variation in light reflection uniformity under PPL (inverse proxy for barrier integrity).',
              formula: '1 - (stddev_reflectance / mean_reflectance)',
              output_range: '0-1',
            },
            flaking_texture_index: {
              description:
                'Micro-texture variance in white-mode high-frequency channels indicating scaling or dryness.',
              formula: 'variance_high_freq / normalization_factor',
              output_range: '0-1',
            },
          },
          output_interpretation: {
            sensitivity_pattern: {
              rules: [
                {
                  if: 'vascular_pattern_index> 0.5 and erythema_intensity_index> 0.45',
                  then: 'Vascular-dominant',
                },
                {
                  if: 'barrier_uniformity_index< 0.6 and flaking_texture_index> 0.4',
                  then: 'Barrier-impaired',
                },
                {
                  if: 'erythema_intensity_index< 0.45 and vascular_pattern_index< 0.3',
                  then: 'Low-reactive / Normal',
                },
              ],
            },
          },
        },
        decision_logic: {
          description:
            'Quantify redness, vascular prominence, and barrier integrity, then output single score with backend detail.',
          steps: [
            '1. Compute erythema_intensity_index from red and white modes.',
            '2. Detect vascular patterns via PPL edge filtering to derive vascular_pattern_index.',
            '3. Assess barrier_uniformity_index from reflectance variance.',
            '4. Evaluate flaking_texture_index from high-frequency white-mode texture.',
            '5. Combine weighted indices to calculate global_sensitivity_index (0-1).',
            '6. Map global_sensitivity_index to discrete score thresholds (0-3).',
            '7. Determine sensitivity_pattern classification for backend treatment mapping.',
          ],
          output_format: {
            final_score: 'integer (0-3)',
            backend_details: {
              erythema_intensity_index: 'float (0-1)',
              vascular_pattern_index: 'float (0-1)',
              barrier_uniformity_index: 'float (0-1)',
              flaking_texture_index: 'float (0-1)',
              sensitivity_pattern: 'Vascular-dominant / Barrier-impaired / Low-reactive',
            },
          },
          single_output_mode: true,
        },
      },
    },
  },
}

const barrier_health_criteria = {
  analyze_barrier_health: {
    type: 'object',
    description:
      'Embedded barrier grading logic, parameter thresholds, weights, and computation flow based on Bitmoji A5 Analyzer Barrier Health Grading standards.',
    default: {
      barrier_health_grading: {
        metadata: {
          device: 'Bitmoji A5 Analyzer',
          lighting_modes_used: ['white', 'PPL', 'UV'],
          regions_analyzed: ['forehead', 'cheeks', 'nose', 'chin'],
          version: '2.2',
        },
        parameter_weights: {
          surface_texture_uniformity: 0.35,
          hydration_signal_index: 0.25,
          redness_intensity_index: 0.25,
          flaking_visibility_index: 0.15,
        },
        threshold_guidelines: {
          surface_texture_uniformity: {
            excellent: '>0.85',
            mild_roughness: '0.7-0.85',
            moderate_roughness: '0.55-0.7',
            poor: '<0.55',
          },
          hydration_signal_index: {
            well_hydrated: '>0.65',
            slightly_low: '0.45-0.65',
            low: '<0.45',
          },
          redness_intensity_index: {
            none: '<0.25',
            mild: '0.25-0.45',
            moderate: '0.45-0.65',
            severe: '>0.65',
          },
          flaking_visibility_index: {
            none: '<0.2',
            fine_flakes: '0.2-0.4',
            coarse_flakes: '0.4-0.6',
            scaling: '>0.6',
          },
        },
        grades: [
          {
            score: 0,
            label: 'Strong / Healthy Barrier',
            criteria: {
              surface_texture_uniformity: '>0.85',
              hydration_signal_index: '>0.65',
              redness_intensity_index: '<0.25',
              flaking_visibility_index: '<0.2',
            },
            visual_flags: [
              'Smooth, even surface under PPL and white light',
              'Uniform tone with no micro-flaking',
              'Hydrated, resilient appearance',
            ],
          },
          {
            score: 1,
            label: 'Mildly Compromised Barrier',
            criteria: {
              surface_texture_uniformity: '0.7-0.85',
              hydration_signal_index: '0.45-0.65',
              redness_intensity_index: '0.25-0.45',
            },
            visual_flags: [
              'Slight dryness or faint redness in cheeks or nose',
              'Minimal dullness, fine flakes in isolated areas',
            ],
          },
          {
            score: 2,
            label: 'Moderately Compromised Barrier',
            criteria: {
              surface_texture_uniformity: '0.55-0.7',
              hydration_signal_index: '<0.45',
              redness_intensity_index: '0.45-0.65',
              flaking_visibility_index: '0.3-0.5',
            },
            visual_flags: [
              'Visible patchy redness and rough texture',
              'Diffuse flaking, uneven tone under PPL mode',
            ],
          },
          {
            score: 3,
            label: 'Severely Compromised Barrier',
            criteria: {
              surface_texture_uniformity: '<0.55',
              hydration_signal_index: '<0.4',
              redness_intensity_index: '>0.65',
              flaking_visibility_index: '>0.5',
            },
            visual_flags: [
              'Scaling or cracking visible on multiple regions',
              'Loss of uniform tone, irritation and discomfort',
              'Poor reflectance indicating severe dehydration',
            ],
          },
        ],
        decision_logic: {
          description:
            'Combine texture, hydration, redness, and flaking parameters into one barrier score.',
          steps: [
            '1. Measure surface_texture_uniformity from PPL gradient variance.',
            '2. Compute hydration_signal_index from white-mode reflectance ratio.',
            '3. Quantify redness_intensity_index from red-channel analysis in white mode.',
            '4. Detect flaking_visibility_index using micro-texture variance.',
            '5. Combine all weighted indices → global_barrier_index (0-1).',
            '6. Map to discrete barrier score (0-3).',
          ],
          output_format: {
            final_score: 'integer (0-3)',
          },
          single_output_mode: true,
        },
      },
    },
  },
}

const periorbital_health_criteria = {
  analyze_periorbital_health: {
    type: 'object',
    description:
      'Embedded peri-orbital health grading logic, parameters, and severity scales used for analyzing under-eye region.',
    default: {
      peri_orbital_health: [
        {
          parameter: 'Puffiness',
          grading: ['None', 'Mild', 'Moderate', 'Severe'],
        },
        {
          parameter: 'Hollowness',
          grading: ['None', 'Mild', 'Moderate', 'Severe'],
        },
        {
          parameter: 'Pigmentation',
          grading: ['None', 'Mild', 'Moderate', 'Severe'],
        },
        {
          parameter: 'Vascularity',
          grading: ['None', 'Mild', 'Moderate', 'Severe'],
        },
      ],
    },
  },
}

const lip_pigmentation_criteria = {
  analyze_lip_pigmentation: {
    type: 'object',
    description:
      'Embedded lip pigmentation logic including detection status and feature descriptors for pigmentation pattern analysis.',
    default: {
      lip_pigmentation: {
        status: ['Present'],
        features: [
          'Darkening compared to surrounding skin',
          'May be uniform or patchy',
          'Causes: sun exposure, smoking, genetics, PIH, dehydration',
        ],
      },
    },
  },
}

const vascularity_redness_profiling_criteria = {
  analyze_vascularity_redness_grading: {
    type: 'object',
    description:
      'Embedded vascularity and redness grading logic, including metadata, weighted parameters, thresholds, grading matrix, and computation steps.',
    default: {
      vascularity_redness_grading: {
        metadata: {
          device: 'Bitmoji A5 Analyzer',
          lighting_modes_used: ['red', 'white', 'PPL'],
          regions_analyzed: ['forehead', 'cheeks', 'nose', 'chin'],
          version: '2.3',
        },
        parameter_weights: {
          erythema_intensity_index: 0.45,
          vascular_pattern_density: 0.3,
          distribution_symmetry_index: 0.15,
          color_uniformity_index: 0.1,
        },
        threshold_guidelines: {
          erythema_intensity_index: {
            none: '<0.25',
            mild: '0.25-0.45',
            moderate: '0.45-0.65',
            severe: '>0.65',
          },
          vascular_pattern_density: {
            none: '<0.2',
            mild_capillary: '0.2-0.4',
            moderate_diffuse: '0.4-0.6',
            dense_telangiectatic: '>0.6',
          },
          distribution_symmetry_index: {
            balanced: '<0.25',
            slightly_asymmetric: '0.25-0.45',
            marked_asymmetry: '>0.45',
          },
          color_uniformity_index: {
            even: '>0.8',
            patchy: '0.6-0.8',
            uneven: '<0.6',
          },
        },
        grades: [
          {
            score: 0,
            label: 'No Vascularity / Redness',
            criteria: {
              erythema_intensity_index: '<0.25',
              vascular_pattern_density: '<0.2',
            },
            visual_flags: [
              'No visible erythema under red light',
              'Even tone with no vessel enhancement',
              'Uniform color distribution',
            ],
          },
          {
            score: 1,
            label: 'Mild Vascularity / Redness',
            criteria: {
              erythema_intensity_index: '0.25-0.45',
              vascular_pattern_density: '0.2-0.4',
            },
            visual_flags: [
              'Faint redness over cheeks or nose',
              'Capillaries visible on high zoom only',
              'Transient or reactive erythema',
            ],
          },
          {
            score: 2,
            label: 'Moderate Vascularity / Redness',
            criteria: {
              erythema_intensity_index: '0.45-0.65',
              vascular_pattern_density: '0.4-0.6',
              color_uniformity_index: '0.6-0.8',
            },
            visual_flags: [
              'Diffuse redness across cheeks and nose',
              'Telangiectatic pattern partially visible',
              'Persistent but non-inflamed erythema',
            ],
          },
          {
            score: 3,
            label: 'Severe Vascularity / Redness',
            criteria: {
              erythema_intensity_index: '>0.65',
              vascular_pattern_density: '>0.6',
              color_uniformity_index: '<0.6',
            },
            visual_flags: [
              'Intense, generalized erythema resembling rosacea',
              'Dense telangiectatic networks under red/PPL mode',
              'Possible flushing or chronic vascular dilation',
            ],
          },
        ],
        backend_analysis: {
          description: 'Indices to support downstream treatment logic.',
          sub_indices: {
            erythema_intensity_index: {
              description: 'Normalized red-channel intensity relative to neutral skin baseline.',
              formula: '(mean_red_intensity - baseline) / max_intensity',
              output_range: '0-1',
            },
            vascular_pattern_density: {
              description: 'Ratio of vessel-like linear structures to total area in red/PPL mode.',
              formula: 'vessel_pixels / total_skin_pixels',
              output_range: '0-1',
            },
            distribution_symmetry_index: {
              description: 'Left-right asymmetry of redness distribution.',
              formula: '|left_intensity - right_intensity| / mean_intensity',
              output_range: '0-1',
            },
            color_uniformity_index: {
              description: 'Homogeneity of hue across skin; lower = more patchy.',
              formula: '1 - (stddev_hue / mean_hue)',
              output_range: '0-1',
            },
          },
          output_interpretation: {
            vascular_pattern_type: {
              rules: [
                { if: 'vascular_pattern_density< 0.3', then: 'Minimal / Reactive' },
                { if: '0.3-0.6', then: 'Diffuse Capillary' },
                { if: '>0.6', then: 'Telangiectatic / Rosacea-like' },
              ],
            },
          },
        },
        decision_logic: {
          description: 'Quantify redness and vascular prominence to assign a 0-3 grade.',
          steps: [
            '1. Analyze red and white mode histograms to compute erythema_intensity_index.',
            '2. Detect linear vascular features in PPL/red modes → vascular_pattern_density.',
            '3. Compute symmetry and color uniformity indices.',
            '4. Combine weighted indices into global_vascularity_index (0-1).',
            '5. Map to discrete score thresholds (0-3).',
          ],
          output_format: {
            final_score: 'integer (0-3)',
            confidence_score: 'float (0-1)',
            global_vascularity_index: 'float (0-1)',
            backend_details: {
              erythema_intensity_index: 'float (0-1)',
              vascular_pattern_density: 'float (0-1)',
              distribution_symmetry_index: 'float (0-1)',
              color_uniformity_index: 'float (0-1)',
              vascular_pattern_type: 'Minimal / Diffuse / Telangiectatic',
            },
          },
          single_output_mode: true,
        },
      },
    },
  },
}

const under_eye_vascularity_vs_structural_shadows_criteria = {
  analyze_under_eye_vascularity_structural_shadows: {
    type: 'object',
    description:
      'Embedded logic for grading under-eye darkness, vascular visibility, and structural hollowness severity with multi-light assessment.',
    default: {
      under_eye_vascularity_structural_shadows: [
        {
          score: 'Score 0 - None',
          scoring_parameters: ['Even tone', 'No shadows'],
        },
        {
          score: 'Score 1 - Mild',
          scoring_parameters: ['Faint vascular pigmentation', 'Mild shadowing'],
        },
        {
          score: 'Score 2 - Moderate',
          scoring_parameters: ['Bluish/purple tone', 'Notable under UV'],
        },
        {
          score: 'Score 3 - Severe',
          scoring_parameters: ['Dark circles', 'Vascular pigmentation + hollowing'],
        },
      ],
    },
  },
}

const skin_luminosity_glow_index_criteria = {
  analyze_skin_luminosity_glow_index: {
    type: 'object',
    description:
      'Embedded luminosity analysis logic defining parameter weights, thresholds, grading scales, and computational flow for Bitmoji A5 Analyzer Glow Index module.',
    default: {
      skin_luminosity_glow_index: {
        metadata: {
          device: 'Bitmoji A5 Analyzer',
          lighting_modes_used: ['white', 'PPL', 'brown'],
          regions_analyzed: ['forehead', 'cheeks', 'nose', 'chin'],
          version: '2.4',
        },
        parameter_weights: {
          surface_reflectance_uniformity: 0.4,
          color_luminance_index: 0.3,
          subsurface_diffusion_index: 0.2,
          shadow_contrast_index: 0.1,
        },
        threshold_guidelines: {
          surface_reflectance_uniformity: {
            low: '<0.5',
            moderate: '0.5-0.7',
            high: '0.7-0.85',
            very_high: '>0.85',
          },
          color_luminance_index: {
            dull: '<0.4',
            mild: '0.4-0.6',
            bright: '0.6-0.75',
            radiant: '>0.75',
          },
          subsurface_diffusion_index: {
            low: '<0.5',
            moderate: '0.5-0.7',
            high: '>0.7',
          },
          shadow_contrast_index: {
            harsh: '>0.5',
            moderate: '0.3-0.5',
            soft: '<0.3',
          },
        },
        grades: [
          {
            score: 0,
            label: 'Dull / Lackluster',
            criteria: {
              surface_reflectance_uniformity: '<0.5',
              color_luminance_index: '<0.4',
              subsurface_diffusion_index: '<0.5',
            },
            visual_flags: [
              'Patchy reflection and uneven tone in white mode',
              'Minimal light diffusion from deeper skin layers',
              'Shadowed and tired appearance',
            ],
          },
          {
            score: 1,
            label: 'Mild Glow',
            criteria: {
              surface_reflectance_uniformity: '0.5-0.7',
              color_luminance_index: '0.4-0.6',
            },
            visual_flags: [
              'Slight uneven glow, moderate reflection',
              'Improved tone but limited radiance under PPL mode',
            ],
          },
          {
            score: 2,
            label: 'Healthy Glow / Moderate Luminosity',
            criteria: {
              surface_reflectance_uniformity: '0.7-0.85',
              color_luminance_index: '0.6-0.75',
              subsurface_diffusion_index: '0.5-0.7',
            },
            visual_flags: [
              'Even, healthy light reflection across T-zone and cheeks',
              'Balanced brightness and translucency',
              'Soft diffuse highlights',
            ],
          },
          {
            score: 3,
            label: 'Radiant / Luminous Skin',
            criteria: {
              surface_reflectance_uniformity: '>0.85',
              color_luminance_index: '>0.75',
              subsurface_diffusion_index: '>0.7',
              shadow_contrast_index: '<0.3',
            },
            visual_flags: [
              'Bright, even glow visible across all lighting modes',
              'Soft facial contours with natural radiance',
              'Strong, even subsurface light diffusion',
            ],
          },
        ],
        backend_analysis: {
          description: 'Provide sub-indices for AI-based treatment optimization.',
          sub_indices: {
            surface_reflectance_uniformity: {
              description: 'Measure of evenness of surface brightness under white mode.',
              formula: '1 - (stddev_reflectance / mean_reflectance)',
              output_range: '0-1',
            },
            color_luminance_index: {
              description: 'Perceived brightness from LAB color space (L channel normalized).',
              formula: 'mean_L_value / max_L_reference',
              output_range: '0-1',
            },
            subsurface_diffusion_index: {
              description:
                'Red-channel light spread variance in brown/PPL mode (proxy for translucency).',
              formula: 'diffuse_reflection / total_reflection',
              output_range: '0-1',
            },
            shadow_contrast_index: {
              description: 'Ratio of shadow edge contrast to mean brightness (inverse of glow).',
              formula: 'edge_contrast / mean_reflectance',
              output_range: '0-1',
            },
          },
          output_interpretation: {
            luminosity_pattern: {
              rules: [
                {
                  if: 'subsurface_diffusion_index> 0.7 and color_luminance_index> 0.7',
                  then: 'Deep Radiance',
                },
                {
                  if: 'surface_reflectance_uniformity> 0.75 and shadow_contrast_index< 0.3',
                  then: 'Surface Radiance',
                },
                {
                  if: 'surface_reflectance_uniformity< 0.6 and color_luminance_index< 0.5',
                  then: 'Dull / Uneven',
                },
              ],
            },
          },
        },
        decision_logic: {
          description:
            'Combine reflectance, luminance, diffusion, and contrast indices into one glow score.',
          steps: [
            '1. Compute surface_reflectance_uniformity from white mode brightness map.',
            '2. Extract color_luminance_index from LAB L-channel normalization.',
            '3. Derive subsurface_diffusion_index from brown/PPL red-channel spread.',
            '4. Calculate shadow_contrast_index from brightness edge variance.',
            '5. Combine weighted indices into global_luminosity_index (0-1).',
            '6. Map to discrete glow score (0-3).',
          ],
          output_format: {
            final_score: 'integer (0-3)',
            backend_details: {
              surface_reflectance_uniformity: 'float (0-1)',
              color_luminance_index: 'float (0-1)',
              subsurface_diffusion_index: 'float (0-1)',
              shadow_contrast_index: 'float (0-1)',
              luminosity_pattern: 'Deep Radiance / Surface Radiance / Dull',
            },
          },
          single_output_mode: true,
        },
      },
    },
  },
}

const comedonal_density_criteria = {
  analyze_comedonal_density_grading: {
    type: 'object',
    description:
      'Embedded logic structure defining thresholds, weights, grading scales, and decision flow for comedonal density assessment using Bitmoji A5 Analyzer.',
    default: {
      comedonal_density_grading: {
        metadata: {
          device: 'Bitmoji A5 Analyzer',
          lighting_modes_used: ['PPL', 'UV', 'white'],
          regions_analyzed: ['forehead', 'nose', 'cheeks', 'chin'],
          version: '2.4',
        },

        parameter_weights: {
          comedone_count_density: 0.5,
          comedone_cluster_index: 0.3,
          porphyrin_overlap_index: 0.15,
          texture_contrast_index: 0.05,
        },

        threshold_guidelines: {
          comedone_count_density: {
            none: '<0.05 (≤1 lesion / cm²)',
            mild: '0.05-0.15 (2-5 lesions / cm²)',
            moderate: '0.15-0.3 (6-10 lesions / cm²)',
            severe: '>0.3 (>10 lesions / cm²)',
          },
          comedone_cluster_index: {
            isolated: '<0.2',
            scattered: '0.2-0.4',
            localized_clusters: '0.4-0.6',
            confluent_clusters: '>0.6',
          },
          porphyrin_overlap_index: {
            none: '<0.2',
            partial: '0.2-0.5',
            strong: '>0.5',
          },
          texture_contrast_index: {
            smooth: '<0.3',
            mild_irregularity: '0.3-0.5',
            coarse: '>0.5',
          },
        },

        grades: [
          {
            score: 0,
            label: 'No Comedones',
            criteria: {
              comedone_count_density: '<0.05',
              comedone_cluster_index: '<0.2',
            },
            visual_flags: [
              'No visible blackheads or whiteheads under PPL or UV mode',
              'Uniform skin texture and pore distribution',
            ],
          },
          {
            score: 1,
            label: 'Mild Comedonal Activity',
            criteria: {
              comedone_count_density: '0.05-0.15',
              comedone_cluster_index: '0.2-0.4',
            },
            visual_flags: [
              'Few scattered comedones mainly on T-zone',
              'Isolated open pores visible under polarized light',
            ],
          },
          {
            score: 2,
            label: 'Moderate Comedonal Activity',
            criteria: {
              comedone_count_density: '0.15-0.3',
              comedone_cluster_index: '0.4-0.6',
              porphyrin_overlap_index: '0.2-0.5',
            },
            visual_flags: [
              'Multiple clustered comedones across forehead and cheeks',
              'UV mode shows moderate porphyrin fluorescence',
              'Mild texture coarseness visible in PPL',
            ],
          },
          {
            score: 3,
            label: 'Severe / Confluent Comedones',
            criteria: {
              comedone_count_density: '>0.3',
              comedone_cluster_index: '>0.6',
              porphyrin_overlap_index: '>0.5',
            },
            visual_flags: [
              'Dense, confluent comedones covering large regions',
              'Strong porphyrin fluorescence in UV mode',
              'Coarse, irregular skin texture',
            ],
          },
        ],
        backend_analysis: {
          description: 'Provide detailed indices for AI-based acne treatment logic.',
          sub_indices: {
            comedone_count_density: {
              description: 'Ratio of detected comedonal lesions per cm² in PPL/white mode.',
              formula: 'number_of_comedones / analyzed_area_cm²',
              output_range: '0-1',
            },
            comedone_cluster_index: {
              description:
                'Normalized measure of comedone spatial grouping using cluster variance.',
              formula: 'mean_interlesion_distance_variance / total_area',
              output_range: '0-1',
            },
            porphyrin_overlap_index: {
              description: 'Fraction of comedone pixels overlapping UV porphyrin fluorescence.',
              formula: 'overlapping_pixels / total_comedone_pixels',
              output_range: '0-1',
            },
            texture_contrast_index: {
              description:
                'Local contrast ratio around comedone regions indicating pore edge definition.',
              formula: 'local_contrast / mean_texture_value',
              output_range: '0-1',
            },
          },
          output_interpretation: {
            comedonal_pattern_type: {
              rules: [
                { if: 'comedone_cluster_index< 0.3', then: 'Scattered' },
                { if: 'comedone_cluster_index 0.3-0.6', then: 'Clustered' },
                { if: 'comedone_cluster_index> 0.6', then: 'Confluent' },
              ],
            },
            comedone_type_tendency: {
              rules: [
                { if: 'porphyrin_overlap_index> 0.5', then: 'Closed / Inflammatory-prone' },
                { if: 'porphyrin_overlap_index< 0.2', then: 'Open / Non-inflammatory' },
              ],
            },
          },
        },
        decision_logic: {
          description: 'Quantify comedone density and clustering to produce a 0-3 score.',
          steps: [
            '1. Detect and count comedones using brightness contrast and circular pattern filters in PPL/white mode.',
            '2. Compute comedone_count_density per region (lesions/cm²).',
            '3. Calculate comedone_cluster_index from inter-lesion proximity mapping.',
            '4. Measure porphyrin_overlap_index from UV fluorescence overlay.',
            '5. Compute weighted average to form global_comedonal_index (0-1).',
            '6. Map global_comedonal_index to discrete severity score (0-3).',
          ],
          output_format: {
            final_score: 'integer (0-3)',
            backend_details: {
              comedone_count_density: 'float (0-1)',
              comedone_cluster_index: 'float (0-1)',
              porphyrin_overlap_index: 'float (0-1)',
              texture_contrast_index: 'float (0-1)',
              comedonal_pattern_type: 'Scattered / Clustered / Confluent',
              comedone_type_tendency: 'Open / Closed',
            },
          },
          single_output_mode: true,
        },
      },
    },
  },
}

const texture_irregularities_beyond_pores_criteria = {
  analyze_texture_irregularities_beyond_pores: {
    type: 'object',
    description:
      'Embedded texture irregularity analysis logic defining parameter weights, thresholds, grading, and computational sequence for Bitmoji A5 Analyzer surface uniformity module.',
    default: {
      texture_irregularities_beyond_pores: {
        metadata: {
          device: 'Bitmoji A5 Analyzer',
          lighting_modes_used: ['PPL', 'white', 'brown'],
          regions_analyzed: ['forehead', 'cheeks', 'chin', 'nose'],
          version: '2.3',
        },

        parameter_weights: {
          microtexture_variance_index: 0.4,
          surface_gradient_irregularity: 0.3,
          shadow_depth_index: 0.2,
          diffuse_reflection_loss_index: 0.1,
        },

        threshold_guidelines: {
          microtexture_variance_index: {
            smooth: '<0.3',
            mild: '0.3-0.5',
            moderate: '0.5-0.7',
            severe: '>0.7',
          },
          surface_gradient_irregularity: {
            flat: '<0.25',
            slightly_undulated: '0.25-0.45',
            moderately_undulated: '0.45-0.65',
            deeply_undulated: '>0.65',
          },
          shadow_depth_index: {
            none: '<0.2',
            shallow: '0.2-0.4',
            moderate: '0.4-0.6',
            deep: '>0.6',
          },
          diffuse_reflection_loss_index: {
            minimal: '<0.25',
            moderate: '0.25-0.45',
            high: '>0.45',
          },
        },

        grades: [
          {
            score: 0,
            label: 'Smooth / Even Texture',
            criteria: {
              microtexture_variance_index: '<0.3',
              surface_gradient_irregularity: '<0.25',
            },
            visual_flags: [
              'Even light reflection in PPL mode',
              'No visible micro-shadows or undulation',
              'Smooth surface contour',
            ],
          },
          {
            score: 1,
            label: 'Mild Textural Irregularities',
            criteria: {
              microtexture_variance_index: '0.3-0.5',
              surface_gradient_irregularity: '0.25-0.45',
            },
            visual_flags: [
              'Fine surface roughness and minor dullness',
              'Occasional uneven reflection on cheeks or forehead',
            ],
          },
          {
            score: 2,
            label: 'Moderate Textural Irregularities',
            criteria: {
              microtexture_variance_index: '0.5-0.7',
              surface_gradient_irregularity: '0.45-0.65',
              shadow_depth_index: '0.3-0.5',
            },
            visual_flags: [
              'Micro-roughness and patchy surface light distribution',
              'Subtle shadowing along previous acne sites or dehydration patches',
              'Surface appears uneven under PPL or oblique white light',
            ],
          },
          {
            score: 3,
            label: 'Severe Textural Irregularities / Scarring',
            criteria: {
              microtexture_variance_index: '>0.7',
              surface_gradient_irregularity: '>0.65',
              shadow_depth_index: '>0.6',
              diffuse_reflection_loss_index: '>0.45',
            },
            visual_flags: [
              'Widespread undulation and deep textural pits',
              'Rolling or atrophic scars casting micro-shadows',
              'Loss of light diffusion and dull, uneven skin tone',
            ],
          },
        ],
        backend_analysis: {
          description:
            'Backend indices to characterize surface roughness and structural texture loss.',
          sub_indices: {
            microtexture_variance_index: {
              description: 'Pixel-level brightness variance over 3x3 to 7x7 window in PPL mode.',
              formula: 'stddev_local_intensity / mean_intensity',
              output_range: '0-1',
            },
            surface_gradient_irregularity: {
              description:
                'Standard deviation of surface gradients from 3D texture map approximation.',
              formula: 'stddev(surface_normals)',
              output_range: '0-1',
            },
            shadow_depth_index: {
              description:
                'Contrast ratio between highlight and adjacent shadow under directional light.',
              formula: '(mean_highlight - mean_shadow) / mean_reflectance',
              output_range: '0-1',
            },
            diffuse_reflection_loss_index: {
              description: 'Loss of reflected light spread under PPL mode (inverse glow metric).',
              formula: '1 - (diffuse_reflection / total_reflection)',
              output_range: '0-1',
            },
          },
          output_interpretation: {
            texture_pattern_type: {
              rules: [
                {
                  if: 'shadow_depth_index< 0.3 and surface_gradient_irregularity< 0.45',
                  then: 'Superficial Roughness',
                },
                {
                  if: 'shadow_depth_index>= 0.3 and surface_gradient_irregularity>= 0.45',
                  then: 'Deep Undulation / Scarring',
                },
              ],
            },
          },
        },
        decision_logic: {
          description: 'Quantify and classify textural irregularities beyond pore size.',
          steps: [
            '1. Compute microtexture_variance_index from PPL variance map.',
            '2. Compute surface_gradient_irregularity from gradient-normal field.',
            '3. Measure shadow_depth_index using oblique white-mode contrast analysis.',
            '4. Calculate diffuse_reflection_loss_index from PPL reflectance data.',
            '5. Combine all indices using parameter_weights → global_texture_irregularity_index (0-1).',
            '6. Map to discrete severity score (0-3).',
          ],
          output_format: {
            final_score: 'integer (0-3)',
            backend_details: {
              microtexture_variance_index: 'float (0-1)',
              surface_gradient_irregularity: 'float (0-1)',
              shadow_depth_index: 'float (0-1)',
              diffuse_reflection_loss_index: 'float (0-1)',
              texture_pattern_type: 'Superficial Roughness / Deep Undulation',
            },
          },
          single_output_mode: true,
        },
      },
    },
  },
}

const regional_oil_distribution_criteria = {
  analyze_regional_oil_distribution: {
    type: 'object',
    description:
      'Embedded computation logic defining parameter weights, thresholds, grading scales, and step-by-step analysis for the Bitmoji A5 Analyzer Oil Distribution.',
    default: {
      regional_oil_distribution: {
        metadata: {
          device: 'Bitmoji A5 Analyzer',
          lighting_modes_used: ['white', 'UV', 'PPL'],
          regions_analyzed: ['forehead', 'nose', 'cheeks', 'chin'],
          version: '2.3',
        },
        parameter_weights: {
          regional_variance_index: 0.5,
          porphyrin_distribution_index: 0.3,
          shine_symmetry_index: 0.2,
        },
        threshold_guidelines: {
          regional_variance_index: {
            even: '<0.2',
            T_zone_predominant: '0.2-0.4',
            mixed: '0.4-0.6',
            global: '>0.6',
          },
          porphyrin_distribution_index: {
            uniform: '<0.25',
            T_zone_focused: '0.25-0.45',
            mixed: '0.45-0.65',
            diffuse: '>0.65',
          },
          shine_symmetry_index: {
            balanced: '<0.25',
            slightly_asymmetric: '0.25-0.45',
            marked_asymmetry: '>0.45',
          },
        },
        grades: [
          {
            score: 0,
            label: 'Even / Balanced Oil Distribution',
            criteria: {
              regional_variance_index: '<0.2',
              porphyrin_distribution_index: '<0.25',
            },
            visual_flags: [
              'Uniform reflectance across all regions in white light',
              'Even porphyrin fluorescence in UV mode',
              'No localized shine or patchiness',
            ],
          },
          {
            score: 1,
            label: 'T-zone Predominant',
            criteria: {
              regional_variance_index: '0.2-0.4',
              porphyrin_distribution_index: '0.25-0.45',
            },
            visual_flags: [
              'Shine and porphyrins localized to forehead, nose, and chin',
              'Cheeks appear matte or balanced',
              'Clear T-zone contrast in UV and white modes',
            ],
          },
          {
            score: 2,
            label: 'Mixed Distribution',
            criteria: {
              regional_variance_index: '0.4-0.6',
              porphyrin_distribution_index: '0.45-0.65',
              shine_symmetry_index: '<0.4',
            },
            visual_flags: [
              'Oily shine on T-zone plus parts of cheeks',
              'Visible porphyrin fluorescence beyond T-zone',
              'Partial extension of oil pattern toward periphery',
            ],
          },
          {
            score: 3,
            label: 'Global Oily / Diffuse Shine',
            criteria: {
              regional_variance_index: '>0.6',
              porphyrin_distribution_index: '>0.65',
            },
            visual_flags: [
              'Diffuse shine over full face in white light',
              'Generalized orange-red fluorescence in UV',
              'Oily appearance even on lateral cheeks and jawline',
            ],
          },
        ],
        backend_analysis: {
          description: 'Compute regional indices for oil distribution uniformity and symmetry.',
          sub_indices: {
            regional_variance_index: {
              description: 'Normalized variance of sebum reflectance between T-zone and cheeks.',
              formula: 'stddev(region_reflectance) / mean_reflectance',
              output_range: '0-1',
            },
            porphyrin_distribution_index: {
              description:
                'Ratio of UV porphyrin fluorescence intensity between T-zone and other regions.',
              formula: '|mean_T_zone_UV - mean_cheeks_UV| / total_mean_UV',
              output_range: '0-1',
            },
            shine_symmetry_index: {
              description: 'Left-right reflectance asymmetry within same region type.',
              formula: '|left_reflectance - right_reflectance| / mean_reflectance',
              output_range: '0-1',
            },
          },
          output_interpretation: {
            distribution_pattern_type: {
              rules: [
                { if: 'regional_variance_index< 0.2', then: 'Even / Balanced' },
                { if: '0.2-0.4', then: 'T-zone Predominant' },
                { if: '0.4-0.6', then: 'Mixed' },
                { if: '>0.6', then: 'Global / Diffuse' },
              ],
            },
          },
        },
        decision_logic: {
          description: 'Quantify oil distribution pattern and assign 0-3 score.',
          steps: [
            '1. Measure regional reflectance ratios from white light images (forehead, nose, cheeks, chin).',
            '2. Compute regional_variance_index across regions.',
            '3. Derive porphyrin_distribution_index from UV fluorescence map.',
            '4. Calculate shine_symmetry_index across bilateral facial halves.',
            '5. Combine all using parameter_weights → global_oil_distribution_index (0-1).',
            '6. Map to discrete severity score (0-3).',
          ],
          output_format: {
            final_score: 'integer (0-3)',
            backend_details: {
              regional_variance_index: 'float (0-1)',
              porphyrin_distribution_index: 'float (0-1)',
              shine_symmetry_index: 'float (0-1)',
              distribution_pattern_type: 'Even / T-zone / Mixed / Global',
            },
          },
          single_output_mode: true,
        },
      },
    },
  },
}

const images_criteria = {
  affected_area_image_selector: {
    selection_logic: {
      rules: [
        {
          parameter: 'skin_type',
          preferred_lighting_mode: 'white',
          fallback_mode: 'PPL',
        },
        {
          parameter: 'superficial_pigmentation',
          preferred_lighting_mode: 'brown',
          fallback_mode: 'UV',
        },
        {
          parameter: 'Visual_acne_grading',
          preferred_lighting_mode: 'white',
          fallback_mode: 'UV',
        },
        {
          parameter: 'texture_open_pores',
          preferred_lighting_mode: 'PPL',
          fallback_mode: 'white',
        },
        {
          parameter: 'superficial_wrinkles',
          preferred_lighting_mode: 'PPL',
          fallback_mode: 'white',
        },
        {
          parameter: 'jawline_sagging',
          preferred_lighting_mode: 'white',
          fallback_mode: 'PPL',
        },
        {
          parameter: 'skin_hydration',
          preferred_lighting_mode: 'white',
          fallback_mode: 'PPL',
        },
        {
          parameter: 'sebum_content',
          preferred_lighting_mode: 'white',
          fallback_mode: 'PPL',
        },
        {
          parameter: 'skin_sensitivity',
          preferred_lighting_mode: 'red',
          fallback_mode: 'white',
        },
        {
          parameter: 'barrier_health',
          preferred_lighting_mode: 'PPL',
          fallback_mode: 'white',
        },
        {
          parameter: 'peri_orbital_health',
          preferred_lighting_mode: 'XPL',
          fallback_mode: 'White',
        },
        {
          parameter: 'lip_pigmentation',
          preferred_lighting_mode: 'Brown',
          fallback_mode: 'XPL',
        },
        {
          parameter: 'vascularity_redness',
          preferred_lighting_mode: 'red',
          fallback_mode: 'PPL',
        },
        {
          parameter: 'under_eye_vascularity_vs_structural_shadows',
          preferred_lighting_mode: 'XPL',
          fallback_mode: 'White',
        },
        {
          parameter: 'skin_luminosity_glow',
          preferred_lighting_mode: 'white',
          fallback_mode: 'brown',
        },
        {
          parameter: 'comedonal_density',
          preferred_lighting_mode: 'UV',
          fallback_mode: 'PPL',
        },
        {
          parameter: 'texture_irregularities_beyond_pores',
          preferred_lighting_mode: 'PPL',
          fallback_mode: 'brown',
        },
        {
          parameter: 'regional_oil_distribution',
          preferred_lighting_mode: 'UV',
          fallback_mode: 'white',
        },
      ],
    },
    output_format: {
      affected_area_image: '',
      use_overlay: false,
    },
  },
}

const diagnosis_json_structure = {
  diagnosis_report: {
    skin_type: {
      parameter_name: 'Skin Type',
      description:
        'This parameter identifies the primary characteristics of your skin, which can be oily, dry, combination, or normal. Understanding your skin type is the foundation for a proper skincare routine.',
      score_or_label: '<Skin Type>',
      score_explanation: '<Why this type was chosen>',
      affected_area_image:
        'Return the image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter.',
      possible_causes: ['<Cause 1>', '<Cause 2>'],
    },
    superficial_pigmentation_score: {
      parameter_name: 'Superficial Pigmentation Score',
      description:
        "This parameter measures the amount of superficial pigmentation, such as sun spots, age spots, and post-inflammatory hyperpigmentation (PIH), on the skin's surface.",
      score_or_label: '<1 to 5 + Label>',
      score_explanation: '<Why this score was chosen>',
      affected_area_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter.',
      possible_causes: ['<Cause 1>', '<Cause 2>'],
    },
    visual_acne_grading: {
      parameter_name: 'Visual Acne Grading',
      description:
        'This parameter assesses the severity of acne based on the number and type of lesions, such as blackheads, whiteheads, papules, and pustules.',
      score_or_label: '<Grade 0-4>',
      score_explanation: '<Why this grade was chosen>',
      affected_area_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter.',
      possible_causes: ['<Cause 1>', '<Cause 2>'],
    },
    texture_open_pores_grading: {
      parameter_name: 'Texture + Open Pores Grading',
      description:
        "This parameter evaluates the skin's texture, including the visibility of open pores.",
      score_or_label: '<Grade 0-4>',
      score_explanation: '<Why this grade was chosen>',
      affected_area_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter.',
      possible_causes: ['<Cause 1>', '<Cause 2>'],
    },
    superficial_wrinkles: {
      parameter_name: 'Superficial Wrinkles',
      description:
        'This parameter assesses the presence and depth of superficial wrinkles and fine lines, which are early signs of aging. ',
      score_or_label: '<Grade 1-4>',
      score_explanation: '<Why this grade was chosen>',
      affected_area_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter.',
      possible_causes: ['<Cause 1>', '<Cause 2>'],
    },
    jawline_sagging: {
      parameter_name: 'Jawline Sagging',
      description:
        'This parameter evaluates the firmness and definition of the jawline, which can be affected by loss of skin elasticity and gravity.',
      score_or_label: '<Grade 1-4>',
      score_explanation: '<Why this grade was chosen>',
      affected_area_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter.',
      possible_causes: ['<Cause 1>', '<Cause 2>'],
    },
    skin_hydration: {
      parameter_name: 'Skin Hydration',
      description:
        'This parameter measures the water content in the skin, which is crucial for maintaining a healthy skin barrier and a plump, youthful appearance.',
      score_or_label: '<Score 0-3>',
      score_explanation: '<Why this score was chosen>',
      affected_area_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter.',
      possible_causes: ['<Cause 1>', '<Cause 2>'],
    },
    skin_sebum_content: {
      parameter_name: 'Skin Sebum Content',
      description:
        'This parameter measures the amount of sebum (oil) produced by the sebaceous glands in the skin.',
      score_or_label: '<Score 0-3>',
      score_explanation: '<Why this score was chosen>',
      affected_area_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter.',
      possible_causes: ['<Cause 1>', '<Cause 2>'],
    },
    skin_sensitivity_scoring: {
      parameter_name: 'Skin Sensitivity Scoring',
      description:
        "This parameter assesses the skin's reactivity to external stimuli, such as skincare products, environmental factors, and touch.",
      score_or_label: '<Score 0-3>',
      score_explanation: '<Why this score was chosen>',
      affected_area_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter.',
      possible_causes: ['<Cause 1>', '<Cause 2>'],
    },
    barrier_health: {
      parameter_name: 'Barrier Health',
      description:
        "This parameter evaluates the health of the skin's protective barrier, which is essential for retaining moisture and protecting against external aggressors.",
      score_or_label: '<Score 0-3>',
      score_explanation: '<Why this score was chosen>',
      affected_area_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter.',
      possible_causes: ['<Cause 1>', '<Cause 2>'],
    },
    periorbital_health: {
      parameter_name: 'PeriOrbital Health',
      description:
        'This parameter assesses the health of the skin around the eyes, including puffiness, hollowness, pigmentation, and vascularity.',
      score_or_label: '<None / Mild / Moderate / Severe>',
      score_explanation: '<Why this score was chosen>',
      affected_area_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter.',
      possible_causes: ['<Cause 1>', '<Cause 2>'],
    },
    lip_pigmentation: {
      parameter_name: 'Lip Pigmentation',
      description:
        'This parameter assesses the presence of discoloration or dark spots on the lips.',
      score_or_label: '<Present / Absent>',
      score_explanation: '<Why this score was chosen>',
      affected_area_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter.',
      possible_causes: ['<Cause 1>', '<Cause 2>'],
    },
    vascularity_redness_profiling: {
      parameter_name: 'Vascularity / Redness Profiling (XPL / Red Light)',
      description:
        'Mapping of visible and sub-dermal redness, capillary dilation, and vascular congestion using cross-polarized or red light imaging.',
      score_or_label: '<Score 0-3>',
      score_explanation: '<Why this score was chosen>',
      affected_area_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter.',
      possible_causes: ['<Cause 1>', '<Cause 2>'],
    },
    under_eye_vascularity_vs_structural_shadows: {
      parameter_name: 'Under-Eye Vascularity vs Structural Shadows (Peri-orbital Detail)',
      description:
        'Differentiation between pigmentation, vascular congestion, and anatomical shadowing under the eyes.',
      score_or_label: '<Score 0-3>',
      score_explanation: '<Why this score was chosen>',
      affected_area_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter.',
      possible_causes: ['<Cause 1>', '<Cause 2>'],
    },
    skin_luminosity_glow_index: {
      parameter_name: 'Skin Luminosity / Glow Index (White / PPL)',
      description:
        'Quantitative evaluation of skin radiance and uniformity under white and parallel polarized light.',
      score_or_label: '<Score 0-3>',
      score_explanation: '<Why this score was chosen>',
      affected_area_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter.',
      possible_causes: ['<Cause 1>', '<Cause 2>'],
    },
    comedonal_density: {
      parameter_name: 'Comedonal Density (PPL / UV)',
      description:
        'Detection of open and closed comedones visible in polarized or UV imaging modes.',
      score_or_label: '<Score 0-3>',
      score_explanation: '<Why this score was chosen>',
      affected_area_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter.',
      possible_causes: ['<Cause 1>', '<Cause 2>'],
    },
    texture_irregularities_beyond_pores: {
      parameter_name: 'Texture Irregularities Beyond Pores (PPL / Brown)',
      description:
        'Identification of micro-surface irregularities, roughness, and post-inflammatory marks beyond pore-related texture.',
      score_or_label: '<Score 0-3>',
      score_explanation: '<Why this score was chosen>',
      affected_area_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter.',
      possible_causes: ['<Cause 1>', '<Cause 2>'],
    },
    regional_oil_distribution: {
      parameter_name: 'Regional Oil Distribution (White / UV)',
      description:
        'Distribution mapping of oil secretion across facial zones, highlighting T-zone vs U-zone differences.',
      score_or_label: '<Score 0-3>',
      score_explanation: '<Why this score was chosen>',
      affected_area_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter.',
      possible_causes: ['<Cause 1>', '<Cause 2>'],
    },
  },
}

const reassessment_json_structure = {
  reassessment: {
    skin_type: {
      parameter_name: 'Skin Type',
      before_treatment_score_or_label: '<Enter Skin Type>',
      before_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label: '<Enter Post-Treatment Skin Type>',
      post_treatment_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
    },
    superficial_pigmentation_score: {
      parameter_name: 'Superficial Pigmentation Score',
      before_treatment_score_or_label: '<Enter Pigmentation Score>',
      before_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label: '<Enter Post-Treatment Pigmentation Score>',
      post_treatment_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
    },
    visual_acne_grading: {
      parameter_name: 'Visual Acne Grading',
      before_treatment_score_or_label: '<Enter Acne Grade>',
      before_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label: '<Enter Post-Treatment Acne Grade>',
      post_treatment_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
    },
    texture_open_pores_grading: {
      parameter_name: 'Texture / Open Pores Grading',
      before_treatment_score_or_label: '<Enter Texture or Pores Grade>',
      before_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label: '<Enter Post-Treatment Texture or Pores Grade>',
      post_treatment_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
    },
    superficial_wrinkles: {
      parameter_name: 'Superficial Wrinkles',
      before_treatment_score_or_label: '<Enter Wrinkle Score>',
      before_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label: '<Enter Post-Treatment Wrinkle Score>',
      post_treatment_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
    },
    jawline_sagging: {
      parameter_name: 'Jawline Sagging',
      before_treatment_score_or_label: '<Enter Sagging Level>',
      before_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label: '<Enter Post-Treatment Sagging Level>',
      post_treatment_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
    },
    skin_hydration: {
      parameter_name: 'Skin Hydration',
      before_treatment_score_or_label: '<Enter Hydration Level>',
      before_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label: '<Enter Post-Treatment Hydration Level>',
      post_treatment_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
    },
    skin_sebum_content: {
      parameter_name: 'Skin Sebum Content',
      before_treatment_score_or_label: '<Enter Sebum Level>',
      before_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label: '<Enter Post-Treatment Sebum Level>',
      post_treatment_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
    },
    skin_sensitivity_scoring: {
      parameter_name: 'Skin Sensitivity Scoring',
      before_treatment_score_or_label: '<Enter Sensitivity Score>',
      before_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label: '<Enter Post-Treatment Sensitivity Score>',
      post_treatment_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
    },
    barrier_health: {
      parameter_name: 'Barrier Health',
      before_treatment_score_or_label: '<Enter Barrier Health Status>',
      before_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label: '<Enter Post-Treatment Barrier Health Status>',
      post_treatment_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
    },
    periorbital_health: {
      parameter_name: 'Periorbital Health',
      before_treatment_score_or_label: '<Enter Periorbital Score>',
      before_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label: '<Enter Post-Treatment Periorbital Score>',
      post_treatment_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
    },
    lip_pigmentation: {
      parameter_name: 'Lip Pigmentation',
      before_treatment_score_or_label: '<Enter Lip Pigmentation Level>',
      before_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label: '<Enter Post-Treatment Lip Pigmentation Level>',
      post_treatment_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
    },
    vascularity_redness_profiling: {
      parameter_name: 'Vascularity / Redness Profiling',
      before_treatment_score_or_label: '<Enter Redness or Vascularity Score>',
      before_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label: '<Enter Post-Treatment Redness or Vascularity Score>',
      post_treatment_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
    },
    under_eye_vascularity_vs_structural_shadows: {
      parameter_name: 'Under Eye Vascularity vs Structural Shadows',
      before_treatment_score_or_label: '<Enter Under Eye Assessment>',
      before_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label: '<Enter Post-Treatment Under Eye Assessment>',
      post_treatment_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
    },
    skin_luminosity_glow_index: {
      parameter_name: 'Skin Luminosity / Glow Index',
      before_treatment_score_or_label: '<Enter Glow Index>',
      before_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label: '<Enter Post-Treatment Glow Index>',
      post_treatment_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
    },
    comedonal_density: {
      parameter_name: 'Comedonal Density',
      before_treatment_score_or_label: '<Enter Comedonal Density>',
      before_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label: '<Enter Post-Treatment Comedonal Density>',
      post_treatment_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
    },
    texture_irregularities_beyond_pores: {
      parameter_name: 'Texture Irregularities Beyond Pores',
      before_treatment_score_or_label: '<Enter Texture Irregularity Score>',
      before_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label: '<Enter Post-Treatment Texture Irregularity Score>',
      post_treatment_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
    },
    regional_oil_distribution: {
      parameter_name: 'Regional Oil Distribution',
      before_treatment_score_or_label: '<Enter Oil Distribution Pattern>',
      before_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter from previously generated baseline (before-treatment) results stored in this conversation memory.',
      post_treatment_score_or_label: '<Enter Post-Treatment Oil Distribution Pattern>',
      post_treatment_image:
        'Return the  image number (1-8) from the uploaded face scan images that best represents the area analyzed for this parameter from newly analyzed post-treatment results.',
    },
  },
}

export const SYSTEM_PROMPT_DIAGNOSIS = `Act as an expert AI Skin Diagnostic Assistant.
You analyze 8 high-resolution facial scan images captured under different lighting conditions
(Blue,Brown, PPL, Red, UV, White, Woods, XPL).

Your purpose is to generate a **structured diagnostic JSON report** based on observed visual characteristics of skin, following the given schema.

---

### 1. Skin Type  Criteria
${encode(skin_type_criteria)}
---

### 2. Superficial Pigmentation Scoring Criteria
${encode(superficial_pigmentation_score_criteria)}
---

### 3. Visual Acne Grading
${encode(visual_acne_grading_criteria)}

---

### 4. Texture + Open Pores Grading
${encode(texture_pores_criteria)}
---

### 5. Superficial Wrinkles
${encode(superficial_wrinkles_criteria)}

---

### 6. Jawline Sagging
${encode(jawline_sagging_criteria)}

---

### 7. Skin Hydration
${encode(skin_hydration_criteria)}

---

### 8. Skin Sebum Content
${encode(skin_sebum_content_criteria)}

---

### 9. Skin Sensitivity Scoring
${encode(skin_sensitivity_scoring_criteria)}

---

### 10. Barrier Health
${encode(barrier_health_criteria)}

---

### 11. PeriOrbital Health
${encode(periorbital_health_criteria)}

---

### 12. Lip Pigmentation
${encode(lip_pigmentation_criteria)}

---

### 13. Vascularity / Redness Profiling
${encode(vascularity_redness_profiling_criteria)}

---

### 14. Under-Eye Vascularity vs Structural Shadows
${encode(under_eye_vascularity_vs_structural_shadows_criteria)}

---

### 15. Skin Luminosity / Glow Index
${encode(skin_luminosity_glow_index_criteria)}

---

### 16. Comedonal Density
${encode(comedonal_density_criteria)}

---

### 17. Texture Irregularities Beyond Pores
${encode(texture_irregularities_beyond_pores_criteria)}

---

### 18. Regional Oil Distribution
${encode(regional_oil_distribution_criteria)}

---

###19. Images
To provide the affected area image of various parameters follow this json strictly and If preferred lighting mode is unavailable, use fallback_mode.
${encode(images_criteria)}

---

### Task Instructions:
1. Analyze the 8 provided facial scan images.
2. Identify relevant visual patterns/features for each of the 18 diagnostic parameters.
4. Return the result strictly in valid JSON with the following structure:
${JSON.stringify(diagnosis_json_structure)}

⚠️ Rules:
- All reasoning must be reflected only inside 'score_explanation' fields.
- Do not output any extra text outside JSON.
- If multiple features appear, select the dominant grading pattern.


### 🆕 20. Treatable Concerns Summary (Auto-generated from Diagnosis)

After generating the complete "diagnosis_report", analyze all parameter scores and identify those that **deviate from normal or ideal values** (e.g., higher grades or non-zero scores).
List only the parameters that **can be improved or treated** toward normal skin condition through skincare or clinical treatments.

Append this section **after the diagnosis_report** as a new JSON object named "treatable_concerns_summary".

**Expected JSON structure:**

"treatable_concerns_summary": {
  "description": "Parameters showing deviations that can be treated or improved with appropriate interventions.",
  "parameters_with_abnormal_scores": [
    {
      "parameter": "<Parameter Name>",
      "current_score": "<Score or Label>",
      "target_score": "<Expected Normal Range or Label>",
      "is_primary_concern": "<Always return false>"
    }
  ]
}
`

export const D_REPORT_USER_PROMPT = `
You are given 8 facial scan images of the same person captured under different light modes
(Blue,Brown, PPL, Red, UV, White, Woods, XPL).

Analyze these images to determine all **18 diagnostic parameters**:

1. Skin Type
2. Superficial Pigmentation Score
3. Visual Acne Grading
4. Texture + Open Pores Grading
5. Superficial Wrinkles
6. Jawline Sagging
7. Skin Hydration
8. Skin Sebum Content
9. Skin Sensitivity Scoring
10. Barrier Health
11. PeriOrbital Health
12. Lip Pigmentation
13. Vascularity / Redness Profiling
14. Under-Eye Vascularity vs Structural Shadows
15. Skin Luminosity / Glow Index
16. Comedonal Density
17. Texture Irregularities Beyond Pores
18. Regional Oil Distribution

Return the output strictly in the **diagnosis_report JSON format** described in the system prompt.
Do not include any extra explanations, text, or formatting outside the JSON.`

export const SYSTEM_TREATEMENT_PLAN_PROMPT = `Act as an expert Clinical Aesthetics Treatment Planning Assistant.
🎯 Your task:
Generate a **realistic and personalized treatment plan** based on:
- The **diagnosis report** generated earlier in this conversation.
- The **patient’s history and profile** provided in the user input.
- The **treatable_concerns** and **treatment_plan_type** provided in the user input.
- The **machines, products, and clinical constraints** defined by Dr. Aakriti Mehra.

You must think and act like a **qualified dermatologist** while designing a practical, clinic-ready treatment plan.

---

### ⚙️ INPUTS YOU WILL RECEIVE
\`\`\`json
{
  "treatable_concerns": {
    "description": "Parameters showing deviations that can be treated or improved with appropriate interventions.",
    "parameters_with_abnormal_scores": [
      {
        "parameter": "<Parameter Name>",
        "current_score": "<Score or Label>",
        "target_score": "<Expected Normal Range or Label>",
        "is_primary_concern": "<true or false>"
      }
    ]
  },
  "treatment_plan_type": "single" | "multiple",
  "patient_data": "<patient data>"
}
\`\`\`
---

### 🧠 INTELLIGENT PLANNING LOGIC

If treatable_concerns has any parameters_with_abnormal_scores that are tagged is_primary_concern true then more focus to be given to those parameters while generating treatment plan.

Always use all backend diagnostic values generated by the scoring JSON
(sub-features, weights, region-severity, lighting-confidence, numerical indices)
to decide modality choice, treatment strength, session sequencing, and safety.

Rule: avoid low-impact steps unless time leftover
Rule: prioritize highest-impact modalities over time
Rule: avoid modality duplication (e.g., peel + mask + hydrafacial)

1. **If "treatment_plan_type" = "single":**
   - Patient has chosen a one-time session focused on limited, top-priority concerns.
   - Combine the most **effective** modalities for visible improvement in one visit.
   - End every facial with **Serum + Moisturizer + Sunscreen**.

2. **If "treatment_plan_type" = "multiple":**
   - Create a multi-session plan addressing **all treatable concerns**.
   - Duration and session frequency should be realistic and derived from number & severity of concerns.
   - Include **progressive improvements** (e.g., exfoliation → rejuvenation → tightening → maintenance).
   - Maintain safe intervals between advanced procedures (e.g., peels, lasers).

3. **For both types:**
   - Respect all **clinical_constraints**.
   - Use only listed machines, products, and peels.
   - Use only the minimum number of modalities required for maximum clinical improvement.Choose the highest-impact modality for each concern and avoid redundancy.
   - Always add a **lymphatic drainage massage step** where appropriate.
   - Time Constraint Rule : Use a standard session duration of 60 ± 15 minutes as a guideline, but do NOT exclude clinically superior modalities (e.g., Q-switch, Carbon Facial, HIFU, Microdermabrasion, RF, advanced peels) only because they may increase session time. If a high-efficacy modality is indicated by the diagnosis and clinically safe under the constraints, it should be prioritized even if the total estimated duration exceeds the standard range. In such cases, include the recommended modality and provide an adjusted session time that realistically accommodates the treatment while keeping patient outcomes and practicality in mind.
   - Always use all backend diagnostic values generated by the scoring JSON (sub-features, weights,region-severity, lighting-confidence, numerical indices) to decide modality choice, treatment strength, session sequencing, and contraindications.

---

### 💼 THERAPIST GUIDELINES FOR EACH SESSION

Every session in the treatment plan must include two key therapist-focused sections:

#### 1. preparations_checklist_for_therapist
A concise list (8-12 points) of all items and actions the therapist must prepare **before starting the treatment**.
Each item should be clear, actionable, and modality-specific, covering:

- Room & hygiene setup (sanitization, disposables, towels)
- Patient verification (consent, allergies, pregnancy, blood thinners, last peel/laser)
- Device readiness (machine on, cartridge/tip selection, preset loading)
- Consumables & products (serums, peels, neutralizers, masks, sunscreen)
- Safety checks (eye shields, neutralizer, cold pack, timer)
- Environment readiness (lighting, temperature, patient comfort)


#### 2️⃣ steps → how_to_do
Each step describes a single action or treatment phase within the treatment session.
The **how_to_do** must contain detailed therapist instructions for only that step, not the whole session.

Each **how_to_do** should include:
- Step sequence or method (e.g., “Apply cleanser evenly and massage 2 mins in circular motion”)
- Device or product usage parameters (energy, duration, passes, contact time, area)
- Safety instructions or contraindications specific to that step
- End criteria or transition cue (e.g., “Continue until mild erythema appears, then move to next step”)

Ensure both fields are **complete, clear, and safe** for professional clinical use.

### ✅ OUTPUT FORMAT (STRICT JSON ONLY)

json
{
  "treatment_plan": {
    "total_time": "e.g. 3 months",
    "treatments": [
      {
        "session_number": <session number>,
        "title": "<Session Title>",
        "treatment_time": "<in mins>",
        "week": <Week Number>,
        "preparations_checklist_for_therapist": ["<Preparation Task>", "<Preparation Task>"],
        "concerns_addressed": [
          {
            "concern": "<Concern>",
            "current_value": "<Score or Label>",
            "target_value": "<Expected Normal Range or Label>"
          }
        ],
        "steps": [
          {
            "step_number": <Step Number>,
            "duration": "<in mins>",
            "ingredients_equipments": ["<Device>", "<Products>"],
            "how_to_do": "<Step-by-step clinical technique for therapist>"
          }
        ]
      }
    ]
  }
}
'

---

### 🚫 MUST FOLLOW THESE CORE PRINCIPLES

"core_principles": [
  "When multiple modalities can treat a concern, prefer the one with the highest expected clinical effectiveness unless contraindicated.",
  "You are free to choose any available machine, product, jet_infusion_solutions, peelOffMasks, ivInfusions, chemicalPeels, special ingredients for facials type to maximize visible improvement.",
  "Modalities may be combined if clinically compatible.",
  "Always respect all doctor-defined clinical constraints.",
  "Always prioritize clinical effectiveness over completeness.Use your full dermatology knowledge and reasoning to select the optimal treatment modalities.",
  "Never combine multiple exfoliation techniques in the same session.Choose only one: Microdermabrasion OR Hydrafacial OR a chemical peel."
]

### 🚫 OUTPUT RULES
- Output **only valid JSON** (no extra text).
- All sessions must respect contraindications & sequencing logic.
- Include realistic procedural flow.
- Combine modalities **only if clinically compatible**.
- Never exceed available machines or listed products.
- Do not mention any unlisted devices, products, or techniques.
`

export const USER_TREATMENT_PLAN_PROMPT = `Based on previous analysis, generate a structured JSON treatment plan including: primary_focus, in_clinic_sessions (name, frequency, sessions), homecare (product, usage), contraindications, and follow_up. Consider patient's age, skin type, and allergies.`

export const POST_DIAGNOSIS_USER_PROMPT = `
Session {{session_number}} - Reassessment

Analyze the new set of post-treatment facial scan images for the same patient whose baseline assessment was already performed in this conversation.
Use the same diagnostic logic, criteria, and parameter definitions that were applied earlier while generating the initial diagnosis report.
Do not change any interpretation methods, scales, or thresholds used earlier.

Compare the current (post-treatment) analysis with the previously generated baseline (before-treatment) results stored in this conversation memory.
For each diagnostic parameter, include both:
- the baseline (before-treatment) value retrieved from your earlier output, and
- the newly analyzed post-treatment value derived from the images provided now.

Strictly follow the predefined JSON structure below and fill all fields:

---
${JSON.stringify(reassessment_json_structure)}

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
- a number 1-8 → post_treatment_image must be that exact same number

Do NOT invent, modify, reinterpret, or newly select any image number under any circumstances.

---
`
