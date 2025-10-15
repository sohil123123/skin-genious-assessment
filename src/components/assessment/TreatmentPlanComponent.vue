<!-- TreatmentPlanComponent.vue (new component) -->
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

      <div v-for="(plan, planIndex) in treatmentPlan" :key="planIndex" class="q-mb-xl">
        <!-- Plan Header Card -->
        <q-card flat bordered class="bg-white shadow-2 q-pa-md rounded-borders">
          <div class="row items-center justify-between">
            <div>
              <div class="text-h6 text-weight-bold text-primary">
                {{ plan.plan_name }}
              </div>
              <div class="text-caption text-grey">Total Duration: {{ plan.total_time }}</div>
            </div>
          </div>
        </q-card>

        <!-- Timeline -->
        <q-timeline color="primary" layout="dense" class="q-mt-lg">
          <q-timeline-entry
            v-for="(session, sIndex) in plan.sessions"
            :key="sIndex"
            :title="`Week ${session.week}`"
            :subtitle="session.title"
            color="secondary"
            icon="event_note"
          >
            <q-card flat bordered class="bg-grey-2 q-pa-sm q-mt-sm shadow-1 rounded-borders">
              <q-expansion-item
                dense
                expand-separator
                default-opened
                icon="content_paste"
                label="Session Details"
                header-class="text-weight-medium text-primary"
              >
                <q-card flat bordered class="bg-white q-pa-sm">
                  <q-list separator dense>
                    <q-expansion-item
                      v-for="(step, stIndex) in session.steps"
                      :key="stIndex"
                      dense
                      expand-icon="expand_more"
                      switch-toggle-side
                      header-class="text-dark text-weight-medium"
                    >
                      <template #header>
                        <div>Step {{ step.step_number }}: {{ step.title }}</div>
                      </template>

                      <q-card flat bordered class="q-pa-sm bg-grey-1 q-my-xs rounded-borders">
                        <div class="text-caption q-mb-xs">
                          <strong>Details:</strong> {{ step.details }}
                        </div>
                        <div class="text-caption q-mb-xs">
                          <strong>Duration:</strong> {{ step.duration }}
                        </div>

                        <div class="q-my-xs">
                          <div class="text-caption text-weight-medium text-secondary q-mb-xs">
                            Devices & Equipments:
                          </div>
                          <div>
                            <q-chip
                              v-for="device in step.devices_equipments"
                              :key="device"
                              color="blue-3"
                              text-color="black"
                              size="sm"
                              icon="devices"
                              class="q-mr-xs q-mb-xs"
                            >
                              {{ device }}
                            </q-chip>
                          </div>

                          <div
                            class="text-caption text-weight-medium text-secondary q-mt-sm q-mb-xs"
                          >
                            Products Used:
                          </div>
                          <div>
                            <q-chip
                              v-for="product in step.products_equipments"
                              :key="product"
                              color="green-3"
                              text-color="black"
                              size="sm"
                              icon="spa"
                              class="q-mr-xs q-mb-xs"
                            >
                              {{ product }}
                            </q-chip>
                          </div>
                        </div>

                        <div class="text-caption q-mt-xs">
                          <strong>Finish:</strong>
                          <span>{{ step.finish.join(', ') }}</span>
                        </div>

                        <div class="text-caption q-mt-xs">
                          <strong>How to Do:</strong> {{ step.how_to_do }}
                        </div>
                      </q-card>
                    </q-expansion-item>
                  </q-list>
                </q-card>
              </q-expansion-item>
            </q-card>
          </q-timeline-entry>
        </q-timeline>
      </div>

      <!-- Display AI response; format as needed -->
      <div class="flex justify-start q-mt-lg">
        <q-btn label="Previous" rounded no-caps class="btn-custom" @click="emitPrevious" />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  treatmentPlan: {
    type: [String, Object],
    required: true,
  },
})

const emit = defineEmits(['previous'])

const emitPrevious = () => {
  emit('previous')
}
</script>
