const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { createPaymentIntent, confirmPayment } = require('../controllers/paymentController');

router.post('/create-intent', authMiddleware, createPaymentIntent);
router.post('/confirm', authMiddleware, confirmPayment);

module.exports = router;