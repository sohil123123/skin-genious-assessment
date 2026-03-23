import { defineStore } from 'pinia'
import { Loading, Notify } from 'quasar'
import { api } from 'src/boot/axios'
import { serialize } from 'object-to-formdata'
import { useCommonStore } from './commonStore'

// let user_id = LocalStorage.getItem('user_id') ? LocalStorage.getItem('user_id') : null

export const useIVAssessmentStore = defineStore('iv-assessment', {
  state: () => ({
    loading: false,
    formData: {
      id: null,
      user_id: null,
      name: null,
      age: null,
      gender: null,
      iv_inputs: {
        meta: {
          profile: {
            name: '',
            age: null,
            gender: '',
          },
          session_id: '',
          session_datetime: '',
        },
        section_1_client_questionnaire: {
          A_goals_intent: {
            primary_goal: '',
            secondary_goal: '',
            desired_intensity_preference: '',
          },
          B_safety_contraindications: {
            pregnant_or_breastfeeding: '',
            pregnant_type_if_yes: '',
            trimester_if_pregnant: '',
            known_kidney_disease: '',
            kidney_disease_severity_if_yes: '',
            kidney_fluid_restriction_if_yes: '',
            known_heart_disease_or_heart_failure: '',
            heart_disease_type_if_yes: '',
            heart_breathlessness_if_yes: '',
            history_uncontrolled_hypertension: '',
            hypertension_medication_if_yes: '',
            hypertension_high_bp_if_yes: '',
            diabetes: '',
            diabetes_type_if_yes: '',
            diabetes_hba1c_if_yes: '',
            known_g6pd_deficiency: '',
            g6pd_lab_test_if_yes: '',
            history_seizures_epilepsy: '',
            seizure_recent_if_yes: '',
            seizure_medication_if_yes: '',
            history_asthma: '',
            asthma_control_if_yes: '',
            asthma_inhaler_if_yes: '',
            asthma_er_if_yes: '',
            history_severe_allergy: '',
            severe_allergy_trigger_if_yes: '',
            severe_allergy_epinephrine_if_yes: '',
            severe_allergy_severity_if_yes: '',
            known_liver_disease: '',
            liver_disease_type_if_yes: '',
            liver_lfts_if_yes: '',
            liver_jaundice_if_yes: '',
            history_kidney_stones: '',
            kidney_stones_last_if_yes: '',
            kidney_stones_recurrent_if_yes: '',
            known_electrolyte_disorder: '',
            electrolyte_type_if_yes: '',
            electrolyte_medication_if_yes: '',
            known_allergy_to_iv_vitamins_minerals: '',
            allergy_ingredients_if_yes: [],
            allergy_severity_if_yes: '',
            allergy_specify_if_yes: '',
            previous_adverse_reaction_to_iv_therapy: '',
            reaction_type_if_yes: [],
            reaction_severity_if_yes: '',
            reaction_specify_if_yes: '',
            current_fever_or_infection_symptoms_today: '',
            fever_temperature_if_yes: '',
            fever_antibiotics_if_yes: '',
          },
          C_recent_exposures_24_72h: {
            alcohol_intake_last_24h: '',
            alcohol_last_drink_if_high: '',
            exercise_last_24h: '',
            sleep_duration_last_night_hours: null,
            perceived_stress_level: '',
            caffeine_intake_today: '',
          },
          D_symptoms_today: {
            fatigue: '',
            headache: '',
            nausea: '',
            vomiting_if_nausea: '',
            dizziness_on_standing: '',
            muscle_cramps: '',
            muscle_cramps_type_if_yes: '',
            palpitations: '',
            palpitations_chest_pain_if_yes: '',
            palpitations_frequency_if_yes: '',
            swelling_or_puffiness_today: '',
            swelling_duration_if_yes: '',
            constipation_or_sluggish_digestion_today: '',
            constipation_type_if_yes: '',
            brain_fog_today: '',
            shortness_of_breath_today: '',
          },
          E_medications_supplements: {
            blood_pressure_medications: '',
            bp_meds_taken_today: '',
            blood_thinners: '',
            blood_thinners_type: '',
            thyroid_medications: '',
            thyroid_meds_type: '',
            diabetes_medications: '',
            diabetes_insulin_use: '',
            anti_epileptic_medications: '',
            anti_epileptic_taken_daily: '',
            currently_on_antibiotics: '',
            antibiotics_reason: '',
            antibiotics_started: '',
            antibiotics_still_symptomatic: '',
            current_supplements: {
              selection: '',
              list_optional: '',
              others_specify_if_selected: '',
              magnesium_taken_24h: '',
              electrolytes_taken_24h: '',
            },
          },
          F_nad_specific_if_applicable: {
            previous_nad_experience: '',
            tolerance_if_yes: '',
            tolerance_improved_when_slowed: '',
            preferred_nad_experience: '',
            primary_reason_for_nad_interest: '',
          },
          G_acute_metabolic_status: {
            time_since_last_meal_hours: null,
            current_diet_type: '',
            females_only: {
              first_day_of_last_menstrual_period_date: '',
              menopausal: '',
              pregnancy_chance_if_uncertain: '',
            },
          },
          H_iv_access_procedure_tolerance: {
            history_fainting_needles: '',
            fainting_frequency: '',
            fainting_last_occurred: '',
            needle_phobia: '',
            needle_phobia_preference: '',
            difficult_veins: '',
            difficult_veins_attempts: '',
            vasovagal_tendency: '',
            vasovagal_trigger: '',
          },
        },
        section_2_machine_objective_inputs_part_1: {
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
        },
        section_2_machine_objective_inputs_part_2: {
          body_composition_analyzer_8_electrode: {
            body_weight_kg: null,
            height_cm: null,
            bmi: null,
            total_body_water: null,
            body_fat_percentage: null,
            lean_muscle_mass_kg: null,
            visceral_fat_rating: null,
            basal_metabolic_rate_optional: null,
          },
          hand_grip_dynamometer: {
            dominant_hand_grip_strength_kg: null,
            non_dominant_hand_grip_strength_kg_optional: null,
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
          barrier_hydration_stress_score_bhs: null,
        },
      },
      diagnosis: null,
      assessment_type: 'iv',
      parameters_with_abnormal_scores: null,
      selected_plan_type: null,
      treatment_plans: null,
      therapist_notes: null,
      status: 'in_progress',
    },
    initialFormData: {
      id: null,
      user_id: null,
      meta: {
        profile: {
          name: '',
          age: null,
          gender: '',
        },
        session_id: '',
        session_datetime: '',
      },
      section_1_client_questionnaire: {
        A_goals_intent: {
          primary_goal: '',
          secondary_goal: '',
          desired_intensity_preference: '',
        },
        B_safety_contraindications: {
          pregnant_or_breastfeeding: '',
          pregnant_type_if_yes: '',
          trimester_if_pregnant: '',
          known_kidney_disease: '',
          kidney_disease_severity_if_yes: '',
          kidney_fluid_restriction_if_yes: '',
          known_heart_disease_or_heart_failure: '',
          heart_disease_type_if_yes: '',
          heart_breathlessness_if_yes: '',
          history_uncontrolled_hypertension: '',
          hypertension_medication_if_yes: '',
          hypertension_high_bp_if_yes: '',
          diabetes: '',
          diabetes_type_if_yes: '',
          diabetes_hba1c_if_yes: '',
          known_g6pd_deficiency: '',
          g6pd_lab_test_if_yes: '',
          history_seizures_epilepsy: '',
          seizure_recent_if_yes: '',
          seizure_medication_if_yes: '',
          history_asthma: '',
          asthma_control_if_yes: '',
          asthma_inhaler_if_yes: '',
          asthma_er_if_yes: '',
          history_severe_allergy: '',
          severe_allergy_trigger_if_yes: '',
          severe_allergy_epinephrine_if_yes: '',
          severe_allergy_severity_if_yes: '',
          known_liver_disease: '',
          liver_disease_type_if_yes: '',
          liver_lfts_if_yes: '',
          liver_jaundice_if_yes: '',
          history_kidney_stones: '',
          kidney_stones_last_if_yes: '',
          kidney_stones_recurrent_if_yes: '',
          known_electrolyte_disorder: '',
          electrolyte_type_if_yes: '',
          electrolyte_medication_if_yes: '',
          known_allergy_to_iv_vitamins_minerals: '',
          allergy_ingredients_if_yes: [],
          allergy_severity_if_yes: '',
          allergy_specify_if_yes: '',
          previous_adverse_reaction_to_iv_therapy: '',
          reaction_type_if_yes: [],
          reaction_severity_if_yes: '',
          reaction_specify_if_yes: '',
          current_fever_or_infection_symptoms_today: '',
          fever_temperature_if_yes: '',
          fever_antibiotics_if_yes: '',
        },
        C_recent_exposures_24_72h: {
          alcohol_intake_last_24h: '',
          alcohol_last_drink_if_high: '',
          exercise_last_24h: '',
          sleep_duration_last_night_hours: null,
          perceived_stress_level: '',
          caffeine_intake_today: '',
        },
        D_symptoms_today: {
          fatigue: '',
          headache: '',
          nausea: '',
          vomiting_if_nausea: '',
          dizziness_on_standing: '',
          muscle_cramps: '',
          muscle_cramps_type_if_yes: '',
          palpitations: '',
          palpitations_chest_pain_if_yes: '',
          palpitations_frequency_if_yes: '',
          swelling_or_puffiness_today: '',
          swelling_duration_if_yes: '',
          constipation_or_sluggish_digestion_today: '',
          constipation_type_if_yes: '',
          brain_fog_today: '',
          shortness_of_breath_today: '',
        },
        E_medications_supplements: {
          blood_pressure_medications: '',
          bp_meds_taken_today: '',
          blood_thinners: '',
          blood_thinners_type: '',
          thyroid_medications: '',
          thyroid_meds_type: '',
          diabetes_medications: '',
          diabetes_insulin_use: '',
          anti_epileptic_medications: '',
          anti_epileptic_taken_daily: '',
          currently_on_antibiotics: '',
          antibiotics_reason: '',
          antibiotics_started: '',
          antibiotics_still_symptomatic: '',
          current_supplements: {
            selection: '',
            list_optional: '',
            others_specify_if_selected: '',
            magnesium_taken_24h: '',
            electrolytes_taken_24h: '',
          },
        },
        F_nad_specific_if_applicable: {
          previous_nad_experience: '',
          tolerance_if_yes: '',
          tolerance_improved_when_slowed: '',
          preferred_nad_experience: '',
          primary_reason_for_nad_interest: '',
        },
        G_acute_metabolic_status: {
          time_since_last_meal_hours: null,
          current_diet_type: '',
          females_only: {
            first_day_of_last_menstrual_period_date: '',
            menopausal: '',
            pregnancy_chance_if_uncertain: '',
          },
        },
        H_iv_access_procedure_tolerance: {
          history_fainting_needles: '',
          fainting_frequency: '',
          fainting_last_occurred: '',
          needle_phobia: '',
          needle_phobia_preference: '',
          difficult_veins: '',
          difficult_veins_attempts: '',
          vasovagal_tendency: '',
          vasovagal_trigger: '',
        },
      },
      section_2_machine_objective_inputs_part_1: {
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
      },
      section_2_machine_objective_inputs_part_2: {
        body_composition_analyzer_8_electrode: {
          body_weight_kg: null,
          height_cm: null,
          bmi: null,
          total_body_water: null,
          body_fat_percentage: null,
          lean_muscle_mass_kg: null,
          visceral_fat_rating: null,
          basal_metabolic_rate_optional: null,
        },
        hand_grip_dynamometer: {
          dominant_hand_grip_strength_kg: null,
          non_dominant_hand_grip_strength_kg_optional: null,
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
        barrier_hydration_stress_score_bhs: null,
      },
    },
    treatment_session_id: null,
    showDialog: false,
  }),

  actions: {
    async getPatientData(uid) {
      Loading.show({
        message: 'Getting patient data...',
      })
      await api
        .get(`/users/${uid}`)
        .then((response) => {
          this.setPatientData(response.data.results)
          Loading.hide()
        })
        .catch((e) => {
          Loading.hide()
          console.log(e)
          Notify.create({
            type: 'negative',
            message: e.response.data.message,
          })
        })
    },
    async getSingleAssessment(assessment_id) {
      Loading.show({
        message: 'Getting assessment data...',
      })
      await api
        .get(`assessments/${assessment_id}`)
        .then(async (response) => {
          await this.setData(response.data.results)
          Loading.hide()
        })
        .catch((e) => {
          Loading.hide()
          console.log(e)
          Notify.create({
            type: 'negative',
            message: e.response.data.message,
          })
        })
    },
    async createNewAssessment() {
      Loading.show({
        message: 'Creating new assessment...',
      })
      await api
        .post(`/assessments`, this.formData)
        .then((response) => {
          this.setData(response.data.results)
          Loading.hide()
        })
        .catch((e) => {
          Loading.hide()
          console.log(e)
          Notify.create({
            type: 'negative',
            message: e.response.data.message,
          })
        })
    },
    async updateAssessment(payload) {
      if (!this.formData.id) return
      payload.user_id = this.formData.user_id
      payload._method = 'PUT'
      const config = {
        indices: true,
        nullAsUndefined: false,
        nullsAsUndefineds: false,
        noFilesWithArrayNotation: true,
        emptyArraysAsNull: false,
        allowEmptyArrays: true,
      }

      Object.keys(payload).forEach((key) => {
        if (Array.isArray(payload[key]) && payload[key].length === 0) {
          payload[key] = null
        }
      })

      const formData = serialize(payload, config)

      await api
        .post(`assessments/${this.formData.id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        .then(async (response) => {
          this.formData.images = response.data.results.images
          this.formData.post_images = response.data.results.post_images
          this.formData.conversation_id = response.data.results.conversation_id
          if (
            response.data.results.treatment_sessions &&
            response.data.results.treatment_sessions.treatments?.length > 0
          ) {
            this.treatment_session_id = response.data.results.treatment_sessions.treatments[0].id
            this.formData.treatment_sessions = response.data.results.treatment_sessions
          }
          if (response.data.results.parameters_with_abnormal_scores) {
            this.formData.parameters_with_abnormal_scores =
              response.data.results.parameters_with_abnormal_scores
          }
        })
        .catch((e) => {
          console.log(e)
          // Notify.create({
          //   type: 'negative',
          //   message: e.response.data.message,
          // })
        })
    },

    setPatientData(data) {
      this.formData.user_id = data.id
      this.formData.iv_inputs.meta.profile.name = data.first_name + ' ' + data.last_name
      this.formData.iv_inputs.meta.profile.gender = data.gender
      this.formData.iv_inputs.meta.profile.age = useCommonStore().getAgeFromDate(data.date_of_birth)
    },
    setData(data) {
      if (data.iv_inputs && typeof data.iv_inputs === 'string') {
        try {
          data.iv_inputs = JSON.parse(data.iv_inputs)
        } catch (e) {
          console.error('Failed to parse iv_inputs:', e)
        }
      }
      // Merge top level fields
      Object.assign(this.formData, data)

      // Ensure iv_inputs is also merged if it exists in data
      if (data.iv_inputs) {
        this.formData.iv_inputs = data.iv_inputs

        if (this.formData.iv_inputs.section_3_dermatological_ai_inputs) {
          this.formData.iv_inputs.section_3_dermatological_ai_inputs.oxidative_stress_score_oss =
            data.parameters_with_abnormal_scores?.scores?.OSS?.score_0_100
          this.formData.iv_inputs.section_3_dermatological_ai_inputs.glycation_metabolic_score_gms =
            data.parameters_with_abnormal_scores?.scores?.GMS?.score_0_100
          this.formData.iv_inputs.section_3_dermatological_ai_inputs.vascularity_inflammation_index_mvi =
            data.parameters_with_abnormal_scores?.scores?.MVI?.score_0_100
          this.formData.iv_inputs.section_3_dermatological_ai_inputs.barrier_hydration_stress_score_bhs =
            data.parameters_with_abnormal_scores?.scores?.BHS?.score_0_100
        }
      }
    },
    async storeFaceImages(file, assessment_type) {
      const formData = new FormData()
      // files.forEach((file) => {
      // check if real file exists
      const raw = file.__file || file
      if (raw instanceof File) {
        formData.append('image', raw)
      }
      // })
      formData.append('assessment_type', assessment_type)

      const response = await api
        .post(`assessments/${this.formData.id}/images`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((res) => {
          if (assessment_type == 'post') {
            this.formData.post_images = res.data.results.post_images
          } else {
            this.formData.images = res.data.results.images
          }
          return res.data
        })
        .catch((e) => {
          console.error('UPLOAD ERROR:', e.response?.data || e)
          Notify.create({
            type: 'negative',
            message: e.response?.data?.message || 'Upload failed',
          })
          return null
        })
      const file_id = response.results.file_id
      return file_id
    },
    async updateTreatmentSessionId(appointmentId) {
      try {
        await api.post(`/appointments/update-treatment-session-id/${appointmentId}`, {
          assessment_id: this.formData.id,
          treatment_session_id: this.treatment_session_id,
        })
        return true
      } catch (e) {
        console.log(e)
        return false
      }
    },
    initiateDialog() {
      this.showDialog = true
    },
    async bookNextAppointment(data, nextSessionId) {
      let payload = {
        type: 'treatment',
        clinic_id: this.formData.clinic_id,
        user_id: this.formData.user_id,
        therapist_id: this.formData.therapist_id ?? 2,
        assessment_id: this.formData.id,
        treatment_session_id: nextSessionId,
        appointment_datetime: data.datetime,
        notes: data.notes,
      }
      this.loading = true
      await api
        .post(`/appointments`, payload)
        .then((response) => {
          this.showDialog = false
          Notify.create({
            type: 'positive',
            message: response.data.message,
          })
        })
        .catch((e) => {
          console.log(e)
          Notify.create({
            type: 'negative',
            message: e.response.data.message,
          })
        })
        .finally(() => {
          this.loading = false
        })
    },
    async updateStatus(appointment_id) {
      await api
        .post(`/appointments/status/${appointment_id}`, {
          status: 'completed',
        })
        .then((response) => {
          this.showDialog = false
          console.log(response.data.message)
        })
        .catch((e) => {
          console.log(e)
          Notify.create({
            type: 'negative',
            message: e.response.data.message,
          })
        })
    },
  },
})
