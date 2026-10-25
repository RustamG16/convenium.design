# Savra recovery: route and control contract

Date: 2026-09-15
Status: approved for implementation by the user continuation instruction. Implemented recovery is undergoing the final bounded verification pass. Original contract retained below.

## Evidence and precedence

Inspected canonical PNGs 00–10 in numeric order after ROUTING.md. Reference root: `../../New_upgradePlan/media/apollo-continuous-journey-v2/`. The written recovery requirements override illustrative screenshot data and controls. This is the implementation contract for the supplied direction, not an alternative concept.

Current branch: `upgrade/host-parity`. Existing uncommitted shell, state, documentation, systems data, and metric changes must be preserved. Inspection confirms that the route parser treats Work detail as runId rather than chatId, and the cached audit identifies the five-role runtime and missing complete journey. No new browser verification is claimed here.

## Shared composition

- Fixed 210px dark rail on desktop, warm paper workspace, faint technical grid, route/status strip, condensed headings and readable body text.
- Emerald: verified/complete; blue: selection/action; amber: review/waiting; coral: failure. State always also has text.
- One primary page action; at most two visible secondary page actions. Navigation, field choices and disclosure triggers remain accessible but do not compete as calls to action.
- Contextual Oracle exposes removable context. It reserves layout space instead of covering content. Work owns its composer; Oracle becomes a compact trigger while Work input is focused.
- One overlay controller owns Oracle, inspector and Projects and Chats drawer. Opening one closes the others. Escape closes and focus returns to the opener.
- Project selection and explicit chat list remain available at all widths. Work route is `#/projects/{projectId}/work/{chatId}`. Runs retain separate identities on Results/System. Invalid or cross-project chat links show recovery rather than another project's messages.
- Savra font samples, palette and media map appear only inside Savra evidence. Historical model, prompts, skill load order and host configuration remain unknown unless recorded. Screenshot brands, scores, budgets and durations are not seed facts.

## Route/control matrix

Project-scoped suffixes below follow `#/projects/{projectId}/`. Global entries retain their rail routes.

| Screen / route | Reference | User job and guidance | One primary action | Up to two secondary actions | Disclosure / removed controls |
|---|---|---|---|---|---|
| Home `#/home`, project `home` | 01 | See project, stage and next action. “Describe what you want to build.” | Start with Oracle | Select project; View latest result | Recent activity expands. Remove duplicate quick-link action cards. Goal categories are input choices, not competing actions. |
| Projects `#/projects` | 01, 03 | Find a project and its conversations. “Choose a project to continue.” | Open selected project | Start with Oracle | Project details expand; never concatenate chat titles into subtitles. |
| Intake `intake` | 02 | Answer one relevant question with explanation and confirmed-answer summary. “Your answers shape the brief; you can revise them.” | Confirm and continue | Back; Review answers | File attachments within disclosure. No inactive voice button. |
| Brief `brief` | 03 | Review sourced outcome, audience, scope, assets and Design DNA. “Approval records this version of the brief.” | Approve brief and create plan | Edit brief; View sources | Field editing in selected-row inspector. Omit unsupported sharing. |
| Plan `plan` | 04 | Read ordered stages, owners, dependencies and current gate. “Review the plan and numeric design before execution.” | Review plan | Configure; View evidence | Resources, risks and detailed routing expand. Approval is a reviewed hash-bound transition, not a navigation side effect. |
| Configure `plan/configure` | 05 | Inspect six functional roles and draft settings. “Test changes before applying them to the plan.” | Test in Playground | Return to plan; Reset draft | Selected-role inspector exposes supported model/environment, skills, budget and permissions. Remove character portraits, unrestricted permissions and deployment switches. |
| Playground `playground` | 06 | Compare Setup A/B, changed capabilities and measured evidence. “Tests do not execute production work.” | Run comparison, replaced by Review and apply after a valid test | Edit setup; Reset draft | Detailed receipts expand. No invented confidence, cost or elapsed time. Applying uses an explicit proposal. |
| Work `work/{chatId}` | 07 | Continue a conversation and inspect actual execution. “This conversation belongs to the project shown above.” | Send message; pending approval replaces this with Review approval | Projects and chats; Inspect run | Timeline, files and logs disclose. Pause/cancel appear only for an actual controllable run. Composer is disabled with a reason while approval blocks execution. No second competing Oracle composer. |
| Results `results/{runId}` | 08 | Review output, author QA, independent review and limitations. “Review the evidence before accepting this result.” | Approve result, then Continue after approval | Request changes; Compare version | Evidence, hashes, logs and local export disclose. Remove Deploy preview. Missing QA blocks approval with a reason. |
| Knowledge `knowledge`, `knowledge/connections` | 09 | Find facts and trace sources. “Every connection must link to evidence.” | Open selected evidence | Add local knowledge; Show connections/list | Search/filter are form inputs. Source inspector shows provenance and availability. Unsupported confidence/freshness remains unknown. |
| System `system/{runId}` | 10 | Understand pipeline, dependencies and why a phase is active. “The list contains the same information as the graph.” | Inspect selected phase | Show graph/list; Open run | Node controls and diagnostics live under Advanced. Retry/cancel only for real supported states. No implied live activity for historical receipts. |
| Agents `#/agents` | 05 | Understand the six roles and their limits. “Select a role to see its skills, inputs and approval requirements.” | Configure team | View workflow; View sources | Six role rows plus inspector; historical model/environment unknown. Oracle is coordinator UI, not a seventh manifest role. |
| Settings `#/settings` | 05 shared row/inspector grammar | Change supported local preferences. “Only available settings can be applied.” | Review and save changes | Reset draft | Integrations and capability diagnostics expand. Remove billing, marketplace and unsupported cloud controls. |

## Reference-by-reference interpretation

00 establishes the complete journey and explicit control handoffs; implement as a readable ordered progression, not a required horizontal graph.

01 establishes active-project/stage summary, goal entry, recent projects and one next-action region.

02 establishes one question, selectable answers, why-this-is-asked copy and a confirmed/remaining summary inspector.

03 establishes sourced brief rows with Design DNA alongside. Editing opens the selected field, not a second floating workspace.

04 establishes vertical workflow rows, selected-stage detail, inputs/outputs, dependency checks and gate explanation. Use real phase owners and omit fictional estimates.

05 establishes a compact role table and right inspector. Populate Design Director, Visual Analyst, Asset Producer, Design Engineer, Independent Critic and Analytics Specialist. Conditional roles remain visible with a dormant reason.

06 establishes symmetric A/B evidence with a central explanation of changes. Scores require actual measurements and an identified rubric.

07 establishes execution timeline, preview and task inspector. Add the explicitly required project/chat hierarchy and Work-owned composer while retaining that content hierarchy.

08 establishes artifact preview, version context, plan/design hashes, QA and limitations. Local review replaces illustrative deployment functionality.

09 establishes project-centred evidence relationships, search, list toggle and provenance inspector.

10 establishes dark technical canvas inside the paper shell, dependency edges, status legend and selected-node inspector. It is optional advanced inspection.

## Node-view contract

System nodes follow intake → evidence → direction → plan → numeric design → build → author QA → independent review, with approval gates and bounded repair represented from the manifest. Asset work activates only from approved media scope; analytics activates only with measurement scope. Edges resolve to actual consumed/produced artifacts. A critic never builds or overlaps an author. No more than two repair cycles; no nested specialist delegation.

Knowledge nodes represent the project, brief, Design DNA, approved source material, skills and produced artifacts. Relationship names are justified by source metadata. Unknown relationships are omitted rather than inferred as fact.

Both graphs share selected IDs, filters and data with an always-available readable list. Selecting a node or list row opens the same inspector. Advanced controls: zoom in/out, keyboard pan, pointer pan, fit, reset and focus selected. Provide keyboard traversal, visible selection and text state legend. Below 820px default to List, with optional Show graph. Reduced motion stops edge animation; reduced transparency uses opaque surfaces.

## Empty, loading and recovery states

- Home/Projects: no project → Start with Oracle. Intake: unanswered → explain required answer. Brief/Plan: absent artifact → return to its prerequisite, never fabricate content.
- Configure/Playground: no draft → derive an isolated draft from the current plan; no measurement → “Not measured.” Work: no chats → Start conversation; invalid chat → Choose a chat; no messages → labelled composer.
- Results: no output → Open Work; missing QA → explain missing evidence. Knowledge: no matching sources → Clear filters. System/Agents: unavailable receipt → Retry loading. Settings: no supported capability → show unavailable reason.
- Loading regions retain headings and selected context with a text status; actions requiring fresh data remain disabled with explanation.
- Errors preserve drafts and show one Retry action plus specific cause. Offline mode labels cached content, preserves input and disables server-dependent mutations. Reconnection reloads and revalidates hashes before applying any proposal.
- Cancel discards only the current draft after a clear review; destructive operations require reversible behavior. Stale approvals show changed artifacts and require fresh review.

## Verification required after approval

Follow Tasks 1–8 in their written order using red/green tests. Verify the deterministic full journey, route history/reload, all recovery states, 390/820/1280/1440/1920 widths, keyboard and focus restoration, 200% text, reduced motion/transparency, overlap/overflow, runtime health, T1–T11 and B1–B8. Preserve thresholds. Author QA precedes an independent read-only finish review. No readiness claim before supported PASS or PASS WITH NOTES.

## Approval checkpoint

Task 4 Step 5 explicitly says: “No production code begins until the user confirms that the plan matches the supplied examples.” Approval is requested for the matrix and node contract above. This checkpoint is why production Tasks 1–3 have not yet been edited despite appearing earlier in the numbered plan. Once approved, execute Tasks 1–8 without another concept/intake round.

