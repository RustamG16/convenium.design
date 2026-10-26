# Research and continuous-improvement brief — 2026-09-01

## Scope and evidence

- **Approved direction:** Convenium.Design Workbench (Gate B remains valid).
- **Target:** laptop and desktop only, approximately 1280×800 through 1920×1080. Mobile responsiveness is explicitly out of scope by user instruction on 2026-09-01.
- **Observed build:** `http://127.0.0.1:4173`, local Node renderer, demo mode, no console errors during the initial review.
- **Observed desktop state:** the four primary routes and their promised subroutes are implemented. Work, Systems → node editor, Library → Agent Profiles, and Playground comparison are reachable.
- **Unknown:** production analytics, real user task-completion data, packaged Tauri behavior, and live-provider latency. No claims are made for these.

## Highest-leverage findings

| Finding | Evidence | Severity | Confidence | Improvement |
| --- | --- | --- | --- | --- |
| Work does not fit a laptop-height task loop | At 1440×900 the document is 1075 px tall and the composer falls below the first viewport; the large project masthead consumes the space needed for the active task | High | High | Convert Work into a true viewport workbench: bounded shell, scrollable conversation, persistent composer, compact project orientation band |
| Primary controls look too similar to passive text | Node commands and several secondary actions use borderless quiet styling, weakening affordance and action grouping | High | High | Add a consistent command-button treatment, icon + label pairing, selected/toggle states, and toolbar keyboard behavior |
| Graph editing is pointer-first | Nodes can be dragged, but there is no documented keyboard movement or live position feedback | High | High | Add Enter/Space selection, arrow-key movement, Shift acceleration, Delete/Backspace handling, Escape cancellation, and an ARIA live message |
| Playground is vertically expensive before comparison | Task, four settings, two setup cards, and run controls form a long single column; laptop users cannot hold task and candidates in one visual field | Medium | High | Use a two-column experiment workbench with a sticky task/settings rail, candidate comparison canvas, visible progress, and fixed action proximity |
| Visual identity is coherent but too dark and static | The obsidian/editorial system is distinctive, yet several secondary labels and boundaries sit near the perceptual floor and state changes rely on small copy | Medium | High | Raise quiet-text and boundary contrast, add restrained system-light media, functional iconography, and short state-transition motion |

## Sources and transferable guidance

1. **Microsoft Fluent 2 — accessibility, navigation, toolbar, and motion**
   - Sources: <https://fluent2.microsoft.design/accessibility>, <https://fluent2.microsoft.design/components/web/react/core/nav/usage>, <https://fluent2.microsoft.design/components/web/react/core/toolbar/usage>, <https://fluent2.microsoft.design/motion>
   - Transfer: predictable hierarchy, commands near the object they affect, labeled actions, visible focus, and motion that directs attention in a clear order.
   - Do not copy: Fluent's component appearance. Convenium.Design keeps its editorial obsidian identity.

2. **WAI-ARIA Authoring Practices — keyboard interface and toolbar**
   - Sources: <https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/>, <https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/>
   - Transfer: one Tab stop for a composite toolbar, arrow-key movement inside it, clear distinction between focus and selection, and status announcements for changes.

3. **React Flow — accessible node-editor interaction model**
   - Sources: <https://reactflow.dev/learn/advanced-use/accessibility>, <https://reactflow.dev/examples>, <https://reactflow.dev/api-reference/react-flow>
   - Transfer now: focusable/selectable nodes, Enter/Space selection, arrow-key movement, Shift acceleration, Escape cancellation, Delete behavior, larger edge interaction targets, and live movement announcements.
   - Deferred: the React Flow dependency itself, because adopting it now would prematurely trigger the separately gated React/Tauri migration.

4. **GSAP — responsive preference handling and performance**
   - Sources: <https://gsap.com/docs/v3/GSAP/gsap.matchMedia/>, <https://gsap.com/docs/v3/GSAP/gsap.quickTo/>, <https://gsap.com/docs/v3/Installation/>
   - Transfer: keep motion local to state changes, animate transforms/opacity, use `matchMedia()` for reduced motion, reuse tweens for frequently updated values, and avoid scroll spectacle on repeated workbench actions.

5. **Lucide — consistent local iconography**
   - Source: <https://lucide.dev/>
   - Transfer: a small set of stroke icons for recurring commands, always paired with accessible text or explicit labels. Icons are decorative when the label already names the action.

6. **OpenAI — practical agent safeguards**
   - Sources: <https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/>, <https://openai.com/index/the-next-evolution-of-the-agents-sdk/>
   - Transfer: guardrails, human intervention for high-risk actions, explicit handoff, traceable state, and recoverable checkpoints. Convenium.Design's proposal-before-mutation contract remains primary.

7. **Ink & Switch — local-first ownership and agency**
   - Source: <https://www.inkandswitch.com/essay/local-first/>
   - Transfer: the local copy is authoritative, work should not wait on a network request, and export/recovery paths must remain understandable. Generated media and libraries remain project-local.

## Implementation decision

Preserve the current Node/ESM browser renderer. Use the already vendored GSAP core and add one pinned Lucide dependency for local icon rendering. Do not add React Flow, ScrollTrigger, Lenis, WebGL, a component framework, or a remote CDN. Generate two quiet decorative stills with CSS-only fallbacks. Concentrate the first improvement release on Work viewport fit, graph keyboard operation, Playground task density, command hierarchy, and trustworthy state feedback.

## Continuous-improvement loop

1. Capture a baseline at 1280×800, 1440×900, and 1920×1080.
2. Implement one bounded release slice.
3. Run syntax/API/desktop/keyboard/reduced-motion/console checks.
4. Record defects in `.olympus/12-continuous-improvement-plan.md` and allow at most two repair cycles.
5. Keep the release local until the user explicitly approves a GitHub push.

