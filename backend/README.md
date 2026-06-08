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

Configuration

- Copy `.env.example` to `.env` and update secrets and database URL.
- Set `CORS_ORIGINS` to the frontend origin, for example `http://localhost:5173`.

API endpoints (RBAC/auth)

- POST /auth/register
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout
- GET /auth/me
- GET /users
- POST /users
- GET /users/me
- GET /users/:id
- PUT /users/:id
- DELETE /users/:id
- GET /roles
- GET /roles/:id
- POST /roles
- POST /roles/assign
- GET /permissions
- GET /permissions/:id
- POST /permissions
- POST /permissions/assign-to-role

Course registration endpoints
- POST /course-registrations/student/:id
- DELETE /course-registrations/student/:id/:registrationId
- GET /course-registrations/student/:id
- GET /course-registrations/course/:id

Academic and resource endpoints
- GET /academic/sessions
- GET /academic/sessions/:id
- GET /academic/sessions/current
- POST /academic/sessions
- PUT /academic/sessions/:id
- POST /academic/sessions/:id/set-current
- DELETE /academic/sessions/:id
- GET /academic/semesters
- POST /academic/semesters
- GET /academic/levels
- POST /academic/levels
- GET /faculties
- GET /departments
- GET /programmes
- GET /courses
- GET /students
- GET /lecturers
- GET /results
- GET /transcripts
- GET /audit-logs
