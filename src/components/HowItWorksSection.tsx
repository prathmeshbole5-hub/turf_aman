import React from 'react';
import { 
  Flame, 
  Calendar, 
  CreditCard, 
  ArrowRight,
  Sparkles 
} from 'lucide-react';

interface HowItWorksProps {
  onStartBooking: () => void;
}

export const HowItWorksSection: React.FC<HowItWorksProps> = ({ onStartBooking }) => {
  const steps = [
    {
      stepNumber: '01',
      title: 'Choose Your Sport',
      description: 'Select from Cricket, Box Cricket, Football, or Futsal with specialized ground compatibility.',
      icon: <Flame size={24} style={{ color: '#C9A227' }} />,
    },
    {
      stepNumber: '02',
      title: 'Select Date & Slot',
      description: 'View real-time availability across morning, evening, and floodlit night match windows.',
      icon: <Calendar size={24} style={{ color: '#C9A227' }} />,
    },
    {
      stepNumber: '03',
      title: 'Easy & Secure Payment',
      description: 'Lock in your slot via online advance (UPI, Card, Netbanking) or pay-at-venue with instant digital confirmation.',
      icon: <CreditCard size={24} style={{ color: '#C9A227' }} />,
    },
  ];

  return (
    <section id="how-it-works" className="section-wrapper" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-eyebrow">
            <Sparkles size={14} style={{ color: '#C9A227' }} />
            <span>SEAMLESS EXPERIENCE</span>
          </div>
          <h2 className="section-title">HOW IT WORKS</h2>
          <p className="section-subtitle">
            Get your squad on the pitch in 3 straightforward steps. Fast, transparent, and confirmed on the spot.
          </p>
        </div>

        {/* Steps Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
            gap: '1.5rem',
            marginBottom: '3rem',
            position: 'relative',
          }}
        >
          {steps.map((step, index) => (
            <div
              key={step.stepNumber}
              className="card-turf"
              style={{
                padding: 'clamp(1.5rem, 3vw, 2.25rem) clamp(1.25rem, 2.5vw, 1.75rem)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                backgroundColor: '#FFFFFF',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid #E8E2D5',
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
                {/* Step Top Row with Icon and Big Number */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <div
                    style={{
                      width: '3.25rem',
                      height: '3.25rem',
                      borderRadius: '12px',
                      backgroundColor: '#FAF8F3',
                      border: '1px solid #E8E2D5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(201, 162, 39, 0.08)',
                    }}
                  >
                    {step.icon}
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '2.25rem',
                      fontWeight: 800,
                      color: '#E9D9A7',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {step.stepNumber}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.25rem', color: '#191919', marginBottom: '0.6rem', fontWeight: 700 }}>
                  {step.title}
                </h3>

                <p style={{ fontSize: '0.875rem', color: '#666666', lineHeight: 1.55 }}>
                  {step.description}
                </p>
              </div>

              {/* Progress Indicator */}
              <div
                style={{
                  marginTop: '1.75rem',
                  paddingTop: '0.85rem',
                  borderTop: '1px solid #E8E2D5',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.75rem',
                  color: '#9D7916',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                <span>Step {index + 1} of {steps.length}</span>
                <ArrowRight size={13} style={{ color: '#C9A227' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA Banner */}
        <div
          style={{
            backgroundColor: '#FAF8F3',
            border: '1.5px solid #E8E2D5',
            borderRadius: 'var(--radius-xl)',
            padding: 'clamp(1.5rem, 4vw, 2.5rem) clamp(1.25rem, 3vw, 2rem)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.5rem',
            flexWrap: 'wrap',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ maxWidth: '620px' }}>
            <h3 style={{ fontSize: 'clamp(1.2rem, 1rem + 1vw, 1.5rem)', color: '#191919', marginBottom: '0.35rem', fontWeight: 800 }}>
              Ready to challenge your friends under the floodlights?
            </h3>
            <p style={{ color: '#666666', fontSize: '0.9375rem' }}>
              Reserve your slot online in under 60 seconds with instant booking reference.
            </p>
          </div>

          <button
            onClick={onStartBooking}
            className="btn btn-primary btn-lg btn-mobile-full"
            style={{
              backgroundColor: '#C9A227',
              color: '#191919',
              boxShadow: '0 6px 20px rgba(201, 162, 39, 0.35)',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={18} />
            <span>Book Your Game Now</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
