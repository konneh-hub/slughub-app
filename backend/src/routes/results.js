const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');
const authenticateJWT = require('../middleware/authenticateJWT');
const authorizeRole = require('../middleware/authorizeRole');

router.use(authenticateJWT);

// Result routes
router.get('/', authorizeRole(['University Admin', 'Dean', 'HOD', 'Exam Officer', 'Lecturer']), resultController.listResults);
router.get('/:id', authorizeRole(['University Admin', 'Dean', 'HOD', 'Exam Officer', 'Lecturer', 'Student']), resultController.getResult);

// Lecturer uploads results
router.post('/upload', authorizeRole('Lecturer'), resultController.uploadResult);
router.put('/:id', authorizeRole(['Lecturer']), resultController.updateResult);

// Exam Officer approves/rejects results
router.post('/:id/approve', authorizeRole(['Exam Officer', 'HOD']), resultController.approveResult);
router.post('/:id/reject', authorizeRole(['Exam Officer', 'HOD']), resultController.rejectResult);

// Dean/Exam Officer publishes results
router.post('/:id/publish', authorizeRole(['Exam Officer', 'Dean']), resultController.publishResult);

module.exports = router;
