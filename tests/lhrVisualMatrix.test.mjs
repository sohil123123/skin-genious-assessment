import test from 'node:test'
import assert from 'node:assert/strict'
import { buildLhrAiRequest } from '../src/utils/lhr/ai.js'
import { normaliseInputs } from '../src/utils/lhr/workflow.js'
import { machineSettingFields } from '../src/utils/lhr/machineSettings.js'

test('same-day shave stays zero and a missing interval stays unknown', () => {
  for (const [value, expected] of [[0,0],['3',3],['',null],[undefined,null]]) {
    assert.equal(normaliseInputs({daysSinceLastShave:value}).daysSinceLastShave, expected)
  }
})
test('zone analysis requests view-level appearance evidence without physical measurements', () => {
  const q = buildLhrAiRequest('analysis', {model:'fixture',input:[]})
  const fields = q.text.format.schema.properties
  assert.ok(fields.views.items.required.includes('density_fraction'))
  assert.ok(fields.views.items.required.includes('coarseness_mix'))
  assert.ok(fields.baseline_comparable && fields.previous_comparable)
  assert.equal(fields.mean_shaft_calibre_um,undefined)
  assert.equal(fields.terminal_follicle_density_per_cm2,undefined)
})
test('changing titanium delivery mode changes the therapist controls', () => {
  const common = {console_area:'fixture',body_size:'M',phototype:'IV',fluence_j_cm2:1}
  for (const [mode,controls] of Object.entries({'SHR':{energy_kj:1,grid_size_cm2:1},'HR':{frequency_hz:1},'SHR STACK':{stack_count:1}})) {
    const settings = {...common,mode,...controls}
    assert.deepEqual(machineSettingFields({control_profile:'shr_console'},settings).map(f=>f.id).sort(),Object.keys(settings).sort())
  }
})
