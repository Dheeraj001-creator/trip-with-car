import React from 'react';
import { Users, Star, UserCheck, MapPin, Sparkles, ShieldCheck } from 'lucide-react';

interface StatsCounterSectionProps {
  language?: 'en' | 'hi';
  theme: 'dark' | 'light';
}

export const StatsCounterSection: React.FC<StatsCounterSectionProps> = ({
  language = 'en',
  theme,
}) => {
  const isLight = theme === 'light';

  const stats = [
    {
      id: 'travelers',
      value: '0',
      title: language === 'en' ? 'Travelers Served' : 'कुल यात्रियों ने यात्रा की',
      subtitle: language === 'en' ? 'Outstation & airport journeys' : 'सुरक्षित और समय पर यात्रा',
      icon: Users,
      badge: language === 'en' ? 'Verified Trips' : 'सत्यापित यात्राएं',
      accentColor: 'text-amber-500',
      bgColor: 'bg-amber-500/10 border-amber-500/25',
    },
    {
      id: 'reviews',
      value: '0',
      title: language === 'en' ? 'Customer Reviews' : 'समीक्षाएं एवं रेटिंग्स',
      subtitle: language === 'en' ? 'Genuine rider feedback' : 'ग्राहकों के प्रत्यक्ष अनुभव',
      icon: Star,
      badge: language === 'en' ? 'Rider Feedback' : 'सच्ची समीक्षाएं',
      accentColor: 'text-amber-400',
      bgColor: 'bg-yellow-500/10 border-yellow-500/25',
    },
    {
      id: 'drivers',
      value: '6',
      title: language === 'en' ? 'Active Drivers' : 'सक्रिय कैब ड्राइवर्स',
      subtitle: language === 'en' ? 'Yellow-plate vetted chauffeurs' : 'प्रमाणित कमर्शियल सारथी',
      icon: UserCheck,
      badge: language === 'en' ? 'On-Duty' : 'ऑन-ड्यूटी',
      accentColor: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10 border-emerald-500/25',
    },
    {
      id: 'cities',
      value: '0',
      title: language === 'en' ? 'Routes & Cities' : 'रूट्स एवं जुड़े शहर',
      subtitle: language === 'en' ? 'UP & Pan-India networks' : 'उत्तर प्रदेश व अंतरराज्यीय नेटवर्क',
      icon: MapPin,
      badge: language === 'en' ? 'Connected' : 'कनेक्टेड',
      accentColor: 'text-blue-500',
      bgColor: 'bg-blue-500/10 border-blue-500/25',
    },
  ];

  return (
    <section className="py-6 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{language === 'en' ? 'Platform Milestones & Live Status' : 'प्लेटफ़ॉर्म स्थिति एवं लाइव आंकड़े'}</span>
          </div>
          <h2 className={`text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            {language === 'en' ? 'Our Journey & Service Metrics' : 'हमारी सेवा और विश्वसनीयता के आंकड़े'}
          </h2>
          <p className={`text-xs sm:text-sm mt-1 max-w-xl ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            {language === 'en'
              ? 'Transparent live track record of completed rides, verified reviews, and registered commercial chauffeurs.'
              : 'यात्रियों की संख्या, ग्राहकों की समीक्षाएं एवं सक्रिय ड्राइवर्स का पारदर्शी लाइव रिकॉर्ड।'}
          </p>
        </div>

        <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl border shrink-0 ${
          isLight ? 'bg-white text-slate-800 border-slate-200' : 'bg-[#0B1120] text-slate-300 border-slate-800'
        }`}>
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>100% Real-Time Data</span>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between shadow-xs ${
                isLight
                  ? 'bg-white border-slate-200 hover:border-amber-400 hover:shadow-md text-slate-900'
                  : 'bg-[#0B1120] border-slate-800 hover:border-amber-400/60 hover:shadow-lg text-white'
              }`}
            >
              <div>
                {/* Header row: Icon & Tag */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${stat.bgColor} ${stat.accentColor}`}>
                    <Icon className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-[#04070F] border-slate-800 text-slate-400'
                  }`}>
                    {stat.badge}
                  </span>
                </div>

                {/* Big Counter Value */}
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-amber-500">
                    {stat.value}
                  </span>
                </div>

                {/* Label */}
                <h3 className={`text-xs sm:text-sm font-bold leading-snug mb-1 ${
                  isLight ? 'text-slate-900' : 'text-slate-100'
                }`}>
                  {stat.title}
                </h3>
              </div>

              {/* Subtitle */}
              <p className={`text-[11px] leading-relaxed pt-2 border-t mt-2 ${
                isLight ? 'border-slate-100 text-slate-500' : 'border-slate-800/80 text-slate-400'
              }`}>
                {stat.subtitle}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
