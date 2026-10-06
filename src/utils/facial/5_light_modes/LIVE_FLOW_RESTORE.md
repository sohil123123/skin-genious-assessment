# Original live treatment flow restored — 2026-10-06

The active five-light treatment path is `callApiForTreatmentPlan` in
`src/pages/IndexPage.vue`, using the existing `useOpenAI.runResponse` transport.
The prompt and constraints are byte-for-byte copies of `treatmentPrompt-live.js`
and `constraints-live.json` from `AI_Aesthetics_Live_Mother_Update`.

The request uses the original system/user message layout, full constraints,
patient history, feature packet and selected concerns. It also supplies the
complete existing raw diagnosis and genuine client-facing lip/periocular scores
through the unchanged application score-display conversion. No diagnosis or
target is rescored. `full` is normalized to the live prompt's `multiple` type.

The response is the original `treatment_plan` object, with complete treatments,
preparations, concerns, steps, timing and omission explanations. JSON object
parsing and basic response integrity remain; there is no appended v5.6 schema,
clinical validator, catalogue projection, model-generated overview contract,
planning_result envelope or automatic correction pass. The full course returns
to the supplied live prompt's minimum five sessions rather than v5.6's two
detailed sessions plus a reassessment outline.

The original code's treatment default `gpt-5.2` is restored, with
`VITE_OPENAI_MODEL` taking precedence when configured. No reasoning effort,
service tier or output-token ceiling is forced by the five-light caller.
Scoring and the six-light caller retain their existing settings and behavior.

Treatment transport explicitly disables timeouts and retries. Its existing
`facial_treatment_v5` gateway stage is retained solely for compatibility with
the deployed timeout-free gateway handling; pipeline_version identifies this
restored flow. `useOpenAI` now preserves an explicit zero timeout instead of
replacing it with its default. Other calls retain their existing timeout defaults.

Existing error logging, sequential step numbering, actual duration totals,
selected-plan persistence and database-ID confirmation before UI advancement
remain. The five-light display shows the original preparation/concern/step
sections; overview/expectation/continuity/signature cards and the v5.6 outline
are hidden for five-light plans. Existing saved data is not deleted.

The v5.6 helper modules remain on disk as inactive historical code; they are no
longer imported by the five-light prompt loader. Their historical tests use
the captured `tests/fixtures/v5_6_constraints.json`. Active request, response,
transport and persistence behavior is covered by `treatmentLiveFlow.test.mjs`.

No live model request or sub-90-second latency benchmark is claimed. Measure
the same single/express cases after rollout using `[facial-treatment-live]`
elapsed logs and returned token usage. Multiple plans now generate more detailed
sessions and can take longer than single-session plans.
