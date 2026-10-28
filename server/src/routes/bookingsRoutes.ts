import { Router } from 'express';
import { dbStore } from '../db/store';
import { createBookingWithDoubleBookingProtection, type CreateBookingInput } from '../services/bookingService';
import { optionalAuth, authenticateToken } from '../middleware/auth';
import type { AuthenticatedRequest } from '../types';
import { config } from '../config';
import { sendBookingConfirmationNotifications } from '../services/notificationService';

const router = Router();

// POST /api/bookings - Create Booking with Double-Booking Protection
router.post('/', optionalAuth, async (req: AuthenticatedRequest, res) => {
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
      paymentMethod,
      paymentOption,
      selectedAddOns,
      discountCode,
      notes,
    } = req.body;

    if (!customerName || !customerPhone || !sportId || !groundId || !date || !startTime || !durationMinutes) {
      res.status(400).json({
        success: false,
        error: 'customerName, customerPhone, sportId, groundId, date, startTime, and durationMinutes are required.',
      });
      return;
    }

    const customerId = req.user?.userId || `guest_${Date.now()}`;

    const input: CreateBookingInput = {
      customerId,
      customerName,
      customerPhone,
      customerEmail,
      sportId,
      groundId,
      date,
      startTime,
      durationMinutes: Number(durationMinutes),
      paymentMethod: paymentMethod || 'RAZORPAY',
      paymentOption: paymentOption || 'full',
      selectedAddOns,
      discountCode,
      notes,
    };

    const booking = await createBookingWithDoubleBookingProtection(input);

    // Dispatch automated confirmation notifications
    const notification = sendBookingConfirmationNotifications(booking);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully.',
      booking,
      notification,
    });
  } catch (err: any) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: err.message,
      details: err.details,
    });
  }
});

// GET /api/bookings/my - Search customer bookings by phone or user token
router.get('/my', optionalAuth, (req: AuthenticatedRequest, res) => {
  const { phone } = req.query;
  const userId = req.user?.userId;

  let customerBookings = Array.from(dbStore.bookings.values());

  if (phone && typeof phone === 'string') {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    customerBookings = customerBookings.filter((b) => b.customerPhone.replace(/[^0-9]/g, '').includes(cleanPhone));
  } else if (userId) {
    customerBookings = customerBookings.filter((b) => b.customerId === userId);
  } else {
    res.status(400).json({
      success: false,
      error: 'Please provide phone query parameter or log in to view your bookings.',
    });
    return;
  }

  // Sort by date/created descending
  customerBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    success: true,
    count: customerBookings.length,
    bookings: customerBookings,
  });
});

// GET /api/bookings/:refOrId - Get booking by Reference Code or ID
router.get('/:refOrId', (req, res) => {
  const { refOrId } = req.params;
  const booking = Array.from(dbStore.bookings.values()).find(
    (b) => b.id === refOrId || b.referenceCode.toUpperCase() === refOrId.toUpperCase()
  );

  if (!booking) {
    res.status(404).json({ success: false, error: 'Booking not found.' });
    return;
  }

  res.json({ success: true, booking });
});

// POST /api/bookings/:id/cancel - Cancel booking according to policy
router.post('/:id/cancel', (req, res) => {
  const { id } = req.params;
  const booking = dbStore.bookings.get(id);

  if (!booking) {
    res.status(404).json({ success: false, error: 'Booking not found.' });
    return;
  }

  if (booking.bookingStatus === 'CANCELLED') {
    res.status(400).json({ success: false, error: 'Booking is already cancelled.' });
    return;
  }

  const slotDate = new Date(`${booking.date} ${booking.startTime}`);
  const now = new Date();
  const hoursUntilSlot = (slotDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  booking.bookingStatus = 'CANCELLED';
  booking.updatedAt = new Date().toISOString();

  const isEligibleForFullRefund = hoursUntilSlot >= config.policy.cancellationWindowHours;
  const refundAmount = isEligibleForFullRefund ? booking.pricing.advanceAmount : 0;

  if (refundAmount > 0) {
    dbStore.payments.set(`ref_${Date.now()}`, {
      id: `ref_${Date.now()}`,
      bookingId: booking.id,
      amount: refundAmount,
      currency: 'INR',
      method: booking.paymentMethod,
      status: 'SUCCESS',
      isVerified: true,
      createdAt: new Date().toISOString(),
      verifiedAt: new Date().toISOString(),
    });
  }

  // Audit Log
  dbStore.auditLogs.push({
    id: `audit_${Date.now()}`,
    action: 'CANCEL_BOOKING',
    entityType: 'Booking',
    entityId: booking.id,
    details: JSON.stringify({
      referenceCode: booking.referenceCode,
      refundAmount,
      hoursNotice: hoursUntilSlot.toFixed(1),
    }),
    createdAt: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: isEligibleForFullRefund
      ? `Booking cancelled. A full refund of ₹${refundAmount.toFixed(2)} has been processed.`
      : `Booking cancelled. Less than ${config.policy.cancellationWindowHours}h notice provided; cancellation fee applies.`,
    refundAmount,
    booking,
  });
});

// POST /api/bookings/:id/record-offline-payment - Record venue balance
router.post('/:id/record-offline-payment', (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;

  const booking = dbStore.bookings.get(id);
  if (!booking) {
    res.status(404).json({ success: false, error: 'Booking not found.' });
    return;
  }

  const paymentAmount = Number(amount) || booking.pricing.remainingBalance;
  booking.pricing.remainingBalance = Math.max(0, booking.pricing.remainingBalance - paymentAmount);
  booking.paymentStatus = 'PAID_FULL';
  booking.updatedAt = new Date().toISOString();

  // Record payment entity
  const paymentRecord = {
    id: `pay_offline_${Date.now()}`,
    bookingId: booking.id,
    amount: paymentAmount,
    currency: 'INR',
    method: 'VENUE_CASH',
    status: 'SUCCESS' as const,
    isVerified: true,
    createdAt: new Date().toISOString(),
    verifiedAt: new Date().toISOString(),
  };
  dbStore.payments.set(paymentRecord.id, paymentRecord);

  // Audit Log
  dbStore.auditLogs.push({
    id: `audit_${Date.now()}`,
    action: 'OFFLINE_PAYMENT_RECORDED',
    entityType: 'Payment',
    entityId: paymentRecord.id,
    details: JSON.stringify({
      bookingReference: booking.referenceCode,
      amount: paymentAmount,
    }),
    createdAt: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: `Payment of ₹${paymentAmount.toFixed(2)} recorded successfully.`,
    booking,
  });
});

export default router;
