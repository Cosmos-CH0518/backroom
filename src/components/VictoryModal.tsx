import React from 'react';
import { Award, RotateCcw, CheckCircle2, Sparkles } from 'lucide-react';
import { PlayerStats } from '../types';

interface VictoryModalProps {
  stats: PlayerStats;
  onRestart: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  stats,
  onRestart,
}) => {
  const mins = Math.floor(stats.timeSurvivedSeconds / 60);
  const secs = Math.floor(stats.timeSurvivedSeconds % 60);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-950 border-2 border-emerald-500/80 rounded-2xl p-6 shadow-[0_0_60px_rgba(16,185,129,0.5)] flex flex-col items-center text-center font-mono animate-fade-in">
        {/* Victory Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-950/80 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 mb-4 animate-bounce">
          <Award className="w-8 h-8" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-black text-emerald-400 tracking-widest mb-1">
          LEVEL 0 ESCAPED!
        </h1>
        <p className="text-xs text-emerald-300/80 mb-5">脱出成功 / SURVIVED LEVEL 0</p>

        {/* Success message */}
        <div className="w-full bg-emerald-950/40 border border-emerald-800/50 rounded-xl p-3.5 mb-5 text-xs text-zinc-200 flex items-center gap-2 text-left">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>
            You unlocked the anomalous emergency exit door and escaped the mono-yellow halls of Level 0!
          </span>
        </div>

        {/* Stats Table */}
        <div className="w-full grid grid-cols-2 gap-2 bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 mb-6 text-xs text-left">
          <div>
            <div className="text-zinc-500 text-[10px]">ESCAPE TIME</div>
            <div className="text-emerald-400 font-bold text-sm">
              {mins}m {secs}s
            </div>
          </div>
          <div>
            <div className="text-zinc-500 text-[10px]">FINAL SANITY</div>
            <div className="text-emerald-400 font-bold text-sm">
              {Math.round(stats.sanity)}%
            </div>
          </div>
          <div>
            <div className="text-zinc-500 text-[10px]">DISTANCE EXPLORED</div>
            <div className="text-emerald-400 font-bold text-sm">
              {Math.round(stats.distanceTraveled)}m
            </div>
          </div>
          <div>
            <div className="text-zinc-500 text-[10px]">TAPES RECOVERED</div>
            <div className="text-emerald-400 font-bold text-sm">
              {stats.tapesCollected}
            </div>
          </div>
        </div>

        {/* Play Again */}
        <button
          onClick={onRestart}
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-xl shadow-xl flex items-center justify-center gap-2 transition-transform cursor-pointer"
        >
          <RotateCcw className="w-5 h-5" />
          <span>PLAY AGAIN (NEW MAZE) / もう一度遊ぶ</span>
        </button>
      </div>
    </div>
  );
};
