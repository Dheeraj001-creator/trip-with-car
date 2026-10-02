import React, { useState, useMemo, useRef } from 'react';
import { 
  MapPin, 
  ArrowLeftRight, 
  Plane, 
  Navigation, 
  Car, 
  Users, 
  Briefcase, 
  ShieldCheck, 
  ArrowRight,
  Wind,
  Search,
  Sparkles
} from 'lucide-react';
import { TripType, Vehicle, Booking } from '../types/cab';
import { VEHICLES, CITIES_LIST, AIRPORTS_LIST } from '../data/cabsData';
import { calculateFare } from '../utils/fareCalculator';
import { QuickBookingModal } from './QuickBookingModal';
import { CityPickerModal } from './CityPickerModal';
import { CarLoadingOverlay } from './CarLoadingOverlay';

interface BookingFormProps {
  initialTripType?: TripType;
  initialFrom?: string;
  initialTo?: string;
  initialVehicleCategory?: string;
  onBookingConfirmed: (booking: Booking) => void;
  language?: 'en' | 'hi';
  theme: 'dark' | 'light';
}

export const BookingForm: React.FC<BookingFormProps> = ({
  initialTripType = 'oneway',
  initialFrom = 'Varanasi',
  initialTo = 'Ayodhya',
  initialVehicleCategory,
  onBookingConfirmed,
  language = 'en',
  theme,
}) => {
  const isLight = theme === 'light';

  // Trip Selection state
  const [tripType, setTripType] = useState<TripType>(initialTripType);
  const [pickupCity, setPickupCity] = useState(initialFrom);
  const [dropCity, setDropCity] = useState(initialTo);
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropAddress, setDropAddress] = useState('');
  
  // Search state: initially false so only 2 sample cars appear until search is clicked
  const [hasSearched, setHasSearched] = useState(false);
  const [fromSuggestionsOpen, setFromSuggestionsOpen] = useState(false);
  const [toSuggestionsOpen, setToSuggestionsOpen] = useState(false);
  const cabsSectionRef = useRef<HTMLDivElement>(null);

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
    if (tripType !== 'local' && !dropCity.trim()) {
      setFormErrors(prev => ({ ...prev, dropCity: 'Please enter destination city' }));
      return;
    }
    setFormErrors({});
    setHasSearched(true);
    setFromSuggestionsOpen(false);
    setToSuggestionsOpen(false);
    setTimeout(() => {
      cabsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  // Open Reservation popup directly with loading animation
  const handleOpenQuickModal = (vehicle: Vehicle) => {
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

  // Vehicles to display: only 2 sample cars until search is clicked
  const displayedVehicles = hasSearched ? VEHICLES : VEHICLES.slice(0, 2);

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

      {/* ELEVATED STANDALONE ROUTE CARD (No redundant header, fitted layout with Search Car button) */}
      <div className={`relative max-w-4xl mx-auto rounded-3xl border shadow-2xl p-4 sm:p-6 md:p-7 mb-14 sm:mb-16 transition-all ${
        isLight
          ? 'bg-white border-slate-200 shadow-xl shadow-slate-200/60'
          : 'bg-[#0B1120] border-slate-800 shadow-2xl shadow-black/90'
      }`}>
        
        {/* Trip Type Segmented Tabs */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 rounded-2xl border mb-5 ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#04070F] border-slate-800'
        }`}>
          {[
            { type: 'oneway', label: 'One Way', icon: Navigation },
            { type: 'roundtrip', label: 'Round Trip', icon: ArrowLeftRight },
            { type: 'local', label: 'Local Hourly', icon: Car },
            { type: 'airport', label: 'Airport Taxi', icon: Plane },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = tripType === tab.type;
            return (
              <button
                key={tab.type}
                type="button"
                onClick={() => {
                  setTripType(tab.type as TripType);
                  setHasSearched(false);
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer select-none whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500 border border-amber-400 text-slate-950 font-bold shadow-sm'
                    : isLight
                      ? 'border border-transparent text-slate-700 hover:text-slate-950 hover:bg-white/80'
                      : 'border border-transparent text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Icon className="w-4 h-4 stroke-[2.2]" />
                <span>{tab.label}</span>
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
                className="btn-gold px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-[0.98]"
              >
                <Search className="w-4 h-4 stroke-[2.5]" />
                <span>Search Car</span>
              </button>
            </div>
          </div>
        ) : tripType === 'local' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#070B14] border-slate-800'}`}>
                <label className="block text-xs font-semibold mb-1 opacity-80">City for Local Rental</label>
                <select
                  value={pickupCity}
                  onChange={(e) => setPickupCity(e.target.value)}
                  className={`w-full rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold border focus:outline-none ${
                    isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-amber-500' : 'bg-[#0F172A] border-slate-700 text-white focus:border-amber-500'
                  }`}
                >
                  <option value="Varanasi">Varanasi</option>
                  <option value="Ayodhya">Ayodhya</option>
                  <option value="Prayagraj (Allahabad)">Prayagraj (Allahabad)</option>
                  <option value="Lucknow">Lucknow</option>
                </select>
              </div>

              <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#070B14] border-slate-800'}`}>
                <label className="block text-xs font-semibold mb-1 opacity-80">Pickup Hotel / Landmark</label>
                <input
                  type="text"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="Hotel lobby or landmark"
                  className={`w-full rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold border focus:outline-none ${
                    isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-amber-500' : 'bg-[#0F172A] border-slate-700 text-white focus:border-amber-500'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 opacity-80">Rental Package</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { key: '4h_40km', label: '4 Hours / 40 KM', desc: 'Short city ride' },
                  { key: '8h_80km', label: '8 Hours / 80 KM', desc: 'Full City Darshan' },
                  { key: '12h_120km', label: '12 Hours / 120 KM', desc: 'Extended sightseeing' },
                ].map((pkg) => (
                  <button
                    key={pkg.key}
                    type="button"
                    onClick={() => setLocalPackage(pkg.key as any)}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      localPackage === pkg.key
                        ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/50'
                        : isLight ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100' : 'bg-[#070B14] border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-bold text-xs sm:text-sm">{pkg.label}</div>
                    <div className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{pkg.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSearchCars}
                className="btn-gold px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-[0.98]"
              >
                <Search className="w-4 h-4 stroke-[2.5]" />
                <span>Search Car</span>
              </button>
            </div>
          </div>
        ) : (
          /* Outstation Route Chooser (Fitted Row with From, Swap, To, and Search Car button) */
          <div>
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5 sm:gap-3 relative">
              {/* From City Box with Dynamic Floating Autocomplete */}
              <div className="flex-1 relative">
                <div className={`px-3.5 py-2 sm:py-2.5 rounded-2xl border transition-all ${
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
                    placeholder="Enter city (e.g. Varanasi)"
                    className="w-full bg-transparent text-sm sm:text-base font-semibold placeholder-slate-400 focus:outline-none"
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

              {/* Swap Button (Clean Gap, does not touch or collide with input boxes) */}
              <div className="flex items-center justify-center shrink-0 my-0.5 md:my-0 px-1">
                <button
                  type="button"
                  onClick={handleSwapLocations}
                  className="w-10 h-10 rounded-full btn-gold flex items-center justify-center shadow-md cursor-pointer transition-all hover:rotate-180 hover:scale-105 active:scale-95"
                  title="Swap Cities"
                >
                  <ArrowLeftRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              {/* To City Box with Dynamic Floating Autocomplete */}
              <div className="flex-1 relative">
                <div className={`px-3.5 py-2 sm:py-2.5 rounded-2xl border transition-all ${
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
                    placeholder="Enter destination (e.g. Ayodhya)"
                    className="w-full bg-transparent text-sm sm:text-base font-semibold placeholder-slate-400 focus:outline-none"
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

              {/* SEARCH CAR BUTTON (Positioned right beside the To box!) */}
              <div className="shrink-0 flex items-stretch md:items-end">
                <button
                  type="button"
                  onClick={handleSearchCars}
                  className="btn-gold w-full md:w-auto h-[50px] sm:h-[54px] px-5 sm:px-6 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer transition-all active:scale-[0.98]"
                >
                  <Search className="w-4 h-4 stroke-[2.5]" />
                  <span>Search Car</span>
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

      {/* AUTOMATIC LIVE CARS SECTION (Starts below the search card with proper detachment) */}
      <div ref={cabsSectionRef} className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <Car className="w-4 h-4 text-amber-500" />
              <span>
                Available Cabs for {pickupCity} → {tripType === 'local' ? 'Local City' : dropCity}
              </span>
            </h3>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Click &quot;Select&quot; on any cab to open the quick reservation popup.
            </p>
          </div>

          <span className={`text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
            isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
          }`}>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>All-Inclusive Tariffs</span>
          </span>
        </div>

        {/* Prompt before searching: Shows 2 sample cars initially */}
        {!hasSearched && (
          <div className={`mb-5 p-3 sm:p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${
            isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-950/30 border-amber-500/30 text-amber-300'
          }`}>
            <div className="flex items-center gap-2 font-medium">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                Showing 2 sample cars below. Click <strong>&quot;Search Car&quot;</strong> above to view all 10+ models with live route fares.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setHasSearched(true)}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 underline cursor-pointer shrink-0"
            >
              Show All 10+ Cars
            </button>
          </div>
        )}

        {/* RESPONSIVE CAR CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedVehicles.map((v) => {
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

            return (
              <div
                key={v.id}
                onClick={() => handleOpenQuickModal(v)}
                className={`rounded-3xl border overflow-hidden transition-all duration-300 cursor-pointer flex flex-col justify-between group ${
                  isSelected
                    ? isLight
                      ? 'bg-amber-50/40 border-amber-500 ring-2 ring-amber-500 shadow-xl scale-[1.01]'
                      : 'bg-[#111A2E] border-amber-400 ring-2 ring-amber-400/80 shadow-xl scale-[1.01]'
                    : isLight
                      ? 'bg-white hover:bg-slate-50 border-slate-200 hover:border-amber-400 hover:shadow-xl hover:-translate-y-1'
                      : 'bg-[#070B14] border-slate-800 hover:border-amber-400/60 hover:shadow-xl hover:-translate-y-1'
                }`}
              >
                <div>
                  {/* COMPACT HORIZONTAL CAR PHOTO */}
                  <div className="relative w-full h-36 sm:h-40 bg-slate-950 overflow-hidden">
                    <img
                      src={v.imageUrl}
                      alt={v.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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
                      <h4 className="text-sm sm:text-base font-bold tracking-tight group-hover:text-amber-500 transition-colors truncate">
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

                {/* FARE & ACTION (COMPACT PROPORTIONAL FOOTER WITH "Select" BUTTON) */}
                <div className={`py-2.5 px-4 sm:px-4.5 border-t flex items-center justify-between gap-3 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#04070F] border-slate-800'
                }`}>
                  <div>
                    <span className={`text-[9px] uppercase tracking-wider font-semibold block leading-tight ${
                      isLight ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      All-Inclusive
                    </span>
                    {/* Compact Emerald Price */}
                    <div className="text-base sm:text-lg font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
                      ₹{carFare.totalFare}
                    </div>
                  </div>

                  {/* COMPACT ROYAL GOLD "Select" BUTTON */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenQuickModal(v);
                    }}
                    className="btn-select-book"
                  >
                    <span>Select</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.8]" />
                  </button>
                </div>
              </div>
            );
          })}
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
    </div>
  );
};
