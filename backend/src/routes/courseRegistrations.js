const express = require('express');
const router = express.Router();
const courseRegistrationController = require('../controllers/courseRegistrationController');
const authenticateJWT = require('../middleware/authenticateJWT');
const authorizeRole = require('../middleware/authorizeRole');

router.use(authenticateJWT);

// Dedicated course registration routes
router.get(
  '/course/:id',
  authorizeRole(['University Admin', 'Dean', 'HOD', 'Exam Officer', 'Lecturer', 'Student']),
  courseRegistrationController.getCourseRegistrations
);
router.get(
  '/student/:id',
  authorizeRole(['University Admin', 'Dean', 'HOD', 'Exam Officer', 'Student']),
  courseRegistrationController.getStudentRegistrations
);
router.post(
  '/student/:id',
  authorizeRole(['University Admin', 'Dean', 'HOD', 'Exam Officer', 'Student']),
  courseRegistrationController.registerCourse
);
router.delete(
  '/student/:id/:registrationId',
  authorizeRole(['University Admin', 'Dean', 'HOD', 'Exam Officer', 'Student']),
  courseRegistrationController.deleteRegistration
);

module.exports = router;
