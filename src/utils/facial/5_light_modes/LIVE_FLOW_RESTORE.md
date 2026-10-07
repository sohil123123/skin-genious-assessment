# Live mother prompt with clinical validation and repair

The active five-light caller uses treatmentPipeline.js through getFacialPrompts.
The supplied treatmentPrompt-live.js and constraints-live.json remain unchanged
in their installed locations (checkout line endings may differ).

The earlier direct request bypassed this pipeline. Matching those two files alone
does not run JavaScript validation. The reconnected runtime appends an output
adapter and strict schema so the existing five-light clinic validator can check
registered steps, stock, fixed doses, history/proxy/temperature clearance,
pairing, cooling, mandatory massage, ocular and lip rules, and primary linkage.
Its structured fields support validation and the restored detailed session view;
the supplied mother selection/ranking/reference data stays in the system prompt.

Every completed draft is finalized and checked locally. A valid draft uses one
model call. A complete parseable draft with clinical violations gets exactly one
targeted correction request containing the invalid draft and all validation
errors. The correction is checked again. Remaining violations return an error
and cannot be saved. Empty/truncated output, refusals and HTTP failures do not
trigger a blind retry. Error logs retain initial and repair diagnostics.

Live mother courses retain at least five detailed sessions, starting at week 1,
rather than the historical v5.6 two-session-plus-outline format. Single/express
still has one session. Other v5.6 tests keep their original contract explicitly.
The clinic's 60-75/35-45 windows and 65/40 targets remain. Save helpers still
require all expected database session IDs before advancing the UI.

GPT-5.4 medium is restored for treatment generation; scoring and six-light code
are unchanged. Application timeouts and transport retries stay disabled. The
mother document is not appended twice, no catalogue ledger is generated, and
there is at most one repair. Console metrics separate preparation, validation,
initial/repair gateway time, usage and actual cache hits. A repair adds another
model round trip; five-session courses generate more text than single sessions.
No live latency or clinical-quality benchmark is claimed.
