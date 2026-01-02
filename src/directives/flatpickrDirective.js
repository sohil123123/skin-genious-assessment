import { nextTick, watch, toRef } from 'vue'
import flatpickr from 'flatpickr'
import 'flatpickr/dist/flatpickr.css'

export default {
  mounted(el, binding) {
    nextTick(() => {
      const input = el.querySelector('input')
      if (!input) return

      const modelValue = toRef(binding.instance, binding.arg)
      const options = binding.value || {}

      const instance = flatpickr(input, {
        ...options,

        /* 🔑 REQUIRED FOR QDialog */
        static: true,
        appendTo: el,
        disableMobile: true,

        defaultDate: modelValue.value || null,

        onChange(selectedDates) {
          modelValue.value = selectedDates[0] || null
        },
      })

      el.__flatpickr = instance

      /* sync external changes */
      watch(modelValue, (val) => {
        instance.setDate(val, false)
      })

      /* open on icon click */
      const icon = el.querySelector('.q-icon')
      if (icon) {
        icon.addEventListener('click', () => {
          instance.open()
          input.focus()
        })
      }
    })
  },

  beforeUnmount(el) {
    if (el.__flatpickr) {
      el.__flatpickr.destroy()
      delete el.__flatpickr
    }
  },
}
