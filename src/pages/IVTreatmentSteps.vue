<template>
  <q-page>
    <div class="min-h-screen bg-grey-2 p-6 flex flex-center">
      <div class="max-w-6xl w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <h4 class="text-weight-bold text-black q-mb-md">IV Treatment Steps</h4>
        <p class="text-grey-7 text-h6">This page will contain the IV treatment steps.</p>
        
        <q-btn
          color="primary"
          label="Complete Session"
          @click="completeSession"
          class="q-mt-lg"
          size="lg"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

function completeSession() {
  router.push({
    name: 'IVTreatmentComplete',
    params: {
      user_id: route.params.user_id,
      assessment_id: route.params.assessment_id,
      session_id: route.params.session_id,
      ...(route.params.appointment_id && { appointment_id: route.params.appointment_id }),
    },
  })
}
</script>
