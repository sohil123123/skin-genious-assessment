<template>
  <div v-if="showSummary" class="q-mt-lg">
    <q-card flat bordered class="bg-grey-1">
      <q-card-section class="q-py-sm">
        <div class="row items-center">
          <q-icon name="summarize" color="info" size="20px" class="q-mr-sm" />
          <span class="text-weight-medium">Symptoms Summary</span>
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section class="q-py-sm">
        <div class="row q-col-gutter-sm">
          <!-- Current Symptoms -->
          <div class="col-12 col-md-6">
            <div class="text-caption text-grey-7">Current symptoms:</div>
            <div class="q-mt-xs">
              <div v-if="activeSymptoms.length === 0" class="text-positive text-caption">
                <q-icon name="check_circle" size="xs" /> No symptoms reported
              </div>
              <div v-else>
                <q-badge
                  v-for="symptom in activeSymptoms"
                  :key="symptom.name"
                  :color="getSymptomColor(symptom)"
                  class="q-mr-xs q-mb-xs"
                >
                  {{ symptom.name }}: {{ symptom.severity }}
                </q-badge>
              </div>
            </div>
          </div>

          <!-- Follow-up Needed -->
          <div class="col-12 col-md-6">
            <div class="text-caption text-grey-7">Follow-up needed:</div>
            <div class="q-mt-xs">
              <div v-if="activeFollowups.length === 0" class="text-positive text-caption">
                <q-icon name="check_circle" size="xs" /> No urgent follow-up required
              </div>
              <div v-else>
                <q-badge
                  v-for="followup in activeFollowups"
                  :key="followup"
                  color="warning"
                  class="q-mr-xs q-mb-xs"
                >
                  {{ followup }}
                </q-badge>
              </div>
            </div>
          </div>
        </div>

        <!-- Severity Summary -->
        <div v-if="activeSymptoms.length > 0" class="q-mt-md">
          <div class="text-caption text-grey-7">Severity distribution:</div>
          <div class="row q-col-gutter-xs q-mt-xs">
            <div class="col-3">
              <div class="text-center">
                <q-badge color="negative" class="q-mb-xs">Severe</q-badge>
                <div class="text-subtitle2">{{ severeCount }}</div>
              </div>
            </div>
            <div class="col-3">
              <div class="text-center">
                <q-badge color="warning" class="q-mb-xs">Moderate</q-badge>
                <div class="text-subtitle2">{{ moderateCount }}</div>
              </div>
            </div>
            <div class="col-3">
              <div class="text-center">
                <q-badge color="primary" class="q-mb-xs">Mild</q-badge>
                <div class="text-subtitle2">{{ mildCount }}</div>
              </div>
            </div>
            <div class="col-3">
              <div class="text-center">
                <q-badge color="positive" class="q-mb-xs">Present</q-badge>
                <div class="text-subtitle2">{{ presentCount }}</div>
              </div>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  formData: {
    type: Object,
    required: true,
  },
})

const symptoms = computed(() => {
  const section = props.formData.section_1_client_questionnaire?.D_symptoms_today
  if (!section) return []

  const symptomsList = []

  // Fatigue
  if (section.fatigue && section.fatigue !== 'None') {
    symptomsList.push({ name: 'Fatigue', severity: section.fatigue })
  }

  // Headache
  if (section.headache && section.headache !== 'None') {
    symptomsList.push({ name: 'Headache', severity: section.headache })
  }

  // Nausea
  if (section.nausea === 'Yes') {
    symptomsList.push({ name: 'Nausea', severity: 'Present' })
  }

  // Dizziness
  if (section.dizziness_on_standing === 'Yes') {
    symptomsList.push({ name: 'Dizziness', severity: 'Present' })
  }

  // Muscle cramps
  if (section.muscle_cramps === 'Yes') {
    symptomsList.push({ name: 'Muscle cramps', severity: 'Present' })
  }

  // Palpitations
  if (section.palpitations === 'Yes') {
    symptomsList.push({ name: 'Palpitations', severity: 'Present' })
  }

  // Swelling
  if (section.swelling_or_puffiness_today === 'Yes') {
    symptomsList.push({ name: 'Swelling', severity: 'Present' })
  }

  // Constipation
  if (section.constipation_or_sluggish_digestion_today === 'Yes') {
    symptomsList.push({ name: 'Constipation', severity: 'Present' })
  }

  return symptomsList
})

const activeSymptoms = computed(() => symptoms.value)

const activeFollowups = computed(() => {
  const section = props.formData.section_1_client_questionnaire?.D_symptoms_today
  if (!section) return []

  const followups = []

  // Nausea with vomiting
  if (section.nausea === 'Yes' && section.vomiting_if_nausea === 'Yes') {
    followups.push('Nausea with vomiting')
  }

  // Palpitations with chest pain/SOB
  if (section.palpitations === 'Yes' && section.palpitations_chest_pain_if_yes === 'Yes') {
    followups.push('Palpitations with chest pain/SOB')
  }

  // Active palpitations
  if (section.palpitations === 'Yes' && section.palpitations_frequency_if_yes === 'Happening now') {
    followups.push('Active palpitations')
  }

  // New swelling
  if (
    section.swelling_or_puffiness_today === 'Yes' &&
    section.swelling_duration_if_yes === 'New today'
  ) {
    followups.push('New swelling today')
  }

  return followups
})

const severeCount = computed(
  () => activeSymptoms.value.filter((s) => s.severity === 'Severe').length,
)

const moderateCount = computed(
  () => activeSymptoms.value.filter((s) => s.severity === 'Moderate').length,
)

const mildCount = computed(() => activeSymptoms.value.filter((s) => s.severity === 'Mild').length)

const presentCount = computed(
  () => activeSymptoms.value.filter((s) => s.severity === 'Present').length,
)

const showSummary = computed(() => activeSymptoms.value.length > 0)

function getSymptomColor(symptom) {
  switch (symptom.severity) {
    case 'Severe':
      return 'negative'
    case 'Moderate':
      return 'warning'
    case 'Mild':
      return 'primary'
    case 'Present':
      return 'info'
    default:
      return 'primary'
  }
}
</script>
