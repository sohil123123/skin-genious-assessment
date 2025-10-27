<template>
  <q-page>
    <q-btn label="Download Diagnosis Report as PDF" @click="exportToPDF" />
  </q-page>
</template>

<script setup>
import jsPDF from 'jspdf'
import { api } from 'src/boot/axios'
import { onMounted } from 'vue'

const diagnosis = {
  skin_type: {
    parameter_name: 'Skin Type',
    description:
      'This parameter identifies the primary characteristics of your skin, which can be oily, dry, combination, or normal. Understanding your skin type is the foundation for a proper skincare routine.',
    score_or_label: 'Combination Skin',
    score_explanation:
      'White light image shows a clear sheen and larger pores confined mainly to the T‑zone (nose and central forehead) while the cheeks look comparatively matte; UV/red modes show clustered porphyrins around the nose with relatively fewer on the lateral cheeks, matching a T‑zone oily with otherwise normal skin.',
    affected_area_image: 1,
    possible_causes: [
      'Genetic sebaceous activity with regional variation',
      'Climate and daily routine leading to T-zone oiliness',
    ],
  },
  superficial_pigmentation_score: {
    parameter_name: 'Superficial Pigmentation Score',
    description:
      "This parameter measures the amount of superficial pigmentation, such as sun spots, age spots, and post-inflammatory hyperpigmentation (PIH), on the skin's surface.",
    score_or_label: '3 - Moderate',
    score_explanation:
      'Brown-mode image shows multiple scattered brown macules across the nose bridge, malar areas, and perioral zone with some coalescence but not confluent over most of the face; estimated coverage ~15–30%.',
    affected_area_image: 7,
    possible_causes: [
      'Cumulative sun exposure/photoaging',
      'Post-inflammatory hyperpigmentation from prior acne or irritation',
    ],
  },
  visual_acne_grading: {
    parameter_name: 'Visual Acne Grading',
    description:
      'This parameter assesses the severity of acne based on the number and type of lesions, such as blackheads, whiteheads, papules, and pustules.',
    score_or_label: 'Grade 1 - Almost Clear / Very Mild',
    score_explanation:
      'In white/polarized views there are few visible inflammatory lesions; most findings are non-inflammatory comedones concentrated on the nose with minimal redness and no nodules.',
    affected_area_image: 2,
    possible_causes: [
      'Comedogenic sebum accumulation in the T-zone',
      'Irregular cleansing or occlusive products',
    ],
  },
  texture_open_pores_grading: {
    parameter_name: 'Texture + Open Pores Grading',
    description:
      "This parameter evaluates the skin's texture, including the visibility of open pores.",
    score_or_label: 'Grade 2 - Mild',
    score_explanation:
      'Parallel-polarized view shows diffusely visible pores over the nose and medial cheeks with mild surface roughness; pores are noticeable but not crateriform.',
    affected_area_image: 2,
    possible_causes: [
      'Elevated sebum output in T-zone',
      'Chronic sun exposure weakening follicular support',
    ],
  },
  superficial_wrinkles: {
    parameter_name: 'Superficial Wrinkles',
    description:
      'This parameter assesses the presence and depth of superficial wrinkles and fine lines, which are early signs of aging. ',
    score_or_label: 'Grade 2 - Mild',
    score_explanation:
      'Cross/parallel polarized images highlight multiple fine lines in the infraorbital area and at the nasolabial entrance that are visible at rest but not deep.',
    affected_area_image: 3,
    possible_causes: [
      'Dehydration of the stratum corneum',
      'Photoaging and repetitive expressions',
    ],
  },
  jawline_sagging: {
    parameter_name: 'Jawline Sagging',
    description:
      'This parameter evaluates the firmness and definition of the jawline, which can be affected by loss of skin elasticity and gravity.',
    score_or_label: 'Grade 2 - Mild',
    score_explanation:
      'White light view indicates slight blunting along the mandibular contour with early jowl fullness but overall preserved definition.',
    affected_area_image: 1,
    possible_causes: ['Early collagen/elastin decline with age', 'Subcutaneous fat redistribution'],
  },
  skin_hydration: {
    parameter_name: 'Skin Hydration',
    description:
      'This parameter measures the water content in the skin, which is crucial for maintaining a healthy skin barrier and a plump, youthful appearance.',
    score_or_label: 'Score 1 - Mild Dehydration',
    score_explanation:
      'Overall tone appears slightly dull with faint superficial lines, especially periocular; light does not reflect uniformly on non‑T‑zone areas.',
    affected_area_image: 1,
    possible_causes: [
      'Insufficient moisturization/humectants',
      'Environmental factors such as air‑conditioning or sun',
    ],
  },
  skin_sebum_content: {
    parameter_name: 'Skin Sebum Content',
    description:
      'This parameter measures the amount of sebum (oil) produced by the sebaceous glands in the skin.',
    score_or_label: 'Score 2 - Moderate / Normal-Oily',
    score_explanation:
      'Distinct sheen over the nose/forehead on white light and multiple porphyrin fluorescences on UV/red modes indicate moderate sebum activity, most pronounced in the T‑zone.',
    affected_area_image: 6,
    possible_causes: ['Genetic sebaceous gland activity', 'Diet/stress influencing oil production'],
  },
  skin_sensitivity_scoring: {
    parameter_name: 'Skin Sensitivity Scoring',
    description:
      "This parameter assesses the skin's reactivity to external stimuli, such as skincare products, environmental factors, and touch.",
    score_or_label: 'Score 1 - Mild',
    score_explanation:
      'Red/XPL imaging shows faint erythema around the nasal ala and central cheeks without persistent widespread redness or flaking.',
    affected_area_image: 6,
    possible_causes: [
      'Intermittent irritant exposure (fragrance/actives)',
      'Environmental triggers such as heat or shaving',
    ],
  },
  barrier_health: {
    parameter_name: 'Barrier Health',
    description:
      "This parameter evaluates the health of the skin's protective barrier, which is essential for retaining moisture and protecting against external aggressors.",
    score_or_label: 'Score 1 - Mildly Compromised',
    score_explanation:
      'Slight dullness with mild erythema and scattered PIH suggests minor barrier stress rather than overt scaling or cracks.',
    affected_area_image: 1,
    possible_causes: [
      'Under-moisturization and over-cleansing',
      'Sun exposure without adequate protection',
    ],
  },
  periorbital_health: {
    parameter_name: 'PeriOrbital Health',
    description:
      'This parameter assesses the health of the skin around the eyes, including puffiness, hollowness, pigmentation, and vascularity.',
    score_or_label: 'Moderate',
    score_explanation:
      'Noticeable infraorbital pigmentation with mild hollowing and vascular tint are evident on polarized and brown images; puffiness is mild.',
    affected_area_image: 3,
    possible_causes: [
      'Genetic predisposition and thin periocular skin',
      'Sleep/stress and sun exposure',
    ],
  },
  lip_pigmentation: {
    parameter_name: 'Lip Pigmentation',
    description: 'This parameter assesses the presence of discoloration or dark spots on the lips.',
    score_or_label: 'Present',
    score_explanation:
      'Lips appear darker than surrounding skin in multiple modes and show uneven coloration in brown-mode imaging.',
    affected_area_image: 7,
    possible_causes: [
      'Chronic sun exposure or smoking history',
      'Post-inflammatory changes or dehydration',
    ],
  },
  vascularity_redness_profiling: {
    parameter_name: 'Vascularity / Redness Profiling (XPL / Red Light)',
    description:
      'Mapping of visible and sub-dermal redness, capillary dilation, and vascular congestion using cross-polarized or red light imaging.',
    score_or_label: 'Score 2 - Moderate',
    score_explanation:
      'Red-light image highlights diffuse erythema around the nasal folds and central cheeks, greater than faint background but not intense or widespread.',
    affected_area_image: 6,
    possible_causes: [
      'Chronic sun exposure and heat',
      'Intermittent irritation/shaving-related redness',
    ],
  },
  under_eye_vascularity_vs_structural_shadows: {
    parameter_name: 'Under-Eye Vascularity vs Structural Shadows (Peri-orbital Detail)',
    description:
      'Differentiation between pigmentation, vascular congestion, and anatomical shadowing under the eyes.',
    score_or_label: 'Score 2 - Moderate',
    score_explanation:
      'Polarized views show bluish-brown tone with mild hollowness causing shadowing; UV/red emphasize vascular tint but not severe.',
    affected_area_image: 3,
    possible_causes: [
      'Thin periocular skin with visible vessels',
      'Volume loss producing structural shadows',
    ],
  },
  skin_luminosity_glow_index: {
    parameter_name: 'Skin Luminosity / Glow Index (White / PPL)',
    description:
      'Quantitative evaluation of skin radiance and uniformity under white and parallel polarized light.',
    score_or_label: 'Score 1 - Mild',
    score_explanation:
      'Light reflection is slightly uneven with dull cheeks while the T‑zone is shiny; radiance improves but is not uniform under polarized lighting.',
    affected_area_image: 1,
    possible_causes: ['Mild dehydration and surface roughness', 'Uneven oil distribution'],
  },
  comedonal_density: {
    parameter_name: 'Comedonal Density (PPL / UV)',
    description: 'Detection of open and closed comedones visible in polarized or UV imaging modes.',
    score_or_label: 'Score 2 - Moderate',
    score_explanation:
      'Numerous porphyrin fluorescent dots are clustered over the nose and central cheeks on UV/red modes, consistent with multiple comedones.',
    affected_area_image: 6,
    possible_causes: [
      'Sebum retention in T‑zone follicles',
      'Inadequate exfoliation or occlusive products',
    ],
  },
  texture_irregularities_beyond_pores: {
    parameter_name: 'Texture Irregularities Beyond Pores (PPL / Brown)',
    description:
      'Identification of micro-surface irregularities, roughness, and post-inflammatory marks beyond pore-related texture.',
    score_or_label: 'Score 2 - Moderate',
    score_explanation:
      'Brown-mode image reveals micro-roughness and mottled PIH across the cheeks and around the nose beyond pore visibility.',
    affected_area_image: 7,
    possible_causes: [
      'Photoaging with uneven melanin distribution',
      'Post-inflammatory marks from prior lesions',
    ],
  },
  regional_oil_distribution: {
    parameter_name: 'Regional Oil Distribution (White / UV)',
    description:
      'Distribution mapping of oil secretion across facial zones, highlighting T-zone vs U-zone differences.',
    score_or_label: 'Score 1 - T-zone Predominant',
    score_explanation:
      'Shine and porphyrin clustering are concentrated on the forehead and nose with relatively matte lateral cheeks, indicating T‑zone dominant oiliness.',
    affected_area_image: 1,
    possible_causes: [
      'Higher density of sebaceous glands in T‑zone',
      'Hormonal and lifestyle influences',
    ],
  },
}
const exportToPDF = () => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  let pageNumber = 1
  const parameters = Object.values(diagnosis) // Extract parameters as array for iteration

  parameters.forEach((param, index) => {
    if (index > 0) {
      doc.addPage()
    }

    // Header: AI AESTHETICS (centered, large font)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text('AI AESTHETICS', 105, 20, { align: 'center' })

    // Horizontal line below header
    doc.setLineWidth(0.5)
    doc.line(20, 25, 190, 25)

    // Parameter Name (medium font)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(param.parameter_name, 20, 40)

    // Explanation Section Title
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('EXPLANATION OF WHAT THE PARAMETER ENTAILS', 20, 50)

    // Parameter Description (wrapped text)
    doc.setFont('helvetica', 'normal')
    const descriptionLines = doc.splitTextToSize(param.description, 170)
    doc.text(descriptionLines, 20, 55)
    let currentY = 55 + descriptionLines.length * 5 // Approximate line height adjustment

    // Upper Section (Score/Grade Row): Left column for Score/Present, Right for Explanation
    // Draw table-like borders for the entire table (upper and lower rows together)
    const upperHeight = 50 // Fixed height for upper row (adjust if needed for wrapping)
    const lowerHeight = 100 // Fixed height for lower row
    doc.rect(20, currentY, 80, upperHeight + lowerHeight) // Left column full height
    doc.rect(100, currentY, 90, upperHeight + lowerHeight) // Right column full height
    doc.line(20, currentY + upperHeight, 190, currentY + upperHeight) // Horizontal line between rows

    // Upper Left column title (wrapped)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    const titleLines = doc.splitTextToSize('SCORE/TEXT/SKIN TYPE/PRESENT OR NOT PRESENT', 75) // Wrap to fit cell width (80 - padding)
    doc.text(titleLines, 22, currentY + 8)
    let titleY = currentY + 8 + titleLines.length * 5 // Adjust for multi-line title

    // Circle with score/label (handle string, number, or object)
    doc.setDrawColor(0)
    doc.circle(60, titleY + 12, 12) // Adjust position based on title height
    doc.setFontSize(10)
    let scoreText = ''
    if (typeof param.score_or_label === 'object') {
      // Special handling for periorbital_health (multi-label with +/-)
      const labels = []
      for (const [key, value] of Object.entries(param.score_or_label)) {
        labels.push(`${key.charAt(0).toUpperCase() + key.slice(1)} - ${value}`)
      }
      scoreText = labels.join('\n')
    } else {
      scoreText = param.score_or_label.toString()
    }
    const scoreLines = doc.splitTextToSize(scoreText, 20) // Wrap if multi-line
    doc.text(scoreLines, 60, titleY + 8 - (scoreLines.length - 1) * 3 + 5, { align: 'center' })

    // Upper Right column title
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('EXPLANATION OF SCORE', 102, currentY + 8)

    // Score Explanation (wrapped)
    doc.setFont('helvetica', 'normal')
    const scoreExpLines = doc.splitTextToSize(param.score_explanation, 85)
    doc.text(scoreExpLines, 102, currentY + 13)

    // Move to lower row
    currentY += upperHeight

    // Lower Left column title
    doc.setFont('helvetica', 'bold')
    const faceTitleLines = doc.splitTextToSize('FACE IMAGE SHOWING AFFECTED AREAS', 75)
    doc.text(faceTitleLines, 22, currentY + 8)

    // Placeholder for image (rectangle with text; replace with actual image addImage() if base64/URL available)
    // // For now, draw a simple face outline as placeholder (using lines)
    let faceY = currentY + 8 + faceTitleLines.length * 5 + 5 // Adjust below title
    // doc.setLineWidth(0.2)
    // // Face oval
    // doc.ellipse(60, faceY + 40, 20, 30)
    // // Eyes
    // doc.line(40, faceY + 30, 60, faceY + 30)
    // // Nose
    // doc.line(50, faceY + 35, 50, faceY + 45)
    // // Mouth
    // doc.line(40, faceY + 55, 60, faceY + 55)
    // // Add affected areas as dots (based on affected_area_image value, e.g., "1" for T-zone)
    // doc.setFillColor(0)
    // if (param.affected_area_image === '1') {
    //   // Example: Dots on forehead, nose (T-zone)
    //   doc.circle(50, faceY + 20, 1, 'F')
    //   doc.circle(50, faceY + 40, 1, 'F')
    // } else if (param.affected_area_image === '2') {
    //   // Example: Dots on cheeks
    //   doc.circle(35, faceY + 40, 1, 'F')
    //   doc.circle(65, faceY + 40, 1, 'F')
    // }
    // If you have actual images, use: doc.addImage(imageBase64, 'PNG', 30, faceY, 50, 70);
    doc.addImage('images/test_image_1.png', 'PNG', 30, faceY, 50, 70)

    // Lower Right column title
    doc.setFont('helvetica', 'bold')
    const causesTitleLines = doc.splitTextToSize('POSSIBLE CAUSES OF THE ISSUE SEEN', 85)
    doc.text(causesTitleLines, 102, currentY + 8)

    // Possible Causes (bullet list, wrapped)
    doc.setFont('helvetica', 'normal')
    let causeY = currentY + 8 + causesTitleLines.length * 5 + 5
    param.possible_causes.forEach((cause) => {
      const causeLines = doc.splitTextToSize(`• ${cause}`, 85)
      doc.text(causeLines, 102, causeY)
      causeY += causeLines.length * 5 // Adjust for multi-line causes
    })

    currentY += lowerHeight + 5 // Move to footer

    // Footer line
    doc.setLineWidth(0.5)
    doc.line(20, 270, 190, 270)

    // Footer text
    doc.setFontSize(10)
    doc.text('DEVELOPED BY DR. AAKRITI MEHRA', 20, 280)
    doc.text(`PAGE ${pageNumber}`, 170, 280)

    pageNumber++
  })

  doc.save('AIA_Diagnosis_Report.pdf')
}

onMounted(() => {
  api.get('/users/4').then((response) => {
    console.log(response.data.results)
  })
})
</script>
