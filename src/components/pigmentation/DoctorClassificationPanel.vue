<template>
  <section v-if="hasDiagnosis" class="q-gutter-lg">
    <q-banner rounded class="bg-blue-1 text-grey-9">
      <div class="text-subtitle1 text-weight-medium">Confirm working diagnosis</div>
      <div class="text-body2">
        Resolve each separate doctor caution, then choose the one or two morphology groups the
        patient wants addressed first. The treatment planner will use these selections as
        authoritative inputs.
      </div>
    </q-banner>

    <section v-if="classificationItems.length" class="q-gutter-md">
      <div class="text-subtitle1 text-weight-bold">Pathway-changing classifications</div>

      <q-card
        v-for="item in classificationItems"
        :key="item.classification_id"
        flat
        bordered
        class="q-pa-md"
      >
        <div class="row items-start justify-between q-col-gutter-md">
          <div class="col-12 col-md">
            <div class="text-subtitle1 text-weight-medium">
              {{ item.clinical_location_text }}
            </div>
            <div class="text-body2 q-mt-xs">
              {{ item.unresolved_question }}
            </div>
            <div class="text-caption text-grey-7 q-mt-sm">
              {{ item.why_classification_is_required }}
            </div>
          </div>
          <div
            class="flex items-center justify-center text-weight-bold"
            style="
              border-radius: 12px;
              padding: 4px 10px;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              white-space: nowrap;
              flex-shrink: 0;
              margin-top: 4px;
            "
            :style="{
              background: classificationResolved(item) ? '#e6f4ea' : '#fef3c7',
              color: classificationResolved(item) ? '#137333' : '#d97706',
              border: classificationResolved(item) ? '1px solid #ceead6' : '1px solid #fde68a'
            }"
          >
            {{ classificationResolved(item) ? 'Resolved' : 'Pending' }}
          </div>
        </div>

        <template v-if="!classificationResolved(item)">
          <q-select
            v-model="classificationDrafts[item.classification_id].selection"
            :options="classificationOptions(item)"
            emit-value
            map-options
            outlined
            dense
            class="q-mt-md"
            label="Doctor classification"
          />

          <q-input
            v-model="classificationDrafts[item.classification_id].doctor_note"
            outlined
            dense
            autogrow
            class="q-mt-sm"
            label="Doctor note (optional)"
          />

          <div class="row justify-end q-mt-md">
            <q-btn
              color="primary"
              label="Save classification"
              :disable="!classificationDrafts[item.classification_id].selection"
              :loading="savingId === item.classification_id"
              @click="saveClassification(item)"
            />
          </div>
        </template>

        <template v-else>
          <q-separator class="q-my-md" />
          <div class="text-body2">
            <span class="text-weight-medium">Doctor decision:</span>
            {{ classificationResolvedLabel(item) }}
          </div>
          <div v-if="classificationState(item)?.doctor_note" class="text-body2 q-mt-xs">
            <span class="text-weight-medium">Note:</span>
            {{ classificationState(item).doctor_note }}
          </div>
          <div class="row justify-end q-mt-md">
            <q-btn
              flat
              color="primary"
              label="Change classification"
              @click="clearClassification(item)"
            />
          </div>
        </template>
      </q-card>
    </section>

    <section v-if="routineActionItems.length" class="q-gutter-md">
      <div class="text-subtitle1 text-weight-bold">Required doctor actions</div>

      <q-card
        v-for="item in routineActionItems"
        :key="item.action_id"
        flat
        bordered
        class="q-pa-md"
      >
        <div class="row items-start justify-between q-col-gutter-md">
          <div class="col-12 col-md">
            <div class="text-subtitle1 text-weight-medium">{{ item.title }}</div>
            <div class="text-body2 q-mt-xs">{{ item.question }}</div>
            <div v-if="item.instruction" class="text-caption text-grey-7 q-mt-sm">
              {{ item.instruction }}
            </div>
          </div>
          <div
            class="flex items-center justify-center text-weight-bold"
            style="
              border-radius: 12px;
              padding: 4px 10px;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              white-space: nowrap;
              flex-shrink: 0;
              margin-top: 4px;
            "
            :style="{
              background: actionResolved(item) ? '#e6f4ea' : item.required ? '#fef3c7' : '#f1f5f9',
              color: actionResolved(item) ? '#137333' : item.required ? '#d97706' : '#475569',
              border: actionResolved(item) ? '1px solid #ceead6' : item.required ? '1px solid #fde68a' : '1px solid #e2e8f0'
            }"
          >
            {{ actionResolved(item) ? 'Resolved' : item.required ? 'Required' : 'Optional' }}
          </div>
        </div>

        <template v-if="!actionResolved(item)">
          <q-select
            v-model="actionDrafts[item.action_id].option_code"
            :options="actionOptions(item)"
            emit-value
            map-options
            outlined
            dense
            class="q-mt-md"
            label="Doctor decision"
          />

          <q-input
            v-model="actionDrafts[item.action_id].doctor_note"
            outlined
            dense
            autogrow
            class="q-mt-sm"
            label="Doctor note / modification"
          />

          <div class="row justify-end q-mt-md">
            <q-btn
              color="primary"
              label="Save decision"
              :disable="!actionDrafts[item.action_id].option_code"
              :loading="savingId === item.action_id"
              @click="saveAction(item)"
            />
          </div>
        </template>

        <template v-else>
          <q-separator class="q-my-md" />
          <div class="text-body2">
            <span class="text-weight-medium">Doctor decision:</span>
            {{ actionResolvedLabel(item) }}
          </div>
          <div v-if="store.blockingDoctorActionItems.some((action) => action.action_id === item.action_id)" class="text-negative text-weight-medium q-mt-sm" role="alert">
            This decision blocks treatment planning. The doctor can override the block to authorize generation.
            <q-btn
              class="q-mt-sm"
              color="primary"
              label="Doctor override: authorize plan"
              :loading="savingId === item.action_id"
              @click="overrideAction(item)"
            />
          </div>
          <div v-if="actionState(item)?.planning_override" class="text-primary q-mt-sm">
            Doctor override saved: plan generation authorized.
          </div>
          <div v-if="actionState(item)?.doctor_note" class="text-body2 q-mt-xs">
            <span class="text-weight-medium">Note:</span>
            {{ actionState(item).doctor_note }}
          </div>
          <div class="row justify-end q-mt-md">
            <q-btn flat color="primary" label="Change decision" @click="clearAction(item)" />
          </div>
        </template>
      </q-card>
    </section>

    <q-card v-if="priorityOptions.length" flat bordered class="q-pa-md">
      <div class="text-subtitle1 text-weight-bold">Client’s first treatment priorities</div>
      <div class="text-body2 q-mt-xs">
        After speaking with the patient, select one required priority and an optional second
        priority. These are morphology groups, not AI-guessed preferences.
      </div>
      <div class="text-caption q-mt-sm" style="font-weight: 500;">
        <span v-if="prioritySelection.length >= 2" class="text-amber-10 flex items-center gap-1">
          ⚠️ Maximum of 2 priorities selected. Deselect one to choose another.
        </span>
        <span v-else class="text-grey-7 flex items-center gap-1">
          💡 You can select a maximum of 2 treatment priorities.
        </span>
      </div>

      <div class="q-mt-md q-gutter-y-sm">
        <div
          v-for="opt in priorityOptions"
          :key="opt.value"
          class="border rounded q-pa-sm bg-grey-1 flex items-start"
          style="border: 1px solid #e2e8f0; border-radius: 6px; background-color: #f8fafc;"
        >
          <q-checkbox
            v-model="prioritySelection"
            :val="opt.value"
            :disable="prioritySelection.length >= 2 && !prioritySelection.includes(opt.value)"
            class="full-width"
            color="primary"
          >
            <div class="text-body2 text-grey-9 text-weight-medium" style="line-height: 1.4; margin-left: 4px;">
              {{ opt.label }}
            </div>
          </q-checkbox>
        </div>
      </div>

      <div class="row justify-end q-mt-md">
        <q-btn
          color="primary"
          label="Save treatment priorities"
          :disable="prioritySelection.length < 1 || prioritySelection.length > 2"
          :loading="savingId === 'priorities'"
          @click="savePriorities"
        />
      </div>
    </q-card>

    <q-card flat bordered class="q-pa-md q-my-md">
      <div class="text-subtitle1 text-weight-bold">Doctor diagnosis review & overall notes</div>
      <div class="text-body2 q-mt-xs">
        Enter overall clinical notes or specific override directives. These notes will guide the AI planner and will be saved to the client record.
      </div>
      <q-input
        v-model="doctorDiagnosisNotes"
        type="textarea"
        outlined
        rows="3"
        placeholder="Type diagnosis overrides, rationale, or priority notes..."
        class="q-mt-md"
        @blur="saveDoctorDiagnosisNotes"
      />
    </q-card>

    <q-banner
      rounded
      :class="planningReady ? 'bg-green-1 text-green-10' : 'bg-amber-1 text-grey-9'"
    >
      <div class="text-weight-medium">
        {{ planningReady ? 'Diagnosis inputs complete' : 'Complete the pending doctor inputs' }}
      </div>
      <div class="text-body2 q-mt-xs">
        {{ readinessMessage }}
      </div>
      <template v-if="showContinueButton" #action>
        <q-btn
          color="primary"
          label="Continue to plan"
          @click="$emit('continue')"
        />
      </template>
    </q-banner>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { usePigmentationStore } from 'src/stores/pigmentationStore'

defineProps({
  showContinueButton: {
    type: Boolean,
    default: true,
  },
})

defineEmits(['continue'])

const store = usePigmentationStore()
const savingId = ref(null)
const classificationDrafts = reactive({})
const actionDrafts = reactive({})
const prioritySelection = ref([])

const hasDiagnosis = computed(() => Boolean(store.diagnosis?.data))
const classificationItems = computed(() => store.classificationRequiredItems || [])
const routineActionItems = computed(() =>
  (store.doctorActionItems || []).filter((item) =>
    !item.classification_id || item.options.some((option) => option.planning_effect === 'block'),
  ),
)
const priorityOptions = computed(() => store.treatmentPriorityOptions || [])
const planningReady = computed(() => store.treatmentPlanningReady)

const readinessMessage = computed(() => {
  const pendingClassifications = store.pendingDoctorClassificationItems?.length || 0
  const pendingActions = store.pendingDoctorActionItems?.length || 0
  const priorityNeeded =
    priorityOptions.value.length > 0 && !(store.treatmentPriorityGroupIds || []).length
  const parts = []
  if (pendingClassifications) parts.push(`${pendingClassifications} classification(s) pending`)
  if (pendingActions) parts.push(`${pendingActions} doctor action(s) pending`)
  for (const item of store.blockingDoctorActionItems || []) {
    parts.push(`${item.action_id}: ${item.selectedOption.label} — treatment planning blocked`)
  }
  if (priorityNeeded) parts.push('treatment priority not selected')
  return parts.length
    ? parts.join(' · ')
    : 'The resolved diagnosis, doctor decisions and selected morphology priorities will be sent to the treatment planner.'
})

function ensureDrafts() {
  for (const item of classificationItems.value) {
    if (!classificationDrafts[item.classification_id]) {
      classificationDrafts[item.classification_id] = {
        selection: null,
        doctor_note: '',
      }
    }
  }
  for (const item of routineActionItems.value) {
    if (!actionDrafts[item.action_id]) {
      actionDrafts[item.action_id] = {
        option_code: null,
        doctor_note: '',
      }
    }
  }
}

watch([classificationItems, routineActionItems], ensureDrafts, { immediate: true, deep: true })

watch(
  () => store.treatmentPriorityGroupIds,
  (value) => {
    prioritySelection.value = Array.isArray(value) ? [...value] : []
  },
  { immediate: true, deep: true },
)

function classificationState(item) {
  return store.doctorClassifications?.[item.classification_id] || null
}

function classificationResolved(item) {
  return classificationState(item)?.status === 'resolved'
}

function classificationOptions(item) {
  const candidates = (item.candidate_options || []).map((option) => ({
    label: option.label,
    value: `candidate:${option.option_code}`,
  }))

  return [
    ...candidates,
    {
      label: 'Not relevant to the pigmentation treatment plan',
      value: 'standard:not_pigmentation_relevant',
    },
    {
      label: 'Cannot confidently classify — exclude from cosmetic treatment',
      value: 'standard:exclude_from_cosmetic_treatment',
    },
    {
      label: 'Requires separate medical evaluation',
      value: 'standard:separate_medical_evaluation',
    },
  ]
}

function classificationResolvedLabel(item) {
  const state = classificationState(item)
  if (!state) return 'Pending'
  if (state.resolution_type === 'candidate_selected') {
    return (
      (item.candidate_options || []).find((option) => option.option_code === state.option_code)
        ?.label || state.option_code
    )
  }
  const labels = {
    not_pigmentation_relevant: 'Not relevant to the pigmentation treatment plan',
    exclude_from_cosmetic_treatment: 'Excluded from cosmetic treatment',
    separate_medical_evaluation: 'Separate medical evaluation required',
  }
  return labels[state.resolution_type] || state.resolution_type
}

async function saveClassification(item) {
  const draft = classificationDrafts[item.classification_id]
  if (!draft?.selection) return

  const [kind, value] = draft.selection.split(':')
  const resolution = {
    resolution_type: kind === 'candidate' ? 'candidate_selected' : value,
    option_code: kind === 'candidate' ? value : null,
    doctor_note: draft.doctor_note || '',
  }

  savingId.value = item.classification_id
  try {
    await store.setDoctorClassification(item.classification_id, resolution)
  } finally {
    savingId.value = null
  }
}

async function clearClassification(item) {
  await store.clearDoctorClassification(item.classification_id)
  classificationDrafts[item.classification_id] = {
    selection: null,
    doctor_note: '',
  }
}

function actionState(item) {
  return store.doctorActionResolutions?.[item.action_id] || null
}

function actionResolved(item) {
  return actionState(item)?.status === 'resolved'
}

function actionOptions(item) {
  return (item.options || []).map((option) => ({
    label: option.label,
    value: option.option_code,
  }))
}

function actionResolvedLabel(item) {
  const state = actionState(item)
  if (!state) return 'Pending'
  return (
    (item.options || []).find((option) => option.option_code === state.option_code)?.label ||
    state.option_code
  )
}

async function saveAction(item) {
  const draft = actionDrafts[item.action_id]
  if (!draft?.option_code) return
  savingId.value = item.action_id
  try {
    await store.setDoctorActionResolution(item.action_id, {
      option_code: draft.option_code,
      doctor_note: draft.doctor_note || '',
    })
  } finally {
    savingId.value = null
  }
}

async function clearAction(item) {
  await store.clearDoctorActionResolution(item.action_id)
  actionDrafts[item.action_id] = {
    option_code: null,
    doctor_note: '',
  }
}

async function overrideAction(item) {
  savingId.value = item.action_id
  try {
    await store.setDoctorActionResolution(item.action_id, {
      ...actionState(item),
      planning_override: true,
    })
  } finally {
    savingId.value = null
  }
}

async function savePriorities() {
  savingId.value = 'priorities'
  try {
    await store.setTreatmentPriorityGroupIds(prioritySelection.value)
  } finally {
    savingId.value = null
  }
}

const doctorDiagnosisNotes = computed({
  get: () => store.doctorDiagnosisNotes || '',
  set: (val) => {
    store.doctorDiagnosisNotes = val
  },
})

async function saveDoctorDiagnosisNotes() {
  await store.updateAssessment()
}
</script>
