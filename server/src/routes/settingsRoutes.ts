import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Store dynamic facility settings
let facilitySettings = {
  brandName: 'ELITE CRICKET BOX',
  venueName: 'Elite Cricket Box',
  address: '27.157171, 75.727844',
  area: 'Jaipur',
  city: 'Rajasthan',
  phone: '+91 84419 98303',
  email: 'arpity12410@gmail.com',
  operatingHours: {
    openTime: '06:00 AM',
    closeTime: '01:00 AM',
    daysText: 'Open 7 Days a Week',
  },
  policy: {
    advancePercentage: 25,
    cancellationWindowHours: 12,
    refundPercentage: 100,
  },
  paymentMethods: {
    razorpay: true,
    payAtVenue: true,
  },
};

// GET /api/settings - Public
router.get('/', (_req, res) => {
  res.json({ success: true, settings: facilitySettings });
});

// PUT /api/settings - Admin Only
router.put('/', authenticateToken, requireRole('ADMIN'), (req, res) => {
  facilitySettings = {
    ...facilitySettings,
    ...req.body,
  };
  res.json({ success: true, message: 'Settings updated successfully.', settings: facilitySettings });
});

export default router;
