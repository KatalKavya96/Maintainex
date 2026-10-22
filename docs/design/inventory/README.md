# Design inventory and component lifecycle

Open `/design-system` on the running app for live primitive examples and the searchable component inventory. This reference page does not need an account or backend; all examples are explicitly labeled.

## Sources of truth

- `client/design-system/tokens.css`: runtime color, spacing, typography, radii and related semantic values.
- `client/design-system/primitives/`: reusable native controls and presentation contracts.
- `client/design-system/components.css`: shared visual states for those primitives.
- `client/design-system/contracts.json`: reviewed variants, states, descriptions and revisions.
- `client/design-system/inventory.json`: generated IDs, owners, paths, variants, states, source hashes, direct consumers and route coverage.
- `docs/design/visual-direction-v2/`: approved direction and generated page boards. Image text/counts are illustrative and are not implementation contracts.

The inventory contains both migrated core controls and existing feature components. Review status is explicit: `implemented and catalogued` indicates core primitives are in the live reference, while `visual review pending` identifies source-discovered units that still need individual design review. Do not mark all entries reviewed merely because inventory generation succeeds.

## Updating one element

For example, to change every primary button: edit the shared Button component or its semantic CSS, inspect its variants in the reference page, bump its contract revision, regenerate inventory, run checks, and review representative consumers. Do not edit page layout files to copy the new style. A feature-specific behavior change belongs to its owning feature, not to the generic Button.

Stable IDs include ownership and exported symbol name. Renaming a public component or changing ownership changes its generated ID and is a documented migration; preserve an adapter when callers must remain compatible. Source hashes ensure an implementation change cannot leave the checked-in inventory silently stale.

## Required contract review

For a newly shared primitive, document the purpose, owner, prop contract, variants, semantic states, keyboard behavior, label/description associations, responsive behavior and intended consumers. Add a live example. For a domain-specific element, document its data contract, ownership, empty/error/loading behavior and integration exports before promoting it to shared UI.

Meaningful review states include default, hover, focus-visible, disabled, loading, invalid, empty, failed and ready, where applicable. A native table delegates loading/empty handling to its feature; do not claim those are rendered internally. Numeric metrics require a real scope and comparison before showing a trend. Source provenance and contribution outcome are distinct concepts.

## Adding a page

Add a screen to `features/<owner>/screens`, compose existing controls and domain components, and add a route that only re-exports that screen. Do not create new global style overrides. API operations belong to the owning `data/api` module. New cross-feature integration must use the target feature's public `index.ts`.

Regenerate with `npm run inventory:update --workspace maintainex-client`; verify with `npm run check`. Generated inventory is checked in and reviewed like code. Review the actual diff, not just the command's exit status.
