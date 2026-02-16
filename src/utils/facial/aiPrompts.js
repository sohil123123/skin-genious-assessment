import { encode } from '@toon-format/toon'
import { available_skincare_products } from './productJson'

const skin_type_criteria = {
  skin_type_classification_v4_0: {
    metadata: {
      device: 'Bitmoji A5 (6-Mode Imaging)',
      lighting_modes_used: ['white', 'UV', 'woods', 'blue', 'positive', 'negative'],
      notes:
        'Determines overall skin type based on oiliness, dryness, sensitivity, barrier quality, pore activity, pigment response and sebaceous distribution. No treatment mapping included.',
    },

    mode_roles: {
      white: 'Texture, dryness, oil distribution, pore visibility, erythema, overall tone.',
      woods: 'Barrier integrity, dryness fluorescence, sebum-deficient areas, keratin debris.',
      UV: 'Subclinical inflammation, sensitivity, chronic sun reactivity.',
      blue: 'Sebum fluorescence, oily zone mapping.',
      positive: 'Pore-edge clarity, micro-roughness, sensitivity mapping.',
      negative: 'Surface dryness patterning, matte vs shiny evaluation.',
    },

    primary_metrics: {
      sebum_distribution_index: {
        description: 'Oil pattern across T-zone and cheeks using blue & white modes.',
        range: '0-1',
        classification: {
          dry: '<0.25',
          combination: '0.25-0.55',
          oily: '>0.55',
        },
      },
      hydration_deficit_index: {
        description: 'Dryness fluorescence and micro-flaking under woods/negative modes.',
        range: '0-1',
        classification: {
          well_hydrated: '<0.25',
          mildly_dehydrated: '0.25-0.45',
          dehydrated: '>0.45',
        },
      },
      pore_activity_index: {
        description: 'Pore visibility, density, and congestion from positive/white modes.',
        range: '0-1',
        classification: {
          minimal: '<0.25',
          moderate: '0.25-0.55',
          active: '>0.55',
        },
      },
      barrier_integrity_index: {
        description: 'Barrier strength inferred from woods fluorescence patterns.',
        range: '0-1',
        classification: {
          strong: '<0.30',
          compromised: '0.30-0.55',
          weak: '>0.55',
        },
      },
      sensitivity_index: {
        description: 'Redness patterns in white + UV modes; micro-inflammation signals.',
        range: '0-1',
        classification: {
          low: '<0.30',
          moderate: '0.30-0.60',
          high: '>0.60',
        },
      },
      photo_reactivity_index: {
        description: 'UV-enhancement relative to white light (sun reactivity).',
        formula: 'UV_intensity / (white_intensity + 0.001)',
        range: '0-2',
      },
    },

    composite_skin_type_logic: {
      hydration_vs_oil_matrix: {
        logic: 'Combine sebum_distribution_index and hydration_deficit_index.',
        mapping: {
          dry: 'sebum <0.25 AND dehydration >=0.30',
          oily: 'sebum >0.55 AND dehydration <0.40',
          combination: 'sebum 0.25-0.55 OR mixed patterns across regions',
          balanced: 'sebum <0.40 AND dehydration <0.30 AND minimal sensitivity',
        },
      },

      sensitivity_modifier: {
        rules: [
          "If sensitivity_index>0.60 → append '_sensitive'",
          "If barrier_integrity_index>0.55 → append '_sensitive'",
          "If photo_reactivity_index>1.2 → append '_sun_reactive'",
        ],
      },
    },

    fitzpatrick_classification: {
      inputs: [
        'UV-visible pigment response',
        'woods-mode melanocyte fluorescence',
        'melanin density contrast',
        'tanning vs burning likelihood inferred from imaging patterns',
      ],
      logic: {
        FP1: 'Very low melanin signal, high UV-reactivity, minimal brown tone',
        FP2: 'Low melanin, mild tanning markers, strong UV contrast',
        FP3: 'Moderate melanin signal, even white/woods patterns',
        FP4: 'High melanin density, low UV/photo-reactivity spikes',
        FP5: 'Very high melanin, deep UV absorption, minimal visible erythema',
        FP6: 'Exceptionally dense melanin and minimal visible UV scatter',
      },
    },

    output_format: {
      skin_type: 'Dry / Oily / Combination / Balanced (+ Sensitive modifiers)',
      fitzpatrick_type: 'I-VI',
      backend_details: {
        sebum_distribution_index: '0-1',
        hydration_deficit_index: '0-1',
        pore_activity_index: '0-1',
        barrier_integrity_index: '0-1',
        sensitivity_index: '0-1',
        photo_reactivity_index: '0-2',
      },
    },
  },
}

const combined_barrier_sensitivity = {
  combined_barrier_sensitivity_v6_0: {
    metadata: {
      device: 'Bitmoji A5 (6-Mode Extraction)',
      lighting_modes_used: ['white', 'UV', 'woods', 'blue', 'positive', 'negative'],
      regions_analyzed: ['forehead', 'cheeks', 'nose', 'chin'],
      notes:
        'Unified scoring combining barrier integrity + sensitivity reactivity. Vascularity kept separate. Sensitive to treatment-driven changes such as hydration, barrier repair, inflammation reduction.',
    },

    mode_roles: {
      white: 'Surface dryness, roughness, flaking visibility, redness baseline.',
      positive: 'Texture disruption, micro-cracks, flaky edges.',
      negative: 'Barrier microtexture homogeneity, fine-line dryness.',
      UV: 'Barrier disruption via hotspots, PIH-prone regions, inflammation accentuation.',
      woods: 'Chronic dryness, keratin debris fluorescence.',
      blue: 'Sebum vs dryness contrast, dehydrated-shine patterns.',
    },

    primary_metrics: {
      surface_texture_uniformity: {
        description: 'Smoothness of skin surface; reduced when barrier is compromised.',
        range: '0-1',
        bands: {
          excellent: '>0.85',
          mild_disruption: '0.70-0.85',
          moderate_disruption: '0.55-0.70',
          severe_disruption: '<0.55',
        },
      },

      hydration_signal_index: {
        description: 'Brightness uniformity + red-channel subsurface scatter (hydration proxy).',
        range: '0-1',
        bands: {
          hydrated: '>0.65',
          slightly_low: '0.45-0.65',
          low: '0.30-0.45',
          very_low: '<0.30',
        },
      },

      erythema_intensity_index: {
        description: 'Red-channel intensity relative to neutral baseline; indicates sensitivity.',
        range: '0-1',
        bands: {
          none: '<0.25',
          mild: '0.25-0.45',
          moderate: '0.45-0.65',
          severe: '>0.65',
        },
      },

      vascular_pattern_index: {
        description:
          'Linear vascular features indicating reactive sensitivity (not chronic redness).',
        range: '0-1',
      },

      barrier_uniformity_index: {
        description: 'PPL reflectance stability; low values = impaired barrier.',
        range: '0-1',
        bands: {
          intact: '>0.80',
          mild_disruption: '0.60-0.80',
          disrupted: '<0.60',
        },
      },

      flaking_texture_index: {
        description: 'High-frequency texture variance from dryness / micro-flaking.',
        range: '0-1',
      },
    },

    backend_indices: {
      region_barrier_map: {
        description: 'Barrier status per region (0-1).',
        format: '{region: float}',
      },

      region_reactivity_map: {
        description: 'Sensitivity/erythema per region (0-1).',
        format: '{region: float}',
      },

      barrier_damage_pattern: {
        description: 'Categorization of dominant barrier issue.',
        rules: [
          { if: 'flaking_texture_index> 0.5', then: 'Dryness-driven impairment' },
          { if: 'hydration_signal_index< 0.40', then: 'Dehydration-driven impairment' },
          { if: 'barrier_uniformity_index< 0.55', then: 'Structural barrier disruption' },
          { if: 'erythema_intensity_index> 0.60', then: 'Inflammatory sensitivity' },
        ],
      },

      sensitivity_pattern: {
        description: 'Determines type of skin reactivity.',
        rules: [
          {
            if: 'vascular_pattern_index> 0.5 &&erythema_intensity_index> 0.45',
            then: 'Vascular-reactive',
          },
          {
            if: 'barrier_uniformity_index< 0.55 &&flaking_texture_index> 0.30',
            then: 'Barrier-impaired sensitive',
          },
          {
            if: 'erythema_intensity_index< 0.45 &&barrier_uniformity_index> 0.60',
            then: 'Low-reactive',
          },
        ],
      },

      improvability_index: {
        description: 'How responsive the barrier + sensitivity are to treatment.',
        formula:
          '(hydration_signal_index * 0.4) + (surface_texture_uniformity * 0.3) + (1 - erythema_intensity_index) * 0.3',
        range: '0-1',
      },
    },

    combined_index_equation: {
      description: 'Continuous barrier-sensitivity burden value (0-1).',
      equation:
        'BSI = 0.30*(1 - surface_texture_uniformity) + 0.25*(1 - hydration_signal_index) + 0.25*erythema_intensity_index + 0.10*vascular_pattern_index + 0.10*flaking_texture_index',
    },

    score_bins: {
      1: {
        range: '<0.20',
        label: 'Strong Barrier / Low Sensitivity',
        anchor: 'Smooth texture, well hydrated, minimal redness or reactivity.',
      },
      2: {
        range: '0.20-0.35',
        label: 'Mildly Compromised',
        anchor: 'Early dryness or mild sensitivity but stable barrier.',
      },
      3: {
        range: '0.35-0.55',
        label: 'Moderately Compromised',
        anchor: 'Visible dryness, uneven texture, mild-to-moderate redness.',
      },
      4: {
        range: '0.55-0.75',
        label: 'Severely Compromised',
        anchor: 'Marked dryness, flaking, barrier disruption, persistent sensitivity.',
      },
      5: {
        range: '>0.75',
        label: 'Highly Sensitive / Barrier Breakdown',
        anchor: 'Severe redness, scaling, burning-prone skin; urgent barrier repair needed.',
      },
    },

    output_format: {
      final_score: 'integer (1-5)',
      BSI_continuous: 'float 0-1',
      backend_details: {
        surface_texture_uniformity: '0-1',
        hydration_signal_index: '0-1',
        erythema_intensity_index: '0-1',
        vascular_pattern_index: '0-1',
        barrier_uniformity_index: '0-1',
        flaking_texture_index: '0-1',
        region_barrier_map: 'dict',
        region_reactivity_map: 'dict',
        barrier_damage_pattern: 'string',
        sensitivity_pattern: 'string',
        improvability_index: '0-1',
      },
    },
  },
}

const visual_acne_scoring = {
  visual_acne_scoring_v5_1_spatial: {
    metadata: {
      device: 'Bitmoji A5 (6-Mode Imaging)',
      lighting_modes_used: ['white', 'UV', 'woods', 'blue', 'positive', 'negative'],
      regions_analyzed: [
        'forehead',
        'cheek_left',
        'cheek_right',
        'nose',
        'chin',
        'jawline_left',
        'jawline_right',
      ],
      notes:
        'Scale 1-5 where 1 = minimal acne and 5 = severe/nodulocystic. Includes spatial maps & per-lesion coordinates for treatment-level intelligence.',
    },

    lesion_types: {
      open_comedone: {
        description: 'Visible dark comedones in white mode; minimal inflammation.',
        weight: 0.18,
      },
      closed_comedone: { description: 'Whitish bumps in white/negative light.', weight: 0.18 },
      papule: { description: 'Inflamed red bumps; strong signal in white + UV.', weight: 0.26 },
      pustule: {
        description: 'Papule with purulent center; strong positive-mode contrast.',
        weight: 0.24,
      },
      nodule: { description: 'Deep, painful lesions with UV inflammatory halo.', weight: 0.14 },
    },

    region_weights: {
      forehead: 0.15,
      cheek_left: 0.2,
      cheek_right: 0.2,
      nose: 0.1,
      chin: 0.15,
      jawline_left: 0.1,
      jawline_right: 0.1,
    },

    primary_metrics: {
      total_lesion_count: {
        description: 'Total lesions detected across all regions.',
        range: '0-200+',
      },

      inflammatory_ratio: {
        description: 'Inflammatory lesions / total lesions.',
        range: '0-1',
        bands: { low: '<0.25', moderate: '0.25-0.50', high: '>0.50' },
      },

      comedone_density_index: {
        description: 'Closed + open comedones normalized 0-1 across the face.',
        bands: {
          minimal: '<0.15',
          mild: '0.15-0.35',
          moderate: '0.35-0.60',
          dense: '>0.60',
        },
      },

      inflammatory_cluster_index: {
        description: 'Cluster analysis of papules/pustules/nodules using DBSCAN.',
        range: '0-1',
      },

      uv_porhyrin_load: {
        description: 'Bacterial porphyrin fluorescence load (UV mode).',
        range: '0-1',
      },

      chronicity_index: {
        description: 'Woods + UV composite: PIH, erythema, scarring.',
        range: '0-1',
      },
    },

    backend_indices: {
      region_activity_map: {
        description: 'Lesion count and severity per region.',
        format: '{region: 0-1 normalized severity}',
      },

      nodular_flag: {
        description: 'True if any nodules detected.',
        values: ['true', 'false'],
      },

      relapse_risk_index: {
        description: 'Likelihood of relapse (comedone density × chronicity).',
        formula: 'comedone_density_index * chronicity_index',
        range: '0-1',
      },

      improvability_index: {
        description: 'Short-term treatment responsiveness.',
        formula: '(1 - chronicity_index) * inflammatory_ratio',
        range: '0-1',
      },

      per_lesion_coordinate_map: {
        description: 'List of all lesions with type, coordinates, size, depth proxy.',
        format: [
          {
            id: 'string lesion_id',
            type: 'open_comedone | closed_comedone | papule | pustule | nodule',
            region:
              'forehead | cheek_left | cheek_right | nose | chin | jawline_left | jawline_right',
            x: '0-1 normalized coordinate',
            y: '0-1 normalized coordinate',
            size_radius_px: 'float',
            uv_halo_intensity: 'float 0-1 (depth/inflammation proxy)',
            severity_weighted_value: 'float 0-1 using lesion_types.weight',
          },
        ],
      },

      inflammatory_hotspot_map: {
        description: 'Cluster polygons for inflamed zones.',
        format: {
          clusters: [
            {
              cluster_id: 'string',
              lesion_ids: ['L1', 'L2', 'L3'],
              centroid: { x: '0-1', y: '0-1' },
              polygon: [
                [0.12, 0.3],
                [0.15, 0.34],
                [0.18, 0.29],
              ],
              cluster_severity: 'float 0-1',
            },
          ],
        },
      },

      acne_grid_map: {
        description: '6×4 spatial grid aligned with pigmentation v6.1 for precision treatment.',
        components: {
          grid_size: [4, 6],
          grid_values: [
            ['0-1', '0-1', '0-1', '0-1', '0-1', '0-1'],
            ['0-1', '0-1', '0-1', '0-1', '0-1', '0-1'],
            ['0-1', '0-1', '0-1', '0-1', '0-1', '0-1'],
            ['0-1', '0-1', '0-1', '0-1', '0-1', '0-1'],
          ],
          grid_column_map: {
            0: 'left_temporal',
            1: 'left_malar_upper',
            2: 'central_glabella_nose',
            3: 'right_malar_upper',
            4: 'right_temporal',
            5: 'chin_perioral_central',
          },
          grid_row_map: {
            0: 'upper_forehead',
            1: 'mid_forehead_browline',
            2: 'malar_Tzone',
            3: 'perioral_chin_jawline',
          },
        },
        usage_notes: [
          'Cells >0.6 = treatment hotspots.',
          'Combines lesion density + inflammation + porphyrins.',
          'Laser/IPL/peel engines can allocate passes/fluence per cell.',
        ],
      },

      BIBI_index: {
        description:
          'Global Bacterial + Inflammatory Burden Index. Higher values indicate high porphyrin load + high inflammatory lesion ratio.',
        formula: '(0.6 * uv_porhyrin_load) + (0.4 * inflammatory_ratio)',
        range: '0-1',
        clinical_relevance:
          'High BIBI directs AI engine toward antibacterial, anti-inflammatory, keratolytic and bacteriostatic treatments (Azelic acid, Salicylic acid, Blue light, Q-switch low fluence, Hydrafacial BHA, etc.).',
      },
    },

    normalization_logic: {
      lesion_load_normalized: {
        method: '0 at <5 lesions, 1 at >=120 lesions',
        equation: 'clip((total_lesion_count - 5) / (120 - 5), 0, 1)',
      },
      inflammation_normalized: { method: 'Use inflammatory_ratio directly.' },
      clusters_normalized: { method: 'Use inflammatory_cluster_index directly.' },
    },

    acne_severity_equation: {
      description: 'Core continuous acne severity score (0-1).',
      equation:
        'ASI = 0.40*lesion_load_normalized + 0.30*inflammation_normalized + 0.15*comedone_density_index + 0.15*inflammatory_cluster_index',
    },

    grading_scale: {
      1: {
        range: '<0.20',
        label: 'Minimal Acne',
        anchor: 'Few comedones, almost no inflammation.',
      },
      2: { range: '0.20-0.35', label: 'Mild Acne', anchor: 'Comedonal or occasional papules.' },
      3: { range: '0.35-0.55', label: 'Moderate Acne', anchor: 'Papules/pustules, some clusters.' },
      4: { range: '0.55-0.75', label: 'Marked Acne', anchor: 'Dense inflammatory lesions.' },
      5: {
        range: '>0.75',
        label: 'Severe/Nodulocystic Acne',
        anchor: 'Nodules, widespread inflammation.',
      },
    },

    decision_logic: {
      steps: [
        '1. Detect lesions across modes (white + UV + blue).',
        '2. Classify lesion type.',
        '3. Assign region + XY coordinates.',
        '4. Build cluster polygons for inflammatory hotspots.',
        '5. Compute indices and normalization metrics.',
        '6. Construct acne_grid_map from density + inflammation + porphyrins.',
        '7. Compute ASI (Acne Severity Index).',
        '8. Map ASI to 1-5 severity.',
        '9. Output backend indices and spatial maps.',
      ],
    },

    output_format: {
      final_score: 'integer 1-5',
      ASI_continuous: 'float 0-1',
      lesion_counts: {
        open_comedone: 'integer',
        closed_comedone: 'integer',
        papule: 'integer',
        pustule: 'integer',
        nodule: 'integer',
      },
      lesion_load_normalized: 'float 0-1',
      inflammatory_ratio: 'float 0-1',
      comedone_density_index: 'float 0-1',
      inflammatory_cluster_index: 'float 0-1',
      uv_porhyrin_load: 'float 0-1',
      chronicity_index: 'float 0-1',
      nodular_flag: 'true/false',
      region_activity_map: 'dict',
      relapse_risk_index: 'float 0-1',
      improvability_index: 'float 0-1',
      per_lesion_coordinate_map: 'array',
      inflammatory_hotspot_map: 'object',
      acne_grid_map: 'object',
      confidence: '0-1',
      BIBI_index: 'float 0-1',
    },
  },
}

const sebum_content_scoring = {
  sebum_content_scoring_v6_0: {
    metadata: {
      device: 'Bitmoji A5 (6-Mode Imaging)',
      lighting_modes_used: ['white', 'blue', 'UV', 'woods', 'positive', 'negative'],
      regions_analyzed: ['forehead', 'nose', 'cheeks_left', 'cheeks_right', 'chin'],
      notes:
        'Score reflects clinically visible oiliness, subclinical sebaceous activity, bacterial porphyrins, and shine dynamics. Designed to be highly treatment-responsive and sensitive to single-session improvements.',
    },

    mode_roles: {
      white: 'Visible shine, highlight streaks, oily T-zone areas.',
      blue: 'Sebum fluorescence, clogged follicles, sebum pooling.',
      UV: 'Porphyrin bacterial fluorescence (C. acnes activity).',
      woods: 'Keratin + oil debris patterns for subclinical congestion.',
      positive: 'Highlight-enhanced pore shine + oil film mapping.',
      negative: 'Contrast-based matte vs shiny zone discrimination.',
    },

    primary_metrics: {
      shine_reflectance_index: {
        description: 'Specular reflection (white + positive).',
        formula: 'max_specular_intensity / mean_skin_intensity',
        range: '0-1',
      },
      sebum_fluorescence_index: {
        description: 'Blue-mode fluorescence of sebum.',
        formula: 'fluorescent_pixel_ratio',
        range: '0-1',
      },
      porphyrin_load_index: {
        description: 'UV-mode porphyrin fluorescence.',
        formula: 'porphyrin_spot_count_normalized',
        range: '0-1',
      },
      sebaceous_congestion_index: {
        description: 'Woods-mode follicular congestion.',
        formula: 'cluster_density_normalized',
        range: '0-1',
      },
    },

    backend_indices: {
      regional_sebum_map: {
        description: 'Per-region visible + subclinical sebum burden.',
        format: {
          forehead: '0-1',
          nose: '0-1',
          cheeks_left: '0-1',
          cheeks_right: '0-1',
          chin: '0-1',
        },
      },

      sebum_hotspot_grid: {
        description: '6×4 grid of pixel-level shine/sebum hotspots.',
        components: {
          grid_size: [4, 6],
          grid_values: 'array[4][6] with each cell 0-1',
        },
      },

      sebum_quantity_index_global: {
        description: 'Overall quantity of sebum.',
        formula: '0.45*shine_reflectance + 0.35*sebum_fluorescence + 0.20*porphyrin_load',
      },

      sebum_depth_component_index: {
        description: 'Superficial shine vs deeper follicular activity.',
        formula: 'sebaceous_congestion_index * 0.6 + porphyrin_load_index * 0.4',
        range: '0-1',
      },

      sebum_variability_index: {
        description: 'Unevenness of distribution.',
        formula: 'std(region_sebum_values)/mean(region_sebum_values)',
        range: '0-1',
      },

      improvability_index: {
        description: 'Responsiveness to treatment.',
        formula: '(1 - sebum_depth_component_index) * (1 - sebum_variability_index)',
        range: '0-1',
      },

      /* -----------------------------------------------
         NEW ADDITION: BACTERIAL-INFLAMMATORY BURDEN INDEX
         ----------------------------------------------- */

      bacterial_inflammatory_burden_index: {
        description:
          'Combined measure of bacterial activity + inflammation derived from porphyrins, blue-mode sebum fluorescence and Woods congestion.',
        components: {
          bacterial_component: {
            formula: 'porphyrin_load_index',
            weight: 0.55,
            description: 'Primary indicator of C. acnes bacterial load.',
          },
          subclinical_inflammation_component: {
            formula: '(sebum_fluorescence_index * 0.6) + (sebaceous_congestion_index * 0.4)',
            weight: 0.45,
            description:
              'Contribution from follicular blockage + inflammatory fluorescence patterns.',
          },
        },
        final_equation:
          'BIBI = (0.55 * porphyrin_load_index) + (0.45 * ((sebum_fluorescence_index * 0.6) + (sebaceous_congestion_index * 0.4)))',
        output_range: '0-1',
        clinical_interpretation: {
          '0-0.25': 'Minimal bacterial/inflammatory burden',
          '0.25-0.50': 'Mild burden; early congestion',
          '0.50-0.75': 'Moderate burden; bacterial activity + inflammation present',
          '0.75-1.00': 'High burden; strong bacterial proliferation and inflammatory potential',
        },
      },
    },

    normalization_logic: {
      shine_norm: 'Use shine_reflectance_index directly',
      fluorescence_norm: 'Use sebum_fluorescence_index directly',
      porphyrin_norm: 'Use porphyrin_load_index directly',
      congestion_norm: 'Use sebaceous_congestion_index directly',
    },

    sebum_burden_equation: {
      description: 'Global continuous sebum severity metric.',
      equation:
        'SSI = 0.40*shine_norm + 0.25*fluorescence_norm + 0.20*porphyrin_norm + 0.15*congestion_norm',
    },

    score_bins: {
      1: { range: '<0.20', label: 'Very Low Sebum / Dry' },
      2: { range: '0.20-0.38', label: 'Low-Normal Sebum' },
      3: { range: '0.38-0.58', label: 'Moderate Sebum' },
      4: { range: '0.58-0.78', label: 'High Sebum / Oily' },
      5: { range: '>0.78', label: 'Very Oily / Seborrheic' },
    },

    decision_logic: {
      steps: [
        '1. Quantify shine_reflectance.',
        '2. Quantify sebum_fluorescence.',
        '3. Count UV porphyrins.',
        '4. Extract Woods congestion.',
        '5. Compute regional_sebum_map.',
        '6. Build sebum_hotspot_grid.',
        '7. Compute SSI.',
        '8. Map SSI to 1-5 severity.',
        '9. Compute backend indices including BIBI.',
      ],
    },

    output_format: {
      final_score: 'integer 1-5',
      SSI_continuous: 'float 0-1',
      shine_reflectance_index: '0-1',
      sebum_fluorescence_index: '0-1',
      porphyrin_load_index: '0-1',
      sebaceous_congestion_index: '0-1',
      backend_details: {
        regional_sebum_map: 'dict',
        sebum_hotspot_grid: '4×6 matrix',
        sebum_quantity_index_global: '0-1',
        sebum_depth_component_index: '0-1',
        sebum_variability_index: '0-1',
        improvability_index: '0-1',
        bacterial_inflammatory_burden_index: '0-1',
      },
    },
  },
}

const vascularity_redness_scoring = {
  vascularity_redness_scoring_v6: {
    metadata: {
      device: 'Bitmoji A5 Analyzer',
      lighting_modes_used: ['white', 'PPL_positive', 'XPL_negative', 'UV', 'woods', 'blue'],
      regions_analyzed: ['forehead', 'cheeks', 'nose', 'chin'],
      version: '6.0',
    },

    core_parameters: {
      clinical_erythema_visibility: {
        description: 'How clearly redness is seen in white-light mode with naked-eye clarity.',
        lighting: 'white',
        role: 'Primary determinant of patient-perceived redness.',
      },
      vascular_pattern_prominence: {
        description: 'Visibility of linear/telangiectatic vessels in PPL (positive polarized).',
        lighting: 'PPL_positive',
        role: 'Indicates structural vascular changes that worsen redness.',
      },
      diffuse_background_redness: {
        description: 'Uniform blotchy redness, seen best in XPL negative cross-polarization.',
        lighting: 'XPL_negative',
        role: 'Represents inflammation that treatments can reduce.',
      },
      subclinical_inflammation_hotspots: {
        description: 'UV/Woods detection of deeper inflammation clusters.',
        lighting: ['UV', 'woods'],
        role: 'Predicts future worsening; improves with anti-inflammatory treatments.',
      },
      sebaceous_inflammation_component: {
        description: 'Blue-light detection of porphyrin-associated microinflammation.',
        lighting: 'blue',
        role: 'Detects acne-associated or T-zone inflammation contributing to redness.',
      },
    },

    score_definitions: {
      1: {
        label: 'Minimal Redness',
        clinical_features: [
          'Almost no visible redness in white light',
          'No vascular lines visible in PPL',
          'No diffuse erythema in XPL',
          'UV/Woods shows minimal fluorescence or hotspots',
        ],
        patient_perception: 'Skin appears even-toned with no visible redness.',
        treatment_responsiveness: 'Small but noticeable improvements possible.',
      },

      2: {
        label: 'Mild Redness / Reactive',
        clinical_features: [
          'Faint cheek or nose redness visible only on close view',
          'Very fine vascular patterns may appear in PPL',
          'XPL shows slight background erythema',
          'UV/Woods shows scattered microinflammatory dots',
        ],
        patient_perception: 'Occasional redness, often called ‘sensitive skin’.',
        treatment_responsiveness: 'Improves well with facials, LED, calming agents.',
      },

      3: {
        label: 'Moderate Redness',
        clinical_features: [
          'Easily visible redness in cheeks/nose in white light',
          'PPL shows clear but thin vascular structures',
          'XPL shows noticeable diffuse erythema',
          'UV/Woods shows multiple hotspots outlining inflamed areas',
        ],
        patient_perception: 'Redness is a visible cosmetic concern.',
        treatment_responsiveness: 'Strongly responsive to clinical facials, yellow LED, peels.',
      },

      4: {
        label: 'High Redness / Vascular Prominence',
        clinical_features: [
          'Obvious redness from conversational distance',
          'PPL reveals dense or branching vessels',
          'XPL shows widespread erythema',
          'UV/Woods demonstrates strong inflammatory clusters',
        ],
        patient_perception: 'Skin appears constantly red; makeup needed to cover.',
        treatment_responsiveness:
          'Requires stronger interventions like vascular lasers or multiple sessions.',
      },

      5: {
        label: 'Severe Redness / Rosacea-like',
        clinical_features: [
          'Intense diffuse redness covering large areas',
          'Prominent telangiectasia in PPL',
          'Strong XPL diffuse erythema',
          'UV/Woods shows multiple active inflammation hotspots',
          'Blue mode shows severe porphyrin-linked inflammation',
        ],
        patient_perception: 'Heavy facial redness impacting confidence.',
        treatment_responsiveness: 'Significant improvement possible but requires structured plan.',
      },
    },

    backend_output: {
      clinical_erythema_score: '1-5',
      vascular_pattern_score: '1-5',
      diffuse_redness_score: '1-5',
      subclinical_hotspot_score: '1-5',
      sebaceous_inflammation_score: '1-5',
      global_vascularity_redness_score:
        'Final score (1-5 based on clinical hierarchy, not averaging)',

      BIBI_index: {
        description: 'Bacterial + Inflammatory Burden Index for redness pathways.',
        components: {
          porphyrin_component: 'Derived from blue + UV porphyrin load (0-1)',
          deep_inflammation_component: 'Derived from Woods/UV hotspot density (0-1)',
          sebaceous_inflammation_component: 'Blue-light microinflammatory shine (0-1)',
        },
        formula:
          'BIBI = 0.45*porphyrin_component + 0.35*deep_inflammation_component + 0.20*sebaceous_inflammation_component',
        range: '0-1',
        role_in_treatment_engine:
          'Higher BIBI → increased prioritization of anti-inflammatory facials, LED yellow/red, antibacterial steps, and avoidance of heat-heavy procedures.',
      },
    },

    decision_logic: {
      rules: [
        'White-light erythema sets the baseline severity.',
        'PPL vascular structures can raise the score by +1 if significant.',
        'XPL diffuse redness can raise the score by +1 if widespread.',
        'UV/Woods hotspots refine whether redness is inflammatory or vascular.',
        'Final score reflects the highest clinically meaningful severity, not a mathematical mean.',
      ],
    },
  },
}

const skin_hydration_scoring = {
  skin_hydration_scoring_v6_0: {
    metadata: {
      device: 'Bitmoji A5 (6-Mode Imaging)',
      lighting_modes_used: ['white', 'blue', 'woods', 'UV', 'positive', 'negative'],
      regions_analyzed: ['forehead', 'cheeks_left', 'cheeks_right', 'nose', 'chin'],
      notes:
        'Score reflects surface hydration, micro-line density, diffusion quality, dullness, and dryness patterns. Fully treatment-responsive and patient-perception aligned.',
    },

    mode_roles: {
      white: 'Surface brightness, dullness, plumpness, fine-line visibility.',
      blue: 'Sebum distribution → differentiates dehydration from oil-deficiency.',
      woods: 'Dry keratin patches, scaling, uneven hydration zones.',
      UV: 'Inflammation halos and compromised barrier (indirect dehydration marker).',
      positive: 'Micro-lines, micro-cracks, surface irregularity.',
      negative: 'Skin smoothness map, plumpness, micro-topography.',
    },

    primary_metrics: {
      surface_reflectance_index: {
        description:
          'How well hydrated skin reflects light. Hydrated skin shows smooth, even reflectance.',
        range: '0-1',
        bands: {
          very_low: '<0.30',
          low: '0.30-0.45',
          moderate: '0.45-0.60',
          good: '0.60-0.75',
          excellent: '>0.75',
        },
      },

      microline_density_index: {
        description:
          'Fine-line density from positive/negative modes. Dehydration exaggerates micro-lines.',
        range: '0-1',
        bands: {
          minimal: '<0.15',
          mild: '0.15-0.30',
          moderate: '0.30-0.45',
          marked: '0.45-0.60',
          severe: '>0.60',
        },
      },

      subsurface_diffusion_index: {
        description: 'Light diffusion (under white + UV), proxy for plump hydrated dermis.',
        range: '0-1',
        bands: {
          poor: '<0.40',
          fair: '0.40-0.55',
          moderate: '0.55-0.70',
          good: '0.70-0.80',
          high: '>0.80',
        },
      },

      dry_patch_fluorescence_index: {
        description: 'Woods-mode detection of dry keratin, scaling, micropatch dehydration.',
        range: '0-1',
        bands: {
          none: '<0.10',
          few: '0.10-0.25',
          scattered: '0.25-0.40',
          multiple: '0.40-0.60',
          dense: '>0.60',
        },
      },

      sebum_balance_ratio: {
        description:
          'Blue-mode: differentiates true dehydration (low sebum) vs oil-dehydration mix.',
        formula: 'sebum_presence / optimal_sebum_reference',
        range: '0-1',
        bands: {
          very_low: '<0.25',
          low: '0.25-0.40',
          balanced: '0.40-0.65',
          slightly_high: '0.65-0.80',
          high: '>0.80',
        },
      },
    },

    backend_indices: {
      regional_hydration_map: {
        description: 'Per-region hydration status for treatment personalization.',
        format: {
          region: {
            surface_reflectance_index: '0-1',
            microline_density_index: '0-1',
            dry_patch_fluorescence_index: '0-1',
            regional_hydration_score: '0-1 (combined regional score)',
          },
        },
      },

      hydration_deficit_type: {
        description: 'Characterizes dehydration type.',
        values: [
          'surface_dehydration',
          'deep_dermal_dehydration',
          'sebum_deficiency_dehydration',
          'mixed_dehydration',
          'well_hydrated',
        ],
      },

      barrier_compromise_index: {
        description: 'UV halo + woods scaling → barrier dysfunction from dehydration.',
        range: '0-1',
      },

      hydration_recovery_potential: {
        description: 'How much hydration can improve after a single session.',
        formula: '1 - (microline_density_index * dry_patch_fluorescence_index)',
        range: '0-1',
      },
    },

    normalization_logic: {
      surface_reflectance_normalized: 'use surface_reflectance_index directly',
      microline_penalty: 'equal to microline_density_index',
      diffusion_normalized: 'use subsurface_diffusion_index directly',
      dry_patch_penalty: 'use dry_patch_fluorescence_index',
      sebum_balance_normalized: 'mapped toward ideal range (0.40-0.65)',
    },

    hydration_burden_equation: {
      description: 'Core hydration score 0-1',
      equation:
        'HSI = 0.40*surface_reflectance_index + 0.25*subsurface_diffusion_index + 0.15*(1 - microline_density_index) + 0.10*sebum_balance_ratio + 0.10*(1 - dry_patch_fluorescence_index)',
    },

    score_bins: {
      1: {
        range: '<0.30',
        label: 'Severely Dehydrated',
        anchor: 'Dull, flaky, tight appearance; marked micro-lines.',
      },
      2: {
        range: '0.30-0.45',
        label: 'Moderately Dehydrated',
        anchor: 'Uneven reflectance, scattered dry patches, visible fine lines.',
      },
      3: {
        range: '0.45-0.60',
        label: 'Mild Dehydration',
        anchor: 'Healthy but lacks plumpness; minor dullness.',
      },
      4: {
        range: '0.60-0.75',
        label: 'Well Hydrated',
        anchor: 'Smooth surface, good glow, soft micro-lines.',
      },
      5: {
        range: '>0.75',
        label: 'Optimally Hydrated',
        anchor: 'Plump, luminous, radiant appearance with high diffusion.',
      },
    },

    decision_logic: {
      steps: [
        '1. Extract metrics from white, blue, woods, UV, positive, negative modes.',
        '2. Compute regional hydration metrics and full-face averages.',
        '3. Normalize all metrics (0-1).',
        '4. Calculate HSI using hydration_burden_equation.',
        '5. Map HSI to 1-5 hydration score.',
        '6. Generate backend indices (hydration type, barrier compromise, recovery potential).',
      ],
    },

    output_format: {
      final_score: 'integer 1-5',
      HSI_continuous: 'float 0-1',
      surface_reflectance_index: '0-1',
      microline_density_index: '0-1',
      subsurface_diffusion_index: '0-1',
      dry_patch_fluorescence_index: '0-1',
      sebum_balance_ratio: '0-1',
      regional_hydration_map: 'dict',
      hydration_deficit_type: 'string',
      barrier_compromise_index: '0-1',
      hydration_recovery_potential: '0-1',
      confidence: '0-1',
    },
  },
}

const skin_luminosity_index = {
  skin_luminosity_index_v1_0: {
    metadata: {
      device: 'Bitmoji A5 (6-mode)',
      lighting_modes_used: ['white', 'positive', 'negative', 'blue', 'UV', 'woods'],
      regions_analyzed: ['forehead', 'malar_left', 'malar_right', 'nose', 'chin'],
      notes:
        'Measures surface glow, subsurface translucency, brightness, uniformity, dryness/shadow contrast. Fully treatment-responsive.',
    },

    mode_roles: {
      white: 'Primary for visible glow, reflectivity, LAB luminosity.',
      positive: 'Edge contrast, hotspot detection, specular highlights.',
      negative: 'Surface texture dullness, micro-shadow mapping.',
      blue: 'Sebum-related shine, gloss vs patchiness.',
      UV: 'Subsurface scatter, dehydration patches, dermal light diffusion loss.',
      woods: 'Keratin/dryness fluorescence indicating reduced luminosity.',
    },

    primary_metrics: {
      surface_reflectance_uniformity: {
        description: 'Evenness of specular reflection under white mode.',
        formula: '1 - (stddev_reflectance / mean_reflectance)',
        range: '0-1',
        bands: {
          dull: '<0.55',
          uneven: '0.55-0.70',
          healthy: '0.70-0.82',
          radiant: '>0.82',
        },
      },

      color_luminance_index: {
        description: 'Brightness based on LAB L-channel normalized to reference white.',
        formula: 'mean_L / L_reference',
        range: '0-1',
        bands: {
          dull: '<0.45',
          soft: '0.45-0.60',
          bright: '0.60-0.75',
          radiant: '>0.75',
        },
      },

      subsurface_diffusion_index: {
        description: 'Light scatter depth measured using UV + negative mode.',
        formula: 'diffuse_spread / total_intensity',
        range: '0-1',
        bands: {
          low: '<0.45',
          moderate: '0.45-0.65',
          high: '0.65-0.80',
          very_high: '>0.80',
        },
      },

      shadow_softness_index: {
        description: 'Softness of contour transitions; lower harsh shadows = higher glow.',
        formula: '1 - (edge_contrast / mean_reflectance)',
        range: '0-1',
        bands: {
          harsh: '<0.35',
          moderate: '0.35-0.55',
          soft: '0.55-0.75',
          silky: '>0.75',
        },
      },

      sebum_gloss_index: {
        description: 'Healthy gloss vs patchy oiliness using blue + white.',
        formula: 'even_sebum_distribution_score',
        range: '0-1',
        bands: {
          dry: '<0.25',
          balanced: '0.25-0.55',
          glossy: '>0.55',
        },
      },

      dryness_dullness_index: {
        description: 'Dryness-induced dullness from woods fluorescence + negative micro-texture.',
        formula: 'dry_fluorescence / (total_reflectance + 1)',
        range: '0-1',
        bands: {
          none: '<0.25',
          mild: '0.25-0.45',
          moderate: '0.45-0.65',
          marked: '>0.65',
        },
      },
    },

    backend_indices: {
      regional_glow_map: {
        description: 'Glow score per region for zonal treatments.',
        format: '{region: float_0-1}',
      },

      luminosity_grid_map: {
        description: '4×6 grid for micro-zone glow targeting.',
        components: {
          grid_size: [4, 6],
          grid_values: '2D array with 0-1 normalized luminosity per cell',
          row_map: {
            0: 'upper_forehead_hairline',
            1: 'mid_forehead_browline',
            2: 'malar_nose_zone',
            3: 'perioral_chin_jawline',
          },
          col_map: {
            0: 'left_temporal',
            1: 'left_malar',
            2: 'glabella_nose',
            3: 'right_malar',
            4: 'right_temporal',
            5: 'chin_perioral',
          },
        },
      },

      glow_limiting_factors: {
        description: 'Identifies what is reducing glow the most.',
        fields: {
          dullness_due_to_dryness: '0-1',
          dullness_due_to_shadows: '0-1',
          dullness_due_to_low_L: '0-1',
          dullness_due_to_texture: '0-1',
        },
      },

      treatment_responsiveness_index: {
        description: 'Predicts whether glow will improve quickly.',
        formula:
          '0.5*(1 - dryness_dullness_index) + 0.3*sebum_gloss_index + 0.2*(subsurface_diffusion_index)',
        range: '0-1',
      },
    },

    index_equation: {
      description: 'Weighted luminosity equation (0-1)',
      equation:
        'GLI = 0.30*surface_reflectance_uniformity + \
               0.25*color_luminance_index + \
               0.20*subsurface_diffusion_index + \
               0.15*shadow_softness_index + \
               0.05*sebum_gloss_index + \
               0.05*(1 - dryness_dullness_index)',
    },

    score_bins: {
      1: {
        range: '<0.25',
        label: 'Very Dull',
        anchor: 'Low brightness, marked dryness, uneven reflection.',
      },
      2: {
        range: '0.25-0.40',
        label: 'Mild Glow',
        anchor: 'Some brightness, but dullness/patchiness persists.',
      },
      3: {
        range: '0.40-0.60',
        label: 'Healthy Glow',
        anchor: 'Good brightness and uniformity with mild shadow softness.',
      },
      4: {
        range: '0.60-0.78',
        label: 'Radiant',
        anchor: 'Bright, even surface glow and soft facial contours.',
      },
      5: {
        range: '>0.78',
        label: 'Luminous / High Radiance',
        anchor: 'Strong surface + subsurface glow, minimal dullness.',
      },
    },

    output_format: {
      final_score: 'integer 1-5',
      GLI_continuous: 'float 0-1',

      backend_details: {
        surface_reflectance_uniformity: '0-1',
        color_luminance_index: '0-1',
        subsurface_diffusion_index: '0-1',
        shadow_softness_index: '0-1',
        sebum_gloss_index: '0-1',
        dryness_dullness_index: '0-1',

        regional_glow_map: 'dict region → 0-1',
        luminosity_grid_map: '4×6 matrix 0-1',
        glow_limiting_factors: 'dict',
        treatment_responsiveness_index: '0-1',
      },
    },
  },
}

const superficial_pigmentation_scoring = {
  superficial_pigmentation_scoring_v6_1: {
    metadata: {
      device: 'Bitmoji A5 (6-Mode Extraction)',
      lighting_modes_used: ['white', 'UV', 'woods', 'blue', 'positive', 'negative'],
      regions_analyzed: ['forehead', 'malar_left', 'malar_right', 'nose', 'chin'],
      notes:
        'Score reflects perceived superficial pigment burden in real-life lighting and is designed to be treatment-relevant, sensitive to change, and spatially precise for localized treatments. No treatment mapping included.',
    },

    mode_roles: {
      white:
        'Visible pigmentation and unevenness as perceived by patient; primary driver of clinical score.',
      woods:
        'Highlights epidermal melanin clusters (freckles, macules, lentigines) and spot density.',
      UV: 'Reveals subclinical pigment and photo-damage; used mainly for depth and chronicity indices.',
      blue: 'Helps differentiate melanin from vascular/structural signal; supports depth and chroma indices.',
      positive: 'Enhances contrast for lesion borders and segmentation.',
      negative: 'Complementary view for border sharpening and homogeneity analysis.',
    },

    primary_metrics: {
      coverage_area_percent: {
        description:
          'Percentage of analyzed facial area with pigment intensity above threshold in white + woods modes combined.',
        bands: {
          very_low: '<5%',
          low: '5-15%',
          moderate: '15-35%',
          high: '35-60%',
          very_high: '>60%',
        },
      },
      mean_intensity_index: {
        description:
          'Average melanin-related intensity in pigmented pixels (white + woods), normalized 0-1.',
        bands: {
          light: '<0.30',
          mild: '0.30-0.50',
          moderate: '0.50-0.65',
          marked: '0.65-0.80',
          severe: '>0.80',
        },
      },
      uniformity_index: {
        description:
          'How even the pigmentation is across the face. 1 = perfectly even, 0 = highly mottled.',
        bands: {
          even: '>=0.80',
          mottled: '0.60-0.80',
          uneven: '<0.60',
        },
      },
      border_definition_score: {
        description:
          'Sharpness of lesion edges derived from positive/negative contrast; 0-1 (0 = indistinct, 1 = sharply demarcated).',
        note: 'Higher values correspond to well-defined macules/patches.',
      },
      woods_cluster_density: {
        description:
          'Density of discrete Woods clusters (freckles/macules) per unit area, normalized 0-1.',
        bands: {
          sparse: '<0.20',
          scattered: '0.20-0.40',
          clustered: '0.40-0.70',
          dense: '>0.70',
        },
      },
      depth_indicator_ratio: {
        description:
          'Depth bias based on UV:woods and blue:positive relationships; 0 = superficial, 1 = predominantly deep.',
        bands: {
          superficial: '<0.35',
          mixed: '0.35-0.65',
          deep: '>0.65',
        },
      },
    },

    backend_indices: {
      depth_index_uv_to_woods: {
        description: 'UV intensity divided by Woods intensity over pigmented regions.',
        formula: 'UV_intensity / (woods_intensity + 0.001)',
        range: '0-2',
      },
      melanin_chroma_separation_index: {
        description:
          'Separates brown epidermal melanin from blue-purple dermal component using blue vs positive modes.',
        formula:
          '(blue_intensity - positive_intensity) / (blue_intensity + positive_intensity + 0.001)',
        range: '-1 to +1',
      },
      region_variation_index: {
        description: 'Variation of pigment load across forehead, cheeks, nose, chin.',
        formula: 'stddev(region_pigment_loads) / mean(region_pigment_loads)',
        range: '0-1',
      },
      asymmetry_index: {
        description: 'Left-right malar pigment asymmetry.',
        formula: 'abs(malar_left - malar_right) / ((malar_left + malar_right)/2 + 0.001)',
        range: '0-1',
      },
      uv_enhancement_ratio: {
        description: 'Photo-damage / chronicity proxy.',
        formula: 'UV_intensity / (white_intensity + 0.001)',
        range: '0-2',
      },
      superficial_fraction_index: {
        description:
          'Proportion of total pigment signal that is likely superficial/epidermal and therefore more treatment-responsive.',
        formula: '1 - normalized_depth_indicator_ratio',
        range: '0-1',
      },
      improvability_index: {
        description:
          'Heuristic measure of how much of the pigment burden is realistically improvable in the short-to-medium term.',
        formula: 'superficial_fraction_index * (1 - chronicity_component)',
        components: {
          chronicity_component: 'clipped(uv_enhancement_ratio / 2, 0, 1)',
        },
        range: '0-1',
      },

      regional_burden_map: {
        description: 'Per-region superficial pigment burden for treatment planning.',
        format: {
          forehead: {
            coverage_area_percent: 'float 0-100',
            mean_intensity_index: 'float 0-1',
            woods_cluster_density: 'float 0-1',
            regional_PPL: 'float 0-1 (same equation as global PPL but using regional metrics)',
          },
          malar_left: {
            coverage_area_percent: 'float 0-100',
            mean_intensity_index: 'float 0-1',
            woods_cluster_density: 'float 0-1',
            regional_PPL: 'float 0-1',
          },
          malar_right: {
            coverage_area_percent: 'float 0-100',
            mean_intensity_index: 'float 0-1',
            woods_cluster_density: 'float 0-1',
            regional_PPL: 'float 0-1',
          },
          nose: {
            coverage_area_percent: 'float 0-100',
            mean_intensity_index: 'float 0-1',
            woods_cluster_density: 'float 0-1',
            regional_PPL: 'float 0-1',
          },
          chin: {
            coverage_area_percent: 'float 0-100',
            mean_intensity_index: 'float 0-1',
            woods_cluster_density: 'float 0-1',
            regional_PPL: 'float 0-1',
          },
        },
      },

      pigment_grid_map: {
        description:
          'Hybrid anatomical 6×4 grid of superficial pigment intensity for precise spot treatments (lasers, peels, targeted topicals).',
        components: {
          grid_size: '[rows, columns] → [4, 6]',
          grid_values:
            '2D array [4][6] with each cell as float 0-1 representing normalized superficial pigment intensity.',
          grid_column_map: {
            0: 'left_temporal',
            1: 'left_malar',
            2: 'central_nose_glabella',
            3: 'right_malar',
            4: 'right_temporal',
            5: 'central_chin_perioral',
          },
          grid_row_map: {
            0: 'upper_forehead_hairline',
            1: 'mid_forehead_brow_line',
            2: 'malar_nose_zone',
            3: 'perioral_chin_jawline',
          },
        },
        usage_notes: [
          'Cells with values >0.6 represent focal hotspots suitable for spot treatment emphasis.',
          'Treatment engine can combine grid_cells + regional_burden_map to decide passes/fluence/peel layering per zone.',
        ],
      },
    },

    scoring_logic: {
      description:
        'Determines a perceived pigment load score (1-5) without population-based Gaussian normalization, while being sensitive to mottling and regional variation.',
      normalization: {
        coverage_area_normalized: {
          method: 'Piecewise linear mapping: 0 at 0-5%, 1 at >=70%.',
          equation: 'coverage_norm = clip((coverage_area_percent - 5) / (70 - 5), 0, 1)',
        },
        mean_intensity_normalized: {
          method: 'Direct 0-1 normalization using defined bands.',
          note: "0 at 'light', 1 at 'severe', linear interpolation between bands.",
        },
        woods_cluster_normalized: {
          method: 'Use woods_cluster_density directly (0-1).',
        },
        uniformity_penalty: {
          description: 'Higher penalty for mottled/uneven tone.',
          equation: 'uniformity_penalty = 1 - uniformity_index',
        },
      },

      perceived_pigment_load_equation: {
        description:
          'Core continuous load metric (0-1) that the 1-5 score is derived from. Coverage and intensity are primary drivers; mottling and regional variation add penalty.',
        equation:
          'PPL = 0.35 * coverage_area_normalized + 0.35 * mean_intensity_normalized + 0.20 * woods_cluster_normalized + 0.10 * ((uniformity_penalty + region_variation_index) / 2)',
      },

      score_bins: {
        1: {
          range: '<0.18',
          anchor:
            'Essentially clear or only a few faint spots; patient usually does not complain of pigmentation.',
        },
        2: {
          range: '0.18-0.36',
          anchor:
            'Mild pigmentation; patient notices some spots or dullness in certain areas but not generalized.',
        },
        3: {
          range: '0.36-0.58',
          anchor:
            'Moderate pigmentation; uneven tone is clearly visible in daily life and is a common cosmetic concern.',
        },
        4: {
          range: '0.58-0.78',
          anchor:
            'Marked pigmentation; multiple obvious patches or dense clusters, often difficult to conceal with makeup.',
        },
        5: {
          range: '>0.78',
          anchor: 'Severe, widespread pigmentation with dense signal across most regions.',
        },
      },

      steps: [
        '1. From 6-mode images, segment pigmented vs non-pigmented areas in white + woods.',
        '2. Compute global coverage_area_percent, mean_intensity_index, uniformity_index, woods_cluster_density.',
        '3. Compute region_pigment_loads for forehead, malar_left, malar_right, nose, chin and derive region_variation_index.',
        '4. Construct pigment_grid_map (4×6) from spatial distribution of pigmented pixels in white + woods.',
        '5. Normalize metrics to 0-1 and compute PPL using perceived_pigment_load_equation.',
        '6. Assign final_score 1-5 based on score_bins.',
        '7. Independently compute backend_indices (depth_index_uv_to_woods, superficial_fraction_index, improvability_index, regional_burden_map, pigment_grid_map, etc.).',
      ],
    },

    output_format: {
      final_score: 'integer 1-5 representing perceived superficial pigment load (PPL category).',
      backend_details: {
        PPL_continuous: 'float 0-1',
        coverage_area_percent: 'float 0-100',
        coverage_area_normalized: 'float 0-1',
        mean_intensity_index: 'float 0-1',
        mean_intensity_normalized: 'float 0-1',
        uniformity_index: 'float 0-1',
        woods_cluster_density: 'float 0-1',
        border_definition_score: 'float 0-1',
        depth_indicator_ratio: 'float 0-1',
        depth_index_uv_to_woods: 'float',
        melanin_chroma_separation_index: 'float -1 to +1',
        region_variation_index: 'float 0-1',
        asymmetry_index: 'float 0-1',
        uv_enhancement_ratio: 'float 0-2',
        superficial_fraction_index: 'float 0-1',
        improvability_index: 'float 0-1',
        regional_burden_map:
          'dict per region with coverage, intensity, woods_cluster_density, regional_PPL',
        pigment_grid_map:
          'object with grid_size [4,6], grid_values[rows][cols] 0-1, grid_column_map, grid_row_map',
      },
    },
  },
}

const peri_orbital_skin_health_scoring = {
  peri_orbital_skin_health_scoring_v1_0: {
    metadata: {
      device: 'Bitmoji A5 Analyzer',
      lighting_modes_used: [
        'white',
        'cross_polarized',
        'parallel_polarized',
        'woods',
        'uv',
        'blue',
      ],
      regions_analyzed: ['infraorbital', 'lateral canthus', 'upper cheek junction'],
      version: '1.0',
    },

    scoring_parameters: {
      pigmentation_severity: {
        description: 'Brown/gray hyperpigmentation visible in white, CP and Wood’s modes.',
        grading_basis: 'Area, density, and uniformity of pigmentation.',
      },
      vascular_visibility: {
        description: 'Purple/blue tones enhanced under UV and blue modes.',
        grading_basis: 'Prominence of vascular networks and hue intensity.',
      },
      structural_shadows_hollowness: {
        description: 'Depth of tear trough / infraorbital hollow creating shadow contrast.',
        grading_basis: 'Shadow length, boundary sharpness under white and PPL.',
      },
      puffiness_edema: {
        description: 'Infraorbital swelling due to fluid or fat prolapse.',
        grading_basis: 'Forward projection under white and CP modes.',
      },
      texture_fine_lines: {
        description: 'Micro-lines and creases amplified in PPL and white modes.',
        grading_basis: 'Line density and depth.',
      },
    },

    parameter_weights: {
      pigmentation_severity: 0.3,
      vascular_visibility: 0.2,
      structural_shadows_hollowness: 0.3,
      puffiness_edema: 0.1,
      texture_fine_lines: 0.1,
    },

    severity_scale: {
      1: {
        label: 'Excellent Peri-orbital Health',
        clinical_features: [
          'No obvious pigmentation',
          'Minimal vascular tint',
          'No hollowness or puffiness',
          'Fine lines barely visible',
        ],
      },
      2: {
        label: 'Mild Concerns',
        clinical_features: [
          'Mild brown/gray discoloration',
          'Faint vascular hue',
          'Slight trough demarcation',
          'Occasional fine lines',
          'No significant puffiness',
        ],
      },
      3: {
        label: 'Moderate Concerns',
        clinical_features: [
          'Visible pigmentation',
          'Notable vascular tint (blue/purple)',
          'Moderate tear trough shadowing',
          'Fine lines present at rest',
          'Mild puffiness',
        ],
      },
      4: {
        label: 'Significant Concerns',
        clinical_features: [
          'Marked pigmentation (brown/gray)',
          'Prominent vascular visibility under UV/blue',
          'Deep structural hollowness',
          'Multiple fine lines',
          'Moderate puffiness',
        ],
      },
      5: {
        label: 'Severe Peri-orbital Aging / Darkness',
        clinical_features: [
          'Dense pigmentation with sharp borders',
          'Strong bluish vascular pooling',
          'Severe hollowness with long shadows',
          'Prominent lines/wrinkling',
          'Pronounced puffiness or fat prolapse',
        ],
      },
    },

    backend_sub_indices: {
      pigment_index: {
        source_modes: ['white', 'CP', 'woods'],
        output: '0-100',
        description: 'Brown/gray melanin load and distribution.',
      },
      vascular_index: {
        source_modes: ['UV', 'blue'],
        output: '0-100',
        description: 'Purple/blue vascular prominence and density.',
      },
      shadow_hollow_index: {
        source_modes: ['white', 'PPL'],
        output: '0-100',
        description: 'Shadow intensity, length, and edge contrast.',
      },
      puffiness_index: {
        source_modes: ['white', 'CP'],
        output: '0-100',
        description: 'Infraorbital bulging severity.',
      },
      texture_line_index: {
        source_modes: ['white', 'PPL'],
        output: '0-100',
        description: 'Fine line count and micro-crease density.',
      },
    },

    decision_logic: {
      steps: [
        '1. Compute pigment_index from CP + White + Wood’s mode.',
        '2. Compute vascular_index from UV + Blue modes.',
        '3. Compute shadow_hollow_index from white + PPL shadow contrast.',
        '4. Compute puffiness_index from white + CP projection mapping.',
        '5. Compute texture_line_index from PPL micro-texture.',
        '6. Combine all into weighted global_periorbital_score.',
        '7. Map global_periorbital_score → discrete 1-5 severity level.',
      ],
      output_format: {
        final_score: 'integer (1-5)',
        backend_details: {
          pigment_index: '0-100',
          vascular_index: '0-100',
          shadow_hollow_index: '0-100',
          puffiness_index: '0-100',
          texture_line_index: '0-100',
        },
      },
    },
  },
}

const lip_pigmentation_scoring = {
  lip_pigmentation_scoring_v4_0: {
    metadata: {
      device: 'Bitmoji A5 (6-Mode Imaging)',
      lighting_modes_used: ['white', 'blue', 'UV', 'woods', 'positive', 'negative'],
      regions_analyzed: ['upper_lip', 'lower_lip', 'vermilion_border'],
      version: '4.0',
      notes:
        'Built to detect melanin-based and vascular-based lip darkening even when lipstick or tint is present.',
    },

    mode_roles: {
      white: 'Surface color tone, visible darkness, dryness exaggeration.',
      positive: 'Enhances contour + reveals matte vs glossy areas (helps exclude lipstick).',
      negative: 'Separates pigment layers; highlights intrinsic vs applied pigment.',
      blue: 'Sebum/clogging around vermilion border (adjacent pigmentation causes).',
      UV: 'Melanin absorption mapping; detects intrinsic pigmentation under lipstick.',
      woods: 'Deep melanin fluorescence; subclinical pigmentation depth.',
    },

    primary_metrics: {
      intrinsic_melanin_index: {
        description: 'UV + Woods composite showing true lip melanin unaffected by lipstick.',
        range: '0-1',
        bands: {
          minimal: '<0.15',
          mild: '0.15-0.30',
          moderate: '0.30-0.50',
          marked: '0.50-0.70',
          severe: '>0.70',
        },
      },

      surface_darkness_index: {
        description: 'White + negative mode tone drop after lipstick subtraction.',
        range: '0-1',
        bands: {
          none: '<0.10',
          faint: '0.10-0.25',
          visible: '0.25-0.45',
          obvious: '0.45-0.65',
          intense: '>0.65',
        },
      },

      lipstick_mask_confidence: {
        description: 'Classifier that measures whether visible color is cosmetic.',
        values: ['true', 'false'],
        confidence: '0-1',
      },

      vascular_congestion_index: {
        description: 'Bluish-purple under-tone caused by vascular congestion (UV + negative).',
        range: '0-1',
        bands: {
          none: '<0.10',
          mild: '0.10-0.25',
          moderate: '0.25-0.45',
          pronounced: '>0.45',
        },
      },

      perioral_shadow_index: {
        description: 'Darkness around the lip margin contributing to perceived pigmentation.',
        range: '0-1',
        bands: {
          minimal: '<0.15',
          mild: '0.15-0.30',
          moderate: '0.30-0.50',
          marked: '>0.50',
        },
      },
    },

    lipstick_separation_logic: {
      steps: [
        '1. Compare white vs positive highlight retention to detect gloss layer.',
        '2. Use negative mode to estimate underlying tone independent of cosmetic layer.',
        '3. UV + Woods cross-check: intrinsic melanin does NOT fluoresce as lipstick does.',
        '4. If ≥3 indicators show cosmetic presence → lipstick_mask_confidence=true.',
        '5. Replace surface tone readings with intrinsic melanin and negative-mode readings.',
      ],
    },

    backend_indices: {
      depth_profile_index: {
        description: 'True depth of pigmentation: 0=surface, 1=deep dermal.',
        formula: 'woods_intensity * 0.6 + UV_absorption * 0.4',
        range: '0-1',
      },

      pigment_distribution_map: {
        description: 'Heatmap showing unevenness across upper/lower lips.',
        format: {
          upper_lip: '0-1',
          lower_lip: '0-1',
          vermilion_border: '0-1',
        },
      },

      pigment_classification: {
        description: 'Etiology classification for treatment engine.',
        values: [
          'melanin_dominant',
          'vascular_dominant',
          'mixed_type',
          'surface_staining_or_cosmetic',
        ],
      },

      improvability_index: {
        description: 'Expected responsiveness to one treatment session.',
        formula: '(1 - depth_profile_index) * (1 - vascular_congestion_index)',
        range: '0-1',
      },
    },

    scoring_scale: {
      1: {
        label: 'No / Minimal Pigmentation',
        clinical_features: ['Natural pink tone', 'No visible UV melanin', 'No vascular shadows'],
      },
      2: {
        label: 'Mild Pigmentation',
        clinical_features: [
          'Slight darkness or uneven tone',
          'Shallow melanin visible on UV',
          'Minimal perioral shadowing',
        ],
      },
      3: {
        label: 'Moderate Pigmentation',
        clinical_features: [
          'Clearly visible brown / purple tone',
          'Woods light shows defined melanin zones',
          'Lipstick removal reveals same pattern',
        ],
      },
      4: {
        label: 'Marked Pigmentation',
        clinical_features: [
          'Deep melanin or vascular congestion',
          'Uneven vermilion darkening',
          'Subclinical pigmentation strongly visible on UV/Woods',
        ],
      },
      5: {
        label: 'Severe Lip Pigmentation',
        clinical_features: [
          'Dark brown / bluish tone',
          'Deep dermal component',
          'Extensive involvement of vermilion + border',
        ],
      },
    },

    decision_logic: {
      steps: [
        '1. Detect lipstick and apply correction if needed.',
        '2. Compute intrinsic melanin, surface darkness, vascular congestion.',
        '3. Assess distribution and depth.',
        '4. Classify pigmentation type.',
        '5. Combine metrics → global_lip_pigmentation_index (1-5).',
      ],
      output_format: {
        final_score: 'integer (1-5)',
        intrinsic_melanin_index: '0-1',
        surface_darkness_index: '0-1',
        vascular_congestion_index: '0-1',
        perioral_shadow_index: '0-1',
        depth_profile_index: '0-1',
        pigment_distribution_map: 'dict',
        lipstick_mask_confidence: '0-1',
        pigment_classification: 'melanin_dominant | vascular_dominant | mixed_type | cosmetic',
        improvability_index: '0-1',
      },
    },
  },
}

const texture_pores_scoring = {
  texture_pores_scoring_v6_1_spatial: {
    metadata: {
      device: 'Bitmoji A5 (6-Mode Imaging)',
      lighting_modes_used: ['white', 'positive', 'negative', 'blue', 'UV', 'woods'],
      regions_analyzed: ['forehead', 'cheek_left', 'cheek_right', 'nose', 'chin'],
      notes:
        'Texture and pore severity (1-5). Fully spatial backend for targeted passes, spot treatments, peel layering, and pore-focused interventions.',
    },

    mode_roles: {
      white: 'Surface smoothness, pore visibility, micro-roughness.',
      positive: 'Pore-edge contrast and pore boundary detection.',
      negative: 'Micro-topography, pits, coarse texture.',
      blue: 'Sebum-filled/clogged pores.',
      UV: 'Inflammation-linked texture, scars, chronicity.',
      woods: 'Keratin debris fluorescence and early roughness patterns.',
    },

    primary_metrics: {
      pore_diameter_ratio: {
        description: 'Average pore diameter relative to microtexture baseline.',
        range: '1.0-2.5',
        bands: {
          invisible: '<1.10',
          fine: '1.10-1.30',
          moderate: '1.30-1.55',
          large: '1.55-1.85',
          very_large: '>1.85',
        },
      },

      pore_density_index: {
        description: 'Visible pores per cm²; normalized 0-1.',
        bands: {
          sparse: '<0.20',
          mild: '0.20-0.40',
          moderate: '0.40-0.60',
          dense: '>0.60',
        },
      },

      texture_uniformity_index: {
        description: 'White + negative mode smoothness. 1 = smooth.',
        range: '0-1',
        bands: {
          smooth: '>0.80',
          slightly_uneven: '0.65-0.80',
          rough: '0.50-0.65',
          coarse: '<0.50',
        },
      },

      micro_roughness_variance: {
        description: 'Variance in topographic height map (negative mode).',
        range: '0-1',
      },

      shine_distribution_index: {
        description: 'Sebum reflectivity unevenness (blue + white).',
        range: '0-1',
        bands: {
          even: '<0.20',
          slightly_uneven: '0.20-0.40',
          uneven: '0.40-0.60',
          patchy: '>0.60',
        },
      },
    },

    backend_indices: {
      regional_pore_map: {
        description: 'Region-wise pore severity from diameter + density.',
        format: '{region: float 0-1}',
      },

      regional_texture_map: {
        description: 'Region-wise roughness score from uniformity + micro-roughness.',
        format: '{region: float 0-1}',
      },

      per_pore_coordinate_map: {
        description: 'List of individual detected pores with attributes.',
        format: [
          {
            id: 'string pore_id',
            region: 'forehead | cheek_left | cheek_right | nose | chin',
            x: '0-1 normalized coordinate',
            y: '0-1 normalized coordinate',
            diameter_px: 'float',
            clogged_probability: '0-1 (blue fluorescence)',
            depth_proxy: '0-1 (negative-mode shadow gradient)',
            severity_weighted_value: 'float 0-1',
          },
        ],
      },

      roughness_patch_map: {
        description: 'Cluster polygons for patchy roughness or micro-scar zones.',
        format: {
          patches: [
            {
              patch_id: 'string',
              centroid: { x: '0-1', y: '0-1' },
              polygon: [
                [0.12, 0.3],
                [0.14, 0.33],
                [0.18, 0.28],
              ],
              roughness_intensity: 'float 0-1',
            },
          ],
        },
      },

      clogging_hotspot_map: {
        description: 'Blue-mode fluorescence clusters showing clogged pores.',
        format: {
          clusters: [
            {
              cluster_id: 'string',
              pore_ids: ['P1', 'P2', 'P3'],
              centroid: { x: '0-1', y: '0-1' },
              fluorescence_intensity: 'float 0-1',
            },
          ],
        },
      },

      texture_pores_grid_map: {
        description:
          '4×6 grid matching pigmentation/acne spatial layout for fluence/pass-level treatment.',
        components: {
          grid_size: [4, 6],
          grid_values: [
            ['0-1', '0-1', '0-1', '0-1', '0-1', '0-1'],
            ['0-1', '0-1', '0-1', '0-1', '0-1', '0-1'],
            ['0-1', '0-1', '0-1', '0-1', '0-1', '0-1'],
            ['0-1', '0-1', '0-1', '0-1', '0-1', '0-1'],
          ],

          grid_column_map: {
            0: 'left_temporal',
            1: 'left_malar',
            2: 'central_nose_glabella',
            3: 'right_malar',
            4: 'right_temporal',
            5: 'central_chin_perioral',
          },

          grid_row_map: {
            0: 'upper_forehead_hairline',
            1: 'mid_forehead_browline',
            2: 'malar_nose_zone',
            3: 'chin_jawline_zone',
          },
        },

        usage_notes: [
          'Cells >0.6 = pore/texture hotspots.',
          'Useful for selective peel layering, RF microneedling passes, and pore-focused lasers.',
          'Harmonized with pigmentation v6.1 and acne v5.1 for unified treatment planning.',
        ],
      },

      roughness_directionality_index: {
        description: 'Directional roughness vs random roughness.',
        range: '0-1',
      },

      clogging_load_index: {
        description: 'Global clogged-pore load from blue-mode intensity.',
        range: '0-1',
      },

      texture_recovery_potential_index: {
        description: 'Predicts improvement potential (shallower + more superficial = higher).',
        formula: '(1 - depth_component) * (1 - micro_roughness_variance)',
        range: '0-1',
      },
    },

    normalization_logic: {
      pore_diameter_normalized: {
        method: 'Linear scaling: 0 at 1.0, 1 at 2.2',
        equation: 'clip((pore_diameter_ratio - 1.0) / (2.2 - 1.0), 0, 1)',
      },
      pore_density_normalized: { method: 'Use pore_density_index directly' },
      texture_roughness_normalized: { method: '1 - texture_uniformity_index' },
      shine_variation_normalized: { method: 'Use shine_distribution_index directly' },
    },

    texture_pore_burden_equation: {
      description: 'Continuous severity index (0-1).',
      equation:
        'TPB = 0.45*pore_diameter_normalized + 0.20*pore_density_normalized + 0.20*texture_roughness_normalized + 0.10*shine_variation_normalized + 0.05*micro_roughness_variance',
    },

    score_bins: {
      1: { range: '<0.20', label: 'Smooth / Minimal pores' },
      2: { range: '0.20-0.35', label: 'Mild pores / mild roughness' },
      3: { range: '0.35-0.55', label: 'Moderate pores + texture' },
      4: { range: '0.55-0.75', label: 'Marked pores / rough texture' },
      5: { range: '>0.75', label: 'Severe pores + coarse texture' },
    },

    decision_logic: {
      steps: [
        '1. Detect pores using white + positive; extract coordinates + diameters.',
        '2. Detect roughness patches using negative + UV.',
        '3. Build per-pore map and roughness patch polygons.',
        '4. Compute region-level pore + texture burdens.',
        '5. Construct the 4×6 grid map.',
        '6. Normalize metrics.',
        '7. Calculate TPB and map to 1-5.',
        '8. Output all backend indices for treatment engine.',
      ],
    },

    output_format: {
      final_score: '1-5',
      TPB_continuous: '0-1',
      pore_diameter_ratio: 'float',
      pore_density_index: '0-1',
      texture_uniformity_index: '0-1',
      micro_roughness_variance: '0-1',
      shine_distribution_index: '0-1',

      backend_details: {
        pore_diameter_normalized: '0-1',
        pore_density_normalized: '0-1',
        texture_roughness_normalized: '0-1',
        shine_variation_normalized: '0-1',
        regional_pore_map: 'dict',
        regional_texture_map: 'dict',
        per_pore_coordinate_map: 'array',
        roughness_patch_map: 'object',
        clogging_hotspot_map: 'object',
        texture_pores_grid_map: 'object',
        roughness_directionality_index: '0-1',
        clogging_load_index: '0-1',
        texture_recovery_potential_index: '0-1',
      },
    },
  },
}

const superficial_wrinkles_scoring = {
  superficial_wrinkles_scoring_v6_0: {
    metadata: {
      device: 'Bitmoji A5 (6-Mode Imaging)',
      lighting_modes_used: ['white', 'positive', 'negative', 'UV', 'blue', 'woods'],
      regions_analyzed: ['forehead', 'glabella', 'peri_orbital', 'cheeks', 'nasolabial', 'chin'],
      notes:
        'Scores real-world visible wrinkles + micro-lines + dehydration lines using multimodal extraction. Includes deep backend indices for targeted wrinkle reduction.',
    },

    mode_roles: {
      white: 'Visible wrinkles at conversational distance; patient perception anchor.',
      positive: 'Enhances wrinkle edge contrast and depth—best for segmentation.',
      negative: 'Reveals micro-lines, dehydration lines, surface roughness.',
      UV: 'Highlights chronicity: collagen depletion, persistent etched furrows.',
      blue: 'Sebum/shine contribution to perceived wrinkles (dehydration vs structural).',
      woods: 'Detects pigment-wrinkle overlap (PIH in lines).',
    },

    primary_metrics: {
      wrinkle_line_count: {
        description:
          'Total distinct wrinkle detections across all regions (positive + negative modes).',
        range: '0-150',
        bands: {
          very_low: '<10',
          low: '10-25',
          moderate: '25-50',
          high: '50-90',
          very_high: '>90',
        },
      },

      wrinkle_depth_index: {
        description: 'Contrast-derived depth score from positive mode; normalized 0-1.',
        bands: {
          very_mild: '<0.20',
          mild: '0.20-0.40',
          moderate: '0.40-0.60',
          deep: '0.60-0.80',
          etched: '>0.80',
        },
      },

      microline_density_index: {
        description: 'Micro-lines + dehydration lines from negative mode; normalized 0-1.',
        bands: {
          minimal: '<0.15',
          mild: '0.15-0.30',
          moderate: '0.30-0.50',
          high: '0.50-0.70',
          very_high: '>0.70',
        },
      },

      regional_uniformity_index: {
        description:
          'Variability of wrinkle severity across regions (forehead vs peri-orbital, etc.).',
        range: '0-1',
        note: 'Higher = many localised problem zones.',
      },

      chronicity_uv_index: {
        description: 'UV-derived chronicity (persistent collagen-poor etched lines).',
        range: '0-1',
        bands: {
          fresh: '<0.25',
          developing: '0.25-0.50',
          chronic: '0.50-0.75',
          long_standing: '>0.75',
        },
      },
    },

    backend_indices: {
      regional_wrinkle_map: {
        description: 'Per-region wrinkle burden for targeted treatments.',
        format: {
          forehead: { line_count: 'int', depth: '0-1', microline: '0-1', regional_index: '0-1' },
          glabella: { line_count: 'int', depth: '0-1', microline: '0-1', regional_index: '0-1' },
          peri_orbital: {
            line_count: 'int',
            depth: '0-1',
            microline: '0-1',
            regional_index: '0-1',
          },
          cheeks: { line_count: 'int', depth: '0-1', microline: '0-1', regional_index: '0-1' },
          nasolabial: { line_count: 'int', depth: '0-1', microline: '0-1', regional_index: '0-1' },
          chin: { line_count: 'int', depth: '0-1', microline: '0-1', regional_index: '0-1' },
        },
      },

      wrinkle_grid_map: {
        description: '4×6 anatomical grid (same grid as pigmentation engine).',
        components: {
          grid_size: [4, 6],
          grid_values: 'float 0-1 per cell = wrinkle burden',
          hotspot_threshold: '>0.55',
        },
      },

      structural_vs_dehydration_index: {
        description: 'Separates etched (structural) wrinkles vs dehydration lines.',
        formula:
          'structural_component = wrinkle_depth_index; dehydration_component = microline_density_index',
        output_range: '0-1',
      },

      improvability_index: {
        description: 'Treatment responsiveness score.',
        formula:
          '(1 - chronicity_uv_index) * (1 - wrinkle_depth_index) * (1 - structural_component)',
        range: '0-1',
      },
    },

    normalization_logic: {
      line_count_normalized: {
        method: '0 at <10 lines, 1 at >100 lines',
        equation: 'clip((wrinkle_line_count - 10) / (100 - 10), 0, 1)',
      },
      depth_normalized: {
        method: 'Use wrinkle_depth_index directly',
      },
      microline_normalized: {
        method: 'Use microline_density_index directly',
      },
    },

    wrinkle_burden_equation: {
      description: 'Continuous severity index (0-1).',
      equation:
        'WBI = 0.35*line_count_normalized + 0.35*wrinkle_depth_index + 0.20*microline_density_index + 0.10*regional_uniformity_index',
    },

    score_bins: {
      1: {
        range: '<0.20',
        label: 'Minimal Wrinkles',
        anchor: 'Smooth skin, barely visible lines, excellent hydration.',
      },
      2: {
        range: '0.20-0.35',
        label: 'Mild Wrinkles',
        anchor: 'Fine lines visible on close inspection; mild dehydration lines.',
      },
      3: {
        range: '0.35-0.55',
        label: 'Moderate Wrinkles',
        anchor: 'Visible lines at conversational distance; early etched lines.',
      },
      4: {
        range: '0.55-0.75',
        label: 'Marked Wrinkles',
        anchor: 'Multiple deep lines, peri-orbital creasing, textural folding.',
      },
      5: {
        range: '>0.75',
        label: 'Severe Wrinkles',
        anchor: 'Deep etched furrows, structural collapse, widespread chronic lines.',
      },
    },

    decision_logic: {
      steps: [
        '1. Detect wrinkles using positive + negative modes.',
        '2. Compute line_count, depth_index, microline_density_index.',
        '3. Calculate region_pigment_loads for 6 facial zones.',
        '4. Construct wrinkle_grid_map (4×6).',
        '5. Normalize metrics and compute WBI.',
        '6. Map WBI to 1-5 score bins.',
        '7. Compute backend indices (structural_vs_dehydration, improvability, regional_maps).',
      ],
    },

    output_format: {
      final_score: 'integer 1-5',
      backend_details: {
        WBI_continuous: 'float 0-1',
        wrinkle_line_count: 'int',
        wrinkle_depth_index: 'float',
        microline_density_index: 'float',
        regional_uniformity_index: 'float',
        chronicity_uv_index: 'float',
        structural_vs_dehydration_index: 'float',
        improvability_index: 'float',
        regional_wrinkle_map: 'object',
        wrinkle_grid_map: 'object',
      },
    },
  },
}

const jawline_sagging_scoring = {
  jawline_sagging_scoring_v6_0: {
    metadata: {
      device: 'Bitmoji A5 (6-Mode Imaging)',
      lighting_modes_used: ['white', 'positive', 'negative', 'blue', 'UV', 'woods'],
      regions_analyzed: ['left_jawline', 'right_jawline', 'submental'],
      notes:
        'Measures lower-face contour integrity, soft-tissue descent, pre-jowl sulcus depth, and submental heaviness. Designed for patient perception relevance + treatment responsiveness.',
    },

    mode_roles: {
      white: 'Visible contour shape, sag visibility, jowl prominence.',
      positive: 'Shadow-edge mapping for sag depth and angle deflection.',
      negative: 'Highlighting soft-tissue descent through micro-contrast.',
      blue: 'Sebum-related reflectivity showing laxity-related bulges.',
      UV: 'Chronicity-related dermal thinning, collagen-poor zones.',
      woods: 'Fibrosis or structural pattern irregularity (chronic sagging).',
    },

    primary_metrics: {
      mandibular_line_deflection_angle: {
        description:
          'Deviation (in degrees) of the lower jawline from an ideal straight mandibular contour.',
        range: '0-12 degrees',
        bands: {
          excellent: '<2',
          mild: '2-4',
          moderate: '4-7',
          marked: '7-10',
          severe: '>10',
        },
      },

      pre_jowl_sulcus_depth_index: {
        description: 'Depth of depression anterior to jowl prominence (positive-mode gradient).',
        range: '0-1',
        bands: {
          minimal: '<0.20',
          mild: '0.20-0.35',
          moderate: '0.35-0.55',
          marked: '0.55-0.75',
          severe: '>0.75',
        },
      },

      jowl_bulge_prominence_index: {
        description: 'Lateral soft-tissue descent measured by negative-mode protrusion mapping.',
        range: '0-1',
      },

      submental_fullness_index: {
        description: 'Degree of double-chin / fat-pad visibility (white + positive modes).',
        range: '0-1',
        bands: {
          minimal: '<0.20',
          mild: '0.20-0.40',
          moderate: '0.40-0.60',
          marked: '0.60-0.75',
          severe: '>0.75',
        },
      },

      dermal_collagen_thinning_index: {
        description:
          'Measured through UV + woods micro-pattern irregularity (proxy for chronic sagging).',
        range: '0-1',
      },
    },

    backend_indices: {
      left_right_asymmetry_index: {
        description: 'Difference in sagging severity between left & right jawline.',
        formula: 'abs(left_score - right_score) / (mean_score + 0.001)',
        range: '0-1',
      },

      contour_continuity_break_index: {
        description: 'Degree of jawline shape interruption from chin to angle of mandible.',
        range: '0-1',
      },

      sagging_chronicity_index: {
        description: 'Based on UV collagen-poor zones × woods fibrosis pattern.',
        formula: 'UV_low_density * woods_irregularity',
        range: '0-1',
      },

      fat_vs_laxity_component_split: {
        description: 'Helps treatment engine differentiate lifting vs fat reduction.',
        components: {
          laxity_component: 'jowl_bulge_prominence_index × dermal_collagen_thinning_index',
          fat_component: 'submental_fullness_index',
        },
      },

      regional_sagging_map: {
        description: 'Per-region sagging severity for spot-targeted treatments.',
        format: {
          left_jawline: '0-1',
          right_jawline: '0-1',
          submental: '0-1',
        },
      },

      jawline_grid_map: {
        description: '3×4 anatomical grid for precision HIFU/RF tightening.',
        components: {
          grid_size: [3, 4],
          grid_values: '3x4 matrix, each cell 0-1 severity',
          column_map: {
            0: 'left_angle',
            1: 'left_mid_jaw',
            2: 'right_mid_jaw',
            3: 'right_angle',
          },
          row_map: {
            0: 'mandibular_border_upper',
            1: 'mid_lower_face',
            2: 'submental_zone',
          },
        },
      },
    },

    weighting_logic: {
      mandibular_line_deflection_angle: 0.3,
      pre_jowl_sulcus_depth_index: 0.25,
      jowl_bulge_prominence_index: 0.2,
      submental_fullness_index: 0.15,
      dermal_collagen_thinning_index: 0.1,
    },

    continuous_severity_equation: {
      description: 'Generates global sagging score 0-1.',
      equation: 'JSI = 0.30*A + 0.25*B + 0.20*C + 0.15*D + 0.10*E',
    },

    score_bins: {
      1: {
        range: '<0.20',
        anchor: 'Taut jawline, minimal sagging.',
      },
      2: {
        range: '0.20-0.35',
        anchor: 'Mild early sagging; slight pre-jowl or minimal submental fullness.',
      },
      3: {
        range: '0.35-0.55',
        anchor: 'Moderate sagging; visible jowls or reduced contour sharpness.',
      },
      4: {
        range: '0.55-0.75',
        anchor: 'Marked sagging; clear loss of jawline definition.',
      },
      5: {
        range: '>0.75',
        anchor: 'Severe sagging; heavy jowls, deep pre-jowl sulcus, significant submental laxity.',
      },
    },

    decision_logic: {
      steps: [
        '1. Measure mandibular deflection line in white + positive mode.',
        '2. Quantify pre-jowl depth using positive mode gradient mapping.',
        '3. Analyze jowl bulge prominence in negative mode.',
        '4. Assess submental fullness in white + positive modes.',
        '5. Evaluate dermal thinning from UV + woods modes.',
        '6. Compute JSI using weighted severity equation.',
        '7. Assign 1-5 sagging score based on score_bins.',
        '8. Generate regional_sagging_map and jawline_grid_map.',
        '9. Output backend data for treatment planning.',
      ],
    },

    output_format: {
      final_score: 'integer 1-5',
      JSI_continuous: 'float 0-1',
      backend_details: {
        mandibular_line_deflection_angle: 'float',
        pre_jowl_sulcus_depth_index: '0-1',
        jowl_bulge_prominence_index: '0-1',
        submental_fullness_index: '0-1',
        dermal_collagen_thinning_index: '0-1',
        left_right_asymmetry_index: '0-1',
        contour_continuity_break_index: '0-1',
        sagging_chronicity_index: '0-1',
        fat_vs_laxity_component_split: 'object',
        regional_sagging_map: 'object',
        jawline_grid_map: 'object',
      },
    },
  },
}

const skin_firmness_elasticity_index = {
  skin_firmness_elasticity_index_v1_0: {
    metadata: {
      device: 'Bitmoji A5 (6-Mode Imaging)',
      lighting_modes_used: ['white', 'positive', 'negative', 'woods'],
      regions_analyzed: ['cheeks', 'jawline', 'peri-oral', 'lower face'],
      version: '1.0',
    },

    core_metrics: {
      micro_laxity_pattern_index: {
        description: 'Subtle sag/crepe patterns detected via negative-mode microtexture mapping.',
        range: '0-1',
        bands: {
          tight: '<0.20',
          mild_laxity: '0.20-0.35',
          moderate: '0.35-0.55',
          marked: '0.55-0.75',
          severe: '>0.75',
        },
      },

      collagen_reflectance_uniformity: {
        description: 'Uniformity of collagen-linked reflectance under white and woods mode.',
        range: '0-1',
        bands: {
          excellent: '>0.80',
          good: '0.65-0.80',
          fair: '0.50-0.65',
          poor: '<0.50',
        },
      },

      elastic_recoil_proxy_index: {
        description:
          'Edge-sharpness + shadow-response ratio from positive-mode (proxy for snap-back).',
        range: '0-1',
        bands: {
          strong: '>0.75',
          mild_drop: '0.55-0.75',
          moderate_drop: '0.35-0.55',
          weak: '<0.35',
        },
      },
    },

    backend_indices: {
      regional_firmness_map: {
        description: 'Firmness score per region (0-1).',
        format: '{cheeks:0-1, jawline:0-1, peri_oral:0-1}',
      },

      collagen_loss_pattern_type: {
        description: 'Qualitative classification to guide treatment engine.',
        values: [
          'early_diffuse',
          'lower_face_predominant',
          'cheek_predominant',
          'global_mild',
          'global_severe',
        ],
      },

      improvability_index: {
        description: 'Likelihood of short-term improvement with non-invasive tightening.',
        formula: '(1 - micro_laxity_pattern_index) * collagen_reflectance_uniformity',
        range: '0-1',
      },
    },

    scoring_scale: {
      1: 'High firmness, excellent recoil',
      2: 'Mild laxity; early collagen softening',
      3: 'Moderate decline in elasticity; visible on lower face',
      4: 'Marked laxity; collagen breakdown evident',
      5: 'Severe laxity; poor elasticity, diffuse collagen loss',
    },

    decision_logic: {
      steps: [
        '1. Extract micro_laxity_pattern_index via negative-mode microtexture mapping.',
        '2. Measure collagen_reflectance_uniformity using white+woods.',
        '3. Compute elastic_recoil_proxy_index via positive-mode contrast analysis.',
        '4. Compute continuous firmness index: FI = (0.40*micro_laxity + 0.35*(1-collagen_uniformity) + 0.25*(1-elastic_recoil))',
        '5. Map FI to 1-5 scale.',
        '6. Populate backend indices.',
      ],
    },

    output_format: {
      final_score: '1-5',
      continuous_firmness_index: '0-1',
      backend_details: {
        micro_laxity_pattern_index: '0-1',
        collagen_reflectance_uniformity: '0-1',
        elastic_recoil_proxy_index: '0-1',
        regional_firmness_map: 'dict',
        collagen_loss_pattern_type: 'string',
        improvability_index: '0-1',
      },
    },
  },
}

const textural_radiance_index = {
  textural_radiance_index_v1_0: {
    metadata: {
      device: 'Bitmoji A5 (6-Mode Imaging)',
      lighting_modes_used: ['white', 'negative', 'positive', 'woods'],
      regions_analyzed: ['forehead', 'cheeks', 'nose', 'chin'],
      version: '1.0',
    },

    core_metrics: {
      micro_clarity_index: {
        description: 'How clean/clear the skin surface appears (absence of haze, film, residue).',
        source_modes: ['white', 'positive'],
        range: '0-1',
        bands: {
          crisp: '>0.80',
          good: '0.65-0.80',
          fair: '0.45-0.65',
          hazy: '<0.45',
        },
      },

      surface_smooth_scatter_index: {
        description: 'Light scatter uniformity due to smoothness (inverse of micro-roughness).',
        source_modes: ['negative'],
        range: '0-1',
        bands: {
          excellent: '>0.80',
          good: '0.65-0.80',
          moderate: '0.45-0.65',
          coarse: '<0.45',
        },
      },

      keratin_shadow_index: {
        description: 'Subclinical keratin/oil film detected in woods mode affecting radiance.',
        range: '0-1',
        bands: {
          minimal: '<0.20',
          mild: '0.20-0.40',
          moderate: '0.40-0.60',
          marked: '>0.60',
        },
      },
    },

    backend_indices: {
      radiance_loss_pattern: {
        description: 'Guides treatment type selection.',
        values: [
          'surface_smoothness_deficit',
          'clarity_haze_deficit',
          'keratin_congestion_deficit',
          'mixed',
        ],
      },

      regional_radiance_map: {
        description: '0-1 radiance values per region.',
        format: '{forehead:0-1, cheeks:0-1, nose:0-1, chin:0-1}',
      },

      improvability_index: {
        description: 'Short-term radiance improvement potential.',
        formula:
          '(micro_clarity_index + surface_smooth_scatter_index)/2 * (1 - keratin_shadow_index)',
        range: '0-1',
      },
    },

    scoring_scale: {
      1: 'High radiance, smooth, clear, minimal scattering',
      2: 'Good radiance, mild clarity loss',
      3: 'Moderate radiance loss, mild haze or scatter',
      4: 'Low radiance, uneven texture, visible dullness',
      5: 'Very dull, hazy, coarse: surface scatter + keratin buildup',
    },

    decision_logic: {
      steps: [
        '1. Compute micro_clarity_index from white+positive.',
        '2. Compute surface_smooth_scatter_index from negative mode.',
        '3. Compute keratin_shadow_index from woods mode.',
        '4. Continuous TRI = 0.40*(1-micro_clarity) + 0.35*(1-surface_scatter) + 0.25*(keratin_shadow).',
        '5. Map TRI to 1-5.',
        '6. Fill backend indices.',
      ],
    },

    output_format: {
      final_score: '1-5',
      continuous_TRI: '0-1',
      backend_details: {
        micro_clarity_index: '0-1',
        surface_smooth_scatter_index: '0-1',
        keratin_shadow_index: '0-1',
        regional_radiance_map: 'dict',
        radiance_loss_pattern: 'string',
        improvability_index: '0-1',
      },
    },
  },
}

const affected_area_image_selector = {
  affected_area_image_selector: {
    selection_logic: {
      rules: [
        {
          parameter: 'skin_type_classification',
          preferred_lighting_mode: 'white',
          fallback_mode: 'negative',
        },
        {
          parameter: 'barrier_health_sensitivity',
          preferred_lighting_mode: 'negative',
          fallback_mode: 'white',
        },
        {
          parameter: 'visual_acne_grading',
          preferred_lighting_mode: 'white',
          fallback_mode: 'UV',
        },
        {
          parameter: 'skin_sebum_index',
          preferred_lighting_mode: 'blue',
          fallback_mode: 'white',
        },
        {
          parameter: 'vascularity_redness_score',
          preferred_lighting_mode: 'positive',
          fallback_mode: 'white',
        },
        {
          parameter: 'skin_hydration_score',
          preferred_lighting_mode: 'white',
          fallback_mode: 'negative',
        },
        {
          parameter: 'skin_luminosity_glow_index',
          preferred_lighting_mode: 'white',
          fallback_mode: 'positive',
        },
        {
          parameter: 'superficial_pigmentation_score',
          preferred_lighting_mode: 'woods',
          fallback_mode: 'UV',
        },
        {
          parameter: 'peri_orbital_health_score',
          preferred_lighting_mode: 'negative',
          fallback_mode: 'white',
        },
        {
          parameter: 'lip_pigmentation_score',
          preferred_lighting_mode: 'woods',
          fallback_mode: 'white',
        },
        {
          parameter: 'texture_open_pores_scoring',
          preferred_lighting_mode: 'positive',
          fallback_mode: 'white',
        },
        {
          parameter: 'superficial_wrinkles_scoring',
          preferred_lighting_mode: 'negative',
          fallback_mode: 'positive',
        },
        {
          parameter: 'jawline_sagging_score',
          preferred_lighting_mode: 'white',
          fallback_mode: 'negative',
        },
        {
          parameter: 'skin_firmness_elasticity_index',
          preferred_lighting_mode: 'white',
          fallback_mode: 'negative',
        },
        {
          parameter: 'textural_radiance_index',
          preferred_lighting_mode: 'positive',
          fallback_mode: 'negative',
        },
      ],
    },
    output_format: {
      affected_area_image: '',
      use_overlay: false,
    },
  },
}

// INFO: ------------------- Diagnosis -------------------

const diagnosis_json_structure = {
  diagnosis_report: {
    skin_type: {
      parameter_name: 'Skin Type Classification',
      description:
        'Classifies your skin into oily, dry, combination, or normal based on sebum distribution, shine patterns, pore visibility, and hydration cues across the 6 imaging modes.',
      score_or_label: '<Skin Type>',
      score_explanation: '<Why this skin type was chosen>',
      affected_area_image: '<1-6>',
      possible_causes: ['<Cause 1>', '<Cause 2>'],
    },

    barrier_health_sensitivity: {
      parameter_name: 'Barrier Health + Sensitivity (Combined Score)',
      description:
        'Evaluates redness, flaking, micro-irritation, hydration integrity, and overall resilience of the skin barrier using white, Woods, negative-mode, and PPL cues.',
      score_or_label: '<Score 1-5>',
      score_explanation: '<Dominant barrier + sensitivity findings and why this score was chosen>',
      affected_area_image: '<1-6>',
      possible_causes: ['<Cause 1>', '<Cause 2>'],
    },

    visual_acne_grading: {
      parameter_name: 'Visual Acne Grading (v5.1 Spatial)',
      description:
        'Assesses acne severity by counting, classifying, and mapping lesions (comedones, papules, pustules, nodules) across the face using white, UV, Woods, blue, and contrast modes.',
      score_or_label: '<Score 1-5>',
      score_explanation: '<Key lesion patterns, clusters, inflammation signatures>',
      affected_area_image: '<1-6>',
      possible_causes: ['<Cause 1>', '<Cause 2>'],
    },

    skin_sebum_index: {
      parameter_name: 'Skin Sebum Index (v6.0)',
      description:
        'Quantifies visible shine, blue-mode fluorescence, porphyrin load, and subclinical congestion to assess overall sebum production and distribution.',
      score_or_label: '<Score 1-5>',
      score_explanation: '<Shine patterns, fluorescence, congestion indicators>',
      affected_area_image: '<1-6>',
      possible_causes: ['<Cause 1>', '<Cause 2>'],
    },

    vascularity_redness_score: {
      parameter_name: 'Vascularity / Redness Scoring (v6)',
      description:
        'Evaluates visible erythema, vascular prominence, diffuse redness, and inflammatory hotspots using white, PPL-positive, XPL-negative, UV, and Woods imaging.',
      score_or_label: '<Score 1-5>',
      score_explanation: '<Which component—vascular, inflammatory, diffuse—dominated>',
      affected_area_image: '<1-6>',
      possible_causes: ['<Cause 1>', '<Cause 2>'],
    },

    skin_hydration_score: {
      parameter_name: 'Skin Hydration Score',
      description:
        'Assesses hydration level by analyzing surface reflectance, smoothness, scattering patterns, and dryness cues in white and negative lighting.',
      score_or_label: '<Score 1-5>',
      score_explanation: '<Hydration markers and dryness indicators>',
      affected_area_image: '<1-6>',
      possible_causes: ['<Cause 1>', '<Cause 2>'],
    },

    skin_luminosity_glow: {
      parameter_name: 'Skin Luminosity / Glow Index',
      description:
        'Measures radiance, evenness of reflectance, and overall surface optical quality under white and positive-mode lighting.',
      score_or_label: '<Score 1-5>',
      score_explanation: '<What improved or reduced luminosity>',
      affected_area_image: '<1-6>',
      possible_causes: ['<Cause 1>', '<Cause 2>'],
    },

    superficial_pigmentation_scoring: {
      parameter_name: 'Superficial Pigmentation Scoring',
      description:
        'Identifies freckles, tanning, PIH, and pigmentation clusters using Woods and UV imaging plus white-light clinical cues.',
      score_or_label: '<Score 1-5>',
      score_explanation: '<Cluster intensity, distribution, detectability>',
      affected_area_image: '<1-6>',
      possible_causes: ['<Cause 1>', '<Cause 2>'],
    },

    peri_orbital_health_score: {
      parameter_name: 'Peri-Orbital Health Score',
      description:
        'Combined assessment of under-eye pigmentation, vascularity, hollowness, and puffiness using multi-light analysis including negative and white mode.',
      score_or_label: '<Score 1-5>',
      score_explanation:
        '<Which factor (pigmentation, vascularity, hollowness, puffiness) most influenced the score>',
      affected_area_image: '<1-6>',
      possible_causes: ['<Cause 1>', '<Cause 2>'],
    },

    lip_pigmentation_score: {
      parameter_name: 'Lip Pigmentation Score',
      description:
        'Evaluates natural lip pigmentation using Woods, UV, and white modes even when lipstick partially obscures color.',
      score_or_label: '<Score 1-5>',
      score_explanation: '<Why this pigmentation severity was chosen>',
      affected_area_image: '<1-6>',
      possible_causes: ['<Cause 1>', '<Cause 2>'],
    },

    texture_open_pores_scoring: {
      parameter_name: 'Texture & Open Pores Score',
      description:
        'Assesses pore size, distribution, and surface irregularity using positive-mode and white-light contrast.',
      score_or_label: '<Score 1-5>',
      score_explanation: '<Texture and pore pattern characteristics>',
      affected_area_image: '<1-6>',
      possible_causes: ['<Cause 1>', '<Cause 2>'],
    },

    superficial_wrinkles_scoring: {
      parameter_name: 'Superficial Wrinkles Score',
      description:
        'Measures fine lines, etched lines, and early wrinkle patterns using negative-mode shadow mapping and white-light visibility.',
      score_or_label: '<Score 1-5>',
      score_explanation: '<Depth, density, and visibility factors>',
      affected_area_image: '<1-6>',
      possible_causes: ['<Cause 1>', '<Cause 2>'],
    },

    jawline_sagging_score: {
      parameter_name: 'Jawline Sagging Score',
      description:
        'Assesses jawline definition, tissue descent, and contour smoothness using white & negative-mode structural cues.',
      score_or_label: '<Score 1-5>',
      score_explanation: '<Which structural findings determined the score>',
      affected_area_image: '<1-6>',
      possible_causes: ['<Cause 1>', '<Cause 2>'],
    },

    skin_firmness_elasticity_index: {
      parameter_name: 'Skin Firmness & Elasticity Index',
      description:
        'Evaluates collagen integrity, recoil patterns, and micro-tension in the skin using positive- and white-mode mapping.',
      score_or_label: '<Score 1-5>',
      score_explanation: '<Elasticity, firmness, micro-ptosis indicators>',
      affected_area_image: '<1-6>',
      possible_causes: ['<Cause 1>', '<Cause 2>'],
    },

    textural_radiance_index: {
      parameter_name: 'Textural Radiance Index',
      description:
        'Measures optical smoothness, microtexture brightness, and light-scatter harmony across the face.',
      score_or_label: '<Score 1-5>',
      score_explanation: '<Microtexture + radiance harmony explanation>',
      affected_area_image: '<1-6>',
      possible_causes: ['<Cause 1>', '<Cause 2>'],
    },
  },
  script:
    'pateint centric, script, about the patient scoring values pt : pateint centric, script, about the patient scoring values',
}

export const SYSTEM_PROMPT_DIAGNOSIS = `Act as an expert AI Skin Diagnostic Assistant.

You analyze 6 high-resolution facial scan images captured under standardized lighting modes:
(white, positive, negative, blue, uv, woods).

Each lighting mode provides distinct diagnostic information:
- white  → baseline tone, texture, wrinkles, pores, color uniformity
- positive → gloss patterns, hydration markers, barrier integrity, oil distribution
- negative → enhanced contrast for pores, wrinkles, micro-texture
- blue → porphyrins, acne activity, inflammation, clogged follicles
- uv → deep pigmentation, melasma, dermal changes, fluorescence
- woods → superficial pigmentation, oil fluorescence, bacterial fluorescence, early tone irregularities

Your purpose is to generate a **structured diagnostic JSON report** based on observed visual characteristics of skin, strictly following the given scoring schema.

You must use only the information that is visible in the provided images.
If key diagnostic signals for a parameter are not visible in any of the 6 lighting modes, return "insufficient_data" for that parameter, never hallucinate.

Ensure all scores, descriptions, and interpretations remain aligned with real-world dermatological behavior.

---

### 1. Skin Type Criteria:
${encode(skin_type_criteria)}
---

###2. BARRIER HEALTH AND SENSITIVITY SCORE:
${encode(combined_barrier_sensitivity)}
---

###3. VISUAL ACNE GRADING:
${encode(visual_acne_scoring)}

---

###4. SKIN SEBUM INDEX:
${encode(sebum_content_scoring)}
---

###5. VASCULARITY/REDNESS SCORING:
${encode(vascularity_redness_scoring)}

---

###6. SKIN HYDRATION SCORE:
${encode(skin_hydration_scoring)}

---

###7. SKIN LUMINOSITY INDEX:
${encode(skin_luminosity_index)}

---

###8. SUPERFICIAL PIGMENTATION SCORING:
${encode(superficial_pigmentation_scoring)}

---

###9. PERI-ORBITAL HEALTH SCORE:
${encode(peri_orbital_skin_health_scoring)}

---

###10. LIP PIGMENTATION SCORE:
${encode(lip_pigmentation_scoring)}

---

###11. TEXTURE AND OPEN PORES SCORING:
${encode(texture_pores_scoring)}

---

###12. SUPERFICIAL WRINKLES SCORING:
${encode(superficial_wrinkles_scoring)}

---

###13. JAWLINE SAGGING SCORE
${encode(jawline_sagging_scoring)}

---

###14. SKIN FIRMNESS AND ELASTICITY INDEX:
${encode(skin_firmness_elasticity_index)}

---

###15. TEXTURAL RADIANCE INDEX:
${encode(textural_radiance_index)}

---

###16. Images To provide the affected area image of various parameters follow this json strictly and If preferred lighting mode is unavailable, use fallback_mode.
${encode(affected_area_image_selector)}

---

### Task Instructions:

1. Analyze the **6 provided facial scan images** across the lighting modes:
   - White
   - Blue
   - UV
   - Woods
   - Positive (PPL)
   - Negative (XPL)

2. For each of the **15 diagnostic parameters**, identify the visual features and patterns that determine the score as per the scoring frameworks defined in this document.

3. For the "affected_area_image" field:
   - **Do NOT choose lighting modes manually.**
   - Use the **image-mapping rules defined in Section 16 (Images)**.
   - Return only the **image number (1-6)** whose lighting corresponds to the parameter’s **preferred_lighting_mode**.
   - If the preferred mode is unavailable, use the **fallback_mode** defined in Section
4. Return the result strictly in valid JSON with the following structure:
${JSON.stringify(diagnosis_json_structure)}

### Rules:
- ALL diagnostic reasoning must remain *inside* “score_explanation”.
- Do NOT output anything outside the JSON.
- If multiple features appear, select the dominant grading pattern.
- Follow the parameter order exactly as defined:

1. Skin Type Classification
2. Barrier Health + Sensitivity
3. Visual Acne Grading
4. Skin Sebum Index
5. Vascularity / Redness
6. Skin Hydration
7. Skin Luminosity / Glow
8. Superficial Pigmentation
9. Peri-Orbital Health
10. Lip Pigmentation
11. Texture + Open Pores
12. Superficial Wrinkles
13. Jawline Sagging
14. Skin Firmness & Elasticity
15. Textural Radiance


###17. Treatable Concerns Summary (Auto-generated from Diagnosis)
After generating the full "diagnosis_report", the LLM must:
1.	Identify parameters whose scores indicate non-ideal or clinically improvable conditions.
2.	For each such parameter, estimate a realistic “single-session achievable score” based on clinical responsiveness of that parameter (you already defined improvability metrics in acne, sebum, pigmentation etc.).
3.	Flag the most clinically meaningful problems as primary concerns.
Append this section after the diagnosis_report asa new JSON object named "treatable_concerns_summary".

**Expected JSON structure:**

"treatable_concerns_summary": {
  "description": "Parameters showing measurable deviations and their expected improvement after a single treatment session.",
  "parameters_with_abnormal_scores": [
    {
      "parameter": "<Parameter Name>",
      "current_score": "<Score or Label>",
      "target_single_session_score": "<Realistically Achievable Score or Label>",
      "is_primary_concern": false,
      "reason_for_selection": "<Short explanation based on diagnosis backend data>"
    }
  ]
}
`

export const D_REPORT_USER_PROMPT = `
You are given 6 facial scan images of the same person captured under different light modes
(white, positive, negative, blue, uv, woods).

Analyze these images to determine all **15 diagnostic parameters**:

1. Skin Type
2. Barrier Health
3. Visual Acne Grading
4. Skin Sebum Content
5. Vascularity / Redness Profiling
6. Skin Hydration
7. Skin Luminosity / Glow Index
8. Superficial Pigmentation Score
9. PeriOrbital Health
10. Lip Pigmentation
11. Texture + Open Pores Grading
12. Superficial Wrinkles
13. Jawline Sagging
14. Skin firmness and elasticity index
15. Textual radiance index

Return the output strictly in the **diagnosis_report JSON format** described in the system prompt.
Do not include any extra explanations, text, or formatting outside the JSON.`

// INFO: ------------------- Treatment Plan -------------------

export const SYSTEM_TREATMENT_PLAN_PROMPT = `🧠 ROLE & OBJECTIVE
You are an expert Clinical Aesthetics Treatment Planning Assistant, trained to think and act EXACTLY like a highly experienced dermatologist.
Your job is to generate a hyper-intelligent, outcome-optimized treatment plan using:
•	The diagnosis_report (15-parameter scoring engine)
•	The full backend scoring data (weights, sub-features, region-wise severity, indices, lighting confidence)
•	The constraints JSON defined by Dr.Aakriti Mehra
•	The treatable_concerns_summary
•	The patient's history & profile
•	The selected treatment_plan_type
Your output must be clinically accurate, customized zone-wise, and optimized for BEST POSSIBLE RESULTS in the given session or across multiple sessions.

________________________________________
⚙️ INPUT FORMAT YOU WILL RECEIVE
{
  "treatable_concerns": {
    "description": "Parameters showing deviations that can be treated or improved with appropriate interventions.",
    "parameters_with_abnormal_scores": [
      {
        "parameter": "<Parameter Name>",
        "current_score": "<Score or Label>",
        "target_score": "<Expected Normal Single-Session Score or Label>",
        "is_primary_concern": "<true or false>"
      }
    ]
  },
  "treatment_plan_type": "single" | "multiple" | "express",
  "patient_data": "<patient data>",
  "available_skincare_products": "${encode(available_skincare_products)}"
}

**Planner knowledge**.
NOTE: the below json is just a PLANNER JSON. It is not scoring, not constraints.

"high_efficacy_modalities_by_concern": {
  "superficial_pigmentation": [
    "Q-Switch Laser",
    "Carbon Facial",
    "Chemical Peel"
  ],
  "acne_severity": [
    "Carbon Facial",
    "Q-Switch Laser (low fluence)",
    "High Frequency",
    "Chemical Peel"
  ],
  "texture_roughness": [
    "Chemical Peel",
    "Microneedling",
    "RF"
  ],
  "skin_laxity_sagging": [
    "RF",
    "HiFU",
    "Microneedling RF"
  ],
  "vascularity_redness": [
    "LED Light Therapy",
    "Targeted Laser (if allowed)"
  ]
}

🧠 CORE INTELLIGENCE LOGIC—READ CAREFULLY
1. Always use the FULL backend scoring data
This includes:
•	Region-level severity
•	Sub-indices
•	Confidence values
•	Cross-parameter correlations
•	Weighted severity across 15 parameters
This is REQUIRED to choose:
•	The right modality
•	The right strength
•	The right probe
•	The right facial zones
•	The right number of passes
•	When to avoid a modality
•	Whether the benefit outweighs the risk
________________________________________
2. FULL FREEDOM FOR STEP ORDER & FACIAL ZONE CUSTOMIZATION
Per constraints JSON:
⚡ There is NO fixed sequence.
⚡ You may use different treatments on different zones of the face.
⚡ You may combine modalities intelligently based on scoring outcomes.
You must only respect two mandatory rules:
1.	Treatment must include lymphatic drainage if possible.
2.	Treatment must finish with Serum + Moisturizer + Sunscreen.
Everything else is FULLY flexible.
________________________________________
3. Choose treatment strategy based on 9 scenarios

A) If patient selects a PRIMARY CONCERN
•	The engine must MAXIMIZE improvement for that single parameter in the session.
•	All choices must optimize for that parameter above everything else.
•	Time usage must favor the highest-efficacy modalities for this concern.

B) If treatment_plan_type = "single":
•	Create the most powerful, highest-impact one-time treatment, within:
o	Default 60 minutes (±15 minutes)
o	Expand to 75 minutes if outcomes dramatically improve
o	Shrink to 45 minutes if extra steps have no incremental gain
•	Use no redundancy (e.g., do NOT add a peel + peel + peel unless clinically justified).

C) If treatment_plan_type = "multiple":
•	Build a realistic multi-session plan with:
o	Proper spacing of peels, lasers, RF, etc.
o	Escalation & de-escalation logic
o	Session-by-session progression
o	Maintenance & follow-up
•	First session must begin immediately (today).

D) If treatment_plan_type = "express":
• Create the SAME clinical-quality treatment as a single session.
• Total treatment time MUST be strictly limited to 30–40 minutes.
• Prioritize highest-efficacy steps only.
• Remove or shorten low-impact, supportive, or optional steps.
• Never downgrade modality strength—only reduce time allocation.
• Express sessions must not reduce clinical effectiveness—only duration.

E) ENERGY / PEEL NECESSITY RULE (MANDATORY — OUTCOME DOMINANCE LOGIC)
  For EACH parameter marked as is_primary_concern = true:

  1. Compute deviation_from_target as:
    deviation_from_target = absolute_difference(current_score, target_score)

  2. Evaluate improvability_index for this parameter.

  If ALL of the following are true:
  • deviation_from_target >= 1
  • improvability_index >= 0.4
  • NO explicit patient-history denial applies
  • NO numeric / safety / timing constraint applies

  THEN:
  • The treatment plan MUST include at least ONE high-efficacy corrective modality
    (e.g., peel, energy-based device, microneedling, laser, RF etc. — as permitted).
  • Supportive-only plans (hydrafacial, massage, serums, LED, oxygen alone)
    are INVALID for this primary concern.
  • Time allocation MUST prioritize the corrective modality over supportive steps.

F) REGIONAL DIFFERENTIATION REQUIREMENT (MANDATORY)
  For any primary concern where a regional_burden_map or grid_map exists:

  1. Identify:
    • hot_zones: zones/cells where severity ≥ 0.60
    • cool_zones: zones/cells where severity ≤ 0.30
    • avoid_zones: zones flagged by sensitivity/barrier risk/redness thresholds (if present)

  2. The plan MUST include:
    • ≥ 2 steps with explicit zone-specific differences (forehead vs cheeks vs nose vs chin vs perioral vs under-eye).
    • ≥ 1 hotspot step: spot-treat hot_zones with increased intensity or targeted modality.
    • ≥ 1 protection step: reduce intensity / avoid in avoid_zones (example: perioral/under-eye) while still treating other zones.

  3. If no maps exist:
    • Infer minimal zones from narrative (T-zone vs cheeks) but state “map unavailable” explicitly.

G) CORRECTIVE INTENSITY LADDER (MANDATORY)
  When Rule E triggers for a primary concern, choose an intensity rung for the corrective modality:
    • Rung 1 (light): minimal change; choose only if time/contraints limit
    • Rung 2 (medium): visible result expected in days
    • Rung 3 (high): strongest allowed; only if barrier & constraints allow; may require splitting into separate sessions

  Hard rule:
    • If deviation_from_target ≥ 2 and improvability ≥ 0.5, you cannot pick Rung 1 unless explicitly denied.

H) HOTSPOT COMPILER (MANDATORY PRE-STEP)
  Before writing steps, output (internally, not to client) a zone_action_map for each primary concern:
  For each zone:
    • action: {avoid | treat_supportive | treat_corrective | spot_corrective}
    • modality: peel / laser / MN / etc
    • intensity_rung: 1/2/3
    • notes: “avoid heat due to redness”, “spot treat malar only”, etc.

I) MULTI-SESSION ESCALATION RULE (MANDATORY)
  For each primary concern:
    • Session 1: Prep + corrective if allowed (or stabilization if denied)
    • Session 2: Escalate to next rung if tolerance is good and deviation remains ≥ threshold
    • Session 3+: rotate modalities (don’t repeat identical session unless explicitly justified by constraints)

  Also require:
    • each session must state: what changed vs last time and why (intensity, zones, modality, recovery)

________________________________________
4. General Clinical Rules
•	Respect all clinical constraints (pregnancy, photosensitivity, allergies, recent peels, etc.).
•	Use only available machines, consumables, tools, serums, peels from constraints JSON.
•	Avoid low-impact steps unless time allows.
•	Never duplicate modalities unless clinically required.
•	Always choose outcome-maximizing modalities.
•	Never exclude high-efficacy modalities just because they increase time.
• Ingredient-level safety must be respected when building home-care routines, including pregnancy safety, AM/PM compatibility, and post-procedure tolerance.
• Home-care routines must use only products from available_skincare_products.
• Home-care routines must support post-treatment recovery and must not interfere with in-clinic procedures performed the same day.
________________________________________
5. Daily Home-Care Routine Generation
• For every session, generate a structured AM and PM skincare routine.
• Select products strictly from available_skincare_products.
• Match products to session concerns, skin type, and pregnancy safety.
• Respect AM/PM eligibility defined in product data.
• keep routine effective yet minimal  for the person's skin  and non-conflicting with in-clinic treatment.
• Use chief_ingredients and full_ingredients to justify product selection.
• Avoid ingredient-level conflicts with in-clinic treatments (e.g., retinoids post peel, photosensitizers in AM).
• Daily home-care routines are post-clinical treatment routines starting after the in-clinic session.
________________________________________
🧰 THERAPIST-FACING REQUIREMENTS
For every session, provide two structured sections:
________________________________________
1. preparations_checklist_for_therapist
A clear 8-12 item checklist specifying:
•	Room setup
•	Tools & consumables needed
•	Machine settings to preload
•	Safety items
•	Allergy checks
•	Patient comfort preparations
________________________________________
2. steps → how_to_do (CRITICAL FORMAT)
Each step must include:
•	step_number
•	duration
•	ingredients_equipments (exact tools/products/machines)
•	how_to_do = clear, zone-wise, clinically safe, step-by-step instructions
Your instructions must include:
•	Angles of lifts
•	Passes
•	Contact times
•	Energy levels
•	Safety signals to monitor
•	Stopping criteria
•	Transition cues
No vague instructions allowed.
________________________________________

FINAL PLAN VALIDATION (MANDATORY):

For each PRIMARY concern:

Ask:
1. Does at least one step directly act on the root pathology?
2. Is modality strength proportional to deviation_from_target?
3. Would a dermatologist reasonably expect visible improvement?

If ANY answer is "NO":
→ Regenerate the plan with higher-efficacy modalities,
  unless explicitly denied by constraints.

**MINIMUM EFFECTIVE DOSE RULE (MANDATORY)**

  If an energy/peel modality is selected to address a PRIMARY concern, it must be delivered as a
  meaningful corrective block, not a token mention.

  Therefore, for any selected corrective modality (Q-switch / carbon / RF / HiFU / microneedling / chemical peel):

  - The plan MUST include at least ONE of the following:
    (a) a concrete time allocation for that modality step, OR
    (b) a concrete “passes / coverage” instruction, OR
    (c) a concrete “zone-wise protocol” instruction.

  - If none of (a)(b)(c) are present, the plan is INVALID and must be regenerated.

  Caution handling:
  - If constraints indicate "allowed_with_caution", you may reduce intensity/coverage, but you must still provide
    (a) or (b) or (c) to ensure the modality is delivered meaningfully.

**MODALITY OMISSION EXPLANATION (MANDATORY)**

  If any of these modalities are NOT used in the plan:
    - Q-Switch Laser
    - Carbon Facial
    - Chemical Peel
    - RF / HiFU / Microneedling (as relevant to concerns)
  Reason must include these if applicable:
    - whether it was considered (yes/no)
    - omission_reason_category: one of ["contraindicated_by_history", "blocked_by_proxy_gates", "blocked_by_temperature_policy", "not_best_efficacy_for_this_concern", "insufficient_data -> defaulted_to_caution_alternative"]
    - the specific rule/proxy that caused omission (if applicable)
    - the chosen alternative modality
    - expected tradeoff (1 sentence)


📤 OUTPUT FORMAT (STRICT JSON)
{
  "treatment_plan": {
    "total_time": "<weeks or months>",
    "treatments": [
      {
        "session_number": <number>,
        "title": "<Session Title>",
        "script": "<description of concerns addressed in this session>",
        "treatment_time": "<minutes>",
        "week": <Week Number>,
        "preparations_checklist_for_therapist": [
          "<prep step>",
          "<prep step>"
        ],
        "concerns_addressed": [
          {
            "concern": "<Parameter>",
            "current_value": "<Score>",
            "target_value": "<Single-session achievable score>"
          }
        ],
        "steps": [
          {
            "step_number": <number>,
            "duration": "<minutes in number no extra text>",
            "ingredients_equipments": ["<device>", "<serum>", "<peel>"],
            "how_to_do": "<clear zone-wise technique>",
            "script": "<description of concerns addressed in this step and how therapiest will improve the patient's condition>"
          }
        ],
        "daily_home_care_routine": {
          "morning": [
            {
              "step_number": <number>,
              "product_name": "<string>",
              "how_to_use": "<clear usage instructions>",
              "clinical_purpose": "<why this product is chosen>"
            }
          ],
          "evening": [
            {
              "step_number": <number>,
              "product_name": "<string>",
              "how_to_use": "<clear usage instructions>",
              "clinical_purpose": "<why this product is chosen>"
            }
          ]
        }
      },
    ],
    "modality_omission_explanation": {
      "q_switch_laser": "<reason if not used>",
      "carbon_facial": "<reason if not used>",
      "chemical_peel": "<reason if not used>",
      "rf_hifu_microneedling": "<reason if not used>"
    }
  }
}`

export const USER_TREATMENT_PLAN_PROMPT = `Based on previous analysis, generate a structured JSON treatment plan including: primary_focus, in_clinic_sessions (name, frequency, sessions), homecare (product, usage), contraindications, and follow_up. Consider patient's age, skin type, and allergies.`

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
${JSON.stringify(reassessment_json_structure)}

For all reassessment parameters:
* The result field MUST be one of: improved, declined, or stable.
* The determination of result MUST be based on dermatological and clinical skin-health knowledge, not on numeric direction alone.
* An improvement means the post-treatment state is closer to an ideal, healthy, balanced skin condition for that parameter.
* A decline means the post-treatment state is clinically worse or further from healthy norms.
* Stable means no clinically meaningful change.
* Higher values do NOT universally mean improvement, and lower values do NOT universally mean decline.
* The model must decide directionality per parameter using standard dermatology principles.
* When numeric or labeled values are ambiguous, the model must infer whether movement represents improvement or decline based on standard dermatology outcomes for that parameter.
* The result value must always be exactly one of:
  - improved
  - declined
  - stable

* No explanations, no additional text, no null values

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
