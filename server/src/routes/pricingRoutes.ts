import { Router } from 'express';
import { calculateAuthoritativePrice } from '../services/pricingService';

const router = Router();

// POST /api/pricing/calculate
router.post('/calculate', (req, res) => {
  try {
    const { sportId, groundId, date, startTime, durationMinutes, selectedAddOns, discountCode, paymentOption } = req.body;

    if (!sportId || !groundId || !date || !startTime || !durationMinutes) {
      res.status(400).json({
        success: false,
        error: 'sportId, groundId, date, startTime, and durationMinutes are required.',
      });
      return;
    }

    const result = calculateAuthoritativePrice({
      sportId,
      groundId,
      date,
      startTime,
      durationMinutes: Number(durationMinutes),
      selectedAddOns,
      discountCode,
      paymentOption,
    });

    res.json({ success: true, pricing: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;
