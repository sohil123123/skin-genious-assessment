# Mother document coverage in treatment planning

This package uses the supplied **Mother Document v1.3** as runtime knowledge, with binding permissions/timings in constraints and local code. It does not merely tell GPT-5.4 that a mother document exists. The system prompt includes the compiled knowledge on each planning request.

In v5.5 the model continues to use these maps to select leading case-relevant choices instead of performing an exhaustive modality audit. All reference content remains available. The selection factors guide that decision without a per-modality score matrix or repetitive rejection report; selected steps still undergo local rule validation. Intrinsic step roles are derived locally and concern names/counts are bounded to the actual case. Selected inputs using the documented legacy parameter field are normalised consistently with parameter_name, and spot salicylic requires an explicit approved stocked product in additional_products without a local concentration default. The user-confirmed 5 October 2026 correction supersedes the earlier spot-to-Q-switch cooling requirement: the lesion-only spot adjunct creates no mandatory cooling after it or between it and Carbon/Q-switch. Independently required post-energy and actual broad-peel-plus-Carbon cooling remain. Source effect ratings, other modality permissions and fixed clinical doses are unchanged.

| Mother-document content | Runtime location and treatment use |
|---|---|
| Purpose, precedence, case-specific design, six decision factors | treatmentPrompt.js; maximises justified results through focused phenotype/zone selection, without a fixed treatment template or exhaustive candidate grading |
| Unchanged 0–5 effect strengths, burden and evidence definitions | treatmentKnowledge.js; these remain treatment-effect strengths, not relabelled selection priorities |
| Sections 1.1–1.6: stocked steps, mechanisms, effects, actives, depth, timing references and notes | 49 registered atomic steps in treatmentKnowledge.js; Carbon is split into application/laser and needling into pen/roller; crystal microdermabrasion and diode remain outside this facial engine |
| Section 1.3: peel potency ladder versus depth class | treatmentKnowledge.js and constraints.json; Combination is superficial and its corrective ratings remain unchanged |
| Section 1.7: product/finish guidance | finishing_reference plus the supplied actual approved product records; source AM/PM suggestions are context, not immediate post-procedure finishing permission; home-care output stays separate |
| Section 1.8: complete windows and actual fixed step times | treatmentClinicRules.js; one mandatory 5–10-minute massage is reserved, with local step sums and locally derived total_time |
| Section 2: all 15 concern maps and their backend drivers | concern_maps in treatmentKnowledge.js; skin type, barrier/sensitivity, acne, sebum, redness, hydration, glow, pigment, peri-orbital, lips, texture/pores, wrinkles, jawline, firmness and textural radiance |
| Section 3: reverse step-to-concern index | Equivalent information is available through step mechanisms/strengths and the concern maps; the duplicate table is not appended a second time |
| Section 4.1: seven non-negotiable compatibility/sequence rules | mother_document_compatibility in constraints.json, treatmentPrompt.js and local sequencing checks; existing patient history/proxy/temperature gates still take precedence |
| Section 4.2: clinical sequencing advice | sequencing_advice plus step notes; considered as advice, with approved protocol and actual case evidence; older optional massage omission wording is superseded as described below |
| Section 5: incompatible/redundant pairs and pairing freedom | constraints.json and local checks; medium peel plus Q-switch and medium peel plus microdermabrasion are prohibited; microdermabrasion plus Q-switch/Carbon remains permitted when the case is cleared |
| Section 6: combination playbook | 11 combination_reasoning_examples; reasoning is included, example sequences are not copied as recipes or used to omit required care |
| Section 7: realistic single-session changes and limits | expected_single_session_changes and expectation_card; supplied raw engine targets are preserved, with no invented target scores |
| Section 8: Jaipur/population context | population_context_guidance plus supplied history and regional findings; no sun exposure, disease, acne phenotype, sex-specific pattern or seasonal condition is inferred from residence alone |
| Section 9: clinician configuration/ratification items | pending_protocol_details and therapist preparation/settings notes; missing approved device/product settings are flagged rather than fabricated, and advisory durations do not become new hard doses |
| Section 10: machine-readable summary | Incorporated through the depth classes, non-negotiables, timing contract, recovery_reference, pairing permissions and melasma-toning decision guidance |

## Confirmed correction to the older massage wording

On 3 October 2026 the user clarified that **every detailed session must contain lymphatic drainage for a minimum of five minutes**, retaining the existing ten-minute maximum. This is now explicit in constraints, prompt, reference notes and validator. It overrides older optional/filler language and blanket reference advice to omit massage. Minimal puffiness or an already adequate other-step total does not remove the requirement.

Existing approved technique, zone precautions and actual evaluated clinical hard stops still apply. A genuine hard stop prevents a successful plan and uses the explicit blocked contract; it does not produce a success response with empty sessions or omit the required massage.

## What this verification establishes

The source tables are checked against the compiled module for all 15 maps, unchanged step effect strengths, unchanged 0–5 scale, expected-change references, finishing guidance and combination reasoning. The generated static prompt is checked to include the runtime knowledge. Executable regression tests check the mandatory massage, session/step output counts, separate failure handling and locally derived totals alongside the earlier compatibility, route, timing and score-provenance checks.

These checks establish file/content coverage and offline code behaviour. They do not establish that every live model response will make the best clinical selection or that the running application is already connected. Satish must install the coupled files and the generation/unpacking contract in INSTALL_AND_CHANGES.md; actual clinic cases and latency still need a live run.
