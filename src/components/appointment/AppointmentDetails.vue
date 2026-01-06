<template>
  <q-dialog v-model="modelValue" @hide="onDialogHide">
    <q-card class="rounded-borders" style="min-width: 520px; max-width: 520px">
      <!-- Header -->
      <q-card-section class="row items-center q-pb-sm bg-grey-1">
        <q-avatar color="primary" text-color="white" icon="event" size="md" />

        <div class="q-ml-sm">
          <div class="text-h6">Appointment</div>
          <div class="text-caption text-grey-7">{{ event?.date }} • {{ event?.time }}</div>
        </div>

        <q-space />

        <q-chip v-if="event?.status" outline text-color="grey-8" class="text-capitalize">
          <q-icon name="circle" size="14px" class="q-mr-xs" :style="{ color: statusColor }" />
          {{ event?.status }}
        </q-chip>

        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-separator />

      <!-- Content -->
      <q-card-section v-if="event" class="q-gutter-md">
        <!-- Title -->
        <q-card v-if="event.meta.type == 'treatment'" flat bordered class="q-pa-sm bg-grey-2">
          <div class="text-subtitle1 text-weight-bold">
            {{ event.meta.session_title }}
          </div>
        </q-card>
        <q-card v-else flat bordered class="q-pa-sm bg-grey-2">
          <div class="text-subtitle1 text-weight-bold text-capitalize">
            Type: {{ event.meta.type }}
          </div>
        </q-card>

        <!-- Time Info -->
        <q-card flat bordered>
          <q-list>
            <q-item>
              <q-item-section avatar>
                <q-icon name="schedule" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Time</q-item-label>
                <q-item-label caption> {{ event.time }} • {{ event.duration }} mins </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>

        <!-- People & Place -->
        <q-card flat bordered>
          <q-list bordered separator>
            <q-item>
              <q-item-section avatar>
                <q-avatar color="primary" icon="person" text-color="white" size="sm" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Therapist</q-item-label>
                <q-item-label caption>
                  {{ event.meta?.therapist || 'Not assigned' }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section avatar>
                <q-avatar color="teal" icon="local_hospital" text-color="white" size="sm" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Clinic</q-item-label>
                <q-item-label caption>
                  {{ event.meta?.clinic || 'Not specified' }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section avatar>
                <q-avatar color="orange" icon="face" text-color="white" size="sm" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Client</q-item-label>
                <q-item-label caption>
                  {{ event.meta?.client || 'No client' }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>

        <!-- Notes -->
        <q-card v-if="event.meta?.notes" flat bordered class="bg-grey-1">
          <q-card-section>
            <div class="text-caption text-grey-7 q-mb-xs">Notes</div>
            <div class="text-body2">
              {{ event.meta.notes }}
            </div>
          </q-card-section>
        </q-card>
      </q-card-section>

      <q-card-actions v-if="event?.id && event?.status !== 'completed'" align="right">
        <!-- Pending -->
        <q-chip
          clickable
          @click="updateStatus('pending')"
          color="amber"
          :text-color="status === 'pending' ? 'white' : 'amber'"
          :outline="status !== 'pending'"
        >
          <q-icon v-if="status === 'pending'" name="check" class="q-mr-xs" />
          Pending
        </q-chip>

        <!-- Confirm -->
        <q-chip
          clickable
          @click="updateStatus('confirmed')"
          color="positive"
          :text-color="status === 'confirmed' ? 'white' : 'positive'"
          :outline="status !== 'confirmed'"
        >
          <q-icon v-if="status === 'confirmed'" name="check" class="q-mr-xs" />
          Confirmed
        </q-chip>

        <!-- Cancel -->
        <q-chip
          clickable
          @click="updateStatus('cancelled')"
          color="negative"
          :text-color="status === 'cancelled' ? 'white' : 'negative'"
          :outline="status !== 'cancelled'"
        >
          <q-icon v-if="status === 'cancelled'" name="check" class="q-mr-xs" />
          Cancelled
        </q-chip>
      </q-card-actions>

      <q-separator />

      <!-- Actions -->
      <q-card-actions :align="event?.status !== 'completed' ? 'between' : 'right'" class="q-pa-md">
        <!-- Left (Danger) -->
        <q-btn
          v-if="event?.status !== 'completed'"
          flat
          color="negative"
          icon="delete_outline"
          label="Delete"
          @click="$emit('delete', event.id)"
        />

        <!-- Right (Primary) -->
        <div class="row q-gutter-sm">
          <q-btn flat label="Close" color="grey-7" v-close-popup />

          <q-btn
            v-if="event?.status !== 'completed'"
            unelevated
            color="primary"
            icon="edit"
            label="Edit Appointment"
            @click="$emit('edit', event.id)"
          />
        </div>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { Notify, useQuasar } from 'quasar'
import { computed, ref, watch } from 'vue'
import { api } from 'boot/axios'

const $q = useQuasar()

const props = defineProps({
  modelValue: Boolean,
  event: Object,
})

const status = ref(null)

const emit = defineEmits(['update:modelValue', 'delete', 'edit', 'getAppointments'])

const modelValue = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

watch(
  () => props.event,
  (v) => {
    status.value = v.status
  },
)

function onDialogHide() {
  emit('update:modelValue', false)
}

const statusColor = computed(() => {
  return props.event?.bgcolor
})

function updateStatus(s) {
  $q.dialog({
    title: 'Confirm',
    message: 'Are you sure you want to update the status?',
    persistent: true,

    ok: {
      label: 'Yes',
      color: 'positive',
      icon: 'check_circle',
      unelevated: true,
    },
    cancel: {
      label: 'No',
      color: 'negative',
      flat: true,
      icon: 'close',
    },
  })
    .onOk(() => {
      status.value = s
      api
        .post(`/appointments/status/${props.event.id}`, { status: s })
        .then((res) => {
          emit('getAppointments')
          onDialogHide()
          Notify.create({
            type: 'positive',
            message: res.data.message || 'Status updated successfully',
          })
        })
        .catch((e) => {
          console.log(e)
          Notify.create({
            type: 'negative',
            message: e.response.data.message,
          })
        })
    })
    .onCancel(() => {
      console.log('User cancelled')
    })
    .onDismiss(() => {
      console.log('Dialog closed (OK or Cancel)')
    })
}
</script>
