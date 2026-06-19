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
const appointmentId = route.query.appointment_id
const assessment_id = route.query.assessment_id ?? null
const session_id = route.query.session_id ?? null
const type = route.query.type ?? null
const clinic_id = route.query.clinic_id ?? null
const therapist_id = route.query.therapist_id ?? null
const assessment_type = route.query.assessment_type ?? null
const isValid = ref(false)

onMounted(async () => {
  if (!token) {
    $q.notify({ type: 'negative', message: 'Invalid access. Redirecting...' })
    window.location.href = `${process.env.CRM_URL}/users`
  }

  try {
    const response = await api.get('/validate-assessment-token', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.data.valid) {
      isValid.value = true
      LocalStorage.set('token_id', token)
      store.token_id = token
      store.user_id = userId
      api.defaults.headers.common.Authorization = 'Bearer ' + token
      setTimeout(() => {
        if (type == 'assessment') {
          router.push({
            name: 'index',
            params: {
              user_id: userId,
              step: 'step-1',
              ...(appointmentId && { appointment_id: appointmentId }),
            },
          })
        }
        if (type == 'edit') {
          if (assessment_type == 'iv' || assessment_type == 'instant-iv') {
            router.push({
              name: 'iv-assessment',
              params: {
                user_id: userId,
                step: 'step-1',
                assessment_id: assessment_id,
                ...(appointmentId && { appointment_id: appointmentId }),
              },
            })
          } else {
            router.push({
              name: 'index-with-id',
              params: {
                user_id: userId,
                step: 'step-1',
                assessment_id: assessment_id,
                ...(appointmentId && { appointment_id: appointmentId }),
              },
            })
          }
        }
        if (type == 'iv') {
          router.push({
            name: 'iv-assessment',
            params: {
              user_id: userId,
              step: 'step-1',
              ...(appointmentId && { appointment_id: appointmentId }),
            },
          })
        } else if (type == 'treatment') {
          router.push({
            name: 'TreatmentPrep',
            params: {
              user_id: userId,
              assessment_id: assessment_id,
              session_id: session_id,
              ...(appointmentId && { appointment_id: appointmentId }),
            },
          })
        } else if (type == 'clinic-head-complete') {
          router.push({
            name: 'ClinicHeadTreatmentComplete',
            params: {
              user_id: userId,
              assessment_id: assessment_id,
              session_id: session_id,
              ...(appointmentId && { appointment_id: appointmentId }),
            },
          })
        } else if (type == 'iv-treatment') {
          router.push({
            name: 'IVTreatmentPrep',
            params: {
              user_id: userId,
              assessment_id: assessment_id,
              session_id: session_id,
              ...(appointmentId && { appointment_id: appointmentId }),
            },
          })
        } else if (type == 'appointment') {
          if (clinic_id && therapist_id) {
            router.push({
              name: 'appointments',
              params: {
                clinic_id: clinic_id,
                therapist_id: therapist_id,
              },
            })
          } else if (clinic_id && !therapist_id) {
            router.push({
              name: 'appointments',
              params: {
                clinic_id: clinic_id,
              },
            })
          } else {
            router.push({
              name: 'appointments',
            })
          }
        }
      }, 2000)
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
