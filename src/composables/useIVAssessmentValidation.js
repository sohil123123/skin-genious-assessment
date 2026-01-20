import { computed } from 'vue'
import { required, requiredIf, numeric, minValue } from '@vuelidate/validators'

export function useIVAssessmentValidation(formData) {
  return computed(() => ({
    meta: {
      profile: {
        name: { required },
        age: { required, numeric, minValue: minValue(1) },
        gender: { required },
      },
    },

    section_1_client_questionnaire: {
      A_goals_intent: {
        primary_goal: { required },
        secondary_goal: { required },
        desired_intensity_preference: { required },
      },
      B_safety_contraindications: {
        pregnant_or_breastfeeding: { required },

        pregnant_type_if_yes: {
          required: requiredIf(
            () =>
              formData.value.section_1_client_questionnaire.B_safety_contraindications
                .pregnant_or_breastfeeding == 'Yes',
          ),
        },

        trimester_if_pregnant: {
          required: requiredIf(() => {
            const b = formData.value.section_1_client_questionnaire.B_safety_contraindications
            return b.pregnant_or_breastfeeding == 'Yes' && b.pregnant_type_if_yes == 'Pregnant'
          }),
        },
      },
    },

    section_2_machine_objective_inputs: {
      blood_pressure_monitor: {
        systolic_mmhg: { required, numeric },
        diastolic_mmhg: { required, numeric },
        pulse_bpm: { required, numeric },
      },
    },
  }))
}
