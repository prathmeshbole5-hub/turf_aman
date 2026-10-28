import type { Request } from 'express';

export type UserRole = 'CUSTOMER' | 'ADMIN' | 'STAFF';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export interface TimeSlotInterval {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  startTime: string; // e.g. "07:00 PM"
  endTime: string;   // e.g. "08:30 PM"
  startMinuteOfDay: number; // e.g. 1140
  endMinuteOfDay: number;   // e.g. 1230
  durationMinutes: number;
}

export interface PricingCalculationResult {
  sportId: string;
  groundId: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  baseHourlyRate: number;
  effectiveHourlyRate: number;
  groundCharge: number;
  peakSurcharge: number;
  selectedAddOns: { id: string; name: string; price: number; quantity: number }[];
  addOnsTotal: number;
  discountPercentage: number;
  discountAmount: number;
  subtotal: number;
  taxPercentage: number;
  taxAmount: number;
  totalAmount: number;
  advancePercentage: number;
  advanceAmount: number;
  remainingBalance: number;
}
