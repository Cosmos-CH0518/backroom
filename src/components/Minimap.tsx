import React from 'react';
import { X, Compass, Key, DoorClosed, User } from 'lucide-react';
import { MazeData, PlayerStats } from '../types';

interface MinimapProps {
  mazeData: MazeData;
  visitedCells: boolean[][];
  playerPosition: { x: number; z: number };
  playerYaw: number;
  stats: PlayerStats;
  onClose: () => void;
}

export const Minimap: React.FC<MinimapProps> = ({
  mazeData,
  visitedCells,
  playerPosition,
  playerYaw,
  stats,
  onClose,
}) => {
  const { width, height, cellSize, grid, items, exitPosition } = mazeData;

  const playerCellX = Math.floor(playerPosition.x / cellSize);
  const playerCellY = Math.floor(playerPosition.z / cellSize);

  // Exit cell
  const exitCellX = Math.floor(exitPosition.x / cellSize);
  const exitCellY = Math.floor(exitPosition.y / cellSize);
  const isExitDiscovered = visitedCells[exitCellY]?.[exitCellX];

  return (
    <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-zinc-950 border-2 border-yellow-600/60 rounded-2xl p-5 shadow-2xl flex flex-col items-center">
        {/* Header */}
        <div className="w-full flex items-center justify-between border-b border-yellow-700/30 pb-3 mb-4">
          <div className="flex items-center gap-2 text-yellow-400 font-mono font-bold text-base">
            <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: '8s' }} />
            <span>LEVEL 0 TACTICAL RADAR / 迷路マップ</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-900 border border-yellow-600/30 text-yellow-400 active:scale-95 transition-transform"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-[11px] font-mono text-zinc-300 mb-3 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block border border-black" />
            <span>Player (あなた)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-emerald-500 inline-block border border-black" />
            <span>Exit Door (脱出口)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-amber-400 inline-block rounded-sm" />
            <span>Keys ({stats.keysCollected}/{stats.totalKeysNeeded})</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-zinc-900 border border-zinc-700 inline-block" />
            <span>Fog of War (未探索)</span>
          </div>
        </div>

        {/* Map Grid Canvas Container */}
        <div className="relative border-2 border-yellow-800/60 bg-black rounded-lg overflow-hidden p-1">
          <div
            className="grid gap-[1px] bg-zinc-900"
            style={{
              gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
              width: 'min(78vw, 360px)',
              height: 'min(78vw, 360px)',
            }}
          >
            {Array.from({ length: height }).map((_, y) =>
              Array.from({ length: width }).map((_, x) => {
                const isVisited = visitedCells[y]?.[x];
                const cellVal = grid[y][x]; // 0: floor, 1: wall, 2: pillar, 3: exit
                const isPlayer = x === playerCellX && y === playerCellY;
                const isExit = x === exitCellX && y === exitCellY;

                // Check for items at this cell
                const itemAtCell = items.find(
                  (it) =>
                    !it.collected &&
                    Math.floor(it.x / cellSize) === x &&
                    Math.floor(it.z / cellSize) === y
                );

                let cellBg = 'bg-black'; // Unexplored fog
                if (isVisited) {
                  if (cellVal === 1) cellBg = 'bg-yellow-900/60 border border-yellow-950'; // Wall
                  else if (cellVal === 2) cellBg = 'bg-amber-950'; // Pillar
                  else cellBg = 'bg-yellow-100/10'; // Walkable Corridor
                }

                return (
                  <div
                    key={`${x}-${y}`}
                    className={`relative flex items-center justify-center ${cellBg} transition-colors`}
                  >
                    {/* Discovered Exit */}
                    {isVisited && isExit && (
                      <span className="w-2.5 h-2.5 bg-emerald-400 rounded-sm animate-ping shadow-[0_0_8px_#34d399]" />
                    )}

                    {/* Discovered Key / Item */}
                    {isVisited && itemAtCell && !itemAtCell.collected && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          itemAtCell.type === 'key' ? 'bg-amber-400 animate-pulse' : 'bg-cyan-400'
                        }`}
                      />
                    )}

                    {/* Player Marker */}
                    {isPlayer && (
                      <div
                        className="absolute z-20 flex items-center justify-center transition-transform duration-100"
                        style={{
                          transform: `rotate(${-playerYaw * (180 / Math.PI)}deg)`,
                        }}
                      >
                        <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-yellow-400 filter drop-shadow-[0_0_4px_#facc15]" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="w-full text-center mt-3 font-mono text-xs text-yellow-500/70">
          Tip: Explore rooms to clear fog of war. Find 3 glowing keys to escape!
        </div>
      </div>
    </div>
  );
};
