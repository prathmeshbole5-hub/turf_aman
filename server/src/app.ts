import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import { config } from './config';

// Import Route Handlers
import authRoutes from './routes/authRoutes';
import sportsRoutes from './routes/sportsRoutes';
import groundsRoutes from './routes/groundsRoutes';
import availabilityRoutes from './routes/availabilityRoutes';
import pricingRoutes from './routes/pricingRoutes';
import bookingsRoutes from './routes/bookingsRoutes';
import paymentRoutes from './routes/paymentRoutes';
import adminRoutes from './routes/adminRoutes';
import settingsRoutes from './routes/settingsRoutes';

export const app = express();

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());

// Health Check Endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    platform: 'TURFZONE Multi-Sport API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/sports', sportsRoutes);
app.use('/api/grounds', groundsRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);

// Centralized 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found.',
  });
});

// Centralized Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Internal Server Error',
    details: err.details,
  });
});

export default app;
