const express = require('express');
const router = express.Router();
const transcriptController = require('../controllers/transcriptController');
const authenticateJWT = require('../middleware/authenticateJWT');
const authorizeRole = require('../middleware/authorizeRole');

router.use(authenticateJWT);

router.post('/request', authorizeRole(['University Admin', 'Exam Officer', 'Student']), transcriptController.createTranscriptRequest);
router.get('/', authorizeRole(['University Admin', 'Exam Officer', 'Dean', 'HOD', 'Student']), transcriptController.listTranscriptRequests);
router.patch('/:id/approve', authorizeRole(['University Admin', 'Exam Officer']), transcriptController.approveTranscriptRequest);
router.patch('/:id/reject', authorizeRole(['University Admin', 'Exam Officer']), transcriptController.rejectTranscriptRequest);

module.exports = router;
