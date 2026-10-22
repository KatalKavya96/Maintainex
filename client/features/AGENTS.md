# Feature ownership

Root/frontend rules apply.

- Own screens, domain components, hooks and forms inside one named feature.
- Route files re-export screens; do not move behavior back into `app`.
- Export only needed integration contracts from `index.ts`. Other features never import internals, including via relative paths.
- Prefer explicit props and typed API operations. Avoid global service locators, runtime plugins and speculative abstractions.
- Each real workflow needs honest loading/empty/error behavior and recovery. Keep draft/persistence changes local to the owning feature.
- Do not restore withdrawn features while reusing their archived code or inventory entries.
