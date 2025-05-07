# Battleship Infinity

A massive multiplayer battleship game with team-based dual-grid system.

## Overview

This project implements a massive shared battleship grid with the following features:
- Dual-grid system with team-based gameplay (Red vs Blue teams)
- Team selection with persistence via localStorage
- Mini-map navigation for the massive grid
- Enhanced console with visual statistics
- Destroyed territory cooldown system
- Chunk-based rendering for performance
- Real-time battle simulation

## Live Demo

The latest version is deployed at: [https://same-2ufcpbmzmz4-latest.netlify.app](https://same-2ufcpbmzmz4-latest.netlify.app)

## Features

### Team-Based Dual Grid
- Two teams: Red and Blue, each with their own grid
- Team selection is persistent via localStorage
- Compete for control of the grid in real time

### Grid System
- Massive 1000x1000 cell grid divided into 10x10 chunks (each chunk is 100x100 cells)
- Chunk-based rendering for efficient performance
- Cell-based interaction for ship placement and firing
- Subtle chunk boundaries for visual organization

### Gameplay
- Place ships of different sizes for your team
- Fire shots at any location on the grid
- Real-time heat map showing active battle areas
- Ships can be placed horizontally or vertically
- Destroyed territory cooldown: Ships cannot be placed in areas where ships were recently destroyed

### Battle Simulation
- Automated simulation of battle activity across the entire grid
- Three intensity levels: Low, Medium, High
- Configurable frequency and number of actions
- Visual indicators of simulation status

### Navigation
- Mini-map for quick navigation across the massive grid
- Drag to pan around the grid
- Zoomed out view to see multiple chunks at once
- Visual indicators for grid boundaries

### Console & Statistics
- Enhanced console with real-time visual statistics
- Track team progress and battle status

## Technical Implementation
- React with TypeScript
- Canvas rendering for efficient display of large grid
- Context API for global state management
- Tailwind CSS for UI components

## Development

### Prerequisites
- Node.js (v14 or higher)
- Bun package manager

### Installation
```bash
# Clone the repository
git clone https://github.com/galitsky94/battleship.git
cd battleship

# Install dependencies
bun install

# Start the development server
bun run dev
```

### Building for Production
```bash
bun run build
```

## Version History

- v58: Added cooldown system for destroyed ship territories. Ships cannot be placed in areas where ships were recently destroyed.
- v57: Enhanced console with real-time visual statistics.
- v56: Added mini-map navigation for the massive grid.
- v55: Team selection with persistence via localStorage.
- v54: Dual-grid system for Red vs Blue teams.
- v10: More subtle grid boundaries without coordinate digits.
- v9: Battle simulation across the entire grid.
- v8: Grid boundary improvements with console integration.
- v7: More visible chunk boundaries.
- v6: Zoomed out view showing multiple chunks.
- v5: Improved grid with visible chunk boundaries.
- v4: Removed simulation and fixed grid issues.
- v3: Initial implementation with core features.

## License
MIT
