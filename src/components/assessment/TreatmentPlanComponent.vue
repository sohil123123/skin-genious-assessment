<!-- TreatmentPlanComponent.vue (new component) -->
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
      <div>
        <!-- Primary Focus -->
        <q-card flat bordered class="q-mt-md">
          <q-card-section>
            <h6 class="q-ma-none">Primary Focus</h6>
          </q-card-section>
          <q-list dense>
            <q-item v-for="(focus, index) in treatmentPlan.primary_focus" :key="index">
              <q-item-section>
                {{ focus }}
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>

        <!-- In-Clinic Sessions -->
        <h5 class="q-mt-lg q-mb-md">In-Clinic Sessions</h5>
        <div
          v-for="(clinic, clinicIndex) in treatmentPlan.in_clinic_sessions"
          :key="clinicIndex"
          class="q-mb-lg"
        >
          <q-card flat bordered>
            <q-card-section>
              <div class="text-h6">{{ clinic.name }}</div>
              <div class="text-subtitle2 text-grey">{{ clinic.frequency }}</div>
            </q-card-section>
            <q-separator />
            <q-card-section v-for="(sess, sessIndex) in clinic.sessions" :key="sessIndex">
              <div class="text-subtitle1 q-mb-md">
                Session {{ sess.session_number }}: {{ sess.title }}
              </div>
              <q-timeline color="primary" layout="dense">
                <q-timeline-entry
                  v-for="(step, stepIndex) in sess.steps"
                  :key="stepIndex"
                  :side="false"
                >
                  <template v-slot:title> Step {{ step.step_number }}: {{ step.title }} </template>
                  <template v-slot:subtitle>
                    <q-chip class="text-accent" dense outline>Duration: {{ step.duration }}</q-chip>
                  </template>
                  <div>Details: {{ step.details }}</div>
                  <div>Products: {{ step.products_equipments.join(', ') }}</div>
                  <div>How to do: {{ step.how_to_do }}</div>
                  <div>Finish: {{ step.finish.join(', ') }}</div>
                </q-timeline-entry>
              </q-timeline>
            </q-card-section>
          </q-card>
        </div>

        <!-- Homecare -->
        <q-card flat bordered class="q-mt-md">
          <q-card-section>
            <h6 class="q-ma-none">Homecare</h6>
          </q-card-section>
          <q-list bordered separator>
            <q-item v-for="(home, index) in treatmentPlan.homecare" :key="index">
              <q-item-section>
                <q-item-label>{{ home.product }}</q-item-label>
                <q-item-label caption>{{ home.usage }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>

        <!-- Contraindications -->
        <q-card flat bordered class="q-mt-md">
          <q-card-section>
            <h6 class="q-ma-none">Contraindications</h6>
          </q-card-section>
          <q-list dense>
            <q-item v-for="(contra, index) in treatmentPlan.contraindications" :key="index">
              <q-item-section>
                {{ contra }}
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>

        <!-- Follow Up -->
        <q-card flat bordered class="q-mt-md">
          <q-card-section>
            <h6 class="q-ma-none">Follow Up</h6>
          </q-card-section>
          <q-list dense>
            <q-item v-for="(follow, index) in treatmentPlan.follow_up" :key="index">
              <q-item-section>
                {{ follow }}
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>
      <!-- Display AI response; format as needed -->
      <div class="flex justify-start q-mt-lg">
        <q-btn label="Previous" rounded no-caps class="btn-custom" @click="emitPrevious" />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  treatmentPlan: {
    type: [String, Object],
    required: true,
  },
})

const emit = defineEmits(['previous'])

const emitPrevious = () => {
  emit('previous')
}
</script>
