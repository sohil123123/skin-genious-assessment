// Prototype data only. This module deliberately has no API or persistence dependency.
const limbViews = (part) =>
  ['Left', 'Right'].flatMap((side) => ['front', 'back'].map((view) => `${side} ${part} · ${view}`))

export const LHR_ZONES = [
  {
    id: 'face',
    label: 'Face',
    icon: 'face',
    views: ['Left side', 'Right side', 'Raised chin'],
    hint: 'Hide identity. Frame only the treatment area; keep eyes and identifying features out of view.',
  },
  {
    id: 'underarms',
    label: 'Underarms',
    icon: 'accessibility_new',
    views: ['Left underarm', 'Right underarm'],
    hint: 'Both underarms, with the arm raised.',
  },
  {
    id: 'arms',
    label: 'Arms',
    icon: 'accessibility',
    views: [...limbViews('forearm'), ...limbViews('upper arm')],
    hint: 'Forearms and upper arms, front and back, on both sides.',
  },
  {
    id: 'legs',
    label: 'Legs',
    icon: 'directions_walk',
    views: [...limbViews('lower leg'), ...limbViews('upper leg')],
    hint: 'Lower and upper legs, front and back, on both sides.',
  },
  {
    id: 'chest',
    label: 'Chest',
    icon: 'crop_portrait',
    views: ['Front chest'],
    hint: 'Frame the selected chest treatment area.',
  },
  {
    id: 'abdomen',
    label: 'Abdomen',
    icon: 'crop_square',
    views: ['Front abdomen'],
    hint: 'Use the same position and framing at each visit.',
  },
  {
    id: 'beard',
    label: 'Beard shaping',
    icon: 'face_retouching_natural',
    views: ['Left beard line', 'Right beard line', 'Under chin / neck'],
    hint: 'Capture the shaping boundary only; hide identifying features.',
  },
  {
    id: 'back',
    label: 'Back',
    icon: 'accessibility_new',
    views: ['Back'],
    hint: 'Stand straight and frame the back treatment area.',
  },
  {
    id: 'shoulders',
    label: 'Shoulders',
    icon: 'accessibility',
    views: ['Left shoulder', 'Right shoulder'],
    hint: 'Both shoulders with consistent posture and lighting.',
  },
]

export const SAFETY_FIELDS = [
  { id: 'isotretinoin', label: 'Isotretinoin in the past 6 months' },
  {
    id: 'photosensitising',
    label: 'Photosensitising medication',
    hint: 'Record the medication name in the notes.',
  },
  { id: 'pcos', label: 'PCOS or suspected androgen excess' },
  { id: 'thyroid', label: 'Thyroid disorder' },
  { id: 'pih', label: 'History of post-inflammatory hyperpigmentation' },
  { id: 'keloid', label: 'Keloid or hypertrophic scarring' },
]

export const SHOTS = [
  {
    id: 'A',
    label: 'Before shaving',
    hint: 'Record visible hair and regrowth.',
  },
  {
    id: 'B',
    label: 'After shaving',
    hint: 'Use the same position for the stubble / follicle view.',
  },
]

export function createDraft(context = {}) {
  return {
    assessment_type: 'lhr',
    user_id: context.user_id || null,
    assessment_id: context.assessment_id || null,
    appointment_id: context.appointment_id || null,
    zones: { underarms: { mode: 'imaged' } },
    phototype: 'IV',
    hair: 'Dark, coarse',
    sunResponse: 'Burns mildly, then tans',
    tanning: 'Easily and deeply',
    plannedSessions: 8,
    safety: {
      ...Object.fromEntries(SAFETY_FIELDS.map(({ id }) => [id, false])),
      daysSinceSun: 21,
      notes: '',
      reviewed: false,
    },
    consent: {
      treatment: false,
      imaging: false,
      ai: false,
      marketing: false,
    },
  }
}

export function selectedZones(draft) {
  return LHR_ZONES.filter(({ id }) => draft.zones[id])
}

export function captureSlots(draft) {
  return selectedZones(draft).flatMap((zone) =>
    zone.views.flatMap((view, index) =>
      SHOTS.map((shot) => ({
        key: `${zone.id}:${index}:${shot.id}`,
        zoneId: zone.id,
        zone: zone.label,
        view,
        shot: shot.id,
      })),
    ),
  )
}

export function safetyComplete(draft) {
  const days = draft.safety.daysSinceSun
  return (
    draft.safety.reviewed &&
    days !== '' &&
    days !== null &&
    Number.isInteger(Number(days)) &&
    Number(days) >= 0 &&
    Number(days) <= 3650
  )
}

export function reviewReady(draft, captures, results) {
  const zones = selectedZones(draft)
  if (!zones.length || !safetyComplete(draft) || !draft.consent.treatment) return false
  return zones.every(({ id }) => {
    return (
      draft.consent.imaging &&
      draft.consent.ai &&
      results[id] &&
      captureSlots(draft)
        .filter((slot) => slot.zoneId === id)
        .every((slot) => captures[slot.key])
    )
  })
}

export function demoResult(zoneId) {
  const index = LHR_ZONES.findIndex(({ id }) => id === zoneId)
  return {
    density: 72 + index * 7,
    calibre: 64 + index * 3,
    hair: 'Dark, coarse',
    quality: 'Example QC passed',
    source: 'Simulated response',
  }
}

export function demoImage(slot) {
  // A visibly synthetic placeholder, never a clinical photograph.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420"><rect width="640" height="420" fill="#f1ece5"/><rect x="90" y="60" width="460" height="260" rx="24" fill="#d8b89b"/><g stroke="#8b6951" stroke-width="3">${Array.from(
    { length: 35 },
    (_, i) => {
      const x = 130 + (i % 7) * 60
      const y = 95 + Math.floor(i / 7) * 45
      return slot.shot === 'A'
        ? `<path d="M${x},${y}q-7,-12 2,-22" fill="none"/>`
        : `<circle cx="${x}" cy="${y}" r="2"/>`
    },
  ).join(
    '',
  )}</g><rect x="205" y="102" width="230" height="176" rx="8" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="8 6"/><text x="320" y="362" font-family="sans-serif" font-size="22" fill="#555" text-anchor="middle">DEMO FRAME · ${slot.shot === 'A' ? 'Before shaving' : 'After shaving'}</text><text x="320" y="394" font-family="sans-serif" font-size="17" fill="#555" text-anchor="middle">${slot.zone} · ${slot.view}</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
