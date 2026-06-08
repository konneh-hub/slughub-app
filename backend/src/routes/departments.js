const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const authenticateJWT = require('../middleware/authenticateJWT');
const authorizeRole = require('../middleware/authorizeRole');

router.use(authenticateJWT);

// Department routes
router.get('/', authorizeRole(['University Admin', 'Dean', 'HOD', 'Exam Officer']), departmentController.listDepartments);
router.get('/:id', authorizeRole(['University Admin', 'Dean', 'HOD', 'Exam Officer', 'Lecturer']), departmentController.getDepartment);
router.post('/', authorizeRole('University Admin'), departmentController.createDepartment);
router.put('/:id', authorizeRole('University Admin'), departmentController.updateDepartment);
router.delete('/:id', authorizeRole('University Admin'), departmentController.deleteDepartment);

module.exports = router;
