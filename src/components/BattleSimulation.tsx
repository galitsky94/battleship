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
    return 800; // Medium intensity uses 800ms interval
  }, []);

  // Generate activity distributed across many chunks
  const simulateWideDistribution = useCallback(() => {
    // Generate actions across the entire grid - fixed at medium intensity
    const actionCount = 30;

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
    // Create moderate hotspots - fewer than before and evenly distributed
    const hotspotChunks = [
      { x: 2, y: 3 },
      { x: 7, y: 7 },
      { x: 1, y: 1 },
      { x: 9, y: 9 },
      { x: 5, y: 5 }
    ];

    // Add a few random chunks for variation
    for (let i = 0; i < 2; i++) {
      const randomChunkX = Math.floor(Math.random() * CHUNK_SIZE);
      const randomChunkY = Math.floor(Math.random() * CHUNK_SIZE);

      if (!hotspotChunks.some(chunk => chunk.x === randomChunkX && chunk.y === randomChunkY)) {
        hotspotChunks.push({ x: randomChunkX, y: randomChunkY });
      }
    }

    // For each hotspot chunk, generate moderate activity
    for (const chunk of hotspotChunks) {
      const baseX = chunk.x * CELLS_PER_CHUNK;
      const baseY = chunk.y * CELLS_PER_CHUNK;

      // Fixed at medium intensity
      const actionCount = 8;

      for (let i = 0; i < actionCount; i++) {
        // Generate actions within the chunk
        const offsetX = Math.floor(Math.random() * CELLS_PER_CHUNK);
        const offsetY = Math.floor(Math.random() * CELLS_PER_CHUNK);
        const x = baseX + offsetX;
        const y = baseY + offsetY;

        // 10% chance to place ship, 90% to fire
        if (Math.random() < 0.1) {
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

    // Initial simulation - generate light activity to start
    simulateWideDistribution();

    // Moderate initial burst
    for (let i = 0; i < 3; i++) {
      simulateFocusedHotspots();
    }

    // Create an interval to regularly simulate battle actions
    intervalIdRef.current = window.setInterval(() => {
      if (enabled) {
        // Balance wide distribution and focused hotspots
        if (Math.random() < 0.6) {
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
            Running with moderate battle activity
          </p>
        ) : (
          <p>Simulation is currently disabled</p>
        )}
      </div>
    </div>
  );
};

export default BattleSimulation;
