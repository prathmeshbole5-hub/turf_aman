import React, { useState, useRef, useEffect } from 'react';
import { X, Search, Phone, AlertCircle, Ticket, CheckCircle2, XCircle } from 'lucide-react';
import { brandConfig } from '../config/turfConfig';
import { getStoredBookings, cancelBooking } from '../services/storageService';
import { apiClient } from '../services/apiClient';
import type { ConfirmedBooking } from '../types';

interface MyBookingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookNewSlot: () => void;
}

export const MyBookingsModal: React.FC<MyBookingsModalProps> = ({ isOpen, onClose, onBookNewSlot }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookings, setBookings] = useState<ConfirmedBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<ConfirmedBooking[]>([]);
  const [searched, setSearched] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Sync bookings on open
  useEffect(() => {
    if (isOpen) {
      apiClient.getMyBookings().then((fetched) => {
        setBookings(fetched);
        setFilteredBookings(fetched);
      }).catch(() => {
        const stored = getStoredBookings();
        setBookings(stored);
        setFilteredBookings(stored);
      });
      setSearched(false);
      setActionMessage(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Fallback for browsers without native closedby support
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleDialogClick = (event: MouseEvent) => {
      if (!('closedBy' in HTMLDialogElement.prototype)) {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const isDialogContent =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width;

        if (!isDialogContent) {
          onClose();
        }
      }
    };

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    dialog.addEventListener('click', handleDialogClick);
    dialog.addEventListener('cancel', handleCancel);

    return () => {
      dialog.removeEventListener('click', handleDialogClick);
      dialog.removeEventListener('cancel', handleCancel);
    };
  }, [onClose]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
    setActionMessage(null);
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setFilteredBookings(bookings);
      return;
    }

    try {
      const serverResults = await apiClient.getMyBookings(q);
      if (serverResults && serverResults.length > 0) {
        setFilteredBookings(serverResults);
        return;
      }
    } catch {
      // fallback to local filter
    }

    const matches = bookings.filter((b) =>
      b.customer.phone.includes(q) ||
      b.referenceCode.toLowerCase().includes(q) ||
      b.bookingId.toLowerCase().includes(q) ||
      b.customer.name.toLowerCase().includes(q)
    );
    setFilteredBookings(matches);
  };

  const handleCancelClick = async (bookingId: string) => {
    const confirmPrompt = window.confirm(
      'Are you sure you want to cancel this booking? A 100% refund is initiated if within the 12-hour cancellation window.'
    );
    if (!confirmPrompt) return;

    try {
      const res = await apiClient.cancelBooking(bookingId);
      setActionMessage({ text: res.message, isError: false });
      const updated = await apiClient.getMyBookings();
      setBookings(updated);
      setFilteredBookings(updated);
    } catch {
      const res = cancelBooking(bookingId);
      setActionMessage({ text: res.message, isError: !res.success });
      const updated = getStoredBookings();
      setBookings(updated);
      setFilteredBookings(updated);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: 'any' } as any)}
      className="turf-dialog"
      aria-label="Look Up My Bookings"
      style={{
        width: 'min(640px, 94vw)',
        maxWidth: '94vw',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E8E2D5',
      }}
    >
      <div style={{ padding: 'clamp(1rem, 3.5vw, 1.75rem)', backgroundColor: '#FFFFFF' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
            <div
              style={{
                width: '2.4rem',
                height: '2.4rem',
                borderRadius: '10px',
                backgroundColor: '#FAF8F3',
                border: '1px solid #E8E2D5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(201, 162, 39, 0.1)',
                flexShrink: 0,
              }}
            >
              <Ticket size={18} style={{ color: '#C9A227' }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontSize: 'clamp(1.1rem, 0.95rem + 0.5vw, 1.3rem)', color: '#191919', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                My Bookings & Match Passes
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#666666' }}>
                Track confirmed slots & manage passes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666666',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid #E8E2D5',
              backgroundColor: '#FAF8F3',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Action / Cancellation Feedback Message */}
        {actionMessage && (
          <div
            style={{
              backgroundColor: actionMessage.isError ? 'rgba(217, 67, 67, 0.1)' : 'rgba(33, 134, 83, 0.1)',
              border: actionMessage.isError ? '1px solid #D94343' : '1px solid #218653',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              color: '#191919',
              fontSize: '0.875rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {actionMessage.isError ? <AlertCircle size={16} style={{ color: '#D94343' }} /> : <CheckCircle2 size={16} style={{ color: '#218653' }} />}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* Search Input Form */}
        <form onSubmit={handleSearch} style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 200px' }}>
              <Phone
                size={16}
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#8A857A',
                }}
              />
              <input
                type="text"
                placeholder="Search phone or ref (e.g. 9876543210 or TZ-7842)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.6rem',
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid #E8E2D5',
                  borderRadius: 'var(--radius-md)',
                  color: '#191919',
                  fontFamily: 'inherit',
                  fontSize: '16px',
                  minHeight: '44px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-mobile-full" style={{ padding: '0.75rem 1.25rem', backgroundColor: '#C9A227', color: '#191919', minHeight: '44px' }}>
              <Search size={16} />
              <span>Search</span>
            </button>
          </div>
        </form>

        {/* Bookings List */}
        <div style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
          {filteredBookings.length > 0 ? (
            filteredBookings.map((b) => {
              const isCancelled = b.bookingStatus === 'cancelled';

              return (
                <div
                  key={b.bookingId}
                  style={{
                    backgroundColor: '#FAF8F3',
                    borderRadius: 'var(--radius-md)',
                    border: isCancelled ? '1px solid rgba(217, 67, 67, 0.3)' : '1px solid #E8E2D5',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 800, color: '#C9A227' }}>
                        {b.referenceCode}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#666666' }}>
                        • {b.sport.name}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '0.2rem 0.65rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: isCancelled ? 'rgba(217, 67, 67, 0.1)' : 'rgba(33, 134, 83, 0.1)',
                        color: isCancelled ? '#D94343' : '#218653',
                        border: isCancelled ? '1px solid rgba(217, 67, 67, 0.3)' : '1px solid rgba(33, 134, 83, 0.3)',
                      }}
                    >
                      {b.bookingStatus}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '0.6rem', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: '#666666', display: 'block', fontSize: '0.75rem' }}>Ground</span>
                      <strong style={{ color: '#191919', wordBreak: 'break-word' }}>{b.ground.name}</strong>
                    </div>

                    <div>
                      <span style={{ color: '#666666', display: 'block', fontSize: '0.75rem' }}>Date & Slot</span>
                      <strong style={{ color: '#9D7916' }}>
                        {b.date} • {b.startTime} ({b.durationMinutes}m)
                      </strong>
                    </div>

                    <div>
                      <span style={{ color: '#666666', display: 'block', fontSize: '0.75rem' }}>Customer</span>
                      <span style={{ color: '#191919' }}>{b.customer.name} ({b.customer.phone})</span>
                    </div>

                    <div>
                      <span style={{ color: '#666666', display: 'block', fontSize: '0.75rem' }}>Total Fare</span>
                      <span style={{ color: '#191919', fontWeight: 700 }}>
                        ₹{b.pricing.totalAmount.toFixed(2)} ({b.paymentStatus.replace('_', ' ')})
                      </span>
                    </div>
                  </div>

                  {!isCancelled && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid #E8E2D5' }}>
                      <button
                        type="button"
                        onClick={() => handleCancelClick(b.bookingId)}
                        style={{
                          fontSize: '0.8rem',
                          color: '#D94343',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.3rem 0.6rem',
                          fontWeight: 600,
                        }}
                      >
                        <XCircle size={14} />
                        <span>Cancel Booking</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div
              style={{
                padding: '2.5rem 1.5rem',
                backgroundColor: '#FAF8F3',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed #E8E2D5',
                textAlign: 'center',
              }}
            >
              <AlertCircle size={32} style={{ color: '#B7791F', margin: '0 auto 0.75rem auto' }} />
              <h4 style={{ fontSize: '1.05rem', color: '#191919', marginBottom: '0.4rem', fontWeight: 700 }}>
                {searched ? 'No Matching Bookings' : 'No Bookings Yet'}
              </h4>
              <p style={{ fontSize: '0.85rem', color: '#666666', marginBottom: '1.25rem' }}>
                {searched
                  ? `No bookings found for "${searchQuery}". Please verify your mobile number.`
                  : 'You have not reserved any match slots yet. Reserve your first ground below!'}
              </p>
              <button
                onClick={() => {
                  onClose();
                  onBookNewSlot();
                }}
                className="btn btn-primary btn-sm"
                style={{ backgroundColor: '#C9A227', color: '#191919' }}
              >
                <span>Book a Slot Now</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer info & policy reminder */}
        <div style={{ borderTop: '1px solid #E8E2D5', paddingTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#666666', flexWrap: 'wrap', gap: '0.75rem' }}>
          <span>Free cancellation up to {brandConfig.policy.cancellationWindowHours}h before start time.</span>
          <button
            onClick={() => {
              onClose();
              onBookNewSlot();
            }}
            className="btn btn-outline-gold btn-sm"
            style={{ fontSize: '0.75rem', padding: '0.4rem 0.85rem' }}
          >
            <span>+ New Match Booking</span>
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default MyBookingsModal;
