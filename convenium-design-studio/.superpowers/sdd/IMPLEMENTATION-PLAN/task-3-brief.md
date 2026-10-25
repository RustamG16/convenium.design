### Task 3: Build the new shell and navigation

- [ ] Write failing behavior tests for Home, Projects, Plan, Playground, Results, Knowledge, System, Agents and Settings routes.
- [ ] Implement the common shell, active-project header, actionable status area and responsive navigation.
- [ ] Implement the exact global route order and ownership from `CONTINUOUS-UI-CONTRACT.md`; nested project views must not appear as competing global products.
- [ ] Add the persistent route trail `Projects / {project} / {view}` and expose the current stage and next mandatory action.
- [ ] Add page ownership, deep links, keyboard shortcuts, visible focus and focus restoration.
- [ ] Preserve legacy routes or provide tested redirects.
- [ ] Add empty, loading, offline and unavailable shell states.

Binding implementation contract: `.olympus/06-build-plan.md` and `design.json`. Preserve current app APIs and all existing data. Make additive modules and styles where viable; do not attempt Tasks 4–10 in this task. The exact navigation order is Home, Projects, Plan, Playground, Results, Knowledge, System, Agents, Settings. At >=820px use one fixed 210px rail; below that replace it with a compact drawer while preserving current route, stage, next action, and Oracle access. The existing Oracle must remain accessible but Task 4 owns its full behavior.
