<template>
  <div class="q-pa-md">
    <div class="flex justify-between items-center q-mb-lg">
      <div class="text-h5 text-weight-bold flex items-center">
        <q-icon name="playlist_add_check" color="teal" size="32px" class="q-mr-sm" />
        Treatment Execution (Nurse Run-sheet)
      </div>
      <div>
        <q-btn icon="print" flat round color="grey-7" @click="printSheet" />
      </div>
    </div>

    <div v-if="currentSession" class="run-sheet">
      <!-- Session Header Info -->
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-12 col-md-4">
          <div class="info-card p-4 rounded-lg bg-teal-50 border border-teal-100">
            <div class="text-caption text-teal-8 uppercase font-bold text-xs tracking-wider">
              Estimated Duration
            </div>
            <div class="text-h6 text-teal-9">{{ currentSession.treatment_time }} minutes</div>
          </div>
        </div>
        <div class="col-12 col-md-8">
          <div
            class="info-card p-4 rounded-lg bg-grey-50 border border-grey-100 h-full flex flex-col justify-center"
          >
            <div class="text-caption text-grey-6 uppercase font-bold text-xs tracking-wider">
              Objective
            </div>
            <div class="text-sm text-grey-9">{{ currentSession.script }}</div>
          </div>
        </div>
      </div>

      <!-- Preparation Checklist -->
      <q-card flat bordered class="q-mb-xl rounded-xl">
        <q-card-section class="bg-grey-1 border-bottom">
          <div class="text-subtitle1 text-weight-bold flex items-center">
            <q-icon name="inventory_2" size="20px" class="q-mr-sm" />
            Preparation & Setup
          </div>
        </q-card-section>
        <q-card-section class="q-pa-none">
          <q-list separator>
            <q-item
              v-for="(item, idx) in currentSession.preparations_checklist_for_therapist"
              :key="idx"
              tag="label"
              v-ripple
            >
              <q-item-section avatar>
                <q-checkbox v-model="prepChecks[idx]" color="teal" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ item }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>

      <!-- Execution Steps -->
      <div class="treatment-steps relative">
        <div
          v-for="(step, idx) in currentSession.steps"
          :key="idx"
          class="step-container q-mb-xl relative pl-12"
        >
          <!-- Step Connector Line -->
          <div
            v-if="idx < currentSession.steps.length - 1"
            class="step-connector absolute left-5 top-10 w-0.5 h-full bg-grey-2"
          ></div>

          <!-- Step Number Bubble -->
          <div
            class="absolute left-0 top-0 w-10 h-10 rounded-full bg-teal text-white flex items-center justify-center text-weight-bold shadow-sm z-10"
          >
            {{ step.step_number }}
          </div>

          <q-card flat bordered class="rounded-xl shadow-sm hover-shadow transition">
            <q-card-section class="q-pa-md">
              <div class="flex justify-between items-start q-mb-sm">
                <div class="text-h6 text-weight-bold">{{ getStepTitle(step) }}</div>
                <q-badge outline color="teal" class="q-px-sm q-py-xs">
                  <q-icon name="timer" size="14px" class="q-mr-xs" />
                  {{ step.duration }} min
                </q-badge>
              </div>

              <div class="row q-col-gutter-md">
                <div class="col-12">
                  <div class="flex gap-2 q-mb-md flex-wrap">
                    <q-chip
                      v-for="eq in step.ingredients_equipments"
                      :key="eq"
                      dense
                      color="grey-2"
                      text-color="grey-9"
                      size="sm"
                    >
                      {{ eq }}
                    </q-chip>
                  </div>
                </div>
                <div class="col-12">
                  <div
                    class="text-weight-bold text-caption text-grey-7 uppercase tracking-tighter mb-1"
                  >
                    Clinic Protocol
                  </div>
                  <div
                    class="text-body2 text-grey-9 bg-grey-1 p-3 rounded-lg border border-dashed border-grey-300"
                  >
                    {{ step.how_to_do }}
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <div v-else class="flex flex-col items-center justify-center q-pa-xl text-grey-6">
      <q-icon name="assignment_late" size="64px" class="q-mb-md" />
      <div class="text-h6">No treatment plan sessions available.</div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  treatmentSessions: {
    type: Object,
    default: null,
  },
})

const currentSession = computed(() => {
  return props.treatmentSessions?.treatments?.[0] || null
})

const prepChecks = ref([])

watch(
  () => currentSession.value,
  (sess) => {
    if (sess?.preparations_checklist_for_therapist) {
      prepChecks.value = new Array(sess.preparations_checklist_for_therapist.length).fill(false)
    }
  },
  { immediate: true },
)

const getStepTitle = (step) => {
  // Try to extract title from step if available, or use a generic one
  return step.title || `Protocol Step #${step.step_number}`
}

const printSheet = () => {
  window.print()
}
</script>

<style scoped>
.rounded-xl {
  border-radius: 16px;
}
.hover-shadow:hover {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}
.transition {
  transition: all 0.3s ease;
}
.step-connector {
  z-index: 1;
}
.bg-teal-50 {
  background-color: #f0fdfa;
}
.border-teal-100 {
  border-color: #ccfbf1;
}
.text-teal-8 {
  color: #115e59;
}
.text-teal-9 {
  color: #134e4a;
}
</style>
