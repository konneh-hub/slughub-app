const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController');
const authenticateJWT = require('../middleware/authenticateJWT');
const authorizeRole = require('../middleware/authorizeRole');

router.use(authenticateJWT);

// Faculty routes - University Admin only
router.get('/', authorizeRole(['University Admin', 'Dean', 'Exam Officer']), facultyController.listFaculties);
router.get('/:id', authorizeRole(['University Admin', 'Dean', 'Exam Officer']), facultyController.getFaculty);
router.post('/', authorizeRole('University Admin'), facultyController.createFaculty);
router.put('/:id', authorizeRole('University Admin'), facultyController.updateFaculty);
router.delete('/:id', authorizeRole('University Admin'), facultyController.deleteFaculty);

module.exports = router;
