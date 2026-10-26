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
  popupTrigger?: number;
  onCloseMobilePopup?: () => void;
  onSearchRoute?: (data: {
    tripType: TripType;
    pickupCity: string;
    dropCity: string;
    dropAddress: string;
    pickupDate: string;
    pickupTime: string;
    returnDate?: string;
    returnTime?: string;
  }) => void;
  onBookingConfirmed: (booking: Booking) => void;
  onViewAllCars?: () => void;
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
  popupTrigger = 0,
  onCloseMobilePopup,
  onSearchRoute,
  onBookingConfirmed,
  onViewAllCars,
  language = 'en',
  theme,
  isModal = false,
  onCloseModal,
}) => {
  const isLight = theme === 'light' || (typeof document !== 'undefined' && document.documentElement.classList.contains('light'));

  // Trip Selection state
  const [tripType, setTripType] = useState<TripType>(initialTripType);
  const [pickupCity, setPickupCity] = useState(initialFrom || 'Varanasi');
  const [dropCity, setDropCity] = useState(initialTo);
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropAddress, setDropAddress] = useState('');
  
  // Notice state for Varanasi-only origin
  const [fromCityNotice, setFromCityNotice] = useState<boolean>(false);
  const [tempoSeats, setTempoSeats] = useState<number>(12);
  const noticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerVaranasiOnlyNotice = () => {
    setFromCityNotice(true);
    if (noticeTimeoutRef.current) clearTimeout(noticeTimeoutRef.current);
    noticeTimeoutRef.current = setTimeout(() => {
      setFromCityNotice(false);
    }, 4500);
  };
  
  // Coming soon popup modal for locked tabs (Airport Taxi)
  const [comingSoonModal, setComingSoonModal] = useState<{ title: string; serviceName: string } | null>(null);

  // Universal One-Way Welcome Popup: Opens when forceOpenMobilePopup is true or when Book Cab is clicked
  const [isMobilePopup, setIsMobilePopup] = useState<boolean>(forceOpenMobilePopup);

  // Separate refs for on-page form and popup to prevent ref collisions
  const pickupInputPageRef = useRef<HTMLInputElement>(null);
  const pickupInputPopupRef = useRef<HTMLInputElement>(null);
  const dropInputPageRef = useRef<HTMLInputElement>(null);
  const dropInputPopupRef = useRef<HTMLInputElement>(null);

  // Track whether initial mount has passed so we never auto-focus on initial website load
  const isInitialLoad = useRef<boolean>(true);

  // Focus cursor directly on the Destination (To) input when user clicks cab or Book Cab
  const focusDestinationInput = (preferPopup: boolean = true) => {
    setTimeout(() => {
      if (preferPopup && dropInputPopupRef.current) {
        dropInputPopupRef.current.focus();
        setToSuggestionsOpen(true);
      } else if (dropInputPageRef.current) {
        dropInputPageRef.current.focus();
        setToSuggestionsOpen(true);
      }
    }, 90);
  };

  useEffect(() => {
    if (forceOpenMobilePopup) {
      setIsMobilePopup(true);
      setTripType('oneway');
      setFormErrors({});
      // Strict requirement: When user opens site initially ("suru me"), cursor must NOT go into input box
      // Only when user clicks Book Cab or selects a cab (popupTrigger > 1), focus input
      if (!isInitialLoad.current || popupTrigger > 1) {
        focusDestinationInput(true);
      }
    } else {
      setIsMobilePopup(false);
    }
    isInitialLoad.current = false;
  }, [forceOpenMobilePopup, popupTrigger, isModal]);

  const handleDismissMobilePopup = () => {
    setIsMobilePopup(false);
    setToSuggestionsOpen(false);
    setFromSuggestionsOpen(false);
    if (onCloseMobilePopup) onCloseMobilePopup();
    if (onCloseModal) onCloseModal();
  };

  // Search state: initially false so cars show without price until search is clicked, or auto-true if selected from route
  const [hasSearched, setHasSearched] = useState(initialAutoSearch);

  // Cars display toggle: mobile shows 2, PC shows 3 until expanded
  const [showAllCars, setShowAllCars] = useState(initialAutoSearch);

  const [fromSuggestionsOpen, setFromSuggestionsOpen] = useState(false);
  const [toSuggestionsOpen, setToSuggestionsOpen] = useState(false);
  const cabsSectionRef = useRef<HTMLDivElement>(null);
  const formCardRef = useRef<HTMLDivElement>(null);

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

  // Dates: start empty (no pre-filled date or time) so user explicitly selects them
  const todayStr = new Date().toISOString().split('T')[0];

  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('');

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

  // Checks whether the origin is currently Varanasi
  const isFromVaranasi = !pickupCity || pickupCity.trim().toLowerCase() === 'varanasi';

  // Swap Locations: allows swapping so a user returning to Varanasi from another city can swap
  const handleSwapLocations = () => {
    const currentPickup = pickupCity || 'Varanasi';
    const currentDrop = dropCity || '';
    setPickupCity(currentDrop);
    setDropCity(currentPickup);
    setFormErrors({});
    setFromCityNotice(false);
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

    // Require Pickup Date and Pickup Time across all 3 active tabs (One Way, Round Trip, Local Hourly)
    if (tripType === 'oneway' || tripType === 'roundtrip' || tripType === 'local') {
      if (!pickupDate || !pickupDate.trim()) {
        errors.pickupDate = language === 'en'
          ? 'Please select Pickup Date first'
          : 'कृपया पहले पिकअप तारीख (Pickup Date) भरें';
      }
      if (!pickupTime || !pickupTime.trim()) {
        errors.pickupTime = language === 'en'
          ? 'Please select Pickup Time first'
          : 'कृपया पहले पिकअप समय (Pickup Time) भरें';
      }
    }

    // Require Return Date & Return Time for Round Trip
    if (tripType === 'roundtrip') {
      if (!returnDate || !returnDate.trim()) {
        errors.returnDate = language === 'en'
          ? 'Please select Return Date first'
          : 'कृपया पहले वापसी तारीख (Return Date) भरें';
      }
      if (!returnTime || !returnTime.trim()) {
        errors.returnTime = language === 'en'
          ? 'Please select Return Time first'
          : 'कृपया पहले वापसी समय (Return Time) भरें';
      }
    }

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      if (errors.dropCity) {
        if (isMobilePopup) dropInputPopupRef.current?.focus();
        else dropInputPageRef.current?.focus();
      } else if (errors.pickupCity) {
        if (isMobilePopup) pickupInputPopupRef.current?.focus();
        else pickupInputPageRef.current?.focus();
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
      onSearchRoute({
        tripType,
        pickupCity,
        dropCity,
        dropAddress,
        pickupDate,
        pickupTime,
        returnDate,
        returnTime,
      });
      if (isModal && onCloseModal) {
        onCloseModal();
      }
      return;
    }
    setHasSearched(true);
    setIsMobilePopup(false);
    setFromSuggestionsOpen(false);
    setToSuggestionsOpen(false);
    setTimeout(() => {
      cabsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  // When user clicks "Book Cab" on a car card:
  // If destination/date is not entered yet, open the One-Way Popup and auto-focus Destination!
  const handleOpenQuickModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    if (!dropCity.trim() || !pickupDate.trim() || !pickupTime.trim()) {
      setTripType('oneway');
      setFormErrors({});
      setIsMobilePopup(true);
      focusDestinationInput(true);
      return;
    }

    if (!validateInputs()) {
      setIsMobilePopup(true);
      focusDestinationInput(true);
      return;
    }

    setLoadingCarName(vehicle.name);
    setIsCarLoading(true);

    setTimeout(() => {
      setIsCarLoading(false);
      setShowQuickModal(true);
    }, 400);
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
      id={!inPopup ? 'booking-form-card' : 'booking-form-popup'}
      ref={!inPopup ? formCardRef : undefined}
      className={`relative max-w-4xl mx-auto rounded-2xl sm:rounded-3xl border shadow-2xl ${
      inPopup ? 'p-3.5 sm:p-5 md:p-6' : 'p-4 sm:p-5 md:p-6'
    } transition-all ${
      isLight
        ? 'bg-white border-slate-200/90 shadow-slate-300/50'
        : 'bg-[#0B1222] border-slate-800 shadow-black/90'
    } ${inPopup || isModal ? 'mb-0' : 'mb-8 sm:mb-12'}`}>

      {/* Popup Top Header Strip on PC & Mobile so Popup looks Intentional and Executive */}
      {inPopup && (
        <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 sm:pb-3 sm:mb-3.5 border-b border-slate-200 dark:border-slate-800/80 pr-7">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
            <span className={`text-xs sm:text-sm font-extrabold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {language === 'en' ? 'Book Your One-Way & Outstation Cab' : 'वन-वे और आउटस्टेशन कैब बुक करें'}
            </span>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider shrink-0">
            <Sparkles className="w-3 h-3" />
            <span>₹200–₹300 Instant Discount</span>
          </span>
        </div>
      )}

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
      
      {/* Trip Type Segmented Tabs - Vibrant Blue Active State */}
      <div className={`grid grid-cols-2 sm:grid-cols-4 ${
        inPopup ? 'gap-1.5 p-1 rounded-xl mb-3 sm:mb-4' : 'gap-1.5 sm:gap-2 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl mb-4 sm:mb-5'
      } border ${
        isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#050914] border-slate-800'
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
                  setFormErrors({});
                  if (tab.type === 'oneway' || tab.type === 'roundtrip') {
                    focusDestinationInput(inPopup);
                  }
                }}
                className={`flex items-center justify-center gap-1.5 sm:gap-2 ${
                  inPopup ? 'py-1.5 sm:py-2 px-2 rounded-lg min-h-[36px] sm:min-h-[40px] text-xs sm:text-sm' : 'py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg sm:rounded-xl min-h-[40px] sm:min-h-[44px] text-xs sm:text-sm'
                } font-extrabold transition-all cursor-pointer select-none text-center ${
                  isActive
                    ? 'tab-blue-active'
                    : tab.locked
                      ? isLight
                        ? 'border border-slate-200 text-slate-500 bg-slate-100/70 hover:bg-slate-100'
                        : 'border border-slate-800 text-slate-400 bg-slate-900/60 hover:bg-slate-900/90'
                      : isLight
                        ? 'border border-transparent text-slate-700 hover:text-blue-700 hover:bg-white/90'
                        : 'border border-transparent text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <div className={`flex items-center gap-1.5 truncate ${
                  tab.locked ? 'opacity-65 filter blur-[0.3px]' : ''
                }`}>
                  <Icon className={`${inPopup ? 'w-3.5 h-3.5' : 'w-3.5 h-3.5 sm:w-4 sm:h-4'} stroke-[2.3] shrink-0`} />
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
                  className="accent-blue-600 w-4 h-4 cursor-pointer"
                />
                <span>Pick-up From Airport</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="airportDirection"
                  checked={airportTransferType === 'to_airport'}
                  onChange={() => setAirportTransferType('to_airport')}
                  className="accent-blue-600 w-4 h-4 cursor-pointer"
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
                    isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-blue-500' : 'bg-[#0F172A] border-slate-700 text-white focus:border-blue-500'
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
                    isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-blue-500' : 'bg-[#0F172A] border-slate-700 text-white focus:border-blue-500'
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
                    isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-blue-500' : 'bg-[#0F172A] border-slate-700 text-white focus:border-blue-500'
                  }`}
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSearchCars}
                className="btn-blue px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md cursor-pointer transition-all"
              >
                <Search className="w-4 h-4 stroke-[2.5]" />
                <span>Search Cab</span>
              </button>
            </div>
          </div>
        ) : tripType === 'local' ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative">
              {/* Pickup City Box (Fixed to Varanasi with friendly notice) */}
              <div 
                onClick={triggerVaranasiOnlyNotice}
                className={`px-3.5 py-2.5 rounded-xl sm:rounded-2xl border transition-all cursor-pointer relative ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 hover:border-blue-400'
                    : 'bg-[#070B14] border-slate-800 hover:border-blue-500/50'
                }`}
              >
                {/* Floating Notification */}
                {fromCityNotice && (
                  <div className="absolute left-0 -top-12 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 w-full sm:w-auto">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xl border border-blue-400">
                      <Sparkles className="w-3.5 h-3.5 text-white shrink-0 animate-pulse" />
                      <span>
                        {language === 'en'
                          ? 'Other cities coming soon! Currently cabs are available only from Varanasi.'
                          : 'अन्य शहरों के लिए सेवा जल्द आएगी! अभी केवल वाराणसी से ही कैब उपलब्ध है।'}
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1 mb-0.5">
                    <MapPin className="w-3 h-3 stroke-[2.5]" />
                    <span>Pickup City</span>
                  </label>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                    Varanasi Hub
                  </span>
                </div>
                <input
                  type="text"
                  value="Varanasi"
                  readOnly
                  className={`w-full bg-transparent text-sm sm:text-base font-black ${
                    isLight ? 'text-slate-950' : 'text-white'
                  } focus:outline-none cursor-pointer`}
                />
              </div>

              {/* Destination Full Address Box */}
              <div className={`px-3.5 py-2.5 rounded-xl sm:rounded-2xl border transition-all ${
                isLight
                  ? 'bg-slate-50 border-slate-300 focus-within:border-blue-600 focus-within:bg-white focus-within:shadow-md'
                  : 'bg-[#070B14] border-slate-800 focus-within:border-blue-500 focus-within:bg-[#0B1120]'
              }`}>
                <label className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1 mb-0.5">
                  <Navigation className="w-3 h-3 stroke-[2.5]" />
                  <span>Where To Go / Sightseeing Place</span>
                </label>
                <input
                  type="text"
                  value={dropAddress}
                  onChange={(e) => setDropAddress(e.target.value)}
                  placeholder="e.g. Kashi Vishwanath Temple, Sarnath or Hotel"
                  style={{
                    color: isLight ? '#020617' : '#FFFFFF',
                    WebkitTextFillColor: dropAddress ? (isLight ? '#020617' : '#FFFFFF') : undefined,
                    backgroundColor: 'transparent'
                  }}
                  className={`w-full bg-transparent text-sm sm:text-base font-black placeholder:font-normal placeholder:opacity-40 ${
                    isLight ? 'text-slate-950 placeholder:text-slate-400' : 'text-white placeholder:text-slate-500'
                  } focus:outline-none caret-blue-500`}
                />
              </div>
            </div>

            {/* Local Hourly Date & Time & Blue Search Cab Button */}
            <div className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-3 items-stretch">
                <div className="grid grid-cols-2 gap-2 sm:gap-3 md:col-span-8">
                  {/* Date Box */}
                  <div className={`px-3.5 py-2 rounded-xl sm:rounded-2xl border transition-all flex flex-col justify-center min-h-[54px] ${
                    formErrors.pickupDate
                      ? 'border-red-500 ring-2 ring-red-500/40 bg-red-50/50 dark:bg-red-950/20'
                      : isLight
                        ? 'bg-slate-50 border-slate-300 focus-within:border-blue-600 focus-within:bg-white'
                        : 'bg-[#070B14] border-slate-800 focus-within:border-blue-500'
                  }`}>
                    <label className="text-[10px] sm:text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1 mb-0.5">
                      <Calendar className="w-3 h-3 stroke-[2.5]" />
                      <span>Pickup Date</span>
                    </label>
                    <input
                      type="date"
                      value={pickupDate}
                      min={todayStr}
                      onChange={(e) => {
                        setPickupDate(e.target.value);
                        if (formErrors.pickupDate) {
                          setFormErrors(prev => ({ ...prev, pickupDate: '' }));
                        }
                      }}
                      style={{ colorScheme: isLight ? 'light' : 'dark' }}
                      className={`w-full bg-transparent text-xs sm:text-sm font-bold focus:outline-none cursor-pointer ${
                        isLight ? 'text-slate-950' : 'text-white'
                      }`}
                    />
                  </div>

                  {/* Time Box */}
                  <div className={`px-3.5 py-2 rounded-xl sm:rounded-2xl border transition-all flex flex-col justify-center min-h-[54px] ${
                    formErrors.pickupTime
                      ? 'border-red-500 ring-2 ring-red-500/40 bg-red-50/50 dark:bg-red-950/20'
                      : isLight
                        ? 'bg-slate-50 border-slate-300 focus-within:border-blue-600 focus-within:bg-white'
                        : 'bg-[#070B14] border-slate-800 focus-within:border-blue-500'
                  }`}>
                    <label className="text-[10px] sm:text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1 mb-0.5">
                      <Clock className="w-3 h-3 stroke-[2.5]" />
                      <span>Pickup Time</span>
                    </label>
                    <input
                      type="time"
                      value={pickupTime}
                      onChange={(e) => {
                        setPickupTime(e.target.value);
                        if (formErrors.pickupTime) {
                          setFormErrors(prev => ({ ...prev, pickupTime: '' }));
                        }
                      }}
                      style={{ colorScheme: isLight ? 'light' : 'dark' }}
                      className={`w-full bg-transparent text-xs sm:text-sm font-bold focus:outline-none cursor-pointer ${
                        isLight ? 'text-slate-950' : 'text-white'
                      }`}
                    />
                  </div>
                </div>

                {/* Blue Search Cab Button */}
                <button
                  type="button"
                  onClick={handleSearchCars}
                  className="btn-blue md:col-span-4 w-full min-h-[48px] md:min-h-[54px] px-5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95"
                >
                  <Search className="w-4 h-4 stroke-[2.8]" />
                  <span>Search Cab</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.8]" />
                </button>
              </div>

              {(formErrors.pickupDate || formErrors.pickupTime) && (
                <p className="text-red-500 text-xs font-bold flex items-center gap-1.5 animate-in fade-in duration-150">
                  <span>
                    ⚠️{' '}
                    {formErrors.pickupDate && formErrors.pickupTime
                      ? language === 'en'
                        ? 'Please fill both Pickup Date and Pickup Time first before searching!'
                        : 'कृपया सर्च करने से पहले पिकअप तारीख (Pickup Date) और पिकअप समय (Pickup Time) दोनों भरें!'
                      : formErrors.pickupDate || formErrors.pickupTime}
                  </span>
                </p>
              )}
            </div>
          </div>
        ) : (
          /* OUTSTATION ONE-WAY & ROUND-TRIP CONSOLE (Clean, Modern, Cohesive Blue Design on Mobile & PC) */
          <div className="space-y-2.5 sm:space-y-3.5">
            {/* ROW 1: ORIGIN (FROM) & DESTINATION (TO) WITH CENTER SWAP BUTTON */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 sm:gap-3 relative">
              {/* Origin (From) City Box */}
              <div className="flex-1 relative">
                {fromCityNotice && (
                  <div className="absolute left-0 -top-14 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 max-w-[340px] sm:max-w-md w-full">
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xl border border-blue-400">
                      <Sparkles className="w-3.5 h-3.5 text-white shrink-0 animate-pulse" />
                      <span className="flex-1">
                        {language === 'en'
                          ? 'To travel to Varanasi from another city, click the Swap (⇄) button!'
                          : 'अन्य शहरों से वाराणसी आने के लिए बीच का Swap (⇄) बटन दबाएं!'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFromCityNotice(false);
                        }}
                        className="ml-1 p-0.5 rounded-full hover:bg-black/20 text-white cursor-pointer"
                      >
                        <X className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                )}

                <div 
                  onClick={() => {
                    if (isFromVaranasi) {
                      triggerVaranasiOnlyNotice();
                    }
                  }}
                  className={`${
                    inPopup ? 'px-3.5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl min-h-[56px] sm:min-h-[62px]' : 'px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl min-h-[60px] sm:min-h-[64px]'
                  } border transition-all flex flex-col justify-center ${
                    isFromVaranasi ? 'cursor-pointer' : ''
                  } ${
                    formErrors.pickupCity
                      ? 'border-red-500 ring-2 ring-red-500/40 bg-red-50/50 dark:bg-red-950/20'
                      : isLight
                        ? 'bg-slate-50/90 border-slate-300/90 focus-within:border-blue-600 focus-within:bg-white focus-within:shadow-md'
                        : 'bg-[#070C18] border-slate-800 focus-within:border-blue-500 focus-within:bg-[#0A1122]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] sm:text-[11px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1 mb-0.5">
                      <MapPin className="w-3 h-3 stroke-[2.5]" />
                      <span>From (Pickup City)</span>
                    </label>
                    {isFromVaranasi ? (
                      <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        Swap ⇄ for Return
                      </span>
                    ) : (
                      <span className="text-[9.5px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        ⇄ Return to Varanasi
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 w-full">
                    <input
                      ref={inPopup ? pickupInputPopupRef : pickupInputPageRef}
                      type="text"
                      value={pickupCity}
                      readOnly={isFromVaranasi}
                      onChange={(e) => {
                        setPickupCity(e.target.value);
                        setFromSuggestionsOpen(true);
                        if (formErrors.pickupCity) {
                          setFormErrors(prev => ({ ...prev, pickupCity: '', singleCity: '' }));
                        }
                      }}
                      onFocus={() => {
                        if (!isFromVaranasi) {
                          setFromSuggestionsOpen(true);
                        } else {
                          triggerVaranasiOnlyNotice();
                        }
                      }}
                      onBlur={() => setTimeout(() => setFromSuggestionsOpen(false), 200)}
                      placeholder={isFromVaranasi ? 'Varanasi' : 'Enter Origin City (e.g. Lucknow)'}
                      style={{
                        color: isLight ? '#020617' : '#FFFFFF',
                        WebkitTextFillColor: pickupCity ? (isLight ? '#020617' : '#FFFFFF') : undefined,
                        backgroundColor: 'transparent'
                      }}
                      className={`w-full bg-transparent text-[15px] sm:text-base font-black placeholder:font-normal placeholder:opacity-40 ${
                        isLight ? 'text-slate-950 placeholder:text-slate-400' : 'text-white placeholder:text-slate-500'
                      } focus:outline-none leading-normal ${isFromVaranasi ? 'cursor-pointer' : 'caret-blue-500'}`}
                    />
                    {!isFromVaranasi && pickupCity.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setPickupCity('');
                          if (inPopup) pickupInputPopupRef.current?.focus();
                          else pickupInputPageRef.current?.focus();
                        }}
                        className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
                        title="Clear"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Dynamic Floating Suggestions Dropdown when From is not Varanasi */}
                {!isFromVaranasi && fromSuggestionsOpen && filteredFromSuggestions.length > 0 && (
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
                          isLight ? 'hover:bg-blue-50 hover:text-blue-700 text-slate-950' : 'hover:bg-slate-800 hover:text-blue-400 text-white'
                        }`}
                      >
                        <span>{c}</span>
                        <span className="text-[10px] text-blue-500 font-bold">Select</span>
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

              {/* Swap Button: Sleek Blue Circle */}
              <div className="flex items-center justify-center shrink-0 -my-1.5 md:my-0 z-10 mx-auto md:mx-0">
                <button
                  type="button"
                  onClick={handleSwapLocations}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full btn-blue flex items-center justify-center shadow-md cursor-pointer transition-all hover:rotate-180 border-2 border-white dark:border-[#0B1222]"
                  title="Swap Origin & Destination"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 stroke-[2.5] block md:hidden" />
                  <ArrowLeftRight className="w-3.5 h-3.5 stroke-[2.5] hidden md:block" />
                </button>
              </div>

              {/* Destination (To) City Box - Auto-Focused with Crisp Blue Focus Ring */}
              <div className="flex-1 relative">
                <div className={`${
                  inPopup ? 'px-3.5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl min-h-[56px] sm:min-h-[62px]' : 'px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl min-h-[60px] sm:min-h-[64px]'
                } border transition-all flex flex-col justify-center ${
                  formErrors.dropCity
                    ? 'border-red-500 ring-2 ring-red-500/40 bg-red-50/50 dark:bg-red-950/20'
                    : isLight
                      ? 'bg-slate-50/90 border-blue-400/80 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:bg-white focus-within:shadow-md'
                      : 'bg-[#070C18] border-blue-500/50 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/25 focus-within:bg-[#0A1122]'
                }`}>
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] sm:text-[11px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1 mb-0.5">
                      <Navigation className="w-3 h-3 stroke-[2.5]" />
                      <span>To (Destination City)</span>
                    </label>
                    <span className="text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400">
                      70+ Cities
                    </span>
                  </div>
                  <div className="flex items-center gap-1 w-full">
                    <input
                      ref={inPopup ? dropInputPopupRef : dropInputPageRef}
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
                      placeholder="Enter Destination (e.g. Ayodhya, Prayagraj)"
                      style={{
                        color: isLight ? '#020617' : '#FFFFFF',
                        WebkitTextFillColor: dropCity ? (isLight ? '#020617' : '#FFFFFF') : undefined,
                        backgroundColor: 'transparent'
                      }}
                      className={`w-full bg-transparent text-[15px] sm:text-base font-black placeholder:font-normal placeholder:opacity-40 ${
                        isLight ? 'text-slate-950 placeholder:text-slate-400' : 'text-white placeholder:text-slate-500'
                      } focus:outline-none leading-normal caret-blue-500`}
                    />
                    {dropCity.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setDropCity('');
                          if (inPopup) dropInputPopupRef.current?.focus();
                          else dropInputPageRef.current?.focus();
                        }}
                        className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
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
                          isLight ? 'hover:bg-blue-50 hover:text-blue-700 text-slate-950' : 'hover:bg-slate-800 hover:text-blue-400 text-white'
                        }`}
                      >
                        <span>{c}</span>
                        <span className="text-[10px] text-blue-500 font-bold">Select City</span>
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
              <div className="p-3 sm:p-3.5 rounded-2xl bg-blue-500/10 border-2 border-blue-500/50 text-slate-900 dark:text-slate-100 text-xs animate-in zoom-in-95 shadow-md">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs font-black">
                    <Sparkles className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <strong className="block text-xs sm:text-sm font-black text-blue-600 dark:text-blue-400">
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
                      className="mt-1 px-3.5 py-2 rounded-xl btn-blue font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95 transition-all"
                    >
                      <Car className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{language === 'en' ? 'Switch to Local Hourly Rental' : 'लोकल ऑवरली रेंटल पर जाएं (Local Hourly)'}</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ROW 2: DATE & TIME SELECTOR + BLUE SEARCH CAB BUTTON (Clean & Balanced on both Mobile & PC!) */}
            {tripType === 'roundtrip' ? (
              /* Round Trip: Pickup & Return Schedules + Blue Search Cab Button */
              <div className="space-y-2">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-3 items-stretch">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 lg:col-span-9">
                    {/* Pickup Schedule Box */}
                    <div className={`grid grid-cols-2 gap-2 px-3.5 py-2 rounded-xl sm:rounded-2xl border transition-all min-h-[54px] items-center ${
                      formErrors.pickupDate || formErrors.pickupTime
                        ? 'border-red-500 ring-2 ring-red-500/40 bg-red-50/50 dark:bg-red-950/20'
                        : isLight
                          ? 'bg-slate-50/90 border-slate-300/90 focus-within:border-blue-600 focus-within:bg-white'
                          : 'bg-[#070C18] border-slate-800 focus-within:border-blue-500'
                    }`}>
                      <div className="min-w-0">
                        <label className="text-[10px] sm:text-[11px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1 mb-0.5 truncate">
                          <Calendar className="w-3 h-3 shrink-0" />
                          <span className="truncate">Pickup Date</span>
                        </label>
                        <input
                          type="date"
                          value={pickupDate}
                          min={todayStr}
                          onChange={(e) => {
                            setPickupDate(e.target.value);
                            if (returnDate && returnDate < e.target.value) setReturnDate(e.target.value);
                            if (formErrors.pickupDate) {
                              setFormErrors(prev => ({ ...prev, pickupDate: '' }));
                            }
                          }}
                          style={{ colorScheme: isLight ? 'light' : 'dark' }}
                          className={`w-full bg-transparent text-xs sm:text-sm font-bold focus:outline-none cursor-pointer ${
                            isLight ? 'text-slate-950' : 'text-white'
                          }`}
                        />
                      </div>
                      <div className="min-w-0 border-l border-slate-200 dark:border-slate-800 pl-2">
                        <label className="text-[10px] sm:text-[11px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1 mb-0.5 truncate">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span className="truncate">Pickup Time</span>
                        </label>
                        <input
                          type="time"
                          value={pickupTime}
                          onChange={(e) => {
                            setPickupTime(e.target.value);
                            if (formErrors.pickupTime) {
                              setFormErrors(prev => ({ ...prev, pickupTime: '' }));
                            }
                          }}
                          style={{ colorScheme: isLight ? 'light' : 'dark' }}
                          className={`w-full bg-transparent text-xs sm:text-sm font-bold focus:outline-none cursor-pointer ${
                            isLight ? 'text-slate-950' : 'text-white'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Return Schedule Box */}
                    <div className={`grid grid-cols-2 gap-2 px-3.5 py-2 rounded-xl sm:rounded-2xl border transition-all min-h-[54px] items-center ${
                      formErrors.returnDate || formErrors.returnTime
                        ? 'border-red-500 ring-2 ring-red-500/40 bg-red-50/50 dark:bg-red-950/20'
                        : isLight
                          ? 'bg-slate-50/90 border-slate-300/90 focus-within:border-blue-600 focus-within:bg-white'
                          : 'bg-[#070C18] border-slate-800 focus-within:border-blue-500'
                    }`}>
                      <div className="min-w-0">
                        <label className="text-[10px] sm:text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1 mb-0.5 truncate">
                          <Calendar className="w-3 h-3 shrink-0" />
                          <span className="truncate">Return Date</span>
                        </label>
                        <input
                          type="date"
                          value={returnDate}
                          min={pickupDate || todayStr}
                          onChange={(e) => {
                            setReturnDate(e.target.value);
                            if (formErrors.returnDate) {
                              setFormErrors(prev => ({ ...prev, returnDate: '' }));
                            }
                          }}
                          style={{ colorScheme: isLight ? 'light' : 'dark' }}
                          className={`w-full bg-transparent text-xs sm:text-sm font-bold focus:outline-none cursor-pointer ${
                            isLight ? 'text-slate-950' : 'text-white'
                          }`}
                        />
                      </div>
                      <div className="min-w-0 border-l border-slate-200 dark:border-slate-800 pl-2">
                        <label className="text-[10px] sm:text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1 mb-0.5 truncate">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span className="truncate">Return Time</span>
                        </label>
                        <input
                          type="time"
                          value={returnTime}
                          onChange={(e) => {
                            setReturnTime(e.target.value);
                            if (formErrors.returnTime) {
                              setFormErrors(prev => ({ ...prev, returnTime: '' }));
                            }
                          }}
                          style={{ colorScheme: isLight ? 'light' : 'dark' }}
                          className={`w-full bg-transparent text-xs sm:text-sm font-bold focus:outline-none cursor-pointer ${
                            isLight ? 'text-slate-950' : 'text-white'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Round Trip Blue Search Cab Button */}
                  <button
                    type="button"
                    onClick={handleSearchCars}
                    className="btn-blue lg:col-span-3 w-full min-h-[48px] lg:min-h-[54px] px-5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95"
                  >
                    <Search className="w-4 h-4 stroke-[2.8]" />
                    <span>Search Cab</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.8]" />
                  </button>
                </div>

                {(formErrors.pickupDate || formErrors.pickupTime || formErrors.returnDate || formErrors.returnTime) && (
                  <p className="text-red-500 text-xs font-bold flex items-center gap-1.5 animate-in fade-in duration-150">
                    <span>
                      ⚠️{' '}
                      {formErrors.pickupDate && formErrors.pickupTime
                        ? language === 'en'
                          ? 'Please fill both Pickup Date and Pickup Time (and Return schedule) first before searching!'
                          : 'कृपया सर्च करने से पहले पिकअप तारीख (Pickup Date) और पिकअप समय (Pickup Time) दोनों भरें!'
                        : formErrors.pickupDate || formErrors.pickupTime || formErrors.returnDate || formErrors.returnTime}
                    </span>
                  </p>
                )}
              </div>
            ) : (
              /* One-Way Schedule & Blue Search Cab Button:
                 On Mobile (< md): 2-column Date & Time grid, then full-width Blue Search Cab button below.
                 On PC (md+): Unified 12-column row (4 cols Date + 4 cols Time + 4 cols Blue Search Cab button) with identical height! */
              <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2 sm:gap-3 items-stretch">
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 md:col-span-8">
                    {/* Pickup Date Card */}
                    <div className={`px-3 sm:px-4 py-2 rounded-xl sm:rounded-2xl border transition-all flex flex-col justify-center min-h-[52px] sm:min-h-[56px] ${
                      formErrors.pickupDate
                        ? 'border-red-500 ring-2 ring-red-500/40 bg-red-50/50 dark:bg-red-950/20'
                        : isLight
                          ? 'bg-slate-50/90 border-slate-300/90 focus-within:border-blue-600 focus-within:bg-white focus-within:shadow-sm'
                          : 'bg-[#070C18] border-slate-800 focus-within:border-blue-500'
                    }`}>
                      <label className="text-[10px] sm:text-[11px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1 mb-0.5">
                        <Calendar className="w-3 h-3 stroke-[2.5] shrink-0" />
                        <span className="truncate">Pickup Date</span>
                      </label>
                      <input
                        type="date"
                        value={pickupDate}
                        min={todayStr}
                        onChange={(e) => {
                          setPickupDate(e.target.value);
                          if (formErrors.pickupDate) {
                            setFormErrors(prev => ({ ...prev, pickupDate: '' }));
                          }
                        }}
                        style={{ colorScheme: isLight ? 'light' : 'dark' }}
                        className={`w-full bg-transparent text-xs sm:text-sm font-extrabold focus:outline-none cursor-pointer ${
                          isLight ? 'text-slate-950' : 'text-white'
                        }`}
                      />
                    </div>

                    {/* Pickup Time Card */}
                    <div className={`px-3 sm:px-4 py-2 rounded-xl sm:rounded-2xl border transition-all flex flex-col justify-center min-h-[52px] sm:min-h-[56px] ${
                      formErrors.pickupTime
                        ? 'border-red-500 ring-2 ring-red-500/40 bg-red-50/50 dark:bg-red-950/20'
                        : isLight
                          ? 'bg-slate-50/90 border-slate-300/90 focus-within:border-blue-600 focus-within:bg-white focus-within:shadow-sm'
                          : 'bg-[#070C18] border-slate-800 focus-within:border-blue-500'
                    }`}>
                      <label className="text-[10px] sm:text-[11px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1 mb-0.5">
                        <Clock className="w-3 h-3 stroke-[2.5] shrink-0" />
                        <span className="truncate">Pickup Time</span>
                      </label>
                      <input
                        type="time"
                        value={pickupTime}
                        onChange={(e) => {
                          setPickupTime(e.target.value);
                          if (formErrors.pickupTime) {
                            setFormErrors(prev => ({ ...prev, pickupTime: '' }));
                          }
                        }}
                        style={{ colorScheme: isLight ? 'light' : 'dark' }}
                        className={`w-full bg-transparent text-xs sm:text-sm font-extrabold focus:outline-none cursor-pointer ${
                          isLight ? 'text-slate-950' : 'text-white'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Vibrant Royal Blue Search Cab CTA Button */}
                  <button
                    type="button"
                    onClick={handleSearchCars}
                    className="btn-blue md:col-span-4 w-full min-h-[46px] sm:min-h-[56px] px-5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95"
                  >
                    <span className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                      <Search className="w-3.5 h-3.5 stroke-[2.8]" />
                    </span>
                    <span>Search Cab</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.8]" />
                  </button>
                </div>

                {(formErrors.pickupDate || formErrors.pickupTime) && (
                  <p className="text-red-500 text-xs font-bold flex items-center gap-1.5 animate-in fade-in duration-150">
                    <span>
                      ⚠️{' '}
                      {formErrors.pickupDate && formErrors.pickupTime
                        ? language === 'en'
                          ? 'Please fill both Pickup Date and Pickup Time first before searching!'
                          : 'कृपया सर्च करने से पहले पिकअप तारीख (Pickup Date) और पिकअप समय (Pickup Time) दोनों भरें!'
                        : formErrors.pickupDate || formErrors.pickupTime}
                    </span>
                  </p>
                )}
              </div>
            )}

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
                    <strong className="text-blue-600 dark:text-blue-400 font-black">{pickupCity}</strong>{' '}
                    <span className="opacity-70">{tripType === 'roundtrip' ? '⇄' : '→'}</span>{' '}
                    <strong className="text-emerald-600 dark:text-emerald-400 font-black">{dropCity}</strong>
                  </span>
                  <span className="text-amber-500 font-mono font-bold">(~{fareResult.estimatedDistanceKm} KM)</span>
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px] sm:text-xs">
                  {tripType === 'roundtrip' ? 'Round Trip · Instant ₹200–₹300 OFF' : 'One-Way · Instant ₹200–₹300 OFF · ₹0 Advance'}
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
      {/* UNIVERSAL ONE-WAY POPUP MODAL (Mobile stays compact max-w-[420px], PC gets sleek max-w-3xl executive layout) */}
      {isMobilePopup && (
        <div 
          id="booking-form-popup"
          className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleDismissMobilePopup();
            }
          }}
        >
          <div className="relative w-full max-w-[420px] md:max-w-3xl mx-auto my-auto animate-in zoom-in-95 duration-150">
            {/* Close Cross Button on Top-Right Corner */}
            <button
              type="button"
              onClick={handleDismissMobilePopup}
              className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 z-50 w-8 h-8 rounded-full bg-slate-900/90 hover:bg-blue-600 border border-slate-700 text-slate-200 hover:text-white flex items-center justify-center shadow-xl transition-all cursor-pointer active:scale-90"
              aria-label="Close Popup"
              title="Close"
            >
              <X className="w-4 h-4 stroke-[2.8]" />
            </button>

            {/* The One-Way Booking Form Card */}
            {renderFormCard(true)}

            {/* Skip & Explore Website button below card */}
            <div className="text-center mt-3">
              <button
                type="button"
                onClick={handleDismissMobilePopup}
                className="text-xs font-bold text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 px-4 py-1.5 rounded-full backdrop-blur-sm transition-all cursor-pointer inline-flex items-center gap-1.5 border border-white/15"
              >
                <span>{language === 'en' ? 'Skip & Explore Website' : 'वेबसाइट देखें / स्किप करें'}</span>
                <span className="text-[10px]">↓</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IN-PLACE BOOKING CARD ON PAGE */}
      <div className="w-full">
        {renderFormCard(false)}
      </div>

      {/* AUTOMATIC LIVE CARS SECTION */}
      <div ref={cabsSectionRef} className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold flex items-center gap-2">
              <Car className="w-4 h-4 text-blue-500" />
              <span>
                {hasSearched
                  ? `Available Cabs for ${pickupCity} → ${tripType === 'local' ? (dropAddress || 'Local City') : dropCity}`
                  : (language === 'en' ? 'Our Cars (Instant ₹200–₹300 OFF)' : 'हमारी गाड़ियां (Our Cars)')}
              </span>
            </h3>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {language === 'en'
                ? 'Click "Book Cab" on any car to enter your destination & get instant discount.'
                : 'किसी भी गाड़ी पर "Book Cab" दबाएं और तुरंत डिस्काउंट पाएं।'}
            </p>
          </div>
        </div>

        {/* SLEEK HORIZONTAL CAR CARDS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4">
          {displayedVehicles.map((rawVehicle, idx) => {
            // Apply 12 / 26 Seater option dynamically for Force Tempo Traveller
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

            const isSelected = selectedVehicle.id === v.id;
            const flatDiscount =
              v.category === 'hatchback' || v.category === 'sedan' || v.category === 'honda'
                ? 200
                : 300;

            // Keep horizontal flex-row on BOTH mobile and desktop
            const responsiveDisplay = showAllCars
              ? 'flex flex-row items-stretch'
              : idx < 3
                ? 'flex flex-row items-stretch'
                : idx === 3
                  ? 'hidden lg:flex lg:flex-row items-stretch'
                  : 'hidden';

            return (
              <div
                key={v.id}
                className={`rounded-2xl border overflow-hidden transition-all duration-200 ${responsiveDisplay} group shadow-sm hover:shadow-xl ${
                  isSelected && hasSearched
                    ? isLight
                      ? 'bg-blue-50/40 border-blue-500 ring-2 ring-blue-500 shadow-xl'
                      : 'bg-[#111A2E] border-blue-400 ring-2 ring-blue-400/80 shadow-xl'
                    : isLight
                      ? 'bg-white border-slate-200/90 hover:border-blue-500'
                      : 'bg-[#0B1120] border-slate-800 hover:border-blue-500/60'
                }`}
              >
                {/* Left: Pure White Studio Car Photo */}
                <div className="relative w-[38%] sm:w-[44%] h-[126px] sm:h-[146px] bg-white flex items-center justify-center p-1.5 sm:p-2.5 shrink-0 border-r border-slate-200/80 dark:border-slate-800 overflow-hidden">
                  <img
                    src={v.imageUrl}
                    alt={v.name}
                    className="w-full h-full object-contain object-center scale-105 transition-transform duration-300 group-hover:scale-110"
                  />
                </div>

                {/* Right: Sleek, Slim, Non-Overlapping Car Details & 12/26 Seater Toggle */}
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
                      <span className="text-[8px] sm:text-[9.5px] font-black px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 uppercase shrink-0">
                        ₹{flatDiscount} OFF
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

                    {/* Clean Horizontal Specs Bar */}
                    <div className={`flex items-center gap-2 sm:gap-3 mt-1.5 py-1 px-2 sm:px-2.5 rounded-lg border text-[10px] sm:text-[11px] font-bold ${
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

                  {/* Bottom Action Bar: Opens One-Way Popup & Auto-Focuses Destination when Book Cab is clicked */}
                  <div className="mt-2 pt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
                    <span className={`text-[10px] sm:text-xs font-bold flex items-center gap-1 truncate ${
                      isLight ? 'text-blue-700' : 'text-blue-400'
                    }`}>
                      <Car className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">AC Cab · ₹0 Advance</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenQuickModal(v)}
                      className="btn-select-book text-[11px] sm:text-xs px-3.5 sm:px-4 py-1.5 rounded-lg sm:rounded-xl font-bold cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-sm"
                    >
                      <span>{language === 'en' ? 'Book Cab' : 'बुक करें'}</span>
                      <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.8]" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* VIEW ALL 10 CARS BUTTON */}
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => {
              if (onViewAllCars) {
                onViewAllCars();
                return;
              }
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
              {onViewAllCars
                ? (language === 'en' ? `View All ${displayedVehicles.length} Cars` : `सभी ${displayedVehicles.length} गाड़ियां देखें`)
                : showAllCars
                  ? (language === 'en' ? 'Show Fewer Cars' : 'कम गाड़ियां देखें')
                  : (language === 'en' ? `View All ${displayedVehicles.length} Cars` : `सभी ${displayedVehicles.length} गाड़ियां देखें`)}
            </span>
            <ArrowRight className="w-4 h-4 stroke-[2.5] shrink-0" />
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
