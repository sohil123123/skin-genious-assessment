import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
const root = dirname(dirname(fileURLToPath(import.meta.url)))
const moduleRoot = join(root, 'src/utils/facial/5_light_modes')
const rules = await import(pathToFileURL(join(moduleRoot, 'treatmentClinicRules.js')))
const pipeline = await import(pathToFileURL(join(moduleRoot, 'treatmentPipeline.js')))
const { buildTreatmentEligibility } = await import(pathToFileURL(join(moduleRoot, 'treatmentEligibility.js')))
const { TREATMENT_STEPS, TREATMENT_KNOWLEDGE } = await import(pathToFileURL(join(moduleRoot, 'treatmentKnowledge.js')))
const constraints = JSON.parse(await readFile(join(moduleRoot, 'treatment/constraints.json'), 'utf8'))
const concern = 'Superficial Pigmentation Score'
const diagnosis = { diagnosis_report: {
  combined_barrier_sensitivity: { parameter_name: 'Barrier Health + Sensitivity (Combined Score)',
    BSI_continuous: 0.30, backend_details: { barrier_uniformity_index: 0.85, flaking_texture_index: 0.05,
      erythema_intensity_index: 0.1, hydration_signal_index: 0.85 } },
  superficial_pigmentation: { parameter_name: concern, score_or_label: 70.235, target_single_session_score: 61.917,
    score_polarity: 'higher_is_worse', comparison_mode: 'direct_numeric', improvability_index: 0.7 },
  lip_pigmentation: { parameter_name: 'Lip Pigmentation Score', score_or_label: 75,
    score_polarity: 'higher_is_better' },
} }
const selected = [{ ...diagnosis.diagnosis_report.superficial_pigmentation, is_primary_concern: true }]
const options = { historyRuleFlags: Object.fromEntries(constraints.clinical_constraints.patient_history_rules.map((r) => [r.condition, false])) }
const input = rules.buildTreatmentPlannerInput(diagnosis, selected, 'express', null, constraints, options)
function step(id, duration, role = 'SUPPORT', overrides = {}) {
  return { step_id: id, duration, role, zones: ['full_face'], target_concerns: [concern],
    intensity_rung: ['HERO_CORRECTIVE','SECONDARY_CORRECTIVE'].includes(role) ? 2 : null,
    order_reason: 'Follows the documented mechanism and current skin state.', settings_note: null,
    duration_rationale: TREATMENT_STEPS[id]?.clinic_step_type === 'other' ? 'Uses the stated reference duration for this recorded purpose.' : null,
    additional_products: [], how_to_do: 'Treat the recorded zones using the approved protocol; monitor discomfort and stop for excessive reaction.',
    script: 'This treats the uneven tone on your cheeks at the appropriate dose.',
    infusion_ingredients: null, massage_purpose: null, ...overrides }
}
function draft() {
  const steps = [step('PREP.CLEANSE',2,'PREP'),
    step('PEEL.COMBO',4,'SECONDARY_CORRECTIVE',{how_to_do:'Apply the approved superficial protocol to the recorded cheek zones; complete neutralisation or protocol removal before proceeding.'}),
    step('COOL.ICE',2,'RECOVERY'),step('ENERGY.CARBON.APPLY',3,'PREP'),
    step('ENERGY.CARBON.LASER',4,'HERO_CORRECTIVE',{settings_note:'Use the supplied conservative clinician preset; never invent fluence.'}),
    step('COOL.ICE',2,'RECOVERY'),step('INFUSE.TRX',3),
    step('MASSAGE.LYMPH',5,'SUPPORT',{massage_purpose:'mandatory',how_to_do:'Use the existing clinician-approved lymphatic drainage protocol and supplied zone precautions.'}),
    step('MASK.BRIGHTEN',15),step('FINISH.SMS',3,'FINISH')]
  return { treatment_plan: { total_time: 'One session today.', course_outline: [],
    treatments: [{ session_number:1,title:'Cheek Tone Renewal',why_today:'The supplied cheek tone and congestion findings justify this combination.',script:'This is a synthetic software fixture, not a treatment recommendation.',week:1,
      preparations_checklist_for_therapist:['Confirm supplied screening and the approved clinician device preset.'],
      primary_strategy:[{concern,dominant_driver:'Supplied superficial pigment and congestion.',selected_step_id:'ENERGY.CARBON.LASER',care_type:'corrective',why_this_wins:'Adds the expected case-specific pigment and pore contribution.',exception_reason:null}],
      stack_comparison:'The superficial Combination peel adds nonredundant acne/PIH care beyond Carbon alone; approved cooling controls the combined burden.',
      personalisation_evidence:['Cheek unevenness links to the selected Carbon step.','The same cheek finding links to tranexamic support.','Recorded skin comfort links to the selected cooling recovery.'],
      signature_moment:{step_number:9,what:'Mirror reveal after the already selected mask.',clinical_role:'The mask already has a documented tone-support role.'},
      expectation_card:{tonight:'Possibly smoother appearance.',by_day_3:'Comfort depends on actual response.',by_week_2:'Persistent pigment may remain.',what_this_session_does_not_change:'No promise of structural or intrinsic pigment correction.'},
      continuity:{what_changed_since_last_visit:'first visit',what_we_are_building_toward:'Assess actual response.'},
      lip_pigmentation_rule:{status:'not_triggered',reason:'The supplied assessable client lip score is 75.',constraint_reference:''},steps}],
    modality_omission_explanation:Object.fromEntries(['q_switch_laser','carbon_facial','chemical_peel','rf_hifu_microneedling',...rules.SUPPORTIVE_REVIEW_KEYS].map((name)=>[name,'Selected or omitted for this recorded synthetic fixture purpose.'])) } }
}
const clone = (x) => JSON.parse(JSON.stringify(x))
const check = (d, ctx=input.clinic_treatment_context, type='express') => rules.validateClinicTreatmentPlan(rules.finalizeTreatmentPlan(d,input),ctx,type,constraints,input)
const invalid = (d, pattern, type='express') => { const result=check(d,input.clinic_treatment_context,type); assert.ok(result.error, 'must reject invalid plan'); assert.match(result.error.details.join('\n'),pattern) }
const envelope = (d=draft()) => {
  const plan=clone(d.treatment_plan);delete plan.total_time
  return {planning_result:{outcome:'success',treatment_plan:plan,failure:null}}
}
const singleDraft = () => {
  const d=draft();const session=d.treatment_plan.treatments[0]
  session.steps.splice(1,0,step('EXTR.MANUAL',7),step('ENERGY.HF',3))
  session.steps.splice(session.steps.length-1,0,step('LED.RED',13))
  return d
}

test('mother reference has 15 concern maps and keeps the 0-5 scale',()=>{
  assert.equal(TREATMENT_KNOWLEDGE.concern_maps.length,15)
  assert.equal(Object.keys(TREATMENT_KNOWLEDGE.strength_scale).length,6)
  assert.equal(TREATMENT_STEPS['PEEL.COMBO'].clinic_class,'superficial')
})
test('valid superficial Combination plus Carbon passes; timings and raw targets are derived exactly',()=>{
  const result=check(draft());assert.equal(result.error,undefined)
  const session=result.treatment_plan.treatments[0]
  assert.equal(session.treatment_time,43)
  assert.equal(result.treatment_plan.total_time,'43 minutes')
  assert.equal(session.concerns_addressed[0].current_value,70.235)
  assert.equal(session.concerns_addressed[0].target_value,61.917)
  assert.equal(session.steps[6].infusion_ingredients[0],'TRX A (Tranexamic Acid)')
})
test('fixed finish, carbon and infusion doses cannot be inflated or hidden as other',()=>{
  for (const [at,duration] of [[9,4],[4,7],[6,4]]) { const d=draft();d.treatment_plan.treatments[0].steps[at].duration=duration;invalid(d,/must take/) }
  const p=rules.finalizeTreatmentPlan(draft(),input);p.treatment_plan.treatments[0].steps[4].clinic_step_type='other'
  assert.match(rules.validateClinicTreatmentPlan(p,input.clinic_treatment_context,'express',constraints,input).error.details.join('\n'),/requires clinic_step_type/)
})
test('every relevant energy pass needs immediately following cooling',()=>{
  const d=draft();d.treatment_plan.treatments[0].steps.splice(5,1);invalid(d,/immediately follow/)
})
test('medium peel cannot be combined with Carbon, standalone toning or lip laser',()=>{
  const d=draft();d.treatment_plan.treatments[0].steps[1].step_id='PEEL.FUSION';invalid(d,/medium peel cannot share/)
})
test('superficial plus Carbon requires neutralisation, prior cooling and conservative settings',()=>{
  const a=draft();a.treatment_plan.treatments[0].steps[1].how_to_do='Apply and proceed.';invalid(a,/superficial peel plus Carbon/)
  const b=draft();b.treatment_plan.treatments[0].steps[4].settings_note=null;invalid(b,/superficial peel plus Carbon/)
})
test('microdermabrasion plus Carbon is allowed; medium peel plus microdermabrasion is rejected',()=>{
  const a=draft();a.treatment_plan.treatments[0].steps.splice(1,0,step('EXFO.MICRO.DIAMOND',8));
  a.treatment_plan.treatments[0].steps.splice(-1,0,step('LED.RED',10))
  const s=a.treatment_plan.treatments[0];s.steps.find((p)=>p.step_id==='COOL.ICE').duration=3
  s.signature_moment.step_number=s.steps.length-1
  assert.equal(check(a,input.clinic_treatment_context,'single').error,undefined)
  const b=clone(a);b.treatment_plan.treatments[0].steps.find((p)=>p.step_id==='PEEL.COMBO').step_id='PEEL.FUSION'
  invalid(b,/microdermabrasion cannot share/,'single')
})
test('standalone needling and HIFU cannot be smuggled into a detailed facial',()=>{
  for(const id of ['ENERGY.HIFU','ENERGY.MNRF','ENERGY.NEEDLE.PEN','ENERGY.NEEDLE.ROLLER']) {
    const d=draft();d.treatment_plan.treatments[0].steps.splice(1,0,step(id,5));invalid(d,/standalone clinician session/)
  }
})
test('spot salicylic never fills a corrective slot or counts as a hero',()=>{
  const d=draft();d.treatment_plan.treatments[0].steps.splice(1,0,step('PEEL.SPOT.SALI',2,'HERO_CORRECTIVE',{zones:['chin'],additional_products:['Sali DS Peel']}));invalid(d,/cannot be a counted corrective|lesion-only ADJUNCT/)
})
test('visible active lesions require the adjunct, and actual server-evaluated salicylic blocks prevail',()=>{
  const ctx=clone(input.clinic_treatment_context);ctx.active_acne_lesions_visible=true
  assert.match(check(draft(),ctx).error.details.join('\n'),/visible active acne requires/)
  ctx.clinical_clearance.blocked_steps['PEEL.SPOT.SALI']=[{condition:'active_acne_spot_treatment_rule',reason:'Synthetic actual clinician-evaluated salicylic contraindication.'}]
  assert.equal(check(draft(),ctx).error,undefined)
})
test('extraction and post-extraction high frequency cannot follow full-face acid or laser',()=>{
  const d=draft();d.treatment_plan.treatments[0].steps.splice(3,0,step('EXTR.MANUAL',3))
  invalid(d,/extraction and its high-frequency support must precede/)
})
test('ocular infusion cannot be assigned full-face zones',()=>{
  const d=draft();d.treatment_plan.treatments[0].steps.splice(8,0,step('EYE.INFUSE',2,'SUPPORT',{infusion_ingredients:['Hyaluronic Acid']}))
  invalid(d,/ocular infusion is confined/)
})
test('mandatory massage is included even when every other step already totals 61 minutes',()=>{
  const result=check(singleDraft(),input.clinic_treatment_context,'single')
  assert.equal(result.error,undefined)
  const session=result.treatment_plan.treatments[0]
  assert.equal(session.treatment_time,66)
  assert.equal(session.steps.filter((s)=>s.step_id==='MASSAGE.LYMPH').length,1)
  assert.equal(rules.requiredMassageMinutes(61,'single'),5)
  assert.equal(rules.requiredFillerMinutes(61,'single'),5)
  assert.equal(rules.requiredMassageMinutes(31,'express'),5)
  assert.equal(rules.requiredMassageMinutes(20,'express'),null)
  assert.equal(rules.requiredMassageMinutes(71,'single'),null)
})
test('every detailed session needs exactly one mandatory massage within its 5-10-minute bounds',()=>{
  const noMassage=draft();noMassage.treatment_plan.treatments[0].steps=noMassage.treatment_plan.treatments[0].steps.filter((s)=>s.step_id!=='MASSAGE.LYMPH')
  invalid(noMassage,/exactly one mandatory/)
  for(const duration of [4,11]) {
    const d=singleDraft();d.treatment_plan.treatments[0].steps.find((s)=>s.step_id==='MASSAGE.LYMPH').duration=duration
    invalid(d,/lymphatic_drainage must take/,'single')
  }
  const maximum=singleDraft();maximum.treatment_plan.treatments[0].steps.find((s)=>s.step_id==='MASSAGE.LYMPH').duration=10
  assert.equal(check(maximum,input.clinic_treatment_context,'single').error,undefined)
  const duplicate=draft();duplicate.treatment_plan.treatments[0].steps.splice(7,0,step('MASSAGE.LYMPH',5,'SUPPORT',{massage_purpose:'mandatory'}))
  invalid(duplicate,/exactly one mandatory/)
  const filler=draft();filler.treatment_plan.treatments[0].steps[7].massage_purpose='filler'
  invalid(filler,/not optional filler/)
})
test('raw current/target values cannot be invented, inverted or rounded',()=>{
  const p=rules.finalizeTreatmentPlan(draft(),input);p.treatment_plan.treatments[0].concerns_addressed[0].current_value=70
  assert.match(rules.validateClinicTreatmentPlan(p,input.clinic_treatment_context,'express',constraints,input).error.details.join('\n'),/preserve supplied raw/)
})
test('lip trigger is rounded client score below 70; explicit occlusion wins',()=>{
  for(const [value,trigger] of [[69.49,true],[69.5,false],[70,false]]) {
    const d=clone(diagnosis);d.diagnosis_report.lip_pigmentation.score_or_label=value
    assert.equal(rules.buildClinicTreatmentContext(d).lip_pigmentation.trigger,trigger)
  }
  const d=clone(diagnosis);d.diagnosis_report.lip_pigmentation.score_or_label=65;d.diagnosis_report.lip_pigmentation.lipstick_present=true
  assert.equal(rules.buildClinicTreatmentContext(d).lip_pigmentation.assessable,false)
})
test('triggered lip cannot be omitted or blocked using an unevaluated generic rule',()=>{
  const ctx=clone(input.clinic_treatment_context);ctx.lip_pigmentation={...ctx.lip_pigmentation,client_display_score:65,trigger:true}
  assert.ok(check(draft(),ctx).error)
  const d=draft();d.treatment_plan.treatments[0].lip_pigmentation_rule={status:'blocked_by_existing_constraints',constraint_reference:'energy_device_policy',reason:'A fabricated generic block.'}
  assert.match(check(d,ctx).error.details.join('\n'),/actual evaluated/)
})
test('history denies override efficacy; missing proxies create caution rather than denial',()=>{
  const a=buildTreatmentEligibility(diagnosis,constraints,{historyRuleFlags:{pregnant:true}})
  assert.ok(a.blocked_steps['ENERGY.CARBON.LASER']);assert.ok(a.blocked_steps['LED.RED'])
  const b=buildTreatmentEligibility({},constraints);assert.equal(b.numeric_energy_status,'allowed_with_caution');assert.equal(b.blocked_steps['ENERGY.CARBON.LASER'],undefined)
  const c=clone(diagnosis);c.diagnosis_report.combined_barrier_sensitivity.BSI_continuous=0.75
  assert.equal(buildTreatmentEligibility(c,constraints).numeric_energy_status,'denied')
})
test('raw client-scale BSI is never rescaled into a proxy or used to create a denial',()=>{
  const d=clone(diagnosis);d.diagnosis_report.combined_barrier_sensitivity.BSI_continuous=40
  const result=buildTreatmentEligibility(d,constraints)
  assert.equal(result.numeric_proxy_values.BSI_continuous,null);assert.equal(result.numeric_energy_status,'allowed_with_caution')
})
test('temperature and existing legacy deep rules remain executable',()=>{
  const a=buildTreatmentEligibility(diagnosis,constraints,{temperatureReadings:{forehead_surface_c:37,left_cheek_surface_c:37,right_cheek_surface_c:37}})
  assert.ok(a.blocked_steps['ENERGY.CARBON.LASER']);assert.equal(a.temperature.status,'deny_aggressive')
  const b=buildTreatmentEligibility(diagnosis,constraints,{historyRuleFlags:{travel_within_7_days:true}})
  assert.ok(b.blocked_steps['PEEL.FUSION']);assert.equal(b.blocked_steps['PEEL.COMBO'],undefined)
})
test('request projection retains complete patient, energy, temperature and support constraints',()=>{
  const c=pipeline.compileTreatmentConstraints(constraints)
  for(const key of ['patient_history_rules','energy_device_policy','regional_skin_temperature_policy','supportive_treatment_protocols','active_acne_spot_treatment_rule','mother_document_compatibility']) assert.deepEqual(c.clinical_constraints[key],constraints.clinical_constraints[key])
  assert.equal(c.clinical_constraints.required_candidate_comparisons,undefined)
  assert.equal(c.clinical_constraints.hero_modality_decision_policy.primary_concern_candidate_framework,undefined)
  assert.deepEqual(c.clinical_constraints.case_driven_selection_policy,constraints.clinical_constraints.case_driven_selection_policy)
  assert.equal(c.availableResources.ivInfusions,undefined)
  assert.deepEqual(c.availableResources.chemicalPeels.map((p)=>p.key_actives),constraints.availableResources.chemicalPeels.map((p)=>p.key_actives))
  assert.equal(c.availableResources.chemicalPeels.find((p)=>p.name==='Combination Peel').clinic_depth_class,'superficial')
  assert.deepEqual(c.availableResources.jet_infusion_solutions.find((p)=>p.name==='Niacinamide').approved_delivery_routes,['under_eye_infusion','hydra_spray'])
})
test('legacy exhaustive candidate lists cannot re-enter the model request or mutate clinical authority',()=>{
  const legacy=clone(constraints)
  legacy.clinical_constraints.required_candidate_comparisons={all_modalities:['Q-Switch Laser','Carbon Facial','Every named peel']}
  const before=clone(legacy)
  const request=pipeline.buildTreatmentModelRequest({systemPrompt:'Offline selection-contract fixture.',constraints:legacy,plannerInput:{treatment_plan_type:'single'}})
  const marker='AUTHORITATIVE CLINIC CONSTRAINTS AND AVAILABLE RESOURCES\n'
  const emitted=JSON.parse(request.instructions.slice(request.instructions.indexOf(marker)+marker.length))
  assert.equal(emitted.clinical_constraints.required_candidate_comparisons,undefined)
  assert.equal(emitted.clinical_constraints.hero_modality_decision_policy.primary_concern_candidate_framework,undefined)
  for(const key of ['patient_history_rules','energy_device_policy','active_acne_spot_treatment_rule','regional_skin_temperature_policy','mandatory_lymphatic_drainage','mother_document_compatibility','supportive_treatment_protocols'])
    assert.deepEqual(emitted.clinical_constraints[key],before.clinical_constraints[key])
  assert.deepEqual(emitted.clinical_constraints.hero_modality_decision_policy.hard_rules,before.clinical_constraints.hero_modality_decision_policy.hard_rules)
  assert.deepEqual(emitted.clinical_constraints.energy_vs_peel_priority_framework.hard_rules,before.clinical_constraints.energy_vs_peel_priority_framework.hard_rules)
  assert.deepEqual(legacy,before)
})
const args = {systemPrompt:'Offline fixture prompt; no clinical model call.',constraints,diagnosis,selectedConcerns:selected,treatmentType:'express',options}
test('request uses exact session counts and nonempty steps for success, with a separate blocked branch',()=>{
  for(const [type,count] of [['express',1],['single',1],['multiple',2],['full',2]]) {
    const request=pipeline.buildTreatmentModelRequest({systemPrompt:args.systemPrompt,constraints,plannerInput:{treatment_plan_type:type}})
    const schema=request.text.format.schema
    assert.equal(schema.type,'object');assert.equal(schema.anyOf,undefined)
    const [success,blocked]=schema.properties.planning_result.anyOf
    const plan=success.properties.treatment_plan
    assert.equal(plan.properties.treatments.minItems,count);assert.equal(plan.properties.treatments.maxItems,count)
    assert.equal(plan.properties.treatments.items.properties.steps.minItems,1)
    assert.equal(plan.properties.total_time,undefined)
    assert.equal(blocked.properties.treatment_plan.type,'null')
    if(count===2) assert.equal(plan.properties.course_outline.minItems,5)
    else assert.equal(plan.properties.course_outline.maxItems,0)
  }
})
test('new success envelope is unpacked from Responses, Chat, JSON strings and parsed objects',async()=>{
  const data=envelope()
  for(const response of [data,JSON.stringify(data),{status:'completed',output_text:JSON.stringify(data)},
    {choices:[{finish_reason:'stop',message:{parsed:data}}]}]) {
    let calls=0
    const result=await pipeline.generateTreatmentPlan({...args,callModel:async()=>{calls++;return response}})
    assert.equal(result.error,undefined);assert.equal(calls,1);assert.equal(result.treatment_plan.total_time,'43 minutes')
    assert.equal(result.planning_result,undefined)
  }
})
test('logged empty treatment payload is an output-contract failure, never a claimed clinical blockage',async()=>{
  const old=draft();old.treatment_plan.treatments=[];old.treatment_plan.total_time='61 minutes'
  const empty=envelope(old)
  const noSteps=envelope();noSteps.planning_result.treatment_plan.treatments[0].steps=[]
  const wrongCount=envelope();wrongCount.planning_result.treatment_plan.treatments.push(clone(wrongCount.planning_result.treatment_plan.treatments[0]))
  for(const response of [old,empty,noSteps,wrongCount]) {
    let calls=0
    const result=await pipeline.generateTreatmentPlan({...args,callModel:async()=>{calls++;return response}})
    assert.equal(result.error.code,'treatment_output_contract_violation');assert.equal(calls,1)
    assert.equal(result.treatment_plan,undefined);assert.ok(result.error.details.length)
  }
})
test('explicit blocked output preserves its reason/evidence and produces no session or repair call',async()=>{
  let calls=0
  const response={planning_result:{outcome:'blocked',treatment_plan:null,failure:{reason:'Synthetic evaluated restriction prevents the required session.',blocking_constraints:[{constraint_reference:'mandatory_lymphatic_drainage',case_evidence:'Synthetic server-evaluated hard stop for this fixture.'}]}}}
  const result=await pipeline.generateTreatmentPlan({...args,callModel:async()=>{calls++;return response}})
  assert.equal(result.error.code,'treatment_planning_blocked');assert.equal(calls,1)
  assert.match(result.error.details[0],/mandatory_lymphatic_drainage/);assert.equal(result.treatment_plan,undefined)
  response.planning_result.failure.blocking_constraints=[]
  const invalidResult=await pipeline.generateTreatmentPlan({...args,callModel:async()=>response})
  assert.equal(invalidResult.error.code,'treatment_output_contract_violation')
})
test('an actual server-evaluated block on required massage stops before a model request',async()=>{
  let calls=0
  const result=await pipeline.generateTreatmentPlan({...args,options:{...options,evaluatedClinicalBlocks:{'MASSAGE.LYMPH':[{condition:'mandatory_lymphatic_drainage',reason:'Synthetic clinical hard stop.'}]}},callModel:async()=>{calls++;return envelope()}})
  assert.equal(result.error.code,'treatment_planning_blocked');assert.equal(calls,0)
})
test('one successful API-shaped response results in one call and exact local finalization',async()=>{
  for (const response of [{status:'completed',output_text:JSON.stringify(draft())},JSON.stringify(draft()),{choices:[{finish_reason:'stop',message:{content:JSON.stringify(draft())}}]}]) {
    let calls=0
    const result=await pipeline.generateTreatmentPlan({...args,callModel:async()=>{calls++;return response}})
    assert.equal(result.error,undefined);assert.equal(calls,1)
  }
})
test('an existing application validator cannot erase detailed sessions and return success',async()=>{
  let calls=0
  const result=await pipeline.generateTreatmentPlan({...args,callModel:async()=>{calls++;return envelope()},existingClinicalValidator:async(plan)=>{
    const changed=clone(plan);changed.treatment_plan.treatments=[];return changed
  }})
  assert.equal(result.error.code,'treatment_output_contract_violation');assert.equal(calls,1)
  const valid=await pipeline.generateTreatmentPlan({...args,callModel:async()=>envelope(),existingClinicalValidator:async(plan)=>plan})
  assert.equal(valid.error,undefined)
})
test('repair is bounded to one additional call and preserves valid content',async()=>{
  let calls=0;const bad=draft();bad.treatment_plan.treatments[0].steps[9].duration=4
  const result=await pipeline.generateTreatmentPlan({...args,callModel:async()=>{calls++;return {status:'completed',output_text:JSON.stringify(calls===1?bad:draft())}}})
  assert.equal(result.error,undefined);assert.equal(calls,2)
  calls=0
  const failed=await pipeline.generateTreatmentPlan({...args,callModel:async()=>{calls++;return {status:'completed',output_text:JSON.stringify(bad)}}})
  assert.ok(failed.error);assert.equal(calls,2)
})
test('incomplete, malformed and refused responses never trigger automatic regeneration',async()=>{
  for(const response of [{status:'incomplete',incomplete_details:{reason:'max_output_tokens'}},'{broken', {status:'completed',output:[{content:[{type:'refusal'}]}]}, {choices:[{finish_reason:'length',message:{content:'{}'}}]}]) {
    let calls=0;const result=await pipeline.generateTreatmentPlan({...args,callModel:async()=>{calls++;return response}})
    assert.ok(result.error);assert.equal(calls,1)
  }
})
test('deadline aborts a stalled caller and makes no second request',async()=>{
  let calls=0,aborted=false
  const result=await pipeline.generateTreatmentPlan({...args,config:{deadlineMs:40,initialCallMs:40},callModel:async(_,controls)=>{
    calls++;return new Promise((_,reject)=>controls.signal.addEventListener('abort',()=>{aborted=true;reject(new Error('aborted'))},{once:true}))
  }})
  assert.ok(result.error);assert.equal(calls,1);assert.equal(aborted,true)
})
test('multiple courses expose only two detailed facials and gate all later sessions',()=>{
  const d=draft();const s=d.treatment_plan.treatments[0]
  s.steps.splice(1,0,step('EXTR.MANUAL',7),step('ENERGY.HF',3))
  s.steps.splice(s.steps.length-1,0,step('LED.RED',10))
  s.signature_moment.step_number=s.steps.length-2
  const second=clone(s);second.session_number=2;second.week=3
  d.treatment_plan.treatments.push(second)
  d.treatment_plan.course_outline=Array.from({length:5},(_,i)=>({session_number:i+1,week:1+i*2,session_kind:'facial',clinical_goal:'Conditional goals after actual review.',candidate_step_ids:['ENERGY.CARBON.LASER'],reassessment_required:i>=2,escalation_condition:'Actual tolerance and reassessment must justify any escalation.'}))
  assert.equal(check(d,input.clinic_treatment_context,'multiple').error,undefined)
  d.treatment_plan.course_outline[2].reassessment_required=false
  assert.match(check(d,input.clinic_treatment_context,'multiple').error.details.join('\n'),/reassessment gate/)
  d.treatment_plan.course_outline[2].reassessment_required=true
  d.treatment_plan.treatments[1].steps=d.treatment_plan.treatments[1].steps.filter((s)=>s.step_id!=='MASSAGE.LYMPH')
  assert.match(check(d,input.clinic_treatment_context,'multiple').error.details.join('\n'),/Session 2: exactly one mandatory/)
})
test('under-eye and spray approvals do not extend niacinamide to facial ultrasound infusion',()=>{
  const d=draft();d.treatment_plan.treatments[0].steps[6].infusion_ingredients=['Niacinamide']
  invalid(d,/ingredient is not approved for this route/)
})

test('v5.2 preserves disabled application timeouts and validates a delayed successful result', async () => {
  assert.equal(pipeline.TREATMENT_RUNTIME_CONFIG.deadlineMs, 0)
  assert.equal(pipeline.TREATMENT_RUNTIME_CONFIG.initialCallMs, 0)
  const result = await pipeline.generateTreatmentPlan({ ...args, callModel: async (_, controls) => {
    assert.equal(controls.timeoutMs, 0)
    assert.equal(controls.maxRetries, 0)
    await new Promise(resolve => setTimeout(resolve, 50))
    assert.equal(controls.signal.aborted, false)
    return envelope()
  } })
  assert.equal(result.error, undefined)
})

test('gateway failures retain exact diagnostic details and do not trigger repair', async () => {
  let calls = 0
  const result = await pipeline.generateTreatmentPlan({ ...args, callModel: async () => {
    calls++
    return { error: { code: 'gateway_fixture_error', message: 'Exact gateway fixture failure', details: ['fixture detail'] } }
  } })
  assert.equal(result.error.code, 'gateway_fixture_error')
  assert.equal(result.error.message, 'Exact gateway fixture failure')
  assert.deepEqual(result.error.details, ['fixture detail'])
  assert.equal(calls, 1)
})

test('an empty repair preserves the original populated plan validation failure', async () => {
  const original = draft()
  original.treatment_plan.treatments[0].steps[9].duration = 4
  const empty = draft()
  empty.treatment_plan.treatments = []
  let calls = 0
  const result = await pipeline.generateTreatmentPlan({ ...args, callModel: async () => ++calls === 1 ? original : empty })
  assert.equal(calls, 2)
  assert.equal(result.error.code, 'treatment_output_contract_violation')
  assert.match(result.error.message, /must take 3/)
  assert.ok(result.error.initial_validation)
})
