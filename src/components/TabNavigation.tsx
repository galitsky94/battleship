import type React from 'react';
import { useTeamSelection } from '../contexts/TeamSelectionContext';
import { type GameView, Team } from '../types';

const TabNavigation: React.FC = () => {
  const { activeView, setActiveView, selectedTeam } = useTeamSelection();

  const teamColor = selectedTeam === 'blue' ? 'text-blue-500' : 'text-red-500';

  const handleViewChange = (view: GameView) => {
    setActiveView(view);
  };

  return (
    <div className="flex bg-gray-800 border-b border-gray-700 mb-2">
      <button
        className={`flex-1 py-3 px-4 font-medium ${
          activeView === 'defend'
            ? `bg-gray-700 border-b-2 ${teamColor}`
            : 'text-gray-400 hover:text-white'
        }`}
        onClick={() => handleViewChange('defend')}
      >
        DEFEND
      </button>
      <button
        className={`flex-1 py-3 px-4 font-medium ${
          activeView === 'attack'
            ? `bg-gray-700 border-b-2 ${teamColor}`
            : 'text-gray-400 hover:text-white'
        }`}
        onClick={() => handleViewChange('attack')}
      >
        ATTACK
      </button>
    </div>
  );
};

export default TabNavigation;
