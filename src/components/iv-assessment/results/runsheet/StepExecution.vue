<template>
  <div class="clinical-step">
    <!-- Monitoring Strategy -->
    <div class="q-mb-xl">
      <div class="step-header">
        <div class="icon-box">
          <q-icon name="monitor_heart" size="20px" />
        </div>
        <div>
          <h2 class="title">Monitoring Strategy</h2>
          <p class="subtitle">Keep track of patient vitals and responses</p>
        </div>
      </div>

      <div class="clinical-card q-pa-md bg-slate-50">
        <div class="q-mb-md">
          <div class="clinical-label">Baseline Vitals</div>
          <div class="info-box">
            {{ monitoringPlan?.baseline_measurements?.join(', ') || 'Standard (BP, HR, SpO2)' }}
          </div>
        </div>

        <div class="q-mb-md">
          <div class="clinical-label">During Infusion</div>
          <div class="info-box">
            <div
              v-for="(check, i) in monitoringPlan?.during_infusion_checks"
              :key="'chk-' + i"
              class="flex items-start q-mb-xs"
            >
              <q-icon name="check" size="16px" class="q-mr-xs text-teal-7 q-mt-xs" />
              <span class="text-sm text-slate-700">{{ check }}</span>
            </div>
          </div>
        </div>

        <div v-if="monitoringPlan?.stop_rules?.length">
          <div class="clinical-label text-red-800 flex items-center">
            <q-icon name="block" class="q-mr-xs" size="14px" /> Stop Rules
          </div>
          <div class="info-box bg-red-50 border-red-200 text-red-900 font-medium">
            {{ monitoringPlan.stop_rules.join(' • ') }}
          </div>
        </div>
      </div>
    </div>

    <!-- Administration Timeline -->
    <div v-if="adminSteps && adminSteps.length > 0">
      <div class="step-header">
        <div class="icon-box">
          <q-icon name="play_circle_filled" size="20px" />
        </div>
        <div>
          <h2 class="title">Administration Timeline</h2>
          <p class="subtitle">Step-by-step execution protocol</p>
        </div>
      </div>

      <div class="clinical-card">
        <q-list separator class="clinical-list">
          <q-item
            v-for="(step, idx) in adminSteps"
            :key="'admin-' + idx"
            clickable
            v-ripple
            class="check-item"
            :class="{ 'is-checked': adminChecks[idx] }"
            @click="updateAdminCheck(idx, !adminChecks[idx])"
          >
            <q-item-section avatar top>
              <div class="custom-checkbox bg-teal-8">
                <q-icon :name="adminChecks[idx] ? 'check' : 'remove'" size="16px" color="white" stroke-width="2" />
              </div>
            </q-item-section>
            <q-item-section>
              <div class="check-text">
                {{ step }}
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  monitoringPlan: { type: Object, default: () => ({}) },
  adminSteps: { type: Array, default: () => [] },
  adminChecks: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['update:adminChecks'])

const updateAdminCheck = (idx, val) => {
  emit('update:adminChecks', { ...props.adminChecks, [idx]: val })
}
</script>

<style scoped>
.clinical-step {
  animation: fadeIn 0.3s ease;
}
.step-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}
.icon-box {
  width: 40px;
  height: 40px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #115e59;
}
.title {
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 2px 0;
  line-height: 1.2;
}
.subtitle {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}
.clinical-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}
.bg-slate-50 {
  background-color: #f8fafc;
}
.clinical-label {
  font-size: 11px;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 6px;
}
.info-box {
  background: #ffffff;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  font-size: 14px;
  color: #334155;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.01);
}

.check-item {
  padding: 16px;
  transition: background-color 0.2s ease;
}
.check-item:hover {
  background: #f8fafc;
}
.check-item.is-checked {
  background: #f0fdfa;
}
.check-text {
  font-size: 14px;
  color: #334155;
  line-height: 1.6;
  transition: color 0.2s;
}
.custom-checkbox {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
  transition: all 0.2s ease;
}
.no-pointer-events {
  pointer-events: none;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
