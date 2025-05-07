import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useTeamSelection } from '../contexts/TeamSelectionContext';
import type { Team } from '../types';
import { CHUNK_SIZE, CELLS_PER_CHUNK } from '../utils/grid';

// Define ship type
type Ship = {
  x: number;
  y: number;
  width: number;
  height: number;
  hits: number;
  maxHits: number;
};

// Battle stats for display
type BattleStats = {
  bluePlayers: number;
  redPlayers: number;
  totalShipsDestroyed: number;
  totalShotsFired: number;
  activeBattles: number;
  territoryControl: {
    blue: number;
    red: number;
  };
};

const TeamSelectionScreen: React.FC = () => {
  const { setSelectedTeam } = useTeamSelection();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);

  // Animation state
  const [simulationData, setSimulationData] = useState<{
    grid: boolean[][];
    hits: { x: number; y: number; age: number; type: 'hit' | 'miss' }[];
    ships: Ship[];
  }>({
    grid: Array(CELLS_PER_CHUNK * CHUNK_SIZE).fill(null).map(() =>
      Array(CELLS_PER_CHUNK * CHUNK_SIZE).fill(false)
    ),
    hits: [],
    ships: []
  });

  // Battle stats state with simulated real-time data
  const [battleStats, setBattleStats] = useState<BattleStats>({
    bluePlayers: 12487,
    redPlayers: 11932,
    totalShipsDestroyed: 287456,
    totalShotsFired: 4352789,
    activeBattles: 187,
    territoryControl: {
      blue: 52,
      red: 48
    }
  });

  // Periodically update stats to simulate real-time changes
  useEffect(() => {
    const updateInterval = setInterval(() => {
      setBattleStats(prev => {
        // Random fluctuation in player counts (±30 players)
        const bluePlayerDelta = Math.floor(Math.random() * 60) - 30;
        const redPlayerDelta = Math.floor(Math.random() * 60) - 30;

        // Random increase in battle stats
        const newShipsDestroyed = prev.totalShipsDestroyed + Math.floor(Math.random() * 10);
        const newShotsFired = prev.totalShotsFired + Math.floor(Math.random() * 100);

        // Fluctuate active battles within a range
        let newActiveBattles = prev.activeBattles + (Math.random() > 0.5 ? 1 : -1);
        newActiveBattles = Math.max(150, Math.min(220, newActiveBattles));

        // Slightly adjust territory control
        let blueTerritory = prev.territoryControl.blue;
        let redTerritory = prev.territoryControl.red;

        if (Math.random() > 0.7) {  // 30% chance to change territory
          const shift = Math.random() > 0.5 ? 1 : -1;
          blueTerritory += shift;
          redTerritory -= shift;

          // Keep within bounds
          if (blueTerritory < 35) {
            blueTerritory = 35;
            redTerritory = 65;
          } else if (blueTerritory > 65) {
            blueTerritory = 65;
            redTerritory = 35;
          }
        }

        return {
          bluePlayers: Math.max(10000, prev.bluePlayers + bluePlayerDelta),
          redPlayers: Math.max(10000, prev.redPlayers + redPlayerDelta),
          totalShipsDestroyed: newShipsDestroyed,
          totalShotsFired: newShotsFired,
          activeBattles: newActiveBattles,
          territoryControl: {
            blue: blueTerritory,
            red: redTerritory
          }
        };
      });
    }, 2000);  // Update every 2 seconds

    return () => clearInterval(updateInterval);
  }, []);

  // Format large numbers with commas
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  // Initialize the simulation
  useEffect(() => {
    // Create some random ships
    const ships: Ship[] = [];
    const shipCount = 25; // Number of ships to create
    const gridSize = CELLS_PER_CHUNK * CHUNK_SIZE;

    for (let i = 0; i < shipCount; i++) {
      const isHorizontal = Math.random() > 0.5;
      const size = Math.floor(Math.random() * 3) + 2; // Ship sizes 2-4

      const x = Math.floor(Math.random() * (gridSize - (isHorizontal ? size : 1)));
      const y = Math.floor(Math.random() * (gridSize - (isHorizontal ? 1 : size)));

      ships.push({
        x,
        y,
        width: isHorizontal ? size : 1,
        height: isHorizontal ? 1 : size,
        hits: 0,
        maxHits: size
      });
    }

    setSimulationData(prev => ({
      ...prev,
      ships
    }));
  }, []);

  // Run the battle simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match window
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    // Initial resize
    resizeCanvas();

    // Listen for window resize
    window.addEventListener('resize', resizeCanvas);

    // Animation variables
    let lastFireTime = 0;
    const fireInterval = 100; // ms between shots

    // Simple fade effect for canvas
    const fadeCanvas = () => {
      ctx.fillStyle = 'rgba(10, 15, 30, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    // Draw the simulation
    const animate = (timestamp: number) => {
      // Fade the canvas slightly to create trails
      fadeCanvas();

      // Add new hits periodically
      if (timestamp - lastFireTime > fireInterval) {
        lastFireTime = timestamp;

        // 80% chance to target a ship, 20% to miss
        const targetShip = Math.random() < 0.8;

        if (targetShip && simulationData.ships.length > 0) {
          // Target a random ship
          const shipIndex = Math.floor(Math.random() * simulationData.ships.length);
          const ship = simulationData.ships[shipIndex];

          // Choose a random position within the ship
          const hitX = ship.x + Math.floor(Math.random() * ship.width);
          const hitY = ship.y + Math.floor(Math.random() * ship.height);

          // Add the hit
          setSimulationData(prev => {
            const newShips = [...prev.ships];
            newShips[shipIndex] = {
              ...ship,
              hits: Math.min(ship.hits + 1, ship.maxHits)
            };

            return {
              ...prev,
              hits: [...prev.hits, { x: hitX, y: hitY, age: 0, type: 'hit' }],
              ships: newShips
            };
          });
        } else {
          // Random miss
          const gridSize = CELLS_PER_CHUNK * CHUNK_SIZE;
          const missX = Math.floor(Math.random() * gridSize);
          const missY = Math.floor(Math.random() * gridSize);

          setSimulationData(prev => ({
            ...prev,
            hits: [...prev.hits, { x: missX, y: missY, age: 0, type: 'miss' }]
          }));
        }
      }

      // Update hit ages and remove old ones
      setSimulationData(prev => ({
        ...prev,
        hits: prev.hits
          .map(hit => ({ ...hit, age: hit.age + 1 }))
          .filter(hit => hit.age < 100) // Remove hits older than 100 frames
      }));

      // Remove destroyed ships
      setSimulationData(prev => ({
        ...prev,
        ships: prev.ships.filter(ship => ship.hits < ship.maxHits)
      }));

      // Add new ships occasionally if count is low
      if (simulationData.ships.length < 10 && Math.random() < 0.02) {
        const gridSize = CELLS_PER_CHUNK * CHUNK_SIZE;
        const isHorizontal = Math.random() > 0.5;
        const size = Math.floor(Math.random() * 3) + 2;

        const x = Math.floor(Math.random() * (gridSize - (isHorizontal ? size : 1)));
        const y = Math.floor(Math.random() * (gridSize - (isHorizontal ? 1 : size)));

        setSimulationData(prev => ({
          ...prev,
          ships: [...prev.ships, {
            x,
            y,
            width: isHorizontal ? size : 1,
            height: isHorizontal ? 1 : size,
            hits: 0,
            maxHits: size
          }]
        }));
      }

      // Draw the ships and hits
      const cellSize = Math.min(canvas.width, canvas.height) / (CELLS_PER_CHUNK * CHUNK_SIZE / 2);
      const offsetX = (canvas.width - cellSize * CELLS_PER_CHUNK * CHUNK_SIZE) / 2;
      const offsetY = (canvas.height - cellSize * CELLS_PER_CHUNK * CHUNK_SIZE) / 2;

      // Draw the grid (very faint)
      ctx.strokeStyle = 'rgba(100, 120, 200, 0.05)';
      ctx.lineWidth = 0.2;

      for (let i = 0; i <= CELLS_PER_CHUNK * CHUNK_SIZE; i += 10) {
        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(offsetX + i * cellSize, offsetY);
        ctx.lineTo(offsetX + i * cellSize, offsetY + CELLS_PER_CHUNK * CHUNK_SIZE * cellSize);
        ctx.stroke();

        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY + i * cellSize);
        ctx.lineTo(offsetX + CELLS_PER_CHUNK * CHUNK_SIZE * cellSize, offsetY + i * cellSize);
        ctx.stroke();
      }

      // Draw ships - using for...of instead of forEach
      for (const ship of simulationData.ships) {
        const shipX = offsetX + ship.x * cellSize;
        const shipY = offsetY + ship.y * cellSize;

        // Choose color based on team (random for simulation)
        const isBlueTeam = Math.random() > 0.5;
        const baseColor = isBlueTeam ? 'rgba(50, 100, 200, 0.15)' : 'rgba(200, 50, 50, 0.15)';

        ctx.fillStyle = baseColor;
        ctx.fillRect(
          shipX,
          shipY,
          ship.width * cellSize,
          ship.height * cellSize
        );
      }

      // Draw hits and misses with glowing effect - using for...of instead of forEach
      for (const hit of simulationData.hits) {
        const hitX = offsetX + hit.x * cellSize + cellSize / 2;
        const hitY = offsetY + hit.y * cellSize + cellSize / 2;
        const alpha = Math.max(0, 1 - hit.age / 100); // Fade out with age

        if (hit.type === 'hit') {
          // Draw hit (red explosion)
          const radius = cellSize * 0.6 * (1 - Math.min(0.8, hit.age / 50));

          // Outer glow
          const gradient = ctx.createRadialGradient(
            hitX, hitY, 0,
            hitX, hitY, radius
          );
          gradient.addColorStop(0, `rgba(255, 100, 50, ${alpha})`);
          gradient.addColorStop(0.7, `rgba(255, 150, 30, ${alpha * 0.6})`);
          gradient.addColorStop(1, "rgba(255, 200, 0, 0)");

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(hitX, hitY, radius, 0, Math.PI * 2);
          ctx.fill();

          // Center dot
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.beginPath();
          ctx.arc(hitX, hitY, cellSize * 0.15, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Draw miss (blue ripple)
          const ringSize = cellSize * 0.3 * (1 + Math.min(0.7, hit.age / 30));

          ctx.strokeStyle = `rgba(30, 150, 255, ${alpha * 0.7})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(hitX, hitY, ringSize, 0, Math.PI * 2);
          ctx.stroke();

          // Second ripple
          if (hit.age > 5) {
            const innerRingSize = cellSize * 0.3 * (0.5 + Math.min(0.5, (hit.age - 5) / 30));
            ctx.strokeStyle = `rgba(30, 150, 255, ${alpha * 0.5})`;
            ctx.beginPath();
            ctx.arc(hitX, hitY, innerRingSize, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }

      // Draw chunk boundaries (extremely faint)
      ctx.strokeStyle = 'rgba(100, 140, 240, 0.1)';
      ctx.lineWidth = 0.5;

      for (let i = 0; i <= CHUNK_SIZE; i++) {
        const pos = i * CELLS_PER_CHUNK * cellSize;

        // Vertical chunk boundaries
        ctx.beginPath();
        ctx.moveTo(offsetX + pos, offsetY);
        ctx.lineTo(offsetX + pos, offsetY + CELLS_PER_CHUNK * CHUNK_SIZE * cellSize);
        ctx.stroke();

        // Horizontal chunk boundaries
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY + pos);
        ctx.lineTo(offsetX + CELLS_PER_CHUNK * CHUNK_SIZE * cellSize, offsetY + pos);
        ctx.stroke();
      }

      // Continue animation
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    animationFrameRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [simulationData]);

  const handleTeamSelection = (team: Team) => {
    setSelectedTeam(team);
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50">
      {/* Background simulation canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: 'rgb(10, 15, 30)' }}
      />

      {/* Live battle stats banner */}
      <div className="absolute top-0 left-0 right-0 bg-gray-900 bg-opacity-80 text-white border-b border-gray-800 py-2 px-4">
        <div className="flex justify-between items-center text-sm max-w-7xl mx-auto">
          <div className="flex space-x-6">
            <div>
              <span className="text-gray-400">Active Battles:</span>
              <span className="ml-2 text-yellow-500 font-semibold">{battleStats.activeBattles}</span>
            </div>
            <div>
              <span className="text-gray-400">Ships Destroyed:</span>
              <span className="ml-2 text-red-400 font-semibold">{formatNumber(battleStats.totalShipsDestroyed)}</span>
            </div>
            <div>
              <span className="text-gray-400">Shots Fired:</span>
              <span className="ml-2 text-blue-400 font-semibold">{formatNumber(battleStats.totalShotsFired)}</span>
            </div>
          </div>
          <div className="flex items-center">
            <span className="text-gray-400 mr-2">Territory Control:</span>
            <div className="w-36 h-4 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600"
                style={{ width: `${battleStats.territoryControl.blue}%` }}
              />
            </div>
            <span className="ml-2 text-blue-400">{battleStats.territoryControl.blue}%</span>
            <span className="mx-1 text-gray-500">/</span>
            <span className="text-red-400">{battleStats.territoryControl.red}%</span>
          </div>
        </div>
      </div>

      {/* Selection modal */}
      <div className="relative max-w-5xl w-full px-6 py-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-2">Battleship Infinity</h1>
          <p className="text-xl text-gray-300">Navigate. Target. Conquer.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Blue Corsairs */}
          <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-lg shadow-xl p-6 border-t-4 border-blue-600 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-blue-500">Blue Corsairs</h2>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                <span className="text-xl font-bold text-blue-300">{formatNumber(battleStats.bluePlayers)}</span>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-300 mb-4">Strategic naval force specialized in coordinated defense and precision strikes. Known for advanced technology and methodical expansion.</p>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-gray-900 bg-opacity-60 p-3 rounded">
                  <div className="text-xl font-bold text-blue-400">52%</div>
                  <div className="text-xs text-gray-400">Win Rate</div>
                </div>
                <div className="bg-gray-900 bg-opacity-60 p-3 rounded">
                  <div className="text-xl font-bold text-blue-400">187</div>
                  <div className="text-xs text-gray-400">Sectors Controlled</div>
                </div>
                <div className="bg-gray-900 bg-opacity-60 p-3 rounded">
                  <div className="text-xl font-bold text-blue-400">18.4M</div>
                  <div className="text-xs text-gray-400">Shots Fired</div>
                </div>
                <div className="bg-gray-900 bg-opacity-60 p-3 rounded">
                  <div className="text-xl font-bold text-blue-400">6.2M</div>
                  <div className="text-xs text-gray-400">Ships Destroyed</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleTeamSelection('blue')}
              className="w-full py-3 px-4 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg transition-colors flex items-center justify-center"
            >
              Join Blue Corsairs
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Red Armada */}
          <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-lg shadow-xl p-6 border-t-4 border-red-600 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-red-500">Red Armada</h2>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                <span className="text-xl font-bold text-red-300">{formatNumber(battleStats.redPlayers)}</span>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-300 mb-4">Aggressive combat fleet focused on rapid expansion and overwhelming firepower. Renowned for bold tactics and territorial dominance.</p>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-gray-900 bg-opacity-60 p-3 rounded">
                  <div className="text-xl font-bold text-red-400">49%</div>
                  <div className="text-xs text-gray-400">Win Rate</div>
                </div>
                <div className="bg-gray-900 bg-opacity-60 p-3 rounded">
                  <div className="text-xl font-bold text-red-400">163</div>
                  <div className="text-xs text-gray-400">Sectors Controlled</div>
                </div>
                <div className="bg-gray-900 bg-opacity-60 p-3 rounded">
                  <div className="text-xl font-bold text-red-400">21.7M</div>
                  <div className="text-xs text-gray-400">Shots Fired</div>
                </div>
                <div className="bg-gray-900 bg-opacity-60 p-3 rounded">
                  <div className="text-xl font-bold text-red-400">5.8M</div>
                  <div className="text-xs text-gray-400">Ships Destroyed</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleTeamSelection('red')}
              className="w-full py-3 px-4 bg-red-900 hover:bg-red-800 text-white font-bold rounded-lg transition-colors flex items-center justify-center"
            >
              Join Red Armada
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Live battle counter */}
        <div className="mt-8 text-center">
          <div className="inline-block bg-gray-800 bg-opacity-90 px-6 py-3 rounded-full">
            <div className="flex items-center">
              <div className="animate-ping h-3 w-3 rounded-full bg-red-600 opacity-75" />
              <div className="absolute h-3 w-3 rounded-full bg-red-500" />
              <span className="ml-5 text-gray-300">
                <span className="font-bold text-white">{battleStats.activeBattles}</span> active battles in progress. Join now to turn the tide!
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamSelectionScreen;
