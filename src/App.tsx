import React, { useState, useEffect } from 'react';
import type { Sport, Ground, ConfirmedBooking } from './types';
import { 
  getStoredSports, 
  getStoredGrounds, 
  getStoredBookings, 
  saveBookings,
  saveStoredGrounds, 
  updateBookingStatus, 
  recordOfflinePayment, 
  cancelBooking,
  toggleSportActive,
  updateOrAddSport
} from './services/storageService';
import { apiClient } from './services/apiClient';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { HowItWorksSection } from './components/HowItWorksSection';
import { Footer } from './components/Footer';
import { MyBookingsModal } from './components/MyBookingsModal';
import { SportDetailModal } from './components/SportDetailModal';
import { BookingWizard } from './components/booking/BookingWizard';

// Admin Components
import { AdminLayout, type AdminTab } from './components/admin/AdminLayout';
import { AdminOverview } from './components/admin/AdminOverview';
import { AdminBookings } from './components/admin/AdminBookings';
import { AdminCalendar } from './components/admin/AdminCalendar';
import { AdminSports } from './components/admin/AdminSports';
import { AdminGrounds } from './components/admin/AdminGrounds';
import { AdminPricing } from './components/admin/AdminPricing';
import { AdminCustomers } from './components/admin/AdminCustomers';
import { AdminRevenue } from './components/admin/AdminRevenue';
import { AdminSettings } from './components/admin/AdminSettings';
import { AdminBookingDetailModal } from './components/admin/AdminBookingDetailModal';
import { AdminManualBookingModal } from './components/admin/AdminManualBookingModal';

export const App: React.FC = () => {
  // Navigation & View State with direct routing support
  const getInitialView = (): 'home' | 'booking' | 'admin' => {
    if (typeof window === 'undefined') return 'home';
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (path === '/admin' || hash === '#admin') return 'admin';
    if (path === '/booking' || hash === '#booking') return 'booking';
    return 'home';
  };

  const [activeView, setActiveView] = useState<'home' | 'booking' | 'admin'>(getInitialView);
  const [adminTab, setAdminTab] = useState<AdminTab>('overview');

  const navigateToView = (view: 'home' | 'booking' | 'admin') => {
    setActiveView(view);
    const targetPath = view === 'home' ? '/' : `/${view}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  };

  // Synchronize browser history and hash navigation
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path === '/admin' || hash === '#admin') {
        setActiveView('admin');
      } else if (path === '/booking' || hash === '#booking') {
        setActiveView('booking');
      } else if (path === '/' || hash === '#hero' || hash === '#how-it-works' || hash === '#contact') {
        setActiveView('home');
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Domain State (Persisted)
  const [sports, setSports] = useState<Sport[]>(() => getStoredSports());
  const [grounds, setGrounds] = useState<Ground[]>(() => getStoredGrounds());
  const [bookings, setBookings] = useState<ConfirmedBooking[]>(() => getStoredBookings());

  // Customer Modals
  const [selectedSportForModal, setSelectedSportForModal] = useState<Sport | null>(null);
  const [selectedSportForBooking, setSelectedSportForBooking] = useState<Sport | null>(null);
  const [selectedDurationForBooking, setSelectedDurationForBooking] = useState<number>(60);
  const [isMyBookingsOpen, setIsMyBookingsOpen] = useState(false);

  // Admin Modals
  const [inspectingBooking, setInspectingBooking] = useState<ConfirmedBooking | null>(null);
  const [isManualBookingOpen, setIsManualBookingOpen] = useState(false);

  // Initial and reactive domain data fetch from backend API
  const refreshDomainData = async () => {
    try {
      const [fetchedSports, fetchedGrounds] = await Promise.all([
        apiClient.getSports(true),
        apiClient.getGrounds(),
      ]);

      if (fetchedSports && fetchedSports.length > 0) setSports(fetchedSports);
      if (fetchedGrounds && fetchedGrounds.length > 0) setGrounds(fetchedGrounds);

      // Fetch bookings (admin all bookings if admin session, or customer bookings)
      let fetchedBookings: ConfirmedBooking[] | null = null;
      if (apiClient.getToken()) {
        try {
          const adminData = await apiClient.getAdminBookings({ limit: '200' });
          if (adminData && adminData.bookings && Array.isArray(adminData.bookings)) {
            const sportsList = fetchedSports?.length ? fetchedSports : getStoredSports();
            const groundsList = fetchedGrounds?.length ? fetchedGrounds : getStoredGrounds();
            fetchedBookings = adminData.bookings.map((b: any) => ({
              bookingId: b.id,
              referenceCode: b.referenceCode,
              createdAt: b.createdAt,
              sport: sportsList.find((s) => s.id === b.sportId) || { id: b.sportId, name: b.sportName || 'Cricket' },
              ground: groundsList.find((g) => g.id === b.groundId) || { id: b.groundId, name: b.groundName || 'Arena' },
              date: b.date,
              startTime: b.startTime,
              endTime: b.endTime,
              durationMinutes: b.durationMinutes,
              customer: {
                name: b.customerName,
                phone: b.customerPhone,
                email: b.customerEmail || '',
                notes: b.notes,
              },
              pricing: b.pricing,
              paymentMethod: b.paymentMethod === 'RAZORPAY' ? 'razorpay' : 'pay_at_venue',
              paymentOption: b.paymentType === 'ADVANCE' ? 'advance' : 'full',
              paymentStatus: b.paymentStatus.toLowerCase(),
              bookingStatus: b.bookingStatus.toLowerCase(),
              canCancelUntil: b.canCancelUntil,
            }));
          }
        } catch (err) {
          console.warn('Failed to fetch admin bookings, falling back to customer bookings:', err);
        }
      }

      if (!fetchedBookings) {
        fetchedBookings = await apiClient.getMyBookings();
      }

      if (fetchedBookings && fetchedBookings.length > 0) {
        setBookings(fetchedBookings);
        saveBookings(fetchedBookings);
      }
    } catch {
      // Graceful local fallback
      setSports(getStoredSports());
      setGrounds(getStoredGrounds());
      setBookings(getStoredBookings());
    }
  };

  useEffect(() => {
    refreshDomainData();
  }, [activeView]);

  // Ensure default Admin session exists when navigating to Admin Portal
  const handleOpenAdminPortal = async () => {
    if (!apiClient.getToken()) {
      try {
        await apiClient.login('admin@turfzone.com', 'TurfZone@2026!Admin');
      } catch (err) {
        console.warn('Auto admin login fallback:', err);
      }
    }
    navigateToView('admin');
    await refreshDomainData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Customer Booking Handlers
  const handleOpenBookingWizard = (sport?: Sport, durationMins?: number) => {
    const activeSports = sports.filter((s) => s.isActive);
    setSelectedSportForBooking(sport || activeSports[0] || sports[0]);
    if (durationMins) setSelectedDurationForBooking(durationMins);
    setSelectedSportForModal(null);
    navigateToView('booking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExploreSports = () => {
    handleOpenBookingWizard();
  };

  const handleProceedToBooking = (sport: Sport) => {
    handleOpenBookingWizard(sport);
  };

  // Admin Action Handlers connected to live backend

  const handleUpdateGround = async (ground: Ground) => {
    try {
      const updated = await apiClient.updateGround(ground.id, ground);
      setGrounds((prev) => prev.map((g) => (g.id === ground.id ? updated : g)));
    } catch {
      const updated = grounds.map((g) => (g.id === ground.id ? ground : g));
      setGrounds(updated);
      saveStoredGrounds(updated);
    }
  };

  const handleSelectBookingToInspect = (booking: ConfirmedBooking) => {
    setInspectingBooking(booking);
  };

  const handleAdminCancelBooking = async (bookingId: string) => {
    try {
      await apiClient.cancelBooking(bookingId);
    } catch {
      cancelBooking(bookingId);
    }
    await refreshDomainData();
    const updatedBookings = getStoredBookings();
    setBookings(updatedBookings);
    setInspectingBooking(updatedBookings.find((b) => b.bookingId === bookingId) || null);
  };

  const handleAdminRecordPayment = async (bookingId: string, amount: number) => {
    try {
      await apiClient.recordOfflinePayment(bookingId, amount);
    } catch {
      recordOfflinePayment(bookingId, amount);
    }
    await refreshDomainData();
    const updatedBookings = getStoredBookings();
    setBookings(updatedBookings);
    setInspectingBooking(updatedBookings.find((b) => b.bookingId === bookingId) || null);
  };

  const handleAdminUpdateStatus = (bookingId: string, status: 'confirmed' | 'cancelled' | 'completed') => {
    updateBookingStatus(bookingId, status);
    const updatedBookings = getStoredBookings();
    setBookings(updatedBookings);
    setInspectingBooking(updatedBookings.find((b) => b.bookingId === bookingId) || null);
  };

  const handleToggleSportActive = (sportId: string) => {
    const updated = toggleSportActive(sportId);
    setSports(updated);
  };

  const handleSaveSport = (sport: Sport) => {
    const updated = updateOrAddSport(sport);
    setSports(updated);
  };

  // Render Customer or Admin
  if (activeView === 'admin') {
    return (
      <>
        <AdminLayout
          currentTab={adminTab}
          onSelectTab={setAdminTab}
          onExitToCustomerSite={() => {
            navigateToView('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenManualBooking={() => setIsManualBookingOpen(true)}
        >
          {adminTab === 'overview' && (
            <AdminOverview
              bookings={bookings}
              onViewAllBookings={() => setAdminTab('bookings')}
              onSelectBooking={handleSelectBookingToInspect}
            />
          )}

          {adminTab === 'bookings' && (
            <AdminBookings
              bookings={bookings}
              onSelectBooking={handleSelectBookingToInspect}
              onOpenManualBooking={() => setIsManualBookingOpen(true)}
              onRecordPayment={handleAdminRecordPayment}
            />
          )}

          {adminTab === 'calendar' && (
            <AdminCalendar
              bookings={bookings}
              onOpenManualBooking={() => setIsManualBookingOpen(true)}
              onSelectBooking={handleSelectBookingToInspect}
            />
          )}

          {adminTab === 'sports' && (
            <AdminSports
              sports={sports}
              onToggleSportActive={handleToggleSportActive}
              onSaveSport={handleSaveSport}
            />
          )}

          {adminTab === 'grounds' && (
            <AdminGrounds
              grounds={grounds}
              sports={sports}
              onUpdateGround={handleUpdateGround}
            />
          )}

          {adminTab === 'pricing' && <AdminPricing />}

          {adminTab === 'customers' && (
            <AdminCustomers
              bookings={bookings}
              onSelectBooking={handleSelectBookingToInspect}
            />
          )}

          {adminTab === 'revenue' && <AdminRevenue bookings={bookings} />}

          {adminTab === 'settings' && <AdminSettings />}
        </AdminLayout>

        {/* Admin Modals */}
        <AdminBookingDetailModal
          booking={inspectingBooking}
          onClose={() => setInspectingBooking(null)}
          onCancelBooking={handleAdminCancelBooking}
          onRecordPayment={handleAdminRecordPayment}
          onUpdateStatus={handleAdminUpdateStatus}
        />

        <AdminManualBookingModal
          isOpen={isManualBookingOpen}
          onClose={() => setIsManualBookingOpen(false)}
          onBookingCreated={() => {
            refreshDomainData();
          }}
        />
      </>
    );
  }

  // Active Customer-Facing View (Homepage or Booking Wizard)
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation */}
      <Navbar
        onBookNowClick={() => handleOpenBookingWizard()}
        onMyBookingsClick={() => setIsMyBookingsOpen(true)}
        onAdminClick={handleOpenAdminPortal}
      />

      {/* Main Content: Dedicated Booking Wizard or Customer Homepage */}
      {activeView === 'booking' ? (
        <BookingWizard
          initialSport={selectedSportForBooking}
          initialDurationMinutes={selectedDurationForBooking}
          onClose={() => navigateToView('home')}
          onViewMyBookings={() => {
            navigateToView('home');
            setIsMyBookingsOpen(true);
          }}
        />
      ) : (
        <main style={{ flex: 1 }}>
          <Hero
            onBookClick={() => handleOpenBookingWizard()}
            onExploreSportsClick={handleExploreSports}
          />

          <HowItWorksSection
            onStartBooking={() => handleOpenBookingWizard()}
          />
        </main>
      )}

      {/* Footer */}
      <Footer onAdminClick={handleOpenAdminPortal} />

      {/* Modals */}
      <MyBookingsModal
        isOpen={isMyBookingsOpen}
        onClose={() => setIsMyBookingsOpen(false)}
        onBookNewSlot={() => {
          setIsMyBookingsOpen(false);
          handleOpenBookingWizard();
        }}
      />

      <SportDetailModal
        sport={selectedSportForModal}
        onClose={() => setSelectedSportForModal(null)}
        onProceedToBooking={handleProceedToBooking}
      />
    </div>
  );
};

export default App;
