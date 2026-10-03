import React, { useState } from 'react';
import { Star, CheckCircle, ChevronDown, ChevronUp, ArrowRight, MessageSquareQuote } from 'lucide-react';
import { REVIEWS } from '../data/cabsData';

interface CustomerReviewsProps {
  language: 'en' | 'hi';
  theme: 'dark' | 'light';
  isHomePagePreview?: boolean;
  onViewAllReviews?: () => void;
}

export const CustomerReviews: React.FC<CustomerReviewsProps> = ({ 
  language, 
  theme,
  isHomePagePreview = false,
  onViewAllReviews
}) => {
  const isLight = theme === 'light';
  const [showAll, setShowAll] = useState(false);

  return (
    <section className={`py-6 max-w-7xl mx-auto ${
      isHomePagePreview ? '' : 'border-t ' + (isLight ? 'border-slate-200' : 'border-slate-800')
    }`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500 uppercase tracking-widest mb-1.5">
            <MessageSquareQuote className="w-4 h-4 text-amber-500" />
            <span>{language === 'en' ? 'Verified Trip Feedback' : 'यात्रियों की समीक्षाएं'}</span>
          </div>
          <h2 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {isHomePagePreview
              ? (language === 'en' ? 'What Our Riders Say' : 'ग्राहकों के अनुभव एवं समीक्षाएं')
              : (language === 'en' ? 'Client Testimonials & Ratings' : 'समीक्षाएं और रेटिंग्स')}
          </h2>
        </div>

        <div className={`flex items-center gap-2 text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>4.9 / 5.0</span>
          <span>(500+ Verified Reviews)</span>
        </div>
      </div>

      {/* REVIEWS GRID: On Home Preview, Mobile shows 2 reviews, PC shows 3 reviews */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {REVIEWS.map((rev, idx) => {
          // If home preview:
          // Mobile: idx < 2 (exactly 2 reviews)
          // PC: idx < 3 (exactly 3 reviews, 3rd review hidden on mobile)
          // idx >= 3: hidden
          if (isHomePagePreview) {
            if (idx >= 3) return null;
            const previewDisplay = idx < 2 ? 'flex' : 'hidden md:flex';

            return (
              <div
                key={rev.id}
                className={`p-5 rounded-2xl border flex-col justify-between transition-all ${previewDisplay} ${
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
            );
          }

          // Full Reviews section
          const fullDisplay = showAll
            ? 'flex'
            : idx < 3
              ? 'flex'
              : 'hidden';

          return (
            <div
              key={rev.id}
              className={`p-5 rounded-2xl border flex-col justify-between transition-all ${fullDisplay} ${
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
          );
        })}
      </div>

      {/* ACTION BUTTON AT BOTTOM (Mobile Optimized Responsive Layout) */}
      {isHomePagePreview ? (
        /* Home page More Button: Navigates straight to the Reviews section! */
        <div className="mt-8 flex justify-center px-4">
          <button
            type="button"
            onClick={onViewAllReviews}
            className="btn-gold w-full sm:w-auto max-w-[290px] sm:max-w-md min-h-[44px] px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer select-none text-center shadow-md transition-all"
          >
            <span className="inline sm:hidden">
              {language === 'en' ? 'More Reviews (500+ Feedback)' : 'और समीक्षाएं देखें (500+)'}
            </span>
            <span className="hidden sm:inline">
              {language === 'en' ? 'More Reviews · View All Client Feedback' : 'और समीक्षाएं देखें (सभी 500+ रिव्यू)'}
            </span>
            <ArrowRight className="w-4 h-4 stroke-[2.5] shrink-0" />
          </button>
        </div>
      ) : (
        /* Full Reviews section Toggle */
        REVIEWS.length > 3 && (
          <div className="mt-8 flex justify-center px-4">
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="btn-view-toggle w-full sm:w-auto max-w-[260px] sm:max-w-xs min-h-[42px] px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer select-none text-center transition-all"
            >
              <span>
                {showAll
                  ? (language === 'en' ? 'Show Fewer Reviews' : 'कम समीक्षाएं देखें')
                  : (language === 'en' ? `View More Reviews (${REVIEWS.length}+)` : `और समीक्षाएं देखें (${REVIEWS.length}+)`)}
              </span>
              {showAll ? (
                <ChevronUp className="w-4 h-4 stroke-[2.5] shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 stroke-[2.5] shrink-0" />
              )}
            </button>
          </div>
        )
      )}
    </section>
  );
};
