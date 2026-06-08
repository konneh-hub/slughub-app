const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');
const authenticateJWT = require('../middleware/authenticateJWT');
const authorizeRole = require('../middleware/authorizeRole');

router.use(authenticateJWT);

router.get('/', authorizeRole('University Admin'), permissionController.listPermissions);
router.get('/:id', authorizeRole('University Admin'), permissionController.getPermission);
router.post('/', authorizeRole('University Admin'), permissionController.createPermission);
router.post('/assign-to-role', authorizeRole('University Admin'), permissionController.assignPermissionToRole);

module.exports = router;
