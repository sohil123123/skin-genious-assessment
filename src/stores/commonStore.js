import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'

export const useCommonStore = defineStore('common', {
  state: () => ({
    error: null,
    clinics: [],
    therapiests: [],
  }),

  actions: {
    getPreviewUrl(file) {
      try {
        return URL.createObjectURL(file)
      } catch (error) {
        console.error('Error creating object URL:', error)
        return '' // Fallback to empty string if URL creation fails
      }
    },
    isImage(file) {
      return file.type.startsWith('image/')
    },
    getClinics() {
      api.get('get-clinics?is_dropdown=1').then((res) => {
        this.clinics = res.data.results
      })
    },
    getTherapiests(clinic_id) {
      api.get(`get-users?is_dropdown=1&role=therapist&clinic_id=${clinic_id}`).then((res) => {
        this.therapiests = res.data.results
      })
    },
  },
})
