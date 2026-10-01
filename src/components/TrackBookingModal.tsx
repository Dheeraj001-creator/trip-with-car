import React, { useState, useEffect } from 'react';
import { Search, X, Car, Calendar, Clock, MapPin, CheckCircle, Phone, MessageSquare, AlertCircle } from 'lucide-react';
import { Booking } from '../types/cab';
import { getBookingsFromStorage, findBooking, generateWhatsAppLink } from '../utils/fareCalculator';
import { COMPANY_PHONE } from '../data/cabsData';

interface TrackBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'hi';
  theme?: 'dark' | 'light';
}

export const TrackBookingModal: React.FC<TrackBookingModalProps> = ({
  isOpen,
  onClose,
  language,
  theme = 'dark',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [searchedBooking, setSearchedBooking] = useState<Booking | null>(null);
  const [notFound, setNotFound] = useState(false);
  const isLight = theme === 'light';

  useEffect(() => {
    if (isOpen) {
      const stored = getBookingsFromStorage();
      setRecentBookings(stored);
      if (stored.length > 0) {
        setSearchedBooking(stored[0]);
      }
    }
  }, [isOpen]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className={`relative w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden my-6 border transition-colors ${
        isLight
          ? 'bg-white border-slate-300 text-slate-900'
          : 'bg-[#0F172A] border-slate-700 text-white'
      }`}>
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#0B1120] border-slate-800'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-500 flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black">
                {language === 'en' ? 'Track Reservation / Search PNR' : 'बुकिंग स्टेटस जांचें'}
              </h3>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Enter 10-digit mobile number or booking reference (e.g. TWC-2026-XXXX)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input form */}
        <form onSubmit={handleSearch} className={`p-4 border-b ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#090D16] border-slate-800'
        }`}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className={`w-4 h-4 absolute left-3 top-3 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Mobile number or TWC-2026-..."
                className={`w-full rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-bold transition-colors focus:outline-none ${
                  isLight
                    ? 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-blue-600 focus:bg-white'
                    : 'bg-[#0F172A] border border-slate-700 text-white placeholder-slate-500 focus:border-blue-500'
                }`}
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-colors cursor-pointer"
            >
              Lookup
            </button>
          </div>
        </form>

        {/* Search Result */}
        <div className="p-5 max-h-[65vh] overflow-y-auto space-y-4">
          {notFound && (
            <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/30 text-xs text-red-400 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">No reservation record found</span>
                <span className="text-[11px] text-red-300">
                  Please verify the mobile number or booking code. For instant assistance, contact our 24/7 desk at {COMPANY_PHONE}.
                </span>
              </div>
            </div>
          )}

          {searchedBooking && (
            <div className={`p-4 rounded-xl border space-y-3 ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#090D16] border-slate-800 text-slate-200'
            }`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-700/60 text-xs">
                <div>
                  <span className={`text-[10px] uppercase font-bold block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>PNR Reference</span>
                  <span className="font-black text-blue-600 font-mono text-sm">{searchedBooking.bookingId}</span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 flex items-center gap-1 border border-emerald-500/30">
                  <CheckCircle className="w-3 h-3" />
                  <span>Confirmed</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className={`text-[10px] block font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Pickup Route:</span>
                  <span className="font-bold block">{searchedBooking.pickupCity} → {searchedBooking.dropCity}</span>
                  <span className={`text-[11px] block mt-0.5 truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {searchedBooking.pickupAddress}
                  </span>
                </div>
                <div>
                  <span className={`text-[10px] block font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Vehicle &amp; Fare:</span>
                  <span className="font-bold block">{searchedBooking.vehicle.name}</span>
                  <span className="text-blue-600 font-black">₹{searchedBooking.totalFare} (All-Inclusive)</span>
                </div>
              </div>

              <div className={`flex items-center justify-between text-xs pt-2 border-t ${
                isLight ? 'border-slate-200 text-slate-600' : 'border-slate-800 text-slate-400'
              }`}>
                <span className="flex items-center gap-1 font-semibold">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  <span>{searchedBooking.pickupDate} at {searchedBooking.pickupTime}</span>
                </span>
                <span className="font-bold">Passenger: {searchedBooking.passengerName}</span>
              </div>

              <div className="pt-2 flex gap-2">
                <a
                  href={generateWhatsAppLink(searchedBooking)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Open WhatsApp</span>
                </a>
                <a
                  href={`tel:${COMPANY_PHONE.replace(/\s+/g, '')}`}
                  className={`py-2 px-3 rounded-lg border font-bold text-xs flex items-center gap-1.5 transition-colors ${
                    isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5 text-blue-500" />
                  <span>Call Chauffeur Desk</span>
                </a>
              </div>
            </div>
          )}

          {/* Stored Recent Bookings history */}
          {recentBookings.length > 0 && !searchedBooking && !notFound && (
            <div className="space-y-2">
              <span className={`text-xs font-bold block ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Recent Bookings in this Browser:
              </span>
              {recentBookings.map((b) => (
                <div
                  key={b.bookingId}
                  onClick={() => setSearchedBooking(b)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                    isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-[#090D16] hover:bg-slate-800 border-slate-800'
                  }`}
                >
                  <div className="flex justify-between font-bold">
                    <span>{b.bookingId}</span>
                    <span className="text-blue-600">₹{b.totalFare}</span>
                  </div>
                  <div className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {b.pickupCity} → {b.dropCity} · {b.pickupDate}
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
