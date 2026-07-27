import { defineStore } from 'pinia'
import { useOpenAI } from 'src/composables/useOpenAI'
import { useAssessmentStore } from 'src/stores/assessmentStore'
import { api } from 'src/boot/axios'
import { Loading, LocalStorage } from 'quasar'
import { useCommonStore } from 'src/stores/commonStore'
import {
  IMAGE_SYSTEM_PROMPT,
  DYNAMIC_QUESTIONS_PROMPT,
  DIAGNOSIS_PROMPT,
  PLAN_PROMPT,
  PLAN_EXECUTION_REPAIR_PROMPT,
  PIGMENTATION_CLINICAL_POLICY_V2,
  REASSESS_PROMPT,
  REASSESS_QUESTIONS_PROMPT,
} from 'src/services/pigmentationPromptsV2_1'
import { PIGMENTATION_CONFIG, getPigmentationProtocolById } from 'src/services/pigmentationConfigV2'
import {
  buildRelevantPlanConfig,
  assertTreatmentProtocolPreflight,
} from 'src/services/pigmentationPlanOptimizer'
import {
  validatePigmentationPlan,
  validatePigmentationTreatmentBlock,
} from 'src/services/pigmentation/Validators/pigmentationPlanValidator'
import {
  validateAndScorePigmentationImageAnalysis,
  extractImmutablePigmentationMetrics,
  assertDiagnosisCopiedImmutableMetrics,
  validatePigmentationDiagnosis,
  assertDiagnosisReadyForTreatmentPlanning,
  buildCompactPhenotypeForDiagnosis,
  initializeDoctorClassificationState,
  applyDoctorClassificationsToDiagnosis,
  assertNoPendingDoctorClassifications,
} from 'src/services/pigmentation/Validators/pigmentationImageValidation'

const PIGMENTATION_MODE_ROLE_LABELS = Object.freeze({
  white:
    'WHITE — primary for gross contour/elevation, highlight-shadow changes, lesion count, colour, distribution, anatomical location and structural shadow.',
  surface_polarized:
    'SURFACE_POLARIZED — primary for surface texture, scale, keratotic/verrucous character and edge definition; secondary corroboration of elevation.',
  subsurface_polarized:
    'SUBSURFACE_POLARIZED — primary for subsurface pigment persistence/deeper contribution and secondary vascular corroboration; not a negative test for elevation.',
  red: 'RED — relative vascular/erythematous distribution only; discount global cast; not a negative test for pigment or elevation.',
  woods_uv:
    'WOODS_UV — epidermal pigment accentuation and supportive dryness/fluorescence evidence; not a negative test for elevation and not histology.',
})

function buildModeLabelledImageContent(images, initialText, finalAuditText = '', zonePanels = []) {
  const content = [{ type: 'text', text: initialText }]
  images.forEach((image, index) => {
    content.push({
      type: 'text',
      text: `IMAGE ${index + 1} — ${PIGMENTATION_MODE_ROLE_LABELS[image.mode] || image.mode}`,
    })
    content.push({ type: 'image_id', file_id: image.openai_file_id, detail: 'high' })
  })

  if (zonePanels.length) {
    content.push({
      type: 'text',
      text: 'STANDARD WHOLE-FACE ZONE PANELS follow. Each panel shows WHITE on the left and SURFACE_POLARIZED on the right for the same facial zone. They are magnified supporting views of the same standardized captures. Use full images for orientation and panels for fine morphology.',
    })
    zonePanels.forEach((panel, index) => {
      content.push({
        type: 'text',
        text: `ZONE PANEL ${index + 1} — ${panel.patient_region} — role ${panel.role}. WHITE is left; SURFACE_POLARIZED is right.`,
      })
      content.push({ type: 'image_id', file_id: panel.openai_file_id, detail: 'high' })
    })
  }

  if (finalAuditText) content.push({ type: 'text', text: finalAuditText })
  return content
}

async function sourceBlobForPanel(imageRecord) {
  if (imageRecord?.file instanceof Blob) return imageRecord.file
  if (imageRecord?.base64 && typeof fetch === 'function') {
    const response = await fetch(imageRecord.base64)
    if (!response.ok)
      throw new Error(`Unable to read ${imageRecord.name || 'capture'} for zone panel.`)
    return response.blob()
  }
  return null
}

async function createZonePanelFile(whiteRecord, surfaceRecord, panelSpec) {
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined' || !panelSpec) {
    return null
  }

  const [whiteBlob, surfaceBlob] = await Promise.all([
    sourceBlobForPanel(whiteRecord),
    sourceBlobForPanel(surfaceRecord),
  ])
  if (!whiteBlob || !surfaceBlob) return null

  const [whiteBitmap, surfaceBitmap] = await Promise.all([
    createImageBitmap(whiteBlob),
    createImageBitmap(surfaceBlob),
  ])

  try {
    const crop = (bitmap) => {
      const sx = Math.max(0, Math.round(bitmap.width * panelSpec.x))
      const sy = Math.max(0, Math.round(bitmap.height * panelSpec.y))
      const sw = Math.max(
        1,
        Math.min(bitmap.width - sx, Math.round(bitmap.width * panelSpec.width)),
      )
      const sh = Math.max(
        1,
        Math.min(bitmap.height - sy, Math.round(bitmap.height * panelSpec.height)),
      )
      return { sx, sy, sw, sh }
    }

    const whiteCrop = crop(whiteBitmap)
    const surfaceCrop = crop(surfaceBitmap)
    const targetSideWidth = Math.min(900, whiteCrop.sw, surfaceCrop.sw)
    const aspect = Math.min(whiteCrop.sh / whiteCrop.sw, surfaceCrop.sh / surfaceCrop.sw)
    const targetHeight = Math.max(1, Math.round(targetSideWidth * aspect))
    const headerHeight = 54

    const canvas = document.createElement('canvas')
    canvas.width = targetSideWidth * 2
    canvas.height = targetHeight + headerHeight
    const context = canvas.getContext('2d', { alpha: false })
    if (!context) return null

    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = '#111111'
    context.font = 'bold 22px sans-serif'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText('WHITE', targetSideWidth / 2, headerHeight / 2)
    context.fillText('SURFACE POLARIZED', targetSideWidth + targetSideWidth / 2, headerHeight / 2)

    context.drawImage(
      whiteBitmap,
      whiteCrop.sx,
      whiteCrop.sy,
      whiteCrop.sw,
      whiteCrop.sh,
      0,
      headerHeight,
      targetSideWidth,
      targetHeight,
    )
    context.drawImage(
      surfaceBitmap,
      surfaceCrop.sx,
      surfaceCrop.sy,
      surfaceCrop.sw,
      surfaceCrop.sh,
      targetSideWidth,
      headerHeight,
      targetSideWidth,
      targetHeight,
    )

    const quality = Number(
      PIGMENTATION_CONFIG.image_acquisition?.zone_panel_contract?.jpeg_quality || 0.92,
    )
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', Math.min(1, Math.max(0.7, quality))),
    )
    if (!blob) return null

    const filename = `${panelSpec.panel_id}.jpg`
    return typeof File === 'function' ? new File([blob], filename, { type: 'image/jpeg' }) : blob
  } finally {
    whiteBitmap.close?.()
    surfaceBitmap.close?.()
  }
}

const AI_STAGE_TEXT_LIMITS = Object.freeze({
  pigmentation_observation_image_analysis: 50000,
  dynamic_questions: 35000,
  diagnosis: 55000,
  treatment_plan: 75000,
  formal_reassessment: 85000,
  reassessment_questions: 35000,
})

function toFiniteNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function normalizeExecutableOperationParameters(
  plan,
  protocolLookup = getPigmentationProtocolById,
) {
  const normalizeOperation = (operation) => {
    if (!operation || !operation.protocol_id) return
    const protocol = protocolLookup(operation.protocol_id)
    if (!protocol) return
    const params =
      operation.parameters && typeof operation.parameters === 'object'
        ? { ...operation.parameters }
        : {}

    if (['q_switch_laser', 'focal_laser'].includes(operation.modality_id)) {
      if (
        params.wavelength_nm === undefined &&
        Array.isArray(params.allowed_wavelengths_nm) &&
        params.allowed_wavelengths_nm.length === 1
      ) {
        params.wavelength_nm = Number(params.allowed_wavelengths_nm[0])
      }
      for (const key of ['wavelength_nm', 'energy_mj', 'frequency_hz', 'passes']) {
        const value = toFiniteNumber(params[key])
        if (value !== null) params[key] = value
      }
      const energy = toFiniteNumber(params.energy_mj)
      const spotArea = toFiniteNumber(protocol.spot_area_cm2 || protocol.spot_area || 1)
      if (energy !== null && spotArea && spotArea > 0) {
        params.fluence_j_cm2 = Number((energy / 1000 / spotArea).toFixed(4))
      }
    }

    if (operation.modality_id === 'led') {
      const duration = toFiniteNumber(params.duration_minutes)
      if (duration !== null) params.duration_minutes = duration
    }

    operation.parameters = params
  }

  const currentSessions = plan?.current_treatment_block?.sessions || plan?.current_sessions || []
  for (const session of currentSessions) {
    for (const operation of session.treatment_operations || session.operations || []) {
      normalizeOperation(operation)
    }
  }
  return plan
}

function isExecutionContractRepairable(errors = []) {
  if (!errors.length) return false
  const repairable =
    /copied protocol configuration|requires an allowed scalar wavelength|energy_mj must be a scalar|frequency_hz must be a scalar|passes must be a scalar|cannot derive fluence|microneedling requires parameters\.active_id|requires depth_by_region_mm|copied microneedling configuration|copied the LED duration range|LED duration_minutes|Roadmap block/i
  return errors.every((error) => repairable.test(String(error)))
}

function mergeExecutionRepair(plan, repair) {
  if (repair?.current_treatment_block) plan.current_treatment_block = repair.current_treatment_block
  if (repair?.master_treatment_roadmap)
    plan.master_treatment_roadmap = repair.master_treatment_roadmap
  return plan
}

function normalizeTreatmentPlanCourse(plan) {
  if (!plan || typeof plan !== 'object') return plan
  const normalized = { ...plan }

  if (Array.isArray(normalized.current_sessions) && !normalized.current_treatment_block) {
    normalized.current_treatment_block = {
      block_number: 1,
      session_numbers: normalized.current_sessions.map((session) => session.session_number),
      sessions: normalized.current_sessions,
      reassessment_gate: normalized.reassessment_gate || null,
    }
  }

  const detailedSessions = Array.isArray(normalized.current_treatment_block?.sessions)
    ? normalized.current_treatment_block.sessions
    : Array.isArray(normalized.sessions)
      ? normalized.sessions
      : []
  normalized.current_sessions = detailedSessions
  normalized.sessions = detailedSessions.map((session) => ({
    id: session.id || session.session_number,
    status: session.status || 'pending',
    ...session,
  }))

  if (normalized.full_course_summary && !normalized.initial_full_course_summary) {
    normalized.initial_full_course_summary = JSON.parse(
      JSON.stringify(normalized.full_course_summary),
    )
  }

  const allocations = [
    ...(normalized.full_course_summary?.planned_modality_allocation || []),
    ...(normalized.full_course_summary?.separately_planned_focal_procedures || []),
  ]
  normalized.protocol_count_summary = allocations.map((allocation) => ({
    modality_id: allocation.modality_id,
    protocol_id: allocation.protocol_id,
    planned_uses: Number(allocation.planned_uses || 0),
    linked_component_ids: allocation.linked_component_ids || [],
    session_numbers: allocation.session_numbers || [],
  }))

  // The clinic prices packages manually by treatment visits (for example Q-switch x3
  // and microneedling x3), not by the number of regional protocols executed within
  // the same visit. Derive this view deterministically from reconciled protocol uses.
  const modalityMap = new Map()
  for (const allocation of allocations) {
    if (!allocation?.modality_id) continue
    const current = modalityMap.get(allocation.modality_id) || {
      modality_id: allocation.modality_id,
      session_numbers: new Set(),
      protocol_ids: new Set(),
      linked_component_ids: new Set(),
    }
    for (const number of allocation.session_numbers || []) {
      const parsed = Number(number)
      if (Number.isInteger(parsed) && parsed > 0) current.session_numbers.add(parsed)
    }
    if (allocation.protocol_id) current.protocol_ids.add(allocation.protocol_id)
    for (const componentId of allocation.linked_component_ids || []) {
      if (componentId) current.linked_component_ids.add(componentId)
    }
    modalityMap.set(allocation.modality_id, current)
  }

  normalized.package_modality_summary = [...modalityMap.values()]
    .map((entry) => {
      const sessionNumbers = [...entry.session_numbers].sort((a, b) => a - b)
      return {
        modality_id: entry.modality_id,
        planned_visits: sessionNumbers.length,
        session_numbers: sessionNumbers,
        protocol_ids: [...entry.protocol_ids],
        linked_component_ids: [...entry.linked_component_ids],
      }
    })
    .filter((entry) => entry.planned_visits > 0)

  const packageModalityLabels = {
    q_switch_laser: 'Q-switch',
    focal_laser: 'Focal laser',
    microneedling_with_active: 'Microneedling with active',
    chemical_peel: 'Chemical peel',
    electrocautery_or_rf: 'Electrocautery / RF',
  }
  normalized.derived_package_summary_text = normalized.package_modality_summary
    .map(
      (entry) =>
        `${packageModalityLabels[entry.modality_id] || entry.modality_id.replace(/_/g, ' ')} ×${entry.planned_visits}`,
    )
    .join(' + ')

  return normalized
}

export const usePigmentationStore = defineStore('pigmentation', {
  state: () => ({
    model: import.meta.env.VITE_PIGMENTATION_MODEL || 'gpt-5.2',
    isConnected: false,
    conversationId: '',
    id: null,
    clinic_id: null,
    therapist_id: null,
    user_id: null,

    currentStage: 0,

    // File arrays
    attachedImages: [],
    reassessImages: [],

    dynamicAnswers: {},
    fixedHistory: {
      duration: '',
      stability_last_4_6_weeks: '',
      recurrence_after_improvement: '',
      sunscreen_use: '',
      sunscreen_reapplication: '',
      outdoor_heat_exposure: '',
      trigger_history: [],
      current_product_use: [],
      current_sensitivity: '',
      previous_treatments: [],
      previous_treatment_response: '',
      active_new_acne_frequency: '',
      procedure_safety: [],
      red_flag_lesion_change: '',
    },

    // Safety switches and Red flags
    safety: {
      pregnancy: false,
      clot: false,
      ochronosis: false,
    },
    redFlags: [],

    // Clinical readings (Stage 2 Readings Form)
    formData: {
      fitz: '',
      comp: '',
      mel: '',
      ery: '',
      woods: '',
      depth: '',

      // Patient Demographics (Stage 2)
      initials: '',
      full_name: '',
      mrn: '',
      age: '',
      sex: '',

      // Presentation (Stage 2)
      dist: '',
      dur: '',
      onset: '',
      prog: '',

      // Triggers (Stage 2)
      triggers: [],
      hqHistory: false,
      priorTx: '',
      meds: '',

      // Diagnosis Stage (Stage 3 Additional Notes)
      notes: '',
    },

    // Diagnosis analysis outputs (Stage 3)
    diagnosis: null, // { data: JSON, confirmedDx: "" }
    doctorClassifications: {},

    // Plan stage outputs (Stage 4)
    lastPlan: null,
    reviewState: {
      decision: null,
      notes: '',
      reviewer: 'Dr. A. Mehra',
      finalized: false,
      ts: null,
    },

    // Reassessment outputs (Stage 5)
    goals: [],
    reassessment: null,
    reassessQuestions: [],
    reassessAnswers: {},
    pre_session_validation: null,

    // Loading indicators
    aiAnalysis: null,
    immutableImageMetrics: null,
    zonePanelGeneration: null,
    dynamicQuestions: [],
    loadingMessage: '',
    isLoading: false,
    activeAiStage: null,
  }),

  getters: {
    stageLabel: (state) => {
      const names = ['Capture', 'Assess', 'Diagnosis', 'Plan']
      const pad = (x) => (x < 10 ? '0' : '') + x
      return `${pad(state.currentStage + 1)} / 04 — ${names[state.currentStage] || ''}`
    },
    progressPercent: (state) => {
      return ((state.currentStage + 1) / 4) * 100
    },
    classificationRequiredItems: (state) =>
      state.diagnosis?.data?.classification_required_items || [],
    pendingDoctorClassificationItems: (state) =>
      (state.diagnosis?.data?.classification_required_items || []).filter(
        (item) => state.doctorClassifications?.[item.classification_id]?.status !== 'resolved',
      ),
    treatmentPlanningReady: (state) =>
      Boolean(state.diagnosis?.data) &&
      !(state.diagnosis?.data?.classification_required_items || []).some(
        (item) => state.doctorClassifications?.[item.classification_id]?.status !== 'resolved',
      ),
  },

  actions: {
    disconnect() {
      this.isConnected = false
      this.currentStage = 0
      this.resetState()
    },

    async getPatientData(uid) {
      Loading.show({
        message: 'Getting patient data...',
      })
      try {
        const response = await api.get(`/users/${uid}`)
        LocalStorage.set('user', JSON.stringify(response.data.results))
        this.setPatientData(response.data.results)
      } catch (e) {
        console.error(e)
      } finally {
        Loading.hide()
      }
    },

    async getSingleAssessment(assessmentId) {
      Loading.show({
        message: 'Loading assessment from database...',
      })
      try {
        const response = await api.get(`/assessments/${assessmentId}`)
        const data = response.data.results

        this.id = data.id
        this.conversationId = data.conversation_id || ''
        this.clinic_id = data.clinic_id || null
        this.therapist_id = data.therapist_id || null
        this.user_id = data.user_id || null

        // Fetch patient demographics
        if (data.user_id) {
          await this.getPatientData(data.user_id)
        }

        // Restore our store state from pigmentation_inputs
        if (data.pigmentation_inputs) {
          const pi = data.pigmentation_inputs
          if (pi.formData) this.formData = { ...this.formData, ...pi.formData }
          if (pi.fixedHistory) this.fixedHistory = { ...this.fixedHistory, ...pi.fixedHistory }
          if (pi.dynamicAnswers)
            this.dynamicAnswers = { ...this.dynamicAnswers, ...pi.dynamicAnswers }
          if (pi.doctorClassifications)
            this.doctorClassifications = { ...(pi.doctorClassifications || {}) }
          if (pi.safety) this.safety = { ...this.safety, ...pi.safety }
          if (pi.redFlags) this.redFlags = pi.redFlags || []
          if (pi.goals) this.goals = pi.goals || []
          if (pi.reassessQuestions) this.reassessQuestions = pi.reassessQuestions || []
          if (pi.reassessAnswers) this.reassessAnswers = pi.reassessAnswers || {}
          if (pi.reviewState) {
            this.reviewState = {
              ...this.reviewState,
              ...pi.reviewState,
              ts: pi.reviewState.ts ? new Date(pi.reviewState.ts) : null,
            }
          }
          console.log(pi)
          if (pi.lastPlan && !this.lastPlan) {
            this.lastPlan = pi.lastPlan
          }
          if (pi.diagnosis && !this.diagnosis) {
            this.diagnosis = {
              data: pi.diagnosis,
              confirmedDx: pi.confirmedDx || pi.diagnosis.differential?.primary?.dx || '',
            }
          }
          if (pi.zonePanelGeneration) this.zonePanelGeneration = pi.zonePanelGeneration
          if (pi.aiAnalysis) {
            this.aiAnalysis = pi.aiAnalysis

            const validatedAnalysis = pi.aiAnalysis.data || pi.aiAnalysis

            if (
              [
                'validated_pigmentation_observation_v2_6',
                'validated_pigmentation_image_analysis',
              ].includes(validatedAnalysis?.analysis_record_type)
            ) {
              this.immutableImageMetrics = extractImmutablePigmentationMetrics(validatedAnalysis)
            }
          }
          if (pi.dynamicQuestions) this.dynamicQuestions = pi.dynamicQuestions || []
          if (pi.pre_session_validation) this.pre_session_validation = pi.pre_session_validation
        }

        if (data.post_diagnosis && data.post_diagnosis.reassessment) {
          this.reassessment = data.post_diagnosis.reassessment
        } else if (data.pigmentation_inputs && data.pigmentation_inputs.reassessment) {
          this.reassessment = data.pigmentation_inputs.reassessment
        }

        if (data.diagnosis && !this.diagnosis) {
          this.diagnosis = {
            data: data.diagnosis,
            confirmedDx: data.diagnosis.differential?.primary?.dx || '',
          }
        }

        if (this.diagnosis?.data) {
          this.doctorClassifications = initializeDoctorClassificationState(
            this.diagnosis.data,
            this.doctorClassifications,
          )
        }

        // Auto-repair diagnosis scores if empty/array
        if (this.diagnosis && this.diagnosis.data) {
          const diagObj = this.diagnosis.data
          if (!diagObj.scores || Array.isArray(diagObj.scores)) {
            const list = Array.isArray(diagObj.scores) ? diagObj.scores : diagObj.scores_list || []
            diagObj.scores_list = list
            const obj = {}
            list.forEach((s) => {
              const nameLower = String(s.name || '').toLowerCase()
              let key = ''
              if (nameLower.includes('melanin')) key = 'melanin_load_index'
              else if (nameLower.includes('erythema')) key = 'erythema_load_index'
              else if (nameLower.includes('recurrence')) key = 'recurrence_risk_index'
              else if (nameLower.includes('procedure')) key = 'procedure_risk_index'
              else if (nameLower.includes('sunscreen')) key = 'sunscreen_compliance_index'
              else if (nameLower.includes('confidence')) key = 'diagnosis_confidence_index'
              else key = nameLower.replace(/ /g, '_').replace(/_score$/, '_index')

              if (key) {
                obj[key] = parseInt(s.value) || 0
              }
            })
            // If the object is empty (because list was empty), try to rebuild from other keys/defaults
            if (Object.keys(obj).length === 0) {
              obj.melanin_load_index = parseInt(this.formData.mel) || 50
              obj.erythema_load_index = parseInt(this.formData.ery) || 20
              obj.composition_melanin_percent =
                this.formData.comp === 'melanin' ? 70 : this.formData.comp === 'vascular' ? 30 : 50
              obj.composition_vascular_percent = 100 - obj.composition_melanin_percent
              obj.recurrence_risk_index = 50
              obj.procedure_risk_index = 30
              obj.sunscreen_compliance_index = 50
              obj.diagnosis_confidence_index =
                diagObj.working_impression?.primary_confidence_100 || 80
            }
            // Always set composition percentages
            if (obj.composition_melanin_percent === undefined) {
              obj.composition_melanin_percent =
                this.formData.comp === 'melanin' ? 70 : this.formData.comp === 'vascular' ? 30 : 50
              obj.composition_vascular_percent = 100 - obj.composition_melanin_percent
            }
            diagObj.scores = obj
          }
        }

        if (data.recommended_full_plan) {
          this.lastPlan = data.recommended_full_plan
          if (data.treatment_sessions && Array.isArray(data.treatment_sessions.treatments)) {
            if (!this.lastPlan.sessions) {
              this.lastPlan.sessions = []
            }

            data.treatment_sessions.treatments.forEach((dbS) => {
              const extS = this.lastPlan.sessions.find(
                (s) => Number(s.session_number) === Number(dbS.session_number),
              )
              if (extS) {
                extS.id = dbS.id
                extS.status = dbS.status || extS.status || 'pending'
              } else {
                const modalities = Array.isArray(dbS.title)
                  ? dbS.title
                  : typeof dbS.title === 'string'
                    ? dbS.title.split(' + ')
                    : []

                this.lastPlan.sessions.push({
                  id: dbS.id,
                  session_number: dbS.session_number,
                  timing: `week_${dbS.week || dbS.session_number}`,
                  goal: dbS.concerns_addressed?.[0] || dbS.title || 'Pigmentation Session',
                  selected_modalities: modalities,
                  status: dbS.status || 'pending',
                  fixed_protocol: {
                    procedure: dbS.title,
                    peel: { use: modalities.includes('peel') },
                    q_switch: {
                      use: modalities.some((m) => m.includes('q_switch') || m.includes('laser')),
                    },
                    microneedling: { use: modalities.includes('microneedling') },
                    led: { use: modalities.includes('led') },
                    steps: dbS.steps || [],
                  },
                  provider_protocol: dbS.provider_protocol || {
                    pre_treatment_checklist: dbS.preparations_checklist_for_therapist || [],
                  },
                })
              }
            })

            this.lastPlan.sessions.sort(
              (a, b) => Number(a.session_number) - Number(b.session_number),
            )
          }
        }

        // Fallback: reconstruct lastPlan from treatment_sessions if not retrieved yet
        if (
          !this.lastPlan &&
          data.treatment_sessions &&
          Array.isArray(data.treatment_sessions.treatments) &&
          data.treatment_sessions.treatments.length > 0
        ) {
          const sessions = data.treatment_sessions.treatments.map((t) => {
            const selected_modalities = []
            const titleLower = String(t.title || '').toLowerCase()
            if (
              titleLower.includes('q_switch') ||
              titleLower.includes('laser') ||
              titleLower.includes('toning')
            )
              selected_modalities.push('q_switch')
            if (titleLower.includes('peel')) selected_modalities.push('peel')
            if (titleLower.includes('microneedling')) selected_modalities.push('microneedling')
            if (titleLower.includes('led')) selected_modalities.push('led')

            const morning = []
            const night = []
            const avoid = []
            if (Array.isArray(t.daily_home_care_routine)) {
              t.daily_home_care_routine.forEach((line) => {
                const cleanLine = String(line || '')
                if (cleanLine.startsWith('Morning:')) {
                  morning.push(
                    ...cleanLine
                      .replace('Morning:', '')
                      .split(',')
                      .map((s) => s.trim()),
                  )
                } else if (cleanLine.startsWith('Night:')) {
                  night.push(
                    ...cleanLine
                      .replace('Night:', '')
                      .split(',')
                      .map((s) => s.trim()),
                  )
                } else if (cleanLine.startsWith('Avoid:')) {
                  avoid.push(
                    ...cleanLine
                      .replace('Avoid:', '')
                      .split(',')
                      .map((s) => s.trim()),
                  )
                }
              })
            }

            const fixed_protocol = {
              homecare: { morning, night, avoid },
            }

            const qsChecklist = t.preparations_checklist_for_therapist?.find((line) =>
              line.includes('Laser:'),
            )
            if (qsChecklist) {
              const wavelengthMatch = qsChecklist.match(/(\d+)nm/)
              const energyMatch = qsChecklist.match(/(\d+)mJ/)
              const fluenceMatch = qsChecklist.match(/(\d+(\.\d+)?) J\/cm²/)
              const frequencyMatch = qsChecklist.match(/(\d+)Hz/)
              fixed_protocol.q_switch = {
                use: true,
                wavelength_nm: wavelengthMatch ? parseInt(wavelengthMatch[1]) : 1064,
                energy_mj: energyMatch ? parseInt(energyMatch[1]) : 0,
                fluence_j_cm2: fluenceMatch ? parseFloat(fluenceMatch[1]) : 0,
                frequency_hz: frequencyMatch ? parseInt(frequencyMatch[1]) : 0,
                passes: 2,
                endpoint:
                  t.preparations_checklist_for_therapist
                    ?.find((line) => line.includes('Laser Endpoint:'))
                    ?.replace('Laser Endpoint:', '')
                    .trim() || '',
              }
            }

            const peelChecklist = t.preparations_checklist_for_therapist?.find((line) =>
              line.includes('Peel:'),
            )
            if (peelChecklist) {
              const nameMatch = peelChecklist.match(/Prepare (.+?) \(contact/)
              const timeMatch = peelChecklist.match(/contact time: (\d+) mins/)
              fixed_protocol.peel = {
                use: true,
                peel_name: nameMatch ? nameMatch[1].trim() : 'Chemical Peel',
                contact_time_minutes: timeMatch ? parseInt(timeMatch[1]) : 5,
                neutralization_required: peelChecklist.includes('neutralization: Yes'),
              }
            }

            return {
              id: t.id || t.session_number,
              status: t.status || 'pending',
              session_number: t.session_number,
              timing: `week_${t.week || t.session_number}`,
              goal: t.concerns_addressed?.[0] || 'Pigmentation treatment',
              selected_modalities,
              fixed_protocol,
            }
          })

          this.lastPlan = {
            plan_name: 'Treatment Plan',
            plan_status: data.status === 'completed' ? 'approved' : 'pending_review',
            duration:
              data.treatment_sessions.total_time ||
              `${data.treatment_sessions.treatments.length * 2} weeks`,
            clinical_recommendation_mode: {
              optimize_for: 'efficacy_balanced_with_safety',
              doctor_constraints_used_as: 'hard_filters',
              doctor_can_edit_before_finalization: true,
            },
            baseline_summary: {
              fitzpatrick_type: this.formData.fitz,
              melanin_load_index: parseInt(this.formData.mel) || 50,
              erythema_load_index: parseInt(this.formData.ery) || 20,
              depth_call: this.formData.depth,
              composition: this.formData.comp,
            },
            sessions,
          }
        }

        // Populate attachedImages from database images
        if (data.images && data.images.length > 0) {
          this.attachedImages = data.images.map((img) => ({
            id: img.id,
            name: img.name,
            dataUrl: img.url,
            url: img.url,
            openai_file_id: img.custom_properties?.openai_file_id || '',
            mode: img.custom_properties?.mode || 'white',
          }))
        }

        if (data.post_images && data.post_images.length > 0) {
          this.reassessImages = data.post_images.map((img) => ({
            id: img.id,
            name: img.name,
            dataUrl: img.url,
            url: img.url,
            openai_file_id: img.custom_properties?.openai_file_id || '',
            mode: img.custom_properties?.mode || 'white',
          }))
        }

        // Auto-reconstruct goals if empty
        if ((!this.goals || this.goals.length === 0) && this.lastPlan) {
          const goals = []
          const planObj = this.lastPlan
          const base = planObj.baseline_summary || {}

          const cleanLabel = (str) => {
            if (!str) return ''
            return String(str)
              .replace(/_/g, ' ')
              .replace(/\b\w/g, (c) => c.toUpperCase())
          }

          const nextReassessment =
            planObj.treatment_goals?.next_reassessment || planObj.next_reassessment
          if (nextReassessment) {
            const timeframe = planObj.duration ? cleanLabel(planObj.duration) : 'Next Reassessment'

            if (Array.isArray(nextReassessment.component_targets)) {
              nextReassessment.component_targets.forEach((ct) => {
                goals.push({
                  metric: `${cleanLabel(ct.metric || 'Target')} (${ct.diagnostic_component_id || ''})`,
                  baseline: String(
                    ct.baseline !== undefined && ct.baseline !== null ? ct.baseline : '—',
                  ),
                  target: String(ct.target !== undefined && ct.target !== null ? ct.target : '—'),
                  timeframe: timeframe,
                  how_measured: 'Clinical assessment / Analyser re-read',
                })
              })
            }

            if (goals.length === 0 && nextReassessment.clinical_goal) {
              goals.push({
                metric: 'Clinical Goal',
                baseline: '—',
                target: nextReassessment.clinical_goal,
                timeframe: timeframe,
                how_measured: 'Clinical observation',
              })
            }
          }

          if (goals.length === 0) {
            const mLoad =
              base.global_background_melanin_load_index !== undefined
                ? base.global_background_melanin_load_index
                : base.melanin_load_index
            const eLoad =
              base.global_background_erythema_load_index !== undefined
                ? base.global_background_erythema_load_index
                : base.erythema_load_index

            if (mLoad !== undefined) {
              let target = 'Reduction'
              let timeframe = 'Week 4-6'

              const reassessSession = (planObj.sessions || []).find((s) => s.continue_if)
              if (reassessSession) {
                timeframe = reassessSession.timing.replace(/_/g, ' ')
                if (reassessSession.continue_if.melanin_load_index_reduction_min) {
                  target = `≤${mLoad - reassessSession.continue_if.melanin_load_index_reduction_min} (reduction of ≥${reassessSession.continue_if.melanin_load_index_reduction_min})`
                }
              }
              goals.push({
                metric: 'Melanin Load Index',
                baseline: String(mLoad),
                target: target,
                timeframe: timeframe,
                how_measured: 'Analyser re-read under identical lighting',
              })
            }

            if (eLoad !== undefined) {
              let target = 'Control'
              let timeframe = 'Week 4-6'
              const reassessSession = (planObj.sessions || []).find((s) => s.continue_if)
              if (reassessSession) {
                timeframe = reassessSession.timing.replace(/_/g, ' ')
                if (
                  reassessSession.continue_if.erythema_load_not_increased_by_more_than !== undefined
                ) {
                  target = `≤${eLoad + reassessSession.continue_if.erythema_load_not_increased_by_more_than} (increase ≤${reassessSession.continue_if.erythema_load_not_increased_by_more_than})`
                }
              }
              goals.push({
                metric: 'Erythema Load Index',
                baseline: String(eLoad),
                target: target,
                timeframe: timeframe,
                how_measured: 'Analyser re-read under identical lighting',
              })
            }
          }

          this.goals = goals
        }

        // If plan is already finalized and signed-off, start at Step 5 (Reassess Stage)
        if (this.reviewState.finalized) {
          this.currentStage = 4
        } else {
          this.currentStage = 0
        }
      } catch (e) {
        console.error('Error loading assessment from database:', e)
      } finally {
        Loading.hide()
      }
    },

    async updateAssessment() {
      if (!this.id) return

      const pigmentation_inputs = {
        formData: this.formData,
        fixedHistory: this.fixedHistory,
        dynamicAnswers: this.dynamicAnswers,
        doctorClassifications: this.doctorClassifications,
        safety: this.safety,
        redFlags: this.redFlags,
        goals: this.goals,
        reviewState: this.reviewState,
        lastPlan: this.lastPlan,
        diagnosis: this.diagnosis ? this.diagnosis.data : null,
        confirmedDx: this.diagnosis ? this.diagnosis.confirmedDx : '',
        aiAnalysis: this.aiAnalysis,
        immutableImageMetrics: this.immutableImageMetrics,
        zonePanelGeneration: this.zonePanelGeneration,
        dynamicQuestions: this.dynamicQuestions,
        reassessment: this.reassessment,
        reassessQuestions: this.reassessQuestions,
        reassessAnswers: this.reassessAnswers,
        pre_session_validation: this.pre_session_validation,
      }

      const diagnosis = this.diagnosis ? this.diagnosis.data : null

      // Construct treatment_plans object from lastPlan to save in the database treatment_sessions
      let treatment_plans = null
      if (this.lastPlan) {
        const treatments = (this.lastPlan.sessions || []).map((session) => {
          const weekMatch = String(session.timing || '').match(/\d+/)
          const weekNum = weekMatch ? parseInt(weekMatch[0]) : session.session_number

          // Build checklist — prefer AI-generated pre_treatment_checklist from provider_protocol
          const aiChecklist = session.provider_protocol?.pre_treatment_checklist
          let checklist
          if (Array.isArray(aiChecklist) && aiChecklist.length > 0) {
            checklist = aiChecklist
          } else {
            checklist = ['Check patient identification and consent']
            if (session.fixed_protocol?.q_switch?.use) {
              const qs = session.fixed_protocol.q_switch
              checklist.push(
                `Laser: Set Q-Switch to ${qs.wavelength_nm}nm, ${qs.energy_mj}mJ, ${qs.fluence_j_cm2} J/cm², ${qs.frequency_hz}Hz`,
              )
              if (qs.endpoint) checklist.push(`Laser Endpoint: ${qs.endpoint}`)
            }
            if (session.fixed_protocol?.peel?.use) {
              const p = session.fixed_protocol.peel
              checklist.push(
                `Peel: Prepare ${p.peel_name} (contact time: ${p.contact_time_minutes} mins, neutralization: ${p.neutralization_required ? 'Yes' : 'No'})`,
              )
            }
            if (session.fixed_protocol?.microneedling?.use) {
              const mn = session.fixed_protocol.microneedling
              checklist.push(
                `Microneedling: Prepare device (${mn.device}) with actives: ${mn.actives?.join(', ')}`,
              )
            }
            if (session.fixed_protocol?.led?.use) {
              checklist.push(
                `LED: Prepare ${session.fixed_protocol.led.mode} (${session.fixed_protocol.led.role})`,
              )
            }
          }

          // Build steps
          const steps = []
          let stepCounter = 1

          const formatLabel = (str) => {
            if (!str) return ''
            return str
              .split('_')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')
          }

          // Use string includes to handle combined modality names like "q_switch_1064_toning"
          const hasLaserModality = session.selected_modalities?.some(
            (m) =>
              m.includes('q_switch') ||
              m.includes('laser') ||
              m.includes('toning') ||
              m.includes('ndyag'),
          )

          let hasZoneSequence = false
          // Use zone_sequence if available in provider_protocol, even if modality naming varies
          const zoneSeqSource = session.provider_protocol?.zone_sequence
          if (
            Array.isArray(zoneSeqSource) &&
            zoneSeqSource.length > 0 &&
            (hasLaserModality || session.fixed_protocol?.q_switch?.use)
          ) {
            const activeZones = zoneSeqSource.filter(
              (z) =>
                z.zone_strategy_type !== 'exclude_from_treatment' &&
                z.zone_strategy_type !== 'defer_zone',
            )
            if (activeZones.length > 0) {
              hasZoneSequence = true
              activeZones.forEach((z) => {
                let settingsStr = ''
                let equipments = []
                if (
                  z.base_zone_setting &&
                  (z.base_zone_setting.wavelength_nm || z.base_zone_setting.energy_mj)
                ) {
                  const b = z.base_zone_setting
                  settingsStr = `${b.wavelength_nm}nm • ${b.energy_mj}mJ • ${b.fluence_j_cm2} J/cm² • ${b.passes} passes (${b.frequency_hz}Hz)`
                  equipments.push(`Laser (${b.wavelength_nm}nm)`)
                } else if (
                  z.regional_override_setting &&
                  (z.regional_override_setting.wavelength_nm ||
                    z.regional_override_setting.energy_mj)
                ) {
                  const r = z.regional_override_setting
                  settingsStr = `${r.wavelength_nm}nm • ${r.energy_mj}mJ • ${r.fluence_j_cm2} J/cm² • ${r.passes} passes`
                  equipments.push(`Laser (${r.wavelength_nm}nm)`)
                } else {
                  settingsStr = 'Standard protocol settings'
                  equipments.push('Laser')
                }

                steps.push({
                  step_number: stepCounter++,
                  duration: '5 mins',
                  ingredients_equipments: equipments,
                  how_to_do: `Treat Zone: ${z.zone.toUpperCase()}\nStrategy: ${formatLabel(z.zone_strategy_type || '')}\nSettings: ${settingsStr}\nCoverage Instruction: ${z.coverage_instruction || z.base_zone_setting?.coverage_instruction || 'Standard full-zone passes.'}\nEndpoint Target: ${z.endpoint || z.base_zone_setting?.endpoint || 'Mild erythema.'}`,
                })
              })
            }
          }

          if (!hasZoneSequence) {
            if (session.fixed_protocol?.peel?.use) {
              const p = session.fixed_protocol.peel
              steps.push({
                step_number: stepCounter++,
                duration: `${p.contact_time_minutes || 5} mins`,
                ingredients_equipments: [p.peel_name],
                how_to_do: `Apply ${p.peel_name} for ${p.contact_time_minutes} minutes. Neutralize if required.`,
              })
            }
            if (session.fixed_protocol?.q_switch?.use) {
              const qs = session.fixed_protocol.q_switch
              steps.push({
                step_number: stepCounter++,
                duration: '10 mins',
                ingredients_equipments: [`Q-Switch Laser (${qs.wavelength_nm}nm)`],
                how_to_do: `Perform Q-Switch Laser toning using settings: Wavelength ${qs.wavelength_nm}nm, Fluence ${qs.fluence_j_cm2} J/cm², ${qs.passes} passes. Target endpoint: ${qs.endpoint}.`,
              })
            }
            if (session.fixed_protocol?.microneedling?.use) {
              const mn = session.fixed_protocol.microneedling
              steps.push({
                step_number: stepCounter++,
                duration: '15 mins',
                ingredients_equipments: [mn.device || 'Microneedling'].concat(mn.actives || []),
                how_to_do: `Perform microneedling using ${mn.device} and apply actives: ${mn.actives?.join(', ')}. Route: ${mn.route || ''}, Injectable: ${mn.injectable || ''}.`,
              })
            }
            if (session.fixed_protocol?.led?.use) {
              const led = session.fixed_protocol.led
              steps.push({
                step_number: stepCounter++,
                duration: '10 mins',
                ingredients_equipments: [`LED Therapy (${led.mode})`],
                how_to_do: `Apply LED therapy (${led.mode}) for skin calming and support. Role: ${led.role || ''}.`,
              })
            }
          }

          if (steps.length === 0) {
            steps.push({
              step_number: 1,
              duration: '45 mins',
              ingredients_equipments: [],
              how_to_do: 'Perform clinical protocol as per doctor instructions.',
            })
          }

          // Build daily home care routine
          const homecareMorning = session.fixed_protocol?.homecare?.morning || []
          const homecareNight = session.fixed_protocol?.homecare?.night || []
          const homecareAvoid = session.fixed_protocol?.homecare?.avoid || []
          const daily_home_care_routine = [
            `Morning: ${homecareMorning.join(', ')}`,
            `Night: ${homecareNight.join(', ')}`,
            homecareAvoid.length ? `Avoid: ${homecareAvoid.join(', ')}` : null,
          ].filter(Boolean)

          return {
            session_number: session.session_number,
            title:
              session.selected_modalities?.join(' + ') || session.goal || 'Pigmentation Session',
            treatment_time: '45 mins',
            week: weekNum,
            preparations_checklist_for_therapist: checklist,
            concerns_addressed: [session.goal || 'Pigmentation treatment'],
            steps: steps,
            daily_home_care_routine: daily_home_care_routine,
            provider_protocol: session.provider_protocol || null,
            script: '',
          }
        })

        treatment_plans = {
          treatment_plans: {
            total_time: this.lastPlan.duration || '6 weeks',
          },
          treatment_plan: {
            treatments: treatments,
          },
          recommended_full_plan: {
            ...this.lastPlan,
            sessions: this.lastPlan.sessions,
          },
        }
      }

      const payload = {
        _method: 'PUT',
        assessment_type: 'pigmentation',
        user_id: this.formData.mrn || this.user_id || null,
        ...(this.clinic_id && { clinic_id: this.clinic_id }),
        ...(this.therapist_id && { therapist_id: this.therapist_id }),
        age: this.formData.age || null,
        is_pregnant: this.safety.pregnancy ? 1 : 0,
        breastfeeding: this.safety.pregnancy ? 'yes' : 'no',
        pigmentation_inputs: pigmentation_inputs,
        diagnosis: diagnosis,
        post_diagnosis: this.reassessment ? { reassessment: this.reassessment } : null,
        status: this.reviewState.finalized ? 'completed' : 'in_progress',
        selected_plan_type: 'multiple',
        conversation_id: this.conversationId || null,
        ...(treatment_plans && { treatment_plans }),
      }

      try {
        Loading.show({
          message: 'Saving assessment details to database...',
        })
        const response = await api.post(`/assessments/${this.id}`, payload)
        console.log('Assessment updated in database:', response.data)
        const updated = response.data.results
        if (updated && updated.recommended_full_plan) {
          this.lastPlan = updated.recommended_full_plan
        }
      } catch (e) {
        console.error('Error updating assessment in database:', e)
        throw e
      } finally {
        Loading.hide()
      }
    },

    setPatientData(data) {
      // const firstInitial = data.first_name ? data.first_name.charAt(0).toUpperCase() : ''
      // const lastInitial = data.last_name ? data.last_name.charAt(0).toUpperCase() : ''
      this.formData.initials = [data.first_name, data.last_name].filter(Boolean).join(' ')
      this.formData.full_name = [data.first_name, data.last_name].filter(Boolean).join(' ')
      this.formData.mrn = String(data.id || '')
      if (data.date_of_birth) {
        this.formData.age = useCommonStore().getAgeFromDate(data.date_of_birth)
      }
      if (data.gender) {
        const genderLower = data.gender.toLowerCase()
        if (genderLower === 'female') {
          this.formData.sex = 'Female'
        } else if (genderLower === 'male') {
          this.formData.sex = 'Male'
        } else {
          this.formData.sex = 'Other'
        }
      }
    },

    resetState() {
      this.attachedImages = []
      this.reassessImages = []
      this.aiAnalysis = null
      this.dynamicQuestions = []
      this.dynamicAnswers = {}
      this.fixedHistory = {
        duration: '',
        stability_last_4_6_weeks: '',
        recurrence_after_improvement: '',
        sunscreen_use: '',
        sunscreen_reapplication: '',
        outdoor_heat_exposure: '',
        trigger_history: [],
        current_product_use: [],
        current_sensitivity: '',
        previous_treatments: [],
        previous_treatment_response: '',
        active_new_acne_frequency: '',
        procedure_safety: [],
        red_flag_lesion_change: '',
      }
      this.safety = { pregnancy: false, clot: false, ochronosis: false }
      this.redFlags = []
      this.formData = {
        fitz: '',
        comp: '',
        mel: '',
        ery: '',
        woods: '',
        depth: '',
        initials: '',
        full_name: '',
        mrn: '',
        age: '',
        sex: '',
        dist: '',
        dur: '',
        onset: '',
        prog: '',
        triggers: [],
        hqHistory: false,
        priorTx: '',
        meds: '',
        notes: '',
      }
      this.diagnosis = null
      this.doctorClassifications = {}
      this.lastPlan = null
      this.reviewState = {
        decision: null,
        notes: '',
        reviewer: 'Dr. A. Mehra',
        finalized: false,
        ts: null,
      }
      this.goals = []
      this.reassessment = null
      this.reassessQuestions = []
      this.reassessAnswers = {}
      this.pre_session_validation = null
      this.conversationId = ''
      this.activeAiStage = null
      this.id = null
    },

    async uploadStoreImages(images, assessmentId, type = 'pigmentation-pre') {
      if (!Array.isArray(images)) return
      for (const img of images) {
        if (img.file && !img.openai_file_id) {
          const formData = new FormData()
          formData.append('image', img.file)
          formData.append('assessment_type', type)
          if (img.mode) {
            formData.append('mode', img.mode)
          }

          try {
            const response = await api.post(`assessments/${assessmentId}/images`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            })
            if (response.data && response.data.results && response.data.results.file_id) {
              img.openai_file_id = response.data.results.file_id
            }
          } catch (e) {
            console.error('Error uploading image to backend:', e)
          }
        }
      }
    },

    async callOpenAI({
      system,
      content,
      stage,
      max_output_tokens,
      reasoning_effort = 'medium',
      verbosity = 'low',
      timeout_ms = 600000,
    }) {
      if (this.activeAiStage) {
        throw new Error(`Another pigmentation AI stage is already running: ${this.activeAiStage}.`)
      }

      this.activeAiStage = stage || 'pigmentation_stage'
      const { runResponse } = useOpenAI()

      try {
        const formattedContent = []
        const items =
          typeof content === 'string' ? [{ type: 'text', text: content }] : content || []

        for (const item of items) {
          if (item.type === 'text') {
            formattedContent.push({ type: 'input_text', text: item.text })
          } else if (item.type === 'image_id') {
            formattedContent.push({
              type: 'input_image',
              file_id: item.file_id,
              detail: item.detail || 'high',
            })
          } else if (item.type === 'image') {
            const base64Data = item.source?.data
            const image =
              this.attachedImages.find((candidate) => candidate.base64 === base64Data) ||
              this.reassessImages.find((candidate) => candidate.base64 === base64Data)

            if (!image?.openai_file_id) {
              throw new Error(`Image ${image?.name || 'capture'} has not been uploaded.`)
            }
            formattedContent.push({
              type: 'input_image',
              file_id: image.openai_file_id,
              detail: item.detail || 'high',
            })
          }
        }

        const inputTextChars =
          String(system || '').length +
          formattedContent
            .filter((item) => item.type === 'input_text')
            .reduce((total, item) => total + String(item.text || '').length, 0)
        const stageLimit = AI_STAGE_TEXT_LIMITS[stage] || 80000
        if (inputTextChars > stageLimit) {
          throw new Error(
            `AI input for ${stage || 'unknown'} is ${inputTextChars} characters, above the ${stageLimit}-character safety limit. This call was blocked to prevent an unintended high-cost request.`,
          )
        }
        console.info('[PigmentationStore] AI stage request', {
          stage,
          inputTextChars,
          imageCount: formattedContent.filter((item) => item.type === 'input_image').length,
          reasoningEffort: reasoning_effort,
          maxOutputTokens: max_output_tokens,
        })

        const input = [
          { role: 'system', content: system },
          { role: 'user', content: formattedContent },
        ]

        const result = await runResponse(null, input, this.model || 'gpt-5.2', {
          use_conversation: false,
          max_output_tokens,
          reasoning_effort,
          verbosity,
          timeout_ms,
          metadata: {
            pipeline_version: 'pigmentation_pipeline_v2_6_1_observation_first',
            stage: stage || 'unknown',
            assessment_id: String(this.id || 'unknown'),
            attempt: '1',
          },
        })

        if (result?.error) {
          throw new Error(result.error.message || 'Error generating AI response')
        }
        return typeof result === 'object' ? JSON.stringify(result) : result
      } finally {
        this.activeAiStage = null
      }
    },

    parseJSON(text) {
      let t = (text || '').trim()
      t = t
        .replace(/^```(?:json)?/i, '')
        .replace(/```$/, '')
        .trim()
      const i = t.indexOf('{')
      const j = t.lastIndexOf('}')
      if (i >= 0 && j > i) t = t.slice(i, j + 1)
      return JSON.parse(t)
    },

    buildImageContext(images = this.attachedImages, zonePanelBundle = null) {
      const panels = Array.isArray(zonePanelBundle)
        ? zonePanelBundle
        : zonePanelBundle?.panels || []
      const manifest = Array.isArray(zonePanelBundle)
        ? {
            status: panels.length ? 'complete' : 'failed',
            expected_panel_ids: panels.map((panel) => panel.panel_id),
            generated_panel_ids: panels.map((panel) => panel.panel_id),
            failed_panel_ids: [],
          }
        : zonePanelBundle?.manifest || {
            status: 'not_generated',
            expected_panel_ids: [],
            generated_panel_ids: [],
            failed_panel_ids: [],
          }

      return JSON.stringify({
        session_id: String(this.id || '1'),
        policy_version: PIGMENTATION_CLINICAL_POLICY_V2.version,
        prompt_version: 'pigmentation_prompts_v2_6_1_2026_07_24',
        patient_context: {
          age: this.formData.age || null,
          sex: this.formData.sex || null,
        },
        mode_manifest: images.map((image, index) => ({
          image_number: index + 1,
          mode: image.mode,
        })),
        zone_panel_generation: manifest,
        zone_panel_manifest: panels.map((panel, index) => ({
          panel_number: index + 1,
          panel_id: panel.panel_id,
          patient_region: panel.patient_region,
          role: panel.role,
          source_modes: panel.source_modes || ['white', 'surface_polarized'],
        })),
        observation_scope: {
          include: [
            'pigmentation phenotypes',
            'contributors to apparent darkness',
            'pigmentation-relevant treatment modifiers',
            'pigmentation safety findings',
            'image limitations and artefacts',
          ],
          exclude_unless_pigmentation_relevant: [
            'incidental pores',
            'isolated comedones',
            'unrelated texture findings',
            'non-pigmentation dermatology census',
          ],
        },
      })
    },

    async buildZonePanelImages(images, assessmentId, type = 'pigmentation-ai-zone-panel') {
      const contract = PIGMENTATION_CONFIG.image_acquisition?.zone_panel_contract
      const specs = Array.isArray(contract?.panels)
        ? contract.panels.slice(0, Number(contract.maximum_panel_count || contract.panels.length))
        : []
      const expectedIds = specs.map((panel) => panel.panel_id)

      if (!contract?.enabled || !specs.length) {
        return {
          panels: [],
          manifest: {
            status: 'disabled',
            expected_panel_ids: expectedIds,
            generated_panel_ids: [],
            failed_panel_ids: expectedIds,
          },
        }
      }

      const byMode = new Map((images || []).map((image) => [image.mode, image]))
      const white = byMode.get('white')
      const surface = byMode.get('surface_polarized')
      if (!white || !surface) {
        throw new Error('Mandatory zone panels require both WHITE and SURFACE_POLARIZED captures.')
      }

      const panelRecords = []
      const failedIds = []
      for (const panelSpec of specs) {
        try {
          const file = await createZonePanelFile(white, surface, panelSpec)
          if (!file) {
            failedIds.push(panelSpec.panel_id)
            continue
          }
          panelRecords.push({
            file,
            name: `${panelSpec.panel_id}.jpg`,
            mode: null,
            panel_id: panelSpec.panel_id,
            patient_region: panelSpec.patient_region,
            role: panelSpec.role,
            source_modes: ['white', 'surface_polarized'],
            openai_file_id: null,
          })
        } catch (error) {
          failedIds.push(panelSpec.panel_id)
          console.warn(`[PigmentationStore] Zone panel ${panelSpec.panel_id} failed:`, error)
        }
      }

      if (panelRecords.length) {
        await this.uploadStoreImages(panelRecords, assessmentId, type)
      }
      const uploadedPanels = panelRecords.filter((panel) => panel.openai_file_id)
      for (const panel of panelRecords) {
        if (!panel.openai_file_id && !failedIds.includes(panel.panel_id)) {
          failedIds.push(panel.panel_id)
        }
      }
      for (const id of expectedIds) {
        if (!uploadedPanels.some((panel) => panel.panel_id === id) && !failedIds.includes(id)) {
          failedIds.push(id)
        }
      }

      const minimum = Number(contract.minimum_successful_panel_count || expectedIds.length)
      const complete = uploadedPanels.length >= minimum && failedIds.length === 0
      const manifest = {
        status: complete ? 'complete' : uploadedPanels.length ? 'partial' : 'failed',
        expected_panel_ids: expectedIds,
        generated_panel_ids: uploadedPanels.map((panel) => panel.panel_id),
        failed_panel_ids: [...new Set(failedIds)],
      }

      if (
        !complete &&
        contract.generation_policy === 'block_analysis_when_mandatory_panel_missing'
      ) {
        throw new Error(
          `Pigmentation zone-panel generation incomplete. Missing/failed: ${manifest.failed_panel_ids.join(', ') || 'unknown'}. Analysis was blocked to avoid reduced visual accuracy.`,
        )
      }

      return { panels: uploadedPanels, manifest }
    },

    async analyseCaptures() {
      const requiredModes = PIGMENTATION_CONFIG.image_acquisition.canonical_mode_order
      const imagesByMode = new Map()

      for (const image of this.attachedImages) {
        if (!requiredModes.includes(image.mode)) {
          throw new Error(`Unknown pigmentation image mode: ${image.mode || 'missing'}`)
        }
        if (imagesByMode.has(image.mode)) {
          throw new Error(`Duplicate pigmentation image mode: ${image.mode}`)
        }
        imagesByMode.set(image.mode, image)
      }

      const missingModes = requiredModes.filter((mode) => !imagesByMode.has(mode))
      if (this.attachedImages.length !== requiredModes.length || missingModes.length) {
        throw new Error(
          `Pigmentation analysis requires exactly one image for each mode. Missing: ${
            missingModes.join(', ') || 'none'
          }.`,
        )
      }

      const orderedImages = requiredModes.map((mode) => imagesByMode.get(mode))
      const assessmentId = this.id || useAssessmentStore().assessmentData?.id || '1'

      this.isLoading = true
      this.loadingMessage = 'Reading pigmentation targets and contributors…'

      try {
        await this.uploadStoreImages(orderedImages, assessmentId, 'pigmentation-pre')
        if (orderedImages.some((image) => !image.openai_file_id)) {
          throw new Error('One or more pigmentation images could not be uploaded for analysis.')
        }

        const zonePanelBundle = await this.buildZonePanelImages(
          orderedImages,
          assessmentId,
          'pigmentation-pre',
        )
        const zonePanels = zonePanelBundle.panels
        this.zonePanelGeneration = zonePanelBundle.manifest

        const content = buildModeLabelledImageContent(
          orderedImages,
          this.buildImageContext(orderedImages, zonePanelBundle),
          'Complete the pigmentation-scoped whole-face review before producing JSON. Preserve every clinically material pigmentation phenotype, contributor, modifier or safety finding. Keep visibly distinct flat and raised populations separate. WHITE is the primary evidence for gross elevation; WOODS_UV and RED must not veto elevation. Use WOODS_UV together with SUBSURFACE_POLARIZED only for a probabilistic epidermal/deeper/mixed pigment call. Do not create diagnostic disease labels in this observation stage.',
          zonePanels,
        )

        const raw = await this.callOpenAI({
          system: IMAGE_SYSTEM_PROMPT,
          content,
          stage: 'pigmentation_observation_image_analysis',
          max_output_tokens: 12000,
          reasoning_effort: 'high',
          verbosity: 'low',
        })

        const rawObservation = this.parseJSON(raw)
        const validatedObservation = validateAndScorePigmentationImageAnalysis(rawObservation, {
          modelVersion: this.model || 'gpt-5.2',
          promptVersion: 'pigmentation_prompts_v2_6_1_2026_07_24',
          configVersion: PIGMENTATION_CONFIG.version,
          policyVersion: PIGMENTATION_CLINICAL_POLICY_V2.version,
        })

        this.aiAnalysis = { data: validatedObservation, confirmed: false }
        this.immutableImageMetrics = extractImmutablePigmentationMetrics(validatedObservation)

        const gi = validatedObservation.global_background_indices || {}
        let fitzVal = ''
        const fitzType = String(gi?.estimated_fitzpatrick?.type || '').toLowerCase()
        if (fitzType.includes('iii_to_iv') || fitzType.includes('iii-iv')) fitzVal = 'IV'
        else if (fitzType.includes('iv_to_v') || fitzType.includes('iv-v')) fitzVal = 'V'
        else if (fitzType.includes('v_to_vi') || fitzType.includes('v-vi')) fitzVal = 'VI'
        else if (fitzType.includes('iii')) fitzVal = 'III'
        else if (fitzType.includes('iv')) fitzVal = 'IV'
        else if (fitzType.includes('vi')) fitzVal = 'VI'
        else if (fitzType.includes('v')) fitzVal = 'V'
        else if (fitzType.includes('ii')) fitzVal = 'II'
        else if (fitzType === 'i') fitzVal = 'I'

        this.formData.fitz = fitzVal
        this.formData.mel = gi?.melanin_load_index?.score_100 || ''
        this.formData.ery = gi?.erythema_load_index?.score_100 || ''
        this.formData.comp = gi?.composition?.type || ''
        this.formData.depth = gi?.depth_call?.type || ''

        this.dynamicQuestions = []
        this.dynamicAnswers = {}
        this.diagnosis = null
        this.doctorClassifications = {}
        this.lastPlan = null
        await this.updateAssessment()
      } catch (error) {
        console.error(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    confirmReadings() {
      if (this.aiAnalysis) {
        this.aiAnalysis.confirmed = true
      }
    },

    async generateDynamicQuestions() {
      if (this.dynamicQuestions?.length) return
      if (!this.aiAnalysis?.data) throw new Error('Complete image analysis first.')

      this.isLoading = true
      this.loadingMessage = 'Generating focused history questions…'

      try {
        const payload = {
          session_id: String(this.id || '1'),
          phenotype: buildCompactPhenotypeForDiagnosis(this.aiAnalysis.data),
          fixed_history: this.fixedHistory,
          max_dynamic_questions: 5,
        }
        const raw = await this.callOpenAI({
          system: DYNAMIC_QUESTIONS_PROMPT,
          content: [{ type: 'text', text: JSON.stringify(payload) }],
          stage: 'dynamic_questions',
          max_output_tokens: 2500,
          reasoning_effort: 'medium',
          verbosity: 'low',
        })

        const response = this.parseJSON(raw)
        this.dynamicQuestions = Array.isArray(response.dynamic_questions)
          ? response.dynamic_questions.slice(0, 5)
          : []
        this.dynamicAnswers = Object.fromEntries(
          this.dynamicQuestions.map((question) => [
            question.question_id,
            question.answer_type === 'multi_choice' ? [] : '',
          ]),
        )
      } finally {
        this.isLoading = false
      }
    },

    buildBaseBlock() {
      const line = (k, v) => (v && String(v).length ? `${k}: ${v}` : null)
      const qa = []
      this.dynamicQuestions.forEach((q) => {
        const ans = this.dynamicAnswers[q.question_id] || ''
        if (ans) {
          qa.push(`  - ${q.question} → ${ans}`)
        }
      })

      const rows = [
        'PATIENT (de-identified):',
        line('Initials', this.formData.initials),
        line('Age', this.formData.age),
        line('Sex', this.formData.sex),
        line(
          'Fitzpatrick (AI-estimated from white-light capture, clinician-confirmed)',
          this.formData.fitz,
        ),
        '',
        'PRESENTATION:',
        line('Distribution', this.formData.dist),
        line('Duration', this.formData.dur),
        line('Onset/timing', this.formData.onset),
        line('Progression', this.formData.prog),
        line('Triggers/modifiers', this.formData.triggers.join('; ')),
        line('Prior fairness-cream / unsupervised HQ use', this.formData.hqHistory ? 'YES' : 'no'),
        line('Prior treatments', this.formData.priorTx),
        line('Current medications', this.formData.meds),
        '',
        qa.length ? 'CONDITION-SPECIFIC HISTORY (clinician answers):' : null,
      ]
        .concat(qa.length ? qa : [])
        .concat([
          '',
          'ANALYSER / EXAM FINDINGS (indices AI-estimated from uncalibrated images, clinician-confirmed — approximate):',
          line('Melanin index (0-100)', this.formData.mel),
          line('Erythema index (0-100)', this.formData.ery),
          line('Composition (clinician-confirmed)', this.formData.comp),
          line("Wood's lamp contrast", this.formData.woods),
          line('Depth call (clinician-confirmed)', this.formData.depth),
          line('Clinician visual/palpation notes', this.formData.notes),
          line('Red flags ticked', this.redFlags.length ? this.redFlags.join('; ') : 'none'),
          line('Additional notes', this.formData.notes),
          line(
            'Analyser captures attached',
            this.attachedImages.length ? `${this.attachedImages.length} image(s) below` : 'none',
          ),
          '',
          'SAFETY SCREEN:',
          line('Pregnant/lactating', this.safety.pregnancy ? 'YES' : 'no'),
          line('Thromboembolic risk', this.safety.clot ? 'YES' : 'no'),
          line('Ochronosis suspected', this.safety.ochronosis ? 'YES' : 'no'),
        ])
        .filter(Boolean)

      return rows.join('\n')
    },

    buildDiagnosisInput() {
      if (!this.aiAnalysis?.data) throw new Error('Validated phenotype is required.')
      return JSON.stringify({
        session_id: String(this.id || '1'),
        phenotype: buildCompactPhenotypeForDiagnosis(this.aiAnalysis.data),
        fixed_history: this.fixedHistory,
        dynamic_history: this.dynamicAnswers,
        patient_context: {
          age: this.formData.age || null,
          sex: this.formData.sex || null,
        },
        clinical_policy_version: PIGMENTATION_CLINICAL_POLICY_V2.version,
        diagnosis_ontology: {
          ontology_version: PIGMENTATION_CONFIG.ontology_version,
          families: PIGMENTATION_CONFIG.v2_ontology?.families || {},
          treatment_pattern_codes: PIGMENTATION_CONFIG.v2_ontology?.treatment_pattern_codes || [],
          direct_cosmetic_treatment_status_values:
            PIGMENTATION_CONFIG.v2_ontology?.direct_cosmetic_treatment_status_values || [],
          diagnostic_status_values: PIGMENTATION_CONFIG.v2_ontology?.diagnostic_status_values || [],
          code_rule:
            'Choose exact enum values. Never output unspecified/unknown free-text subtype codes; use the canonical family fallback.',
        },
      })
    },

    async generateDx() {
      this.isLoading = true
      this.loadingMessage = 'Integrating the image read…'

      const content = [{ type: 'text', text: this.buildDiagnosisInput() }]

      try {
        const raw = await this.callOpenAI({
          system: DIAGNOSIS_PROMPT,
          content,
          stage: 'diagnosis',
          max_output_tokens: 9000,
          reasoning_effort: 'high',
          verbosity: 'medium',
        })

        const dx = this.parseJSON(raw)
        assertDiagnosisCopiedImmutableMetrics(dx, this.aiAnalysis.data)
        validatePigmentationDiagnosis(dx, this.aiAnalysis.data)

        // Preserve canonical codes while providing legacy aliases for older UI/report code.
        ;(dx.diagnostic_components || []).forEach((component) => {
          component.family = component.family_code || component.family
          component.subtype = component.subtype_code || component.subtype
        })

        // Map the new response schema to the UI schema so that print report, diagnosis page etc. do not break!
        // We will store both the raw AI response in store.diagnosis.data AND the mapped fields.

        // Map working_impression to differential
        // Map working_impression to differential
        const primaryComp =
          dx.diagnostic_components?.find(
            (c) =>
              c.diagnostic_component_id === dx.working_impression?.dominant_treatable_component_id,
          ) || dx.diagnostic_components?.[0]
        const primaryDx =
          primaryComp?.diagnosis_label ||
          primaryComp?.subtype_label ||
          primaryComp?.family_code ||
          primaryComp?.family ||
          primaryComp?.subtype_code ||
          primaryComp?.subtype ||
          dx.working_impression?.primary_category ||
          ''
        const primaryConfidence =
          primaryComp?.confidence_100 || dx.scores?.ai_planning_confidence_score_100 || 80
        const primaryReasoning =
          dx.summaries?.clinical_summary_for_doctor ||
          dx.working_impression?.overall_summary ||
          dx.clinical_summary_for_doctor ||
          ''

        let alternatives = []
        if (dx.ranked_differential?.length) {
          alternatives = dx.ranked_differential.map((diff) => {
            return {
              dx: diff.family_code || diff.family || diff.subtype_code || diff.subtype || '',
              likelihood: diff.confidence_100 ? `${diff.confidence_100}%` : 'possible',
              reconsider_when: diff.why_it_remains?.join('; ') || '',
            }
          })
        } else {
          alternatives = (dx.working_impression?.secondary_categories || []).map((cat) => {
            const catName = typeof cat === 'object' && cat ? cat.category || '' : String(cat || '')
            const conf =
              typeof cat === 'object' && cat && cat.confidence_100 !== undefined
                ? `${cat.confidence_100}%`
                : 'moderate'
            const basisText =
              typeof cat === 'object' && cat && cat.basis?.length
                ? `Basis: ${cat.basis.join('; ')}`
                : 'if clinically indicated'
            return {
              dx: catName,
              likelihood: conf,
              reconsider_when: basisText,
            }
          })
        }

        // Map scores object to scores array
        const scoresArray = []
        const metrics = dx.immutable_image_metrics || {}
        const dxScores = dx.scores || {}
        const scoresObj = {
          melanin_load_index:
            metrics.global_background_melanin_load_index !== undefined
              ? metrics.global_background_melanin_load_index
              : dxScores.melanin_load_index !== undefined
                ? dxScores.melanin_load_index
                : parseInt(this.formData.mel) || 50,
          erythema_load_index:
            metrics.global_background_erythema_load_index !== undefined
              ? metrics.global_background_erythema_load_index
              : dxScores.erythema_load_index !== undefined
                ? dxScores.erythema_load_index
                : parseInt(this.formData.ery) || 20,
          composition_melanin_percent:
            dxScores.composition_melanin_percent !== undefined
              ? dxScores.composition_melanin_percent
              : 70,
          composition_vascular_percent:
            dxScores.composition_vascular_percent !== undefined
              ? dxScores.composition_vascular_percent
              : 30,
          recurrence_risk_index:
            dxScores.recurrence_risk_index !== undefined ? dxScores.recurrence_risk_index : 50,
          procedure_risk_index:
            dxScores.procedure_risk_index !== undefined ? dxScores.procedure_risk_index : 30,
          sunscreen_compliance_index:
            dxScores.sunscreen_compliance_index !== undefined
              ? dxScores.sunscreen_compliance_index
              : 50,
          diagnosis_confidence_index: primaryConfidence,
        }

        const mapScore = (key, name, scale) => {
          if (scoresObj[key] !== undefined) {
            scoresArray.push({
              name: name,
              value: String(scoresObj[key]),
              scale: scale,
              interpretation: scoresObj[key] > 50 ? 'elevated' : 'mild/moderate',
            })
          }
        }
        mapScore('melanin_load_index', 'Melanin Load Index', '0–100')
        mapScore('erythema_load_index', 'Erythema Load Index', '0–100')
        mapScore('composition_melanin_percent', 'Composition Melanin %', '0–100')
        mapScore('composition_vascular_percent', 'Composition Vascular %', '0–100')
        mapScore('recurrence_risk_index', 'Recurrence Risk Score', '0–100')
        mapScore('procedure_risk_index', 'Procedure Risk Score', '0–100')
        mapScore('sunscreen_compliance_index', 'Sunscreen Compliance Score', '0–100')
        mapScore('diagnosis_confidence_index', 'Diagnosis Confidence Score', '0–100')

        // Map key_drivers
        const drivers = []
        if (Array.isArray(dx.key_drivers)) {
          dx.key_drivers.forEach((drv) => {
            drivers.push(
              `${drv.driver}: ${drv.likelihood || 'possible'} (${drv.confidence_100 || 50}% conf)`,
            )
          })
        }

        const activity = dx.clinical_activity || {}
        const mappedActivity = {
          stability_status:
            activity.global_stability_status || activity.stability_status || 'stable',
          active_acne_driver:
            activity.active_acne_present !== undefined
              ? activity.active_acne_present
              : activity.active_acne_driver || false,
          inflammation_first_required: Array.isArray(activity.components_with_inflammation_hold)
            ? activity.components_with_inflammation_hold.length > 0
            : activity.inflammation_first_required_any_component ||
              activity.inflammation_first_required ||
              false,
          barrier_repair_first_required: Array.isArray(activity.components_with_barrier_hold)
            ? activity.components_with_barrier_hold.length > 0
            : activity.barrier_repair_first_required_any_component ||
              activity.barrier_repair_first_required ||
              false,
        }

        if (mappedActivity.stability_status)
          drivers.push(`Stability: ${mappedActivity.stability_status}`)
        if (mappedActivity.inflammation_first_required)
          drivers.push(`Inflammation Control Required First`)
        if (mappedActivity.active_acne_driver) drivers.push(`Active Acne Driver Present`)
        if (mappedActivity.barrier_repair_first_required)
          drivers.push(`Barrier Repair Required First`)

        if (dx.risk_profile) {
          drivers.push(`Recurrence Risk: ${dx.risk_profile.recurrence_risk}`)
          drivers.push(`Procedure Risk: ${dx.risk_profile.procedure_risk}`)
          drivers.push(`Sunscreen Risk: ${dx.risk_profile.sunscreen_compliance_risk}`)
          drivers.push(`PIH Risk: ${dx.risk_profile.pih_risk}`)
        }

        // Map red_flags
        const redFlagsPresent =
          dx.working_impression?.doctor_review_required ||
          (dx.risk_profile?.medically_atypical_lesion_risk &&
            !['low', 'not_reported', 'none'].includes(
              String(dx.risk_profile.medically_atypical_lesion_risk).toLowerCase(),
            )) ||
          false
        const redFlagsAction = dx.working_impression?.doctor_review_reason || ''
        const redFlagsItems = redFlagsPresent
          ? [
              redFlagsAction ||
                dx.risk_profile?.medically_atypical_lesion_risk ||
                'Doctor Review Required',
            ]
          : []

        // Map depth & composition (default back to form or construct from primary category)
        let depthVal = this.formData.depth || primaryComp?.depth || 'mixed'
        let compVal =
          this.formData.comp ||
          primaryComp?.subtype_label ||
          primaryComp?.subtype_code ||
          primaryComp?.subtype ||
          'melanin'
        if (primaryDx) {
          const primaryLower = primaryDx.toLowerCase()
          if (primaryLower.includes('melasma')) {
            depthVal = 'mixed'
            compVal = 'melanin'
          } else if (primaryLower.includes('pih')) {
            depthVal = 'epidermal'
            compVal = 'mixed'
          } else if (primaryLower.includes('tanning')) {
            depthVal = 'epidermal'
            compVal = 'melanin'
          }
        }

        const mappedData = JSON.parse(JSON.stringify(dx))
        mappedData.needs_summary = false
        mappedData.needs_dermoscopy = false
        mappedData.needs_targeted_doctor_classification =
          (dx.classification_required_items || []).length > 0
        mappedData.targeted_doctor_classification_items = dx.classification_required_items || []
        mappedData.differential = {
          primary: {
            dx: primaryDx,
            confidence: primaryConfidence,
            reasoning: primaryReasoning,
          },
          alternatives: alternatives,
        }
        mappedData.depth_assessment = {
          verdict: depthVal,
          basis: 'Derived from diagnostic category & clinical activity',
          prognosis: 'Requires regular assessment',
        }
        mappedData.composition_assessment = {
          dominant: compVal,
          note: 'Derived from primary category composition',
        }
        mappedData.scores = scoresObj
        mappedData.scores_list = scoresArray
        mappedData.clinical_activity = mappedActivity
        mappedData.severity_interpretation = `Confidence: ${primaryConfidence}%. Recurrence: ${dx.risk_profile?.recurrence_risk || 'moderate'}.`
        mappedData.red_flags = {
          present: redFlagsPresent,
          items: redFlagsItems,
          action: redFlagsAction,
        }
        mappedData.uncertainties = (dx.classification_required_items || []).length
          ? dx.classification_required_items.map(
              (item) => item.unresolved_question || item.why_classification_is_required,
            )
          : redFlagsPresent
            ? [redFlagsAction || 'Direct clinician assessment required']
            : []

        console.log('mappedData', mappedData)

        this.doctorClassifications = initializeDoctorClassificationState(
          mappedData,
          this.doctorClassifications,
        )
        this.lastPlan = null
        this.diagnosis = { data: mappedData, confirmedDx: '' }
        await this.updateAssessment()
      } catch (err) {
        console.error(err)
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async setDoctorClassification(classificationId, resolution = {}) {
      const item = (this.diagnosis?.data?.classification_required_items || []).find(
        (entry) => entry.classification_id === classificationId,
      )
      if (!item) throw new Error(`Unknown doctor-classification item: ${classificationId}`)

      const resolutionType = resolution.resolution_type
      const allowed = new Set([
        'candidate_selected',
        'not_pigmentation_relevant',
        'exclude_from_cosmetic_treatment',
        'separate_medical_evaluation',
      ])
      if (!allowed.has(resolutionType)) {
        throw new Error(`Invalid doctor-classification resolution: ${resolutionType || 'missing'}`)
      }
      if (
        resolutionType === 'candidate_selected' &&
        !(item.candidate_options || []).some(
          (option) => option.option_code === resolution.option_code,
        )
      ) {
        throw new Error('Select one of the AI candidate options for this finding.')
      }

      this.doctorClassifications = {
        ...this.doctorClassifications,
        [classificationId]: {
          status: 'resolved',
          resolution_type: resolutionType,
          option_code: resolutionType === 'candidate_selected' ? resolution.option_code : null,
          doctor_note: String(resolution.doctor_note || ''),
          resolved_at_iso: new Date().toISOString(),
        },
      }
      this.lastPlan = null
      await this.updateAssessment()
    },

    async clearDoctorClassification(classificationId) {
      if (!this.doctorClassifications?.[classificationId]) return
      this.doctorClassifications = {
        ...this.doctorClassifications,
        [classificationId]: {
          status: 'pending',
          resolution_type: null,
          option_code: null,
          doctor_note: '',
          resolved_at_iso: null,
        },
      }
      this.lastPlan = null
      await this.updateAssessment()
    },

    getResolvedDiagnosisForTreatmentPlanning() {
      if (!this.diagnosis?.data) throw new Error('Diagnosis is required.')
      assertNoPendingDoctorClassifications(this.diagnosis.data, this.doctorClassifications)
      return applyDoctorClassificationsToDiagnosis(this.diagnosis.data, this.doctorClassifications)
    },

    confirmDx(selectedDx) {
      if (!this.diagnosis) this.diagnosis = { data: null, confirmedDx: '' }
      this.diagnosis.confirmedDx = selectedDx
    },

    buildPlanInput() {
      const resolvedDiagnosis = this.getResolvedDiagnosisForTreatmentPlanning()
      assertDiagnosisReadyForTreatmentPlanning(resolvedDiagnosis, this.aiAnalysis?.data || {})

      const { compactConfig, compactDiagnosis, compactPolicy, preflight } = buildRelevantPlanConfig(
        {
          diagnosis: resolvedDiagnosis,
          imageAnalysis: this.aiAnalysis?.data || {},
          policy: PIGMENTATION_CLINICAL_POLICY_V2,
          fullConfig: PIGMENTATION_CONFIG,
        },
      )

      assertTreatmentProtocolPreflight(preflight)

      return {
        text: JSON.stringify({
          session_id: String(this.id || '1'),
          generation_event: 'initial_assessment',
          diagnosis: compactDiagnosis,
          fixed_history: this.fixedHistory,
          dynamic_history: this.dynamicAnswers,
          clinical_policy: compactPolicy,
          clinic_config: compactConfig,
          doctor_classification_resolutions:
            resolvedDiagnosis.doctor_classification_resolutions || {},
          doctor_overrides: { allowed: true, notes: null },
        }),
        resolvedDiagnosis,
        preflight,
        componentEligibility: compactConfig.component_eligibility || [],
        compactConfig,
      }
    },

    async generatePlan(force = false) {
      if (this.lastPlan && !force) {
        return
      }
      this.isLoading = true
      this.loadingMessage = 'Drafting the tiered plan…'

      const planInput = this.buildPlanInput()
      const planInputText = planInput.text
      console.log(
        `[PigmentationStore] Plan payload size: ${planInputText.length} chars (raw images excluded)`,
      )

      // Raw images are not included; protocol eligibility has already passed deterministic preflight.
      const content = [{ type: 'text', text: planInputText }]

      try {
        const raw = await this.callOpenAI({
          system: PLAN_PROMPT,
          content,
          stage: 'treatment_plan',
          max_output_tokens: 25000,
          reasoning_effort: 'high',
          verbosity: 'medium',
        })

        const res = this.parseJSON(raw)
        let generatedPlan = normalizeExecutableOperationParameters(res.linear_treatment_plan || res)
        const validationOptions = {
          diagnosis: planInput.resolvedDiagnosis,
          phenotype: this.aiAnalysis?.data || {},
          preflight: planInput.preflight,
          componentEligibility: planInput.componentEligibility,
          compactConfig: planInput.compactConfig,
          throwOnError: false,
        }
        let validation = validatePigmentationPlan(
          generatedPlan,
          PIGMENTATION_CONFIG,
          validationOptions,
        )

        if (!validation.valid && isExecutionContractRepairable(validation.errors)) {
          console.warn(
            '[PigmentationStore] Running compact treatment execution repair:',
            validation.errors,
          )
          const protocolIds = new Set()
          for (const session of generatedPlan?.current_treatment_block?.sessions || []) {
            for (const operation of session.treatment_operations || []) {
              if (operation.protocol_id) protocolIds.add(operation.protocol_id)
            }
          }
          const exactProtocols = [...protocolIds]
            .map((protocolId) => getPigmentationProtocolById(protocolId))
            .filter(Boolean)
          const repairRaw = await this.callOpenAI({
            system: PLAN_EXECUTION_REPAIR_PROMPT,
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  validator_errors: validation.errors,
                  exact_eligible_protocols: exactProtocols,
                  current_treatment_block: generatedPlan.current_treatment_block,
                  master_treatment_roadmap: generatedPlan.master_treatment_roadmap,
                }),
              },
            ],
            stage: 'treatment_plan_execution_repair',
            max_output_tokens: 3500,
            reasoning_effort: 'medium',
            verbosity: 'low',
          })
          const repair = this.parseJSON(repairRaw)
          generatedPlan = normalizeExecutableOperationParameters(
            mergeExecutionRepair(generatedPlan, repair),
          )
          validation = validatePigmentationPlan(generatedPlan, PIGMENTATION_CONFIG, {
            ...validationOptions,
            throwOnError: true,
          })
        } else if (!validation.valid) {
          validatePigmentationPlan(generatedPlan, PIGMENTATION_CONFIG, {
            ...validationOptions,
            throwOnError: true,
          })
        }

        const planObj = normalizeTreatmentPlanCourse(validation.plan)
        if (validation.warnings.length) {
          console.warn('[PigmentationStore] Treatment plan warnings:', validation.warnings)
        }

        this.lastPlan = planObj
        this.reviewState = {
          decision: null,
          notes: '',
          reviewer: 'Dr. A. Mehra',
          finalized: false,
          ts: null,
        }

        // Map baseline & continue criteria to goals for reassessment backward-compatibility
        const goals = []
        const base = planObj.baseline_summary || {}

        const cleanLabel = (str) => {
          if (!str) return ''
          return String(str)
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase())
        }

        const nextReassessment =
          planObj.treatment_goals?.next_reassessment || planObj.next_reassessment
        if (nextReassessment) {
          const timeframe = planObj.duration ? cleanLabel(planObj.duration) : 'Next Reassessment'

          if (Array.isArray(nextReassessment.component_targets)) {
            nextReassessment.component_targets.forEach((ct) => {
              goals.push({
                metric: `${cleanLabel(ct.metric || 'Target')} (${ct.diagnostic_component_id || ''})`,
                baseline: String(
                  ct.baseline !== undefined && ct.baseline !== null ? ct.baseline : '—',
                ),
                target: String(ct.target !== undefined && ct.target !== null ? ct.target : '—'),
                timeframe: timeframe,
                how_measured: 'Clinical assessment / Analyser re-read',
              })
            })
          }

          if (goals.length === 0 && nextReassessment.clinical_goal) {
            goals.push({
              metric: 'Clinical Goal',
              baseline: '—',
              target: nextReassessment.clinical_goal,
              timeframe: timeframe,
              how_measured: 'Clinical observation',
            })
          }
        }

        if (goals.length === 0) {
          const mLoad =
            base.global_background_melanin_load_index !== undefined
              ? base.global_background_melanin_load_index
              : base.melanin_load_index
          const eLoad =
            base.global_background_erythema_load_index !== undefined
              ? base.global_background_erythema_load_index
              : base.erythema_load_index

          if (mLoad !== undefined) {
            let target = 'Reduction'
            let timeframe = 'Week 4-6'

            const reassessSession = (planObj.sessions || []).find((s) => s.continue_if)
            if (reassessSession) {
              timeframe = reassessSession.timing.replace(/_/g, ' ')
              if (reassessSession.continue_if.melanin_load_index_reduction_min) {
                target = `≤${mLoad - reassessSession.continue_if.melanin_load_index_reduction_min} (reduction of ≥${reassessSession.continue_if.melanin_load_index_reduction_min})`
              }
            }
            goals.push({
              metric: 'Melanin Load Index',
              baseline: String(mLoad),
              target: target,
              timeframe: timeframe,
              how_measured: 'Analyser re-read under identical lighting',
            })
          }

          if (eLoad !== undefined) {
            let target = 'Control'
            let timeframe = 'Week 4-6'
            const reassessSession = (planObj.sessions || []).find((s) => s.continue_if)
            if (reassessSession) {
              timeframe = reassessSession.timing.replace(/_/g, ' ')
              if (
                reassessSession.continue_if.erythema_load_not_increased_by_more_than !== undefined
              ) {
                target = `≤${eLoad + reassessSession.continue_if.erythema_load_not_increased_by_more_than} (increase ≤${reassessSession.continue_if.erythema_load_not_increased_by_more_than})`
              }
            }
            goals.push({
              metric: 'Erythema Load Index',
              baseline: String(eLoad),
              target: target,
              timeframe: timeframe,
              how_measured: 'Analyser re-read under identical lighting',
            })
          }
        }

        this.goals = goals
        await this.updateAssessment()
      } catch (err) {
        console.error(err)
        throw err
      } finally {
        this.isLoading = false
      }
    },

    finalizeSignoff(decision, notes, reviewer) {
      this.reviewState.decision = decision
      this.reviewState.notes = notes
      this.reviewState.reviewer = reviewer || 'Clinician'
      this.reviewState.finalized = true
      this.reviewState.ts = new Date()
    },

    buildReassessInput() {
      const resolvedDiagnosis = this.getResolvedDiagnosisForTreatmentPlanning()
      assertDiagnosisReadyForTreatmentPlanning(resolvedDiagnosis, this.aiAnalysis?.data || {})

      const { compactConfig, compactDiagnosis, compactPolicy, preflight } = buildRelevantPlanConfig(
        {
          diagnosis: resolvedDiagnosis,
          imageAnalysis: this.aiAnalysis?.data || {},
          policy: PIGMENTATION_CLINICAL_POLICY_V2,
          fullConfig: PIGMENTATION_CONFIG,
        },
      )

      const completedSessions = (this.lastPlan?.sessions || this.lastPlan?.current_sessions || [])
        .filter((session) =>
          ['completed', 'done'].includes(String(session.status || '').toLowerCase()),
        )
        .map((session) => ({
          session_number: session.session_number || session.id,
          timing: session.timing || null,
          completed_operations: (session.treatment_operations || session.operations || []).map(
            (operation) => ({
              modality_id: operation.modality_id,
              protocol_id: operation.protocol_id,
              linked_component_ids: operation.linked_component_ids || [],
              linked_group_ids: operation.linked_group_ids || [],
            }),
          ),
        }))

      return {
        text: JSON.stringify({
          session_id: String(this.id || '1'),
          baseline: {
            phenotype: buildCompactPhenotypeForDiagnosis(this.aiAnalysis?.data || {}),
            diagnosis: compactDiagnosis,
            component_treatment_map: this.lastPlan?.component_treatment_map || [],
            completed_sessions: completedSessions,
            master_treatment_roadmap:
              this.lastPlan?.master_treatment_roadmap || this.lastPlan?.course || {},
            initial_full_course_summary:
              this.lastPlan?.initial_full_course_summary ||
              this.lastPlan?.full_course_summary ||
              null,
            current_full_course_summary: this.lastPlan?.full_course_summary || null,
          },
          response_history: this.reassessAnswers || {},
          goals: this.goals || [],
          clinical_policy: compactPolicy,
          eligible_clinic_config: compactConfig,
          protocol_preflight: preflight,
        }),
        resolvedDiagnosis,
        compactConfig,
        preflight,
      }
    },

    async generateReassessment() {
      const requiredModes = PIGMENTATION_CONFIG.image_acquisition.canonical_mode_order
      const imagesByMode = new Map(this.reassessImages.map((image) => [image.mode, image]))
      const missing = requiredModes.filter((mode) => !imagesByMode.has(mode))
      if (missing.length) {
        throw new Error(
          `Formal reassessment requires all five modes. Missing: ${missing.join(', ')}.`,
        )
      }

      this.isLoading = true
      this.loadingMessage = 'Comparing pigmentation components like with like…'

      try {
        const assessmentId = this.id || useAssessmentStore().assessmentData?.id || '1'
        const ordered = requiredModes.map((mode) => imagesByMode.get(mode))
        await this.uploadStoreImages(ordered, assessmentId, 'pigmentation-post')
        if (ordered.some((image) => !image.openai_file_id)) {
          throw new Error('One or more reassessment images could not be uploaded.')
        }

        const reassessmentInput = this.buildReassessInput()
        console.log(
          `[PigmentationStore] Reassessment payload size: ${reassessmentInput.text.length} chars plus five images`,
        )
        const zonePanelBundle = await this.buildZonePanelImages(
          ordered,
          assessmentId,
          'pigmentation-ai-zone-panel-post',
        )
        const zonePanels = zonePanelBundle.panels
        this.zonePanelGeneration = zonePanelBundle.manifest
        const content = buildModeLabelledImageContent(
          ordered,
          reassessmentInput.text,
          'Compare like with like by feature and by baseline group. WHITE controls contour/elevation, count, colour and location; SURFACE_POLARIZED controls surface/texture; WOODS_UV controls epidermal accentuation; SUBSURFACE_POLARIZED controls deeper persistence; RED controls relative vascularity. Do not let a non-diagnostic mode negate baseline morphology. Identify new classification-required findings only when genuinely indeterminate and treatment- or safety-changing.',
          zonePanels,
        )

        const raw = await this.callOpenAI({
          system: REASSESS_PROMPT,
          content,
          stage: 'formal_reassessment',
          max_output_tokens: 12000,
          reasoning_effort: 'high',
          verbosity: 'medium',
        })

        const result = this.parseJSON(raw)
        if (!result?.current_phenotype) {
          throw new Error('Formal reassessment omitted current_phenotype.')
        }

        const currentPhenotype = validateAndScorePigmentationImageAnalysis(
          result.current_phenotype,
          {
            modelVersion: this.model,
            promptVersion: 'pigmentation_prompts_v2_6_1_2026_07_24',
            configVersion: PIGMENTATION_CONFIG.version,
            policyVersion: PIGMENTATION_CLINICAL_POLICY_V2.version,
          },
        )
        const currentMetrics = extractImmutablePigmentationMetrics(currentPhenotype)

        const nextComponentMap =
          Array.isArray(result.updated_component_treatment_map) &&
          result.updated_component_treatment_map.length
            ? result.updated_component_treatment_map
            : this.lastPlan?.component_treatment_map || []

        const reassessmentClassificationItems = Array.isArray(result.classification_required_items)
          ? result.classification_required_items
          : []
        if (
          reassessmentClassificationItems.length &&
          result.current_treatment_block?.sessions?.length
        ) {
          throw new Error(
            'Reassessment returned a treatment block while a new treatment-changing finding still requires doctor classification.',
          )
        }

        let validatedBlock = result.current_treatment_block || null
        if (validatedBlock?.sessions?.length) {
          const { compactConfig, preflight } = buildRelevantPlanConfig({
            diagnosis: reassessmentInput.resolvedDiagnosis,
            imageAnalysis: currentPhenotype,
            policy: PIGMENTATION_CLINICAL_POLICY_V2,
            fullConfig: PIGMENTATION_CONFIG,
          })
          const blockValidation = validatePigmentationTreatmentBlock(
            validatedBlock,
            PIGMENTATION_CONFIG,
            {
              diagnosis: reassessmentInput.resolvedDiagnosis,
              phenotype: currentPhenotype,
              baselineMetrics: currentMetrics,
              componentTreatmentMap: nextComponentMap,
              componentEligibility: compactConfig.component_eligibility,
              preflight,
              throwOnError: true,
            },
          )
          validatedBlock = blockValidation.plan.current_treatment_block
          if (blockValidation.warnings.length) {
            console.warn(
              '[PigmentationStore] Reassessment treatment-block warnings:',
              blockValidation.warnings,
            )
          }
        }

        this.reassessment = {
          ...result,
          current_phenotype: currentPhenotype,
          current_metrics: currentMetrics,
          classification_required_items: reassessmentClassificationItems,
          current_treatment_block: validatedBlock,
        }

        if (this.lastPlan && validatedBlock) {
          this.lastPlan = {
            ...this.lastPlan,
            component_treatment_map: nextComponentMap,
            current_treatment_block: validatedBlock,
            current_sessions: validatedBlock.sessions || [],
            sessions: (validatedBlock.sessions || []).map((session) => ({
              id: session.id || session.session_number,
              status: session.status || 'pending',
              ...session,
            })),
            future_provisional_sessions:
              result.future_treatment_roadmap || this.lastPlan.future_provisional_sessions || [],
            master_treatment_roadmap:
              result.updated_master_treatment_roadmap ||
              this.lastPlan.master_treatment_roadmap ||
              {},
            initial_full_course_summary:
              this.lastPlan.initial_full_course_summary ||
              this.lastPlan.full_course_summary ||
              null,
            full_course_summary:
              result.updated_full_course_summary || this.lastPlan.full_course_summary || null,
            remaining_course_summary:
              result.updated_full_course_summary || this.lastPlan.remaining_course_summary || null,
            allocation_changes: result.allocation_changes || [],
            latest_reassessment_metrics: currentMetrics,
          }
          this.lastPlan = normalizeTreatmentPlanCourse(this.lastPlan)
        }

        await this.updateAssessment()
      } finally {
        this.isLoading = false
      }
    },

    async generateReassessQuestions() {
      if (this.reassessQuestions?.length) return
      this.isLoading = true
      this.loadingMessage = 'Preparing reassessment questions…'

      try {
        const payload = {
          session_id: String(this.id || '1'),
          diagnosis_components: this.diagnosis?.data?.diagnostic_components || [],
          component_treatment_map: this.lastPlan?.component_treatment_map || [],
          goals: this.goals || [],
          max_questions: 4,
        }
        const raw = await this.callOpenAI({
          system: REASSESS_QUESTIONS_PROMPT,
          content: [{ type: 'text', text: JSON.stringify(payload) }],
          stage: 'reassessment_questions',
          max_output_tokens: 2200,
          reasoning_effort: 'medium',
          verbosity: 'low',
        })
        const response = this.parseJSON(raw)
        this.reassessQuestions = Array.isArray(response.reassessment_questions)
          ? response.reassessment_questions.slice(0, 4)
          : Array.isArray(response.dynamic_questions)
            ? response.dynamic_questions.slice(0, 4)
            : []
        this.reassessAnswers = Object.fromEntries(
          this.reassessQuestions.map((question) => [
            question.question_id,
            question.answer_type === 'multi_choice' ? [] : '',
          ]),
        )
        await this.updateAssessment()
      } finally {
        this.isLoading = false
      }
    },
  },
})
