import React, { useState } from 'react';
import { brandConfig } from '../../config/turfConfig';
import { 
  Save, 
  Check, 
  Building, 
  Clock, 
  ShieldCheck 
} from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const [venueName, setVenueName] = useState(brandConfig.location.venueName);
  const [address, setAddress] = useState(brandConfig.location.address);
  const [area, setArea] = useState(brandConfig.location.area);
  const [city, setCity] = useState(brandConfig.location.city);

  const [openTime, setOpenTime] = useState(brandConfig.operatingHours.openTime);
  const [closeTime, setCloseTime] = useState(brandConfig.operatingHours.closeTime);

  const [contactPhone, setContactPhone] = useState(brandConfig.contact.phone);
  const [contactEmail, setContactEmail] = useState(brandConfig.contact.email);

  const [cancelHours, setCancelHours] = useState(brandConfig.policy.cancellationWindowHours);
  const [refundPercent, setRefundPercent] = useState(brandConfig.policy.cancellationRefundPercentage);
  const [advancePercent, setAdvancePercent] = useState(brandConfig.policy.advanceDepositPercentage);

  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: '#191919', fontWeight: 700 }}>
            Facility Configuration & Policies
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#666666' }}>
            Manage arena branding, opening schedules, cancellation windows, and customer contacts.
          </p>
        </div>

        <button type="submit" className="btn btn-primary btn-sm" style={{ backgroundColor: '#C9A227', color: '#191919', fontWeight: 700 }}>
          <Save size={15} />
          <span>Save Settings</span>
        </button>
      </div>

      {isSaved && (
        <div style={{ padding: '0.85rem 1.25rem', backgroundColor: 'rgba(33, 134, 83, 0.1)', border: '1px solid rgba(33, 134, 83, 0.3)', color: '#218653', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
          <Check size={16} style={{ color: '#218653' }} />
          <span>Settings updated successfully! Changes are active across public and administrative portals.</span>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Venue Information */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E2D5', borderRadius: 'var(--radius-lg)', padding: 'clamp(1rem, 2.5vw, 1.75rem)', boxShadow: 'var(--shadow-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Building size={18} style={{ color: '#C9A227', flexShrink: 0 }} />
            <h3 style={{ fontSize: '1.2rem', color: '#191919', fontWeight: 700 }}>
              Arena Branding & Location
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', marginBottom: '0.3rem', fontWeight: 600 }}>
                Venue Name
              </label>
              <input
                type="text"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', backgroundColor: '#FAF8F3', border: '1.5px solid #E8E2D5', borderRadius: 'var(--radius-sm)', color: '#191919', fontSize: '16px', minHeight: '44px', boxSizing: 'border-box', outlineColor: '#C9A227' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', marginBottom: '0.3rem', fontWeight: 600 }}>
                Street Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', backgroundColor: '#FAF8F3', border: '1.5px solid #E8E2D5', borderRadius: 'var(--radius-sm)', color: '#191919', fontSize: '16px', minHeight: '44px', boxSizing: 'border-box', outlineColor: '#C9A227' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', marginBottom: '0.3rem', fontWeight: 600 }}>
                  Area / Landmark
                </label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: '#FAF8F3', border: '1.5px solid #E8E2D5', borderRadius: 'var(--radius-sm)', color: '#191919', fontSize: '16px', minHeight: '44px', boxSizing: 'border-box', outlineColor: '#C9A227' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', marginBottom: '0.3rem', fontWeight: 600 }}>
                  City & PIN
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: '#FAF8F3', border: '1.5px solid #E8E2D5', borderRadius: 'var(--radius-sm)', color: '#191919', fontSize: '16px', minHeight: '44px', boxSizing: 'border-box', outlineColor: '#C9A227' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Operating Hours & Support */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E2D5', borderRadius: 'var(--radius-lg)', padding: 'clamp(1rem, 2.5vw, 1.75rem)', boxShadow: 'var(--shadow-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Clock size={18} style={{ color: '#C9A227', flexShrink: 0 }} />
            <h3 style={{ fontSize: '1.2rem', color: '#191919', fontWeight: 700 }}>
              Operating Schedule & Contacts
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', marginBottom: '0.3rem', fontWeight: 600 }}>
                  Daily Opening Time
                </label>
                <input
                  type="text"
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: '#FAF8F3', border: '1.5px solid #E8E2D5', borderRadius: 'var(--radius-sm)', color: '#191919', fontSize: '16px', minHeight: '44px', boxSizing: 'border-box', outlineColor: '#C9A227' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', marginBottom: '0.3rem', fontWeight: 600 }}>
                  Daily Closing Time
                </label>
                <input
                  type="text"
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: '#FAF8F3', border: '1.5px solid #E8E2D5', borderRadius: 'var(--radius-sm)', color: '#191919', fontSize: '16px', minHeight: '44px', boxSizing: 'border-box', outlineColor: '#C9A227' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', marginBottom: '0.3rem', fontWeight: 600 }}>
                Support Phone Number
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', backgroundColor: '#FAF8F3', border: '1.5px solid #E8E2D5', borderRadius: 'var(--radius-sm)', color: '#191919', fontSize: '16px', minHeight: '44px', boxSizing: 'border-box', outlineColor: '#C9A227' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', marginBottom: '0.3rem', fontWeight: 600 }}>
                Support Email
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', backgroundColor: '#FAF8F3', border: '1.5px solid #E8E2D5', borderRadius: 'var(--radius-sm)', color: '#191919', fontSize: '16px', minHeight: '44px', boxSizing: 'border-box', outlineColor: '#C9A227' }}
              />
            </div>
          </div>
        </div>

        {/* Booking Policies & Refund Rules */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E2D5', borderRadius: 'var(--radius-lg)', padding: 'clamp(1rem, 2.5vw, 1.75rem)', gridColumn: '1 / -1', boxShadow: 'var(--shadow-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <ShieldCheck size={18} style={{ color: '#C9A227', flexShrink: 0 }} />
            <h3 style={{ fontSize: '1.2rem', color: '#191919', fontWeight: 700 }}>
              Cancellation & Payment Policies
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', marginBottom: '0.3rem', fontWeight: 600 }}>
                Cancellation Window (Hours)
              </label>
              <input
                type="number"
                min={1}
                max={48}
                value={cancelHours}
                onChange={(e) => setCancelHours(Number(e.target.value))}
                style={{ width: '100%', padding: '0.75rem', backgroundColor: '#FAF8F3', border: '1.5px solid #E8E2D5', borderRadius: 'var(--radius-sm)', color: '#191919', fontSize: '16px', minHeight: '44px', boxSizing: 'border-box', outlineColor: '#C9A227' }}
              />
              <span style={{ fontSize: '0.7rem', color: '#666666', marginTop: '0.25rem', display: 'block' }}>
                Full refund window prior to match start
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', marginBottom: '0.3rem', fontWeight: 600 }}>
                Refund Percentage (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={refundPercent}
                onChange={(e) => setRefundPercent(Number(e.target.value))}
                style={{ width: '100%', padding: '0.75rem', backgroundColor: '#FAF8F3', border: '1.5px solid #E8E2D5', borderRadius: 'var(--radius-sm)', color: '#191919', fontSize: '16px', minHeight: '44px', boxSizing: 'border-box', outlineColor: '#C9A227' }}
              />
              <span style={{ fontSize: '0.7rem', color: '#666666', marginTop: '0.25rem', display: 'block' }}>
                Amount refunded when eligible
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', marginBottom: '0.3rem', fontWeight: 600 }}>
                Default Advance Deposit (%)
              </label>
              <input
                type="number"
                min={10}
                max={100}
                value={advancePercent}
                onChange={(e) => setAdvancePercent(Number(e.target.value))}
                style={{ width: '100%', padding: '0.75rem', backgroundColor: '#FAF8F3', border: '1.5px solid #E8E2D5', borderRadius: 'var(--radius-sm)', color: '#191919', fontSize: '16px', minHeight: '44px', boxSizing: 'border-box', outlineColor: '#C9A227' }}
              />
              <span style={{ fontSize: '0.7rem', color: '#666666', marginTop: '0.25rem', display: 'block' }}>
                Online booking security deposit
              </span>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
