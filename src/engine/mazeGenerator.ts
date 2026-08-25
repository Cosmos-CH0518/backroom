import { MazeData, WorldItem } from '../types';

/**
 * Generates a non-Euclidean styled Level 0 Backrooms labyrinth with rooms,
 * long mono-yellow corridors, pillars, lights, items, and exit door.
 */
export function generateBackroomsMaze(width = 24, height = 24, cellSize = 4): MazeData {
  // 0: Floor/Passage, 1: Wall, 2: Pillar, 3: Exit Door, 4: Spawn
  const grid: number[][] = Array(height).fill(0).map(() => Array(width).fill(1));

  // Carve interconnected office rooms and hallways using randomized layout
  // 1. Fill boundary walls
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
        grid[y][x] = 1;
      }
    }
  }

  // 2. Carve open rooms and corridors
  const rooms: { x: number; y: number; w: number; h: number }[] = [];
  const roomCount = 14;

  for (let r = 0; r < roomCount; r++) {
    const rw = Math.floor(Math.random() * 4) + 3; // 3 to 6
    const rh = Math.floor(Math.random() * 4) + 3;
    const rx = Math.floor(Math.random() * (width - rw - 2)) + 1;
    const ry = Math.floor(Math.random() * (height - rh - 2)) + 1;

    for (let y = ry; y < ry + rh; y++) {
      for (let x = rx; x < rx + rw; x++) {
        if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
          grid[y][x] = 0;
        }
      }
    }

    // Add pillars inside large rooms
    if (rw >= 4 && rh >= 4 && Math.random() > 0.3) {
      const px = rx + Math.floor(rw / 2);
      const py = ry + Math.floor(rh / 2);
      if (px > 1 && px < width - 2 && py > 1 && py < height - 2) {
        grid[py][px] = 2; // Pillar
      }
    }

    rooms.push({ x: rx, y: ry, w: rw, h: rh });
  }

  // 3. Connect rooms with hallways
  for (let i = 0; i < rooms.length - 1; i++) {
    const rA = rooms[i];
    const rB = rooms[i + 1];

    let cx = Math.floor(rA.x + rA.w / 2);
    let cy = Math.floor(rA.y + rA.h / 2);
    const targetX = Math.floor(rB.x + rB.w / 2);
    const targetY = Math.floor(rB.y + rB.h / 2);

    while (cx !== targetX) {
      if (cx > 0 && cx < width - 1 && cy > 0 && cy < height - 1) {
        grid[cy][cx] = 0;
      }
      cx += cx < targetX ? 1 : -1;
    }

    while (cy !== targetY) {
      if (cx > 0 && cx < width - 1 && cy > 0 && cy < height - 1) {
        grid[cy][cx] = 0;
      }
      cy += cy < targetY ? 1 : -1;
    }
  }

  // Ensure plenty of open corridors
  for (let y = 2; y < height - 2; y += 3) {
    for (let x = 2; x < width - 2; x++) {
      if (Math.random() > 0.25) {
        grid[y][x] = 0;
      }
    }
  }
  for (let x = 2; x < width - 2; x += 3) {
    for (let y = 2; y < height - 2; y++) {
      if (Math.random() > 0.25) {
        grid[y][x] = 0;
      }
    }
  }

  // Spawn position (Room 0 or safe open spot)
  const spawnX = Math.floor(rooms[0].x + rooms[0].w / 2);
  const spawnY = Math.floor(rooms[0].y + rooms[0].h / 2);
  grid[spawnY][spawnX] = 4;

  // Exit position (Furthest room from spawn)
  let exitX = Math.floor(rooms[rooms.length - 1].x + rooms[rooms.length - 1].w / 2);
  let exitY = Math.floor(rooms[rooms.length - 1].y + rooms[rooms.length - 1].h / 2);
  if (exitX === spawnX && exitY === spawnY) {
    exitX = width - 3;
    exitY = height - 3;
    grid[exitY][exitX] = 0;
  }
  grid[exitY][exitX] = 3; // Exit door cell

  // Find all walkable empty cells
  const walkable: { x: number; y: number }[] = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (grid[y][x] === 0 && !(x === spawnX && y === spawnY) && !(x === exitX && y === exitY)) {
        walkable.push({ x, y });
      }
    }
  }

  // Shuffle walkable
  for (let i = walkable.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [walkable[i], walkable[j]] = [walkable[j], walkable[i]];
  }

  // Place World Items
  const items: WorldItem[] = [];

  // 1. Three Golden Anomalous Keys needed to unlock the exit door
  for (let k = 1; k <= 3; k++) {
    const spot = walkable.pop() || { x: 3 * k, y: 3 * k };
    items.push({
      id: `key_${k}`,
      type: 'key',
      x: (spot.x + 0.5) * cellSize,
      z: (spot.y + 0.5) * cellSize,
      collected: false,
      title: `No-Clip Key #${k}`,
      description: `Glitched anomaly key (${k}/3). Unlocks Level 0 Exit Door.`,
      loreContent: `Anomalous brass key vibrating at exactly 60Hz. It feels heavy and cold to the touch.`
    });
  }

  // 2. Almond Water bottles (Restores sanity and thirst)
  for (let w = 1; w <= 5; w++) {
    const spot = walkable.pop() || { x: 4 * w, y: 2 };
    items.push({
      id: `water_${w}`,
      type: 'almond_water',
      x: (spot.x + 0.5) * cellSize,
      z: (spot.y + 0.5) * cellSize,
      collected: false,
      title: 'Almond Water',
      description: 'Sweet scented water. Drink to restore 35% Sanity.',
      loreContent: 'Clear fluid tasting distinctly of vanilla and almonds. Vital for surviving the mental strain of Level 0.'
    });
  }

  // 3. Flashlight Extra Batteries
  for (let b = 1; b <= 4; b++) {
    const spot = walkable.pop() || { x: 2 * b + 5, y: 5 };
    items.push({
      id: `battery_${b}`,
      type: 'battery',
      x: (spot.x + 0.5) * cellSize,
      z: (spot.y + 0.5) * cellSize,
      collected: false,
      title: 'Heavy Duty Battery',
      description: 'Recharges flashlight by +60%.',
      loreContent: 'Standard 9V battery found abandoned on the moist carpet.'
    });
  }

  // 4. VHS Tapes / Survivor Logs
  const loreSnippets = [
    {
      title: 'VHS Tape #01: "The Hum"',
      desc: 'Recovered footage from Explorer M.R.',
      lore: '"Day 1. The fluorescent lights buzz at a steady 60 cycles per second. The smell of damp carpet is overwhelming. If you hear something wandering nearby, it sure as hell has heard you."'
    },
    {
      title: 'VHS Tape #02: "Smiler Advice"',
      desc: 'Warning note taped to a column.',
      lore: '"Rule 1: Never look directly into the glowing grin for too long. Crouch and back away slowly into illuminated areas. They avoid bright light."'
    },
    {
      title: 'VHS Tape #03: "The Exit"',
      desc: 'Scratched tape label.',
      lore: '"There is a steel emergency door marked with green neon. It requires three vibrating anomaly keys to break the lock matrix and escape to Level 1."'
    }
  ];

  loreSnippets.forEach((lore, idx) => {
    const spot = walkable.pop() || { x: 3 + idx * 4, y: 7 };
    items.push({
      id: `tape_${idx + 1}`,
      type: 'vhs_tape',
      x: (spot.x + 0.5) * cellSize,
      z: (spot.y + 0.5) * cellSize,
      collected: false,
      title: lore.title,
      description: lore.desc,
      loreContent: lore.lore
    });
  });

  // Lights placement across the maze ceiling
  const lights: { x: number; z: number; flicker: boolean; broken: boolean; color: number }[] = [];
  for (let y = 1; y < height - 1; y += 2) {
    for (let x = 1; x < width - 1; x += 2) {
      if (grid[y][x] === 0 || grid[y][x] === 4) {
        const isBroken = Math.random() < 0.12; // 12% dark spots
        const isFlicker = Math.random() < 0.28; // 28% flickering
        lights.push({
          x: (x + 0.5) * cellSize,
          z: (y + 0.5) * cellSize,
          flicker: isFlicker,
          broken: isBroken,
          color: 0xfff6cf
        });
      }
    }
  }

  return {
    width,
    height,
    cellSize,
    grid,
    items,
    exitPosition: {
      x: (exitX + 0.5) * cellSize,
      z: (exitY + 0.5) * cellSize
    },
    spawnPosition: {
      x: (spawnX + 0.5) * cellSize,
      z: (spawnY + 0.5) * cellSize
    },
    lights
  };
}
