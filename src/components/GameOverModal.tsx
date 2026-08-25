import React from 'react';
import { Skull, RotateCcw, AlertOctagon } from 'lucide-react';
import { PlayerStats } from '../types';

interface GameOverModalProps {
  reason: string;
  stats: PlayerStats;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  reason,
  stats,
  onRestart,
}) => {
  const mins = Math.floor(stats.timeSurvivedSeconds / 60);
  const secs = Math.floor(stats.timeSurvivedSeconds % 60);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-950 border-2 border-red-700/80 rounded-2xl p-6 shadow-[0_0_50px_rgba(220,38,38,0.5)] flex flex-col items-center text-center font-mono animate-fade-in">
        {/* Skull Icon */}
        <div className="w-16 h-16 rounded-full bg-red-950/80 border-2 border-red-500 flex items-center justify-center text-red-500 mb-4 animate-bounce">
          <Skull className="w-8 h-8" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-black text-red-500 tracking-widest mb-1">
          YOU NO-CLIPPED OUT OF REALITY
        </h1>
        <p className="text-xs text-red-400/80 mb-5">GAME OVER / 死亡</p>

        {/* Death Cause */}
        <div className="w-full bg-red-950/40 border border-red-800/50 rounded-xl p-3.5 mb-5 text-xs text-zinc-300 flex items-center gap-2 text-left">
          <AlertOctagon className="w-5 h-5 text-red-400 shrink-0" />
          <span>{reason}</span>
        </div>

        {/* Run Stats Summary */}
        <div className="w-full grid grid-cols-2 gap-2 bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 mb-6 text-xs text-left">
          <div>
            <div className="text-zinc-500 text-[10px]">TIME SURVIVED</div>
            <div className="text-yellow-400 font-bold text-sm">
              {mins}m {secs}s
            </div>
          </div>
          <div>
            <div className="text-zinc-500 text-[10px]">KEYS RECOVERED</div>
            <div className="text-yellow-400 font-bold text-sm">
              {stats.keysCollected} / {stats.totalKeysNeeded}
            </div>
          </div>
          <div>
            <div className="text-zinc-500 text-[10px]">DISTANCE WALKED</div>
            <div className="text-yellow-400 font-bold text-sm">
              {Math.round(stats.distanceTraveled)}m
            </div>
          </div>
          <div>
            <div className="text-zinc-500 text-[10px]">TAPES FOUND</div>
            <div className="text-yellow-400 font-bold text-sm">
              {stats.tapesCollected}
            </div>
          </div>
        </div>

        {/* Retry Button */}
        <button
          onClick={onRestart}
          className="w-full py-3.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold rounded-xl shadow-xl flex items-center justify-center gap-2 transition-transform cursor-pointer"
        >
          <RotateCcw className="w-5 h-5" />
          <span>TRY AGAIN / 再挑戦</span>
        </button>
      </div>
    </div>
  );
};
