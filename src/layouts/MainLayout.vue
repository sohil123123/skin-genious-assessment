<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated v-if="route.name !== 'pigmentation-assessment'">
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>AI AESTHETICS </q-toolbar-title>

        <div>v{{ version }}</div>

        <div class="q-ml-md">
          <q-btn-dropdown flat icon="person">
            <q-list>
              <q-item clickable @click="logout">
                <q-item-section avatar>
                  <q-icon name="logout" />
                </q-item-section>
                <q-item-section>Logout</q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" bordered>
      <q-list>
        <q-item-label header> Menu </q-item-label>

        <q-item clickable>
          <q-item-section avatar>
            <q-icon name="dashboard" />
          </q-item-section>

          <q-item-section>
            <q-item-label>Dashboard</q-item-label>
            <!-- <q-item-label caption>{{ props.caption }}</q-item-label> -->
          </q-item-section>
        </q-item>

        <q-item clickable :to="{ name: 'extended-assessment', params: { assessment_id: currentAssessmentId || undefined } }">
          <q-item-section avatar>
            <q-icon name="smart_toy" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Context Inspector</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable :to="{ name: 'pigmentation-assessment' }">
          <q-item-section avatar>
            <q-icon name="face" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Pigment Co-Pilot</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable @click="confirmClearConvId" v-if="currentAssessmentId">
          <q-item-section avatar>
            <q-icon name="cleaning_services" />
          </q-item-section>

          <q-item-section>
            <q-item-label>Clear Conv ID</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import v from '../assets/version.json'
import { Loading, useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/authStore'
import { useAssessmentStore } from 'src/stores/assessmentStore'
import { useIVAssessmentStore } from 'src/stores/ivAssessmentStore'
import { useRoute } from 'vue-router'
import { api } from 'src/boot/axios'

const authStore = useAuthStore()
const assessmentStore = useAssessmentStore()
const ivAssessmentStore = useIVAssessmentStore()
const version = v.version
const leftDrawerOpen = ref(false)
const $q = useQuasar()
const route = useRoute()

const currentAssessmentId = computed(() => {
  return (
    route.params.assessment_id ||
    assessmentStore.assessmentData?.id ||
    ivAssessmentStore.formData?.id
  )
})

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

function confirmClearConvId() {
  $q.dialog({
    title: 'Confirm',
    message:
      'Are you sure you want to clear the current conversation ID and start a fresh conversation?',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      Loading.show({
        message: 'Clearing conversation...',
      })
      await api.post('/assessments/clear-conversation-id', {
        assessment_id: currentAssessmentId.value,
      })

      $q.notify({
        type: 'positive',
        message: 'Conversation ID cleared successfully.',
      })

      window.location.reload()
    } catch (error) {
      console.error(error)
      $q.notify({
        type: 'negative',
        message: 'Failed to clear conversation ID.',
      })
    } finally {
      Loading.hide()
    }
  })
}

async function logout() {
  Loading.show({
    message: 'Logging out...',
  })
  await authStore.logout()
  window.location.href = `${process.env.CRM_URL}`
}
</script>
