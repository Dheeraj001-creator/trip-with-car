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
  Compass,
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import { Booking } from '../types/cab';
import { 
  getBookingsFromStorage, 
  findBooking, 
  findBookingAsync, 
  generateWhatsAppLink, 
  deleteBookingFromStorage 
} from '../utils/fareCalculator';
import { COMPANY_PHONE } from '../data/cabsData';

interface TrackBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBookingId?: string;
  language: 'en' | 'hi';
  theme?: 'dark' | 'light';
}

const getStageIndex = (b: Booking): number => {
  if (b.status === 'completed' || b.tripStage === 'completed') return 5;
  if (b.tripStage === 'ongoing') return 4;
  if (b.tripStage === 'arrived') return 3;
  if (b.tripStage === 'enroute') return 2;
  if (b.tripStage === 'assigned' || b.driverName) return 1;
  return 0; // 'received'
};

const getLiveStatusDescription = (b: Booking, stageIdx: number, lang: 'en' | 'hi') => {
  if (b.currentLocationNote) return b.currentLocationNote;
  switch (stageIdx) {
    case 5:
      return lang === 'en'
        ? `Trip successfully completed and received at ${b.dropCity || 'Destination'}. Thank you for traveling with TravelCap!`
        : `यात्रा सफलतापूर्वक संपन्न हुई! गंतव्य (${b.dropCity || 'गंतव्य'}) पर सुरक्षित पहुंचा दिया गया है। TravelCap चुनने के लिए धन्यवाद!`;
    case 4:
      return lang === 'en'
        ? `Live on Highway: Cab is currently in transit from ${b.pickupCity} towards ${b.dropCity || 'Destination'}. Safe & air-conditioned ride in progress.`
        : `सफर जारी है: कैब ${b.pickupCity} से ${b.dropCity || 'गंतव्य'} की ओर हाईवे पर चल रही है। एसी ऑन एवं सुरक्षित यात्रा।`;
    case 3:
      return lang === 'en'
        ? `Cab has arrived at your pickup point (${b.pickupAddress || b.pickupCity})! Chauffeur is waiting to welcome you.`
        : `कैब पिकअप स्थान पर पहुंच चुकी है (${b.pickupAddress || b.pickupCity})! ड्राइवर पिकअप पर आपका इंतजार कर रहे हैं।`;
    case 2:
      return lang === 'en'
        ? `Driver is en route towards ${b.pickupAddress || b.pickupCity}. Estimated arrival: 10-15 mins.`
        : `ड्राइवर पिकअप लोकेशन (${b.pickupAddress || b.pickupCity}) के लिए निकल चुके हैं। लगभग 10-15 मिनट में पहुंच रहे हैं।`;
    case 1:
      return lang === 'en'
        ? `Senior Chauffeur ${b.driverName || 'Assigned'} with ${b.vehicleNumber || 'Cab'} is allocated. Vehicle is prepped for your trip.`
        : `ड्राइवर ${b.driverName || 'असाइन'} एवं गाड़ी ${b.vehicleNumber || ''} आवंटित कर दी गई है।`;
    case 0:
    default:
      return lang === 'en'
        ? `Booking received & confirmed at Central Dispatch Hub. Nearest senior chauffeur is being assigned.`
        : `बुकिंग प्राप्त व कन्फर्म हो चुकी है। कंट्रोल रूम से सबसे नज़दीकी कैब व ड्राइवर असाइन किया जा रहा है।`;
  }
};

export const TrackBookingModal: React.FC<TrackBookingModalProps> = ({
  isOpen,
  onClose,
  initialBookingId,
  language,
  theme = 'dark',
}) => {
  const [searchQuery, setSearchQuery] = useState(initialBookingId || '');
  const [searchedBooking, setSearchedBooking] = useState<Booking | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'driver' | 'stages' | 'route' | 'fare'>('driver');

  const isLight = theme === 'light' || (typeof document !== 'undefined' && document.documentElement.classList.contains('light'));

  const handleCopyId = () => {
    if (!searchedBooking) return;
    navigator.clipboard.writeText(searchedBooking.bookingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Clean initialization: strictly do not auto-select previous bookings on blank open
  useEffect(() => {
    if (isOpen) {
      if (initialBookingId) {
        setSearchQuery(initialBookingId);
        setIsSearching(true);
        findBookingAsync(initialBookingId).then(found => {
          setIsSearching(false);
          if (found) {
            setSearchedBooking(found);
            setNotFound(false);
          } else {
            setSearchedBooking(null);
            setNotFound(true);
          }
        });
      } else {
        setSearchedBooking(null);
        setSearchQuery('');
        setNotFound(false);
        setConfirmDelete(false);
      }
    }
  }, [isOpen, initialBookingId]);

  // Listen for real-time stage updates from dashboard
  useEffect(() => {
    const handleStorageUpdate = () => {
      if (searchedBooking) {
        findBookingAsync(searchedBooking.bookingId).then(refreshed => {
          if (refreshed) {
            setSearchedBooking(refreshed);
          }
        });
      }
    };

    window.addEventListener('twc_bookings_updated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.removeEventListener('twc_bookings_updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [searchedBooking]);

  const handleDeleteCurrent = () => {
    if (!searchedBooking) return;
    deleteBookingFromStorage(searchedBooking.bookingId);
    setSearchedBooking(null);
    setConfirmDelete(false);
    setSearchQuery('');
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = searchQuery.trim();
    if (!clean) return;

    setIsSearching(true);
    setNotFound(false);
    try {
      const result = await findBookingAsync(clean);
      if (result) {
        setSearchedBooking(result);
        setNotFound(false);
        setActiveTab('driver');
      } else {
        setSearchedBooking(null);
        setNotFound(true);
      }
    } catch {
      setSearchedBooking(null);
      setNotFound(true);
    } finally {
      setIsSearching(false);
    }
  };

  if (!isOpen) return null;

  const stageIdx = searchedBooking ? getStageIndex(searchedBooking) : 0;
  const stageSteps = [
    { id: 'received', label: 'Received', labelHi: 'बुकिंग मिली', icon: '✓' },
    { id: 'assigned', label: 'Assigned', labelHi: 'गाड़ी तय', icon: '👤' },
    { id: 'enroute', label: 'En Route', labelHi: 'ड्राइवर निकला', icon: '🚗' },
    { id: 'arrived', label: 'Arrived', labelHi: 'पहुंची कैब', icon: '📍' },
    { id: 'ongoing', label: 'In Transit', labelHi: 'सफर जारी', icon: '⚡' },
    { id: 'completed', label: 'Completed', labelHi: 'पूरी हुई', icon: '🏁' },
  ];
  const progressPcts = [16, 33, 50, 68, 85, 100];
  const activePct = progressPcts[stageIdx];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      {/* 100% Fitted Voucher Folio Modal - Zero Excessive Scrolling on Mobile */}
      <div className={`relative w-full max-w-[490px] max-h-[92vh] flex flex-col rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border my-auto transition-all ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/60'
          : 'bg-[#0B1324] border-slate-800 text-white shadow-black/90'
      }`}>
        {/* Top Header Bar */}
        <div className={`px-4 py-3 border-b flex items-center justify-between shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#070D1A] border-slate-800'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-black truncate">
                {language === 'en' ? 'Track Reservation' : 'ट्रैक रिजर्वेशन (Live PNR)'}
              </h3>
              <p className={`text-[10px] sm:text-[11px] truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {language === 'en' ? 'Central Dispatch & Chauffeur Status' : 'गाड़ी व ड्राइवर की लाइव स्थिति'}
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

        {/* Search Bar - Enter Booking PNR or Mobile Number */}
        <form onSubmit={handleSearch} className={`px-3 sm:px-4 py-2.5 border-b shrink-0 ${
          isLight ? 'bg-slate-100/70 border-slate-200' : 'bg-[#060A14] border-slate-800/80'
        }`}>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className={`w-3.5 h-3.5 absolute left-3 top-3 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                maxLength={25}
                placeholder={language === 'en' ? "Enter Track ID / PNR or Mobile No..." : "ट्रैक नंबर (PNR) या मोबाइल नंबर दर्ज करें..."}
                className={`w-full rounded-xl pl-8 pr-8 py-2 text-xs font-black placeholder:font-normal placeholder:opacity-50 transition-colors focus:outline-none ${
                  isLight
                    ? 'bg-white border border-slate-300 text-slate-950 placeholder:text-slate-400 focus:border-amber-500'
                    : 'bg-[#0F172A] border border-slate-700 text-white placeholder-slate-500 focus:border-amber-500'
                }`}
              />
              {searchQuery.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchedBooking(null);
                    setNotFound(false);
                  }}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="btn-gold px-4 py-2 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
            >
              {isSearching ? (language === 'en' ? 'Checking...' : 'खोज रहे हैं...') : (language === 'en' ? 'Track' : 'खोजें')}
            </button>
          </div>
        </form>

        {/* Content Body */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-3 flex-1 scrollbar-none">
          {/* STATE 1: Welcoming search prompt when no ID entered yet */}
          {!searchedBooking && !notFound && (
            <div className={`p-6 sm:p-8 rounded-2xl border text-center space-y-3 ${
              isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-[#070D1A] border-slate-800'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto shadow-sm">
                <Compass className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="max-w-sm mx-auto">
                <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {language === 'en' ? 'Enter Track ID to Open Reservation' : 'बुकिंग रिकॉर्ड देखने के लिए ट्रैक नंबर डालें'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {language === 'en'
                    ? 'Type your Booking PNR (e.g. TWC-2026-XXXX) or registered 10-digit mobile number above and press Track.'
                    : 'कृपया ऊपर अपना ट्रैक नंबर (उदा. TWC-2026-XXXX) या 10 अंकों का मोबाइल नंबर दर्ज करें और खोजें पर क्लिक करें।'}
                </p>
              </div>
            </div>
          )}

          {/* STATE 2: Not Found Message */}
          {notFound && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-500 flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-xs sm:text-sm block">
                  {language === 'en' ? 'No reservation found' : 'कोई बुकिंग रिकॉर्ड नहीं मिला'}
                </span>
                <span className="text-[11px] opacity-90 block mt-0.5">
                  {language === 'en'
                    ? `Please check your booking ID or mobile number. For instant verification, call our 24/7 desk: ${COMPANY_PHONE}.`
                    : `कृपया अपना ट्रैक नंबर या मोबाइल नंबर जांचें। तत्काल सहायता के लिए हमारे 24/7 हेल्पडेस्क ${COMPANY_PHONE} पर संपर्क करें।`}
                </span>
              </div>
            </div>
          )}

          {/* STATE 3: BOOKING RECORD FOUND - 4 CLEAN COMPACT SECTIONS */}
          {searchedBooking && (
            <div className="space-y-3">
              {/* TOP VOUCHER STRIP: PNR, TRIP TYPE & STATUS */}
              <div className={`p-3 rounded-2xl border flex items-center justify-between gap-2 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#070D1A] border-slate-800'
              }`}>
                <div>
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">
                    {language === 'en' ? 'Booking PNR / Track ID' : 'बुकिंग ट्रैक नंबर (PNR)'}
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
                    <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
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

              {/* 4 CLEAN COMPACT SECTION TABS (ZERO EXCESSIVE SCROLLING) */}
              <div className={`grid grid-cols-4 gap-1 p-1 rounded-xl border ${
                isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#060A14] border-slate-800'
              }`}>
                <button
                  type="button"
                  onClick={() => setActiveTab('driver')}
                  className={`py-1.5 px-1 rounded-lg text-[11px] font-black flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    activeTab === 'driver'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UserCheck className="w-3 h-3 shrink-0" />
                  <span className="truncate">{language === 'en' ? 'Driver' : 'ड्राइवर'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('stages')}
                  className={`py-1.5 px-1 rounded-lg text-[11px] font-black flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    activeTab === 'stages'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Compass className="w-3 h-3 shrink-0" />
                  <span className="truncate">{language === 'en' ? 'Stages' : 'चरण'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('route')}
                  className={`py-1.5 px-1 rounded-lg text-[11px] font-black flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    activeTab === 'route'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{language === 'en' ? 'Route' : 'रूट'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('fare')}
                  className={`py-1.5 px-1 rounded-lg text-[11px] font-black flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    activeTab === 'fare'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Phone className="w-3 h-3 shrink-0" />
                  <span className="truncate">{language === 'en' ? 'Fare' : 'किराया'}</span>
                </button>
              </div>

              {/* SECTION 1: DRIVER & LIVE STATUS (HIGHLIGHTED FIRST) */}
              {activeTab === 'driver' && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  {/* ASSIGNED CHAUFFEUR & CAB CARD */}
                  {searchedBooking.driverName ? (
                    <div className={`p-3.5 rounded-2xl border ${
                      isLight 
                        ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 shadow-xs' 
                        : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-100'
                    }`}>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-bold text-[10.5px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4" />
                          <span>{language === 'en' ? 'Assigned Chauffeur & Vehicle' : 'आवंटित ड्राइवर व गाड़ी की जानकारी'}</span>
                        </span>
                        {searchedBooking.vehicleNumber && (
                          <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-amber-400 text-slate-950 shadow-xs border border-amber-500">
                            {searchedBooking.vehicleNumber}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-1">
                        <div>
                          <div className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                            {searchedBooking.driverName}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-300 font-mono mt-0.5">
                            Mobile: +91 {searchedBooking.driverPhone}
                          </div>
                          <div className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5 font-bold">
                            ✓ Verified Commercial Chauffeur
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <a
                            href={`tel:${searchedBooking.driverPhone || COMPANY_PHONE}`}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>{language === 'en' ? 'Call Driver' : 'कॉल करें'}</span>
                          </a>

                          <a
                            href={`https://wa.me/91${(searchedBooking.driverPhone || COMPANY_PHONE).replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${searchedBooking.driverName}, I am ${searchedBooking.passengerName}. Track ID: ${searchedBooking.bookingId} for ride from ${searchedBooking.pickupCity} to ${searchedBooking.dropCity || 'destination'}.`)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1 rounded-lg border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 text-[10.5px] font-bold flex items-center justify-center gap-1 transition-all"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                      isLight ? 'bg-amber-50/70 border-amber-200 text-amber-900' : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
                        <div>
                          <span className="font-bold block text-xs">
                            {language === 'en' ? 'Chauffeur allocation in progress' : 'ड्राइवर व कैब आवंटन प्रक्रिया जारी'}
                          </span>
                          <span className="text-[10.5px] text-slate-500 dark:text-slate-400">
                            {language === 'en' ? 'Central dispatch is assigning your nearest senior chauffeur.' : 'कंट्रोल रूम से निकटतम कैब और ड्राइवर असाइन किया जा रहा है।'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Live Status Note */}
                  <div className={`p-3 rounded-2xl border ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#070D1A] border-slate-800'
                  }`}>
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                        <Navigation className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[9.5px] uppercase font-bold text-amber-600 dark:text-amber-400 block">
                          {language === 'en' ? 'Current Ride Update' : 'वर्तमान स्थिति'}
                        </span>
                        <p className="text-xs font-bold mt-0.5 leading-snug">
                          {getLiveStatusDescription(searchedBooking, stageIdx, language)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Visual Route Radar Bar */}
                  <div className={`p-3 rounded-2xl border ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#070D1A] border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-2">
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                        <MapPin className="w-3 h-3" />
                        <span>{searchedBooking.pickupCity}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[9px] font-bold">
                        {stageSteps[stageIdx].label}
                      </span>
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                        <span>{searchedBooking.dropCity || 'Local'}</span>
                        <Navigation className="w-3 h-3" />
                      </span>
                    </div>

                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden relative">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${activePct}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 2: 6-STEP TRIP STAGES */}
              {activeTab === 'stages' && (
                <div className={`p-3.5 rounded-2xl border space-y-3 animate-in fade-in duration-150 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#070D1A] border-slate-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? '6-Step Journey Progression' : 'सफर के 6 चरण (लाइव प्रोग्रेस)'}</span>
                    </span>
                    <span className="text-[10px] font-black text-amber-500">
                      Step {stageIdx + 1} of 6
                    </span>
                  </div>

                  {/* Vertical Stepper - Zero Horizontal Overflow, Clean Reading */}
                  <div className="space-y-2 pt-1">
                    {stageSteps.map((st, idx) => {
                      const isDone = stageIdx >= idx;
                      const isCurrent = stageIdx === idx;

                      return (
                        <div 
                          key={st.id} 
                          className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                            isCurrent
                              ? 'bg-amber-500/15 border-amber-500/50 text-slate-900 dark:text-white ring-1 ring-amber-500/30 font-bold'
                              : isDone
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                                : 'bg-transparent border-transparent opacity-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10.5px] shrink-0 ${
                              isCurrent
                                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                                : isDone
                                  ? 'bg-emerald-500 text-slate-950 font-black'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                            }`}>
                              {isDone && !isCurrent ? '✓' : idx + 1}
                            </div>
                            <div>
                              <span className="text-xs font-black block">
                                {language === 'en' ? st.label : st.labelHi}
                              </span>
                              <span className="text-[10px] opacity-80">
                                {idx === 0 && 'Booking accepted by dispatch'}
                                {idx === 1 && (searchedBooking.driverName ? `Assigned: ${searchedBooking.driverName}` : 'Driver & Cab being allocated')}
                                {idx === 2 && 'Cab departed towards pickup point'}
                                {idx === 3 && 'Cab reached pickup address'}
                                {idx === 4 && 'Passenger on-board, transit active'}
                                {idx === 5 && 'Safely dropped at destination'}
                              </span>
                            </div>
                          </div>

                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[9px] font-black uppercase tracking-wider shrink-0">
                              Active
                            </span>
                          )}
                          {isDone && !isCurrent && (
                            <span className="text-emerald-500 text-xs font-bold shrink-0">
                              ✓ Done
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION 3: ROUTE & PASSENGER ITINERARY */}
              {activeTab === 'route' && (
                <div className={`p-3.5 rounded-2xl border space-y-3 animate-in fade-in duration-150 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#070D1A] border-slate-800'
                }`}>
                  {/* Route points */}
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="w-3 h-3 stroke-[2.5]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Pickup City & Address</span>
                        <div className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                          {searchedBooking.pickupCity}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {searchedBooking.pickupAddress || 'City Center / Home Pickup'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <div className="w-5 h-5 rounded-full bg-red-500/15 border border-red-500 text-red-500 flex items-center justify-center shrink-0 mt-0.5">
                        <Navigation className="w-3 h-3 stroke-[2.5]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Drop Destination</span>
                        <div className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                          {searchedBooking.dropCity || 'Local Package'}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {searchedBooking.dropAddress || 'Destination City / Hotel'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Schedule & Car Grid */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px]">
                    <div className="space-y-0.5">
                      <span className="text-[8.5px] uppercase font-bold text-slate-400 block">Schedule</span>
                      <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-white">
                        <Calendar className="w-3 h-3 text-amber-500 shrink-0" />
                        <span>{searchedBooking.pickupDate}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                        <span>{searchedBooking.pickupTime}</span>
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[8.5px] uppercase font-bold text-slate-400 block">Vehicle</span>
                      <div className="font-bold truncate text-slate-900 dark:text-white flex items-center gap-1">
                        <Car className="w-3 h-3 text-amber-500 shrink-0" />
                        <span className="truncate">{searchedBooking.vehicle?.name || 'Commercial AC Cab'}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block truncate">
                        {searchedBooking.vehicle?.seats || 4} Seats · Clean Commercial Cab
                      </span>
                    </div>
                  </div>

                  {/* Passenger row */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">
                      Passenger: <strong className="text-slate-900 dark:text-white">{searchedBooking.passengerName}</strong>
                    </span>
                    <span className="font-mono text-slate-500 font-bold">{searchedBooking.passengerPhone}</span>
                  </div>
                </div>
              )}

              {/* SECTION 4: TARIFF, HELPLINE & CANCEL */}
              {activeTab === 'fare' && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  {/* Tariff & Inclusions Card */}
                  <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                    isLight ? 'bg-emerald-50/80 border-emerald-300' : 'bg-emerald-950/20 border-emerald-500/30'
                  }`}>
                    <div>
                      <span className="text-[8.5px] uppercase font-bold text-slate-400 block">Total Tariff</span>
                      <span className="text-base sm:text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                        ₹{searchedBooking.totalFare}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10.5px] text-emerald-700 dark:text-emerald-400 font-black block">
                        {searchedBooking.paymentPreference === 'online_pay' ? '💳 Online Pay (UPI)' : '💵 Cash in Hand (Pay Driver)'}
                      </span>
                      <span className="text-[9.5px] text-slate-500 block">
                        Tolls &amp; Fuel Included · Zero Hidden Fees
                      </span>
                    </div>
                  </div>

                  {/* Quick Action Buttons (WhatsApp & Helpline) */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a
                      href={generateWhatsAppLink(searchedBooking)}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp Voucher</span>
                    </a>

                    <a
                      href={`tel:${COMPANY_PHONE.replace(/\s+/g, '')}`}
                      className="btn-gold py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                    >
                      <Phone className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Call Support</span>
                    </a>
                  </div>

                  {/* Cancel / Delete Option */}
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
