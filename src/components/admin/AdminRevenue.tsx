import React, { useMemo } from 'react';
import type { ConfirmedBooking } from '../../types';
import { 
  CreditCard, 
  AlertCircle, 
  RefreshCcw,
  Wallet
} from 'lucide-react';

interface AdminRevenueProps {
  bookings: ConfirmedBooking[];
}

export const AdminRevenue: React.FC<AdminRevenueProps> = ({ bookings }) => {
  // Financial metrics
  const totalBookingValue = useMemo(() => {
    return bookings.reduce((acc, b) => acc + (b.bookingStatus !== 'cancelled' ? b.pricing.totalAmount : 0), 0);
  }, [bookings]);

  const onlineCollected = useMemo(() => {
    return bookings
      .filter((b) => b.bookingStatus !== 'cancelled' && (b.paymentStatus === 'paid_online' || b.paymentStatus === 'advance_paid'))
      .reduce((acc, b) => acc + b.pricing.advanceAmount, 0);
  }, [bookings]);

  const venueOfflineCollected = useMemo(() => {
    return bookings
      .filter((b) => b.bookingStatus !== 'cancelled' && b.paymentMethod === 'pay_at_venue' && b.paymentStatus === 'paid_online')
      .reduce((acc, b) => acc + b.pricing.totalAmount, 0);
  }, [bookings]);

  const pendingVenueBalances = useMemo(() => {
    return bookings
      .filter((b) => b.bookingStatus !== 'cancelled')
      .reduce((acc, b) => acc + b.pricing.remainingBalance, 0);
  }, [bookings]);

  const refundsProcessed = useMemo(() => {
    return bookings
      .filter((b) => b.bookingStatus === 'cancelled')
      .reduce((acc, b) => acc + b.pricing.advanceAmount, 0);
  }, [bookings]);

  // Breakdown by sport
  const revenueBySport = useMemo(() => {
    const map = new Map<string, { sportName: string; total: number; count: number }>();
    bookings
      .filter((b) => b.bookingStatus !== 'cancelled')
      .forEach((b) => {
        const name = b.sport.name;
        if (!map.has(name)) {
          map.set(name, { sportName: name, total: 0, count: 0 });
        }
        const item = map.get(name)!;
        item.total += b.pricing.totalAmount;
        item.count += 1;
      });
    return Array.from(map.values());
  }, [bookings]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Header */}
      <div>
        <h2 style={{ fontSize: '1.5rem', color: '#191919', fontWeight: 700 }}>
          Financial Accounts & Revenue Ledger
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#666666' }}>
          Authoritative audit of online collections, advance deposits, venue receipts, and refund claims.
        </p>
      </div>

      {/* Financial KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))',
          gap: 'clamp(0.75rem, 2vw, 1.25rem)',
        }}
      >
        {/* Gross Booked Value */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E2D5', borderRadius: 'var(--radius-lg)', padding: 'clamp(1rem, 2.5vw, 1.5rem)', boxShadow: 'var(--shadow-subtle)' }}>
          <span style={{ fontSize: '0.75rem', color: '#666666', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
            Gross Booking Value
          </span>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.4rem, 1.1rem + 1vw, 2rem)', fontWeight: 800, color: '#191919', marginBottom: '0.25rem' }}>
            ₹{totalBookingValue.toFixed(2)}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#666666' }}>
            Total confirmed contracts
          </span>
        </div>

        {/* Online Collected */}
        <div style={{ backgroundColor: '#FAF8F3', border: '1.5px solid #C9A227', borderRadius: 'var(--radius-lg)', padding: 'clamp(1rem, 2.5vw, 1.5rem)', boxShadow: '0 4px 15px rgba(201, 162, 39, 0.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#9D7916', textTransform: 'uppercase', fontWeight: 700 }}>
              Online Razorpay Received
            </span>
            <CreditCard size={16} style={{ color: '#9D7916' }} />
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.4rem, 1.1rem + 1vw, 2rem)', fontWeight: 800, color: '#9D7916', marginBottom: '0.25rem' }}>
            ₹{onlineCollected.toFixed(2)}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#218653', fontWeight: 600 }}>
            Verified in gateway account
          </span>
        </div>

        {/* Pending Balance Due */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E2D5', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#B7791F', textTransform: 'uppercase', fontWeight: 700 }}>
              Pending Venue Balances
            </span>
            <AlertCircle size={16} style={{ color: '#B7791F' }} />
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: '#B7791F', marginBottom: '0.25rem' }}>
            ₹{pendingVenueBalances.toFixed(2)}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#666666' }}>
            Due at match check-in
          </span>
        </div>

        {/* Offline Payments Collected */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E2D5', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#191919', textTransform: 'uppercase', fontWeight: 700 }}>
              Offline Walk-in Paid
            </span>
            <Wallet size={16} style={{ color: '#C9A227' }} />
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: '#191919', marginBottom: '0.25rem' }}>
            ₹{venueOfflineCollected.toFixed(2)}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#666666' }}>
            Cash & venue card receipts
          </span>
        </div>

        {/* Refunds Handled */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E2D5', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#D94343', textTransform: 'uppercase', fontWeight: 700 }}>
              Refunds Processed
            </span>
            <RefreshCcw size={16} style={{ color: '#D94343' }} />
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: '#D94343', marginBottom: '0.25rem' }}>
            ₹{refundsProcessed.toFixed(2)}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#666666' }}>
            Cancelled prior to 12h policy
          </span>
        </div>
      </div>

      {/* Revenue Breakdown by Sport */}
      <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E2D5', borderRadius: 'var(--radius-lg)', padding: '1.75rem', boxShadow: 'var(--shadow-subtle)' }}>
        <h3 style={{ fontSize: '1.25rem', color: '#191919', marginBottom: '0.25rem', fontWeight: 700 }}>
          Revenue Breakdown by Sport Category
        </h3>
        <p style={{ fontSize: '0.85rem', color: '#666666', marginBottom: '1.5rem' }}>
          Contribution to total turnover from football, cricket, box tournaments, and futsal
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {revenueBySport.map((item) => {
            const percent = totalBookingValue > 0 ? (item.total / totalBookingValue) * 100 : 0;

            return (
              <div key={item.sportName}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong style={{ color: '#191919' }}>{item.sportName}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#666666' }}>({item.count} bookings)</span>
                  </div>
                  <strong style={{ color: '#9D7916' }}>
                    ₹{item.total.toFixed(2)} ({percent.toFixed(1)}%)
                  </strong>
                </div>

                <div style={{ height: '8px', backgroundColor: '#FAF8F3', border: '1px solid #E8E2D5', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${percent}%`,
                      backgroundColor: '#C9A227',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
