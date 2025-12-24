<template>
  <div style="min-width: 400px; max-width: 90vw">
    <q-card class="custom-card" style="margin-top: 20px">
      <q-toolbar>
        <q-toolbar-title
          class="text-white header-container gradient-default flex justify-end items-center"
        >
          <div class="title">Book Next Appointment</div>
          <q-btn class="flex-end q-mr-sm" icon="close" round outline dense v-close-popup />
        </q-toolbar-title>
      </q-toolbar>
      <q-card-section class="q-pt-none">
        <q-select
          v-model="activeSlot.therapist_id"
          :options="therapists"
          option-value="id"
          option-label="name"
          label="Therapist"
        />

        <q-select
          v-model="activeSlot.bed_id"
          :options="beds"
          option-value="id"
          option-label="name"
          label="Bed"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn label="Cancel" color="negative" icon="close" outline v-close-popup />
        <q-btn
          label="Confirm"
          color="positive"
          icon="check"
          :loading="loading"
          @click="confirmBooking"
        />
      </q-card-actions>
    </q-card>
  </div>
</template>
<script setup>
import { ref } from 'vue'

const props = defineProps({
  activeSlot: {
    type: Object,
    required: true,
  },
  therapists: {
    type: Array,
    required: true,
  },
  beds: {
    type: Array,
    required: true,
  },
})

const activeSlot = ref(props.activeSlot)
const therapists = ref(props.therapists)
const beds = ref(props.beds)
</script>
