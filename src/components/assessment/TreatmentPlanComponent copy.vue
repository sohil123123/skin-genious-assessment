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

      <div v-for="(plan, planIndex) in treatmentPlan" :key="planIndex" class="q-mb-xl">
        <!-- Plan Header Card -->
        <q-card flat bordered class="bg-white shadow-2 q-pa-md rounded-borders">
          <div class="row items-center justify-between">
            <div>
              <div class="text-h6 text-weight-bold text-primary">
                {{ plan.plan_name }}
              </div>
              <div class="text-caption text-grey">Total Duration: {{ plan.total_time }}</div>
            </div>
          </div>
        </q-card>

        <!-- Timeline -->
        <q-timeline color="primary" layout="dense" class="q-mt-lg">
          <q-timeline-entry
            v-for="(session, sIndex) in plan.sessions"
            :key="sIndex"
            :title="`Week ${session.week}`"
            :subtitle="session.title"
            color="secondary"
            icon="event_note"
          >
            <q-card flat bordered class="bg-grey-2 q-pa-sm q-mt-sm shadow-1 rounded-borders">
              <q-expansion-item
                dense
                expand-separator
                default-opened
                icon="content_paste"
                label="Session Details"
                header-class="text-weight-medium text-primary"
              >
                <q-card flat bordered class="bg-white q-pa-sm">
                  <q-list separator dense>
                    <q-expansion-item
                      v-for="(step, stIndex) in session.steps"
                      :key="stIndex"
                      dense
                      expand-icon="expand_more"
                      switch-toggle-side
                      header-class="text-dark text-weight-medium"
                    >
                      <template #header>
                        <div>Step {{ step.step_number }}: {{ step.title }}</div>
                      </template>

                      <q-card flat bordered class="q-pa-sm bg-grey-1 q-my-xs rounded-borders">
                        <div class="text-caption q-mb-xs">
                          <strong>Details:</strong> {{ step.details }}
                        </div>
                        <div class="text-caption q-mb-xs">
                          <strong>Duration:</strong> {{ step.duration }}
                        </div>

                        <div class="q-my-xs">
                          <div class="text-caption text-weight-medium text-secondary q-mb-xs">
                            Devices & Equipments:
                          </div>
                          <div>
                            <q-chip
                              v-for="device in step.devices_equipments"
                              :key="device"
                              color="blue-3"
                              text-color="black"
                              size="sm"
                              icon="devices"
                              class="q-mr-xs q-mb-xs"
                            >
                              {{ device }}
                            </q-chip>
                          </div>

                          <div
                            class="text-caption text-weight-medium text-secondary q-mt-sm q-mb-xs"
                          >
                            Products Used:
                          </div>
                          <div>
                            <q-chip
                              v-for="product in step.products_equipments"
                              :key="product"
                              color="green-3"
                              text-color="black"
                              size="sm"
                              icon="spa"
                              class="q-mr-xs q-mb-xs"
                            >
                              {{ product }}
                            </q-chip>
                          </div>
                        </div>

                        <div class="text-caption q-mt-xs">
                          <strong>Finish:</strong>
                          <span>{{ step.finish.join(', ') }}</span>
                        </div>

                        <div class="text-caption q-mt-xs">
                          <strong>How to Do:</strong> {{ step.how_to_do }}
                        </div>
                      </q-card>
                    </q-expansion-item>
                  </q-list>
                </q-card>
              </q-expansion-item>
            </q-card>
          </q-timeline-entry>
        </q-timeline>
      </div>

      <!-- Display AI response; format as needed -->
      <div class="flex justify-start q-mt-lg">
        <q-btn label="Previous" rounded no-caps class="btn-custom" @click="emitPrevious" />
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

const treatmentPlan = [
  {
    plan_name: 'HydraGlow for Oily, Pore-prone Skin',
    total_time: '4 weeks',
    sessions: [
      {
        session_number: 1,
        week: 1,
        title: 'HydraFacial Core + Lymphatic Drainage + LED',
        steps: [
          {
            step_number: 1,
            title: 'Cleansing & Gentle Exfoliation',
            details:
              'Cleansing followed by gentle exfoliation using the Hydrafacial system to remove dead skin cells and prep pores.',
            duration: '15 min',
            devices_equipments: ['Hydrafacial'],
            products_equipments: [
              'Hydrafacial Serums AS1, SA2, A03',
              'Hyaluronic Acid infusion',
              'Vitamin C infusion',
            ],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do:
              'Attach Hydrafacial wand, perform cleanse with light exfoliation, avoid aggressive friction.',
          },
          {
            step_number: 2,
            title: 'Extraction + Infusion',
            details:
              'Gentle extractions with suction and infusion of hydrating serums to minimize pore visibility.',
            duration: '15 min',
            devices_equipments: ['Hydrafacial'],
            products_equipments: ['Hyaluronic Acid infusion', 'Vitamin C infusion'],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do:
              'Proceed with extractions in nasal/cheek areas, follow with serum infusions.',
          },
          {
            step_number: 3,
            title: 'Lymphatic Drainage Massage',
            details: 'Manual lymphatic drainage to reduce facial puffiness and improve drainage.',
            duration: '8-10 min',
            devices_equipments: ['Manual lymphatic drainage'],
            products_equipments: [],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do:
              'Light, upward strokes along jawline, cheekbones, and forehead; avoid excessive pressure.',
          },
          {
            step_number: 4,
            title: 'LED Therapy (Blue + Red)',
            details: 'Blue LED targets bacteria; Red LED supports collagen and healing.',
            duration: '10 min',
            devices_equipments: ['LED Blue', 'LED Red'],
            products_equipments: [],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: 'Sequentially apply Blue (5 min) then Red (5 min) over the entire face.',
          },
          {
            step_number: 5,
            title: 'Closing & Home Care',
            details: 'Summarize regimen and set expectations; provide at-home plan.',
            duration: '2 min',
            devices_equipments: [],
            products_equipments: [],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: 'Review at-home routine and skincare products.',
          },
        ],
      },
      {
        session_number: 2,
        week: 2,
        title: 'HydraFacial Core Refresh + LED',
        steps: [
          {
            step_number: 1,
            title: 'Cleansing & Exfoliation',
            details: 'Re-cleanse and re-exfoliate to refresh skin surface.',
            duration: '15 min',
            devices_equipments: ['Hydrafacial'],
            products_equipments: ['Hydrafacial Serums AS1, SA2, A03', 'Hyaluronic Acid infusion'],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: 'Gentle, consistent movements; avoid over-scrubbing.',
          },
          {
            step_number: 2,
            title: 'Infusion & Gentle Extraction',
            details: 'Infuse hydrating serums post-cleanse; perform light extraction if needed.',
            duration: '15 min',
            devices_equipments: ['Hydrafacial'],
            products_equipments: ['Hyaluronic Acid infusion'],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: 'Limit mechanical irritation; prioritize hydration.',
          },
          {
            step_number: 3,
            title: 'Lymphatic Drainage Massage',
            details: 'Light facial massage to promote circulation.',
            duration: '8-10 min',
            devices_equipments: ['Manual lymphatic drainage'],
            products_equipments: [],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: 'Gentle, clockwise directions from chin upward.',
          },
          {
            step_number: 4,
            title: 'LED Therapy (Blue + Red)',
            details: 'Blue + Red LED session.',
            duration: '10 min',
            devices_equipments: ['LED Blue', 'LED Red'],
            products_equipments: [],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: '5 minutes blue, 5 minutes red; cover entire face.',
          },
          {
            step_number: 5,
            title: 'Closing & Home Care',
            details: 'Reiterate care plan and home regimen.',
            duration: '2 min',
            devices_equipments: [],
            products_equipments: [],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: 'Provide written at-home instructions.',
          },
        ],
      },
      {
        session_number: 3,
        week: 3,
        title: 'HydraFacial Core + Maintenance',
        steps: [
          {
            step_number: 1,
            title: 'Cleansing & Exfoliation',
            details: 'Standard cleanse and exfoliation.',
            duration: '15 min',
            devices_equipments: ['Hydrafacial'],
            products_equipments: ['Hydrafacial Serums AS1, SA2, A03', 'Hyaluronic Acid infusion'],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: 'Maintain gentle technique.',
          },
          {
            step_number: 2,
            title: 'Infusion + Brief Extraction',
            details: 'Hydration infusion; minimal extraction if needed.',
            duration: '15 min',
            devices_equipments: ['Hydrafacial'],
            products_equipments: ['Hyaluronic Acid infusion'],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: 'Focus on hydration.',
          },
          {
            step_number: 3,
            title: 'Lymphatic Drainage Massage',
            details: 'Light drainage to maintain tone.',
            duration: '8-10 min',
            devices_equipments: ['Manual lymphatic drainage'],
            products_equipments: [],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: 'Gentle strokes along lymphatic pathways.',
          },
          {
            step_number: 4,
            title: 'LED Therapy (Blue + Red)',
            details: 'Continued antimicrobial and collagen-stimulating benefits.',
            duration: '10 min',
            devices_equipments: ['LED Blue', 'LED Red'],
            products_equipments: [],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: 'Sequential blue then red light.',
          },
          {
            step_number: 5,
            title: 'Closing & Home Care',
            details: 'Home-care guidance.',
            duration: '2 min',
            devices_equipments: [],
            products_equipments: [],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: 'Provide at-home regimen.',
          },
        ],
      },
      {
        session_number: 4,
        week: 4,
        title: 'Final HydraFacial Session + Maintenance',
        steps: [
          {
            step_number: 1,
            title: 'Cleansing & Exfoliation',
            details: 'Final cleansing and exfoliation to prepare skin.',
            duration: '15 min',
            devices_equipments: ['Hydrafacial'],
            products_equipments: ['Hydrafacial Serums AS1, SA2, A03', 'Hyaluronic Acid infusion'],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: 'Consistent technique; avoid aggressive rubbing.',
          },
          {
            step_number: 2,
            title: 'Infusion + Extraction',
            details: 'Hydration infusion with optional light extraction.',
            duration: '15 min',
            devices_equipments: ['Hydrafacial'],
            products_equipments: ['Hyaluronic Acid infusion', 'Vitamin C infusion'],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: 'Prioritize hydration and mild extraction only if needed.',
          },
          {
            step_number: 3,
            title: 'Lymphatic Drainage Massage',
            details: 'Final lymph drainage to reduce edema and improve tone.',
            duration: '8-10 min',
            devices_equipments: ['Manual lymphatic drainage'],
            products_equipments: [],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: 'Light, rhythmic strokes toward lymph nodes.',
          },
          {
            step_number: 4,
            title: 'LED Therapy (Blue + Red)',
            details: 'Optional maintenance LED session.',
            duration: '10 min',
            devices_equipments: ['LED Blue', 'LED Red'],
            products_equipments: [],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: 'Blue first 5 min, then Red 5 min.',
          },
          {
            step_number: 5,
            title: 'Closing & Home Care',
            details: 'Final home regimen guidance.',
            duration: '2 min',
            devices_equipments: [],
            products_equipments: [],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: 'Provide written plan and product list.',
          },
        ],
      },
    ],
  },
  {
    plan_name: 'Hybrid Hydrafacial + Dermapen Micro-Needling (Gentle)',
    total_time: '6 weeks',
    sessions: [
      {
        session_number: 1,
        week: 1,
        title: 'HydraFacial Prep + Lymphatic Drainage + LED',
        steps: [
          {
            step_number: 1,
            title: 'Cleansing & Exfoliation',
            details: 'HydraFacial cleansing with light exfoliation.',
            duration: '15 min',
            devices_equipments: ['Hydrafacial'],
            products_equipments: ['Hydrafacial Serums AS1, SA2, A03', 'Hyaluronic Acid infusion'],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: 'Gentle cleansing motions; avoid over-scrubbing.',
          },
          {
            step_number: 2,
            title: 'Extraction + Infusion',
            details: 'Targeted extractions with infusion of hydrating serums.',
            duration: '15 min',
            devices_equipments: ['Hydrafacial'],
            products_equipments: ['Hyaluronic Acid infusion'],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: 'Minimal mechanical irritation.',
          },
          {
            step_number: 3,
            title: 'Lymphatic Drainage Massage',
            details: 'Facial lymph drainage to improve contour.',
            duration: '8-10 min',
            devices_equipments: ['Manual lymphatic drainage'],
            products_equipments: [],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: 'Light, upward strokes toward ears and jawline.',
          },
          {
            step_number: 4,
            title: 'Dermapen Micro-Needling (0.25-0.5 mm) + Hyaluronic Infusion',
            details: 'Gentle micro-needling to boost hydration and refine pores.',
            duration: '12-15 min',
            devices_equipments: ['Dermapen / Dermaroller'],
            products_equipments: ['Hyaluronic Acid infusion'],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: 'Set depth to 0.25-0.5 mm; pass over cheeks and nose with even strokes.',
          },
          {
            step_number: 5,
            title: 'Closing & Home Care',
            details: 'End session with home care guidance.',
            duration: '2 min',
            devices_equipments: [],
            products_equipments: [],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: 'Provide aftercare instructions for post-microneedling care.',
          },
        ],
      },
      {
        session_number: 2,
        week: 2,
        title: 'Dermapen Session + Hydration Boost',
        steps: [
          {
            step_number: 1,
            title: 'Cleansing',
            details: 'Light cleanse to prep skin.',
            duration: '10 min',
            devices_equipments: ['Hydrafacial (optional)'],
            products_equipments: ['Hydrating serums'],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: 'Gentle cleansing only.',
          },
          {
            step_number: 2,
            title: 'Dermapen Micro-Needling',
            details: '0.25-0.5 mm depth across target zones.',
            duration: '12-15 min',
            devices_equipments: ['Dermapen / Dermaroller'],
            products_equipments: ['Hyaluronic Acid infusion'],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: 'Even passes; avoid excessive overlap.',
          },
          {
            step_number: 3,
            title: 'Infusion & LED',
            details: 'Infusion + optional LED for healing.',
            duration: '8-10 min',
            devices_equipments: ['LED (Red)'],
            products_equipments: ['Vitamin C infusion'],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: 'Apply Vitamin C infusion post-needling; LED optional.',
          },
          {
            step_number: 4,
            title: 'Closing & Home Care',
            details: 'Home regimen guidance.',
            duration: '2 min',
            devices_equipments: [],
            products_equipments: [],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: 'Provide written aftercare and product list.',
          },
        ],
      },
      {
        session_number: 3,
        week: 4,
        title: 'HydraFacial + Hydration Focus',
        steps: [
          {
            step_number: 1,
            title: 'Cleansing & Exfoliation',
            details: 'HydraFacial prep for hydration.',
            duration: '15 min',
            devices_equipments: ['Hydrafacial'],
            products_equipments: ['Hydrafacial Serums AS1, SA2, A03', 'Hyaluronic Acid infusion'],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: 'Gentle, controlled movements.',
          },
          {
            step_number: 2,
            title: 'Infusion + Light Extraction',
            details: 'Infusion with focus on hydration; mild extraction if needed.',
            duration: '15 min',
            devices_equipments: ['Hydrafacial'],
            products_equipments: ['Hyaluronic Acid infusion', 'Vitamin C infusion'],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: 'Hydration-first approach.',
          },
          {
            step_number: 3,
            title: 'Lymphatic Drainage Massage',
            details: 'Healthier circulation and contour.',
            duration: '8-10 min',
            devices_equipments: ['Manual lymphatic drainage'],
            products_equipments: [],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: 'Light strokes toward lymph nodes.',
          },
          {
            step_number: 4,
            title: 'Closing & Home Care',
            details: 'Home regimen guidance.',
            duration: '2 min',
            devices_equipments: [],
            products_equipments: [],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: 'Provide written plan.',
          },
        ],
      },
      {
        session_number: 4,
        week: 6,
        title: 'Final Dermapen Session + Maintenance',
        steps: [
          {
            step_number: 1,
            title: 'Cleansing',
            details: 'Gentle cleanse prior to needling.',
            duration: '10 min',
            devices_equipments: ['Dermapen / Dermaroller'],
            products_equipments: [],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: 'Skin must be clean and dry.',
          },
          {
            step_number: 2,
            title: 'Dermapen Micro-Needling',
            details: '0.25-0.5 mm depth across larger zones.',
            duration: '12-15 min',
            devices_equipments: ['Dermapen / Dermaroller'],
            products_equipments: ['Hyaluronic Acid infusion'],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: 'Even passes; avoid sensitive zones.',
          },
          {
            step_number: 3,
            title: 'Infusion + Vitamin C',
            details: 'Post-needling infusion with Vitamin C.',
            duration: '8-10 min',
            devices_equipments: [],
            products_equipments: ['Vitamin C infusion'],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: 'Apply vitamin C promptly to support healing.',
          },
          {
            step_number: 4,
            title: 'Closing & Home Care',
            details: 'Final at-home regimen instructions.',
            duration: '2 min',
            devices_equipments: [],
            products_equipments: [],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: 'Provide written plan and product list.',
          },
        ],
      },
    ],
  },
  {
    plan_name: 'RF-Boost Hydrafacial Plan',
    total_time: '6 weeks',
    sessions: [
      {
        session_number: 1,
        week: 1,
        title: 'HydraFacial + RF Lifting',
        steps: [
          {
            step_number: 1,
            title: 'Cleansing & Exfoliation',
            details: 'HydraFacial cleanse with gentle exfoliation.',
            duration: '15 min',
            devices_equipments: ['Hydrafacial', 'Radiofrequency (RF) Lifting Probe'],
            products_equipments: ['Hydrafacial Serums AS1, SA2, A03', 'Hyaluronic Acid infusion'],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do:
              'Hydrafacial settings for gentle exfoliation; RF probe applied post-exfoliation around jawline and cheeks.',
          },
          {
            step_number: 2,
            title: 'Extraction + Infusion',
            details: 'Controlled extractions with infusion of hydrating serums.',
            duration: '15 min',
            devices_equipments: ['Hydrafacial'],
            products_equipments: ['Hyaluronic Acid infusion'],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: 'Limited extractions to minimize irritation.',
          },
          {
            step_number: 3,
            title: 'RF Tightening',
            details: 'Non-invasive RF tightening to improve pore appearance and skin texture.',
            duration: '10 min',
            devices_equipments: ['Radiofrequency (RF) Lifting Probe'],
            products_equipments: [],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: 'Even passes over T-zone and cheeks; avoid prolonged contact with eyelids.',
          },
          {
            step_number: 4,
            title: 'LED Therapy',
            details: 'Red/Blue LED to support healing and antioxidant effects.',
            duration: '10 min',
            devices_equipments: ['LED Red', 'LED Blue'],
            products_equipments: [],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: 'Alternate red and blue lights for each 5 minutes.',
          },
          {
            step_number: 5,
            title: 'Closing & Home Care',
            details: 'Home regimen guidance.',
            duration: '2 min',
            devices_equipments: [],
            products_equipments: [],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: 'Provide written post-procedure care.',
          },
        ],
      },
      {
        session_number: 2,
        week: 3,
        title: 'RF + Hydration Maintenance',
        steps: [
          {
            step_number: 1,
            title: 'Cleansing & Infusion',
            details: 'Cleanse and infuse with hydrating serums.',
            duration: '15 min',
            devices_equipments: ['Hydrafacial', 'RF Lifting Probe'],
            products_equipments: ['Hylauronic Acid infusion', 'Vitamin C infusion'],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: 'Apply infusion post-cleansing; RF applied cautiously.',
          },
          {
            step_number: 2,
            title: 'RF Tightening',
            details: 'Non-invasive tightening session.',
            duration: '10 min',
            devices_equipments: ['RF Lifting Probe'],
            products_equipments: [],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: 'Even coverage; avoid eyelid area.',
          },
          {
            step_number: 3,
            title: 'LED Therapy',
            details: 'Supportive healing.',
            duration: '10 min',
            devices_equipments: ['LED Red', 'LED Blue'],
            products_equipments: [],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: '5 min red, 5 min blue.',
          },
          {
            step_number: 4,
            title: 'Closing & Home Care',
            details: 'Home regimen guidance.',
            duration: '2 min',
            devices_equipments: [],
            products_equipments: [],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: 'Provide written at-home plan.',
          },
        ],
      },
      {
        session_number: 3,
        week: 5,
        title: 'RF + LED Maintenance',
        steps: [
          {
            step_number: 1,
            title: 'Cleansing & Infusion',
            details: 'Hydrating infusion to support recovery.',
            duration: '15 min',
            devices_equipments: ['Hydrafacial', 'RF Lifting Probe'],
            products_equipments: ['Hyaluronic Acid infusion'],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: 'Gentle technique; ensure skin is dry.',
          },
          {
            step_number: 2,
            title: 'RF Tightening',
            details: 'Targeted tightening on jawline and cheeks.',
            duration: '10 min',
            devices_equipments: ['RF Lifting Probe'],
            products_equipments: [],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: 'Even passes; avoid over-treatment.',
          },
          {
            step_number: 3,
            title: 'LED Therapy',
            details: 'Supportive healing with red/blue LED.',
            duration: '10 min',
            devices_equipments: ['LED Red', 'LED Blue'],
            products_equipments: [],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: '5 minutes each light mode.',
          },
          {
            step_number: 4,
            title: 'Closing & Home Care',
            details: 'Home regimen guidance.',
            duration: '2 min',
            devices_equipments: [],
            products_equipments: [],
            finish: ['Serum', 'Moisturizer', 'Sunscreen'],
            how_to_do: 'Provide written plan.',
          },
        ],
      },
    ],
  },
]

const emit = defineEmits(['previous'])

const emitPrevious = () => {
  emit('previous')
}
</script>
