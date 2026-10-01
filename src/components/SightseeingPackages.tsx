import React from 'react';
import { Check, Clock, MapPin, ArrowRight } from 'lucide-react';
import { TOUR_PACKAGES } from '../data/cabsData';
import { TourPackage } from '../types/cab';

interface SightseeingPackagesProps {
  onSelectPackage: (pkg: TourPackage) => void;
  language: 'en' | 'hi';
  theme: 'dark' | 'light';
}

export const SightseeingPackages: React.FC<SightseeingPackagesProps> = ({
  onSelectPackage,
  language,
  theme,
}) => {
  const isLight = theme === 'light';

  return (
    <section id="tour-packages" className={`py-4 max-w-7xl mx-auto border-t ${
      isLight ? 'border-slate-200' : 'border-slate-800'
    }`}>
      <div className="max-w-3xl mb-8">
        <span className="text-xs font-black text-blue-600 uppercase tracking-widest block mb-1">
          {language === 'en' ? 'Curated Chauffeur Packages' : 'तीर्थ यात्रा एवं दर्शन पैकेज'}
        </span>
        <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
          {language === 'en' ? 'Kashi, Ayodhya & Prayagraj Pilgrimage Circuits' : 'काशी, अयोध्या एवं प्रयागराज विशेष दर्शन'}
        </h2>
        <p className={`text-sm mt-2 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          {language === 'en'
            ? 'Dedicated multi-destination vehicle allocations with verified chauffeurs experienced in temple security gates, ghat boat points, and highway parking.'
            : 'वरिष्ठ नागरिकों एवं परिवारों के लिए विशेष रूप से तैयार किए गए समर्पित तीर्थ दर्शन पैकेज।'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {TOUR_PACKAGES.map((pkg) => (
          <div
            key={pkg.id}
            className={`border rounded-2xl p-6 transition-all duration-200 flex flex-col justify-between shadow-md hover:shadow-xl ${
              isLight
                ? 'bg-white border-slate-200 hover:border-blue-500 text-slate-900'
                : 'bg-[#0F172A] border-slate-800 hover:border-slate-700 text-white'
            }`}
          >
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold text-blue-600 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{pkg.location}</span>
                </span>
                <span className={`flex items-center gap-1 text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  <Clock className="w-3.5 h-3.5" />
                  <span>{pkg.duration}</span>
                </span>
              </div>

              <h3 className={`text-lg font-black mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {language === 'en' ? pkg.title : pkg.titleHi}
              </h3>

              <p className={`text-xs mb-4 leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {pkg.description}
              </p>

              {/* Places Covered */}
              <div className={`space-y-1.5 mb-6 p-4 rounded-xl border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#090D16] border-slate-800'
              }`}>
                <span className={`text-[11px] font-black uppercase tracking-wider block mb-1 text-blue-600`}>
                  Key Itinerary Points:
                </span>
                {pkg.places.map((place, idx) => (
                  <div key={idx} className={`flex items-start gap-2 text-xs font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    <Check className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                    <span>{place}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tariff Matrix */}
            <div>
              <div className={`grid grid-cols-3 gap-2 p-3 rounded-xl border text-center mb-4 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#090D16] border-slate-800'
              }`}>
                <div>
                  <span className={`text-[10px] block font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Executive Sedan</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">₹{pkg.sedanPrice}</span>
                </div>
                <div className={`border-x ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                  <span className={`text-[10px] block font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Multi-Utility (SUV)</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">₹{pkg.suvPrice}</span>
                </div>
                <div>
                  <span className={`text-[10px] block font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Innova Crysta</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">₹{pkg.crystaPrice}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Recommended: {pkg.recommendedFor}
                </span>

                <button
                  type="button"
                  onClick={() => onSelectPackage(pkg)}
                  className="btn-gold flex items-center gap-2 px-5 py-3 rounded-xl text-xs"
                >
                  <span>Select Itinerary</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.8]" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
