// Framing checks are deterministic image-quality checks, not anatomical recognition.
import { decodeCropImage } from './zoneCrop.js'

export const CAPTURE_STANDARD_VERSION = 'lhr-framing-v3'
export function assessCapturePixels(
  { data, width, height },
  sourceWidth,
  sourceHeight,
  previous = null,
  { minLongEdge = 640, minShortEdge = 480 } = {},
) {
  const pixels = new Float32Array(width * height)
  let sum = 0,
    square = 0,
    clipped = 0,
    motion = 0
  for (let i = 0; i < pixels.length; i++) {
    const value = data[i * 4] * 0.2126 + data[i * 4 + 1] * 0.7152 + data[i * 4 + 2] * 0.0722
    pixels[i] = value
    sum += value
    square += value * value
    if (value < 8 || value > 247) clipped++
    if (previous?.length === pixels.length) motion += Math.abs(value - previous[i])
  }
  const brightness = sum / pixels.length
  const contrast = Math.sqrt(Math.max(0, square / pixels.length - brightness * brightness))
  let edges = 0,
    count = 0
  for (let y = 1; y < height - 1; y++)
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x
      const lap =
        4 * pixels[i] - pixels[i - 1] - pixels[i + 1] - pixels[i - width] - pixels[i + width]
      edges += lap * lap
      count++
    }
  const focus = edges / Math.max(1, count)
  const issues = []
  if (
    Math.max(sourceWidth, sourceHeight) < minLongEdge ||
    Math.min(sourceWidth, sourceHeight) < minShortEdge
  )
    issues.push(
      `Use at least a ${minLongEdge} x ${minShortEdge} frame (portrait is also supported).`,
    )
  if (brightness < 35) issues.push('Add light to the treatment area.')
  if (brightness > 230 || clipped / pixels.length > 0.4)
    issues.push('Reduce glare or clipped highlights/shadows.')
  if (contrast < 5 || focus < 4) issues.push('Move closer and focus on the skin and hair detail.')
  if (previous && motion / pixels.length > 10)
    issues.push('Hold the camera and treatment area steady.')
  return {
    pass: issues.length === 0,
    issues,
    brightness: Math.round(brightness),
    focus: Math.round(focus),
    pixels,
  }
}
export function inspectCaptureElement(element, previous = null, options = {}) {
  const width = element.videoWidth || element.width
  const height = element.videoHeight || element.height
  if (!width || !height) throw new Error('Wait for an image frame before capture.')
  const canvas = document.createElement('canvas')
  const scale = 128 / Math.max(width, height)
  canvas.width = Math.max(8, Math.round(width * scale))
  canvas.height = Math.max(8, Math.round(height * scale))
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(element, 0, 0, canvas.width, canvas.height)
  return assessCapturePixels(
    ctx.getImageData(0, 0, canvas.width, canvas.height),
    width,
    height,
    previous,
    options,
  )
}
export async function inspectCaptureFile(file, options = {}) {
  const bitmap = await decodeCropImage(file)
  try {
    return inspectCaptureElement(bitmap, null, options)
  } finally {
    bitmap.close?.()
  }
}
export function framingGuide(zoneId) {
  const paths = {
    face: 'M380 55 C285 55 255 130 275 215 C290 275 335 320 380 340 C425 320 470 275 485 215 C505 130 475 55 380 55 Z',
    beard: 'M275 95 Q250 250 380 340 Q510 250 485 95 M300 220 Q380 290 460 220',
    underarms: 'M210 330 L270 200 Q300 140 285 65 M285 65 L350 65 Q360 175 420 210 L550 265',
    arms: 'M300 45 L460 45 L475 330 L285 330 Z',
    legs: 'M285 40 L475 40 L450 350 L310 350 Z',
    chest: 'M260 80 Q380 40 500 80 L540 320 L220 320 Z',
    abdomen: 'M275 55 L485 55 L515 335 L245 335 Z',
    back: 'M240 70 Q380 30 520 70 L490 335 L270 335 Z',
    shoulders: 'M220 300 Q240 70 440 100 Q520 130 550 300',
  }
  return { path: paths[zoneId] || paths.arms, label: `${zoneId || 'Treatment area'} framing guide` }
}
