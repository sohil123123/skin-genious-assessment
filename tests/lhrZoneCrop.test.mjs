import test from 'node:test'
import assert from 'node:assert/strict'
import {
  validCropBox,
  zoneGuideBox,
  cropPixelRect,
  cropReferenceStyle,
  cropZoneImage,
  CROP_QUALITY_OPTIONS,
} from '../src/utils/lhr/zoneCrop.js'
import { assessCapturePixels } from '../src/utils/lhr/captureQuality.js'
import { framingRequest, reviewZoneCandidate } from '../src/utils/lhr/zoneFraming.js'

test('all nine zone guides have valid bounded crop regions', () => {
  for (const id of [
    'face',
    'underarms',
    'arms',
    'legs',
    'chest',
    'abdomen',
    'beard',
    'back',
    'shoulders',
  ]) {
    const box = zoneGuideBox(id)
    assert.equal(validCropBox(box), true)
    const rect = cropPixelRect(box, 1920, 1080)
    assert.ok(rect.width < 1920 && rect.height < 1080)
  }
  assert.throws(() => zoneGuideBox('unknown'), /valid treatment zone/)
})

test('normalized sensor coordinates round outwards without mirroring or leaving the frame', () => {
  assert.deepEqual(cropPixelRect({ x: 0.25, y: 0.2, width: 0.5, height: 0.6 }, 1920, 1080), {
    x: 480,
    y: 216,
    width: 960,
    height: 648,
  })
  const rect = cropPixelRect({ x: 0.333, y: 0.1, width: 0.667, height: 0.9 }, 1280, 720)
  assert.equal(rect.x + rect.width, 1280)
  assert.equal(rect.y + rect.height, 720)
  assert.equal(rect.x, 426)
})

test('invalid, nonfinite and tiny selections are rejected rather than replaced with the whole image', () => {
  for (const box of [
    null,
    {},
    { x: -0.1, y: 0, width: 1, height: 1 },
    { x: 0, y: 0, width: 1.2, height: 1 },
    { x: 0.8, y: 0, width: 0.3, height: 1 },
    { x: 0, y: NaN, width: 1, height: 1 },
    { x: 0, y: 0, width: 0, height: 1 },
    { x: 0, y: 0, width: '1', height: 1 },
  ]) {
    assert.equal(validCropBox(box), false)
    assert.throws(() => cropPixelRect(box, 1920, 1080))
  }
  assert.throws(
    () => cropPixelRect({ x: 0.5, y: 0.5, width: 0.1, height: 0.1 }, 1920, 1080),
    /Move the camera closer/,
  )
  assert.throws(() => cropPixelRect(zoneGuideBox('face'), 0, 1080))
})

test('only preview alignment is mirrored; the saved source rectangle remains unmirrored', () => {
  const crop = { box: { x: 0.1, y: 0.2, width: 0.5, height: 0.6 } }
  assert.equal(cropReferenceStyle(crop).left, '10%')
  assert.equal(cropReferenceStyle(crop, true).left, '40%')
  assert.equal(cropReferenceStyle(crop, true).width, '50%')
  assert.equal(cropReferenceStyle(crop, true).top, '20%')
  assert.equal(cropReferenceStyle(crop).right, 'auto')
  assert.deepEqual(cropReferenceStyle(null, true), {})
  const portrait = { ...crop, source_width: 1000, source_height: 2000 }
  const aligned = cropReferenceStyle(portrait, false, 1)
  assert.equal(aligned.left, '30%')
  assert.equal(aligned.width, '25%')
  assert.equal(aligned.top, '20%')
})

function canvasFixture({ fail = false } = {}) {
  const draws = []
  let closed = 0
  const image = {
    width: 1920,
    height: 1080,
    close: () => {
      closed++
    },
  }
  const blob = new Blob(['cropped-fixture'], { type: 'image/jpeg' })
  const canvas = {
    getContext: () => ({ drawImage: (...args) => draws.push(args) }),
    toBlob: (done, type, quality) => {
      assert.equal(type, 'image/jpeg')
      assert.equal(quality, 0.95)
      done(fail ? null : blob)
    },
  }
  return { image, blob, canvas, draws, closed: () => closed }
}

test('crop encodes only the chosen sensor pixels at native size, with auditable bounds', async () => {
  const f = canvasFixture()
  const original = new Blob(['full-frame'])
  const result = await cropZoneImage(
    original,
    { x: 0.25, y: 0.2, width: 0.5, height: 0.6 },
    {
      decode: async (blob) => {
        assert.equal(blob, original)
        return f.image
      },
      createCanvas: () => f.canvas,
    },
  )
  assert.deepEqual(f.draws, [[f.image, 480, 216, 960, 648, 0, 0, 960, 648]])
  assert.equal(f.canvas.width, 960)
  assert.equal(f.canvas.height, 648)
  assert.equal(result.blob, f.blob)
  assert.notEqual(result.blob, original)
  assert.equal(result.crop.method, 'ai')
  assert.equal(result.crop.source_width, 1920)
  assert.equal(result.crop.width, result.width)
  assert.equal(result.crop.height, result.height)
  assert.equal(f.closed(), 1)
})

test('cropping releases the decoded frame when bounds or encoding fail', async () => {
  const f = canvasFixture({ fail: true })
  const options = { decode: async () => f.image, createCanvas: () => f.canvas }
  await assert.rejects(
    cropZoneImage(new Blob(), zoneGuideBox('chest'), options),
    /could not be saved/,
  )
  assert.equal(f.closed(), 1)
  await assert.rejects(cropZoneImage(new Blob(), null, options), /crop is invalid/)
  assert.equal(f.closed(), 2)
})

test('before consent, guide cropping stays local and is explicitly identified', async () => {
  const f = canvasFixture()
  const result = await cropZoneImage(new Blob(), zoneGuideBox('underarms'), {
    method: 'guide',
    decode: async () => f.image,
    createCanvas: () => f.canvas,
  })
  assert.equal(result.crop.method, 'guide')
  assert.equal(f.draws.length, 1)
})

test('AI localization uses a strict nullable normalized box and rejects missing coordinates', async () => {
  const request = framingRequest({
    zoneId: 'face',
    viewIndex: 0,
    shot: 'A',
    imageDataUrl: 'data:image/jpeg;base64,fixture',
  })
  const schema = request.text.format.schema
  assert.ok(schema.required.includes('crop_box'))
  assert.deepEqual(schema.properties.crop_box.type, ['object', 'null'])
  assert.deepEqual(schema.properties.crop_box.required, ['x', 'y', 'width', 'height'])
  assert.equal(schema.properties.crop_box.additionalProperties, false)
  assert.match(request.instructions, /unmirrored input photograph/)
  assert.match(request.instructions, /Do not select only the hairiest patch/)
  const review = await reviewZoneCandidate(
    new Blob(),
    async () => ({
      zone_visible: true,
      skin_visible: true,
      framing_ok: true,
      confidence: 0.99,
      reason: 'Fixture',
      crop_box: null,
    }),
    () => true,
  )
  assert.equal(review.status, 'rejected')
  assert.equal(review.candidate, undefined)
})

test('cropped-area quality checks preserve focus and illumination requirements', () => {
  const data = new Uint8ClampedArray(16 * 16 * 4)
  for (let i = 0; i < 256; i++) {
    const value = ((i % 16) + Math.floor(i / 16)) % 2 ? 150 : 90
    data.set([value, value, value, 255], i * 4)
  }
  assert.equal(assessCapturePixels({ data, width: 16, height: 16 }, 500, 300).pass, false)
  assert.equal(
    assessCapturePixels({ data, width: 16, height: 16 }, 500, 300, null, CROP_QUALITY_OPTIONS).pass,
    true,
  )
  data.fill(255)
  assert.equal(
    assessCapturePixels({ data, width: 16, height: 16 }, 500, 300, null, CROP_QUALITY_OPTIONS).pass,
    false,
  )
})
