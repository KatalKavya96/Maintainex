> Historical specification. Current architecture, product boundaries and agent rules are in [AGENTS.md](./AGENTS.md) and [docs/architecture/README.md](./docs/architecture/README.md). Current instructions supersede conflicting requirements below.

You are working on the Maintianex project.

Maintianex is a GitHub-linked open-source contribution intelligence and gamified growth dashboard. The current product direction is:

1. Users connect/sign in with GitHub.
2. Maintianex fetches real GitHub organizations, repositories, PRs, issues, reviews, contributors, and activity.
3. Maintianex shows contribution intelligence similar to LFX Insights but in Maintianex’s own dark neon-green theme.
4. Maintianex has a “Start Contributing” sidebar section where users can discover organizations, repositories, quests, recommendations, and saved opportunities.
5. Nothing should be fake or visually-only. Every visible count, score, list, repo, organization, contributor, leaderboard, and card must come from the database/API. If data is not available yet, show a proper empty state or redirect to a Coming Soon page.

Important requirement:
Do not hardcode UI data except for fallback empty states, labels, filter options, and temporary seed scripts. No static fake org cards, fake contributors, fake scores, or fake leaderboard entries in production UI.

Build the following feature set exactly.

==================================================

1. SIDEBAR STRUCTURE
   ==================================================

Update the existing Maintianex sidebar to include this structure:

Main navigation:

* Home
* Dashboard
* Activities
* Reports
* Pins
* Schedule
* Leaderboard
* Settings

Add a grouped section:

Start Contributing

* Explore Organizations
* Find Repositories
* Browse Quests
* Recommended for You
* Saved Opportunities

The active item should be highlighted using Maintianex’s current neon green/dark theme.

Routes:

/explore/organizations
/explore/repositories
/explore/quests
/explore/recommended
/explore/saved

If a route is not fully implemented yet, do not leave it broken. Redirect it to:

/coming-soon?feature=<feature-name>

Create a reusable ComingSoon page with:

* Feature name
* Short description
* “Back to Dashboard” button
* “Explore Organizations” button

==================================================
2. MAINTIANEX THEME REQUIREMENTS
================================

Use the existing Maintianex dark theme style.

Visual direction:

* Dark charcoal / black background
* Neon lime-green primary accent
* Fresh green secondary accent
* Subtle blue-green borders
* Rounded cards
* Soft glow on active states
* Professional SaaS dashboard look
* Consistent spacing and typography
* Do not copy LFX/GSoC branding directly; only use their layout inspiration

Keep the UI visually close to the provided design mockups:

* Explore Organizations page with sidebar filters and org cards
* Organization detail page with metrics, tabs, contributor leaderboard, and repo cards
* Leaderboards page with contributor/org/repo rankings, Open Source Index, and collections

==================================================
3. EXPLORE ORGANIZATIONS PAGE
=============================

Create route:

/explore/organizations

This is the main public/open-source discovery page.

Layout:

* Top header with global search
* Page title: “Explore Organizations”
* Subtitle: “Discover open-source organizations and find the perfect place to contribute.”
* Left filter panel
* Top filter dropdown row
* Organization card grid
* Pagination
* Loading state
* Error state
* Empty state

Filters:

Programs:

* GSoC
* LFX
* CNCF
* Outreachy
* MLH

Years:

* All Years
* 2026
* 2025
* 2024
* 2023
* 2022 & earlier

Tech Stack:

* Cloud Native
* Developer Tools
* Web Development
* DevOps
* Data & AI
* Security
* JavaScript
* TypeScript
* React
* Go
* Python
* Rust
* Kubernetes
* Docker
* GraphQL

Category:

* All Categories
* Artificial Intelligence
* Cloud Native
* Developer Tools
* Web Development
* Infrastructure
* Security
* Documentation
* Data

Beginner Friendly:

* All
* 1 star+
* 2 stars+
* 3 stars+
* 4 stars+

Sort by:

* Most Relevant
* Maintianex Score
* Most Active
* Fastest Review
* Most Quests
* Highest Reputation
* Beginner Friendly

Each organization card must show real data:

* Organization logo/avatar
* Organization name
* Short description
* Program badges: GSoC, LFX, CNCF, etc.
* Tech stack tags
* Maintianex Score
* Active repositories count
* Open quests count
* Average review time
* Top repository
* Beginner friendly rating
* “View Org” button
* “Save” button

Card data must be fetched from backend endpoint, not hardcoded.

Create API endpoint:

GET /api/explore/organizations

Query params:

* search
* program
* year
* techStack
* category
* beginnerFriendly
* sort
* page
* limit

Response shape:

{
"items": [
{
"id": "...",
"name": "...",
"slug": "...",
"logoUrl": "...",
"description": "...",
"programs": [
{
"name": "GSoC",
"years": [2026, 2025],
"sourceUrl": "..."
}
],
"techStack": ["Go", "React", "Kubernetes"],
"category": "Cloud Native",
"maintianexScore": 94,
"scoreLabel": "Excellent",
"activeReposCount": 32,
"openQuestsCount": 14,
"averageReviewTimeDays": 2.3,
"topRepository": {
"name": "meshery",
"slug": "meshery"
},
"beginnerFriendlyScore": 4.2,
"isSaved": false
}
],
"pagination": {
"page": 1,
"limit": 6,
"total": 438,
"totalPages": 73
}
}

==================================================
4. ORGANIZATION DETAIL PAGE
===========================

Create route:

/explore/organizations/[slug]

This page should look like the organization detail mockup.

Header section:

* Org logo
* Org name
* Description
* Program badges
* Tech stack tags
* Maintianex Score
* Active Repos
* Open Quests
* Avg Review Time
* Beginner Friendly
* Follow button
* Start Quest button
* Save Org button

Tabs:

* Overview
* Contributors
* Repositories
* Quests
* Leaderboards

Default tab:

* Overview or Contributors, whichever is easier with current data

Contributors tab:

* Activity filter
* Time range dropdown
* Contributors leaderboard table

Contributor table fields:

* Rank
* Avatar
* Contributor name/login
* Role: Maintainer / Contributor
* Total contribution points
* Contribution percentage
* Quests completed
* Current streak

Right summary cards:

* Top Contributor
* Contribution distribution donut/chart
* Total contributions

Bottom section:

* Top repositories cards

Repository card fields:

* Repo avatar/icon
* Repo name
* Description
* Language
* License
* Stars
* Forks
* Open issues
* Maintianex Score

Create API endpoints:

GET /api/explore/organizations/[slug]

GET /api/explore/organizations/[slug]/contributors

GET /api/explore/organizations/[slug]/repositories

GET /api/explore/organizations/[slug]/quests

If quests are not implemented yet, show a “Coming Soon” state inside the tab or redirect to /coming-soon?feature=quests.

==================================================
5. LEADERBOARDS PAGE
====================

Update or create route:

/leaderboard

Page sections:

1. Top Contributors
2. Top Organizations
3. Most Active Repositories
4. Open Source Index
5. Curated Collections

Top Contributors card:

* Rank
* Avatar
* Name/login
* Contributions in last 12 months
* View full leaderboard button

Top Organizations card:

* Rank
* Org logo
* Org name
* Contributions in last 12 months
* View full leaderboard button

Most Active Repositories card:

* Rank
* Repo logo/icon
* Repo name
* Unique contributors in last 12 months
* View full leaderboard button

Open Source Index section:

* Tabs: By Stack, By Industry, By Software Value
* Horizontal bars showing contributor counts by category
* Button: Explore Open Source Index

Curated Collections section:

* Collection cards
* Each card shows title, description, number of projects/orgs/repos, last updated, save count

Create API endpoints:

GET /api/leaderboards/top-contributors
GET /api/leaderboards/top-organizations
GET /api/leaderboards/active-repositories
GET /api/open-source-index
GET /api/collections

Again: no hardcoded leaderboard rows. If there is no data, show empty state.

==================================================
6. DATABASE MODELS
==================

Add or update database models as needed.

Required models:

User

* id
* name
* email
* avatarUrl
* githubUsername
* githubId
* createdAt
* updatedAt

Organization

* id
* name
* slug
* logoUrl
* description
* websiteUrl
* githubUrl
* category
* techStack as JSON/string array
* maintianexScore
* beginnerFriendlyScore
* reputationScore
* activityScore
* reviewSpeedScore
* createdAt
* updatedAt

ProgramParticipation

* id
* organizationId
* programName
* year
* sourceUrl
* createdAt
* updatedAt

Repository

* id
* organizationId
* githubRepoId
* name
* slug
* fullName
* githubUrl
* description
* primaryLanguage
* license
* stars
* forks
* watchers
* openIssues
* techStack as JSON/string array
* activityScore
* difficultyScore
* beginnerFriendlyScore
* maintianexScore
* createdAt
* updatedAt

Contribution

* id
* userId
* organizationId
* repositoryId
* type
* title
* url
* githubNodeId/githubId
* state
* points
* metadata as JSON
* createdAt
* updatedAt

Quest

* id
* organizationId
* repositoryId nullable
* title
* description
* type
* difficulty
* points
* isActive
* createdAt
* updatedAt

UserQuest

* id
* userId
* questId
* status
* completedAt
* createdAt
* updatedAt

SavedOpportunity

* id
* userId
* type // ORGANIZATION, REPOSITORY, QUEST, ISSUE
* organizationId nullable
* repositoryId nullable
* questId nullable
* externalUrl nullable
* createdAt

Collection

* id
* title
* description
* type
* itemCount
* logoUrls as JSON/string array
* saveCount
* updatedAt
* createdAt

ScoreEvent

* id
* userId nullable
* organizationId nullable
* repositoryId nullable
* contributionId nullable
* type
* basePoints
* multiplier
* finalPoints
* reason
* metadata as JSON
* createdAt

==================================================
7. GITHUB INTEGRATION
=====================

If GitHub auth is already implemented, reuse it.

If not, add GitHub OAuth sign-in/linking.

Required GitHub data fetching:

* User profile
* User organizations
* Repositories
* Pull requests
* Issues
* Reviews where possible
* Repo metadata: stars, forks, open issues, primary language, license
* Contributors for tracked repositories
* Recent merged PRs
* Recent issue activity

Do not overload GitHub API on every request.

Implement sync strategy:

* Store data in DB
* Add sync job or manual sync endpoint
* Cache expensive data
* Use updatedAt checks
* Avoid repeated API calls on page refresh

Suggested endpoints:

POST /api/github/sync/me
POST /api/github/sync/organization/:slug
POST /api/github/sync/repository/:owner/:repo

Add UI states:

* “Syncing GitHub data…”
* “Last synced X minutes ago”
* “Sync failed. Retry”
* “Connect GitHub to unlock personalized recommendations”

==================================================
8. SCORE CALCULATION
====================

Implement transparent score calculation helpers.

Do not create random scores in components.

Create reusable service:

services/scoring.ts

Functions:

calculateOrganizationScore(org)
calculateRepositoryScore(repo)
calculateContributionPoints(contribution)
calculateBeginnerFriendlyScore(repoOrOrg)
calculateAverageReviewTime(prs)
calculateActivityScore(activity)
calculateReputationScore(stars, forks, contributors)

Initial scoring can be simple but must be deterministic.

Organization score example:

Org Score =
25% repo activity
20% beginner friendliness
20% maintainer response speed
15% reputation
10% program credibility
10% quest availability

Repository score example:

Repo Score =
25% recent activity
20% PR merge/review speed
20% beginner-friendly issues
15% reputation
10% documentation/setup quality
10% quest availability

Contribution points example:

Issue opened: 5
Valid issue: 10
PR opened: 15
PR merged: 50
PR review submitted: 20
Docs PR merged: 35
Bug fix merged: 60
Feature merged: 80
CI/build fix merged: 55
Security/performance fix merged: 90
First contribution to new repo: 25
First contribution to new org: 40

Create score explanations in API response where possible.

Example:

{
"maintianexScore": 94,
"scoreBreakdown": {
"repoActivity": 23,
"beginnerFriendliness": 18,
"reviewSpeed": 19,
"reputation": 14,
"programCredibility": 10,
"questAvailability": 10
}
}

==================================================
9. SAVE / FOLLOW FUNCTIONALITY
==============================

Implement working save buttons.

When user clicks Save on organization/repo/quest:

* If logged in: save to SavedOpportunity
* If not logged in: redirect to GitHub login or show auth modal

Routes:

* /explore/saved

Saved page should show:

* Saved Organizations
* Saved Repositories
* Saved Quests
* Saved Issues

If some tabs are not implemented, show Coming Soon inside that tab.

==================================================
10. RECOMMENDED FOR YOU
=======================

Route:

/explore/recommended

If GitHub is not connected:

* Show connect GitHub CTA

If recommendation engine is not ready:

* Redirect to /coming-soon?feature=recommended-for-you

Do not show fake recommendations.

Later this page should use:

* User’s GitHub languages
* Previous contribution types
* Saved interests
* Repo activity
* Maintianex score
* Quest availability

==================================================
11. QUESTS PAGE
===============

Route:

/explore/quests

If quest data model and API are ready, show:

Quest categories:

* Beginner Quests
* Weekly Quests
* Skill-Based Quests
* Org-Specific Quests
* Repo-Specific Quests
* Competitive Quests

Quest card:

* Title
* Description
* Difficulty
* Points
* Linked org/repo
* Estimated effort
* Reward badge
* Start Quest button

If not ready:

* Redirect to /coming-soon?feature=quests

Do not create fake quest cards in production UI.

==================================================
12. FIND REPOSITORIES PAGE
==========================

Route:

/explore/repositories

If implemented, show repository discovery with filters:

* Organization
* Language
* Tech stack
* Difficulty
* Repo reputation
* Open issues
* Good first issues
* Review speed
* Setup difficulty
* Quest availability

Repository card:

* Repo name
* Parent org
* Description
* Stars
* Forks
* Primary language
* Open issues
* Good first issues
* Maintianex Repo Score
* Difficulty Score
* Average PR Merge Time
* View Repo
* Save Repo

If not ready:

* Redirect to /coming-soon?feature=find-repositories

==================================================
13. EMPTY / LOADING / ERROR STATES
==================================

Every page and API-backed component must have:

Loading:

* skeleton cards
* table skeletons
* loading message

Empty:

* friendly empty state
* clear next action
* no fake rows

Error:

* error message
* retry button
* fallback action

Examples:

* “No organizations found for these filters.”
* “No leaderboard data available yet.”
* “Connect GitHub to calculate personalized recommendations.”
* “This feature is coming soon.”

==================================================
14. QUALITY REQUIREMENTS
========================

Before finishing:

* Ensure every route works.
* Ensure no broken buttons.
* Ensure buttons either perform real action or redirect to Coming Soon.
* Ensure no dummy fake data is displayed in production UI.
* Ensure all lists/cards/tables are API-backed.
* Ensure filters update query params and refetch data.
* Ensure pagination works.
* Ensure save buttons persist data.
* Ensure organization detail pages are dynamic by slug.
* Ensure responsive layout does not break.
* Ensure dark theme matches Maintianex.
* Ensure TypeScript types are clean.
* Ensure lint/build pass.

Run:

npm run lint
npm run build

Fix all errors.

==================================================
15. IMPLEMENTATION PRIORITY
===========================

Priority 1:

* Sidebar Start Contributing section
* Coming Soon page
* Explore Organizations page
* API for organizations
* DB models for Organization, ProgramParticipation, Repository
* Real database-backed org cards
* Filters, sorting, pagination

Priority 2:

* Organization detail page
* Contributors tab
* Repositories tab
* Save organization functionality

Priority 3:

* Leaderboards page
* Open Source Index
* Collections

Priority 4:

* Quests
* Recommended for You
* Advanced GitHub sync
* Momentum Engine

Build this carefully and make the code modular. Use reusable components:

components/explore/OrganizationCard.tsx
components/explore/OrganizationFilters.tsx
components/explore/RepositoryCard.tsx
components/explore/QuestCard.tsx
components/leaderboards/LeaderboardCard.tsx
components/common/ComingSoon.tsx
components/common/MetricCard.tsx
components/common/ScoreBadge.tsx
components/common/ProgramBadge.tsx
components/common/TechTag.tsx

Use API/service separation:

services/github.ts
services/scoring.ts
services/explore.ts
services/leaderboards.ts

Final expected result:
A fully working Maintianex “Start Contributing” experience where users can browse real organizations, filter by GSoC/LFX/tech stack, open organization detail pages, see real stats from database/API, and use only working buttons. Any feature not ready must gracefully redirect to a Coming Soon page instead of showing broken or fake UI.
