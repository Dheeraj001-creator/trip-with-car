import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Sparkles, ArrowRight } from 'lucide-react';

interface DestinationSlide {
  id: string;
  name: string;
  state: string;
  tagline: string;
  highlight: string;
  imageUrl: string;
  from: string;
  to: string;
}

const DESTINATION_SLIDES: DestinationSlide[] = [
  {
    id: 'kashi',
    name: 'Varanasi (Kashi Vishwanath & Ganga Ghats)',
    state: 'Uttar Pradesh',
    tagline: 'World Oldest Living City · Sacred Ghats & Evening Ganga Aarti',
    highlight: 'Kashi Vishwanath Corridor · Sarnath · Dashashwamedh',
    imageUrl: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1600&q=80',
    from: 'Lucknow',
    to: 'Varanasi',
  },
  {
    id: 'ayodhya',
    name: 'Ayodhya Dham (Shri Ram Janmabhoomi)',
    state: 'Uttar Pradesh',
    tagline: 'Grand Temple City · Saryu Maha Aarti & Ramkot',
    highlight: 'Direct Highway Access via Purvanchal Expressway',
    imageUrl: 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=1600&q=80',
    from: 'Varanasi',
    to: 'Ayodhya',
  },
  {
    id: 'prayagraj',
    name: 'Prayagraj (Triveni Sangam)',
    state: 'Uttar Pradesh',
    tagline: 'Holy Confluence of Ganga, Yamuna & Saraswati',
    highlight: 'Triveni Sangam Snan · Akbar Fort · Anand Bhawan',
    imageUrl: 'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=1600&q=80',
    from: 'Varanasi',
    to: 'Prayagraj (Allahabad)',
  },
  {
    id: 'agra',
    name: 'Agra (Taj Mahal Heritage)',
    state: 'Uttar Pradesh',
    tagline: 'Monument of Eternal Love · UNESCO World Heritage',
    highlight: 'Yamuna Expressway & Lucknow-Agra Highway',
    imageUrl: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1600&q=80',
    from: 'Delhi',
    to: 'Agra',
  },
  {
    id: 'lucknow',
    name: 'Lucknow (City of Nawabs)',
    state: 'Uttar Pradesh',
    tagline: 'Architectural Grandeur · Bara Imambara & Rumi Darwaza',
    highlight: 'Heritage Corridor · Awadhi Cuisine & Cultural Tour',
    imageUrl: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1600&q=80',
    from: 'Varanasi',
    to: 'Lucknow',
  },
];

interface DestinationSliderProps {
  onSelectRoute?: (from: string, to: string) => void;
  theme: 'dark' | 'light';
}

export const DestinationSlider: React.FC<DestinationSliderProps> = ({
  onSelectRoute,
  theme,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const isLight = theme === 'light';

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % DESTINATION_SLIDES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + DESTINATION_SLIDES.length) % DESTINATION_SLIDES.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % DESTINATION_SLIDES.length);
  };

  const currentSlide = DESTINATION_SLIDES[currentIndex];

  return (
    <div
      className="relative w-full max-w-5xl mx-auto mb-8 group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slide Container (Fitted on Mobile and Desktop) */}
      <div className={`relative h-48 xs:h-56 sm:h-64 md:h-72 w-full rounded-2xl sm:rounded-3xl overflow-hidden border shadow-xl transition-all ${
        isLight ? 'border-slate-200/90 shadow-slate-300/40' : 'border-slate-800/90 shadow-black/80'
      }`}>
        {/* Background Image with Smooth Fade */}
        <img
          key={currentSlide.id}
          src={currentSlide.imageUrl}
          alt={currentSlide.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Ambient Gradient Overlays for High Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 sm:top-4 left-3 sm:left-5 right-3 sm:right-5 flex items-center justify-between pointer-events-none">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-amber-400">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Popular Highway Destinations</span>
          </div>

          <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {currentIndex + 1} / {DESTINATION_SLIDES.length}
          </span>
        </div>

        {/* Bottom Slide Content */}
        <div className="absolute bottom-3 sm:bottom-5 left-3 sm:left-5 right-3 sm:right-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="max-w-xl text-white">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <h2 className="text-base sm:text-xl md:text-2xl font-bold tracking-tight text-white drop-shadow-md">
                {currentSlide.name}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 font-medium line-clamp-1 drop-shadow-xs">
              {currentSlide.tagline}
            </p>
          </div>

          {onSelectRoute && (
            <button
              type="button"
              onClick={() => onSelectRoute(currentSlide.from, currentSlide.to)}
              className="btn-gold shrink-0 self-start sm:self-end flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold cursor-pointer transition-all hover:scale-105"
            >
              <span>Book Cab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Left Arrow Button */}
        <button
          type="button"
          onClick={handlePrev}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/60 hover:bg-black/85 text-white border border-white/20 flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-95"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Right Arrow Button */}
        <button
          type="button"
          onClick={handleNext}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/60 hover:bg-black/85 text-white border border-white/20 flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-95"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Dots Indicators */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {DESTINATION_SLIDES.map((slide, idx) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                idx === currentIndex ? 'w-5 bg-amber-400' : 'w-1.5 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
