export const IV_INGREDIENTS_LIST = [
  {
    category: 'Base Fluids',
    ingredients: [
      {
        ingredient: 'Normal Saline (0.9%)',
        ai_parameters_targeted: ['Hydration Score (<40%)', 'TBW (BIA)'],
        clinical_function: 'Volume replenishment for dry cells.',
        label: 'Base',
      },
      {
        ingredient: "Lactated Ringer's",
        ai_parameters_targeted: ['Electrolyte Balance', 'Acidic pH'],
        clinical_function: 'Better for dehydration with mineral loss.',
        label: 'Base',
      },
    ],
  },
  {
    category: 'Antioxidants',
    ingredients: [
      {
        ingredient: 'Glutathione',
        ai_parameters_targeted: ['Tone Homogeneity', 'Pigment Instability'],
        clinical_function: 'Master antioxidant; clears "muddy" tone & melanin.',
        label: 'Hero',
      },
      {
        ingredient: 'Vitamin C (High Dose)',
        ai_parameters_targeted: ['Oxidative Stress', 'UV Damage', 'Collagen'],
        clinical_function: '"Mops up" free radicals; essential for collagen synthesis.',
        label: 'Hero',
      },
      {
        ingredient: 'Alpha Lipoic Acid (ALA)',
        ai_parameters_targeted: ['Glycation (GOI)', 'Sallow Tone'],
        clinical_function: 'Water/Fat soluble; reverses sugar damage/stiffening.',
        label: 'Supportive',
      },
      {
        ingredient: 'N-Acetylcysteine (NAC)',
        ai_parameters_targeted: [
          'Oxidative Stress Index',
          'Detox Load',
          'Alcohol (last 72h)',
          'Poor Glutathione Response',
        ],
        clinical_function:
          'Glutathione precursor; supports hepatic antioxidant capacity and phase II detox; reduces oxidative stress.',
        label: 'Supportive',
      },
      {
        ingredient: 'Glycine',
        ai_parameters_targeted: [
          'Oxidative Stress Index',
          'Detox Load',
          'Sleep/Recovery',
          'Poor Glutathione Response',
        ],
        clinical_function:
          'Glutathione co-substrate (Glu–Cys–Gly); supports phase II conjugation; calming neurotransmitter support and tissue repair.',
        label: 'Supportive',
      },
      {
        ingredient: 'Methylcobalamin (B12)',
        ai_parameters_targeted: ['Dark Circles', 'Cell Turnover'],
        clinical_function: 'Energy for cell replication; fixes "pale/tired" look.',
        label: 'Supportive',
      },
    ],
  },
  {
    category: 'Vitamins / Cofactors',
    ingredients: [
      {
        ingredient: 'B-Complex (B1/B2/B3/B5/B6)',
        ai_parameters_targeted: ['Fatigue / Energy Score', 'Mitochondrial Support', 'Stress Load'],
        clinical_function:
          'Core enzymatic cofactors for ATP production; supports nervous system and reduces functional fatigue.',
        label: 'Hero',
      },
      {
        ingredient: 'Methylfolate (B9)',
        ai_parameters_targeted: [
          'Methylation Support',
          'Homocysteine Risk (if tracked)',
          'Hair/Skin Turnover',
        ],
        clinical_function:
          'Supports DNA synthesis and methylation pathways; complements B12 for cellular repair.',
        label: 'Supportive',
      },
      {
        ingredient: 'Biotin (B7)',
        ai_parameters_targeted: ['Hair/Nail Support', 'Sebum Balance (secondary)'],
        clinical_function:
          'Cofactor for keratin infrastructure and fatty-acid metabolism; useful for hair/nail-focused protocols.',
        label: 'Supportive',
      },
      {
        ingredient: 'B6 Pyridoxine',
        ai_parameters_targeted: ['Energy', 'Brain Fog', 'Stress', 'PMS', 'Nausea support'],
        clinical_function:
          'Indirect (stress-hormone + inflammation modulation), Enables neurologic / fatigue support without forcing full B-complex',
        label: 'Supportive',
      },
      {
        ingredient: 'Vitamin B5 (Dexpanthenol)',
        ai_parameters_targeted: ['Skin Barrier', 'Recovery', 'Fatigue', 'Stress resilience'],
        clinical_function:
          'Supportive (Skin-centric), barrier repair, hydration, epithelial support, Allows skin improvement without heavy antioxidant or vitamin load',
        label: 'Supportive',
      },
      {
        ingredient: 'Thiamine (B1) – High Dose (optional)',
        ai_parameters_targeted: [
          'High Fatigue',
          'High Carb Intake',
          'Alcohol Use',
          'Low Energy Reserves',
        ],
        clinical_function:
          'Rapid cofactor for carbohydrate metabolism; can meaningfully improve fatigue in depleted states.',
        label: 'Supportive',
      },
    ],
  },
  {
    category: 'Minerals',
    ingredients: [
      {
        ingredient: 'Magnesium',
        ai_parameters_targeted: ['Vascularity (Redness)', 'HRV Stress'],
        clinical_function: 'Relaxes vessels (vasodilation) to reduce flushing.',
        label: 'Hero',
      },
      {
        ingredient: 'Zinc',
        ai_parameters_targeted: ['Acne (Bacterial Load)', 'Healing'],
        clinical_function: 'Sebum regulation; antimicrobial/wound healing.',
        label: 'Supportive',
      },
      {
        ingredient: 'Selenium',
        ai_parameters_targeted: ['Inflammation', 'Skin Thinning'],
        clinical_function: 'Thyroid support; protects against oxidative damage.',
        label: 'Supportive',
      },
    ],
  },
  {
    category: 'Specialty',
    ingredients: [
      {
        ingredient: 'NAD+',
        ai_parameters_targeted: ['Metabolic Aging', 'DNA Repair'],
        clinical_function: '"Recharges" cells showing high fluorescence haze.',
        label: 'Hero',
      },
      {
        ingredient: 'L-Carnitine',
        ai_parameters_targeted: [
          'Mitochondrial Output Need (MONS)',
          'Metabolic Stability (MSGS)',
          'Fatigue/Recovery signals',
        ],
        clinical_function:
          'Transports fatty acids into mitochondria for energy production; supports stamina, recovery, and mental clarity.',
        label: 'Supportive',
      },
    ],
  },
  {
    category: 'Amino Acids',
    ingredients: [
      {
        ingredient: 'L-Glutamine',
        ai_parameters_targeted: ['Hydration', 'Gut-Skin Axis'],
        clinical_function: 'Helps cells hold water; supports gut barrier.',
        label: 'Supportive',
      },
      {
        ingredient: 'L-Arginine',
        ai_parameters_targeted: ['Glow / Luminosity', 'Perfusion'],
        clinical_function: 'Nitric Oxide booster; improves circulation/color.',
        label: 'Supportive',
      },
      {
        ingredient: 'L-Lysine',
        ai_parameters_targeted: ['Wrinkle Depth', 'Firmness'],
        clinical_function: 'Essential building block for new collagen formation.',
        label: 'Supportive',
      },
      {
        ingredient: 'Taurine',
        ai_parameters_targeted: ['Cellular Hydration', 'Electrolyte Balance'],
        clinical_function: 'Osmoregulator; keeps water inside the cell.',
        label: 'Supportive',
      },
    ],
  },
]
