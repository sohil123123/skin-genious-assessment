import { defineStore } from 'pinia'
import { Loading, Notify, LocalStorage } from 'quasar'
import { api } from 'src/boot/axios'

let user_id = LocalStorage.getItem('user_id') ? LocalStorage.getItem('user_id') : null

export const useAssessmentStore = defineStore('assessment', {
  state: () => ({
    loading: false,
    assessmentData: {
      id: null,
      patient_id: null,
      name: null,
      age: null,
      gender: null,
      daily_sun_exposure_hours: null,
      social_event: null,
      upcoming_travel: null,
      medical_history: [],
      allergies: [],
      is_patient_pregnant: null,
      breastfeeding: null,
      diagnosis: null,
      parameters_with_abnormal_scores: null,
      treatment_plan_type: null,
      treatment_plan: null,
    },
    initialAssessmentData: {
      id: null,
      patient_id: null,
      name: null,
      age: null,
      gender: null,
      daily_sun_exposure_hours: null,
      social_event: null,
      upcoming_travel: null,
      medical_history: [],
      allergies: [],
      is_patient_pregnant: null,
      breastfeeding: null,
      diagnosis: null,
      parameters_with_abnormal_scores: null,
      treatment_plan_type: null,
      treatment_plan: null,
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
    setPatientData(data) {
      this.assessmentData.patient_id = data.id
      this.assessmentData.name = data.first_name + ' ' + data.last_name
      this.assessmentData.gender = data.gender
    },
  },
})
