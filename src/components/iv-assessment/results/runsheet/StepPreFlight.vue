<template>
  <div class="clinical-step">
    <div class="step-header">
      <div class="icon-box">
        <q-icon name="verified_user" size="20px" />
      </div>
      <div>
        <h2 class="title">Safety & Pre-flight</h2>
        <p class="subtitle">Mandatory clinical checks before proceeding</p>
      </div>
    </div>

    <div class="clinical-card">
      <q-list separator class="clinical-list">
        <q-item
          v-for="(check, idx) in checksList"
          :key="idx"
          clickable
          v-ripple
          class="check-item"
          :class="{ 'is-checked': modelValue[idx] }"
          @click="updateCheck(idx, !modelValue[idx])"
        >
          <q-item-section avatar top>
            <div class="custom-checkbox bg-teal-8">
              <q-icon :name="modelValue[idx] ? 'check' : 'remove'" size="16px" color="white" stroke-width="2" />
            </div>
          </q-item-section>
          <q-item-section>
            <div class="check-text">
              {{ check }}
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  checksList: { type: Array, default: () => [] },
  modelValue: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['update:modelValue'])

const updateCheck = (idx, val) => {
  emit('update:modelValue', { ...props.modelValue, [idx]: val })
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
