<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
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
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import v from '../assets/version.json'
import { Loading } from 'quasar'
import { useAuthStore } from 'src/stores/authStore'

const authStore = useAuthStore()
const version = v.version
const leftDrawerOpen = ref(false)

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

async function logout() {
  Loading.show({
    message: 'Logging out...',
  })
  await authStore.logout()
  window.location.href = `${process.env.CRM_URL}`
}
</script>
