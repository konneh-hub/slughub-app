const express = require('express');
const router = express.Router();
const academicController = require('../controllers/academicController');
const authenticateJWT = require('../middleware/authenticateJWT');
const authorizeRole = require('../middleware/authorizeRole');

router.use(authenticateJWT);

// Academic Session routes
router.get('/sessions', authorizeRole(['University Admin', 'Dean', 'HOD', 'Exam Officer', 'Lecturer']), academicController.listAcademicSessions);
router.get('/sessions/:id', authorizeRole(['University Admin', 'Dean', 'HOD', 'Exam Officer', 'Lecturer']), academicController.getAcademicSession);
router.get('/sessions/current', authorizeRole(['University Admin', 'Dean', 'HOD', 'Exam Officer', 'Lecturer', 'Student']), academicController.getCurrentAcademicSession);
router.post('/sessions', authorizeRole('University Admin'), academicController.createAcademicSession);
router.put('/sessions/:id', authorizeRole('University Admin'), academicController.updateAcademicSession);
router.post('/sessions/:id/set-current', authorizeRole('University Admin'), academicController.setCurrentSession);
router.delete('/sessions/:id', authorizeRole('University Admin'), academicController.deleteAcademicSession);

// Semester routes
router.get('/semesters', authorizeRole(['University Admin', 'Dean', 'HOD', 'Exam Officer', 'Lecturer']), academicController.listSemesters);
router.post('/semesters', authorizeRole('University Admin'), academicController.createSemester);

// Academic Level routes
router.get('/levels', authorizeRole(['University Admin', 'Dean', 'HOD', 'Exam Officer', 'Lecturer']), academicController.listAcademicLevels);
router.post('/levels', authorizeRole('University Admin'), academicController.createAcademicLevel);

module.exports = router;
