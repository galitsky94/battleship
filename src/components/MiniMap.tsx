import type React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useBattle } from '../contexts/BattleContext';
import { useTeamSelection } from '../contexts/TeamSelectionContext';
import { CHUNK_SIZE, CELLS_PER_CHUNK } from '../utils/grid';
import { CellState } from '../types';

const MiniMap: React.FC = () => {
  const {
    blueTeamGrid,
    redTeamGrid,
    viewportPosition,
    setViewportPosition,
    cellSizeMultiplier
  } = useBattle();
  const { selectedTeam, activeView } = useTeamSelection();

  // Set canvas size - small and compact
  const miniMapSize = 120;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // State for dragging the viewport rectangle
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null);

  // Get the active grid based on team and view
  const getActiveGrid = useCallback(() => {
    if (activeView === 'defend') {
      return selectedTeam === 'blue' ? blueTeamGrid.grid : redTeamGrid.grid;
    }
    return selectedTeam === 'blue' ? redTeamGrid.grid : blueTeamGrid.grid;
  }, [activeView, selectedTeam, blueTeamGrid, redTeamGrid]);

  // Draw the mini-map
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get the active grid
    const grid = getActiveGrid();

    // Calculate minimap dimensions
    const totalGridSize = CHUNK_SIZE * CELLS_PER_CHUNK;
    const cellSize = miniMapSize / totalGridSize;

    // Draw background with team-specific colors
    const bgColor = selectedTeam === 'blue' ?
      (activeView === 'defend' ? 'rgb(15, 23, 42)' : 'rgb(20, 29, 47)') :
      (activeView === 'defend' ? 'rgb(30, 15, 15)' : 'rgb(35, 20, 20)');

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, miniMapSize, miniMapSize);

    // Draw grid cells
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const cell = grid[y][x];

        // Skip empty unhit cells for performance
        if (!cell.occupied && !cell.hit) continue;

        const canvasX = x * cellSize;
        const canvasY = y * cellSize;

        // Similar to main grid, use view-specific coloring logic
        if (activeView === 'defend') {
          if (cell.occupied) {
            if (cell.hit) {
              // Hit ship
              ctx.fillStyle = 'rgba(200, 50, 50, 0.8)';
            } else {
              // Unhit ship
              ctx.fillStyle = selectedTeam === 'blue' ?
                'rgba(70, 130, 180, 0.6)' : 'rgba(180, 70, 70, 0.6)';
            }
          } else if (cell.hit) {
            // Miss
            ctx.fillStyle = 'rgba(30, 100, 180, 0.5)';
          }
        } else { // attack view
          if (cell.hit) {
            if (cell.occupied) {
              // Hit enemy ship
              ctx.fillStyle = 'rgba(200, 50, 50, 0.8)';
            } else {
              // Miss
              ctx.fillStyle = 'rgba(30, 100, 180, 0.5)';
            }
          }
        }

        // Draw the cell
        ctx.fillRect(canvasX, canvasY, Math.max(1, cellSize), Math.max(1, cellSize));
      }
    }

    // Draw chunk grid lines (very subtle)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 0.5;

    for (let i = 0; i <= CHUNK_SIZE; i++) {
      const pos = i * CELLS_PER_CHUNK * cellSize;

      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, miniMapSize);
      ctx.stroke();

      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(miniMapSize, pos);
      ctx.stroke();
    }

    // Calculate viewport rectangle
    const canvasElement = document.querySelector('canvas');
    if (!canvasElement) return;

    const mainCanvasWidth = canvasElement.width;
    const mainCanvasHeight = canvasElement.height;

    // Calculate main grid dimensions
    const baseCellSize = 2.5;
    const mainCellSize = baseCellSize * cellSizeMultiplier;
    const mainGridWidth = totalGridSize * mainCellSize;
    const mainGridHeight = totalGridSize * mainCellSize;

    // Calculate viewport rectangle in minimap coordinates
    const viewportRectWidth = (mainCanvasWidth / mainGridWidth) * miniMapSize;
    const viewportRectHeight = (mainCanvasHeight / mainGridHeight) * miniMapSize;

    const viewportRectX = (viewportPosition.x / mainGridWidth) * miniMapSize;
    const viewportRectY = (viewportPosition.y / mainGridHeight) * miniMapSize;

    // Draw viewport rectangle
    ctx.strokeStyle = selectedTeam === 'blue' ? 'rgba(59, 130, 246, 0.9)' : 'rgba(239, 68, 68, 0.9)';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      viewportRectX,
      viewportRectY,
      Math.min(viewportRectWidth, miniMapSize - viewportRectX),
      Math.min(viewportRectHeight, miniMapSize - viewportRectY)
    );

    // Add a semi-transparent fill to the viewport rectangle
    ctx.fillStyle = selectedTeam === 'blue' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)';
    ctx.fillRect(
      viewportRectX,
      viewportRectY,
      Math.min(viewportRectWidth, miniMapSize - viewportRectX),
      Math.min(viewportRectHeight, miniMapSize - viewportRectY)
    );

    // Add a label for orientation
    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.textAlign = 'start';
    ctx.fillText(activeView === 'defend' ? 'DEFEND' : 'ATTACK', 5, 12);
  }, [
    getActiveGrid,
    selectedTeam,
    activeView,
    viewportPosition,
    cellSizeMultiplier
  ]);

  // Convert minimap coordinates to main grid viewport position
  const miniMapCoordsToViewport = (x: number, y: number) => {
    const totalGridSize = CHUNK_SIZE * CELLS_PER_CHUNK;
    const baseCellSize = 2.5;
    const mainCellSize = baseCellSize * cellSizeMultiplier;
    const mainGridWidth = totalGridSize * mainCellSize;
    const mainGridHeight = totalGridSize * mainCellSize;

    // Calculate the position ratio
    const ratioX = x / miniMapSize;
    const ratioY = y / miniMapSize;

    // Calculate the main grid position
    const canvasElement = document.querySelector('canvas');
    if (!canvasElement) return { x: 0, y: 0 };

    const mainCanvasWidth = canvasElement.width;
    const mainCanvasHeight = canvasElement.height;

    // Convert ratio to viewport position
    const viewportX = ratioX * (mainGridWidth - mainCanvasWidth);
    const viewportY = ratioY * (mainGridHeight - mainCanvasHeight);

    return {
      x: Math.max(0, Math.min(viewportX, mainGridWidth - mainCanvasWidth)),
      y: Math.max(0, Math.min(viewportY, mainGridHeight - mainCanvasHeight))
    };
  };

  // Handle events for navigation
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDragging(true);
    setDragStart({ x, y });

    // Initial click also navigates
    const newPosition = miniMapCoordsToViewport(x, y);
    setViewportPosition(newPosition);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStart) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Update viewport position based on drag
    const newPosition = miniMapCoordsToViewport(x, y);
    setViewportPosition(newPosition);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  return (
    <div className="mt-4">
      <h3 className="text-sm text-gray-400 mb-2">Mini-Map Navigator</h3>
      <div className="bg-gray-800 rounded-md p-2 flex justify-center">
        <canvas
          ref={canvasRef}
          width={miniMapSize}
          height={miniMapSize}
          className="cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />
      </div>
      <div className="mt-1 text-xs text-gray-500 text-center">
        Click or drag to navigate
      </div>
    </div>
  );
};

export default MiniMap;
