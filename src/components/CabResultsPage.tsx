import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Navigation, 
  Car, 
  Users, 
  Briefcase, 
  Wind, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Check, 
  Phone,
  SlidersHorizontal
} from 'lucide-react';
import { Vehicle, TripType, Booking } from '../types/cab';
import { VEHICLES } from '../data/cabsData';
import { calculateFare, FareCalculationResult } from '../utils/fareCalculator';
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
  tripType,
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

  // Active cities
  const [pickupCity] = useState(initialPickupCity || 'Varanasi');
  const [dropCity] = useState(initialDropCity || 'Ayodhya');

  // Filter category: 'all' | 'sedan' | 'suv' | 'luxury' | 'tempo'
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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
    setLoadingCarName(v.name);
    setIsCarLoading(true);

    setTimeout(() => {
      setIsCarLoading(false);
      setShowQuickModal(true);
    }, 400);
  };

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

        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
            isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
          }`}>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Tolls &amp; Fuel Included · Zero Advance</span>
          </span>

          <a
            href="tel:6387922889"
            className="btn-gold hidden md:flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold"
          >
            <Phone className="w-3.5 h-3.5 stroke-[3]" />
            <span>6387922889</span>
          </a>
        </div>
      </div>

      {/* Selected Route Spotlight Card */}
      <div className={`p-4 sm:p-6 rounded-3xl border shadow-xl mb-8 relative overflow-hidden transition-all ${
        isLight
          ? 'bg-white border-slate-200 shadow-slate-200/60 text-slate-900'
          : 'bg-[#0B1120] border-slate-800 shadow-black/90 text-white'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-500 text-[10px] font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{tripType === 'local' ? 'Local Chauffeur Ride' : 'Outstation One Way Ride'}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-lg sm:text-2xl font-black">
              <span className="flex items-center gap-1.5 text-amber-500">
                <MapPin className="w-5 h-5 stroke-[2.5]" />
                <span>{pickupCity}</span>
              </span>
              <span className="text-slate-400">→</span>
              <span className="flex items-center gap-1.5 text-emerald-500">
                <Navigation className="w-5 h-5 stroke-[2.5]" />
                <span>{tripType === 'local' ? (dropAddress || 'Local City Destination') : dropCity}</span>
              </span>
            </div>

            <p className={`text-xs mt-1.5 font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Estimated Distance: <strong className="text-amber-500 font-mono">~{sampleFare.estimatedDistanceKm} KM</strong> · 
              Chauffeur Allowance &amp; Fastag Tolls Included · Clean AC Fleet
            </p>
          </div>

          <button
            type="button"
            onClick={onBackToHome}
            className="self-start lg:self-center btn-gold px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer transition-all"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>{language === 'en' ? 'Change Route' : 'रूट बदलें'}</span>
          </button>
        </div>
      </div>

      {/* Vehicle Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
        {[
          { id: 'all', label: `All Cabs (${VEHICLES.length})` },
          { id: 'sedan', label: 'Sedans (Dzire/Etios)' },
          { id: 'suv', label: 'SUVs (Ertiga/Carens)' },
          { id: 'luxury', label: 'Luxury (Innova Crysta)' },
          { id: 'tempo', label: 'Vans (Urbania/Tempo)' },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setSelectedCategory(f.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap select-none ${
              selectedCategory === f.id
                ? 'tab-gold-active'
                : isLight
                  ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  : 'bg-[#0F172A] border border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Available Cabs Grid with Live All-Inclusive Fares & "Select" button */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.map((v) => {
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

          return (
            <div
              key={v.id}
              className={`rounded-3xl border overflow-hidden transition-all duration-300 flex flex-col justify-between shadow-lg hover:shadow-2xl hover:-translate-y-1 group ${
                isLight
                  ? 'bg-white border-slate-200 hover:border-amber-400 text-slate-900'
                  : 'bg-[#0B1120] border-slate-800 hover:border-amber-400/70 text-white'
              }`}
            >
              <div>
                {/* Car Photo Banner */}
                <div className="relative w-full h-40 sm:h-44 bg-slate-950 overflow-hidden">
                  <img
                    src={v.imageUrl}
                    alt={v.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/25" />

                  {/* Model Name Badge */}
                  <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-2.5 py-0.5 rounded-lg text-xs font-semibold text-white/95 border border-white/10 shadow-xs">
                    {v.modelNames.split(',')[0]}
                  </div>

                  {/* Category Pill */}
                  <div className="absolute top-3 right-3 bg-emerald-950/85 backdrop-blur-md text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                    {v.category.replace('_', ' ').toUpperCase()}
                  </div>

                  {/* Verified Chauffeur Badge */}
                  <div className="absolute bottom-2.5 left-3 bg-black/75 backdrop-blur-sm px-2 py-0.5 rounded text-[11px] font-medium text-amber-300 flex items-center gap-1 border border-white/10">
                    <span>★ 4.9</span>
                    <span className="text-white/80">· Commercial Chauffeur</span>
                  </div>
                </div>

                {/* Car Details */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-base sm:text-lg font-bold tracking-tight group-hover:text-amber-500 transition-colors truncate">
                      {v.name}
                    </h4>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${
                      isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-900 text-slate-300 border-slate-700'
                    }`}>
                      {v.badge}
                    </span>
                  </div>

                  <p className={`text-xs mb-3 truncate ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {v.modelNames}
                  </p>

                  {/* Specs Row */}
                  <div className="flex items-center gap-3 py-2.5 border-t border-b border-inherit font-semibold text-xs">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-amber-500" />
                      <span>{v.seats} Pax</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-amber-500" />
                      <span>{v.luggage} Bags</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-500 font-bold">
                      <Wind className="w-4 h-4" />
                      <span>AC Included</span>
                    </span>
                  </div>

                  {/* Inclusions List */}
                  <div className="pt-3 space-y-1.5 text-[11px]">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Fastag Toll Taxes &amp; State Permits Included</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Chauffeur Daily Allowance &amp; Fuel Included</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fare & Booking Button Footer */}
              <div className={`py-3.5 px-4 sm:px-5 border-t flex items-center justify-between gap-3 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#070B14] border-slate-800'
              }`}>
                <div>
                  <span className={`text-[10px] uppercase tracking-wider font-bold block ${
                    isLight ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    All-Inclusive Total
                  </span>
                  <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
                    ₹{fare.totalFare}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectVehicleToBook(v)}
                  className="btn-select-book text-xs sm:text-sm px-4 py-2.5 rounded-xl font-bold cursor-pointer"
                >
                  <span>Book Cab</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Fast 3-Field Booking Confirmation Popup */}
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
        title={`Connecting with ${loadingCarName || selectedVehicle.name}...`}
        subtitle={`Verifying chauffeur route & all-inclusive tariff for ${pickupCity} → ${dropCity}`}
        theme={theme}
      />
    </div>
  );
};
