import { TripType, Vehicle, Booking } from '../types/cab';
import { DISTANCE_MATRIX, POPULAR_ROUTES, COMPANY_WHATSAPP, COMPANY_NAME, VEHICLES } from '../data/cabsData';
import { db, handleFirestoreError, OperationType, withFirestoreTimeout } from '../firebase';
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

export function normalizeBooking(raw: any): Booking | null {
  if (!raw || typeof raw !== 'object') return null;
  const bookingId = String(raw.bookingId || '').trim();
  if (!bookingId) return null;

  let createdAtStr = new Date().toISOString();
  if (typeof raw.createdAt === 'string' && raw.createdAt.trim()) {
    createdAtStr = raw.createdAt.trim();
  } else if (typeof raw.createdAt === 'number') {
    createdAtStr = new Date(raw.createdAt).toISOString();
  } else if (raw.createdAt && typeof raw.createdAt.toDate === 'function') {
    try {
      createdAtStr = raw.createdAt.toDate().toISOString();
    } catch {
      createdAtStr = new Date().toISOString();
    }
  }

  const fallbackVehicle = VEHICLES[0];
  const rawVehicle = raw.vehicle && typeof raw.vehicle === 'object' ? raw.vehicle : fallbackVehicle;
  const safeVehicle: Vehicle = {
    ...fallbackVehicle,
    ...rawVehicle,
    id: String(rawVehicle?.id || fallbackVehicle.id),
    name: String(rawVehicle?.name || fallbackVehicle.name),
    modelNames: String(rawVehicle?.modelNames || fallbackVehicle.modelNames),
    imageUrl: String(rawVehicle?.imageUrl || fallbackVehicle.imageUrl),
  };

  const numFare = Number(raw.totalFare);
  const safeTotalFare = Number.isFinite(numFare) && numFare >= 0 ? numFare : 0;

  return {
    ...raw,
    bookingId: bookingId.slice(0, 64),
    tripType: (['oneway', 'roundtrip', 'local', 'airport'].includes(raw.tripType) ? raw.tripType : 'oneway') as TripType,
    pickupCity: String(raw.pickupCity || 'Varanasi').slice(0, 120),
    dropCity: raw.dropCity ? String(raw.dropCity).slice(0, 120) : '',
    pickupDate: String(raw.pickupDate || createdAtStr.split('T')[0]).slice(0, 32),
    pickupTime: String(raw.pickupTime || '08:00').slice(0, 32),
    totalFare: safeTotalFare,
    baseFare: Number.isFinite(Number(raw.baseFare)) ? Number(raw.baseFare) : safeTotalFare,
    driverAllowance: Number.isFinite(Number(raw.driverAllowance)) ? Number(raw.driverAllowance) : 0,
    tollEstimate: Number.isFinite(Number(raw.tollEstimate)) ? Number(raw.tollEstimate) : 0,
    gstAmount: Number.isFinite(Number(raw.gstAmount)) ? Number(raw.gstAmount) : 0,
    estimatedDistanceKm: Number.isFinite(Number(raw.estimatedDistanceKm)) ? Number(raw.estimatedDistanceKm) : 150,
    passengerName: String(raw.passengerName || 'Guest Passenger').slice(0, 120),
    passengerPhone: String(raw.passengerPhone || '0000000000').slice(0, 20),
    passengerCount: Number.isFinite(Number(raw.passengerCount)) ? Number(raw.passengerCount) : 2,
    luggageCount: Number.isFinite(Number(raw.luggageCount)) ? Number(raw.luggageCount) : 1,
    status: (['confirmed', 'assigned', 'completed', 'cancelled'].includes(raw.status) ? raw.status : 'confirmed'),
    createdAt: createdAtStr.slice(0, 64),
    vehicle: safeVehicle,
  };
}

function sanitizeForFirestore(obj: Booking): Booking {
  const normalized = normalizeBooking(obj) || obj;
  const copy = JSON.parse(JSON.stringify(normalized)) as Booking;
  copy.bookingId = String(copy.bookingId || `TWC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`).slice(0, 64);
  copy.tripType = (['oneway', 'roundtrip', 'local', 'airport'].includes(copy.tripType) ? copy.tripType : 'oneway') as TripType;
  copy.pickupCity = String(copy.pickupCity || 'Varanasi').slice(0, 120);
  copy.pickupDate = String(copy.pickupDate || new Date().toISOString().split('T')[0]).slice(0, 32);
  copy.pickupTime = String(copy.pickupTime || '08:00').slice(0, 32);
  copy.totalFare = typeof copy.totalFare === 'number' && !isNaN(copy.totalFare) && copy.totalFare >= 0 ? copy.totalFare : 0;
  copy.passengerName = String(copy.passengerName || 'Guest Passenger').slice(0, 120);
  copy.passengerPhone = String(copy.passengerPhone || '0000000000').slice(0, 20);
  copy.status = (['confirmed', 'assigned', 'completed', 'cancelled'].includes(copy.status) ? copy.status : 'confirmed');
  copy.createdAt = String(copy.createdAt || new Date().toISOString()).slice(0, 64);
  return copy;
}

export function calculateDistance(from: string, to: string, tripType: TripType): number {
  if (tripType === 'local') return 80;
  if (tripType === 'airport') return 26;

  const cleanFrom = String(from || '').trim();
  const cleanTo = String(to || '').trim();
  if (!cleanFrom || !cleanTo) return 200;

  // Check in POPULAR_ROUTES first
  const popRoute = POPULAR_ROUTES.find(
    (r) =>
      (r.from.toLowerCase().includes(cleanFrom.toLowerCase()) && r.to.toLowerCase().includes(cleanTo.toLowerCase())) ||
      (r.to.toLowerCase().includes(cleanFrom.toLowerCase()) && r.from.toLowerCase().includes(cleanTo.toLowerCase()))
  );
  if (popRoute) return popRoute.distanceKm;

  // Check in DISTANCE_MATRIX
  for (const [origin, targets] of Object.entries(DISTANCE_MATRIX)) {
    if (origin.toLowerCase().includes(cleanFrom.toLowerCase()) || cleanFrom.toLowerCase().includes(origin.toLowerCase())) {
      for (const [dest, km] of Object.entries(targets)) {
        if (dest.toLowerCase().includes(cleanTo.toLowerCase()) || cleanTo.toLowerCase().includes(dest.toLowerCase())) {
          return km;
        }
      }
    }
  }

  // Fallback realistic estimate
  return 200;
}

export interface FareCalculationResult {
  estimatedDistanceKm: number;
  baseFare: number;
  driverAllowance: number;
  tollEstimate: number;
  discountAmount: number;
  gstAmount: number;
  totalFare: number;
  isFixedRoute: boolean;
  packageNote: string;
}

export const CHECKOUT_TAX_AND_CHARGES = 500;

export function getCarPromotionalDiscount(vehicle: Vehicle): number {
  const cat = (vehicle?.category || '').toLowerCase();
  const id = (vehicle?.id || '').toLowerCase();
  if (
    cat === 'hatchback' ||
    cat === 'sedan' ||
    cat === 'honda' ||
    id === 'wagonr' ||
    id === 'dzire' ||
    id === 'etios' ||
    id === 'amaze'
  ) {
    return 200;
  }
  return 300;
}

export interface PromotionalFareBreakdown {
  originalDisplayPrice: number;
  carDiscount: number;
  upfrontOfferPrice: number;
  taxAndCharges: number;
  finalCheckoutPayable: number;
}

export function getPromotionalFareBreakdown(
  totalFare: number,
  vehicle: Vehicle
): PromotionalFareBreakdown {
  const carDiscount = getCarPromotionalDiscount(vehicle);
  const originalDisplayPrice = Math.max(totalFare, 800);
  const upfrontOfferPrice = Math.max(originalDisplayPrice - carDiscount, 500);
  const taxAndCharges = CHECKOUT_TAX_AND_CHARGES;
  const finalCheckoutPayable = upfrontOfferPrice + taxAndCharges;

  return {
    originalDisplayPrice,
    carDiscount,
    upfrontOfferPrice,
    taxAndCharges,
    finalCheckoutPayable,
  };
}

export function calculateFare(
  vehicle: Vehicle,
  tripType: TripType,
  fromCity: string,
  toCity: string,
  localPackageKey: '4h_40km' | '8h_80km' | '12h_120km' = '8h_80km',
  isRoundTrip: boolean = false,
  returnDate?: string,
  pickupDate?: string,
  couponCode?: string
): FareCalculationResult {
  let estimatedDistanceKm = 0;
  let baseFare = 0;
  let driverAllowance = 0;
  let tollEstimate = 0;
  let isFixedRoute = false;
  let packageNote = '';

  if (tripType === 'airport') {
    estimatedDistanceKm = 26;
    baseFare = vehicle.airportFlatRateVaranasi;
    driverAllowance = 0;
    tollEstimate = 120; // Airport parking/toll included
    isFixedRoute = true;
    packageNote = 'All-inclusive airport transfer (Fuel, Chauffeur & Terminal Toll Included)';
  } else if (tripType === 'local') {
    estimatedDistanceKm = localPackageKey === '4h_40km' ? 40 : localPackageKey === '8h_80km' ? 80 : 120;
    baseFare = vehicle.localRates[localPackageKey];
    driverAllowance = 0;
    tollEstimate = 0;
    isFixedRoute = true;
    packageNote = `Local city rental package (${localPackageKey.replace('_', ' ').replace('h', ' Hours / ').toUpperCase()})`;
  } else if (tripType === 'oneway') {
    estimatedDistanceKm = calculateDistance(fromCity, toCity, 'oneway');
    const activeOneWayRate = vehicle.oneWayRatePerKm || vehicle.ratePerKm;
    const billableKm = Math.max(estimatedDistanceKm, 150);
    baseFare = Math.round(billableKm * activeOneWayRate);
    driverAllowance = 300;
    tollEstimate = Math.round(estimatedDistanceKm * 1.5);
    isFixedRoute = false;
    packageNote = `One-way outstation tariff (${billableKm} km @ ₹${activeOneWayRate}/km)`;
  } else if (tripType === 'roundtrip') {
    const oneWayKm = calculateDistance(fromCity, toCity, 'roundtrip');
    const totalKm = oneWayKm * 2;
    const activeRoundTripRate = vehicle.roundTripRatePerKm || vehicle.ratePerKm;

    let days = 1;
    if (pickupDate && returnDate) {
      const p = new Date(pickupDate).getTime();
      const r = new Date(returnDate).getTime();
      const diff = Math.ceil((r - p) / (1000 * 60 * 60 * 24));
      days = Math.max(1, isNaN(diff) ? 1 : diff + 1);
    }

    const minKmRequired = days * vehicle.minKmPerDay;
    const billableKm = Math.max(totalKm, minKmRequired);
    estimatedDistanceKm = totalKm;
    baseFare = Math.round(billableKm * activeRoundTripRate);
    driverAllowance = days * 400; // Rs 400/day driver DA
    tollEstimate = Math.round(totalKm * 1.4);
    packageNote = `Round-trip tariff (${days} Days · ${billableKm} km @ ₹${activeRoundTripRate}/km)`;
  }

  // Calculate discount if coupon applied
  let discountAmount = 0;
  const cleanCoupon = (couponCode || '').trim().toUpperCase();
  const safeToLower = String(toCity || '').toLowerCase();
  const safeFromLower = String(fromCity || '').toLowerCase();
  if (cleanCoupon === 'WELCOME100') {
    discountAmount = 100;
  } else if (cleanCoupon === 'RAMDHAM200' && (safeToLower.includes('ayodhya') || safeFromLower.includes('ayodhya'))) {
    discountAmount = 200;
  } else if (cleanCoupon === 'TRIP50') {
    discountAmount = 50;
  }

  // 5% GST calculation
  const subtotal = baseFare + driverAllowance + tollEstimate;
  const gstAmount = Math.round(subtotal * 0.05);
  const totalFare = Math.max(subtotal + gstAmount - discountAmount, 0);

  return {
    estimatedDistanceKm,
    baseFare,
    driverAllowance,
    tollEstimate,
    discountAmount,
    gstAmount,
    totalFare,
    isFixedRoute,
    packageNote,
  };
}

export function generateBookingId(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `TWC-${year}-${randomNum}`;
}

export function generateWhatsAppLink(booking: Booking): string {
  const pickup = booking.pickupAddress || booking.pickupCity;
  const drop = booking.tripType === 'local' 
    ? `Local Package (${booking.localPackageHours} Hours / ${booking.localPackageKm} KM)`
    : (booking.dropAddress || booking.dropCity || 'Local');
  const paymentModeLabel =
    booking.paymentPreference === 'online_pay' || booking.paymentPreference === 'full_online'
      ? 'ONLINE PAY (UPI / QR / ONLINE)'
      : 'CASH IN HAND (PAY TO DRIVER)';

  const text = `TRAVELINGCAB CHAUFFEUR DISPATCH
Reference: ${booking.bookingId}
Trip Type: ${booking.tripType.toUpperCase()}
Vehicle: ${booking.vehicle?.name || 'AC Cab'} (${booking.vehicle?.modelNames || 'Commercial'})
Origin: ${pickup}
Destination: ${drop}
Date & Time: ${booking.pickupDate} at ${booking.pickupTime}
${booking.returnDate ? `Return Schedule: ${booking.returnDate} (${booking.returnTime || ''})\n` : ''}Estimated Distance: ${booking.estimatedDistanceKm} KM
Total Tariff: INR ${booking.totalFare} (All inclusive)
Payment Mode: ${paymentModeLabel}

Passenger Information:
Name: ${booking.passengerName}
Mobile: +91 ${booking.passengerPhone} (OTP Verified)
Party Size: ${booking.passengerCount} Pax | Luggage: ${booking.luggageCount} Bags
${booking.specialInstructions ? `Special Instructions: ${booking.specialInstructions}\n` : ''}
Please confirm chauffeur assignment and dispatch credentials.`;

  return `https://wa.me/${COMPANY_WHATSAPP}?text=${encodeURIComponent(text)}`;
}

const RECENT_TRACK_IDS_KEY = 'twc_recent_track_ids';

export function getRecentTrackIds(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_TRACK_IDS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const deletedSet = new Set(getDeletedBookingIds().map((x) => x.toUpperCase()));
    const list: string[] = Array.isArray(parsed)
      ? parsed.map((id) => String(id || '').trim().toUpperCase()).filter(Boolean)
      : [];
    // Also include locally stored bookings' IDs so newly booked rides appear automatically in suggestions
    const localBookings = getBookingsFromStorage();
    for (const b of localBookings) {
      const bid = String(b.bookingId || '').trim().toUpperCase();
      if (bid && !list.includes(bid)) {
        list.push(bid);
      }
    }
    return list.filter((id) => !deletedSet.has(id)).slice(0, 6);
  } catch {
    return [];
  }
}

export function saveRecentTrackId(bookingId: string): void {
  try {
    const clean = String(bookingId || '').trim().toUpperCase();
    if (!clean || !clean.startsWith('TWC-')) return;
    const raw = localStorage.getItem(RECENT_TRACK_IDS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const existing: string[] = Array.isArray(parsed)
      ? parsed.map((id) => String(id || '').trim().toUpperCase()).filter(Boolean)
      : [];
    const updated = [clean, ...existing.filter((x) => x !== clean)].slice(0, 6);
    localStorage.setItem(RECENT_TRACK_IDS_KEY, JSON.stringify(updated));
  } catch {}
}

const BOOKINGS_STORAGE_KEY = 'tripwithcar_user_bookings';
const ADMIN_PIN_KEY = 'tripwithcar_admin_pin';
const DEFAULT_ADMIN_PIN = '1234';

export function getAdminPin(): string {
  try {
    return localStorage.getItem(ADMIN_PIN_KEY) || DEFAULT_ADMIN_PIN;
  } catch {
    return DEFAULT_ADMIN_PIN;
  }
}

export function setAdminPin(pin: string): void {
  try {
    localStorage.setItem(ADMIN_PIN_KEY, pin);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('twc_pin_updated'));
    }
  } catch (err) {
    console.error('Failed to set admin pin', err);
  }
}

// Fetch centralized PIN from Server & Cloud Firestore so Mobile and PC have the exact same password
export async function fetchAdminPinFromServer(): Promise<string> {
  try {
    const res = await fetch(`/api/admin-pin?t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.pin) {
        const clean = String(data.pin).trim();
        localStorage.setItem(ADMIN_PIN_KEY, clean);
        return clean;
      }
    }
  } catch {
    // offline
  }

  try {
    const snap = await withFirestoreTimeout(getDoc(doc(db, 'admin_config', 'settings')), 2500);
    if (snap.exists()) {
      const data = snap.data();
      if (data && data.pin) {
        const clean = String(data.pin).trim();
        localStorage.setItem(ADMIN_PIN_KEY, clean);
        return clean;
      }
    }
  } catch {
    // Fallback to local
  }

  return getAdminPin();
}

// Save PIN to central server & Cloud Firestore so it immediately applies across all devices (Mobile & PC)
export async function setAdminPinAsync(pin: string): Promise<boolean> {
  const cleanPin = String(pin).trim();
  setAdminPin(cleanPin);

  let ok = false;
  try {
    const res = await fetch('/api/admin-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: cleanPin }),
    });
    if (res.ok) ok = true;
  } catch {
    // ignore if API fallback unreachable
  }

  try {
    await withFirestoreTimeout(
      setDoc(doc(db, 'admin_config', 'settings'), {
        pin: cleanPin,
        updatedAt: new Date().toISOString(),
      }),
      3000
    );
    ok = true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'admin_config/settings');
  }

  return ok;
}

export function saveBookingToStorage(booking: Booking, syncRemote = false): void {
  const normalized = normalizeBooking(booking);
  if (!normalized || !normalized.bookingId) return;
  if (isBookingDeleted(normalized.bookingId)) return;

  try {
    const existingStr = localStorage.getItem(BOOKINGS_STORAGE_KEY);
    const parsed = existingStr ? JSON.parse(existingStr) : [];
    const bookings: Booking[] = Array.isArray(parsed)
      ? (parsed.map(normalizeBooking).filter(Boolean) as Booking[])
      : [];
    const deletedSet = new Set(getDeletedBookingIds().map((x) => x.toUpperCase()));
    const validBookings = bookings.filter(
      (b) => b && b.bookingId && !deletedSet.has(String(b.bookingId).trim().toUpperCase())
    );
    const index = validBookings.findIndex(
      (b) => String(b.bookingId).trim().toUpperCase() === String(normalized.bookingId).trim().toUpperCase()
    );
    if (index !== -1) {
      validBookings[index] = normalized;
    } else {
      validBookings.unshift(normalized);
    }
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(validBookings.slice(0, 200)));
    saveRecentTrackId(normalized.bookingId);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('twc_bookings_updated'));
    }
  } catch (err) {
    console.error('Failed to save booking to local storage', err);
  }

  if (syncRemote) {
    saveBookingAsync(normalized).catch(() => {});
  }
}

// Async commit guaranteeing booking reaches central server & Cloud Firestore across all devices
export async function saveBookingAsync(booking: Booking): Promise<Booking> {
  const cleanBooking = sanitizeForFirestore(booking);
  if (isBookingDeleted(cleanBooking.bookingId)) {
    return cleanBooking;
  }
  saveBookingToStorage(cleanBooking, false);

  // 1. Primary Express backend sync (fast & immediate)
  let serverSavedBooking: Booking | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(cleanBooking),
      });
      if (res.status === 410) {
        addDeletedBookingId(cleanBooking.bookingId);
        return cleanBooking;
      }
      if (res.ok) {
        const data = await res.json();
        if (data && data.booking) {
          saveBookingToStorage(data.booking, false);
          serverSavedBooking = data.booking;
        }
        break;
      }
    } catch {
      // transient network retry
    }
    await new Promise((r) => setTimeout(r, 150));
  }

  // 2. Cloud Database: Save to Firebase Cloud Firestore (non-blocking with timeout)
  try {
    await withFirestoreTimeout(
      setDoc(doc(db, 'bookings', cleanBooking.bookingId), cleanBooking),
      3000
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `bookings/${cleanBooking.bookingId}`);
  }

  return serverSavedBooking || cleanBooking;
}

export function updateBookingInStorage(updatedBooking: Booking): void {
  saveBookingAsync(updatedBooking).catch(() => {});
}

const DELETED_BOOKINGS_KEY = 'twc_deleted_booking_ids';

export function getDeletedBookingIds(): string[] {
  try {
    const s = localStorage.getItem(DELETED_BOOKINGS_KEY);
    const parsed = s ? JSON.parse(s) : [];
    return Array.isArray(parsed) ? parsed.map((id) => String(id).trim().toUpperCase()) : [];
  } catch {
    return [];
  }
}

export function isBookingDeleted(bookingId: string): boolean {
  if (!bookingId) return false;
  const clean = String(bookingId).trim().toUpperCase();
  return getDeletedBookingIds().includes(clean);
}

export function addDeletedBookingId(id: string): void {
  try {
    const clean = String(id || '').trim().toUpperCase();
    if (!clean) return;
    const ids = getDeletedBookingIds();
    if (!ids.includes(clean)) {
      ids.push(clean);
      localStorage.setItem(DELETED_BOOKINGS_KEY, JSON.stringify(ids.slice(-500)));
    }
  } catch {}
}

export function deleteBookingFromStorage(bookingId: string, syncRemote = false): void {
  const cleanTarget = String(bookingId || '').trim().toUpperCase();
  addDeletedBookingId(cleanTarget);
  try {
    const existingStr = localStorage.getItem(BOOKINGS_STORAGE_KEY);
    const parsed = existingStr ? JSON.parse(existingStr) : [];
    const bookings: Booking[] = Array.isArray(parsed)
      ? (parsed.map(normalizeBooking).filter(Boolean) as Booking[])
      : [];
    const filtered = bookings.filter(
      (b) => String(b.bookingId || '').trim().toUpperCase() !== cleanTarget
    );
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(filtered));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('twc_bookings_updated'));
    }
  } catch (err) {
    console.error('Failed to delete booking', err);
  }

  if (syncRemote) {
    deleteBookingAsync(bookingId).catch(() => {});
  }
}

export async function deleteBookingAsync(bookingId: string): Promise<boolean> {
  const cleanId = String(bookingId || '').trim();
  const upperId = cleanId.toUpperCase();
  deleteBookingFromStorage(cleanId, false);
  let deleted = false;

  // 1. Delete from Express backend immediately (writes to deleted_bookings.json)
  try {
    const res = await fetch(`/api/bookings/${encodeURIComponent(cleanId)}`, {
      method: 'DELETE',
    });
    if (res.ok) deleted = true;
  } catch {
    // ignore
  }

  // 2. Record tombstone in Cloud Firestore admin_config/deleted_bookings (with timeout)
  try {
    const currentDeleted = getDeletedBookingIds();
    await withFirestoreTimeout(
      setDoc(
        doc(db, 'admin_config', 'deleted_bookings'),
        {
          ids: currentDeleted.slice(-400),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      ),
      2500
    );
  } catch {}

  // 3. Delete from Cloud Firestore bookings collection (with timeout)
  try {
    await withFirestoreTimeout(deleteDoc(doc(db, 'bookings', cleanId)), 2500);
    if (upperId !== cleanId) {
      await withFirestoreTimeout(deleteDoc(doc(db, 'bookings', upperId)), 2000).catch(() => {});
    }
    deleted = true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `bookings/${cleanId}`);
  }

  return deleted;
}

export function clearAllBookingsFromStorage(): void {
  try {
    localStorage.removeItem(BOOKINGS_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear bookings', err);
  }
}

export function getBookingsFromStorage(): Booking[] {
  try {
    const existingStr = localStorage.getItem(BOOKINGS_STORAGE_KEY);
    const parsed = existingStr ? JSON.parse(existingStr) : [];
    if (!Array.isArray(parsed)) return [];
    const deletedIds = new Set(getDeletedBookingIds());
    return (parsed.map(normalizeBooking).filter(Boolean) as Booking[]).filter(
      (b) => b && b.bookingId && !deletedIds.has(String(b.bookingId).trim().toUpperCase())
    );
  } catch {
    return [];
  }
}

// Fetch all bookings from Express server + Cloud Firestore and sync bidirectionally across ALL devices
export async function syncBookingsFromServer(): Promise<Booking[]> {
  // 1. Sync deleted booking tombstones from Express server first (fast)
  try {
    const delRes = await fetch(`/api/deleted-bookings?t=${Date.now()}`, { cache: 'no-store' });
    if (delRes.ok) {
      const delData = await delRes.json();
      if (Array.isArray(delData?.deletedIds)) {
        delData.deletedIds.forEach((id: string) => addDeletedBookingId(id));
      }
    }
  } catch {}

  // 2. Sync deleted booking tombstones from Cloud Firestore (bounded by timeout)
  try {
    const delDoc = await withFirestoreTimeout(getDoc(doc(db, 'admin_config', 'deleted_bookings')), 2500);
    if (delDoc.exists()) {
      const data = delDoc.data();
      if (Array.isArray(data?.ids)) {
        data.ids.forEach((id: string) => addDeletedBookingId(id));
      }
    }
  } catch {}

  const deletedIds = new Set(getDeletedBookingIds());
  const map = new Map<string, Booking>();
  const firestoreIds = new Set<string>();
  let firestoreReadSucceeded = false;

  // 3. Pull from Cloud Firestore (bounded by 3s timeout so offline clients never stall)
  try {
    const snap = await withFirestoreTimeout(getDocs(collection(db, 'bookings')), 3000);
    firestoreReadSucceeded = true;
    snap.forEach((docSnap) => {
      const raw = docSnap.data();
      const b = normalizeBooking({ ...raw, bookingId: raw?.bookingId || docSnap.id });
      const upperId = String(b?.bookingId || docSnap.id || '').trim().toUpperCase();
      if (b && b.bookingId) {
        if (deletedIds.has(upperId)) {
          withFirestoreTimeout(deleteDoc(doc(db, 'bookings', docSnap.id)), 2000).catch(() => {});
        } else {
          map.set(upperId, b);
          firestoreIds.add(upperId);
        }
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'bookings');
  }

  // 4. Pull from Express server (/api/bookings)
  try {
    const res = await fetch(`/api/bookings?t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
    if (res.ok) {
      const serverBookings = await res.json();
      if (Array.isArray(serverBookings)) {
        for (const rawB of serverBookings) {
          const b = normalizeBooking(rawB);
          const upperId = String(b?.bookingId || '').trim().toUpperCase();
          if (b && b.bookingId && !deletedIds.has(upperId)) {
            if (!map.has(upperId)) {
              map.set(upperId, b);
            }
            if (firestoreReadSucceeded && !firestoreIds.has(upperId)) {
              const clean = sanitizeForFirestore(b);
              withFirestoreTimeout(setDoc(doc(db, 'bookings', clean.bookingId), clean), 2500).catch(() => {});
              firestoreIds.add(upperId);
            }
          }
        }
      }
    }
  } catch {
    // ignore if offline
  }

  // 5. Check local storage for any booking not yet synced
  const local = getBookingsFromStorage();
  for (const localBooking of local) {
    const upperId = String(localBooking?.bookingId || '').trim().toUpperCase();
    if (
      localBooking &&
      localBooking.bookingId &&
      !deletedIds.has(upperId)
    ) {
      if (!map.has(upperId)) {
        map.set(upperId, localBooking);
      }
      if (firestoreReadSucceeded && !firestoreIds.has(upperId)) {
        const clean = sanitizeForFirestore(localBooking);
        withFirestoreTimeout(setDoc(doc(db, 'bookings', clean.bookingId), clean), 2500).catch(() => {});
        fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(clean),
        }).catch(() => {});
      }
    }
  }

  const merged = Array.from(map.values()).filter(
    (b) => b && b.bookingId && !deletedIds.has(String(b.bookingId).trim().toUpperCase())
  );
  merged.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  try {
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(merged.slice(0, 200)));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('twc_bookings_updated'));
    }
  } catch {}
  return merged;
}

// Real-time Cloud Firestore listener so Admin Dashboard updates instantly when anyone books on Mobile or PC
export function subscribeToLiveBookings(onUpdate: (bookings: Booking[]) => void): () => void {
  try {
    const unsubscribe = onSnapshot(
      collection(db, 'bookings'),
      (snapshot) => {
        const deletedIds = new Set(getDeletedBookingIds());
        const list: Booking[] = [];
        snapshot.forEach((docSnap) => {
          const raw = docSnap.data();
          const b = normalizeBooking({ ...raw, bookingId: raw?.bookingId || docSnap.id });
          const upperId = String(b?.bookingId || docSnap.id || '').trim().toUpperCase();
          if (b && b.bookingId) {
            if (deletedIds.has(upperId)) {
              withFirestoreTimeout(deleteDoc(doc(db, 'bookings', docSnap.id)), 2000).catch(() => {});
            } else {
              list.push(b);
            }
          }
        });
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        try {
          localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(list.slice(0, 200)));
        } catch {}
        onUpdate(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'bookings');
      }
    );
    return unsubscribe;
  } catch {
    return () => {};
  }
}

// Send travelingcab Branded Email from prajapatialok8546@gmail.com with Track ID for New Booking, Completed, Cancelled & Live Ride Updates (Works on Server & Static HTML/CSS/JS Hosting)
export async function sendTripWithCarEmailNotification(
  booking: Booking,
  options?: {
    isLiveUpdate?: boolean;
    liveStatusLabel?: string;
    liveNote?: string;
  }
): Promise<boolean> {
  if (!booking || !booking.bookingId) return false;
  const brandName = 'travelingcab';
  const officialSenderEmail = 'prajapatialok8546@gmail.com';
  const rawEmail = String(booking.passengerEmail || '').trim().toLowerCase();
  const hasRealEmail = Boolean(
    rawEmail &&
      rawEmail.includes('@') &&
      !rawEmail.endsWith('@guest.tripwithcar.com') &&
      !rawEmail.endsWith('@tripwithcar.com') &&
      !rawEmail.endsWith('@guest.travelcap.com') &&
      !rawEmail.endsWith('@travelcap.com') &&
      !rawEmail.endsWith('@manual.travelingcab.com')
  );
  const targetEmail = hasRealEmail ? rawEmail : officialSenderEmail;
  const cleanPhone = String(booking.passengerPhone || '').replace(/\D/g, '').slice(-10);
  const trackUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/?track=${booking.bookingId}`
      : `https://travelingcab.com/?track=${booking.bookingId}`;
  const vehicleName = booking.vehicle?.name || 'AC Cab';
  const isLiveUpdate = Boolean(options?.isLiveUpdate);
  const paymentModeLabel =
    booking.paymentPreference === 'online_pay' || booking.paymentPreference === 'full_online'
      ? 'Online Pay (UPI / QR / Online)'
      : 'Cash in Hand (Pay to Chauffeur)';

  const liveStatusLabel =
    options?.liveStatusLabel ||
    (booking.status === 'cancelled'
      ? 'BOOKING CANCELLED'
      : booking.status === 'completed' || booking.tripStage === 'completed'
      ? 'RIDE COMPLETED SUCCESSFULLY'
      : booking.tripStage === 'ongoing'
      ? 'TRIP IN TRANSIT (ON ROUTE)'
      : booking.tripStage === 'arrived'
      ? 'CAB ARRIVED AT PICKUP LOCATION'
      : booking.tripStage === 'enroute'
      ? 'DRIVER EN ROUTE TO PICKUP'
      : booking.driverName || booking.status === 'assigned'
      ? 'CHAUFFEUR & CAB ASSIGNED'
      : 'BOOKING CONFIRMED');

  const liveNote =
    options?.liveNote ||
    booking.currentLocationNote ||
    (booking.status === 'cancelled'
      ? `Your ${brandName} reservation (${booking.bookingId}) has been cancelled. Call +91 7080224963 for any assistance.`
      : booking.status === 'completed'
      ? `Your trip with ${brandName} from ${booking.pickupCity} to ${booking.dropCity || 'Destination'} has been completed. Thank you for riding with ${brandName}!`
      : `Your ${brandName} reservation is active and monitored by our 24/7 dispatch desk.`);

  const emailSubject = isLiveUpdate
    ? `${brandName} Ride Update [${liveStatusLabel}] - Track ID: ${booking.bookingId}`
    : `${brandName} Cab Confirmed - Track ID: ${booking.bookingId} (${booking.pickupCity} to ${booking.dropCity || 'Local'})`;

  const formattedEmailText =
    `========================================\n` +
    `🚕 ${brandName.toUpperCase()} - ${isLiveUpdate ? 'LIVE RIDE STATUS UPDATE' : 'BOOKING CONFIRMATION'}\n` +
    `From: ${brandName} <${officialSenderEmail}>\n` +
    `========================================\n` +
    `Website: ${brandName}\n` +
    `Official Email: ${officialSenderEmail}\n` +
    `Track ID (Booking PNR): ${booking.bookingId}\n` +
    `Ride Status: ${liveStatusLabel}\n` +
    `Update Note: ${liveNote}\n` +
    `----------------------------------------\n` +
    `Passenger Name: ${booking.passengerName || 'Valued Guest'}\n` +
    `Mobile Number: +91 ${cleanPhone}\n` +
    `Route: ${booking.pickupCity || 'Varanasi'} -> ${booking.dropCity || 'Local Tour'}\n` +
    `Pickup Schedule: ${booking.pickupDate || ''} at ${booking.pickupTime || ''}\n` +
    `Cab Model: ${vehicleName}\n` +
    (booking.driverName
      ? `Assigned Chauffeur: ${booking.driverName} (+91 ${booking.driverPhone || '7080224963'})\n`
      : '') +
    `Total Fare: Rs. ${booking.totalFare || 0}\n` +
    `Payment Option: ${paymentModeLabel}\n` +
    `----------------------------------------\n` +
    `Live Track Link (Track ID ${booking.bookingId}):\n${trackUrl}\n` +
    `24/7 ${brandName} Helpline: +91 7080224963\n` +
    `========================================`;

  // 1. Background server log (/api/send-email) if backend is present
  fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      email: targetEmail,
      fromEmail: officialSenderEmail,
      passengerName: booking.passengerName,
      bookingId: booking.bookingId,
      pickupCity: booking.pickupCity,
      dropCity: booking.dropCity,
      pickupDate: booking.pickupDate,
      pickupTime: booking.pickupTime,
      vehicleName,
      totalFare: booking.totalFare,
      paymentPreference: booking.paymentPreference || 'cash_to_driver',
      driverName: booking.driverName,
      driverPhone: booking.driverPhone,
      trackUrl,
      liveStatus: liveStatusLabel,
      liveNote,
      isLiveUpdate,
      subject: emailSubject,
      text: formattedEmailText,
    }),
  }).catch(() => {});

  // 2. Direct Client-Side Browser HTML/CSS/JS Email Dispatch (Immediate 0ms delivery for Confirmed, Completed & Cancelled rides)
  const isRelayOwner = targetEmail === 'kannaujiyadheeraj4@gmail.com';
  const browserPayload: Record<string, string> = {
    name: brandName,
    _from: brandName,
    _subject: emailSubject,
    _template: 'box',
    _captcha: 'false',
    _replyto: officialSenderEmail,
    ...(isRelayOwner ? {} : { email: targetEmail, _cc: targetEmail, _autoresponse: formattedEmailText }),
    Website_Name: brandName,
    Track_ID: booking.bookingId,
    Ride_Status: liveStatusLabel,
    Status_Note: liveNote,
    Passenger_Name: booking.passengerName || 'Guest',
    Route: `${booking.pickupCity || 'Varanasi'} -> ${booking.dropCity || 'Local'}`,
    Schedule: `${booking.pickupDate || ''} at ${booking.pickupTime || ''}`,
    Cab_Model: vehicleName,
    Total_Fare: `Rs. ${booking.totalFare || 0}`,
    Message: formattedEmailText,
  };

  try {
    await fetch('https://formsubmit.co/ajax/kannaujiyadheeraj4%40gmail.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(browserPayload),
    });
  } catch {}

  return true;
}

export function generateDriverAssignmentWhatsAppText(booking: Booking): string {
  const driverName = booking.driverName || 'Designated Senior Chauffeur';
  const driverPhone = booking.driverPhone || COMPANY_WHATSAPP;
  const vehicleNo = booking.vehicleNumber || 'Commercial AC Cab';
  const paymentModeLabel =
    booking.paymentPreference === 'online_pay' || booking.paymentPreference === 'full_online'
      ? 'Online Pay (UPI / QR / Online)'
      : 'Cash in Hand (Pay to Chauffeur)';

  return `*🚗 TRAVELINGCAB - CHAUFFEUR & CAB DETAILS*
Namaste ${booking.passengerName}! Your cab reservation details:

*Track ID (Booking ID):* ${booking.bookingId}
*Trip:* ${booking.pickupCity} → ${booking.dropCity || 'Destination'}
*Date & Time:* ${booking.pickupDate} at ${booking.pickupTime}
*Cab Model:* ${booking.vehicle?.name || 'Commercial AC Cab'}

*DRIVER DETAILS:*
👤 *Driver Name:* ${driverName}
📱 *Driver Contact:* ${driverPhone}
🚘 *Vehicle:* ${vehicleNo}
💰 *Total Fare:* ₹${booking.totalFare} (${paymentModeLabel} · Tolls & Fuel Included)

Have a safe and comfortable trip with travelingcab! Need help? Call: +91 70802 24963 | Mail: prajapatialok8546@gmail.com`;
}

export function findBooking(query: string): Booking | null {
  const clean = query.trim().toLowerCase();
  if (isBookingDeleted(clean)) return null;
  const bookings = getBookingsFromStorage();
  return bookings.find(
    (b) =>
      (b.bookingId || '').toLowerCase() === clean ||
      (b.passengerPhone || '').replace(/\D/g, '').endsWith(clean.replace(/\D/g, ''))
  ) || null;
}

// Universal search: checks Cloud Firestore + central server + local cache so all devices match
export async function findBookingAsync(query: string): Promise<Booking | null> {
  const clean = query.trim().toLowerCase();
  if (isBookingDeleted(clean)) return null;
  const cleanDigits = clean.replace(/\D/g, '');

  // 1. Check Cloud Firestore directly if query looks like a Booking ID or sync all bookings
  try {
    const allCloud = await syncBookingsFromServer();
    const match = allCloud.find(
      (b) =>
        (b.bookingId || '').toLowerCase() === clean ||
        (cleanDigits.length >= 6 && (b.passengerPhone || '').replace(/\D/g, '').endsWith(cleanDigits))
    );
    if (match && !isBookingDeleted(match.bookingId)) {
      saveBookingToStorage(match, false);
      return match;
    }
  } catch {
    // Fallback to API & local
  }

  // 2. Check Express backend
  try {
    const res = await fetch(`/api/bookings/${encodeURIComponent(clean)}`);
    if (res.ok) {
      const serverBooking: Booking = await res.json();
      if (serverBooking && serverBooking.bookingId && !isBookingDeleted(serverBooking.bookingId)) {
        saveBookingToStorage(serverBooking, false);
        return serverBooking;
      }
    }
  } catch {
    // Network fallback
  }

  return findBooking(query);
}
