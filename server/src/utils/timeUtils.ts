/**
 * Time utility functions for slot intervals and interval overlap validation.
 */

export function parseTimeToMinutes(timeStr: string): number {
  const trimmed = timeStr.trim().toUpperCase();

  // Handle "HH:MM AM/PM"
  if (trimmed.includes('AM') || trimmed.includes('PM')) {
    const isPM = trimmed.includes('PM');
    const isAM = trimmed.includes('AM');
    const cleanTime = trimmed.replace('AM', '').replace('PM', '').trim();
    const parts = cleanTime.split(':');
    let hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1] || '0', 10);

    if (isPM && hours !== 12) {
      hours += 12;
    } else if (isAM && hours === 12) {
      hours = 0;
    }

    // If hours is 0 or 1 and part of an evening/late night session (past midnight up to 1:00 AM)
    if (hours === 0) hours = 24;
    else if (hours === 1) hours = 25;

    return hours * 60 + minutes;
  }

  // Handle 24-hour "HH:MM"
  const parts = trimmed.split(':');
  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1] || '0', 10);

  if (hours === 0) hours = 24;
  else if (hours === 1) hours = 25;

  return hours * 60 + minutes;
}

export function formatMinutesToTime(minutes: number): string {
  let normalized = minutes;
  if (normalized >= 1440) {
    normalized -= 1440;
  }

  const hours24 = Math.floor(normalized / 60);
  const mins = normalized % 60;

  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;

  const paddedHours = String(hours12).padStart(2, '0');
  const paddedMins = String(mins).padStart(2, '0');

  return `${paddedHours}:${paddedMins} ${period}`;
}

/**
 * Validates if two time intervals [s1, e1) and [s2, e2) strictly overlap.
 * Adjacent boundary matches (e.g. 19:00-20:00 and 20:00-21:00) DO NOT overlap.
 */
export function doIntervalsOverlap(
  start1: number,
  end1: number,
  start2: number,
  end2: number
): boolean {
  return start1 < end2 && end1 > start2;
}
