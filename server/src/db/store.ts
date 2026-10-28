import bcrypt from 'bcryptjs';
import { config } from '../config';
import type { TimeSlotInterval, PricingCalculationResult } from '../types';

export interface UserEntity {
  id: string;
  email: string;
  phone: string;
  name: string;
  passwordHash: string;
  role: 'CUSTOMER' | 'ADMIN' | 'STAFF';
  createdAt: string;
  updatedAt: string;
}

export interface SportEntity {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverImage: string;
  startingHourlyRate: number;
  minDurationMinutes: number;
  supportedGroundIds: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GroundEntity {
  id: string;
  name: string;
  slug: string;
  description: string;
  surfaceType: string;
  dimensions: string;
  lightingLux: number;
  capacity: number;
  baseHourlyRate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BlockedPeriodEntity {
  id: string;
  groundId: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  startMinuteOfDay: number;
  endMinuteOfDay: number;
  reason: string;
  blockedByUserId?: string;
  createdAt: string;
}

export interface BookingEntity {
  id: string;
  referenceCode: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  sportId: string;
  sportName: string;
  groundId: string;
  groundName: string;
  date: string;
  startTime: string;
  endTime: string;
  startMinuteOfDay: number;
  endMinuteOfDay: number;
  durationMinutes: number;
  bookingStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  paymentStatus: 'PENDING' | 'ADVANCE_PAID' | 'PAID_FULL' | 'REFUNDED';
  paymentMethod: 'RAZORPAY' | 'VENUE_CASH' | 'VENUE_CARD';
  paymentType: 'FULL' | 'ADVANCE';
  pricing: PricingCalculationResult;
  notes?: string;
  canCancelUntil?: string;
  holdExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentEntity {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  method: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  isVerified: boolean;
  createdAt: string;
  verifiedAt?: string;
}

export interface AuditLogEntity {
  id: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  ipAddress?: string;
  createdAt: string;
}

// In-Memory Database Store with Serialized Ground Mutex Locks
class DatabaseStore {
  public users: Map<string, UserEntity> = new Map();
  public sports: Map<string, SportEntity> = new Map();
  public grounds: Map<string, GroundEntity> = new Map();
  public blockedPeriods: Map<string, BlockedPeriodEntity> = new Map();
  public bookings: Map<string, BookingEntity> = new Map();
  public payments: Map<string, PaymentEntity> = new Map();
  public auditLogs: AuditLogEntity[] = [];

  // Ground Locks for Concurrency Control
  private groundMutexes: Map<string, Promise<void>> = new Map();

  constructor() {
    this.seedInitialData();
  }

  // Serialized Transaction Execution for Double-Booking Prevention
  public async withGroundLock<T>(groundId: string, operation: () => Promise<T>): Promise<T> {
    const currentLock = this.groundMutexes.get(groundId) || Promise.resolve();
    let releaseLock: () => void;
    const nextLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    this.groundMutexes.set(groundId, currentLock.then(() => nextLock));

    await currentLock;
    try {
      return await operation();
    } finally {
      releaseLock!();
      if (this.groundMutexes.get(groundId) === nextLock) {
        this.groundMutexes.delete(groundId);
      }
    }
  }

  private seedInitialData() {
    // 1. Seed Admin User
    const adminId = 'usr_admin_001';
    const adminPasswordHash = bcrypt.hashSync(config.adminSeed.password, 10);
    this.users.set(adminId, {
      id: adminId,
      email: config.adminSeed.email,
      phone: config.adminSeed.phone,
      name: config.adminSeed.name,
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 2. Seed Default Customer
    const custId = 'usr_cust_001';
    const custPasswordHash = bcrypt.hashSync('Player@123', 10);
    this.users.set(custId, {
      id: custId,
      email: 'rohit.sharma@example.com',
      phone: '9876501234',
      name: 'Rohit Sharma',
      passwordHash: custPasswordHash,
      role: 'CUSTOMER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 3. Seed Grounds
    const g1: GroundEntity = {
      id: 'ground_main_arena',
      name: 'Main Arena (Alpha Pitch)',
      slug: 'main-arena',
      description: 'Full-size multi-sport ground for 11v11, 7v7 football, and cricket matches with high-intensity lighting.',
      surfaceType: 'FIFA-grade 50mm synthetic grass with rubber infill',
      dimensions: '100 x 65 ft',
      lightingLux: 1200,
      capacity: 30,
      baseHourlyRate: 900,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const g2: GroundEntity = {
      id: 'ground_box_cage',
      name: 'The Box Cage (Beta Pitch)',
      slug: 'box-cage',
      description: 'Enclosed heavy-duty perimeter netted court for 5v5 futsal and intense box cricket games.',
      surfaceType: 'Monofilament multisport anti-skid synthetic turf',
      dimensions: '75 x 45 ft',
      lightingLux: 800,
      capacity: 16,
      baseHourlyRate: 750,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.grounds.set(g1.id, g1);
    this.grounds.set(g2.id, g2);

    // 4. Seed Sports
    const sportsList: SportEntity[] = [
      {
        id: 'sport_cricket',
        name: 'Cricket (Full Pitch)',
        slug: 'cricket',
        description: 'Regulation full-pitch cricket matches with certified nets and crease markings.',
        coverImage: '/images/sport_cricket.jpg',
        startingHourlyRate: 1000,
        minDurationMinutes: 60,
        supportedGroundIds: ['ground_main_arena'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'sport_box_cricket',
        name: 'Box Cricket',
        slug: 'box-cricket',
        description: 'Fast-paced enclosed arena cricket featuring heavy perimeter netting.',
        coverImage: '/images/sport_box_cricket.jpg',
        startingHourlyRate: 800,
        minDurationMinutes: 60,
        supportedGroundIds: ['ground_main_arena', 'ground_box_cage'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'sport_football',
        name: 'Football (7v7 / 11v11)',
        slug: 'football',
        description: 'Pro-grade synthetic turf with weather-proof goalposts and dynamic floodlights.',
        coverImage: '/images/sport_football.jpg',
        startingHourlyRate: 900,
        minDurationMinutes: 60,
        supportedGroundIds: ['ground_main_arena'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'sport_futsal',
        name: 'Futsal (5v5 Fast Pitch)',
        slug: 'futsal',
        description: 'Compact high-intensity court with rebound perimeter boards.',
        coverImage: '/images/sport_futsal.jpg',
        startingHourlyRate: 750,
        minDurationMinutes: 60,
        supportedGroundIds: ['ground_box_cage'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    sportsList.forEach((s) => this.sports.set(s.id, s));

    // 5. Seed Initial Bookings
    const todayStr = new Date().toISOString().split('T')[0];
    const b1: BookingEntity = {
      id: 'bkg_seed_001',
      referenceCode: 'TZ-8492',
      customerId: custId,
      customerName: 'Rohit Sharma',
      customerPhone: '9876501234',
      customerEmail: 'rohit.sharma@example.com',
      sportId: 'sport_football',
      sportName: 'Football (7v7 / 11v11)',
      groundId: 'ground_main_arena',
      groundName: 'Main Arena (Alpha Pitch)',
      date: todayStr,
      startTime: '07:00 PM',
      endTime: '08:30 PM',
      startMinuteOfDay: 1140, // 19:00
      endMinuteOfDay: 1230,   // 20:30
      durationMinutes: 90,
      bookingStatus: 'CONFIRMED',
      paymentStatus: 'PAID_FULL',
      paymentMethod: 'RAZORPAY',
      paymentType: 'FULL',
      pricing: {
        sportId: 'sport_football',
        groundId: 'ground_main_arena',
        date: todayStr,
        startTime: '07:00 PM',
        endTime: '08:30 PM',
        durationMinutes: 90,
        baseHourlyRate: 900,
        effectiveHourlyRate: 1150,
        groundCharge: 1725,
        peakSurcharge: 375,
        selectedAddOns: [],
        addOnsTotal: 0,
        discountPercentage: 0,
        discountAmount: 0,
        subtotal: 1725,
        taxPercentage: 5,
        taxAmount: 86.25,
        totalAmount: 1811.25,
        advancePercentage: 100,
        advanceAmount: 1811.25,
        remainingBalance: 0,
      },
      notes: 'Evening league game',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.bookings.set(b1.id, b1);
  }
}

export const dbStore = new DatabaseStore();
