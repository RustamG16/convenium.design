# Convenium.Design notes: game-feel on the web

Vendored 2026-10-14 from `gamedev-skills/awesome-gamedev-agent-skills`
(`skills/disciplines/game-feel`, commit `0a70cfc64672d512c5b5b6006b5dcb5cf90dbdbd`), Apache-2.0.
The licence and NOTICE are in `third-party/`. **Changes made:** a `license:` frontmatter key and
a one-line pointer to this file at the top of `SKILL.md`. The rest of the upstream text is
unchanged.

The upstream examples are Godot and Unity. The principles transfer to the web without change:
layered feedback, transient exaggeration, and importance tiers. The APIs do not.

## Mapping

| Upstream | Web equivalent | Owner skill in Convenium.Design |
|---|---|---|
| `Tween` with `TRANS_BACK` / overshoot | `gsap.to(el, { scale: 1, ease: "back.out(1.7)" })` or CSS `cubic-bezier(.34,1.56,.64,1)` | `gsap-core`, `animate` |
| Ease-out "settle" | `power2.out` / `cubic-bezier(.22,1,.36,1)` | `gsap-core` |
| Screen shake (camera trauma) | Shake a **wrapper** with `transform`, never the layout box. Decaying trauma²; summed sines, not `Math.random()` per frame. Use sparingly: a UI is not a camera. | `gsap-core`, `gsap-performance` |
| Hit-stop / freeze frame | Rarely appropriate on the web. The closest equivalent is a 60–120 ms hold before a reward reveal. Never delay input handling. | `animate` |
| Particles | Canvas/WebGL confetti, or a small number of DOM nodes animated with `transform` and `opacity` only | `webgl-experience` (only if 3D is justified) |
| Number pop | `gsap.utils` interpolation of the displayed value, plus a scale pop on the number | `gsap-utils` |
| Audio layer | Off by default on the web; opt-in only | — |
| Importance tiers (small/medium/large) | Keep them, and record them in the project's `DESIGN.md` as numbers | `gamified-ui` |

## Web-only rules the upstream does not cover

- `prefers-reduced-motion: reduce` → drop shake, overshoot and particles. Keep a colour or
  opacity change so the event still registers. Use `gsap.matchMedia()`.
- Animate only `transform` and `opacity`. See `gsap-performance`.
- Feedback must not block clicks. Keep any overlay dismissible, and keep input disabled for no
  longer than 300 ms.
- Announce meaningful events (a level-up, an achievement) through an `aria-live="polite"`
  region. Motion alone is not feedback for screen-reader users.
