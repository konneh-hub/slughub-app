const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const authenticateJWT = require('../middleware/authenticateJWT');
const authorizeRole = require('../middleware/authorizeRole');

router.use(authenticateJWT);

// Course routes
router.get('/', authorizeRole(['University Admin', 'Dean', 'HOD', 'Exam Officer', 'Lecturer', 'Student']), courseController.listCourses);
router.get('/:id', authorizeRole(['University Admin', 'Dean', 'HOD', 'Exam Officer', 'Lecturer', 'Student']), courseController.getCourse);
router.post('/', authorizeRole(['University Admin', 'HOD']), courseController.createCourse);
router.put('/:id', authorizeRole(['University Admin', 'HOD']), courseController.updateCourse);
router.delete('/:id', authorizeRole(['University Admin', 'HOD']), courseController.deleteCourse);
router.post('/allocate', authorizeRole(['University Admin', 'HOD']), courseController.allocateCourse);

module.exports = router;
