import React, { useState, useEffect } from 'react';
import { 
  Search, 
  X, 
  Car, 
  Calendar, 
  Clock, 
  MapPin, 
  Navigation,
  Phone, 
  MessageSquare, 
  AlertCircle, 
  Trash2,
  Copy, 
  Check, 
  ShieldCheck,
  UserCheck,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { Booking } from '../types/cab';
import { getBookingsFromStorage, findBooking, generateWhatsAppLink, deleteBookingFromStorage } from '../utils/fareCalculator';
import { COMPANY_PHONE } from '../data/cabsData';

interface TrackBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBookingId?: string;
  language: 'en' | 'hi';
  theme?: 'dark' | 'light';
}

export const TrackBookingModal: React.FC<TrackBookingModalProps> = ({
  isOpen,
  onClose,
  initialBookingId,
  language,
  theme = 'dark',
}) => {
  const [searchQuery, setSearchQuery] = useState(initialBookingId || '');
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [searchedBooking, setSearchedBooking] = useState<Booking | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);

  const isLight = theme === 'light' || (typeof document !== 'undefined' && document.documentElement.classList.contains('light'));

  const handleCopyId = () => {
    if (!searchedBooking) return;
    navigator.clipboard.writeText(searchedBooking.bookingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (isOpen) {
      const stored = getBookingsFromStorage();
      setRecentBookings(stored);
      if (initialBookingId) {
        const found = findBooking(initialBookingId);
        if (found) {
          setSearchedBooking(found);
          setSearchQuery(initialBookingId);
          setNotFound(false);
          setConfirmDelete(false);
          return;
        }
      }
      if (stored.length > 0) {
        setSearchedBooking(stored[0]);
      }
      setConfirmDelete(false);
    }
  }, [isOpen, initialBookingId]);

  const handleDeleteCurrent = () => {
    if (!searchedBooking) return;
    deleteBookingFromStorage(searchedBooking.bookingId);
    const updated = recentBookings.filter(b => b.bookingId !== searchedBooking.bookingId);
    setRecentBookings(updated);
    setSearchedBooking(updated.length > 0 ? updated[0] : null);
    setConfirmDelete(false);
  };

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const result = findBooking(searchQuery);
    if (result) {
      setSearchedBooking(result);
      setNotFound(false);
    } else {
      setSearchedBooking(null);
      setNotFound(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      {/* 100% Fitted Voucher Folio Modal - Perfectly sized for Mobile & Desktop */}
      <div className={`relative w-full max-w-[480px] max-h-[92vh] flex flex-col rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border my-auto transition-all ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/60'
          : 'bg-[#0B1324] border-slate-800 text-white shadow-black/90'
      }`}>
        {/* Sticky Header */}
        <div className={`px-4 py-3 border-b flex items-center justify-between shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#070D1A] border-slate-800'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0">
              <Search className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-black truncate">
                {language === 'en' ? 'Live Booking Folio & PNR Tracker' : 'लाइव बुकिंग स्टेटस व ट्रैकर'}
              </h3>
              <p className={`text-[10px] sm:text-[11px] truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {language === 'en' ? 'Real-time dispatch & chauffeur assignment' : 'सत्यापित कैब व ड्राइवर आवंटन स्थिति'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ml-2 ${
              isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Compact Search Bar with 10-digit mobile or PNR input */}
        <form onSubmit={handleSearch} className={`px-3 sm:px-4 py-2.5 border-b shrink-0 ${
          isLight ? 'bg-slate-100/70 border-slate-200' : 'bg-[#060A14] border-slate-800/80'
        }`}>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className={`w-3.5 h-3.5 absolute left-3 top-3 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d+$/.test(val)) {
                    setSearchQuery(val.slice(0, 10));
                  } else {
                    setSearchQuery(val);
                  }
                }}
                maxLength={20}
                placeholder={language === 'en' ? "Enter 10-digit mobile or PNR..." : "10-अंकों का मोबाइल या PNR..."}
                style={{
                  color: isLight ? '#090D16' : '#FFFFFF',
                  WebkitTextFillColor: searchQuery ? (isLight ? '#090D16' : '#FFFFFF') : undefined,
                  backgroundColor: 'transparent'
                }}
                className={`w-full rounded-xl pl-8 pr-3 py-2 text-xs font-black placeholder:font-normal placeholder:opacity-40 transition-colors focus:outline-none ${
                  isLight
                    ? 'bg-white border border-slate-300 text-slate-950 placeholder:text-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20'
                    : 'bg-[#0F172A] border border-slate-700 text-white placeholder-slate-500 focus:border-amber-500'
                }`}
              />
              {searchQuery.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              type="submit"
              className="btn-gold px-4 py-2 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              {language === 'en' ? 'Track' : 'खोजें'}
            </button>
          </div>

          {/* Quick Recent Booking Chips Switcher (if multiple exist) */}
          {recentBookings.length > 1 && (
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-0.5 scrollbar-none">
              <span className={`text-[9.5px] font-bold shrink-0 uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {language === 'en' ? 'Saved:' : 'सेव्ड:'}
              </span>
              {recentBookings.map((b) => {
                const isSelected = searchedBooking?.bookingId === b.bookingId;
                return (
                  <button
                    key={b.bookingId}
                    type="button"
                    onClick={() => {
                      setSearchedBooking(b);
                      setSearchQuery(b.bookingId);
                      setNotFound(false);
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold shrink-0 transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                        : isLight
                          ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-200'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {b.bookingId.split('-').slice(-2).join('-')}
                  </button>
                );
              })}
            </div>
          )}
        </form>

        {/* Scrollable Content Body */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-3 flex-1 scrollbar-none">
          {notFound && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-500 flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-xs sm:text-sm block">
                  {language === 'en' ? 'No reservation found' : 'कोई बुकिंग रिकॉर्ड नहीं मिला'}
                </span>
                <span className="text-[11px] opacity-90 block mt-0.5">
                  {language === 'en'
                    ? `Please verify your 10-digit mobile or booking PNR. For instant lookup, call 24/7 desk at ${COMPANY_PHONE}.`
                    : `कृपया 10 अंकों का मोबाइल या PNR चेक करें। सहायता के लिए हमारे 24/7 डेस्क ${COMPANY_PHONE} पर कॉल करें।`}
                </span>
              </div>
            </div>
          )}

          {searchedBooking && (
            <div className="space-y-3">
              {/* TOP VOUCHER STRIP: PNR, TRIP TYPE & STATUS */}
              <div className={`p-3 rounded-2xl border flex items-center justify-between gap-2 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#070D1A] border-slate-800'
              }`}>
                <div>
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">
                    {language === 'en' ? 'Booking PNR Folio' : 'बुकिंग रेफरेंस नंबर'}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono font-black text-amber-500 text-sm sm:text-base tracking-tight">
                      {searchedBooking.bookingId}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="p-1 rounded text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
                      title="Copy PNR"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-500 border border-amber-500/30">
                    {searchedBooking.tripType === 'oneway' ? 'One Way' : searchedBooking.tripType === 'roundtrip' ? 'Round Trip' : 'Local Hourly'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-lg text-[9.5px] font-black flex items-center gap-1 border ${
                    searchedBooking.status === 'completed'
                      ? 'bg-blue-500/15 text-blue-500 border-blue-500/30'
                      : searchedBooking.driverName
                        ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse shrink-0" />
                    <span>
                      {searchedBooking.status === 'completed'
                        ? 'Completed'
                        : searchedBooking.driverName
                          ? 'Driver Assigned'
                          : 'In Dispatch'}
                    </span>
                  </span>
                </div>
              </div>

              {/* LIVE TRACKING TIMELINE: "ABHI KYA HO RAHA HAI" */}
              <div className={`p-3 rounded-2xl border ${
                isLight ? 'bg-amber-50/70 border-amber-200 text-amber-950' : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
                    <span>{language === 'en' ? 'Live Status Timeline' : 'लाइव स्थिति: अभी आपकी बुकिंग का क्या हो रहा है?'}</span>
                  </span>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
                    {searchedBooking.status === 'completed' ? 'TRIP COMPLETED' : 'IN REAL-TIME'}
                  </span>
                </div>

                {/* 4-Step Connected Progress Bar */}
                <div className="relative py-1">
                  {/* Background connecting bar */}
                  <div className="absolute top-3 left-4 right-4 h-0.5 bg-slate-300 dark:bg-slate-700 -z-0" />
                  <div 
                    className="absolute top-3 left-4 h-0.5 bg-emerald-500 transition-all duration-500 -z-0"
                    style={{
                      width: searchedBooking.status === 'completed'
                        ? 'calc(100% - 2rem)'
                        : searchedBooking.driverName
                          ? '40%'
                          : '15%'
                    }}
                  />

                  <div className="grid grid-cols-4 gap-1 text-center relative z-10">
                    {/* Step 1: Confirmed */}
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-[10px] shadow-sm">
                        ✓
                      </div>
                      <span className="text-[8.5px] font-bold mt-1 text-emerald-600 dark:text-emerald-400">Confirmed</span>
                    </div>

                    {/* Step 2: Driver Assigned */}
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shadow-sm ${
                        searchedBooking.driverName
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-amber-500 text-slate-950 ring-2 ring-amber-400 animate-pulse'
                      }`}>
                        {searchedBooking.driverName ? '✓' : '⚡'}
                      </div>
                      <span className="text-[8.5px] font-bold mt-1 text-amber-600 dark:text-amber-400">
                        {searchedBooking.driverName ? 'Assigned' : 'Allocating'}
                      </span>
                    </div>

                    {/* Step 3: En Route */}
                    <div className={`flex flex-col items-center ${searchedBooking.status === 'completed' ? 'opacity-100' : 'opacity-60'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shadow-sm ${
                        searchedBooking.status === 'completed' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {searchedBooking.status === 'completed' ? '✓' : '🚗'}
                      </div>
                      <span className="text-[8.5px] font-medium mt-1">En Route</span>
                    </div>

                    {/* Step 4: Completed */}
                    <div className={`flex flex-col items-center ${searchedBooking.status === 'completed' ? 'opacity-100' : 'opacity-60'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shadow-sm ${
                        searchedBooking.status === 'completed' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                      }`}>
                        🏁
                      </div>
                      <span className="text-[8.5px] font-medium mt-1">Completed</span>
                    </div>
                  </div>
                </div>

                <p className={`text-[10.5px] leading-relaxed pt-2 mt-1 border-t ${
                  isLight ? 'border-amber-200/80 text-slate-700' : 'border-amber-500/20 text-slate-300'
                }`}>
                  {searchedBooking.status === 'completed'
                    ? (language === 'en'
                        ? 'Trip completed successfully. Thank you for traveling with TripWithCar!'
                        : 'यह यात्रा सफलतापूर्वक पूरी हो चुकी है। TripWithCar चुनने के लिए धन्यवाद!')
                    : searchedBooking.driverName
                      ? (language === 'en'
                          ? `Senior chauffeur ${searchedBooking.driverName} is assigned and will report at your pickup point at scheduled time.`
                          : `गाड़ी व ड्राइवर असाइन हो चुके हैं (${searchedBooking.driverName})। ड्राइवर नियत समय पर पिकअप लोकेशन पर पहुंचेंगे।`)
                      : (language === 'en'
                          ? 'Your booking is confirmed. Nearest verified chauffeur and vehicle number are being dispatched to your WhatsApp/SMS before pickup.'
                          : 'आपकी बुकिंग कन्फर्म है। हमारा कंट्रोल रूम सबसे नज़दीकी सत्यापित कैब व ड्राइवर असाइन कर रहा है। पिकअप से पूर्व आपको WhatsApp/SMS पर विवरण प्राप्त हो जाएगा।')}
                </p>
              </div>

              {/* ASSIGNED CHAUFFEUR & CAB CARD (if assigned) */}
              {searchedBooking.driverName ? (
                <div className={`p-3 rounded-2xl border ${
                  isLight ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950' : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-100'
                }`}>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-bold text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'Assigned Chauffeur & Vehicle' : 'असाइन ड्राइवर व गाड़ी'}</span>
                    </span>
                    {searchedBooking.vehicleNumber && (
                      <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-amber-400 text-slate-950 shadow-xs border border-amber-500">
                        {searchedBooking.vehicleNumber}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-0.5">
                    <div>
                      <div className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                        {searchedBooking.driverName}
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 font-mono mt-0.5">
                        Ph: {searchedBooking.driverPhone}
                      </div>
                    </div>

                    <a
                      href={`tel:${searchedBooking.driverPhone}`}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'Call Driver' : 'ड्राइवर को कॉल'}</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#070D1A] border-slate-800 text-slate-300'
                }`}>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-[10.5px]">
                      {language === 'en' ? 'Chauffeur allocation in progress · Zero Advance' : 'ड्राइवर आवंटन जारी है · कोई एडवांस नहीं'}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wide">
                    24/7 Desk
                  </span>
                </div>
              )}

              {/* ROUTE & ITINERARY DETAILS (Clean Journey Layout) */}
              <div className={`p-3 rounded-2xl border space-y-2.5 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#070D1A] border-slate-800'
              }`}>
                {/* Pickup and Drop Journey Map */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-3 h-3 stroke-[2.5]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">From (Pickup City &amp; Address)</span>
                      <div className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                        {searchedBooking.pickupCity}
                      </div>
                      <p className="text-[10.5px] text-slate-500 truncate mt-0.5">
                        {searchedBooking.pickupAddress || 'City Center / Home Pickup'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 pt-1.5 border-t border-slate-200 dark:border-slate-800">
                    <div className="w-5 h-5 rounded-full bg-red-500/15 border border-red-500 text-red-500 flex items-center justify-center shrink-0 mt-0.5">
                      <Navigation className="w-3 h-3 stroke-[2.5]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">To (Destination / Drop Point)</span>
                      <div className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                        {searchedBooking.dropCity}
                      </div>
                      <p className="text-[10.5px] text-slate-500 truncate mt-0.5">
                        {searchedBooking.dropAddress || 'Destination City / Hotel'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Schedule, Vehicle & Passenger Grid */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-[10.5px]">
                  <div className="space-y-0.5">
                    <span className="text-[8.5px] uppercase font-bold text-slate-400 block">Date &amp; Time</span>
                    <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-white">
                      <Calendar className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>{searchedBooking.pickupDate}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500 font-medium">
                      <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>{searchedBooking.pickupTime}</span>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[8.5px] uppercase font-bold text-slate-400 block">Selected Car</span>
                    <div className="font-bold truncate text-slate-900 dark:text-white flex items-center gap-1">
                      <Car className="w-3 h-3 text-amber-500 shrink-0" />
                      <span className="truncate">{searchedBooking.vehicle.name}</span>
                    </div>
                    <span className="text-[9.5px] text-slate-500 block truncate">
                      {searchedBooking.vehicle.seats} Seats · AC Guaranteed
                    </span>
                  </div>
                </div>

                {/* Passenger row */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10.5px]">
                  <span className="text-slate-500">
                    Passenger: <strong className="text-slate-900 dark:text-white">{searchedBooking.passengerName}</strong>
                  </span>
                  <span className="font-mono text-slate-500 font-bold">{searchedBooking.passengerPhone}</span>
                </div>
              </div>

              {/* TARIFF & INCLUSIONS STRIP */}
              <div className={`p-2.5 rounded-2xl border flex items-center justify-between ${
                isLight ? 'bg-emerald-50/60 border-emerald-200' : 'bg-emerald-950/20 border-emerald-500/30'
              }`}>
                <div>
                  <span className="text-[8.5px] uppercase font-bold text-slate-400 block">Total Tariff</span>
                  <span className="text-base sm:text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                    ₹{searchedBooking.totalFare}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black block">
                    Tolls &amp; Fuel Included
                  </span>
                  <span className="text-[9px] text-slate-500 block">
                    Zero Advance · Pay Driver Post-Ride
                  </span>
                </div>
              </div>

              {/* ACTION BUTTONS (WhatsApp & Helpline) */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={generateWhatsAppLink(searchedBooking)}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp Details</span>
                </a>

                <a
                  href={`tel:${COMPANY_PHONE.replace(/\s+/g, '')}`}
                  className="btn-gold py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <Phone className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Call Helpline</span>
                </a>
              </div>

              {/* CANCEL / DELETE RESERVATION */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                {confirmDelete ? (
                  <div className="w-full flex items-center justify-between p-2 rounded-xl bg-red-500/10 border border-red-500/30">
                    <span className="text-[10px] font-bold text-red-500">Cancel this reservation?</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDeleteCurrent}
                        className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-[10.5px] cursor-pointer"
                      >
                        Confirm Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="px-2 py-1 text-slate-400 hover:text-slate-200 cursor-pointer text-[10.5px]"
                      >
                        Back
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="text-[10px] text-red-500 hover:text-red-400 flex items-center gap-1 font-semibold cursor-pointer py-0.5"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Cancel Reservation</span>
                  </button>
                )}

                <span className="text-[9px] text-slate-400">
                  Booked: {new Date(searchedBooking.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}

          {/* Stored Recent Bookings history (when no booking active or searching) */}
          {recentBookings.length > 0 && !searchedBooking && !notFound && (
            <div className="space-y-2">
              <span className={`text-xs font-bold block ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Recent Bookings in this Device:
              </span>
              {recentBookings.map((b) => (
                <div
                  key={b.bookingId}
                  onClick={() => setSearchedBooking(b)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-colors flex items-center justify-between ${
                    isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-[#090D16] hover:bg-slate-800 border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5 font-mono font-bold text-amber-500">
                      <span>{b.bookingId}</span>
                      <span className="text-[9px] font-sans px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        {b.tripType}
                      </span>
                    </div>
                    <div className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      {b.pickupCity} → {b.dropCity} · {b.pickupDate}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">₹{b.totalFare}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 ml-auto mt-0.5" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
