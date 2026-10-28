import React, { useState, useMemo } from 'react';
import type { 
  Sport, 
  Ground, 
  TimeSlot, 
  CustomerInfo, 
  BookingPricingBreakdown, 
  ConfirmedBooking,
  PaymentMethod,
  PaymentOption
} from '../../types';
import { initialSports, initialGrounds, initialAddOns, brandConfig } from '../../config/turfConfig';
import { generateDaySlots, validateConsecutiveSlots, DURATION_OPTIONS, getSlotEndForDuration } from '../../services/slotService';
import { addConfirmedBooking } from '../../services/storageService';
import { apiClient } from '../../services/apiClient';
import { RazorpayModal } from './RazorpayModal';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Sparkles, 
  Calendar, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  Tag, 
  AlertCircle, 
  CheckCircle2, 
  CreditCard, 
  Building2, 
  Printer, 
  QrCode,
  Sliders
} from 'lucide-react';

interface BookingWizardProps {
  initialSport?: Sport | null;
  initialDurationMinutes?: number;
  onClose?: () => void;
  onViewMyBookings?: () => void;
}

export const BookingWizard: React.FC<BookingWizardProps> = ({
  initialSport,
  initialDurationMinutes,
  onClose,
  onViewMyBookings,
}) => {
  // Current Step: 1 = Date & Time Slot, 2 = Details & Payment, 3 = Confirmation
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Selections
  const [selectedSport, setSelectedSport] = useState<Sport>(
    initialSport || initialSports[0]
  );

  // Compatible grounds for the selected sport
  const compatibleGrounds = useMemo(() => {
    return initialGrounds.filter((g) => selectedSport.supportedGroundIds.includes(g.id));
  }, [selectedSport]);

  const [selectedGround, setSelectedGround] = useState<Ground>(
    compatibleGrounds[0] || initialGrounds[0]
  );

  // Date selection (next 14 days)
  const availableDates = useMemo(() => {
    const dates: { dateStr: string; displayDay: string; displayDate: string; isWeekend: boolean }[] = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      let displayDay = dayNames[d.getDay()];
      if (i === 0) displayDay = 'Today';
      if (i === 1) displayDay = 'Tomorrow';

      dates.push({
        dateStr,
        displayDay,
        displayDate: `${d.getDate()} ${monthNames[d.getMonth()]}`,
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
      });
    }
    return dates;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(availableDates[0].dateStr);
  const [durationMinutes, setDurationMinutes] = useState<number>(initialDurationMinutes || 60);
  const [selectedStartSlot, setSelectedStartSlot] = useState<TimeSlot | null>(null);
  const [slotConflictError, setSlotConflictError] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState<'preset' | 'manual'>('preset');

  // Generate slots dynamically for the chosen date, sport, ground
  const daySlots = useMemo(() => {
    return generateDaySlots(selectedDate, selectedSport, selectedGround);
  }, [selectedDate, selectedSport, selectedGround]);

  // Selected add-ons: map addonId -> quantity
  const [selectedAddOnCounts, setSelectedAddOnCounts] = useState<Record<string, number>>({});

  // Customer Form Details
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });

  // Coupon & Payment choices
  const [couponCode, setCouponCode] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercentage: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [paymentOption, setPaymentOption] = useState<PaymentOption>('full');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('razorpay');

  // Checkout & Confirmed Booking State
  const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<ConfirmedBooking | null>(null);

  // When sport changes, re-sync compatible ground
  const handleSportChange = (sport: Sport) => {
    setSelectedSport(sport);
    const grounds = initialGrounds.filter((g) => sport.supportedGroundIds.includes(g.id));
    if (grounds.length > 0) {
      setSelectedGround(grounds[0]);
    }
    setSelectedStartSlot(null);
    setSlotConflictError(null);
  };

  // When ground changes
  const handleGroundChange = (ground: Ground) => {
    setSelectedGround(ground);
    setSelectedStartSlot(null);
    setSlotConflictError(null);
  };

  // Helper to check if a slot is within the currently selected reservation range
  const isSlotInSelectedRange = (slot: TimeSlot) => {
    if (!selectedStartSlot) return false;
    const startIndex = daySlots.findIndex((s) => s.id === selectedStartSlot.id);
    const currentIndex = daySlots.findIndex((s) => s.id === slot.id);
    const slotsCount = Math.max(1, Math.ceil(durationMinutes / 60));
    return currentIndex >= startIndex && currentIndex < startIndex + slotsCount;
  };

  // Compute available end times when a start slot is selected
  const availableEndTimes = useMemo(() => {
    if (!selectedStartSlot) return [];
    const startIndex = daySlots.findIndex((s) => s.id === selectedStartSlot.id);
    if (startIndex === -1) return [];

    const options: { time: string; durationMins: number; rate: number; disabled: boolean }[] = [];
    let isBlocked = false;

    for (let i = startIndex; i < daySlots.length; i++) {
      const current = daySlots[i];
      const hoursCount = i - startIndex + 1;
      const durationMins = hoursCount * 60;

      let rate = 900;
      if (hoursCount === 1) rate = 900;
      else if (hoursCount === 2) rate = 1800;
      else if (hoursCount === 3) rate = 2400;
      else if (hoursCount === 4) rate = 3000;
      else rate = 3000 + (hoursCount - 4) * 750;

      if (current.status !== 'available' && current.status !== 'selected') {
        isBlocked = true;
      }

      options.push({
        time: current.endTime,
        durationMins,
        rate,
        disabled: isBlocked,
      });
    }

    return options;
  }, [selectedStartSlot, daySlots]);

  // Handle manual start time selection from dropdown
  const handleManualStartTimeSelect = (startTimeStr: string) => {
    const slot = daySlots.find((s) => s.startTime === startTimeStr);
    if (!slot) return;
    if (slot.status === 'booked' || slot.status === 'unavailable' || slot.status === 'held') {
      setSlotConflictError(`Slot starting at ${startTimeStr} is ${slot.status}.`);
      return;
    }

    const validation = validateConsecutiveSlots(slot, durationMinutes, daySlots);
    if (validation.isValid) {
      setSelectedStartSlot(slot);
      setSlotConflictError(null);
    } else {
      const fallback = validateConsecutiveSlots(slot, 60, daySlots);
      if (fallback.isValid) {
        setSelectedStartSlot(slot);
        setDurationMinutes(60);
        setSlotConflictError(null);
      } else {
        setSlotConflictError(fallback.errorMessage || 'Slot unavailable.');
      }
    }
  };

  // Handle manual end time selection from dropdown
  const handleManualEndTimeSelect = (endTimeStr: string) => {
    if (!selectedStartSlot) return;
    const startIndex = daySlots.findIndex((s) => s.id === selectedStartSlot.id);
    const endIndex = daySlots.findIndex((s) => s.endTime === endTimeStr);
    if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
      setSlotConflictError('End time must be after start time.');
      return;
    }

    const calculatedMins = (endIndex - startIndex + 1) * 60;
    const validation = validateConsecutiveSlots(selectedStartSlot, calculatedMins, daySlots);
    if (!validation.isValid) {
      setSlotConflictError(validation.errorMessage || 'One or more slots in this interval are booked.');
      return;
    }

    setDurationMinutes(calculatedMins);
    setSlotConflictError(null);
  };

  // When user clicks a slot
  const handleSlotSelect = (slot: TimeSlot) => {
    if (slot.status === 'booked' || slot.status === 'unavailable' || slot.status === 'held') {
      return;
    }

    // In manual mode, clicking a second slot can set it as End Time
    if (selectionMode === 'manual' && selectedStartSlot) {
      const startIndex = daySlots.findIndex((s) => s.id === selectedStartSlot.id);
      const clickedIndex = daySlots.findIndex((s) => s.id === slot.id);

      if (clickedIndex > startIndex) {
        const calculatedMins = (clickedIndex - startIndex + 1) * 60;
        const validation = validateConsecutiveSlots(selectedStartSlot, calculatedMins, daySlots);
        if (validation.isValid) {
          setDurationMinutes(calculatedMins);
          setSlotConflictError(null);
          return;
        } else {
          setSlotConflictError(validation.errorMessage || 'Cannot select range: overlapping unavailable slot.');
          return;
        }
      }
    }

    // Check availability for current duration
    const slotEndInfo = getSlotEndForDuration(slot, durationMinutes, daySlots);
    if (!slotEndInfo.isAvailableForDuration) {
      const hours = durationMinutes / 60;
      setSlotConflictError(
        slotEndInfo.unavailabilityReason
          ? `Cannot start ${hours} hr booking at ${slot.startTime}: ${slotEndInfo.unavailabilityReason}.`
          : `Selected slot cannot accommodate ${hours} hour(s).`
      );
      return;
    }

    setSlotConflictError(null);
    setSelectedStartSlot(slot);
  };

  // When duration changes, re-validate selected slot if any
  const handleDurationChange = (minutes: number) => {
    setDurationMinutes(minutes);
    if (selectedStartSlot) {
      const slotEndInfo = getSlotEndForDuration(selectedStartSlot, minutes, daySlots);
      if (!slotEndInfo.isAvailableForDuration) {
        setSlotConflictError(`Cannot extend to ${minutes / 60} hr: ${slotEndInfo.unavailabilityReason || 'Slot unavailable'}.`);
        setSelectedStartSlot(null);
      } else {
        setSlotConflictError(null);
      }
    }
  };

  // Add-on counter toggles
  const updateAddOnCount = (addonId: string, delta: number) => {
    setSelectedAddOnCounts((prev) => {
      const current = prev[addonId] || 0;
      const updated = Math.max(0, current + delta);
      return { ...prev, [addonId]: updated };
    });
  };

  // Apply Promo Coupon
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    if (couponCode.trim().toUpperCase() === 'TURF20') {
      setAppliedCoupon({ code: 'TURF20', discountPercentage: 20 });
    } else if (couponCode.trim().toUpperCase() === 'PLAY10') {
      setAppliedCoupon({ code: 'PLAY10', discountPercentage: 10 });
    } else {
      setCouponError('Invalid promo coupon code. Try "TURF20" for 20% discount.');
    }
  };

  // Live Comprehensive Pricing Breakdown
  const pricingBreakdown: BookingPricingBreakdown = useMemo(() => {
    const getGroundCharge = (mins: number) => {
      if (mins === 60) return 900;
      if (mins === 120) return 1800;
      if (mins === 180) return 2400;
      if (mins === 240) return 3000;
      return (mins / 60) * 900;
    };

    const groundCharge = getGroundCharge(durationMinutes);
    const hours = durationMinutes / 60;
    const effectiveHourly = groundCharge / hours;
    const baseHourly = effectiveHourly;
    const peakSurchargeTotal = 0;

    const selectedAddOnsList: any[] = [];
    const addOnsTotal = 0;
    const subtotal = groundCharge;

    const discountPercentage = appliedCoupon ? appliedCoupon.discountPercentage : 0;
    const discountAmount = (subtotal * discountPercentage) / 100;
    const discountedSubtotal = subtotal - discountAmount;

    const taxAmount = 0;
    const totalAmount = discountedSubtotal;

    const advancePercentage = 25;
    const advanceAmount = paymentOption === 'advance' ? (totalAmount * 0.25) : totalAmount;
    const remainingBalance = paymentOption === 'advance' ? (totalAmount - advanceAmount) : 0;

    const validation = selectedStartSlot
      ? validateConsecutiveSlots(selectedStartSlot, durationMinutes, daySlots)
      : { calculatedEndTime: '' };

    return {
      sportId: selectedSport.id,
      sportName: selectedSport.name,
      groundId: selectedGround.id,
      groundName: selectedGround.name,
      date: selectedDate,
      startTime: selectedStartSlot ? selectedStartSlot.startTime : '',
      endTime: validation.calculatedEndTime || (selectedStartSlot ? selectedStartSlot.endTime : ''),
      durationMinutes,
      baseHourlyRate: baseHourly,
      effectiveHourlyRate: effectiveHourly,
      groundCharge,
      peakSurcharge: peakSurchargeTotal,
      selectedAddOns: selectedAddOnsList,
      addOnsTotal,
      couponCode: appliedCoupon?.code,
      discountPercentage,
      discountAmount,
      subtotal,
      taxAmount,
      totalAmount,
      advancePercentage,
      advanceAmount,
      remainingBalance,
    };
  }, [
    selectedSport,
    selectedGround,
    selectedDate,
    durationMinutes,
    selectedStartSlot,
    selectedAddOnCounts,
    appliedCoupon,
    paymentOption,
    daySlots,
  ]);

  // Form submission / Proceed to Payment
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerInfo.name || !customerInfo.phone) {
      alert('Please fill in your name and a valid 10-digit mobile number.');
      return;
    }

    if (paymentMethod === 'razorpay') {
      setIsRazorpayOpen(true);
    } else {
      // Pay at venue
      finalizeBooking('pay_at_venue', 'pay_at_venue');
    }
  };

  // Finalize and persist booking
  const finalizeBooking = async (
    method: PaymentMethod,
    status: 'paid_online' | 'advance_paid' | 'pay_at_venue',
  ) => {
    try {
      setSlotConflictError(null);

      // Attempt authoritative booking creation on Express backend
      const serverBooking = await apiClient.createBooking({
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        customerEmail: customerInfo.email,
        sportId: selectedSport.id,
        groundId: selectedGround.id,
        date: selectedDate,
        startTime: pricingBreakdown.startTime,
        durationMinutes: pricingBreakdown.durationMinutes,
        paymentMethod: method === 'razorpay' ? 'RAZORPAY' : 'VENUE_CASH',
        paymentOption,
        selectedAddOns: pricingBreakdown.selectedAddOns,
        discountCode: appliedCoupon?.code,
        notes: customerInfo.notes,
      });

      setConfirmedBooking(serverBooking);
      setIsRazorpayOpen(false);
      setCurrentStep(3); // Confirmation screen
    } catch (err: any) {
      setIsRazorpayOpen(false);
      console.warn('Booking creation caught error:', err);

      if (err.statusCode === 409) {
        // Double-booking collision detected by backend
        setSlotConflictError(err.message || 'Double-booking conflict: This interval was reserved by another player. Please select another time slot.');
        setCurrentStep(1); // Redirect back to slot selection
      } else {
        // Local fallback
        const randomRefNum = Math.floor(1000 + Math.random() * 9000);
        const bookingId = `TZ-2026-${randomRefNum}`;
        const referenceCode = `TZ-${randomRefNum}`;

        const fallbackBooking: ConfirmedBooking = {
          bookingId,
          referenceCode,
          createdAt: new Date().toISOString(),
          sport: selectedSport,
          ground: selectedGround,
          date: selectedDate,
          startTime: pricingBreakdown.startTime,
          endTime: pricingBreakdown.endTime,
          durationMinutes: pricingBreakdown.durationMinutes,
          customer: customerInfo,
          pricing: pricingBreakdown,
          paymentMethod: method,
          paymentOption,
          paymentStatus: status,
          bookingStatus: 'confirmed',
          canCancelUntil: new Date(new Date(selectedDate).getTime() - 12 * 3600 * 1000).toISOString(),
        };

        addConfirmedBooking(fallbackBooking);
        setConfirmedBooking(fallbackBooking);
        setCurrentStep(3);
      }
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#FAF8F3',
        minHeight: '100vh',
        paddingTop: '2.5rem',
        paddingBottom: '5rem',
      }}
    >
      <div className="container" style={{ maxWidth: '1040px' }}>
        {/* Top Navigation Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {onClose && (
              <button
                onClick={onClose}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.5rem 0.85rem', backgroundColor: '#FFFFFF', borderColor: '#E8E2D5', color: '#191919' }}
              >
                <ArrowLeft size={16} />
                <span>Back to Home</span>
              </button>
            )}
            <div>
              <span className="section-eyebrow" style={{ marginBottom: '0.25rem', fontSize: '0.75rem', backgroundColor: '#FAF8F3', borderColor: '#E8E2D5', color: '#9D7916' }}>
                SMART RESERVATION ENGINE
              </span>
              <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', color: '#191919', textTransform: 'uppercase', fontWeight: 800 }}>
                BOOK YOUR MATCH SLOT
              </h1>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="badge-status-open">
              <span className="pulse-dot" /> Instant Confirmation
            </span>
          </div>
        </div>

        {/* Wizard Step Progress Bar */}
        {currentStep < 3 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 'clamp(0.5rem, 2vw, 1rem)',
              marginBottom: '2rem',
            }}
          >
            {[
              { num: 1, title: 'Date & Time Slot' },
              { num: 2, title: 'Details & Payment' },
            ].map((s) => {
              const isActive = currentStep === s.num;
              const isPast = currentStep > s.num;

              return (
                <div
                  key={s.num}
                  style={{
                    backgroundColor: isActive ? '#FFFFFF' : '#FFFFFF',
                    border: isActive
                      ? '1.5px solid #C9A227'
                      : isPast
                      ? '1px solid #E8E2D5'
                      : '1px solid #E8E2D5',
                    borderRadius: 'var(--radius-md)',
                    padding: 'clamp(0.65rem, 1.5vw, 0.85rem) clamp(0.75rem, 2vw, 1.15rem)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'clamp(0.45rem, 1.5vw, 0.75rem)',
                    transition: 'all var(--transition-fast)',
                    boxShadow: isActive ? '0 4px 15px rgba(201, 162, 39, 0.15)' : 'var(--shadow-subtle)',
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      width: '1.85rem',
                      height: '1.85rem',
                      borderRadius: '50%',
                      backgroundColor: isActive
                        ? '#C9A227'
                        : isPast
                        ? '#218653'
                        : '#FAF8F3',
                      color: isActive
                        ? '#191919'
                        : isPast
                        ? '#FFFFFF'
                        : '#666666',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      flexShrink: 0,
                      boxShadow: isActive ? '0 2px 8px rgba(201, 162, 39, 0.25)' : 'none',
                    }}
                  >
                    {isPast ? <Check size={14} /> : s.num}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <span style={{ fontSize: '0.65rem', color: '#666666', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>
                      Step 0{s.num}
                    </span>
                    <strong style={{ fontSize: '0.875rem', color: isActive ? '#9D7916' : '#191919', display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {s.title}
                    </strong>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* =========================================================================
            STEP 1: CHOOSE DATE, DURATION & TIME SLOT
            ========================================================================= */}
        {false && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Sport Selection */}
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.35rem', color: '#191919', fontFamily: 'var(--font-heading)', fontWeight: 800, marginBottom: '0.25rem' }}>
                  1. Select Your Sport
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#666666' }}>
                  Only compatible grounds will be presented for the selected sport.
                </p>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '1rem',
                }}
              >
                {initialSports.map((sport) => {
                  const isSelected = selectedSport.id === sport.id;
                  return (
                    <div
                      key={sport.id}
                      onClick={() => handleSportChange(sport)}
                      className="card-turf"
                      style={{
                        cursor: 'pointer',
                        padding: '1.25rem',
                        border: isSelected ? '2px solid #C9A227' : '1px solid #E8E2D5',
                        backgroundColor: isSelected ? '#FAF8F3' : '#FFFFFF',
                        boxShadow: isSelected ? '0 4px 16px rgba(201, 162, 39, 0.12)' : '0 2px 8px rgba(0, 0, 0, 0.02)',
                        borderRadius: '16px',
                        position: 'relative',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ height: '110px', borderRadius: '12px', overflow: 'hidden', marginBottom: '0.85rem' }}>
                        <img
                          src={sport.coverImage}
                          alt={sport.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <h4 style={{ fontSize: '1.05rem', color: '#191919', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
                          {sport.name}
                        </h4>
                        {isSelected && (
                          <div style={{ width: '1.25rem', height: '1.25rem', borderRadius: '50%', backgroundColor: '#C9A227', color: '#191919', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </div>

                      <span style={{ fontSize: '0.75rem', color: '#666666', display: 'block', marginBottom: '0.5rem' }}>
                        {sport.format}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
                        <span style={{ fontSize: '0.7rem', color: '#666666' }}>From</span>
                        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 800, color: '#C9A227' }}>
                          ₹{sport.startingHourlyRate}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#666666' }}>/ hr</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Compatible Grounds Selection */}
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.35rem', color: '#191919', fontFamily: 'var(--font-heading)', fontWeight: 800, marginBottom: '0.25rem' }}>
                  2. Choose Compatible Playing Area
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#666666' }}>
                  The grounds below support {selectedSport.name}.
                </p>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '1.25rem',
                }}
              >
                {compatibleGrounds.map((ground) => {
                  const isSelected = selectedGround.id === ground.id;
                  return (
                    <div
                      key={ground.id}
                      onClick={() => handleGroundChange(ground)}
                      className="card-turf"
                      style={{
                        cursor: 'pointer',
                        padding: '1.5rem',
                        border: isSelected ? '2px solid #C9A227' : '1px solid #E8E2D5',
                        backgroundColor: isSelected ? '#FAF8F3' : '#FFFFFF',
                        boxShadow: isSelected ? '0 4px 16px rgba(201, 162, 39, 0.12)' : '0 2px 8px rgba(0, 0, 0, 0.02)',
                        borderRadius: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <h4 style={{ fontSize: '1.15rem', color: '#191919', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
                            {ground.name}
                          </h4>
                          {isSelected ? (
                            <span style={{ backgroundColor: '#C9A227', color: '#191919', fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '9999px', textTransform: 'uppercase' }}>Selected</span>
                          ) : (
                            <span style={{ backgroundColor: '#FAF8F3', border: '1px solid #E8E2D5', color: '#666666', fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.55rem', borderRadius: '9999px' }}>Compatible</span>
                          )}
                        </div>

                        <p style={{ fontSize: '0.85rem', color: '#666666', lineHeight: 1.5, marginBottom: '1rem' }}>
                          {ground.description}
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.8rem', color: '#191919' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <MapPin size={14} style={{ color: '#C9A227' }} />
                            <span>{ground.dimensions}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <ShieldCheck size={14} style={{ color: '#C9A227' }} />
                            <span>{ground.surfaceType}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <Sparkles size={14} style={{ color: '#C9A227' }} />
                            <span>{ground.lightingSpec}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid #E8E2D5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.8rem', color: '#666666' }}>Capacity: {ground.capacity} players</span>
                        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 800, color: '#C9A227' }}>
                          Base ₹{ground.baseHourlyRate}/hr
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Next Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button
                onClick={() => setCurrentStep(2)}
                className="btn btn-primary btn-lg"
              >
                <span>Continue to Select Date & Slot</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 1: CHOOSE DATE, DURATION & TIME SLOT
            ========================================================================= */}
        {currentStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header info */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                padding: '1.25rem 1.5rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #E8E2D5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                boxShadow: 'var(--shadow-subtle)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: '#9D7916', textTransform: 'uppercase', fontWeight: 700 }}>
                  TURFZONE Match Booking
                </span>
                <h3 style={{ fontSize: '1.25rem', color: '#191919', marginTop: '2px', fontWeight: 700 }}>
                  Select Date, Duration & Time Slot
                </h3>
              </div>
            </div>

            {/* Double-Booking Conflict Notification Banner */}
            {slotConflictError && (
              <div
                style={{
                  padding: '1rem 1.25rem',
                  backgroundColor: 'rgba(217, 67, 67, 0.1)',
                  border: '1.5px solid #D94343',
                  borderRadius: 'var(--radius-md)',
                  color: '#191919',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <AlertCircle size={22} style={{ color: '#D94343', flexShrink: 0 }} />
                <div>
                  <strong style={{ color: '#D94343', display: 'block', fontSize: '0.95rem', marginBottom: '0.2rem' }}>
                    Double-Booking Conflict
                  </strong>
                  <span style={{ fontSize: '0.85rem' }}>{slotConflictError}</span>
                </div>
              </div>
            )}

            {/* Date Picker (Next 14 Days Pills) */}
            <div>
              <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.35rem', color: '#191919', marginBottom: '0.25rem', fontWeight: 700 }}>
                    1. Choose Date
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#666666' }}>
                    Bookings open for the next 14 days. Advance booking guarantees prime floodlit hours.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#666666' }}>
                  <Calendar size={15} style={{ color: '#C9A227' }} />
                  <span>Selected: <strong style={{ color: '#191919' }}>{selectedDate}</strong></span>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '0.65rem',
                  overflowX: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  scrollSnapType: 'x mandatory',
                  paddingBottom: '0.75rem',
                }}
              >
                {availableDates.map((item) => {
                  const isSelected = selectedDate === item.dateStr;
                  return (
                    <button
                      key={item.dateStr}
                      onClick={() => {
                        setSelectedDate(item.dateStr);
                        setSelectedStartSlot(null);
                        setSlotConflictError(null);
                      }}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected ? '1.5px solid #9D7916' : '1px solid #E8E2D5',
                        backgroundColor: isSelected ? '#C9A227' : '#FFFFFF',
                        color: isSelected ? '#191919' : '#191919',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem',
                        minWidth: '88px',
                        minHeight: '44px',
                        flexShrink: 0,
                        scrollSnapAlign: 'start',
                        transition: 'all var(--transition-fast)',
                        boxShadow: isSelected ? '0 4px 15px rgba(201, 162, 39, 0.3)' : 'var(--shadow-subtle)',
                      }}
                    >
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', opacity: isSelected ? 0.9 : 0.65 }}>
                        {item.displayDay}
                      </span>
                      <strong style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                        {item.displayDate}
                      </strong>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Duration & Slot Selection Mode */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.35rem', color: '#191919', marginBottom: '0.25rem', fontWeight: 700 }}>
                    2. Choose Match Duration or Manual Time
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#666666' }}>
                    Pick a quick preset rate or manually select your custom start and end time.
                  </p>
                </div>

                {/* Mode Switch Tabs */}
                <div style={{ display: 'flex', flexWrap: 'wrap', backgroundColor: '#FFFFFF', padding: '0.3rem', borderRadius: 'var(--radius-md)', border: '1px solid #E8E2D5', gap: '0.35rem', boxShadow: 'var(--shadow-subtle)', width: '100%', maxWidth: '380px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectionMode('preset')}
                    style={{
                      flex: 1,
                      minWidth: '130px',
                      justifyContent: 'center',
                      padding: '0.55rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      backgroundColor: selectionMode === 'preset' ? '#C9A227' : 'transparent',
                      color: selectionMode === 'preset' ? '#191919' : '#666666',
                      fontWeight: 700,
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      minHeight: '38px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Clock size={14} />
                    <span>Quick Durations</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectionMode('manual');
                      if (!selectedStartSlot) {
                        const firstAvail = daySlots.find((s) => s.status === 'available');
                        if (firstAvail) setSelectedStartSlot(firstAvail);
                      }
                    }}
                    style={{
                      flex: 1,
                      minWidth: '130px',
                      justifyContent: 'center',
                      padding: '0.55rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      backgroundColor: selectionMode === 'manual' ? '#C9A227' : 'transparent',
                      color: selectionMode === 'manual' ? '#191919' : '#666666',
                      fontWeight: 700,
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      minHeight: '38px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Sliders size={14} />
                    <span>Manual Time</span>
                  </button>
                </div>
              </div>

              {/* Mode 1: Preset Duration Buttons */}
              {selectionMode === 'preset' ? (
                <div
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                  }}
                >
                  {DURATION_OPTIONS.map((opt) => {
                    const isSelected = durationMinutes === opt.minutes;
                    return (
                      <button
                        key={opt.minutes}
                        onClick={() => handleDurationChange(opt.minutes)}
                        style={{
                          padding: '0.75rem 1.25rem',
                          borderRadius: 'var(--radius-full)',
                          border: isSelected ? '1.5px solid #9D7916' : '1px solid #E8E2D5',
                          backgroundColor: isSelected ? '#C9A227' : '#FFFFFF',
                          color: isSelected ? '#191919' : '#191919',
                          fontFamily: 'var(--font-heading)',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          boxShadow: isSelected ? '0 4px 15px rgba(201, 162, 39, 0.25)' : 'var(--shadow-subtle)',
                        }}
                      >
                        <Clock size={15} style={{ color: isSelected ? '#191919' : '#C9A227' }} />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Mode 2: Manual Time Selection Controls */
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1.5px solid #E8E2D5',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.5rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '1.25rem',
                    alignItems: 'end',
                    boxShadow: 'var(--shadow-card)',
                  }}
                >
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', fontWeight: 600, marginBottom: '0.45rem' }}>
                      Start Time (Kick-Off)
                    </label>
                    <select
                      value={selectedStartSlot ? selectedStartSlot.startTime : ''}
                      onChange={(e) => handleManualStartTimeSelect(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: '#FFFFFF',
                        border: '1.5px solid #E8E2D5',
                        color: '#191919',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <option value="">Select Start Time...</option>
                      {daySlots.map((s) => (
                        <option
                          key={s.id}
                          value={s.startTime}
                          disabled={s.status !== 'available' && s.status !== 'selected'}
                        >
                          {s.startTime} {s.status !== 'available' && s.status !== 'selected' ? `(${s.status.toUpperCase()})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', fontWeight: 600, marginBottom: '0.45rem' }}>
                      End Time (Wrap-Up)
                    </label>
                    <select
                      value={pricingBreakdown.endTime}
                      onChange={(e) => handleManualEndTimeSelect(e.target.value)}
                      disabled={!selectedStartSlot}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: '#FFFFFF',
                        border: '1.5px solid #E8E2D5',
                        color: '#191919',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        cursor: selectedStartSlot ? 'pointer' : 'not-allowed',
                        opacity: selectedStartSlot ? 1 : 0.6,
                      }}
                    >
                      <option value="">Select End Time...</option>
                      {availableEndTimes.map((opt) => (
                        <option key={opt.time} value={opt.time} disabled={opt.disabled}>
                          {opt.time} ({opt.durationMins / 60}h — ₹{opt.rate}){opt.disabled ? ' [Blocked]' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div
                    style={{
                      backgroundColor: '#FAF8F3',
                      padding: '0.85rem 1.25rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid #E8E2D5',
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', color: '#666666', textTransform: 'uppercase' }}>
                      Manual Selection Total
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: '#191919' }}>
                        {pricingBreakdown.durationMinutes / 60} Hour(s)
                      </span>
                      <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800, color: '#C9A227' }}>
                        ₹{pricingBreakdown.groundCharge}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Slot Legend & Grid */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.35rem', color: '#191919', marginBottom: '0.25rem', fontWeight: 700 }}>
                    {selectionMode === 'manual' ? '3. Time Slots Grid (Click to Select Range)' : `3. Select Start Time Slot (${durationMinutes / 60} hr booking)`}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#666666' }}>
                    {selectionMode === 'manual'
                      ? 'Click any start slot and end slot to select your manual match interval.'
                      : `Click any available slot to start your ${durationMinutes / 60}-hour match.`}
                  </p>
                </div>

                {/* State Legend (Section 8 Time-slot Colors) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: '#666666', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#FFFFFF', border: '1px solid #E8E2D5' }} />
                    <span>Available</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#C9A227' }} />
                    <span>Selected Range</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#F3F3F3', border: '1px solid #E2E2E2' }} />
                    <span>Booked</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#FBF6EB', border: '1px solid #E9D9A7' }} />
                    <span>Held</span>
                  </div>
                </div>
              </div>

              {/* Conflict Error Message */}
              {slotConflictError && (
                <div
                  style={{
                    backgroundColor: 'rgba(217, 67, 67, 0.1)',
                    border: '1px solid #D94343',
                    padding: '0.85rem 1.25rem',
                    borderRadius: 'var(--radius-md)',
                    color: '#191919',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    marginBottom: '1.25rem',
                    fontSize: '0.9rem',
                  }}
                >
                  <AlertCircle size={18} style={{ color: '#D94343', flexShrink: 0 }} />
                  <span>{slotConflictError}</span>
                </div>
              )}

              {/* Time Slots Grid (Section 8 Exact Styling) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 140px), 1fr))',
                  gap: 'clamp(0.55rem, 1.5vw, 0.85rem)',
                }}
              >
                {daySlots.map((slot) => {
                  const isInRange = isSlotInSelectedRange(slot);
                  const isStartSlot = selectedStartSlot?.id === slot.id;
                  const isBooked = slot.status === 'booked';
                  const isHeld = slot.status === 'held';
                  const isUnavailable = slot.status === 'unavailable';
                  const isHardDisabled = isBooked || isHeld || isUnavailable;

                  // Dynamic prospective end time based on selected match duration
                  const slotEndInfo = getSlotEndForDuration(slot, durationMinutes, daySlots);
                  const canStartDuration = slotEndInfo.isAvailableForDuration;
                  const isClickable = !isHardDisabled && (selectionMode === 'manual' || canStartDuration || isInRange);

                  const displayEndTime = isInRange
                    ? (isStartSlot ? pricingBreakdown.endTime : slotEndInfo.endTime)
                    : slotEndInfo.endTime;

                  // Section 8 exact background and border color resolution:
                  // Available: white background with subtle beige border.
                  // Selected: gold background with dark text.
                  // Booked: light gray background with muted text and disabled interaction.
                  // Unavailable: clearly disabled gray state.
                  // Peak pricing: subtle champagne highlight.
                  let slotBg = '#FFFFFF';
                  let slotBorder = '1px solid #E8E2D5';
                  let textColor = '#191919';

                  if (isInRange) {
                    slotBg = '#C9A227';
                    slotBorder = '2px solid #9D7916';
                    textColor = '#191919';
                  } else if (isBooked) {
                    slotBg = '#F3F3F3';
                    slotBorder = '1px solid #E2E2E2';
                    textColor = '#999999';
                  } else if (isHeld) {
                    slotBg = '#FBF6EB';
                    slotBorder = '1px solid #E9D9A7';
                    textColor = '#B7791F';
                  } else if (isUnavailable || !canStartDuration) {
                    slotBg = '#F8F8F8';
                    slotBorder = '1px solid #EBEBEB';
                    textColor = '#AAAAAA';
                  } else if (slot.isPeak) {
                    slotBg = '#FDF8EE'; // subtle champagne highlight
                    slotBorder = '1px solid #E9D9A7';
                    textColor = '#191919';
                  }

                  return (
                    <div
                      key={slot.id}
                      onClick={() => isClickable && handleSlotSelect(slot)}
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        border: slotBorder,
                        backgroundColor: slotBg,
                        cursor: isClickable ? 'pointer' : 'not-allowed',
                        opacity: isHardDisabled ? 0.6 : !canStartDuration && !isInRange ? 0.65 : 1,
                        transition: 'all var(--transition-fast)',
                        boxShadow: isInRange ? '0 4px 18px rgba(201, 162, 39, 0.3)' : 'var(--shadow-subtle)',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                      onMouseEnter={(e) => {
                        if (isClickable && !isInRange) {
                          e.currentTarget.style.borderColor = '#C9A227';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(201, 162, 39, 0.15)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (isClickable && !isInRange) {
                          e.currentTarget.style.borderColor = slot.isPeak ? '#E9D9A7' : '#E8E2D5';
                          e.currentTarget.style.boxShadow = 'var(--shadow-subtle)';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 700, color: textColor }}>
                          {slot.startTime}
                        </span>
                        {isInRange && isStartSlot && (
                          <span style={{ fontSize: '0.65rem', backgroundColor: '#191919', color: '#FFFFFF', fontWeight: 800, padding: '0.15rem 0.4rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                            {durationMinutes / 60}h Selected
                          </span>
                        )}
                        {isInRange && !isStartSlot && (
                          <span style={{ fontSize: '0.65rem', backgroundColor: 'rgba(25, 25, 25, 0.12)', color: '#191919', border: '1px solid #191919', fontWeight: 800, padding: '0.15rem 0.4rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                            In Range
                          </span>
                        )}
                        {!isInRange && slot.isPeak && !isHardDisabled && canStartDuration && (
                          <span style={{ fontSize: '0.65rem', color: '#9D7916', fontWeight: 700, textTransform: 'uppercase', backgroundColor: '#FAF8F3', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid #E9D9A7' }}>
                            Floodlights
                          </span>
                        )}
                        {isBooked && (
                          <span style={{ fontSize: '0.65rem', color: '#D94343', fontWeight: 700, textTransform: 'uppercase' }}>
                            Booked
                          </span>
                        )}
                        {isHeld && (
                          <span style={{ fontSize: '0.65rem', color: '#B7791F', fontWeight: 700, textTransform: 'uppercase' }}>
                            Held (4m)
                          </span>
                        )}
                        {isUnavailable && (
                          <span style={{ fontSize: '0.65rem', color: '#888888', fontWeight: 700, textTransform: 'uppercase' }}>
                            Prep
                          </span>
                        )}
                        {!isHardDisabled && !canStartDuration && !isInRange && (
                          <span style={{ fontSize: '0.65rem', color: '#D94343', fontWeight: 700, textTransform: 'uppercase' }}>
                            {slotEndInfo.unavailabilityReason === 'Exceeds Closing (01:00 AM)' ? 'Past Close' : 'Conflict'}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: isInRange ? '#191919' : '#666666' }}>
                        <span style={{ fontWeight: isInRange ? 600 : 400 }}>
                          To {displayEndTime}
                        </span>
                        {!isHardDisabled && (
                          <span style={{ fontWeight: 700, color: isInRange ? '#191919' : canStartDuration ? '#218653' : '#888888' }}>
                            {isInRange ? '✓ Selected' : canStartDuration ? 'Available' : 'Unavailable'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Slot Summary Bar & Action */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1.5px solid #E8E2D5',
                borderRadius: 'var(--radius-lg)',
                padding: 'clamp(1rem, 3vw, 1.5rem)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Current Slot Reservation
                </span>
                {selectedStartSlot ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                    <h4 style={{ fontSize: 'clamp(1.05rem, 0.95rem + 0.4vw, 1.25rem)', color: '#191919', fontWeight: 700 }}>
                      {pricingBreakdown.startTime} – {pricingBreakdown.endTime} ({pricingBreakdown.durationMinutes} mins)
                    </h4>
                    <span className="badge-status-open">Confirmed Available</span>
                  </div>
                ) : (
                  <div style={{ color: '#B7791F', fontSize: '0.9rem', marginTop: '0.25rem', fontWeight: 600 }}>
                    Please select an available start slot from the grid above
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', width: '100%', maxWidth: '440px', justifyContent: 'flex-end' }}>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="btn btn-secondary btn-mobile-full"
                    style={{ backgroundColor: '#FFFFFF', borderColor: '#E8E2D5', color: '#191919' }}
                  >
                    <ArrowLeft size={16} />
                    <span>Back to Home</span>
                  </button>
                )}

                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={!selectedStartSlot}
                  className="btn btn-primary btn-mobile-full"
                  style={{
                    opacity: selectedStartSlot ? 1 : 0.5,
                    cursor: selectedStartSlot ? 'pointer' : 'not-allowed',
                    backgroundColor: '#C9A227',
                    color: '#191919',
                  }}
                >
                  <span>Continue to Details & Payment</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 3: OPTIONAL ADD-ONS & EQUIPMENT RENTAL (REMOVED)
            ========================================================================= */}
        {false && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
              <h3 style={{ fontSize: '1.35rem', color: 'var(--color-stadium-white)', marginBottom: '0.25rem' }}>
                Match Equipment & Add-On Services
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-muted-sage)' }}>
                Equip your squad with fresh match balls, referee supervision, or 4K highlight video recording. All equipment is sanitised and ready on pitch arrival.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
              {initialAddOns.map((addon) => {
                const count = selectedAddOnCounts[addon.id] || 0;
                const isSelected = count > 0;

                return (
                  <div
                    key={addon.id}
                    className="card-turf"
                    style={{
                      padding: '1.5rem',
                      border: isSelected ? '1.5px solid #C9A227' : '1px solid #E8E2D5',
                      backgroundColor: isSelected ? '#FAF8F3' : '#FFFFFF',
                      borderRadius: '16px',
                      boxShadow: isSelected ? '0 4px 16px rgba(201, 162, 39, 0.12)' : '0 2px 8px rgba(0, 0, 0, 0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <h4 style={{ fontSize: '1.05rem', color: '#191919', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
                          {addon.name}
                        </h4>
                        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 800, color: '#C9A227' }}>
                          ₹{addon.price}
                        </span>
                      </div>

                      <p style={{ fontSize: '0.85rem', color: '#666666', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                        {addon.description}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.85rem', borderTop: '1px solid #E8E2D5' }}>
                      <span style={{ fontSize: '0.75rem', color: '#666666', textTransform: 'uppercase', fontWeight: 600 }}>
                        {addon.priceType.replace('_', ' ')}
                      </span>

                      {/* Quantity Selector */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <button
                          type="button"
                          onClick={() => updateAddOnCount(addon.id, -1)}
                          disabled={count === 0}
                          style={{
                            width: '2rem',
                            height: '2rem',
                            borderRadius: '8px',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E8E2D5',
                            color: '#191919',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: count > 0 ? 'pointer' : 'not-allowed',
                            opacity: count > 0 ? 1 : 0.4,
                          }}
                        >
                          -
                        </button>
                        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 700, color: '#191919', minWidth: '1.2rem', textAlign: 'center' }}>
                          {count}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateAddOnCount(addon.id, 1)}
                          style={{
                            width: '2rem',
                            height: '2rem',
                            borderRadius: '8px',
                            backgroundColor: '#FAF8F3',
                            border: '1px solid #C9A227',
                            color: '#9D7916',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <button
                onClick={() => setCurrentStep(2)}
                className="btn btn-secondary"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E2D5', color: '#191919' }}
              >
                <ArrowLeft size={16} />
                <span>Back to Slots</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <span style={{ fontSize: '0.9rem', color: '#666666' }}>
                  Add-Ons Total: <strong style={{ color: '#C9A227', fontSize: '1.1rem' }}>₹{pricingBreakdown.addOnsTotal}</strong>
                </span>

                <button
                  onClick={() => setCurrentStep(4)}
                  className="btn btn-primary btn-lg"
                  style={{ backgroundColor: '#C9A227', color: '#191919', fontWeight: 700 }}
                >
                  <span>Review Fare & Player Info</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 2: CUSTOMER DETAILS & PAYMENT
            ========================================================================= */}
        {currentStep === 2 && (
          <form onSubmit={handleProceedToPayment}>
            <div style={{ marginBottom: '1.25rem' }}>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', backgroundColor: '#FFFFFF', borderColor: '#E8E2D5', color: '#191919' }}
              >
                <ArrowLeft size={15} />
                <span>Back to Slot Selection</span>
              </button>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
                gap: 'clamp(1.25rem, 3vw, 2rem)',
                alignItems: 'start',
              }}
            >
              {/* Left Column: Player Details & Payment Preferences */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Contact Card */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E8E2D5',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'clamp(1.25rem, 3vw, 1.75rem)',
                    boxShadow: 'var(--shadow-subtle)',
                  }}
                >
                  <h3 style={{ fontSize: '1.25rem', color: '#191919', marginBottom: '0.25rem', fontWeight: 700 }}>
                    1. Primary Player Contact
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#666666', marginBottom: '1.25rem' }}>
                    Match confirmation and security entry code will be sent to this mobile number.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Full Name */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', fontWeight: 600, marginBottom: '0.35rem' }}>
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.85rem 1rem',
                          backgroundColor: '#FFFFFF',
                          border: '1.5px solid #E8E2D5',
                          borderRadius: 'var(--radius-md)',
                          color: '#191919',
                          fontFamily: 'inherit',
                          fontSize: '16px',
                          minHeight: '44px',
                          outlineColor: '#C9A227',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    {/* Mobile Number */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', fontWeight: 600, marginBottom: '0.35rem' }}>
                        10-Digit Mobile Number *
                      </label>
                      <input
                        type="tel"
                        required
                        pattern="[0-9]{10}"
                        placeholder="e.g. 9876543210"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.85rem 1rem',
                          backgroundColor: '#FFFFFF',
                          border: '1.5px solid #E8E2D5',
                          borderRadius: 'var(--radius-md)',
                          color: '#191919',
                          fontFamily: 'inherit',
                          fontSize: '16px',
                          minHeight: '44px',
                          outlineColor: '#C9A227',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', fontWeight: 600, marginBottom: '0.35rem' }}>
                        Email Address (for GST Invoice & Receipt)
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. rahul@example.com"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.85rem 1rem',
                          backgroundColor: '#FFFFFF',
                          border: '1.5px solid #E8E2D5',
                          borderRadius: 'var(--radius-md)',
                          color: '#191919',
                          fontFamily: 'inherit',
                          fontSize: '16px',
                          minHeight: '44px',
                          outlineColor: '#C9A227',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    {/* Booking Notes / Team Name */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', fontWeight: 600, marginBottom: '0.35rem' }}>
                        Team Name / Match Notes (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. FC Thunderbolts vs Super Strikers"
                        value={customerInfo.notes}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.85rem 1rem',
                          backgroundColor: '#FFFFFF',
                          border: '1.5px solid #E8E2D5',
                          borderRadius: 'var(--radius-md)',
                          color: '#191919',
                          fontFamily: 'inherit',
                          fontSize: '16px',
                          minHeight: '44px',
                          outlineColor: '#C9A227',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Option Toggle (Full vs 25% Advance) */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E8E2D5',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'clamp(1.25rem, 3vw, 1.75rem)',
                    boxShadow: 'var(--shadow-subtle)',
                  }}
                >
                  <h3 style={{ fontSize: '1.25rem', color: '#191919', marginBottom: '0.25rem', fontWeight: 700 }}>
                    2. Payment Structure
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#666666', marginBottom: '1.25rem' }}>
                    Choose to prepay in full or reserve with a 25% security deposit.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
                    <div
                      onClick={() => setPaymentOption('full')}
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        border: paymentOption === 'full' ? '1.5px solid #C9A227' : '1px solid #E8E2D5',
                        backgroundColor: paymentOption === 'full' ? '#FAF8F3' : '#FFFFFF',
                        cursor: 'pointer',
                        boxShadow: paymentOption === 'full' ? '0 2px 10px rgba(201, 162, 39, 0.12)' : 'none',
                        transition: 'all 0.2s ease',
                        minHeight: '44px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <strong style={{ fontSize: '0.95rem', color: '#191919' }}>
                          100% Full Payment
                        </strong>
                        {paymentOption === 'full' && <Check size={16} style={{ color: '#9D7916' }} />}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#666666', display: 'block' }}>
                        Zero balance due at venue
                      </span>
                    </div>

                    <div
                      onClick={() => setPaymentOption('advance')}
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        border: paymentOption === 'advance' ? '1.5px solid #C9A227' : '1px solid #E8E2D5',
                        backgroundColor: paymentOption === 'advance' ? '#FAF8F3' : '#FFFFFF',
                        cursor: 'pointer',
                        boxShadow: paymentOption === 'advance' ? '0 2px 10px rgba(201, 162, 39, 0.12)' : 'none',
                        transition: 'all 0.2s ease',
                        minHeight: '44px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <strong style={{ fontSize: '0.95rem', color: '#191919' }}>
                          25% Advance Deposit
                        </strong>
                        {paymentOption === 'advance' && <Check size={16} style={{ color: '#9D7916' }} />}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#666666', display: 'block' }}>
                        Pay remaining 75% at counter
                      </span>
                    </div>
                  </div>

                  {/* Payment Method Switcher */}
                  <h4 style={{ fontSize: '0.85rem', color: '#191919', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                    Payment Mode
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: '0.85rem' }}>
                    <div
                      onClick={() => setPaymentMethod('razorpay')}
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        border: paymentMethod === 'razorpay' ? '1.5px solid #C9A227' : '1px solid #E8E2D5',
                        backgroundColor: paymentMethod === 'razorpay' ? '#FAF8F3' : '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        boxShadow: paymentMethod === 'razorpay' ? '0 2px 10px rgba(201, 162, 39, 0.12)' : 'none',
                        transition: 'all 0.2s ease',
                        minHeight: '44px',
                      }}
                    >
                      <CreditCard size={18} style={{ color: paymentMethod === 'razorpay' ? '#9D7916' : '#666666', flexShrink: 0 }} />
                      <div>
                        <strong style={{ fontSize: '0.9rem', color: '#191919', display: 'block' }}>
                          Online (Razorpay)
                        </strong>
                        <span style={{ fontSize: '0.7rem', color: '#666666' }}>
                          UPI / Cards / NetBanking
                        </span>
                      </div>
                    </div>

                    <div
                      onClick={() => setPaymentMethod('pay_at_venue')}
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        border: paymentMethod === 'pay_at_venue' ? '1.5px solid #C9A227' : '1px solid #E8E2D5',
                        backgroundColor: paymentMethod === 'pay_at_venue' ? '#FAF8F3' : '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        boxShadow: paymentMethod === 'pay_at_venue' ? '0 2px 10px rgba(201, 162, 39, 0.12)' : 'none',
                        transition: 'all 0.2s ease',
                        minHeight: '44px',
                      }}
                    >
                      <Building2 size={18} style={{ color: paymentMethod === 'pay_at_venue' ? '#9D7916' : '#666666', flexShrink: 0 }} />
                      <div>
                        <strong style={{ fontSize: '0.9rem', color: '#191919', display: 'block' }}>
                          Pay at Venue
                        </strong>
                        <span style={{ fontSize: '0.7rem', color: '#666666' }}>
                          Cash / Card at counter
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Authoritative Live Booking & Pricing Summary */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid #E8E2D5',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'clamp(1.25rem, 3vw, 1.75rem)',
                  position: 'sticky',
                  top: '6rem',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid #E8E2D5', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#9D7916', fontWeight: 700, textTransform: 'uppercase' }}>
                      Live Fare Breakdown
                    </span>
                    <h3 style={{ fontSize: 'clamp(1.2rem, 1.1rem + 0.4vw, 1.35rem)', color: '#191919', fontWeight: 700 }}>
                      Booking Summary
                    </h3>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.3rem 0.65rem', borderRadius: 'var(--radius-full)', backgroundColor: '#FAF8F3', color: '#9D7916', border: '1px solid #E8E2D5' }}>
                    {pricingBreakdown.sportName}
                  </span>
                </div>

                {/* Match details table */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ color: '#666666' }}>Ground</span>
                    <strong style={{ color: '#191919', textAlign: 'right' }}>{pricingBreakdown.groundName}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ color: '#666666' }}>Date</span>
                    <strong style={{ color: '#191919' }}>{pricingBreakdown.date}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ color: '#666666' }}>Slot Time</span>
                    <strong style={{ color: '#9D7916' }}>
                      {pricingBreakdown.startTime} – {pricingBreakdown.endTime}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ color: '#666666' }}>Duration</span>
                    <strong style={{ color: '#191919' }}>{pricingBreakdown.durationMinutes} Minutes</strong>
                  </div>
                </div>

                {/* Itemized charges */}
                <div style={{ borderTop: '1px solid #E8E2D5', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <span style={{ color: '#666666' }}>
                      Ground Charges ({pricingBreakdown.durationMinutes / 60}h @ ₹{pricingBreakdown.effectiveHourlyRate}/hr)
                    </span>
                    <span style={{ color: '#191919', fontWeight: 600, flexShrink: 0 }}>
                      ₹{pricingBreakdown.groundCharge.toFixed(2)}
                    </span>
                  </div>

                  {pricingBreakdown.selectedAddOns.map((item) => (
                    <div key={item.addon.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <span style={{ color: '#666666' }}>
                        {item.addon.name} (x{item.quantity})
                      </span>
                      <span style={{ color: '#191919', flexShrink: 0 }}>
                        ₹{item.total.toFixed(2)}
                      </span>
                    </div>
                  ))}

                  {appliedCoupon && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#218653', fontWeight: 600, gap: '0.5rem' }}>
                      <span>Discount ({appliedCoupon.code} - {appliedCoupon.discountPercentage}%)</span>
                      <span style={{ flexShrink: 0 }}>-₹{pricingBreakdown.discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <span style={{ color: '#666666' }}>Taxes & GST (5%)</span>
                    <span style={{ color: '#191919', flexShrink: 0 }}>
                      ₹{pricingBreakdown.taxAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Promo Code Input Box */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      placeholder="Promo Code (e.g. TURF20)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      style={{
                        flex: '1 1 140px',
                        padding: '0.65rem 0.85rem',
                        backgroundColor: '#FFFFFF',
                        border: '1.5px solid #E8E2D5',
                        borderRadius: 'var(--radius-sm)',
                        color: '#191919',
                        textTransform: 'uppercase',
                        fontFamily: 'inherit',
                        fontSize: '16px',
                        minHeight: '44px',
                        outlineColor: '#C9A227',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="btn btn-secondary btn-sm"
                      style={{ backgroundColor: '#FAF8F3', borderColor: '#E8E2D5', color: '#191919', minHeight: '44px' }}
                    >
                      <Tag size={14} style={{ color: '#C9A227' }} />
                      <span>Apply</span>
                    </button>
                  </div>

                  {couponError && (
                    <span style={{ fontSize: '0.75rem', color: '#D94343', display: 'block', marginTop: '0.35rem', fontWeight: 600 }}>
                      {couponError}
                    </span>
                  )}
                  {appliedCoupon && (
                    <span style={{ fontSize: '0.75rem', color: '#218653', display: 'block', marginTop: '0.35rem', fontWeight: 600 }}>
                      ✓ Promo "{appliedCoupon.code}" applied!
                    </span>
                  )}
                </div>

                {/* Total Amounts Box */}
                <div
                  style={{
                    backgroundColor: '#FAF8F3',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    marginBottom: '1.5rem',
                    border: '1.5px solid #E8E2D5',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', color: '#666666', fontWeight: 600 }}>
                      Total Booking Value
                    </span>
                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: '#191919' }}>
                      ₹{pricingBreakdown.totalAmount.toFixed(2)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid #E8E2D5' }}>
                    <span style={{ fontSize: '0.85rem', color: '#9D7916', fontWeight: 700 }}>
                      {paymentOption === 'advance' ? 'Payable Now (25% Deposit)' : 'Payable Now (Full Amount)'}
                    </span>
                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.65rem', fontWeight: 800, color: '#9D7916' }}>
                      ₹{pricingBreakdown.advanceAmount.toFixed(2)}
                    </span>
                  </div>

                  {paymentOption === 'advance' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#666666', marginTop: '0.35rem' }}>
                      <span>Remaining Balance at Counter</span>
                      <span style={{ fontWeight: 600, color: '#191919' }}>₹{pricingBreakdown.remainingBalance.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Confirm and Pay Button */}
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', justifyContent: 'center', backgroundColor: '#C9A227', color: '#191919', fontWeight: 800 }}
                >
                  <Sparkles size={18} />
                  <span>
                    {paymentMethod === 'razorpay'
                      ? `Pay ₹${pricingBreakdown.advanceAmount.toFixed(2)} Online`
                      : 'Confirm Booking (Pay at Venue)'}
                  </span>
                </button>

                <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#666666' }}>
                  <ShieldCheck size={14} style={{ color: '#218653' }} />
                  <span>Free cancellation up to {brandConfig.policy.cancellationWindowHours} hours before slot</span>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* =========================================================================
            CONFIRMATION SCREEN
            ========================================================================= */}
        {currentStep === 3 && confirmedBooking && (
          <div style={{ maxWidth: '680px', margin: '0 auto', width: '100%' }}>
            <div
              style={{
                padding: 'clamp(1.5rem, 4vw, 2.5rem) clamp(1rem, 3vw, 2rem)',
                backgroundColor: '#FFFFFF',
                border: '1.5px solid #E8E2D5',
                borderRadius: 'var(--radius-lg)',
                textAlign: 'center',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.08)',
              }}
            >
              {/* Success Checkmark Header */}
              <div
                style={{
                  width: '4.5rem',
                  height: '4.5rem',
                  borderRadius: '50%',
                  backgroundColor: '#FAF8F3',
                  border: '2px solid #C9A227',
                  color: '#C9A227',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem auto',
                }}
              >
                <CheckCircle2 size={40} />
              </div>

              <span style={{ display: 'inline-block', fontSize: '0.75rem', fontWeight: 800, padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-full)', backgroundColor: '#FAF8F3', color: '#9D7916', border: '1px solid #E8E2D5', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
                MATCH RESERVED & CONFIRMED
              </span>

              <h2 style={{ fontSize: 'clamp(1.4rem, 1.1rem + 1.2vw, 2rem)', color: '#191919', marginBottom: '0.5rem', fontWeight: 800 }}>
                You're In The Game!
              </h2>

              <p style={{ color: '#666666', fontSize: '0.95rem', marginBottom: '1.75rem' }}>
                We've reserved your slot at {brandConfig.location.venueName}. Your booking reference code has been recorded.
              </p>

              {/* Reference Badge Card */}
              <div
                style={{
                  backgroundColor: '#FAF8F3',
                  border: '1.5px dashed #C9A227',
                  borderRadius: 'var(--radius-md)',
                  padding: 'clamp(1rem, 2.5vw, 1.25rem) clamp(1rem, 3vw, 1.75rem)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '2rem',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div style={{ textAlign: 'left' }}>
                  <span style={{ fontSize: '0.75rem', color: '#666666', textTransform: 'uppercase', fontWeight: 600 }}>
                    Booking Reference ID
                  </span>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.65rem', fontWeight: 800, color: '#9D7916' }}>
                    {confirmedBooking.referenceCode}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <QrCode size={36} style={{ color: '#191919' }} />
                  <div style={{ textAlign: 'left', fontSize: '0.75rem', color: '#666666' }}>
                    <span style={{ color: '#218653', fontWeight: 700, display: 'block' }}>Verified Slot</span>
                    <span>Show on pitch arrival</span>
                  </div>
                </div>
              </div>

              {/* Match Receipt Details */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E8E2D5',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
                  marginBottom: '2rem',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  fontSize: '0.9rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666666' }}>Sport & Format</span>
                  <strong style={{ color: '#191919' }}>{confirmedBooking.sport.name}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666666' }}>Ground</span>
                  <strong style={{ color: '#191919' }}>{confirmedBooking.ground.name}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666666' }}>Date & Slot</span>
                  <strong style={{ color: '#9D7916' }}>
                    {confirmedBooking.date} • {confirmedBooking.startTime} to {confirmedBooking.endTime}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666666' }}>Customer</span>
                  <strong style={{ color: '#191919' }}>
                    {confirmedBooking.customer.name} ({confirmedBooking.customer.phone})
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid #E8E2D5' }}>
                  <span style={{ color: '#666666' }}>Total Booking Value</span>
                  <strong style={{ color: '#191919' }}>₹{confirmedBooking.pricing.totalAmount.toFixed(2)}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666666' }}>Payment Status</span>
                  <span style={{ fontWeight: 700, color: '#218653', textTransform: 'capitalize' }}>
                    {confirmedBooking.paymentStatus.replace('_', ' ')}
                  </span>
                </div>

                {confirmedBooking.pricing.remainingBalance > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#B7791F' }}>
                    <span>Remaining Balance at Venue</span>
                    <strong>₹{confirmedBooking.pricing.remainingBalance.toFixed(2)}</strong>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  onClick={() => window.print()}
                  className="btn btn-secondary"
                  style={{ backgroundColor: '#FFFFFF', borderColor: '#E8E2D5', color: '#191919' }}
                >
                  <Printer size={16} />
                  <span>Print Receipt</span>
                </button>

                {onViewMyBookings && (
                  <button
                    onClick={onViewMyBookings}
                    className="btn btn-primary"
                    style={{ backgroundColor: '#C9A227', color: '#191919' }}
                  >
                    <span>View in My Bookings</span>
                  </button>
                )}

                {onClose && (
                  <button
                    onClick={onClose}
                    className="btn btn-ghost"
                    style={{ color: '#666666' }}
                  >
                    <span>Return to Home</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Simulated Razorpay Modal */}
      <RazorpayModal
        isOpen={isRazorpayOpen}
        amount={pricingBreakdown.advanceAmount}
        customerName={customerInfo.name}
        customerPhone={customerInfo.phone}
        customerEmail={customerInfo.email}
        onClose={() => setIsRazorpayOpen(false)}
        onSuccess={() => finalizeBooking('razorpay', paymentOption === 'advance' ? 'advance_paid' : 'paid_online')}
      />
    </div>
  );
};
