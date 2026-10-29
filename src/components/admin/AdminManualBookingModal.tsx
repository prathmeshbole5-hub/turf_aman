import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { TimeSlot } from '../../types';
import { initialSports, initialGrounds } from '../../config/turfConfig';
import { generateDaySlots, validateConsecutiveSlots } from '../../services/slotService';
import { apiClient } from '../../services/apiClient';
import { X, PlusCircle, AlertCircle, Loader2 } from 'lucide-react';

interface AdminManualBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingCreated: () => void;
}

export const AdminManualBookingModal: React.FC<AdminManualBookingModalProps> = ({
  isOpen,
  onClose,
  onBookingCreated,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('Walk-in offline booking');

  const [selectedSportId, setSelectedSportId] = useState(initialSports[0].id);
  const selectedSport = useMemo(() => {
    return initialSports.find((s) => s.id === selectedSportId) || initialSports[0];
  }, [selectedSportId]);

  const compatibleGrounds = useMemo(() => {
    return initialGrounds.filter((g) => selectedSport.supportedGroundIds.includes(g.id));
  }, [selectedSport]);

  const [selectedGroundId, setSelectedGroundId] = useState(compatibleGrounds[0]?.id || initialGrounds[0].id);
  const selectedGround = useMemo(() => {
    return compatibleGrounds.find((g) => g.id === selectedGroundId) || compatibleGrounds[0] || initialGrounds[0];
  }, [compatibleGrounds, selectedGroundId]);

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [durationMinutes, setDurationMinutes] = useState(60);

  const [daySlots, setDaySlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch live availability from database
  useEffect(() => {
    if (!isOpen || !selectedGroundId || !selectedDate) return;
    let isCancelled = false;
    setIsLoadingSlots(true);

    apiClient
      .getAvailability(selectedGroundId, selectedDate)
      .then((slots) => {
        if (!isCancelled) {
          setDaySlots(slots);
          const firstAvail = slots.find((s) => s.status === 'available');
          setSelectedSlotId(firstAvail ? firstAvail.id : slots[0]?.id || '');
          setIsLoadingSlots(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.warn('Fallback to local slots:', err);
          const fallback = generateDaySlots(selectedDate, selectedSport, selectedGround);
          setDaySlots(fallback);
          const firstAvail = fallback.find((s) => s.status === 'available');
          setSelectedSlotId(firstAvail ? firstAvail.id : fallback[0]?.id || '');
          setIsLoadingSlots(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, selectedGroundId, selectedDate, selectedSport, selectedGround]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Keep compatible ground in sync when sport changes
  useEffect(() => {
    if (compatibleGrounds.length > 0 && !compatibleGrounds.some((g) => g.id === selectedGroundId)) {
      setSelectedGroundId(compatibleGrounds[0].id);
    }
  }, [compatibleGrounds, selectedGroundId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMessage(null);

    const slot = daySlots.find((s) => s.id === selectedSlotId);
    if (!slot) {
      setErrorMessage('Please pick an available time slot.');
      return;
    }

    const validation = validateConsecutiveSlots(slot, durationMinutes, daySlots);
    if (!validation.isValid) {
      setErrorMessage(validation.errorMessage || 'Slot interval is not available.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.createBooking({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        sportId: selectedSport.id,
        groundId: selectedGround.id,
        date: selectedDate,
        startTime: slot.startTime,
        durationMinutes,
        selectedAddOns: [],
        paymentMethod: 'VENUE_CASH',
        paymentOption: 'full',
        notes: notes.trim() || 'Walk-in offline booking',
      });

      // Clear input fields
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setNotes('Walk-in offline booking');

      onBookingCreated();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Server rejected booking due to conflict or error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: 'any' } as any)}
      className="turf-dialog"
      aria-label="Create Manual Walk-in Booking"
      style={{
        width: 'min(600px, 94vw)',
        maxWidth: '94vw',
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E8E2D5',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        padding: 0,
        overflow: 'hidden',
      }}
    >
      <form onSubmit={handleSubmit} style={{ padding: 'clamp(1rem, 3.5vw, 1.75rem)', backgroundColor: '#FFFFFF' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid #E8E2D5', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PlusCircle size={20} style={{ color: '#C9A227', flexShrink: 0 }} />
            <h3 style={{ fontSize: 'clamp(1.1rem, 0.95rem + 0.6vw, 1.25rem)', color: '#191919', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
              Add Walk-in / Phone Booking
            </h3>
          </div>

          <button
            type="button"
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

        {errorMessage && (
          <div style={{ backgroundColor: 'rgba(217, 67, 67, 0.08)', border: '1px solid #D94343', color: '#D94343', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <AlertCircle size={16} style={{ color: '#D94343' }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', marginBottom: '0.3rem', fontWeight: 600 }}>
                Customer Name *
              </label>
              <input
                type="text"
                required
                placeholder="Player name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#FAF8F3',
                  border: '1px solid #E8E2D5',
                  borderRadius: '8px',
                  color: '#191919',
                  fontFamily: 'inherit',
                  fontSize: '16px',
                  minHeight: '44px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', marginBottom: '0.3rem', fontWeight: 600 }}>
                Mobile Number *
              </label>
              <input
                type="tel"
                required
                placeholder="10-digit mobile"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#FAF8F3',
                  border: '1px solid #E8E2D5',
                  borderRadius: '8px',
                  color: '#191919',
                  fontFamily: 'inherit',
                  fontSize: '16px',
                  minHeight: '44px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', marginBottom: '0.3rem', fontWeight: 600 }}>
              Email Address (Optional)
            </label>
            <input
              type="email"
              placeholder="player@example.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#FAF8F3',
                border: '1px solid #E8E2D5',
                borderRadius: '8px',
                color: '#191919',
                fontFamily: 'inherit',
                fontSize: '16px',
                minHeight: '44px',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', marginBottom: '0.3rem', fontWeight: 600 }}>
                Sport
              </label>
              <select
                value={selectedSportId}
                onChange={(e) => setSelectedSportId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#FAF8F3',
                  border: '1px solid #E8E2D5',
                  borderRadius: '8px',
                  color: '#191919',
                  fontFamily: 'inherit',
                  fontSize: '16px',
                  minHeight: '44px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              >
                {initialSports.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', marginBottom: '0.3rem', fontWeight: 600 }}>
                Compatible Ground
              </label>
              <select
                value={selectedGroundId}
                onChange={(e) => setSelectedGroundId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#FAF8F3',
                  border: '1px solid #E8E2D5',
                  borderRadius: '8px',
                  color: '#191919',
                  fontFamily: 'inherit',
                  fontSize: '16px',
                  minHeight: '44px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              >
                {compatibleGrounds.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 130px), 1fr))', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', marginBottom: '0.3rem', fontWeight: 600 }}>
                Date
              </label>
              <input
                type="date"
                required
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#FAF8F3',
                  border: '1px solid #E8E2D5',
                  borderRadius: '8px',
                  color: '#191919',
                  fontFamily: 'inherit',
                  fontSize: '16px',
                  minHeight: '44px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', marginBottom: '0.3rem', fontWeight: 600 }}>
                Duration
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#FAF8F3',
                  border: '1px solid #E8E2D5',
                  borderRadius: '8px',
                  color: '#191919',
                  fontFamily: 'inherit',
                  fontSize: '16px',
                  minHeight: '44px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              >
                <option value={60}>1 Hour (60m)</option>
                <option value={90}>1.5 Hours (90m)</option>
                <option value={120}>2 Hours (120m)</option>
                <option value={180}>3 Hours (180m)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', marginBottom: '0.3rem', fontWeight: 600 }}>
                Start Slot
              </label>
              <select
                value={selectedSlotId}
                onChange={(e) => setSelectedSlotId(e.target.value)}
                disabled={isLoadingSlots}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#FAF8F3',
                  border: '1px solid #E8E2D5',
                  borderRadius: '8px',
                  color: '#191919',
                  fontFamily: 'inherit',
                  fontSize: '16px',
                  minHeight: '44px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              >
                {isLoadingSlots && <option value="">Fetching live ground slots...</option>}
                {!isLoadingSlots && daySlots.length === 0 && <option value="">No slots configured</option>}
                {!isLoadingSlots &&
                  daySlots.map((s) => (
                    <option key={s.id} value={s.id} disabled={s.status !== 'available'}>
                      {s.startTime} {s.status !== 'available' ? `(${s.status.toUpperCase()})` : `(₹${s.rate})`}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', marginBottom: '0.3rem', fontWeight: 600 }}>
              Notes / Cash Memo
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid in cash at counter"
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#FAF8F3',
                border: '1px solid #E8E2D5',
                borderRadius: '8px',
                color: '#191919',
                fontFamily: 'inherit',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="btn btn-secondary"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E2D5', color: '#191919', minHeight: '44px' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isLoadingSlots}
            className="btn btn-primary"
            style={{
              backgroundColor: '#C9A227',
              color: '#191919',
              fontWeight: 700,
              minHeight: '44px',
              opacity: isSubmitting || isLoadingSlots ? 0.7 : 1,
            }}
          >
            {isSubmitting ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <Loader2 size={16} className="animate-spin" />
                <span>Reserving...</span>
              </span>
            ) : (
              <span>Confirm & Reserve Slot</span>
            )}
          </button>
        </div>
      </form>
    </dialog>
  );
};
