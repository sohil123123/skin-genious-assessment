import { defineStore } from 'pinia'
import { useOpenAI } from 'src/composables/useOpenAI'
import { useAssessmentStore } from 'src/stores/assessmentStore'
import { useIVAssessmentStore } from 'src/stores/ivAssessmentStore'
import { api } from 'src/boot/axios'
import { Loading, LocalStorage } from 'quasar'
import { useCommonStore } from 'src/stores/commonStore'
import {
  IMAGE_SYSTEM_PROMPT,
  DYNAMIC_QUESTIONS_PROMPT,
  DIAGNOSIS_PROMPT,
  PLAN_PROMPT,
  PIGMENTATION_CLINICAL_POLICY_V2,
  REASSESS_PROMPT,
  REASSESS_QUESTIONS_PROMPT,
} from 'src/services/pigmentationPromptsV2_1'
import { PIGMENTATION_CONFIG } from 'src/services/pigmentationConfig'

export const usePigmentationStore = defineStore('pigmentation', {
  state: () => ({
    model: 'gpt-5.2',
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
    dynamicQuestions: [],
    loadingMessage: '',
    isLoading: false,
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
          if (pi.aiAnalysis) this.aiAnalysis = pi.aiAnalysis
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
            return String(str).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
          }

          const nextReassessment = planObj.treatment_goals?.next_reassessment || planObj.next_reassessment
          if (nextReassessment) {
            const timeframe = planObj.duration ? cleanLabel(planObj.duration) : 'Next Reassessment'
            
            if (Array.isArray(nextReassessment.component_targets)) {
              nextReassessment.component_targets.forEach((ct) => {
                goals.push({
                  metric: `${cleanLabel(ct.metric || 'Target')} (${ct.diagnostic_component_id || ''})`,
                  baseline: String(ct.baseline !== undefined && ct.baseline !== null ? ct.baseline : '—'),
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
            const mLoad = base.global_background_melanin_load_index !== undefined ? base.global_background_melanin_load_index : base.melanin_load_index
            const eLoad = base.global_background_erythema_load_index !== undefined ? base.global_background_erythema_load_index : base.erythema_load_index

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
        safety: this.safety,
        redFlags: this.redFlags,
        goals: this.goals,
        reviewState: this.reviewState,
        lastPlan: this.lastPlan,
        diagnosis: this.diagnosis ? this.diagnosis.data : null,
        confirmedDx: this.diagnosis ? this.diagnosis.confirmedDx : '',
        aiAnalysis: this.aiAnalysis,
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

    async callOpenAI({ system, content }) {
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
      await this.uploadStoreImages(this.attachedImages, assessmentId, 'pigmentation-pre')
      await this.uploadStoreImages(this.reassessImages, assessmentId, 'pigmentation-post')

      // Convert content to the backend format
      let formattedContent = []
      if (typeof content === 'string') {
        formattedContent.push({ type: 'input_text', text: content })
      } else if (Array.isArray(content)) {
        for (const item of content) {
          if (item.type === 'text') {
            formattedContent.push({ type: 'input_text', text: item.text })
          } else if (item.type === 'image_id') {
            formattedContent.push({ type: 'input_image', file_id: item.file_id })
          } else if (item.type === 'image') {
            const base64Data = item.source?.data
            const img =
              this.attachedImages.find((i) => i.base64 === base64Data) ||
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
      if (!this.attachedImages.length) return

      this.isLoading = true
      this.loadingMessage = 'Reading the captures…'

      const content = [{ type: 'text', text: this.buildImageContext() }]
      this.attachedImages.forEach((img) => {
        if (img.openai_file_id) {
          content.push({
            type: 'image_id',
            file_id: img.openai_file_id,
          })
        } else {
          content.push({
            type: 'image',
            source: { type: 'base64', media_type: img.mediaType, data: img.base64 },
          })
        }
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
        if (!this.dynamicQuestions || this.dynamicQuestions.length === 0) {
          this.dynamicQuestions = Array.isArray(a.history_questions) ? a.history_questions : []
        }

        // Populate readings fields in form
        const gi = a.global_background_indices || a.global_indices
        if (gi) {
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
            if (d.includes('mixed')) depthVal = 'mixed'
            else if (d.includes('epidermal')) depthVal = 'epidermal'
            else if (d.includes('dermal')) depthVal = 'dermal'
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
        await this.updateAssessment()
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
      if (this.dynamicQuestions && this.dynamicQuestions.length > 0) {
        return
      }
      this.isLoading = true
      this.loadingMessage = 'Generating dynamic follow-up questions…'

      const content = [
        {
          type: 'text',
          text: JSON.stringify(
            {
              session_id: this.id || '1',
              image_analysis: this.aiAnalysis?.data || {},
              fixed_history: this.fixedHistory,
              max_dynamic_questions: 5,
            },
            null,
            2,
          ),
        },
      ]

      try {
        const raw = await this.callOpenAI({
          system: DYNAMIC_QUESTIONS_PROMPT,
          content: content,
          max_tokens: 2000,
          temperature: 0.3,
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
        dynamic_history: this.dynamicAnswers,
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
        // Map working_impression to differential
        const primaryComp = dx.diagnostic_components?.find(
          (c) => c.diagnostic_component_id === dx.working_impression?.dominant_treatable_component_id
        ) || dx.diagnostic_components?.[0]
        const primaryDx = primaryComp?.family || primaryComp?.subtype || dx.working_impression?.primary_category || ''
        const primaryConfidence = primaryComp?.confidence_100 || dx.scores?.ai_planning_confidence_score_100 || 80
        const primaryReasoning = dx.summaries?.clinical_summary_for_doctor || dx.working_impression?.overall_summary || dx.clinical_summary_for_doctor || ''

        let alternatives = []
        if (dx.ranked_differential?.length) {
          alternatives = dx.ranked_differential.map((diff) => {
            return {
              dx: diff.family || diff.subtype || '',
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
          melanin_load_index: metrics.global_background_melanin_load_index !== undefined ? metrics.global_background_melanin_load_index : (dxScores.melanin_load_index !== undefined ? dxScores.melanin_load_index : parseInt(this.formData.mel) || 50),
          erythema_load_index: metrics.global_background_erythema_load_index !== undefined ? metrics.global_background_erythema_load_index : (dxScores.erythema_load_index !== undefined ? dxScores.erythema_load_index : parseInt(this.formData.ery) || 20),
          composition_melanin_percent: dxScores.composition_melanin_percent !== undefined ? dxScores.composition_melanin_percent : 70,
          composition_vascular_percent: dxScores.composition_vascular_percent !== undefined ? dxScores.composition_vascular_percent : 30,
          recurrence_risk_index: dxScores.recurrence_risk_index !== undefined ? dxScores.recurrence_risk_index : 50,
          procedure_risk_index: dxScores.procedure_risk_index !== undefined ? dxScores.procedure_risk_index : 30,
          sunscreen_compliance_index: dxScores.sunscreen_compliance_index !== undefined ? dxScores.sunscreen_compliance_index : 50,
          diagnosis_confidence_index: primaryConfidence
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
            drivers.push(`${drv.driver}: ${drv.likelihood || 'possible'} (${drv.confidence_100 || 50}% conf)`)
          })
        }
        
        const activity = dx.clinical_activity || {}
        const mappedActivity = {
          stability_status: activity.global_stability_status || activity.stability_status || 'stable',
          active_acne_driver: activity.active_acne_present !== undefined ? activity.active_acne_present : (activity.active_acne_driver || false),
          inflammation_first_required: activity.inflammation_first_required_any_component !== undefined ? activity.inflammation_first_required_any_component : (activity.inflammation_first_required || false),
          barrier_repair_first_required: activity.barrier_repair_first_required_any_component !== undefined ? activity.barrier_repair_first_required_any_component : (activity.barrier_repair_first_required || false),
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
        const redFlagsPresent = dx.working_impression?.doctor_review_required || (dx.risk_profile?.red_flag_lesion_risk && dx.risk_profile.red_flag_lesion_risk !== 'not_reported') || false
        const redFlagsAction = dx.working_impression?.doctor_review_reason || ''
        const redFlagsItems = redFlagsPresent ? [redFlagsAction || dx.risk_profile?.red_flag_lesion_risk || 'Doctor Review Required'] : []

        // Map depth & composition (default back to form or construct from primary category)
        let depthVal = this.formData.depth || primaryComp?.depth || 'mixed'
        let compVal = this.formData.comp || primaryComp?.subtype || 'melanin'
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
        mappedData.needs_dermoscopy = !!redFlagsPresent
        mappedData.dermoscopy_request = {
          reason: redFlagsAction || 'Suspicion of atypical lesion.',
          look_for: ['atypical pigment network', 'asymmetry', 'heterogeneity'],
        }
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
        mappedData.uncertainties = [
          redFlagsAction || 'Clinical verification required',
        ]

        console.log('mappedData', mappedData)

        this.diagnosis = { data: mappedData, confirmedDx: '' }
        await this.updateAssessment()
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
        clinicPolicy: PIGMENTATION_CLINICAL_POLICY_V2,
        clinic_config: PIGMENTATION_CONFIG,
        doctor_overrides: {
          allowed: true,
          notes: null,
        },
      }
      return JSON.stringify(request, null, 2)
    },

    async generatePlan(force = false) {
      if (this.lastPlan && !force) {
        return
      }
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
        const planObj = res.linear_treatment_plan || res

        if (planObj.current_treatment_block && planObj.current_treatment_block.sessions) {
          planObj.sessions = planObj.current_treatment_block.sessions.map((s) => ({
            id: s.id || s.session_number,
            status: s.status || 'pending',
            ...s,
          }))
        } else if (planObj.sessions) {
          planObj.sessions = planObj.sessions.map((s) => ({
            id: s.id || s.session_number,
            status: s.status || 'pending',
            ...s,
          }))
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
          return String(str).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        }

        const nextReassessment = planObj.treatment_goals?.next_reassessment || planObj.next_reassessment
        if (nextReassessment) {
          const timeframe = planObj.duration ? cleanLabel(planObj.duration) : 'Next Reassessment'
          
          if (Array.isArray(nextReassessment.component_targets)) {
            nextReassessment.component_targets.forEach((ct) => {
              goals.push({
                metric: `${cleanLabel(ct.metric || 'Target')} (${ct.diagnostic_component_id || ''})`,
                baseline: String(ct.baseline !== undefined && ct.baseline !== null ? ct.baseline : '—'),
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
          const mLoad = base.global_background_melanin_load_index !== undefined ? base.global_background_melanin_load_index : base.melanin_load_index
          const eLoad = base.global_background_erythema_load_index !== undefined ? base.global_background_erythema_load_index : base.erythema_load_index

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
      lines.push('PATIENT REASSESSMENT HISTORY & ANSWERS:')
      if (this.reassessQuestions && this.reassessQuestions.length > 0) {
        this.reassessQuestions.forEach((q) => {
          const ans = this.reassessAnswers[q.question_id]
          lines.push(`Question: ${q.question}`)
          lines.push(`Answer: ${Array.isArray(ans) ? ans.join(', ') : ans || 'no answer'}`)
        })
      } else {
        lines.push('None provided.')
      }

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

        if (r.current_treatment_block) {
          const sessionsMapped = r.current_treatment_block.sessions.map((s) => ({
            id: s.id || s.session_number,
            status: s.status || 'pending',
            ...s,
          }))
          if (this.lastPlan) {
            const existingSessions = this.lastPlan.sessions || []
            const mergedSessions = [...existingSessions]
            sessionsMapped.forEach((newS) => {
              const idx = mergedSessions.findIndex(
                (extS) => Number(extS.session_number) === Number(newS.session_number),
              )
              if (idx !== -1) {
                mergedSessions[idx] = { ...mergedSessions[idx], ...newS }
              } else {
                mergedSessions.push(newS)
              }
            })
            mergedSessions.sort((a, b) => Number(a.session_number) - Number(b.session_number))

            this.lastPlan = {
              ...this.lastPlan,
              current_treatment_block: r.current_treatment_block,
              future_treatment_roadmap:
                r.future_treatment_roadmap || this.lastPlan.future_treatment_roadmap,
              master_treatment_roadmap:
                r.updated_master_treatment_roadmap || this.lastPlan.master_treatment_roadmap,
              sessions: mergedSessions,
            }
          } else {
            this.lastPlan = {
              plan_name: 'Post-Reassessment Treatment Plan',
              duration: r.current_treatment_block.expected_duration || '6 weeks',
              plan_status: 'ai_generated_pending_doctor_review',
              current_treatment_block: r.current_treatment_block,
              future_treatment_roadmap: r.future_treatment_roadmap,
              master_treatment_roadmap: r.updated_master_treatment_roadmap,
              sessions: sessionsMapped,
            }
          }
        }
        await this.updateAssessment()
      } catch (err) {
        console.error(err)
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async generateReassessQuestions() {
      if (this.reassessQuestions && this.reassessQuestions.length > 0) {
        return
      }
      this.isLoading = true
      this.loadingMessage = 'Formulating reassessment questions…'

      const content = [
        {
          type: 'text',
          text: JSON.stringify(
            {
              session_id: this.id || '1',
              diagnosis: this.diagnosis?.data || {},
              plan: this.lastPlan || {},
              goals: this.goals || [],
              max_questions: 4,
            },
            null,
            2,
          ),
        },
      ]
      this.reassessImages.forEach((img) => {
        if (img.openai_file_id) {
          content.push({
            type: 'image_id',
            file_id: img.openai_file_id,
          })
        } else {
          content.push({
            type: 'image',
            source: { type: 'base64', media_type: img.mediaType, data: img.base64 },
          })
        }
      })

      try {
        const raw = await this.callOpenAI({
          system: REASSESS_QUESTIONS_PROMPT,
          content: content,
          max_tokens: 2000,
          temperature: 0.3,
        })

        const res = this.parseJSON(raw)
        this.reassessQuestions = Array.isArray(res.dynamic_questions) ? res.dynamic_questions : []

        const answers = {}
        this.reassessQuestions.forEach((q) => {
          answers[q.question_id] = q.answer_type === 'multi_choice' ? [] : ''
        })
        this.reassessAnswers = answers
        await this.updateAssessment()
      } catch (err) {
        console.error(err)
        throw err
      } finally {
        this.isLoading = false
      }
    },
  },
})
