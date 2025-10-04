import { defineStore } from 'pinia'

export const useCommonStore = defineStore('common', {
  state: () => ({
    error: null,
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
  },
})
