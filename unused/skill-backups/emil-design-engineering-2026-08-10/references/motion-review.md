# Motion review

For every animated element ask:

- What user question does this answer?
- Does it run once, on demand, or repeatedly?
- Can the user interrupt or reverse it?
- Does the active/pressed state begin immediately?
- Does focus remain visible and logical?
- What happens for `prefers-reduced-motion: reduce`?
- Does it remain coherent when content wraps or viewport size changes?
- Does it animate layout/paint-heavy properties unnecessarily?
- Is GSAP providing sequencing/control value that CSS does not?

