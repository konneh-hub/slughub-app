const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const authenticateJWT = require('../middleware/authenticateJWT');
const authorizeRole = require('../middleware/authorizeRole');

router.use(authenticateJWT);

router.get('/', authorizeRole('University Admin'), roleController.listRoles);
router.get('/:id', authorizeRole('University Admin'), roleController.getRole);
router.post('/', authorizeRole('University Admin'), roleController.createRole);
router.post('/assign', authorizeRole('University Admin'), roleController.assignRole);

module.exports = router;
