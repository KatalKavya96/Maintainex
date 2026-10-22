# Frontend rules

Root AGENTS.md and `docs/architecture/README.md` apply.

1. Determine the owning feature and inspect its existing component inventory before adding UI.
2. Use `design-system` primitives for new shared actions, fields, badges, headers, tables and state panels. Use feature wrappers only for domain behavior.
3. Keep page composition, entity forms, side effects and transport separate. Do not solve repeated styling by adding theme-wide `!important` overrides.
4. New/edit entity flows reuse a form contract. List/board views reuse data and filter state. Preserve direct detail URLs.
5. Keep native semantics, visible labels, focus, adequate hit areas, reduced motion and narrow layouts. Destructive actions need clear consequences; never describe permanent deletion as undoable.
6. Run `npm run inventory:update --workspace maintainex-client` after source changes and review the diff. `npm run check` and builds must pass.
7. `/design-system` is an isolated, backend-independent reference, not an excuse to hardcode product records.
