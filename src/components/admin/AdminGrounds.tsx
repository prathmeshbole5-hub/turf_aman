import React, { useState } from 'react';
import type { Ground, Sport } from '../../types';
import { 
  MapPin, 
  Edit3, 
  Sparkles, 
  ShieldCheck, 
  Users, 
  X 
} from 'lucide-react';

interface AdminGroundsProps {
  grounds: Ground[];
  sports: Sport[];
  onUpdateGround: (ground: Ground) => void;
}

export const AdminGrounds: React.FC<AdminGroundsProps> = ({
  grounds,
  onUpdateGround,
}) => {
  const [editingGround, setEditingGround] = useState<Ground | null>(null);

  const handleToggleAvailable = (ground: Ground) => {
    onUpdateGround({ ...ground, isAvailable: !ground.isAvailable });
  };

  const handleSaveGround = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGround) return;
    onUpdateGround(editingGround);
    setEditingGround(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: '#191919', fontWeight: 700 }}>
            Grounds & Playing Arenas
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#666666' }}>
            Manage physical turf facilities, shockpad specifications, dimensions, and base rates.
          </p>
        </div>
      </div>

      {/* Grounds Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: '1.25rem',
        }}
      >
        {grounds.map((ground) => {
          return (
            <div
              key={ground.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 'var(--radius-lg)',
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: ground.isAvailable ? '1px solid #E8E2D5' : '1px solid rgba(217, 67, 67, 0.4)',
                opacity: ground.isAvailable ? 1 : 0.85,
                boxShadow: 'var(--shadow-subtle)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.25rem', color: '#191919', fontWeight: 700 }}>
                    {ground.name}
                  </h3>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '0.2rem 0.6rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: ground.isAvailable ? 'rgba(33, 134, 83, 0.1)' : 'rgba(217, 67, 67, 0.1)',
                      color: ground.isAvailable ? '#218653' : '#D94343',
                      border: ground.isAvailable ? '1px solid rgba(33, 134, 83, 0.3)' : '1px solid rgba(217, 67, 67, 0.3)',
                    }}
                  >
                    {ground.isAvailable ? 'Operational' : 'Closed / Maintenance'}
                  </span>
                </div>

                <p style={{ fontSize: '0.85rem', color: '#666666', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                  {ground.description}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: '#191919', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={15} style={{ color: '#C9A227', flexShrink: 0 }} />
                    <span><strong style={{ color: '#666666' }}>Dimensions:</strong> {ground.dimensions}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={15} style={{ color: '#C9A227', flexShrink: 0 }} />
                    <span><strong style={{ color: '#666666' }}>Surface:</strong> {ground.surfaceType}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={15} style={{ color: '#C9A227', flexShrink: 0 }} />
                    <span><strong style={{ color: '#666666' }}>Lighting:</strong> {ground.lightingSpec}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={15} style={{ color: '#C9A227', flexShrink: 0 }} />
                    <span><strong style={{ color: '#666666' }}>Capacity:</strong> Up to {ground.capacity} players</span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid #E8E2D5' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#666666', display: 'block' }}>Base Rate</span>
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, color: '#9D7916' }}>
                    ₹{ground.baseHourlyRate}/hr
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleToggleAvailable(ground)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', backgroundColor: '#FFFFFF', borderColor: '#E8E2D5', color: '#191919' }}
                  >
                    {ground.isAvailable ? 'Close Ground' : 'Open Ground'}
                  </button>

                  <button
                    onClick={() => setEditingGround({ ...ground })}
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: '0.75rem', backgroundColor: '#C9A227', color: '#191919', fontWeight: 700 }}
                  >
                    <Edit3 size={13} />
                    <span>Edit Specs</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Ground Modal */}
      {editingGround && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Edit Ground Specs"
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
            onSubmit={handleSaveGround}
            style={{
              width: '100%',
              maxWidth: 'min(560px, 94vw)',
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #E8E2D5',
              borderRadius: 'var(--radius-lg)',
              padding: 'clamp(1rem, 3.5vw, 1.75rem)',
              maxHeight: '90dvh',
              overflowY: 'auto',
              boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid #E8E2D5', paddingBottom: '0.85rem', gap: '0.5rem' }}>
              <h3 style={{ fontSize: 'clamp(1.1rem, 0.95rem + 0.6vw, 1.25rem)', color: '#191919', fontWeight: 700 }}>
                Edit Arena: {editingGround.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingGround(null)}
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
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', marginBottom: '0.3rem', fontWeight: 600 }}>
                  Ground Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingGround.name}
                  onChange={(e) => setEditingGround({ ...editingGround, name: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: '#FAF8F3', border: '1.5px solid #E8E2D5', borderRadius: 'var(--radius-sm)', color: '#191919', fontSize: '16px', minHeight: '44px', boxSizing: 'border-box', outlineColor: '#C9A227' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', marginBottom: '0.3rem', fontWeight: 600 }}>
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editingGround.description}
                  onChange={(e) => setEditingGround({ ...editingGround, description: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: '#FAF8F3', border: '1.5px solid #E8E2D5', borderRadius: 'var(--radius-sm)', color: '#191919', fontSize: '16px', boxSizing: 'border-box', outlineColor: '#C9A227', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', marginBottom: '0.3rem', fontWeight: 600 }}>
                    Dimensions
                  </label>
                  <input
                    type="text"
                    value={editingGround.dimensions}
                    onChange={(e) => setEditingGround({ ...editingGround, dimensions: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', backgroundColor: '#FAF8F3', border: '1.5px solid #E8E2D5', borderRadius: 'var(--radius-sm)', color: '#191919', fontSize: '16px', minHeight: '44px', boxSizing: 'border-box', outlineColor: '#C9A227' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', marginBottom: '0.3rem', fontWeight: 600 }}>
                    Base Hourly Rate (₹)
                  </label>
                  <input
                    type="number"
                    min={100}
                    step={50}
                    value={editingGround.baseHourlyRate}
                    onChange={(e) => setEditingGround({ ...editingGround, baseHourlyRate: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.75rem', backgroundColor: '#FAF8F3', border: '1.5px solid #E8E2D5', borderRadius: 'var(--radius-sm)', color: '#191919', fontSize: '16px', minHeight: '44px', boxSizing: 'border-box', outlineColor: '#C9A227' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', marginBottom: '0.3rem', fontWeight: 600 }}>
                    Surface Type
                  </label>
                  <input
                    type="text"
                    value={editingGround.surfaceType}
                    onChange={(e) => setEditingGround({ ...editingGround, surfaceType: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', backgroundColor: '#FAF8F3', border: '1.5px solid #E8E2D5', borderRadius: 'var(--radius-sm)', color: '#191919', fontSize: '16px', minHeight: '44px', boxSizing: 'border-box', outlineColor: '#C9A227' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', marginBottom: '0.3rem', fontWeight: 600 }}>
                    Lighting Specifications
                  </label>
                  <input
                    type="text"
                    value={editingGround.lightingSpec}
                    onChange={(e) => setEditingGround({ ...editingGround, lightingSpec: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', backgroundColor: '#FAF8F3', border: '1.5px solid #E8E2D5', borderRadius: 'var(--radius-sm)', color: '#191919', fontSize: '16px', minHeight: '44px', boxSizing: 'border-box', outlineColor: '#C9A227' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setEditingGround(null)}
                className="btn btn-secondary btn-sm"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#E8E2D5', color: '#191919', minHeight: '44px' }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm" style={{ backgroundColor: '#C9A227', color: '#191919', fontWeight: 700, minHeight: '44px' }}>
                <span>Save Ground Specs</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
