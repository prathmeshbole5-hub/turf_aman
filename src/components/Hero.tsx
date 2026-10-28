import React from 'react';
import { 
  Sparkles, 
  ArrowRight 
} from 'lucide-react';

interface HeroProps {
  onBookClick: () => void;
  onExploreSportsClick?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onBookClick }) => {
  return (
    <section id="hero" style={{ position: 'relative', overflow: 'hidden', minHeight: 'clamp(480px, 80dvh, 850px)', display: 'flex', alignItems: 'center' }}>
      {/* Background Cinematic Sports Photograph */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url('/images/hero_turf_night.jpg')`,
          backgroundPosition: 'center 40%',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          transform: 'scale(1.02)',
          zIndex: 0,
        }}
      />

      {/* Neutral Dark & Champagne Photographic Overlays for Maximum Contrast */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            linear-gradient(180deg, rgba(20, 20, 20, 0.75) 0%, rgba(20, 20, 20, 0.55) 45%, rgba(20, 20, 20, 0.92) 100%),
            radial-gradient(circle at 20% 50%, rgba(201, 162, 39, 0.22) 0%, transparent 65%),
            linear-gradient(90deg, rgba(20, 20, 20, 0.88) 0%, rgba(20, 20, 20, 0.45) 60%, rgba(20, 20, 20, 0.82) 100%)
          `,
          zIndex: 1,
        }}
      />

      {/* Subtle Grid Accent */}
      <div
        className="bg-grid-pattern"
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.1,
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      {/* Hero Content Container */}
      <div className="container" style={{ position: 'relative', zIndex: 3, paddingTop: 'clamp(3rem, 6vw, 5.5rem)', paddingBottom: 'clamp(3rem, 6vw, 5.5rem)' }}>
        <div style={{ maxWidth: '820px' }}>
          {/* Main Cinematic Heading in White & Gold */}
          <h1
            style={{
              color: '#FFFFFF',
              marginBottom: 'clamp(1.25rem, 3vw, 2rem)',
              fontWeight: 900,
              textTransform: 'uppercase',
              lineHeight: 1.08,
              fontSize: 'clamp(1.85rem, 1.2rem + 4vw, 4.85rem)',
              letterSpacing: '-0.02em',
              textShadow: '0 4px 30px rgba(0, 0, 0, 0.8)',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
            }}
          >
            ELITE CRICKET{' '}
            <span
              style={{
                color: '#C9A227',
                textShadow: '0 2px 25px rgba(201, 162, 39, 0.5)',
              }}
            >
              BOX
            </span>
          </h1>

          {/* Book Slot Option */}
          <div>
            <button
              onClick={onBookClick}
              className="btn btn-primary btn-lg btn-mobile-full"
              style={{
                backgroundColor: '#C9A227',
                color: '#191919',
                fontWeight: 800,
                fontSize: 'clamp(0.95rem, 0.9rem + 0.3vw, 1.05rem)',
                padding: 'clamp(0.85rem, 2vw, 1rem) clamp(1.5rem, 3vw, 2.25rem)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 8px 30px rgba(201, 162, 39, 0.5)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                transition: 'all var(--transition-fast)',
                maxWidth: '100%',
              }}
            >
              <Sparkles size={20} />
              <span>BOOK SLOT</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
