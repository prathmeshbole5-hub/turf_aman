import React, { useState } from 'react';
import { initialPricingRates, initialAddOns } from '../config/turfConfig';
import { 
  Zap, 
  Sun, 
  Moon, 
  Sparkles, 
  Check, 
  Info,
  CalendarCheck
} from 'lucide-react';

interface PricingSectionProps {
  onBookSportClick: (sportName: string) => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onBookSportClick }) => {
  const [timeTier, setTimeTier] = useState<'offPeak' | 'peak' | 'weekend'>('peak');

  return (
    <section id="pricing" className="section-wrapper" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-eyebrow">
            <Zap size={14} style={{ color: '#C9A227' }} />
            <span>TRANSPARENT SLOTS</span>
          </div>
          <h2 className="section-title">FAIR & FLEXIBLE PRICING</h2>
          <p className="section-subtitle">
            No hidden fees or unexpected surge rates. Pick your sport, choose off-peak or evening floodlight slots, and add equipment on demand.
          </p>
        </div>

        {/* Time-Tier Selector Tabs */}
        <div
          style={{
            maxWidth: '560px',
            margin: '0 auto 3rem auto',
            backgroundColor: '#FAF8F3',
            padding: '0.4rem',
            borderRadius: 'var(--radius-full)',
            border: '1px solid #E8E2D5',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.35rem',
            boxShadow: 'var(--shadow-subtle)',
          }}
        >
          <button
            onClick={() => setTimeTier('offPeak')}
            style={{
              padding: '0.75rem 0.5rem',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              backgroundColor: timeTier === 'offPeak' ? '#C9A227' : 'transparent',
              color: timeTier === 'offPeak' ? '#191919' : '#666666',
              fontFamily: 'var(--font-heading)',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              transition: 'all var(--transition-fast)',
              cursor: 'pointer',
              boxShadow: timeTier === 'offPeak' ? '0 2px 8px rgba(201, 162, 39, 0.25)' : 'none',
            }}
          >
            <Sun size={15} />
            <span>Off-Peak (6AM–4PM)</span>
          </button>

          <button
            onClick={() => setTimeTier('peak')}
            style={{
              padding: '0.75rem 0.5rem',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              backgroundColor: timeTier === 'peak' ? '#C9A227' : 'transparent',
              color: timeTier === 'peak' ? '#191919' : '#666666',
              fontFamily: 'var(--font-heading)',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              transition: 'all var(--transition-fast)',
              cursor: 'pointer',
              boxShadow: timeTier === 'peak' ? '0 2px 8px rgba(201, 162, 39, 0.25)' : 'none',
            }}
          >
            <Moon size={15} />
            <span>Peak (4PM–12AM)</span>
          </button>

          <button
            onClick={() => setTimeTier('weekend')}
            style={{
              padding: '0.75rem 0.5rem',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              backgroundColor: timeTier === 'weekend' ? '#C9A227' : 'transparent',
              color: timeTier === 'weekend' ? '#191919' : '#666666',
              fontFamily: 'var(--font-heading)',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              transition: 'all var(--transition-fast)',
              cursor: 'pointer',
              boxShadow: timeTier === 'weekend' ? '0 2px 8px rgba(201, 162, 39, 0.25)' : 'none',
            }}
          >
            <Sparkles size={15} />
            <span>Weekend Prime</span>
          </button>
        </div>

        {/* Pricing Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: '1.5rem',
            marginBottom: '4rem',
          }}
        >
          {initialPricingRates.map((rate) => {
            const currentPrice =
              timeTier === 'offPeak'
                ? rate.offPeakRate
                : timeTier === 'peak'
                ? rate.peakRate
                : rate.weekendRate;

            const isPrime = rate.sportName.includes('Football') || rate.sportName.includes('Box Cricket');

            return (
              <div
                key={rate.sportId}
                className="card-turf"
                style={{
                  padding: '2.25rem 1.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: 'var(--radius-xl)',
                  border: isPrime ? '1.5px solid #C9A227' : '1px solid #E8E2D5',
                  backgroundColor: isPrime ? '#FCFBF7' : '#FFFFFF',
                  boxShadow: isPrime ? '0 10px 30px rgba(201, 162, 39, 0.12)' : 'var(--shadow-card)',
                  transition: 'all var(--transition-normal)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#C9A227';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = isPrime ? '#C9A227' : '#E8E2D5';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = isPrime ? '0 10px 30px rgba(201, 162, 39, 0.12)' : 'var(--shadow-card)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '1.3rem', color: '#191919', fontWeight: 700 }}>
                      {rate.sportName}
                    </h3>
                    {isPrime && <span className="badge-gold">Most Booked</span>}
                  </div>

                  <p style={{ fontSize: '0.85rem', color: '#666666', marginBottom: '1.5rem' }}>
                    Standard full ground access with match nets and line markings.
                  </p>

                  {/* Big Price Display */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '1.2rem', color: '#C9A227', fontWeight: 700 }}>₹</span>
                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: '2.6rem', fontWeight: 800, color: '#C9A227', lineHeight: 1 }}>
                      {currentPrice}
                    </span>
                    <span style={{ fontSize: '0.875rem', color: '#666666' }}>/ hour</span>
                  </div>

                  {/* Inclusions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', borderTop: '1px solid #E8E2D5', paddingTop: '1.25rem', marginBottom: '1.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#191919' }}>
                      <Check size={14} style={{ color: '#C9A227' }} />
                      <span>Floodlight illumination included</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#191919' }}>
                      <Check size={14} style={{ color: '#C9A227' }} />
                      <span>Locker & changing room access</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#191919' }}>
                      <Check size={14} style={{ color: '#C9A227' }} />
                      <span>Chilled RO drinking water</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#191919' }}>
                      <Check size={14} style={{ color: '#C9A227' }} />
                      <span>Full booking duration guaranteed</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onBookSportClick(rate.sportName)}
                  className={`btn ${isPrime ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ width: '100%' }}
                >
                  <CalendarCheck size={16} />
                  <span>Book This Sport</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Optional Add-Ons & Equipment Rental */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.45rem', color: '#191919', marginBottom: '0.25rem', fontWeight: 700 }}>
                Optional Equipment & Match Add-Ons
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#666666' }}>
                Equip your squad with pro kits, referees, and highlight video recording.
              </p>
            </div>
            <span className="badge-outline">
              <Info size={13} style={{ color: '#C9A227' }} /> Selectable during checkout
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem',
            }}
          >
            {initialAddOns.map((addon) => (
              <div
                key={addon.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E8E2D5',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-subtle)',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#C9A227';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E8E2D5';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <h4 style={{ fontSize: '0.95rem', color: '#191919', fontWeight: 600 }}>
                      {addon.name}
                    </h4>
                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 700, color: '#C9A227' }}>
                      ₹{addon.price}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#666666', lineHeight: 1.4 }}>
                    {addon.description}
                  </p>
                </div>
                <div style={{ marginTop: '0.85rem', fontSize: '0.75rem', color: '#8A857A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {addon.priceType.replace('_', ' ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
