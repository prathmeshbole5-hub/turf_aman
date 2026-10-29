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

// Serverless Rewrite Path Normalizer (recovers original path on Vercel while preserving query string)
app.use((req: Request, _res: Response, next: NextFunction) => {
  const queryIndex = req.url.indexOf('?');
  const queryString = queryIndex !== -1 ? req.url.slice(queryIndex) : '';

  const matchedPath = (req.headers['x-matched-path'] as string) || '';
  if (matchedPath && (matchedPath.startsWith('/api') || matchedPath.includes('/api/'))) {
    req.url = `${matchedPath}${queryString}`;
  } else if (req.query && req.query.path) {
    const subpath = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
    req.url = `/${subpath}${queryString}`;
  }
  next();
});

// Health Check Endpoint
const handleHealth = (_req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    platform: 'TURFZONE Multi-Sport API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
};
app.get('/api/health', handleHealth);
app.get('/health', handleHealth);

// API Routes (Mounted on both /api/* and root /* for complete serverless compatibility)
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);
app.use('/api/sports', sportsRoutes);
app.use('/sports', sportsRoutes);
app.use('/api/grounds', groundsRoutes);
app.use('/grounds', groundsRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/availability', availabilityRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/pricing', pricingRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/bookings', bookingsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/settings', settingsRoutes);

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
