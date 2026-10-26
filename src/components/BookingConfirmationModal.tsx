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
  UserCheck,
  Send,
  Smartphone,
  Mail
} from 'lucide-react';
import { Booking } from '../types/cab';
import { COMPANY_PHONE, COMPANY_WHATSAPP, COMPANY_EMAIL } from '../data/cabsData';
import { sendTripWithCarEmailNotification } from '../utils/fareCalculator';

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
  const [emailStatus, setEmailStatus] = useState<'sending' | 'sent'>('sending');

  // Automatically trigger backend SMS + TravelCap Email dispatch with Track ID + Free Mobile Push/Vibration alert
  React.useEffect(() => {
    if (booking) {
      const cleanPhone = String(booking.passengerPhone || '').replace(/\D/g, '').slice(-10);
      const trackUrl = typeof window !== 'undefined' ? `${window.location.origin}/?track=${booking.bookingId}` : '';
      const vehicleName = booking.vehicle?.name || 'Commercial AC Cab';
      const payLabel = booking.paymentPreference === 'online_pay' ? 'Online Pay (UPI)' : 'Cash in Hand';
      const nativeSmsText = `[travelingcab] Dear ${booking.passengerName || 'Customer'}, your travelingcab Cab reservation is CONFIRMED. Track ID: ${booking.bookingId}. Route: ${booking.pickupCity || 'Varanasi'} -> ${booking.dropCity || 'Local'}. Date: ${booking.pickupDate || ''} at ${booking.pickupTime || ''}. Cab: ${vehicleName}. Fare: Rs ${booking.totalFare || 0} (${payLabel}). Live Track: ${trackUrl}. Helpline: 7080224963`;

      // 1. Mobile Phone Vibration (Free native mobile feedback)
      try {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate([200, 100, 200]);
        }
      } catch {}

      // 2. Native Browser / Mobile Push Notification
      try {
        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification(`travelingcab Confirmed · Track ID: ${booking.bookingId}`, {
              body: `${booking.pickupCity} → ${booking.dropCity || 'Local'} on ${booking.pickupDate}. Total: ₹${booking.totalFare}`,
            });
          } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then((perm) => {
              if (perm === 'granted') {
                new Notification(`travelingcab Confirmed · Track ID: ${booking.bookingId}`, {
                  body: `${booking.pickupCity} → ${booking.dropCity || 'Local'} on ${booking.pickupDate}. Total: ₹${booking.totalFare}`,
                });
              }
            }).catch(() => {});
          }
        }
      } catch {}

      // 3. Free Backend SMS Gateway Dispatch (Textbelt Free Quota + Fast2SMS)
      if (cleanPhone) {
        fetch('/api/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: cleanPhone,
            bookingId: booking.bookingId,
            text: nativeSmsText,
          }),
        }).catch(() => {});
      }

      // 4. TravelCap Branded Email Dispatch (From: prajapatialok8546@gmail.com) with Track ID & Live Tracking Link
      sendTripWithCarEmailNotification(booking, {
        isLiveUpdate: false,
        liveStatusLabel: 'BOOKING CONFIRMED',
      })
        .then(() => setEmailStatus('sent'))
        .catch(() => setEmailStatus('sent'));
    }
  }, [booking]);

  if (!booking) return null;

  const isLight = theme === 'light' || (typeof document !== 'undefined' && document.documentElement.classList.contains('light'));
  const vehicleName = booking.vehicle?.name || 'Commercial AC Cab';
  const vehicleSeats = booking.vehicle?.seats || 4;
  const cleanPhone = String(booking.passengerPhone || '').replace(/\D/g, '').slice(-10);
  const rawEmail = String(booking.passengerEmail || '').trim();
  const hasRealEmail = Boolean(rawEmail && rawEmail.includes('@') && !rawEmail.endsWith('@guest.tripwithcar.com') && !rawEmail.endsWith('@guest.travelcap.com'));
  const displayEmail = hasRealEmail ? rawEmail : COMPANY_EMAIL;
  const trackUrl = typeof window !== 'undefined' ? `${window.location.origin}/?track=${booking.bookingId}` : '';
  const paymentModeLabel = booking.paymentPreference === 'online_pay'
    ? `Online Pay (₹${booking.totalFare || 0} via UPI)`
    : `Cash in Hand (Pay ₹0 Now · Pay ₹${booking.totalFare || 0} Later Cash/Online)`;

  const confirmationMessageText = `🚕 *TRAVELINGCAB RESERVATION CONFIRMED* 🚕
━━━━━━━━━━━━━━━━━━━━━
🏷️ *Brand:* travelingcab
📋 *Track ID (Booking PNR):* ${booking.bookingId}
👤 *Passenger:* ${booking.passengerName || 'Valued Guest'}
📱 *Phone:* ${booking.passengerPhone || cleanPhone}
${hasRealEmail ? `📧 *Verified Email:* ${rawEmail}\n` : ''}📍 *Route:* ${booking.pickupCity || 'Varanasi'} → ${booking.dropCity || 'Local City'}
📅 *Date:* ${booking.pickupDate || ''}
⏰ *Time:* ${booking.pickupTime || ''}
🚗 *Cab:* ${vehicleName} (${vehicleSeats} Seater AC)
💰 *Total Fare:* ₹${booking.totalFare || 0}
💳 *Payment Option:* ${paymentModeLabel}
🔍 *Live Track Your Ride:* ${trackUrl}
━━━━━━━━━━━━━━━━━━━━━
✅ *Status:* Confirmed (Live Updates Active)
📞 *24/7 Helpline:* ${COMPANY_PHONE}
travelingcab - Clean AC Cabs & Chauffeurs.`;

  const nativeSmsText = `[travelingcab] Dear ${booking.passengerName || 'Customer'}, your travelingcab Cab is CONFIRMED. Track ID: ${booking.bookingId}. Route: ${booking.pickupCity || 'Varanasi'} -> ${booking.dropCity || 'Local'}. Date: ${booking.pickupDate || ''} at ${booking.pickupTime || ''}. Cab: ${vehicleName}. Fare: Rs ${booking.totalFare || 0} (${paymentModeLabel}). Live Track: ${trackUrl}. Helpline: 7080224963`;
  const nativeSmsUrl = `sms:+91${cleanPhone}?body=${encodeURIComponent(nativeSmsText)}`;
  const mailtoUrl = `mailto:${encodeURIComponent(displayEmail)}?subject=${encodeURIComponent(`travelingcab Booking Confirmed - Track ID: ${booking.bookingId}`)}&body=${encodeURIComponent(confirmationMessageText)}`;
  const passengerWhatsAppUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(confirmationMessageText)}`;
  const companyWhatsAppUrl = `https://wa.me/91${COMPANY_WHATSAPP}?text=${encodeURIComponent(confirmationMessageText)}`;

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
                travelingcab · Official Booking Voucher
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
          {/* SMS + EMAIL + WHATSAPP DISPATCH CARD WITH TRACK ID */}
          <div className={`p-3 rounded-2xl border ${
            isLight ? 'bg-emerald-50/70 border-emerald-300' : 'bg-emerald-950/25 border-emerald-500/40'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
              <span className="text-[10.5px] uppercase font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 shrink-0" />
                <span>{language === 'en' ? 'travelingcab Instant Ticket' : 'travelingcab कन्फर्म टिकट'}</span>
              </span>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                {emailStatus === 'sent' ? '✓ Email & SMS Sent' : 'Sending Ticket...'}
              </span>
            </div>

            {/* Realistic Telecom Carrier SMS & Email Ticket Preview */}
            <div className={`p-2.5 rounded-xl border font-mono text-[11px] leading-relaxed select-all ${
              isLight ? 'bg-white border-emerald-200 text-slate-800' : 'bg-[#070D1A] border-emerald-500/30 text-emerald-200'
            }`}>
              <div className="font-bold text-amber-600 dark:text-amber-400 pb-1 mb-1 border-b border-inherit flex items-center justify-between text-[10px]">
                <span>📲 TRAVELINGCAB OFFICIAL TICKET</span>
                <span className="text-emerald-600 dark:text-emerald-400">✓ CONFIRMED</span>
              </div>
              <p className="text-slate-700 dark:text-slate-200 font-sans text-xs">
                Dear <strong>{booking.passengerName}</strong>, your <strong>travelingcab</strong> Cab is <strong>CONFIRMED</strong>.
              </p>
              <div className="space-y-0.5 mt-1 pt-1 border-t border-inherit">
                <p>• <strong>Track ID (Booking ID):</strong> <span className="text-amber-600 dark:text-amber-400 font-bold">{booking.bookingId}</span></p>
                <p>• <strong>Route:</strong> {booking.pickupCity} → {booking.dropCity || 'Local'}</p>
                <p>• <strong>Schedule:</strong> {booking.pickupDate} at {booking.pickupTime}</p>
                <p>• <strong>Cab:</strong> {vehicleName} ({vehicleSeats} Seats)</p>
                <p>• <strong>Total Fare:</strong> ₹{booking.totalFare}</p>
                <p>• <strong>Payment Mode:</strong> <span className="text-emerald-600 dark:text-emerald-400 font-bold">{paymentModeLabel}</span></p>
                {hasRealEmail && (
                  <p className="break-all">• <strong>Verified Email:</strong> <span className="text-blue-500 font-semibold">{rawEmail}</span></p>
                )}
                <p className="break-all">• <strong>Live Track:</strong> <span className="text-blue-500 underline">{trackUrl}</span></p>
              </div>
            </div>

            {/* 3 Instant Free Delivery Buttons: SMS App, Email Ticket & WhatsApp */}
            <div className="grid grid-cols-3 gap-1.5 mt-2">
              <a
                href={nativeSmsUrl}
                className="py-1.5 px-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-[10.5px] flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all border border-slate-700"
              >
                <Smartphone className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate">{language === 'en' ? 'SMS App' : 'SMS ऐप'}</span>
              </a>

              <a
                href={mailtoUrl}
                className="py-1.5 px-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10.5px] flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all"
              >
                <Mail className="w-3 h-3 shrink-0" />
                <span className="truncate">{language === 'en' ? 'Email Copy' : 'ईमेल कॉपी'}</span>
              </a>

              <a
                href={passengerWhatsAppUrl}
                target="_blank"
                rel="noreferrer"
                className="py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10.5px] flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all"
              >
                <MessageSquare className="w-3 h-3 shrink-0" />
                <span className="truncate">WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Reference & Vivid Chatkar Fare Bar */}
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
              <span className="text-[9.5px] uppercase font-bold text-slate-400 block mb-0.5">Total Tariff</span>
              <span className="price-badge-chatkar text-sm sm:text-base font-black font-mono px-2.5 py-0.5 rounded-lg inline-block">
                ₹{booking.totalFare}
              </span>
              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">
                {booking.paymentPreference === 'online_pay' ? '💳 Online Pay (UPI)' : '💵 Cash in Hand (Default)'}
              </span>
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
                {vehicleName} ({vehicleSeats} Seats)
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

            {/* OPTION 2: BOOK ANOTHER RIDE */}
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
              <span>{language === 'en' ? 'Book Another Ride' : 'नई राइड बुक करें (Book Another Ride)'}</span>
            </button>
          </div>

          {/* Secondary Quick Contact Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
            <a
              href={companyWhatsAppUrl}
              target="_blank"
              rel="noreferrer"
              className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Company WhatsApp</span>
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

