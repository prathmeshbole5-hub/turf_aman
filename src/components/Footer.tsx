import React from 'react';
import { brandConfig } from '../config/turfConfig';
import { 
  Trophy, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  MessageSquare,
  Camera
} from 'lucide-react';

interface FooterProps {
  onAdminClick?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onAdminClick }) => {
  return (
    <footer id="contact" style={{ backgroundColor: '#FAF8F3', borderTop: '1px solid #E8E2D5', paddingTop: 'clamp(3rem, 5vw, 4.5rem)', paddingBottom: '2.5rem' }}>
      <div className="container">
        {/* Main Footer Content Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
            gap: 'clamp(1.75rem, 3vw, 3rem)',
            paddingBottom: 'clamp(2rem, 3vw, 3.5rem)',
            borderBottom: '1px solid #E8E2D5',
          }}
        >
          {/* Brand Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '10px',
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid #C9A227',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(201, 162, 39, 0.15)',
                  flexShrink: 0,
                }}
              >
                <Trophy size={18} style={{ color: '#C9A227' }} />
              </div>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.2rem, 1rem + 0.6vw, 1.45rem)', fontWeight: 800, color: '#191919', letterSpacing: '0.02em' }}>
                {brandConfig.brandName}
              </span>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#666666', lineHeight: 1.6, marginBottom: '1.75rem' }}>
              Premier Elite Cricket Box arena engineered for cricket enthusiasts. Play anytime under certified floodlights.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <a
                href={brandConfig.location.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', padding: '0.45rem 0.85rem', backgroundColor: '#FFFFFF', borderColor: '#E8E2D5', color: '#191919' }}
              >
                <MapPin size={13} style={{ color: '#C9A227' }} />
                <span>Google Maps</span>
              </a>

              <a
                href={`https://wa.me/${brandConfig.contact.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', padding: '0.45rem 0.85rem', backgroundColor: '#FFFFFF', borderColor: '#E8E2D5', color: '#191919' }}
              >
                <MessageSquare size={13} style={{ color: '#C9A227' }} />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Location & Arena */}
          <div>
            <h4 style={{ fontSize: '1.05rem', color: '#191919', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
              Facility Location
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.875rem', color: '#666666' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                <MapPin size={17} style={{ color: '#C9A227', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ color: '#191919', display: 'block' }}>{brandConfig.location.venueName}</strong>
                  <a
                    href={brandConfig.location.googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#9D7916', textDecoration: 'none', fontWeight: 600, wordBreak: 'break-all' }}
                  >
                    Coordinates: {brandConfig.location.address}
                  </a>
                  <span style={{ display: 'block', color: '#666666' }}>{brandConfig.location.area}, {brandConfig.location.city}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                <Clock size={17} style={{ color: '#C9A227', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ color: '#191919', display: 'block' }}>Operating Hours</strong>
                  <span>{brandConfig.operatingHours.daysText}</span><br />
                  <span>{brandConfig.operatingHours.openTime} to {brandConfig.operatingHours.closeTime}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Contact & Bookings */}
          <div>
            <h4 style={{ fontSize: '1.05rem', color: '#191919', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
              Customer Support
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.875rem', color: '#666666' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Phone size={16} style={{ color: '#C9A227' }} />
                <a href={`tel:${brandConfig.contact.phone}`} style={{ color: '#191919', fontWeight: 600 }}>
                  {brandConfig.contact.phone}
                </a>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Mail size={16} style={{ color: '#C9A227' }} />
                <a href={`mailto:${brandConfig.contact.email}`} style={{ color: '#191919' }}>
                  {brandConfig.contact.email}
                </a>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Camera size={16} style={{ color: '#C9A227' }} />
                <span>{brandConfig.contact.instagram}</span>
              </div>

              <div style={{ marginTop: '0.5rem', padding: '0.85rem 1rem', backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid #E8E2D5', boxShadow: 'var(--shadow-subtle)' }}>
                <span style={{ fontSize: '0.75rem', color: '#218653', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>
                  ✓ Instant Online Confirmation
                </span>
                <span style={{ fontSize: '0.75rem', color: '#666666' }}>
                  Slots reserved in real time upon booking.
                </span>
              </div>
            </div>
          </div>

          {/* Navigation & Policies */}
          <div>
            <h4 style={{ fontSize: '1.05rem', color: '#191919', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
              Policies & Ground Rules
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem', color: '#666666' }}>
              <li>
                <span style={{ color: '#191919', fontWeight: 600 }}>• Shoes:</span> Flat turf shoes or runners only
              </li>
              <li>
                <span style={{ color: '#191919', fontWeight: 600 }}>• Time limit:</span> Vacate ground on slot completion
              </li>
              <li>
                <span style={{ color: '#191919', fontWeight: 600 }}>• Cancellation:</span> {brandConfig.policy.cancellationWindowHours}h prior notice for full refund
              </li>
              <li>
                <span style={{ color: '#191919', fontWeight: 600 }}>• Booking advance:</span> {brandConfig.policy.advanceDepositPercentage}% deposit or full prepay
              </li>
              <li>
                <span style={{ color: '#191919', fontWeight: 600 }}>• Zero tolerance:</span> No smoking or alcohol inside arena
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright & Sub-footer */}
        <div
          style={{
            paddingTop: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.8125rem',
            color: '#8A857A',
          }}
        >
          <div>
            © {new Date().getFullYear()} {brandConfig.brandName} Elite Cricket Box. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <span style={{ cursor: 'pointer' }}>Privacy Policy</span>
            <span style={{ cursor: 'pointer' }}>Terms of Service</span>
            {onAdminClick && (
              <button
                onClick={onAdminClick}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9D7916',
                  cursor: 'pointer',
                  fontSize: 'inherit',
                  fontFamily: 'inherit',
                  padding: 0,
                  textDecoration: 'underline',
                }}
              >
                Admin Portal
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
