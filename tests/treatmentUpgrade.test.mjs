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
  const c=draft();c.treatment_plan.treatments[0].steps.splice(2,1);invalid(c,/superficial peel plus Carbon/)
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
  const d=draft();d.treatment_plan.treatments[0].steps.splice(1,0,step('PEEL.SPOT.SALI',2,'HERO_CORRECTIVE',{zones:['chin'],additional_products:['Sali DS Peel']}))
  const fixed=check(d);assert.equal(fixed.error,undefined)
  assert.equal(fixed.treatment_plan.treatments[0].steps[1].role,'ADJUNCT')
  assert.equal(fixed.treatment_plan.treatments[0].steps[1].intensity_rung,null)
  d.treatment_plan.treatments[0].primary_strategy[0].selected_step_id='PEEL.SPOT.SALI'
  invalid(d,/required corrective slot cannot be filled/)
  const bypass=rules.finalizeTreatmentPlan(draft(),input)
  bypass.treatment_plan.treatments[0].steps.splice(1,0,{
    ...fixed.treatment_plan.treatments[0].steps[1],role:'HERO_CORRECTIVE'})
  assert.match(rules.validateClinicTreatmentPlan(bypass,input.clinic_treatment_context,'express',constraints,input).error.details.join('\n'),/cannot be a counted corrective|lesion-only ADJUNCT/)
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
test('fixed step roles are canonicalised without another call or changing treatment doses',async()=>{
  const wrong=draft();const session=wrong.treatment_plan.treatments[0]
  for(const s of session.steps) if(rules.FIXED_TREATMENT_STEP_ROLES[s.step_id]) {
    s.role='HERO_CORRECTIVE';s.intensity_rung=3
  }
  const original=clone(wrong);let calls=0
  const result=await pipeline.generateTreatmentPlan({...args,callModel:async()=>{calls++;return envelope(wrong)}})
  assert.equal(result.error,undefined);assert.equal(calls,1)
  for(const s of result.treatment_plan.treatments[0].steps) {
    if(rules.FIXED_TREATMENT_STEP_ROLES[s.step_id]) {
      assert.equal(s.role,rules.FIXED_TREATMENT_STEP_ROLES[s.step_id]);assert.equal(s.intensity_rung,null)
    }
  }
  assert.equal(result.treatment_plan.treatments[0].steps.find(s=>s.step_id==='ENERGY.CARBON.LASER').role,'HERO_CORRECTIVE')
  assert.deepEqual(result.treatment_plan.treatments[0].steps.map(s=>[s.step_id,s.duration,s.zones]),session.steps.map(s=>[s.step_id,s.duration,s.zones]))
  assert.deepEqual(wrong,original);assert.equal(result.treatment_plan.total_time,'43 minutes')
})
test('case schema binds exact concern names, primary count and registered strategy step IDs',()=>{
  const request=pipeline.buildTreatmentModelRequest({systemPrompt:args.systemPrompt,constraints,plannerInput:input})
  const session=request.text.format.schema.properties.planning_result.anyOf[0].properties.treatment_plan.properties.treatments.items
  const strategy=session.properties.primary_strategy
  assert.equal(strategy.minItems,1);assert.equal(strategy.maxItems,1)
  assert.deepEqual(strategy.items.properties.concern.enum,[concern])
  assert.ok(strategy.items.properties.selected_step_id.enum.includes('ENERGY.CARBON.LASER'))
  assert.ok(strategy.items.properties.selected_step_id.enum.includes(null))
  const caseSteps=session.properties.steps.items.anyOf
  for(const stepSchema of caseSteps) assert.deepEqual(stepSchema.properties.target_concerns.items.enum,input.planning_contract.allowed_concern_names)
  assert.ok(!caseSteps[0].properties.target_concerns.items.enum.includes('PIH'))
  const unknown=envelope();unknown.planning_result.treatment_plan.treatments[0].steps[4].target_concerns=['PIH']
  assert.throws(()=>rules.unpackTreatmentPlannerResponse(unknown,'express',input),e=>e.code==='treatment_output_contract_violation')
  const missing=envelope();missing.planning_result.treatment_plan.treatments[0].primary_strategy=[]
  assert.throws(()=>rules.unpackTreatmentPlannerResponse(missing,'express',input),e=>e.code==='treatment_output_contract_violation')
  const unselected=clone(input);unselected.treatable_concerns.parameters_with_abnormal_scores[0].is_primary_concern=false
  const noPrimary=rules.buildTreatmentGenerationResponseFormat('express',unselected).schema.properties.planning_result.anyOf[0].properties.treatment_plan.properties.treatments.items.properties.primary_strategy
  assert.equal(noPrimary.minItems,0);assert.equal(noPrimary.maxItems,0)
})
test('each primary gets one strategy, with diagnostic names and actual step-target linkage',()=>{
  const missing=draft();missing.treatment_plan.treatments[0].primary_strategy=[]
  const failure=check(missing)
  assert.match(failure.error.details.join('\n'),new RegExp('selected primary concern "'+concern+'" has no strategy'))
  const duplicate=draft();duplicate.treatment_plan.treatments[0].primary_strategy.push(clone(duplicate.treatment_plan.treatments[0].primary_strategy[0]))
  invalid(duplicate,/must have exactly one strategy/)
  const wrongStep=draft();wrongStep.treatment_plan.treatments[0].primary_strategy[0].selected_step_id='ENERGY.CARBON.APPLY'
  invalid(wrongStep,/required corrective slot cannot be filled/)
  const noLink=draft();noLink.treatment_plan.treatments[0].steps[4].target_concerns=[]
  invalid(noLink,/primary strategy .* actual step and its target concern/)
})
function spotLipFixture(correctOrder) {
  const d=draft();const s=d.treatment_plan.treatments[0]
  s.steps=s.steps.filter(p=>p.step_id!=='INFUSE.TRX')
  const spot=step('PEEL.SPOT.SALI',2,'ADJUNCT',{zones:['chin'],additional_products:['Sali DS Peel']})
  s.steps.splice(correctOrder?1:s.steps.length-1,0,spot)
  s.steps.splice(-1,0,step('ENERGY.QS.LIP',2,'ADJUNCT',{zones:['lips'],target_concerns:['Lip Pigmentation Score'],settings_note:'Use the existing approved lip protocol; confirm missing settings without inventing them.'}))
  s.lip_pigmentation_rule={status:'included',reason:'Supplied assessable client lip score is 65.',constraint_reference:''}
  s.signature_moment.step_number=s.steps.findIndex(p=>p.step_id==='MASK.BRIGHTEN')+1
  return d
}
const spotLipDiagnosis=clone(diagnosis);spotLipDiagnosis.diagnosis_report.lip_pigmentation.score_or_label=65
const spotLipInput=rules.buildTreatmentPlannerInput(spotLipDiagnosis,selected,'express',null,constraints,options)
test('spot immediately before the lip pass needs no extra cooling and causes no repair call',async()=>{
  const d=spotLipFixture(false);const original=clone(d);let calls=0
  const result=await pipeline.generateTreatmentPlan({...args,diagnosis:spotLipDiagnosis,callModel:async()=>{calls++;return envelope(d)}})
  assert.equal(result.error,undefined);assert.equal(calls,1)
  assert.equal(result.treatment_plan.total_time,'44 minutes')
  const session=result.treatment_plan.treatments[0]
  const at=session.steps.findIndex(s=>s.step_id==='PEEL.SPOT.SALI')
  assert.equal(session.steps[at+1].step_id,'ENERGY.QS.LIP')
  assert.equal(session.steps.filter(s=>s.step_id==='COOL.ICE').length,2)
  assert.deepEqual(d,original)
})
test('spot does not require intervening cooling before any Q-switch type',()=>{
  for(const id of ['ENERGY.CARBON.LASER','ENERGY.QS.TONING','ENERGY.QS.532','ENERGY.QS.LIP']) {
    const d=draft();const s=d.treatment_plan.treatments[0]
    if(id==='ENERGY.QS.LIP') {
      const p=rules.finalizeTreatmentPlan(spotLipFixture(false),spotLipInput)
      assert.equal(rules.validateClinicTreatmentPlan(p,spotLipInput.clinic_treatment_context,'express',constraints,spotLipInput).error,undefined)
      continue
    }
    const spot=step('PEEL.SPOT.SALI',2,'ADJUNCT',{zones:['chin'],additional_products:['Sali DS Peel']})
    if(id==='ENERGY.CARBON.LASER') s.steps.splice(3,0,spot)
    else {
      s.steps=s.steps.filter(p=>!['ENERGY.CARBON.APPLY','ENERGY.CARBON.LASER'].includes(p.step_id))
      s.steps.splice(3,0,spot,step(id,4,'HERO_CORRECTIVE',{settings_note:'Use the approved clinician preset.'}))
      s.primary_strategy[0].selected_step_id=id
    }
    const result=check(d)
    assert.equal(result.error,undefined,id)
    const steps=result.treatment_plan.treatments[0].steps
    const lo=steps.findIndex(p=>p.step_id==='PEEL.SPOT.SALI'),hi=steps.findIndex(p=>p.step_id===id)
    assert.ok(!steps.slice(lo+1,hi).some(p=>p.step_id==='COOL.ICE'))
  }
})
test('repair fixes the missing primary strategy without adding spot-specific cooling',async()=>{
  const bad=spotLipFixture(false)
  const s=bad.treatment_plan.treatments[0];s.primary_strategy=[]
  s.steps.find(p=>p.step_id==='ENERGY.CARBON.APPLY').role='SECONDARY_CORRECTIVE'
  let calls=0
  const result=await pipeline.generateTreatmentPlan({...args,diagnosis:spotLipDiagnosis,callModel:async(request)=>{
    calls++
    if(calls===1) return bad // A legacy gateway supplies an unwrapped draft.
    const repair=JSON.parse(request.input)
    assert.deepEqual(repair.patient_input.planning_contract.required_primary_concerns,[concern])
    assert.ok(!repair.validation_errors.some(e=>e.includes('cool between spot')))
    assert.ok(repair.validation_errors.some(e=>e.includes('"'+concern+'" has no strategy')))
    assert.ok(!repair.validation_errors.some(e=>e.includes('carbon application is PREP')))
    return envelope(spotLipFixture(false))
  }})
  assert.equal(result.error,undefined);assert.equal(calls,2)
  assert.equal(result.treatment_plan.total_time,'44 minutes')
})
test('spot creates no cooling requirement but cannot displace immediate post-Carbon cooling',()=>{
  const d=draft();d.treatment_plan.treatments[0].steps.splice(5,0,step('PEEL.SPOT.SALI',2,'ADJUNCT',{zones:['chin'],additional_products:['Sali DS Peel']}))
  invalid(d,/Ice Probe cooling must immediately follow this energy step/)
  const modelInput=JSON.parse(pipeline.buildTreatmentModelRequest({systemPrompt:args.systemPrompt,constraints,plannerInput:input}).input)
  assert.equal(modelInput.planning_contract.spot_q_switch_sequence_rule,undefined)
  assert.match(modelInput.planning_contract.spot_salicylic_cooling_rule,/does not require cooling/)
  assert.match(constraints.clinical_constraints.mother_document_compatibility.spot_salicylic_cooling_policy,/no mandatory cooling/)
})
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

test('documented legacy parameter input is normalised without empty primaries or score changes',async()=>{
  const row={parameter:concern,current_score:70.235,target_score:61.917,score_polarity:'higher_is_worse',comparison_mode:'direct_numeric',is_primary_concern:'true'}
  const shapes=[[row],{parameters_with_abnormal_scores:[row]},{treatable_concerns_summary:{parameters_with_abnormal_scores:[row]}},{treatable_concerns:{parameters_with_abnormal_scores:[row]}}]
  for(const selection of shapes) {
    const original=clone(selection);let calls=0
    const result=await pipeline.generateTreatmentPlan({...args,selectedConcerns:selection,callModel:async(request)=>{
      calls++
      const sent=JSON.parse(request.input),normal=sent.treatable_concerns.parameters_with_abnormal_scores[0]
      assert.equal(normal.parameter_name,concern);assert.equal(normal.parameter,concern)
      assert.equal(normal.current_score,70.235);assert.equal(normal.target_score,61.917)
      assert.deepEqual(sent.planning_contract.required_primary_concerns,[concern])
      return envelope()
    }})
    assert.equal(result.error,undefined);assert.equal(calls,1)
    assert.deepEqual(selection,original)
    assert.equal(result.treatment_plan.treatments[0].concerns_addressed[0].current_value,70.235)
  }
})
test('schema and validator share alias/key resolution and never derive a concern from its score',()=>{
  for(const row of [
    {parameter:concern,is_primary_concern:true},
    {parameter_name:' ',parameter:concern,is_primary_concern:true},
    {parameter_name:null,parameter:'superficial_pigmentation',is_primary_concern:true},
  ]) {
    const raw={...clone(input),treatable_concerns:{parameters_with_abnormal_scores:[null,{parameter_name:'',is_primary_concern:false},row]}}
    assert.deepEqual(rules.buildTreatmentConcernContract(raw).required_primary_concerns,[concern])
    const format=rules.buildTreatmentGenerationResponseFormat('express',raw)
    assert.deepEqual(format.schema.properties.planning_result.anyOf[0].properties.treatment_plan.properties.treatments.items.properties.primary_strategy.items.properties.concern.enum,[concern])
    const result=rules.validateClinicTreatmentPlan(rules.finalizeTreatmentPlan(draft(),raw),raw.clinic_treatment_context,'express',constraints,raw)
    assert.equal(result.error,undefined)
  }
  const named=rules.normalizeTreatmentConcernRows([{parameter:'Explicit source concern',current_score:70.235,is_primary_concern:true}],diagnosis.diagnosis_report)
  assert.equal(named[0].parameter_name,'Explicit source concern')
})
test('an actually unnamed primary is a caller-input error before API work, never silently dropped or repaired',async()=>{
  for(const row of [
    {is_primary_concern:true,current_score:70.235},
    {parameter_name:'',is_primary_concern:true},
    {parameter:'   ',is_primary_concern:'true'},
  ]) {
    let calls=0
    const result=await pipeline.generateTreatmentPlan({...args,selectedConcerns:[row],callModel:async()=>{calls++;return envelope()}})
    assert.equal(result.error.code,'treatment_input_contract_violation');assert.equal(calls,0)
    assert.match(result.error.details[0],/parameters_with_abnormal_scores\[0\]/)
    assert.ok(!result.error.message.includes('selected primary concern "" has no strategy'))
    const raw={...clone(input),treatable_concerns:{parameters_with_abnormal_scores:[row]}}
    const validated=rules.validateClinicTreatmentPlan(rules.finalizeTreatmentPlan(draft(),input),raw.clinic_treatment_context,'express',constraints,raw)
    assert.equal(validated.error.code,'treatment_input_contract_violation')
  }
})
function productDraft(products=[],equipment=null) {
  const d=draft()
  d.treatment_plan.treatments[0].steps.splice(1,0,step('PEEL.SPOT.SALI',2,'ADJUNCT',{zones:['chin'],additional_products:products,...(equipment===null?{}:{ingredients_equipments:equipment})}))
  return d
}
test('spot schema requires exactly one approved in-stock product in the intended field',()=>{
  const schema=rules.buildTreatmentGenerationResponseFormat('express',input).schema.properties.planning_result.anyOf[0].properties.treatment_plan.properties.treatments.items.properties.steps.items.anyOf
  const spot=schema.find(s=>s.properties.step_id.enum.includes('PEEL.SPOT.SALI'))
  assert.equal(spot.properties.additional_products.minItems,1);assert.equal(spot.properties.additional_products.maxItems,1)
  assert.deepEqual(spot.properties.additional_products.items.enum,input.planning_contract.spot_sali_product_options)
  const reduced=clone(constraints);reduced.availableResources.chemicalPeels=reduced.availableResources.chemicalPeels.filter(p=>p.name!=='Sali DS Peel')
  assert.ok(!rules.approvedSpotSaliProducts(reduced).includes('Sali DS Peel'))
  for(const products of [[],['Salicylic acid'],['Sali DS Peel','Salicylic Acid 30% Peel']]) {
    assert.throws(()=>rules.unpackTreatmentPlannerResponse(envelope(productDraft(products)),'express',input),e=>e.code==='treatment_output_contract_violation')
  }
  assert.doesNotThrow(()=>rules.unpackTreatmentPlannerResponse(envelope(productDraft(['Sali DS Peel'])),'express',input))
})
test('explicit approved product in legacy equipment is copied, with no strength or prose guessing',()=>{
  const legacy=productDraft([],['Sali DS Peel']),original=clone(legacy)
  const result=check(legacy);assert.equal(result.error,undefined)
  assert.deepEqual(result.treatment_plan.treatments[0].steps[1].additional_products,['Sali DS Peel'])
  assert.equal(result.treatment_plan.total_time,'45 minutes');assert.deepEqual(legacy,original)
  for(const equipment of [[],['Salicylic acid'],['Sali DS Peel','Salicylic Acid 30% Peel']]) {
    const d=productDraft([],equipment);d.treatment_plan.treatments[0].steps[1].how_to_do='Use Sali DS Peel under its approved protocol.'
    const final=rules.finalizeTreatmentPlan(d,input)
    assert.deepEqual(final.treatment_plan.treatments[0].steps[1].additional_products,[])
    assert.match(rules.validateClinicTreatmentPlan(final,input.clinic_treatment_context,'express',constraints,input).error.details.join('\n'),/in additional_products.*Choose exactly one/)
  }
})
test('reported product-plus-empty-primary failure becomes one product repair with the legacy input shape',async()=>{
  const legacySelection=[{parameter:concern,current_score:70.235,target_score:61.917,is_primary_concern:true}]
  let calls=0
  const result=await pipeline.generateTreatmentPlan({...args,selectedConcerns:legacySelection,callModel:async(request)=>{
    calls++
    if(calls===1)return productDraft() // Actual integrations may unwrap the model draft.
    const repair=JSON.parse(request.input)
    assert.deepEqual(repair.patient_input.planning_contract.required_primary_concerns,[concern])
    assert.ok(repair.validation_errors.every(e=>!e.includes('primary concern ""')))
    assert.ok(repair.validation_errors.some(e=>e.includes('in additional_products')))
    assert.ok(repair.patient_input.planning_contract.spot_sali_product_options.includes('Sali DS Peel'))
    return envelope(productDraft(['Sali DS Peel']))
  }})
  assert.equal(result.error,undefined);assert.equal(calls,2)
  assert.equal(result.treatment_plan.total_time,'45 minutes')
})
test('legacy selection plus an explicitly named spot product completes in one call',async()=>{
  let calls=0
  const result=await pipeline.generateTreatmentPlan({...args,selectedConcerns:[{parameter:concern,is_primary_concern:true}],callModel:async()=>{calls++;return envelope(productDraft(['Sali DS Peel']))}})
  assert.equal(result.error,undefined);assert.equal(calls,1)
  const session=result.treatment_plan.treatments[0]
  assert.equal(session.steps[1].role,'ADJUNCT')
  assert.equal(session.steps.filter(s=>s.step_id==='MASSAGE.LYMPH').length,1)
  assert.equal(session.steps.filter(s=>s.step_id==='COOL.ICE').length,2)
})

test('v5.5 preserves disabled application timeouts and validates a delayed successful result', async () => {
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

test('external validator results are finalised before the second clinic check', async () => {
  let calls = 0
  const result = await pipeline.generateTreatmentPlan({ ...args,
    callModel: async () => { calls++; return envelope() },
    existingClinicalValidator: async (plan) => {
      const changed = clone(plan)
      const steps = changed.treatment_plan.treatments[0].steps
      steps.find(step => step.step_id === 'ENERGY.CARBON.APPLY').role = 'HERO_CORRECTIVE'
      steps.find(step => step.step_id === 'FINISH.SMS').role = 'SUPPORT'
      return changed
    },
  })
  assert.equal(result.error, undefined)
  assert.equal(calls, 1)
  const steps = result.treatment_plan.treatments[0].steps
  assert.equal(steps.find(step => step.step_id === 'ENERGY.CARBON.APPLY').role, 'PREP')
  assert.equal(steps.find(step => step.step_id === 'FINISH.SMS').role, 'FINISH')
})
