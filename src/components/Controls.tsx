import type React from 'react';
import { useBattle } from '../contexts/BattleContext';
import { useTeamSelection } from '../contexts/TeamSelectionContext';
import { SHIP_SIZES } from '../utils/grid';

const Controls: React.FC = () => {
  const {
    selectedShipSize,
    setSelectedShipSize,
    isHorizontal,
    setIsHorizontal,
    currentPlayer
  } = useBattle();

  const { activeView, selectedTeam } = useTeamSelection();

  const handleOrientationToggle = () => {
    setIsHorizontal(!isHorizontal);
  };

  const handleShipSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedShipSize(Number(e.target.value));
  };

  // Color based on team
  const teamColor = selectedTeam === 'blue' ? 'blue' : 'red';
  const buttonPrimaryClass = selectedTeam === 'blue'
    ? 'bg-blue-600 hover:bg-blue-700'
    : 'bg-red-600 hover:bg-red-700';

  const buttonSecondaryClass = selectedTeam === 'blue'
    ? 'bg-blue-800 hover:bg-blue-900'
    : 'bg-red-800 hover:bg-red-900';

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <h2 className="text-xl text-white font-bold mb-4">
        {activeView === 'defend' ? 'Defense Controls' : 'Attack Controls'}
      </h2>

      <div className="mb-4">
        <p className="text-gray-300 text-sm">
          Your ID: <span className={`text-${teamColor}-300 font-mono`}>{currentPlayer}</span>
        </p>
      </div>

      {activeView === 'defend' ? (
        <>
          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="shipSize">
              Ship Size
            </label>
            <select
              id="shipSize"
              value={selectedShipSize}
              onChange={handleShipSizeChange}
              className="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SHIP_SIZES.map(size => (
                <option key={size} value={size}>
                  {size} cells
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-bold mb-2">
              Orientation
            </label>
            <div className="flex items-center">
              <button
                className={`px-4 py-2 mr-2 rounded ${isHorizontal ? buttonPrimaryClass : 'bg-gray-700'}`}
                onClick={handleOrientationToggle}
              >
                Horizontal
              </button>
              <button
                className={`px-4 py-2 rounded ${!isHorizontal ? buttonPrimaryClass : 'bg-gray-700'}`}
                onClick={handleOrientationToggle}
              >
                Vertical
              </button>
            </div>
          </div>

          <div className="mb-2">
            <p className="text-gray-300 text-sm mb-2">Ship Placement Rules:</p>
            <ul className="text-gray-400 text-sm list-disc pl-5 mb-4">
              <li>Click to place ships in your territory</li>
              <li>Ships can't overlap with each other</li>
              <li>Ships can't be placed in cooldown zones</li>
              <li>Once placed, ships cannot be moved</li>
            </ul>
          </div>
        </>
      ) : (
        <>
          <div className="mb-4">
            <div className={`p-3 rounded-md ${buttonPrimaryClass} text-white font-medium text-center`}>
              Ready to Fire
            </div>
          </div>

          <div className="mb-2">
            <p className="text-gray-300 text-sm mb-2">Attack Instructions:</p>
            <ul className="text-gray-400 text-sm list-disc pl-5 mb-4">
              <li>Click on enemy territory to fire shots</li>
              <li>Red markers indicate hit enemy ships</li>
              <li>Blue markers indicate your misses</li>
              <li>Target areas with high heat activity</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default Controls;
