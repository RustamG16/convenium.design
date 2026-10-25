---
name: ethical-gamification-systems
description: Design ethical gamification for Convenium.Design Studio and similar creative-work products. Use when defining missions, progression, rewards, mastery, collections, playbooks, creative milestones, token or credit spending, status signals, or retention loops, especially when safeguards are needed against coercion, dark patterns, excessive spend, misleading achievement claims, or accidental complexity.
---

# Ethical Gamification Systems

Make progress legible and creative practice satisfying without turning attention, anxiety, or spending into the product's objective. Reward meaningful creative agency, reusable learning, and finished work rather than arbitrary activity.

## Required output

Produce a bounded mechanic specification containing:

- **Purpose:** the user value and behavior the system should support.
- **Core loop:** mission start, meaningful action, feedback, reflection, and reusable outcome.
- **Progress model:** what advances, why it advances, and how the user can inspect it.
- **Rewards:** utility, mastery, recognition, or collection value.
- **Economy:** token or credit costs, limits, confirmation rules, and recovery paths.
- **Truth labels:** what is verified, self-reported, simulated, estimated, or unavailable.
- **Safeguards:** coercion, spend, accessibility, and complexity checks.
- **Measurement:** success and guardrail metrics without invented baselines.

## Workflow

### 1. Start from user value

Name the real creative outcome: clarifying taste, finishing a project, learning a reusable technique, improving a Style Profile, assembling a reliable squad, or saving a proven playbook. Reject mechanics whose main value is increasing sessions, clicks, or spend.

### 2. Define a meaningful mission loop

Use this default loop:

1. Choose an outcome and constraints.
2. Select or refine Creative DNA.
3. Accept or edit the suggested squad and budget.
4. Complete visible stages with approval moments.
5. Review the artifact and evidence.
6. Save useful configuration as a playbook or update the Style Profile.
7. Reflect on what worked before starting another mission.

Allow pause, exit, retry, and scope reduction without punishment. Do not make a streak, timer, or daily return prerequisite for preserving work or status.

### 3. Model progression as mastery

Progress should describe capability or completed value. Prefer:

- project and mission milestones;
- demonstrated techniques with links to the work that demonstrated them;
- richer Creative DNA supported by explicit preference evidence;
- trusted playbooks with actual run history;
- collections of owned or licensed assets, tools, and configurations;
- optional personal reflection and before/after comparison.

If points or levels exist, publish their rules and make them secondary summaries. Never imply professional rank, community authority, or verified expertise unless the evidence supports that claim.

### 4. Design rewards with utility

Prefer rewards that expand informed choice: a reusable playbook, a profile variant, a new configuration view, a learning note, a verified capability, or a curated asset. Cosmetic collection can add delight but must not obscure mission costs or pressure the user to complete meaningless tasks.

Use predictable rewards by default. If surprise is used, keep it cosmetic, free, bounded, and independent of spend. Do not sell randomized rewards or use near-miss effects.

### 5. Bound the token or credit economy

At every spend decision, show the estimated or maximum cost, what consumes it, what the user receives, and a lower-cost path. Distinguish a budget ceiling from actual usage.

Require explicit confirmation when a run can exceed the user's stated budget, repeat a paid generation, activate a paid external service, or spend after a failed result. Default retries to review, not automatic spend. Provide session and mission caps, warnings before the cap, cancellation where technically possible, and a receipt with actual usage when telemetry exists.

Never represent unavailable or estimated usage as exact. Preserve provider provenance and distinguish product credits, API tokens, subscription limits, and money.

### 6. Keep status truthful

Attach a visible evidence state to progress and portfolio signals:

- **Verified:** backed by an inspectable artifact or trusted measurement.
- **User-reported:** supplied by the user without independent verification.
- **Simulated:** produced in demo or planning mode.
- **Estimated:** derived from an explained assumption or bound.
- **Unavailable:** not captured; never replace with zero.

Show reversals and failures as part of the run history when useful. Do not erase them to inflate completion or success rates.

### 7. Control complexity

Launch a mechanic only if the user can answer: “What does this mean?”, “What can I do with it?”, and “What will it cost?” Keep the initial system to one mission loop, one progress model, and a small reward set. Add currencies, rarity, seasons, ranks, or collections only when each has a distinct user benefit that simpler labels cannot provide.

Progressively disclose optimization controls, but keep cost, time pressure, expiry, permissions, and consequences visible.

### 8. Measure benefit and harm

Choose one outcome metric tied to completed creative value and a small set of guardrails. Examples include mission completion with artifact review, playbook reuse with user approval, budget overruns, regretful-spend reports, disabled-notification rate, abandoned runs after cost prompts, and correction rate for misleading status.

Define the event contract with `$analytics` only when instrumentation is in scope. Use `$ab-testing` only for a genuine hypothesis and never test a coercive pattern against a safer baseline merely to maximize engagement.

## Dark-pattern rejection checklist

Reject or redesign a mechanic that uses:

- false scarcity, false urgency, or concealed expiry;
- streak loss, shame, or social pressure to force return;
- preselected spend, confusing currency conversion, or automatic paid retries;
- obstructed cancellation, downgrade, export, or deletion;
- random paid rewards, near misses, or spend-linked status;
- fake activity, fake popularity, fabricated mastery, or ambiguous verification;
- notification escalation after the user declines;
- complexity whose main effect is hiding value or cost.

## Convenium.Design-specific standard

Treat a mission as a creative contract, a squad as editable configuration, a playbook as a reusable proven setup, and Creative DNA as user-owned preference evidence. Reward the quality of those artifacts and the user's informed decisions—not raw token consumption or agent count.
