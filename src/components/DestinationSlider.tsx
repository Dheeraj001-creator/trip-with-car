import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  ArrowRight, 
  Users, 
  Briefcase, 
  Wind,
  ShieldCheck 
} from 'lucide-react';

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

  // Feature our top fleet cars in wide horizontal panoramic slides
  const carSlides = [
    {
      id: 'sedan',
      name: 'Executive Sedan',
      modelNames: 'Dzire / Etios',
      fullName: 'Maruti Dzire, Toyota Etios',
      category: 'Sedan',
      seats: 4,
      luggage: 3,
      badge: 'Most Popular',
      imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1600&q=80',
    },
    {
      id: 'crysta',
      name: 'Innova Crysta',
      modelNames: 'VIP Chauffeur',
      fullName: 'Toyota Innova Crysta Luxury',
      category: 'Luxury',
      seats: 7,
      luggage: 5,
      badge: 'VIP Pilgrimage Choice',
      imageUrl: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1600&q=80',
    },
    {
      id: 'suv',
      name: 'Family Multi-SUV',
      modelNames: 'Ertiga / Carens',
      fullName: 'Maruti Suzuki Ertiga, Kia Carens',
      category: 'SUV',
      seats: 6,
      luggage: 4,
      badge: 'Family Special',
      imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1600&q=80',
    },
    {
      id: 'luxury_suv',
      name: 'Executive SUV',
      modelNames: 'Fortuner / Gloster',
      fullName: 'Toyota Fortuner, MG Gloster',
      category: 'VIP SUV',
      seats: 6,
      luggage: 4,
      badge: 'VIP Presidential',
      imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1600&q=80',
    },
    {
      id: 'tempo',
      name: 'Force Urbania Coach',
      modelNames: '12 / 17 Seater',
      fullName: '12-17 Seater Tourist Coach',
      category: 'Van',
      seats: 12,
      luggage: 10,
      badge: 'Group Special',
      imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1600&q=80',
    },
  ];

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carSlides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused, carSlides.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + carSlides.length) % carSlides.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % carSlides.length);
  };

  const currentCar = carSlides[currentIndex];

  const handleBookCar = () => {
    if (onSelectRoute) {
      onSelectRoute('Varanasi', 'Ayodhya');
    }
  };

  return (
    <div
      className="relative w-full max-w-5xl mx-auto mb-8 group select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* FULL-WIDTH HORIZONTAL CAR SLIDE (Enhanced Mobile & Desktop Responsive Height) */}
      <div 
        onClick={handleBookCar}
        className={`relative h-60 xs:h-64 sm:h-72 md:h-80 w-full rounded-2xl sm:rounded-3xl overflow-hidden border shadow-xl transition-all cursor-pointer ${
          isLight ? 'border-slate-200/90 shadow-slate-300/40 bg-slate-900' : 'border-slate-800/90 shadow-black/80 bg-slate-950'
        }`}
      >
        {/* Full Horizontal Car Image - Perfectly Fitted & Centered */}
        <img
          key={currentCar.id}
          src={currentCar.imageUrl}
          alt={currentCar.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center transition-opacity duration-300"
        />

        {/* High-Legibility Ambient Gradient Overlays (Tuned for Mobile & Desktop) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/25 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/40 pointer-events-none" />

        {/* Top Badges (Mobile Optimized: Clean Padding & Spacing) */}
        <div className="absolute top-2.5 sm:top-4 left-3 sm:left-5 right-3 sm:right-5 flex items-center justify-between pointer-events-none z-10">
          <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-[10px] sm:text-xs font-semibold text-amber-400 shadow-sm">
            <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400 shrink-0" />
            <span className="truncate">Commercial Chauffeur Fleet</span>
          </div>

          <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-amber-300 border border-white/15 shrink-0 shadow-sm">
            {currentIndex + 1} / {carSlides.length}
          </span>
        </div>

        {/* Bottom Horizontal Car Name, Specs & Responsive Book Button */}
        <div className="absolute bottom-2.5 sm:bottom-4 left-3 sm:left-5 right-3 sm:right-5 flex items-end justify-between gap-2.5 sm:gap-4 z-10">
          {/* Left: Car Title & Specifications */}
          <div className="text-white min-w-0 flex-1">
            {/* Category Pill & Verified Tag */}
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
              <span className="text-[9px] sm:text-[11px] font-black px-1.5 sm:px-2 py-0.5 rounded bg-emerald-500/25 text-emerald-400 border border-emerald-500/40 uppercase tracking-wider shrink-0">
                {currentCar.category}
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-amber-300 truncate">
                ★ 4.9 Chauffeur
              </span>
            </div>

            {/* Car Name */}
            <h2 className="text-sm xs:text-base sm:text-xl md:text-2xl font-bold tracking-tight text-white drop-shadow-md truncate">
              {currentCar.name} <span className="text-xs sm:text-base font-normal text-slate-300">({currentCar.modelNames})</span>
            </h2>

            {/* Quick Specs Strip */}
            <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-slate-200 mt-1 drop-shadow-xs font-medium">
              <span className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
                <span>{currentCar.seats} Pax</span>
              </span>
              <span className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                <Briefcase className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
                <span>{currentCar.luggage} Bags</span>
              </span>
              <span className="flex items-center gap-0.5 sm:gap-1 text-emerald-400 font-semibold shrink-0">
                <Wind className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>AC</span>
              </span>
            </div>
          </div>

          {/* Right: Book Cab Button - Perfectly Sized for Mobile & Desktop */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleBookCar();
            }}
            className="btn-gold shrink-0 flex items-center justify-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 sm:py-2 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-lg"
          >
            <span>Book Cab</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.8]" />
          </button>
        </div>

        {/* Carousel Arrow Controls (Mobile Optimized: Slightly Higher & Compact) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          className="absolute left-1.5 sm:left-3 top-[44%] -translate-y-1/2 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-black/55 hover:bg-black/85 text-white border border-white/20 flex items-center justify-center cursor-pointer transition-all z-20 shadow-md"
          aria-label="Previous car"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="absolute right-1.5 sm:right-3 top-[44%] -translate-y-1/2 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-black/55 hover:bg-black/85 text-white border border-white/20 flex items-center justify-center cursor-pointer transition-all z-20 shadow-md"
          aria-label="Next car"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Dots Indicators Below Container */}
      <div className="mt-2.5 sm:mt-3 flex items-center justify-center gap-1.5">
        {carSlides.map((car, idx) => (
          <button
            key={car.id}
            type="button"
            onClick={() => setCurrentIndex(idx)}
            className={`h-1.5 rounded-full transition-all cursor-pointer ${
              currentIndex === idx
                ? 'w-6 bg-amber-500'
                : isLight
                  ? 'w-1.5 bg-slate-300 hover:bg-slate-400'
                  : 'w-1.5 bg-slate-700 hover:bg-slate-600'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
