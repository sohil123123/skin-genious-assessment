<template>
  <q-page class="flex flex-center bg-grey-3">
    <q-card class="my-card">
      <q-card-section>
        <div class="row justify-center">
          <div class="container" id="processing-screen">
            <h6>Authenticating...</h6>
            <div
              class="wheels"
              style="display: flex; justify-content: center; gap: 20px; margin: 40px 0"
            >
              <div class="wheel"></div>
              <div class="wheel"></div>
              <div class="wheel"></div>
            </div>
            <p>Please wait while we authenticate...</p>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from 'boot/axios' // Quasar's Axios boot file
import { useQuasar } from 'quasar'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()

const token = ref(route.params.token)
const userId = ref(route.params.userId)
const isValid = ref(false)

onMounted(async () => {
  if (!token.value || !userId.value) {
    $q.notify({ type: 'negative', message: 'Invalid access. Redirecting...' })
    return router.push('/error') // Or redirect to CRM login
  }

  try {
    const response = await api.get('/validate-assessment-token', {
      headers: { Authorization: `Bearer ${token.value}` },
    })

    if (response.data.valid) {
      isValid.value = true
      // Proceed: Fetch patient data via another API using token
      // e.g., await api.get(`/api/patients/${patientId.value}`, { headers: { Authorization: `Bearer ${token.value}` } });
      // Start assessment form, upload images, etc.
      // For "restart," clear local storage or reset form state here.
    } else {
      throw new Error('Invalid token')
    }
  } catch (error) {
    console.error('Authentication error:', error.message)
    $q.notify({ type: 'negative', message: 'Validation failed. Please try from CRM.' })
    // Redirect back to CRM, e.g., window.location.href = 'https://crm.example.com';
  }
})
</script>

<style scoped>
.my-card {
  width: 400px;
  height: 300px;
  border-radius: 15px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}
</style>
