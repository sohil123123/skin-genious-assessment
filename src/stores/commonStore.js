import { defineStore } from 'pinia'
import { Loading } from 'quasar'
import { api } from 'src/boot/axios'

export const useCommonStore = defineStore('common', {
  state: () => ({
    error: null,
    clinics: [],
    therapiests: [],
    clients: [],
    initialClients: [],
    // Audio settings - persisted to localStorage
    isAudioEnabled: localStorage.getItem('audioEnabled') !== 'false', // Default to true
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
    async getClinics() {
      Loading.show({
        message: 'Getting clinics...',
      })
      await api.get('get-clinics').then((res) => {
        this.clinics = res.data.results
      })
      Loading.hide()
    },
    async getTherapiests(clinic_id) {
      Loading.show({
        message: 'Getting therapists...',
      })
      await api.get(`get-users?is_dropdown=1&role=therapist&clinic_id=${clinic_id}`).then((res) => {
        this.therapiests = res.data.results
      })
      Loading.hide()
    },
    async getClients(clinic_id) {
      Loading.show({
        message: 'Getting clients...',
      })
      await api.get(`get-users?is_dropdown=1&role=client&clinic_id=${clinic_id}`).then((res) => {
        this.clients = res.data.results
        this.initialClients = res.data.results
      })
      Loading.hide()
    },
    filterClients(val, update) {
      if (val === '') {
        update(() => {
          this.clients = this.initialClients
        })
        return
      }
      update(() => {
        const needle = val.toLowerCase()
        this.clients = this.initialClients.filter((v) => v.label.toLowerCase().indexOf(needle) > -1)
      })
    },
    addMinutes(dateTime) {
      const d = new Date(dateTime)
      d.setMinutes(d.getMinutes() + 15)
      return (
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ` +
        `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      )
    },
    /**
     * Get age in years from date of birth
     * @param {string} dob - Date string in YYYY-MM-DD format
     * @returns {number|null} age in years or null if invalid
     */
    getAgeFromDate(dob) {
      if (!dob) return null

      const birthDate = new Date(dob)
      if (isNaN(birthDate.getTime())) return null

      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()

      const hasBirthdayPassed =
        today.getMonth() > birthDate.getMonth() ||
        (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate())

      if (!hasBirthdayPassed) {
        age--
      }

      return age
    },
    /**
     * Toggle global audio on/off
     */
    toggleAudio() {
      this.isAudioEnabled = !this.isAudioEnabled
      localStorage.setItem('audioEnabled', this.isAudioEnabled.toString())
    },
  },
})
