import React, { useRef, useEffect } from 'react';
import type { Sport, Ground } from '../types';
import { initialGrounds } from '../config/turfConfig';
import { 
  X, 
  ArrowRight, 
  CheckCircle2, 
  CalendarCheck
} from 'lucide-react';

interface SportDetailModalProps {
  sport: Sport | null;
  onClose: () => void;
  onProceedToBooking: (sport: Sport) => void;
}

export const SportDetailModal: React.FC<SportDetailModalProps> = ({ sport, onClose, onProceedToBooking }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (sport && !dialog.open) {
      dialog.showModal();
    } else if (!sport && dialog.open) {
      dialog.close();
    }
  }, [sport]);

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

  if (!sport) return null;

  // Find compatible grounds
  const compatibleGrounds: Ground[] = initialGrounds.filter((g) =>
    sport.supportedGroundIds.includes(g.id)
  );

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: 'any' } as any)}
      className="turf-dialog"
      aria-label={`${sport.name} Details`}
      style={{
        width: 'min(680px, 94vw)',
        maxWidth: '94vw',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E8E2D5',
      }}
    >
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
        {/* Cover Photo with gradient */}
        <div style={{ position: 'relative', height: 'clamp(180px, 25vh, 230px)', overflow: 'hidden' }}>
          <img
            src={sport.coverImage}
            alt={sport.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(20,20,20,0.2) 0%, rgba(20,20,20,0.85) 95%)',
            }}
          />

          {/* Close button (min 44px accessible touch target) */}
          <button
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              position: 'absolute',
              top: '0.75rem',
              right: '0.75rem',
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(8px)',
              border: '1px solid #E8E2D5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#191919',
              zIndex: 3,
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>

          {/* Title on cover */}
          <div style={{ position: 'absolute', bottom: '1rem', left: 'clamp(1rem, 3.5vw, 1.75rem)', right: 'clamp(1rem, 3.5vw, 1.75rem)', zIndex: 2 }}>
            <span className="badge-gold" style={{ marginBottom: '0.4rem' }}>
              {sport.format}
            </span>
            <h2 style={{ fontSize: 'clamp(1.35rem, 1rem + 1.5vw, 1.75rem)', color: '#FFFFFF', fontWeight: 700 }}>
              {sport.name}
            </h2>
          </div>
        </div>

        {/* Modal Body in Clean White */}
        <div style={{ padding: 'clamp(1rem, 3.5vw, 1.75rem)', backgroundColor: '#FFFFFF' }}>
          <p style={{ color: '#666666', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            {sport.shortDescription}
          </p>

          {/* Stats Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.75rem',
              backgroundColor: '#FAF8F3',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #E8E2D5',
              padding: '1rem',
              marginBottom: '1.5rem',
              textAlign: 'center',
            }}
          >
            <div>
              <span style={{ fontSize: '0.7rem', color: '#666666', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>
                Hourly Fare
              </span>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, color: '#C9A227' }}>
                ₹{sport.startingHourlyRate}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.7rem', color: '#666666', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>
                Capacity
              </span>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700, color: '#191919' }}>
                Up to {sport.maxPlayers}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.7rem', color: '#666666', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>
                Min Booking
              </span>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700, color: '#191919' }}>
                {sport.minDurationMinutes} mins
              </span>
            </div>
          </div>

          {/* Compatible Grounds */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.95rem', color: '#191919', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
              Compatible Grounds & Arenas
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {compatibleGrounds.map((ground) => (
                <div
                  key={ground.id}
                  style={{
                    padding: '0.85rem 1rem',
                    backgroundColor: '#FAF8F3',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid #E8E2D5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <strong style={{ color: '#191919', fontSize: '0.9rem', display: 'block' }}>
                      {ground.name}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: '#666666' }}>
                      {ground.dimensions} • {ground.lightingSpec}
                    </span>
                  </div>
                  <span className="badge-status-open">
                    Available
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Inclusions */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h4 style={{ fontSize: '0.95rem', color: '#191919', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
              Equipment & Match Inclusions
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '0.55rem' }}>
              {sport.features.map((feat, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', color: '#191919' }}>
                  <CheckCircle2 size={13} style={{ color: '#C9A227', flexShrink: 0 }} />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={() => {
              onClose();
              onProceedToBooking(sport);
            }}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center', backgroundColor: '#C9A227', color: '#191919' }}
          >
            <CalendarCheck size={18} />
            <span>Select & Check Slots for {sport.name}</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default SportDetailModal;
