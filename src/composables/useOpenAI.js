import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import config from 'src/config.js'

// Response Examples
import ivScore from 'src/response-examples/iv-score.json'
import clinicalScore from 'src/response-examples/clinical-score.json'
import treatmentPlan from 'src/response-examples/treatment-plans.json'
import nurseRunSheet from 'src/response-examples/nurse-runsheet-single-session.json'
import nurseRunSheetMulti from 'src/response-examples/nurse-runsheet-multi-session.json'

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
  const runResponse = async (convId, input, temp = 0) => {
    // --- TEST MODE INTERCEPTION ---
    if (config.is_test_mode) {
      console.log('🚧 TEST MODE: Intercepting OpenAI Call')
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate network latency

      const inputStr = JSON.stringify(input)

      // 1. IV SCORING STAGES Check
      // Stage 1 (Analysing images)
      if (inputStr.includes('Image 1 = UV MODE')) {
        console.log('🚧 TEST MODE: Returning mock for IV Scoring Stage 1')
        return { message: 'Stage 1 mock complete' } // Intermediate, just needs to return something
      }
      // Stage 2 (Refining analysis)
      if (
        inputStr.includes('Stage 1 mock complete') ||
        inputStr.includes('"message":"Stage 1 mock complete"')
      ) {
        console.log('🚧 TEST MODE: Returning mock for IV Scoring Stage 2')
        return { message: 'Stage 2 mock complete' }
      }
      // Stage 3 (Final Output Generation - Dermatological AI)
      if (
        inputStr.includes('Stage 2 mock complete') ||
        inputStr.includes('"message":"Stage 2 mock complete"')
      ) {
        console.log('🚧 TEST MODE: Returning IV Score (Dermatological)', ivScore)
        return ivScore
      }

      // 2. CLINICAL SCORING (Stage 4 / "generateIVScoring" / "Clinical Vitality Profiling")
      // Check for iv_score content being passed or specific prompts
      if (
        inputStr.includes('AI_IV_ClinicalScoring') // from Stage 4 prompt if visible, but we rely on data passed
      ) {
        // This is likely the Clinical Scoring step because it usually receives the IV Score result
        console.log('🚧 TEST MODE: Returning Clinical Score', clinicalScore)
        return clinicalScore
      }

      // 3. TREATMENT GENERATION
      if (
        inputStr.includes('AI_IV_TreatmentGeneration') ||
        inputStr.includes('AI_IV_TreatmentGeneration Engine v2.1')
      ) {
        console.log('🚧 TEST MODE: Returning Treatment Plan', treatmentPlan)
        return treatmentPlan
      }

      // 4. NURSE RUN SHEET
      if (inputStr.includes('Nurse Run Sheet') || inputStr.includes('clinic_sop_defaults')) {
        if (inputStr.includes('P1-W') || inputStr.includes('plan_option')) {
          console.log('🚧 TEST MODE: Returning Multi-Session Nurse Run Sheet', nurseRunSheetMulti)
          return nurseRunSheetMulti
        }
        console.log('🚧 TEST MODE: Returning Nurse Run Sheet', nurseRunSheet)
        return nurseRunSheet
      }

      // Default fallback if no match found
      console.warn('🚧 TEST MODE: No specific mock matched. Returning empty object.')
      return {}
    }

    // --- REAL API CALL ---
    try {
      const body = {
        model: 'gpt-5.2',
        temperature: temp,
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
