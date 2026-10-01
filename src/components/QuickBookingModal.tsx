import React, { useState } from 'react';
import { X, CheckCircle2, Phone, Mail, User, ShieldCheck } from 'lucide-react';
import { Vehicle, TripType, Booking } from '../types/cab';
import { FareCalculationResult, generateBookingId, saveBookingToStorage } from '../utils/fareCalculator';
import { CarLoadingOverlay } from './CarLoadingOverlay';

interface QuickBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle;
  tripType: TripType;
  pickupCity: string;
  dropCity: string;
  pickupAddress: string;
  dropAddress: string;
  pickupDate: string;
  pickupTime: string;
  returnDate?: string;
  returnTime?: string;
  fareResult: FareCalculationResult;
  onBookingConfirmed: (booking: Booking) => void;
  language: 'en' | 'hi';
  theme: 'dark' | 'light';
}

export const QuickBookingModal: React.FC<QuickBookingModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  tripType,
  pickupCity,
  dropCity,
  pickupAddress,
  dropAddress,
  pickupDate,
  pickupTime,
  returnDate,
  returnTime,
  fareResult,
  onBookingConfirmed,
  language,
  theme,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const isLight = theme === 'light';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!name.trim()) {
      errors.name = language === 'en' ? 'Please enter your name' : 'कृपया नाम दर्ज करें';
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      errors.phone = language === 'en' ? 'Enter valid 10-digit mobile' : '10 अंकों का मोबाइल दर्ज करें';
    }

    if (!email.trim() || !email.includes('@')) {
      errors.email = language === 'en' ? 'Enter valid email' : 'वैध ईमेल आईडी दर्ज करें';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    const newBookingId = generateBookingId();

    const booking: Booking = {
      bookingId: newBookingId,
      tripType,
      pickupCity,
      dropCity: tripType === 'local' ? 'Local City Sightseeing' : dropCity,
      pickupAddress: pickupAddress || `${pickupCity} City Center / Hotel`,
      dropAddress: dropAddress || (tripType === 'local' ? 'Local City Tour' : `${dropCity} Destination`),
      pickupDate,
      pickupTime,
      returnDate: tripType === 'roundtrip' ? returnDate : undefined,
      returnTime: tripType === 'roundtrip' ? returnTime : undefined,
      vehicle,
      estimatedDistanceKm: fareResult.estimatedDistanceKm,
      baseFare: fareResult.baseFare,
      driverAllowance: fareResult.driverAllowance,
      tollEstimate: fareResult.tollEstimate,
      gstAmount: fareResult.gstAmount,
      discountAmount: fareResult.discountAmount,
      totalFare: fareResult.totalFare,
      passengerName: name.trim(),
      passengerPhone: cleanPhone,
      passengerEmail: email.trim(),
      passengerCount: vehicle.seats,
      luggageCount: vehicle.luggage,
      paymentPreference: 'cash_to_driver',
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    setIsSubmitting(true);

    setTimeout(() => {
      saveBookingToStorage(booking);
      setIsSubmitting(false);
      onClose();
      onBookingConfirmed(booking);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      {/* 100% FITTED MOBILE MODAL - NO SCROLL NEEDED */}
      <div className={`relative w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border transition-all ${
        isLight
          ? 'bg-white border-slate-300 text-slate-900 shadow-2xl'
          : 'bg-[#0B1120] border-slate-800 text-white shadow-2xl'
      }`}>
        
        {/* Top Header Bar */}
        <div className={`px-4 py-2.5 sm:py-3 border-b flex items-center justify-between shrink-0 ${
          isLight ? 'bg-slate-100/90 border-slate-200' : 'bg-[#070B14] border-slate-800'
        }`}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs sm:text-sm font-bold text-amber-500">
              TripWithCar · Instant Reservation
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Close"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Compact Modal Content (No Scroll Needed) */}
        <div className="p-3.5 sm:p-5 space-y-3">
          
          {/* VEHICLE & ROUTE SUMMARY STRIP */}
          <div className={`p-2.5 sm:p-3 rounded-xl border flex items-center gap-3 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#070B14] border-slate-800'
          }`}>
            {/* Thumbnail Car Image */}
            <div className="relative w-16 h-12 sm:w-20 sm:h-14 rounded-lg overflow-hidden bg-slate-950 shrink-0 border border-slate-700/60 shadow-xs">
              <img
                src={vehicle.imageUrl}
                alt={vehicle.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h4 className="text-xs sm:text-sm font-bold truncate">
                  {vehicle.name}
                </h4>
                {/* Emerald Total Fare */}
                <div className="text-sm sm:text-base font-black font-mono text-emerald-600 dark:text-emerald-400 shrink-0">
                  ₹{fareResult.totalFare}
                </div>
              </div>

              {/* Route */}
              <div className="text-[11px] font-semibold text-amber-500 truncate flex items-center gap-1 mt-0.5">
                <span>{pickupCity}</span>
                <span>→</span>
                <span>{tripType === 'local' ? 'Local Tour' : dropCity}</span>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                <span className="text-emerald-600 font-bold">
                  ₹0 Advance
                </span>
                <span className={`opacity-70 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  · Tolls &amp; Fuel Included
                </span>
              </div>
            </div>
          </div>

          {/* 3-FIELD PASSENGER FORM (Name, Mobile, Email) */}
          <form onSubmit={handleSubmit} id="quick-booking-form" className="space-y-2.5">
            {/* Full Name */}
            <div>
              <label className="block text-[11px] font-bold mb-1 flex items-center gap-1 opacity-90">
                <User className="w-3 h-3 text-amber-500 stroke-[2.5]" />
                <span>{language === 'en' ? 'Full Name' : 'पूरा नाम'} *</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className={`w-full rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition-all focus:outline-none ${
                  isLight
                    ? 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-amber-500 focus:bg-white'
                    : 'bg-[#070B14] border border-slate-700 text-white focus:border-amber-500'
                }`}
              />
              {formErrors.name && (
                <p className="text-red-500 text-[10px] mt-0.5 font-bold">{formErrors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Mobile Number with +91 */}
              <div>
                <label className="block text-[11px] font-bold mb-1 flex items-center gap-1 opacity-90">
                  <Phone className="w-3 h-3 text-amber-500 stroke-[2.5]" />
                  <span>{language === 'en' ? 'Mobile Number' : 'मोबाइल नंबर'} *</span>
                </label>
                <div className="relative">
                  <span className={`absolute left-3 top-2 text-xs font-bold ${
                    isLight ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    className={`w-full rounded-xl pl-11 pr-3 py-2 text-xs sm:text-sm font-bold font-mono tracking-wider transition-all focus:outline-none ${
                      isLight
                        ? 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-amber-500 focus:bg-white'
                        : 'bg-[#070B14] border border-slate-700 text-white focus:border-amber-500'
                    }`}
                  />
                </div>
                {formErrors.phone && (
                  <p className="text-red-500 text-[10px] mt-0.5 font-bold">{formErrors.phone}</p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-[11px] font-bold mb-1 flex items-center gap-1 opacity-90">
                  <Mail className="w-3 h-3 text-amber-500 stroke-[2.5]" />
                  <span>{language === 'en' ? 'Email Address' : 'ईमेल आईडी'} *</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@email.com"
                  className={`w-full rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition-all focus:outline-none ${
                    isLight
                      ? 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-amber-500 focus:bg-white'
                      : 'bg-[#070B14] border border-slate-700 text-white focus:border-amber-500'
                  }`}
                />
                {formErrors.email && (
                  <p className="text-red-500 text-[10px] mt-0.5 font-bold">{formErrors.email}</p>
                )}
              </div>
            </div>

            {/* Chauffeur Guarantee Strip */}
            <div className={`p-2 rounded-xl border flex items-center justify-between text-[10px] sm:text-[11px] ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#070B14] border-slate-800 text-slate-300'
            }`}>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Driver details sent 2 hours before trip</span>
              </div>
              <span className="text-emerald-600 font-bold shrink-0">Guaranteed</span>
            </div>

            {/* Submit Action Button - ONLY "Confirm Now" */}
            <div className="pt-1">
              <button
                type="submit"
                className="btn-select-book w-full py-2.5 sm:py-3 text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg tracking-wide"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.8]" />
                <span>Confirm Now</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Car Loading Overlay on Booking Submit */}
      <CarLoadingOverlay
        isOpen={isSubmitting}
        title={language === 'en' ? 'Assigning Verified Chauffeur...' : 'आपका ड्राइवर कन्फर्म हो रहा है...'}
        subtitle={language === 'en' ? `Locking ${vehicle.name} for ${pickupCity} → ${tripType === 'local' ? 'Local Tour' : dropCity} at ₹0 advance` : `बिना किसी एडवांस के ${vehicle.name} बुक हो रही है। ड्राइवर डिटेल भेजी जा रही है`}
        theme={theme}
      />
    </div>
  );
};
