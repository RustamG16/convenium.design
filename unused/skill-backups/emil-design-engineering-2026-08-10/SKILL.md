---
name: emil-design-engineering
description: Refine an approved interface through purposeful component behavior, microinteractions, transitions, typography, spacing, states, and reduced-motion engineering. Use after concept selection and static hierarchy approval; do not use as an early concept generator or a reason to animate every element.
---

# Emil Design Engineering

Make the interface feel intentional, responsive, and alive without turning motion into decoration. Stabilize static hierarchy before adding transitions.

## Decide whether to animate

Animate only when it improves one of these:

- continuity across a state change;
- spatial orientation;
- cause-and-effect feedback;
- hierarchy or attention at the right moment;
- progressive disclosure or narrative timing;
- brand character without delaying the task.

If removing the animation changes nothing meaningful, prefer a simple CSS state or no motion.

## Define the interaction contract

For each interaction record:

- trigger and purpose;
- entering, active, exit, loading, empty, error, disabled, and focus states as applicable;
- duration, easing, delay/stagger, transform origin, and affected properties;
- interrupt/reversal behavior and repeated-use frequency;
- keyboard/touch behavior;
- reduced-motion result;
- performance risk and fallback.

Favor transform and opacity for frequent animation. Keep feedback immediate, navigation responsive, and sequences interruptible. Avoid scroll hijacking, cursor gimmicks that hide native affordance, and repeated long intro motion.

## Polish the system

Review type rhythm, optical alignment, spacing cadence, borders/radii, icon weight, crop behavior, contrast, focus treatment, hover/pressed states, and responsive interpolation. Reuse tokens and components instead of patching local exceptions.

## Implement in layers

1. Confirm static content and hierarchy.
2. Add interaction states.
3. Add the smallest purposeful motion.
4. Add GSAP only for approved sequencing complexity.
5. Verify keyboard, touch, resize, reduced motion, and repeated interaction.

Return the motion contract, changed paths, and browser evidence. Do not reopen the selected concept or add WebGL without its separate activation test.

