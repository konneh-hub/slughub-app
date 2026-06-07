Backend RBAC service

Setup

1. Copy `.env.example` to `.env` and ensure `DATABASE_URL` has the correct MySQL credentials.
   - Default connection: `mysql://root:Mk@15590@localhost:3306/slughub`
   - Ensure MySQL is running on port 3306.
2. Install dependencies: `npm install` inside `backend`.
3. Generate Prisma client: `npx prisma generate`.
4. Run migrations: `npx prisma migrate dev --name init` (creates the `slughub` database if it doesn't exist).
5. Seed default roles/permissions: `npm run prisma:seed`.
6. Start dev server: `npm run dev`.

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
