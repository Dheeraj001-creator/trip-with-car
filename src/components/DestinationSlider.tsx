import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

interface DestinationSliderProps {
  onSelectRoute?: (from: string, to: string) => void;
  onSelectVehicle?: (category: string) => void;
  theme: 'dark' | 'light';
}

export const DestinationSlider: React.FC<DestinationSliderProps> = ({
  onSelectRoute,
  onSelectVehicle,
  theme,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const isLight = theme === 'light';

  const carSlides = [
    { id: 'dzire', name: 'Maruti Suzuki Dzire', imageUrl: '/images/cars/dzire.webp' },
    { id: 'crysta', name: 'Innova Crysta', imageUrl: '/images/cars/crysta.webp' },
    { id: 'ertiga', name: 'Maruti Suzuki Ertiga', imageUrl: '/images/cars/ertiga.webp' },
    { id: 'hycross', name: 'Innova Hycross', imageUrl: '/images/cars/hycross.webp' },
    { id: 'wagonr', name: 'Maruti WagonR', imageUrl: '/images/cars/wagonr.webp' },
    { id: 'etios', name: 'Toyota Etios', imageUrl: '/images/cars/etios.webp' },
    { id: 'xl6', name: 'Maruti XL6', imageUrl: '/images/cars/xl6.webp' },
    { id: 'carens', name: 'Kia Carens', imageUrl: '/images/cars/carens.webp' },
    { id: 'innova', name: 'Toyota Innova', imageUrl: '/images/cars/innova.webp' },
    { id: 'tempo', name: 'Force Tempo Traveller', imageUrl: '/images/cars/tempo-traveller.webp' },
  ];

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carSlides.length);
    }, 3800);
    return () => clearInterval(interval);
  }, [isPaused, carSlides.length]);

  const currentCar = carSlides[currentIndex];

  const handleBookCar = () => {
    if (onSelectVehicle) {
      onSelectVehicle(currentCar.id);
    } else if (onSelectRoute) {
      onSelectRoute('Varanasi', 'Ayodhya');
    }
  };

  return (
    <div
      className="relative w-full max-w-4xl mx-auto mb-8 group select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* PURE FITTED IMAGE SLIDESHOW WITH ONLY BOOK CAB BUTTON (NO TEXT DETAILS OR SIDE ARROWS) */}
      <div
        onClick={handleBookCar}
        className={`relative w-full h-[185px] sm:h-[260px] md:h-[300px] rounded-2xl sm:rounded-3xl overflow-hidden border shadow-xl transition-all cursor-pointer bg-white flex items-center justify-center p-3 sm:p-6 ${
          isLight
            ? 'border-slate-200/90 shadow-slate-300/50 hover:border-amber-400'
            : 'border-slate-700/80 shadow-black/80 hover:border-amber-400/80'
        }`}
      >
        <img
          key={currentCar.id}
          src={currentCar.imageUrl}
          alt={currentCar.name}
          className="w-full h-full object-contain object-center scale-105 transition-transform duration-500 group-hover:scale-110"
        />

        {/* Only the Book Cab Button Positioned Cleanly at Bottom Right */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleBookCar();
          }}
          className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 btn-select-book px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-xl cursor-pointer transition-all active:scale-95"
        >
          <span>Book Cab</span>
          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.8]" />
        </button>
      </div>

      {/* Minimal Slide Dots Below */}
      <div className="mt-3 flex items-center justify-center gap-1.5">
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
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
