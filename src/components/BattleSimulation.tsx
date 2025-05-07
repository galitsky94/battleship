import { useEffect, useState, useCallback, useRef } from 'react';
import { useBattle } from '../contexts/BattleContext';
import { CELLS_PER_CHUNK, CHUNK_SIZE, GRID_SIZE } from '../utils/grid';

interface BattleSimulationProps {
  enabled: boolean;
  intensity: 'medium'; // Only medium intensity is supported
}

/**
 * Component to run a continuous simulation of battle activity across the grid
 */
const BattleSimulation: React.FC<BattleSimulationProps> = ({ enabled, intensity }) => {
  const { simulateBattle } = useBattle();
  const [simulationRunning, setSimulationRunning] = useState(false);
  const intervalIdRef = useRef<number | null>(null);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalIdRef.current !== null) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, []);

  // Define fixed interval speed for medium intensity
  const getIntervalSpeed = useCallback(() => {
    return 500; // Increased intensity with faster 500ms interval (was 800ms)
  }, []);

  // Generate activity distributed across many chunks
  const simulateWideDistribution = useCallback(() => {
    // Generate actions across the entire grid - increased intensity
    const actionCount = 50; // Increased from 30 to 50 actions

    for (let i = 0; i < actionCount; i++) {
      // Create a uniform distribution across the grid
      const x = Math.floor(Math.random() * GRID_SIZE);
      const y = Math.floor(Math.random() * GRID_SIZE);

      // 85% chance to fire, 15% to place ship
      if (Math.random() < 0.15) {
        // Place ship
        const shipSize = 2 + Math.floor(Math.random() * 3); // Random size 2-4
        const isHorizontal = Math.random() > 0.5;

        simulateBattle(1, {
          testAction: {
            type: 'PLACE_SHIP',
            x,
            y,
            shipSize,
            isHorizontal
          }
        });
      } else {
        // Fire shot
        simulateBattle(1, {
          testAction: {
            type: 'FIRE',
            x,
            y
          }
        });
      }
    }
  }, [simulateBattle]);

  // Generate focused activity in several chunks to create moderate hotspots
  const simulateFocusedHotspots = useCallback(() => {
    // Create more hotspots - increased from 5 to 8 fixed hotspots
    const hotspotChunks = [
      { x: 2, y: 3 },
      { x: 7, y: 7 },
      { x: 1, y: 1 },
      { x: 9, y: 9 },
      { x: 5, y: 5 },
      { x: 4, y: 8 },
      { x: 3, y: 6 },
      { x: 8, y: 2 }
    ];

    // Add more random chunks for variation - increased from 2 to 4
    for (let i = 0; i < 4; i++) {
      const randomChunkX = Math.floor(Math.random() * CHUNK_SIZE);
      const randomChunkY = Math.floor(Math.random() * CHUNK_SIZE);

      if (!hotspotChunks.some(chunk => chunk.x === randomChunkX && chunk.y === randomChunkY)) {
        hotspotChunks.push({ x: randomChunkX, y: randomChunkY });
      }
    }

    // For each hotspot chunk, generate more intense activity
    for (const chunk of hotspotChunks) {
      const baseX = chunk.x * CELLS_PER_CHUNK;
      const baseY = chunk.y * CELLS_PER_CHUNK;

      // Increased action count per hotspot from 8 to 12
      const actionCount = 12;

      for (let i = 0; i < actionCount; i++) {
        // Generate actions within the chunk
        const offsetX = Math.floor(Math.random() * CELLS_PER_CHUNK);
        const offsetY = Math.floor(Math.random() * CELLS_PER_CHUNK);
        const x = baseX + offsetX;
        const y = baseY + offsetY;

        // 15% chance to place ship, 85% to fire (increased ship placement from 10% to 15%)
        if (Math.random() < 0.15) {
          // Place ship
          const shipSize = 2 + Math.floor(Math.random() * 3);
          const isHorizontal = Math.random() > 0.5;

          simulateBattle(1, {
            testAction: {
              type: 'PLACE_SHIP',
              x,
              y,
              shipSize,
              isHorizontal
            }
          });
        } else {
          // Fire shot
          simulateBattle(1, {
            testAction: {
              type: 'FIRE',
              x,
              y
            }
          });
        }
      }
    }
  }, [simulateBattle]);

  // Handle simulation start/stop and running
  useEffect(() => {
    // Stop any existing interval first
    if (intervalIdRef.current !== null) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }

    if (!enabled) {
      setSimulationRunning(false);
      return;
    }

    // Start simulation
    setSimulationRunning(true);

    // Initial simulation - generate more intense activity to start
    simulateWideDistribution();
    simulateWideDistribution(); // Run twice for more initial action

    // Stronger initial burst - increased from 3 to 5 hotspot runs
    for (let i = 0; i < 5; i++) {
      simulateFocusedHotspots();
    }

    // Create an interval to regularly simulate battle actions
    intervalIdRef.current = window.setInterval(() => {
      if (enabled) {
        // More even balance - 50/50 instead of 60/40
        if (Math.random() < 0.5) {
          simulateWideDistribution();
        } else {
          simulateFocusedHotspots();
        }
      }
    }, getIntervalSpeed());

    return () => {
      if (intervalIdRef.current !== null) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [enabled, getIntervalSpeed, simulateWideDistribution, simulateFocusedHotspots]);

  return (
    <div className="w-full bg-gray-800 rounded-md p-3 mb-2">
      <div className="flex items-center justify-between">
        <h3 className="text-md font-medium">Battle Simulation</h3>
        <div className={`h-2 w-2 rounded-full ${simulationRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
      </div>
      <div className="mt-2 text-sm text-gray-400">
        {simulationRunning ? (
          <p>
            Running with high battle activity
          </p>
        ) : (
          <p>Simulation is currently disabled</p>
        )}
      </div>
    </div>
  );
};

export default BattleSimulation;
