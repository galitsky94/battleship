import type React from 'react';
import { useState } from 'react';
import { useTeamSelection } from '../contexts/TeamSelectionContext';

const VersionLabel: React.FC = () => {
  const { resetTeamSelection } = useTeamSelection();
  const [clickCount, setClickCount] = useState(0);
  const [showDevTools, setShowDevTools] = useState(false);

  const handleClick = () => {
    setClickCount(prev => {
      const newCount = prev + 1;
      // Show dev tools after 5 clicks
      if (newCount >= 5) {
        setShowDevTools(true);
        return 0;
      }
      return newCount;
    });
  };

  const handleReset = () => {
    if (window.confirm('This will reset your team selection and reload the page. Continue?')) {
      resetTeamSelection();
      window.location.reload();
    }
  };

  return (
    <div className="bg-gray-800 border-t border-gray-700 p-2 text-xs text-gray-500 flex justify-between items-center">
      <div onClick={handleClick} className="cursor-default">
        Battleship Infinity
      </div>

      {showDevTools && (
        <div className="flex items-center space-x-2">
          <button
            onClick={handleReset}
            className="px-2 py-1 bg-red-900 text-red-100 rounded text-xs hover:bg-red-800 transition-colors"
          >
            Reset Team Selection
          </button>
          <button
            onClick={() => setShowDevTools(false)}
            className="text-gray-400 hover:text-gray-300"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default VersionLabel;
