import React, { useState, useMemo } from 'react';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  ArrowLeftRight, 
  Plane, 
  Navigation, 
  Car, 
  Users, 
  Briefcase, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight,
  Wind,
  CreditCard,
  Search,
  Sparkles
} from 'lucide-react';
import { TripType, Vehicle, Booking } from '../types/cab';
import { VEHICLES, CITIES_LIST, AIRPORTS_LIST, POPULAR_ROUTES } from '../data/cabsData';
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
  language: 'en' | 'hi';
  theme: 'dark' | 'light';
}

export const BookingForm: React.FC<BookingFormProps> = ({
  initialTripType = 'oneway',
  initialFrom = 'Varanasi',
  initialTo = 'Ayodhya',
  initialVehicleCategory,
  onBookingConfirmed,
  language,
  theme,
}) => {
  const isLight = theme === 'light';

  // Trip Selection state
  const [tripType, setTripType] = useState<TripType>(initialTripType);
  const [pickupCity, setPickupCity] = useState(initialFrom);
  const [dropCity, setDropCity] = useState(initialTo);
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropAddress, setDropAddress] = useState('');
  
  // Dates
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [pickupDate, setPickupDate] = useState(todayStr);
  const [pickupTime, setPickupTime] = useState('08:00');
  const [returnDate, setReturnDate] = useState(tomorrowStr);
  const [returnTime, setReturnTime] = useState('18:00');

  // Local Package specifics
  const [localPackage, setLocalPackage] = useState<'4h_40km' | '8h_80km' | '12h_120km'>('8h_80km');

  // Airport specifics
  const [airportTransferType, setAirportTransferType] = useState<'from_airport' | 'to_airport'>('from_airport');
  const [selectedAirportId, setSelectedAirportId] = useState(AIRPORTS_LIST[0].id);
  const [flightNumber, setFlightNumber] = useState('');

  // Selected Vehicle
  const defaultVehicle = VEHICLES.find(v => v.category === (initialVehicleCategory || 'sedan')) || VEHICLES[0];
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle>(defaultVehicle);

  // Quick Popup Modal state (Name, Phone, Email)
  const [showQuickModal, setShowQuickModal] = useState<boolean>(false);
  const [isCarLoading, setIsCarLoading] = useState<boolean>(false);
  const [loadingCarName, setLoadingCarName] = useState<string>('');

  // City Picker Modal state
  const [cityPickerMode, setCityPickerMode] = useState<'pickup' | 'drop' | null>(null);

  // Errors state
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Swap pickup & drop
  const handleSwapLocations = () => {
    const temp = pickupCity;
    setPickupCity(dropCity);
    setDropCity(temp);
    const tempAddr = pickupAddress;
    setPickupAddress(dropAddress);
    setDropAddress(tempAddr);
  };

  // Matched Highway Route Info
  const matchedRoute = useMemo(() => {
    if (tripType === 'local' || tripType === 'airport') return null;
    const cleanFrom = pickupCity.trim().toLowerCase();
    const cleanTo = dropCity.trim().toLowerCase();

    return POPULAR_ROUTES.find(
      (r) =>
        (r.from.toLowerCase().includes(cleanFrom) && r.to.toLowerCase().includes(cleanTo)) ||
        (r.to.toLowerCase().includes(cleanFrom) && r.from.toLowerCase().includes(cleanTo))
    ) || null;
  }, [pickupCity, dropCity, tripType]);

  // Live fare calculation (updates automatically whenever origin or destination changes)
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

  // Validate route before opening quick booking modal
  const handleOpenQuickModal = (vehicleToSelect?: Vehicle) => {
    if (vehicleToSelect) {
      setSelectedVehicle(vehicleToSelect);
    }

    const errors: { [key: string]: string } = {};

    if (tripType !== 'local') {
      if (!pickupCity.trim()) errors.pickupCity = 'Pickup city is required';
      if (!dropCity.trim() && tripType !== 'airport') errors.dropCity = 'Drop city is required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    const carName = vehicleToSelect ? vehicleToSelect.name : selectedVehicle.name;
    setLoadingCarName(carName);
    setIsCarLoading(true);

    setTimeout(() => {
      setIsCarLoading(false);
      setShowQuickModal(true);
    }, 650);
  };

  const isBothCitiesSelected = Boolean(pickupCity.trim() && (tripType === 'local' || dropCity.trim()));

  return (
    <div className={`rounded-3xl shadow-2xl p-6 sm:p-9 lg:p-10 border transition-all ${
      isLight
        ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/90'
        : 'bg-[#0B1120] border-slate-800 text-slate-100 shadow-black/80'
    }`}>
      {/* Top Banner with Clean Spacing & High-Contrast Typography */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b gap-4 ${
        isLight ? 'border-slate-200' : 'border-slate-800'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-500 flex items-center justify-center shrink-0 shadow-xs">
            <Car className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-[11px] text-amber-500 uppercase tracking-widest font-black block">
              {language === 'en' ? 'Verified Outstation Chauffeur' : 'सत्यापित आउटस्टेशन कैब'}
            </span>
            <h2 className="text-base sm:text-lg font-black tracking-tight">
              {language === 'en' ? 'Select Route — Live Cars & Tariffs Update Below' : 'शहर चुनें — सभी गाड़ियां अपने-आप नीचे आ जाएंगी'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 text-xs font-bold px-3.5 py-1.5 rounded-xl border ${
            isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
          }`}>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Pay After Trip · ₹0 Advance</span>
          </div>
        </div>
      </div>

      {/* ELEVATED STANDALONE ROUTE CARD (Login-Style Floating Container, Detached from Cars Below) */}
      <div className={`relative max-w-4xl mx-auto rounded-3xl border shadow-2xl p-5 sm:p-7 md:p-8 mb-14 sm:mb-16 transition-all ${
        isLight
          ? 'bg-white border-slate-200/90 shadow-xl shadow-slate-300/40'
          : 'bg-[#0B1120] border-slate-800 shadow-2xl shadow-black/80'
      }`}>
        {/* Card Header Title */}
        <div className="flex items-center justify-between pb-3.5 mb-5 border-b border-inherit">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-500">
              {language === 'en' ? 'Select Route & Trip Type' : 'रूट एवं यात्रा का प्रकार'}
            </h2>
          </div>
          <span className={`text-[11px] font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {language === 'en' ? 'Tolls & Fuel Included' : 'टोल एवं ईंधन शामिल'}
          </span>
        </div>

        {/* Trip Type Segmented Tabs */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 rounded-2xl border mb-6 ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#04070F] border-slate-800'
        }`}>
          {[
            { type: 'oneway', label: language === 'en' ? 'One Way' : 'वन-वे', icon: Navigation },
            { type: 'roundtrip', label: language === 'en' ? 'Round Trip' : 'राउंड ट्रिप', icon: ArrowLeftRight },
            { type: 'local', label: language === 'en' ? 'Local Hourly' : 'लोकल रेंटल', icon: Car },
            { type: 'airport', label: language === 'en' ? 'Airport Taxi' : 'एयरपोर्ट टैक्सी', icon: Plane },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = tripType === tab.type;
            return (
              <button
                key={tab.type}
                type="button"
                onClick={() => setTripType(tab.type as TripType)}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all cursor-pointer ${
                  isActive
                    ? 'btn-gold shadow-md'
                    : isLight
                      ? 'text-slate-700 hover:text-slate-950 hover:bg-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Icon className="w-4 h-4 stroke-[2.5]" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ROUTE PICKER & CITY SELECTION */}
        {tripType === 'airport' ? (
          <div className="space-y-4">
            <div className="flex gap-5 pb-1 text-xs sm:text-sm font-bold">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#070B14] border-slate-800'}`}>
                <label className="block text-xs font-bold mb-1 opacity-80">Select Airport</label>
                <select
                  value={selectedAirportId}
                  onChange={(e) => setSelectedAirportId(e.target.value)}
                  className={`w-full rounded-lg px-3 py-2 text-xs sm:text-sm font-bold border focus:outline-none ${
                    isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-amber-500' : 'bg-[#0F172A] border-slate-700 text-white focus:border-amber-500'
                  }`}
                >
                  {AIRPORTS_LIST.map((ap) => (
                    <option key={ap.id} value={ap.id}>{ap.name}</option>
                  ))}
                </select>
              </div>

              <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#070B14] border-slate-800'}`}>
                <label className="block text-xs font-bold mb-1 opacity-80">City Hotel / Address</label>
                <input
                  type="text"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="Hotel or area in city"
                  className={`w-full rounded-lg px-3 py-2 text-xs sm:text-sm font-bold border focus:outline-none ${
                    isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-amber-500' : 'bg-[#0F172A] border-slate-700 text-white focus:border-amber-500'
                  }`}
                />
              </div>

              <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#070B14] border-slate-800'}`}>
                <label className="block text-xs font-bold mb-1 opacity-80">Flight Number (Optional)</label>
                <input
                  type="text"
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value)}
                  placeholder="e.g. 6E-2415"
                  className={`w-full rounded-lg px-3 py-2 text-xs sm:text-sm font-bold uppercase border focus:outline-none ${
                    isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-amber-500' : 'bg-[#0F172A] border-slate-700 text-white focus:border-amber-500'
                  }`}
                />
              </div>
            </div>
          </div>
        ) : tripType === 'local' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#070B14] border-slate-800'}`}>
                <label className="block text-xs font-bold mb-1 opacity-80">City for Local Rental</label>
                <select
                  value={pickupCity}
                  onChange={(e) => setPickupCity(e.target.value)}
                  className={`w-full rounded-lg px-3 py-2 text-xs sm:text-sm font-bold border focus:outline-none ${
                    isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-amber-500' : 'bg-[#0F172A] border-slate-700 text-white focus:border-amber-500'
                  }`}
                >
                  <option value="Varanasi">Varanasi</option>
                  <option value="Ayodhya">Ayodhya</option>
                  <option value="Prayagraj (Allahabad)">Prayagraj (Allahabad)</option>
                  <option value="Lucknow">Lucknow</option>
                </select>
              </div>

              <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#070B14] border-slate-800'}`}>
                <label className="block text-xs font-bold mb-1 opacity-80">Pickup Hotel / Area</label>
                <input
                  type="text"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="Hotel lobby or landmark"
                  className={`w-full rounded-lg px-3 py-2 text-xs sm:text-sm font-bold border focus:outline-none ${
                    isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-amber-500' : 'bg-[#0F172A] border-slate-700 text-white focus:border-amber-500'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5 opacity-80">Rental Package</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { key: '4h_40km', label: '4 Hours / 40 KM', desc: 'Short city ride' },
                  { key: '8h_80km', label: '8 Hours / 80 KM', desc: 'Full City Darshan' },
                  { key: '12h_120km', label: '12 Hours / 120 KM', desc: 'Extended sightseeing' },
                ].map((pkg) => (
                  <button
                    key={pkg.key}
                    type="button"
                    onClick={() => setLocalPackage(pkg.key as any)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      localPackage === pkg.key
                        ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/50'
                        : isLight ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100' : 'bg-[#070B14] border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-extrabold text-xs sm:text-sm">{pkg.label}</div>
                    <div className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{pkg.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Outstation Route Chooser */
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 relative">
              {/* From City Box */}
              <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                isLight
                  ? 'bg-slate-50 border-slate-300 focus-within:border-amber-500 focus-within:bg-white focus-within:shadow-md'
                  : 'bg-[#070B14] border-slate-800 focus-within:border-amber-500 focus-within:bg-[#0B1120]'
              }`}>
                <label className="text-xs font-black text-amber-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <MapPin className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{language === 'en' ? 'From' : 'कहाँ से'}</span>
                </label>

                <input
                  type="text"
                  list="all-cities-datalist"
                  value={pickupCity}
                  onChange={(e) => setPickupCity(e.target.value)}
                  placeholder={language === 'en' ? 'Enter city (e.g. Varanasi, Lucknow)' : 'शहर का नाम (उदा. वाराणसी)'}
                  className="w-full bg-transparent text-base sm:text-lg font-black placeholder-slate-400 focus:outline-none pt-0.5"
                />
                {formErrors.pickupCity && <p className="text-red-500 text-xs font-bold mt-1.5">{formErrors.pickupCity}</p>}
              </div>

              {/* Swap Button (Gold Circular Badge) */}
              <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <button
                  type="button"
                  onClick={handleSwapLocations}
                  className="w-11 h-11 rounded-full btn-gold flex items-center justify-center shadow-xl shadow-amber-500/40 cursor-pointer transition-all hover:rotate-180 hover:scale-110 active:scale-95"
                  title="Swap Cities"
                >
                  <ArrowLeftRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              {/* To City Box */}
              <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                isLight
                  ? 'bg-slate-50 border-slate-300 focus-within:border-emerald-600 focus-within:bg-white focus-within:shadow-md'
                  : 'bg-[#070B14] border-slate-800 focus-within:border-emerald-500 focus-within:bg-[#0B1120]'
              }`}>
                <label className="text-xs font-black text-emerald-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <MapPin className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{language === 'en' ? 'To' : 'कहाँ तक'}</span>
                </label>

                <input
                  type="text"
                  list="all-cities-datalist"
                  value={dropCity}
                  onChange={(e) => setDropCity(e.target.value)}
                  placeholder={language === 'en' ? 'Enter destination (e.g. Ayodhya, Delhi)' : 'गंतव्य शहर (उदा. अयोध्या)'}
                  className="w-full bg-transparent text-base sm:text-lg font-black placeholder-slate-400 focus:outline-none pt-0.5"
                />
                {formErrors.dropCity && <p className="text-red-500 text-xs font-bold mt-1.5">{formErrors.dropCity}</p>}
              </div>

              {/* Complete 70+ Cities Datalist */}
              <datalist id="all-cities-datalist">
                {CITIES_LIST.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            {/* Clean Minimal Route Status Line (No heavy banners or crowded chips) */}
            {isBothCitiesSelected && (
              <div className={`mt-4 pt-3.5 border-t flex flex-wrap items-center justify-between gap-3 text-xs ${
                isLight ? 'border-slate-200 text-slate-700' : 'border-slate-800/80 text-slate-300'
              }`}>
                <div className="flex items-center gap-2 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{pickupCity} → {dropCity}</span>
                  <span className="text-amber-500 font-mono font-bold">(~{fareResult.estimatedDistanceKm} KM)</span>
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  Tolls &amp; Fuel Included · Zero Advance
                </span>
              </div>
            )}
          </div>
        )}
      </div>



      {/* AUTOMATIC LIVE CARS SECTION (Recalculates automatically as soon as route is set!) */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-black flex items-center gap-2.5">
              <Car className="w-5 h-5 text-amber-500 stroke-[2.5]" />
              <span>
                {language === 'en'
                  ? `Available Cabs for ${pickupCity} → ${tripType === 'local' ? 'Local City' : dropCity}`
                  : `${pickupCity} से ${dropCity} के लिए उपलब्ध गाड़ियां`}
              </span>
            </h3>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Click &quot;Select &amp; Book&quot; on any cab to open the quick 3-field reservation popup.
            </p>
          </div>

          <span className={`text-xs font-extrabold flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
            isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
          }`}>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Real Calculated Tariffs</span>
          </span>
        </div>

        {/* 2-3 COLUMN RESPONSIVE CAR CARDS GRID (Fits 2 to 3 cars across with landscape horizontal images) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {VEHICLES.map((v) => {
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
                      ? 'bg-amber-50/40 border-amber-500 ring-2 ring-amber-500 shadow-2xl scale-[1.01]'
                      : 'bg-[#111A2E] border-amber-400 ring-2 ring-amber-400/80 shadow-2xl scale-[1.01]'
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

                  {/* Car Details with Compact, Clean Formatting (No extra Toll+Fuel line) */}
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
                <div className={`py-3 px-4 sm:px-4.5 border-t flex items-center justify-between gap-3 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#04070F] border-slate-800'
                }`}>
                  <div>
                    <span className={`text-[9px] uppercase tracking-wider font-bold block leading-tight ${
                      isLight ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      All-Inclusive
                    </span>
                    {/* Compact Emerald Price */}
                    <div className="text-lg sm:text-xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
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
        title={language === 'en' ? `Connecting with ${loadingCarName || selectedVehicle.name}...` : `${loadingCarName || selectedVehicle.name} तैयार हो रही है...`}
        subtitle={language === 'en' ? `Verifying chauffeur route & inclusions for ${pickupCity} → ${tripType === 'local' ? 'Local' : dropCity}` : `${pickupCity} से ${dropCity} के लिए रूट और कैब की पुष्टि की जा रही है`}
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
