<template>
  <div class="clinical-step">
    <!-- Required Documentation -->
    <div class="q-mb-xl">
      <div class="step-header">
        <div class="icon-box">
          <q-icon name="edit_document" size="20px" />
        </div>
        <div>
          <h2 class="title">Required Documentation</h2>
          <p class="subtitle">Ensure all documentation is complete</p>
        </div>
      </div>

      <div v-if="documentationSteps && documentationSteps.length > 0" class="clinical-card">
        <q-list separator class="clinical-list">
          <q-item
            v-for="(doc, idx) in documentationSteps"
            :key="'doc-'+idx"
            clickable
            v-ripple
            class="check-item"
            :class="{ 'is-checked': docChecks[idx] }"
            @click="updateDocCheck(idx, !docChecks[idx])"
          >
            <q-item-section avatar top>
              <div class="custom-checkbox bg-teal-8">
                <q-icon :name="docChecks[idx] ? 'check' : 'remove'" size="16px" color="white" stroke-width="2" />
              </div>
            </q-item-section>
            <q-item-section>
              <div class="check-text">
                {{ doc }}
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
      
      <div v-else class="empty-state">
        No specific documentation steps required.
      </div>
    </div>

    <!-- Conditional Signoff -->
    <div v-if="signoffConditions && signoffConditions.length > 0">
      <div class="step-header q-mb-md">
        <div class="icon-box warning">
          <q-icon name="notification_important" size="20px" />
        </div>
        <div>
          <h2 class="title">Clinician Sign-off</h2>
          <p class="subtitle">Required under these conditions</p>
        </div>
      </div>
      
      <div class="clinical-card q-pa-md bg-orange-50 border-orange-200">
        <ul class="q-pl-md q-my-none text-sm text-orange-900 leading-relaxed">
          <li v-for="(cond, i) in signoffConditions" :key="'cond-'+i">
            {{ cond }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  documentationSteps: { type: Array, default: () => [] },
  docChecks: { type: Object, default: () => ({}) },
  signoffConditions: { type: Array, default: () => [] }
})
const emit = defineEmits(['update:docChecks'])

const updateDocCheck = (idx, val) => {
  emit('update:docChecks', { ...props.docChecks, [idx]: val })
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
.icon-box.warning {
  background: #fff7ed;
  border-color: #ffedd5;
  color: #c2410c;
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
.bg-orange-50 {
  background-color: #fff7ed;
}
.border-orange-200 {
  border-color: #fed7aa;
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
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
