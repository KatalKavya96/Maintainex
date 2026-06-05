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
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
PORT=5001
CLIENT_URL=https://your-production-frontend.vercel.app
CLIENT_URLS=http://localhost:3000,https://your-production-frontend.vercel.app
ALLOW_VERCEL_ORIGINS=true
JWT_SECRET=replace-with-a-long-random-secret
SIGNUP_ADMIN_CODE=optional-admin-invite-code
```

Use `CLIENT_URLS` for multiple frontend origins, such as localhost plus Vercel production or preview URLs.

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

When `NEXT_PUBLIC_API_URL` is set, the frontend stores activities through the backend API and Neon database. Without it, the frontend falls back to browser local storage for local-only testing.

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
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
CLIENT_URL=https://your-production-frontend.vercel.app
CLIENT_URLS=https://your-production-frontend.vercel.app
ALLOW_VERCEL_ORIGINS=true
JWT_SECRET=replace-with-a-long-random-secret
SIGNUP_ADMIN_CODE=optional-admin-invite-code
```

The first signed-up account becomes `ADMIN`. Later signups become `VIEWER` unless they provide `SIGNUP_ADMIN_CODE`.
