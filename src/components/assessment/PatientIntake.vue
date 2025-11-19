<template>
  <div class="row q-col-gutter-lg">
    <!-- Left Column -->
    <div class="col-md-6 col-sm-6 col-xs-12">
      <!-- Patient Basics -->
      <section>
        <h2 class="text-sm font-semibold tracking-wider mb-4">PATIENT BASICS</h2>
        <div class="space-y-4">
          <q-input
            outlined
            label="Patient ID"
            v-model="assessmentData.user_id"
            class="custom-input"
          />

          <q-input outlined label="Full name" v-model="assessmentData.name" class="custom-input" />

          <div class="flex items-center q-gutter-sm">
            <!-- <span class="text-sm">Age</span> -->
            <q-select
              outlined
              label="Age"
              v-model="assessmentData.age"
              :options="ageOptions"
              dense
              @update:model-value="saveData(['age'])"
              style="width: 100px"
            />

            <div class="flex q-gutter-xs q-ml-sm">
              <q-radio
                v-model="assessmentData.gender"
                val="Male"
                label="Male"
                class="custom-radio"
              />
              <q-radio
                v-model="assessmentData.gender"
                val="Female"
                label="Female"
                class="custom-radio"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- Sun Exposure & Plans -->
      <section class="q-mt-lg">
        <h2 class="text-sm font-semibold tracking-wider q-pb-sm">SUN EXPOSURE & PLANS</h2>
        <div class="q-gutter-md">
          <div class="flex items-center justify-between">
            <div class="col">
              <q-select
                label="Daily sun exposure"
                outlined
                v-model="assessmentData.daily_sun_exposure_hours"
                :options="sunExposureOptions"
                clearable
                @update:model-value="saveData(['daily_sun_exposure_hours'])"
              />
            </div>
          </div>

          <div class="q-mt-lg">
            <span class="text-sm text-weight-bold">Upcoming Travel (7 days)</span>
            <div class="flex items-center q-gutter-sm q-mt-sm">
              <q-btn
                :flat="assessmentData.upcoming_travel == 'yes'"
                rounded
                :class="
                  assessmentData.upcoming_travel == 'yes' ? 'btn-custom' : 'bg-white text-grey-7'
                "
                @click="updateField('upcoming_travel', 'yes')"
                label="Yes"
                :outline="assessmentData.upcoming_travel == 'no'"
              />
              <q-btn
                :flat="assessmentData.upcoming_travel == 'no'"
                rounded
                :class="
                  assessmentData.upcoming_travel == 'no' ? 'btn-custom' : 'bg-white text-grey-7'
                "
                @click="updateField('upcoming_travel', 'no')"
                label="No"
                :outline="assessmentData.upcoming_travel == 'yes'"
              />
            </div>
          </div>

          <div class="q-mt-lg">
            <span class="text-sm text-weight-bold">Social Event (7 days)</span>
            <div class="flex items-center q-gutter-sm q-mt-xs">
              <q-btn
                :flat="assessmentData.social_event == 'yes'"
                rounded
                :class="
                  assessmentData.social_event == 'yes' ? 'btn-custom' : 'bg-white text-grey-7'
                "
                @click="updateField('social_event', 'yes')"
                label="Yes"
                :outline="assessmentData.social_event == 'no'"
              />
              <q-btn
                :flat="assessmentData.social_event == 'no'"
                rounded
                :class="assessmentData.social_event == 'no' ? 'btn-custom' : 'bg-white text-grey-7'"
                @click="updateField('social_event', 'no')"
                label="No"
                :outline="assessmentData.social_event == 'yes'"
              />
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Right Column -->
    <div class="col-md-6 col-sm-6 col-xs-12">
      <!-- Medical History -->
      <section>
        <h2 class="text-sm font-semibold tracking-wider mb-4">MEDICAL HISTORY</h2>
        <div class="grid grid-cols-2 gap-3">
          <template v-for="value in medicalHistoryOptions" :key="value">
            <q-checkbox
              v-model="assessmentData.medical_history"
              :label="value"
              :val="value"
              class="custom-checkbox"
              @update:model-value="updateMedicalHistory"
            />
          </template>
        </div>
      </section>

      <!-- Current Skincare & Allergies -->
      <section>
        <h2 class="text-sm font-semibold tracking-wider mb-4">CURRENT SKINCARE & ALLERGIES</h2>
        <div class="q-gutter-sm">
          <q-btn
            v-for="product in productsAndAllergies"
            :key="product"
            :flat="assessmentData.allergies.includes(product)"
            rounded
            :class="
              assessmentData.allergies.includes(product) ? 'btn-custom' : 'bg-white text-grey-7'
            "
            @click="updateAllergies(product)"
            :label="product"
            no-caps
            :outline="!assessmentData.allergies.includes(product)"
          />
        </div>
      </section>

      <section class="q-mt-md">
        <span class="text-sm text-weight-bold">Is Patient Pregnant</span>
        <div class="flex items-center q-gutter-sm q-mt-xs">
          <q-btn
            :flat="assessmentData.is_pregnant == 1"
            rounded
            :class="assessmentData.is_pregnant == 1 ? 'btn-custom' : 'bg-white text-grey-7'"
            @click="updateField('is_pregnant', 1)"
            label="Yes"
            :outline="assessmentData.is_pregnant == 0"
          />
          <q-btn
            :flat="assessmentData.is_pregnant == 0"
            rounded
            :class="assessmentData.is_pregnant == 0 ? 'btn-custom' : 'bg-white text-grey-7'"
            @click="updateField('is_pregnant', 0)"
            label="No"
            :outline="assessmentData.is_pregnant == 1"
          />
        </div>
      </section>

      <section class="q-mt-md">
        <span class="text-sm text-weight-bold">Breast Feeding?</span>
        <div class="flex items-center q-gutter-sm q-mt-xs">
          <q-btn
            :flat="assessmentData.breastfeeding == 'yes'"
            rounded
            :class="assessmentData.breastfeeding == 'yes' ? 'btn-custom' : 'bg-white text-grey-7'"
            @click="updateField('breastfeeding', 'yes')"
            label="Yes"
            :outline="assessmentData.breastfeeding == 'no'"
          />
          <q-btn
            :flat="assessmentData.breastfeeding == 'no'"
            rounded
            :class="assessmentData.breastfeeding == 'no' ? 'btn-custom' : 'bg-white text-grey-7'"
            @click="updateField('breastfeeding', 'no')"
            label="No"
            :outline="assessmentData.breastfeeding == 'yes'"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import _ from 'lodash'
import { useAssessmentStore } from 'src/stores/assessmentStore'
import { storeToRefs } from 'pinia'

const store = useAssessmentStore()
const { assessmentData } = storeToRefs(store)

// const commonStore = useCommonStore()
const emit = defineEmits(['process', 'save_data', 'upload_images'])

const props = defineProps({
  isPostAssessment: {
    type: Boolean,
    default: false,
  },
  startProcessingStep: {
    type: Boolean,
    default: false,
  },
})

const startProcessingStep = ref(props.startProcessingStep)

// Keep it in sync with parent changes
watch(
  () => props.startProcessingStep,
  (val) => {
    startProcessingStep.value = val
  },
)

// Emit changes back to parent whenever child updates it
watch(startProcessingStep, (val) => {
  emit('update:startProcessingStep', val)
})

// Options for selects
const ageOptions = Array.from({ length: 83 }, (_, i) => i + 18)
const sunExposureOptions = ['Less than 1 hour', '1-2 hours', 'More than 2 hours']
const medicalHistoryOptions = [
  'Blood thinners',
  'Diabetes',
  'Thyroid',
  'PCOD',
  'Hypertension',
  'On medications',
  'None',
]

const productsAndAllergies = ['Salicylic Acid', 'Glycolic Acid', 'Aloe Vera', 'Vitamin C', 'None']

// Update field function
const updateField = (field, value) => {
  assessmentData.value[field] = value
  saveData([field])
}

function saveData(field) {
  emit('save_data', field)
}

function updateMedicalHistory(value) {
  if (value.includes('None')) {
    // If "None" is selected, keep only "None"
    assessmentData.value.medical_history = ['None']
  } else {
    // If any other option is selected, remove "None"
    assessmentData.value.medical_history = _.filter(value, (item) => item !== 'None')
  }
  saveData(['medical_history'])
}

function updateAllergies(product) {
  const index = assessmentData.value.allergies.indexOf(product)
  if (index > -1) {
    assessmentData.value.allergies.splice(index, 1)
  } else {
    if (product === 'None') {
      assessmentData.value.allergies = ['None']
    } else {
      assessmentData.value.allergies = assessmentData.value.allergies.filter(
        (item) => item !== 'None',
      )
      assessmentData.value.allergies.push(product)
    }
  }
  saveData(['allergies'])
}
</script>
