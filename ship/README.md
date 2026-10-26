# The ship console

A 2D, dependency-free view of the Convenium.Design system: the crew are the agents, the
ships are the workflows. Open `ship/index.html` in a browser — no server or build step.

## What is what

| On screen | In the system |
|---|---|
| Crew member | An agent in `library/agents/` (one character each, authored in `library/registry/crew.json`) |
| Ship | A workflow (trail) from `library/registry/workflows.json` — SS Full Run, SS Abridged, SS Mobile Retrofit |
| Loadout slot | A question from `library/registry/slots.json` whose answer swaps a skill |
| Skill chip | A record in `library/registry/skills.registry.json` |

"Hire a replacement", the ship choice and loadout picks are stored in the viewer's
browser (localStorage) only. They change the characters and presentation, never the
pipeline: the agents, routing and defaults stay whatever the library says.

## Keeping it true — rule for agents working in this repo

`ship/data/ship-data.js` is **generated**; `index.html`, `style.css`, `ship.js` and this
README are source. Any change to agents, skills, routing, doctrines, crew or workflows
must reach the console in the same change:

1. Edit the source of truth — `library/agents/`, the registry, `library/registry/crew.json`
   (a new agent needs a crew entry; `verify.py` enforces the one-to-one mapping), or
   `library/registry/workflows.json` (a new workflow needs a ship entry).
2. Rebuild: `python library/tools/project.py ship` (or `all`).
3. `python library/tools/verify.py` — fails when the console data is stale.

Never edit `ship/data/` by hand.
