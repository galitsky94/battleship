import { useState, useEffect, useRef, useCallback } from 'react';
import { useBattle } from '../contexts/BattleContext';
import { useTeamSelection } from '../contexts/TeamSelectionContext';
import { CELLS_PER_CHUNK, CHUNK_SIZE, getChunkFromCoords, DESTROYED_TERRITORY_COOLDOWN } from '../utils/grid';
import type { CellState } from '../types';

interface GridProps {
  onCellClick: (x: number, y: number) => void;
}

const GRID_SIZE = CHUNK_SIZE * CELLS_PER_CHUNK;

const Grid: React.FC<GridProps> = ({ onCellClick }) => {
  const {
    grid,
    chunks,
    viewportPosition,
    setViewportPosition,
    selectedShipSize,
    isHorizontal,
    showHeatMap,
    isZoomedIn,
    zoomedChunk,
    zoomToChunk,
    returnToOverview,
    cellSizeMultiplier
  } = useBattle();

  const { selectedTeam, activeView } = useTeamSelection();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredCell, setHoveredCell] = useState<{ x: number, y: number } | null>(null);
  const [hoveredChunk, setHoveredChunk] = useState<{ x: number, y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null);

  // Constants - base cell size that gets multiplied by cellSizeMultiplier for zoom
  const baseCellSize = 2.5;
  const cellSize = baseCellSize * cellSizeMultiplier;
  const chunkSize = CELLS_PER_CHUNK * cellSize;

  // Total grid size in pixels
  const totalGridWidth = CHUNK_SIZE * CELLS_PER_CHUNK * cellSize;
  const totalGridHeight = CHUNK_SIZE * CELLS_PER_CHUNK * cellSize;

  // Get color for heat map based on heat level (more intense colors)
  const getHeatMapColor = useCallback((heatLevel: number): string => {
    switch (heatLevel) {
      case 3: // Hot - top level activity chunks (red)
        return 'rgba(255, 40, 40, 0.15)'; // Increased opacity from 0.10 to 0.15
      case 2: // Warm - medium activity chunks (yellow/orange)
        return 'rgba(255, 180, 20, 0.15)'; // Increased opacity from 0.10 to 0.15
      case 1: // Cool - low activity chunks (blue)
        return 'rgba(40, 120, 255, 0.12)'; // Increased opacity from 0.10 to 0.12
      default: // Not active
        return 'rgba(0, 0, 0, 0)'; // Transparent
    }
  }, []);

  // Calculate cooldown effect color based on time remaining
  const getCooldownColor = useCallback((cooldownUntil: number | undefined): string => {
    if (!cooldownUntil) return 'rgba(0, 0, 0, 0)'; // No cooldown

    const now = Date.now();
    if (cooldownUntil <= now) return 'rgba(0, 0, 0, 0)'; // Cooldown expired

    // Calculate how much time is left in the cooldown
    const totalDuration = DESTROYED_TERRITORY_COOLDOWN;
    const remainingTime = cooldownUntil - now;
    const progress = remainingTime / totalDuration;

    // Fade from strong red to transparent as cooldown progresses
    const opacity = Math.max(0, Math.min(0.6, progress * 0.6));
    return `rgba(255, 0, 0, ${opacity.toFixed(2)})`;
  }, []);

  // Define cell colors with different visuals for attack and defend views
  const getCellColor = useCallback((cell: CellState) => {
    // DEFEND view - showing your own ships
    if (activeView === 'defend') {
      if (cell.occupied) {
        // Ship is hit - show as damaged
        if (cell.hit) {
          return 'rgb(180, 30, 30)'; // Red for hit ships
        }
        // Ship is not hit - show as active ship
        return selectedTeam === 'blue' ? 'rgb(50, 93, 136)' : 'rgb(136, 50, 50)'; // Team-colored ships
      }
      // Empty cell that's been hit - show as miss
      if (cell.hit) {
        return 'rgb(30, 70, 180)'; // Blue for misses on your grid
      }
      // Empty cell, not hit - neutral background
      return 'rgb(30, 35, 50)'; // Dark neutral background
    }

    // ATTACK view - showing enemy territory
    if (cell.occupied && cell.hit) {
      // Enemy ship that you've hit
      return 'rgb(200, 50, 50)'; // Brighter red for confirmed hits
    }
    if (cell.hit && !cell.occupied) {
      // Shot that missed enemy ships
      return 'rgb(30, 100, 180)'; // Blue for misses
    }
    // Unknown territory (including unhit enemy ships which should be hidden)
    return 'rgb(40, 45, 60)'; // Slightly different shade for attack grid
  }, [activeView, selectedTeam]);

  // Draw the grid
  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fill the entire canvas with the background color based on view
    if (activeView === 'defend') {
      // Darker blue background for defend view
      ctx.fillStyle = selectedTeam === 'blue' ? 'rgb(15, 23, 42)' : 'rgb(30, 15, 15)';
    } else {
      // Slightly different background for attack view
      ctx.fillStyle = selectedTeam === 'blue' ? 'rgb(20, 29, 47)' : 'rgb(35, 20, 20)';
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid pattern across the entire canvas
    ctx.strokeStyle = selectedTeam === 'blue' ? 'rgba(100, 120, 200, 0.2)' : 'rgba(200, 100, 100, 0.2)';
    ctx.lineWidth = 0.5;

    // Draw vertical grid lines across the entire canvas
    const gridSpacing = 10; // Adjust for desired grid density
    for (let x = 0; x < canvas.width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Draw horizontal grid lines across the entire canvas
    for (let y = 0; y < canvas.height; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Calculate the grid position on the canvas
    const gridStartX = Math.max(0, -viewportPosition.x);
    const gridStartY = Math.max(0, -viewportPosition.y);
    const gridEndX = Math.min(canvas.width, totalGridWidth - viewportPosition.x);
    const gridEndY = Math.min(canvas.height, totalGridHeight - viewportPosition.y);

    // Draw cells in the viewport
    const startX = Math.max(0, Math.floor(viewportPosition.x / cellSize));
    const startY = Math.max(0, Math.floor(viewportPosition.y / cellSize));
    const endX = Math.min(CHUNK_SIZE * CELLS_PER_CHUNK, startX + Math.ceil(canvas.width / cellSize) + 1);
    const endY = Math.min(CHUNK_SIZE * CELLS_PER_CHUNK, startY + Math.ceil(canvas.height / cellSize) + 1);

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        if (y >= grid.length || x >= grid[y].length) continue;

        const cell = grid[y][x];
        const canvasX = x * cellSize - viewportPosition.x;
        const canvasY = y * cellSize - viewportPosition.y;

        // Draw cell with view-specific colors
        ctx.fillStyle = getCellColor(cell);
        ctx.fillRect(canvasX, canvasY, cellSize, cellSize);

        // Draw cell border
        ctx.strokeStyle = selectedTeam === 'blue' ?
          'rgba(100, 100, 150, 0.25)' : 'rgba(150, 100, 100, 0.25)';
        ctx.lineWidth = 0.1;
        ctx.strokeRect(canvasX, canvasY, cellSize, cellSize);

        // Draw cooldown overlay if cell is in cooldown
        if (cell.cooldownUntil) {
          ctx.fillStyle = getCooldownColor(cell.cooldownUntil);
          ctx.fillRect(canvasX, canvasY, cellSize, cellSize);
        }

        // Draw improved ship and hit markers
        if (cell.hit) {
          // Cell has been hit - draw appropriate markers
          if (cell.occupied) {
            // Hit ship - draw a more visible explosion/damage mark
            const centerX = canvasX + cellSize / 2;
            const centerY = canvasY + cellSize / 2;
            const radius = cellSize * 0.35; // Increased radius from 0.3 to 0.35

            // Draw explosion with brighter color
            ctx.fillStyle = 'rgba(255, 120, 50, 0.7)'; // Brighter orange with higher opacity (0.6 to 0.7)
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();

            // Add red cross with thicker lines
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'; // Higher opacity (0.8 to 0.9)
            ctx.lineWidth = cellSize * 0.12; // Thicker lines (0.1 to 0.12)
            ctx.beginPath();
            ctx.moveTo(canvasX + cellSize * 0.25, canvasY + cellSize * 0.25);
            ctx.lineTo(canvasX + cellSize * 0.75, canvasY + cellSize * 0.75);
            ctx.moveTo(canvasX + cellSize * 0.75, canvasY + cellSize * 0.25);
            ctx.lineTo(canvasX + cellSize * 0.25, canvasY + cellSize * 0.75);
            ctx.stroke();
          } else {
            // Missed shot - draw water splash
            const centerX = canvasX + cellSize / 2;
            const centerY = canvasY + cellSize / 2;

            // Draw miss marker (circle)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = cellSize * 0.1;
            ctx.beginPath();
            ctx.arc(centerX, centerY, cellSize * 0.25, 0, Math.PI * 2);
            ctx.stroke();

            // Draw ripple
            ctx.strokeStyle = 'rgba(100, 180, 255, 0.5)';
            ctx.lineWidth = cellSize * 0.05;
            ctx.beginPath();
            ctx.arc(centerX, centerY, cellSize * 0.4, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
        // Draw ship shapes in DEFEND view only, if not hit
        else if (cell.occupied && activeView === 'defend') {
          // Draw ship indicator (simple rectangle with detail)
          const padding = cellSize * 0.1;
          ctx.fillStyle = selectedTeam === 'blue' ?
            'rgba(120, 180, 240, 0.6)' : 'rgba(240, 120, 120, 0.6)';
          ctx.fillRect(
            canvasX + padding,
            canvasY + padding,
            cellSize - padding * 2,
            cellSize - padding * 2
          );

          // Add detail to ship
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(canvasX + padding * 2, canvasY + cellSize / 2);
          ctx.lineTo(canvasX + cellSize - padding * 2, canvasY + cellSize / 2);
          ctx.stroke();
        }
      }
    }

    // Only draw chunk boundaries when not zoomed in
    if (!isZoomedIn) {
      ctx.strokeStyle = selectedTeam === 'blue' ?
        'rgba(80, 100, 170, 0.5)' : 'rgba(170, 80, 80, 0.5)';
      ctx.lineWidth = 0.75; // Thinner line for subtlety

      // Draw vertical chunk lines
      for (let i = 0; i <= CHUNK_SIZE; i++) {
        const x = (i * CELLS_PER_CHUNK * cellSize) - viewportPosition.x;
        if (x >= 0 && x <= totalGridWidth - viewportPosition.x) {
          const drawStartY = Math.max(0, -viewportPosition.y);
          const drawEndY = Math.min(canvas.height, totalGridHeight - viewportPosition.y);

          ctx.beginPath();
          ctx.moveTo(x, drawStartY);
          ctx.lineTo(x, drawEndY);
          ctx.stroke();
        }
      }

      // Draw horizontal chunk lines
      for (let i = 0; i <= CHUNK_SIZE; i++) {
        const y = (i * CELLS_PER_CHUNK * cellSize) - viewportPosition.y;
        if (y >= 0 && y <= totalGridHeight - viewportPosition.y) {
          const drawStartX = Math.max(0, -viewportPosition.x);
          const drawEndX = Math.min(canvas.width, totalGridWidth - viewportPosition.x);

          ctx.beginPath();
          ctx.moveTo(drawStartX, y);
          ctx.lineTo(drawEndX, y);
          ctx.stroke();
        }
      }
    }

    // Draw heat map overlays with more visible colors and clear chunk boundaries
    if (showHeatMap) {
      ctx.globalAlpha = 1.0; // Reset alpha to ensure proper rendering

      for (const chunk of chunks) {
        if (chunk.heatLevel >= 1) {
          // Calculate chunk position
          const chunkX = chunk.x * CELLS_PER_CHUNK;
          const chunkY = chunk.y * CELLS_PER_CHUNK;

          // Convert to canvas coordinates
          const canvasX = chunkX * cellSize - viewportPosition.x;
          const canvasY = chunkY * cellSize - viewportPosition.y;
          const chunkPixelSize = CELLS_PER_CHUNK * cellSize;

          // Skip chunks outside viewport
          if (canvasX + chunkPixelSize < 0 || canvasX > canvas.width ||
              canvasY + chunkPixelSize < 0 || canvasY > canvas.height) {
            continue;
          }

          // Use exact pixel positions
          const drawX = Math.floor(canvasX);
          const drawY = Math.floor(canvasY);
          const drawSize = Math.ceil(chunkPixelSize);

          // Use clipping path to ensure clean chunk boundaries
          ctx.save();
          ctx.beginPath();
          ctx.rect(drawX, drawY, drawSize, drawSize);
          ctx.clip();

          // Fill the chunk with heat color
          ctx.fillStyle = getHeatMapColor(chunk.heatLevel);
          ctx.fillRect(drawX, drawY, drawSize, drawSize);

          // Add a subtle pulsing effect for hot chunks
          if (chunk.heatLevel === 3) {
            // Create a gradient for hottest chunks
            const pulseIntensity = 0.5 + 0.5 * Math.sin(Date.now() / 300); // Subtle pulse based on time
            const gradient = ctx.createRadialGradient(
              drawX + drawSize/2, drawY + drawSize/2, 0,
              drawX + drawSize/2, drawY + drawSize/2, drawSize/2
            );
            gradient.addColorStop(0, `rgba(255, 80, 50, ${0.05 * pulseIntensity})`);
            gradient.addColorStop(1, 'rgba(255, 80, 50, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(drawX, drawY, drawSize, drawSize);
          }

          // Restore context after clipping
          ctx.restore();

          // Draw a more visible border to make chunk boundaries clearer
          ctx.strokeStyle = chunk.heatLevel === 3
            ? 'rgba(200, 180, 220, 0.35)'  // More visible for hot chunks
            : 'rgba(180, 180, 220, 0.3)';  // Slightly more visible for other active chunks
          ctx.lineWidth = chunk.heatLevel === 3 ? 0.85 : 0.75; // Thicker for hot chunks
          ctx.strokeRect(drawX, drawY, drawSize, drawSize);
        }
      }
    }

    // If not zoomed in, draw hover effect for chunks
    if (!isZoomedIn && hoveredChunk) {
      const chunkX = hoveredChunk.x * CELLS_PER_CHUNK * cellSize - viewportPosition.x;
      const chunkY = hoveredChunk.y * CELLS_PER_CHUNK * cellSize - viewportPosition.y;
      const chunkWidth = CELLS_PER_CHUNK * cellSize;
      const chunkHeight = CELLS_PER_CHUNK * cellSize;

      // Draw a subtle highlight effect for the hovered chunk
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(chunkX, chunkY, chunkWidth, chunkHeight);
    }

    // Restore ship placement hover effect (canvas fallback, but now handled by overlay)
    if (hoveredCell && !isDragging && activeView === 'defend') {
      // No-op: now handled by drawShipPreview overlay
    }

    // Draw grid boundary with a neutral color
    ctx.strokeStyle = 'rgba(150, 150, 170, 0.4)';
    ctx.lineWidth = 1;

    // Calculate grid edges
    const gridRightEdge = Math.min(canvas.width, totalGridWidth - viewportPosition.x);
    const gridBottomEdge = Math.min(canvas.height, totalGridHeight - viewportPosition.y);
    const gridLeftEdge = Math.max(0, -viewportPosition.x);
    const gridTopEdge = Math.max(0, -viewportPosition.y);

    // Draw the complete grid border to make boundaries clear
    ctx.beginPath();
    ctx.rect(gridLeftEdge, gridTopEdge, gridRightEdge - gridLeftEdge, gridBottomEdge - gridTopEdge);
    ctx.stroke();
  }, [
    grid,
    chunks,
    hoveredCell,
    hoveredChunk,
    viewportPosition,
    showHeatMap,
    totalGridWidth,
    totalGridHeight,
    getHeatMapColor,
    getCellColor,
    isDragging,
    isZoomedIn,
    cellSize,
    selectedTeam,
    activeView,
    getCooldownColor,
  ]);

  // Draw the ship preview for placement in defend view
  const drawShipPreview = useCallback(() => {
    if (activeView !== 'defend' || !hoveredCell || isDragging) return null;

    const { x, y } = hoveredCell;
    const shipCells = [];

    // Calculate all cells the ship would occupy
    for (let i = 0; i < selectedShipSize; i++) {
      shipCells.push({
        x: isHorizontal ? x + i : x,
        y: isHorizontal ? y : y + i
      });
    }

    // Check if the placement is valid
    const isValid = shipCells.every(cell => {
      // Make sure cell is within grid bounds
      if (cell.x < 0 || cell.x >= GRID_SIZE || cell.y < 0 || cell.y >= GRID_SIZE) {
        return false;
      }

      const cellData = grid[cell.y][cell.x];

      // Check if cell is not occupied
      if (cellData.occupied) {
        return false;
      }

      // Check if cell is not in cooldown
      if (cellData.cooldownUntil && cellData.cooldownUntil > Date.now()) {
        return false;
      }

      return true;
    });

    // Return the preview cells with valid/invalid styling
    return (
      <div className="absolute pointer-events-none">
        {shipCells.map((cell) => {
          // Skip cells outside grid boundaries
          if (cell.x < 0 || cell.x >= GRID_SIZE || cell.y < 0 || cell.y >= GRID_SIZE) {
            return null;
          }

          const canvasX = cell.x * cellSize - viewportPosition.x;
          const canvasY = cell.y * cellSize - viewportPosition.y;

          // Skip cells not visible in viewport
          if (canvasX + cellSize < 0 || canvasX > window.innerWidth ||
              canvasY + cellSize < 0 || canvasY > window.innerHeight) {
            return null;
          }

          // Show if cell is in cooldown or occupied
          let isOccupied = false;
          let inCooldown = false;

          if (grid[cell.y] && grid[cell.y][cell.x]) {
            const cellData = grid[cell.y][cell.x];
            isOccupied = !!cellData.occupied;
            inCooldown = !!cellData.cooldownUntil && cellData.cooldownUntil > Date.now();
          }

          // Use a more stable key than index
          const cellKey = `preview-${cell.x}-${cell.y}`;

          return (
            <div
              key={cellKey}
              className={`absolute ${
                isOccupied || inCooldown
                  ? 'bg-red-500 bg-opacity-50'
                  : isValid
                    ? 'bg-green-500 bg-opacity-50'
                    : 'bg-yellow-500 bg-opacity-50'
              } border border-white border-opacity-40`}
              style={{
                left: `${canvasX}px`,
                top: `${canvasY}px`,
                width: `${cellSize}px`,
                height: `${cellSize}px`,
              }}
            />
          );
        })}
      </div>
    );
  }, [
    activeView,
    hoveredCell,
    isDragging,
    selectedShipSize,
    isHorizontal,
    grid,
    cellSize,
    viewportPosition
  ]);

  // Set initial view to show multiple chunks - more zoomed out
  useEffect(() => {
    // Starting view showing many chunks (approximately 4x4 chunks visible)
    setViewportPosition({ x: 50, y: 50 });
  }, [setViewportPosition]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    // Handle resize
    const resizeHandler = () => {
      if (canvas) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        drawGrid();
      }
    };

    window.addEventListener('resize', resizeHandler);
    drawGrid();

    return () => window.removeEventListener('resize', resizeHandler);
  }, [drawGrid]);

  useEffect(() => {
    drawGrid();
  }, [drawGrid]);

  // Redraw grid every 100ms if any cell is in cooldown (to animate fading)
  useEffect(() => {
    // Check if any visible cell is in cooldown
    let hasCooldown = false;
    const now = Date.now();
    const startX = Math.max(0, Math.floor(viewportPosition.x / cellSize));
    const startY = Math.max(0, Math.floor(viewportPosition.y / cellSize));
    const canvas = canvasRef.current;
    const width = canvas?.width || 0;
    const height = canvas?.height || 0;
    const endX = Math.min(CHUNK_SIZE * CELLS_PER_CHUNK, startX + Math.ceil(width / cellSize) + 1);
    const endY = Math.min(CHUNK_SIZE * CELLS_PER_CHUNK, startY + Math.ceil(height / cellSize) + 1);

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        if (y >= grid.length || x >= grid[y].length) continue;
        const cell = grid[y][x];
        if (cell.cooldownUntil && cell.cooldownUntil > now) {
          hasCooldown = true;
          break;
        }
      }
      if (hasCooldown) break;
    }

    if (!hasCooldown) return;

    const interval = setInterval(() => {
      drawGrid();
    }, 100);

    return () => clearInterval(interval);
  }, [grid, viewportPosition, cellSize, drawGrid]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Set appropriate cursor based on interaction mode
    if (!isZoomedIn && !isDragging) {
      // Calculate chunk coordinates for hover effect
      const chunkX = Math.floor((mouseX + viewportPosition.x) / (CELLS_PER_CHUNK * cellSize));
      const chunkY = Math.floor((mouseY + viewportPosition.y) / (CELLS_PER_CHUNK * cellSize));

      if (chunkX >= 0 && chunkX < CHUNK_SIZE && chunkY >= 0 && chunkY < CHUNK_SIZE) {
        setHoveredChunk({ x: chunkX, y: chunkY });
        canvas.style.cursor = 'pointer'; // Change cursor to indicate clickable
      } else {
        setHoveredChunk(null);
        canvas.style.cursor = 'move'; // Default cursor
      }
    } else {
      // Default to move cursor when zoomed in or dragging
      canvas.style.cursor = 'move';
    }

    // Handle dragging (panning)
    if (isDragging && dragStart) {
      const deltaX = mouseX - dragStart.x;
      const deltaY = mouseY - dragStart.y;

      setViewportPosition(prev => {
        // Calculate the new position
        let newX = Math.max(0, prev.x - deltaX);
        let newY = Math.max(0, prev.y - deltaY);

        // Limit scrolling to prevent showing empty space on the right/bottom
        const canvas = canvasRef.current;
        if (canvas) {
          const maxX = Math.max(0, totalGridWidth - canvas.width);
          const maxY = Math.max(0, totalGridHeight - canvas.height);

          newX = Math.min(newX, maxX);
          newY = Math.min(newY, maxY);
        }

        return { x: newX, y: newY };
      });

      setDragStart({ x: mouseX, y: mouseY });
      return;
    }

    // Convert mouse position to cell coordinates
    const cellX = Math.floor((mouseX + viewportPosition.x) / cellSize);
    const cellY = Math.floor((mouseY + viewportPosition.y) / cellSize);

    // Make sure the cells are within the grid
    if (cellX >= 0 && cellX < CHUNK_SIZE * CELLS_PER_CHUNK &&
        cellY >= 0 && cellY < CHUNK_SIZE * CELLS_PER_CHUNK) {
      setHoveredCell({ x: cellX, y: cellY });
    } else {
      setHoveredCell(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) { // Left click
      setIsDragging(true);

      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setDragStart({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) { // Left click
      // If wasn't dragging much, treat as a click
      if (isDragging && dragStart) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const endX = e.clientX - rect.left;
          const endY = e.clientY - rect.top;
          const dx = Math.abs(endX - dragStart.x);
          const dy = Math.abs(endY - dragStart.y);

          // If movement was minimal, consider it a click
          if (dx < 5 && dy < 5) {
            // If hovering over a chunk and not zoomed in, zoom to that chunk
            if (hoveredChunk && !isZoomedIn) {
              zoomToChunk(hoveredChunk);
            }
            // Otherwise, handle as cell click based on active view
            else if (hoveredCell) {
              onCellClick(hoveredCell.x, hoveredCell.y);
            }
          }
        }
      }

      setIsDragging(false);
      setDragStart(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredCell(null);
    setHoveredChunk(null);
    setIsDragging(false);
    setDragStart(null);
  };

  // Handle wheel events for touchpad scrolling
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    // Prevent default to avoid browser scrolling behavior
    e.preventDefault();

    // Adjust sensitivity based on deltaMode
    const sensitivity = 1.0; // Base sensitivity factor

    // Get the scroll deltas and apply sensitivity
    let deltaX = e.deltaX * sensitivity;
    let deltaY = e.deltaY * sensitivity;

    // Apply different sensitivity for horizontal vs. vertical scrolling for touchpads
    if (Math.abs(deltaX) < Math.abs(deltaY) * 0.5) {
      // Primarily vertical scrolling - adjust horizontal sensitivity
      deltaX *= 0.5;
    } else if (Math.abs(deltaY) < Math.abs(deltaX) * 0.5) {
      // Primarily horizontal scrolling - adjust vertical sensitivity
      deltaY *= 0.5;
    }

    // Limit maximum scroll speed per event
    const maxDelta = 30;
    deltaX = Math.sign(deltaX) * Math.min(Math.abs(deltaX), maxDelta);
    deltaY = Math.sign(deltaY) * Math.min(Math.abs(deltaY), maxDelta);

    // Calculate new viewport position with boundary limits
    setViewportPosition(prev => {
      // Calculate new position
      let newX = Math.max(0, prev.x + deltaX);
      let newY = Math.max(0, prev.y + deltaY);

      // Limit scrolling to prevent showing empty space
      const canvas = canvasRef.current;
      if (canvas) {
        const maxX = Math.max(0, totalGridWidth - canvas.width);
        const maxY = Math.max(0, totalGridHeight - canvas.height);

        newX = Math.min(newX, maxX);
        newY = Math.min(newY, maxY);
      }

      return { x: newX, y: newY };
    });
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-move"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
      />

      {/* Ship placement preview overlay */}
      {drawShipPreview()}

      {/* Return to Overview Button - only visible when zoomed in */}
      {isZoomedIn && (
        <button
          className="absolute bottom-4 right-4 bg-gray-800 bg-opacity-80 text-white px-3 py-1.5 rounded-md shadow-lg hover:bg-opacity-100 transition-colors"
          onClick={returnToOverview}
        >
          Return to Overview
        </button>
      )}
    </div>
  );
};

export default Grid;
