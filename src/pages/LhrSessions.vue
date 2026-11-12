<template>
  <q-page class="q-pa-lg bg-grey-2"
    ><div class="q-mx-auto" style="max-width: 1100px">
      <q-card flat bordered
        ><q-card-section>
          <div class="row items-center justify-between q-mb-lg">
            <h1 class="text-h4 q-ma-none" style="font-family: Georgia, serif">LHR sessions</h1>
            <q-btn
              outline
              rounded
              no-caps
              label="Refresh"
              icon="refresh"
              :loading="loading"
              @click="load()"
            />
          </div>
          <p class="text-grey-7">
            Open your assigned treatment, continue an assessment or review a completed LHR session.
          </p>
          <q-banner v-if="error" rounded class="bg-red-1 q-mb-md">{{ error }}</q-banner>
          <q-markup-table flat bordered wrap-cells
            ><thead>
              <tr>
                <th class="text-left">Client</th>
                <th>Session</th>
                <th>Status</th>
                <th>Therapist</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in sessions" :key="item.id">
                <td>{{ item.patient }}</td>
                <td class="text-center">{{ item.session_number }}</td>
                <td class="text-center">{{ item.status.replaceAll('_', ' ') }}</td>
                <td>{{ item.therapist || 'Not assigned' }}</td>
                <td>
                  <q-btn
                    no-caps
                    rounded
                    unelevated
                    color="black"
                    label="Open session"
                    :to="{
                      name: 'lhr-assessment',
                      params: { user_id: item.user_id, assessment_id: item.assessment_id },
                      query: { session_id: item.id },
                    }"
                  />
                </td>
              </tr>
              <tr v-if="!sessions.length && !loading">
                <td colspan="5" class="text-center text-grey-7 q-pa-lg">
                  No LHR sessions available for your account.
                </td>
              </tr>
            </tbody></q-markup-table
          >
          <div v-if="loading" class="text-center q-pa-lg"><q-spinner size="32px" /></div>
          <q-btn
            v-if="nextPage"
            outline
            no-caps
            rounded
            label="Load more"
            class="q-mt-lg"
            :loading="loading"
            @click="load(nextPage)"
          /> </q-card-section
      ></q-card></div
  ></q-page>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import { api } from 'src/boot/axios'
const sessions = ref([])
const nextPage = ref(null)
const loading = ref(false)
const error = ref('')
async function load(url = null) {
  loading.value = true
  error.value = ''
  try {
    const response = await api.get(url || 'lhr/sessions')
    sessions.value = url ? [...sessions.value, ...response.data.data] : response.data.data
    nextPage.value = response.data.next_page
  } catch (cause) {
    error.value = cause.response?.data?.message || 'Unable to load LHR sessions.'
  } finally {
    loading.value = false
  }
}
onMounted(() => load())
</script>
