import type { ConfirmedBooking, Sport, Ground } from '../types';
import { initialSports, initialGrounds, brandConfig } from '../config/turfConfig';

const BOOKINGS_KEY = 'turfzone_confirmed_bookings';
const SPORTS_KEY = 'turfzone_sports_config';
const GROUNDS_KEY = 'turfzone_grounds_config';
const BLOCKED_SLOTS_KEY = 'turfzone_blocked_slots';

export interface BlockedSlotRecord {
  id: string;
  groundId: string;
  date: string;
  startHour: number;
  endHour: number;
  reason: string;
}

// -------------------------------------------------------------
// BOOKINGS MANAGEMENT
// -------------------------------------------------------------
export function getStoredBookings(): ConfirmedBooking[] {
  try {
    const raw = localStorage.getItem(BOOKINGS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to parse stored bookings:', err);
  }

  const sample = seedInitialBookings();
  saveBookings(sample);
  return sample;
}

export function saveBookings(bookings: ConfirmedBooking[]): void {
  try {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
  } catch (err) {
    console.error('Failed to save bookings to localStorage:', err);
  }
}

export function addConfirmedBooking(booking: ConfirmedBooking): void {
  const current = getStoredBookings();
  const updated = [booking, ...current];
  saveBookings(updated);
}

export function updateBookingStatus(
  bookingId: string,
  status: 'confirmed' | 'cancelled' | 'completed',
  paymentStatus?: 'paid_online' | 'advance_paid' | 'pay_at_venue'
): boolean {
  const current = getStoredBookings();
  const index = current.findIndex((b) => b.bookingId === bookingId);
  if (index === -1) return false;

  current[index].bookingStatus = status;
  if (paymentStatus) {
    current[index].paymentStatus = paymentStatus;
  }
  saveBookings(current);
  return true;
}

export function recordOfflinePayment(bookingId: string, amountRecorded: number): boolean {
  const current = getStoredBookings();
  const index = current.findIndex((b) => b.bookingId === bookingId);
  if (index === -1) return false;

  current[index].pricing.remainingBalance = Math.max(0, current[index].pricing.remainingBalance - amountRecorded);
  current[index].paymentStatus = 'paid_online'; // Marked as fully cleared
  saveBookings(current);
  return true;
}

export function cancelBooking(bookingId: string): { success: boolean; message: string } {
  const current = getStoredBookings();
  const index = current.findIndex((b) => b.bookingId === bookingId);
  if (index === -1) {
    return { success: false, message: 'Booking not found.' };
  }

  const target = current[index];
  if (target.bookingStatus === 'cancelled') {
    return { success: false, message: 'Booking is already cancelled.' };
  }

  const slotDate = new Date(`${target.date} ${target.startTime}`);
  const now = new Date();
  const hoursUntilSlot = (slotDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  target.bookingStatus = 'cancelled';
  saveBookings(current);

  if (hoursUntilSlot >= brandConfig.policy.cancellationWindowHours) {
    return {
      success: true,
      message: `Booking cancelled successfully. A 100% refund of ₹${target.pricing.totalAmount.toFixed(2)} will be credited according to policy.`,
    };
  } else {
    return {
      success: true,
      message: `Booking cancelled. Inside the ${brandConfig.policy.cancellationWindowHours}-hour window, cancellation preparation fees apply.`,
    };
  }
}

// -------------------------------------------------------------
// SPORTS MANAGEMENT
// -------------------------------------------------------------
export function getStoredSports(): Sport[] {
  try {
    const raw = localStorage.getItem(SPORTS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to parse sports:', err);
  }
  return initialSports;
}

export function saveStoredSports(sports: Sport[]): void {
  try {
    localStorage.setItem(SPORTS_KEY, JSON.stringify(sports));
  } catch (err) {
    console.error('Failed to save sports:', err);
  }
}

export function toggleSportActive(sportId: string): Sport[] {
  const current = getStoredSports();
  const updated = current.map((s) => (s.id === sportId ? { ...s, isActive: !s.isActive } : s));
  saveStoredSports(updated);
  return updated;
}

export function updateOrAddSport(sport: Sport): Sport[] {
  const current = getStoredSports();
  const index = current.findIndex((s) => s.id === sport.id);
  let updated: Sport[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = sport;
  } else {
    updated = [...current, sport];
  }
  saveStoredSports(updated);
  return updated;
}

// -------------------------------------------------------------
// GROUNDS MANAGEMENT
// -------------------------------------------------------------
export function getStoredGrounds(): Ground[] {
  try {
    const raw = localStorage.getItem(GROUNDS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to parse grounds:', err);
  }
  return initialGrounds;
}

export function saveStoredGrounds(grounds: Ground[]): void {
  try {
    localStorage.setItem(GROUNDS_KEY, JSON.stringify(grounds));
  } catch (err) {
    console.error('Failed to save grounds:', err);
  }
}

export function updateGround(ground: Ground): Ground[] {
  const current = getStoredGrounds();
  const index = current.findIndex((g) => g.id === ground.id);
  let updated: Ground[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = ground;
  } else {
    updated = [...current, ground];
  }
  saveStoredGrounds(updated);
  return updated;
}

// -------------------------------------------------------------
// MAINTENANCE BLOCKS & SLOTS
// -------------------------------------------------------------
export function getStoredBlockedSlots(): BlockedSlotRecord[] {
  try {
    const raw = localStorage.getItem(BLOCKED_SLOTS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to parse blocked slots:', err);
  }
  return [
    {
      id: 'block-1',
      groundId: 'ground-alpha',
      date: new Date().toISOString().split('T')[0],
      startHour: 14,
      endHour: 15,
      reason: 'Turf Sprinkler & Conditioning',
    },
  ];
}

export function addBlockedSlot(block: BlockedSlotRecord): void {
  const current = getStoredBlockedSlots();
  localStorage.setItem(BLOCKED_SLOTS_KEY, JSON.stringify([...current, block]));
}

export function removeBlockedSlot(blockId: string): void {
  const current = getStoredBlockedSlots();
  localStorage.setItem(BLOCKED_SLOTS_KEY, JSON.stringify(current.filter((b) => b.id !== blockId)));
}

// -------------------------------------------------------------
// CSV EXPORT UTILITY
// -------------------------------------------------------------
export function exportBookingsToCSV(bookings: ConfirmedBooking[]): void {
  const headers = [
    'Booking ID',
    'Reference',
    'Customer Name',
    'Phone',
    'Email',
    'Sport',
    'Ground',
    'Date',
    'Start Time',
    'End Time',
    'Duration (mins)',
    'Total Amount (INR)',
    'Payment Status',
    'Booking Status',
    'Created At',
  ];

  const rows = bookings.map((b) => [
    b.bookingId,
    b.referenceCode,
    `"${b.customer.name}"`,
    b.customer.phone,
    b.customer.email,
    `"${b.sport.name}"`,
    `"${b.ground.name}"`,
    b.date,
    b.startTime,
    b.endTime,
    b.durationMinutes,
    b.pricing.totalAmount,
    b.paymentStatus,
    b.bookingStatus,
    b.createdAt,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `turfzone_bookings_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// -------------------------------------------------------------
// INITIAL SEED DATA
// -------------------------------------------------------------
function seedInitialBookings(): ConfirmedBooking[] {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayStr = today.toISOString().split('T')[0];
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  return [
    {
      bookingId: 'TZ-2026-7842',
      referenceCode: 'TZ-7842',
      createdAt: new Date().toISOString(),
      sport: initialSports[1], // Football
      ground: initialGrounds[0], // Main Arena
      date: tomorrowStr,
      startTime: '08:00 PM',
      endTime: '09:00 PM',
      durationMinutes: 60,
      customer: {
        name: 'Rahul Sharma',
        phone: '9876543210',
        email: 'rahul.sharma@example.com',
        notes: 'Weekend friendly 5v5 with office team',
      },
      pricing: {
        sportId: initialSports[1].id,
        sportName: initialSports[1].name,
        groundId: initialGrounds[0].id,
        groundName: initialGrounds[0].name,
        date: tomorrowStr,
        startTime: '08:00 PM',
        endTime: '09:00 PM',
        durationMinutes: 60,
        baseHourlyRate: 1100,
        effectiveHourlyRate: 1350,
        groundCharge: 1350,
        peakSurcharge: 250,
        selectedAddOns: [
          {
            addon: {
              id: 'addon-bibs',
              name: 'Set of 14 Reversible Colored Bibs',
              description: 'Fresh bibs',
              price: 100,
              priceType: 'per_session',
              icon: 'Shirt',
            },
            quantity: 1,
            total: 100,
          },
        ],
        addOnsTotal: 100,
        discountPercentage: 0,
        discountAmount: 0,
        subtotal: 1450,
        taxAmount: 72.5,
        totalAmount: 1522.5,
        advancePercentage: 100,
        advanceAmount: 1522.5,
        remainingBalance: 0,
      },
      paymentMethod: 'razorpay',
      paymentOption: 'full',
      paymentStatus: 'paid_online',
      bookingStatus: 'confirmed',
      canCancelUntil: new Date(tomorrow.getTime() - 12 * 3600 * 1000).toISOString(),
    },
    {
      bookingId: 'TZ-2026-4190',
      referenceCode: 'TZ-4190',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      sport: initialSports[0], // Box Cricket
      ground: initialGrounds[2], // The Box Cage
      date: todayStr,
      startTime: '07:00 PM',
      endTime: '08:30 PM',
      durationMinutes: 90,
      customer: {
        name: 'Ananya Verma',
        phone: '9123456789',
        email: 'ananya.v@example.com',
        notes: 'College sports club tournament match',
      },
      pricing: {
        sportId: initialSports[0].id,
        sportName: initialSports[0].name,
        groundId: initialGrounds[2].id,
        groundName: initialGrounds[2].name,
        date: todayStr,
        startTime: '07:00 PM',
        endTime: '08:30 PM',
        durationMinutes: 90,
        baseHourlyRate: 900,
        effectiveHourlyRate: 1150,
        groundCharge: 1725,
        peakSurcharge: 375,
        selectedAddOns: [],
        addOnsTotal: 0,
        discountPercentage: 20,
        discountAmount: 345,
        subtotal: 1380,
        taxAmount: 69,
        totalAmount: 1449,
        advancePercentage: 25,
        advanceAmount: 362.25,
        remainingBalance: 1086.75,
      },
      paymentMethod: 'razorpay',
      paymentOption: 'advance',
      paymentStatus: 'advance_paid',
      bookingStatus: 'confirmed',
      canCancelUntil: new Date(today.getTime() - 12 * 3600 * 1000).toISOString(),
    },
    {
      bookingId: 'TZ-2026-6211',
      referenceCode: 'TZ-6211',
      createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
      sport: initialSports[2], // Cricket full pitch
      ground: initialGrounds[0], // Main Arena
      date: todayStr,
      startTime: '06:00 AM',
      endTime: '08:00 AM',
      durationMinutes: 120,
      customer: {
        name: 'Vikram Mehta',
        phone: '9888877777',
        email: 'vikram.mehta@example.com',
        notes: 'Morning nets hard-ball session',
      },
      pricing: {
        sportId: initialSports[2].id,
        sportName: initialSports[2].name,
        groundId: initialGrounds[0].id,
        groundName: initialGrounds[0].name,
        date: todayStr,
        startTime: '06:00 AM',
        endTime: '08:00 AM',
        durationMinutes: 120,
        baseHourlyRate: 1000,
        effectiveHourlyRate: 1000,
        groundCharge: 2000,
        peakSurcharge: 0,
        selectedAddOns: [],
        addOnsTotal: 0,
        discountPercentage: 0,
        discountAmount: 0,
        subtotal: 2000,
        taxAmount: 100,
        totalAmount: 2100,
        advancePercentage: 100,
        advanceAmount: 2100,
        remainingBalance: 0,
      },
      paymentMethod: 'pay_at_venue',
      paymentOption: 'full',
      paymentStatus: 'pay_at_venue',
      bookingStatus: 'completed',
      canCancelUntil: '',
    },
  ];
}
