<template>
  <q-dialog v-model="modelValue" @hide="onDialogHide">
    <q-card class="rounded-borders" style="min-width: 520px; max-width: 95vw">
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
          {{ event.status }}
        </q-chip>

        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-separator />

      <!-- Content -->
      <q-card-section v-if="event" class="q-gutter-md">
        <!-- Title -->
        <!-- <q-card flat bordered class="q-pa-sm bg-grey-2">
          <div class="text-subtitle1 text-weight-bold">
            {{ event.title }}
          </div>
        </q-card> -->

        <!-- Time Info -->
        <q-card flat bordered>
          <q-list dense>
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
          <q-list dense>
            <q-item>
              <q-item-section avatar>
                <q-avatar color="primary" icon="person" text-color="white" />
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
                <q-avatar color="teal" icon="local_hospital" text-color="white" />
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
                <q-avatar color="orange" icon="face" text-color="white" />
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

      <q-separator />

      <!-- Actions -->
      <q-card-actions align="between" class="q-pa-md">
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
            unelevated
            color="primary"
            icon="edit"
            label="Edit Appointment"
            @click="$emit('edit', event)"
          />
        </div>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  event: Object,
})

const emit = defineEmits(['update:modelValue', 'delete', 'edit'])

const modelValue = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

function onDialogHide() {
  emit('update:modelValue', false)
}

const statusColor = computed(() => {
  return props.event?.bgcolor
})
</script>
