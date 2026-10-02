import React, { useState } from 'react';
import { ArrowRight, Navigation, CreditCard, Search, X, Sparkles, MapPin } from 'lucide-react';
import { POPULAR_ROUTES } from '../data/cabsData';

interface PopularRoutesProps {
  onSelectRoute: (from: string, to: string) => void;
  language?: 'en' | 'hi';
  theme: 'dark' | 'light';
}

export const PopularRoutes: React.FC<PopularRoutesProps> = ({
  onSelectRoute,
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
      {/* Header with Spacious, High-Legibility Typography (No Colliding Fonts) */}
      <div className="mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 text-xs font-semibold mb-2.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Verified Highway Tariffs · Tolls &amp; Fuel Included</span>
        </div>

        <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-bold tracking-normal leading-snug ${
          isLight ? 'text-slate-900' : 'text-white'
        }`}>
          Popular Highway &amp; Intercity Corridors
        </h2>

        <p className={`text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed ${
          isLight ? 'text-slate-600' : 'text-slate-400'
        }`}>
          Real market-verified fixed rates with highway fastag tolls, chauffeur daily allowance, and fuel fully included. Zero surprise extras.
        </p>
      </div>

      {/* SEARCH & FILTER CONTROL BAR (Dedicated, Clean Format & Stable Buttons) */}
      <div className={`p-3.5 sm:p-4 rounded-2xl border shadow-sm mb-7 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5 ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#0B1120] border-slate-800'
      }`}>
        {/* Full-Featured Search Input */}
        <div className="relative flex-1 max-w-lg">
          <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
            isLight ? 'text-slate-400' : 'text-slate-500'
          }`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search destination, city, or corridor (e.g. Ayodhya, Bodh Gaya)..."
            className={`w-full rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm font-medium focus:outline-none transition-all ${
              isLight
                ? 'bg-slate-50 border border-slate-200 text-slate-900 focus:border-amber-500 focus:bg-white'
                : 'bg-[#070B14] border border-slate-700/80 text-white placeholder-slate-500 focus:border-amber-500'
            }`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* STABLE FILTER PILLS (Fixed Sizing: Never Jumps or Resizes on Click) */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {[
            { id: 'all', label: `All (${POPULAR_ROUTES.length})` },
            { id: 'pilgrimage', label: 'Spiritual / Yatra' },
            { id: 'up', label: 'Uttar Pradesh' },
            { id: 'interstate', label: 'Interstate' },
            { id: 'airport', label: 'Airport' },
          ].map((f) => {
            const isActive = activeFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer select-none whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold shadow-sm'
                    : isLight
                      ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                      : 'bg-[#070B14] border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {filteredRoutes.length === 0 && (
        <div className={`text-center py-12 px-4 rounded-2xl border ${
          isLight ? 'bg-white border-slate-200 text-slate-600' : 'bg-[#0B1120] border-slate-800 text-slate-400'
        }`}>
          <MapPin className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-60" />
          <h3 className="text-sm font-bold">No corridors match &quot;{searchQuery}&quot;</h3>
          <p className="text-xs mt-1">Try searching another city or clear the filter.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setActiveFilter('all');
            }}
            className="mt-3 px-4 py-1.5 rounded-xl btn-gold text-xs font-bold"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* Highway Routes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredRoutes.map((route) => (
          <div
            key={route.id}
            className={`border rounded-2xl p-5 sm:p-5.5 transition-all duration-200 flex flex-col justify-between shadow-md hover:shadow-xl hover:-translate-y-1 group ${
              isLight
                ? 'bg-white border-slate-200 hover:border-amber-400 text-slate-900'
                : 'bg-[#0F172A] border-slate-800 hover:border-amber-400/70 text-white'
            }`}
          >
            <div>
              {/* State & Route Badges */}
              <div className="flex items-center justify-between gap-1 mb-2.5">
                <span className={`text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-md border uppercase ${
                  isLight
                    ? 'bg-amber-50 text-amber-800 border-amber-300/70'
                    : 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                }`}>
                  {route.toState}
                </span>

                {route.popularBadge && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    isLight
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {route.popularBadge}
                  </span>
                )}
              </div>

              {/* Highway name */}
              <div className={`text-xs font-semibold flex items-center gap-1.5 mb-3 truncate ${
                isLight ? 'text-slate-600' : 'text-slate-400'
              }`}>
                <Navigation className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">{route.highway}</span>
              </div>

              {/* Visual Route Flow */}
              <div className={`p-3.5 rounded-xl border mb-3.5 space-y-2 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#090D16] border-slate-800/80'
              }`}>
                <div className="flex items-start gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[9px] uppercase tracking-wider block font-bold text-amber-500">
                      Origin · {route.fromState}
                    </span>
                    <span className="text-sm font-bold block truncate">{route.from}</span>
                  </div>
                </div>

                <div className={`border-l-2 border-dashed ml-1.5 pl-3.5 py-0.5 text-xs font-mono font-bold ${
                  isLight ? 'border-amber-300 text-slate-700' : 'border-amber-500/50 text-amber-300'
                }`}>
                  {route.distanceKm} KM · ~{route.estimatedHours}
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[9px] uppercase tracking-wider block font-bold text-emerald-600 dark:text-emerald-400">
                      Destination · {route.toState}
                    </span>
                    <span className="text-sm font-bold block truncate">{route.to}</span>
                  </div>
                </div>
              </div>

              {/* Toll & Feature Notice */}
              <div className={`flex items-center justify-between text-xs pb-3 border-b ${
                isLight ? 'border-slate-200 text-slate-700' : 'border-slate-800 text-slate-300'
              }`}>
                <span className="flex items-center gap-1.5 font-semibold text-[11px]">
                  <CreditCard className="w-3.5 h-3.5 text-amber-500" />
                  <span>Toll ~₹{route.tollEstimate} (Included)</span>
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                  Zero Advance
                </span>
              </div>

              {/* Real Rates Matrix on Card */}
              <div className="grid grid-cols-3 gap-2 py-3 text-center">
                <div className={`p-2 rounded-xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#090D16] border-slate-800/80'
                }`}>
                  <span className={`text-[10px] uppercase block font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Sedan</span>
                  <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">₹{route.sedanPrice}</span>
                </div>
                <div className={`p-2 rounded-xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#090D16] border-slate-800/80'
                }`}>
                  <span className={`text-[10px] uppercase block font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>SUV</span>
                  <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">₹{route.suvPrice}</span>
                </div>
                <div className={`p-2 rounded-xl border ${
                  isLight ? 'bg-emerald-50/50 border-emerald-300/80' : 'bg-[#090D16] border-emerald-500/30'
                }`}>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase block font-bold">Crysta</span>
                  <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">₹{route.crystaPrice}</span>
                </div>
              </div>
            </div>

            {/* Action CTA */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onSelectRoute(route.from, route.to)}
                className="w-full btn-gold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer font-bold tracking-wide"
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
