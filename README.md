# Battleship Infinity

A massive multiplayer battleship game with a team-based dual-grid system and real-time battle simulation.

## Overview

Battleship Infinity is a large-scale, team-based battleship game featuring a persistent, shared grid and advanced gameplay mechanics. Players join either the Red or Blue team and compete for control over a massive grid, with real-time updates, strategic ship placement, and dynamic battle simulation.

## Live Demo

Try the latest version here: [https://same-2ufcpbmzmz4-latest.netlify.app](https://same-2ufcpbmzmz4-latest.netlify.app)

## Features

### Team-Based Dual Grid
- Two teams: Red and Blue, each with their own independent grid
- Persistent team selection using localStorage
- Compete for territory and dominance in real time

### Massive Grid System
- 1000x1000 cell grid, divided into 10x10 chunks (each chunk is 100x100 cells)
- Chunk-based rendering for high performance, even on large grids
- Subtle chunk boundaries for visual clarity
- Cell-based interaction for ship placement and firing

### Gameplay Mechanics
- Place ships of various sizes, horizontally or vertically, for your team
- Fire shots at any location on the grid
- Real-time heat map highlights active battle zones
- Destroyed territory cooldown: recently destroyed ship areas are temporarily blocked for new ship placement
- Ships cannot be placed in areas under cooldown, adding a strategic layer
- Separate defend (ship placement) and attack (firing) modes with tab-based switching

### Battle Simulation
- Automated, configurable simulation of battle activity across the grid
- Three intensity levels: Low, Medium, High
- Adjustable frequency and number of simulated actions
- Visual indicators show simulation status and activity

### Navigation & Visualization
- Mini-map for fast navigation across the massive grid
- Drag to pan and explore the grid
- Zoomed-out view to see multiple chunks at once
- Visual indicators for grid and chunk boundaries

### Console
- Enhanced console with real-time visual statistics
- Track team progress, battle status, and grid control
- Live updates on ship counts, shots fired, and territory held

### Technical Implementation
- Built with React and TypeScript
- Canvas rendering for efficient, high-performance display
- Context API for global state management
- Tailwind CSS for modern, responsive UI components

## Getting Started

```bash
# Clone the repository
git clone https://github.com/yourusername/battleship-infinity.git

# Navigate to project directory
cd battleship-infinity

# Install dependencies
bun install

# Start development server
bun run dev
```

## Building for Production

```bash
# Build for production
bun run build

# Preview the production build
bun run preview
```

## Version History

- **v65**: Ultra-Intense Battle Simulation with extreme activity frequency, vibrant visual effects, and dynamic battle zones.
- **v64**: Enhanced Battle Simulation with more intense activity, visual effects, and pulsing hot zones.
- **v63**: UI Improvement - Removed Simulation Stats display for cleaner interface.
- **v62**: UI Refinement - Removed Game Mode Display from Controls component for cleaner interface.
- **v61**: UI Enhancement - Removed Navigation Instructions for cleaner interface.
- **v60**: UI Cleanup - removed battle status indicators and instructional text for cleaner interface.
- **v59**: Added separate defend (ship placement) and attack (firing) functionality with visual feedback for ship placement and improved user interface.
- **v58**: Added cooldown system for destroyed ship territories. Ships cannot be placed in areas where ships were recently destroyed.
- **v57**: Enhanced console with real-time visual statistics.
- **v56**: Added mini-map navigation for the massive grid.
- **v55**: Team selection with persistence via localStorage.
- **v54**: Dual-grid system for Red vs Blue teams.
- **v10**: More subtle grid boundaries without coordinate digits.
- **v9**: Battle simulation across the entire grid.
- **v8**: Grid boundary improvements with console integration.
- **v7**: More visible chunk boundaries.
- **v6**: Zoomed out view showing multiple chunks.
- **v5**: Improved grid with visible chunk boundaries.
- **v4**: Removed simulation and fixed grid issues.
- **v3**: Initial implementation with core features.

## License

MIT
