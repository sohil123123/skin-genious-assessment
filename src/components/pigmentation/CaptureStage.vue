<template>
  <section class="stage is-active">
    <div class="stage-head">
      <span class="eyebrow">Stage 01 · Capture</span>
      <h1 class="serif">Upload the captures</h1>
      <p>Attach the 5-mode analyser images — white, Wood's UV, surface &amp; sub-surface polarised, red. Select or drop several at once. Claude reads the objective data on the next screen, alongside history.</p>
    </div>

    <div class="capture-wrap">
      <div class="viewer-card">
        <div class="viewer-head">
          <span class="t">Analyser captures</span>
          <span class="t" style="color:#6f6780">{{ store.attachedImages.length }} attached</span>
        </div>
        
        <div 
          class="dropzone" 
          @click="triggerFileInput"
          @dragover.prevent="onDragOver"
          @dragleave="onDragLeave"
          @drop.prevent="onDrop"
          :style="dragOverStyle"
        >
          <div class="big">⊕</div>
          <div>Attach captures — select or drop several at once</div>
          <div class="sub">White, Wood's UV, surface &amp; sub-surface polarised, red — JPG/PNG. Multi-select supported. Tag each with its mode so the read is accurate.</div>
        </div>
        
        <input 
          type="file" 
          ref="fileInput" 
          accept="image/*" 
          multiple 
          hidden 
          @change="onFileChange"
        >
        
        <div class="thumbs" v-if="store.attachedImages.length > 0">
          <div v-for="(img, idx) in store.attachedImages" :key="idx" class="thumb-wrap">
            <div class="thumb">
              <img :src="img.dataUrl" alt="">
              <button class="rm" @click="removeImage(idx)">×</button>
            </div>
            <select class="thumb-mode" v-model="img.mode">
              <option value="">— mode —</option>
              <option v-for="modeOpt in modeLabels" :key="modeOpt.value" :value="modeOpt.value">
                {{ modeOpt.label }}
              </option>
            </select>
          </div>
        </div>
        
        <button 
          class="btn btn-primary btn-block" 
          style="margin-top:13px" 
          @click="runAnalysis"
          :disabled="store.isLoading || (!store.demoMode && store.attachedImages.length === 0)"
        >
          ✦ {{ store.isLoading ? 'Analysing captures…' : 'Analyse captures & continue' }}
        </button>
        
        <div v-if="store.isLoading || statusMsg" :class="['cap-status', statusType]" style="margin-top:12px">
          {{ store.isLoading ? store.loadingMessage : statusMsg }}
        </div>
        
        <p class="note" style="color:#8a8198;text-align:center;margin-top:9px;font-size:11.5px">
          White-light capture at minimum. Readings are AI estimates from images for you to confirm — not calibrated measurements. Patient details &amp; history come next.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { usePigmentationStore } from 'src/stores/pigmentationStore'

const store = usePigmentationStore()
const fileInput = ref(null)
const isDragging = ref(false)
const statusMsg = ref('')
const statusType = ref('')

const modeLabels = [
  { value: 'white', label: 'White light' },
  { value: 'woods_uv', label: "Wood's UV" },
  { value: 'surface_polarized', label: 'Surface polarised' },
  { value: 'subsurface_polarized', label: 'Sub-surface polarised' },
  { value: 'red', label: 'Red light' }
]

const dragOverStyle = computed(() => {
  return isDragging.value ? { borderColor: '#6b6080', background: 'rgba(255,255,255,.02)' } : {}
})

const triggerFileInput = () => {
  fileInput.value.click()
}

const onDragOver = () => {
  isDragging.value = true
}

const onDragLeave = () => {
  isDragging.value = false
}

const onDrop = (e) => {
  isDragging.value = false
  handleFiles(e.dataTransfer.files)
}

const onFileChange = () => {
  handleFiles(fileInput.value.files)
  fileInput.value.value = '' // clear input
}

const fileToData = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('File read failed'))
    reader.readAsDataURL(file)
  })
}

const guessMode = (name) => {
  const n = (name || '').toLowerCase()
  if (/wood|uv/.test(n)) return 'woods_uv'
  if (/sub.?surf|subsurface/.test(n)) return 'subsurface_polarized'
  if (/surf|polar/.test(n)) return 'surface_polarized'
  if (/red/.test(n)) return 'red'
  if (/white|normal|rgb/.test(n)) return 'white'
  return ''
}

const handleFiles = async (files) => {
  for (let i = 0; i < files.length; i++) {
    const f = files[i]
    if (!/^image\//.test(f.type)) continue
    if (f.size > 5 * 1024 * 1024) {
      alert(`“${f.name}” is over 5 MB — skipped. Compress and retry.`)
      continue
    }
    if (store.attachedImages.length >= 8) {
      alert('Up to 8 images. Remove one to add another.')
      break
    }
    try {
      const dataUrl = await fileToData(f)
      store.attachedImages.push({
        name: f.name,
        mediaType: f.type,
        base64: dataUrl.split(',')[1],
        dataUrl: dataUrl,
        mode: guessMode(f.name)
      })
    } catch (e) {
      console.error(e)
    }
  }
}

const removeImage = (idx) => {
  store.attachedImages.splice(idx, 1)
}

const runAnalysis = async () => {
  statusMsg.value = ''
  statusType.value = ''
  
  try {
    await store.analyseCaptures()
  } catch (err) {
    statusType.value = 'err'
    statusMsg.value = (err.message || 'Analysis failed.') + ' Retry, or continue and enter the readings by hand.'
  }
}
</script>
