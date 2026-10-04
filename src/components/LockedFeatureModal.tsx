import React from 'react';
import { X, Lock, Phone, MessageSquare, Sparkles } from 'lucide-react';
import { COMPANY_PHONE, COMPANY_WHATSAPP } from '../data/cabsData';

interface LockedFeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  serviceName: string;
  description?: string;
  theme: 'dark' | 'light';
  language?: 'en' | 'hi';
}

export const LockedFeatureModal: React.FC<LockedFeatureModalProps> = ({
  isOpen,
  onClose,
  title,
  serviceName,
  description,
  theme,
  language = 'en',
}) => {
  if (!isOpen) return null;
  const isLight = theme === 'light';

  const defaultDescription =
    title.toLowerCase().includes('taxi') || title.toLowerCase().includes('attach')
      ? language === 'en'
        ? 'Our automated Cab & Driver Partner onboarding system is launching soon. To attach your commercial taxi or partner with us today, please Contact Us directly.'
        : 'हमारा ड्राइवर और कैब पार्टनर ऑनबोर्डिंग पोर्टल जल्द ही लाइव हो रहा है। अपनी कमर्शियल गाड़ी जोड़ने के लिए हमारे हेल्पलाइन नंबर पर तुरंत संपर्क (Contact Us) करें।'
      : title.toLowerCase().includes('round')
        ? language === 'en'
          ? 'Our automated multi-day round trip highway service is launching soon. For round-trip quotes and custom itineraries, please Contact Us directly.'
          : 'हमारा मल्टी-डे राउंड ट्रिप हाईवे नेटवर्क जल्द ही लाइव हो रहा है। विशेष राउंड-ट्रिप पूछताछ एवं बुकिंग के लिए सीधे हमसे संपर्क (Contact Us) करें।'
        : language === 'en'
          ? 'Our flight-tracked airport cab service portal is launching soon. For immediate airport transfers, please Contact Us directly.'
          : 'फ्लाइट ट्रैक्ड एयरपोर्ट कैब सेवा का नया अपडेट जल्द आ रहा है। तत्काल एयरपोर्ट ट्रांसफर के लिए कृपया हमसे संपर्क (Contact Us) करें।';

  const finalDescription = description || defaultDescription;

  const whatsappMessage = encodeURIComponent(
    `Hello TripWithCar, I am interested in "${serviceName}". Please share details with me.`
  );
  const whatsappUrl = `https://wa.me/91${COMPANY_WHATSAPP.replace(/\D/g, '')}?text=${whatsappMessage}`;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-md rounded-3xl border shadow-2xl p-6 sm:p-7 overflow-hidden transition-all ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0B1120] border-slate-800 text-white'
        }`}
      >
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="text-center pt-2">
          {/* Lock Icon */}
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/10">
            <Lock className="w-7 h-7 stroke-[2.5]" />
          </div>

          {/* Under Launch Tag */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-2.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Feature Under Launch</span>
          </div>

          {/* Service Title */}
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">
            {serviceName}
          </h3>

          {/* Description */}
          <p
            className={`text-xs sm:text-sm leading-relaxed max-w-sm mx-auto mb-6 ${
              isLight ? 'text-slate-600' : 'text-slate-300'
            }`}
          >
            {finalDescription}
          </p>

          {/* Contact Us Actions */}
          <div className="space-y-2.5">
            {/* Direct Call - Contact Us */}
            <a
              href={`tel:${COMPANY_PHONE.replace(/\s+/g, '')}`}
              className="btn-gold w-full py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold shadow-md cursor-pointer transition-all"
            >
              <Phone className="w-4 h-4 stroke-[2.8]" />
              <span>Contact Us: Call Helpline</span>
            </a>

            {/* WhatsApp - Contact Us */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 text-xs font-bold shadow-md cursor-pointer transition-all"
            >
              <MessageSquare className="w-4 h-4 stroke-[2.5]" />
              <span>Contact Us on WhatsApp</span>
            </a>

            {/* Dismiss */}
            <button
              type="button"
              onClick={onClose}
              className={`w-full py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                isLight
                  ? 'border-slate-200 text-slate-700 hover:bg-slate-100'
                  : 'border-slate-800 text-slate-300 hover:bg-slate-900'
              }`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
