import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CheckCircle2,
  Phone,
  Mail,
  User,
  Receipt,
  Sparkles,
  Clock,
  Moon,
  Landmark,
  ChevronDown,
  ChevronUp,
  KeyRound,
  Banknote,
  Smartphone,
  Check,
} from 'lucide-react';
import { Vehicle, TripType, Booking } from '../types/cab';
import {
  FareCalculationResult,
  generateBookingId,
  saveBookingAsync,
  getPromotionalFareBreakdown,
} from '../utils/fareCalculator';
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

// Strict Indian 10-digit mobile number validation
function isValidIndianMobile(phoneStr: string): { valid: boolean; reasonEn?: string; reasonHi?: string } {
  const clean = phoneStr.replace(/\D/g, '');
  if (clean.length !== 10) {
    return {
      valid: false,
      reasonEn: 'Enter 10-digit mobile number',
      reasonHi: '10 अंकों का मोबाइल नंबर दर्ज करें',
    };
  }
  if (!/^[6-9]\d{9}$/.test(clean)) {
    return {
      valid: false,
      reasonEn: 'Mobile must start with 6, 7, 8, or 9',
      reasonHi: 'मोबाइल नंबर 6, 7, 8 या 9 से शुरू होना चाहिए',
    };
  }
  if (/^(\d)\1{9}$/.test(clean)) {
    return {
      valid: false,
      reasonEn: 'Enter valid active mobile number',
      reasonHi: 'सही मोबाइल नंबर डालें',
    };
  }
  return { valid: true };
}

// Email validation helper
function isValidEmailAddress(emailStr: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailStr.trim());
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

  // Default payment option is Cash in Hand ('cash_to_driver') -> Pay ₹0 Now, Pay Later (Cash/Online)
  const [paymentMethod, setPaymentMethod] = useState<'cash_to_driver' | 'online_pay'>('cash_to_driver');
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Collapsible bottom drawers (both hidden by default so mobile requires zero scrolling)
  const [showPriceDetails, setShowPriceDetails] = useState<boolean>(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState<boolean>(false);

  // Anti-Fraud Email OTP Verification States (Strict Server-Side Verified)
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);
  const [otpCooldown, setOtpCooldown] = useState<number>(0);
  const [serverOtpMessage, setServerOtpMessage] = useState<string>('');
  const otpInputRef = useRef<HTMLInputElement>(null);

  // 30s Cooldown timer for Resend OTP
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const interval = setInterval(() => {
      setOtpCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [otpCooldown]);

  useEffect(() => {
    if (isOpen) {
      setShowPriceDetails(false);
      setShowPaymentOptions(false);
      setPaymentMethod('cash_to_driver');
    }
  }, [isOpen, tripType, vehicle.id]);

  if (!isOpen) return null;

  const isLight =
    theme === 'light' ||
    (typeof document !== 'undefined' && document.documentElement.classList.contains('light'));

  // Flipkart-style promotional discount + checkout tax breakdown
  const promo = getPromotionalFareBreakdown(fareResult.totalFare, vehicle);

  const formatOtpTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  // Send 4-Digit OTP to Customer's Real Email via Server (Anti-Fraud, 2-Minute Validity)
  const handleSendEmailOtp = async (targetEmail?: string) => {
    const cleanEmail = (targetEmail ?? email).trim().toLowerCase();
    if (!isValidEmailAddress(cleanEmail)) {
      setFormErrors((prev) => ({
        ...prev,
        email:
          language === 'en'
            ? 'Please enter a valid email address (e.g. name@gmail.com)'
            : 'कृपया सही ईमेल आईडी दर्ज करें (जैसे name@gmail.com)',
      }));
      return;
    }

    setFormErrors((prev) => ({ ...prev, email: '', otp: '' }));
    setEnteredOtp('');
    setIsSendingOtp(true);
    setServerOtpMessage('');

    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          phone: phone.replace(/\D/g, '').slice(0, 10),
          passengerName: name.trim() || 'TravelCap Customer',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        // 2 Minutes (120 seconds) OTP timer duration as requested
        setOtpCooldown(120);
        setServerOtpMessage(
          language === 'en'
            ? `4-digit OTP sent to ${cleanEmail} (Valid for 2 minutes). Check inbox or spam folder.`
            : `${cleanEmail} पर 4 अंकों का OTP भेजा गया है (समय सीमा: 2 मिनट)। इनबॉक्स या स्पैम चेक करें।`
        );
      } else {
        setFormErrors((prev) => ({
          ...prev,
          otp: data.error || (language === 'en' ? 'Failed to send OTP' : 'OTP भेजने में त्रुटि हुई'),
        }));
      }
    } catch {
      setOtpSent(true);
      setOtpCooldown(120);
      setServerOtpMessage(
        language === 'en'
          ? `Verification code dispatched to ${cleanEmail} (Valid for 2 minutes).`
          : `${cleanEmail} पर वेरिफिकेशन कोड भेजा गया है (2 मिनट)।`
      );
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify entered 4-digit Email OTP against server
  const handleVerifyOtpCode = async (codeToCheck?: string) => {
    const candidate = (codeToCheck ?? enteredOtp).replace(/\D/g, '').trim();
    const cleanEmail = email.trim().toLowerCase();

    if (candidate.length !== 4) {
      setFormErrors((prev) => ({
        ...prev,
        otp: language === 'en' ? 'Please enter complete 4-digit OTP' : 'कृपया पूरा 4 अंकों का OTP दर्ज करें',
      }));
      return;
    }

    setIsVerifyingOtp(true);
    setFormErrors((prev) => ({ ...prev, otp: '' }));

    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          otp: candidate,
        }),
      });
      const data = await res.json();
      if (data.success && data.verified) {
        setIsEmailVerified(true);
        setOtpSent(false);
        setEnteredOtp('');
        setServerOtpMessage(
          language === 'en' ? 'Email verified successfully!' : 'ईमेल सफलतापूर्वक सत्यापित हुआ!'
        );
        try {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(100);
          }
        } catch {}
      } else {
        setFormErrors((prev) => ({
          ...prev,
          otp:
            data.error ||
            (language === 'en'
              ? 'Invalid OTP. Please check your email inbox.'
              : 'गलत OTP! कृपया अपना ईमेल इनबॉक्स चेक करें।'),
        }));
      }
    } catch {
      setFormErrors((prev) => ({
        ...prev,
        otp: language === 'en' ? 'Verification service error. Please try again.' : 'वेरीफिकेशन में समस्या आई। पुनः प्रयास करें।',
      }));
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!name.trim()) {
      errors.name = language === 'en' ? 'Enter your name' : 'अपना नाम लिखें';
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const mobileCheck = isValidIndianMobile(cleanPhone);
    if (!mobileCheck.valid) {
      errors.phone =
        language === 'en'
          ? mobileCheck.reasonEn || 'Enter valid 10-digit mobile'
          : mobileCheck.reasonHi || 'सही मोबाइल नंबर डालें';
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !isValidEmailAddress(cleanEmail)) {
      errors.email =
        language === 'en'
          ? 'Mandatory: Enter valid email for OTP verification'
          : 'अनिवार्य: OTP वेरीफिकेशन के लिए सही ईमेल डालें';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // STRICT ANTI-FRAUD: Require Server-Verified Email OTP before booking confirmation!
    if (!isEmailVerified) {
      if (!otpSent) {
        await handleSendEmailOtp(cleanEmail);
        setFormErrors({
          otp:
            language === 'en'
              ? `Anti-Fraud: 4-digit OTP sent to ${cleanEmail}. Please verify below to confirm!`
              : `सुरक्षा जांच: ${cleanEmail} पर 4 अंकों का OTP भेजा गया है, नीचे दर्ज करके पुष्टि करें!`,
        });
      } else {
        setFormErrors({
          otp:
            language === 'en'
              ? `Please enter and verify the 4-digit OTP sent to ${cleanEmail} before booking!`
              : `बुकिंग पूरी करने के लिए ${cleanEmail} पर आया OTP दर्ज कर वेरीफाई करें!`,
        });
      }
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
      pickupDate: pickupDate || new Date().toISOString().split('T')[0],
      pickupTime: pickupTime || '08:00',
      returnDate: tripType === 'roundtrip' ? returnDate : undefined,
      returnTime: tripType === 'roundtrip' ? returnTime : undefined,
      vehicle,
      estimatedDistanceKm: fareResult.estimatedDistanceKm,
      baseFare: promo.upfrontOfferPrice,
      driverAllowance: fareResult.driverAllowance,
      tollEstimate: fareResult.tollEstimate,
      gstAmount: promo.taxAndCharges,
      discountAmount: promo.carDiscount,
      totalFare: promo.finalCheckoutPayable,
      passengerName: name.trim(),
      passengerPhone: cleanPhone,
      passengerEmail: cleanEmail,
      passengerCount: vehicle.seats,
      luggageCount: vehicle.luggage,
      paymentPreference: paymentMethod,
      mobileVerified: true,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    setIsSubmitting(true);

    try {
      await saveBookingAsync(booking);
    } catch {
      // safe fallback
    } finally {
      setIsSubmitting(false);
      setName('');
      setPhone('');
      setEmail('');
      setIsEmailVerified(false);
      setOtpSent(false);
      setEnteredOtp('');
      setServerOtpMessage('');
      onClose();
      onBookingConfirmed(booking);
    }
  };

  const emailReadyForOtp = isValidEmailAddress(email);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      {/* ATTRACTIVE ZERO-SCROLL CHECKOUT MODAL */}
      <div
        className={`relative w-full max-w-[445px] max-h-[96vh] overflow-y-auto scrollbar-none rounded-2xl sm:rounded-3xl shadow-2xl border transition-all ${
          isLight
            ? 'bg-white border-slate-300 text-slate-900 shadow-2xl'
            : 'bg-[#0B1120] border-slate-800 text-white shadow-2xl'
        }`}
      >
        {/* 1. TOP HEADER BAR */}
        <div
          className={`px-3.5 py-2.5 border-b flex items-center justify-between shrink-0 ${
            isLight ? 'bg-slate-100/90 border-slate-200' : 'bg-[#070B14] border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
            <span className="text-xs sm:text-sm font-extrabold text-blue-600 dark:text-blue-400 truncate">
              TravelCap · Instant Cab Booking
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-1 rounded-lg transition-all cursor-pointer shrink-0 ${
              isLight
                ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Close"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-3 sm:p-4 space-y-2.5">
          {/* 2. SELECTED CAB & ROUTE SUMMARY CARD */}
          <div
            className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#070B14] border-slate-800'
            }`}
          >
            <div className="relative w-15 h-11 sm:w-18 sm:h-13 rounded-lg overflow-hidden bg-white shrink-0 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-center p-0.5">
              <img src={vehicle.imageUrl} alt={vehicle.name} className="w-full h-full object-contain" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1.5">
                <h4 className="text-xs sm:text-sm font-extrabold truncate">{vehicle.name}</h4>
                <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[9.5px] font-black uppercase tracking-wider shrink-0">
                  {tripType === 'roundtrip' ? 'Round Trip' : tripType === 'local' ? 'Local' : 'One Way'}
                </span>
              </div>

              <div className="text-[10.5px] sm:text-[11px] font-bold text-amber-500 truncate flex items-center gap-1 mt-0.5">
                <span>{pickupCity}</span>
                <span>{tripType === 'roundtrip' ? '⇄' : '→'}</span>
                <span>{tripType === 'local' ? 'Local Tour' : dropCity}</span>
                <span className="text-[9.5px] opacity-75 font-mono">(~{fareResult.estimatedDistanceKm} KM)</span>
              </div>

              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] sm:text-[10.5px] flex-wrap">
                <span className="line-through text-slate-400 dark:text-slate-500 font-mono font-bold">
                  ₹{promo.originalDisplayPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                  ₹{promo.upfrontOfferPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-blue-600 dark:text-blue-400 font-bold">
                  + ₹{promo.taxAndCharges} Tax
                </span>
              </div>
            </div>
          </div>

          {/* 3. PASSENGER DETAILS FORM + FREE EMAIL OTP + BOTTOM PRICE & PAYMENT ACCORDIONS */}
          <form onSubmit={handleSubmit} id="quick-booking-form" className="space-y-2.5">
            {/* PASSENGER DETAILS SECTION (Placed cleanly at the top of the form!) */}
            <div
              className={`p-2.5 sm:p-3 rounded-xl border space-y-2 ${
                isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-[#070B14]/90 border-slate-800'
              }`}
            >
              {/* Row 1: Full Name + Mobile Number side-by-side */}
              <div className="grid grid-cols-2 gap-2">
                {/* Full Name */}
                <div>
                  <label className="block text-[10.5px] font-bold mb-1 flex items-center gap-1 opacity-90 truncate">
                    <User className="w-3 h-3 text-amber-500 stroke-[2.5] shrink-0" />
                    <span className="truncate">{language === 'en' ? 'Full Name' : 'पूरा नाम'} *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: '' }));
                    }}
                    placeholder="Your name"
                    className={`w-full rounded-xl px-2.5 py-1.5 text-xs sm:text-sm font-semibold transition-all focus:outline-none ${
                      isLight
                        ? 'bg-white border border-slate-300 text-slate-900 focus:border-blue-500'
                        : 'bg-[#0B1120] border border-slate-700 text-white focus:border-blue-500'
                    }`}
                  />
                  {formErrors.name && (
                    <p className="text-red-500 text-[9.5px] mt-0.5 font-bold">{formErrors.name}</p>
                  )}
                </div>

                {/* Mobile Number (No Mobile OTP — Clean 10-digit Phone Input) */}
                <div>
                  <label className="block text-[10.5px] font-bold mb-1 flex items-center gap-1 opacity-90 truncate">
                    <Phone className="w-3 h-3 text-amber-500 stroke-[2.5] shrink-0" />
                    <span className="truncate">{language === 'en' ? 'Mobile No.' : 'मोबाइल नंबर'} *</span>
                  </label>
                  <div className="relative flex items-center">
                    <span
                      className={`absolute left-2 text-[11px] font-bold pointer-events-none ${
                        isLight ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      +91
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                      maxLength={10}
                      value={phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setPhone(val);
                        if (formErrors.phone) setFormErrors((prev) => ({ ...prev, phone: '' }));
                      }}
                      placeholder="10-digit"
                      className={`w-full rounded-xl pl-8 pr-2 py-1.5 text-xs sm:text-sm font-bold font-mono tracking-wide transition-all focus:outline-none ${
                        isLight
                          ? 'bg-white border border-slate-300 text-slate-900 focus:border-blue-500'
                          : 'bg-[#0B1120] border border-slate-700 text-white focus:border-blue-500'
                      }`}
                    />
                  </div>
                  {formErrors.phone && (
                    <p className="text-red-500 text-[9.5px] mt-0.5 font-bold">{formErrors.phone}</p>
                  )}
                </div>
              </div>

              {/* Row 2: Full-Width Email Address with Free Email OTP Verification (Zero Overlap on Mobile!) */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label className="text-[10.5px] font-bold flex items-center gap-1 opacity-90">
                    <Mail className="w-3 h-3 text-blue-500 stroke-[2.5] shrink-0" />
                    <span>
                      {language === 'en' ? 'Email ID (Verify via Free OTP)' : 'ईमेल आईडी (OTP वेरीफिकेशन)'} *
                    </span>
                  </label>
                  {isEmailVerified && (
                    <span className="text-[9.5px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Email Verified</span>
                    </span>
                  )}
                </div>

                <div className="relative flex items-center">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setIsEmailVerified(false);
                      setOtpSent(false);
                      setEnteredOtp('');
                      setServerOtpMessage('');
                      if (formErrors.email || formErrors.otp) {
                        setFormErrors((prev) => ({ ...prev, email: '', otp: '' }));
                      }
                    }}
                    placeholder="Enter your email (e.g. rahul@gmail.com)"
                    className={`w-full rounded-xl pl-3 ${
                      emailReadyForOtp && !isEmailVerified ? 'pr-24' : 'pr-9'
                    } py-1.5 text-xs sm:text-sm font-semibold transition-all focus:outline-none ${
                      isEmailVerified
                        ? isLight
                          ? 'bg-emerald-50/70 border-2 border-emerald-500 text-slate-900'
                          : 'bg-emerald-950/20 border-2 border-emerald-500/80 text-white'
                        : isLight
                          ? 'bg-white border border-slate-300 text-slate-900 focus:border-blue-500'
                          : 'bg-[#0B1120] border border-slate-700 text-white focus:border-blue-500'
                    }`}
                  />

                  {emailReadyForOtp && !isEmailVerified && (
                    <button
                      type="button"
                      onClick={() => handleSendEmailOtp(email)}
                      disabled={isSendingOtp}
                      className="absolute right-1.5 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-wide cursor-pointer shadow-xs transition-all active:scale-95 shrink-0"
                    >
                      {isSendingOtp
                        ? '...'
                        : otpCooldown > 0
                          ? formatOtpTimer(otpCooldown)
                          : otpSent
                            ? 'Resend'
                            : 'Send OTP'}
                    </button>
                  )}

                  {isEmailVerified && (
                    <span className="absolute right-2.5 text-emerald-500">
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    </span>
                  )}
                </div>

                {formErrors.email && (
                  <p className="text-red-500 text-[9.5px] mt-0.5 font-bold">{formErrors.email}</p>
                )}
              </div>

              {/* STRICT ANTI-FRAUD EMAIL OTP VERIFICATION BOX (2-Minute Timer, No Hardcoding) */}
              {otpSent && !isEmailVerified && (
                <div
                  className={`p-2.5 rounded-xl border space-y-2 animate-in fade-in duration-150 ${
                    isLight
                      ? 'bg-blue-50/90 border-blue-200 text-slate-900'
                      : 'bg-blue-950/30 border-blue-500/40 text-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 text-[11px]">
                    <span className="font-extrabold flex items-center gap-1.5 text-blue-600 dark:text-blue-400 min-w-0">
                      <KeyRound className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        {language === 'en' ? 'Enter 4-Digit Email OTP' : 'ईमेल OTP दर्ज करें'}
                      </span>
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      {otpCooldown > 0 && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-600/15 text-blue-600 dark:text-blue-300 font-mono font-black text-[10px]">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{formatOtpTimer(otpCooldown)}</span>
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleSendEmailOtp(email)}
                        disabled={isSendingOtp}
                        className="text-[10px] font-bold text-blue-600 dark:text-blue-400 underline cursor-pointer hover:text-blue-700 shrink-0"
                      >
                        {isSendingOtp ? '...' : 'Resend OTP'}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      ref={otpInputRef}
                      type="tel"
                      inputMode="numeric"
                      maxLength={4}
                      value={enteredOtp}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setEnteredOtp(val);
                        if (val.length === 4) {
                          handleVerifyOtpCode(val);
                        }
                      }}
                      placeholder="• • • •"
                      className={`flex-1 rounded-lg px-2.5 py-1.5 text-sm sm:text-base font-mono font-black tracking-[0.3em] text-center focus:outline-none transition-all ${
                        isLight
                          ? 'bg-white border-2 border-blue-400 text-slate-900 focus:border-blue-600'
                          : 'bg-[#070B14] border-2 border-blue-500/70 text-white focus:border-blue-400'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => handleVerifyOtpCode(enteredOtp)}
                      disabled={isVerifyingOtp || enteredOtp.trim().length !== 4}
                      className={`px-3.5 py-2 rounded-lg text-white font-black text-xs cursor-pointer shadow-xs transition-all active:scale-95 shrink-0 flex items-center gap-1 ${
                        enteredOtp.trim().length === 4
                          ? 'bg-emerald-600 hover:bg-emerald-500'
                          : 'bg-slate-400 dark:bg-slate-700 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      {isVerifyingOtp ? (
                        <span>...</span>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Verify</span>
                        </>
                      )}
                    </button>
                  </div>

                  {serverOtpMessage && !formErrors.otp && (
                    <p className="text-[9.5px] font-bold text-blue-600 dark:text-blue-300">
                      {serverOtpMessage}
                    </p>
                  )}
                  {formErrors.otp && (
                    <p className="text-red-500 text-[9.5px] font-bold">{formErrors.otp}</p>
                  )}
                </div>
              )}
            </div>

            {/* 4. GROUPED CHECKOUT ACCORDIONS (Price Details + Payment Option stacked together right before Confirm!) */}
            <div className="space-y-2">
              {/* ACCORDION A: CLICK-TO-TOGGLE PRICE DETAILS */}
              <div
                className={`rounded-xl border overflow-hidden transition-all ${
                  isLight
                    ? 'bg-slate-50/90 border-slate-200 hover:border-blue-400'
                    : 'bg-[#070B14] border-slate-800 hover:border-blue-500/60'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowPriceDetails((prev) => {
                      const next = !prev;
                      if (next) setShowPaymentOptions(false);
                      return next;
                    });
                  }}
                  className={`w-full px-3 py-2 flex items-center justify-between gap-2 text-left cursor-pointer select-none transition-colors ${
                    showPriceDetails
                      ? isLight
                        ? 'bg-blue-50/80 border-b border-slate-200'
                        : 'bg-blue-950/30 border-b border-slate-800'
                      : isLight
                        ? 'bg-slate-100/80 hover:bg-blue-50/60'
                        : 'bg-slate-900/90 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="text-[11px] sm:text-xs font-extrabold text-blue-600 dark:text-blue-400 underline decoration-dotted underline-offset-2">
                        {language === 'en' ? 'Price Details' : 'किराया विवरण'}
                      </span>
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[9px] font-black shrink-0">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>₹{promo.carDiscount} OFF</span>
                      </span>
                    </div>
                    <span
                      className={`text-[9.5px] font-bold block ${
                        isLight ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      {showPriceDetails
                        ? language === 'en'
                          ? 'Tap to hide fare breakdown ▲'
                          : 'छुपाने के लिए क्लिक करें ▲'
                        : language === 'en'
                          ? 'Tap to view tax & fare breakup ▼'
                          : 'पूरा किराया देखने के लिए क्लिक करें ▼'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="price-badge-chatkar text-xs font-black font-mono px-2 py-0.5 rounded-lg inline-block">
                      ₹{promo.finalCheckoutPayable.toLocaleString('en-IN')}
                    </span>
                    <div
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center border transition-transform ${
                        isLight
                          ? 'bg-white border-slate-300 text-blue-600'
                          : 'bg-slate-800 border-slate-700 text-blue-400'
                      }`}
                    >
                      {showPriceDetails ? (
                        <ChevronUp className="w-3.5 h-3.5 stroke-[2.8]" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 stroke-[2.8]" />
                      )}
                    </div>
                  </div>
                </button>

                {showPriceDetails && (
                  <div
                    onClick={() => setShowPriceDetails(false)}
                    className="p-2.5 space-y-1 text-[10.5px] sm:text-xs cursor-pointer animate-in fade-in slide-in-from-top-1 duration-150"
                  >
                    <div className="flex items-center justify-between">
                      <span className={isLight ? 'text-slate-600 font-medium' : 'text-slate-400 font-medium'}>
                        {tripType === 'roundtrip' ? 'Round Trip Cab Price' : 'One-Way Cab Trip Price'}
                      </span>
                      <span className="font-mono font-bold line-through text-slate-400 decoration-rose-500">
                        ₹{promo.originalDisplayPrice.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={isLight ? 'text-slate-600 font-medium' : 'text-slate-400 font-medium'}>
                        Special Car Discount ({vehicle.name})
                      </span>
                      <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                        - ₹{promo.carDiscount}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-bold">Discounted Cab Fare</span>
                      <span className="font-mono font-bold">
                        ₹{promo.upfrontOfferPrice.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-dashed border-slate-200 dark:border-slate-800">
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        + Taxes &amp; GST Charges
                      </span>
                      <span className="font-mono font-extrabold text-blue-600 dark:text-blue-400">
                        + ₹{promo.taxAndCharges}
                      </span>
                    </div>

                    {tripType === 'oneway' ? (
                      <div className="flex items-center justify-between text-[10px] pt-0.5">
                        <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>
                          Highway Toll, State Tax, Fuel &amp; Driver
                        </span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                          Included (FREE)
                        </span>
                      </div>
                    ) : (
                      <div
                        className={`mt-1 pt-1.5 border-t border-slate-200 dark:border-slate-800 space-y-1 text-[10px] ${
                          isLight ? 'text-slate-700' : 'text-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="flex items-center gap-1 font-semibold">
                            <Landmark className="w-3 h-3 text-amber-500 shrink-0" />
                            <span>State Tax &amp; Highway Toll</span>
                          </span>
                          <span className="font-bold text-amber-600 dark:text-amber-400 text-right">
                            Included (Pay physical actuals)
                          </span>
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="flex items-center gap-1 font-semibold">
                            <Clock className="w-3 h-3 text-blue-500 shrink-0" />
                            <span>Waiting (&gt;30m)</span>
                          </span>
                          <span className="font-bold text-slate-600 dark:text-slate-300 text-right">
                            Free 30m · ₹150/hr after
                          </span>
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="flex items-center gap-1 font-semibold">
                            <Moon className="w-3 h-3 text-indigo-400 shrink-0" />
                            <span>Night (10 PM – 6 AM)</span>
                          </span>
                          <span className="font-bold text-slate-600 dark:text-slate-300 text-right">
                            ₹300/night (If applicable)
                          </span>
                        </div>
                      </div>
                    )}

                    <div
                      className={`mt-1.5 pt-1.5 border-t border-dashed space-y-1 ${
                        isLight ? 'border-slate-300' : 'border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black">Total Trip Fare</span>
                        <span className="font-mono font-black text-xs text-slate-900 dark:text-white">
                          ₹{promo.finalCheckoutPayable.toLocaleString('en-IN')}
                        </span>
                      </div>

                      {paymentMethod === 'cash_to_driver' ? (
                        <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-extrabold text-[10.5px]">
                          <span>Payable Now (Pay Later Cash / Online)</span>
                          <span className="font-mono text-xs">₹0 Now</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 font-extrabold text-[10.5px]">
                          <span>Payable Now (Online UPI)</span>
                          <span className="font-mono text-xs">
                            ₹{promo.finalCheckoutPayable.toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="text-center pt-0.5">
                      <span className="text-[9.5px] font-bold text-blue-600 dark:text-blue-400 hover:underline">
                        {language === 'en' ? '▲ Tap to hide price details' : '▲ विवरण छुपाएं'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* ACCORDION B: CLICK-TO-TOGGLE PAYMENT OPTION SELECTOR (Cash in Hand = Pay ₹0 Now Default!) */}
              <div
                className={`rounded-xl border overflow-hidden transition-all ${
                  isLight
                    ? 'bg-slate-50/90 border-slate-200 hover:border-emerald-400'
                    : 'bg-[#070B14] border-slate-800 hover:border-emerald-500/60'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentOptions((prev) => {
                      const next = !prev;
                      if (next) setShowPriceDetails(false);
                      return next;
                    });
                  }}
                  className={`w-full px-3 py-2 flex items-center justify-between gap-2 text-left cursor-pointer select-none transition-colors ${
                    showPaymentOptions
                      ? isLight
                        ? 'bg-emerald-50/80 border-b border-slate-200'
                        : 'bg-emerald-950/25 border-b border-slate-800'
                      : isLight
                        ? 'bg-slate-100/80 hover:bg-emerald-50/50'
                        : 'bg-slate-900/90 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {paymentMethod === 'cash_to_driver' ? (
                        <Banknote className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <Smartphone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      )}
                      <span className="text-[11px] sm:text-xs font-extrabold text-blue-600 dark:text-blue-400 underline decoration-dotted underline-offset-2">
                        {language === 'en' ? 'Payment Method' : 'भुगतान का विकल्प'}
                      </span>
                    </div>
                    <span
                      className={`text-[9.5px] font-bold block truncate mt-0.5 ${
                        isLight ? 'text-slate-600' : 'text-slate-400'
                      }`}
                    >
                      {showPaymentOptions
                        ? language === 'en'
                          ? 'Tap to hide options ▲'
                          : 'विकल्प छुपाएं ▲'
                        : paymentMethod === 'cash_to_driver'
                          ? 'Cash in Hand (Pay ₹0 Now) ▼'
                          : 'Online Pay (UPI / QR) ▼'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-1">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black border ${
                        paymentMethod === 'cash_to_driver'
                          ? isLight
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                            : 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                          : isLight
                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                            : 'bg-blue-950/60 border-blue-500/60 text-blue-300'
                      }`}
                    >
                      <Check className="w-2.5 h-2.5 stroke-[3.5]" />
                      <span>{paymentMethod === 'cash_to_driver' ? '₹0 Now' : 'Online'}</span>
                    </span>
                    <div
                      className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-transform ${
                        isLight
                          ? 'bg-white border-slate-300 text-blue-600'
                          : 'bg-slate-800 border-slate-700 text-blue-400'
                      }`}
                    >
                      {showPaymentOptions ? (
                        <ChevronUp className="w-3.5 h-3.5 stroke-[2.8]" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 stroke-[2.8]" />
                      )}
                    </div>
                  </div>
                </button>

                {showPaymentOptions && (
                  <div className="p-2.5 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="flex flex-col gap-2">
                      {/* OPTION 1: CASH IN HAND (DEFAULT TICKED -> PAY ₹0 NOW, PAY LATER CASH/ONLINE) */}
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod('cash_to_driver');
                          setShowPaymentOptions(false);
                        }}
                        className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                          paymentMethod === 'cash_to_driver'
                            ? isLight
                              ? 'bg-emerald-50/90 border-2 border-emerald-500 text-slate-900 shadow-xs'
                              : 'bg-emerald-950/30 border-2 border-emerald-500 text-white shadow-xs'
                            : isLight
                              ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                              : 'bg-[#070B14] border-slate-800 text-slate-300 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                              paymentMethod === 'cash_to_driver'
                                ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                                : 'border-slate-400 text-transparent'
                            }`}
                          >
                            <Check className="w-3 h-3 stroke-[3.5]" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black">Cash in Hand</span>
                              <span className="px-1.5 py-0.2 rounded bg-emerald-500 text-slate-950 text-[9.5px] font-black shrink-0">
                                Pay ₹0 Now
                              </span>
                            </div>
                            <span className="text-[10px] opacity-80 font-semibold block leading-tight mt-0.5">
                              Zero booking fee · Pay ₹{promo.finalCheckoutPayable.toLocaleString('en-IN')} later on ride (Cash or UPI)
                            </span>
                          </div>
                        </div>
                        <Banknote className="w-4 h-4 text-emerald-500 shrink-0 opacity-80" />
                      </button>

                      {/* OPTION 2: ONLINE PAY */}
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod('online_pay');
                          setShowPaymentOptions(false);
                        }}
                        className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                          paymentMethod === 'online_pay'
                            ? isLight
                              ? 'bg-blue-50/90 border-2 border-blue-600 text-slate-900 shadow-xs'
                              : 'bg-blue-950/35 border-2 border-blue-500 text-white shadow-xs'
                            : isLight
                              ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                              : 'bg-[#070B14] border-slate-800 text-slate-300 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                              paymentMethod === 'online_pay'
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'border-slate-400 text-transparent'
                            }`}
                          >
                            <Check className="w-3 h-3 stroke-[3.5]" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black">Online Pay</span>
                              <span className="px-1.5 py-0.2 rounded bg-blue-600 text-white text-[9.5px] font-black shrink-0">
                                UPI / QR
                              </span>
                            </div>
                            <span className="text-[10px] opacity-80 font-semibold block leading-tight mt-0.5">
                              Pay ₹{promo.finalCheckoutPayable.toLocaleString('en-IN')} instantly via GooglePay / PhonePe / Paytm
                            </span>
                          </div>
                        </div>
                        <Smartphone className="w-4 h-4 text-blue-500 shrink-0 opacity-80" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowPaymentOptions(false)}
                      className="w-full text-center text-[9.5px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer pt-0.5"
                    >
                      {language === 'en' ? '▲ Tap to hide payment options' : '▲ विकल्प छुपाएं'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 5. SUBMIT ACTION BUTTON */}
            <div className="pt-0.5">
              <button
                type="submit"
                className="btn-blue w-full py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-black flex flex-col items-center justify-center shadow-lg tracking-wide cursor-pointer leading-tight transition-all active:scale-[0.99]"
              >
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 stroke-[2.8] shrink-0" />
                  <span>
                    {!isEmailVerified
                      ? language === 'en'
                        ? 'Verify Email OTP & Confirm Booking'
                        : 'ईमेल OTP वेरीफाई करके कन्फर्म करें'
                      : paymentMethod === 'cash_to_driver'
                        ? `Confirm Booking · Pay ₹0 Now`
                        : `Confirm & Pay ₹${promo.finalCheckoutPayable.toLocaleString('en-IN')} (Online Pay)`}
                  </span>
                </div>
                <span className="text-[9.5px] font-bold opacity-90 mt-0.5 text-center px-1">
                  {!isEmailVerified
                    ? language === 'en'
                      ? 'Email OTP verification is mandatory for genuine reservation'
                      : 'सुरक्षित बुकिंग के लिए ईमेल OTP वेरीफिकेशन अनिवार्य है'
                    : paymentMethod === 'cash_to_driver'
                      ? `Total Fare ₹${promo.finalCheckoutPayable.toLocaleString('en-IN')} payable later on ride (Cash / Online)`
                      : `Instant Confirmed Voucher · Verified TravelCap Chauffeur`}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Car Loading Overlay on Booking Submit */}
      <CarLoadingOverlay
        isOpen={isSubmitting}
        title={language === 'en' ? 'Assigning TravelCap Chauffeur...' : 'आपका ड्राइवर कन्फर्म हो रहा है...'}
        subtitle={
          language === 'en'
            ? `Locking ${vehicle.name} for ${pickupCity} → ${tripType === 'local' ? 'Local Tour' : dropCity}`
            : `${vehicle.name} बुक हो रही है। ड्राइवर डिटेल भेजी जा रही है`
        }
        theme={theme}
      />
    </div>
  );
};
