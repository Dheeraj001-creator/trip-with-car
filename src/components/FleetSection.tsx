import React from 'react';
import { Users, Briefcase, Wind, ArrowRight, Check, ShieldCheck } from 'lucide-react';
import { VEHICLES } from '../data/cabsData';
import { Vehicle } from '../types/cab';

interface FleetSectionProps {
  onSelectVehicle: (v: Vehicle) => void;
  language: 'en' | 'hi';
  theme: 'dark' | 'light';
}

export const FleetSection: React.FC<FleetSectionProps> = ({
  onSelectVehicle,
  language,
  theme,
}) => {
  const isLight = theme === 'light';

  return (
    <section id="fleet" className="py-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <span className="text-xs font-black text-amber-500 uppercase tracking-widest block mb-1">
            {language === 'en' ? 'Verified Commercial Fleet' : 'प्रमाणित कैब फ्लीट'}
          </span>
          <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {language === 'en' ? 'Our Vehicle Fleet & Real Tariffs' : 'हमारी गाड़ियां एवं पारदर्शी दरें'}
          </h2>
          <p className={`text-sm mt-1 max-w-xl ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            {language === 'en'
              ? 'Every car is commercially registered (Yellow Plate), sanitized, equipped with working high-speed AC, and handled by senior vetted chauffeurs.'
              : 'सभी वाहन वातानुकूलित, स्वच्छ एवं वाणिज्यिक परमिट युक्त हैं।'}
          </p>
        </div>

        <div className={`flex items-center gap-2 text-xs font-bold px-3.5 py-2 rounded-xl border ${
          isLight ? 'bg-slate-100 text-slate-800 border-slate-200' : 'bg-[#0F172A] text-slate-300 border-slate-800'
        }`}>
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>100% Commercial Yellow Plate Guarantee</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {VEHICLES.map((car) => (
          <div
            key={car.id}
            className={`border rounded-2xl overflow-hidden transition-all duration-200 flex flex-col justify-between shadow-md hover:shadow-xl ${
              isLight
                ? 'bg-white border-slate-200 hover:border-amber-400 text-slate-900'
                : 'bg-[#0F172A] border-slate-800 hover:border-amber-400/80 text-white'
            }`}
          >
            <div>
              {/* LARGE HIGH-RESOLUTION CAR PHOTO */}
              <div className="relative h-60 w-full bg-slate-950 overflow-hidden">
                <img
                  src={car.imageUrl}
                  alt={car.name}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
                <div className={`absolute inset-0 bg-gradient-to-t via-transparent to-transparent opacity-85 ${
                  isLight ? 'from-slate-950/80' : 'from-[#0F172A]'
                }`} />

                <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 px-3.5 py-1 rounded-md text-xs font-black shadow-md shadow-amber-500/30 border border-amber-200/50 uppercase tracking-wider">
                  {car.badge}
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white font-bold">
                  <span className="bg-[#090D16]/90 px-3.5 py-1.5 rounded-xl border border-slate-700 text-xs font-extrabold backdrop-blur-md">
                    {car.modelNames}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="p-6">
                <h3 className={`text-xl font-black mb-1.5 ${isLight ? 'text-slate-950' : 'text-white'}`}>{car.name}</h3>
                <p className={`text-xs mb-4 leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{car.description}</p>

                {/* Specs Pill Matrix */}
                <div className={`grid grid-cols-3 gap-2.5 py-2.5 px-3.5 rounded-xl border text-xs mb-4 ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#090D16] border-slate-800 text-slate-200'
                }`}>
                  <div className="flex items-center gap-1.5 font-bold">
                    <Users className="w-4 h-4 text-amber-500" />
                    <span>{car.seats} Seats</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold">
                    <Briefcase className="w-4 h-4 text-amber-500" />
                    <span>{car.luggage} Bags</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                    <Wind className="w-4 h-4" />
                    <span>Dual AC</span>
                  </div>
                </div>

                <div className={`space-y-2 mb-2 text-xs font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  {car.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pricing Footer */}
            <div className={`p-5 border-t flex items-center justify-between gap-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#090D16] border-slate-800'
            }`}>
              <div>
                <span className={`text-[10px] uppercase tracking-wider block font-extrabold ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  Outstation Tariff
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">₹{car.ratePerKm}</span>
                  <span className={`text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>/ KM</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectVehicle(car)}
                className="btn-gold flex items-center gap-2 px-5 py-3 rounded-xl text-xs"
              >
                <span>Select for Booking</span>
                <ArrowRight className="w-4 h-4 stroke-[2.8]" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
