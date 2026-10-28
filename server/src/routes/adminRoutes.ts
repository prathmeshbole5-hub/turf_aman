import { Router } from 'express';
import { dbStore, type BlockedPeriodEntity } from '../db/store';
import { authenticateToken, requireRole } from '../middleware/auth';
import { createBookingWithDoubleBookingProtection } from '../services/bookingService';
import { parseTimeToMinutes } from '../utils/timeUtils';
import type { AuthenticatedRequest } from '../types';

const router = Router();

// Apply Admin Auth to all admin routes
router.use(authenticateToken, requireRole('ADMIN'));

// GET /api/admin/overview
router.get('/overview', (_req, res) => {
  const allBookings = Array.from(dbStore.bookings.values());
  const todayStr = new Date().toISOString().split('T')[0];

  const totalBookings = allBookings.length;
  const todayBookings = allBookings.filter((b) => b.date === todayStr);
  const upcomingBookings = allBookings.filter((b) => b.date >= todayStr && b.bookingStatus === 'CONFIRMED');
  const confirmedBookings = allBookings.filter((b) => b.bookingStatus === 'CONFIRMED');
  const cancelledBookings = allBookings.filter((b) => b.bookingStatus === 'CANCELLED');
  const pendingBookings = allBookings.filter((b) => b.bookingStatus === 'PENDING');

  const todayRevenue = todayBookings
    .filter((b) => b.bookingStatus !== 'CANCELLED')
    .reduce((acc, b) => acc + (b.paymentStatus === 'PAID_FULL' ? b.pricing.totalAmount : b.pricing.advanceAmount), 0);

  const totalCollectedRevenue = allBookings
    .filter((b) => b.bookingStatus !== 'CANCELLED')
    .reduce((acc, b) => acc + (b.paymentStatus === 'PAID_FULL' ? b.pricing.totalAmount : b.pricing.advanceAmount), 0);

  // Recent 5 bookings
  const recentBookings = [...allBookings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Revenue by Sport
  const sportMap = new Map<string, { sportName: string; total: number; count: number }>();
  allBookings
    .filter((b) => b.bookingStatus !== 'CANCELLED')
    .forEach((b) => {
      const name = b.sportName;
      if (!sportMap.has(name)) {
        sportMap.set(name, { sportName: name, total: 0, count: 0 });
      }
      const item = sportMap.get(name)!;
      item.total += b.pricing.totalAmount;
      item.count += 1;
    });

  res.json({
    success: true,
    kpis: {
      totalBookings,
      todayBookingsCount: todayBookings.length,
      upcomingBookingsCount: upcomingBookings.length,
      pendingBookingsCount: pendingBookings.length,
      confirmedBookingsCount: confirmedBookings.length,
      cancelledBookingsCount: cancelledBookings.length,
      todayRevenue,
      monthlyRevenue: totalCollectedRevenue + 48500, // Projected run rate
    },
    recentBookings,
    revenueBySport: Array.from(sportMap.values()),
    grounds: Array.from(dbStore.grounds.values()),
  });
});

// GET /api/admin/bookings
router.get('/bookings', (req, res) => {
  const { search, sportId, groundId, date, bookingStatus, paymentStatus, page = '1', limit = '10' } = req.query;

  let list = Array.from(dbStore.bookings.values());

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(
      (b) =>
        b.customerName.toLowerCase().includes(q) ||
        b.customerPhone.includes(q) ||
        b.referenceCode.toLowerCase().includes(q)
    );
  }

  if (sportId && typeof sportId === 'string') {
    list = list.filter((b) => b.sportId === sportId);
  }

  if (groundId && typeof groundId === 'string') {
    list = list.filter((b) => b.groundId === groundId);
  }

  if (date && typeof date === 'string') {
    list = list.filter((b) => b.date === date);
  }

  if (bookingStatus && typeof bookingStatus === 'string') {
    list = list.filter((b) => b.bookingStatus === bookingStatus.toUpperCase());
  }

  if (paymentStatus && typeof paymentStatus === 'string') {
    list = list.filter((b) => b.paymentStatus === paymentStatus.toUpperCase());
  }

  // Sort descending
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 10;
  const totalItems = list.length;
  const totalPages = Math.ceil(totalItems / limitNum);
  const paginated = list.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  res.json({
    success: true,
    totalItems,
    totalPages,
    currentPage: pageNum,
    bookings: paginated,
  });
});

// POST /api/admin/manual-booking
router.post('/manual-booking', async (req: AuthenticatedRequest, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      sportId,
      groundId,
      date,
      startTime,
      durationMinutes,
      notes,
    } = req.body;

    const booking = await createBookingWithDoubleBookingProtection({
      customerId: req.user!.userId,
      customerName,
      customerPhone,
      customerEmail,
      sportId,
      groundId,
      date,
      startTime,
      durationMinutes: Number(durationMinutes),
      paymentMethod: 'VENUE_CASH',
      paymentOption: 'full',
      notes: notes || 'Manual Admin Booking',
    });

    res.status(201).json({ success: true, booking });
  } catch (err: any) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ success: false, error: err.message });
  }
});

// Maintenance Blocks
router.get('/blocked-slots', (_req, res) => {
  res.json({
    success: true,
    blockedPeriods: Array.from(dbStore.blockedPeriods.values()),
  });
});

router.post('/blocked-slots', (req: AuthenticatedRequest, res) => {
  try {
    const { groundId, date, startTime, endTime, reason } = req.body;

    if (!groundId || !date || !startTime || !endTime) {
      res.status(400).json({ success: false, error: 'groundId, date, startTime, and endTime are required.' });
      return;
    }

    const startM = parseTimeToMinutes(startTime);
    const endM = parseTimeToMinutes(endTime);

    const block: BlockedPeriodEntity = {
      id: `block_${Date.now()}`,
      groundId,
      date,
      startTime,
      endTime,
      startMinuteOfDay: startM,
      endMinuteOfDay: endM,
      reason: reason || 'Scheduled maintenance',
      blockedByUserId: req.user!.userId,
      createdAt: new Date().toISOString(),
    };

    dbStore.blockedPeriods.set(block.id, block);

    res.status(201).json({ success: true, message: 'Maintenance period blocked.', block });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/blocked-slots/:id', (req, res) => {
  const { id } = req.params;
  if (!dbStore.blockedPeriods.has(id)) {
    res.status(404).json({ success: false, error: 'Blocked period not found.' });
    return;
  }

  dbStore.blockedPeriods.delete(id);
  res.json({ success: true, message: 'Maintenance block removed.' });
});

// Customer Directory
router.get('/customers', (_req, res) => {
  const allBookings = Array.from(dbStore.bookings.values());
  const map = new Map<string, any>();

  allBookings.forEach((b) => {
    const key = b.customerPhone;
    if (!map.has(key)) {
      map.set(key, {
        name: b.customerName,
        phone: b.customerPhone,
        email: b.customerEmail || '',
        totalBookings: 0,
        totalSpent: 0,
        lastBookingDate: b.date,
        tier: 'Standard Player',
        bookings: [],
      });
    }

    const c = map.get(key)!;
    c.totalBookings += 1;
    if (b.bookingStatus !== 'CANCELLED') {
      c.totalSpent += b.pricing.totalAmount;
    }
    c.bookings.push({
      referenceCode: b.referenceCode,
      sportName: b.sportName,
      date: b.date,
      startTime: b.startTime,
      totalAmount: b.pricing.totalAmount,
      bookingStatus: b.bookingStatus,
    });

    if (c.totalBookings >= 3 || c.totalSpent >= 4000) {
      c.tier = 'VIP Club';
    }
  });

  res.json({
    success: true,
    customers: Array.from(map.values()),
  });
});

// Audit Logs
router.get('/audit-logs', (_req, res) => {
  res.json({
    success: true,
    count: dbStore.auditLogs.length,
    auditLogs: dbStore.auditLogs.slice(-50).reverse(),
  });
});

export default router;
