import React, { useState } from 'react';
import { ChevronDown, Phone, MessageSquare } from 'lucide-react';
import { FAQS, COMPANY_PHONE, COMPANY_WHATSAPP } from '../data/cabsData';

interface FaqSectionProps {
  language: 'en' | 'hi';
  theme: 'dark' | 'light';
}

export const FaqSection: React.FC<FaqSectionProps> = ({ language, theme }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const isLight = theme === 'light';

  const toggleIndex = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faqs" className={`py-6 max-w-5xl mx-auto border-t ${
      isLight ? 'border-slate-200' : 'border-slate-800'
    }`}>
      <div className="mb-8 max-w-2xl">
        <span className="text-xs font-black text-blue-600 uppercase tracking-widest block mb-1">
          {language === 'en' ? 'Frequently Asked Questions' : 'अक्सर पूछे जाने वाले प्रश्न'}
        </span>
        <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
          {language === 'en' ? 'Tariff & Policy Queries' : 'किराया व नियमों से जुड़े प्रश्न'}
        </h2>
        <p className={`text-sm mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          {language === 'en'
            ? 'Clear explanations regarding toll inclusions, payment settlement, cancellation timelines, and driver assignment.'
            : 'किराया, टोल टैक्स, रात्रि शुल्क एवं बुकिंग से जुड़ी आवश्यक जानकारियाँ।'}
        </p>
      </div>

      <div className="space-y-2.5">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className={`rounded-2xl border overflow-hidden transition-all ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-900 shadow-xs'
                  : 'bg-[#0F172A] border-slate-800 text-white'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleIndex(idx)}
                className={`w-full p-4.5 text-left flex items-center justify-between gap-4 transition-colors cursor-pointer ${
                  isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'
                }`}
              >
                <span className={`text-xs sm:text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {language === 'en' ? faq.question : faq.questionHi}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-blue-500 shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className={`px-4.5 pb-4.5 pt-1 text-xs leading-relaxed border-t ${
                  isLight ? 'border-slate-200 text-slate-700 bg-slate-50/50' : 'border-slate-800 text-slate-300'
                }`}>
                  {language === 'en' ? faq.answer : faq.answerHi}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={`mt-8 p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0F172A] border-slate-800'
      }`}>
        <div>
          <h4 className={`text-sm font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {language === 'en' ? 'Still have specific journey questions?' : 'क्या आपके पास कोई विशिष्ट यात्रा प्रश्न है?'}
          </h4>
          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {language === 'en' ? 'Our central fleet dispatcher is available 24/7.' : 'हमारा फ्लीट नियंत्रण केंद्र 24 घंटे उपलब्ध है।'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`tel:${COMPANY_PHONE.replace(/\s+/g, '')}`}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
              isLight ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100' : 'bg-slate-900 border-slate-700 text-white'
            }`}
          >
            <Phone className="w-3.5 h-3.5 text-blue-500" />
            <span>Call Support</span>
          </a>

          <a
            href={`https://wa.me/${COMPANY_WHATSAPP}?text=Hello%2C%20I%20have%20a%20query%20about%20TripWithCar`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp Us</span>
          </a>
        </div>
      </div>
    </section>
  );
};
