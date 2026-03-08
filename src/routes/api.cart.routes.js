const express = require('express');
const cartController = require('../controllers/cart.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/items', requireAuth, cartController.addOrUpdateItem);
router.delete('/items/:productId', requireAuth, cartController.removeItem);
router.post('/promos', requireAuth, cartController.addPromoCode);
router.delete('/promos/:code', requireAuth, cartController.removePromoCode);

module.exports = router;
