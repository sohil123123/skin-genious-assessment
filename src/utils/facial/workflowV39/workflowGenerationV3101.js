import { SESSION_WINDOWS_V39, STEP_RULES_V39, normalizeWorkflowPlanV392, validateWorkflowPlanV39 } from './workflowContractV39.js'

// One initial call plus at most one correction. No recursive regeneration,
// silent duration clamping, or bypass of the existing save-time validator.
export async function generateValidatedWorkflowV3101({generate,input,mode,concerns=[],context={}}) {
 const window=SESSION_WINDOWS_V39[mode]
 if(!window)return {error:{message:'Unknown treatment plan type.'}}
 const timing=`AUTHORITATIVE RUNTIME TIMING: ${mode} requires ${window[0]}–${window[1]} minutes per session. This overrides older product-window wording. Step limits: ${JSON.stringify(STEP_RULES_V39)}. Lymphatic drainage must remain within its catalogue range; never use it as unlimited time padding. Calculate the sum of the actual numeric step durations. Keep all scripts and instructions consistent with the selected durations. Choose clinically appropriate steps within the supplied contraindications; do not add treatment only to fill time. Return the existing full treatment_plan JSON or an error if no suitable plan fits.`
 const initial=[...input,{role:'system',content:[{type:'input_text',text:timing}]}]
 let raw=await generate(initial)
 for(let attempt=0;attempt<2;attempt++) {
  if(raw?.error)return raw
  const result=normalizeWorkflowPlanV392(raw,mode)
  const check=validateWorkflowPlanV39(result,mode,concerns,context)
  if(check.valid){result.workflow_v39={mode,selected_concerns:concerns,course_context:context};return result}
  if(attempt===1)return {error:{message:'Treatment plan needs correction after one repair attempt: '+check.errors.join(' '),validation_errors:check.errors}}
  const arithmetic=(result?.treatment_plan?.treatments??[]).map(s=>({session_number:s.session_number,actual_step_sum:s.steps?.reduce((sum,x)=>sum+(typeof x.duration==='number'?x.duration:NaN),0),steps:s.steps?.map(x=>({modality_id:x.modality_id,duration:x.duration,allowed:STEP_RULES_V39[x.modality_id]}))}))
  raw=await generate([...initial,{role:'user',content:[{type:'input_text',text:JSON.stringify({task:'Correct this rejected draft once. Return a complete replacement treatment_plan, not a patch. Respect all original patient constraints, primary selections and course context. Fix the listed errors and recalculate all totals. Do not relax limits or promise outcomes to make the draft pass.',validation_errors:check.errors,timing_audit:arithmetic,rejected_draft:result})}]}])
 }
}
