import React, { useState } from 'react';
import { brandConfig } from '../../config/turfConfig';
import { 
  LayoutDashboard, 
  CalendarDays, 
  CalendarRange, 
  Trophy, 
  IndianRupee, 
  Settings, 
  Eye, 
  PlusCircle, 
  Menu,
  Users
} from 'lucide-react';

export type AdminTab = 
  | 'overview' 
  | 'bookings' 
  | 'calendar' 
  | 'sports'
  | 'grounds' 
  | 'pricing'
  | 'customers'
  | 'revenue' 
  | 'settings';

interface AdminLayoutProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onExitToCustomerSite: () => void;
  onOpenManualBooking: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onSelectTab,
  onExitToCustomerSite,
  onOpenManualBooking,
  children,
}) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const navItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { id: 'bookings', label: 'Bookings', icon: <CalendarDays size={18} /> },
    { id: 'calendar', label: 'Schedule & Slots', icon: <CalendarRange size={18} /> },
    { id: 'customers', label: 'Customer Directory', icon: <Users size={18} /> },
    { id: 'revenue', label: 'Revenue & Accounts', icon: <IndianRupee size={18} /> },
    { id: 'settings', label: 'Facility Settings', icon: <Settings size={18} /> },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#FAF8F3' }}>
      {/* Sidebar Desktop */}
      <aside
        className="admin-sidebar"
        style={{
          width: '260px',
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #E8E2D5',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 40,
        }}
      >
        <div>
          {/* Brand header */}
          <div
            style={{
              padding: '1.5rem',
              borderBottom: '1px solid #E8E2D5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
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
                }}
              >
                <Trophy size={16} style={{ color: '#C9A227' }} />
              </div>
              <div>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 800, color: '#191919', display: 'block', lineHeight: 1 }}>
                  {brandConfig.brandName}
                </span>
                <span style={{ fontSize: '0.65rem', color: '#9D7916', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  ADMIN PORTAL
                </span>
              </div>
            </div>
          </div>

          {/* Quick Walk-in Booking Action */}
          <div style={{ padding: '1rem 1.25rem' }}>
            <button
              onClick={onOpenManualBooking}
              className="btn btn-primary btn-sm"
              style={{ width: '100%', justifyContent: 'center', backgroundColor: '#C9A227', color: '#191919', fontWeight: 700 }}
            >
              <PlusCircle size={15} />
              <span>+ Manual Booking</span>
            </button>
          </div>

          {/* Nav List */}
          <nav style={{ padding: '0 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    setMobileSidebarOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.7rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    backgroundColor: isActive ? '#FAF8F3' : 'transparent',
                    color: isActive ? '#9D7916' : '#666666',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 700 : 500,
                    textAlign: 'left',
                    width: '100%',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    boxShadow: isActive ? 'inset 3px 0 0 #C9A227' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = '#FAF8F3';
                      e.currentTarget.style.color = '#191919';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#666666';
                    }
                  }}
                >
                  <span style={{ color: isActive ? '#C9A227' : 'inherit' }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer in sidebar */}
        <div style={{ padding: '1.25rem', borderTop: '1px solid #E8E2D5' }}>
          <button
            onClick={onExitToCustomerSite}
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', backgroundColor: '#FFFFFF', borderColor: '#E8E2D5', color: '#191919' }}
          >
            <Eye size={14} />
            <span>Customer Website</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(25, 25, 25, 0.4)',
            backdropFilter: 'blur(3px)',
            zIndex: 39,
          }}
        />
      )}

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, backgroundColor: '#FAF8F3' }}>
        {/* Top Operational Status Bar */}
        <header
          style={{
            height: '4.5rem',
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid #E8E2D5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 clamp(0.75rem, 2.5vw, 2rem)',
            position: 'sticky',
            top: 0,
            zIndex: 30,
            boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
            gap: '0.75rem',
          }}
        >
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            aria-label="Toggle navigation menu"
            className="admin-mobile-toggle"
            style={{
              display: 'none',
              padding: '0.5rem',
              color: '#191919',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid #E8E2D5',
              backgroundColor: '#FFFFFF',
              minWidth: '44px',
              minHeight: '44px',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Menu size={22} />
          </button>

          {/* Operational Status Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8125rem' }}>
              <span className="pulse-dot" style={{ flexShrink: 0 }} />
              <span style={{ color: '#218653', fontWeight: 700, whiteSpace: 'nowrap' }}>Arena Live</span>
              <span className="admin-live-details" style={{ color: '#666666' }}>
                • Main Arena (Alpha) in play
              </span>
            </div>
          </div>

          {/* Right Admin Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            <button
              onClick={onExitToCustomerSite}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem', backgroundColor: '#FFFFFF', borderColor: '#E8E2D5', color: '#191919', whiteSpace: 'nowrap' }}
            >
              <Eye size={14} />
              <span className="admin-btn-label">Public Site</span>
            </button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.3rem 0.6rem',
                backgroundColor: '#FAF8F3',
                borderRadius: 'var(--radius-full)',
                border: '1px solid #E8E2D5',
              }}
            >
              <div
                style={{
                  width: '1.8rem',
                  height: '1.8rem',
                  borderRadius: '50%',
                  backgroundColor: '#C9A227',
                  color: '#191919',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  flexShrink: 0,
                }}
              >
                AD
              </div>
              <div className="admin-user-info" style={{ textAlign: 'left', lineHeight: 1.1 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#191919', display: 'block' }}>
                  Admin
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Admin View */}
        <main style={{ padding: 'clamp(1rem, 2.5vw, 2rem)', flex: 1, minWidth: 0 }}>
          {children}
        </main>
      </div>

      {/* Responsive sidebar styles */}
      <style>{`
        @media (max-width: 900px) {
          .admin-sidebar {
            display: ${mobileSidebarOpen ? 'flex' : 'none'} !important;
            position: fixed !important;
            inset: 0 auto 0 0 !important;
            width: min(280px, 80vw) !important;
            z-index: 50 !important;
            box-shadow: 10px 0 30px rgba(0,0,0,0.25);
          }
          .admin-mobile-toggle {
            display: inline-flex !important;
          }
        }
        @media (max-width: 640px) {
          .admin-live-details {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
