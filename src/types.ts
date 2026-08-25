export type GameStatus = 'intro' | 'playing' | 'paused' | 'gameover' | 'victory';

export type JoystickMode = 'dual_sticks' | 'touch_swipe';

export type GameDifficulty = 'peaceful' | 'normal' | 'nightmare';

export interface GameSettings {
  moveSensitivity: number;
  lookSensitivity: number;
  joystickMode: JoystickMode;
  vhsEffect: boolean;
  soundVolume: number;
  fov: number;
  invertY: boolean;
  difficulty: GameDifficulty;
  showMinimap: boolean;
}

export interface InputState {
  move: { x: number; y: number }; // x: strafe (-1 left, 1 right), y: forward/back (-1 back, 1 fwd)
  look: { x: number; y: number }; // delta x (yaw), delta y (pitch)
  sprint: boolean;
  crouch: boolean;
  flashlightToggleRequested: boolean;
  interactRequested: boolean;
}

export type ItemType = 'almond_water' | 'key' | 'vhs_tape' | 'battery' | 'lore_note';

export interface WorldItem {
  id: string;
  type: ItemType;
  x: number;
  z: number;
  collected: boolean;
  title: string;
  description: string;
  loreContent?: string;
}

export interface PlayerStats {
  sanity: number; // 0 to 100
  stamina: number; // 0 to 100
  flashlightBattery: number; // 0 to 100
  isFlashlightOn: boolean;
  keysCollected: number;
  totalKeysNeeded: number;
  tapesCollected: number;
  almondWaterCount: number;
  distanceTraveled: number;
  timeSurvivedSeconds: number;
}

export interface EntityInfo {
  x: number;
  z: number;
  distanceToPlayer: number;
  isChasing: boolean;
  alertness: number; // 0 to 1
}

export interface MazeCell {
  x: number;
  z: number;
  wallNorth: boolean;
  wallSouth: boolean;
  wallEast: boolean;
  wallWest: boolean;
  hasPillar: boolean;
  lightFlicker: boolean;
  lightColor: string;
  lightIntensity: number;
  roomType: 'hallway' | 'office' | 'storage' | 'corridor' | 'exit_room' | 'dark_zone';
}

export interface MazeData {
  width: number;
  height: number;
  cellSize: number;
  grid: number[][]; // 0: floor/open, 1: wall, 2: pillar, 3: exit door, 4: spawn
  items: WorldItem[];
  exitPosition: { x: number; z: number };
  spawnPosition: { x: number; z: number };
  lights: { x: number; z: number; flicker: boolean; broken: boolean; color: number }[];
}
