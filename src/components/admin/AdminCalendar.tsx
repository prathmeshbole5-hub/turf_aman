import React, { useState, useMemo } from 'react';
import type { ConfirmedBooking } from '../../types';
import { initialGrounds, initialSports } from '../../config/turfConfig';
import { generateDaySlots } from '../../services/slotService';
import { 
  getStoredBlockedSlots, 
  addBlockedSlot, 
  removeBlockedSlot,
  type BlockedSlotRecord 
} from '../../services/storageService';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  ShieldAlert, 
  PlusCircle, 
  Trash2,
  XCircle
} from 'lucide-react';

interface AdminCalendarProps {
  bookings: ConfirmedBooking[];
  onOpenManualBooking: () => void;
  onSelectBooking: (booking: ConfirmedBooking) => void;
}

export const AdminCalendar: React.FC<AdminCalendarProps> = ({
  bookings,
  onOpenManualBooking,
  onSelectBooking,
}) => {
  const [selectedGroundId, setSelectedGroundId] = useState<string>(initialGrounds[0].id);
  const selectedGround = useMemo(() => {
    return initialGrounds.find((g) => g.id === selectedGroundId) || initialGrounds[0];
  }, [selectedGroundId]);

  const [dateOffset, setDateOffset] = useState<number>(0);
  const currentDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dateOffset);
    return d;
  }, [dateOffset]);

  const dateStr = currentDate.toISOString().split('T')[0];

  // Blocked maintenance slots from storage
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlotRecord[]>(getStoredBlockedSlots());
  const [newBlockReason, setNewBlockReason] = useState('Turf Surface Conditioning');
  const [blockStartHour, setBlockStartHour] = useState(14);
  const [blockEndHour, setBlockEndHour] = useState(15);
  const [isBlockingModalOpen, setIsBlockingModalOpen] = useState(false);

  // Generate day slots for selected ground
  const daySlots = useMemo(() => {
    return generateDaySlots(dateStr, initialSports[0], selectedGround);
  }, [dateStr, selectedGround]);

  // Handle adding maintenance block
  const handleAddMaintenanceBlock = (e: React.FormEvent) => {
    e.preventDefault();
    const newBlock: BlockedSlotRecord = {
      id: `block-${Date.now()}`,
      groundId: selectedGround.id,
      date: dateStr,
      startHour: blockStartHour,
      endHour: blockEndHour,
      reason: newBlockReason,
    };
    addBlockedSlot(newBlock);
    setBlockedSlots(getStoredBlockedSlots());
    setIsBlockingModalOpen(false);
  };

  const handleRemoveBlock = (blockId: string) => {
    removeBlockedSlot(blockId);
    setBlockedSlots(getStoredBlockedSlots());
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Controls Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: '#191919', fontWeight: 700 }}>
            Schedule & Slot Engine
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#666666' }}>
            Inspect ground utilization, add maintenance periods, and manage reservations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setIsBlockingModalOpen(true)}
            className="btn btn-secondary btn-sm"
            style={{ backgroundColor: '#FFFFFF', borderColor: '#E8E2D5', color: '#191919' }}
          >
            <ShieldAlert size={15} style={{ color: '#B7791F' }} />
            <span>+ Block Maintenance</span>
          </button>

          <button
            onClick={onOpenManualBooking}
            className="btn btn-primary btn-sm"
            style={{ backgroundColor: '#C9A227', color: '#191919', fontWeight: 700 }}
          >
            <PlusCircle size={15} />
            <span>+ Add Walk-In</span>
          </button>
        </div>
      </div>

      {/* Date Navigation & Ground Switcher Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: '#FFFFFF',
          padding: '1rem 1.5rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid #E8E2D5',
          boxShadow: 'var(--shadow-subtle)',
        }}
      >
        {/* Grounds Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {initialGrounds.map((ground) => {
            const isSelected = ground.id === selectedGroundId;
            return (
              <button
                key={ground.id}
                onClick={() => setSelectedGroundId(ground.id)}
                style={{
                  padding: '0.55rem 1rem',
                  borderRadius: 'var(--radius-full)',
                  border: isSelected ? '1.5px solid #9D7916' : '1px solid #E8E2D5',
                  backgroundColor: isSelected ? '#C9A227' : '#FAF8F3',
                  color: isSelected ? '#191919' : '#191919',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  boxShadow: isSelected ? '0 2px 8px rgba(201, 162, 39, 0.2)' : 'none',
                }}
              >
                {ground.name}
              </button>
            );
          })}
        </div>

        {/* Date Selector Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <button
            onClick={() => setDateOffset(dateOffset - 1)}
            style={{
              padding: '0.5rem',
              backgroundColor: '#FAF8F3',
              border: '1px solid #E8E2D5',
              borderRadius: 'var(--radius-sm)',
              color: '#191919',
              cursor: 'pointer',
            }}
          >
            <ChevronLeft size={16} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', fontWeight: 700, color: '#191919' }}>
            <CalendarIcon size={16} style={{ color: '#C9A227' }} />
            <span>
              {currentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            {dateOffset === 0 && (
              <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', backgroundColor: '#FAF8F3', color: '#9D7916', border: '1px solid #E8E2D5' }}>
                Today
              </span>
            )}
          </div>

          <button
            onClick={() => setDateOffset(dateOffset + 1)}
            style={{
              padding: '0.5rem',
              backgroundColor: '#FAF8F3',
              border: '1px solid #E8E2D5',
              borderRadius: 'var(--radius-sm)',
              color: '#191919',
              cursor: 'pointer',
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Active Maintenance Blocks for This Day */}
      {blockedSlots.filter((b) => b.groundId === selectedGroundId && b.date === dateStr).length > 0 && (
        <div
          style={{
            backgroundColor: '#FAF8F3',
            border: '1px solid #E9D9A7',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldAlert size={18} style={{ color: '#B7791F' }} />
            <div>
              <strong style={{ fontSize: '0.9rem', color: '#191919', display: 'block' }}>
                Maintenance Window Scheduled
              </strong>
              <span style={{ fontSize: '0.8rem', color: '#666666' }}>
                {blockedSlots.find((b) => b.groundId === selectedGroundId && b.date === dateStr)?.reason} (
                {blockedSlots.find((b) => b.groundId === selectedGroundId && b.date === dateStr)?.startHour}:00 to{' '}
                {blockedSlots.find((b) => b.groundId === selectedGroundId && b.date === dateStr)?.endHour}:00)
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              const blk = blockedSlots.find((b) => b.groundId === selectedGroundId && b.date === dateStr);
              if (blk) handleRemoveBlock(blk.id);
            }}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.75rem', color: '#D94343', borderColor: '#E8E2D5', backgroundColor: '#FFFFFF' }}
          >
            <Trash2 size={13} />
            <span>Remove Block</span>
          </button>
        </div>
      )}

      {/* Schedule Timeline Grid */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E8E2D5',
          borderRadius: 'var(--radius-lg)',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', color: '#191919', fontWeight: 700 }}>
              Operating Timeline: {selectedGround.name}
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#666666' }}>
              {selectedGround.dimensions} • {selectedGround.surfaceType} • Base Rate: ₹{selectedGround.baseHourlyRate}/hr
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: '#666666' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#218653' }} />
              <span>Available</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#D94343' }} />
              <span>Booked</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#B7791F' }} />
              <span>Maintenance / Held</span>
            </span>
          </div>
        </div>

        {/* Hour Slots Timeline List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {daySlots.map((slot) => {
            // Check if there is an active confirmed booking for this slot
            const matchedBooking = bookings.find((b) =>
              b.ground.id === selectedGroundId &&
              b.date === dateStr &&
              b.startTime.includes(slot.startTime.split(':')[0]) && // match starting hour
              b.bookingStatus === 'confirmed'
            );

            const isBlockedByMaint = blockedSlots.some(
              (b) => b.groundId === selectedGroundId && b.date === dateStr && slot.hour >= b.startHour && slot.hour < b.endHour
            );

            const isBooked = !!matchedBooking || slot.status === 'booked';

            return (
              <div
                key={slot.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  padding: 'clamp(0.75rem, 2vw, 1rem) clamp(0.85rem, 2.5vw, 1.25rem)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isBooked
                    ? '#FFF9F9'
                    : isBlockedByMaint
                    ? '#FAF8F3'
                    : '#FFFFFF',
                  border: isBooked
                    ? '1px solid rgba(217, 67, 67, 0.3)'
                    : isBlockedByMaint
                    ? '1px solid #E9D9A7'
                    : '1px solid #E8E2D5',
                  transition: 'all 0.15s ease',
                }}
              >
                {/* Time & Peak Indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-heading)', fontSize: '0.95rem', fontWeight: 700, color: '#191919', whiteSpace: 'nowrap' }}>
                    <Clock size={15} style={{ color: '#C9A227', flexShrink: 0 }} />
                    <span>{slot.startTime} – {slot.endTime}</span>
                  </div>

                  {slot.isPeak && (
                    <span style={{ fontSize: '0.65rem', color: '#9D7916', fontWeight: 700, textTransform: 'uppercase', backgroundColor: '#FAF8F3', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid #E9D9A7', whiteSpace: 'nowrap' }}>
                      Floodlights
                    </span>
                  )}
                </div>

                {/* Status description */}
                <div style={{ flex: '1 1 200px', padding: '0 0.5rem', minWidth: 0 }}>
                  {matchedBooking ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)', backgroundColor: '#FAF8F3', color: '#9D7916', border: '1px solid #E8E2D5' }}>
                        Pass #{matchedBooking.referenceCode}
                      </span>
                      <strong style={{ fontSize: '0.85rem', color: '#191919', wordBreak: 'break-word' }}>
                        {matchedBooking.customer.name}
                      </strong>
                      <span style={{ fontSize: '0.8rem', color: '#666666' }}>
                        ({matchedBooking.sport.name} • {matchedBooking.customer.phone})
                      </span>
                    </div>
                  ) : isBooked ? (
                    <span style={{ fontSize: '0.85rem', color: '#D94343', fontWeight: 600 }}>
                      Reserved (League / Tournament Match)
                    </span>
                  ) : isBlockedByMaint ? (
                    <span style={{ fontSize: '0.85rem', color: '#B7791F', fontWeight: 600 }}>
                      Maintenance Block (Turf Prep)
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: '#218653', fontWeight: 600 }}>
                      Available for reservation (₹{slot.rate}/hr)
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div>
                  {matchedBooking ? (
                    <button
                      onClick={() => onSelectBooking(matchedBooking)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', backgroundColor: '#FFFFFF', borderColor: '#E8E2D5', color: '#191919' }}
                    >
                      <span>View Pass</span>
                    </button>
                  ) : !isBooked && !isBlockedByMaint ? (
                    <button
                      onClick={onOpenManualBooking}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', backgroundColor: '#FAF8F3', borderColor: '#E8E2D5', color: '#9D7916', fontWeight: 700 }}
                    >
                      <span>+ Reserve</span>
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Maintenance Block Modal */}
      {isBlockingModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Add Maintenance Block"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(25, 25, 25, 0.5)',
            backdropFilter: 'blur(4px)',
            padding: '1rem',
          }}
        >
          <form
            onSubmit={handleAddMaintenanceBlock}
            style={{
              width: '100%',
              maxWidth: 'min(460px, 94vw)',
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #E8E2D5',
              borderRadius: 'var(--radius-lg)',
              padding: 'clamp(1rem, 3.5vw, 1.75rem)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid #E8E2D5', paddingBottom: '0.85rem', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={18} style={{ color: '#B7791F', flexShrink: 0 }} />
                <h3 style={{ fontSize: 'clamp(1.1rem, 0.95rem + 0.5vw, 1.2rem)', color: '#191919', fontWeight: 700 }}>
                  Block Ground Maintenance
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBlockingModalOpen(false)}
                aria-label="Close dialog"
                style={{
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#666666',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <XCircle size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', marginBottom: '0.3rem', fontWeight: 600 }}>
                  Ground
                </label>
                <input
                  type="text"
                  disabled
                  value={selectedGround.name}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: '#FAF8F3', border: '1px solid #E8E2D5', borderRadius: 'var(--radius-sm)', color: '#191919', fontSize: '16px', minHeight: '44px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', marginBottom: '0.3rem', fontWeight: 600 }}>
                  Date
                </label>
                <input
                  type="text"
                  disabled
                  value={dateStr}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: '#FAF8F3', border: '1px solid #E8E2D5', borderRadius: 'var(--radius-sm)', color: '#191919', fontSize: '16px', minHeight: '44px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 130px), 1fr))', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', marginBottom: '0.3rem', fontWeight: 600 }}>
                    Start Hour (24h)
                  </label>
                  <input
                    type="number"
                    min={6}
                    max={23}
                    value={blockStartHour}
                    onChange={(e) => setBlockStartHour(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.75rem', backgroundColor: '#FFFFFF', border: '1.5px solid #E8E2D5', borderRadius: 'var(--radius-sm)', color: '#191919', fontSize: '16px', minHeight: '44px', boxSizing: 'border-box', outlineColor: '#C9A227' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', marginBottom: '0.3rem', fontWeight: 600 }}>
                    End Hour (24h)
                  </label>
                  <input
                    type="number"
                    min={7}
                    max={24}
                    value={blockEndHour}
                    onChange={(e) => setBlockEndHour(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.75rem', backgroundColor: '#FFFFFF', border: '1.5px solid #E8E2D5', borderRadius: 'var(--radius-sm)', color: '#191919', fontSize: '16px', minHeight: '44px', boxSizing: 'border-box', outlineColor: '#C9A227' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', marginBottom: '0.3rem', fontWeight: 600 }}>
                  Reason / Description
                </label>
                <input
                  type="text"
                  required
                  value={newBlockReason}
                  onChange={(e) => setNewBlockReason(e.target.value)}
                  placeholder="e.g. Floodlight Maintenance, Turf Watering"
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: '#FFFFFF', border: '1.5px solid #E8E2D5', borderRadius: 'var(--radius-sm)', color: '#191919', fontSize: '0.85rem', outlineColor: '#C9A227' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setIsBlockingModalOpen(false)}
                className="btn btn-secondary btn-sm"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#E8E2D5', color: '#191919' }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm" style={{ backgroundColor: '#C9A227', color: '#191919', fontWeight: 700 }}>
                <span>Save Maintenance Block</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
