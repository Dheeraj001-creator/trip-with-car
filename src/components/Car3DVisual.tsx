import React, { useState } from 'react';
import { Box, Sparkles, Car } from 'lucide-react';
import { Vehicle } from '../types/cab';

interface Car3DVisualProps {
  vehicle: Vehicle;
  className?: string;
  badgeText?: string;
  show3DBadge?: boolean;
}

export const Car3DVisual: React.FC<Car3DVisualProps> = ({
  vehicle,
  className = 'h-40 sm:h-44',
  badgeText,
  show3DBadge = true,
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={`relative w-full overflow-hidden bg-gradient-to-b from-[#0B0F19] via-[#0E1526] to-[#05070D] flex items-center justify-center group ${className}`}
    >
      {/* 3D Studio Lighting Effects */}
      {/* 1. Overhead Circular Softbox Spotlight */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-3/4 h-28 bg-gradient-to-b from-amber-400/20 via-white/10 to-transparent rounded-full blur-2xl pointer-events-none" />

      {/* 2. Studio Horizon Line & Floor Grid */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-12 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_16px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_100%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

      {/* 3. Under-chassis Floor Shadow (Simulates 3D vehicle grounding) */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[78%] h-5 bg-black/90 rounded-[100%] blur-md pointer-events-none transform scale-y-50" />
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[60%] h-3 bg-amber-500/20 rounded-[100%] blur-sm pointer-events-none" />

      {/* Car Image with 3D perspective transition */}
      {!imgError ? (
        <img
          src={vehicle.imageUrl}
          alt={vehicle.name}
          onError={() => setImgError(true)}
          referrerPolicy="no-referrer"
          className="relative z-10 w-full h-full object-cover sm:object-contain p-1 filter drop-shadow-[0_12px_20px_rgba(0,0,0,0.85)] transition-all duration-500 group-hover:scale-108 group-hover:-translate-y-1"
        />
      ) : (
        /* Fallback 3D Geometric Automotive Card */
        <div className="relative z-10 flex flex-col items-center justify-center p-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2 shadow-lg">
            <Car className="w-8 h-8 stroke-[1.8]" />
          </div>
          <span className="text-xs font-bold text-white tracking-wide">{vehicle.name}</span>
          <span className="text-[10px] text-amber-400 font-mono mt-0.5">{vehicle.modelNames}</span>
        </div>
      )}

      {/* 3D Studio Render Badge */}
      {show3DBadge && (
        <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 bg-black/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-amber-500/30 shadow-md">
          <Box className="w-3.5 h-3.5 text-amber-400 stroke-[2.2] animate-pulse" />
          <span className="text-[10px] font-black text-amber-300 tracking-wider uppercase font-mono">
            3D Studio
          </span>
        </div>
      )}

      {/* Category / Model Badge */}
      {badgeText && (
        <div className="absolute top-2.5 right-2.5 z-20 bg-emerald-950/85 backdrop-blur-md text-emerald-300 border border-emerald-500/30 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">
          {badgeText}
        </div>
      )}

      {/* Bottom Rim Glow on Hover */}
      <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
};
