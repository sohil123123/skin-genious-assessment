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

    <!-- Voice status & feedback -->
    <div class="text-caption q-mt-md" :class="voiceStatusClass">🎙️ {{ voiceStatusMessage }}</div>

    <!-- Last command heard -->
    <div v-if="lastCommand" class="text-caption text-grey-7 q-mt-xs">
      Heard: "{{ lastCommand }}"
    </div>

    <!-- Feedback messages -->
    <div v-if="feedbackMessage" class="text-caption q-mt-xs" :class="feedbackClass">
      {{ feedbackMessage }}
    </div>

    <!-- Browser support check -->
    <div v-if="!isSpeechSupported" class="text-negative q-mt-xs">
      ⚠️ Voice control not supported in this browser
    </div>

    <!-- Enable button if needed -->
    <q-btn
      v-if="!listening && isSpeechSupported"
      color="green"
      size="sm"
      rounded
      :label="voiceButtonLabel"
      @click="toggleVoiceRecognition"
      class="q-mt-sm"
    />

    <!-- Debug mode toggle (optional) -->
    <q-toggle v-model="debugMode" label="Debug Mode" size="xs" class="q-mt-sm" />

    <!-- Confidence indicator -->
    <div v-if="debugMode && lastConfidence" class="text-caption text-grey q-mt-xs">
      Confidence: {{ (lastConfidence * 100).toFixed(1) }}%
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  duration: { type: Number, default: 300 },
})

const emit = defineEmits(['finished', 'start'])

const elapsed = ref(0)
let interval = null
const running = ref(false)

// ---------------- TIMER LOGIC ----------------

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

function startTimer() {
  if (interval) return
  running.value = true
  emit('start')
  showFeedback('Timer started!', 'positive')
  interval = setInterval(() => {
    if (elapsed.value < props.duration) {
      elapsed.value++
    } else {
      clearInterval(interval)
      interval = null
      running.value = false
      emit('finished')
      showFeedback('Timer finished!', 'positive')
    }
  }, 1000)
}

function pauseTimer() {
  running.value = false
  clearInterval(interval)
  interval = null
  showFeedback('Timer paused', 'warning')
}

function resetTimer() {
  pauseTimer()
  elapsed.value = 0
  showFeedback('Timer reset', 'info')
}

function restartTimer() {
  resetTimer()
  startTimer()
}

function restart() {
  restartTimer()
}

// ---------------- VOICE CONTROL ----------------

const listening = ref(false)
const isSpeechSupported = ref(false)
const lastCommand = ref('')
const lastConfidence = ref(0)
const feedbackMessage = ref('')
const feedbackClass = ref('')
const debugMode = ref(false)
let recognition = null
let feedbackTimeout = null

// Expanded wake word patterns for Indian English
const WAKE_WORD_PATTERNS = [
  // Original patterns
  'hey clinic ai',
  'hey clinical ai',
  'hey clinic i',
  'hey clinic a i',
  'hey cleanic ai',
  'hey a clinic ai',
  'hello clinic ai',
  'hi clinic ai',

  // Indian English variations
  'clinic ai',
  'clinical ai',
  'clinic eye',
  'clinical eye',
  'clean tick ai',
  'clean tick i',

  // Without "hey"
  'clinic ai start',
  'clinical ai start',
  'clinic ai pause',
  'clinical ai pause',

  // Common mispronunciations
  'clinic aye',
  'clinical aye',
  'kleen tick ai',
  'kleen tick i',
]

// Common Indian English command variations
const COMMAND_VARIANTS = {
  start: ['start', 'begin', 'resume', 'play', 'go', 'shuru', 'shuru karo'],
  pause: ['pause', 'stop', 'hold', 'wait', 'ruk', 'ruk jao', 'band'],
  reset: ['reset', 'clear', 'fresh', 'new', 'dubara', 'phir se'],
  restart: ['restart', 'again', 'restart karo', 'phir shuru'],
}

const voiceButtonLabel = computed(() => {
  return listening.value ? 'Stop Listening' : 'Enable Voice'
})

const voiceStatusMessage = computed(() => {
  if (!isSpeechSupported.value) return 'Voice not supported'
  return listening.value
    ? '🎤 Listening... (Say "Clinic AI" + command)'
    : '🎙️ Click to enable voice'
})

const voiceStatusClass = computed(() => {
  return listening.value ? 'text-positive' : 'text-grey'
})

function showFeedback(message, type = 'info') {
  feedbackMessage.value = message
  feedbackClass.value = `text-${type}`

  clearTimeout(feedbackTimeout)
  feedbackTimeout = setTimeout(() => {
    feedbackMessage.value = ''
  }, 3000)
}

function normalizeSpeech(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // remove punctuation
    .replace(/\s+/g, ' ') // collapse spaces
    .trim()
}

function hasWakeWord(text) {
  return text.includes('clinic ai') || text.includes('clinical ai') || text.includes('cleanic ai')
}

let lastCommandTime = 0

function canExecuteCommand() {
  const now = Date.now()
  if (now - lastCommandTime < 1500) return false
  lastCommandTime = now
  return true
}

// Levenshtein distance for fuzzy matching
function levenshteinDistance(a, b) {
  const matrix = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

function log(step, data = '') {
  if (debugMode.value) {
    console.log(`🎙️ [VOICE] ${step}`, data)
  }
}

function handleVoiceCommand(rawText, confidence = 0.5) {
  lastCommand.value = rawText
  lastConfidence.value = confidence

  log('Raw transcript:', rawText)

  if (!rawText) return

  const text = normalizeSpeech(rawText)
  log('Normalized:', text)

  // 1️⃣ Wake-word detection
  if (!hasWakeWord(text)) {
    if (debugMode.value) {
      showFeedback(`Heard: "${rawText}" (No wake word)`, 'grey')
    }
    return
  }

  showFeedback(`Heard: "${rawText}"`, 'positive')
  console.log('✅ Wake word detected')

  // 2️⃣ Extract command (remove wake words)
  let actionText = text
  WAKE_WORD_PATTERNS.forEach((pattern) => {
    const patternWords = pattern.split(' ')
    patternWords.forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi')
      actionText = actionText.replace(regex, '')
    })
  })

  actionText = actionText.trim()
  log('Action text:', actionText)

  // 3️⃣ Fuzzy command matching
  let commandMatched = false

  // Check each command category
  for (const [command, variants] of Object.entries(COMMAND_VARIANTS)) {
    for (const variant of variants) {
      // Check exact match
      if (actionText.includes(variant)) {
        executeCommand(command)
        commandMatched = true
        break
      }

      // Check fuzzy match for Indian pronunciations
      const words = actionText.split(' ')
      for (const word of words) {
        if (levenshteinDistance(variant, word) <= 2) {
          // Allow 2 character differences
          executeCommand(command)
          commandMatched = true
          break
        }
      }

      if (commandMatched) break
    }
    if (commandMatched) break
  }

  // If no match, try direct keyword matching
  if (!commandMatched) {
    if (/(start|begin|resume|play|go)/i.test(actionText)) {
      executeCommand('start')
    } else if (/(pause|stop|hold|wait)/i.test(actionText)) {
      executeCommand('pause')
    } else if (/(reset|clear|fresh)/i.test(actionText)) {
      executeCommand('reset')
    } else if (/(restart|again)/i.test(actionText)) {
      executeCommand('restart')
    } else {
      console.log('❓ Command not recognized')
      showFeedback('Command not recognized. Try: start, pause, reset, restart', 'warning')
    }
  }
}

function executeCommand(command) {
  if (!canExecuteCommand()) return

  switch (command) {
    case 'start':
      startTimer()
      break
    case 'pause':
      pauseTimer()
      break
    case 'reset':
      resetTimer()
      break
    case 'restart':
      restartTimer()
      break
  }
}

function initVoiceRecognition() {
  log('Initializing speech recognition')

  // Check for browser support
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    console.error('SpeechRecognition not supported')
    isSpeechSupported.value = false
    showFeedback('Voice not supported in this browser', 'negative')
    return
  }

  isSpeechSupported.value = true

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

  recognition = new SpeechRecognition()

  // Optimize for Indian English
  recognition.lang = 'en-IN' // Indian English
  recognition.continuous = true
  recognition.maxAlternatives = 3 // Get multiple alternatives for better accuracy
  recognition.interimResults = true

  recognition.onstart = () => {
    listening.value = true
    log('Recognition STARTED 🎤')
    showFeedback('Voice control activated!', 'positive')
  }

  recognition.onend = () => {
    listening.value = false
    console.log('🎙️ Recognition ended')
  }

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error)
    listening.value = false

    // Handle specific errors
    switch (event.error) {
      case 'not-allowed':
      case 'permission-denied':
        console.error('Microphone permission denied')
        showFeedback('Please allow microphone access', 'negative')
        recognition = null
        break
      case 'no-speech':
        log('No speech detected')
        break
      case 'audio-capture':
        console.error('No microphone found')
        showFeedback('No microphone detected', 'negative')
        break
      default:
        console.error('Speech recognition error:', event.error)
    }
  }

  recognition.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript
      const confidence = event.results[i][0].confidence || 0.5
      const isFinal = event.results[i].isFinal

      // ✅ Process BOTH interim & final
      handleVoiceCommand(transcript, confidence)

      // Optional: stop listening once a valid command fires
      if (isFinal) break
    }
  }

  try {
    recognition.start()
    log('Recognition started successfully')
  } catch (error) {
    console.error('Failed to start recognition:', error)
    listening.value = false
    showFeedback('Failed to start voice recognition', 'negative')
  }
}

function toggleVoiceRecognition() {
  if (listening.value) {
    // Stop listening
    if (recognition) {
      recognition.stop()
      recognition = null
    }
    listening.value = false
    showFeedback('Voice control disabled', 'info')
  } else {
    // Start listening
    initVoiceRecognition()
  }
}

// ---------------- LIFECYCLE ----------------

onMounted(() => {
  log('Component mounted')

  // Request microphone permission proactively
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => {
        log('Microphone permission granted')
        // Initialize voice after permission
        setTimeout(() => {
          initVoiceRecognition()
        }, 500)
      })
      .catch((error) => {
        console.warn('Microphone permission not granted:', error)
        showFeedback('Allow microphone for voice control', 'warning')
      })
  } else {
    // Fallback: initialize without permission check
    setTimeout(() => {
      initVoiceRecognition()
    }, 1000)
  }
})

onBeforeUnmount(() => {
  if (recognition) {
    recognition.stop()
    recognition = null
  }
  clearTimeout(feedbackTimeout)
})

// Expose for parent
defineExpose({
  startTimer,
  pauseTimer,
  resetTimer,
  restartTimer,
})
</script>
