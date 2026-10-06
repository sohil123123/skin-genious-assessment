# Live mother update integration — 2026-10-06

> Superseded by [LIVE_FLOW_RESTORE.md](./LIVE_FLOW_RESTORE.md). The active
> five-light flow now uses the complete supplied live prompt and constraints
> with the original request/response format. The notes below describe the
> previous v5.6 integration, retained as historical context.

Source: AI_Aesthetics_Live_Mother_Update/CHANGES.patch and INSTALL.txt. The folder
does not contain CHANGES.diff. Its source baseline predates the installed v5.6
pipeline, so the clinical amendments are integrated into the existing flow.

Adopted all 33 reference sections and 27 tables with unchanged strengths, all 15
concern maps, timings, selected rules and exclusions. Known case maps stay in the
case reference; other live sections remain in the stable reference. Stored stock,
patient history, numeric energy and temperature policies are preserved.

Targets are 65 minutes for single/course and 40 for express within existing
windows, with no padding or exact-target rejection. Periocular customer-display
score <=70 requires one two-minute ocular infusion; explicit display scores take
precedence and raw severity uses the existing display mapping. No B16 gate is
introduced. Lip display <70 retains its visibility/history/product safeguards.

Acne restrictions are lesion-local; mandatory drainage uses non-lesion pathways.
Red LED barrier recovery uses the selected B18 exception but pregnancy blocks
remain. Known raw B6 hydration and B7 structural-barrier gates and the B13 teen
restriction supplement existing clearance. Other categorical/region rules are
passed intact to the planner and remain subject to actual clinician evidence.

No new B5/B8 thresholds, B19/B20 gates, medium-peel mask ban, target halving,
massage omission or referral field is introduced. Model procedure instructions,
the v5.6 generation/save shape, concise planning, current helpers, disabled
timeouts, error logging and JSON persistence remain intact. Home-care exports,
shared six-light code, scoring formulas and backend logic remain unchanged.

Regression verification covers customer-score boundaries and raw/display
equivalence, mandatory ocular infusion and exclusions, targets, stock and safety
policy preservation, full mother reference coverage, independent cooling,
clearance exceptions and existing treatment persistence. No live API latency
or patient outcome benchmark is claimed.
