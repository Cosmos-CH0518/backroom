import React from 'react';
import { X, Film, BookOpen } from 'lucide-react';
import { WorldItem } from '../types';

interface LoreModalProps {
  collectedItems: WorldItem[];
  onClose: () => void;
}

export const LoreModal: React.FC<LoreModalProps> = ({
  collectedItems,
  onClose,
}) => {
  const tapes = collectedItems.filter((i) => i.type === 'vhs_tape' || i.type === 'lore_note');

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-zinc-950 border-2 border-indigo-600/60 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 text-zinc-200 font-mono text-sm max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-indigo-700/30 pb-3">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-base">
            <Film className="w-5 h-5" />
            <span>RECOVERED VHS LOGS / 回収ログ</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-900 border border-indigo-600/30 text-indigo-400 active:scale-95 transition-transform"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Logs List */}
        {tapes.length === 0 ? (
          <div className="py-8 text-center text-zinc-500 text-xs">
            まだテープは見つかっていません。迷路を探索して落ちているカセットテープを探してください。
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {tapes.map((t) => (
              <div
                key={t.id}
                className="bg-zinc-900/80 border border-indigo-900/50 rounded-xl p-3.5 flex flex-col gap-1.5"
              >
                <div className="text-indigo-300 font-bold text-xs flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <span>{t.title}</span>
                </div>
                <div className="text-[11px] text-zinc-400 italic bg-black/40 p-2.5 rounded-lg border border-zinc-800 leading-relaxed">
                  {t.loreContent || t.description}
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl active:scale-95 transition-all text-center mt-1"
        >
          CLOSE / 閉じる
        </button>
      </div>
    </div>
  );
};
