import React from 'react';
import { initialFacilities } from '../config/turfConfig';
import { 
  Sparkles, 
  Sun, 
  ShieldCheck, 
  Trophy, 
  Armchair, 
  Car, 
  Package, 
  HeartPulse, 
  Check
} from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles size={22} style={{ color: '#C9A227' }} />,
  Sun: <Sun size={22} style={{ color: '#C9A227' }} />,
  ShieldCheck: <ShieldCheck size={22} style={{ color: '#C9A227' }} />,
  Trophy: <Trophy size={22} style={{ color: '#C9A227' }} />,
  Armchair: <Armchair size={22} style={{ color: '#C9A227' }} />,
  Car: <Car size={22} style={{ color: '#C9A227' }} />,
  Package: <Package size={22} style={{ color: '#C9A227' }} />,
  HeartPulse: <HeartPulse size={22} style={{ color: '#C9A227' }} />,
};

export const FacilitiesSection: React.FC = () => {
  return (
    <section id="facilities" className="section-wrapper" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-eyebrow">
            <Trophy size={14} style={{ color: '#C9A227' }} />
            <span>INFRASTRUCTURE & SPECS</span>
          </div>
          <h2 className="section-title">BUILT FOR THE GAME</h2>
          <p className="section-subtitle">
            Every square foot is engineered for athletes. From 50mm mono-filament turf with rubber infill to calibrated 800-lux stadium illumination, we ensure uninterrupted peak performance.
          </p>
        </div>

        {/* Feature Split Showcase Banner */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.75rem',
            marginBottom: '3rem',
          }}
        >
          {/* Turf Surface Showcase */}
          <div
            className="card-turf"
            style={{
              position: 'relative',
              minHeight: '340px',
              padding: '2.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              overflow: 'hidden',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid #E8E2D5',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: "url('/images/facility_grass_lights.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transition: 'transform 0.6s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(20,20,20,0.2) 0%, rgba(20,20,20,0.85) 75%)',
              }}
            />
            <div style={{ position: 'relative', zIndex: 2 }}>
              <span className="badge-gold" style={{ marginBottom: '0.75rem' }}>
                FIFA PRO STANDARD
              </span>
              <h3 style={{ fontSize: '1.65rem', marginBottom: '0.5rem', color: '#FFFFFF', fontWeight: 700 }}>
                Shock-Absorbent Synthetic Turf
              </h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9375rem', lineHeight: 1.5, maxWidth: '440px' }}>
                Engineered with high-density monofilament fibers and calibrated rubber granule infill to eliminate harsh friction and absorb knee impacts.
              </p>
            </div>
          </div>

          {/* Lounge Showcase */}
          <div
            className="card-turf"
            style={{
              position: 'relative',
              minHeight: '340px',
              padding: '2.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              overflow: 'hidden',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid #E8E2D5',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: "url('/images/facility_lounge.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transition: 'transform 0.6s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(20,20,20,0.2) 0%, rgba(20,20,20,0.85) 75%)',
              }}
            />
            <div style={{ position: 'relative', zIndex: 2 }}>
              <span className="badge-gold" style={{ marginBottom: '0.75rem' }}>
                PREMIUM CLUBHOUSE
              </span>
              <h3 style={{ fontSize: '1.65rem', marginBottom: '0.5rem', color: '#FFFFFF', fontWeight: 700 }}>
                Locker Rooms & Player Dugout
              </h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9375rem', lineHeight: 1.5, maxWidth: '440px' }}>
                Full climate-controlled clubhouse featuring showers, individual lockers, chilled electrolyte hydration, and spectator viewing lounges.
              </p>
            </div>
          </div>
        </div>

        {/* Facilities Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {initialFacilities.map((fac) => (
            <div
              key={fac.id}
              className="card-turf"
              style={{
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E8E2D5',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-card)',
                transition: 'all var(--transition-normal)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#C9A227';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E8E2D5';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-card)';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div
                    style={{
                      width: '3rem',
                      height: '3rem',
                      borderRadius: '12px',
                      backgroundColor: '#FAF8F3',
                      border: '1px solid #E8E2D5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(201, 162, 39, 0.08)',
                    }}
                  >
                    {iconMap[fac.iconName] || <Sparkles size={22} style={{ color: '#C9A227' }} />}
                  </div>

                  {fac.badge && (
                    <span className="badge-outline">
                      {fac.badge}
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem', color: '#191919', fontWeight: 700 }}>
                  {fac.title}
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#9D7916', fontWeight: 700, display: 'block', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {fac.subtitle}
                </span>

                <p style={{ fontSize: '0.875rem', color: '#666666', lineHeight: 1.55, marginBottom: '1.25rem' }}>
                  {fac.description}
                </p>
              </div>

              {/* Bullet Specs */}
              {fac.specs && (
                <div style={{ borderTop: '1px solid #E8E2D5', paddingTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {fac.specs.map((spec, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', color: '#191919' }}>
                      <Check size={13} style={{ color: '#C9A227' }} />
                      <span>{spec}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FacilitiesSection;
