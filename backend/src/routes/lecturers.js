const express = require('express');
const router = express.Router();
const lecturerController = require('../controllers/lecturerController');
const authenticateJWT = require('../middleware/authenticateJWT');
const authorizeRole = require('../middleware/authorizeRole');

router.use(authenticateJWT);

// Lecturer routes
router.get('/', authorizeRole(['University Admin', 'Dean', 'HOD', 'Exam Officer']), lecturerController.listLecturers);
router.get('/:id', authorizeRole(['University Admin', 'Dean', 'HOD', 'Exam Officer', 'Lecturer']), lecturerController.getLecturer);
router.post('/', authorizeRole(['University Admin', 'HOD']), lecturerController.createLecturer);
router.put('/:id', authorizeRole(['University Admin', 'HOD']), lecturerController.updateLecturer);

// Lecturer courses
router.get('/:id/courses', authorizeRole(['University Admin', 'Dean', 'HOD', 'Exam Officer', 'Lecturer']), lecturerController.getLecturerCourses);

// Role assignments
router.post('/:id/assign-hod', authorizeRole('University Admin'), lecturerController.assignAsHOD);
router.post('/:id/assign-dean', authorizeRole('University Admin'), lecturerController.assignAsDean);
router.post('/:id/assign-exam-officer', authorizeRole('University Admin'), lecturerController.assignAsExamOfficer);

module.exports = router;
