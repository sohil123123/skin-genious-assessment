# Treatment upgrade v5.4 integration

Installed from AI_Aesthetics_Treatment_Upgrade_v5_4 on 2026-10-05.

- Updated the four runtime files together: treatment/constraints.json,
  treatmentClinicRules.js, treatment/treatmentPrompt.js, treatmentPipeline.js.
  Knowledge and eligibility match the supplied package and remain unchanged.
- Spot salicylic is an uncounted ADJUNCT; its presence does not require cooling
  after it or before Carbon, toning, 532 or lip passes. Independent immediate
  post-energy cooling and broad-peel-plus-Carbon preparation/cooling still apply.
- Bind the request schema and response unpacking to the exact planner input.
  Finalise fixed roles before every local clinic check, including a returned
  application-validator result. Preserve exact concern names and strategy links.
- Helpers stay isolated under 5_light_modes; prompt imports resolve to those
  helpers. The shared six-light helpers and home-care prompts remain unchanged.
- Preserve user-requested disabled application timeouts (deadlineMs and
  initialCallMs are zero), JSON database persistence and saved-session ID checks,
  and console diagnostics for initial/repair/generation/save failures.
- Use the v5.4 cache key; facial_treatment_result_v5_3 is intentionally retained
  because the generation envelope shape is unchanged.
- Run tests/treatmentUpgrade.test.mjs, treatmentIntegration.test.mjs and
  treatmentPersistence.test.mjs, targeted ESLint, and npm run build.
  Offline checks do not establish live API latency or clinical outcomes.
