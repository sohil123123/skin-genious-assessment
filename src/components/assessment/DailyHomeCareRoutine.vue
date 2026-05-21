<template>
  <q-card flat class="section-card q-pa-md soft-bg">
    <div
      class="row items-center justify-between cursor-pointer non-selectable"
      :class="{ 'q-mb-md': isExpanded }"
      @click="isExpanded = !isExpanded"
    >
      <div class="row items-center gap-2">
        <q-icon
          :name="isExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'"
          size="24px"
          class="text-grey-7"
        />
        <div class="text-h6 q-my-none">{{ title }}</div>
      </div>
      <div v-if="showGenerate || showDownload" class="flex gap-2" @click.stop>
        <template v-if="showGenerate">
          <q-btn
            v-if="!morningRoutine.length && !eveningRoutine.length"
            color="black"
            icon="auto_awesome"
            label="Generate Routine with AI"
            no-caps
            @click="$emit('generate')"
            :loading="isGenerating"
          />
          <q-btn
            v-else
            color="black"
            outline
            icon="auto_awesome"
            label="Re-generate with AI"
            no-caps
            @click="$emit('generate')"
            :loading="isGenerating"
          />
        </template>
        <q-btn
          v-if="showDownload && (morningRoutine.length || eveningRoutine.length)"
          color="black"
          outline
          icon="download"
          label="Download PDF"
          no-caps
          @click="downloadRoutinePDF"
        />
      </div>
    </div>

    <q-slide-transition>
      <div v-show="isExpanded">
        <q-separator class="q-my-md" />
        <div
          v-if="!morningRoutine.length && !eveningRoutine.length"
          class="text-center q-pa-lg text-grey-7"
        >
          No daily home care routine generated yet.
          <span v-if="showGenerate">Click the button above to generate one.</span>
        </div>

        <div v-else class="row q-col-gutter-md">
          <!-- Morning Routine -->
          <div v-if="morningRoutine.length" class="col-md-6 col-sm-12">
            <div class="text-h6 q-mb-sm text-orange-8 flex items-center gap-2">
              <q-icon name="wb_sunny" /> Morning Routine
            </div>
            <q-list bordered separator class="rounded-borders bg-white">
              <q-item v-for="step in morningRoutine" :key="'morning-' + step.step_number">
                <q-item-section avatar>
                  <q-avatar color="orange-1" text-color="orange-8" size="md">
                    {{ step.step_number }}
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-bold">{{ step.product_name }}</q-item-label>
                  <q-item-label caption class="text-grey-9 q-mt-xs">
                    <strong>How to use:</strong> {{ step.how_to_use }}
                  </q-item-label>
                  <q-item-label caption class="text-grey-7 q-mt-xs">
                    <strong>Clinical Purpose:</strong> {{ step.clinical_purpose }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <!-- Evening Routine -->
          <div v-if="eveningRoutine.length" class="col-md-6 col-sm-12">
            <div class="text-h6 q-mb-sm text-indigo-8 flex items-center gap-2">
              <q-icon name="nights_stay" /> Evening Routine
            </div>
            <q-list bordered separator class="rounded-borders bg-white">
              <q-item v-for="step in eveningRoutine" :key="'evening-' + step.step_number">
                <q-item-section avatar>
                  <q-avatar color="indigo-1" text-color="indigo-8" size="md">
                    {{ step.step_number }}
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-bold">{{ step.product_name }}</q-item-label>
                  <q-item-label caption class="text-grey-9 q-mt-xs">
                    <strong>How to use:</strong> {{ step.how_to_use }}
                  </q-item-label>
                  <q-item-label caption class="text-grey-7 q-mt-xs">
                    <strong>Clinical Purpose:</strong> {{ step.clinical_purpose }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </div>
      </div>
    </q-slide-transition>
  </q-card>
</template>

<script setup>
import { computed, ref } from 'vue'
import { Loading, Notify } from 'quasar'
import { api } from 'src/boot/axios'

const props = defineProps({
  routine: {
    type: [Object, String],
    default: () => ({ morning: [], evening: [] }),
  },
  isGenerating: {
    type: Boolean,
    default: false,
  },
  showGenerate: {
    type: Boolean,
    default: true,
  },
  showDownload: {
    type: Boolean,
    default: true,
  },
  defaultExpanded: {
    type: Boolean,
    default: true,
  },
  title: {
    type: String,
    default: 'Daily Home Care Routine',
  },
  assessmentId: {
    type: [Number, String],
    default: null,
  },
  sessionId: {
    type: [Number, String],
    default: null,
  },
  patientName: {
    type: String,
    default: '',
  },
  sessionNumber: {
    type: [Number, String],
    default: '',
  },
})

defineEmits(['generate'])

const isExpanded = ref(props.defaultExpanded)

async function downloadRoutinePDF() {
  if (!props.assessmentId || !props.sessionId) {
    Notify.create({
      type: 'negative',
      message: 'Assessment ID or Session ID is missing. Cannot download routine PDF.',
    })
    return
  }

  Loading.show({ message: 'Generating PDF report...' })
  try {
    const response = await api.get(
      `download-homecare-routine/${props.assessmentId}/${props.sessionId}`,
      {
        responseType: 'blob',
      },
    )

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    const patientName = (props.patientName || 'patient').replace(/\s+/g, '_')
    const sessionNum = props.sessionNumber || 'N/A'
    const filename = `${patientName}_daily_homecare_routine_session_${sessionNum}.pdf`
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('PDF generation failed:', error)

    Notify.create({
      type: 'negative',
      message:
        error?.response?.data?.message ||
        error?.message ||
        'Failed to generate PDF. Please try again.',
    })
  } finally {
    Loading.hide()
  }
}

const parsedRoutine = computed(() => {
  const routine = props.routine
  let result = { morning: [], evening: [] }

  if (!routine) return result

  if (typeof routine === 'string') {
    try {
      result = JSON.parse(routine)
    } catch (e) {
      console.error('Failed to parse daily_home_care_routine', e)
      return result
    }
  } else {
    result = routine
  }

  return {
    morning: result?.morning || [],
    evening: result?.evening || [],
  }
})

const morningRoutine = computed(() => parsedRoutine.value?.morning || [])
const eveningRoutine = computed(() => parsedRoutine.value?.evening || [])
</script>
