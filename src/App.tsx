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
  const [simulationEnabled, setSimulationEnabled] = useState(false); // Default to simulation disabled
  const simulationIntensity = 'medium';

  // Set game mode based on active view
  const gameMode = activeView === 'defend' ? 'place' : 'fire';

  const handleCellClick = (x: number, y: number) => {
    if (activeView === 'defend') {
      // In defend view, we place ships
      placeShip(x, y, selectedShipSize, isHorizontal, selectedTeam);
    } else {
      // In attack view, we fire shots
      fireShot(x, y, selectedTeam);
    }
  };

  const handleModeToggle = () => {
    // This function is now a no-op as mode is determined by the active view
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
