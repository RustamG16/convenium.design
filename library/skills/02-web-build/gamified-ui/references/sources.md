# Sources for gamified-ui

Each concept here is a pointer to where the idea comes from. None of the skill's text is copied
from these sources.

| Concept | Source | How the skill uses it |
|---|---|---|
| 8 core drives; white hat vs black hat | Yu-kai Chou, *Actionable Gamification* (2015), Octalysis Framework — https://yukaichou.com/gamification-examples/octalysis-complete-gamification-framework/ | Decision step 2; the ethics gate. Vendored as the `octalysis-gamification` skill. |
| Layered, transient feedback in importance tiers | `gamedev-skills/awesome-gamedev-agent-skills` → `game-feel` (Apache-2.0) | Celebration tiers |
| Endowed progress effect | Nunes & Drèze, "The Endowed Progress Effect", *Journal of Consumer Research* 32(4), 2006 | Progress rules: only honest endowment |
| Goal-gradient effect | Kivetz, Urminsky & Zheng, *Journal of Marketing Research* 43(1), 2006 | "Show the next milestone" |
| Overjustification effect (rewards crowding out intrinsic motivation) | Deci, Koestner & Ryan, meta-analysis, *Psychological Bulletin* 125(6), 1999 | Ethics gate: rewards on intrinsic activities |
| Points and badges with nothing underneath | Observed across the candidate skills reviewed on 2026-10-14 (see `library/knowledge/01-skill-repos/README.md`, 2026-10-14 section) | Opening principle |

The XP exponent (`k = 1.5`) and the score-to-XP table are Convenium.Design defaults chosen for tuning.
They are not research findings.
