<template>
  <q-dialog v-model="modelValue">
    <q-card style="max-width: 420px; width: 100%">
      <q-card-section class="row items-center q-pb-none">
        <q-icon name="error_outline" color="negative" size="md" />
        <div class="text-h6 q-ml-sm">
          {{ error?.field?.replaceAll('_', ' ') || 'Error details' }}
        </div>
      </q-card-section>

      <q-card-section class="q-pt-sm">
        <q-list dense bordered class="rounded-borders">
          <q-item v-if="error?.code">
            <q-item-section>Code</q-item-section>
            <q-item-section side>
              <q-chip dense color="red-2" text-color="red-10">
                {{ error.code }}
              </q-chip>
            </q-item-section>
          </q-item>

          <q-item v-for="(msg, i) in error?.messages || []" :key="i">
            <q-item-section>Message</q-item-section>
            <q-item-section side>{{ msg }}</q-item-section>
          </q-item>

          <q-separator v-if="error?.details" />

          <template v-if="error?.details">
            <q-item v-for="(val, key) in error.details" :key="key">
              <q-item-section>{{ formatKey(key) }}</q-item-section>
              <q-item-section side>{{ val }}</q-item-section>
            </q-item>
          </template>
        </q-list>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Close" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  error: Object,
})

const emit = defineEmits(['update:modelValue'])

const modelValue = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

function formatKey(key) {
  return key.replaceAll('_', ' ')
}
</script>
