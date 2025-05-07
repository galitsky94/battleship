import { createContext, useContext, useState, useCallback, type ReactNode, useEffect, useRef } from 'react';
import type { BattleAction, CellState, Chunk, GridStats, Ship, Team, TeamGridState } from '../types';
import {
  CHUNK_SIZE,
  CELLS_PER_CHUNK,
  GRID_SIZE,
  SHIP_SIZES,
  generateEmptyGrid,
  generateId,
  generateOwner,
  getChunkFromCoords,
  generateRandomShipPlacement,
  isValidShipPlacement,
  TOTAL_CHUNKS,
  DESTROYED_TERRITORY_COOLDOWN
} from '../utils/grid';
import { useTeamSelection } from './TeamSelectionContext';

// Constants for heat map decay
const DECAY_INTERVAL = 10000; // Check for decay only every 10 seconds
const ACTIVITY_LIFETIME = 120000; // Full activity persists for 2 minutes
const ACTIVITY_EXTENDED_LIFETIME = 240000; // Extended visibility for up to 4 minutes
const NO_DECAY_PERIOD = 60000; // No decay at all for the first minute
const SUPER_SLOW_DECAY_RATE = 0.999; // Almost no decay (99.9% retention)
const SLOW_DECAY_RATE = 0.98; // Slow decay (98% retention)
const FINAL_DECAY_RATE = 0.95; // Final decay (95% retention)

interface BattleContextType {
  // Team grids
  blueTeamGrid: TeamGridState;
  redTeamGrid: TeamGridState;

  // Current active grid based on team and view
  grid: CellState[][];
  ships: Ship[];
  chunks: Chunk[];
  stats: GridStats & {
    destroyedShips?: number;
    activeShips?: number;
    hitRatio?: number;
  };

  // Core functions with team awareness
  currentPlayer: string;
  selectedShipSize: number;
  placeShip: (x: number, y: number, size: number, horizontal: boolean, team: Team) => boolean;
  fireShot: (x: number, y: number, team: Team) => boolean;
  setSelectedShipSize: (size: number) => void;

  // Existing properties
  simulateBattle: (
    actionsCount: number,
    options?: {
      testAction?: {
        type: 'PLACE_SHIP' | 'FIRE';
        x: number;
        y: number;
        shipSize?: number;
        isHorizontal?: boolean;
      };
    }
  ) => void;
  viewportPosition: { x: number, y: number };
  setViewportPosition: React.Dispatch<React.SetStateAction<{ x: number, y: number }>>;
  isHorizontal: boolean;
  setIsHorizontal: (horizontal: boolean) => void;
  showHeatMap: boolean;
  setShowHeatMap: (show: boolean) => void;

  // Zoom-related states and functions
  isZoomedIn: boolean;
  zoomedChunk: { x: number, y: number } | null;
  zoomToChunk: (chunk: { x: number, y: number }) => void;
  returnToOverview: () => void;
  cellSizeMultiplier: number;
}

const BattleContext = createContext<BattleContextType | undefined>(undefined);

// Helper to calculate additional stats
const calculateAdditionalStats = (ships: Ship[], totalHits: number) => {
  const destroyedShips = ships.filter(ship => ship.destroyed).length;
  const activeShips = ships.length - destroyedShips;
  const hitRatio = totalHits > 0 ? Math.round((destroyedShips / totalHits) * 100) : 0;

  return {
    destroyedShips,
    activeShips,
    hitRatio
  };
};

export const BattleProvider = ({ children }: { children: ReactNode }) => {
  // Get team selection context
  const { selectedTeam, activeView } = useTeamSelection();

  // Initialize team grid states
  const [blueTeamGrid, setBlueTeamGrid] = useState<TeamGridState>(() => ({
    grid: generateEmptyGrid(),
    ships: [],
    chunks: Array.from({ length: TOTAL_CHUNKS }, (_, index) => {
      const x = index % CHUNK_SIZE;
      const y = Math.floor(index / CHUNK_SIZE);
      return {
        x,
        y,
        heatLevel: 0,
        lastActivity: 0,
        activityCount: 0
      };
    }),
    stats: {
      totalShips: 0,
      totalHits: 0,
      totalChunks: TOTAL_CHUNKS
    }
  }));

  const [redTeamGrid, setRedTeamGrid] = useState<TeamGridState>(() => ({
    grid: generateEmptyGrid(),
    ships: [],
    chunks: Array.from({ length: TOTAL_CHUNKS }, (_, index) => {
      const x = index % CHUNK_SIZE;
      const y = Math.floor(index / CHUNK_SIZE);
      return {
        x,
        y,
        heatLevel: 0,
        lastActivity: 0,
        activityCount: 0
      };
    }),
    stats: {
      totalShips: 0,
      totalHits: 0,
      totalChunks: TOTAL_CHUNKS
    }
  }));

  // Current player
  const [currentPlayer] = useState<string>(() => generateOwner());
  const [selectedShipSize, setSelectedShipSize] = useState<number>(SHIP_SIZES[0]);
  const [viewportPosition, setViewportPosition] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [isHorizontal, setIsHorizontal] = useState<boolean>(true);
  const [showHeatMap, setShowHeatMap] = useState<boolean>(false);

  // Zoom-related state
  const [isZoomedIn, setIsZoomedIn] = useState<boolean>(false);
  const [zoomedChunk, setZoomedChunk] = useState<{ x: number, y: number } | null>(null);
  const [previousViewport, setPreviousViewport] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [cellSizeMultiplier, setCellSizeMultiplier] = useState<number>(1);

  // Helper to get the correct team grid based on view and team
  const getActiveGrid = useCallback((): TeamGridState => {
    // For attack view, we access the opposite team's grid
    if (activeView === 'attack') {
      return selectedTeam === 'blue' ? redTeamGrid : blueTeamGrid;
    }
    // For defend view, we access our own team's grid
    return selectedTeam === 'blue' ? blueTeamGrid : redTeamGrid;
  }, [activeView, selectedTeam, blueTeamGrid, redTeamGrid]);

  // Get current active grid, ships, chunks, and stats based on selected team and view
  const activeTeamGrid = getActiveGrid();
  const grid = activeTeamGrid.grid;
  const ships = activeTeamGrid.ships;
  const chunks = activeTeamGrid.chunks;

  // Add additional calculated stats to the base stats
  const additionalStats = calculateAdditionalStats(ships, activeTeamGrid.stats.totalHits);
  const stats = {
    ...activeTeamGrid.stats,
    ...additionalStats
  };

  // Ref to store the last time we updated the heat levels
  const lastHeatUpdateRef = useRef<number>(Date.now());

  // Helper function to apply cooldown to a ship's surrounding cells
  const applyCooldownToShipArea = (
    shipCells: { x: number; y: number }[],
    targetTeam: Team,
    setGridFn: React.Dispatch<React.SetStateAction<TeamGridState>>
  ) => {
    const now = Date.now();
    const cooldownEndTime = now + DESTROYED_TERRITORY_COOLDOWN;

    // Get all cells in a 1-cell radius around the ship
    const cooldownCells = new Set<string>();

    // Add all ship cells first
    for (const cell of shipCells) {
      cooldownCells.add(`${cell.x},${cell.y}`);
    }

    // Add surrounding cells within 1 cell radius
    for (const cell of shipCells) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const cx = cell.x + dx;
          const cy = cell.y + dy;

          // Skip if out of bounds
          if (cx < 0 || cx >= GRID_SIZE || cy < 0 || cy >= GRID_SIZE) continue;

          // Add to cooldown cells
          cooldownCells.add(`${cx},${cy}`);
        }
      }
    }

    // Apply cooldown to the collected cells
    setGridFn(prev => {
      const newGrid = [...prev.grid];

      // Apply cooldown to each cell
      for (const key of cooldownCells) {
        const [x, y] = key.split(',').map(Number);
        if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
          newGrid[y][x] = {
            ...newGrid[y][x],
            cooldownUntil: cooldownEndTime
          };
        }
      }

      return {
        ...prev,
        grid: newGrid
      };
    });
  };

  // Zoom to a specific chunk
  const zoomToChunk = useCallback((chunk: { x: number, y: number }) => {
    // Store current viewport position for returning to overview
    setPreviousViewport({ ...viewportPosition });

    // Calculate the position of the chunk
    const chunkStartX = chunk.x * CELLS_PER_CHUNK;
    const chunkStartY = chunk.y * CELLS_PER_CHUNK;

    // Set zoom and chunk state
    setIsZoomedIn(true);
    setZoomedChunk(chunk);
    setCellSizeMultiplier(4); // Zoom level

    // Set viewport to focus on the chunk with some adjustments for better centering
    // Wait for the cell size multiplier to be applied before calculating the exact position
    setTimeout(() => {
      // Get the canvas dimensions to center properly
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        // Calculate center of chunk in pixels with the new zoom level
        const cellSizeZoomed = 2.5 * 4; // baseCellSize * new multiplier
        const chunkWidthZoomed = CELLS_PER_CHUNK * cellSizeZoomed;

        // Calculate viewport position to center the chunk
        const newX = Math.max(0, (chunkStartX * cellSizeZoomed) - (canvasWidth - chunkWidthZoomed) / 2);
        const newY = Math.max(0, (chunkStartY * cellSizeZoomed) - (canvasHeight - chunkWidthZoomed) / 2);

        // Limit the viewport to stay within grid boundaries
        const maxX = GRID_SIZE * cellSizeZoomed - canvasWidth;
        const maxY = GRID_SIZE * cellSizeZoomed - canvasHeight;

        setViewportPosition({
          x: Math.min(newX, Math.max(0, maxX)),
          y: Math.min(newY, Math.max(0, maxY))
        });
      }
    }, 0);
  }, [viewportPosition]);

  // Return to overview
  const returnToOverview = useCallback(() => {
    setIsZoomedIn(false);
    setZoomedChunk(null);
    setCellSizeMultiplier(1);
    setViewportPosition(previousViewport);
  }, [previousViewport]);

  // Set up decay interval for heat map
  useEffect(() => {
    const decayTimer = setInterval(() => {
      const now = Date.now();

      // Decay blue team chunks
      setBlueTeamGrid(prev => {
        const newChunks = [...prev.chunks];
        let hasChanges = false;

        for (let i = 0; i < newChunks.length; i++) {
          const chunk = newChunks[i];

          if (chunk.activityCount > 0) {
            const timeSinceActivity = now - chunk.lastActivity;

            if (timeSinceActivity <= NO_DECAY_PERIOD) {
              continue;
            }

            let decayRate: number;

            if (timeSinceActivity < ACTIVITY_LIFETIME) {
              decayRate = SUPER_SLOW_DECAY_RATE;
            } else if (timeSinceActivity < ACTIVITY_EXTENDED_LIFETIME) {
              decayRate = SLOW_DECAY_RATE;
            } else {
              decayRate = FINAL_DECAY_RATE;
            }

            const newActivityCount = chunk.activityCount * decayRate;

            if (newActivityCount < 0.1) {
              if (chunk.activityCount > 0) {
                newChunks[i] = {
                  ...chunk,
                  activityCount: 0,
                  heatLevel: 0
                };
                hasChanges = true;
              }
            }
            else if (Math.abs(newActivityCount - chunk.activityCount) > 0.01) {
              newChunks[i] = {
                ...chunk,
                activityCount: newActivityCount
              };
              hasChanges = true;
            }
          }
        }

        if (hasChanges) {
          return {
            ...prev,
            chunks: updateHeatLevels(newChunks)
          };
        }

        return prev;
      });

      // Decay red team chunks
      setRedTeamGrid(prev => {
        const newChunks = [...prev.chunks];
        let hasChanges = false;

        for (let i = 0; i < newChunks.length; i++) {
          const chunk = newChunks[i];

          if (chunk.activityCount > 0) {
            const timeSinceActivity = now - chunk.lastActivity;

            if (timeSinceActivity <= NO_DECAY_PERIOD) {
              continue;
            }

            let decayRate: number;

            if (timeSinceActivity < ACTIVITY_LIFETIME) {
              decayRate = SUPER_SLOW_DECAY_RATE;
            } else if (timeSinceActivity < ACTIVITY_EXTENDED_LIFETIME) {
              decayRate = SLOW_DECAY_RATE;
            } else {
              decayRate = FINAL_DECAY_RATE;
            }

            const newActivityCount = chunk.activityCount * decayRate;

            if (newActivityCount < 0.1) {
              if (chunk.activityCount > 0) {
                newChunks[i] = {
                  ...chunk,
                  activityCount: 0,
                  heatLevel: 0
                };
                hasChanges = true;
              }
            }
            else if (Math.abs(newActivityCount - chunk.activityCount) > 0.01) {
              newChunks[i] = {
                ...chunk,
                activityCount: newActivityCount
              };
              hasChanges = true;
            }
          }
        }

        if (hasChanges) {
          return {
            ...prev,
            chunks: updateHeatLevels(newChunks)
          };
        }

        return prev;
      });

      lastHeatUpdateRef.current = now;
    }, DECAY_INTERVAL);

    return () => clearInterval(decayTimer);
  }, []);

  // Update chunk activity when a shot is fired - modified for team grid
  const updateChunkActivity = useCallback((x: number, y: number, team: Team) => {
    const { chunkX, chunkY } = getChunkFromCoords(x, y);

    // When firing, we update the opposite team's chunks
    const targetTeam = team === 'blue' ? 'red' : 'blue';

    if (targetTeam === 'blue') {
      setBlueTeamGrid(prev => {
        const newChunks = [...prev.chunks];
        const chunkIndex = newChunks.findIndex(chunk => chunk.x === chunkX && chunk.y === chunkY);

        if (chunkIndex !== -1) {
          newChunks[chunkIndex] = {
            ...newChunks[chunkIndex],
            activityCount: (newChunks[chunkIndex].activityCount || 0) + 1,
            lastActivity: Date.now()
          };
        }

        return {
          ...prev,
          chunks: updateHeatLevels(newChunks)
        };
      });
    } else {
      setRedTeamGrid(prev => {
        const newChunks = [...prev.chunks];
        const chunkIndex = newChunks.findIndex(chunk => chunk.x === chunkX && chunk.y === chunkY);

        if (chunkIndex !== -1) {
          newChunks[chunkIndex] = {
            ...newChunks[chunkIndex],
            activityCount: (newChunks[chunkIndex].activityCount || 0) + 1,
            lastActivity: Date.now()
          };
        }

        return {
          ...prev,
          chunks: updateHeatLevels(newChunks)
        };
      });
    }
  }, []);

  // Calculate heat levels for all chunks based on activity counts
  const updateHeatLevels = useCallback((chunks: Chunk[]): Chunk[] => {
    const activeChunks = chunks.filter(chunk => chunk.activityCount > 0);
    if (activeChunks.length === 0) return chunks;

    const sortedChunks = [...activeChunks].sort((a, b) => b.activityCount - a.activityCount);

    const maxActivity = sortedChunks[0].activityCount;

    // Increase the percentage of hot and warm chunks for more visual impact
    const hotCount = Math.max(1, Math.floor(activeChunks.length * 0.2)); // Increased from 15% to 20%
    const warmCount = Math.max(2, Math.floor(activeChunks.length * 0.3)); // Increased from 25% to 30%

    const hotThreshold = sortedChunks[Math.min(hotCount - 1, sortedChunks.length - 1)].activityCount;
    const warmThreshold = sortedChunks[Math.min(hotCount + warmCount - 1, sortedChunks.length - 1)].activityCount;

    // Lower the minimum activity threshold to show more heat
    const minActivityThreshold = maxActivity * 0.03; // Decreased from 5% to 3%

    return chunks.map(chunk => {
      if (chunk.activityCount >= hotThreshold && chunk.activityCount > 0) {
        return { ...chunk, heatLevel: 3 };
      }
      if (chunk.activityCount >= warmThreshold && chunk.activityCount > 0) {
        return { ...chunk, heatLevel: 2 };
      }
      if (chunk.activityCount >= minActivityThreshold) {
        return { ...chunk, heatLevel: 1 };
      }
      return { ...chunk, heatLevel: 0 };
    });
  }, []);

  // Reset heat map for both teams
  const resetHeatMap = useCallback(() => {
    const resetChunks = (chunks: Chunk[]): Chunk[] =>
      chunks.map(chunk => ({
        ...chunk,
        heatLevel: 0,
        activityCount: 0,
        lastActivity: 0
      }));

    setBlueTeamGrid(prev => ({
      ...prev,
      chunks: resetChunks(prev.chunks)
    }));

    setRedTeamGrid(prev => ({
      ...prev,
      chunks: resetChunks(prev.chunks)
    }));
  }, []);

  // Process battle actions with team awareness
  const processAction = (action: BattleAction): boolean => {
    const { type, x, y, shipId, owner, shipCells, team } = action;

    // Determine which team is being affected
    const actionTeam = team || 'blue'; // Default to blue if not specified

    if (type === 'FIRE') {
      // When firing, update the opposite team's grid
      const targetTeam = actionTeam === 'blue' ? 'red' : 'blue';
      updateChunkActivity(x, y, actionTeam);

      // Get the current grid of the target team
      const targetGrid = targetTeam === 'blue' ? blueTeamGrid.grid : redTeamGrid.grid;
      const cell = targetGrid[y][x];

      if (cell.hit) {
        return false; // Cell already hit
      }

      // Update the appropriate team's grid
      if (targetTeam === 'blue') {
        setBlueTeamGrid(prev => {
          const newGrid = [...prev.grid];
          newGrid[y][x] = {
            ...newGrid[y][x],
            hit: true
          };

          return {
            ...prev,
            grid: newGrid,
            stats: {
              ...prev.stats,
              totalHits: prev.stats.totalHits + 1
            }
          };
        });
      } else {
        setRedTeamGrid(prev => {
          const newGrid = [...prev.grid];
          newGrid[y][x] = {
            ...newGrid[y][x],
            hit: true
          };

          return {
            ...prev,
            grid: newGrid,
            stats: {
              ...prev.stats,
              totalHits: prev.stats.totalHits + 1
            }
          };
        });
      }

      // Update ship hits if the cell was occupied
      if (cell.occupied && cell.ship) {
        // Get the target team set function
        const setTargetTeamGrid = targetTeam === 'blue' ? setBlueTeamGrid : setRedTeamGrid;
        let shipWasDestroyed = false;
        let destroyedShipCells: { x: number; y: number }[] = [];

        // Update the ship's hit count and check if destroyed
        setTargetTeamGrid(prev => {
          const updatedShips = prev.ships.map(ship => {
            if (ship.id === cell.ship?.id) {
              const newHits = ship.hits + 1;
              const isDestroyed = newHits === ship.cells.length;

              // Store if ship was destroyed for cooldown application
              if (isDestroyed) {
                shipWasDestroyed = true;
                destroyedShipCells = [...ship.cells];
              }

              return {
                ...ship,
                hits: newHits,
                destroyed: isDestroyed
              };
            }
            return ship;
          });

          return {
            ...prev,
            ships: updatedShips
          };
        });

        // Apply cooldown to surrounding cells if the ship was destroyed
        if (shipWasDestroyed && destroyedShipCells.length > 0) {
          applyCooldownToShipArea(destroyedShipCells, targetTeam, setTargetTeamGrid);
        }
      }

      return true;
    }

    if (type === 'PLACE_SHIP' && shipCells && owner) {
      const newShip: Ship = {
        id: shipId || generateId(),
        owner,
        cells: shipCells,
        hits: 0,
        destroyed: false
      };

      // Get current team's grid for validation
      const targetGrid = actionTeam === 'blue' ? blueTeamGrid.grid : redTeamGrid.grid;

      if (!isValidShipPlacement(targetGrid, shipCells)) {
        return false;
      }

      // Update the appropriate team's grid
      if (actionTeam === 'blue') {
        setBlueTeamGrid(prev => {
          const newGrid = [...prev.grid];
          for (const cell of shipCells) {
            newGrid[cell.y][cell.x] = {
              occupied: true,
              hit: false,
              ship: {
                id: newShip.id,
                owner: newShip.owner
              }
            };
          }

          return {
            ...prev,
            grid: newGrid,
            ships: [...prev.ships, newShip],
            stats: {
              ...prev.stats,
              totalShips: prev.stats.totalShips + 1
            }
          };
        });
      } else {
        setRedTeamGrid(prev => {
          const newGrid = [...prev.grid];
          for (const cell of shipCells) {
            newGrid[cell.y][cell.x] = {
              occupied: true,
              hit: false,
              ship: {
                id: newShip.id,
                owner: newShip.owner
              }
            };
          }

          return {
            ...prev,
            grid: newGrid,
            ships: [...prev.ships, newShip],
            stats: {
              ...prev.stats,
              totalShips: prev.stats.totalShips + 1
            }
          };
        });
      }

      return true;
    }

    return false;
  };

  // Updated placeShip function with team parameter
  const placeShip = (x: number, y: number, size: number, horizontal: boolean, team: Team): boolean => {
    const cells = [];
    for (let i = 0; i < size; i++) {
      cells.push({
        x: horizontal ? x + i : x,
        y: horizontal ? y : y + i
      });
    }

    return processAction({
      type: 'PLACE_SHIP',
      x,
      y,
      shipId: generateId(),
      owner: currentPlayer,
      shipCells: cells,
      timestamp: Date.now(),
      team
    });
  };

  // Updated fireShot function with team parameter
  const fireShot = (x: number, y: number, team: Team): boolean => {
    return processAction({
      type: 'FIRE',
      x,
      y,
      timestamp: Date.now(),
      team
    });
  };

  // Simplified version of simulateBattle for now
  const simulateBattle = (
    actionsCount: number,
    options?: {
      testAction?: {
        type: 'PLACE_SHIP' | 'FIRE';
        x: number;
        y: number;
        shipSize?: number;
        isHorizontal?: boolean;
      };
    }
  ) => {
    // Reset heat maps before simulating
    if (!options?.testAction) {
      resetHeatMap();
    }

    // ... rest of simulation code can be adapted as needed
    // For now, we'll keep a simplified version

    // Generate random ships for both teams
    const generateShips = (team: Team) => {
      for (let i = 0; i < Math.floor(actionsCount * 0.1); i++) {
        const size: number = SHIP_SIZES[Math.floor(Math.random() * SHIP_SIZES.length)];
        const teamGrid = team === 'blue' ? blueTeamGrid.grid : redTeamGrid.grid;
        const shipCells = generateRandomShipPlacement(teamGrid, size);

        if (shipCells && shipCells.length > 0) {
          const { x, y } = shipCells[0];
          processAction({
            type: 'PLACE_SHIP',
            x,
            y,
            shipId: generateId(),
            owner: generateOwner(),
            shipCells,
            timestamp: Date.now() - Math.floor(Math.random() * 300000),
            team
          });
        }
      }
    };

    // Simulate firing for both teams
    const simulateFiring = (team: Team, count: number) => {
      for (let i = 0; i < count; i++) {
        const x = Math.floor(Math.random() * GRID_SIZE);
        const y = Math.floor(Math.random() * GRID_SIZE);

        processAction({
          type: 'FIRE',
          x,
          y,
          timestamp: Date.now() - Math.floor(Math.random() * 30000),
          team
        });
      }
    };

    // Generate ships and simulate firing for both teams
    generateShips('blue');
    generateShips('red');

    // More firing than ship placement
    const fireCount = Math.floor(actionsCount * 0.9);
    simulateFiring('blue', Math.floor(fireCount / 2));
    simulateFiring('red', Math.floor(fireCount / 2));
  };

  return (
    <BattleContext.Provider value={{
      // Team grids
      blueTeamGrid,
      redTeamGrid,

      // Current active grid based on team and view
      grid,
      ships,
      chunks,
      stats,

      // Core functions
      currentPlayer,
      selectedShipSize,
      placeShip,
      fireShot,
      setSelectedShipSize,

      // Existing properties
      simulateBattle,
      viewportPosition,
      setViewportPosition,
      isHorizontal,
      setIsHorizontal,
      showHeatMap,
      setShowHeatMap,

      // Zoom-related states and functions
      isZoomedIn,
      zoomedChunk,
      zoomToChunk,
      returnToOverview,
      cellSizeMultiplier
    }}>
      {children}
    </BattleContext.Provider>
  );
};

export const useBattle = (): BattleContextType => {
  const context = useContext(BattleContext);
  if (context === undefined) {
    throw new Error('useBattle must be used within a BattleProvider');
  }
  return context;
};
