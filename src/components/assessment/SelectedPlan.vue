<template>
  <!-- Header -->
  <q-card flat bordered class="header-card q-pa-md q-mb-md">
    <div class="text-h5 text-weight-bold">Skin Treatment Plan</div>
    <div class="text-caption text-grey-7 q-mt-xs">
      Total Duration: {{ treatmentPlan?.total_time }} •
      {{ treatmentPlan?.treatments.length }} sessions
    </div>

    <!-- <div class="q-mt-sm row q-gutter-sm">
      <q-chip
        v-for="(c, i) in treatmentPlan.treatments[0].concerns_addressed"
        :key="i"
        class="gredient-bg"
      >
        {{ c.concern }} → {{ c.target_value }}
      </q-chip>
    </div> -->
  </q-card>

  <!-- Sessions -->
  <div v-for="session in treatmentPlan?.treatments" :key="session.session_number" class="q-mb-md">
    <q-card bordered flat class="header-card">
      <q-card-section class="bg-white">
        <q-expansion-item
          expand-separator
          :label="`Session ${session.session_number} • ${session.title}`"
          :caption="`Week ${session.week} | ${session.treatment_time}`"
          header-class="bg-white text-weight-bold"
          dense
          expand-icon="arrow_drop_down"
        >
          <q-card flat class="q-pa-md bg-white">
            <div class="grid">
              <!-- Left Panel -->
              <div class="panel q-pa-md">
                <div>
                  <div class="text-subtitle2 text-amber-9 q-mb-xs">Preparation & Setup</div>
                  <q-list dense class="q-mb-md">
                    <q-item
                      v-for="(item, idx) in session.preparations_checklist_for_therapist"
                      :key="idx"
                      class="check-item q-my-sm"
                    >
                      <q-item-section avatar top>
                        <q-icon name="check" color="amber-8" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label caption class="text-black">{{ item }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </div>

                <div>
                  <div class="text-subtitle2 text-amber-9 q-mb-xs">Concerns Addressed</div>
                  <div class="row q-col-gutter-sm">
                    <div
                      v-for="(c, i) in session.concerns_addressed"
                      :key="i"
                      class="concern q-pa-sm q-mt-sm col-12 bg-white border"
                    >
                      <div class="text-caption">
                        <strong class="text-amber-8">{{ c.concern }}</strong> — <em>Current:</em>
                        {{ c.current_value }} → <strong>Target:</strong>
                        {{ c.target_value }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right Panel: Steps -->
              <div class="steps q-gutter-sm">
                <q-card
                  flat
                  bordered
                  v-for="(s, idx) in session.steps"
                  :key="idx"
                  class="step-card q-pa-sm"
                >
                  <div class="row justify-between items-center q-mb-xs">
                    <div class="text-subtitle2 text-weight-medium">Step {{ s.step_number }}</div>
                    <div class="text-caption text-grey-6">{{ s.duration }} mins</div>
                  </div>
                  <div class="text-caption text-grey-7 q-mb-xs">
                    <q-icon name="science" size="14px" class="q-mr-xs" /> Products/Devices:
                    {{ s.ingredients_equipments.join(', ') }}
                  </div>
                  <div>
                    <q-card flat bordered class="q-mt-md header-card">
                      <q-card-section class="text-body2">
                        {{ s.how_to_do }}
                      </q-card-section>
                    </q-card>
                  </div>
                </q-card>
              </div>
            </div>
          </q-card>
        </q-expansion-item>
      </q-card-section>
    </q-card>
  </div>
</template>
<script setup>
defineProps({
  treatmentPlan: { type: Object, required: true },
})
</script>

<style scoped>
.bg-soft {
  background-color: #fff8f4;
}

.plan {
  max-width: 1100px;
}

.header-card {
  border-radius: 14px;
  border: 1px solid #f3e5c8;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  background: #fff;
}

.panel {
  background: #fffaf4;
  border-radius: 14px;
  border: 1px solid #f3e5c8;
  display: grid;
  gap: 1rem;
}

.grid {
  display: grid;
  grid-template-columns: minmax(250px, 320px) 1fr;
  gap: 1.25rem;
}
@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

.step-card {
  border-radius: 12px;
  border: 1px solid #f3e5c8;
  background: #fffaf8;
}

.howto {
  border: 1px solid #f3e5c8;
  background: #fff;
  border-radius: 8px;
}

.concern {
  border: 1px solid #f3e5c8;
  border-radius: 10px;
}
</style>
