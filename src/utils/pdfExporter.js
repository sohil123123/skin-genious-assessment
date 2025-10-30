import html2pdf from 'html2pdf.js'

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
  if (current === target) return '#10B981'
  const progress = getConcernProgress(current, target)
  if (progress >= 0.8) return '#F59E0B'
  if (progress >= 0.5) return '#3B82F6'
  return '#6B7280'
}

// Main PDF export function
export const exportTreatmentPlanToPDF = (treatmentPlan, progressData) => {
  const element = document.createElement('div')
  element.style.padding = '10px'
  element.style.fontFamily = "'Helvetica', 'Arial', sans-serif"
  element.style.background = '#ffffff'
  element.style.color = '#374151'
  element.style.fontSize = '12px'

  // Header Section
  const header = createPDFHeader(treatmentPlan)

  // Overview Section
  const overview = createOverviewSection(treatmentPlan, progressData)

  // Detailed Sessions
  const sessionsContent = createSessionsContent(treatmentPlan, progressData)

  // Combine all content
  element.innerHTML = header + overview + sessionsContent

  // PDF options with better page break control
  const options = {
    margin: [0.5, 0.5, 0.5, 0.5],
    filename: `AI_Aesthetics_Treatment_Plan_${new Date().toISOString().split('T')[0]}.pdf`,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      letterRendering: true,
      allowTaint: true,
    },
    jsPDF: {
      unit: 'in',
      format: 'a4',
      orientation: 'portrait',
      compress: true,
    },
    pagebreak: {
      mode: ['css', 'legacy'],
      before: '.page-break-before',
      after: '.page-break-after',
      avoid: '.avoid-break',
    },
  }

  // Generate PDF
  return html2pdf()
    .set(options)
    .from(element)
    .save()
    .catch((err) => {
      console.error('PDF generation failed:', err)
      throw new Error('Failed to generate PDF. Please try again.')
    })
}

// Helper functions for PDF sections
const createPDFHeader = (treatmentPlan) => {
  return `
    <div class="avoid-break" style="text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #7C3AED;">
      <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 12px;">
        <div style="width: 40px; height: 40px; border: 2px solid #1F2937; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
          <span style="font-size: 16px; font-family: serif; font-weight: bold;">A</span>
        </div>
        <h1 style="color: #1F2937; margin: 0; font-size: 22px; font-weight: 300; letter-spacing: 1px;">AI AESTHETICS</h1>
      </div>
      <h2 style="color: #7C3AED; margin: 8px 0 4px 0; font-size: 16px; font-weight: 500;">
        Professional Skin Treatment Plan
      </h2>
      <div style="display: flex; justify-content: center; gap: 15px; font-size: 11px; color: #6B7280;">
        <span><strong>Duration:</strong> ${treatmentPlan.total_time}</span>
        <span>•</span>
        <span><strong>Generated:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
        <span>•</span>
        <span><strong>Sessions:</strong> ${treatmentPlan.treatments.length}</span>
      </div>
    </div>
  `
}

const createOverviewSection = (treatmentPlan, progressData) => {
  let overview = `
    <div class="avoid-break" style="margin-bottom: 25px;">
      <h3 style="color: #1F2937; border-bottom: 2px solid #E5E7EB; padding-bottom: 6px; font-size: 16px; font-weight: 600; margin-bottom: 12px;">
        📋 Treatment Plan Overview
      </h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px;">
  `

  treatmentPlan.treatments.forEach((session) => {
    const progress = progressData.getOverallSessionProgress(session.session_number)
    const progressPercent = Math.round(progress * 100)
    const isCompleted = progressData.completedSessions
      ? progressData.completedSessions.includes(session.session_number)
      : false

    overview += `
      <div style="border: 1px solid #E5E7EB; padding: 12px; border-radius: 8px; background: ${isCompleted ? '#F0FDF4' : '#F8FAFC'}; border-left: 4px solid ${isCompleted ? '#10B981' : '#7C3AED'};">
        <div style="display: flex; justify-content: between; align-items: start; margin-bottom: 6px;">
          <div style="font-weight: 600; color: #1F2937; font-size: 13px;">Session ${session.session_number}</div>
          ${
            isCompleted
              ? `
            <span style="background: #10B981; color: white; padding: 2px 6px; border-radius: 10px; font-size: 9px; font-weight: 500;">COMPLETED</span>
          `
              : ''
          }
        </div>
        <div style="font-size: 11px; color: #6B7280; margin-bottom: 6px;">
          <div>Week ${session.week} • ${session.treatment_time}</div>
          <div style="font-size: 10px; margin-top: 2px; line-height: 1.2;">${session.title.split('+').slice(0, 2).join(' + ')}</div>
        </div>
        <div style="margin-top: 8px;">
          <div style="display: flex; justify-content: between; font-size: 10px; color: #6B7280; margin-bottom: 3px;">
            <span>Progress</span>
            <span>${progressPercent}%</span>
          </div>
          <div style="background: #E5E7EB; border-radius: 6px; height: 5px; overflow: hidden;">
            <div style="background: ${isCompleted ? '#10B981' : '#7C3AED'}; height: 100%; border-radius: 6px; width: ${progressPercent}%;"></div>
          </div>
        </div>
      </div>
    `
  })

  overview += `</div></div>`
  return overview
}

const createSessionsContent = (treatmentPlan, progressData) => {
  let sessionsContent = ''

  treatmentPlan.treatments.forEach((session, index) => {
    const sessionProgress = progressData.getOverallSessionProgress(session.session_number)
    const preparationProgress = progressData.getPreparationProgress(session.session_number)
    const completedSteps = progressData.getCompletedSteps(session.session_number)
    const concernsProgress = progressData.getConcernsProgress(session.session_number)
    const isCompleted = progressData.completedSessions
      ? progressData.completedSessions.includes(session.session_number)
      : false

    sessionsContent += `
      <div class="page-break-before" style="page-break-before: ${index > 0 ? 'always' : 'auto'}; margin-bottom: 25px;">
        <!-- Session Header - Keep together -->
        <div class="avoid-break" style="background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%); color: white; padding: 15px; border-radius: 10px; margin-bottom: 15px; box-shadow: 0 2px 4px rgba(124, 58, 237, 0.2);">
          <div style="display: flex; justify-content: between; align-items: start; margin-bottom: 6px;">
            <h2 style="margin: 0; font-size: 16px; font-weight: 600; flex: 1; line-height: 1.2;">Session ${session.session_number}: ${session.title}</h2>
            ${
              isCompleted
                ? `
              <span style="background: rgba(255,255,255,0.2); color: white; padding: 3px 8px; border-radius: 12px; font-size: 10px; font-weight: 500; border: 1px solid rgba(255,255,255,0.3);">
                ✅ COMPLETED
              </span>
            `
                : ''
            }
          </div>
          <div style="display: flex; gap: 12px; font-size: 11px; opacity: 0.9; flex-wrap: wrap;">
            <span>📅 Week ${session.week}</span>
            <span>⏱️ ${session.treatment_time}</span>
            <span>📊 ${Math.round(sessionProgress * 100)}% Complete</span>
          </div>
        </div>

        <!-- Main Content - Try to keep columns together -->
        <div class="avoid-break" style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 15px; margin-bottom: 15px;">
          <!-- Left Column -->
          <div>
            ${createPreparationSection(session, progressData)}
            ${createTreatmentGoalsSection(session, progressData)}
          </div>

          <!-- Right Column - Treatment Steps -->
          <div>
            ${createTreatmentStepsSection(session, progressData)}
          </div>
        </div>

        <!-- Session Progress Summary -->
        <div class="avoid-break" style="background: #F8FAFC; border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px; margin-top: 15px;">
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; text-align: center;">
            <div>
              <div style="font-size: 18px; font-weight: 700; color: #7C3AED; margin-bottom: 3px;">${completedSteps}/${session.steps.length}</div>
              <div style="font-size: 10px; color: #6B7280; font-weight: 500;">STEPS COMPLETE</div>
            </div>
            <div>
              <div style="font-size: 18px; font-weight: 700; color: #10B981; margin-bottom: 3px;">${Math.round(preparationProgress * 100)}%</div>
              <div style="font-size: 10px; color: #6B7280; font-weight: 500;">PREPARATION</div>
            </div>
            <div>
              <div style="font-size: 18px; font-weight: 700; color: #F59E0B; margin-bottom: 3px;">${concernsProgress}/${session.concerns_addressed.length}</div>
              <div style="font-size: 10px; color: #6B7280; font-weight: 500;">GOALS ADDRESSED</div>
            </div>
          </div>
        </div>
      </div>
    `
  })

  return sessionsContent
}

const createPreparationSection = (session, progressData) => {
  const completedCount =
    progressData.getPreparationProgress(session.session_number) *
    session.preparations_checklist_for_therapist.length
  const totalCount = session.preparations_checklist_for_therapist.length

  return `
    <div class="avoid-break" style="background: white; border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px; margin-bottom: 15px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
      <div style="display: flex; align-items: center; margin-bottom: 12px;">
        <div style="background: #10B981; color: white; width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; margin-right: 8px; font-size: 12px; font-weight: 600;">✓</div>
        <div>
          <h4 style="color: #1F2937; margin: 0; font-size: 14px; font-weight: 600;">Preparation Checklist</h4>
          <div style="font-size: 10px; color: #6B7280; margin-top: 2px;">${Math.round(completedCount)}/${totalCount} completed</div>
        </div>
      </div>

      <div style="font-size: 11px;">
        ${session.preparations_checklist_for_therapist
          .map((prep, index) => {
            const isChecked = progressData.getPreparationStatus(session.session_number, index)
            return `
            <div style="display: flex; align-items: start; margin-bottom: 8px; padding: 6px; border-radius: 5px; background: ${isChecked ? '#F0FDF4' : 'transparent'}; border: 1px solid ${isChecked ? '#10B981' : '#F3F4F6'};">
              <div style="margin-right: 8px; margin-top: 1px;">
                <div style="width: 14px; height: 14px; border: 2px solid ${isChecked ? '#10B981' : '#D1D5DB'}; border-radius: 3px; background: ${isChecked ? '#10B981' : 'white'}; display: flex; align-items: center; justify-content: center; font-size: 9px; color: white;">
                  ${isChecked ? '✓' : ''}
                </div>
              </div>
              <div style="color: ${isChecked ? '#065F46' : '#374151'}; line-height: 1.3; flex: 1; font-size: 10.5px;">
                ${prep}
              </div>
            </div>
          `
          })
          .join('')}
      </div>
    </div>
  `
}

const createTreatmentGoalsSection = (session, progressData) => {
  const completedCount = progressData.getConcernsProgress(session.session_number)
  const totalCount = session.concerns_addressed.length

  return `
    <div class="avoid-break" style="background: white; border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
      <div style="display: flex; align-items: center; margin-bottom: 12px;">
        <div style="background: #F59E0B; color: white; width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; margin-right: 8px; font-size: 12px; font-weight: 600;">🎯</div>
        <div>
          <h4 style="color: #1F2937; margin: 0; font-size: 14px; font-weight: 600;">Treatment Goals</h4>
          <div style="font-size: 10px; color: #6B7280; margin-top: 2px;">${completedCount}/${totalCount} addressed</div>
        </div>
      </div>

      <div style="font-size: 11px;">
        ${session.concerns_addressed
          .map((concern, index) => {
            const isCompleted = progressData.getConcernCompletion(session.session_number, index)
            const statusColor = getConcernStatusColor(concern.current_value, concern.target_value)
            const status = getConcernStatus(concern.current_value, concern.target_value)
            const progress = getConcernProgress(concern.current_value, concern.target_value)

            return `
            <div style="border: 1px solid ${isCompleted ? '#10B981' : '#E5E7EB'}; padding: 10px; border-radius: 6px; margin-bottom: 8px; background: ${isCompleted ? '#F0FDF4' : '#F8FAFC'}; border-left: 3px solid ${statusColor};">
              <div style="display: flex; justify-content: between; align-items: start; margin-bottom: 6px;">
                <div style="font-weight: 600; color: #1F2937; font-size: 12px; line-height: 1.2;">${concern.concern}</div>
                ${
                  isCompleted
                    ? `
                  <span style="background: #10B981; color: white; padding: 2px 5px; border-radius: 8px; font-size: 8px; font-weight: 500;">ADDRESSED</span>
                `
                    : ''
                }
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 10px;">
                <div style="text-align: center; flex: 1;">
                  <div style="color: #6B7280; margin-bottom: 1px;">Current</div>
                  <div style="font-weight: 600; color: #374151;">${concern.current_value}</div>
                </div>
                <div style="color: #9CA3AF; margin: 0 8px;">→</div>
                <div style="text-align: center; flex: 1;">
                  <div style="color: #6B7280; margin-bottom: 1px;">Target</div>
                  <div style="font-weight: 700; color: #10B981;">${concern.target_value}</div>
                </div>
              </div>

              <div style="margin-top: 6px;">
                <div style="display: flex; justify-content: between; font-size: 9px; color: #6B7280; margin-bottom: 3px;">
                  <span>Progress</span>
                  <span>${Math.round(progress * 100)}% - ${status}</span>
                </div>
                <div style="background: #E5E7EB; border-radius: 3px; height: 4px; overflow: hidden;">
                  <div style="background: ${statusColor}; height: 100%; border-radius: 3px; width: ${progress * 100}%;"></div>
                </div>
              </div>
            </div>
          `
          })
          .join('')}
      </div>
    </div>
  `
}

const createTreatmentStepsSection = (session, progressData) => {
  const completedCount = progressData.getCompletedSteps(session.session_number)
  const totalCount = session.steps.length

  return `
    <div class="avoid-break" style="background: white; border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
      <div style="display: flex; align-items: center; margin-bottom: 12px;">
        <div style="background: #3B82F6; color: white; width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; margin-right: 8px; font-size: 12px; font-weight: 600;">⏱</div>
        <div>
          <h4 style="color: #1F2937; margin: 0; font-size: 14px; font-weight: 600;">Treatment Steps</h4>
          <div style="font-size: 10px; color: #6B7280; margin-top: 2px;">${completedCount}/${totalCount} completed</div>
        </div>
      </div>

      <div style="font-size: 11px;">
        ${session.steps
          .map((step) => {
            const isStepCompleted =
              progressData.getStepProgress(session.session_number, step.step_number) === 1

            return `
            <div style="border-left: 2px solid ${isStepCompleted ? '#10B981' : '#3B82F6'}; padding: 10px; margin-bottom: 10px; background: ${isStepCompleted ? '#F0FDF4' : '#F8FAFC'}; border-radius: 0 6px 6px 0; position: relative;">
              ${
                isStepCompleted
                  ? `
                <div style="position: absolute; top: 8px; right: 8px; background: #10B981; color: white; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: bold;">✓</div>
              `
                  : ''
              }

              <div style="display: flex; justify-content: between; align-items: start; margin-bottom: 8px;">
                <h5 style="margin: 0; color: #1F2937; font-size: 12px; font-weight: 600;">Step ${step.step_number}</h5>
                <span style="background: #6B7280; color: white; padding: 2px 6px; border-radius: 10px; font-size: 9px; font-weight: 500;">${step.duration} min</span>
              </div>

              <div style="margin-bottom: 8px;">
                <div style="font-weight: 600; color: #4B5563; font-size: 10px; margin-bottom: 4px;">Ingredients & Equipment:</div>
                <div style="display: flex; flex-wrap: wrap; gap: 3px;">
                  ${step.ingredients_equipments
                    .map(
                      (item) =>
                        `<span style="background: #7C3AED; color: white; padding: 2px 6px; border-radius: 10px; font-size: 8px; font-weight: 500;">${item}</span>`,
                    )
                    .join('')}
                </div>
              </div>

              <div>
                <div style="font-weight: 600; color: #4B5563; font-size: 10px; margin-bottom: 4px;">Procedure:</div>
                <p style="margin: 0; color: #374151; line-height: 1.4; font-size: 10.5px;">${step.how_to_do}</p>
              </div>
            </div>
          `
          })
          .join('')}
      </div>
    </div>
  `
}
