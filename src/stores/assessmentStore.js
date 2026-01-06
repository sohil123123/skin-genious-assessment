import { defineStore } from 'pinia'
import { Loading, Notify } from 'quasar'
import { api } from 'src/boot/axios'
import { serialize } from 'object-to-formdata'
import { useCommonStore } from './commonStore'

// let user_id = LocalStorage.getItem('user_id') ? LocalStorage.getItem('user_id') : null

export const useAssessmentStore = defineStore('assessment', {
  state: () => ({
    loading: false,
    assessmentData: {
      id: null,
      user_id: null,
      name: null,
      age: null,
      gender: null,
      daily_sun_exposure_hours: null,
      social_event: 'no',
      upcoming_travel: 'no',
      skin_temp_for_head: null,
      skin_temp_for_cheeks: null,
      recent_peel_or_laser: 'no',
      retinol_used_last_night: 'no',
      medical_history: [],
      allergies: [],
      is_pregnant: 0,
      breastfeeding: 'no',
      diagnosis: null,
      parameters_with_abnormal_scores: null,
      selected_plan_type: null,
      treatment_plans: null,
      therapist_notes: null,
      status: 'in_progress',
    },
    initialAssessmentData: {
      id: null,
      user_id: null,
      name: null,
      age: null,
      gender: null,
      daily_sun_exposure_hours: null,
      social_event: 'no',
      upcoming_travel: 'no',
      skin_temp_for_head: null,
      skin_temp_for_cheeks: null,
      recent_peel_or_laser: 'no',
      retinol_used_last_night: 'no',
      medical_history: [],
      allergies: [],
      is_pregnant: 0,
      breastfeeding: 'no',
      diagnosis: null,
      parameters_with_abnormal_scores: null,
      selected_plan_type: null,
      treatment_plans: null,
      therapist_notes: null,
      status: 'in_progress',
    },
    treatment_session_id: null,
    showDialog: false,
  }),

  actions: {
    async getPatientData(uid) {
      Loading.show({
        message: 'Getting patient data...',
      })
      await api
        .get(`/users/${uid}`)
        .then((response) => {
          this.setPatientData(response.data.results)
          Loading.hide()
        })
        .catch((e) => {
          Loading.hide()
          console.log(e)
          Notify.create({
            type: 'negative',
            message: e.response.data.message,
          })
        })
    },
    async getSingleAssessment(assessment_id) {
      Loading.show({
        message: 'Getting assessment data...',
      })
      await api
        .get(`assessments/${assessment_id}`)
        .then(async (response) => {
          await this.setData(response.data.results)
          Loading.hide()
        })
        .catch((e) => {
          Loading.hide()
          console.log(e)
          Notify.create({
            type: 'negative',
            message: e.response.data.message,
          })
        })
    },
    async createNewAssessment() {
      Loading.show({
        message: 'Creating new assessment...',
      })
      await api
        .post(`/assessments`, this.assessmentData)
        .then((response) => {
          this.setData(response.data.results)
          Loading.hide()
        })
        .catch((e) => {
          Loading.hide()
          console.log(e)
          Notify.create({
            type: 'negative',
            message: e.response.data.message,
          })
        })
    },
    async updateAssessment(payload) {
      if (!this.assessmentData.id) return
      payload.user_id = this.assessmentData.user_id
      payload._method = 'PUT'
      const config = {
        indices: true,
        nullAsUndefined: true,
        transformRequest: [
          (data) =>
            serialize(data, {
              indices: true,
              noFilesWithArrayNotation: true,
              emptyArraysAsNull: false,
              allowEmptyArrays: true,
            }),
        ],
      }

      Object.keys(payload).forEach((key) => {
        if (Array.isArray(payload[key]) && payload[key].length === 0) {
          payload[key] = null
        }
      })

      const formData = serialize(payload, config)

      await api
        .post(`assessments/${this.assessmentData.id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        .then(async (response) => {
          this.assessmentData.images = response.data.results.images
          this.assessmentData.post_images = response.data.results.post_images
          this.assessmentData.conversation_id = response.data.results.conversation_id
          if (
            response.data.results.treatment_sessions &&
            response.data.results.treatment_sessions.treatments?.length > 0
          ) {
            this.treatment_session_id = response.data.results.treatment_sessions.treatments[0].id
            this.assessmentData.treatment_sessions = response.data.results.treatment_sessions
          }
        })
        .catch((e) => {
          console.log(e)
          // Notify.create({
          //   type: 'negative',
          //   message: e.response.data.message,
          // })
        })
    },

    setPatientData(data) {
      this.assessmentData.user_id = data.id
      this.assessmentData.name = data.first_name + ' ' + data.last_name
      this.assessmentData.gender = data.gender
      this.assessmentData.age = useCommonStore().getAgeFromDate(data.date_of_birth)
    },
    setData(data) {
      this.assessmentData = { ...this.assessmentData, ...data }
    },
    async storeFaceImages(file, assessment_type) {
      const formData = new FormData()
      // files.forEach((file) => {
      // check if real file exists
      const raw = file.__file || file
      if (raw instanceof File) {
        formData.append('image', raw)
      }
      // })
      formData.append('assessment_type', assessment_type)

      const response = await api
        .post(`assessments/${this.assessmentData.id}/images`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((res) => {
          if (assessment_type == 'post') {
            this.assessmentData.post_images = res.data.results.post_images
          } else {
            this.assessmentData.images = res.data.results.images
          }
          return res.data
        })
        .catch((e) => {
          console.error('UPLOAD ERROR:', e.response?.data || e)
          Notify.create({
            type: 'negative',
            message: e.response?.data?.message || 'Upload failed',
          })
          return null
        })
      const file_id = response.results.file_id
      return file_id
    },
    async updateTreatmentSessionId(appointmentId) {
      try {
        await api.post(`/appointments/update-treatment-session-id/${appointmentId}`, {
          assessment_id: this.assessmentData.id,
          treatment_session_id: this.treatment_session_id,
        })
        return true
      } catch (e) {
        console.log(e)
        return false
      }
    },
    initiateDialog() {
      this.showDialog = true
    },
    async bookNextAppointment(data, nextSessionId) {
      let payload = {
        type: 'treatment',
        clinic_id: this.assessmentData.clinic_id,
        user_id: this.assessmentData.user_id,
        therapist_id: this.assessmentData.therapist_id ?? 2,
        assessment_id: this.assessmentData.id,
        treatment_session_id: nextSessionId,
        appointment_datetime: data.datetime,
        notes: data.notes,
      }
      this.loading = true
      await api
        .post(`/appointments`, payload)
        .then((response) => {
          this.showDialog = false
          Notify.create({
            type: 'positive',
            message: response.data.message,
          })
        })
        .catch((e) => {
          console.log(e)
          Notify.create({
            type: 'negative',
            message: e.response.data.message,
          })
        })
        .finally(() => {
          this.loading = false
        })
    },
    async updateStatus(appointment_id) {
      await api
        .post(`/appointments/status/${appointment_id}`, {
          status: 'completed',
        })
        .then((response) => {
          this.showDialog = false
          console.log(response.data.message)
        })
        .catch((e) => {
          console.log(e)
          Notify.create({
            type: 'negative',
            message: e.response.data.message,
          })
        })
    },
  },
})
