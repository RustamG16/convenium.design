# Continuous-improvement implementation plan — desktop release 1

## Outcome

Make Convenium.Design Studio feel like a credible desktop creative operating system at laptop and desktop sizes: the active task stays in view, system structure can be edited with keyboard or pointer, comparisons remain spatially coherent, and motion/media clarify state without competing with work.

## Build contract

### Shell and Work

- Bound Work to the available viewport below the 68 px application header.
- Keep project/chat navigation, conversation, composer, and context inspector in one desktop workbench.
- Reduce the masthead footprint and add a compact orientation/status band.
- Keep the composer persistent inside the work area; message history owns scrolling.
- Raise quiet-text and divider contrast while preserving the obsidian/paper/signal palette.

### Systems and graph

- Add Lucide icon + label commands for add, connect, auto-layout, reset, save, delete, test, and settings.
- Implement roving-tabindex toolbar behavior using Left/Right/Home/End.
- Add keyboard node selection, arrow movement, Shift acceleration, Delete/Backspace removal, and Escape cancellation.
- Announce graph movement and connection state through the existing status region.
- Keep pointer dragging 1:1 and preserve browser-local graph persistence.

### Playground

- Recompose task/settings and setup candidates into a two-column desktop experiment workbench.
- Keep the task and run settings visible while inspecting setup differences.
- Add a progress rail for idle/running/complete/error states.
- Animate only the progress indicator, result entrance, and kept-result confirmation.

### Media and motion

- Generate `work-signal-field-01` and `comparison-lenses-01` according to the asset manifest.
- Use media as low-opacity spatial orientation with CSS gradients as the no-media fallback.
- Use GSAP core only; no ScrollTrigger or perpetual motion.
- Use `gsap.matchMedia()` to disable positional motion under `prefers-reduced-motion`.

### Dependencies

- Add a pinned Lucide package and serve a local vendored build; no CDN and no runtime network dependency.
- Preserve the existing vendored GSAP build.
- Defer React Flow until the approved React/Tauri migration.

## Verification contract

- `npm.cmd run check` and project-context validation.
- `/api/health`, `/api/config`, and demo `/api/compare` smoke checks.
- Browser review at 1280×800, 1440×900, and 1920×1080.
- Keyboard: primary navigation, Work composer, toolbar roving focus, node select/move/delete/cancel, Oracle open/close focus return.
- Reduced motion: no positional page/graph/result animation.
- Runtime: no console errors, missing assets, horizontal document overflow, or blocked local resources.
- Performance risk review: no infinite animation, no layout animation loop, generated stills optimized, local library payload recorded.

