<template>
  <div>
    <!-- Post-Care Sequence -->
    <div class="q-mb-xl">
      <div class="section-header q-mb-md">
        <div class="section-icon bg-indigo">
          <q-icon name="logout" color="white" size="16px" />
        </div>
        <div>
          <div class="section-title">Post-Care Sequence</div>
          <div class="section-sub">Steps to follow after treatment completion</div>
        </div>
      </div>

      <div class="card bg-indigo-50 q-pa-none q-mb-none overflow-hidden border-indigo-100">
        <q-list separator class="custom-list">
          <q-item
            v-for="(step, idx) in postCareSteps"
            :key="'pc-'+idx"
            tag="label"
            v-ripple
            class="q-py-md item-transition"
            :class="{ 'bg-indigo-100': postChecks[idx] }"
          >
            <q-item-section avatar top>
              <q-checkbox 
                :model-value="postChecks[idx]" 
                @update:model-value="val => updatePostCheck(idx, val)"
                color="indigo" 
                size="md" 
              />
            </q-item-section>
            <q-item-section>
              <div
                class="text-body2 text-indigo-900"
                :class="{ 'text-strike text-indigo-400': postChecks[idx] }"
              >
                {{ step }}
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </div>

    <!-- Required Documentation -->
    <div v-if="documentationSteps && documentationSteps.length > 0" class="q-mb-xl">
      <div class="section-header q-mb-md">
        <div class="section-icon bg-indigo-8">
          <q-icon name="edit_document" color="white" size="16px" />
        </div>
        <div>
          <div class="section-title">Required Documentation</div>
          <div class="section-sub">Ensure all documentation is complete</div>
        </div>
      </div>

      <div class="card bg-white q-pa-none q-mb-none overflow-hidden">
        <q-list separator class="custom-list">
          <q-item
            v-for="(doc, idx) in documentationSteps"
            :key="'doc-'+idx"
            tag="label"
            v-ripple
            class="q-py-md item-transition"
            :class="{ 'bg-indigo-50': docChecks[idx] }"
          >
            <q-item-section avatar top>
              <q-checkbox 
                :model-value="docChecks[idx]" 
                @update:model-value="val => updateDocCheck(idx, val)"
                color="indigo-8" 
                size="md" 
              />
            </q-item-section>
            <q-item-section>
              <div
                class="text-body2 text-slate-700"
                :class="{ 'text-strike text-slate-400': docChecks[idx] }"
              >
                {{ doc }}
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </div>

    <!-- Conditional Signoff -->
    <div v-if="signoffConditions && signoffConditions.length > 0">
      <div class="rounded-xl border border-orange-200 bg-orange-50 p-4 flex items-start gap-4 q-pa-md">
        <div class="bg-white q-pa-sm rounded-full shadow-sm text-orange-600">
          <q-icon name="notification_important" size="24px" />
        </div>
        <div>
          <div class="text-subtitle2 font-bold text-orange-900 q-mb-xs">
            Clinician Sign-off Required If:
          </div>
          <ul class="q-pl-md q-my-none text-sm text-orange-900 leading-relaxed q-mt-sm">
            <li v-for="(cond, i) in signoffConditions" :key="'cond-'+i">
              {{ cond }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  postCareSteps: {
    type: Array,
    default: () => []
  },
  postChecks: {
    type: Object,
    default: () => ({})
  },
  documentationSteps: {
    type: Array,
    default: () => []
  },
  docChecks: {
    type: Object,
    default: () => ({})
  },
  signoffConditions: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:postChecks', 'update:docChecks'])

const updatePostCheck = (idx, val) => {
  emit('update:postChecks', { ...props.postChecks, [idx]: val })
}

const updateDocCheck = (idx, val) => {
  emit('update:docChecks', { ...props.docChecks, [idx]: val })
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
.bg-indigo { background: #3f51b5; }
.bg-indigo-8 { background: #283593; }

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
.border-indigo-100 { border-color: #e0e7ff; }

.item-transition {
  transition: all 0.2s ease;
}
.bg-indigo-50 {
  background-color: #eef2ff;
}
.bg-indigo-100 {
  background-color: #e0e7ff;
}
</style>
