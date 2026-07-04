import { defineStore } from 'pinia'
import { useOpenAI } from 'src/composables/useOpenAI'
import { useAssessmentStore } from 'src/stores/assessmentStore'
import { useIVAssessmentStore } from 'src/stores/ivAssessmentStore'
import { api } from 'src/boot/axios'
import {
  IMAGE_SYSTEM_PROMPT,
  DIAGNOSIS_PROMPT,
  DERMOSCOPY_PROMPT,
  PLAN_PROMPT,
  REASSESS_PROMPT,
  DEMO_DERMOSCOPY,
  DEMO_ANALYSIS,
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

    // AI Analysis (Stage 2)
    aiAnalysis: null,
    dynamicQuestions: [],
    dynamicAnswers: {},

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
    loadingMessage: '',
    isLoading: false,
  }),

  getters: {
    stageLabel: (state) => {
      const names = ['Capture', 'Assess', 'Diagnosis', 'Plan', 'Reassess']
      const pad = (x) => (x < 10 ? '0' : '') + x
      return `${pad(state.currentStage + 1)} / 05 — ${names[state.currentStage]}`
    },
    progressPercent: (state) => {
      return ((state.currentStage + 1) / 5) * 100
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
      if (/dermoscopy-extraction assistant/.test(system)) {
        return JSON.stringify(DEMO_DERMOSCOPY)
      }
      if (/diagnostic assistant/.test(system)) {
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
      if (/treatment-planning assistant/.test(system)) {
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
        this.formData.fitz = a.skin_type?.fitzpatrick_estimate || ''
        this.formData.mel = a.skin_type?.melanin_index || ''
        this.formData.ery = a.erythema_index || ''
        this.formData.comp = a.composition?.dominant || ''
        this.formData.depth = a.depth?.verdict || ''

        this.currentStage = 1
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
      let dermo = ''
      if (this.dermoscopyImages.length) {
        dermo = `\n\nDERMOSCOPY: ${this.dermoscopyImages.length} dermoscopy image(s) are attached below.`
        if (this.dermoscopyFindings) {
          const f = this.dermoscopyFindings
          dermo += ' AI-extracted dermoscopy findings (clinician-reviewed):'
          if (f.pattern_summary) dermo += ` ${f.pattern_summary}`
          if (f.observed_structures?.length)
            dermo += ` Structures: ${f.observed_structures.join(', ')}.`
          if (f.feature_checks?.length)
            dermo +=
              ' Feature checks: ' +
              f.feature_checks.map((c) => `${c.feature}=${c.status}`).join('; ') +
              '.'
          if (f.suggests) dermo += ` Dermoscopic impression: ${f.suggests}`
        }
        dermo +=
          ' Incorporate these dermoscopy findings, set needs_dermoscopy=false, and commit to your best-supported diagnosis.'
      } else {
        dermo =
          '\n\nDERMOSCOPY: none provided yet. If dermoscopy would materially change the diagnosis, request it via needs_dermoscopy/dermoscopy_request rather than forcing a low-confidence call.'
      }
      return (
        this.buildBaseBlock() +
        dermo +
        '\n\nProduce the proposed differential (with scores) as the specified JSON.'
      )
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
        this.diagnosis = { data: dx, confirmedDx: '' }
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
      const dxData = this.diagnosis?.data || {}
      let ctx = `\n\nCONFIRMED WORKING DIAGNOSIS (clinician-confirmed): ${this.diagnosis?.confirmedDx || ''}.`
      if (dxData) {
        ctx += `\nDepth: ${dxData.depth_assessment?.verdict || '—'}. Composition: ${dxData.composition_assessment?.dominant || '—'}. Key drivers: ${(dxData.key_drivers || []).join(', ')}.`
      }
      ctx +=
        '\n\nProduce a plan appropriate to THIS confirmed diagnosis as the specified JSON. Apply all hard safety rules.'
      return this.buildBaseBlock() + ctx
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

        const plan = this.parseJSON(raw)
        this.lastPlan = plan
        this.reviewState = {
          decision: null,
          notes: '',
          reviewer: 'Dr. A. Mehra',
          finalized: false,
          ts: null,
        }
        this.goals = plan.goals || []
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
