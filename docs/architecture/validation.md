# Refactor validation — 22 October 2026

## Automated

- Architecture/inventory checks: 127 exported component entries and 49 thin route adapters. This includes compatibility adapters, existing feature components and withdrawn implementations; it does not mean 127 independently visually redesigned primitives.
- 13 architecture tests: layer boundaries, public feature contracts, relative/dynamic import bypasses, route thinness, raw colors, HTTP location, CSS tokens, cycles, unresolved aliases, computed module loading, frontend/server separation, and inventory drift.
- TypeScript with unused-local checking: passed.
- Production client build: passed, including architecture prebuild check.
- Backend TypeScript build: passed.
- Existing isolated backend suite: 16 service/HTTP tests passed. No configured database migration or seed was applied.
- Whitespace/diff checks: passed.

## Browser inspection

- `/design-system` renders its isolated examples and source inventory without an account gate.
- Primary-button example updates its feedback region.
- Component-ID search finds `design-system.Button` and its documented variants.
- Labels/descriptions and invalid/disabled form examples are represented in the accessible UI. This is targeted inspection, not a formal accessibility conformance audit.
- Desktop Activities and shared shell checked at 1280px; light/dark toggle and sidebar collapse/expand work, with no page overflow.
- Mobile Activities and shared shell checked at 433px; navigation opens/closes and contains only retained destinations, with no page overflow.
- Screenshots are in `docs/design/inventory/screenshots/`.

## Limits

Existing backend/private-data/auth contracts and withdrawn-feature redirects are preserved. Real destructive actions and account edits were not exercised. The new data-module split preserves endpoint payloads; large private-data lists were not benchmarked. The public site routing plan remains deferred; only the isolated design reference is newly public. Many source-inventoried feature units explicitly retain `visual review pending` status. Future visual redesigns should update those contracts individually rather than treating a generated source inventory as visual approval.

CI configuration is provided but was not executed on a remote host. Required-check/branch protection settings were not changed. Repository policy/checks can detect violations in normal workflows; they are not an absolute sandbox against deliberate edits to the checks themselves.

Workflow action versions were checked against the official [checkout documentation](https://github.com/actions/checkout) and [setup-node documentation](https://github.com/actions/setup-node). CI itself still needs to run remotely.
