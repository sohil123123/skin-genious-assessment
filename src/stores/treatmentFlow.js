// src/stores/treatmentFlow.js
import { defineStore } from 'pinia'
import { useAssessmentStore } from './assessmentStore'

const assessmentStore = useAssessmentStore()

const STORAGE_KEY = 'treatment_flow_state_v1'

export const useTreatmentFlowStore = defineStore('treatmentFlow', {
  state: () => ({
    treatmentPlan: null, // entire API JSON
    loadedAt: null,
    // NEW (ID based)
    currentSessionId: null,
    // KEEP step index (no step id yet)
    currentStepIndex: 0,
    status: 'idle', // 'idle'|'preparing'|'in_treatment'|'completed'
  }),
  getters: {
    sessions(state) {
      return state.treatmentPlan?.treatments ?? []
    },
    currentSessionIndex() {
      if (!this.currentSessionId) return 0
      return this.sessions.findIndex((s) => s.id === this.currentSessionId)
    },
    currentSession() {
      return this.sessions.find((s) => s.id === this.currentSessionId) ?? null
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
        currentSessionId: this.currentSessionId,
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

        // NEW
        this.currentSessionId = p.currentSessionId ?? null

        // BACKWARD SUPPORT
        if (!this.currentSessionId && typeof p.currentSessionIndex === 'number') {
          this.currentSessionId = this.sessions[p.currentSessionIndex]?.id ?? null
        }

        this.currentStepIndex = p.currentStepIndex ?? 0
        this.status = p.status ?? 'idle'
        return true
      } catch (e) {
        console.warn('Failed to parse stored treatment state', e)
        return false
      }
    },
    setSessionByNumber(sessionNumber) {
      const session = this.sessions.find((s) => s.session_number === Number(sessionNumber))

      if (session) {
        this.currentSessionId = session.id
      } else {
        // fallback to position
        const idx = Math.max(0, Number(sessionNumber) - 1)
        this.currentSessionId = this.sessions[idx]?.id ?? null
      }

      this.currentStepIndex = 0
      this.status = 'preparing'
      this.saveToLocal()
    },
    setSessionById(sessionId) {
      const session = this.sessions.find((s) => s.id === Number(sessionId))

      if (!session) {
        console.warn('Invalid sessionId:', sessionId)
        return
      }

      this.currentSessionId = session.id
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
      this.currentSessionId = this.sessions[0]?.id ?? null
      this.currentStepIndex = 0
      this.status = 'idle'
      this.saveToLocal()
    },
  },
})
