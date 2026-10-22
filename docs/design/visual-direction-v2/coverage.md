# Page coverage

Generated raster mockups. This index records actual saved files, not implemented routes. Redirect aliases share their destination design; removed/coming-soon routes deliberately receive no new product surface.

| Design board | Screens | Status |
| --- | --- | --- |
| 00-public-home | New account-free public entry and labeled static preview | Saved |
| 01-overview-community-analytics-goals | Overview, contribution analytics, community, goals | Saved |
| 02-activities-record-detail-create-edit | Activity list, detail, create, edit | Saved |
| 03-work-list-board-detail-planning | Work list, board, detail, shared create/edit | Saved |
| 04-pins-library-detail-create-edit | Pins list, detail, create, edit | Saved |
| 05-organizations-repository-search | Organizations list/detail, repository detail, search | Saved |
| 06-settings-notifications-profile-security | Settings, notifications, own/public profile, edit/security | Saved |
| 07-auth-people-responsive-states | Optional sign-in/sign-up, people and connections, responsive/empty/error states | Saved |

## Route mapping

- `/` public-first entry is proposed for later auth/routing planning; the current live `/` remains unchanged. Existing social Home maps to Community.
- `/dashboard`, `/analytics` → Overview / Contribution analytics.
- `/activities`, `/activities/[id]`, `/activities/new`, `/activities/[id]/edit` → Activity board.
- `/schedule`, `/schedule/[id]`, `/schedule/new`, `/schedule/[id]/edit`, `/calendar` → Work board, with shared create/edit form. Calendar is currently an alias, not a separate calendar feature.
- `/pins`, `/pins/[id]`, `/pins/new`, `/pins/[id]/edit` → Pins board.
- `/explore/organizations`, `/explore/organizations/[slug]`, `/orgs/[orgName]`, `/repos/[org]/[repo]`, `/search` → Organization/repository/search board. Organization views share shell and row components while exposing route-appropriate data.
- `/profile`, `/profile/[username]`, `/profiles/[id]`, `/profile/edit`, `/profile/change-password`, `/settings`, `/notifications` → Profile/account board. Legacy analytics-style profile routes reuse profile/detail foundations.
- `/profiles`, `/profile/[username]/followers`, `/profile/[username]/following`, `/login`, `/signup` → People/optional-auth board. Followers/following use one shared connection list with distinct selection states.
- `/goals` → Goals composition on the Overview board. `/feed`, `/organizations`, `/repositories`, `/explore` are aliases where applicable; no extra invented page needed.
- `/badges` and generic `/coming-soon` are placeholder/utility routes, not redesigned feature destinations. Withdrawn reports/leaderboards/quest/recommendation/saved-opportunity/repository-discovery routes remain withdrawn.

## Review notes

Read `README.md` for the shared system and public-first requirement. Conceptual additions such as a public homepage, attention queue and URL-prefill must be implemented against actual contracts before being presented as functioning features. Use `prompts.json` for the full original prompt set; the strict v2 shared prompt overrides first-pass color conventions.

