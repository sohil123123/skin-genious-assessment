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
              @update:model-value="handleClinicChange"
            />
          </div>
          <div v-if="!therapistId" class="col-md-3 col-sm-6 col-xs-12">
            <q-select
              label="Select Therapist"
              outlined
              v-model="therapist_id"
              :options="therapiests"
              emit-value
              map-options
              options-dense
              dense
              @update:model-value="handleTherapistChange"
            />
          </div>
        </div>
      </q-card-section>

      <q-card-section v-if="clinic_id && therapist_id">
        <!-- Loading indicator -->
        <div v-if="isLoading" class="text-center q-my-md">
          <q-spinner size="lg" />
          <div>Loading appointments...</div>
        </div>

        <FullCalendar ref="calendarRef" :options="calendarOptions" />

        <!-- Add/Edit dialog -->
        <q-dialog v-model="showDialog" persistent @hide="resetForm">
          <q-card style="min-width: 400px">
            <q-card-section class="text-h6">
              {{ isEditMode ? 'Edit Appointment' : 'Add Appointment' }}
            </q-card-section>

            <q-card-section>
              <q-input
                ref="patientInput"
                v-model="form.title"
                label="Patient Name"
                dense
                :rules="[(val) => !!val || 'Patient name is required']"
                @keyup.enter="handleSave"
              />
              <div class="q-mt-sm text-caption text-grey">
                <div>Start: {{ formatDateTime(form.start) }}</div>
                <div>End: {{ formatDateTime(form.end) }}</div>
              </div>
            </q-card-section>

            <q-card-actions align="right">
              <q-btn flat label="Cancel" @click="closeDialog" />
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
import { ref, computed, onMounted, nextTick } from 'vue'
import { Notify, date } from 'quasar'
import FullCalendar from '@fullcalendar/vue3'
import timeGridPlugin from '@fullcalendar/timegrid'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useRoute } from 'vue-router'
import { useCommonStore } from 'src/stores/commonStore'
import { storeToRefs } from 'pinia'
import { useAppointmentStore } from 'src/stores/appointmentStore'

// ------------------ STORES ------------------
const commonStore = useCommonStore()
const { clinics, therapiests } = storeToRefs(commonStore)
const appointmentStore = useAppointmentStore()

/* ------------------ CONSTANTS ------------------ */
const route = useRoute()
const clinicId = route.params.clinic_id ? parseInt(route.params.clinic_id) : null
const therapistId = route.params.therapist_id ? parseInt(route.params.therapist_id) : null

/* ------------------ REFS ------------------ */
const calendarRef = ref(null)
const showDialog = ref(false)
const isEditMode = ref(false)
const selectedEvent = ref(null)
const patientInput = ref(null)

const clinic_id = ref(clinicId)
const therapist_id = ref(therapistId)

const appointments = ref([])
const disabledSlotsFromAPI = ref([])
const isLoading = ref(false)

/* ------------------ REACTIVE STATE ------------------ */
const form = ref({
  title: '',
  start: '',
  end: '',
})

/* ------------------ COMPUTED ------------------ */
const selectedClinicData = computed(() => {
  return clinics.value.find((clinic) => clinic.id === clinic_id.value)
})

const clinicHours = computed(() => {
  if (!selectedClinicData.value) return { open: '09:00', close: '18:00' }

  const formatTime = (timeString) => {
    if (!timeString) return '09:00'
    return timeString.slice(0, 5)
  }

  return {
    open: formatTime(selectedClinicData.value.start_time),
    close: formatTime(selectedClinicData.value.end_time),
  }
})

/* ------------------ LIFECYCLE ------------------ */
onMounted(async () => {
  if (clinicId) {
    clinic_id.value = clinicId
    await commonStore.getClinics()
    await commonStore.getTherapiests(clinicId)
  } else {
    await commonStore.getClinics()
  }

  if (therapistId) {
    therapist_id.value = therapistId
  }
})

/* ------------------ UTILITY FUNCTIONS ------------------ */
function formatDateTime(dateTime) {
  if (!dateTime) return ''
  return date.formatDate(dateTime, 'YYYY-MM-DD HH:mm')
}

function getTimeString(date) {
  return date.toTimeString().slice(0, 5)
}

function formatDateToYMD(dateValue) {
  if (!dateValue) return ''

  if (dateValue instanceof Date) {
    return date.formatDate(dateValue, 'YYYY-MM-DD')
  }

  if (typeof dateValue === 'string') {
    const ymdRegex = /^\d{4}-\d{2}-\d{2}$/
    if (ymdRegex.test(dateValue)) {
      return dateValue
    }

    const parsedDate = new Date(dateValue)
    if (!isNaN(parsedDate.getTime())) {
      return date.formatDate(parsedDate, 'YYYY-MM-DD')
    }
  }

  return dateValue
}

function formatTimeString(timeString) {
  if (!timeString) return '00:00:00'

  if (timeString.includes(':')) {
    const parts = timeString.split(':')
    if (parts.length === 3) {
      return timeString
    } else if (parts.length === 2) {
      return `${timeString}:00`
    }
  }

  return '00:00:00'
}

/* ------------------ VALIDATION ------------------ */
function isPastTime(date) {
  return date < new Date()
}

function isTimeWithinClinicHours(date) {
  if (!selectedClinicData.value) return false
  const time = getTimeString(date)
  return time >= clinicHours.value.open && time <= clinicHours.value.close
}

function isWithinDisabledSlotFromAPI(date) {
  const dateStr = date.toISOString().split('T')[0]
  const timeStr = getTimeString(date)

  return disabledSlotsFromAPI.value.some((slot) => {
    return slot.start_date === dateStr && timeStr >= slot.start_time && timeStr < slot.end_time
  })
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
      message: `Outside clinic hours (${clinicHours.value.open} - ${clinicHours.value.close})`,
    })
    return false
  }

  if (isWithinDisabledSlotFromAPI(start)) {
    Notify.create({
      type: 'warning',
      message: 'Therapist is not available at this time',
    })
    return false
  }

  return true
}

/* ------------------ EVENT PROCESSING ------------------ */
function processApiResponse(results) {
  const appointmentsList = []
  const disabledSlotsList = []

  results.forEach((item) => {
    if (item.type === 'appointment') {
      const formattedStartTime = formatTimeString(item.start_time)
      const formattedEndTime = formatTimeString(item.end_time)
      const startDateTime = `${item.start_date}T${formattedStartTime}`
      const endDateTime = `${item.end_date}T${formattedEndTime}`

      appointmentsList.push({
        id: item.id.toString(),
        title: `${item.meta?.client || 'Patient'} (${item.status})`,
        start: startDateTime,
        end: endDateTime,
        backgroundColor: item.bgcolor || '#3788d8',
        borderColor: item.bgcolor || '#3788d8',
        extendedProps: {
          originalData: item,
          type: 'appointment',
          status: item.status,
          meta: item.meta,
          isDisabledSlot: false,
        },
      })
    } else {
      const formattedStartTime = formatTimeString(item.start_time)
      const formattedEndTime = formatTimeString(item.end_time)
      const startDateTime = `${item.start_date}T${formattedStartTime}`
      const endDateTime = `${item.end_date}T${formattedEndTime}`

      disabledSlotsList.push({
        id: item.id.toString(),
        title: item.title,
        start: startDateTime,
        end: endDateTime,
        display: 'background',
        backgroundColor: item.bgcolor || '#BDBDBD',
        start_date: item.start_date,
        end_date: item.end_date,
        start_time: formattedStartTime.slice(0, 5),
        end_time: formattedEndTime.slice(0, 5),
        extendedProps: {
          originalData: item,
          type: item.type,
          reason: item.title,
          isDisabledSlot: true,
        },
      })
    }
  })

  return { appointmentsList, disabledSlotsList }
}

/* ------------------ CALENDAR OPTIONS ------------------ */
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
  slotLabelInterval: '01:00',
  selectable: true,
  selectMirror: true,
  editable: true,
  nowIndicator: true,
  height: 'auto',
  eventOverlap: false,
  selectOverlap: false,
  selectMinDistance: 10,

  slotMinTime: computed(() => clinicHours.value.open),
  slotMaxTime: computed(() => clinicHours.value.close),

  // Use function callback for events
  events: function (fetchInfo, successCallback) {
    const eventsToShow = [...appointments.value, ...disabledSlotsFromAPI.value]
    successCallback(eventsToShow)
  },

  datesSet: () => {
    if (clinic_id.value && therapist_id.value) {
      fetchAppointments()
    }
  },

  selectAllow: (info) => validateTimeSlot(info.start),

  eventAllow: (dropInfo) => validateTimeSlot(dropInfo.start),

  select: (info) => {
    if (!validateTimeSlot(info.start)) {
      if (calendarRef.value?.getApi) {
        calendarRef.value.getApi().unselect()
      }
      return
    }

    form.value = {
      title: '',
      start: info.start,
      end: info.end,
    }

    isEditMode.value = false
    showDialog.value = true

    nextTick(() => {
      if (patientInput.value) {
        patientInput.value.focus()
      }
    })
  },

  eventClick: (info) => {
    if (info.event.extendedProps?.isDisabledSlot) {
      info.jsEvent.preventDefault()
      return
    }

    selectedEvent.value = info.event
    form.value = {
      title: info.event.title.split(' (')[0] || info.event.title,
      start: info.event.start,
      end: info.event.end,
    }
    isEditMode.value = true
    showDialog.value = true
  },

  eventMouseEnter: (info) => {
    const reason = info.event.extendedProps?.reason
    if (reason) {
      info.el.setAttribute('title', reason)
    }

    if (info.event.extendedProps?.isDisabledSlot) {
      info.el.style.cursor = 'not-allowed'
    } else {
      info.el.style.cursor = 'pointer'
    }
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
    selectedEvent.value.setProp(
      'title',
      `${form.value.title} (${selectedEvent.value.extendedProps.status || 'Updated'})`,
    )
  } else {
    const newAppointment = {
      id: `local-${Date.now()}`,
      title: `${form.value.title} (Pending)`,
      start: form.value.start,
      end: form.value.end,
      backgroundColor: '#FFC107',
      borderColor: '#FFC107',
      extendedProps: {
        type: 'appointment',
        status: 'pending',
        isDisabledSlot: false,
        isLocal: true,
      },
    }

    appointments.value.push(newAppointment)
  }

  closeDialog()
  Notify.create({
    type: 'positive',
    message: isEditMode.value ? 'Appointment updated' : 'Appointment created',
  })
}

function handleDelete() {
  if (selectedEvent.value) {
    const eventId = selectedEvent.value.id
    const index = appointments.value.findIndex((apt) => apt.id === eventId)
    if (index > -1) {
      appointments.value.splice(index, 1)
    }

    closeDialog()
    Notify.create({
      type: 'info',
      message: 'Appointment deleted',
    })
  }
}

function closeDialog() {
  showDialog.value = false
  if (calendarRef.value?.getApi) {
    calendarRef.value.getApi().unselect()
  }
  resetForm()
}

function resetForm() {
  form.value = {
    title: '',
    start: '',
    end: '',
  }
  selectedEvent.value = null
}

/* ------------------ API METHODS ------------------ */
async function fetchAppointments() {
  if (!clinic_id.value || !therapist_id.value) {
    return
  }

  isLoading.value = true
  try {
    const response = await appointmentStore.getAppointments(
      clinic_id.value,
      therapist_id.value,
      formatDateToYMD(calendarRef.value?.getApi()?.view?.currentStart),
      formatDateToYMD(calendarRef.value?.getApi()?.view?.currentEnd),
    )

    if (response.success) {
      const results = response.data || []
      const { appointmentsList, disabledSlotsList } = processApiResponse(results)

      appointments.value = [...appointmentsList]
      disabledSlotsFromAPI.value = [...disabledSlotsList]

      if (calendarRef.value?.getApi) {
        calendarRef.value.getApi().refetchEvents()
      }
    }
  } catch (error) {
    console.log(error)
    Notify.create({
      type: 'negative',
      message: 'Failed to load appointments',
    })
  } finally {
    isLoading.value = false
  }
}

function handleClinicChange(clinic) {
  if (!clinic) return

  clinic_id.value = clinic.id
  therapist_id.value = null
  appointments.value = []
  disabledSlotsFromAPI.value = []

  commonStore.getTherapiests(clinic.id)
}

function handleTherapistChange(therapistId) {
  if (!therapistId) return

  therapist_id.value = therapistId
  appointments.value = []
  disabledSlotsFromAPI.value = []

  if (clinic_id.value) {
    fetchAppointments()
  }
}
</script>

<style scoped>
/* Calendar custom styling */
:deep(.fc) {
  font-family: inherit;
}

:deep(.fc-bg-event) {
  cursor: not-allowed !important;
  pointer-events: none !important;
  opacity: 0.7 !important;
}

:deep(.fc-event) {
  cursor: pointer;
  border-radius: 4px;
  padding: 2px 4px;
  font-size: 0.85em;
  margin: 1px 2px;
}

:deep(.fc-timegrid-slot) {
  height: 0.5em !important;
}

:deep(.fc-timegrid-now-indicator-line) {
  border-color: #ff4444;
}

:deep(.fc-timegrid-now-indicator-arrow) {
  border-color: #ff4444;
}

:deep(.fc-timegrid-slot-label) {
  font-size: 0.9em;
}

:deep(.fc-timegrid-col.fc-day-today) {
  background-color: rgba(255, 220, 40, 0.15);
}

:deep(.fc-event-title) {
  font-weight: 500;
}
</style>
