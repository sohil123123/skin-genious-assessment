<template>
  <q-input
    v-model="date"
    v-flatpickr:date="dateConfig"
    @update:model-value="update"
    ref="filedRef"
    :error="props.hasError"
    :borderless="borderless"
    :outlined="outlined"
    :dense="dense"
    :label-slot="label == '' ? false : true"
    :key="sequence"
    :disable="disable"
    :bottom-slots="bottom_slots"
    :class="class_name"
    no-error-icon
    readonly
  >
    <template v-slot:prepend>
      <q-icon name="schedule" />
    </template>
    <template v-if="clearable && date" v-slot:append>
      <q-btn icon="cancel" color="grey-6" flat round dense @click="clearFlatpickr"></q-btn>
    </template>

    <template v-if="label !== null" v-slot:label>
      {{ label }}
    </template>
    <template v-slot:error> Please provide Valid Date </template>
  </q-input>
</template>
<script setup>
import { watch, ref } from 'vue'
// import 'flatpickr/dist/themes/dark.css';

const emit = defineEmits(['update', 'clear'])
const props = defineProps({
  model: {
    required: true,
  },
  borderless: {
    required: false,
    default: true,
  },
  field: {
    required: true,
  },
  id: {
    default: '',
  },
  label: {
    required: true,
    default: null,
  },
  minDate: {
    required: false,
    default: null,
  },
  hasError: {
    type: Boolean,
    required: false,
    default: false,
  },
  clickOpens: {
    type: Boolean,
    required: false,
  },
  inline: {
    type: Boolean,
    required: false,
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
  outlined: {
    type: Boolean,
    default: false,
  },
  dense: {
    type: Boolean,
    default: false,
  },
  clearable: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: null,
  },
  disable: {
    type: Boolean,
    default: false,
  },
  class_name: {
    type: String,
    required: false,
    default: null,
  },
  bottom_slots: {
    type: Boolean,
    required: false,
    default: true,
  },
  minTime: {
    type: String,
    required: false,
    default: '08:00:00',
  },
  maxTime: {
    type: String,
    required: false,
    default: '21:00:00',
  },
})

const filedRef = ref(null)

// function adjustToNext15MinuteInterval(date) {
//   const currentMinutes = date.getMinutes()
//   const additionalMinutes = currentMinutes <= 15 ? 15 - currentMinutes : 60 - currentMinutes

//   // Adjust the date object by adding the calculated additional minutes
//   date.setMinutes(currentMinutes + additionalMinutes, 0, 0) // Reset seconds and milliseconds to 0

//   return date
// }
// const currentDate = new Date()
// const updatedDate = adjustToNext15MinuteInterval(currentDate)

const date = ref(null)
const flag = ref(true)
const dateConfig = ref({
  altFormat: 'd-m-Y H:i', // Display format
  dateFormat: 'Y-m-d H:i', // Actual value format
  altInput: true,
  allowInput: false,
  disableMobile: true,
  inline: false,
  clickOpens: !props.readOnly,
  flatpickrError: false,
  dense: props.dense,
  clearable: props.clearable,
  enableTime: true,
  defaultHour: 10,
  // minDate: updatedDate,
  minuteIncrement: 15,
  minTime: props.minTime || '08:00:00',
  maxTime: props.maxTime || '20:00:00',
  errorHandler: () => {
    // isError.value = true
  },
  onReady: (selectedDates, dateStr, instance) => {
    // Disable typing in time inputs
    const timeInputs = instance.calendarContainer.querySelectorAll(
      '.flatpickr-hour, .flatpickr-minute',
    )

    timeInputs.forEach((input) => {
      input.setAttribute('readonly', 'readonly')
      input.setAttribute('tabindex', '-1')
    })

    // Add an "OK" button to the Flatpickr calendar
    const okButton = document.createElement('button')
    okButton.innerText = 'OK'
    okButton.classList.add('flatpickr-ok-button')
    okButton.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      instance.close()
    })

    // Append the button to the calendar
    instance.calendarContainer.appendChild(okButton)
  },
})
const sequence = ref(1)

function update(d) {
  if (d !== '' && d !== null) {
    emit('update', d)
  }
}

// function handleInput(event) {
//   const d = event.target.value
//   if (flag.value && props.model !== null && d === '') {
//     dateConfig.value.flatpickrError = false
//     flag.value = false
//     emit('update', d)
//   }
// }

function clearFlatpickr() {
  emit('clear')
}

watch(
  () => props.model,
  (newVal, oldVal) => {
    date.value = props.model
    // NOTE: Below code to remount with sequence key when clear value.
    if (newVal === null && oldVal !== undefined && oldVal !== null) {
      flag.value = true
      sequence.value++
    }
  },
  {
    immediate: true,
  },
)
</script>
