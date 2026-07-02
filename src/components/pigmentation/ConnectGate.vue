<template>
  <div class="gate">
    <div class="gate-card">
      <div class="gate-brand">
        <div class="glyph"></div>
        <div class="nm">AI Aesthetics <span>· Pigment Co-Pilot</span></div>
      </div>
      <h2 class="serif">Connect to begin</h2>
      <p>
        Enter your Anthropic API key to run live plan generation for this session. Plans are
        AI-proposed and reviewed by the treating dermatologist before any patient use.
      </p>

      <label for="apiKeyInput">Anthropic API key</label>
      <input
        id="apiKeyInput"
        type="password"
        v-model="inputKey"
        placeholder="sk-ant-..."
        autocomplete="off"
        spellcheck="false"
      />

      <label for="modelSelect">Model</label>
      <select id="modelSelect" v-model="selectedModel">
        <option value="claude-opus-4-8">Claude Opus 4.8 — best clinical reasoning</option>
        <option value="claude-sonnet-4-6">Claude Sonnet 4.6 — faster, lower cost</option>
      </select>

      <div class="gate-actions">
        <button
          class="btn"
          @click="testConnection"
          :disabled="testing || inputKey.trim().length < 10"
        >
          {{ testing ? 'Testing...' : 'Test connection' }}
        </button>
        <button
          class="btn btn-primary"
          @click="startConnect"
          :disabled="inputKey.trim().length < 10"
        >
          Start →
        </button>
      </div>

      <div v-if="statusMsg" :class="['gate-msg show', statusType]">
        {{ statusMsg }}
      </div>

      <div class="gate-or"><span>or</span></div>
      <button class="btn btn-demo btn-block" @click="startOfflineDemo">
        ▶ Explore offline demo — no API key
      </button>

      <div class="gate-note demo">
        <b>Demo mode</b> runs the whole flow — capture, AI read, dynamic history, the dermoscopy
        request, diagnosis + scores, plan + goals, and reassessment — on a built-in sample case,
        with no network calls and no key. All figures are illustrative, for showing the workflow.
      </div>

      <div class="gate-note">
        <b>Held in memory only.</b> Your key is never saved, logged, or sent anywhere except
        Anthropic, and it clears when you close this tab. For a pilot, use a key with a spend limit
        and rotate it afterwards — this bring-your-own-key setup is for internal,
        clinician-supervised testing, not production.
      </div>

      <div class="gate-note warn">
        <b>Clinical use.</b> Every plan must be reviewed and approved by the treating dermatologist
        before it reaches a patient. Obtain patient consent for AI-assisted assessment. Use patient
        initials, not full names.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { usePigmentationStore } from 'src/stores/pigmentationStore'

const store = usePigmentationStore()

const inputKey = ref(store.apiKey || '')
const selectedModel = ref(store.model || 'claude-opus-4-8')
const testing = ref(false)
const statusMsg = ref('')
const statusType = ref('')

const testConnection = async () => {
  if (inputKey.value.trim().length < 10) {
    statusMsg.value = 'Enter a key first.'
    statusType.value = 'err'
    return
  }

  testing.value = true
  statusMsg.value = 'Testing connection…'
  statusType.value = 'load'

  // Set key temporarily to test
  store.apiKey = inputKey.value.trim()
  store.model = selectedModel.value

  try {
    const out = await store.callClaude({
      system: 'Reply with the single word OK.',
      content: 'ping',
      max_tokens: 5,
      temperature: 0,
    })

    if (/ok/i.test(out)) {
      statusMsg.value = 'Connection works. You can start.'
      statusType.value = 'ok'
    } else {
      statusMsg.value = 'Connected. You can start.'
      statusType.value = 'ok'
    }
  } catch (err) {
    statusMsg.value = err.message || 'Connection failed.'
    statusType.value = 'err'
  } finally {
    testing.value = false
  }
}

const startConnect = () => {
  const k = inputKey.value.trim()
  if (k.length < 10) {
    statusMsg.value = 'Enter a valid key.'
    statusType.value = 'err'
    return
  }
  store.apiKey = k
  store.model = selectedModel.value
  store.isConnected = true
  store.demoMode = false
}

const startOfflineDemo = () => {
  store.startDemo()
}
</script>
