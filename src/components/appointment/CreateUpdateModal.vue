<template>
  <div style="min-width: 400px; max-width: 90vw">
    <q-card class="custom-card" style="margin-top: 20px">
      <q-toolbar>
        <q-toolbar-title
          class="text-white header-container gradient-default flex justify-end items-center"
        >
          <div class="title">Book Appointment</div>
          <q-btn class="flex-end q-mr-sm" icon="close" round outline dense v-close-popup />
        </q-toolbar-title>
      </q-toolbar>
      <q-form @submit="handleSubmit" class="q-gutter-md">
        <q-card-section class="q-pt-none">
          <div class="q-pa-md">
            <div class="q-gutter-sm row flex items-center justify-center">
              <q-chip square color="teal" text-color="white" class="q-ma-md">
                {{ startEndDates[0] }}
              </q-chip>
              TO
              <q-chip square color="teal" text-color="white" class="q-ma-md">
                {{ commonStore.addMinutes(startEndDates[1]) }}
              </q-chip>
            </div>

            <div class="row q-gutter-md">
              <div class="col-md-12">
                <q-chip
                  v-for="type in appointmentTypes"
                  :key="type.value"
                  :label="type.label"
                  :value="type.value"
                  :outline="activeSlot.type !== type.value"
                  :color="activeSlot.type === type.value ? 'positive' : 'grey-6'"
                  text-color="white"
                  class="q-ma-xs"
                  clickable
                  @click="activeSlot.type = type.value"
                />
              </div>
              <div class="col-md-12">
                <q-select
                  v-model="activeSlot.client_id"
                  :options="clients"
                  emit-value
                  map-options
                  use-input
                  label="Select Client"
                  outlined
                  dense
                  clearable
                  @filter="commonStore.filterClients"
                  :rules="[(val) => !!val || 'Please select a client']"
                  style="max-width: 100%"
                />
              </div>
              <div class="col-md-12">
                <q-input
                  v-model="activeSlot.notes"
                  label="Note"
                  outlined
                  dense
                  clearable
                  style="width: 100%"
                />
              </div>
              <div class="col-md-12">
                <q-chip
                  v-for="status in statusOptions"
                  :key="status.value"
                  :label="status.label"
                  :value="status.value"
                  :outline="activeSlot.status !== status.value"
                  :color="activeSlot.status === status.value ? 'positive' : 'grey-6'"
                  :icon="activeSlot.status === status.value ? 'check' : 'close'"
                  text-color="white"
                  class="q-ma-xs"
                  clickable
                  @click="activeSlot.status = status.value"
                />
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn label="Cancel" color="negative" icon="close" outline v-close-popup />
          <q-btn label="Confirm" color="positive" type="submit" />
        </q-card-actions>
      </q-form>
    </q-card>
  </div>
</template>
<script setup>
import { useCommonStore } from 'src/stores/commonStore'
import { computed } from 'vue'

const commonStore = useCommonStore()

const props = defineProps({
  activeSlot: {
    type: Object,
    required: true,
  },
  appointmentTypes: {
    type: Array,
    required: true,
  },
  statusOptions: {
    type: Array,
    required: true,
  },
  clients: {
    type: Array,
    required: true,
  },
  startEndDates: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue', 'submit'])

const activeSlot = computed({
  get: () => props.activeSlot,
  set: (value) => emit('update:modelValue', value),
})

function handleSubmit() {
  emit('submit', activeSlot.value)
}
</script>
