const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const config = require('./config');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const roleRoutes = require('./routes/roles');
const permissionRoutes = require('./routes/permissions');
const facultyRoutes = require('./routes/faculties');
const departmentRoutes = require('./routes/departments');
const programmeRoutes = require('./routes/programmes');
const courseRoutes = require('./routes/courses');
const studentRoutes = require('./routes/students');
const lecturerRoutes = require('./routes/lecturers');
const resultRoutes = require('./routes/results');
const academicRoutes = require('./routes/academic');
const transcriptRoutes = require('./routes/transcripts');
const auditLogRoutes = require('./routes/auditLogs');
const resultCorrectionRoutes = require('./routes/resultCorrections');
const errorHandler = require('./middleware/errorHandler');
const prisma = require('./prismaClient');

const app = express();
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    if (config.allowedOrigins && config.allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    if (config.allowLocalOrigins && /^(https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?)$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS origin denied: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
}));
app.use(express.json());
app.use(cookieParser());

// Authentication and RBAC
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);

// Academic Resources
app.use('/api/faculties', facultyRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/programmes', programmeRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/lecturers', lecturerRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/results', resultCorrectionRoutes);
app.use('/api/transcripts', transcriptRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/academic', academicRoutes);

app.use(errorHandler);

const port = config.port;

async function main() {
  const server = app.listen(port, () => console.log(`Server started on port ${port}`));
  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Please free the port or set PORT to a different value.`);
      process.exit(1);
    }
    console.error('Server error', err);
    process.exit(1);
  });
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
