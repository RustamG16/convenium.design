# Simplicity brief — director input to T11 (2026-11-04)

Owner instruction, verbatim: "KEEP ON IMPROVING ON THE UI WITH THE LATEST STANDARDS FOR THIS KIND
OF DESIGN SYSTEM AND GAMIFICATION. MAKE THE UI SIMPLE AND EASY TO USE."

Source: the director walked the running app at 1440 (Hangar, boarding walk, Bridge, Armory,
Voyage, Pre-flight) on 2026-11-04 with T10 still uncommitted. Every item below is something that
was seen on screen, not a guess.

## Standards applied (live sources, checked 2026-11-04)

- **WCAG 2.2 AA** (https://dequeuniversity.com/resources/wcag-2.2,
  https://silktide.com/blog/whats-new-in-wcag-2-2/):
  - 2.5.7: every drag needs a single-pointer alternative. We have one: press/tap equip. Keep it,
    and make it the one shown first.
  - 2.5.8: targets at least 24 px. We commit 44 px.
  - 2.4.11: sticky bars and sheets must not hide focus.
- **Progressive disclosure** (https://www.nngroup.com/videos/progressive-disclosure/,
  https://www.uxpin.com/studio/blog/what-is-progressive-disclosure/): defer rare or advanced
  content to a second level; never more than two levels.
- **Ethical gamification** (https://www.verygood.ventures/blog/gamification-behavior-design-designing-digital-products-people-want-to-use,
  https://uxmag.com/articles/gamification-or-manipulation-understanding-the-ethics-of-engagement-loops):
  - feedback is informative, not performative;
  - the user keeps their autonomy;
  - no competitive pressure.
  This is already the ethics gate in 06 § 7.6; it stays.
- **Loadout and inventory UX** (https://www.huntshowdown.com/news/developer-insight-upcoming-ui-improvements,
  https://acagamic.com/newsletter/2023/03/21/how-to-unlock-the-secrets-of-video-game-inventory-ux-design/):
  - equip from where you browse, in one step;
  - dim what is irrelevant while choosing a slot;
  - compare current against candidate before committing;
  - always show what a loadout contains.

## The rule this pass enforces

On every screen: **one primary action** (the only filled button), **one next goal**, and **at most
two levels of detail**. Everything else is secondary (outline or text) or one disclosure away.

## Findings, by screen, with the change

**Global**
- G1. Ship screens link to each other inconsistently:
  - Bridge has "Replay the walk / Back to the hangar";
  - Voyage has "Pre-flight and export / Bridge";
  - Pre-flight has "Bridge / Voyage / Logbook".
  → Add one ship sub-nav on every ship screen: **Bridge · Voyage · Pre-flight**, with the current
  one marked. Beside it, a persistent readiness pill (ring + "14 of 14") and the next-goal
  button. "Replay the walk" moves into a quiet overflow.
- G2. The template lock repeats on every screen as a full banner, and is the first friction.
  - → On a template, show one slim line ("Template, read-only") with **Clone to edit** as that
    screen's primary.
  - → Any edit gesture on a template (drop, equip, rename) opens the same one-step "Clone to edit"
    dialog, then lands in the clone on the same screen with the same selection.
  - Nothing is silently cloned.
- G3. Truth chips (VERIFIED / SIMULATED / KB hash) sit on almost every block of the Bridge.
  - → Put the label once per section heading, as a small muted tag with a tooltip. Drop
    duplicates on child rows.
  - → One "What do these labels mean" line in the logbook.
  - The truth model is unchanged; only its repetition goes.
- G4. Button hierarchy is flat (every button is an equal-weight outline). → One filled primary
  per view; the rest are outline or text.

**Hangar** (the director's defect 1 is the same screen)
- H1. The title and the empty canvas take the whole first viewport; the ship card and its
  actions are below the fold.
  - → Put the fleet card beside or over the hull in the first viewport (1440×900).
  - → **Open the ship** is the primary; Pre-flight is secondary.
  - → The hull fills the stage: framing and ring centred.
- H2. "How it works?" → "How it works".
- H3. The empty drydock line already names its action. Make **Clone SS Full Run** read as the
  next step for a first-time visitor.

**Boarding walk**
- B1. Four ways forward compete: Walk in, pick a name, Skip to bridge, and the keyboard legend.
  - → **Walk in** is the primary.
  - → "Skip to bridge" is a text button.
  - → Collapse the WASD legend into a "Controls" disclosure (still keyboard-reachable; still
    shown on first visit for 4 s, or until the first key).

**Bridge**
- R1. The profile shows lore in full above the editable part. That lore is: appearance,
  paragraph, quote, Strengths, Blind spots, Motivations and Growth paths.
  - → Lead with identity: name, role, model tier, one-line quote.
  - → Then the **Artifacts** the member wears and the slots.
  - → Put the four lore lists behind one "Profile" disclosure, closed by default and remembered.
- R2. The crew ecosystem (React Flow) at the bottom of the Bridge repeats Voyage's job. → Move it
  to Voyage as an "Ecosystem" view toggle, or keep it on the Bridge behind a disclosure. Either
  way it is not in the default scroll.
- R3. Empty slot copy "Not worn: pick one". → "Empty. Choose a Copy artifact", with the choices
  inline as buttons.
- R4. The turntable figure is small (the director's defect 4). Also, while a slot is being
  chosen, dim the anchors that cannot take it (loadout UX).

**Armory** (the director's defect 2 is the same screen)
- A1. The left column spends its top on an "Equip to" blocker and a stack of filters.
  - → Put **Equip to: [ship ▾] [member ▾]** in the page header.
  - → Search plus three filter selects go in one row above the grid. On < 1200 they go in a
    sheet (already planned).
- A2. The 420 px inspector shows "Pick an artifact to inspect it" while empty. → The grid takes
  the full width until a card is picked, then the inspector opens (T10's Flip).
- A3. The inspector gets a **compare** strip before equipping:
  - "Replaces X on <anchor>", or "Fills an empty socket";
  - "Pre-flight: no change", or "adds 1 warning: off-route".
  One button: **Equip to <member>**.
- A4. Card titles truncate, and "EQUIPTO" is missing its space. Fix both. Card text is the
  title in full (2 lines), then the family and tier on one line.

**Voyage** (the director's defect 3 is the same screen)
- V1. Stage cards scroll horizontally and the 4th card is cut. → At ≥ 1200, wrap the track into
  rows, or use a vertical list with gates as inline dividers. No hidden horizontal scroll
  without an affordance. The phone already uses a vertical list.

**Pre-flight**
- P1. The next goal at the top works well. Keep it.
- P2. Export offers several equal buttons:
  - Download ship.json;
  - Download 00-run-plan.md;
  - Copy kickoff prompt;
  - Save to shipyard/ships.
  → Make **Copy kickoff prompt** the primary: it is the thing a session needs. Put the two
  downloads and Save in a "Files" group as secondary. Keep the folder path field above them.

## Out of scope for this pass

- No new screens, packages or features.
- No change to the domain, export or pre-flight logic.
- The ethics gate is unchanged.
- No removal of any required state from DESIGN.md.
- Every change keeps the keyboard, reduced-motion and no-WebGL paths working.

## Done means

- Each item above is marked done or not done, with a screenshot path.
- DESIGN.md's layout grid and button hierarchy are updated to match: same numbers, new
  arrangement.
- The e2e tests are updated where the arrangement moved, and nothing is weakened: no deleted
  assertion without a replacement.
