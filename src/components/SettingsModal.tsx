import React from 'react';
import { X, Sliders, Volume2, Gamepad2, Video, Eye, Shield } from 'lucide-react';
import { GameDifficulty, GameSettings, JoystickMode } from '../types';
import { soundManager } from '../audio/soundManager';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const handleJoystickModeChange = (mode: JoystickMode) => {
    onUpdateSettings({ ...settings, joystickMode: mode });
  };

  const handleDifficultyChange = (diff: GameDifficulty) => {
    onUpdateSettings({ ...settings, difficulty: diff });
  };

  const handleSensitivityChange = (type: 'move' | 'look', val: number) => {
    if (type === 'move') {
      onUpdateSettings({ ...settings, moveSensitivity: val });
    } else {
      onUpdateSettings({ ...settings, lookSensitivity: val });
    }
  };

  const handleVolumeChange = (vol: number) => {
    soundManager.setVolume(vol);
    onUpdateSettings({ ...settings, soundVolume: vol });
  };

  const handleVhsToggle = () => {
    onUpdateSettings({ ...settings, vhsEffect: !settings.vhsEffect });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-zinc-950 border-2 border-yellow-600/60 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 text-zinc-200 font-mono text-sm max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-yellow-700/30 pb-3">
          <div className="flex items-center gap-2 text-yellow-400 font-bold text-base">
            <Sliders className="w-5 h-5" />
            <span>GAME SETTINGS / 設定</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-900 border border-yellow-600/30 text-yellow-400 active:scale-95 transition-transform"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Joystick & Touch Control Mode */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-yellow-400 font-bold text-xs">
            <Gamepad2 className="w-4 h-4" />
            <span>MOBILE CONTROL TYPE (操作タイプ)</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleJoystickModeChange('touch_swipe')}
              className={`p-2.5 rounded-xl border text-xs text-center flex flex-col items-center gap-1 transition-all ${
                settings.joystickMode === 'touch_swipe'
                  ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300 font-bold'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-400'
              }`}
            >
              <span>STICK + SWIPE</span>
              <span className="text-[10px] text-zinc-400">移動スティック + 画面スワイプ視点</span>
            </button>

            <button
              onClick={() => handleJoystickModeChange('dual_sticks')}
              className={`p-2.5 rounded-xl border text-xs text-center flex flex-col items-center gap-1 transition-all ${
                settings.joystickMode === 'dual_sticks'
                  ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300 font-bold'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-400'
              }`}
            >
              <span>DUAL STICKS</span>
              <span className="text-[10px] text-zinc-400">左右2本スティック (移動&視点)</span>
            </button>
          </div>
        </div>

        {/* 2. Sensitivity Sliders */}
        <div className="flex flex-col gap-3 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-300">Look Sensitivity (視点感度)</span>
              <span className="text-yellow-400">{settings.lookSensitivity.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.4"
              max="2.5"
              step="0.1"
              value={settings.lookSensitivity}
              onChange={(e) => handleSensitivityChange('look', parseFloat(e.target.value))}
              className="w-full accent-yellow-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-300">Move Sensitivity (移動感度)</span>
              <span className="text-yellow-400">{settings.moveSensitivity.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.8"
              step="0.1"
              value={settings.moveSensitivity}
              onChange={(e) => handleSensitivityChange('move', parseFloat(e.target.value))}
              className="w-full accent-yellow-500 cursor-pointer"
            />
          </div>
        </div>

        {/* 3. Difficulty */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-yellow-400 font-bold text-xs">
            <Shield className="w-4 h-4" />
            <span>DIFFICULTY / 難易度</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {(['peaceful', 'normal', 'nightmare'] as GameDifficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => handleDifficultyChange(d)}
                className={`py-2 rounded-lg border text-xs capitalize transition-all ${
                  settings.difficulty === d
                    ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300 font-bold'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                }`}
              >
                {d === 'peaceful' ? '平和 (探索のみ)' : d === 'normal' ? '通常' : '悪夢 (強敵)'}
              </button>
            ))}
          </div>
        </div>

        {/* 4. VHS & Sound Toggle */}
        <div className="flex flex-col gap-3 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
          {/* VHS Filter Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <Video className="w-4 h-4 text-yellow-400" />
              <span>VHS Camcorder Filter (レトロフィルター)</span>
            </div>
            <button
              onClick={handleVhsToggle}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                settings.vhsEffect ? 'bg-yellow-500' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.vhsEffect ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Sound Volume Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <div className="flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-yellow-400" />
                <span>Audio Volume (音量)</span>
              </div>
              <span className="text-yellow-400">{Math.round(settings.soundVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.soundVolume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-full accent-yellow-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Save and Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold font-mono rounded-xl shadow-lg active:scale-95 transition-all text-center mt-1"
        >
          RESUME GAME / 再開
        </button>
      </div>
    </div>
  );
};
