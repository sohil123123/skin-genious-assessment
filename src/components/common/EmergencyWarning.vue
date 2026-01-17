<template>
  <!-- DETAILS DIALOG -->
  <q-dialog v-model="showDetails">
    <q-card style="max-width: 420px; width: 100%">
      <q-card-section class="row items-center q-pb-none">
        <q-icon
          :name="selectedWarning?.emergency?.is_emergency ? 'priority_high' : 'warning_amber'"
          color="orange-9"
          size="md"
        />
        <div class="text-h6 q-ml-sm">
          {{ selectedWarning?.code || 'Warning' }}
        </div>
      </q-card-section>

      <q-card-section class="text-body2 q-pt-sm">
        <q-list bordered class="rounded-borders">
          <q-item>
            <q-item-section>Message</q-item-section>
            <q-item-section side>
              {{ selectedWarning?.message }}
            </q-item-section>
          </q-item>

          <q-separator />

          <q-item v-if="selectedWarning?.emergency">
            <q-item-section>Emergency Override</q-item-section>
            <q-item-section side>
              <q-chip dense icon="priority_high" color="red-2" text-color="red-10"> Yes </q-chip>
            </q-item-section>
          </q-item>

          <q-item v-if="selectedWarning?.emergency">
            <q-item-section>
              <q-item-label>Emergency Message</q-item-label>
              <q-item-label caption>{{ selectedWarning.emergency.message }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Close" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { watch, ref } from 'vue'
import { Notify } from 'quasar'

const props = defineProps({
  warnings: {
    type: Array,
    default: () => [],
  },
})

const showDetails = ref(false)
const selectedWarning = ref(null)

/* ---------------- WATCH WARNINGS ---------------- */
watch(
  () => props.warnings,
  (warnings) => {
    if (!Array.isArray(warnings) || warnings.length === 0) return

    warnings.forEach((warning) => {
      showWarningNotify(warning)
    })
  },
  { deep: true, immediate: true },
)

/* ---------------- NOTIFY ---------------- */
function showWarningNotify(warning) {
  const isEmergency = warning?.emergency?.is_emergency

  Notify.create({
    type: isEmergency ? 'negative' : 'warning',
    icon: isEmergency ? 'priority_high' : 'warning_amber',
    timeout: 0,
    position: 'top-right',
    multiLine: true,

    message: warning.message,

    caption: isEmergency ? warning.emergency.message : 'Please review the details',

    actions: [
      {
        label: 'Details',
        color: 'white',
        handler: () => openDetails(warning),
      },
      {
        label: 'Dismiss',
        color: 'white',
        handler: () => {},
      },
    ],
  })
}

/* ---------------- DETAILS ---------------- */
function openDetails(warning) {
  selectedWarning.value = warning
  showDetails.value = true
}
</script>
