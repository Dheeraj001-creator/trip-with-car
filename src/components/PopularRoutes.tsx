import React, { useState } from 'react';
import { MapPin, ArrowRight, Clock, ShieldCheck, Sparkles, Navigation, Fuel, CreditCard, Search } from 'lucide-react';
import { POPULAR_ROUTES } from '../data/cabsData';
import { PopularRoute } from '../types/cab';

interface PopularRoutesProps {
  onSelectRoute: (from: string, to: string) => void;
  language: 'en' | 'hi';
  theme: 'dark' | 'light';
}

export const PopularRoutes: React.FC<PopularRoutesProps> = ({
  onSelectRoute,
  language,
  theme,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const isLight = theme === 'light';

  const filteredRoutes = POPULAR_ROUTES.filter((r) => {
    // Category filter
    let matchesCat = true;
    if (activeFilter === 'pilgrimage') matchesCat = r.category === 'pilgrimage';
    else if (activeFilter === 'interstate') matchesCat = r.toState !== r.fromState;
    else if (activeFilter === 'up') matchesCat = r.fromState === 'Uttar Pradesh' && r.toState === 'Uttar Pradesh';
    else if (activeFilter === 'airport') matchesCat = r.category === 'airport';

    // Search query filter
    const matchesSearch = !searchQuery.trim() || 
      r.from.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.toState.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.fromState.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.highway.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCat && matchesSearch;
  });

  return (
    <section id="popular-routes" className="py-4 max-w-7xl mx-auto">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-4">
        <div>
          <span className="text-xs font-black text-blue-600 uppercase tracking-widest block mb-1">
            {language === 'en' ? 'Verified Point-to-Point Tariffs' : 'प्रमाणित निश्चित किराया रूट्स'}
          </span>
          <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {language === 'en' ? 'Popular Highway & Intercity Corridors' : 'प्रमुख आउटस्टेशन व तीर्थ रूट्स'}
          </h2>
          <p className={`text-sm mt-1 max-w-2xl ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            {language === 'en'
              ? 'Real market-verified fixed rates with highway tolls, driver daily allowance, and fuel fully included. Zero surprise extras on road.'
              : 'टोल टैक्स, ईंधन एवं ड्राइवर भत्ता सहित वास्तविक एवं पारदर्शी निश्चित दरें। रास्ते में कोई अतिरिक्त मोलभाव नहीं।'}
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative">
            <Search className={`w-3.5 h-3.5 absolute left-3 top-3 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search city, state or highway..."
              className={`rounded-xl pl-9 pr-3.5 py-2 text-xs font-semibold focus:outline-none transition-colors ${
                isLight
                  ? 'bg-white border border-slate-300 text-slate-900 focus:border-blue-600 shadow-xs'
                  : 'bg-[#0F172A] border border-slate-700 text-white placeholder-slate-500 focus:border-blue-500'
              }`}
            />
          </div>

          <div className={`flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl border ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#0F172A] border-slate-800'
          }`}>
            {[
              { id: 'all', label: `All (${POPULAR_ROUTES.length})` },
              { id: 'pilgrimage', label: 'Spiritual / Yatra' },
              { id: 'up', label: 'Uttar Pradesh' },
              { id: 'interstate', label: 'Interstate (Bihar / NCR / MP)' },
              { id: 'airport', label: 'Airport' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  activeFilter === f.id
                    ? 'btn-gold shadow-md'
                    : isLight
                      ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-200'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Real Highway Routes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredRoutes.map((route) => (
          <div
            key={route.id}
            className={`border rounded-2xl p-5 sm:p-6 transition-all duration-200 flex flex-col justify-between shadow-md hover:shadow-xl hover:-translate-y-1 group ${
              isLight
                ? 'bg-white border-slate-200 hover:border-amber-400 text-slate-900'
                : 'bg-[#0F172A] border-slate-800 hover:border-amber-400/70 text-white'
            }`}
          >
            <div>
              {/* State & Highway Badges */}
              <div className="flex items-center justify-between gap-1 mb-3">
                <span className={`text-[10px] font-black tracking-wider px-2.5 py-1 rounded-md border uppercase ${
                  isLight
                    ? 'bg-amber-50 text-amber-800 border-amber-300/70'
                    : 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                }`}>
                  {route.toState}
                </span>

                {route.popularBadge && (
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md border ${
                    isLight
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {route.popularBadge}
                  </span>
                )}
              </div>

              {/* Highway name */}
              <div className={`text-xs font-bold flex items-center gap-1.5 mb-3.5 truncate ${
                isLight ? 'text-slate-600' : 'text-slate-400'
              }`}>
                <Navigation className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">{route.highway}</span>
              </div>

              {/* Visual Route Flow */}
              <div className={`p-4 rounded-xl border mb-4 space-y-2.5 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#090D16] border-slate-800/80'
              }`}>
                <div className="flex items-start gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                  <div>
                    <span className="text-[9px] uppercase tracking-widest block font-extrabold text-amber-500">
                      Origin [{route.fromState.split(' ')[0]}]
                    </span>
                    <span className="text-sm font-black block">{route.from}</span>
                    <span className={`text-[10px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{route.fromState}</span>
                  </div>
                </div>

                <div className={`border-l-2 border-dashed ml-1.5 pl-3.5 py-1 text-xs font-mono font-bold ${
                  isLight ? 'border-amber-300 text-slate-700' : 'border-amber-500/50 text-amber-300'
                }`}>
                  {route.distanceKm} KM · ~{route.estimatedHours}
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                  <div>
                    <span className="text-[9px] uppercase tracking-widest block font-extrabold text-emerald-600">
                      Destination [{route.toState.split(' ')[0]}]
                    </span>
                    <span className="text-sm font-black block">{route.to}</span>
                    <span className={`text-[10px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{route.toState}</span>
                  </div>
                </div>
              </div>

              {/* Toll & Feature Notice */}
              <div className={`flex items-center justify-between text-xs pb-3.5 border-b ${
                isLight ? 'border-slate-200 text-slate-700' : 'border-slate-800 text-slate-300'
              }`}>
                <span className="flex items-center gap-1.5 font-bold">
                  <CreditCard className="w-3.5 h-3.5 text-amber-500" />
                  <span>Toll ~₹{route.tollEstimate} (Included)</span>
                </span>
                <span className="text-emerald-600 font-black">No Peak Surge</span>
              </div>

              {/* Real Rates Matrix on Card */}
              <div className="grid grid-cols-3 gap-2 py-3.5 text-center">
                <div className={`p-2 rounded-xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#090D16] border-slate-800/80'
                }`}>
                  <span className={`text-[10px] uppercase block font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Sedan</span>
                  <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">₹{route.sedanPrice}</span>
                </div>
                <div className={`p-2 rounded-xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#090D16] border-slate-800/80'
                }`}>
                  <span className={`text-[10px] uppercase block font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>SUV</span>
                  <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">₹{route.suvPrice}</span>
                </div>
                <div className={`p-2 rounded-xl border ${
                  isLight ? 'bg-emerald-50/50 border-emerald-300/80' : 'bg-[#090D16] border-emerald-500/30'
                }`}>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase block font-black">Crysta</span>
                  <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">₹{route.crystaPrice}</span>
                </div>
              </div>
            </div>

            {/* Action CTA */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onSelectRoute(route.from, route.to)}
                className="w-full btn-gold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <span>Book This Route</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.8]" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
