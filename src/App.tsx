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
  Sparkles,
  MessageSquare,
  X,
  Compass
} from 'lucide-react';
import { Header } from './components/Header';
import { BookingForm } from './components/BookingForm';
import { PopularRoutes } from './components/PopularRoutes';
import { FleetSection } from './components/FleetSection';
import { CustomerReviews } from './components/CustomerReviews';
import { StatsCounterSection } from './components/StatsCounterSection';
import { Footer } from './components/Footer';
import { BookingConfirmationModal } from './components/BookingConfirmationModal';
import { TrackBookingModal } from './components/TrackBookingModal';
import { DriverPartnerModal } from './components/DriverPartnerModal';
import { LockedFeatureModal } from './components/LockedFeatureModal';
import { DestinationSlider } from './components/DestinationSlider';
import { CabResultsPage } from './components/CabResultsPage';
import { AdminDashboard } from './components/AdminDashboard';
import { QuickBookingModal } from './components/QuickBookingModal';
import { Booking, Vehicle, TripType } from './types/cab';
import { POPULAR_ROUTES, VEHICLES } from './data/cabsData';
import { calculateFare, FareCalculationResult, syncBookingsFromServer, saveBookingAsync } from './utils/fareCalculator';

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

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const isLight = theme === 'light';

  // Navigation & Active Section View
  const [activeSection, setActiveSection] = useState<string>('booking');
  const [viewAllMode, setViewAllMode] = useState<boolean>(false);

  // Quick booking state
  const [tripType, setTripType] = useState<TripType>('oneway');
  const [fromCity, setFromCity] = useState('Varanasi');
  const [toCity, setToCity] = useState('');
  const [dropAddress, setDropAddress] = useState('');
  const [searchPickupDate, setSearchPickupDate] = useState('');
  const [searchPickupTime, setSearchPickupTime] = useState('');
  const [searchReturnDate, setSearchReturnDate] = useState('');
  const [searchReturnTime, setSearchReturnTime] = useState('');
  const [vehicleCat, setVehicleCat] = useState('sedan');
  const [autoSearch, setAutoSearch] = useState(false);
  const [formKey, setFormKey] = useState(0);

  // Modals
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [incomingMessageAlert, setIncomingMessageAlert] = useState<Booking | null>(null);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [trackingBookingId, setTrackingBookingId] = useState<string | undefined>(undefined);
  const [forceOpenMobilePopup, setForceOpenMobilePopup] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const search = window.location.search || '';
    const hash = window.location.hash || '';
    const path = window.location.pathname || '';
    if (search.includes('track=') || search.includes('admin=true') || hash === '#admin' || path === '/admin') {
      return false;
    }
    return true;
  });
  const [popupTrigger, setPopupTrigger] = useState<number>(1);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [directRouteBooking, setDirectRouteBooking] = useState<{
    vehicle: Vehicle;
    tripType: TripType;
    pickupCity: string;
    dropCity: string;
    pickupDate: string;
    pickupTime: string;
    fareResult: FareCalculationResult;
  } | null>(null);

  // Check URL params for track booking link and defer background server sync
  useEffect(() => {
    const syncTimer = setTimeout(() => {
      syncBookingsFromServer().catch(() => {});
    }, 600);

    const params = new URLSearchParams(window.location.search);
    const trackParam = params.get('track');
    if (trackParam) {
      setTrackingBookingId(trackParam);
      setShowTrackModal(true);
    }

    return () => clearTimeout(syncTimer);
  }, []);

  const handleBookingConfirmed = (booking: Booking) => {
    // Commit to persistent server in background without blocking UI
    saveBookingAsync(booking).catch(() => {});
    // Immediately display confirmation folio modal
    setConfirmedBooking(booking);
  };

  // Real-time booking alert notification popup with Track ID
  useEffect(() => {
    if (confirmedBooking) {
      setIncomingMessageAlert(confirmedBooking);
      const timer = setTimeout(() => {
        setIncomingMessageAlert(null);
      }, 9000);
      return () => clearTimeout(timer);
    }
  }, [confirmedBooking]);

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
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('twc_admin_auth');
      if (window.location.hash === '#admin') {
        window.history.pushState(null, '', window.location.pathname);
      }
    }
  };

  const handleTrackBooking = (bookingId: string) => {
    setConfirmedBooking(null);
    setTrackingBookingId(bookingId);
    setShowTrackModal(true);
    const newUrl = `${window.location.pathname}?track=${bookingId}`;
    window.history.pushState({ track: bookingId }, '', newUrl);
  };

  const handleNewBooking = () => {
    setConfirmedBooking(null);
    setTripType('oneway');
    setFromCity('Varanasi');
    setToCity('');
    setDropAddress('');
    setFormKey(prev => prev + 1);
    setForceOpenMobilePopup(true);
    setPopupTrigger(prev => prev + 1);
    setActiveSection('booking');
    window.scrollTo({ top: 80, behavior: 'smooth' });
  };

  const handleCloseTrackModal = () => {
    setShowTrackModal(false);
    setTrackingBookingId(undefined);
    if (window.location.search.includes('track=')) {
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
  const handleSearchRouteFromForm = (data: {
    tripType: TripType;
    pickupCity: string;
    dropCity: string;
    dropAddress: string;
    pickupDate: string;
    pickupTime: string;
    returnDate?: string;
    returnTime?: string;
  }) => {
    setTripType(data.tripType);
    setFromCity(data.pickupCity);
    setToCity(data.dropCity);
    setDropAddress(data.dropAddress);
    setSearchPickupDate(data.pickupDate);
    setSearchPickupTime(data.pickupTime);
    setSearchReturnDate(data.returnDate || '');
    setSearchReturnTime(data.returnTime || '');
    setActiveSection('results');

    // Automatically scroll down directly to available cars section
    setTimeout(() => {
      const cabsElement = document.getElementById('available-cabs-grid');
      if (cabsElement) {
        cabsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 180, behavior: 'smooth' });
      }
    }, 150);
  };

  const handleSelectVehicle = (v: Vehicle) => {
    setVehicleCat(v.id);
    if (tripType !== 'local' && (!toCity || !toCity.trim())) {
      setActiveSection('booking');
      setTripType('oneway');
      setForceOpenMobilePopup(true);
      setPopupTrigger((prev) => prev + 1);
      window.scrollTo({ top: 80, behavior: 'smooth' });
      return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    const activeFrom = fromCity || 'Varanasi';
    const activeTo = toCity || 'Ayodhya';
    const activeDate = searchPickupDate || todayStr;
    const activeTime = searchPickupTime || '09:00';
    const fareRes = calculateFare(
      v,
      tripType || 'oneway',
      activeFrom,
      activeTo,
      '8h_80km',
      tripType === 'roundtrip',
      searchReturnDate || undefined,
      activeDate
    );
    setDirectRouteBooking({
      vehicle: v,
      tripType: tripType || 'oneway',
      pickupCity: activeFrom,
      dropCity: activeTo,
      pickupDate: activeDate,
      pickupTime: activeTime,
      fareResult: fareRes,
    });
  };

  const handleBookRouteFromPopular = (data: {
    from: string;
    to: string;
    car: Vehicle;
    tripType: TripType;
    date: string;
    time: string;
    fare: number;
    distanceKm: number;
  }) => {
    const fareRes = calculateFare(
      data.car,
      data.tripType,
      data.from,
      data.to,
      '8h_80km',
      data.tripType === 'roundtrip',
      undefined,
      data.date
    );

    if (data.fare) {
      fareRes.totalFare = data.fare;
    }

    setDirectRouteBooking({
      vehicle: data.car,
      tripType: data.tripType,
      pickupCity: data.from,
      dropCity: data.to,
      pickupDate: data.date,
      pickupTime: data.time,
      fareResult: fareRes,
    });
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 overflow-x-hidden ${
      isLight
        ? 'bg-[#F8FAFC] text-slate-900 selection:bg-blue-600 selection:text-white'
        : 'bg-[#04070F] text-slate-100 selection:bg-blue-600 selection:text-white'
    }`}>
      {/* Sticky Navigation Header with Single Black/White Theme Toggle, Helpline & WhatsApp */}
      <Header
        activeTab={activeSection}
        onSelectTab={(tabId) => {
          setActiveSection(tabId);
          if (tabId === 'booking') {
            setTripType('oneway');
            setForceOpenMobilePopup(true);
            setPopupTrigger(prev => prev + 1);
          } else {
            setForceOpenMobilePopup(false);
          }
          window.scrollTo({ top: 80, behavior: 'smooth' });
        }}
        onOpenTrackBooking={() => {
          setTrackingBookingId(undefined);
          setShowTrackModal(true);
        }}
        onOpenDriverPartner={() => setShowDriverModal(true)}
        onOpenAdmin={() => setShowAdminDashboard(true)}
        language={language}
        onToggleLanguage={() => setLanguage(l => l === 'en' ? 'hi' : 'en')}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-16">
        {/* DEDICATED CARS & LIVE PRICES PAGE (Opened on Search or Route Selection) */}
        {activeSection === 'results' && (
          <section className="mb-14 sm:mb-16">
            <CabResultsPage
              tripType={tripType}
              pickupCity={fromCity || 'Varanasi'}
              dropCity={toCity || 'Ayodhya'}
              dropAddress={dropAddress}
              pickupDate={searchPickupDate || undefined}
              pickupTime={searchPickupTime || undefined}
              returnDate={searchReturnDate || undefined}
              returnTime={searchReturnTime || undefined}
              onBackToHome={() => {
                setActiveSection('booking');
                window.scrollTo({ top: 100, behavior: 'smooth' });
              }}
              onBookingConfirmed={handleBookingConfirmed}
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
              <div className="text-center max-w-3xl mx-auto mb-5 sm:mb-7">
                <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest mb-3 border ${
                  isLight
                    ? 'bg-blue-50 text-blue-700 border-blue-200/80 shadow-xs'
                    : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                }`}>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>travelingcab · 24/7 Outstation &amp; Local Dispatch</span>
                </div>
                <h1 className={`text-2xl sm:text-4xl lg:text-[42px] font-black tracking-tight leading-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
                  Book Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-400">One-Way &amp; Outstation</span> Cab
                </h1>
                <p className={`text-xs sm:text-sm mt-2 max-w-xl mx-auto font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Clean AC Fleet · Doorstep Pickup Across UP, Bihar, MP &amp; Delhi NCR · Instant Fare Confirmation
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
                  forceOpenMobilePopup={forceOpenMobilePopup}
                  popupTrigger={popupTrigger}
                  onCloseMobilePopup={() => setForceOpenMobilePopup(false)}
                  onSearchRoute={handleSearchRouteFromForm}
                  onBookingConfirmed={handleBookingConfirmed}
                  onViewAllCars={() => {
                    setActiveSection('fleet');
                    window.scrollTo({ top: 80, behavior: 'smooth' });
                  }}
                  language={language}
                  theme={theme}
                />
              </div>
            </div>

            {/* 2. FLEET CARS SLIDER (Positioned directly below the booking form) */}
            <div className="mb-10 sm:mb-14">
              <div className="text-center mb-3.5">
                <span className={`inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border ${
                  isLight ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  <Car className="w-3.5 h-3.5" />
                  Our Booking Cars
                </span>
              </div>
              <DestinationSlider
                onSelectRoute={handleSelectRoute}
                onSelectVehicle={(category) => {
                  const matched =
                    VEHICLES.find((v) => v.id === category || v.category === category) ||
                    VEHICLES[0];
                  handleSelectVehicle(matched);
                }}
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
              onBookRoute={handleBookRouteFromPopular}
              onBackToHome={() => {
                setActiveSection('booking');
                window.scrollTo({ top: 80, behavior: 'smooth' });
              }}
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
              onBackToHome={() => {
                setActiveSection('booking');
                window.scrollTo({ top: 80, behavior: 'smooth' });
              }}
              language={language}
              theme={theme}
            />
          </div>
        )}

        {/* SECTION 4: CUSTOMER REVIEWS (Visible on Home Page & Reviews Tab) */}
        {(activeSection === 'booking' || activeSection === 'reviews' || viewAllMode) && (
          <div className="mb-12 sm:mb-14">
            <CustomerReviews
              language={language}
              theme={theme}
              isHomePagePreview={activeSection === 'booking'}
              onBackToHome={() => {
                setActiveSection('booking');
                window.scrollTo({ top: 80, behavior: 'smooth' });
              }}
              onViewAllReviews={() => {
                setActiveSection('reviews');
                window.scrollTo({ top: 100, behavior: 'smooth' });
              }}
            />
          </div>
        )}

        {/* PLATFORM MILESTONES & LIVE STATS COUNTER STRIP ("Our Journey in Numbers") */}
        <div className="mt-10 sm:mt-14 pt-8 border-t border-slate-200 dark:border-slate-800">
          <StatsCounterSection language={language} theme={theme} />
        </div>
      </main>

      {/* REALISTIC INCOMING SMS / BOOKING ALERT POPUP */}
      {incomingMessageAlert && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-[440px] animate-in slide-in-from-top-4 duration-300 shadow-2xl">
          <div className={`p-3.5 rounded-2xl border shadow-2xl flex items-start gap-3 ${
            isLight
              ? 'bg-white/95 border-emerald-400 text-slate-900 backdrop-blur-md ring-2 ring-emerald-500/20'
              : 'bg-[#071328]/95 border-emerald-500/60 text-white backdrop-blur-md ring-2 ring-emerald-500/30'
          }`}>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
              <MessageSquare className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[10px] text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-wider mb-1">
                <span>💬 MESSAGES · TRAVELINGCAB BOOKING SMS</span>
                <button 
                  type="button"
                  onClick={() => setIncomingMessageAlert(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                Cab Confirmed! Track ID: <span className="font-mono text-amber-500 font-black">{incomingMessageAlert.bookingId}</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-snug">
                Namaste {incomingMessageAlert.passengerName}, your cab from {incomingMessageAlert.pickupCity} → {incomingMessageAlert.dropCity || 'Destination'} on {incomingMessageAlert.pickupDate} is confirmed. Mail sent from travelingcab (prajapatialok8546@gmail.com).
              </p>
              <div className="flex items-center gap-2 mt-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setTrackingBookingId(incomingMessageAlert.bookingId);
                    setShowTrackModal(true);
                    setIncomingMessageAlert(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Live Track Ride →</span>
                </button>
                <a
                  href={`https://wa.me/91${String(incomingMessageAlert.passengerPhone || '').replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(`🚕 *TRAVELINGCAB RESERVATION CONFIRMED*\n📋 *Booking Track ID:* ${incomingMessageAlert.bookingId}\n👤 *Passenger:* ${incomingMessageAlert.passengerName || 'Guest'}\n📍 *Route:* ${incomingMessageAlert.pickupCity || 'Varanasi'} → ${incomingMessageAlert.dropCity || 'Local'}\n📅 *Date:* ${incomingMessageAlert.pickupDate || ''} at ${incomingMessageAlert.pickupTime || ''}\n💰 *Fare:* ₹${incomingMessageAlert.totalFare || 0}\n🔍 *Live Track:* ${typeof window !== 'undefined' ? window.location.origin : ''}/?track=${incomingMessageAlert.bookingId}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 rounded-xl border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 text-xs font-bold transition-all cursor-pointer"
                >
                  WhatsApp SMS
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {confirmedBooking && (
        <BookingConfirmationModal
          booking={confirmedBooking}
          onClose={() => setConfirmedBooking(null)}
          onTrackBooking={handleTrackBooking}
          onNewBooking={handleNewBooking}
          language={language}
          theme={theme}
        />
      )}

      <TrackBookingModal
        isOpen={showTrackModal}
        onClose={handleCloseTrackModal}
        initialBookingId={trackingBookingId}
        language={language}
        theme={theme}
      />

      {/* QUICK BOOKING MODAL FOR DIRECT POPULAR ROUTE SELECTION */}
      {directRouteBooking && (
        <QuickBookingModal
          isOpen={true}
          onClose={() => setDirectRouteBooking(null)}
          vehicle={directRouteBooking.vehicle}
          tripType={directRouteBooking.tripType}
          pickupCity={directRouteBooking.pickupCity}
          dropCity={directRouteBooking.dropCity}
          pickupAddress={`${directRouteBooking.pickupCity} City Center / Hotel`}
          dropAddress={`${directRouteBooking.dropCity} Destination`}
          pickupDate={directRouteBooking.pickupDate}
          pickupTime={directRouteBooking.pickupTime}
          fareResult={directRouteBooking.fareResult}
          onBookingConfirmed={(booking) => {
            setDirectRouteBooking(null);
            handleBookingConfirmed(booking);
          }}
          language={language}
          theme={theme}
        />
      )}

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
        onOpenTrackBooking={() => {
          setTrackingBookingId(undefined);
          setShowTrackModal(true);
        }}
        onOpenDriverPartner={() => setShowDriverModal(true)}
        onOpenAdmin={() => setShowAdminDashboard(true)}
        language={language}
        theme={theme}
      />
    </div>
  );
}
