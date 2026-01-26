<template>
  <div class="flex column items-center q-pa-md">
    <q-knob
      v-model="reverseProgress"
      :min="0"
      :max="duration"
      size="160px"
      color="primary"
      track-color="grey-4"
      show-value
      readonly
    >
      <template #default>
        <div class="text-h4 text-weight-bold">{{ formattedTime }}</div>
      </template>
    </q-knob>

    <div class="row q-mt-md q-gutter-sm">
      <q-btn color="primary" rounded label="Start" @click="startTimer" :disable="running" />
      <q-btn color="orange" rounded label="Pause" @click="pauseTimer" :disable="!running" />
    </div>

    <div class="row q-mt-sm q-gutter-sm">
      <q-btn flat color="negative" rounded label="Reset" @click="resetTimer" />
      <q-btn outline color="secondary" rounded label="Restart" @click="restart" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  duration: { type: Number, default: 300 },
})

const emit = defineEmits(['finished', 'start'])

const elapsed = ref(0)
let interval = null
const running = ref(false)

// Reverse knob fill
const reverseProgress = computed({
  get() {
    return props.duration - elapsed.value
  },
  set(v) {
    elapsed.value = props.duration - v
  },
})

const formattedTime = computed(() => {
  const remaining = props.duration - elapsed.value
  const m = Math.floor(remaining / 60)
  const s = remaining % 60
  return `${m}:${s < 10 ? '0' + s : s}`
})

// ---------------- TIMER CONTROL ----------------

function startTimer() {
  if (interval) return // prevent multiple intervals
  running.value = true
  emit('start')
  interval = setInterval(() => {
    if (elapsed.value < props.duration) {
      elapsed.value++
    } else {
      clearInterval(interval)
      interval = null
      emit('finished')
    }
  }, 1000)
}

function pauseTimer() {
  running.value = false
  clearInterval(interval)
  interval = null
}

function resetTimer() {
  pauseTimer()
  elapsed.value = 0
}

function restartTimer() {
  pauseTimer()
  elapsed.value = 0
  running.value = false
}

function restart() {
  resetTimer()
  startTimer()
}

// Expose to parent
defineExpose({
  startTimer,
  pauseTimer,
  resetTimer,
  restartTimer,
})
</script>
