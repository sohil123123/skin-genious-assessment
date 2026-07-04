<template>
  <section class="stage is-active">
    <div class="stage-head">
      <span class="eyebrow">Stage 02 · Assess</span>
      <h1 class="serif">Review the AI's follow-up questions</h1>
      <p>Answer the dynamic follow-up questions generated contextually by the AI based on the image analysis and basic history parameters.</p>
    </div>

    <div class="capture-wrap">
      <!-- Dynamic Questions Card -->
      <div class="card" id="dynCard" style="max-width: 800px; margin: 0 auto">
        <div class="card-title">
          <h3>AI's dynamic questions</h3>
          <span class="meta">{{ store.dynamicQuestions?.length ? store.dynamicQuestions.length + ' questions' : '—' }}</span>
        </div>
        <div id="dynQuestions">
          <div v-if="store.dynamicQuestions?.length > 0">
            <p class="note" style="margin-bottom:12px">Tailored to the image read and fixed history — answer what you can.</p>
            <div v-for="q in store.dynamicQuestions" :key="q.question_id" class="field full" style="margin-bottom:11px">
              <label>
                {{ q.question }}
                <span class="hint" style="display:block;font-weight:400" v-if="q.why_asked"><b>Why:</b> {{ q.why_asked }}</span>
              </label>

              <select v-if="q.answer_type === 'single_choice' && q.options?.length" v-model="store.dynamicAnswers[q.question_id]">
                <option value="">— select —</option>
                <option v-for="opt in q.options" :key="opt" :value="opt">{{ formatOptionLabel(opt) }}</option>
              </select>
              <select v-else-if="q.answer_type === 'boolean'" v-model="store.dynamicAnswers[q.question_id]">
                <option value="">— select —</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="not_sure">Unsure</option>
              </select>
              <div v-else-if="q.answer_type === 'multi_choice' && q.options?.length" class="checks q-mt-xs">
                <label v-for="opt in q.options" :key="opt" :class="['check', { 'is-checked': isDynamicOptionChecked(q.question_id, opt) }]">
                  <input
                    type="checkbox"
                    class="dynamic-question-options"
                    :value="opt"
                    :checked="isDynamicOptionChecked(q.question_id, opt)"
                    @change="toggleDynamicOption(q.question_id, opt)"
                  >
                  {{ formatOptionLabel(opt) }}
                </label>
              </div>
              <input v-else placeholder="Type patient's response..." v-model="store.dynamicAnswers[q.question_id]">
            </div>
          </div>
          <div v-else>
            <p class="note">No dynamic follow-up questions generated. Click continue to proceed to diagnosis.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { usePigmentationStore } from 'src/stores/pigmentationStore'

const store = usePigmentationStore()

const formatOptionLabel = (val) => {
  if (!val) return ''
  return val
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/Or/g, 'or')
    .replace(/To/g, 'to')
    .replace(/Aha/g, 'AHA')
    .replace(/Bha/g, 'BHA')
    .replace(/Hq/g, 'HQ')
    .replace(/Ocp/g, 'OCP')
    .replace(/Txa/g, 'TXA')
    .replace(/Pih/g, 'PIH')
    .replace(/Q-switch/i, 'Q-Switch')
}

const isDynamicOptionChecked = (questionId, option) => {
  const ans = store.dynamicAnswers[questionId]
  if (Array.isArray(ans)) {
    return ans.includes(option)
  }
  return false
}

const toggleDynamicOption = (questionId, option) => {
  if (!Array.isArray(store.dynamicAnswers[questionId])) {
    store.dynamicAnswers[questionId] = []
  }
  const arr = [...store.dynamicAnswers[questionId]]
  const idx = arr.indexOf(option)
  if (idx >= 0) {
    arr.splice(idx, 1)
  } else {
    arr.push(option)
  }
  store.dynamicAnswers[questionId] = arr
}
</script>
