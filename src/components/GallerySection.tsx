import React, { useState, useRef, useEffect } from 'react';
import { initialGallery } from '../config/turfConfig';
import type { GalleryItem } from '../types';
import { 
  Images, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2
} from 'lucide-react';

export const GallerySection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const categories = [
    { id: 'all', label: 'All Photos' },
    { id: 'cricket', label: 'Cricket & Box' },
    { id: 'football', label: 'Football & 5v5' },
    { id: 'night', label: 'Night Arena' },
    { id: 'facilities', label: 'Clubhouse & Turf' },
  ];

  const filteredItems = selectedCategory === 'all'
    ? initialGallery
    : initialGallery.filter((item) => item.category === selectedCategory);

  const openLightbox = (index: number) => {
    setActiveImageIndex(index);
    if (dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  };

  const closeLightbox = () => {
    if (dialogRef.current && dialogRef.current.open) {
      dialogRef.current.close();
    }
    setActiveImageIndex(null);
  };

  const nextImage = () => {
    if (activeImageIndex === null) return;
    setActiveImageIndex((activeImageIndex + 1) % filteredItems.length);
  };

  const prevImage = () => {
    if (activeImageIndex === null) return;
    setActiveImageIndex((activeImageIndex - 1 + filteredItems.length) % filteredItems.length);
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleDialogClick = (event: MouseEvent) => {
      if (!('closedBy' in HTMLDialogElement.prototype)) {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const isDialogContent =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width;

        if (!isDialogContent) {
          closeLightbox();
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!dialog.open) return;
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };

    dialog.addEventListener('click', handleDialogClick);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      dialog.removeEventListener('click', handleDialogClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeImageIndex, filteredItems.length]);

  const currentItem: GalleryItem | null =
    activeImageIndex !== null && filteredItems[activeImageIndex]
      ? filteredItems[activeImageIndex]
      : null;

  return (
    <section id="gallery" className="section-wrapper" style={{ backgroundColor: '#FAF8F3' }}>
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-eyebrow">
            <Images size={14} style={{ color: '#C9A227' }} />
            <span>ACTION SHOTS & GROUNDS</span>
          </div>
          <h2 className="section-title">THE TURF EXPERIENCE</h2>
          <p className="section-subtitle">
            A glimpse into competitive nights, intense rallies, and stadium-grade floodlit turf matches. Every shot captures authentic action on our grounds.
          </p>
        </div>

        {/* Category Filters */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.65rem',
            flexWrap: 'wrap',
            marginBottom: '2.5rem',
          }}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  padding: '0.6rem 1.25rem',
                  borderRadius: 'var(--radius-full)',
                  transition: 'all var(--transition-fast)',
                  backgroundColor: isSelected ? '#C9A227' : '#FFFFFF',
                  color: isSelected ? '#191919' : '#666666',
                  border: isSelected ? '1px solid #C9A227' : '1px solid #E8E2D5',
                  boxShadow: isSelected ? '0 4px 15px rgba(201, 162, 39, 0.3)' : 'var(--shadow-subtle)',
                  cursor: 'pointer',
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Gallery Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              onClick={() => openLightbox(index)}
              className="card-turf"
              tabIndex={0}
              role="button"
              aria-label={`View photo ${item.title}`}
              style={{
                cursor: 'pointer',
                position: 'relative',
                height: '270px',
                overflow: 'hidden',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid #E8E2D5',
                boxShadow: 'var(--shadow-card)',
                backgroundColor: '#FFFFFF',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openLightbox(index);
                }
              }}
            >
              <img
                src={item.imageUrl}
                alt={item.title}
                loading="lazy"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.06)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              />

              {/* Gradient Shade for Crisp Caption Legibility */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(20,20,20,0.1) 0%, rgba(20,20,20,0.85) 90%)',
                }}
              />

              {/* Badge & Maximize Icon */}
              <div
                style={{
                  position: 'absolute',
                  top: '1rem',
                  left: '1rem',
                  right: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  zIndex: 2,
                }}
              >
                {item.badge && (
                  <span className="badge-gold">
                    {item.badge}
                  </span>
                )}
                <div
                  style={{
                    width: '2.2rem',
                    height: '2.2rem',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#191919',
                    border: '1px solid #E8E2D5',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  }}
                >
                  <Maximize2 size={13} style={{ color: '#9D7916' }} />
                </div>
              </div>

              {/* Caption on Bottom */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '1rem',
                  left: '1.25rem',
                  right: '1.25rem',
                  zIndex: 2,
                }}
              >
                <h4 style={{ fontSize: '1.15rem', color: '#FFFFFF', marginBottom: '0.2rem', fontWeight: 700 }}>
                  {item.title}
                </h4>
                <p style={{ fontSize: '0.8125rem', color: '#E9D9A7', lineHeight: 1.4 }}>
                  {item.caption}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modern Lightbox Modal Dialog */}
      <dialog
        ref={dialogRef}
        {...({ closedby: 'any' } as any)}
        className="turf-dialog"
        aria-label="Photo Lightbox"
        style={{
          width: '920px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E8E2D5',
        }}
      >
        {currentItem && (
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
            {/* Top Bar inside modal */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.5rem',
                borderBottom: '1px solid #E8E2D5',
                backgroundColor: '#FAF8F3',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.2rem', color: '#191919', fontWeight: 700 }}>
                  {currentItem.title}
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#C9A227', fontWeight: 600 }}>
                  {currentItem.badge || 'TurfZone Arena'}
                </span>
              </div>

              <button
                onClick={closeLightbox}
                aria-label="Close photo preview"
                style={{
                  width: '2.25rem',
                  height: '2.25rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E8E2D5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#191919',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Main Image with Navigation Arrows */}
            <div
              style={{
                position: 'relative',
                backgroundColor: '#191919',
                maxHeight: '65vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <img
                src={currentItem.imageUrl}
                alt={currentItem.title}
                style={{
                  maxWidth: '100%',
                  maxHeight: '65vh',
                  objectFit: 'contain',
                }}
              />

              {/* Prev Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                aria-label="Previous photo"
                style={{
                  position: 'absolute',
                  left: '1rem',
                  width: '3rem',
                  height: '3rem',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid #E8E2D5',
                  color: '#191919',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                }}
              >
                <ChevronLeft size={22} style={{ color: '#9D7916' }} />
              </button>

              {/* Next Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                aria-label="Next photo"
                style={{
                  position: 'absolute',
                  right: '1rem',
                  width: '3rem',
                  height: '3rem',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid #E8E2D5',
                  color: '#191919',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                }}
              >
                <ChevronRight size={22} style={{ color: '#9D7916' }} />
              </button>
            </div>

            {/* Footer with caption & counter */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                backgroundColor: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid #E8E2D5',
              }}
            >
              <p style={{ fontSize: '0.9rem', color: '#191919' }}>
                {currentItem.caption}
              </p>
              <span style={{ fontSize: '0.8rem', color: '#666666', whiteSpace: 'nowrap', marginLeft: '1rem', fontWeight: 600 }}>
                {activeImageIndex !== null ? activeImageIndex + 1 : 1} of {filteredItems.length}
              </span>
            </div>
          </div>
        )}
      </dialog>
    </section>
  );
};

export default GallerySection;
