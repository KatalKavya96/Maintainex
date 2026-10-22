# Design system ownership

Root/frontend rules apply. This directory is the single source of reusable presentation.

- `tokens.css` alone owns raw visual colors. Change semantic values deliberately across both themes. Danger is a single semantic exception, not a category palette.
- Components accept presentation/data via typed props. No fetching, application state, auth, feature imports or route-specific decisions.
- Add variants to existing controls before creating lookalike primitives. Do not mutate DOM globally inside a primitive.
- Preserve native semantics and caller props/ref support. Labels, hints and errors must remain accessible.
- Update `contracts.json`, representative reference examples and inventory for intentional shared changes. Do not claim review status or accessibility verification that has not occurred.
