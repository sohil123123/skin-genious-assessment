import test from 'node:test'
import assert from 'node:assert/strict'
import {
  LHR_MACHINE_DEFAULTS,
  LHR_LEGACY_MACHINE_DEFAULTS,
  withMachineDefaults,
} from '../src/utils/lhr/machineDefaults.js'
import { normaliseInputs } from '../src/utils/lhr/workflow.js'

test('empty saved machine receives complete labelled test defaults before generation', () => {
  const machine = withMachineDefaults(normaliseInputs({ zones: {} }).machine)
  for (const key of Object.keys(LHR_MACHINE_DEFAULTS.machine)) assert.notEqual(machine[key], null)
  assert.equal(machine.is_test_configuration, true)
  assert.match(machine.name, /TEST ONLY/)
  assert.equal(normaliseInputs({ zones: {}, machine }).machine.is_test_configuration, true)
})
test('defaults fill missing fields without overwriting configured limits or valid zero cooling', () => {
  const saved = {
    name: 'Actual entered device',
    cooling_c: 0,
    max_fluence: 9,
    protocol_reference: '   ',
  }
  const result = withMachineDefaults(saved)
  assert.equal(result.name, saved.name)
  assert.equal(result.cooling_c, 0)
  assert.equal(result.max_fluence, 9)
  assert.ok(result.protocol_reference.trim())
  assert.equal(result.is_test_configuration, true)
  assert.equal(saved.protocol_reference, '   ')
})
test('complete real configurations remain real and disabling defaults keeps missing values missing', () => {
  const actual = {
    ...LHR_LEGACY_MACHINE_DEFAULTS.machine,
    name: 'Verified device',
    protocol_reference: 'Verified protocol',
    is_test_configuration: false,
  }
  assert.deepEqual(withMachineDefaults(actual), actual)
  assert.deepEqual(
    withMachineDefaults({ cooling_c: null }, { ...LHR_MACHINE_DEFAULTS, enabled: false }),
    { cooling_c: null },
  )
})

test('SHR defaults survive save normalisation without invented generic controls', () => {
  const machine = normaliseInputs({ machine: withMachineDefaults() }).machine
  assert.equal(machine.control_profile, 'shr_console')
  assert.equal(machine.min_energy_kj, 10)
  assert.equal(machine.max_grid_cm2, 100)
  assert.equal(machine.min_fluence, 1)
  for (const key of ['pulse_width_ms', 'spot_size_mm', 'cooling_c', 'wavelength_nm'])
    assert.ok(machine[key] == null)
  assert.equal(machine.body_size, null)
  const saved = { ...machine, min_energy_kj: 7, max_energy_kj: 12, body_size: 'L' }
  assert.deepEqual(withMachineDefaults(saved), saved)
})
