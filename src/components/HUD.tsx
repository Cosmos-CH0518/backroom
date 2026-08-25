import React from 'react';
import { Brain, Zap, Battery, Key, Film, Droplets, AlertTriangle } from 'lucide-react';
import { PlayerStats } from '../types';

interface HUDProps {
  stats: PlayerStats;
  vhsEnabled: boolean;
  proximityGlitch: number; // 0 to 1
  notification: string | null;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  vhsEnabled,
  proximityGlitch,
  notification,
}) => {
  const sanityPercent = Math.round(stats.sanity);
  const staminaPercent = Math.round(stats.stamina);
  const batteryPercent = Math.round(stats.flashlightBattery);

  // Format survival time to mm:ss
  const mins = Math.floor(stats.timeSurvivedSeconds / 60);
  const secs = Math.floor(stats.timeSurvivedSeconds % 60);
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 select-none overflow-hidden">
      {/* 1. VHS Camcorder Overlay */}
      {vhsEnabled && (
        <div className="absolute inset-0 vhs-crt-overlay">
          {/* Top Left: REC Status */}
          <div className="absolute top-4 left-4 flex items-center gap-2 font-mono text-xs tracking-widest text-red-500 drop-shadow">
            <div className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
            <span className="font-bold text-white">● REC</span>
            <span className="text-zinc-400 ml-2">SP [0:0{timeFormatted}]</span>
          </div>

          {/* Top Right: Camcorder Battery & Mode */}
          <div className="absolute top-4 right-14 sm:right-16 flex items-center gap-2 font-mono text-xs text-yellow-300 drop-shadow">
            <span className="bg-black/60 px-1.5 py-0.5 rounded border border-yellow-500/30">LEVEL 0</span>
            <div className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded border border-yellow-500/30">
              <Battery className="w-3.5 h-3.5" />
              <span>{batteryPercent}%</span>
            </div>
          </div>

          {/* Bottom Left: Retro Timestamp */}
          <div className="absolute bottom-36 sm:bottom-4 left-4 font-mono text-xs tracking-wider text-yellow-200/80 drop-shadow hidden sm:block">
            OCT. 24 1998 &nbsp; 11:{String(42 + mins).padStart(2, '0')} PM
          </div>

          {/* Scanline glitch noise */}
          {proximityGlitch > 0.05 && (
            <div
              className="absolute inset-0 bg-red-950/20 mix-blend-color-burn glitch-noise pointer-events-none"
              style={{ opacity: Math.min(0.85, proximityGlitch * 1.3) }}
            >
              <div className="absolute inset-x-0 h-12 bg-white/10 animate-pulse top-1/3" />
            </div>
          )}
        </div>
      )}

      {/* 2. Proximity Terror Alert */}
      {proximityGlitch > 0.35 && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 bg-red-950/80 border border-red-500/80 rounded-full text-red-300 text-xs font-mono tracking-wider shadow-[0_0_25px_rgba(239,68,68,0.7)] animate-pulse">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span>ENTITY DETECTED NEARBY - CROUCH & MOVE AWAY</span>
        </div>
      )}

      {/* 3. Notification Toast */}
      {notification && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 px-5 py-2 bg-yellow-950/90 border border-yellow-500 text-yellow-200 text-xs sm:text-sm font-mono rounded-lg shadow-xl animate-fade-in backdrop-blur-md">
          {notification}
        </div>
      )}

      {/* 4. Player Vitals Gauges (Top Center / Left) */}
      <div className="absolute top-14 sm:top-4 left-4 flex flex-col gap-2 pointer-events-auto">
        {/* Sanity Meter */}
        <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-yellow-600/30 text-xs font-mono shadow-md w-48 sm:w-56">
          <Brain
            className={`w-4 h-4 ${
              sanityPercent < 35 ? 'text-red-500 animate-bounce' : 'text-purple-400'
            }`}
          />
          <div className="flex-1">
            <div className="flex justify-between text-[10px] text-zinc-300 font-bold mb-0.5">
              <span>SANITY (正気度)</span>
              <span>{sanityPercent}%</span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  sanityPercent < 30
                    ? 'bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]'
                    : sanityPercent < 60
                    ? 'bg-amber-500'
                    : 'bg-purple-500'
                }`}
                style={{ width: `${sanityPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stamina Meter */}
        <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-yellow-600/30 text-xs font-mono shadow-md w-48 sm:w-56">
          <Zap className="w-4 h-4 text-amber-400" />
          <div className="flex-1">
            <div className="flex justify-between text-[10px] text-zinc-300 font-bold mb-0.5">
              <span>STAMINA (スタミナ)</span>
              <span>{staminaPercent}%</span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-150"
                style={{ width: `${staminaPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quest / Inventory Badges */}
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {/* Key Counter */}
          <div className="flex items-center gap-1 bg-black/80 px-2.5 py-1 rounded border border-yellow-500/50 text-yellow-300 text-xs font-mono font-bold shadow-md">
            <Key className="w-3.5 h-3.5 text-yellow-400" />
            <span>
              KEYS: {stats.keysCollected}/{stats.totalKeysNeeded}
            </span>
          </div>

          {/* Almond Water Count */}
          {stats.almondWaterCount > 0 && (
            <div className="flex items-center gap-1 bg-teal-950/80 px-2.5 py-1 rounded border border-teal-500/50 text-teal-300 text-xs font-mono font-bold shadow-md">
              <Droplets className="w-3.5 h-3.5 text-teal-400" />
              <span>x{stats.almondWaterCount}</span>
            </div>
          )}

          {/* Tapes Count */}
          {stats.tapesCollected > 0 && (
            <div className="flex items-center gap-1 bg-indigo-950/80 px-2.5 py-1 rounded border border-indigo-500/50 text-indigo-300 text-xs font-mono font-bold shadow-md">
              <Film className="w-3.5 h-3.5 text-indigo-400" />
              <span>x{stats.tapesCollected}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
