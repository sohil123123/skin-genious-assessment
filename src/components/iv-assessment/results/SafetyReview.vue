<template>
  <div class="q-pa-md">
    <div class="text-h5 text-weight-bold q-mb-lg flex items-center">
      <q-icon name="shield" color="accent" size="32px" class="q-mr-sm" />
      Safety & Contraindications Review
    </div>

    <div v-if="safetyResults.status === 'blocked'" class="q-mb-lg">
      <q-banner dense rounded class="bg-red-1 text-red-9 q-pa-md border-red mb-6">
        <template v-slot:avatar>
          <q-icon name="report_problem" size="32px" />
        </template>
        <div class="text-weight-bold text-subtitle1">TREATMENT BLOCKED</div>
        One or more high-severity medical contraindications detected. Proceed with extreme caution
        or defer treatment.
      </q-banner>
    </div>

    <div v-else-if="safetyResults.status === 'caution'" class="q-mb-lg">
      <q-banner dense rounded class="bg-orange-1 text-orange-9 q-pa-md border-orange mb-6">
        <template v-slot:avatar>
          <q-icon name="warning" size="32px" />
        </template>
        <div class="text-weight-bold text-subtitle1">MODIFIED PERMISSION</div>
        Safety flags detected. Adjust treatment depth, speed, or ingredients as specified.
      </q-banner>
    </div>

    <div v-else class="q-mb-lg">
      <q-banner dense rounded class="bg-green-1 text-green-9 q-pa-md border-green mb-6">
        <template v-slot:avatar>
          <q-icon name="check_circle" size="32px" />
        </template>
        <div class="text-weight-bold text-subtitle1">SAFETY CLEARANCE GRANTED</div>
        No high-risk contraindications found. Treatment may proceed normally.
      </q-banner>
    </div>

    <div class="row q-col-gutter-lg">
      <div class="col-12">
        <q-list bordered separator class="rounded-xl overflow-hidden bg-white shadow-sm">
          <q-item-label header class="text-weight-bold text-dark q-py-md">
            Identified Safety Flags ({{ safetyResults.flags.length }})
          </q-item-label>

          <q-item v-for="(flag, index) in safetyResults.flags" :key="index" class="q-py-md">
            <q-item-section avatar>
              <q-icon
                :name="flag.severity === 'high' ? 'error' : 'warning'"
                :color="flag.severity === 'high' ? 'negative' : 'warning'"
                size="28px"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-medium">{{ flag.message }}</q-item-label>
              <q-item-label caption>Affected Modalities: {{ flag.modality }}</q-item-label>
            </q-item-section>
            <q-item-section side v-if="flag.severity === 'high'">
              <q-badge color="negative" label="CRITICAL" />
            </q-item-section>
          </q-item>

          <q-item v-if="safetyResults.flags.length === 0" class="q-py-xl text-center">
            <q-item-section>
              <div class="text-grey-5">
                <q-icon name="verified_user" size="64px" class="q-mb-md" />
                <div class="text-subtitle1">No safety flags detected for this patient profile.</div>
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  safetyResults: {
    type: Object,
    default: () => ({
      status: 'safe',
      flags: [],
    }),
  },
})
</script>

<style scoped>
.rounded-xl {
  border-radius: 16px;
}
.border-red {
  border: 1px solid #ffcdd2;
}
.border-orange {
  border: 1px solid #ffe0b2;
}
.border-green {
  border: 1px solid #c8e6c9;
}
</style>
