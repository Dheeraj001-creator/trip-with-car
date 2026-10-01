import React from 'react';
import { Clock, ShieldCheck, Tag, HeartHandshake, MapPinned, Award } from 'lucide-react';

interface WhyChooseUsProps {
  language: 'en' | 'hi';
  theme: 'dark' | 'light';
}

export const WhyChooseUs: React.FC<WhyChooseUsProps> = ({ language, theme }) => {
  const isLight = theme === 'light';

  const benefits = [
    {
      icon: Clock,
      title: language === 'en' ? 'Punctual Chauffeur Dispatch' : 'समय पर पिकअप की गारंटी',
      desc: language === 'en'
        ? 'Chauffeur reports 15 minutes ahead of scheduled departure time. Live flight and train delay tracking included.'
        : 'निर्धारित समय से 15 मिनट पूर्व उपस्थिति। ट्रेन व फ्लाइट की लाइव मॉनिटरिंग।',
    },
    {
      icon: Tag,
      title: language === 'en' ? 'Transparent Tariff Architecture' : 'पारदर्शी किराया, कोई छिपा शुल्क नहीं',
      desc: language === 'en'
        ? 'Clear itemized billing covering fuel, highway tolls, and driver allowance. Zero unexpected surge charges.'
        : 'रास्ते में कोई अतिरिक्त मोलभाव नहीं, स्पष्ट और पूर्व-निर्धारित बिलिंग।',
    },
    {
      icon: ShieldCheck,
      title: language === 'en' ? 'Verified Commercial Chauffeurs' : 'सत्यापित एवं अनुभवी सारथी',
      desc: language === 'en'
        ? 'Every driver is commercially licensed, background-verified, non-smoking, and trained in long-distance safety.'
        : 'भद्र, धूम्रपान-मुक्त एवं तीर्थ मार्गों के अनुभवी और पुलिस द्वारा सत्यापित चालक।',
    },
    {
      icon: HeartHandshake,
      title: language === 'en' ? 'Flexible Cancellation Terms' : 'शून्य कैंसिलेशन शुल्क',
      desc: language === 'en'
        ? 'Schedule changes accommodated free of charge up to 2 hours before scheduled pickup time.'
        : 'योजना बदलने पर पिकअप से 2 घंटे पहले तक 100% फ्री कैंसिलेशन।',
    },
    {
      icon: MapPinned,
      title: language === 'en' ? 'Regional Pilgrimage Protocol Knowledge' : 'तीर्थ व मंदिर प्रोटोकॉल ज्ञान',
      desc: language === 'en'
        ? 'Drivers are familiar with authorized temple drop zones, security gates, and ghat boat boarding stations.'
        : 'काशी विश्वनाथ, राम मंदिर व संगम के निकटतम ड्रॉप और पार्किंग का पूर्ण ज्ञान।',
    },
    {
      icon: Award,
      title: language === 'en' ? 'Climate Controlled Fleet' : 'स्वच्छ कैब एवं तेज एयर कंडीशनिंग',
      desc: language === 'en'
        ? 'Guaranteed operational air conditioning, sanitization, USB device chargers, and routine maintenance audits.'
        : 'स्वच्छ इंटीरियर, ताज़ा सीट कवर, मोबाइल चार्जर एवं प्रभावी एसी की पक्की गारंटी।',
    },
  ];

  return (
    <section className={`py-6 max-w-7xl mx-auto border-t ${
      isLight ? 'border-slate-200' : 'border-slate-800'
    }`}>
      <div className="max-w-2xl mb-8">
        <span className="text-xs font-black text-blue-600 uppercase tracking-widest block mb-1">
          {language === 'en' ? 'Service Level Standards' : 'विश्वसनीयता एवं सुरक्षा'}
        </span>
        <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
          {language === 'en' ? 'Why Travelers Rely on TripWithCar' : 'TripWithCar पर यात्रियों का विश्वास क्यों?'}
        </h2>
        <p className={`text-sm mt-2 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          {language === 'en'
            ? 'We maintain rigorous standards for vehicle condition, driver vetting, and transparent billing across North India.'
            : 'सुरक्षा, समय की पाबंदी और निष्पक्ष दरों के साथ उत्तर भारत में कैब सेवा का नया मानक।'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {benefits.map((b, idx) => {
          const Icon = b.icon;
          return (
            <div
              key={idx}
              className={`p-6 rounded-2xl border transition-all ${
                isLight
                  ? 'bg-white border-slate-200 shadow-sm hover:shadow-md text-slate-900'
                  : 'bg-[#0F172A] border-slate-800 hover:border-slate-700 text-white'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                isLight ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-blue-950 border border-blue-500/30 text-blue-400'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className={`text-base font-black mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>{b.title}</h3>
              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{b.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
