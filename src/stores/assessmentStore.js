import { defineStore } from 'pinia'
import { Loading, Notify, LocalStorage } from 'quasar'
import { api } from 'src/boot/axios'
import { serialize } from 'object-to-formdata'

let user_id = LocalStorage.getItem('user_id') ? LocalStorage.getItem('user_id') : null

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
      medical_history: [],
      allergies: [],
      is_pregnant: 0,
      breastfeeding: 'no',
      diagnosis: null,
      parameters_with_abnormal_scores: null,
      treatment_plan_type: null,
      treatment_plan: null,
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
      medical_history: [],
      allergies: [],
      is_pregnant: 0,
      breastfeeding: 'no',
      diagnosis: null,
      parameters_with_abnormal_scores: null,
      treatment_plan_type: null,
      treatment_plan: null,
      therapist_notes: null,
      status: 'in_progress',
    },
  }),

  actions: {
    async getPatientData() {
      Loading.show({
        message: 'Getting patient data...',
      })
      await api
        .get(`/users/${user_id}`)
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

      api
        .post(`assessments/${this.assessmentData.id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        .then((response) => {
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
    setPatientData(data) {
      this.assessmentData.user_id = data.id
      this.assessmentData.name = data.first_name + ' ' + data.last_name
      this.assessmentData.gender = data.gender
    },
    setData(data) {
      this.assessmentData = { ...this.assessmentData, ...data }
    },
    async storeFaceImages(files) {
      const formData = new FormData()
      files.forEach((file) => {
        // check if real file exists
        const raw = file.__file || file
        if (raw instanceof File) {
          formData.append('images[]', raw)
        }
      })
      const response = await api
        .post(`assessments/${this.assessmentData.id}/images`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((res) => res.data)
        .catch((e) => {
          console.error('UPLOAD ERROR:', e.response?.data || e)
          Notify.create({
            type: 'negative',
            message: e.response?.data?.message || 'Upload failed',
          })
          return null
        })
      console.log(response)
      const images = response.results.images
      const urls = images.map((file) => file.url)
      return urls
    },
  },
})
