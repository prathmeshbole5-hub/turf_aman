import { Router } from 'express';
import { createRazorpayOrder, verifyRazorpayPayment } from '../services/paymentService';

const router = Router();

// POST /api/payments/create-order
router.post('/create-order', (req, res) => {
  try {
    const { bookingId, amount, currency } = req.body;

    if (!bookingId || !amount) {
      res.status(400).json({ success: false, error: 'bookingId and amount are required.' });
      return;
    }

    const orderData = createRazorpayOrder({
      bookingId,
      amount: Number(amount),
      currency: currency || 'INR',
    });

    res.json({ success: true, order: orderData });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/payments/verify
router.post('/verify', (req, res) => {
  try {
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!bookingId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      res.status(400).json({
        success: false,
        error: 'bookingId, razorpayOrderId, razorpayPaymentId, and razorpaySignature are required.',
      });
      return;
    }

    const result = verifyRazorpayPayment({
      bookingId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/payments/webhook
router.post('/webhook', (req, res) => {
  // Webhook listener for asynchronous payment events
  const event = req.body?.event;
  res.json({ success: true, received: true, event });
});

export default router;
