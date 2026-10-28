import { Router } from 'express';
import { dbStore } from '../db/store';
import { formatMinutesToTime, doIntervalsOverlap } from '../utils/timeUtils';

const router = Router();

// GET /api/availability?groundId=...&date=...
router.get('/', (req, res) => {
  try {
    const { groundId, date } = req.query;

    if (!groundId || !date || typeof groundId !== 'string' || typeof date !== 'string') {
      res.status(400).json({
        success: false,
        error: 'groundId and date query parameters are required.',
      });
      return;
    }

    const ground = dbStore.grounds.get(groundId);
    if (!ground) {
      res.status(404).json({ success: false, error: 'Ground not found.' });
      return;
    }

    // 1. Generate 30-min intervals from 6 AM (360) to 1 AM next day (25*60 = 1500)
    const slots = [];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const isToday = date === todayStr;
    const currentMinutes = isToday ? now.getHours() * 60 + now.getMinutes() : -1;

    // Filter relevant confirmed/held bookings for this ground & date
    const dayBookings = Array.from(dbStore.bookings.values()).filter(
      (b) => b.groundId === groundId && b.date === date && b.bookingStatus !== 'CANCELLED'
    );

    // Filter relevant maintenance blocks for this ground & date
    const dayBlocks = Array.from(dbStore.blockedPeriods.values()).filter(
      (b) => b.groundId === groundId && b.date === date
    );

    for (let startM = 360; startM < 1500; startM += 30) {
      const endM = startM + 30;
      const startTimeStr = formatMinutesToTime(startM);
      const endTimeStr = formatMinutesToTime(endM);
      const isPeak = startM >= 960 || endM > 960; // 4 PM to 12 AM

      let status: 'AVAILABLE' | 'BOOKED' | 'MAINTENANCE' | 'PAST' | 'TEMPORARILY_HELD' = 'AVAILABLE';
      let bookingReference: string | undefined = undefined;
      let maintenanceReason: string | undefined = undefined;

      // Check if slot has already passed today
      if (isToday && endM <= currentMinutes) {
        status = 'PAST';
      } else {
        // Check maintenance blocks
        const matchingBlock = dayBlocks.find((bl) =>
          doIntervalsOverlap(bl.startMinuteOfDay, bl.endMinuteOfDay, startM, endM)
        );

        if (matchingBlock) {
          status = 'MAINTENANCE';
          maintenanceReason = matchingBlock.reason;
        } else {
          // Check bookings
          const matchingBooking = dayBookings.find((bk) =>
            doIntervalsOverlap(bk.startMinuteOfDay, bk.endMinuteOfDay, startM, endM)
          );

          if (matchingBooking) {
            if (matchingBooking.bookingStatus === 'PENDING' && matchingBooking.holdExpiresAt) {
              if (new Date(matchingBooking.holdExpiresAt) > now) {
                status = 'TEMPORARILY_HELD';
              }
            } else {
              status = 'BOOKED';
              bookingReference = matchingBooking.referenceCode;
            }
          }
        }
      }

      slots.push({
        id: `slot_${startM}_${endM}`,
        startMinute: startM,
        endMinute: endM,
        startTime: startTimeStr,
        endTime: endTimeStr,
        status,
        isPeak,
        bookingReference,
        maintenanceReason,
      });
    }

    res.json({
      success: true,
      groundId,
      groundName: ground.name,
      date,
      totalSlots: slots.length,
      availableSlotsCount: slots.filter((s) => s.status === 'AVAILABLE').length,
      slots,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
