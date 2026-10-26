import React, { useState } from 'react';
import { Users, Briefcase, Wind, ArrowRight, ArrowLeft, ShieldCheck, Sparkles, Star, FileText, X, Navigation, ArrowLeftRight } from 'lucide-react';
import { VEHICLES } from '../data/cabsData';
import { Vehicle } from '../types/cab';

interface FleetSectionProps {
  onSelectVehicle: (v: Vehicle) => void;
  onBackToHome?: () => void;
  language?: 'en' | 'hi';
  theme: 'dark' | 'light';
}

export const FleetSection: React.FC<FleetSectionProps> = ({
  onSelectVehicle,
  onBackToHome,
  language = 'en',
  theme,
}) => {
  const isLight = theme === 'light';
  const [rateCardOpen, setRateCardOpen] = useState(false);
  const [activeRateCardTab, setActiveRateCardTab] = useState<'oneway' | 'outstation'>('oneway');
  const [pricingMode, setPricingMode] = useState<'roundtrip' | 'oneway'>('oneway');
  const [tempoSeats, setTempoSeats] = useState<number>(12);

  const getActiveCarConfig = (car: Vehicle): Vehicle => {
    if (car.seatOptions && car.seatOptions.length > 0) {
      const opt = car.seatOptions.find((o) => o.seats === tempoSeats) || car.seatOptions[0];
      return {
        ...car,
        seats: opt.seats,
        luggage: opt.luggage,
        ratePerKm: opt.ratePerKm,
        oneWayRatePerKm: opt.oneWayRatePerKm,
        roundTripRatePerKm: opt.roundTripRatePerKm,
        modelNames: `Force Traveller AC (${opt.label})`,
      };
    }
    return car;
  };

  return (
    <section id="fleet" className="py-2 sm:py-4 max-w-7xl mx-auto">
      {/* Top Back to Home Navigation Button */}
      {onBackToHome && (
        <div className="mb-4 pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToHome}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold border transition-all cursor-pointer active:scale-95 ${
              isLight
                ? 'bg-white border-slate-300 text-slate-900 hover:bg-amber-50 hover:border-amber-400 shadow-xs'
                : 'bg-[#0B1120] border-slate-700 text-white hover:bg-slate-800 hover:border-amber-500/60 shadow-xs'
            }`}
          >
            <ArrowLeft className="w-4 h-4 text-amber-500 stroke-[2.8]" />
            <span>{language === 'hi' ? 'होम पेज पर वापस जाएं (Back)' : 'Back to Home'}</span>
          </button>

          <span className="text-[11px] sm:text-xs font-bold text-amber-500">
            {VEHICLES.length} AC Cabs
          </span>
        </div>
      )}

      {/* Header with Dynamic One-Way / Round-Trip Tariff Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-6 gap-4">
        <div>
          <h2 className={`text-2xl sm:text-3xl font-bold tracking-tight ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            {language === 'hi' ? 'हमारी गाड़ियां एवं किराया सूची' : 'Our Cars & Live Tariffs'}
          </h2>

          <p className={`text-xs sm:text-sm mt-1 max-w-xl ${
            isLight ? 'text-slate-600' : 'text-slate-400'
          }`}>
            {language === 'hi'
              ? 'वन-वे (One-Way) या राउंड-ट्रिप (Round-Trip) चुनें और सभी गाड़ियों का लाइव किराया देखें।'
              : 'Select One-Way or Round-Trip below to view dynamic per-KM rates across our AC cab fleet.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Dynamic One-Way vs Round-Trip Switcher in Vibrant Blue */}
          <div className={`inline-flex p-1 rounded-xl border ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#070B14] border-slate-800'
          }`}>
            <button
              type="button"
              onClick={() => setPricingMode('oneway')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                pricingMode === 'oneway'
                  ? 'tab-blue-active'
                  : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-white'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>One Way Rate</span>
            </button>
            <button
              type="button"
              onClick={() => setPricingMode('roundtrip')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                pricingMode === 'roundtrip'
                  ? 'tab-blue-active'
                  : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Round Trip Rate</span>
            </button>
          </div>

          {/* View Official Rate Card Poster Button */}
          <button
            type="button"
            onClick={() => setRateCardOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl border border-amber-500/50 bg-amber-500/15 text-amber-600 dark:text-amber-300 hover:bg-amber-500/25 transition-all cursor-pointer whitespace-nowrap"
          >
            <FileText className="w-4 h-4 text-amber-500 shrink-0" />
            <span>{language === 'hi' ? 'रेट लिस्ट पोस्टर' : 'Rate Card Poster'}</span>
          </button>
        </div>
      </div>

      {/* Sleek Horizontal Car Cards Grid (Slim Side-by-Side Horizontal on BOTH Mobile & Desktop with Large Car Image) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4">
        {VEHICLES.map((rawCar) => {
          const car = getActiveCarConfig(rawCar);
          const activeRate =
            pricingMode === 'oneway'
              ? car.oneWayRatePerKm || car.ratePerKm
              : car.roundTripRatePerKm || car.ratePerKm;
          const strikeRate = activeRate + 3;
          const flatDiscount =
            car.category === 'hatchback' || car.category === 'sedan' || car.category === 'honda'
              ? 200
              : 300;

          return (
            <div
              key={car.id}
              className={`border rounded-2xl overflow-hidden transition-all duration-200 flex flex-row items-stretch shadow-sm hover:shadow-xl group ${
                isLight
                  ? 'bg-white border-slate-200/90 hover:border-blue-500 text-slate-900'
                  : 'bg-[#0B1120] border-slate-800 hover:border-blue-500/70 text-white'
              }`}
            >
              {/* Left: Pure White Studio Car Image (Clean Car Photo Only, Zero Badges or Text on Image) */}
              <div className="relative w-[36%] sm:w-[42%] min-h-[138px] sm:min-h-[158px] bg-white flex items-center justify-center p-1.5 sm:p-2.5 shrink-0 border-r border-slate-200/80 dark:border-slate-800 overflow-hidden">
                <img
                  src={car.imageUrl}
                  alt={car.name}
                  className="w-full h-full object-contain object-center scale-105 transition-transform duration-300 group-hover:scale-110"
                />
              </div>

              {/* Right: Sleek, Slim, Attractive Car Info, 12/26 Seat Selector (for Tempo), Active Rate & Book Button */}
              <div className="flex-1 p-2.5 sm:p-3.5 flex flex-col justify-between min-w-0">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className={`text-sm sm:text-base font-extrabold tracking-tight truncate ${
                        isLight ? 'text-slate-950' : 'text-white'
                      }`}>
                        {car.name}
                      </h3>
                      <p className={`text-[10px] sm:text-[11px] font-medium truncate ${
                        isLight ? 'text-slate-500' : 'text-slate-400'
                      }`}>
                        {car.modelNames}
                      </p>
                    </div>
                    <span className="text-[8px] sm:text-[9.5px] font-black px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 uppercase shrink-0">
                      ₹{flatDiscount} OFF
                    </span>
                  </div>

                  {/* Interactive 12 Seater / 26 Seater Option for Force Tempo Traveller */}
                  {rawCar.seatOptions && rawCar.seatOptions.length > 0 && (
                    <div className="mt-1 sm:mt-1.5 flex items-center gap-1 flex-wrap">
                      <span className={`text-[9.5px] sm:text-[10.5px] font-bold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                        Seats:
                      </span>
                      <div className="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700">
                        {rawCar.seatOptions.map((opt) => (
                          <button
                            key={opt.seats}
                            type="button"
                            onClick={() => setTempoSeats(opt.seats)}
                            className={`px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-black transition-all cursor-pointer ${
                              tempoSeats === opt.seats
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-300 hover:text-blue-500'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sleek Inline Specs Bar */}
                  <div className={`flex items-center gap-2 sm:gap-3 mt-1.5 py-1 px-2 sm:px-2.5 rounded-lg border text-[10px] sm:text-[11px] font-bold ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#070B14] border-slate-800 text-slate-200'
                  }`}>
                    <span className="flex items-center gap-1 shrink-0">
                      <Users className="w-3 h-3 text-amber-500" />
                      <span>{car.seats} Seats</span>
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <Briefcase className="w-3 h-3 text-amber-500" />
                      <span>{car.luggage} Bags</span>
                    </span>
                    <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 shrink-0">
                      <Wind className="w-3 h-3" />
                      <span>AC</span>
                    </span>
                  </div>
                </div>

                {/* Bottom Action Row with Strikethrough Discount Rate, + Taxes & Charges & Book Cab Button */}
                <div className="mt-2 pt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-end justify-between gap-2 sm:gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10.5px] sm:text-xs font-mono font-bold text-slate-400 dark:text-slate-500 line-through decoration-rose-500 decoration-2">
                        ₹{strikeRate}/KM
                      </span>
                      <span className="price-badge-chatkar px-2 py-0.5 rounded-lg text-xs sm:text-sm leading-tight inline-flex items-baseline gap-0.5 shrink-0">
                        <span>₹{activeRate}</span>
                        <span className="text-[9px] sm:text-[10px] font-bold opacity-95">/KM</span>
                      </span>
                    </div>
                    <span className={`text-[9.5px] sm:text-[10.5px] font-bold block ${
                      isLight ? 'text-blue-700' : 'text-blue-400'
                    }`}>
                      + ₹500 Taxes &amp; Charges
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectVehicle({ ...car, ratePerKm: activeRate })}
                    className="btn-select-book flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold cursor-pointer whitespace-nowrap shrink-0 shadow-sm ml-auto"
                  >
                    <span>{language === 'hi' ? 'बुक करें' : 'Book Cab'}</span>
                    <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.8]" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Official Rate Card Poster Modal */}
      {rateCardOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn"
          onClick={() => setRateCardOpen(false)}
        >
          <div 
            className={`relative max-w-4xl w-full max-h-[92vh] rounded-3xl border shadow-2xl overflow-hidden flex flex-col ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#0B1120] border-slate-700'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`p-4 sm:p-5 border-b flex items-center justify-between gap-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#070B14] border-slate-800'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold">
                    {language === 'hi' ? 'आधिकारिक वाहन रेट लिस्ट' : 'Official Vehicle Rate Cards'}
                  </h3>
                  <p className="text-[11px] text-amber-500 font-medium">
                    अभिराज टूर एंड ट्रैवल्स · वाराणसी कैब्स (7080224963 / 9517573435)
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setRateCardOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-700/40 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Poster Switcher Tabs */}
            <div className="flex border-b border-slate-800 bg-black/40 p-2 gap-2">
              <button
                type="button"
                onClick={() => setActiveRateCardTab('oneway')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                  activeRateCardTab === 'oneway'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {language === 'hi' ? '1. वन वे एवं राउंड ट्रिप रेट लिस्ट' : '1. One Way & Round Trip Rate List'}
              </button>
              <button
                type="button"
                onClick={() => setActiveRateCardTab('outstation')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                  activeRateCardTab === 'outstation'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {language === 'hi' ? '2. 2026 आउटस्टेशन यात्रा रेट लिस्ट' : '2. 2026 Outstation Rate List'}
              </button>
            </div>

            {/* Modal Body - Scrollable Image View */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-black/60 flex items-center justify-center">
              {activeRateCardTab === 'oneway' ? (
                <img
                  src="/images/cars/rate-card-oneway-roundtrip.webp"
                  onError={(e) => { e.currentTarget.src = "/images/cars/rate-card-oneway-roundtrip.jpg"; }}
                  alt="Abhiraj Tour & Travels - One Way Drop and Round Trip Rate List"
                  className="max-h-[70vh] w-auto max-w-full rounded-xl object-contain shadow-2xl border border-white/10"
                />
              ) : (
                <img
                  src="/images/cars/rate-card-outstation.webp"
                  onError={(e) => { e.currentTarget.src = "/images/cars/rate-card-outstation.jpg"; }}
                  alt="Abhiraj Tour & Travels - 2026 Outstation Rate List"
                  className="max-h-[70vh] w-auto max-w-full rounded-xl object-contain shadow-2xl border border-white/10"
                />
              )}
            </div>

            {/* Modal Footer */}
            <div className={`p-3.5 sm:p-4 border-t flex flex-wrap items-center justify-between gap-3 text-xs ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#070B14] border-slate-800 text-slate-300'
            }`}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-semibold text-emerald-400">100% पारदर्शी दरें · कोई छिपा हुआ शुल्क नहीं</span>
              </div>
              <a
                href="tel:7080224963"
                className="btn-gold flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs"
              >
                <span>Call Booking: 7080224963</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
