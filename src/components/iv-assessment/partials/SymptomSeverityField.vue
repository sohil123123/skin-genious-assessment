<template>
  <div class="q-mb-lg">
    <p class="text-weight-medium q-mb-xs">{{ label }}</p>
    <div class="row q-gutter-xs q-mb-sm">
      <q-chip
        v-for="item in severityOptions"
        :key="item"
        :label="item"
        :text-color="item === modelValue ? 'white' : 'dark'"
        :color="item === modelValue ? getSeverityColor(item) : 'grey-3'"
        size="md"
        clickable
        @click="$emit('update:modelValue', item)"
      />
    </div>
    <div v-if="hint" class="text-caption text-grey-6 q-ml-xs">
      <q-icon name="info" size="xs" /> {{ hint }}
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    required: true,
  },
  hint: {
    type: String,
    default: '',
  },
  severityOptions: {
    type: Array,
    default: () => ['None', 'Mild', 'Moderate', 'Severe'],
  },
})

defineEmits(['update:modelValue'])

function getSeverityColor(severity) {
  switch (severity) {
    case 'None':
      return 'positive'
    case 'Mild':
      return 'primary'
    case 'Moderate':
      return 'warning'
    case 'Severe':
      return 'negative'
    default:
      return 'primary'
  }
}
</script>
