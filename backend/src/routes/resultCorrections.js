const express = require('express');
const router = express.Router();
const resultCorrectionController = require('../controllers/resultCorrectionController');
const authenticateJWT = require('../middleware/authenticateJWT');
const authorizeRole = require('../middleware/authorizeRole');

router.use(authenticateJWT);

router.post('/:id/corrections', authorizeRole(['University Admin', 'Exam Officer', 'HOD', 'Dean', 'Lecturer', 'Student']), resultCorrectionController.createCorrection);
router.get('/:id/corrections', authorizeRole(['University Admin', 'Exam Officer', 'HOD', 'Dean', 'Lecturer', 'Student']), resultCorrectionController.listCorrections);
router.patch('/corrections/:id/approve', authorizeRole(['University Admin', 'Exam Officer', 'HOD', 'Dean']), resultCorrectionController.approveCorrection);

module.exports = router;
