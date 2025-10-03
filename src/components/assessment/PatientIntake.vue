<template>
  <div class="min-h-screen bg-grey-2 p-6">
    <div class="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center gap-3">
          <div
            class="w-12 h-12 rounded-full border-2 border-black flex items-center justify-center"
          >
            <span class="text-2xl font-serif">A</span>
          </div>
          <span class="text-xl font-light tracking-wider">AI AESTHETICS</span>
        </div>
        <!-- <h1 class="text-4xl font-serif">Patient Intake</h1> -->
        <div class="flex gap-2">
          <div class="w-2 h-2 rounded-full bg-black"></div>
          <div class="w-2 h-2 rounded-full bg-grey-4"></div>
          <div class="w-2 h-2 rounded-full bg-grey-4"></div>
        </div>
      </div>

      <div class="row q-col-gutter-lg">
        <!-- Left Column -->
        <div class="col-md-6">
          <!-- Patient Basics -->
          <section>
            <h2 class="text-sm font-semibold tracking-wider mb-4">PATIENT BASICS</h2>
            <div class="space-y-4">
              <q-input
                outlined
                placeholder="Full name"
                v-model="formData.fullName"
                class="custom-input"
              />

              <div class="flex items-center gap-4">
                <span class="text-sm">Age</span>
                <q-select outlined v-model="formData.age" :options="ageOptions" dense />

                <div class="flex gap-4 q-ml-sm">
                  <q-radio v-model="formData.gender" val="Male" label="Male" class="custom-radio" />
                  <q-radio
                    v-model="formData.gender"
                    val="Female"
                    label="Female"
                    class="custom-radio"
                  />
                </div>
              </div>
            </div>
          </section>

          <!-- Sun Exposure & Plans -->
          <section>
            <h2 class="text-sm font-semibold tracking-wider mb-4">SUN EXPOSURE & PLANS</h2>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm">Sun exposure</span>
                <div class="flex items-center gap-3">
                  <span class="text-sm text-grey-7">Low</span>
                  <q-toggle v-model="formData.sunExposure" color="orange" />
                </div>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-sm">Upcoming travel</span>
                <div class="flex items-center gap-3">
                  <span class="text-sm text-grey-7">Other</span>
                  <q-toggle v-model="formData.upcomingTravel" color="orange" />
                </div>
              </div>
            </div>
          </section>

          <!-- Clinical Examination -->
          <section>
            <h2 class="text-sm font-semibold tracking-wider mb-4">CLINICAL EXAMINATION</h2>
            <div class="space-y-4">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm">Pigment score</span>
                </div>
                <q-slider
                  v-model="formData.pigmentScore"
                  :min="0"
                  :max="100"
                  color="primary"
                  class="custom-slider"
                />
              </div>

              <div class="flex items-center justify-between">
                <span class="text-sm">Acne grade</span>
                <div class="flex items-center gap-4">
                  <span class="text-sm">None</span>
                  <span class="text-grey-6">|</span>
                  <span class="text-sm">Severe</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- Right Column -->
        <div class="col-md-6">
          <!-- Medical History -->
          <section>
            <h2 class="text-sm font-semibold tracking-wider mb-4">MEDICAL HISTORY</h2>
            <div class="grid grid-cols-2 gap-3">
              <q-checkbox v-model="formData.diabetes" label="Diabetes" class="custom-checkbox" />
              <q-checkbox v-model="formData.thyroid" label="Thyroid" class="custom-checkbox" />
              <q-checkbox v-model="formData.pcod" label="PCOD" class="custom-checkbox" />
              <q-checkbox
                v-model="formData.hypertension"
                label="Hypertension"
                class="custom-checkbox"
              />
              <q-checkbox
                v-model="formData.onMedications"
                label="On medications"
                class="custom-checkbox col-span-2"
              />
            </div>
          </section>

          <!-- Current Skincare & Allergies -->
          <section>
            <h2 class="text-sm font-semibold tracking-wider mb-4">CURRENT SKINCARE & ALLERGIES</h2>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <q-checkbox
                  v-model="formData.usingSkincare"
                  label="Using skincare products"
                  class="custom-checkbox"
                />
                <q-toggle v-model="formData.usingSkincare" color="orange" />
              </div>

              <div class="flex items-center justify-between">
                <q-checkbox
                  v-model="formData.allergies"
                  label="Any allergies"
                  class="custom-checkbox"
                />
                <q-toggle v-model="formData.allergies" color="orange" />
              </div>
            </div>
          </section>

          <!-- Clinical Examination -->
          <section>
            <h2 class="text-sm font-semibold tracking-wider mb-4">CLINICAL EXAMINATION</h2>
            <div class="space-y-4">
              <div>
                <label class="text-sm block mb-2">Acne grade</label>
                <div class="flex gap-2">
                  <q-btn
                    v-for="grade in acneGrades"
                    :key="grade"
                    :label="grade"
                    :color="formData.acneGradeRight === grade ? 'primary' : 'white'"
                    :text-color="formData.acneGradeRight === grade ? 'white' : 'grey-7'"
                    :outline="formData.acneGradeRight !== grade"
                    @click="updateField('acneGradeRight', grade)"
                    class="rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label class="text-sm block mb-2">Skin type</label>
                <q-select
                  outlined
                  v-model="formData.skinType"
                  :options="skinTypes"
                  class="w-full"
                />
              </div>
            </div>
          </section>
        </div>
      </div>

      <!-- Start Face Scan Button -->
      <div class="flex justify-center q-mt-lg">
        <q-btn color="primary" label="Start Face Scan" size="lg" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'

// Form data
const formData = reactive({
  fullName: '',
  age: 21,
  gender: 'Male',
  sunExposure: false,
  upcomingTravel: false,
  diabetes: false,
  thyroid: false,
  pcod: false,
  hypertension: false,
  onMedications: false,
  usingSkincare: false,
  allergies: false,
  pigmentScore: 50,
  acneGrade: 'None',
  acneGradeRight: 'None',
  skinType: 'Normal',
})

// Options for selects
const ageOptions = Array.from({ length: 83 }, (_, i) => i + 18)
const acneGrades = ['None', 'Mild', 'Moderate']
const skinTypes = ['Normal', 'Dry', 'Oily', 'Combination', 'Sensitive']

// Update field function
const updateField = (field, value) => {
  formData[field] = value
}
</script>
