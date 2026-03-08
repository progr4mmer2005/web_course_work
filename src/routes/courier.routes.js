const express = require('express');
const courierController = require('../controllers/courier.controller');
const { requireRole } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(requireRole(['courier', 'admin']));
router.get('/orders', courierController.courierOrdersPage);
router.post('/orders/:id/accept', courierController.acceptOrder);
router.post('/orders/:id/confirm', courierController.confirmDelivered);

module.exports = router;

