<template>
  <div class="row q-col-gutter-sm">
    <!-- Date -->
    <div class="col-12 col-md-6">
      <q-input
        v-model="date"
        v-flatpickr:date="dateConfig"
        @update:model-value="onDateChange"
        ref="filedRef"
        :error="props.hasError"
        :borderless="borderless"
        :outlined="outlined"
        :dense="dense"
        :disable="disable"
        :class="class_name"
        no-error-icon
        readonly
      >
        <template v-slot:prepend>
          <q-icon name="event" />
        </template>

        <template v-if="label !== null" v-slot:label>
          {{ label }}
        </template>

        <template v-slot:error> Please provide Valid Date </template>
      </q-input>
    </div>

    <!-- Hour -->
    <div class="col-6 col-md-3">
      <q-select
        v-model="hour"
        :options="hourOptions"
        label="Hour"
        dense
        outlined
        emit-value
        map-options
        :disable="!date"
      />
    </div>

    <!-- Minute -->
    <div class="col-6 col-md-3">
      <q-select
        v-model="minute"
        :options="minuteOptions"
        label="Minute"
        dense
        outlined
        emit-value
        map-options
        :disable="!date"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const emit = defineEmits(['update', 'clear'])

const props = defineProps({
  model: { required: true },
  label: { default: null },
  minTime: { default: '08:00:00' },
  maxTime: { default: '21:00:00' },
  disable: Boolean,
  outlined: Boolean,
  dense: Boolean,
  borderless: { default: true },
  hasError: Boolean,
  class_name: String,
})

const filedRef = ref(null)
const date = ref(null)
const hour = ref(null)
const minute = ref(null)

/* ------------------------------
   Flatpickr (Date Only)
--------------------------------*/
const dateConfig = {
  altFormat: 'd-m-Y',
  dateFormat: 'Y-m-d',
  altInput: true,
  allowInput: false,
  disableMobile: true,
  enableTime: false, // ⛔ remove time picker
  clickOpens: true,
}

/* ------------------------------
   Time Logic
--------------------------------*/
const minHour = Number(props.minTime.split(':')[0])
const maxHour = Number(props.maxTime.split(':')[0])

const hourOptions = computed(() => {
  return Array.from({ length: maxHour - minHour + 1 }, (_, i) => {
    const h = minHour + i
    return { label: String(h).padStart(2, '0'), value: h }
  })
})

const minuteOptions = [
  { label: '00', value: 0 },
  { label: '15', value: 15 },
  { label: '30', value: 30 },
  { label: '45', value: 45 },
]

/* ------------------------------
   Emit Combined DateTime
--------------------------------*/
watch([date, hour, minute], () => {
  if (!date.value || hour.value === null || minute.value === null) return

  const h = String(hour.value).padStart(2, '0')
  const m = String(minute.value).padStart(2, '0')

  emit('update', `${date.value} ${h}:${m}`)
})

watch(
  () => props.model,
  (val) => {
    if (!val) return

    const [d, t] = val.split(' ')
    date.value = d

    if (t) {
      const [h, m] = t.split(':')
      hour.value = Number(h)
      minute.value = Number(m)
    }
  },
  { immediate: true },
)

function onDateChange(val) {
  date.value = val
}
</script>
