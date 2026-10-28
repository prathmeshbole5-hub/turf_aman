import React from 'react';
import type { Sport } from '../types';
import { Clock, ArrowRight, Sparkles, Trophy, Check } from 'lucide-react';

interface SportsSectionProps {
  sports?: Sport[];
  onSelectSport?: (sport: Sport) => void;
  onBookSlot?: (hours: number) => void;
}

interface RateCard {
  duration: string;
  hours: number;
  rate: number;
  rateFormatted: string;
  popular?: boolean;
}

const RATE_CARDS: RateCard[] = [
  {
    duration: '1 hr',
    hours: 1,
    rate: 900,
    rateFormatted: '₹900',
  },
  {
    duration: '2 hr',
    hours: 2,
    rate: 1800,
    rateFormatted: '₹1800',
    popular: true,
  },
  {
    duration: '3 hr',
    hours: 3,
    rate: 2400,
    rateFormatted: '₹2400',
  },
  {
    duration: '4 hr',
    hours: 4,
    rate: 3000,
    rateFormatted: '₹3000',
  },
];

export const SportsSection: React.FC<SportsSectionProps> = ({
  sports,
  onSelectSport,
  onBookSlot,
}) => {
  const handleCardClick = (hours: number) => {
    if (onBookSlot) {
      onBookSlot(hours);
    } else if (onSelectSport && sports && sports.length > 0) {
      onSelectSport(sports[0]);
    }
  };

  return (
    <section
      id="sports"
      className="section-wrapper"
      style={{ backgroundColor: '#FAF8F3', position: 'relative' }}
    >
      <div id="rates" style={{ position: 'absolute', top: '-80px' }} />
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-eyebrow">
            <Sparkles size={14} style={{ color: '#C9A227' }} />
            <span>PREMIUM ARENAS & RATES</span>
          </div>
          <h2 className="section-title">CHOOSE YOUR SPORT & SLOT</h2>
          <p className="section-subtitle">
            Tournament-grade artificial turf pitches engineered for speed, safety, and peak ball response. Select your sport or duration to lock in your match.
          </p>
        </div>

        {/* Sport Selection Showcase Cards (Section 7) */}
        {sports && sports.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.75rem',
              marginBottom: '4.5rem',
            }}
          >
            {sports.map((sport) => (
              <div
                key={sport.id}
                className="card-turf"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid #E8E2D5',
                  overflow: 'hidden',
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
                {/* Sport Image with refined overlay */}
                <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
                  <img
                    src={sport.coverImage}
                    alt={sport.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(25, 25, 25, 0.1) 0%, rgba(25, 25, 25, 0.75) 100%)',
                    }}
                  />
                  {sport.popular && (
                    <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                      <span className="badge-gold">
                        <Sparkles size={12} /> Popular
                      </span>
                    </div>
                  )}
                  <div style={{ position: 'absolute', bottom: '12px', left: '16px', right: '16px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#E9D9A7', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block' }}>
                      {sport.format}
                    </span>
                    <h3 style={{ fontSize: '1.35rem', color: '#FFFFFF', fontWeight: 700, margin: 0 }}>
                      {sport.name}
                    </h3>
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#666666', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                      {sport.shortDescription}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '1.5rem' }}>
                      {sport.features.slice(0, 3).map((feat, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#191919' }}>
                          <Check size={14} style={{ color: '#C9A227', flexShrink: 0 }} />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '1rem',
                      borderTop: '1px solid #E8E2D5',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                        Starting Rate
                      </span>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#C9A227' }}>
                        ₹{sport.startingHourlyRate} <span style={{ fontSize: '0.75rem', color: '#666666', fontWeight: 500 }}>/ hr</span>
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {onSelectSport && (
                        <button
                          onClick={() => onSelectSport(sport)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.5rem 0.85rem' }}
                        >
                          Specs
                        </button>
                      )}
                      <button
                        onClick={() => handleCardClick(1)}
                        className="btn btn-primary btn-sm"
                        style={{ padding: '0.5rem 0.95rem' }}
                      >
                        <span>Book</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rates Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span className="section-eyebrow">
            <Trophy size={14} style={{ color: '#C9A227' }} />
            <span>QUICK DURATION BOOKING</span>
          </span>
          <h3 style={{ fontSize: '1.65rem', color: '#191919', fontWeight: 800, textTransform: 'uppercase' }}>
            TRANSPARENT HOURLY PRICING
          </h3>
          <p style={{ color: '#666666', fontSize: '0.95rem' }}>
            Choose how long your squad needs the pitch. No surprise charges.
          </p>
        </div>

        {/* 4 Rate Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '1.75rem',
            maxWidth: '1200px',
            margin: '0 auto',
          }}
        >
          {RATE_CARDS.map((card) => (
            <div
              key={card.duration}
              className="card-turf"
              onClick={() => handleCardClick(card.hours)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '2.5rem 1.75rem',
                textAlign: 'center',
                borderRadius: 'var(--radius-xl)',
                backgroundColor: '#FFFFFF',
                border: card.popular ? '2px solid #C9A227' : '1.5px solid #E8E2D5',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: card.popular ? '0 10px 30px rgba(201, 162, 39, 0.15)' : 'var(--shadow-card)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#C9A227';
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = '0 16px 36px rgba(201, 162, 39, 0.18)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = card.popular ? '#C9A227' : '#E8E2D5';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = card.popular ? '0 10px 30px rgba(201, 162, 39, 0.15)' : 'var(--shadow-card)';
              }}
            >
              {/* Top Accent Strip in Gold */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  backgroundColor: '#C9A227',
                }}
              />

              {card.popular && (
                <div style={{ position: 'absolute', top: '14px', right: '14px' }}>
                  <span className="badge-gold" style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem' }}>
                    Best Value
                  </span>
                </div>
              )}

              {/* Time Block */}
              <div style={{ marginBottom: '1.75rem' }}>
                <div
                  style={{
                    width: '3.5rem',
                    height: '3.5rem',
                    borderRadius: '50%',
                    backgroundColor: '#FAF8F3',
                    border: '1.5px solid #E8E2D5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.25rem auto',
                    boxShadow: '0 2px 8px rgba(201, 162, 39, 0.1)',
                  }}
                >
                  <Clock size={24} style={{ color: '#C9A227' }} />
                </div>

                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '2rem',
                    fontWeight: 800,
                    color: '#191919',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  {card.duration}
                </div>
              </div>

              {/* Divider */}
              <div
                style={{
                  height: '1px',
                  backgroundColor: '#E8E2D5',
                  width: '100%',
                  marginBottom: '1.75rem',
                }}
              />

              {/* Rate Block */}
              <div style={{ marginBottom: '2rem' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '2.75rem',
                    fontWeight: 800,
                    color: '#C9A227',
                    lineHeight: 1,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {card.rateFormatted}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#666666', marginTop: '0.35rem', display: 'block' }}>
                  All taxes included
                </span>
              </div>

              {/* CTA Button */}
              <button
                className="btn btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  fontSize: '0.95rem',
                  padding: '0.85rem 1.25rem',
                  backgroundColor: '#C9A227',
                  color: '#191919',
                }}
              >
                <span>Book Slot</span>
                <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SportsSection;
