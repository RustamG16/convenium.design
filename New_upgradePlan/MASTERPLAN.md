# Convenium.Design — output quality first

> **2026-09-15 product decision:** [PRODUCT-ARCHITECTURE.md](PRODUCT-ARCHITECTURE.md) now defines the approved product center and prototype. Oracle-led intake, Projects/Plan, Playground and Results are primary. Atlas/Node Control is an advanced System surface, not the default experience. [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md) supersedes the delivery order below where they conflict.

Research and plan revision: 2026-09-07. Status: proposal for discussion, not implementation approval.

## Decision in one paragraph

Keep Convenium.Design as a local, artifact-driven design workflow with one director and bounded specialists, and expose it through an Oracle-first product modeled on the task simplicity of Manus. Oracle asks the questions, the director produces an editable master plan, Playground makes routing changes safe and understandable, implementation remains the last gated stage, and Results proves quality. Node Control explains and configures the system for advanced users; it is not the home page. CrewAI remains optional future infrastructure, not a prototype dependency.

This document supersedes conflicting recommendations in the September 3–4 specs. Their historical approvals are recorded history, not authorization to implement now. The current request authorizes research and plan changes. It does not ask for the kickoff prompt's blanket commit or runtime implementation.

## 1. What the evidence actually establishes

See [SAVRA-VERIFICATION.md](SAVRA-VERIFICATION.md) for the source comparison and limits.

- Current `python library/tools/verify.py`: CLEAN, 84 skills / 84 registry records. This validates the implemented checks, not runtime capability parity or design quality.
- The verifier still lacks the proposed host-parity checks. A `hostNote` cannot prove a plugin is installed, usable, or equivalent.
- Savra's private repository was accessible using authenticated GitHub CLI. Its design file and CSS agree on the desktop 25vw display scale. Its run records 93/100 and Gate C pending. Its build plan is clearly an art-direction document.
- An exact originating setup cannot be recovered from the delivered website alone. Host/model settings, loaded skill versions, original prompts and approval history are not established by the files inspected.
- The two-run comparison is an observational case comparison with several variables changing together. It cannot isolate host parity, fresh sessions or typography as the causal explanation for the score difference.
- Convenium.Design Studio currently has a different, explicit doctrine: Workbench v2.1, system sans, dark surfaces and a 32px display size. That may suit dense controls; it does not by itself deliver the editorial character requested here. Any new console design must reconcile that document, not quietly override it in CSS.

Preserve the Savra method: one project-specific thesis, confident hierarchy, exact media assignments, varied compositions, motion tied to the story, and independent review. Do not turn Savra's serif, palette, portals or 25vw title into defaults for every output.

## 2. Why output can still feel generic

These are design and workflow hypotheses, not findings from a new browser audit of Convenium.Design Studio.

1. A capability inventory specifies what can run, not what a particular design should express.
2. Generic inputs produce generic compositions even when every accessibility check passes.
3. Multiple style authorities can compete: taste profile, doctrine, slot presets, agent prompts, skill bodies and project tokens. More prose can worsen that competition.
4. A numeric type ramp is necessary for consistency but insufficient for authorship. Composition, crop, copy, negative space and sequence determine whether it has character.
5. A high self-reported score can conceal missing evidence. Quality needs inspectable screenshots and test results, not only verdict fields.

### The design contract to add

Extend the build-plan template with six compact fields, populated before implementation:

| Field | Required answer |
|---|---|
| Thesis | One sentence connecting audience, product and visual idea |
| Evidence | Three supplied or researched observations that explain the direction |
| Signature | One compositional idea and one purposeful interaction specific to this project |
| Section grammar | Per-section layout, reading order, media/crop and mobile transformation |
| Rejections | Three project-specific patterns to avoid, with reasons; no universal blacklist |
| Proof | A representative desktop frame, mobile frame and critical interaction acceptance criteria |

Apply a substitution review: if another company's name and stock image could replace this project's content without changing the design logic, ask what evidence was lost. This is a human critique prompt, not an objective automated originality score.

Use one taste authority per project. Proposed precedence: explicit brief → approved project direction → committed project design system → relevant doctrine → skill advice. A doctrine is a starting range, not an absolute demand for enormous type regardless of language or screen size. Record and approve exceptions.

Before any external asset generation, inventory what the user can provide: brand files, licensed fonts, original photographs/video, product images and approved factual copy. For Convenium.Design's console, use actual project thumbnails and artifacts first. No generated avatars or decorative particle media are needed for the first slice.

## 3. Closest systems and the CrewAI decision

The closest match depends on the layer; none is a replacement for Convenium.Design's design judgment.

| System | Relevant similarity | Recommendation |
|---|---|---|
| CrewAI | Roles/tasks plus explicit Flows around agent work | Closest conceptual fit; first optional runtime experiment |
| LangGraph | Stateful execution with persistence and human intervention | Consider when complex resumability/control outweighs simplicity |
| Langflow | Visual composition of AI application flows, agents and MCP | Useful if nondevelopers must author workflows; unnecessary for a read-only map |
| AutoGen | Multi-agent conversation and orchestration | Do not select for a new Convenium.Design runtime: official repository says maintenance mode and points to Microsoft Agent Framework |
| Rivet | Visual graphs for building/debugging AI applications | Inspect its execution visibility; not a design-quality engine |
| FLORA / Krea | Creative outputs connected through visible workflows | Closest product/UI references; not proposed as Convenium.Design's backend |

Sources: [CrewAI production architecture](https://docs.crewai.com/en/concepts/production-architecture), [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview), [Langflow](https://docs.langflow.org/), [AutoGen status](https://github.com/microsoft/autogen), [Rivet](https://rivet.ironcladapp.com/), [FLORA](https://flora.ai/), [Krea Nodes](https://www.krea.ai/features/nodes).

### Do you need CrewAI now?

My recommendation: no migration now. The current local, mostly sequential, human-gated workflow already has a host capable of executing tasks. Adding another role system creates duplicate state, permissions, context packaging and debugging responsibilities.

CrewAI becomes useful when a concrete job must continue without an open host conversation, pause/resume after a restart, expose a repeatable service endpoint, or coordinate queued work across projects. Its Flows provide state/persistence and its human-feedback feature supports intervention. That does not automatically make external actions idempotent. [Flows](https://docs.crewai.com/en/concepts/flows), [human feedback](https://docs.crewai.com/en/learn/human-feedback-in-flows).

Prefer **Flow-first**, with a bounded Crew only where agent collaboration adds value. Keep gates and artifact validation in deterministic code. A crew must not decide that missing approval is approval. Framework choice must not alter the approved visual direction.

A future pilot should run a read-only evidence-pack job with the same inputs through native execution and CrewAI. Proposed acceptance: five runs per path; recover from interruption; preserve artifact hashes; no repeated side effects; no gate bypass; inspectable failures; compare completion rate, setup burden, latency, model usage and human repair minutes. Retain it only if it solves a demonstrated operational problem without reducing output quality.

The open-source framework does not supply inference. CrewAI documents model/provider configuration; its model access and any managed platform are separate decisions. Do not assume the existing host subscriptions are drop-in API credentials. Validate a supported authentication/billing path before the pilot. [CrewAI LLM configuration](https://docs.crewai.com/en/concepts/llms), [CrewAI repository](https://github.com/crewAIInc/crewAI).

## 4. Correct the system contracts before expanding

### Capability parity

Replace the proposed prose waiver with structured per-host capability resolution: delivery method, expected path/plugin, version/hash where available, required supporting files, probe result and timestamp. `hostNote` remains explanation only. A required unresolved capability fails preflight; a deliberately optional capability reports its fallback. Studio display entries are not automatically executable capabilities.

Test missing skill body, missing script/reference directory, absent external plugin and mismatched agent projection using isolated fixtures. Do not mutate the user's live registry just to test failure. Do not hard-code today's two failures or thirteen restricted records as timeless acceptance criteria. Derive expectations from a versioned fixture manifest.

### State and approvals

Use one versioned run schema, validated on writes. Migrate Savra-style camelCase explicitly; current templates use snake_case. Never interpret unknown or missing approval as passed. Bind each approval to actor, timestamp, artifact hash and scope. Changing the approved artifact invalidates downstream approval as appropriate.

Separate execution completion, technical verification and client acceptance. Record evidence references for every check; unknown stays null. `phase_counts` is not token usage. Record usage only when the host actually reports it; mark estimates separately. Host-enforced limits and advisory budgets are different capabilities.

Add an append-only run event log and a single state writer. Stable event IDs and per-step attempt IDs support replay and diagnosis. Restart tests must prove duplicate events do not duplicate outputs. Keep the canonical event/state contract independent of Studio and any orchestration vendor.

### Delegation

One director owns direction. Specialists cannot delegate further. At most two independent read-only evidence workers; author and critic remain sequential. Briefs specify objective, allowed files, inputs, output artifact, evidence, stop condition and exclusions. Summaries link to raw evidence; never discard the evidence merely to save context. The director may perform small reads locally when delegation would add overhead.

### Knowledge retrieval

Keep SQLite/FTS5 as the first optional index. It is a cache of canonical files, not a second authority. Preserve CLI/digest operation when the index or Studio is unavailable. Put reusable query logic outside the UI server; the existing MCP server can be an adapter.

Revise Spec 01's three verbs to include host, agency, status and phase filtering. Routing conditions remain judgment after deterministic filtering; FTS does not understand arbitrary prose predicates. Mandatory safety/process rules are loaded directly, never omitted because search ranked them poorly.

Bound the complete serialized response, including paths/metadata, not only excerpt characters. Provide truncation markers and continuation for long sections. Validate paths beneath allowed roots, parameterize queries, and distinguish corpus text from instructions. Add namespaced IDs, schema/index version, stable section IDs, deleted-file cleanup, atomic rebuild, and stale-index detection. Agency labels are classification, not client access control; project-private evidence stays isolated.

Evaluate against at least 30 labeled routing/retrieval tasks including no-match, ambiguity, unsupported host, renamed/deleted files and mandatory rules. Target no loss of required capabilities, bounded results and a measured reduction from a newly captured baseline. The historical 21,992-byte payload is not a fresh token measurement. FTS5 is a reasonable lexical starting point; embeddings require evidence of lexical retrieval failures. [SQLite FTS5](https://www.sqlite.org/fts5.html).

## 5. One editorial node view

The recommended direction is **Convenium.Design Atlas**: an editorial work map. The active project or selected output is the focal object; connected references, decisions, artifacts and review evidence explain how it was made. Roles and tools are metadata revealed on selection, not decorative outer rings.

Keep the screenshot's sense of a navigable system, but abandon equal-sized orbiting icons and the unlabelled particle core. The composition should resemble a curator's annotated working table: deliberate whitespace, large project identity, media thumbnails, compact evidence annotations and a readable selected path.

See the rewritten [SPEC-03-CONSOLE-UI.md](SPEC-03-CONSOLE-UI.md) for the single-surface interaction, proposed numeric design direction and acceptance tests. It is a proposal to reconcile with Studio's existing DESIGN.md before implementation. No UI code changes are part of this research task.

## 6. Quality and reproducibility program

Create a run receipt: Convenium.Design commit, source/project commit, host/version, model/settings if exposed, skill IDs and content hashes, plugin/tool availability, brief/plan/design hashes, media manifest, dependency lockfile, approval provenance and evidence paths. Unknown fields remain unknown. Identical setup reduces drift; stochastic generation still prevents an exact output guarantee.

Build three fixture briefs: Savra-style hospitality with supplied media, a content-heavy B2B service, and a functional dashboard. Start with the same fixture on both hosts, then repeat each configuration three times where budget allows. Use identical inputs and a fixed rubric; blind reviewers to host identity. Report the score distribution, hard failures, time to approval and human repair minutes. Change one workflow variable at a time when testing causality.

Proposed rubric: project specificity 25, hierarchy/composition 20, media/copy 15, interaction/mobile 15, accessibility 15, performance/evidence 10. Initial release target: 85/100 with no critical functional, truthfulness or accessibility defect. These are proposed acceptance thresholds, not measured outcomes. A beautiful page with a broken primary action fails regardless of total score.

Mechanical checks cover tokens, overflow, missing media, semantic structure and runtime errors. Browser inspection covers composition, image-backed contrast, focus, interrupted transitions, real mobile states and reduced motion. Automated tools cannot certify taste or complete accessibility. Keep the independent finish review and two repair-cycle limit; record accepted residual debt.

### Useful tools, ordered by current value

| Tool/feature | Add when | Concrete benefit / limit |
|---|---|---|
| JSON Schema + local validation | First | Gate/state/artifact integrity; adopt a small validator compatible with the existing stack |
| Existing browser harness; Playwright if needed | First quality slice | Repeatable viewport, dialog and reduced-motion checks; screenshots are regression evidence, not aesthetic scores |
| axe-core | QA | Automated accessibility findings; retain keyboard and visual review |
| Lighthouse CI | Before release | Lab performance regression budgets; does not establish field INP |
| SQLite FTS5 | After baseline | Bounded local retrieval; no service dependency |
| Promptfoo | Repeated routing/prompt evaluation | Dataset-based comparisons; use custom adapters and known provider costs |
| Langfuse | When trace volume defeats local logs | Traces, evaluations and prompt tooling; optional hosting/privacy/operations burden |
| DOM/SVG graph | First console slice | Maximum editorial control in current vanilla JS stack |
| Cytoscape.js | If graph navigation/scale requires it | Graph interactions/layouts without a React migration |
| React Flow | Only if React is separately chosen | Strong custom-node editor primitives; its default appearance is not an art direction |
| CrewAI Flows | Demonstrated unattended execution need | Optional execution adapter; prove recovery and approval handling |

Sources: [Playwright visual comparisons](https://playwright.dev/docs/test-snapshots), [axe-core](https://github.com/dequelabs/axe-core), [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci), [Promptfoo](https://www.promptfoo.dev/docs/getting-started/), [Langfuse](https://langfuse.com/docs), [Cytoscape.js](https://js.cytoscape.org/), [React Flow](https://reactflow.dev/).

Use official upstream licenses at the pinned version before bundling or reselling dependencies; a product's hosted features and media are not granted by an open-source library license. No new dependency is installed by this plan. Defer vector databases, graph databases, multi-agency routing, always-on agent swarms, a second observability platform and node-based execution editing until a real requirement supports them.

## 7. Delivery sequence and exit criteria

Effort ranges below are planning estimates for one experienced builder, not commitments; model runs, review and asset work add elapsed time.

| Order | Deliverable | Exit evidence | Estimate |
|---|---|---|---|
| P0 | Savra receipt + parity preflight + schema migration contract | Reproducible manifest; missing-capability fixtures fail; no invented provenance | 2–4 days |
| P1 | Design contract + three quality fixtures | First cross-host baseline; mobile and critical-state evidence; reviewer calibration | 3–5 days plus runs |
| P2 | Event/state writer + bounded retrieval | Offline/headless path passes; stale/deleted corpus tests; routing benchmark | 3–5 days |
| P3 | One Atlas slice using a real run | Find cause, output and review in one surface; desktop/mobile/keyboard review | 4–7 days |
| P4 | Optional CrewAI pilot | Demonstrated operational advantage under the same contracts | 1–2 days plus evaluation |
| P5 | Three paid design pilots | Measured delivery time, revision load, margin and customer acceptance | Commercial experiment |

P1 does not wait for the KB. Atlas's static composition can be evaluated using the registry and a real artifact manifest; it does not need all skill SOPs or a new runtime. P3 implementation requires a separately accepted console design. Agency #2 waits until Design repeatedly passes, not merely until the documentation is complete.

## 8. Shortest monetization route

Sell **a directed website sprint** in one visual niche, using hospitality as the first hypothesis because Savra is relevant portfolio evidence. Deliver one page, supplied-media direction, responsive implementation, review evidence and a clear handoff. Show the actual result and accepted limitations; do not sell an autonomous agency claim.

Price hypothesis for testing, not market research: €1,500–€3,000 for a tightly scoped pilot with one approved direction and bounded revisions; optional separately scoped ongoing improvements. Validate with three paying customers before building billing, teams or a marketplace. Track revenue minus model/tool costs, contractors and your delivery hours at an explicit internal rate. Obtain permission before using client work in demonstrations.

If delivery becomes repeatable, sell a studio setup/onboarding package with the workflow and quality fixtures. Consider software subscriptions only after users repeatedly use the console and ask to run jobs themselves. The defensible asset is the evidence-backed design process and reliable outcomes, not the number of named agents.

## 9. Discussion still needed

The default recommendation is native execution, one editorial artifact map, and service-first monetization. The material unresolved choice is whether the first customer is a website client buying an outcome or another designer buying the system. That changes packaging and console priorities, but does not block the quality work above.
