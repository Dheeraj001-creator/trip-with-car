export type TripType = 'oneway' | 'roundtrip' | 'local' | 'airport';

export type VehicleCategory = 'hatchback' | 'sedan' | 'suv' | 'crysta' | 'tempo' | 'luxury_suv' | 'force_tourist';

export interface Vehicle {
  id: string;
  name: string;
  category: VehicleCategory;
  modelNames: string;
  seats: number;
  luggage: number;
  ac: boolean;
  ratePerKm: number;
  minKmPerDay: number;
  localRates: {
    '4h_40km': number;
    '8h_80km': number;
    '12h_120km': number;
    extraKmRate: number;
    extraHourRate: number;
  };
  airportFlatRateVaranasi: number;
  badge?: string;
  description: string;
  features: string[];
  imageUrl: string;
}

export interface PopularRoute {
  id: string;
  from: string;
  fromState: string;
  to: string;
  toState: string;
  distanceKm: number;
  estimatedHours: string;
  highway: string;
  tollEstimate: number;
  startingPrice: number;
  sedanPrice: number;
  suvPrice: number;
  crystaPrice: number;
  highlight: string;
  category: 'pilgrimage' | 'intercity' | 'airport';
  popularBadge?: string;
}

export interface TourPackage {
  id: string;
  title: string;
  titleHi: string;
  location: string;
  duration: string;
  distanceCovered: string;
  sedanPrice: number;
  suvPrice: number;
  crystaPrice: number;
  tempoPrice: number;
  places: string[];
  description: string;
  recommendedFor: string;
}

export interface Booking {
  bookingId: string;
  tripType: TripType;
  pickupCity: string;
  dropCity?: string;
  pickupAddress: string;
  dropAddress?: string;
  pickupDate: string;
  pickupTime: string;
  returnDate?: string;
  returnTime?: string;
  
  // Local package specifics
  localPackageHours?: number;
  localPackageKm?: number;
  
  // Airport transfer specifics
  airportTransferType?: 'to_airport' | 'from_airport';
  airportName?: string;
  flightNumber?: string;

  // Selected vehicle & calculations
  vehicle: Vehicle;
  estimatedDistanceKm: number;
  baseFare: number;
  driverAllowance: number;
  tollEstimate: number;
  gstAmount: number;
  discountAmount: number;
  couponCode?: string;
  totalFare: number;

  // Passenger data
  passengerName: string;
  passengerPhone: string;
  passengerEmail: string;
  passengerCount: number;
  luggageCount: number;
  specialInstructions?: string;

  // Payment & status
  paymentPreference: 'cash_to_driver' | 'advance_20' | 'full_online';
  status: 'confirmed' | 'assigned' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface Review {
  id: string;
  name: string;
  city: string;
  route: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
}

export interface FaqItem {
  question: string;
  questionHi: string;
  answer: string;
  answerHi: string;
  category: 'booking' | 'pricing' | 'driver' | 'cancellation';
}
