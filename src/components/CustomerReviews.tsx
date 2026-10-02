import React from 'react';
import { Star, CheckCircle } from 'lucide-react';
import { REVIEWS } from '../data/cabsData';

interface CustomerReviewsProps {
  language: 'en' | 'hi';
  theme: 'dark' | 'light';
}

export const CustomerReviews: React.FC<CustomerReviewsProps> = ({ language, theme }) => {
  const isLight = theme === 'light';

  return (
    <section className={`py-6 max-w-7xl mx-auto border-t ${
      isLight ? 'border-slate-200' : 'border-slate-800'
    }`}>
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <span className="text-xs font-bold text-amber-500 uppercase tracking-widest block mb-1">
            {language === 'en' ? 'Verified Trip Feedback' : 'यात्रियों की समीक्षाएं'}
          </span>
          <h2 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {language === 'en' ? 'Client Testimonials' : 'यात्रियों के अनुभव'}
          </h2>
        </div>

        <div className={`flex items-center gap-2 text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>0.0 / 5.0</span>
          <span>(0 Verified Reviews)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {REVIEWS.map((rev) => (
          <div
            key={rev.id}
            className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
              isLight
                ? 'bg-white border-slate-200 shadow-sm hover:shadow-md text-slate-900'
                : 'bg-[#0F172A] border-slate-800 text-white'
            }`}
          >
            <div>
              <div className="flex items-center gap-1 mb-3">
                {[...Array(rev.rating)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <p className={`text-xs leading-relaxed mb-4 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                &ldquo;{rev.comment}&rdquo;
              </p>
            </div>

            <div className={`pt-3 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`text-xs font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>{rev.name}</h4>
                  <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{rev.city} · {rev.date}</span>
                </div>
                {rev.verified && (
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>Verified</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
