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
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  duration: { type: Number, default: 300 },
})

const emit = defineEmits(['finished', 'start'])

const elapsed = ref(0)
let interval = null
const running = ref(false)

// ---------------- TIMER LOGIC ----------------
// (Keep your existing timer logic as is)
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

// ---------------- IMPROVED VOICE CONTROL ----------------

const listening = ref(false)
const isSpeechSupported = ref(false)
const lastCommand = ref('')
const lastConfidence = ref(0)
const feedbackMessage = ref('')
const feedbackClass = ref('')
const debugMode = ref(false)
let recognition = null
let feedbackTimeout = null
let restartTimeout = null
let speechStartTimeout = null

// Wake word detection improved with fuzzy matching
const WAKE_WORDS = ['clinic ai', 'clinic eye', 'clinic i', 'clinic hey', 'clinic hi']

// Command patterns with better matching
const COMMAND_PATTERNS = {
  start: [/start(?: the)? timer/i, /begin(?: the)? timer/i, /start counting/i],
  pause: [
    /stop(?: the)? timer/i,
    /pause(?: the)? timer/i,
    /halt(?: the)? timer/i,
    /freeze(?: the)? timer/i,
  ],
  reset: [/reset(?: the)? timer/i, /clear(?: the)? timer/i],
  restart: [/restart(?: the)? timer/i, /start again/i, /begin again/i],
}

const voiceButtonLabel = computed(() => {
  return listening.value ? 'Stop Listening' : 'Enable Voice'
})

const voiceStatusMessage = computed(() => {
  if (!isSpeechSupported.value) return 'Voice not supported'
  return listening.value
    ? '🎤 Listening... (Say "Clinic AI" + command)'
    : '🎙️ Click to enable voice control'
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

// Improved wake word detection with fuzzy matching
function detectWakeWord(text) {
  const normalized = normalizeSpeech(text)

  // Check for exact matches first
  for (const wakeWord of WAKE_WORDS) {
    if (normalized.includes(wakeWord)) {
      return wakeWord
    }
  }

  // Fuzzy matching for slight variations
  const words = normalized.split(' ')
  for (let i = 0; i < words.length - 1; i++) {
    const potentialWake = `${words[i]} ${words[i + 1]}`
    for (const wakeWord of WAKE_WORDS) {
      // Calculate simple similarity
      if (similarity(potentialWake, wakeWord) > 0.7) {
        return wakeWord
      }
    }
  }

  return null
}

// Simple similarity function for fuzzy matching
function similarity(s1, s2) {
  const longer = s1.length > s2.length ? s1 : s2
  const shorter = s1.length > s2.length ? s2 : s1

  if (longer.length === 0) return 1.0

  return (longer.length - editDistance(longer, shorter)) / parseFloat(longer.length)
}

function editDistance(s1, s2) {
  s1 = s1.toLowerCase()
  s2 = s2.toLowerCase()

  const costs = []
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j
      } else if (j > 0) {
        let newValue = costs[j - 1]
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
        }
        costs[j - 1] = lastValue
        lastValue = newValue
      }
    }
    if (i > 0) costs[s2.length] = lastValue
  }
  return costs[s2.length]
}

let lastCommandTime = 0
const COMMAND_COOLDOWN = 1000 // 1 second cooldown between commands

function canExecuteCommand() {
  const now = Date.now()
  if (now - lastCommandTime < COMMAND_COOLDOWN) {
    log('Command cooldown active, skipping')
    return false
  }
  lastCommandTime = now
  return true
}

function log(step, data = '') {
  if (debugMode.value) {
    console.log(`🎙️ [VOICE] ${step}`, data)
  }
}

function handleVoiceCommand(rawText, confidence = 0.5, isFinal = true) {
  lastCommand.value = rawText
  lastConfidence.value = confidence

  log('Raw transcript:', rawText)

  if (!rawText || rawText.trim().length < 3) return

  // Only process final results to avoid multiple triggers
  if (!isFinal) return

  const text = normalizeSpeech(rawText)
  log('Normalized:', text)

  // Wake-word detection with fuzzy matching
  const detectedWakeWord = detectWakeWord(text)
  if (!detectedWakeWord) {
    if (debugMode.value) {
      log('No wake word detected')
      showFeedback(`Heard: "${rawText.substring(0, 30)}..."`, 'grey')
    }
    return
  }

  showFeedback(`Heard: "${rawText}"`, 'positive')
  log('✅ Wake word detected:', detectedWakeWord)

  // Extract command text (remove wake word)
  let actionText = text
  const wakeWordPattern = detectedWakeWord.replace(/\s+/g, '\\s+')
  const regex = new RegExp(wakeWordPattern, 'i')
  actionText = actionText.replace(regex, '').trim()

  log('Action text after wake word removal:', actionText)

  // If only wake word was said without command
  if (!actionText) {
    showFeedback('Command?', 'warning')
    return
  }

  // Command matching with patterns
  let commandMatched = false

  for (const [command, patterns] of Object.entries(COMMAND_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(actionText)) {
        executeCommand(command)
        commandMatched = true
        break
      }
    }
    if (commandMatched) break
  }

  if (!commandMatched) {
    log('❓ Command not recognized')
    showFeedback(`Try: "Clinic AI start timer"`, 'warning')
  }
}

function executeCommand(command) {
  if (!canExecuteCommand()) return

  log('Executing command:', command)

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

  // Visual feedback
  showFeedback(`✓ ${command.charAt(0).toUpperCase() + command.slice(1)}`, 'positive')
}

// Improved speech recognition restart mechanism
function restartRecognition() {
  if (!listening.value || !recognition) return

  try {
    log('Attempting to restart recognition...')
    recognition.stop()

    // Small delay before restarting
    clearTimeout(restartTimeout)
    restartTimeout = setTimeout(() => {
      if (listening.value && recognition) {
        try {
          recognition.start()
          log('Recognition restarted successfully')
        } catch (e) {
          log('Error restarting recognition:', e.message)
          // If we can't restart, try reinitializing
          setTimeout(() => initVoiceRecognition(), 1000)
        }
      }
    }, 300)
  } catch (e) {
    log('Error stopping recognition:', e.message)
  }
}

function initVoiceRecognition() {
  log('Initializing speech recognition')

  // Check for browser support
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) {
    console.error('SpeechRecognition not supported')
    isSpeechSupported.value = false
    showFeedback('Voice not supported in this browser', 'negative')
    return
  }

  isSpeechSupported.value = true

  // Clean up existing instance
  if (recognition) {
    try {
      recognition.stop()
      recognition = null
    } catch (e) {
      console.error('Error stopping recognition:', e.message)
      // Ignore errors during cleanup
    }
  }

  recognition = new SpeechRecognition()

  // Optimize for Indian English
  recognition.lang = 'en-IN'
  recognition.continuous = true
  recognition.interimResults = true
  recognition.maxAlternatives = 1 // Reduced for simpler processing

  // Set longer timeout for silence
  if (Object.prototype.hasOwnProperty.call(recognition, 'timeout')) {
    recognition.timeout = 30000 // 30 seconds of silence timeout
  }

  recognition.onstart = () => {
    listening.value = true
    log('Recognition STARTED 🎤')
    showFeedback('Voice control active!', 'positive')
  }

  recognition.onend = () => {
    log('Recognition ended')

    // Don't immediately restart - give a small delay
    if (listening.value) {
      log('Auto-restarting in 500ms...')
      setTimeout(() => {
        if (listening.value && recognition) {
          try {
            recognition.start()
          } catch (e) {
            log('Auto-restart failed, will retry:', e.message)
            // If auto-restart fails, try again after longer delay
            setTimeout(restartRecognition, 2000)
          }
        }
      }, 500)
    }
  }

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error)

    // Don't show network/no-speech errors to user
    const silentErrors = ['no-speech', 'network', 'aborted']

    if (!silentErrors.includes(event.error)) {
      showFeedback(`Voice error: ${event.error}`, 'negative')
    }

    // Handle permission errors
    if (['not-allowed', 'permission-denied'].includes(event.error)) {
      listening.value = false
      showFeedback('Microphone access denied', 'negative')
      return
    }

    // For other errors, attempt to restart
    if (listening.value) {
      log('Error occurred, attempting restart...')
      setTimeout(restartRecognition, 1000)
    }
  }

  recognition.onresult = (event) => {
    let finalTranscript = ''
    let interimTranscript = ''
    let highestConfidence = 0

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript
      const confidence = event.results[i][0].confidence || 0.1
      const isFinal = event.results[i].isFinal

      if (isFinal) {
        finalTranscript += transcript
        if (confidence > highestConfidence) highestConfidence = confidence
      } else {
        interimTranscript += transcript
      }
    }

    // Process final results
    if (finalTranscript) {
      handleVoiceCommand(finalTranscript, highestConfidence, true)
    }

    // Show interim results in debug mode
    if (debugMode.value && interimTranscript) {
      log('Interim:', interimTranscript)
    }
  }

  // Start with a delay to ensure proper initialization
  clearTimeout(speechStartTimeout)
  speechStartTimeout = setTimeout(() => {
    try {
      recognition.start()
      log('Recognition started successfully')
    } catch (error) {
      console.error('Failed to start recognition:', error)
      listening.value = false

      // If start fails, try again once
      if (error.message.includes('already started')) {
        setTimeout(restartRecognition, 1000)
      } else {
        showFeedback('Failed to start voice recognition', 'negative')
      }
    }
  }, 100)
}

function toggleVoiceRecognition() {
  if (listening.value) {
    // Stop listening completely
    listening.value = false
    if (recognition) {
      try {
        recognition.stop()
      } catch (e) {
        console.error('Error stopping recognition:', e.message)
        // Ignore stop errors
      }
      recognition = null
    }
    showFeedback('Voice control disabled', 'info')
  } else {
    // Start listening
    listening.value = true
    initVoiceRecognition()
  }
}

// ---------------- LIFECYCLE ----------------

onMounted(() => {
  log('Component mounted')

  // Check for speech support immediately
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  isSpeechSupported.value = !!SpeechRecognition

  if (!isSpeechSupported.value) {
    showFeedback('Voice control not available', 'warning')
    return
  }

  // Request microphone permission proactively
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => {
        log('Microphone permission granted')
        // Initialize voice recognition after permission
        setTimeout(() => {
          if (isSpeechSupported.value) {
            initVoiceRecognition()
          }
        }, 500)
      })
      .catch((error) => {
        console.warn('Microphone permission not granted:', error)
        showFeedback('Allow microphone for voice control', 'warning')
        // Still try to initialize - some browsers allow speech without getUserMedia
        setTimeout(() => {
          if (isSpeechSupported.value) {
            initVoiceRecognition()
          }
        }, 1000)
      })
  } else {
    // Fallback: initialize without permission check
    setTimeout(() => {
      if (isSpeechSupported.value) {
        initVoiceRecognition()
      }
    }, 1000)
  }
})

onBeforeUnmount(() => {
  listening.value = false

  if (recognition) {
    try {
      recognition.stop()
    } catch (e) {
      console.error('Error stopping recognition:', e.message)
      // Ignore errors during cleanup
    }
    recognition = null
  }

  clearTimeout(feedbackTimeout)
  clearTimeout(restartTimeout)
  clearTimeout(speechStartTimeout)

  if (interval) {
    clearInterval(interval)
    interval = null
  }
})

// Watch for listening state changes to ensure proper cleanup
watch(listening, (newVal) => {
  if (!newVal && recognition) {
    try {
      recognition.stop()
    } catch (e) {
      console.error('Error stopping recognition:', e.message)
      // Ignore
    }
  }
})

// Expose for parent
defineExpose({
  startTimer,
  pauseTimer,
  resetTimer,
  restartTimer,
})
</script>
