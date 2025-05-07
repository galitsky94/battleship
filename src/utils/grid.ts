import { type CellState, Ship } from '../types';

// Constants for grid size and chunks
export const GRID_SIZE = 1000;
export const CHUNK_SIZE = 10;
export const CELLS_PER_CHUNK = 100;
export const TOTAL_CHUNKS = CHUNK_SIZE * CHUNK_SIZE;
export const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;

// Ship sizes
export const SHIP_SIZES = [2, 3, 4, 5];

// Cooldown time for destroyed territory (10 seconds)
export const DESTROYED_TERRITORY_COOLDOWN = 10000;

// Generate empty grid with all cells unoccupied and not hit
export const generateEmptyGrid = (): CellState[][] => {
  const grid: CellState[][] = [];

  for (let y = 0; y < GRID_SIZE; y++) {
    grid[y] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      grid[y][x] = { occupied: false, hit: false };
    }
  }

  return grid;
};

// Get chunk coordinates from cell coordinates
export const getChunkFromCoords = (x: number, y: number) => {
  const chunkX = Math.floor(x / CELLS_PER_CHUNK);
  const chunkY = Math.floor(y / CELLS_PER_CHUNK);
  return { chunkX, chunkY };
};

// Check if ship placement is valid
export const isValidShipPlacement = (
  grid: CellState[][],
  cells: { x: number; y: number }[]
): boolean => {
  const now = Date.now();

  // Check if all cells are within grid, not occupied, and not in cooldown
  return cells.every(({ x, y }) =>
    x >= 0 && x < GRID_SIZE &&
    y >= 0 && y < GRID_SIZE &&
    !grid[y][x].occupied &&
    (!grid[y][x].cooldownUntil || grid[y][x].cooldownUntil < now)
  );
};

// Generate a random ship placement
export const generateRandomShipPlacement = (
  grid: CellState[][],
  size: number
): { x: number; y: number }[] | null => {
  // Try 100 times to place a ship randomly
  for (let attempt = 0; attempt < 100; attempt++) {
    const isHorizontal = Math.random() > 0.5;
    const x = Math.floor(Math.random() * (isHorizontal ? (GRID_SIZE - size) : GRID_SIZE));
    const y = Math.floor(Math.random() * (isHorizontal ? GRID_SIZE : (GRID_SIZE - size)));

    const cells = [];
    for (let i = 0; i < size; i++) {
      cells.push({
        x: isHorizontal ? x + i : x,
        y: isHorizontal ? y : y + i
      });
    }

    if (isValidShipPlacement(grid, cells)) {
      return cells;
    }
  }

  return null; // Could not place ship after 100 attempts
};

// Calculate heat level based on recent activity
export const calculateHeatLevel = (lastActivity: number): number => {
  if (!lastActivity) return 0;

  const now = Date.now();
  const timeSinceActivity = now - lastActivity;

  // Random factor to create more natural heat map patterns (±10% variation)
  const randomFactor = 0.9 + (Math.random() * 0.2);
  const adjustedTime = timeSinceActivity * randomFactor;

  if (adjustedTime < 60000) { // Less than ~1 minute
    return 3; // Hot
  }

  if (adjustedTime < 300000) { // Less than ~5 minutes
    return 2; // Warm
  }

  if (adjustedTime < 1800000) { // Less than ~30 minutes
    return 1; // Cool
  }

  return 0; // Dead zone
};

// Generate a simple ID for ships
export const generateId = () => {
  return Math.random().toString(36).substring(2, 9);
};

// Generate a random owner ID for anonymous players
export const generateOwner = () => {
  return `anon-${Math.random().toString(36).substring(2, 9)}`;
};
