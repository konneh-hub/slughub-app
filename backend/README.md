Backend RBAC service

Setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL` and secrets.
2. Install dependencies: `npm install` inside `backend`.
3. Generate Prisma client: `npx prisma generate`.
4. Run migrations: `npx prisma migrate dev --name init`.
5. Start dev server: `npm run dev`.

API endpoints (RBAC/auth)

- POST /auth/register
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout
- GET /users
- GET /users/:id
- PUT /users/:id
- DELETE /users/:id
- POST /roles
- POST /roles/assign
- POST /permissions
- POST /permissions/assign-to-role
