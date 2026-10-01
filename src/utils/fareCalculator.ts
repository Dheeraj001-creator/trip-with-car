import { TripType, Vehicle, Booking } from '../types/cab';
import { DISTANCE_MATRIX, POPULAR_ROUTES, COMPANY_WHATSAPP, COMPANY_NAME } from '../data/cabsData';

export function calculateDistance(from: string, to: string, tripType: TripType): number {
  if (tripType === 'local') return 80;
  if (tripType === 'airport') return 26;

  const cleanFrom = from.trim();
  const cleanTo = to.trim();

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
    
    // Check if fixed popular route matches
    const popRoute = POPULAR_ROUTES.find(
      (r) =>
        (r.from.toLowerCase().includes(fromCity.toLowerCase()) && r.to.toLowerCase().includes(toCity.toLowerCase())) ||
        (r.to.toLowerCase().includes(fromCity.toLowerCase()) && r.from.toLowerCase().includes(toCity.toLowerCase()))
    );

    if (popRoute) {
      if (vehicle.category === 'sedan') baseFare = popRoute.sedanPrice;
      else if (vehicle.category === 'suv') baseFare = popRoute.suvPrice;
      else if (vehicle.category === 'crysta') baseFare = popRoute.crystaPrice;
      else baseFare = popRoute.startingPrice;
      
      driverAllowance = 300;
      tollEstimate = Math.round(estimatedDistanceKm * 1.6);
      isFixedRoute = true;
      packageNote = 'Fixed corridor point-to-point tariff';
    } else {
      const billableKm = Math.max(estimatedDistanceKm, 200);
      baseFare = Math.round(billableKm * vehicle.ratePerKm);
      driverAllowance = 350;
      tollEstimate = Math.round(billableKm * 1.5);
      packageNote = `One-way outstation tariff (${billableKm} km billable @ ₹${vehicle.ratePerKm}/km)`;
    }
  } else if (tripType === 'roundtrip') {
    const oneWayKm = calculateDistance(fromCity, toCity, 'roundtrip');
    const totalKm = oneWayKm * 2;

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
    baseFare = Math.round(billableKm * vehicle.ratePerKm);
    driverAllowance = days * 400; // Rs 400/day driver DA
    tollEstimate = Math.round(totalKm * 1.4);
    packageNote = `Round-trip multi-day tariff (${days} Days · ${billableKm} km @ ₹${vehicle.ratePerKm}/km)`;
  }

  // Calculate discount if coupon applied
  let discountAmount = 0;
  const cleanCoupon = (couponCode || '').trim().toUpperCase();
  if (cleanCoupon === 'WELCOME100') {
    discountAmount = 100;
  } else if (cleanCoupon === 'RAMDHAM200' && (toCity.toLowerCase().includes('ayodhya') || fromCity.toLowerCase().includes('ayodhya'))) {
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

  const text = `TRIPWITHCAR CHAUFFEUR DISPATCH
Reference: ${booking.bookingId}
Trip Type: ${booking.tripType.toUpperCase()}
Vehicle: ${booking.vehicle.name} (${booking.vehicle.modelNames})
Origin: ${pickup}
Destination: ${drop}
Date & Time: ${booking.pickupDate} at ${booking.pickupTime}
${booking.returnDate ? `Return Schedule: ${booking.returnDate} (${booking.returnTime || ''})\n` : ''}Estimated Distance: ${booking.estimatedDistanceKm} KM
Total Tariff: INR ${booking.totalFare} (All inclusive)
Payment Mode: ${booking.paymentPreference.replace(/_/g, ' ').toUpperCase()}

Passenger Information:
Name: ${booking.passengerName}
Mobile: +91 ${booking.passengerPhone}
Party Size: ${booking.passengerCount} Pax | Luggage: ${booking.luggageCount} Bags
${booking.specialInstructions ? `Special Instructions: ${booking.specialInstructions}\n` : ''}
Please confirm chauffeur assignment and dispatch credentials.`;

  return `https://wa.me/${COMPANY_WHATSAPP}?text=${encodeURIComponent(text)}`;
}

const BOOKINGS_STORAGE_KEY = 'tripwithcar_user_bookings';

export function saveBookingToStorage(booking: Booking): void {
  try {
    const existingStr = localStorage.getItem(BOOKINGS_STORAGE_KEY);
    const bookings: Booking[] = existingStr ? JSON.parse(existingStr) : [];
    bookings.unshift(booking);
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings.slice(0, 20)));
  } catch (err) {
    console.error('Failed to save booking to storage', err);
  }
}

export function getBookingsFromStorage(): Booking[] {
  try {
    const existingStr = localStorage.getItem(BOOKINGS_STORAGE_KEY);
    return existingStr ? JSON.parse(existingStr) : [];
  } catch (err) {
    return [];
  }
}

export function findBooking(query: string): Booking | null {
  const clean = query.trim().toLowerCase();
  const bookings = getBookingsFromStorage();
  return bookings.find(
    (b) =>
      b.bookingId.toLowerCase() === clean ||
      b.passengerPhone.replace(/\D/g, '').endsWith(clean.replace(/\D/g, ''))
  ) || null;
}
