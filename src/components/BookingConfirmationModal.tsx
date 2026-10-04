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
  ArrowRight
} from 'lucide-react';
import { Booking } from '../types/cab';
import { COMPANY_PHONE, COMPANY_WHATSAPP, COMPANY_NAME } from '../data/cabsData';
import { generateWhatsAppLink } from '../utils/fareCalculator';

interface BookingConfirmationModalProps {
  booking: Booking | null;
  onClose: () => void;
  language: 'en' | 'hi';
  theme?: 'dark' | 'light';
}

export const BookingConfirmationModal: React.FC<BookingConfirmationModalProps> = ({
  booking,
  onClose,
  language,
  theme = 'dark',
}) => {
  const [copied, setCopied] = useState(false);
  const isLight = theme === 'light';

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
      <div className={`relative w-full max-w-[430px] max-h-[95vh] overflow-y-auto scrollbar-none rounded-2xl sm:rounded-3xl shadow-2xl border transition-all ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900'
          : 'bg-[#0B1324] border-slate-700/80 text-white'
      }`}>
        {/* Top Header Bar */}
        <div className={`px-3.5 py-2 sm:py-2.5 border-b flex items-center justify-between shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#070D1A] border-slate-800'
        }`}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-amber-500 block leading-tight">
                Reservation Confirmed!
              </span>
              <span className="text-[10px] text-slate-400">
                {COMPANY_NAME} Digital Booking Folio
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors cursor-pointer ${
              isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Voucher Content - Compact & Clean */}
        <div className="p-3 sm:p-3.5 space-y-2 text-xs">
          {/* Reference & Fare Bar */}
          <div className={`flex items-center justify-between p-2 rounded-xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#070D1A] border-slate-800'
          }`}>
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Booking PNR</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs sm:text-sm font-black font-mono text-amber-500">
                  {booking.bookingId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                  title="Copy PNR"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Total Tariff</span>
              <span className="text-sm sm:text-base font-black font-mono text-emerald-500">
                ₹{booking.totalFare}
              </span>
            </div>
          </div>

          {/* Route & Schedule Card */}
          <div className={`p-2 rounded-xl border space-y-1.5 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#070D1A] border-slate-800'
          }`}>
            {/* From -> To */}
            <div className="flex items-center justify-between font-bold text-xs">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-amber-400">{booking.pickupCity}</span>
                <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="text-emerald-400">{booking.dropCity || 'Local City Tour'}</span>
              </div>
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                {booking.tripType}
              </span>
            </div>

            {/* Date, Time & Car */}
            <div className="flex flex-wrap items-center justify-between gap-1 text-[10.5px] text-slate-300 pt-1 border-t border-slate-200 dark:border-slate-800/80">
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

              <div className="font-semibold text-slate-200 truncate">
                {booking.vehicle.name} ({booking.vehicle.seats} Seats)
              </div>
            </div>

            {/* Passenger */}
            <div className="text-[10.5px] text-slate-400 truncate flex items-center justify-between pt-0.5">
              <span>Client: <strong className="text-slate-200">{booking.passengerName}</strong></span>
              <span className="font-mono text-slate-400">{booking.passengerPhone}</span>
            </div>
          </div>

          {/* Chauffeur Dispatch Info Note */}
          <div className={`p-1.5 px-2 rounded-xl border flex items-center justify-between text-[10.5px] ${
            isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
          }`}>
            <div className="flex items-center gap-1.5 truncate">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">Chauffeur details will be dispatched via WhatsApp &amp; SMS</span>
            </div>
            <span className="font-bold text-[9px] text-emerald-400 shrink-0 ml-1">₹0 Advance</span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Open WhatsApp</span>
            </a>

            <a
              href={`tel:${COMPANY_PHONE.replace(/\s+/g, '')}`}
              className="btn-gold py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors"
            >
              <Phone className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Call Helpline</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
