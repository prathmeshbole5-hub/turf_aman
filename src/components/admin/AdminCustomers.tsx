import React, { useState, useMemo } from 'react';
import type { ConfirmedBooking } from '../../types';
import { 
  Search, 
  Mail, 
  Calendar 
} from 'lucide-react';

interface AdminCustomersProps {
  bookings: ConfirmedBooking[];
  onSelectBooking: (booking: ConfirmedBooking) => void;
}

interface CustomerProfile {
  name: string;
  phone: string;
  email: string;
  totalBookings: number;
  totalSpent: number;
  lastBookingDate: string;
  tier: 'VIP Club' | 'Regular Player' | 'New Player';
  bookings: ConfirmedBooking[];
}

export const AdminCustomers: React.FC<AdminCustomersProps> = ({
  bookings,
  onSelectBooking,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);

  // Group bookings by customer phone number
  const customers = useMemo(() => {
    const map = new Map<string, CustomerProfile>();

    bookings.forEach((b) => {
      const phone = b.customer.phone;
      if (!map.has(phone)) {
        map.set(phone, {
          name: b.customer.name,
          phone: b.customer.phone,
          email: b.customer.email,
          totalBookings: 0,
          totalSpent: 0,
          lastBookingDate: b.date,
          tier: 'New Player',
          bookings: [],
        });
      }

      const prof = map.get(phone)!;
      prof.totalBookings += 1;
      prof.totalSpent += b.pricing.totalAmount;
      prof.bookings.push(b);
      if (b.date > prof.lastBookingDate) {
        prof.lastBookingDate = b.date;
      }
    });

    // Assign tiers
    map.forEach((prof) => {
      if (prof.totalSpent >= 4000 || prof.totalBookings >= 3) {
        prof.tier = 'VIP Club';
      } else if (prof.totalBookings >= 2) {
        prof.tier = 'Regular Player';
      } else {
        prof.tier = 'New Player';
      }
    });

    return Array.from(map.values());
  }, [bookings]);

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: '#191919', fontFamily: 'var(--font-heading)', fontWeight: 800 }}>
            Customer & Squad Directory
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#666666' }}>
            Authorized client directory tracking player loyalty, match history, and lifetime spending.
          </p>
        </div>

        <div style={{ position: 'relative', minWidth: 0, width: '100%', maxWidth: '340px' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#666666' }} />
          <input
            type="text"
            placeholder="Search by name, phone, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem 0.65rem 2.4rem',
              backgroundColor: '#FAF8F3',
              border: '1px solid #E8E2D5',
              borderRadius: '8px',
              color: '#191919',
              fontSize: '16px',
              minHeight: '44px',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
          gap: '1.25rem',
        }}
      >
        {filteredCustomers.map((cust) => {
          const isVip = cust.tier === 'VIP Club';

          return (
            <div
              key={cust.phone}
              className="card-turf"
              style={{
                padding: '1.5rem',
                border: isVip ? '1.5px solid #C9A227' : '1px solid #E8E2D5',
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                boxShadow: isVip ? '0 4px 16px rgba(201, 162, 39, 0.08)' : '0 4px 16px rgba(0, 0, 0, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div
                      style={{
                        width: '2.4rem',
                        height: '2.4rem',
                        borderRadius: '50%',
                        backgroundColor: '#FAF8F3',
                        border: '1.5px solid #C9A227',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        color: '#9D7916',
                        fontSize: '0.9rem',
                      }}
                    >
                      {cust.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <strong style={{ fontSize: '1rem', color: '#191919', display: 'block', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
                        {cust.name}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: '#666666' }}>{cust.phone}</span>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '9999px',
                      backgroundColor: isVip ? '#C9A227' : '#FAF8F3',
                      color: isVip ? '#191919' : '#666666',
                      border: isVip ? 'none' : '1px solid #E8E2D5',
                    }}
                  >
                    {cust.tier}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: '#666666', marginBottom: '1.25rem' }}>
                  {cust.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <Mail size={13} style={{ color: '#C9A227' }} />
                      <span style={{ color: '#191919' }}>{cust.email}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Calendar size={13} style={{ color: '#C9A227' }} />
                    <span>Last Match: <strong style={{ color: '#191919' }}>{cust.lastBookingDate}</strong></span>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', padding: '0.85rem', backgroundColor: '#FAF8F3', borderRadius: '12px', border: '1px solid #E8E2D5' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#666666', display: 'block' }}>Total Matches</span>
                    <strong style={{ fontSize: '1.1rem', color: '#191919', fontFamily: 'var(--font-heading)' }}>{cust.totalBookings} Slots</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#666666', display: 'block' }}>Lifetime Spend</span>
                    <strong style={{ fontSize: '1.1rem', color: '#C9A227', fontFamily: 'var(--font-heading)' }}>₹{cust.totalSpent.toFixed(0)}</strong>
                  </div>
                </div>
              </div>

              {/* View History Button */}
              <div style={{ marginTop: '1.25rem' }}>
                <button
                  onClick={() => setSelectedCustomer(cust)}
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', justifyContent: 'center', backgroundColor: '#FFFFFF', border: '1px solid #E8E2D5', color: '#191919' }}
                >
                  <span>View Match Passes ({cust.bookings.length})</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Customer Booking History Modal */}
      {selectedCustomer && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Customer Booking History"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(25, 25, 25, 0.6)',
            backdropFilter: 'blur(6px)',
            padding: '1rem',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 'min(600px, 94vw)',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E8E2D5',
              borderRadius: '16px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)',
              padding: 'clamp(1rem, 3.5vw, 1.75rem)',
              maxHeight: '90dvh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid #E8E2D5', paddingBottom: '0.85rem', gap: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: 'clamp(1.1rem, 0.95rem + 0.6vw, 1.25rem)', color: '#191919', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
                  {selectedCustomer.name}'s Match History
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#666666', wordBreak: 'break-word' }}>
                  {selectedCustomer.phone} • {selectedCustomer.tier} • Lifetime: ₹{selectedCustomer.totalSpent.toFixed(2)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                aria-label="Close dialog"
                className="btn btn-secondary btn-sm"
                style={{
                  minHeight: '44px',
                  padding: '0.4rem 1rem',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E8E2D5',
                  color: '#191919',
                  flexShrink: 0,
                }}
              >
                Close
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {selectedCustomer.bookings.map((b) => (
                <div
                  key={b.bookingId}
                  onClick={() => {
                    setSelectedCustomer(null);
                    onSelectBooking(b);
                  }}
                  style={{
                    padding: '1rem',
                    backgroundColor: '#FAF8F3',
                    borderRadius: '12px',
                    border: '1px solid #E8E2D5',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#C9A227';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E8E2D5';
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <strong style={{ color: '#9D7916', fontFamily: 'monospace' }}>{b.referenceCode}</strong>
                      <span style={{ color: '#191919', fontSize: '0.85rem', fontWeight: 600 }}>• {b.sport.name}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#666666' }}>
                      {b.ground.name} • {b.date} • {b.startTime} ({b.durationMinutes}m)
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ color: '#191919', display: 'block', fontSize: '0.9rem' }}>
                      ₹{b.pricing.totalAmount.toFixed(0)}
                    </strong>
                    <span style={{ fontSize: '0.7rem', color: b.bookingStatus === 'confirmed' ? '#218653' : '#666666', textTransform: 'uppercase', fontWeight: 700 }}>
                      {b.bookingStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
