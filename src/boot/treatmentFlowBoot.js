import { defineBoot } from '#q-app/wrappers'
import { useTreatmentFlowStore } from 'stores/treatmentFlow'

export default defineBoot(() => {
  const store = useTreatmentFlowStore()
  // try to restore from localStorage
  store.loadFromLocal()
})
