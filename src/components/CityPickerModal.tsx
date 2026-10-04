import React, { useState } from 'react';
import { X, Search, MapPin, Check } from 'lucide-react';
import { CATEGORIZED_CITIES } from '../data/cabsData';

interface CityPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCity: (city: string) => void;
  mode: 'pickup' | 'drop';
  currentCity: string;
  theme: 'dark' | 'light';
  language: 'en' | 'hi';
}

export const CityPickerModal: React.FC<CityPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectCity,
  mode,
  currentCity,
  theme,
  language,
}) => {
  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');

  if (!isOpen) return null;

  const isLight = theme === 'light';

  const filteredCategories = CATEGORIZED_CITIES.map((cat) => {
    if (selectedRegion !== 'all' && cat.region !== selectedRegion) {
      return { ...cat, cities: [] };
    }
    const matchingCities = cat.cities.filter((c) =>
      c.toLowerCase().includes(search.toLowerCase())
    );
    return { ...cat, cities: matchingCities };
  }).filter((cat) => cat.cities.length > 0);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className={`relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-6 border transition-colors ${
        isLight
          ? 'bg-white border-slate-300 text-slate-900'
          : 'bg-[#0F172A] border-slate-700 text-white'
      }`}>
        {/* Modal Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#0B1120] border-slate-800'
        }`}>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-500" />
            <div>
              <h3 className="text-sm font-extrabold">
                {mode === 'pickup'
                  ? (language === 'en' ? 'Select Pick-up City (Origin)' : 'पिकअप शहर चुनें')
                  : (language === 'en' ? 'Select Drop City (Destination)' : 'ड्रॉप शहर चुनें')}
              </h3>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {language === 'en' ? 'Browse 70+ cities across Uttar Pradesh, Bihar, Delhi NCR & adjoining states' : 'उत्तर प्रदेश, बिहार, दिल्ली एनसीआर व अन्य राज्यों के 70+ शहर'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isLight ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Region Filter Bar */}
        <div className={`p-4 border-b space-y-3 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#090D16] border-slate-800'
        }`}>
          <div className="relative">
            <Search className={`w-4 h-4 absolute left-3 top-3 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search any city, district or dhams (e.g. Ayodhya, Bodh Gaya, Mathura, Patna...)"
              className={`w-full rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-medium focus:outline-none transition-colors ${
                isLight
                  ? 'bg-slate-100 border border-slate-300 text-slate-900 focus:border-blue-600 focus:bg-white'
                  : 'bg-[#0F172A] border border-slate-700 text-white focus:border-blue-500'
              }`}
            />
          </div>

          {/* Region Tabs */}
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setSelectedRegion('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                selectedRegion === 'all'
                  ? 'bg-blue-600 text-white'
                  : isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All Regions (70+)
            </button>
            {CATEGORIZED_CITIES.map((cat) => (
              <button
                key={cat.region}
                onClick={() => setSelectedRegion(cat.region)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  selectedRegion === cat.region
                    ? 'bg-blue-600 text-white'
                    : isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat.region}
              </button>
            ))}
          </div>
        </div>

        {/* Cities Grid by Category */}
        <div className="p-4 max-h-[50vh] overflow-y-auto space-y-5">
          {filteredCategories.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No matching city found for &quot;{search}&quot;. You can still type it directly in the city box.
            </div>
          ) : (
            filteredCategories.map((cat) => (
              <div key={cat.region} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">
                    {cat.region}
                  </span>
                  <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                    {cat.state}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {cat.cities.map((city) => {
                    const isCurrent = currentCity.toLowerCase() === city.toLowerCase();
                    return (
                      <button
                        key={city}
                        onClick={() => {
                          onSelectCity(city);
                          onClose();
                        }}
                        className={`text-left p-2 rounded-xl border text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                          isCurrent
                            ? 'bg-blue-600 text-white border-blue-500 font-bold shadow'
                            : isLight
                              ? 'bg-slate-50 hover:bg-blue-50 border-slate-200 text-slate-800 hover:border-blue-400'
                              : 'bg-[#090D16] hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        <span className="truncate">{city}</span>
                        {isCurrent && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className={`p-3 border-t flex justify-end ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#0B1120] border-slate-800'
        }`}>
          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
              isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-800' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
