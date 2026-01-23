<template>
  <q-page class="flex flex-center">
    <h2>Eleven Labs TTS</h2>
    <q-page-sticky position="bottom-right" :offset="fabPos">
      <q-fab
        v-model="fabOpened"
        icon="keyboard_arrow_up"
        direction="up"
        color="accent"
        persistent
        :disable="draggingFab || audioStatus === 'loading'"
        v-touch-pan.prevent.mouse="moveFab"
      >
        <q-fab-action
          @click="handleAudioAction"
          external-label
          label-position="left"
          :color="audioStatus === 'playing' ? 'negative' : 'positive'"
          :icon="audioStatus === 'playing' ? 'pause' : 'play_arrow'"
          :loading="audioStatus === 'loading'"
        >
          <template #label>
            {{ audioStatus === 'playing' ? 'Pause Audio' : 'Play Audio' }}
          </template>
        </q-fab-action>
      </q-fab>
    </q-page-sticky>
  </q-page>
</template>
<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { Notify } from 'quasar'
import config from 'src/config'

const audioPlayer = new Audio() // hidden audio
const audioStatus = ref('idle') // idle | loading | playing | paused

let currentAudioUrl = null
const fabPos = ref([18, 18])
const draggingFab = ref(false)
const fabOpened = ref(false)

/* =========================
   Public FAB handler
========================= */
async function handleAudioAction() {
  if (audioStatus.value === 'playing') {
    pauseAudio()
    return
  }

  if (audioStatus.value === 'paused') {
    playAudio()
    return
  }

  // idle → generate + play
  await generateAndPlay()
}

/* =========================
   Generate + Autoplay
========================= */
async function generateAndPlay() {
  fabOpened.value = true
  const text = buildDiagnosisText() // 👈 important

  if (!text) {
    Notify.create({
      type: 'warning',
      message: 'Nothing to read',
    })
    return
  }

  audioStatus.value = 'loading'

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${config.ELEVENLAB_VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          Accept: 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLAB_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: config.ELEVENLAB_MODEL,
          voice_settings: {
            stability: config.ELEVENLAB_STABILITY,
            similarity_boost: config.ELEVENLAB_SIMILARITY,
            style: config.ELEVENLAB_STYLE,
            use_speaker_boost: config.ELEVENLAB_BOOST,
          },
        }),
      },
    )

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err?.detail?.message || 'Audio generation failed')
    }

    const blob = await response.blob()

    if (currentAudioUrl) {
      URL.revokeObjectURL(currentAudioUrl)
    }

    currentAudioUrl = URL.createObjectURL(blob)
    audioPlayer.src = currentAudioUrl

    await audioPlayer.play()
    audioStatus.value = 'playing'

    audioPlayer.onended = () => {
      audioStatus.value = 'paused'
      fabOpened.value = true
    }
  } catch (err) {
    console.error(err)
    audioStatus.value = 'idle'
    Notify.create({ type: 'negative', message: err.message })
  }
}

/* =========================
   Controls
========================= */
function playAudio() {
  audioPlayer.play()
  audioStatus.value = 'playing'
  fabOpened.value = true
}

function pauseAudio() {
  audioPlayer.pause()
  audioStatus.value = 'paused'
  fabOpened.value = true
}

/* =========================
   Cleanup
========================= */
onBeforeUnmount(() => {
  audioPlayer.pause()
  if (currentAudioUrl) {
    URL.revokeObjectURL(currentAudioUrl)
  }
})

/* =========================
   Build readable diagnosis text
========================= */
function buildDiagnosisText() {
  // Example — customize this
  return `
Skin type classification: Combination skin.

Higher sebaceous activity in the T-zone with balanced cheeks.
Routine and environmental factors may cause uneven hydration.
`
}

function moveFab(ev) {
  draggingFab.value = ev.isFirst !== true && ev.isFinal !== true

  fabPos.value = [fabPos.value[0] - ev.delta.x, fabPos.value[1] - ev.delta.y]
}
</script>
