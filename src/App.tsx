/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Star, 
  Car, 
  Navigation, 
  Search,
  Sparkles
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
import { LockedFeatureModal } from './components/LockedFeatureModal';
import { DestinationSlider } from './components/DestinationSlider';
import { CabResultsPage } from './components/CabResultsPage';
import { AdminDashboard } from './components/AdminDashboard';
import { Booking, Vehicle, TripType } from './types/cab';
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
  const [tripType, setTripType] = useState<TripType>('oneway');
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [dropAddress, setDropAddress] = useState('');
  const [vehicleCat, setVehicleCat] = useState('sedan');
  const [autoSearch, setAutoSearch] = useState(false);
  const [formKey, setFormKey] = useState(0);

  // Modals
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);

  // Secret URL routing for Admin Dashboard (e.g. #admin or /admin)
  useEffect(() => {
    const checkAdminRoute = () => {
      if (
        window.location.hash === '#admin' ||
        window.location.pathname === '/admin' ||
        window.location.search.includes('admin=true')
      ) {
        setShowAdminDashboard(true);
      }
    };
    checkAdminRoute();
    window.addEventListener('hashchange', checkAdminRoute);
    window.addEventListener('popstate', checkAdminRoute);
    return () => {
      window.removeEventListener('hashchange', checkAdminRoute);
      window.removeEventListener('popstate', checkAdminRoute);
    };
  }, []);

  const handleCloseAdmin = () => {
    setShowAdminDashboard(false);
    if (window.location.hash === '#admin') {
      window.history.pushState(null, '', window.location.pathname);
    }
  };

  // Direct route selection to dedicated Results & Price Page
  const handleSelectRoute = (from: string, to: string) => {
    setFromCity(from);
    setToCity(to);
    setTripType('oneway');
    setActiveSection('results');
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  // Search from BookingForm to dedicated Results & Price Page
  const handleSearchRouteFromForm = (data: { tripType: TripType; pickupCity: string; dropCity: string; dropAddress: string }) => {
    setTripType(data.tripType);
    setFromCity(data.pickupCity);
    setToCity(data.dropCity);
    setDropAddress(data.dropAddress);
    setActiveSection('results');
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  const handleSelectVehicle = (v: Vehicle) => {
    setVehicleCat(v.category);
    setActiveSection('results');
    window.scrollTo({ top: 100, behavior: 'smooth' });
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
        onOpenAdmin={() => setShowAdminDashboard(true)}
        language={language}
        onToggleLanguage={() => setLanguage(l => l === 'en' ? 'hi' : 'en')}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-16">
        
        {/* INTERACTIVE SECTION SWITCHER BAR (Clean 4-grid on mobile & desktop) */}
        <div className={`p-1.5 sm:p-2 border rounded-2xl sm:rounded-3xl mb-6 sm:mb-10 shadow-md transition-all ${
          isLight
            ? 'bg-white border-slate-200 shadow-slate-200/60'
            : 'bg-[#0B1120] border-slate-800 shadow-black/80'
        }`}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 w-full">
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
                  className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-1 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer select-none text-center ${
                    isActive && !viewAllMode
                      ? 'tab-gold-active'
                      : isLight
                        ? 'border border-transparent text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                        : 'border border-transparent text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2] shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* DEDICATED CARS & LIVE PRICES PAGE (Opened on Search or Route Selection) */}
        {activeSection === 'results' && (
          <section className="mb-14 sm:mb-16">
            <CabResultsPage
              tripType={tripType}
              pickupCity={fromCity || 'Varanasi'}
              dropCity={toCity || 'Ayodhya'}
              dropAddress={dropAddress}
              onBackToHome={() => {
                setActiveSection('booking');
                window.scrollTo({ top: 100, behavior: 'smooth' });
              }}
              onBookingConfirmed={(b) => setConfirmedBooking(b)}
              language={language}
              theme={theme}
            />
          </section>
        )}

        {/* SECTION 1: BOOKING ENGINE & CAR SHOWCASE (Booking Form on Top, Car Slider below it) */}
        {(activeSection === 'booking' || viewAllMode) && (
          <section className="mb-14 sm:mb-16">
            {/* 1. TOP HERO: ELEVATED POPUP-STYLE BOOKING ENGINE */}
            <div className="mb-10 sm:mb-14">
              <div className="text-center max-w-2xl mx-auto mb-5 sm:mb-7">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 text-xs font-bold mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Direct Chauffeur Cab Booking' : 'सीधी कैब बुकिंग सेवा'}</span>
                </div>
                <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
                  Book Your One-Way &amp; Outstation Cab
                </h1>
                <p className={`text-xs sm:text-sm mt-1 max-w-md mx-auto ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Tolls, Fuel &amp; State Taxes Included · Pay Post-Ride
                </p>
              </div>

              {/* Elevated Standalone Route Card with Popup-Like Presence */}
              <div className="max-w-4xl mx-auto">
                <BookingForm
                  key={formKey}
                  initialTripType={tripType}
                  initialFrom={fromCity}
                  initialTo={toCity}
                  initialVehicleCategory={vehicleCat}
                  initialAutoSearch={autoSearch}
                  onSearchRoute={handleSearchRouteFromForm}
                  onBookingConfirmed={(b) => setConfirmedBooking(b)}
                  language={language}
                  theme={theme}
                />
              </div>
            </div>

            {/* 2. FLEET CARS SLIDER (Positioned directly below the booking form) */}
            <div className="mb-10 sm:mb-14">
              <div className="text-center mb-3">
                <span className="text-xs font-bold text-amber-500 uppercase tracking-widest block">
                  {language === 'en' ? 'Our Commercial Chauffeur Fleet' : 'हमारी गाड़ियां एवं कैब फ्लीट'}
                </span>
              </div>
              <DestinationSlider
                onSelectRoute={handleSelectRoute}
                theme={theme}
              />
            </div>

            {/* 3. HOME PAGE BOTTOM REVIEWS (PC: 3 Reviews, Mobile: 2 Reviews) */}
            <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800 max-w-5xl mx-auto">
              <CustomerReviews
                language={language}
                theme={theme}
                isHomePagePreview={true}
                onViewAllReviews={() => {
                  setActiveSection('reviews');
                  window.scrollTo({ top: 100, behavior: 'smooth' });
                }}
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

      {/* ADD TAXI LOCKED FEATURE POPUP (Shows coming soon popup with Contact Us) */}
      <LockedFeatureModal
        isOpen={showDriverModal}
        onClose={() => setShowDriverModal(false)}
        title="Add Taxi / Driver Partner"
        serviceName={language === 'en' ? 'Add Taxi / Fleet Attachment' : 'टैक्सी जोड़ें / कैब अटैचमेंट'}
        description={
          language === 'en'
            ? 'Our automated Cab & Driver Partner attachment portal is launching soon. To attach your commercial taxi or join our verified fleet, please Contact Us directly.'
            : 'हमारा ड्राइवर और कैब पार्टनर ऑनबोर्डिंग पोर्टल जल्द ही लाइव हो रहा है। अपनी कमर्शियल गाड़ी जोड़ने के लिए हमारे हेल्पलाइन नंबर पर तुरंत संपर्क (Contact Us) करें।'
        }
        theme={theme}
        language={language}
      />

      {/* PRIVATE ADMIN DISPATCH & BOOKINGS MANAGEMENT PORTAL */}
      <AdminDashboard
        isOpen={showAdminDashboard}
        onClose={handleCloseAdmin}
        theme={theme}
        language={language}
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
        onOpenAdmin={() => setShowAdminDashboard(true)}
        language={language}
        theme={theme}
      />
    </div>
  );
}
