import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'turfzone_super_secret_jwt_key_2026_sports_tech',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_turfzone2026',
    keySecret: process.env.RAZORPAY_KEY_SECRET || 'turfzone_razorpay_secret_test_key_8492',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || 'turfzone_webhook_secret_key',
  },
  policy: {
    advancePercentage: 25,
    cancellationWindowHours: 12,
    taxPercentage: 5,
    holdDurationMinutes: 10,
  },
  adminSeed: {
    email: process.env.ADMIN_EMAIL || 'admin@turfzone.com',
    password: process.env.ADMIN_PASSWORD || 'TurfZone@2026!Admin',
    name: 'Arena Super Admin',
    phone: '8441998303',
  },
};
