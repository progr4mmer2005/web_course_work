const express = require('express');
const checkoutController = require('../controllers/checkout.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', requireAuth, checkoutController.checkoutPage);
router.post('/', requireAuth, checkoutController.placeOrder);

module.exports = router;
