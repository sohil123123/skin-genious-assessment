export const IV_INGREDIENTS_LIST = [
  {
    category: 'Base Fluids',
    ingredients: [
      {
        ingredient: 'Normal Saline (0.9%)',
        ai_parameters_targeted: ['Hydration Score (<40%)', 'TBW (BIA)'],
        clinical_function: 'Volume replenishment for dry cells.',
      },
      {
        ingredient: "Lactated Ringer's",
        ai_parameters_targeted: ['Electrolyte Balance', 'Acidic pH'],
        clinical_function: 'Better for dehydration with mineral loss.',
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
      },
      {
        ingredient: 'Vitamin C (High Dose)',
        ai_parameters_targeted: ['Oxidative Stress', 'UV Damage', 'Collagen'],
        clinical_function: '"Mops up" free radicals; essential for collagen synthesis.',
      },
      {
        ingredient: 'Alpha Lipoic Acid (ALA)',
        ai_parameters_targeted: ['Glycation (GOI)', 'Sallow Tone'],
        clinical_function: 'Water/Fat soluble; reverses sugar damage/stiffening.',
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
      },
    ],
  },
  {
    category: 'Vitamins / Cofactors',
    ingredients: [
      {
        ingredient: 'Methylcobalamin (B12)',
        ai_parameters_targeted: ['Dark Circles', 'Cell Turnover'],
        clinical_function: 'Energy for cell replication; fixes "pale/tired" look.',
      },
      {
        ingredient: 'B-Complex (B1/B2/B3/B5/B6)',
        ai_parameters_targeted: ['Fatigue / Energy Score', 'Mitochondrial Support', 'Stress Load'],
        clinical_function:
          'Core enzymatic cofactors for ATP production; supports nervous system and reduces functional fatigue.',
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
      },
      {
        ingredient: 'Biotin (B7)',
        ai_parameters_targeted: ['Hair/Nail Support', 'Sebum Balance (secondary)'],
        clinical_function:
          'Cofactor for keratin infrastructure and fatty-acid metabolism; useful for hair/nail-focused protocols.',
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
      },
      {
        ingredient: 'Zinc',
        ai_parameters_targeted: ['Acne (Bacterial Load)', 'Healing'],
        clinical_function: 'Sebum regulation; antimicrobial/wound healing.',
      },
      {
        ingredient: 'Selenium',
        ai_parameters_targeted: ['Inflammation', 'Skin Thinning'],
        clinical_function: 'Thyroid support; protects against oxidative damage.',
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
      },
      {
        ingredient: 'L-Arginine',
        ai_parameters_targeted: ['Glow / Luminosity', 'Perfusion'],
        clinical_function: 'Nitric Oxide booster; improves circulation/color.',
      },
      {
        ingredient: 'L-Lysine',
        ai_parameters_targeted: ['Wrinkle Depth', 'Firmness'],
        clinical_function: 'Essential building block for new collagen formation.',
      },
      {
        ingredient: 'Taurine',
        ai_parameters_targeted: ['Cellular Hydration', 'Electrolyte Balance'],
        clinical_function: 'Osmoregulator; keeps water inside the cell.',
      },
    ],
  },
]
