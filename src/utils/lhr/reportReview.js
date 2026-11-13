// Only leave after the server has finalised the clinic-head review.
export async function confirmLhrReportAndExit({ getSession, canManage, crmUrl, review, exit }) {
  const session = getSession()
  if (!canManage || !session?.report) throw new Error('Clinic-head report review is required.')
  if (!crmUrl) throw new Error('CRM return address is missing. Set CRM_URL in the frontend configuration.')
  const destination = new URL(crmUrl)
  if (!['http:', 'https:'].includes(destination.protocol)) throw new Error('Invalid CRM return address.')
  if (session.status === 'awaiting_review' && review) {
    const saved = await review()
    if (!saved) return // The caller has already displayed the API error.
    if (saved.id !== session.id || saved.status !== 'completed') {
      throw new Error('The session report has not been finalised. Please refresh and retry.')
    }
    if (getSession()?.id !== session.id || getSession()?.status !== 'completed') return
  } else if (session.status !== 'completed') {
    throw new Error('Finalise the session report before returning to CRM.')
  }
  exit(destination.href)
}
