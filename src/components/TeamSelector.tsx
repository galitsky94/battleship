import type React from 'react';
import { useTeamSelection } from '../contexts/TeamSelectionContext';
import type { Team } from '../types';

const TeamSelector: React.FC = () => {
  const { selectedTeam, setSelectedTeam } = useTeamSelection();

  const handleTeamChange = (team: Team) => {
    setSelectedTeam(team);
  };

  return (
    <div className="mb-4 p-2 bg-gray-800 rounded-md">
      <h3 className="text-sm text-gray-400 mb-2">SELECT TEAM</h3>

      <div className="flex gap-2">
        <button
          onClick={() => handleTeamChange('blue')}
          className={`flex-1 py-2 px-3 rounded ${
            selectedTeam === 'blue'
              ? 'bg-blue-800 text-white border border-blue-500'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          <div className="flex items-center justify-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2" />
            <span>BLUE</span>
          </div>
        </button>

        <button
          onClick={() => handleTeamChange('red')}
          className={`flex-1 py-2 px-3 rounded ${
            selectedTeam === 'red'
              ? 'bg-red-900 text-white border border-red-500'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          <div className="flex items-center justify-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2" />
            <span>RED</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default TeamSelector;
