import React, { useState } from 'react';
import { Phone, MessageSquare, ShieldCheck, MapPin, Search, Menu, X, Car, UserCheck, Sun, Moon, Sparkles, Lock, Compass, Navigation } from 'lucide-react';
import { COMPANY_PHONE, COMPANY_WHATSAPP } from '../data/cabsData';

interface HeaderProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onOpenTrackBooking: () => void;
  onOpenDriverPartner: () => void;
  onOpenAdmin?: () => void;
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
  onOpenAdmin,
  language = 'en',
  theme,
  onToggleTheme,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isLight = theme === 'light';

  const navItems = [
    { id: 'booking', label: language === 'hi' ? 'कैब बुकिंग' : 'Book Cab' },
    { id: 'routes', label: language === 'hi' ? 'प्रमुख रूट्स' : 'Popular Routes' },
    { id: 'fleet', label: language === 'hi' ? 'हमारी गाड़ियां' : 'Our Cars' },
    { id: 'reviews', label: language === 'hi' ? 'समीक्षाएं' : 'Reviews' },
  ];

  return (
    <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-200 ${
      isLight 
        ? 'bg-white/95 border-slate-200 text-slate-900 shadow-sm' 
        : 'bg-[#04070F]/95 border-slate-800 text-slate-100'
    }`}>
      {/* Top Utility Bar - Clean Right-Aligned Track Ride & Theme Toggle (No "Verified AC Cabs" text) */}
      <div className={`border-b text-xs py-1.5 px-2.5 sm:px-6 transition-colors ${
        isLight
          ? 'bg-slate-50 border-slate-200 text-slate-700'
          : 'bg-[#070B14] border-slate-800/80 text-slate-300'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-end gap-2">
          <div className="flex items-center gap-2 shrink-0">
            {/* Top Track Reservation Pill */}
            <button
              type="button"
              onClick={onOpenTrackBooking}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl text-[10.5px] sm:text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
                isLight
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-800 hover:bg-amber-500/25 shadow-xs'
                  : 'bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500/25 shadow-xs'
              }`}
              title="Track Your Cab Reservation Live"
            >
              <Compass className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{language === 'hi' ? 'ट्रैक बुकिंग' : 'Track Ride'}</span>
            </button>

            {/* Theme Logo / Icon Button */}
            <button
              type="button"
              onClick={onToggleTheme}
              className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                isLight
                  ? 'bg-white border-slate-300 text-amber-600 hover:bg-amber-50 shadow-xs'
                  : 'bg-[#0F172A] border-slate-700 text-amber-400 hover:bg-slate-800 shadow-xs'
              }`}
              title={isLight ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
              aria-label="Toggle Theme"
            >
              {isLight ? (
                <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 fill-amber-500" />
              ) : (
                <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 fill-amber-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar - 100% Responsive on Mobile (320px+) & Desktop */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-15 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo */}
        <button
          type="button"
          onClick={() => {
            onSelectTab('booking');
            setMobileMenuOpen(false);
          }}
          className="flex items-center gap-2 sm:gap-3 text-left group cursor-pointer min-w-0 shrink"
        >
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all bg-gradient-to-br from-amber-500 via-amber-400 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/35 shrink-0">
            <Car className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-0.5 leading-none">
              <span className={`text-lg sm:text-2xl font-black tracking-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
                traveling
              </span>
              <span className="text-lg sm:text-2xl font-black tracking-tight bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">
                cab
              </span>
            </div>
            <p className={`text-[8.5px] sm:text-[10px] font-black tracking-wider sm:tracking-widest uppercase truncate mt-0.5 ${
              isLight ? 'text-slate-500' : 'text-slate-400'
            }`}>
              Outstation &amp; Local Cabs
            </p>
          </div>
        </button>

        {/* Desktop Nav Items */}
        <nav className="hidden md:flex items-center gap-1.5 text-xs font-semibold shrink-0">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`px-3.5 py-2 rounded-xl transition-colors duration-150 cursor-pointer select-none whitespace-nowrap ${
                activeTab === item.id
                  ? 'tab-blue-active font-bold shadow-sm'
                  : isLight
                    ? 'border border-transparent text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                    : 'border border-transparent text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Desktop Action Controls */}
        <div className="hidden md:flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenDriverPartner}
            className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              isLight
                ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 bg-slate-50/80'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800 bg-slate-900/60'
            }`}
            title="Add Taxi / Partner Attachment (Coming Soon)"
          >
            <div className="flex items-center gap-1.5 opacity-70 filter blur-[0.3px]">
              <UserCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="whitespace-nowrap">Add Taxi</span>
            </div>
            <span className="filter-none opacity-100 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-black shadow-xs ml-0.5 tracking-wide shrink-0">
              <Lock className="w-2.5 h-2.5 stroke-[3]" />
              <span>Soon</span>
            </span>
          </button>

          <a
            href="tel:7080224963"
            className="btn-gold inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
            title="Contact Us: 7080224963"
          >
            <Phone className="w-3.5 h-3.5 stroke-[2.8] shrink-0" />
            <span className="whitespace-nowrap">Contact Us</span>
          </a>
        </div>

        {/* Mobile Controls (< 768px): Compact Contact Us + Icon-Only Menu Button (No "Menu" text) */}
        <div className="flex md:hidden items-center gap-1.5 shrink-0">
          <a
            href="tel:7080224963"
            className="btn-gold inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl text-[11px] font-bold cursor-pointer whitespace-nowrap shrink-0"
            title="Contact Us: 7080224963"
          >
            <Phone className="w-3 h-3 stroke-[2.8] shrink-0" />
            <span className="whitespace-nowrap">Contact Us</span>
          </a>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
              mobileMenuOpen
                ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-sm'
                : isLight
                  ? 'bg-slate-100 border-slate-300 text-slate-900 hover:bg-slate-200'
                  : 'bg-slate-900 border-amber-500/50 text-amber-400 hover:bg-slate-800'
            }`}
            aria-label="Toggle Navigation Menu"
            title="Menu"
          >
            {mobileMenuOpen ? (
              <X className="w-4 h-4 stroke-[2.8] shrink-0" />
            ) : (
              <Menu className="w-4 h-4 stroke-[2.8] shrink-0" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu (Shows all 4 sections inside menu, without Admin button) */}
      {mobileMenuOpen && (
        <div className={`md:hidden border-t border-b px-3.5 pt-3.5 pb-5 space-y-3 animate-in slide-in-from-top-2 duration-150 ${
          isLight ? 'bg-white border-slate-200 text-slate-900 shadow-2xl' : 'bg-[#070B14] border-slate-800 text-white shadow-2xl'
        }`}>
          <div className="text-[10px] font-black uppercase tracking-wider text-amber-500 px-1">
            {language === 'hi' ? 'नेविगेशन मेनू (Sections)' : 'Navigation Menu (Select Section)'}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`text-left px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                  activeTab === item.id
                    ? 'tab-blue-active font-black shadow-sm'
                    : isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                      : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span className="truncate">{item.label}</span>
                <span className="text-[10px] opacity-75">→</span>
              </button>
            ))}
          </div>

          {/* Add Taxi in Mobile Menu with Clear Lock Badge */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                onOpenDriverPartner();
                setMobileMenuOpen(false);
              }}
              className={`w-full py-2.5 px-3.5 rounded-xl border flex items-center justify-between text-xs font-bold cursor-pointer ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 opacity-75 filter blur-[0.3px]">
                <UserCheck className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="whitespace-nowrap">Add Taxi / Attach Cab</span>
              </div>
              <span className="filter-none opacity-100 flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-black shadow-xs tracking-wide shrink-0">
                <Lock className="w-2.5 h-2.5 stroke-[3]" />
                <span>Soon</span>
              </span>
            </button>
          </div>

          {/* Mobile Contact Button */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <a
              href="tel:7080224963"
              className="btn-gold w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold whitespace-nowrap"
            >
              <Phone className="w-4 h-4 stroke-[2.8] shrink-0" />
              <span className="whitespace-nowrap">Contact Us: 7080224963</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
