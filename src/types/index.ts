export interface Sport {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  format: string;
  coverImage: string;
  startingHourlyRate: number;
  popular?: boolean;
  minDurationMinutes: number;
  maxPlayers: number;
  supportedGroundIds: string[];
  features: string[];
  isActive: boolean;
}

export interface Ground {
  id: string;
  name: string;
  slug: string;
  description: string;
  dimensions: string;
  surfaceType: string;
  lightingSpec: string;
  supportedSportIds: string[];
  baseHourlyRate: number;
  capacity: number;
  images: string[];
  isAvailable: boolean;
}

export interface FacilityItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  iconName: string;
  image?: string;
  badge?: string;
  specs?: string[];
}

export interface PricingRate {
  sportId: string;
  sportName: string;
  offPeakRate: number; // e.g. 6:00 AM - 4:00 PM
  peakRate: number;    // e.g. 4:00 PM - 12:00 AM
  weekendRate: number;
  minHours: number;
}

export interface AddOnCharge {
  id: string;
  name: string;
  description: string;
  price: number;
  priceType: 'per_session' | 'per_hour' | 'per_item';
  icon: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  caption: string;
  category: 'all' | 'cricket' | 'football' | 'night' | 'facilities';
  imageUrl: string;
  badge?: string;
}

export interface TurfBrandConfig {
  brandName: string;
  tagline: string;
  eyebrow: string;
  heroHeading: string;
  heroSubtitle: string;
  location: {
    venueName: string;
    address: string;
    area: string;
    city: string;
    googleMapsUrl: string;
  };
  operatingHours: {
    openTime: string;
    closeTime: string;
    daysText: string;
    note: string;
  };
  contact: {
    phone: string;
    whatsapp: string;
    email: string;
    instagram: string;
  };
  policy: {
    cancellationWindowHours: number;
    cancellationRefundPercentage: number;
    advanceDepositPercentage: number;
  };
}

export type SlotStatus = 'available' | 'selected' | 'booked' | 'held' | 'unavailable';

export interface TimeSlot {
  id: string;
  startTime: string; // e.g. "06:00 AM"
  endTime: string;   // e.g. "07:00 AM"
  hour: number;      // 6 to 24
  status: SlotStatus;
  isPeak: boolean;
  rate: number;
  holdExpiresInSeconds?: number;
  blockedReason?: string;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
  notes?: string;
}

export interface BookingPricingBreakdown {
  sportId: string;
  sportName: string;
  groundId: string;
  groundName: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  baseHourlyRate: number;
  effectiveHourlyRate: number;
  groundCharge: number;
  peakSurcharge: number;
  selectedAddOns: {
    addon: AddOnCharge;
    quantity: number;
    total: number;
  }[];
  addOnsTotal: number;
  couponCode?: string;
  discountPercentage: number;
  discountAmount: number;
  subtotal: number;
  taxAmount: number; // 5% GST
  totalAmount: number;
  advancePercentage: number;
  advanceAmount: number;
  remainingBalance: number;
}

export type PaymentMethod = 'razorpay' | 'pay_at_venue';
export type PaymentOption = 'full' | 'advance';
export type PaymentStatus = 'paid_online' | 'advance_paid' | 'pay_at_venue' | 'pending';
export type BookingStatus = 'confirmed' | 'cancelled' | 'completed';

export interface ConfirmedBooking {
  bookingId: string;
  referenceCode: string;
  createdAt: string;
  sport: Sport;
  ground: Ground;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  customer: CustomerInfo;
  pricing: BookingPricingBreakdown;
  paymentMethod: PaymentMethod;
  paymentOption: PaymentOption;
  paymentStatus: PaymentStatus;
  bookingStatus: BookingStatus;
  canCancelUntil: string;
}
