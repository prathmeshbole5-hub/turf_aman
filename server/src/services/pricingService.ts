import { dbStore } from '../db/store';
import { parseTimeToMinutes, formatMinutesToTime } from '../utils/timeUtils';
import type { PricingCalculationResult } from '../types';

export interface PricingInput {
  sportId: string;
  groundId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // e.g. "07:00 PM"
  durationMinutes: number;
  selectedAddOns?: { id: string; name: string; price: number; quantity: number }[];
  discountCode?: string;
  paymentOption?: 'full' | 'advance';
}

export function calculateAuthoritativePrice(input: PricingInput): PricingCalculationResult {
  const sport = dbStore.getSport(input.sportId);
  if (!sport) {
    throw new Error(`Sport with ID '${input.sportId}' not found.`);
  }

  const ground = dbStore.getGround(input.groundId);
  if (!ground) {
    throw new Error(`Ground with ID '${input.groundId}' not found.`);
  }

  // Duration in hours
  const hours = input.durationMinutes / 60;
  if (hours <= 0) {
    throw new Error('Duration must be greater than 0.');
  }

  // Determine if slot is Peak or Weekend
  const startMinute = parseTimeToMinutes(input.startTime);
  const endMinute = startMinute + input.durationMinutes;

  // Peak / Floodlight surcharge removed per user instruction
  const isPeak = false;
  const peakHourlySurcharge = 0;
  const peakSurchargeTotal = 0;

  // Day of week check
  const dateObj = new Date(input.date);
  const dayOfWeek = dateObj.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday

  // Tiered rate calculation: 1hr: 900, 2hr: 1800, 3hr: 2400, 4hr: 3000
  let groundCharge = 900;
  if (hours <= 1) {
    groundCharge = Math.round(900 * hours);
  } else if (hours <= 2) {
    groundCharge = 1800;
  } else if (hours <= 3) {
    groundCharge = 2400;
  } else if (hours <= 4) {
    groundCharge = 3000;
  } else {
    groundCharge = 3000 + (hours - 4) * 750;
  }

  const baseHourlyRate = Math.round(groundCharge / hours);
  const effectiveHourlyRate = baseHourlyRate + peakHourlySurcharge;

  // Add-ons total
  const addOns = input.selectedAddOns || [];
  const addOnsTotal = addOns.reduce((acc, item) => acc + item.price * (item.quantity || 1), 0);

  // Subtotal = ground charge + peak surcharge + add-ons
  let subtotal = groundCharge + peakSurchargeTotal + addOnsTotal;

  // Discount
  let discountPercentage = 0;
  let discountAmount = 0;
  if (input.discountCode && input.discountCode.toUpperCase() === 'TURFOPEN20') {
    discountPercentage = 20;
    discountAmount = Math.round(subtotal * 0.2);
    subtotal -= discountAmount;
  }

  // Tax (5% GST)
  const taxPercentage = 5;
  const taxAmount = Math.round(subtotal * (taxPercentage / 100) * 100) / 100;
  const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

  // Advance Deposit (25% default unless full payment selected)
  const isFull = input.paymentOption === 'full';
  const advancePercentage = isFull ? 100 : 25;
  const advanceAmount = isFull ? totalAmount : Math.round(totalAmount * 0.25 * 100) / 100;
  const remainingBalance = Math.round((totalAmount - advanceAmount) * 100) / 100;

  // Calculate formatted end time
  const endTime = formatMinutesToTime(endMinute);

  return {
    sportId: sport.id,
    groundId: ground.id,
    date: input.date,
    startTime: input.startTime,
    endTime,
    durationMinutes: input.durationMinutes,
    baseHourlyRate,
    effectiveHourlyRate,
    groundCharge,
    peakSurcharge: peakSurchargeTotal,
    selectedAddOns: addOns,
    addOnsTotal,
    discountPercentage,
    discountAmount,
    subtotal,
    taxPercentage,
    taxAmount,
    totalAmount,
    advancePercentage,
    advanceAmount,
    remainingBalance,
  };
}
