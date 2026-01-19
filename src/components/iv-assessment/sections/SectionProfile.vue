<template>
  <q-card flat bordered class="q-pa-md q-mb-md shadow-1">
    <q-card-section class="q-pa-none q-mb-md">
      <div class="row items-center">
        <q-icon name="person" color="primary" size="24px" class="q-mr-sm" />
        <h3 class="text-subtitle1 text-weight-bold q-mb-none">Patient Information</h3>
      </div>
      <q-separator class="q-mt-sm" />
    </q-card-section>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-4">
        <q-input
          v-model="localFormData.meta.profile.name"
          label="Patient Name *"
          outlined
          dense
          :rules="[(val) => !!val || 'Name required']"
          clearable
          @update:model-value="emitUpdate"
        />
      </div>
      <div class="col-12 col-md-4">
        <q-input
          v-model.number="localFormData.meta.profile.age"
          type="number"
          label="Age *"
          outlined
          dense
          :rules="[
            (val) => (val !== null && val !== '') || 'Age required',
            (val) => (val >= 0 && val <= 130) || 'Age must be 0-130',
          ]"
          @update:model-value="emitUpdate"
        />
      </div>
      <div class="col-12 col-md-6">
        <p class="text-weight-medium q-mb-xs">Gender *</p>
        <div class="row q-gutter-xs">
          <q-chip
            v-for="item in genderOptions"
            :key="item"
            :label="item"
            :text-color="item === localFormData.meta.profile.gender ? 'white' : 'dark'"
            :color="item === localFormData.meta.profile.gender ? 'primary' : 'grey-3'"
            size="md"
            clickable
            @click="updateField('meta.profile.gender', item)"
          />
        </div>
      </div>
    </div>
  </q-card>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  formData: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:formData', 'update'])

const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say']

// Create local reactive copy
const localFormData = ref(props.formData)

function updateField(path, value) {
  const paths = path.split('.')
  let obj = localFormData.value
  for (let i = 0; i < paths.length - 1; i++) {
    if (!obj[paths[i]]) obj[paths[i]] = {}
    obj = obj[paths[i]]
  }
  obj[paths[paths.length - 1]] = value
  emitUpdate()
}

function emitUpdate() {
  emit('update:formData', localFormData.value)
  emit('update')
}
</script>
