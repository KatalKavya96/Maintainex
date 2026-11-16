# Maintainex

Maintainex is a personal open-source maintenance tracking dashboard for manually tracking repository and organization activity.

It currently includes:

- Next.js, TypeScript, Tailwind CSS frontend
- Responsive dashboard, activities, analytics, calendar, organizations, repositories, and settings pages
- Reusable UI components for tables, forms, cards, charts, filters, and badges
- Express.js, TypeScript backend with modular controller/service/repository structure
- Prisma ORM schema for MySQL
- REST API routes for activities, organizations, repositories, and analytics

## Project Structure

Quest discovery, publishing, private planning, evidence, and self-reported completion are implemented alongside unified search. See the [implementation and migration guide](docs/implementation/quest-flow/README.md) before starting the updated backend. The included quest-workspace migration must be applied to the database first.

Run the quest/search regression suite with `npm test --workspace maintainex-server`.

```txt
client/   Next.js frontend
server/   Express API and Prisma schema
```

## Frontend

```bash
cd client
npm install
npm run dev
```

The frontend runs at:

```txt
http://localhost:3000
```

For local frontend-to-backend API testing, create `client/.env.local`:

```txt
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

## Backend

Create a Neon Postgres database, then run:

```bash
cd server
npm install
cp .env.example .env
npx prisma db push
npm run dev
```

The API runs at:

```txt
http://localhost:5001
```

Health check:

```txt
GET /health
```

Backend env variables:

```txt
DATABASE_URL="postgresql://maintainex:replace-with-database-password@localhost:5432/maintainex?schema=public"
PORT=5001
CLIENT_URL=https://your-production-frontend.vercel.app
CLIENT_URLS=http://localhost:3000,https://your-production-frontend.vercel.app
ALLOW_VERCEL_ORIGINS=true
JWT_SECRET="replace-with-a-cryptographically-random-secret"
SIGNUP_ADMIN_CODE="replace-with-a-private-invitation-code"
GITHUB_CLIENT_ID=your-github-oauth-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-client-secret
GITHUB_REDIRECT_URI=https://your-backend-api-domain.vercel.app/api/github/callback
GITHUB_AUTH_REDIRECT_URI=
GITHUB_TOKEN_ENCRYPTION_KEY=replace-with-a-long-random-secret
GITHUB_OAUTH_SCOPES=read:user user:email public_repo
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GOOGLE_REDIRECT_URI=https://your-backend-api-domain.vercel.app/api/auth/oauth/google/callback
RESEND_API_KEY=your-resend-api-key
MAIL_FROM=Maintainex <noreply@your-domain.com>
EMAIL_DNS_CHECK=true
```

Use `CLIENT_URLS` for multiple frontend origins, such as localhost plus Vercel production or preview URLs.
Use `GITHUB_REDIRECT_URI` for both GitHub login and GitHub sync unless you create a second GitHub OAuth app, in which case set `GITHUB_AUTH_REDIRECT_URI` for login.

### Scheduled GitHub sync

The in-app "Keep in sync automatically" switch only runs while Maintainex is open. To sync on a schedule instead:

1. Set `CRON_SECRET` on the backend (at least 32 characters, for example `openssl rand -hex 32`).
2. In this repository's GitHub settings, add the variable `MAINTAINEX_SYNC_URL` (`https://<your-api>/api/github/cron-sync`) and the secret `MAINTAINEX_CRON_SECRET` (same value as `CRON_SECRET`).
3. `.github/workflows/scheduled-sync.yml` then calls the endpoint hourly. Run it once by hand from the Actions tab to check it.

Each run syncs accounts that have automatic sync on and have not synced in the last 45 minutes. With reviews imported, it also records each reviewer's real verdict (approved, changes requested or commented) and the pull requests they merged for others. Vercel Cron can call the same endpoint with `GET` instead.

## API Routes

Activities:

```txt
POST   /api/activities
GET    /api/activities
GET    /api/activities/:id
PUT    /api/activities/:id
DELETE /api/activities/:id
```

Organizations:

```txt
POST   /api/organizations
GET    /api/organizations
GET    /api/organizations/:id
PUT    /api/organizations/:id
DELETE /api/organizations/:id
```

Repositories:

```txt
POST   /api/repositories
GET    /api/repositories
GET    /api/repositories/:id
PUT    /api/repositories/:id
DELETE /api/repositories/:id
```

Analytics:

```txt
GET /api/analytics/summary
GET /api/analytics/daily
GET /api/analytics/weekly
GET /api/analytics/monthly
GET /api/analytics/yearly
GET /api/analytics/repositories
GET /api/analytics/organizations
GET /api/analytics/activity-types
```

## Notes

When `NEXT_PUBLIC_API_URL` is set, the frontend talks to the backend API and Neon database. Auth uses the `maintainex.token` cookie; user data is not stored in browser local storage.

## Vercel Env Variables

If frontend and backend are deployed together on the same Vercel project, the frontend can use the same-domain `/api` route automatically. You may leave `NEXT_PUBLIC_API_URL` unset, or set it explicitly:

```txt
NEXT_PUBLIC_API_URL=/api
```

If frontend and backend are separate deployments, add this to the frontend project:

```txt
NEXT_PUBLIC_API_URL=https://your-backend-api-domain.vercel.app/api
```

The backend needs:

```txt
DATABASE_URL="postgresql://maintainex:replace-with-database-password@localhost:5432/maintainex?schema=public"
CLIENT_URL=https://your-production-frontend.vercel.app
CLIENT_URLS=https://your-production-frontend.vercel.app
ALLOW_VERCEL_ORIGINS=true
JWT_SECRET="replace-with-a-cryptographically-random-secret"
SIGNUP_ADMIN_CODE="replace-with-a-private-invitation-code"
GITHUB_CLIENT_ID=your-github-oauth-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-client-secret
GITHUB_REDIRECT_URI=https://your-backend-api-domain.vercel.app/api/github/callback
GITHUB_AUTH_REDIRECT_URI=
GITHUB_TOKEN_ENCRYPTION_KEY=replace-with-a-long-random-secret
GITHUB_OAUTH_SCOPES=read:user user:email public_repo
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GOOGLE_REDIRECT_URI=https://your-backend-api-domain.vercel.app/api/auth/oauth/google/callback
RESEND_API_KEY=your-resend-api-key
MAIL_FROM=Maintainex <noreply@your-domain.com>
EMAIL_DNS_CHECK=true
```

The first signed-up account becomes `ADMIN`. Later signups become `VIEWER` unless they provide `SIGNUP_ADMIN_CODE`.


## Architecture and design inventory

Read [agent boundaries](./AGENTS.md), [architecture](./docs/architecture/README.md), and [component lifecycle](./docs/design/inventory/README.md). Run `npm run check` before building. The live component reference is `/design-system`; it requires no account or backend. Generate its source inventory with `npm run inventory:update --workspace maintainex-client`.
