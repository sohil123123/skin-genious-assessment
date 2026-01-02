<template>
  <q-page>
    <div class="min-h-screen bg-grey-2 p-6">
      <q-card bordered>
        <q-toolbar class="text-primary calander-toolbar">
          <div class="col-md-4">
            <q-btn color="grey" outline square icon="arrow_back_ios" @click="onPrev" />
            <q-btn color="grey" outline square label="Today" @click="onToday" />
            <q-btn color="grey" outline square icon="arrow_forward_ios" @click="onNext" />
          </div>
          <div class="col-md-4 text-h4" style="text-align: center">
            {{ title }}
          </div>
          <div flat class="col-md-4 q-pa-md q-gutter-sm flex justify-end">
            <q-tabs v-model="view" class="text-teal">
              <q-tab
                name="month"
                icon="calendar_view_month"
                label="Month"
                @click="changeMod('week', 'month')"
              />
              <q-tab
                name="week"
                icon="calendar_view_week"
                label="Week"
                @click="changeMod('day', 'week')"
              />
              <q-tab
                name="day"
                icon="calendar_today"
                label="Day"
                @click="changeMod('day', 'day')"
              />
            </q-tabs>
          </div>
        </q-toolbar>
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
          <EmergencyWarning :warning="warning" />
          <div class="row justify-center q-mt-lg">
            <q-calendar-day
              :key="calendarKey"
              ref="calendar"
              v-model="selectedDate"
              :mode="mode"
              :view="view"
              :disabled-days="leaveFullDayDates"
              :interval-minutes="15"
              :interval-start="intervalStart"
              :interval-count="intervalCount"
              :interval-height="15"
              :interval-style="intervalStyle"
              time-clicks-clamped
              :selected-start-end-dates="startEndDates"
              animated
              bordered
              @mousedown-time="onMouseDownTime"
              @mouseup-time="onMouseUpTime"
              @mousemove-time="onMouseMoveTime"
              @click-interval="onClickInterval"
              @click-head-intervals="onClickHeadIntervals"
              @click-head-day="onClickHeadDay"
              @change="onChange"
            >
              <template #day-container="{ scope: { days } }">
                <template v-if="hasDate(days)">
                  <div class="day-view-current-time-indicator" :style="style" />
                  <div class="day-view-current-time-line" :style="style" />
                </template>
              </template>
              <template #head-day-event="{ scope: { timestamp } }">
                <div style="display: flex; justify-content: center; flex-wrap: wrap; padding: 2px">
                  <template v-for="event in eventsMap[timestamp.date]" :key="event.id">
                    <div v-if="event.type === 'appointment' && event.type !== undefined">
                      <q-badge
                        v-if="!event.time"
                        :class="badgeClasses(event, 'header')"
                        :style="[
                          badgeStyles(event, 'header'),
                          'background-color: ' + event.bgcolor,
                        ]"
                        style="
                          width: 100%;
                          cursor: pointer;
                          height: 12px;
                          font-size: 10px;
                          margin: 1px;
                        "
                      >
                        <span class="event-title q-calendar__ellipsis">
                          {{ event.title }}
                          <q-tooltip>{{ event.details }}</q-tooltip>
                        </span>
                      </q-badge>
                      <q-badge
                        v-else
                        :class="badgeClasses(event, 'header')"
                        :style="[
                          badgeStyles(event, 'header'),
                          'background-color: ' + event.bgcolor,
                        ]"
                        style="
                          margin: 1px;
                          width: 10px;
                          max-width: 10px;
                          height: 10px;
                          max-height: 10px;
                        "
                        @click="scrollToEvent(event)"
                      >
                        <q-tooltip>{{ event.time + ' - ' + event.title }}</q-tooltip>
                      </q-badge>
                    </div>
                  </template>
                </div>
              </template>
              <template #day-body="{ scope: { timestamp, timeStartPos, timeDurationHeight } }">
                <template v-for="event in getEvents(timestamp.date)" :key="event.id">
                  <!-- ONLY appointments render -->
                  <div
                    v-if="event.type === 'appointment' && event.time !== undefined"
                    class="my-event"
                    :class="badgeClasses(event, 'body')"
                    :style="[
                      badgeStyles(event, 'body', timeStartPos, timeDurationHeight),
                      'background-color: ' + event.bgcolor,
                    ]"
                    @click="openEventDetails(event)"
                    @mousedown.stop="startDrag(event)"
                  >
                    <span class="event-title q-calendar__ellipsis">
                      {{ event.title }}
                    </span>
                    <q-tooltip>
                      {{
                        event.time + ' - ' + event.meta.client + ' (' + event.duration + ' mins)'
                      }}
                    </q-tooltip>
                  </div>
                </template>

                <!-- ghost preview -->
                <div
                  v-if="
                    ghostEvent &&
                    ghostEvent.date === timestamp.date &&
                    ghostEvent.time === timestamp.time
                  "
                  class="calendar-event ghost"
                  :style="badgeStyles(ghostEvent, timeStartPos, timeDurationHeight)"
                >
                  {{ ghostEvent.title }}
                </div>
              </template>
              <template #day-interval="{ scope }">
                <q-tooltip v-if="isIntervalDisabled(scope.timestamp.date, scope.timestamp.time)">
                  {{ getDisabledEvent(scope.timestamp.date, scope.timestamp.time)?.title }}
                </q-tooltip>
              </template>
            </q-calendar-day>
          </div>
        </q-card-section>
        <q-card-section v-else>
          <div class="text-center q-py-xl">
            <q-icon name="calendar_month" size="xl" color="grey-4" class="q-mb-md" />
            <div class="text-h6 text-grey-6 q-mb-sm">No Clinic & Therapist Selected</div>
            <div class="text-grey-7">Start by selecting a clinic and therapist</div>
          </div>
        </q-card-section>
      </q-card>
    </div>
    <q-dialog v-model="bookSlotModal">
      <CreateUpdateModal
        :appointment-types="appointmentTypes"
        :status-options="statusOptions"
        :clients="clients"
        v-model:activeSlot="activeSlot"
        @submit="handleSubmit"
      />
    </q-dialog>

    <AppointmentDetailsDialog
      v-model="showDetailDialog"
      :event="selectedEvent"
      @edit="handleEdit"
      @delete="handleDelete"
    />
  </q-page>
</template>
<script setup>
import {
  QCalendarDay,
  today,
  getDayTimeIdentifier,
  getDateTime,
  parseDate,
  addToDate,
  parseTimestamp,
  // parseTime,
  // parsed,
  // isBetweenDates,
} from '@quasar/quasar-ui-qcalendar'
import '@quasar/quasar-ui-qcalendar/index.css'
import { storeToRefs } from 'pinia'
import { Dialog, Loading, Notify } from 'quasar'
import CreateUpdateModal from 'src/components/appointment/CreateUpdateModal.vue'
import { useAppointmentStore } from 'src/stores/appointmentStore'
import { useCommonStore } from 'src/stores/commonStore'
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import EmergencyWarning from 'src/components/common/EmergencyWarning.vue'
import AppointmentDetailsDialog from 'src/components/appointment/AppointmentDetails.vue'

/* ---------------- STATE ---------------- */

const appointmentStore = useAppointmentStore()
const {
  otherEvents,
  leaveFullDayDates,
  appointmentTypes,
  statusOptions,
  intervalStart,
  intervalCount,
  INTERVAL_MINUTES,
  warning,
} = storeToRefs(appointmentStore)

const route = useRoute()
const commonStore = useCommonStore()
const { clinics, therapiests, clients } = storeToRefs(commonStore)

const clinicId = route.params.clinic_id
const therapistId = route.params.therapist_id

const clinic_id = ref(route.params.clinic_id)
const therapist_id = ref(route.params.therapist_id)

const mode = ref('day')
const view = ref('week')
const startDate = ref(null)
const endDate = ref(null)

const calendar = ref(null)
const selectedDate = ref(today())

const anchorTimestamp = ref(null)
const otherTimestamp = ref(null)

const mouseDown = ref(false)
const mobile = ref(false)
const draggingEvent = ref(null)
const ghostEvent = ref(null)

const bookSlotModal = ref(false)
const activeSlot = ref({
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

const calendarKey = ref(0)

const timeStartPos = ref(0)
const currentDate = ref(null)
const currentTime = ref(null)
let intervalId = null

const showDetailDialog = ref(false)
const selectedEvent = ref(null)

/* ---------------- COMPUTED ---------------- */

const style = computed(() => {
  return {
    top: timeStartPos.value + 'px',
  }
})

const title = computed(() => {
  const date = new Date(selectedDate.value)
  return monthFormatter().format(date) + ' ' + date.getFullYear()
})

const anchorDayTimeIdentifier = computed(() => {
  if (anchorTimestamp.value !== null) {
    return getDayTimeIdentifier(anchorTimestamp.value)
  }
  return false
})

const otherDayTimeIdentifier = computed(() => {
  if (otherTimestamp.value !== null) {
    return getDayTimeIdentifier(otherTimestamp.value)
  }
  return false
})

const startEndDates = computed(() => {
  const dates = []
  if (anchorDayTimeIdentifier.value !== false && otherDayTimeIdentifier.value !== false) {
    if (anchorDayTimeIdentifier.value <= otherDayTimeIdentifier.value) {
      dates.push(getDateTime(anchorTimestamp.value), getDateTime(otherTimestamp.value))
    } else {
      dates.push(getDateTime(otherTimestamp.value), getDateTime(anchorTimestamp.value))
    }
  }

  return dates
})

// Map events by date
const eventsMap = computed(() => {
  const map = {}

  otherEvents.value?.forEach((event) => {
    const addEventToMap = (date) => {
      if (!map[date]) {
        map[date] = []
      }
      map[date].push(event)
    }

    addEventToMap(event.date)

    if (event.days) {
      let timestamp = parseTimestamp(event.date)
      if (timestamp) {
        for (let i = 1; i < event.days; i++) {
          timestamp = addToDate(timestamp, { day: 1 })
          addEventToMap(timestamp.date)
        }
      }
    }
  })

  return map
})

const disabledSlots = computed(() => {
  return otherEvents.value
    .filter((e) => e.type !== 'appointment')
    .map((e) => {
      const [h, m] = e.time.split(':').map(Number)
      const startMinutes = h * 60 + m
      const endMinutes = startMinutes + e.duration

      const toTime = (mins) =>
        `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`

      return {
        date: e.date, // YYYY-MM-DD
        start: toTime(startMinutes), // HH:mm
        end: toTime(endMinutes), // HH:mm
        title: e.title, // ✅ IMPORTANT
        type: e.type,
      }
    })
})

const mergedDisabledSlots = computed(() => {
  const slots = [...disabledSlots.value].sort((a, b) => a.start.localeCompare(b.start))

  const merged = []

  for (const slot of slots) {
    const last = merged[merged.length - 1]

    if (last && last.date === slot.date && last.end === slot.start) {
      last.end = slot.end
    } else {
      merged.push({ ...slot })
    }
  }

  return merged
})

/* ---------------- LIFECYCLE ---------------- */

onMounted(() => {
  adjustCurrentTime()
  if (!route.params.clinic_id) commonStore.getClinics()

  if (route.params.clinic_id) {
    commonStore.getTherapiests(route.params.clinic_id)
    commonStore.getClients(route.params.clinic_id)
  }
  // update current time every minute
  intervalId = setInterval(() => {
    adjustCurrentTime()
  }, 500)
})

onBeforeUnmount(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})

watch(selectedDate, () => {
  calendarKey.value++
})

/* ---------------- MOUSE EVENTS ---------------- */

function startDrag(event) {
  draggingEvent.value = event
}

function onMouseDownTime({ scope, event }) {
  if (isIntervalDisabled(scope.timestamp.date, scope.timestamp.time)) {
    return // ❌ block drag
  }
  if (leftClick(event)) {
    if (
      mobile.value === true &&
      anchorTimestamp.value !== null &&
      otherTimestamp.value !== null &&
      getDateTime(anchorTimestamp.value) === getDateTime(otherTimestamp.value)
    ) {
      otherTimestamp.value = scope.timestamp
      mouseDown.value = false
      return
    }

    mouseDown.value = true
    anchorTimestamp.value = scope.timestamp
    otherTimestamp.value = scope.timestamp
  }
}

function onMouseUpTime({ scope, event }) {
  if (isIntervalDisabled(scope.timestamp.date, scope.timestamp.time)) {
    return // ❌ block drag
  }
  resetActiveSlot()
  if (!clinic_id.value && !therapist_id.value) {
    Notify.create({
      type: 'warning',
      message: 'Please select a clinic and therapist',
    })
    mouseDown.value = false
    return
  }
  if (mobile.value !== true && leftClick(event)) {
    otherTimestamp.value = scope.timestamp
    mouseDown.value = false

    activeSlot.value.start_datetime = startEndDates.value[0]
    activeSlot.value.end_datetime = commonStore.addMinutes(startEndDates.value[1])

    bookSlotModal.value = true

    // ----------------------------------

    if (!draggingEvent.value) return

    // console.log(draggingEvent.value.id, scope.timestamp.date, scope.timestamp.time)

    draggingEvent.value = null
    ghostEvent.value = null
  }
}

function onMouseMoveTime({ scope }) {
  if (mobile.value !== true && mouseDown.value === true) {
    otherTimestamp.value = scope.timestamp

    // ----------------------------------
    if (!draggingEvent.value) return

    const { date, time } = scope.timestamp

    // prevent ghost on disabled slots
    if (isIntervalDisabled(date, time)) return

    ghostEvent.value = {
      ...draggingEvent.value,
      date,
      time,
    }
  }
}

/* ---------------- NAVIGATION ---------------- */

async function onToday() {
  if (calendar.value) {
    await calendar.value.moveToToday()
  }
}

async function onPrev() {
  if (calendar.value) {
    await calendar.value.prev()
  }
}

async function onNext() {
  if (calendar.value) {
    await calendar.value.next()
  }
}

/* ---------------- CALENDAR EVENTS ---------------- */

function onClickInterval(data) {
  console.info('onClickInterval', data)
}

function onClickHeadIntervals(data) {
  console.info('onClickHeadIntervals', data)
}

function onClickHeadDay(data) {
  console.info('onClickHeadDay', data)
}

/* ---------------- HELPER ---------------- */

function changeMod(type, cview) {
  mode.value = type
  view.value = cview
}

function leftClick(e) {
  return e.button === 0
}

function monthFormatter() {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'long',
    })
  } catch (e) {
    console.log(e)
  }
}

// function getCurrentDay(day) {
//   const newDay = new Date(CURRENT_DAY)
//   newDay.setDate(day)
//   const tm = parseDate(newDay)
//   return tm ? tm.date : null
// }

async function getAppointments() {
  // otherEvents.value = []
  if (clinic_id.value && therapist_id.value && startDate.value && endDate.value)
    appointmentStore.getAppointments(
      clinic_id.value,
      therapist_id.value,
      startDate.value,
      endDate.value,
    )
}

function getDurationInMinutes(start, end) {
  return (new Date(end) - new Date(start)) / 60000
}

function resetActiveSlot() {
  activeSlot.value = {
    id: null,
    type: null,
    clinic_id: clinic_id.value,
    therapist_id: therapist_id.value,
    user_id: null,
    assessment_id: null,
    treatment_session_id: null,
    start_datetime: null,
    end_datetime: null,
    notes: '',
    status: 'confirmed',
  }
}

async function handleSubmit() {
  if (!activeSlot.value.type) {
    Notify.create({
      type: 'negative',
      message: 'Please select an appointment type',
    })
    return
  }

  const start = activeSlot.value.start_datetime
  const end = activeSlot.value.end_datetime

  const date = start.split(' ')[0]
  const time = start.split(' ')[1]
  const duration = getDurationInMinutes(start, end)
  Loading.show({
    message: 'Booking Appointment...',
  })
  if (!activeSlot.value.id) {
    await appointmentStore.addAppointment({
      id: Date.now(), // safe unique id
      title: 'Booked',
      date,
      time,
      duration,
      type: activeSlot.value.type,
      status: activeSlot.value.status,
      assessment_id: activeSlot.value.assessment_id,
      treatment_session_id: activeSlot.value.treatment_session_id,
      bgcolor: 'teal',
      notes: activeSlot.value.notes,
      meta: {
        clinic: clinic_id.value,
        therapist: therapist_id.value,
        client: activeSlot.value.client_id,
      },
    })
  } else {
    await appointmentStore.updateAppointment({
      id: activeSlot.value.id,
      title: 'Booked',
      date,
      time,
      duration,
      type: activeSlot.value.type,
      status: activeSlot.value.status,
      assessment_id: activeSlot.value.assessment_id,
      treatment_session_id: activeSlot.value.treatment_session_id,
      bgcolor: 'teal',
      notes: activeSlot.value.notes,
      meta: {
        clinic: clinic_id.value,
        therapist: therapist_id.value,
        client: activeSlot.value.client_id,
      },
    })
  }
  getAppointments()
  Loading.hide()
  bookSlotModal.value = false
  showDetailDialog.value = false
  resetActiveSlot()
}

function hasDate(days) {
  return currentDate.value ? days.find((day) => day.date === currentDate.value) : false
}

function adjustCurrentTime() {
  const now = parseDate(new Date())

  if (now) {
    currentDate.value = now.date
    currentTime.value = now.time

    if (calendar.value) {
      timeStartPos.value = calendar.value.timeStartPos(currentTime.value, false)
    }
  }
}

function openEventDetails(event) {
  selectedEvent.value = event
  showDetailDialog.value = true
}

async function handleEdit(eventId) {
  await getAppointmentById(eventId)
  bookSlotModal.value = true
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
  }).onOk(() => {
    appointmentStore.deleteAppointment(eventId)
    showDetailDialog.value = false
  })
}

async function getAppointmentById(id) {
  const appointment = await appointmentStore.getAppointmentById(id)
  if (appointment) {
    activeSlot.value = {
      id: appointment.id,
      type: appointment.type,
      clinic_id: clinic_id.value,
      therapist_id: therapist_id.value,
      client_id: appointment.user_id || null,
      assessment_id: appointment.assessment_id || null,
      treatment_session_id: appointment.treatment_session_id || null,
      start_datetime: appointmentStore.convertToIST(appointment.start_datetime),
      end_datetime: appointmentStore.convertToIST(appointment.end_datetime),
      notes: appointment.notes || '',
      status: appointment.status || 'confirmed',
    }
  }
}

function getSelectedVal(val) {
  setStartEndTime(val)
  therapist_id.value = null
  activeSlot.value.client_id = null
  clinic_id.value = val.id
  commonStore.getTherapiests(val.id)
  commonStore.getClients(val.id)
}

function setStartEndTime(clinic) {
  const openingTime = clinic.start_time || '08:00'
  const closingTime = clinic.end_time || '18:00'

  const [openHour, openMinute] = openingTime.split(':').map(Number)
  const [closeHour, closeMinute = 0] = closingTime.split(':').map(Number)

  // set selected date
  const today = new Date()
  today.setHours(openHour, openMinute, 0, 0)
  selectedDate.value = today.toISOString().slice(0, 10)

  const startMinutes = openHour * 60 + openMinute
  const endMinutes = closeHour * 60 + closeMinute

  intervalStart.value = startMinutes / INTERVAL_MINUTES.value
  intervalCount.value = (endMinutes - startMinutes) / INTERVAL_MINUTES.value
}

function isIntervalDisabled(date, time) {
  const toMinutes = (t) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }

  const current = toMinutes(time)

  return mergedDisabledSlots.value.some((slot) => {
    if (slot.date !== date) return false

    return current >= toMinutes(slot.start) && current < toMinutes(slot.end)
  })
}

function intervalStyle({ scope }) {
  if (!scope?.timestamp) return

  const { date, time } = scope.timestamp

  if (isIntervalDisabled(date, time)) {
    return {
      background: '#e9e9e966',
      // pointerEvents: 'none',
      cursor: 'not-allowed',
    }
  }

  return {}
}

function getDisabledEvent(date, time) {
  const toMinutes = (t) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }

  const current = toMinutes(time)

  return mergedDisabledSlots.value.find((slot) => {
    if (slot.date !== date) return false
    return current >= toMinutes(slot.start) && current < toMinutes(slot.end)
  })
}

/* ---------------- EVENT LOGIC ---------------- */

function onChange(dt) {
  startDate.value = dt.start
  endDate.value = dt.end
  appointmentStore.getAppointments(clinic_id.value, therapist_id.value, dt.start, dt.end)
}

function getEvents(dt) {
  const evts = eventsMap.value[dt] || []

  if (evts.length === 0) return []

  // Group events by time slot and assign positions
  const timeSlots = {}

  evts.forEach((event) => {
    if (!event.time) return

    const timeKey = event.time // Use time as key for grouping

    if (!timeSlots[timeKey]) {
      timeSlots[timeKey] = []
    }
    timeSlots[timeKey].push(event)
  })

  // Process each time slot to assign positions
  Object.keys(timeSlots).forEach((timeKey) => {
    const eventsInSlot = timeSlots[timeKey]

    // Sort events by duration (optional)
    eventsInSlot.sort((a, b) => (b.duration || 0) - (a.duration || 0))

    // Assign column positions
    const maxColumns = 4 // Maximum number of columns to divide into
    const columns = Array(maxColumns)
      .fill(null)
      .map(() => [])

    // Simple column assignment based on index
    eventsInSlot.forEach((event, index) => {
      const column = Math.min(index, maxColumns - 1)
      event.column = column
      event.totalColumns = Math.min(eventsInSlot.length, maxColumns)
      columns[column].push(event)
    })
  })

  return evts
}

function scrollToEvent(event) {
  if (calendar.value && event.time) {
    calendar.value.scrollToTime(event.time, 350)
  }
}

/* ---------------- STYLING HELPERS ---------------- */

function badgeClasses(event, type) {
  const isHeader = type === 'header'

  return {
    [`text-white bg-${event.bgcolor}`]: true,
    // 'full-width': !isHeader && (!event.side || event.side === 'full'),
    'left-side': !isHeader && event.side === 'left',
    'right-side': !isHeader && event.side === 'right',
    'rounded-border': true,
  }
}

function badgeStyles(event, type, timeStartPos, timeDurationHeight) {
  const s = {}

  if (timeStartPos && timeDurationHeight && event.time && event.duration) {
    s.top = `${timeStartPos(event.time)}px`
    s.height = `${timeDurationHeight(event.duration)}px`

    // Add width and left positioning for overlapping events
    if (type === 'body' && event.column !== undefined && event.totalColumns !== undefined) {
      const columnWidth = 100 / event.totalColumns
      s.left = `${event.column * columnWidth}%`
      s.width = `calc(${columnWidth}% - 15px)` // Subtracting margin
      s.zIndex = 1000 + event.column // Ensure proper stacking
    }
  }

  s['align-items'] = 'flex-start'
  return s
}
</script>

<style lang="scss">
.my-event {
  position: absolute;
  font-size: 12px;
  justify-content: center;
  margin: 0 2px;
  text-overflow: ellipsis;
  overflow: hidden;
  cursor: pointer;
  opacity: 0.9;
  transition: all 0.2s ease;
  border-left: 3px solid rgba(0, 0, 0, 0.2);
  box-sizing: border-box;
}

.my-event:hover {
  opacity: 1;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.event-title {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 2px 4px;
  font-weight: 500;
}

.rounded-border {
  border-radius: 3px;
}

/* Time indicator styles */
.day-view-current-time-indicator {
  position: absolute;
  left: -5px;
  height: 10px;
  width: 10px;
  margin-top: -4px;
  background-color: rgba(255, 0, 0, 0.8);
  border-radius: 50%;
  z-index: 2000;
}

.day-view-current-time-line {
  position: absolute;
  left: 5px;
  border-top: rgba(255, 0, 0, 0.8) 2px solid;
  width: calc(100% - 5px);
  z-index: 2000;
}

/* For header badges */
.q-badge.header-event {
  margin: 1px;
  min-width: 20px;
  height: 12px;
  font-size: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Ensure events don't overflow their containers */
.my-event .event-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.q-calendar__interval.q-calendar-disabled-slot) {
  background-color: rgba(255, 0, 0, 0.35) !important;
  pointer-events: none !important;
  cursor: not-allowed;
}

.q-calendar .disabled {
  position: relative;
  cursor: not-allowed !important;
}

.q-calendar .disabled::after {
  content: '';
  position: absolute;
  inset: 0;
  background: transparent;
  cursor: not-allowed;
}

/* .my-event {
  cursor: grab;
}

.my-event:active {
  cursor: grabbing;
} */

.calendar-event.ghost {
  opacity: 0.4;
  pointer-events: none;
  border: 2px dashed #666;
}
</style>
