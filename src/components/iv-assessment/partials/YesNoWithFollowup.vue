<template>
  <div :class="{ 'q-mb-lg option-group group--error': error }">
    <p class="text-weight-medium q-mb-xs" :class="{ 'text-negative': error }">{{ label }}</p>
    <div class="row q-gutter-xs q-mb-sm">
      <q-chip
        v-for="item in options"
        :key="item"
        :label="item"
        :text-color="item === modelValue ? 'white' : 'dark'"
        :color="item === modelValue ? (item === 'Yes' ? warningColor : positiveColor) : 'grey-3'"
        size="md"
        clickable
        @click="updateValue(item)"
      />
    </div>

    <!-- Follow-up Section -->
    <div v-if="showFollowup" class="q-ml-md q-mt-md bg-yellow-1 q-pa-sm rounded-borders">
      <template v-if="followupType === 'single-select'">
        <p class="text-weight-medium text-grey-7 q-mb-xs">{{ followupLabel }}</p>
        <div class="row q-gutter-xs">
          <q-chip
            v-for="item in followupOptions"
            :key="item"
            :label="item"
            :text-color="item === followupValue ? 'white' : 'dark'"
            :color="item === followupValue ? followupColor : 'grey-6'"
            :square="item === followupValue"
            outline
            clickable
            @click="updateFollowup(item)"
          />
        </div>
      </template>

      <template v-else-if="followupType === 'multi-select'">
        <p class="text-weight-medium q-mb-xs">{{ followupLabel }}</p>
        <div class="row q-gutter-xs">
          <q-chip
            v-for="item in followupOptions"
            :key="item"
            :label="item"
            :text-color="followupValue?.includes(item) ? 'white' : 'dark'"
            :color="followupValue?.includes(item) ? followupColor : 'grey-6'"
            :square="followupValue?.includes(item)"
            outline
            clickable
            @click="toggleMultiSelect(item)"
          />
        </div>
      </template>

      <template v-else-if="followupType === 'text'">
        <q-input
          v-model="followupValue"
          :label="followupLabel"
          outlined
          dense
          @update:model-value="emitUpdate"
        />
      </template>
    </div>

    <div v-if="hint" class="text-caption text-grey-6 q-ml-xs">
      <q-icon name="info" size="xs" /> {{ hint }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    required: true,
  },
  followupLabel: {
    type: String,
    default: '',
  },
  followupPath: {
    type: String,
    default: '',
  },
  formData: {
    type: Object,
    default: () => ({}),
  },
  followupOptions: {
    type: Array,
    default: () => ['Yes', 'No'],
  },
  followupType: {
    type: String,
    default: 'single-select',
    validator: (value) => ['single-select', 'multi-select', 'text'].includes(value),
  },
  options: {
    type: Array,
    default: () => ['Yes', 'No'],
  },
  warningColor: {
    type: String,
    default: 'warning',
  },
  positiveColor: {
    type: String,
    default: 'positive',
  },
  followupColor: {
    type: String,
    default: 'blue-9',
  },
  hint: {
    type: String,
    default: '',
  },
  error: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'update'])

const showFollowup = computed(() => props.modelValue === 'Yes')

// Get followup value from formData using path
const followupValue = computed({
  get() {
    if (!props.followupPath) return props.followupType === 'multi-select' ? [] : ''
    const paths = props.followupPath.split('.')
    let value = props.formData
    for (const path of paths) {
      if (value && value[path] !== undefined) {
        value = value[path]
      } else {
        return props.followupType === 'multi-select' ? [] : ''
      }
    }
    return value
  },
  set(newValue) {
    if (!props.followupPath) return
    const paths = props.followupPath.split('.')
    let obj = props.formData
    for (let i = 0; i < paths.length - 1; i++) {
      if (!obj[paths[i]]) {
        obj[paths[i]] = {}
      }
      obj = obj[paths[i]]
    }
    obj[paths[paths.length - 1]] = newValue
    emit('update')
  },
})

function updateValue(value) {
  emit('update:modelValue', value)
  if (value !== 'Yes') {
    followupValue.value = props.followupType === 'multi-select' ? [] : ''
  }
}

function updateFollowup(item) {
  followupValue.value = item
}

function toggleMultiSelect(item) {
  const current = followupValue.value || []
  if (current.includes(item)) {
    followupValue.value = current.filter((i) => i !== item)
  } else {
    followupValue.value = [...current, item]
  }
}

function emitUpdate() {
  emit('update')
}
</script>
