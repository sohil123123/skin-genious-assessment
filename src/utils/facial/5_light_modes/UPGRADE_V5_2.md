# Installed v5.2 integration

The coupled prompt, constraints, knowledge, eligibility, clinic rules and planner
are installed inside `5_light_modes`. The adjacent product module and shared
score-display module are reused. The 6-light generation path keeps its existing
helpers and prompt.

The caller uses `generateTreatmentPlan`, which accepts the new `planning_result`
envelope, unpacks success, validates it and returns the existing saved-plan shape.
Blocked and incomplete output contracts are errors; neither is saved or repaired.
Every detailed facial requires exactly one 5–10 minute mandatory lymphatic
drainage step. Total time comes from actual steps, including this mandatory care.
Candidate reference tables remain on disk but are excluded from model requests.

Application overrides retained from the user's prior instructions:
- `deadlineMs: 0` and `initialCallMs: 0` disable automatic application timeouts.
  Explicit positive deadlines remain supported; the PHP gateway accepts zero.
- All initial, repair, contract and transport errors are logged, including the
  original validation error if a repair fails.
- Plans are saved as JSON with their selected plan type. The UI advances after
  the API confirms database session IDs. Rendering and reload metadata remain
  compatible with the final `{ treatment_plan }` shape.

Checks: `node --test tests/treatmentUpgrade.test.mjs
tests/treatmentIntegration.test.mjs tests/treatmentPersistence.test.mjs`;
targeted ESLint; `npm run build`; backend treatment persistence/integration tests.
No live model latency or clinical outcome claim is made.
