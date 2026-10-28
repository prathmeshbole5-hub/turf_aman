/**
 * TURFZONE Centralized API Client
 * Connects frontend customer portal and admin dashboard to Express backend on port 5000.
 * Automatically injects JWT Bearer tokens and gracefully handles network fallbacks.
 */

import type { Sport, Ground, ConfirmedBooking, TimeSlot, BookingPricingBreakdown } from '../types';
import { initialSports, initialGrounds } from '../config/turfConfig';
import {
  getStoredSports,
  saveStoredSports,
  getStoredGrounds,
  saveStoredGrounds,
  getStoredBookings,
  addConfirmedBooking,
  cancelBooking as localCancelBooking,
  recordOfflinePayment as localRecordOfflinePayment,
} from './storageService';
import { generateDaySlots } from './slotService';

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || '/api';
const TOKEN_KEY = 'turfzone_auth_token';
const USER_KEY = 'turfzone_auth_user';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'CUSTOMER' | 'ADMIN' | 'STAFF';
}

class ApiClient {
  private token: string | null = null;
  private user: AuthUser | null = null;

  constructor() {
    this.token = localStorage.getItem(TOKEN_KEY);
    const userRaw = localStorage.getItem(USER_KEY);
    if (userRaw) {
      try {
        this.user = JSON.parse(userRaw);
      } catch {
        this.user = null;
      }
    }
  }

  // -----------------------------------------------------------
  // AUTHENTICATION
  // -----------------------------------------------------------
  public getToken(): string | null {
    return this.token;
  }

  public getUser(): AuthUser | null {
    return this.user;
  }

  public isAdmin(): boolean {
    return this.user?.role === 'ADMIN';
  }

  public setSession(token: string, user: AuthUser): void {
    this.token = token;
    this.user = user;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  public clearSession(): void {
    this.token = null;
    this.user = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const error: any = new Error(data.error || `HTTP error ${res.status}`);
      error.statusCode = res.status;
      error.details = data.details;
      throw error;
    }

    return data as T;
  }

  public async login(emailOrPhone: string, password: string): Promise<{ user: AuthUser; token: string }> {
    const data = await this.request<{ success: boolean; token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ emailOrPhone, password }),
    });

    this.setSession(data.token, data.user);
    return { user: data.user, token: data.token };
  }

  public async register(name: string, email: string, phone: string, password: string): Promise<{ user: AuthUser; token: string }> {
    const data = await this.request<{ success: boolean; token: string; user: AuthUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, phone, password }),
    });

    this.setSession(data.token, data.user);
    return { user: data.user, token: data.token };
  }

  public async getProfile(): Promise<AuthUser | null> {
    if (!this.token) return null;
    try {
      const data = await this.request<{ success: boolean; user: AuthUser }>('/auth/me');
      this.user = data.user;
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return data.user;
    } catch {
      this.clearSession();
      return null;
    }
  }

  // -----------------------------------------------------------
  // SPORTS
  // -----------------------------------------------------------
  public async getSports(showAll = false): Promise<Sport[]> {
    try {
      const data = await this.request<{ success: boolean; sports: any[] }>(`/sports?all=${showAll}`);
      if (data.sports && data.sports.length > 0) {
        const localSports = getStoredSports();
        const merged: Sport[] = data.sports.map((s) => {
          const match = localSports.find((ls) => ls.id === s.id) || initialSports[0];
          return {
            ...match,
            id: s.id,
            name: s.name,
            slug: s.slug || match.slug,
            shortDescription: s.description || match.shortDescription,
            coverImage: s.coverImage || match.coverImage,
            startingHourlyRate: s.startingHourlyRate,
            minDurationMinutes: s.minDurationMinutes || 60,
            supportedGroundIds: s.supportedGroundIds || match.supportedGroundIds,
            isActive: s.isActive ?? true,
          };
        });
        saveStoredSports(merged);
        return merged;
      }
    } catch (err) {
      console.warn('Backend /api/sports offline, using local store:', err);
    }
    const local = getStoredSports();
    return showAll ? local : local.filter((s) => s.isActive);
  }

  public async updateSport(sportId: string, payload: Partial<Sport>): Promise<Sport> {
    try {
      const data = await this.request<{ success: boolean; sport: any }>(`/sports/${sportId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      const local = getStoredSports();
      const existing = local.find((s) => s.id === sportId) || initialSports[0];
      const updated: Sport = {
        ...existing,
        ...data.sport,
        shortDescription: data.sport.description || existing.shortDescription,
      };
      saveStoredSports(local.map((s) => (s.id === sportId ? updated : s)));
      return updated;
    } catch {
      const local = getStoredSports();
      const updated = local.map((s) => (s.id === sportId ? { ...s, ...payload } : s));
      saveStoredSports(updated);
      return updated.find((s) => s.id === sportId)!;
    }
  }

  public async createSport(sport: Partial<Sport>): Promise<Sport> {
    const data = await this.request<{ success: boolean; sport: any }>('/sports', {
      method: 'POST',
      body: JSON.stringify({
        name: sport.name,
        description: sport.shortDescription,
        coverImage: sport.coverImage,
        startingHourlyRate: sport.startingHourlyRate,
        minDurationMinutes: sport.minDurationMinutes,
        supportedGroundIds: sport.supportedGroundIds,
      }),
    });
    const newSport: Sport = {
      id: data.sport.id,
      name: data.sport.name,
      slug: data.sport.slug,
      shortDescription: data.sport.description || '',
      format: sport.format || 'Standard arena format',
      coverImage: data.sport.coverImage,
      startingHourlyRate: data.sport.startingHourlyRate,
      minDurationMinutes: data.sport.minDurationMinutes,
      maxPlayers: sport.maxPlayers || 20,
      supportedGroundIds: data.sport.supportedGroundIds || ['ground_main_arena'],
      features: sport.features || ['Floodlights', 'Certified markings'],
      isActive: true,
    };
    const local = getStoredSports();
    saveStoredSports([...local, newSport]);
    return newSport;
  }

  // -----------------------------------------------------------
  // GROUNDS
  // -----------------------------------------------------------
  public async getGrounds(sportId?: string): Promise<Ground[]> {
    try {
      const query = sportId ? `?sportId=${sportId}` : '';
      const data = await this.request<{ success: boolean; grounds: any[] }>(`/grounds${query}`);
      if (data.grounds && data.grounds.length > 0) {
        const localGrounds = getStoredGrounds();
        const merged: Ground[] = data.grounds.map((g) => {
          const match = localGrounds.find((lg) => lg.id === g.id) || initialGrounds[0];
          return {
            ...match,
            id: g.id,
            name: g.name,
            slug: g.slug || match.slug,
            description: g.description || match.description,
            dimensions: g.dimensions || match.dimensions,
            surfaceType: g.surfaceType || match.surfaceType,
            baseHourlyRate: g.baseHourlyRate || match.baseHourlyRate,
            capacity: g.capacity || match.capacity,
            isAvailable: g.isActive ?? true,
          };
        });
        saveStoredGrounds(merged);
        return merged;
      }
    } catch (err) {
      console.warn('Backend /api/grounds offline, using local store:', err);
    }
    return getStoredGrounds();
  }

  public async updateGround(groundId: string, payload: Partial<Ground>): Promise<Ground> {
    try {
      const data = await this.request<{ success: boolean; ground: any }>(`/grounds/${groundId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      const local = getStoredGrounds();
      const existing = local.find((g) => g.id === groundId) || initialGrounds[0];
      const updated: Ground = {
        ...existing,
        ...data.ground,
      };
      saveStoredGrounds(local.map((g) => (g.id === groundId ? updated : g)));
      return updated;
    } catch {
      const local = getStoredGrounds();
      const updated = local.map((g) => (g.id === groundId ? { ...g, ...payload } : g));
      saveStoredGrounds(updated);
      return updated.find((g) => g.id === groundId)!;
    }
  }

  // -----------------------------------------------------------
  // AVAILABILITY SLOTS
  // -----------------------------------------------------------
  public async getAvailability(groundId: string, date: string): Promise<TimeSlot[]> {
    try {
      const data = await this.request<{ success: boolean; slots: any[] }>(`/availability?groundId=${groundId}&date=${date}`);
      return data.slots.map((s) => ({
        id: s.id,
        startTime: s.startTime,
        endTime: s.endTime,
        hour: Math.floor(s.startMinute / 60),
        status: s.status.toLowerCase() as any,
        isPeak: s.isPeak,
        rate: s.isPeak ? 1150 : 900,
        blockedReason: s.maintenanceReason,
      }));
    } catch (err) {
      console.warn('Backend /api/availability offline, generating local slots:', err);
      const sports = getStoredSports();
      const grounds = getStoredGrounds();
      const ground = grounds.find((g) => g.id === groundId) || grounds[0];
      return generateDaySlots(date, sports[0], ground);
    }
  }

  // -----------------------------------------------------------
  // PRICING CALCULATION
  // -----------------------------------------------------------
  public async calculatePrice(payload: {
    sportId: string;
    groundId: string;
    date: string;
    startTime: string;
    durationMinutes: number;
    selectedAddOns?: any[];
    discountCode?: string;
    paymentOption?: 'full' | 'advance';
  }): Promise<BookingPricingBreakdown> {
    const data = await this.request<{ success: boolean; pricing: any }>('/pricing/calculate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const p = data.pricing;
    return {
      sportId: p.sportId,
      sportName: p.sportName || '',
      groundId: p.groundId,
      groundName: p.groundName || '',
      date: p.date,
      startTime: p.startTime,
      endTime: p.endTime,
      durationMinutes: p.durationMinutes,
      baseHourlyRate: p.baseHourlyRate,
      effectiveHourlyRate: p.effectiveHourlyRate,
      groundCharge: p.groundCharge,
      peakSurcharge: p.peakSurcharge,
      selectedAddOns: p.selectedAddOns || [],
      addOnsTotal: p.addOnsTotal,
      discountPercentage: p.discountPercentage,
      discountAmount: p.discountAmount,
      subtotal: p.subtotal,
      taxAmount: p.taxAmount,
      totalAmount: p.totalAmount,
      advancePercentage: p.advancePercentage,
      advanceAmount: p.advanceAmount,
      remainingBalance: p.remainingBalance,
    };
  }

  // -----------------------------------------------------------
  // BOOKINGS & DOUBLE-BOOKING PROTECTION
  // -----------------------------------------------------------
  public async createBooking(bookingPayload: any): Promise<ConfirmedBooking> {
    const data = await this.request<{ success: boolean; booking: any }>('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingPayload),
    });

    const b = data.booking;
    const sports = getStoredSports();
    const grounds = getStoredGrounds();
    const sportMatch = sports.find((s) => s.id === b.sportId) || initialSports[0];
    const groundMatch = grounds.find((g) => g.id === b.groundId) || initialGrounds[0];

    const formatted: ConfirmedBooking = {
      bookingId: b.id,
      referenceCode: b.referenceCode,
      createdAt: b.createdAt,
      sport: sportMatch,
      ground: groundMatch,
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
    };

    addConfirmedBooking(formatted);
    return formatted;
  }

  public async getMyBookings(phone?: string): Promise<ConfirmedBooking[]> {
    try {
      const query = phone ? `?phone=${encodeURIComponent(phone)}` : '';
      const data = await this.request<{ success: boolean; bookings: any[] }>(`/bookings/my${query}`);
      if (data.bookings) {
        const sports = getStoredSports();
        const grounds = getStoredGrounds();

        return data.bookings.map((b) => {
          const sportMatch = sports.find((s) => s.id === b.sportId) || initialSports[0];
          const groundMatch = grounds.find((g) => g.id === b.groundId) || initialGrounds[0];

          return {
            bookingId: b.id,
            referenceCode: b.referenceCode,
            createdAt: b.createdAt,
            sport: sportMatch,
            ground: groundMatch,
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
          };
        });
      }
    } catch (err) {
      console.warn('Backend /api/bookings/my offline, using local store:', err);
    }

    const local = getStoredBookings();
    if (phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      return local.filter((b) => b.customer.phone.replace(/[^0-9]/g, '').includes(cleanPhone));
    }
    return local;
  }

  public async cancelBooking(bookingId: string): Promise<{ success: boolean; message: string; refundAmount?: number }> {
    try {
      const data = await this.request<{ success: boolean; message: string; refundAmount?: number }>(
        `/bookings/${bookingId}/cancel`,
        { method: 'POST' }
      );
      localCancelBooking(bookingId);
      return data;
    } catch {
      return localCancelBooking(bookingId);
    }
  }

  public async recordOfflinePayment(bookingId: string, amount: number): Promise<boolean> {
    try {
      await this.request(`/bookings/${bookingId}/record-offline-payment`, {
        method: 'POST',
        body: JSON.stringify({ amount }),
      });
      localRecordOfflinePayment(bookingId, amount);
      return true;
    } catch {
      return localRecordOfflinePayment(bookingId, amount);
    }
  }

  // -----------------------------------------------------------
  // PAYMENTS (RAZORPAY)
  // -----------------------------------------------------------
  public async createRazorpayOrder(bookingId: string, amount: number): Promise<any> {
    return await this.request('/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({ bookingId, amount }),
    });
  }

  public async verifyRazorpayPayment(payload: {
    bookingId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): Promise<{ success: boolean; message: string }> {
    return await this.request('/payments/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // -----------------------------------------------------------
  // ADMIN DASHBOARD
  // -----------------------------------------------------------
  public async getAdminOverview(): Promise<any> {
    try {
      return await this.request('/admin/overview');
    } catch (err) {
      console.warn('Backend /api/admin/overview offline:', err);
      return null;
    }
  }

  public async getAdminBookings(params: Record<string, string> = {}): Promise<any> {
    try {
      const query = new URLSearchParams(params).toString();
      return await this.request(`/admin/bookings?${query}`);
    } catch (err) {
      console.warn('Backend /api/admin/bookings offline, using local store:', err);
      const local = getStoredBookings();
      return {
        success: true,
        totalItems: local.length,
        totalPages: 1,
        currentPage: 1,
        bookings: local,
      };
    }
  }

  public async getAdminCustomers(): Promise<any[]> {
    try {
      const data = await this.request<{ success: boolean; customers: any[] }>('/admin/customers');
      return data.customers || [];
    } catch (err) {
      console.warn('Backend /api/admin/customers offline:', err);
      return [];
    }
  }

  public async getBlockedSlots(): Promise<any[]> {
    try {
      const data = await this.request<{ success: boolean; blockedPeriods: any[] }>('/admin/blocked-slots');
      return data.blockedPeriods || [];
    } catch (err) {
      console.warn('Backend /api/admin/blocked-slots offline:', err);
      return [];
    }
  }

  public async blockSlot(payload: {
    groundId: string;
    date: string;
    startTime: string;
    endTime: string;
    reason: string;
  }): Promise<any> {
    return await this.request('/admin/blocked-slots', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async unblockSlot(id: string): Promise<any> {
    return await this.request(`/admin/blocked-slots/${id}`, {
      method: 'DELETE',
    });
  }

  // -----------------------------------------------------------
  // SETTINGS
  // -----------------------------------------------------------
  public async getSettings(): Promise<any> {
    try {
      const data = await this.request<{ success: boolean; settings: any }>('/settings');
      return data.settings;
    } catch {
      return null;
    }
  }

  public async updateSettings(settings: any): Promise<any> {
    return await this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }
}

export const apiClient = new ApiClient();
