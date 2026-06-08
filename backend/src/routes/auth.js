const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticateJWT = require('../middleware/authenticateJWT');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/change-password', authenticateJWT, authController.changePassword);
router.get('/me', authenticateJWT, authController.me);

module.exports = router;
