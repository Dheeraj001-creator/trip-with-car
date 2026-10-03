import React from 'react';
import { Phone, Mail, MapPin, ShieldCheck, Car, ArrowUp, Lock } from 'lucide-react';
import { COMPANY_PHONE, COMPANY_EMAIL, OFFICE_ADDRESS, COMPANY_NAME } from '../data/cabsData';

interface FooterProps {
  onScrollToSection: (id: string) => void;
  onOpenTrackBooking: () => void;
  onOpenDriverPartner: () => void;
  language: 'en' | 'hi';
  theme: 'dark' | 'light';
}

export const Footer: React.FC<FooterProps> = ({
  onScrollToSection,
  onOpenTrackBooking,
  onOpenDriverPartner,
  language,
  theme,
}) => {
  const isLight = theme === 'light';

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className={`border-t text-xs transition-colors ${
      isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-[#090D16] border-slate-800 text-slate-400'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-10">
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isLight ? 'bg-white border border-slate-300 text-blue-600 shadow-xs' : 'bg-slate-900 border border-slate-700 text-blue-400'
              }`}>
                <Car className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-0.5">
                  <span className={`text-base font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>TripWith</span>
                  <span className="text-base font-black tracking-tight text-blue-600">Car</span>
                </div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                  Intercity Chauffeur Services
                </p>
              </div>
            </div>

            <p className="text-xs leading-relaxed pr-6">
              TripWithCar provides scheduled intercity transportation, airport transfers, and spiritual corridor tours throughout Varanasi, Ayodhya, Prayagraj, Lucknow, Delhi NCR, and adjoining interstate routes with transparent tariff pricing.
            </p>

            <div className={`space-y-2 pt-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>{OFFICE_ADDRESS}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-500 shrink-0" />
                <a href={`tel:${COMPANY_PHONE.replace(/\s+/g, '')}`} className="hover:text-blue-600 font-bold transition-colors">
                  {COMPANY_PHONE} (24/7 Helpline)
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                <a href={`mailto:${COMPANY_EMAIL}`} className="hover:text-blue-600 transition-colors">
                  {COMPANY_EMAIL}
                </a>
              </div>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className={`text-xs font-black uppercase tracking-wider mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Quick Navigation
            </h4>
            <ul className="space-y-2.5">
              <li>
                <button
                  type="button"
                  onClick={() => onScrollToSection('booking')}
                  className="hover:text-blue-600 transition-colors cursor-pointer text-left font-medium"
                >
                  Book Outstation Cab
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onScrollToSection('routes')}
                  className="hover:text-blue-600 transition-colors cursor-pointer text-left font-medium"
                >
                  Highway Corridors (24)
                </button>
              </li>

              <li>
                <button
                  type="button"
                  onClick={() => onScrollToSection('fleet')}
                  className="hover:text-blue-600 transition-colors cursor-pointer text-left font-medium"
                >
                  Vehicle Fleet &amp; Tariffs
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenTrackBooking}
                  className="hover:text-blue-600 transition-colors cursor-pointer text-left text-blue-600 font-bold"
                >
                  Track Reservation (PNR)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenDriverPartner}
                  className="hover:text-amber-500 transition-colors cursor-pointer text-left font-medium inline-flex items-center gap-1.5 opacity-70 filter blur-[0.4px] hover:blur-none hover:opacity-100"
                >
                  <span>Attach Taxi (Partner)</span>
                  <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-amber-500/15 text-amber-500 text-[9px] font-bold border border-amber-500/30">
                    <Lock className="w-2 h-2 stroke-[2.8]" />
                    <span>Soon</span>
                  </span>
                </button>
              </li>
            </ul>
          </div>

          {/* Corridors */}
          <div>
            <h4 className={`text-xs font-black uppercase tracking-wider mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Regular Corridors
            </h4>
            <ul className="space-y-2 text-[11px]">
              <li>Varanasi to Ayodhya Expressway</li>
              <li>Varanasi to Prayagraj NH-19</li>
              <li>Varanasi Airport to Cantt / Ghats</li>
              <li>Varanasi to Bodh Gaya Highway</li>
              <li>Ayodhya to Prayagraj Sangam</li>
              <li>New Delhi to Agra Yamuna Exp</li>
              <li>New Delhi to Jaipur Pink City</li>
              <li>Kashi Darshan 8h/80km Chauffeur</li>
            </ul>
          </div>

          {/* Assurance */}
          <div>
            <h4 className={`text-xs font-black uppercase tracking-wider mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Safety &amp; Compliance
            </h4>
            <div className="space-y-3">
              <div className={`p-3 rounded-xl border space-y-1 ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#0F172A] border-slate-800'
              }`}>
                <div className={`flex items-center gap-1.5 text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                  <span>Commercial Yellow Plate</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Every cab carries valid commercial taxi permits, fitness certificates, and passenger insurance.
                </p>
              </div>

              <div className={`p-3 rounded-xl border space-y-1 ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#0F172A] border-slate-800'
              }`}>
                <div className={`flex items-center gap-1.5 text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                  <span>GPS Telematics</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Fleet tracked via centralized transport management systems for route safety.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className={`pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${
          isLight ? 'border-slate-200' : 'border-slate-800'
        }`}>
          <p className="text-[11px] text-center sm:text-left">
            © {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved. Outstation &amp; Airport Mobility.
          </p>

          <button
            type="button"
            onClick={scrollToTop}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
              isLight ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50' : 'bg-[#0F172A] border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <span>Top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};
