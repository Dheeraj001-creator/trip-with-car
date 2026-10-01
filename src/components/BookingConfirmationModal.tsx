import React, { useState } from 'react';
import { 
  CheckCircle2, 
  X, 
  Printer, 
  MessageSquare, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  Car, 
  User, 
  Copy, 
  Check, 
  ShieldCheck 
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className={`relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-8 border transition-colors ${
        isLight
          ? 'bg-white border-slate-300 text-slate-900'
          : 'bg-[#0F172A] border-slate-700 text-white'
      }`}>
        {/* Voucher Header */}
        <div className={`p-6 border-b flex items-center justify-between ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#0B1120] border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-black tracking-widest uppercase text-blue-600 block">
                TripWithCar Reservation Confirmed
              </span>
              <h2 className="text-lg font-black mt-0.5">
                {language === 'en' ? 'Digital Booking Folio & Voucher' : 'डिजिटल बुकिंग वाउचर'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Voucher Body */}
        <div className="p-6 space-y-5">
          {/* Reference & Actions Bar */}
          <div className={`flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#090D16] border-slate-800'
          }`}>
            <div>
              <span className={`text-[10px] uppercase tracking-widest block font-bold ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}>
                PNR / Reference Code
              </span>
              <span className="text-base font-black font-mono tracking-wider text-blue-600">
                {booking.bookingId}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyId}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                  isLight
                    ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                  isLight
                    ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Folio</span>
              </button>
            </div>
          </div>

          {/* Route Summary */}
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#090D16] border-slate-800'
          }`}>
            <div>
              <span className={`text-[10px] uppercase tracking-wider block mb-2 font-bold ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}>
                Itinerary &amp; Schedule
              </span>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <span className={`text-[11px] block font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Pickup Location:</span>
                    <span className="text-xs font-bold">{booking.pickupAddress || booking.pickupCity}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className={`text-[11px] block font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Destination Drop:</span>
                    <span className="text-xs font-bold">
                      {booking.dropAddress || booking.dropCity || 'Local City Sightseeing'}
                    </span>
                  </div>
                </div>

                <div className={`flex items-center gap-4 text-xs pt-2 border-t font-semibold ${
                  isLight ? 'border-slate-200 text-slate-700' : 'border-slate-800 text-slate-300'
                }`}>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    <span>{booking.pickupDate}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    <span>{booking.pickupTime}</span>
                  </span>
                </div>
              </div>
            </div>

            <div>
              <span className={`text-[10px] uppercase tracking-wider block mb-2 font-bold ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}>
                Allocated Vehicle &amp; Chauffeur
              </span>
              <div className="flex items-center gap-3">
                <img
                  src={booking.vehicle.imageUrl}
                  alt={booking.vehicle.name}
                  className="w-16 h-12 rounded-lg object-cover border border-slate-300 shrink-0"
                />
                <div>
                  <h4 className="text-xs font-black">{booking.vehicle.name}</h4>
                  <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {booking.vehicle.modelNames}
                  </p>
                  <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                    Commercial Yellow Plate Chauffeur
                  </span>
                </div>
              </div>

              <div className={`mt-3 pt-3 border-t text-xs space-y-1 ${
                isLight ? 'border-slate-200 text-slate-600' : 'border-slate-800 text-slate-400'
              }`}>
                <div className="flex justify-between">
                  <span>Passenger:</span>
                  <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{booking.passengerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Contact:</span>
                  <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>+91 {booking.passengerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span>Email:</span>
                  <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{booking.passengerEmail}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Folio Breakdown */}
          <div className={`p-4 rounded-xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#090D16] border-slate-800'
          }`}>
            <span className={`text-[10px] uppercase tracking-wider block mb-2 font-bold ${
              isLight ? 'text-slate-500' : 'text-slate-400'
            }`}>
              Tariff &amp; Billing Summary
            </span>

            <div className={`space-y-1.5 text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              <div className="flex justify-between">
                <span>Calculated Highway Distance:</span>
                <span className="font-semibold">~{booking.estimatedDistanceKm} KM</span>
              </div>
              <div className="flex justify-between">
                <span>Base Distance Fare:</span>
                <span className="font-semibold">₹{booking.baseFare}</span>
              </div>
              <div className="flex justify-between">
                <span>Fastag Highway Tolls &amp; State Taxes:</span>
                <span className="font-semibold">₹{booking.tollEstimate} (Included)</span>
              </div>
              <div className="flex justify-between">
                <span>Driver Day Allowance &amp; DA:</span>
                <span className="font-semibold">₹{booking.driverAllowance} (Included)</span>
              </div>
              <div className="flex justify-between">
                <span>GST (5% Road Transport):</span>
                <span className="font-semibold">₹{booking.gstAmount} (Included)</span>
              </div>

              <div className={`pt-2 border-t flex justify-between items-center text-sm ${
                isLight ? 'border-slate-300' : 'border-slate-800'
              }`}>
                <span className={`font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>Total All-Inclusive Fare:</span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">₹{booking.totalFare}</span>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1 text-emerald-600 font-bold">
                <span>Payment Settlement:</span>
                <span>Pay to Chauffeur Post-Ride (Cash or UPI)</span>
              </div>
            </div>
          </div>

          {/* Dispatch Notice & Contact */}
          <div className={`p-4 rounded-2xl border flex items-start gap-3 text-xs ${
            isLight ? 'bg-amber-50/70 border-amber-200' : 'bg-[#070B14] border-amber-500/30'
          }`}>
            <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className={`font-black text-sm block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Chauffeur Allocation Schedule
              </span>
              <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                Driver details with vehicle registration number and live GPS tracking link will be dispatched to your WhatsApp (+91 {booking.passengerPhone}) 2 hours prior to scheduled departure.
              </p>
            </div>
          </div>

          {/* WhatsApp & Call Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-95"
            >
              <MessageSquare className="w-4 h-4 stroke-[2.5]" />
              <span>Share Voucher on WhatsApp</span>
            </a>

            <a
              href={`tel:${COMPANY_PHONE.replace(/\s+/g, '')}`}
              className="btn-gold py-3.5 px-5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Phone className="w-4 h-4 stroke-[2.8]" />
              <span>24/7 Helpline</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
