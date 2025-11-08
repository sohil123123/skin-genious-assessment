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
import { useQuasar, LocalStorage } from 'quasar'
import { useAuthStore } from 'src/stores/authStore'

const store = useAuthStore()
const route = useRoute()
const router = useRouter()
const $q = useQuasar()

const token = route.query.token
const userId = route.query.user_id
const isValid = ref(false)

onMounted(async () => {
  if (!token || !userId) {
    $q.notify({ type: 'negative', message: 'Invalid access. Redirecting...' })
    window.location.href = `${process.env.CRM_URL}/users`
  }

  try {
    const response = await api.get('/validate-assessment-token', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.data.valid) {
      isValid.value = true
      LocalStorage.set('user_id', userId)
      LocalStorage.set('token_id', token)
      store.token_id = token
      store.user_id = userId
      api.defaults.headers.common.Authorization = 'Bearer ' + token
      // setTimeout(() => {
      router.push({ name: 'index' })
      // }, 2000)
    } else {
      throw new Error('Invalid token')
    }
  } catch (error) {
    console.error('Authentication error:', error.message)
    $q.notify({ type: 'negative', message: 'Validation failed. Redirecting to CRM.' })
    window.location.href = `${process.env.CRM_URL}/users`
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
