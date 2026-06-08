require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const config = require('../src/config');

const prisma = new PrismaClient();

async function upsertEntity(model, where, create, update = {}) {
  return prisma[model].upsert({ where, create, update });
}

async function main() {
  console.log('Seeding users, RBAC, academic data, and system settings...');

  const roles = [
    { name: 'University Admin', description: 'Full access to the system' },
    { name: 'Dean', description: 'Faculty management and approvals' },
    { name: 'HOD', description: 'Department management and approvals' },
    { name: 'Exam Officer', description: 'Manage exam and result processes' },
    { name: 'Lecturer', description: 'Teach courses and evaluate students' },
    { name: 'Student', description: 'Access courses, results, and transcripts' }
  ];

  const createdRoles = {};
  for (const role of roles) {
    createdRoles[role.name] = await upsertEntity('role', { name: role.name }, role, { description: role.description });
  }

  const permissions = [
    { name: 'manage_users', description: 'Create and update user accounts' },
    { name: 'view_users', description: 'View user data' },
    { name: 'assign_roles', description: 'Assign roles to users' },
    { name: 'assign_permissions', description: 'Assign permissions to roles' },
    { name: 'manage_courses', description: 'Create and update courses' },
    { name: 'approve_results', description: 'Approve student results' },
    { name: 'manage_transcripts', description: 'Process transcript requests' }
  ];

  const createdPermissions = {};
  for (const permission of permissions) {
    createdPermissions[permission.name] = await upsertEntity('permission', { name: permission.name }, permission, { description: permission.description });
  }

  for (const permission of Object.values(createdPermissions)) {
    try {
      await prisma.rolePermission.create({
        data: {
          roleId: createdRoles['University Admin'].id,
          permissionId: permission.id
        }
      });
    } catch (e) {
      // ignore duplicates
    }
  }

  const rolePermissionAssignments = [
    { roleName: 'Lecturer', permissionName: 'view_users' },
    { roleName: 'Lecturer', permissionName: 'manage_courses' },
    { roleName: 'Exam Officer', permissionName: 'approve_results' },
    { roleName: 'Dean', permissionName: 'manage_transcripts' },
    { roleName: 'Student', permissionName: 'view_users' }
  ];

  for (const assignment of rolePermissionAssignments) {
    const role = createdRoles[assignment.roleName];
    const permission = createdPermissions[assignment.permissionName];
    if (!role || !permission) continue;
    try {
      await prisma.rolePermission.create({ data: { roleId: role.id, permissionId: permission.id } });
    } catch (e) {
      // ignore duplicates
    }
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@university.edu';
  const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!';

  const users = [
    { email: adminEmail, password: adminPassword, firstName: 'Super', lastName: 'Admin', roles: ['University Admin'] },
    { email: 'student1@university.edu', password: 'Student123!', firstName: 'Ada', lastName: 'Student', roles: ['Student'] },
    { email: 'lecturer1@university.edu', password: 'Lecturer123!', firstName: 'Grace', lastName: 'Lecturer', roles: ['Lecturer'] },
    { email: 'hod1@university.edu', password: 'Hod123!', firstName: 'Alan', lastName: 'HOD', roles: ['HOD'] },
    { email: 'dean1@university.edu', password: 'Dean123!', firstName: 'Dorothy', lastName: 'Dean', roles: ['Dean'] },
    { email: 'examofficer1@university.edu', password: 'Exam123!', firstName: 'Eve', lastName: 'Officer', roles: ['Exam Officer'] }
  ];

  const createdUsers = {};
  for (const userData of users) {
    const existing = await prisma.user.findUnique({ where: { email: userData.email } });
    const hashedPassword = userData.email === adminEmail
      ? await bcrypt.hash(adminPassword, config.saltRounds)
      : existing
        ? existing.password
        : await bcrypt.hash(userData.password, config.saltRounds);
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: { firstName: userData.firstName, lastName: userData.lastName, password: hashedPassword },
      create: { email: userData.email, password: hashedPassword, firstName: userData.firstName, lastName: userData.lastName }
    });
    createdUsers[userData.email] = user;

    for (const roleName of userData.roles) {
      const role = createdRoles[roleName];
      if (!role) continue;
      try {
        await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });
      } catch (e) {
        // ignore duplicates
      }
    }
  }

  const faculties = [
    { name: 'Faculty of Science', description: 'Natural and applied sciences' },
    { name: 'Faculty of Business', description: 'Business and management studies' }
  ];
  const createdFaculties = {};
  for (const item of faculties) {
    createdFaculties[item.name] = await upsertEntity('faculty', { name: item.name }, item, { description: item.description });
  }

  const departments = [
    { name: 'Computer Science', code: 'CS', facultyName: 'Faculty of Science' },
    { name: 'Business Administration', code: 'BU', facultyName: 'Faculty of Business' }
  ];
  const createdDepartments = {};

  for (const dept of departments) {
    const faculty = createdFaculties[dept.facultyName];
    createdDepartments[dept.code] = await upsertEntity(
      'department',
      { code: dept.code },
      { name: dept.name, code: dept.code, facultyId: faculty.id },
      { name: dept.name, facultyId: faculty.id }
    );
  }

  const academicLevels = [
    { name: '100 Level', sequence: 1 },
    { name: '200 Level', sequence: 2 },
    { name: '300 Level', sequence: 3 }
  ];
  const createdAcademicLevels = {};
  for (const level of academicLevels) {
    createdAcademicLevels[level.name] = await upsertEntity('academicLevel', { name: level.name }, level, { sequence: level.sequence });
  }

  const programmes = [
    { name: 'BSc Computer Science', code: 'BSC-CS', departmentCode: 'CS', academicLevelName: '100 Level' },
    { name: 'BSc Business Administration', code: 'BSC-BU', departmentCode: 'BU', academicLevelName: '100 Level' }
  ];
  const createdProgrammes = {};
  for (const programme of programmes) {
    const department = createdDepartments[programme.departmentCode];
    const academicLevel = createdAcademicLevels[programme.academicLevelName];
    createdProgrammes[programme.code] = await upsertEntity(
      'programme',
      { code: programme.code },
      {
        name: programme.name,
        code: programme.code,
        departmentId: department.id,
        academicLevelId: academicLevel.id
      },
      {
        name: programme.name,
        departmentId: department.id,
        academicLevelId: academicLevel.id
      }
    );
  }

  const academicSessions = [
    { name: '2025/2026', startDate: new Date('2025-09-01'), endDate: new Date('2026-07-31'), isCurrent: true },
    { name: '2024/2025', startDate: new Date('2024-09-01'), endDate: new Date('2025-07-31'), isCurrent: false }
  ];
  const createdAcademicSessions = {};
  for (const session of academicSessions) {
    createdAcademicSessions[session.name] = await upsertEntity(
      'academicSession',
      { name: session.name },
      session,
      { startDate: session.startDate, endDate: session.endDate, isCurrent: session.isCurrent }
    );
  }

  const semesters = [
    { name: 'First Semester', sequence: 1, startDate: new Date('2025-09-01'), endDate: new Date('2026-01-15') },
    { name: 'Second Semester', sequence: 2, startDate: new Date('2026-01-16'), endDate: new Date('2026-07-31') }
  ];
  const createdSemesters = {};
  for (const semester of semesters) {
    createdSemesters[semester.name] = await upsertEntity('semester', { name: semester.name }, semester, {
      sequence: semester.sequence,
      startDate: semester.startDate,
      endDate: semester.endDate
    });
  }

  const lecturers = [
    { email: 'lecturer1@university.edu', staffNumber: 'LEC-001', departmentCode: 'CS', title: 'Senior Lecturer' },
    { email: 'hod1@university.edu', staffNumber: 'LEC-002', departmentCode: 'CS', title: 'Head of Department' },
    { email: 'dean1@university.edu', staffNumber: 'LEC-003', departmentCode: 'BU', title: 'Dean' },
    { email: 'examofficer1@university.edu', staffNumber: 'LEC-004', departmentCode: 'BU', title: 'Exam Officer' }
  ];
  const createdLecturers = {};
  for (const lecturer of lecturers) {
    const user = createdUsers[lecturer.email];
    const department = createdDepartments[lecturer.departmentCode];
    createdLecturers[lecturer.staffNumber] = await upsertEntity(
      'lecturer',
      { staffNumber: lecturer.staffNumber },
      {
        userId: user.id,
        staffNumber: lecturer.staffNumber,
        departmentId: department.id,
        title: lecturer.title
      },
      { departmentId: department.id, title: lecturer.title, userId: user.id }
    );
  }

  const hods = [
    { lecturerStaffNumber: 'LEC-002', departmentCode: 'CS' }
  ];
  for (const hod of hods) {
    const lecturer = createdLecturers[hod.lecturerStaffNumber];
    const department = createdDepartments[hod.departmentCode];
    await upsertEntity(
      'hod',
      { lecturerId: lecturer.id },
      { lecturerId: lecturer.id, departmentId: department.id },
      { departmentId: department.id }
    );
  }

  const deans = [
    { lecturerStaffNumber: 'LEC-003', facultyName: 'Faculty of Business' }
  ];
  for (const dean of deans) {
    const lecturer = createdLecturers[dean.lecturerStaffNumber];
    const faculty = createdFaculties[dean.facultyName];
    await upsertEntity(
      'dean',
      { lecturerId: lecturer.id },
      { lecturerId: lecturer.id, facultyId: faculty.id },
      { facultyId: faculty.id }
    );
  }

  const examOfficers = [
    { lecturerStaffNumber: 'LEC-004', facultyName: 'Faculty of Business' }
  ];
  for (const officer of examOfficers) {
    const lecturer = createdLecturers[officer.lecturerStaffNumber];
    const faculty = createdFaculties[officer.facultyName];
    await upsertEntity(
      'examOfficer',
      { lecturerId: lecturer.id },
      { lecturerId: lecturer.id, facultyId: faculty.id },
      { facultyId: faculty.id }
    );
  }

  const students = [
    {
      email: 'student1@university.edu',
      matricNumber: 'CSC/2024/001',
      departmentCode: 'CS',
      programmeCode: 'BSC-CS',
      academicLevelName: '100 Level',
      admissionYear: 2024,
      status: 'active'
    }
  ];

  const createdStudents = {};
  for (const student of students) {
    const user = createdUsers[student.email];
    const department = createdDepartments[student.departmentCode];
    const programme = createdProgrammes[student.programmeCode];
    const academicLevel = createdAcademicLevels[student.academicLevelName];
    createdStudents[student.matricNumber] = await upsertEntity(
      'student',
      { matricNumber: student.matricNumber },
      {
        userId: user.id,
        matricNumber: student.matricNumber,
        departmentId: department.id,
        programmeId: programme.id,
        academicLevelId: academicLevel.id,
        admissionYear: student.admissionYear,
        status: student.status
      },
      {
        departmentId: department.id,
        programmeId: programme.id,
        academicLevelId: academicLevel.id,
        admissionYear: student.admissionYear,
        status: student.status,
        userId: user.id
      }
    );
  }

  const courses = [
    {
      code: 'CSC101',
      title: 'Introduction to Programming',
      description: 'Fundamental programming concepts using JavaScript',
      creditUnits: 3,
      departmentCode: 'CS',
      programmeCode: 'BSC-CS',
      academicLevelName: '100 Level',
      semesterName: 'First Semester'
    },
    {
      code: 'CSC102',
      title: 'Data Structures',
      description: 'Core data structures and algorithmic thinking',
      creditUnits: 3,
      departmentCode: 'CS',
      programmeCode: 'BSC-CS',
      academicLevelName: '100 Level',
      semesterName: 'First Semester'
    }
  ];

  const createdCourses = {};
  for (const course of courses) {
    const department = createdDepartments[course.departmentCode];
    const programme = createdProgrammes[course.programmeCode];
    const academicLevel = createdAcademicLevels[course.academicLevelName];
    const semester = createdSemesters[course.semesterName];
    createdCourses[course.code] = await upsertEntity(
      'course',
      { code: course.code },
      {
        code: course.code,
        title: course.title,
        description: course.description,
        creditUnits: course.creditUnits,
        departmentId: department.id,
        programmeId: programme.id,
        academicLevelId: academicLevel.id,
        semesterId: semester.id
      },
      {
        title: course.title,
        description: course.description,
        creditUnits: course.creditUnits,
        departmentId: department.id,
        programmeId: programme.id,
        academicLevelId: academicLevel.id,
        semesterId: semester.id
      }
    );
  }

  const prerequisites = [
    { courseCode: 'CSC102', prerequisiteCode: 'CSC101' }
  ];
  for (const prereq of prerequisites) {
    const course = createdCourses[prereq.courseCode];
    const prerequisite = createdCourses[prereq.prerequisiteCode];
    if (!course || !prerequisite) continue;
    try {
      await prisma.coursePrerequisite.create({
        data: {
          courseId: course.id,
          prerequisiteId: prerequisite.id
        }
      });
    } catch (e) {
      // ignore duplicates
    }
  }

  const allocations = [
    {
      courseCode: 'CSC101',
      lecturerStaffNumber: 'LEC-001',
      academicSessionName: '2025/2026',
      semesterName: 'First Semester'
    },
    {
      courseCode: 'CSC102',
      lecturerStaffNumber: 'LEC-001',
      academicSessionName: '2025/2026',
      semesterName: 'First Semester'
    }
  ];
  const createdAllocations = {};
  for (const allocation of allocations) {
    const course = createdCourses[allocation.courseCode];
    const lecturer = createdLecturers[allocation.lecturerStaffNumber];
    const academicSession = createdAcademicSessions[allocation.academicSessionName];
    const semester = createdSemesters[allocation.semesterName];
    createdAllocations[`${allocation.courseCode}-${allocation.lecturerStaffNumber}`] = await upsertEntity(
      'courseAllocation',
      {
        courseId_lecturerId_academicSessionId_semesterId: {
          courseId: course.id,
          lecturerId: lecturer.id,
          academicSessionId: academicSession.id,
          semesterId: semester.id
        }
      },
      {
        courseId: course.id,
        lecturerId: lecturer.id,
        academicSessionId: academicSession.id,
        semesterId: semester.id
      },
      {}
    );
  }

  const registrations = [
    {
      studentMatric: 'CSC/2024/001',
      courseCode: 'CSC101',
      academicSessionName: '2025/2026',
      semesterName: 'First Semester',
      status: 'registered'
    },
    {
      studentMatric: 'CSC/2024/001',
      courseCode: 'CSC102',
      academicSessionName: '2025/2026',
      semesterName: 'First Semester',
      status: 'registered'
    }
  ];
  for (const registration of registrations) {
    const student = createdStudents[registration.studentMatric];
    const course = createdCourses[registration.courseCode];
    const academicSession = createdAcademicSessions[registration.academicSessionName];
    const semester = createdSemesters[registration.semesterName];
    try {
      await prisma.courseRegistration.create({
        data: {
          studentId: student.id,
          courseId: course.id,
          academicSessionId: academicSession.id,
          semesterId: semester.id,
          status: registration.status
        }
      });
    } catch (e) {
      // ignore duplicates
    }
  }

  const gradingSystem = await upsertEntity(
    'gradingSystem',
    { name: 'Standard 5 Point' },
    { name: 'Standard 5 Point', description: 'Common 5-point grading scale' },
    { description: 'Common 5-point grading scale' }
  );

  const gradingScales = [
    { grade: 'A', minScore: 70, maxScore: 100, gradePoint: 5.0 },
    { grade: 'B', minScore: 60, maxScore: 69, gradePoint: 4.0 },
    { grade: 'C', minScore: 50, maxScore: 59, gradePoint: 3.0 },
    { grade: 'D', minScore: 45, maxScore: 49, gradePoint: 2.0 },
    { grade: 'F', minScore: 0, maxScore: 44, gradePoint: 0.0 }
  ];

  for (const scale of gradingScales) {
    try {
      await prisma.gradingScale.create({
        data: {
          gradingSystemId: gradingSystem.id,
          grade: scale.grade,
          minScore: scale.minScore,
          maxScore: scale.maxScore,
          gradePoint: scale.gradePoint
        }
      });
    } catch (e) {
      // ignore duplicates
    }
  }

  const resultData = [
    {
      studentMatric: 'CSC/2024/001',
      courseCode: 'CSC101',
      academicSessionName: '2025/2026',
      semesterName: 'First Semester',
      totalScore: 80,
      grade: 'A',
      gradePoint: 5.0,
      remark: 'Excellent',
      components: [
        { componentName: 'Exam', score: 80, maxScore: 100 }
      ],
      approvalByEmail: process.env.ADMIN_EMAIL || 'admin@university.edu',
      approvalStatus: 'approved'
    }
  ];

  for (const entry of resultData) {
    const student = createdStudents[entry.studentMatric];
    const course = createdCourses[entry.courseCode];
    const academicSession = createdAcademicSessions[entry.academicSessionName];
    const semester = createdSemesters[entry.semesterName];
    const allocationKey = `${entry.courseCode}-LEC-001`;
    const allocation = createdAllocations[allocationKey];
    if (!student || !allocation) continue;

    const resultHeader = await prisma.resultHeader.upsert({
      where: {
        studentId_courseAllocationId_academicSessionId_semesterId: {
          studentId: student.id,
          courseAllocationId: allocation.id,
          academicSessionId: academicSession.id,
          semesterId: semester.id
        }
      },
      create: {
        studentId: student.id,
        courseAllocationId: allocation.id,
        academicSessionId: academicSession.id,
        semesterId: semester.id,
        totalScore: entry.totalScore,
        grade: entry.grade,
        gradePoint: entry.gradePoint,
        remark: entry.remark
      },
      update: {
        totalScore: entry.totalScore,
        grade: entry.grade,
        gradePoint: entry.gradePoint,
        remark: entry.remark
      }
    });

    for (const component of entry.components) {
      try {
        await prisma.result.create({
          data: {
            resultHeaderId: resultHeader.id,
            componentName: component.componentName,
            score: component.score,
            maxScore: component.maxScore
          }
        });
      } catch (e) {
        // ignore duplicates
      }
    }

    const approver = createdUsers[entry.approvalByEmail];
    if (approver) {
      try {
        await prisma.resultApproval.create({
          data: {
            resultHeaderId: resultHeader.id,
            approvedById: approver.id,
            status: entry.approvalStatus,
            comment: 'Initial approval'
          }
        });
      } catch (e) {
        // ignore duplicates
      }
    }
  }

  const student = createdStudents['CSC/2024/001'];
  const currentSession = createdAcademicSessions['2025/2026'];
  const firstSemester = createdSemesters['First Semester'];

  if (student && currentSession && firstSemester) {
    try {
      await prisma.gpaRecord.create({
        data: {
          studentId: student.id,
          academicSessionId: currentSession.id,
          semesterId: firstSemester.id,
          gpa: 4.8
        }
      });
    } catch (e) {
      // ignore duplicates
    }

    try {
      await prisma.cgpaRecord.create({
        data: {
          studentId: student.id,
          academicSessionId: currentSession.id,
          cgpa: 4.6
        }
      });
    } catch (e) {
      // ignore duplicates
    }

    const transcriptRequest = await prisma.transcriptRequest.upsert({
      where: { id: 1 },
      create: {
        studentId: student.id,
        academicSessionId: currentSession.id,
        requestedAt: new Date(),
        status: 'processed',
        processedAt: new Date(),
        processedById: createdUsers[process.env.ADMIN_EMAIL || 'admin@university.edu'].id
      },
      update: {
        status: 'processed',
        processedAt: new Date(),
        processedById: createdUsers[process.env.ADMIN_EMAIL || 'admin@university.edu'].id
      }
    });

    try {
      await prisma.transcript.upsert({
        where: { transcriptRequestId: transcriptRequest.id },
        create: {
          transcriptRequestId: transcriptRequest.id,
          issuedAt: new Date(),
          content: 'Official transcript content placeholder',
          status: 'issued'
        },
        update: {
          issuedAt: new Date(),
          content: 'Official transcript content placeholder',
          status: 'issued'
        }
      });
    } catch (e) {
      // ignore duplicates
    }
  }

  const notifications = [
    {
      userEmail: 'student1@university.edu',
      title: 'Welcome to Slughub',
      message: 'Your student account has been initialized.',
      isRead: false
    }
  ];
  for (const notification of notifications) {
    const user = createdUsers[notification.userEmail];
    if (!user) continue;
    try {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: notification.title,
          message: notification.message,
          isRead: notification.isRead
        }
      });
    } catch (e) {
      // ignore duplicates
    }
  }

  const systemSettings = [
    { key: 'site_name', value: 'Slughub University System', description: 'Application name' },
    { key: 'default_language', value: 'en', description: 'Default interface language' },
    { key: 'terms_of_service_url', value: 'https://university.example.com/terms', description: 'Terms of service URL' }
  ];
  for (const setting of systemSettings) {
    await upsertEntity('systemSetting', { key: setting.key }, setting, { value: setting.value, description: setting.description });
  }

  const adminUser = createdUsers[process.env.ADMIN_EMAIL || 'admin@university.edu'];
  if (adminUser) {
    try {
      await prisma.auditLog.create({
        data: {
          userId: adminUser.id,
          action: 'Seed data initialization',
          ip: '127.0.0.1',
          meta: { seed: true }
        }
      });
    } catch (e) {
      // ignore duplicates
    }
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
