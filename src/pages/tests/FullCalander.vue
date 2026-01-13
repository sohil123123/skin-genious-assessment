<template>
  <q-page class="q-pa-md">
    <q-card class="q-pa-md">
      <q-card-section>
        <div class="row q-col-gutter-sm">
          <div v-if="!clinicId" class="col-md-3 col-sm-6 col-xs-12">
            <q-select
              label="Select Clinic"
              outlined
              v-model="clinic_id"
              :options="clinics"
              option-value="id"
              option-label="name"
              map-options
              options-dense
              dense
              @update:model-value="getSelectedVal"
            />
          </div>
          <div v-if="!therapistId" class="col-md-3 col-sm-6 col-xs-12">
            <q-select
              label="Select Threapist"
              outlined
              v-model="therapist_id"
              :options="therapiests"
              emit-value
              map-options
              options-dense
              dense
              @update:model-value="getAppointments"
            />
          </div>
        </div>
      </q-card-section>

      <q-card-section v-if="clinic_id && therapist_id">
        <FullCalendar ref="calendarRef" :options="calendarOptions" />

        <!-- Add/Edit dialog -->
        <q-dialog v-model="showDialog" @hide="resetForm">
          <q-card style="min-width: 400px">
            <q-card-section class="text-h6">
              {{ isEditMode ? 'Edit Appointment' : 'Add Appointment' }}
            </q-card-section>

            <q-card-section>
              <q-input
                v-model="form.title"
                label="Patient Name"
                dense
                :rules="[(val) => !!val || 'Patient name is required']"
              />
              <div class="q-mt-sm text-caption text-grey">
                <div>Start: {{ formatDateTime(form.start) }}</div>
                <div>End: {{ formatDateTime(form.end) }}</div>
              </div>
            </q-card-section>

            <q-card-actions align="right">
              <q-btn flat label="Cancel" v-close-popup />
              <q-btn v-if="isEditMode" color="negative" label="Delete" @click="handleDelete" />
              <q-btn color="primary" label="Save" :disable="!form.title" @click="handleSave" />
            </q-card-actions>
          </q-card>
        </q-dialog>
      </q-card-section>

      <q-card-section v-else>
        <div class="text-center q-py-xl">
          <q-icon name="calendar_month" size="xl" color="grey-4" class="q-mb-md" />
          <div class="text-h6 text-grey-6 q-mb-sm">No Clinic & Therapist Selected</div>
          <div class="text-grey-7">Start by selecting a clinic and therapist</div>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Notify, date } from 'quasar'
import FullCalendar from '@fullcalendar/vue3'
import timeGridPlugin from '@fullcalendar/timegrid'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useRoute } from 'vue-router'
import { useCommonStore } from 'src/stores/commonStore'
import { storeToRefs } from 'pinia'
import { api } from 'src/boot/axios'
// import { useAppointmentStore } from 'src/stores/appointmentStore'

// ------------------ STORES ------------------
const commonStore = useCommonStore()
const { clinics, therapiests } = storeToRefs(commonStore)

// const appointmentStore = useAppointmentStore()

/* ------------------ CONSTANTS ------------------ */
const route = useRoute()

const clinicId = route.params.clinic_id
const therapistId = route.params.therapist_id

const therapistAvailability = Object.freeze({
  t1: {
    unavailable: [
      {
        daysOfWeek: [1, 2, 3, 4, 5],
        startTime: '13:00',
        endTime: '14:00',
        reason: 'Lunch break',
      },
    ],
  },
  t2: {
    unavailable: [
      {
        daysOfWeek: [2, 4],
        startTime: '10:00',
        endTime: '12:00',
        reason: 'In surgery',
      },
    ],
  },
})

/* ------------------ REFS ------------------ */
const calendarRef = ref(null)
const showDialog = ref(false)
const isEditMode = ref(false)
const selectedEvent = ref(null)
const selectedTherapist = ref('t1')
const appointments = ref([])

const selectedClinic = ref(null)
const clinic_id = ref(route.params.clinic_id)
const therapist_id = ref(route.params.therapist_id)

/* ------------------ REACTIVE STATE ------------------ */
const form = ref({
  title: '',
  start: '',
  end: '',
})

/* ------------------ COMPUTED ------------------ */
const selectedClinicData = computed(() => {
  return clinics.value.find((clinic) => clinic.id === selectedClinic.value?.id)
})

const clinicHours = computed(() => {
  if (!selectedClinicData.value) return { open: '09:00', close: '18:00' } // Default

  // Convert "10:30:00" to "10:30"
  const formatTime = (timeString) => {
    if (!timeString) return '09:00'
    return timeString.slice(0, 5) // Remove seconds
  }

  return {
    open: formatTime(selectedClinicData.value.start_time),
    close: formatTime(selectedClinicData.value.end_time),
  }
})

const currentTherapistAvailability = computed(() => ({
  ...therapistAvailability[selectedTherapist.value],
  clinic: clinicHours.value, // Add clinic hours here
}))

const disabledSlots = computed(() => {
  return currentTherapistAvailability.value.unavailable.map((slot) => ({
    daysOfWeek: slot.daysOfWeek,
    startTime: slot.startTime,
    endTime: slot.endTime,
    display: 'background',
    backgroundColor: '#fff3cd',
    interactive: false, // Important: prevents click events
    extendedProps: {
      reason: slot.reason,
      isDisabledSlot: true,
    },
  }))
})

const calendarEvents = computed(() => [...appointments.value, ...disabledSlots.value])

/* ---------------- LIFECYCLE ---------------- */

onMounted(() => {
  if (!route.params.clinic_id) commonStore.getClinics()

  if (route.params.clinic_id) {
    getClinicById(route.params.clinic_id)
    commonStore.getTherapiests(route.params.clinic_id)
    commonStore.getClients(route.params.clinic_id)
  }
})

/* ------------------ UTILITY FUNCTIONS ------------------ */
function formatDateTime(dateTime) {
  if (!dateTime) return ''
  return date.formatDate(dateTime, 'YYYY-MM-DD HH:mm')
}

function getDayOfWeek(date) {
  return date.getDay() === 0 ? 7 : date.getDay() // Convert Sunday from 0 to 7 for FullCalendar compatibility
}

function getTimeString(date) {
  return date.toTimeString().slice(0, 5)
}

/* ------------------ VALIDATION ------------------ */
function isPastTime(date) {
  return date < new Date()
}

function isWithinDisabledSlot(date) {
  const day = getDayOfWeek(date)
  const time = getTimeString(date)

  return currentTherapistAvailability.value.unavailable.some(
    (slot) => slot.daysOfWeek.includes(day) && time >= slot.startTime && time < slot.endTime,
  )
}

function isTimeWithinClinicHours(date) {
  if (!selectedClinicData.value) return true // Default validation if no clinic selected

  const time = getTimeString(date)
  return time >= clinicHours.value.open && time <= clinicHours.value.close
}

function validateTimeSlot(start) {
  if (isPastTime(start)) {
    Notify.create({
      type: 'negative',
      message: 'Cannot book appointments in the past',
    })
    return false
  }

  if (!isTimeWithinClinicHours(start)) {
    Notify.create({
      type: 'warning',
      message: 'Outside clinic hours',
    })
    return false
  }

  if (isWithinDisabledSlot(start)) {
    const disabledSlot = currentTherapistAvailability.value.unavailable.find((slot) => {
      const day = getDayOfWeek(start)
      const time = getTimeString(start)
      return slot.daysOfWeek.includes(day) && time >= slot.startTime && time < slot.endTime
    })
    Notify.create({
      type: 'warning',
      message: disabledSlot?.reason || 'This time slot is unavailable',
    })
    return false
  }

  return true
}

/* ------------------ CALENDAR CONFIG ------------------ */
const calendarOptions = ref({
  plugins: [timeGridPlugin, dayGridPlugin, interactionPlugin],
  initialView: 'timeGridWeek',

  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay',
  },

  allDaySlot: false,
  slotDuration: '00:15',
  selectable: true,
  editable: true,
  nowIndicator: true,
  height: 'auto',
  eventOverlap: false,

  slotMinTime: computed(() => clinicHours.value.open),
  slotMaxTime: computed(() => clinicHours.value.close),

  events: calendarEvents,

  selectAllow: (info) => validateTimeSlot(info.start),

  eventAllow: (dropInfo) => validateTimeSlot(dropInfo.start),

  select: (info) => {
    if (!validateTimeSlot(info.start)) return

    form.value = {
      title: '',
      start: info.start,
      end: info.end,
    }

    isEditMode.value = false
    showDialog.value = true
  },

  eventClick: (info) => {
    // Prevent editing of disabled slots
    if (info.event.extendedProps?.isDisabledSlot) return

    selectedEvent.value = info.event
    form.value = {
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
    }
    isEditMode.value = true
    showDialog.value = true
  },

  eventMouseEnter: (info) => {
    const reason = info.event.extendedProps?.reason
    if (!reason) return

    info.el.setAttribute('title', reason)
    info.el.style.cursor = info.event.extendedProps?.isDisabledSlot ? 'not-allowed' : 'pointer'
  },
})

/* ------------------ CRUD OPERATIONS ------------------ */
function handleSave() {
  if (!form.value.title) {
    Notify.create({
      type: 'warning',
      message: 'Please enter a patient name',
    })
    return
  }

  if (isEditMode.value) {
    selectedEvent.value.setProp('title', form.value.title)
    selectedEvent.value.setDates(form.value.start, form.value.end)
  } else {
    appointments.value.push({
      id: Date.now(),
      title: form.value.title,
      start: form.value.start,
      end: form.value.end,
      backgroundColor: '#3788d8',
      borderColor: '#3788d8',
    })
  }

  showDialog.value = false
  Notify.create({
    type: 'positive',
    message: isEditMode.value ? 'Appointment updated' : 'Appointment created',
  })
}

function handleDelete() {
  if (selectedEvent.value) {
    selectedEvent.value.remove()
    appointments.value = appointments.value.filter((apt) => apt.id !== selectedEvent.value.id)
    showDialog.value = false
    Notify.create({
      type: 'info',
      message: 'Appointment deleted',
    })
  }
}

function resetForm() {
  form.value = {
    title: '',
    start: '',
    end: '',
  }
  selectedEvent.value = null
}

function reloadCalendar() {
  if (!selectedClinic.value) {
    Notify.create({
      type: 'warning',
      message: 'Please select a clinic first',
    })
    return
  }

  // Force calendar to refresh with new availability
  if (calendarRef.value?.getApi) {
    const calendarApi = calendarRef.value.getApi()
    calendarApi.refetchEvents()
  }
}

/* ------------------ LIFECYCLE ------------------ */
onMounted(() => {
  // Initial load with default therapist
  reloadCalendar()
})

/* ------------------ METHODS ------------------ */
function getClinicById(id) {
  api
    .get(`get-clinics?id=${id}&is_first=1`)
    .then((res) => {
      console.log(res)
      // setStartEndTime(res.data.results)
    })
    .catch((error) => {
      Notify.create({
        type: 'negative',
        message: error.response.data.message,
      })
    })
}

function getSelectedVal(val) {
  selectedClinic.value = val
  reloadCalendar()
  therapist_id.value = null
  clinic_id.value = val.id
  commonStore.getTherapiests(val.id)
  commonStore.getClients(val.id)
}

async function getAppointments() {
  // otherEvents.value = []
  // if (clinic_id.value && therapist_id.value && startDate.value && endDate.value)
  //   appointmentStore.getAppointments(
  //     clinic_id.value,
  //     therapist_id.value,
  //     startDate.value,
  //     endDate.value,
  //   )
}
</script>

<style scoped>
/* Disabled slots styling */
:deep(.fc-bg-event) {
  cursor: not-allowed;
  pointer-events: none;
}

/* Custom event styling */
:deep(.fc-event) {
  cursor: pointer;
}
</style>
