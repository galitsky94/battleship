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

  // Define fixed interval speed for ultra high intensity
  const getIntervalSpeed = useCallback(() => {
    return 200; // Ultra high intensity with 200ms interval (was 500ms)
  }, []);

  // Generate activity distributed across many chunks
  const simulateWideDistribution = useCallback(() => {
    // Generate actions across the entire grid - extreme intensity
    const actionCount = 120; // Dramatically increased from 50 to 120 actions

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

  // Generate focused activity in several chunks to create intensive hotspots
  const simulateFocusedHotspots = useCallback(() => {
    // Create many more hotspots - increased from 8 to 15 fixed hotspots
    const hotspotChunks = [
      { x: 2, y: 3 },
      { x: 7, y: 7 },
      { x: 1, y: 1 },
      { x: 9, y: 9 },
      { x: 5, y: 5 },
      { x: 4, y: 8 },
      { x: 3, y: 6 },
      { x: 8, y: 2 },
      { x: 0, y: 4 },
      { x: 6, y: 3 },
      { x: 2, y: 8 },
      { x: 7, y: 1 },
      { x: 4, y: 4 },
      { x: 9, y: 5 },
      { x: 5, y: 9 }
    ];

    // Add many more random chunks for variation - increased from 4 to 8
    for (let i = 0; i < 8; i++) {
      const randomChunkX = Math.floor(Math.random() * CHUNK_SIZE);
      const randomChunkY = Math.floor(Math.random() * CHUNK_SIZE);

      if (!hotspotChunks.some(chunk => chunk.x === randomChunkX && chunk.y === randomChunkY)) {
        hotspotChunks.push({ x: randomChunkX, y: randomChunkY });
      }
    }

    // For each hotspot chunk, generate extremely intense activity
    for (const chunk of hotspotChunks) {
      const baseX = chunk.x * CELLS_PER_CHUNK;
      const baseY = chunk.y * CELLS_PER_CHUNK;

      // Greatly increased action count per hotspot from 12 to 25
      const actionCount = 25;

      for (let i = 0; i < actionCount; i++) {
        // Generate actions within the chunk
        const offsetX = Math.floor(Math.random() * CELLS_PER_CHUNK);
        const offsetY = Math.floor(Math.random() * CELLS_PER_CHUNK);
        const x = baseX + offsetX;
        const y = baseY + offsetY;

        // More ship placements - 20% chance to place ship (increased from 15%)
        if (Math.random() < 0.2) {
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

  // Run concurrent simulations for even more intensity
  const simulateConcurrentActivity = useCallback(() => {
    // Run both distribution patterns concurrently
    simulateWideDistribution();
    simulateFocusedHotspots();
  }, [simulateWideDistribution, simulateFocusedHotspots]);

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

    // Initial simulation - generate extreme initial activity
    simulateWideDistribution();
    simulateWideDistribution();
    simulateWideDistribution(); // Run three times for massive initial action

    // Extreme initial burst - run 7 hotspot simulations (increased from 5)
    for (let i = 0; i < 7; i++) {
      simulateFocusedHotspots();
    }

    // Create an interval to regularly simulate battle actions at a very high frequency
    intervalIdRef.current = window.setInterval(() => {
      if (enabled) {
        // Very high chance of concurrent activity
        if (Math.random() < 0.7) { // 70% chance of extreme concurrent activity
          simulateConcurrentActivity();
        } else if (Math.random() < 0.7) { // 21% chance (0.7 * 0.3) of wide distribution
          simulateWideDistribution();
        } else { // 9% chance of focused hotspots only
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
  }, [enabled, getIntervalSpeed, simulateWideDistribution, simulateFocusedHotspots, simulateConcurrentActivity]);

  return (
    <div className="w-full bg-gray-800 rounded-md p-3 mb-2">
      <div className="flex items-center justify-between">
        <h3 className="text-md font-medium">Battle Simulation</h3>
        <div className={`h-2 w-2 rounded-full ${simulationRunning ? 'bg-red-500 animate-ping' : 'bg-red-500'}`} />
      </div>
      <div className="mt-2 text-sm text-gray-400">
        {simulationRunning ? (
          <p>
            Running with extreme battle activity
          </p>
        ) : (
          <p>Simulation is currently disabled</p>
        )}
      </div>
    </div>
  );
};

export default BattleSimulation;
