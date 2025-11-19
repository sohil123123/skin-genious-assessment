<template>
  <div class="min-h-screen bg-grey-2 p-6">
    <div class="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center gap-3">
          <div
            class="w-12 h-12 rounded-full border-2 border-black flex items-center justify-center"
          >
            <span class="text-2xl font-serif">A</span>
          </div>
          <span class="text-xl font-light tracking-wider">AI AESTHETICS</span>
        </div>
      </div>

      <q-card flat class="q-pa-lg">
        <div class="header q-pa-md">
          <div>
            <div class="text-h5 text-weight-bold text-black">Treatment Preparation</div>
          </div>
        </div>

        <div class="row q-col-gutter-md q-mt-md">
          <div class="col-12 col-md-5">
            <q-card flat bordered class="rounded-lg">
              <q-card-section class="text-white" style="background: #ffeee4">
                <div class="text-h6 text-dark">Patient Preparation concerns_addressed</div>
              </q-card-section>

              <q-card-section>
                <div
                  v-for="(step, index) in concerns_addressed"
                  :key="index"
                  class="step-item q-mb-md q-pa-sm"
                >
                  <q-icon name="task_alt" size="sm" color="info" class="q-mr-sm" />
                  <span>{{ step }}</span>
                </div>
              </q-card-section>

              <q-card-section>
                <div class="text-dark q-mb-sm">{{ checkedCount }} / {{ totalItems }} Completed</div>
                <q-linear-progress
                  :value="progress"
                  color="info"
                  track-color="grey-3"
                  rounded
                  size="12px"
                  class="q-mb-md"
                />
                <div class="q-py-md text-center">
                  <q-btn
                    label="Preparation Completed"
                    class="gredient text-white"
                    rounded
                    :disable="checkedCount == totalItems ? false : true"
                  />
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-md-7">
            <q-card flat bordered class="rounded-lg">
              <q-card-section class="text-white" style="background: #f4ecf7">
                <div class="text-h6 text-dark">Equipment & Product Checklist</div>
              </q-card-section>
              <q-card-section>
                <div v-for="(item, index) in equipment" :key="index" class="q-pa-xs">
                  <q-checkbox
                    v-model="selected"
                    :val="item"
                    color="info"
                    size="md"
                    :label="item"
                    :class="{
                      'text-dark': selected.includes(item),
                      'text-grey-8': !selected.includes(item),
                    }"
                  />
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card>
    </div>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useAssessmentStore } from 'src/stores/assessmentStore'
import { ref, computed } from 'vue'

const store = useAssessmentStore()
const { assessmentData } = storeToRefs(store)

const selected = ref([])

const concerns_addressed = [
  'Remove all makeup and jewelry',
  'Cleanse face with gentle cleanser',
  'Position patient comfortably on treatment bed',
  'Ensure patient is relaxed and informed about procedure',
]

const equipment = ref(
  assessmentData.value.treatment_sessions[0].preparations_checklist_for_therapist,
)

const totalItems = computed(() => equipment.value.length)
const checkedCount = computed(() => selected.value.length)
const progress = computed(() => checkedCount.value / totalItems.value)
</script>

<style scoped>
.header {
  background: #e9daf7;
}

.step-item {
  display: flex;
  align-items: center;
  background: #f4faff;
  border-left: 4px solid #81d4fa;
  border-radius: 10px;
}

.footer {
  text-align: center;
  background: #f5faff;
  padding: 20px;
  border-radius: 16px;
  margin-top: 30px;
}
</style>
