<!-- TreatmentPlanComponent.vue (new component) -->
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
      </div>

      <!-- Main Content -->
      <div class="max-w-6xl mx-auto q-pa-lg">
        <!-- Treatment Overview -->
        <q-card class="q-mb-lg shadow-1">
          <q-card-section class="bg-blue-grey-1">
            <div class="row items-center no-wrap">
              <q-icon name="medical_services" size="28px" color="primary" class="q-mr-md" />
              <div class="text-h5 text-weight-medium text-primary">Treatment Plan Overview</div>
              <q-space />
              <q-badge outline color="primary" label="3-Month Program" />
            </div>
          </q-card-section>

          <q-card-section>
            <div class="row q-col-gutter-md">
              <div
                class="col-12 col-md-3"
                v-for="(focus, index) in treatmentPlan.primary_focus"
                :key="index"
              >
                <q-item class="bg-white rounded-borders shadow-1">
                  <q-item-section avatar>
                    <q-avatar class="gredient" text-color="white" size="40px">
                      <q-icon :name="focusIcons[index]" />
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-medium">{{ focus }}</q-item-label>
                  </q-item-section>
                </q-item>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Treatment Timeline -->
        <div class="q-mb-xl">
          <div class="row items-center q-mb-md">
            <q-icon name="event" size="28px" color="primary" class="q-mr-md" />
            <div class="text-h4 text-weight-thin text-primary">Treatment Timeline</div>
          </div>

          <!-- Main Treatment Timeline -->
          <q-timeline color="primary" layout="comfortable" class="q-mt-xl">
            <!-- Clinic Session Timeline Entries -->
            <q-timeline-entry
              v-for="(clinic, clinicIndex) in treatmentPlan.in_clinic_sessions"
              :key="clinicIndex"
              :title="clinic.name"
              :subtitle="clinic.frequency"
              :icon="clinicIcons[clinicIndex]"
              side="left"
              class="q-mb-xl"
            >
              <q-card class="shadow-1">
                <q-card-section class="bg-grey-2">
                  <div class="row items-center justify-between">
                    <div class="text-h6 text-weight-medium">{{ clinic.name }}</div>
                    <q-badge
                      color="primary"
                      :label="`${clinic.sessions.length} Session${clinic.sessions.length > 1 ? 's' : ''}`"
                    />
                  </div>
                  <div class="text-subtitle1 text-grey-7">
                    <q-icon name="schedule" size="16px" class="q-mr-xs" />
                    {{ clinic.frequency }}
                  </div>
                </q-card-section>

                <!-- Session Steps Timeline -->
                <q-card-section class="q-pa-none">
                  <div
                    v-for="(session, sessionIndex) in clinic.sessions"
                    :key="sessionIndex"
                    class="session-container"
                  >
                    <div class="session-header bg-blue-1 q-pa-md">
                      <div class="text-h6 text-weight-medium">
                        <q-icon name="play_arrow" color="primary" class="q-mr-sm" />
                        Session {{ session.session_number }}: {{ session.title }}
                      </div>
                    </div>

                    <q-timeline color="blue" layout="dense" class="session-timeline q-pa-lg">
                      <q-timeline-entry
                        v-for="(step, stepIndex) in session.steps"
                        :key="stepIndex"
                        :title="`Step ${step.step_number}: ${step.title}`"
                        :subtitle="`Duration: ${step.duration}`"
                        :icon="stepIcons[stepIndex % stepIcons.length]"
                        :side="stepIndex % 2 === 0 ? 'left' : 'right'"
                        class="step-entry"
                      >
                        <q-card flat bordered class="step-card">
                          <q-card-section>
                            <div class="row q-col-gutter-lg">
                              <!-- Details Column -->
                              <div class="col-12 col-md-6">
                                <div class="text-weight-medium text-primary q-mb-xs">
                                  Procedure Details
                                </div>
                                <div class="text-body2">{{ step.details }}</div>

                                <div class="q-mt-md">
                                  <div class="text-weight-medium text-primary q-mb-xs">
                                    Technique
                                  </div>
                                  <div class="text-body2">{{ step.how_to_do }}</div>
                                </div>
                              </div>

                              <!-- Products & Equipment Column -->
                              <div class="col-12 col-md-6">
                                <div class="text-weight-medium text-primary q-mb-xs">
                                  Products & Equipment
                                </div>
                                <div class="q-gutter-xs">
                                  <q-chip
                                    v-for="(product, pIndex) in step.products_equipments"
                                    :key="pIndex"
                                    size="sm"
                                    color="blue-1"
                                    text-color="primary"
                                    icon="inventory_2"
                                  >
                                    {{ product }}
                                  </q-chip>
                                </div>

                                <div class="q-mt-md">
                                  <div class="text-weight-medium text-primary q-mb-xs">
                                    Finish With
                                  </div>
                                  <div class="q-gutter-xs">
                                    <q-chip
                                      v-for="(finish, fIndex) in step.finish"
                                      :key="fIndex"
                                      size="sm"
                                      color="green-1"
                                      text-color="positive"
                                      icon="check_circle"
                                    >
                                      {{ finish }}
                                    </q-chip>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <!-- Duration Badge -->
                            <div class="row justify-end q-mt-md">
                              <q-badge
                                outline
                                color="primary"
                                :label="`Duration: ${step.duration}`"
                              />
                            </div>
                          </q-card-section>
                        </q-card>
                      </q-timeline-entry>
                    </q-timeline>
                  </div>
                </q-card-section>
              </q-card>
            </q-timeline-entry>

            <!-- Homecare Timeline Entry -->
            <q-timeline-entry
              title="Homecare Regimen"
              subtitle="Daily maintenance routine"
              icon="home"
              color="green"
              side="right"
              class="q-mb-xl"
            >
              <q-card class="shadow-1">
                <q-card-section class="bg-green-1">
                  <div class="text-h6 text-weight-medium text-green-10">
                    Daily Homecare Protocol
                  </div>
                </q-card-section>
                <q-card-section>
                  <q-list bordered separator>
                    <q-item
                      v-for="(home, index) in treatmentPlan.homecare"
                      :key="index"
                      class="q-my-xs rounded-borders"
                    >
                      <q-item-section avatar>
                        <q-avatar color="green-2" text-color="green-10" icon="spa" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="text-weight-medium text-h6">{{
                          home.product
                        }}</q-item-label>
                        <q-item-label caption class="text-grey-7 text-body1">{{
                          home.usage
                        }}</q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <q-badge color="green" outline label="Essential" />
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-card-section>
              </q-card>
            </q-timeline-entry>

            <!-- Follow-up Timeline Entry -->
            <q-timeline-entry
              title="Follow-up & Monitoring"
              subtitle="Progress assessment schedule"
              icon="monitor_heart"
              color="orange"
              side="left"
            >
              <q-card class="shadow-1">
                <q-card-section class="bg-orange-1">
                  <div class="text-h6 text-weight-medium text-orange-10">
                    Progress Monitoring Schedule
                  </div>
                </q-card-section>
                <q-card-section>
                  <q-timeline color="orange" layout="dense" class="q-mt-md">
                    <q-timeline-entry
                      v-for="(follow, index) in treatmentPlan.follow_up"
                      :key="index"
                      :title="getFollowUpTitle(follow)"
                      :subtitle="getFollowUpSubtitle(follow)"
                      :icon="getFollowUpIcon(index)"
                      side="left"
                    >
                      <div class="text-body2">{{ follow }}</div>
                    </q-timeline-entry>
                  </q-timeline>
                </q-card-section>
              </q-card>
            </q-timeline-entry>
          </q-timeline>
        </div>

        <!-- Contraindications & Important Notes -->
        <div class="row q-col-gutter-lg q-mb-xl">
          <div class="col-12 col-md-6">
            <q-card class="shadow-1">
              <q-card-section class="bg-red-1 text-red-10">
                <div class="row items-center">
                  <q-icon name="warning" class="q-mr-sm" />
                  <div class="text-h6">Contraindications</div>
                </div>
              </q-card-section>
              <q-card-section>
                <q-list dense>
                  <q-item
                    v-for="(contra, index) in treatmentPlan.contraindications"
                    :key="index"
                    class="q-pa-sm"
                  >
                    <q-item-section avatar>
                      <q-icon name="cancel" color="negative" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ contra }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-md-6">
            <q-card class="shadow-1">
              <q-card-section class="bg-purple-1 text-purple-10">
                <div class="row items-center">
                  <q-icon name="insights" class="q-mr-sm" />
                  <div class="text-h6">Expected Outcomes</div>
                </div>
              </q-card-section>
              <q-card-section>
                <q-list dense>
                  <q-item class="q-pa-sm">
                    <q-item-section avatar>
                      <q-icon name="trending_down" color="positive" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>70-80% reduction in sebum production</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item class="q-pa-sm">
                    <q-item-section avatar>
                      <q-icon name="visibility" color="positive" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>50-60% improvement in pore appearance</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item class="q-pa-sm">
                    <q-item-section avatar>
                      <q-icon name="light_mode" color="positive" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>40-50% reduction in pigmentation</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="row justify-between items-center q-pt-lg border-top">
          <q-btn
            label="Back to Assessment"
            icon="arrow_back"
            rounded
            no-caps
            color="primary"
            class="q-px-xl"
            @click="emitPrevious"
          />
          <div class="row q-gutter-sm">
            <q-btn
              label="Print Plan"
              icon="print"
              rounded
              no-caps
              color="grey-7"
              class="q-px-xl"
              @click="printPlan"
            />
            <q-btn
              label="Save as PDF"
              icon="picture_as_pdf"
              rounded
              no-caps
              color="negative"
              class="q-px-xl"
              @click="saveAsPDF"
            />
            <q-btn
              label="Schedule Sessions"
              icon="calendar_today"
              rounded
              no-caps
              color="positive"
              class="q-px-xl"
              @click="scheduleSessions"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// defineProps({
//   treatmentPlan: {
//     type: [String, Object],
//     required: true,
//   },
// })

const treatmentPlan = {
  primary_focus: [
    'Reduce sebum production and oiliness',
    'Minimize visible pores and mild comedonal acne',
    'Lighten superficial pigmentation',
    'Maintain hydration and skin barrier health',
  ],
  in_clinic_sessions: [
    {
      name: 'Hydrafacial Clarifying & Brightening',
      frequency: 'Every 2 weeks for 3 months',
      sessions: [
        {
          session_number: 1,
          title: 'Sebum Control & Glow Boost',
          steps: [
            {
              step_number: 1,
              title: 'Deep Cleansing with Hydrafacial',
              details:
                'Use Hydrafacial (SA2) for T-zone & oily areas, focusing on comedone extraction and pore cleansing.',
              duration: '10 min',
              products_equipments: ['Hydrafacial', 'SA2', 'A03'],
              finish: ['Serum', 'Moisturizer', 'Sunscreen'],
              how_to_do:
                'Slow, even passes over T-zone and cheeks, mild suction for pore extraction.',
            },
            {
              step_number: 2,
              title: 'Lymphatic Drainage Massage',
              details:
                'Manual or Hydrafacial probe to reduce puffiness and support healthy barrier.',
              duration: '8 min',
              products_equipments: ['Hydrafacial Lymphatic Probe', 'Light facial gel'],
              finish: ['Serum', 'Moisturizer', 'Sunscreen'],
              how_to_do: 'Gentle outward strokes from chin and cheeks towards the jawline and ear.',
            },
            {
              step_number: 3,
              title: 'LED Blue Light Therapy',
              details: 'Targets comedones, bacteria, and calms mild inflammation.',
              duration: '15 min',
              products_equipments: ['LED Blue Light'],
              finish: ['Serum', 'Moisturizer', 'Sunscreen'],
              how_to_do: 'Hold 2–3 cm from skin, cover full face.',
            },
            {
              step_number: 4,
              title: 'Charcoal Peel Off Mask',
              details: 'Absorbs excess oil and mattifies skin.',
              duration: '10 min',
              products_equipments: ['Charcoal Peel Off Mask'],
              finish: ['Serum', 'Moisturizer', 'Sunscreen'],
              how_to_do: 'Apply thin, even layer after LED, allow to semi-dry and peel up gently.',
            },
          ],
        },
      ],
    },
    {
      name: 'Brightening Infusion Facial',
      frequency: 'Monthly',
      sessions: [
        {
          session_number: 1,
          title: 'Superficial Pigment Lightening & Hydration',
          steps: [
            {
              step_number: 1,
              title: 'Cutin Spatula Keratin Exfoliation',
              details: 'Removes surface debris and enhances serum penetration.',
              duration: '7 min',
              products_equipments: ['Cutin Spatula', 'A03 Solution'],
              finish: ['Serum', 'Moisturizer', 'Sunscreen'],
              how_to_do: 'Gentle gliding, avoid periocular area.',
            },
            {
              step_number: 2,
              title: 'Vitamin C & Hyaluronic Acid Ultrasound Infusion',
              details: 'Brightens pigmentation and boosts hydration.',
              duration: '10 min',
              products_equipments: ['Face Ultrasound Infusion', 'Vitamin C', 'Hyaluronic Acid'],
              finish: ['Serum', 'Moisturizer', 'Sunscreen'],
              how_to_do:
                'Apply ampoule, slow sweeping movements, emphasis on cheeks and malar region.',
            },
            {
              step_number: 3,
              title: 'Brighten Peel Off Mask',
              details: 'Evens skin tone and calms post-procedure redness.',
              duration: '10 min',
              products_equipments: ['Brighten Peel Off Mask'],
              finish: ['Serum', 'Moisturizer', 'Sunscreen'],
              how_to_do: 'Uniform coating, dry to touch, peel upward gently.',
            },
          ],
        },
      ],
    },
  ],
  homecare: [
    {
      product: 'Oil-control Gel Cleanser',
      usage: 'AM & PM; massage onto damp skin and rinse.',
    },
    {
      product: 'Non-comedogenic Moisturizer (Niacinamide based)',
      usage: 'AM & PM after cleansing.',
    },
    {
      product: 'Mattifying Sunscreen SPF 40+',
      usage: 'Each morning; reapply every 3 hours during outdoor exposure.',
    },
    {
      product: 'Salicylic Acid Serum (2%)',
      usage: 'At night on T-zone/comedone areas; skip if irritation.',
    },
    {
      product: 'Vitamin C Serum',
      usage: 'AM before sunscreen, focus on cheeks and pigmented areas.',
    },
  ],
  contraindications: [
    'No HiFU (age < 30).',
    'No Q-switch laser or deep chemical peels due to mild pigmentation and no downtime required.',
    'Avoid heavy/oily creams and occlusive products.',
    'Monitor for new onset allergies or sensitivities at each session.',
  ],
  follow_up: [
    'Clinic assessment every 2 sessions for monitoring improvement in oiliness, pores, and pigmentation.',
    'Review with photographs and adjust homecare at 3 months.',
    'Ensure patient adheres to homecare; update regimen if irritation or excessive dryness/oiliness develops.',
    'Ongoing monthly clinic review for plan adjustment as needed.',
  ],
}

const focusIcons = ['oil_barrel', 'filter_center_focus', 'light_mode', 'shield']
const clinicIcons = ['clean_hands', 'lightbulb']
const stepIcons = [
  'clean_hands',
  'waves',
  'light_mode',
  'mask',
  'exposure',
  'healing',
  'auto_awesome',
]

const emit = defineEmits(['previous'])

const emitPrevious = () => {
  emit('previous')
}

// Helper functions
const getFollowUpTitle = (follow) => {
  if (follow.includes('assessment every 2 sessions')) return 'Bi-weekly Assessment'
  if (follow.includes('Review with photographs')) return '3-Month Progress Review'
  if (follow.includes('patient adheres')) return 'Homecare Compliance Check'
  if (follow.includes('monthly clinic review')) return 'Monthly Follow-up'
  return 'Follow-up Session'
}

const getFollowUpSubtitle = (follow) => {
  if (follow.includes('assessment every 2 sessions')) return 'Session 2, 4, 6...'
  if (follow.includes('Review with photographs')) return 'Month 3'
  if (follow.includes('patient adheres')) return 'Ongoing'
  if (follow.includes('monthly clinic review')) return 'Monthly'
  return 'Scheduled'
}

const getFollowUpIcon = (index) => {
  const icons = ['assessment', 'photo_camera', 'verified_user', 'update']
  return icons[index] || 'event'
}

const printPlan = () => {
  console.log('Print plan clicked')
  window.print()
}

const saveAsPDF = () => {
  console.log('Save as PDF clicked')
}

const scheduleSessions = () => {
  console.log('Schedule sessions clicked')
}
</script>

<style scoped>
.border-top {
  border-top: 1px solid #e0e0e0;
  padding-top: 2rem;
}

.session-container {
  border-bottom: 1px solid #e0e0e0;
}

.session-container:last-child {
  border-bottom: none;
}

.session-header {
  border-left: 4px solid #1976d2;
}

.step-entry {
  margin-bottom: 2rem;
}

.step-card {
  transition: all 0.3s ease;
}

.step-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
}

.session-timeline {
  background: #fafafa;
  border-radius: 0 0 8px 8px;
}

.text-h4 {
  letter-spacing: 0.5px;
}

:deep(.q-timeline__title) {
  font-size: 1.25rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

:deep(.q-timeline__subtitle) {
  font-size: 0.9rem;
  opacity: 0.8;
}

@media print {
  .q-btn {
    display: none !important;
  }

  .q-card {
    box-shadow: none !important;
    border: 1px solid #ddd !important;
  }
}
</style>
