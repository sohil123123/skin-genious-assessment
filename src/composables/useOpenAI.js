import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'

export function useOpenAI() {
  const $q = useQuasar()

  // 🧠 1. Get or create conversation
  const getOrCreateConversation = async (pid, convId, name, assessmentId) => {
    try {
      let id = convId
      if (id) return id

      const res = await api.post(`ai/conversations`, {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_id: pid,
          patient_name: name,
          assessment_id: `${assessmentId}`,
        }),
      })

      const data = await res.data
      if (!data || !data.id) {
        throw new Error(`Conversation creation failed: ${JSON.stringify(data)}`)
      }

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
        model: 'gpt-5.2',
        temperature: 0,
        conversation: convId,
        input,
        prompt_cache_retention: '24h',
        prompt_cache_key: 'ai-aesthetics-assessment-key-v1-ai',
      }

      const res = await api.post(`ai/responses`, body)
      const data = await res.data
      if (!data) return data

      // Try to return the assistant's text output
      // return data.output?.[0]?.content?.[0]?.text || JSON.stringify(data, null, 2)

      const extractedText =
        data.output?.[data.output?.length - 1]?.content?.[0]?.text || JSON.stringify(data, null, 2)

      try {
        const parsed = JSON.parse(extractedText)
        console.log('AI Response: ', parsed)
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
