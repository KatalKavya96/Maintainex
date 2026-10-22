# ADR 0001: feature-owned screens and a shared design system

Status: accepted for this implementation. Date: 22 October 2026.

## Context

Page files combined fetching, state, domain controls and presentation. Repeated color/shape rules and an API monolith made local changes propagate unpredictably. The user requested reusable elements, a persistent inventory, explicit architecture and strict agent boundaries.

## Decision

Move route implementations to feature-owned screens, keep route adapters thin, separate pure design primitives from application state and typed data access, expose cross-feature UI through public exports, and inventory the source automatically. Centralize visual values in semantic theme tokens. Enforce boundaries, cycles, source budgets and inventory freshness during checks/builds and CI.

## Consequences

A shared Button or field can change without rewriting pages. Feature forms remain owned by their domain. New variants and navigation entries use explicit registries. Source moves change paths, so old imports are migrated together; compatibility adapters preserve existing component props. The inventory records source and consumers but does not substitute for behavior/accessibility testing. The system intentionally avoids runtime feature-plugin loading and dependency-injection frameworks that this application does not need.

## Limits

The backend's existing module structure remains in place. Public-entry/auth planning and activation of withdrawn features are separate decisions. A documented fixed size allowance exists only for the withdrawn legacy Reports implementation. Guardrails cannot make repository policy tamper-proof; protected review/required CI is a hosting configuration responsibility.
