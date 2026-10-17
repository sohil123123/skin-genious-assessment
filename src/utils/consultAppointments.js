export function consultAppointmentParams(clinicId, startDate, endDate) {
  return {
    joinWith: 'clinic,client,therapist,assessment,treatmentSession',
    filterArray: JSON.stringify([
      { column: 'clinic_id', condition: '=', value: clinicId },
      { column: 'type', condition: '=', value: 'consult' },
      { column: 'start_datetime', condition: '<', value: `${endDate} 00:00:00` },
      { column: 'end_datetime', condition: '>', value: `${startDate} 00:00:00` },
    ]),
  }
}

// Match the event shape returned by availability/slots for the existing calendar dialogs.
export function consultAppointmentEvent(appointment) {
  const [startDate, startTime] = appointment.start_datetime.split(' ')
  const [endDate, endTime] = appointment.end_datetime.split(' ')
  return {
    id: appointment.id,
    type: 'appointment',
    status: appointment.status,
    start_date: startDate,
    end_date: endDate,
    start_time: startTime,
    end_time: endTime,
    duration: appointment.duration_minutes,
    notes: appointment.notes,
    meta: {
      type: appointment.type,
      clinic: appointment.clinic?.name,
      clinic_id: appointment.clinic?.id,
      client: appointment.client?.name,
      client_id: appointment.client?.id,
      therapist: appointment.therapist?.name,
      therapist_id: appointment.therapist?.id ?? null,
      assessment_id: appointment.assessment?.id ?? null,
      treatment_session_id: appointment.treatment_session?.id ?? null,
      notes: appointment.notes,
    },
  }
}
