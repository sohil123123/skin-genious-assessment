import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'
import _ from 'lodash'
import { Loading, Notify, QSpinnerClock } from 'quasar'

export const useAppointmentStore = defineStore('appointment', {
  state: () => ({
    rawEvents: [],
    disabledDays: [],
    intervalStart: 32,
    intervalCount: 44,
    INTERVAL_MINUTES: 15,
    selectedDate: null,
    loading: false,
    error: null,
    warning: {},
    appointmentTypes: [
      { label: 'Consult', value: 'consult' },
      { label: 'Treatment', value: 'treatment' },
      { label: 'Express', value: 'express' },
    ],
    statusOptions: [
      { label: 'Pending', value: 'pending' },
      { label: 'Confirmed', value: 'confirmed' },
    ],
    serverError: null,
  }),
  getters: {
    /* ----------------------------------
     * LEAVE FULL DAY (DATES ONLY)
     * ---------------------------------- */
    leaveFullDayDates: (state) => {
      return _(state.rawEvents)
        .filter((e) => e.type === 'leave_full_day')
        .map((e) => e.start_date)
        .uniq()
        .value()
    },

    /* ----------------------------------
     * OTHER EVENTS (RESTRUCTURED)
     * ---------------------------------- */
    otherEvents: (state) => {
      return _(state.rawEvents)
        .filter((e) => e.type !== 'leave_full_day')
        .map((e) => ({
          id: e.id,
          title: e.title,
          date: e.start_date,
          time: e.start_time,
          duration: e.duration,
          type: e.type,
          status: e.status,
          bgcolor: e.bgcolor,
          meta: e.meta,
        }))
        .value()
    },
  },
  actions: {
    async getAppointments(
      clinic_id = null,
      therapist_id = null,
      start_date = null,
      end_date = null,
    ) {
      this.loading = true
      let url = `availability/slots?`

      if (clinic_id) url += `clinic_id=${clinic_id}`
      if (therapist_id) url += `&therapist_id=${therapist_id}`
      if (start_date && end_date) {
        url += `&from_date=${start_date}&to_date=${end_date}`
      }
      Loading.show({
        spinner: QSpinnerClock,
        message: 'Getting appointments...',
      })
      try {
        const res = await api.get(url)
        this.rawEvents = res.data.results
      } catch (error) {
        this.error = error
      } finally {
        this.loading = false
        Loading.hide()
      }
    },
    async storeAppointments(event) {
      let payload = {
        type: event.type,
        clinic_id: event.meta.clinic,
        therapist_id: event.meta.therapist,
        user_id: event.meta.client,
        assessment_id: event.assessment_id,
        treatment_session_id: event.treatment_session_id,
        start_datetime: `${event.date} ${event.time}`,
        end_datetime: `${event.date} ${this.addMinutesToTime(event.time, event.duration)}`,
        notes: event.notes || '',
        status: event.status,
      }

      try {
        const res = await api.post(`appointments`, payload)

        Notify.create({
          type: 'positive',
          message: res.data.message || 'Appointment updated successfully',
        })

        return true // ✅ SUCCESS
      } catch (error) {
        this.error = error
        this.serverError = error?.response?.data?.results || null
        this.showServerErrors(this.serverError)

        return false // ❌ FAILURE
      }
    },
    async addAppointment(event) {
      this.rawEvents.push({
        id: event.id,
        title: event.title,
        start_date: event.date,
        end_date: event.date,
        start_time: event.time,
        end_time: this.addMinutesToTime(event.time, event.duration),
        duration: event.duration,
        type: event.type,
        assessment_id: event.assessment_id,
        treatment_session_id: event.treatment_session_id,
        status: event.status,
        bgcolor: event.bgcolor,
        meta: event.meta,
      })

      const res = await this.storeAppointments(event)
      return res
    },
    async getAppointmentById(eventId) {
      this.loading = true
      Loading.show({
        spinner: QSpinnerClock,
        message: 'Getting appointment details...',
      })
      try {
        const res = await api.get(`appointments/${eventId}`)
        return res.data.results
      } catch (error) {
        this.error = error
      } finally {
        this.loading = false
        Loading.hide()
      }
    },
    async updateAppointment(event) {
      const payload = {
        type: event.type,
        clinic_id: event.meta.clinic,
        therapist_id: event.meta.therapist,
        user_id: event.meta.client,
        assessment_id: event.assessment_id,
        treatment_session_id: event.treatment_session_id,
        start_datetime: `${event.date} ${event.time}`,
        end_datetime: `${event.date} ${this.addMinutesToTime(event.time, event.duration)}`,
        notes: event.notes || '',
        status: event.status,
      }

      try {
        const res = await api.put(`appointments/${event.id}`, payload)

        Notify.create({
          type: 'positive',
          message: res.data.message || 'Appointment updated successfully',
        })

        return true // ✅ SUCCESS
      } catch (error) {
        this.error = error
        this.serverError = error?.response?.data?.results || null
        this.showServerErrors(this.serverError)

        return false // ❌ FAILURE
      }
    },
    deleteAppointment(eventId) {
      Loading.show({
        message: 'Deleting appointment...',
      })
      api
        .delete(`appointments/${eventId}`)
        .then((res) => {
          this.rawEvents = this.rawEvents.filter((e) => e.id !== eventId)
          Notify.create({
            type: 'positive',
            message: res.data.message || 'Appointment deleted successfully',
          })
          this.rawEvents = this.rawEvents.filter((e) => e.id !== eventId)
        })
        .catch((error) => {
          this.error = error
        })
        .finally(() => {
          Loading.hide()
        })
    },
    addMinutesToTime(time, minutes) {
      const [h, m] = time.split(':').map(Number)
      const total = h * 60 + m + minutes
      return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
    },
    convertToIST(utcString) {
      const date = new Date(utcString)

      return date
        .toLocaleString('sv-SE', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })
        .replace('T', ' ')
    },
    showServerErrors(errors) {
      Object.entries(errors).forEach(([field, messages]) => {
        if (!Array.isArray(messages)) return

        Notify.create({
          type: 'negative',
          position: 'top-right',
          message: `<b>${field.replace('_', ' ')}</b>: ${messages.join(' ')}`,
          html: true,
          timeout: 6000,
          actions: [{ icon: 'close', color: 'white', round: true }],
        })
      })
    },
  },
})
