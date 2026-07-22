/**
 * Pigmentation Plan Optimizer & Filtered Execution Config Builder.
 *
 * Architecture:
 * 1. PIGMENTATION_PROTOCOL_MAP_V2: Maps diagnostic components and morphology findings to eligible protocol IDs and category types.
 * 2. buildRelevantPlanConfig({ diagnosis, imageAnalysis, policy, fullConfig }):
 *    Extracts active diagnostic requirements and produces a compact, filtered execution config
 *    and pruned payload for treatment planning, eliminating raw images and full inventory bloat.
 */

export const PIGMENTATION_PROTOCOL_MAP_V2 = {
  // Family to Protocol Mapping
  family_protocol_map: {
    photo_induced_pigmentation: {
      q_switch: ['tanning_diffuse_pigmentation', 'lentigo_focal'],
      peels: ['whitening_peel', 'gel_based_mandelic'],
      microneedling_actives: ['clinic_compounded_pigment_directed_meso'],
      led: ['red_led'],
    },
    melasma: {
      q_switch: ['melasma_like_pigmentation'],
      peels: ['gel_based_mandelic', 'fusion_peel_e'],
      microneedling_actives: ['clinic_compounded_pigment_directed_meso', 'pdrn_repair'],
      led: ['red_led'],
    },
    post_inflammatory_hyperpigmentation: {
      q_switch: ['pih_acne_marks'],
      peels: ['fusion_peel_e', 'combination_peel', 'gel_based_mandelic'],
      microneedling_actives: ['pdrn_repair', 'clinic_compounded_pigment_directed_meso'],
      led: ['red_led'],
    },
    perioral_hyperpigmentation: {
      q_switch: ['upper_lip_perioral'],
      peels: ['gel_based_mandelic'],
      microneedling_actives: ['clinic_compounded_pigment_directed_meso'],
      led: ['red_led'],
    },
    periocular_hyperpigmentation: {
      q_switch: ['periocular'],
      peels: [],
      microneedling_actives: [],
      led: ['red_led'],
    },
    focal_melanocytic_or_lentiginous_lesion: {
      q_switch: ['focal_epidermal_spot_doctor_cleared', 'lentigo_focal'],
      peels: [],
      microneedling_actives: [],
      led: [],
    },
    benign_raised_pigmented_lesion: {
      q_switch: [],
      peels: [],
      microneedling_actives: [],
      lesion_directed: ['electrocautery_or_rf'],
      led: [],
    },
    active_inflammatory_process: {
      q_switch: [],
      peels: ['gel_based_mandelic'],
      microneedling_actives: ['pdrn_repair'],
      led: ['red_led', 'blue_led'],
    },
    no_significant_diffuse_pigmentation: {
      q_switch: [],
      peels: [],
      microneedling_actives: [],
      led: ['red_led'],
    },
  },

  // Default fallback modalities if no specific family matches
  default_modalities: {
    q_switch: ['tanning_diffuse_pigmentation'],
    peels: ['gel_based_mandelic', 'whitening_peel'],
    microneedling_actives: ['clinic_compounded_pigment_directed_meso'],
    led: ['red_led'],
  },
}

export function buildRelevantPlanConfig({ diagnosis, imageAnalysis, policy, fullConfig }) {
  // 1. Identify active diagnostic families & components
  const diagnosticComponents = diagnosis?.diagnostic_components || []
  const workingDx = diagnosis?.differential?.primary?.dx || diagnosis?.working_impression?.primary_category || ''

  const activeFamilies = new Set()
  if (workingDx) activeFamilies.add(workingDx.toLowerCase())

  diagnosticComponents.forEach((comp) => {
    if (comp.family) activeFamilies.add(comp.family.toLowerCase())
    if (comp.subtype) activeFamilies.add(comp.subtype.toLowerCase())
  })

  // Also check pattern hypotheses from images
  const hypotheses = imageAnalysis?.pattern_hypotheses_from_images || []
  hypotheses.forEach((hyp) => {
    if (hyp.family) activeFamilies.add(hyp.family.toLowerCase())
  })

  // 2. Resolve eligible protocol IDs using PIGMENTATION_PROTOCOL_MAP_V2
  const selectedQSwitchKeys = new Set()
  const selectedPeelKeys = new Set()
  const selectedActiveKeys = new Set()
  const selectedLedKeys = new Set(['red_led'])

  let matchedAny = false

  Object.entries(PIGMENTATION_PROTOCOL_MAP_V2.family_protocol_map).forEach(([familyKey, mapping]) => {
    const isMatched = Array.from(activeFamilies).some(
      (af) => af.includes(familyKey) || familyKey.includes(af),
    )
    if (isMatched) {
      matchedAny = true
      mapping.q_switch?.forEach((k) => selectedQSwitchKeys.add(k))
      mapping.peels?.forEach((k) => selectedPeelKeys.add(k))
      mapping.microneedling_actives?.forEach((k) => selectedActiveKeys.add(k))
      mapping.led?.forEach((k) => selectedLedKeys.add(k))
    }
  })

  if (!matchedAny) {
    PIGMENTATION_PROTOCOL_MAP_V2.default_modalities.q_switch.forEach((k) => selectedQSwitchKeys.add(k))
    PIGMENTATION_PROTOCOL_MAP_V2.default_modalities.peels.forEach((k) => selectedPeelKeys.add(k))
    PIGMENTATION_PROTOCOL_MAP_V2.default_modalities.microneedling_actives.forEach((k) => selectedActiveKeys.add(k))
  }

  // 3. Filter Q-Switch protocols from fullConfig
  const filteredQSwitchProtocols = {}
  if (fullConfig?.q_switch_protocols) {
    Object.entries(fullConfig.q_switch_protocols).forEach(([key, val]) => {
      if (selectedQSwitchKeys.has(key)) {
        filteredQSwitchProtocols[key] = val
      }
    })
  }

  // 4. Filter Peels from fullConfig
  const filteredPeels = {}
  if (fullConfig?.chemical_peels || fullConfig?.peel_protocols) {
    const peelSource = fullConfig?.chemical_peels || fullConfig?.peel_protocols || {}
    Object.entries(peelSource).forEach(([key, val]) => {
      if (selectedPeelKeys.has(key) || selectedPeelKeys.size === 0) {
        filteredPeels[key] = val
      }
    })
  }

  // 5. Filter Microneedling Actives from fullConfig
  const filteredActives = {}
  if (fullConfig?.microneedling_actives) {
    Object.entries(fullConfig.microneedling_actives).forEach(([key, val]) => {
      if (selectedActiveKeys.has(key) || selectedActiveKeys.size === 0) {
        filteredActives[key] = val
      }
    })
  }

  // 6. Assemble compact execution config
  const compactConfig = {
    module: fullConfig?.module || 'pigmentation_decode',
    version: fullConfig?.version || '0.1',
    clinic_profile: fullConfig?.clinic_profile || 'ai_aesthetics_jaipur_v1',
    device_specs: {
      q_switch_ndyag: {
        brand_model: fullConfig?.q_switch_ndyag?.brand_model || 'Numitech',
        wavelengths_nm: [1064],
        performed_by: fullConfig?.q_switch_ndyag?.performed_by,
      },
    },
    selected_protocol_categories: Array.from(
      new Set([
        ...Array.from(selectedQSwitchKeys).map(() => 'q_switch'),
        ...Array.from(selectedPeelKeys).map(() => 'chemical_peel'),
        ...Array.from(selectedActiveKeys).map(() => 'microneedling'),
      ]),
    ),
    q_switch_protocols: Object.keys(filteredQSwitchProtocols).length > 0 ? filteredQSwitchProtocols : fullConfig?.q_switch_protocols,
    chemical_peels: Object.keys(filteredPeels).length > 0 ? filteredPeels : fullConfig?.chemical_peels,
    microneedling_actives: Object.keys(filteredActives).length > 0 ? filteredActives : fullConfig?.microneedling_actives,
    led_phototherapy: fullConfig?.led_phototherapy,
    homecare_topicals: fullConfig?.homecare_topicals,
    safety_and_contraindications: fullConfig?.safety_and_contraindications,
  }

  // 7. Assemble compact diagnosis summary
  const compactDiagnosis = {
    working_impression: diagnosis?.working_impression,
    diagnostic_components: (diagnosis?.diagnostic_components || []).map((comp) => ({
      diagnostic_component_id: comp.diagnostic_component_id,
      family: comp.family,
      subtype: comp.subtype,
      confidence_100: comp.confidence_100,
      diagnostic_status: comp.diagnostic_status,
      depth: comp.depth,
      activity: comp.activity,
      inflammation_first_required: comp.inflammation_first_required,
      barrier_repair_first_required: comp.barrier_repair_first_required,
      direct_cosmetic_treatment_status: comp.direct_cosmetic_treatment_status,
    })),
    immutable_image_metrics: diagnosis?.immutable_image_metrics || {
      global_background_melanin_load_index: diagnosis?.scores?.melanin_load_index,
      global_background_erythema_load_index: diagnosis?.scores?.erythema_load_index,
    },
    clinical_activity: diagnosis?.clinical_activity,
    risk_profile: diagnosis?.risk_profile,
    confirmedDx: diagnosis?.confirmedDx || diagnosis?.differential?.primary?.dx,
  }

  // 8. Assemble compact image analysis summary
  const compactImageAnalysis = {
    global_background_indices: imageAnalysis?.global_background_indices,
    localized_burden_indices: imageAnalysis?.localized_burden_indices,
    morphology_groups: (imageAnalysis?.morphology_groups || []).map((mg) => ({
      group_id: mg.group_id,
      regions: mg.regions,
      morphology: mg.morphology,
      elevation: mg.elevation,
      distribution: mg.distribution,
      doctor_review_required: mg.doctor_review_required,
    })),
  }

  // 9. Compact Policy Summary
  const compactPolicy = {
    version: policy?.version,
    session_composition_policy: policy?.session_composition_policy,
    dr_aakriti_hierarchy: [
      'Epidermal melasma: peel first; microneedling + active second',
      'Mixed melasma: microneedling + active first; peel second',
      'Dermal melasma: microneedling + active first; Q-switch laser second',
      'Settled PIH: focal laser first',
      'Tanning/photomelanosis: laser first; peel second',
      'Perioral/periocular: zone & cause dependent',
    ],
  }

  return {
    compactConfig,
    compactDiagnosis,
    compactImageAnalysis,
    compactPolicy,
  }
}
