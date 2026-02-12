import jsPDF from 'jspdf'

// Professional color scheme
const COLORS = {
  primary: '#2C5AA0', // Professional blue
  secondary: '#4A6572', // Dark gray-blue
  success: '#27AE60', // Green
  accent: '#3498DB', // Light blue
  dark: '#2C3E50',
  light: '#7F8C8D',
  border: '#BDC3C7',
  background: '#F8F9FA',
}

// Font configuration
const FONTS = {
  normal: 'helvetica',
  bold: 'helvetica-bold',
  italic: 'helvetica-italic',
}

export const exportProfessionalPDF = (treatmentPlan, progressData) => {
  // Create PDF with professional settings
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  // Set document properties
  doc.setProperties({
    title: `AI Aesthetics Treatment Plan - ${treatmentPlan.total_time}`,
    subject: 'Professional Skin Treatment Plan',
    author: 'AI Aesthetics',
    keywords: 'skin, treatment, aesthetics, professional',
  })

  let currentPage = 1
  // let yPosition = 30

  // Add cover page
  addCoverPage(doc, treatmentPlan)
  currentPage++

  // Add table of contents
  doc.addPage()
  addTableOfContents(doc, treatmentPlan)
  currentPage++

  // Add each session
  treatmentPlan.treatments.forEach((session, index) => {
    if (index > 0) {
      doc.addPage()
      currentPage++
      // yPosition = 30
    }

    addSessionPage(doc, session, progressData, currentPage)
  })

  // Save PDF
  doc.save(`Treatment_Plan_${new Date().toISOString().split('T')[0]}.pdf`)
}

// Cover page
const addCoverPage = (doc, treatmentPlan) => {
  // Background
  doc.setFillColor(44, 90, 160)
  doc.rect(0, 0, 210, 297, 'F')

  // Content
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(32)
  doc.setFont(FONTS.bold)
  doc.text('AI AESTHETICS', 105, 120, { align: 'center' })

  doc.setFontSize(18)
  doc.setFont(FONTS.normal)
  doc.text('Professional Treatment Plan', 105, 140, { align: 'center' })

  doc.setFontSize(14)
  doc.text(treatmentPlan.total_time, 105, 160, { align: 'center' })

  doc.setFontSize(12)
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 250, { align: 'center' })
  doc.text(`${treatmentPlan.treatments.length} Treatment Sessions`, 105, 260, { align: 'center' })
}

// Table of contents
const addTableOfContents = (doc, treatmentPlan) => {
  doc.setTextColor(COLORS.dark)
  doc.setFontSize(20)
  doc.setFont(FONTS.bold)
  doc.text('Table of Contents', 20, 40)

  doc.setDrawColor(COLORS.primary)
  doc.line(20, 45, 190, 45)

  let yPosition = 60

  treatmentPlan.treatments.forEach((session, index) => {
    doc.setFontSize(12)
    doc.setFont(FONTS.normal)
    doc.setTextColor(COLORS.dark)
    doc.text(`Session ${session.session_number}`, 25, yPosition)

    doc.setFontSize(10)
    doc.setTextColor(COLORS.light)
    doc.text(`Week ${session.week} - ${session.treatment_time}`, 60, yPosition)

    doc.setTextColor(COLORS.primary)
    doc.text(`Page ${index + 3}`, 180, yPosition, { align: 'right' })

    yPosition += 8
  })
}

// Session page
const addSessionPage = (doc, session, progressData, pageNumber) => {
  const margin = 20
  let y = margin

  // Session header
  doc.setFillColor(COLORS.primary)
  doc.rect(margin, y, 170, 8, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont(FONTS.bold)
  doc.text(`SESSION ${session.session_number}`, margin + 5, y + 5.5)

  y += 12

  // Session title
  doc.setTextColor(COLORS.dark)
  doc.setFontSize(14)
  doc.setFont(FONTS.bold)
  const titleLines = doc.splitTextToSize(session.title, 170)
  doc.text(titleLines, margin, y)
  y += titleLines.length * 6 + 4

  // Session info
  doc.setFontSize(10)
  doc.setFont(FONTS.normal)
  doc.setTextColor(COLORS.light)
  doc.text(
    `Week ${session.week} • ${session.treatment_time} • ${getProgressText(session, progressData)}`,
    margin,
    y,
  )
  y += 8

  // Divider
  doc.setDrawColor(COLORS.border)
  doc.line(margin, y, 190, y)
  y += 12

  // Preparation section
  y = addPreparationSection(doc, session, progressData, y)
  y += 10

  // Treatment goals section
  y = addTreatmentGoalsSection(doc, session, progressData, y)
  y += 10

  // Treatment steps section
  y = addTreatmentStepsSection(doc, session, progressData, y)

  // Page number
  doc.setFontSize(8)
  doc.setTextColor(COLORS.light)
  doc.text(`Page ${pageNumber}`, 105, 287, { align: 'center' })
}

// Preparation section
const addPreparationSection = (doc, session, progressData, startY) => {
  let y = startY

  // Section header
  doc.setFontSize(12)
  doc.setFont(FONTS.bold)
  doc.setTextColor(COLORS.dark)
  doc.text('Preparation Checklist', 20, y)
  y += 6

  // Progress
  const completed = Math.round(
    progressData.getPreparationProgress(session.session_number) *
      session.preparations_checklist_for_therapist.length,
  )
  const total = session.preparations_checklist_for_therapist.length
  doc.setFontSize(9)
  doc.setFont(FONTS.italic)
  doc.setTextColor(COLORS.light)
  doc.text(`${completed}/${total} completed`, 20, y)
  y += 8

  // Checklist items
  doc.setFontSize(9)
  doc.setFont(FONTS.normal)

  session.preparations_checklist_for_therapist.forEach((item, index) => {
    if (y > 250) return // Don't go beyond page

    const isChecked = progressData.getPreparationStatus(session.session_number, index)

    // Checkbox
    doc.setDrawColor(isChecked ? COLORS.success : COLORS.border)
    doc.setFillColor(isChecked ? COLORS.success : 255)
    doc.rect(20, y, 3, 3, isChecked ? 'FD' : 'D')

    if (isChecked) {
      doc.setFontSize(6)
      doc.setTextColor(255, 255, 255)
      doc.text('✓', 21.5, y + 2.2, { align: 'center' })
    }

    // Item text
    doc.setFontSize(9)
    doc.setTextColor(isChecked ? COLORS.success : COLORS.dark)
    doc.setFont(isChecked ? FONTS.bold : FONTS.normal)

    const lines = doc.splitTextToSize(item, 160)
    doc.text(lines, 28, y + 2.2)

    y += lines.length * 4.5 + 2
  })

  return y
}

// Treatment goals section
const addTreatmentGoalsSection = (doc, session, progressData, startY) => {
  let y = startY

  // Section header
  doc.setFontSize(12)
  doc.setFont(FONTS.bold)
  doc.setTextColor(COLORS.dark)
  doc.text('Treatment Goals', 20, y)
  y += 6

  // Progress
  const completed = progressData.getConcernsProgress(session.session_number)
  const total = session.concerns_addressed.length
  doc.setFontSize(9)
  doc.setFont(FONTS.italic)
  doc.setTextColor(COLORS.light)
  doc.text(`${completed}/${total} addressed`, 20, y)
  y += 8

  // Goals
  doc.setFontSize(9)
  doc.setFont(FONTS.normal)

  session.concerns_addressed.forEach((concern, index) => {
    if (y > 250) return

    const isCompleted = progressData.getConcernCompletion(session.session_number, index)

    // Goal container
    doc.setDrawColor(isCompleted ? COLORS.success : COLORS.border)
    doc.setFillColor(isCompleted ? '#E8F5E8' : COLORS.background)
    doc.rect(20, y, 170, 12, 'FD')

    // Goal name
    doc.setFontSize(9)
    doc.setFont(FONTS.bold)
    doc.setTextColor(COLORS.dark)
    doc.text(concern.concern, 25, y + 4)

    // Current vs Target
    doc.setFontSize(8)
    doc.setFont(FONTS.normal)
    doc.setTextColor(COLORS.light)
    doc.text(`Current: ${concern.current_value}`, 25, y + 8.5)
    doc.text(`Target: ${concern.target_value}`, 100, y + 8.5)

    // Status indicator
    if (isCompleted) {
      doc.setFillColor(COLORS.success)
      doc.circle(185, y + 6, 3, 'F')
      doc.setFontSize(6)
      doc.setTextColor(255, 255, 255)
      doc.text('✓', 185, y + 7, { align: 'center' })
    }

    y += 15
  })

  return y
}

// Treatment steps section
const addTreatmentStepsSection = (doc, session, progressData, startY) => {
  let y = startY

  // Section header
  doc.setFontSize(12)
  doc.setFont(FONTS.bold)
  doc.setTextColor(COLORS.dark)
  doc.text('Treatment Steps', 20, y)
  y += 6

  // Progress
  const completed = progressData.getCompletedSteps(session.session_number)
  const total = session.steps.length
  doc.setFontSize(9)
  doc.setFont(FONTS.italic)
  doc.setTextColor(COLORS.light)
  doc.text(`${completed}/${total} completed`, 20, y)
  y += 8

  // Steps
  session.steps.forEach((step, index) => {
    if (y > 250) return

    const isCompleted = progressData.getStepProgress(session.session_number, step.step_number) === 1

    // Step header
    doc.setFontSize(10)
    doc.setFont(FONTS.bold)
    doc.setTextColor(COLORS.primary)
    doc.text(`Step ${step.step_number} • ${step.duration} minutes`, 20, y)
    y += 5

    // Ingredients
    doc.setFontSize(8)
    doc.setFont(FONTS.bold)
    doc.setTextColor(COLORS.dark)
    doc.text('Ingredients & Equipment:', 20, y)
    y += 3.5

    doc.setFont(FONTS.normal)
    doc.setTextColor(COLORS.light)
    const ingredientsText = step.ingredients_equipments.join(', ')
    const ingredientLines = doc.splitTextToSize(ingredientsText, 170)
    doc.text(ingredientLines, 20, y)
    y += ingredientLines.length * 3.5

    // Procedure
    doc.setFontSize(8)
    doc.setFont(FONTS.bold)
    doc.setTextColor(COLORS.dark)
    doc.text('Procedure:', 20, y)
    y += 3.5

    doc.setFont(FONTS.normal)
    doc.setTextColor(COLORS.dark)
    const procedureLines = doc.splitTextToSize(step.how_to_do, 170)
    doc.text(procedureLines, 20, y)
    y += procedureLines.length * 3.5

    // Completion indicator
    if (isCompleted) {
      doc.setFillColor(COLORS.success)
      doc.rect(175, y - 15, 15, 4, 'F')
      doc.setFontSize(6)
      doc.setTextColor(255, 255, 255)
      doc.text('COMPLETED', 182.5, y - 13, { align: 'center' })
    }

    y += 8

    // Divider between steps (except last)
    if (index < session.steps.length - 1) {
      doc.setDrawColor(COLORS.border)
      doc.line(20, y, 190, y)
      y += 12
    }
  })

  return y
}

// Helper functions
const getProgressText = (session, progressData) => {
  const progress = progressData.getOverallSessionProgress(session.session_number)
  if (progress === 1) return 'Completed'
  if (progress > 0) return `${Math.round(progress * 100)}% Complete`
  return 'Not Started'
}

// Pure functions for concern status
export const getConcernProgress = (current, target) => {
  if (typeof current === 'number' && typeof target === 'number') {
    if (current > target) {
      const max = Math.max(current, target) + 1
      const progress = (max - current) / (max - target)
      return Math.min(Math.max(progress, 0), 1)
    } else if (current < target) {
      const progress = current / target
      return Math.min(Math.max(progress, 0), 1)
    } else {
      return 1
    }
  }
  return 0.5
}

export const getConcernStatus = (current, target) => {
  if (current === target) return 'Goal Achieved'
  const progress = getConcernProgress(current, target)
  if (progress >= 0.8) return 'Excellent Progress'
  if (progress >= 0.5) return 'Good Progress'
  return 'Needs Attention'
}

export const getConcernStatusColor = (current, target) => {
  if (current === target) return COLORS.success
  const progress = getConcernProgress(current, target)
  if (progress >= 0.8) return '#F39C12'
  if (progress >= 0.5) return COLORS.accent
  return COLORS.light
}
