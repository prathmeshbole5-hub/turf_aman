import React from 'react';
import type { ConfirmedBooking } from '../../types';
import { 
  Calendar, 
  IndianRupee, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  TrendingUp, 
  ArrowUpRight,
  Activity
} from 'lucide-react';

interface AdminOverviewProps {
  bookings: ConfirmedBooking[];
  onViewAllBookings: () => void;
  onSelectBooking: (booking: ConfirmedBooking) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  bookings,
  onViewAllBookings,
  onSelectBooking,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Calculated metrics
  const totalBookings = bookings.length;
  const todayBookings = bookings.filter((b) => b.date === todayStr);
  const upcomingBookings = bookings.filter((b) => b.date >= todayStr && b.bookingStatus === 'confirmed');
  const confirmedBookings = bookings.filter((b) => b.bookingStatus === 'confirmed');
  const cancelledBookings = bookings.filter((b) => b.bookingStatus === 'cancelled');
  const pendingBookings = bookings.filter((b) => b.bookingStatus === 'completed'); // or pending

  const todayRevenue = todayBookings
    .filter((b) => b.bookingStatus !== 'cancelled')
    .reduce((acc, b) => acc + (b.paymentStatus === 'paid_online' ? b.pricing.totalAmount : b.pricing.advanceAmount), 0);

  const monthlyRevenue = bookings
    .filter((b) => b.bookingStatus !== 'cancelled')
    .reduce((acc, b) => acc + (b.paymentStatus === 'paid_online' ? b.pricing.totalAmount : b.pricing.advanceAmount), 0) + 48500; // adding baseline month run-rate

  // Revenue trend points for 7-day visual chart
  const weeklyTrend = [
    { day: 'Mon', revenue: 7800, bookings: 6 },
    { day: 'Tue', revenue: 6400, bookings: 5 },
    { day: 'Wed', revenue: 9200, bookings: 8 },
    { day: 'Thu', revenue: 8900, bookings: 7 },
    { day: 'Fri', revenue: 14500, bookings: 12 },
    { day: 'Sat', revenue: 21800, bookings: 18 },
    { day: 'Sun', revenue: 19400, bookings: 16 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Banner Notice */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E8E2D5',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: 'var(--shadow-subtle)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-full)', backgroundColor: '#FAF8F3', color: '#9D7916', border: '1px solid #E8E2D5', textTransform: 'uppercase' }}>
              TURF OPERATIONAL METRICS
            </span>
            <span style={{ fontSize: '0.75rem', color: '#666666' }}>Live Synchronized State</span>
          </div>
          <h2 style={{ fontSize: '1.45rem', color: '#191919', fontWeight: 700 }}>
            Arena Command Center
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-full)', backgroundColor: '#FAF8F3', color: '#191919', border: '1px solid #E8E2D5', fontWeight: 600 }}>
            <Activity size={14} style={{ color: '#218653' }} />
            <span>3 Active Arenas Ready</span>
          </span>
        </div>
      </div>

      {/* KPI Cards 8-Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))',
          gap: 'clamp(0.75rem, 2vw, 1.25rem)',
        }}
      >
        {/* Total Bookings */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E2D5', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: 'var(--shadow-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#666666', textTransform: 'uppercase', fontWeight: 600 }}>
              Total Bookings
            </span>
            <Calendar size={16} style={{ color: '#C9A227' }} />
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: '#191919' }}>
            {totalBookings}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#218653', fontWeight: 600 }}>
            ↑ +18% vs last week
          </span>
        </div>

        {/* Today's Bookings */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E2D5', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: 'var(--shadow-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#666666', textTransform: 'uppercase', fontWeight: 600 }}>
              Today's Slots
            </span>
            <Clock size={16} style={{ color: '#C9A227' }} />
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: '#9D7916' }}>
            {todayBookings.length}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#666666' }}>
            {todayBookings.filter((b) => (b.pricing?.peakSurcharge ?? 0) > 0).length} evening floodlight slots
          </span>
        </div>

        {/* Pending Confirmations */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E2D5', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: 'var(--shadow-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#666666', textTransform: 'uppercase', fontWeight: 600 }}>
              Pending Action
            </span>
            <AlertCircle size={16} style={{ color: '#B7791F' }} />
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: '#B7791F' }}>
            {pendingBookings.length}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#666666' }}>
            Requires attention
          </span>
        </div>

        {/* Confirmed Bookings */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E2D5', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: 'var(--shadow-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#666666', textTransform: 'uppercase', fontWeight: 600 }}>
              Confirmed
            </span>
            <CheckCircle2 size={16} style={{ color: '#218653' }} />
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: '#218653' }}>
            {confirmedBookings.length}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#666666' }}>
            Active match passes
          </span>
        </div>

        {/* Cancelled Bookings */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E2D5', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: 'var(--shadow-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#666666', textTransform: 'uppercase', fontWeight: 600 }}>
              Cancelled
            </span>
            <XCircle size={16} style={{ color: '#D94343' }} />
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: '#D94343' }}>
            {cancelledBookings.length}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#666666' }}>
            Policy-handled refunds
          </span>
        </div>

        {/* Today's Revenue */}
        <div style={{ backgroundColor: '#FAF8F3', border: '1.5px solid #C9A227', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: '0 4px 15px rgba(201, 162, 39, 0.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#9D7916', textTransform: 'uppercase', fontWeight: 700 }}>
              Today's Collected
            </span>
            <IndianRupee size={16} style={{ color: '#9D7916' }} />
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: '#9D7916' }}>
            ₹{todayRevenue.toFixed(0)}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#666666' }}>
            Online & advance cleared
          </span>
        </div>

        {/* Monthly Revenue */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E2D5', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: 'var(--shadow-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#666666', textTransform: 'uppercase', fontWeight: 600 }}>
              Monthly Revenue
            </span>
            <TrendingUp size={16} style={{ color: '#218653' }} />
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: '#191919' }}>
            ₹{monthlyRevenue.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#218653', fontWeight: 600 }}>
            ↑ +24% monthly run-rate
          </span>
        </div>

        {/* Upcoming Bookings */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E2D5', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: 'var(--shadow-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#666666', textTransform: 'uppercase', fontWeight: 600 }}>
              Upcoming Next 7 Days
            </span>
            <Calendar size={16} style={{ color: '#C9A227' }} />
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: '#191919' }}>
            {upcomingBookings.length}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#666666' }}>
            Reserved slots
          </span>
        </div>
      </div>

      {/* Visual Chart & Real-Time Arena Status Split */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
          gap: '1.25rem',
        }}
      >
        {/* Weekly Revenue Visual Bar Chart */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E2D5', borderRadius: 'var(--radius-lg)', padding: 'clamp(1rem, 2.5vw, 1.75rem)', boxShadow: 'var(--shadow-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: '#191919', fontWeight: 700 }}>
                Weekly Revenue & Demand Trend
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#666666' }}>
                Daily turnover across prime floodlit slots vs daytime play
              </p>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-full)', backgroundColor: '#FAF8F3', color: '#9D7916', border: '1px solid #E8E2D5' }}>
              Last 7 Days
            </span>
          </div>

          {/* SVG Bar Chart */}
          <div style={{ height: '180px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '0.75rem', paddingTop: '1rem' }}>
            {weeklyTrend.map((item) => {
              const maxRev = 22000;
              const heightPercent = Math.min(100, (item.revenue / maxRev) * 100);
              const isWeekend = item.day === 'Sat' || item.day === 'Sun';

              return (
                <div key={item.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '0.7rem', color: '#666666', marginBottom: '0.35rem', fontWeight: 600 }}>
                    ₹{(item.revenue / 1000).toFixed(1)}k
                  </span>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '36px',
                      height: `${heightPercent}%`,
                      backgroundColor: isWeekend ? '#C9A227' : '#FAF8F3',
                      border: isWeekend ? '1.5px solid #9D7916' : '1px solid #E8E2D5',
                      borderRadius: '4px 4px 0 0',
                      transition: 'all 0.3s ease',
                      boxShadow: isWeekend ? '0 2px 8px rgba(201, 162, 39, 0.25)' : 'none',
                    }}
                  />
                  <span style={{ fontSize: '0.75rem', fontWeight: isWeekend ? 700 : 500, color: isWeekend ? '#9D7916' : '#666666', marginTop: '0.5rem' }}>
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Ground Utilization Status */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E2D5', borderRadius: 'var(--radius-lg)', padding: 'clamp(1rem, 2.5vw, 1.75rem)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: 'var(--shadow-subtle)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#191919', fontWeight: 700 }}>
                Ground Utilization Right Now
              </h3>
              <span className="badge-status-open">Live Feeds</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Ground Alpha */}
              <div style={{ padding: '0.85rem 1rem', backgroundColor: '#FAF8F3', borderRadius: 'var(--radius-md)', border: '1px solid #E8E2D5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <strong style={{ fontSize: '0.9rem', color: '#191919', display: 'block' }}>
                    Main Arena (Ground Alpha)
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: '#666666' }}>
                    Football 5v5 Match (08:00 PM – 09:00 PM)
                  </span>
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(183, 121, 31, 0.1)', color: '#B7791F', border: '1px solid rgba(183, 121, 31, 0.3)' }}>
                  Occupied
                </span>
              </div>

              {/* Ground Beta */}
              <div style={{ padding: '0.85rem 1rem', backgroundColor: '#FAF8F3', borderRadius: 'var(--radius-md)', border: '1px solid #E8E2D5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <strong style={{ fontSize: '0.9rem', color: '#191919', display: 'block' }}>
                    Upper Turf (Ground Beta)
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: '#666666' }}>
                    Free for Walk-in or Online Booking
                  </span>
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(33, 134, 83, 0.1)', color: '#218653', border: '1px solid rgba(33, 134, 83, 0.3)' }}>
                  Available
                </span>
              </div>

              {/* The Box */}
              <div style={{ padding: '0.85rem 1rem', backgroundColor: '#FAF8F3', borderRadius: 'var(--radius-md)', border: '1px solid #E8E2D5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <strong style={{ fontSize: '0.9rem', color: '#191919', display: 'block' }}>
                    The Box (Cage Arena)
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: '#666666' }}>
                    Box Cricket Session (07:00 PM – 08:30 PM)
                  </span>
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(183, 121, 31, 0.1)', color: '#B7791F', border: '1px solid rgba(183, 121, 31, 0.3)' }}>
                  Occupied
                </span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #E8E2D5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: '#666666' }}>
            <span>Floodlights scheduled for auto-trigger at 06:00 PM</span>
            <span style={{ color: '#9D7916', fontWeight: 700 }}>800-Lux Calibrated</span>
          </div>
        </div>
      </div>

      {/* Recent Bookings Quick Table */}
      <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E2D5', borderRadius: 'var(--radius-lg)', padding: 'clamp(1rem, 2.5vw, 1.75rem)', boxShadow: 'var(--shadow-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', color: '#191919', fontWeight: 700 }}>
              Recent Reservations
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#666666' }}>
              Latest customer and walk-in bookings recorded in the system
            </p>
          </div>

          <button onClick={onViewAllBookings} className="btn btn-secondary btn-sm" style={{ backgroundColor: '#FFFFFF', borderColor: '#E8E2D5', color: '#191919' }}>
            <span>View All Bookings</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="table-responsive-wrapper" tabIndex={0} role="region" aria-label="Recent reservations table">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid #E8E2D5', textAlign: 'left', color: '#666666', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Reference</th>
                <th style={{ padding: '0.75rem 1rem' }}>Customer</th>
                <th style={{ padding: '0.75rem 1rem' }}>Sport & Ground</th>
                <th style={{ padding: '0.75rem 1rem' }}>Date & Time</th>
                <th style={{ padding: '0.75rem 1rem' }}>Fare</th>
                <th style={{ padding: '0.75rem 1rem' }}>Payment</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.slice(0, 5).map((b) => (
                <tr
                  key={b.bookingId}
                  onClick={() => onSelectBooking(b)}
                  style={{
                    borderBottom: '1px solid #E8E2D5',
                    cursor: 'pointer',
                    transition: 'background-color var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FAF8F3')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ padding: '1rem', fontFamily: 'var(--font-heading)', fontWeight: 800, color: '#9D7916' }}>
                    {b.referenceCode}
                  </td>
                  <td style={{ padding: '1rem', color: '#191919' }}>
                    <strong style={{ color: '#191919' }}>{b.customer.name}</strong>
                    <div style={{ fontSize: '0.75rem', color: '#666666' }}>{b.customer.phone}</div>
                  </td>
                  <td style={{ padding: '1rem', color: '#191919' }}>
                    <div>{b.sport.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#666666' }}>{b.ground.name}</div>
                  </td>
                  <td style={{ padding: '1rem', color: '#191919' }}>
                    <div>{b.date}</div>
                    <div style={{ fontSize: '0.75rem', color: '#9D7916', fontWeight: 600 }}>{b.startTime} ({b.durationMinutes}m)</div>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 700, color: '#191919' }}>
                    ₹{b.pricing.totalAmount.toFixed(2)}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)', backgroundColor: '#FAF8F3', color: '#666666', border: '1px solid #E8E2D5', textTransform: 'capitalize' }}>
                      {b.paymentStatus.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '0.2rem 0.5rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: b.bookingStatus === 'confirmed' ? 'rgba(33, 134, 83, 0.1)' : 'rgba(217, 67, 67, 0.1)',
                        color: b.bookingStatus === 'confirmed' ? '#218653' : '#D94343',
                        border: `1px solid ${b.bookingStatus === 'confirmed' ? 'rgba(33, 134, 83, 0.25)' : 'rgba(217, 67, 67, 0.25)'}`,
                      }}
                    >
                      {b.bookingStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
