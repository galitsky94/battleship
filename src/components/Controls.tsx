import type React from 'react';
import { useBattle } from '../contexts/BattleContext';
import { SHIP_SIZES } from '../utils/grid';

const Controls: React.FC = () => {
  const {
    selectedShipSize,
    setSelectedShipSize,
    isHorizontal,
    setIsHorizontal,
    currentPlayer
  } = useBattle();

  const handleOrientationToggle = () => {
    setIsHorizontal(!isHorizontal);
  };

  const handleShipSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedShipSize(Number(e.target.value));
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <h2 className="text-xl text-white font-bold mb-4">Battle Controls</h2>

      <div className="mb-4">
        <p className="text-gray-300 text-sm mb-1">Your ID: <span className="text-blue-300 font-mono">{currentPlayer}</span></p>
        <p className="text-gray-300 text-sm mb-2">Game Mode: <span className="text-green-300">Free-for-all</span></p>
      </div>

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
            className={`px-4 py-2 mr-2 rounded ${isHorizontal ? 'bg-blue-600' : 'bg-gray-700'}`}
            onClick={handleOrientationToggle}
          >
            Horizontal
          </button>
          <button
            className={`px-4 py-2 rounded ${!isHorizontal ? 'bg-blue-600' : 'bg-gray-700'}`}
            onClick={handleOrientationToggle}
          >
            Vertical
          </button>
        </div>
      </div>

      <div className="mb-2">
        <p className="text-gray-300 text-sm mb-2">Instructions:</p>
        <ul className="text-gray-400 text-sm list-disc pl-5 mb-4">
          <li>Left click to place ship / fire</li>
          <li>Ships can't overlap</li>
          <li>Once placed, ships cannot be moved</li>
        </ul>
      </div>
    </div>
  );
};

export default Controls;
