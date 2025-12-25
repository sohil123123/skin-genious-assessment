<template>
  <q-page class="q-pa-md">
    <q-card>
      <q-card-section>
        <q-calendar-day
          v-model="selectedDate"
          view="day"
          :interval-minutes="15"
          :interval-start="32"
          :interval-count="44"
          :interval-height="30"
          :interval-style="intervalStyle"
          bordered
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>
<script setup>
import { ref } from 'vue'
import { QCalendarDay, today } from '@quasar/quasar-ui-qcalendar'
import '@quasar/quasar-ui-qcalendar/index.css'

const selectedDate = ref(today())

function intervalStyle({ scope }) {
  const { date, time } = scope.timestamp

  // Disable 08:00 → 09:00
  if (date === selectedDate.value && time >= '08:00' && time < '09:00') {
    return {
      backgroundColor: 'rgba(255, 0, 0, 0.35)',
      pointerEvents: 'none',
      cursor: 'not-allowed',
    }
  }

  return {}
}
</script>
