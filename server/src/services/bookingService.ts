import { dbStore, type BookingEntity } from '../db/store';
import { parseTimeToMinutes, formatMinutesToTime, doIntervalsOverlap } from '../utils/timeUtils';
import { calculateAuthoritativePrice, type PricingInput } from './pricingService';

export interface BookingValidationResult {
  isAvailable: boolean;
  conflictReason?: string;
  conflictingBookingId?: string;
  conflictingInterval?: {
    startTime: string;
    endTime: string;
  };
}

export interface CreateBookingInput {
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  sportId: string;
  groundId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // e.g. "07:00 PM"
  durationMinutes: number;
  paymentMethod: 'RAZORPAY' | 'VENUE_CASH' | 'VENUE_CARD';
  paymentOption?: 'full' | 'advance';
  selectedAddOns?: { id: string; name: string; price: number; quantity: number }[];
  discountCode?: string;
  notes?: string;
}

/**
 * Validates whether the entire requested interval is available on the ground.
 * Protects against overlapping bookings and maintenance blocks.
 */
export function validateSlotIntervalAvailability(
  groundId: string,
  date: string,
  startTime: string,
  durationMinutes: number
): BookingValidationResult {
  const ground = dbStore.getGround(groundId);
  if (!ground) {
    return { isAvailable: false, conflictReason: `Ground with ID '${groundId}' does not exist.` };
  }

  if (!ground.isActive) {
    return { isAvailable: false, conflictReason: `Ground '${ground.name}' is currently offline.` };
  }

  const canonicalGroundId = ground.id;
  const requestedStart = parseTimeToMinutes(startTime);
  const requestedEnd = requestedStart + durationMinutes;

  // 1. Check existing confirmed or temporarily held bookings
  const now = new Date();
  for (const booking of dbStore.bookings.values()) {
    const isMatchingGround = booking.groundId === canonicalGroundId || booking.groundId === groundId;
    if (!isMatchingGround || booking.date !== date) {
      continue;
    }

    // Ignore cancelled or failed bookings
    if (booking.bookingStatus === 'CANCELLED' || booking.paymentStatus === 'FAILED') {
      continue;
    }

    // If pending with a hold, check if hold expired
    if (booking.bookingStatus === 'PENDING' && booking.holdExpiresAt) {
      if (new Date(booking.holdExpiresAt) <= now) {
        continue; // Expired hold, ignore
      }
    }

    const existingStart = booking.startMinuteOfDay;
    const existingEnd = booking.endMinuteOfDay;

    if (doIntervalsOverlap(existingStart, existingEnd, requestedStart, requestedEnd)) {
      return {
        isAvailable: false,
        conflictReason: `Ground is already reserved by booking ${booking.referenceCode} from ${booking.startTime} to ${booking.endTime}.`,
        conflictingBookingId: booking.id,
        conflictingInterval: {
          startTime: booking.startTime,
          endTime: booking.endTime,
        },
      };
    }
  }

  // 2. Check maintenance blocks
  for (const block of dbStore.blockedPeriods.values()) {
    const isMatchingGround = block.groundId === canonicalGroundId || block.groundId === groundId;
    if (!isMatchingGround || block.date !== date) {
      continue;
    }

    const blockStart = block.startMinuteOfDay;
    const blockEnd = block.endMinuteOfDay;

    if (doIntervalsOverlap(blockStart, blockEnd, requestedStart, requestedEnd)) {
      return {
        isAvailable: false,
        conflictReason: `Ground is blocked for maintenance (${block.reason}) from ${block.startTime} to ${block.endTime}.`,
        conflictingInterval: {
          startTime: block.startTime,
          endTime: block.endTime,
        },
      };
    }
  }

  return { isAvailable: true };
}

/**
 * Creates a booking inside a serialized mutex lock on the ground.
 * Eliminates race conditions when concurrent requests attempt to reserve overlapping slots.
 */
export async function createBookingWithDoubleBookingProtection(
  input: CreateBookingInput
): Promise<BookingEntity> {
  const ground = dbStore.getGround(input.groundId);
  if (!ground) {
    throw new Error(`Ground '${input.groundId}' not found.`);
  }

  const sport = dbStore.getSport(input.sportId);
  if (!sport) {
    throw new Error(`Sport '${input.sportId}' not found.`);
  }

  const canonicalGroundId = ground.id;
  const canonicalSportId = sport.id;
  const { date, startTime, durationMinutes } = input;

  // Execute inside serialized ground lock
  return await dbStore.withGroundLock(canonicalGroundId, async () => {
    // Re-verify availability inside lock
    const validation = validateSlotIntervalAvailability(canonicalGroundId, date, startTime, durationMinutes);
    if (!validation.isAvailable) {
      const error: any = new Error(validation.conflictReason || 'Double-booking conflict detected.');
      error.statusCode = 409; // HTTP 409 Conflict
      error.details = validation;
      throw error;
    }

    // Calculate authoritative pricing
    const pricingInput: PricingInput = {
      sportId: canonicalSportId,
      groundId: canonicalGroundId,
      date: input.date,
      startTime: input.startTime,
      durationMinutes: input.durationMinutes,
      selectedAddOns: input.selectedAddOns,
      discountCode: input.discountCode,
      paymentOption: input.paymentOption,
    };

    const pricing = calculateAuthoritativePrice(pricingInput);

    const startMinute = parseTimeToMinutes(startTime);
    const endMinute = startMinute + durationMinutes;
    const endTime = formatMinutesToTime(endMinute);

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const id = `bkg_${Date.now()}_${randomNum}`;
    const referenceCode = `TZ-${randomNum}`;

    const isOnline = input.paymentMethod === 'RAZORPAY';
    const isAdvance = input.paymentOption === 'advance';

    // Set cancellation policy window: e.g. up to 12 hours before slot
    const slotDateTime = new Date(`${date} ${startTime}`);
    const canCancelUntil = new Date(slotDateTime.getTime() - 12 * 60 * 60 * 1000).toISOString();

    const booking: BookingEntity = {
      id,
      referenceCode,
      customerId: input.customerId,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail,
      sportId: canonicalSportId,
      sportName: sport.name,
      groundId: canonicalGroundId,
      groundName: ground.name,
      date,
      startTime,
      endTime,
      startMinuteOfDay: startMinute,
      endMinuteOfDay: endMinute,
      durationMinutes,
      bookingStatus: 'CONFIRMED',
      paymentStatus: isOnline ? (isAdvance ? 'ADVANCE_PAID' : 'PAID_FULL') : 'PENDING',
      paymentMethod: input.paymentMethod,
      paymentType: isAdvance ? 'ADVANCE' : 'FULL',
      pricing,
      notes: input.notes,
      canCancelUntil,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dbStore.bookings.set(booking.id, booking);
    dbStore.saveToDisk();

    // Audit Log
    dbStore.auditLogs.push({
      id: `audit_${Date.now()}`,
      userId: input.customerId,
      action: 'CREATE_BOOKING',
      entityType: 'Booking',
      entityId: booking.id,
      details: JSON.stringify({
        referenceCode,
        sport: sport.name,
        ground: ground.name,
        date,
        interval: `${startTime} - ${endTime}`,
        totalAmount: pricing.totalAmount,
      }),
      createdAt: new Date().toISOString(),
    });

    return booking;
  });
}
