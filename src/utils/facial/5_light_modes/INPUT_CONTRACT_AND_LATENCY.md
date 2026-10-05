# Evidence contract and latency changes — v5.6

This release implements the proxy fix and suggestions **2, 4, 5 and 6**. GPT-5.4 reasoning remains **medium**. Every `how_to_do` procedure instruction remains model-generated. No new clinical permission, contraindication, dose, score formula or modality-strength rating is introduced.

## Why the values were missed

The v5.5 eligibility reader inspected a barrier diagnosis row and its `backend_details`. It did not inspect the `featurePacket` option, even though the input builder put that same packet into `feature_evidence`. In the supplied request, the diagnosis row lacked those backend fields and the measurements instead lived at `feature_evidence.proxies.combined_barrier_sensitivity`. The reader therefore emitted nulls and a misleading missing-fields list. This was a deterministic adapter omission before model reasoning.

`treatmentEvidence.js` now resolves exact known source paths once. `buildTreatmentPlannerInput` uses the resolved values for clearance and observed acne visibility. `compileTreatmentPlannerInput` checks that clearance agrees with the original raw sources before the API request. A stale, inconsistent summary produces an actionable `treatment_input_contract_violation`; it is not sent for a model repair.

| Measurement in the supplied case | Resolved value | Source |
|---|---:|---|
| Erythema intensity | 0.2 | `feature_evidence.proxies.combined_barrier_sensitivity.erythema_intensity_index` |
| Barrier uniformity | 0.7 | `feature_evidence.proxies.combined_barrier_sensitivity.barrier_uniformity_index` |
| Flaking texture | 0.1 | `feature_evidence.proxies.combined_barrier_sensitivity.flaking_texture_index` |
| Hydration signal | 0.55 | `feature_evidence.proxies.combined_barrier_sensitivity.hydration_signal_index` |
| BSI continuous | null | No actual named raw BSI measurement was supplied |

Valid diagnosis raw values retain their existing authority. Feature-packet proxies fill gaps, followed by exact named supporting signals. Null, invalid/out-of-range values and numeric strings do not mask a valid fallback. Zero is a valid value. Source disagreements are recorded with both paths and values; an alternate observation is not silently substituted for the authoritative diagnosis measurement.

Neither the 1–100 client/engine score, `normalized_burden_0_to_1`, nor the feature diagnosis's `score_0_1` is used as `BSI_continuous`. In this case the corrected missing list is **only BSI_continuous**. The existing rule still classifies energy as `allowed_with_caution` because BSI is genuinely missing. The existing five denial thresholds and required-proxy caution trigger are unchanged. Newly recovered measurements now participate in those existing gates.

## 2 — Only material alternative explanations

The generation schema requests `relevant_alternatives`, an array of `{session_number, step_id, reason}`. An empty array is valid when the session comparison already covers the material decision. The model is no longer required to write the eleven-category `modality_omission_explanation` object.

After generation, `finalizeTreatmentPlan` derives the existing frontend object from the actual selected steps and any supplied alternative reasons. Included steps and durations come from the plan, not a new model explanation. For an unselected category with no supplied reason, it says no material alternative comparison was reported; it does not invent a clinical contraindication or pretend the category was reviewed. Alternatives must refer to real detailed sessions and registered unselected steps. Different course sessions are summarized separately.

The API draft and final UI object deliberately differ. Never display or save the raw API draft as the completed plan; unpack, finalize and validate first. The legacy final frontend schema is preserved.

## 4 — One explanation of each decision

The prompt asks for one session rationale and one meaningful combination comparison. Primary mappings retain their exact concern names, actual selected step and distinctive contribution, with shorter driver/winner explanations. Step `order_reason` explains only placement. Patient scripts, settings notes and preparation bullets have concise roles rather than repeating the session rationale.

Word counts are guidance, not validation failures. Necessary screening, exact products, local adaptations, delivery/removal and stopping criteria remain required. Procedure instructions are still generated. No `max_output_tokens` ceiling is reduced to force a shorter or potentially truncated answer.

## 5 — One patient packet and a compact reference

The local input retains the full original report and selected-concern rows for scoring, finalization and validation. A separate non-mutating API projection merges exact targets and client-primary flags into the canonical diagnostic rows. It removes the duplicate selection report, duplicate client summaries and repeated polarity-explanation text.

Feature diagnosis labels, grades and confidence are attached to their matching diagnostic rows. Supporting signals already present in the same feature family are represented once; unique signals and unfamiliar assessments are retained. Scan quality, uncertainty, estimated-field lists, raw proxies, region maps, causes, history and prior-visit evidence are preserved. Feature finding priorities are removed because client-selected flags define treatment priority.

Resolved safety numbers have one model-facing location: `clinic_treatment_context.clinical_clearance.numeric_proxy_values`, accompanied by their actual source paths. Removing their duplicate occurrences from the API projection does not remove or alter the stored measurements.

The complete mother data remains in `treatmentKnowledge.js`. Global guidance and modalities use compact stable tables; full concern maps follow in `mother_case_reference` for every supplied concern, including secondary concerns. An unfamiliar identity falls back to the full reference. **The supplied case still receives all 15 maps**, with all original patterns and 0–5 strengths. Worked recipe examples remain in the source but are excluded from the request; they are not additional binding decision factors. No shortlist-size cap, score/confidence pruning or new modality exclusion is applied.

`verification.json` compares request characters for the same case and captured six-product TOON block. Patient evidence is smaller, but adding case maps to the input shifts some reference text out of the stable prefix. The total character reduction is modest. No live token reduction, speed improvement or under-90-second completion rate is claimed from character counts.

## 6 — Cache reuse with actual measurement

The static instructions, global reference and constraint JSON are deterministic. Product/resource ordering and object keys are normalized without changing the inventory or ranking arrays. Case-specific schema enum sets are sorted without changing their values or exact primary-count guards.

The cache key contains a fingerprint of the static prefix, model/reasoning setting and schema. Patient identity, scores and regional map values are not part of that fingerprint. Requests with the same prefix and schema can share a cache group. Different primary selections may require different schemas and thus different groups; exact-case validation is retained.

GPT-5.4 requests use `prompt_cache_retention: "24h"`. Configuration supports `in_memory` or null for the existing API default. The actual gateway must forward `prompt_cache_key` and `prompt_cache_retention`. A key and retention setting do not guarantee a hit, especially on the first request after a revision.

`onMetrics` reports per-call elapsed time, actual input/cached/output/reasoning tokens and cache-hit ratio. It does not log patient text. Compare the first and subsequent requests in the same group; inspect returned `cached_tokens`, not merely the presence of a key. No warm-up API call or extra catalogue review is added.

## Live timing boundary

The supplied successful response took 203 seconds, with 36,932 input tokens, zero cached tokens and 8,749 reasoning tokens. This release retains medium reasoning at the user's request. It targets repeated input/reporting work first; the hidden-reasoning latency remains a live measurement question.

The existing adapter's first-call timeout remains 65 seconds and total deadline 85 seconds, with at most one content repair inside that original budget. The observed `timeout_ms: 0` and 203-second success mean this boundary was not governing the returned live result. The actual controller was not supplied, so its integration cannot be verified here. Forward SDK/cURL timeouts and cancellation through the server gateway; a client timer or an added request-body field alone is insufficient. A timeout bounds failure; it does not ensure a complete valid plan within 90 seconds.

Official references: [Prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching), [latency optimization](https://developers.openai.com/api/docs/guides/latency-optimization), [GPT-5.4](https://developers.openai.com/api/docs/models/gpt-5.4).
