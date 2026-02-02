<template>
  <q-card flat bordered class="q-pa-md q-mb-md shadow-1">
    <q-card-section class="q-pa-none q-mb-md">
      <div class="row items-center">
        <q-icon name="health_and_safety" color="negative" size="24px" class="q-mr-sm" />
        <h3 class="text-subtitle1 text-weight-bold q-my-none text-negative">
          B. Safety & Contraindications (Mandatory)
        </h3>
        <q-badge color="negative" class="q-ml-sm" label="Critical" />
      </div>
      <q-separator class="q-mt-sm" />
    </q-card-section>

    <!-- Import all safety components -->
    <SafetyPregnancy v-model="localFormData" :v="v" @update="emitUpdate" />

    <SafetyKidney v-model="localFormData" :v="v" @update="emitUpdate" />

    <SafetyHeart v-model="localFormData" :v="v" @update="emitUpdate" />

    <SafetyHypertension v-model="localFormData" :v="v" @update="emitUpdate" />

    <SafetyDiabetes v-model="localFormData" :v="v" @update="emitUpdate" />

    <SafetyDeficiency v-model="localFormData" :v="v" @update="emitUpdate" />

    <SafetySeizures v-model="localFormData" :v="v" @update="emitUpdate" />

    <SafetyAsthma v-model="localFormData" :v="v" @update="emitUpdate" />

    <SafetySevereAllergy v-model="localFormData" :v="v" @update="emitUpdate" class="q-mt-md" />

    <SafetyLiverDisease v-model="localFormData" :v="v" @update="emitUpdate" class="q-mt-lg" />

    <SafetyKidneyStones v-model="localFormData" :v="v" @update="emitUpdate" class="q-mt-lg" />

    <SafetyElectrolyte v-model="localFormData" :v="v" @update="emitUpdate" class="q-mt-lg" />

    <SafetyIVAllergy v-model="localFormData" :v="v" @update="emitUpdate" />

    <SafetyIVReaction v-model="localFormData" :v="v" @update="emitUpdate" />

    <SafetyFever v-model="localFormData" :v="v" @update="emitUpdate" />

    <!-- Additional Safety Questions (Collapsible) -->
    <!-- <q-expansion-item
      label="Additional Safety Questions"
      caption="History of severe allergy, liver disease, kidney stones, electrolyte disorders"
      icon="expand_more"
      default-closed
      header-class="bg-grey-2"
      class="q-mt-lg"
    >

    </q-expansion-item> -->
  </q-card>
</template>

<script setup>
import { ref, watch } from 'vue'
import SafetyPregnancy from 'src/components/iv-assessment/partials/SafetyPregnancy.vue'
import SafetyKidney from 'src/components/iv-assessment/partials/SafetyKidney.vue'
import SafetyHeart from 'src/components/iv-assessment/partials/SafetyHeart.vue'
import SafetyHypertension from 'src/components/iv-assessment/partials/SafetyHypertension.vue'
import SafetyDiabetes from 'src/components/iv-assessment/partials/SafetyDiabetes.vue'
import SafetyDeficiency from 'src/components/iv-assessment/partials/SafetyDeficiency.vue'
import SafetySeizures from 'src/components/iv-assessment/partials/SafetySeizures.vue'
import SafetyAsthma from 'src/components/iv-assessment/partials/SafetyAsthma.vue'
import SafetyIVAllergy from 'src/components/iv-assessment/partials/SafetyIVAllergy.vue'
import SafetyIVReaction from 'src/components/iv-assessment/partials/SafetyIVReaction.vue'
import SafetyFever from 'src/components/iv-assessment/partials/SafetyFever.vue'
import SafetySevereAllergy from 'src/components/iv-assessment/partials/SafetySevereAllergy.vue'
import SafetyLiverDisease from 'src/components/iv-assessment/partials/SafetyLiverDisease.vue'
import SafetyKidneyStones from 'src/components/iv-assessment/partials/SafetyKidneyStones.vue'
import SafetyElectrolyte from 'src/components/iv-assessment/partials/SafetyElectrolyte.vue'

const props = defineProps({
  formData: {
    type: Object,
    required: true,
  },
  v: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:formData', 'update'])

// Create local reactive copy
const localFormData = ref(props.formData)

watch(
  () => props.formData,
  (newVal) => {
    localFormData.value = newVal
  },
  { deep: true },
)

function emitUpdate() {
  emit('update:formData', localFormData.value)
  emit('update')
}
</script>
