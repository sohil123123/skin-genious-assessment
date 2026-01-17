<template>
  <q-page class="q-pa-md">
    <q-card class="q-pa-md">
      <q-card-section>
        <div class="row q-col-gutter-sm">
          <div v-if="!clinicId" class="col-md-3 col-sm-6 col-xs-12">
            <q-select
              label="Select Clinic"
              outlined
              v-model="clinic"
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
        <EmergencyWarning :warnings="warning" />
        <ServerErrorDialog v-model="showErrorDialog" :error="selectedError" />
        <FullCalendar ref="calendarRef" :options="calendarOptions" />
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
  <!-- Add/Edit dialog -->
  <q-dialog v-model="showDialog" persistent @hide="resetForm">
    <CreateUpdateModal
      :clients="clients"
      :clinic="clinic"
      v-model:appointmentData="appointmentData"
      @submit="handleSave"
    />
  </q-dialog>

  <AppointmentDetailsDialog
    v-model="showDetailDialog"
    :event="selectedEvent"
    @edit="handleEdit"
    @delete="handleDelete"
    @fetchAppointments="fetchAppointments"
  />
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { Loading, Notify, date, Dialog } from 'quasar'
import FullCalendar from '@fullcalendar/vue3'
import timeGridPlugin from '@fullcalendar/timegrid'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useRoute } from 'vue-router'
import { useCommonStore } from 'src/stores/commonStore'
import { storeToRefs } from 'pinia'
import { useAppointmentStore } from 'src/stores/appointmentStore'
import CreateUpdateModal from 'src/components/appointment/CreateUpdateModal.vue'
import { api } from 'src/boot/axios'
import EmergencyWarning from 'src/components/common/EmergencyWarning.vue'
import AppointmentDetailsDialog from 'src/components/appointment/AppointmentDetails.vue'
import ServerErrorDialog from 'src/components/common/ServerErrorDialog.vue'

// ------------------ STORES ------------------
const commonStore = useCommonStore()
const { clinics, therapiests, clients } = storeToRefs(commonStore)
const appointmentStore = useAppointmentStore()
const { warning, selectedError, showErrorDialog } = storeToRefs(appointmentStore)

/* ------------------ CONSTANTS ------------------ */
const route = useRoute()
const clinicId = route.params.clinic_id ? parseInt(route.params.clinic_id) : null
const therapistId = route.params.therapist_id ? parseInt(route.params.therapist_id) : null

/* ------------------ REFS ------------------ */
const calendarRef = ref(null)
const showDialog = ref(false)
const showDetailDialog = ref(false)
const isEditMode = ref(false)
const selectedEvent = ref(null)
const patientInput = ref(null)
const appointmentData = ref({
  id: null,
  type: null,
  clinic_id: null,
  therapist_id: null,
  user_id: null,
  assessment_id: null,
  treatment_session_id: null,
  start_datetime: null,
  end_datetime: null,
  notes: '',
  status: 'confirmed',
})

const initialAppointmentData = {
  id: null,
  type: null,
  clinic_id: null,
  therapist_id: null,
  user_id: null,
  assessment_id: null,
  treatment_session_id: null,
  start_datetime: null,
  end_datetime: null,
  notes: '',
  status: 'confirmed',
}

const clinic_id = ref(clinicId)
const clinic = ref(null)
const therapist_id = ref(therapistId)

const appointments = ref([])
const disabledSlotsFromAPI = ref([])
const isLoading = ref(false)

const formatDate = (iso) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/* ------------------ REACTIVE STATE ------------------ */
const form = ref({
  title: '',
  start: '',
  end: '',
})

/* ------------------ COMPUTED ------------------ */
const selectedClinicData = computed(() => {
  if (route.params.clinic_id) return clinic.value
  else return clinics.value.find((clinic) => clinic.id === clinic_id.value)
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
    await getClinicById(route.params.clinic_id)
    await commonStore.getTherapiests(clinicId)
    commonStore.getClients(route.params.clinic_id)
  } else {
    await commonStore.getClinics()
  }

  if (therapistId) {
    therapist_id.value = therapistId
  }
})

/* ------------------ UTILITY FUNCTIONS ------------------ */
// function formatDateTime(dateTime) {
//   if (!dateTime) return ''
//   return date.formatDate(dateTime, 'YYYY-MM-DD HH:mm')
// }

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
  eventOverlap: true,
  selectOverlap: true,
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
    resetAppointmentData()
    appointmentData.value.start_datetime = formatDate(info.start)
    appointmentData.value.end_datetime = formatDate(info.end)

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
    selectedEvent.value = info.event.extendedProps.originalData
    selectedEvent.value.start_datetime = `${selectedEvent.value.start_date} ${selectedEvent.value.start_time}`
    selectedEvent.value.end_datetime = `${selectedEvent.value.end_date} ${selectedEvent.value.end_time}`
    setAppointmentData()
    isEditMode.value = true
    showDetailDialog.value = true
  },

  eventDrop: async (info) => {
    // 1️⃣ Block disabled slots
    if (info.event.extendedProps?.isDisabledSlot) {
      info.revert()
      return
    }

    // 2️⃣ Get UPDATED times (this is now correct)
    const newStart = info.event.start
    const newEnd = info.event.end

    // 3️⃣ Update your original data model
    selectedEvent.value = info.event.extendedProps.originalData
    selectedEvent.value.start_datetime = formatDate(newStart)
    selectedEvent.value.end_datetime = formatDate(newEnd)
    isEditMode.value = true

    // 4️⃣ Persist / sync
    setAppointmentData()

    // 5️⃣backend save
    await handleSave()
  },

  eventResize: async (info) => {
    // 1️⃣ Block disabled slots
    if (info.event.extendedProps?.isDisabledSlot) {
      info.revert()
      return
    }

    // 2️⃣ Get UPDATED times (this is now correct)
    const newStart = info.event.start
    const newEnd = info.event.end

    // 3️⃣ Update your original data model
    selectedEvent.value = info.event.extendedProps.originalData
    selectedEvent.value.start_datetime = formatDate(newStart)
    selectedEvent.value.end_datetime = formatDate(newEnd)
    isEditMode.value = true

    // 4️⃣ Persist / sync
    setAppointmentData()

    // 5️⃣backend save
    await handleSave()
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
function handleEdit() {
  isEditMode.value = true
  showDialog.value = true
}

async function handleSave() {
  if (!appointmentData.value.type) {
    Notify.create({
      type: 'negative',
      message: 'Please select an appointment type',
    })
    return
  }

  try {
    let success = false

    if (isEditMode.value) {
      Loading.show({ message: 'Updating Appointment...' })
      success = await appointmentStore.updateAppointment(appointmentData.value)
      // ❌ Stop here if API failed
      if (!success) return
    } else {
      Loading.show({ message: 'Booking Appointment...' })

      appointmentData.value.therapist_id = therapist_id.value
      appointmentData.value.clinic_id = clinic_id.value

      success = await appointmentStore.storeAppointments(appointmentData.value)

      // ❌ Stop here if API failed
      if (!success) return
    }

    resetAppointmentData()
    closeDialog()
    Notify.create({
      type: 'positive',
      message: isEditMode.value ? 'Appointment updated' : 'Appointment created',
    })
  } catch (error) {
    console.error(error)
    Notify.create({
      type: 'negative',
      message: error.message,
    })
  } finally {
    fetchAppointments()
    isEditMode.value = false
    showDetailDialog.value = false
    Loading.hide()
  }
}

function resetAppointmentData() {
  Object.assign(appointmentData.value, { ...initialAppointmentData })
}

function handleDelete(eventId) {
  Dialog.create({
    title: 'Delete Appointment',
    message: 'Are you sure?',
    cancel: true,
    ok: {
      label: 'Delete',
      color: 'negative',
    },
  }).onOk(async () => {
    await appointmentStore.deleteAppointment(eventId)
    fetchAppointments()
    showDetailDialog.value = false
  })
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

function setAppointmentData() {
  appointmentData.value = {
    id: selectedEvent.value.id,
    type: selectedEvent.value.meta.type,
    start_datetime: selectedEvent.value.start_datetime,
    end_datetime: selectedEvent.value.end_datetime,
    notes: selectedEvent.value.notes || '',
    status: selectedEvent.value.status || 'confirmed',
    client_id: selectedEvent.value.meta.client_id || null,
    therapist_id: selectedEvent.value.meta.therapist_id || null,
    user_id: selectedEvent.value.meta.client_id || null,
    assessment_id: selectedEvent.value.meta.assessment_id || null,
    treatment_session_id: selectedEvent.value.meta.treatment_session_id || null,
  }
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

async function getClinicById(id) {
  api
    .get(`get-clinics?id=${id}&is_first=1`)
    .then((res) => {
      clinic.value = res.data.results
      console.log(clinic.value)
    })
    .catch((error) => {
      Notify.create({
        type: 'negative',
        message: error.response.data.message,
      })
    })
}

function handleClinicChange(clinic) {
  if (!clinic) return
  clinic.value = clinic
  clinic_id.value = clinic.id
  therapist_id.value = null
  appointments.value = []
  disabledSlotsFromAPI.value = []

  commonStore.getTherapiests(clinic.id)
  commonStore.getClients(clinic.id)
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
