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
                emit-value
                map-options
                options-dense
                dense
                @update:model-value="getTherapiests"
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
        <q-card-section>
          <div class="row justify-center q-mt-lg">
            <q-calendar-day
              :key="calendarKey"
              ref="calendar"
              v-model="selectedDate"
              :mode="mode"
              :view="view"
              :interval-minutes="15"
              :interval-start="32"
              :interval-count="44"
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
                    <q-badge
                      v-if="!event.time"
                      :class="badgeClasses(event, 'header')"
                      :style="badgeStyles(event, 'header')"
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
                      :style="badgeStyles(event, 'header')"
                      style="
                        margin: 1px;
                        width: 10px;
                        max-width: 10px;
                        height: 10px;
                        max-height: 10px;
                      "
                      @click="scrollToEvent(event)"
                    >
                      <q-tooltip>{{ event.time + ' - ' + event.details }}</q-tooltip>
                    </q-badge>
                  </template>
                </div>
              </template>
              <template #day-body="{ scope: { timestamp, timeStartPos, timeDurationHeight } }">
                <template v-for="event in getEvents(timestamp.date)" :key="event.id">
                  <div
                    v-if="event.time !== undefined"
                    class="my-event"
                    :class="badgeClasses(event, 'body')"
                    :style="badgeStyles(event, 'body', timeStartPos, timeDurationHeight)"
                    @click="selectEvent(event)"
                  >
                    <span class="event-title q-calendar__ellipsis">
                      {{ event.title }}
                      <q-tooltip>
                        <div v-if="event.isGroup">
                          <div v-for="(ev, idx) in event.events" :key="idx">
                            {{ ev.therapist }} - {{ ev.bed }} ({{ ev.time }})
                          </div>
                        </div>
                        <div v-else>{{ event.therapist }} - {{ event.bed }}</div>
                      </q-tooltip>
                    </span>
                  </div>
                </template>
              </template>
            </q-calendar-day>
          </div>
        </q-card-section>
      </q-card>
    </div>
    <q-dialog v-model="bookSlotModal">
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
          <q-card-section class="q-pt-none">
            <div class="q-pa-md">
              <div class="q-pa-md">
                <div class="q-gutter-sm">
                  <q-chip square color="teal" text-color="white" class="q-ma-md">
                    {{ startEndDates[0] }}
                  </q-chip>
                  TO
                  <q-chip color="teal" text-color="white" class="q-ma-md">
                    {{ addMinutes(startEndDates[1]) }}
                  </q-chip>
                </div>

                <div class="q-gutter-md row items-start">
                  <div class="col-md-12">
                    <q-select
                      v-model="activeSlot.therapist_id"
                      :options="therapists"
                      emit-value
                      map-options
                      label="Select Therapist"
                      outlined
                      dense
                    />
                  </div>
                  <div class="col-md-12">
                    <q-select
                      v-model="activeSlot.bed_id"
                      :options="beds"
                      emit-value
                      map-options
                      label="Select Bed"
                      outlined
                      dense
                    />
                  </div>
                </div>
              </div>
            </div>
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
    </q-dialog>
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
import { Dialog } from 'quasar'
import { useAppointmentStore } from 'src/stores/appointmentStore'
import { useCommonStore } from 'src/stores/commonStore'
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'

/* ---------------- STATE ---------------- */

const appointmentStore = useAppointmentStore()
const { appointments, INTERVAL_MINUTES } = storeToRefs(appointmentStore)

const route = useRoute()
const commonStore = useCommonStore()
const { clinics, therapiests } = storeToRefs(commonStore)

const clinicId = route.params.clinic_id
const therapistId = route.params.therapist_id

const clinic_id = ref(route.params.clinic_id)
const therapist_id = ref(route.params.therapist_id)

const mode = ref('day')
const view = ref('day')

const calendar = ref(null)
const selectedDate = ref(today())

const anchorTimestamp = ref(null)
const otherTimestamp = ref(null)

const mouseDown = ref(false)
const mobile = ref(false)

const loading = ref(false)

const bookSlotModal = ref(false)
const activeSlot = ref({
  id: null,
  therapist_id: null,
  bed_id: null,
})

const calendarKey = ref(0)

const therapists = ref([
  {
    label: 'Therapist 1',
    value: 1,
  },
  {
    label: 'Therapist 2',
    value: 2,
  },
  {
    label: 'Therapist 3',
    value: 3,
  },
])

const beds = ref([
  {
    label: 'Bed 1',
    value: 1,
  },
  {
    label: 'Bed 2',
    value: 2,
  },
  {
    label: 'Bed 3',
    value: 3,
  },
])

const timeStartPos = ref(0)
const currentDate = ref(null)
const currentTime = ref(null)
let intervalId = null

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

  appointments.value?.forEach((event) => {
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
  return appointments.value
    .filter((a) => a.isDisabled)
    .map((a) => ({
      date: a.start.split(' ')[0], // YYYY-MM-DD
      start: a.start.split(' ')[1], // HH:mm
      end: a.end.split(' ')[1], // HH:mm
    }))
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
  }
  // update current time every minute
  intervalId = setInterval(() => {
    adjustCurrentTime()
  }, 60000)
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

function onMouseDownTime({ scope, event }) {
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
  if (mobile.value !== true && leftClick(event)) {
    otherTimestamp.value = scope.timestamp
    mouseDown.value = false
    bookSlotModal.value = true
  }
}

function onMouseMoveTime({ scope }) {
  if (mobile.value !== true && mouseDown.value === true) {
    otherTimestamp.value = scope.timestamp
  }
}

/* ---------------- NAVIGATION ---------------- */

async function onToday() {
  if (calendar.value) {
    await calendar.value.moveToToday()
  }
  await getAppointments()
}

async function onPrev() {
  if (calendar.value) {
    await calendar.value.prev()
  }
  await getAppointments()
}

async function onNext() {
  if (calendar.value) {
    await calendar.value.next()
  }
  await getAppointments()
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
  appointments.value = []
  appointmentStore.getAppointments(clinic_id.value, therapist_id.value, selectedDate.value)
}

function addMinutes(dateTime) {
  const d = new Date(dateTime)
  d.setMinutes(d.getMinutes() + INTERVAL_MINUTES.value)
  return (
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ` +
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  )
}

function getDurationInMinutes(start, end) {
  return (new Date(end) - new Date(start)) / 60000
}

function confirmBooking() {
  const start = startEndDates.value[0]
  const end = addMinutes(startEndDates.value[1])

  const date = start.split(' ')[0]
  const time = start.split(' ')[1]
  const duration = getDurationInMinutes(start, end)

  appointments.value.push({
    id: null,
    title: 'Client',
    therapist: `Therapiest ${activeSlot.value.therapist_id}`,
    bed: `Bed ${activeSlot.value.bed_id}`,
    date: date,
    time: time,
    duration: duration,
    bgcolor: 'teal',
  })
  console.log('appointments', appointments.value)

  bookSlotModal.value = false
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

function selectEvent(event) {
  console.log('event selected', event)

  Dialog.create({
    title: `Appointments at ${event.time}`,
    message: `${event.therapist} - ${event.bed}: ${event.duration} minutes`,
    html: true,
  })
}

function getTherapiests(val) {
  activeSlot.value.therapist_id = null
  commonStore.getTherapiests(val)
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
      backgroundColor: 'rgb(255 207 207 / 35%)',
      pointerEvents: 'none',
      cursor: 'not-allowed !important',
    }
  }
}

/* ---------------- EVENT LOGIC ---------------- */

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

/* For better visibility of overlapping events */
.my-event:nth-child(4n + 1) {
  background: linear-gradient(to right, var(--q-primary), #1976d2);
}

.my-event:nth-child(4n + 2) {
  background: linear-gradient(to right, var(--q-secondary), #7b1fa2);
}

.my-event:nth-child(4n + 3) {
  background: linear-gradient(to right, var(--q-accent), #c2185b);
}

.my-event:nth-child(4n + 4) {
  background: linear-gradient(to right, #388e3c, #2e7d32);
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
</style>
