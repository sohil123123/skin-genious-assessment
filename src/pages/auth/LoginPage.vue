<template>
  <div class="login-container">
    <div class="header-bg"></div>
    <q-card class="login-card q-pa-lg">
      <div class="floating-icon">
        <q-avatar size="75px" class="bg-primary text-white shadow-3">
          <q-icon name="person" size="36px" />
          <!-- <q-avatar size="60px">
            <q-img src="logos/logo_white.png" alt="Logo" />
          </q-avatar> -->
        </q-avatar>
      </div>

      <q-card-section class="q-mt-xl">
        <div class="text-h5 text-center text-primary q-mb-md">
          <strong>Sign in to Continue</strong>
        </div>
        <div class="text-subtitle2 text-center text-grey-7 q-mb-lg">
          Welcome back! Please enter your details.
        </div>

        <q-form @submit.prevent="login" class="q-gutter-sm">
          <q-input
            v-model="loginData.email"
            label="Email"
            outlined
            clearable
            :error="v$.email.$error"
            @blur="v$.email.$touch"
          >
            <template v-slot:prepend>
              <q-icon name="mail" />
            </template>
            <template v-if="v$.email.$error" v-slot:error> Please enter your email </template>
          </q-input>

          <q-input
            v-model="loginData.password"
            label="Password"
            :type="isPwd ? 'password' : 'text'"
            outlined
            :error="v$.password.$error"
            @blur="v$.password.$touch"
          >
            <template v-slot:prepend>
              <q-icon name="lock" />
            </template>
            <template v-slot:append>
              <q-icon
                :name="isPwd ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="isPwd = !isPwd"
              />
            </template>
            <template v-if="v$.password.$error" v-slot:error> Please enter your password </template>
          </q-input>

          <div class="flex justify-center">
            <q-btn
              label="Login"
              style="width: 150px"
              type="submit"
              class="q-mt-sm"
              color="primary"
              no-caps
              unelevated
              :loading="loading"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from 'src/stores/authStore'
import { storeToRefs } from 'pinia'
import useVuelidate from '@vuelidate/core'
import { required } from '@vuelidate/validators'

const store = useAuthStore()
const { loginData, loading } = storeToRefs(store)
const isPwd = ref(true)

const rules = {
  email: { required },
  password: { required },
}
const v$ = useVuelidate(rules, loginData)

async function login() {
  const isFormCorrect = await v$.value.$validate()
  if (!isFormCorrect) return
  store.login()
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  background-color: #f5f8ff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  position: relative;
}

.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 300px;
  background: linear-gradient(135deg, #009688, #85f4e9);
  border-bottom-left-radius: 50% 40%;
  border-bottom-right-radius: 50% 40%;
}

.login-card {
  width: 100%;
  max-width: 460px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
}

.floating-icon {
  position: absolute;
  top: -35px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}
</style>
