const express = require('express');
const profileController = require('../controllers/profile.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', requireAuth, profileController.profilePage);
router.get('/password', requireAuth, profileController.passwordPage);
router.get('/orders/:id', requireAuth, profileController.orderDetailsPage);
router.get('/order-details/:id', requireAuth, profileController.orderDetailsPage);
router.post('/', requireAuth, profileController.updateProfile);
router.post('/password', requireAuth, profileController.updatePassword);
router.post('/orders/:id/confirm-delivery', requireAuth, profileController.confirmOrderDelivery);

module.exports = router;
