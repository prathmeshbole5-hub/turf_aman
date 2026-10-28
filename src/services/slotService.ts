import type { TimeSlot, SlotStatus, Ground, Sport } from '../types';
import { initialPricingRates } from '../config/turfConfig';

export interface DurationOption {
  minutes: number;
  label: string;
  slotCount: number; // in 30-min increments or 60-min increments
}

export const DURATION_OPTIONS: DurationOption[] = [
  { minutes: 60, label: '1 hr — ₹900', slotCount: 1 },
  { minutes: 120, label: '2 hr — ₹1800', slotCount: 2 },
  { minutes: 180, label: '3 hr — ₹2400', slotCount: 3 },
  { minutes: 240, label: '4 hr — ₹3000', slotCount: 4 },
];

// Operating hours: 6 AM to 1 AM (19 one-hour slots)
const OPERATING_HOURS = [
  { hour: 6, start: '06:00 AM', end: '07:00 AM' },
  { hour: 7, start: '07:00 AM', end: '08:00 AM' },
  { hour: 8, start: '08:00 AM', end: '09:00 AM' },
  { hour: 9, start: '09:00 AM', end: '10:00 AM' },
  { hour: 10, start: '10:00 AM', end: '11:00 AM' },
  { hour: 11, start: '11:00 AM', end: '12:00 PM' },
  { hour: 12, start: '12:00 PM', end: '01:00 PM' },
  { hour: 13, start: '01:00 PM', end: '02:00 PM' },
  { hour: 14, start: '02:00 PM', end: '03:00 PM' },
  { hour: 15, start: '03:00 PM', end: '04:00 PM' },
  { hour: 16, start: '04:00 PM', end: '05:00 PM' },
  { hour: 17, start: '05:00 PM', end: '06:00 PM' },
  { hour: 18, start: '06:00 PM', end: '07:00 PM' },
  { hour: 19, start: '07:00 PM', end: '08:00 PM' },
  { hour: 20, start: '08:00 PM', end: '09:00 PM' },
  { hour: 21, start: '09:00 PM', end: '10:00 PM' },
  { hour: 22, start: '10:00 PM', end: '11:00 PM' },
  { hour: 23, start: '11:00 PM', end: '12:00 AM' },
  { hour: 24, start: '12:00 AM', end: '01:00 AM' },
];

/**
 * Generates slots for a selected date, sport, and ground.
 * Includes realistic booked and held slots based on seeded schedule.
 */
export function generateDaySlots(
  dateStr: string,
  sport: Sport,
  ground: Ground
): TimeSlot[] {
  const dateObj = new Date(dateStr);
  const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

  // Find pricing rate for this sport
  const pricing = initialPricingRates.find((p) => p.sportId === sport.id) || initialPricingRates[0];

  return OPERATING_HOURS.map(({ hour, start, end }) => {
    const isPeak = hour >= 16; // 4:00 PM and later is peak
    const rate = isWeekend ? pricing.weekendRate : isPeak ? pricing.peakRate : pricing.offPeakRate;

    // Deterministic simulation of booked/held slots based on date + ground + hour
    let status: SlotStatus = 'available';
    let blockedReason: string | undefined;
    let holdExpiresInSeconds: number | undefined;

    // Seeded booking patterns: prime night slots (7-8 PM, 9-10 PM) on Alpha ground
    const seed = (dateObj.getDate() * 7 + hour * 3 + ground.id.charCodeAt(ground.id.length - 1)) % 17;

    if (hour === 19 && ground.id === 'ground-alpha') {
      status = 'booked';
      blockedReason = 'Reserved (League Match)';
    } else if (hour === 21 && (seed % 3 === 0)) {
      status = 'booked';
      blockedReason = 'Booked by Squad';
    } else if (hour === 18 && seed === 5) {
      status = 'held';
      holdExpiresInSeconds = 280; // 4m 40s
      blockedReason = 'Held by customer in checkout';
    } else if (hour === 14 && seed === 8) {
      status = 'unavailable';
      blockedReason = 'Turf Maintenance & Watering';
    }

    return {
      id: `${dateStr}_${ground.id}_${hour}`,
      startTime: start,
      endTime: end,
      hour,
      status,
      isPeak,
      rate,
      holdExpiresInSeconds,
      blockedReason,
    };
  });
}

/**
 * Validates that an entire duration interval starting at a given slot is available.
 * Returns { isValid: boolean, conflictingSlot?: TimeSlot, calculatedEndTime: string }
 */
export function validateConsecutiveSlots(
  startSlot: TimeSlot,
  durationMinutes: number,
  allSlots: TimeSlot[]
): {
  isValid: boolean;
  errorMessage?: string;
  conflictingSlot?: TimeSlot;
  calculatedEndTime: string;
} {
  const startIndex = allSlots.findIndex((s) => s.id === startSlot.id);
  if (startIndex === -1) {
    return { isValid: false, errorMessage: 'Invalid start slot selected.', calculatedEndTime: '' };
  }

  // Calculate needed hours
  const hoursNeeded = durationMinutes / 60;
  const fullSlotsNeeded = Math.ceil(hoursNeeded);

  // Check if exceeds closing hours
  if (startIndex + fullSlotsNeeded > allSlots.length) {
    return {
      isValid: false,
      errorMessage: `Selected duration exceeds facility closing time (${allSlots[allSlots.length - 1].endTime}).`,
      calculatedEndTime: '',
    };
  }

  // Check availability for all required full slots
  for (let i = 0; i < fullSlotsNeeded; i++) {
    const current = allSlots[startIndex + i];
    if (current.status !== 'available' && current.status !== 'selected') {
      return {
        isValid: false,
        errorMessage: `Slot ${current.startTime}–${current.endTime} is ${current.status} (${current.blockedReason || 'unavailable'}).`,
        conflictingSlot: current,
        calculatedEndTime: '',
      };
    }
  }

  // Calculate end time
  let calculatedEndTime = '';
  if (durationMinutes === 60) {
    calculatedEndTime = startSlot.endTime;
  } else if (durationMinutes === 90) {
    // 1.5 hours later
    calculatedEndTime = calculateEndTimeOffset(startSlot.startTime, 90);
  } else if (durationMinutes === 120) {
    calculatedEndTime = allSlots[startIndex + 1].endTime;
  } else if (durationMinutes === 150) {
    calculatedEndTime = calculateEndTimeOffset(startSlot.startTime, 150);
  } else if (durationMinutes === 180) {
    calculatedEndTime = allSlots[startIndex + 2].endTime;
  } else {
    calculatedEndTime = calculateEndTimeOffset(startSlot.startTime, durationMinutes);
  }

  return {
    isValid: true,
    calculatedEndTime,
  };
}

/**
 * Utility to calculate human-readable end time based on minutes offset
 */
export function calculateEndTimeOffset(startTimeStr: string, minutesToAdd: number): string {
  // Format: "06:00 AM", "04:30 PM"
  const [timePart, modifier] = startTimeStr.split(' ');
  const [hStr, mStr] = timePart.split(':');
  let hour = parseInt(hStr, 10);
  const min = parseInt(mStr, 10);

  if (modifier === 'PM' && hour < 12) hour += 12;
  if (modifier === 'AM' && hour === 12) hour = 0;

  const totalMinutes = hour * 60 + min + minutesToAdd;
  let endHour = Math.floor(totalMinutes / 60) % 24;
  const endMin = totalMinutes % 60;

  const endModifier = endHour >= 12 ? 'PM' : 'AM';
  let displayHour = endHour % 12;
  if (displayHour === 0) displayHour = 12;

  const padH = displayHour < 10 ? `0${displayHour}` : `${displayHour}`;
  const padM = endMin < 10 ? `0${endMin}` : `${endMin}`;

  return `${padH}:${padM} ${endModifier}`;
}

/**
 * Computes the prospective end time and feasibility for a slot given the current match duration.
 */
export function getSlotEndForDuration(
  slot: TimeSlot,
  durationMinutes: number,
  allSlots: TimeSlot[]
): {
  endTime: string;
  isAvailableForDuration: boolean;
  unavailabilityReason?: string;
} {
  const calculatedEndTime = calculateEndTimeOffset(slot.startTime, durationMinutes);

  if (slot.status === 'booked') {
    return {
      endTime: calculatedEndTime,
      isAvailableForDuration: false,
      unavailabilityReason: 'Booked',
    };
  }

  if (slot.status === 'held') {
    return {
      endTime: calculatedEndTime,
      isAvailableForDuration: false,
      unavailabilityReason: 'Held in Checkout',
    };
  }

  if (slot.status === 'unavailable') {
    return {
      endTime: calculatedEndTime,
      isAvailableForDuration: false,
      unavailabilityReason: slot.blockedReason || 'Maintenance',
    };
  }

  const startIndex = allSlots.findIndex((s) => s.id === slot.id);
  if (startIndex === -1) {
    return {
      endTime: calculatedEndTime,
      isAvailableForDuration: false,
      unavailabilityReason: 'Invalid Slot',
    };
  }

  const hoursNeeded = Math.ceil(durationMinutes / 60);

  // Check closing hours
  if (startIndex + hoursNeeded > allSlots.length) {
    return {
      endTime: calculatedEndTime,
      isAvailableForDuration: false,
      unavailabilityReason: 'Exceeds Closing (01:00 AM)',
    };
  }

  // Check consecutive slots
  for (let i = 0; i < hoursNeeded; i++) {
    const current = allSlots[startIndex + i];
    if (current.status !== 'available' && current.status !== 'selected') {
      return {
        endTime: calculatedEndTime,
        isAvailableForDuration: false,
        unavailabilityReason: current.status === 'booked' ? 'Overlaps Booked Slot' : current.status === 'held' ? 'Overlaps Held Slot' : 'Overlaps Unavailable Slot',
      };
    }
  }

  return {
    endTime: calculatedEndTime,
    isAvailableForDuration: true,
  };
}

