import React, { useState, useEffect } from 'react';
import { Star, ChevronDown, ChevronUp, ArrowRight, ArrowLeft, MessageSquareQuote, Plus, X } from 'lucide-react';
import { REVIEWS } from '../data/cabsData';
import { Review } from '../types/cab';

const CUSTOM_REVIEWS_KEY = 'twc_custom_reviews';

export function getCustomReviews(): Review[] {
  try {
    const raw = localStorage.getItem(CUSTOM_REVIEWS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

interface CustomerReviewsProps {
  language: 'en' | 'hi';
  theme: 'dark' | 'light';
  isHomePagePreview?: boolean;
  onViewAllReviews?: () => void;
  onBackToHome?: () => void;
}

export const CustomerReviews: React.FC<CustomerReviewsProps> = ({ 
  language, 
  theme,
  isHomePagePreview = false,
  onViewAllReviews,
  onBackToHome,
}) => {
  const isLight = theme === 'light';
  const [showAll, setShowAll] = useState(false);
  const [customReviews, setCustomReviews] = useState<Review[]>(() => getCustomReviews());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const syncReviews = () => {
      setCustomReviews(getCustomReviews());
    };
    window.addEventListener('twc_reviews_updated', syncReviews);
    window.addEventListener('storage', syncReviews);
    return () => {
      window.removeEventListener('twc_reviews_updated', syncReviews);
      window.removeEventListener('storage', syncReviews);
    };
  }, []);

  const allReviews = [...customReviews, ...REVIEWS];
  const totalReviewsCount = allReviews.length;
  const averageRating = totalReviewsCount > 0
    ? (allReviews.reduce((acc, r) => acc + r.rating, 0) / totalReviewsCount).toFixed(1)
    : '4.9';

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newComment.trim()) return;
    const added: Review = {
      id: `rev-${Date.now()}`,
      name: newName.trim(),
      city: newCity.trim() || 'Varanasi',
      route: `${newCity.trim() || 'Varanasi'} Trip`,
      rating: newRating,
      comment: newComment.trim(),
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      verified: true,
    };
    const updated = [added, ...getCustomReviews()];
    localStorage.setItem(CUSTOM_REVIEWS_KEY, JSON.stringify(updated));
    setCustomReviews(updated);
    window.dispatchEvent(new Event('twc_reviews_updated'));
    setNewName('');
    setNewCity('');
    setNewRating(5);
    setNewComment('');
    setShowAddModal(false);
  };

  return (
    <section className={`py-4 sm:py-6 max-w-7xl mx-auto ${
      isHomePagePreview ? '' : 'border-t ' + (isLight ? 'border-slate-200' : 'border-slate-800')
    }`}>
      {/* Top Back to Home Navigation Button (Shown when viewing dedicated Reviews section) */}
      {!isHomePagePreview && onBackToHome && (
        <div className="mb-5 pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToHome}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold border transition-all cursor-pointer active:scale-95 ${
              isLight
                ? 'bg-white border-slate-300 text-slate-900 hover:bg-amber-50 hover:border-amber-400 shadow-xs'
                : 'bg-[#0B1120] border-slate-700 text-white hover:bg-slate-800 hover:border-amber-500/60 shadow-xs'
            }`}
          >
            <ArrowLeft className="w-4 h-4 text-amber-500 stroke-[2.8]" />
            <span>{language === 'hi' ? 'होम पेज पर वापस जाएं (Back)' : 'Back to Home'}</span>
          </button>

          <span className="text-[11px] sm:text-xs font-bold text-amber-500">
            {averageRating} ★ ({totalReviewsCount} Reviews)
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500 uppercase tracking-widest mb-1.5">
            <MessageSquareQuote className="w-4 h-4 text-amber-500" />
            <span>{language === 'en' ? 'Trip Feedback & Reviews' : 'यात्रियों की समीक्षाएं'}</span>
          </div>
          <h2 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {isHomePagePreview
              ? (language === 'en' ? 'What Our Riders Say' : 'ग्राहकों के अनुभव एवं समीक्षाएं')
              : (language === 'en' ? 'Client Testimonials & Ratings' : 'समीक्षाएं और रेटिंग्स')}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className={`flex items-center gap-2 text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className={`font-bold ${isLight ? 'text-slate-950' : 'text-white'}`}>{averageRating} / 5.0</span>
            <span>({totalReviewsCount} {language === 'en' ? 'Reviews' : 'रिव्यू'})</span>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition-all cursor-pointer active:scale-95 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.8]" />
            <span>{language === 'en' ? 'Write a Review' : 'रिव्यू लिखें'}</span>
          </button>
        </div>
      </div>

      {/* REVIEWS GRID: On Home Preview, Mobile shows 2 reviews, PC shows 3 reviews */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {allReviews.map((rev, idx) => {
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
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < rev.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'fill-slate-200 dark:fill-slate-700/60 text-slate-300 dark:text-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      {rev.rating}.0
                    </span>
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
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < rev.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-slate-200 dark:fill-slate-700/60 text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    {rev.rating}.0
                  </span>
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
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ACTION BUTTON AT BOTTOM (Mobile Optimized Responsive Layout) */}
      {isHomePagePreview ? (
        <div className="mt-8 flex justify-center px-4">
          <button
            type="button"
            onClick={onViewAllReviews}
            className="btn-gold w-full sm:w-auto max-w-[290px] sm:max-w-md min-h-[44px] px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer select-none text-center shadow-md transition-all"
          >
            <span className="inline sm:hidden">
              {language === 'en' ? `More Reviews (${totalReviewsCount} Feedback)` : `और समीक्षाएं देखें (${totalReviewsCount})`}
            </span>
            <span className="hidden sm:inline">
              {language === 'en' ? `More Reviews · View All ${totalReviewsCount} Feedback` : `और समीक्षाएं देखें (सभी ${totalReviewsCount} रिव्यू)`}
            </span>
            <ArrowRight className="w-4 h-4 stroke-[2.5] shrink-0" />
          </button>
        </div>
      ) : (
        allReviews.length > 3 && (
          <div className="mt-8 flex justify-center px-4">
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="btn-view-toggle w-full sm:w-auto max-w-[260px] sm:max-w-xs min-h-[42px] px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer select-none text-center transition-all"
            >
              <span>
                {showAll
                  ? (language === 'en' ? 'Show Fewer Reviews' : 'कम समीक्षाएं देखें')
                  : (language === 'en' ? `View All ${totalReviewsCount} Reviews` : `सभी ${totalReviewsCount} समीक्षाएं देखें`)}
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

      {/* Write a Review Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0B1120] border-slate-800 text-white'
          }`}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-extrabold">
                {language === 'en' ? 'Share Your TravelCap Experience' : 'अपना अनुभव साझा करें'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddReview} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Rahul Verma"
                  className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#04070F] border-slate-700 text-white'
                  }`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">City</label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="e.g. Varanasi"
                    className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#04070F] border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Rating</label>
                  <select
                    value={newRating}
                    onChange={(e) => setNewRating(Number(e.target.value))}
                    className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#04070F] border-slate-700 text-white'
                    }`}
                  >
                    <option value={5}>5 ★ - Excellent</option>
                    <option value={4}>4 ★ - Good</option>
                    <option value={3}>3 ★ - Average</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Your Feedback *</label>
                <textarea
                  rows={3}
                  required
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write about your cab comfort, driver behavior, and trip..."
                  className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#04070F] border-slate-700 text-white'
                  }`}
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-extrabold bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

