import React from 'react';

interface CarLoadingOverlayProps {
  isOpen: boolean;
  title?: string;
  subtitle?: string;
  theme?: 'dark' | 'light';
}

export const CarLoadingOverlay: React.FC<CarLoadingOverlayProps> = ({
  isOpen,
  title = 'Preparing Your Chauffeur Cab...',
  subtitle = 'Fetching verified vehicle rates and inclusions',
  theme = 'dark',
}) => {
  if (!isOpen) return null;

  const isLight = theme === 'light';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`relative w-full max-w-sm rounded-3xl p-6 sm:p-7 border shadow-2xl flex flex-col items-center text-center overflow-hidden transition-all ${
        isLight 
          ? 'bg-white border-slate-200 text-slate-900 shadow-slate-900/20' 
          : 'bg-[#0B1120] border-slate-800 text-white shadow-black/80'
      }`}>
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* ANIMATED CAR SCENE */}
        <div className="relative w-full h-32 flex flex-col items-center justify-center overflow-hidden mb-3">
          {/* Speed Wind Streaks */}
          <div className="absolute top-4 left-6 w-12 h-0.5 bg-amber-400/40 rounded-full animate-car-wind" />
          <div className="absolute top-8 left-2 w-16 h-0.5 bg-amber-400/60 rounded-full animate-car-wind [animation-delay:150ms]" />
          <div className="absolute top-12 left-10 w-8 h-0.5 bg-emerald-400/50 rounded-full animate-car-wind [animation-delay:300ms]" />

          {/* THE CAR CONTAINER (Suspension bounce animation) */}
          <div className="relative z-10 animate-car-bounce">
            {/* Detailed Vector Chauffeur Cab */}
            <svg
              className="w-48 h-20 drop-shadow-[0_10px_15px_rgba(245,158,11,0.3)]"
              viewBox="0 0 200 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Headlight Beam Cone */}
              <polygon
                points="178,48 230,30 230,75 178,56"
                fill="url(#headlightGradient)"
                opacity="0.65"
              />

              {/* Taxi Roof Carrier / Board */}
              <rect x="85" y="10" width="30" height="7" rx="3.5" fill="#F59E0B" stroke="#FEF08A" strokeWidth="1" />
              <text x="100" y="15.5" fill="#020617" fontSize="5" fontWeight="900" textAnchor="middle" letterSpacing="0.5">TAXI</text>

              {/* Roof Stand Legs */}
              <rect x="91" y="17" width="2" height="3" fill="#64748B" />
              <rect x="107" y="17" width="2" height="3" fill="#64748B" />

              {/* Main Car Body Roof & Pillars */}
              <path
                d="M48 40 L68 20 L134 20 L156 40 Z"
                fill="#1E293B"
                stroke="#F59E0B"
                strokeWidth="1.5"
              />

              {/* Car Windows (Tinted Glass) */}
              <polygon points="70,22 97,22 97,38 53,38" fill="#38BDF8" fillOpacity="0.4" />
              <polygon points="101,22 132,22 150,38 101,38" fill="#38BDF8" fillOpacity="0.4" />

              {/* Window Divider Pillar */}
              <line x1="99" y1="20" x2="99" y2="40" stroke="#0F172A" strokeWidth="2.5" />

              {/* Chauffeur Silhouette */}
              <circle cx="85" cy="29" r="4" fill="#020617" opacity="0.8" />
              <path d="M80 38 C80 34, 90 34, 90 38 Z" fill="#020617" opacity="0.8" />

              {/* Lower Car Chassis Body */}
              <path
                d="M20 46 C20 42, 28 40, 42 40 L160 40 C172 40, 182 44, 182 48 L180 58 C180 61, 175 62, 168 62 L152 62 C152 53, 136 53, 136 62 L66 62 C66 53, 50 53, 50 62 L30 62 C24 62, 20 58, 20 54 Z"
                fill="url(#carBodyGradient)"
                stroke="#F59E0B"
                strokeWidth="1.5"
              />

              {/* Sleek Golden Side Decal Stripe */}
              <path d="M25 49 L176 49" stroke="#FDE68A" strokeWidth="1.5" strokeDasharray="6 3" />

              {/* Door Handles */}
              <rect x="86" y="44" width="7" height="2" rx="1" fill="#FEF08A" />
              <rect x="120" y="44" width="7" height="2" rx="1" fill="#FEF08A" />

              {/* Headlight Bulb */}
              <circle cx="178" cy="51" r="3.5" fill="#FEF08A" />
              {/* Tail light */}
              <rect x="20" y="47" width="3" height="6" rx="1" fill="#EF4444" />

              {/* FRONT WHEEL ARCH & ROTATING ALLOY WHEEL */}
              <g transform="translate(144, 62)">
                <circle cx="0" cy="0" r="10.5" fill="#020617" stroke="#475569" strokeWidth="2" />
                <circle cx="0" cy="0" r="7.5" fill="#1E293B" />
                {/* Spinning Spokes */}
                <g className="animate-wheel-spin origin-center">
                  <line x1="-6" y1="0" x2="6" y2="0" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
                  <line x1="0" y1="-6" x2="0" y2="6" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
                  <line x1="-4.2" y1="-4.2" x2="4.2" y2="4.2" stroke="#FEF08A" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="-4.2" y1="4.2" x2="4.2" y2="-4.2" stroke="#FEF08A" strokeWidth="1.5" strokeLinecap="round" />
                </g>
                <circle cx="0" cy="0" r="2.5" fill="#FEF08A" />
              </g>

              {/* REAR WHEEL ARCH & ROTATING ALLOY WHEEL */}
              <g transform="translate(58, 62)">
                <circle cx="0" cy="0" r="10.5" fill="#020617" stroke="#475569" strokeWidth="2" />
                <circle cx="0" cy="0" r="7.5" fill="#1E293B" />
                {/* Spinning Spokes */}
                <g className="animate-wheel-spin origin-center">
                  <line x1="-6" y1="0" x2="6" y2="0" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
                  <line x1="0" y1="-6" x2="0" y2="6" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
                  <line x1="-4.2" y1="-4.2" x2="4.2" y2="4.2" stroke="#FEF08A" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="-4.2" y1="4.2" x2="4.2" y2="-4.2" stroke="#FEF08A" strokeWidth="1.5" strokeLinecap="round" />
                </g>
                <circle cx="0" cy="0" r="2.5" fill="#FEF08A" />
              </g>

              {/* Gradients */}
              <defs>
                <linearGradient id="carBodyGradient" x1="20" y1="40" x2="182" y2="62" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#0F172A" />
                  <stop offset="0.5" stopColor="#1E293B" />
                  <stop offset="1" stopColor="#0B132B" />
                </linearGradient>
                <linearGradient id="headlightGradient" x1="178" y1="52" x2="230" y2="52" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FEF08A" stopOpacity="0.8" />
                  <stop offset="0.7" stopColor="#F59E0B" stopOpacity="0.25" />
                  <stop offset="1" stopColor="#F59E0B" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* ROAD SURFACE WITH MOVING DASHES */}
          <div className="w-full relative mt-[-6px] h-4 flex items-center justify-center">
            {/* Solid Asphalt Road */}
            <div className={`w-full h-1.5 rounded-full ${isLight ? 'bg-slate-300' : 'bg-slate-700/80'}`} />
            {/* Animated Speed Lane Dashes */}
            <div className="absolute inset-0 flex items-center overflow-hidden">
              <div className="w-[200%] flex gap-4 animate-road-track shrink-0">
                <span className="w-6 h-1 bg-amber-400 rounded-full inline-block shrink-0" />
                <span className="w-6 h-1 bg-white rounded-full inline-block shrink-0" />
                <span className="w-6 h-1 bg-amber-400 rounded-full inline-block shrink-0" />
                <span className="w-6 h-1 bg-white rounded-full inline-block shrink-0" />
                <span className="w-6 h-1 bg-amber-400 rounded-full inline-block shrink-0" />
                <span className="w-6 h-1 bg-white rounded-full inline-block shrink-0" />
                <span className="w-6 h-1 bg-amber-400 rounded-full inline-block shrink-0" />
                <span className="w-6 h-1 bg-white rounded-full inline-block shrink-0" />
                <span className="w-6 h-1 bg-amber-400 rounded-full inline-block shrink-0" />
                <span className="w-6 h-1 bg-white rounded-full inline-block shrink-0" />
                <span className="w-6 h-1 bg-amber-400 rounded-full inline-block shrink-0" />
                <span className="w-6 h-1 bg-white rounded-full inline-block shrink-0" />
              </div>
            </div>
          </div>
        </div>

        {/* LOADING TEXT & STATUS */}
        <h4 className="text-base sm:text-lg font-black tracking-tight mb-1 text-amber-500 animate-pulse">
          {title}
        </h4>
        <p className={`text-xs mb-4 font-semibold max-w-[280px] ${
          isLight ? 'text-slate-600' : 'text-slate-400'
        }`}>
          {subtitle}
        </p>

        {/* Progress Bar with Gold Glow */}
        <div className={`w-full h-1.5 rounded-full overflow-hidden ${
          isLight ? 'bg-slate-200' : 'bg-slate-800'
        }`}>
          <div className="h-full bg-gradient-to-r from-amber-500 via-amber-300 to-emerald-400 rounded-full animate-progress-indeterminate" />
        </div>

        {/* Guarantee Pill */}
        <div className="mt-3.5 flex items-center gap-1.5 text-[11px] font-bold text-emerald-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
          <span>Real-Time Chauffeur Dispatch Active</span>
        </div>
      </div>
    </div>
  );
};
