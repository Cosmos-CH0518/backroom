import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BackroomsEngine } from './engine/BackroomsEngine';
import { generateBackroomsMaze } from './engine/mazeGenerator';
import { soundManager } from './audio/soundManager';
import { TouchControls } from './components/TouchControls';
import { HUD } from './components/HUD';
import { Minimap } from './components/Minimap';
import { SettingsModal } from './components/SettingsModal';
import { IntroScreen } from './components/IntroScreen';
import { GameOverModal } from './components/GameOverModal';
import { VictoryModal } from './components/VictoryModal';
import { LoreModal } from './components/LoreModal';
import {
  GameSettings,
  GameStatus,
  InputState,
  MazeData,
  PlayerStats,
  WorldItem,
} from './types';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<BackroomsEngine | null>(null);

  // Input state managed in ref for zero-latency 60FPS loop
  const inputStateRef = useRef<InputState>({
    move: { x: 0, y: 0 },
    look: { x: 0, y: 0 },
    sprint: false,
    crouch: false,
    flashlightToggleRequested: false,
    interactRequested: false,
  });

  // Settings State
  const [settings, setSettings] = useState<GameSettings>({
    moveSensitivity: 1.0,
    lookSensitivity: 1.0,
    joystickMode: 'touch_swipe', // Default: Left stick move + touch swipe look
    vhsEffect: true,
    soundVolume: 0.8,
    fov: 75,
    invertY: false,
    difficulty: 'normal',
    showMinimap: false,
  });

  // Game Lifecycle State
  const [gameStatus, setGameStatus] = useState<GameStatus>('intro');
  const [gameOverReason, setGameOverReason] = useState<string>('');
  const [mazeData, setMazeData] = useState<MazeData | null>(null);

  // Player & World UI States
  const [stats, setStats] = useState<PlayerStats>({
    sanity: 100,
    stamina: 100,
    flashlightBattery: 100,
    isFlashlightOn: true,
    keysCollected: 0,
    totalKeysNeeded: 3,
    tapesCollected: 0,
    almondWaterCount: 0,
    distanceTraveled: 0,
    timeSurvivedSeconds: 0,
  });

  const [nearbyItem, setNearbyItem] = useState<WorldItem | null>(null);
  const [nearExitDoor, setNearExitDoor] = useState(false);
  const [collectedItems, setCollectedItems] = useState<WorldItem[]>([]);
  const [proximityGlitch, setProximityGlitch] = useState(0);
  const [notification, setNotification] = useState<string | null>(null);
  const notifTimeoutRef = useRef<number | null>(null);

  // Modal Dialogs
  const [showMinimap, setShowMinimap] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLore, setShowLore] = useState(false);

  // Show Toast Notification
  const showToast = useCallback((msg: string) => {
    if (notifTimeoutRef.current) clearTimeout(notifTimeoutRef.current);
    setNotification(msg);
    notifTimeoutRef.current = window.setTimeout(() => {
      setNotification(null);
    }, 3200);
  }, []);

  // Initialize Game Session
  const startNewGame = useCallback(() => {
    // 1. Initialize procedural sound synthesizer
    soundManager.init();
    soundManager.setVolume(settings.soundVolume);

    // 2. Generate Backrooms Maze
    const newMaze = generateBackroomsMaze(24, 24, 4);
    setMazeData(newMaze);
    setCollectedItems([]);
    setNearbyItem(null);
    setNearExitDoor(false);
    setProximityGlitch(0);
    setShowMinimap(false);
    setShowSettings(false);
    setShowLore(false);

    // Reset input
    inputStateRef.current = {
      move: { x: 0, y: 0 },
      look: { x: 0, y: 0 },
      sprint: false,
      crouch: false,
      flashlightToggleRequested: false,
      interactRequested: false,
    };

    // 3. Destroy previous 3D engine if any
    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }

    // 4. Create new 3D engine
    if (containerRef.current) {
      const engine = new BackroomsEngine(containerRef.current, newMaze, settings);

      engine.onStatsUpdate = (newStats) => {
        setStats(newStats);
        setNearbyItem(engine.nearbyItem);
        setNearExitDoor(engine.nearExitDoor);
      };

      engine.onItemCollected = (item) => {
        setCollectedItems((prev) => [...prev, item]);
        if (item.type === 'key') {
          showToast(`🗝️ Obtained Anomaly Key (${engine.stats.keysCollected}/${engine.stats.totalKeysNeeded})`);
        } else if (item.type === 'almond_water') {
          showToast('💧 Drank Almond Water: +35% Sanity Restored');
        } else if (item.type === 'vhs_tape') {
          showToast(`📼 Found ${item.title}`);
        } else if (item.type === 'battery') {
          showToast('🔋 Flashlight Recharged (+65%)');
        }
      };

      engine.onProximityGlitch = (intensity) => {
        setProximityGlitch(intensity);
      };

      engine.onGameOver = (reason) => {
        setGameOverReason(reason);
        setGameStatus('gameover');
      };

      engine.onVictory = () => {
        setGameStatus('victory');
      };

      engineRef.current = engine;
    }

    setGameStatus('playing');
    showToast('Find 3 Anomaly Keys and locate the Exit Door.');
  }, [settings, showToast]);

  // Main 60 FPS Physics & Input Tick
  useEffect(() => {
    if (gameStatus !== 'playing') return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const delta = (time - lastTime) * 0.001;
      lastTime = time;

      if (engineRef.current) {
        // Read input state
        const currentInput = { ...inputStateRef.current };

        // Reset one-shot action flags
        inputStateRef.current.flashlightToggleRequested = false;
        inputStateRef.current.interactRequested = false;

        // Reset continuous look accumulation
        inputStateRef.current.look.x = 0;
        inputStateRef.current.look.y = 0;

        // Update 3D engine
        engineRef.current.update(delta, currentInput);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameStatus]);

  // Handle drink almond water from inventory
  const handleDrinkWater = () => {
    if (engineRef.current) {
      engineRef.current.drinkAlmondWaterInventory();
      showToast('💧 Drank Almond Water: +40% Sanity');
    }
  };

  // Handle interaction trigger
  const handleInteract = () => {
    inputStateRef.current.interactRequested = true;
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden font-mono select-none">
      {/* 3D Canvas Viewport */}
      <div
        ref={containerRef}
        id="backrooms-canvas-container"
        className="w-full h-full absolute inset-0 z-0 cursor-crosshair touch-none"
      />

      {/* Intro Screen */}
      {gameStatus === 'intro' && (
        <IntroScreen
          settings={settings}
          onUpdateSettings={setSettings}
          onStartGame={startNewGame}
        />
      )}

      {/* Active In-Game HUD & Touch Controls */}
      {gameStatus === 'playing' && (
        <>
          <HUD
            stats={stats}
            vhsEnabled={settings.vhsEffect}
            proximityGlitch={proximityGlitch}
            notification={notification}
          />

          <TouchControls
            inputRef={inputStateRef}
            settings={settings}
            nearbyItem={nearbyItem}
            nearExitDoor={nearExitDoor}
            keysCount={stats.keysCollected}
            totalKeys={stats.totalKeysNeeded}
            almondWaterCount={stats.almondWaterCount}
            isFlashlightOn={stats.isFlashlightOn}
            battery={Math.round(stats.flashlightBattery)}
            onDrinkWater={handleDrinkWater}
            onOpenMap={() => setShowMinimap(true)}
            onOpenSettings={() => setShowSettings(true)}
            onInteract={handleInteract}
          />
        </>
      )}

      {/* Minimap Modal */}
      {showMinimap && mazeData && engineRef.current && (
        <Minimap
          mazeData={mazeData}
          visitedCells={engineRef.current.visitedCells}
          playerPosition={engineRef.current.playerPosition}
          playerYaw={engineRef.current.playerRotation.yaw}
          stats={stats}
          onClose={() => setShowMinimap(false)}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={(newSettings) => {
            setSettings(newSettings);
            if (engineRef.current) {
              engineRef.current.settings = newSettings;
              engineRef.current.setFov(newSettings.fov);
            }
          }}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Lore Logs Modal */}
      {showLore && (
        <LoreModal
          collectedItems={collectedItems}
          onClose={() => setShowLore(false)}
        />
      )}

      {/* Game Over Screen */}
      {gameStatus === 'gameover' && (
        <GameOverModal
          reason={gameOverReason}
          stats={stats}
          onRestart={startNewGame}
        />
      )}

      {/* Victory Screen */}
      {gameStatus === 'victory' && (
        <VictoryModal
          stats={stats}
          onRestart={startNewGame}
        />
      )}
    </div>
  );
}
