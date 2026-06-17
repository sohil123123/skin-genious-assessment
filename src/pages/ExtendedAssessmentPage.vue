<template>
  <q-page padding class="bg-grey-2">
    <div class="max-w-4xl mx-auto q-gutter-y-md">
      <h2 class="text-h4 font-serif q-mb-lg">Extended Assessment & Inspector</h2>

      <!-- CONVERSATION INSPECTOR -->
      <q-card flat bordered class="q-pa-md">
        <q-card-section>
          <div class="text-h6 q-mb-md">Conversation Inspector</div>
          <div class="row q-col-gutter-md items-center">
            <div class="col-12 col-sm-8">
              <q-input v-model="conversationId" outlined dense label="Conversation ID" />
            </div>
            <div class="col-12 col-sm-4">
              <q-btn
                color="primary"
                label="Load Conversation"
                unelevated
                class="full-width"
                @click="fetchConversation"
                :loading="loadingConversation"
              />
            </div>
          </div>

          <div class="q-mt-md row q-col-gutter-md items-start">
            <div class="col-12 col-sm-8">
              <q-input
                v-model="query"
                type="textarea"
                outlined
                dense
                label="Ask anything about this conversation"
                rows="3"
              />
            </div>
            <div class="col-12 col-sm-4">
              <q-btn
                color="secondary"
                label="Ask AI"
                unelevated
                class="full-width"
                @click="askConversation"
                :loading="askingAI"
              />
            </div>
          </div>

          <div v-if="aiAnswer" class="q-mt-md bg-white q-pa-md rounded-borders shadow-1">
            <pre style="white-space: pre-wrap; font-family: inherit">{{ aiAnswer }}</pre>
          </div>

          <div v-if="conversationItems.length > 0" class="q-mt-xl">
            <q-expansion-item
              expand-separator
              icon="history"
              label="Conversation History"
              header-class="text-subtitle1 font-weight-bold"
              class="bg-grey-1 rounded-borders shadow-1"
            >
              <div class="q-pa-md">
                <div v-for="(item, idx) in conversationItems" :key="idx" class="q-mb-md">
                  <q-card flat bordered class="bg-white">
                    <q-card-section>
                      <div class="text-caption text-weight-bold q-mb-sm text-uppercase">
                        {{ item.role || 'assistant' }}
                      </div>
                      <div v-for="(block, bIdx) in item.content" :key="bIdx">
                        <div v-if="block.text">
                          <div v-if="isValidJSON(block.text)">
                            <q-btn
                              flat
                              dense
                              color="primary"
                              icon="content_copy"
                              label="Copy JSON"
                              class="q-mb-sm"
                              @click="copyJSON(block.text)"
                            />
                            <pre class="bg-dark text-white q-pa-sm rounded-borders overflow-auto">{{
                              formatJSON(block.text)
                            }}</pre>
                          </div>
                          <div v-else style="white-space: pre-wrap">
                            {{ block.text.trim() }}
                          </div>
                        </div>
                      </div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>
            </q-expansion-item>
          </div>
        </q-card-section>
      </q-card>

      <!-- POST-DIAGNOSIS IMAGE ASSESSMENT -->
      <q-card flat bordered class="q-pa-md q-mt-lg">
        <q-card-section>
          <div class="text-h6 q-mb-md">Post-Diagnosis Image Assessment</div>
          <p class="text-body2 text-grey-8">
            Upload multiple post-treatment facial scan images below to generate a reassessment when
            the context exceeds normal limits.
          </p>

          <q-file
            v-model="uploadedImages"
            label="Upload Images"
            outlined
            dense
            multiple
            accept="image/*"
            class="q-mb-md"
            @update:model-value="previewImages"
          >
            <template v-slot:prepend>
              <q-icon name="attach_file" />
            </template>
          </q-file>

          <div v-if="previewUrls.length > 0" class="row q-col-gutter-sm q-mb-md">
            <div v-for="(url, i) in previewUrls" :key="i" class="col-4 col-sm-3 col-md-2">
              <q-img :src="url" :ratio="1" class="rounded-borders" />
            </div>
          </div>

          <q-btn
            color="black"
            label="Run Extended Assessment"
            unelevated
            @click="runAssessment"
            :loading="runningAssessment"
            class="q-mt-sm"
          />

          <div v-if="assessmentAnswer" class="q-mt-lg bg-white q-pa-md rounded-borders shadow-1">
            <div class="text-subtitle1 q-mb-sm font-weight-bold">Assessment Result</div>
            <q-btn
              flat
              dense
              color="primary"
              icon="content_copy"
              label="Copy Output"
              class="q-mb-sm"
              @click="copyJSON(assessmentAnswer)"
            />
            <pre class="bg-dark text-white q-pa-sm rounded-borders overflow-auto">{{
              assessmentAnswer
            }}</pre>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useAssessmentStore } from 'src/stores/assessmentStore'
import { getFacialPrompts } from 'src/utils/facial'
import { useRoute } from 'vue-router'

const $q = useQuasar()
const store = useAssessmentStore()
const route = useRoute()

const API_KEY =
  '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'

// Inspector State
const conversationId = ref('')
const query = ref('')
const conversationItems = ref([])
const aiAnswer = ref('')
const loadingConversation = ref(false)
const askingAI = ref(false)

// Assessment State
const uploadedImages = ref([])
const previewUrls = ref([])
const runningAssessment = ref(false)
const assessmentAnswer = ref('')

onMounted(async () => {
  const routeId = route.params.assessment_id

  if (routeId) {
    // If the store lacks data or the ID doesn't match the route, fetch it
    if (!store.assessmentData || store.assessmentData.id != routeId) {
      $q.loading.show({ message: 'Loading assessment data...' })
      try {
        await store.getSingleAssessment(routeId)
      } catch (err) {
        console.error(err)
        $q.notify({ type: 'negative', message: 'Failed to load assessment data' })
      } finally {
        $q.loading.hide()
      }
    }
  }

  // Use current assessment conversation ID dynamically
  if (store.assessmentData && store.assessmentData.conversation_id) {
    conversationId.value = store.assessmentData.conversation_id
  }
})

// === CONVERSATION INSPECTOR ===

async function fetchConversation() {
  if (!conversationId.value) {
    $q.notify({ type: 'warning', message: 'Enter a Conversation ID' })
    return
  }

  loadingConversation.value = true
  conversationItems.value = []

  try {
    const res = await fetch(
      `https://api.openai.com/v1/conversations/${conversationId.value}/items`,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    )

    if (!res.ok) throw new Error(`Failed to load conversation: ${res.status}`)

    const data = await res.json()
    conversationItems.value = (data.data || []).sort(
      (a, b) => (a.created_at || 0) - (b.created_at || 0),
    )
  } catch (err) {
    console.error(err)
    $q.notify({ type: 'negative', message: err.message })
  } finally {
    loadingConversation.value = false
  }
}

function buildConversationContext() {
  let text = ''
  conversationItems.value.forEach((item) => {
    if (item.type !== 'message') return
    const role = item.role || 'assistant'
    ;(item.content || []).forEach((block) => {
      if (block.text) {
        text += role.toUpperCase() + ': ' + block.text + '\n\n'
      }
    })
  })
  return text
}

async function askConversation() {
  if (!query.value) {
    $q.notify({ type: 'warning', message: 'Enter a question' })
    return
  }

  askingAI.value = true
  aiAnswer.value = 'Thinking...'
  const conversationText = buildConversationContext()

  try {
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + API_KEY,
      },
      body: JSON.stringify({
        model: 'gpt-5.2',
        input: `You are analysing a conversation.\nConversation:\n${conversationText}\n\nUser Question:\n${query.value}\n\nAnswer only using information from the conversation.\nIf information is missing say "Not found in conversation".`,
      }),
    })

    const data = await res.json()
    aiAnswer.value = data.output?.[0]?.content?.[0]?.text || JSON.stringify(data, null, 2)
  } catch (err) {
    console.error(err)
    aiAnswer.value = `Error: ${err.message}`
  } finally {
    askingAI.value = false
  }
}

// === EXTENDED ASSESSMENT ===

function previewImages() {
  previewUrls.value = []
  if (uploadedImages.value) {
    uploadedImages.value.forEach((file) => {
      previewUrls.value.push(URL.createObjectURL(file))
    })
  }
}

async function runAssessment() {
  if (!uploadedImages.value || uploadedImages.value.length === 0) {
    $q.notify({ type: 'warning', message: 'Please upload at least one image' })
    return
  }

  runningAssessment.value = true
  assessmentAnswer.value = 'Uploading and processing...'

  try {
    // 1. Convert to base64
    const base64Images = await Promise.all(
      uploadedImages.value.map((file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target.result)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
      }),
    )

    // 2. Fetch context
    let conversationText = ''
    if (conversationId.value) {
      assessmentAnswer.value = 'Fetching previous conversation context...'
      const resConv = await fetch(
        `https://api.openai.com/v1/conversations/${conversationId.value}/items`,
        {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          },
        },
      )
      if (resConv.ok) {
        const dataConv = await resConv.json()
        const items = (dataConv.data || []).sort(
          (a, b) => (a.created_at || 0) - (b.created_at || 0),
        )
        items.forEach((item) => {
          if (item.type !== 'message') return
          const role = item.role || 'assistant'
          ;(item.content || []).forEach((block) => {
            if (block.text) {
              conversationText += role.toUpperCase() + ': ' + block.text + '\n\n'
            }
          })
        })
      }
    }

    // 3. Build input
    assessmentAnswer.value = 'Analyzing with GPT-5.2...'
    const input = []

    // User message
    const userContent = []

    //     userContent.push({
    //       type: 'input_text',
    //       text: `You are an expert dermatological AI.
    // Analyze the provided post-treatment facial images. Compare them against the previous baseline findings from the conversation context.
    // Identify if the condition is 'improved', 'declined', or 'stable'. Generate the final structured JSON object.

    // CRITICAL INSTRUCTIONS:
    // - You must ONLY output a valid JSON object matching the requested schema.
    // - Do not output any markdown formatting like \`\`\`json.
    // - Do not output any conversational text before or after the JSON.`,
    //     })

    base64Images.forEach((b64) => {
      userContent.push({
        type: 'input_image',
        image_url: b64,
      })
    })

    const prompts = await getFacialPrompts(store.assessmentData?.face_scan_machine)

    userContent.push({
      type: 'input_text',
      text: prompts.POST_DIAGNOSIS_USER_PROMPT,
    })

    userContent.push({
      type: 'input_text',
      text: JSON.stringify(
        {
          metadata: {
            phase: 'reassessment',
            evaluation_type: 'post_treatment',
            treatment_session: 'Session 1',
          },
        },
        null,
        2,
      ),
    })

    userContent.push({
      type: 'input_text',
      text:
        `Previous Conversation Context:\n${conversationText}\n\n` +
        JSON.stringify(
          {
            metadata: {
              phase: 'reassessment',
              evaluation_type: 'post_treatment',
              treatment_session: 'Session 1',
            },
          },
          null,
          2,
        ),
    })

    input.push({
      role: 'user',
      content: userContent,
    })

    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + API_KEY,
      },
      body: JSON.stringify({
        model: 'gpt-5.2',
        input: input,
      }),
    })

    const data = await res.json()
    let answer =
      data.output?.[data.output?.length - 1]?.content?.[0]?.text ||
      data.output?.[0]?.content?.[0]?.text ||
      JSON.stringify(data, null, 2)

    const cleanJsonMatch = answer.match(/```json\n([\s\S]*?)\n```/)
    let rawJson = cleanJsonMatch ? cleanJsonMatch[1] : answer

    try {
      const parsed = JSON.parse(rawJson)
      assessmentAnswer.value = JSON.stringify(parsed, null, 2)
    } catch {
      assessmentAnswer.value = answer
    }
  } catch (err) {
    console.error(err)
    assessmentAnswer.value = `Error: ${err.message}`
  } finally {
    runningAssessment.value = false
  }
}

// === UTILS ===

function isValidJSON(str) {
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}

function formatJSON(str) {
  try {
    return JSON.stringify(JSON.parse(str), null, 2)
  } catch {
    return str
  }
}

function copyJSON(text) {
  try {
    const obj = JSON.parse(text)
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2))
    $q.notify({ type: 'positive', message: 'JSON copied to clipboard' })
  } catch {
    navigator.clipboard.writeText(text)
    $q.notify({ type: 'positive', message: 'Text copied to clipboard' })
  }
}
</script>

<style scoped>
.font-serif {
  font-family: 'Playfair Display', serif;
}
</style>
