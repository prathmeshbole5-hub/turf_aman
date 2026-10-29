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

    const ground = dbStore.getGround(groundId);
    if (!ground) {
      res.status(404).json({ success: false, error: `Ground '${groundId}' not found.` });
      return;
    }

    const canonicalGroundId = ground.id;
    const stepMinutes = parseInt(req.query.step as string, 10) || 60;

    // Generate intervals from 6 AM (360) to 1 AM next day (25*60 = 1500)
    const slots = [];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const isToday = date === todayStr;
    const currentMinutes = isToday ? now.getHours() * 60 + now.getMinutes() : -1;

    // Filter relevant confirmed/held bookings for this ground & date
    const dayBookings = Array.from(dbStore.bookings.values()).filter((b) => {
      const matchGround = b.groundId === canonicalGroundId || b.groundId === groundId;
      if (!matchGround || b.date !== date) return false;
      if (b.bookingStatus === 'CANCELLED') return false;
      if (b.paymentStatus === 'FAILED') return false;

      // Check temporary hold expiration for pending bookings
      if (b.bookingStatus === 'PENDING' && b.holdExpiresAt) {
        if (new Date(b.holdExpiresAt) <= now) {
          return false;
        }
      }
      return true;
    });

    // Filter relevant maintenance blocks for this ground & date
    const dayBlocks = Array.from(dbStore.blockedPeriods.values()).filter(
      (b) => (b.groundId === canonicalGroundId || b.groundId === groundId) && b.date === date
    );

    for (let startM = 360; startM < 1500; startM += stepMinutes) {
      const endM = Math.min(1500, startM + stepMinutes);
      const startTimeStr = formatMinutesToTime(startM);
      const endTimeStr = formatMinutesToTime(endM);
      const isPeak = false; // Floodlight / peak surcharge removed per user instruction

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
        isPeak: false,
        rate: 900,
        bookingReference,
        maintenanceReason,
      });
    }

    res.json({
      success: true,
      groundId: canonicalGroundId,
      groundName: ground.name,
      date,
      stepMinutes,
      totalSlots: slots.length,
      availableSlotsCount: slots.filter((s) => s.status === 'AVAILABLE').length,
      slots,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
