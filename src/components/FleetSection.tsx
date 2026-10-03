import React from 'react';
import { Users, Briefcase, Wind, ArrowRight, Check, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { VEHICLES } from '../data/cabsData';
import { Vehicle } from '../types/cab';

interface FleetSectionProps {
  onSelectVehicle: (v: Vehicle) => void;
  language?: 'en' | 'hi';
  theme: 'dark' | 'light';
}

export const FleetSection: React.FC<FleetSectionProps> = ({
  onSelectVehicle,
  theme,
}) => {
  const isLight = theme === 'light';

  return (
    <section id="fleet" className="py-4 max-w-7xl mx-auto">
      {/* Header with Spacious Typography */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 text-xs font-semibold mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Commercial Yellow Plate Fleet · 100% Inspected</span>
          </div>

          <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-bold tracking-normal leading-snug ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            Our Vehicle Fleet &amp; Standard Tariffs
          </h2>

          <p className={`text-xs sm:text-sm mt-2 max-w-xl leading-relaxed ${
            isLight ? 'text-slate-600' : 'text-slate-400'
          }`}>
            Every vehicle is commercially registered with all-India permits, sanitized interiors, working high-speed dual AC, and operated by senior vetted chauffeurs.
          </p>
        </div>

        <div className={`flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-xl border shrink-0 ${
          isLight ? 'bg-white text-slate-800 border-slate-200 shadow-xs' : 'bg-[#0B1120] text-slate-300 border-slate-800'
        }`}>
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Yellow Plate Commercial Guarantee</span>
        </div>
      </div>

      {/* Fleet Cards Grid with Proportional Photos and Refined Typography */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {VEHICLES.map((car) => (
          <div
            key={car.id}
            className={`border rounded-2xl overflow-hidden transition-all duration-200 flex flex-col justify-between shadow-md hover:shadow-xl group ${
              isLight
                ? 'bg-white border-slate-200 hover:border-amber-400 text-slate-900'
                : 'bg-[#0F172A] border-slate-800 hover:border-amber-400/70 text-white'
            }`}
          >
            <div>
              {/* Proportional Landscape Car Photo */}
              <div className="relative h-44 sm:h-48 w-full bg-slate-950 overflow-hidden">
                <img
                  src={car.imageUrl}
                  alt={car.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/25" />

                {/* Badge Tag */}
                <div className="absolute top-3 left-3 bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-md text-[11px] font-bold shadow-sm">
                  {car.badge}
                </div>

                {/* Model Names Tag */}
                <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs text-white">
                  <span className="bg-black/80 px-2.5 py-1 rounded-lg border border-white/10 text-[11px] font-semibold backdrop-blur-sm truncate max-w-[70%]">
                    {car.modelNames}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-black/80 px-2 py-0.5 rounded-md border border-white/10">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>4.9</span>
                  </span>
                </div>
              </div>

              {/* Card Details */}
              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className={`text-base sm:text-lg font-bold tracking-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
                    {car.name}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 uppercase">
                    {car.category.replace('_', ' ')}
                  </span>
                </div>

                <p className={`text-xs mb-3.5 leading-relaxed line-clamp-2 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {car.description}
                </p>

                {/* Specs Pill Matrix */}
                <div className={`grid grid-cols-3 gap-2 py-2 px-3 rounded-xl border text-xs mb-3.5 ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#090D16] border-slate-800 text-slate-200'
                }`}>
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Users className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{car.seats} Seats</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Briefcase className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{car.luggage} Bags</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <Wind className="w-3.5 h-3.5 shrink-0" />
                    <span>Dual AC</span>
                  </div>
                </div>

                {/* Features List */}
                <div className={`space-y-1.5 mb-1 text-xs font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  {car.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pricing Footer */}
            <div className={`p-4 border-t flex items-center justify-between gap-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#090D16] border-slate-800'
            }`}>
              <div>
                <span className={`text-[10px] uppercase tracking-wider block font-semibold ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  Outstation Tariff
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    ₹{car.ratePerKm}
                  </span>
                  <span className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    / KM
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectVehicle(car)}
                className="btn-gold flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                <span>Book This Cab</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.8]" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
