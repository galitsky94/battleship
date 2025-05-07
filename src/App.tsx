import type React from 'react';
import { useState } from 'react';
import Grid from './components/Grid';
import Console from './components/Console';
import VersionLabel from './components/VersionLabel';
import TabNavigation from './components/TabNavigation';
import TeamSelectionScreen from './components/TeamSelectionScreen';
import { BattleProvider, useBattle } from './contexts/BattleContext';
import { TeamSelectionProvider, useTeamSelection } from './contexts/TeamSelectionContext';

const BattleField: React.FC = () => {
  const { placeShip, fireShot, selectedShipSize, isHorizontal } = useBattle();
  const { selectedTeam, activeView, hasSelectedTeam } = useTeamSelection();
  const [gameMode, setGameMode] = useState<'place' | 'fire'>('fire'); // Default to fire mode
  const [simulationEnabled, setSimulationEnabled] = useState(false); // Default to simulation disabled
  const simulationIntensity = 'medium';

  const handleCellClick = (x: number, y: number) => {
    if (gameMode === 'place') {
      const success = placeShip(x, y, selectedShipSize, isHorizontal, selectedTeam);
      // If ship placed successfully, switch to fire mode
      if (success) {
        setGameMode('fire');
      }
    } else {
      fireShot(x, y, selectedTeam);
    }
  };

  const handleModeToggle = () => {
    // Keep this function for Console props, but we won't actually toggle modes anymore
    // setGameMode always stays in 'fire' mode
  };

  const toggleSimulation = () => {
    setSimulationEnabled(prev => !prev);
  };

  // If team hasn't been selected yet, show the team selection screen
  if (!hasSelectedTeam) {
    return <TeamSelectionScreen />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 p-4 border-b border-gray-700">
        <h1 className="text-2xl font-bold">Battleship Infinity</h1>
        <p className="text-gray-400">Navigate. Target. Conquer.</p>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 p-2 relative">
          <Grid onCellClick={handleCellClick} />

          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-gray-800 bg-opacity-80 rounded-md px-3 py-1 text-sm text-gray-300">
            <span>Drag to pan or use touchpad to scroll</span>
          </div>
        </main>

        <aside className="w-80 overflow-auto bg-gray-900">
          <div className="p-4">
            <TabNavigation />
            <Console
              simulationEnabled={simulationEnabled}
              toggleSimulation={toggleSimulation}
              simulationIntensity={simulationIntensity}
              gameMode={gameMode}
              handleModeToggle={handleModeToggle}
            />
          </div>
        </aside>
      </div>

      <VersionLabel />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <TeamSelectionProvider>
      <BattleProvider>
        <BattleField />
      </BattleProvider>
    </TeamSelectionProvider>
  );
};

export default App;
