# Maintainex — mandatory repository boundaries

Read `docs/architecture/README.md` and `docs/design/inventory/README.md` before changing code. More specific AGENTS.md files add rules within their directories. Explicit current human instructions take precedence; historical `Project.md` requirements do not override current decisions.

## Scope and product boundaries

- Complete only the requested scope. Do not add dependencies, infrastructure, new product surfaces, destructive migrations, public exposure or restored features as incidental refactoring.
- Keep reports, leaderboards, repository discovery, quests, recommendations and saved opportunities withdrawn unless the human explicitly authorizes reactivation.
- Public entry must ultimately be account-free. Public/private routing is deferred; do not introduce new account walls or silently change existing workspace auth while doing unrelated work.
- Production records/counts must come from real authorized data. Isolated design examples must be visibly labeled. Never turn a failed request into a fictional success or fake content.
- Do not print or modify secrets/environment files incidentally. Preserve unrelated working-tree changes.

## Mandatory architecture

- `client/app/**/page.tsx` only re-exports one owning feature screen. No business logic, hooks, fetching or bespoke UI in route adapters.
- Feature behavior/UI belongs to `client/features/<owner>`. Cross-feature imports use the target's public `index.ts`; no private imports or computed module loading.
- Reuse the design system. Palette/foundation values belong only in `client/design-system/tokens.css`; no raw colors or arbitrary bright palette utilities elsewhere.
- Design primitives do not import features, shell, state or data. Data does not import UI. Shared utilities remain independent of feature behavior. No dependency cycles.
- HTTP uses `client/data/http.ts` and typed owning API modules. Do not add APIs to or import the compatibility `lib/api.ts` barrel.
- Keep new source modules within the checked 350-line budget. Split responsibilities rather than minifying code to evade the limit. Do not expand the fixed quarantine allowance for withdrawn Reports.
- Preserve public contracts with adapters when needed. Prefer extension through components, variants, typed columns and registries over editing unrelated pages.

## Inventory, validation and policy integrity

- Update contracts/revisions for intentional shared design changes; add representative examples; regenerate and review the inventory. Never hand-edit generated inventory to conceal drift.
- Run `npm run check`, the client build, targeted behavior checks, and affected backend build/tests before declaring completion. Inspect affected browser states for visual work.
- Do not weaken checks, disable tests, alter thresholds, add blanket exceptions or mislabel unreviewed components to make a change pass. A policy/boundary change needs explicit human scope and a documented ADR, not an inferred convenience exception.
- Report failures/limits accurately. Local rules and CI are guardrails; do not claim they are an absolute security sandbox or that remote branch protection is configured without evidence.
- Do not commit, push, deploy, apply database migrations, or change hosting settings merely to finish a local refactor unless authorized.
