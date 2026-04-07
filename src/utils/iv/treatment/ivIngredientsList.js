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
        ai_parameters_targeted: [
          'Oxidative Stress Index',
          'Detox Load',
          'Inflammation/recovery burden',
          'Tone/clarity support',
        ],
        clinical_function:
          'Major antioxidant and redox-support ingredient; supports oxidative recovery, detox capacity, and cleaner tone/clarity when oxidative burden is relevant.',
        label: 'Flexible',
      },
      {
        ingredient: 'Vitamin C (High Dose)',
        ai_parameters_targeted: [
          'Oxidative Stress',
          'Immune support',
          'Recovery burden',
          'Collagen/tissue support',
        ],
        clinical_function:
          'High-value antioxidant and recovery ingredient; supports immune resilience, oxidative burden reduction, and tissue repair while also contributing to collagen support.',
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
          'Alcohol/recovery burden',
          'Poor glutathione reserve',
        ],
        clinical_function:
          'Glutathione precursor with strong oxidative-recovery and detox-support value; especially useful when alcohol load, post-stressor burden, or recovery strain are relevant.',
        label: 'Flexible',
      },
      {
        ingredient: 'Glycine',
        ai_parameters_targeted: [
          'Oxidative Stress Index',
          'Detox Load',
          'Sleep/recovery quality',
          'Calm-repair support',
        ],
        clinical_function:
          'Glutathione-building and recovery-supportive amino acid; supports detox conjugation, repair, and a calmer recovery profile when oxidative or sleep-recovery burden is present.',
        label: 'Supportive',
      },
      {
        ingredient: 'Methylcobalamin (B12)',
        ai_parameters_targeted: [
          'Energy support',
          'Neurologic fatigue',
          'Recovery / low reserve states',
          'Cellular turnover',
        ],
        clinical_function:
          'Supports energy metabolism, neurologic function, and recovery in low-reserve or fatigue-prone states; often complements broader metabolic support rather than standing alone.',
        label: 'Flexible',
      },
    ],
  },
  {
    category: 'Vitamins / Cofactors',
    ingredients: [
      {
        ingredient: 'B-Complex (B1/B2/B3/B5/B6)',
        ai_parameters_targeted: [
          'Functional fatigue/energy support',
          'Stress load',
          'Metabolic cofactor need',
          'Recovery from depletion',
        ],
        clinical_function:
          'Broad metabolic cofactor support for energy production and stress-recovery states; best used as part of a strong metabolic or recovery build rather than as the automatic answer to all energy cases.',
        label: 'Flexible',
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
          'Alcohol-related depletion',
          'Low energy reserves',
          'Carbohydrate metabolic demand',
          'Recovery from drained states',
        ],
        clinical_function:
          'High-value targeted metabolic cofactor, especially useful in depletion, alcohol-related stress, or low-reserve fatigue patterns where stronger B1 support adds meaningful depth.',
        label: 'Flexible',
      },
    ],
  },
  {
    category: 'Minerals',
    ingredients: [
      {
        ingredient: 'Magnesium',
        ai_parameters_targeted: [
          'HRV / autonomic stress',
          'Recovery burden',
          'Muscle tension / cramps',
          'Hydration-electrolyte support',
        ],
        clinical_function:
          'Core calming and recovery-support mineral; useful for autonomic settling, post-stressor recovery, muscle tension/cramp tendency, and broader restoration-oriented protocols.',
        label: 'Flexible',
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
          'Recovery / stamina support',
          'Metabolic Stability (MSGS)',
          'Performance-oriented fatigue',
        ],
        clinical_function:
          'Supports mitochondrial fuel transport and can strengthen performance, stamina, and recovery-oriented energy protocols when true output need is present.',
        label: 'Flexible',
      },
    ],
  },
  {
    category: 'Amino Acids',
    ingredients: [
      {
        ingredient: 'L-Glutamine',
        ai_parameters_targeted: [
          'Hydration support',
          'Recovery / tissue stress',
          'Gut-repair support',
          'Post-stressor restoration',
        ],
        clinical_function:
          'Supportive recovery amino acid that can add tissue-restoration and hydration-support depth when the case has depletion or recovery features.',
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
        ai_parameters_targeted: [
          'Cellular hydration',
          'Electrolyte balance',
          'Recovery quality',
          'Autonomic / calming support',
        ],
        clinical_function:
          'High-value osmoregulatory and recovery-supportive amino acid; helps strengthen hydration feel, cellular fluid balance, and calmer restoration-oriented protocols.',
        label: 'Flexible',
      },
    ],
  },
]
