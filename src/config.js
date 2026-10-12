export default {
  is_test_mode: false,
  IMAGES_ORDER: {
    '6': ['white', 'positive', 'negative', 'blue', 'uv', 'woods'],
    '5': ['red', 'subsurface_polarized', 'surface_polarized', 'white', 'woods_uv']
  },
  // Display names paired with the canonical mode and file ID in each image request.
  IMAGE_MODE_LABELS: {
    red: 'Red',
    subsurface_polarized: 'Subsurface Polarized',
    surface_polarized: 'Surface Polarized',
    white: 'White',
    woods_uv: 'Woods/UV',
    positive: 'Positive',
    negative: 'Negative',
    blue: 'Blue',
    uv: 'UV',
    woods: 'Woods',
  },
  ELEVENLAB_VOICE_ID: 'TpoMSaK5kf87RYsHV5vp',
  ELEVENLAB_MODEL: 'eleven_multilingual_v2',
  ELEVENLAB_STABILITY: 0.5,
  ELEVENLAB_SIMILARITY: 0.1,
  ELEVENLAB_STYLE: 0,
  ELEVENLAB_BOOST: true,
}
