import React, { useState } from 'react';
import { 
  ArrowRight, 
  ArrowLeft,
  Navigation, 
  CreditCard, 
  Search, 
  X, 
  Sparkles, 
  MapPin, 
  Calendar, 
  Clock, 
  Car, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck,
  Users,
  Briefcase,
  Wind
} from 'lucide-react';
import { POPULAR_ROUTES, VEHICLES } from '../data/cabsData';
import { Vehicle, TripType, PopularRoute } from '../types/cab';

interface RouteBookingData {
  from: string;
  to: string;
  car: Vehicle;
  tripType: TripType;
  date: string;
  returnDate?: string;
  time: string;
  returnTime?: string;
  fare: number;
  distanceKm: number;
}

interface PopularRoutesProps {
  onSelectRoute: (from: string, to: string) => void;
  onBookRoute?: (bookingData: RouteBookingData) => void;
  onBackToHome?: () => void;
  language?: 'en' | 'hi';
  theme: 'dark' | 'light';
}

export const PopularRoutes: React.FC<PopularRoutesProps> = ({
  onSelectRoute,
  onBookRoute,
  onBackToHome,
  language = 'en',
  theme,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAllRoutes, setShowAllRoutes] = useState<boolean>(false);
  const isLight = theme === 'light' || (typeof document !== 'undefined' && document.documentElement.classList.contains('light'));

  // Route Booking Popup state
  const [selectedRouteModal, setSelectedRouteModal] = useState<PopularRoute | null>(null);
  const [modalTripType, setModalTripType] = useState<TripType>('oneway');
  const [selectedCarCategory, setSelectedCarCategory] = useState<string>('sedan');
  
  const todayStr = new Date().toISOString().split('T')[0];

  const [pickupDate, setPickupDate] = useState<string>('');
  const [returnDate, setReturnDate] = useState<string>('');
  const [pickupTime, setPickupTime] = useState<string>('');
  const [returnTime, setReturnTime] = useState<string>('');
  const [modalError, setModalError] = useState<string>('');

  const filteredRoutes = POPULAR_ROUTES.filter((r) => {
    // Category filter
    let matchesCat = true;
    if (activeFilter === 'pilgrimage') matchesCat = r.category === 'pilgrimage';
    else if (activeFilter === 'interstate') matchesCat = r.toState !== r.fromState;
    else if (activeFilter === 'up') matchesCat = r.fromState === 'Uttar Pradesh' && r.toState === 'Uttar Pradesh';
    else if (activeFilter === 'airport') matchesCat = r.category === 'airport';

    // Search query filter
    const matchesSearch = !searchQuery.trim() || 
      r.from.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.toState.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.fromState.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.highway.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCat && matchesSearch;
  });

  // Exactly 6 routes displayed initially, remaining expandable via View More
  const displayedRoutes = showAllRoutes ? filteredRoutes : filteredRoutes.slice(0, 6);

  // Helper to calculate exact fare for selected route, vehicle category and trip type
  const getCarFare = (route: PopularRoute, carCat: string, type: TripType): number => {
    let baseFare = route.sedanPrice;
    if (carCat === 'suv' || carCat === 'luxury_suv') {
      baseFare = route.suvPrice;
    } else if (carCat === 'crysta') {
      baseFare = route.crystaPrice;
    } else if (carCat === 'tempo' || carCat === 'force_tourist') {
      baseFare = Math.round((route.suvPrice * 1.55) / 100) * 100;
    }

    if (type === 'roundtrip') {
      return Math.round((baseFare * 1.75) / 100) * 100;
    }
    return baseFare;
  };

  const handleOpenRouteModal = (route: PopularRoute) => {
    setSelectedRouteModal(route);
    setModalTripType('oneway');
    setSelectedCarCategory('sedan');
    setPickupDate('');
    setReturnDate('');
    setPickupTime('');
    setReturnTime('');
    setModalError('');
  };

  const handleConfirmModalBooking = () => {
    if (!selectedRouteModal) return;

    if (!pickupDate || !pickupTime) {
      setModalError(
        language === 'en'
          ? 'Please select both Pickup Date and Pickup Time first!'
          : 'कृपया पहले पिकअप तारीख (Pickup Date) और पिकअप समय (Pickup Time) दोनों भरें!'
      );
      return;
    }

    if (modalTripType === 'roundtrip' && (!returnDate || !returnTime)) {
      setModalError(
        language === 'en'
          ? 'Please select both Return Date and Return Time first!'
          : 'कृपया पहले वापसी तारीख (Return Date) और वापसी समय (Return Time) दोनों भरें!'
      );
      return;
    }

    setModalError('');
    const matchedCar = VEHICLES.find(v => v.category === selectedCarCategory) || VEHICLES[0];
    const fare = getCarFare(selectedRouteModal, selectedCarCategory, modalTripType);

    if (onBookRoute) {
      onBookRoute({
        from: selectedRouteModal.from,
        to: selectedRouteModal.to,
        car: matchedCar,
        tripType: modalTripType,
        date: pickupDate,
        returnDate: modalTripType === 'roundtrip' ? returnDate : undefined,
        time: pickupTime,
        returnTime: modalTripType === 'roundtrip' ? returnTime : undefined,
        fare,
        distanceKm: selectedRouteModal.distanceKm,
      });
      setSelectedRouteModal(null);
    } else {
      setSelectedRouteModal(null);
      onSelectRoute(selectedRouteModal.from, selectedRouteModal.to);
    }
  };

  const selectedVehicleObj = VEHICLES.find(v => v.category === selectedCarCategory) || VEHICLES[0];

  return (
    <section id="popular-routes" className="py-2 sm:py-4 max-w-7xl mx-auto">
      {/* Top Back to Home Navigation Button */}
      {onBackToHome && (
        <div className="mb-4 pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToHome}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold border transition-all cursor-pointer active:scale-95 ${
              isLight
                ? 'bg-white border-slate-300 text-slate-900 hover:bg-amber-50 hover:border-amber-400 shadow-xs'
                : 'bg-[#0B1120] border-slate-700 text-white hover:bg-slate-800 hover:border-amber-500/60 shadow-xs'
            }`}
          >
            <ArrowLeft className="w-4 h-4 text-amber-500 stroke-[2.8]" />
            <span>{language === 'hi' ? 'होम पेज पर वापस जाएं (Back)' : 'Back to Home'}</span>
          </button>

          <span className="text-[11px] sm:text-xs font-bold text-amber-500">
            {POPULAR_ROUTES.length}+ Verified Highway Corridors
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-bold tracking-normal leading-snug ${
          isLight ? 'text-slate-900' : 'text-white'
        }`}>
          Popular Highway &amp; Intercity Corridors
        </h2>

        <p className={`text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed ${
          isLight ? 'text-slate-600' : 'text-slate-400'
        }`}>
          Real market-verified fixed rates with highway fastag tolls, chauffeur daily allowance, and fuel fully included. Zero surprise extras.
        </p>
      </div>

      {/* SEARCH & FILTER CONTROL BAR */}
      <div className={`p-3.5 sm:p-4 rounded-2xl border shadow-sm mb-7 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5 ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#0B1120] border-slate-800'
      }`}>
        {/* Full-Featured Search Input */}
        <div className="relative flex-1 max-w-lg">
          <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
            isLight ? 'text-slate-400' : 'text-slate-500'
          }`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search destination, city, or corridor (e.g. Ayodhya, Bodh Gaya)..."
            className={`w-full rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm font-medium focus:outline-none transition-all placeholder:font-normal placeholder:opacity-40 ${
              isLight
                ? 'bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:bg-white'
                : 'bg-[#070B14] border border-slate-700/80 text-white placeholder:text-slate-500 focus:border-amber-500'
            }`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {[
            { id: 'all', label: `All (${POPULAR_ROUTES.length})` },
            { id: 'pilgrimage', label: 'Spiritual / Yatra' },
            { id: 'up', label: 'Uttar Pradesh' },
            { id: 'interstate', label: 'Interstate' },
            { id: 'airport', label: 'Airport' },
          ].map((f) => {
            const isActive = activeFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer select-none whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold shadow-sm'
                    : isLight
                      ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                      : 'bg-[#070B14] border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {filteredRoutes.length === 0 && (
        <div className={`text-center py-12 px-4 rounded-2xl border ${
          isLight ? 'bg-white border-slate-200 text-slate-600' : 'bg-[#0B1120] border-slate-800 text-slate-400'
        }`}>
          <MapPin className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-60" />
          <h3 className="text-sm font-bold">No corridors match &quot;{searchQuery}&quot;</h3>
          <p className="text-xs mt-1">Try searching another city or clear the filter.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setActiveFilter('all');
            }}
            className="mt-3 px-4 py-1.5 rounded-xl btn-gold text-xs font-bold"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* Highway Routes Grid (Only 6 routes by default, clean destination cards without messy prices) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedRoutes.map((route) => (
          <div
            key={route.id}
            onClick={() => handleOpenRouteModal(route)}
            className={`border rounded-2xl p-5 sm:p-5.5 transition-all duration-200 flex flex-col justify-between shadow-md hover:shadow-xl hover:-translate-y-1 group cursor-pointer ${
              isLight
                ? 'bg-white border-slate-200 hover:border-amber-400 text-slate-900'
                : 'bg-[#0F172A] border-slate-800 hover:border-amber-400/70 text-white'
            }`}
          >
            <div>
              {/* State & Route Badges */}
              <div className="flex items-center justify-between gap-1 mb-2.5">
                <span className={`text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-md border uppercase ${
                  isLight
                    ? 'bg-amber-50 text-amber-800 border-amber-300/70'
                    : 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                }`}>
                  {route.toState}
                </span>

                {route.popularBadge && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    isLight
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {route.popularBadge}
                  </span>
                )}
              </div>

              {/* Highway name */}
              <div className={`text-xs font-semibold flex items-center gap-1.5 mb-3 truncate ${
                isLight ? 'text-slate-600' : 'text-slate-400'
              }`}>
                <Navigation className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">{route.highway}</span>
              </div>

              {/* Visual Destination & Route Flow (Clean Display Only) */}
              <div className={`p-3.5 rounded-xl border mb-3.5 space-y-2.5 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#090D16] border-slate-800/80'
              }`}>
                <div className="flex items-start gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[9px] uppercase tracking-wider block font-bold text-amber-500">
                      Origin · {route.fromState}
                    </span>
                    <span className="text-sm sm:text-base font-black block truncate">{route.from}</span>
                  </div>
                </div>

                <div className={`border-l-2 border-dashed ml-1.5 pl-3.5 py-1 text-xs font-mono font-bold flex items-center gap-2 ${
                  isLight ? 'border-amber-300 text-slate-700' : 'border-amber-500/50 text-amber-300'
                }`}>
                  <span>{route.distanceKm} KM</span>
                  <span className="opacity-50">·</span>
                  <span>~{route.estimatedHours}</span>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[9px] uppercase tracking-wider block font-bold text-emerald-600 dark:text-emerald-400">
                      Destination · {route.toState}
                    </span>
                    <span className="text-sm sm:text-base font-black block truncate">{route.to}</span>
                  </div>
                </div>
              </div>

              {/* Route Highlight Description */}
              {route.highlight && (
                <p className={`text-[11.5px] leading-relaxed mb-3 line-clamp-2 ${
                  isLight ? 'text-slate-600' : 'text-slate-400'
                }`}>
                  {route.highlight}
                </p>
              )}

              {/* Toll & Zero Advance Assurance Strip */}
              <div className={`flex items-center justify-between text-xs py-2 px-2.5 rounded-xl border mb-3 ${
                isLight ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
              }`}>
                <span className="flex items-center gap-1.5 font-semibold text-[11px]">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Fastag Tolls Included (~₹{route.tollEstimate})</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Zero Advance
                </span>
              </div>
            </div>

            {/* Action CTA Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenRouteModal(route);
                }}
                className="w-full btn-blue py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer font-bold tracking-wide transition-all shadow-sm hover:shadow-md"
              >
                <span>{language === 'en' ? 'View All Cars & Book' : 'सभी गाड़ियां देखें व बुक करें'}</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.8]" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* VIEW MORE / SHOW FEWER ROUTES TOGGLE (Fixed formatted button, smooth toggle) */}
      {filteredRoutes.length > 6 && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setShowAllRoutes(!showAllRoutes)}
            className="btn-view-toggle w-[240px] sm:w-[270px] h-11 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer select-none text-center shadow-xs"
          >
            <span>
              {showAllRoutes
                ? (language === 'en' ? 'Show Fewer Routes (Top 6)' : 'कम रूट्स देखें (Top 6)')
                : (language === 'en' ? `View More Routes (${filteredRoutes.length - 6}+)` : `और रूट्स देखें (${filteredRoutes.length - 6}+)`)}
            </span>
            {showAllRoutes ? (
              <ChevronUp className="w-4 h-4 stroke-[2.5] shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 stroke-[2.5] shrink-0" />
            )}
          </button>
        </div>
      )}

      {/* 100% FITTED ROUTE BOOKING POPUP MODAL (Zero Scroll, Mobile & PC Friendly) */}
      {selectedRouteModal && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className={`relative w-full max-w-[460px] max-h-[92vh] flex flex-col rounded-2xl sm:rounded-3xl shadow-2xl border overflow-hidden my-auto transition-all ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/60'
              : 'bg-[#0B1324] border-slate-700/80 text-white shadow-black/90'
          }`}>
            {/* Header */}
            <div className={`px-4 py-3 border-b flex items-center justify-between shrink-0 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#070D1A] border-slate-800'
            }`}>
              <div className="min-w-0 pr-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 block">
                  {selectedRouteModal.highway}
                </span>
                <div className="flex items-center gap-1.5 font-black text-sm sm:text-base truncate">
                  <span className="text-amber-500 truncate">{selectedRouteModal.from}</span>
                  <span className="opacity-50">→</span>
                  <span className="text-emerald-500 truncate">{selectedRouteModal.to}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRouteModal(null)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                  isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Compact & Fitted (Zero unnecessary scroll) */}
            <div className="p-3.5 sm:p-4 space-y-3.5 overflow-y-auto scrollbar-none">
              {/* Trip Type Selector: One Way vs Round Trip in Blue */}
              <div>
                <label className="text-[10.5px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5">
                  {language === 'en' ? 'Select Trip Type' : 'यात्रा का प्रकार चुनें'}
                </label>
                <div className={`grid grid-cols-2 p-1 rounded-xl border ${
                  isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#070D1A] border-slate-800'
                }`}>
                  <button
                    type="button"
                    onClick={() => setModalTripType('oneway')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      modalTripType === 'oneway'
                        ? 'tab-blue-active'
                        : isLight
                          ? 'text-slate-700 hover:text-slate-950'
                          : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <span>One Way</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalTripType('roundtrip')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      modalTripType === 'roundtrip'
                        ? 'tab-blue-active'
                        : isLight
                          ? 'text-slate-700 hover:text-slate-950'
                          : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <span>Round Trip ⇄</span>
                  </button>
                </div>
              </div>

              {/* Vehicle & Price Dropdown */}
              <div>
                <label className="text-[10.5px] uppercase font-bold tracking-wider text-slate-400 flex items-center justify-between mb-1.5">
                  <span>{language === 'en' ? 'Select Vehicle Class & Fare' : 'गाड़ी व किराया चुनें'}</span>
                  <span className="text-emerald-500 font-bold lowercase text-[10px]">Instant ₹200–₹300 OFF</span>
                </label>

                {/* Styled Native Select for 100% Mobile & Desktop Compatibility */}
                <div className="relative">
                  <select
                    value={selectedCarCategory}
                    onChange={(e) => setSelectedCarCategory(e.target.value)}
                    style={{
                      color: isLight ? '#020617' : '#FFFFFF',
                      backgroundColor: isLight ? '#F8FAFC' : '#070D1A'
                    }}
                    className={`w-full appearance-none rounded-xl px-3.5 py-3 pr-10 text-xs sm:text-sm font-bold border transition-colors cursor-pointer focus:outline-none focus:border-blue-500 ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-950'
                        : 'bg-[#070D1A] border-slate-700 text-white'
                    }`}
                  >
                    <option value="sedan" style={{ background: isLight ? '#FFFFFF' : '#0B1324', color: isLight ? '#020617' : '#FFFFFF' }}>
                      Sedan (Dzire / Etios) — ₹{getCarFare(selectedRouteModal, 'sedan', modalTripType) - 200} (₹200 OFF)
                    </option>
                    <option value="suv" style={{ background: isLight ? '#FFFFFF' : '#0B1324', color: isLight ? '#020617' : '#FFFFFF' }}>
                      SUV (Ertiga / Carens) — ₹{getCarFare(selectedRouteModal, 'suv', modalTripType) - 300} (₹300 OFF)
                    </option>
                    <option value="crysta" style={{ background: isLight ? '#FFFFFF' : '#0B1324', color: isLight ? '#020617' : '#FFFFFF' }}>
                      Innova Crysta (Luxury) — ₹{getCarFare(selectedRouteModal, 'crysta', modalTripType) - 300} (₹300 OFF)
                    </option>
                    <option value="tempo" style={{ background: isLight ? '#FFFFFF' : '#0B1324', color: isLight ? '#020617' : '#FFFFFF' }}>
                      Tempo Traveller (12-16 Pax) — ₹{getCarFare(selectedRouteModal, 'tempo', modalTripType) - 300} (₹300 OFF)
                    </option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-blue-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Selected Car Details Strip with Strikethrough Discount & + Taxes & Charges */}
                <div className={`mt-2 p-2.5 rounded-xl border flex items-center justify-between text-[11px] ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#070D1A] border-slate-800 text-slate-300'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <img 
                      src={selectedVehicleObj.imageUrl} 
                      alt={selectedVehicleObj.name} 
                      className="w-12 h-8 object-contain bg-white rounded-lg p-0.5 border border-slate-200" 
                    />
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-amber-500" />
                        <span>{selectedVehicleObj.seats} Seats</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                        <span>{selectedVehicleObj.luggage} Bags</span>
                      </span>
                      <span className="flex items-center gap-1 text-emerald-500 font-bold">
                        <Wind className="w-3.5 h-3.5" />
                        <span>AC</span>
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1.5 mb-0.5">
                      <span className="text-[10.5px] font-mono font-bold text-slate-400 line-through decoration-rose-500 decoration-2">
                        ₹{getCarFare(selectedRouteModal, selectedCarCategory, modalTripType).toLocaleString('en-IN')}
                      </span>
                      <span className="price-badge-chatkar px-2 py-0.5 rounded-lg text-xs sm:text-sm">
                        ₹{(
                          getCarFare(selectedRouteModal, selectedCarCategory, modalTripType) -
                          (selectedCarCategory === 'sedan' ? 200 : 300)
                        ).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <span className="text-[9.5px] font-bold text-blue-600 dark:text-blue-400 block">
                      + ₹500 Taxes &amp; Charges
                    </span>
                  </div>
                </div>
              </div>

              {/* Date and Time to the Left of the Button (Round Trip has Pickup + Return times, One Way has 1 date + time) */}
              <div className="pt-1">
                {modalTripType === 'roundtrip' ? (
                  /* Round Trip: Pickup Schedule (Date + Time) & Return Schedule (Date + Time) */
                  <div className="space-y-2 mb-3">
                    {/* Row 1: Pickup Schedule */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="min-w-0">
                        <label className="text-[10px] uppercase font-bold text-amber-500 flex items-center gap-1 mb-1 truncate">
                          <Calendar className="w-3 h-3 text-amber-500 shrink-0" />
                          <span className="truncate">{language === 'en' ? 'Pickup Date' : 'पिकअप तारीख'}</span>
                        </label>
                        <input
                          type="date"
                          min={todayStr}
                          value={pickupDate}
                          onChange={(e) => {
                            setPickupDate(e.target.value);
                            if (returnDate < e.target.value) setReturnDate(e.target.value);
                          }}
                          style={{
                            color: isLight ? '#020617' : '#FFFFFF',
                            backgroundColor: isLight ? '#FFFFFF' : '#070D1A'
                          }}
                          className={`w-full rounded-xl px-2 py-1.5 sm:px-2.5 sm:py-2 text-[11px] sm:text-xs font-bold border transition-colors focus:outline-none focus:border-blue-500 ${
                            isLight ? 'bg-white border-slate-300 text-slate-950' : 'bg-[#070D1A] border-slate-700 text-white'
                          }`}
                        />
                      </div>

                      <div className="min-w-0">
                        <label className="text-[10px] uppercase font-bold text-amber-500 flex items-center gap-1 mb-1 truncate">
                          <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                          <span className="truncate">{language === 'en' ? 'Pickup Time' : 'पिकअप समय'}</span>
                        </label>
                        <input
                          type="time"
                          value={pickupTime}
                          onChange={(e) => setPickupTime(e.target.value)}
                          style={{
                            color: isLight ? '#020617' : '#FFFFFF',
                            backgroundColor: isLight ? '#FFFFFF' : '#070D1A'
                          }}
                          className={`w-full rounded-xl px-2 py-1.5 sm:px-2.5 sm:py-2 text-[11px] sm:text-xs font-bold border transition-colors focus:outline-none focus:border-blue-500 ${
                            isLight ? 'bg-white border-slate-300 text-slate-950' : 'bg-[#070D1A] border-slate-700 text-white'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Row 2: Return Schedule */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="min-w-0">
                        <label className="text-[10px] uppercase font-bold text-emerald-500 flex items-center gap-1 mb-1 truncate">
                          <Calendar className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span className="truncate">{language === 'en' ? 'Return Date' : 'वापसी तारीख'}</span>
                        </label>
                        <input
                          type="date"
                          min={pickupDate || todayStr}
                          value={returnDate}
                          onChange={(e) => setReturnDate(e.target.value)}
                          style={{
                            color: isLight ? '#020617' : '#FFFFFF',
                            backgroundColor: isLight ? '#FFFFFF' : '#070D1A'
                          }}
                          className={`w-full rounded-xl px-2 py-1.5 sm:px-2.5 sm:py-2 text-[11px] sm:text-xs font-bold border transition-colors focus:outline-none focus:border-emerald-500 ${
                            isLight ? 'bg-white border-slate-300 text-slate-950' : 'bg-[#070D1A] border-slate-700 text-white'
                          }`}
                        />
                      </div>

                      <div className="min-w-0">
                        <label className="text-[10px] uppercase font-bold text-emerald-500 flex items-center gap-1 mb-1 truncate">
                          <Clock className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span className="truncate">{language === 'en' ? 'Return Time' : 'वापसी समय'}</span>
                        </label>
                        <input
                          type="time"
                          value={returnTime}
                          onChange={(e) => setReturnTime(e.target.value)}
                          style={{
                            color: isLight ? '#020617' : '#FFFFFF',
                            backgroundColor: isLight ? '#FFFFFF' : '#070D1A'
                          }}
                          className={`w-full rounded-xl px-2 py-1.5 sm:px-2.5 sm:py-2 text-[11px] sm:text-xs font-bold border transition-colors focus:outline-none focus:border-emerald-500 ${
                            isLight ? 'bg-white border-slate-300 text-slate-950' : 'bg-[#070D1A] border-slate-700 text-white'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* One-Way: Single Travel Date + Pickup Time */
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {/* Pickup Date */}
                    <div className="min-w-0">
                      <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mb-1 truncate">
                        <Calendar className="w-3 h-3 text-amber-500 shrink-0" />
                        <span className="truncate">{language === 'en' ? 'Travel Date' : 'यात्रा की तारीख'}</span>
                      </label>
                        <input
                          type="date"
                          min={todayStr}
                          value={pickupDate}
                          onChange={(e) => {
                            setPickupDate(e.target.value);
                            setModalError('');
                          }}
                          style={{
                            color: isLight ? '#020617' : '#FFFFFF',
                            backgroundColor: isLight ? '#FFFFFF' : '#070D1A'
                          }}
                          className={`w-full rounded-xl px-2 py-1.5 sm:px-2.5 sm:py-2 text-[11px] sm:text-xs font-bold border transition-colors focus:outline-none focus:border-blue-500 ${
                            isLight ? 'bg-white border-slate-300 text-slate-950' : 'bg-[#070D1A] border-slate-700 text-white'
                          }`}
                        />
                      </div>

                      {/* Pickup Time */}
                      <div className="min-w-0">
                        <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mb-1 truncate">
                          <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                          <span className="truncate">{language === 'en' ? 'Pickup Time' : 'पिकअप समय'}</span>
                        </label>
                        <input
                          type="time"
                          value={pickupTime}
                          onChange={(e) => {
                            setPickupTime(e.target.value);
                            setModalError('');
                          }}
                          style={{
                            color: isLight ? '#020617' : '#FFFFFF',
                            backgroundColor: isLight ? '#FFFFFF' : '#070D1A'
                          }}
                          className={`w-full rounded-xl px-2 py-1.5 sm:px-2.5 sm:py-2 text-[11px] sm:text-xs font-bold border transition-colors focus:outline-none focus:border-blue-500 ${
                            isLight ? 'bg-white border-slate-300 text-slate-950' : 'bg-[#070D1A] border-slate-700 text-white'
                          }`}
                        />
                      </div>
                    </div>
                  )}

                  {modalError && (
                    <p className="text-red-500 text-xs font-bold mb-2.5 flex items-center gap-1.5 animate-in fade-in duration-150">
                      <span>⚠️ {modalError}</span>
                    </p>
                  )}

                  {/* Big Action Booking Button in Royal Blue */}
                <button
                  type="button"
                  onClick={handleConfirmModalBooking}
                  className="btn-blue w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer transition-all active:scale-98"
                >
                  <Car className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    {language === 'en'
                      ? `Proceed to Book ${selectedVehicleObj.name}`
                      : `${selectedVehicleObj.name} बुक करने के लिए आगे बढ़ें`}
                  </span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              {/* Safety & Pricing Note */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Fastag Tolls, Fuel &amp; Driver Allowance Included</span>
                </span>
                <span className="font-bold text-amber-500">₹0 Advance Required</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
