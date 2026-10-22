# Maintainex implementation backlog from the Deep-ML investigation

All items below are **proposals**, not completed application changes. Effort bands are relative: S = localized change, M = several connected components/services, L = a feature spanning schema, API, and UI. They are not calendar estimates. Priorities reflect dependencies and current product gaps.

## Recommended first delivery

Deliver a real quest discovery → detail → start → scheduled work → resume flow, supported by truthful search and consistent page layouts. Keep manual work completion distinct from GitHub-verified acceptance. Use existing records; show honest empty states when no suitable tasks exist.

| Order | Work | Priority | Effort | Dependency |
|---|---|---|---|---|
| 1 | Align header search promise and shortcut | P0 | S | None |
| 2 | Standardize discovery layout and page hierarchy | P0 | M | None |
| 3 | Complete real quest browsing and detail | P0 | L | Data coverage review |
| 4 | Start/resume quests through scheduled work | P0 | L | Quest detail, lifecycle design |
| 5 | Next-action dashboard | P1 | M | Reliable work links; can begin with existing schedule |
| 6 | Unified entity search | P1 | M–L | Entity visibility and query contracts |
| 7 | Public entry and public discovery | P1 | L | Explicit public-data projection |
| 8 | Contribution tracks and ordered plans | P1 | L | Quest lifecycle, versioned membership |
| 9 | Capacity/deadline planning | P2 | L | Tracks and persistent work links |
| 10 | Contextual assistance with linked actions | P2 | M–L | Typed suggestions and grounded source data |
| 11 | Transparent scoring and verified awards | P1 before competition | L | Evidence rules and event deduplication |
| 12 | Accountability groups/campaigns | P3 | L | Verified outcomes and demonstrated user need |

## 1. Align search with what it actually does

**Problem:** header copy describes organizations/projects/technologies, but the component loads profiles and filters them in memory. It displays ⌘K without implementing a shortcut in that component.

**First change:** label it developer search until entity search ships. Add a working platform-appropriate shortcut, Escape dismissal, keyboard result navigation, focus restoration, and an accessible result-list pattern. Do not expose email in result previews or broaden profile visibility.

**Existing files:** [UserSearch](../../../client/components/layout/UserSearch.tsx), [AppShell](../../../client/components/layout/AppShell.tsx).

**Acceptance:** typing matches the stated scope; keyboard users can open, navigate, choose, and dismiss results; loading, error, and no-match states are distinct. Check for shortcut conflicts with active editors.

**Validation:** component interaction checks for shortcut/open/select/dismiss and keyboard navigation; verify the visible label against the real result types.

## 2. Simplify discovery and establish shared hierarchy

**Change:** introduce a consistent discovery header and filter toolbar. Replace the duplicated organization sidebar/top dropdowns with one advanced-filter surface and active chips. Keep server-backed pagination, sorting, and filters. Make the current grid/list choice produce a meaningfully compact list rather than the same large card in one column.

**Reuse:** [OrganizationFilters](../../../client/components/explore/OrganizationFilters.tsx), [OrganizationCard](../../../client/components/explore/OrganizationCard.tsx), [organization discovery](../../../client/app/explore/organizations/page.tsx), [PageTitle](../../../client/components/common/PageTitle.tsx), [theme](../../../client/app/globals.css).

**Behavior:** debounce text entry; cancel or ignore stale requests; preserve prior data during refresh; reset page on filter changes; support direct links and reload. Provide one-click reset and a clear result count. Keep zero different from unavailable metrics.

**Acceptance:** filters appear once, selected filters survive a refresh, no-match results explain how to recover, and the narrow layout leaves room for actual results. Proposed 375/768/1280px verification sizes are targets, not already-tested breakpoints.

**Validation:** URL-to-filter round trip, rapid query changes with deliberately reordered responses, page reset, empty/error/retry states, keyboard filter use, and responsive visual review. Cosmetic spacing changes do not need implementation-mirroring unit tests.

## 3. Complete quest discovery and detail

**Problem:** `/explore/quests` redirects to Coming Soon. Existing endpoints list quests only within an organization. `QuestCard`'s primary action leads to Coming Soon.

**Reuse:** [quest route](../../../client/app/explore/quests/page.tsx), [QuestCard](../../../client/components/explore/QuestCard.tsx), [Explore routes](../../../server/src/modules/explore/explore.routes.ts), [Explore service](../../../server/src/modules/explore/explore.service.ts), [schema](../../../server/prisma/schema.prisma).

**Proposed contracts, not existing endpoints:**

```text
GET /api/explore/quests?search=&organization=&difficulty=&type=&status=&page=&limit=
GET /api/explore/quests/:id
```

A result should include identity, source organization/repository, title, type, difficulty with its basis, current availability, source URL, freshness, and the viewer's saved/started state. Detail should add context, prerequisites, acceptance criteria, and the expected evidence type.

Do not treat an issue's `good first issue` label as a guaranteed effort estimate. If duration is editorial, label it an estimate. Require a real external source or explicit maintainer-authored criteria before exposing a Start action.

**Acceptance:** a user can find a real task, inspect why it is suitable, open its source, save it, and see when it is closed or unavailable. No populated database means an empty state with useful next steps.

**Validation:** filter/pagination correctness, inactive and missing records, visibility rules, missing metadata, and closed/changed source issues.

## 4. Connect start/resume to existing scheduled work

**Proposed commands:**

```text
POST /api/quests/:id/start
GET  /api/quests/:id/progress
POST /api/quests/:id/evidence
```

Starting should create or return one user enrollment and its linked scheduled work in a transaction. Repeated requests must not duplicate work. `UserQuest` currently exists but has no scheduled-work/evidence relation. Add explicit relations rather than inferring ownership or identity from titles.

Model a typed lifecycle such as started → in progress → submitted → accepted, with blocked/abandoned alternatives. Define which events or roles can make each transition. Existing work statuses can remain the planning state; quest outcome is a separate concern.

**Reuse:** [schema](../../../server/prisma/schema.prisma), [scheduled-work module](../../../server/src/modules/scheduledWork/scheduledWork.service.ts), [schedule detail](../../../client/app/schedule/[id]/page.tsx).

**Acceptance:** Start becomes Continue after enrollment; work resumes at the same URL; submitting evidence records its source; manual completion is labeled; accepted status requires the appropriate trusted evidence. A closed issue does not erase notes or history. Keep actions inside Maintainex unless the user explicitly opens GitHub to act there.

**Validation:** ownership checks, concurrent starts, transaction rollback, stale issue state, evidence replacement, repeated/out-of-order GitHub events, and cross-user isolation.

## 5. Give the dashboard one explainable next action

**Change:** add a compact focus section above the trends: overdue or due work, a resumable task, and an optional recommendation. Include “Why this?” and direct links. Let users dismiss or choose a different item.

Start deterministically with existing schedule and goals; no LLM is necessary. Define a stable ordering: explicit active focus, urgent scheduled work, then suitable saved work. Avoid steering everyone toward their already most-active repository by default.

**Reuse:** [Dashboard](../../../client/app/dashboard/page.tsx), [GoalPanel](../../../client/components/dashboard/GoalPanel.tsx), [contribution plan/coach service](../../../server/src/modules/ai/ai.service.ts).

**Acceptance:** no invented work, one clear primary CTA, meaningful explanation, an empty-state action, and a consistent selected time range across dashboard counts and charts. Use the same range boundaries in both calculations.

**Validation:** empty, overdue, tied, completed, and stale candidates; selected-range counts; local-date boundaries; direct navigation to the referenced work.

## 6. Add unified search after entity contracts are reliable

**Proposed endpoint:** `GET /api/search?q=&kind=&cursor=&limit=`.

Return a typed union with stable entity ID, kind, title, subtitle, approved local URL, and optional source/freshness metadata. Counts must use the same permissions and query semantics as results. Start with PostgreSQL-backed matching and measured indexes; no separate search vendor is required by this design.

Public entities and private Work/Pins require different visibility rules. Only return a user's own private records. Validate and cap parameters. Handle a changed query canceling an older request.

**Acceptance:** one query reaches relevant organizations, repositories, quests, and people; type tabs work; reload/return preserves query state; no private results leak to another user or a logged-out request.

**Validation:** permission matrix, count/result consistency, empty and long queries, cursor behavior, keyboard operation, and a realistic data-volume query plan.

## 7. Separate public discovery from the member app

**Problem:** `AppShell` redirects every route except login/signup when no user exists. Explore routes are protected with `requireAuth`. Viewer mode is an existing entry path, not an already-public discovery API.

**Change:** create an explicit public shell and read-only public projection for approved organization/repository/opportunity records. A route group can separate shells without necessarily changing user-facing URLs. Decide the member landing route and preserve existing links deliberately.

**Do not simply remove authentication from the existing Explore API.** Public data must exclude user-owned relationships, saved states, profile emails, private GitHub material, and private notes. Personalization and saves remain authenticated.

**Acceptance:** visitors can assess value and inspect safe opportunities; sign-in is requested at saving/starting; after login they return to the intended task. No fake preview records or inflated public counts.

**Validation:** logged-out requests, private/public projections, login return destination, crawler-visible content, empty inventory, and unavailable source records.

## 8. Add tracks with real ordered membership

**Model proposal:** Track → versioned TrackStep records referencing approved quests/resources. Enrollment stores the user, content version, status, and current position. Step progress stores completion kind and evidence. Named personal plans can reference the same entities, but editorial track definitions and private user plans have different ownership.

The existing `Collection` summary model does not supply these relations. Add an explicit membership table; do not store a count and assume it proves actual membership. Calculate progress from eligible members and recorded completion.

**Acceptance:** users can inspect the outcome and prerequisites, start, resume, and see evidence. Reordering or replacing an unavailable task preserves completed history. Progress in the shared underlying task should reconcile consistently wherever referenced.

**Validation:** enrollment uniqueness, version changes, reordered/removed steps, expired issues, resource-only steps, repeated completion events, and private plan access.

## 9. Plan by capacity and deadline

**Change:** accept target date, time zone, minutes/week, scope, and rest days. Generate a draft schedule over existing task IDs. Label unknown durations, avoid exact completion promises, and explain an overloaded target. Persist only when the user chooses to save the plan.

**Acceptance:** changing the target recalculates remaining workload; completed work stays completed; existing calendar commitments are not silently overwritten; overdue plans suggest a revised scope. A PR acceptance date remains outside the planner's control.

**Validation:** past deadlines, zero capacity, large tasks, user-local midnight, time-zone changes, rest days, and replanning after partial completion.

## 10. Make assistance actionable and grounded

**Contract proposal:** extend coach output with typed suggestions containing `entityId`, `entityKind`, `reason`, `sourceRefs`, `freshness`, and an approved action enum. Resolve destination URLs server-side. Keep text-only fallback responses valid.

Reuse the existing deterministic service for recommendations it can support. Introduce model-generated explanation only when it adds value, and show which source data it used. Treat external issue/repository text as content, never as instructions to the app. A suggestion can draft a schedule action; saving remains a normal explicit user action.

**Acceptance:** every recommended task exists, is visible to the user, is still available, and has a working destination. Uncertainty and missing context are visible. No claim of inspecting private code or the live PR body unless it was actually fetched.

**Validation:** nonexistent or stale IDs, denied entities, malicious source text, unavailable assistance, unsupported questions, and action-state recovery.

## 11. Explain and harden scoring before expanding competition

**Reuse:** [scoring service](../../../server/src/services/scoring.ts), [leaderboards service](../../../server/src/modules/leaderboards/leaderboards.service.ts), Prisma `ScoreEvent` and GitHub integration records.

Separate repository suitability from contributor achievement. Explain each score's inputs and time window. Self-reported activity can remain useful for private progress, but should not automatically be indistinguishable from verified accepted contributions in competitive rankings.

Add deterministic event identities for awards, an auditable score ledger, and explicit handling of replays/reversals. Remove high-value awards that can be obtained merely by changing a title keyword. Do not use language/framework popularity as a proxy for contribution quality.

**Acceptance:** users can understand why points were awarded; repeated webhooks do not grant repeated points; the same ranking window and filters produce consistent results; incomplete data is disclosed.

**Validation:** duplicate deliveries, edited titles, manual versus synced activity, stale imported scores, corrections, and zero-activity periods.

## 12. Community and collaboration: defer until useful

Build lightweight accountability with existing follows, comments, goals, and notifications first. An optional weekly contribution group is a reasonable later experiment. Publishing lists, joining groups, and receiving reminders should be deliberate user choices.

A standalone forum or chat requires moderation/reporting, spam controls, blocking, retention decisions, and notification preferences. A campaign needs real tasks and a responsible maintainer. Do not create empty competitive surfaces to fill navigation.

## Release checklist for the first useful slice

- Real inventory and source/freshness metadata.
- Clear ownership and public/private boundaries.
- Working browse/detail/start/continue destinations.
- Idempotent enrollment and linked scheduled work.
- Explicit manual versus verified outcomes.
- Keyboard, focus, narrow-screen and reduced-motion behavior.
- Loading, empty, error, retry, stale and unavailable states.
- Events for discovery, save, start, resume and evidence outcomes, with a documented denominator and deduplication.

No application tests or build were run for this research-only change. Future implementation should validate the affected slice using the targeted checks above, rather than adding broad tests that only mirror presentation code.
