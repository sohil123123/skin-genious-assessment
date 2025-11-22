import { useQuasar } from 'quasar'
// import { skinTypeFunctions, imageAnalysisFunctions } from 'src/utils/ai-functions'
import { useAssessmentStore } from 'src/stores/assessmentStore'

const assessmentStore = useAssessmentStore()
export function useOpenAI() {
  const $q = useQuasar()
  const API_KEY = process.env.OPENAI_API_KEY
  const BASE_URL = 'https://api.openai.com/v1'

  // 🧠 1. Get or create conversation
  const getOrCreateConversation = async (pid) => {
    try {
      let id = assessmentStore.assessmentData.conversation_id
      if (id) return id

      const res = await fetch(`${BASE_URL}/conversations`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ metadata: { patient_id: pid } }),
      })

      const data = await res.json()
      if (!res.ok || !data.id) {
        throw new Error(`Conversation creation failed: ${JSON.stringify(data)}`)
      }

      assessmentStore.updateAssessment({ conversation_id: data.id })
      return data.id
    } catch (err) {
      console.error(err)
      $q.notify({
        type: 'negative',
        message: err.message || 'Failed to create conversation',
      })
      throw err
    }
  }

  // 💬 2. Run response (send message + get reply)
  const runResponse = async (convId, input) => {
    try {
      const body = {
        model: 'gpt-5-nano',
        // temperature: 2.0,
        conversation: convId,
        input,
      }

      const res = await fetch(`${BASE_URL}/responses`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      console.log('AI Response: ', res)
      const data = await res.json()
      if (!res.ok) {
        return data
      }

      // Try to return the assistant's text output
      // return data.output?.[0]?.content?.[0]?.text || JSON.stringify(data, null, 2)

      const extractedText =
        data.output?.[data.output?.length - 1]?.content?.[0]?.text || JSON.stringify(data, null, 2)

      // let cleanedText = ''
      // const match = extractedText.match(/```json([\s\S]*?)```/)
      // if (match && match[1]) {
      //   cleanedText = match[1].trim()
      // } else if (extractedText.trim().startsWith('{')) {
      //   cleanedText = extractedText.trim()
      // } else {
      //   throw new Error('No valid JSON found.')
      // }
      try {
        const parsed = JSON.parse(extractedText)
        return parsed
      } catch (e) {
        return {
          error: e,
        }
      }
    } catch (err) {
      console.error(err)
      $q.notify({
        type: 'negative',
        message: err.message || 'Error generating response',
      })
      return {
        error: err,
      }
    } finally {
      $q.loading.hide()
    }
  }

  return {
    getOrCreateConversation,
    runResponse,
  }
}
