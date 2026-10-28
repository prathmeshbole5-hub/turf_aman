import { brandConfig } from '../../../src/config/turfConfig';
import type { BookingEntity } from '../db/store';
import { dbStore } from '../db/store';

export interface DispatchNotificationResult {
  bookingReference: string;
  recipientPhone: string;
  recipientEmail?: string;
  smsMessage: string;
  whatsappMessage: string;
  emailSubject: string;
  emailHtml: string;
  dispatchedAt: string;
  status: 'DELIVERED';
}

export function sendBookingConfirmationNotifications(booking: BookingEntity): DispatchNotificationResult {
  const customerName = booking.customerName;
  const phone = booking.customerPhone;
  const email = booking.customerEmail;
  const ref = booking.referenceCode;
  const sport = booking.sportName;
  const ground = booking.groundName;
  const date = booking.date;
  const time = `${booking.startTime} - ${booking.endTime}`;
  const total = booking.pricing.totalAmount;
  const advance = booking.pricing.advanceAmount;
  const balance = booking.pricing.remainingBalance;

  const venueAddress = `${brandConfig.location.venueName}, ${brandConfig.location.address}, ${brandConfig.location.area}, ${brandConfig.location.city}`;
  const mapsUrl = brandConfig.location.googleMapsUrl;

  const smsMessage = `TURFZONE Pass Confirmed! Ref: ${ref} for ${sport} on ${date} (${time}) at ${ground}. Paid: ₹${advance.toFixed(0)}, Balance: ₹${balance.toFixed(0)}. Venue: ${venueAddress}. Location: ${mapsUrl}`;

  const whatsappMessage = `🏆 *TURFZONE MATCH PASS CONFIRMED*\n\n` +
    `Hello *${customerName}*,\n` +
    `Your match slot has been locked in!\n\n` +
    `📌 *Reference Code:* ${ref}\n` +
    `⚽ *Sport:* ${sport}\n` +
    `🏟️ *Ground:* ${ground}\n` +
    `📅 *Date:* ${date}\n` +
    `⏰ *Slot Time:* ${time} (${booking.durationMinutes} mins)\n\n` +
    `💰 *Total Fare:* ₹${total.toFixed(2)}\n` +
    `💳 *Amount Paid:* ₹${advance.toFixed(2)}\n` +
    `💵 *Balance Due at Venue:* ₹${balance.toFixed(2)}\n\n` +
    `📍 *Venue Address:*\n${venueAddress}\n\n` +
    `🗺️ *Google Maps:* ${mapsUrl}\n\n` +
    `Please arrive 15 minutes before kick-off. Have a great match! ⚡`;

  const emailSubject = `TURFZONE Match Pass Confirmation — #${ref} (${sport})`;

  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #101813; color: #F6F7F2; padding: 2rem; border-radius: 12px; border: 1px solid #344238;">
      <div style="text-align: center; margin-bottom: 2rem;">
        <h1 style="color: #B7F34A; margin: 0; font-size: 28px; text-transform: uppercase;">TURFZONE</h1>
        <p style="color: #A7B3A7; font-size: 14px; margin: 5px 0 0;">Official Match Pass & Booking Confirmation</p>
      </div>

      <div style="background-color: #17221A; border: 1px solid #344238; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem;">
        <span style="font-size: 12px; color: #B7F34A; text-transform: uppercase; font-weight: bold;">Booking Reference</span>
        <h2 style="font-size: 26px; color: #F6F7F2; margin: 0.25rem 0 1rem;">#${ref}</h2>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #A7B3A7;">Player Name:</td>
            <td style="padding: 6px 0; text-align: right; color: #F6F7F2; font-weight: bold;">${customerName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #A7B3A7;">Sport:</td>
            <td style="padding: 6px 0; text-align: right; color: #B7F34A; font-weight: bold;">${sport}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #A7B3A7;">Playing Area:</td>
            <td style="padding: 6px 0; text-align: right; color: #F6F7F2;">${ground}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #A7B3A7;">Date & Time:</td>
            <td style="padding: 6px 0; text-align: right; color: #F6F7F2;">${date} • ${time}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #A7B3A7;">Duration:</td>
            <td style="padding: 6px 0; text-align: right; color: #F6F7F2;">${booking.durationMinutes} Minutes</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #202B23; border: 1px solid #344238; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem;">
        <h3 style="margin-top: 0; color: #F6F7F2; font-size: 16px;">Fare Summary</h3>
        <table style="width: 100%; font-size: 14px;">
          <tr>
            <td style="color: #A7B3A7;">Total Fare:</td>
            <td style="text-align: right; font-weight: bold; color: #F6F7F2;">₹${total.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="color: #6EE787;">Amount Cleared:</td>
            <td style="text-align: right; font-weight: bold; color: #6EE787;">₹${advance.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="color: #FFC857;">Balance Due at Venue:</td>
            <td style="text-align: right; font-weight: bold; color: #FFC857;">₹${balance.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; font-size: 12px; color: #A7B3A7; border-top: 1px solid #344238; padding-top: 1.25rem;">
        <p style="margin: 0 0 5px;">📍 ${venueAddress}</p>
        <p style="margin: 0;"><a href="${mapsUrl}" style="color: #B7F34A; text-decoration: none;">Get Directions on Google Maps</a></p>
      </div>
    </div>
  `;

  // Log in server audit log
  dbStore.auditLogs.push({
    id: `audit_notif_${Date.now()}`,
    action: 'NOTIFICATIONS_DISPATCHED',
    entityType: 'Notification',
    entityId: booking.id,
    details: JSON.stringify({
      referenceCode: ref,
      phone,
      email,
      channels: ['SMS', 'WhatsApp', ...(email ? ['Email'] : [])],
    }),
    createdAt: new Date().toISOString(),
  });

  return {
    bookingReference: ref,
    recipientPhone: phone,
    recipientEmail: email,
    smsMessage,
    whatsappMessage,
    emailSubject,
    emailHtml,
    dispatchedAt: new Date().toISOString(),
    status: 'DELIVERED',
  };
}
