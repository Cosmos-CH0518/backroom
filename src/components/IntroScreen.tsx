import React from 'react';
import { Play, Gamepad2, Eye, Flashlight, Volume2, ShieldAlert, Sparkles } from 'lucide-react';
import { GameSettings, JoystickMode } from '../types';

interface IntroScreenProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onStartGame: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({
  settings,
  onUpdateSettings,
  onStartGame,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 select-none font-mono">
      {/* Background Ambience */}
      <div className="absolute inset-0 vhs-crt-overlay opacity-50 pointer-events-none" />

      <div className="relative w-full max-w-lg bg-zinc-950 border-2 border-yellow-600/70 rounded-2xl p-6 shadow-[0_0_50px_rgba(202,138,4,0.3)] flex flex-col items-center text-center">
        {/* VHS Tag */}
        <div className="flex items-center gap-2 text-xs text-yellow-500 font-bold tracking-widest mb-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
          <span>BACKROOMS: LEVEL 0 (THE LOBBY)</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-black text-yellow-400 tracking-wider mb-2 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]">
          THE BACKROOMS 3D
        </h1>
        <p className="text-xs text-zinc-400 max-w-sm mb-5 leading-relaxed">
          6億平方マイルに及ぶ、古びた黄色い壁紙と湿ったカーペットの無限迷路。
          3本の鍵を見つけ出し、脱出口から脱出せよ。
        </p>

        {/* Mobile Controls Guide */}
        <div className="w-full bg-yellow-950/20 border border-yellow-700/40 rounded-xl p-4 mb-5 text-left text-xs space-y-2.5">
          <div className="text-yellow-400 font-bold text-xs flex items-center gap-1.5 border-b border-yellow-800/40 pb-1.5">
            <Gamepad2 className="w-4 h-4" />
            <span>スマホ操作方法 (TOUCH CONTROLS)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-zinc-300">
            <div className="flex items-center gap-2 bg-black/50 p-2 rounded-lg border border-zinc-800">
              <span className="w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 flex items-center justify-center font-bold text-[10px]">
                左
              </span>
              <span>
                <strong className="text-white">左スティック</strong>: 移動
              </span>
            </div>

            <div className="flex items-center gap-2 bg-black/50 p-2 rounded-lg border border-zinc-800">
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/50 flex items-center justify-center font-bold text-[10px]">
                右
              </span>
              <span>
                <strong className="text-white">画面スワイプ/右スティック</strong>: 視点回転
              </span>
            </div>

            <div className="flex items-center gap-2 bg-black/50 p-2 rounded-lg border border-zinc-800">
              <Flashlight className="w-4 h-4 text-yellow-400 shrink-0" />
              <span>
                <strong className="text-white">懐中電灯</strong>: 視界確保 (電池に注意)
              </span>
            </div>

            <div className="flex items-center gap-2 bg-black/50 p-2 rounded-lg border border-zinc-800">
              <Eye className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                <strong className="text-white">しゃがみ</strong>: 足音を消す (怪物対策)
              </span>
            </div>
          </div>
        </div>

        {/* Control Preference Choice */}
        <div className="w-full mb-5 text-left">
          <div className="text-xs text-zinc-400 mb-1.5 font-bold">操作モード選択:</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onUpdateSettings({ ...settings, joystickMode: 'touch_swipe' })}
              className={`p-2.5 rounded-xl border text-xs text-center flex flex-col items-center gap-1 transition-all ${
                settings.joystickMode === 'touch_swipe'
                  ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300 font-bold shadow-md'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-400'
              }`}
            >
              <span>移動スティック + 画面スワイプ視点</span>
              <span className="text-[10px] text-zinc-500">(おすすめ・直感操作)</span>
            </button>

            <button
              onClick={() => onUpdateSettings({ ...settings, joystickMode: 'dual_sticks' })}
              className={`p-2.5 rounded-xl border text-xs text-center flex flex-col items-center gap-1 transition-all ${
                settings.joystickMode === 'dual_sticks'
                  ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300 font-bold shadow-md'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-400'
              }`}
            >
              <span>左右 2本スティック操作</span>
              <span className="text-[10px] text-zinc-500">(ゲームパッド風)</span>
            </button>
          </div>
        </div>

        {/* Start Game Button */}
        <button
          id="start-game-btn"
          onClick={onStartGame}
          className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 active:scale-95 text-black font-black text-base rounded-xl shadow-[0_0_30px_rgba(234,179,8,0.5)] flex items-center justify-center gap-2.5 transition-all cursor-pointer border-2 border-yellow-200"
        >
          <Play className="w-6 h-6 fill-current" />
          <span>START EXPLORATION / 探索開始</span>
        </button>
      </div>
    </div>
  );
};
