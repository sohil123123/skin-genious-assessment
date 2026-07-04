import { defineStore } from 'pinia'
import { useOpenAI } from 'src/composables/useOpenAI'
import { useAssessmentStore } from 'src/stores/assessmentStore'
import { useIVAssessmentStore } from 'src/stores/ivAssessmentStore'
import { api } from 'src/boot/axios'
import {
  IMAGE_SYSTEM_PROMPT,
  DYNAMIC_QUESTIONS_PROMPT,
  DIAGNOSIS_PROMPT,
  DERMOSCOPY_PROMPT,
  PLAN_PROMPT,
  REASSESS_PROMPT,
  DEMO_DERMOSCOPY,
  DEMO_ANALYSIS,
  DEMO_DYNAMIC_QUESTIONS,
  DEMO_DX_MELASMA,
  DEMO_DX_ASK,
  DEMO_DX_OCHRONOSIS,
  DEMO_PLAN_MELASMA,
  DEMO_PLAN_OCHRONOSIS,
} from 'src/services/pigmentationPrompts'

export const usePigmentationStore = defineStore('pigmentation', {
  state: () => ({
    model: 'gpt-5.2',
    demoMode: false,
    isConnected: false,
    conversationId: '',
    id: null,

    currentStage: 0,

    // File arrays
    attachedImages: [],
    dermoscopyImages: [],
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
    dermoscopyFindings: null,
    demoDxAsked: false,

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

    // Loading indicators
    aiAnalysis: null,
    dynamicQuestions: [],
    loadingMessage: '',
    isLoading: false,
  }),

  getters: {
    stageLabel: (state) => {
      const names = ['Capture', 'Assess', 'Diagnosis', 'Plan']
      const pad = (x) => (x < 10 ? '0' : '') + x
      return `${pad(state.currentStage + 1)} / 04 — ${names[state.currentStage]}`
    },
    progressPercent: (state) => {
      return ((state.currentStage + 1) / 4) * 100
    },
  },

  actions: {
    startDemo() {
      this.demoMode = true
      this.model = 'demo'
      this.isConnected = true

      // Pre-fill standard demo values
      this.formData.initials = 'A.M.'
      this.formData.age = '34'
      this.formData.sex = 'Female'
      this.formData.dist = 'Bilateral, symmetric (malar + upper lip)'
      this.formData.dur = '~2 years'
      this.formData.onset = 'During/after pregnancy'
      this.formData.prog = 'Fluctuating (seasonal)'
    },

    disconnect() {
      this.isConnected = false
      this.demoMode = false
      this.currentStage = 0
      this.resetState()
    },

    resetState() {
      this.attachedImages = []
      this.dermoscopyImages = []
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
      this.dermoscopyFindings = null
      this.demoDxAsked = false
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
      this.conversationId = ''
      this.id = null
    },

    async uploadStoreImages(images, assessmentId) {
      for (const img of images) {
        if (img.file && !img.openai_file_id) {
          const formData = new FormData()
          formData.append('image', img.file)
          formData.append('assessment_type', 'pigmentation-pre')

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

    async callOpenAI({ system, content }) {
      if (this.demoMode) {
        return this.demoResponse({ system, content })
      }

      const { getOrCreateConversation, runResponse } = useOpenAI()
      const assessmentStore = useAssessmentStore()
      const ivAssessmentStore = useIVAssessmentStore()

      // Resolve a valid assessment ID and patient ID
      const assessmentId =
        this.id || assessmentStore.assessmentData?.id || ivAssessmentStore.formData?.id || '1' // fallback

      const patientId =
        this.formData.mrn ||
        assessmentStore.assessmentData?.user_id ||
        ivAssessmentStore.formData?.user_id ||
        '1'

      const patientName =
        this.formData.initials ||
        assessmentStore.assessmentData?.name ||
        ivAssessmentStore.formData?.name ||
        'Pigmentation Patient'

      const convId = await getOrCreateConversation(
        patientId,
        this.conversationId,
        patientName,
        assessmentId,
      )
      this.conversationId = convId

      // Upload local images first if not uploaded yet
      await this.uploadStoreImages(this.attachedImages, assessmentId)
      await this.uploadStoreImages(this.dermoscopyImages, assessmentId)
      await this.uploadStoreImages(this.reassessImages, assessmentId)

      // Convert content to the backend format
      let formattedContent = []
      if (typeof content === 'string') {
        formattedContent.push({ type: 'input_text', text: content })
      } else if (Array.isArray(content)) {
        for (const item of content) {
          if (item.type === 'text') {
            formattedContent.push({ type: 'input_text', text: item.text })
          } else if (item.type === 'image') {
            const base64Data = item.source?.data
            const img =
              this.attachedImages.find((i) => i.base64 === base64Data) ||
              this.dermoscopyImages.find((i) => i.base64 === base64Data) ||
              this.reassessImages.find((i) => i.base64 === base64Data)

            if (img && img.openai_file_id) {
              formattedContent.push({ type: 'input_image', file_id: img.openai_file_id })
            } else {
              formattedContent.push({
                type: 'input_text',
                text: `[Image: ${img?.name || 'capture'}]`,
              })
            }
          }
        }
      }

      const input = [
        {
          role: 'system',
          content: system,
        },
        {
          role: 'user',
          content: formattedContent,
        },
      ]

      const result = await runResponse(convId, input)
      if (result && result.error) {
        throw new Error(result.error.message || 'Error generating AI response')
      }

      // Convert object back to string so the existing parseJSON in the store runs correctly
      return typeof result === 'object' ? JSON.stringify(result) : result
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

    // Simulate API calls during demo mode
    async demoDelay() {
      return new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 600))
    },

    async demoResponse({ system, content }) {
      await this.demoDelay()

      if (/single word OK/.test(system)) {
        return 'OK'
      }
      if (/image-analysis assistant/.test(system)) {
        return JSON.stringify(DEMO_ANALYSIS)
      }
      if (/dynamic follow-up questions/.test(system)) {
        return JSON.stringify(DEMO_DYNAMIC_QUESTIONS)
      }
      if (/dermoscopy-extraction assistant/.test(system)) {
        return JSON.stringify(DEMO_DERMOSCOPY)
      }
      if (/decision-support assistant|diagnostic assistant/i.test(system)) {
        const textContent = Array.isArray(content)
          ? content
              .filter((b) => b.type === 'text')
              .map((b) => b.text)
              .join('\n')
          : String(content)

        const hasHQ =
          /HQ use:\s*YES/i.test(textContent) ||
          /prior fairness-cream \/ unsupervised HQ use: YES/i.test(textContent) ||
          /(fairness|hydroquinone)[^\n]*(→|:)\s*yes/i.test(textContent) ||
          this.formData.hqHistory

        const dermoProvided =
          /dermoscopy image\(s\) are attached/i.test(textContent) ||
          /AI-extracted dermoscopy findings/i.test(textContent) ||
          this.dermoscopyImages.length > 0

        if (hasHQ && !dermoProvided && !this.demoDxAsked) {
          this.demoDxAsked = true
          return JSON.stringify(DEMO_DX_ASK)
        }
        if (hasHQ) {
          return JSON.stringify(DEMO_DX_OCHRONOSIS)
        }
        return JSON.stringify(DEMO_DX_MELASMA)
      }
      if (/treatment-planning assistant|optimum linear pigmentation treatment plan/i.test(system)) {
        const dx = (this.diagnosis?.confirmedDx || '').toLowerCase()
        if (/ochronosis/.test(dx)) {
          return JSON.stringify(DEMO_PLAN_OCHRONOSIS)
        }
        return JSON.stringify(DEMO_PLAN_MELASMA)
      }
      if (/reassessment assistant/.test(system)) {
        const textContent = Array.isArray(content)
          ? content
              .filter((b) => b.type === 'text')
              .map((b) => b.text)
              .join('\n')
          : String(content)

        const lines = textContent.split('\n')
        const re =
          /Metric:\s*(.*?)\s*\|\s*Baseline:\s*(.*?)\s*\|\s*Target:\s*(.*?)\s*\|\s*Timeframe:\s*(.*?)\s*\|\s*Current:\s*(.*)$/

        const goals = []
        const statuses = []

        lines.forEach((ln) => {
          const mm = ln.match(re)
          if (!mm) return
          const metric = mm[1].trim()
          const base = mm[2].trim()
          const cur = mm[5].trim()

          let status, delta, comment
          if (!cur || /not entered/i.test(cur)) {
            status = 'unknown'
            delta = '—'
            comment = 'No current value entered.'
          } else if (/stopped|daily|met|clear|resolved|stabilis|improv|none|good/i.test(cur)) {
            status = 'met'
            delta = `${base} → ${cur}`
            comment = 'Target reached at this visit.'
          } else if (cur === base) {
            status = 'plateaued'
            delta = `${base} → ${cur}`
            comment = 'No measurable change yet.'
          } else {
            status = 'on_track'
            delta = `${base} → ${cur}`
            comment = 'Moving toward target.'
          }
          statuses.push(status)
          goals.push({ metric, status, delta, comment })
        })

        const hasProg = statuses.some((s) => s === 'met' || s === 'on_track')
        const hasStall = statuses.some((s) => s === 'plateaued' || s === 'unknown')
        const traj = hasProg && !hasStall ? 'improving' : hasProg ? 'mixed' : 'plateaued'

        const rec =
          traj === 'plateaued'
            ? {
                action: 'escalate',
                detail:
                  'Little movement — reinforce adherence and consider stepping up a tier or adding a gentle procedure after priming.',
              }
            : {
                action: 'continue',
                detail:
                  'Trajectory is acceptable — continue the regimen and photoprotection, and reassess at the next interval.',
              }

        const out = {
          overall: {
            trajectory: traj,
            summary:
              traj === 'improving'
                ? 'On track against the goals set at assessment.'
                : traj === 'mixed'
                  ? 'Partial progress — some goals moving, others not yet.'
                  : 'Limited change so far this interval.',
          },
          goals: goals.length
            ? goals
            : [
                {
                  metric: '(no goals entered)',
                  status: 'unknown',
                  delta: '—',
                  comment: 'Add goals and current values to reassess.',
                },
              ],
          recommendation: rec,
          diagnosis_reexamine: { needed: false, reason: '' },
          patient_summary:
            'This is a demo reassessment: progress is compared against the targets set at the first visit; the plan continues with any adjustments noted above.',
          uncertainties: ['Demo figures — illustrative only.'],
          disclaimer: 'AI-proposed reassessment for clinician confirmation.',
        }
        return JSON.stringify(out)
      }
      return '{}'
    },

    buildImageContext() {
      const age = this.formData.age
      const sex = this.formData.sex
      const lines = [
        `Patient context: ${age ? 'age ' + age : 'age unknown'}${sex ? ', ' + sex : ''}.`,
        '',
        'Captures provided, in order below:',
      ]
      this.attachedImages.forEach((img, i) => {
        const modeLabel =
          {
            white: 'White light',
            woods_uv: "Wood's UV",
            surface_polarized: 'Surface polarised',
            subsurface_polarized: 'Sub-surface polarised',
            red: 'Red light',
          }[img.mode] || 'unlabelled — infer the mode from the image'

        lines.push(`  Image ${i + 1}: ${modeLabel}`)
      })
      lines.push(
        '',
        'Produce the objective read, provisional impression, and tailored history questions as the specified JSON.',
      )
      return lines.join('\n')
    },

    async analyseCaptures() {
      if (!this.attachedImages.length && !this.demoMode) return

      this.isLoading = true
      this.loadingMessage = 'Reading the captures…'

      const content = [{ type: 'text', text: this.buildImageContext() }]
      this.attachedImages.forEach((img) => {
        content.push({
          type: 'image',
          source: { type: 'base64', media_type: img.mediaType, data: img.base64 },
        })
      })

      try {
        const raw = await this.callOpenAI({
          system: IMAGE_SYSTEM_PROMPT,
          content: content,
          max_tokens: 2600,
          temperature: 0.2,
        })

        const a = this.parseJSON(raw)
        this.aiAnalysis = { data: a, confirmed: false }
        this.dynamicQuestions = Array.isArray(a.history_questions) ? a.history_questions : []

        // Populate readings fields in form
        if (a.global_indices) {
          const gi = a.global_indices
          
          // Map Fitzpatrick skin type
          let fitzVal = ''
          if (gi.estimated_fitzpatrick?.type) {
            const t = gi.estimated_fitzpatrick.type.toLowerCase()
            if (t.includes('iii_to_iv') || t.includes('iii-iv')) fitzVal = 'IV'
            else if (t.includes('iv_to_v') || t.includes('iv-v')) fitzVal = 'V'
            else if (t.includes('v_to_vi') || t.includes('v-vi')) fitzVal = 'VI'
            else if (t.includes('iii')) fitzVal = 'III'
            else if (t.includes('iv')) fitzVal = 'IV'
            else if (t.includes('v')) fitzVal = 'V'
            else if (t.includes('vi')) fitzVal = 'VI'
            else if (t.includes('ii')) fitzVal = 'II'
            else if (t.includes('i')) fitzVal = 'I'
          }
          this.formData.fitz = fitzVal
          
          this.formData.mel = gi.melanin_load_index?.score_100 || ''
          this.formData.ery = gi.erythema_load_index?.score_100 || ''
          
          // Map Composition
          let compVal = ''
          if (gi.composition?.type) {
            const c = gi.composition.type.toLowerCase()
            if (c.includes('melanin')) compVal = 'melanin'
            else if (c.includes('vascular')) compVal = 'vascular'
            else if (c.includes('mixed')) compVal = 'mixed'
            else compVal = 'uncertain'
          }
          this.formData.comp = compVal
          
          // Map Depth
          let depthVal = ''
          if (gi.depth_call?.type) {
            const d = gi.depth_call.type.toLowerCase()
            if (d.includes('epidermal')) depthVal = 'epidermal'
            else if (d.includes('dermal')) depthVal = 'dermal'
            else if (d.includes('mixed')) depthVal = 'mixed'
            else depthVal = 'uncertain'
          }
          this.formData.depth = depthVal
        } else {
          this.formData.fitz = a.skin_type?.fitzpatrick_estimate || ''
          this.formData.mel = a.skin_type?.melanin_index || ''
          this.formData.ery = a.erythema_index || ''
          this.formData.comp = a.composition?.dominant || ''
          this.formData.depth = a.depth?.verdict || ''
        }
      } catch (err) {
        console.error(err)
        throw err
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
      this.isLoading = true
      this.loadingMessage = 'Generating dynamic follow-up questions…'

      const content = [
        {
          type: 'text',
          text: JSON.stringify({
            session_id: this.id || '1',
            image_analysis: this.aiAnalysis?.data || {},
            fixed_history: this.fixedHistory,
            max_dynamic_questions: 5
          }, null, 2)
        }
      ]

      try {
        const raw = await this.callOpenAI({
          system: DYNAMIC_QUESTIONS_PROMPT,
          content: content,
          max_tokens: 2000,
          temperature: 0.3
        })

        const res = this.parseJSON(raw)
        this.dynamicQuestions = Array.isArray(res.dynamic_questions) ? res.dynamic_questions : []
        
        const answers = {}
        this.dynamicQuestions.forEach((q) => {
          answers[q.question_id] = q.answer_type === 'multi_choice' ? [] : ''
        })
        this.dynamicAnswers = answers
      } catch (err) {
        console.error(err)
        throw err
      } finally {
        this.isLoading = false
      }
    },

    buildBaseBlock() {
      const line = (k, v) => (v && String(v).length ? `${k}: ${v}` : null)
      const qa = []
      this.dynamicQuestions.forEach((q, i) => {
        const ans = this.dynamicAnswers[i] || ''
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
          line('Dermoscopy', this.formData.notes), // extra details
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
      const requestPayload = {
        session_id: this.id || 'AIJ-PIG-000001',
        image_analysis: this.aiAnalysis?.data || {},
        fixed_history: this.fixedHistory,
        dynamic_history: this.dynamicAnswers
      }
      return JSON.stringify(requestPayload, null, 2)
    },

    async generateDx() {
      this.isLoading = true
      this.loadingMessage = 'Integrating the image read…'

      const content = [{ type: 'text', text: this.buildDiagnosisInput() }]
      this.attachedImages.forEach((img) => {
        content.push({
          type: 'image',
          source: { type: 'base64', media_type: img.mediaType, data: img.base64 },
        })
      })
      this.dermoscopyImages.forEach((img) => {
        content.push({
          type: 'image',
          source: { type: 'base64', media_type: img.mediaType, data: img.base64 },
        })
      })

      try {
        const raw = await this.callOpenAI({
          system: DIAGNOSIS_PROMPT,
          content: content,
          max_tokens: 2600,
          temperature: 0.3,
        })

        const dx = this.parseJSON(raw)

        // Map the new response schema to the UI schema so that print report, diagnosis page etc. do not break!
        // We will store both the raw AI response in store.diagnosis.data AND the mapped fields.

        // Map working_impression to differential
        const primaryDx = dx.working_impression?.primary_category || ''
        const primaryConfidence = dx.scores?.ai_planning_confidence_score_100 || 80
        const primaryReasoning = dx.clinical_summary_for_doctor || ''

        const alternatives = (dx.working_impression?.secondary_categories || []).map(cat => ({
          dx: cat,
          likelihood: 'moderate',
          reconsider_when: 'if clinically indicated'
        }))

        // Map scores object to scores array
        const scoresArray = []
        if (dx.scores) {
          const mapScore = (key, name, scale) => {
            if (dx.scores[key] !== undefined) {
              scoresArray.push({
                name: name,
                value: String(dx.scores[key]),
                scale: scale,
                interpretation: dx.scores[key] > 50 ? 'elevated' : 'mild/moderate'
              })
            }
          }
          mapScore('pigmentation_score_100', 'Melanin Load Index', '0–100')
          mapScore('inflammation_score_100', 'Erythema Load Index', '0–100')
          mapScore('recurrence_risk_score_100', 'Recurrence Risk Score', '0–100')
          mapScore('procedure_risk_score_100', 'Procedure Risk Score', '0–100')
          mapScore('sunscreen_compliance_score_100', 'Sunscreen Compliance Score', '0–100')
          mapScore('ai_planning_confidence_score_100', 'AI Planning Confidence', '0–100')
        }

        // Map key_drivers
        const drivers = []
        if (dx.clinical_activity) {
          if (dx.clinical_activity.stability_status) drivers.push(`Stability: ${dx.clinical_activity.stability_status}`)
          if (dx.clinical_activity.inflammation_first_required) drivers.push(`Inflammation Control Required First`)
          if (dx.clinical_activity.active_acne_driver) drivers.push(`Active Acne Driver Present`)
          if (dx.clinical_activity.barrier_repair_first_required) drivers.push(`Barrier Repair Required First`)
        }
        if (dx.risk_profile) {
          drivers.push(`Recurrence Risk: ${dx.risk_profile.recurrence_risk}`)
          drivers.push(`Procedure Risk: ${dx.risk_profile.procedure_risk}`)
          drivers.push(`Sunscreen Risk: ${dx.risk_profile.sunscreen_compliance_risk}`)
          drivers.push(`PIH Risk: ${dx.risk_profile.pih_risk}`)
        }

        // Map red_flags
        const redFlagsPresent = dx.risk_profile?.red_flag_lesion_risk && dx.risk_profile.red_flag_lesion_risk !== 'not_reported'
        const redFlagsAction = dx.working_impression?.doctor_review_reason || ''
        const redFlagsItems = redFlagsPresent ? [dx.risk_profile.red_flag_lesion_risk] : []

        // Map depth & composition (default back to form or construct from primary category)
        let depthVal = this.formData.depth || 'mixed'
        let compVal = this.formData.comp || 'melanin'
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

        const mappedData = {
          ...dx,
          needs_summary: dx.working_impression?.primary_category === 'unclear_doctor_review' && !this.dermoscopyFindings,
          needs_dermoscopy: dx.working_impression?.primary_category === 'unclear_doctor_review' && !this.dermoscopyFindings,
          dermoscopy_request: {
            reason: dx.working_impression?.doctor_review_reason || 'Suspicion of ochronosis or atypical lesion.',
            look_for: ['banana-shaped ochre structures', 'blue-grey globules']
          },
          differential: {
            primary: {
              dx: primaryDx,
              confidence: primaryConfidence,
              reasoning: primaryReasoning
            },
            alternatives: alternatives
          },
          depth_assessment: {
            verdict: depthVal,
            basis: 'Derived from diagnostic category & clinical activity',
            prognosis: 'Requires regular assessment'
          },
          composition_assessment: {
            dominant: compVal,
            note: 'Derived from primary category composition'
          },
          scores: scoresArray,
          severity_interpretation: `Confidence: ${dx.working_impression?.diagnostic_confidence || 'moderate'}. Recurrence: ${dx.risk_profile?.recurrence_risk || 'moderate'}.`,
          key_drivers: drivers,
          red_flags: {
            present: redFlagsPresent,
            items: redFlagsItems,
            action: redFlagsAction
          },
          uncertainties: [
            dx.working_impression?.doctor_review_reason || 'Clinical verification required'
          ]
        }

        this.diagnosis = { data: mappedData, confirmedDx: '' }
      } catch (err) {
        console.error(err)
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async extractDermoscopy() {
      if (!this.dermoscopyImages.length) return

      this.isLoading = true
      this.loadingMessage = 'Reading dermoscopy image…'

      const lookFor = this.diagnosis?.data?.dermoscopy_request?.look_for || []
      const systemPrompt =
        DERMOSCOPY_PROMPT +
        (lookFor.length ? `\n\nSpecific features requested: ${lookFor.join(', ')}.` : '')

      const content = [
        {
          type: 'text',
          text: 'Extract dermoscopic structures from these attached dermoscopy captures.',
        },
      ]
      this.dermoscopyImages.forEach((img) => {
        content.push({
          type: 'image',
          source: { type: 'base64', media_type: img.mediaType, data: img.base64 },
        })
      })

      try {
        const raw = await this.callOpenAI({
          system: systemPrompt,
          content: content,
          max_tokens: 2000,
          temperature: 0.2,
        })

        this.dermoscopyFindings = this.parseJSON(raw)
      } catch (err) {
        console.error(err)
        throw err
      } finally {
        this.isLoading = false
      }
    },

    confirmDx(selectedDx) {
      if (!this.diagnosis) this.diagnosis = { data: null, confirmedDx: '' }
      this.diagnosis.confirmedDx = selectedDx
    },

    buildPlanInput() {
      const request = {
        session_id: this.conversationId || 'AIJ-PIG-000001',
        diagnosis: this.diagnosis?.data || {},
        image_analysis: this.aiAnalysis?.data || {},
        fixed_history: this.fixedHistory,
        dynamic_history: this.dynamicAnswers,
        clinic_config: {
          location: "AI Aesthetics Jaipur",
          inventory: [
            "Q-switch Nd:YAG (1064nm, 532nm)",
            "BioRePeelCl3 (TCA-based low-downtime)",
            "Mandelic Acid peel",
            "Lactic Acid peel",
            "Microneedling (doctor-performed)",
            "Exosomes / PDRN (topical after microneedling)",
            "LED therapy (calming support)"
          ],
          protocols: [
            "Conservative Q-switch Nd:YAG toning for dark skin (FST IV-VI)",
            "Sequence vascular/inflammation treatment first if high erythema present",
            "Friction reduction instructions if spectacle/friction pigmentation is suspected"
          ]
        },
        doctor_overrides: {
          allowed: true,
          notes: null
        }
      }
      return JSON.stringify(request, null, 2)
    },

    async generatePlan() {
      this.isLoading = true
      this.loadingMessage = 'Drafting the tiered plan…'

      const content = [{ type: 'text', text: this.buildPlanInput() }]
      this.attachedImages.forEach((img) => {
        content.push({
          type: 'image',
          source: { type: 'base64', media_type: img.mediaType, data: img.base64 },
        })
      })

      try {
        const raw = await this.callOpenAI({
          system: PLAN_PROMPT,
          content: content,
          max_tokens: 4096,
          temperature: 0.3,
        })

        const res = this.parseJSON(raw)
        
        // MAP NEW PLAN JSON TO THE UI SCHEMA EXPECTED BY PlanStage.vue
        const mappedPlan = {
          summary_line: res.client_report?.headline || res.treatment_priority || "Optimum Treatment Plan",
          condition: this.diagnosis?.confirmedDx || res.treatment_priority || "Hyperpigmentation",
          condition_specific_note: res.client_report?.simple_explanation || "",
          prognosis: res.whatsapp_summary?.message || "",
          plan: {
            tier0_photoprotection: res.prescription_style_output?.non_rx_homecare || [],
            tier1_topical: [],
            tier2_procedural: [],
            oral_options: [],
            sequencing_note: ""
          },
          goals: [],
          safety_flags: res.safety_flags || [],
          uncertainties: res.follow_up_plan?.comparison_metrics || [],
          follow_up: {
            interval: `${res.follow_up_plan?.next_review_weeks?.min || 4}-${res.follow_up_plan?.next_review_weeks?.max || 6} weeks`,
            measure: `Repeat images: ${(res.follow_up_plan?.repeat_images || []).join(', ')}`,
            escalate_if_plateau: `Assess progression: ${res.follow_up_plan?.progression_type || ''}`,
            stop_if: "Any increase in sensitivity or erythema load"
          },
          clinician_review_required: res.doctor_review_required !== false,
          disclaimer: "AI-generated proposal for clinician review; not a final prescription."
        }

        // Map Topicals
        if (res.homecare_plan?.morning?.length) {
          mappedPlan.plan.tier1_topical.push({
            agent: "Morning Routine",
            detail: res.homecare_plan.morning.map(x => x.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())).join(', '),
            contraindicated: false
          })
        }
        if (res.homecare_plan?.night?.length) {
          mappedPlan.plan.tier1_topical.push({
            agent: "Night Routine",
            detail: res.homecare_plan.night.map(x => x.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())).join(', '),
            contraindicated: false
          })
        }
        if (res.homecare_plan?.avoid?.length) {
          mappedPlan.plan.tier1_topical.push({
            agent: "Discontinue / Avoid",
            detail: res.homecare_plan.avoid.map(x => x.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())).join(', '),
            caution: "Do not use OTC steroid / fairness creams"
          })
        }

        // Map Procedures
        if (Array.isArray(res.prescription_style_output?.procedure_orders)) {
          res.prescription_style_output.procedure_orders.forEach(o => {
            mappedPlan.plan.tier2_procedural.push({
              intervention: o.procedure,
              detail: `Wavelength: ${o.wavelength_nm || '1064'}nm | Energy: ${o.energy_mj || ''}mJ | Fluence: ${o.fluence_j_cm2 || ''} J/cm² | Freq: ${o.frequency_hz || ''} Hz | Notes: ${o.notes || ''}`,
              readiness: "first-line"
            })
          })
        }

        const bio = res.modality_eligibility?.biorepeelcl3
        if (bio && bio.eligible && !mappedPlan.plan.tier2_procedural.some(p => p.intervention?.toLowerCase().includes('biorepeel'))) {
          mappedPlan.plan.tier2_procedural.push({
            intervention: "BioRePeelCl3",
            detail: `Contact time: ${bio.contact_time_minutes?.min || 3}-${bio.contact_time_minutes?.max || 5} min | Interval: ${bio.repeat_interval_days || 30} days | Pair with Q-switch: ${bio.can_pair_with_q_switch ? 'Yes (' + bio.pairing_condition + ')' : 'No'}`,
            readiness: "consider"
          })
        }

        const mn = res.modality_eligibility?.microneedling_with_regenerative_actives
        if (mn && (mn.eligible === true || mn.eligible?.toString().includes('eligible') || mn.eligible?.toString().includes('consider'))) {
          mappedPlan.plan.tier2_procedural.push({
            intervention: "Microneedling with Regenerative Actives",
            detail: mn.reason || "Doctor-performed microneedling. Default route: topical/transdermal after microneedling.",
            readiness: mn.eligible === true ? "first-line" : "consider"
          })
        }

        // Map Oral/Review Prescriptions
        if (res.homecare_plan?.prescription_items_for_doctor_review?.length) {
          res.homecare_plan.prescription_items_for_doctor_review.forEach(item => {
            const isContraindicated = (item.toLowerCase().includes('tranexamic') || item.toLowerCase().includes('txa')) && (this.safety.pregnancy || this.safety.clot)
            mappedPlan.plan.oral_options.push({
              agent: item.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
              detail: "Prescription-only pigment suppressant",
              screening_required: item.toLowerCase().includes('tranexamic') ? "Thromboembolic screen (clot history, OCP, smoking) before starting" : "",
              contraindicated: isContraindicated,
              reason: isContraindicated ? "Contraindicated due to pregnancy/lactation or thromboembolic risk parameters." : ""
            })
          })
        }

        // Sequencing Note
        const parts = []
        if (res.recommended_session_1?.primary_option?.name) {
          parts.push(`Primary option: ${res.recommended_session_1.primary_option.name}`)
        }
        if (res.recommended_session_1?.alternative_option?.name) {
          parts.push(`Alternative: ${res.recommended_session_1.alternative_option.name}`)
        }
        if (res.recommended_session_1?.combination_option?.allowed) {
          parts.push(`Combo: ${res.recommended_session_1.combination_option.name} (${res.recommended_session_1.combination_option.condition || ''})`)
        }
        mappedPlan.plan.sequencing_note = parts.join(' | ')

        // Map Goals
        if (Array.isArray(res.follow_up_plan?.comparison_metrics)) {
          res.follow_up_plan.comparison_metrics.forEach(metric => {
            let label = metric.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
            let base = "—"
            let target = "Improvement"
            let how = "Clinical review"
            
            if (metric.includes('pigmentation_score_5')) {
              label = "Pigmentation score (0-5)"
              base = this.formData.mel ? Math.round(this.formData.mel / 20) + '/5' : '2/5'
              target = '≤' + Math.max(1, Math.round(parseFloat(base) - 1)) + '/5'
              how = "Re-image and re-score"
            } else if (metric.includes('pigmentation_score_100')) {
              label = "Melanin Index (0-100)"
              base = this.formData.mel || "60"
              target = '≤' + Math.max(10, Math.round(parseFloat(base) * 0.8))
              how = "Analyser re-read under identical lighting"
            } else if (metric.includes('inflammation')) {
              label = "Erythema Index (0-100)"
              base = this.formData.ery || "12"
              target = '≤' + Math.max(5, Math.round(parseFloat(base) * 0.8))
              how = "Analyser re-read under identical lighting"
            } else if (metric.includes('woods_uv')) {
              label = "Wood's UV diffusion score"
              base = this.formData.woods || "Not done"
              target = "Decreased contrast / diffusion"
              how = "Wood's light comparison"
            }
            
            mappedPlan.goals.push({
              metric: label,
              baseline: base,
              target: target,
              timeframe: `${res.follow_up_plan?.next_review_weeks?.min || 4}-${res.follow_up_plan?.next_review_weeks?.max || 6} weeks`,
              how_measured: how
            })
          })
        }

        this.lastPlan = mappedPlan
        this.reviewState = {
          decision: null,
          notes: '',
          reviewer: 'Dr. A. Mehra',
          finalized: false,
          ts: null,
        }
        this.goals = mappedPlan.goals || []
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
      const lines = [
        `CONFIRMED DIAGNOSIS (from assessment): ${this.diagnosis?.confirmedDx || ''}.`,
        `Patient: ${this.formData.age ? 'age ' + this.formData.age : ''}${this.formData.sex ? ', ' + this.formData.sex : ''}.`,
        '',
        'GOALS SET AT ASSESSMENT and current status:',
      ]

      this.goals.forEach((g, i) => {
        lines.push(
          `${i + 1}. Metric: ${g.metric} | Baseline: ${g.baseline || '—'} | Target: ${g.target || '—'} | Timeframe: ${g.timeframe || '—'} | Current: ${g.current || '(not entered)'}`,
        )
      })

      lines.push('')
      if (this.reassessImages.length) {
        lines.push(
          `Follow-up captures (${this.reassessImages.length}) are attached below — re-read them to inform current status where a value was not entered.`,
        )
      } else {
        lines.push('No follow-up captures provided — judge from the entered current values.')
      }

      lines.push('', 'Produce the reassessment as the specified JSON.')
      return lines.join('\n')
    },

    async generateReassessment() {
      this.isLoading = true
      this.loadingMessage = 'Rating trajectory & checking goals…'

      const content = [{ type: 'text', text: this.buildReassessInput() }]
      this.reassessImages.forEach((img) => {
        content.push({
          type: 'image',
          source: { type: 'base64', media_type: img.mediaType, data: img.base64 },
        })
      })

      try {
        const raw = await this.callOpenAI({
          system: REASSESS_PROMPT,
          content: content,
          max_tokens: 2200,
          temperature: 0.3,
        })

        const r = this.parseJSON(raw)
        this.reassessment = r
      } catch (err) {
        console.error(err)
        throw err
      } finally {
        this.isLoading = false
      }
    },
  },
})
