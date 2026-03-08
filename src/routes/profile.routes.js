const express = require('express');
const profileController = require('../controllers/profile.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', requireAuth, profileController.profilePage);
router.get('/password', requireAuth, profileController.passwordPage);
router.post('/', requireAuth, profileController.updateProfile);
router.post('/password', requireAuth, profileController.updatePassword);
router.post('/orders/:id/confirm-delivery', requireAuth, profileController.confirmOrderDelivery);

module.exports = router;
