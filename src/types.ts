export type CellState = {
  occupied: boolean;
  hit: boolean;
  ship?: {
    id: string;
    owner: string;
  };
  cooldownUntil?: number; // Timestamp when the cooldown expires
};

export type Ship = {
  id: string;
  owner: string;
  cells: { x: number; y: number }[];
  hits: number;
  destroyed: boolean;
};

export type Chunk = {
  x: number;
  y: number;
  heatLevel: number;
  lastActivity: number;
  activityCount: number; // Total number of actions in this chunk
};

export type GridStats = {
  totalShips: number;
  totalHits: number;
  totalChunks: number;
  destroyedShips?: number;
  activeShips?: number;
  hitRatio?: number;
};

export type BattleAction = {
  type: 'PLACE_SHIP' | 'FIRE';
  x: number;
  y: number;
  shipId?: string;
  owner?: string;
  shipCells?: { x: number; y: number }[];
  timestamp: number;
  team?: 'red' | 'blue'; // The team performing the action
};

// New types for team-based play
export type Team = 'red' | 'blue';

export type TeamGridState = {
  grid: CellState[][];
  ships: Ship[];
  chunks: Chunk[];
  stats: GridStats;
};

export type GameView = 'defend' | 'attack';

export type TeamSelectionContextType = {
  selectedTeam: Team;
  setSelectedTeam: (team: Team) => void;
  activeView: GameView;
  setActiveView: (view: GameView) => void;
};
