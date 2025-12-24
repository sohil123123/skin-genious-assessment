<template>
  <q-page>
    <div class="min-h-screen bg-grey-2 p-6">
      <q-card bordered>
        <q-toolbar class="text-primary calander-toolbar">
          <div class="col-12 col-md-4">
            <q-btn color="grey" outline square icon="arrow_back_ios" @click="onPrev" />
            <q-btn color="grey" outline square label="Today" @click="onToday" />
            <q-btn color="grey" outline square icon="arrow_forward_ios" @click="onNext" />
          </div>
          <div class="col-md-4 text-h4" style="text-align: center">
            {{ title }}
          </div>
          <div flat class="col-12 col-md-4 q-pa-md q-gutter-sm flex justify-end">
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
          <div class="row justify-center q-mt-lg">
            <q-calendar-day
              ref="calendar"
              v-model="selectedDate"
              :mode="mode"
              :view="view"
              :interval-minutes="15"
              :interval-start="32"
              :interval-count="44"
              :interval-height="15"
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
                  >
                    <span class="event-title q-calendar__ellipsis">
                      {{ event.title }}
                      <q-tooltip>{{ event.therapist }} - {{ event.bed }}</q-tooltip>
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
  parseTime,
  parsed,
  isBetweenDates,
} from '@quasar/quasar-ui-qcalendar'
import '@quasar/quasar-ui-qcalendar/index.css'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
// import CreateUpdateModal from 'src/components/appointment/CreateUpdateModal.vue'

/* ---------------- STATE ---------------- */

const mode = ref('day')
const view = ref('week')

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

const CURRENT_DAY = new Date()
const INTERVAL_MINUTES = 15

const appointments = ref([
  {
    id: 3,
    title: 'Client',
    therapist: 'Therapiest 1',
    bed: 'Bed 1',
    date: getCurrentDay(22),
    time: '10:00',
    duration: 60,
    bgcolor: 'teal',
  },
  {
    id: 4,
    title: 'Client',
    therapist: 'Therapiest 2',
    bed: 'Bed 2',
    date: getCurrentDay(25),
    time: '11:30',
    duration: 90,
    bgcolor: 'teal',
  },
  {
    id: 4,
    title: 'Client',
    therapist: 'Therapiest 2',
    bed: 'Bed 2',
    date: getCurrentDay(25),
    time: '11:30',
    duration: 90,
    bgcolor: 'teal',
  },
  {
    id: 4,
    title: 'Client',
    therapist: 'Therapiest 2',
    bed: 'Bed 2',
    date: getCurrentDay(25),
    time: '11:30',
    duration: 90,
    bgcolor: 'teal',
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

  appointments.value.forEach((event) => {
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

/* ---------------- LIFECYCLE ---------------- */

onMounted(() => {
  adjustCurrentTime()

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

function onToday() {
  calendar.value && calendar.value.moveToToday()
}

function onPrev() {
  calendar.value && calendar.value.prev()
}

function onNext() {
  calendar.value && calendar.value.next()
}

/* ---------------- CALENDAR EVENTS ---------------- */

// function onClickTime (data) {
//   console.info('onClickTime', data)
// }

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

function getCurrentDay(day) {
  const newDay = new Date(CURRENT_DAY)
  newDay.setDate(day)
  const tm = parseDate(newDay)
  return tm ? tm.date : null
}

function addMinutes(dateTime) {
  const d = new Date(dateTime)
  d.setMinutes(d.getMinutes() + INTERVAL_MINUTES)
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

/* ---------------- EVENT LOGIC ---------------- */

function getEvents(dt) {
  const evts = eventsMap.value[dt] || []

  if (evts.length === 1) {
    evts[0].side = 'full'
  } else if (evts.length === 2) {
    const parsedDate1 = parsed(evts[0].date)
    const startTime1 =
      parsedDate1 && evts[0].time
        ? addToDate(parsedDate1, { minute: parseTime(evts[0].time) })
        : null

    const parsedDate2 = parsed(evts[1].date)
    const startTime2 =
      parsedDate2 && evts[1].time
        ? addToDate(parsedDate2, { minute: parseTime(evts[1].time) })
        : null

    if (startTime1 && startTime2) {
      const endTime1 = addToDate(startTime1, { minute: evts[0].duration || 0 })
      const endTime2 = addToDate(startTime2, { minute: evts[1].duration || 0 })

      if (
        isBetweenDates(startTime2, startTime1, endTime1, true) ||
        isBetweenDates(endTime2, startTime1, endTime1, true)
      ) {
        evts[0].side = 'left'
        evts[1].side = 'right'
      } else {
        evts[0].side = 'full'
        evts[1].side = 'full'
      }
    }
  }

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
    'full-width': !isHeader && (!event.side || event.side === 'full'),
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
  }

  s['align-items'] = 'flex-start'
  return s
}
</script>

<style lang="scss" scoped>
.my-event {
  position: absolute;
  font-size: 12px;
  justify-content: center;
  margin: 0 1px;
  text-overflow: ellipsis;
  overflow: hidden;
  cursor: pointer;
  opacity: 0.7;
}

.event-title {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.full-width {
  left: 0;
  width: calc(100% - 2px);
}

.left-side {
  left: 0;
  width: calc(50% - 3px);
}

.right-side {
  left: 50%;
  width: calc(50% - 3px);
}

.rounded-border {
  border-radius: 2px;
}

.day-view-current-time-indicator {
  position: absolute;
  left: -5px;
  height: 10px;
  width: 10px;
  margin-top: -4px;
  background-color: rgba(0, 0, 255, 0.5);
  border-radius: 50%;
}

.day-view-current-time-line {
  position: absolute;
  left: 5px;
  border-top: rgba(0, 0, 255, 0.5) 2px solid;
  width: calc(100% - 5px);
}
</style>
