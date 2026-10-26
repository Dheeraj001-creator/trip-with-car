import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Navigation, 
  Users, 
  Briefcase, 
  Wind, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Phone,
  SlidersHorizontal,
  ArrowDown,
  ArrowLeftRight
} from 'lucide-react';
import { Vehicle, TripType, Booking } from '../types/cab';
import { VEHICLES } from '../data/cabsData';
import { calculateFare, FareCalculationResult, getPromotionalFareBreakdown } from '../utils/fareCalculator';
import { QuickBookingModal } from './QuickBookingModal';
import { CarLoadingOverlay } from './CarLoadingOverlay';

interface CabResultsPageProps {
  tripType: TripType;
  pickupCity: string;
  dropCity: string;
  dropAddress?: string;
  pickupDate?: string;
  pickupTime?: string;
  returnDate?: string;
  returnTime?: string;
  onBackToHome: () => void;
  onBookingConfirmed: (booking: Booking) => void;
  language?: 'en' | 'hi';
  theme: 'dark' | 'light';
}

export const CabResultsPage: React.FC<CabResultsPageProps> = ({
  tripType: initialTripType,
  pickupCity: initialPickupCity,
  dropCity: initialDropCity,
  dropAddress = '',
  pickupDate = new Date().toISOString().split('T')[0],
  pickupTime = '08:00',
  returnDate = new Date(Date.now() + 86400000).toISOString().split('T')[0],
  returnTime = '18:00',
  onBackToHome,
  onBookingConfirmed,
  language = 'en',
  theme,
}) => {
  const isLight = theme === 'light';

  // Active cities & trip type (can toggle One-Way / Round-Trip in Blue on results page too)
  const [pickupCity, setPickupCity] = useState(initialPickupCity || 'Varanasi');
  const [dropCity, setDropCity] = useState(initialDropCity || 'Ayodhya');
  const [tripType, setTripType] = useState<TripType>(initialTripType || 'oneway');

  React.useEffect(() => {
    if (initialPickupCity) setPickupCity(initialPickupCity);
    if (initialDropCity) setDropCity(initialDropCity);
    if (initialTripType) setTripType(initialTripType);
  }, [initialPickupCity, initialDropCity, initialTripType]);

  // Filter category: 'all' | 'sedan' | 'suv' | 'luxury' | 'tempo'
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [tempoSeats, setTempoSeats] = useState<number>(12);

  // Booking modal state
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle>(VEHICLES[0]);
  const [showQuickModal, setShowQuickModal] = useState<boolean>(false);
  const [isCarLoading, setIsCarLoading] = useState<boolean>(false);
  const [loadingCarName, setLoadingCarName] = useState<string>('');

  // Sample fare calculation for route metrics (distance, toll)
  const sampleFare = useMemo(() => {
    return calculateFare(
      VEHICLES[0],
      tripType,
      pickupCity,
      dropCity,
      '8h_80km',
      tripType === 'roundtrip',
      returnDate,
      pickupDate
    );
  }, [tripType, pickupCity, dropCity, returnDate, pickupDate]);

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    if (selectedCategory === 'all') return VEHICLES;
    if (selectedCategory === 'sedan') return VEHICLES.filter(v => v.category === 'sedan' || v.category === 'hatchback');
    if (selectedCategory === 'suv') return VEHICLES.filter(v => v.category === 'suv' || v.category === 'luxury_suv');
    if (selectedCategory === 'luxury') return VEHICLES.filter(v => v.category === 'crysta');
    if (selectedCategory === 'tempo') return VEHICLES.filter(v => v.category === 'tempo' || v.category === 'force_tourist');
    return VEHICLES;
  }, [selectedCategory]);

  const handleSelectVehicleToBook = (v: Vehicle) => {
    setSelectedVehicle(v);
    setShowQuickModal(true);
  };

  // Automatically scroll down directly to available cars section
  useEffect(() => {
    const timer = setTimeout(() => {
      const cabsElement = document.getElementById('available-cabs-grid');
      if (cabsElement) {
        cabsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  const activeFareResult: FareCalculationResult = useMemo(() => {
    return calculateFare(
      selectedVehicle,
      tripType,
      pickupCity,
      dropCity,
      '8h_80km',
      tripType === 'roundtrip',
      returnDate,
      pickupDate
    );
  }, [selectedVehicle, tripType, pickupCity, dropCity, returnDate, pickupDate]);

  return (
    <div className="py-2 sm:py-4 max-w-7xl mx-auto">
      {/* Top Header Navigation Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-inherit">
        <button
          type="button"
          onClick={onBackToHome}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer hover:-translate-x-0.5 ${
            isLight
              ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100 shadow-xs'
              : 'bg-[#0B1120] border-slate-700 text-slate-200 hover:bg-slate-800 shadow-xs'
          }`}
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          <span>{language === 'en' ? 'Back to Search & Modify Route' : 'वापस जाएं / रूट बदलें'}</span>
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Blue One-Way vs Round-Trip Switcher */}
          {tripType !== 'local' && (
            <div className={`inline-flex p-1 rounded-xl border ${
              isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#070B14] border-slate-800'
            }`}>
              <button
                type="button"
                onClick={() => setTripType('oneway')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  tripType === 'oneway'
                    ? 'tab-blue-active'
                    : isLight
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-slate-400 hover:text-white'
                }`}
              >
                <Navigation className="w-3 h-3" />
                <span>One Way</span>
              </button>
              <button
                type="button"
                onClick={() => setTripType('roundtrip')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  tripType === 'roundtrip'
                    ? 'tab-blue-active'
                    : isLight
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-slate-400 hover:text-white'
                }`}
              >
                <ArrowLeftRight className="w-3 h-3" />
                <span>Round Trip</span>
              </button>
            </div>
          )}

          <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
            isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
          }`}>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Zero Advance · Pay During Trip</span>
          </span>
        </div>
      </div>

      {/* Selected Route Spotlight Card */}
      <div className={`p-4 sm:p-6 rounded-3xl border shadow-xl mb-6 relative overflow-hidden transition-all ${
        isLight
          ? 'bg-white border-slate-200 shadow-slate-200/60 text-slate-900'
          : 'bg-[#0B1120] border-slate-800 shadow-black/90 text-white'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3" />
              <span>
                {tripType === 'local'
                  ? 'Local Chauffeur Ride'
                  : tripType === 'roundtrip'
                    ? 'Outstation Round Trip Tariff'
                    : 'Outstation One-Way Tariff'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-lg sm:text-2xl font-black">
              <span className="flex items-center gap-1.5 text-amber-500">
                <MapPin className="w-5 h-5 stroke-[2.5]" />
                <span>{pickupCity}</span>
              </span>
              <span className="text-slate-400">{tripType === 'roundtrip' ? '⇄' : '→'}</span>
              <span className="flex items-center gap-1.5 text-emerald-500">
                <Navigation className="w-5 h-5 stroke-[2.5]" />
                <span>{tripType === 'local' ? (dropAddress || 'Local City Destination') : dropCity}</span>
              </span>
            </div>

            <p className={`text-xs mt-1.5 font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Estimated Distance: <strong className="text-amber-500 font-mono">~{sampleFare.estimatedDistanceKm} KM</strong> · 
              Clean Commercial AC Fleet · Verified Chauffeurs
            </p>
          </div>

          <button
            type="button"
            onClick={onBackToHome}
            className="self-start lg:self-center btn-blue px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer transition-all"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>{language === 'en' ? 'Change Route / Date' : 'रूट बदलें'}</span>
          </button>
        </div>
      </div>

      {/* Vehicle Category Filter Pills (Clean Category Labels without OFF tags) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 no-scrollbar">
        {[
          { id: 'all', label: `All Cabs (${VEHICLES.length})` },
          { id: 'sedan', label: 'Sedans' },
          { id: 'suv', label: 'SUVs' },
          { id: 'luxury', label: 'Innova Crysta' },
          { id: 'tempo', label: 'Tempo Traveller' },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setSelectedCategory(f.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap select-none ${
              selectedCategory === f.id
                ? 'tab-blue-active'
                : isLight
                  ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  : 'bg-[#0F172A] border border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Section Header */}
      <div id="available-cabs-grid" className="flex items-center justify-between mb-4 pt-1">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <h2 className={`text-base sm:text-lg font-black ${isLight ? 'text-slate-950' : 'text-white'}`}>
            {language === 'en' ? 'Select Your Cab' : 'अपनी कैब चुनें'}
          </h2>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
            ({filteredVehicles.length} {language === 'en' ? 'Available Cabs' : 'गाड़ियां उपलब्ध'})
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
          <span>{language === 'en' ? 'Choose below' : 'नीचे चुनें'}</span>
          <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>
      </div>

      {/* Available Cabs Grid in Clean Horizontal Layout with Strikethrough Discount & + Taxes & Charges */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {filteredVehicles.map((rawVehicle) => {
          const seatOpt =
            rawVehicle.seatOptions && rawVehicle.seatOptions.length > 0
              ? rawVehicle.seatOptions.find((o) => o.seats === tempoSeats) || rawVehicle.seatOptions[0]
              : null;

          const v: Vehicle = seatOpt
            ? {
                ...rawVehicle,
                seats: seatOpt.seats,
                luggage: seatOpt.luggage,
                ratePerKm: seatOpt.ratePerKm,
                oneWayRatePerKm: seatOpt.oneWayRatePerKm,
                roundTripRatePerKm: seatOpt.roundTripRatePerKm,
                modelNames: `Force Traveller AC (${seatOpt.label})`,
              }
            : rawVehicle;

          const fare = calculateFare(
            v,
            tripType,
            pickupCity,
            dropCity,
            '8h_80km',
            tripType === 'roundtrip',
            returnDate,
            pickupDate
          );

          const promo = getPromotionalFareBreakdown(fare.totalFare, v);

          const activePerKm =
            tripType === 'oneway'
              ? v.oneWayRatePerKm || v.ratePerKm
              : tripType === 'roundtrip'
                ? v.roundTripRatePerKm || v.ratePerKm
                : v.ratePerKm;

          return (
            <div
              key={v.id}
              className={`rounded-2xl border overflow-hidden transition-all duration-200 flex flex-row items-stretch shadow-sm hover:shadow-xl group ${
                isLight
                  ? 'bg-white border-slate-200/90 hover:border-blue-500 text-slate-900'
                  : 'bg-[#0B1120] border-slate-800 hover:border-blue-500/70 text-white'
              }`}
            >
              {/* Left: Pure White Studio Car Photo */}
              <div className="relative w-[36%] sm:w-[42%] min-h-[142px] sm:min-h-[164px] bg-white flex items-center justify-center p-1.5 sm:p-2.5 shrink-0 border-r border-slate-200/80 dark:border-slate-800 overflow-hidden">
                <img
                  src={v.imageUrl}
                  alt={v.name}
                  className="w-full h-full object-contain object-center scale-105 transition-transform duration-300 group-hover:scale-110"
                />
              </div>

              {/* Right: Clean Car Details, 12/26 Seater Selector, Strikethrough Discount & + Taxes & Charges */}
              <div className="flex-1 p-2.5 sm:p-3.5 flex flex-col justify-between min-w-0">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="text-sm sm:text-base font-extrabold tracking-tight truncate">
                        {v.name}
                      </h4>
                      <p className={`text-[10px] sm:text-[11px] font-medium truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {v.modelNames}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] sm:text-xs font-black font-mono shrink-0 shadow-xs">
                      ₹{activePerKm}/KM
                    </span>
                  </div>

                  {/* Interactive 12 Seater / 26 Seater Selector on Force Tempo Traveller */}
                  {rawVehicle.seatOptions && rawVehicle.seatOptions.length > 0 && (
                    <div className="mt-1 sm:mt-1.5 flex items-center gap-1 flex-wrap">
                      <span className={`text-[9.5px] sm:text-[10.5px] font-bold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                        Seats:
                      </span>
                      <div className="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700">
                        {rawVehicle.seatOptions.map((opt) => (
                          <button
                            key={opt.seats}
                            type="button"
                            onClick={() => setTempoSeats(opt.seats)}
                            className={`px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-black transition-all cursor-pointer ${
                              tempoSeats === opt.seats
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-300 hover:text-blue-500'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Specs Row */}
                  <div className={`flex items-center gap-2 sm:gap-3 mt-1.5 py-1 px-2 sm:px-2.5 rounded-lg border font-bold text-[10px] sm:text-[11px] ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#070B14] border-slate-800 text-slate-200'
                  }`}>
                    <span className="flex items-center gap-1 shrink-0">
                      <Users className="w-3 h-3 text-amber-500" />
                      <span>{v.seats} Seats</span>
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <Briefcase className="w-3 h-3 text-amber-500" />
                      <span>{v.luggage} Bags</span>
                    </span>
                    <span className="flex items-center gap-0.5 text-emerald-500 font-bold shrink-0">
                      <Wind className="w-3 h-3" />
                      <span>AC</span>
                    </span>
                  </div>
                </div>

                {/* Total Price with Discount Applied + Taxes & Charges + Book Cab Button (No outer OFF badges) */}
                <div className="mt-2 pt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-end justify-between gap-2 sm:gap-3">
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-[11px] sm:text-xs font-bold font-mono line-through text-slate-400 decoration-rose-500">
                        ₹{promo.originalDisplayPrice.toLocaleString('en-IN')}
                      </span>
                      <span className="price-badge-chatkar px-2.5 py-0.5 rounded-lg text-xs sm:text-sm inline-flex items-center shrink-0">
                        ₹{promo.upfrontOfferPrice.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* + Taxes & Charges + Discount Applied Note */}
                    <div className={`text-[9.5px] sm:text-[10.5px] font-bold mt-0.5 flex items-center gap-1.5 flex-wrap ${
                      isLight ? 'text-blue-700' : 'text-blue-400'
                    }`}>
                      <span>+ ₹{promo.taxAndCharges} Taxes &amp; Charges</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                        (Discount -₹{promo.carDiscount})
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectVehicleToBook(v)}
                    className="btn-select-book text-[11px] sm:text-xs px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl font-bold cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-sm ml-auto"
                  >
                    <span>Book Cab</span>
                    <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Fast 3-Field Booking Confirmation Popup with Flipkart-Style Price Breakdown */}
      <QuickBookingModal
        isOpen={showQuickModal}
        onClose={() => setShowQuickModal(false)}
        vehicle={selectedVehicle}
        tripType={tripType}
        pickupCity={pickupCity}
        dropCity={dropCity}
        pickupAddress=""
        dropAddress={dropAddress}
        pickupDate={pickupDate}
        pickupTime={pickupTime}
        returnDate={returnDate}
        returnTime={returnTime}
        fareResult={activeFareResult}
        onBookingConfirmed={onBookingConfirmed}
        language={language}
        theme={theme}
      />

      {/* Animated Car Loading Overlay on Select Click */}
      <CarLoadingOverlay
        isOpen={isCarLoading}
        title={`Applying ₹${getPromotionalFareBreakdown(activeFareResult.totalFare, selectedVehicle).carDiscount} Discount on ${loadingCarName || selectedVehicle.name}...`}
        subtitle={`Preparing final fare & tax breakdown for ${pickupCity} → ${dropCity}`}
        theme={theme}
      />
    </div>
  );
};

