<template>
  <div class="q-mb-lg">
    <p class="text-weight-medium text-grey-7 q-mb-xs">{{ label }}</p>
    <div class="row q-gutter-xs q-mb-sm">
      <q-chip
        v-for="item in options"
        :key="item.value || item"
        :label="item.label || item"
        :text-color="isSelected(item) ? 'white' : 'dark'"
        :color="isSelected(item) ? chipColor : 'grey-6'"
        :square="isSelected(item)"
        outline
        clickable
        @click="toggleSelection(item)"
      />
    </div>
    <div v-if="hint" class="text-caption text-grey-6 q-ml-xs">
      <q-icon name="info" size="xs" /> {{ hint }}
    </div>
    <div v-if="showSelected && selectedItems.length > 0" class="text-caption text-grey-8 q-mt-xs">
      Selected: {{ selectedItems.map((i) => i.label || i).join(', ') }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  label: {
    type: String,
    required: true,
  },
  options: {
    type: Array,
    default: () => [],
  },
  chipColor: {
    type: String,
    default: 'blue-9',
  },
  hint: {
    type: String,
    default: '',
  },
  showSelected: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const selectedItems = computed(() => props.modelValue)

function isSelected(item) {
  const itemValue = item.value || item
  return selectedItems.value.some((selected) => {
    const selectedValue = selected.value || selected
    return selectedValue === itemValue
  })
}

function toggleSelection(item) {
  const itemValue = item.value || item
  const newSelection = [...selectedItems.value]

  if (isSelected(item)) {
    // Remove if already selected
    const index = newSelection.findIndex((selected) => {
      const selectedValue = selected.value || selected
      return selectedValue === itemValue
    })
    if (index > -1) {
      newSelection.splice(index, 1)
    }
  } else {
    // Add if not selected
    newSelection.push(item)
  }

  emit('update:modelValue', newSelection)
}
</script>
