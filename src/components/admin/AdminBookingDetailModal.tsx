import React, { useRef, useEffect } from 'react';
import type { ConfirmedBooking } from '../../types';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  Printer, 
  DollarSign 
} from 'lucide-react';

interface AdminBookingDetailModalProps {
  booking: ConfirmedBooking | null;
  onClose: () => void;
  onCancelBooking: (bookingId: string) => void;
  onRecordPayment: (bookingId: string, amount: number) => void;
  onUpdateStatus: (bookingId: string, status: 'confirmed' | 'cancelled' | 'completed') => void;
}

export const AdminBookingDetailModal: React.FC<AdminBookingDetailModalProps> = ({
  booking,
  onClose,
  onCancelBooking,
  onRecordPayment,
  onUpdateStatus,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (booking && !dialog.open) {
      dialog.showModal();
    } else if (!booking && dialog.open) {
      dialog.close();
    }
  }, [booking]);

  if (!booking) return null;

  const isCancelled = booking.bookingStatus === 'cancelled';
  const hasRemainingBalance = booking.pricing.remainingBalance > 0;

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: 'any' } as any)}
      className="turf-dialog"
      aria-label="Admin Booking Details"
      style={{
        width: 'min(640px, 94vw)',
        maxWidth: '94vw',
      }}
    >
      <div style={{ padding: 'clamp(1rem, 3.5vw, 1.75rem)', backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #E8E2D5', gap: '0.5rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#9D7916', fontWeight: 700, textTransform: 'uppercase' }}>
              ADMIN BOOKING INSPECTOR
            </span>
            <h3 style={{ fontSize: 'clamp(1.2rem, 1rem + 1vw, 1.45rem)', color: '#191919', fontWeight: 700 }}>
              Pass #{booking.referenceCode}
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#666666', wordBreak: 'break-all' }}>ID: {booking.bookingId}</span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              width: '44px',
              height: '44px',
              color: '#666666',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid #E8E2D5',
              backgroundColor: '#FAF8F3',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Customer Information Card */}
        <div style={{ backgroundColor: '#FAF8F3', borderRadius: 'var(--radius-md)', padding: 'clamp(0.85rem, 2.5vw, 1.25rem)', marginBottom: '1rem', border: '1px solid #E8E2D5' }}>
          <h4 style={{ fontSize: '0.8rem', color: '#9D7916', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 700 }}>
            Customer Information
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#666666', display: 'block' }}>Name</span>
              <strong style={{ color: '#191919', wordBreak: 'break-word' }}>{booking.customer.name}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#666666', display: 'block' }}>Mobile</span>
              <a href={`tel:${booking.customer.phone}`} style={{ color: '#9D7916', fontWeight: 600 }}>
                {booking.customer.phone}
              </a>
            </div>
            {booking.customer.email && (
              <div>
                <span style={{ fontSize: '0.75rem', color: '#666666', display: 'block' }}>Email</span>
                <span style={{ color: '#191919', wordBreak: 'break-all' }}>{booking.customer.email}</span>
              </div>
            )}
            {booking.customer.notes && (
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ fontSize: '0.75rem', color: '#666666', display: 'block' }}>Match Notes</span>
                <span style={{ color: '#191919' }}>{booking.customer.notes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Match Schedule Details */}
        <div style={{ backgroundColor: '#FAF8F3', borderRadius: 'var(--radius-md)', padding: 'clamp(0.85rem, 2.5vw, 1.25rem)', marginBottom: '1rem', border: '1px solid #E8E2D5' }}>
          <h4 style={{ fontSize: '0.8rem', color: '#9D7916', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 700 }}>
            Reservation Schedule
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#666666', display: 'block' }}>Sport</span>
              <strong style={{ color: '#191919' }}>{booking.sport.name}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#666666', display: 'block' }}>Playing Ground</span>
              <strong style={{ color: '#191919', wordBreak: 'break-word' }}>{booking.ground.name}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#666666', display: 'block' }}>Match Date</span>
              <strong style={{ color: '#191919' }}>{booking.date}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#666666', display: 'block' }}>Time Window</span>
              <strong style={{ color: '#9D7916' }}>
                {booking.startTime} – {booking.endTime} ({booking.durationMinutes}m)
              </strong>
            </div>
          </div>
        </div>

        {/* Financial Breakdown */}
        <div style={{ backgroundColor: '#FAF8F3', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem', border: '1px solid #E8E2D5' }}>
          <h4 style={{ fontSize: '0.8rem', color: '#9D7916', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 700 }}>
            Payment & Financials
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666666' }}>Ground Charges</span>
              <span style={{ color: '#191919' }}>₹{booking.pricing.groundCharge.toFixed(2)}</span>
            </div>
            {booking.pricing.addOnsTotal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666666' }}>Equipment & Add-ons</span>
                <span style={{ color: '#191919' }}>₹{booking.pricing.addOnsTotal.toFixed(2)}</span>
              </div>
            )}
            {booking.pricing.discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#218653', fontWeight: 600 }}>
                <span>Coupon Discount ({booking.pricing.couponCode || 'PROMO'})</span>
                <span>-₹{booking.pricing.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666666' }}>Taxes & GST (5%)</span>
              <span style={{ color: '#191919' }}>₹{booking.pricing.taxAmount.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid #E8E2D5', fontSize: '1rem', fontWeight: 700 }}>
              <span style={{ color: '#191919' }}>Total Price</span>
              <span style={{ color: '#9D7916' }}>₹{booking.pricing.totalAmount.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: '#666666' }}>Payment Status</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)', backgroundColor: '#FFFFFF', color: '#666666', border: '1px solid #E8E2D5', textTransform: 'capitalize' }}>
                {booking.paymentStatus.replace('_', ' ')}
              </span>
            </div>
            {hasRemainingBalance && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#B7791F', fontWeight: 700 }}>
                <span>Outstanding Venue Balance</span>
                <span>₹{booking.pricing.remainingBalance.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Operational Admin Actions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {hasRemainingBalance && (
              <button
                onClick={() => {
                  onRecordPayment(booking.bookingId, booking.pricing.remainingBalance);
                  onClose();
                }}
                className="btn btn-primary btn-sm"
                style={{ backgroundColor: '#C9A227', color: '#191919', fontWeight: 700 }}
              >
                <DollarSign size={15} />
                <span>Record ₹{booking.pricing.remainingBalance.toFixed(0)} Paid</span>
              </button>
            )}

            {!isCancelled && (
              <button
                onClick={() => {
                  onUpdateStatus(booking.bookingId, 'completed');
                  onClose();
                }}
                className="btn btn-secondary btn-sm"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#E8E2D5', color: '#191919' }}
              >
                <CheckCircle2 size={15} />
                <span>Mark Completed</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {!isCancelled && (
              <button
                onClick={() => {
                  if (window.confirm('Cancel this booking as administrator?')) {
                    onCancelBooking(booking.bookingId);
                    onClose();
                  }
                }}
                className="btn btn-sm"
                style={{ backgroundColor: 'rgba(217, 67, 67, 0.1)', color: '#D94343', border: '1px solid #D94343', fontWeight: 600 }}
              >
                <XCircle size={15} />
                <span>Cancel Reservation</span>
              </button>
            )}

            <button onClick={() => window.print()} className="btn btn-secondary btn-sm" style={{ backgroundColor: '#FFFFFF', borderColor: '#E8E2D5', color: '#191919' }}>
              <Printer size={15} />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
};
