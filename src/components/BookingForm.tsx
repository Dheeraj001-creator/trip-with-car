import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  MapPin, 
  ArrowLeftRight, 
  ArrowUpDown,
  Plane, 
  Navigation, 
  Car, 
  Users, 
  Briefcase, 
  ShieldCheck, 
  ArrowRight,
  Wind,
  Search,
  Sparkles,
  Lock,
  Phone,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { TripType, Vehicle, Booking } from '../types/cab';
import { VEHICLES, CITIES_LIST, AIRPORTS_LIST } from '../data/cabsData';
import { calculateFare } from '../utils/fareCalculator';
import { QuickBookingModal } from './QuickBookingModal';
import { CityPickerModal } from './CityPickerModal';
import { CarLoadingOverlay } from './CarLoadingOverlay';
import { LockedFeatureModal } from './LockedFeatureModal';

interface BookingFormProps {
  initialTripType?: TripType;
  initialFrom?: string;
  initialTo?: string;
  initialVehicleCategory?: string;
  initialAutoSearch?: boolean;
  onSearchRoute?: (data: { tripType: TripType; pickupCity: string; dropCity: string; dropAddress: string }) => void;
  onBookingConfirmed: (booking: Booking) => void;
  language?: 'en' | 'hi';
  theme: 'dark' | 'light';
  isModal?: boolean;
  onCloseModal?: () => void;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  initialTripType = 'oneway',
  initialFrom = '',
  initialTo = '',
  initialVehicleCategory,
  initialAutoSearch = false,
  onSearchRoute,
  onBookingConfirmed,
  language = 'en',
  theme,
  isModal = false,
  onCloseModal,
}) => {
  const isLight = theme === 'light';

  // Trip Selection state
  const [tripType, setTripType] = useState<TripType>(initialTripType);
  const [pickupCity, setPickupCity] = useState(initialFrom);
  const [dropCity, setDropCity] = useState(initialTo);
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropAddress, setDropAddress] = useState('');
  
  // Coming soon popup modal for locked tabs (Round Trip & Airport Taxi)
  const [comingSoonModal, setComingSoonModal] = useState<{ title: string; serviceName: string } | null>(null);

  // Mobile Popup Elevation: on mobile (<768px), card appears elevated in front on initial open
  const [isMobilePopup, setIsMobilePopup] = useState(() => {
    if (typeof window === 'undefined') return false;
    const dismissed = sessionStorage.getItem('twc_mobile_popup_dismissed');
    return !dismissed && window.innerWidth < 768;
  });

  const handleDismissMobilePopup = () => {
    setIsMobilePopup(false);
    sessionStorage.setItem('twc_mobile_popup_dismissed', 'true');
    if (onCloseModal) onCloseModal();
  };

  // Search state: initially false so cars show without price until search is clicked, or auto-true if selected from route
  const [hasSearched, setHasSearched] = useState(initialAutoSearch);

  // Cars display toggle: mobile shows 2, PC shows 3 until expanded
  const [showAllCars, setShowAllCars] = useState(initialAutoSearch);

  const [fromSuggestionsOpen, setFromSuggestionsOpen] = useState(false);
  const [toSuggestionsOpen, setToSuggestionsOpen] = useState(false);
  const cabsSectionRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to all cars if initialAutoSearch is requested
  useEffect(() => {
    if (initialAutoSearch) {
      setHasSearched(true);
      setShowAllCars(true);
      const timer = setTimeout(() => {
        cabsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [initialAutoSearch, initialFrom, initialTo]);

  // Dates
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [pickupDate] = useState(todayStr);
  const [pickupTime] = useState('08:00');
  const [returnDate] = useState(tomorrowStr);
  const [returnTime] = useState('18:00');

  // Local Package specifics
  const [localPackage, setLocalPackage] = useState<'4h_40km' | '8h_80km' | '12h_120km'>('8h_80km');

  // Airport specifics
  const [airportTransferType, setAirportTransferType] = useState<'from_airport' | 'to_airport'>('from_airport');
  const [selectedAirportId, setSelectedAirportId] = useState(AIRPORTS_LIST[0].id);
  const [flightNumber, setFlightNumber] = useState('');

  // Selected Vehicle
  const defaultVehicle = VEHICLES.find(v => v.category === (initialVehicleCategory || 'sedan')) || VEHICLES[0];
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle>(defaultVehicle);

  // Quick Popup Modal state
  const [showQuickModal, setShowQuickModal] = useState<boolean>(false);
  const [isCarLoading, setIsCarLoading] = useState<boolean>(false);
  const [loadingCarName, setLoadingCarName] = useState<string>('');

  // City Picker Modal state
  const [cityPickerMode, setCityPickerMode] = useState<'pickup' | 'drop' | null>(null);

  // Errors state
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Dynamic Autocomplete suggestions based on typing
  const filteredFromSuggestions = useMemo(() => {
    if (!pickupCity || pickupCity.trim().length === 0) return CITIES_LIST.slice(0, 6);
    const q = pickupCity.toLowerCase().trim();
    return CITIES_LIST.filter(c => c.toLowerCase().includes(q)).slice(0, 6);
  }, [pickupCity]);

  const filteredToSuggestions = useMemo(() => {
    if (!dropCity || dropCity.trim().length === 0) return CITIES_LIST.slice(0, 6);
    const q = dropCity.toLowerCase().trim();
    return CITIES_LIST.filter(c => c.toLowerCase().includes(q)).slice(0, 6);
  }, [dropCity]);

  // Swap Locations with clean spacing
  const handleSwapLocations = () => {
    const temp = pickupCity;
    setPickupCity(dropCity);
    setDropCity(temp);
  };

  // Search Action
  const handleSearchCars = () => {
    if (!pickupCity.trim()) {
      setFormErrors(prev => ({ ...prev, pickupCity: 'Please enter origin city' }));
      return;
    }
    if (tripType === 'oneway' && !dropCity.trim()) {
      setFormErrors(prev => ({ ...prev, dropCity: 'Please enter destination city' }));
      return;
    }
    setFormErrors({});
    if (onSearchRoute) {
      onSearchRoute({ tripType, pickupCity, dropCity, dropAddress });
      if (isModal && onCloseModal) {
        onCloseModal();
      }
      return;
    }
    setHasSearched(true);
    setFromSuggestionsOpen(false);
    setToSuggestionsOpen(false);
    setTimeout(() => {
      cabsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  // Open Reservation popup directly with loading animation
  const handleOpenQuickModal = (vehicle: Vehicle) => {
    if (!hasSearched) {
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }
    setSelectedVehicle(vehicle);
    setLoadingCarName(vehicle.name);
    setIsCarLoading(true);

    setTimeout(() => {
      setIsCarLoading(false);
      setShowQuickModal(true);
    }, 450);
  };

  // Active Fare Calculation for summary
  const fareResult = useMemo(() => {
    return calculateFare(
      selectedVehicle,
      tripType,
      pickupCity,
      dropCity,
      localPackage,
      tripType === 'roundtrip',
      returnDate,
      pickupDate
    );
  }, [selectedVehicle, tripType, pickupCity, dropCity, localPackage, returnDate, pickupDate]);

  const isBothCitiesSelected = Boolean(pickupCity && dropCity && pickupCity.trim() !== '' && dropCity.trim() !== '');

  // All vehicles displayed for full fleet transparency
  const displayedVehicles = VEHICLES;

  // Reordered Trip Type Tabs: 1. One Way, 2. Local Hourly, 3. Round Trip (Locked), 4. Airport Taxi (Locked)
  const tripTabs = [
    { type: 'oneway', label: 'One Way', icon: Navigation, locked: false },
    { type: 'local', label: 'Local Hourly', icon: Car, locked: false },
    { type: 'roundtrip', label: 'Round Trip', icon: ArrowLeftRight, locked: true },
    { type: 'airport', label: 'Airport Taxi', icon: Plane, locked: true },
  ];

  const formCard = (
    <div className={`relative max-w-4xl mx-auto rounded-2xl sm:rounded-3xl border shadow-2xl p-3.5 sm:p-6 md:p-8 transition-all ${
      isLight
        ? 'bg-white border-amber-500/30 shadow-slate-300/40 ring-1 ring-amber-500/20'
        : 'bg-[#0B1120] border-amber-500/30 shadow-black/95 ring-1 ring-amber-500/20'
    } ${isModal ? 'mb-0' : 'mb-8 sm:mb-12'}`}>
      {/* Subtle top golden accent glow line */}
      <div className="absolute top-0 inset-x-8 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent rounded-full opacity-80" />

      {/* Modal Close Button on top right */}
      {isModal && onCloseModal && (
        <button
          type="button"
          onClick={onCloseModal}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer shadow-sm"
          aria-label="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>
      )}
      
      {/* Trip Type Segmented Tabs: One Way, Local Hourly, Round Trip (Locked), Airport Taxi (Locked) */}
      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border mb-4 sm:mb-5 ${
        isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#04070F] border-slate-800'
      }`}>
          {tripTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tripType === tab.type && !tab.locked;
            return (
              <button
                key={tab.type}
                type="button"
                onClick={() => {
                  if (tab.locked) {
                    setComingSoonModal({
                      title: tab.label,
                      serviceName: tab.type === 'roundtrip' ? 'Round Trip Outstation Cabs' : 'Airport Chauffeur Taxi',
                    });
                    return;
                  }
                  setTripType(tab.type as TripType);
                  setHasSearched(false);
                }}
                className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer select-none text-center min-h-[40px] sm:min-h-[44px] ${
                  isActive
                    ? 'tab-gold-active'
                    : tab.locked
                      ? isLight
                        ? 'border border-slate-200 text-slate-500 bg-slate-100/70 hover:bg-slate-100'
                        : 'border border-slate-800 text-slate-400 bg-slate-900/60 hover:bg-slate-900/90'
                      : isLight
                        ? 'border border-transparent text-slate-700 hover:text-slate-950 hover:bg-white/80'
                        : 'border border-transparent text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <div className={`flex items-center gap-1.5 truncate ${
                  tab.locked ? 'opacity-65 filter blur-[0.3px]' : ''
                }`}>
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2] shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </div>
                {tab.locked && (
                  <span className="filter-none opacity-100 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-black shadow-xs shrink-0 tracking-wide">
                    <Lock className="w-2.5 h-2.5 stroke-[3]" />
                    <span>Soon</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ROUTE PICKER & CITY SELECTION */}
        {tripType === 'airport' ? (
          <div className="space-y-4">
            <div className="flex gap-5 pb-1 text-xs sm:text-sm font-semibold">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="airportDirection"
                  checked={airportTransferType === 'from_airport'}
                  onChange={() => setAirportTransferType('from_airport')}
                  className="accent-amber-500 w-4 h-4 cursor-pointer"
                />
                <span>Pick-up From Airport</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="airportDirection"
                  checked={airportTransferType === 'to_airport'}
                  onChange={() => setAirportTransferType('to_airport')}
                  className="accent-amber-500 w-4 h-4 cursor-pointer"
                />
                <span>Drop-off To Airport</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#070B14] border-slate-800'}`}>
                <label className="block text-xs font-semibold mb-1 opacity-80">Select Airport</label>
                <select
                  value={selectedAirportId}
                  onChange={(e) => setSelectedAirportId(e.target.value)}
                  className={`w-full rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold border focus:outline-none ${
                    isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-amber-500' : 'bg-[#0F172A] border-slate-700 text-white focus:border-amber-500'
                  }`}
                >
                  {AIRPORTS_LIST.map((ap) => (
                    <option key={ap.id} value={ap.id}>{ap.name}</option>
                  ))}
                </select>
              </div>

              <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#070B14] border-slate-800'}`}>
                <label className="block text-xs font-semibold mb-1 opacity-80">City Hotel / Address</label>
                <input
                  type="text"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="Hotel or area in city"
                  className={`w-full rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold border focus:outline-none ${
                    isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-amber-500' : 'bg-[#0F172A] border-slate-700 text-white focus:border-amber-500'
                  }`}
                />
              </div>

              <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#070B14] border-slate-800'}`}>
                <label className="block text-xs font-semibold mb-1 opacity-80">Flight Number (Optional)</label>
                <input
                  type="text"
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value)}
                  placeholder="e.g. 6E-2415"
                  className={`w-full rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold uppercase border focus:outline-none ${
                    isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-amber-500' : 'bg-[#0F172A] border-slate-700 text-white focus:border-amber-500'
                  }`}
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSearchCars}
                className="btn-gold px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md cursor-pointer transition-all"
              >
                <Search className="w-4 h-4 stroke-[2.5]" />
                <span>Search Cabs</span>
              </button>
            </div>
          </div>
        ) : tripType === 'local' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative">
              {/* Pickup City Box */}
              <div className={`px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl border transition-all ${
                isLight
                  ? 'bg-slate-50 border-slate-300 focus-within:border-amber-500 focus-within:bg-white focus-within:shadow-md'
                  : 'bg-[#070B14] border-slate-800 focus-within:border-amber-500 focus-within:bg-[#0B1120]'
              }`}>
                <label className="text-[11px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1 mb-0.5">
                  <MapPin className="w-3 h-3 stroke-[2.5]" />
                  <span>Pickup City</span>
                </label>
                <input
                  type="text"
                  value={pickupCity}
                  onChange={(e) => setPickupCity(e.target.value)}
                  placeholder="e.g. Varanasi, Lucknow"
                  className="w-full bg-transparent text-sm sm:text-base font-semibold placeholder:text-[11px] sm:placeholder:text-xs placeholder:font-normal placeholder:text-slate-400/60 dark:placeholder:text-slate-500/60 focus:outline-none"
                />
              </div>

              {/* Destination Full Address Box (Requested: single text box where user writes full address) */}
              <div className={`px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl border transition-all ${
                isLight
                  ? 'bg-slate-50 border-slate-300 focus-within:border-emerald-600 focus-within:bg-white focus-within:shadow-md'
                  : 'bg-[#070B14] border-slate-800 focus-within:border-emerald-500 focus-within:bg-[#0B1120]'
              }`}>
                <label className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1 mb-0.5">
                  <Navigation className="w-3 h-3 stroke-[2.5]" />
                  <span>Where To Go / Full Destination Address</span>
                </label>
                <input
                  type="text"
                  value={dropAddress}
                  onChange={(e) => setDropAddress(e.target.value)}
                  placeholder="e.g. Kashi Vishwanath Temple or Hotel"
                  className="w-full bg-transparent text-sm sm:text-base font-semibold placeholder:text-[11px] sm:placeholder:text-xs placeholder:font-normal placeholder:text-slate-400/60 dark:placeholder:text-slate-500/60 focus:outline-none"
                />
              </div>
            </div>

            {/* SEARCH CABS BUTTON */}
            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={handleSearchCars}
                className="btn-gold w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
              >
                <Search className="w-4 h-4 stroke-[2.5]" />
                <span>Search Cabs</span>
              </button>
            </div>
          </div>
        ) : (
          /* Outstation Route Chooser (Fitted Row with From, Swap, To, and Search Car button) */
          <div>
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 sm:gap-3 relative">
              {/* From City Box with Dynamic Floating Autocomplete */}
              <div className="flex-1 relative">
                <div className={`px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl border transition-all ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 focus-within:border-amber-500 focus-within:bg-white focus-within:shadow-md'
                    : 'bg-[#070B14] border-slate-800 focus-within:border-amber-500 focus-within:bg-[#0B1120]'
                }`}>
                  <label className="text-[11px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1 mb-0.5">
                    <MapPin className="w-3 h-3 stroke-[2.5]" />
                    <span>From</span>
                  </label>
                  <input
                    type="text"
                    value={pickupCity}
                    onChange={(e) => {
                      setPickupCity(e.target.value);
                      setFromSuggestionsOpen(true);
                    }}
                    onFocus={() => setFromSuggestionsOpen(true)}
                    onBlur={() => setTimeout(() => setFromSuggestionsOpen(false), 200)}
                    placeholder="e.g. Varanasi, Lucknow"
                    className="w-full bg-transparent text-sm sm:text-base font-semibold placeholder:text-[11px] sm:placeholder:text-xs placeholder:font-normal placeholder:text-slate-400/60 dark:placeholder:text-slate-500/60 focus:outline-none"
                  />
                </div>

                {/* Dynamic Floating Suggestions Dropdown */}
                {fromSuggestionsOpen && filteredFromSuggestions.length > 0 && (
                  <div className={`absolute left-0 right-0 top-full mt-1.5 z-40 rounded-xl border shadow-xl overflow-hidden py-1 max-h-52 overflow-y-auto ${
                    isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0F172A] border-slate-700 text-white'
                  }`}>
                    {filteredFromSuggestions.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onMouseDown={() => {
                          setPickupCity(c);
                          setFromSuggestionsOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between transition-colors ${
                          isLight ? 'hover:bg-amber-50 hover:text-amber-700' : 'hover:bg-slate-800 hover:text-amber-400'
                        }`}
                      >
                        <span>{c}</span>
                        <span className="text-[10px] text-slate-400">Select</span>
                      </button>
                    ))}
                  </div>
                )}
                {formErrors.pickupCity && <p className="text-red-500 text-xs font-semibold mt-1">{formErrors.pickupCity}</p>}
              </div>

              {/* Swap Button: Vertical arrows on mobile, horizontal on desktop */}
              <div className="flex items-center justify-center shrink-0 -my-2 md:my-0 z-10 mx-auto md:mx-0">
                <button
                  type="button"
                  onClick={handleSwapLocations}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full btn-gold flex items-center justify-center shadow-md cursor-pointer transition-all hover:rotate-180 border-2 border-white dark:border-[#0B1120]"
                  title="Swap Origin & Destination"
                >
                  <ArrowUpDown className="w-4 h-4 stroke-[2.5] block md:hidden" />
                  <ArrowLeftRight className="w-4 h-4 stroke-[2.5] hidden md:block" />
                </button>
              </div>

              {/* To City Box with Dynamic Floating Autocomplete */}
              <div className="flex-1 relative">
                <div className={`px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl border transition-all ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 focus-within:border-emerald-600 focus-within:bg-white focus-within:shadow-md'
                    : 'bg-[#070B14] border-slate-800 focus-within:border-emerald-500 focus-within:bg-[#0B1120]'
                }`}>
                  <label className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1 mb-0.5">
                    <MapPin className="w-3 h-3 stroke-[2.5]" />
                    <span>To</span>
                  </label>
                  <input
                    type="text"
                    value={dropCity}
                    onChange={(e) => {
                      setDropCity(e.target.value);
                      setToSuggestionsOpen(true);
                    }}
                    onFocus={() => setToSuggestionsOpen(true)}
                    onBlur={() => setTimeout(() => setToSuggestionsOpen(false), 200)}
                    placeholder="e.g. Ayodhya, Prayagraj"
                    className="w-full bg-transparent text-sm sm:text-base font-semibold placeholder:text-[11px] sm:placeholder:text-xs placeholder:font-normal placeholder:text-slate-400/60 dark:placeholder:text-slate-500/60 focus:outline-none"
                  />
                </div>

                {/* Dynamic Floating Suggestions Dropdown */}
                {toSuggestionsOpen && filteredToSuggestions.length > 0 && (
                  <div className={`absolute left-0 right-0 top-full mt-1.5 z-40 rounded-xl border shadow-xl overflow-hidden py-1 max-h-52 overflow-y-auto ${
                    isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0F172A] border-slate-700 text-white'
                  }`}>
                    {filteredToSuggestions.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onMouseDown={() => {
                          setDropCity(c);
                          setToSuggestionsOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between transition-colors ${
                          isLight ? 'hover:bg-amber-50 hover:text-amber-700' : 'hover:bg-slate-800 hover:text-amber-400'
                        }`}
                      >
                        <span>{c}</span>
                        <span className="text-[10px] text-slate-400">Select</span>
                      </button>
                    ))}
                  </div>
                )}
                {formErrors.dropCity && <p className="text-red-500 text-xs font-semibold mt-1">{formErrors.dropCity}</p>}
              </div>

              {/* SEARCH CABS BUTTON (Positioned right beside the To box!) */}
              <div className="shrink-0 flex items-stretch md:items-end mt-1 md:mt-0">
                <button
                  type="button"
                  onClick={handleSearchCars}
                  className="btn-gold w-full md:w-auto h-[48px] sm:h-[54px] px-5 sm:px-6 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer transition-all"
                >
                  <Search className="w-4 h-4 stroke-[2.5]" />
                  <span>Search Cabs</span>
                </button>
              </div>
            </div>

            {/* Clean Minimal Route Status Line */}
            {isBothCitiesSelected && (
              <div className={`mt-3.5 pt-3 border-t flex flex-wrap items-center justify-between gap-2 text-xs ${
                isLight ? 'border-slate-200 text-slate-700' : 'border-slate-800/80 text-slate-300'
              }`}>
                <div className="flex items-center gap-2 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{pickupCity} → {dropCity}</span>
                  <span className="text-amber-500 font-mono font-bold">(~{fareResult.estimatedDistanceKm} KM)</span>
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  Tolls &amp; Fuel Included · Zero Advance
                </span>
              </div>
            )}
          </div>
        )}
      </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
        <div className="relative w-full max-w-4xl my-auto">
          {formCard}

          {onCloseModal && (
            <div className="text-center mt-3">
              <button
                type="button"
                onClick={onCloseModal}
                className="text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer py-1"
              >
                {language === 'en' ? 'Skip & Explore Website' : 'स्किप करें और वेबसाइट देखें'}
              </button>
            </div>
          )}
        </div>

        {/* STYLISH COMING SOON MODAL WITH CONTACT US OPTIONS */}
        <LockedFeatureModal
          isOpen={!!comingSoonModal}
          onClose={() => setComingSoonModal(null)}
          title={comingSoonModal?.title || ''}
          serviceName={comingSoonModal?.serviceName || ''}
          theme={theme}
          language={language}
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Top Value Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-2 border-b border-inherit">
        <div>
          <span className="text-xs font-bold text-amber-500 uppercase tracking-wider block">
            Instant Outstation &amp; Airport Reservation
          </span>
          <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Commercially registered cabs with senior chauffeurs &amp; AC guaranteed.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl border ${
            isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
          }`}>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Pay After Trip · ₹0 Advance</span>
          </div>
        </div>
      </div>

      {formCard}

      {/* AUTOMATIC LIVE CARS SECTION */}
      <div ref={cabsSectionRef} className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <Car className="w-4 h-4 text-amber-500" />
              <span>
                {hasSearched
                  ? `Available Cabs for ${pickupCity} → ${tripType === 'local' ? (dropAddress || 'Local City') : dropCity}`
                  : (language === 'en' ? 'Our Commercial Chauffeur Fleet' : 'हमारी उपलब्ध कमर्शियल गाड़ियां')}
              </span>
            </h3>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {hasSearched
                ? (language === 'en' ? 'Click "Select" on any cab to open the quick reservation popup.' : 'किसी भी गाड़ी पर "Select" दबाकर तुरंत बुकिंग करें।')
                : (language === 'en' ? 'Enter destination & click "Search Cabs" above to see exact fares & reserve.' : 'किराया देखने और गाड़ी चुनने के लिए ऊपर गंतव्य डालकर Search Cabs दबाएं।')}
            </p>
          </div>

          <span className={`text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
            isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
          }`}>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>{hasSearched ? 'All-Inclusive Tariffs' : 'Verified Fleet'}</span>
          </span>
        </div>

        {/* RESPONSIVE CAR CARDS GRID (Mobile: 2 cars, PC: 3 cars by default) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedVehicles.map((v, idx) => {
            const isSelected = selectedVehicle.id === v.id;
            const carFare = calculateFare(
              v,
              tripType,
              pickupCity,
              dropCity,
              localPackage,
              tripType === 'roundtrip',
              returnDate,
              pickupDate
            );

            // Responsive car display: On mobile 2 cars, on PC 3 cars until showAllCars is clicked
            const responsiveDisplay = showAllCars
              ? 'flex flex-col justify-between'
              : idx < 2
                ? 'flex flex-col justify-between'
                : idx === 2
                  ? 'hidden sm:flex flex-col justify-between'
                  : 'hidden';

            return (
              <div
                key={v.id}
                className={`rounded-3xl border overflow-hidden transition-all duration-200 ${responsiveDisplay} group ${
                  isSelected && hasSearched
                    ? isLight
                      ? 'bg-amber-50/40 border-amber-500 ring-2 ring-amber-500 shadow-xl'
                      : 'bg-[#111A2E] border-amber-400 ring-2 ring-amber-400/80 shadow-xl'
                    : isLight
                      ? 'bg-white hover:bg-slate-50 border-slate-200 hover:border-amber-400 hover:shadow-lg'
                      : 'bg-[#070B14] border-slate-800 hover:border-amber-400/60 hover:shadow-lg'
                }`}
              >
                <div>
                  {/* COMPACT HORIZONTAL CAR PHOTO - Clean Image without Zoom */}
                  <div className="relative w-full h-36 sm:h-40 bg-slate-950 overflow-hidden">
                    <img
                      src={v.imageUrl}
                      alt={v.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                    {/* Model Name Badge */}
                    <div className="absolute top-2.5 left-2.5 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[11px] font-semibold text-white/95 border border-white/10 shadow-xs">
                      {v.modelNames.split(',')[0]}
                    </div>

                    {/* Category Pill */}
                    <div className="absolute top-2.5 right-2.5 bg-emerald-950/85 backdrop-blur-md text-emerald-400 border border-emerald-500/30 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                      {v.category.replace('_', ' ').toUpperCase()}
                    </div>

                    {/* Verified Chauffeur Badge */}
                    <div className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-medium text-amber-300 flex items-center gap-1 border border-white/10">
                      <span>★ 4.9</span>
                      <span className="text-white/80">· Verified Chauffeur</span>
                    </div>
                  </div>

                  {/* Car Details with Refined Typography */}
                  <div className="p-3.5 sm:p-4">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <h4 className="text-sm sm:text-base font-bold tracking-tight truncate">
                        {v.name}
                      </h4>
                      <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${
                        isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-900 text-slate-300 border-slate-700'
                      }`}>
                        {v.badge}
                      </span>
                    </div>

                    <p className={`text-[11px] font-normal mb-2 truncate ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      {v.modelNames}
                    </p>

                    {/* Specs Badges with Clean Strip */}
                    <div className="flex items-center gap-2.5 py-2 border-t font-semibold text-[11px]">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-amber-500" />
                        <span>{v.seats} Pax</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                        <span>{v.luggage} Bags</span>
                      </span>
                      <span className="flex items-center gap-1 text-emerald-500 font-bold">
                        <Wind className="w-3.5 h-3.5" />
                        <span>AC</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Clean Feature Strip - Only Car Specs & Verified Quality (No Price & No Check Live Price Button) */}
                <div className={`py-2 px-3.5 sm:px-4 border-t flex items-center justify-between text-[11px] ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-[#04070F] border-slate-800 text-slate-400'
                }`}>
                  <div className="flex items-center gap-1 text-amber-500 font-medium">
                    <Sparkles className="w-3 h-3 shrink-0" />
                    <span>{language === 'en' ? 'Tolls & Fuel Included' : 'टोल व ईंधन शामिल'}</span>
                  </div>
                  <div className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>100% Inspected Fleet</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* VIEW MORE / SHOW FEWER BUTTON (Fixed formatted dimensions, zero jumping or expanding) */}
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => {
              if (showAllCars) {
                setShowAllCars(false);
                cabsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              } else {
                setShowAllCars(true);
              }
            }}
            className="btn-view-toggle w-[230px] sm:w-[260px] h-11 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer select-none text-center"
          >
            <span className="truncate">
              {showAllCars
                ? (language === 'en' ? 'Show Fewer Cars' : 'कम गाड़ियां देखें')
                : (language === 'en' ? `View More Cars (${displayedVehicles.length - 3}+)` : `और गाड़ियां देखें (${displayedVehicles.length - 3}+)`)}
            </span>
            {showAllCars ? (
              <ChevronUp className="w-4 h-4 stroke-[2.5] shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 stroke-[2.5] shrink-0" />
            )}
          </button>
        </div>
      </div>

      {/* Fast 3-Field Booking Popup (Name, Mobile, Email) */}
      <QuickBookingModal
        isOpen={showQuickModal}
        onClose={() => setShowQuickModal(false)}
        vehicle={selectedVehicle}
        tripType={tripType}
        pickupCity={pickupCity}
        dropCity={dropCity}
        pickupAddress={pickupAddress}
        dropAddress={dropAddress}
        pickupDate={pickupDate}
        pickupTime={pickupTime}
        returnDate={returnDate}
        returnTime={returnTime}
        fareResult={fareResult}
        onBookingConfirmed={onBookingConfirmed}
        language={language}
        theme={theme}
      />

      {/* Animated Car Loading Overlay on Button Click */}
      <CarLoadingOverlay
        isOpen={isCarLoading}
        title={`Connecting with ${loadingCarName || selectedVehicle.name}...`}
        subtitle={`Verifying chauffeur route & inclusions for ${pickupCity} → ${tripType === 'local' ? 'Local' : dropCity}`}
        theme={theme}
      />

      {/* Categorized 70+ Cities Picker Modal */}
      <CityPickerModal
        isOpen={cityPickerMode !== null}
        onClose={() => setCityPickerMode(null)}
        mode={cityPickerMode || 'pickup'}
        currentCity={cityPickerMode === 'pickup' ? pickupCity : dropCity}
        onSelectCity={(c) => {
          if (cityPickerMode === 'pickup') setPickupCity(c);
          else if (cityPickerMode === 'drop') setDropCity(c);
        }}
        theme={theme}
        language={language}
      />

      {/* STYLISH COMING SOON MODAL WITH CONTACT US OPTIONS */}
      <LockedFeatureModal
        isOpen={!!comingSoonModal}
        onClose={() => setComingSoonModal(null)}
        title={comingSoonModal?.title || ''}
        serviceName={comingSoonModal?.serviceName || ''}
        theme={theme}
        language={language}
      />
    </div>
  );
};
