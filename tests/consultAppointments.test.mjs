import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { consultAppointmentParams, consultAppointmentEvent } from '../src/utils/consultAppointments.js'

test('consult calendar requests clinic consultations overlapping the visible date range without a therapist filter', () => {
  const params = consultAppointmentParams(7, '2026-10-19', '2026-10-26')
  assert.deepEqual(JSON.parse(params.filterArray), [
    { column: 'clinic_id', condition: '=', value: 7 },
    { column: 'type', condition: '=', value: 'consult' },
    { column: 'start_datetime', condition: '<', value: '2026-10-26 00:00:00' },
    { column: 'end_datetime', condition: '>', value: '2026-10-19 00:00:00' },
  ])
  assert.equal(params.joinWith, 'clinic,client,therapist,assessment,treatmentSession')
  assert.equal(params.page, undefined, 'calendar must load all matching appointments')
})

const consultation = {
  id: 42, type: 'consult', status: 'confirmed',
  start_datetime: '2026-10-20 10:00:00', end_datetime: '2026-10-20 11:30:00',
  duration_minutes: 90, notes: 'First visit',
  clinic: { id: 7, name: 'Clinic' }, client: { id: 12, name: 'Client' }, therapist: null,
}

test('unassigned consults retain the date, client, notes and null therapist used by calendar details and editing', () => {
  const original = structuredClone(consultation)
  const event = consultAppointmentEvent(consultation)
  assert.equal(event.type, 'appointment')
  assert.equal(event.start_date, '2026-10-20')
  assert.equal(event.start_time, '10:00:00')
  assert.equal(event.end_time, '11:30:00')
  assert.equal(event.status, 'confirmed')
  assert.equal(event.duration, 90)
  assert.equal(event.meta.type, 'consult')
  assert.equal(event.meta.client_id, 12)
  assert.equal(event.meta.therapist_id, null)
  assert.equal(event.meta.notes, 'First visit')
  assert.deepEqual(consultation, original)
})

test('existing assigned consultations retain their therapist and linked assessment when edited', () => {
  const event = consultAppointmentEvent({
    ...consultation, therapist: { id: 15, name: 'Therapist' },
    assessment: { id: 20 }, treatment_session: { id: 30 },
  })
  assert.equal(event.meta.therapist_id, 15)
  assert.equal(event.meta.therapist, 'Therapist')
  assert.equal(event.meta.assessment_id, 20)
  assert.equal(event.meta.treatment_session_id, 30)
})

const calendarSource = readFileSync(new URL('../src/pages/AppointmentCalander.vue', import.meta.url), 'utf8')
const saveHandler = calendarSource.slice(
  calendarSource.indexOf('async function handleSave()'),
  calendarSource.indexOf('function resetAppointmentData()'),
)

for (const type of ['consult', 'treatment', 'express', 'other']) {
  test(`booking ${type} ${type === 'consult' ? 'works without' : 'requires'} a therapist`, async () => {
    const saved = []
    const notices = []
    const context = {
      appointmentData: { value: { type, therapist_id: null } },
      isEditMode: { value: false }, therapist_id: { value: null }, clinic_id: { value: 7 },
      showDetailDialog: { value: false },
      Loading: { show() {}, hide() {} }, Notify: { create: (notice) => notices.push(notice) },
      appointmentStore: { storeAppointments: async (data) => { saved.push({ ...data }); return true } },
      resetAppointmentData() {}, closeDialog() {}, fetchAppointments() {},
    }
    await runInNewContext(`${saveHandler}; handleSave()`, context)
    assert.equal(saved.length, type === 'consult' ? 1 : 0)
    if (type === 'consult') {
      assert.equal(saved[0].therapist_id, null)
      assert.equal(saved[0].clinic_id, 7)
    } else {
      assert.equal(notices[0].message, 'Please select a therapist')
    }
  })
}
