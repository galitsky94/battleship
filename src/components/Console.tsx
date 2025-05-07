import { useState, useEffect } from 'react';
import { useBattle } from '../contexts/BattleContext';
import { useTeamSelection } from '../contexts/TeamSelectionContext';
import MiniMap from './MiniMap';

interface ConsoleProps {
  simulationEnabled: boolean;
  toggleSimulation: () => void;
  simulationIntensity: string;
  gameMode: 'place' | 'fire';
  handleModeToggle: () => void;
}

const Console: React.FC<ConsoleProps> = ({
  simulationEnabled,
  toggleSimulation,
  simulationIntensity,
  gameMode,
  handleModeToggle
}) => {
  const {
    showHeatMap,
    setShowHeatMap,
    simulateBattle,
    blueTeamGrid,
    redTeamGrid,
    stats
  } = useBattle();

  const { selectedTeam, activeView } = useTeamSelection();

  const [simulatedActions, setSimulatedActions] = useState(0);

  // Determine which team's stats to display based on the current view
  const displayStats = activeView === 'defend'
    ? (selectedTeam === 'blue' ? blueTeamGrid.stats : redTeamGrid.stats)
    : (selectedTeam === 'blue' ? redTeamGrid.stats : blueTeamGrid.stats);

  // Run simulation at the specified interval when enabled
  useEffect(() => {
    if (!simulationEnabled) return;

    const interval = setInterval(() => {
      // Medium intensity will run 25 actions each time
      const actionsCount = 25;
      simulateBattle(actionsCount);
      setSimulatedActions(prev => prev + actionsCount);
    }, 1000); // Run every second

    return () => clearInterval(interval);
  }, [simulationEnabled, simulateBattle]);

  // Calculate percentage for progress bar
  const calculatePercentage = (value: number, max: number) => {
    return Math.min(100, Math.round((value / max) * 100)) || 0;
  };

  // Get toggle background color based on team and heat map state
  const getToggleBackgroundColor = () => {
    if (!showHeatMap) return 'bg-gray-600 justify-start';
    return selectedTeam === 'blue'
      ? 'bg-blue-500 justify-end'
      : 'bg-red-500 justify-end';
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 border-l border-gray-800">
      <div className="flex-1 overflow-y-auto p-3">
        <div className="bg-gray-800 rounded-md overflow-hidden shadow-lg">
          {/* Header Section */}
          <div className="bg-gray-700 py-3 px-4 border-b border-gray-600">
            <h2 className="text-lg font-bold text-white">
              {activeView === 'defend' ? 'Defense Console' : 'Attack Console'}
            </h2>
            <p className="text-xs text-gray-300 mt-1">
              {activeView === 'defend'
                ? 'Monitoring your territory'
                : 'Targeting enemy territory'
              } • {selectedTeam.toUpperCase()} TEAM
            </p>
          </div>

          <div className="p-4 space-y-5">
            {/* Simulation Controls */}
            <div className="mb-4">
              <button
                onClick={toggleSimulation}
                className={`w-full py-3 px-4 rounded-md font-medium text-sm shadow-md transition duration-300 flex items-center justify-center gap-2 ${
                  simulationEnabled
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                <span className="text-lg">
                  {simulationEnabled ? '■' : '▶'}
                </span>
                <span>
                  {simulationEnabled ? 'Stop Simulation' : 'Start Simulation'}
                </span>
              </button>
            </div>

            {/* Heatmap Toggle */}
            <div className="mb-4">
              <div className="flex items-center justify-between bg-gray-700 py-3 px-4 rounded-md shadow-inner">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🌡&#xFE0F;</span>
                  <span className="text-lg font-medium text-white">Heatmap</span>
                </div>
                <button
                  onClick={() => setShowHeatMap(!showHeatMap)}
                  className="flex items-center focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-full"
                  aria-label={showHeatMap ? 'Hide Heatmap' : 'Show Heatmap'}
                >
                  <div className={`w-12 h-6 rounded-full flex items-center transition-all duration-300 ${getToggleBackgroundColor()}`}>
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                        showHeatMap ? 'translate-x-[-3px]' : 'translate-x-[3px]'
                      }`}
                    />
                  </div>
                </button>
              </div>
            </div>

            {/* Battle Statistics */}
            <div className="mt-5 mb-4">
              <h3 className="text-white font-semibold text-md mb-3 pb-2 border-b border-gray-700">
                Battle Statistics
              </h3>

              <div className="space-y-4 mb-4">
                {/* Ships Status */}
                <div>
                  <div className="flex justify-between mb-1 items-baseline">
                    <span className="text-gray-300 text-sm">Ships</span>
                    <div className="text-sm">
                      <span className="text-green-400">{displayStats.activeShips}</span>
                      <span className="text-gray-400">/</span>
                      <span className="text-red-400">{displayStats.destroyedShips}</span>
                      <span className="text-gray-400">/</span>
                      <span className="text-gray-300">{displayStats.totalShips}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div className="flex h-full">
                      <div
                        className="bg-green-500 h-full"
                        style={{ width: `${calculatePercentage(displayStats.activeShips || 0, displayStats.totalShips)}%` }}
                      />
                      <div
                        className="bg-red-500 h-full"
                        style={{ width: `${calculatePercentage(displayStats.destroyedShips || 0, displayStats.totalShips)}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-400">
                    <span>Active</span>
                    <span>Destroyed</span>
                  </div>
                </div>

                {/* Hit Ratio */}
                <div>
                  <div className="flex justify-between mb-1 items-baseline">
                    <span className="text-gray-300 text-sm">Hit Ratio</span>
                    <span className="text-sm text-yellow-400">{displayStats.hitRatio || 0}%</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400"
                      style={{ width: `${displayStats.hitRatio || 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-400">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Total Hits */}
                <div>
                  <div className="flex justify-between mb-1 items-baseline">
                    <span className="text-gray-300 text-sm">Total Hits</span>
                    <span className="text-sm font-mono text-blue-400">{displayStats.totalHits}</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{ width: `${calculatePercentage(displayStats.totalHits, 1000)}%` }}
                    />
                  </div>
                </div>

                {/* Grid Coverage */}
                <div>
                  <div className="flex justify-between mb-1 items-baseline">
                    <span className="text-gray-300 text-sm">Grid Chunks</span>
                    <span className="text-sm font-mono text-purple-400">{displayStats.totalChunks}</span>
                  </div>
                </div>

                {/* Simulation Stats */}
                {simulationEnabled && (
                  <div className="bg-gray-800 p-3 rounded-md border border-gray-700 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm flex items-center">
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                        Simulation Active
                      </span>
                      <span className="text-sm font-mono text-green-400">{simulatedActions}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Actions processed</div>
                  </div>
                )}
              </div>
            </div>

            {/* MiniMap with title */}
            <div className="mt-5">
              <h3 className="text-white font-semibold text-md mb-3 pb-2 border-b border-gray-700">
                Navigation Map
              </h3>
              <div className="bg-gray-900 rounded-md p-2">
                <MiniMap />
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Click on the map to navigate to a specific chunk
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Console;
