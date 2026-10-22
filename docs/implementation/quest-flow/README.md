# Quest flow, unified search, and discovery layouts

Implemented on 21 October 2026, following the [Deep-ML investigation](../../research/deep-ml-2026-10-21/README.md). Maintainex keeps its charcoal surfaces and lime accent. Production screens use database/API records; the screenshots below use an isolated test fixture API.

## What changed

- **Quest discovery:** searchable, paginated task cards; difficulty and status filters in the URL; saved and completed states; an author-scoped archived view; useful loading, error, retry, and empty states.
- **Publishing:** contributors can publish tasks for organizations and active repositories in their own tracked workspace. A source link and acceptance criteria are required. The server checks organization/repository ownership. Publishing does not post to GitHub.
- **Quest workspace:** task brief and source, acceptance criteria, a private plan, blockers, contribution evidence, closing notes, and persistent progress. Mobile has a fixed action bar; changing sections preserves unsaved input within the page.
- **Start/resume:** a serializable transaction and unique keys link one user enrollment to one scheduled-work record. Repeated starts reuse the record. Deleted linked work can be restored without losing enrollment evidence.
- **Contribution lifecycle:** started, submitted, and completed, with explicit self-reported completion. Evidence URLs are validated. Completion does not create verified contribution points or claim a merged PR. Reopening preserves notes/evidence and clears completion timestamps.
- **Schedule integration:** quest work is available in Schedule, with a link back to its workspace. Marking work done or reopening it synchronizes quest progress. Partial schedule updates preserve unrelated context, links, plans, and notes. Saving quest notes preserves blocked planning state.
- **Availability:** authors can archive and restore their quests. Existing contributors retain their progress when a quest is archived. Availability is controlled by the author and repository state; this does not automatically check whether a linked GitHub issue has closed.
- **Search:** authenticated search covers organizations, repositories, quests, people, and the viewer's own work and pins. Public catalogue metadata follows the existing Explore visibility model. Private work/pin queries and their counts are scoped to the viewer. People search uses name, username, and bio, without selecting or searching email addresses.
- **Search interactions:** debounced requests, stale-request cancellation, loading/error/empty feedback, a real ⌘K/Ctrl-K shortcut, arrow-key selection, Enter navigation, Escape dismissal, and a full results page with result-type counts. Results are bounded; the page explains when a query needs refinement.
- **Cleaner organization discovery:** one filter disclosure, removable chips, one search/sort row, and distinct grid/compact-list views. Mobile navigation is collapsed behind a menu rather than occupying the top of every screen.
- **Dashboard:** a resumable quest callout and consistent time-range inputs for the metric cards and charts. Organization detail now opens on Overview and its quest action reaches the working catalogue.

## Routes and contracts

UI:

```text
/explore/quests
/explore/quests/new
/explore/quests/:id
/search?q=...&kind=...
```

New authenticated API endpoints:

```text
GET   /api/quests
GET   /api/quests/options
POST  /api/quests
GET   /api/quests/:id
POST  /api/quests/:id/start
PATCH /api/quests/:id/progress
PATCH /api/quests/:id/archive
PATCH /api/quests/:id/restore
GET   /api/search
```

Quest filters: `search`, `difficulty`, `status`, `page`, `limit`. Status values are `all`, `available`, `started`, `completed`, `saved`, and `archived`. Difficulty is an author estimate. Pagination and text lengths are validated server-side.

Search types: `all`, `organizations`, `repositories`, `quests`, `people`, `work`, `pins`. The minimum query is two characters. The API returns type counts and bounded result sets with local destination URLs.

## Database activation

The additive [migration](../../../server/prisma/migrations/20261021090000_quest_workspace/migration.sql) adds:

- Quest source URL and acceptance criteria.
- An optional unique link from a user quest to its scheduled work.
- Evidence URL and completion notes on the user's enrollment.
- A foreign key with `ON DELETE SET NULL`, so deleting work preserves the enrollment.

**The migration has not been applied to the configured database. Apply it through the project's database migration process before starting the updated backend.** For a database already managed by Prisma migrations, the release commands from `server/` are:

```sh
npx prisma migrate deploy
npm run prisma:generate
npm run build
```

The project README also documents a `prisma db push` setup. Use the migration workflow appropriate to that database's existing history; no database reset or live schema mutation was performed for this implementation.

No new runtime dependencies were added. The existing modified `server/.env` was left untouched.

## Verification

- Frontend optimized production build, including type validation and static page generation.
- Backend TypeScript build.
- Prisma schema validation, with a dummy test URL and no database connection.
- Prisma-generated schema diff compared with the checked-in SQL migration.
- `git diff --check`.
- **16 service/HTTP regression tests** using an in-memory adapter. These cover repeated/concurrent service starts, bounded serialization retries, per-user progress, archive/restore ownership, unavailable tasks, restoration of deleted work, submission/completion/reopening, blocked-state preservation, safe URLs, private search rows/counts, partial updates, schedule synchronization, and actual Express authentication/validation routes.
- Browser interaction checks against a separate in-memory fixture server: publishing, starting, saving a plan, marking blocked, submitting evidence, self-reported completion, persistence through browser reload, archiving/restoring, keyboard search, full search results, mobile navigation, filter disclosure, URL-backed technology selection, and compact list view.
- Visual checks at the default 1280px desktop viewport and explicit 375px mobile / 768px tablet sizes. The tablet organization page had no horizontal document overflow. Temporary viewport overrides were reset afterward.

The service adapter serializes its transactions. It tests application behavior and request contracts; it does not replace running the migration and exercising concurrency against an actual PostgreSQL database. No configured database or production inventory was queried or changed.

Run the regression suite:

```sh
npm test --workspace maintainex-server
```

Test-only fixture and preview helpers are in `server/tests/`; the production application does not import them. The visual-test API uses a separate loopback port and an isolated `.localhost` hostname to keep its session separate from ordinary localhost development sessions.

## Screenshots

All visible records in these captures are **test fixtures**, not production organizations or activity.

| View | Evidence |
|---|---|
| Quest catalogue | [Desktop](./screenshots/quest-catalogue-desktop.jpg), [mobile](./screenshots/quest-catalogue-mobile.jpg) |
| Quest workspace | [Desktop brief](./screenshots/quest-brief-desktop.jpg), [mobile brief](./screenshots/quest-brief-mobile.jpg) |
| Final workspace | [Desktop](./screenshots/quest-workspace-desktop.jpg) |
| Private plan and blocked state | [Desktop](./screenshots/quest-plan-desktop.jpg) |
| Explicit self-reported completion | [Desktop](./screenshots/quest-completed-desktop.jpg) |
| Keyboard search | [Desktop](./screenshots/search-keyboard-desktop.jpg) |
| Full search | [Desktop](./screenshots/search-results-desktop.jpg), [mobile](./screenshots/search-mobile.jpg) |
| Single advanced-filter surface | [Tablet](./screenshots/organization-filters-tablet.jpg) |
| Compact organization results | [Tablet](./screenshots/organizations-compact-tablet.jpg) |

The captures were taken during the interaction checks; some predate final text-only polish such as singular result labels and the archived filter.
