<template>
  <q-page class="lhr-page">
    <div class="lhr-shell">
      <header class="row items-center justify-between q-gutter-md q-mb-lg">
        <div class="row items-center no-wrap">
          <div class="lhr-brand-mark q-mr-md">A</div>
          <div>
            <div class="lhr-brand">AI AESTHETICS</div>
            <div class="text-caption text-grey-7">Laser hair removal assessment</div>
          </div>
        </div>
        <q-btn flat no-caps label="LHR sessions" icon="list_alt" :to="{ name: 'lhr-sessions' }" />
      </header>
      <q-banner v-if="error" rounded class="bg-red-1 q-mb-lg" aria-live="polite"
        >{{ error
        }}<template #action><q-btn flat no-caps label="Dismiss" @click="error = ''" /></template
      ></q-banner>
      <div v-if="initialising" class="text-center q-pa-xl">
        <q-spinner size="36px" />
        <p class="q-mt-md">Loading LHR assessment…</p>
      </div>
      <template v-else-if="session">
        <q-card flat bordered class="q-mb-lg"
          ><q-card-section class="row items-center justify-between q-gutter-sm">
            <div>
              <q-icon name="person_outline" class="q-mr-sm" size="22px" /><strong>{{
                patient.name
              }}</strong>
              <div class="text-caption text-grey-7 q-mt-xs">
                Assessment #{{ assessment.id }} · Session {{ session.session_number }} ·
                {{ statusLabel(session.status) }}
              </div>
            </div>
            <q-select
              :model-value="session.id"
              :options="sessions"
              :option-label="
                (item) => `Session ${item.session_number} · ${statusLabel(item.status)}`
              "
              option-value="id"
              emit-value
              map-options
              outlined
              dense
              label="Session"
              style="min-width: 220px"
              :disable="busy || pendingUploads"
              @update:model-value="switchSession"
            /> </q-card-section
        ></q-card>
        <div v-if="editable" class="row items-center q-col-gutter-md q-mb-lg">
          <div class="col-12 col-md-8">
            <q-select
              v-model="appointmentId"
              :options="appointments"
              :option-label="
                (item) => `#${item.id} · ${new Date(item.start_datetime).toLocaleString()}`
              "
              option-value="id"
              emit-value
              map-options
              outlined
              dense
              clearable
              label="Link this visit's appointment (optional)"
            />
          </div>
          <div class="col-12 col-md-4 text-caption text-grey-7">
            {{ dirty ? 'Patient answers have unsaved changes.' : 'Patient answers saved.' }}
          </div>
        </div>
        <q-stepper
          v-model="step"
          flat
          alternative-labels
          color="black"
          active-color="black"
          done-color="black"
          class="lhr-stepper"
          :contracted="$q.screen.lt.sm"
        >
          <q-step
            v-for="item in stages"
            :key="item.name"
            :name="item.name"
            :title="item.title"
            :icon="item.icon"
            :done="step > item.name"
          />
        </q-stepper>
        <LhrZones v-if="step === 1 && editable" :model-value="draft" @next="continueToCapture" />
        <LhrCapture
          v-else-if="[2, 3].includes(step) && editable"
          :key="`${session.id}:${step}`"
          :session-id="session.id"
          :capture-phase="step === 2 ? 'before' : 'after'"
          :profile="session.profile"
          :all-before-captured="allBeforeCaptured"
          :model-value="draft"
          :captures="captures"
          :results="session.analysis || {}"
          :processing="processing"
          :ready="step === 2 ? beforeReady : ready"
          :saving="!!busy"
          @save="saveAnswers"
          @capture="capture"
          @remove="removeCapture"
          @retry="retryCapture"
          @process="processZone"
          @profile="processProfile"
          @previous="step = step === 2 ? 1 : 2"
          @review="continueFromCapture"
        />
        <LhrPrescription
          v-else-if="step === 4 && editable"
          :model-value="draft"
          :session="session"
          :actor="actor"
          :therapists="therapists"
          :previous="previous"
          :busy="!!busy"
          :dirty="dirty"
          @generate="generatePrescription"
          @approve="approve"
          @previous="step = 3"
        />
        <LhrTreatment
          v-else-if="['assigned', 'in_progress'].includes(session.status)"
          :key="session.id"
          :session="session"
          :can-treat="actor.can_treat"
          :busy="!!busy"
          @zone-start="(zone, data) => action(`zones/${zone}/start`, data)"
          @zone-save="(zone, data) => action(`zones/${zone}/execution`, data, 'patch')"
          @zone-complete="(zone, data) => action(`zones/${zone}/complete`, data)"
          @complete="(data) => action('complete', data)"
        />
        <LhrReport
          v-else-if="['awaiting_review', 'completed'].includes(session.status)"
          :key="session.id"
          :session="session"
          :can-manage="actor.can_manage"
          :progress="progress"
          :busy="!!busy"
          :assessment-status="assessment.status"
          @confirm-exit="confirmAndExit"
          @generate="generateReport"
          @review="(data) => action('review', data)"
          @download="downloadReport"
          @next="nextSession"
        />
        <q-expansion-item
          v-if="progress.zones?.length"
          label="Treatment history and progress"
          icon="show_chart"
          class="q-mt-lg"
          ><div class="q-pa-md"><LhrProgress :progress="progress" /></div
        ></q-expansion-item>
        <q-expansion-item
          v-if="step >= 4 && savedPhotos.length"
          label="Saved before- and after-shave images"
          icon="photo_library"
          class="bg-grey-1 rounded-borders q-mt-lg"
        >
          <div class="row q-col-gutter-md q-pa-md">
            <div v-for="photo in savedPhotos" :key="photo.key" class="col-12 col-sm-6 col-md-4">
              <q-card flat bordered
                ><q-card-section
                  ><img
                    :src="photo.src"
                    :alt="`${photo.zone}, ${photo.view}, shot ${photo.shot}`"
                    style="width: 100%; height: 160px; object-fit: contain"
                  />
                  <div class="text-caption q-mt-sm">
                    {{ photo.zone }} · {{ photo.view }} ·
                    {{ photo.shot === 'A' ? 'Before shaving' : 'After shaving' }}
                  </div></q-card-section
                ></q-card
              >
            </div>
          </div>
        </q-expansion-item>
      </template>
      <q-btn v-else outline rounded no-caps label="Retry loading assessment" @click="load" />
    </div>
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import LhrZones from 'src/components/lhr/LhrZones.vue'
import LhrCapture from 'src/components/lhr/LhrCapture.vue'
import LhrPrescription from 'src/components/lhr/LhrPrescription.vue'
import LhrTreatment from 'src/components/lhr/LhrTreatment.vue'
import LhrReport from 'src/components/lhr/LhrReport.vue'
import LhrProgress from 'src/components/lhr/LhrProgress.vue'
import { captureSlots } from 'src/utils/lhr/assessment'
import { runLhrAi } from 'src/utils/lhr/ai'
import { confirmLhrReportAndExit } from 'src/utils/lhr/reportReview'
import { withMachineDefaults } from 'src/utils/lhr/machineDefaults'
import { cameraMatches, zoneCameraLock } from 'src/utils/lhr/camera'
import {
  normaliseInputs,
  inputsEquivalent,
  captureReady,
  stagedSessionStep,
  beforeCaptureReady,
  beforeProfileReady,
} from 'src/utils/lhr/workflow'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const session = ref(null)
const assessment = ref({})
const patient = ref({})
const actor = ref({})
const sessions = ref([])
const therapists = ref([])
const appointments = ref([])
const appointmentId = ref(null)
const previous = ref(null)
const progress = ref({ zones: [], recorded_sessions: 0 })
const draft = reactive(normaliseInputs({ zones: {}, plannedSessions: 8 }))
const captures = reactive({})
const processing = reactive({})
const step = ref(1)
const initialising = ref(true)
const busy = ref('')
const error = ref('')
const editable = computed(
  () => actor.value.can_manage && ['draft', 'prescribed'].includes(session.value?.status),
)
const pendingUploads = computed(() => Object.values(captures).some((image) => image.pending))
const dirty = computed(
  () =>
    session.value &&
    (draft.capture_workflow !== session.value.inputs.capture_workflow ||
      !inputsEquivalent(draft, session.value.inputs) ||
      appointmentId.value !== session.value.appointment_id),
)
const allBeforeCaptured = computed(() => beforeCaptureReady(draft, captures))
const beforeReady = computed(
  () =>
    beforeProfileReady(session.value?.profile, draft, captures) &&
    !pendingUploads.value &&
    !processing.__profile &&
    !dirty.value,
)
const ready = computed(
  () =>
    captureReady(draft, captures, session.value?.analysis || {}) &&
    !pendingUploads.value &&
    !Object.values(processing).some(Boolean),
)
const savedPhotos = computed(() =>
  session.value
    ? captureSlots(session.value.inputs)
        .filter((slot) => captures[slot.key]?.id && captures[slot.key]?.src)
        .map((slot) => ({ ...slot, src: captures[slot.key].src }))
    : [],
)
const stages = [
  { name: 1, title: 'Zones', icon: 'accessibility_new' },
  { name: 2, title: 'Before shaving', icon: 'photo_camera' },
  { name: 3, title: 'After shaving', icon: 'camera_alt' },
  { name: 4, title: 'Prescription', icon: 'fact_check' },
  { name: 5, title: 'Treatment', icon: 'spa' },
  { name: 6, title: 'Report', icon: 'description' },
]
let mutations = Promise.resolve()
let disposed = false
let loadVersion = 0
function clone(value) {
  return JSON.parse(JSON.stringify(value))
}
function statusLabel(value) {
  return (value || '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}
function showError(cause) {
  if (disposed) return
  const details = cause.response?.data
  const validation = details?.errors || (details?.code === 422 ? details.results : null)
  error.value = validation
    ? Object.values(validation).flat().join(' ')
    : details?.error?.message ||
      details?.message ||
      cause.message ||
      'The request failed. Please retry.'
}
function mutate(task) {
  const sessionId = session.value?.id
  const next = mutations.then(() => {
    if (disposed || (sessionId && session.value?.id !== sessionId))
      throw new Error('The active session changed. Reopen the intended session before saving.')
    return task()
  })
  mutations = next.catch(() => {})
  return next
}
function release(image) {
  if (image?.src?.startsWith('blob:')) URL.revokeObjectURL(image.src)
}
function clearCaptures() {
  Object.keys(captures).forEach((key) => {
    release(captures[key])
    delete captures[key]
  })
}

async function apply(
  data,
  { replaceInputs = false, completedKey = null, expectedSessionId = null } = {},
) {
  if (disposed) return
  if (expectedSessionId && session.value?.id !== expectedSessionId) return
  if (session.value?.id === data.session.id && session.value.revision > data.session.revision)
    return
  assessment.value = data.assessment
  patient.value = data.patient
  actor.value = data.actor
  sessions.value = data.sessions
  therapists.value = data.therapists
  appointments.value = data.appointments
  previous.value = data.previous_prescription || null
  progress.value = data.progress || { zones: [], recorded_sessions: 0 }
  const different = session.value?.id !== data.session.id
  if (different) clearCaptures()
  session.value = data.session
  if (data.session.inputs.capture_workflow === 'staged') {
    draft.phototype = data.session.inputs.phototype
    draft.hair = data.session.inputs.hair
  }
  if (replaceInputs || different) {
    Object.assign(draft, normaliseInputs(data.session.inputs))
    appointmentId.value = data.session.appointment_id
  }
  const valid = new Set(data.session.captures.map((image) => image.key))
  for (const key of Object.keys(captures))
    if (!valid.has(key) && !captures[key].pending && !captures[key].error) {
      release(captures[key])
      delete captures[key]
    }
  await Promise.all(
    data.session.captures.map(async (image) => {
      const before = image.shot === 'B' ? captures[image.key.replace(/B$/, 'A')] : null
      if (before?.pending || before?.error) return
      const local = captures[image.key]
      if ((local?.pending || local?.error) && image.key !== completedKey) return
      if (local?.id === image.id && local.src) return
      let src = image.key === completedKey ? local?.src : null
      if (!src) {
        try {
          const response = await api.get(image.image_endpoint, { responseType: 'blob' })
          if (
            disposed ||
            session.value?.id !== data.session.id ||
            session.value.revision !== data.session.revision ||
            (captures[image.key]?.pending && image.key !== completedKey)
          )
            return
          src = URL.createObjectURL(response.data)
        } catch (cause) {
          showError(cause)
          return
        }
      }
      if (local?.src !== src) release(local)
      captures[image.key] = {
        id: image.id,
        src,
        source: image.metadata?.source || 'upload',
        camera: image.metadata?.camera || null,
        metadata: image.metadata,
        pending: false,
      }
    }),
  )
  if (different || replaceInputs || !editable.value)
    step.value = stagedSessionStep(session.value, data.session.captures.length > 0)
}

async function syncLocation() {
  await router.replace({
    name: 'lhr-assessment',
    params: {
      user_id: String(assessment.value.user_id),
      assessment_id: String(assessment.value.id),
    },
    query: { session_id: String(session.value.id) },
  })
}
async function load() {
  const version = ++loadVersion
  initialising.value = true
  error.value = ''
  try {
    const response = route.params.assessment_id
      ? await api.get(`lhr/assessments/${route.params.assessment_id}`, {
          params: { session_id: route.query.session_id },
        })
      : await api.post('lhr/assessments', {
          user_id: Number(route.params.user_id),
          appointment_id: route.params.appointment_id ? Number(route.params.appointment_id) : null,
        })
    if (version !== loadVersion || disposed) return
    await apply(response.data, { replaceInputs: true })
    await syncLocation()
  } catch (cause) {
    showError(cause)
  } finally {
    if (version === loadVersion) initialising.value = false
  }
}
async function switchSession(id) {
  if (pendingUploads.value || Object.values(processing).some(Boolean)) {
    error.value = 'Wait for image uploads and analysis to finish before changing sessions.'
    return
  }
  if (dirty.value) {
    error.value = 'Save patient answers before changing sessions.'
    return
  }
  busy.value = 'load'
  try {
    const response = await api.get(`lhr/assessments/${assessment.value.id}`, {
      params: { session_id: id },
    })
    await apply(response.data, { replaceInputs: true })
    await syncLocation()
  } catch (cause) {
    showError(cause)
  } finally {
    busy.value = ''
  }
}

async function saveInputs() {
  return mutate(async () => {
    if (!editable.value || !dirty.value) return
    const id = session.value.id
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await api.patch(`lhr/sessions/${id}`, {
          revision: session.value.revision,
          inputs: normaliseInputs(draft),
          appointment_id: appointmentId.value,
        })
        await apply(response.data, { expectedSessionId: id })
        return
      } catch (cause) {
        if (cause.response?.status !== 409 || attempt || session.value.id !== id) throw cause
        const current = await api.get(`lhr/assessments/${assessment.value.id}`, {
          params: { session_id: id },
        })
        await apply(current.data, { expectedSessionId: id })
        if (!editable.value) throw cause
      }
    }
  })
}
async function saveAnswers() {
  busy.value = 'save'
  error.value = ''
  try {
    await saveInputs()
    $q.notify({ type: 'positive', message: 'Patient answers saved.' })
  } catch (cause) {
    showError(cause)
  } finally {
    busy.value = ''
  }
}
async function continueToCapture() {
  busy.value = 'save'
  error.value = ''
  try {
    await saveInputs()
    step.value = 2
  } catch (cause) {
    showError(cause)
  } finally {
    busy.value = ''
  }
}
async function continueFromCapture() {
  busy.value = 'save'
  error.value = ''
  try {
    await saveInputs()
    if (step.value === 2 && beforeReady.value) step.value = 3
    else if (step.value === 3 && ready.value) step.value = 4
  } catch (cause) {
    showError(cause)
  } finally {
    busy.value = ''
  }
}

function capture(slot, file, metadata = {}) {
  if (!editable.value || !file || !slot || captures[slot.key]?.pending) return
  if (
    captures[slot.key.replace(/[AB]$/, 'A')]?.pending ||
    captures[slot.key.replace(/[AB]$/, 'B')]?.pending
  )
    return
  if (!captureSlots(draft).some((item) => item.key === slot.key)) return
  if (slot.shot === 'B' && !captures[slot.key.replace(/B$/, 'A')]?.id) return
  if (
    metadata.source === 'camera' &&
    !cameraMatches(zoneCameraLock(captures, slot.zoneId), metadata.camera)
  ) {
    error.value = 'Use the same camera for this zone or remove its camera images first.'
    return
  }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 15728640) {
    error.value = 'Choose a JPG, PNG or WebP image under 15 MB.'
    return
  }
  if (slot.shot === 'B')
    metadata = { ...metadata, before_capture_id: captures[slot.key.replace(/B$/, 'A')].id }
  if (slot.shot === 'A') dropDependentShot(slot.key)
  release(captures[slot.key])
  captures[slot.key] = {
    src: URL.createObjectURL(file),
    file,
    source: metadata.source || 'upload',
    camera: metadata.camera || null,
    metadata,
    pending: true,
  }
  upload(slot, file, metadata).catch(showError)
}
async function upload(slot, file, metadata) {
  const sessionId = session.value.id
  return mutate(async () => {
    try {
      const form = new FormData()
      form.append('zone', slot.zoneId)
      form.append('view_index', slot.key.split(':')[1])
      form.append('shot', slot.shot)
      if (slot.shot === 'B') form.append('before_capture_id', metadata.before_capture_id)
      form.append('image', file)
      form.append('metadata', JSON.stringify(metadata))
      const response = await api.post(`lhr/sessions/${session.value.id}/captures`, form)
      await apply(response.data, {
        completedKey: slot.key,
        expectedSessionId: response.data.session.id,
      })
    } catch (cause) {
      if (session.value?.id === sessionId && captures[slot.key]?.file === file) {
        captures[slot.key].pending = false
        captures[slot.key].error = true
      }
      throw cause
    }
  })
}
function retryCapture(key) {
  const image = captures[key]
  const slot = captureSlots(draft).find((item) => item.key === key)
  if (!image?.file || !slot) return
  if (slot.shot === 'A') dropDependentShot(key)
  image.pending = true
  image.error = false
  upload(slot, image.file, image.metadata).catch(showError)
}
function removeCapture(key) {
  mutate(async () => {
    const image = captures[key]
    if (
      !image ||
      image.pending ||
      captures[key.replace(/[AB]$/, 'A')]?.pending ||
      captures[key.replace(/[AB]$/, 'B')]?.pending
    )
      return
    if (image.id) {
      const id = session.value.id
      const response = await api.delete(`lhr/captures/${image.id}`)
      await apply(response.data, { expectedSessionId: id })
      if (key.endsWith(':A')) dropDependentShot(key)
    } else {
      release(image)
      delete captures[key]
      if (key.endsWith(':A')) dropDependentShot(key)
    }
  }).catch(showError)
}
function dropDependentShot(beforeKey) {
  const afterKey = beforeKey.replace(/A$/, 'B')
  release(captures[afterKey])
  delete captures[afterKey]
}
async function processProfile() {
  if (processing.__profile) return
  processing.__profile = true
  error.value = ''
  const sessionId = session.value.id
  try {
    await saveInputs()
    if (session.value.id !== sessionId) return
    const response = await runLhrAi(api, { sessionId, task: 'profile' })
    await apply(response.data, { expectedSessionId: sessionId })
  } catch (cause) {
    showError(cause)
  } finally {
    delete processing.__profile
  }
}
async function processZone(id) {
  if (processing[id]) return
  processing[id] = true
  error.value = ''
  const sessionId = session.value.id
  try {
    await saveInputs()
    if (session.value.id !== sessionId) return
    const response = await runLhrAi(api, { sessionId, task: 'analysis', zone: id })
    await apply(response.data, { expectedSessionId: sessionId })
  } catch (cause) {
    showError(cause)
  } finally {
    delete processing[id]
  }
}
async function generatePrescription() {
  busy.value = 'prescription'
  error.value = ''
  const sessionId = session.value.id
  try {
    draft.machine = withMachineDefaults(draft.machine)
    await saveInputs()
    await mutations
    if (session.value.id !== sessionId) return
    const response = await runLhrAi(api, { sessionId, task: 'prescription' })
    await apply(response.data, { expectedSessionId: sessionId })
    if (session.value.id === sessionId) step.value = 4
  } catch (cause) {
    showError(cause)
  } finally {
    busy.value = ''
  }
}
async function generateReport() {
  busy.value = 'report'
  error.value = ''
  const sessionId = session.value.id
  try {
    await mutations
    const response = await runLhrAi(api, { sessionId, task: 'report' })
    await apply(response.data, { expectedSessionId: sessionId })
  } catch (cause) {
    showError(cause)
  } finally {
    busy.value = ''
  }
}
async function approve(data) {
  if (dirty.value) {
    error.value =
      'Regenerate the prescription using the current patient and machine inputs before approval.'
    return
  }
  await action('assign', data)
}
async function action(name, data = {}, method = 'post') {
  busy.value = name
  error.value = ''
  try {
    return await mutate(async () => {
      const id = session.value.id
      const response = await api.request({
        url: `lhr/sessions/${id}/${name}`,
        method,
        data: { ...clone(data), revision: session.value.revision },
        timeout: 240000,
      })
      await apply(response.data, { expectedSessionId: id })
      return response.data.session
    })
  } catch (cause) {
    showError(cause)
  } finally {
    busy.value = ''
  }
}
async function confirmAndExit(data = {}) {
  if (busy.value || !actor.value.can_manage) return
  busy.value = 'confirm-exit'
  error.value = ''
  try {
    await confirmLhrReportAndExit({
      getSession: () => disposed ? null : session.value,
      canManage: actor.value.can_manage,
      crmUrl: process.env.CRM_URL,
      review: () => action('review', data),
      exit: (url) => window.location.assign(url),
    })
  } catch (cause) {
    showError(cause)
  } finally {
    busy.value = ''
  }
}
async function nextSession() {
  busy.value = 'next'
  error.value = ''
  try {
    const response = await api.post(`lhr/assessments/${assessment.value.id}/sessions`)
    await apply(response.data, { replaceInputs: true })
    await syncLocation()
  } catch (cause) {
    showError(cause)
  } finally {
    busy.value = ''
  }
}
async function downloadReport() {
  busy.value = 'download'
  error.value = ''
  try {
    const response = await api.get(`lhr/sessions/${session.value.id}/report.pdf`, {
      responseType: 'blob',
    })
    const url = URL.createObjectURL(response.data)
    const link = document.createElement('a')
    link.href = url
    link.download = `LHR-session-${session.value.session_number}-report.pdf`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch (cause) {
    showError(cause)
  } finally {
    busy.value = ''
  }
}
watch(
  () => [draft.consent.ai, draft.consent.imaging],
  () => {
    if (!initialising.value && editable.value) saveInputs().catch(showError)
  },
)
watch(
  () => route.fullPath,
  () => {
    if (
      route.name === 'lhr-assessment' &&
      (Number(route.params.assessment_id) !== assessment.value.id ||
        Number(route.query.session_id) !== session.value?.id)
    )
      load()
  },
)
onMounted(load)
onBeforeUnmount(() => {
  disposed = true
  loadVersion += 1
  clearCaptures()
})
</script>

<style>
.lhr-page {
  background: #f5f5f5;
  padding: 24px;
}
.lhr-shell {
  max-width: 1152px;
  margin: 0 auto;
  padding: 32px;
  border-radius: 20px;
  background: white;
  box-shadow: 0 8px 28px #0000000d;
}
.lhr-brand-mark {
  width: 48px;
  height: 48px;
  border: 2px solid #171717;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font:
    28px Georgia,
    serif;
}
.lhr-brand {
  font-size: 19px;
  font-weight: 300;
  letter-spacing: 2px;
}
.lhr-title {
  font-family: Georgia, serif;
  font-size: 32px;
  line-height: 1.25;
  font-weight: 400;
  margin: 0 0 12px;
}
.lhr-stepper {
  margin-bottom: 28px;
}
.lhr-stepper .q-stepper__header {
  box-shadow: none;
  border-bottom: 1px solid #e6e6e6;
}
.lhr-stepper .q-stepper__step-inner {
  padding: 0;
}
.review-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.review-details dt {
  color: #666;
}
.review-details dd {
  margin: 0;
}
@media (max-width: 599px) {
  .lhr-page {
    padding: 10px;
  }
  .lhr-shell {
    padding: 18px;
    border-radius: 14px;
  }
  .lhr-title {
    font-size: 26px;
  }
  .lhr-brand {
    font-size: 16px;
    letter-spacing: 1px;
  }
  .lhr-stepper .q-stepper__tab {
    padding: 16px 4px;
  }
}
</style>
