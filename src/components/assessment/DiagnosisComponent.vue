<template>
  <div class="min-h-screen bg-grey-2 p-6">
    <div class="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center gap-3">
          <div
            class="w-12 h-12 rounded-full border-2 border-black flex items-center justify-center"
          >
            <span class="text-2xl font-serif">A</span>
          </div>
          <span class="text-xl font-light tracking-wider">AI AESTHETICS</span>
        </div>
      </div>
      <div class="flex justify-between q-mt-lg">
        <q-btn label="Previous" rounded no-caps class="btn-custom" @click="emitPrevious" />
        <q-btn label="Next" rounded no-caps class="btn-custom" @click="emitMajorConcerns" />
      </div>
      <div v-for="(param, key) in diagnosis.diagnosis_report" :key="key" class="q-mt-md">
        <q-card flat bordered class="q-pa-md">
          <div class="row items-center justify-between">
            <h6 class="q-ma-none">{{ param.parameter_name }}</h6>
            <q-badge v-if="isScore(param.score_or_label)" rounded class="text-h6 q-pa-sm gredient">
              {{ extractScore(param.score_or_label) }}
            </q-badge>
            <q-chip v-else class="gredient" text-color="white" removable="false">
              {{ param.score_or_label }}
            </q-chip>
          </div>

          <p class="text-caption q-mt-sm q-mb-md">{{ param.description }}</p>

          <q-card-section class="bg-grey-2 rounded-borders q-pa-md">
            {{ param.score_explanation }}
          </q-card-section>

          <div class="q-mt-md">
            <span class="text-subtitle2">Possible Causes:</span>
            <div class="row q-mt-sm">
              <q-chip
                v-for="(cause, index) in param.possible_causes"
                :key="index"
                text-color="deep-purple-10"
                class="q-mr-sm q-mb-sm gredient-bg"
              >
                {{ cause }}
              </q-chip>
            </div>
          </div>
          <div>
            <img :src="faceImages[param.affected_area_image - 1]" width="100px" />
          </div>
        </q-card>
      </div>

      <div class="flex justify-between q-mt-lg">
        <q-btn label="Previous" rounded no-caps class="btn-custom" @click="emitPrevious" />
        <q-btn label="Next" rounded no-caps class="btn-custom" @click="emitMajorConcerns" />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  diagnosis: {
    type: [String, Object],
    required: true,
  },
  faceImages: {
    type: [String, Array],
    required: true,
  },
})

const emit = defineEmits(['show-major-concerns', 'previous'])

const emitMajorConcerns = () => {
  emit('show-major-concerns')
}

const emitPrevious = () => {
  emit('previous')
}

// Helper to check if label looks like a score (starts with number or 'Score/Grade')
function isScore(label) {
  return /^\d|Score|Grade/.test(label)
}

// Extract just the numeric/grade part for badge display
function extractScore(label) {
  if (label) {
    const match = label.match(/^(\d+|Grade \d+|Score \d+)/)
    return match ? match[0].replace(/Grade |Score /, '') : label
  } else {
    return 'N.A.'
  }
}
</script>

<style scoped>
.rounded-borders {
  border-radius: 20px;
}
</style>
