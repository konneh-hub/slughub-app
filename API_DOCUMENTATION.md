# SLUGHub Backend API Documentation

## Role-Based Access Control (RBAC)

The backend implements comprehensive RBAC with 6 roles:
1. **University Admin** - Full system access
2. **Exam Officer** - Result management and approval
3. **Dean** - Faculty-level oversight
4. **Head of Department (HOD)** - Department management
5. **Lecturer** - Course and result submission
6. **Student** - Personal academic records access

---

## API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /auth/register` - User self-registration
- `POST /auth/login` - User login (returns accessToken & refreshToken)
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current authenticated user

### User Management (`/api/users`)
- `GET /users` - List all users (Admin, Exam Officer)
- `GET /users/me` - Get current user profile
- `GET /users/:id` - Get specific user (all authenticated users)
- `POST /users` - Create new user (Admin only)
- `PUT /users/:id` - Update user (Admin, Dean, HOD, Exam Officer)
- `DELETE /users/:id` - Deactivate user (Admin only)

### Role Management (`/api/roles`)
- `GET /roles` - List all roles (Admin)
- `GET /roles/:id` - Get specific role (Admin)
- `POST /roles` - Create new role (Admin)
- `POST /roles/assign` - Assign role to user (Admin)

### Permission Management (`/api/permissions`)
- `GET /permissions` - List all permissions (Admin)
- `GET /permissions/:id` - Get specific permission (Admin)
- `POST /permissions` - Create new permission (Admin)
- `POST /permissions/assign-to-role` - Assign permission to role (Admin)

### Faculty Management (`/api/faculties`)
- `GET /faculties` - List all faculties (Admin, Dean, Exam Officer)
- `GET /faculties/:id` - Get specific faculty
- `POST /faculties` - Create faculty (Admin)
- `PUT /faculties/:id` - Update faculty (Admin)
- `DELETE /faculties/:id` - Delete faculty (Admin)

### Department Management (`/api/departments`)
- `GET /departments` - List all departments (Admin, Dean, HOD, Exam Officer)
- `GET /departments/:id` - Get specific department
- `POST /departments` - Create department (Admin)
- `PUT /departments/:id` - Update department (Admin)
- `DELETE /departments/:id` - Delete department (Admin)

### Programme Management (`/api/programmes`)
- `GET /programmes` - List all programmes (Admin, Dean, HOD, Exam Officer)
- `GET /programmes/:id` - Get specific programme
- `POST /programmes` - Create programme (Admin)
- `PUT /programmes/:id` - Update programme (Admin)
- `DELETE /programmes/:id` - Delete programme (Admin)

### Course Management (`/api/courses`)
- `GET /courses` - List all courses (all authenticated users)
- `GET /courses/:id` - Get specific course
- `POST /courses` - Create course (Admin, HOD)
- `PUT /courses/:id` - Update course (Admin, HOD)
- `DELETE /courses/:id` - Delete course (Admin, HOD)
- `POST /courses/allocate` - Allocate course to lecturer (Admin, HOD)

### Lecturer Management (`/api/lecturers`)
- `GET /lecturers` - List all lecturers (Admin, Dean, HOD, Exam Officer)
- `GET /lecturers/:id` - Get specific lecturer
- `POST /lecturers` - Create lecturer (Admin, HOD)
- `PUT /lecturers/:id` - Update lecturer (Admin, HOD)
- `GET /lecturers/:id/courses` - Get lecturer's allocated courses
- `POST /lecturers/:id/assign-hod` - Assign as HOD (Admin)
- `POST /lecturers/:id/assign-dean` - Assign as Dean (Admin)
- `POST /lecturers/:id/assign-exam-officer` - Assign as Exam Officer (Admin)

### Student Management (`/api/students`)
- `GET /students` - List all students (Admin, Dean, HOD, Exam Officer)
- `GET /students/:id` - Get specific student
- `POST /students` - Create student (Admin, Dean, HOD)
- `PUT /students/:id` - Update student (Admin, Dean, HOD)
- `GET /students/:studentId/results` - Get student results
- `GET /students/:studentId/gpa` - Get student GPA records
- `GET /students/:studentId/transcript` - Get student transcript

### Result Management (`/api/results`)
- `GET /results` - List results (Admin, Dean, HOD, Exam Officer, Lecturer)
- `GET /results/:id` - Get specific result
- `POST /results/upload` - Upload results (Lecturer)
- `PUT /results/:id` - Update result (Lecturer)
- `POST /results/:id/approve` - Approve result (Exam Officer, HOD)
- `POST /results/:id/reject` - Reject result (Exam Officer, HOD)
- `POST /results/:id/publish` - Publish result (Exam Officer, Dean)

### Academic Management (`/api/academic`)

#### Academic Sessions
- `GET /academic/sessions` - List all sessions (Admin, Dean, HOD, Exam Officer, Lecturer)
- `GET /academic/sessions/:id` - Get specific session
- `POST /academic/sessions` - Create session (Admin)
- `PUT /academic/sessions/:id` - Update session (Admin)
- `POST /academic/sessions/:id/set-current` - Set as current session (Admin)
- `DELETE /academic/sessions/:id` - Delete session (Admin)

#### Semesters
- `GET /academic/semesters` - List all semesters (Admin, Dean, HOD, Exam Officer, Lecturer)
- `POST /academic/semesters` - Create semester (Admin)

#### Academic Levels
- `GET /academic/levels` - List academic levels (Admin, Dean, HOD, Exam Officer, Lecturer)
- `POST /academic/levels` - Create academic level (Admin)

---

## Role Responsibilities & Permissions

### University Admin
**Full System Access**
- Manage all users (create, edit, delete)
- Create/edit/delete lecturers, students, HODs, Deans, Exam Officers
- Manage faculties, departments, programmes
- Configure academic sessions, semesters, levels
- Assign system roles and permissions
- Monitor system activities (audit logs)
- View all results and records

### Exam Officer
**Result Processing & Verification**
- Access student academic records
- Approve/reject submitted results
- View and publish results
- Generate result reports and statistics
- Access department and faculty results
- View all users and students

### Dean
**Faculty Oversight**
- View all departments within faculty
- Approve faculty-level results
- Access faculty reports and statistics
- View lecturers and students in faculty
- Review departmental results

### Head of Department (HOD)
**Department Management**
- Supervise lecturers in department
- Assign courses to lecturers
- Approve departmental results
- Access all students and lecturers in department
- Generate departmental reports
- Create and update courses
- Monitor student academic progress

### Lecturer
**Course & Result Management**
- Access only assigned courses
- Upload CA and examination scores
- Edit scores before submission deadline
- Submit final results
- View students registered for courses
- Print class result sheets
- Access personal teaching timetable

### Student
**Personal Academic Records**
- Access only personal academic records
- View registered courses and grades
- View GPA and CGPA
- Print unofficial result slips
- Download result reports
- Check academic status

---

## Database Connection

**Remote MySQL on Railway**
- Host: `acela.proxy.rlwy.net`
- Port: `48689`
- Database: `railway`
- User: `root`

**Seeded Data:**
- 6 Users (Admin, Student, Lecturer, HOD, Dean, Exam Officer)
- 6 Roles with proper permissions
- 7 Permissions
- 2 Faculties with departments, programmes, and courses
- Academic sessions, semesters, and levels

---

## Authentication Flow

1. User logs in with email & password → `POST /api/auth/login`
2. Backend returns `accessToken` (JWT, 15m expiry) + `refreshToken` (7d expiry)
3. Frontend stores tokens in localStorage
4. Frontend sends JWT in `Authorization: Bearer <token>` header for protected routes
5. Backend verifies JWT and checks user roles/permissions
6. If access token expires, frontend uses refresh token → `POST /api/auth/refresh`
7. On logout → `POST /api/auth/logout` (invalidates refresh token)

---

## Error Handling

All endpoints return standard error responses:
```json
{
  "error": "Error message describing what went wrong"
}
```

Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `500` - Server Error

---

## CORS Configuration

- Frontend (localhost:5173-5176): ✅ Allowed
- Production: Set `CORS_ORIGINS` in `.env`

---

## Backend Status

✅ All controllers implemented
✅ All routes registered  
✅ Role-based access control enforced
✅ Database connected to Railway
✅ Audit logging enabled
✅ JWT authentication configured
