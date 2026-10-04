import React, { useState } from 'react';
import { 
  CheckCircle2, 
  X, 
  MessageSquare, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  Copy, 
  Check, 
  ShieldCheck,
  ArrowRight,
  Search,
  Sparkles,
  PlusCircle,
  Car,
  UserCheck
} from 'lucide-react';
import { Booking } from '../types/cab';
import { COMPANY_PHONE, COMPANY_WHATSAPP, COMPANY_NAME } from '../data/cabsData';
import { generateWhatsAppLink } from '../utils/fareCalculator';

interface BookingConfirmationModalProps {
  booking: Booking | null;
  onClose: () => void;
  onTrackBooking?: (bookingId: string) => void;
  onNewBooking?: () => void;
  language: 'en' | 'hi';
  theme?: 'dark' | 'light';
}

export const BookingConfirmationModal: React.FC<BookingConfirmationModalProps> = ({
  booking,
  onClose,
  onTrackBooking,
  onNewBooking,
  language,
  theme = 'dark',
}) => {
  const [copied, setCopied] = useState(false);
  const isLight = theme === 'light' || (typeof document !== 'undefined' && document.documentElement.classList.contains('light'));

  if (!booking) return null;

  const whatsappUrl = generateWhatsAppLink(booking);

  const handleCopyId = () => {
    navigator.clipboard.writeText(booking.bookingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      {/* 100% FITTED MODAL CARD - ULTRA COMPACT - ZERO SCROLL ON ALL DEVICES */}
      <div className={`relative w-full max-w-[460px] max-h-[95vh] overflow-y-auto scrollbar-none rounded-2xl sm:rounded-3xl shadow-2xl border transition-all ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900'
          : 'bg-[#0B1324] border-slate-700/80 text-white'
      }`}>
        {/* Top Header Bar */}
        <div className={`px-4 py-3 border-b flex items-center justify-between shrink-0 ${
          isLight ? 'bg-emerald-50/70 border-slate-200' : 'bg-emerald-950/30 border-slate-800'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shadow-md shrink-0">
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 block leading-tight">
                {language === 'en' ? 'Reservation Confirmed!' : 'बुकिंग कन्फर्म हो गई है!'}
              </span>
              <span className="text-[10.5px] text-slate-500 dark:text-slate-400">
                {COMPANY_NAME} · Instant Digital Folio
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Voucher Content */}
        <div className="p-3.5 sm:p-4 space-y-3 text-xs">
          {/* LIVE STATUS TRACKER: "ABHI KYA HO RAHA HAI" */}
          <div className={`p-3 rounded-2xl border ${
            isLight ? 'bg-amber-50/60 border-amber-200' : 'bg-amber-950/20 border-amber-500/30'
          }`}>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
                <span>{language === 'en' ? 'Live Status: What is happening now?' : 'लाइव स्टेटस: अभी आपकी बुकिंग का क्या हो रहा है?'}</span>
              </span>
              <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
                IN PROGRESS
              </span>
            </div>

            {/* 4-Step Visual Progress Bar */}
            <div className="grid grid-cols-4 gap-1.5 text-center my-2">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-[10px]">
                  ✓
                </div>
                <span className="text-[9px] font-bold mt-1 text-emerald-600 dark:text-emerald-400 leading-tight">Confirmed</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-[10px] ring-2 ring-amber-400 animate-pulse">
                  ⚡
                </div>
                <span className="text-[9px] font-bold mt-1 text-amber-600 dark:text-amber-400 leading-tight">Assigning Cab</span>
              </div>
              <div className="flex flex-col items-center opacity-50">
                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-[10px]">
                  3
                </div>
                <span className="text-[9px] font-medium mt-1 leading-tight">En Route</span>
              </div>
              <div className="flex flex-col items-center opacity-50">
                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-[10px]">
                  4
                </div>
                <span className="text-[9px] font-medium mt-1 leading-tight">Completed</span>
              </div>
            </div>

            <p className={`text-[11px] leading-relaxed mt-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              {language === 'en'
                ? 'Your ride is confirmed. Our dispatch team is allocating the nearest verified senior chauffeur. Driver & cab number will be dispatched to your WhatsApp/SMS before pickup.'
                : 'आपकी बुकिंग कन्फर्म हो चुकी है। हमारा कंट्रोल रूम आपके रूट के लिए सबसे नज़दीकी व सत्यापित ड्राइवर असाइन कर रहा है। गाड़ी व ड्राइवर का संपर्क नंबर पिकअप से पहले आपके WhatsApp व SMS पर भेज दिया जाएगा।'}
            </p>
          </div>

          {/* Reference & Fare Bar */}
          <div className={`flex items-center justify-between p-2.5 rounded-xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#070D1A] border-slate-800'
          }`}>
            <div>
              <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Booking Reference PNR</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs sm:text-sm font-black font-mono text-amber-500">
                  {booking.bookingId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="p-1 rounded text-slate-400 hover:text-amber-500 cursor-pointer transition-colors"
                  title="Copy PNR"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Total Tariff</span>
              <span className="text-sm sm:text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                ₹{booking.totalFare}
              </span>
              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold block">₹0 Advance · Pay Chauffeur</span>
            </div>
          </div>

          {/* Route & Schedule Card */}
          <div className={`p-2.5 rounded-xl border space-y-2 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#070D1A] border-slate-800'
          }`}>
            {/* From -> To */}
            <div className="flex items-center justify-between font-bold text-xs">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-amber-500">{booking.pickupCity}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-emerald-600 dark:text-emerald-400">{booking.dropCity || 'Local City Tour'}</span>
              </div>
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0 font-bold">
                {booking.tripType}
              </span>
            </div>

            {/* Date, Time & Car */}
            <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] pt-1.5 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-amber-500" />
                  <span>{booking.pickupDate}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-500" />
                  <span>{booking.pickupTime}</span>
                </span>
              </div>

              <div className="font-semibold truncate">
                {booking.vehicle.name} ({booking.vehicle.seats} Seats)
              </div>
            </div>

            {/* Passenger */}
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center justify-between pt-0.5">
              <span>Passenger: <strong className="text-slate-900 dark:text-slate-100">{booking.passengerName}</strong></span>
              <span className="font-mono">{booking.passengerPhone}</span>
            </div>
          </div>

          {/* TWO PRIMARY ACTION BUTTONS REQUESTED BY USER */}
          <div className="space-y-2 pt-1">
            {/* OPTION 1: TRACK THIS BOOKING (LIVE DOMAIN / STATUS) */}
            <button
              type="button"
              onClick={() => {
                if (onTrackBooking) {
                  onTrackBooking(booking.bookingId);
                } else {
                  onClose();
                }
              }}
              className="w-full py-2.5 sm:py-3 px-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer select-none"
            >
              <Search className="w-4 h-4 stroke-[2.5]" />
              <span>{language === 'en' ? 'Track Live Booking Status' : 'लाइव बुकिंग स्टेटस ट्रैक करें (Track Ride)'}</span>
            </button>

            {/* OPTION 2: BOOK ANOTHER RIDE (TAKES DIRECTLY TO ONEWAY MOBILE POPUP) */}
            <button
              type="button"
              onClick={() => {
                if (onNewBooking) {
                  onNewBooking();
                } else {
                  onClose();
                }
              }}
              className="btn-gold w-full py-2.5 sm:py-3 px-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer select-none"
            >
              <Car className="w-4 h-4 stroke-[2.5]" />
              <span>{language === 'en' ? 'Book Another Ride (New OneWay)' : 'नई राइड बुक करें (New OneWay Ride)'}</span>
            </button>
          </div>

          {/* Secondary Quick Contact Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Details</span>
            </a>

            <a
              href={`tel:${COMPANY_PHONE.replace(/\s+/g, '')}`}
              className={`py-2 px-2.5 rounded-xl font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 border transition-colors ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Helpline</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

