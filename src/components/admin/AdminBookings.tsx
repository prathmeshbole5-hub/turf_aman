import React, { useState, useMemo } from 'react';
import type { ConfirmedBooking } from '../../types';
import { initialSports, initialGrounds } from '../../config/turfConfig';
import { exportBookingsToCSV } from '../../services/storageService';
import { 
  Search, 
  Download, 
  PlusCircle, 
  Eye, 
  DollarSign, 
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface AdminBookingsProps {
  bookings: ConfirmedBooking[];
  onSelectBooking: (booking: ConfirmedBooking) => void;
  onOpenManualBooking: () => void;
  onRecordPayment: (bookingId: string, amount: number) => void;
}

export const AdminBookings: React.FC<AdminBookingsProps> = ({
  bookings,
  onSelectBooking,
  onOpenManualBooking,
  onRecordPayment,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSportFilter, setSelectedSportFilter] = useState('all');
  const [selectedGroundFilter, setSelectedGroundFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        b.referenceCode.toLowerCase().includes(q) ||
        b.bookingId.toLowerCase().includes(q) ||
        b.customer.name.toLowerCase().includes(q) ||
        b.customer.phone.includes(q);

      const matchesSport = selectedSportFilter === 'all' || b.sport.id === selectedSportFilter;
      const matchesGround = selectedGroundFilter === 'all' || b.ground.id === selectedGroundFilter;
      const matchesStatus = selectedStatusFilter === 'all' || b.bookingStatus === selectedStatusFilter;
      const matchesPayment = selectedPaymentFilter === 'all' || b.paymentStatus === selectedPaymentFilter;

      return matchesSearch && matchesSport && matchesGround && matchesStatus && matchesPayment;
    });
  }, [bookings, searchQuery, selectedSportFilter, selectedGroundFilter, selectedStatusFilter, selectedPaymentFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / itemsPerPage));
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Action & Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.5rem', color: '#191919', fontWeight: 700 }}>
            Booking Management
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#666666' }}>
            View, filter, create walk-in passes, and record offline counter payments.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          <button
            onClick={() => exportBookingsToCSV(filteredBookings)}
            className="btn btn-secondary btn-sm"
            style={{ backgroundColor: '#FFFFFF', borderColor: '#E8E2D5', color: '#191919', minHeight: '44px' }}
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenManualBooking}
            className="btn btn-primary btn-sm"
            style={{ backgroundColor: '#C9A227', color: '#191919', fontWeight: 700, minHeight: '44px' }}
          >
            <PlusCircle size={15} />
            <span>+ Manual Booking</span>
          </button>
        </div>
      </div>

      {/* Filter Matrix Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E8E2D5',
          borderRadius: 'var(--radius-md)',
          padding: 'clamp(0.85rem, 2vw, 1.25rem)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
          gap: '0.75rem',
          boxShadow: 'var(--shadow-subtle)',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#666666' }} />
          <input
            type="text"
            placeholder="Search player, ref, phone..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem 0.65rem 2.4rem',
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #E8E2D5',
              borderRadius: 'var(--radius-sm)',
              color: '#191919',
              fontSize: '16px',
              minHeight: '44px',
              boxSizing: 'border-box',
              outlineColor: '#C9A227',
            }}
          />
        </div>

        {/* Sport Filter */}
        <select
          value={selectedSportFilter}
          onChange={(e) => {
            setSelectedSportFilter(e.target.value);
            setCurrentPage(1);
          }}
          style={{
            padding: '0.65rem',
            backgroundColor: '#FFFFFF',
            border: '1.5px solid #E8E2D5',
            borderRadius: 'var(--radius-sm)',
            color: '#191919',
            fontSize: '0.85rem',
            outlineColor: '#C9A227',
          }}
        >
          <option value="all">All Sports</option>
          {initialSports.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        {/* Ground Filter */}
        <select
          value={selectedGroundFilter}
          onChange={(e) => {
            setSelectedGroundFilter(e.target.value);
            setCurrentPage(1);
          }}
          style={{
            padding: '0.65rem',
            backgroundColor: '#FFFFFF',
            border: '1.5px solid #E8E2D5',
            borderRadius: 'var(--radius-sm)',
            color: '#191919',
            fontSize: '0.85rem',
            outlineColor: '#C9A227',
          }}
        >
          <option value="all">All Grounds</option>
          {initialGrounds.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>

        {/* Booking Status Filter */}
        <select
          value={selectedStatusFilter}
          onChange={(e) => {
            setSelectedStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          style={{
            padding: '0.65rem',
            backgroundColor: '#FFFFFF',
            border: '1.5px solid #E8E2D5',
            borderRadius: 'var(--radius-sm)',
            color: '#191919',
            fontSize: '0.85rem',
            outlineColor: '#C9A227',
          }}
        >
          <option value="all">All Statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {/* Payment Filter */}
        <select
          value={selectedPaymentFilter}
          onChange={(e) => {
            setSelectedPaymentFilter(e.target.value);
            setCurrentPage(1);
          }}
          style={{
            padding: '0.65rem',
            backgroundColor: '#FFFFFF',
            border: '1.5px solid #E8E2D5',
            borderRadius: 'var(--radius-sm)',
            color: '#191919',
            fontSize: '0.85rem',
            outlineColor: '#C9A227',
          }}
        >
          <option value="all">All Payments</option>
          <option value="paid_online">Paid Online</option>
          <option value="advance_paid">Advance Deposit (25%)</option>
          <option value="pay_at_venue">Pay at Venue</option>
        </select>
      </div>

      {/* Responsive Table Wrapper */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E8E2D5',
          borderRadius: 'var(--radius-lg)',
          padding: 0,
          overflow: 'hidden',
          boxShadow: 'var(--shadow-subtle)',
        }}
      >
        <div
          className="table-responsive-wrapper"
          tabIndex={0}
          role="region"
          aria-label="Bookings Directory Table"
          style={{
            overflowX: 'auto',
            maxHeight: '620px',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.875rem' }}>
            <thead
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 2,
                backgroundColor: '#FAF8F3',
                borderBottom: '1.5px solid #E8E2D5',
              }}
            >
              <tr style={{ textAlign: 'left', color: '#666666', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '1rem', borderBottom: '1.5px solid #E8E2D5' }}>Ref Code</th>
                <th style={{ padding: '1rem', borderBottom: '1.5px solid #E8E2D5' }}>Customer</th>
                <th style={{ padding: '1rem', borderBottom: '1.5px solid #E8E2D5' }}>Sport & Ground</th>
                <th style={{ padding: '1rem', borderBottom: '1.5px solid #E8E2D5' }}>Date & Schedule</th>
                <th style={{ padding: '1rem', borderBottom: '1.5px solid #E8E2D5' }}>Total Fare</th>
                <th style={{ padding: '1rem', borderBottom: '1.5px solid #E8E2D5' }}>Payment</th>
                <th style={{ padding: '1rem', borderBottom: '1.5px solid #E8E2D5' }}>Status</th>
                <th style={{ padding: '1rem', borderBottom: '1.5px solid #E8E2D5', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBookings.length > 0 ? (
                paginatedBookings.map((b) => {
                  const isCancelled = b.bookingStatus === 'cancelled';
                  const hasRemaining = b.pricing.remainingBalance > 0;

                  return (
                    <tr
                      key={b.bookingId}
                      style={{
                        borderBottom: '1px solid #E8E2D5',
                        backgroundColor: 'transparent',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FAF8F3')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Ref code */}
                      <td style={{ padding: '1rem', fontFamily: 'var(--font-heading)', fontWeight: 800, color: '#9D7916' }}>
                        {b.referenceCode}
                      </td>

                      {/* Customer */}
                      <td style={{ padding: '1rem' }}>
                        <strong style={{ color: '#191919', display: 'block' }}>{b.customer.name}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#666666' }}>{b.customer.phone}</span>
                      </td>

                      {/* Sport & Ground */}
                      <td style={{ padding: '1rem' }}>
                        <div style={{ color: '#191919', fontWeight: 600 }}>{b.sport.name}</div>
                        <span style={{ fontSize: '0.75rem', color: '#666666' }}>{b.ground.name}</span>
                      </td>

                      {/* Date & Schedule */}
                      <td style={{ padding: '1rem' }}>
                        <div style={{ color: '#191919' }}>{b.date}</div>
                        <span style={{ fontSize: '0.75rem', color: '#9D7916', fontWeight: 600 }}>
                          {b.startTime} – {b.endTime} ({b.durationMinutes}m)
                        </span>
                      </td>

                      {/* Total fare */}
                      <td style={{ padding: '1rem', color: '#191919' }}>
                        <strong>₹{b.pricing.totalAmount.toFixed(2)}</strong>
                        {hasRemaining && (
                          <div style={{ fontSize: '0.7rem', color: '#B7791F', fontWeight: 600 }}>
                            Due: ₹{b.pricing.remainingBalance.toFixed(0)}
                          </div>
                        )}
                      </td>

                      {/* Payment */}
                      <td style={{ padding: '1rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)', backgroundColor: '#FAF8F3', color: '#666666', border: '1px solid #E8E2D5', textTransform: 'capitalize' }}>
                          {b.paymentStatus.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '1rem' }}>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            padding: '0.2rem 0.55rem',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: isCancelled ? 'rgba(217, 67, 67, 0.1)' : 'rgba(33, 134, 83, 0.1)',
                            color: isCancelled ? '#D94343' : '#218653',
                            border: isCancelled ? '1px solid rgba(217, 67, 67, 0.25)' : '1px solid rgba(33, 134, 83, 0.25)',
                          }}
                        >
                          {b.bookingStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          {hasRemaining && !isCancelled && (
                            <button
                              onClick={() => onRecordPayment(b.bookingId, b.pricing.remainingBalance)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', backgroundColor: '#FFFFFF', borderColor: '#E8E2D5', color: '#191919' }}
                              title="Clear outstanding balance"
                            >
                              <DollarSign size={13} style={{ color: '#9D7916' }} />
                              <span>Clear</span>
                            </button>
                          )}

                          <button
                            onClick={() => onSelectBooking(b)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', backgroundColor: '#FFFFFF', borderColor: '#E8E2D5', color: '#191919' }}
                            title="Inspect full booking details"
                          >
                            <Eye size={13} />
                            <span>Details</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#666666' }}>
                    No bookings found matching current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div
          style={{
            padding: '1rem clamp(0.75rem, 2.5vw, 1.5rem)',
            backgroundColor: '#FAF8F3',
            borderTop: '1px solid #E8E2D5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            fontSize: '0.8125rem',
            color: '#666666',
          }}
        >
          <span>
            Showing {Math.min(filteredBookings.length, (currentPage - 1) * itemsPerPage + 1)} to{' '}
            {Math.min(filteredBookings.length, currentPage * itemsPerPage)} of {filteredBookings.length} records
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
              style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E8E2D5',
                color: currentPage === 1 ? '#CCCCCC' : '#191919',
                borderRadius: 'var(--radius-sm)',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              }}
            >
              <ChevronLeft size={18} />
            </button>

            <span style={{ fontWeight: 700, color: '#191919', padding: '0 0.25rem' }}>
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
              style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E8E2D5',
                color: currentPage === totalPages ? '#CCCCCC' : '#191919',
                borderRadius: 'var(--radius-sm)',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
