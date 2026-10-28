import React, { useState } from 'react';
import type { Sport } from '../../types';
import { initialGrounds } from '../../config/turfConfig';
import { 
  Trophy, 
  PlusCircle, 
  Edit3, 
  X, 
  MapPin, 
  CheckCircle2, 
  XCircle,
  Users
} from 'lucide-react';

interface AdminSportsProps {
  sports: Sport[];
  onToggleSportActive: (sportId: string) => void;
  onSaveSport: (sport: Sport) => void;
}

export const AdminSports: React.FC<AdminSportsProps> = ({
  sports,
  onToggleSportActive,
  onSaveSport,
}) => {
  const [editingSport, setEditingSport] = useState<Sport | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);

  const handleOpenAdd = () => {
    setIsAddMode(true);
    setEditingSport({
      id: `sport-${Date.now()}`,
      name: '',
      slug: '',
      shortDescription: '',
      format: '5v5 or Cage',
      coverImage: '/images/hero_turf_night.jpg',
      startingHourlyRate: 900,
      minDurationMinutes: 60,
      maxPlayers: 16,
      supportedGroundIds: ['ground-alpha'],
      features: ['Tournament Pitch', 'Match Ball Kit', 'Floodlit Arena'],
      isActive: true,
    });
  };

  const handleOpenEdit = (sport: Sport) => {
    setIsAddMode(false);
    setEditingSport({ ...sport });
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSport) return;
    onSaveSport(editingSport);
    setEditingSport(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: '#191919', fontFamily: 'var(--font-heading)', fontWeight: 800 }}>
            Sports & Activity Management
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#666666' }}>
            Configure active games, hourly base prices, player capacities, and ground assignments.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn btn-primary btn-sm"
          style={{ backgroundColor: '#C9A227', color: '#191919', fontWeight: 700 }}
        >
          <PlusCircle size={15} />
          <span>+ Add New Sport</span>
        </button>
      </div>

      {/* Sports Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
          gap: '1.25rem',
        }}
      >
        {sports.map((sport) => {
          const compatibleGroundNames = initialGrounds
            .filter((g) => sport.supportedGroundIds.includes(g.id))
            .map((g) => g.name);

          return (
            <div
              key={sport.id}
              className="card-turf"
              style={{
                padding: '1.5rem',
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: sport.isActive ? '1px solid #E8E2D5' : '1px solid rgba(217, 67, 67, 0.3)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
                opacity: sport.isActive ? 1 : 0.7,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                {/* Image & Active Badge */}
                <div style={{ position: 'relative', height: '140px', borderRadius: '12px', overflow: 'hidden', marginBottom: '1rem' }}>
                  <img
                    src={sport.coverImage}
                    alt={sport.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '0.75rem',
                      right: '0.75rem',
                      zIndex: 2,
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '9999px',
                        backgroundColor: sport.isActive ? '#C9A227' : 'rgba(217, 67, 67, 0.15)',
                        color: sport.isActive ? '#191919' : '#D94343',
                      }}
                    >
                      {sport.isActive ? 'Active on Public Site' : 'Disabled'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <h3 style={{ fontSize: '1.25rem', color: '#191919', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
                    {sport.name}
                  </h3>
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, color: '#C9A227' }}>
                    ₹{sport.startingHourlyRate}/hr
                  </span>
                </div>

                <p style={{ fontSize: '0.85rem', color: '#666666', lineHeight: 1.5, marginBottom: '1rem' }}>
                  {sport.shortDescription}
                </p>

                {/* Specs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.8rem', color: '#191919', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Trophy size={14} style={{ color: '#C9A227' }} />
                    <span>Format: {sport.format}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Users size={14} style={{ color: '#C9A227' }} />
                    <span>Capacity: Up to {sport.maxPlayers} players</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <MapPin size={14} style={{ color: '#C9A227' }} />
                    <span>Assigned: {compatibleGroundNames.join(', ')}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ paddingTop: '1rem', borderTop: '1px solid #E8E2D5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  onClick={() => onToggleSportActive(sport.id)}
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: sport.isActive ? '#B7791F' : '#218653',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  {sport.isActive ? <XCircle size={15} /> : <CheckCircle2 size={15} />}
                  <span>{sport.isActive ? 'Disable Sport' : 'Enable Sport'}</span>
                </button>

                <button
                  onClick={() => handleOpenEdit(sport)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', backgroundColor: '#FFFFFF', border: '1px solid #E8E2D5', color: '#191919' }}
                >
                  <Edit3 size={13} />
                  <span>Edit Details</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit / Add Sport Modal Dialog */}
      {editingSport && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Edit Sport Modal"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(25, 25, 25, 0.6)',
            backdropFilter: 'blur(6px)',
            padding: '1rem',
          }}
        >
          <form
            onSubmit={handleSaveSubmit}
            style={{
              width: '100%',
              maxWidth: 'min(560px, 94vw)',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E8E2D5',
              borderRadius: '16px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)',
              padding: 'clamp(1rem, 3.5vw, 1.75rem)',
              maxHeight: '90dvh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid #E8E2D5', paddingBottom: '0.85rem', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Trophy size={18} style={{ color: '#C9A227', flexShrink: 0 }} />
                <h3 style={{ fontSize: 'clamp(1.1rem, 0.95rem + 0.6vw, 1.25rem)', color: '#191919', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
                  {isAddMode ? 'Add New Sport' : `Edit Sport: ${editingSport.name}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingSport(null)}
                aria-label="Close dialog"
                style={{
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#666666',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', marginBottom: '0.3rem', fontWeight: 600 }}>
                  Sport Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingSport.name}
                  onChange={(e) => setEditingSport({ ...editingSport, name: e.target.value })}
                  placeholder="e.g. Badminton, Pickleball, Tennis"
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: '#FAF8F3', border: '1px solid #E8E2D5', borderRadius: '8px', color: '#191919', fontSize: '16px', minHeight: '44px', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', marginBottom: '0.3rem', fontWeight: 600 }}>
                  Format / Playing Spec
                </label>
                <input
                  type="text"
                  required
                  value={editingSport.format}
                  onChange={(e) => setEditingSport({ ...editingSport, format: e.target.value })}
                  placeholder="e.g. 5v5 Turf Cage or Singles/Doubles"
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: '#FAF8F3', border: '1px solid #E8E2D5', borderRadius: '8px', color: '#191919', fontSize: '16px', minHeight: '44px', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', marginBottom: '0.3rem', fontWeight: 600 }}>
                  Short Description
                </label>
                <textarea
                  rows={2}
                  required
                  value={editingSport.shortDescription}
                  onChange={(e) => setEditingSport({ ...editingSport, shortDescription: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: '#FAF8F3', border: '1px solid #E8E2D5', borderRadius: '8px', color: '#191919', fontSize: '16px', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 130px), 1fr))', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', marginBottom: '0.3rem', fontWeight: 600 }}>
                    Base Hourly Rate (₹) *
                  </label>
                  <input
                    type="number"
                    min={100}
                    step={50}
                    required
                    value={editingSport.startingHourlyRate}
                    onChange={(e) => setEditingSport({ ...editingSport, startingHourlyRate: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.75rem', backgroundColor: '#FAF8F3', border: '1px solid #E8E2D5', borderRadius: '8px', color: '#191919', fontSize: '16px', minHeight: '44px', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', marginBottom: '0.3rem', fontWeight: 600 }}>
                    Capacity
                  </label>
                  <input
                    type="number"
                    min={2}
                    value={editingSport.maxPlayers}
                    onChange={(e) => setEditingSport({ ...editingSport, maxPlayers: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.75rem', backgroundColor: '#FAF8F3', border: '1px solid #E8E2D5', borderRadius: '8px', color: '#191919', fontSize: '16px', minHeight: '44px', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', marginBottom: '0.3rem', fontWeight: 600 }}>
                    Min Mins
                  </label>
                  <input
                    type="number"
                    min={30}
                    step={30}
                    value={editingSport.minDurationMinutes}
                    onChange={(e) => setEditingSport({ ...editingSport, minDurationMinutes: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.75rem', backgroundColor: '#FAF8F3', border: '1px solid #E8E2D5', borderRadius: '8px', color: '#191919', fontSize: '16px', minHeight: '44px', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Compatible Grounds Multi-Check */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Assign Compatible Grounds
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {initialGrounds.map((g) => {
                    const isChecked = editingSport.supportedGroundIds.includes(g.id);
                    return (
                      <label key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#191919', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditingSport({ ...editingSport, supportedGroundIds: [...editingSport.supportedGroundIds, g.id] });
                            } else {
                              setEditingSport({ ...editingSport, supportedGroundIds: editingSport.supportedGroundIds.filter((id) => id !== g.id) });
                            }
                          }}
                        />
                        <span>{g.name} ({g.dimensions})</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setEditingSport(null)}
                className="btn btn-secondary btn-sm"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E2D5', color: '#191919' }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm" style={{ backgroundColor: '#C9A227', color: '#191919', fontWeight: 700 }}>
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
