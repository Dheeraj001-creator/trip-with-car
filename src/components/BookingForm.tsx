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
  ChevronUp,
  Calendar,
  Clock
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
  forceOpenMobilePopup?: boolean;
  onCloseMobilePopup?: () => void;
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
  forceOpenMobilePopup = false,
  onCloseMobilePopup,
  onSearchRoute,
  onBookingConfirmed,
  language = 'en',
  theme,
  isModal = false,
  onCloseModal,
}) => {
  const isLight = theme === 'light' || (typeof document !== 'undefined' && document.documentElement.classList.contains('light'));

  // Trip Selection state
  const [tripType, setTripType] = useState<TripType>(initialTripType);
  const [pickupCity, setPickupCity] = useState(initialFrom);
  const [dropCity, setDropCity] = useState(initialTo);
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropAddress, setDropAddress] = useState('');
  
  // Coming soon popup modal for locked tabs (Round Trip & Airport Taxi)
  const [comingSoonModal, setComingSoonModal] = useState<{ title: string; serviceName: string } | null>(null);

  // Mobile Popup Elevation: on mobile (<768px), card appears elevated as a popup on initial open
  const [isMobilePopup, setIsMobilePopup] = useState<boolean>(() => {
    if (forceOpenMobilePopup) return true;
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  });

  // Listen for forceOpenMobilePopup from parent
  useEffect(() => {
    if (forceOpenMobilePopup) {
      setIsMobilePopup(true);
      setTripType('oneway');
      setPickupCity('');
      setDropCity('');
      setPickupAddress('');
      setDropAddress('');
      setFormErrors({});
    }
  }, [forceOpenMobilePopup]);

  const handleDismissMobilePopup = () => {
    setIsMobilePopup(false);
    if (onCloseMobilePopup) onCloseMobilePopup();
    if (onCloseModal) onCloseModal();
  };

  // If user expands screen to desktop (>= 768px), automatically close popup overlay
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobilePopup(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Search state: initially false so cars show without price until search is clicked, or auto-true if selected from route
  const [hasSearched, setHasSearched] = useState(initialAutoSearch);

  // Cars display toggle: mobile shows 2, PC shows 3 until expanded
  const [showAllCars, setShowAllCars] = useState(initialAutoSearch);

  const [fromSuggestionsOpen, setFromSuggestionsOpen] = useState(false);
  const [toSuggestionsOpen, setToSuggestionsOpen] = useState(false);
  const cabsSectionRef = useRef<HTMLDivElement>(null);
  const formCardRef = useRef<HTMLDivElement>(null);
  const pickupInputRef = useRef<HTMLInputElement>(null);
  const dropInputRef = useRef<HTMLInputElement>(null);

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

  const [pickupDate, setPickupDate] = useState(todayStr);
  const [pickupTime, setPickupTime] = useState('08:00');
  const [returnDate, setReturnDate] = useState(tomorrowStr);
  const [returnTime, setReturnTime] = useState('18:00');

  // Prevent background scroll when mobile popup is open
  useEffect(() => {
    if (isMobilePopup) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isMobilePopup]);

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
    setFormErrors({});
  };

  // Validation function: ensures both are filled and gives hint, detects single city
  const validateInputs = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!pickupCity || !pickupCity.trim()) {
      errors.pickupCity = language === 'en' ? 'Please enter Origin (From) city' : 'कृपया पिकअप शहर (From) भरें';
    }

    if ((tripType === 'oneway' || tripType === 'roundtrip') && (!dropCity || !dropCity.trim())) {
      errors.dropCity = language === 'en' ? 'Please enter Destination (To) city' : 'कृपया ड्राप शहर (To) भरें';
    }

    // Single City Detection: If user typed the exact same city in From & To
    if (
      (tripType === 'oneway' || tripType === 'roundtrip') &&
      pickupCity &&
      dropCity &&
      pickupCity.trim().length > 0 &&
      dropCity.trim().length > 0 &&
      pickupCity.trim().toLowerCase() === dropCity.trim().toLowerCase()
    ) {
      errors.singleCity = language === 'en'
        ? `Both cities are "${pickupCity}". For travel within a single city, please use 'Local Hourly Rental'.`
        : `दोनों शहर एक ही हैं ("${pickupCity}")! यदि आपको एक ही शहर में घूमना है, तो 'Local Hourly' (लोकल ऑवरली) पैकेज चुनें।`;
    }

    if (tripType === 'local' && (!pickupCity || !pickupCity.trim())) {
      errors.pickupCity = language === 'en' ? 'Please enter City' : 'कृपया शहर का नाम भरें';
    }

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      if (errors.pickupCity) {
        pickupInputRef.current?.focus();
      } else if (errors.dropCity) {
        dropInputRef.current?.focus();
      }
      return false;
    }

    return true;
  };

  // Search Action
  const handleSearchCars = () => {
    if (!validateInputs()) return;

    setFormErrors({});
    if (onSearchRoute) {
      setIsMobilePopup(false);
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

  // Open Reservation popup directly with loading animation - strictly checks inputs
  const handleOpenQuickModal = (vehicle: Vehicle) => {
    if (!validateInputs()) {
      formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

  // Reordered Trip Type Tabs: 1. One Way, 2. Round Trip (OPEN), 3. Local Hourly, 4. Airport Taxi (Locked)
  const tripTabs = [
    { type: 'oneway', label: 'One Way', icon: Navigation, locked: false },
    { type: 'roundtrip', label: 'Round Trip', icon: ArrowLeftRight, locked: false },
    { type: 'local', label: 'Local Hourly', icon: Car, locked: false },
    { type: 'airport', label: 'Airport Taxi', icon: Plane, locked: true },
  ];

  const renderFormCard = (inPopup: boolean = false) => (
    <div 
      ref={!inPopup ? formCardRef : undefined}
      className={`relative max-w-4xl mx-auto rounded-2xl sm:rounded-3xl border shadow-xl ${
      inPopup ? 'p-3 sm:p-4' : 'p-3.5 sm:p-5 md:p-6'
    } transition-all ${
      isLight
        ? 'bg-white border-slate-200 shadow-slate-200/40'
        : 'bg-[#0B1120] border-slate-800 shadow-black/80'
    } ${inPopup || isModal ? 'mb-0' : 'mb-8 sm:mb-12'}`}>

      {/* Modal Close Button on top right only if isModal is explicitly passed */}
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
      
      {/* Trip Type Segmented Tabs */}
      <div className={`grid grid-cols-2 sm:grid-cols-4 ${
        inPopup ? 'gap-1 p-0.5 sm:p-1 rounded-xl mb-2 sm:mb-2.5' : 'gap-1.5 sm:gap-2 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl mb-4 sm:mb-5'
      } border ${
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
                className={`flex items-center justify-center gap-1 sm:gap-2 ${
                  inPopup ? 'py-1 px-1.5 rounded-lg min-h-[32px] text-[11px]' : 'py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg sm:rounded-xl min-h-[40px] sm:min-h-[44px] text-xs sm:text-sm'
                } font-bold transition-all cursor-pointer select-none text-center ${
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
                <div className={`flex items-center gap-1 truncate ${
                  tab.locked ? 'opacity-65 filter blur-[0.3px]' : ''
                }`}>
                  <Icon className={`${inPopup ? 'w-3 h-3' : 'w-3.5 h-3.5 sm:w-4 sm:h-4'} stroke-[2.2] shrink-0`} />
                  <span className="truncate">{tab.label}</span>
                </div>
                {tab.locked && (
                  <span className="filter-none opacity-100 flex items-center gap-0.5 px-1 py-0.5 rounded bg-amber-500 text-slate-950 text-[9px] font-black shadow-xs shrink-0 tracking-wide">
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
                  style={{
                    color: isLight ? '#020617' : '#FFFFFF',
                    WebkitTextFillColor: pickupCity ? (isLight ? '#020617' : '#FFFFFF') : undefined,
                    backgroundColor: 'transparent'
                  }}
                  className={`w-full bg-transparent text-sm sm:text-base font-black placeholder:font-normal placeholder:opacity-40 ${
                    isLight ? 'text-slate-950 placeholder:text-slate-400' : 'text-white placeholder:text-slate-500'
                  } focus:outline-none caret-amber-500`}
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
                  style={{
                    color: isLight ? '#020617' : '#FFFFFF',
                    WebkitTextFillColor: dropAddress ? (isLight ? '#020617' : '#FFFFFF') : undefined,
                    backgroundColor: 'transparent'
                  }}
                  className={`w-full bg-transparent text-sm sm:text-base font-black placeholder:font-normal placeholder:opacity-40 ${
                    isLight ? 'text-slate-950 placeholder:text-slate-400' : 'text-white placeholder:text-slate-500'
                  } focus:outline-none caret-emerald-500`}
                />
              </div>
            </div>

            {/* Local Hourly Date & Time */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl border ${
                isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#070B14] border-slate-800'
              }`}>
                <label className="text-[10px] sm:text-[11px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1 mb-0.5">
                  <Calendar className="w-3 h-3 stroke-[2.5]" />
                  <span>Pickup Date</span>
                </label>
                <input
                  type="date"
                  value={pickupDate}
                  min={todayStr}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm font-semibold focus:outline-none cursor-pointer"
                />
              </div>
              <div className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl border ${
                isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#070B14] border-slate-800'
              }`}>
                <label className="text-[10px] sm:text-[11px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1 mb-0.5">
                  <Clock className="w-3 h-3 stroke-[2.5]" />
                  <span>Pickup Time</span>
                </label>
                <input
                  type="time"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm font-semibold focus:outline-none cursor-pointer"
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
          /* Outstation Route Chooser (Fitted Row with From, Swap, To, Date/Time, and Search Car button) */
          <div className="space-y-2 sm:space-y-3">
            {/* ROW 1: FROM AND TO CITIES WITH SWAP */}
            <div className={`flex flex-col md:flex-row items-stretch md:items-center ${
              inPopup ? 'gap-2' : 'gap-2 sm:gap-3'
            } relative`}>
              {/* From City Box with Dynamic Floating Autocomplete */}
              <div className="flex-1 relative">
                <div className={`${
                  inPopup ? 'px-3 py-2 rounded-xl min-h-[56px]' : 'px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl min-h-[60px]'
                } border transition-all flex flex-col justify-center ${
                  formErrors.pickupCity
                    ? 'border-red-500 ring-2 ring-red-500/40 bg-red-50/50 dark:bg-red-950/20'
                    : isLight
                      ? 'bg-slate-50 border-slate-300 focus-within:border-amber-500 focus-within:bg-white focus-within:shadow-md'
                      : 'bg-[#070B14] border-slate-800 focus-within:border-amber-500 focus-within:bg-[#0B1120]'
                }`}>
                  <label className="text-[10px] sm:text-[11px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1 mb-0.5">
                    <MapPin className="w-3 h-3 stroke-[2.5]" />
                    <span>From (Origin)</span>
                  </label>
                  <div className="flex items-center gap-1 w-full">
                    <input
                      ref={pickupInputRef}
                      type="text"
                      value={pickupCity}
                      onChange={(e) => {
                        setPickupCity(e.target.value);
                        setFromSuggestionsOpen(true);
                        if (formErrors.pickupCity) {
                          setFormErrors(prev => ({ ...prev, pickupCity: '', singleCity: '' }));
                        }
                      }}
                      onFocus={() => setFromSuggestionsOpen(true)}
                      onBlur={() => setTimeout(() => setFromSuggestionsOpen(false), 200)}
                      placeholder="e.g. Varanasi, Lucknow"
                      style={{
                        color: isLight ? '#020617' : '#FFFFFF',
                        WebkitTextFillColor: pickupCity ? (isLight ? '#020617' : '#FFFFFF') : undefined,
                        backgroundColor: 'transparent'
                      }}
                      className={`w-full bg-transparent text-[16px] sm:text-base font-black placeholder:font-normal placeholder:opacity-40 ${
                        isLight ? 'text-slate-950 placeholder:text-slate-400' : 'text-white placeholder:text-slate-500'
                      } focus:outline-none leading-normal caret-amber-500`}
                    />
                    {pickupCity.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setPickupCity('');
                          pickupInputRef.current?.focus();
                        }}
                        className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                        title="Clear"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Dynamic Floating Suggestions Dropdown */}
                {fromSuggestionsOpen && filteredFromSuggestions.length > 0 && (
                  <div className={`absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border shadow-2xl overflow-hidden py-1 max-h-52 overflow-y-auto ${
                    isLight ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300' : 'bg-[#0F172A] border-slate-700 text-white'
                  }`}>
                    {filteredFromSuggestions.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onMouseDown={() => {
                          setPickupCity(c);
                          setFromSuggestionsOpen(false);
                          if (formErrors.pickupCity) {
                            setFormErrors(prev => ({ ...prev, pickupCity: '', singleCity: '' }));
                          }
                        }}
                        style={{
                          color: isLight ? '#090D16' : '#FFFFFF',
                          WebkitTextFillColor: isLight ? '#090D16' : '#FFFFFF'
                        }}
                        className={`w-full text-left px-3.5 py-2.5 text-xs font-bold flex items-center justify-between transition-colors ${
                          isLight ? 'hover:bg-amber-50 hover:text-amber-700 text-slate-950' : 'hover:bg-slate-800 hover:text-amber-400 text-white'
                        }`}
                      >
                        <span>{c}</span>
                        <span className="text-[10px] text-amber-500 font-bold">Select</span>
                      </button>
                    ))}
                  </div>
                )}
                {formErrors.pickupCity && (
                  <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1 animate-in fade-in duration-150">
                    <span>⚠️ {formErrors.pickupCity}</span>
                  </p>
                )}
              </div>

              {/* Swap Button: Vertical arrows on mobile, horizontal on desktop */}
              <div className={`flex items-center justify-center shrink-0 ${
                inPopup ? '-my-1' : '-my-1.5 md:my-0'
              } z-10 mx-auto md:mx-0`}>
                <button
                  type="button"
                  onClick={handleSwapLocations}
                  className={`${
                    inPopup ? 'w-8 h-8' : 'w-9 h-9 sm:w-10 sm:h-10'
                  } rounded-full btn-gold flex items-center justify-center shadow-md cursor-pointer transition-all hover:rotate-180 border-2 border-white dark:border-[#0B1120]`}
                  title="Swap Origin & Destination"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 stroke-[2.5] block md:hidden" />
                  <ArrowLeftRight className="w-3.5 h-3.5 stroke-[2.5] hidden md:block" />
                </button>
              </div>

              {/* To City Box with Dynamic Floating Autocomplete */}
              <div className="flex-1 relative">
                <div className={`${
                  inPopup ? 'px-3 py-2 rounded-xl min-h-[56px]' : 'px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl min-h-[60px]'
                } border transition-all flex flex-col justify-center ${
                  formErrors.dropCity
                    ? 'border-red-500 ring-2 ring-red-500/40 bg-red-50/50 dark:bg-red-950/20'
                    : isLight
                      ? 'bg-slate-50 border-slate-300 focus-within:border-emerald-600 focus-within:bg-white focus-within:shadow-md'
                      : 'bg-[#070B14] border-slate-800 focus-within:border-emerald-500 focus-within:bg-[#0B1120]'
                }`}>
                  <label className="text-[10px] sm:text-[11px] font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1 mb-0.5">
                    <MapPin className="w-3 h-3 stroke-[2.5]" />
                    <span>To (Destination)</span>
                  </label>
                  <div className="flex items-center gap-1 w-full">
                    <input
                      ref={dropInputRef}
                      type="text"
                      value={dropCity}
                      onChange={(e) => {
                        setDropCity(e.target.value);
                        setToSuggestionsOpen(true);
                        if (formErrors.dropCity) {
                          setFormErrors(prev => ({ ...prev, dropCity: '', singleCity: '' }));
                        }
                      }}
                      onFocus={() => setToSuggestionsOpen(true)}
                      onBlur={() => setTimeout(() => setToSuggestionsOpen(false), 200)}
                      placeholder="e.g. Ayodhya, Prayagraj"
                      style={{
                        color: isLight ? '#020617' : '#FFFFFF',
                        WebkitTextFillColor: dropCity ? (isLight ? '#020617' : '#FFFFFF') : undefined,
                        backgroundColor: 'transparent'
                      }}
                      className={`w-full bg-transparent text-[16px] sm:text-base font-black placeholder:font-normal placeholder:opacity-40 ${
                        isLight ? 'text-slate-950 placeholder:text-slate-400' : 'text-white placeholder:text-slate-500'
                      } focus:outline-none leading-normal caret-emerald-500`}
                    />
                    {dropCity.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setDropCity('');
                          dropInputRef.current?.focus();
                        }}
                        className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                        title="Clear"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Dynamic Floating Suggestions Dropdown */}
                {toSuggestionsOpen && filteredToSuggestions.length > 0 && (
                  <div className={`absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border shadow-2xl overflow-hidden py-1 max-h-52 overflow-y-auto ${
                    isLight ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300' : 'bg-[#0F172A] border-slate-700 text-white'
                  }`}>
                    {filteredToSuggestions.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onMouseDown={() => {
                          setDropCity(c);
                          setToSuggestionsOpen(false);
                          if (formErrors.dropCity) {
                            setFormErrors(prev => ({ ...prev, dropCity: '', singleCity: '' }));
                          }
                        }}
                        style={{
                          color: isLight ? '#090D16' : '#FFFFFF',
                          WebkitTextFillColor: isLight ? '#090D16' : '#FFFFFF'
                        }}
                        className={`w-full text-left px-3.5 py-2.5 text-xs font-bold flex items-center justify-between transition-colors ${
                          isLight ? 'hover:bg-amber-50 hover:text-amber-700 text-slate-950' : 'hover:bg-slate-800 hover:text-amber-400 text-white'
                        }`}
                      >
                        <span>{c}</span>
                        <span className="text-[10px] text-emerald-500 font-bold">Select</span>
                      </button>
                    ))}
                  </div>
                )}
                {formErrors.dropCity && (
                  <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1 animate-in fade-in duration-150">
                    <span>⚠️ {formErrors.dropCity}</span>
                  </p>
                )}
              </div>
            </div>

            {/* SINGLE CITY TRAVEL DETECTION & LOCAL HOURLY RECOMMENDATION */}
            {formErrors.singleCity && (
              <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/50 text-amber-950 dark:text-amber-200 text-xs animate-in zoom-in-95 shadow-md">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs font-black">
                    <Sparkles className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <strong className="block text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400">
                      {language === 'en' ? 'Single City Travel Detected!' : 'एक ही शहर (Single City) चुना गया है!'}
                    </strong>
                    <p className="text-[11.5px] leading-relaxed text-slate-700 dark:text-slate-300">
                      {formErrors.singleCity}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setTripType('local');
                        setDropAddress('');
                        setFormErrors({});
                      }}
                      className="mt-1 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95 transition-all"
                    >
                      <Car className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{language === 'en' ? 'Switch to Local Hourly Rental' : 'लोकल ऑवरली रेंटल पर जाएं (Local Hourly)'}</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ROW 2: DATE & TIME SELECTOR (BEFORE SEARCH BUTTON) */}
            {tripType === 'roundtrip' ? (
              /* Round Trip: Pickup Date + Time and Return Date + Time */
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${inPopup ? 'gap-1.5' : 'gap-2 sm:gap-3'}`}>
                {/* Pickup Schedule */}
                <div className={`grid grid-cols-2 gap-1.5 ${
                  inPopup ? 'p-1.5 rounded-lg' : 'p-2 sm:p-2.5 rounded-xl sm:rounded-2xl'
                } border ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#070B14] border-slate-800'}`}>
                  <div>
                    <label className="text-[9px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-0.5 mb-0.5">
                      <Calendar className="w-2.5 h-2.5" />
                      <span>Pickup Date</span>
                    </label>
                    <input
                      type="date"
                      value={pickupDate}
                      min={todayStr}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="w-full bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-0.5 mb-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      <span>Pickup Time</span>
                    </label>
                    <input
                      type="time"
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>

                {/* Return Schedule */}
                <div className={`grid grid-cols-2 gap-1.5 ${
                  inPopup ? 'p-1.5 rounded-lg' : 'p-2 sm:p-2.5 rounded-xl sm:rounded-2xl'
                } border ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#070B14] border-slate-800'}`}>
                  <div>
                    <label className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-0.5 mb-0.5">
                      <Calendar className="w-2.5 h-2.5" />
                      <span>Return Date</span>
                    </label>
                    <input
                      type="date"
                      value={returnDate}
                      min={pickupDate || todayStr}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className="w-full bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-0.5 mb-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      <span>Return Time</span>
                    </label>
                    <input
                      type="time"
                      value={returnTime}
                      onChange={(e) => setReturnTime(e.target.value)}
                      className="w-full bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* One-Way: Pickup Date + Pickup Time before button */
              <div className={`grid grid-cols-2 ${inPopup ? 'gap-1.5' : 'gap-2 sm:gap-3'}`}>
                <div className={`${
                  inPopup ? 'px-2.5 py-1 rounded-lg' : 'px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl'
                } border transition-all ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#070B14] border-slate-800'}`}>
                  <label className={`${inPopup ? 'text-[9px]' : 'text-[10px] sm:text-[11px]'} font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1 mb-0.5`}>
                    <Calendar className="w-3 h-3 stroke-[2.5]" />
                    <span>Pickup Date</span>
                  </label>
                  <input
                    type="date"
                    value={pickupDate}
                    min={todayStr}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className={`w-full bg-transparent ${inPopup ? 'text-xs font-semibold' : 'text-xs sm:text-sm font-semibold'} focus:outline-none cursor-pointer`}
                  />
                </div>

                <div className={`${
                  inPopup ? 'px-2.5 py-1 rounded-lg' : 'px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl'
                } border transition-all ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#070B14] border-slate-800'}`}>
                  <label className={`${inPopup ? 'text-[9px]' : 'text-[10px] sm:text-[11px]'} font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1 mb-0.5`}>
                    <Clock className="w-3 h-3 stroke-[2.5]" />
                    <span>Pickup Time</span>
                  </label>
                  <input
                    type="time"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className={`w-full bg-transparent ${inPopup ? 'text-xs font-semibold' : 'text-xs sm:text-sm font-semibold'} focus:outline-none cursor-pointer`}
                  />
                </div>
              </div>
            )}

            {/* ROW 3: SEARCH CABS BUTTON */}
            <div>
              <button
                type="button"
                onClick={handleSearchCars}
                className={`btn-gold w-full ${
                  inPopup ? 'h-[40px] px-4 text-xs rounded-xl' : 'h-[48px] sm:h-[52px] px-6 rounded-xl sm:rounded-2xl text-xs sm:text-sm'
                } font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer transition-all`}
              >
                <Search className="w-4 h-4 stroke-[2.5]" />
                <span>Search Cabs</span>
              </button>
            </div>

            {/* Clean Minimal Route Status Line */}
            {isBothCitiesSelected && (
              <div className={`${
                inPopup ? 'mt-2 pt-2 text-[11px]' : 'mt-3.5 pt-3 text-xs'
              } border-t flex flex-wrap items-center justify-between gap-1.5 ${
                isLight ? 'border-slate-200 text-slate-700' : 'border-slate-800/80 text-slate-300'
              }`}>
                <div className="flex items-center gap-1.5 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>
                    <strong className="text-amber-500 font-black">{pickupCity}</strong>{' '}
                    <span className="opacity-70">{tripType === 'roundtrip' ? '⇄' : '→'}</span>{' '}
                    <strong className="text-emerald-500 font-black">{dropCity}</strong>
                  </span>
                  <span className="text-amber-500 font-mono font-bold">(~{fareResult.estimatedDistanceKm} KM)</span>
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[10px] sm:text-xs">
                  {tripType === 'roundtrip' ? 'Round Trip · Tolls, Fuel & Chauffeur Included' : 'Tolls & Fuel Included · Zero Advance'}
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
          {renderFormCard(false)}

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
    <div className="w-full relative">
      {/* MOBILE POPUP MODAL (Positioned from top so virtual keyboard never hides inputs) */}
      {isMobilePopup && (
        <div 
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2.5 sm:p-4 pt-3 sm:pt-6 pb-20 bg-black/85 backdrop-blur-md md:hidden animate-in fade-in duration-200 overflow-y-auto overscroll-contain"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleDismissMobilePopup();
            }
          }}
        >
          <div className="relative w-full max-w-[400px] mx-auto my-0 animate-in zoom-in-95 duration-150">
            {/* Clean Neutral Close Cross Button on Top-Right Corner */}
            <button
              type="button"
              onClick={handleDismissMobilePopup}
              className="absolute -top-3 -right-1 z-50 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white flex items-center justify-center shadow-lg transition-all cursor-pointer active:scale-90"
              aria-label="Close Popup"
              title="Close"
            >
              <X className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>

            {/* The EXACT form card fitted with identical design */}
            {renderFormCard(true)}
          </div>
        </div>
      )}

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
          {/* Quick button to open mobile popup if user wants */}
          <button
            type="button"
            onClick={() => setIsMobilePopup(true)}
            className="md:hidden flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-500 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{language === 'en' ? 'Open Popup' : 'पॉपअप खोलें'}</span>
          </button>

          <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl border ${
            isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
          }`}>
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Pay After Trip · ₹0 Advance</span>
          </div>
        </div>
      </div>

      {/* IN-PLACE BOOKING CARD ON PAGE (Always exists on page so it stays when popup is dismissed) */}
      <div className="w-full">
        {renderFormCard(false)}
      </div>

      {/* AUTOMATIC LIVE CARS SECTION */}
      <div ref={cabsSectionRef} className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <Car className="w-4 h-4 text-amber-500" />
              <span>
                {hasSearched
                  ? `Available Cabs for ${pickupCity} → ${tripType === 'local' ? (dropAddress || 'Local City') : dropCity}`
                  : (language === 'en' ? 'Our cars' : 'हमारी गाड़ियां (Our cars)')}
              </span>
            </h3>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {language === 'en'
                ? 'Explore our verified fleet with senior chauffeurs & AC guaranteed.'
                : 'सत्यापित गाड़ियों का बेड़ा, वरिष्ठ ड्राइवर व पूर्णतः वातानुकूलित (AC)।'}
            </p>
          </div>

          <span className={`text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
            isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
          }`}>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Verified Fleet</span>
          </span>
        </div>

        {/* RESPONSIVE CAR CARDS GRID (Mobile: 2 cars, PC: 3 cars by default) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedVehicles.map((v, idx) => {
            const isSelected = selectedVehicle.id === v.id;

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

                {/* Fleet Showcase Specs Strip (Display / Showcase Only - Zero Button) */}
                <div className={`px-4 py-3 border-t flex items-center justify-between text-xs ${
                  isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-[#04070F] border-slate-800'
                }`}>
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{language === 'en' ? 'Tolls & Fuel Included' : 'टोल व ईंधन शामिल'}</span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                    {language === 'en' ? 'Verified Fleet' : 'सत्यापित बेड़ा'}
                  </span>
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
