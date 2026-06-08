const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const courseRegistrationController = require('../controllers/courseRegistrationController');
const authenticateJWT = require('../middleware/authenticateJWT');
const authorizeRole = require('../middleware/authorizeRole');

router.use(authenticateJWT);

// Student routes
router.get('/', authorizeRole(['University Admin', 'Dean', 'HOD', 'Exam Officer']), studentController.listStudents);
router.get('/:id', authorizeRole(['University Admin', 'Dean', 'HOD', 'Exam Officer', 'Lecturer', 'Student']), studentController.getStudent);
router.post('/', authorizeRole(['University Admin', 'Dean', 'HOD']), studentController.createStudent);
router.put('/:id', authorizeRole(['University Admin', 'Dean', 'HOD']), studentController.updateStudent);

// Student results and academic records
router.get('/:studentId/results', authorizeRole(['University Admin', 'Dean', 'HOD', 'Exam Officer', 'Lecturer', 'Student']), studentController.getStudentResults);
router.get('/:studentId/gpa', authorizeRole(['University Admin', 'Dean', 'HOD', 'Exam Officer', 'Student']), studentController.getStudentGPA);
router.get('/:studentId/transcript', authorizeRole(['University Admin', 'Dean', 'HOD', 'Exam Officer', 'Student']), studentController.getStudentTranscript);
router.post('/:id/registrations', authorizeRole(['University Admin', 'Dean', 'HOD', 'Exam Officer', 'Student']), courseRegistrationController.registerCourse);
router.delete('/:id/registrations/:registrationId', authorizeRole(['University Admin', 'Dean', 'HOD', 'Exam Officer', 'Student']), courseRegistrationController.deleteRegistration);
router.get('/:id/registrations', authorizeRole(['University Admin', 'Dean', 'HOD', 'Exam Officer', 'Student']), courseRegistrationController.getStudentRegistrations);

module.exports = router;
