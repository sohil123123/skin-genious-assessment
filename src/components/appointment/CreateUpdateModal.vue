<template>
  <div style="min-width: 500px; max-width: 90vw">
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
            <!-- <div class="q-gutter-sm row flex items-center justify-center">
              <q-chip square color="teal" text-color="white" class="q-ma-md">
                {{ appointmentData.start_datetime }}
              </q-chip>
              TO
              <q-chip square color="teal" text-color="white" class="q-ma-md">
                {{ appointmentData.end_datetime }}
              </q-chip>
            </div> -->

            <div class="row q-gutter-md">
              <div class="col-md-12">
                <DatePicker
                  :model="appointmentData.start_datetime"
                  :label="'Select Start Date & Time'"
                  :field="'start_datetime'"
                  :min-date="new Date()"
                  :min-time="clinic.start_time"
                  :max-time="clinic.end_time"
                  :read-only="false"
                  :outlined="true"
                  :dense="true"
                  @update="
                    (val) => {
                      appointmentData.start_datetime = val
                    }
                  "
                />
              </div>
              <div class="col-md-12">
                <DatePicker
                  :key="endPickerKey"
                  :model="appointmentData.end_datetime"
                  :label="'Select End Date & Time'"
                  :field="'end_datetime'"
                  :min-date="new Date()"
                  :min-time="clinic.start_time"
                  :max-time="clinic.end_time"
                  :read-only="true"
                  :disable="true"
                  :outlined="true"
                  :dense="true"
                  @update="
                    (val) => {
                      appointmentData.end_datetime = val
                    }
                  "
                />
              </div>
              <div v-if="!appointmentData.id" class="col-md-12">
                <q-chip
                  v-for="type in appointmentTypes"
                  :key="type.value"
                  :label="type.label"
                  :value="type.value"
                  :outline="appointmentData.type !== type.value"
                  :color="appointmentData.type === type.value ? 'positive' : 'grey-6'"
                  text-color="white"
                  class="q-ma-xs"
                  clickable
                  @click="setType(type.value)"
                />
              </div>
              <div v-else class="col-md-12">
                <q-chip
                  :label="appointmentData.type"
                  color="positive"
                  text-color="white"
                  class="q-ma-xs text-capitalize"
                />
              </div>
              <div class="col-md-12">
                <q-select
                  v-model="appointmentData.user_id"
                  :options="clients"
                  emit-value
                  map-options
                  use-input
                  label="Select Client"
                  outlined
                  dense
                  clearable
                  :readonly="appointmentData.id ? true : false"
                  @filter="commonStore.filterClients"
                  :rules="[(val) => !!val || 'Please select a client']"
                  style="max-width: 100%"
                  @update:model-value="getAssessments"
                />
              </div>
              <div v-if="loadingAssessments" class="col-md-12">
                <q-skeleton type="QInput" />
              </div>
              <div
                v-if="
                  appointmentData.type == 'treatment' &&
                  appointmentData.user_id &&
                  assessments.length > 0
                "
                class="col-md-12"
              >
                <q-select
                  v-model="appointmentData.assessment_id"
                  :options="assessments"
                  emit-value
                  map-options
                  use-input
                  label="Select Assessment"
                  outlined
                  dense
                  clearable
                  :rules="[(val) => !!val || 'Please select an assessment']"
                  style="max-width: 100%"
                  @update:model-value="getTreatmentSessions"
                />
              </div>
              <div v-if="loadingTreatmentSessions" class="col-md-12">
                <q-skeleton type="QInput" />
              </div>
              <div
                v-if="
                  appointmentData.type == 'treatment' &&
                  appointmentData.user_id &&
                  appointmentData.assessment_id &&
                  treatmentSessionsOptions.length > 0
                "
                class="col-md-12"
              >
                <q-select
                  v-model="appointmentData.treatment_session_id"
                  :options="treatmentSessionsOptions"
                  emit-value
                  map-options
                  use-input
                  label="Select Treatment Session"
                  outlined
                  dense
                  clearable
                  :rules="[(val) => !!val || 'Please select a treatment session']"
                  style="max-width: 100%"
                />
              </div>
              <div class="col-md-12">
                <q-input
                  v-model="appointmentData.notes"
                  label="Note"
                  outlined
                  dense
                  clearable
                  style="width: 100%"
                />
              </div>
              <div v-if="!appointmentData.id" class="col-md-12">
                <q-chip
                  v-for="status in statusOptions"
                  :key="status.value"
                  :label="status.label"
                  :value="status.value"
                  :outline="appointmentData.status !== status.value"
                  :color="appointmentData.status === status.value ? 'positive' : 'grey-6'"
                  :icon="appointmentData.status === status.value ? 'check' : 'close'"
                  text-color="white"
                  class="q-ma-xs"
                  clickable
                  @click="appointmentData.status = status.value"
                />
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn label="Cancel" color="negative" icon="close" outline v-close-popup />
          <q-btn label="Save" color="positive" type="submit" />
        </q-card-actions>
      </q-form>
    </q-card>
  </div>
</template>
<script setup>
import { Notify } from 'quasar'
import { api } from 'src/boot/axios'
import { useCommonStore } from 'src/stores/commonStore'
import { ref, computed, watch, onMounted } from 'vue'
import DatePicker from 'src/components/common/DatePicker.vue'

const commonStore = useCommonStore()

const props = defineProps({
  appointmentData: {
    type: Object,
    required: true,
  },
  clients: {
    type: Array,
    required: true,
  },
  clinic: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue', 'submit'])

const appointmentData = computed({
  get: () => props.appointmentData,
  set: (value) => emit('update:modelValue', value),
})

const appointmentTypes = [
  { label: 'Consult', value: 'consult' },
  { label: 'Treatment', value: 'treatment' },
  { label: 'Express', value: 'express' },
]

const statusOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
]

const assessments = ref([])
const treatmentSessionsOptions = ref([])
const loadingAssessments = ref(false)
const loadingTreatmentSessions = ref(false)
const endPickerKey = ref(0)

function handleSubmit() {
  emit('submit', appointmentData.value)
}

onMounted(async () => {
  await getAssessments()
  getTreatmentSessions()
})

watch(
  () => appointmentData.value.start_datetime,
  (newStart) => {
    if (!newStart) return

    const [startDate] = newStart.split(' ')

    if (appointmentData.value.end_datetime) {
      const [, endTime] = appointmentData.value.end_datetime.split(' ')
      appointmentData.value.end_datetime = `${startDate} ${endTime || '00:00'}`
    } else {
      appointmentData.value.end_datetime = `${startDate} 00:00`
    }

    // 🔥 force End DatePicker UI refresh
    endPickerKey.value++
  },
)

function setType(type) {
  appointmentData.value.type = type
  // Reset dependent fields when type changes
  if (type !== 'treatment') {
    // appointmentData.value.assessment_id = null
    // appointmentData.value.treatment_session_id = null
  }
  if (type == 'treatment' && assessments.value.length === 0) {
    getAssessments()
  }
}

async function getAssessments() {
  if (appointmentData.value.type == 'treatment' && appointmentData.value.user_id) {
    if (!appointmentData.value.id) {
      appointmentData.value.assessment_id = null
      appointmentData.value.treatment_session_id = null
    }

    loadingAssessments.value = true
    let url = `get-assessments?is_dropdown=1`
    let filterArray = [
      {
        column: 'user_id',
        condition: '=',
        value: appointmentData.value.user_id,
      },
    ]
    url += `&filterArray=${encodeURIComponent(JSON.stringify(filterArray))}`
    await api
      .get(url)
      .then((response) => {
        assessments.value = response.data.results
        if (assessments.value.length === 0) {
          Notify.create({
            type: 'warning',
            message: 'No assessments found for the selected client',
          })
        }
      })
      .catch((error) => {
        Notify.create({
          type: 'negative',
          message: error.response?.data?.message || 'Failed to fetch assessments',
        })
      })
      .finally(() => {
        loadingAssessments.value = false
      })
  }
}

function getTreatmentSessions() {
  if (appointmentData.value.type == 'treatment' && appointmentData.value.user_id) {
    loadingTreatmentSessions.value = true
    let url = `get-treatment-sessions?is_dropdown=1`
    let filterArray = [
      {
        column: 'assessment_id',
        condition: '=',
        value: appointmentData.value.assessment_id,
      },
    ]
    url += `&filterArray=${encodeURIComponent(JSON.stringify(filterArray))}`
    api
      .get(url)
      .then((response) => {
        treatmentSessionsOptions.value = response.data.results
        if (treatmentSessionsOptions.value.length === 0) {
          Notify.create({
            type: 'warning',
            message: 'No treatment sessions found for the selected assessment',
          })
        }
      })
      .catch((error) => {
        Notify.create({
          type: 'negative',
          message: error.response?.data?.message || 'Failed to fetch assessments',
        })
      })
      .finally(() => {
        loadingTreatmentSessions.value = false
      })
  }
}
</script>
