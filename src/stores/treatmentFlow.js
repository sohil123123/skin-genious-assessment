// src/stores/treatmentFlow.js
import { defineStore } from 'pinia'
import { useAssessmentStore } from './assessmentStore'

const assessmentStore = useAssessmentStore()

const STORAGE_KEY = 'treatment_flow_state_v1'

export const useTreatmentFlowStore = defineStore('treatmentFlow', {
  state: () => ({
    treatmentPlan: null, // entire API JSON
    loadedAt: null,
    // zero-based indexes internally but routes use 1-based session and step numbers
    currentSessionIndex: 0, // index into treatmentPlan.treatments
    currentStepIndex: 0, // index into session.steps
    status: 'idle', // 'idle'|'preparing'|'in_treatment'|'completed'
  }),
  getters: {
    sessions(state) {
      return state.treatmentPlan?.treatments ?? []
    },
    currentSession() {
      return this.sessions[this.currentSessionIndex] ?? null
    },
    currentStep() {
      return this.currentSession?.steps?.[this.currentStepIndex] ?? null
    },
    totalSteps() {
      return this.currentSession?.steps?.length ?? 0
    },
  },
  actions: {
    saveToLocal() {
      const payload = {
        treatmentPlan: this.treatmentPlan,
        loadedAt: this.loadedAt,
        currentSessionIndex: this.currentSessionIndex,
        currentStepIndex: this.currentStepIndex,
        status: this.status,
      }
      localStorage.setItem(
        `${STORAGE_KEY}_${assessmentStore.assessmentData.id}`,
        JSON.stringify(payload),
      )
    },
    loadFromLocal() {
      const raw = localStorage.getItem(`${STORAGE_KEY}_${assessmentStore.assessmentData.id}`)
      if (!raw) return false
      try {
        const p = JSON.parse(raw)
        this.treatmentPlan = p.treatmentPlan
        this.loadedAt = p.loadedAt
        this.currentSessionIndex = p.currentSessionIndex ?? 0
        this.currentStepIndex = p.currentStepIndex ?? 0
        this.status = p.status ?? 'idle'
        return true
      } catch (e) {
        console.warn('Failed to parse stored treatment state', e)
        return false
      }
    },
    setSessionByNumber(sessionNumber) {
      // sessionNumber is 1-based from API (session_number)
      const idx = this.sessions.findIndex((s) => s.session_number === Number(sessionNumber))
      if (idx >= 0) this.currentSessionIndex = idx
      else this.currentSessionIndex = Math.max(0, Number(sessionNumber) - 1) // fallback
      this.currentStepIndex = 0
      this.status = 'preparing'
      this.saveToLocal()
    },

    setStepByNumber(stepNumber) {
      this.currentStepIndex = Math.max(0, Number(stepNumber) - 1)
      this.status = 'in_treatment'
      this.saveToLocal()
    },

    nextStep() {
      if (this.currentStepIndex + 1 < this.totalSteps) {
        this.currentStepIndex++
        this.status = 'in_treatment'
      } else {
        this.status = 'completed'
      }
      this.saveToLocal()
    },

    prevStep() {
      if (this.currentStepIndex > 0) {
        this.currentStepIndex--
        this.status = 'in_treatment'
        this.saveToLocal()
      }
    },

    markCompleted() {
      this.status = 'completed'
      this.saveToLocal()
    },

    resetFlow() {
      this.currentSessionIndex = 0
      this.currentStepIndex = 0
      this.status = 'idle'
      // keep plan
      this.saveToLocal()
    },
  },
})
