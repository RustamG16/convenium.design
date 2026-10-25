---
name: gamified-ui
description: Design and build gamified web and app interfaces (XP and levels, streaks, achievements, progress, quests, leaderboards, celebration feedback), committing every number before code and passing an ethics gate. Use when a product, tool, dashboard or learning surface should reward progress, when the user says gamify, XP, level up, streak, badge, achievement, quest, leaderboard, progress bar, reward or celebration, or when an existing gamified UI feels hollow, grindy or manipulative. Use octalysis-gamification to audit motivation and game-feel for feedback intensity. This skill owns the mechanics, the numbers and the UI states.
---

# Gamified UI

Gamification works when it shows people real progress toward something they already want. It
fails when it adds points and badges to an experience that has nothing underneath. This skill
makes the decisions in the order that keeps it honest. It names the behaviour first, then the
motivation and the loop, then the mechanic. Every number is fixed before any code is written.

Authored for Convenium.Design on 2026-10-14. It is original text, and its frameworks are cited where they
are used.

## When not to use

- To audit which motivations an existing product uses → `octalysis-gamification`.
- To decide how strongly a single event should be felt (pop, shake, particles) → `game-feel`
  and its `APOLLO-NOTES.md`.
- To write the motion itself → `animate`, `gsap-core`, `gsap-timeline`.
- To build a game (rules, levels, controls) rather than gamify a product → `higgsfield-websites`
  (`library/skills/04-media-generation/higgsfield-websites/references/game-design-system.md`).

## Decision order

1. **Name the target behaviour and why it has value.** Describe one observable action that is
   good for the user, such as "finishes a generation scoring 70% or higher". A metric that is
   good only for the business, such as "opens the app", is not a target behaviour. If you
   cannot name one, stop: gamification will not help.
2. **Pick the motivation (core drive).** Run `octalysis-gamification` Level 1 on the plan. Lead
   with white-hat drives: Accomplishment, Creativity & Feedback, Meaning, Ownership. Use
   black-hat drives (Scarcity, Loss, Unpredictability) only for short, honest bursts. They raise
   short-term activity and lower trust.
3. **Draw the loop.** Action → immediate feedback → visible progress → the next goal, which is
   always on screen. Put this one line in `DESIGN.md`. A mechanic that sits on no loop is
   decoration.
4. **Choose the fewest mechanics that close the loop.** Use the table below. Start with one or
   two.
5. **Commit the numbers** (§ Numbers) to the project's `DESIGN.md` under `## Gamification`
   before any code. This follows Convenium.Design's design-system rule.
6. **Design every state** (§ States), not only the success path.
7. **Run the ethics gate** (§ Ethics). Any failure blocks the build.
8. **Build, then verify** (§ Done when).

## Mechanics

| Mechanic | What it does | Use when | Main risk |
|---|---|---|---|
| XP and levels | Turns cumulative effort into visible growth | Use is ongoing and repeated | Grind, and XP inflation |
| Progress bar / checklist | Shows the distance to a defined end | Onboarding, multi-step tasks | Bars that never finish |
| Achievements | Marks a specific notable moment | Events worth remembering: firsts, mastery, discovery | Participation-trophy spam |
| Streaks | Rewards consistency over time | A daily habit the user chose | Guilt, anxiety, and breaks felt as punishment |
| Quests / challenges | Gives a bounded, named goal | Steering toward features the user is underusing | Busywork |
| Unlockables | Turns progress into new capability | The unlocked thing has real value | Gating basic features |
| Leaderboards | Adds social comparison | A real cohort exists and the user opted in | Discourages everyone outside the top 10 |
| Quality score / grade | Rates the result itself, not the effort | Output can be measured (fidelity, accuracy) | Gaming the metric |

A single-user tool should not have a leaderboard. Compare the user with their own past best.

## Numbers (commit before code)

**XP curve.** XP needed for the next level is `round(base × L^k)`, with defaults `base = 100`
and `k = 1.5`.

| Level | XP to next | Cumulative |
|---|---|---|
| 1 | 100 | 100 |
| 2 | 283 | 383 |
| 3 | 520 | 903 |
| 5 | 1 118 | 2 821 |
| 10 | 3 162 | 14 268 |
| 20 | 8 944 | 76 079 |

- **The first level-up happens in the first session**, within about 5 minutes of real use.
- **Award XP for outcomes, not clicks.** Give the most XP to the target behaviour and a little
  for honest attempts. Give no XP for navigation or for repeating an action with no new result.
- **Anti-farming:** cap repeatable awards per day, or use diminishing returns where the n-th
  repeat earns `1/n`. Award once per unique result ID.
- **Scale with the score, don't punish:** a failed attempt earns a small base amount. It never
  removes XP.

**Worked example: an AI video studio with a 70–80% target.** These are suggested starting
values; tune them once you see real scores.

| Fidelity score | XP | Feedback tier |
|---|---|---|
| < 50% | 5 (attempt) | small |
| 50–69% | 10 | small |
| 70–79% (target) | 40 | medium |
| 80–89% | 60 | medium |
| ≥ 90% | 100, plus an achievement on the first one | large |

**Streaks.**
- The unit is a calendar day in the **user's local timezone**. State that rule in the UI.
- Grace: the user earns one freeze per 7-day streak and can bank at most 2. A freeze is applied
  automatically, and the user is told afterwards.
- When a streak breaks, keep "longest streak" visible and use a neutral tone ("New streak
  starts today"). Never charge money to restore a streak.
- Only count streaks of actions the user controls.

**Achievements.**
- Categories: first-time, cumulative, mastery (quality), discovery (secret), consistency.
- Each one has a specific criterion that can be met, plus a locked state that shows a hint.
  Keep secret achievements to 20% or fewer of the total.
- Data model: `{ id, title, criterion, category, tier: bronze|silver|gold, secret, unlockedAt }`.

**Progress.**
- Show the next milestone, not only the total ("120 XP to Level 4", not "783 XP").
- **Endowed progress** is acceptable when it is honest: count the steps the user has already
  done (for example, an account created) as complete. Never invent progress.
- Every bar ends. When a goal is complete, show the next one immediately.

**Celebration tiers.** Map them to `game-feel` tiers and record the numbers in `DESIGN.md`.

| Tier | Example event | Web treatment | Duration |
|---|---|---|---|
| small | XP tick, attempt logged | Number counts up, plus a 1→1.06 scale pop with ease-out | 150–200 ms |
| medium | Target score, quest step | Toast, a progress fill with `back.out`, and an XP fly-to-bar | 400–700 ms |
| large | Level-up, first ≥ 90%, achievement | Dismissible overlay, a confetti burst with ≤ 80 particles, and an `aria-live` announcement | ≤ 1.5 s, input blocked ≤ 300 ms |

Sound is off by default. Under reduced motion, keep the colour and opacity change and the
announcement, and drop the motion.

## States

Design each of these, then check each one in the browser:

- First run: zero XP, the first goal visible, nothing locked behind it.
- Partway through: the next milestone shown.
- Level-up.
- Achievement unlocked, and the locked list with hints.
- Streak saved by a freeze.
- Streak broken.
- Maximum level reached: there is always a next goal, such as mastery tiers or a personal best.
- Offline or failed save: never show progress the server has not confirmed. Use optimistic UI
  and roll it back visibly.
- Reset or export of progress, if the product has it.

## Ethics gate

Any "yes" blocks the build until it is fixed:

- Do any notifications use guilt or loss ("You'll lose everything!")?
- Is any progress, timer or scarcity fake?
- Can money buy back a lost streak, or buy a random (loot) reward?
- Does any reward pull the user away from the task they came to do?
- Are rewards attached to something that should be intrinsic, in a way that crowds it out?
- Is the user ranked against others without having opted in?
- Is a basic feature locked behind progression?

## Accessibility

- Progress bars use `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
  and a text label.
- Level-ups and achievements are announced through an `aria-live="polite"` region.
- Tier or rarity is never shown by colour alone. Add an icon or a text label.
- A setting turns off celebrations and streak reminders.

## Done when

- `DESIGN.md` has a `## Gamification` section with the loop line, the XP formula and values,
  the award table, the streak rules and the tier table.
- Every state above has been seen in the browser, including under reduced motion.
- The ethics gate is all "no".
- Awards are tied to unique result IDs and are capped, which was tested by repeating the same
  action.
- `visual-qa` has been run on the gamified surfaces.

## References

- `references/sources.md`: the frameworks and research this skill relies on, and what each one
  is used for.
