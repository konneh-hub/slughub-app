const express = require('express');
const router = express.Router();
const programmeController = require('../controllers/programmeController');
const authenticateJWT = require('../middleware/authenticateJWT');
const authorizeRole = require('../middleware/authorizeRole');

router.use(authenticateJWT);

// Programme routes
router.get('/', authorizeRole(['University Admin', 'Dean', 'HOD', 'Exam Officer']), programmeController.listProgrammes);
router.get('/:id', authorizeRole(['University Admin', 'Dean', 'HOD', 'Exam Officer', 'Lecturer', 'Student']), programmeController.getProgramme);
router.post('/', authorizeRole('University Admin'), programmeController.createProgramme);
router.put('/:id', authorizeRole('University Admin'), programmeController.updateProgramme);
router.delete('/:id', authorizeRole('University Admin'), programmeController.deleteProgramme);

module.exports = router;
