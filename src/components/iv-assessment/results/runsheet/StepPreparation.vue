<template>
  <div>
    <!-- Setup & Mixing -->
    <div v-if="setupSteps && setupSteps.length > 0" class="q-mb-xl">
      <div class="section-header q-mb-md">
        <div class="section-icon bg-purple">
          <q-icon name="science" color="white" size="16px" />
        </div>
        <div>
          <div class="section-title">Setup & Mixing</div>
          <div class="section-sub">Prepare your workspace and initial mixtures</div>
        </div>
      </div>

      <div class="card bg-white q-pa-none q-mb-none overflow-hidden">
        <q-list separator class="custom-list">
          <q-item
            v-for="(step, idx) in setupSteps"
            :key="'setup-'+idx"
            tag="label"
            v-ripple
            class="q-py-md item-transition"
            :class="{ 'bg-purple-50': setupChecks[idx] }"
          >
            <q-item-section avatar top>
              <q-checkbox 
                :model-value="setupChecks[idx]" 
                @update:model-value="val => updateSetupCheck(idx, val)"
                color="purple" 
                size="md" 
              />
            </q-item-section>
            <q-item-section>
              <div
                class="text-body2 text-slate-700"
                :class="{ 'text-strike text-slate-400': setupChecks[idx] }"
              >
                {{ step }}
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </div>

    <!-- Bag Preparation -->
    <div v-if="bagSteps && bagSteps.length > 0">
      <div class="section-header q-mb-md">
        <div class="section-icon bg-teal">
          <q-icon name="local_pharmacy" color="white" size="16px" />
        </div>
        <div>
          <div class="section-title">Bag Preparation</div>
          <div class="section-sub">Combine ingredients into the IV bag(s)</div>
        </div>
        <q-space />
        <q-badge color="teal-1" text-color="teal-8" class="q-py-xs q-px-sm rounded-borders">
          {{ bagSteps.length }} Steps
        </q-badge>
      </div>

      <div class="card bg-white q-pa-none q-mb-none overflow-hidden">
        <q-list separator class="custom-list">
          <q-item
            v-for="(step, idx) in bagSteps"
            :key="'bag-'+idx"
            tag="label"
            v-ripple
            class="q-py-md item-transition"
            :class="{ 'bg-teal-50': bagChecks[idx] }"
          >
            <q-item-section avatar top>
              <q-checkbox 
                :model-value="bagChecks[idx]" 
                @update:model-value="val => updateBagCheck(idx, val)"
                color="teal" 
                size="md" 
              />
            </q-item-section>
            <q-item-section>
              <div
                class="text-body2 text-slate-700"
                :class="{ 'text-strike text-slate-400': bagChecks[idx] }"
              >
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
  setupSteps: {
    type: Array,
    default: () => []
  },
  setupChecks: {
    type: Object,
    default: () => ({})
  },
  bagSteps: {
    type: Array,
    default: () => []
  },
  bagChecks: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:setupChecks', 'update:bagChecks'])

const updateSetupCheck = (idx, val) => {
  emit('update:setupChecks', { ...props.setupChecks, [idx]: val })
}

const updateBagCheck = (idx, val) => {
  emit('update:bagChecks', { ...props.bagChecks, [idx]: val })
}
</script>

<style scoped>
.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
.section-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.bg-purple { background: #9c27b0; }
.bg-teal { background: #0bbfb0; }

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}
.section-sub {
  font-size: 12px;
  color: #666;
}
.card {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
}
.item-transition {
  transition: all 0.2s ease;
}
.bg-purple-50 {
  background-color: #f3e5f5;
}
.bg-teal-50 {
  background-color: #e1f5ee;
}
</style>
