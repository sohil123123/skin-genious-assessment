<template>
  <div class="clinical-step">
    <div class="step-header">
      <div class="icon-box">
        <q-icon name="local_pharmacy" size="20px" />
      </div>
      <div class="flex-grow">
        <h2 class="title">Bag Preparation</h2>
        <p class="subtitle">Combine ingredients into the IV bag(s)</p>
      </div>
      <q-badge color="teal-1" text-color="teal-8" class="q-py-xs q-px-sm rounded-borders font-medium">
        {{ bagSteps.length }} Steps
      </q-badge>
    </div>

    <div v-if="bagSteps && bagSteps.length > 0" class="clinical-card">
      <q-list separator class="clinical-list">
        <q-item
          v-for="(step, idx) in bagSteps"
          :key="'bag-'+idx"
          clickable
          v-ripple
          class="check-item"
          :class="{ 'is-checked': bagChecks[idx] }"
          @click="updateCheck(idx, !bagChecks[idx])"
        >
          <q-item-section avatar top>
            <div class="custom-checkbox bg-teal-8">
              <q-icon :name="bagChecks[idx] ? 'check' : 'remove'" size="16px" color="white" stroke-width="2" />
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
    
    <div v-else class="empty-state">
      No bag preparation steps required.
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  bagSteps: { type: Array, default: () => [] },
  bagChecks: { type: Object, default: () => ({}) }
})
const emit = defineEmits(['update:bagChecks'])

const updateCheck = (idx, val) => {
  emit('update:bagChecks', { ...props.bagChecks, [idx]: val })
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
.flex-grow {
  flex-grow: 1;
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
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  overflow: hidden;
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
  line-height: 1.5;
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
.empty-state {
  padding: 32px;
  text-align: center;
  color: #64748b;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
}
.font-medium {
  font-weight: 500;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
