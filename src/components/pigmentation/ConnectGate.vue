<template>
  <div class="gate">
    <div class="gate-card">
      <div class="gate-brand">
        <div class="glyph"></div>
        <div class="nm">AI Aesthetics <span>· Pigment Co-Pilot</span></div>
      </div>
      <h2 class="serif">Connect to begin</h2>
      <p>
        Run live plan generation for this session using OpenAI. Plans are
        AI-proposed and reviewed by the treating dermatologist before any patient use.
      </p>

      <div class="gate-actions">
        <button
          class="btn btn-primary btn-block btn-lg"
          @click="startConnect"
        >
          Start live assessment →
        </button>
      </div>

      <div v-if="statusMsg" :class="['gate-msg show', statusType]">
        {{ statusMsg }}
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

const statusMsg = ref('')
const statusType = ref('')

const startConnect = () => {
  store.isConnected = true
}
</script>
