const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateJWT = require('../middleware/authenticateJWT');
const authorizeRole = require('../middleware/authorizeRole');

// Protect all user routes
router.use(authenticateJWT);

// only admins or exam officers can list users (example)
router.get('/', authorizeRole(['University Admin', 'Exam Officer']), userController.listUsers);
router.get('/:id', authorizeRole(['University Admin', 'Dean', 'HOD', 'Exam Officer', 'Lecturer', 'Student']), userController.getUser);
router.put('/:id', authorizeRole(['University Admin', 'Dean', 'HOD', 'Exam Officer']), userController.updateUser);
router.delete('/:id', authorizeRole(['University Admin']), userController.deleteUser);

module.exports = router;
