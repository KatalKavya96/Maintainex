# Maintainex: a contribution workspace with a clear next action

Research and proposal, 21 October 2026. This document does not change the running application.

## Product direction

Working hypothesis: Maintainex helps an open-source contributor or maintainer organize contribution work, retain context, and understand progress. Validate this with actual users before committing to larger features.

The core loop should be **capture → plan → act → record the outcome → review**. A successful visit ends with someone finding, advancing, or understanding real work. The product should feel useful even when the account has little data.

Keep the dark lime identity. Keep leaderboards, reports, repository discovery, quests, recommendations, and saved opportunities withdrawn. This proposal does not reverse that decision. Existing Pins remain a personal reference library, distinct from the removed opportunities catalogue.

## Evidence and limits

- Revisited Deep-ML's public homepage, catalogue and problem workspace through web sources; inspected the JavaScript-rendered problem catalogue in the browser. It exposed search, category/sort controls, difficulty/status shortcuts, consistent table columns, pagination, a goal-oriented Focus panel, and an activity calendar. Authenticated focus persistence and execution reliability were not retested.
- Used the earlier [Deep-ML inspection](../deep-ml-2026-10-21/README.md), which includes public-route screenshots and interaction notes, as supplementary evidence.
- Reviewed current Maintainex source, including Home, Dashboard, Activities, Schedule, Pins, StatCard, ActivityTable, the shell, and theme CSS. Code findings identify implementation behavior, not frequency or severity measured in a user study.
- No interviews, analytics analysis, task benchmarking, or formal accessibility audit were performed. Expected benefits below are hypotheses, not measured conversion or productivity gains.

## 1. What to adapt from Deep-ML

| Observed pattern | Proposed Maintainex adaptation | Boundary |
| --- | --- | --- |
| Catalogue rows use predictable fields and direct problem entry | A consistent contribution row with title, repository, state, date, and a clear detail link | Do not revive the removed repository/quest catalogue |
| Focus panel asks for a goal and advances one step at a time | A personal work queue with the next action written by the user | Start with deterministic due dates/status; avoid an unexplained recommendation algorithm |
| Problem workspace puts instructions, tools, notes and actions together | A work detail view containing context, next action, notes, blocker, source link and history | Keep code editing and review in GitHub/the user's development tools |
| Paths and projects connect steps to an outcome | Optional checklists inside a real scheduled work item | Public contribution paths require real content and remain deferred |
| Progress appears beside the relevant activity | Completion and outcome indicators close to work rows | Local completion must not imply a verified merge |
| Homepage demonstrates an actual task | Future public product page with a small, explicitly illustrative work preview | No fabricated activity counts, customer claims or live-looking demo records |

Sources: [Deep-ML catalogue](https://www.deep-ml.com/problems), [problem workspace](https://www.deep-ml.com/problems/23), [homepage](https://www.deep-ml.com/), [projects](https://www.deep-ml.com/projects/build-an-mlp-in-jax-from-scratch). These are design references, not evidence that copying their layout improves Maintainex.

## 2. Usability principles translated into rules

### System status and recovery

Nielsen's heuristics emphasize feedback, consistency, recognition, error prevention and recovery. Maintainex should distinguish loading, empty, filtered-empty, failed and stale states. A successful save needs confirmation; a failed save must retain the draft. Manual and GitHub-synced records need understandable source labels.

Rule: never render an API failure as an empty list. Never imply an upward trend without a real comparison. Show what changed and how to recover.

Source: [10 usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/).

### Progressive disclosure

Keep the main decision visible and place secondary detail behind an accessible expansion, menu or detail view. Examples: show five useful activity columns; put closing reason, internal IDs and uncommon metadata in the inspector. Keep filters discoverable and show active filter chips even when advanced controls are collapsed.

Rule: reduce simultaneous decisions without hiding the primary action or the current state.

Source: [Progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/).

### Gestalt proximity and common region

Spacing communicates relationships. Put an item's title, repository and next action close together; separate unrelated sections more strongly. Use a border when it represents a meaningful group, not around every label and number.

Rule: use spacing and alignment first, a container second. Avoid card-inside-card layouts unless the inner block is independently interactive.

Sources: [Proximity](https://www.nngroup.com/articles/gestalt-proximity/), [Common region](https://www.nngroup.com/articles/common-region/).

### Fitts's law and accessible targets

Target size and travel distance affect pointing effort. Put relevant actions near the selected item. Use a comfortable approximately 40–44px control height for primary touch actions as a product target; compact desktop controls may differ. WCAG 2.2 AA Target Size Minimum specifies 24 × 24 CSS pixels or qualifying exceptions, including spacing; it does not require every control to be 44px.

Rule: generous hit areas, predictable action positions, explicit keyboard access, and an alternative to drag-only interactions.

Sources: [Fitts's law](https://www.nngroup.com/articles/fitts-law/), [WCAG target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

### Aesthetic-usability effect

Visual appeal can increase perceived usability and can hide problems during evaluation. A quieter interface may improve the impression of maturity, but a positive aesthetic reaction does not prove tasks became easier.

Rule: evaluate appearance and task completion separately. Do not call a redesign successful only because people say it looks premium.

Source: [Aesthetic-usability effect](https://www.nngroup.com/articles/aesthetic-usability-effect/).

### Recognition and consistency

Keep terminology, button meanings and status semantics stable. Users should recognize where they are and what an item does. Proposed naming: Overview, Activities, Work, Pins, Organizations; Settings remains a utility destination. If community remains, label it Community rather than placing a social feed behind an ambiguous Home label.

Rule: one entity gets one name across navigation, search, forms and detail pages. This naming scheme is a proposal to test, not an instruction to remove working community functionality.

## 3. Why the current interface can feel like a demo

These are design assessments grounded in source review, not quantified usability defects.

| Current implementation | Implication | Proposed change |
| --- | --- | --- |
| StatCard always includes ArrowUpRight, whether or not a trend exists | Decorative arrows suggest movement or clickability without evidence | Neutral metric strip; trend only with an explicit baseline; link only if there is a destination |
| Metric color depends on words such as “repo”, “PR”, or “blocked” | Color semantics vary arbitrarily | Neutral values; stable status colors; lime for interaction/selection |
| Repeated heavy typography, colored borders and shadows | Many elements compete for attention | Weight 400/500 for body, 600 for emphasis; quieter borders; remove navigation glows |
| Home catches feed errors and sets an empty array | “No posts” can mean loading or network failure | Explicit state machine and contextual retry |
| ActivityTable has nine columns and a 980px minimum width | Title competes with metadata; narrow screens require extensive horizontal scrolling | Five core columns, optional columns and a responsive detail view |
| Schedule calculates metrics from up to 100 filtered items | Counts can look like workspace totals despite being a subset | Label counts as current results or calculate totals on the server; show scope explicitly |
| Home is a social feed and Dashboard is a separate destination | New users may land somewhere with no personal utility | Test Overview as the primary landing page, with community as a separate destination |
| Theme rules override utility classes with global selectors and !important | Components are harder to tune consistently across themes | Semantic surface/text/status tokens applied directly to components |

Relevant files: `client/components/dashboard/StatCard.tsx`, `client/app/page.tsx`, `client/components/activities/ActivityTable.tsx`, `client/app/schedule/page.tsx`, `client/app/globals.css`, `client/components/layout/AppShell.tsx`.

## 4. Three screen showcases to design first

These are proposed compositions, not implemented screens. Any example title below is illustrative copy, not a real user record.

### Showcase A: Overview — “What needs my attention?”

- Compact page heading, date/scope and one primary action: Add work.
- Three quiet summary measures: In progress, Due this week, Blocked. Define whether scope is all work or a selected view.
- Main section: attention queue. Tabs for Due, In progress and Blocked; order by explicit rules rather than opaque ranking.
- Each row: task title; owner/repository; next action; status; due date; Open action.
- Smaller secondary section: recent contribution records with links to evidence.
- Integration status near account utilities: last successful sync, running/failed state and retry when applicable.
- When empty: “No work planned” plus Add work and an optional link to existing GitHub connection settings. Viewer mode gets a clear read-only explanation.

What this demonstrates: the product's purpose without a wall of charts or a hero slogan inside the app.

### Showcase B: Work — “Plan and advance the contribution”

- A single toolbar with search, Status, Repository and Due date filters.
- List is the practical default; Board is an alternative using the same records and filters.
- A URL-addressable inspector opens from a row while preserving scroll, filters and selection; full detail route remains available.
- Inspector hierarchy: title → next action → source/context → notes → history; secondary metadata is collapsed.
- Example next action: “Reproduce the failure locally.” Example blocker: “Waiting for access to test data.”
- Explicit Save initially; add autosave only with Saved/Saving/Failed feedback and draft recovery.
- Mobile: full-width detail instead of squeezing a desktop drawer into a narrow screen.

What this demonstrates: a complete workflow with usable transitions and recovery.

### Showcase C: Activities — “Understand what actually happened”

- Title is the strongest column; repository is secondary text under it.
- Core columns: Contribution, Type, Status, Date, Source. Keep row actions in a labeled menu and provide a direct title link.
- Source labels describe origin: Manual entry or GitHub sync. A separate outcome label distinguishes Recorded, Submitted, Merged or Closed when supported by data.
- Do not equate “synced” with “high quality” or a manually marked Done with an accepted PR.
- Filters and selected range persist in the URL; result count and aggregation use the same scope.
- Opening an activity reveals a readable timeline and supporting source links.

What this demonstrates: trustworthy records that can support later analytics.

## 5. Component kit

| Component | Behavior worth implementing | Existing starting point |
| --- | --- | --- |
| AppHeader / PageHeader | Breadcrumb when useful, concise title, one primary page action, secondary actions in a menu | AppShell, PageTitle |
| MetricStrip | Label, value, scope, optional valid comparison; no decorative trend arrow | StatCard, MetricCard |
| FilterBar + FilterChip | Search, a few common filters, optional advanced filters, result count and Clear | ActivityFilters, ScheduledWorkFilters, discovery filters |
| ContributionRow | Title/repository hierarchy, text status, due date, direct detail link | ActivityTable, ScheduledWorkTable |
| WorkInspector | Context-preserving detail, next action, source, notes, blocker | Scheduled work detail page |
| StatusBadge | One semantic mapping; readable text and optional icon, not color alone | ActivityBadge and work status controls |
| SourceBadge | Explain origin and freshness; outcome is a separate concept | Activity and GitHub integration records |
| AsyncState | Loading, empty, no matches, failed, stale, unavailable, read-only | EmptyState and existing loaders |
| SyncStatus | Last success, currently running, failed, retry; no claimed success from a button click alone | GitHubAutomationPanel and sync APIs |
| NotesEditor | Dirty state, save confirmation, retained draft after failure | Work forms and detail page |
| CommandMenu | Grouped results and real navigation; keyboard list behavior | UserSearch and Search page |
| DataTable | Column priority, sorting, accessible actions, pagination and narrow-screen alternative | ActivityTable, ScheduledWorkTable |

Do not build a giant generic table framework before the first two real tables share a demonstrated need. Consolidate actual common behavior.

## 6. Feature priorities and dependencies

### First: make the existing product coherent

1. Reusable visual foundations: semantic color tokens, typography scale, spacing, borders, buttons, menus and focus treatment. No server work required.
2. Simplify shell and heading hierarchy. Resolve Home versus Dashboard. Test proposed labels with users before changing routes.
3. Redesign activity rows and the Work list. Preserve existing routes/API contracts and accessible direct links.
4. Fix misleading states and counts: feed loading/failure, metric baselines, filtered Schedule totals and table failure recovery. Some aggregate counts may need server support.
5. Add actionable empty states and explicit viewer-mode copy. No fake sample records in the authenticated workspace.

### Next: add power to retained workflows

| Feature idea | Why it earns space | Required implementation |
| --- | --- | --- |
| Continue work | Resume a user-selected item with context | Most-recently-edited/explicitly-selected personal work; do not present it as a recommendation |
| Deterministic attention queue | Surface due, overdue and blocked work | Defined ordering, explicit date/timezone, completed-item exclusion, accurate totals |
| Pin → planned work | Turn an existing personal reference into an action | Prefill source/title/context; handle duplicate submissions; retain link to pin |
| GitHub URL capture | Reduce repetitive form entry | Safe URL parsing, ownership/access checks, metadata lookup where supported, manual fallback |
| Blocker + next action | Record what is stopping progress and the next concrete step | Two distinct fields or a clearly scoped existing context structure; timestamp and editing |
| Saved filter views | Speed up repeated personal work review | URL-backed queries first; persisted named views later only if useful; not Saved Opportunities |
| Quick status change | Reduce navigation for routine updates | Inline accessible menu, pending/failure states, rollback, concurrency handling |
| Keyboard command menu | Faster navigation for frequent users | Existing search foundation, actionable labels, focus management and only shipped destinations |

### Later, after evidence of repeated need

Checklist templates for recurring work; personal weekly review based on real records; capacity-aware planning using user-provided estimates; a public portfolio backed by explicit visibility settings and source links. These are future ideas, not a request to restore Reports, Quests, recommendations or rankings.

## 7. Dark lime visual specification to prototype

These are proposed starting values, not accessibility-certified tokens.

- Canvas `#101111`; panel `#171818`; elevated surface `#1e2020`; border approximately `#2a2d2d`.
- Primary text `#f3f4ef`; secondary text approximately `#a5aaa6`; lime `#c9f43a` for primary actions, selection and focus.
- Amber for waiting/blocked, red for errors/destructive actions, muted green for confirmed completion. Pair every status with text; keep ordinary metrics neutral.
- One sans-serif family for interface text; monospace only for repository identifiers, shortcuts and aligned numeric data.
- Proposed scale: 28–32px page headings, 16–18px section headings, 14px body, 12–13px secondary metadata. Avoid using tiny text as the main density strategy.
- 4/8px spacing rhythm; 16–24px section padding; approximately 6–8px control radii, 8–12px panel radii. Use elevation for floating menus/inspectors, not every card.
- Approximately 48–56px comfortable table rows; optional denser desktop view only if requested by users. A mobile list must preserve title, status and action.
- Subtle transitions around 120–180ms as a starting point; respect reduced motion. Animation must communicate a state change or spatial relationship.
- Check normal text against 4.5:1 and large text against 3:1; test muted labels on actual surfaces. Validate focus and non-text controls separately. This document is not a WCAG conformance claim.

Sources: [WCAG text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [Focus appearance, AAA](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html), [WCAG 2.2](https://www.w3.org/TR/WCAG22/).

## 8. Validation and release rules

Use the same tasks before and after the redesign with both contributors and maintainers. Include first-time and returning users, keyboard use, narrow screens, empty accounts and realistic existing records. A small formative round can reveal problems but does not produce statistically reliable performance estimates.

Tasks:

1. Find the work item due soonest and explain its next action.
2. Find an activity for a particular repository and open its source.
3. Turn an existing pin into planned work without retyping its URL.
4. Identify a blocker, update the next action, save, and reopen.
5. Explain whether an outcome is manually recorded or supported by GitHub evidence.
6. Recover from a failed save or failed sync without losing context.

Record completion, time, errors, backtracking and user confidence. Establish a baseline before setting numerical improvement targets. Do not infer improvement from raw clicks alone.

A component is ready only when its primary action, keyboard behavior, responsive composition, persistence and relevant loading/empty/error states work. Counts must disclose their scope. Reversible actions can offer Undo; permanent deletion requires clear consequences and confirmation. Keep source-of-truth outcomes separate from personal planning states.

## Recommended next implementation slice

**A quieter shell + Overview + Activities table**, followed by **Work list/detail**. This fixes the visual foundation and gives the strongest existing workflows a coherent presentation before expanding the feature set. Keep the retained product useful at zero records and keep all six withdrawn features absent.
