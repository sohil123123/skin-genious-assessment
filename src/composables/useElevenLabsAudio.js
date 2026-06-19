import { ref, onBeforeUnmount } from 'vue'
import { Notify } from 'quasar'
import config from 'src/config.js'

export function useElevenLabsAudio(options = {}) {
  const audioPlayer = new Audio()
  const audioStatus = ref('idle') // idle | loading | playing | paused | error
  const currentAudioUrl = ref(null)

  const cleanup = () => {
    audioPlayer.pause()
    if (currentAudioUrl.value) {
      URL.revokeObjectURL(currentAudioUrl.value)
      currentAudioUrl.value = null
    }
    audioStatus.value = 'idle'
  }

  const playAudio = () => {
    if (currentAudioUrl.value) {
      audioPlayer.play()
      audioStatus.value = 'playing'
    }
  }

  const pauseAudio = () => {
    audioPlayer.pause()
    audioStatus.value = 'paused'
  }

  const generateAndPlay = async (text) => {
    if (!text) {
      Notify.create({
        type: 'warning',
        message: 'Nothing to read',
      })
      return
    }

    try {
      audioStatus.value = 'loading'

      // Clean up previous audio if exists
      if (currentAudioUrl.value) {
        URL.revokeObjectURL(currentAudioUrl.value)
        currentAudioUrl.value = null
      }

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
      currentAudioUrl.value = URL.createObjectURL(blob)
      audioPlayer.src = currentAudioUrl.value

      await audioPlayer.play()
      audioStatus.value = 'playing'

      audioPlayer.onended = () => {
        audioStatus.value = 'paused'
        if (options.onEnded) options.onEnded()
      }

      // Handle errors during playback
      audioPlayer.onerror = (e) => {
        console.error('Audio playback error:', e)
        audioStatus.value = 'error'
        Notify.create({ type: 'negative', message: 'Error playing audio' })
      }
    } catch (err) {
      console.error(err)
      audioStatus.value = 'idle'
      Notify.create({ type: 'negative', message: err.message })
    }
  }

  const handleAudioAction = async (text) => {
    // Import commonStore dynamically to check global audio setting
    const { useCommonStore } = await import('src/stores/commonStore')
    const commonStore = useCommonStore()

    // Check if audio is globally disabled
    if (!commonStore.isAudioEnabled) {
      console.log('Audio is globally disabled')
      return
    }

    if (audioStatus.value === 'playing') {
      pauseAudio()
      return
    }

    if (audioStatus.value === 'paused' && currentAudioUrl.value) {
      playAudio()
      return
    }

    // if idle or no current audio, generate and play
    await generateAndPlay(text)
  }

  // Automating cleanup on unmount is good practice for composables handling resources
  onBeforeUnmount(() => {
    cleanup()
  })

  return {
    audioStatus,
    generateAndPlay,
    playAudio,
    pauseAudio,
    handleAudioAction,
    cleanup,
  }
}
