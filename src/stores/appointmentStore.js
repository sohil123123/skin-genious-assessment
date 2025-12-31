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
    appointmentTypes: [
      { label: 'Consult', value: 'consult' },
      { label: 'Treatment', value: 'treatment' },
      { label: 'Express', value: 'express' },
    ],
    statusOptions: [
      { label: 'Pending', value: 'pending' },
      { label: 'Confirmed', value: 'confirmed' },
    ],
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
        start_datetime: `${event.date} ${event.time}`,
        end_datetime: `${event.date} ${this.addMinutesToTime(event.time, event.duration)}`,
        notes: event.notes || '',
        status: event.status,
      }

      try {
        await api.post('appointments', payload).then((res) => {
          Notify.create({
            type: 'positive',
            message: res.data.message || 'Appointment booked successfully',
          })
        })
      } catch (error) {
        this.error = error
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
        status: event.status,
        bgcolor: event.bgcolor,
        meta: event.meta,
      })

      await this.storeAppointments(event)
    },
    deleteAppointment(eventId) {
      this.rawEvents = this.rawEvents.filter((e) => e.id !== eventId)
    },
    addMinutesToTime(time, minutes) {
      const [h, m] = time.split(':').map(Number)
      const total = h * 60 + m + minutes
      return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
    },
  },
})
