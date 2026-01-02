<template>
  <!-- Warning Banner -->
  <!-- <q-banner v-if="warning" rounded class="bg-orange-1 text-orange-10 q-mt-md" inline-actions>
    <template #avatar>
      <q-icon name="warning_amber" color="orange-9" size="md" />
    </template>

    <div class="text-weight-medium">
      {{ warning.message }}
    </div>

    <template #action>
      <q-btn flat dense color="orange-9" label="View details" @click="showDetails = true" />
    </template>
  </q-banner> -->

  <!-- Details Dialog -->
  <q-dialog v-model="showDetails">
    <q-card style="max-width: 420px; width: 100%">
      <q-card-section class="row items-center q-pb-none">
        <q-icon name="medical_services" color="orange-9" size="md" />
        <div class="text-h6 q-ml-sm">Emergency Override Applied</div>
      </q-card-section>

      <q-card-section class="text-body2 q-pt-sm">
        <q-list dense bordered class="rounded-borders">
          <q-item>
            <q-item-section>Clinic Capacity</q-item-section>
            <q-item-section side>{{ warning.details.capacity }}</q-item-section>
          </q-item>

          <q-item>
            <q-item-section>Confirmed Appointments</q-item-section>
            <q-item-section side>{{ warning.details.confirmed }}</q-item-section>
          </q-item>

          <q-item>
            <q-item-section>Pending Appointments</q-item-section>
            <q-item-section side>{{ warning.details.pending }}</q-item-section>
          </q-item>

          <q-separator />

          <q-item>
            <q-item-section>Emergency Booking</q-item-section>
            <q-item-section side>
              <q-chip dense icon="priority_high" color="red-2" text-color="red-10"> Yes </q-chip>
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
import { watch, computed, ref } from 'vue'
import { Notify } from 'quasar'

const props = defineProps({
  warning: {
    type: Object,
    required: true,
  },
})

const warning = computed(() => props.warning || {})
const showDetails = ref(false)

watch(
  () => props.warning,
  (val) => {
    const warning = val

    if (Object.keys(warning).length == 0) return

    Notify.create({
      type: 'warning',
      icon: 'warning_amber',
      timeout: 0, // persistent
      position: 'top-right',
      multiLine: true,
      message: warning.message,
      caption: buildCaption(warning),
      actions: [
        {
          label: 'Details',
          color: 'white',
          handler: () => showDetailsDialog(warning),
        },
        {
          label: 'Dismiss',
          color: 'white',
          handler: () => {},
        },
      ],
    })
  },
  { deep: true, immediate: true },
)

function buildCaption(warning) {
  return `Capacity: ${warning.details?.capacity} • Confirmed: ${warning.details?.confirmed}`
}

function showDetailsDialog(warning) {
  Notify.create({
    type: 'negative',
    icon: 'medical_services',
    position: 'top',
    timeout: 0,
    actions: [
      {
        label: '',
        color: 'white',
        round: true,
        icon: 'close',
        handler: () => {},
      },
    ],
    message: warning.message,
    caption: `
      Clinic Capacity: ${warning.details.capacity}
      Confirmed: ${warning.details.confirmed}
      Pending: ${warning.details.pending}
      Emergency Booking: Yes
    `,
  })
}
</script>
