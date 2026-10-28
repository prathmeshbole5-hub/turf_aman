import React, { useState, useEffect } from 'react';
import { brandConfig } from '../config/turfConfig';
import { 
  Menu, 
  X, 
  Calendar, 
  Phone, 
  Clock, 
  ChevronRight,
  Sparkles,
  Trophy,
  ShieldCheck
} from 'lucide-react';

interface NavbarProps {
  onBookNowClick: () => void;
  onMyBookingsClick: () => void;
  onAdminClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onBookNowClick, onMyBookingsClick, onAdminClick }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: 'Home', href: '#hero' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <>


      {/* Main Sticky Luxury White Navbar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          width: '100%',
          backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.98)' : '#FFFFFF',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid #E8E2D5',
          boxShadow: isScrolled ? '0 4px 20px rgba(25, 25, 25, 0.06)' : 'none',
          transition: 'all var(--transition-normal)',
        }}
      >
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '4.5rem', gap: '0.5rem' }}>
          {/* Brand Logo & Trophy */}
          <a href="#hero" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none', minWidth: 0 }}>
            <div
              style={{
                width: '2.35rem',
                height: '2.35rem',
                borderRadius: '10px',
                backgroundColor: '#FAF8F3',
                border: '1.5px solid #C9A227',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 10px rgba(201, 162, 39, 0.18)',
                flexShrink: 0,
              }}
            >
              <Trophy size={18} style={{ color: '#C9A227' }} />
            </div>
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'clamp(0.95rem, 0.8rem + 0.8vw, 1.25rem)',
                  fontWeight: 800,
                  letterSpacing: '0.03em',
                  color: '#191919',
                  display: 'block',
                  lineHeight: 1.1,
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                }}
              >
                ELITE CRICKET <span style={{ color: '#C9A227' }}>BOX</span>
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }} className="desktop-nav">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                  color: '#191919',
                  textTransform: 'uppercase',
                  transition: 'color var(--transition-fast)',
                  padding: '0.4rem 0',
                  position: 'relative',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#C9A227')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#191919')}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open mobile navigation menu"
            className="mobile-toggle"
            style={{
              display: 'none',
              minWidth: '44px',
              minHeight: '44px',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#191919',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid #E8E2D5',
              backgroundColor: '#FAF8F3',
              flexShrink: 0,
            }}
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Drawer"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
          }}
        >
          {/* Backdrop */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(25, 25, 25, 0.5)',
              backdropFilter: 'blur(8px)',
              transition: 'opacity 0.3s ease',
            }}
          />

          {/* Drawer Content */}
          <div
            style={{
              position: 'relative',
              marginLeft: 'auto',
              width: '100%',
              maxWidth: 'min(340px, 86vw)',
              height: '100%',
              backgroundColor: '#FFFFFF',
              borderLeft: '1px solid #E8E2D5',
              padding: 'clamp(1.25rem, 3.5vw, 1.75rem)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '-10px 0 35px rgba(25, 25, 25, 0.12)',
              zIndex: 101,
              overflowY: 'auto',
            }}
          >
            <div>
              {/* Header inside drawer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                  <div
                    style={{
                      width: '2.25rem',
                      height: '2.25rem',
                      borderRadius: '8px',
                      backgroundColor: '#FAF8F3',
                      border: '1.5px solid #C9A227',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Trophy size={16} style={{ color: '#C9A227' }} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1rem, 0.9rem + 0.5vw, 1.25rem)', fontWeight: 800, color: '#191919', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {brandConfig.brandName}
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
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
                    flexShrink: 0,
                    cursor: 'pointer',
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Navigation links list */}
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: '#FAF8F3',
                      border: '1px solid #E8E2D5',
                      color: '#191919',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      fontSize: '0.9375rem',
                      transition: 'all var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#C9A227';
                      e.currentTarget.style.color = '#9D7916';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#E8E2D5';
                      e.currentTarget.style.color = '#191919';
                    }}
                  >
                    <span>{link.label}</span>
                    <ChevronRight size={16} style={{ color: '#C9A227' }} />
                  </a>
                ))}
              </nav>

              {/* Action buttons inside drawer */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onBookNowClick();
                  }}
                  className="btn btn-primary"
                  style={{ width: '100%', backgroundColor: '#C9A227', color: '#191919' }}
                >
                  <Sparkles size={16} />
                  <span>Book Slot Now</span>
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onMyBookingsClick();
                  }}
                  className="btn btn-secondary"
                  style={{ width: '100%', backgroundColor: '#FFFFFF', borderColor: '#E8E2D5', color: '#191919' }}
                >
                  <Calendar size={16} style={{ color: '#C9A227' }} />
                  <span>My Bookings</span>
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onAdminClick();
                  }}
                  className="btn btn-secondary"
                  style={{ width: '100%', borderColor: '#E8E2D5', color: '#9D7916', backgroundColor: '#FFFFFF' }}
                >
                  <ShieldCheck size={16} style={{ color: '#C9A227' }} />
                  <span>Admin Portal</span>
                </button>
              </div>
            </div>

            {/* Bottom info in drawer */}
            <div
              style={{
                marginTop: '2rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid #E8E2D5',
                fontSize: '0.8125rem',
                color: '#666666',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={14} style={{ color: '#C9A227' }} />
                <span>{brandConfig.operatingHours.openTime} – {brandConfig.operatingHours.closeTime}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={14} style={{ color: '#C9A227' }} />
                <a href={`tel:${brandConfig.contact.phone}`} style={{ color: '#9D7916', fontWeight: 600 }}>
                  {brandConfig.contact.phone}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Media query styling for responsive toggle */}
      <style>{`
        @media (max-width: 960px) {
          .desktop-nav, .desktop-actions {
            display: none !important;
          }
          .mobile-toggle {
            display: inline-flex !important;
          }
        }
      `}</style>
    </>
  );
};

export default Navbar;
