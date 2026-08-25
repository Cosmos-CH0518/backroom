import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Flashlight,
  Eye,
  Hand,
  Footprints,
  Coffee,
  Compass,
  Settings,
  ShieldAlert,
} from 'lucide-react';
import { GameSettings, InputState, WorldItem } from '../types';

interface TouchControlsProps {
  inputRef: React.MutableRefObject<InputState>;
  settings: GameSettings;
  nearbyItem: WorldItem | null;
  nearExitDoor: boolean;
  keysCount: number;
  totalKeys: number;
  almondWaterCount: number;
  isFlashlightOn: boolean;
  battery: number;
  onDrinkWater: () => void;
  onOpenMap: () => void;
  onOpenSettings: () => void;
  onInteract: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  inputRef,
  settings,
  nearbyItem,
  nearExitDoor,
  keysCount,
  totalKeys,
  almondWaterCount,
  isFlashlightOn,
  battery,
  onDrinkWater,
  onOpenMap,
  onOpenSettings,
  onInteract,
}) => {
  // Movement Stick (Left)
  const leftStickRef = useRef<HTMLDivElement>(null);
  const [leftActive, setLeftActive] = useState(false);
  const [leftStickPos, setLeftStickPos] = useState({ x: 0, y: 0 });
  const leftTouchId = useRef<number | null>(null);
  const leftCenter = useRef({ x: 0, y: 0 });

  // Look Stick (Right - for Dual Stick mode)
  const rightStickRef = useRef<HTMLDivElement>(null);
  const [rightActive, setRightActive] = useState(false);
  const [rightStickPos, setRightStickPos] = useState({ x: 0, y: 0 });
  const rightStickTouchId = useRef<number | null>(null);
  const rightStickCenter = useRef({ x: 0, y: 0 });

  // Touch Swipe Look (Right screen half)
  const lookAreaRef = useRef<HTMLDivElement>(null);
  const lookTouchId = useRef<number | null>(null);
  const lastLookPos = useRef({ x: 0, y: 0 });

  // Button States
  const [sprintPressed, setSprintPressed] = useState(false);
  const [crouchPressed, setCrouchPressed] = useState(false);

  // Keyboard controls for Desktop fallback
  useEffect(() => {
    const keysDown = new Set<string>();

    const handleKeyDown = (e: KeyboardEvent) => {
      keysDown.add(e.code);

      if (e.code === 'KeyF') {
        inputRef.current.flashlightToggleRequested = true;
      }
      if (e.code === 'KeyE') {
        onInteract();
      }
      if (e.code === 'KeyQ') {
        onDrinkWater();
      }
      if (e.code === 'KeyM') {
        onOpenMap();
      }

      updateKeyboardMove();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDown.delete(e.code);
      updateKeyboardMove();
    };

    const updateKeyboardMove = () => {
      let mx = 0;
      let my = 0;

      if (keysDown.has('KeyW') || keysDown.has('ArrowUp')) my += 1;
      if (keysDown.has('KeyS') || keysDown.has('ArrowDown')) my -= 1;
      if (keysDown.has('KeyD') || keysDown.has('ArrowRight')) mx += 1;
      if (keysDown.has('KeyA') || keysDown.has('ArrowLeft')) mx -= 1;

      inputRef.current.move.x = mx;
      inputRef.current.move.y = my;
      inputRef.current.sprint = keysDown.has('ShiftLeft') || keysDown.has('ShiftRight');
      inputRef.current.crouch = keysDown.has('KeyC') || keysDown.has('ControlLeft');
    };

    // Desktop Mouse Look
    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement) {
        inputRef.current.look.x += e.movementX;
        inputRef.current.look.y += e.movementY;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [inputRef, onInteract, onDrinkWater, onOpenMap]);

  // Handle Left Joystick (Movement)
  const handleLeftTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.changedTouches[0];
    if (leftTouchId.current !== null) return;

    leftTouchId.current = touch.identifier;
    if (leftStickRef.current) {
      const rect = leftStickRef.current.getBoundingClientRect();
      leftCenter.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }
    setLeftActive(true);
    updateLeftStick(touch.clientX, touch.clientY);
  };

  const updateLeftStick = useCallback((clientX: number, clientY: number) => {
    const maxRadius = 50;
    const dx = clientX - leftCenter.current.x;
    const dy = clientY - leftCenter.current.y;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);

    const clampedDist = Math.min(dist, maxRadius);
    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    setLeftStickPos({ x: knobX, y: knobY });

    // Normalized input (-1 to 1)
    const normX = knobX / maxRadius;
    const normY = -knobY / maxRadius; // invert Y so up is forward (+1)

    inputRef.current.move.x = normX;
    inputRef.current.move.y = normY;
  }, [inputRef]);

  // Handle Right Joystick (Camera Look in Dual Stick mode)
  const handleRightStickStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.changedTouches[0];
    if (rightStickTouchId.current !== null) return;

    rightStickTouchId.current = touch.identifier;
    if (rightStickRef.current) {
      const rect = rightStickRef.current.getBoundingClientRect();
      rightStickCenter.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }
    setRightActive(true);
    updateRightStick(touch.clientX, touch.clientY);
  };

  const updateRightStick = useCallback((clientX: number, clientY: number) => {
    const maxRadius = 50;
    const dx = clientX - rightStickCenter.current.x;
    const dy = clientY - rightStickCenter.current.y;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);

    const clampedDist = Math.min(dist, maxRadius);
    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    setRightStickPos({ x: knobX, y: knobY });

    // Continuous look rate
    const rateX = (knobX / maxRadius) * 22;
    const rateY = (knobY / maxRadius) * 22;

    inputRef.current.look.x += rateX;
    inputRef.current.look.y += rateY;
  }, [inputRef]);

  // Continuous loop for right stick continuous turning
  useEffect(() => {
    if (settings.joystickMode !== 'dual_sticks') return;
    let timer: number;
    const loop = () => {
      if (rightActive) {
        const maxRadius = 50;
        const rateX = (rightStickPos.x / maxRadius) * 20;
        const rateY = (rightStickPos.y / maxRadius) * 16;
        inputRef.current.look.x += rateX;
        inputRef.current.look.y += rateY;
      }
      timer = requestAnimationFrame(loop);
    };
    timer = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(timer);
  }, [rightActive, rightStickPos, settings.joystickMode, inputRef]);

  // Handle Touch-Drag Look (Right Half Screen Swipe)
  const handleLookTouchStart = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      // Check if on right half of screen
      if (touch.clientX > window.innerWidth * 0.35 && lookTouchId.current === null) {
        lookTouchId.current = touch.identifier;
        lastLookPos.current = { x: touch.clientX, y: touch.clientY };
        break;
      }
    }
  };

  const handleLookTouchMove = useCallback((e: TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === lookTouchId.current) {
        const deltaX = touch.clientX - lastLookPos.current.x;
        const deltaY = touch.clientY - lastLookPos.current.y;

        inputRef.current.look.x += deltaX * 1.6;
        inputRef.current.look.y += deltaY * 1.6;

        lastLookPos.current = { x: touch.clientX, y: touch.clientY };
      }
    }
  }, [inputRef]);

  // Global Window Touch listeners for smooth drag outside initial element
  useEffect(() => {
    const handleGlobalTouchMove = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === leftTouchId.current) {
          updateLeftStick(touch.clientX, touch.clientY);
        }
        if (touch.identifier === rightStickTouchId.current) {
          updateRightStick(touch.clientX, touch.clientY);
        }
      }
      handleLookTouchMove(e);
    };

    const handleGlobalTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === leftTouchId.current) {
          leftTouchId.current = null;
          setLeftActive(false);
          setLeftStickPos({ x: 0, y: 0 });
          inputRef.current.move.x = 0;
          inputRef.current.move.y = 0;
        }
        if (touch.identifier === rightStickTouchId.current) {
          rightStickTouchId.current = null;
          setRightActive(false);
          setRightStickPos({ x: 0, y: 0 });
        }
        if (touch.identifier === lookTouchId.current) {
          lookTouchId.current = null;
        }
      }
    };

    window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    window.addEventListener('touchend', handleGlobalTouchEnd);
    window.addEventListener('touchcancel', handleGlobalTouchEnd);

    return () => {
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalTouchEnd);
      window.removeEventListener('touchcancel', handleGlobalTouchEnd);
    };
  }, [updateLeftStick, updateRightStick, handleLookTouchMove, inputRef]);

  // Flashlight toggle
  const toggleFlashlight = () => {
    inputRef.current.flashlightToggleRequested = true;
  };

  // Sprint toggle/hold
  const handleSprintStart = () => {
    setSprintPressed(true);
    inputRef.current.sprint = true;
  };
  const handleSprintEnd = () => {
    setSprintPressed(false);
    inputRef.current.sprint = false;
  };

  // Crouch toggle/hold
  const handleCrouchToggle = () => {
    const next = !crouchPressed;
    setCrouchPressed(next);
    inputRef.current.crouch = next;
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-3 sm:p-4 select-none">
      {/* Top Header Bar */}
      <div className="w-full flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2">
          {/* Map Button */}
          <button
            id="map-toggle-btn"
            onClick={onOpenMap}
            className="flex items-center gap-1.5 px-3 py-2 bg-black/60 backdrop-blur-md border border-yellow-600/40 rounded-lg text-yellow-400 active:scale-95 transition-all text-xs font-mono shadow-md"
          >
            <Compass className="w-4 h-4" />
            <span>MAP</span>
          </button>

          {/* Quick Almond Water Drink */}
          {almondWaterCount > 0 && (
            <button
              id="drink-water-btn"
              onClick={onDrinkWater}
              className="flex items-center gap-1.5 px-3 py-2 bg-teal-950/70 backdrop-blur-md border border-teal-500/50 rounded-lg text-teal-300 active:scale-95 transition-all text-xs font-mono shadow-md animate-pulse"
            >
              <Coffee className="w-4 h-4" />
              <span>DRINK ({almondWaterCount})</span>
            </button>
          )}
        </div>

        {/* Right Settings */}
        <div className="flex items-center gap-2">
          <button
            id="settings-toggle-btn"
            onClick={onOpenSettings}
            className="p-2.5 bg-black/60 backdrop-blur-md border border-yellow-600/40 rounded-lg text-yellow-400 active:scale-95 transition-all shadow-md"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center Swipe-to-Look Area (Active across right 65% when not hitting buttons) */}
      <div
        ref={lookAreaRef}
        onTouchStart={handleLookTouchStart}
        className="absolute inset-0 pointer-events-auto z-0"
        style={{ left: '35%' }}
      />

      {/* Contextual Center Interaction Prompt */}
      {(nearbyItem || nearExitDoor) && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-30 flex flex-col items-center">
          <button
            id="center-interact-btn"
            onClick={onInteract}
            className="flex items-center gap-2.5 px-6 py-3.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold font-mono text-sm rounded-xl shadow-2xl active:scale-95 transition-transform animate-bounce border-2 border-yellow-200"
          >
            <Hand className="w-5 h-5 animate-pulse" />
            <span>
              {nearExitDoor
                ? keysCount >= totalKeys
                  ? 'ESCAPE (UNLOCK EXIT)'
                  : `DOOR LOCKED (${keysCount}/${totalKeys} KEYS)`
                : `PICK UP ${nearbyItem?.title?.toUpperCase() || 'ITEM'}`}
            </span>
          </button>
          {nearExitDoor && keysCount < totalKeys && (
            <div className="mt-2 text-xs font-mono text-amber-300 bg-black/80 px-3 py-1 rounded border border-amber-500/40">
              Collect all 3 vibrating keys to unlock!
            </div>
          )}
        </div>
      )}

      {/* Bottom Controls Bar (Sticks & Action Buttons) */}
      <div className="w-full flex items-end justify-between pointer-events-none relative z-10">
        {/* Left Side: Analog Virtual Movement Stick */}
        <div className="relative pointer-events-auto flex items-center justify-center pb-2 pl-2">
          <div
            ref={leftStickRef}
            id="left-move-stick"
            onTouchStart={handleLeftTouchStart}
            className={`w-32 h-32 rounded-full border-2 flex items-center justify-center transition-colors relative ${
              leftActive
                ? 'bg-yellow-950/40 border-yellow-400/80 shadow-[0_0_20px_rgba(234,179,8,0.3)]'
                : 'bg-black/50 border-yellow-600/40 backdrop-blur-sm'
            }`}
          >
            {/* Base Crosshairs */}
            <div className="absolute w-full h-[1px] bg-yellow-500/20" />
            <div className="absolute h-full w-[1px] bg-yellow-500/20" />
            <div className="absolute text-[10px] font-mono font-bold text-yellow-500/60 top-1">MOVE</div>

            {/* Inner Knob */}
            <div
              className={`w-14 h-14 rounded-full border-2 flex items-center justify-center shadow-lg transition-transform ${
                leftActive
                  ? 'bg-yellow-500 border-yellow-200 scale-105'
                  : 'bg-yellow-600/80 border-yellow-400'
              }`}
              style={{
                transform: `translate(${leftStickPos.x}px, ${leftStickPos.y}px)`,
              }}
            >
              <div className="w-4 h-4 rounded-full bg-black/40" />
            </div>
          </div>
        </div>

        {/* Center/Right Action Buttons */}
        <div className="flex items-end gap-3 pointer-events-auto pr-2 pb-2">
          {/* Flashlight Toggle */}
          <button
            id="flashlight-btn"
            onClick={toggleFlashlight}
            className={`p-3.5 rounded-full border-2 flex flex-col items-center justify-center active:scale-90 transition-transform ${
              isFlashlightOn && battery > 0
                ? 'bg-amber-500 border-yellow-200 text-black shadow-[0_0_16px_rgba(245,158,11,0.5)]'
                : 'bg-black/60 border-zinc-700 text-zinc-400'
            }`}
          >
            <Flashlight className="w-6 h-6" />
            <span className="text-[9px] font-mono font-bold mt-0.5">{battery}%</span>
          </button>

          {/* Crouch Toggle */}
          <button
            id="crouch-btn"
            onClick={handleCrouchToggle}
            className={`p-3.5 rounded-full border-2 flex items-center justify-center active:scale-90 transition-transform ${
              crouchPressed
                ? 'bg-indigo-600 border-indigo-300 text-white shadow-[0_0_16px_rgba(99,102,241,0.5)]'
                : 'bg-black/60 border-yellow-600/40 text-yellow-400'
            }`}
          >
            <Eye className="w-6 h-6" />
          </button>

          {/* Sprint / Run Button (Hold or Touch) */}
          <button
            id="sprint-btn"
            onTouchStart={handleSprintStart}
            onTouchEnd={handleSprintEnd}
            onMouseDown={handleSprintStart}
            onMouseUp={handleSprintEnd}
            className={`p-4 rounded-full border-2 flex items-center justify-center active:scale-90 transition-transform ${
              sprintPressed
                ? 'bg-amber-600 border-amber-300 text-white shadow-[0_0_20px_rgba(217,119,6,0.6)]'
                : 'bg-black/60 border-yellow-600/40 text-yellow-400'
            }`}
          >
            <Footprints className="w-7 h-7" />
          </button>

          {/* Right Look Stick (Shown if Dual Sticks mode is selected in Settings) */}
          {settings.joystickMode === 'dual_sticks' && (
            <div className="relative ml-2">
              <div
                ref={rightStickRef}
                id="right-look-stick"
                onTouchStart={handleRightStickStart}
                className={`w-32 h-32 rounded-full border-2 flex items-center justify-center transition-colors relative ${
                  rightActive
                    ? 'bg-amber-950/40 border-amber-400/80 shadow-[0_0_20px_rgba(251,191,36,0.3)]'
                    : 'bg-black/50 border-amber-600/40 backdrop-blur-sm'
                }`}
              >
                <div className="absolute w-full h-[1px] bg-amber-500/20" />
                <div className="absolute h-full w-[1px] bg-amber-500/20" />
                <div className="absolute text-[10px] font-mono font-bold text-amber-500/60 top-1">LOOK</div>

                <div
                  className={`w-14 h-14 rounded-full border-2 flex items-center justify-center shadow-lg transition-transform ${
                    rightActive
                      ? 'bg-amber-500 border-amber-200 scale-105'
                      : 'bg-amber-600/80 border-amber-400'
                  }`}
                  style={{
                    transform: `translate(${rightStickPos.x}px, ${rightStickPos.y}px)`,
                  }}
                >
                  <div className="w-4 h-4 rounded-full bg-black/40" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
