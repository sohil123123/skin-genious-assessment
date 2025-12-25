import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'

export const useAppointmentStore = defineStore('appointment', {
  state: () => ({
    appointments: [],
    INTERVAL_MINUTES: 15,
    selectedDate: null,
    loading: false,
    error: null,
  }),
  actions: {
    async getAppointments(clinic_id = null, therapist_id = null, date = null) {
      this.loading = true
      let url = `availability/slots?`

      if (clinic_id) url += `clinic_id=${clinic_id}`
      if (therapist_id) url += `&therapist_id=${therapist_id}`
      if (date) url += `&date=${date}`

      try {
        const res = await api.get(url)
        this.appointments = res.data.results.events
      } catch (error) {
        this.error = error
      } finally {
        this.loading = false
      }
    },
    async updateStatus(id, status) {
      this.loading = true
      try {
        const res = await api.patch(`/appointments/${id}`, { status })
        this.appointments = res.data.results.events
      } catch (error) {
        this.error = error
      } finally {
        this.loading = false
      }
    },
  },
  getters: {
    getAppointmentData(state) {
      return state.appointmentData
    },
    getLoading(state) {
      return state.loading
    },
    getError(state) {
      return state.error
    },
  },
})
