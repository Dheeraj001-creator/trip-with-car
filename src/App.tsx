/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Star, 
  Car, 
  Navigation, 
  Search
} from 'lucide-react';
import { Header } from './components/Header';
import { BookingForm } from './components/BookingForm';
import { PopularRoutes } from './components/PopularRoutes';
import { FleetSection } from './components/FleetSection';
import { CustomerReviews } from './components/CustomerReviews';
import { WhyChooseUs } from './components/WhyChooseUs';
import { StatsCounterSection } from './components/StatsCounterSection';
import { Footer } from './components/Footer';
import { BookingConfirmationModal } from './components/BookingConfirmationModal';
import { TrackBookingModal } from './components/TrackBookingModal';
import { DriverPartnerModal } from './components/DriverPartnerModal';
import { DestinationSlider } from './components/DestinationSlider';
import { Booking, Vehicle } from './types/cab';
import { POPULAR_ROUTES } from './data/cabsData';

export default function App() {
  const [language, setLanguage] = useState<'en' | 'hi'>('en');

  // Black / White Theme State with localStorage persistence
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('tripwithcar_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const handleToggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('tripwithcar_theme', next);
      return next;
    });
  };

  const isLight = theme === 'light';

  // Navigation & Active Section View
  const [activeSection, setActiveSection] = useState<string>('booking');
  const [viewAllMode, setViewAllMode] = useState<boolean>(false);

  // Quick booking state
  const [tripType, setTripType] = useState<'oneway' | 'roundtrip' | 'local' | 'airport'>('oneway');
  const [fromCity, setFromCity] = useState('Varanasi');
  const [toCity, setToCity] = useState('Ayodhya');
  const [vehicleCat, setVehicleCat] = useState('sedan');
  const [formKey, setFormKey] = useState(0);

  // Modals
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);

  const handleSelectRoute = (from: string, to: string) => {
    setFromCity(from);
    setToCity(to);
    setTripType('oneway');
    setFormKey(prev => prev + 1);
    setActiveSection('booking');
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleSelectVehicle = (v: Vehicle) => {
    setVehicleCat(v.category);
    setFormKey(prev => prev + 1);
    setActiveSection('booking');
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const sectionTabs = [
    { id: 'booking', label: language === 'en' ? 'Book Cab' : 'कैब बुकिंग', icon: Car },
    { id: 'routes', label: language === 'en' ? 'Popular Routes' : 'प्रमुख रूट्स', icon: Navigation },
    { id: 'fleet', label: language === 'en' ? 'Our Cars' : 'हमारी गाड़ियां', icon: Car },
    { id: 'reviews', label: language === 'en' ? 'Reviews' : 'समीक्षाएं', icon: Star },
  ];

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 overflow-x-hidden ${
      isLight
        ? 'bg-[#F8FAFC] text-slate-900 selection:bg-amber-500 selection:text-slate-950'
        : 'bg-[#04070F] text-slate-100 selection:bg-amber-500 selection:text-slate-950'
    }`}>
      {/* Sticky Navigation Header with Single Black/White Theme Toggle, Helpline & WhatsApp */}
      <Header
        activeTab={activeSection}
        onSelectTab={(tabId) => {
          setActiveSection(tabId);
          window.scrollTo({ top: 100, behavior: 'smooth' });
        }}
        onOpenTrackBooking={() => setShowTrackModal(true)}
        onOpenDriverPartner={() => setShowDriverModal(true)}
        language={language}
        onToggleLanguage={() => setLanguage(l => l === 'en' ? 'hi' : 'en')}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-16">
        
        {/* INTERACTIVE SECTION SWITCHER BAR */}
        <div className={`flex flex-wrap items-center justify-between gap-3 p-2.5 sm:p-3 border rounded-2xl sm:rounded-3xl mb-8 sm:mb-10 shadow-lg transition-all ${
          isLight
            ? 'bg-white border-slate-200 shadow-slate-200/60'
            : 'bg-[#0B1120] border-slate-800 shadow-black/80'
        }`}>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {sectionTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveSection(tab.id);
                    setViewAllMode(false);
                  }}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer select-none whitespace-nowrap ${
                    isActive && !viewAllMode
                      ? 'bg-amber-500 border border-amber-400 text-slate-950 font-bold shadow-sm'
                      : isLight
                        ? 'border border-transparent text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                        : 'border border-transparent text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[2.2]" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 1: BOOKING ENGINE */}
        {(activeSection === 'booking' || viewAllMode) && (
          <section className="mb-14 sm:mb-16">
            {/* Top Destination Image Slide Carousel */}
            <DestinationSlider
              onSelectRoute={handleSelectRoute}
              theme={theme}
            />

            <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8">
              <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
                Book Your Chauffeur Cab
              </h1>
              <p className={`text-xs sm:text-sm mt-1.5 max-w-md mx-auto ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Tolls, Fuel &amp; State Taxes Included · Pay Post-Ride
              </p>
            </div>

            <div className="max-w-5xl mx-auto">
              <BookingForm
                key={formKey}
                initialTripType={tripType}
                initialFrom={fromCity}
                initialTo={toCity}
                initialVehicleCategory={vehicleCat}
                onBookingConfirmed={(b) => setConfirmedBooking(b)}
                language={language}
                theme={theme}
              />
            </div>
          </section>
        )}

        {/* SECTION 2: POPULAR ROUTES */}
        {(activeSection === 'routes' || viewAllMode) && (
          <div className="mb-14 sm:mb-16">
            <PopularRoutes
              onSelectRoute={handleSelectRoute}
              language={language}
              theme={theme}
            />
          </div>
        )}

        {/* SECTION 3: FLEET SHOWCASE */}
        {(activeSection === 'fleet' || viewAllMode) && (
          <div className="mb-14 sm:mb-16">
            <FleetSection
              onSelectVehicle={handleSelectVehicle}
              language={language}
              theme={theme}
            />
          </div>
        )}

        {/* SECTION 4: CUSTOMER REVIEWS & TRUST */}
        {(activeSection === 'reviews' || viewAllMode) && (
          <div className="mb-14 sm:mb-16">
            <CustomerReviews language={language} theme={theme} />
            <div className="mt-8 sm:mt-10">
              <WhyChooseUs language={language} theme={theme} />
            </div>
          </div>
        )}

        {/* PLATFORM MILESTONES & LIVE STATS COUNTER STRIP */}
        <div className="mt-10 sm:mt-14 pt-8 border-t border-slate-200 dark:border-slate-800">
          <StatsCounterSection language={language} theme={theme} />
        </div>
      </main>

      {/* Modals */}
      <BookingConfirmationModal
        booking={confirmedBooking}
        onClose={() => setConfirmedBooking(null)}
        language={language}
        theme={theme}
      />

      <TrackBookingModal
        isOpen={showTrackModal}
        onClose={() => setShowTrackModal(false)}
        language={language}
        theme={theme}
      />

      <DriverPartnerModal
        isOpen={showDriverModal}
        onClose={() => setShowDriverModal(false)}
        language={language}
        theme={theme}
      />

      {/* Footer */}
      <Footer
        onScrollToSection={(sectionId) => {
          if (sectionId === 'booking') setActiveSection('booking');
          else if (sectionId === 'routes') setActiveSection('routes');
          else if (sectionId === 'fleet') setActiveSection('fleet');
          window.scrollTo({ top: 100, behavior: 'smooth' });
        }}
        onOpenTrackBooking={() => setShowTrackModal(true)}
        onOpenDriverPartner={() => setShowDriverModal(true)}
        language={language}
        theme={theme}
      />
    </div>
  );
}
