# Treatment upgrade v5.5 integration

Installed from AI_Aesthetics_Treatment_Upgrade_v5_5 on 2026-10-05.

- Updated treatmentClinicRules.js, treatmentPipeline.js and
  treatment/treatmentPrompt.js together. Constraints, knowledge and eligibility
  match the supplied bundle and remain unchanged from v5.4.
- Normalise both parameter and parameter_name concern fields using supplied
  diagnosis identities. Preserve source scores, targets, flags and objects;
  unnamed primaries fail with treatment_input_contract_violation before any call.
- Spot salicylic steps must select exactly one approved stocked product in
  additional_products. Recover only a single product explicitly declared in the
  legacy structured equipment field; never guess a product or concentration.
- Generate with facial_treatment_result_v5_5 and the v5.5 input/product cache key.
  The saved-plan layout and JSON database persistence remain unchanged.
- Keep the v5.4 spot-cooling correction, mandatory massage, independently
  required cooling, fixed roles and local finalisation before validation.
- Preserve disabled application timeouts (deadlineMs and initialCallMs zero),
  saved-session ID checks and detailed initial/repair/generation/save logging.
  An input contract error cannot trigger a model repair.
- Helpers stay isolated under 5_light_modes. Shared six-light helpers and
  home-care prompts remain unchanged.
- Verify with treatmentUpgrade, treatmentIntegration and treatmentPersistence
  Node suites, targeted ESLint and npm run build. Fixtures include the real
  score-display module; they do not establish live API latency or outcomes.
