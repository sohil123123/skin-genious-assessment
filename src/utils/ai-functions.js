export const skinTypeFunctions = [
  {
    type: 'function',
    name: 'apply_skin_type_logic',
    description: "Use the embedded skin classification rules to determine the user's skin type.",
    parameters: {
      type: 'object',
      properties: {
        classification_rules: {
          type: 'object',
          description: 'Embedded classification logic and thresholds',
          default: {
            skin_type_classification: {
              metadata: {
                device: 'Bitmoji A5 Analyzer',
                lighting_modes_used: ['white', 'UV', 'PPL'],
                regions_analyzed: ['forehead', 'nose', 'chin', 'cheeks'],
                version: '2.2',
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
          },
        },
      },
      required: ['classification_rules'],
    },
  },
  {
    type: 'function',
    name: 'superficial_pigmentation_scoring_logic',
    description:
      "Use the superficial pigmentation scoring (scoring_criteria) rules to determine the user's superficial pigmentation score.",
    parameters: {
      type: 'object',
      properties: {
        scoring_criteria: {
          type: 'object',
          description: 'Embedded superficial pigmentation scoring logic and thresholds',
          default: {
            superficial_pigmentation_scoring: {
              metadata: {
                device: 'Bitmoji A5 Analyzer',
                lighting_modes_used: ['brown', 'UV', 'white'],
                regions_analyzed: ['forehead', 'cheeks', 'nose', 'chin'],
              },

              parameter_weights: {
                coverage_area: 0.4,
                color_intensity: 0.3,
                homogeneity: 0.2,
                lesion_border_definition: 0.1,
              },

              threshold_guidelines: {
                coverage_area_percent: {
                  minimal: '<5%',
                  mild: '5-15%',
                  moderate: '15-30%',
                  marked: '30-50%',
                  severe: '>50%',
                },
                mean_intensity_index: {
                  light: '<0.35',
                  moderate: '0.35-0.55',
                  dark: '0.55-0.75',
                  very_dark: '>0.75',
                },
                contrast_uniformity_index: {
                  even: '>0.8',
                  moderate_mottling: '0.6-0.8',
                  uneven: '<0.6',
                },
                depth_indicator_ratio: {
                  epidermal: '<0.25',
                  mixed: '0.25-0.5',
                  dermal: '>0.5',
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
                    coverage_area: '5-15%',
                    mean_intensity_index: '0.35-0.45',
                    contrast_uniformity_index: '0.7-0.85',
                  },
                  visual_flags: [
                    'Faint macules in malar or forehead region',
                    'Minimal mottling in UV',
                  ],
                },
                {
                  score: 3,
                  label: 'Moderate',
                  criteria: {
                    coverage_area: '15-30%',
                    mean_intensity_index: '0.45-0.55',
                    contrast_uniformity_index: '0.6-0.8',
                  },
                  visual_flags: [
                    'Visible coalescing patches across cheeks or temples',
                    'Higher pigment density in brown & UV modes',
                  ],
                },
                {
                  score: 4,
                  label: 'Marked',
                  criteria: {
                    coverage_area: '30-50%',
                    mean_intensity_index: '0.55-0.7',
                    contrast_uniformity_index: '0.5-0.7',
                  },
                  visual_flags: [
                    'Confluent dark patches spanning multiple regions',
                    'Uneven tone with visible dermal component',
                  ],
                },
                {
                  score: 5,
                  label: 'Severe',
                  criteria: {
                    coverage_area: '>50%',
                    mean_intensity_index: '>0.7',
                    contrast_uniformity_index: '<0.5',
                  },
                  visual_flags: [
                    'Generalized, dense pigmentation',
                    'Deep mixed or dermal involvement under UV',
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
                    description:
                      'Quantifies difference between left and right facial pigmentation load.',
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
                      { if: 'pigmentation_depth_index < 0.25', then: 'Superficial (Epidermal)' },
                      { if: '0.25-0.5', then: 'Mixed' },
                      { if: '>0.5', then: 'Deep (Dermal)' },
                    ],
                  },
                  distribution_type: {
                    rules: [
                      { if: 'distribution_pattern_index < 0.3', then: 'Diffuse' },
                      { if: '0.3-0.6', then: 'Patchy' },
                      { if: '>0.6', then: 'Focal' },
                    ],
                  },
                },
              },

              decision_logic: {
                description:
                  'Compute pigmentation indices and output diagnostic data for downstream treatment module.',
                steps: [
                  '1. Measure coverage_area_percent, mean_intensity_index, and contrast_uniformity_index from brown and white modes.',
                  '2. Calculate pigmentation_depth_index and UV_enhancement_ratio from UV:brown ratio.',
                  '3. Compute distribution_pattern_index from region-wise variance.',
                  '4. Compute asymmetry_index from left vs right intensity difference.',
                  '5. Derive global_score using weighted aggregation of parameters.',
                  '6. Output integer score (1-5) plus backend diagnostic indices for treatment logic.',
                ],
                output_format: {
                  final_score: 'integer (1-5)',
                  confidence_score: 'float (0-1)',
                  region_breakdown: 'dictionary of scores per region',
                  backend_details: {
                    pigmentation_depth_index: 'float (0-1)',
                    distribution_pattern_index: 'float (0-1)',
                    asymmetry_index: 'float (0-1)',
                    uv_enhancement_ratio: 'float (0-1)',
                    depth_type: 'Superficial / Mixed / Deep',
                    distribution_type: 'Diffuse / Patchy / Focal',
                  },
                },
                single_output_mode: true,
              },
            },
          },
        },
      },
      required: ['scoring_criteria'],
    },
  },
  {
    type: 'function',
    name: 'analyze_acne_grade_logic',
    description:
      'Analyzes facial acne severity using multi-light imaging and lesion classification according to Acne Grading v2.3 standards. Returns final acne grade (0–4), confidence score, severity index, and region-level details.',
    parameters: {
      type: 'object',
      properties: {
        analyze_acne_grade: {
          type: 'object',
          description: 'Embedded analyze acne grade scoring logic and thresholds',
          default: {
            acne_grading: {
              metadata: {
                device: 'Bitmoji A5 Analyzer',
                lighting_modes_used: ['white', 'UV', 'PPL'],
                regions_analyzed: ['forehead', 'cheeks', 'chin', 'nose', 'jawline'],
                version: '2.3',
              },

              lesion_type_weights: {
                open_comedone: 0.15,
                closed_comedone: 0.15,
                papule: 0.25,
                pustule: 0.25,
                nodule: 0.2,
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
                  grade_1: '3–10',
                  grade_2: '11–25',
                  grade_3: '26–50',
                  grade_4: '>50 or presence of nodules/cysts',
                },
                inflammatory_ratio: {
                  low: '<0.25',
                  moderate: '0.25–0.5',
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
                    total_lesion_count: '3–10',
                    inflammatory_ratio: '<0.25',
                  },
                  visual_flags: [
                    'Few comedones visible in T-zone',
                    'Scattered fluorescence dots in UV',
                  ],
                },
                {
                  grade: '2 - Mild',
                  criteria: {
                    total_lesion_count: '11–25',
                    inflammatory_ratio: '0.25–0.4',
                  },
                  visual_flags: [
                    'Scattered papules/pustules without nodules',
                    'Localized inflammation, minimal erythema',
                  ],
                },
                {
                  grade: '3 - Moderate',
                  criteria: {
                    total_lesion_count: '26–50',
                    inflammatory_ratio: '0.4–0.6',
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
                description:
                  'Weighted scoring for lesion count, inflammation, and region distribution.',
                steps: [
                  '1. Detect lesion types and counts per region from white and UV modes.',
                  '2. Calculate inflammatory_ratio = (papules + pustules + nodules) / total_lesions.',
                  '3. Compute region_score = Σ(lesion_count_region × region_weight).',
                  '4. Calculate weighted_grade_score = Σ(lesion_type_count × lesion_type_weight).',
                  '5. Aggregate region_score and weighted_grade_score → global_severity_index (0–1).',
                  '6. Map global_severity_index to final grade thresholds.',
                  '7. Output single final grade with confidence and region breakdown.',
                ],
                output_format: {
                  final_grade: 'integer (0–4)',
                  confidence_score: 'float (0–1)',
                  global_severity_index: 'float (0–1)',
                  region_breakdown: 'dictionary of lesion counts and local grades',
                },
              },
            },
          },
        },
      },
      required: ['analyze_acne_grade'],
    },
  },
  {
    type: 'function',
    name: 'analyze_texture_pores_grade_logic',
    description:
      'Analyzes skin texture and pore condition using multi-light imaging (white, PPL, and XPL) according to Texture & Pores Grading standards. Computes pore diameter ratio, texture uniformity, and reflection evenness to return a final grade (0–4) with confidence and global texture index.',
    parameters: {
      type: 'object',
      properties: {
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
                version: '2.0',
              },

              parameter_weights: {
                pore_diameter_ratio: 0.4,
                texture_uniformity_index: 0.35,
                light_reflection_evenness: 0.15,
                roughness_variance: 0.1,
              },

              threshold_guidelines: {
                pore_diameter_ratio: {
                  invisible: '<1.1× baseline',
                  fine: '1.1–1.3×',
                  moderate: '1.3–1.6×',
                  large: '1.6–2.0×',
                  very_large: '>2.0×',
                },
                texture_uniformity_index: {
                  smooth: '>0.85',
                  slightly_uneven: '0.7–0.85',
                  rough: '0.5–0.7',
                  coarse: '<0.5',
                },
                light_reflection_evenness: {
                  even: '>0.8',
                  minor_variation: '0.6–0.8',
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
                    pore_diameter_ratio: '1.1–1.3',
                    texture_uniformity_index: '0.7–0.85',
                  },
                  visual_flags: [
                    'Fine pores on nose or medial cheeks only',
                    'Minor unevenness in polarized light',
                  ],
                },
                {
                  grade: '2 - Mild',
                  criteria: {
                    pore_diameter_ratio: '1.3–1.6',
                    texture_uniformity_index: '0.6–0.8',
                  },
                  visual_flags: [
                    'Visible pores extending laterally',
                    'Diffuse mild roughness or dullness',
                  ],
                },
                {
                  grade: '3 - Moderate',
                  criteria: {
                    pore_diameter_ratio: '1.6–2.0',
                    texture_uniformity_index: '0.5–0.7',
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
                  '5. Combine all regions (weighted equally or per region_weights if defined) → global_texture_index (0–1).',
                  '6. Map global_texture_index to grade thresholds.',
                  '7. Select grade with highest confidence; output single final grade.',
                ],
                output_format: {
                  final_grade: 'integer (0–4)',
                },
                single_output_mode: true,
              },
            },
          },
        },
      },
      required: ['analyze_texture_pores_grade'],
    },
  },
  {
    type: 'function',
    name: 'analyze_wrinkles_grade_logic',
    description:
      'Analyzes superficial wrinkle severity using multi-light imaging (PPL, XPL, and white modes) according to Wrinkles Grading standards. Computes wrinkle depth, density, and visibility indices to output a final grade (1–4) with confidence and global wrinkle index.',
    parameters: {
      type: 'object',
      properties: {
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
                  mild: '0.25–0.45',
                  moderate: '0.45–0.65',
                  severe: '>0.65',
                },
                wrinkle_density_index: {
                  very_mild: '<0.2',
                  mild: '0.2–0.4',
                  moderate: '0.4–0.6',
                  severe: '>0.6',
                },
                contrast_visibility_index: {
                  low: '>0.8',
                  moderate: '0.6–0.8',
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
                    wrinkle_depth_index: '0.25–0.45',
                    wrinkle_density_index: '0.2–0.4',
                  },
                  visual_flags: [
                    'Multiple fine superficial wrinkles visible at rest',
                    'Localized clusters on forehead or peri-orbital areas',
                  ],
                },
                {
                  grade: '3 - Moderate',
                  criteria: {
                    wrinkle_depth_index: '0.45–0.65',
                    wrinkle_density_index: '0.4–0.6',
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
                description:
                  'Compute wrinkle indices per region, aggregate to a single overall grade.',
                steps: [
                  '1. Use XPL mode to measure wrinkle_depth_index (pixel contrast slope and shadow gradient).',
                  '2. Use PPL mode to compute wrinkle_density_index (line count per cm²).',
                  '3. Derive contrast_visibility_index from white-mode luminance difference between wrinkle and background skin.',
                  '4. Combine all indices using parameter_weights to form a global_wrinkle_index (0–1).',
                  '5. Map global_wrinkle_index to grade thresholds (1–4).',
                  '6. Output only the highest-confidence single grade.',
                ],
                output_format: {
                  final_grade: 'integer (1–4)',
                },
                single_output_mode: true,
              },
            },
          },
        },
      },
      required: ['analyze_wrinkles_grade'],
    },
  },
  {
    type: 'function',
    name: 'analyze_jawline_sagging_grade_logic',
    description:
      'Analyzes jawline sagging severity using geometric and textural parameters under white, PPL, and XPL lighting according to Jawline Sagging Grading standards. Calculates mandibular angle, contour smoothness, skin laxity, and shadow intensity to output a final grade (1–4) with confidence and sagging index.',
    parameters: {
      type: 'object',
      properties: {
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
                  very_mild: '<5°',
                  mild: '5–10°',
                  moderate: '10–15°',
                  severe: '>15°',
                },
                contour_smoothness_index: {
                  sharp: '>0.85',
                  slightly_blunted: '0.7–0.85',
                  moderate_blunting: '0.5–0.7',
                  severe_irregularity: '<0.5',
                },
                skin_laxity_index: {
                  firm: '<0.25',
                  mild: '0.25–0.45',
                  moderate: '0.45–0.65',
                  severe: '>0.65',
                },
                shadow_intensity_ratio: {
                  low: '<0.3',
                  moderate: '0.3–0.6',
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
                    mandibular_angle_change_deg: '5–10',
                    contour_smoothness_index: '0.7–0.85',
                    skin_laxity_index: '0.25–0.45',
                  },
                  visual_flags: [
                    'Slight blunting of jawline definition',
                    'Early jowl visibility at mandibular angle',
                  ],
                },
                {
                  grade: '3 - Moderate',
                  criteria: {
                    mandibular_angle_change_deg: '10–15',
                    contour_smoothness_index: '0.5–0.7',
                    skin_laxity_index: '0.45–0.65',
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
                  '6. Combine all parameters using defined weights to form global_sagging_index (0–1).',
                  '7. Map global_sagging_index to grade thresholds (1–4).',
                  '8. Output only the single grade with highest confidence.',
                ],
                output_format: {
                  final_grade: 'integer (1–4)',
                },
                single_output_mode: true,
              },
            },
          },
        },
      },
      required: ['analyze_jawline_sagging_grade'],
    },
  },
  {
    type: 'function',
    name: 'analyze_skin_hydration_logic',
    description:
      'Analyzes skin hydration levels using multi-mode imaging (white, PPL, and red light) according to Skin Hydration Grading standards. Computes reflectance, microline, diffusion, and luminance indices to output a final hydration score (0–3) with confidence and global hydration index.',
    parameters: {
      type: 'object',
      properties: {
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
                  excellent: '0.65–0.80',
                  mildly_low: '0.50–0.65',
                  low: '0.35–0.50',
                  very_low: '<0.35',
                },
                microline_density_index: {
                  excellent: '<0.15',
                  mild: '0.15–0.25',
                  moderate: '0.25–0.35',
                  severe: '>0.35',
                },
                subsurface_diffusion_index: {
                  high: '>0.70',
                  moderate: '0.55–0.70',
                  low: '<0.55',
                },
                color_luminance_uniformity: {
                  even: '>0.8',
                  slightly_patchy: '0.6–0.8',
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
                    surface_reflectance_index: '0.50–0.65',
                    microline_density_index: '0.15–0.25',
                  },
                  visual_flags: [
                    'Slight dullness, reduced glow',
                    'Faint fine lines visible under PPL',
                  ],
                },
                {
                  score: 2,
                  label: 'Moderate Dehydration',
                  criteria: {
                    surface_reflectance_index: '0.35–0.50',
                    microline_density_index: '0.25–0.35',
                    subsurface_diffusion_index: '0.55–0.70',
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
                  '5. Combine indices using parameter_weights → global_hydration_index (0–1).',
                  '6. Map global_hydration_index to score thresholds (0–3).',
                  '7. Output only the single score with highest confidence.',
                ],
                output_format: {
                  final_score: 'integer (0–3)',
                },
                single_output_mode: true,
              },
            },
          },
        },
      },
      required: ['analyze_skin_hydration'],
    },
  },
  {
    type: 'function',
    name: 'analyze_skin_sebum_content_logic',
    description:
      'Analyzes skin sebum level and distribution using multi-light imaging (white, UV, and PPL modes) according to Sebum Content Grading standards. Computes sebum quantity and distribution indices to output a final sebum score (0–3) with confidence and global sebum index.',
    parameters: {
      type: 'object',
      properties: {
        analyze_skin_sebum_content: {
          type: 'object',
          description:
            'Embedded sebum content grading logic, thresholds, parameter weights, and computation flow based on Bitmoji A5 Analyzer Sebum Content Grading standard.',
          default: {
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
                  low_normal: '0.3–0.5',
                  moderate: '0.5–0.7',
                  high: '>0.7',
                },
                porphyrin_fluorescence_index: {
                  none: '<20',
                  few: '20–40',
                  moderate: '40–60',
                  dense: '>60',
                },
                regional_uniformity_index: {
                  balanced: '<0.2',
                  T_zone_dominant: '0.2–0.4',
                  generalized: '>0.4',
                },
              },
              sub_indices: {
                sebum_quantity_index: {
                  description:
                    'Represents overall sebum output based on shine and porphyrin fluorescence.',
                  calculation: [
                    '1. Normalize shine_reflectance_index (white mode) to 0–1 scale.',
                    '2. Normalize porphyrin_fluorescence_index (UV mode) to 0–1 scale.',
                    '3. Compute sebum_quantity_index = (0.55 × shine_reflectance) + (0.45 × porphyrin_fluorescence).',
                  ],
                  output_range: '0 (dry) → 1 (oily)',
                },
                sebum_distribution_index: {
                  description: 'Represents how evenly sebum is spread across facial regions.',
                  calculation: [
                    '1. Measure sebum quantity per region (forehead, nose, cheeks, chin).',
                    '2. Compute mean absolute deviation from global mean.',
                    '3. Normalize to 0–1 range → higher = more uneven.',
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
                  visual_flags: [
                    'Matte skin, no visible shine',
                    'No porphyrin fluorescence in UV mode',
                  ],
                },
                {
                  score: 1,
                  label: 'Low-Normal Sebum',
                  criteria: {
                    sebum_quantity_index: '0.3–0.5',
                    sebum_distribution_index: '<0.3',
                  },
                  visual_flags: ['Minimal T-zone shine', 'Few scattered porphyrins'],
                },
                {
                  score: 2,
                  label: 'Moderate / Normal-Oily',
                  criteria: {
                    sebum_quantity_index: '0.5–0.7',
                    sebum_distribution_index: '0.2–0.4',
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
                  visual_flags: [
                    'Diffuse oily sheen across face',
                    'Dense UV porphyrins and enlarged pores',
                  ],
                },
              ],
              decision_logic: {
                description:
                  'Compute dual backend indices (quantity & distribution), merge into single visible score for report.',
                steps: [
                  '1. Calculate sebum_quantity_index using shine_reflectance and porphyrin_fluorescence inputs.',
                  '2. Calculate sebum_distribution_index using per-region sebum variance.',
                  '3. Combine both: global_sebum_index = (0.8 × sebum_quantity_index) + (0.2 × sebum_distribution_index).',
                  '4. Map global_sebum_index to discrete patient-visible score thresholds (0–3).',
                  '5. Retain both sub-indices for backend analytics and treatment planning.',
                  '6. Output one visible score for the patient report.',
                ],
                output_format: {
                  final_score: 'integer (0–3)',
                  confidence_score: 'float (0–1)',
                  global_sebum_index: 'float (0–1)',
                  backend_details: {
                    sebum_quantity_index: 'float (0–1)',
                    sebum_distribution_index: 'float (0–1)',
                  },
                },
                single_output_mode: true,
              },
            },
          },
        },
      },
      required: ['analyze_skin_sebum_content'],
    },
  },
  {
    type: 'function',
    name: 'analyze_skin_sensitivity_logic',
    description:
      'Analyzes skin sensitivity by quantifying redness, vascular prominence, barrier integrity, and surface texture using red, white, and PPL imaging. Outputs a single sensitivity score (0–3) with backend indices for erythema, vascular, barrier, and flaking parameters.',
    parameters: {
      type: 'object',
      properties: {
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
                  mild: '0.25–0.45',
                  moderate: '0.45–0.65',
                  severe: '>0.65',
                },
                vascular_pattern_index: {
                  none: '<0.2',
                  diffuse: '0.2–0.4',
                  telangiectatic: '0.4–0.6',
                  prominent: '>0.6',
                },
                barrier_uniformity_index: {
                  intact: '>0.8',
                  slightly_disrupted: '0.6–0.8',
                  disrupted: '<0.6',
                },
                flaking_texture_index: {
                  smooth: '<0.2',
                  fine_flakes: '0.2–0.4',
                  coarse_flakes: '0.4–0.6',
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
                    erythema_intensity_index: '0.25–0.45',
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
                    erythema_intensity_index: '0.45–0.65',
                    vascular_pattern_index: '0.3–0.6',
                    barrier_uniformity_index: '0.6–0.8',
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
              decision_logic: {
                description:
                  'Quantify redness, vascular prominence, and barrier integrity, then output single score with backend detail.',
                steps: [
                  '1. Compute erythema_intensity_index from red and white modes.',
                  '2. Detect vascular patterns via PPL edge filtering to derive vascular_pattern_index.',
                  '3. Assess barrier_uniformity_index from reflectance variance.',
                  '4. Evaluate flaking_texture_index from high-frequency white-mode texture.',
                  '5. Combine weighted indices to calculate global_sensitivity_index (0–1).',
                  '6. Map global_sensitivity_index to discrete score thresholds (0–3).',
                  '7. Determine sensitivity_pattern classification for backend treatment mapping.',
                ],
                output_format: {
                  final_score: 'integer (0–3)',
                },
                single_output_mode: true,
              },
            },
          },
        },
      },
      required: ['analyze_skin_sensitivity'],
    },
  },
  {
    type: 'function',
    name: 'analyze_barrier_health_logic',
    description:
      'Analyzes the skin barrier integrity using multi-light imaging (white, PPL, UV). Evaluates surface texture, hydration signals, redness intensity, and flaking visibility to produce a single barrier health score (0–3) along with backend parameters for dermatologist insight.',
    parameters: {
      type: 'object',
      properties: {
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
                  mild_roughness: '0.7–0.85',
                  moderate_roughness: '0.55–0.7',
                  poor: '<0.55',
                },
                hydration_signal_index: {
                  well_hydrated: '>0.65',
                  slightly_low: '0.45–0.65',
                  low: '<0.45',
                },
                redness_intensity_index: {
                  none: '<0.25',
                  mild: '0.25–0.45',
                  moderate: '0.45–0.65',
                  severe: '>0.65',
                },
                flaking_visibility_index: {
                  none: '<0.2',
                  fine_flakes: '0.2–0.4',
                  coarse_flakes: '0.4–0.6',
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
                    surface_texture_uniformity: '0.7–0.85',
                    hydration_signal_index: '0.45–0.65',
                    redness_intensity_index: '0.25–0.45',
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
                    surface_texture_uniformity: '0.55–0.7',
                    hydration_signal_index: '<0.45',
                    redness_intensity_index: '0.45–0.65',
                    flaking_visibility_index: '0.3–0.5',
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
                  '5. Combine all weighted indices → global_barrier_index (0–1).',
                  '6. Map to discrete barrier score (0–3).',
                ],
                output_format: {
                  final_score: 'integer (0–3)',
                },
                single_output_mode: true,
              },
            },
          },
        },
      },
      required: ['analyze_barrier_health'],
    },
  },
  {
    type: 'function',
    name: 'analyze_periorbital_health_logic',
    description:
      'Evaluates peri-orbital (under-eye) health by grading puffiness, hollowness, pigmentation, and vascularity across four severity levels (None–Severe). Designed for Bitmoji A5 Analyzer peri-orbital module integration.',
    parameters: {
      type: 'object',
      properties: {
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
      },
      required: ['analyze_periorbital_health'],
    },
  },
  {
    type: 'function',
    name: 'analyze_lip_pigmentation_logic',
    description:
      'Analyzes lip pigmentation characteristics, detects presence and severity, and identifies potential causes such as sun exposure, smoking, genetics, or dehydration using Bitmoji A5 Analyzer lip imaging module.',
    parameters: {
      type: 'object',
      properties: {
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
      },
      required: ['analyze_lip_pigmentation'],
    },
  },
  {
    type: 'function',
    name: 'analyze_vascularity_redness_grading_logic',
    description:
      'Performs vascularity and redness profiling using red, white, and PPL imaging. Quantifies erythema intensity, vascular density, and color uniformity to classify vascular prominence and redness severity (0–3) according to Bitmoji A5 Analyzer standards.',
    parameters: {
      type: 'object',
      properties: {
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
                  mild: '0.25–0.45',
                  moderate: '0.45–0.65',
                  severe: '>0.65',
                },
                vascular_pattern_density: {
                  none: '<0.2',
                  mild_capillary: '0.2–0.4',
                  moderate_diffuse: '0.4–0.6',
                  dense_telangiectatic: '>0.6',
                },
                distribution_symmetry_index: {
                  balanced: '<0.25',
                  slightly_asymmetric: '0.25–0.45',
                  marked_asymmetry: '>0.45',
                },
                color_uniformity_index: {
                  even: '>0.8',
                  patchy: '0.6–0.8',
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
                    erythema_intensity_index: '0.25–0.45',
                    vascular_pattern_density: '0.2–0.4',
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
                    erythema_intensity_index: '0.45–0.65',
                    vascular_pattern_density: '0.4–0.6',
                    color_uniformity_index: '0.6–0.8',
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
              decision_logic: {
                description: 'Quantify redness and vascular prominence to assign a 0–3 grade.',
                steps: [
                  '1. Analyze red and white mode histograms to compute erythema_intensity_index.',
                  '2. Detect linear vascular features in PPL/red modes → vascular_pattern_density.',
                  '3. Compute symmetry and color uniformity indices.',
                  '4. Combine weighted indices into global_vascularity_index (0–1).',
                  '5. Map to discrete score thresholds (0–3).',
                ],
                output_format: {
                  final_score: 'integer (0–3)',
                  confidence_score: 'float (0–1)',
                  global_vascularity_index: 'float (0–1)',
                  backend_details: {
                    erythema_intensity_index: 'float (0–1)',
                    vascular_pattern_density: 'float (0–1)',
                    distribution_symmetry_index: 'float (0–1)',
                    color_uniformity_index: 'float (0–1)',
                    vascular_pattern_type: 'Minimal / Diffuse / Telangiectatic',
                  },
                },
                single_output_mode: true,
              },
            },
          },
        },
      },
      required: ['analyze_vascularity_redness_grading'],
    },
  },
  {
    type: 'function',
    name: 'analyze_under_eye_vascularity_structural_shadows_logic',
    description:
      'Analyzes under-eye darkness to differentiate between vascular pigmentation and structural hollowing. Grades severity based on color tone, vascular visibility, and shadow depth under UV and visible light modes using Bitmoji A5 Analyzer imaging.',
    parameters: {
      type: 'object',
      properties: {
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
      },
      required: ['analyze_under_eye_vascularity_structural_shadows'],
    },
  },
  {
    type: 'function',
    name: 'analyze_skin_luminosity_glow_index_logic',
    description:
      'Analyzes overall skin luminosity and glow levels using multi-light imaging to assess surface reflectance, luminance, subsurface diffusion, and shadow contrast. Generates a Glow Index (0–3) with visual and quantitative parameters for aesthetic diagnostics.',
    parameters: {
      type: 'object',
      properties: {
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
                  moderate: '0.5–0.7',
                  high: '0.7–0.85',
                  very_high: '>0.85',
                },
                color_luminance_index: {
                  dull: '<0.4',
                  mild: '0.4–0.6',
                  bright: '0.6–0.75',
                  radiant: '>0.75',
                },
                subsurface_diffusion_index: {
                  low: '<0.5',
                  moderate: '0.5–0.7',
                  high: '>0.7',
                },
                shadow_contrast_index: {
                  harsh: '>0.5',
                  moderate: '0.3–0.5',
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
                    surface_reflectance_uniformity: '0.5–0.7',
                    color_luminance_index: '0.4–0.6',
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
                    surface_reflectance_uniformity: '0.7–0.85',
                    color_luminance_index: '0.6–0.75',
                    subsurface_diffusion_index: '0.5–0.7',
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
              decision_logic: {
                description:
                  'Combine reflectance, luminance, diffusion, and contrast indices into one glow score.',
                steps: [
                  '1. Compute surface_reflectance_uniformity from white mode brightness map.',
                  '2. Extract color_luminance_index from LAB L-channel normalization.',
                  '3. Derive subsurface_diffusion_index from brown/PPL red-channel spread.',
                  '4. Calculate shadow_contrast_index from brightness edge variance.',
                  '5. Combine weighted indices into global_luminosity_index (0–1).',
                  '6. Map to discrete glow score (0–3).',
                ],
                output_format: {
                  final_score: 'integer (0–3)',
                },
                single_output_mode: true,
              },
            },
          },
        },
      },
      required: ['analyze_skin_luminosity_glow_index'],
    },
  },
  {
    type: 'function',
    name: 'analyze_comedonal_density_logic',
    description:
      'Analyzes comedonal lesion density, clustering, and porphyrin fluorescence under multi-light imaging to quantify severity of blackheads/whiteheads. Generates a Comedonal Density Score (0–3) for dermatological and aesthetic assessment.',
    parameters: {
      type: 'object',
      properties: {
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
                  mild: '0.05–0.15 (2–5 lesions / cm²)',
                  moderate: '0.15–0.3 (6–10 lesions / cm²)',
                  severe: '>0.3 (>10 lesions / cm²)',
                },
                comedone_cluster_index: {
                  isolated: '<0.2',
                  scattered: '0.2–0.4',
                  localized_clusters: '0.4–0.6',
                  confluent_clusters: '>0.6',
                },
                porphyrin_overlap_index: {
                  none: '<0.2',
                  partial: '0.2–0.5',
                  strong: '>0.5',
                },
                texture_contrast_index: {
                  smooth: '<0.3',
                  mild_irregularity: '0.3–0.5',
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
                    comedone_count_density: '0.05–0.15',
                    comedone_cluster_index: '0.2–0.4',
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
                    comedone_count_density: '0.15–0.3',
                    comedone_cluster_index: '0.4–0.6',
                    porphyrin_overlap_index: '0.2–0.5',
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
              decision_logic: {
                description: 'Quantify comedone density and clustering to produce a 0–3 score.',
                steps: [
                  '1. Detect and count comedones using brightness contrast and circular pattern filters in PPL/white mode.',
                  '2. Compute comedone_count_density per region (lesions/cm²).',
                  '3. Calculate comedone_cluster_index from inter-lesion proximity mapping.',
                  '4. Measure porphyrin_overlap_index from UV fluorescence overlay.',
                  '5. Compute weighted average to form global_comedonal_index (0–1).',
                  '6. Map global_comedonal_index to discrete severity score (0–3).',
                ],
                output_format: {
                  final_score: 'integer (0–3)',
                },
                single_output_mode: true,
              },
            },
          },
        },
      },
      required: ['analyze_comedonal_density_grading'],
    },
  },
  {
    type: 'function',
    name: 'analyze_texture_irregularities_beyond_pores_logic',
    description:
      'Analyzes microtexture irregularities beyond visible pore structures using multi-light imaging. Quantifies variance, undulation depth, and reflection loss to determine surface evenness and scarring severity (0–3 scale).',
    parameters: {
      type: 'object',
      properties: {
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
                  mild: '0.3–0.5',
                  moderate: '0.5–0.7',
                  severe: '>0.7',
                },
                surface_gradient_irregularity: {
                  flat: '<0.25',
                  slightly_undulated: '0.25–0.45',
                  moderately_undulated: '0.45–0.65',
                  deeply_undulated: '>0.65',
                },
                shadow_depth_index: {
                  none: '<0.2',
                  shallow: '0.2–0.4',
                  moderate: '0.4–0.6',
                  deep: '>0.6',
                },
                diffuse_reflection_loss_index: {
                  minimal: '<0.25',
                  moderate: '0.25–0.45',
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
                    microtexture_variance_index: '0.3–0.5',
                    surface_gradient_irregularity: '0.25–0.45',
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
                    microtexture_variance_index: '0.5–0.7',
                    surface_gradient_irregularity: '0.45–0.65',
                    shadow_depth_index: '0.3–0.5',
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
              decision_logic: {
                description: 'Quantify and classify textural irregularities beyond pore size.',
                steps: [
                  '1. Compute microtexture_variance_index from PPL variance map.',
                  '2. Compute surface_gradient_irregularity from gradient-normal field.',
                  '3. Measure shadow_depth_index using oblique white-mode contrast analysis.',
                  '4. Calculate diffuse_reflection_loss_index from PPL reflectance data.',
                  '5. Combine all indices using parameter_weights → global_texture_irregularity_index (0–1).',
                  '6. Map to discrete severity score (0–3).',
                ],
                output_format: {
                  final_score: 'integer (0–3)',
                },
                single_output_mode: true,
              },
            },
          },
        },
      },
      required: ['analyze_texture_irregularities_beyond_pores'],
    },
  },
  {
    type: 'function',
    name: 'analyze_regional_oil_distribution_logic',
    description:
      'Analyzes sebum and oil distribution patterns across facial regions (forehead, nose, cheeks, chin) using Bitmoji A5 Analyzer imaging. Computes indices for regional variance, porphyrin distribution, and shine symmetry to classify oil distribution patterns (balanced, T-zone, mixed, global).',
    parameters: {
      type: 'object',
      properties: {
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
                  T_zone_predominant: '0.2–0.4',
                  mixed: '0.4–0.6',
                  global: '>0.6',
                },
                porphyrin_distribution_index: {
                  uniform: '<0.25',
                  T_zone_focused: '0.25–0.45',
                  mixed: '0.45–0.65',
                  diffuse: '>0.65',
                },
                shine_symmetry_index: {
                  balanced: '<0.25',
                  slightly_asymmetric: '0.25–0.45',
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
                    regional_variance_index: '0.2–0.4',
                    porphyrin_distribution_index: '0.25–0.45',
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
                    regional_variance_index: '0.4–0.6',
                    porphyrin_distribution_index: '0.45–0.65',
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
              decision_logic: {
                description: 'Quantify oil distribution pattern and assign 0–3 score.',
                steps: [
                  '1. Measure regional reflectance ratios from white light images (forehead, nose, cheeks, chin).',
                  '2. Compute regional_variance_index across regions.',
                  '3. Derive porphyrin_distribution_index from UV fluorescence map.',
                  '4. Calculate shine_symmetry_index across bilateral facial halves.',
                  '5. Combine all using parameter_weights → global_oil_distribution_index (0–1).',
                  '6. Map to discrete severity score (0–3).',
                ],
                output_format: {
                  final_score: 'integer (0–3)',
                },
                single_output_mode: true,
              },
            },
          },
        },
      },
      required: ['analyze_regional_oil_distribution'],
    },
  },
]

export const imageAnalysisFunctions = [
  {
    type: 'function',
    name: 'affected_area_image_selector_logic',
    description:
      'Determines the most suitable diagnostic image per parameter for Bitmoji A5 Analyzer reports. Automatically selects preferred lighting mode with fallback handling and defines global image inclusion policies. Ensures raw diagnostic visuals without overlays for consistent reporting.',
    parameters: {
      type: 'object',
      properties: {
        affected_area_image_selector: {
          type: 'object',
          description:
            'Embedded image selection logic defining per-parameter lighting preferences, fallback order, and output formatting for Bitmoji A5 Analyzer report generation.',
          default: {
            affected_area_image_selector: {
              description:
                'Defines the most relevant diagnostic image for each skin parameter for reporting purposes. No overlays are used; raw diagnostic images are displayed in the report.',
              selection_logic: {
                rules: [
                  {
                    parameter: 'skin_type',
                    preferred_lighting_mode: 'white',
                    fallback_mode: 'PPL',
                    reason:
                      'White light provides surface texture and shine contrast required for overall skin type determination.',
                  },
                  {
                    parameter: 'superficial_pigmentation',
                    preferred_lighting_mode: 'brown',
                    fallback_mode: 'UV',
                    reason:
                      'Brown light provides the clearest visualization of superficial melanin and mottled tone.',
                  },
                  {
                    parameter: 'Visual_acne_grading',
                    preferred_lighting_mode: '',
                    fallback_mode: '',
                    reason: '',
                  },
                  {
                    parameter: 'texture_open_pores',
                    preferred_lighting_mode: 'PPL',
                    fallback_mode: 'white',
                    reason:
                      'PPL mode provides highest pore edge contrast and textural topography for accurate detection.',
                  },
                  {
                    parameter: 'superficial_wrinkles',
                    preferred_lighting_mode: 'PPL',
                    fallback_mode: 'white',
                    reason:
                      'Polarized mode highlights line depth and surface light scatter for fine-line visualization.',
                  },
                  {
                    parameter: 'jawline_sagging',
                    preferred_lighting_mode: 'white',
                    fallback_mode: 'PPL',
                    reason:
                      'White mode provides the clearest structural contour definition and shadow-based sagging detection.',
                  },
                  {
                    parameter: 'skin_hydration',
                    preferred_lighting_mode: 'white',
                    fallback_mode: 'PPL',
                    reason:
                      'White light reflectance is inversely proportional to hydration level; smooth hydrated skin reflects evenly.',
                  },
                  {
                    parameter: 'sebum_content',
                    preferred_lighting_mode: 'white',
                    fallback_mode: 'PPL',
                    reason:
                      'White light best visualizes surface shine intensity and overall oil reflectance.',
                  },
                  {
                    parameter: 'skin_sensitivity',
                    preferred_lighting_mode: 'red',
                    fallback_mode: 'white',
                    reason:
                      'Red channel enhances subtle erythema and irritation not visible in other modes.',
                  },
                  {
                    parameter: 'barrier_health',
                    preferred_lighting_mode: 'PPL',
                    fallback_mode: 'white',
                    reason:
                      'PPL highlights micro-flaking, surface unevenness, and hydration-linked reflection consistency.',
                  },
                  {
                    parameter: 'peri_orbital_health',
                    preferred_lighting_mode: '',
                    fallback_mode: '',
                    reason: '',
                  },
                  {
                    parameter: 'lip_pigmentation',
                    preferred_lighting_mode: '',
                    fallback_mode: '',
                    reason: '',
                  },
                  {
                    parameter: 'vascularity_redness',
                    preferred_lighting_mode: 'red',
                    fallback_mode: 'PPL',
                    reason:
                      'Red mode captures hemoglobin-related redness and telangiectatic patterns accurately.',
                  },
                  {
                    parameter: 'under_eye_vascularity_vs_structural_shadows',
                    preferred_lighting_mode: '',
                    fallback_mode: '',
                    reason: '',
                  },
                  {
                    parameter: 'skin_luminosity_glow',
                    preferred_lighting_mode: 'white',
                    fallback_mode: 'brown',
                    reason:
                      'White captures surface reflection uniformity, while brown mode supports subsurface diffusion analysis.',
                  },
                  {
                    parameter: 'comedonal_density',
                    preferred_lighting_mode: 'UV',
                    fallback_mode: 'PPL',
                    reason:
                      'UV mode identifies porphyrin fluorescence around comedones; PPL supports morphology detection.',
                  },
                  {
                    parameter: 'texture_irregularities_beyond_pores',
                    preferred_lighting_mode: 'PPL',
                    fallback_mode: 'brown',
                    reason:
                      'PPL highlights micro undulations and scars, while brown assists in uneven tone mapping.',
                  },
                  {
                    parameter: 'regional_oil_distribution',
                    preferred_lighting_mode: 'UV',
                    fallback_mode: 'white',
                    reason:
                      'UV highlights porphyrin fluorescence patterns that correspond to T-zone and global oil activity.',
                  },
                ],
              },
              output_format: {
                affected_area_image: '',
                use_overlay: false,
              },
              global_rules: {
                use_overlay: false,
                include_images_in_all_sections: true,
                fallback_policy: 'If preferred lighting mode is unavailable, use fallback_mode.',
                selection_priority: [
                  'preferred_lighting_mode',
                  'fallback_mode',
                  'first_available_image',
                ],
              },
            },
          },
        },
      },
      required: ['affected_area_image_selector'],
    },
  },
]
