# Maintainex Feature Expansion Prompt

I already have **Maintainex**, a full-stack contribution maintenance tracker.

Current stack:

- Frontend: Next.js + TypeScript + Tailwind CSS
- Backend: Node.js + Express + TypeScript
- Database: MySQL
- ORM: Prisma
- Auth: Signup/Login with JWT
- CRUD is already restricted per authenticated user

Now add two major new feature modules:

1. **Pinned Contribution Links**
2. **Future Work Scheduler**

Keep the system scalable, clean, and user-specific.

Every new record must belong to the logged-in user only.

---

# Feature 1: Pinned Contribution Links

Create a new page where I can save and organize links to repositories, issues, PRs, documentation pages, project boards, or any website that I frequently use while contributing.

This should work like the pinned shortcuts on the Chrome new tab page, but with a much larger and more powerful system.

Page route:

```txt
/pins
Goal

I want a page where I can keep custom pinned links that redirect me to repos and contribution pages.

Examples:

Layer5 Website Repo
https://github.com/layer5io/layer5

Meshery Repo
https://github.com/meshery/meshery

Good First Issues
https://github.com/layer5io/layer5/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22

Talawa Admin
https://github.com/PalisadoesFoundation/talawa-admin

I should be able to:

Add a new pinned link
Edit an existing pinned link
Delete a pinned link
Open the link in a new tab
Search pins
Filter pins by category
Mark pins as favorite
Sort pins manually or by recently added
Show many pins, not just 8 or 10 like Chrome
Pin Data Fields

Each pin should have:

type Pin = {
  id: string;
  userId: string;

  title: string;
  url: string;
  description?: string;

  category: PinCategory;
  customCategory?: string;

  iconUrl?: string;
  faviconUrl?: string;
  imageUrl?: string;

  isFavorite: boolean;
  isArchived: boolean;

  tags: string[];

  sortOrder: number;

  lastOpenedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};
Pin Categories

Use enum:

enum PinCategory {
  REPOSITORY = "REPOSITORY",
  ISSUE = "ISSUE",
  PULL_REQUEST = "PULL_REQUEST",
  DOCUMENTATION = "DOCUMENTATION",
  PROJECT_BOARD = "PROJECT_BOARD",
  ORGANIZATION = "ORGANIZATION",
  WEBSITE = "WEBSITE",
  OTHER = "OTHER"
}
Icon / Favicon Behavior

The pin card should show an icon/image similar to Chrome shortcuts.

Implement this in a simple and reliable way:

First Priority

If user manually enters an imageUrl, use that as the pin image.

Second Priority

Automatically generate favicon from the pinned website URL.

For example, if the URL is:

https://github.com/layer5io/layer5

Extract domain:

github.com

Then use favicon URL:

https://www.google.com/s2/favicons?domain=github.com&sz=128

Store this generated favicon URL in the database.

Third Priority

If favicon is not available, show fallback icon based on category:

Repository icon
Issue icon
PR icon
Docs icon
Website icon
Organization icon

Use clean icons from a library like Lucide React or Heroicons.

Pin UI Requirements

Create a professional grid UI.

Pin card should show:

Website/repo icon
Title
URL/domain
Category badge
Tags
Favorite star
Open button
Edit button
Delete button

The /pins page should include:

Page title: Pinned Contribution Links
Subtitle explaining that these are quick links for contribution work
Add Pin button
Search bar
Category filter
Favorites filter
Sort dropdown
Responsive pin grid
Empty state when no pins exist
Loading state
Error state
Pin Form

Create Add/Edit Pin form.

Fields:

Title
URL
Description
Category
Custom Category
Image URL
Tags
Favorite toggle

Validation:

Title is required
URL is required
URL must be valid
Category is required

When URL is entered, automatically preview favicon if possible.

Pin Backend APIs

Create user-protected APIs:

POST /api/pins
GET /api/pins
GET /api/pins/:id
PUT /api/pins/:id
DELETE /api/pins/:id
PATCH /api/pins/:id/opened
PATCH /api/pins/:id/favorite
PATCH /api/pins/reorder

GET /api/pins should support:

?search=
?category=
?favorite=
?archived=
?tag=
?sort=
?page=
?limit=

Sort options:

recent
oldest
favorite
title
lastOpened
manual

Important:

A user should only see their own pins.
A user should only edit/delete their own pins.
Do not allow access to another user’s pins.
Pin Prisma Model

Add this model:

model Pin {
  id             String      @id @default(cuid())
  userId         String

  title          String
  url            String
  description    String?

  category       PinCategory @default(WEBSITE)
  customCategory String?

  iconUrl        String?
  faviconUrl     String?
  imageUrl       String?

  isFavorite     Boolean     @default(false)
  isArchived     Boolean     @default(false)

  tags           Json?

  sortOrder      Int         @default(0)

  lastOpenedAt   DateTime?
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  user           User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([category])
  @@index([isFavorite])
  @@index([createdAt])
}

Add enum:

enum PinCategory {
  REPOSITORY
  ISSUE
  PULL_REQUEST
  DOCUMENTATION
  PROJECT_BOARD
  ORGANIZATION
  WEBSITE
  OTHER
}
Pin Backend Folder Structure

Use this module structure:

server/src/modules/pin/
  pin.types.ts
  pin.controller.ts
  pin.service.ts
  pin.repository.ts
  pin.routes.ts
  pin.validation.ts
  pin.utils.ts

Responsibilities:

Controller: request/response only
Service: business logic
Repository: Prisma queries
Validation: request body validation
Utils: favicon/domain helpers

Add helper functions:

getDomainFromUrl(url: string): string
generateFaviconUrl(url: string): string
normalizeUrl(url: string): string
Feature 2: Future Work Scheduler

Create a new page where I can schedule contribution work that I plan to do in the future.

Page route:

/schedule
Goal

I want to track future PR reviews, issues I will work on, PRs I plan to raise, and issues assigned to me.

This page should help me manage upcoming contribution tasks.

Examples:

Review PR #1546 in layer5io/sistent
Due: 2026-06-08
Priority: High
Status: Planned

Work on Issue #4185 in PalisadoesFoundation/talawa-admin
Assigned to me: Yes
Assigned since: 2026-06-01
Due: 2026-06-10
Status: In Progress
Work Item Types

Use enum:

enum ScheduledWorkType {
  PR_REVIEW = "PR_REVIEW",
  ISSUE_WORK = "ISSUE_WORK",
  PR_TO_RAISE = "PR_TO_RAISE",
  ISSUE_TO_RAISE = "ISSUE_TO_RAISE",
  BUG_FIX = "BUG_FIX",
  FEATURE_BUILD = "FEATURE_BUILD",
  DOCUMENTATION = "DOCUMENTATION",
  TESTING = "TESTING",
  OTHER = "OTHER"
}
Work Status

Use enum:

enum ScheduledWorkStatus {
  PLANNED = "PLANNED",
  IN_PROGRESS = "IN_PROGRESS",
  BLOCKED = "BLOCKED",
  DONE = "DONE",
  CANCELLED = "CANCELLED",
  POSTPONED = "POSTPONED"
}
Priority

Use enum:

enum Priority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT"
}
Scheduled Work Data Fields

Each scheduled work item should have:

type ScheduledWork = {
  id: string;
  userId: string;

  title: string;
  type: ScheduledWorkType;
  status: ScheduledWorkStatus;
  priority: Priority;

  organizationName: string;
  repositoryName: string;

  itemNumber?: number;
  itemUrl?: string;

  assignedToMe: boolean;
  assignedSince?: Date;

  startDate?: Date;
  dueDate?: Date;
  completedAt?: Date;

  estimatedHours?: number;
  actualHours?: number;

  labels: string[];
  tags: string[];

  difficulty?: "EASY" | "MEDIUM" | "HARD";

  context?: string;
  plan?: string;
  blockers?: string;
  closingNotes?: string;

  createdAt: Date;
  updatedAt: Date;
};
Important Scheduler Features

I should be able to:

Add future work
Edit future work
Delete future work
Mark work as done
Mark work as blocked
Mark work as postponed
Track whether issue/PR is assigned to me
Track assigned date
Track how many days it has been assigned to me
Track due date
Track overdue tasks
Track high priority tasks
Track blocked tasks
Track completed work
Assigned Duration Logic

If assignedToMe = true and assignedSince exists, show:

Assigned for 5 days

Calculate this from:

today - assignedSince

Show this on:

Schedule cards
Schedule table
Detail page
Due Date Logic

If due date is in future:

Due in 3 days

If due date is today:

Due today

If due date is past and status is not DONE:

Overdue by 2 days

If status is DONE:

Completed
Schedule Page UI

The /schedule page should include:

Page title: Future Work Scheduler
Subtitle: Plan PR reviews, issues, and future contribution work
Add Work button
Search bar
Status filter
Type filter
Priority filter
Assigned-to-me filter
Repository filter
Date range filter
Toggle between Board View and Table View
Board View

Create Kanban-style columns:

Planned
In Progress
Blocked
Postponed
Done
Cancelled

Each card should show:

Title
Type badge
Priority badge
Organization/repository
PR/Issue number
Assigned duration
Due date status
Tags
Quick actions

Quick actions:

Mark In Progress
Mark Done
Mark Blocked
Edit
Delete
Table View

Columns:

Title
Type
Status
Priority
Organization
Repository
Number
Assigned to Me
Assigned For
Due Date
Due Status
Actions
Schedule Details Page

Route:

/schedule/:id

Show full details:

Title
Type
Status
Priority
Organization
Repository
Number
Link
Assigned to me
Assigned since
Assigned duration
Start date
Due date
Due status
Estimated hours
Actual hours
Labels
Tags
Difficulty
Context
Plan
Blockers
Closing notes
Created date
Last updated date

Actions:

Edit
Delete
Mark Done
Mark Blocked
Open GitHub Link
Back to Schedule
Schedule Form

Create Add/Edit form.

Fields:

Basic Info
- Title
- Type
- Status
- Priority

Repository Info
- Organization Name
- Repository Name
- Item Number
- Item URL

Assignment Info
- Assigned to me toggle
- Assigned since date

Timeline
- Start date
- Due date
- Completed at

Effort
- Estimated hours
- Actual hours
- Difficulty

Extra Info
- Labels
- Tags
- Context
- Plan
- Blockers
- Closing notes

Validation:

Title is required
Type is required
Status is required
Priority is required
Organization name is required
Repository name is required
If assignedToMe is true, assignedSince should be allowed
If itemUrl exists, it must be valid URL
Schedule Backend APIs

Create user-protected APIs:

POST /api/scheduled-work
GET /api/scheduled-work
GET /api/scheduled-work/:id
PUT /api/scheduled-work/:id
DELETE /api/scheduled-work/:id
PATCH /api/scheduled-work/:id/status
PATCH /api/scheduled-work/:id/mark-done
PATCH /api/scheduled-work/:id/mark-blocked

GET /api/scheduled-work should support:

?search=
?type=
?status=
?priority=
?assignedToMe=
?organizationName=
?repositoryName=
?startDate=
?dueDate=
?overdue=
?page=
?limit=

Important:

A user should only see their own scheduled work.
A user should only edit/delete their own scheduled work.
Do not allow access to another user’s scheduled work.
Scheduled Work Prisma Model

Add this model:

model ScheduledWork {
  id              String              @id @default(cuid())
  userId          String

  title           String
  type            ScheduledWorkType
  status          ScheduledWorkStatus @default(PLANNED)
  priority        Priority            @default(MEDIUM)

  organizationName String
  repositoryName   String

  itemNumber      Int?
  itemUrl         String?

  assignedToMe    Boolean             @default(false)
  assignedSince   DateTime?

  startDate       DateTime?
  dueDate         DateTime?
  completedAt     DateTime?

  estimatedHours  Float?
  actualHours     Float?

  labels          Json?
  tags            Json?

  difficulty      WorkDifficulty?

  context         String?
  plan            String?
  blockers        String?
  closingNotes    String?

  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  user            User                @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([status])
  @@index([priority])
  @@index([type])
  @@index([dueDate])
  @@index([assignedToMe])
}

Add enums:

enum ScheduledWorkType {
  PR_REVIEW
  ISSUE_WORK
  PR_TO_RAISE
  ISSUE_TO_RAISE
  BUG_FIX
  FEATURE_BUILD
  DOCUMENTATION
  TESTING
  OTHER
}

enum ScheduledWorkStatus {
  PLANNED
  IN_PROGRESS
  BLOCKED
  DONE
  CANCELLED
  POSTPONED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum WorkDifficulty {
  EASY
  MEDIUM
  HARD
}
Schedule Backend Folder Structure

Use this module structure:

server/src/modules/scheduledWork/
  scheduledWork.types.ts
  scheduledWork.controller.ts
  scheduledWork.service.ts
  scheduledWork.repository.ts
  scheduledWork.routes.ts
  scheduledWork.validation.ts
  scheduledWork.utils.ts

Responsibilities:

Controller: request/response only
Service: business logic
Repository: Prisma queries
Validation: request body validation
Utils: due date and assigned duration helpers

Add helper functions:

getAssignedDuration(assignedSince?: Date): number
getDueStatus(dueDate?: Date, status?: ScheduledWorkStatus): string
isOverdue(dueDate?: Date, status?: ScheduledWorkStatus): boolean
Dashboard Integration

Update the main dashboard to include new cards:

Pinned Links
Future Work
Due Today
Overdue Work
Blocked Work
High Priority Work
Assigned Issues

Also add sections:

Quick Pins

Show 6 to 10 favorite pins with option:

View all pins
Upcoming Work

Show next 5 scheduled work items sorted by due date.

Each upcoming item should show:

Title
Repository
Priority
Due status
Assigned duration if assigned to me
Sidebar Navigation

Update sidebar with new routes:

Dashboard
Activities
Pins
Schedule
Organizations
Repositories
Analytics
Calendar
Settings
Frontend Folder Additions

Add these frontend folders:

client/app/pins/
  page.tsx
  new/page.tsx
  [id]/page.tsx
  [id]/edit/page.tsx

client/app/schedule/
  page.tsx
  new/page.tsx
  [id]/page.tsx
  [id]/edit/page.tsx

Add components:

client/components/pins/
  PinCard.tsx
  PinGrid.tsx
  PinForm.tsx
  PinFilters.tsx
  FavoritePins.tsx

client/components/schedule/
  ScheduledWorkCard.tsx
  ScheduledWorkBoard.tsx
  ScheduledWorkTable.tsx
  ScheduledWorkForm.tsx
  ScheduledWorkFilters.tsx
  UpcomingWork.tsx
  DueStatusBadge.tsx
  PriorityBadge.tsx
  WorkStatusBadge.tsx

Add types:

client/types/pin.ts
client/types/scheduledWork.ts

Update API client:

client/lib/api.ts

Add functions for:

// Pins
getPins()
getPinById(id)
createPin(data)
updatePin(id, data)
deletePin(id)
toggleFavoritePin(id)
markPinOpened(id)
reorderPins(data)

// Scheduled Work
getScheduledWork()
getScheduledWorkById(id)
createScheduledWork(data)
updateScheduledWork(id, data)
deleteScheduledWork(id)
updateScheduledWorkStatus(id, status)
markScheduledWorkDone(id)
markScheduledWorkBlocked(id)
Security Requirements

Since signup/login/JWT already exists:

All new APIs must require JWT authentication.
Every query must filter by userId.
Never trust userId from request body.
Always take userId from decoded JWT/auth middleware.
Users cannot view, edit, or delete another user’s pins or scheduled work.
Validate all request payloads.
Sanitize URLs.
Do not allow invalid URLs.
UX Requirements

Keep UI simple and professional.

Important UX expectations:

Add button should be visible on top right.
Forms should be divided into clean sections.
Use badges for status, priority, category, and type.
Show useful empty states.
Show confirmation before deleting.
Use toast notifications for create/update/delete success.
Make all cards clickable.
External links should open in new tab.
On pin click, call PATCH /api/pins/:id/opened and then open URL.
In schedule board, allow quick status change buttons.
Board view and table view should both be clean on desktop.
On mobile, board cards should stack vertically.
Important Implementation Notes

Do not rewrite existing auth.

Do not break existing activity CRUD.

Integrate these features into the existing project structure.

Use existing user model relation if already present.

If the User model already exists, only add relations:

model User {
  id String @id @default(cuid())

  // existing fields...

  pins          Pin[]
  scheduledWork ScheduledWork[]
}

Then add the new models and enums.

After schema changes, generate migration:

npx prisma migrate dev --name add_pins_and_scheduled_work
Expected Deliverables

Implement:

Pin model, APIs, services, repository, validation
ScheduledWork model, APIs, services, repository, validation
Prisma migration
/pins page with CRUD
/schedule page with CRUD
Pin cards with favicon/image behavior
Schedule board view
Schedule table view
Dashboard integration
Sidebar navigation update
User-based access control for all new data
Clean responsive UI
Final Instruction

Add these features in a production-style but beginner-readable way.

Keep code modular, clean, and scalable.

Do not overcomplicate the code.

Make sure the final result works locally and on the deployed website.