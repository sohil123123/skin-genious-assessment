<template>
  <!-- SESSION / PROFILE -->
  <q-card flat bordered class="q-pa-md q-mb-md">
    <q-card-section class="q-pa-none q-mb-md">
      <h3 class="text-subtitle1 text-weight-bold q-mb-sm">Patient Information</h3>
    </q-card-section>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-6">
        <q-input
          v-model.number="formData.meta.profile.name"
          label="Patient Name"
          outlined
          dense
          :rules="[(val) => (val !== null && val !== '') || 'Name required']"
        >
        </q-input>
      </div>
      <div class="col-12 col-md-6">
        <q-input
          v-model.number="formData.meta.profile.age"
          type="number"
          label="Age"
          outlined
          dense
          :rules="[
            (val) => (val !== null && val !== '') || 'Age required',
            (val) => (val >= 0 && val <= 130) || 'Age must be 0-130',
          ]"
        >
        </q-input>
      </div>
      <div class="col-12 col-md-6">
        <q-chip
          v-for="item in sexOptions"
          :key="item"
          :label="item"
          :text-color="item == formData.meta.profile.sex ? 'white' : 'black'"
          :color="item == formData.meta.profile.sex ? 'primary' : 'black'"
          :outline="item != formData.meta.profile.sex"
          clickable
          @click="formData.meta.profile.sex = item"
        />
      </div>
    </div>
  </q-card>

  <!-- SECTION 1 -->
  <q-card flat bordered class="q-pa-md q-mb-md">
    <q-card-section class="q-pa-none q-mb-md">
      <h2 class="text-h6 text-primary q-my-sm">SECTION 1: Client Questionnaire Inputs</h2>
    </q-card-section>

    <!-- A. Goals & Intent -->
    <q-card-section class="q-pa-none q-mb-md">
      <h3 class="text-subtitle1 text-weight-bold q-mb-sm">A. Goals & Intent</h3>
    </q-card-section>

    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-6">
        <q-select
          v-model="formData.section_1_client_questionnaire.A_goals_intent.primary_goal"
          :options="goalOptions"
          label="Primary goal (select one)"
          outlined
          dense
          emit-value
          map-options
          :rules="[(val) => !!val || 'Primary goal is required']"
        />
      </div>
      <div class="col-12 col-md-6">
        <q-select
          v-model="formData.section_1_client_questionnaire.A_goals_intent.secondary_goal"
          :options="[{ label: 'None', value: '' }, ...goalOptions]"
          label="Secondary goal (optional)"
          outlined
          dense
          emit-value
          map-options
        />
      </div>
    </div>

    <div class="row items-center q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-6">
        <p class="text-weight-medium">
          Desired intensity preference: <q-badge :color="nadPillColor" :label="nadPillText" />
        </p>
        <q-chip
          v-for="(item, index) in intensityOptions"
          :key="index"
          :label="item"
          :text-color="
            item ==
            formData.section_1_client_questionnaire.A_goals_intent.desired_intensity_preference
              ? 'white'
              : 'black'
          "
          :color="
            item ==
            formData.section_1_client_questionnaire.A_goals_intent.desired_intensity_preference
              ? 'primary'
              : 'black'
          "
          :outline="
            item !=
            formData.section_1_client_questionnaire.A_goals_intent.desired_intensity_preference
          "
          clickable
          @click="
            formData.section_1_client_questionnaire.A_goals_intent.desired_intensity_preference =
              item
          "
        />
      </div>
    </div>

    <q-separator class="q-my-md" />

    <!-- B. Safety & Contraindications -->
    <q-card-section class="q-pa-none q-mb-md">
      <h3 class="text-subtitle1 text-weight-bold q-mb-sm">
        B. Safety & Contraindications (Mandatory)
      </h3>
    </q-card-section>

    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-6">
        <q-select
          v-model="
            formData.section_1_client_questionnaire.B_safety_contraindications
              .pregnant_or_breastfeeding
          "
          :options="yesNoOptions"
          label="Pregnant or breastfeeding"
          outlined
          dense
          emit-value
          map-options
          :rules="[(val) => !!val || 'Required']"
        />
      </div>
      <div class="col-12 col-md-6">
        <q-select
          v-model="
            formData.section_1_client_questionnaire.B_safety_contraindications.known_kidney_disease
          "
          :options="yesNoUnsureOptions"
          label="Known kidney disease"
          outlined
          dense
          emit-value
          map-options
          :rules="[(val) => !!val || 'Required']"
          @update:model-value="handleKidneyDiseaseChange"
        />
      </div>
    </div>

    <div v-if="showKidneySeverity" class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-6">
        <q-select
          v-model="
            formData.section_1_client_questionnaire.B_safety_contraindications
              .kidney_disease_severity_if_yes
          "
          :options="kidneySeverityOptions"
          label="If yes: severity"
          outlined
          dense
          emit-value
          map-options
          :rules="[(val) => val || 'Kidney severity is required when kidney disease = Yes']"
        />
      </div>
      <div class="col-12 col-md-6"></div>
    </div>

    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-6">
        <q-select
          v-model="
            formData.section_1_client_questionnaire.B_safety_contraindications
              .known_heart_disease_or_heart_failure
          "
          :options="yesNoUnsureOptions"
          label="Known heart disease or heart failure"
          outlined
          dense
          emit-value
          map-options
          :rules="[(val) => !!val || 'Required']"
        />
      </div>
      <div class="col-12 col-md-6">
        <q-select
          v-model="
            formData.section_1_client_questionnaire.B_safety_contraindications
              .history_uncontrolled_hypertension
          "
          :options="yesNoUnsureOptions"
          label="History of uncontrolled hypertension"
          outlined
          dense
          emit-value
          map-options
          :rules="[(val) => !!val || 'Required']"
        />
      </div>
    </div>

    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-6">
        <q-select
          v-model="formData.section_1_client_questionnaire.B_safety_contraindications.diabetes"
          :options="yesNoOptions"
          label="Diabetes"
          outlined
          dense
          emit-value
          map-options
          :rules="[(val) => !!val || 'Required']"
        />
      </div>
      <div class="col-12 col-md-6">
        <q-select
          v-model="
            formData.section_1_client_questionnaire.B_safety_contraindications.known_g6pd_deficiency
          "
          :options="yesNoUnsureOptions"
          label="Known G6PD deficiency"
          outlined
          dense
          emit-value
          map-options
          :rules="[(val) => !!val || 'Required']"
        />
      </div>
    </div>

    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-6">
        <q-select
          v-model="
            formData.section_1_client_questionnaire.B_safety_contraindications
              .history_seizures_epilepsy
          "
          :options="yesNoUnsureOptions"
          label="History of seizures / epilepsy (NEW)"
          outlined
          dense
          emit-value
          map-options
          :rules="[(val) => !!val || 'Required']"
        />
      </div>
      <div class="col-12 col-md-6">
        <q-select
          v-model="
            formData.section_1_client_questionnaire.B_safety_contraindications
              .current_fever_or_infection_symptoms_today
          "
          :options="yesNoOptions"
          label="Current fever or infection symptoms today"
          outlined
          dense
          emit-value
          map-options
          :rules="[(val) => !!val || 'Required']"
        />
      </div>
    </div>

    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-6">
        <q-select
          v-model="
            formData.section_1_client_questionnaire.B_safety_contraindications
              .known_allergy_to_iv_vitamins_minerals
          "
          :options="ivAllergyOptions"
          label="Known allergy to IV vitamins/minerals"
          outlined
          dense
          emit-value
          map-options
          :rules="[(val) => !!val || 'Required']"
          @update:model-value="handleIvAllergyChange"
        />
      </div>
      <div v-if="showIvAllergySpecify" class="col-12 col-md-6">
        <q-input
          v-model="
            formData.section_1_client_questionnaire.B_safety_contraindications
              .iv_allergy_specify_if_yes
          "
          label="If yes: specify"
          outlined
          dense
          placeholder="Specify allergy to IV vitamins/minerals"
          :rules="[(val) => val || 'Specify allergy is required when allergy = Yes']"
        />
      </div>
    </div>

    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-6">
        <q-select
          v-model="
            formData.section_1_client_questionnaire.B_safety_contraindications
              .previous_adverse_reaction_to_iv_therapy
          "
          :options="ivAllergyOptions"
          label="Previous adverse reaction to IV therapy"
          outlined
          dense
          emit-value
          map-options
          :rules="[(val) => !!val || 'Required']"
          @update:model-value="handleIvReactionChange"
        />
      </div>
      <div v-if="showIvReactionSpecify" class="col-12 col-md-6">
        <q-input
          v-model="
            formData.section_1_client_questionnaire.B_safety_contraindications
              .iv_reaction_specify_if_yes
          "
          label="If yes: specify"
          outlined
          dense
          placeholder="Specify previous adverse reaction"
          :rules="[(val) => val || 'Specify reaction is required when reaction = Yes']"
        />
      </div>
    </div>

    <q-separator class="q-my-md" />

    <!-- C. Recent Exposures -->
    <q-card-section class="q-pa-none q-mb-md">
      <h3 class="text-subtitle1 text-weight-bold q-mb-sm">
        C. Recent Exposures (Last 24–72 Hours)
      </h3>
    </q-card-section>

    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-6">
        <q-select
          v-model="
            formData.section_1_client_questionnaire.C_recent_exposures_24_72h
              .alcohol_intake_last_24h
          "
          :options="alcoholOptions"
          label="Alcohol intake in last 24 hours"
          outlined
          dense
          emit-value
          map-options
          :rules="[(val) => !!val || 'Required']"
        />
      </div>
      <div class="col-12 col-md-6">
        <q-select
          v-model="
            formData.section_1_client_questionnaire.C_recent_exposures_24_72h.exercise_last_24h
          "
          :options="exerciseOptions"
          label="Exercise in last 24 hours"
          outlined
          dense
          emit-value
          map-options
          :rules="[(val) => !!val || 'Required']"
        />
      </div>
    </div>

    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-6">
        <q-input
          v-model.number="
            formData.section_1_client_questionnaire.C_recent_exposures_24_72h
              .sleep_duration_last_night_hours
          "
          type="number"
          step="0.1"
          label="Sleep duration last night (hours)"
          outlined
          dense
          placeholder="e.g., 6.5"
          :rules="[
            (val) => (val !== null && val !== '') || 'Required',
            (val) => (val >= 0 && val <= 24) || 'Must be 0-24 hours',
          ]"
        />
      </div>
      <div class="col-12 col-md-6">
        <q-select
          v-model="
            formData.section_1_client_questionnaire.C_recent_exposures_24_72h.perceived_stress_level
          "
          :options="stressLevelOptions"
          label="Current perceived stress level"
          outlined
          dense
          emit-value
          map-options
          :rules="[(val) => !!val || 'Required']"
        />
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-6">
        <q-select
          v-model="
            formData.section_1_client_questionnaire.C_recent_exposures_24_72h.caffeine_intake_today
          "
          :options="caffeineOptions"
          label="Caffeine intake today"
          outlined
          dense
          emit-value
          map-options
          :rules="[(val) => !!val || 'Required']"
        />
      </div>
      <div class="col-12 col-md-6"></div>
    </div>

    <q-separator class="q-my-md" />

    <!-- D. Symptoms Today -->
    <q-card-section class="q-pa-none q-mb-md">
      <h3 class="text-subtitle1 text-weight-bold q-mb-sm">D. Symptoms Today</h3>
    </q-card-section>

    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-6">
        <q-select
          v-model="formData.section_1_client_questionnaire.D_symptoms_today.fatigue"
          :options="symptomSeverityOptions"
          label="Fatigue"
          outlined
          dense
          emit-value
          map-options
          :rules="[(val) => !!val || 'Required']"
        />
      </div>
      <div class="col-12 col-md-6">
        <q-select
          v-model="formData.section_1_client_questionnaire.D_symptoms_today.headache"
          :options="symptomSeverityOptions"
          label="Headache"
          outlined
          dense
          emit-value
          map-options
          :rules="[(val) => !!val || 'Required']"
        />
      </div>
    </div>

    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-6">
        <q-select
          v-model="formData.section_1_client_questionnaire.D_symptoms_today.nausea"
          :options="yesNoOptions"
          label="Nausea"
          outlined
          dense
          emit-value
          map-options
          :rules="[(val) => !!val || 'Required']"
        />
      </div>
      <div class="col-12 col-md-6">
        <q-select
          v-model="formData.section_1_client_questionnaire.D_symptoms_today.dizziness_on_standing"
          :options="yesNoOptions"
          label="Dizziness on standing"
          outlined
          dense
          emit-value
          map-options
          :rules="[(val) => !!val || 'Required']"
        />
      </div>
    </div>

    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-6">
        <q-select
          v-model="formData.section_1_client_questionnaire.D_symptoms_today.muscle_cramps"
          :options="yesNoOptions"
          label="Muscle cramps"
          outlined
          dense
          emit-value
          map-options
          :rules="[(val) => !!val || 'Required']"
        />
      </div>
      <div class="col-12 col-md-6">
        <q-select
          v-model="formData.section_1_client_questionnaire.D_symptoms_today.palpitations"
          :options="yesNoOptions"
          label="Palpitations"
          outlined
          dense
          emit-value
          map-options
          :rules="[(val) => !!val || 'Required']"
        />
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-6">
        <q-select
          v-model="
            formData.section_1_client_questionnaire.D_symptoms_today.swelling_or_puffiness_today
          "
          :options="yesNoOptions"
          label="Swelling or puffiness today"
          outlined
          dense
          emit-value
          map-options
          :rules="[(val) => !!val || 'Required']"
        />
      </div>
      <div class="col-12 col-md-6">
        <q-select
          v-model="
            formData.section_1_client_questionnaire.D_symptoms_today
              .constipation_or_sluggish_digestion_today
          "
          :options="yesNoOptions"
          label="Constipation or sluggish digestion today (NEW)"
          outlined
          dense
          emit-value
          map-options
          :rules="[(val) => !!val || 'Required']"
        />
      </div>
    </div>

    <q-separator class="q-my-md" />

    <!-- E. Medications & Supplements -->
    <q-card-section class="q-pa-none q-mb-md">
      <h3 class="text-subtitle1 text-weight-bold q-mb-sm">E. Medications & Supplements</h3>
    </q-card-section>

    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-6">
        <q-select
          v-model="
            formData.section_1_client_questionnaire.E_medications_supplements
              .blood_pressure_medications
          "
          :options="yesNoOptions"
          label="Blood pressure medications"
          outlined
          dense
          emit-value
          map-options
          :rules="[(val) => !!val || 'Required']"
        />
      </div>
      <div class="col-12 col-md-6">
        <q-select
          v-model="formData.section_1_client_questionnaire.E_medications_supplements.blood_thinners"
          :options="yesNoOptions"
          label="Blood thinners"
          outlined
          dense
          emit-value
          map-options
          :rules="[(val) => !!val || 'Required']"
        />
      </div>
    </div>

    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-6">
        <q-select
          v-model="
            formData.section_1_client_questionnaire.E_medications_supplements.thyroid_medications
          "
          :options="yesNoOptions"
          label="Thyroid medications"
          outlined
          dense
          emit-value
          map-options
          :rules="[(val) => !!val || 'Required']"
        />
      </div>
      <div class="col-12 col-md-6">
        <q-select
          v-model="
            formData.section_1_client_questionnaire.E_medications_supplements.diabetes_medications
          "
          :options="yesNoOptions"
          label="Diabetes medications"
          outlined
          dense
          emit-value
          map-options
          :rules="[(val) => !!val || 'Required']"
        />
      </div>
    </div>

    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-6">
        <q-select
          v-model="
            formData.section_1_client_questionnaire.E_medications_supplements
              .anti_epileptic_medications
          "
          :options="yesNoOptions"
          label="Anti-epileptic medications (NEW)"
          outlined
          dense
          emit-value
          map-options
          :rules="[(val) => !!val || 'Required']"
        />
      </div>
      <div class="col-12 col-md-6">
        <q-select
          v-model="
            formData.section_1_client_questionnaire.E_medications_supplements.current_supplements
              .selection
          "
          :options="supplementOptions"
          label="Current supplements"
          outlined
          dense
          emit-value
          map-options
          :rules="[(val) => !!val || 'Required']"
          @update:model-value="handleSupplementsChange"
        >
          <template #hint>
            If multiple supplements are needed, enter them comma-separated below.
          </template>
        </q-select>
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-6">
        <q-input
          v-model="
            formData.section_1_client_questionnaire.E_medications_supplements.current_supplements
              .list_optional
          "
          label="Supplement list (comma-separated) (optional)"
          outlined
          dense
          placeholder="e.g., Magnesium, Vitamin C"
        >
          <template #hint> Optional free list even if dropdown is used. </template>
        </q-input>
      </div>
      <div v-if="showSupplementsOther" class="col-12 col-md-6">
        <q-input
          v-model="
            formData.section_1_client_questionnaire.E_medications_supplements.current_supplements
              .others_specify_if_selected
          "
          label="If Others: specify"
          outlined
          dense
          placeholder="Specify other supplements"
          :rules="[(val) => val || 'Required when supplements = Others']"
        />
      </div>
    </div>

    <q-separator class="q-my-md" />

    <!-- F. NAD+ Specific -->
    <q-card-section class="q-pa-none q-mb-md">
      <h3 class="text-subtitle1 text-weight-bold q-mb-sm">F. NAD+ Specific (if applicable)</h3>
    </q-card-section>

    <q-card bordered class="q-pa-md q-mb-md">
      <div v-if="isNadApplicable">
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 col-md-6">
            <q-select
              v-model="
                formData.section_1_client_questionnaire.F_nad_specific_if_applicable
                  .previous_nad_experience
              "
              :options="yesNoOptions"
              label="Previous NAD+ experience"
              outlined
              dense
              emit-value
              map-options
              :rules="[(val) => !!val || 'Required when NAD+ is applicable']"
              @update:model-value="handleNadPrevChange"
            />
          </div>
          <div v-if="showNadTolerance" class="col-12 col-md-6">
            <q-select
              v-model="
                formData.section_1_client_questionnaire.F_nad_specific_if_applicable
                  .tolerance_if_yes
              "
              :options="toleranceOptions"
              label="If yes: tolerance"
              outlined
              dense
              emit-value
              map-options
              :rules="[(val) => val || 'Tolerance required when previous NAD+ experience = Yes']"
            />
          </div>
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-select
              v-model="
                formData.section_1_client_questionnaire.F_nad_specific_if_applicable
                  .preferred_nad_experience
              "
              :options="nadExperienceOptions"
              label="Preferred NAD+ experience"
              outlined
              dense
              emit-value
              map-options
              :rules="[(val) => !!val || 'Required when NAD+ is applicable']"
            />
          </div>
          <div class="col-12 col-md-6">
            <q-select
              v-model="
                formData.section_1_client_questionnaire.F_nad_specific_if_applicable
                  .primary_reason_for_nad_interest
              "
              :options="nadReasonOptions"
              label="Primary reason for NAD+ interest (NEW)"
              outlined
              dense
              emit-value
              map-options
              :rules="[(val) => !!val || 'Required when NAD+ is applicable']"
            />
          </div>
        </div>
      </div>
      <div v-else class="text-caption text-grey-7">
        NAD+ section becomes mandatory if Primary or Secondary goal is "NAD+ wellness".
      </div>
    </q-card>

    <q-separator class="q-my-md" />

    <!-- G. Acute Metabolic Status -->
    <q-card-section class="q-pa-none q-mb-md">
      <h3 class="text-subtitle1 text-weight-bold q-mb-sm">G. Acute Metabolic Status</h3>
    </q-card-section>

    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-6">
        <q-input
          v-model.number="
            formData.section_1_client_questionnaire.G_acute_metabolic_status
              .time_since_last_meal_hours
          "
          type="number"
          step="0.1"
          label="Time since last meal (hours)"
          outlined
          dense
          placeholder="e.g., 3"
          :rules="[
            (val) => (val !== null && val !== '') || 'Required',
            (val) => (val >= 0 && val <= 72) || 'Must be 0-72 hours',
          ]"
        />
      </div>
      <div class="col-12 col-md-6">
        <q-select
          v-model="
            formData.section_1_client_questionnaire.G_acute_metabolic_status.current_diet_type
          "
          :options="dietTypeOptions"
          label="Current diet type"
          outlined
          dense
          emit-value
          map-options
          :rules="[(val) => !!val || 'Required']"
        />
      </div>
    </div>

    <div v-if="showFemaleOnlyFields" class="row q-col-gutter-md">
      <div class="col-12 col-md-6">
        <q-input
          v-model="
            formData.section_1_client_questionnaire.G_acute_metabolic_status.females_only
              .first_day_of_last_menstrual_period_date
          "
          type="date"
          label="(Females only) First day of last menstrual period (Date)"
          outlined
          dense
          :rules="[
            (val) => {
              if (
                formData.meta.profile.sex === 'Female' &&
                formData.section_1_client_questionnaire.G_acute_metabolic_status.females_only
                  ?.menopausal !== 'Yes'
              ) {
                return !!val || 'Required for females unless Menopausal = Yes'
              }
              return true
            },
          ]"
        />
      </div>
      <div class="col-12 col-md-6">
        <q-select
          v-model="
            formData.section_1_client_questionnaire.G_acute_metabolic_status.females_only.menopausal
          "
          :options="yesNoOptions"
          label="OR Menopausal"
          outlined
          dense
          emit-value
          map-options
          :rules="[
            (val) => {
              if (formData.meta.profile.sex === 'Female') {
                return !!val || 'Required for females'
              }
              return true
            },
          ]"
        >
          <template #hint>
            For females: either LMP date OR Menopausal=Yes must be provided.
          </template>
        </q-select>
      </div>
    </div>
  </q-card>

  <!-- SECTION 2 -->
  <q-card flat bordered class="q-pa-md q-mb-md">
    <q-card-section class="q-pa-none q-mb-md">
      <h2 class="text-h6 text-primary q-mb-sm">SECTION 2: Machine-Derived Objective Inputs</h2>
    </q-card-section>

    <q-tabs
      v-model="activeDeviceTab"
      dense
      class="text-grey-7"
      active-color="primary"
      indicator-color="primary"
      align="justify"
      narrow-indicator
    >
      <q-tab name="bp" label="1) BP Monitor" />
      <q-tab name="pox" label="2) Pulse Oximeter" />
      <q-tab name="hrv" label="3) HRV Device" />
      <q-tab name="irt" label="4) Infrared Thermometer" />
      <q-tab name="bca" label="5) Body Composition" />
      <q-tab name="grip" label="6) Grip Dynamometer" />
      <q-tab name="sys" label="7) Optional Systemic" />
    </q-tabs>

    <q-separator />

    <q-tab-panels v-model="activeDeviceTab" animated>
      <!-- 1) BP Monitor -->
      <q-tab-panel name="bp">
        <h3 class="text-subtitle1 text-weight-bold q-mb-md">1. Blood Pressure Monitor</h3>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                formData.section_2_machine_objective_inputs.blood_pressure_monitor.systolic_mmhg
              "
              type="number"
              label="Systolic blood pressure (mmHg)"
              outlined
              dense
              :rules="[
                (val) => (val !== null && val !== '') || 'Required',
                (val) => (val >= 0 && val <= 300) || 'Must be 0-300',
              ]"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                formData.section_2_machine_objective_inputs.blood_pressure_monitor.diastolic_mmhg
              "
              type="number"
              label="Diastolic blood pressure (mmHg)"
              outlined
              dense
              :rules="[
                (val) => (val !== null && val !== '') || 'Required',
                (val) => (val >= 0 && val <= 200) || 'Must be 0-200',
              ]"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                formData.section_2_machine_objective_inputs.blood_pressure_monitor.pulse_bpm
              "
              type="number"
              label="Pulse rate (bpm)"
              outlined
              dense
              :rules="[
                (val) => (val !== null && val !== '') || 'Required',
                (val) => (val >= 0 && val <= 250) || 'Must be 0-250',
              ]"
            />
          </div>
        </div>
        <div class="text-caption text-grey-7 q-mt-sm">
          If you want clinically strict ranges, share your min/max table and I'll enforce it here.
        </div>
      </q-tab-panel>

      <!-- 2) Pulse Oximeter -->
      <q-tab-panel name="pox">
        <h3 class="text-subtitle1 text-weight-bold q-mb-md">
          2. Pulse Oximeter (with Perfusion Index)
        </h3>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                formData.section_2_machine_objective_inputs.pulse_oximeter_with_pi.spo2_percent
              "
              type="number"
              step="0.1"
              label="SpO₂ (%)"
              outlined
              dense
              :rules="[
                (val) => (val !== null && val !== '') || 'Required',
                (val) => (val >= 0 && val <= 100) || 'Must be 0-100',
              ]"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                formData.section_2_machine_objective_inputs.pulse_oximeter_with_pi.pulse_bpm
              "
              type="number"
              label="Pulse rate (bpm)"
              outlined
              dense
              :rules="[
                (val) => (val !== null && val !== '') || 'Required',
                (val) => (val >= 0 && val <= 250) || 'Must be 0-250',
              ]"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                formData.section_2_machine_objective_inputs.pulse_oximeter_with_pi.perfusion_index
              "
              type="number"
              step="0.01"
              label="Perfusion Index (PI)"
              outlined
              dense
              :rules="[
                (val) => (val !== null && val !== '') || 'Required',
                (val) => (val >= 0 && val <= 30) || 'Must be 0-30',
              ]"
            />
          </div>
        </div>
      </q-tab-panel>

      <!-- 3) HRV Device -->
      <q-tab-panel name="hrv">
        <h3 class="text-subtitle1 text-weight-bold q-mb-md">3. HRV Measurement Device</h3>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                formData.section_2_machine_objective_inputs.hrv_measurement_device.rmssd_or_tw_ms
              "
              type="number"
              step="0.1"
              label="RMSSD / TW (ms) (one field)"
              outlined
              dense
              :rules="[
                (val) => (val !== null && val !== '') || 'Required',
                (val) => (val >= 0 && val <= 500) || 'Must be 0-500 ms',
              ]"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                formData.section_2_machine_objective_inputs.hrv_measurement_device
                  .resting_heart_rate_bpm
              "
              type="number"
              label="Resting heart rate (bpm)"
              outlined
              dense
              :rules="[
                (val) => (val !== null && val !== '') || 'Required',
                (val) => (val >= 0 && val <= 250) || 'Must be 0-250',
              ]"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                formData.section_2_machine_objective_inputs.hrv_measurement_device
                  .measurement_duration_minutes
              "
              type="number"
              step="0.1"
              label="Measurement duration (minutes)"
              outlined
              dense
              :rules="[
                (val) => (val !== null && val !== '') || 'Required',
                (val) => (val >= 0.1 && val <= 60) || 'Must be 0.1-60 minutes',
              ]"
            />
          </div>
        </div>
      </q-tab-panel>

      <!-- 4) Infrared Thermometer -->
      <q-tab-panel name="irt">
        <h3 class="text-subtitle1 text-weight-bold q-mb-md">
          4. Infrared Skin Thermometer (3-point facial)
        </h3>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                formData.section_2_machine_objective_inputs.infrared_skin_thermometer_3_point
                  .forehead_c
              "
              type="number"
              step="0.1"
              label="Forehead temperature (°C)"
              outlined
              dense
              :rules="[
                (val) => (val !== null && val !== '') || 'Required',
                (val) => (val >= 20 && val <= 45) || 'Must be 20-45°C',
              ]"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                formData.section_2_machine_objective_inputs.infrared_skin_thermometer_3_point
                  .left_cheek_c
              "
              type="number"
              step="0.1"
              label="Left cheek temperature (°C)"
              outlined
              dense
              :rules="[
                (val) => (val !== null && val !== '') || 'Required',
                (val) => (val >= 20 && val <= 45) || 'Must be 20-45°C',
              ]"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                formData.section_2_machine_objective_inputs.infrared_skin_thermometer_3_point
                  .right_cheek_c
              "
              type="number"
              step="0.1"
              label="Right cheek temperature (°C)"
              outlined
              dense
              :rules="[
                (val) => (val !== null && val !== '') || 'Required',
                (val) => (val >= 20 && val <= 45) || 'Must be 20-45°C',
              ]"
            />
          </div>
        </div>
      </q-tab-panel>

      <!-- 5) Body Composition -->
      <q-tab-panel name="bca">
        <h3 class="text-subtitle1 text-weight-bold q-mb-md">
          5. Body Composition Analyzer (8-electrode)
        </h3>
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                formData.section_2_machine_objective_inputs.body_composition_analyzer_8_electrode
                  .body_weight_kg
              "
              type="number"
              step="0.1"
              label="Body weight (kg)"
              outlined
              dense
              :rules="[
                (val) => (val !== null && val !== '') || 'Required',
                (val) => (val >= 0 && val <= 500) || 'Must be 0-500',
              ]"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                formData.section_2_machine_objective_inputs.body_composition_analyzer_8_electrode
                  .height_cm
              "
              type="number"
              step="0.1"
              label="Height (cm)"
              outlined
              dense
              :rules="[
                (val) => (val !== null && val !== '') || 'Required',
                (val) => (val >= 0 && val <= 250) || 'Must be 0-250',
              ]"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                formData.section_2_machine_objective_inputs.body_composition_analyzer_8_electrode
                  .bmi
              "
              type="number"
              step="0.1"
              label="BMI"
              outlined
              dense
              :rules="[
                (val) => (val !== null && val !== '') || 'Required',
                (val) => (val >= 0 && val <= 100) || 'Must be 0-100',
              ]"
            >
              <template #hint>
                Listed as an input in spec. If you want auto-calc, tell me and I'll add it.
              </template>
            </q-input>
          </div>
        </div>

        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 col-md-4">
            <div class="row q-col-gutter-sm">
              <div class="col-8">
                <q-input
                  v-model.number="
                    formData.section_2_machine_objective_inputs
                      .body_composition_analyzer_8_electrode.total_body_water.value
                  "
                  type="number"
                  step="0.1"
                  label="Total body water"
                  outlined
                  dense
                  :rules="[(val) => (val !== null && val !== '') || 'Required']"
                />
              </div>
              <div class="col-4">
                <q-select
                  v-model="
                    formData.section_2_machine_objective_inputs
                      .body_composition_analyzer_8_electrode.total_body_water.unit
                  "
                  :options="tbwUnitOptions"
                  label="Unit"
                  outlined
                  dense
                  emit-value
                  map-options
                  :rules="[(val) => !!val || 'Unit required']"
                />
              </div>
            </div>
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                formData.section_2_machine_objective_inputs.body_composition_analyzer_8_electrode
                  .body_fat_percentage
              "
              type="number"
              step="0.1"
              label="Body fat percentage (%)"
              outlined
              dense
              :rules="[
                (val) => (val !== null && val !== '') || 'Required',
                (val) => (val >= 0 && val <= 100) || 'Must be 0-100',
              ]"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                formData.section_2_machine_objective_inputs.body_composition_analyzer_8_electrode
                  .lean_muscle_mass_kg
              "
              type="number"
              step="0.1"
              label="Lean / muscle mass (kg)"
              outlined
              dense
              :rules="[
                (val) => (val !== null && val !== '') || 'Required',
                (val) => (val >= 0 && val <= 300) || 'Must be 0-300',
              ]"
            />
          </div>
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                formData.section_2_machine_objective_inputs.body_composition_analyzer_8_electrode
                  .visceral_fat_kg
              "
              type="number"
              step="0.1"
              label="Visceral fat (Kg)"
              outlined
              dense
              :rules="[
                (val) => (val !== null && val !== '') || 'Required',
                (val) => (val >= 0 && val <= 100) || 'Must be 0-100',
              ]"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                formData.section_2_machine_objective_inputs.body_composition_analyzer_8_electrode
                  .basal_metabolic_rate_optional
              "
              type="number"
              step="1"
              label="Basal metabolic rate (optional)"
              outlined
              dense
              placeholder="Optional"
            />
          </div>
          <div class="col-12 col-md-4"></div>
        </div>
      </q-tab-panel>

      <!-- 6) Grip Dynamometer -->
      <q-tab-panel name="grip">
        <h3 class="text-subtitle1 text-weight-bold q-mb-md">6. Hand Grip Dynamometer</h3>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                formData.section_2_machine_objective_inputs.hand_grip_dynamometer
                  .dominant_hand_grip_strength_kg
              "
              type="number"
              step="0.1"
              label="Dominant hand grip strength (kg)"
              outlined
              dense
              :rules="[
                (val) => (val !== null && val !== '') || 'Required',
                (val) => (val >= 0 && val <= 200) || 'Must be 0-200',
              ]"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                formData.section_2_machine_objective_inputs.hand_grip_dynamometer
                  .non_dominant_hand_grip_strength_kg_optional
              "
              type="number"
              step="0.1"
              label="Non-dominant hand grip strength (kg) (optional)"
              outlined
              dense
              :rules="[
                (val) => val === null || val === '' || (val >= 0 && val <= 200) || 'Must be 0-200',
              ]"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model="
                formData.section_2_machine_objective_inputs.hand_grip_dynamometer
                  .age_sex_adjusted_percentile_engine_derived
              "
              label="Age- & sex-adjusted percentile (engine-derived)"
              readonly
              outlined
              dense
              placeholder="Calculated by engine"
            >
              <template #hint> Read-only output placeholder (computed after submission). </template>
            </q-input>
          </div>
        </div>
      </q-tab-panel>

      <!-- 7) Optional Systemic -->
      <q-tab-panel name="sys">
        <h3 class="text-subtitle1 text-weight-bold q-mb-md">7. Optional Systemic Measurements</h3>
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                formData.section_2_machine_objective_inputs.optional_systemic_measurements
                  .systemic_body_temperature_c_optional
              "
              type="number"
              step="0.1"
              label="Systemic body temperature (°C)"
              outlined
              dense
              :rules="[
                (val) =>
                  val === null || val === '' || (val >= 20 && val <= 45) || 'Must be 20-45°C',
              ]"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="
                formData.section_2_machine_objective_inputs.optional_systemic_measurements
                  .respiratory_rate_bpm_optional
              "
              type="number"
              label="Respiratory rate (breaths per minute)"
              outlined
              dense
              :rules="[
                (val) => val === null || val === '' || (val >= 0 && val <= 80) || 'Must be 0-80',
              ]"
            />
          </div>
          <div class="col-12 col-md-4"></div>
        </div>

        <q-separator class="q-my-md" />
        <h3 class="text-subtitle1 text-weight-bold q-mb-md">Orthostatic vitals (optional)</h3>

        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 col-md-6">
            <q-card flat bordered class="q-pa-sm">
              <h4 class="text-subtitle2 q-mb-sm">Seated (optional)</h4>
              <div class="row q-col-gutter-sm">
                <div class="col-4">
                  <q-input
                    v-model.number="
                      formData.section_2_machine_objective_inputs.optional_systemic_measurements
                        .orthostatic_vitals_optional.seated_optional.systolic_mmhg
                    "
                    type="number"
                    label="BP Sys"
                    outlined
                    dense
                    :rules="[
                      (val) => val === null || val === '' || (val >= 0 && val <= 300) || '0-300',
                    ]"
                  />
                </div>
                <div class="col-4">
                  <q-input
                    v-model.number="
                      formData.section_2_machine_objective_inputs.optional_systemic_measurements
                        .orthostatic_vitals_optional.seated_optional.diastolic_mmhg
                    "
                    type="number"
                    label="BP Dia"
                    outlined
                    dense
                    :rules="[
                      (val) => val === null || val === '' || (val >= 0 && val <= 200) || '0-200',
                    ]"
                  />
                </div>
                <div class="col-4">
                  <q-input
                    v-model.number="
                      formData.section_2_machine_objective_inputs.optional_systemic_measurements
                        .orthostatic_vitals_optional.seated_optional.heart_rate_bpm
                    "
                    type="number"
                    label="HR"
                    outlined
                    dense
                    :rules="[
                      (val) => val === null || val === '' || (val >= 0 && val <= 250) || '0-250',
                    ]"
                  />
                </div>
              </div>
            </q-card>
          </div>
          <div class="col-12 col-md-6">
            <q-card flat bordered class="q-pa-sm">
              <h4 class="text-subtitle2 q-mb-sm">Standing (optional)</h4>
              <div class="row q-col-gutter-sm">
                <div class="col-4">
                  <q-input
                    v-model.number="
                      formData.section_2_machine_objective_inputs.optional_systemic_measurements
                        .orthostatic_vitals_optional.standing_optional.systolic_mmhg
                    "
                    type="number"
                    label="BP Sys"
                    outlined
                    dense
                    :rules="[
                      (val) => val === null || val === '' || (val >= 0 && val <= 300) || '0-300',
                    ]"
                  />
                </div>
                <div class="col-4">
                  <q-input
                    v-model.number="
                      formData.section_2_machine_objective_inputs.optional_systemic_measurements
                        .orthostatic_vitals_optional.standing_optional.diastolic_mmhg
                    "
                    type="number"
                    label="BP Dia"
                    outlined
                    dense
                    :rules="[
                      (val) => val === null || val === '' || (val >= 0 && val <= 200) || '0-200',
                    ]"
                  />
                </div>
                <div class="col-4">
                  <q-input
                    v-model.number="
                      formData.section_2_machine_objective_inputs.optional_systemic_measurements
                        .orthostatic_vitals_optional.standing_optional.heart_rate_bpm
                    "
                    type="number"
                    label="HR"
                    outlined
                    dense
                    :rules="[
                      (val) => val === null || val === '' || (val >= 0 && val <= 250) || '0-250',
                    ]"
                  />
                </div>
              </div>
            </q-card>
          </div>
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-input
              v-model.number="
                formData.section_2_machine_objective_inputs.optional_systemic_measurements
                  .orthostatic_vitals_optional.time_between_positions_minutes_optional
              "
              type="number"
              step="0.1"
              label="Time between positions (minutes) (optional)"
              outlined
              dense
              :rules="[
                (val) => val === null || val === '' || (val >= 0 && val <= 60) || '0-60 minutes',
              ]"
            />
          </div>
          <div class="col-12 col-md-6"></div>
        </div>
      </q-tab-panel>
    </q-tab-panels>
  </q-card>

  <!-- SECTION 3 -->
  <q-card flat bordered class="q-pa-md q-mb-md">
    <q-card-section class="q-pa-none q-mb-md">
      <h2 class="text-h6 text-primary q-mb-sm">
        SECTION 3: Dermatological AI Inputs (Imported from Skin Analysis)
      </h2>
    </q-card-section>

    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-4">
        <q-input
          v-model.number="formData.section_3_dermatological_ai_inputs.oxidative_stress_score_oss"
          type="number"
          step="0.1"
          label="Oxidative Stress Score (OSS)"
          outlined
          dense
          :rules="[
            (val) => (val !== null && val !== '') || 'Required',
            (val) => (val >= 0 && val <= 1000) || 'Must be 0-1000',
          ]"
        />
      </div>
      <div class="col-12 col-md-4">
        <q-input
          v-model.number="formData.section_3_dermatological_ai_inputs.glycation_metabolic_score_gms"
          type="number"
          step="0.1"
          label="Glycation / Metabolic Score (GMS)"
          outlined
          dense
          :rules="[
            (val) => (val !== null && val !== '') || 'Required',
            (val) => (val >= 0 && val <= 1000) || 'Must be 0-1000',
          ]"
        />
      </div>
      <div class="col-12 col-md-4">
        <q-input
          v-model.number="
            formData.section_3_dermatological_ai_inputs.vascularity_inflammation_index_mvi
          "
          type="number"
          step="0.1"
          label="Vascularity / Inflammation Index (MVI)"
          outlined
          dense
          :rules="[
            (val) => (val !== null && val !== '') || 'Required',
            (val) => (val >= 0 && val <= 1000) || 'Must be 0-1000',
          ]"
        />
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-6">
        <q-input
          v-model.number="formData.section_3_dermatological_ai_inputs.pigment_instability_index_pii"
          type="number"
          step="0.1"
          label="Pigment Instability Index (PII)"
          outlined
          dense
          :rules="[
            (val) => (val !== null && val !== '') || 'Required',
            (val) => (val >= 0 && val <= 1000) || 'Must be 0-1000',
          ]"
        />
      </div>
      <div class="col-12 col-md-6"></div>
    </div>

    <div class="text-caption text-grey-7 q-mt-sm">
      If you want this section to be auto-imported (read-only), tell me the source payload keys and
      I'll wire an import button.
    </div>
  </q-card>

  <!-- OUTPUT -->
  <q-card flat bordered class="q-pa-md q-mb-md">
    <q-card-section class="q-pa-none q-mb-md">
      <h2 class="text-h6 text-primary q-mb-sm">Review & Output</h2>
    </q-card-section>

    <div class="row items-center q-mb-md">
      <div class="col-grow">
        <q-badge :color="statusPillColor" :label="statusPillText" class="q-mb-sm" />
        <div class="text-caption text-grey-7">
          Tip: Press <kbd class="kbd">Validate</kbd> first to see inline errors, then submit.
        </div>
      </div>
      <div class="col-auto">
        <div class="row q-gutter-sm">
          <q-btn color="primary" outline @click="copyJson" label="Copy JSON" />
          <q-btn color="dark" @click="downloadJson" label="Download JSON" />
        </div>
      </div>
    </div>

    <q-separator class="q-my-md" />

    <pre class="json-output q-pa-md bg-dark text-white rounded-borders">{{ formattedJson }}</pre>
  </q-card>
</template>

<script setup>
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

// Form data structure
const formData = reactive({
  meta: {
    profile: {
      name: 'Jane Doe',
      age: 42,
      sex: 'Female',
    },
  },
  section_1_client_questionnaire: {
    A_goals_intent: {
      primary_goal: '',
      secondary_goal: '',
      desired_intensity_preference: '',
    },
    B_safety_contraindications: {
      pregnant_or_breastfeeding: '',
      known_kidney_disease: '',
      kidney_disease_severity_if_yes: '',
      known_heart_disease_or_heart_failure: '',
      history_uncontrolled_hypertension: '',
      diabetes: '',
      known_g6pd_deficiency: '',
      history_seizures_epilepsy: '',
      known_allergy_to_iv_vitamins_minerals: 'No',
      iv_allergy_specify_if_yes: '',
      previous_adverse_reaction_to_iv_therapy: 'No',
      iv_reaction_specify_if_yes: '',
      current_fever_or_infection_symptoms_today: '',
    },
    C_recent_exposures_24_72h: {
      alcohol_intake_last_24h: '',
      exercise_last_24h: '',
      sleep_duration_last_night_hours: null,
      perceived_stress_level: '',
      caffeine_intake_today: '',
    },
    D_symptoms_today: {
      fatigue: '',
      headache: '',
      nausea: '',
      dizziness_on_standing: '',
      muscle_cramps: '',
      palpitations: '',
      swelling_or_puffiness_today: '',
      constipation_or_sluggish_digestion_today: '',
    },
    E_medications_supplements: {
      blood_pressure_medications: '',
      blood_thinners: '',
      thyroid_medications: '',
      diabetes_medications: '',
      anti_epileptic_medications: '',
      current_supplements: {
        selection: '',
        list_optional: '',
        others_specify_if_selected: '',
      },
    },
    F_nad_specific_if_applicable: {
      previous_nad_experience: '',
      tolerance_if_yes: '',
      preferred_nad_experience: '',
      primary_reason_for_nad_interest: '',
    },
    G_acute_metabolic_status: {
      time_since_last_meal_hours: null,
      current_diet_type: '',
      females_only: {
        first_day_of_last_menstrual_period_date: '',
        menopausal: '',
      },
    },
  },
  section_2_machine_objective_inputs: {
    blood_pressure_monitor: {
      systolic_mmhg: null,
      diastolic_mmhg: null,
      pulse_bpm: null,
    },
    pulse_oximeter_with_pi: {
      spo2_percent: null,
      pulse_bpm: null,
      perfusion_index: null,
    },
    hrv_measurement_device: {
      rmssd_or_tw_ms: null,
      resting_heart_rate_bpm: null,
      measurement_duration_minutes: null,
    },
    infrared_skin_thermometer_3_point: {
      forehead_c: null,
      left_cheek_c: null,
      right_cheek_c: null,
    },
    body_composition_analyzer_8_electrode: {
      body_weight_kg: null,
      height_cm: null,
      bmi: null,
      total_body_water: {
        value: null,
        unit: '',
      },
      body_fat_percentage: null,
      lean_muscle_mass_kg: null,
      visceral_fat_kg: null,
      basal_metabolic_rate_optional: null,
    },
    hand_grip_dynamometer: {
      dominant_hand_grip_strength_kg: null,
      non_dominant_hand_grip_strength_kg_optional: null,
      age_sex_adjusted_percentile_engine_derived: null,
    },
    optional_systemic_measurements: {
      systemic_body_temperature_c_optional: null,
      orthostatic_vitals_optional: {
        seated_optional: {
          systolic_mmhg: null,
          diastolic_mmhg: null,
          heart_rate_bpm: null,
        },
        standing_optional: {
          systolic_mmhg: null,
          diastolic_mmhg: null,
          heart_rate_bpm: null,
        },
        time_between_positions_minutes_optional: null,
      },
      respiratory_rate_bpm_optional: null,
    },
  },
  section_3_dermatological_ai_inputs: {
    oxidative_stress_score_oss: null,
    glycation_metabolic_score_gms: null,
    vascularity_inflammation_index_mvi: null,
    pigment_instability_index_pii: null,
  },
})

// UI State
const activeDeviceTab = ref('bp')
const validationStatus = ref('not-validated')
const formattedJson = ref('{}')

// Options

const sexOptions = ['Female', 'Male', 'Other', 'Prefer not to say']

const goalOptions = [
  'Energy',
  'Skin glow',
  'Recovery',
  'Immunity support',
  'Brain fog',
  'Athletic performance',
  'Antioxidant',
  'NAD+ wellness',
  'Weight Management & Metabolism',
  'Stress Relief & Relaxation',
].map((g) => ({ label: g, value: g }))

const intensityOptions = ['Gentle', 'Moderate', 'Strong']
const yesNoOptions = ['Yes', 'No']
const yesNoUnsureOptions = ['Yes', 'No', 'Unsure']
const kidneySeverityOptions = ['Mild', 'Moderate', 'Severe', 'On dialysis']

const ivAllergyOptions = ['Yes', 'No']

const alcoholOptions = ['None', '1-2', '3-5', '>5 drinks']
const exerciseOptions = ['None', 'Light', 'Heavy']
const stressLevelOptions = ['Low', 'Medium', 'High']
const caffeineOptions = ['None', '1 serving', '2+ servings']
const symptomSeverityOptions = ['None', 'Mild', 'Moderate', 'Severe']

const supplementOptions = [
  { label: 'Select', value: '' },
  { label: 'Magnesium', value: 'Magnesium' },
  { label: 'Electrolytes', value: 'Electrolytes' },
  { label: 'Vitamin C', value: 'Vitamin C' },
  { label: 'Others - specify', value: 'Others' },
]

const toleranceOptions = ['No issues', 'Nausea', 'Chest tightness', 'Anxiety']
const nadExperienceOptions = ['Gentle', 'Standard', 'Strong']
const nadReasonOptions = ['Energy', 'Brain clarity', 'Anti-aging support', 'Recovery']
const dietTypeOptions = ['Omnivore', 'Vegetarian', 'Vegan', 'Keto']
const tbwUnitOptions = ['%', 'Liters']

// Computed properties
const isNadApplicable = computed(() => {
  const pg = formData.section_1_client_questionnaire.A_goals_intent.primary_goal
  const sg = formData.section_1_client_questionnaire.A_goals_intent.secondary_goal
  return pg === 'NAD+ wellness' || sg === 'NAD+ wellness'
})

const showKidneySeverity = computed(() => {
  return (
    formData.section_1_client_questionnaire.B_safety_contraindications.known_kidney_disease ===
    'Yes'
  )
})

const showIvAllergySpecify = computed(() => {
  return (
    formData.section_1_client_questionnaire.B_safety_contraindications
      .known_allergy_to_iv_vitamins_minerals === 'Yes'
  )
})

const showIvReactionSpecify = computed(() => {
  return (
    formData.section_1_client_questionnaire.B_safety_contraindications
      .previous_adverse_reaction_to_iv_therapy === 'Yes'
  )
})

const showSupplementsOther = computed(() => {
  return (
    formData.section_1_client_questionnaire.E_medications_supplements.current_supplements
      .selection === 'Others'
  )
})

const showNadTolerance = computed(() => {
  return (
    formData.section_1_client_questionnaire.F_nad_specific_if_applicable.previous_nad_experience ===
    'Yes'
  )
})

const showFemaleOnlyFields = computed(() => {
  return formData.meta.profile.sex === 'Female'
})

const nadPillText = computed(() => {
  return isNadApplicable.value
    ? 'NAD+ module: applicable (mandatory)'
    : 'NAD+ module: not applicable'
})

const nadPillColor = computed(() => {
  return isNadApplicable.value ? 'warning' : ''
})

const statusPillText = computed(() => {
  switch (validationStatus.value) {
    case 'valid':
      return 'Validated: OK'
    case 'invalid':
      return 'Validated: errors found'
    default:
      return 'Not validated'
  }
})

const statusPillColor = computed(() => {
  switch (validationStatus.value) {
    case 'valid':
      return 'positive'
    case 'invalid':
      return 'negative'
    default:
      return ''
  }
})

// Methods
function generateSessionId() {
  return (
    'IV-' +
    Math.random().toString(16).slice(2, 10).toUpperCase() +
    '-' +
    Date.now().toString().slice(-5)
  )
}

function getCurrentDateTime() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function handleKidneyDiseaseChange() {
  if (
    formData.section_1_client_questionnaire.B_safety_contraindications.known_kidney_disease !==
    'Yes'
  ) {
    formData.section_1_client_questionnaire.B_safety_contraindications.kidney_disease_severity_if_yes =
      ''
  }
}

function handleIvAllergyChange() {
  if (
    formData.section_1_client_questionnaire.B_safety_contraindications
      .known_allergy_to_iv_vitamins_minerals !== 'Yes'
  ) {
    formData.section_1_client_questionnaire.B_safety_contraindications.iv_allergy_specify_if_yes =
      ''
  }
}

function handleIvReactionChange() {
  if (
    formData.section_1_client_questionnaire.B_safety_contraindications
      .previous_adverse_reaction_to_iv_therapy !== 'Yes'
  ) {
    formData.section_1_client_questionnaire.B_safety_contraindications.iv_reaction_specify_if_yes =
      ''
  }
}

function handleSupplementsChange() {
  if (
    formData.section_1_client_questionnaire.E_medications_supplements.current_supplements
      .selection !== 'Others'
  ) {
    formData.section_1_client_questionnaire.E_medications_supplements.current_supplements.others_specify_if_selected =
      ''
  }
}

function handleNadPrevChange() {
  if (
    formData.section_1_client_questionnaire.F_nad_specific_if_applicable.previous_nad_experience !==
    'Yes'
  ) {
    formData.section_1_client_questionnaire.F_nad_specific_if_applicable.tolerance_if_yes = ''
  }
}

function pruneUndefined(obj) {
  if (obj === null || obj === undefined) return undefined
  if (Array.isArray(obj)) {
    const arr = obj.map(pruneUndefined).filter((v) => v !== undefined)
    return arr.length > 0 ? arr : undefined
  }
  if (typeof obj === 'object') {
    const out = {}
    for (const k of Object.keys(obj)) {
      const v = pruneUndefined(obj[k])
      if (v !== undefined) out[k] = v
    }
    return Object.keys(out).length > 0 ? out : undefined
  }
  return obj
}

function buildJson() {
  const payload = JSON.parse(JSON.stringify(formData))

  // Remove NAD section if not applicable
  if (!isNadApplicable.value) {
    delete payload.section_1_client_questionnaire.F_nad_specific_if_applicable
  }

  // Remove female only section if not female
  if (payload.meta.profile.sex !== 'Female') {
    delete payload.section_1_client_questionnaire.G_acute_metabolic_status.females_only
  }

  return pruneUndefined(payload)
}

async function copyJson() {
  try {
    await navigator.clipboard.writeText(formattedJson.value)
    $q.notify({
      type: 'positive',
      message: 'JSON copied to clipboard!',
    })
  } catch (err) {
    console.error(err)
    $q.notify({
      type: 'negative',
      message: 'Failed to copy JSON to clipboard',
    })
  }
}

function downloadJson() {
  const jsonStr = formattedJson.value
  const blob = new Blob([jsonStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ai-iv-engine-${formData.meta.session_id || 'session'}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Initialize
onMounted(() => {
  formData.meta.session_id = generateSessionId()
  formData.meta.session_datetime = getCurrentDateTime()
  formattedJson.value = JSON.stringify(formData, null, 2)
})

// Watch for form changes to update JSON preview
watch(
  formData,
  () => {
    const json = buildJson()
    formattedJson.value = JSON.stringify(json, null, 2)
  },
  { deep: true },
)
</script>

<style scoped>
.kbd {
  font-family: ui-monospace, Menlo, monospace;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 1px 6px;
  border-radius: 6px;
  font-size: 12px;
  color: #0f172a;
}

.json-output {
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
  font-size: 12px;
  white-space: pre-wrap;
  overflow: auto;
  max-height: 420px;
  margin: 0;
}

.text-primary {
  color: #1f6b5f;
}

.bg-dark {
  background: #0b1220;
}

.rounded-borders {
  border-radius: 12px;
}
</style>
