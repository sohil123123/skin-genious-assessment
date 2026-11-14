// Rectangles use the unmirrored sensor image: top-left origin, coordinates in [0, 1].
// Cropping selects existing pixels. It never upscales or creates hair detail.
export const ZONE_CROP_VERSION = 'lhr-zone-crop-v1'
export const CROP_QUALITY_OPTIONS = { minLongEdge: 400, minShortEdge: 240 }

export function validCropBox(box) {
  return (
    !!box &&
    ['x', 'y', 'width', 'height'].every(
      (key) => typeof box[key] === 'number' && Number.isFinite(box[key]),
    ) &&
    box.x >= 0 &&
    box.y >= 0 &&
    box.width > 0 &&
    box.height > 0 &&
    box.x + box.width <= 1.000001 &&
    box.y + box.height <= 1.000001
  )
}

// The guide fallback is explicit operator positioning, not anatomical detection.
export function zoneGuideBox(zoneId) {
  const boxes = {
    face: [0.3, 0.08, 0.4, 0.82],
    beard: [0.3, 0.22, 0.4, 0.68],
    underarms: [0.24, 0.12, 0.52, 0.76],
    arms: [0.3, 0.08, 0.4, 0.82],
    legs: [0.3, 0.06, 0.4, 0.86],
    chest: [0.26, 0.12, 0.48, 0.74],
    abdomen: [0.3, 0.1, 0.4, 0.78],
    back: [0.27, 0.08, 0.46, 0.8],
    shoulders: [0.24, 0.18, 0.52, 0.66],
  }
  if (!boxes[zoneId]) throw new Error('Choose a valid treatment zone before cropping.')
  const [x, y, width, height] = boxes[zoneId]
  return { x, y, width, height }
}

export function cropPixelRect(box, sourceWidth, sourceHeight) {
  if (
    !validCropBox(box) ||
    !Number.isInteger(sourceWidth) ||
    !Number.isInteger(sourceHeight) ||
    sourceWidth <= 0 ||
    sourceHeight <= 0
  )
    throw new Error('The selected zone crop is invalid. Reposition the camera and retry.')
  const x = Math.floor(box.x * sourceWidth)
  const y = Math.floor(box.y * sourceHeight)
  const width = Math.min(sourceWidth, Math.ceil((box.x + box.width) * sourceWidth)) - x
  const height = Math.min(sourceHeight, Math.ceil((box.y + box.height) * sourceHeight)) - y
  if (
    Math.min(width, height) < CROP_QUALITY_OPTIONS.minShortEdge ||
    Math.max(width, height) < CROP_QUALITY_OPTIONS.minLongEdge
  )
    throw new Error(
      'The treatment area is too small for a clear crop. Move the camera closer or use a higher camera resolution, then recapture.',
    )
  return { x, y, width, height }
}

// Place a saved cropped A image back at its sensor location for B alignment.
export function cropReferenceStyle(crop, mirrored = false, viewportAspect = null) {
  const box = crop?.box
  if (!validCropBox(box)) return {}
  const sourceAspect = crop.source_width / crop.source_height
  const fit = Number.isFinite(sourceAspect) && viewportAspect > 0
  const widthScale = fit ? Math.min(1, sourceAspect / viewportAspect) : 1
  const heightScale = fit ? Math.min(1, viewportAspect / sourceAspect) : 1
  return {
    left: `${100 * ((1 - widthScale) / 2 + (mirrored ? 1 - box.x - box.width : box.x) * widthScale)}%`,
    top: `${100 * ((1 - heightScale) / 2 + box.y * heightScale)}%`,
    width: `${100 * box.width * widthScale}%`,
    height: `${100 * box.height * heightScale}%`,
    right: 'auto',
    bottom: 'auto',
  }
}

export async function decodeCropImage(blob) {
  if (typeof globalThis.createImageBitmap === 'function') {
    try {
      return await createImageBitmap(blob)
    } catch {
      /* Try the iPad image decoder. */
    }
  }
  const url = URL.createObjectURL(blob)
  try {
    const image = new Image()
    await new Promise((resolve, reject) => {
      image.onload = resolve
      image.onerror = () =>
        reject(new Error('The captured image could not be opened. Recapture it.'))
      image.src = url
    })
    return image
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function cropZoneImage(
  blob,
  box,
  {
    method = 'ai',
    decode = decodeCropImage,
    createCanvas = () => document.createElement('canvas'),
  } = {},
) {
  if (!['ai', 'guide'].includes(method)) throw new Error('Unknown crop method.')
  const image = await decode(blob)
  try {
    const sourceWidth = image.naturalWidth || image.width
    const sourceHeight = image.naturalHeight || image.height
    const rect = cropPixelRect(box, sourceWidth, sourceHeight)
    const canvas = createCanvas()
    canvas.width = rect.width
    canvas.height = rect.height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('This browser cannot crop camera images.')
    context.drawImage(image, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height)
    const cropped = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.95))
    if (!cropped) throw new Error('The zone crop could not be saved. Recapture the image.')
    return {
      blob: cropped,
      width: rect.width,
      height: rect.height,
      crop: {
        version: ZONE_CROP_VERSION,
        method,
        source_width: sourceWidth,
        source_height: sourceHeight,
        // Store the exact pixel-aligned rectangle, also used by the alignment preview.
        box: {
          x: rect.x / sourceWidth,
          y: rect.y / sourceHeight,
          width: rect.width / sourceWidth,
          height: rect.height / sourceHeight,
        },
        width: rect.width,
        height: rect.height,
      },
    }
  } finally {
    image.close?.()
  }
}
