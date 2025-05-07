import type React from 'react';
import { useBattle } from '../contexts/BattleContext';
import { TOTAL_CHUNKS } from '../utils/grid';

const StatsPanel: React.FC = () => {
  const { stats, ships, showHeatMap, setShowHeatMap, chunks } = useBattle();

  // Count ships that are destroyed
  const destroyedShips = ships.filter(ship => ship.destroyed).length;

  // Count chunks with activity
  const chunksWithActivity = chunks.filter(chunk => chunk.activityCount > 0).length;

  // Calculate activity percentage (chunks with any activity)
  const activityPercentage = Math.round((chunksWithActivity / TOTAL_CHUNKS) * 100);

  // Count highlighted chunks (top 23%)
  const highlightedChunks = chunks.filter(chunk => chunk.heatLevel > 0).length;
  const highlightPercentage = Math.round((highlightedChunks / TOTAL_CHUNKS) * 100);

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <h2 className="text-xl text-white font-bold mb-4">Battle Statistics</h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-700 p-3 rounded">
          <div className="text-gray-400 text-sm">Ships</div>
          <div className="text-2xl text-white font-bold">{stats.totalShips}</div>
        </div>

        <div className="bg-gray-700 p-3 rounded">
          <div className="text-gray-400 text-sm">Shots Fired</div>
          <div className="text-2xl text-white font-bold">{stats.totalHits}</div>
        </div>

        <div className="bg-gray-700 p-3 rounded">
          <div className="text-gray-400 text-sm">Ships Destroyed</div>
          <div className="text-2xl text-white font-bold">{destroyedShips}</div>
        </div>

        <div className="bg-gray-700 p-3 rounded">
          <div className="text-gray-400 text-sm">Hit Ratio</div>
          <div className="text-2xl text-white font-bold">
            {stats.totalHits > 0
              ? `${Math.round((destroyedShips / stats.totalHits) * 100)}%`
              : '0%'}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-white text-sm font-bold">Heat Map</h3>
          <div className="flex items-center">
            <span className="text-gray-400 text-xs mr-2">Toggle</span>
            <button
              className={`relative inline-flex items-center h-5 rounded-full w-10 ${showHeatMap ? 'bg-blue-600' : 'bg-gray-600'}`}
              onClick={() => setShowHeatMap(!showHeatMap)}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${showHeatMap ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-700">
        <h3 className="text-white text-sm font-bold mb-3">Heat Map Legend</h3>
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-gray-400">Showing most active chunks</span>
        </div>
        <div className="flex items-center mb-2">
          <div className="w-4 h-4 bg-red-500 bg-opacity-50 mr-2 rounded" />
          <span className="text-gray-300 text-sm">Hot - Most active chunks</span>
        </div>
        <div className="flex items-center mb-2">
          <div className="w-4 h-4 bg-orange-500 bg-opacity-40 mr-2 rounded" />
          <span className="text-gray-300 text-sm">Warm - Moderately active chunks</span>
        </div>
        <div className="flex items-center mb-2">
          <div className="w-4 h-4 bg-blue-500 bg-opacity-30 mr-2 rounded" />
          <span className="text-gray-300 text-sm">Cool - Slightly active chunks</span>
        </div>
        <div className="flex items-center opacity-40">
          <div className="w-4 h-4 bg-gray-600 mr-2 rounded" />
          <span className="text-gray-400 text-sm">Inactive - Not highlighted on heat map</span>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;
