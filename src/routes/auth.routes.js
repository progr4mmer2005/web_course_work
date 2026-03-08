const express = require('express');
const authController = require('../controllers/auth.controller');
const { requireGuest, requireAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/login', requireGuest, authController.loginForm);
router.post('/login', requireGuest, authController.login);
router.get('/register', requireGuest, authController.registerForm);
router.post('/register', requireGuest, authController.register);
router.post('/logout', requireAuth, authController.logout);

module.exports = router;
