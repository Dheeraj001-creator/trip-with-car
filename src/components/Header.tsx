import React, { useState } from 'react';
import { Phone, MessageSquare, ShieldCheck, MapPin, Search, Menu, X, Car, UserCheck, Sun, Moon, Sparkles } from 'lucide-react';
import { COMPANY_PHONE, COMPANY_WHATSAPP } from '../data/cabsData';

interface HeaderProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onOpenTrackBooking: () => void;
  onOpenDriverPartner: () => void;
  language?: 'en' | 'hi';
  onToggleLanguage?: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenTrackBooking,
  onOpenDriverPartner,
  theme,
  onToggleTheme,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isLight = theme === 'light';

  const navItems = [
    { id: 'booking', label: 'Book Cab' },
    { id: 'routes', label: 'Popular Routes' },
    { id: 'fleet', label: 'Our Cars' },
  ];

  return (
    <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-200 ${
      isLight 
        ? 'bg-white/95 border-slate-200 text-slate-900 shadow-sm' 
        : 'bg-[#04070F]/95 border-slate-800 text-slate-100'
    }`}>
      {/* Top Utility Bar with High-Contrast Typography & Spacing */}
      <div className={`border-b text-xs py-2 px-3 sm:px-4 transition-colors ${
        isLight
          ? 'bg-slate-50 border-slate-200 text-slate-700'
          : 'bg-[#070B14] border-slate-800/80 text-slate-300'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5 sm:gap-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-bold text-[11px] sm:text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Verified Commercial Chauffeurs &amp; Clean Fleet</span>
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            {/* Theme Logo / Icon Button (ONLY LOGO) */}
            <button
              type="button"
              onClick={onToggleTheme}
              className={`p-2 rounded-xl border transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center ${
                isLight
                  ? 'bg-white border-slate-300 text-amber-600 hover:bg-amber-50 shadow-xs'
                  : 'bg-[#0F172A] border-slate-700 text-amber-400 hover:bg-slate-800 shadow-xs'
              }`}
              title={isLight ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
              aria-label="Toggle Theme"
            >
              {isLight ? (
                <Sun className="w-4 h-4 text-amber-500 fill-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-amber-400 fill-amber-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Corporate Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <button
          onClick={() => onSelectTab('booking')}
          className="flex items-center gap-3.5 text-left group cursor-pointer"
        >
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all bg-gradient-to-br from-amber-500 via-amber-400 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/35 group-hover:scale-108 group-hover:rotate-2">
            <Car className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className={`text-2xl font-black tracking-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
                TripWith
              </span>
              <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">
                Car
              </span>
            </div>
            <p className={`text-[10px] font-black tracking-widest uppercase -mt-0.5 ${
              isLight ? 'text-slate-500' : 'text-slate-400'
            }`}>
              Chauffeur Cabs &amp; Outstation
            </p>
          </div>
        </button>

        {/* Desktop Nav Items */}
        <nav className="hidden lg:flex items-center gap-1.5 text-xs font-semibold">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`px-3.5 py-2 rounded-xl transition-colors duration-150 cursor-pointer select-none whitespace-nowrap ${
                activeTab === item.id
                  ? 'bg-amber-500 border border-amber-400 text-slate-950 font-bold shadow-sm'
                  : isLight
                    ? 'border border-transparent text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                    : 'border border-transparent text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Action Controls with Gold Theme */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={onOpenDriverPartner}
            className={`hidden xl:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer hover:-translate-y-0.5 ${
              isLight
                ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-500" />
            <span>Attach Taxi</span>
          </button>

          {/* CALL PHONE NUMBER BUTTON */}
          <a
            href="tel:6387922889"
            className="btn-gold flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold"
          >
            <Phone className="w-3.5 h-3.5 stroke-[3]" />
            <span>6387922889</span>
          </a>
        </div>

        {/* Mobile menu toggle */}
        <div className="flex sm:hidden items-center gap-2">
          <a
            href="tel:6387922889"
            className="btn-gold p-2 rounded-xl flex items-center justify-center text-xs"
            title="Call 6387922889"
          >
            <Phone className="w-4 h-4 stroke-[2.8]" />
          </a>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`p-2 rounded-lg ${isLight ? 'text-slate-800' : 'text-slate-200'}`}
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className={`sm:hidden border-b px-5 pt-4 pb-6 space-y-4 ${
          isLight ? 'bg-white border-slate-200 text-slate-900 shadow-xl' : 'bg-[#04070F] border-slate-800 text-white shadow-xl'
        }`}>
          <div className="grid grid-cols-2 gap-2.5 pb-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`text-left px-4 py-2.5 rounded-xl border text-xs font-semibold transition-colors ${
                  activeTab === item.id
                    ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold shadow-sm'
                    : isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-800'
                      : 'bg-slate-900 border-slate-800 text-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="pt-2 border-t flex flex-col gap-2.5">
            <a
              href="tel:6387922889"
              className="btn-gold w-full py-3.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold"
            >
              <Phone className="w-4 h-4 stroke-[3]" />
              <span>Call: 6387922889</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
