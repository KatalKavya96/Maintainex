# Deep-ML → Maintainex: product and interface investigation

Investigated on **21 October 2026**. Scope: public website inspection, selected interaction tests, and comparison with the local Maintainex source. This is a research deliverable; application behavior has not been changed.

**Follow-up:** the subsequent quest/search/layout implementation is documented in the [implementation guide](../../implementation/quest-flow/README.md). The findings below describe the code as it stood during the investigation.

## The recommendation

Make Maintainex better at helping someone **choose and finish their next contribution**. Deep-ML is a useful reference because discovery, guided work, and progress feel like parts of one product. Maintainex already has much of the underlying vocabulary—organizations, repositories, quests, saved opportunities, scheduled work, goals, contribution records—but several transitions remain unfinished.

Start with **truthful search, compact discovery, a next-action dashboard, and a complete quest journey**. Add contribution paths once individual opportunities can be started, resumed, and verified. Preserve Maintainex's charcoal/lime identity.

Read the [implementation backlog](./implementation-backlog.md) for dependencies, file locations, suggested contracts, acceptance criteria, and validation. The [inspection inventory](./inspection-inventory.json) records coverage and confidence. Screenshots are in [screenshots/](./screenshots/).

## Method and limits

- Inspected 20 distinct public routes/views using rendered browser content, screenshots, and accessible controls. Also fetched public page text and the official problem-bank repository.
- Initially observed the homepage at desktop width; subsequent browser captures were approximately 433 pixels wide. Saved screenshots document the narrow layout. This is not a comprehensive breakpoint or accessibility audit.
- Exercised the Easy catalogue filter, global search, a path-book preview, interview deadline selection, leaderboard mode switching, public playlist exploration, and execution/assistant entry points.
- No account was created. Buddy interaction, authenticated progress persistence, paid features, purchase flows, sharing mutations, and cross-device behavior were not tested.
- Maintainex findings below come from source review, not a live authenticated database session. Existing code or schema does not establish that production data is populated.
- Some routes first displayed skeletons and populated afterward. Navigation timeouts sometimes occurred even though the route subsequently loaded. This environment does not support reliable performance conclusions.
- The problem-page execution entered a running state; a completed result was not observed before navigating away. The homepage Run later returned “compute unreachable.” The study starter appeared as a message, but a completed assistant answer was not observed. These observations do not establish typical reliability or the underlying cause.
- Robots and sitemap could not be retrieved through the web tool; this is a curated investigation, not an exhaustive crawl or a bulk copy of the catalogue.

## 1. What makes the experience worth studying

### A. The homepage demonstrates the core activity

The opening pairs a direct promise with a small editable Python exercise, a Run action, and example checks. Lower sections introduce capabilities through miniature experiences and link to the full product. A restrained monochrome palette, monospace display type, and patterned graphics give it a recognizable developer identity. Some demonstrations are explicitly samples. [Homepage](https://www.deep-ml.com/)

**Maintainex adaptation:** a public entry page with the proposed headline “Find your next open-source contribution.” Pair it with a real, public opportunity preview containing the repository, task, supporting signals, and a useful next action. Offer **Explore opportunities** and **Connect GitHub**. Do not require a visitor to understand the entire dashboard first.

The preview must read from an approved public-data API. If no public records exist, show a useful explanation and a browse action; do not invent organizations, activity, testimonials, or impact numbers. Maintainex's `Project.md` explicitly requires real API/database data.

Keep this page separate from the signed-in activity feed. A future route-group split can give public discovery its own shell while preserving the existing home/feed destination for members.

### B. Discovery has an efficient working layout

The problem catalogue combines search, category and sort selectors, short status/difficulty filters, a daily task, a table, pagination, and a focus/activity area. Selecting Easy changed the address to `?difficulty=easy` and replaced rows. At narrow width, the introductory cards become a horizontally browsable strip and the controls stack. [Problems](https://www.deep-ml.com/problems)

**Maintainex adaptation:** make quests and repositories fast to scan. Offer a compact list for comparison and richer cards when exploration benefits from description. Show task title, `owner/repo`, type, difficulty basis, availability, and saved/started state. Keep one primary action per row.

Maintainex already persists organization filters in the URL. Extend that working pattern rather than rebuilding it. Its organization discovery page currently repeats six filters in both a sidebar and a top row, leaving less space for results. Replace the duplication with one authoritative filter surface, a compact sort control, and removable active-filter chips. On narrow screens, use a filter disclosure or sheet.

### C. Search spans the product's content types

Searching for `transformer` opened `/search?q=transformer` with result-type tabs, per-type counts, and labeled result previews. The visible categories included problems, labs, math, projects, collections, interview preparation, and paths. [Search](https://www.deep-ml.com/search?q=transformer)

**Maintainex adaptation:** a single search destination with Organizations, Repositories, Quests, People, and—only for the current user—Work and Pins. Search results should explain their kind, link directly to the entity, and preserve the query when the user returns.

This is a particularly actionable gap: `UserSearch.tsx` advertises organizations/projects/technologies but loads and filters profiles. Its visible ⌘K badge has no keyboard listener in that component. Either narrow the promise immediately or implement the advertised behavior. This mismatch matters more than adding animation.

### D. Guided paths make a large catalogue approachable

The paths page uses book-like objects. Opening one revealed a physical-book preview, step progress, and a direct start action. The larger Deep-Path uses an ocean-dive scene alongside a hierarchy of parts and concepts, an essentials/full choice, next-step links, and expandable contents. Observed links carry return context back to the originating path. [Paths](https://www.deep-ml.com/paths), [Deep-Path](https://www.deep-ml.com/deep-path)

**Maintainex adaptation:** contribution tracks such as First Accepted Contribution, Documentation Contributor, or a repository-specific onboarding track. These are proposed editorial categories, not claims about existing inventory. A useful progression is:

1. Read the contribution guide.
2. Set up the project.
3. Reproduce a selected issue or choose a documented task.
4. Submit a focused change.
5. Respond to review and record the outcome.

Every path needs a clear next step, prerequisites, resumable state, evidence for completed work, and a way around unavailable tasks. Replacing a closed issue should preserve completed progress. The next-step engine is more valuable than a complex animated map. A distinctive track cover could become a visual signature later.

### E. Plans respond to a real deadline

The public Data Science track includes a current task, section tabs, deadline presets/date input, coverage scope, a daily workload, and grouped work. Selecting two weeks changed the date and raised the displayed pace from roughly three to seven items per day. Completion controls distinguished prerequisites from completed work. [Interview preparation](https://www.deep-ml.com/interview-prep), [public track](https://www.deep-ml.com/interview-prep/data-science-general)

**Maintainex adaptation:** an explicit target plus available time. Examples: preparing a first contribution before a chosen date, completing onboarding for a selected repository, or making room for existing review work. Ask for minutes per week and recommend a feasible scope. Explain when the target is overloaded; do not imply that submitting a PR guarantees a maintainer's acceptance by a deadline.

The existing contribution-plan service creates five days of text actions from goals and scheduled work. Upgrade this to a persisted plan with linked work items and capacity before positioning it as adaptive planning.

### F. Collections and personal lists serve different needs

Collections have format/topic filters, progress, source resources, and completion-oriented presentation. Playlists support a personal library, while a public Explore view exposes searchable lists, tags, sorting, author attribution, and workload metadata. The product advertises copying lists; copying was not tested. [Collections](https://www.deep-ml.com/collections), [Playlists](https://www.deep-ml.com/playlists)

**Maintainex adaptation:** distinguish maintainer-curated contribution tracks from a user's shortlist. Saved Opportunities already provides a shortlist. Add named, ordered plans only when users need multiple goals or sequences. A plan should be explicitly private by default, and publishing should be a deliberate operation.

Maintainex's current `Collection` model stores summary fields, not ordered entity membership or per-user progress. Building usable collections therefore requires data modeling, not just a new card layout.

### G. Focused work keeps context and actions together

The sampled problem offers instructions, solution/video/comments/playground affordances, notes, editor tools, and test cases. At narrow width, Problem and Code become separate views while Run and Submit remain available in a bottom action bar. [Problem workspace](https://www.deep-ml.com/problems/23)

**Maintainex adaptation:** an opportunity/work detail view with **Context, Plan, Notes, and Activity**. Desktop can pair the task brief with a smaller progress/actions panel. Mobile can use tabs and a compact bottom action bar. Put source links and completion criteria beside the work, and preserve unsaved notes when switching tabs.

Build this around the existing scheduled-work detail route first. It currently leads with a large metadata grid; bring the task summary, next action, plan, and blockers above secondary metadata. Keep code editing and PR review in GitHub or the contributor's development environment.

### H. Assistance is placed near the task

The study page has concrete starter prompts, conversation history, and a persistent composer. The site describes recommendations grounded in its catalogue and in-context tutoring. The starter prompt was clickable, but a response and recommendation accuracy were not verified. [Study assistant](https://www.deep-ml.com/study)

**Maintainex adaptation:** context actions such as “Explain this opportunity,” “Help me make a plan,” and “What should I do next?” Return linked tasks and an explanation of the supporting data. Draft scheduling changes before the user saves them.

Maintainex already has `/ai/coach`, `/ai/plan`, context generation, and reports. In the inspected service, the coach uses keyword branches and deterministic summaries. Its response contract contains text and data points, not linked actionable recommendations. Reuse and improve that foundation; do not assume there is already a general conversational agent.

### I. Motivation is attached to actual work

The live leaderboard separates lab-based ranking from Flame scoring and explains the selected basis. Lab eligibility includes a minimum number of people clearing it. Buddies requires sign-in and advertises a shared board, chat, and comparison. Those social interactions were not tested. [Leaderboard](https://www.deep-ml.com/leaderboard), [Buddies](https://www.deep-ml.com/buddies)

**Maintainex adaptation:** clear score explanations, a selected time window, and a way to see personal progress. Add opt-in accountability groups after contribution verification is reliable. Prefer weekly goals that tolerate rest days. Submission volume and daily streaks are poor substitutes for useful open-source work.

Current contribution points can depend on keywords in the title; for example, security/performance keywords return high points. Before competitive expansion, separate self-reported work from verified GitHub evidence and make point awards idempotent. A leaderboard will amplify whatever the scoring model rewards.

### J. Community should return users to the work

Discuss provides search, category filters, Hot/New/Top ordering, post previews, and thread links. The homepage describes rich references that connect discussion back to a problem. Reference composition and hover behavior were not tested. [Discuss](https://www.deep-ml.com/discuss)

**Maintainex adaptation:** activity and opportunity cards that link directly to the relevant issue, repository, or work item. Reuse existing comments and notifications for task-specific questions first. A standalone forum adds moderation, spam handling, reporting, and notification complexity. It should follow actual repeated community needs.

### K. Projects expose how small steps produce an outcome

The inspected project detail grouped 21 steps into seven parts, with progress, a Start link, and a live-scaffold affordance. Labs group tasks by dataset and expose measurable target criteria alongside difficulty and library filters. [Project](https://www.deep-ml.com/projects/build-an-mlp-in-jax-from-scratch), [Projects](https://www.deep-ml.com/projects), [Labs](https://www.deep-ml.com/labs)

**Maintainex adaptation:** group contribution opportunities around a real project outcome or repository, and expose acceptance evidence before the user starts. A documentation campaign, test-coverage effort, or release preparation plan can have several linked tasks. Keep the objective, owner, requirements, and progress visible.

Some milestones are user-confirmed, such as local setup. Others can be verified by GitHub events, such as a submitted or merged PR. These need different labels. “Done locally,” “submitted,” and “accepted” should not collapse into a single completion state.

### L. Onboarding explains an unfamiliar workflow

The research page presents a collaborative improvement loop and displayed a five-step explanatory guide. Its public description connects an experiment to a measured outcome and the next shared baseline. The automated merge mechanism was not verified. [Research](https://www.deep-ml.com/research)

**Maintainex adaptation:** short contextual explanations where needed: how a quest is verified, what a score measures, or why an opportunity matches the user. Make guides dismissible and reopenable. Do not auto-open a general tour across every established dashboard workflow.

### M. Premium boundaries are explicit

The pricing view separates open core practice from additional compute, assistance, and guided features, and compares limits in a table. No purchase was attempted. Several pages contain premium indicators before the user enters a feature. [Premium](https://www.deep-ml.com/premium)

**Maintainex adaptation:** if monetization becomes relevant, keep core discovery, contribution tracking, and source links useful. Charge for expensive or specialized capabilities only when there is proven demand. More dashboards or a premature premium badge will not solve the current incomplete contribution journey.

## 2. Visual direction for Maintainex

These are **proposed Maintainex rules**, not scraped Deep-ML CSS values.

| Area | Proposed direction | Application |
|---|---|---|
| Surfaces | Keep existing charcoal background and panel tokens; use borders before large shadows | App shell, tables, filter controls |
| Accent | Keep `#c9f43a` for primary actions/current progress; reserve semantic colors for state | Avoid lime outlines/glow on every card |
| Typography | Readable sans body; monospace for repository identifiers, small metadata, and selected display moments | Give titles, descriptions, and metadata distinct weights |
| Spacing | Consistent 4/8px-based scale, 16–24px panel padding, 24–32px section separation | Replace page-by-page density decisions |
| Shape | One compact control radius and one panel radius | Current rounded panel language can remain |
| Motion | Short feedback transitions, optional editorial animation, reduced-motion alternative | Do not put continuous motion behind reading or work |
| Numbers | Tabular figures, explicit units, provenance/freshness on derived scores | Distinguish zero from unavailable data |
| Mobile | One-column results, accessible filter disclosure, useful action bar | Do not shrink a desktop workspace into tiny columns |
| Interaction | Visible keyboard focus, labeled controls, keyboard alternatives to hover | Treat accessibility as part of each component |

The largest visual improvement would come from **hierarchy and density**, not a new palette. Maintainex's `PageTitle` uses relatively compact headings while discovery pages use substantially larger, heavier headings. Many descriptions also use semibold text. Define shared page-header and body-text roles so each screen reads as part of the same product.

### Proposed layouts

**Public entry:** concise promise + live opportunity preview; three contribution workflow sections; credible real-data proof only; final browse/connect actions.

**Dashboard:** top row answers “What next?” with one resumable task and an optional alternative. Keep goals visible. Put contribution outcomes and trends below, with the same selected period applied consistently. At present, dashboard charts use the chosen range while metric-card inputs use all activities.

**Discovery:** header → primary search → short preset filters → active chips + sort → results. On desktop, advanced filters can sit alongside results; on mobile they open on demand. Do not show the same filters twice.

**Opportunity/work detail:** title + source + state → summary/acceptance criteria → context/plan/notes → timeline. Secondary metadata moves into a disclosure. Desktop side panel holds progress and actions; mobile uses a bottom action bar with room above it for content.

**Track detail:** outcome + requirements → progress + Continue → chapters/tasks → evidence and resources. A cover illustration is optional; a trustworthy Continue action is essential.

## 3. What Maintainex already has, and the actual gap

| Capability | Source evidence | Gap or opportunity |
|---|---|---|
| Member home/feed | `client/app/page.tsx` | Keep it; introduce public entry independently |
| Authenticated shell + viewer entry | `AppShell.tsx`, `login/page.tsx` | Public browsing needs deliberate server-side public-data boundaries as well as shell routing |
| Global header search | `components/layout/UserSearch.tsx` | Profile search currently has a broader placeholder and decorative shortcut |
| Organization discovery | `explore/organizations/page.tsx` | URL filters exist; remove duplication, improve result density, debounce/cancel requests |
| Repository/quest/recommendation entry routes | `explore/{repositories,quests,recommended}/page.tsx` | All three currently redirect to Coming Soon |
| Organization-specific quests | Explore routes/service + `QuestCard.tsx` | Listing exists; Start Quest currently leads to Coming Soon |
| Quest progress schema | Prisma `Quest`, `UserQuest` | Needs supported lifecycle endpoints, evidence, resumability, UI |
| Saved opportunities | Saved page and Explore API | Good shortlist foundation; ordered, named lists are additional scope |
| Goals | `GoalPanel.tsx` + goal module | Metric targets exist; guided steps and next action are different capabilities |
| Scheduled work | Schedule detail + `ScheduledWork` | Already has context, plan, blockers and notes; reorganize instead of creating a parallel task system |
| Assistance/reports | AI routes/service + Reports UI | Deterministic text output; add linked suggestions and explicit source context |
| Collections | Prisma `Collection`, leaderboard cards | Summary data only; no ordered membership or per-user track progress |
| Heatmap | `ActivityHeatmap.tsx` | Reuse compact calendar logic where useful; define local-date semantics |
| Leaderboards | Leaderboard services + scoring service | Improve score meaning, verification and scope before expanding competition |

`Project.md` is the stronger guide to current direction than the older README summary. It explicitly asks for contribution intelligence and real data. Recommendations above follow that direction.

## 4. What to avoid or postpone

- **A full Deep-ML clone.** Preserve Maintainex's contribution domain, brand, and workflows.
- **An in-browser development environment.** High implementation cost; GitHub and local tools already own the development work.
- **An enormous animated contribution map before real tracks exist.** Start with a chapter list and resumable next step.
- **A second independent planning system.** Paths should reference existing scheduled work and contribution evidence.
- **A forum, chat, contests, and premium all at once.** Each has ongoing operational cost; none is a prerequisite for finishing a contribution.
- **Leaderboards built on self-reported volume.** Current scoring needs stronger evidence and transparent definitions.
- **Fake live-looking demonstrations.** Deep-ML explicitly labels some homepage demos as samples; its contest example did not match the actual contest listing observed. Maintainex's existing requirements favor real data and honest empty states.
- **Unsupported performance or implementation claims.** We inspected public UI and the problem bank, not Deep-ML's complete application source or infrastructure.
- **Copying third-party lessons, images, code, or branding.** The reference here is interaction design; Maintainex content should come from its own sources and approved repository data.

## 5. Implementation order and success measures

1. **Make current entry points truthful and coherent.** Fix header search scope/shortcut, standardize headers, simplify discovery filters, expose useful empty/error states.
2. **Complete one contribution journey.** List real quests, open detail, save/start, plan, resume, and verify or explicitly label manual completion.
3. **Bring the next action to the dashboard.** Use existing work and goals with explanations and useful source links.
4. **Add a small number of real contribution tracks.** Persist ordered membership, enrollment, and evidence; connect deadline/capacity planning.
5. **Expand community and motivation once the core works.** Score explanations first; accountability and collaborative campaigns later.

Measure discovery-to-start conversion, save-to-start conversion, time to first meaningful action, resumed work completion, and accepted/verified contribution outcomes. Separate manual completion from verified outcomes. Treat this as a measurement proposal; no baseline, uplift, or conversion claim has been established.

## 6. Implementation pattern that is publicly documented

The official problem-bank repository separates each challenge into metadata, explanatory content, starter/reference code, examples, and tests, then builds a bundle and validates it against a schema in CI. This establishes a content-authoring workflow, not the full site's frontend/backend stack. [Official problem bank](https://github.com/Open-Deep-ML/DML-OpenProblem)

For Maintainex, a comparable pattern could let maintainers author versioned track manifests with objectives, prerequisites, task references, acceptance criteria, and attribution. Validate manifests before importing them into Prisma. Keep user enrollment, saved state, and evidence in the database. Published content versions should not silently rewrite a user's completed work.

This can start with ordinary API-backed editorial records. A manifest pipeline is worthwhile only when there are multiple maintainers or frequent content updates.

## Evidence gallery

The captures below show inspected Deep-ML pages. They are references, not proposed Maintainex designs.

| Pattern | Capture |
|---|---|
| Public entry hierarchy | [Homepage](./screenshots/home-mobile.jpg) |
| Execution failure feedback observed in this session | [Demo error](./screenshots/home-demo-error-mobile.jpg) |
| Search with typed results | [Search](./screenshots/search-mobile.jpg) |
| Task instructions with persistent actions | [Problem](./screenshots/problem-mobile.jpg) |
| Distinctive path preview | [Book preview](./screenshots/path-book-mobile.jpg) |
| Curriculum navigation | [Deep-Path](./screenshots/deep-path-mobile.jpg) |
| Curated material with filters | [Collections](./screenshots/collections-mobile.jpg) |
| Deadline-oriented track entry | [Interview path](./screenshots/interview-path-mobile.jpg) |
| Public lists | [Playlists](./screenshots/playlists-mobile.jpg) |
| Discussion hierarchy | [Discuss](./screenshots/discuss-mobile.jpg) |
| Outcome and project progress | [Project](./screenshots/project-mobile.jpg) |
| Grouping tasks by underlying context | [Labs](./screenshots/labs-mobile.jpg) |
| Explaining a novel workflow | [Research guide](./screenshots/research-guide-mobile.jpg) |

The interview screenshot shows the selected two-week deadline, scope controls, and recalculated workload. The interaction is also recorded in the inspection inventory.
